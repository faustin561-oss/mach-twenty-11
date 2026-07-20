"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import RateSuggestion from "@/components/RateSuggestion";

const MODES = [
  { id: "FTL", label: "Truck FTL" },
  { id: "LTL", label: "Truck LTL" },
  { id: "OCEAN_FCL", label: "Ocean FCL" },
  { id: "OCEAN_LCL", label: "Ocean LCL" },
  { id: "AIR", label: "Air Freight" },
  { id: "RAIL", label: "Rail" },
  { id: "VEHICLE", label: "Vehicle" },
  { id: "BOAT", label: "Boat" },
  { id: "HOUSEHOLD_MOVING", label: "Household Moving" },
  { id: "HEAVY_EQUIPMENT", label: "Heavy Equipment" },
  { id: "AGRICULTURE", label: "Agriculture" },
  { id: "CONSTRUCTION", label: "Construction" },
  { id: "MEDICAL", label: "Medical" },
  { id: "COURIER", label: "Courier" },
  { id: "SPECIALTY", label: "Specialty Cargo" },
];

const STEPS = ["Category", "Route & Cargo", "Options", "Timing & Review"];

type FormState = {
  mode: string;
  originAddress: string;
  originLat?: number;
  originLng?: number;
  destAddress: string;
  destLat?: number;
  destLng?: number;
  cargoDescription: string;
  weightLb: string;
  dimensions: string;
  hazmat: boolean;
  fragile: boolean;
  tempControlled: boolean;
  insuranceValue: string;
  pickupWindowStart: string;
  bidDeadline: string;
  photos: File[];
};

const initialState: FormState = {
  mode: "FTL",
  originAddress: "",
  destAddress: "",
  cargoDescription: "",
  weightLb: "",
  dimensions: "",
  hazmat: false,
  fragile: false,
  tempControlled: false,
  insuranceValue: "",
  pickupWindowStart: "",
  bidDeadline: "",
  photos: [],
};

// Shipment creation wizard — increment 2.
// Photo upload wires to /api/uploads/presign (needs AWS_* env vars set;
// until then the upload step is skippable and just won't attach photos).
// Address autocomplete via Google Maps is not wired yet — plain text
// fields for now, see README roadmap item 2.
export default function NewShipmentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function canAdvance() {
    if (step === 0) return !!form.mode;
    if (step === 1) return form.originAddress && form.destAddress && form.cargoDescription && form.weightLb;
    if (step === 2) return true;
    if (step === 3) return form.pickupWindowStart && form.bidDeadline;
    return true;
  }

  async function uploadPhotos(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of form.photos) {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      if (!presignRes.ok) continue; // upload service not configured — skip silently, don't block posting
      const { uploadUrl, publicUrl } = await presignRes.json();
      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      urls.push(publicUrl);
    }
    return urls;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const photoUrls = form.photos.length ? await uploadPhotos() : [];
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: form.mode,
          originAddress: form.originAddress,
          originLat: form.originLat,
          originLng: form.originLng,
          destAddress: form.destAddress,
          destLat: form.destLat,
          destLng: form.destLng,
          cargoDescription: form.cargoDescription,
          weightLb: Number(form.weightLb),
          hazmat: form.hazmat,
          fragile: form.fragile,
          tempControlled: form.tempControlled,
          pickupWindowStart: new Date(form.pickupWindowStart).toISOString(),
          bidDeadline: new Date(form.bidDeadline).toISOString(),
          photos: photoUrls,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.formErrors?.join(", ") || "Could not post shipment.");
      }
      const { shipment } = await res.json();
      router.push(`/loadboard?posted=${shipment.id}`);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Post a Load</h1>

      <ol className="mt-6 flex gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-full px-3 py-1 text-center ${
              i === step ? "bg-m20navy text-white" : i < step ? "bg-m20amber/30" : "bg-black/5 text-black/40"
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-lg border border-black/10 bg-white p-6">
        {step === 0 && (
          <div>
            <p className="mb-4 text-sm text-black/60">What are you shipping?</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => update("mode", m.id)}
                  className={`rounded-md border px-3 py-3 text-sm ${
                    form.mode === m.id ? "border-m20amber bg-m20amber/10" : "border-black/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label="Origin Address">
              <AddressAutocomplete
                value={form.originAddress}
                placeholder="City, State or full address"
                onChange={(address, lat, lng) => setForm((f) => ({ ...f, originAddress: address, originLat: lat, originLng: lng }))}
              />
            </Field>
            <Field label="Destination Address">
              <AddressAutocomplete
                value={form.destAddress}
                placeholder="City, State or full address"
                onChange={(address, lat, lng) => setForm((f) => ({ ...f, destAddress: address, destLat: lat, destLng: lng }))}
              />
            </Field>
            <Field label="Cargo Description">
              <input className="input" value={form.cargoDescription} onChange={(e) => update("cargoDescription", e.target.value)} placeholder="What's being shipped" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Weight (lb)">
                <input type="number" className="input" value={form.weightLb} onChange={(e) => update("weightLb", e.target.value)} />
              </Field>
              <Field label="Dimensions (optional)">
                <input className="input" value={form.dimensions} onChange={(e) => update("dimensions", e.target.value)} placeholder={'L x W x H (ft)'} />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Checkbox label="Hazmat" checked={form.hazmat} onChange={(v) => update("hazmat", v)} />
            <Checkbox label="Fragile" checked={form.fragile} onChange={(v) => update("fragile", v)} />
            <Checkbox label="Temperature Controlled" checked={form.tempControlled} onChange={(v) => update("tempControlled", v)} />
            <Field label="Declared Insurance Value ($, optional)">
              <input type="number" className="input" value={form.insuranceValue} onChange={(e) => update("insuranceValue", e.target.value)} />
            </Field>
            <Field label="Photos (optional)">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => update("photos", Array.from(e.target.files || []))}
              />
              {form.photos.length > 0 && (
                <p className="mt-1 text-xs text-black/50">{form.photos.length} file(s) selected</p>
              )}
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pickup Window Start">
                <input type="datetime-local" className="input" value={form.pickupWindowStart} onChange={(e) => update("pickupWindowStart", e.target.value)} />
              </Field>
              <Field label="Sealed Bid Deadline">
                <input type="datetime-local" className="input" value={form.bidDeadline} onChange={(e) => update("bidDeadline", e.target.value)} />
              </Field>
            </div>
            <div className="rounded-md bg-black/5 p-4 text-sm">
              <p className="font-medium">{MODES.find((m) => m.id === form.mode)?.label}</p>
              <p className="text-black/60">{form.originAddress || "\u2014"} → {form.destAddress || "\u2014"}</p>
              <p className="text-black/60">{form.cargoDescription || "\u2014"} · {form.weightLb || "0"} lb</p>
            </div>
            <RateSuggestion mode={form.mode} origin={form.originAddress} dest={form.destAddress} />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-md border border-black/15 px-5 py-2 text-sm disabled:opacity-30"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="rounded-md bg-m20navy px-5 py-2 text-sm text-white disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canAdvance() || submitting}
            className="rounded-md bg-m20amber px-5 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            {submitting ? "Posting..." : "Post Load"}
          </button>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgba(0,0,0,0.15);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-black/60">{label}</label>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
