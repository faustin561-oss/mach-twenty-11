"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { id: string; body: string; createdAt: string; sender: { name: string } };

export function MessageThread({ shipmentId }: { shipmentId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const res = await fetch(`/api/shipments/${shipmentId}/messages`);
    if (res.ok) setMessages((await res.json()).messages);
  }

  useEffect(() => { load(); }, [shipmentId]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch(`/api/shipments/${shipmentId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setSending(false);
    if (res.ok) { setText(""); load(); }
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase text-black/50">Messages</h2>
      <div className="mt-3 max-h-64 space-y-3 overflow-y-auto">
        {messages.length === 0 && <p className="text-xs text-black/40">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{m.sender.name}</span>
            <span className="ml-2 text-xs text-black/40">{new Date(m.createdAt).toLocaleString()}</span>
            <p className="text-black/70">{m.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm"
          placeholder="Write a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send} disabled={sending} className="rounded-md bg-m20navy px-4 py-2 text-sm text-white disabled:opacity-40">
          Send
        </button>
      </div>
    </div>
  );
}

export function DisputeButton({ shipmentId, alreadyDisputed }: { shipmentId: string; alreadyDisputed: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/shipments/${shipmentId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setSubmitting(false);
    if (!res.ok) { setError((await res.json()).error?.toString() || "Could not raise dispute."); return; }
    setOpen(false);
    router.refresh();
  }

  if (alreadyDisputed) {
    return <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">Dispute in review</span>;
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700">
        Raise a Dispute
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold">Raise a Dispute</h3>
            <textarea
              className="mt-3 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
              rows={4}
              placeholder="Describe the issue in detail (min 10 characters)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm">Cancel</button>
              <button onClick={submit} disabled={reason.length < 10 || submitting} className="rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-40">
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
