// components/admin/settings/CustomDomainSection.tsx
// "Eigene Domain" section for /admin/settings (Agency-exklusiv). Lets the tenant request their
// own domain instead of a gentlebook.de link. There is no automatic Vercel provisioning yet (see
// Agency-Ausbau-Runde-2 plan) — a SuperAdmin adds the domain by hand and flips the status once
// it's live, this section just shows the current request status.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe2, CheckCircle2, Clock, XCircle, Loader2, Unlink, Lock } from "lucide-react";
import { adminApi, type TenantDomainInfo } from "@/lib/api/admin";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";
import { useConfirm } from "@/components/ConfirmDialog";

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-gb-textMuted focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

function getStatusLabel(t: Translations): Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> {
  const s = t.admin.settingsPage;
  return {
    PendingVerification: { label: s.cdsStatusPending, color: "#92400E", icon: Clock },
    Verified: { label: s.cdsStatusVerified, color: "#065F46", icon: CheckCircle2 },
    Failed: { label: s.cdsStatusFailed, color: "#991B1B", icon: XCircle },
  };
}

export function CustomDomainSection() {
  const { t, lang } = useTranslation();
  const s = t.admin.settingsPage;
  const STATUS_LABEL = getStatusLabel(t);
  const dateLocale = lang === "de" ? "de-DE" : "en-US";
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<TenantDomainInfo | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locked, setLocked] = useState<{ message: string; currentPlan?: string; requiredPlan?: string } | null>(null);
  const { confirm, dialog } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDomain();
      setInfo(data);
      setUrlInput(data.domain ?? "");
    } catch (err: any) {
      if (err?.response?.status === 402 && err.response?.data?.feature === "custom_domain") {
        setLocked({ message: err.response.data.message, currentPlan: err.response.data.currentPlan, requiredPlan: err.response.data.requiredPlan });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    if (!urlInput.trim()) { setError(s.cdsDomainRequired); return; }
    setSaving(true);
    try {
      await adminApi.updateDomain(urlInput.trim());
      setSuccess(s.cdsRequestedInfo);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? s.cdsSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    const ok = await confirm({ title: s.cdsRemove, message: s.cdsRemoveConfirm, variant: "danger" });
    if (!ok) return;
    setSaving(true);
    try {
      await adminApi.removeDomain();
      setUrlInput("");
      setSuccess(s.cdsRemovedInfo);
      await load();
    } catch {
      setError(s.cdsRemoveError);
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
            <p className="font-semibold text-[#111318] text-sm leading-tight">{s.customDomain}</p>
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

  const statusInfo = info?.status && info.status !== "None" ? STATUS_LABEL[info.status] : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-1 pb-4">
        <div className="w-8 h-8 bg-[#6355E4] rounded-xl flex items-center justify-center shrink-0">
          <Globe2 size={15} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">{s.customDomain}</p>
          <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{s.cdsSubtitle}</p>
        </div>
      </div>

      <div className="px-1 space-y-4">
        <div className="rounded-xl border border-[#C7D2FE] bg-[#F8F7FF] p-3.5">
          <p className="text-xs leading-relaxed text-[#565A72]">
            {s.cdsInfoTextPart1} <code className="bg-white px-1 py-0.5 rounded">buchung.deinefirma.de</code>{s.cdsInfoTextPart2}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#6B7280]">{s.cdsDomainLabel}</label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={s.cdsDomainPlaceholder}
            className={inputCls}
            disabled={saving}
          />
        </div>

        {statusInfo && StatusIcon && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: statusInfo.color }}>
            <StatusIcon size={13} /> {statusInfo.label}
            {info?.requestedAt && <span className="text-gb-textMuted"> {fillTemplate(s.cdsRequestedOnTemplate, { date: new Date(info.requestedAt).toLocaleDateString(dateLocale) })}</span>}
          </div>
        )}

        {error && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{error}</p>}
        {success && !error && <p className="text-xs text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] rounded-lg px-3 py-2">{success}</p>}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Globe2 size={13} />} {s.cdsRequestDomain}
          </button>
          {info?.domain && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-3 py-2 text-xs font-semibold text-[#991B1B] hover:bg-[#FEE2E2] disabled:opacity-50"
            >
              <Unlink size={13} /> {s.cdsRemove}
            </button>
          )}
        </div>
      </div>
      {dialog}
    </div>
  );
}
