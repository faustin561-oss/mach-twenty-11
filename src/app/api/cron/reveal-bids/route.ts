import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

// GET /api/cron/reveal-bids — flips OPEN_FOR_BIDS shipments to
// BIDS_REVEALED once their deadline has passed. Wire this to a scheduled
// trigger (Vercel Cron, a Redis-backed worker, etc.) hitting this route
// every minute; protect it with CRON_SECRET so it can't be called publicly.
export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.shipment.updateMany({
      where: { status: "OPEN_FOR_BIDS", bidDeadline: { lte: new Date() } },
      data: { status: "BIDS_REVEALED" },
    });

    return NextResponse.json({ revealed: result.count });

  } catch (err) {
    return handleApiError(err);
  }
}
