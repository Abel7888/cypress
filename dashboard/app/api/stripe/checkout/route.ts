import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Price IDs per plan â€” set these env vars in Railway / .env.local.
// Falls back to a fallback in the response so you can still test UX without keys.
const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  business: process.env.STRIPE_PRICE_BUSINESS,
};

const PLAN_FALLBACK: Record<string, { name: string; unit_amount: number }> = {
  starter: { name: "TokenGuard Starter", unit_amount: 19900 },
  growth: { name: "TokenGuard Growth", unit_amount: 39900 },
  business: { name: "TokenGuard Business", unit_amount: 79900 },
};

export async function POST(req: NextRequest) {
  try {
    const { plan, email, company } = await req.json();

    if (!plan || !(plan in PLAN_FALLBACK)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      // Stripe not configured â€” let the client fall back to onboarding
      return NextResponse.json(
        { error: "Stripe not configured. Set STRIPE_SECRET_KEY in env." },
        { status: 501 }
      );
    }

    const stripe = new Stripe(secret, { apiVersion: "2025-01-27.acacia" as any });

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const priceId = PLAN_PRICE_IDS[plan];

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            product_data: { name: PLAN_FALLBACK[plan].name },
            unit_amount: PLAN_FALLBACK[plan].unit_amount,
          },
        };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem],
      customer_email: email || undefined,
      metadata: { plan, company: company || "" },
      subscription_data: { metadata: { plan, company: company || "" } },
      allow_promotion_codes: true,
      success_url: `https://cypress-production-36c0.up.railway.app/onboarding?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/signup?plan=${plan}&canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("[stripe/checkout]", e);
    return NextResponse.json({ error: e?.message || "Checkout failed" }, { status: 500 });
  }
}


