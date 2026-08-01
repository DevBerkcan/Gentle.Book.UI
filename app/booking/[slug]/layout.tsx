// app/booking/[slug]/layout.tsx
// Generates dynamic Open Graph meta tags per tenant for social sharing previews.
import type { Metadata } from "next";
import { legalConfig } from "@/lib/config";

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
  return (
    <>
      {children}
      <aside className="border-t border-gray-200 bg-white px-4 py-6 text-center text-xs leading-relaxed text-gray-500">
        <p className="mx-auto max-w-3xl">
          Die angebotenen Leistungen werden vom jeweils genannten Unternehmen erbracht. Vertragspartner für die
          Dienstleistung ist dieses Unternehmen, nicht GentleBook. GentleBook stellt ausschließlich die technische
          Plattform für Darstellung und Terminübermittlung bereit.
        </p>
        <nav aria-label="Rechtliche Hinweise" className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <a href={legalConfig.privacy} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 hover:underline">Datenschutz</a>
          <a href={legalConfig.imprint} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 hover:underline">Impressum</a>
          <a href={legalConfig.b2b} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 hover:underline">Hinweis zur Plattform</a>
        </nav>
      </aside>
    </>
  );
}
