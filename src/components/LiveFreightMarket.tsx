"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type OpenShipment = {
  id: string; mode: string; origin: string; dest: string;
  weightLb: number; bidCount: number; postedAt: string; bidDeadline: string; isUrgent: boolean;
};
type Counters = { activeShipments: number; newLoadsToday: number; activeBids: number; averageBid: number; recentlyAwarded: number };

const MODE_COLORS: Record<string, string> = {
  LTL: "#33D17E", FTL: "#33D17E", OCEAN_FCL: "#3FC6E8", OCEAN_LCL: "#3FC6E8",
  AIR: "#FFA51E", RAIL: "#A98CFF", VEHICLE: "#FF8A00", BOAT: "#3FC6E8",
  HOUSEHOLD_MOVING: "#FF8A00", HEAVY_EQUIPMENT: "#A98CFF", AGRICULTURE: "#33D17E",
  CONSTRUCTION: "#A98CFF", MEDICAL: "#FF5A5F", COURIER: "#FFA51E", SPECIALTY: "#3FC6E8",
};

const POLL_MS = 8000; // "live" here means polled, not pushed — no websocket infra in this project (see README)

// Live Freight Market — Priority 3 top section. Maps real fields to
// visual properties rather than decoration: x = how recently posted
// (right edge = newest), y = weight class (heavier loads sit higher),
// radius = bid count (a "how contested is this" signal). Deliberately
// does not show bid dollar amounts for open (still-sealed) shipments —
// see the comment in the API route for why leaking that would undermine
// the sealed-bid design used throughout the rest of the app.
export default function LiveFreightMarket() {
  const [shipments, setShipments] = useState<OpenShipment[]>([]);
  const [counters, setCounters] = useState<Counters | null>(null);
  const [hovered, setHovered] = useState<OpenShipment | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/loadboard/live");
    if (!res.ok) return;
    const body = await res.json();
    setShipments(body.open);
    setCounters(body.counters);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const oldestMs = 1000 * 60 * 60 * 24 * 3; // 3-day window for the x-axis
  const maxWeight = Math.max(1, ...shipments.map((s) => s.weightLb));

  return (
    <div className="rounded-xl border border-black/10 bg-hpink p-5 text-white">
      <div className="flex items-center justify-between">
        <h2 className="hp-mono text-xs tracking-[0.15em] text-hpcyan">LIVE FREIGHT MARKET</h2>
        <span className="hp-mono text-[10px] text-white/30">updates every {POLL_MS / 1000}s</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Counter label="Active Shipments" value={counters?.activeShipments ?? "—"} />
        <Counter label="New Loads Today" value={counters?.newLoadsToday ?? "—"} />
        <Counter label="Active Bids" value={counters?.activeBids ?? "—"} />
        <Counter label="Avg Accepted Bid" value={counters ? `$${Math.round(counters.averageBid).toLocaleString()}` : "—"} />
        <Counter label="Awarded (24h)" value={counters?.recentlyAwarded ?? "—"} />
      </div>

      <div
        ref={containerRef}
        className="relative mt-4 h-64 overflow-hidden rounded-lg border border-white/10 bg-black/30"
        onMouseMove={(e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        {shipments.length === 0 && (
          <p className="flex h-full items-center justify-center text-xs text-white/30">No open shipments right now.</p>
        )}
        {shipments.map((s) => {
          const age = now - new Date(s.postedAt).getTime();
          const xPct = Math.max(2, Math.min(98, 100 - (age / oldestMs) * 100));
          const weightClass = s.weightLb / maxWeight;
          const yPct = Math.max(8, Math.min(92, 92 - weightClass * 80));
          const radius = 5 + Math.min(s.bidCount, 8) * 1.8;
          const color = MODE_COLORS[s.mode] || "#3FC6E8";

          return (
            <button
              key={s.id}
              onClick={() => router.push(`/shipments/${s.id}`)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered((h) => (h?.id === s.id ? null : h))}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-125"
              style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                width: radius * 2,
                height: radius * 2,
                backgroundColor: color,
                opacity: s.isUrgent ? 1 : 0.75,
                boxShadow: s.isUrgent ? `0 0 8px ${color}` : undefined,
              }}
              aria-label={`${s.mode} shipment ${s.origin} to ${s.dest}`}
            />
          );
        })}

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 w-56 rounded-md border border-white/10 bg-hpink px-3 py-2 text-xs shadow-xl"
            style={{ left: Math.min(mousePos.x + 12, 300), top: Math.max(mousePos.y - 60, 4) }}
          >
            <div className="font-semibold text-white">{hovered.origin} → {hovered.dest}</div>
            <div className="mt-1 text-white/60">{hovered.mode} · {hovered.weightLb.toLocaleString()} lb</div>
            <div className="text-white/60">{hovered.bidCount} bid{hovered.bidCount !== 1 ? "s" : ""} so far</div>
            <div className="text-white/40">Posted {new Date(hovered.postedAt).toLocaleString()}</div>
            {hovered.isUrgent && <div className="mt-1 text-red-400">URGENT</div>}
          </div>
        )}
      </div>
      <p className="mt-2 hp-mono text-[10px] text-white/30">
        Dot size = bid activity · vertical position = weight class · horizontal position = time posted (right = newest) · bid amounts stay sealed until each shipment's deadline
      </p>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-white/5 px-3 py-2">
      <div className="hp-mono text-lg font-semibold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
    </div>
  );
}
