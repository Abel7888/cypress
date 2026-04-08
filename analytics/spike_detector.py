"""
Spike detection service.
Monitors cost and usage metrics in real-time to detect anomalous spending
patterns. Uses a rolling Z-score approach against recent baselines.
When a spike is detected, it writes to ClickHouse and fires alerts
via email (Resend) and Slack.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Optional

import clickhouse_connect
import httpx
import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pydantic import BaseModel
from pydantic_settings import BaseSettings

log = structlog.get_logger()


class Severity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class SpikeEvent(BaseModel):
    tenant_id: str
    metric: str
    current_value: float
    baseline_value: float
    deviation_pct: float
    severity: Severity


class SpikeDetectorSettings(BaseSettings):
    clickhouse_host: str = "localhost"
    clickhouse_port: int = 8123
    clickhouse_db: str = "tokenguard"
    clickhouse_user: str = "default"
    clickhouse_password: str = ""
    resend_api_key: str = ""
    slack_default_webhook: str = ""
    check_interval_minutes: int = 2
    warning_threshold_pct: float = 150.0
    critical_threshold_pct: float = 300.0
    baseline_hours: int = 168  # 7 days

    class Config:
        env_prefix = ""


settings = SpikeDetectorSettings()


class SpikeDetector:
    """Detects anomalous spending spikes using rolling baselines."""

    def __init__(self):
        self._ch_client: Any = None
        self._scheduler = AsyncIOScheduler()
        self._http_client: Optional[httpx.AsyncClient] = None

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
        self._http_client = httpx.AsyncClient(timeout=30)
        self._scheduler.add_job(
            self.check_cost_spikes,
            "interval",
            minutes=settings.check_interval_minutes,
            id="cost_spike_check",
            replace_existing=True,
        )
        self._scheduler.add_job(
            self.check_request_volume_spikes,
            "interval",
            minutes=settings.check_interval_minutes,
            id="volume_spike_check",
            replace_existing=True,
        )
        self._scheduler.start()
        log.info("spike_detector.started")

    async def stop(self):
        self._scheduler.shutdown(wait=False)
        if self._http_client:
            await self._http_client.aclose()
        if self._ch_client:
            self._ch_client.close()
        log.info("spike_detector.stopped")

    async def check_cost_spikes(self):
        """Compare recent hourly cost against rolling baseline."""
        log.info("spike_detector.cost_check.start")
        try:
            ch = self._get_ch()
            now = datetime.now(timezone.utc)
            one_hour_ago = now - timedelta(hours=1)
            baseline_start = now - timedelta(hours=settings.baseline_hours)

            # Current hour cost per tenant
            current_query = """
                SELECT tenant_id, sum(total_cost_usd) AS cost
                FROM llm_events
                WHERE created_at >= %(start)s
                GROUP BY tenant_id
            """
            current = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ch.query(current_query, parameters={"start": one_hour_ago}),
            )

            # Baseline average hourly cost per tenant
            baseline_query = """
                SELECT
                    tenant_id,
                    sum(total_cost_usd) / greatest(
                        dateDiff('hour', %(baseline_start)s, %(now)s), 1
                    ) AS avg_hourly_cost
                FROM llm_events
                WHERE created_at >= %(baseline_start)s AND created_at < %(start)s
                GROUP BY tenant_id
            """
            baseline = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ch.query(baseline_query, parameters={
                    "baseline_start": baseline_start,
                    "start": one_hour_ago,
                    "now": now,
                }),
            )

            baseline_map = {}
            if baseline.result_rows:
                for row in baseline.result_rows:
                    baseline_map[row[0]] = float(row[1])

            if current.result_rows:
                for row in current.result_rows:
                    tenant_id = row[0]
                    current_cost = float(row[1])
                    avg_cost = baseline_map.get(tenant_id, 0)

                    if avg_cost <= 0:
                        continue

                    deviation_pct = (current_cost / avg_cost) * 100

                    if deviation_pct >= settings.critical_threshold_pct:
                        severity = Severity.CRITICAL
                    elif deviation_pct >= settings.warning_threshold_pct:
                        severity = Severity.WARNING
                    else:
                        continue

                    spike = SpikeEvent(
                        tenant_id=tenant_id,
                        metric="hourly_cost_usd",
                        current_value=current_cost,
                        baseline_value=avg_cost,
                        deviation_pct=round(deviation_pct, 1),
                        severity=severity,
                    )
                    await self._handle_spike(spike)

            log.info("spike_detector.cost_check.done")

        except Exception:
            log.exception("spike_detector.cost_check.error")

    async def check_request_volume_spikes(self):
        """Check for unusual request volume per tenant."""
        log.info("spike_detector.volume_check.start")
        try:
            ch = self._get_ch()
            now = datetime.now(timezone.utc)
            one_hour_ago = now - timedelta(hours=1)
            baseline_start = now - timedelta(hours=settings.baseline_hours)

            current_query = """
                SELECT tenant_id, count() AS req_count
                FROM llm_events
                WHERE created_at >= %(start)s
                GROUP BY tenant_id
            """
            current = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ch.query(current_query, parameters={"start": one_hour_ago}),
            )

            baseline_query = """
                SELECT
                    tenant_id,
                    count() / greatest(
                        dateDiff('hour', %(baseline_start)s, %(now)s), 1
                    ) AS avg_hourly_count
                FROM llm_events
                WHERE created_at >= %(baseline_start)s AND created_at < %(start)s
                GROUP BY tenant_id
            """
            baseline = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ch.query(baseline_query, parameters={
                    "baseline_start": baseline_start,
                    "start": one_hour_ago,
                    "now": now,
                }),
            )

            baseline_map = {}
            if baseline.result_rows:
                for row in baseline.result_rows:
                    baseline_map[row[0]] = float(row[1])

            if current.result_rows:
                for row in current.result_rows:
                    tenant_id = row[0]
                    current_count = float(row[1])
                    avg_count = baseline_map.get(tenant_id, 0)

                    if avg_count <= 0:
                        continue

                    deviation_pct = (current_count / avg_count) * 100

                    if deviation_pct >= settings.critical_threshold_pct:
                        severity = Severity.CRITICAL
                    elif deviation_pct >= settings.warning_threshold_pct:
                        severity = Severity.WARNING
                    else:
                        continue

                    spike = SpikeEvent(
                        tenant_id=tenant_id,
                        metric="hourly_request_count",
                        current_value=current_count,
                        baseline_value=avg_count,
                        deviation_pct=round(deviation_pct, 1),
                        severity=severity,
                    )
                    await self._handle_spike(spike)

            log.info("spike_detector.volume_check.done")

        except Exception:
            log.exception("spike_detector.volume_check.error")

    async def _handle_spike(self, spike: SpikeEvent):
        """Record spike and send alerts."""
        log.warning(
            "spike_detected",
            tenant_id=spike.tenant_id,
            metric=spike.metric,
            current=spike.current_value,
            baseline=spike.baseline_value,
            deviation_pct=spike.deviation_pct,
            severity=spike.severity.value,
        )

        # Write to ClickHouse
        try:
            ch = self._get_ch()
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ch.insert(
                    "spike_events",
                    [[
                        spike.tenant_id,
                        spike.metric,
                        spike.current_value,
                        spike.baseline_value,
                        spike.deviation_pct,
                        spike.severity.value,
                    ]],
                    column_names=[
                        "tenant_id", "metric", "current_value",
                        "baseline_value", "deviation_pct", "severity",
                    ],
                ),
            )
        except Exception:
            log.exception("spike_detector.write_error")

        # Send Slack alert
        await self._send_slack_alert(spike)

        # Send email alert
        await self._send_email_alert(spike)

    async def _send_slack_alert(self, spike: SpikeEvent):
        """Send spike alert to Slack."""
        webhook = settings.slack_default_webhook
        if not webhook or not self._http_client:
            return

        emoji = "🔴" if spike.severity == Severity.CRITICAL else "🟡"
        text = (
            f"{emoji} *TokenGuard Spike Alert*\n"
            f"*Tenant:* `{spike.tenant_id}`\n"
            f"*Metric:* {spike.metric}\n"
            f"*Current:* {spike.current_value:.4f} | *Baseline:* {spike.baseline_value:.4f}\n"
            f"*Deviation:* {spike.deviation_pct:.1f}%\n"
            f"*Severity:* {spike.severity.value}"
        )

        try:
            await self._http_client.post(webhook, json={"text": text})
        except Exception:
            log.exception("spike_detector.slack_error")

    async def _send_email_alert(self, spike: SpikeEvent):
        """Send spike alert via Resend email API."""
        if not settings.resend_api_key or not self._http_client:
            return

        try:
            await self._http_client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": "alerts@tokenguard.dev",
                    "to": [],  # populated from tenant notification channels
                    "subject": f"[{spike.severity.value.upper()}] Spike detected: {spike.metric}",
                    "html": (
                        f"<h2>TokenGuard Spike Alert</h2>"
                        f"<p><strong>Tenant:</strong> {spike.tenant_id}</p>"
                        f"<p><strong>Metric:</strong> {spike.metric}</p>"
                        f"<p><strong>Current:</strong> {spike.current_value:.4f}</p>"
                        f"<p><strong>Baseline:</strong> {spike.baseline_value:.4f}</p>"
                        f"<p><strong>Deviation:</strong> {spike.deviation_pct:.1f}%</p>"
                        f"<p><strong>Severity:</strong> {spike.severity.value}</p>"
                    ),
                },
            )
        except Exception:
            log.exception("spike_detector.email_error")


async def main():
    detector = SpikeDetector()
    await detector.start()

    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, asyncio.CancelledError):
        await detector.stop()


if __name__ == "__main__":
    asyncio.run(main())
