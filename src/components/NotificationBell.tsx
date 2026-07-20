"use client";

import { useEffect, useState } from "react";

type Notification = { id: string; title: string; body: string; read: boolean; createdAt: string };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const body = await res.json();
    setNotifications(body.notifications);
    setUnread(body.unread);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-full border border-black/10 bg-white px-3 py-2 text-sm">
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-black/10 bg-white shadow-lg">
          <div className="border-b border-black/5 px-4 py-2 text-xs font-semibold uppercase text-black/50">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && <p className="px-4 py-6 text-center text-xs text-black/40">Nothing yet.</p>}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`block w-full border-b border-black/5 px-4 py-3 text-left text-xs last:border-0 ${n.read ? "opacity-50" : ""}`}
              >
                <div className="font-medium">{n.title}</div>
                <div className="mt-0.5 text-black/50">{n.body}</div>
              </button>
            ))}
          </div>
          <a href="/notifications" className="block border-t border-black/5 px-4 py-2 text-center text-xs font-medium text-m20navy hover:bg-black/5">
            View all
          </a>
        </div>
      )}
    </div>
  );
}
