import psycopg2, os
from dotenv import load_dotenv
load_dotenv()

conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL"))
cur = conn.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS provider_keys (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        provider        VARCHAR(50) NOT NULL,  -- 'openai', 'anthropic', 'google'
        encrypted_key   TEXT NOT NULL,          -- AES-256 encrypted via pgcrypto
        key_preview     VARCHAR(20) NOT NULL,   -- first 8 chars for display e.g. sk-proj-ab
        is_active       BOOLEAN DEFAULT TRUE,
        created_at      TIMESTAMPTZ DEFAULT now(),
        updated_at      TIMESTAMPTZ DEFAULT now(),
        UNIQUE(tenant_id, provider)
    );
    CREATE INDEX IF NOT EXISTS idx_provider_keys_tenant
        ON provider_keys(tenant_id, provider);
""")

conn.commit()
cur.close()
conn.close()
print("Migration complete — provider_keys table created.")
