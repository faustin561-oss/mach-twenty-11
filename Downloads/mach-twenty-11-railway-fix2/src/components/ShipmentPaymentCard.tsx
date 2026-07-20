"use client";

import { useEffect, useState } from "react";

type PaymentInfo = {
  shipmentRef: string;
  bidAmount: number;
  platformFee: number;
  total: number;
  status: string;
  createdAt: string;
} | null;

// Shipment payment/fee breakdown — Priority 2. Reads the actual stored
// Payment row (amount + platformFee computed server-side at award time,
// see src/app/api/shipments/[id]/award/route.ts) rather than
// recomputing the fee client-side, so this always matches what was
// actually charged even if the platform fee rate changes later.
export default function ShipmentPaymentCard({ shipmentId }: { shipmentId: string }) {
  const [info, setInfo] = useState<PaymentInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shipments/${shipmentId}/payment`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setInfo(d?.payment ?? null))
      .finally(() => setLoading(false));
  }, [shipmentId]);

  if (loading) return null;
  if (!info) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-black/50">Payment</h2>
        <span className="font-mono text-xs text-black/40">{info.shipmentRef}</span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-black/60">Accepted carrier bid</span><span>${info.bidAmount.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-black/60">Mach Twenty 11 fee (5%)</span><span>${info.platformFee.toFixed(2)}</span></div>
        <div className="flex justify-between border-t border-black/10 pt-1.5 font-semibold"><span>Total</span><span>${info.total.toFixed(2)}</span></div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={`rounded-full px-2 py-0.5 ${info.status === "RELEASED" ? "bg-green-100 text-green-700" : info.status === "ESCROWED" ? "bg-amber-100 text-amber-700" : "bg-black/5 text-black/50"}`}>
          {info.status}
        </span>
        <span className="text-black/40">{new Date(info.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
