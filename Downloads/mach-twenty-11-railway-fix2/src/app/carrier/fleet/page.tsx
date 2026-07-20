import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import CarrierFleetClient from "@/components/CarrierFleetClient";

// Fleet management — increment 7 adds the missing server-side auth gate
// (was a bare client component relying only on the API layer to reject
// unauthenticated requests) and the shared AppShell.
export default async function FleetPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "CARRIER") {
    redirect("/login?callbackUrl=/carrier/fleet");
  }

  return (
    <AppShell role="CARRIER" breadcrumbs={[{ label: "Carrier Dashboard", href: "/carrier/dashboard" }, { label: "Fleet" }]}>
      <CarrierFleetClient />
    </AppShell>
  );
}
