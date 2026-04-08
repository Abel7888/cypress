import clickhouse_connect
import os
import queue
import threading
from dotenv import load_dotenv

load_dotenv()

event_queue = queue.Queue()
_client = None


def get_client():
    global _client
    if _client is None:
        try:
            _client = clickhouse_connect.get_client(
                host=os.getenv("CLICKHOUSE_HOST"),
                port=int(os.getenv("CLICKHOUSE_PORT", 8443)),
                username=os.getenv("CLICKHOUSE_USER", "default"),
                password=os.getenv("CLICKHOUSE_PASSWORD"),
                secure=True
            )
            print("[Logger] Connected to ClickHouse")
        except Exception as e:
            print(f"[Logger] Could not connect: {e}")
            _client = None
    return _client


def log_event(event: dict):
    event_queue.put(event)


def _worker():
    print("[Logger] Background logger started")
    while True:
        try:
            event = event_queue.get(timeout=1)
            client = get_client()
            if client is None:
                print("[Logger] No connection - event dropped")
                continue

            client.insert(
                "tokenguard.events",
                [[
                    event.get("client_id", "unknown"),
                    event.get("agent_id", "unknown"),
                    event.get("workflow_id", "unknown"),
                    event.get("model_requested", "unknown"),
                    event.get("model_used", "unknown"),
                    int(event.get("input_tokens", 0)),
                    int(event.get("output_tokens", 0)),
                    float(event.get("cost_usd", 0.0)),
                    int(event.get("latency_ms", 0)),
                    int(event.get("was_routed", 0)),
                    int(event.get("cache_hit", 0)),
                    int(event.get("blocked", 0)),
                ]],
                column_names=[
                    "client_id", "agent_id", "workflow_id",
                    "model_requested", "model_used",
                    "input_tokens", "output_tokens", "cost_usd",
                    "latency_ms", "was_routed", "cache_hit", "blocked"
                ]
            )
            print(f"[Logger] Event saved - {event.get('model_used')} "
                  f"${event.get('cost_usd', 0):.6f}")

        except queue.Empty:
            continue
        except Exception as e:
            print(f"[Logger] Error saving event: {e}")


logger_thread = threading.Thread(target=_worker, daemon=True)
logger_thread.start()
