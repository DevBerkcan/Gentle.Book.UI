import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware für Cache-Optimierung
 * Setzt optimale Cache-Control Headers für Varnish
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const { pathname } = request.nextUrl;

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
