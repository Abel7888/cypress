import psycopg2, os
from dotenv import load_dotenv
load_dotenv()
conn = psycopg2.connect(dsn=os.getenv("DATABASE_URL"))
cur = conn.cursor()
cur.execute("""
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE column_name IN ('cost_usd', 'spent', 'total_calls', 'blocked_calls')
    AND table_schema = 'public'
""")
for row in cur.fetchall():
    print(row)
cur.close()
conn.close()
