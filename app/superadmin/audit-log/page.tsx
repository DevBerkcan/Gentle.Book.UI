'use client';

import { useEffect, useState, useCallback } from 'react';
import { ScrollText, Search, RefreshCw, User, Shield, Server } from 'lucide-react';
import { superAdminApi, AuditLogItem, TenantListItem } from '@/lib/api/superadmin';

const ACTOR_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  SuperAdmin: { label: 'SuperAdmin', cls: 'bg-purple-50 text-purple-700 border border-purple-200', icon: <Shield size={11} /> },
  TenantAdmin:{ label: 'TenantAdmin', cls: 'bg-blue-50 text-blue-700 border border-blue-200', icon: <User size={11} /> },
  Employee:   { label: 'Mitarbeiter', cls: 'bg-teal-50 text-teal-700 border border-teal-200', icon: <User size={11} /> },
  System:     { label: 'System', cls: 'bg-gray-100 text-gray-600 border border-gray-200', icon: <Server size={11} /> },
};

function formatDate(s: string) {
  return new Date(s).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AuditLogPage() {
  const [logs,    setLogs]    = useState<AuditLogItem[]>([]);
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const PAGE_SIZE = 50;

  const [filterTenant, setFilterTenant] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [search,       setSearch]       = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [res, tRes] = await Promise.all([
        superAdminApi.getAuditLog({
          tenantId: filterTenant || undefined,
          action: filterAction || undefined,
          page: p,
          pageSize: PAGE_SIZE,
        }),
        superAdminApi.getTenants(1, 200),
      ]);
      setLogs(res.items);
      setTotal(res.totalCount);
      setTenants(tRes.items);
    } catch {
      // silent
    }
    setLoading(false);
  }, [filterAction, filterTenant]);

  useEffect(() => { void load(1); setPage(1); }, [filterTenant, filterAction, load]);
  useEffect(() => { void load(page); }, [page, load]);

  const filtered = search
    ? logs.filter(l =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        (l.details ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.actorName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.entityType ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit-Log</h1>
          <p className="text-gray-400 text-sm mt-0.5">Alle administrativen Aktionen auf der Plattform</p>
        </div>
        <button
          onClick={() => load(page)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg border border-gray-100 shadow-sm transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
              placeholder="Aktion, Details, Akteur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            value={filterTenant}
            onChange={e => setFilterTenant(e.target.value)}
          >
            <option value="">Alle Systeme</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.companyName || t.name}</option>
            ))}
          </select>
          <input
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white w-48"
            placeholder="Aktion filtern (z.B. subscription)"
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ScrollText size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">Keine Einträge gefunden</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white text-xs font-medium uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Aktion</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Details</th>
                <th className="px-4 py-3 text-left">Akteur</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Entität</th>
                <th className="px-4 py-3 text-left">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(log => {
                const ac = ACTOR_CFG[log.actorType] ?? ACTOR_CFG['System'];
                return (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium text-gray-900">{log.action}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-600 text-xs truncate max-w-[280px]">{log.details || '–'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${ac.cls}`}>
                        {ac.icon}{log.actorName || ac.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-gray-500">{log.entityType ?? '–'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">{total} Einträge · Seite {page} von {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Zurück
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Weiter →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
