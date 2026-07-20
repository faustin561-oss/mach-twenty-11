import Link from "next/link";
import RouteLine from "./RouteLine";
import { ShipIcon, PlaneIcon, TruckIcon, RailIcon, WarehouseIcon, BoxIcon } from "@/components/icons/FreightIcons";

const MODES = [
  { icon: TruckIcon, label: "Trucking" },
  { icon: ShipIcon, label: "Ocean Freight" },
  { icon: PlaneIcon, label: "Air Freight" },
  { icon: RailIcon, label: "Rail" },
  { icon: WarehouseIcon, label: "Vehicle Transport" },
  { icon: BoxIcon, label: "Moving & Parcel" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-hpink via-hpnavy to-hpink pb-20 pt-36 text-white md:pt-44">
      <RouteLine />
      <div className="relative mx-auto max-w-5xl px-6 text-center md:px-10">
        <p className="hp-mono inline-flex items-center gap-2 rounded-full border border-hpcyan/30 bg-white/5 px-4 py-1.5 text-[11px] tracking-[0.18em] text-hpcyan">
          GLOBAL FREIGHT MARKETPLACE
        </p>
        <h1 className="hp-display mt-6 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
          One Marketplace.
          <br />
          Every Mode. Worldwide.
        </h1>
        <p className="hp-body mx-auto mt-6 max-w-2xl text-base text-white/70 md:text-lg">
          Mach Twenty 11 connects businesses and individuals with verified transportation
          providers across trucking, ocean freight, air freight, vehicle transport,
          moving services, and parcel delivery — through one intelligent digital marketplace.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/ship/new" className="hp-body w-full rounded-full bg-hpcyan px-8 py-3.5 text-sm font-semibold text-hpink shadow-lg shadow-hpcyan/20 transition hover:brightness-110 sm:w-auto">
            Post Shipment
          </Link>
          <Link href="/loadboard" className="hp-body w-full rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:border-white/50 sm:w-auto">
            Browse Loads
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-20 max-w-5xl px-6 md:px-10">
        <div className="grid grid-cols-3 gap-x-6 gap-y-8 border-t border-[color:var(--hp-line)] pt-8 sm:grid-cols-6">
          {MODES.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-2 text-center">
              <m.icon className="h-8 w-8 text-white/80" />
              <span className="hp-body text-xs text-white/50">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
