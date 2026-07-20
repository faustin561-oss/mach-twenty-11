import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { handleApiError } from "@/lib/api-error";
import { auditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/stripe/subscription/cancel — schedules cancellation at the
// end of the current billing period (cancel_at_period_end), not
// immediate — the carrier keeps bidding access through what they already
// paid for. The webhook (customer.subscription.updated) is what actually
// updates our database when Stripe confirms the flag change; this route
// only asks Stripe to make that change.
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "CARRIER") {
      return NextResponse.json({ error: "Carrier account required" }, { status: 403 });
    }
    const userId = (session.user as any).id;
    const rl = rateLimit(`sub-cancel:${userId}`, 5, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests — try again shortly." }, { status: 429 });

    const carrierProfile = await prisma.carrierProfile.findUnique({ where: { userId } });
    if (!carrierProfile?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 409 });
    }

    const stripe = getStripe();
    const updated = await stripe.subscriptions.update(carrierProfile.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await auditLog({ actorId: userId, action: "subscription.cancel_requested", targetType: "CarrierProfile", targetId: carrierProfile.id });

    return NextResponse.json({ cancelAtPeriodEnd: updated.cancel_at_period_end });
  } catch (err) {
    return handleApiError(err);
  }
}
