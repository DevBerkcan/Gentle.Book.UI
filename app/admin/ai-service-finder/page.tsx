'use client';

import { useEffect, useMemo, useState } from 'react';
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

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Finder aktiv" value={overview?.finderEnabled ? 'Ja' : 'Nein'} />
        <StatCard label="Aktive Fragen" value={String(overview?.questionCount ?? 0)} />
        <StatCard label="Aktive Regeln" value={String(overview?.ruleCount ?? 0)} />
        <StatCard label="Freigegebene Hinweise" value={String(overview?.guidanceCount ?? 0)} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <h2 className="text-lg font-semibold text-[#14162B]">Branchenprofil</h2>

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
      />

      <JsonEditorCard
        title="Service-Regeln"
        value={rulesJson}
        onChange={setRulesJson}
        onSave={() => void saveRules()}
        saving={savingRules}
      />

      <JsonEditorCard
        title="Kundenhinweise"
        value={guidanceJson}
        onChange={setGuidanceJson}
        onSave={() => void saveGuidance()}
        saving={savingGuidance}
      />

      <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold text-[#14162B]">Finder testen</h2>

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
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-lg font-semibold text-[#14162B]">{title}</h2>
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
