# TokenGuard — Build Order Guide

**Follow this exact sequence. Do not jump ahead.**

This is the proven path to building TokenGuard from zero to production. Each week builds on the previous week. Skipping steps will cause problems.

---

## Week 1: Basic Proxy (Intercept & Forward)

**Goal**: Get a working proxy that intercepts requests and forwards them to LiteLLM.

### Tasks:
1. ✅ Set up project structure
2. ✅ Run LiteLLM in Docker
3. ✅ Write `main.py` with ONLY:
   - FastAPI app
   - Single `/v1/chat/completions` endpoint
   - Forward request to LiteLLM via HTTP
   - Return response unchanged
4. ✅ NO routing, NO caching, NO budgets yet

### Test:
```bash
# Start LiteLLM
docker run -p 4000:4000 -e OPENAI_API_KEY=$OPENAI_API_KEY ghcr.io/berriai/litellm:main

# Start proxy
cd proxy
uvicorn main:app --reload

# Send test request
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
```

**Success criteria**: You get a valid OpenAI response back. Latency < 2 seconds.

---

## Week 2: Caching Layer

**Goal**: Add Redis and implement semantic caching.

### Tasks:
1. ✅ Add Redis to docker-compose
2. ✅ Implement exact-match cache first:
   - Hash the messages array
   - Store response in Redis with 1-hour TTL
   - Check cache before forwarding
3. ✅ Test: Send same request twice, second should be instant
4. ✅ Upgrade to semantic cache:
   - Add sentence-transformers
   - Generate embeddings for prompts
   - Use cosine similarity (threshold: 0.92)
   - Store embeddings with responses

### Test:
```python
# First request (cache miss)
response1 = await call_ai({"messages": [{"role": "user", "content": "What is 2+2?"}]})
# Takes ~1500ms

# Second request (cache hit - exact match)
response2 = await call_ai({"messages": [{"role": "user", "content": "What is 2+2?"}]})
# Takes <5ms

# Third request (cache hit - semantic match)
response3 = await call_ai({"messages": [{"role": "user", "content": "Calculate 2 plus 2"}]})
# Takes <50ms (similarity: 0.94)
```

**Success criteria**: 
- Cache hits return in < 5ms
- Semantic similarity catches near-duplicates
- Cache hit rate > 30% on repeated queries

---

## Week 3: Analytics (ClickHouse)

**Goal**: Log every request to ClickHouse for analytics.

### Tasks:
1. ✅ Add ClickHouse to docker-compose
2. ✅ Run `clickhouse_schema_simplified.sql`
3. ✅ Implement async logger in `logger.py`:
   - Batch events (500 per flush)
   - Flush every 2 seconds
   - Non-blocking (use asyncio.create_task)
4. ✅ Log these fields for every request:
   - client_id, agent_id, workflow_id
   - model_requested, model_used
   - input_tokens, output_tokens, cost_usd
   - latency_ms, cache_hit, was_routed
5. ✅ Write `queries.py` with dashboard functions

### Test:
```bash
# Make 10 test requests
for i in {1..10}; do
  curl -X POST http://localhost:8000/v1/chat/completions \
    -H "Authorization: Bearer test-key" \
    -H "X-Agent-ID: test-agent-$i" \
    -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Test '$i'"}]}'
done

# Query ClickHouse
docker exec tokenguard-clickhouse clickhouse-client -q "
  SELECT 
    agent_id,
    count() as requests,
    sum(cost_usd) as total_cost,
    avg(latency_ms) as avg_latency
  FROM tokenguard.events
  GROUP BY agent_id
  FORMAT Pretty
"
```

**Success criteria**:
- All 10 events appear in ClickHouse
- Materialized views auto-populate
- Queries return in < 100ms

---

## Week 4: Model Routing

**Goal**: Automatically route simple tasks to cheap models.

### Tasks:
1. ✅ Implement `router.py` with complexity classification
2. ✅ Extract signals from requests:
   - Token count estimate
   - Presence of code blocks
   - Tool/function calls
   - System prompts
3. ✅ Classify as simple/moderate/complex
4. ✅ Route to appropriate tier:
   - Simple → gpt-4o-mini or claude-haiku
   - Moderate → gpt-4o or claude-sonnet
   - Complex → o1 or claude-opus
5. ✅ Log `was_routed` flag and `routing_reason`

### Test with 20 Different Prompts:
```python
test_prompts = [
    # Simple (should route to mini)
    {"content": "Is this spam? Yes or no.", "expected": "simple"},
    {"content": "Translate 'hello' to Spanish", "expected": "simple"},
    {"content": "Classify this as positive or negative", "expected": "simple"},
    
    # Moderate (should stay on gpt-4o)
    {"content": "Write a product description for...", "expected": "moderate"},
    {"content": "Summarize this 500-word article", "expected": "moderate"},
    
    # Complex (should stay on o1)
    {"content": "Debug this Python code:\n```python\n...", "expected": "complex"},
    {"content": "Design a distributed system architecture", "expected": "complex"},
    {"content": "Reason through this multi-step math problem", "expected": "complex"},
]

for prompt in test_prompts:
    response = await call_ai({"model": "gpt-4o", "messages": [{"role": "user", "content": prompt["content"]}]})
    # Check X-TokenGuard-Model header
    assert classify_complexity(prompt["content"]) == prompt["expected"]
```

**Success criteria**:
- 18/20 prompts routed correctly
- Measure cost difference: routed vs unrouted on 100 real requests
- Target: 20-30% cost reduction from routing alone

---

## Week 5: Budget Enforcement

**Goal**: Block requests when budget limits are hit.

### Tasks:
1. ✅ Implement `budget.py` with Redis counters
2. ✅ Track spend per client per day/month
3. ✅ Check budget before forwarding request
4. ✅ Return 429 if budget exceeded
5. ✅ Implement alert thresholds (50%, 80%, 95%)
6. ✅ Fire Slack webhook when threshold hit
7. ✅ Reset daily counters at midnight UTC

### Test:
```python
# Set $1 daily limit
await set_budget(client_id="test", daily_cap_usd=1.0)

# Make requests until blocked
total_cost = 0
request_count = 0

while total_cost < 1.5:
    try:
        response = await call_ai({"model": "gpt-4o", "messages": [...]})
        cost = float(response.headers["X-TokenGuard-Cost"])
        total_cost += cost
        request_count += 1
        print(f"Request {request_count}: ${cost:.4f} (total: ${total_cost:.4f})")
    except HTTPException as e:
        if e.status_code == 429:
            print(f"✓ Budget blocked at ${total_cost:.4f}")
            break

# Verify Slack alert was sent
# Check Slack channel for alert message

# Wait until midnight UTC
# Verify counter resets
```

**Success criteria**:
- Requests block exactly at $1.00 limit
- Slack alert fires at 80% ($0.80)
- Daily counter resets at midnight UTC
- No race conditions (test with concurrent requests)

---

## Week 6: Dashboard (Next.js)

**Goal**: Build read-only analytics dashboard.

### Tasks:
1. ✅ Set up Next.js 14 with App Router
2. ✅ Create 4 pages:
   - `/overview` — Total spend, savings, cache hit rate
   - `/cost-analysis` — Cost trends chart
   - `/budgets` — Budget status with progress bars
   - `/roi-report` — Savings breakdown
3. ✅ Wire up ClickHouse queries to dashboard API
4. ✅ Use Recharts for visualizations
5. ✅ Add Clerk for authentication
6. ✅ Make dashboard read-only (no create/edit yet)

### Test:
```bash
# Start dashboard
cd dashboard
npm install
npm run dev

# Visit http://localhost:3000
# Login with Clerk
# Verify all 4 pages load
# Verify charts show real data from ClickHouse
```

**Success criteria**:
- All charts render with real data
- Page load time < 2 seconds
- Responsive on mobile
- Auth works with Clerk

---

## Week 7: Multi-Tenancy

**Goal**: Support multiple clients with data isolation.

### Tasks:
1. ✅ Add `clients` table to PostgreSQL
2. ✅ Generate unique proxy API keys per client
3. ✅ Scope ALL queries by `client_id`
4. ✅ Implement Row-Level Security (RLS) in PostgreSQL
5. ✅ Add client switcher to dashboard
6. ✅ Test data isolation:
   - Client A cannot see Client B's data
   - API keys are unique per client
   - Budget limits are per-client

### Test:
```python
# Create 2 test clients
client_a = create_client(name="Client A", slug="client-a")
client_b = create_client(name="Client B", slug="client-b")

# Make requests as Client A
for i in range(10):
    await call_ai(payload, api_key=client_a.proxy_api_key)

# Make requests as Client B
for i in range(10):
    await call_ai(payload, api_key=client_b.proxy_api_key)

# Query ClickHouse
# Verify Client A sees only their 10 requests
# Verify Client B sees only their 10 requests
# Verify no cross-contamination
```

**Success criteria**:
- Perfect data isolation
- RLS policies enforce separation
- Dashboard shows only client's own data
- No performance degradation with 10 clients

---

## Week 8: Stripe Billing

**Goal**: Implement usage-based billing and subscriptions.

### Tasks:
1. ✅ Set up Stripe account (test mode)
2. ✅ Implement usage-based metering:
   - Report token usage to Stripe daily
   - Price: $0.10 per 1M tokens
3. ✅ Implement flat retainer subscription:
   - $99/month base plan
   - Includes 10M tokens
   - Overage charged at $0.10/1M
4. ✅ Add Stripe webhook handler
5. ✅ Show billing page in dashboard
6. ✅ Test both flows end-to-end

### Test:
```python
# Test 1: Usage-based billing
client = create_client(plan="usage")
# Make 5M tokens worth of requests
# Check Stripe dashboard
# Verify usage reported: 5M tokens
# Verify invoice: $0.50

# Test 2: Retainer subscription
client = create_client(plan="retainer")
# Subscribe to $99/month plan
# Make 12M tokens worth of requests (2M overage)
# Verify invoice: $99 + $0.20 = $99.20
```

**Success criteria**:
- Stripe webhooks process correctly
- Usage accurately reported
- Invoices match actual usage
- Subscription renewals work

---

## Week 9: Production Deployment (Railway)

**Goal**: Deploy all services to production.

### Tasks:
1. ✅ Create Railway account
2. ✅ Deploy 5 services:
   - Proxy (FastAPI)
   - LiteLLM
   - Analytics
   - Dashboard (Next.js)
   - PostgreSQL (Railway managed)
3. ✅ Use Railway Redis add-on
4. ✅ Deploy ClickHouse on separate VPS or ClickHouse Cloud
5. ✅ Set up custom domain: `proxy.tokenguard.io`
6. ✅ Enable HTTPS with Railway's automatic SSL
7. ✅ Configure health checks for all services
8. ✅ Set up Uptime Robot monitoring
9. ✅ Get one real company sending traffic

### Deployment Checklist:
```bash
# 1. Environment variables
railway variables set OPENAI_API_KEY=...
railway variables set ANTHROPIC_API_KEY=...
railway variables set ENCRYPTION_KEY=...

# 2. Deploy services
railway up --service proxy
railway up --service litellm
railway up --service analytics
railway up --service dashboard

# 3. Run migrations
railway run --service proxy "python -m alembic upgrade head"

# 4. Verify health checks
curl https://proxy.tokenguard.io/health
# Should return: {"status": "ok"}

# 5. Set up monitoring
# Add to Uptime Robot:
# - https://proxy.tokenguard.io/health (every 5 min)
# - https://dashboard.tokenguard.io (every 5 min)
```

### Get First Real Client:
1. Reach out to 10 companies using AI heavily
2. Offer free trial: "Save 30-70% on AI costs"
3. Onboard first client:
   - Create their account
   - Generate API key
   - Help them integrate (circuit breaker pattern)
   - Set up their budget ($500/month to start)
4. Monitor for 1 week:
   - Check error rates
   - Verify cost savings
   - Collect feedback

**Success criteria**:
- All services healthy in production
- 99.9% uptime for 1 week
- First client sending real traffic
- Zero data loss
- Latency < 500ms p99

---

## Week 10 and Beyond: Customer-Driven Development

**Goal**: Build what your first client needs.

### Listen to Your Client:
After Week 9, you have real usage data. Build based on what they tell you:

**Common requests:**
- Custom routing rules per agent
- Webhook notifications for budget alerts
- CSV export of cost data
- API for programmatic budget management
- SSO integration (SAML)
- Dedicated Slack channel for alerts
- Custom model pricing
- Multi-region support

### Example Week 10 Sprint:
Client says: *"We need to set different budget limits for each of our 5 teams"*

**Build:**
1. Add `team_id` field to events
2. Add team-level budgets to PostgreSQL
3. Update budget enforcement to check team budgets
4. Add team management UI to dashboard
5. Ship in 5 days

### Prioritization Framework:
1. **P0 (Build immediately)**: Blocks client from using the product
2. **P1 (Build this week)**: Significantly improves their workflow
3. **P2 (Build this month)**: Nice to have, not urgent
4. **P3 (Backlog)**: Interesting but no clear demand

**Do NOT build features speculatively.** Only build what paying customers ask for.

---

## Scalability Notes

### Current Architecture Handles:
- **5 enterprise clients** with no changes
- **10,000 requests/day** per client
- **100GB ClickHouse data** (1 year retention)
- **Single proxy instance** (stateless, can scale horizontally)

### When to Scale:

**At 10 clients:**
- Add load balancer (Railway handles this)
- Run 2-3 proxy instances
- No code changes needed

**At 50 clients:**
- Migrate to managed PostgreSQL (RDS/Cloud SQL)
- Migrate to managed Redis (ElastiCache)
- Consider ClickHouse Cloud
- Still no code changes

**At 100 clients (Enterprise):**
- Move to AWS/GCP for SOC 2 compliance
- Use ECS/Kubernetes for containers
- Dedicated ClickHouse cluster
- Multi-region deployment
- Add observability (Datadog/New Relic)

### Scaling Checklist:
```
Current (Weeks 1-9):
├── Proxy: 1 instance (Railway)
├── LiteLLM: 1 instance (Railway)
├── PostgreSQL: Railway managed
├── Redis: Railway add-on
├── ClickHouse: Single VPS
└── Dashboard: Vercel/Railway

At 10 clients:
├── Proxy: 2-3 instances + load balancer
├── LiteLLM: 2 instances
├── PostgreSQL: Railway managed (upgraded plan)
├── Redis: Railway add-on (upgraded)
├── ClickHouse: ClickHouse Cloud
└── Dashboard: Vercel

At 50 clients:
├── Proxy: 5-10 instances + ALB
├── LiteLLM: 3-5 instances
├── PostgreSQL: AWS RDS (db.t3.medium)
├── Redis: AWS ElastiCache
├── ClickHouse: ClickHouse Cloud (production tier)
└── Dashboard: Vercel

At 100 clients (SOC 2):
├── Proxy: Auto-scaling (5-20 instances)
├── LiteLLM: Auto-scaling (3-10 instances)
├── PostgreSQL: AWS RDS Multi-AZ
├── Redis: AWS ElastiCache cluster
├── ClickHouse: Dedicated cluster (3 nodes)
├── Dashboard: Vercel Enterprise
└── Monitoring: Datadog + PagerDuty
```

---

## Common Mistakes to Avoid

### ❌ Don't Do This:
1. **Building features before validating demand**
   - Don't build a mobile app until clients ask for it
   - Don't add 10 different LLM providers until needed
   
2. **Over-engineering early**
   - Don't use Kubernetes in Week 1
   - Don't implement microservices until you have scale problems
   
3. **Skipping testing**
   - Don't deploy to production without testing each week's work
   - Don't skip the 20-prompt routing test
   
4. **Ignoring performance**
   - Don't let cache lookups take > 50ms
   - Don't let dashboard queries take > 2 seconds
   
5. **Poor error handling**
   - Don't let proxy crashes take down client apps
   - Don't lose events if ClickHouse is down

### ✅ Do This Instead:
1. **Validate before building**
   - Ask 3 potential clients if they'd use feature X
   - Build MVPs, not perfect solutions
   
2. **Start simple, scale when needed**
   - Single server → Load balancer → Auto-scaling
   - Follow the build order
   
3. **Test everything**
   - Write tests for critical paths
   - Load test before launching
   
4. **Monitor performance**
   - Set up alerts for p99 latency > 1s
   - Track cache hit rates daily
   
5. **Fail gracefully**
   - Implement circuit breakers
   - Log errors, don't crash

---

## Success Metrics by Week

| Week | Metric | Target |
|------|--------|--------|
| 1 | Proxy works end-to-end | ✓ |
| 2 | Cache hit rate | > 30% |
| 3 | Events logged to ClickHouse | 100% |
| 4 | Routing accuracy | > 90% |
| 5 | Budget enforcement | 100% accurate |
| 6 | Dashboard loads | < 2s |
| 7 | Data isolation | Perfect (0 leaks) |
| 8 | Stripe billing | 100% accurate |
| 9 | Production uptime | > 99.9% |
| 10+ | Customer satisfaction | NPS > 50 |

---

## Final Checklist Before Launch

Before you tell anyone about TokenGuard:

- [ ] Proxy handles 1000 requests without errors
- [ ] Cache hit rate > 30% on real traffic
- [ ] ClickHouse has 10,000+ events
- [ ] Routing saves > 20% on test workload
- [ ] Budget blocks at exact limit
- [ ] Dashboard shows accurate data
- [ ] Multi-tenancy tested with 3 clients
- [ ] Stripe billing tested in test mode
- [ ] Production deployment healthy for 7 days
- [ ] Circuit breaker tested (proxy down scenario)
- [ ] Documentation complete (README, SETUP, CLIENT_INTEGRATION)
- [ ] First client onboarded and sending traffic

---

**Remember**: This is a marathon, not a sprint. Follow the build order. Test thoroughly. Ship weekly. Listen to customers. You'll have a production-grade AI cost control platform in 10 weeks.
