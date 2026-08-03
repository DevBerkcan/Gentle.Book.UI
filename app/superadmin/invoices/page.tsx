'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Search, RefreshCw, Download, CheckCircle, XCircle, Euro, Send } from 'lucide-react';
import { superAdminApi, InvoiceItem, TenantListItem } from '@/lib/api/superadmin';
import { getSuperAdminToken } from '@/lib/auth/storage';

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [tenants,  setTenants]  = useState<TenantListItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page,     setPage]     = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const PAGE_SIZE = 50;

  const [filterTenant, setFilterTenant] = useState('');
  const [search,       setSearch]       = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [res, tRes] = await Promise.all([
        superAdminApi.getInvoices({ tenantId: filterTenant || undefined, page: p, pageSize: PAGE_SIZE }),
        superAdminApi.getTenants(1, 200),
      ]);
      setInvoices(res.items);
      setTotal(res.totalCount);
      setTotalAmount(res.totalAmount);
      setTenants(tRes.items);
    } catch {
      // silent
    }
    setLoading(false);
  }, [filterTenant]);

  useEffect(() => { void load(1); setPage(1); }, [filterTenant, load]);
  useEffect(() => { void load(page); }, [page, load]);

  async function downloadPdf(inv: InvoiceItem) {
    setDownloadingId(inv.id);
    try {
      const token = getSuperAdminToken();
      const res = await fetch(superAdminApi.invoicePdfUrl(inv.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download fehlgeschlagen');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Rechnung-${inv.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      // silent
    }
    setDownloadingId(null);
  }

  async function resendInvoice(inv: InvoiceItem) {
    setResendingId(inv.id);
    try {
      await superAdminApi.resendInvoice(inv.id);
    } catch {
      // silent
    }
    setResendingId(null);
  }

  const filtered = search
    ? invoices.filter(i =>
        i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.companyName.toLowerCase().includes(search.toLowerCase()) ||
        i.molliePaymentId.toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const sentCount = invoices.filter(i => i.emailSent).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
          <p className="text-gray-400 text-sm mt-0.5">Alle von GentleBook ausgestellten Abo-Rechnungen</p>
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
            <FileText size={18} className="text-gray-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-400">Rechnungen gesamt</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <Euro size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
            <p className="text-xs text-gray-400">Summe (gefiltert)</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <CheckCircle size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{sentCount} / {invoices.length}</p>
            <p className="text-xs text-gray-400">Auf dieser Seite per E-Mail versendet</p>
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
              placeholder="Rechnungsnr., Firma, Mollie-Zahlung…"
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
          <FileText size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">Keine Rechnungen gefunden</p>
          <p className="text-xs text-gray-400 mt-1">Rechnungen entstehen automatisch bei jeder bezahlten Mollie-Abo-Zahlung.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white text-xs font-medium uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Rechnungsnr.</th>
                <th className="px-4 py-3 text-left">System</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Plan</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Zeitraum</th>
                <th className="px-4 py-3 text-right">Betrag</th>
                <th className="px-4 py-3 text-left">E-Mail</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Datum</th>
                <th className="px-4 py-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-mono font-medium text-gray-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-400 font-mono">{inv.molliePaymentId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{inv.companyName}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">
                      {inv.planName}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-gray-500">{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-gray-900">{inv.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} {inv.currency}</p>
                  </td>
                  <td className="px-4 py-3">
                    {inv.emailSent ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle size={11} /> Versendet
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit bg-red-50 text-red-700 border border-red-200">
                          <XCircle size={11} /> Nicht versendet
                        </span>
                        <button
                          onClick={() => resendInvoice(inv)}
                          disabled={resendingId === inv.id}
                          className="p-1 text-gray-400 hover:text-[#6355E4] hover:bg-[#EEEBFC] rounded-md transition-colors disabled:opacity-40"
                          title="Erneut versenden"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-gray-400">{formatDate(inv.issueDate)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => downloadPdf(inv)}
                      disabled={downloadingId === inv.id}
                      className="p-1.5 text-gray-400 hover:text-[#6355E4] hover:bg-[#EEEBFC] rounded-lg transition-colors disabled:opacity-40"
                      title="PDF herunterladen"
                    >
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">{total} Rechnungen · Seite {page} von {totalPages}</p>
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
