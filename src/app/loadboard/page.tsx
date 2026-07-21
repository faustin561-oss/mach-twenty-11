import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoadBoardClient from "./LoadBoardClient";
import AppShell from "@/components/AppShell";
import DbSetupNotice from "@/components/DbSetupNotice";
import LiveFreightMarket from "@/components/LiveFreightMarket";
import { safeDbCall } from "@/lib/safe-db";

// Load board — public page (no auth required to browse; bidding still
// requires a carrier session, enforced by /api/bids). Increment 7 wraps
// the DB read for safety and moves the page into the shared AppShell.
export default async function LoadBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const session = await auth();

  const { data: shipments, dbUnavailable } = await safeDbCall(
    () =>
      prisma.shipment.findMany({
        where: {
          status: "OPEN_FOR_BIDS",
          ...(mode ? { mode: mode as any } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { _count: { select: { bids: true } }, shipper: { select: { name: true } } },
      }),
    [] as any // see the note in shipments/[id]/page.tsx — ReturnType<typeof prisma.X> is the base overload, not this query's actual include-aware shape
  );

  const rows = shipments.map((s: any) => ({
    id: s.id,
    mode: s.mode,
    originAddress: s.originAddress,
    originLat: s.originLat,
    originLng: s.originLng,
    destAddress: s.destAddress,
    destLat: s.destLat,
    destLng: s.destLng,
    weightLb: s.weightLb,
    bidDeadline: s.bidDeadline.toISOString(),
    bidCount: s._count.bids,
    isUrgent: s.isUrgent,
  }));

  return (
    <AppShell role={session?.user ? (session.user as any).role : undefined} breadcrumbs={[{ label: "Load Board" }]}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Load Board</h1>
          <Link href="/ship/new" className="rounded-md bg-m20amber px-4 py-2 text-sm font-medium text-black">
            Post a Load
          </Link>
        </div>
        <div className="mt-6">
          {!dbUnavailable && <LiveFreightMarket />}
        </div>
        <div className="mt-6">
          {dbUnavailable ? <DbSetupNotice what="The load board" /> : <LoadBoardClient shipments={rows} />}
        </div>
      </div>
    </AppShell>
  );
}
