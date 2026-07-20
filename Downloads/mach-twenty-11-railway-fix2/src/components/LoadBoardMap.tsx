"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

type MapShipment = {
  id: string;
  originAddress: string;
  originLat: number | null;
  originLng: number | null;
  destAddress: string;
  destLat: number | null;
  destLng: number | null;
  mode: string;
};

// Load board map view — increment 4.
// Renders origin/destination pins for shipments that have geocoded
// lat/lng (set via AddressAutocomplete at posting time). Shipments posted
// with plain-text addresses (no Maps key configured at post time) won't
// have coordinates and are skipped here — that's expected, not a bug.
export default function LoadBoardMap({ shipments }: { shipments: MapShipment[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  const geocoded = shipments.filter((s) => s.originLat && s.originLng);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) {
      setUnavailable(!apiKey);
      return;
    }

    const loader = new Loader({ apiKey, libraries: ["maps", "marker"] });
    loader.importLibrary("maps").then(async () => {
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 39.8283, lng: -98.5795 },
        zoom: 4,
        mapId: "MACH2011_LOADBOARD",
      });

      const bounds = new google.maps.LatLngBounds();
      geocoded.forEach((s) => {
        const pos = { lat: s.originLat!, lng: s.originLng! };
        new google.maps.Marker({ position: pos, map, title: `${s.mode} · ${s.originAddress}` });
        bounds.extend(pos);
        if (s.destLat && s.destLng) {
          const destPos = { lat: s.destLat, lng: s.destLng };
          new google.maps.Marker({ position: destPos, map, title: `→ ${s.destAddress}`, opacity: 0.6 });
          bounds.extend(destPos);
          new google.maps.Polyline({
            path: [pos, destPos],
            map,
            strokeColor: "#FF8A00",
            strokeOpacity: 0.6,
            strokeWeight: 2,
          });
        }
      });
      if (geocoded.length > 0) map.fitBounds(bounds);
    });
  }, [geocoded.length]);

  if (unavailable) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-black/10 bg-black/5 text-sm text-black/50">
        Map view unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable it.
      </div>
    );
  }

  return (
    <div>
      <div ref={mapRef} className="h-96 w-full rounded-lg border border-black/10" />
      {geocoded.length < shipments.length && (
        <p className="mt-2 text-xs text-black/40">
          {shipments.length - geocoded.length} load(s) without geocoded addresses aren't shown on the map.
        </p>
      )}
    </div>
  );
}
