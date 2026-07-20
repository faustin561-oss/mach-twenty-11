import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import DbSetupNotice from "@/components/DbSetupNotice";
import { safeDbCall } from "@/lib/safe-db";

// Messages — increment 7. Standalone inbox aggregating every shipment
// thread the user is party to (as shipper or a bidding/awarded carrier).
// Per-shipment conversation itself still lives on /shipments/:id — this
// page is the "where do I see all of them" entry point that was missing.
export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/messages");
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const { data: shipments, dbUnavailable } = await safeDbCall(
    () =>
      prisma.shipment.findMany({
        where: {
          OR: [{ shipperId: userId }, { bids: { some: { carrierId: userId } } }],
          messages: { some: {} },
        },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { name: true } } } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
    [] as Awaited<ReturnType<typeof prisma.shipment.findMany>>
  );

  return (
    <AppShell role={role} breadcrumbs={[{ label: "Messages" }]}>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Messages</h1>

        {dbUnavailable ? (
          <div className="mt-8"><DbSetupNotice what="Messages" /></div>
        ) : (
          <div className="mt-6 space-y-2">
            {shipments.length === 0 && (
              <p className="text-sm text-black/50">No conversations yet. Messages appear here once you or a counterparty writes on a shipment.</p>
            )}
            {shipments.map((s) => {
              const last = s.messages[0];
              return (
                <Link key={s.id} href={`/shipments/${s.id}`} className="block rounded-lg border border-black/10 bg-white p-4 hover:border-m20amber/40">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.originAddress} → {s.destAddress}</span>
                    <span className="text-xs text-black/40">{s._count.messages} message{s._count.messages !== 1 ? "s" : ""}</span>
                  </div>
                  {last && (
                    <p className="mt-1 truncate text-sm text-black/60">
                      <span className="font-medium">{last.sender.name}:</span> {last.body}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
