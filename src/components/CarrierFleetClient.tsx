"use client";

import { useEffect, useState } from "react";

type Vehicle = { id: string; unitNumber: string; type: string; status: string; assignedDriver?: { name: string } | null };
type Driver = { id: string; name: string; status: string; vehicles: { unitNumber: string }[] };

// Fleet management — increment 3. Basic list + add for vehicles and
// drivers. Assigning a driver to a vehicle, maintenance logs, and
// document uploads (insurance, registration) are not built yet.
export default function CarrierFleetClient() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newVehicle, setNewVehicle] = useState({ unitNumber: "", type: "Dry Van" });
  const [newDriver, setNewDriver] = useState({ name: "", phone: "" });

  async function load() {
    setLoading(true);
    const [vRes, dRes] = await Promise.all([fetch("/api/fleet/vehicles"), fetch("/api/fleet/drivers")]);
    if (vRes.ok) setVehicles((await vRes.json()).vehicles);
    if (dRes.ok) setDrivers((await dRes.json()).drivers);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addVehicle() {
    setError(null);
    const res = await fetch("/api/fleet/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newVehicle),
    });
    if (!res.ok) { setError((await res.json()).error?.toString() || "Could not add vehicle."); return; }
    setNewVehicle({ unitNumber: "", type: "Dry Van" });
    load();
  }

  async function addDriver() {
    setError(null);
    const res = await fetch("/api/fleet/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDriver),
    });
    if (!res.ok) { setError((await res.json()).error?.toString() || "Could not add driver."); return; }
    setNewDriver({ name: "", phone: "" });
    load();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Fleet Management</h1>
      {error && <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Vehicles</h2>
        <div className="mt-3 flex gap-2">
          <input className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Unit number" value={newVehicle.unitNumber} onChange={(e) => setNewVehicle((v) => ({ ...v, unitNumber: e.target.value }))} />
          <select className="rounded-md border border-black/15 px-3 py-2 text-sm" value={newVehicle.type} onChange={(e) => setNewVehicle((v) => ({ ...v, type: e.target.value }))}>
            <option>Dry Van</option><option>Reefer</option><option>Flatbed</option><option>Box Truck</option>
          </select>
          <button onClick={addVehicle} disabled={!newVehicle.unitNumber} className="rounded-md bg-m20navy px-4 py-2 text-sm text-white disabled:opacity-40">Add</button>
        </div>
        <div className="mt-4 space-y-2">
          {!loading && vehicles.length === 0 && <p className="text-sm text-black/50">No vehicles yet.</p>}
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-4 py-3 text-sm">
              <span>{v.unitNumber} · {v.type}</span>
              <span className="text-black/50">{v.assignedDriver?.name || "Unassigned"} · {v.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Drivers</h2>
        <div className="mt-3 flex gap-2">
          <input className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Name" value={newDriver.name} onChange={(e) => setNewDriver((d) => ({ ...d, name: e.target.value }))} />
          <input className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Phone" value={newDriver.phone} onChange={(e) => setNewDriver((d) => ({ ...d, phone: e.target.value }))} />
          <button onClick={addDriver} disabled={!newDriver.name} className="rounded-md bg-m20navy px-4 py-2 text-sm text-white disabled:opacity-40">Add</button>
        </div>
        <div className="mt-4 space-y-2">
          {!loading && drivers.length === 0 && <p className="text-sm text-black/50">No drivers yet.</p>}
          {drivers.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-4 py-3 text-sm">
              <span>{d.name}</span>
              <span className="text-black/50">{d.vehicles.map((v) => v.unitNumber).join(", ") || "No vehicle"} · {d.status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
