import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const shipments = await prisma.shipment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { shipper: { select: { name: true, email: true } }, _count: { select: { bids: true } } },
    });
    return NextResponse.json({ shipments });

  } catch (err) {
    return handleApiError(err);
  }
}
