import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { handleApiError } from "@/lib/api-error";
import { auditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/stripe/subscription/reactivate — undoes a pending
// cancel_at_period_end before the period actually ends. Only works while
// the subscription is still active (Stripe won't let you "reactivate" a
// subscription that has already ended — that requires a brand new
// checkout, which the membership page already offers).
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "CARRIER") {
      return NextResponse.json({ error: "Carrier account required" }, { status: 403 });
    }
    const userId = (session.user as any).id;
    const rl = rateLimit(`sub-reactivate:${userId}`, 5, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests — try again shortly." }, { status: 429 });

    const carrierProfile = await prisma.carrierProfile.findUnique({ where: { userId } });
    if (!carrierProfile?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 409 });
    }

    const stripe = getStripe();
    const updated = await stripe.subscriptions.update(carrierProfile.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await auditLog({ actorId: userId, action: "subscription.reactivated", targetType: "CarrierProfile", targetId: carrierProfile.id });

    return NextResponse.json({ cancelAtPeriodEnd: updated.cancel_at_period_end });
  } catch (err) {
    return handleApiError(err);
  }
}
