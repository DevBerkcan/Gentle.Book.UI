'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  confirmPublicBookingDraft,
  createPublicBookingDraft,
  evaluatePublicFinder,
  getPublicFinderBootstrap,
  type EvaluateFinderResponse,
  type FinderQuestion,
  type ServiceRecommendation,
} from '@/lib/api/ai-finder';

type AnswerMap = Record<string, unknown>;

/** configJson convention for SingleChoice/MultiChoice questions: `{"options": ["Option A", "Option B"]}`.
 * No admin UI produces this yet (raw JSON textarea only) — this is the schema a future
 * form-based question editor should target. */
function parseOptions(configJson: string | null): string[] {
  if (!configJson) return [];
  try {
    const parsed = JSON.parse(configJson);
    if (Array.isArray(parsed?.options)) {
      return parsed.options.filter((o: unknown): o is string => typeof o === 'string');
    }
  } catch {
    /* malformed configJson falls back to free text below */
  }
  return [];
}

export default function PublicFinderPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [aiDisclosure, setAiDisclosure] = useState('');
  const [medicalDisclaimer, setMedicalDisclaimer] = useState('');
  const [questions, setQuestions] = useState<FinderQuestion[]>([]);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [freeText, setFreeText] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluateFinderResponse | null>(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string>('');

  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftExpiresAt, setDraftExpiresAt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [customerConfirmed, setCustomerConfirmed] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const data = await getPublicFinderBootstrap(slug);
        if (!active) return;

        setEnabled(data.enabled);
        setAiDisclosure(data.aiDisclosure ?? '');
        setMedicalDisclaimer(data.medicalDisclaimer ?? '');
        setQuestions((data.questions ?? []).sort((a, b) => a.displayOrder - b.displayOrder));
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : 'Finder konnte nicht geladen werden.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  const selectedRecommendation = useMemo<ServiceRecommendation | null>(() => {
    if (!result || !selectedRecommendationId) return null;
    return result.recommendations.find((rec) => rec.serviceId === selectedRecommendationId) ?? null;
  }, [result, selectedRecommendationId]);

  async function runFinder() {
    setEvaluating(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        answers: Object.entries(answers).map(([key, value]) => ({ key, value })),
        freeText: freeText || null,
      };

      const response = await evaluatePublicFinder(slug, payload);
      setResult(response);

      if (response.recommendations.length > 0) {
        setSelectedRecommendationId(response.recommendations[0].serviceId);
      }

      setMessage(response.usedAiFallback
        ? 'Aktuell nutzen wir eine regelbasierte Antwort.'
        : 'Empfehlung wurde erstellt.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Finder-Auswertung fehlgeschlagen.');
    } finally {
      setEvaluating(false);
    }
  }

  async function createDraft() {
    if (!selectedRecommendationId) {
      setError('Bitte zuerst einen Service auswaehlen.');
      return;
    }
    if (!bookingDate || !startTime) {
      setError('Bitte Datum und Uhrzeit angeben.');
      return;
    }
    if (!firstName || !lastName || !email || !phone) {
      setError('Bitte alle Kundendaten ausfuellen.');
      return;
    }

    setCreatingDraft(true);
    setError(null);

    try {
      const draft = await createPublicBookingDraft(slug, {
        serviceId: selectedRecommendationId,
        employeeId: null,
        bookingDate,
        startTime,
        customer: {
          firstName,
          lastName,
          email,
          phone,
        },
        customerNotes: customerNotes || null,
      });

      setDraftId(draft.draftId);
      setDraftExpiresAt(draft.expiresAt);
      setMessage('Buchungsentwurf erstellt. Bitte bestaetigen.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Buchungsentwurf fehlgeschlagen.');
    } finally {
      setCreatingDraft(false);
    }
  }

  async function confirmDraft() {
    if (!draftId) {
      setError('Kein Entwurf verfugbar.');
      return;
    }
    if (!customerConfirmed) {
      setError('Bitte bestaetige Preis, Dauer und Bedingungen.');
      return;
    }

    setConfirming(true);
    setError(null);

    try {
      const booking = await confirmPublicBookingDraft(slug, draftId) as { id?: string };
      setMessage('Buchung bestaetigt.');
      if (booking.id) {
        router.push(`/booking/confirmation/${booking.id}?slug=${slug}`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Buchung konnte nicht bestaetigt werden.');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return <div className="p-6">Finder wird geladen...</div>;
  }

  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center space-y-3">
          <h1 className="text-xl font-bold text-[#14162B]">Service Finder ist derzeit nicht verfugbar.</h1>
          <p className="text-sm text-gray-600">Nutze stattdessen die normale Buchungsansicht.</p>
          <button
            onClick={() => router.push(`/booking/${slug}/book`)}
            className="rounded-lg bg-[#6355E4] px-4 py-2 text-sm font-semibold text-white"
          >
            Zur Buchung
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl bg-white border border-gray-200 p-5">
          <p className="text-xs uppercase tracking-wide text-[#6355E4] font-semibold">Automatisierter Service-Finder</p>
          <h1 className="text-2xl font-bold text-[#14162B] mt-1">Finde den passenden Termin in wenigen Schritten</h1>
          <p className="mt-2 text-sm text-gray-600">
            Die Ergebnisse sind automatisierte Vorschläge auf Grundlage der vom Unternehmen hinterlegten Leistungen
            und Regeln. Der Finder ersetzt keine persönliche, medizinische oder fachliche Beratung. Verbindlich sind
            die Angaben des Unternehmens und die abschließende Buchungsbestätigung.
          </p>
          {aiDisclosure && <p className="mt-2 text-sm text-gray-600">{aiDisclosure}</p>}
          {medicalDisclaimer && <p className="mt-1 text-sm text-amber-700">{medicalDisclaimer}</p>}
        </header>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

        <section className="rounded-2xl bg-white border border-gray-200 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-[#14162B]">1. Fragen beantworten</h2>

          {questions.map((question) => (
            <div key={question.id} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{question.questionText}</label>
              <QuestionField
                question={question}
                value={answers[question.questionKey]}
                onChange={(value) => setAnswers((prev) => ({ ...prev, [question.questionKey]: value }))}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Optionaler Freitext</label>
            <textarea
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[90px]"
              placeholder="Was ist dir wichtig?"
            />
          </div>

          <button
            onClick={() => void runFinder()}
            disabled={evaluating}
            className="rounded-lg bg-[#6355E4] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {evaluating ? 'Wird ausgewertet...' : 'Empfehlung anzeigen'}
          </button>
        </section>

        {result && (
          <section className="rounded-2xl bg-white border border-gray-200 p-5 space-y-4">
            <h2 className="text-lg font-semibold text-[#14162B]">2. Empfehlung und Hinweise</h2>
            <p className="text-sm text-gray-700">{result.message}</p>

            <div className="grid gap-3 md:grid-cols-2">
              {result.recommendations.map((recommendation) => (
                <label key={recommendation.serviceId} className="rounded-xl border border-gray-200 p-3 cursor-pointer">
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      checked={selectedRecommendationId === recommendation.serviceId}
                      onChange={() => setSelectedRecommendationId(recommendation.serviceId)}
                    />
                    <div>
                      <p className="font-semibold text-[#14162B]">{recommendation.serviceName}</p>
                      <p className="text-sm text-gray-600">
                        {recommendation.price.toFixed(2)} {recommendation.currency} • {recommendation.durationMinutes} Min.
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {result.guidance.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Freigegebene Hinweise</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  {result.guidance.map((item) => (
                    <li key={item.guidanceId}>• {item.title}: {item.content}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.missingQuestions.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Fur eine genauere Empfehlung fehlen noch: {result.missingQuestions.map((q) => q.questionText).join(', ')}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(event) => setBookingDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Vorname"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Nachname"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-Mail"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Telefon"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <textarea
              value={customerNotes}
              onChange={(event) => setCustomerNotes(event.target.value)}
              placeholder="Optionale Notiz"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
            />

            <button
              onClick={() => void createDraft()}
              disabled={creatingDraft || !selectedRecommendation}
              className="rounded-lg bg-[#17A398] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creatingDraft ? 'Erstelle Entwurf...' : 'Buchungsentwurf erstellen'}
            </button>

            {draftId && (
              <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                <p className="text-sm text-gray-700">Entwurf gueltig bis: {draftExpiresAt}</p>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={customerConfirmed}
                    onChange={(event) => setCustomerConfirmed(event.target.checked)}
                  />
                  Ich bestaetige Preis, Dauer und Bedingungen.
                </label>
                <button
                  onClick={() => void confirmDraft()}
                  disabled={confirming}
                  className="rounded-lg bg-[#6355E4] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {confirming ? 'Bestaetige...' : 'Buchung final bestaetigen'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

const fieldInputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

function FreeTextField({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  return (
    <input
      type="text"
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.target.value)}
      className={fieldInputCls}
    />
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: FinderQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (question.answerType) {
    case 'Number':
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
          className={fieldInputCls}
        />
      );

    case 'YesNo': {
      const current = typeof value === 'boolean' ? value : null;
      return (
        <div className="flex gap-2">
          {([{ label: 'Ja', v: true }, { label: 'Nein', v: false }] as const).map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.v)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                current === opt.v ? 'border-[#6355E4] bg-[#EEEBFC] text-[#6355E4]' : 'border-gray-300 text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    case 'SingleChoice': {
      const options = parseOptions(question.configJson);
      if (options.length === 0) return <FreeTextField value={value} onChange={onChange} />;
      return (
        <div className="flex flex-col gap-1.5">
          {options.map((option) => (
            <label key={option} className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" checked={value === option} onChange={() => onChange(option)} />
              {option}
            </label>
          ))}
        </div>
      );
    }

    case 'MultiChoice': {
      const options = parseOptions(question.configJson);
      if (options.length === 0) return <FreeTextField value={value} onChange={onChange} />;
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-col gap-1.5">
          {options.map((option) => (
            <label key={option} className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selected, option]
                    : selected.filter((o) => o !== option);
                  onChange(next);
                }}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    case 'DateRange': {
      const range = (value && typeof value === 'object' ? value : {}) as { from?: string; to?: string };
      return (
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={range.from ?? ''} onChange={(event) => onChange({ ...range, from: event.target.value })} className={fieldInputCls} />
          <input type="date" value={range.to ?? ''} onChange={(event) => onChange({ ...range, to: event.target.value })} className={fieldInputCls} />
        </div>
      );
    }

    case 'PriceRange':
    case 'DurationRange': {
      const range = (value && typeof value === 'object' ? value : {}) as { min?: number; max?: number };
      return (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={range.min ?? ''}
            onChange={(event) => onChange({ ...range, min: event.target.value === '' ? undefined : Number(event.target.value) })}
            className={fieldInputCls}
          />
          <input
            type="number"
            placeholder="Max"
            value={range.max ?? ''}
            onChange={(event) => onChange({ ...range, max: event.target.value === '' ? undefined : Number(event.target.value) })}
            className={fieldInputCls}
          />
        </div>
      );
    }

    case 'EmployeeChoice':
    case 'ImageUpload':
      return (
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500">
          {question.answerType === 'EmployeeChoice'
            ? 'Mitarbeiterauswahl wird in einer zukünftigen Version unterstützt.'
            : 'Foto-Upload wird in einer zukünftigen Version unterstützt.'}
        </p>
      );

    case 'FreeText':
    default:
      return <FreeTextField value={value} onChange={onChange} />;
  }
}
