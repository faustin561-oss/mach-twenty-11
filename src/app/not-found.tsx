import Link from "next/link";

// Global 404 — covers invalid routes and notFound() calls (e.g. an
// unknown shipment id in /shipments/[id]) with a real page instead of
// Next.js's bare default.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-m20fog px-6 text-center">
      <h1 className="text-3xl font-semibold text-m20navy">404</h1>
      <p className="max-w-md text-sm text-black/60">
        This page doesn&apos;t exist, or the shipment you&apos;re looking for isn&apos;t one you have access to.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="rounded-md bg-m20navy px-4 py-2 text-sm font-medium text-white">Go home</Link>
        <Link href="/loadboard" className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium">Load Board</Link>
      </div>
    </div>
  );
}
