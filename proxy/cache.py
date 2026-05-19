import json
import hashlib
from datetime import datetime

print("[Cache] Loading cache module...")
import redis
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url, decode_responses=False)
print(f"[Cache] Connected to Redis: {redis_url[:30]}...")

CACHE_TTL_SECONDS = 86400  # 24 hours


def extract_prompt_text(body: dict) -> str:
    messages = body.get("messages", [])
    parts = []
    for message in messages:
        content = message.get("content", "")
        if isinstance(content, str):
            parts.append(content)
    return " ".join(parts).strip()


def is_cacheable(body: dict) -> bool:
    prompt_text = extract_prompt_text(body)
    if len(prompt_text.split()) < 4:
        return False
    if body.get("stream", False):
        return False
    return True


def check_cache(body: dict, client_id: str):
    if not is_cacheable(body):
        return None
    prompt_text = extract_prompt_text(body)
    prompt_hash = hashlib.md5(prompt_text.strip().lower().encode()).hexdigest()
    cache_key = f"tg:cache:{client_id}:{prompt_hash}"
    entry = redis_client.get(cache_key)
    if entry:
        print(f"[Cache] HIT - {cache_key}")
        return json.loads(entry)["response"]
    print(f"[Cache] MISS - {cache_key}")
    return None


def store_in_cache(body: dict, response: dict, client_id: str):
    if not is_cacheable(body):
        return
    prompt_text = extract_prompt_text(body)
    try:
        prompt_hash = hashlib.md5(prompt_text.strip().lower().encode()).hexdigest()
        cache_key = f"tg:cache:{client_id}:{prompt_hash}"
        entry = {
            "response":  response,
            "cached_at": datetime.utcnow().isoformat(),
            "model":     response.get("model", "unknown"),
        }
        redis_client.setex(cache_key, CACHE_TTL_SECONDS, json.dumps(entry))
        print(f"[Cache] STORED - {cache_key}")
    except Exception as e:
        print(f"[Cache] Store failed: {e}")


def get_cache_stats(client_id: str) -> dict:
    """
    Count cached prompts for a tenant using non-blocking SCAN.
    Safe at any Redis keyspace size — unlike KEYS which blocks the event loop.
    """
    keys = list(redis_client.scan_iter(f"tg:cache:{client_id}:*"))
    return {
        "client_id":      client_id,
        "cached_prompts": len(keys),
        "ttl_hours":      CACHE_TTL_SECONDS // 3600,
        "note":           "exact-match cache · 24hr TTL",
    }


def clear_cache(client_id: str) -> int:
    """
    Delete all cached prompts for a tenant using non-blocking SCAN.
    Returns count of deleted entries.
    """
    keys = list(redis_client.scan_iter(f"tg:cache:{client_id}:*"))
    if keys:
        redis_client.delete(*keys)
    print(f"[Cache] Cleared {len(keys)} entries for {client_id}")
    return len(keys)


def clear_all_cache():
    """Clear all cached entries from Redis."""
    keys = list(redis_client.scan_iter("tg:cache:*"))
    if keys:
        redis_client.delete(*keys)
    print(f"[Cache] Cleared {len(keys)} total entries")
    return len(keys)
