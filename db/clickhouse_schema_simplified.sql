-- TokenGuard ClickHouse Schema (Simplified with Materialized Views)
-- Based on the spec's cleaner approach to aggregation

CREATE DATABASE IF NOT EXISTS tokenguard;

-- ============================================================
-- Core event log: every proxied LLM call lands here
-- ============================================================
CREATE TABLE IF NOT EXISTS tokenguard.events
(
    event_id          UUID DEFAULT generateUUIDv4(),
    client_id         String,
    agent_id          String,
    workflow_id       String,
    model_requested   String,
    model_used        String,
    input_tokens      UInt32,
    output_tokens     UInt32,
    cost_usd          Float64,
    latency_ms        UInt32,
    was_routed        UInt8,
    cache_hit         UInt8,
    blocked           UInt8,
    created_at        DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY (client_id, toDate(created_at))
ORDER BY (client_id, created_at)
TTL created_at + INTERVAL 2 YEAR;

-- ============================================================
-- Pre-aggregated daily summary for fast dashboard queries
-- ============================================================
CREATE TABLE IF NOT EXISTS tokenguard.daily_summary
(
    client_id         String,
    summary_date      Date,
    total_calls       UInt64,
    total_cost_usd    Float64,
    routed_calls      UInt64,
    cache_hits        UInt64,
    blocked_calls     UInt64,
    routing_savings   Float64,
    cache_savings     Float64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(summary_date)
ORDER BY (client_id, summary_date);

-- ============================================================
-- Materialized view to auto-populate daily summary
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS tokenguard.daily_summary_mv
TO tokenguard.daily_summary AS
SELECT
    client_id,
    toDate(created_at)          AS summary_date,
    count()                     AS total_calls,
    sum(cost_usd)               AS total_cost_usd,
    countIf(was_routed = 1)     AS routed_calls,
    countIf(cache_hit = 1)      AS cache_hits,
    countIf(blocked = 1)        AS blocked_calls,
    0                           AS routing_savings,
    0                           AS cache_savings
FROM tokenguard.events
GROUP BY client_id, summary_date;

-- ============================================================
-- Model breakdown aggregation
-- ============================================================
CREATE TABLE IF NOT EXISTS tokenguard.model_summary
(
    client_id         String,
    model_used        String,
    summary_date      Date,
    total_calls       UInt64,
    total_cost_usd    Float64,
    total_tokens      UInt64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(summary_date)
ORDER BY (client_id, summary_date, model_used);

CREATE MATERIALIZED VIEW IF NOT EXISTS tokenguard.model_summary_mv
TO tokenguard.model_summary AS
SELECT
    client_id,
    model_used,
    toDate(created_at)                AS summary_date,
    count()                           AS total_calls,
    sum(cost_usd)                     AS total_cost_usd,
    sum(input_tokens + output_tokens) AS total_tokens
FROM tokenguard.events
GROUP BY client_id, model_used, summary_date;
