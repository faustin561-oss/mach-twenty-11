import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  unitNumber: z.string().min(1),
  type: z.string().min(1),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  vin: z.string().optional(),
  plate: z.string().optional(),
});

async function requireCarrierProfile(userId: string) {
  return prisma.carrierProfile.findUnique({ where: { userId } });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await requireCarrierProfile((session.user as any).id);
    if (!profile) return NextResponse.json({ vehicles: [] });

    const vehicles = await prisma.vehicle.findMany({
      where: { carrierProfileId: profile.id },
      include: { assignedDriver: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ vehicles });

  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "CARRIER") {
      return NextResponse.json({ error: "Carrier account required" }, { status: 403 });
    }
    const profile = await requireCarrierProfile((session.user as any).id);
    if (!profile) return NextResponse.json({ error: "Complete your carrier profile first" }, { status: 409 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const vehicle = await prisma.vehicle.create({
      data: { ...parsed.data, carrierProfileId: profile.id },
    });
    return NextResponse.json({ vehicle }, { status: 201 });

  } catch (err) {
    return handleApiError(err);
  }
}
