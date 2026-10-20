'use client';

import { useEffect, useState, useCallback } from 'react';
import { Scale, RefreshCw, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { superAdminApi, LegalDocumentItem } from '@/lib/api/superadmin';

const TYPE_LABEL: Record<string, string> = {
  Terms: 'AGB',
  Privacy: 'Datenschutzerklärung',
  Dpa: 'Auftragsverarbeitungsvertrag (AVV)',
};

const ALL_TYPES = ['Terms', 'Privacy', 'Dpa'];

function formatDate(s: string) {
  return new Date(s).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LegalDocumentsPage() {
  const [documents, setDocuments] = useState<LegalDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState('Terms');
  const [version, setVersion] = useState('');
  const [language, setLanguage] = useState('de');
  const [fullText, setFullText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superAdminApi.getLegalDocuments();
      setDocuments(data);
    } catch {
      setError('Rechtstexte konnten nicht geladen werden.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Which of the three document types currently have no released version at all —
  // real (non-trial) Mollie checkout is technically blocked until all three are filled.
  const releasedTypes = new Set(documents.map(d => d.type));
  const missingTypes = ALL_TYPES.filter(t => !releasedTypes.has(t));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!version.trim()) {
      setFormError('Eine Version ist erforderlich (z.B. 2026-10-20).');
      return;
    }
    if (!fullText.trim()) {
      setFormError('Der vollständige Text ist erforderlich.');
      return;
    }

    setSubmitting(true);
    try {
      await superAdminApi.createLegalDocument({ type, version: version.trim(), language, fullText });
      setSuccess(`${TYPE_LABEL[type]} Version "${version.trim()}" wurde veröffentlicht.`);
      setVersion('');
      setFullText('');
      await load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Veröffentlichung fehlgeschlagen.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rechtstexte</h1>
          <p className="text-gray-400 text-sm mt-0.5">Unveränderliches Archiv der AGB / Datenschutzerklärung / AVV — gilt platformweit</p>
        </div>
        <button
          onClick={() => load()}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg border border-gray-100 shadow-sm transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Gate status banner */}
      {!loading && (
        missingTypes.length > 0 ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Echter Vertragsabschluss (kostenpflichtiges Abo) ist derzeit blockiert.</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Fehlende Dokumente: {missingTypes.map(t => TYPE_LABEL[t]).join(', ')}. Ohne diese Texte verweigert das System den Checkout automatisch (fail-closed).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-800">Alle drei Dokumenttypen sind veröffentlicht — Checkout ist freigegeben.</p>
          </div>
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Form: register a new version */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Neue Version veröffentlichen</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Es gibt absichtlich keine Bearbeiten/Löschen-Funktion. Eine Korrektur ist immer eine neue Version, nie eine Änderung einer bestehenden.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dokumenttyp</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sprache</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  placeholder="de"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Version</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="z.B. 2026-10-20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Vollständiger Text</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-400 min-h-[220px]"
                value={fullText}
                onChange={e => setFullText(e.target.value)}
                placeholder="Rechtlich geprüften, finalen Text hier einfügen…"
              />
            </div>

            {formError && <p className="text-xs text-red-600">{formError}</p>}
            {success && <p className="text-xs text-emerald-600">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Wird veröffentlicht…' : 'Veröffentlichen'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-5 pb-3">
            <Scale size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Veröffentlichungsverlauf</h2>
          </div>

          {loading ? (
            <div className="px-5 pb-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="px-5 pb-5 text-sm text-red-600">{error}</p>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <Scale size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">Noch keine Rechtstexte veröffentlicht</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
              {documents.map(d => (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {TYPE_LABEL[d.type] || d.type} <span className="text-gray-400 font-normal">· {d.version}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.language.toUpperCase()} · {d.textLength.toLocaleString('de-DE')} Zeichen · {formatDate(d.releasedAt)}
                    </p>
                    <p className="text-[11px] text-gray-300 font-mono truncate mt-0.5" title={d.sha256Hash}>
                      sha256:{d.sha256Hash.slice(0, 16)}…
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
