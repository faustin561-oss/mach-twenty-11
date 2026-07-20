import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminPanel from "@/components/AdminPanel";
import AppShell from "@/components/AppShell";

// Admin panel — increment 5 for the functionality, increment 7 adds the
// shared AppShell and a proper callbackUrl on redirect. Covers users,
// shipments, and dispute resolution (release/refund/reject). CMS,
// email/SMS center, fraud detection, and audit logs are not built yet.
export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  return (
    <AppShell role={(session.user as any).role} breadcrumbs={[{ label: "Admin" }]}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-black/50">Users, shipments, and dispute resolution.</p>
        <div className="mt-8">
          <AdminPanel />
        </div>
      </div>
    </AppShell>
  );
}
