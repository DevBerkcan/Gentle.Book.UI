'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, HelpCircle, Info, Users } from 'lucide-react';
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
import { SettingsNav, type SettingsNavItem } from '@/components/admin/settings/SettingsNav';
import { useTranslation, fillTemplate } from '@/lib/i18n/LanguageContext';

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function InfoTooltip({ text }: { text: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-label={t.admin.aiServiceFinderPage.ariaShowExplanation}
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
  const { t } = useTranslation();
  const s = t.admin.aiServiceFinderPage;
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
  const [budgetRequestOpen, setBudgetRequestOpen] = useState(false);
  const [budgetRequestAmount, setBudgetRequestAmount] = useState('');
  const [budgetRequestNote, setBudgetRequestNote] = useState('');
  const [submittingBudgetRequest, setSubmittingBudgetRequest] = useState(false);
  const [budgetRequestError, setBudgetRequestError] = useState<string | null>(null);

  // Shared by the initial mount effect and every save handler below — found during live
  // pre-launch testing: a question/rule/guidance edit could report success while the textarea
  // kept showing the pre-edit JSON (nothing re-fetched after saving), so there was no way to
  // tell an actual persistence problem apart from "just needs a page reload to show up" without
  // a full browser refresh. Re-fetching immediately after save surfaces the true server state
  // right away instead.
  async function reloadData(activeRef?: { current: boolean }) {
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

      if (activeRef && !activeRef.current) return;
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
      const msg = e.response?.data?.message || s.loadError;
      if (!activeRef || activeRef.current) setError(msg);
    } finally {
      if (!activeRef || activeRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    const activeRef = { current: true };
    void reloadData(activeRef);
    return () => {
      activeRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === settings?.primaryIndustryProfileId) ?? null,
    [profiles, settings?.primaryIndustryProfileId],
  );

  async function handleSubmitBudgetRequest() {
    const amount = parseFloat(budgetRequestAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setBudgetRequestError(s.invalidAmountError);
      return;
    }
    setSubmittingBudgetRequest(true);
    setBudgetRequestError(null);
    try {
      await aiFinderApi.requestBudgetIncrease(amount, budgetRequestNote.trim() || undefined);
      setBudgetRequestOpen(false);
      setBudgetRequestAmount('');
      setBudgetRequestNote('');
      const fresh = await aiFinderApi.getOverview();
      setOverview(fresh);
    } catch (e: any) {
      setBudgetRequestError(e.response?.data?.message || s.requestSendError);
    } finally {
      setSubmittingBudgetRequest(false);
    }
  }

  async function saveSettings() {
    if (!settings?.primaryIndustryProfileId) {
      setError(s.selectProfileFirstError);
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
      setMessage(s.profileSavedMsg);
      await reloadData();
    } catch (e: any) {
      setError(e.response?.data?.message || s.saveFailedError);
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
      setMessage(s.questionsSavedMsg);
      await reloadData();
    } catch (e: any) {
      setError(e.response?.data?.message || s.questionsSaveError);
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
      setMessage(s.rulesSavedMsg);
      await reloadData();
    } catch (e: any) {
      setError(e.response?.data?.message || s.rulesSaveError);
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
      setMessage(s.guidanceSavedMsg);
      await reloadData();
    } catch (e: any) {
      setError(e.response?.data?.message || s.guidanceSaveError);
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
      setError(e.response?.data?.message || s.previewFailedError);
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

  const navItems: SettingsNavItem[] = [
    { id: 'section-guide', label: s.navGuide },
    ...(overview?.budget ? [{ id: 'section-budget', label: s.navBudget }] : []),
    { id: 'section-profile', label: s.navProfile },
    { id: 'section-questions', label: s.navQuestions },
    { id: 'section-rules', label: s.navRules },
    { id: 'section-guidance', label: s.navGuidance },
    { id: 'section-test', label: s.navTest },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#14162B]">{t.admin.aiServiceFinder}</h1>
        <p className="text-sm text-gray-500 mt-1">{s.pageSubtitle}</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="lg:flex lg:items-start lg:gap-10">
        <SettingsNav items={navItems} />

        <div className="flex-1 min-w-0 max-w-4xl space-y-6">

      <section id="section-guide" className="rounded-xl border border-[#E5E7EB] bg-[#F7F7FE] overflow-hidden scroll-mt-6">
        <button
          onClick={() => setGuideOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-[#14162B]">
            <HelpCircle size={16} className="text-[#6355E4]" />
            {s.guideToggleLabel}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
        </button>
        {guideOpen && (
          <div className="px-4 pb-4 text-sm text-gray-600 space-y-3">
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 space-y-2">
              <p className="flex items-center gap-1.5 font-semibold text-[#14162B]">
                <Users size={14} className="text-[#6355E4]" />
                {s.guideCustomerViewHeading}
              </p>
              <p>{s.guideCustomerViewIntro}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{s.guideCustomerViewStep1}</li>
                <li>{s.guideCustomerViewStep2}</li>
                <li>{s.guideCustomerViewStep3}</li>
              </ul>
              <p className="text-gray-500">{s.guideCustomerViewNote}</p>
            </div>
            <p>
              {s.guideIntroPre}<strong>{s.guideIntroBold}</strong>{s.guideIntroPost}
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>{s.guideStep1Bold}</strong>{s.guideStep1Rest}</li>
              <li><strong>{s.guideStep2Bold}</strong>{s.guideStep2Rest}</li>
              <li><strong>{s.guideStep3Bold}</strong>{s.guideStep3Rest}</li>
              <li><strong>{s.guideStep4Bold}</strong>{s.guideStep4Rest}</li>
              <li>{s.guideStep5Pre}<strong>{s.guideStep5Bold}</strong>{s.guideStep5Post}</li>
              <li>{s.guideStep6Pre}<strong>{s.guideStep6Bold}</strong>{s.guideStep6Post}</li>
            </ol>
            <p className="text-gray-500">
              {s.guideFooterPre}<strong>{s.guideFooterBold}</strong>{s.guideFooterAgencyNote}{s.guideFooterMid}
              {' '}<Info size={12} className="inline align-text-bottom text-gray-400" />{s.guideFooterPost}
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label={s.statFinderActive} value={overview?.finderEnabled ? t.yes : t.no} />
        <StatCard label={s.statActiveQuestions} value={String(overview?.questionCount ?? 0)} />
        <StatCard label={s.statActiveRules} value={String(overview?.ruleCount ?? 0)} />
        <StatCard label={s.statApprovedGuidance} value={String(overview?.guidanceCount ?? 0)} />
      </section>

      {overview?.budget && (
        <section id="section-budget" className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 scroll-mt-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#14162B] flex items-center gap-1.5">
                {s.budgetHeading}
                <InfoTooltip text={s.budgetTooltip} />
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {fillTemplate(s.budgetUsageTemplate, {
                  cost: overview.usage.cost.toLocaleString('de-DE', { minimumFractionDigits: 2 }),
                  budget: overview.budget.monthlyBudgetUsd.toLocaleString('de-DE', { minimumFractionDigits: 2 }),
                  requests: overview.usage.requests,
                })}
              </p>
            </div>
            {!overview.pendingBudgetRequest ? (
              <button
                type="button"
                onClick={() => { setBudgetRequestOpen(true); setBudgetRequestError(null); }}
                className="rounded-lg border border-[#6355E4] px-3 py-1.5 text-xs font-semibold text-[#6355E4] hover:bg-[#6355E4]/5"
              >
                {s.requestMoreBudgetBtn}
              </button>
            ) : (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                {fillTemplate(s.pendingRequestTemplate, { amount: overview.pendingBudgetRequest.requestedBudgetUsd?.toLocaleString('de-DE', { minimumFractionDigits: 2 }) ?? '–' })}
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${overview.budget.isHardCapped ? 'bg-red-500' : overview.budget.percentUsed >= 80 ? 'bg-amber-500' : 'bg-[#6355E4]'}`}
              style={{ width: `${Math.min(100, overview.budget.percentUsed)}%` }}
            />
          </div>
          {overview.budget.isHardCapped && (
            <p className="text-xs text-red-600">{s.budgetCappedWarning}</p>
          )}
        </section>
      )}

      {budgetRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !submittingBudgetRequest && setBudgetRequestOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#14162B]">{s.requestMoreBudgetBtn}</h3>
            <p className="text-xs text-gray-500">{s.budgetModalDesc}</p>
            <label className="block text-sm font-medium text-gray-700">
              {s.desiredBudgetLabel}
              <input
                type="number"
                min={0}
                step={0.01}
                value={budgetRequestAmount}
                onChange={(e) => setBudgetRequestAmount(e.target.value)}
                placeholder={s.budgetAmountPlaceholder}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {s.messageOptionalLabel}
              <textarea
                value={budgetRequestNote}
                onChange={(e) => setBudgetRequestNote(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            {budgetRequestError && <p className="text-sm text-red-600">{budgetRequestError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setBudgetRequestOpen(false)} disabled={submittingBudgetRequest} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">{t.cancel}</button>
              <button type="button" onClick={handleSubmitBudgetRequest} disabled={submittingBudgetRequest} className="rounded-lg bg-[#6355E4] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {submittingBudgetRequest ? s.sendingEllipsis : s.sendRequestBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <section id="section-profile" className="rounded-xl border border-gray-200 bg-white p-4 space-y-4 scroll-mt-6">
        <h2 className="text-lg font-semibold text-[#14162B] flex items-center gap-1.5">
          {s.navProfile}
          <InfoTooltip text={
            <>
              {s.profileTooltipPart1}
              <br /><br />
              <strong>{s.profileTooltipBold}</strong>{s.profileTooltipPart2}
            </>
          } />
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{s.mainIndustryLabel}</label>
            <select
              value={settings?.primaryIndustryProfileId ?? ''}
              onChange={(event) => {
                setSettings((prev) => prev
                  ? { ...prev, primaryIndustryProfileId: event.target.value }
                  : null);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">{s.pleaseChooseOption}</option>
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
            <label htmlFor="finder-enabled" className="text-sm text-gray-700">{s.showFinderPubliclyLabel}</label>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{s.activeCapabilitiesLabel}</p>
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
          {savingSettings ? s.savingDotsEllipsis : s.saveProfileBtn}
        </button>
      </section>

      <JsonEditorCard
        id="section-questions"
        title={s.navQuestions}
        value={questionsJson}
        onChange={setQuestionsJson}
        onSave={() => void saveQuestions()}
        saving={savingQuestions}
        tooltip={
          <>
            {s.qTooltipIntroPre} <code>displayOrder</code>{s.qTooltipIntroPost}
            <br /><br />
            <strong>answerType</strong>: {s.qAnswerTypeIntro} <code>SingleChoice</code>, <code>MultiChoice</code>
            {' '}{s.qOptionsViaPrefix} <code>configJson: {`{"options":["Option A","Option B"]}`}</code>), <code>YesNo</code>,
            <code> Number</code>, <code>FreeText</code>, <code>DateRange</code>, <code>PriceRange</code>,
            <code> DurationRange</code>. <em>{s.qNotYetSupportedLabel}</em> <code>EmployeeChoice</code>,{' '}
            <code>ImageUpload</code> {s.qComingSoonNote}
            <br /><br />
            <code>questionKey</code> {s.qKeyUniqueNote}
            <code> isActive: false</code> {s.qActiveFalseNote}
          </>
        }
      />

      <JsonEditorCard
        id="section-rules"
        title={s.navRules}
        value={rulesJson}
        onChange={setRulesJson}
        onSave={() => void saveRules()}
        saving={savingRules}
        tooltip={
          <>
            {s.rTooltipIntro}
            <br /><br />
            <strong>conditionJson</strong> {s.rConditionIntro}{' '}
            <code>{`{"questionKey":"anlass","operator":"equals","value":"hochzeit"}`}</code>. {s.rOperatorsIntro}
            {' '}equals, notEquals, contains, in, exists, greaterThan, lessThan. {s.rCombineIntro}{' '}
            <code>{`{"all":[...]}`}</code> {s.rCombineAllNote} <code>{`{"any":[...]}`}</code> {s.rCombineAnyNote}
            <br /><br />
            <strong>resultJson</strong> {s.rResultIntro} <code>{`{"score":10}`}</code> {s.rScoreNote}{' '}
            <code>{`{"exclude":true}`}</code> {s.rExcludeNote}{' '}
            <code>serviceIds</code> {s.rServiceIdsNote} <code>serviceId</code> {s.rServiceIdNote}
            <br /><br />
            {s.rTestNote}
          </>
        }
      />

      <JsonEditorCard
        id="section-guidance"
        title={s.navGuidance}
        value={guidanceJson}
        onChange={setGuidanceJson}
        onSave={() => void saveGuidance()}
        saving={savingGuidance}
        tooltip={
          <>
            {s.gTooltipIntro}{' '}
            <code>serviceId</code>{s.gTooltipServiceIdNote}
            <br /><br />
            {s.gTooltipShownOnlyIntro} <code>isActive: true</code> {s.gTooltipAndNote} <code>approvalStatus: &quot;Approved&quot;</code>{' '}
            {s.gTooltipSetNote} <code>validFrom</code>/<code>validTo</code>{s.gTooltipValidToNote}
          </>
        }
      />

      <section id="section-test" className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 scroll-mt-6">
        <h2 className="text-lg font-semibold text-[#14162B] flex items-center gap-1.5">
          {s.navTest}
          <InfoTooltip text={
            <>
              {s.testTooltipPart1}
              <br /><br />
              {s.testTooltipFormatIntro} <code>{`[{"key":"anlass","value":"hochzeit"}]`}</code> {s.testTooltipKeyNote} <code>key</code> {s.testTooltipMustMatch}{' '}
              <code>questionKey</code> {s.testTooltipFromQuestions}
            </>
          } />
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{s.answersJsonLabel}</label>
          <textarea
            value={answerJson}
            onChange={(event) => setAnswerJson(event.target.value)}
            className="w-full min-h-[130px] rounded-lg border border-gray-300 p-3 font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{s.freeTextLabel}</label>
          <input
            value={freeText}
            onChange={(event) => setFreeText(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder={s.freeTextPlaceholder}
          />
        </div>

        <button
          onClick={() => void runPreview()}
          disabled={previewing}
          className="rounded-lg bg-[#17A398] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {previewing ? s.testingEllipsis : s.runPreviewBtn}
        </button>

        {preview && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <p className="text-sm text-gray-700"><strong>{s.previewAnswerLabel}</strong> {preview.message}</p>
            <p className="text-sm text-gray-700"><strong>{s.previewRecommendationsLabel}</strong> {preview.recommendations.map((r) => r.serviceName).join(', ') || s.previewNoneFallback}</p>
            <p className="text-sm text-gray-700"><strong>{s.previewMissingQuestionsLabel}</strong> {preview.missingQuestions.map((q) => q.questionText).join(', ') || s.previewNoneFallback}</p>
            <p className="text-sm text-gray-700"><strong>{s.previewFallbackLabel}</strong> {preview.usedAiFallback ? t.yes : t.no}</p>
          </div>
        )}
      </section>

        </div>
      </div>
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
  id,
  title,
  value,
  onChange,
  onSave,
  saving,
  tooltip,
}: {
  id?: string;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  tooltip?: ReactNode;
}) {
  const { t } = useTranslation();
  const s = t.admin.aiServiceFinderPage;
  return (
    <section id={id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 scroll-mt-6">
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
        {saving ? s.savingDotsEllipsis : t.save}
      </button>
    </section>
  );
}
