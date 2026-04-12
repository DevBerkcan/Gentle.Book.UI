'use client';

import { useEffect, useState, useCallback } from 'react';
import { Mail, CheckCircle, XCircle, Clock, Search, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import { superAdminApi, EmailLogItem, TenantListItem } from '@/lib/api/superadmin';

const EMAIL_TYPE_LABELS: Record<string, string> = {
  Confirmation:            'Buchungsbestätigung',
  Reminder:                'Erinnerung',
  Cancellation:            'Stornierung',
  AvailabilityNotification:'Verfügbarkeit',
};

const EMAIL_TYPE_COLORS: Record<string, string> = {
  Confirmation:            'bg-blue-100 text-blue-700',
  Reminder:                'bg-purple-100 text-purple-700',
  Cancellation:            'bg-red-100 text-red-700',
  AvailabilityNotification:'bg-teal-100 text-teal-700',
};

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  Sent:    { label: 'Gesendet',  cls: 'bg-green-50 text-green-700 border border-green-200',  icon: <CheckCircle size={11} /> },
  Failed:  { label: 'Fehler',   cls: 'bg-red-50 text-red-700 border border-red-200',        icon: <XCircle size={11} /> },
  Pending: { label: 'Ausstehend',cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200', icon: <Clock size={11} /> },
};

function formatDate(s: string) {
  return new Date(s).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EmailLogsPage() {
  const [logs,     setLogs]     = useState<EmailLogItem[]>([]);
  const [tenants,  setTenants]  = useState<TenantListItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [sentCount,  setSentCount]  = useState(0);
  const [failedCount,setFailedCount]= useState(0);
  const [page,     setPage]     = useState(1);
  const PAGE_SIZE = 50;

  const [filterTenant,    setFilterTenant]    = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');
  const [filterType,      setFilterType]      = useState('');
  const [search,          setSearch]          = useState('');

  async function load(p = page) {
    setLoading(true);
    try {
      const [res, tRes] = await Promise.all([
        superAdminApi.getEmailLogs({
          tenantId:  filterTenant  || undefined,
          status:    filterStatus  || undefined,
          emailType: filterType    || undefined,
          page: p,
          pageSize: PAGE_SIZE,
        }),
        superAdminApi.getTenants(1, 200),
      ]);
      setLogs(res.items);
      setTotal(res.totalCount);
      setSentCount(res.sentCount);
      setFailedCount(res.failedCount);
      setTenants(tRes.items);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { load(1); setPage(1); }, [filterTenant, filterStatus, filterType]);
  useEffect(() => { load(page); }, [page]);

  const filtered = search
    ? logs.filter(l =>
        l.recipientEmail.toLowerCase().includes(search.toLowerCase()) ||
        l.subject.toLowerCase().includes(search.toLowerCase()) ||
        l.companyName.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">E-Mail Logs</h1>
          <p className="text-gray-400 text-sm mt-0.5">Alle gesendeten E-Mails der Plattform</p>
        </div>
        <button
          onClick={() => load(page)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg border border-gray-100 shadow-sm transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
            <Mail size={18} className="text-gray-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-400">E-Mails gesamt</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{sentCount}</p>
            <p className="text-xs text-gray-400">Erfolgreich gesendet</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{failedCount}</p>
            <p className="text-xs text-gray-400">Fehlgeschlagen</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
              placeholder="E-Mail, Betreff, Firma…"
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
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Alle Status</option>
            <option value="Sent">Gesendet</option>
            <option value="Failed">Fehler</option>
            <option value="Pending">Ausstehend</option>
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">Alle Typen</option>
            <option value="Confirmation">Buchungsbestätigung</option>
            <option value="Reminder">Erinnerung</option>
            <option value="Cancellation">Stornierung</option>
            <option value="AvailabilityNotification">Verfügbarkeit</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Mail size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">Keine E-Mails gefunden</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white text-xs font-medium uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Empfänger</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Betreff</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">System</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Typ</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(log => {
                const sc = STATUS_CFG[log.status] ?? STATUS_CFG['Pending'];
                return (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{log.recipientEmail}</p>
                      {log.errorMessage && (
                        <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                          <AlertCircle size={10} /> {log.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-600 text-xs truncate max-w-[200px]">{log.subject}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-gray-600 text-xs">{log.companyName}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EMAIL_TYPE_COLORS[log.emailType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {EMAIL_TYPE_LABELS[log.emailType] ?? log.emailType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${sc.cls}`}>
                        {sc.icon}{sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-gray-400">{formatDate(log.sentAt ?? log.createdAt)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">{total} E-Mails · Seite {page} von {totalPages}</p>
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
