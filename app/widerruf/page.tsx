// app/widerruf/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Widerrufsbelehrung - GentleBook",
  description: "Widerrufsbelehrung für Verträge über die Nutzung von GentleBook",
};

const OPERATOR_NAME = "Berk-Can Atesoglu";
const OPERATOR_ADDRESS = "Girardetstraße 17, 42109 Wuppertal";
const CONTACT_EMAIL = "support@gentlegroup.de";
const CONTACT_PHONE = "+49 157 35985449";

export default function WiderrufPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F5FA] to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8A8A8A] hover:text-[#6355E4] transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Zurück zur Startseite
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-[#ECEBF2]/20">
          <h1 className="text-4xl font-bold text-[#14162B] mb-6">Widerrufsbelehrung</h1>

          <div className="mb-8 rounded-2xl border border-amber-400/40 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
            <strong>Entwurf — noch nicht rechtlich geprüft.</strong> Dieser Text ist eine
            Ausgangsfassung auf Basis der aktuellen Produkt- und Preisdaten. Bitte vor
            Veröffentlichung von einer Rechtsanwaltskanzlei oder einem Fachdienst (z. B.
            IT-Recht Kanzlei, eRecht24) prüfen und freigeben lassen.
          </div>

          <div className="space-y-8 text-[#8A8A8A]">
            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">Widerrufsrecht</h2>
              <p className="mb-3">
                Verbrauchern steht bei Vertragsschluss im Fernabsatz grundsätzlich ein
                Widerrufsrecht zu. Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von
                Gründen diesen Vertrag zu widerrufen.
              </p>
              <p className="mb-3">
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses. Um Ihr
                Widerrufsrecht auszuüben, müssen Sie uns
              </p>
              <p className="mb-3 text-[#14162B] font-semibold">
                {OPERATOR_NAME} (GentleGroup), {OPERATOR_ADDRESS}, E-Mail:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#6355E4] hover:underline">
                  {CONTACT_EMAIL}
                </a>
                , Telefon: {CONTACT_PHONE}
              </p>
              <p>
                mittels einer eindeutigen Erklärung (z. B. per Post versandter Brief oder E-Mail)
                über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Zur Wahrung der
                Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
                Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">Folgen des Widerrufs</h2>
              <p>
                Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von
                Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
                zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">Vorzeitiges Erlöschen des Widerrufsrechts</h2>
              <p>
                Ihr Widerrufsrecht erlischt vorzeitig, wenn wir die Dienstleistung vollständig
                erbracht haben und Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung
                der Dienstleistung vor Ablauf der Widerrufsfrist beginnen, und Sie gleichzeitig
                Ihre Kenntnis davon bestätigt haben, dass Sie durch diese Zustimmung Ihr
                Widerrufsrecht verlieren, sobald wir den Vertrag vollständig erfüllt haben. Da der
                kostenlose Testzeitraum keine Zahlung voraussetzt, ist ein Widerruf während der
                Testphase in der Praxis nicht erforderlich; erst mit Beginn eines kostenpflichtigen
                Abonnements greift diese Regelung.
              </p>
            </section>

            <section className="bg-[#F6F5FA] p-6 rounded-xl border border-[#ECEBF2]/30">
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">Muster-Widerrufsformular</h2>
              <p className="mb-3">
                (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und
                senden Sie es an uns zurück.)
              </p>
              <p className="mb-3 text-[#14162B] font-semibold">
                An {OPERATOR_NAME} (GentleGroup), {OPERATOR_ADDRESS}, {CONTACT_EMAIL}:
              </p>
              <p>
                Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über die
                Nutzung von GentleBook — bestellt am [Datum] — Name des/der Verbraucher(s) —
                Anschrift des/der Verbraucher(s) — Datum.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#ECEBF2]/20">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#6355E4] hover:text-[#5646D6] font-semibold transition-colors"
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
