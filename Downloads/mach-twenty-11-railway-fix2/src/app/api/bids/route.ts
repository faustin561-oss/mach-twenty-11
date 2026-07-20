import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { handleApiError } from "@/lib/api-error";
import { canCarrierBid } from "@/lib/membership";
import { rateLimit } from "@/lib/rate-limit";

const createBidSchema = z.object({
  shipmentId: z.string().cuid(),
  amount: z.number().positive(),
  etaDays: z.number().int().positive(),
  message: z.string().optional(),
});

// POST /api/bids — carrier submits or updates a sealed bid.
// Bid amounts are withheld from other carriers by /api/shipments/[id] while
// status === OPEN_FOR_BIDS; reveal is server-side, see /api/cron/reveal-bids.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "CARRIER") {
      return NextResponse.json({ error: "Carrier membership required" }, { status: 403 });
    }

    const carrierId = (session.user as any).id;
    const rl = rateLimit(`bid:${carrierId}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many bid submissions — try again shortly." }, { status: 429 });
    }

    const carrierProfile = await prisma.carrierProfile.findUnique({
      where: { userId: carrierId },
    });
    if (!canCarrierBid(carrierProfile)) {
      return NextResponse.json({ error: "Active membership required to bid" }, { status: 402 });
    }

    const body = await req.json();
    const parsed = createBidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const shipment = await prisma.shipment.findUnique({ where: { id: parsed.data.shipmentId } });
    if (!shipment || shipment.status !== "OPEN_FOR_BIDS") {
      return NextResponse.json({ error: "Shipment not open for bidding" }, { status: 409 });
    }
    if (new Date() > shipment.bidDeadline) {
      return NextResponse.json({ error: "Bid deadline has passed" }, { status: 409 });
    }

    const bid = await prisma.bid.upsert({
      where: { shipmentId_carrierId: { shipmentId: parsed.data.shipmentId, carrierId } },
      update: { amount: parsed.data.amount, etaDays: parsed.data.etaDays, message: parsed.data.message },
      create: {
        shipmentId: parsed.data.shipmentId,
        carrierId,
        amount: parsed.data.amount,
        etaDays: parsed.data.etaDays,
        message: parsed.data.message,
      },
    });

    await notify(
      shipment.shipperId,
      "New sealed bid received",
      `A carrier submitted a bid on your shipment ${shipment.originAddress} → ${shipment.destAddress}. Amounts stay sealed until your bid deadline.`
    );

    return NextResponse.json({ bid }, { status: 201 });

  } catch (err) {
    return handleApiError(err);
  }
}
