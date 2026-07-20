const PILLARS = [
  {
    title: "A global digital freight marketplace",
    body: "Every shipment type, every mode, one place to post a load and receive offers from verified providers — no cold calls, no fragmented broker networks.",
  },
  {
    title: "Competitive, sealed bidding",
    body: "Carriers bid without seeing each other's numbers. Shippers see every offer at once, at the deadline, and choose on price, ETA, and carrier standing.",
  },
  {
    title: "Verified carriers, secure payments",
    body: "DOT/MC authority, insurance, and membership standing are checked before a carrier can bid. Funds are escrowed at award and released on confirmed delivery.",
  },
];

export default function WhatIsSection() {
  return (
    <section className="bg-white px-6 py-20 md:px-10" id="about">
      <div className="mx-auto max-w-6xl">
        <p className="hp-mono text-xs tracking-[0.18em] text-hpcyandeep">WHAT IS MACH TWENTY 11</p>
        <h2 className="hp-display mt-3 max-w-2xl text-3xl font-semibold text-hpink md:text-4xl">
          A digital freight exchange built for how freight actually moves.
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="border-t-2 border-hpcyan pt-5">
              <h3 className="hp-display text-lg font-semibold text-hpink">{p.title}</h3>
              <p className="hp-body mt-2 text-sm leading-relaxed text-black/60">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
