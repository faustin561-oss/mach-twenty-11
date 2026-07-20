import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import CarrierMembershipClient from "@/components/CarrierMembershipClient";

// Membership billing — increment 7 adds the missing server-side auth gate
// and the shared AppShell.
export default async function MembershipPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "CARRIER") {
    redirect("/login?callbackUrl=/carrier/membership");
  }

  return (
    <AppShell role="CARRIER" breadcrumbs={[{ label: "Carrier Dashboard", href: "/carrier/dashboard" }, { label: "Membership" }]}>
      <CarrierMembershipClient />
    </AppShell>
  );
}
