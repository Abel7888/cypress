import psycopg2, os
from dotenv import load_dotenv
load_dotenv()
conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL"))
cur = conn.cursor()
cur.execute("UPDATE api_keys SET cost_usd = 0, total_calls = 0, blocked_calls = 0 WHERE tenant_id = '6f96c565-2284-4092-93c4-62252a1c1d59'::uuid")
conn.commit()
print("Rows updated:", cur.rowcount)
cur.close()
conn.close()
