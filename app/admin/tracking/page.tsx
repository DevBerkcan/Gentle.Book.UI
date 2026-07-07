// app/admin/tracking/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  TrendingUp, Users, BarChart3, MousePointerClick,
  Calendar, Instagram, MapPin, MessageCircle, FileText, Shield,
  Clock, Eye, DollarSign, Euro, AlertTriangle,
} from "lucide-react";
import { HelpTip } from "@/components/ui/help-tip";
import {
  getTrackingStatistics, getRevenueStatistics, getStatistics,
  type SimplifiedTrackingStatistics, type RevenueStatistics, type DashboardStatistics,
} from "@/lib/api/admin";
import { socialLinks, footerLinks } from "@/lib/config";
import { formatPrice } from "@/lib/utils/currency";

// ── Design Tokens (matching full admin suite) ─────────────────────────────────
// bg:         #F7F7F8
// surface:    #FFFFFF
// border:     #E5E7EB   subtle: #F3F4F6
// text-1:     #111318   text-2: #374151   text-3: #6B7280   text-4: #9CA3AF
// accent:     #6355E4   accent-bg: #EEEBFC   accent-bdr: #C7D2FE
// success:    #059669   error: #EF4444   warning: #D97706
// ─────────────────────────────────────────────────────────────────────────────

const getIconForLink = (linkName: string) => {
  if (linkName.includes("Online buchen")) return Calendar;
  if (linkName.includes("Instagram"))    return Instagram;
  if (linkName.includes("Route"))        return MapPin;
  if (linkName.includes("WhatsApp"))     return MessageCircle;
  if (linkName.includes("Impressum"))    return FileText;
  if (linkName.includes("Datenschutz"))  return Shield;
  return MousePointerClick;
};

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
  label, bookings, revCHF, revEUR, icon: Icon,
}: {
  label: string; bookings: number;
  revCHF: number; revEUR: number;
  icon: React.ElementType;
}) {
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
          {[
            { cur: "CHF", val: revCHF },
            { cur: "EUR", val: revEUR },
          ].map(({ cur, val }) => (
            <div key={cur} className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9CA3AF]">{cur}</span>
              <span className="text-lg font-bold text-[#111318] tabular-nums">
                <AnimatedNumber value={val} formatFn={(n) => formatPrice(n, cur)} />
              </span>
            </div>
          ))}
          <div className="pt-1 border-t border-[#F3F4F6] flex items-center justify-between">
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Buchungen</span>
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
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);

  const [stats,          setStats]          = useState<SimplifiedTrackingStatistics | null>(null);
  const [revenue,        setRevenue]        = useState<RevenueStatistics | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  useEffect(() => { loadStatistics(); }, []);

  async function loadStatistics() {
    try {
      setLoading(true); setError(null);
      const [statsData, revenueData, dashboardData] = await Promise.all([
        getTrackingStatistics(), getRevenueStatistics(), getStatistics(),
      ]);
      setStats(statsData); setRevenue(revenueData); setDashboardStats(dashboardData);
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Statistiken");
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

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !stats || !revenue) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-sm">
          <div className="w-11 h-11 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={18} className="text-[#991B1B]" />
          </div>
          <p className="font-semibold text-[#111318] mb-1">Fehler beim Laden</p>
          <p className="text-sm text-[#6B7280]">{error || "Unbekannter Fehler"}</p>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const expectedLinks = [
    ...socialLinks.map((l) => l.label),
    ...footerLinks.map((l) => `Footer: ${l.label}`),
  ];

  const allLinkStats = expectedLinks
    .map((linkName) => {
      const found = stats.linkClicks.find((l) => l.linkName === linkName);
      return { linkName, clickCount: found?.clickCount || 0, percentage: found?.percentage || 0 };
    })
    .sort((a, b) => b.clickCount - a.clickCount);

  const bookingConversion = stats.totalPageViews > 0
    ? (stats.totalBookings / stats.totalPageViews) * 100 : 0;
  const clickThroughRate = stats.totalPageViews > 0
    ? (stats.totalLinkClicks / stats.totalPageViews) * 100 : 0;
  const topLink    = stats.linkClicks.slice().sort((a, b) => b.clickCount - a.clickCount)[0] ?? null;
  const topService = dashboardStats?.popularServices?.[0] ?? null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div>
          <h1 className="text-[22px] font-bold text-[#111318] tracking-tight">Statistiken</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Gesamtübersicht aller Zeiten</p>
        </div>

        {/* ── Conversion Insights ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Conversion</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Booking conversion */}
            <div className="relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3">
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-[#059669]" />
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#059669] mb-1">
                <TrendingUp size={11} />Zur Buchung
              </div>
              <p className="text-2xl font-bold text-[#111318]">{bookingConversion.toFixed(1)}%</p>
            </div>
            {/* CTR */}
            <div className="relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3">
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-[#D97706]" />
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#D97706] mb-1">
                <BarChart3 size={11} />CTR
              </div>
              <p className="text-2xl font-bold text-[#111318]">{clickThroughRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Highlight rows */}
          <div className="space-y-2">
            {[
              {
                label: "Meist geklickter Link",
                value: topLink ? `${topLink.linkName} · ${topLink.clickCount} Klicks` : "Noch keine Klicks",
                icon: <MousePointerClick size={14} className="text-[#6355E4]" />,
              },
              {
                label: "Top-Service",
                value: topService ? `${topService.serviceName} · ${topService.bookingCount} Buchungen` : "Noch keine Daten",
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
            label="Seitenaufrufe (gesamt)"
            value={stats.totalPageViews}
            icon={Eye}
            accent="#6355E4"
            helpText="Wie oft deine Buchungsseite von Besuchern aufgerufen wurde — inkl. wiederholter Besuche"
          />
          <OverviewTile
            label="Klicks (gesamt)"
            value={stats.totalLinkClicks}
            icon={MousePointerClick}
            accent="#8B5CF6"
            helpText="Wie oft Besucher auf Links geklickt haben — z.B. Buchung starten, Social Media, Route"
          />
          <OverviewTile
            label="Buchungen (gesamt)"
            value={stats.totalBookings}
            icon={BarChart3}
            accent="#059669"
            helpText="Gesamtzahl aller Buchungen die über deine Buchungsseite eingegangen sind"
          />
          <OverviewTile
            label="Ø Buchungswert CHF"
            value={stats.averageBookingValueCHF}
            icon={DollarSign}
            accent="#D97706"
            formatFn={(n) => formatPrice(n, "CHF")}
            helpText="Durchschnittlicher Buchungswert in Schweizer Franken über alle abgeschlossenen Buchungen"
          />
          <OverviewTile
            label="Ø Buchungswert EUR"
            value={stats.averageBookingValueEUR}
            icon={Euro}
            accent="#0EA5E9"
            formatFn={(n) => formatPrice(n, "EUR")}
            helpText="Durchschnittlicher Buchungswert in Euro über alle abgeschlossenen Buchungen"
          />
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
                <p className="font-semibold text-white text-base">Gesamtumsatz aller Zeiten</p>
                <p className="text-white/55 text-xs">{revenue.allTimeBookings} Buchungen insgesamt</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              {[
                { cur: "CHF", val: revenue.allTimeRevenueCHF },
                { cur: "EUR", val: revenue.allTimeRevenueEUR },
              ].map(({ cur, val }) => (
                <div key={cur}>
                  <p className="text-white/50 text-xs font-medium">{cur}</p>
                  <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-tight">
                    {formatPrice(val, cur)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Revenue Periods ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RevenuePeriodCard
            label="Heute"
            bookings={revenue.todayBookings}
            revCHF={revenue.todayRevenueCHF}
            revEUR={revenue.todayRevenueEUR}
            icon={Clock}
          />
          <RevenuePeriodCard
            label="Letzte 7 Tage"
            bookings={revenue.weekBookings}
            revCHF={revenue.weekRevenueCHF}
            revEUR={revenue.weekRevenueEUR}
            icon={Calendar}
          />
          <RevenuePeriodCard
            label="Letzte 30 Tage"
            bookings={revenue.monthBookings}
            revCHF={revenue.monthRevenueCHF}
            revEUR={revenue.monthRevenueEUR}
            icon={Calendar}
          />
        </div>

        {/* ── Link Click Stats ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F3F4F6]">
            <div className="w-8 h-8 rounded-xl bg-[#EEEBFC] flex items-center justify-center">
              <MousePointerClick size={15} className="text-[#6355E4]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#111318]">Klicks nach Link</p>
              <p className="text-[11px] text-[#9CA3AF]">Gesamte Klick-Verteilung</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {allLinkStats.filter((l) => l.clickCount > 0).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <MousePointerClick size={20} className="text-[#D1D5DB]" />
                </div>
                <p className="text-sm font-medium text-[#374151]">Noch keine Klicks vorhanden</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Klicks auf deine Links werden hier angezeigt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allLinkStats
                  .filter((l) => l.clickCount > 0)
                  .map((link) => {
                    const Icon = getIconForLink(link.linkName);
                    const isFooter = link.linkName.startsWith("Footer: ");
                    const displayName = link.linkName.replace("Footer: ", "");
                    return (
                      <div key={link.linkName} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#EEEBFC] flex items-center justify-center flex-shrink-0">
                              <Icon size={13} className="text-[#6355E4]" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[#111318] truncate">{displayName}</span>
                                {isFooter && (
                                  <span className="text-[9px] font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                                    Footer
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#9CA3AF]">{link.clickCount} Klicks</p>
                            </div>
                          </div>
                          <span className="text-base font-bold text-[#111318] tabular-nums flex-shrink-0">
                            {link.percentage.toFixed(1)}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-[#F3F4F6] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-[#6355E4] transition-all duration-700"
                            style={{ width: `${link.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
