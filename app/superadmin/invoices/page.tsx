'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import {
  FileText, Search, RefreshCw, Download, CheckCircle, XCircle, Euro, Send,
  ChevronDown, Package, Loader2,
} from 'lucide-react';
import { superAdminApi, InvoiceItem } from '@/lib/api/superadmin';
import { getSuperAdminToken } from '@/lib/auth/storage';

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Every invoice a customer has ever been charged is small in number (one per billing period) —
// a single large page covers the realistic lifetime of any tenant without needing real
// pagination here, unlike the old flat table this replaces.
const ALL_INVOICES_PAGE_SIZE = 1000;

interface CustomerGroup {
  tenantId: string;
  companyName: string;
  tenantSlug: string;
  invoices: InvoiceItem[];
  totalAmount: number;
  sentCount: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [zippingTenantId, setZippingTenantId] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getInvoices({ page: 1, pageSize: ALL_INVOICES_PAGE_SIZE });
      setInvoices(res.items);
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo<CustomerGroup[]>(() => {
    const byTenant = new Map<string, CustomerGroup>();
    for (const inv of invoices) {
      let g = byTenant.get(inv.tenantId);
      if (!g) {
        g = { tenantId: inv.tenantId, companyName: inv.companyName, tenantSlug: inv.tenantSlug, invoices: [], totalAmount: 0, sentCount: 0 };
        byTenant.set(inv.tenantId, g);
      }
      g.invoices.push(inv);
      g.totalAmount += inv.amount;
      if (inv.emailSent) g.sentCount += 1;
    }
    for (const g of byTenant.values()) {
      g.invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }
    return [...byTenant.values()].sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [invoices]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g =>
      g.companyName.toLowerCase().includes(q) ||
      g.tenantSlug.toLowerCase().includes(q) ||
      g.invoices.some(i => i.invoiceNumber.toLowerCase().includes(q) || i.molliePaymentId.toLowerCase().includes(q))
    );
  }, [groups, search]);

  // A search hit on an invoice (not the company name itself) is only useful if that customer's
  // row is actually open — auto-expand so the match is visible instead of hidden in a collapsed card.
  useEffect(() => {
    if (!search.trim()) return;
    setExpanded(prev => {
      const next = new Set(prev);
      for (const g of filteredGroups) next.add(g.tenantId);
      return next;
    });
  }, [search, filteredGroups]);

  function toggle(tenantId: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(tenantId)) next.delete(tenantId); else next.add(tenantId);
      return next;
    });
  }

  async function fetchPdfBlob(invoiceId: string): Promise<Blob> {
    const token = getSuperAdminToken();
    const res = await fetch(superAdminApi.invoicePdfUrl(invoiceId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Download fehlgeschlagen');
    return res.blob();
  }

  async function downloadPdf(inv: InvoiceItem) {
    setDownloadingId(inv.id);
    try {
      const blob = await fetchPdfBlob(inv.id);
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

  async function downloadAllForTenant(group: CustomerGroup) {
    setZipError(null);
    setZippingTenantId(group.tenantId);
    try {
      const zip = new JSZip();
      // Sequential, not Promise.all — this hits the same API with a handful of authenticated
      // requests; a tenant with many years of invoices shouldn't fire them all at once.
      for (const inv of group.invoices) {
        const blob = await fetchPdfBlob(inv.id);
        zip.file(`Rechnung-${inv.invoiceNumber}.pdf`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `Rechnungen-${group.tenantSlug}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      setZipError(`Download für ${group.companyName} fehlgeschlagen. Bitte erneut versuchen.`);
    }
    setZippingTenantId(null);
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

  const totalInvoices = invoices.length;
  const totalAmountAll = invoices.reduce((sum, i) => sum + i.amount, 0);
  const sentCountAll = invoices.filter(i => i.emailSent).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
          <p className="text-gray-400 text-sm mt-0.5">Pro Kunde gruppiert — ideal für die Übergabe an den Steuerberater</p>
        </div>
        <button
          onClick={() => load()}
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
            <p className="text-xl font-bold text-gray-900">{totalInvoices}</p>
            <p className="text-xs text-gray-400">Rechnungen · {groups.length} Kunden</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <Euro size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalAmountAll.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
            <p className="text-xs text-gray-400">Summe gesamt</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <CheckCircle size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{sentCountAll} / {totalInvoices}</p>
            <p className="text-xs text-gray-400">Per E-Mail versendet</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            placeholder="Kunde, Buchungssystem-ID, Rechnungsnr., Mollie-Zahlung…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {zipError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {zipError}
        </div>
      )}

      {/* Customer groups */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FileText size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">Keine Rechnungen gefunden</p>
          <p className="text-xs text-gray-400 mt-1">Rechnungen entstehen automatisch bei jeder bezahlten Mollie-Abo-Zahlung.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map(group => {
            const isOpen = expanded.has(group.tenantId);
            const isZipping = zippingTenantId === group.tenantId;
            return (
              <div key={group.tenantId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Customer row */}
                <div className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50/70 transition-colors">
                  <button
                    onClick={() => toggle(group.tenantId)}
                    className="flex flex-1 items-center gap-3 min-w-0 text-left"
                  >
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{group.companyName}</p>
                      <p className="text-xs text-gray-400 font-mono">{group.tenantSlug}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-5 shrink-0">
                    <button onClick={() => toggle(group.tenantId)} className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-gray-900">{group.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
                      <p className="text-xs text-gray-400">{group.invoices.length} Rechnung{group.invoices.length === 1 ? '' : 'en'}</p>
                    </button>
                    <button
                      onClick={() => { if (!isZipping) void downloadAllForTenant(group); }}
                      disabled={isZipping}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      title="Alle Rechnungen dieses Kunden als ZIP herunterladen"
                    >
                      {isZipping ? <Loader2 size={13} className="animate-spin" /> : <Package size={13} />}
                      Alle herunterladen
                    </button>
                  </div>
                </div>

                {/* Invoices for this customer */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 text-xs font-medium uppercase tracking-wide">
                          <th className="px-5 py-2.5 text-left">Rechnungsnr.</th>
                          <th className="px-5 py-2.5 text-left hidden md:table-cell">Plan</th>
                          <th className="px-5 py-2.5 text-left hidden lg:table-cell">Zeitraum</th>
                          <th className="px-5 py-2.5 text-right">Betrag</th>
                          <th className="px-5 py-2.5 text-left">E-Mail</th>
                          <th className="px-5 py-2.5 text-left hidden lg:table-cell">Datum</th>
                          <th className="px-5 py-2.5 text-right">PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {group.invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-mono font-medium text-gray-900">{inv.invoiceNumber}</p>
                              <p className="text-xs text-gray-400 font-mono">{inv.molliePaymentId}</p>
                            </td>
                            <td className="px-5 py-3 hidden md:table-cell">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">
                                {inv.planName}
                              </span>
                            </td>
                            <td className="px-5 py-3 hidden lg:table-cell">
                              <p className="text-xs text-gray-500">{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</p>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <p className="font-semibold text-gray-900">{inv.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} {inv.currency}</p>
                            </td>
                            <td className="px-5 py-3">
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
                            <td className="px-5 py-3 hidden lg:table-cell">
                              <p className="text-xs text-gray-400">{formatDate(inv.issueDate)}</p>
                            </td>
                            <td className="px-5 py-3 text-right">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
