import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";

// GET /api/shipments/:id — shipment detail.
// Sealed-bid rule: while status === OPEN_FOR_BIDS, bid amounts/etas are
// stripped for everyone except the shipment owner (who never sees them
// either, until reveal — that's what makes it a real sealed auction, not
// just a hidden-until-you-ask one) and each carrier's own bid.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const shipment = await prisma.shipment.findUnique({
      where: { id: id },
      include: {
        shipper: { select: { name: true } },
        bids: { include: { carrier: { select: { name: true } } } },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const sealed = shipment.status === "OPEN_FOR_BIDS";
    const userId = (session?.user as any)?.id;

    const bids = shipment.bids.map((b) => {
      const isOwnBid = b.carrierId === userId;
      if (!sealed || isOwnBid) return b;
      // strip commercial terms, keep only existence of the bid
      return { id: b.id, shipmentId: b.shipmentId, carrierId: null, carrier: null, amount: null, etaDays: null, message: null, won: false, createdAt: b.createdAt, sealed: true };
    });

    return NextResponse.json({ shipment: { ...shipment, bids } });

  } catch (err) {
    return handleApiError(err);
  }
}
