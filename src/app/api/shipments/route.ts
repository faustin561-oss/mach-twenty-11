import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { toJsonArray } from "@/lib/json-array";
import { nextShipmentRefSeq } from "@/lib/shipment-ref";

const createShipmentSchema = z.object({
  mode: z.enum([
    "LTL", "FTL", "OCEAN_FCL", "OCEAN_LCL", "AIR", "RAIL", "VEHICLE", "BOAT",
    "HOUSEHOLD_MOVING", "HEAVY_EQUIPMENT", "AGRICULTURE", "CONSTRUCTION",
    "MEDICAL", "COURIER", "SPECIALTY",
  ]),
  originAddress: z.string().min(3),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destAddress: z.string().min(3),
  destLat: z.number().optional(),
  destLng: z.number().optional(),
  cargoDescription: z.string().min(3),
  weightLb: z.number().positive(),
  hazmat: z.boolean().optional(),
  fragile: z.boolean().optional(),
  tempControlled: z.boolean().optional(),
  pickupWindowStart: z.string().datetime(),
  bidDeadline: z.string().datetime(),
  // Was previously missing from this schema entirely — the wizard has
  // sent this since increment 2, but zod silently strips unknown keys by
  // default, so every uploaded photo URL was quietly dropped before it
  // ever reached the database. Unrelated to the SQLite migration, found
  // while touching this field for that; fixed at the same time.
  photos: z.array(z.string()).optional(),
});

// GET /api/shipments — load board query. Supports filtering by mode/status.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || undefined;
    const status = searchParams.get("status") || "OPEN_FOR_BIDS";
    const take = Math.min(Number(searchParams.get("take") ?? 25), 100);
    const cursor = searchParams.get("cursor") || undefined;

    const shipments = await prisma.shipment.findMany({
      where: {
        ...(mode ? { mode: mode as any } : {}),
        status: status as any,
      },
      orderBy: { createdAt: "desc" },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        _count: { select: { bids: true } },
        shipper: { select: { name: true } },
      },
    });

    const nextCursor = shipments.length === take ? shipments[shipments.length - 1].id : null;

    return NextResponse.json({ shipments, nextCursor });

  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/shipments — customer posts a new load.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createShipmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { photos, ...rest } = parsed.data;
    const refSeq = await nextShipmentRefSeq();
    const shipment = await prisma.shipment.create({
      data: {
        shipperId: (session.user as any).id,
        status: "OPEN_FOR_BIDS",
        refSeq,
        ...rest,
        photos: toJsonArray(photos || []) as any,
        pickupWindowStart: new Date(parsed.data.pickupWindowStart),
        bidDeadline: new Date(parsed.data.bidDeadline),
      },
    });

    return NextResponse.json({ shipment }, { status: 201 });

  } catch (err) {
    return handleApiError(err);
  }
}
