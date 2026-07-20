import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

// GET /api/ai/price-suggestion?mode=FTL&origin=...&dest=...
//
// Honest scope: this is a statistical rate suggestion computed from your
// own historical won bids — a median/range over past awards for the same
// mode (and the same lane, if there's enough history) — not a call to an
// external ML model or LLM. There's no model training, no external AI
// service wired in here (that would need real infrastructure and a
// dataset this demo doesn't have). It's useful cold-start guidance and
// gets better as more shipments clear the marketplace; it is not a price
// guarantee.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    const origin = searchParams.get("origin")?.toLowerCase();
    const dest = searchParams.get("dest")?.toLowerCase();

    if (!mode) {
      return NextResponse.json({ error: "mode is required" }, { status: 400 });
    }

    const wonBids = await prisma.bid.findMany({
      where: { won: true, shipment: { mode: mode as any } },
      include: { shipment: { select: { originAddress: true, destAddress: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const laneBids = wonBids.filter(
      (b) =>
        origin && dest &&
        b.shipment.originAddress.toLowerCase().includes(origin.split(",")[0]) &&
        b.shipment.destAddress.toLowerCase().includes(dest.split(",")[0])
    );

    const sample = laneBids.length >= 3 ? laneBids : wonBids;
    const basis = laneBids.length >= 3 ? "lane_history" : wonBids.length > 0 ? "mode_history" : "no_data";

    if (sample.length === 0) {
      return NextResponse.json({
        basis,
        suggestion: null,
        note: "No historical awards for this mode yet — no suggestion available.",
      });
    }

    const amounts = sample.map((b) => b.amount).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const low = amounts[Math.floor(amounts.length * 0.25)];
    const high = amounts[Math.floor(amounts.length * 0.75)];

    return NextResponse.json({
      basis,
      sampleSize: sample.length,
      suggestion: { low: Math.round(low), median: Math.round(median), high: Math.round(high) },
      note:
        basis === "lane_history"
          ? `Based on ${sample.length} past awards on this lane.`
          : `Based on ${sample.length} past awards across all ${mode} lanes — not enough lane-specific history yet.`,
    });

  } catch (err) {
    return handleApiError(err);
  }
}
