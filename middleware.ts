import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware für Cache-Optimierung
 * Setzt optimale Cache-Control Headers für Varnish
 */

// ── Eigene Domain (Agency) ────────────────────────────────────────────────
// Maps a verified custom domain's Host header to the tenant's booking slug and rewrites
// internally to /booking/{slug} — the visitor never sees the gentlebook.de path. Module-scope
// cache (per Edge instance, short TTL) so this doesn't add a backend round-trip to every request;
// worst case a stale/negative entry self-corrects within CACHE_TTL_MS.
const domainCache = new Map<string, { slug: string | null; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const KNOWN_HOSTS = ["gentlebook.de", "www.gentlebook.de", "localhost", "gentle-book-ui.vercel.app"];

async function resolveCustomDomainSlug(host: string): Promise<string | null> {
  const cached = domainCache.get(host);
  if (cached && cached.expiresAt > Date.now()) return cached.slug;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return null;
    const res = await fetch(`${apiUrl}/tenant/domain/resolve?host=${encodeURIComponent(host)}`);
    const slug = res.ok ? (await res.json())?.slug ?? null : null;
    domainCache.set(host, { slug, expiresAt: Date.now() + CACHE_TTL_MS });
    return slug;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";

  if (host && !KNOWN_HOSTS.includes(host) && !pathname.startsWith("/booking/") && !pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
    const slug = await resolveCustomDomainSlug(host);
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/booking/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  const response = NextResponse.next();

  // Static Assets: Lange cachen (1 Jahr)
  if (
    pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
    return response;
  }

  // JavaScript & CSS: 1 Woche cachen
  if (pathname.match(/\.(js|css)$/)) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=604800, stale-while-revalidate=86400"
    );
    return response;
  }

  // API Routes: Nicht cachen
  if (pathname.startsWith("/api/")) {
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // HTML Pages: Kurz cachen mit Revalidation
  if (pathname === "/" || pathname.match(/\.html$/)) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600"
    );
    return response;
  }

  // Default: 10 Minuten
  response.headers.set(
    "Cache-Control",
    "public, max-age=600, stale-while-revalidate=1800"
  );

  // Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  // Varnish-spezifische Header
  response.headers.set("Surrogate-Control", "max-age=600");

  return response;
}

// Konfiguration: Auf welchen Routen soll Middleware laufen
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
