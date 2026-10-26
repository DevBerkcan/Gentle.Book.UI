// app/admin/vouchers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Ticket, TrendingUp, AlertTriangle, Plus, X, Loader2, Search, Ban, Download } from "lucide-react";
import { adminApi, getVoucherPdfUrl, type AdminVoucher } from "@/lib/api/admin";
import { customersApi, type CustomerListItem } from "@/lib/api/customers";
import { getAccessToken } from "@/lib/auth/storage";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";
import { useConfirm } from "@/components/ConfirmDialog";

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

function getStatusLabel(t: Translations): Record<AdminVoucher["status"], { label: string; color: string; bg: string }> {
  const s = t.admin.vouchersPage;
  return {
    Active: { label: s.statusActive, color: "#059669", bg: "#ECFDF5" },
    Redeemed: { label: s.statusRedeemed, color: "#6B7280", bg: "#F3F4F6" },
    Expired: { label: s.statusExpired, color: "#D97706", bg: "#FFFBEB" },
    Cancelled: { label: s.statusCancelled, color: "#991B1B", bg: "#FEE2E2" },
  };
}

export default function AdminVouchersPage() {
  const { t } = useTranslation();
  const s = t.admin.vouchersPage;
  const STATUS_LABEL = getStatusLabel(t);
  const [vouchers, setVouchers] = useState<AdminVoucher[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ message?: string; currentPlan?: string; requiredPlan?: string }>({});
  const [search, setSearch] = useState("");

  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueType, setIssueType] = useState<"MonetaryValue" | "SessionPackage" | "PercentageDiscount">("MonetaryValue");
  const [amount, setAmount] = useState("");
  const [sessions, setSessions] = useState("");
  const [percentageValue, setPercentageValue] = useState("");
  const [percentageUses, setPercentageUses] = useState("1");
  const [note, setNote] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerListItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      const data = await adminApi.getVouchers();
      setVouchers(data);
    } catch (err: any) {
      if (err.response?.status === 402 && err.response?.data?.feature) {
        setNeedsUpgrade(true);
        setUpgradeInfo({
          message: err.response.data.message,
          currentPlan: err.response.data.currentPlan,
          requiredPlan: err.response.data.requiredPlan,
        });
      } else {
        setError(err.response?.data?.message || err.message || s.loadError);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (customerQuery.trim().length < 2) { setCustomerResults([]); return; }
    const t = setTimeout(() => {
      customersApi.search(customerQuery.trim()).then(setCustomerResults).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [customerQuery]);

  async function handleIssue() {
    setIssueError(null);
    if (issueType === "MonetaryValue" && (!amount || parseFloat(amount) <= 0)) {
      setIssueError(s.invalidAmountError); return;
    }
    if (issueType === "SessionPackage" && (!sessions || parseInt(sessions, 10) <= 0)) {
      setIssueError(s.invalidSessionsError); return;
    }
    if (issueType === "PercentageDiscount" && (!percentageValue || parseFloat(percentageValue) <= 0 || parseFloat(percentageValue) > 100)) {
      setIssueError(s.invalidPercentageError); return;
    }
    setIssuing(true);
    try {
      await adminApi.issueVoucher({
        type: issueType,
        customerId: selectedCustomer?.id ?? null,
        amount: issueType === "MonetaryValue" ? parseFloat(amount) : null,
        sessions: issueType === "SessionPackage" ? parseInt(sessions, 10) : issueType === "PercentageDiscount" ? (parseInt(percentageUses, 10) || 1) : null,
        percentageValue: issueType === "PercentageDiscount" ? parseFloat(percentageValue) : null,
        note: note.trim() || null,
      });
      setShowIssueForm(false);
      setAmount(""); setSessions(""); setPercentageValue(""); setPercentageUses("1"); setNote(""); setSelectedCustomer(null); setCustomerQuery("");
      await load();
    } catch (err: any) {
      setIssueError(err.response?.data?.message ?? s.issueFailedError);
    } finally {
      setIssuing(false);
    }
  }

  async function handleCancel(voucher: AdminVoucher) {
    const ok = await confirm({ title: s.cancelBtn, message: fillTemplate(s.confirmCancelTemplate, { code: voucher.code }), variant: "danger" });
    if (!ok) return;
    setBusyId(voucher.id);
    try {
      await adminApi.cancelVoucher(voucher.id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDownloadPdf(voucher: AdminVoucher) {
    setBusyId(voucher.id);
    try {
      const token = typeof window !== 'undefined' ? getAccessToken() : null;
      const res = await fetch(getVoucherPdfUrl(voucher.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(s.pdfDownloadFailed);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `gutschein-${voucher.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      alert(s.pdfDownloadFailed);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSearch() {
    try {
      setLoading(true);
      const data = await adminApi.getVouchers(search.trim() || undefined);
      setVouchers(data);
    } finally { setLoading(false); }
  }

  if (loading && !vouchers) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-[#EEEBFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket size={20} className="text-[#6355E4]" />
          </div>
          <h2 className="text-lg font-bold text-[#111318] mb-2">{s.upgradeTitle}</h2>
          {upgradeInfo.currentPlan && (
            <p className="text-xs text-[#9CA3AF] mb-3">
              {s.currentPlanLabel} <span className="font-semibold text-[#6B7280]">{upgradeInfo.currentPlan}</span>
            </p>
          )}
          <p className="text-sm text-[#6B7280] mb-6">
            {upgradeInfo.message ?? s.upgradeDefaultMessage}
          </p>
          <a href="/admin/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#4338CA] transition-colors">
            <TrendingUp size={15} /> {s.upgradeNowBtn}
          </a>
        </div>
      </div>
    );
  }

  if (error || !vouchers) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-sm">
          <div className="w-11 h-11 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={18} className="text-[#991B1B]" />
          </div>
          <p className="font-semibold text-[#111318] mb-1">{s.loadErrorTitle}</p>
          <p className="text-sm text-[#6B7280]">{error || s.unknownError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#111318] tracking-tight">{s.pageTitle}</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{s.pageSubtitle}</p>
          </div>
          <button
            onClick={() => setShowIssueForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6355E4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5548CE]"
          >
            {showIssueForm ? <X size={15} /> : <Plus size={15} />} {showIssueForm ? t.cancel : s.issueVoucherBtn}
          </button>
        </div>

        {showIssueForm && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-3">
            <div className="flex gap-2">
              <select value={issueType} onChange={(e) => setIssueType(e.target.value as any)} className={inputCls}>
                <option value="MonetaryValue">{s.typeMonetaryValue}</option>
                <option value="SessionPackage">{s.typeSessionPackage}</option>
                <option value="PercentageDiscount">{s.typePercentageDiscount}</option>
              </select>
              {issueType === "MonetaryValue" && (
                <input type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder={s.amountPlaceholder} className={inputCls} />
              )}
              {issueType === "SessionPackage" && (
                <input type="number" min={1} value={sessions} onChange={(e) => setSessions(e.target.value)}
                  placeholder={s.sessionsCountPlaceholder} className={inputCls} />
              )}
              {issueType === "PercentageDiscount" && (
                <input type="number" min={1} max={100} value={percentageValue} onChange={(e) => setPercentageValue(e.target.value)}
                  placeholder={s.percentageDiscountPlaceholder} className={inputCls} />
              )}
            </div>
            {issueType === "PercentageDiscount" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6B7280]">{s.usesCountLabel}</label>
                <input type="number" min={1} value={percentageUses} onChange={(e) => setPercentageUses(e.target.value)}
                  className={`${inputCls} max-w-[120px]`} />
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={selectedCustomer ? `${selectedCustomer.fullName}` : customerQuery}
                onChange={(e) => { setCustomerQuery(e.target.value); setSelectedCustomer(null); }}
                placeholder={s.customerSearchPlaceholder}
                className={inputCls}
              />
              {selectedCustomer && (
                <button onClick={() => { setSelectedCustomer(null); setCustomerQuery(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111318]">
                  <X size={14} />
                </button>
              )}
              {!selectedCustomer && customerResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden">
                  {customerResults.map((c) => (
                    <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerResults([]); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#F7F7F8]">
                      {c.fullName} {c.email && <span className="text-[#9CA3AF]">· {c.email}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={s.notePlaceholder} className={inputCls} />

            {issueError && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{issueError}</p>}

            <button
              onClick={handleIssue}
              disabled={issuing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
            >
              {issuing ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} {s.issueBtn}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={s.searchPlaceholder} className={inputCls}
          />
          <button onClick={handleSearch} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] hover:bg-[#F7F7F8]">
            <Search size={15} />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {vouchers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Ticket size={20} className="text-[#D1D5DB]" />
              </div>
              <p className="text-sm font-medium text-[#374151]">{s.noVouchersYet}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {vouchers.map((v) => {
                const statusInfo = STATUS_LABEL[v.status];
                return (
                  <div key={v.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm text-[#111318] tracking-wide">{v.code}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: statusInfo.color, background: statusInfo.bg }}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA3AF]">
                        {v.customerName ?? s.noCustomerAssigned} · {v.type === "MonetaryValue"
                          ? fillTemplate(s.monetaryRemainingTemplate, { remaining: v.remainingAmount?.toFixed(2) ?? '0.00', initial: v.initialAmount?.toFixed(2) ?? '0.00' })
                          : v.type === "PercentageDiscount"
                          ? fillTemplate(s.percentageRemainingTemplate, { percent: v.percentageValue ?? 0, remaining: v.remainingSessions ?? 0, initial: v.initialSessions ?? 0 })
                          : fillTemplate(s.sessionsRemainingTemplate, { remaining: v.remainingSessions ?? 0, initial: v.initialSessions ?? 0 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleDownloadPdf(v)}
                        disabled={busyId === v.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#6355E4] hover:bg-[#EEEBFC] px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                      >
                        <Download size={12} /> {s.downloadPdfBtn}
                      </button>
                      {v.status === "Active" && (
                        <button
                          onClick={() => handleCancel(v)}
                          disabled={busyId === v.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#991B1B] hover:bg-[#FEE2E2] px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          <Ban size={12} /> {s.cancelBtn}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {dialog}
    </div>
  );
}
