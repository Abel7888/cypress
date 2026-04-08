"""
ClickHouse query functions for dashboard analytics.
These power all the dashboard visualizations and reports.
"""

import os
from typing import Any

from clickhouse_driver import Client


def get_client() -> Client:
    """Get ClickHouse client instance."""
    return Client(
        host=os.getenv("CLICKHOUSE_HOST", "localhost"),
        port=int(os.getenv("CLICKHOUSE_PORT", "9000")),
        database=os.getenv("CLICKHOUSE_DB", "tokenguard"),
        user=os.getenv("CLICKHOUSE_USER", "default"),
        password=os.getenv("CLICKHOUSE_PASSWORD", ""),
    )


def get_spend_over_time(client_id: str, days: int = 30) -> list[tuple]:
    """Get daily spend over time for a client."""
    ch = get_client()
    return ch.execute(
        """
        SELECT toDate(created_at) as date, sum(cost_usd) as total_cost
        FROM tokenguard.events
        WHERE client_id = %(client_id)s
          AND created_at >= now() - INTERVAL %(days)s DAY
        GROUP BY date ORDER BY date
        """,
        {"client_id": client_id, "days": days},
    )


def get_spend_by_model(client_id: str, days: int = 30) -> list[tuple]:
    """Get spend breakdown by model for a client."""
    ch = get_client()
    return ch.execute(
        """
        SELECT model_used, sum(cost_usd) as total_cost, count() as calls
        FROM tokenguard.events
        WHERE client_id = %(client_id)s
          AND created_at >= now() - INTERVAL %(days)s DAY
        GROUP BY model_used ORDER BY total_cost DESC
        """,
        {"client_id": client_id, "days": days},
    )


def get_spend_by_agent(client_id: str, days: int = 30) -> list[tuple]:
    """Get spend breakdown by agent for a client."""
    ch = get_client()
    return ch.execute(
        """
        SELECT agent_id, sum(cost_usd) as total_cost, count() as calls
        FROM tokenguard.events
        WHERE client_id = %(client_id)s
          AND created_at >= now() - INTERVAL %(days)s DAY
        GROUP BY agent_id ORDER BY total_cost DESC LIMIT 20
        """,
        {"client_id": client_id, "days": days},
    )


def get_savings_summary(client_id: str, days: int = 30) -> list[tuple]:
    """Get savings summary for a client."""
    ch = get_client()
    return ch.execute(
        """
        SELECT
            sum(cost_usd)               AS actual_cost,
            countIf(was_routed = 1)     AS routed_calls,
            countIf(cache_hit = 1)      AS cache_hits,
            countIf(blocked = 1)        AS blocked_calls,
            count()                     AS total_calls
        FROM tokenguard.events
        WHERE client_id = %(client_id)s
          AND created_at >= now() - INTERVAL %(days)s DAY
        """,
        {"client_id": client_id, "days": days},
    )


def get_overview_stats(client_id: str, days: int = 30) -> dict[str, Any]:
    """Get overview statistics for dashboard."""
    ch = get_client()
    
    # Main stats
    result = ch.execute(
        """
        SELECT
            sum(cost_usd) AS total_cost,
            count() AS total_requests,
            countIf(cache_hit = 1) AS cache_hits,
            avg(latency_ms) AS avg_latency,
            sum(input_tokens + output_tokens) AS total_tokens
        FROM tokenguard.events
        WHERE client_id = %(client_id)s
          AND created_at >= now() - INTERVAL %(days)s DAY
        """,
        {"client_id": client_id, "days": days},
    )
    
    if not result:
        return {
            "total_cost": 0,
            "total_requests": 0,
            "cache_hit_rate": 0,
            "avg_latency": 0,
            "total_savings": 0,
        }
    
    row = result[0]
    total_cost = float(row[0] or 0)
    total_requests = int(row[1] or 0)
    cache_hits = int(row[2] or 0)
    avg_latency = float(row[3] or 0)
    
    cache_hit_rate = (cache_hits / total_requests * 100) if total_requests > 0 else 0
    
    # Estimate savings (cache hits save 100% of cost)
    # For routing, we'd need to compare original vs routed model costs
    # Simplified: assume cache hits saved equivalent to average request cost
    avg_cost_per_request = total_cost / total_requests if total_requests > 0 else 0
    cache_savings = cache_hits * avg_cost_per_request
    
    return {
        "total_cost": round(total_cost, 2),
        "total_requests": total_requests,
        "cache_hit_rate": round(cache_hit_rate, 1),
        "avg_latency": round(avg_latency, 0),
        "total_savings": round(cache_savings, 2),
    }


def get_cost_trends(client_id: str, days: int = 30) -> list[dict]:
    """Get cost trends with savings for charting."""
    ch = get_client()
    result = ch.execute(
        """
        SELECT
            toDate(created_at) AS date,
            sum(cost_usd) AS cost,
            countIf(cache_hit = 1) AS cache_hits,
            count() AS total_requests
        FROM tokenguard.events
        WHERE client_id = %(client_id)s
          AND created_at >= now() - INTERVAL %(days)s DAY
        GROUP BY date
        ORDER BY date
        """,
        {"client_id": client_id, "days": days},
    )
    
    trends = []
    for row in result:
        date = row[0].strftime("%b %d")
        cost = float(row[1] or 0)
        cache_hits = int(row[2] or 0)
        total_requests = int(row[3] or 0)
        
        # Estimate savings from cache
        avg_cost = cost / total_requests if total_requests > 0 else 0
        savings = cache_hits * avg_cost
        
        trends.append({
            "date": date,
            "cost": round(cost, 2),
            "savings": round(savings, 2),
            "requests": total_requests,
        })
    
    return trends


def get_model_breakdown(client_id: str, days: int = 30) -> list[dict]:
    """Get model usage breakdown for pie chart."""
    ch = get_client()
    result = ch.execute(
        """
        SELECT
            model_used,
            sum(cost_usd) AS cost,
            count() AS requests,
            sum(input_tokens + output_tokens) AS tokens
        FROM tokenguard.events
        WHERE client_id = %(client_id)s
          AND created_at >= now() - INTERVAL %(days)s DAY
        GROUP BY model_used
        ORDER BY cost DESC
        """,
        {"client_id": client_id, "days": days},
    )
    
    total_cost = sum(float(row[1] or 0) for row in result)
    
    breakdown = []
    for row in result:
        model = row[0]
        cost = float(row[1] or 0)
        requests = int(row[2] or 0)
        tokens = int(row[3] or 0)
        percentage = (cost / total_cost * 100) if total_cost > 0 else 0
        
        breakdown.append({
            "model": model,
            "cost": round(cost, 2),
            "requests": requests,
            "tokens": tokens,
            "percentage": round(percentage, 1),
        })
    
    return breakdown


def get_agent_breakdown(client_id: str, days: int = 30) -> list[dict]:
    """Get agent usage breakdown."""
    ch = get_client()
    result = ch.execute(
        """
        SELECT
            agent_id,
            sum(cost_usd) AS cost,
            count() AS requests,
            countIf(cache_hit = 1) AS cache_hits
        FROM tokenguard.events
        WHERE client_id = %(client_id)s
          AND created_at >= now() - INTERVAL %(days)s DAY
          AND agent_id != ''
        GROUP BY agent_id
        ORDER BY cost DESC
        LIMIT 20
        """,
        {"client_id": client_id, "days": days},
    )
    
    breakdown = []
    for row in result:
        agent_id = row[0]
        cost = float(row[1] or 0)
        requests = int(row[2] or 0)
        cache_hits = int(row[3] or 0)
        
        # Estimate savings
        avg_cost = cost / requests if requests > 0 else 0
        savings = cache_hits * avg_cost
        
        breakdown.append({
            "agent_id": agent_id,
            "cost": round(cost, 2),
            "requests": requests,
            "savings": round(savings, 2),
        })
    
    return breakdown
