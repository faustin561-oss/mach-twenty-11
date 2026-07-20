import Image from "next/image";
import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

const COLUMNS = [
  { heading: "Marketplace", links: [["Load Board", "/loadboard"], ["Post Shipment", "/ship/new"], ["Pricing", "/carrier/membership"]] },
  { heading: "Customer Resources", links: [["Dashboard", "/dashboard"], ["Tracking", "/#tracking"], ["Support", "/#contact"]] },
  { heading: "Carrier Resources", links: [["Carrier Dashboard", "/carrier/dashboard"], ["Fleet Management", "/carrier/fleet"], ["Membership", "/carrier/membership"]] },
  { heading: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Support", "mailto:support@mach2011.com"]] },
];

export default function SiteFooter() {
  return (
    <footer className="relative bg-hpink px-6 pb-10 pt-16 text-white md:px-10" id="contact">
      <div
        className="absolute inset-x-0 top-0 h-px opacity-40"
        style={{ backgroundImage: "linear-gradient(to right, transparent, var(--hp-cyan), transparent)" }}
      />
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/mach-logo.png" alt="Mach Twenty 11" width={36} height={36} className="h-9 w-9 object-contain" />
              <span className="hp-display text-base font-semibold">Mach Twenty 11</span>
            </div>
            <p className="hp-mono mt-3 text-[11px] tracking-[0.18em] text-hpcyan">SUPPLY. DEMAND. EXECUTE.</p>
            <p className="hp-body mt-4 max-w-xs text-sm text-white/50">
              A global digital freight marketplace connecting shippers and verified carriers across every mode.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <h4 className="hp-display text-xs font-semibold uppercase tracking-wide text-white/80">{col.heading}</h4>
                <ul className="mt-3 space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="hp-body text-sm text-white/50 hover:text-white">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h4 className="hp-display text-xs font-semibold uppercase tracking-wide text-white/80">Stay in the loop</h4>
            <p className="hp-body mt-3 text-sm text-white/50">Rate benchmarks and platform updates, monthly.</p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
            <div className="mt-6 flex gap-4 text-white/40">
              <span className="hp-body text-xs">LinkedIn</span>
              <span className="hp-body text-xs">X</span>
              <span className="hp-body text-xs">Instagram</span>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="hp-body text-xs text-white/40">© {new Date().getFullYear()} Mach Twenty 11. All rights reserved.</p>
          <p className="hp-mono text-xs text-white/30">support@mach2011.com</p>
        </div>
      </div>
    </footer>
  );
}
