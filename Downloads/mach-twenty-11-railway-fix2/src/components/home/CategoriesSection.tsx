import Link from "next/link";
import {
  TruckIcon, ShipIcon, PlaneIcon, WarehouseIcon, RailIcon, BoxIcon, ParcelIcon, GlobeIcon,
} from "@/components/icons/FreightIcons";

const CATEGORIES = [
  { icon: TruckIcon, mode: "LTL", label: "LTL Freight", desc: "Partial truckloads, palletized and consolidated." },
  { icon: TruckIcon, mode: "FTL", label: "FTL Freight", desc: "Full truckload, dry van, reefer, and flatbed." },
  { icon: ShipIcon, mode: "OCEAN_FCL", label: "Ocean Freight", desc: "FCL and LCL container shipping, worldwide." },
  { icon: PlaneIcon, mode: "AIR", label: "Air Freight", desc: "Time-critical cargo on scheduled and charter lift." },
  { icon: WarehouseIcon, mode: "VEHICLE", label: "Vehicle Transport", desc: "Open and enclosed auto, motorcycle, and boat hauling." },
  { icon: WarehouseIcon, mode: "HEAVY_EQUIPMENT", label: "Heavy Equipment", desc: "Oversized and heavy-haul with permitted routing." },
  { icon: BoxIcon, mode: "HOUSEHOLD_MOVING", label: "Household Moving", desc: "Residential and long-distance household goods." },
  { icon: ParcelIcon, mode: "COURIER", label: "Courier", desc: "Same-day and expedited point-to-point delivery." },
  { icon: ParcelIcon, mode: "SPECIALTY", label: "Parcel", desc: "Small parcel, palletized and individually tracked." },
  { icon: GlobeIcon, mode: "OCEAN_LCL", label: "International Shipping", desc: "Cross-border freight, customs-ready documentation." },
];

export default function CategoriesSection() {
  return (
    <section className="bg-hpfog px-6 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="hp-mono text-xs tracking-[0.18em] text-hpcyandeep">WHAT ARE YOU SHIPPING</p>
        <h2 className="hp-display mt-3 text-3xl font-semibold text-hpink md:text-4xl">Every mode, one marketplace.</h2>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              href={`/loadboard?mode=${c.mode}`}
              className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-hpcyan/10"
            >
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-hpcyan/0 transition-colors duration-300 group-hover:bg-hpcyan/10" />
              <c.icon className="h-9 w-9 text-hpink transition-transform duration-300 group-hover:scale-110 group-hover:text-hpcyandeep" />
              <h3 className="hp-display mt-4 text-sm font-semibold text-hpink">{c.label}</h3>
              <p className="hp-body mt-1.5 text-xs leading-relaxed text-black/50">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
