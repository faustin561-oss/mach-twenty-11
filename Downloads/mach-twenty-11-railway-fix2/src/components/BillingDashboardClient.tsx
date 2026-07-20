"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BillingData = {
  pricing: { membershipMonthlyUsd: number; urgentFeeUsd: number; platformFeeRate: number };
  subscription: { active: boolean; tier: string; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
  invoices: { id: string; amount: number; status: string; hostedInvoiceUrl: string | null; invoicePdfUrl: string | null; createdAt: string }[];
  transactions: { id: string; type: string; status: string; amount: number; shipmentId: string | null; createdAt: string }[];
  payments: { id: string; amount: number; platformFee: number; status: string; shipmentId: string; shipment: { originAddress: string; destAddress: string }; createdAt: string }[];
};

export default function BillingDashboardClient() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-black/40">Loading billing history...</p>;
  if (!data) return <p className="text-sm text-black/40">Could not load billing history.</p>;

  return (
    <div className="max-w-4xl space-y-8">
      {data.subscription && (
        <section className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-black/50">Membership</h2>
            <Link href="/carrier/membership" className="text-xs font-medium text-m20navy underline">Manage</Link>
          </div>
          <p className="mt-2 text-sm">
            <span className={data.subscription.active ? "text-green-700" : "text-red-700"}>{data.subscription.status}</span>
            {" · "}${data.pricing.membershipMonthlyUsd.toFixed(2)}/mo
            {data.subscription.currentPeriodEnd && (
              <> · {data.subscription.cancelAtPeriodEnd ? "ends" : "renews"} {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}</>
            )}
          </p>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase text-black/50">Invoices &amp; Receipts</h2>
        <div className="mt-3 space-y-2">
          {data.invoices.length === 0 && <p className="text-sm text-black/40">No invoices yet.</p>}
          {data.invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-lg border border-black/10 bg-white p-4 text-sm">
              <div>
                <span className="font-medium">${inv.amount.toFixed(2)}</span>
                <span className="ml-2 text-black/50">{inv.status}</span>
                <span className="ml-2 text-black/40">{new Date(inv.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-3">
                {inv.hostedInvoiceUrl && <a href={inv.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-m20navy underline">View Invoice</a>}
                {inv.invoicePdfUrl && <a href={inv.invoicePdfUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-m20navy underline">Receipt (PDF)</a>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase text-black/50">Urgent-Quote Fees</h2>
        <div className="mt-3 space-y-2">
          {data.transactions.filter((t) => t.type === "URGENT_FEE").length === 0 && <p className="text-sm text-black/40">None yet.</p>}
          {data.transactions.filter((t) => t.type === "URGENT_FEE").map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-black/10 bg-white p-4 text-sm">
              <div>
                <span className="font-medium">${t.amount.toFixed(2)}</span>
                <span className={`ml-2 ${t.status === "SUCCEEDED" ? "text-green-700" : t.status === "FAILED" ? "text-red-700" : "text-black/50"}`}>{t.status}</span>
                <span className="ml-2 text-black/40">{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
              {t.shipmentId && <Link href={`/shipments/${t.shipmentId}`} className="text-xs font-medium text-m20navy underline">View Shipment</Link>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase text-black/50">Shipment Transactions &amp; Platform Fees</h2>
        <div className="mt-3 space-y-2">
          {data.payments.length === 0 && <p className="text-sm text-black/40">No shipment payments yet.</p>}
          {data.payments.map((p) => (
            <div key={p.id} className="rounded-lg border border-black/10 bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.shipment.originAddress} → {p.shipment.destAddress}</span>
                <span className={`${p.status === "RELEASED" ? "text-green-700" : "text-black/50"}`}>{p.status}</span>
              </div>
              <div className="mt-1 flex gap-4 text-black/50">
                <span>Bid ${p.amount.toFixed(2)}</span>
                <span>Fee ${p.platformFee.toFixed(2)} ({(data.pricing.platformFeeRate * 100).toFixed(0)}%)</span>
                <span>Total ${(p.amount + p.platformFee).toFixed(2)}</span>
                <Link href={`/shipments/${p.shipmentId}`} className="font-medium text-m20navy underline">View</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
