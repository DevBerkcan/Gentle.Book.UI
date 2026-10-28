// components/admin/settings/TeamReportsSection.tsx
// "Team-Reports" section for /admin/settings (Agency-exklusiv). Lets the tenant opt into a
// daily or weekly dashboard-summary email (AdminDigestService, Hangfire job "send-admin-digests").
"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

type Frequency = "None" | "Daily" | "Weekly";

function getOptions(t: Translations): { value: Frequency; label: string; description: string }[] {
  const s = t.admin.settingsPage;
  return [
    { value: "None", label: s.trsOptionOffLabel, description: s.trsOptionOffDesc },
    { value: "Daily", label: s.trsOptionDailyLabel, description: s.trsOptionDailyDesc },
    { value: "Weekly", label: s.trsOptionWeeklyLabel, description: s.trsOptionWeeklyDesc },
  ];
}

export function TeamReportsSection() {
  const { t } = useTranslation();
  const s = t.admin.settingsPage;
  const OPTIONS = getOptions(t);
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
      setSuccess(t.admin.genericSavedInfo);
    } catch {
      setError(t.admin.genericSaveError);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 text-xs text-gb-textMuted px-1"><Loader2 size={13} className="animate-spin" /> {t.loading}</div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-1 pb-3">
          <div className="w-8 h-8 bg-[#E5E7EB] rounded-xl flex items-center justify-center shrink-0">
            <Lock size={14} className="text-gb-textMuted" />
          </div>
          <div>
            <p className="font-semibold text-[#111318] text-sm leading-tight">{s.teamReports}</p>
            <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{t.admin.agencyExclusive}</p>
          </div>
        </div>
        <div className="px-1">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] p-3.5 text-xs text-[#565A72]">
            {locked.message}
            {locked.currentPlan && <span className="block mt-1 text-gb-textMuted">{fillTemplate(t.admin.currentPlanTemplate, { plan: locked.currentPlan })}</span>}
            <a href="/admin/subscription" className="inline-block mt-2 text-[#6355E4] font-semibold hover:underline">{t.admin.upgradeNowCta}</a>
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
          <p className="font-semibold text-[#111318] text-sm leading-tight">{s.teamReports}</p>
          <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{s.trsSubtitle}</p>
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
              <p className="text-[11px] text-gb-textMuted leading-tight">{opt.description}</p>
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{error}</p>}
        {success && !error && <p className="text-xs text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] rounded-lg px-3 py-2">{success}</p>}
      </div>
    </div>
  );
}
