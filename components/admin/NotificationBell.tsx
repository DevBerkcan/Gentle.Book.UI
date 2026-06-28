"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, XCircle, Calendar } from "lucide-react";
import api from "@/lib/api/client";

interface Notification {
  id: string;
  type: string;
  customerName: string;
  serviceName: string;
  employeeName?: string;
  bookingDate: string;
  startTime: string;
  cancelledAt: string;
  reason?: string;
}

const STORAGE_KEY = "notifications_last_read";

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `vor ${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

export function NotificationBell({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/notifications");
      const items: Notification[] = data.notifications ?? [];
      setNotifications(items);

      const lastRead = localStorage.getItem(STORAGE_KEY);
      const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
      const newCount = items.filter(n => new Date(n.cancelledAt).getTime() > lastReadTime).length;
      setUnread(newCount);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setUnread(0);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-xl transition-colors ${
          dark
            ? "text-white/40 hover:text-white hover:bg-white/10"
            : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
        }`}
        aria-label="Benachrichtigungen"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Benachrichtigungen</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                Keine aktuellen Benachrichtigungen
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <XCircle size={14} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-snug">
                        <span className="font-semibold">{n.customerName}</span> hat den Termin storniert
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                        <Calendar size={11} />
                        {new Date(n.bookingDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                        {" "}um{" "}
                        {n.startTime?.substring(0, 5)} Uhr
                        {n.serviceName && <span className="text-gray-400">· {n.serviceName}</span>}
                        {n.employeeName && <span className="text-gray-400">· {n.employeeName}</span>}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.cancelledAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-[11px] text-gray-400 text-center">
                Zeigt Stornierungen der letzten 14 Tage
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
