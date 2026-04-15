from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import httpx
import os
import time
import asyncio
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
import hashlib

load_dotenv()

from cache import check_cache, store_in_cache, get_cache_stats, clear_cache
from logger import log_event
from router import model_router, extract_complexity, classify_complexity
from budget import load_budgets, check_budget, record_spend, get_budget_status, reset_budget, BudgetDefinition, BudgetPeriod, BudgetAction
from billing import create_checkout_session, handle_webhook, PLANS, cancel_subscription

app = FastAPI(title="TokenGuard Proxy", version="0.2.0")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_tenant_budgets():
    """Load budgets for all tenants from Postgres. Falls back to default if DB unavailable."""
    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM tenants")
        tenants = cur.fetchall()
        cur.close()
        conn.close()

        for tenant_id, tenant_name in tenants:
            tenant_budget = BudgetDefinition(
                budget_id=f"budget-{tenant_id}",
                tenant_id=str(tenant_id),
                name=f"{tenant_name} Daily Cap",
                period=BudgetPeriod.DAILY,
                limit_usd=0.15,
                alert_thresholds=[50, 80, 95],
                action_on_limit=BudgetAction.BLOCK
            )
            load_budgets(str(tenant_id), [tenant_budget])
            print(f"[Budget] Loaded budget for tenant: {tenant_name}")

    except Exception as e:
        print(f"[Budget] Could not load from Postgres, using default: {e}")

    # Always load a default budget for the master key
    _default_budget = BudgetDefinition(
        budget_id="budget-001",
        tenant_id="client-default",
        name="Daily Cap",
        period=BudgetPeriod.DAILY,
        limit_usd=1.00,
        alert_thresholds=[50, 80, 95],
        action_on_limit=BudgetAction.BLOCK
    )
    load_budgets("client-default", [_default_budget])
    print(f"[Budget] Loaded — daily cap ${_default_budget.limit_usd:.2f} for client-default")


load_tenant_budgets()

def get_litellm_url():
    return os.getenv("LITELLM_URL", "http://localhost:4000")

def get_secret_key():
    return os.getenv("TOKENGUARD_SECRET_KEY", "changeme")


def get_tenant_from_key(api_key: str):
    try:
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute("""
            SELECT t.id, t.name 
            FROM api_keys ak
            JOIN tenants t ON t.id = ak.tenant_id
            WHERE ak.key = %s AND ak.is_active = TRUE
        """, (key_hash,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        return row
    except Exception as e:
        print(f"[Auth] DB lookup failed: {e}")
        return None


def authenticate(request: Request):
    """Authenticate request and return tenant_id"""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    
    api_key = auth.replace("Bearer ", "").strip()
    
    # Try tenant-based auth first (Week 7)
    if api_key.startswith("tg-"):
        tenant = get_tenant_from_key(api_key)
        if tenant:
            tenant_id, tenant_name = tenant
            print(f"[Auth] Authenticated tenant: {tenant_name} (ID: {tenant_id})")
            return str(tenant_id)
        else:
            raise HTTPException(status_code=403, detail="Invalid API key")
    
    # Fall back to legacy auth for dashboard/testing (Weeks 1-6)
    if api_key == get_secret_key():
        return "client-default"
    
    raise HTTPException(status_code=401, detail="Invalid API key")


def get_client_id(request: Request):
    """Helper function to get client_id from authenticated request"""
    return authenticate(request)


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    pricing = {
        "gpt-4o-mini":  (0.00015, 0.0006),
        "gpt-4o":       (0.005,   0.015),
    }
    rates = pricing.get(model, (0.005, 0.015))
    return round((input_tokens / 1000 * rates[0]) + (output_tokens / 1000 * rates[1]), 6)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "0.2.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/cache/stats")
async def cache_stats(request: Request):
    client_id = authenticate(request)
    return JSONResponse(content=get_cache_stats(client_id))


@app.delete("/cache/clear")
async def cache_clear(request: Request):
    client_id = authenticate(request)
    deleted = clear_cache(client_id)
    return JSONResponse(content={"deleted": deleted})


@app.get("/budget/status")
async def budget_status(request: Request):
    client_id = authenticate(request)
    status = get_budget_status(client_id)
    return JSONResponse(content=status)


@app.post("/budget/reset")
async def budget_reset(request: Request):
    client_id = authenticate(request)
    reset_budget(client_id, "budget-001")
    # Also zero out cost_usd in clickhouse/postgres so dashboard bars reset
    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute("""
            UPDATE api_keys SET cost_usd = 0, total_calls = 0, blocked_calls = 0
            WHERE tenant_id = %s::uuid
        """, (client_id,))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[Reset] DB clear failed: {e}")
    return JSONResponse(content={"reset": True, "budget_id": "budget-001"})


@app.post("/budget/reload")
async def budget_reload(request: Request):
    """Reload all tenant budgets from Postgres. Call after creating new tenants."""
    authenticate(request)
    load_tenant_budgets()
    return JSONResponse(content={"reloaded": True})


# ═══════════════════════════════════════════════════════════════════════════
# Provider Key Encryption & Management
# ═══════════════════════════════════════════════════════════════════════════

ENCRYPTION_KEY = os.getenv("TOKENGUARD_SECRET_KEY", "changeme")[:32].ljust(32)

def encrypt_key(raw_key: str) -> str:
    """Encrypt a provider API key using Fernet symmetric encryption."""
    from cryptography.fernet import Fernet
    import base64, hashlib
    key = base64.urlsafe_b64encode(hashlib.sha256(ENCRYPTION_KEY.encode()).digest())
    f = Fernet(key)
    return f.encrypt(raw_key.encode()).decode()

def decrypt_key(encrypted_key: str) -> str:
    """Decrypt a provider API key."""
    from cryptography.fernet import Fernet
    import base64, hashlib
    key = base64.urlsafe_b64encode(hashlib.sha256(ENCRYPTION_KEY.encode()).digest())
    f = Fernet(key)
    return f.decrypt(encrypted_key.encode()).decode()

def get_provider_key(tenant_id: str, provider: str) -> str | None:
    """
    Fetch a tenant's stored provider API key.
    Falls back to TokenGuard's own key if tenant hasn't added theirs yet.
    """
    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute("""
            SELECT encrypted_key FROM provider_keys
            WHERE tenant_id = %s::uuid AND provider = %s AND is_active = TRUE
        """, (tenant_id, provider))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            return decrypt_key(row[0])
    except Exception as e:
        print(f"[ProviderKeys] DB lookup failed: {e}")

    # Fallback to TokenGuard's own keys (for demo / new accounts)
    fallbacks = {
        "openai":    os.getenv("OPENAI_API_KEY", ""),
        "anthropic": os.getenv("ANTHROPIC_API_KEY", ""),
    }
    return fallbacks.get(provider)


async def call_anthropic(body: dict, api_key: str) -> dict:
    import anthropic as anthropic_sdk
    model     = body.get("model", "claude-sonnet-4-6")
    max_tokens = body.get("max_tokens", 1024)
    messages  = body.get("messages", [])

    system_msg   = None
    user_messages = []
    for msg in messages:
        if msg["role"] == "system":
            system_msg = msg["content"]
        else:
            user_messages.append({"role": msg["role"], "content": msg["content"]})

    kwargs = {"model": model, "max_tokens": max_tokens, "messages": user_messages}
    if system_msg:
        kwargs["system"] = system_msg

    client   = anthropic_sdk.AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(**kwargs)
    content  = response.content[0].text if response.content else ""

    return {
        "id":      f"chatcmpl-{response.id}",
        "object":  "chat.completion",
        "created": int(__import__("time").time()),
        "model":   response.model,
        "choices": [{"index": 0, "message": {"role": "assistant", "content": content},
                     "finish_reason": response.stop_reason or "stop", "logprobs": None}],
        "usage":   {"prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens},
        "provider": "anthropic",
    }


@app.post("/v1/chat/completions")
async def proxy_completion(request: Request):
    client_id = authenticate(request)
    body = await request.json()
    start_time = time.time()

    # Apply model routing
    original_model = body.get("model", "unknown")
    routing_decision = model_router.route(
        tenant_id=client_id,
        request_model=original_model,
        request_body=body,
    )
    body["model"] = routing_decision.routed_model
    was_routed = 1 if routing_decision.was_downgraded else 0

    if routing_decision.was_downgraded:
        print(f"[Router] {original_model} → {routing_decision.routed_model} "
              f"({routing_decision.routing_reason}, "
              f"~{routing_decision.estimated_savings_pct}% savings)")

    # Check budget before hitting the API
    budget_result = check_budget(client_id)
    if not budget_result.allowed:
        print(f"[Budget] BLOCKED — {budget_result.message}")
        log_event({
            "client_id":        client_id,
            "agent_id":         request.headers.get("X-Agent-ID", "unknown"),
            "model_requested":  original_model,
            "model_used":       "blocked",
            "cost_usd":         0.0,
            "latency_ms":       0,
            "was_routed":       0,
            "cache_hit":        0,
            "blocked":          1,
        })
        return JSONResponse(
            status_code=429,
            content={
                "error": "BUDGET_CAP_EXCEEDED",
                "message": budget_result.message,
                "spent_usd": budget_result.spent_usd,
                "limit_usd": budget_result.limit_usd,
                "pct_used": budget_result.pct_used,
            }
        )

    cached = check_cache(body, client_id)
    if cached is not None:
        latency_ms = round((time.time() - start_time) * 1000)
        print(f"[{datetime.utcnow().isoformat()}] CACHE HIT - {latency_ms}ms - $0.00")
        log_event({
            "client_id":    client_id,
            "agent_id":     request.headers.get("X-Agent-ID", "unknown"),
            "model_used":   "cache",
            "cost_usd":     0.0,
            "latency_ms":   latency_ms,
            "cache_hit":    1,
        })
        return JSONResponse(
            content=cached,
            headers={
                "X-TokenGuard-Cache": "HIT",
                "X-TokenGuard-Latency": str(latency_ms)
            }
        )

    routed_model = body.get("model", "unknown")
    is_claude    = routed_model.startswith("claude-")
    provider     = "anthropic" if is_claude else "openai"

    # Fetch THIS tenant's provider key (Model B — they pay their own AI bills)
    provider_api_key = get_provider_key(client_id, provider)
    if not provider_api_key:
        return JSONResponse(status_code=402, content={
            "error": "NO_PROVIDER_KEY",
            "message": f"No {provider} API key configured. Add your key in Settings → Provider Keys.",
            "provider": provider,
        })

    try:
        if is_claude:
            result = await call_anthropic(body, api_key=provider_api_key)
        else:
            async with httpx.AsyncClient(timeout=300) as http_client:
                response = await http_client.post(
                    "https://api.openai.com/v1/chat/completions",
                    json=body,
                    headers={
                        "Content-Type":  "application/json",
                        "Authorization": f"Bearer {provider_api_key}",
                    }
                )
            result = response.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Cannot reach AI provider API")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {str(e)}")
    latency_ms = round((time.time() - start_time) * 1000)
    usage = result.get("usage", {})
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)
    model_used = result.get("model", body.get("model", "unknown"))
    cost_usd = calculate_cost(model_used, input_tokens, output_tokens)

    print(f"[{datetime.utcnow().isoformat()}] API CALL")
    print(f"  model    : {model_used}")
    print(f"  tokens   : {input_tokens} in / {output_tokens} out")
    print(f"  cost     : ${cost_usd}")
    print(f"  latency  : {latency_ms}ms")

    log_event({
        "client_id":        client_id,
        "agent_id":         request.headers.get("X-Agent-ID", "unknown"),
        "workflow_id":      request.headers.get("X-Workflow-ID", "unknown"),
        "model_requested":  body.get("model", "unknown"),
        "model_used":       model_used,
        "input_tokens":     input_tokens,
        "output_tokens":    output_tokens,
        "cost_usd":         cost_usd,
        "latency_ms":       latency_ms,
        "was_routed":       was_routed,
        "cache_hit":        0,
        "blocked":          0,
    })

    record_spend(client_id, cost_usd)

    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, store_in_cache, body, result, client_id)

    return JSONResponse(
        content=result,
        headers={
            "X-TokenGuard-Cache": "MISS",
            "X-TokenGuard-Cost": str(cost_usd)
        }
    )


# ── BILLING ENDPOINTS ──────────────────────────────────────────────────

@app.get("/billing/plans")
async def get_plans(request: Request):
    """Return available plans. Public endpoint — no auth required."""
    return JSONResponse(content={
        plan: {
            "name": config["name"],
            "monthly_fee": config["monthly_fee"],
            "seat_limit": config["seat_limit"],
            "spend_limit_usd": config["spend_limit_usd"],
        }
        for plan, config in PLANS.items()
    })


@app.post("/billing/checkout")
async def create_checkout(request: Request):
    """Create a Stripe Checkout session for a plan upgrade."""
    authenticate(request)
    body = await request.json()

    plan = body.get("plan")
    email = body.get("email")
    tenant_name = body.get("tenant_name", "New Client")

    if not plan or not email:
        return JSONResponse(status_code=400, content={"error": "plan and email are required"})

    if plan not in PLANS:
        return JSONResponse(status_code=400, content={"error": f"Invalid plan. Choose from: {list(PLANS.keys())}"})

    client_id = get_client_id(request)

    try:
        checkout_url = create_checkout_session(
            tenant_id=client_id,
            tenant_name=tenant_name,
            plan=plan,
            email=email,
        )
        return JSONResponse(content={"checkout_url": checkout_url, "plan": plan})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/billing/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = handle_webhook(payload, sig_header)
    except ValueError as e:
        print(f"[Billing] Webhook signature failed: {e}")
        return JSONResponse(status_code=400, content={"error": "Invalid signature"})

    event_type = event["type"]
    print(f"[Billing] Webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        tenant_id = session["metadata"].get("tenant_id")
        plan = session["metadata"].get("plan")
        customer_id = session["customer"]
        subscription_id = session["subscription"]

        if tenant_id and plan:
            try:
                import psycopg2
                conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
                cur = conn.cursor()
                seat_limit = PLANS[plan]["seat_limit"]
                cur.execute("""
                    UPDATE tenants
                    SET plan = %s,
                        stripe_customer_id = %s,
                        stripe_subscription_id = %s,
                        subscription_status = 'active',
                        plan_seat_limit = %s
                    WHERE id = %s::uuid
                """, (plan, customer_id, subscription_id, seat_limit, tenant_id))
                conn.commit()
                cur.close()
                conn.close()
                print(f"[Billing] Tenant {tenant_id} upgraded to {plan}")
            except Exception as e:
                print(f"[Billing] Failed to update tenant: {e}")

    elif event_type == "customer.subscription.deleted":
        subscription_id = event["data"]["object"]["id"]
        try:
            import psycopg2
            conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
            cur = conn.cursor()
            cur.execute("""
                UPDATE tenants
                SET subscription_status = 'cancelled', plan = 'free'
                WHERE stripe_subscription_id = %s
            """, (subscription_id,))
            # Deactivate all their API keys
            cur.execute("""
                UPDATE api_keys ak
                SET is_active = FALSE
                FROM tenants t
                WHERE ak.tenant_id = t.id
                AND t.stripe_subscription_id = %s
            """, (subscription_id,))
            conn.commit()
            cur.close()
            conn.close()
            print(f"[Billing] Subscription {subscription_id} cancelled — keys deactivated")
        except Exception as e:
            print(f"[Billing] Failed to cancel subscription: {e}")

    return JSONResponse(content={"received": True})


@app.get("/billing/status")
async def billing_status(request: Request):
    """Return current billing status for the authenticated tenant."""
    authenticate(request)
    client_id = get_client_id(request)

    try:
        import psycopg2
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute("""
            SELECT name, plan, subscription_status, plan_seat_limit,
                   stripe_customer_id, stripe_subscription_id
            FROM tenants WHERE id::text = %s OR name = %s
        """, (client_id, client_id))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return JSONResponse(content={"plan": "free", "status": "no_tenant"})

        name, plan, status, seat_limit, customer_id, subscription_id = row
        plan_config = PLANS.get(plan or "starter", PLANS["starter"])

        return JSONResponse(content={
            "tenant_name": name,
            "plan": plan or "free",
            "subscription_status": status or "inactive",
            "seat_limit": seat_limit or 10,
            "monthly_fee_usd": plan_config["monthly_fee"],
            "spend_limit_usd": plan_config["spend_limit_usd"],
            "has_stripe": bool(customer_id),
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/tenants")
async def create_tenant_api(request: Request):
    authenticate(request)
    body = await request.json()
    name = body.get("name")
    plan = body.get("plan", "starter")

    if not name:
        return JSONResponse(status_code=400, content={"error": "name required"})

    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute("INSERT INTO tenants (name, plan) VALUES (%s, %s) RETURNING id", (name, plan))
        tenant_id = str(cur.fetchone()[0])
        conn.commit()
        cur.close()
        conn.close()
        return JSONResponse(content={"tenant_id": tenant_id, "name": name, "plan": plan})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/tenants/{tenant_id}/users")
async def create_tenant_user(tenant_id: str, request: Request):
    """Create a new user API key for a tenant. Returns raw key once — store it."""
    authenticate(request)
    body = await request.json()
    name = body.get("name", "user")
    role = body.get("role", "")

    import secrets
    api_key = "tg-" + secrets.token_hex(24)
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    label = f"{name} ({role})" if role else name

    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO api_keys (tenant_id, key, label) VALUES (%s::uuid, %s, %s) RETURNING id",
            (tenant_id, key_hash, label)
        )
        key_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return JSONResponse(content={
            "api_key": api_key,        # raw key — shown once only
            "key_id": str(key_id),
            "label": label,
            "tenant_id": tenant_id,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/tenants/{tenant_id}/keys")
async def list_tenant_keys(tenant_id: str, request: Request):
    """List all API keys for a tenant with label, status, created_at."""
    authenticate(request)
    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute("""
            SELECT
                id,
                label,
                is_active,
                created_at,
                LEFT(key, 8) as key_prefix
            FROM api_keys
            WHERE tenant_id = %s::uuid
            ORDER BY created_at DESC
        """, (tenant_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        keys = []
        for row in rows:
            key_id, label, is_active, created_at, key_prefix = row
            keys.append({
                "id": str(key_id),
                "label": label or "Unnamed",
                "is_active": is_active,
                "created_at": created_at.isoformat() if created_at else None,
                "key_preview": f"tg-{key_prefix}...{label[:3].lower() if label else 'key'}",
            })
        return JSONResponse(content={"keys": keys, "total": len(keys)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.delete("/api/tenants/{tenant_id}/keys/{key_id}")
async def revoke_tenant_key(tenant_id: str, key_id: str, request: Request):
    """Revoke (deactivate) a specific API key."""
    authenticate(request)
    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute("""
            UPDATE api_keys
            SET is_active = FALSE
            WHERE id = %s::uuid AND tenant_id = %s::uuid
            RETURNING label
        """, (key_id, tenant_id))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return JSONResponse(status_code=404, content={"error": "Key not found"})
        return JSONResponse(content={"revoked": True, "label": row[0]})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/tenants/{tenant_id}/keys/{key_id}/reactivate")
async def reactivate_tenant_key(tenant_id: str, key_id: str, request: Request):
    """Reactivate a previously revoked API key."""
    authenticate(request)
    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur = conn.cursor()
        cur.execute("""
            UPDATE api_keys
            SET is_active = TRUE
            WHERE id = %s::uuid AND tenant_id = %s::uuid
            RETURNING label
        """, (key_id, tenant_id))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return JSONResponse(status_code=404, content={"error": "Key not found"})
        return JSONResponse(content={"reactivated": True, "label": row[0]})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/tenants/{tenant_id}/provider-keys")
async def save_provider_key(tenant_id: str, request: Request):
    """Save or update a tenant's provider API key (encrypted)."""
    authenticate(request)
    body     = await request.json()
    provider = body.get("provider", "").lower()
    raw_key  = body.get("api_key", "").strip()

    if provider not in ("openai", "anthropic", "google"):
        return JSONResponse(status_code=400, content={"error": "Invalid provider"})
    if not raw_key:
        return JSONResponse(status_code=400, content={"error": "api_key is required"})

    encrypted  = encrypt_key(raw_key)
    preview    = raw_key[:12] + "..." + raw_key[-4:]

    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO provider_keys (tenant_id, provider, encrypted_key, key_preview)
            VALUES (%s::uuid, %s, %s, %s)
            ON CONFLICT (tenant_id, provider)
            DO UPDATE SET encrypted_key = EXCLUDED.encrypted_key,
                          key_preview   = EXCLUDED.key_preview,
                          is_active     = TRUE,
                          updated_at    = now()
            RETURNING id
        """, (tenant_id, provider, encrypted, preview))
        conn.commit()
        cur.close()
        conn.close()
        return JSONResponse(content={"saved": True, "provider": provider, "preview": preview})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/tenants/{tenant_id}/provider-keys")
async def get_provider_keys_list(tenant_id: str, request: Request):
    """List which providers have keys configured (never returns raw keys)."""
    authenticate(request)
    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur  = conn.cursor()
        cur.execute("""
            SELECT provider, key_preview, is_active, updated_at
            FROM provider_keys
            WHERE tenant_id = %s::uuid
            ORDER BY provider
        """, (tenant_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return JSONResponse(content={"keys": [
            {"provider": r[0], "preview": r[1],
             "is_active": r[2], "updated_at": r[3].isoformat() if r[3] else None}
            for r in rows
        ]})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.delete("/api/tenants/{tenant_id}/provider-keys/{provider}")
async def delete_provider_key(tenant_id: str, provider: str, request: Request):
    """Remove a provider key."""
    authenticate(request)
    try:
        conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
        cur  = conn.cursor()
        cur.execute("""
            UPDATE provider_keys SET is_active = FALSE
            WHERE tenant_id = %s::uuid AND provider = %s
        """, (tenant_id, provider))
        conn.commit()
        cur.close()
        conn.close()
        return JSONResponse(content={"removed": True, "provider": provider})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/tenants/{tenant_id}/users")
async def get_user_breakdown(tenant_id: str, request: Request):
    """Per-employee usage breakdown for a tenant."""
    authenticate(request)
    import clickhouse_connect

    ch = clickhouse_connect.get_client(
        host=os.getenv("CLICKHOUSE_HOST"),
        port=int(os.getenv("CLICKHOUSE_PORT", 8443)),
        username=os.getenv("CLICKHOUSE_USER", "default"),
        password=os.getenv("CLICKHOUSE_PASSWORD"),
        secure=True
    )

    result = ch.query("""
        SELECT
            agent_id,
            count() as total_calls,
            sum(cost_usd) as total_cost,
            countIf(cache_hit = 1) as cache_hits,
            countIf(was_routed = 1) as routed_calls,
            countIf(blocked = 1) as blocked_calls,
            avg(latency_ms) as avg_latency_ms
        FROM tokenguard.events
        WHERE client_id = {client_id:String}
        AND created_at >= now() - INTERVAL 30 DAY
        GROUP BY agent_id
        ORDER BY total_cost DESC
    """, parameters={"client_id": tenant_id})

    users = []
    for row in result.result_rows:
        agent_id, calls, cost, cache_hits, routed, blocked, avg_latency = row
        cost_without = cost * 4.2 if routed > 0 else cost
        users.append({
            "employee": agent_id,
            "api_calls": calls,
            "cost_usd": round(float(cost), 6),
            "cache_hits": cache_hits,
            "routed_calls": routed,
            "blocked_calls": blocked,
            "avg_latency_ms": round(float(avg_latency), 0),
            "estimated_cost_without_tokenguard": round(float(cost_without), 6),
            "savings_usd": round(float(cost_without - cost), 6),
            "status": "blocked" if blocked > 0 else "healthy",
        })

    total_cost = sum(u["cost_usd"] for u in users)
    total_savings = sum(u["savings_usd"] for u in users)

    return JSONResponse(content={
        "tenant_id": tenant_id,
        "billing_period": datetime.utcnow().strftime("%Y-%m"),
        "users": users,
        "totals": {
            "total_cost_usd": round(total_cost, 6),
            "total_savings_usd": round(total_savings, 6),
            "savings_rate_pct": round(total_savings / (total_cost + total_savings) * 100, 1) if (total_cost + total_savings) > 0 else 0,
        }
    })


@app.get("/api/tenants/{tenant_id}/billing-summary")
async def billing_summary(tenant_id: str, request: Request):
    """Monthly ROI report — the document that justifies your invoice."""
    authenticate(request)
    import clickhouse_connect
    import psycopg2

    # Get tenant info from Postgres
    conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL", ""))
    cur = conn.cursor()
    cur.execute("SELECT name, plan, plan_seat_limit FROM tenants WHERE id = %s::uuid", (tenant_id,))
    tenant_row = cur.fetchone()
    cur.close()
    conn.close()

    if not tenant_row:
        return JSONResponse(status_code=404, content={"error": "Tenant not found"})

    tenant_name, plan, seat_limit = tenant_row
    plan_config = PLANS.get(plan or "starter", PLANS["starter"])

    # Get this month's stats from ClickHouse
    ch = clickhouse_connect.get_client(
        host=os.getenv("CLICKHOUSE_HOST"),
        port=int(os.getenv("CLICKHOUSE_PORT", 8443)),
        username=os.getenv("CLICKHOUSE_USER", "default"),
        password=os.getenv("CLICKHOUSE_PASSWORD"),
        secure=True
    )

    result = ch.query("""
        SELECT
            count() as total_calls,
            sum(cost_usd) as total_cost,
            countIf(cache_hit = 1) as cache_hits,
            countIf(was_routed = 1) as routed_calls,
            sum(cost_usd * if(was_routed = 1, 15.0, 1.0)) as estimated_without_routing,
            count(DISTINCT agent_id) as active_users
        FROM tokenguard.events
        WHERE client_id = {client_id:String}
        AND created_at >= now() - INTERVAL 30 DAY
    """, parameters={"client_id": tenant_id})

    row = result.result_rows[0] if result.result_rows else (0, 0, 0, 0, 0, 0)
    total_calls, total_cost, cache_hits, routed_calls, cost_without, active_users = row

    total_cost = float(total_cost or 0)
    cost_without = float(cost_without or 0)
    savings = cost_without - total_cost
    monthly_fee = plan_config["monthly_fee"]
    net_benefit = savings - monthly_fee

    return JSONResponse(content={
        "tenant": tenant_name,
        "plan": plan or "starter",
        "billing_period": datetime.utcnow().strftime("%Y-%m"),
        "monthly_fee_usd": monthly_fee,
        "active_users": int(active_users),
        "seat_limit": seat_limit,
        "usage": {
            "total_calls": int(total_calls),
            "cache_hits": int(cache_hits),
            "routed_calls": int(routed_calls),
            "cache_hit_rate_pct": round(int(cache_hits) / int(total_calls) * 100, 1) if total_calls > 0 else 0,
            "routing_rate_pct": round(int(routed_calls) / int(total_calls) * 100, 1) if total_calls > 0 else 0,
        },
        "financials": {
            "actual_ai_cost_usd": round(total_cost, 2),
            "cost_without_tokenguard_usd": round(cost_without, 2),
            "savings_usd": round(savings, 2),
            "savings_rate_pct": round(savings / cost_without * 100, 1) if cost_without > 0 else 0,
            "tokenguard_fee_usd": monthly_fee,
            "net_benefit_usd": round(net_benefit, 2),
            "roi_multiple": round(savings / monthly_fee, 1) if monthly_fee > 0 else 0,
        }
    })


@app.get("/api/dashboard/overview")
async def dashboard_overview(request: Request):
    client_id = authenticate(request)
    from queries import get_total_events, get_total_cost, get_spend_by_model, get_cache_savings
    
    total_events = get_total_events(client_id)
    total_cost = get_total_cost(client_id)
    by_model = get_spend_by_model(client_id)
    cache_stats = get_cache_savings(client_id)
    
    cache_hit_rate = 0.0
    if cache_stats["api_calls"] + cache_stats["cache_hits"] > 0:
        cache_hit_rate = round(
            cache_stats["cache_hits"] / (cache_stats["api_calls"] + cache_stats["cache_hits"]) * 100, 1
        )
    
    return JSONResponse(content={
        "total_cost_usd": total_cost,
        "total_requests": total_events,
        "cache_hit_rate": cache_hit_rate,
        "cache_hits": cache_stats["cache_hits"],
        "api_calls": cache_stats["api_calls"],
        "models": by_model,
    })


@app.get("/api/dashboard/cost-trends")
async def dashboard_cost_trends(request: Request):
    client_id = authenticate(request)
    import clickhouse_connect
    import os
    
    ch = clickhouse_connect.get_client(
        host=os.getenv("CLICKHOUSE_HOST"),
        port=int(os.getenv("CLICKHOUSE_PORT", 8443)),
        username=os.getenv("CLICKHOUSE_USER", "default"),
        password=os.getenv("CLICKHOUSE_PASSWORD"),
        secure=True
    )
    
    result = ch.query("""
        SELECT 
            toDate(created_at) as date,
            sum(cost_usd) as total_cost,
            countIf(cache_hit = 1) as cache_hits,
            count() as total_calls
        FROM tokenguard.events
        WHERE client_id = {client_id:String}
        AND created_at >= now() - INTERVAL 30 DAY
        GROUP BY date
        ORDER BY date
    """, parameters={"client_id": client_id})
    
    trends = []
    for row in result.result_rows:
        trends.append({
            "date": str(row[0]),
            "cost": round(float(row[1]), 6),
            "cache_hits": row[2],
            "total_calls": row[3],
        })
    
    return JSONResponse(content=trends)


@app.get("/api/dashboard/models")
async def dashboard_models(request: Request):
    client_id = authenticate(request)
    from queries import get_spend_by_model
    models = get_spend_by_model(client_id)
    total_cost = sum(m["cost"] for m in models)
    for m in models:
        m["percentage"] = round(m["cost"] / total_cost * 100, 1) if total_cost > 0 else 0
    return JSONResponse(content=models)


@app.get("/api/dashboard/agents")
async def dashboard_agents(request: Request):
    client_id = authenticate(request)
    import clickhouse_connect
    import os
    
    ch = clickhouse_connect.get_client(
        host=os.getenv("CLICKHOUSE_HOST"),
        port=int(os.getenv("CLICKHOUSE_PORT", 8443)),
        username=os.getenv("CLICKHOUSE_USER", "default"),
        password=os.getenv("CLICKHOUSE_PASSWORD"),
        secure=True
    )
    
    result = ch.query("""
        SELECT
            agent_id,
            sum(cost_usd) as total_cost,
            count() as total_calls,
            countIf(was_routed = 1) as routed_calls,
            countIf(cache_hit = 1) as cache_hits,
            countIf(blocked = 1) as blocked_calls
        FROM tokenguard.events
        WHERE client_id = {client_id:String}
        GROUP BY agent_id
        ORDER BY total_cost DESC
        LIMIT 20
    """, parameters={"client_id": client_id})
    
    agents = []
    for row in result.result_rows:
        agents.append({
            "agent_id": row[0],
            "cost": round(float(row[1]), 6),
            "calls": row[2],
            "routed_calls": row[3],
            "cache_hits": row[4],
            "blocked_calls": row[5],
        })
    
    return JSONResponse(content=agents)


@app.get("/debug/env")
async def debug_env():
    import psycopg2
    # Print ALL environment variables so we can see what Railway is injecting
    import os
    all_env = {k: v[:20] + "..." if len(v) > 20 else v 
               for k, v in os.environ.items() 
               if not k.startswith("PATH")}
    
    db_url = os.getenv("DATABASE_URL", "NOT SET")
    secret = os.getenv("TOKENGUARD_SECRET_KEY", "NOT SET")
    
    return JSONResponse(content={
        "secret_key_set": secret != "NOT SET",
        "secret_key_length": len(secret),
        "db_url_set": db_url != "NOT SET",
        "all_env_keys": list(os.environ.keys()),
    })
