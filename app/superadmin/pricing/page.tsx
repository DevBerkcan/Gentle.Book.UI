'use client';

import { useEffect, useState } from 'react';
import { Euro, RefreshCw, Save, CheckCircle, Info, Users, Layers } from 'lucide-react';
import { superAdminApi, PlanPriceItem } from '@/lib/api/superadmin';

const PLAN_COLORS: Record<string, { color: string; bg: string }> = {
  Starter:      { color: '#3b82f6', bg: '#eff6ff' },
  Professional: { color: '#8b5cf6', bg: '#f5f3ff' },
  Agency:       { color: '#f59e0b', bg: '#fffbeb' },
};

export default function PlanPricingPage() {
  const [plans, setPlans] = useState<PlanPriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { monthly: string; annual: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedPlan, setSavedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const items = await superAdminApi.getPlanPricing();
      setPlans(items);
      setDrafts(Object.fromEntries(items.map(p => [p.plan, { monthly: String(p.monthlyPrice), annual: String(p.annualPrice) }])));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Preise konnten nicht geladen werden');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(plan: string) {
    const monthlyValue = parseFloat((drafts[plan]?.monthly ?? '').replace(',', '.'));
    const annualValue = parseFloat((drafts[plan]?.annual ?? '').replace(',', '.'));
    if (isNaN(monthlyValue) || monthlyValue < 0 || isNaN(annualValue) || annualValue < 0) {
      setError('Bitte gültige Preise eingeben.');
      return;
    }
    setSaving(plan);
    setError('');
    try {
      await superAdminApi.updatePlanPricing(plan, monthlyValue, annualValue);
      setPlans(prev => prev.map(p => (p.plan === plan ? { ...p, monthlyPrice: monthlyValue, annualPrice: annualValue } : p)));
      setSavedPlan(plan);
      setTimeout(() => setSavedPlan(null), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Preis konnte nicht gespeichert werden');
    }
    setSaving(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preise</h1>
          <p className="text-gray-400 text-sm mt-0.5">Monats- und Jahrespreise der Pläne verwalten</p>
        </div>
        <button
          onClick={load}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg border border-gray-100 shadow-sm transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-white border border-[#C7D2FE] rounded-2xl p-4 flex gap-3">
        <Info size={18} className="text-[#6355E4] shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600 leading-relaxed">
          Preisänderungen gelten <strong>sofort für neue Buchungen</strong> — sobald ein neuer Kunde einen Plan
          per SEPA abonniert, wird der hier hinterlegte Preis verwendet. Bestehende Kunden mit aktivem Mollie-Abo
          behalten ihren bisherigen Preis unverändert, da der Betrag bei Vertragsschluss bei Mollie fest hinterlegt
          wird und sich nicht rückwirkend ändert.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Plan cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const cfg = PLAN_COLORS[p.plan] ?? { color: '#6355E4', bg: '#EEEBFC' };
            const draft = drafts[p.plan];
            const monthlyDirty = draft !== undefined && parseFloat((draft.monthly || '0').replace(',', '.')) !== p.monthlyPrice;
            const annualDirty = draft !== undefined && parseFloat((draft.annual || '0').replace(',', '.')) !== p.annualPrice;
            const dirty = monthlyDirty || annualDirty;
            const annualPerMonth = Math.round((parseFloat((draft?.annual || '0').replace(',', '.')) || 0) / 12);
            return (
              <div key={p.plan} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                    <Euro size={18} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{p.displayName}</p>
                    <p className="text-xs text-gray-400">{p.plan}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} /> {p.maxEmployees >= 2147483647 ? 'Unbegrenzt' : p.maxEmployees} Mitarbeiter
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers size={12} /> {p.maxServices >= 2147483647 ? 'Unbegrenzt' : p.maxServices} Services
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Monatspreis</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={draft?.monthly ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [p.plan]: { monthly: e.target.value, annual: d[p.plan]?.annual ?? '' } }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Jahrespreis</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={draft?.annual ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [p.plan]: { monthly: d[p.plan]?.monthly ?? '', annual: e.target.value } }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    </div>
                  </div>
                </div>
                {draft?.annual && (
                  <p className="text-xs text-gray-400 mt-1.5">≈ €{annualPerMonth}/Monat bei jährlicher Zahlung</p>
                )}
                <button
                  onClick={() => handleSave(p.plan)}
                  disabled={saving === p.plan || !dirty}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[#6355E4] text-white hover:bg-[#5646D6] disabled:opacity-40 transition-colors"
                >
                  {saving === p.plan ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : savedPlan === p.plan ? (
                    <CheckCircle size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  {saving === p.plan ? 'Speichern...' : savedPlan === p.plan ? 'Gespeichert' : 'Speichern'}
                </button>
                {savedPlan === p.plan && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle size={11} /> Gespeichert — gilt ab sofort für neue Kunden
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
