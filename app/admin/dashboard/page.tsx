// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar, CalendarDays, Clock, TrendingUp, TrendingDown, Users,
  Euro, Copy, Check, ExternalLink, Sparkles, Ban,
  ArrowUpRight, ChevronRight, CheckCircle2, Circle, X, BarChart2, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { getDashboard, getOnboardingStatus, type DashboardOverview, type OnboardingStatus } from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils/currency";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { HelpTip } from "@/components/ui/help-tip";

// ── Design Tokens (matching AdminLinksPage & AdminSettingsPage) ───────────────
// bg:         #F7F7F8
// surface:    #FFFFFF
// border:     #E5E7EB   subtle: #F3F4F6
// text-1:     #111318   text-2: #374151   text-3: #6B7280   text-4: #9CA3AF
// accent:     #6355E4   accent-bg: #EEEBFC   accent-bdr: #A5B4FC / #C7D2FE
// success:    #065F46 on #D1FAE5   error: #991B1B on #FEE2E2
// ─────────────────────────────────────────────────────────────────────────────

// ── helpers ───────────────────────────────────────────────────────────────────

function getStatusMap(t: Translations): Record<string, { label: string; dot: string; bg: string; text: string }> {
  return {
    Confirmed: { label: t.admin.bookingStatus.confirmed, dot: "bg-emerald-400", bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
    Pending:   { label: t.admin.bookingStatus.pending,   dot: "bg-amber-400",   bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
    Completed: { label: t.admin.bookingStatus.completed, dot: "bg-[#6355E4]",   bg: "bg-[#EEEBFC]", text: "text-[#6355E4]" },
    Cancelled: { label: t.admin.bookingStatus.cancelled, dot: "bg-red-400",     bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" },
    NoShow:    { label: t.admin.bookingStatus.noShow,    dot: "bg-[#9CA3AF]",   bg: "bg-[#F3F4F6]", text: "text-[#374151]" },
  };
}

function formatTime(mins: number, t: Translations) {
  if (mins < 60)   return `${mins} ${t.admin.durationUnits.minShort}`;
  if (mins < 1440) return `${Math.floor(mins / 60)} ${t.admin.durationUnits.hourShort}`;
  const d = Math.floor(mins / 1440);
  return `${d} ${d > 1 ? t.admin.durationUnits.dayShort_other : t.admin.durationUnits.dayShort_one}`;
}

function greeting(t: Translations) {
  const h = new Date().getHours();
  if (h < 12) return t.admin.dashboardPage.greetingMorning;
  if (h < 17) return t.admin.dashboardPage.greetingDay;
  return t.admin.dashboardPage.greetingEvening;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  icon, value, label, growth, accent, helpText,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  growth?: number | null;
  accent: string;
  helpText?: string;
}) {
  const isNumeric = typeof value === "number";

  return (
    <motion.div variants={fadeUp}>
      <GlowingEffect glowColor={accent} spread={40}>
        <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55)` }} />
          {/* Background glow */}
          <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-300"
            style={{ background: accent }} />

          <div className="relative flex items-start justify-between mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}15` }}>
              {icon}
            </div>
            {growth != null && growth !== 0 && (
              <span className={`flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1 rounded-full ${
                growth > 0
                  ? "bg-[#D1FAE5] text-[#065F46]"
                  : "bg-[#FEE2E2] text-[#991B1B]"
              }`}>
                {growth > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(growth).toFixed(0)}%
              </span>
            )}
          </div>

          <div className="relative text-[28px] font-bold text-[#111318] mb-1 tabular-nums leading-none">
            {isNumeric ? <AnimatedNumber value={value as number} duration={1.4} /> : value}
          </div>
          <div className="relative text-xs text-[#6B7280] font-medium flex items-center gap-1">
            {label}
            {helpText && <HelpTip text={helpText} />}
          </div>
        </div>
      </GlowingEffect>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, isTenantAdmin, isEmployee } = useAuth();
  const { t, lang } = useTranslation();
  const dateLocale = lang === 'de' ? 'de-DE' : 'en-US';
  const router = useRouter();

  // Redirect employees to their own dashboard — no admin API calls for them
  useEffect(() => {
    if (isEmployee) router.replace('/admin/employee-dashboard');
  }, [isEmployee, router]);

  const [dashboard,            setDashboard]           = useState<DashboardOverview | null>(null);
  const [onboarding,           setOnboarding]          = useState<OnboardingStatus | null>(null);
  const [onboardingDismissed,  setOnboardingDismissed] = useState(false);
  const [loading,              setLoading]             = useState(true);
  const [error,                setError]               = useState<string | null>(null);
  const [copied,               setCopied]              = useState(false);
  const [defaultCurrency,      setDefaultCurrency]     = useState("EUR");
  const [usage,                setUsage]               = useState<any>(null);

  useEffect(() => {
    // Never load admin dashboard data for employees
    if (isEmployee) return;

    getDashboard()
      .then(setDashboard)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    if (isTenantAdmin) {
      getOnboardingStatus().then(setOnboarding).catch(() => {});
    }

    import("@/lib/api/client").then(({ default: api }) => {
      api.get("/tenant/settings").then((res) => {
        const d = res.data?.data ?? res.data;
        if (d?.defaultCurrency) setDefaultCurrency(d.defaultCurrency);
      }).catch(() => {});
      if (isTenantAdmin) {
        api.get("/tenant/usage").then((res) => setUsage(res.data)).catch(() => {});
      }
    });

    if (typeof window !== "undefined" && sessionStorage.getItem("onboarding_dismissed")) {
      setOnboardingDismissed(true);
    }
  }, [isTenantAdmin, isEmployee]);

  // ── Employee redirect (no admin content for employees) ───────────────────

  if (isEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8] p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-10 text-center max-w-sm">
          <div className="w-12 h-12 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={20} className="text-[#991B1B]" />
          </div>
          <h2 className="text-base font-bold text-[#111318] mb-2">{t.admin.dashboardPage.loadError}</h2>
          <p className="text-sm text-[#6B7280]">{error || t.admin.dashboardPage.dashboardUnavailable}</p>
        </div>
      </div>
    );
  }

  const { today, nextBooking, statistics } = dashboard;

  const revenueThis = defaultCurrency === "CHF" ? statistics.revenueThisMonthCHF  : statistics.revenueThisMonthEUR;
  const revenueLast = defaultCurrency === "CHF" ? statistics.revenueLastMonthCHF  : statistics.revenueLastMonthEUR;
  const monthlyRevenueEntries = Object.entries(statistics.revenueThisMonthByCurrency ?? {});
  const monthlyRevenueDisplay = monthlyRevenueEntries.length > 0
    ? monthlyRevenueEntries.map(([currency, value]) => formatPrice(value, currency)).join(" · ")
    : formatPrice(revenueThis, defaultCurrency);

  const monthGrowth   = statistics.totalBookingsLastMonth > 0
    ? ((statistics.totalBookingsThisMonth - statistics.totalBookingsLastMonth) / statistics.totalBookingsLastMonth) * 100 : 0;
  const revenueGrowth = revenueLast > 0
    ? ((revenueThis - revenueLast) / revenueLast) * 100 : 0;

  const todayDate = new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "2-digit", month: "long" });
  const statusMap = getStatusMap(t);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs text-gb-textMuted font-medium">{todayDate}</p>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t.admin.dashboardPage.live}
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#111318] tracking-tight">
              {greeting(t)}{user?.firstName ? `, ${user.firstName}` : ""}! 👋
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">{t.admin.dashboardPage.subtitle}</p>
          </div>
        </motion.div>

        {/* ── Booking Link Banner ───────────────────────────────────────── */}
        {isTenantAdmin && user?.tenantSlug && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl p-5 border border-[#C7D2FE] bg-[#6355E4]"
          >
            {/* Decorative shapes */}
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
            <div className="absolute -bottom-3 right-16 w-16 h-16 bg-white/6 rounded-full" />

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ExternalLink size={13} className="text-white/60" />
                  <p className="text-white/60 text-xs font-medium">{t.admin.dashboardPage.bookingLink}</p>
                </div>
                <p className="text-white font-mono text-sm sm:text-base font-semibold truncate">
                  {typeof window !== "undefined" ? window.location.origin : ""}/booking/{user.tenantSlug}
                </p>
                {user.tenantName && (
                  <p className="text-white/40 text-xs mt-0.5">{user.tenantName}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/booking/${user.tenantSlug}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? t.admin.copied : t.admin.copy}
                </button>
                <a
                  href={`/booking/${user.tenantSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white text-[#6355E4] px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors shadow-sm"
                >
                  <ArrowUpRight size={13} />{t.admin.open}
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Onboarding Checklist ──────────────────────────────────────── */}
        {isTenantAdmin && onboarding && !onboarding.isComplete && !onboardingDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EEEBFC] flex items-center justify-center">
                  <Sparkles size={15} className="text-[#6355E4]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#111318]">{t.admin.dashboardPage.setupChecklist}</p>
                  <p className="text-[11px] text-gb-textMuted">
                    {fillTemplate(t.admin.dashboardPage.stepsCompletedTemplate, { completed: onboarding.completedSteps, total: onboarding.totalSteps })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Progress dots */}
                <div className="flex gap-1">
                  {Array.from({ length: onboarding.totalSteps }).map((_, i) => (
                    <div key={i}
                      className={`h-1.5 w-5 rounded-full transition-colors ${
                        i < onboarding.completedSteps ? "bg-[#6355E4]" : "bg-[#F3F4F6]"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => {
                    setOnboardingDismissed(true);
                    if (typeof window !== "undefined") sessionStorage.setItem("onboarding_dismissed", "1");
                  }}
                  className="text-[#D1D5DB] hover:text-[#6B7280] transition-colors p-1 rounded-lg hover:bg-[#F3F4F6]"
                  title={t.admin.dashboardPage.dismiss}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="divide-y divide-[#F3F4F6]">
              {[
                { done: onboarding.hasCompany,   label: t.admin.dashboardPage.stepCompanyName, href: "/admin/settings",  desc: t.admin.dashboardPage.stepCompanyNameDesc },
                { done: onboarding.hasLogo,      label: t.admin.dashboardPage.stepLogo,         href: "/admin/settings",  desc: t.admin.dashboardPage.stepLogoDesc },
                { done: onboarding.hasHours,     label: t.admin.dashboardPage.stepHours,        href: "/admin/settings",  desc: t.admin.dashboardPage.stepHoursDesc },
                { done: onboarding.hasServices,  label: t.admin.dashboardPage.stepServices,     href: "/admin/services",  desc: t.admin.dashboardPage.stepServicesDesc },
                { done: onboarding.hasEmployees, label: t.admin.dashboardPage.stepEmployees,    href: "/admin/employees", desc: t.admin.dashboardPage.stepEmployeesDesc },
              ].map(({ done, label, href, desc }) => (
                <a
                  key={label}
                  href={done ? undefined : href}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                    done ? "opacity-55" : "hover:bg-[#F7F7F8] cursor-pointer"
                  }`}
                >
                  {done
                    ? <CheckCircle2 size={17} className="text-[#6355E4] flex-shrink-0" />
                    : <Circle size={17} className="text-[#D1D5DB] flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? "line-through text-gb-textMuted" : "text-[#111318]"}`}>{label}</p>
                    <p className="text-[11px] text-gb-textMuted">{desc}</p>
                  </div>
                  {!done && <ChevronRight size={13} className="text-[#D1D5DB] flex-shrink-0" />}
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          variants={stagger} initial="hidden" animate="visible"
        >
          <StatCard
            icon={<Calendar size={18} style={{ color: "#6355E4" }} />}
            value={statistics.totalBookingsThisMonth}
            label={t.admin.dashboardPage.bookingsThisMonth}
            growth={monthGrowth}
            accent="#6355E4"
            helpText={t.admin.dashboardPage.bookingsThisMonthHelp}
          />
          <StatCard
            icon={<Euro size={18} style={{ color: "#059669" }} />}
            value={monthlyRevenueDisplay}
            label={t.admin.dashboardPage.revenueThisMonth}
            growth={monthlyRevenueEntries.length <= 1 ? revenueGrowth : null}
            accent="#059669"
            helpText={t.admin.dashboardPage.revenueThisMonthHelp}
          />
          <StatCard
            icon={<Users size={18} style={{ color: "#8B5CF6" }} />}
            value={statistics.totalCustomers}
            label={fillTemplate(t.admin.dashboardPage.customersTotalTemplate, { new: statistics.newCustomersThisMonth })}
            growth={null}
            accent="#8B5CF6"
            helpText={t.admin.dashboardPage.customersTotalHelp}
          />
        </motion.div>

        {/* ── Usage Meter ───────────────────────────────────────────────── */}
        {usage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={15} className="text-[#6355E4]" />
                <span className="text-sm font-semibold text-[#111318]">
                  {t.admin.dashboardPage.planUsage} <span className="text-gb-textMuted font-normal">({usage.planDisplayName})</span>
                </span>
              </div>
              <Link href="/admin/subscription"
                className="text-xs font-medium text-[#6355E4] hover:text-[#4338CA] transition-colors">
                {t.admin.upgrade} →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: t.admin.employees, data: usage.employees },
                { label: t.admin.services,  data: usage.services   },
              ].map(({ label, data }) => {
                if (!data) return null;
                const pct = data.isUnlimited ? 10 : Math.min(data.percentage, 100);
                const barColor = data.percentage >= 100 ? "bg-[#EF4444]"
                  : data.percentage >= 80 ? "bg-[#F59E0B]"
                  : "bg-[#6355E4]";
                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#6B7280]">
                      <span>{label}</span>
                      <span className="font-semibold text-[#374151]">
                        {data.current} / {data.isUnlimited ? "∞" : data.limit}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {(usage.employees?.percentage >= 80 || usage.services?.percentage >= 80) && (
                <div className="flex items-center gap-2 pt-1 text-xs text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-3 py-2.5">
                  <AlertTriangle size={12} className="shrink-0" />
                  {t.admin.dashboardPage.nearingLimit}{" "}
                  <Link href="/admin/subscription" className="font-semibold underline">{t.admin.upgrade}</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="flex flex-wrap gap-2"
        >
          {/* Primary CTA */}
          <Link href="/admin/bookings?new=1"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6355E4] hover:bg-[#4338CA] shadow-sm active:scale-[0.97] transition-all">
            <Calendar size={14} />{t.admin.dashboardPage.newBooking}
          </Link>
          {/* Secondary actions */}
          {[
            { href: "/admin/bookings",      icon: <Clock size={14} className="text-[#6355E4]" />,   label: t.admin.dashboardPage.bookingsToday, badge: today.totalBookings > 0 ? today.totalBookings : null },
            { href: "/admin/customers",     icon: <Users size={14} className="text-[#8B5CF6]" />,   label: t.admin.customers,          badge: null },
            { href: "/admin/calendar",      icon: <CalendarDays size={14} className="text-[#059669]" />, label: t.admin.calendar,    badge: null },
            { href: "/admin/blocked-slots", icon: <Ban size={14} className="text-[#EF4444]" />,     label: t.admin.dashboardPage.blockedSlots,     badge: null },
          ].map(({ href, icon, label, badge }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white text-[#374151] border border-[#E5E7EB] shadow-sm hover:border-[#C7D2FE] hover:text-[#6355E4] active:scale-[0.97] transition-all">
              {icon}{label}
              {badge && (
                <span className="bg-[#6355E4] text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </motion.div>

        {/* ── Main Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Today ─────────────────────────────────────────────────── */}
          <motion.div className="lg:col-span-2"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
                <div>
                  <h2 className="text-sm font-bold text-[#111318]">{t.admin.dashboardPage.today}</h2>
                  <p className="text-[11px] text-gb-textMuted">{todayDate}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gb-textMuted font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{t.admin.dashboardPage.live}
                </div>
              </div>

              {/* Mini stats row */}
              <div className="grid grid-cols-4 divide-x divide-[#F3F4F6] border-b border-[#F3F4F6]">
                {[
                  { value: today.totalBookings,     label: t.admin.dashboardPage.total,       color: "text-[#111318]",  bg: "" },
                  { value: today.completedBookings, label: t.admin.dashboardPage.done,         color: "text-[#059669]",   bg: "bg-[#F0FDF4]" },
                  { value: today.pendingBookings,   label: t.admin.bookingStatus.pending,      color: "text-[#D97706]",   bg: "bg-[#FFFBEB]" },
                  { value: today.cancelledBookings, label: t.admin.bookingStatus.cancelled,    color: "text-[#EF4444]",   bg: "bg-[#FFF5F5]" },
                ].map(({ value, label, color, bg }) => (
                  <div key={label} className={`text-center py-4 px-2 ${bg}`}>
                    <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
                    <div className="text-[10px] text-gb-textMuted mt-0.5 font-medium uppercase tracking-wide">{label}</div>
                  </div>
                ))}
              </div>

              {/* Bookings list */}
              <div className="p-4">
                {today.bookings.length > 0 ? (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {today.bookings.map((b, i) => {
                      const s = statusMap[b.status] ?? statusMap["Pending"];
                      return (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl bg-[#F7F7F8] hover:bg-[#F3F4F6] border border-transparent hover:border-[#E5E7EB] transition-all"
                        >
                          {/* Time */}
                          <div className="text-center min-w-[48px]">
                            <div className="text-sm font-bold text-[#111318] tabular-nums">{b.startTime}</div>
                            <div className="text-[10px] text-gb-textMuted">{b.endTime}</div>
                          </div>
                          {/* Status dot */}
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#111318] truncate">{b.customerName}</p>
                            <p className="text-xs text-gb-textMuted truncate">{b.serviceName}</p>
                          </div>
                          {/* Status badge */}
                          <span className={`hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.bg} ${s.text}`}>
                            {s.label}
                          </span>
                          {/* Price */}
                          <div className="text-right min-w-[60px]">
                            <div className="text-sm font-bold text-[#374151] tabular-nums">{formatPrice(b.price, b.currency)}</div>
                            <div className="text-[10px] text-gb-textMuted font-mono">{b.bookingNumber.slice(-6)}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Calendar size={20} className="text-[#D1D5DB]" />
                    </div>
                    <p className="text-sm font-medium text-[#374151]">{t.admin.dashboardPage.noAppointmentsToday}</p>
                    <p className="text-xs text-gb-textMuted mt-1">{t.admin.dashboardPage.enjoyFreeDay}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Right Column ──────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Next Booking */}
            {nextBooking ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F3F4F6]">
                  <div className="w-8 h-8 rounded-xl bg-[#EEEBFC] flex items-center justify-center">
                    <Clock size={15} className="text-[#6355E4]" />
                  </div>
                  <h3 className="font-bold text-[#111318] text-sm">{t.admin.dashboardPage.nextAppointment}</h3>
                </div>
                <div className="p-5">
                  {/* Countdown */}
                  <div className="text-center mb-4 py-4 bg-[#EEEBFC] rounded-xl border border-[#C7D2FE]">
                    <div className="text-4xl font-black text-[#6355E4] tabular-nums leading-none">
                      {formatTime(nextBooking.minutesUntil, t)}
                    </div>
                    <div className="text-[11px] text-[#6B7280] mt-1.5">{t.admin.dashboardPage.untilNextAppointment}</div>
                  </div>
                  {/* Details */}
                  <div className="space-y-2.5">
                    {[
                      { label: t.admin.service,  value: nextBooking.serviceName },
                      { label: t.admin.customer, value: nextBooking.customerName },
                      { label: t.admin.time,     value: `${nextBooking.startTime} – ${nextBooking.endTime}` },
                      { label: t.admin.date,     value: new Date(nextBooking.date).toLocaleDateString(dateLocale) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-gb-textMuted flex-shrink-0">{label}</span>
                        <span className="text-xs font-semibold text-[#111318] text-right truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 text-center"
              >
                <div className="w-11 h-11 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={18} className="text-[#D1D5DB]" />
                </div>
                <p className="text-sm font-medium text-[#374151]">{t.admin.dashboardPage.noUpcomingAppointment}</p>
              </motion.div>
            )}

            {/* Popular Services */}
            {statistics.popularServices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-[#F3F4F6]">
                  <h3 className="font-bold text-[#111318] text-sm">{t.admin.dashboardPage.popularServices}</h3>
                </div>
                <div className="p-3">
                  {statistics.popularServices.map((s, idx) => (
                    <div key={idx}
                      className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-[#F7F7F8] transition-colors">
                      {/* Rank */}
                      <span className="text-[11px] font-bold text-gb-textMuted w-4 text-center">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#111318] truncate">{s.serviceName}</p>
                        <p className="text-[11px] text-gb-textMuted">{fillTemplate(t.admin.dashboardPage.bookedCountTemplate, { count: s.bookingCount })}</p>
                      </div>
                      <span className="text-sm font-bold text-[#374151] whitespace-nowrap tabular-nums">
                        {formatPrice(defaultCurrency === "CHF" ? s.revenueCHF : s.revenueEUR, defaultCurrency)}
                      </span>
                      <ChevronRight size={12} className="text-[#D1D5DB] flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
