const INDUSTRIES = [
  "Business Shipping", "Manufacturing", "Construction", "Automotive",
  "Government", "Medical", "Retail", "Import / Export",
];

export default function EnterpriseSolutionsSection() {
  return (
    <section className="bg-hpfog px-6 py-20 md:px-10" id="solutions">
      <div className="mx-auto max-w-6xl">
        <p className="hp-mono text-xs tracking-[0.18em] text-hpcyandeep">ENTERPRISE SOLUTIONS</p>
        <h2 className="hp-display mt-3 text-3xl font-semibold text-hpink md:text-4xl">Built for how your industry ships.</h2>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INDUSTRIES.map((label) => (
            <div key={label} className="rounded-xl border border-black/5 bg-white px-5 py-6 text-center transition hover:border-hpcyan/40 hover:shadow-md">
              <span className="hp-display text-sm font-semibold text-hpink">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
