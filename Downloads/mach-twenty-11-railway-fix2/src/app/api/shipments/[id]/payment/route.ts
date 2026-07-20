import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { formatShipmentRef } from "@/lib/shipment-ref";

// GET /api/shipments/:id/payment — the payment/fee breakdown for the
// shipment payment screen: accepted bid, platform fee (5%, whatever rate
// was actually applied at award time — read from the stored Payment row,
// not recomputed, so historical records stay accurate even if the rate
// ever changes), total, and status. Restricted to the shipper and the
// awarded carrier — the two parties who should see this.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        payment: true,
        bids: { where: { won: true }, take: 1 },
        shipper: { select: { name: true } },
      },
    });
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const winningBid = shipment.bids[0];
    const isShipper = shipment.shipperId === userId;
    const isAwardedCarrier = winningBid?.carrierId === userId;
    if (!isShipper && !isAwardedCarrier) {
      return NextResponse.json({ error: "Not authorized to view this shipment's payment details" }, { status: 403 });
    }
    if (!shipment.payment) {
      return NextResponse.json({ payment: null, note: "No payment record yet — this shipment hasn't been awarded." });
    }

    return NextResponse.json({
      payment: {
        shipmentRef: formatShipmentRef(shipment.refSeq, shipment.createdAt),
        bidAmount: shipment.payment.amount,
        platformFee: shipment.payment.platformFee,
        total: shipment.payment.amount + shipment.payment.platformFee,
        status: shipment.payment.status,
        createdAt: shipment.payment.createdAt,
        stripePaymentIntentId: shipment.payment.stripePaymentIntentId,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
