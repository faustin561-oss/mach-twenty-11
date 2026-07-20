import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fromJsonArray } from "@/lib/json-array";
import { handleApiError } from "@/lib/api-error";

// GET /api/ai/carrier-recommendations?shipmentId=...
//
// Honest scope: ranks active, membership-current carriers by rating and
// equipment-type overlap with the shipment's cargo description (simple
// keyword match against CarrierProfile.equipmentTypes) — a real, useful
// heuristic, not a trained matching model. Shipper-only, since it surfaces
// carrier standing data.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const shipmentId = new URL(req.url).searchParams.get("shipmentId");
    if (!shipmentId) return NextResponse.json({ error: "shipmentId is required" }, { status: 400 });

    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (shipment.shipperId !== (session.user as any).id) {
      return NextResponse.json({ error: "Only the shipper who posted this load can view recommendations" }, { status: 403 });
    }

    const carriers = await prisma.carrierProfile.findMany({
      where: { membershipActive: true },
      include: { user: { select: { name: true } } },
      take: 200,
    });

    const cargoLower = shipment.cargoDescription.toLowerCase();
    const scored = carriers
      .map((c) => {
        const equipmentTypes = fromJsonArray(c.equipmentTypes);
        const equipmentMatch = equipmentTypes.some((eq) => cargoLower.includes(eq.toLowerCase()));
        const score = c.rating * 10 + (equipmentMatch ? 15 : 0);
        return { carrierId: c.userId, name: c.user.name, rating: c.rating, equipmentTypes, equipmentMatch, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({ recommendations: scored });

  } catch (err) {
    return handleApiError(err);
  }
}
