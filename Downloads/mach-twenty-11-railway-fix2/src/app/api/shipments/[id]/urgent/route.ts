import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStripe, URGENT_QUOTE_FEE_USD } from "@/lib/stripe";
import { handleApiError } from "@/lib/api-error";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/shipments/:id/urgent — creates a Stripe PaymentIntent for the
// urgent-quote fee. The $10 amount comes ONLY from
// URGENT_QUOTE_FEE_USD (src/lib/stripe.ts) — nothing from the request
// body is used for pricing, so a tampered client request can't pay a
// different amount. Shipment.isUrgent does not flip to true here; that
// only happens once Stripe confirms payment_intent.succeeded via the
// webhook (see src/app/api/stripe/webhook/route.ts) — never on the
// strength of this request alone.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const rl = rateLimit(`urgent-fee:${userId}`, 5, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests — try again shortly." }, { status: 429 });

    const shipment = await prisma.shipment.findUnique({ where: { id } });
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (shipment.shipperId !== userId) {
      return NextResponse.json({ error: "Only the shipper who posted this load can mark it urgent" }, { status: 403 });
    }
    if (shipment.isUrgent) {
      return NextResponse.json({ error: "This shipment is already marked urgent" }, { status: 409 });
    }

    const stripe = getStripe();
    const amountCents = Math.round(URGENT_QUOTE_FEE_USD * 100); // server-computed, not client-supplied

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: { kind: "urgent_fee", shipmentId: id, userId },
    });

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          shipmentId: id,
          type: "URGENT_FEE" as any,
          status: "PENDING" as any,
          amount: URGENT_QUOTE_FEE_USD,
          stripePaymentIntentId: paymentIntent.id,
        },
      }),
      prisma.shipment.update({ where: { id }, data: { urgentFeeStatus: "PENDING" as any } }),
    ]);

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, amount: URGENT_QUOTE_FEE_USD });

  } catch (err) {
    return handleApiError(err);
  }
}
