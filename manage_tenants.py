import psycopg2
import os
import secrets
from dotenv import load_dotenv

load_dotenv()

def add_tenant(name):
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()

    # Create tenant
    cur.execute(
        "INSERT INTO tenants (name) VALUES (%s) ON CONFLICT (name) DO NOTHING RETURNING id",
        (name,)
    )
    row = cur.fetchone()
    if row is None:
        print(f"Tenant '{name}' already exists")
        conn.close()
        return

    tenant_id = row[0]

    # Generate API key
    api_key = "tg-" + secrets.token_hex(24)

    cur.execute(
        "INSERT INTO api_keys (tenant_id, key, label) VALUES (%s, %s, %s)",
        (tenant_id, api_key, f"{name}-default")
    )

    conn.commit()
    cur.close()
    conn.close()

    print(f"Tenant created: {name}")
    print(f"API Key: {api_key}")
    print("Save this key — it will not be shown again")

add_tenant("client_one")
add_tenant("client_two")
