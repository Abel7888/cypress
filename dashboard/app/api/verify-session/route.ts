import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia" as any,
});

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ valid: false, error: "No session ID" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      return NextResponse.json({
        valid: true,
        email: session.customer_details?.email,
        name: session.customer_details?.name,
        plan: session.metadata?.plan || "starter",
      });
    } else {
      return NextResponse.json({ valid: false, error: "Payment not completed" }, { status: 402 });
    }
  } catch (err) {
    return NextResponse.json({ valid: false, error: "Invalid session" }, { status: 400 });
  }
}
