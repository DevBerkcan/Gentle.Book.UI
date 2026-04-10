// app/booking/[slug]/layout.tsx
// Generates dynamic Open Graph meta tags per tenant for social sharing previews.
import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const res = await fetch(`${API_BASE}/booking/${params.slug}/info`, {
      next: { revalidate: 300 }, // cache 5 min
    });
    if (!res.ok) return {};

    const info = await res.json();
    const title       = info.companyName ?? info.name ?? params.slug;
    const description = info.tagline ?? "Jetzt Termin online buchen — schnell & einfach.";
    const logoUrl     = info.logoUrl
      ? (info.logoUrl.startsWith("http") ? info.logoUrl : `${API_BASE}${info.logoUrl}`)
      : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type:   "website",
        locale: "de_DE",
        images: logoUrl ? [{ url: logoUrl, width: 400, height: 400 }] : [],
      },
      twitter: {
        card:        "summary",
        title,
        description,
        images:      logoUrl ? [logoUrl] : [],
      },
    };
  } catch {
    return {};
  }
}

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
