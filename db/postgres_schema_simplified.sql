-- TokenGuard PostgreSQL Schema (Simplified with RLS)
-- Based on the spec's cleaner client-focused approach

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Clients (organizations/tenants)
-- ============================================================
CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    proxy_api_key   VARCHAR(64) UNIQUE NOT NULL,
    key_ref         VARCHAR(255) NOT NULL,  -- reference to secret in AWS Secrets Manager
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_slug ON clients(slug);
CREATE INDEX idx_clients_proxy_key ON clients(proxy_api_key);

-- ============================================================
-- Client Configuration (all settings in one place)
-- ============================================================
CREATE TABLE client_config (
    client_id               UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
    routing_enabled         BOOLEAN DEFAULT true,
    caching_enabled         BOOLEAN DEFAULT true,
    daily_cap_usd           NUMERIC(10,2) DEFAULT 1000,
    monthly_cap_usd         NUMERIC(10,2) DEFAULT 25000,
    alert_threshold_percent INTEGER DEFAULT 80,
    spike_multiplier        NUMERIC(4,2) DEFAULT 2.5,
    slack_webhook           TEXT,
    alert_email             VARCHAR(255),
    preferred_provider      VARCHAR(50) DEFAULT 'anthropic',
    mission_critical_agents TEXT[],
    updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Users (access control)
-- ============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
    email       VARCHAR(255) UNIQUE NOT NULL,
    role        VARCHAR(20) CHECK (role IN ('admin', 'analyst', 'viewer')),
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_client ON users(client_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- Alert Log (audit trail of all alerts fired)
-- ============================================================
CREATE TABLE alert_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
    alert_type  VARCHAR(100),
    payload     JSONB,
    fired_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_alert_log_client ON alert_log(client_id, fired_at DESC);

-- ============================================================
-- Budgets (optional: for more granular budget control)
-- ============================================================
CREATE TABLE budgets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    scope           VARCHAR(50) NOT NULL DEFAULT 'client',  -- client, agent, workflow, model
    scope_id        VARCHAR(255),
    period          VARCHAR(20) NOT NULL DEFAULT 'monthly',  -- daily, weekly, monthly
    limit_usd       NUMERIC(12, 4) NOT NULL,
    alert_thresholds INTEGER[] DEFAULT ARRAY[50, 80, 95],
    action_on_limit VARCHAR(30) NOT NULL DEFAULT 'alert',  -- alert, throttle, block
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_budgets_client ON budgets(client_id);

-- ============================================================
-- Routing Rules (optional: for custom routing logic)
-- ============================================================
CREATE TABLE routing_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    priority        INT NOT NULL DEFAULT 100,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    match_agent_id  VARCHAR(255),
    match_workflow_id VARCHAR(255),
    match_model     VARCHAR(255),
    route_to_model  VARCHAR(255) NOT NULL,
    route_to_provider VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_routing_rules_client ON routing_rules(client_id, priority);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE client_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;

-- Policy: clients can only see their own data
CREATE POLICY client_config_isolation ON client_config
    USING (client_id = current_setting('app.current_client_id')::uuid);

CREATE POLICY alert_log_isolation ON alert_log
    USING (client_id = current_setting('app.current_client_id')::uuid);

CREATE POLICY budgets_isolation ON budgets
    USING (client_id = current_setting('app.current_client_id')::uuid);

CREATE POLICY routing_rules_isolation ON routing_rules
    USING (client_id = current_setting('app.current_client_id')::uuid);

-- ============================================================
-- Updated-at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_client_config_updated_at BEFORE UPDATE ON client_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
