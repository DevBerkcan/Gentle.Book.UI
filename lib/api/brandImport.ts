// lib/api/brandImport.ts
// Typed API client for the "AI Brand Import" feature (api/admin/brand-import/*).
// The Next.js frontend never fetches the external website itself — every network call here
// only ever talks to the GentleBook API, which performs the SSRF-safe fetch/analysis server-side.
import api from "@/lib/api/client";

export type BrandImportJobStatus =
  | "Queued" | "Fetching" | "Extracting" | "Analyzing" | "Ready" | "Applied" | "Failed" | "Archived";

export interface BrandImportSettings {
  websiteUrl: string | null;
  isConsentConfirmed: boolean;
  consentConfirmedAt: string | null;
  lastAnalysisOn: string | null;
  lastAnalysisStatus: string | null;
}

export interface BrandImportJobStatusDto {
  id: string;
  status: BrandImportJobStatus;
  errorCode: string | null;
  errorMessageSafe: string | null;
  startedOn: string | null;
  completedOn: string | null;
  resultId: string | null;
}

export interface BrandTheme {
  background: string;
  surface: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  headingFontKey: string;
  bodyFontKey: string;
  cardRadiusPx: string;
  buttonRadiusPx: string;
  buttonStyle: "rounded" | "pill" | "square";
  cardStyle: "filled" | "outlined" | "gradient" | "ghost";
  animationSpeed: "none" | "slow" | "normal" | "fast";
  templateId: string;
}

export interface BrandContent {
  description: string | null;
  heading: string | null;
  callToAction: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  openingHours: string | null;
  socialLinks: string[];
  services: string[];
}

export interface BrandThemeProposal {
  id: string;
  proposalKey: string;
  name: string;
  reason: string;
  templateId: string;
  theme: BrandTheme;
  content: BrandContent;
  isSelected: boolean;
  isApplied: boolean;
}

export interface BrandAssetCandidate {
  id: string;
  assetType: "Logo" | "Favicon" | "OgImage" | "HeaderImage";
  sourceUrl: string;
  discoveryHint: string | null;
  width: number | null;
  height: number | null;
  isSelected: boolean;
}

export interface BrandImportResult {
  id: string;
  jobId: string;
  websiteTitle: string | null;
  brandStyle: string | null;
  confidence: number;
  detectedData: {
    colors: string[];
    themeColorMeta: string | null;
    fonts: string[];
    componentStyle: Record<string, unknown>;
    content: BrandContent;
    faviconUrl: string | null;
    warnings: string[];
  } | null;
  proposals: BrandThemeProposal[];
  assets: BrandAssetCandidate[];
  createdOn: string;
  appliedOn: string | null;
}

function unwrap<T>(res: { data: { data?: T } | T }): T {
  const body = res.data as { data?: T };
  return body && typeof body === "object" && "data" in body ? (body.data as T) : (res.data as T);
}

export async function getBrandImportSettings(): Promise<BrandImportSettings | null> {
  const res = await api.get("/admin/brand-import/settings");
  return unwrap<BrandImportSettings | null>(res);
}

export async function updateBrandImportSettings(payload: { websiteUrl?: string; consentConfirmed?: boolean }): Promise<void> {
  await api.put("/admin/brand-import/settings", payload);
}

export async function removeBrandImportConnection(): Promise<void> {
  await api.delete("/admin/brand-import/settings/connection");
}

export async function startBrandAnalysis(websiteUrl: string, confirmConsent: boolean): Promise<string> {
  const res = await api.post("/admin/brand-import/analyze", { websiteUrl, confirmConsent });
  return res.data.jobId as string;
}

export async function reanalyzeBrandImport(resultId: string): Promise<string> {
  const res = await api.post(`/admin/brand-import/results/${resultId}/reanalyze`);
  return res.data.jobId as string;
}

export async function getBrandImportJob(jobId: string): Promise<BrandImportJobStatusDto> {
  const res = await api.get(`/admin/brand-import/jobs/${jobId}`);
  return unwrap<BrandImportJobStatusDto>(res);
}

export async function getBrandImportResult(resultId: string): Promise<BrandImportResult> {
  const res = await api.get(`/admin/brand-import/results/${resultId}`);
  return unwrap<BrandImportResult>(res);
}

export async function discardBrandImportResult(resultId: string): Promise<void> {
  await api.delete(`/admin/brand-import/results/${resultId}`);
}

export interface ApplyBrandProposalOptions {
  proposalId: string;
  applyLogo: boolean;
  applyColors: boolean;
  applyTypography: boolean;
  applyDescription: boolean;
  applySocialLinks: boolean;
  selectedLogoAssetId?: string | null;
}

export async function applyBrandProposal(resultId: string, options: ApplyBrandProposalOptions): Promise<void> {
  await api.post(`/admin/brand-import/results/${resultId}/apply`, options);
}

export async function selectBrandAsset(assetId: string, isSelected: boolean): Promise<void> {
  await api.post(`/admin/brand-import/assets/${assetId}/select`, isSelected);
}

/** Polls a job until it reaches a terminal status (Ready/Failed), or attempts run out. */
export async function pollBrandImportJob(
  jobId: string,
  onUpdate: (job: BrandImportJobStatusDto) => void,
  options: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<BrandImportJobStatusDto> {
  const intervalMs = options.intervalMs ?? 2000;
  const maxAttempts = options.maxAttempts ?? 60; // ~2 minutes at 2s intervals

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const job = await getBrandImportJob(jobId);
    onUpdate(job);
    if (job.status === "Ready" || job.status === "Failed") return job;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("timeout");
}
