"""
Recommendation engine.
Analyses tenant usage patterns and generates actionable cost-saving
recommendations:
- Model switch suggestions (e.g., GPT-4o → GPT-4o-mini for simple tasks)
- Cache enablement opportunities
- Budget adjustment suggestions
- Unused capacity alerts

Runs periodically and writes recommendations to PostgreSQL.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import asyncpg
import clickhouse_connect
import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pydantic import BaseModel
from pydantic_settings import BaseSettings

log = structlog.get_logger()


class RecommenderSettings(BaseSettings):
    clickhouse_host: str = "localhost"
    clickhouse_port: int = 8123
    clickhouse_db: str = "tokenguard"
    clickhouse_user: str = "default"
    clickhouse_password: str = ""
    database_url: str = "postgresql://localhost:5432/tokenguard"
    recommendation_interval_minutes: int = 60
    analysis_lookback_days: int = 30
    min_requests_for_recommendation: int = 100
    model_switch_savings_threshold_pct: float = 20.0

    class Config:
        env_prefix = ""


settings = RecommenderSettings()

# Cost per token for savings estimation
MODEL_COSTS = {
    "gpt-4o": {"input": 2.50e-6, "output": 10.0e-6},
    "gpt-4o-mini": {"input": 0.15e-6, "output": 0.60e-6},
    "gpt-4-turbo": {"input": 10.0e-6, "output": 30.0e-6},
    "claude-3.5-sonnet": {"input": 3.0e-6, "output": 15.0e-6},
    "claude-3.5-haiku": {"input": 0.80e-6, "output": 4.0e-6},
    "claude-3-opus": {"input": 15.0e-6, "output": 75.0e-6},
}

# Suggested downgrade targets
DOWNGRADE_SUGGESTIONS = {
    "gpt-4o": "gpt-4o-mini",
    "gpt-4-turbo": "gpt-4o-mini",
    "claude-3.5-sonnet": "claude-3.5-haiku",
    "claude-3-opus": "claude-3.5-sonnet",
}


class Recommendation(BaseModel):
    tenant_id: str
    rec_type: str
    title: str
    description: str
    estimated_savings_usd: float = 0.0
    metadata: dict = {}


class Recommender:
    """Generates cost-saving recommendations from usage data."""

    def __init__(self):
        self._ch_client: Any = None
        self._pg_pool: Optional[asyncpg.Pool] = None
        self._scheduler = AsyncIOScheduler()

    def _get_ch(self):
        if self._ch_client is None:
            self._ch_client = clickhouse_connect.get_client(
                host=settings.clickhouse_host,
                port=settings.clickhouse_port,
                database=settings.clickhouse_db,
                username=settings.clickhouse_user,
                password=settings.clickhouse_password,
            )
        return self._ch_client

    async def start(self):
        self._pg_pool = await asyncpg.create_pool(settings.database_url, min_size=2, max_size=5)
        self._scheduler.add_job(
            self.generate_all_recommendations,
            "interval",
            minutes=settings.recommendation_interval_minutes,
            id="recommendations",
            replace_existing=True,
        )
        self._scheduler.start()
        log.info("recommender.started")

    async def stop(self):
        self._scheduler.shutdown(wait=False)
        if self._pg_pool:
            await self._pg_pool.close()
        if self._ch_client:
            self._ch_client.close()
        log.info("recommender.stopped")

    async def generate_all_recommendations(self):
        """Run all recommendation generators for all tenants."""
        log.info("recommender.run.start")
        try:
            tenants = await self._get_active_tenants()
            for tenant_id in tenants:
                recs = []
                recs.extend(await self._model_switch_recommendations(tenant_id))
                recs.extend(await self._cache_recommendations(tenant_id))
                recs.extend(await self._budget_recommendations(tenant_id))

                if recs:
                    await self._save_recommendations(recs)
                    log.info("recommender.generated", tenant_id=tenant_id, count=len(recs))

            log.info("recommender.run.done", tenants=len(tenants))
        except Exception:
            log.exception("recommender.run.error")

    async def _get_active_tenants(self) -> list[str]:
        """Get tenants with recent activity."""
        ch = self._get_ch()
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: ch.query(
                "SELECT DISTINCT tenant_id FROM llm_events WHERE created_at >= %(cutoff)s",
                parameters={"cutoff": cutoff},
            ),
        )
        return [row[0] for row in result.result_rows] if result.result_rows else []

    async def _model_switch_recommendations(self, tenant_id: str) -> list[Recommendation]:
        """Suggest cheaper models where usage patterns allow."""
        recs = []
        ch = self._get_ch()
        cutoff = datetime.now(timezone.utc) - timedelta(days=settings.analysis_lookback_days)

        query = """
            SELECT
                routed_model,
                count() AS req_count,
                sum(total_cost_usd) AS total_cost,
                sum(prompt_tokens) AS total_prompt,
                sum(completion_tokens) AS total_completion,
                avg(latency_ms) AS avg_latency,
                countIf(was_downgraded = 1) AS already_downgraded,
                countIf(status_code >= 400) AS error_count
            FROM llm_events
            WHERE tenant_id = %(tid)s AND created_at >= %(cutoff)s
            GROUP BY routed_model
            HAVING req_count >= %(min_req)s
            ORDER BY total_cost DESC
        """
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: ch.query(query, parameters={
                "tid": tenant_id,
                "cutoff": cutoff,
                "min_req": settings.min_requests_for_recommendation,
            }),
        )

        if not result.result_rows:
            return recs

        for row in result.result_rows:
            model = row[0]
            req_count = int(row[1])
            total_cost = float(row[2])
            total_prompt = int(row[3])
            total_completion = int(row[4])
            error_rate = float(row[7]) / req_count if req_count > 0 else 0

            suggested = DOWNGRADE_SUGGESTIONS.get(model)
            if not suggested or model == suggested:
                continue

            # Estimate savings
            current_costs = MODEL_COSTS.get(model, {})
            suggested_costs = MODEL_COSTS.get(suggested, {})
            if not current_costs or not suggested_costs:
                continue

            current_total = (
                total_prompt * current_costs.get("input", 0)
                + total_completion * current_costs.get("output", 0)
            )
            suggested_total = (
                total_prompt * suggested_costs.get("input", 0)
                + total_completion * suggested_costs.get("output", 0)
            )
            savings = current_total - suggested_total
            savings_pct = (savings / current_total * 100) if current_total > 0 else 0

            if savings_pct < settings.model_switch_savings_threshold_pct:
                continue

            recs.append(Recommendation(
                tenant_id=tenant_id,
                rec_type="model_switch",
                title=f"Switch {model} → {suggested}",
                description=(
                    f"You made {req_count:,} requests to {model} in the last "
                    f"{settings.analysis_lookback_days} days, costing ${total_cost:.2f}. "
                    f"Switching to {suggested} could save ~${savings:.2f} "
                    f"({savings_pct:.0f}%). Error rate: {error_rate:.1%}."
                ),
                estimated_savings_usd=round(savings, 2),
                metadata={
                    "current_model": model,
                    "suggested_model": suggested,
                    "request_count": req_count,
                    "savings_pct": round(savings_pct, 1),
                },
            ))

        return recs

    async def _cache_recommendations(self, tenant_id: str) -> list[Recommendation]:
        """Identify high cache-miss rates with cacheable patterns."""
        recs = []
        ch = self._get_ch()
        cutoff = datetime.now(timezone.utc) - timedelta(days=settings.analysis_lookback_days)

        query = """
            SELECT
                routed_model,
                count() AS total_requests,
                sum(cache_hit) AS cache_hits,
                sum(total_cost_usd) AS total_cost
            FROM llm_events
            WHERE tenant_id = %(tid)s AND created_at >= %(cutoff)s
            GROUP BY routed_model
            HAVING total_requests >= %(min_req)s
        """
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: ch.query(query, parameters={
                "tid": tenant_id,
                "cutoff": cutoff,
                "min_req": settings.min_requests_for_recommendation,
            }),
        )

        if not result.result_rows:
            return recs

        for row in result.result_rows:
            model = row[0]
            total_requests = int(row[1])
            cache_hits = int(row[2])
            total_cost = float(row[3])

            hit_rate = cache_hits / total_requests if total_requests > 0 else 0

            if hit_rate < 0.05 and total_cost > 1.0:
                estimated_cacheable = total_requests * 0.15  # assume 15% could be cached
                estimated_savings = total_cost * 0.15

                recs.append(Recommendation(
                    tenant_id=tenant_id,
                    rec_type="cache_enable",
                    title=f"Enable caching for {model}",
                    description=(
                        f"Your cache hit rate for {model} is only {hit_rate:.1%}. "
                        f"With {total_requests:,} requests costing ${total_cost:.2f}, "
                        f"enabling prompt caching could save ~${estimated_savings:.2f}/month."
                    ),
                    estimated_savings_usd=round(estimated_savings, 2),
                    metadata={
                        "model": model,
                        "current_hit_rate": round(hit_rate, 3),
                        "total_requests": total_requests,
                    },
                ))

        return recs

    async def _budget_recommendations(self, tenant_id: str) -> list[Recommendation]:
        """Suggest budget adjustments based on actual spend patterns."""
        recs = []
        ch = self._get_ch()
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        query = """
            SELECT sum(total_cost_usd) AS monthly_cost
            FROM llm_events
            WHERE tenant_id = %(tid)s AND created_at >= %(start)s
        """
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: ch.query(query, parameters={"tid": tenant_id, "start": month_start}),
        )

        if not result.result_rows or not result.result_rows[0][0]:
            return recs

        monthly_cost = float(result.result_rows[0][0])
        days_elapsed = max((now - month_start).days, 1)
        projected_monthly = monthly_cost / days_elapsed * 30

        if projected_monthly > 100 and not await self._tenant_has_budget(tenant_id):
            recs.append(Recommendation(
                tenant_id=tenant_id,
                rec_type="budget_adjust",
                title="Set up a monthly budget",
                description=(
                    f"Your projected monthly spend is ${projected_monthly:.2f} "
                    f"(${monthly_cost:.2f} spent in {days_elapsed} days). "
                    f"Consider setting a budget to prevent bill surprises."
                ),
                estimated_savings_usd=0,
                metadata={
                    "current_spend": round(monthly_cost, 2),
                    "projected_monthly": round(projected_monthly, 2),
                    "days_elapsed": days_elapsed,
                },
            ))

        return recs

    async def _tenant_has_budget(self, tenant_id: str) -> bool:
        """Check if tenant has any active budgets."""
        if not self._pg_pool:
            return False
        row = await self._pg_pool.fetchval(
            "SELECT COUNT(*) FROM budgets WHERE tenant_id = $1 AND is_active = true",
            tenant_id,
        )
        return (row or 0) > 0

    async def _save_recommendations(self, recs: list[Recommendation]):
        """Save recommendations to PostgreSQL."""
        if not self._pg_pool or not recs:
            return

        import json
        async with self._pg_pool.acquire() as conn:
            for rec in recs:
                # Upsert — avoid duplicate recommendations
                await conn.execute(
                    """
                    INSERT INTO recommendations (tenant_id, rec_type, title, description,
                                                 estimated_savings_usd, metadata, status)
                    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                    ON CONFLICT DO NOTHING
                    """,
                    rec.tenant_id,
                    rec.rec_type,
                    rec.title,
                    rec.description,
                    rec.estimated_savings_usd,
                    json.dumps(rec.metadata),
                )


async def main():
    recommender = Recommender()
    await recommender.start()

    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, asyncio.CancelledError):
        await recommender.stop()


if __name__ == "__main__":
    asyncio.run(main())
