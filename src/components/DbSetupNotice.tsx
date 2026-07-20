export default function DbSetupNotice({ what }: { what: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-m20amber/40 bg-m20amber/10 p-6 text-sm">
      <p className="font-semibold text-m20navy">Database not connected</p>
      <p className="mt-2 text-black/70">
        {what} can&apos;t load right now because <code className="rounded bg-black/5 px-1">DATABASE_URL</code> isn&apos;t
        set or the database isn&apos;t reachable.
      </p>
      <p className="mt-3 text-black/60">To fix this:</p>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-black/60">
        <li>Copy <code className="rounded bg-black/5 px-1">.env.example</code> to <code className="rounded bg-black/5 px-1">.env</code> and set <code className="rounded bg-black/5 px-1">DATABASE_URL</code></li>
        <li>Run <code className="rounded bg-black/5 px-1">npm run db:push</code></li>
        <li>Run <code className="rounded bg-black/5 px-1">npm run db:seed</code> for demo data</li>
      </ol>
      <p className="mt-3 text-xs text-black/40">See README.md for the full setup walkthrough.</p>
    </div>
  );
}
