"use client";

import { useEffect, useState } from "react";

type Rec = { carrierId: string; name: string; rating: number; equipmentTypes: string[]; equipmentMatch: boolean };

export default function CarrierRecommendations({ shipmentId }: { shipmentId: string }) {
  const [recs, setRecs] = useState<Rec[] | null>(null);

  useEffect(() => {
    fetch(`/api/ai/carrier-recommendations?shipmentId=${shipmentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRecs(d?.recommendations ?? []))
      .catch(() => setRecs([]));
  }, [shipmentId]);

  if (!recs || recs.length === 0) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase text-black/50">Recommended Carriers</h2>
      <p className="mt-1 text-xs text-black/40">Ranked by rating and equipment match — not a guarantee they'll bid.</p>
      <div className="mt-3 space-y-2">
        {recs.map((r) => (
          <div key={r.carrierId} className="flex items-center justify-between rounded-md bg-black/[0.03] px-3 py-2 text-sm">
            <span>{r.name}</span>
            <span className="flex items-center gap-2 text-xs text-black/50">
              {r.equipmentMatch && <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">equipment match</span>}
              ★ {r.rating.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
