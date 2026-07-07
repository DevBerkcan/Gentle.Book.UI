// app/impressum/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Impressum - GentleBook",
  description: "Impressum und Kontaktdaten von GentleBook",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F5FA] to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8A8A8A] hover:text-[#ECEBF2] transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Zurück zur Startseite
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-[#ECEBF2]/20">
          <h1 className="text-4xl font-bold text-[#14162B] mb-8">Impressum</h1>

          <div className="space-y-8 text-[#8A8A8A]">
            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">Angaben gemäß § 5 TMG</h2>
              <p className="mb-2 text-[#14162B] font-semibold">
                GentleBook
              </p>
              <p>Elisabethenstrasse 41</p>
              <p>4051 Basel, Schweiz</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">Kontakt</h2>
              <p className="mb-2">
                <strong className="text-[#14162B]">Telefon:</strong> <span className="text-[#8A8A8A]">+49 157 35985449</span>
              </p>
              <p className="mb-2">
                <strong className="text-[#14162B]">E-Mail:</strong>{" "}
                <a href="mailto:info@gentlebook.app" className="text-[#ECEBF2] hover:underline">
                  info@gentlebook.app
                </a>
              </p>
              <p className="mb-2">
                <strong className="text-[#14162B]">Website:</strong>{" "}
                <a href="https://gentlebook.app" className="text-[#ECEBF2] hover:underline">
                  https://gentlebook.app
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">
                Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
              </h2>
              <p className="text-[#14162B] font-semibold">Inhaber: Marianna Topchanali</p>
              <p>Elisabethenstrasse 41</p>
              <p>4051 Basel, Schweiz</p>
            </section>

            <section className="bg-[#F6F5FA] p-6 rounded-xl border border-[#ECEBF2]/30">
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">
                EU-Streitschlichtung
              </h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ECEBF2] hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p className="mt-2">
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#ECEBF2]/20">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#ECEBF2] hover:text-[#D8D7E2] font-semibold transition-colors"
            >
              <ArrowLeft size={20} />
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}