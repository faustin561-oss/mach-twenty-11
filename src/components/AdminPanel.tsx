"use client";

import { useEffect, useState } from "react";

type Tab = "revenue" | "users" | "shipments" | "disputes";

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("revenue");
  const [users, setUsers] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [u, s, d, r] = await Promise.all([
      fetch("/api/admin/users").then((r) => (r.ok ? r.json() : { users: [] })),
      fetch("/api/admin/shipments").then((r) => (r.ok ? r.json() : { shipments: [] })),
      fetch("/api/admin/disputes").then((r) => (r.ok ? r.json() : { disputes: [] })),
      fetch("/api/admin/revenue").then((r) => (r.ok ? r.json() : null)),
    ]);
    setUsers(u.users);
    setShipments(s.shipments);
    setDisputes(d.disputes);
    setRevenue(r);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function resolveDispute(id: string, outcome: "RELEASE" | "REFUND" | "REJECT") {
    const resolution = window.prompt("Resolution note (shown to the person who raised it):");
    if (!resolution || resolution.length < 5) return;
    const res = await fetch(`/api/admin/disputes/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, resolution }),
    });
    if (res.ok) loadAll();
  }

  return (
    <div>
      <div className="flex gap-2 border-b border-black/10">
        {(["revenue", "disputes", "shipments", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-m20navy text-m20navy" : "text-black/50"}`}
          >
            {t} {t === "disputes" && disputes.filter((d) => d.status === "OPEN").length > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                {disputes.filter((d) => d.status === "OPEN").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-sm text-black/40">Loading...</p>}

      {!loading && tab === "revenue" && (
        <div className="mt-6 space-y-4">
          {!revenue ? (
            <p className="text-sm text-black/40">Could not load revenue data.</p>
          ) : (
            <>
              <p className="text-xs text-black/40">
                Every Mach Twenty 11 platform fee is {(revenue.platformFeeRate * 100).toFixed(0)}% of the accepted bid, computed server-side at award time and never altered afterward — this reports what was actually recorded in the Payment ledger, not a recomputation.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <RevenueCard label="Total Platform Revenue (all time)" value={`$${revenue.allTime.totalPlatformFeeRevenue.toFixed(2)}`} />
                <RevenueCard label="Total GMV (all time)" value={`$${revenue.allTime.totalGmv.toFixed(2)}`} />
                <RevenueCard label="Shipments w/ Fee" value={String(revenue.allTime.shipmentCount)} />
                <RevenueCard label="This Month" value={`$${revenue.thisMonth.platformFeeRevenue.toFixed(2)}`} />
                <RevenueCard label="Released to Platform" value={`$${revenue.released.platformFeeRevenue.toFixed(2)}`} sub={`${revenue.released.count} shipments`} />
                <RevenueCard label="Pending in Escrow" value={`$${revenue.escrowed.platformFeePending.toFixed(2)}`} sub={`${revenue.escrowed.count} shipments`} highlight={revenue.escrowed.count > 0} />
                <RevenueCard label="Lost to Refunds" value={`$${revenue.refunded.platformFeeLost.toFixed(2)}`} sub={`${revenue.refunded.count} shipments`} negative={revenue.refunded.count > 0} />
              </div>
            </>
          )}
        </div>
      )}

      {!loading && tab === "disputes" && (
        <div className="mt-6 space-y-3">
          {disputes.length === 0 && <p className="text-sm text-black/40">No disputes.</p>}
          {disputes.map((d) => (
            <div key={d.id} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{d.shipment.originAddress} → {d.shipment.destAddress}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${d.status === "OPEN" ? "bg-amber-100 text-amber-700" : "bg-black/5 text-black/50"}`}>{d.status}</span>
              </div>
              <p className="mt-1 text-xs text-black/50">Raised by {d.raisedBy.name} ({d.raisedBy.email})</p>
              <p className="mt-2 text-sm text-black/70">{d.reason}</p>
              {d.status === "OPEN" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => resolveDispute(d.id, "RELEASE")} className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white">Release Funds</button>
                  <button onClick={() => resolveDispute(d.id, "REFUND")} className="rounded-md bg-amber-600 px-3 py-1.5 text-xs text-white">Refund Shipper</button>
                  <button onClick={() => resolveDispute(d.id, "REJECT")} className="rounded-md border border-black/15 px-3 py-1.5 text-xs">Reject</button>
                </div>
              )}
              {d.resolution && <p className="mt-2 text-xs italic text-black/50">Resolution: {d.resolution}</p>}
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "shipments" && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 text-left text-xs uppercase text-black/50">
              <tr><th className="px-4 py-2">Route</th><th className="px-4 py-2">Mode</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Bids</th><th className="px-4 py-2">Shipper</th></tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2">{s.originAddress} → {s.destAddress}</td>
                  <td className="px-4 py-2">{s.mode}</td>
                  <td className="px-4 py-2">{s.status}</td>
                  <td className="px-4 py-2">{s._count.bids}</td>
                  <td className="px-4 py-2">{s.shipper.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "users" && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 text-left text-xs uppercase text-black/50">
              <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Membership</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">{u.carrierProfile ? (u.carrierProfile.membershipActive ? u.carrierProfile.membershipTier : "inactive") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RevenueCard({ label, value, sub, highlight, negative }: { label: string; value: string; sub?: string; highlight?: boolean; negative?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${negative ? "border-red-200 bg-red-50" : highlight ? "border-amber-200 bg-amber-50" : "border-black/10 bg-white"}`}>
      <div className="text-xs uppercase tracking-wide text-black/50">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${negative ? "text-red-700" : "text-black"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-black/40">{sub}</div>}
    </div>
  );
}
