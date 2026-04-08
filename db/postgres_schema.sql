-- TokenGuard PostgreSQL Schema
-- Relational data: tenants, API keys, budgets, routing rules, users

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Tenants (organizations)
-- ============================================================
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(128) NOT NULL UNIQUE,
    plan            VARCHAR(50)  NOT NULL DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    clerk_org_id    VARCHAR(255) UNIQUE,
    settings        JSONB        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_clerk_org ON tenants(clerk_org_id);

-- ============================================================
-- Users (synced from Clerk)
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    clerk_user_id   VARCHAR(255) NOT NULL UNIQUE,
    email           VARCHAR(320) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'member',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_clerk ON users(clerk_user_id);

-- ============================================================
-- API Keys (encrypted provider keys stored by tenant)
-- ============================================================
CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    provider        VARCHAR(50)  NOT NULL,  -- openai, anthropic, etc.
    encrypted_key   TEXT         NOT NULL,
    key_prefix      VARCHAR(12)  NOT NULL,  -- first chars for display
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);

-- ============================================================
-- Proxy Keys (keys tenants use to call TokenGuard)
-- ============================================================
CREATE TABLE proxy_keys (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL DEFAULT 'Default',
    key_hash        VARCHAR(128) NOT NULL UNIQUE,
    key_prefix      VARCHAR(12)  NOT NULL,
    scopes          JSONB        NOT NULL DEFAULT '["*"]',
    rate_limit_rpm  INT          NOT NULL DEFAULT 600,
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_proxy_keys_hash ON proxy_keys(key_hash);
CREATE INDEX idx_proxy_keys_tenant ON proxy_keys(tenant_id);

-- ============================================================
-- Budgets
-- ============================================================
CREATE TABLE budgets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    scope           VARCHAR(50)  NOT NULL DEFAULT 'tenant',  -- tenant, agent, workflow, model
    scope_id        VARCHAR(255) DEFAULT NULL,
    period          VARCHAR(20)  NOT NULL DEFAULT 'monthly',  -- daily, weekly, monthly
    limit_usd       NUMERIC(12, 4) NOT NULL,
    alert_thresholds JSONB       NOT NULL DEFAULT '[50, 80, 95]',
    action_on_limit VARCHAR(30)  NOT NULL DEFAULT 'alert',  -- alert, throttle, block
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX idx_budgets_scope ON budgets(tenant_id, scope, scope_id);

-- ============================================================
-- Routing Rules
-- ============================================================
CREATE TABLE routing_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    priority        INT          NOT NULL DEFAULT 100,
    is_active       BOOLEAN      NOT NULL DEFAULT true,

    -- Match conditions
    match_agent_id  VARCHAR(255),
    match_workflow_id VARCHAR(255),
    match_model     VARCHAR(255),
    match_min_tokens INT,
    match_max_tokens INT,

    -- Action
    route_to_model  VARCHAR(255) NOT NULL,
    route_to_provider VARCHAR(50),

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_routing_rules_tenant ON routing_rules(tenant_id, priority);

-- ============================================================
-- Alert History
-- ============================================================
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    budget_id       UUID         REFERENCES budgets(id) ON DELETE SET NULL,
    alert_type      VARCHAR(50)  NOT NULL,  -- budget_threshold, spike, anomaly
    severity        VARCHAR(20)  NOT NULL DEFAULT 'warning',
    title           VARCHAR(500) NOT NULL,
    message         TEXT         NOT NULL,
    metadata        JSONB        NOT NULL DEFAULT '{}',
    channels_sent   JSONB        NOT NULL DEFAULT '[]',
    acknowledged    BOOLEAN      NOT NULL DEFAULT false,
    acknowledged_by UUID         REFERENCES users(id),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_tenant ON alerts(tenant_id, created_at DESC);

-- ============================================================
-- Notification Channels
-- ============================================================
CREATE TABLE notification_channels (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_type    VARCHAR(30)  NOT NULL,  -- email, slack, webhook
    name            VARCHAR(255) NOT NULL,
    config          JSONB        NOT NULL,  -- encrypted webhook URL, email list, etc.
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_channels_tenant ON notification_channels(tenant_id);

-- ============================================================
-- Recommendations (generated by recommender service)
-- ============================================================
CREATE TABLE recommendations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rec_type        VARCHAR(50)  NOT NULL,  -- model_switch, cache_enable, budget_adjust
    title           VARCHAR(500) NOT NULL,
    description     TEXT         NOT NULL,
    estimated_savings_usd NUMERIC(12, 4),
    metadata        JSONB        NOT NULL DEFAULT '{}',
    status          VARCHAR(30)  NOT NULL DEFAULT 'pending',  -- pending, accepted, dismissed
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendations_tenant ON recommendations(tenant_id, status);

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

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_routing_rules_updated_at BEFORE UPDATE ON routing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_notif_channels_updated_at BEFORE UPDATE ON notification_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_recommendations_updated_at BEFORE UPDATE ON recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
