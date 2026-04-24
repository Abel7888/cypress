"""
Budget enforcement engine.
Uses fakeredis for Windows compatibility.
Supports per-tenant daily and monthly caps with block and alert actions.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

import redis
import os
import structlog
from pydantic import BaseModel

log = structlog.get_logger()

_redis = redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    decode_responses=True
)

_budgets_cache: dict[str, list] = {}
_alerted_thresholds: dict[str, set] = {}


class BudgetAction(str, Enum):
    ALERT = "alert"
    THROTTLE = "throttle"
    BLOCK = "block"


class BudgetPeriod(str, Enum):
    DAILY = "daily"
    MONTHLY = "monthly"


class BudgetDefinition(BaseModel):
    budget_id: str
    tenant_id: str
    name: str
    period: BudgetPeriod = BudgetPeriod.DAILY
    limit_usd: float
    alert_thresholds: list[int] = [70, 90, 100]
    action_on_limit: BudgetAction = BudgetAction.BLOCK


class BudgetCheckResult(BaseModel):
    allowed: bool = True
    budget_id: Optional[str] = None
    spent_usd: float = 0.0
    limit_usd: float = 0.0
    pct_used: float = 0.0
    action: Optional[BudgetAction] = None
    threshold_breached: Optional[int] = None
    message: str = ""


def _period_key(period: BudgetPeriod) -> str:
    now = datetime.now(timezone.utc)
    if period == BudgetPeriod.DAILY:
        return now.strftime("%Y-%m-%d")
    return now.strftime("%Y-%m")


def _budget_redis_key(budget: BudgetDefinition) -> str:
    period_str = _period_key(budget.period)
    return f"tg:budget:{budget.tenant_id}:{budget.budget_id}:{period_str}"


def _period_ttl_seconds(period: BudgetPeriod) -> int:
    if period == BudgetPeriod.DAILY:
        return 86400 + 3600
    return 31 * 86400 + 3600


def load_budgets(tenant_id: str, budgets: list):
    _budgets_cache[tenant_id] = budgets
    print(f"[Budget] Loaded {len(budgets)} budget(s) for tenant {tenant_id}")


def record_spend(tenant_id: str, cost_usd: float):
    if cost_usd <= 0:
        return
    budgets = _budgets_cache.get(tenant_id, [])
    if not budgets:
        return
    cost_micro = int(cost_usd * 1_000_000)
    for b in budgets:
        key = _budget_redis_key(b)
        _redis.incrby(key, cost_micro)
        _redis.expire(key, _period_ttl_seconds(b.period))


def check_budget(tenant_id: str) -> BudgetCheckResult:
    budgets = _budgets_cache.get(tenant_id, [])
    if not budgets:
        return BudgetCheckResult()

    worst = BudgetCheckResult()

    for b in budgets:
        key = _budget_redis_key(b)
        raw = _redis.get(key)
        spent_micro = int(raw) if raw else 0
        spent_usd = spent_micro / 1_000_000
        pct = (spent_usd / b.limit_usd * 100) if b.limit_usd > 0 else 0

        breached = None
        for t in sorted(b.alert_thresholds, reverse=True):
            if pct >= t:
                breached = t
                break

        alert_key = f"{tenant_id}:{b.budget_id}:{_period_key(b.period)}"
        if alert_key not in _alerted_thresholds:
            _alerted_thresholds[alert_key] = set()

        if breached and breached not in _alerted_thresholds[alert_key]:
            _alerted_thresholds[alert_key].add(breached)
            _fire_alert(b, breached, spent_usd, pct)

        result = BudgetCheckResult(
            budget_id=b.budget_id,
            spent_usd=round(spent_usd, 6),
            limit_usd=b.limit_usd,
            pct_used=round(pct, 2),
            threshold_breached=breached,
        )

        if pct >= 100:
            if b.action_on_limit == BudgetAction.BLOCK:
                result.allowed = False
                result.action = BudgetAction.BLOCK
                result.message = (
                    f"Budget '{b.name}' exhausted. "
                    f"${spent_usd:.6f} of ${b.limit_usd:.4f} used. "
                    f"Requests blocked until period resets."
                )
            elif b.action_on_limit == BudgetAction.THROTTLE:
                result.action = BudgetAction.THROTTLE
                result.message = f"Budget '{b.name}' exhausted. Routing to cheapest model."
            else:
                result.action = BudgetAction.ALERT
                result.message = f"Budget '{b.name}' at {pct:.0f}%."

        if not result.allowed or (result.pct_used > worst.pct_used):
            worst = result
            if not worst.allowed:
                break

    return worst


def get_budget_status(tenant_id: str) -> list[dict]:
    budgets = _budgets_cache.get(tenant_id, [])
    results = []
    for b in budgets:
        key = _budget_redis_key(b)
        raw = _redis.get(key)
        spent_micro = int(raw) if raw else 0
        spent_usd = spent_micro / 1_000_000
        pct = (spent_usd / b.limit_usd * 100) if b.limit_usd > 0 else 0
        results.append({
            "budget_id": b.budget_id,
            "name": b.name,
            "period": b.period.value,
            "limit_usd": b.limit_usd,
            "spent_usd": round(spent_usd, 6),
            "pct_used": round(pct, 2),
            "action_on_limit": b.action_on_limit.value,
            "period_key": _period_key(b.period),
        })
    return results


def reset_budget(tenant_id: str, budget_id: str):
    budgets = _budgets_cache.get(tenant_id, [])
    for b in budgets:
        if b.budget_id == budget_id:
            key = _budget_redis_key(b)
            _redis.delete(key)
            alert_key = f"{tenant_id}:{budget_id}:{_period_key(b.period)}"
            _alerted_thresholds.pop(alert_key, None)
            print(f"[Budget] Reset budget {budget_id} for tenant {tenant_id}")
            return


def _fire_alert(budget: BudgetDefinition, threshold: int, spent_usd: float, pct: float):
    now = datetime.now(timezone.utc).isoformat()
    print(f"\n[Budget] ALERT -- {budget.name}")
    print(f"[Budget]    Tenant  : {budget.tenant_id}")
    print(f"[Budget]    Spent   : ${round(spent_usd, 6)} of ${budget.limit_usd}")
    print(f"[Budget]    Used    : {round(pct, 1)}% (threshold: {threshold}%)")
    print(f"[Budget]    Time    : {now}\n")

    # Fire real alert to dashboard
    import threading
    def _send():
        try:
            import httpx
            dashboard_url = os.getenv("DASHBOARD_URL", "")
            slack_webhook = os.getenv("SLACK_WEBHOOK_URL", "")
            alert_email = os.getenv("ALERT_EMAIL", "")

            if not dashboard_url:
                return

            payload = {
                "tenant_id": budget.tenant_id,
                "employee_name": budget.name,
                "budget_usd": budget.limit_usd,
                "spent_usd": round(spent_usd, 6),
                "percentage": round(pct, 1),
                "threshold": threshold,
                "company": budget.tenant_id,
                "slack_webhook_url": slack_webhook or None,
                "alert_email": alert_email or None,
            }

            httpx.post(
                f"{dashboard_url}/api/alerts",
                json=payload,
                timeout=10,
            )
            print(f"[Budget] Alert sent for {budget.name} at {threshold}%")
        except Exception as e:
            print(f"[Budget] Alert send failed: {e}")

    threading.Thread(target=_send, daemon=True).start()