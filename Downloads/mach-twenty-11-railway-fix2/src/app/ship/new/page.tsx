import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import NewShipmentWizard from "@/components/ship/NewShipmentWizard";

// Post a Load — increment 7 fixes a real gap: this page previously had no
// server-side auth check at all (it was a bare "use client" component) and
// wasn't covered by the route-protection proxy either, so it rendered for
// logged-out visitors and only failed once they hit Submit. Now gated like
// every other authenticated page, and moved into the shared AppShell so it
// no longer feels like a standalone form bolted onto the site.
export default async function NewShipmentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/ship/new");

  return (
    <AppShell role={(session.user as any).role} breadcrumbs={[{ label: "Load Board", href: "/loadboard" }, { label: "Post a Load" }]}>
      <NewShipmentWizard />
    </AppShell>
  );
}
