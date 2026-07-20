import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { handleApiError } from "@/lib/api-error";
import { PLATFORM_FEE_RATE } from "@/lib/stripe";
import { auditLog } from "@/lib/audit";

const awardSchema = z.object({ bidId: z.string().cuid() });

// POST /api/shipments/:id/award — shipper picks a winning bid.
// Only allowed once bids have been revealed (deadline passed).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const shipment = await prisma.shipment.findUnique({ where: { id: id } });
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (shipment.shipperId !== (session.user as any).id) {
      return NextResponse.json({ error: "Only the shipper who posted this load can award it" }, { status: 403 });
    }
    if (shipment.status !== "BIDS_REVEALED") {
      return NextResponse.json({ error: "Bids must be revealed before awarding" }, { status: 409 });
    }

    const body = await req.json();
    const parsed = awardSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const bid = await prisma.bid.findUnique({ where: { id: parsed.data.bidId } });
    if (!bid || bid.shipmentId !== shipment.id) {
      return NextResponse.json({ error: "Bid does not belong to this shipment" }, { status: 400 });
    }

    const [, , updatedShipment] = await prisma.$transaction([
      prisma.bid.updateMany({ where: { shipmentId: shipment.id }, data: { won: false } }),
      prisma.bid.update({ where: { id: bid.id }, data: { won: true } }),
      prisma.shipment.update({ where: { id: shipment.id }, data: { status: "AWARDED" } }),
    ]);

    // Escrow record — actual payment intent capture happens client-side with
    // Stripe Elements (not built yet, see README); this creates the ledger
    // entry so the deliver→payout flow has something to release. Platform
    // fee is 5% (PLATFORM_FEE_RATE, src/lib/stripe.ts) computed here,
    // server-side, from the bid amount already stored in the database —
    // never from anything in the request body.
    const platformFee = bid.amount * PLATFORM_FEE_RATE;
    await prisma.$transaction([
      prisma.payment.upsert({
        where: { shipmentId: shipment.id },
        update: { amount: bid.amount, platformFee, status: "ESCROWED" },
        create: {
          shipmentId: shipment.id,
          payerId: shipment.shipperId,
          amount: bid.amount,
          platformFee,
          status: "ESCROWED",
        },
      }),
      prisma.transaction.create({
        data: {
          userId: shipment.shipperId,
          shipmentId: shipment.id,
          type: "PLATFORM_FEE" as any,
          status: "PENDING" as any, // becomes SUCCEEDED once real payment capture is wired — see README
          amount: platformFee,
        },
      }),
    ]);

    await auditLog({
      actorId: shipment.shipperId,
      action: "shipment.award",
      targetType: "Shipment",
      targetId: shipment.id,
      metadata: { bidId: bid.id, amount: bid.amount, platformFee },
    });

    await notify(
      bid.carrierId,
      "You won a load",
      `You were awarded ${shipment.originAddress} → ${shipment.destAddress} at $${bid.amount.toLocaleString()}.`
    );

    return NextResponse.json({ shipment: updatedShipment, winningBidId: bid.id });

  } catch (err) {
    return handleApiError(err);
  }
}
