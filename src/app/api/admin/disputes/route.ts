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
    const disputes = await prisma.dispute.findMany({
      orderBy: { createdAt: "desc" },
      include: { shipment: true, raisedBy: { select: { name: true, email: true } } },
    });
    return NextResponse.json({ disputes });

  } catch (err) {
    return handleApiError(err);
  }
}
