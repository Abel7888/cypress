"""
Dashboard API endpoints.
Serves analytics data to the Next.js frontend.
"""

import sys
import os

# Add analytics directory to path to import queries
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "analytics"))

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

try:
    from queries import (
        get_overview_stats,
        get_cost_trends,
        get_model_breakdown,
        get_agent_breakdown,
    )
except ImportError:
    # Fallback if queries module not available
    def get_overview_stats(client_id: str, days: int = 30):
        return {"total_cost": 0, "total_requests": 0, "cache_hit_rate": 0, "avg_latency": 0, "total_savings": 0}
    
    def get_cost_trends(client_id: str, days: int = 30):
        return []
    
    def get_model_breakdown(client_id: str, days: int = 30):
        return []
    
    def get_agent_breakdown(client_id: str, days: int = 30):
        return []


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class OverviewResponse(BaseModel):
    total_cost_usd: float
    total_savings_usd: float
    total_requests: int
    cache_hit_rate: float
    avg_latency_ms: float
    active_budgets: int = 0


class CostTrend(BaseModel):
    date: str
    cost: float
    savings: float
    requests: int


class ModelBreakdown(BaseModel):
    model: str
    cost: float
    requests: int
    tokens: int
    percentage: float


class AgentBreakdown(BaseModel):
    agent_id: str
    cost: float
    requests: int
    savings: float


@router.get("/overview")
async def get_overview(request: Request, days: int = 30) -> OverviewResponse:
    """Get overview statistics for the dashboard."""
    tenant_id = getattr(request.state, "tenant_id", "unknown")
    
    try:
        stats = get_overview_stats(tenant_id, days)
        return OverviewResponse(
            total_cost_usd=stats.get("total_cost", 0),
            total_savings_usd=stats.get("total_savings", 0),
            total_requests=stats.get("total_requests", 0),
            cache_hit_rate=stats.get("cache_hit_rate", 0),
            avg_latency_ms=stats.get("avg_latency", 0),
            active_budgets=0,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch overview: {e}")


@router.get("/cost-trends")
async def get_trends(request: Request, days: int = 30) -> list[CostTrend]:
    """Get cost trends over time."""
    tenant_id = getattr(request.state, "tenant_id", "unknown")
    
    try:
        trends = get_cost_trends(tenant_id, days)
        return [CostTrend(**t) for t in trends]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trends: {e}")


@router.get("/models")
async def get_models(request: Request, days: int = 30) -> list[ModelBreakdown]:
    """Get model usage breakdown."""
    tenant_id = getattr(request.state, "tenant_id", "unknown")
    
    try:
        models = get_model_breakdown(tenant_id, days)
        return [ModelBreakdown(**m) for m in models]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {e}")


@router.get("/agents")
async def get_agents(request: Request, days: int = 30) -> list[AgentBreakdown]:
    """Get agent usage breakdown."""
    tenant_id = getattr(request.state, "tenant_id", "unknown")
    
    try:
        agents = get_agent_breakdown(tenant_id, days)
        return [AgentBreakdown(**a) for a in agents]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agents: {e}")


@router.get("/agent-recent")
async def get_agent_recent(request: Request, agent_id: str, limit: int = 8):
    """
    Get recent calls for a specific employee.
    Returns real call history with routing decisions, costs, and per-call savings.
    Powers the Recent Calls panel in the employee deep-dive on Cost Analysis page.
    """
    tenant_id = getattr(request.state, "tenant_id", "unknown")
    try:
        import clickhouse_connect, os
        from router import MODEL_PRICING

        client = clickhouse_connect.get_client(
            host=os.getenv("CLICKHOUSE_HOST"),
            port=int(os.getenv("CLICKHOUSE_PORT", 8443)),
            username=os.getenv("CLICKHOUSE_USER", "default"),
            password=os.getenv("CLICKHOUSE_PASSWORD"),
            secure=True
        )

        result = client.query(
            """
            SELECT
                timestamp,
                model_requested,
                model_used,
                cost_usd,
                was_routed,
                cache_hit,
                blocked,
                latency_ms
            FROM tokenguard.events
            WHERE agent_id    = {agent_id:String}
            AND   client_id   = {tenant_id:String}
            ORDER BY timestamp DESC
            LIMIT {limit:Int32}
            """,
            parameters={"agent_id": agent_id, "tenant_id": tenant_id, "limit": limit}
        )

        rows = []
        for r in result.result_rows:
            model_requested = str(r[1] or "")
            model_used      = str(r[2] or "")
            cost_usd        = float(r[3] or 0)
            was_routed      = bool(r[4])
            cache_hit       = bool(r[5])
            blocked         = bool(r[6])
            latency_ms      = int(r[7] or 0)

            # Compute real per-call saving from actual model pricing
            saved_usd = 0.0
            savings_pct = 0
            if was_routed and model_requested and model_used and model_requested != model_used:
                req_p  = MODEL_PRICING.get(model_requested, {})
                used_p = MODEL_PRICING.get(model_used, {})
                if req_p and used_p:
                    req_avg  = (req_p["input"]  + req_p["output"])  / 2
                    used_avg = (used_p["input"] + used_p["output"]) / 2
                    if req_avg > 0 and used_avg < req_avg:
                        cost_without = cost_usd * (req_avg / used_avg)
                        saved_usd    = round(cost_without - cost_usd, 6)
                        savings_pct  = round((saved_usd / cost_without) * 100)

            # Routing label drives the UI badge color
            if cache_hit:
                routing_label = "cached"
            elif blocked:
                routing_label = "blocked"
            elif was_routed:
                routing_label = "routed"
            else:
                routing_label = "direct"

            rows.append({
                "timestamp":       str(r[0]),
                "model_requested": model_requested,
                "model_used":      model_used,
                "cost_usd":        cost_usd,
                "was_routed":      was_routed,
                "cache_hit":       cache_hit,
                "blocked":         blocked,
                "latency_ms":      latency_ms,
                "saved_usd":       saved_usd,
                "savings_pct":     savings_pct,
                "routing_label":   routing_label,
            })

        return rows

    except Exception as e:
        print(f"[agent-recent] Error: {e}")
        return []

@router.get("/recommendations")
async def get_recommendations(request: Request):
    """Get cost-saving recommendations."""
    # This would query the recommendations table from PostgreSQL
    # For now, return empty list
    return []
