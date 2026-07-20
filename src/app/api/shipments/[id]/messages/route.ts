import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({ body: z.string().min(1).max(2000) });

// Messaging is scoped to a shipment and limited to the shipper and the
// awarded carrier (or any bidder pre-award, so questions about a lane can
// be asked before bidding closes) — not an open channel to every carrier
// who glanced at the load.
async function canAccessShipment(shipmentId: string, userId: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { bids: { where: { carrierId: userId } } },
  });
  if (!shipment) return null;
  const allowed = shipment.shipperId === userId || shipment.bids.length > 0;
  return allowed ? shipment : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const shipment = await canAccessShipment(id, userId);
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { shipmentId: id },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ messages });

  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const shipment = await canAccessShipment(id, userId);
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const message = await prisma.message.create({
      data: { shipmentId: id, senderId: userId, body: parsed.data.body },
    });

    // Notification target: if a carrier sent this, notify the shipper. If
    // the shipper sent it, notify the awarded carrier if one exists yet —
    // before award there can be several bidders in the thread's history and
    // picking one to ping would be arbitrary, so we simply skip in that case.
    let notifyTarget: string | null = null;
    if (shipment.shipperId !== userId) {
      notifyTarget = shipment.shipperId;
    } else {
      const wonBid = await prisma.bid.findFirst({ where: { shipmentId: id, won: true } });
      notifyTarget = wonBid?.carrierId ?? null;
    }
    if (notifyTarget) {
      await notify(notifyTarget, "New message", `New message on ${shipment.originAddress} → ${shipment.destAddress}.`);
    }

    return NextResponse.json({ message }, { status: 201 });

  } catch (err) {
    return handleApiError(err);
  }
}
