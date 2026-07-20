import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({ reason: z.string().min(10).max(2000) });

// POST /api/shipments/:id/dispute — either party on an awarded shipment
// can raise a dispute, which freezes the shipment's status and notifies
// admins + the counterparty. Escrow stays ESCROWED/RELEASED as-is until an
// admin resolves it via /api/admin/disputes/:id/resolve.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const shipment = await prisma.shipment.findUnique({
      where: { id: id },
      include: { bids: { where: { won: true } } },
    });
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const winningBid = shipment.bids[0];
    const isShipper = shipment.shipperId === userId;
    const isCarrier = winningBid?.carrierId === userId;
    if (!isShipper && !isCarrier) {
      return NextResponse.json({ error: "Only the shipper or awarded carrier can raise a dispute" }, { status: 403 });
    }
    if (!["AWARDED", "IN_TRANSIT", "DELIVERED"].includes(shipment.status)) {
      return NextResponse.json({ error: "Shipment must be awarded before it can be disputed" }, { status: 409 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const [dispute] = await prisma.$transaction([
      prisma.dispute.create({
        data: { shipmentId: shipment.id, raisedById: userId, reason: parsed.data.reason },
      }),
      prisma.shipment.update({ where: { id: shipment.id }, data: { status: "DISPUTED" } }),
    ]);

    const counterparty = isShipper ? winningBid?.carrierId : shipment.shipperId;
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true } });
    await Promise.all([
      counterparty ? notify(counterparty, "Dispute raised", `A dispute was raised on ${shipment.originAddress} → ${shipment.destAddress}.`) : null,
      ...admins.map((a) => notify(a.id, "New dispute to review", `Dispute raised on shipment ${shipment.id}.`)),
    ]);

    return NextResponse.json({ dispute }, { status: 201 });

  } catch (err) {
    return handleApiError(err);
  }
}
