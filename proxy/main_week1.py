"""
TokenGuard Proxy — Week 1 Basic Version
Simple proxy that forwards requests to LiteLLM with no caching, routing, or budgets.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import httpx
import os
import time
from datetime import datetime

app = FastAPI(title="TokenGuard Proxy", version="0.1.0")

LITELLM_URL = os.getenv("LITELLM_URL", "http://litellm:4000")
TOKENGUARD_SECRET_KEY = os.getenv("TOKENGUARD_SECRET_KEY", "changeme")


def authenticate(request: Request) -> str:
    """Validate the Bearer token against our secret key."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    
    token = auth_header.replace("Bearer ", "").strip()
    if token != TOKENGUARD_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return token


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.post("/v1/chat/completions")
async def proxy_completion(request: Request):
    """
    Main proxy endpoint - forwards requests to LiteLLM.
    Week 1: No caching, no routing, no budgets - just forward and log.
    """
    # Authenticate request
    authenticate(request)
    
    # Get request body
    body = await request.json()
    start_time = time.time()
    
    # Log incoming request
    print(f"\n[{datetime.utcnow().isoformat()}] Incoming request")
    print(f"  Model requested : {body.get('model', 'not specified')}")
    print(f"  Messages        : {len(body.get('messages', []))} message(s)")
    
    # Forward to LiteLLM
    forward_headers = {
        "Content-Type": "application/json",
    }
    
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{LITELLM_URL}/v1/chat/completions",
                json=body,
                headers=forward_headers,
            )
            response.raise_for_status()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Could not reach LiteLLM. Is it running on port 4000?"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"LiteLLM error: {e.response.text}"
        )
    
    # Calculate latency
    latency_ms = round((time.time() - start_time) * 1000)
    
    # Parse response
    result = response.json()
    usage = result.get("usage", {})
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)
    
    # Log response
    print(f"  Status          : {response.status_code}")
    print(f"  Input tokens    : {input_tokens}")
    print(f"  Output tokens   : {output_tokens}")
    print(f"  Latency         : {latency_ms}ms")
    print(f"  Model used      : {result.get('model', 'unknown')}")
    
    # Return response unchanged
    return JSONResponse(content=result, status_code=response.status_code)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
