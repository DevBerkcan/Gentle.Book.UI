// app/superadmin/agency-ai-costs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, RefreshCw, AlertTriangle, ArrowUpDown, ArrowRight } from 'lucide-react';
import { superAdminApi, AgencyAiOverview } from '@/lib/api/superadmin';
import { HelpTip } from '@/components/ui/help-tip';

type SortKey = 'percentUsed' | 'currentPeriodCostUsd' | 'negotiatedMonthlyPriceEur' | 'companyName';

export default function AgencyAiCostsPage() {
  const [data, setData] = useState<AgencyAiOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('percentUsed');
  const [sortDesc, setSortDesc] = useState(true);

  const load = () => {
    setLoading(true);
    setLoadError('');
    superAdminApi.getAgencyAiOverview()
      .then(setData)
      .catch(() => setLoadError('KI-Kosten-Übersicht konnte nicht geladen werden.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc((v) => !v);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const sortedTenants = data
    ? [...data.tenants].sort((a, b) => {
        const av = a[sortKey] ?? -1;
        const bv = b[sortKey] ?? -1;
        const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
        return sortDesc ? -cmp : cmp;
      })
    : [];

  const maxTrendCost = Math.max(...(data?.trend.map((t) => t.cost) ?? [0]), 0.01);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={22} className="text-[#6355E4]" /> KI-Kosten (Agency)
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Plattformweite OpenAI-Kosten über alle Agency-Kunden — nur Agency verursacht überhaupt echte KI-Kosten, andere Pläne nie.
          </p>
        </div>
        <button
          onClick={load}
          aria-label="Aktualisieren"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors shadow-sm border border-gray-100"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
          <AlertTriangle size={16} /> {loadError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : data && (
        <>
          {/* Stat tiles */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                Ausgaben diesen Monat
                <HelpTip text="Summe der tatsächlichen OpenAI-Kosten aller Agency-Tenants seit Monatsbeginn." />
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalSpendThisMonth.toLocaleString('de-DE', { minimumFractionDigits: 2 })} $</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                Worst Case, falls alle ihr Limit ausschöpfen
                <HelpTip text="Summe aller individuellen/Standard-Monatsbudgets über alle Agency-Tenants — die theoretische Kostenobergrenze der Plattform in diesem Monat, wenn jeder Kunde sein Limit voll nutzt." />
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{data.worstCaseIfAllCapped.toLocaleString('de-DE', { minimumFractionDigits: 2 })} $</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400">Agency-Tenants</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.agencyTenantCount}</p>
            </div>
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">6-Monats-Trend</p>
            <div className="flex items-end gap-2 h-32">
              {data.trend.map((t) => (
                <div key={`${t.year}-${t.month}`} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">{t.cost > 0 ? `${t.cost.toLocaleString('de-DE', { minimumFractionDigits: 2 })} $` : ''}</span>
                  <div className="w-full bg-[#6355E4]/20 rounded-t" style={{ height: `${Math.max(4, (t.cost / maxTrendCost) * 96)}px` }} />
                  <span className="text-[10px] text-gray-400">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-tenant table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Pro Kunde: verhandelter Preis vs. KI-Verbrauch</p>
            </div>
            {sortedTenants.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Noch keine Agency-Kunden.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="px-5 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('companyName')}>
                        <span className="inline-flex items-center gap-1">Kunde <ArrowUpDown size={11} /></span>
                      </th>
                      <th className="px-5 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('negotiatedMonthlyPriceEur')}>
                        <span className="inline-flex items-center gap-1">Verhandelter Preis <ArrowUpDown size={11} /></span>
                      </th>
                      <th className="px-5 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('currentPeriodCostUsd')}>
                        <span className="inline-flex items-center gap-1">KI-Kosten (Monat) <ArrowUpDown size={11} /></span>
                      </th>
                      <th className="px-5 py-2.5 font-medium">Budget</th>
                      <th className="px-5 py-2.5 font-medium cursor-pointer select-none" onClick={() => toggleSort('percentUsed')}>
                        <span className="inline-flex items-center gap-1">Auslastung <ArrowUpDown size={11} /></span>
                      </th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTenants.map((t) => (
                      <tr key={t.tenantId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-5 py-3 font-medium text-gray-900">{t.companyName}</td>
                        <td className="px-5 py-3 text-gray-600">
                          {t.negotiatedMonthlyPriceEur != null ? `${t.negotiatedMonthlyPriceEur.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : '–'}
                        </td>
                        <td className="px-5 py-3 text-gray-600">{t.currentPeriodCostUsd.toLocaleString('de-DE', { minimumFractionDigits: 2 })} $</td>
                        <td className="px-5 py-3 text-gray-400">{t.monthlyBudgetUsd.toLocaleString('de-DE', { minimumFractionDigits: 2 })} $</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            t.percentUsed >= 100 ? 'bg-red-100 text-red-700' : t.percentUsed >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {t.percentUsed}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/superadmin/tenants/${t.tenantId}`} className="text-gray-300 hover:text-gray-600 inline-flex">
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
