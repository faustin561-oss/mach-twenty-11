import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { CARRIER_MEMBERSHIP, URGENT_QUOTE_FEE_USD, PLATFORM_FEE_RATE } from "@/lib/stripe";

// GET /api/billing — everything the billing dashboard needs in one call:
// subscription status (carriers), invoices, transactions (urgent fees),
// and shipment payments (platform fee line items) the user is party to.
// Not a denormalized "BillingHistory" table — see the comment in
// prisma/schema.prisma on Transaction for why that was deliberately not
// built as a fourth copy of the same data.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const [carrierProfile, invoices, transactions, payments] = await Promise.all([
      role === "CARRIER"
        ? prisma.carrierProfile.findUnique({ where: { userId }, include: { subscription: true } })
        : Promise.resolve(null),
      prisma.invoice.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.payment.findMany({
        where: { OR: [{ payerId: userId }, { shipment: { bids: { some: { carrierId: userId, won: true } } } }] },
        include: { shipment: { select: { originAddress: true, destAddress: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      pricing: { membershipMonthlyUsd: CARRIER_MEMBERSHIP.monthlyUsd, urgentFeeUsd: URGENT_QUOTE_FEE_USD, platformFeeRate: PLATFORM_FEE_RATE },
      subscription: carrierProfile
        ? {
            active: carrierProfile.membershipActive,
            tier: carrierProfile.membershipTier,
            status: carrierProfile.subscriptionStatus,
            currentPeriodEnd: carrierProfile.currentPeriodEnd,
            cancelAtPeriodEnd: carrierProfile.cancelAtPeriodEnd,
            hasStripeAccount: !!carrierProfile.stripeAccountId,
          }
        : null,
      invoices,
      transactions,
      payments,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
