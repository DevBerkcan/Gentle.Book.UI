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
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { HelpTip } from "@/components/ui/help-tip";

// ── Design Tokens (matching AdminLinksPage & AdminSettingsPage) ───────────────
// bg:         #F7F7F8
// surface:    #FFFFFF
// border:     #E5E7EB   subtle: #F3F4F6
// text-1:     #111318   text-2: #374151   text-3: #6B7280   text-4: #9CA3AF
// accent:     #4F46E5   accent-bg: #EEF2FF   accent-bdr: #A5B4FC / #C7D2FE
// success:    #065F46 on #D1FAE5   error: #991B1B on #FEE2E2
// ─────────────────────────────────────────────────────────────────────────────

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  Confirmed: { label: "Bestätigt",        dot: "bg-emerald-400", bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
  Pending:   { label: "Ausstehend",       dot: "bg-amber-400",   bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
  Completed: { label: "Abgeschlossen",    dot: "bg-[#4F46E5]",   bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]" },
  Cancelled: { label: "Storniert",        dot: "bg-red-400",     bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" },
  NoShow:    { label: "Nicht erschienen", dot: "bg-[#9CA3AF]",   bg: "bg-[#F3F4F6]", text: "text-[#374151]" },
};

function formatTime(mins: number) {
  if (mins < 60)   return `${mins} Min`;
  if (mins < 1440) return `${Math.floor(mins / 60)} Std`;
  const d = Math.floor(mins / 1440);
  return `${d} Tag${d > 1 ? "e" : ""}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 17) return "Guten Tag";
  return "Guten Abend";
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
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);
  const [dashboard,            setDashboard]           = useState<DashboardOverview | null>(null);
  const [onboarding,           setOnboarding]          = useState<OnboardingStatus | null>(null);
  const [onboardingDismissed,  setOnboardingDismissed] = useState(false);
  const [loading,              setLoading]             = useState(true);
  const [error,                setError]               = useState<string | null>(null);
  const [copied,               setCopied]              = useState(false);
  const [defaultCurrency,      setDefaultCurrency]     = useState("EUR");
  const [usage,                setUsage]               = useState<any>(null);

  useEffect(() => {
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
  }, [isTenantAdmin]);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#4F46E5] rounded-full animate-spin" />
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
          <h2 className="text-base font-bold text-[#111318] mb-2">Fehler beim Laden</h2>
          <p className="text-sm text-[#6B7280]">{error || "Dashboard nicht verfügbar"}</p>
        </div>
      </div>
    );
  }

  const { today, nextBooking, statistics } = dashboard;

  const revenueThis = defaultCurrency === "CHF" ? statistics.revenueThisMonthCHF  : statistics.revenueThisMonthEUR;
  const revenueLast = defaultCurrency === "CHF" ? statistics.revenueLastMonthCHF  : statistics.revenueLastMonthEUR;

  const monthGrowth   = statistics.totalBookingsLastMonth > 0
    ? ((statistics.totalBookingsThisMonth - statistics.totalBookingsLastMonth) / statistics.totalBookingsLastMonth) * 100 : 0;
  const revenueGrowth = revenueLast > 0
    ? ((revenueThis - revenueLast) / revenueLast) * 100 : 0;

  const todayDate = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });

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
              <p className="text-xs text-[#9CA3AF] font-medium">{todayDate}</p>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#111318] tracking-tight">
              {greeting()}{user?.firstName ? `, ${user.firstName}` : ""}! 👋
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">Hier ist deine heutige Übersicht.</p>
          </div>
        </motion.div>

        {/* ── Booking Link Banner ───────────────────────────────────────── */}
        {isTenantAdmin && user?.tenantSlug && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl p-5 border border-[#C7D2FE] bg-[#4F46E5]"
          >
            {/* Decorative shapes */}
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
            <div className="absolute -bottom-3 right-16 w-16 h-16 bg-white/6 rounded-full" />

            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ExternalLink size={13} className="text-white/60" />
                  <p className="text-white/60 text-xs font-medium">Dein Buchungslink</p>
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
                  {copied ? "Kopiert!" : "Kopieren"}
                </button>
                <a
                  href={`/booking/${user.tenantSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-white text-[#4F46E5] px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors shadow-sm"
                >
                  <ArrowUpRight size={13} />Öffnen
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
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
                  <Sparkles size={15} className="text-[#4F46E5]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#111318]">Setup-Checkliste</p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {onboarding.completedSteps} von {onboarding.totalSteps} Schritten abgeschlossen
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Progress dots */}
                <div className="flex gap-1">
                  {Array.from({ length: onboarding.totalSteps }).map((_, i) => (
                    <div key={i}
                      className={`h-1.5 w-5 rounded-full transition-colors ${
                        i < onboarding.completedSteps ? "bg-[#4F46E5]" : "bg-[#F3F4F6]"
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
                  title="Ausblenden"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="divide-y divide-[#F3F4F6]">
              {[
                { done: onboarding.hasCompany,   label: "Firmenname eintragen",     href: "/admin/settings",  desc: "Name deines Studios festlegen" },
                { done: onboarding.hasLogo,      label: "Logo hochladen",            href: "/admin/settings",  desc: "Dein Logo für Buchungsseite & E-Mails" },
                { done: onboarding.hasHours,     label: "Öffnungszeiten festlegen",  href: "/admin/settings",  desc: "Wann ist dein Studio geöffnet?" },
                { done: onboarding.hasServices,  label: "Ersten Service anlegen",    href: "/admin/services",  desc: "Welche Leistungen bietest du an?" },
                { done: onboarding.hasEmployees, label: "Mitarbeiter hinzufügen",    href: "/admin/employees", desc: "Wer führt die Termine durch?" },
              ].map(({ done, label, href, desc }) => (
                <a
                  key={label}
                  href={done ? undefined : href}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                    done ? "opacity-55" : "hover:bg-[#F7F7F8] cursor-pointer"
                  }`}
                >
                  {done
                    ? <CheckCircle2 size={17} className="text-[#4F46E5] flex-shrink-0" />
                    : <Circle size={17} className="text-[#D1D5DB] flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? "line-through text-[#9CA3AF]" : "text-[#111318]"}`}>{label}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{desc}</p>
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
            icon={<Calendar size={18} style={{ color: "#4F46E5" }} />}
            value={statistics.totalBookingsThisMonth}
            label="Buchungen diesen Monat"
            growth={monthGrowth}
            accent="#4F46E5"
            helpText="Alle neuen Buchungen die in diesem Kalendermonat erstellt wurden"
          />
          <StatCard
            icon={<Euro size={18} style={{ color: "#059669" }} />}
            value={formatPrice(revenueThis, defaultCurrency)}
            label={`Umsatz ${defaultCurrency} diesen Monat`}
            growth={revenueGrowth}
            accent="#059669"
            helpText="Summe aller nicht-stornierten Buchungen dieses Monats basierend auf dem Servicepreis"
          />
          <StatCard
            icon={<Users size={18} style={{ color: "#8B5CF6" }} />}
            value={statistics.totalCustomers}
            label={`Kunden gesamt (${statistics.newCustomersThisMonth} neu)`}
            growth={null}
            accent="#8B5CF6"
            helpText="Alle registrierten Kunden in deinem System"
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
                <BarChart2 size={15} className="text-[#4F46E5]" />
                <span className="text-sm font-semibold text-[#111318]">
                  Plan-Nutzung <span className="text-[#9CA3AF] font-normal">({usage.planDisplayName})</span>
                </span>
              </div>
              <Link href="/admin/subscription"
                className="text-xs font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors">
                Upgraden →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: "Mitarbeiter", data: usage.employees },
                { label: "Services",   data: usage.services   },
              ].map(({ label, data }) => {
                if (!data) return null;
                const pct = data.isUnlimited ? 10 : Math.min(data.percentage, 100);
                const barColor = data.percentage >= 100 ? "bg-[#EF4444]"
                  : data.percentage >= 80 ? "bg-[#F59E0B]"
                  : "bg-[#4F46E5]";
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
                  Sie nähern sich dem Limit Ihres Plans.{" "}
                  <Link href="/admin/subscription" className="font-semibold underline">Upgrade</Link>
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-sm active:scale-[0.97] transition-all">
            <Calendar size={14} />Neue Buchung
          </Link>
          {/* Secondary actions */}
          {[
            { href: "/admin/bookings",      icon: <Clock size={14} className="text-[#4F46E5]" />,   label: "Buchungen heute", badge: today.totalBookings > 0 ? today.totalBookings : null },
            { href: "/admin/customers",     icon: <Users size={14} className="text-[#8B5CF6]" />,   label: "Kunden",          badge: null },
            { href: "/admin/calendar",      icon: <CalendarDays size={14} className="text-[#059669]" />, label: "Kalender",    badge: null },
            { href: "/admin/blocked-slots", icon: <Ban size={14} className="text-[#EF4444]" />,     label: "Sperrzeiten",     badge: null },
          ].map(({ href, icon, label, badge }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white text-[#374151] border border-[#E5E7EB] shadow-sm hover:border-[#C7D2FE] hover:text-[#4F46E5] active:scale-[0.97] transition-all">
              {icon}{label}
              {badge && (
                <span className="bg-[#4F46E5] text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">
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
                  <h2 className="text-sm font-bold text-[#111318]">Heute</h2>
                  <p className="text-[11px] text-[#9CA3AF]">{todayDate}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
                </div>
              </div>

              {/* Mini stats row */}
              <div className="grid grid-cols-4 divide-x divide-[#F3F4F6] border-b border-[#F3F4F6]">
                {[
                  { value: today.totalBookings,     label: "Gesamt",     color: "text-[#111318]",  bg: "" },
                  { value: today.completedBookings, label: "Erledigt",   color: "text-[#059669]",   bg: "bg-[#F0FDF4]" },
                  { value: today.pendingBookings,   label: "Ausstehend", color: "text-[#D97706]",   bg: "bg-[#FFFBEB]" },
                  { value: today.cancelledBookings, label: "Storniert",  color: "text-[#EF4444]",   bg: "bg-[#FFF5F5]" },
                ].map(({ value, label, color, bg }) => (
                  <div key={label} className={`text-center py-4 px-2 ${bg}`}>
                    <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
                    <div className="text-[10px] text-[#9CA3AF] mt-0.5 font-medium uppercase tracking-wide">{label}</div>
                  </div>
                ))}
              </div>

              {/* Bookings list */}
              <div className="p-4">
                {today.bookings.length > 0 ? (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {today.bookings.map((b, i) => {
                      const s = STATUS_MAP[b.status] ?? STATUS_MAP["Pending"];
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
                            <div className="text-[10px] text-[#9CA3AF]">{b.endTime}</div>
                          </div>
                          {/* Status dot */}
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#111318] truncate">{b.customerName}</p>
                            <p className="text-xs text-[#9CA3AF] truncate">{b.serviceName}</p>
                          </div>
                          {/* Status badge */}
                          <span className={`hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.bg} ${s.text}`}>
                            {s.label}
                          </span>
                          {/* Price */}
                          <div className="text-right min-w-[60px]">
                            <div className="text-sm font-bold text-[#374151] tabular-nums">{formatPrice(b.price, b.currency)}</div>
                            <div className="text-[10px] text-[#9CA3AF] font-mono">{b.bookingNumber.slice(-6)}</div>
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
                    <p className="text-sm font-medium text-[#374151]">Keine Termine heute</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">Genieße den freien Tag!</p>
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
                  <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
                    <Clock size={15} className="text-[#4F46E5]" />
                  </div>
                  <h3 className="font-bold text-[#111318] text-sm">Nächster Termin</h3>
                </div>
                <div className="p-5">
                  {/* Countdown */}
                  <div className="text-center mb-4 py-4 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE]">
                    <div className="text-4xl font-black text-[#4F46E5] tabular-nums leading-none">
                      {formatTime(nextBooking.minutesUntil)}
                    </div>
                    <div className="text-[11px] text-[#6B7280] mt-1.5">bis zum nächsten Termin</div>
                  </div>
                  {/* Details */}
                  <div className="space-y-2.5">
                    {[
                      { label: "Service",  value: nextBooking.serviceName },
                      { label: "Kunde",    value: nextBooking.customerName },
                      { label: "Uhrzeit",  value: `${nextBooking.startTime} – ${nextBooking.endTime}` },
                      { label: "Datum",    value: new Date(nextBooking.date).toLocaleDateString("de-DE") },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-[#9CA3AF] flex-shrink-0">{label}</span>
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
                <p className="text-sm font-medium text-[#374151]">Kein bevorstehender Termin</p>
              </motion.div>
            )}

            {/* Popular Services */}
            {statistics.popularServices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-[#F3F4F6]">
                  <h3 className="font-bold text-[#111318] text-sm">Beliebte Services</h3>
                </div>
                <div className="p-3">
                  {statistics.popularServices.map((s, idx) => (
                    <div key={idx}
                      className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-[#F7F7F8] transition-colors">
                      {/* Rank */}
                      <span className="text-[11px] font-bold text-[#9CA3AF] w-4 text-center">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#111318] truncate">{s.serviceName}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{s.bookingCount}× gebucht</p>
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
