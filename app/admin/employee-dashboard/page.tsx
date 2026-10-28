'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Calendar, Clock, User, Phone, Mail, Scissors,
  CheckCircle, XCircle, AlertCircle, ChevronRight,
  Plus, Ban, MessageSquare, ArrowRight, Hash,
  CalendarDays, Sparkles, TrendingUp, Upload, Trash2, Save,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { adminApi, BookingListItem } from '@/lib/api/admin';
import { formatPrice } from '@/lib/utils/currency';
import { suggestEmployeeTagline } from '@/lib/api/employees';
import api, { apiOrigin } from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import type { Translations } from '@/lib/i18n/translations';

function getStatusMap(t: Translations): Record<string, { label: string; bg: string; text: string; dot: string }> {
  const b = t.admin.bookingStatus;
  return {
    Confirmed: { label: b.confirmed, bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    Pending:   { label: b.pending,   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
    Completed: { label: b.completed, bg: 'bg-[#EEEBFC]',  text: 'text-[#6355E4]',  dot: 'bg-[#6355E4]' },
    Cancelled: { label: b.cancelled, bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400' },
    NoShow:    { label: b.noShow,    bg: 'bg-gray-100',   text: 'text-gray-600',    dot: 'bg-gray-400' },
  };
}

function greeting(t: Translations) {
  const h = new Date().getHours();
  if (h < 12) return t.admin.dashboardPage.greetingMorning;
  if (h < 17) return t.admin.dashboardPage.greetingDay;
  return t.admin.dashboardPage.greetingEvening;
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
  const { t, lang } = useTranslation();
  const s = t.admin.employeeDashboardPage;
  const locale = lang === 'de' ? 'de-DE' : 'en-US';
  const STATUS_MAP = getStatusMap(t);
  const { user, isEmployee, isTenantAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [todayBookings,    setTodayBookings]    = useState<BookingListItem[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingListItem[]>([]);
  const [loadingData,      setLoadingData]      = useState(true);
  const [currency,         setCurrency]         = useState('EUR');

  // ── Mein Profil: Foto + 3-Wörter-Beschreibung (im Booking-Flow sichtbar) ──
  const [photoUrl,      setPhotoUrl]      = useState('');
  const [tagline,       setTagline]       = useState('');
  const [taglineDraft,  setTaglineDraft]  = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoDeleting,  setPhotoDeleting]  = useState(false);
  const [taglineSaving,  setTaglineSaving]  = useState(false);
  const [profileError,   setProfileError]   = useState('');
  const [profileSaved,   setProfileSaved]   = useState(false);
  const [suggesting,     setSuggesting]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (authLoading || !isEmployee || !user?.id) return;
    api.get(`/employees/${user.id}`).then((res) => {
      const data = res.data?.data ?? res.data;
      setPhotoUrl(data?.photoUrl ?? '');
      setTagline(data?.tagline ?? '');
      setTaglineDraft(data?.tagline ?? '');
    }).catch(() => {});
  }, [authLoading, isEmployee, user?.id]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setPhotoUploading(true); setProfileError('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await api.post(`/employees/${user.id}/photo`, formData);
      setPhotoUrl(res.data.photoUrl);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || s.errPhotoUpload);
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handlePhotoDelete() {
    if (!photoUrl || !user?.id) return;
    setPhotoDeleting(true); setProfileError('');
    try {
      await api.delete(`/employees/${user.id}/photo`);
      setPhotoUrl('');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || s.errPhotoDelete);
    } finally {
      setPhotoDeleting(false);
    }
  }

  async function handleTaglineSave() {
    if (!user?.id) return;
    setTaglineSaving(true); setProfileError(''); setProfileSaved(false);
    try {
      const res = await api.patch(`/employees/${user.id}/tagline`, { tagline: taglineDraft });
      setTagline(res.data.tagline ?? '');
      setTaglineDraft(res.data.tagline ?? '');
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || s.errTaglineSave);
    } finally {
      setTaglineSaving(false);
    }
  }

  async function handleSuggestTagline() {
    if (!user?.id) return;
    setSuggesting(true); setProfileError('');
    try {
      const res = await suggestEmployeeTagline(user.id);
      setTaglineDraft(res.suggestion);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || s.errAiSuggestion);
    } finally {
      setSuggesting(false);
    }
  }

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.name ?? s.staffFallbackName;

  const activeToday = todayBookings.filter(b => b.status !== 'Cancelled' && b.status !== 'NoShow');
  // Only Pending/Confirmed bookings whose start time hasn't passed yet count as "next" — the
  // previous `?? activeToday[0]` fallback picked the day's FIRST active booking once all of
  // them had already started, which could be (and, once fully past, always ends up being) an
  // already-Completed one from earlier that day.
  const nextBooking = todayBookings
    .filter(b => (b.status === 'Pending' || b.status === 'Confirmed') && new Date(`${b.bookingDate}T${b.startTime}`) > new Date())
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] ?? null;

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
          <p className="text-sm text-gb-textMuted mb-0.5">{greeting(t)},</p>
          <h1 className="text-2xl font-bold text-[#111318] flex items-center gap-2">
            {displayName}
            <Sparkles size={18} className="text-[#6355E4]" />
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {new Date().toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/blocked-slots"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F6F5FA] transition-colors"
          >
            <Ban size={15} className="text-gb-textMuted" /> {s.absenceHeaderLink}
          </Link>
          <Link
            href="/admin/employee-notes"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F6F5FA] transition-colors"
          >
            <MessageSquare size={15} className="text-gb-textMuted" /> {s.sendNoteLink}
          </Link>
          <Link
            href="/admin/calendar"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#5646D6] transition-colors"
          >
            <Calendar size={15} /> {t.admin.calendar}
          </Link>
        </div>
      </motion.div>

      {/* Mein Profil: Foto + 3-Wörter-Beschreibung — sichtbar für Kunden beim Buchen */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5"
      >
        <h2 className="font-semibold text-[#111318] text-sm mb-4">{s.myProfileTitle}</h2>
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#F7F7F8] flex items-center justify-center overflow-hidden flex-shrink-0">
              {photoUrl ? (
                <Image
                  src={photoUrl.startsWith('http') ? photoUrl : `${apiOrigin}${photoUrl}`}
                  alt={s.profilePhotoAlt}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User size={28} className="text-[#D1D5DB]" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                disabled={photoUploading || photoDeleting}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] hover:border-[#C7D2FE] hover:text-[#6355E4] disabled:opacity-50 transition-all"
              >
                {photoUploading
                  ? <><span className="w-3 h-3 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />{s.uploadingPhoto}</>
                  : <><Upload size={12} />{s.uploadPhotoBtn}</>}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  disabled={photoDeleting || photoUploading}
                  onClick={handlePhotoDelete}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] hover:border-[#FCA5A5] hover:bg-[#FEE2E2] disabled:opacity-50 transition-all"
                >
                  {photoDeleting
                    ? <><span className="w-3 h-3 border-2 border-[#FECACA] border-t-[#991B1B] rounded-full animate-spin" />{s.deletingPhoto}</>
                    : <><Trash2 size={12} />{t.admin.delete}</>}
                </button>
              )}
              <p className="text-[10px] text-gb-textMuted">{s.photoFormatHint}</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#374151]">{s.describeYourselfLabel}</label>
              <button
                type="button"
                onClick={handleSuggestTagline}
                disabled={suggesting}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6355E4] hover:text-[#5646D6] disabled:opacity-50"
                title={s.aiSuggestionTooltip}
              >
                {suggesting
                  ? <span className="w-2.5 h-2.5 border-2 border-[#C7D2FE] border-t-[#6355E4] rounded-full animate-spin" />
                  : <Sparkles size={11} />}
                {s.aiSuggestionBtn}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={taglineDraft}
                onChange={(e) => setTaglineDraft(e.target.value)}
                maxLength={60}
                placeholder={s.taglinePlaceholder}
                className="flex-1 border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#111318] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all"
              />
              <button
                type="button"
                onClick={handleTaglineSave}
                disabled={taglineSaving || taglineDraft === tagline}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#6355E4] text-white hover:bg-[#5646D6] disabled:opacity-40 transition-colors"
              >
                {taglineSaving
                  ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : profileSaved ? <CheckCircle size={14} /> : <Save size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-gb-textMuted">{s.taglineHint}</p>
          </div>
        </div>
        {profileError && <p className="text-xs text-red-600 mt-3">{profileError}</p>}
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: s.statTotalToday,     value: activeToday.length,   icon: CalendarDays, color: '#6355E4', bg: '#EEEBFC' },
          { label: s.statCompleted,      value: completedToday,       icon: CheckCircle,  color: '#059669', bg: '#D1FAE5' },
          { label: s.statCancelledToday, value: cancelledToday,       icon: XCircle,      color: '#DC2626', bg: '#FEE2E2' },
          { label: s.statUpcoming,       value: upcomingBookings.length, icon: TrendingUp, color: '#D97706', bg: '#FEF3C7' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gb-textMuted">{stat.label}</p>
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
            <h2 className="font-semibold text-[#111318] text-sm">{s.nextAppointmentTitle}</h2>
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
                  const st = STATUS_MAP[nextBooking.status] ?? STATUS_MAP.Pending;
                  return (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-sm text-[#6355E4] font-medium mb-3">{nextBooking.serviceName}</p>
              <div className="space-y-1.5 text-xs text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span>{nextBooking.startTime.slice(0,5)} – {nextBooking.endTime.slice(0,5)}{s.uhrSuffix}</span>
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
                <span className="text-[10px] text-gb-textMuted">#{nextBooking.bookingNumber}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-[#374151]">{s.noMoreAppointmentsToday}</p>
              <p className="text-xs text-gb-textMuted mt-1">{s.niceDayMessage}</p>
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
              <h2 className="font-semibold text-[#111318] text-sm">{s.appointmentsTodayTitle}</h2>
            </div>
            <Link href="/admin/bookings" className="text-xs text-[#6355E4] font-medium flex items-center gap-1 hover:underline">
              {s.allLink} <ArrowRight size={12} />
            </Link>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
            </div>
          ) : todayBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="text-[#E5E7EB] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#374151]">{s.noAppointmentsToday}</p>
              <p className="text-xs text-gb-textMuted mt-1">{s.enjoyFreeDay}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {todayBookings.map((booking) => {
                const st = STATUS_MAP[booking.status] ?? STATUS_MAP.Pending;
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
                      <p className="text-[10px] text-gb-textMuted">{booking.endTime.slice(0,5)}</p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-[#E5E7EB] flex-shrink-0" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#111318] truncate">{booking.customerName}</p>
                      <p className="text-xs text-gb-textMuted truncate">{booking.serviceName}</p>
                    </div>

                    {/* Status */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.text}`}>
                      {st.label}
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
              <h2 className="font-semibold text-[#111318] text-sm">{s.upcomingTitle}</h2>
            </div>
            <Link href="/admin/bookings" className="text-xs text-[#6355E4] font-medium flex items-center gap-1 hover:underline">
              {s.allLink} <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-[#F3F4F6]">
            {upcomingBookings.slice(0, 5).map((booking) => {
              const st = STATUS_MAP[booking.status] ?? STATUS_MAP.Pending;
              return (
                <div key={booking.id} className="py-3 flex items-center gap-4">
                  <div className="text-center w-16 flex-shrink-0">
                    <p className="text-xs font-bold text-[#374151]">
                      {new Date(booking.bookingDate + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short' })}
                    </p>
                    <p className="text-[10px] text-gb-textMuted">
                      {new Date(booking.bookingDate + 'T00:00:00').toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
                    </p>
                    <p className="text-xs font-semibold text-[#6355E4] mt-0.5">{booking.startTime.slice(0,5)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#111318] truncate">{booking.customerName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gb-textMuted">{booking.serviceName}</span>
                      {booking.customerPhone && (
                        <a href={`tel:${booking.customerPhone}`} className="text-xs text-[#6B7280] flex items-center gap-1 hover:text-[#6355E4]">
                          <Phone size={10} />{booking.customerPhone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                      {st.label}
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
          { href: '/admin/calendar',       label: s.quickLinkMyCalendar,  icon: Calendar,       bg: '#EEEBFC', color: '#6355E4' },
          { href: '/admin/bookings',        label: s.quickLinkBookingList,  icon: Hash,           bg: '#EFF6FF', color: '#3B82F6' },
          { href: '/admin/blocked-slots',   label: s.quickLinkAbsences, icon: Ban,            bg: '#FEF3C7', color: '#D97706' },
          { href: '/admin/employee-notes',  label: s.quickLinkNoteToBoss, icon: MessageSquare,  bg: '#F0FDF4', color: '#059669' },
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
            <ChevronRight size={14} className="text-gb-textMuted mt-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </motion.div>

    </div>
  );
}
