"""
Model routing engine.
Evaluates incoming requests against tenant routing rules and applies
intelligent model selection based on complexity, token count, and budget
constraints. The goal: route simple tasks to cheap models, complex ones
to powerful models — automatically.
"""

import re
from typing import Optional

import structlog
from pydantic import BaseModel

log = structlog.get_logger()


# ── Pricing table (USD per token) ──────────────────────────────
MODEL_PRICING = {
    "gpt-4o": {"input": 2.50e-6, "output": 10.0e-6},
    "gpt-4o-mini": {"input": 0.15e-6, "output": 0.60e-6},
    "gpt-4-turbo": {"input": 10.0e-6, "output": 30.0e-6},
    "gpt-3.5-turbo": {"input": 0.50e-6, "output": 1.50e-6},
    "claude-3.5-sonnet": {"input": 3.0e-6, "output": 15.0e-6},
    "claude-3.5-haiku": {"input": 0.80e-6, "output": 4.0e-6},
    "claude-3-opus": {"input": 15.0e-6, "output": 75.0e-6},
}

# ── Tier mapping for automatic downgrade ───────────────────────
MODEL_TIERS: dict[str, list[str]] = {
    "openai_high": ["gpt-4o", "gpt-4-turbo"],
    "openai_low": ["gpt-4o-mini", "gpt-3.5-turbo"],
    "anthropic_high": ["claude-3.5-sonnet", "claude-3-opus"],
    "anthropic_low": ["claude-3.5-haiku"],
}

DOWNGRADE_MAP: dict[str, str] = {
    "gpt-4o": "gpt-4o-mini",
    "gpt-4-turbo": "gpt-4o-mini",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
    "claude-3.5-sonnet": "claude-3.5-haiku",
    "claude-3-opus": "claude-3.5-haiku",
    "claude-3.5-haiku": "claude-3.5-haiku",
    "gpt-4o-mini": "gpt-4o-mini",
}


class RoutingRule(BaseModel):
    rule_id: str
    tenant_id: str
    name: str
    priority: int = 100
    is_active: bool = True

    match_agent_id: Optional[str] = None
    match_workflow_id: Optional[str] = None
    match_model: Optional[str] = None
    match_min_tokens: Optional[int] = None
    match_max_tokens: Optional[int] = None

    route_to_model: str
    route_to_provider: Optional[str] = None


class RoutingDecision(BaseModel):
    original_model: str
    routed_model: str
    provider: str
    was_downgraded: bool = False
    routing_reason: str = ""
    estimated_savings_pct: float = 0.0


class ComplexitySignals(BaseModel):
    """Lightweight signals extracted from the request to gauge task complexity."""
    estimated_prompt_tokens: int = 0
    has_system_prompt: bool = False
    has_json_mode: bool = False
    has_tools: bool = False
    has_code_markers: bool = False
    message_count: int = 0
    max_tokens_requested: Optional[int] = None


def extract_complexity(request_body: dict) -> ComplexitySignals:
    """Extract complexity signals from a chat completion request."""
    messages = request_body.get("messages", [])
    tools = request_body.get("tools", [])
    response_format = request_body.get("response_format", {})
    max_tokens = request_body.get("max_tokens")

    has_system = any(m.get("role") == "system" for m in messages)
    has_code = False
    total_chars = 0

    for m in messages:
        content = m.get("content", "")
        if isinstance(content, str):
            total_chars += len(content)
            if re.search(r"```|def |class |function |import |SELECT ", content):
                has_code = True

    estimated_tokens = total_chars // 4

    return ComplexitySignals(
        estimated_prompt_tokens=estimated_tokens,
        has_system_prompt=has_system,
        has_json_mode=response_format.get("type") == "json_object",
        has_tools=len(tools) > 0,
        has_code_markers=has_code,
        message_count=len(messages),
        max_tokens_requested=max_tokens,
    )


COMPLEX_KEYWORDS = [
    "step by step", "architect", "design a", "build a full",
    "write a full", "comprehensive", "multi-region", "distributed",
    "synthesize", "research report", "tradeoffs", "in depth",
    "fault-tolerant", "high availability", "implement", "refactor",
    "optimize", "debug", "explain the math", "active-active"
]

def classify_complexity(signals: ComplexitySignals, prompt_text: str = "") -> str:
    """Classify a request as 'simple', 'moderate', or 'complex'."""
    score = 0
    if signals.has_tools:
        score += 3
    if signals.has_code_markers:
        score += 2
    if signals.has_json_mode:
        score += 1
    if signals.estimated_prompt_tokens > 2000:
        score += 2
    elif signals.estimated_prompt_tokens > 500:
        score += 1
    if signals.message_count > 10:
        score += 2
    elif signals.message_count > 5:
        score += 1
    if signals.max_tokens_requested and signals.max_tokens_requested > 2000:
        score += 1

    text_lower = prompt_text.lower()
    if any(kw in text_lower for kw in COMPLEX_KEYWORDS):
        score += 3

    if score >= 5:
        return "complex"
    elif score >= 2:
        return "moderate"
    return "simple"


class ModelRouter:
    """Routes requests to optimal models based on rules and complexity."""

    def __init__(self):
        self._rules_cache: dict[str, list[RoutingRule]] = {}

    async def load_rules(self, tenant_id: str, rules: list[RoutingRule]):
        sorted_rules = sorted(rules, key=lambda r: r.priority)
        self._rules_cache[tenant_id] = sorted_rules
        log.info("router.rules_loaded", tenant_id=tenant_id, count=len(rules))

    def route(
        self,
        tenant_id: str,
        request_model: str,
        request_body: dict,
        force_downgrade: bool = False,
        labels: dict[str, str] | None = None,
    ) -> RoutingDecision:
        """Determine the optimal model for this request."""
        labels = labels or {}

        # 1. Check explicit routing rules
        rules = self._rules_cache.get(tenant_id, [])
        for rule in rules:
            if not rule.is_active:
                continue
            if self._rule_matches(rule, request_model, request_body, labels):
                provider = rule.route_to_provider or self._infer_provider(rule.route_to_model)
                savings = self._estimate_savings(request_model, rule.route_to_model)
                return RoutingDecision(
                    original_model=request_model,
                    routed_model=rule.route_to_model,
                    provider=provider,
                    was_downgraded=rule.route_to_model != request_model,
                    routing_reason=f"rule:{rule.name}",
                    estimated_savings_pct=savings,
                )

        # 2. If budget is forcing a downgrade, pick cheapest equivalent
        if force_downgrade:
            downgraded = DOWNGRADE_MAP.get(request_model, request_model)
            if downgraded != request_model:
                savings = self._estimate_savings(request_model, downgraded)
                return RoutingDecision(
                    original_model=request_model,
                    routed_model=downgraded,
                    provider=self._infer_provider(downgraded),
                    was_downgraded=True,
                    routing_reason="budget_throttle",
                    estimated_savings_pct=savings,
                )

        # 3. Auto-route based on complexity
        signals = extract_complexity(request_body)
        prompt_text = " ".join(
            m.get("content", "") for m in request_body.get("messages", [])
            if isinstance(m.get("content"), str)
        )
        complexity = classify_complexity(signals, prompt_text)

        if complexity == "simple":
            downgraded = DOWNGRADE_MAP.get(request_model, request_model)
            if downgraded != request_model:
                savings = self._estimate_savings(request_model, downgraded)
                return RoutingDecision(
                    original_model=request_model,
                    routed_model=downgraded,
                    provider=self._infer_provider(downgraded),
                    was_downgraded=True,
                    routing_reason=f"auto:simple_task (score={complexity})",
                    estimated_savings_pct=savings,
                )

        # 4. No routing change
        return RoutingDecision(
            original_model=request_model,
            routed_model=request_model,
            provider=self._infer_provider(request_model),
            was_downgraded=False,
            routing_reason="passthrough",
        )

    def _rule_matches(
        self,
        rule: RoutingRule,
        model: str,
        body: dict,
        labels: dict[str, str],
    ) -> bool:
        if rule.match_model and rule.match_model != model:
            return False
        if rule.match_agent_id and rule.match_agent_id != labels.get("agent_id"):
            return False
        if rule.match_workflow_id and rule.match_workflow_id != labels.get("workflow_id"):
            return False
        signals = extract_complexity(body)
        if rule.match_min_tokens and signals.estimated_prompt_tokens < rule.match_min_tokens:
            return False
        if rule.match_max_tokens and signals.estimated_prompt_tokens > rule.match_max_tokens:
            return False
        return True

    @staticmethod
    def _infer_provider(model: str) -> str:
        if model.startswith("claude"):
            return "anthropic"
        return "openai"

    @staticmethod
    def _estimate_savings(original: str, routed: str) -> float:
        orig_cost = MODEL_PRICING.get(original, {})
        new_cost = MODEL_PRICING.get(routed, {})
        if not orig_cost or not new_cost:
            return 0.0
        orig_avg = (orig_cost["input"] + orig_cost["output"]) / 2
        new_avg = (new_cost["input"] + new_cost["output"]) / 2
        if orig_avg == 0:
            return 0.0
        return round((1 - new_avg / orig_avg) * 100, 1)


# Singleton
model_router = ModelRouter()
