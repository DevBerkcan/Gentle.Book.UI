'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, HelpCircle, Info } from 'lucide-react';
import {
  aiFinderApi,
  type FinderGuidance,
  type FinderOverview,
  type FinderQuestion,
  type FinderRule,
  type IndustryProfile,
  type TenantIndustrySettings,
  type EvaluateFinderResponse,
} from '@/lib/api/ai-finder';

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function InfoTooltip({ text }: { text: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-label="Erklärung anzeigen"
        className="text-gray-400 hover:text-[#6355E4] transition-colors"
      >
        <Info size={15} />
      </button>
      {open && (
        <div className="absolute z-20 top-6 left-0 w-80 rounded-lg border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-lg">
          {text}
        </div>
      )}
    </span>
  );
}

export default function AiServiceFinderAdminPage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [savingGuidance, setSavingGuidance] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [overview, setOverview] = useState<FinderOverview | null>(null);
  const [profiles, setProfiles] = useState<IndustryProfile[]>([]);
  const [settings, setSettings] = useState<TenantIndustrySettings | null>(null);

  const [questions, setQuestions] = useState<FinderQuestion[]>([]);
  const [rules, setRules] = useState<FinderRule[]>([]);
  const [guidance, setGuidance] = useState<FinderGuidance[]>([]);

  const [questionsJson, setQuestionsJson] = useState('[]');
  const [rulesJson, setRulesJson] = useState('[]');
  const [guidanceJson, setGuidanceJson] = useState('[]');
  const [answerJson, setAnswerJson] = useState('[\n  {"key":"goal","value":"beratung"}\n]');
  const [freeText, setFreeText] = useState('');
  const [preview, setPreview] = useState<EvaluateFinderResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const [overviewData, profileData, settingsData, questionData, ruleData, guidanceData] = await Promise.all([
          aiFinderApi.getOverview(),
          aiFinderApi.getIndustryProfiles(),
          aiFinderApi.getIndustrySettings(),
          aiFinderApi.getQuestions(),
          aiFinderApi.getRules(),
          aiFinderApi.getGuidance(),
        ]);

        if (!active) return;
        setOverview(overviewData);
        setProfiles(profileData);
        setSettings(settingsData);
        setQuestions(questionData);
        setRules(ruleData);
        setGuidance(guidanceData);

        setQuestionsJson(pretty(questionData));
        setRulesJson(pretty(ruleData));
        setGuidanceJson(pretty(guidanceData));
      } catch (e: any) {
        const msg = e.response?.data?.message || 'Fehler beim Laden.';
        if (active) setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === settings?.primaryIndustryProfileId) ?? null,
    [profiles, settings?.primaryIndustryProfileId],
  );

  async function saveSettings() {
    if (!settings?.primaryIndustryProfileId) {
      setError('Bitte zuerst ein Branchenprofil auswahlen.');
      return;
    }

    setError(null);
    setMessage(null);
    setSavingSettings(true);
    try {
      await aiFinderApi.upsertIndustrySettings({
        primaryIndustryProfileId: settings.primaryIndustryProfileId,
        isFinderEnabled: settings.isFinderEnabled,
        settingsJson: settings.settingsJson,
        enabledCapabilities: settings.enabledCapabilities,
      });
      setMessage('Branchenprofil gespeichert.');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveQuestions() {
    setSavingQuestions(true);
    setError(null);
    setMessage(null);
    try {
      const parsed = JSON.parse(questionsJson) as FinderQuestion[];
      await aiFinderApi.upsertQuestions({
        questions: parsed.map((q) => ({
          id: q.id,
          industryProfileId: q.industryProfileId ?? null,
          questionKey: q.questionKey,
          questionText: q.questionText,
          answerType: q.answerType,
          isRequired: q.isRequired,
          displayOrder: q.displayOrder,
          configJson: q.configJson,
          isActive: q.isActive,
        })),
      });
      setMessage('Finder-Fragen gespeichert.');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Fragen konnten nicht gespeichert werden.');
    } finally {
      setSavingQuestions(false);
    }
  }

  async function saveRules() {
    setSavingRules(true);
    setError(null);
    setMessage(null);
    try {
      const parsed = JSON.parse(rulesJson) as FinderRule[];
      await aiFinderApi.upsertRules({
        rules: parsed.map((r) => ({
          id: r.id,
          serviceId: r.serviceId,
          ruleType: r.ruleType,
          conditionJson: r.conditionJson,
          resultJson: r.resultJson,
          priority: r.priority,
          isActive: r.isActive,
          approvalStatus: r.approvalStatus,
        })),
      });
      setMessage('Service-Regeln gespeichert.');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Regeln konnten nicht gespeichert werden.');
    } finally {
      setSavingRules(false);
    }
  }

  async function saveGuidance() {
    setSavingGuidance(true);
    setError(null);
    setMessage(null);
    try {
      const parsed = JSON.parse(guidanceJson) as FinderGuidance[];
      await aiFinderApi.upsertGuidance({
        guidance: parsed.map((g) => ({
          id: g.id,
          serviceId: g.serviceId,
          guidanceType: g.guidanceType,
          title: g.title,
          content: g.content,
          approvalStatus: g.approvalStatus,
          isActive: g.isActive,
          validFrom: g.validFrom,
          validTo: g.validTo,
        })),
      });
      setMessage('Kundenhinweise gespeichert.');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Hinweise konnten nicht gespeichert werden.');
    } finally {
      setSavingGuidance(false);
    }
  }

  async function runPreview() {
    setPreviewing(true);
    setError(null);
    try {
      const answers = JSON.parse(answerJson) as Array<{ key: string; value: unknown }>;
      const data = await aiFinderApi.preview({ answers, freeText });
      setPreview(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Preview fehlgeschlagen.');
    } finally {
      setPreviewing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#14162B]">KI & Service Finder</h1>
        <p className="text-sm text-gray-500 mt-1">Mandantenfaehige Konfiguration fur Branchenprofil, Fragen, Regeln, Hinweise und Finder-Preview.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <section className="rounded-xl border border-[#E5E7EB] bg-[#F7F7FE] overflow-hidden">
        <button
          onClick={() => setGuideOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-[#14162B]">
            <HelpCircle size={16} className="text-[#6355E4]" />
            Wie funktioniert der Service Finder? So richtest du ihn ein.
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
        </button>
        {guideOpen && (
          <div className="px-4 pb-4 text-sm text-gray-600 space-y-3">
            <p>
              Der Service Finder ist ein Frage-Assistent für deine Kund:innen: Sie beantworten ein paar Fragen
              auf deiner Buchungsseite und bekommen automatisch den passenden Service vorgeschlagen. Wichtig zu wissen:
              die Empfehlung kommt <strong>nicht von einer echten KI/Sprach-KI</strong>, sondern von Regeln, die du
              hier selbst festlegst (&quot;wenn Antwort X, dann empfehle Service Y&quot;) — vollständig vorhersehbar
              und ohne laufende KI-Kosten.
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Branchenprofil</strong> unten wählen und Häkchen bei den gewünschten Fähigkeiten setzen.</li>
              <li><strong>Finder-Fragen</strong> anlegen — das sind die Fragen, die Kund:innen im Assistenten beantworten.</li>
              <li><strong>Service-Regeln</strong> anlegen — verknüpfen Antworten mit einem konkreten Service aus deinem Angebot.</li>
              <li><strong>Kundenhinweise</strong> (optional) — zusätzliche Infotexte, die bei einer Empfehlung angezeigt werden.</li>
              <li>Mit <strong>&quot;Finder testen&quot;</strong> unten Beispielantworten durchspielen, bevor etwas live geht — wirkt sich nicht auf die echte Buchungsseite aus.</li>
              <li>Erst wenn alles passt: oben bei &quot;Branchenprofil&quot; das Häkchen <strong>&quot;Finder öffentlich anzeigen&quot;</strong> setzen und speichern — das schaltet ihn für Kund:innen live.</li>
            </ol>
            <p className="text-gray-500">
              Verfügbar ab Tarif <strong>Professional</strong>. Fragen/Regeln/Hinweise werden aktuell als JSON bearbeitet —
              klicke auf das <Info size={12} className="inline align-text-bottom text-gray-400" />-Symbol neben jedem
              Abschnittstitel für das genaue Format und ein Beispiel.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Finder aktiv" value={overview?.finderEnabled ? 'Ja' : 'Nein'} />
        <StatCard label="Aktive Fragen" value={String(overview?.questionCount ?? 0)} />
        <StatCard label="Aktive Regeln" value={String(overview?.ruleCount ?? 0)} />
        <StatCard label="Freigegebene Hinweise" value={String(overview?.guidanceCount ?? 0)} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <h2 className="text-lg font-semibold text-[#14162B] flex items-center gap-1.5">
          Branchenprofil
          <InfoTooltip text={
            <>
              Bestimmt, welche Fähigkeiten (z.B. Terminarten) für deine Branche zur Verfügung stehen.
              <br /><br />
              <strong>&quot;Finder öffentlich anzeigen&quot;</strong> ist der eigentliche An/Aus-Schalter: nur wenn
              dieses Häkchen gesetzt ist, sehen deine Kund:innen den Finder auf der Buchungsseite. Erst aktivieren,
              wenn Fragen und Regeln fertig eingerichtet sind.
            </>
          } />
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hauptbranche</label>
            <select
              value={settings?.primaryIndustryProfileId ?? ''}
              onChange={(event) => {
                setSettings((prev) => prev
                  ? { ...prev, primaryIndustryProfileId: event.target.value }
                  : null);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Bitte waehlen</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 mt-6 md:mt-0">
            <input
              id="finder-enabled"
              type="checkbox"
              checked={settings?.isFinderEnabled ?? false}
              onChange={(event) => {
                setSettings((prev) => prev ? { ...prev, isFinderEnabled: event.target.checked } : null);
              }}
            />
            <label htmlFor="finder-enabled" className="text-sm text-gray-700">Finder oeffentlich anzeigen</label>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Aktive Faehigkeiten</p>
          <div className="grid gap-2 md:grid-cols-3">
            {(selectedProfile?.capabilities ?? []).map((capability) => {
              const checked = settings?.enabledCapabilities.includes(capability.capabilityKey) ?? false;
              return (
                <label key={capability.id} className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setSettings((prev) => {
                        if (!prev) return prev;
                        const values = new Set(prev.enabledCapabilities);
                        if (event.target.checked) values.add(capability.capabilityKey);
                        else values.delete(capability.capabilityKey);
                        return { ...prev, enabledCapabilities: Array.from(values) };
                      });
                    }}
                  />
                  {capability.capabilityKey}
                </label>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => void saveSettings()}
          disabled={savingSettings || !settings}
          className="rounded-lg bg-[#6355E4] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {savingSettings ? 'Speichern...' : 'Branchenprofil speichern'}
        </button>
      </section>

      <JsonEditorCard
        title="Finder-Fragen"
        value={questionsJson}
        onChange={setQuestionsJson}
        onSave={() => void saveQuestions()}
        saving={savingQuestions}
        tooltip={
          <>
            Die Fragen, die Kund:innen im Finder-Assistenten beantworten (in der Reihenfolge von <code>displayOrder</code>).
            <br /><br />
            <strong>answerType</strong>: funktionieren direkt: <code>SingleChoice</code>, <code>MultiChoice</code>
            (Optionen über <code>configJson: {`{"options":["Option A","Option B"]}`}</code>), <code>YesNo</code>,
            <code> Number</code>, <code>FreeText</code>, <code>DateRange</code>, <code>PriceRange</code>,
            <code> DurationRange</code>. <em>Noch nicht unterstützt:</em> <code>EmployeeChoice</code>,{' '}
            <code>ImageUpload</code> (werden im Finder als &quot;bald verfügbar&quot; angezeigt).
            <br /><br />
            <code>questionKey</code> muss pro Frage eindeutig sein — wird in den Regeln unten referenziert.
            <code> isActive: false</code> blendet eine Frage aus, ohne sie zu löschen.
          </>
        }
      />

      <JsonEditorCard
        title="Service-Regeln"
        value={rulesJson}
        onChange={setRulesJson}
        onSave={() => void saveRules()}
        saving={savingRules}
        tooltip={
          <>
            Verknüpft Antworten mit einem Service — das Herzstück der Empfehlung. Keine KI, sondern feste Regeln,
            die du selbst definierst.
            <br /><br />
            <strong>conditionJson</strong> (wann greift die Regel):{' '}
            <code>{`{"questionKey":"anlass","operator":"equals","value":"hochzeit"}`}</code>. Operatoren:
            equals, notEquals, contains, in, exists, greaterThan, lessThan. Mehrere Bedingungen kombinieren mit{' '}
            <code>{`{"all":[...]}`}</code> (alle müssen zutreffen) oder <code>{`{"any":[...]}`}</code> (mind. eine).
            <br /><br />
            <strong>resultJson</strong> (was passiert bei Treffer): <code>{`{"score":10}`}</code> erhöht die
            Trefferwertung des Service, <code>{`{"exclude":true}`}</code> schließt ihn aus. Ohne{' '}
            <code>serviceIds</code> im Result gilt die Regel für den in <code>serviceId</code> gewählten Service.
            <br /><br />
            Mit &quot;Finder testen&quot; unten kannst du das Ergebnis vor der Veröffentlichung prüfen.
          </>
        }
      />

      <JsonEditorCard
        title="Kundenhinweise"
        value={guidanceJson}
        onChange={setGuidanceJson}
        onSave={() => void saveGuidance()}
        saving={savingGuidance}
        tooltip={
          <>
            Zusätzliche Infotexte (z.B. Vorbereitungshinweise), die Kund:innen angezeigt werden, wenn der
            zugehörige <code>serviceId</code>-Service empfohlen wird.
            <br /><br />
            Wird nur angezeigt, wenn <code>isActive: true</code> und <code>approvalStatus: &quot;Approved&quot;</code>{' '}
            gesetzt sind (optional zeitlich begrenzbar über <code>validFrom</code>/<code>validTo</code>).
          </>
        }
      />

      <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold text-[#14162B] flex items-center gap-1.5">
          Finder testen
          <InfoTooltip text={
            <>
              Simuliert einen Kunden-Durchlauf mit von dir eingegebenen Beispielantworten, ohne dass etwas live
              auf der Buchungsseite passiert — sicher zum Ausprobieren.
              <br /><br />
              Format: <code>{`[{"key":"anlass","value":"hochzeit"}]`}</code> — der <code>key</code> muss einem{' '}
              <code>questionKey</code> aus den Finder-Fragen entsprechen.
            </>
          } />
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Antworten (JSON)</label>
          <textarea
            value={answerJson}
            onChange={(event) => setAnswerJson(event.target.value)}
            className="w-full min-h-[130px] rounded-lg border border-gray-300 p-3 font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Optionaler Freitext</label>
          <input
            value={freeText}
            onChange={(event) => setFreeText(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="z.B. ich bin Erstkundin und unsicher"
          />
        </div>

        <button
          onClick={() => void runPreview()}
          disabled={previewing}
          className="rounded-lg bg-[#17A398] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {previewing ? 'Teste...' : 'Preview ausfuehren'}
        </button>

        {preview && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <p className="text-sm text-gray-700"><strong>Antwort:</strong> {preview.message}</p>
            <p className="text-sm text-gray-700"><strong>Empfehlungen:</strong> {preview.recommendations.map((r) => r.serviceName).join(', ') || 'Keine'}</p>
            <p className="text-sm text-gray-700"><strong>Fehlende Fragen:</strong> {preview.missingQuestions.map((q) => q.questionText).join(', ') || 'Keine'}</p>
            <p className="text-sm text-gray-700"><strong>Fallback:</strong> {preview.usedAiFallback ? 'Ja' : 'Nein'}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#14162B]">{value}</p>
    </div>
  );
}

function JsonEditorCard({
  title,
  value,
  onChange,
  onSave,
  saving,
  tooltip,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  tooltip?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-lg font-semibold text-[#14162B] flex items-center gap-1.5">
        {title}
        {tooltip && <InfoTooltip text={tooltip} />}
      </h2>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-h-[220px] rounded-lg border border-gray-300 p-3 font-mono text-xs"
      />
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-[#6355E4] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {saving ? 'Speichern...' : 'Speichern'}
      </button>
    </section>
  );
}
