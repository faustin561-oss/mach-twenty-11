function BrowserFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg shadow-black/5">
      <div className="flex items-center gap-2 border-b border-black/5 bg-black/[0.02] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="hp-mono ml-2 text-[11px] text-black/40">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MiniRow({ a, b, c }: { a: string; b: string; c: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-black/[0.03] px-3 py-2 text-xs">
      <span className="text-black/70">{a}</span>
      <span className="text-black/40">{b}</span>
      <span className="rounded-full bg-m20amber/15 px-2 py-0.5 font-medium text-m20amber">{c}</span>
    </div>
  );
}

export default function MarketplacePreviewSection() {
  return (
    <section className="bg-hpfog px-6 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="hp-mono text-xs tracking-[0.18em] text-hpcyandeep">INSIDE THE PLATFORM</p>
        <h2 className="hp-display mt-3 text-3xl font-semibold text-hpink md:text-4xl">A live marketplace preview.</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <BrowserFrame title="Customer Dashboard">
            <div className="space-y-2">
              <MiniRow a="Tampa, FL → Charlotte, NC" b="FTL" c="OPEN_FOR_BIDS" />
              <MiniRow a="Shanghai → Long Beach" b="Ocean FCL" c="BIDS_REVEALED" />
              <MiniRow a="Chicago → Detroit" b="LTL" c="AWARDED" />
            </div>
          </BrowserFrame>

          <BrowserFrame title="Carrier Dashboard">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[["Active Loads", "3"], ["Revenue", "$18.4k"], ["Membership", "Pro"]].map(([l, v]) => (
                <div key={l} className="rounded-md bg-black/[0.03] p-3">
                  <div className="hp-mono text-lg font-semibold text-hpink">{v}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-black/40">{l}</div>
                </div>
              ))}
            </div>
          </BrowserFrame>

          <BrowserFrame title="Load Board">
            <div className="space-y-2">
              <MiniRow a="Taipei → Chicago (Air)" b="3 bids" c="Sealed" />
              <MiniRow a="Savannah → Rotterdam (LCL)" b="5 bids" c="Sealed" />
              <MiniRow a="Pittsburgh → Detroit (FTL)" b="2 bids" c="Sealed" />
            </div>
          </BrowserFrame>

          <BrowserFrame title="Shipment Tracking">
            <div className="flex items-center gap-2">
              {["Posted", "Awarded", "In Transit", "Delivered"].map((s, i) => (
                <div key={s} className="flex flex-1 items-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${i <= 1 ? "bg-hpcyandeep" : "bg-black/10"}`} />
                  {i < 3 && <div className={`h-px flex-1 ${i < 1 ? "bg-hpcyandeep" : "bg-black/10"}`} />}
                </div>
              ))}
            </div>
            <p className="hp-body mt-3 text-xs text-black/50">Awarded to Ironline Freight · ETA 2 days</p>
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}
