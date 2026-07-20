import Link from "next/link";
import Image from "next/image";
import NotificationBell from "@/components/NotificationBell";

type Crumb = { label: string; href?: string };

// Shared app shell for every authenticated/internal page (dashboard, load
// board, post-a-load, shipment detail, carrier area, admin). Distinct from
// SiteNav (src/components/home/SiteNav.tsx), which is the logged-out
// marketing nav used only on the homepage/privacy/terms — different
// audience, different CTAs, intentionally not merged into one component.
export default function AppShell({
  children,
  breadcrumbs,
  role,
}: {
  children: React.ReactNode;
  breadcrumbs?: Crumb[];
  role?: "CUSTOMER" | "CARRIER" | "ADMIN" | "SUPER_ADMIN" | string;
}) {
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isCarrier = role === "CARRIER";

  return (
    <div className="flex min-h-screen flex-col bg-m20fog">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/mach-logo.png" alt="Mach Twenty 11" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="text-sm font-semibold text-m20navy">Mach Twenty 11</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-black/60 md:flex">
            <Link href="/loadboard" className="hover:text-m20navy">Load Board</Link>
            <Link href="/ship/new" className="hover:text-m20navy">Post a Load</Link>
            <Link href="/dashboard" className="hover:text-m20navy">Dashboard</Link>
            {isCarrier && <Link href="/carrier/dashboard" className="hover:text-m20navy">Carrier</Link>}
            {isAdmin && <Link href="/admin/dashboard" className="hover:text-m20navy">Admin</Link>}
            <Link href="/messages" className="hover:text-m20navy">Messages</Link>
            <Link href="/billing" className="hover:text-m20navy">Billing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link href="/profile" className="text-xs font-medium text-black/50 hover:text-black/80">Profile</Link>
            <Link href="/login" className="text-xs font-medium text-black/50 hover:text-black/80">Sign out</Link>
          </div>
        </div>
      </header>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="border-b border-black/5 bg-white/60">
          <div className="mx-auto max-w-6xl px-6 py-2 text-xs text-black/50">
            {breadcrumbs.map((c, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1.5">/</span>}
                {c.href ? <Link href={c.href} className="hover:text-m20navy hover:underline">{c.label}</Link> : <span className="text-black/70">{c.label}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-black/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Mach Twenty 11</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-black/70">Privacy</Link>
            <Link href="/terms" className="hover:text-black/70">Terms</Link>
            <Link href="/" className="hover:text-black/70">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
