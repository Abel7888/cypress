import httpx, os, json, sys

BASE = os.getenv("DEMO_PROXY_URL", "http://localhost:8000")
ADMIN_KEY = os.getenv("TOKENGUARD_SECRET_KEY")

h = {"Authorization": f"Bearer {ADMIN_KEY}", "Content-Type": "application/json"}

def seed():
    print(f"\nSeeding demo against {BASE}...\n")

    r = httpx.post(f"{BASE}/api/tenants", headers=h, json={
        "name": "Acme Corp (Demo)",
        "monthly_budget_usd": 500.00,
        "plan": "growth"
    })
    print(r.text)
    tenant = r.json()
    tenant_id = tenant["tenant_id"]
    print(f"Tenant ID: {tenant_id}\n")

    employees = [
        {"name": "Sarah (Engineering)", "monthly_budget_usd": 200.00},
        {"name": "Marcus (Sales)", "monthly_budget_usd": 50.00},
        {"name": "Jamie (Blocked)", "monthly_budget_usd": 25.00},
    ]

    state = {"tenant_id": tenant_id, "keys": {}}

    for emp in employees:
        r = httpx.post(f"{BASE}/api/tenants/{tenant_id}/users", headers=h, json=emp)
        data = r.json()
        key = data["api_key"]
        state["keys"][emp["name"]] = key
        print(f"{emp['name']}: {key}")

    with open("demo_state.json", "w") as f:
        json.dump(state, f, indent=2)

    print(f"\nDemo state saved to demo_state.json")

if __name__ == "__main__":
    seed()
