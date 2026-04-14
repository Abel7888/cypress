import clickhouse_connect
import os
import random
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

TENANT_ID = "6f96c565-2284-4092-93c4-62252a1c1d59"

PRICING = {
    "claude-opus-4-6":   (0.015, 0.075),
    "claude-sonnet-4-6": (0.003, 0.015),
    "claude-haiku-4-5":  (0.00025, 0.00125),
    "gpt-4o":            (0.005, 0.015),
    "gpt-4o-mini":       (0.00015, 0.0006),
    "cache":             (0.0, 0.0),
    "blocked":           (0.0, 0.0),
}

def calc_cost(model, input_tok, output_tok):
    rates = PRICING.get(model, (0.005, 0.015))
    return round((input_tok/1000*rates[0]) + (output_tok/1000*rates[1]), 6)

def make_event(employee, day_offset, model_requested, model_used, was_routed, is_cache, is_blocked, token_range=(8000,20000)):
    ts = datetime.now(timezone.utc) - timedelta(days=day_offset) + timedelta(
        hours=random.randint(8,18), minutes=random.randint(0,59), seconds=random.randint(0,59))
    if is_blocked:
        return [TENANT_ID, employee, "unknown", model_requested, "blocked", 2000, 0, 0.0, 0, 0, 0, 1, ts]
    if is_cache:
        return [TENANT_ID, employee, "unknown", model_requested, "cache", random.randint(1000,3000), 0, 0.0, random.randint(2,8), 0, 1, 0, ts]
    input_tok = random.randint(*token_range)
    output_tok = random.randint(input_tok//3, input_tok//2)
    cost = calc_cost(model_used, input_tok, output_tok)
    return [TENANT_ID, employee, "unknown", model_requested, model_used, input_tok, output_tok, cost, random.randint(300,2000), was_routed, 0, 0, ts]

def main():
    print("Connecting to ClickHouse...")
    ch = clickhouse_connect.get_client(
        host=os.getenv("CLICKHOUSE_HOST"),
        port=int(os.getenv("CLICKHOUSE_PORT", 8443)),
        username=os.getenv("CLICKHOUSE_USER", "default"),
        password=os.getenv("CLICKHOUSE_PASSWORD"),
        secure=True
    )
    print("Connected.\n")

    COLUMNS = ["client_id","agent_id","workflow_id","model_requested","model_used",
               "input_tokens","output_tokens","cost_usd","latency_ms","was_routed","cache_hit","blocked","created_at"]

    all_events = []

    # SARAH — Engineering, heavy Claude Opus user, 15-20 calls/day
    for day in range(1, 31):
        for _ in range(random.randint(15, 20)):
            r = random.random()
            if r < 0.65:
                all_events.append(make_event("Sarah (Engineering)", day, "claude-opus-4-6", "cache", 0, True, False))
            elif r < 0.90:
                all_events.append(make_event("Sarah (Engineering)", day, "claude-opus-4-6", "claude-sonnet-4-6", 1, False, False, (10000,25000)))
            else:
                all_events.append(make_event("Sarah (Engineering)", day, "gpt-4o", "gpt-4o-mini", 1, False, False, (8000,18000)))

    # MARCUS — Sales, GPT-4o user, very repetitive queries so high cache
    for day in range(1, 31):
        for _ in range(random.randint(12, 18)):
            r = random.random()
            if r < 0.72:
                all_events.append(make_event("Marcus (Sales)", day, "gpt-4o", "cache", 0, True, False))
            else:
                all_events.append(make_event("Marcus (Sales)", day, "gpt-4o", "gpt-4o-mini", 1, False, False, (6000,15000)))

    # JAMIE — Finance, high volume Opus user, gets blocked 8 times
    block_days = [7, 14, 21, 25, 28]
    for day in range(1, 31):
        if day in block_days:
            for _ in range(random.randint(1, 2)):
                all_events.append(make_event("Jamie (Blocked)", day, "gpt-4o", "blocked", 0, False, True))
        for _ in range(random.randint(8, 14)):
            r = random.random()
            if r < 0.45:
                all_events.append(make_event("Jamie (Blocked)", day, "gpt-4o", "cache", 0, True, False))
            elif r < 0.75:
                all_events.append(make_event("Jamie (Blocked)", day, "gpt-4o", "gpt-4o-mini", 1, False, False, (8000,20000)))
            else:
                all_events.append(make_event("Jamie (Blocked)", day, "claude-opus-4-6", "claude-sonnet-4-6", 1, False, False, (10000,22000)))

    batch_size = 200
    total = len(all_events)
    print(f"Inserting {total} events...")
    for i in range(0, total, batch_size):
        ch.insert("tokenguard.events", all_events[i:i+batch_size], column_names=COLUMNS)
        print(f"  {min(100, round((i+batch_size)/total*100))}% — {min(i+batch_size,total)}/{total}")

    total_cost = sum(ev[7] for ev in all_events)
    total_calls = len(all_events)
    cache_hits  = sum(1 for ev in all_events if ev[10]==1)
    routed      = sum(1 for ev in all_events if ev[9]==1)
    blocked     = sum(1 for ev in all_events if ev[11]==1)

    cost_without = 0.0
    for ev in all_events:
        if ev[4] not in ("cache","blocked"):
            cost_without += calc_cost(ev[3], ev[5], ev[6])
        elif ev[10]==1:
            cost_without += calc_cost(ev[3], random.randint(8000,20000), random.randint(3000,8000))

    routing_savings = cost_without - total_cost
    cache_savings   = sum(
        calc_cost(ev[3], random.randint(8000,18000), random.randint(3000,7000))
        for ev in all_events if ev[10]==1
    )
    total_saved = routing_savings + cache_savings
    tg_fee      = 299
    net         = total_saved - tg_fee
    roi         = total_saved / tg_fee

    print(f"\n── Seed complete ──────────────────────────────")
    print(f"  Total events:       {total_calls}")
    print(f"  Cache hits:         {cache_hits} ({round(cache_hits/total_calls*100)}%)")
    print(f"  Routed calls:       {routed} ({round(routed/total_calls*100)}%)")
    print(f"  Blocked calls:      {blocked}")
    print(f"  Actual spend:       ${total_cost:.2f}")
    print(f"  Spend without TG:   ${cost_without:.2f}")
    print(f"  Routing savings:    ${routing_savings:.2f}")
    print(f"  Cache savings:      ${cache_savings:.2f}")
    print(f"  Total saved:        ${total_saved:.2f}")
    print(f"  TokenGuard fee:     ${tg_fee}")
    print(f"  Net benefit:        ${net:.2f}")
    print(f"  ROI:                {roi:.1f}x")
    print(f"\nRefresh your dashboard now.")

if __name__ == "__main__":
    main()
