const STEPS = [
  { step: "01", title: "Post Shipment", body: "Describe the load, set your pickup window and sealed-bid deadline." },
  { step: "02", title: "Receive Competitive Bids", body: "Verified carriers submit sealed offers before the deadline." },
  { step: "03", title: "Select Your Carrier", body: "Bids reveal at once. Choose on rate, ETA, and carrier standing." },
  { step: "04", title: "Track Until Delivery", body: "Follow status through pickup, transit, and confirmed delivery." },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-hpink px-6 py-20 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="hp-mono text-xs tracking-[0.18em] text-hpcyan">HOW IT WORKS</p>
        <h2 className="hp-display mt-3 text-3xl font-semibold md:text-4xl">From posted to delivered, in four steps.</h2>

        <div className="relative mt-16">
          <div className="absolute left-4 top-4 hidden h-px w-[calc(100%-2rem)] md:block">
            <div
              className="h-full w-full bg-[length:16px_1px] bg-repeat-x opacity-40"
              style={{ backgroundImage: "linear-gradient(to right, var(--hp-cyan) 50%, transparent 50%)" }}
            />
          </div>
          <div className="grid gap-10 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.step} className="relative">
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-hpcyan/60 bg-hpink">
                  <span className="h-2 w-2 rounded-full bg-hpcyan" />
                </div>
                <span className="hp-mono mt-4 block text-xs text-hpcyan">{s.step}</span>
                <h3 className="hp-display mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="hp-body mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
