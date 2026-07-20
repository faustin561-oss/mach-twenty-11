import Link from "next/link";

const BENEFITS = [
  "Monthly freight opportunities across every mode",
  "Nationwide lane exposure — not one broker's book",
  "Fast payouts via Stripe Connect on confirmed delivery",
  "Business growth with fleet and driver management tools",
  "Professional tools: quick-bid, saved searches, documents",
  "Membership management, all in one dashboard",
];

export default function CarrierRecruitmentSection() {
  return (
    <section className="bg-hpink px-6 py-20 text-white md:px-10">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="hp-mono text-xs tracking-[0.18em] text-hpcyan">FOR CARRIERS</p>
          <h2 className="hp-display mt-3 text-3xl font-semibold md:text-4xl">Fill more miles. Chase fewer brokers.</h2>
          <p className="hp-body mt-4 max-w-md text-white/60">
            Join as a verified carrier and bid directly on sealed loads across every mode Mach Twenty 11 supports.
          </p>
          <Link href="/carrier/membership" className="hp-body mt-8 inline-block rounded-full bg-hpcyan px-8 py-3.5 text-sm font-semibold text-hpink hover:brightness-110">
            Become a Carrier
          </Link>
        </div>
        <ul className="space-y-4">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-3 border-b border-white/10 pb-4 last:border-0">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-hpcyan" />
              <span className="hp-body text-sm text-white/75">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
