import json
import hashlib
from datetime import datetime

print("[Cache] Loading cache module...")
import fakeredis
redis_client = fakeredis.FakeRedis()
print("[Cache] Cache ready")

CACHE_TTL_SECONDS = 86400


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
            "response": response,
            "cached_at": datetime.utcnow().isoformat()
        }
        redis_client.setex(cache_key, CACHE_TTL_SECONDS, json.dumps(entry))
        print(f"[Cache] STORED - {cache_key}")
    except Exception as e:
        print(f"[Cache] Store failed: {e}")


def get_cache_stats(client_id: str) -> dict:
    keys = redis_client.keys(f"tg:cache:{client_id}:*")
    return {
        "client_id": client_id,
        "cached_prompts": len(keys),
        "note": "exact-match cache active"
    }


def clear_cache(client_id: str) -> int:
    keys = redis_client.keys(f"tg:cache:{client_id}:*")
    if keys:
        redis_client.delete(*keys)
    return len(keys)
