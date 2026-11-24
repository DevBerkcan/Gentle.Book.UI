// components/admin/settings/ReferralSection.tsx
// "Freunde machen Freude" settings: on/off + the reward both sides get after the friend's first
// completed appointment. Pro/Agency/Trial; Starter sees the upgrade hint (same idiom as LoyaltySection).
"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2, Lock } from "lucide-react";
import { referralsApi } from "@/lib/api/studioPass";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-gb-textMuted focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

export function ReferralSection() {
  const { t } = useTranslation();
  const p = t.studioPass;
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [rewardText, setRewardText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locked, setLocked] = useState<{ message: string; currentPlan?: string } | null>(null);
  // Load failed for a non-plan reason (e.g. frontend already live, backend not deployed yet):
  // hide the section instead of showing a misleading upgrade hint.
  const [hidden, setHidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await referralsApi.getSettings();
      setAvailable(s.available);
      setEnabled(s.enabled);
      setRewardText(s.rewardText ?? "");
    } catch (err: any) {
      if (err?.response?.status === 402) setAvailable(false);
      else setHidden(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const s = await referralsApi.updateSettings(enabled, rewardText.trim() || null);
      setEnabled(s.enabled);
      setRewardText(s.rewardText ?? "");
      setSuccess(t.admin.genericSavedInfo);
    } catch (err: any) {
      if (err?.response?.status === 402) setLocked({ message: err.response.data.message, currentPlan: err.response.data.currentPlan });
      setError(err?.response?.data?.message ?? t.admin.genericSaveError);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-xs text-gb-textMuted px-1"><Loader2 size={13} className="animate-spin" /> {t.loading}</div>;
  }
  if (hidden) return null;

  const header = (
    <div className="flex items-center gap-3 px-1 pb-4">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${available ? "bg-[#E11D48]" : "bg-[#E5E7EB]"}`}>
        {available ? <Heart size={15} className="text-white" /> : <Lock size={14} className="text-gb-textMuted" />}
      </div>
      <div>
        <p className="font-semibold text-[#111318] text-sm leading-tight">{p.settingsTitle}</p>
        <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{p.settingsSubtitle}</p>
      </div>
    </div>
  );

  if (!available || locked) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden" data-testid="referral-settings-locked">
        {header}
        <div className="px-1">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] p-3.5 text-xs text-[#565A72]">
            {locked?.message ?? "„Freunde machen Freude“ ist in den Tarifen Pro und Agency enthalten."}
            {locked?.currentPlan && <span className="block mt-1 text-gb-textMuted">{fillTemplate(t.admin.currentPlanTemplate, { plan: locked.currentPlan })}</span>}
            <a href="/admin/subscription" className="inline-block mt-2 text-[#6355E4] font-semibold hover:underline">{t.admin.upgradeNowCta}</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" data-testid="referral-settings">
      {header}
      <div className="px-1 space-y-4">
        <label className="flex items-center gap-2.5 text-sm text-[#111318] cursor-pointer select-none">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={saving} className="h-4 w-4 accent-[#6355E4]" />
          {p.enabledLabel}
        </label>
        <div className="flex flex-col gap-1.5 max-w-md">
          <label className="text-xs font-semibold text-[#6B7280]" htmlFor="referral-reward">{p.rewardLabel}</label>
          <input
            id="referral-reward"
            type="text"
            maxLength={300}
            value={rewardText}
            onChange={(e) => setRewardText(e.target.value)}
            placeholder={p.rewardPlaceholder}
            className={inputCls}
            disabled={saving}
          />
          <p className="text-[11px] text-gb-textMuted">{p.rewardHint}</p>
        </div>
        {error && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{error}</p>}
        {success && !error && <p className="text-xs text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] rounded-lg px-3 py-2">{success}</p>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Heart size={13} />} {t.save}
        </button>
      </div>
    </div>
  );
}
