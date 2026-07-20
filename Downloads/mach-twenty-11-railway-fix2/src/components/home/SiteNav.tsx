"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/loadboard", label: "Marketplace" },
  { href: "/#solutions", label: "Solutions" },
  { href: "/carrier/dashboard", label: "Carriers" },
  { href: "/#tracking", label: "Tracking" },
  { href: "/carrier/membership", label: "Pricing" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-hpink/95 shadow-lg shadow-black/20 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/mach-logo.png" alt="Mach Twenty 11" width={40} height={40} className="h-10 w-10 object-contain" priority />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="hp-display text-lg font-semibold text-white">Mach&nbsp;Twenty&nbsp;11</span>
            <span className="hp-mono text-[10px] tracking-[0.2em] text-hpcyan">SUPPLY. DEMAND. EXECUTE.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="hp-body text-sm font-medium text-white/75 transition hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="hp-body text-sm font-medium text-white/75 hover:text-white">Login</Link>
          <Link href="/register" className="hp-body rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white hover:border-white/50">
            Register
          </Link>
          <Link href="/register?role=carrier" className="hp-body rounded-full border border-hpcyan/60 px-4 py-2 text-sm font-medium text-hpcyan hover:bg-hpcyan/10">
            Become a Carrier
          </Link>
          <Link href="/ship/new" className="hp-body rounded-full bg-hpcyan px-5 py-2 text-sm font-semibold text-hpink hover:brightness-110">
            Post Shipment
          </Link>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20 text-white lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-hpink px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="hp-body text-sm font-medium text-white/80" onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              <Link href="/login" className="hp-body text-sm text-white/70">Login</Link>
              <Link href="/register?role=carrier" className="hp-body rounded-full border border-hpcyan/60 px-4 py-2 text-center text-sm font-medium text-hpcyan">Become a Carrier</Link>
              <Link href="/ship/new" className="hp-body rounded-full bg-hpcyan px-4 py-2 text-center text-sm font-semibold text-hpink">Post Shipment</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
