// app/admin/settings/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Input, Textarea } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import {
  Settings, Save, Building2, Phone, Globe, Palette, Lock,
  ImageIcon, Upload, Clock, AlertTriangle, Sliders, Trash2, CreditCard,
  MapPin, Plus, Pencil, Star, X, ShieldCheck, UserPlus,
} from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { WebsiteBrandSection } from '@/components/admin/settings/WebsiteBrandSection';
import { CustomDomainSection } from '@/components/admin/settings/CustomDomainSection';
import { TeamReportsSection } from '@/components/admin/settings/TeamReportsSection';
import { LoyaltySection } from '@/components/admin/settings/LoyaltySection';
import { SettingsNav, type SettingsNavItem } from '@/components/admin/settings/SettingsNav';
import { useTranslation, fillTemplate } from '@/lib/i18n/LanguageContext';
import type { Translations } from '@/lib/i18n/translations';
import api from '@/lib/api/client';
import { resolveLogoUrl } from '@/lib/utils/logo';
import {
  createBusinessLocation,
  deleteBusinessLocation,
  getBusinessLocations,
  updateBusinessLocation,
  getLocationAdmins,
  inviteLocationAdmin,
  removeLocationAdmin,
  type BusinessLocation,
  type BusinessLocationInput,
  type LocationAdmin,
} from '@/lib/api/locations';

// ── Design Tokens (matching AdminLinksPage) ───────────────────────────────────
// bg:         #F7F7F8
// surface:    #FFFFFF
// border:     #E5E7EB   subtle: #F3F4F6
// text-1:     #111318   text-2: #374151   text-3: #6B7280   text-4: #9CA3AF
// accent:     #6355E4   accent-bg: #EEEBFC   accent-bdr: #A5B4FC / #C7D2FE
// success:    #065F46 on #D1FAE5 / border #A7F3D0
// error:      #991B1B on #FEE2E2 / border #FECACA
// warning:    #92400E on #FFFBEB / border #FDE68A
// ─────────────────────────────────────────────────────────────────────────────

function getSettingsNavItems(t: Translations): SettingsNavItem[] {
  const s = t.admin.settingsPage;
  return [
    { id: 'section-logo', label: s.logo },
    { id: 'section-company', label: s.companyInfo },
    { id: 'section-contact', label: s.contact },
    { id: 'section-website', label: s.companyWebsite },
    { id: 'section-domain', label: s.customDomain },
    { id: 'section-reports', label: s.teamReports },
    { id: 'section-loyalty', label: t.admin.customersPage.loyaltyPoints },
    { id: 'section-locations', label: s.locations },
    { id: 'section-billing', label: s.billingAddress },
    { id: 'section-legal', label: s.legalLinks },
    { id: 'section-colors', label: s.colors },
    { id: 'section-booking', label: s.bookingSettings },
    { id: 'section-hours', label: s.openingHours },
    { id: 'section-password', label: s.changePassword },
  ];
}

// Day-of-week display order, independent of language (labels come from getDays(t) below).
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function getDays(t: Translations) {
  const s = t.admin.settingsPage;
  return [
    { value: 1, label: s.dayMonday },
    { value: 2, label: s.dayTuesday },
    { value: 3, label: s.dayWednesday },
    { value: 4, label: s.dayThursday },
    { value: 5, label: s.dayFriday },
    { value: 6, label: s.daySaturday },
    { value: 0, label: s.daySunday },
  ];
}

interface BusinessHoursItem {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime: string;
  breakEndTime: string;
}

interface TenantSettings {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  welcomeMessage: string;
  cancellationPolicy: string;
  bookingIntervalMinutes: number;
  maxAdvanceBookingDays: number;
  timeZone: string;
  defaultCurrency: string;
  cancellationHoursNotice: number;
  cancellationFeePercent: number;
  logoUrl?: string;
  legalCompanyName?: string;
  billingStreet?: string;
  billingZipCode?: string;
  billingCity?: string;
  billingCountry?: string;
  vatId?: string;
  hasCompleteBillingProfile?: boolean;
  privacyUrl?: string;
  imprintUrl?: string;
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

/** Section card with a left-accent icon header */
function SectionCard({
  id,
  icon,
  title,
  subtitle,
  accentClass = 'bg-[#6355E4]',
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white rounded-2xl overflow-hidden scroll-mt-6">
      <div className="flex items-center gap-3 px-1 pb-4">
        <div className={`w-8 h-8 ${accentClass} rounded-xl flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">{title}</p>
          <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="px-1 space-y-4">{children}</div>
    </div>
  );
}

/** Consistent text input (replaces NextUI Input where full custom styling is needed) */
function Field({
  label, description, children,
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#6B7280]">{label}</label>
      {children}
      {description && <p className="text-[10px] text-[#9CA3AF] leading-snug">{description}</p>}
    </div>
  );
}

const inputCls =
  'w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all';

const selectCls =
  'w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all appearance-none';

const emptyLocation = (currency = 'EUR', timeZone = 'Europe/Berlin'): BusinessLocationInput => ({
  name: '',
  street: '',
  postalCode: '',
  city: '',
  countryCode: 'DE',
  currency,
  timeZone,
  isDefault: false,
  isActive: true,
});

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { isEmployee } = useAuth();
  const { t, lang } = useTranslation();
  const cetLabel = lang === 'de' ? 'MEZ/MESZ' : 'CET/CEST';
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);
  const searchParams = useSearchParams();
  const mustChangePassword = searchParams.get('mustChangePassword') === '1';
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<TenantSettings>({
    companyName: '',
    tagline: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    primaryColor: '#ECEBF2',
    secondaryColor: '#D8D7E2',
    accentColor: '#6355E4',
    welcomeMessage: '',
    cancellationPolicy: '',
    bookingIntervalMinutes: 30,
    maxAdvanceBookingDays: 60,
    timeZone: 'Europe/Berlin',
    defaultCurrency: 'EUR',
    cancellationHoursNotice: 0,
    cancellationFeePercent: 0,
    logoUrl: '',
    legalCompanyName: '',
    billingStreet: '',
    billingZipCode: '',
    billingCity: '',
    billingCountry: '',
    vatId: '',
    privacyUrl: '',
    imprintUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [locationForm, setLocationForm] = useState<BusinessLocationInput>(() => emptyLocation());
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationAdmins, setLocationAdmins] = useState<LocationAdmin[]>([]);
  const [invitingLocationId, setInvitingLocationId] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const [businessHours, setBusinessHours] = useState<BusinessHoursItem[]>(
    DAY_ORDER.map((value) => ({
      dayOfWeek: value,
      isOpen: false,
      openTime: '',
      closeTime: '',
      breakStartTime: '',
      breakEndTime: '',
    }))
  );
  const [bhSaving, setBhSaving] = useState(false);
  const [bhSaved, setBhSaved] = useState(false);
  const [bhError, setBhError] = useState('');

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mirrors Configuration/AgencyFeatureGate.cs (TenantController.InviteLocationAdmin already
  // enforces this server-side) — the invite button here was shown to every plan regardless,
  // so a non-Agency tenant could click it and only find out it's blocked after the fact.
  const [plan, setPlan] = useState<string | null>(null);
  const isAgencyPlan = plan === 'Agency' || plan === 'Trial';

  useEffect(() => {
    loadSettings();
    loadBusinessHours();
    loadLocations();
    loadLocationAdmins();
    api.get('/tenant/subscription').then((res) => setPlan(res.data?.data?.plan ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mustChangePassword && passwordSectionRef.current) {
      setTimeout(() => {
        passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, [mustChangePassword]);

  async function loadSettings() {
    try {
      const res = await api.get('/tenant/settings');
      const data = res.data?.data ?? res.data;
      if (data) setSettings(data);
    } catch (err: any) {
      // A 401 here is an expired session, not "no settings" — without this, the page below
      // just renders the full form with every field blank, with no indication why.
      if (err?.response?.status === 401) setSessionExpired(true);
    }
    finally { setLoading(false); }
  }

  async function loadBusinessHours() {
    try {
      const res = await api.get('/tenant/business-hours');
      const data: any[] = res.data?.data ?? [];
      if (data.length > 0) {
        setBusinessHours(
          DAY_ORDER.map((value) => {
            const existing = data.find((bh: any) => bh.dayOfWeek === value);
            return existing
              ? { dayOfWeek: value, isOpen: existing.isOpen, openTime: existing.openTime ?? '', closeTime: existing.closeTime ?? '', breakStartTime: existing.breakStartTime ?? '', breakEndTime: existing.breakEndTime ?? '' }
              : { dayOfWeek: value, isOpen: false, openTime: '', closeTime: '', breakStartTime: '', breakEndTime: '' };
          })
        );
      }
    } catch {}
  }

  async function loadLocations() {
    try {
      setLocations(await getBusinessLocations());
    } catch {
      setLocationError(t.admin.settingsPage.locationsLoadError);
    }
  }

  async function loadLocationAdmins() {
    try {
      setLocationAdmins(await getLocationAdmins());
    } catch {
      // Not Agency plan (402) or not a tenant admin — silently show no location admins,
      // the invite button itself is Agency-gated separately.
      setLocationAdmins([]);
    }
  }

  async function handleInviteLocationAdmin(location: BusinessLocation) {
    const email = window.prompt(fillTemplate(t.admin.settingsPage.promptAdminEmailTemplate, { name: location.name }));
    if (!email || !email.trim()) return;
    const firstName = window.prompt(t.admin.calendarPage.firstName + ':');
    if (!firstName || !firstName.trim()) return;
    const lastName = window.prompt(t.admin.settingsPage.promptLastNameOptional) ?? '';

    setInvitingLocationId(location.id);
    setLocationError('');
    try {
      await inviteLocationAdmin(location.id, email.trim(), firstName.trim(), lastName.trim() || undefined);
      await loadLocationAdmins();
    } catch (err: any) {
      setLocationError(err.response?.data?.message || t.admin.settingsPage.inviteFailed);
    } finally {
      setInvitingLocationId(null);
    }
  }

  async function handleRemoveLocationAdmin(admin: LocationAdmin) {
    if (!window.confirm(fillTemplate(t.admin.settingsPage.confirmRemoveAccessTemplate, { name: `${admin.firstName} ${admin.lastName}` }))) return;
    setLocationError('');
    try {
      await removeLocationAdmin(admin.id);
      await loadLocationAdmins();
    } catch (err: any) {
      setLocationError(err.response?.data?.message || t.admin.settingsPage.removeFailed);
    }
  }

  function openNewLocation() {
    setEditingLocationId(null);
    setLocationForm(emptyLocation(settings.defaultCurrency, settings.timeZone));
    setLocationError('');
    setShowLocationForm(true);
  }

  function openEditLocation(location: BusinessLocation) {
    setEditingLocationId(location.id);
    setLocationForm({
      name: location.name,
      street: location.street ?? '',
      postalCode: location.postalCode ?? '',
      city: location.city,
      countryCode: location.countryCode,
      currency: location.currency,
      timeZone: location.timeZone,
      isDefault: location.isDefault,
      isActive: location.isActive,
    });
    setLocationError('');
    setShowLocationForm(true);
  }

  async function saveLocation() {
    setLocationSaving(true);
    setLocationError('');
    try {
      const payload = {
        ...locationForm,
        countryCode: locationForm.countryCode.trim().toUpperCase(),
        currency: locationForm.currency.trim().toUpperCase(),
      };
      if (editingLocationId) {
        await updateBusinessLocation(editingLocationId, payload);
      } else {
        await createBusinessLocation(payload);
      }
      setShowLocationForm(false);
      setEditingLocationId(null);
      await Promise.all([loadLocations(), loadSettings()]);
    } catch (err: any) {
      setLocationError(err.response?.data?.message || t.admin.settingsPage.locationSaveError);
    } finally {
      setLocationSaving(false);
    }
  }

  async function removeLocation(location: BusinessLocation) {
    if (!window.confirm(fillTemplate(t.admin.settingsPage.confirmDeleteLocationTemplate, { name: location.name }))) return;
    setLocationError('');
    try {
      await deleteBusinessLocation(location.id);
      await loadLocations();
    } catch (err: any) {
      setLocationError(err.response?.data?.message || t.admin.settingsPage.locationDeleteError);
    }
  }

  async function saveBusinessHours() {
    setBhSaving(true); setBhError(''); setBhSaved(false);
    try {
      await api.put('/tenant/business-hours', businessHours.map((bh) => ({
        dayOfWeek: bh.dayOfWeek,
        isOpen: bh.isOpen,
        openTime: bh.openTime || '09:00',
        closeTime: bh.closeTime || '18:00',
        breakStartTime: bh.breakStartTime || null,
        breakEndTime: bh.breakEndTime || null,
      })));
      setBhSaved(true);
      setTimeout(() => setBhSaved(false), 3000);
    } catch (err: any) {
      setBhError(err.response?.data?.message || t.admin.customersPage.saveError);
    } finally { setBhSaving(false); }
  }

  const updateBh = (dayOfWeek: number, field: keyof BusinessHoursItem, value: string | boolean) =>
    setBusinessHours((prev) => prev.map((bh) => bh.dayOfWeek === dayOfWeek ? { ...bh, [field]: value } : bh));

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const normalizedSettings = {
        ...settings,
        defaultCurrency: settings.defaultCurrency.trim().toUpperCase(),
      };
      await api.put('/tenant/settings', normalizedSettings);
      setSettings(normalizedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t.admin.customersPage.saveError);
    } finally { setSaving(false); }
  }

  async function handleLogoDelete() {
    if (!settings.logoUrl) return;
    setLogoDeleting(true); setLogoError('');
    try {
      await api.delete('/tenant/logo');
      setSettings((s) => ({ ...s, logoUrl: '' }));
    } catch (err: any) {
      setLogoError(err.response?.data?.message || t.admin.customersPage.deleteError);
    } finally {
      setLogoDeleting(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true); setLogoError('');
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post('/tenant/logo', formData);
      setSettings((s) => ({ ...s, logoUrl: res.data.logoUrl }));
    } catch (err: any) {
      setLogoError(err.response?.data?.message || t.admin.settingsPage.uploadError);
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (newPassword !== confirmPassword) { setPwError(t.admin.settingsPage.passwordMismatch); return; }
    if (newPassword.length < 6) { setPwError(t.admin.settingsPage.passwordTooShort); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPwSuccess(t.admin.settingsPage.passwordChangeSuccess);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err: any) {
      setPwError(err.response?.data?.message || t.admin.settingsPage.passwordChangeError);
    } finally { setPwSaving(false); }
  }

  const set = (key: keyof TenantSettings, value: string | number) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const days = getDays(t);
  const navItems = getSettingsNavItems(t);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-medium text-[#111318]">{t.admin.bookingsPage.sessionExpiredTitle}</p>
          <p className="text-sm text-[#6B7280] mt-1">{t.admin.bookingsPage.sessionExpiredDesc}</p>
          <button
            className="mt-4 px-4 py-2 rounded-lg bg-[#6355E4] text-white text-sm font-medium"
            onClick={() => { window.location.href = '/admin/login'; }}
          >
            {t.admin.bookingsPage.sessionExpiredLoginBtn}
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-5 sm:p-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-9 h-9 bg-[#6355E4] rounded-xl flex items-center justify-center shadow-sm">
            <Settings size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#111318] tracking-tight leading-tight">{t.admin.settings}</h1>
            <p className="text-sm text-[#6B7280]">{t.admin.settingsPage.subtitle}</p>
          </div>
        </div>

        <div className="lg:flex lg:items-start lg:gap-10">
          <SettingsNav items={navItems} />

          <div className="flex-1 min-w-0 max-w-3xl">

        <form onSubmit={saveSettings} className="space-y-8">

          {/* ── Logo ── */}
          <SectionCard
            id="section-logo"
            icon={<ImageIcon size={15} className="text-white" />}
            title={t.admin.settingsPage.logo}
            subtitle={t.admin.settingsPage.uploadLogoDesc}
          >
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#F7F7F8] flex items-center justify-center overflow-hidden flex-shrink-0">
                {settings.logoUrl ? (
                  <Image
                    src={resolveLogoUrl(settings.logoUrl)!}
                    alt={t.admin.settingsPage.logo}
                    width={80}
                    height={80}
                    unoptimized
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon size={26} className="text-[#D1D5DB]" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  disabled={logoUploading || logoDeleting}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] hover:border-[#C7D2FE] hover:text-[#6355E4] disabled:opacity-50 transition-all"
                >
                  {logoUploading
                    ? <><span className="w-3.5 h-3.5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />{t.admin.settingsPage.uploading}</>
                    : <><Upload size={13} />{t.admin.settingsPage.uploadLogo}</>}
                </button>
                {settings.logoUrl && (
                  <button
                    type="button"
                    disabled={logoDeleting || logoUploading}
                    onClick={handleLogoDelete}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] hover:border-[#FCA5A5] hover:bg-[#FEE2E2] disabled:opacity-50 transition-all"
                  >
                    {logoDeleting
                      ? <><span className="w-3.5 h-3.5 border-2 border-[#FECACA] border-t-[#991B1B] rounded-full animate-spin" />{t.admin.settingsPage.deleting}</>
                      : <><Trash2 size={13} />{t.admin.settingsPage.deleteLogo}</>}
                  </button>
                )}
                <p className="text-[10px] text-[#9CA3AF]">{t.admin.settingsPage.logoFileHint}</p>
                {logoError && <p className="text-[11px] text-[#991B1B]">{logoError}</p>}
              </div>
            </div>
          </SectionCard>

          {/* ── Firmeninformationen ── */}
          <SectionCard
            id="section-company"
            icon={<Building2 size={15} className="text-white" />}
            title={t.admin.settingsPage.companyInfo}
            subtitle={t.admin.settingsPage.companyInfoDesc}
            accentClass="bg-[#1F2937]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.admin.settingsPage.companyName}>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  placeholder={t.admin.settingsPage.companyNamePlaceholder}
                  required
                  className={inputCls}
                />
              </Field>
              <Field label={t.admin.settingsPage.tagline}>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => set('tagline', e.target.value)}
                  placeholder={t.admin.settingsPage.taglinePlaceholder}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label={t.admin.settingsPage.welcomeMessage}>
              <textarea
                value={settings.welcomeMessage}
                onChange={(e) => set('welcomeMessage', e.target.value)}
                placeholder={t.admin.settingsPage.welcomeMessagePlaceholder}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <Field label={t.admin.settingsPage.cancellationPolicy}>
              <textarea
                value={settings.cancellationPolicy}
                onChange={(e) => set('cancellationPolicy', e.target.value)}
                placeholder={t.admin.settingsPage.cancellationPolicyPlaceholder}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </SectionCard>

          {/* ── Kontakt ── */}
          <SectionCard
            id="section-contact"
            icon={<Phone size={15} className="text-white" />}
            title={t.admin.settingsPage.contact}
            subtitle={t.admin.settingsPage.contactDesc}
            accentClass="bg-[#1F2937]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.admin.phone}>
                <input type="tel" value={settings.phone} onChange={(e) => set('phone', e.target.value)}
                  placeholder={t.admin.settingsPage.phonePlaceholder} className={inputCls} />
              </Field>
              <Field label={t.admin.email}>
                <input type="email" value={settings.email} onChange={(e) => set('email', e.target.value)}
                  placeholder={t.admin.settingsPage.emailPlaceholder} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.admin.settingsPage.website}>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                  <input type="url" value={settings.website} onChange={(e) => set('website', e.target.value)}
                    placeholder={t.admin.settingsPage.websitePlaceholder} className={`${inputCls} pl-8`} />
                </div>
              </Field>
              <Field label={t.admin.settingsPage.address}>
                <input type="text" value={settings.address} onChange={(e) => set('address', e.target.value)}
                  placeholder={t.admin.settingsPage.addressPlaceholder} className={inputCls} />
              </Field>
            </div>
          </SectionCard>

          {/* ── Unternehmenswebsite (AI Brand Import) ── */}
          <div id="section-website" className="scroll-mt-6">
            <WebsiteBrandSection />
          </div>

          {/* ── Eigene Domain (Agency) ── */}
          <div id="section-domain" className="scroll-mt-6">
            <CustomDomainSection />
          </div>

          {/* ── Team-Reports (Agency) ── */}
          <div id="section-reports" className="scroll-mt-6">
            <TeamReportsSection />
          </div>

          {/* ── Treuepunkte (Agency) ── */}
          <div id="section-loyalty" className="scroll-mt-6">
            <LoyaltySection />
          </div>

          {/* ── Standorte ── */}
          <SectionCard
            id="section-locations"
            icon={<MapPin size={15} className="text-white" />}
            title={t.admin.settingsPage.locations}
            subtitle={t.admin.settingsPage.locationsDesc}
            accentClass="bg-[#17A398]"
          >
            <div className="flex items-start justify-between gap-4 rounded-xl border border-[#C7D2FE] bg-[#F8F7FF] p-3.5">
              <p className="text-xs leading-relaxed text-[#565A72]">
                {t.admin.settingsPage.locationsInfoText}
              </p>
              <button
                type="button"
                onClick={openNewLocation}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE]"
              >
                <Plus size={13} /> {t.admin.settingsPage.addLocation}
              </button>
            </div>

            {locationError && (
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]">
                {locationError}
              </div>
            )}

            <div className="space-y-2.5">
              {locations.map((location) => (
                <div key={location.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#111318]">{location.name}</p>
                        {location.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EEEBFC] px-2 py-0.5 text-[10px] font-semibold text-[#6355E4]">
                            <Star size={10} fill="currentColor" /> {t.admin.settingsPage.defaultBadge}
                          </span>
                        )}
                        {!location.isActive && (
                          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                            {t.admin.inactive}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        {[location.street, `${location.postalCode ?? ''} ${location.city}`.trim(), location.countryCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold">
                        <span className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[#374151]">{location.currency}</span>
                        <span className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[#374151]">{location.timeZone}</span>
                        <span className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[#374151]">
                          {location.serviceCount} Service{location.serviceCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      {/* Standort-Admins (Agency-exklusiv) */}
                      {locationAdmins.filter((a) => a.locationId === location.id).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {locationAdmins.filter((a) => a.locationId === location.id).map((admin) => (
                            <span key={admin.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-2 py-1 text-[10px] font-medium text-[#4338CA]">
                              <ShieldCheck size={10} /> {admin.firstName} {admin.lastName}
                              <button type="button" onClick={() => handleRemoveLocationAdmin(admin)} className="text-[#4338CA]/60 hover:text-red-600" aria-label={t.admin.settingsPage.removeAccessAriaLabel}>
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {isAgencyPlan && (
                        <button
                          type="button"
                          onClick={() => handleInviteLocationAdmin(location)}
                          disabled={invitingLocationId === location.id}
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#6355E4] hover:text-[#4338CA] disabled:opacity-50"
                        >
                          <UserPlus size={11} /> {invitingLocationId === location.id ? t.admin.settingsPage.inviting : t.admin.settingsPage.inviteLocationAdmin}
                        </button>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => openEditLocation(location)}
                        className="rounded-lg p-2 text-[#6B7280] hover:bg-[#EEEBFC] hover:text-[#6355E4]"
                        aria-label={fillTemplate(t.admin.settingsPage.editAriaLabelTemplate, { name: location.name })}>
                        <Pencil size={14} />
                      </button>
                      {!location.isDefault && (
                        <button type="button" onClick={() => removeLocation(location)}
                          className="rounded-lg p-2 text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                          aria-label={fillTemplate(t.admin.settingsPage.deleteAriaLabelTemplate, { name: location.name })}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {locations.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#D1D5DB] p-5 text-center text-xs text-[#9CA3AF]">
                  {t.admin.settingsPage.noLocationsYet}
                </div>
              )}
            </div>

            {showLocationForm && (
              <div className="space-y-4 rounded-2xl border-2 border-[#C7D2FE] bg-[#F8F7FF] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#111318]">
                    {editingLocationId ? t.admin.settingsPage.editLocation : t.admin.settingsPage.newLocation}
                  </p>
                  <button type="button" onClick={() => setShowLocationForm(false)}
                    className="text-xs font-medium text-[#6B7280] hover:text-[#111318]">
                    {t.close}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t.admin.name}>
                    <input className={inputCls} value={locationForm.name}
                      onChange={(e) => setLocationForm((form) => ({ ...form, name: e.target.value }))}
                      placeholder={t.admin.settingsPage.locationNamePlaceholder} />
                  </Field>
                  <Field label={t.admin.settingsPage.streetAddress}>
                    <input className={inputCls} value={locationForm.street ?? ''}
                      onChange={(e) => setLocationForm((form) => ({ ...form, street: e.target.value }))}
                      placeholder={t.admin.settingsPage.streetPlaceholder} />
                  </Field>
                  <Field label={t.admin.settingsPage.postalCode}>
                    <input className={inputCls} value={locationForm.postalCode ?? ''}
                      onChange={(e) => setLocationForm((form) => ({ ...form, postalCode: e.target.value }))}
                      placeholder={t.admin.settingsPage.postalCodePlaceholder} />
                  </Field>
                  <Field label={t.admin.settingsPage.city}>
                    <input className={inputCls} value={locationForm.city}
                      onChange={(e) => setLocationForm((form) => ({ ...form, city: e.target.value }))}
                      placeholder={t.admin.settingsPage.cityPlaceholder} />
                  </Field>
                  <Field label={t.admin.settingsPage.country}>
                    <select className={selectCls} value={locationForm.countryCode}
                      onChange={(e) => setLocationForm((form) => ({ ...form, countryCode: e.target.value }))}>
                      <option value="DE">{t.admin.settingsPage.countryGermany}</option>
                      <option value="CH">{t.admin.settingsPage.countrySwitzerland}</option>
                      <option value="AT">{t.admin.settingsPage.countryAustria}</option>
                      <option value="FR">{t.admin.settingsPage.countryFrance}</option>
                      <option value="NL">{t.admin.settingsPage.countryNetherlands}</option>
                      <option value="GB">{t.admin.settingsPage.countryUK}</option>
                      <option value="US">{t.admin.settingsPage.countryUSA}</option>
                    </select>
                  </Field>
                  <Field label={t.admin.settingsPage.currency}>
                    <select className={selectCls} value={locationForm.currency}
                      onChange={(e) => setLocationForm((form) => ({ ...form, currency: e.target.value }))}>
                      <option value="EUR">EUR (€)</option>
                      <option value="CHF">CHF</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </Field>
                  <Field label={t.admin.settingsPage.timezone}>
                    <select className={selectCls} value={locationForm.timeZone}
                      onChange={(e) => setLocationForm((form) => ({ ...form, timeZone: e.target.value }))}>
                      <option value="Europe/Berlin">Europe/Berlin</option>
                      <option value="Europe/Zurich">Europe/Zurich</option>
                      <option value="Europe/Vienna">Europe/Vienna</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                    </select>
                  </Field>
                  <div className="flex items-end gap-4 pb-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-[#374151]">
                      <input type="checkbox" checked={locationForm.isDefault}
                        onChange={(e) => setLocationForm((form) => ({ ...form, isDefault: e.target.checked }))}
                        disabled={locations.find((location) => location.id === editingLocationId)?.isDefault} />
                      {t.admin.settingsPage.defaultLocationCheckbox}
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-[#374151]">
                      <input type="checkbox" checked={locationForm.isActive}
                        onChange={(e) => setLocationForm((form) => ({ ...form, isActive: e.target.checked }))} />
                      {t.admin.active}
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowLocationForm(false)}
                    className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151]">
                    {t.cancel}
                  </button>
                  <button type="button" onClick={saveLocation} disabled={locationSaving}
                    className="rounded-xl bg-[#6355E4] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {locationSaving ? t.admin.settingsPage.savingEllipsis : t.admin.settingsPage.saveLocationBtn}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Rechnungsadresse ── */}
          <SectionCard
            id="section-billing"
            icon={<CreditCard size={15} className="text-white" />}
            title={t.admin.settingsPage.billingAddress}
            subtitle={t.admin.settingsPage.billingAddressDesc}
            accentClass="bg-[#1F2937]"
          >
            {settings.hasCompleteBillingProfile === false && (
              <div className="flex items-center gap-2 px-3.5 py-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-sm text-[#92400E]">
                <AlertTriangle size={13} className="shrink-0" />
                {t.admin.settingsPage.billingIncompleteWarning}
              </div>
            )}
            <Field label={t.admin.settingsPage.legalCompanyName}>
              <input type="text" value={settings.legalCompanyName} onChange={(e) => set('legalCompanyName', e.target.value)}
                placeholder={t.admin.settingsPage.legalNamePlaceholder} className={inputCls} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.admin.settingsPage.streetAddress}>
                <input type="text" value={settings.billingStreet} onChange={(e) => set('billingStreet', e.target.value)}
                  placeholder={t.admin.settingsPage.billingStreetPlaceholder} className={inputCls} />
              </Field>
              <Field label={t.admin.settingsPage.postalCode}>
                <input type="text" value={settings.billingZipCode} onChange={(e) => set('billingZipCode', e.target.value)}
                  placeholder={t.admin.settingsPage.billingZipPlaceholder} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.admin.settingsPage.city}>
                <input type="text" value={settings.billingCity} onChange={(e) => set('billingCity', e.target.value)}
                  placeholder={t.admin.settingsPage.billingCityPlaceholder} className={inputCls} />
              </Field>
              <Field label={t.admin.settingsPage.countryIsoCode}>
                <input type="text" value={settings.billingCountry} onChange={(e) => set('billingCountry', e.target.value.toUpperCase())}
                  placeholder={t.admin.settingsPage.countryIsoPlaceholder} maxLength={2} className={inputCls} />
              </Field>
            </div>
            <Field label={t.admin.settingsPage.vatIdLabel}>
              <input type="text" value={settings.vatId} onChange={(e) => set('vatId', e.target.value)}
                placeholder={t.admin.settingsPage.vatIdPlaceholder} className={inputCls} />
            </Field>
          </SectionCard>

          {/* ── Rechtliche Links (studiospezifisch) ── */}
          <SectionCard
            id="section-legal"
            icon={<ShieldCheck size={15} className="text-white" />}
            title={t.admin.settingsPage.legalLinks}
            subtitle={t.admin.settingsPage.legalLinksDesc}
            accentClass="bg-[#1F2937]"
          >
            <Field label={t.admin.settingsPage.privacyUrlLabel}>
              <input type="url" value={settings.privacyUrl} onChange={(e) => set('privacyUrl', e.target.value)}
                placeholder={t.admin.settingsPage.privacyUrlPlaceholder} pattern="https://.*" className={inputCls} />
            </Field>
            <Field label={t.admin.settingsPage.imprintUrlLabel}>
              <input type="url" value={settings.imprintUrl} onChange={(e) => set('imprintUrl', e.target.value)}
                placeholder={t.admin.settingsPage.imprintUrlPlaceholder} pattern="https://.*" className={inputCls} />
            </Field>
          </SectionCard>

          {/* ── Farben ── */}
          <SectionCard
            id="section-colors"
            icon={<Palette size={15} className="text-white" />}
            title={t.admin.settingsPage.colors}
            subtitle={t.admin.settingsPage.colorsDesc}
          >
            <div className="grid grid-cols-3 gap-4">
              {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key) => {
                const labels: Record<string, string> = {
                  primaryColor: t.admin.settingsPage.primaryColor,
                  secondaryColor: t.admin.settingsPage.secondaryColor,
                  accentColor: t.admin.settingsPage.accentColor,
                };
                return (
                  <Field key={key} label={labels[key]}>
                    <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-xl px-2.5 py-2 bg-white hover:border-[#C7D2FE] transition-all">
                      <input
                        type="color"
                        value={settings[key]}
                        onChange={(e) => set(key, e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0 flex-shrink-0"
                        style={{ padding: 0 }}
                      />
                      <input
                        type="text"
                        value={settings[key]}
                        onChange={(e) => set(key, e.target.value)}
                        className="flex-1 text-xs text-[#374151] bg-transparent outline-none font-mono min-w-0"
                        maxLength={7}
                      />
                    </div>
                  </Field>
                );
              })}
            </div>
          </SectionCard>

          {/* ── Buchungseinstellungen ── */}
          <SectionCard
            id="section-booking"
            icon={<Sliders size={15} className="text-white" />}
            title={t.admin.settingsPage.bookingSettings}
            subtitle={t.admin.settingsPage.bookingSettingsDesc}
            accentClass="bg-[#1F2937]"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label={t.admin.settingsPage.intervalLabel} description={t.admin.settingsPage.intervalDesc}>
                <input type="number" value={settings.bookingIntervalMinutes}
                  onChange={(e) => set('bookingIntervalMinutes', parseInt(e.target.value) || 30)}
                  min={15} max={120} className={inputCls} />
              </Field>
              <Field label={t.admin.settingsPage.maxAdvanceLabel} description={t.admin.settingsPage.maxAdvanceDesc}>
                <input type="number" value={settings.maxAdvanceBookingDays}
                  onChange={(e) => set('maxAdvanceBookingDays', parseInt(e.target.value) || 60)}
                  min={7} max={365} className={inputCls} />
              </Field>
              <Field label={t.admin.settingsPage.currency}>
                <select
                  value={settings.defaultCurrency.toUpperCase()}
                  onChange={(e) => set('defaultCurrency', e.target.value)}
                  className={selectCls}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="CHF">CHF</option>
                  <option value="USD">USD ($)</option>
                </select>
              </Field>
              <Field label={t.admin.settingsPage.timezone}>
                <select value={settings.timeZone} onChange={(e) => set('timeZone', e.target.value)} className={selectCls}>
                  <option value="Europe/Berlin">Europe/Berlin ({cetLabel})</option>
                  <option value="Europe/Zurich">Europe/Zurich ({cetLabel})</option>
                  <option value="Europe/Vienna">Europe/Vienna ({cetLabel})</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Paris">Europe/Paris ({cetLabel})</option>
                  <option value="Europe/Amsterdam">Europe/Amsterdam ({cetLabel})</option>
                  <option value="Europe/Brussels">Europe/Brussels ({cetLabel})</option>
                  <option value="Europe/Rome">Europe/Rome ({cetLabel})</option>
                  <option value="Europe/Madrid">Europe/Madrid ({cetLabel})</option>
                  <option value="Europe/Warsaw">Europe/Warsaw ({cetLabel})</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (ET)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Istanbul">Asia/Istanbul (TRT)</option>
                </select>
              </Field>
            </div>

            {/* Cancellation policy sub-section */}
            <div className="mt-1 p-4 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-[#D97706]" />
                <p className="text-xs font-semibold text-[#92400E]">{t.admin.settingsPage.cancellationPolicy}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.admin.settingsPage.freeCancelHoursLabel} description={t.admin.settingsPage.freeCancelHoursDesc}>
                  <input type="number" value={settings.cancellationHoursNotice}
                    onChange={(e) => set('cancellationHoursNotice', parseInt(e.target.value) || 0)}
                    min={0} max={720} className={inputCls} />
                </Field>
                <Field label={t.admin.settingsPage.cancellationFeeLabel} description={t.admin.settingsPage.cancellationFeeDesc}>
                  <input type="number" value={settings.cancellationFeePercent}
                    onChange={(e) => set('cancellationFeePercent', parseFloat(e.target.value) || 0)}
                    min={0} max={100} className={inputCls} />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* ── Öffnungszeiten ── */}
          <SectionCard
            id="section-hours"
            icon={<Clock size={15} className="text-white" />}
            title={t.admin.settingsPage.openingHours}
            subtitle={t.admin.settingsPage.openingHoursDesc}
            accentClass="bg-[#1F2937]"
          >
            <div className="divide-y divide-[#F3F4F6]">
              {days.map((day) => {
                const bh = businessHours.find((b) => b.dayOfWeek === day.value)!;
                return (
                  <div
                    key={day.value}
                    className="flex items-center gap-3 py-3"
                  >
                    {/* Checkbox */}
                    <label className="relative flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        id={`day-${day.value}`}
                        checked={bh.isOpen}
                        onChange={(e) => updateBh(day.value, 'isOpen', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 rounded border-2 border-[#D1D5DB] peer-checked:bg-[#6355E4] peer-checked:border-[#6355E4] transition-all flex items-center justify-center">
                        {bh.isOpen && (
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2 text-white fill-current">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </label>

                    {/* Day name */}
                    <span className={`text-sm font-medium w-24 flex-shrink-0 ${bh.isOpen ? 'text-[#111318]' : 'text-[#9CA3AF]'}`}>
                      {day.label}
                    </span>

                    {bh.isOpen ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="time"
                          value={bh.openTime}
                          onChange={(e) => updateBh(day.value, 'openTime', e.target.value)}
                          className="text-sm border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#111318] bg-white focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all"
                        />
                        <span className="text-[#9CA3AF] text-xs">–</span>
                        <input
                          type="time"
                          value={bh.closeTime}
                          onChange={(e) => updateBh(day.value, 'closeTime', e.target.value)}
                          className="text-sm border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#111318] bg-white focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-[#9CA3AF]">{t.admin.settingsPage.closed}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Business hours feedback */}
            {bhError && (
              <div className="flex items-center gap-2 px-3.5 py-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#991B1B]">
                <AlertTriangle size={13} className="shrink-0" />{bhError}
              </div>
            )}
            {bhSaved && (
              <div className="px-3.5 py-3 bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl text-sm text-[#065F46] font-medium">
                {t.admin.settingsPage.hoursSavedConfirmation}
              </div>
            )}

            <button
              type="button"
              onClick={saveBusinessHours}
              disabled={bhSaving}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#111318] text-white hover:bg-[#374151] disabled:opacity-50 transition-all"
            >
              {bhSaving
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.admin.settingsPage.savingEllipsis}</>
                : <><Save size={13} />{t.admin.settingsPage.saveHoursBtn}</>}
            </button>
          </SectionCard>

          {/* ── Feedback messages (main form) ── */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3.5 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#991B1B]">
              <AlertTriangle size={14} className="shrink-0" />{error}
            </div>
          )}
          {saved && (
            <div className="px-4 py-3.5 bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl text-sm text-[#065F46] font-medium">
              {t.admin.settingsPage.settingsSavedConfirmation}
            </div>
          )}

          {/* ── Save button ── */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#4338CA] disabled:opacity-50 transition-all shadow-sm"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.admin.settingsPage.savingEllipsis}</>
              : <><Save size={15} />{t.admin.settingsPage.saveSettingsBtn}</>}
          </button>
        </form>

        {/* ══════════════════════════════════════════════════════════════════
            PASSWORD CHANGE
        ══════════════════════════════════════════════════════════════════ */}
        <div ref={passwordSectionRef} className="mt-4 space-y-4">

          {/* Forced-change banner */}
          {mustChangePassword && (
            <div className="flex items-start gap-3 px-4 py-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-sm text-[#92400E]">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-[#D97706]" />
              <span>
                <strong>{t.admin.settingsPage.passwordChangeRequired}</strong>{' '}
                {t.admin.settingsPage.passwordChangeRequiredDesc}
              </span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <SectionCard
              id="section-password"
              icon={<Lock size={15} className="text-white" />}
              title={t.admin.settingsPage.changePassword}
              subtitle={t.admin.settingsPage.securityDesc}
              accentClass="bg-[#111318]"
            >
              <Field label={t.admin.settingsPage.currentPasswordLabel}>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t.admin.settingsPage.newPasswordLabel}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </Field>
                <Field label={t.admin.settingsPage.confirmPasswordLabel}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </Field>
              </div>

              {pwError && (
                <div className="flex items-center gap-2 px-3.5 py-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#991B1B]">
                  <AlertTriangle size={13} className="shrink-0" />{pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="px-3.5 py-3 bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl text-sm text-[#065F46] font-medium">
                  {pwSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] hover:border-[#C7D2FE] hover:text-[#6355E4] disabled:opacity-40 transition-all"
              >
                {pwSaving
                  ? <><span className="w-3.5 h-3.5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />{t.admin.settingsPage.savingEllipsis}</>
                  : <><Lock size={13} />{t.admin.settingsPage.changePassword}</>}
              </button>
            </SectionCard>
          </form>
        </div>

          </div>
        </div>
      </div>
    </div>
  );
}
