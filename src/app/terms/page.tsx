import Link from "next/link";
import SiteNav from "@/components/home/SiteNav";
import SiteFooter from "@/components/home/SiteFooter";

export const metadata = { title: "Terms of Service | Mach Twenty 11" };

const SECTIONS = [
  {
    title: "1. The Marketplace",
    body: `Mach Twenty 11 is a digital marketplace connecting shippers with independent, verified carriers.
    We are not a carrier, and we do not take possession of or transport any shipment ourselves.`,
  },
  {
    title: "2. Accounts and Verification",
    body: `Carrier accounts require valid DOT/MC authority and proof of insurance before bidding is enabled.
    You are responsible for keeping your account credentials, licensing, and insurance documentation current.`,
  },
  {
    title: "3. Bidding and Awards",
    body: `Bids submitted while a shipment is sealed are binding offers until the stated bid deadline. Shippers
    select a winning bid after reveal; awarding a bid forms a contract for carriage between shipper and carrier,
    not with Mach Twenty 11.`,
  },
  {
    title: "4. Payments and Fees",
    body: `Shippers fund escrow at award. On confirmed delivery, funds are released to the carrier's connected
    account, less the platform fee disclosed at time of award. Carrier memberships are billed monthly in advance
    and grant bidding access for the selected tier.`,
  },
  {
    title: "5. Disputes",
    body: `Either party may raise a dispute on an awarded shipment before escrow is released. Disputed funds are
    held pending review and resolved to release, partial release, or refund at our reasonable discretion based
    on the evidence provided by both parties.`,
  },
  {
    title: "6. Prohibited Conduct",
    body: `Circumventing the marketplace to avoid fees, submitting fraudulent insurance or authority documents,
    and manipulating bids through undisclosed coordination between carriers are all grounds for suspension.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `Mach Twenty 11 is not liable for loss, damage, or delay of cargo in transit; that liability sits with
    the carrier and its insurance, consistent with standard carriage terms.`,
  },
  {
    title: "8. Changes to These Terms",
    body: `We may update these terms from time to time. Continued use of the marketplace after an update
    constitutes acceptance of the revised terms.`,
  },
];

export default function TermsOfServicePage() {
  return (
    <>
      <SiteNav />
      <main className="hp-body bg-white pb-24 pt-32 text-hpink">
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <p className="hp-mono text-xs tracking-[0.18em] text-hpcyandeep">LEGAL</p>
          <h1 className="hp-display mt-3 text-3xl font-semibold md:text-4xl">Terms of Service</h1>
          <p className="hp-body mt-2 text-sm text-black/50">Last updated: draft, not yet published</p>

          <div className="mt-4 rounded-lg border border-m20amber/40 bg-m20amber/10 p-4 text-sm text-hpink">
            <strong>Draft — pending legal review.</strong> This page is a structural placeholder covering the
            terms a freight marketplace typically needs (marketplace role, bidding, escrow, disputes, liability).
            It has not been reviewed by counsel and should not be published as-is.
          </div>

          <div className="mt-10 space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="hp-display text-lg font-semibold">{s.title}</h2>
                <p className="hp-body mt-2 text-sm leading-relaxed text-black/65">{s.body}</p>
              </section>
            ))}
          </div>

          <p className="hp-body mt-12 text-sm text-black/50">
            See also our <Link href="/privacy" className="text-hpcyandeep underline">Privacy Policy</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
