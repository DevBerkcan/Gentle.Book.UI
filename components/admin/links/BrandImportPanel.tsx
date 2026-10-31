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
    Failed: s.wbsStatusFailed,
  };
}

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
  const { t } = useTranslation();
  const s = t.admin.linksPage;
  const STATUS_LABEL = getStatusLabel(t);

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
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => { if (defaultWebsiteUrl) setUrl(defaultWebsiteUrl); }, [defaultWebsiteUrl]);

  // Ticks the "please wait" countdown down to 0 after a rate-limit response.
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = setInterval(() => setCooldownSeconds((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownSeconds]);

  function describeAnalysisError(err: any, fallback: string): string {
    if (err?.response?.status === 429) {
      const seconds = err.response.data?.retryAfterSeconds ?? 60;
      setCooldownSeconds(seconds);
      return fillTemplate(s.brandImportRateLimitedTemplate, { seconds });
    }
    if (err?.message === "timeout") return s.brandImportTimeoutError;
    return err?.response?.data?.message ?? fallback;
  }

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
    if (!url.trim()) { setError(s.brandImportUrlRequired); return; }
    if (!consent) { setError(s.brandImportConsentRequired); return; }

    setAnalyzing(true);
    setStatus("Queued");
    try {
      const jobId = await startBrandAnalysis(url.trim(), consent);
      const job = await pollBrandImportJob(jobId, (j) => setStatus(j.status));
      if (job.status === "Ready" && job.resultId) {
        await loadResult(job.resultId);
        showToast("success", s.analysisCompleteToast);
      } else {
        setError(job.errorMessageSafe ?? t.admin.settingsPage.wbsAnalysisFailedError);
      }
    } catch (err: any) {
      setError(describeAnalysisError(err, t.admin.settingsPage.wbsAnalysisStartError));
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
        showToast("success", s.analysisUpdatedToast);
      } else {
        setError(job.errorMessageSafe ?? t.admin.settingsPage.wbsAnalysisFailedError);
      }
    } catch (err: any) {
      setError(describeAnalysisError(err, s.reanalysisStartErrorToast));
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
      showToast("success", s.draftDiscardedToast);
    } catch {
      showToast("error", s.draftDiscardErrorToast);
    }
  }

  async function handleApplySection(section: ImportSection) {
    if (!result || !selectedProposal) return;

    const confirmMessage =
      section === "branding"
        ? s.brandingApplyConfirmMessage
        : section === "services"
        ? fillTemplate(selectedServiceCount === 1 ? s.servicesApplyConfirmTemplate_one : s.servicesApplyConfirmTemplate_other, { count: selectedServiceCount })
        : fillTemplate(detectedSocialLinks.length === 1 ? s.linksApplyConfirmTemplate_one : s.linksApplyConfirmTemplate_other, { count: detectedSocialLinks.length });

    const ok = await confirm({
      title: section === "branding" ? s.replaceDesignConfirmTitle : s.applyConfirmTitle,
      message: confirmMessage,
      confirmLabel: s.applyBtn,
      cancelLabel: t.cancel,
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
          ? fillTemplate(s.servicesImportedWithSkippedTemplate, { imported: response.importedServicesCount, skipped: response.skippedServicesCount })
          : fillTemplate(s.servicesImportedTemplate, { imported: response.importedServicesCount }));
      } else {
        showToast("success", s.appliedBadge);
      }

      setAppliedSections((prev) => new Set(prev).add(section));
      if (section === "branding") onPreviewOverrideChange(null);
      onApplied();
    } catch (err: any) {
      showToast("error", err?.response?.data?.message ?? s.couldNotApplyErrorToast);
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
          <p className="font-semibold text-[#111318] text-sm leading-tight">{s.brandImportTitle}</p>
          <p className="text-[11px] text-gb-textMuted leading-tight mt-0.5">{s.brandImportSubtitle}</p>
        </div>
      </div>

      {!result && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.admin.settingsPage.wbsUrlPlaceholder}
              className={inputCls}
              disabled={analyzing}
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || cooldownSeconds > 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
            >
              {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {cooldownSeconds > 0 ? fillTemplate(s.brandImportCooldownBtnTemplate, { seconds: cooldownSeconds }) : t.admin.settingsPage.wbsCheckWebsite}
            </button>
          </div>

          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" disabled={analyzing} />
            <span className="text-[11px] text-[#565A72] leading-relaxed">
              {t.admin.settingsPage.wbsConsentLabel}
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
              {s.detectedLabel} <span className="text-[#111318]">{result.websiteTitle ?? "Website"}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={handleReanalyze} disabled={analyzing || cooldownSeconds > 0}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7280] hover:text-[#111318] px-2 py-1 rounded-lg hover:bg-[#F3F4F6] disabled:opacity-50">
                <RefreshCw size={11} className={analyzing ? "animate-spin" : ""} /> {cooldownSeconds > 0 ? fillTemplate(s.brandImportCooldownBtnTemplate, { seconds: cooldownSeconds }) : s.reanalyzeBtn}
              </button>
              <button type="button" onClick={handleDiscard} disabled={analyzing}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#991B1B] hover:bg-[#FEE2E2] px-2 py-1 rounded-lg disabled:opacity-50">
                <Trash2 size={11} /> {s.discardBtn}
              </button>
            </div>
          </div>

          {/* ── Erkannte Marke ── */}
          {result.detectedData && (
            <div className="rounded-xl bg-[#F7F7F8] p-3 space-y-2">
              <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">{s.detectedBrandLabel}</p>
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
                  {s.noteLabel} {result.detectedData.warnings.includes("no_colors_detected") && `${s.noColorsDetected} `}
                  {result.detectedData.warnings.includes("no_logo_detected") && `${s.noLogoDetected} `}
                  {result.detectedData.warnings.includes("no_fonts_detected") && `${s.noFontsDetected} `}
                </p>
              )}
            </div>
          )}

          {/* ── Designvorschläge ── */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">{s.designSuggestionsLabel}</p>
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
                  <p className="text-[10px] text-gb-textMuted leading-snug mt-0.5">{p.reason}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ══════════ Bereich 1: Branding ══════════ */}
          <div className="rounded-xl border border-[#E5E7EB] p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Palette size={14} className="text-[#6355E4]" />
              <p className="text-xs font-semibold text-[#111318]">{s.brandingSectionTitle}</p>
              {appliedSections.has("branding") && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded-md ml-auto">
                  <Check size={10} /> {s.appliedBadge}
                </span>
              )}
            </div>

            {logoCandidates.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-gb-textMuted uppercase tracking-wide">{s.logoCandidatesLabel}</p>
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
                      <img src={asset.sourceUrl} alt={s.logoCandidateAlt} className="max-w-full max-h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {([
                ["logo", s.applyLogoLabel, logoCandidates.length > 0],
                ["colors", s.applyColorsLabel, true],
                ["typography", s.applyTypographyLabel, true],
                ["description", s.applyDescriptionLabel, !!result.detectedData?.content.description],
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
                {result.detectedData.content.phone && <p>{s.phoneLabel} {result.detectedData.content.phone}</p>}
                {result.detectedData.content.email && <p>{s.emailLabel} {result.detectedData.content.email}</p>}
                {result.detectedData.content.address && <p>{s.addressLabel} {result.detectedData.content.address}</p>}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleApplySection("branding")}
                disabled={applyingSection !== null || !selectedProposal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
              >
                {applyingSection === "branding" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} {s.applyBrandingBtn}
              </button>
            </div>
          </div>

          {/* ══════════ Bereich 2: Services ══════════ */}
          <div className="rounded-xl border border-[#E5E7EB] p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-[#6355E4]" />
              <p className="text-xs font-semibold text-[#111318]">{s.servicesSectionTitle}</p>
              {appliedSections.has("services") && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded-md ml-auto">
                  <Check size={10} /> {s.appliedBadge}
                </span>
              )}
            </div>

            {detectedServices.length === 0 ? (
              <p className="text-[11px] text-gb-textMuted">{s.noServicesDetected}</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-gb-textMuted uppercase tracking-wide">{fillTemplate(s.selectedOfTotalTemplate, { selected: selectedServiceCount, total: detectedServices.length })}</p>
                  <button
                    type="button"
                    onClick={() => setDeselectedServiceNames((prev) => prev.size === 0 ? new Set(detectedServices.map((svc) => svc.name)) : new Set())}
                    className="text-[10px] font-medium text-[#6355E4] hover:underline"
                  >
                    {deselectedServiceNames.size === 0 ? s.deselectAllBtn : s.selectAllBtn}
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5 rounded-lg border border-[#F3F4F6]">
                  {detectedServices.map((svc) => {
                    const price = formatPrice(svc.priceAmount, svc.currency);
                    const checked = !deselectedServiceNames.has(svc.name);
                    return (
                      <label key={svc.name} className="flex items-center gap-2 text-xs text-[#374151] px-2 py-1.5 hover:bg-[#F7F7F8]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setDeselectedServiceNames((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.delete(svc.name); else next.add(svc.name);
                            return next;
                          })}
                        />
                        <span className="flex-1 truncate">{svc.name}</span>
                        {price && <span className="text-gb-textMuted flex-shrink-0">{price}</span>}
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
                    {applyingSection === "services" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} {s.applyServicesBtn}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ══════════ Bereich 3: Links ══════════ */}
          <div className="rounded-xl border border-[#E5E7EB] p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-[#6355E4]" />
              <p className="text-xs font-semibold text-[#111318]">{s.linksSectionTitle}</p>
              {appliedSections.has("links") && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#15803D] bg-[#DCFCE7] px-1.5 py-0.5 rounded-md ml-auto">
                  <Check size={10} /> {s.appliedBadge}
                </span>
              )}
            </div>

            {detectedSocialLinks.length === 0 ? (
              <p className="text-[11px] text-gb-textMuted">{s.noSocialLinksDetected}</p>
            ) : (
              <>
                <div className="space-y-1">
                  {detectedSocialLinks.map((link) => (
                    <p key={link} className="text-[11px] text-[#374151] truncate flex items-center gap-1.5">
                      <ExternalLink size={10} className="text-gb-textMuted flex-shrink-0" /> {link}
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
                    {applyingSection === "links" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} {s.applyLinksBtn}
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
