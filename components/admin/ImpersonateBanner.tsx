"use client";
import { useEffect, useState } from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { removeAccessToken } from '@/lib/auth/storage';

export function ImpersonateBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(localStorage.getItem("impersonating") === "true");
  }, []);

  if (!active) return null;

  function exitImpersonate() {
    const from = localStorage.getItem("impersonating_from");
    localStorage.removeItem("impersonating");
    localStorage.removeItem("impersonating_from");
    removeAccessToken();
    localStorage.removeItem("tenant_slug");
    window.location.href = from || "/superadmin/tenants";
  }

  return (
    <div className="bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} />
        <span>Superadmin-Modus — Du siehst das System als Shop-Owner</span>
      </div>
      <button
        onClick={exitImpersonate}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
      >
        <ArrowLeft size={13} />
        Zurück zum Superadmin
      </button>
    </div>
  );
}
