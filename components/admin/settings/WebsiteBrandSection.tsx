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

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

const STATUS_LABEL: Record<string, string> = {
  Queued: "Warteschlange…",
  Fetching: "Website wird geprüft…",
  Extracting: "Inhalte werden geladen…",
  Analyzing: "Branding wird analysiert…",
  Ready: "Analyse abgeschlossen",
  Applied: "Zuletzt angewendet",
  Failed: "Analyse fehlgeschlagen",
  Archived: "Verworfen",
};

export function WebsiteBrandSection() {
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
    if (!urlInput.trim()) { setError("Bitte gib eine Website-Adresse ein."); return; }
    setSaving(true);
    try {
      await updateBrandImportSettings({ websiteUrl: urlInput.trim(), consentConfirmed: consent });
      setInfo("Website-Adresse gespeichert.");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Die Website-Adresse konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze(isReanalysis: boolean) {
    setError(null);
    setInfo(null);
    if (!urlInput.trim()) { setError("Bitte gib zuerst eine Website-Adresse ein."); return; }
    if (!consent) { setError("Bitte bestätige zuerst, dass du berechtigt bist, diese Website zu verwenden."); return; }

    setAnalyzing(true);
    setLiveStatus("Queued");
    try {
      const jobId = await startBrandAnalysis(urlInput.trim(), consent);
      const finalJob = await pollBrandImportJob(jobId, (job) => setLiveStatus(job.status));
      if (finalJob.status === "Ready") {
        setInfo("Analyse abgeschlossen. Öffne „Seitendesign“ unter „Meine Links“, um die Vorschläge anzusehen.");
      } else {
        setError(finalJob.errorMessageSafe ?? "Die Analyse ist fehlgeschlagen.");
      }
      await load();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 402) {
        setError(err?.response?.data?.message ?? "Dieses Feature ist in deinem Tarif nicht verfügbar.");
      } else {
        setError(err?.response?.data?.message ?? "Die Analyse konnte nicht gestartet werden.");
      }
    } finally {
      setAnalyzing(false);
      setLiveStatus(null);
      void isReanalysis;
    }
  }

  async function handleRemoveConnection() {
    if (!confirm("Verbindung zur Website wirklich entfernen? Bereits erstellte Entwürfe bleiben erhalten.")) return;
    setSaving(true);
    try {
      await removeBrandImportConnection();
      setUrlInput("");
      setConsent(false);
      setInfo("Verbindung entfernt.");
      await load();
    } catch {
      setError("Die Verbindung konnte nicht entfernt werden.");
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
          <p className="font-semibold text-[#111318] text-sm leading-tight">Unternehmenswebsite</p>
          <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Branding automatisch aus deiner bestehenden Website ableiten</p>
        </div>
      </div>

      <div className="px-1 space-y-4">
        <div className="rounded-xl border border-[#C7D2FE] bg-[#F8F7FF] p-3.5">
          <p className="text-xs leading-relaxed text-[#565A72]">
            Trage die Website deines Unternehmens ein. GentleBook kann daraus Farben, Logo, Typografie und
            weitere Branding-Merkmale erkennen und einen passenden Entwurf für deine Buchungsseite erstellen.
            Die Website wird dabei nicht kopiert — nur als Inspirationsquelle genutzt, und jeder Entwurf muss
            von dir bestätigt werden, bevor er sichtbar wird.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF]"><Loader2 size={13} className="animate-spin" /> Lade…</div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6B7280]">Website-URL</label>
              <div className="relative">
                <Globe2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://ihr-unternehmen.de"
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
                Ich bestätige, dass ich berechtigt bin, die Inhalte und das Branding dieser Website für mein
                Unternehmen zu verwenden.
              </span>
            </label>

            <div className="flex items-center gap-2 text-xs">
              {settings?.websiteUrl ? (
                <span className="inline-flex items-center gap-1.5 text-[#065F46]"><CheckCircle2 size={13} /> Verbunden</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#9CA3AF]"><XCircle size={13} /> Nicht verbunden</span>
              )}
              {settings?.lastAnalysisOn && (
                <span className="text-[#9CA3AF]">· Letzte Analyse: {new Date(settings.lastAnalysisOn).toLocaleString("de-DE")}</span>
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
                <Globe2 size={13} /> Website prüfen
              </button>
              <button
                type="button"
                onClick={() => handleAnalyze(false)}
                disabled={saving || analyzing || !consent}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
              >
                {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Branding analysieren
              </button>
              {settings?.websiteUrl && (
                <button
                  type="button"
                  onClick={() => handleAnalyze(true)}
                  disabled={saving || analyzing || !consent}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F7F7F8] disabled:opacity-50"
                >
                  <RefreshCw size={13} /> Analyse erneut durchführen
                </button>
              )}
              {settings?.websiteUrl && (
                <button
                  type="button"
                  onClick={handleRemoveConnection}
                  disabled={saving || analyzing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-3 py-2 text-xs font-semibold text-[#991B1B] hover:bg-[#FEE2E2] disabled:opacity-50"
                >
                  <Unlink size={13} /> Verbindung entfernen
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
