// app/agb/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "AGB - GentleBook",
  description: "Allgemeine Geschäftsbedingungen von GentleBook",
};

const OPERATOR_NAME = "Berk-Can Atesoglu";
const OPERATOR_ADDRESS = "Girardetstraße 17, 42109 Wuppertal";
const CONTACT_EMAIL = "support@gentlegroup.de";

export default function AgbPage() {
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
          <h1 className="text-4xl font-bold text-[#14162B] mb-6">Allgemeine Geschäftsbedingungen</h1>

          <div className="mb-8 rounded-2xl border border-amber-400/40 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
            <strong>Entwurf — noch nicht rechtlich geprüft.</strong> Dieser Text ist eine
            Ausgangsfassung auf Basis der aktuellen Produkt- und Preisdaten. Bitte vor
            Veröffentlichung von einer Rechtsanwaltskanzlei oder einem Fachdienst (z. B.
            IT-Recht Kanzlei, eRecht24) prüfen und freigeben lassen.
          </div>

          <div className="space-y-8 text-[#8A8A8A]">
            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">§ 1 Geltungsbereich und Vertragspartner</h2>
              <p>
                Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über die Nutzung
                der Software „GentleBook&quot; zwischen {OPERATOR_NAME} (GentleGroup),{" "}
                {OPERATOR_ADDRESS} (nachfolgend „GentleBook&quot;) und Unternehmern im
                Sinne des § 14 BGB, die GentleBook als Buchungssystem für ihren Salon, ihr Studio
                oder ihre Praxis nutzen (nachfolgend „Kunde&quot;).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">§ 2 Vertragsschluss und Testphase</h2>
              <p>
                Der Kunde kann GentleBook zunächst 14 Tage kostenlos und unverbindlich testen,
                ohne Angabe einer Zahlungsmethode. Der Testzugang wandelt sich nicht automatisch in
                ein kostenpflichtiges Abonnement um. Nach Ablauf der Testphase wird der Zugang zum
                Admin-Bereich gesperrt, bis der Kunde einen kostenpflichtigen Plan aktiviert. Der
                Vertrag über ein kostenpflichtiges Abonnement kommt zustande, sobald der Kunde
                einen Plan auswählt und die Zahlung (siehe § 4) erfolgreich eingerichtet ist.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">§ 3 Leistungsumfang</h2>
              <p>
                GentleBook stellt eine webbasierte Software-as-a-Service-Lösung zur
                Terminverwaltung bereit (u. a. Online-Buchungsseite, Kalender, Kundenverwaltung,
                E-Mail-Benachrichtigungen). Der genaue Funktionsumfang richtet sich nach dem
                gewählten Plan (Starter, Professional, Agency) gemäß der Preisübersicht auf
                www.gentlebook.de. GentleBook ist bemüht, eine hohe Verfügbarkeit der
                Software sicherzustellen, garantiert jedoch keine unterbrechungsfreie Erreichbarkeit
                (z. B. bei Wartungsarbeiten oder Störungen bei Hosting-Dienstleistern).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">§ 4 Preise und Zahlung</h2>
              <p>
                Es gelten die zum Zeitpunkt des Vertragsschlusses auf www.gentlebook.de
                ausgewiesenen Preise. Da {OPERATOR_NAME} Kleinunternehmer im Sinne des § 19 UStG
                ist, wird keine Umsatzsteuer ausgewiesen. Die Zahlung erfolgt monatlich im Voraus
                per SEPA-Lastschrift über den Zahlungsdienstleister Mollie. Bei fehlgeschlagener
                Abbuchung wird der Kunde per E-Mail informiert und um Klärung gebeten; bei
                wiederholt fehlgeschlagenen Abbuchungen kann der Zugang bis zur Klärung
                eingeschränkt werden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">§ 5 Vertragslaufzeit und Kündigung</h2>
              <p>
                Das Abonnement läuft auf unbestimmte Zeit. Der Kunde kann jederzeit ohne Einhaltung
                einer Kündigungsfrist kündigen; die Kündigung wird zum Ende des jeweils laufenden,
                bereits bezahlten Abrechnungszeitraums wirksam. Bis zu diesem Zeitpunkt bleibt der
                Zugang zu GentleBook bestehen, danach werden keine weiteren Zahlungen eingezogen;
                eine anteilige Rückerstattung für den bereits laufenden Zeitraum erfolgt nicht. Die
                Kündigung erfolgt über die Abo-Verwaltung im Admin-Bereich oder in Textform (z. B.
                E-Mail an {CONTACT_EMAIL}). {OPERATOR_NAME} kann das Abonnement zum Ende eines
                Abrechnungszeitraums mit einer Frist von 30 Tagen kündigen. Das Recht zur
                außerordentlichen Kündigung aus wichtigem Grund bleibt für beide Seiten unberührt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">§ 6 Pflichten des Kunden</h2>
              <p>
                Der Kunde ist verantwortlich für die Rechtmäßigkeit der von ihm über GentleBook
                verarbeiteten Kundendaten (z. B. seiner eigenen Salon-Kunden) und für den Abschluss
                eines Auftragsverarbeitungsvertrags mit GentleBook, sofern dieser für die genutzte
                Verarbeitung erforderlich ist. Zugangsdaten sind vertraulich zu behandeln.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">§ 7 Haftung</h2>
              <p>
                GentleBook haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach den
                Vorschriften des Produkthaftungsgesetzes. Bei leicht fahrlässiger Verletzung einer
                wesentlichen Vertragspflicht (Kardinalpflicht) ist die Haftung auf den
                vertragstypisch vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung für
                leichte Fahrlässigkeit ausgeschlossen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#14162B] mb-4">§ 8 Schlussbestimmungen</h2>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
                UN-Kaufrechts. Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die
                Wirksamkeit der übrigen Bestimmungen unberührt.
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
