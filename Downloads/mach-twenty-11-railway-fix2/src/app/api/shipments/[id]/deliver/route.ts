import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { handleApiError } from "@/lib/api-error";

// POST /api/shipments/:id/deliver — marks a shipment delivered and
// releases escrow to the winning carrier via a Stripe Connect transfer.
// Requires the carrier to have completed Connect onboarding
// (carrierProfile.stripeAccountId set) — see /api/stripe/connect/onboard.
// Callable by the shipper (confirming receipt) or the awarded carrier.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const shipment = await prisma.shipment.findUnique({
      where: { id: id },
      include: { bids: { where: { won: true } }, payment: true },
    });
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (shipment.status !== "AWARDED" && shipment.status !== "IN_TRANSIT") {
      return NextResponse.json({ error: "Shipment must be awarded before it can be marked delivered" }, { status: 409 });
    }

    const winningBid = shipment.bids[0];
    if (!winningBid) return NextResponse.json({ error: "No winning bid on file" }, { status: 409 });

    const isShipper = shipment.shipperId === userId;
    const isCarrier = winningBid.carrierId === userId;
    if (!isShipper && !isCarrier) {
      return NextResponse.json({ error: "Only the shipper or awarded carrier can mark this delivered" }, { status: 403 });
    }

    const carrierProfile = await prisma.carrierProfile.findUnique({ where: { userId: winningBid.carrierId } });
    if (!carrierProfile?.stripeAccountId) {
      await prisma.shipment.update({ where: { id: shipment.id }, data: { status: "DELIVERED" } });
      return NextResponse.json(
        { status: "DELIVERED", warning: "Carrier has not completed payout onboarding yet — funds were not released." },
        { status: 202 }
      );
    }

    if (!shipment.payment || shipment.payment.status !== "ESCROWED") {
      await prisma.shipment.update({ where: { id: shipment.id }, data: { status: "DELIVERED" } });
      return NextResponse.json({ warning: "No escrowed payment found to release." });
    }

    try {
      const stripe = getStripe();
      const payoutAmountCents = Math.round((shipment.payment.amount - shipment.payment.platformFee) * 100);
      const transfer = await stripe.transfers.create({
        amount: payoutAmountCents,
        currency: "usd",
        destination: carrierProfile.stripeAccountId,
        transfer_group: shipment.id,
      });

      await prisma.$transaction([
        prisma.shipment.update({ where: { id: shipment.id }, data: { status: "DELIVERED" } }),
        prisma.payment.update({
          where: { id: shipment.payment.id },
          data: { status: "RELEASED", stripeTransferId: transfer.id },
        }),
      ]);

      return NextResponse.json({ status: "DELIVERED", transferId: transfer.id });
    } catch (err: any) {
      // Delivery confirmation itself should not be blocked by a payout
      // failure (e.g. Stripe not configured in dev) — record it, don't lose
      // the delivery event.
      await prisma.shipment.update({ where: { id: shipment.id }, data: { status: "DELIVERED" } });
      return NextResponse.json(
        { status: "DELIVERED", payoutError: err.message || "Payout failed; escrow remains ESCROWED for manual release." },
        { status: 207 }
      );
    }

  } catch (err) {
    return handleApiError(err);
  }
}
