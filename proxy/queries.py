import clickhouse_connect
import os
from dotenv import load_dotenv

load_dotenv()


def get_client():
    return clickhouse_connect.get_client(
        host=os.getenv("CLICKHOUSE_HOST"),
        port=int(os.getenv("CLICKHOUSE_PORT", 8443)),
        username=os.getenv("CLICKHOUSE_USER", "default"),
        password=os.getenv("CLICKHOUSE_PASSWORD"),
        secure=True
    )


def get_total_events(client_id: str) -> int:
    client = get_client()
    result = client.query(
        "SELECT count() FROM tokenguard.events WHERE client_id = {client_id:String}",
        parameters={"client_id": client_id}
    )
    return result.result_rows[0][0]


def get_total_cost(client_id: str) -> float:
    client = get_client()
    result = client.query(
        "SELECT sum(cost_usd) FROM tokenguard.events WHERE client_id = {client_id:String}",
        parameters={"client_id": client_id}
    )
    return round(float(result.result_rows[0][0]), 6)


def get_spend_by_model(client_id: str) -> list:
    client = get_client()
    result = client.query(
        """
        SELECT model_used, sum(cost_usd) as total_cost, count() as calls
        FROM tokenguard.events
        WHERE client_id = {client_id:String}
        GROUP BY model_used
        ORDER BY total_cost DESC
        """,
        parameters={"client_id": client_id}
    )
    return [{"model": r[0], "cost": round(r[1], 6), "calls": r[2]}
            for r in result.result_rows]


def get_cache_savings(client_id: str) -> dict:
    client = get_client()
    result = client.query(
        """
        SELECT
            countIf(cache_hit = 1) as cache_hits,
            countIf(cache_hit = 0) as api_calls,
            sum(cost_usd) as total_cost
        FROM tokenguard.events
        WHERE client_id = {client_id:String}
        """,
        parameters={"client_id": client_id}
    )
    row = result.result_rows[0]
    return {
        "cache_hits": row[0],
        "api_calls": row[1],
        "total_cost_usd": round(float(row[2]), 6)
    }


if __name__ == "__main__":
    print("Testing queries...")
    print(f"Total events : {get_total_events('client-default')}")
    print(f"Total cost   : ${get_total_cost('client-default')}")
    print(f"By model     : {get_spend_by_model('client-default')}")
    print(f"Cache stats  : {get_cache_savings('client-default')}")
