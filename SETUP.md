# TokenGuard — Complete Setup Guide

This guide walks you through setting up TokenGuard from scratch.

## Prerequisites

- Docker & Docker Compose installed
- OpenAI and/or Anthropic API keys
- 4GB RAM minimum
- Windows, macOS, or Linux

---

## Step 1: Generate Encryption Keys

TokenGuard uses encryption to protect your provider API keys at rest.

### Generate TOKENGUARD_SECRET_KEY
```bash
# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# macOS/Linux
openssl rand -hex 32
```

### Generate ENCRYPTION_KEY
```bash
# Windows PowerShell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# macOS/Linux
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Step 2: Configure Environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Proxy
TOKENGUARD_SECRET_KEY=<your-generated-secret-key>
ENCRYPTION_KEY=<your-generated-fernet-key>
LITELLM_URL=http://litellm:4000

# Database
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=tokenguard
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
DATABASE_URL=postgresql://tokenguard:tokenguard_dev@postgres:5432/tokenguard
POSTGRES_PASSWORD=tokenguard_dev

# Redis
REDIS_URL=redis://redis:6379/0

# Provider API Keys (REQUIRED)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Auth (optional for now)
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

# Alerts (optional)
RESEND_API_KEY=
SLACK_DEFAULT_WEBHOOK=
```

---

## Step 3: Start Services

```bash
docker-compose up -d
```

This starts 6 containers:
- `tokenguard-postgres` (port 5432)
- `tokenguard-clickhouse` (port 8123)
- `tokenguard-redis` (port 6379)
- `tokenguard-litellm` (port 4000)
- `tokenguard-proxy` (port 8000)
- `tokenguard-analytics` (background)
- `tokenguard-dashboard` (port 3000)

Check status:
```bash
docker-compose ps
```

All services should show "Up" status.

---

## Step 4: Initialize Databases

### PostgreSQL Schema
```bash
docker exec -i tokenguard-postgres psql -U tokenguard -d tokenguard < db/postgres_schema_simplified.sql
```

### ClickHouse Schema
```bash
docker exec -i tokenguard-clickhouse clickhouse-client --multiquery < db/clickhouse_schema_simplified.sql
```

Verify:
```bash
# Check PostgreSQL tables
docker exec tokenguard-postgres psql -U tokenguard -d tokenguard -c "\dt"

# Check ClickHouse tables
docker exec tokenguard-clickhouse clickhouse-client -q "SHOW TABLES FROM tokenguard"
```

---

## Step 5: Create Your First Client

Insert a test client into PostgreSQL:

```bash
docker exec -i tokenguard-postgres psql -U tokenguard -d tokenguard <<EOF
INSERT INTO clients (name, slug, proxy_api_key, key_ref)
VALUES (
    'Test Client',
    'test-client',
    'tg_test_key_12345',
    'test-key-ref'
);

INSERT INTO client_config (client_id, routing_enabled, caching_enabled, daily_cap_usd, monthly_cap_usd)
SELECT id, true, true, 100, 1000
FROM clients WHERE slug = 'test-client';
EOF
```

---

## Step 6: Test the Proxy

### Test with curl:

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer tg_test_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello! What is 2+2?"}
    ]
  }'
```

Expected response:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "2 + 2 equals 4."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 8,
    "total_tokens": 20
  }
}
```

Check response headers:
```
X-TokenGuard-Model: gpt-4o-mini  (if routed)
X-TokenGuard-Cost: 0.000024
X-TokenGuard-Savings: 0.000120
X-TokenGuard-Cached: false
```

---

## Step 7: Test Semantic Caching

Send the same request again:

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer tg_test_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello! What is 2+2?"}
    ]
  }'
```

Response should be instant (< 50ms) with header:
```
X-TokenGuard-Cached: true
```

---

## Step 8: View Analytics

### Check ClickHouse Events:

```bash
docker exec tokenguard-clickhouse clickhouse-client -q "
SELECT 
    client_id,
    model_requested,
    model_used,
    cost_usd,
    cache_hit,
    was_routed
FROM tokenguard.events
ORDER BY created_at DESC
LIMIT 5
FORMAT Pretty
"
```

### Check Daily Summary:

```bash
docker exec tokenguard-clickhouse clickhouse-client -q "
SELECT * FROM tokenguard.daily_summary
ORDER BY summary_date DESC
LIMIT 5
FORMAT Pretty
"
```

---

## Step 9: Open Dashboard

Visit **http://localhost:3000**

You should see:
- Total spend
- Total savings
- Cache hit rate
- Cost trends chart
- Model breakdown

---

## Step 10: Integrate with Your Code

Change your OpenAI/Anthropic client to point to TokenGuard:

### Python (OpenAI SDK):
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="tg_test_key_12345"  # Your TokenGuard key
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
    extra_headers={
        "X-Agent-ID": "my-agent-123",
        "X-Workflow-ID": "workflow-456"
    }
)
```

### Node.js:
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'tg_test_key_12345'
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### cURL:
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer tg_test_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## Troubleshooting

### Services won't start:
```bash
# Check logs
docker-compose logs proxy
docker-compose logs litellm
docker-compose logs clickhouse

# Restart services
docker-compose restart
```

### Database connection errors:
```bash
# Check PostgreSQL
docker exec tokenguard-postgres pg_isready -U tokenguard

# Check ClickHouse
docker exec tokenguard-clickhouse clickhouse-client -q "SELECT 1"
```

### LiteLLM errors:
```bash
# Check LiteLLM logs
docker-compose logs litellm

# Verify API keys are set
docker exec tokenguard-litellm env | grep API_KEY
```

### Cache not working:
```bash
# Check Redis
docker exec tokenguard-redis redis-cli ping

# Check cache stats
curl http://localhost:8000/v1/cache/stats \
  -H "Authorization: Bearer tg_test_key_12345"
```

---

## Production Deployment

### Security Checklist:
- [ ] Change default passwords in `.env`
- [ ] Use strong TOKENGUARD_SECRET_KEY
- [ ] Enable HTTPS with reverse proxy (nginx/Caddy)
- [ ] Set up firewall rules (only expose ports 8000, 3000)
- [ ] Use AWS Secrets Manager for API keys
- [ ] Enable PostgreSQL SSL
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring (Prometheus/Grafana)

### Scaling:
- Run multiple proxy instances behind load balancer
- Use managed PostgreSQL (RDS, Cloud SQL)
- Use managed Redis (ElastiCache, Cloud Memorystore)
- Use ClickHouse Cloud for analytics
- Separate analytics service to dedicated instance

---

## Next Steps

1. **Set up budgets**: Create daily/monthly caps
2. **Configure routing rules**: Custom model routing per agent
3. **Enable alerts**: Slack/email notifications
4. **Add more clients**: Multi-tenant support
5. **Monitor costs**: Review dashboard daily

---

## Support

- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Email**: support@tokenguard.dev
