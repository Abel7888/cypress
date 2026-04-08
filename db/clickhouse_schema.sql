-- TokenGuard ClickHouse Schema
-- High-volume event store for LLM request/response logging and analytics

CREATE DATABASE IF NOT EXISTS tokenguard;

-- ============================================================
-- Core event log: every proxied LLM call lands here
-- ============================================================
CREATE TABLE IF NOT EXISTS tokenguard.llm_events
(
    event_id          UUID DEFAULT generateUUIDv4(),
    tenant_id         String,
    api_key_id        String,
    agent_id          String        DEFAULT '',
    workflow_id       String        DEFAULT '',
    trace_id          String        DEFAULT '',

    -- Request metadata
    request_model     String,
    routed_model      String,
    provider          String,
    endpoint          String,
    method            String        DEFAULT 'POST',
    is_streaming      UInt8         DEFAULT 0,

    -- Token counts
    prompt_tokens     UInt32        DEFAULT 0,
    completion_tokens UInt32        DEFAULT 0,
    total_tokens      UInt32        DEFAULT 0,

    -- Cost (USD micro-cents for precision)
    prompt_cost_usd   Float64       DEFAULT 0,
    completion_cost_usd Float64     DEFAULT 0,
    total_cost_usd    Float64       DEFAULT 0,
    savings_usd       Float64       DEFAULT 0,

    -- Latency
    latency_ms        UInt32        DEFAULT 0,
    time_to_first_token_ms UInt32   DEFAULT 0,

    -- Cache
    cache_hit         UInt8         DEFAULT 0,
    cache_key         String        DEFAULT '',

    -- Routing
    was_downgraded    UInt8         DEFAULT 0,
    routing_reason    String        DEFAULT '',

    -- Status
    status_code       UInt16        DEFAULT 200,
    error_type        String        DEFAULT '',
    error_message     String        DEFAULT '',

    -- Timestamps
    created_at        DateTime64(3) DEFAULT now64(3),
    date              Date          DEFAULT today()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, date, created_at)
TTL date + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- ============================================================
-- Materialized view: hourly cost aggregation per tenant/model
-- ============================================================
CREATE TABLE IF NOT EXISTS tokenguard.hourly_costs
(
    tenant_id         String,
    agent_id          String,
    workflow_id       String,
    provider          String,
    routed_model      String,
    hour              DateTime,

    request_count     UInt64,
    total_tokens      UInt64,
    prompt_tokens     UInt64,
    completion_tokens UInt64,
    total_cost_usd    Float64,
    savings_usd       Float64,
    cache_hits        UInt64,
    avg_latency_ms    Float64,
    p99_latency_ms    Float64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (tenant_id, hour, provider, routed_model, agent_id, workflow_id)
TTL hour + INTERVAL 365 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS tokenguard.mv_hourly_costs
TO tokenguard.hourly_costs
AS
SELECT
    tenant_id,
    agent_id,
    workflow_id,
    provider,
    routed_model,
    toStartOfHour(created_at) AS hour,
    count()                   AS request_count,
    sum(total_tokens)         AS total_tokens,
    sum(prompt_tokens)        AS prompt_tokens,
    sum(completion_tokens)    AS completion_tokens,
    sum(total_cost_usd)       AS total_cost_usd,
    sum(savings_usd)          AS savings_usd,
    sum(cache_hit)            AS cache_hits,
    avg(latency_ms)           AS avg_latency_ms,
    quantile(0.99)(latency_ms) AS p99_latency_ms
FROM tokenguard.llm_events
GROUP BY tenant_id, agent_id, workflow_id, provider, routed_model, hour;

-- ============================================================
-- Materialized view: daily cost aggregation per tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS tokenguard.daily_costs
(
    tenant_id         String,
    provider          String,
    routed_model      String,
    day               Date,

    request_count     UInt64,
    total_tokens      UInt64,
    total_cost_usd    Float64,
    savings_usd       Float64,
    cache_hits        UInt64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (tenant_id, day, provider, routed_model)
TTL day + INTERVAL 730 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS tokenguard.mv_daily_costs
TO tokenguard.daily_costs
AS
SELECT
    tenant_id,
    provider,
    routed_model,
    toDate(created_at) AS day,
    count()            AS request_count,
    sum(total_tokens)  AS total_tokens,
    sum(total_cost_usd) AS total_cost_usd,
    sum(savings_usd)   AS savings_usd,
    sum(cache_hit)     AS cache_hits
FROM tokenguard.llm_events
GROUP BY tenant_id, provider, routed_model, day;

-- ============================================================
-- Budget tracking snapshots (written by aggregator)
-- ============================================================
CREATE TABLE IF NOT EXISTS tokenguard.budget_snapshots
(
    tenant_id         String,
    budget_id         String,
    period_start      Date,
    period_end        Date,
    spent_usd         Float64,
    limit_usd         Float64,
    pct_used          Float64,
    snapshot_at       DateTime64(3) DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(snapshot_at)
ORDER BY (tenant_id, budget_id, period_start);

-- ============================================================
-- Spike detection events (written by spike_detector)
-- ============================================================
CREATE TABLE IF NOT EXISTS tokenguard.spike_events
(
    event_id          UUID DEFAULT generateUUIDv4(),
    tenant_id         String,
    detected_at       DateTime64(3) DEFAULT now64(3),
    metric            String,
    current_value     Float64,
    baseline_value    Float64,
    deviation_pct     Float64,
    severity          Enum8('info' = 1, 'warning' = 2, 'critical' = 3),
    resolved          UInt8 DEFAULT 0
)
ENGINE = MergeTree()
ORDER BY (tenant_id, detected_at)
TTL detected_at + INTERVAL 90 DAY;
