// lib/utils/logo.ts
// TenantSettings.LogoUrl is stored/returned as a relative path (e.g. "/uploads/logos/x.png").
// NEXT_PUBLIC_API_URL includes a "/api" suffix, so naively concatenating it produces a broken
// ".../api/uploads/..." URL — this strips that suffix via the URL's origin instead. Kept
// dependency-free (no import of lib/api/client.ts) so it's safe to use from server components
// (e.g. generateMetadata) as well as client components.
export function resolveLogoUrl(logoUrl?: string | null): string | null {
  if (!logoUrl) return null;
  if (logoUrl.startsWith("http")) return logoUrl;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  try {
    return `${new URL(base).origin}${logoUrl}`;
  } catch {
    return logoUrl;
  }
}
