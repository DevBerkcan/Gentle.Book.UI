'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle, XCircle, AlertTriangle,
  Check, MessageCircle, Mail, Zap, Users, Star, Shield,
  BarChart2, Globe, ArrowRight, FileText, Download, Trash2,
} from 'lucide-react';
import api from '@/lib/api/client';
import { adminApi, TenantInvoiceItem, DataSubjectRequestItem } from '@/lib/api/admin';
import { HelpTip } from '@/components/ui/help-tip';
import { legalConfig, supportConfig } from '@/lib/config';
import { useConfirm } from '@/components/ConfirmDialog';
import { getAccessToken } from '@/lib/auth/storage';
import { useTranslation, fillTemplate } from '@/lib/i18n/LanguageContext';
import type { Translations } from '@/lib/i18n/translations';

interface Subscription {
  plan: string;
  status: string;
  interval?: string;
  trialStartedAt: string;
  trialEndsAt: string;
  trialDaysRemaining: number;
  isInTrial: boolean;
  isAccessAllowed: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelRequestedAt?: string;
}

interface Usage {
  plan: string;
  planDisplayName: string;
  employees: { current: number; limit: number; isUnlimited: boolean; percentage: number };
  services: { current: number; limit: number; isUnlimited: boolean; percentage: number };
}

interface AgencyOffer {
  id: string;
  requestedPlan: string;
  status: string;
  offeredMonthlyPrice: number;
  offeredAnnualPrice: number;
  offerExpiresAt: string;
  acceptedInterval?: 'Monthly' | 'Yearly';
}

function getStatusConfig(t: Translations): Record<string, { label: string; bg: string; text: string; icon: any }> {
  const s = t.admin.subscriptionPage;
  return {
    Trial:     { label: s.statusTrial,     bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Clock },
    Active:    { label: s.statusActive,    bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
    PastDue:   { label: s.statusPastDue,   bg: 'bg-red-50',    text: 'text-red-700',    icon: AlertTriangle },
    Cancelled: { label: s.statusCancelled, bg: 'bg-gray-100',  text: 'text-gray-600',   icon: XCircle },
    Expired:   { label: s.statusExpired,   bg: 'bg-red-50',    text: 'text-red-700',    icon: XCircle },
  };
}

const PLANS = [
  {
    name: 'Starter',
    price: 29,
    priceOnRequest: false,
    key: 'Starter',
    color: 'border-gray-200',
    highlight: false,
    employees: 2,
    services: 15,
    hasAnalytics: false,
  },
  {
    name: 'Pro',
    price: 59,
    priceOnRequest: false,
    key: 'Professional',
    color: 'border-[#6355E4]',
    highlight: true,
    employees: 10,
    services: 50,
    hasAnalytics: true,
  },
  {
    name: 'Agency',
    price: 0,
    priceOnRequest: true,
    key: 'Agency',
    color: 'border-gray-200',
    highlight: false,
    employees: null,
    services: null,
    hasAnalytics: true,
  },
];

function getPlanFeatures(t: Translations): Record<string, string[]> {
  const s = t.admin.subscriptionPage;
  return {
    Starter: [
      s.featStarterEmployees,
      s.featStarterServices,
      s.featBookingConfirmations,
      s.featBookingPage,
      s.featEmailReminders,
      s.featStarterSupport,
    ],
    Professional: [
      s.featProEmployees,
      s.featProServices,
      s.featBookingConfirmations,
      s.featBookingPage,
      s.featAnalytics,
      s.featEmailReminders,
      s.featProSupport,
      s.featProUpdates,
    ],
    Agency: [
      s.featAgencyEmployees,
      s.featAgencyServices,
      s.featAgencyEverythingPro,
      s.featAgencyManager,
      s.featAgencyApi,
      s.featAgencyWhiteLabel,
      s.featAgencySla,
    ],
  };
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function UsageBar({ label, current, limit, isUnlimited, percentage }: { label: string; current: number; limit: number; isUnlimited: boolean; percentage: number }) {
  const color = percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-[#6355E4]';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {current} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: isUnlimited ? '10%' : `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminSubscriptionPage() {
  const { t, lang } = useTranslation();
  const s = t.admin.subscriptionPage;
  const locale = lang === 'de' ? 'de-DE' : 'en-US';
  const { isEmployee } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestedPlan, setRequestedPlan] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [agencyOffer, setAgencyOffer] = useState<AgencyOffer | null>(null);
  const [acceptingOffer, setAcceptingOffer] = useState(false);
  const [mollieLoadingPlan, setMollieLoadingPlan] = useState<string | null>(null);
  const [mollieProcessing, setMollieProcessing] = useState(false);
  // null while unknown — deliberately don't show the SEPA button until we know for sure,
  // so a real customer can never see a Mollie test-mode checkout by mistake.
  const [mollieLiveMode, setMollieLiveMode] = useState<boolean | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [businessConfirmed, setBusinessConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [billingConfirmed, setBillingConfirmed] = useState(false);
  const [sepaAuthorized, setSepaAuthorized] = useState(false);
  const { confirm, dialog } = useConfirm();
  // Live prices from the backend (SuperAdmin-editable) — overrides the hardcoded PLANS
  // defaults below so this page never shows a stale price after a SuperAdmin price change.
  const [livePrices, setLivePrices] = useState<Record<string, { monthly: number; annual: number }>>({});
  const [billingInterval, setBillingInterval] = useState<'Monthly' | 'Yearly'>('Monthly');
  // Whether the tenant already has an active Mollie subscription — if so, clicking another
  // plan must go through handleChangePlan (in-place PATCH), not handleMollieStart (which
  // the backend rejects once a subscription already exists).
  const [hasMollieSubscription, setHasMollieSubscription] = useState(false);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [planChangeSuccess, setPlanChangeSuccess] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<TenantInvoiceItem[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  // GDPR Art. 15/17 self-service (LEGAL_AUDIT_2026-09-06.md: "Ein Supportlink ist kein
  // umgesetzter Datenexport") — real export + a reviewed deletion-request flow instead.
  const [dataRequests, setDataRequests] = useState<DataSubjectRequestItem[]>([]);
  const [exportingData, setExportingData] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [dataRequestError, setDataRequestError] = useState('');

  useEffect(() => {
    adminApi.getInvoices()
      .then(res => setInvoices(res.items))
      .catch(() => setInvoices([]))
      .finally(() => setInvoicesLoading(false));
  }, []);

  useEffect(() => {
    adminApi.getDataRequests().then(setDataRequests).catch(() => setDataRequests([]));
  }, []);

  async function handleExportData() {
    setExportingData(true);
    setDataRequestError('');
    try {
      const token = getAccessToken();
      const res = await fetch(adminApi.exportTenantDataUrl(), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export fehlgeschlagen');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'gentlebook-export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      adminApi.getDataRequests().then(setDataRequests).catch(() => {});
    } catch {
      setDataRequestError(s.dataExportFailed);
    } finally {
      setExportingData(false);
    }
  }

  async function handleRequestDeletion() {
    if (requestingDeletion) return;
    const ok = await confirm({
      title: s.dataDeletionConfirmTitle,
      message: s.dataDeletionConfirmMessage,
      confirmLabel: s.dataDeletionConfirmLabel,
      variant: 'danger',
    });
    if (!ok) return;
    setRequestingDeletion(true);
    setDataRequestError('');
    try {
      await adminApi.requestDataDeletion();
      const res = await adminApi.getDataRequests();
      setDataRequests(res);
    } catch (err: any) {
      setDataRequestError(err.response?.data?.message || s.dataDeletionRequestFailed);
    } finally {
      setRequestingDeletion(false);
    }
  }

  async function downloadInvoicePdf(inv: TenantInvoiceItem) {
    setDownloadingInvoiceId(inv.id);
    try {
      const token = getAccessToken();
      const res = await fetch(adminApi.invoicePdfUrl(inv.id), {
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
    setDownloadingInvoiceId(null);
  }

  useEffect(() => {
    Promise.all([
      api.get('/tenant/subscription').then(r => r.data?.data ?? r.data).catch(() => null),
      api.get('/tenant/usage').then(r => r.data).catch(() => null),
      adminApi.getSubscriptionRequestStatus().catch(() => null),
      adminApi.getMollieStatus().catch(() => null),
      adminApi.getPlanPricing().catch(() => []),
    ]).then(([subData, usageData, requestStatus, mollieStatus, pricing]) => {
      setSub(subData);
      setUsage(usageData);
      if (requestStatus?.request && ['Pending', 'Offered', 'Accepted'].includes(requestStatus.request.status)) {
        setRequestedPlan(requestStatus.request.requestedPlan);
      }
      if (requestStatus?.request?.requestedPlan === 'Agency' &&
          ['Offered', 'Accepted'].includes(requestStatus.request.status) &&
          requestStatus.request.offeredMonthlyPrice && requestStatus.request.offeredAnnualPrice && requestStatus.request.offerExpiresAt) {
        setAgencyOffer(requestStatus.request as AgencyOffer);
        setBillingInterval(requestStatus.request.acceptedInterval ?? 'Monthly');
      }
      setMollieLiveMode(mollieStatus?.isLiveMode ?? false);
      setHasMollieSubscription(mollieStatus?.hasMollieSubscription ?? false);
      setLivePrices(Object.fromEntries((pricing ?? []).map(p => [p.plan, { monthly: p.monthlyPrice, annual: p.annualPrice }])));
    }).finally(() => setLoading(false));
  }, []);

  // After returning from the Mollie-hosted checkout, poll briefly until the webhook has
  // been processed and the subscription is actually Active (redirect and webhook arrival
  // aren't perfectly synchronized).
  useEffect(() => {
    if (searchParams.get('mollieReturn') !== '1') return;
    setMollieProcessing(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const status = await adminApi.getMollieStatus();
        if (status.hasMollieSubscription) {
          clearInterval(interval);
          setMollieProcessing(false);
          const subData = await api.get('/tenant/subscription').then(r => r.data?.data ?? r.data).catch(() => null);
          setSub(subData);
          return;
        }
      } catch { /* keep polling */ }
      if (attempts >= 8) {
        clearInterval(interval);
        setMollieProcessing(false);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [searchParams]);

  const handleMollieStart = async (planKey: string) => {
    if (mollieLoadingPlan || requesting) return;
    setMollieLoadingPlan(planKey);
    setRequestError('');
    try {
      const { checkoutUrl } = await adminApi.startMollieMandateFlow(planKey, billingInterval);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'SEPA-Zahlung konnte nicht gestartet werden.');
      setMollieLoadingPlan(null);
    }
  };

  const handleChangePlan = async (planKey: string, planName: string) => {
    if (changingPlan) return;
    const periodEndText = sub?.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
      : s.changePlanFallbackDate;
    const currentPlanMeta = PLANS.find((p) => p.key === currentPlanKey);
    const targetPlanMeta = PLANS.find((p) => p.key === planKey);
    const losesAnalytics = !!currentPlanMeta?.hasAnalytics && !targetPlanMeta?.hasAnalytics;
    const analyticsWarning = losesAnalytics ? s.changePlanAnalyticsWarning : '';
    const ok = await confirm({
      title: fillTemplate(s.changePlanConfirmTitleTemplate, { plan: planName }),
      message: fillTemplate(s.changePlanConfirmMessagePre, {
        plan: planName,
        interval: billingInterval === 'Yearly' ? s.intervalYearlyWord : s.intervalMonthlyWord,
        date: periodEndText,
      }) + analyticsWarning,
      confirmLabel: s.changePlanConfirmLabel,
    });
    if (!ok) return;
    setChangingPlan(planKey);
    setRequestError('');
    try {
      await adminApi.changeSubscriptionPlan(planKey, billingInterval);
      const [subData, usageData] = await Promise.all([
        api.get('/tenant/subscription').then(r => r.data?.data ?? r.data).catch(() => null),
        api.get('/tenant/usage').then(r => r.data).catch(() => null),
      ]);
      setSub(subData);
      setUsage(usageData);
      setPlanChangeSuccess(planName);
    } catch (err: any) {
      setRequestError(err.response?.data?.message || s.errPlanChangeFailed);
    } finally {
      setChangingPlan(null);
    }
  };

  const handlePlanRequest = async (planKey: string) => {
    if (requesting) return;
    if (requestedPlan) {
      setRequestError(fillTemplate(s.alreadyRequestedTemplate, { plan: requestedPlan }));
      return;
    }
    setRequesting(true);
    setRequestError('');
    try {
      await adminApi.requestPlan(planKey, undefined, undefined, billingInterval);
      setRequestedPlan(planKey);
      setRequestSuccess(true);
    } catch (err: any) {
      setRequestError(err.response?.data?.message || s.errRequestSendFailed);
    } finally {
      setRequesting(false);
    }
  };

  const handleAcceptAgencyOffer = async () => {
    if (!agencyOffer || acceptingOffer) return;
    if (!contractConfirmed) {
      setRequestError(s.errAgencyConfirmRequired);
      return;
    }
    setAcceptingOffer(true);
    setRequestError('');
    try {
      const result = await adminApi.acceptAgencyOffer(agencyOffer.id, billingInterval);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.activated) {
        const subData = await api.get('/tenant/subscription').then(r => r.data?.data ?? r.data);
        setSub(subData);
        setHasMollieSubscription(true);
        setAgencyOffer(null);
        setRequestedPlan(null);
        setPlanChangeSuccess('Agency');
      }
    } catch (err: any) {
      setRequestError(err.response?.data?.message || s.errAgencyAcceptFailed);
    } finally {
      setAcceptingOffer(false);
    }
  };

  const handleCancel = async () => {
    if (cancelling) return;
    const periodEndText = sub?.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
      : s.cancelConfirmFallbackDate;
    const ok = await confirm({
      title: s.cancelConfirmTitle,
      message: fillTemplate(s.cancelConfirmMessageTemplate, { date: periodEndText }),
      confirmLabel: s.cancelConfirmLabel,
      variant: 'danger',
    });
    if (!ok) return;
    setCancelling(true);
    setRequestError('');
    try {
      const res = await adminApi.cancelSubscription();
      setSub((prev) => (prev ? { ...prev, cancelRequestedAt: res.cancelRequestedAt } : prev));
    } catch (err: any) {
      setRequestError(err.response?.data?.message || s.errCancelFailed);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const statusCfg = getStatusConfig(t)[sub?.status ?? 'Trial'];
  const planFeatures = getPlanFeatures(t);
  const StatusIcon = statusCfg?.icon ?? Clock;
  const currentPlanKey = sub?.plan ?? 'Trial';
  const isExpired = sub?.status === 'Expired';

  // Live monthly/annual prices per plan, falling back to the hardcoded PLANS defaults
  // (with the same 20%-off formula the marketing website advertises) until the backend
  // price list has loaded.
  const getPrices = (plan: typeof PLANS[number]) => {
    const live = livePrices[plan.key];
    const monthly = live?.monthly ?? plan.price;
    const annual = live?.annual ?? Math.round(monthly * 0.8) * 12;
    return { monthly, annual };
  };
  const maxSavingsPercent = Math.max(
    0,
    ...PLANS.filter((plan) => !plan.priceOnRequest).map((plan) => {
      const { monthly, annual } = getPrices(plan);
      const monthlyTotal = monthly * 12;
      return monthlyTotal > 0 ? Math.round((1 - annual / monthlyTotal) * 100) : 0;
    })
  );
  const contractConfirmed = businessConfirmed && termsAccepted && billingConfirmed && sepaAuthorized;

  return (
    <motion.div
      className="p-6 max-w-5xl mx-auto space-y-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-gray-900">{s.title}</h1>
        <p className="text-gray-500 mt-1">{s.subtitle}</p>
      </motion.div>

      {/* Expired Warning */}
      {isExpired && (
        <motion.div variants={fadeUp} className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
          <XCircle className="text-red-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-red-800">{s.expiredTitle}</p>
            <p className="text-red-600 text-sm mt-1">
              {s.expiredMessage}
            </p>
          </div>
        </motion.div>
      )}

      {/* Status Card */}
      {sub && (
        <motion.div variants={fadeUp} className={`rounded-2xl border p-6 ${statusCfg?.bg ?? 'bg-gray-50'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-white/60`}>
                <StatusIcon size={20} className={statusCfg?.text} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">{s.statusCardLabel}</p>
                <p className={`font-bold text-lg ${statusCfg?.text}`}>{statusCfg?.label}</p>
              </div>
            </div>
            {sub.isInTrial && (
              <div className="text-right">
                <p className="text-xs text-gray-500">{s.trialEndsLabel}</p>
                <p className="font-semibold text-gray-800">
                  {new Date(sub.trialEndsAt).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className={`text-sm font-medium ${sub.trialDaysRemaining <= 3 ? 'text-red-600' : sub.trialDaysRemaining <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
                  {fillTemplate(sub.trialDaysRemaining === 1 ? s.daysRemaining_one : s.daysRemaining_other, { n: sub.trialDaysRemaining })}
                </p>
              </div>
            )}
            {sub.status === 'Active' && !sub.cancelRequestedAt && sub.currentPeriodEnd && (
              <div className="text-right">
                <p className="text-xs text-gray-500">{sub.interval === 'Yearly' ? s.nextChargeYearly : s.nextChargeMonthly}</p>
                <p className="font-semibold text-gray-800">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Trial Progress Bar */}
          {sub.isInTrial && (() => {
            const total = 14;
            const used = total - sub.trialDaysRemaining;
            const pct = (used / total) * 100;
            const barColor = sub.trialDaysRemaining <= 3 ? 'bg-red-500' : sub.trialDaysRemaining <= 7 ? 'bg-amber-500' : 'bg-[#6355E4]';
            return (
              <div className="mt-4">
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{fillTemplate(s.trialDaysUsedTemplate, { used })}</p>
              </div>
            );
          })()}

          {/* Cancel subscription */}
          {sub.status === 'Active' && !sub.cancelRequestedAt && (
            <div className="mt-4 pt-4 border-t border-black/5">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs font-medium text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {cancelling ? s.cancellingLabel : s.cancelSubscriptionBtn}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Post-cancel banner */}
      {sub?.cancelRequestedAt && sub.status !== 'Cancelled' && (
        <motion.div variants={fadeUp} className="bg-gray-100 border border-gray-300 rounded-2xl p-5 flex gap-4">
          <XCircle className="text-gray-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-gray-800">
              {fillTemplate(s.cancelledOnTemplate, {
                date: sub.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
                  : '–',
              })}
            </p>
            <p className="text-gray-600 text-sm mt-1">{s.cancelledMessage}</p>
          </div>
        </motion.div>
      )}
      {dialog}

      {/* Invoices */}
      {!invoicesLoading && invoices.length > 0 && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[#6355E4]" />
            {s.invoicesTitle}
          </h2>
          <div className="divide-y divide-gray-100">
            {invoices.map(inv => (
              <div key={inv.id} className="py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{inv.invoiceNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(inv.issueDate).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' · '}{inv.planName}
                    {' · '}{inv.amount.toLocaleString(locale, { minimumFractionDigits: 2 })} {inv.currency}
                  </p>
                </div>
                <button
                  onClick={() => downloadInvoicePdf(inv)}
                  disabled={downloadingInvoiceId === inv.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#6355E4] hover:text-[#6355E4] text-xs font-medium disabled:opacity-40 transition-colors shrink-0"
                >
                  {downloadingInvoiceId === inv.id
                    ? <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    : <Download size={13} />}
                  PDF
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Usage Meter */}
      {usage && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-[#6355E4]" />
            {fillTemplate(s.usageTitleTemplate, { plan: usage.planDisplayName })}
          </h2>
          <div className="space-y-4">
            <UsageBar
              label={s.employeesLabel}
              current={usage.employees.current}
              limit={usage.employees.limit}
              isUnlimited={usage.employees.isUnlimited}
              percentage={usage.employees.percentage}
            />
            <UsageBar
              label={s.servicesLabel}
              current={usage.services.current}
              limit={usage.services.limit}
              isUnlimited={usage.services.isUnlimited}
              percentage={usage.services.percentage}
            />
          </div>
          {(usage.employees.percentage >= 80 || usage.services.percentage >= 80) && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle size={16} />
              {s.limitWarning}
            </div>
          )}
        </motion.div>
      )}

      {/* GDPR Art. 15/17 self-service: real data export + a reviewed deletion request */}
      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Shield size={18} className="text-[#6355E4]" />
          {s.dataRightsTitle}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{s.dataRightsDesc}</p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportData}
            disabled={exportingData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:border-[#6355E4] hover:text-[#6355E4] text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {exportingData
              ? <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              : <Download size={15} />}
            {s.dataExportBtn}
          </button>

          {(() => {
            const pendingDeletion = dataRequests.find(r => r.type === 'Deletion' && r.status === 'Pending');
            const canRequestDeletion = sub?.status === 'Cancelled' || sub?.status === 'Expired';
            if (pendingDeletion) {
              return <p className="text-sm text-amber-600 self-center">{s.dataDeletionPending}</p>;
            }
            if (!canRequestDeletion) {
              return <p className="text-sm text-gray-400 self-center">{s.dataDeletionRequiresCancellation}</p>;
            }
            return (
              <button
                onClick={handleRequestDeletion}
                disabled={requestingDeletion}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {requestingDeletion
                  ? <span className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                  : <Trash2 size={15} />}
                {s.dataDeletionBtn}
              </button>
            );
          })()}
        </div>

        {dataRequestError && <p className="text-sm text-red-600 mt-3">{dataRequestError}</p>}

        {dataRequests.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
            {dataRequests.map(r => (
              <p key={r.id} className="text-xs text-gray-400">
                {new Date(r.requestedAt).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {' · '}{r.type === 'Export' ? s.dataRequestTypeExport : s.dataRequestTypeDeletion}
                {' · '}{r.status === 'Pending' ? s.dataRequestStatusPending : r.status === 'Completed' ? s.dataRequestStatusCompleted : s.dataRequestStatusRejected}
                {r.notes ? ` — ${r.notes}` : ''}
              </p>
            ))}
          </div>
        )}
      </motion.div>

      {/* Plan Change Success Banner */}
      {planChangeSuccess && (
        <motion.div variants={fadeUp} className="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4">
          <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-green-800">{s.planChangedTitle}</p>
            <p className="text-green-700 text-sm mt-1">
              {s.planChangedPre}<strong>{fillTemplate(s.planChangedBoldTemplate, { plan: planChangeSuccess })}</strong>{s.planChangedPost}
            </p>
          </div>
        </motion.div>
      )}

      {/* Request Success Banner */}
      {requestSuccess && (
        <motion.div variants={fadeUp} className="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4">
          <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-green-800">{s.requestSuccessTitle}</p>
            <p className="text-green-700 text-sm mt-1">
              {s.requestSuccessPre}<strong>{fillTemplate(s.requestSuccessBoldTemplate, { plan: requestedPlan ?? '' })}</strong>{s.requestSuccessPost}
            </p>
          </div>
        </motion.div>
      )}

      {/* Mollie processing banner (after checkout redirect) */}
      {mollieProcessing && (
        <motion.div variants={fadeUp} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4">
          <span className="w-5 h-5 mt-0.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">{s.mollieProcessingTitle}</p>
            <p className="text-blue-700 text-sm mt-1">{s.mollieProcessingMessage}</p>
          </div>
        </motion.div>
      )}

      {/* Pending Request Banner */}
      {requestedPlan && !requestSuccess && !agencyOffer && (
        <motion.div variants={fadeUp} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
          <Clock className="text-amber-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-amber-800">{s.pendingRequestTitle}</p>
            <p className="text-amber-700 text-sm mt-1">
              {s.pendingRequestPre}<strong>{fillTemplate(s.pendingRequestBoldTemplate, { plan: requestedPlan ?? '' })}</strong>{s.pendingRequestPost}
            </p>
          </div>
        </motion.div>
      )}

      {agencyOffer && (
        <motion.section variants={fadeUp} className="border border-[#6355E4]/30 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#6355E4]">{s.agencyOfferBadge}</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">GentleBook Agency</h2>
              <p className="mt-1 text-sm text-gray-500">{fillTemplate(s.agencyOfferValidUntilTemplate, { date: new Date(agencyOffer.offerExpiresAt).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }) })}</p>
            </div>
            <Shield className="text-[#6355E4]" size={24} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(['Monthly', 'Yearly'] as const).map((interval) => {
              const selected = billingInterval === interval;
              const price = interval === 'Monthly' ? agencyOffer.offeredMonthlyPrice : agencyOffer.offeredAnnualPrice;
              return (
                <button key={interval} type="button" onClick={() => setBillingInterval(interval)} className={`border p-4 text-left transition-colors ${selected ? 'border-[#6355E4] bg-[#6355E4]/5 ring-1 ring-[#6355E4]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="flex items-center justify-between text-sm font-semibold text-gray-700">
                    {interval === 'Monthly' ? s.monthlyBillingLabel : s.yearlyBillingLabel}
                    <span className={`h-4 w-4 rounded-full border ${selected ? 'border-4 border-[#6355E4]' : 'border-gray-300'}`} />
                  </span>
                  <span className="mt-2 block text-2xl font-bold text-gray-900">{price.toLocaleString(locale, { minimumFractionDigits: 2 })} €</span>
                  <span className="text-xs text-gray-500">{interval === 'Monthly' ? s.totalPricePerMonthLabel : s.totalPricePerYearLabel}</span>
                </button>
              );
            })}
          </div>

          <fieldset className="mt-5 space-y-3 border-t border-gray-200 pt-5 text-sm text-gray-700">
            <legend className="sr-only">{s.bindingConfirmationsLegend}</legend>
            <label className="flex items-start gap-3"><input type="checkbox" checked={businessConfirmed} onChange={(e) => setBusinessConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" /><span>{s.businessConfirmLabel}</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" /><span>{s.termsAcceptPre}<a href={legalConfig.terms} target="_blank" rel="noopener noreferrer" className="text-[#6355E4] underline">{s.agbLinkText}</a>{s.termsAcceptPost}</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={billingConfirmed} onChange={(e) => setBillingConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" /><span>{s.agencyOrderPre}{billingInterval === 'Monthly' ? `${agencyOffer.offeredMonthlyPrice.toLocaleString(locale, { minimumFractionDigits: 2 })} € ${s.perMonthWord}` : `${agencyOffer.offeredAnnualPrice.toLocaleString(locale, { minimumFractionDigits: 2 })} € ${s.perYearWord}`}. {hasMollieSubscription ? `${s.nextChargeAppliesPre}${sub?.currentPeriodEnd ? fillTemplate(s.nextChargeAppliesOnTemplate, { date: new Date(sub.currentPeriodEnd).toLocaleDateString(locale) }) : ''}.` : s.firstChargeImmediateText}{s.recurringChargeText}</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" checked={sepaAuthorized} onChange={(e) => setSepaAuthorized(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" /><span>{s.sepaAuthorizePre} <em className="text-gray-500">{s.draftLegalNote}</em></span></label>
          </fieldset>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">{s.contractProofNote}</p>
            <button type="button" onClick={handleAcceptAgencyOffer} disabled={!contractConfirmed || acceptingOffer || (!hasMollieSubscription && mollieLiveMode !== true)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-[#6355E4] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#5646D6] disabled:cursor-not-allowed disabled:opacity-50">
              {acceptingOffer ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ArrowRight size={16} />}
              {hasMollieSubscription ? s.subscribeAgencyBtn : s.subscribeAgencyMollieBtn}
            </button>
          </div>
          {!hasMollieSubscription && mollieLiveMode === false && <p className="mt-3 text-sm text-amber-700">{s.paymentUnavailableMessage}</p>}
        </motion.section>
      )}

      {/* Request Error Banner */}
      {requestError && (
        <motion.div variants={fadeUp} className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-red-800">{s.requestErrorTitle}</p>
            <p className="text-red-700 text-sm mt-1">{requestError}</p>
          </div>
        </motion.div>
      )}

      {/* Pricing Cards */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-gray-900">{s.plansAndPricingTitle}</h2>
          <HelpTip text={s.helpTipText} />
        </div>
        <p className="text-gray-500 text-sm mb-4">{billingInterval === 'Yearly' ? s.pricingDisclaimerYearly : s.pricingDisclaimerMonthly}</p>

        {/* Monthly / Yearly toggle */}
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setBillingInterval('Monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                billingInterval === 'Monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.monthlyToggleBtn}
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('Yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                billingInterval === 'Yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.yearlyToggleBtn}
            </button>
          </div>
          {maxSavingsPercent > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5">
              {fillTemplate(s.saveUpToTemplate, { percent: maxSavingsPercent })}
            </span>
          )}
        </div>

        {!hasMollieSubscription && (
          <fieldset className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <legend className="px-1 font-semibold text-gray-900">{s.bindingConfirmationsBeforeCheckoutLegend}</legend>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={businessConfirmed} onChange={(event) => setBusinessConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" />
              <span>{s.businessConfirmLabel}</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" />
              <span>{s.termsAcceptPre}<a href={legalConfig.terms} target="_blank" rel="noopener noreferrer" className="text-[#6355E4] underline">{s.agbLinkText}</a>{s.termsAcceptPost}</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={billingConfirmed} onChange={(event) => setBillingConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" />
              <span>{billingInterval === 'Yearly' ? s.billingIntervalKnownYearly : s.billingIntervalKnownMonthly}</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={sepaAuthorized} onChange={(event) => setSepaAuthorized(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6355E4]" />
              <span>{s.sepaAuthorizePre} <em className="text-gray-500">{s.draftLegalNote}</em></span>
            </label>
          </fieldset>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanKey === plan.key;
            const { monthly, annual } = getPrices(plan);
            const monthlyTotal = monthly * 12;
            const savingsAmount = Math.max(0, monthlyTotal - annual);
            const savingsPercent = monthlyTotal > 0 ? Math.round((savingsAmount / monthlyTotal) * 100) : 0;
            const displayPrice = billingInterval === 'Yearly' ? Math.round(annual / 12) : monthly;
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border-2 p-6 flex flex-col
                  ${plan.highlight ? 'border-[#6355E4] shadow-lg' : 'border-gray-200'}
                  ${isCurrent ? 'ring-2 ring-[#6355E4]/30' : ''}
                  bg-white`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#6355E4] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {t.admin.recommended}
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {s.yourPlanBadge}
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  {plan.priceOnRequest ? (
                    <div className="flex items-end gap-1 mt-2">
                      <span className="text-2xl font-bold text-gray-900">{s.priceOnRequestLabel}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-end gap-1 mt-2">
                        <span className="text-3xl font-bold text-gray-900">€{displayPrice}</span>
                        <span className="text-gray-500 mb-1">{t.admin.perMonth}</span>
                      </div>
                      {billingInterval === 'Yearly' && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-gray-500">{fillTemplate(s.yearlyPriceNoteTemplate, { annual })}</span>
                          {savingsPercent > 0 && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5">
                              {fillTemplate(s.saveAmountTemplate, { percent: savingsPercent, amount: savingsAmount })}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.employees ? fillTemplate(s.employeesServicesTemplate, { employees: plan.employees, services: plan.services }) : s.unlimitedEmployeesServices}
                  </p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {planFeatures[plan.key].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check size={15} className="text-[#6355E4] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  {/* Agency has no fixed price ("Preis auf Anfrage") — self-service checkout
                      and in-place plan changes are blocked server-side, always route through
                      the manual contact/request flow instead. */}
                  {!isCurrent && plan.priceOnRequest && (
                    <button
                      onClick={() => handlePlanRequest(plan.key)}
                      disabled={requesting || !!requestedPlan}
                      title={requestedPlan && requestedPlan !== plan.key ? fillTemplate(s.alreadyRequestedTitleTemplate, { plan: requestedPlan }) : undefined}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors bg-gray-900 hover:bg-gray-700 text-white disabled:opacity-50"
                    >
                      {requestedPlan === plan.key ? s.requestSentCheck : <>{s.requestOfferBtn} <ArrowRight size={14} /></>}
                    </button>
                  )}
                  {/* Already a Mollie subscriber: switch in place (PATCH), no new checkout. */}
                  {!isCurrent && !plan.priceOnRequest && hasMollieSubscription && sub?.status === 'Active' && (
                    <button
                      onClick={() => handleChangePlan(plan.key, plan.name)}
                      disabled={!!changingPlan}
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors
                        ${plan.highlight
                          ? 'bg-[#6355E4] hover:bg-[#015f5f] text-white'
                          : 'bg-gray-900 hover:bg-gray-700 text-white'}
                        ${changingPlan && changingPlan !== plan.key ? 'opacity-50' : ''}`}
                    >
                      {changingPlan === plan.key ? (
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>{fillTemplate(s.switchToPlanTemplate, { plan: plan.name })} <ArrowRight size={14} /></>
                      )}
                    </button>
                  )}
                  {/* Primary: Mollie SEPA checkout — only ever shown once we've confirmed
                      live mode server-side, so no real customer can hit a test-mode checkout. */}
                  {!isCurrent && !plan.priceOnRequest && !hasMollieSubscription && mollieLiveMode === true && (
                    <button
                      onClick={() => handleMollieStart(plan.key)}
                      disabled={!contractConfirmed || !!mollieLoadingPlan || requestedPlan === plan.key}
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors
                        ${plan.highlight
                          ? 'bg-[#6355E4] hover:bg-[#015f5f] text-white'
                          : 'bg-gray-900 hover:bg-gray-700 text-white'}
                        ${mollieLoadingPlan && mollieLoadingPlan !== plan.key ? 'opacity-50' : ''}`}
                    >
                      {mollieLoadingPlan === plan.key ? (
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>{fillTemplate(s.subscribePlanTemplate, { plan: plan.name })} <ArrowRight size={14} /></>
                      )}
                    </button>
                  )}
                  {!isCurrent && !plan.priceOnRequest && !hasMollieSubscription && mollieLiveMode === false && (
                    <div
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                      title={s.sepaComingSoonLabel}
                    >
                      {s.sepaComingSoonLabel}
                    </div>
                  )}
                  {isCurrent && (
                    <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700">
                      <Check size={15} /> {s.currentPlanBadgeLabel}
                    </div>
                  )}
                  {/* Fallback: manual request (no SEPA) — only meaningful before any Mollie
                      subscription exists; the manual path is blocked server-side afterward. */}
                  {!isCurrent && !plan.priceOnRequest && !hasMollieSubscription && (
                    <button
                      onClick={() => handlePlanRequest(plan.key)}
                      disabled={!contractConfirmed || requesting || !!requestedPlan}
                      title={requestedPlan && requestedPlan !== plan.key ? fillTemplate(s.alreadyRequestedTitleTemplate, { plan: requestedPlan }) : undefined}
                      className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors py-1 disabled:opacity-50"
                    >
                      {requestedPlan === plan.key ? s.manualRequestSentCheck : s.manualRequestBtn}
                    </button>
                  )}
                  {/* Secondary: WhatsApp / Email */}
                  <div className="flex gap-2">
                    <a
                      href={supportConfig.whatsappUrl(fillTemplate(s.whatsappMessageTemplate, { plan: plan.name }))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                    <a
                      href={supportConfig.mailto(fillTemplate(s.emailSubjectTemplate, { plan: plan.name }))}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <Mail size={13} /> {s.emailLabel}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div variants={fadeUp} className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">{s.contactQuestionTitle}</p>
          <p className="text-sm text-gray-500 mt-0.5">{s.contactQuestionSubtitle}</p>
        </div>
        <div className="flex gap-3">
          <a
            href={supportConfig.whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a
            href={supportConfig.mailto()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Mail size={16} /> {s.emailLabel}
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
