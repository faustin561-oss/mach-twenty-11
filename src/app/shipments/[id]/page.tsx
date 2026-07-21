import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread, DisputeButton } from "@/components/ShipmentDetailActions";
import CarrierRecommendations from "@/components/CarrierRecommendations";
import ShipmentPaymentCard from "@/components/ShipmentPaymentCard";
import UrgentFeeButton from "@/components/UrgentFeeButton";
import { formatShipmentRef } from "@/lib/shipment-ref";
import AppShell from "@/components/AppShell";
import DbSetupNotice from "@/components/DbSetupNotice";
import { safeDbCall } from "@/lib/safe-db";

// Shipment detail — increment 5 for messaging/disputes, increment 7 adds
// DB-safety wrapping and the shared AppShell. Enforces the same
// sealed-bid visibility rule as the API (GET /api/shipments/:id) directly
// in the page query, not just the route.
export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/shipments/${id}`);
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const { data: shipment, dbUnavailable } = await safeDbCall(
    () =>
      prisma.shipment.findUnique({
        where: { id },
        include: {
          shipper: { select: { name: true } },
          bids: { include: { carrier: { select: { name: true } } } },
          disputes: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    null as any // (see safe-db.ts fix note: ReturnType<typeof prisma.X> resolves to the base/no-relations overload, not this query's actual include-aware shape — casting to any here lets T infer correctly from the real query instead)
  );

  if (dbUnavailable) {
    return (
      <AppShell role={role} breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Shipment" }]}>
        <div className="mx-auto max-w-3xl px-6 py-10">
          <DbSetupNotice what="This shipment" />
        </div>
      </AppShell>
    );
  }
  if (!shipment) notFound();

  const winningBid = shipment.bids.find((b: any) => b.won);
  const isShipper = shipment.shipperId === userId;
  const isAwardedCarrier = winningBid?.carrierId === userId;
  const myBid = shipment.bids.find((b: any) => b.carrierId === userId);
  if (!isShipper && !myBid) notFound(); // not a party to this shipment

  const sealed = shipment.status === "OPEN_FOR_BIDS";
  const visibleBids = shipment.bids.filter((b: any) => !sealed || b.carrierId === userId);
  const openDispute = shipment.disputes[0]?.status === "OPEN" ? shipment.disputes[0] : null;

  // Simple, disclosed anomaly heuristic — not fraud detection, just a
  // flag when a bid sits well below the pack, worth a second look before
  // awarding (e.g. a typo'd rate or a bid that can't actually be honored).
  const revealedAmounts: number[] = visibleBids.filter((b: any) => b.amount != null).map((b: any) => b.amount);
  const sortedAmounts = [...revealedAmounts].sort((a: number, b: number) => a - b);
  const median = sortedAmounts.length ? sortedAmounts[Math.floor(sortedAmounts.length / 2)] : null;

  return (
    <AppShell role={role} breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: `${shipment.originAddress} → ${shipment.destAddress}` }]}>
      <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{shipment.originAddress} → {shipment.destAddress}</h1>
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs">{shipment.status}</span>
      </div>
      <p className="mt-1 text-sm text-black/50">
        <span className="font-mono">{formatShipmentRef(shipment.refSeq, shipment.createdAt)}</span>
        {" · "}{shipment.mode} · {shipment.cargoDescription} · {shipment.weightLb.toLocaleString()} lb
        {shipment.isUrgent && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">URGENT</span>}
      </p>

      {isShipper && !shipment.isUrgent && shipment.status === "OPEN_FOR_BIDS" && (
        <div className="mt-4">
          <UrgentFeeButton shipmentId={shipment.id} />
        </div>
      )}

      {(isShipper || isAwardedCarrier) && ["AWARDED", "IN_TRANSIT", "DELIVERED"].includes(shipment.status) && (
        <div className="mt-4">
          <DisputeButton shipmentId={shipment.id} alreadyDisputed={!!openDispute} />
        </div>
      )}

      <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase text-black/50">Bids</h2>
        <div className="mt-3 space-y-2">
          {visibleBids.length === 0 && <p className="text-xs text-black/40">{sealed ? "Bids are sealed until the deadline." : "No bids yet."}</p>}
          {visibleBids.map((b: any) => {
            const isLowOutlier = median && sortedAmounts.length >= 3 && b.amount < median * 0.6;
            return (
              <div key={b.id} className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${b.won ? "border-green-300 bg-green-50" : "border-black/10"}`}>
                <span>{b.carrier.name} · {b.etaDays}d ETA {isLowOutlier && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">unusually low — double check</span>}</span>
                <span className="font-medium">${b.amount.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {["AWARDED", "IN_TRANSIT", "DELIVERED"].includes(shipment.status) && (
        <div className="mt-6">
          <ShipmentPaymentCard shipmentId={shipment.id} />
        </div>
      )}

      {isShipper && shipment.status !== "AWARDED" && shipment.status !== "DELIVERED" && (
        <div className="mt-6">
          <CarrierRecommendations shipmentId={shipment.id} />
        </div>
      )}

      <div className="mt-6">
        <MessageThread shipmentId={shipment.id} />
      </div>
      </div>
    </AppShell>
  );
}
