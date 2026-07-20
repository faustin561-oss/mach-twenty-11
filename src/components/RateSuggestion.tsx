"use client";

import { useEffect, useState } from "react";

type Suggestion = {
  basis: "lane_history" | "mode_history" | "no_data";
  sampleSize?: number;
  suggestion: { low: number; median: number; high: number } | null;
  note: string;
};

export default function RateSuggestion({ mode, origin, dest }: { mode: string; origin: string; dest: string }) {
  const [data, setData] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mode) return;
    setLoading(true);
    const params = new URLSearchParams({ mode });
    if (origin) params.set("origin", origin);
    if (dest) params.set("dest", dest);
    fetch(`/api/ai/price-suggestion?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [mode, origin, dest]);

  if (loading) return <p className="text-xs text-black/40">Checking historical rates...</p>;
  if (!data || !data.suggestion) return null;

  return (
    <div className="rounded-md border border-hpcyan/30 bg-hpcyan/5 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-hpcyandeep">Suggested rate range</p>
      <p className="mt-1 text-lg font-semibold text-hpink">
        ${data.suggestion.low.toLocaleString()} – ${data.suggestion.high.toLocaleString()}
        <span className="ml-2 text-sm font-normal text-black/50">median ${data.suggestion.median.toLocaleString()}</span>
      </p>
      <p className="mt-1 text-xs text-black/50">{data.note}</p>
    </div>
  );
}
