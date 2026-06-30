// app/admin/settings/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Input, Textarea } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import {
  Settings, Save, Building2, Phone, Globe, Palette, Lock,
  ImageIcon, Upload, Clock, AlertTriangle, Sliders,
} from 'lucide-react';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import api, { apiOrigin } from '@/lib/api/client';

// ── Design Tokens (matching AdminLinksPage) ───────────────────────────────────
// bg:         #F7F7F8
// surface:    #FFFFFF
// border:     #E5E7EB   subtle: #F3F4F6
// text-1:     #111318   text-2: #374151   text-3: #6B7280   text-4: #9CA3AF
// accent:     #4F46E5   accent-bg: #EEF2FF   accent-bdr: #A5B4FC / #C7D2FE
// success:    #065F46 on #D1FAE5 / border #A7F3D0
// error:      #991B1B on #FEE2E2 / border #FECACA
// warning:    #92400E on #FFFBEB / border #FDE68A
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = [
  { value: 1, label: 'Montag' },
  { value: 2, label: 'Dienstag' },
  { value: 3, label: 'Mittwoch' },
  { value: 4, label: 'Donnerstag' },
  { value: 5, label: 'Freitag' },
  { value: 6, label: 'Samstag' },
  { value: 0, label: 'Sonntag' },
];

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
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

/** Section card with a left-accent icon header */
function SectionCard({
  icon,
  title,
  subtitle,
  accentClass = 'bg-[#4F46E5]',
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F3F4F6]">
        <div className={`w-8 h-8 ${accentClass} rounded-xl flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="font-semibold text-[#111318] text-sm leading-tight">{title}</p>
          <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
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
  'w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/25 focus:border-[#A5B4FC] transition-all';

const selectCls =
  'w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/25 focus:border-[#A5B4FC] transition-all appearance-none';

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
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
    primaryColor: '#E8C7C3',
    secondaryColor: '#D8B0AC',
    accentColor: '#017172',
    welcomeMessage: '',
    cancellationPolicy: '',
    bookingIntervalMinutes: 30,
    maxAdvanceBookingDays: 60,
    timeZone: 'Europe/Berlin',
    defaultCurrency: 'EUR',
    cancellationHoursNotice: 0,
    cancellationFeePercent: 0,
    logoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const [businessHours, setBusinessHours] = useState<BusinessHoursItem[]>(
    DAYS.map((d) => ({
      dayOfWeek: d.value,
      isOpen: d.value >= 1 && d.value <= 5,
      openTime: '09:00',
      closeTime: '18:00',
      breakStartTime: '',
      breakEndTime: '',
    }))
  );
  const [bhSaving, setBhSaving] = useState(false);
  const [bhSaved, setBhSaved] = useState(false);
  const [bhError, setBhError] = useState('');

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    loadBusinessHours();
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
    } catch {}
    finally { setLoading(false); }
  }

  async function loadBusinessHours() {
    try {
      const res = await api.get('/tenant/business-hours');
      const data: any[] = res.data?.data ?? [];
      if (data.length > 0) {
        setBusinessHours(
          DAYS.map((d) => {
            const existing = data.find((bh: any) => bh.dayOfWeek === d.value);
            return existing
              ? { dayOfWeek: d.value, isOpen: existing.isOpen, openTime: existing.openTime ?? '09:00', closeTime: existing.closeTime ?? '18:00', breakStartTime: existing.breakStartTime ?? '', breakEndTime: existing.breakEndTime ?? '' }
              : { dayOfWeek: d.value, isOpen: d.value >= 1 && d.value <= 5, openTime: '09:00', closeTime: '18:00', breakStartTime: '', breakEndTime: '' };
          })
        );
      }
    } catch {}
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
      setBhError(err.response?.data?.message || 'Fehler beim Speichern');
    } finally { setBhSaving(false); }
  }

  const updateBh = (dayOfWeek: number, field: keyof BusinessHoursItem, value: string | boolean) =>
    setBusinessHours((prev) => prev.map((bh) => bh.dayOfWeek === dayOfWeek ? { ...bh, [field]: value } : bh));

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put('/tenant/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Speichern');
    } finally { setSaving(false); }
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
      setLogoError(err.response?.data?.message || 'Fehler beim Hochladen');
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (newPassword !== confirmPassword) { setPwError('Die neuen Passwörter stimmen nicht überein.'); return; }
    if (newPassword.length < 6) { setPwError('Das neue Passwort muss mindestens 6 Zeichen lang sein.'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPwSuccess('Passwort erfolgreich geändert.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Fehler beim Ändern des Passworts.');
    } finally { setPwSaving(false); }
  }

  const set = (key: keyof TenantSettings, value: string | number) =>
    setSettings((s) => ({ ...s, [key]: value }));

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#4F46E5] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-5 sm:p-6">
      <div className="max-w-3xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-9 h-9 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-sm">
            <Settings size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#111318] tracking-tight leading-tight">Einstellungen</h1>
            <p className="text-sm text-[#6B7280]">Branding & Firmendaten verwalten</p>
          </div>
        </div>

        <form onSubmit={saveSettings} className="space-y-4">

          {/* ── Logo ── */}
          <SectionCard
            icon={<ImageIcon size={15} className="text-white" />}
            title="Logo"
            subtitle="Firmenlogo hochladen"
          >
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#F7F7F8] flex items-center justify-center overflow-hidden flex-shrink-0">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl?.startsWith('http') ? settings.logoUrl : `${apiOrigin}${settings.logoUrl}`}
                    alt="Logo"
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
                  disabled={logoUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] hover:border-[#C7D2FE] hover:text-[#4F46E5] disabled:opacity-50 transition-all"
                >
                  {logoUploading
                    ? <><span className="w-3.5 h-3.5 border-2 border-[#E5E7EB] border-t-[#4F46E5] rounded-full animate-spin" />Wird hochgeladen…</>
                    : <><Upload size={13} />Logo hochladen</>}
                </button>
                <p className="text-[10px] text-[#9CA3AF]">JPG, PNG, WebP · max. 5 MB</p>
                {logoError && <p className="text-[11px] text-[#991B1B]">{logoError}</p>}
              </div>
            </div>
          </SectionCard>

          {/* ── Firmeninformationen ── */}
          <SectionCard
            icon={<Building2 size={15} className="text-white" />}
            title="Firmeninformationen"
            subtitle="Name, Slogan und Texte"
            accentClass="bg-[#1F2937]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Firmenname">
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  placeholder="Mein Salon"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Slogan">
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => set('tagline', e.target.value)}
                  placeholder="Ihr Wohlfühlsalon"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Willkommensnachricht">
              <textarea
                value={settings.welcomeMessage}
                onChange={(e) => set('welcomeMessage', e.target.value)}
                placeholder="Herzlich willkommen! Wir freuen uns auf Ihren Besuch."
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <Field label="Stornierungsrichtlinie">
              <textarea
                value={settings.cancellationPolicy}
                onChange={(e) => set('cancellationPolicy', e.target.value)}
                placeholder="Kostenlose Stornierung bis 24h vor dem Termin."
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </SectionCard>

          {/* ── Kontakt ── */}
          <SectionCard
            icon={<Phone size={15} className="text-white" />}
            title="Kontakt"
            subtitle="Telefon, E-Mail und Adresse"
            accentClass="bg-[#1F2937]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telefon">
                <input type="tel" value={settings.phone} onChange={(e) => set('phone', e.target.value)}
                  placeholder="+49 171 123 45 67" className={inputCls} />
              </Field>
              <Field label="E-Mail">
                <input type="email" value={settings.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="info@ihrsalon.de" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Website">
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                  <input type="url" value={settings.website} onChange={(e) => set('website', e.target.value)}
                    placeholder="https://ihrsalon.de" className={`${inputCls} pl-8`} />
                </div>
              </Field>
              <Field label="Adresse">
                <input type="text" value={settings.address} onChange={(e) => set('address', e.target.value)}
                  placeholder="Musterstraße 1, 10115 Berlin" className={inputCls} />
              </Field>
            </div>
          </SectionCard>

          {/* ── Farben ── */}
          <SectionCard
            icon={<Palette size={15} className="text-white" />}
            title="Farben"
            subtitle="Primär-, Sekundär- und Akzentfarbe der Buchungsseite"
          >
            <div className="grid grid-cols-3 gap-4">
              {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key) => {
                const labels: Record<string, string> = {
                  primaryColor: 'Primärfarbe',
                  secondaryColor: 'Sekundärfarbe',
                  accentColor: 'Akzentfarbe',
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
            icon={<Sliders size={15} className="text-white" />}
            title="Buchungseinstellungen"
            subtitle="Intervalle, Vorlauf und Stornierung"
            accentClass="bg-[#1F2937]"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Intervall (Min)" description="Zeitabstand zwischen Terminen, z.B. 30 = 9:00, 9:30…">
                <input type="number" value={settings.bookingIntervalMinutes}
                  onChange={(e) => set('bookingIntervalMinutes', parseInt(e.target.value) || 30)}
                  min={15} max={120} className={inputCls} />
              </Field>
              <Field label="Max. Vorlauf (Tage)" description="Wie weit in die Zukunft können Kunden buchen?">
                <input type="number" value={settings.maxAdvanceBookingDays}
                  onChange={(e) => set('maxAdvanceBookingDays', parseInt(e.target.value) || 60)}
                  min={7} max={365} className={inputCls} />
              </Field>
              <Field label="Währung">
                <input type="text" value={settings.defaultCurrency}
                  onChange={(e) => set('defaultCurrency', e.target.value)}
                  placeholder="EUR" maxLength={3} className={inputCls} />
              </Field>
              <Field label="Zeitzone">
                <select value={settings.timeZone} onChange={(e) => set('timeZone', e.target.value)} className={selectCls}>
                  <option value="Europe/Berlin">Europe/Berlin (MEZ/MESZ)</option>
                  <option value="Europe/Zurich">Europe/Zurich (MEZ/MESZ)</option>
                  <option value="Europe/Vienna">Europe/Vienna (MEZ/MESZ)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Paris">Europe/Paris (MEZ/MESZ)</option>
                  <option value="Europe/Amsterdam">Europe/Amsterdam (MEZ/MESZ)</option>
                  <option value="Europe/Brussels">Europe/Brussels (MEZ/MESZ)</option>
                  <option value="Europe/Rome">Europe/Rome (MEZ/MESZ)</option>
                  <option value="Europe/Madrid">Europe/Madrid (MEZ/MESZ)</option>
                  <option value="Europe/Warsaw">Europe/Warsaw (MEZ/MESZ)</option>
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
                <p className="text-xs font-semibold text-[#92400E]">Stornierungsrichtlinie</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kostenlos stornierbar bis (Stunden)" description="0 = immer kostenlos stornierbar">
                  <input type="number" value={settings.cancellationHoursNotice}
                    onChange={(e) => set('cancellationHoursNotice', parseInt(e.target.value) || 0)}
                    min={0} max={720} className={inputCls} />
                </Field>
                <Field label="Stornogebühr (%)" description="Prozent des Servicepreises bei verspäteter Stornierung">
                  <input type="number" value={settings.cancellationFeePercent}
                    onChange={(e) => set('cancellationFeePercent', parseFloat(e.target.value) || 0)}
                    min={0} max={100} className={inputCls} />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* ── Öffnungszeiten ── */}
          <SectionCard
            icon={<Clock size={15} className="text-white" />}
            title="Öffnungszeiten"
            subtitle="Wochentage und Geschäftszeiten"
            accentClass="bg-[#1F2937]"
          >
            <div className="space-y-2">
              {DAYS.map((day) => {
                const bh = businessHours.find((b) => b.dayOfWeek === day.value)!;
                return (
                  <div
                    key={day.value}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                      bh.isOpen
                        ? 'border-[#E5E7EB] bg-white'
                        : 'border-[#F3F4F6] bg-[#F7F7F8]'
                    }`}
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
                      <div className="w-4 h-4 rounded border-2 border-[#D1D5DB] peer-checked:bg-[#4F46E5] peer-checked:border-[#4F46E5] transition-all flex items-center justify-center">
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
                          className="text-sm border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#111318] bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/25 focus:border-[#A5B4FC] transition-all"
                        />
                        <span className="text-[#9CA3AF] text-xs">–</span>
                        <input
                          type="time"
                          value={bh.closeTime}
                          onChange={(e) => updateBh(day.value, 'closeTime', e.target.value)}
                          className="text-sm border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#111318] bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/25 focus:border-[#A5B4FC] transition-all"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-[#9CA3AF]">Geschlossen</span>
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
                Öffnungszeiten gespeichert ✓
              </div>
            )}

            <button
              type="button"
              onClick={saveBusinessHours}
              disabled={bhSaving}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#111318] text-white hover:bg-[#374151] disabled:opacity-50 transition-all"
            >
              {bhSaving
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Wird gespeichert…</>
                : <><Save size={13} />Öffnungszeiten speichern</>}
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
              Einstellungen gespeichert ✓
            </div>
          )}

          {/* ── Save button ── */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#4F46E5] text-white text-sm font-semibold hover:bg-[#4338CA] disabled:opacity-50 transition-all shadow-sm"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Wird gespeichert…</>
              : <><Save size={15} />Einstellungen speichern</>}
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
                <strong>Passwort ändern erforderlich.</strong>{' '}
                Du hast ein vom Admin generiertes Passwort. Bitte lege jetzt ein eigenes Passwort fest.
              </span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <SectionCard
              icon={<Lock size={15} className="text-white" />}
              title="Passwort ändern"
              subtitle="Sicherheit und Zugangsdaten"
              accentClass="bg-[#111318]"
            >
              <Field label="Aktuelles Passwort">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Neues Passwort">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </Field>
                <Field label="Neues Passwort wiederholen">
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
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] hover:border-[#C7D2FE] hover:text-[#4F46E5] disabled:opacity-40 transition-all"
              >
                {pwSaving
                  ? <><span className="w-3.5 h-3.5 border-2 border-[#E5E7EB] border-t-[#4F46E5] rounded-full animate-spin" />Wird gespeichert…</>
                  : <><Lock size={13} />Passwort ändern</>}
              </button>
            </SectionCard>
          </form>
        </div>
      </div>
    </div>
  );
}
