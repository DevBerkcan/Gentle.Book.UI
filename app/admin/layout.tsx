// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { SupportWidget } from '@/components/admin/SupportWidget';
import { ImpersonateBanner } from '@/components/admin/ImpersonateBanner';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { MessageCircle, Mail, LockKeyhole, Check, ArrowRight, Rocket } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api/client';
import { LanguageProvider, useTranslation } from '@/lib/i18n/LanguageContext';
import { supportConfig } from '@/lib/config';
import { isSafeAdminRedirectPath } from '@/lib/auth/redirect';

function TrialExpiredModal() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>

      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: '#6355E4' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15" style={{ background: '#17A398' }} />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1e1e2e 100%)' }}>

          {/* Header */}
          <div className="px-8 pt-8 pb-5 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <LockKeyhole size={30} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t.admin.trialExpired}</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              {t.admin.trialExpiredDesc}
            </p>
          </div>

          <div className="px-6 pb-5">
            <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/65">
              Es wurde kein kostenpflichtiges Abonnement abgeschlossen und es erfolgen keine automatischen Abbuchungen. Wählen Sie jetzt ein Monats- oder Jahresabo, um GentleBook und Ihre Buchungsseite wieder zu aktivieren. Ihre Daten bleiben 30 Tage gespeichert und können auf Anfrage exportiert werden.
            </p>
            <Link href="/admin/subscription" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6355E4] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5646D6]">
              Tarif auswählen <ArrowRight size={15} />
            </Link>
            <div className="mt-3 flex gap-2.5">
                <a
                  href={supportConfig.whatsappUrl("Hallo, ich möchte GentleBook upgraden")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a
                  href={supportConfig.mailto("Upgrade GentleBook")}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white border border-white/15 transition-all hover:bg-white/10"
                >
                  <Mail size={14} /> E-Mail
                </a>
            </div>
          </div>

          <div className="px-6 pb-6 text-center">
            <Link href="/admin/subscription" className="text-xs text-white/30 hover:text-white/60 transition-colors inline-flex items-center gap-1">
              Keine automatische kostenpflichtige Verlängerung
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const isUrgent = daysLeft <= 3;
  const bg      = isUrgent ? 'bg-red-500' : 'bg-amber-500';
  return (
    <div className={`${bg} px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap`}>
      <p className="text-white text-sm font-medium">
        {isUrgent ? '⚠️' : '⏰'}{' '}
        Noch <strong>{daysLeft} Tag{daysLeft !== 1 ? 'e' : ''}</strong> in Ihrer kostenlosen Testphase
      </p>
      <Link
        href="/admin/subscription"
        className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
      >
        Jetzt upgraden <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, isTenantAdmin, isEmployee } = useAuth();
  const [trialExpired,    setTrialExpired]    = useState(false);
  const [trialDaysLeft,   setTrialDaysLeft]   = useState<number | null>(null);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (pathname === '/admin/reset-password') return;
    if (pathname === '/admin/forgot-password') return;
    if (!loading && !isAuthenticated) {
      // Preserve where the user was trying to go so they land back there after login,
      // instead of always dropping them on the dashboard regardless of intent.
      const next = isSafeAdminRedirectPath(pathname) ? `?next=${encodeURIComponent(pathname)}` : '';
      router.push(`/admin/login${next}`);
    }
  }, [isAuthenticated, loading, pathname, router]);

  useEffect(() => {
    if (!loading && isEmployee && pathname === '/admin/dashboard') {
      router.replace('/admin/employee-dashboard');
    }
  }, [isEmployee, loading, pathname, router]);

  // Check subscription status for TenantAdmin
  useEffect(() => {
    if (!isAuthenticated || !isTenantAdmin) return;
    if (pathname === '/admin/login' || pathname === '/admin/subscription') return;

    api.get('/tenant/subscription')
      .then((res) => {
        const sub = res.data?.data ?? res.data;
        if (!sub) return;
        if (sub.isAccessAllowed === false) {
          setTrialExpired(true);
        } else if (sub.isInTrial && sub.trialDaysRemaining <= 7) {
          setTrialDaysLeft(sub.trialDaysRemaining);
          setShowTrialBanner(true);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, isTenantAdmin, pathname]);

  // Check onboarding completion for new tenants
  useEffect(() => {
    if (!isAuthenticated || !isTenantAdmin) return;
    if (pathname.startsWith('/admin/onboarding') || pathname === '/admin/login') return;

    api.get('/admin/onboarding')
      .then((res) => {
        const data = res.data;
        if (data && !data.isComplete && data.completedSteps < 2) {
          setShowOnboardingBanner(true);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, isTenantAdmin, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F6F5FA] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#6355E4]" />
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  if (pathname === '/admin/reset-password') {
    return <>{children}</>;
  }
  if (pathname === '/admin/forgot-password') {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-[#F6F5FA]">
        <AdminNav />
        {/* Sidebar spacer: collapsible width on desktop (var(--admin-sidebar-width)), 56px (top bar) on mobile */}
        <div className="flex-1 min-w-0 md:ml-[var(--admin-sidebar-width,230px)] transition-[margin] duration-200 flex flex-col pt-14 md:pt-0 overflow-x-hidden">
          <ImpersonateBanner />
          {showOnboardingBanner && (
            <div className="bg-[#6355E4] px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-white text-sm font-medium flex items-center gap-2">
                <Rocket size={16} />
                {t.admin.setupWizard}
              </p>
              <Link
                href="/admin/onboarding"
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                {t.admin.startSetup} <ArrowRight size={12} />
              </Link>
            </div>
          )}
          {showTrialBanner && trialDaysLeft !== null && !trialExpired && (
            <TrialBanner daysLeft={trialDaysLeft} />
          )}
          <main className="flex-1">
            {children}
          </main>
        </div>
        <SupportWidget />
        {trialExpired && <TrialExpiredModal />}
      </div>
    );
  }

  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </LanguageProvider>
    </AuthProvider>
  );
}
