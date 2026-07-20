const REASONS = [
  { title: "Verified Carriers", body: "DOT, MC, and insurance checked before a carrier can bid." },
  { title: "Real-Time Tracking", body: "Shipment status from posting through proof of delivery." },
  { title: "Secure Payments", body: "Escrowed at award, released through Stripe Connect on delivery." },
  { title: "Digital Shipping Documents", body: "Bills of lading, sea waybills, and air waybills, generated in-platform." },
  { title: "Worldwide Coverage", body: "Domestic and cross-border lanes across every mode." },
  { title: "Competitive Bidding", body: "Sealed bids reveal at deadline — no lowballing races." },
  { title: "Fast Quotes", body: "Post a load and see market rate benchmarks immediately." },
  { title: "Dedicated Support", body: "A real team behind every enterprise account." },
  { title: "AI Logistics Intelligence", body: "Rate prediction and carrier matching, built into the board." },
];

export default function WhyChooseSection() {
  return (
    <section className="bg-white px-6 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="hp-mono text-xs tracking-[0.18em] text-hpcyandeep">WHY MACH TWENTY 11</p>
        <h2 className="hp-display mt-3 text-3xl font-semibold text-hpink md:text-4xl">Built like infrastructure, not a listings site.</h2>

        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r, i) => (
            <div key={r.title} className="flex gap-4">
              <span className="hp-mono mt-0.5 text-xs text-hpcyan">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="hp-display text-base font-semibold text-hpink">{r.title}</h3>
                <p className="hp-body mt-1 text-sm leading-relaxed text-black/55">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
