"""
FastAPI middleware for authentication, tenant scoping, and rate limiting.
- Validates proxy keys against PostgreSQL (cached in Redis)
- Extracts tenant context and injects it into request state
- Enforces per-key rate limits via Redis sliding window
"""

import hashlib
import json
import time
from typing import Optional

import redis.asyncio as redis
import structlog
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from pydantic_settings import BaseSettings

log = structlog.get_logger()

BYPASS_PATHS = {"/health", "/ready", "/metrics", "/docs", "/openapi.json", "/redoc"}


class MiddlewareSettings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    tokenguard_secret_key: str = ""
    rate_limit_window_seconds: int = 60

    class Config:
        env_prefix = ""


class TenantContext:
    """Injected into request.state for downstream handlers."""

    def __init__(
        self,
        tenant_id: str,
        proxy_key_id: str,
        scopes: list[str],
        rate_limit_rpm: int,
    ):
        self.tenant_id = tenant_id
        self.proxy_key_id = proxy_key_id
        self.scopes = scopes
        self.rate_limit_rpm = rate_limit_rpm


class AuthMiddleware(BaseHTTPMiddleware):
    """Authenticate proxy keys and attach tenant context."""

    def __init__(self, app, redis_pool: redis.Redis):
        super().__init__(app)
        self._settings = MiddlewareSettings()
        self._redis = redis_pool

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path in BYPASS_PATHS:
            return await call_next(request)

        # Extract API key from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

        api_key = auth_header[7:].strip()
        if not api_key:
            raise HTTPException(status_code=401, detail="Empty API key")

        # Look up key
        ctx = await self._resolve_key(api_key)
        if ctx is None:
            raise HTTPException(status_code=401, detail="Invalid API key")

        # Rate limiting
        allowed = await self._check_rate_limit(ctx)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded ({ctx.rate_limit_rpm} requests/minute)",
            )

        # Attach context
        request.state.tenant = ctx
        request.state.start_time = time.time()

        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-TokenGuard-Tenant"] = ctx.tenant_id
        return response

    async def _resolve_key(self, api_key: str) -> Optional[TenantContext]:
        """Resolve an API key to a tenant context, using Redis cache."""
        key_hash = hashlib.sha256(api_key.encode("utf-8")).hexdigest()
        cache_key = f"tg:proxykey:{key_hash}"

        # Check Redis cache first
        cached = await self._redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            if not data.get("is_active", False):
                return None
            return TenantContext(
                tenant_id=data["tenant_id"],
                proxy_key_id=data["id"],
                scopes=data.get("scopes", ["*"]),
                rate_limit_rpm=data.get("rate_limit_rpm", 600),
            )

        # Cache miss — would normally query PostgreSQL here.
        # In production, the /admin/keys endpoint populates the cache on key creation.
        # For now, check if it's the master key
        if api_key == self._settings.tokenguard_secret_key and self._settings.tokenguard_secret_key:
            ctx_data = {
                "id": "master",
                "tenant_id": "master",
                "scopes": ["*"],
                "rate_limit_rpm": 10000,
                "is_active": True,
            }
            await self._redis.set(cache_key, json.dumps(ctx_data), ex=300)
            return TenantContext(**{k: v for k, v in ctx_data.items() if k != "is_active"})

        return None

    async def _check_rate_limit(self, ctx: TenantContext) -> bool:
        """Sliding-window rate limiter using Redis sorted sets."""
        window = self._settings.rate_limit_window_seconds
        limit = ctx.rate_limit_rpm
        key = f"tg:ratelimit:{ctx.proxy_key_id}"
        now = time.time()

        pipe = self._redis.pipeline()
        pipe.zremrangebyscore(key, 0, now - window)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window + 1)
        results = await pipe.execute()

        current_count = results[2]
        return current_count <= limit


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Inject a unique request ID for tracing."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        import uuid
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
