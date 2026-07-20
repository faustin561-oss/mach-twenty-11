"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

type Props = {
  placeholder?: string;
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
};

// Address autocomplete — increment 4.
// Silently degrades to a plain text input if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
// isn't set, rather than throwing and blocking the wizard. Loads the Places
// library once per page via @googlemaps/js-api-loader's built-in caching.
export default function AddressAutocomplete({ placeholder, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsUnavailable, setMapsUnavailable] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapsUnavailable(true);
      return;
    }
    const loader = new Loader({ apiKey, libraries: ["places"] });
    loader
      .importLibrary("places")
      .then(() => setMapsReady(true))
      .catch(() => setMapsUnavailable(true));
  }, []);

  useEffect(() => {
    if (!mapsReady || !inputRef.current) return;
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode", "establishment"],
    });
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || place.name || "";
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();
      onChange(address, lat, lng);
    });
    return () => google.maps.event.removeListener(listener);
  }, [mapsReady, onChange]);

  return (
    <div>
      <input
        ref={inputRef}
        className="input"
        placeholder={placeholder}
        defaultValue={value}
        onChange={(e) => !mapsReady && onChange(e.target.value)}
      />
      {mapsUnavailable && (
        <p className="mt-1 text-xs text-black/40">
          Autocomplete unavailable (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) — plain text works fine.
        </p>
      )}
    </div>
  );
}
