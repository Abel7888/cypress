"""
Stripe billing integration.
Handles checkout sessions, webhooks, and subscription management.
"""

import os
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

PLANS = {
    "starter": {
        "name": "TokenGuard Starter",
        "price_id": os.getenv("STRIPE_PRICE_STARTER"),
        "seat_limit": 10,
        "spend_limit_usd": 5000,
        "monthly_fee": 499,
    },
    "growth": {
        "name": "TokenGuard Growth",
        "price_id": os.getenv("STRIPE_PRICE_GROWTH"),
        "seat_limit": 30,
        "spend_limit_usd": 25000,
        "monthly_fee": 999,
    },
    "pro": {
        "name": "TokenGuard Pro",
        "price_id": os.getenv("STRIPE_PRICE_PRO"),
        "seat_limit": 999,
        "spend_limit_usd": 100000,
        "monthly_fee": 2499,
    },
}


def create_checkout_session(tenant_id: str, tenant_name: str, plan: str, email: str) -> str:
    """Create a Stripe Checkout session. Returns the checkout URL."""
    plan_config = PLANS.get(plan)
    if not plan_config:
        raise ValueError(f"Unknown plan: {plan}")

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        line_items=[
            {
                "price": plan_config["price_id"],
                "quantity": 1,
            }
        ],
        customer_email=email,
        metadata={
            "tenant_id": tenant_id,
            "tenant_name": tenant_name,
            "plan": plan,
        },
        success_url=os.getenv("STRIPE_SUCCESS_URL") + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=os.getenv("STRIPE_CANCEL_URL"),
    )
    return session.url


def create_or_get_customer(tenant_id: str, tenant_name: str, email: str) -> str:
    """Create or retrieve a Stripe customer. Returns customer ID."""
    customers = stripe.Customer.list(email=email, limit=1)
    if customers.data:
        return customers.data[0].id

    customer = stripe.Customer.create(
        email=email,
        name=tenant_name,
        metadata={"tenant_id": tenant_id},
    )
    return customer.id


def get_subscription_status(stripe_subscription_id: str) -> dict:
    """Get current subscription status from Stripe."""
    try:
        sub = stripe.Subscription.retrieve(stripe_subscription_id)
        return {
            "status": sub.status,
            "current_period_end": sub.current_period_end,
            "plan": sub.metadata.get("plan", "unknown"),
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


def cancel_subscription(stripe_subscription_id: str) -> bool:
    """Cancel a subscription at period end."""
    try:
        stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=True,
        )
        return True
    except Exception:
        return False


def handle_webhook(payload: bytes, sig_header: str) -> dict:
    """Process a Stripe webhook event. Returns event type and metadata."""
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid webhook signature")

    return event
