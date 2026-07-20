import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import DbSetupNotice from "@/components/DbSetupNotice";
import { safeDbCall } from "@/lib/safe-db";

// Customer dashboard — increment 7 wraps the DB read so a missing
// DATABASE_URL shows a setup notice instead of crashing, and moves the
// page into the shared AppShell for consistent nav/footer across the app.
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const { data: shipments, dbUnavailable } = await safeDbCall(
    () =>
      prisma.shipment.findMany({
        where: { shipperId: (session.user as any).id },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { bids: true } } },
      }),
    [] as Awaited<ReturnType<typeof prisma.shipment.findMany>>
  );

  return (
    <AppShell role={(session.user as any).role} breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Welcome back, {session.user.name}</h1>

        {dbUnavailable ? (
          <div className="mt-8">
            <DbSetupNotice what="Your shipments" />
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {shipments.length === 0 && (
              <p className="text-sm text-black/60">No shipments yet. Post your first load from the Post a Load button above.</p>
            )}
            {shipments.map((s) => (
              <Link href={`/shipments/${s.id}`} key={s.id} className="block rounded-lg border border-black/10 bg-white p-5 hover:border-m20amber/40">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.originAddress} → {s.destAddress}</div>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs">{s.status}</span>
                </div>
                <div className="mt-1 text-sm text-black/60">{s.cargoDescription} · {s._count.bids} bids</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
