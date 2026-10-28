'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@nextui-org/button';
import { Input, Textarea } from '@nextui-org/input';
import {
  Building2, Clock, Scissors, Users, PartyPopper,
  ChevronRight, ChevronLeft, Check, ExternalLink,
} from 'lucide-react';
import api from '@/lib/api/client';
import { getAdminCategories, createAdminCategory, createAdminService, bulkAssignServicesToEmployee } from '@/lib/api/admin-services';
import { toast } from 'sonner';
import { useTranslation, fillTemplate } from '@/lib/i18n/LanguageContext';
import type { Translations } from '@/lib/i18n/translations';

const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

function getSteps(t: Translations) {
  const s = t.admin.onboardingPage;
  return [
    { icon: Building2, title: s.step1Title, desc: s.step1Desc },
    { icon: Clock,     title: s.step2Title, desc: s.step2Desc },
    { icon: Scissors,  title: s.step3Title, desc: s.step3Desc },
    { icon: Users,     title: s.step4Title, desc: s.step4Desc },
    { icon: PartyPopper, title: s.step5Title, desc: s.step5Desc },
  ];
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.18 } }),
};

export default function OnboardingPage() {
  const { t } = useTranslation();
  const s = t.admin.onboardingPage;
  const STEPS = getSteps(t);
  const DAYS = DAY_VALUES.map((v, i) => ({ value: v, label: t.admin.blockedSlotsPage.weekdayShort[i] }));
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  // Step 1: Company
  const [company, setCompany] = useState({ companyName: '', tagline: '', accentColor: '#6355E4' });

  // Step 2: Business Hours
  const [hours, setHours] = useState(
    DAYS.map(d => ({ dayOfWeek: d.value, isOpen: d.value >= 1 && d.value <= 5, openTime: '09:00', closeTime: '18:00' }))
  );

  // Step 3: Service
  const [service, setService] = useState({ name: '', durationMinutes: 60, price: 0, currency: 'EUR', categoryName: '' });

  // Step 4: Employee
  const [employee, setEmployee] = useState({ name: '', role: '', username: '', password: '' });
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);

  function navigate(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  async function saveStep() {
    setSaving(true);
    try {
      if (step === 0) {
        await api.put('/tenant/settings', {
          companyName: company.companyName,
          tagline: company.tagline,
          accentColor: company.accentColor,
        });
        navigate(1);
      } else if (step === 1) {
        await api.put('/tenant/business-hours', hours.map(h => ({
          dayOfWeek: h.dayOfWeek,
          isOpen: h.isOpen,
          openTime: h.openTime || '09:00',
          closeTime: h.closeTime || '18:00',
          breakStartTime: null,
          breakEndTime: null,
        })));
        navigate(2);
      } else if (step === 2) {
        const categoryName = (service.categoryName || 'Allgemein').trim();
        const categories = await getAdminCategories();
        let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        if (!category) {
          category = await createAdminCategory({ name: categoryName, displayOrder: 0 });
        }
        const newService = await createAdminService({
          name: service.name,
          durationMinutes: service.durationMinutes,
          bufferTimeMinutes: 0,
          price: service.price,
          currency: service.currency || 'EUR',
          displayOrder: 0,
          categoryId: category.id,
        });
        setCreatedServiceId(newService.id);
        navigate(3);
      } else if (step === 3) {
        const empResponse = await api.post('/employees', {
          name: employee.name,
          role: employee.role,
          username: employee.username,
          password: employee.password,
        });
        const newEmployeeId: string | undefined =
          empResponse.data?.id ?? empResponse.data?.data?.id;
        if (newEmployeeId && createdServiceId) {
          await bulkAssignServicesToEmployee(newEmployeeId, [createdServiceId]);
        }
        // Fetch slug for booking link
        try {
          const res = await api.get('/tenant/settings');
          const data = res.data?.data ?? res.data;
          setSlug(data?.slug ?? null);
        } catch { /* ignore */ }
        navigate(4);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || s.errSaveFallback);
    } finally {
      setSaving(false);
    }
  }

  const canProceed = () => {
    if (step === 0) return company.companyName.trim().length > 0;
    if (step === 2) return service.name.trim().length > 0 && service.durationMinutes > 0;
    if (step === 3) return employee.name.trim() && employee.role.trim() && employee.username.trim() && employee.password.trim().length >= 6;
    return true;
  };

  const updateHour = (dayOfWeek: number, field: string, value: string | boolean) =>
    setHours(prev => prev.map(h => h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F5FA] via-white to-[#F0F9F9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1E1E1E]">{s.headerTitle}</h1>
          <p className="text-gb-textSecondary text-sm mt-1">
            {fillTemplate(s.stepOfTemplate, { current: Math.min(step + 1, 5), desc: STEPS[step]?.desc ?? '' })}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((stp, i) => {
            const done = i < step;
            const active = i === step;
            const Icon = stp.icon;
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 transition-all ${
                  done ? 'bg-[#6355E4] text-white' : active ? 'bg-[#6355E4]/20 text-[#6355E4] ring-2 ring-[#6355E4]' : 'bg-gray-100 text-gray-400'
                }`}>
                  {done ? <Check size={14} /> : <Icon size={14} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${done ? 'bg-[#6355E4]' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
            {(() => { const Icon = STEPS[step].icon; return <Icon size={20} className="text-[#6355E4]" />; })()}
            <div>
              <h2 className="font-bold text-[#1E1E1E]">{STEPS[step].title}</h2>
            </div>
          </div>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-6"
            >
              {/* Step 0: Company profile */}
              {step === 0 && (
                <div className="space-y-4">
                  <Input
                    label={s.studioNameLabel}
                    placeholder={s.studioNamePlaceholder}
                    value={company.companyName}
                    onChange={e => setCompany(p => ({ ...p, companyName: e.target.value }))}
                    isRequired
                  />
                  <Input
                    label={s.taglineLabel}
                    placeholder={s.taglinePlaceholder}
                    value={company.tagline}
                    onChange={e => setCompany(p => ({ ...p, tagline: e.target.value }))}
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{s.accentColorLabel}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={company.accentColor}
                        onChange={e => setCompany(p => ({ ...p, accentColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <div className="flex-1 h-10 rounded-xl border border-gray-200 flex items-center px-3 gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ background: company.accentColor }} />
                        <span className="text-sm font-mono text-gray-600">{company.accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Business hours */}
              {step === 1 && (
                <div className="space-y-2">
                  {DAYS.map(day => {
                    const h = hours.find(x => x.dayOfWeek === day.value)!;
                    return (
                      <div key={day.value} className={`rounded-xl p-3 border transition-colors ${h.isOpen ? 'border-[#6355E4]/20 bg-[#6355E4]/5' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={h.isOpen}
                            onChange={e => updateHour(day.value, 'isOpen', e.target.checked)}
                            className="w-4 h-4 accent-[#6355E4]"
                          />
                          <span className={`font-semibold text-sm w-8 ${h.isOpen ? 'text-[#1E1E1E]' : 'text-gray-400'}`}>{day.label}</span>
                          {h.isOpen ? (
                            <div className="flex items-center gap-1">
                              <input type="time" value={h.openTime}
                                onChange={e => updateHour(day.value, 'openTime', e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white" />
                              <span className="text-gray-400 text-xs">–</span>
                              <input type="time" value={h.closeTime}
                                onChange={e => updateHour(day.value, 'closeTime', e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white" />
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">{s.closedLabel}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step 2: First service */}
              {step === 2 && (
                <div className="space-y-4">
                  <Input
                    label={s.serviceNameLabel}
                    placeholder={s.serviceNamePlaceholder}
                    value={service.name}
                    onChange={e => setService(p => ({ ...p, name: e.target.value }))}
                    isRequired
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={s.durationMinutesLabel}
                      type="number"
                      value={String(service.durationMinutes)}
                      onChange={e => setService(p => ({ ...p, durationMinutes: parseInt(e.target.value) || 60 }))}
                      min={15}
                    />
                    <Input
                      label={s.priceLabel}
                      type="number"
                      value={String(service.price)}
                      onChange={e => setService(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                      min={0}
                    />
                  </div>
                  <Input
                    label={s.categoryLabel}
                    placeholder={s.categoryPlaceholder}
                    value={service.categoryName}
                    onChange={e => setService(p => ({ ...p, categoryName: e.target.value }))}
                  />
                </div>
              )}

              {/* Step 3: First employee */}
              {step === 3 && (
                <div className="space-y-4">
                  <Input
                    label={s.employeeNameLabel}
                    placeholder={s.employeeNamePlaceholder}
                    value={employee.name}
                    onChange={e => setEmployee(p => ({ ...p, name: e.target.value }))}
                    isRequired
                  />
                  <Input
                    label={s.roleLabel}
                    placeholder={s.rolePlaceholder}
                    value={employee.role}
                    onChange={e => setEmployee(p => ({ ...p, role: e.target.value }))}
                    isRequired
                  />
                  <Input
                    label={s.usernameLabel}
                    placeholder={s.usernamePlaceholder}
                    value={employee.username}
                    onChange={e => setEmployee(p => ({ ...p, username: e.target.value }))}
                    isRequired
                  />
                  <Input
                    label={s.passwordLabel}
                    type="password"
                    placeholder={s.passwordPlaceholder}
                    value={employee.password}
                    onChange={e => setEmployee(p => ({ ...p, password: e.target.value }))}
                    isRequired
                  />
                </div>
              )}

              {/* Step 4: Done */}
              {step === 4 && (
                <div className="text-center space-y-5 py-4">
                  <div className="w-20 h-20 bg-[#6355E4]/10 rounded-full flex items-center justify-center mx-auto">
                    <PartyPopper size={36} className="text-[#6355E4]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1E1E1E] mb-2">{s.congratsTitle}</h3>
                    <p className="text-gb-textSecondary text-sm leading-relaxed">
                      {s.congratsDesc}
                    </p>
                  </div>
                  {slug && (
                    <a
                      href={`/booking/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6355E4]/10 text-[#6355E4] rounded-xl text-sm font-semibold hover:bg-[#6355E4]/20 transition-colors"
                    >
                      <ExternalLink size={15} />
                      {s.openBookingPageBtn}
                    </a>
                  )}
                  <Button
                    className="w-full bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold"
                    size="lg"
                    onPress={() => router.push('/admin/dashboard')}
                  >
                    {s.goToDashboardBtn}
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {step < 4 && (
            <div className="px-6 pb-6 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button
                  variant="flat"
                  className="text-gray-600"
                  startContent={<ChevronLeft size={16} />}
                  onPress={() => navigate(step - 1)}
                  isDisabled={saving}
                >
                  {t.back}
                </Button>
              ) : (
                <div />
              )}
              <Button
                className="bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold px-6"
                endContent={<ChevronRight size={16} />}
                onPress={saveStep}
                isLoading={saving}
                isDisabled={!canProceed()}
              >
                {step === 3 ? s.finishBtn : t.next}
              </Button>
            </div>
          )}
        </div>

        {/* Skip link */}
        {step < 4 && (
          <div className="text-center mt-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {s.skipSetupLink}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
