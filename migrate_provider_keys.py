import psycopg2, os
from dotenv import load_dotenv
load_dotenv()
conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL"))
cur = conn.cursor()
cur.execute("""
    CREATE TABLE IF NOT EXISTS provider_keys (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        provider      VARCHAR(50) NOT NULL,
        encrypted_key TEXT NOT NULL,
        key_preview   VARCHAR(20) NOT NULL,
        is_active     BOOLEAN DEFAULT TRUE,
        created_at    TIMESTAMPTZ DEFAULT now(),
        updated_at    TIMESTAMPTZ DEFAULT now(),
        UNIQUE(tenant_id, provider)
    );
    CREATE INDEX IF NOT EXISTS idx_provider_keys_tenant ON provider_keys(tenant_id, provider);
""")
conn.commit()
cur.close()
conn.close()
print("Migration complete.")
