import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import ProfileClient from "@/components/ProfileClient";

// User profile — increment 7. Previously missing entirely from the
// required-pages list.
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  return (
    <AppShell role={(session.user as any).role} breadcrumbs={[{ label: "Profile" }]}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <div className="mt-8">
          <ProfileClient />
        </div>
      </div>
    </AppShell>
  );
}
