"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QuickBidButton from "@/components/QuickBidButton";
import LoadBoardMap from "@/components/LoadBoardMap";

type ShipmentRow = {
  id: string;
  mode: string;
  originAddress: string;
  originLat: number | null;
  originLng: number | null;
  destAddress: string;
  destLat: number | null;
  destLng: number | null;
  weightLb: number;
  bidDeadline: string;
  bidCount: number;
  isUrgent: boolean;
};

type SavedSearch = { id: string; name: string; filters: { mode?: string } };

export default function LoadBoardClient({ shipments }: { shipments: ShipmentRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"table" | "map">("table");
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveName, setSaveName] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [destFilter, setDestFilter] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const filtered = shipments.filter((s) => {
    if (originFilter && !s.originAddress.toLowerCase().includes(originFilter.toLowerCase())) return false;
    if (destFilter && !s.destAddress.toLowerCase().includes(destFilter.toLowerCase())) return false;
    if (minWeight && s.weightLb < Number(minWeight)) return false;
    if (maxWeight && s.weightLb > Number(maxWeight)) return false;
    if (urgentOnly && !s.isUrgent) return false;
    return true;
  });

  useEffect(() => {
    fetch("/api/saved-searches")
      .then((r) => (r.ok ? r.json() : { searches: [] }))
      .then((d) => setSavedSearches(d.searches || []))
      .catch(() => {});
  }, []);

  async function saveCurrentSearch() {
    if (!saveName.trim()) return;
    const mode = searchParams.get("mode") || undefined;
    const res = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: saveName, filters: { mode } }),
    });
    if (res.ok) {
      const { search } = await res.json();
      setSavedSearches((prev) => [search, ...prev]);
      setSaveName("");
    }
  }

  async function deleteSearch(id: string) {
    await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  }

  function applySearch(filters: { mode?: string }) {
    const params = new URLSearchParams();
    if (filters.mode) params.set("mode", filters.mode);
    router.push(`/loadboard?${params.toString()}`);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input className="w-36 rounded-md border border-black/15 px-3 py-1.5 text-xs" placeholder="Origin contains..." value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} />
        <input className="w-36 rounded-md border border-black/15 px-3 py-1.5 text-xs" placeholder="Destination contains..." value={destFilter} onChange={(e) => setDestFilter(e.target.value)} />
        <input className="w-24 rounded-md border border-black/15 px-3 py-1.5 text-xs" placeholder="Min lb" type="number" value={minWeight} onChange={(e) => setMinWeight(e.target.value)} />
        <input className="w-24 rounded-md border border-black/15 px-3 py-1.5 text-xs" placeholder="Max lb" type="number" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} />
        <label className="flex items-center gap-1.5 text-xs text-black/60">
          <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} /> Urgent only
        </label>
        {(originFilter || destFilter || minWeight || maxWeight || urgentOnly) && (
          <button onClick={() => { setOriginFilter(""); setDestFilter(""); setMinWeight(""); setMaxWeight(""); setUrgentOnly(false); }} className="text-xs text-black/40 underline">
            Clear filters
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-xs">
          {savedSearches.map((s) => (
            <span key={s.id} className="flex items-center gap-1 rounded-full bg-black/5 px-3 py-1">
              <button onClick={() => applySearch(s.filters)}>{s.name}</button>
              <button onClick={() => deleteSearch(s.id)} className="text-black/40 hover:text-black/70">×</button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              className="w-28 rounded-full border border-black/15 px-3 py-1 text-xs"
              placeholder="Save search as..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <button onClick={saveCurrentSearch} className="rounded-full border border-black/15 px-3 py-1 text-xs">Save</button>
          </div>
        </div>

        <div className="flex rounded-md border border-black/10 text-xs">
          <button onClick={() => setView("table")} className={`px-3 py-1.5 ${view === "table" ? "bg-m20navy text-white" : ""}`}>Table</button>
          <button onClick={() => setView("map")} className={`px-3 py-1.5 ${view === "map" ? "bg-m20navy text-white" : ""}`}>Map</button>
        </div>
      </div>

      {view === "map" ? (
        <LoadBoardMap shipments={filtered.map((s) => ({ ...s, mode: s.mode }))} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 text-left text-xs uppercase text-black/50">
              <tr>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Origin</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3">Bids</th>
                <th className="px-4 py-3">Bid Deadline</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">{s.mode}</td>
                  <td className="px-4 py-3">{s.originAddress}{s.isUrgent && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">URGENT</span>}</td>
                  <td className="px-4 py-3">{s.destAddress}</td>
                  <td className="px-4 py-3">{s.weightLb.toLocaleString()} lb</td>
                  <td className="px-4 py-3">{s.bidCount}</td>
                  <td className="px-4 py-3">{new Date(s.bidDeadline).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right"><QuickBidButton shipmentId={s.id} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-black/50">No open loads match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
