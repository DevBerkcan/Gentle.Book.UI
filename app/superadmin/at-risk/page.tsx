'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, XCircle, RefreshCw, Clock, ArrowRight, Mail } from 'lucide-react';
import { superAdminApi, AtRiskCancellingItem, AtRiskDunningItem } from '@/lib/api/superadmin';

function formatDate(s?: string) {
  if (!s) return '–';
  return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AtRiskPage() {
  const [cancelling, setCancelling] = useState<AtRiskCancellingItem[]>([]);
  const [dunning,     setDunning]   = useState<AtRiskDunningItem[]>([]);
  const [loading,     setLoading]   = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await superAdminApi.getAtRiskSubscriptions();
      setCancelling(res.cancelling);
      setDunning(res.dunning);
    } catch {
      // silent
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gefährdete Kunden</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gekündigte Abos und Zahlungsprobleme im Blick behalten</p>
        </div>
        <button
          onClick={load}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg border border-gray-100 shadow-sm transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Dunning ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle size={15} className="text-red-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Zahlung fehlgeschlagen (Mahnwesen)</h2>
                <p className="text-xs text-gray-400">Auto-Kündigung nach 7 Tagen ohne erfolgreiche Zahlung</p>
              </div>
            </div>
            {dunning.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Keine offenen Zahlungsprobleme</p>
            ) : (
              <div className="space-y-2">
                {dunning.map(d => (
                  <Link
                    key={d.tenantId}
                    href={`/superadmin/tenants/${d.tenantId}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Clock size={14} className="text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.companyName}</p>
                        <p className="text-xs text-gray-400">
                          {d.plan} · seit {formatDate(d.pastDueSince)} · {d.failedPaymentCount} fehlgeschlagene Zahlung(en)
                          {d.dunningWarningEmailSent && <span className="inline-flex items-center gap-1 ml-1"><Mail size={10} /> gewarnt</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        d.daysUntilAutoCancel <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        noch {d.daysUntilAutoCancel} {d.daysUntilAutoCancel === 1 ? 'Tag' : 'Tage'}
                      </span>
                      <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Cancelling ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircle size={15} className="text-gray-500" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Gekündigt (läuft aus)</h2>
                <p className="text-xs text-gray-400">Zugang bleibt bis zum Ende der bezahlten Periode bestehen</p>
              </div>
            </div>
            {cancelling.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Keine ausstehenden Kündigungen</p>
            ) : (
              <div className="space-y-2">
                {cancelling.map(c => (
                  <Link
                    key={c.tenantId}
                    href={`/superadmin/tenants/${c.tenantId}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <XCircle size={14} className="text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.companyName}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {c.plan} · gekündigt am {formatDate(c.cancelRequestedAt)}
                          {c.cancelReason && <span> · „{c.cancelReason}“</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-200 text-gray-700">
                        bis {formatDate(c.currentPeriodEnd)}
                      </span>
                      <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
