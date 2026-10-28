// components/admin/settings/WebsiteBrandSection.tsx
// "Unternehmenswebsite" section for /admin/settings (spec section 2A). Lets the admin store
// their existing website URL, give (or revoke) usage consent, and trigger/track a brand
// analysis. The heavier "pick a proposal / apply" workflow lives in /admin/links
// (BrandImportPanel) — this section is only about the connection + consent + status.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe2, CheckCircle2, XCircle, Loader2, Sparkles, RefreshCw, Unlink } from "lucide-react";
import {
  getBrandImportSettings,
  updateBrandImportSettings,
  removeBrandImportConnection,
  startBrandAnalysis,
  pollBrandImportJob,
  type BrandImportSettings,
} from "@/lib/api/brandImport";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-gb-textMuted focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

function getStatusLabel(t: Translations): Record<string, string> {
  const s = t.admin.settingsPage;
  return {
    Queued: s.wbsStatusQueued,
    Fetching: s.wbsStatusFetching,
    Extracting: s.wbsStatusExtracting,
    Analyzing: s.wbsStatusAnalyzing,
    Ready: s.wbsStatusReady,
    Applied: s.wbsStatusApplied,
    Failed: s.wbsStatusFailed,
    Archived: s.wbsStatusArchived,
  };
}

export function WebsiteBrandSection() {
  const { t, lang } = useTranslation();
  const s = t.admin.settingsPage;
  const STATUS_LABEL = getStatusLabel(t);
  const dateLocale = lang === "de" ? "de-DE" : "en-US";
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<BrandImportSettings | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBrandImportSettings();
      setSettings(data);
      setUrlInput(data?.websiteUrl ?? "");
      setConsent(data?.isConsentConfirmed ?? false);
    } catch {
      /* section is non-critical — fails silently, admin can still retry via the button */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleCheckWebsite() {
    setError(null);
    setInfo(null);
    if (!urlInput.trim()) { setError(s.wbsUrlRequired); return; }
    setSaving(true);
    try {
      await updateBrandImportSettings({ websiteUrl: urlInput.trim(), consentConfirmed: consent });
      setInfo(s.wbsUrlSaved);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? s.wbsUrlSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze(isReanalysis: boolean) {
    setError(null);
    setInfo(null);
    if (!urlInput.trim()) { setError(s.wbsUrlRequiredForAnalysis); return; }
    if (!consent) { setError(s.wbsConsentRequired); return; }

    setAnalyzing(true);
    setLiveStatus("Queued");
    try {
      const jobId = await startBrandAnalysis(urlInput.trim(), consent);
      const finalJob = await pollBrandImportJob(jobId, (job) => setLiveStatus(job.status));
      if (finalJob.status === "Ready") {
        setInfo(s.wbsAnalysisDoneInfo);
      } else {
        setError(finalJob.errorMessageSafe ?? s.wbsAnalysisFailedError);
      }
      await load();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 402) {
        setError(err?.response?.data?.message ?? s.wbsPlanLockedError);
      } else {
        setError(err?.response?.data?.message ?? s.wbsAnalysisStartError);
      }
    } finally {
      setAnalyzing(false);
      setLiveStatus(null);
      void isReanalysis;
    }
  }

  async function handleRemoveConnection() {
    if (!confirm(s.wbsRemoveConfirm)) return;
    setSaving(true);
    try {
      await removeBrandImportConnection();
      setUrlInput("");
      setConsent(false);
      setInfo(s.wbsConnectionRemoved);
      await load();
    } catch {
      setError(s.wbsRemoveError);
    } finally {
      setSaving(false);
    }
  }

  const statusKey = liveStatus ?? settings?.lastAnalysisStatus ?? null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-1 pb-4">
        <div className="w-8 h-8 bg-[#6355E4] rounded-xl flex items-center justify-center shrink-0">
          <Sparkles size={15} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">{t.admin.settingsPage.companyWebsite}</p>
          <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{s.wbsSubtitle}</p>
        </div>
      </div>

      <div className="px-1 space-y-4">
        <div className="rounded-xl border border-[#C7D2FE] bg-[#F8F7FF] p-3.5">
          <p className="text-xs leading-relaxed text-[#565A72]">
            {s.wbsInfoText}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-gb-textMuted"><Loader2 size={13} className="animate-spin" /> {t.loading}</div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6B7280]">{s.wbsUrlLabel}</label>
              <div className="relative">
                <Globe2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gb-textMuted pointer-events-none" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={s.wbsUrlPlaceholder}
                  className={`${inputCls} pl-8`}
                  disabled={saving || analyzing}
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-[#E5E7EB] p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
                disabled={saving || analyzing}
              />
              <span className="text-xs text-[#565A72] leading-relaxed">
                {s.wbsConsentLabel}
              </span>
            </label>

            <div className="flex items-center gap-2 text-xs">
              {settings?.websiteUrl ? (
                <span className="inline-flex items-center gap-1.5 text-[#065F46]"><CheckCircle2 size={13} /> {s.wbsConnected}</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-gb-textMuted"><XCircle size={13} /> {s.wbsNotConnected}</span>
              )}
              {settings?.lastAnalysisOn && (
                <span className="text-gb-textMuted">{fillTemplate(s.wbsLastAnalysisTemplate, { date: new Date(settings.lastAnalysisOn).toLocaleString(dateLocale) })}</span>
              )}
              {statusKey && (
                <span className="text-[#6355E4] inline-flex items-center gap-1">
                  {analyzing && <Loader2 size={11} className="animate-spin" />}
                  {STATUS_LABEL[statusKey] ?? statusKey}
                </span>
              )}
            </div>

            {error && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{error}</p>}
            {info && !error && <p className="text-xs text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] rounded-lg px-3 py-2">{info}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleCheckWebsite}
                disabled={saving || analyzing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F7F7F8] disabled:opacity-50"
              >
                <Globe2 size={13} /> {s.wbsCheckWebsite}
              </button>
              <button
                type="button"
                onClick={() => handleAnalyze(false)}
                disabled={saving || analyzing || !consent}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
              >
                {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} {s.wbsAnalyzeBranding}
              </button>
              {settings?.websiteUrl && (
                <button
                  type="button"
                  onClick={() => handleAnalyze(true)}
                  disabled={saving || analyzing || !consent}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F7F7F8] disabled:opacity-50"
                >
                  <RefreshCw size={13} /> {s.wbsReanalyze}
                </button>
              )}
              {settings?.websiteUrl && (
                <button
                  type="button"
                  onClick={handleRemoveConnection}
                  disabled={saving || analyzing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-3 py-2 text-xs font-semibold text-[#991B1B] hover:bg-[#FEE2E2] disabled:opacity-50"
                >
                  <Unlink size={13} /> {s.wbsRemoveConnection}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
