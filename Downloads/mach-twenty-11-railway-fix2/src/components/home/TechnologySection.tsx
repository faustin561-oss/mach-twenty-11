const TECH = [
  { title: "AI Shipment Matching", body: "Recommends carriers and rate ranges based on lane history." },
  { title: "Real-Time Tracking", body: "Status updates from posting through confirmed delivery." },
  { title: "Digital Documents", body: "Bills of lading, sea waybills, air waybills — generated, not faxed." },
  { title: "Automated Notifications", body: "Email and SMS on bid reveal, award, and delivery events." },
  { title: "Secure Messaging", body: "Shipper–carrier communication scoped to each shipment." },
  { title: "Analytics", body: "Rate benchmarks and lane performance, in view on every board." },
  { title: "API Integrations", body: "Connect TMS, accounting, and fleet telematics to the marketplace." },
];

export default function TechnologySection() {
  return (
    <section className="bg-white px-6 py-20 md:px-10" id="tracking">
      <div className="mx-auto max-w-6xl">
        <p className="hp-mono text-xs tracking-[0.18em] text-hpcyandeep">THE TECHNOLOGY</p>
        <h2 className="hp-display mt-3 text-3xl font-semibold text-hpink md:text-4xl">Infrastructure, not a listings page.</h2>

        <div className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {TECH.map((t) => (
            <div key={t.title} className="rounded-xl bg-hpfog p-5">
              <h3 className="hp-display text-sm font-semibold text-hpink">{t.title}</h3>
              <p className="hp-body mt-1.5 text-sm leading-relaxed text-black/55">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
