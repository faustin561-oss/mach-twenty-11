const TESTIMONIALS = [
  { quote: "We cut carrier sourcing time from days to hours. Sealed bidding means we're not chasing counter-offers anymore.", name: "Dana Whitfield", role: "Logistics Manager, Meridian Foods Co.", type: "Business Shipper" },
  { quote: "The load board finally shows real bid volume before I commit fuel and hours to a lane.", name: "Marcus Reyes", role: "Owner-Operator, Ironline Freight", type: "Carrier" },
  { quote: "I shipped my first FTL load without ever speaking to a broker. Posted it, got three bids, picked one.", name: "Priya Anand", role: "Founder, Anand Home Goods", type: "Small Business Owner" },
  { quote: "Digital bills of lading alone saved our team a full-time administrative role.", name: "Robert Klein", role: "VP Supply Chain, Anvil Steelworks", type: "Enterprise Logistics Manager" },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-white px-6 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="hp-mono text-xs tracking-[0.18em] text-hpcyandeep">TRUSTED ON BOTH SIDES OF THE MARKET</p>
        <h2 className="hp-display mt-3 text-3xl font-semibold text-hpink md:text-4xl">What the marketplace sounds like.</h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-black/5 bg-hpfog p-6">
              <span className="hp-mono text-xs tracking-wide text-hpcyandeep">{t.type.toUpperCase()}</span>
              <p className="hp-body mt-3 text-[15px] leading-relaxed text-hpink/90">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5">
                <p className="hp-display text-sm font-semibold text-hpink">{t.name}</p>
                <p className="hp-body text-xs text-black/50">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
