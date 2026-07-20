import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import BillingDashboardClient from "@/components/BillingDashboardClient";

// Billing dashboard — Priority 2. Available to any authenticated user
// (shippers see shipment payments; carriers additionally see membership
// and urgent-fee history).
export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/billing");

  return (
    <AppShell role={(session.user as any).role} breadcrumbs={[{ label: "Billing" }]}>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <div className="mt-8">
          <BillingDashboardClient />
        </div>
      </div>
    </AppShell>
  );
}
