"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string; name: string; email: string; phone: string | null; role: string; createdAt: string;
  carrierProfile: { legalName: string; membershipActive: boolean; membershipTier: string } | null;
};

export default function ProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setProfile(d.user);
          setName(d.user.name);
          setPhone(d.user.phone || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved." : "Could not save changes.");
  }

  if (loading) return <p className="text-sm text-black/40">Loading profile...</p>;
  if (!profile) return <p className="text-sm text-black/40">Could not load profile.</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-lg border border-black/10 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase text-black/50">Account</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black/60">Email (read-only)</label>
            <input value={profile.email} disabled className="w-full rounded-md border border-black/10 bg-black/5 px-3 py-2 text-sm text-black/50" />
          </div>
          <button onClick={save} disabled={saving} className="rounded-md bg-m20navy px-4 py-2 text-sm text-white disabled:opacity-40">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {message && <p className="text-xs text-black/50">{message}</p>}
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-5 text-sm">
        <span className="text-xs font-semibold uppercase text-black/50">Role</span>
        <p className="mt-1">{profile.role}</p>
        {profile.carrierProfile && (
          <p className="mt-2 text-black/60">
            Membership: {profile.carrierProfile.membershipActive ? profile.carrierProfile.membershipTier : "inactive"}
          </p>
        )}
      </div>
    </div>
  );
}
