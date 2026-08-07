// components/admin/links/BrandImportPanel.tsx
// "Branding aus Website übernehmen" — the /admin/links half of the AI Brand Import feature
// (spec section 2B). Lets the admin trigger an analysis, review what was detected, choose one
// of (at least) three proposals, then independently confirm each of three areas — Branding,
// Services, Links — via its own "Übernehmen" button. Only the Branding area feeds the live
// preview (colors/typography/logo are the only "look" attributes); Services/Links are additive
// and never touch existing data. Nothing is persisted until a section's button is confirmed.
"use client";

import { useEffect, useState } from "react";
import {
  Sparkles, Loader2, CheckCircle2, XCircle, RefreshCw, Trash2, ExternalLink, ImageIcon,
  Palette, Briefcase, Link2, Check,
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

type ImportSection = "branding" | "services" | "links";

interface BrandingFields {
  logo: boolean;
  colors: boolean;
  typography: boolean;
  description: boolean;
}

function proposalToOverride(proposal: BrandThemeProposal, fields: BrandingFields, logoUrl?: string | null): BrandPreviewOverride {
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

function formatPrice(amount: number | null, currency: string | null): string | null {
  if (amount == null) return null;
  return `${amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} ${currency ?? ""}`.trim();
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
  const [brandingFields, setBrandingFields] = useState<BrandingFields>({
    logo: true, colors: true, typography: true, description: false,
  });
  const [deselectedServiceNames, setDeselectedServiceNames] = useState<Set<string>>(new Set());
  const [applyingSection, setApplyingSection] = useState<ImportSection | null>(null);
  const [appliedSections, setAppliedSections] = useState<Set<ImportSection>>(new Set());

  useEffect(() => { if (defaultWebsiteUrl) setUrl(defaultWebsiteUrl); }, [defaultWebsiteUrl]);

  const selectedProposal = result?.proposals.find((p) => p.id === selectedProposalId) ?? null;
  const logoCandidates = result?.assets.filter((a) => a.assetType === "Logo") ?? [];
  const detectedServices = result?.detectedData?.content.services ?? [];
  const detectedSocialLinks = result?.detectedData?.content.socialLinks ?? [];
  const selectedServiceCount = detectedServices.length - deselectedServiceNames.size;

  // Only Branding (colors/typography/logo) drives the live preview — Services/Links don't affect "look".
  useEffect(() => {
    if (!selectedProposal) { onPreviewOverrideChange(null); return; }
    const logoUrl = brandingFields.logo ? logoCandidates.find((a) => a.id === selectedLogoAssetId)?.sourceUrl : undefined;
    onPreviewOverrideChange(proposalToOverride(selectedProposal, brandingFields, logoUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProposal, brandingFields, selectedLogoAssetId]);

  async function loadResult(resultId: string) {
    const data = await getBrandImportResult(resultId);
    setResult(data);
    setSelectedProposalId(data.proposals[0]?.id ?? null);
    const firstLogo = data.assets.find((a) => a.assetType === "Logo");
    setSelectedLogoAssetId(firstLogo?.id ?? null);
    setDeselectedServiceNames(new Set());
    setAppliedSections(new Set());
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

  async function handleApplySection(section: ImportSection) {
    if (!result || !selectedProposal) return;

    const confirmMessage =
      section === "branding"
        ? "Die ausgewählten Branding-Werte werden auf deine Buchungsseite angewendet. Deine Services, Mitarbeiter, Links und Buchungen bleiben erhalten."
        : section === "services"
        ? `${selectedServiceCount} erkannte Leistung${selectedServiceCount === 1 ? "" : "en"} werden zu deinen Services hinzugefügt. Bestehende Services bleiben unverändert.`
        : `${detectedSocialLinks.length} erkannte Link${detectedSocialLinks.length === 1 ? "" : "s"} werden zu deinen Links hinzugefügt. Bestehende Links bleiben unverändert.`;

    const ok = await confirm({
      title: section === "branding" ? "Aktuelles Design ersetzen?" : "Übernehmen?",
      message: confirmMessage,
      confirmLabel: "Übernehmen",
      cancelLabel: "Abbrechen",
      variant: "info",
    });
    if (!ok) return;

    setApplyingSection(section);
    try {
      const base = {
        proposalId: selectedProposal.id,
        applyLogo: false, applyColors: false, applyTypography: false, applyDescription: false,
        applySocialLinks: false, selectedLogoAssetId: null as string | null,
        applyServices: false, selectedServiceNames: null as string[] | null,
      };

      const payload =
        section === "branding"
          ? {
              ...base,
              applyLogo: brandingFields.logo, applyColors: brandingFields.colors,
              applyTypography: brandingFields.typography, applyDescription: brandingFields.description,
              selectedLogoAssetId: brandingFields.logo ? selectedLogoAssetId : null,
            }
          : section === "links"
          ? { ...base, applySocialLinks: true }
          : {
              ...base,
              applyServices: true,
              selectedServiceNames: deselectedServiceNames.size === 0
                ? null
                : detectedServices.map((s) => s.name).filter((n) => !deselectedServiceNames.has(n)),
            };

      const response = await applyBrandProposal(result.id, payload);

      if (section === "services") {
        showToast("success", response.skippedServicesCount > 0
          ? `${response.importedServicesCount} Leistungen importiert, ${response.skippedServicesCount} wegen Plan-Limit übersprungen.`
          : `${response.importedServicesCount} Leistungen importiert.`);
      } else {
        showToast("success", "Übernommen");
      }

      setAppliedSections((prev) => new Set(prev).add(section));
      if (section === "branding") onPreviewOverrideChange(null);
      onApplied();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message ?? "Konnte nicht übernommen werden");
    } finally {
      setApplyingSection(null);
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
          <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Analysiert deine bestehende Website und schlägt Branding, Services und Links vor</p>
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

          {/* ══════════ Bereich 1: Branding ══════════ */}
          <div className="rounded-xl border border-[#E5E7EB] p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Palette size={14} className="text-[#6355E4]" />
              <p className="text-xs font-semibold text-[#111318]">Branding</p>
              {appliedSections.has("branding") && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded-md ml-auto">
                  <Check size={10} /> Übernommen
                </span>
              )}
            </div>

            {logoCandidates.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Logo-Kandidaten</p>
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

            <div className="space-y-1.5">
              {([
                ["logo", "Logo übernehmen", logoCandidates.length > 0],
                ["colors", "Markenfarben übernehmen", true],
                ["typography", "Typografie übernehmen", true],
                ["description", "Unternehmensbeschreibung übernehmen", !!result.detectedData?.content.description],
              ] as [keyof BrandingFields, string, boolean][]).map(([key, label, available]) => (
                <label key={key} className={`flex items-center gap-2 text-xs ${available ? "text-[#374151]" : "text-[#D1D5DB]"}`}>
                  <input
                    type="checkbox"
                    checked={brandingFields[key]}
                    disabled={!available}
                    onChange={(e) => setBrandingFields((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>

            {result.detectedData?.content && (result.detectedData.content.phone || result.detectedData.content.email || result.detectedData.content.address) && (
              <div className="rounded-lg bg-[#F7F7F8] p-2.5 space-y-0.5 text-[11px] text-[#565A72]">
                {result.detectedData.content.phone && <p>Telefon: {result.detectedData.content.phone}</p>}
                {result.detectedData.content.email && <p>E-Mail: {result.detectedData.content.email}</p>}
                {result.detectedData.content.address && <p>Adresse: {result.detectedData.content.address}</p>}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleApplySection("branding")}
                disabled={applyingSection !== null || !selectedProposal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
              >
                {applyingSection === "branding" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Branding übernehmen
              </button>
            </div>
          </div>

          {/* ══════════ Bereich 2: Services ══════════ */}
          <div className="rounded-xl border border-[#E5E7EB] p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-[#6355E4]" />
              <p className="text-xs font-semibold text-[#111318]">Services</p>
              {appliedSections.has("services") && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded-md ml-auto">
                  <Check size={10} /> Übernommen
                </span>
              )}
            </div>

            {detectedServices.length === 0 ? (
              <p className="text-[11px] text-[#9CA3AF]">Auf der Website wurden keine buchbaren Leistungen erkannt.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{selectedServiceCount} von {detectedServices.length} ausgewählt</p>
                  <button
                    type="button"
                    onClick={() => setDeselectedServiceNames((prev) => prev.size === 0 ? new Set(detectedServices.map((s) => s.name)) : new Set())}
                    className="text-[10px] font-medium text-[#6355E4] hover:underline"
                  >
                    {deselectedServiceNames.size === 0 ? "Alle abwählen" : "Alle auswählen"}
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5 rounded-lg border border-[#F3F4F6]">
                  {detectedServices.map((s) => {
                    const price = formatPrice(s.priceAmount, s.currency);
                    const checked = !deselectedServiceNames.has(s.name);
                    return (
                      <label key={s.name} className="flex items-center gap-2 text-xs text-[#374151] px-2 py-1.5 hover:bg-[#F7F7F8]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setDeselectedServiceNames((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.delete(s.name); else next.add(s.name);
                            return next;
                          })}
                        />
                        <span className="flex-1 truncate">{s.name}</span>
                        {price && <span className="text-[#9CA3AF] flex-shrink-0">{price}</span>}
                      </label>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleApplySection("services")}
                    disabled={applyingSection !== null || !selectedProposal || selectedServiceCount === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
                  >
                    {applyingSection === "services" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Services übernehmen
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ══════════ Bereich 3: Links ══════════ */}
          <div className="rounded-xl border border-[#E5E7EB] p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-[#6355E4]" />
              <p className="text-xs font-semibold text-[#111318]">Links</p>
              {appliedSections.has("links") && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded-md ml-auto">
                  <Check size={10} /> Übernommen
                </span>
              )}
            </div>

            {detectedSocialLinks.length === 0 ? (
              <p className="text-[11px] text-[#9CA3AF]">Auf der Website wurden keine Social-Media-Links erkannt.</p>
            ) : (
              <>
                <div className="space-y-1">
                  {detectedSocialLinks.map((link) => (
                    <p key={link} className="text-[11px] text-[#374151] truncate flex items-center gap-1.5">
                      <ExternalLink size={10} className="text-[#9CA3AF] flex-shrink-0" /> {link}
                    </p>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleApplySection("links")}
                    disabled={applyingSection !== null || !selectedProposal}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
                  >
                    {applyingSection === "links" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Links übernehmen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
