import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  cdlNumber: z.string().optional(),
  cdlExpiresAt: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await prisma.carrierProfile.findUnique({ where: { userId: (session.user as any).id } });
    if (!profile) return NextResponse.json({ drivers: [] });

    const drivers = await prisma.driver.findMany({
      where: { carrierProfileId: profile.id },
      include: { vehicles: { select: { id: true, unitNumber: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ drivers });

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
    const profile = await prisma.carrierProfile.findUnique({ where: { userId: (session.user as any).id } });
    if (!profile) return NextResponse.json({ error: "Complete your carrier profile first" }, { status: 409 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const driver = await prisma.driver.create({
      data: {
        ...parsed.data,
        cdlExpiresAt: parsed.data.cdlExpiresAt ? new Date(parsed.data.cdlExpiresAt) : undefined,
        carrierProfileId: profile.id,
      },
    });
    return NextResponse.json({ driver }, { status: 201 });

  } catch (err) {
    return handleApiError(err);
  }
}
