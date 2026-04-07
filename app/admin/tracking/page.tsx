"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import {
  TrendingUp, Users, BarChart3, MousePointerClick,
  Calendar, Instagram, MapPin, MessageCircle, FileText, Shield,
  Clock, Eye, DollarSign, Euro
} from "lucide-react";
import {
  getTrackingStatistics, getRevenueStatistics,
  type SimplifiedTrackingStatistics, type RevenueStatistics,
} from "@/lib/api/admin";
import { socialLinks, footerLinks } from "@/lib/config";
import { formatPrice } from "@/lib/utils/currency";

const getIconForLink = (linkName: string) => {
  if (linkName.includes("Online buchen")) return Calendar;
  if (linkName.includes("Instagram")) return Instagram;
  if (linkName.includes("Route")) return MapPin;
  if (linkName.includes("WhatsApp")) return MessageCircle;
  if (linkName.includes("Impressum")) return FileText;
  if (linkName.includes("Datenschutz")) return Shield;
  return MousePointerClick;
};

export default function TrackingPage() {
  const [stats, setStats] = useState<SimplifiedTrackingStatistics | null>(null);
  const [revenue, setRevenue] = useState<RevenueStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  async function loadStatistics() {
    try {
      setLoading(true);
      setError(null);
      const [statsData, revenueData] = await Promise.all([
        getTrackingStatistics(),
        getRevenueStatistics(),
      ]);
      setStats(statsData);
      setRevenue(revenueData);
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Statistiken");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#017172]" />
      </div>
    );
  }

  if (error || !stats || !revenue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <p className="font-semibold mb-1">Fehler beim Laden</p>
            <p className="text-sm">{error || "Unbekannter Fehler"}</p>
          </div>
        </div>
      </div>
    );
  }

  const expectedLinks = [
    ...socialLinks.map((l) => l.label),
    ...footerLinks.map((l) => `Footer: ${l.label}`),
  ];

  const allLinkStats = expectedLinks
    .map((linkName) => {
      const found = stats.linkClicks.find((l) => l.linkName === linkName);
      return {
        linkName,
        clickCount: found?.clickCount || 0,
        percentage: found?.percentage || 0,
      };
    })
    .sort((a, b) => b.clickCount - a.clickCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] mb-1">Statistiken</h1>
          <p className="text-sm text-[#8A8A8A]">Gesamtübersicht aller Zeiten</p>
        </div>

        {/* ── Overview Cards (All Time) ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="border border-[#E8C7C3]/30 shadow-xl">
            <CardBody className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-[#8A8A8A] mb-1">Seitenaufrufe (gesamt)</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">{stats.totalPageViews}</div>
                </div>
                <div className="p-2 sm:p-3 bg-[#017172]/10 rounded-xl">
                  <Eye className="text-[#017172]" size={20} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-[#E8C7C3]/30 shadow-xl">
            <CardBody className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-[#8A8A8A] mb-1">Total Klicks (gesamt)</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#017172]">{stats.totalLinkClicks}</div>
                </div>
                <div className="p-2 sm:p-3 bg-[#017172]/10 rounded-xl">
                  <MousePointerClick className="text-[#017172]" size={20} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-[#E8C7C3]/30 shadow-xl">
            <CardBody className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-[#8A8A8A] mb-1">Buchungen (gesamt)</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#017172]">{stats.totalBookings}</div>
                </div>
                <div className="p-2 sm:p-3 bg-[#017172]/10 rounded-xl">
                  <BarChart3 className="text-[#017172]" size={20} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-[#E8C7C3]/30 shadow-xl">
            <CardBody className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-[#8A8A8A] mb-1">Ø CHF</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#017172]">
                    {formatPrice(stats.averageBookingValueCHF, "CHF")}
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-[#017172]/10 rounded-xl">
                  <DollarSign className="text-[#017172]" size={20} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-[#E8C7C3]/30 shadow-xl">
            <CardBody className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-[#8A8A8A] mb-1">Ø EUR</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#017172]">
                    {formatPrice(stats.averageBookingValueEUR, "EUR")}
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-[#017172]/10 rounded-xl">
                  <Euro className="text-[#017172]" size={20} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ── All Time Revenue Card ──────────────────────────────────────── */}
        <Card className="mb-6 border border-[#E8C7C3]/30 shadow-xl bg-gradient-to-br from-[#017172]/5 to-transparent">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#017172] rounded-xl">
                  <DollarSign className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1E1E1E]">Gesamtumsatz aller Zeiten</h3>
                  <p className="text-sm text-[#8A8A8A]">{revenue.allTimeBookings} Buchungen insgesamt</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div>
                  <div className="text-sm text-[#8A8A8A]">CHF</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#017172]">
                    {formatPrice(revenue.allTimeRevenueCHF, "CHF")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#8A8A8A]">EUR</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#017172]">
                    {formatPrice(revenue.allTimeRevenueEUR, "EUR")}
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* ── Revenue Cards (Time Periods) ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { 
              label: "Heute", 
              bookings: revenue.todayBookings, 
              revCHF: revenue.todayRevenueCHF, 
              revEUR: revenue.todayRevenueEUR,
              icon: Clock 
            },
            { 
              label: "Letzte 7 Tage", 
              bookings: revenue.weekBookings, 
              revCHF: revenue.weekRevenueCHF, 
              revEUR: revenue.weekRevenueEUR,
              icon: Calendar 
            },
            { 
              label: "Letzte 30 Tage", 
              bookings: revenue.monthBookings, 
              revCHF: revenue.monthRevenueCHF, 
              revEUR: revenue.monthRevenueEUR,
              icon: Calendar 
            },
          ].map(({ label, bookings, revCHF, revEUR, icon: Icon }) => (
            <Card key={label} className="border border-[#E8C7C3]/30 shadow-xl">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
                <div className="flex items-center gap-2">
                  <Icon size={18} className="text-[#017172]" />
                  <h3 className="text-base font-semibold text-[#1E1E1E]">{label}</h3>
                </div>
              </CardHeader>
              <CardBody className="p-4 sm:p-6 pt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[#8A8A8A]">CHF</span>
                  <div className="text-xl sm:text-2xl font-bold text-[#017172]">
                    {formatPrice(revCHF, "CHF")}
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[#8A8A8A]">EUR</span>
                  <div className="text-xl sm:text-2xl font-bold text-[#017172]">
                    {formatPrice(revEUR, "EUR")}
                  </div>
                </div>
                <div className="text-sm text-[#8A8A8A] text-right">{bookings} Buchungen</div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* ── Link Click Stats ───────────────────────────────────────────── */}
        <Card className="border border-[#E8C7C3]/30 shadow-xl">
          <CardHeader className="px-4 sm:px-6 py-4 border-b border-[#E8C7C3]/20">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E] flex items-center gap-2">
              <MousePointerClick size={22} className="text-[#017172]" />
              Klicks nach Link (gesamt)
            </h2>
          </CardHeader>
          <CardBody className="p-4 sm:p-6">
            {allLinkStats.filter((l) => l.clickCount > 0).length === 0 ? (
              <div className="text-center py-8 text-[#8A8A8A]">
                <MousePointerClick className="mx-auto mb-3 text-[#E8C7C3]" size={36} />
                <p className="text-base">Noch keine Klicks vorhanden</p>
                <p className="text-sm mt-2">Klicks auf deine Links werden hier angezeigt</p>
              </div>
            ) : (
              <div className="space-y-5">
                {allLinkStats
                  .filter((l) => l.clickCount > 0)
                  .map((link) => {
                    const Icon = getIconForLink(link.linkName);
                    return (
                      <div key={link.linkName} className="border-l-4 border-[#017172] pl-4 py-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <Icon size={18} className="text-[#017172] shrink-0" />
                            <div>
                              <div className="font-bold text-base text-[#1E1E1E]">
                                {link.linkName.replace("Footer: ", "")}
                                {link.linkName.startsWith("Footer: ") && (
                                  <span className="ml-2 text-xs bg-[#F5EDEB] border border-[#E8C7C3]/40 px-2 py-0.5 rounded-full text-[#8A8A8A] font-normal">
                                    Footer
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-[#8A8A8A]">{link.clickCount} Klicks</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[#017172]">
                              {link.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-[#F5EDEB] rounded-full h-2.5">
                          <div
                            className="bg-gradient-to-r from-[#017172] to-[#015f60] h-2.5 rounded-full transition-all"
                            style={{ width: `${link.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}