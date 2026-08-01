// components/admin/links/BrandImportPanel.tsx
// "Branding aus Website übernehmen" — the /admin/links half of the AI Brand Import feature
// (spec section 2B). Lets the admin trigger an analysis, review what was detected, choose one
// of (at least) three proposals, pick individual fields to apply, preview it live via the
// existing LivePreviewPanel/MobilePreviewModal (through a postMessage override — nothing here
// is persisted until "Entwurf anwenden" is confirmed), and finally apply it.
"use client";

import { useEffect, useState } from "react";
import {
  Sparkles, Loader2, CheckCircle2, XCircle, RefreshCw, Trash2, ExternalLink, ImageIcon,
} from "lucide-react";
import {
  startBrandAnalysis, pollBrandImportJob, getBrandImportResult, applyBrandProposal,
  discardBrandImportResult, reanalyzeBrandImport,
  type BrandImportResult, type BrandThemeProposal,
} from "@/lib/api/brandImport";
import { useConfirm } from "@/components/ConfirmDialog";
import type { BrandPreviewOverride } from "./types";

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

const STATUS_LABEL: Record<string, string> = {
  Queued: "Warteschlange…",
  Fetching: "Website wird geprüft…",
  Extracting: "Inhalte werden geladen…",
  Analyzing: "Branding wird analysiert…",
  Ready: "Analyse abgeschlossen",
  Failed: "Analyse fehlgeschlagen",
};

interface SelectedFields {
  logo: boolean;
  colors: boolean;
  typography: boolean;
  description: boolean;
  socialLinks: boolean;
}

function proposalToOverride(proposal: BrandThemeProposal, fields: SelectedFields, logoUrl?: string | null): BrandPreviewOverride {
  return {
    ...(fields.colors ? { primaryColor: proposal.theme.primary, secondaryColor: proposal.theme.secondary, accentColor: proposal.theme.accent } : {}),
    pageTemplate: proposal.templateId,
    buttonStyle: proposal.theme.buttonStyle,
    cardStyle: proposal.theme.cardStyle,
    animationSpeed: proposal.theme.animationSpeed,
    ...(fields.typography ? { fontFamily: proposal.theme.headingFontKey } : {}),
    ...(fields.logo && logoUrl ? { logoUrl } : {}),
  };
}

export function BrandImportPanel({
  defaultWebsiteUrl,
  onPreviewOverrideChange,
  onApplied,
  showToast,
}: {
  defaultWebsiteUrl?: string | null;
  onPreviewOverrideChange: (override: BrandPreviewOverride | null) => void;
  onApplied: () => void;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const { confirm, dialog } = useConfirm();

  const [url, setUrl] = useState(defaultWebsiteUrl ?? "");
  const [consent, setConsent] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrandImportResult | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedLogoAssetId, setSelectedLogoAssetId] = useState<string | null>(null);
  const [fields, setFields] = useState<SelectedFields>({
    logo: true, colors: true, typography: true, description: false, socialLinks: false,
  });
  const [applying, setApplying] = useState(false);

  useEffect(() => { if (defaultWebsiteUrl) setUrl(defaultWebsiteUrl); }, [defaultWebsiteUrl]);

  const selectedProposal = result?.proposals.find((p) => p.id === selectedProposalId) ?? null;
  const logoCandidates = result?.assets.filter((a) => a.assetType === "Logo") ?? [];

  // Keep the live preview in sync with the currently selected proposal + checked fields.
  useEffect(() => {
    if (!selectedProposal) { onPreviewOverrideChange(null); return; }
    const logoUrl = fields.logo ? logoCandidates.find((a) => a.id === selectedLogoAssetId)?.sourceUrl : undefined;
    onPreviewOverrideChange(proposalToOverride(selectedProposal, fields, logoUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProposal, fields, selectedLogoAssetId]);

  async function loadResult(resultId: string) {
    const data = await getBrandImportResult(resultId);
    setResult(data);
    setSelectedProposalId(data.proposals[0]?.id ?? null);
    const firstLogo = data.assets.find((a) => a.assetType === "Logo");
    setSelectedLogoAssetId(firstLogo?.id ?? null);
  }

  async function handleAnalyze() {
    setError(null);
    if (!url.trim()) { setError("Bitte gib eine Website-Adresse ein."); return; }
    if (!consent) { setError("Bitte bestätige, dass du berechtigt bist, diese Website zu verwenden."); return; }

    setAnalyzing(true);
    setStatus("Queued");
    try {
      const jobId = await startBrandAnalysis(url.trim(), consent);
      const job = await pollBrandImportJob(jobId, (j) => setStatus(j.status));
      if (job.status === "Ready" && job.resultId) {
        await loadResult(job.resultId);
        showToast("success", "Analyse abgeschlossen");
      } else {
        setError(job.errorMessageSafe ?? "Die Analyse ist fehlgeschlagen.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Die Analyse konnte nicht gestartet werden.");
    } finally {
      setAnalyzing(false);
      setStatus(null);
    }
  }

  async function handleReanalyze() {
    if (!result) return;
    setAnalyzing(true);
    setStatus("Queued");
    setError(null);
    try {
      const jobId = await reanalyzeBrandImport(result.id);
      const job = await pollBrandImportJob(jobId, (j) => setStatus(j.status));
      if (job.status === "Ready" && job.resultId) {
        await loadResult(job.resultId);
        showToast("success", "Analyse aktualisiert");
      } else {
        setError(job.errorMessageSafe ?? "Die Analyse ist fehlgeschlagen.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Die erneute Analyse konnte nicht gestartet werden.");
    } finally {
      setAnalyzing(false);
      setStatus(null);
    }
  }

  async function handleDiscard() {
    if (!result) return;
    try {
      await discardBrandImportResult(result.id);
      setResult(null);
      setSelectedProposalId(null);
      onPreviewOverrideChange(null);
      showToast("success", "Entwurf verworfen");
    } catch {
      showToast("error", "Entwurf konnte nicht verworfen werden");
    }
  }

  async function handleApplyClick() {
    if (!result || !selectedProposal) return;
    const ok = await confirm({
      title: "Aktuelles Design ersetzen?",
      message: "Die ausgewählten Branding-Werte werden auf deine Buchungsseite angewendet. Deine Services, Mitarbeiter, Links und Buchungen bleiben erhalten.",
      confirmLabel: "Entwurf anwenden",
      cancelLabel: "Abbrechen",
      variant: "info",
    });
    if (!ok) return;

    setApplying(true);
    try {
      await applyBrandProposal(result.id, {
        proposalId: selectedProposal.id,
        applyLogo: fields.logo,
        applyColors: fields.colors,
        applyTypography: fields.typography,
        applyDescription: fields.description,
        applySocialLinks: fields.socialLinks,
        selectedLogoAssetId: fields.logo ? selectedLogoAssetId : null,
      });
      showToast("success", "Branding-Entwurf angewendet");
      onPreviewOverrideChange(null);
      onApplied();
      setResult(null);
    } catch (err: any) {
      showToast("error", err?.response?.data?.message ?? "Der Entwurf konnte nicht angewendet werden");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#E5E7EB] p-4 space-y-4">
      {dialog}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#6355E4] flex items-center justify-center flex-shrink-0">
          <Sparkles size={13} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">Branding aus Website übernehmen</p>
          <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Analysiert deine bestehende Website und schlägt ein passendes Design vor</p>
        </div>
      </div>

      {!result && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ihr-unternehmen.de"
              className={inputCls}
              disabled={analyzing}
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
            >
              {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Website analysieren
            </button>
          </div>

          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" disabled={analyzing} />
            <span className="text-[11px] text-[#565A72] leading-relaxed">
              Ich bestätige, dass ich berechtigt bin, die Inhalte und das Branding dieser Website für mein Unternehmen zu verwenden.
            </span>
          </label>

          {status && (
            <p className="text-xs text-[#6355E4] inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> {STATUS_LABEL[status] ?? status}</p>
          )}
          {error && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{error}</p>}
        </>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#374151]">
              Erkannt: <span className="text-[#111318]">{result.websiteTitle ?? "Website"}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={handleReanalyze} disabled={analyzing}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7280] hover:text-[#111318] px-2 py-1 rounded-lg hover:bg-[#F3F4F6] disabled:opacity-50">
                <RefreshCw size={11} className={analyzing ? "animate-spin" : ""} /> Erneut analysieren
              </button>
              <button type="button" onClick={handleDiscard} disabled={analyzing}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#991B1B] hover:bg-[#FEE2E2] px-2 py-1 rounded-lg disabled:opacity-50">
                <Trash2 size={11} /> Verwerfen
              </button>
            </div>
          </div>

          {/* ── Erkannte Marke ── */}
          {result.detectedData && (
            <div className="rounded-xl bg-[#F7F7F8] p-3 space-y-2">
              <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Erkannte Marke</p>
              <div className="flex flex-wrap items-center gap-2">
                {result.detectedData.colors.slice(0, 6).map((c) => (
                  <span key={c} className="w-6 h-6 rounded-full border border-[#E5E7EB]" style={{ backgroundColor: c }} title={c} />
                ))}
                {result.detectedData.fonts.slice(0, 2).map((f) => (
                  <span key={f} className="text-[10px] px-2 py-1 rounded-md bg-white border border-[#E5E7EB] text-[#374151]">{f}</span>
                ))}
                {result.brandStyle && (
                  <span className="text-[10px] px-2 py-1 rounded-md bg-white border border-[#E5E7EB] text-[#374151]">{result.brandStyle}</span>
                )}
              </div>
              {result.detectedData.warnings.length > 0 && (
                <p className="text-[10px] text-[#92400E]">
                  Hinweis: {result.detectedData.warnings.includes("no_colors_detected") && "Keine eindeutigen Farben erkannt. "}
                  {result.detectedData.warnings.includes("no_logo_detected") && "Kein Logo erkannt. "}
                  {result.detectedData.warnings.includes("no_fonts_detected") && "Keine Schriftart erkannt. "}
                </p>
              )}
            </div>
          )}

          {/* ── Designvorschläge ── */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Designvorschläge</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {result.proposals.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProposalId(p.id)}
                  className={`text-left rounded-xl border p-2.5 transition-all ${
                    selectedProposalId === p.id ? "border-[#6355E4] bg-[#F8F7FF] ring-2 ring-[#6355E4]/20" : "border-[#E5E7EB] hover:bg-[#F7F7F8]"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="w-4 h-4 rounded-full border border-[#E5E7EB]" style={{ backgroundColor: p.theme.primary }} />
                    <span className="w-4 h-4 rounded-full border border-[#E5E7EB]" style={{ backgroundColor: p.theme.secondary }} />
                    <span className="w-4 h-4 rounded-full border border-[#E5E7EB]" style={{ backgroundColor: p.theme.accent }} />
                  </div>
                  <p className="text-xs font-semibold text-[#111318]">{p.name}</p>
                  <p className="text-[10px] text-[#9CA3AF] leading-snug mt-0.5">{p.reason}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Logo-Kandidaten ── */}
          {logoCandidates.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Logo-Kandidaten</p>
              <div className="flex flex-wrap gap-2">
                {logoCandidates.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedLogoAssetId(asset.id)}
                    className={`w-14 h-14 rounded-lg border flex items-center justify-center overflow-hidden bg-white ${
                      selectedLogoAssetId === asset.id ? "border-[#6355E4] ring-2 ring-[#6355E4]/20" : "border-[#E5E7EB]"
                    }`}
                    title={asset.discoveryHint ?? undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.sourceUrl} alt="Logo-Kandidat" className="max-w-full max-h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Auswahl der Bestandteile ── */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Was soll übernommen werden?</p>
            {([
              ["logo", "Logo übernehmen", logoCandidates.length > 0],
              ["colors", "Markenfarben übernehmen", true],
              ["typography", "Typografie übernehmen", true],
              ["description", "Unternehmensbeschreibung übernehmen", !!result.detectedData?.content.description],
              ["socialLinks", "Social-Media-Links übernehmen", (result.detectedData?.content.socialLinks.length ?? 0) > 0],
            ] as [keyof SelectedFields, string, boolean][]).map(([key, label, available]) => (
              <label key={key} className={`flex items-center gap-2 text-xs ${available ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
                <input
                  type="checkbox"
                  checked={fields[key]}
                  disabled={!available}
                  onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>

          {result.detectedData?.content && (
            <div className="rounded-xl bg-[#F7F7F8] p-3 space-y-1 text-[11px] text-[#565A72]">
              <p className="font-semibold text-[#6B7280] uppercase tracking-wide text-[10px] mb-1">Erkannte Inhalte (nur zur Ansicht)</p>
              {result.detectedData.content.phone && <p>Telefon: {result.detectedData.content.phone}</p>}
              {result.detectedData.content.email && <p>E-Mail: {result.detectedData.content.email}</p>}
              {result.detectedData.content.address && <p>Adresse: {result.detectedData.content.address}</p>}
              {result.detectedData.content.openingHours && <p>Öffnungszeiten: {result.detectedData.content.openingHours}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleApplyClick}
              disabled={applying || !selectedProposal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
            >
              {applying ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Entwurf anwenden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
