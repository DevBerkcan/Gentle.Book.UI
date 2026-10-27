// app/admin/tracking/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  TrendingUp, Users, BarChart3,
  Calendar,
  Clock, Eye, DollarSign, AlertTriangle,
} from "lucide-react";
import { HelpTip } from "@/components/ui/help-tip";
import {
  getTrackingStatistics, getRevenueStatistics, getStatistics,
  type SimplifiedTrackingStatistics, type RevenueStatistics, type DashboardStatistics,
} from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils/currency";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";

// ── Design Tokens (matching full admin suite) ─────────────────────────────────
// bg:         #F7F7F8
// surface:    #FFFFFF
// border:     #E5E7EB   subtle: #F3F4F6
// text-1:     #111318   text-2: #374151   text-3: #6B7280   text-4: #9CA3AF
// accent:     #6355E4   accent-bg: #EEEBFC   accent-bdr: #C7D2FE
// success:    #059669   error: #EF4444   warning: #D97706
// ─────────────────────────────────────────────────────────────────────────────

// ── Small reusable stat tile ──────────────────────────────────────────────────
function OverviewTile({
  label, value, icon: Icon, accent, helpText, formatFn,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  helpText?: string;
  formatFn?: (n: number) => string;
}) {
  return (
    <GlowingEffect glowColor={accent} spread={40}>
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        {/* Accent line */}
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55)` }} />
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}15` }}>
            <Icon size={17} style={{ color: accent }} />
          </div>
        </div>
        <div className="text-[26px] font-bold text-[#111318] tabular-nums leading-none mb-1">
          <AnimatedNumber value={value} duration={1.4} formatFn={formatFn} />
        </div>
        <div className="text-xs text-[#6B7280] font-medium flex items-center gap-1">
          {label}
          {helpText && <HelpTip text={helpText} />}
        </div>
      </div>
    </GlowingEffect>
  );
}

// ── Revenue period card ───────────────────────────────────────────────────────
function RevenuePeriodCard({
  label, bookings, revenueByCurrency, icon: Icon,
}: {
  label: string; bookings: number;
  revenueByCurrency: Record<string, number>;
  icon: React.ElementType;
}) {
  const { t } = useTranslation();
  return (
    <GlowingEffect glowColor="#6355E4" spread={35}>
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-[#6355E4] to-[#6355E455]" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#EEEBFC] flex items-center justify-center">
            <Icon size={15} className="text-[#6355E4]" />
          </div>
          <p className="text-sm font-semibold text-[#111318]">{label}</p>
        </div>
        <div className="space-y-2.5">
          {Object.entries(revenueByCurrency ?? {}).map(([currency, value]) => (
            <div key={currency} className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9CA3AF]">{currency}</span>
              <span className="text-lg font-bold text-[#111318] tabular-nums">
                <AnimatedNumber value={value} formatFn={(n) => formatPrice(n, currency)} />
              </span>
            </div>
          ))}
          <div className="pt-1 border-t border-[#F3F4F6] flex items-center justify-between">
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{t.admin.trackingPage.bookingsLabel}</span>
            <span className="text-sm font-bold text-[#374151] tabular-nums">
              <AnimatedNumber value={bookings} />
            </span>
          </div>
        </div>
      </div>
    </GlowingEffect>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const { isEmployee } = useAuth();
  const { t } = useTranslation();
  const s = t.admin.trackingPage;
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);

  const [stats,          setStats]          = useState<SimplifiedTrackingStatistics | null>(null);
  const [revenue,        setRevenue]        = useState<RevenueStatistics | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [needsUpgrade,   setNeedsUpgrade]   = useState(false);
  const [upgradeInfo,    setUpgradeInfo]    = useState<{ message?: string; currentPlan?: string; requiredPlan?: string }>({});

  useEffect(() => { loadStatistics(); }, []);

  async function loadStatistics() {
    try {
      setLoading(true); setError(null);
      const [statsData, revenueData, dashboardData] = await Promise.all([
        getTrackingStatistics(), getRevenueStatistics(), getStatistics(),
      ]);
      setStats(statsData); setRevenue(revenueData); setDashboardStats(dashboardData);
    } catch (err: any) {
      // 402 mit feature-Flag = Analytics ist im aktuellen Plan nicht enthalten.
      // Tarifname und benötigter Tarif kommen direkt vom Server (PlanLimits) — nie hartcodiert.
      if (err.response?.status === 402 && err.response?.data?.feature) {
        setNeedsUpgrade(true);
        setUpgradeInfo({
          message: err.response.data.message,
          currentPlan: err.response.data.currentPlan,
          requiredPlan: err.response.data.requiredPlan,
        });
      } else {
        setError(err.response?.data?.message || err.message || s.loadStatsError);
      }
    } finally { setLoading(false); }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Upsell: Analytics ist im aktuellen Tarif nicht enthalten ──────────────
  // Tarifname kommt vom Server (PlanLimits) — nie hartcodiert, siehe TrackingController.RequireAnalyticsPlanAsync.

  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-[#EEEBFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={20} className="text-[#6355E4]" />
          </div>
          <h2 className="text-lg font-bold text-[#111318] mb-2">{s.upgradeTitle}</h2>
          {upgradeInfo.currentPlan && (
            <p className="text-xs text-[#9CA3AF] mb-3">
              {s.currentPlanLabel} <span className="font-semibold text-[#6B7280]">{upgradeInfo.currentPlan}</span>
            </p>
          )}
          <p className="text-sm text-[#6B7280] mb-6">
            {upgradeInfo.message ?? (
              <>
                {s.upgradeDefaultMessage}
                {upgradeInfo.requiredPlan && (
                  <>{fillTemplate(s.upgradeWithPlanTemplate, { plan: upgradeInfo.requiredPlan })}</>
                )}
              </>
            )}
          </p>
          <a
            href="/admin/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#4338CA] transition-colors"
          >
            <TrendingUp size={15} /> {s.upgradeNowBtn}
          </a>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !stats || !revenue) {
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

  // ── Derived values ────────────────────────────────────────────────────────

  const bookingConversion = stats.totalPageViews > 0
    ? (stats.totalBookings / stats.totalPageViews) * 100 : 0;
  const topService = dashboardStats?.popularServices?.[0] ?? null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div>
          <h1 className="text-[22px] font-bold text-[#111318] tracking-tight">{s.pageTitle}</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{s.pageSubtitle}</p>
        </div>

        {/* ── Conversion Insights ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">{s.conversionLabel}</p>
          <div className="grid grid-cols-1 gap-3 mb-4">
            {/* Booking conversion */}
            <div className="relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3">
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-[#059669]" />
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#059669] mb-1">
                <TrendingUp size={11} />{s.toBookingLabel}
              </div>
              <p className="text-2xl font-bold text-[#111318]">{bookingConversion.toFixed(1)}%</p>
            </div>
          </div>

          {/* Highlight rows */}
          <div className="space-y-2">
            {[
              {
                label: s.topServiceLabel,
                value: topService ? fillTemplate(s.bookingsTemplate, { name: topService.serviceName, count: topService.bookingCount }) : s.noDataYet,
                icon: <Calendar size={14} className="text-[#6355E4]" />,
              },
            ].map(({ label, value, icon }) => (
              <div key={label}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#F3F4F6] bg-[#F7F7F8] px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#111318]">{label}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{value}</p>
                </div>
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* ── Overview Stat Tiles ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <OverviewTile
            label={s.totalPageViewsLabel}
            value={stats.totalPageViews}
            icon={Eye}
            accent="#6355E4"
            helpText={s.totalPageViewsHelp}
          />
          <OverviewTile
            label={s.totalBookingsLabel}
            value={stats.totalBookings}
            icon={BarChart3}
            accent="#059669"
            helpText={s.totalBookingsHelp}
          />
          {Object.entries(stats.averageBookingValueByCurrency ?? {}).map(([currency, value]) => (
            <OverviewTile
              key={currency}
              label={fillTemplate(s.avgBookingValueTemplate, { currency })}
              value={value}
              icon={DollarSign}
              accent="#D97706"
              formatFn={(n) => formatPrice(n, currency)}
              helpText={fillTemplate(s.avgBookingValueHelpTemplate, { currency })}
            />
          ))}
        </div>

        {/* ── Total Revenue Banner ──────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-[#6355E4] rounded-2xl p-5 sm:p-6 border border-[#C7D2FE]">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute -bottom-3 right-20 w-16 h-16 bg-white/6 rounded-full" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <DollarSign size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-base">{s.allTimeRevenueLabel}</p>
                <p className="text-white/55 text-xs">{fillTemplate(s.allTimeBookingsTemplate, { count: revenue.allTimeBookings })}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              {Object.entries(revenue.allTimeRevenueByCurrency ?? {}).map(([currency, value]) => (
                <div key={currency}>
                  <p className="text-white/50 text-xs font-medium">{currency}</p>
                  <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-tight">
                    {formatPrice(value, currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Revenue Periods ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RevenuePeriodCard
            label={s.today}
            bookings={revenue.todayBookings}
            revenueByCurrency={revenue.todayRevenueByCurrency}
            icon={Clock}
          />
          <RevenuePeriodCard
            label={s.last7Days}
            bookings={revenue.weekBookings}
            revenueByCurrency={revenue.weekRevenueByCurrency}
            icon={Calendar}
          />
          <RevenuePeriodCard
            label={s.last30Days}
            bookings={revenue.monthBookings}
            revenueByCurrency={revenue.monthRevenueByCurrency}
            icon={Calendar}
          />
        </div>

      </div>
    </div>
  );
}
