import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

// DELETE /api/bids/:shipmentId — carrier withdraws their own sealed bid.
// Only allowed while the shipment is still OPEN_FOR_BIDS — once bids are
// revealed or the shipment is awarded, withdrawing would be
// indistinguishable from tampering with a result the other party may
// already be relying on.
export async function DELETE(req: Request, { params }: { params: Promise<{ shipmentId: string }> }) {
  try {
    const { shipmentId } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const carrierId = (session.user as any).id;

    const rl = rateLimit(`bid-withdraw:${carrierId}`, 20, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests — try again shortly." }, { status: 429 });

    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (shipment.status !== "OPEN_FOR_BIDS") {
      return NextResponse.json({ error: "Bids can only be withdrawn while still sealed" }, { status: 409 });
    }

    const bid = await prisma.bid.findUnique({ where: { shipmentId_carrierId: { shipmentId, carrierId } } });
    if (!bid) return NextResponse.json({ error: "No bid to withdraw" }, { status: 404 });

    await prisma.bid.delete({ where: { id: bid.id } });
    return NextResponse.json({ withdrawn: true });
  } catch (err) {
    return handleApiError(err);
  }
}
