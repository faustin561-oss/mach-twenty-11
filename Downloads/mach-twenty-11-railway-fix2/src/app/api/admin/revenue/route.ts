import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { PLATFORM_FEE_RATE } from "@/lib/stripe";

// GET /api/admin/revenue — Mach Twenty 11's platform fee revenue
// reporting. Every number here is summed from the actual Payment rows
// created server-side at award time (src/app/api/shipments/[id]/award/route.ts),
// never recomputed from bid amounts here — this reports what was
// actually recorded, which is the point of having a ledger at all.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      select: { amount: true, platformFee: true, status: true, createdAt: true },
    });

    const released = payments.filter((p) => p.status === "RELEASED");
    const escrowed = payments.filter((p) => p.status === "ESCROWED");
    const refunded = payments.filter((p) => p.status === "REFUNDED");

    const sum = (rows: typeof payments, field: "amount" | "platformFee") =>
      rows.reduce((total, r) => total + r[field], 0);

    const now = new Date();
    const thisMonth = payments.filter(
      (p) => p.createdAt.getMonth() === now.getMonth() && p.createdAt.getFullYear() === now.getFullYear()
    );

    return NextResponse.json({
      platformFeeRate: PLATFORM_FEE_RATE,
      allTime: {
        totalPlatformFeeRevenue: sum(payments, "platformFee"),
        totalGmv: sum(payments, "amount"), // gross merchandise value — total bid volume that went through escrow
        shipmentCount: payments.length,
      },
      released: {
        platformFeeRevenue: sum(released, "platformFee"),
        count: released.length,
      },
      escrowed: {
        platformFeePending: sum(escrowed, "platformFee"),
        count: escrowed.length,
      },
      refunded: {
        platformFeeLost: sum(refunded, "platformFee"),
        count: refunded.length,
      },
      thisMonth: {
        platformFeeRevenue: sum(thisMonth, "platformFee"),
        count: thisMonth.length,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
