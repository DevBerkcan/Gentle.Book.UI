'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, User, Phone, Mail, Scissors,
  CheckCircle, XCircle, AlertCircle, ChevronRight,
  Plus, Ban, MessageSquare, ArrowRight, Hash,
  CalendarDays, Sparkles, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { adminApi, BookingListItem } from '@/lib/api/admin';
import { formatPrice } from '@/lib/utils/currency';

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Confirmed: { label: 'Bestätigt',        bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  Pending:   { label: 'Ausstehend',       bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  Completed: { label: 'Abgeschlossen',    bg: 'bg-[#EEEBFC]',  text: 'text-[#6355E4]',  dot: 'bg-[#6355E4]' },
  Cancelled: { label: 'Storniert',        bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400' },
  NoShow:    { label: 'Nicht erschienen', bg: 'bg-gray-100',   text: 'text-gray-600',    dot: 'bg-gray-400' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Guten Morgen';
  if (h < 17) return 'Guten Tag';
  return 'Guten Abend';
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function in30DaysStr() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export default function EmployeeDashboardPage() {
  const { user, isEmployee, isTenantAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [todayBookings,    setTodayBookings]    = useState<BookingListItem[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingListItem[]>([]);
  const [loadingData,      setLoadingData]      = useState(true);
  const [currency,         setCurrency]         = useState('EUR');

  // Admins go to the full admin dashboard
  useEffect(() => {
    if (!authLoading && isTenantAdmin) router.replace('/admin/dashboard');
  }, [isTenantAdmin, authLoading, router]);

  // Redirect non-employees
  useEffect(() => {
    if (!authLoading && !isEmployee && !isTenantAdmin) router.replace('/admin/login');
  }, [isEmployee, isTenantAdmin, authLoading, router]);

  useEffect(() => {
    if (authLoading || !isEmployee || !user?.id) return;

    const empId = user.id;
    const today  = todayStr();
    const future = in30DaysStr();

    Promise.all([
      adminApi.getBookings({ fromDate: today,     toDate: today,  employeeId: empId, pageSize: 50 }),
      adminApi.getBookings({ fromDate: tomorrowStr(), toDate: future, employeeId: empId, pageSize: 10 }),
      import('@/lib/api/client').then(m => m.default.get('/tenant/settings')),
    ])
      .then(([todayRes, upcomingRes, settingsRes]) => {
        setTodayBookings(todayRes.items ?? []);
        setUpcomingBookings(upcomingRes.items ?? []);
        const d = settingsRes.data?.data ?? settingsRes.data;
        if (d?.defaultCurrency) setCurrency(d.defaultCurrency);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [authLoading, isEmployee, user?.id]);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.name ?? 'Mitarbeiter';

  const activeToday = todayBookings.filter(b => b.status !== 'Cancelled' && b.status !== 'NoShow');
  const nextBooking = activeToday.find(b => {
    const now = new Date();
    const start = new Date(`${b.bookingDate}T${b.startTime}`);
    return start >= now;
  }) ?? activeToday[0] ?? null;

  const completedToday = todayBookings.filter(b => b.status === 'Completed').length;
  const cancelledToday = todayBookings.filter(b => b.status === 'Cancelled').length;

  if (authLoading || (!isEmployee && !isTenantAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 md:p-6 space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <p className="text-sm text-[#9CA3AF] mb-0.5">{greeting()},</p>
          <h1 className="text-2xl font-bold text-[#111318] flex items-center gap-2">
            {displayName}
            <Sparkles size={18} className="text-[#6355E4]" />
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/blocked-slots"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F6F5FA] transition-colors"
          >
            <Ban size={15} className="text-[#9CA3AF]" /> Abwesenheit
          </Link>
          <Link
            href="/admin/employee-notes"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F6F5FA] transition-colors"
          >
            <MessageSquare size={15} className="text-[#9CA3AF]" /> Notiz senden
          </Link>
          <Link
            href="/admin/calendar"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#5646D6] transition-colors"
          >
            <Calendar size={15} /> Kalender
          </Link>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Heute gesamt',     value: activeToday.length,   icon: CalendarDays, color: '#6355E4', bg: '#EEEBFC' },
          { label: 'Abgeschlossen',    value: completedToday,       icon: CheckCircle,  color: '#059669', bg: '#D1FAE5' },
          { label: 'Storniert heute',  value: cancelledToday,       icon: XCircle,      color: '#DC2626', bg: '#FEE2E2' },
          { label: 'Demnächst',        value: upcomingBookings.length, icon: TrendingUp, color: '#D97706', bg: '#FEF3C7' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-[#9CA3AF]">{stat.label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#111318]">
              {loadingData ? <span className="inline-block w-6 h-6 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" /> : stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Nächster Termin */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#EEEBFC] rounded-xl flex items-center justify-center">
              <Clock size={15} className="text-[#6355E4]" />
            </div>
            <h2 className="font-semibold text-[#111318] text-sm">Nächster Termin</h2>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
            </div>
          ) : nextBooking ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-[#111318]">{nextBooking.customerName}</p>
                {(() => {
                  const s = STATUS_MAP[nextBooking.status] ?? STATUS_MAP.Pending;
                  return (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-sm text-[#6355E4] font-medium mb-3">{nextBooking.serviceName}</p>
              <div className="space-y-1.5 text-xs text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span>{nextBooking.startTime.slice(0,5)} – {nextBooking.endTime.slice(0,5)} Uhr</span>
                </div>
                {nextBooking.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} />
                    <a href={`tel:${nextBooking.customerPhone}`} className="hover:text-[#6355E4]">
                      {nextBooking.customerPhone}
                    </a>
                  </div>
                )}
                {nextBooking.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} />
                    <a href={`mailto:${nextBooking.customerEmail}`} className="hover:text-[#6355E4] truncate">
                      {nextBooking.customerEmail}
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6355E4]">
                  {formatPrice(nextBooking.price, nextBooking.currency ?? currency)}
                </span>
                <span className="text-[10px] text-[#9CA3AF]">#{nextBooking.bookingNumber}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-[#374151]">Keine weiteren Termine heute</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Schöner Tag!</p>
            </div>
          )}
        </motion.div>

        {/* Heutige Termine */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#EEEBFC] rounded-xl flex items-center justify-center">
                <CalendarDays size={15} className="text-[#6355E4]" />
              </div>
              <h2 className="font-semibold text-[#111318] text-sm">Termine heute</h2>
            </div>
            <Link href="/admin/bookings" className="text-xs text-[#6355E4] font-medium flex items-center gap-1 hover:underline">
              Alle <ArrowRight size={12} />
            </Link>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
            </div>
          ) : todayBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="text-[#E5E7EB] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#374151]">Keine Termine heute</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Genießen Sie den freien Tag</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {todayBookings.map((booking) => {
                const s = STATUS_MAP[booking.status] ?? STATUS_MAP.Pending;
                const isPast = new Date(`${booking.bookingDate}T${booking.endTime}`) < new Date();
                return (
                  <div
                    key={booking.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isPast ? 'bg-[#F9FAFB] border-[#F3F4F6] opacity-60' : 'bg-white border-[#F3F4F6] hover:border-[#ECEBF2] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    {/* Time */}
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="text-sm font-bold text-[#111318]">{booking.startTime.slice(0,5)}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{booking.endTime.slice(0,5)}</p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-[#E5E7EB] flex-shrink-0" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#111318] truncate">{booking.customerName}</p>
                      <p className="text-xs text-[#9CA3AF] truncate">{booking.serviceName}</p>
                    </div>

                    {/* Status */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Demnächst */}
      {!loadingData && upcomingBookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                <CalendarDays size={15} className="text-amber-500" />
              </div>
              <h2 className="font-semibold text-[#111318] text-sm">Demnächst</h2>
            </div>
            <Link href="/admin/bookings" className="text-xs text-[#6355E4] font-medium flex items-center gap-1 hover:underline">
              Alle <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-[#F3F4F6]">
            {upcomingBookings.slice(0, 5).map((booking) => {
              const s = STATUS_MAP[booking.status] ?? STATUS_MAP.Pending;
              return (
                <div key={booking.id} className="py-3 flex items-center gap-4">
                  <div className="text-center w-16 flex-shrink-0">
                    <p className="text-xs font-bold text-[#374151]">
                      {new Date(booking.bookingDate + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short' })}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      {new Date(booking.bookingDate + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    </p>
                    <p className="text-xs font-semibold text-[#6355E4] mt-0.5">{booking.startTime.slice(0,5)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#111318] truncate">{booking.customerName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-[#9CA3AF]">{booking.serviceName}</span>
                      {booking.customerPhone && (
                        <a href={`tel:${booking.customerPhone}`} className="text-xs text-[#6B7280] flex items-center gap-1 hover:text-[#6355E4]">
                          <Phone size={10} />{booking.customerPhone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                    <span className="text-xs font-semibold text-[#374151]">
                      {formatPrice(booking.price, booking.currency ?? currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { href: '/admin/calendar',       label: 'Mein Kalender',  icon: Calendar,       bg: '#EEEBFC', color: '#6355E4' },
          { href: '/admin/bookings',        label: 'Buchungsliste',  icon: Hash,           bg: '#EFF6FF', color: '#3B82F6' },
          { href: '/admin/blocked-slots',   label: 'Abwesenheiten', icon: Ban,            bg: '#FEF3C7', color: '#D97706' },
          { href: '/admin/employee-notes',  label: 'Notiz an Chef', icon: MessageSquare,  bg: '#F0FDF4', color: '#059669' },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4 hover:border-[#D4D0F7] hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: link.bg }}>
              <link.icon size={18} style={{ color: link.color }} />
            </div>
            <p className="text-sm font-semibold text-[#111318]">{link.label}</p>
            <ChevronRight size={14} className="text-[#9CA3AF] mt-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </motion.div>

    </div>
  );
}
