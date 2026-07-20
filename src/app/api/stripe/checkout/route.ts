import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, CARRIER_MEMBERSHIP } from "@/lib/stripe";
import { handleApiError } from "@/lib/api-error";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/stripe/checkout — creates a Stripe Checkout session for the
// single carrier membership plan ($19.99/mo, see src/lib/stripe.ts) and
// returns the redirect URL. No tier selection anymore — there's one
// plan. Requires STRIPE_SECRET_KEY and STRIPE_CARRIER_PRICE_ID; without
// them this 500s rather than pretending to succeed.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "CARRIER") {
      return NextResponse.json({ error: "Carrier account required" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const rl = rateLimit(`stripe-checkout:${userId}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests — try again shortly." }, { status: 429 });
    }

    const priceId = process.env[CARRIER_MEMBERSHIP.priceEnvVar];
    if (!priceId) {
      return NextResponse.json(
        { error: `Billing not configured: set ${CARRIER_MEMBERSHIP.priceEnvVar} to a real Stripe Price ID.` },
        { status: 500 }
      );
    }

    const carrierProfile = await prisma.carrierProfile.findUnique({ where: { userId } });
    if (!carrierProfile) return NextResponse.json({ error: "Complete your carrier profile first" }, { status: 409 });

    try {
      const stripe = getStripe();

      let customerId = carrierProfile.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: session.user.email!, name: carrierProfile.legalName });
        customerId = customer.id;
        await prisma.carrierProfile.update({ where: { id: carrierProfile.id }, data: { stripeCustomerId: customerId } });
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXTAUTH_URL}/carrier/membership?status=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/carrier/membership?status=cancelled`,
        metadata: { carrierProfileId: carrierProfile.id },
      });

      return NextResponse.json({ url: checkoutSession.url });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Stripe not configured" }, { status: 500 });
    }

  } catch (err) {
    return handleApiError(err);
  }
}
