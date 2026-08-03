'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { legalConfig } from '@/lib/config';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

type ActivationDetails = {
  company: string;
  contactEmail: string;
  bookingUrl: string;
  trialDurationDays: number;
  expiresAt: string;
  acceptedAt?: string | null;
  versions: { terms: string; privacy: string; dpa: string };
};

const REQUIRED_CONFIRMATIONS = [
  ['businessConfirmed', 'Ich bestätige, dass ich GentleBook im Rahmen einer gewerblichen oder selbstständigen beruflichen Tätigkeit teste und als Unternehmer im Sinne des § 14 BGB handle.'],
  ['termsAccepted', 'Ich akzeptiere die Allgemeinen Geschäftsbedingungen für die Nutzung von GentleBook.'],
  ['privacyAcknowledged', 'Ich habe die Datenschutzerklärung zur Kenntnis genommen.'],
  ['dpaAccepted', 'Ich schließe den Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO ab.'],
  ['noAutomaticPaidConversionAcknowledged', 'Mir ist bekannt, dass die kostenlose Testphase nach 14 Tagen automatisch endet und nicht automatisch in ein kostenpflichtiges Abonnement übergeht.'],
] as const;

type ConfirmationKey = typeof REQUIRED_CONFIRMATIONS[number][0];

export default function TrialActivationForm() {
  const token = useSearchParams().get('token') ?? '';
  const [details, setDetails] = useState<ActivationDetails | null>(null);
  const [confirmingPersonName, setConfirmingPersonName] = useState('');
  const [confirmations, setConfirmations] = useState<Record<ConfirmationKey, boolean>>({
    businessConfirmed: false,
    termsAccepted: false,
    privacyAcknowledged: false,
    dpaAccepted: false,
    noAutomaticPaidConversionAcknowledged: false,
  });
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'success' | 'accepted' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !API_BASE) {
      setMessage('Der Freischaltungslink ist unvollständig.');
      setStatus('error');
      return;
    }

    const controller = new AbortController();
    fetch(`${API_BASE}/auth/trial-activation?token=${encodeURIComponent(token)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? 'Freischaltungslink ungültig.');
        setDetails(body);
        if (body.acceptedAt) {
          setMessage('Ihre Bestätigungen wurden bereits gespeichert. GentleBook prüft die Einrichtung und schaltet den Testzugang anschließend separat frei.');
          setStatus('accepted');
        } else {
          setStatus('ready');
        }
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') {
          setMessage(error.message);
          setStatus('error');
        }
      });
    return () => controller.abort();
  }, [token]);

  const allConfirmed = REQUIRED_CONFIRMATIONS.every(([key]) => confirmations[key]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allConfirmed || !confirmingPersonName.trim()) return;
    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/auth/trial-activation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, confirmingPersonName, ...confirmations }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? 'Freischaltung fehlgeschlagen.');
      setMessage(body.message);
      setStatus('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Freischaltung fehlgeschlagen.');
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return <main className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-[#6355E4]" /></main>;
  }

  if (status === 'success' || status === 'accepted') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <section className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Bestätigungen übermittelt</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
          <p className="mt-4 text-sm leading-6 text-gray-500">Die 14-tägige Testphase hat dadurch noch nicht begonnen. Beginn, Ende und Zugangsdaten erhalten Sie mit einer separaten Freischaltungsbestätigung.</p>
        </section>
      </main>
    );
  }

  if (!details || status === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Freischaltung nicht möglich</h1>
          <p className="mt-3 text-sm text-red-600">{message}</p>
          <a href="mailto:support@gentlegroup.de" className="mt-5 inline-block text-sm font-semibold text-[#6355E4] underline">Support kontaktieren</a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:py-20">
      <form onSubmit={submit} className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
        <ShieldCheck className="h-10 w-10 text-[#6355E4]" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">GentleBook-Testzugang bestätigen</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">Für <strong>{details.company}</strong> wurde GentleBook vorbereitet. Nach Ihrer Bestätigung prüft GentleBook die Einrichtung und gibt den 14-Tage-Test separat frei.</p>

        <dl className="mt-6 grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-gray-500">Unternehmen</dt><dd className="font-semibold text-gray-900">{details.company}</dd></div>
          <div><dt className="text-gray-500">Kontakt</dt><dd className="font-semibold text-gray-900">{details.contactEmail}</dd></div>
          <div><dt className="text-gray-500">Testdauer</dt><dd className="font-semibold text-gray-900">14 Tage ab Freischaltung</dd></div>
          <div><dt className="text-gray-500">Kostenpflichtige Verlängerung</dt><dd className="font-semibold text-gray-900">Keine automatische Verlängerung</dd></div>
        </dl>

        <label className="mt-6 block text-sm font-semibold text-gray-800">
          Vor- und Nachname der bestätigenden Person
          <input value={confirmingPersonName} onChange={(event) => setConfirmingPersonName(event.target.value)} required autoComplete="name" className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal outline-none focus:border-[#6355E4] focus:ring-2 focus:ring-[#6355E4]/20" />
        </label>

        <fieldset className="mt-6 space-y-4">
          <legend className="text-sm font-semibold text-gray-900">Erforderliche Bestätigungen</legend>
          {REQUIRED_CONFIRMATIONS.map(([key, label]) => (
            <label key={key} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
              <input type="checkbox" checked={confirmations[key]} onChange={(event) => setConfirmations((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-[#6355E4]" />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        <p className="mt-6 text-xs leading-5 text-gray-500">
          Dokumente: <a href={legalConfig.terms} target="_blank" rel="noopener noreferrer" className="underline">AGB</a>{' · '}
          <a href={legalConfig.privacy} target="_blank" rel="noopener noreferrer" className="underline">Datenschutzerklärung</a>{' · '}
          <a href={legalConfig.processing} target="_blank" rel="noopener noreferrer" className="underline">Auftragsverarbeitung</a>. Versionen: AGB {details.versions.terms}, Datenschutz {details.versions.privacy}, AVV {details.versions.dpa}.
        </p>

        {message && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        <button type="submit" disabled={!allConfirmed || !confirmingPersonName.trim() || status === 'submitting'} className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#6355E4] px-5 py-3 font-semibold text-white hover:bg-[#5646D6] disabled:cursor-not-allowed disabled:opacity-40">
          {status === 'submitting' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird übermittelt…</> : 'Bestätigungen verbindlich übermitteln'}
        </button>
      </form>
    </main>
  );
}
