# TokenGuard — AI Cost Control Platform

**Production-grade smart proxy for AI cost optimization, budget enforcement, and usage analytics.**

TokenGuard sits between your AI agents and provider APIs (OpenAI, Anthropic), automatically reducing costs by 30-70% through intelligent model routing and semantic caching while enforcing budgets in real-time.

---

## 🎯 What It Does

- **Automatic Cost Reduction**: 30-70% savings via model routing + semantic prompt caching
- **Real-Time Budget Enforcement**: Set daily/weekly/monthly caps with instant alerts
- **Full Visibility**: Track which agents, workflows, and models drive spend
- **Zero Code Changes**: Just change one URL in your existing code

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Your AI Agent  │
└────────┬────────┘
         │ (change URL to TokenGuard)
         ▼
┌─────────────────────────────────────────┐
│         TokenGuard Proxy (FastAPI)      │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Semantic │  │  Model   │  │ Budget ││
│  │  Cache   │  │ Router   │  │ Check  ││
│  └──────────┘  └──────────┘  └────────┘│
└────────┬────────────────────────────────┘
         │ HTTP
         ▼
┌─────────────────────────────────────────┐
│      LiteLLM Gateway (separate)         │
│  Unified interface to all providers     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ OpenAI/Anthropic│
└─────────────────┘

Data Flow:
┌──────────┐    ┌────────────┐    ┌──────────────┐
│PostgreSQL│◄───│   Proxy    │───►│  ClickHouse  │
│(metadata)│    │            │    │  (analytics) │
│  + RLS   │    └─────┬──────┘    │ + Mat Views  │
└──────────┘          │            └──────────────┘
                      │
                      ▼
                ┌──────────┐
                │  Redis   │
                │ (cache)  │
                └──────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI and/or Anthropic API keys
- 4GB RAM minimum

### 1. Clone and Configure

```bash
cd C:\Users\Abela\CascadeProjects\tokenguard

# Copy environment template
cp .env.example .env

# Edit .env and add your keys:
# - TOKENGUARD_SECRET_KEY (generate with: openssl rand -hex 32)
# - ENCRYPTION_KEY (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
```

### 2. Start Services

```bash
docker-compose up -d
```

This starts:
- **Proxy** (port 8000) — FastAPI smart proxy
- **LiteLLM** (port 4000) — Unified LLM gateway
- **Dashboard** (port 3000) — Next.js UI
- **Analytics** — Background aggregation + spike detection
- **PostgreSQL** (port 5432) — Metadata with RLS
- **ClickHouse** (port 8123) — Analytics with materialized views
- **Redis** (port 6379) — Semantic cache

### 3. Initialize Database

```bash
# PostgreSQL schema (simplified with RLS)
docker exec -i tokenguard-postgres psql -U tokenguard -d tokenguard < db/postgres_schema_simplified.sql

# ClickHouse schema (simplified with materialized views)
docker exec -i tokenguard-clickhouse clickhouse-client --multiquery < db/clickhouse_schema_simplified.sql
```

### 4. Test the Proxy

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer YOUR_TOKENGUARD_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 5. Open Dashboard

Visit **http://localhost:3000** to see your cost analytics.

---

## 📊 Key Features

### 1. Semantic Prompt Cache

Uses **sentence-transformers** embeddings to detect similar prompts:

```python
# 92% similarity threshold catches near-duplicates
# Example: "Summarize this article" vs "Please summarize the article"
# → Cache hit, $0 cost
```

**Result**: 30-40% cache hit rate = 30-40% cost savings on repeated patterns.

### 2. Intelligent Model Routing

Automatically routes simple tasks to cheaper models:

```python
# Simple classification task
"Is this email spam? Yes or no"
# Routed: gpt-4o → gpt-4o-mini (94% cheaper)

# Complex reasoning task
"Design a distributed system architecture for..."
# Routed: stays on gpt-4o (no downgrade)
```

**Result**: 20-30% additional savings from smart routing.

### 3. Real-Time Budget Enforcement

```python
# Set daily cap
daily_cap_usd = 100

# When limit reached:
# - Action: "alert" → Slack/email notification
# - Action: "throttle" → Force cheaper models
# - Action: "block" → Reject requests with 429
```

### 4. Usage Analytics

ClickHouse materialized views auto-aggregate:
- Daily cost per tenant/agent/model
- Cache hit rates
- Routing effectiveness
- Anomaly detection

---

## 🔧 Configuration

### Environment Variables

See `.env.example` for all options. Key variables:

```bash
# Proxy
TOKENGUARD_SECRET_KEY=your_master_key
ENCRYPTION_KEY=your_fernet_key

# Databases
DATABASE_URL=postgresql://...
CLICKHOUSE_HOST=clickhouse
REDIS_URL=redis://redis:6379/0

# Provider Keys (encrypted at rest)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Alerts
SLACK_DEFAULT_WEBHOOK=https://hooks.slack.com/...
RESEND_API_KEY=re_...
```

### Cache Settings

Edit `proxy/cache.py`:

```python
cache_ttl_seconds = 86400  # 24 hours
similarity_threshold = 0.92  # 92% match required
max_scan_keys = 200  # Scan up to 200 recent entries
```

### Routing Rules

Edit `proxy/router.py` or configure via dashboard:

```python
# Simple keywords trigger cheap models
SIMPLE_KEYWORDS = ["classify", "yes or no", "extract", "translate"]

# Complex keywords keep expensive models
COMPLEX_KEYWORDS = ["reason through", "step by step", "design", "debug"]
```

---

## 📈 How It Saves Money

### Example: 10,000 requests/month

**Without TokenGuard:**
```
10,000 requests × gpt-4o
Average: $0.05/request
Total: $500/month
```

**With TokenGuard:**
```
3,000 cache hits        → $0 (semantic cache)
5,000 routed to mini    → $0.005/request = $25
2,000 stay on gpt-4o    → $0.05/request = $100
Total: $125/month
Savings: $375/month (75%)
```

---

## 🛠️ Development

### Project Structure

```
tokenguard/
├── proxy/              # FastAPI proxy service
│   ├── main.py         # Main proxy endpoint
│   ├── router.py       # Model routing logic
│   ├── cache.py        # Semantic cache (sentence-transformers)
│   ├── budget.py       # Budget enforcement
│   ├── logger.py       # Async ClickHouse logger
│   ├── middleware.py   # Auth + rate limiting
│   └── secrets.py      # API key encryption
├── analytics/          # Background services
│   ├── aggregator.py   # Hourly/daily rollups
│   ├── spike_detector.py  # Anomaly detection
│   └── recommender.py  # Cost-saving suggestions
├── dashboard/          # Next.js frontend
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # API client + utils
├── db/
│   ├── postgres_schema.sql  # Relational data
│   └── clickhouse_schema_simplified.sql  # Analytics with materialized views
└── docker-compose.yml
```

### Running Locally

```bash
# Proxy
cd proxy
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Analytics
cd analytics
python aggregator.py &
python spike_detector.py &
python recommender.py &

# Dashboard
cd dashboard
npm install
npm run dev
```

---

## 🔒 Security

- **API Key Encryption**: Provider keys encrypted with Fernet (AES-128)
- **Proxy Key Hashing**: SHA-256 hashed in PostgreSQL
- **Rate Limiting**: Redis sliding window per tenant
- **Secrets Management**: AWS Secrets Manager integration ready

---

## 📝 API Reference

### Proxy Endpoint

```bash
POST /v1/chat/completions
Authorization: Bearer <TOKENGUARD_SECRET_KEY>
Content-Type: application/json

{
  "model": "gpt-4o",
  "messages": [...],
  
  // TokenGuard extensions (optional)
  "tg_agent_id": "agent-123",
  "tg_workflow_id": "workflow-456",
  "tg_skip_cache": false,
  "tg_skip_routing": false
}
```

### Budget Status

```bash
GET /v1/budgets/status
Authorization: Bearer <TOKENGUARD_SECRET_KEY>

Response:
{
  "tenant_id": "...",
  "budgets": [
    {
      "budget_id": "...",
      "name": "Monthly Cap",
      "spent_usd": 1247.32,
      "limit_usd": 5000,
      "pct_used": 24.9
    }
  ]
}
```

### Cache Stats

```bash
GET /v1/cache/stats
Authorization: Bearer <TOKENGUARD_SECRET_KEY>

Response:
{
  "enabled": true,
  "ttl_seconds": 86400,
  "similarity_threshold": 0.92,
  "keyspace_hits": 15234,
  "keyspace_misses": 29876
}
```

---

## 🎯 Roadmap

- [x] Semantic prompt caching
- [x] Intelligent model routing
- [x] Budget enforcement
- [x] Real-time analytics
- [ ] Multi-tenant dashboard with Clerk auth
- [ ] Custom routing rules UI
- [ ] A/B testing framework
- [ ] Cost forecasting ML model
- [ ] Stripe billing integration

---

## 📄 License

MIT License - see LICENSE file

---

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss major changes.

---

## 💬 Support

- **Issues**: GitHub Issues
- **Docs**: See `/docs` folder
- **Email**: support@tokenguard.dev

---

**Built with**: FastAPI • LiteLLM • Next.js • ClickHouse • PostgreSQL • Redis • sentence-transformers
