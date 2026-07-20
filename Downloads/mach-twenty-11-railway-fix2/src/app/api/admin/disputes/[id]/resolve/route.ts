import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  outcome: z.enum(["RELEASE", "REFUND", "REJECT"]),
  resolution: z.string().min(5).max(2000),
});

// POST /api/admin/disputes/:id/resolve — admin-only. RELEASE marks the
// payment released (escrow already paid via Stripe Connect at delivery, so
// this just closes the dispute administratively); REFUND flips the
// Payment to REFUNDED (does not itself call Stripe — see README, a real
// refund still needs a Stripe refund/reversal call wired in); REJECT closes
// the dispute with no payment change.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const dispute = await prisma.dispute.findUnique({ where: { id: id }, include: { shipment: { include: { payment: true } } } });
    if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (dispute.status !== "OPEN") return NextResponse.json({ error: "Dispute already resolved" }, { status: 409 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const statusMap = { RELEASE: "RESOLVED_RELEASE", REFUND: "RESOLVED_REFUND", REJECT: "REJECTED" } as const;

    await prisma.$transaction([
      prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: statusMap[parsed.data.outcome],
          resolution: parsed.data.resolution,
          resolvedById: (session.user as any).id,
          resolvedAt: new Date(),
        },
      }),
      ...(parsed.data.outcome === "REFUND" && dispute.shipment.payment
        ? [prisma.payment.update({ where: { id: dispute.shipment.payment.id }, data: { status: "REFUNDED" } })]
        : []),
      prisma.shipment.update({ where: { id: dispute.shipmentId }, data: { status: "DELIVERED" } }),
    ]);

    await notify(dispute.raisedById, "Dispute resolved", `Your dispute was resolved: ${parsed.data.resolution}`);

    return NextResponse.json({ status: statusMap[parsed.data.outcome] });

  } catch (err) {
    return handleApiError(err);
  }
}
