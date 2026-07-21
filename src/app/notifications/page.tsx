import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import DbSetupNotice from "@/components/DbSetupNotice";
import { safeDbCall } from "@/lib/safe-db";

// Notifications — increment 7. Standalone full history; the header bell
// (NotificationBell.tsx) is the quick-glance version of the same data.
export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/notifications");
  const role = (session.user as any).role;

  const { data: notifications, dbUnavailable } = await safeDbCall(
    () =>
      prisma.notification.findMany({
        where: { userId: (session.user as any).id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    [] as any // see the note in shipments/[id]/page.tsx — ReturnType<typeof prisma.X> is the base overload, not this query's actual shape (harmless here since Notification has no relations, but fixed for consistency)
  );

  return (
    <AppShell role={role} breadcrumbs={[{ label: "Notifications" }]}>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Notifications</h1>

        {dbUnavailable ? (
          <div className="mt-8"><DbSetupNotice what="Notifications" /></div>
        ) : (
          <div className="mt-6 space-y-2">
            {notifications.length === 0 && <p className="text-sm text-black/50">Nothing yet.</p>}
            {notifications.map((n) => (
              <div key={n.id} className={`rounded-lg border border-black/10 bg-white p-4 text-sm ${n.read ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{n.title}</span>
                  <span className="text-xs text-black/40">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-black/60">{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
