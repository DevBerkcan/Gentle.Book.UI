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
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedPlan, setSavedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const items = await superAdminApi.getPlanPricing();
      setPlans(items);
      setDrafts(Object.fromEntries(items.map(p => [p.plan, String(p.monthlyPrice)])));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Preise konnten nicht geladen werden');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(plan: string) {
    const value = parseFloat((drafts[plan] ?? '').replace(',', '.'));
    if (isNaN(value) || value < 0) {
      setError('Bitte einen gültigen Preis eingeben.');
      return;
    }
    setSaving(plan);
    setError('');
    try {
      await superAdminApi.updatePlanPricing(plan, value);
      setPlans(prev => prev.map(p => (p.plan === plan ? { ...p, monthlyPrice: value } : p)));
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
          <p className="text-gray-400 text-sm mt-0.5">Monatspreise der Pläne verwalten</p>
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
            const dirty = drafts[p.plan] !== undefined && parseFloat((drafts[p.plan] || '0').replace(',', '.')) !== p.monthlyPrice;
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

                <label className="text-xs font-semibold text-gray-500 mb-1.5">Monatspreis</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={drafts[p.plan] ?? ''}
                      onChange={(e) => setDrafts((d) => ({ ...d, [p.plan]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                  </div>
                  <button
                    onClick={() => handleSave(p.plan)}
                    disabled={saving === p.plan || !dirty}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[#6355E4] text-white hover:bg-[#5646D6] disabled:opacity-40 transition-colors"
                  >
                    {saving === p.plan ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : savedPlan === p.plan ? (
                      <CheckCircle size={14} />
                    ) : (
                      <Save size={14} />
                    )}
                  </button>
                </div>
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
