import clickhouse_connect
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

client = clickhouse_connect.get_client(
    host=os.getenv("CLICKHOUSE_HOST"),
    port=int(os.getenv("CLICKHOUSE_PORT", 8443)),
    username=os.getenv("CLICKHOUSE_USER", "default"),
    password=os.getenv("CLICKHOUSE_PASSWORD"),
    secure=True
)

print("Connected to ClickHouse")

client.command("CREATE DATABASE IF NOT EXISTS tokenguard")
print("Database created")

client.command("""
CREATE TABLE IF NOT EXISTS tokenguard.events
(
    event_id        String DEFAULT toString(generateUUIDv4()),
    client_id       String,
    agent_id        String,
    workflow_id     String,
    model_requested String,
    model_used      String,
    input_tokens    UInt32,
    output_tokens   UInt32,
    cost_usd        Float64,
    latency_ms      UInt32,
    was_routed      UInt8,
    cache_hit       UInt8,
    blocked         UInt8,
    created_at      DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toDate(created_at)
ORDER BY (client_id, created_at)
""")
print("Events table created")

count = client.query("SELECT count() FROM tokenguard.events")
print(f"Row count: {count.result_rows[0][0]}")
print("Schema setup complete")
