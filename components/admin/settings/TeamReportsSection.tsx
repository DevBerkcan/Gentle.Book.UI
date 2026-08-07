// components/admin/settings/TeamReportsSection.tsx
// "Team-Reports" section for /admin/settings (Agency-exklusiv). Lets the tenant opt into a
// daily or weekly dashboard-summary email (AdminDigestService, Hangfire job "send-admin-digests").
"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin";

type Frequency = "None" | "Daily" | "Weekly";

const OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: "None", label: "Aus", description: "Kein automatischer Report" },
  { value: "Daily", label: "Täglich", description: "Jeden Morgen um 7 Uhr" },
  { value: "Weekly", label: "Wöchentlich", description: "Jeden Montag um 7 Uhr" },
];

export function TeamReportsSection() {
  const [loading, setLoading] = useState(true);
  const [frequency, setFrequency] = useState<Frequency>("None");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locked, setLocked] = useState<{ message: string; currentPlan?: string; requiredPlan?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDigestFrequency();
      setFrequency(data.frequency);
    } catch (err: any) {
      if (err?.response?.status === 402 && err.response?.data?.feature === "admin_digest") {
        setLocked({ message: err.response.data.message, currentPlan: err.response.data.currentPlan, requiredPlan: err.response.data.requiredPlan });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSelect(value: Frequency) {
    if (value === frequency || saving) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await adminApi.updateDigestFrequency(value);
      setFrequency(value);
      setSuccess("Gespeichert.");
    } catch {
      setError("Die Einstellung konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF] px-1"><Loader2 size={13} className="animate-spin" /> Lade…</div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-1 pb-3">
          <div className="w-8 h-8 bg-[#E5E7EB] rounded-xl flex items-center justify-center shrink-0">
            <Lock size={14} className="text-[#9CA3AF]" />
          </div>
          <div>
            <p className="font-semibold text-[#111318] text-sm leading-tight">Team-Reports</p>
            <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Agency-exklusiv</p>
          </div>
        </div>
        <div className="px-1">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] p-3.5 text-xs text-[#565A72]">
            {locked.message}
            {locked.currentPlan && <span className="block mt-1 text-[#9CA3AF]">Aktueller Plan: {locked.currentPlan}</span>}
            <a href="/admin/subscription" className="inline-block mt-2 text-[#6355E4] font-semibold hover:underline">Jetzt upgraden →</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-1 pb-4">
        <div className="w-8 h-8 bg-[#6355E4] rounded-xl flex items-center justify-center shrink-0">
          <Mail size={15} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">Team-Reports</p>
          <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Automatische Zusammenfassung deiner Buchungen & Umsätze per E-Mail</p>
        </div>
      </div>

      <div className="px-1 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              className={`text-left rounded-xl border p-3 transition-colors disabled:opacity-50 ${
                frequency === opt.value
                  ? "border-[#A5B4FC] bg-[#F8F7FF]"
                  : "border-[#E5E7EB] bg-white hover:bg-[#F7F7F8]"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {frequency === opt.value && <CheckCircle2 size={13} className="text-[#6355E4]" />}
                <span className="text-xs font-semibold text-[#111318]">{opt.label}</span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-tight">{opt.description}</p>
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{error}</p>}
        {success && !error && <p className="text-xs text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] rounded-lg px-3 py-2">{success}</p>}
      </div>
    </div>
  );
}
