import psycopg2, os
from dotenv import load_dotenv
load_dotenv()
conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL"))
cur = conn.cursor()
cur.execute("UPDATE tenants SET plan = 'starter' WHERE id = '6f96c565-2284-4092-93c4-62252a1c1d59'::uuid")
conn.commit()
cur.close()
conn.close()
print("Plan updated to starter")
