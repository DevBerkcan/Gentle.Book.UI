'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, XCircle, Download, Trash2 } from 'lucide-react';
import { superAdminApi, SuperAdminDataRequestItem } from '@/lib/api/superadmin';

const STATUS_TABS = ['Pending', 'Completed', 'Rejected', 'All'] as const;

function formatDate(s: string) {
  return new Date(s).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DataRequestsPage() {
  const [requests, setRequests] = useState<SuperAdminDataRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<typeof STATUS_TABS[number]>('Pending');
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (s: typeof STATUS_TABS[number]) => {
    setLoading(true);
    try {
      const data = await superAdminApi.getDataRequests(s);
      setRequests(data);
    } catch {
      setRequests([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(status); }, [status, load]);

  async function handleApprove(id: string) {
    if (!window.confirm('Diese Löschung ist unwiderruflich. Wirklich freigeben?')) return;
    setActingId(id);
    setError(null);
    try {
      await superAdminApi.approveDataRequest(id);
      await load(status);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Freigabe fehlgeschlagen.');
    }
    setActingId(null);
  }

  async function handleReject() {
    if (!rejectingId || !rejectReason.trim()) return;
    setActingId(rejectingId);
    setError(null);
    try {
      await superAdminApi.rejectDataRequest(rejectingId, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
      await load(status);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ablehnung fehlgeschlagen.');
    }
    setActingId(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Datenanfragen</h1>
          <p className="text-gray-400 text-sm mt-0.5">GDPR Art. 15/17 — Export-Historie &amp; zu prüfende Löschanfragen</p>
        </div>
        <button
          onClick={() => load(status)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg border border-gray-100 shadow-sm transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === tab ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab === 'Pending' ? 'Offen' : tab === 'Completed' ? 'Abgeschlossen' : tab === 'Rejected' ? 'Abgelehnt' : 'Alle'}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ShieldAlert size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">Keine Einträge in diesem Status</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md divide-y divide-gray-50">
          {requests.map(r => (
            <div key={r.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-xl ${r.type === 'Deletion' ? 'bg-red-50' : 'bg-blue-50'}`}>
                  {r.type === 'Deletion' ? <Trash2 size={16} className="text-red-500" /> : <Download size={16} className="text-blue-500" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {r.tenantName || r.tenantId} <span className="text-gray-400 font-normal">({r.tenantSlug})</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.type === 'Deletion' ? 'Löschanfrage (Art. 17)' : 'Datenexport (Art. 15)'} · {formatDate(r.requestedAt)}
                    {r.notes ? ` · ${r.notes}` : ''}
                  </p>
                </div>
              </div>

              {r.status === 'Pending' && r.type === 'Deletion' ? (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={actingId === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 size={13} /> Freigeben &amp; löschen
                  </button>
                  <button
                    onClick={() => { setRejectingId(r.id); setRejectReason(''); }}
                    disabled={actingId === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <XCircle size={13} /> Ablehnen
                  </button>
                </div>
              ) : (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : r.status === 'Rejected' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'
                }`}>
                  {r.status === 'Completed' ? 'Abgeschlossen' : r.status === 'Rejected' ? 'Abgelehnt' : 'Offen'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-gray-900">Löschanfrage ablehnen</h3>
            <p className="text-sm text-gray-500">Begründung (z.B. laufender Rechtsstreit, gesetzliche Aufbewahrungspflicht) — wird dem Mandanten per E-Mail mitgeteilt.</p>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 min-h-[100px]"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Begründung…"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actingId === rejectingId}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-50"
              >
                Ablehnen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
