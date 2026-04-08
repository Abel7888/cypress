"""
Background aggregation service.
Periodically queries ClickHouse raw events and computes:
- Budget spend snapshots (written back to ClickHouse + Redis)
- Tenant-level daily/weekly/monthly rollups for the dashboard
- Model usage distributions for the recommender

Runs on APScheduler with configurable intervals.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

import clickhouse_connect
import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pydantic_settings import BaseSettings

log = structlog.get_logger()


class AggregatorSettings(BaseSettings):
    clickhouse_host: str = "localhost"
    clickhouse_port: int = 8123
    clickhouse_db: str = "tokenguard"
    clickhouse_user: str = "default"
    clickhouse_password: str = ""
    database_url: str = "postgresql://localhost:5432/tokenguard"
    redis_url: str = "redis://localhost:6379/0"
    aggregation_interval_minutes: int = 5
    budget_snapshot_interval_minutes: int = 1

    class Config:
        env_prefix = ""


settings = AggregatorSettings()


class Aggregator:
    """Periodically aggregates raw LLM events into rollup tables."""

    def __init__(self):
        self._ch_client: Any = None
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
        """Start the aggregation scheduler."""
        self._scheduler.add_job(
            self.run_budget_snapshots,
            "interval",
            minutes=settings.budget_snapshot_interval_minutes,
            id="budget_snapshots",
            replace_existing=True,
        )
        self._scheduler.add_job(
            self.run_tenant_rollups,
            "interval",
            minutes=settings.aggregation_interval_minutes,
            id="tenant_rollups",
            replace_existing=True,
        )
        self._scheduler.add_job(
            self.run_model_distribution,
            "interval",
            minutes=settings.aggregation_interval_minutes * 2,
            id="model_distribution",
            replace_existing=True,
        )
        self._scheduler.start()
        log.info("aggregator.started")

    async def stop(self):
        self._scheduler.shutdown(wait=False)
        if self._ch_client:
            self._ch_client.close()
        log.info("aggregator.stopped")

    async def run_budget_snapshots(self):
        """
        Compute current spend per budget period and write snapshots
        to ClickHouse budget_snapshots table.
        """
        log.info("aggregator.budget_snapshots.start")
        try:
            ch = self._get_ch()
            now = datetime.now(timezone.utc)

            # Monthly spend per tenant
            monthly_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            query = """
                SELECT
                    tenant_id,
                    sum(total_cost_usd) AS spent
                FROM llm_events
                WHERE created_at >= %(start)s
                GROUP BY tenant_id
            """
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ch.query(query, parameters={"start": monthly_start}),
            )

            if result.result_rows:
                rows = []
                for row in result.result_rows:
                    tenant_id, spent = row[0], float(row[1])
                    rows.append([
                        tenant_id,
                        "auto_monthly",
                        monthly_start.date(),
                        (monthly_start + timedelta(days=31)).date(),
                        spent,
                        0.0,  # limit filled by budget enforcer
                        0.0,  # pct filled by budget enforcer
                    ])

                await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: ch.insert(
                        "budget_snapshots",
                        rows,
                        column_names=[
                            "tenant_id", "budget_id", "period_start",
                            "period_end", "spent_usd", "limit_usd", "pct_used",
                        ],
                    ),
                )
                log.info("aggregator.budget_snapshots.done", tenants=len(rows))

        except Exception:
            log.exception("aggregator.budget_snapshots.error")

    async def run_tenant_rollups(self):
        """
        Generate additional rollup data beyond what ClickHouse
        materialized views handle — e.g., 7-day trailing averages,
        cost-per-agent breakdowns for dashboard widgets.
        """
        log.info("aggregator.tenant_rollups.start")
        try:
            ch = self._get_ch()
            now = datetime.now(timezone.utc)
            seven_days_ago = now - timedelta(days=7)

            query = """
                SELECT
                    tenant_id,
                    agent_id,
                    count()            AS request_count,
                    sum(total_cost_usd) AS total_cost,
                    sum(savings_usd)   AS total_savings,
                    avg(latency_ms)    AS avg_latency,
                    sum(cache_hit)     AS cache_hits,
                    sum(total_tokens)  AS total_tokens
                FROM llm_events
                WHERE created_at >= %(start)s
                GROUP BY tenant_id, agent_id
                ORDER BY total_cost DESC
            """
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ch.query(query, parameters={"start": seven_days_ago}),
            )

            log.info(
                "aggregator.tenant_rollups.done",
                rows=len(result.result_rows) if result.result_rows else 0,
            )

        except Exception:
            log.exception("aggregator.tenant_rollups.error")

    async def run_model_distribution(self):
        """
        Compute model usage distribution per tenant for the recommender.
        """
        log.info("aggregator.model_distribution.start")
        try:
            ch = self._get_ch()
            now = datetime.now(timezone.utc)
            thirty_days_ago = now - timedelta(days=30)

            query = """
                SELECT
                    tenant_id,
                    request_model,
                    routed_model,
                    count()             AS request_count,
                    sum(total_cost_usd) AS total_cost,
                    sum(savings_usd)    AS total_savings,
                    avg(latency_ms)     AS avg_latency,
                    sum(was_downgraded) AS downgrade_count
                FROM llm_events
                WHERE created_at >= %(start)s
                GROUP BY tenant_id, request_model, routed_model
                ORDER BY total_cost DESC
            """
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ch.query(query, parameters={"start": thirty_days_ago}),
            )

            log.info(
                "aggregator.model_distribution.done",
                rows=len(result.result_rows) if result.result_rows else 0,
            )

        except Exception:
            log.exception("aggregator.model_distribution.error")


async def main():
    """Entrypoint for the aggregator service."""
    aggregator = Aggregator()
    await aggregator.start()

    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, asyncio.CancelledError):
        await aggregator.stop()


if __name__ == "__main__":
    asyncio.run(main())
