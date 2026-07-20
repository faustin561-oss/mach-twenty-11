import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

// GET /api/loadboard/live — feeds the Live Freight Market dots. Real
// database records only, per spec — no fabricated/demo data mixed in.
//
// Deliberately does NOT include bid dollar amounts for shipments still
// OPEN_FOR_BIDS: this app's sealed-bid design (every bid hidden from
// other carriers, and from the shipper, until the deadline) is a
// load-bearing feature elsewhere in the codebase — leaking amounts here
// would undermine it. Open shipments show weight (a public attribute) as
// the size signal and bid *count* (not amounts) as a "how contested is
// this" signal instead. Awarded shipments show the actual accepted
// amount, since that's already public/settled by that point.
//
// "Live" here means polled, not pushed — there's no websocket/SSE
// infrastructure in this project (see README's Socket.IO note under
// "still open"). The client polls this endpoint on an interval; this is
// the honest mechanism, not a simulated live feed.
export async function GET() {
  try {
    const [openShipments, awardedRecent, statsRaw] = await Promise.all([
      prisma.shipment.findMany({
        where: { status: "OPEN_FOR_BIDS" },
        select: {
          id: true, mode: true, originAddress: true, destAddress: true,
          weightLb: true, createdAt: true, bidDeadline: true, isUrgent: true,
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.shipment.findMany({
        where: { status: "AWARDED", updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: {
          id: true, mode: true, originAddress: true, destAddress: true,
          weightLb: true, updatedAt: true,
          bids: { where: { won: true }, select: { amount: true }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.payment.aggregate({ _avg: { amount: true }, _count: true }),
    ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const newLoadsToday = openShipments.filter((s) => s.createdAt >= startOfToday).length;
    const activeBids = openShipments.reduce((sum, s) => sum + s._count.bids, 0);

    return NextResponse.json({
      counters: {
        activeShipments: openShipments.length,
        newLoadsToday,
        activeBids,
        averageBid: statsRaw._avg.amount ?? 0,
        recentlyAwarded: awardedRecent.length,
      },
      open: openShipments.map((s) => ({
        id: s.id,
        mode: s.mode,
        origin: s.originAddress,
        dest: s.destAddress,
        weightLb: s.weightLb,
        bidCount: s._count.bids,
        postedAt: s.createdAt,
        bidDeadline: s.bidDeadline,
        isUrgent: s.isUrgent,
      })),
      recentlyAwarded: awardedRecent.map((s) => ({
        id: s.id,
        mode: s.mode,
        origin: s.originAddress,
        dest: s.destAddress,
        weightLb: s.weightLb,
        amount: s.bids[0]?.amount ?? null,
        awardedAt: s.updatedAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
