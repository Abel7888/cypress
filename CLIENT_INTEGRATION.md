# TokenGuard — Client Integration Guide

This guide shows your clients how to integrate TokenGuard with automatic fallback to direct provider calls if your proxy is down.

---

## Circuit Breaker Pattern

The circuit breaker ensures your clients' AI applications stay online even if TokenGuard experiences downtime. If the proxy fails, requests automatically fall back to calling the provider directly.

### Python Implementation

```python
import httpx
import os
from typing import Optional

TOKENGUARD_URL = "https://proxy.tokenguard.io/v1/chat/completions"
OPENAI_FALLBACK = "https://api.openai.com/v1/chat/completions"
ANTHROPIC_FALLBACK = "https://api.anthropic.com/v1/messages"

async def call_ai(
    payload: dict,
    agent_id: str = "default",
    workflow_id: Optional[str] = None,
    provider: str = "openai"
) -> dict:
    """
    Call AI with automatic fallback to provider if TokenGuard is down.
    
    Args:
        payload: OpenAI/Anthropic-compatible request body
        agent_id: Your agent identifier for cost tracking
        workflow_id: Optional workflow identifier
        provider: "openai" or "anthropic"
    
    Returns:
        API response dict
    """
    headers = {
        "Authorization": f"Bearer {os.getenv('TOKENGUARD_API_KEY')}",
        "X-Agent-ID": agent_id,
        "Content-Type": "application/json"
    }
    
    if workflow_id:
        headers["X-Workflow-ID"] = workflow_id
    
    try:
        # Try TokenGuard first (5 second timeout)
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                TOKENGUARD_URL,
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
            
    except (httpx.TimeoutException, httpx.HTTPError) as e:
        # Fallback: call provider directly
        print(f"TokenGuard unavailable, falling back to {provider}: {e}")
        
        fallback_url = OPENAI_FALLBACK if provider == "openai" else ANTHROPIC_FALLBACK
        fallback_key = os.getenv("OPENAI_API_KEY") if provider == "openai" else os.getenv("ANTHROPIC_API_KEY")
        
        headers["Authorization"] = f"Bearer {fallback_key}"
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                fallback_url,
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            return response.json()


# Example usage
async def main():
    response = await call_ai(
        payload={
            "model": "gpt-4o",
            "messages": [
                {"role": "user", "content": "Explain quantum computing in simple terms"}
            ]
        },
        agent_id="research-assistant",
        workflow_id="user-query-123",
        provider="openai"
    )
    print(response["choices"][0]["message"]["content"])
```

### Node.js Implementation

```javascript
import axios from 'axios';

const TOKENGUARD_URL = 'https://proxy.tokenguard.io/v1/chat/completions';
const OPENAI_FALLBACK = 'https://api.openai.com/v1/chat/completions';

async function callAI(payload, options = {}) {
  const {
    agentId = 'default',
    workflowId = null,
    provider = 'openai'
  } = options;

  const headers = {
    'Authorization': `Bearer ${process.env.TOKENGUARD_API_KEY}`,
    'X-Agent-ID': agentId,
    'Content-Type': 'application/json'
  };

  if (workflowId) {
    headers['X-Workflow-ID'] = workflowId;
  }

  try {
    // Try TokenGuard first (5 second timeout)
    const response = await axios.post(TOKENGUARD_URL, payload, {
      headers,
      timeout: 5000
    });
    return response.data;
    
  } catch (error) {
    // Fallback: call provider directly
    console.warn(`TokenGuard unavailable, falling back to ${provider}:`, error.message);
    
    const fallbackUrl = provider === 'openai' ? OPENAI_FALLBACK : 'https://api.anthropic.com/v1/messages';
    const fallbackKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
    
    headers['Authorization'] = `Bearer ${fallbackKey}`;
    
    const response = await axios.post(fallbackUrl, payload, {
      headers,
      timeout: 120000
    });
    return response.data;
  }
}

// Example usage
const response = await callAI(
  {
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: 'Explain quantum computing in simple terms' }
    ]
  },
  {
    agentId: 'research-assistant',
    workflowId: 'user-query-123',
    provider: 'openai'
  }
);

console.log(response.choices[0].message.content);
```

### OpenAI SDK with Fallback

```python
from openai import AsyncOpenAI
import os

# Primary client (TokenGuard)
tokenguard_client = AsyncOpenAI(
    base_url="https://proxy.tokenguard.io/v1",
    api_key=os.getenv("TOKENGUARD_API_KEY"),
    timeout=5.0
)

# Fallback client (OpenAI direct)
openai_client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=120.0
)

async def chat_completion(messages, model="gpt-4o", agent_id="default"):
    try:
        # Try TokenGuard
        response = await tokenguard_client.chat.completions.create(
            model=model,
            messages=messages,
            extra_headers={"X-Agent-ID": agent_id}
        )
        return response
        
    except Exception as e:
        print(f"TokenGuard unavailable, using direct OpenAI: {e}")
        # Fallback to OpenAI
        response = await openai_client.chat.completions.create(
            model=model,
            messages=messages
        )
        return response
```

---

## Environment Variables

Clients need to set these environment variables:

```bash
# TokenGuard
TOKENGUARD_API_KEY=tg_your_key_here

# Fallback keys (keep your existing keys)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Cost Tracking Headers

To get detailed cost analytics, clients should include these headers:

```python
headers = {
    "X-Agent-ID": "customer-support-bot",      # Required for per-agent tracking
    "X-Workflow-ID": "ticket-123",             # Optional: track specific workflows
    "X-Trace-ID": "req-uuid-456"               # Optional: distributed tracing
}
```

These headers enable:
- **Per-agent cost breakdown** in the dashboard
- **Workflow-level analytics** to identify expensive flows
- **Distributed tracing** across your microservices

---

## Testing the Circuit Breaker

### Test 1: Normal Operation
```bash
# TokenGuard should respond
curl -X POST https://proxy.tokenguard.io/v1/chat/completions \
  -H "Authorization: Bearer $TOKENGUARD_API_KEY" \
  -H "X-Agent-ID: test-agent" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'
```

### Test 2: Simulate Downtime
```python
# Stop TokenGuard or use invalid URL
TOKENGUARD_URL = "https://invalid.url/v1/chat/completions"

# Your code should automatically fall back to OpenAI
response = await call_ai(payload, agent_id="test")
# Response still works via fallback
```

---

## Monitoring Fallback Usage

TokenGuard logs all requests. When clients fall back to direct provider calls, those won't appear in your analytics. To detect fallback usage:

1. **Compare request counts**: Dashboard requests vs. your application logs
2. **Monitor uptime**: Set up alerts for proxy downtime
3. **Track cost anomalies**: Sudden cost increases may indicate fallback usage

---

## Best Practices

### 1. Set Appropriate Timeouts
```python
# TokenGuard: short timeout (5s) for fast failover
tokenguard_timeout = 5.0

# Provider fallback: longer timeout (120s) for complex requests
provider_timeout = 120.0
```

### 2. Log Fallback Events
```python
import logging

try:
    response = await call_tokenguard(payload)
except Exception as e:
    logging.warning(f"TokenGuard fallback triggered: {e}")
    response = await call_provider_direct(payload)
```

### 3. Implement Exponential Backoff
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
async def call_with_retry(payload):
    return await call_ai(payload)
```

### 4. Cache Provider Keys Securely
```python
# Don't hardcode keys
# Use environment variables or secret managers
import os

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise ValueError("OPENAI_API_KEY not set")
```

---

## Migration Guide

### Before TokenGuard:
```python
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
response = await client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### After TokenGuard (with fallback):
```python
from openai import AsyncOpenAI

# Primary: TokenGuard
tg_client = AsyncOpenAI(
    base_url="https://proxy.tokenguard.io/v1",
    api_key=os.getenv("TOKENGUARD_API_KEY"),
    timeout=5.0
)

# Fallback: Direct OpenAI
openai_client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

try:
    response = await tg_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello"}],
        extra_headers={"X-Agent-ID": "my-agent"}
    )
except Exception:
    response = await openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello"}]
    )
```

**Changes required:**
1. Add `TOKENGUARD_API_KEY` to environment
2. Wrap API calls in try/except
3. Add fallback client
4. Include `X-Agent-ID` header for tracking

**Zero downtime migration:**
- Deploy fallback code first (it will use direct provider)
- Switch `TOKENGUARD_API_KEY` when ready
- Monitor for 24 hours
- Remove direct provider calls once confident

---

## Support

If clients experience issues:
1. Check TokenGuard status page
2. Verify API key is valid
3. Test direct provider connection
4. Contact support@tokenguard.io

---

**Remember**: The circuit breaker ensures your clients never experience downtime due to TokenGuard. Their AI applications stay online 100% of the time.
