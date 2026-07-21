import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ConnectPayoutButton, DeliverButton } from "@/components/CarrierActions";
import AppShell from "@/components/AppShell";
import DbSetupNotice from "@/components/DbSetupNotice";
import { safeDbCall } from "@/lib/safe-db";

// Carrier dashboard — increment 7 wraps the DB reads for safety and moves
// the page into the shared AppShell (nav/notifications now live there).
// GPS tracking, POD upload, and AI dispatch suggestions are not built yet;
// see README roadmap.
export default async function CarrierDashboardPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "CARRIER") {
    redirect("/login?callbackUrl=/carrier/dashboard");
  }

  const userId = (session.user as any).id;
  const { data, dbUnavailable } = await safeDbCall(
    () =>
      Promise.all([
        prisma.carrierProfile.findUnique({ where: { userId }, include: { vehicles: true, drivers: true } }),
        prisma.bid.findMany({ where: { carrierId: userId, won: true }, include: { shipment: true }, orderBy: { createdAt: "desc" } }),
      ]),
    [null, []] as any // see the note in shipments/[id]/page.tsx — ReturnType<typeof prisma.X> is the base overload, not this query's actual include-aware shape
  );
  const [profile, wonBids] = data;

  const revenue = wonBids.reduce((sum: number, b: any) => sum + b.amount, 0);
  const activeLoads = wonBids.filter((b: any) => !["DELIVERED", "CANCELLED"].includes(b.shipment.status));

  return (
    <AppShell role="CARRIER" breadcrumbs={[{ label: "Carrier Dashboard" }]}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Carrier Dashboard</h1>
          <Link href="/loadboard" className="rounded-md bg-m20amber px-4 py-2 text-sm font-medium text-black">
            Browse Loads
          </Link>
        </div>

        {dbUnavailable ? (
          <div className="mt-8">
            <DbSetupNotice what="Your carrier dashboard" />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Active Loads" value={String(activeLoads.length)} />
              <StatCard label="Lifetime Revenue" value={`$${revenue.toLocaleString()}`} />
              <StatCard label="Fleet Vehicles" value={String(profile?.vehicles.length ?? 0)} />
              <StatCard label="Membership" value={profile?.membershipActive ? profile.membershipTier : "Inactive"} highlight={!profile?.membershipActive} />
            </div>

            {!profile?.membershipActive && (
              <div className="mt-6 rounded-lg border border-m20amber/40 bg-m20amber/10 p-4 text-sm">
                A membership is required to bid on loads.{" "}
                <Link href="/carrier/membership" className="font-medium underline">Choose a plan</Link>.
              </div>
            )}

            <div className="mt-4 flex items-center justify-between rounded-lg border border-black/10 bg-white p-4">
              <div className="text-sm">
                <div className="font-medium">Payouts</div>
                <div className="text-black/50">Required before escrow can be released on delivery.</div>
              </div>
              <ConnectPayoutButton connected={!!profile?.stripeAccountId} />
            </div>

            <h2 className="mt-10 text-lg font-semibold">Assigned Loads</h2>
            <div className="mt-4 space-y-3">
              {activeLoads.length === 0 && <p className="text-sm text-black/50">No assigned loads yet.</p>}
              {activeLoads.map((b: any) => (
                <div key={b.id} className="rounded-lg border border-black/10 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{b.shipment.originAddress} → {b.shipment.destAddress}</div>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs">{b.shipment.status}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-sm text-black/60">{b.shipment.cargoDescription} · ${b.amount.toLocaleString()} · {b.etaDays}d ETA</div>
                    {(b.shipment.status === "AWARDED" || b.shipment.status === "IN_TRANSIT") && (
                      <DeliverButton shipmentId={b.shipmentId} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Fleet</h2>
              <Link href="/carrier/fleet" className="text-sm font-medium text-m20navy underline">Manage fleet</Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(profile?.vehicles ?? []).slice(0, 4).map((v: any) => (
                <div key={v.id} className="rounded-lg border border-black/10 bg-white p-4 text-sm">
                  <div className="font-medium">{v.unitNumber} · {v.type}</div>
                  <div className="text-black/50">{v.status}</div>
                </div>
              ))}
              {(profile?.vehicles.length ?? 0) === 0 && <p className="text-sm text-black/50">No vehicles on file.</p>}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-m20amber/50 bg-m20amber/5" : "border-black/10 bg-white"}`}>
      <div className="text-xs uppercase tracking-wide text-black/50">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
