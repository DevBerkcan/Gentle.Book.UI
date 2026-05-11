// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { SupportWidget } from '@/components/admin/SupportWidget';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { MessageCircle, Mail, LockKeyhole, Check, Zap, Users, Star, Shield, RefreshCw, ArrowRight, Rocket } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api/client';

const UPGRADE_FEATURES = [
  { icon: Zap,       text: 'Unbegrenzte Buchungen' },
  { icon: Users,     text: 'Mehrere Mitarbeiter-Konten' },
  { icon: Mail,      text: 'Automatische E-Mail-Bestätigungen' },
  { icon: Star,      text: 'Professionelle Buchungsseite' },
  { icon: Shield,    text: 'Priority Support & Wartung' },
  { icon: RefreshCw, text: 'Alle zukünftigen Updates' },
];

function TrialExpiredModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>

      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: '#C09995' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15" style={{ background: '#017172' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1e1e2e 100%)' }}>

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <LockKeyhole size={30} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Testzeitraum abgelaufen</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Ihre kostenlose Testphase ist abgelaufen. Upgraden Sie jetzt und behalten Sie vollen Zugriff.
            </p>
          </div>

          {/* Price */}
          <div className="mx-6 mb-6 rounded-2xl p-5 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">€49</span>
                <span className="text-2xl font-bold text-white">,99</span>
                <span className="text-white/40 text-sm ml-1">/Monat</span>
              </div>
              <div className="bg-[#C09995] text-white text-xs font-bold px-3 py-1.5 rounded-xl text-center leading-tight">
                inkl. Support<br />& Wartung
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {UPGRADE_FEATURES.map(({ text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-white/65">
                  <Check size={11} className="text-[#C09995] flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="px-6 pb-4 flex flex-col sm:flex-row gap-2.5">
            <a
              href="https://wa.me/491754701892?text=Hallo%2C%20ich%20m%C3%B6chte%20GentleBook%20upgraden"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: '#25D366' }}
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href="mailto:support@gentlegroup.de?subject=Upgrade GentleBook Pro"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white border border-white/15 transition-all hover:bg-white/10"
            >
              <Mail size={16} /> E-Mail
            </a>
          </div>

          <div className="px-6 pb-6 text-center">
            <Link href="/admin/subscription" className="text-xs text-white/30 hover:text-white/60 transition-colors inline-flex items-center gap-1">
              Abonnement-Details ansehen <ArrowRight size={11} />
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
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, isTenantAdmin } = useAuth();
  const [trialExpired,    setTrialExpired]    = useState(false);
  const [trialDaysLeft,   setTrialDaysLeft]   = useState<number | null>(null);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (pathname === '/admin/reset-password') return;
    if (pathname === '/admin/forgot-password') return;
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, pathname, router]);

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
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#E8C7C3]" />
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
      <div className="flex min-h-screen bg-[#F2EFED]">
        <AdminNav />
        {/* Sidebar spacer: 230px on desktop, 56px (top bar) on mobile */}
        <div className="flex-1 min-w-0 md:ml-[230px] flex flex-col pt-14 md:pt-0 overflow-x-hidden">
          {showOnboardingBanner && (
            <div className="bg-[#017172] px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-white text-sm font-medium flex items-center gap-2">
                <Rocket size={16} />
                Richten Sie Ihr Studio in wenigen Schritten ein
              </p>
              <Link
                href="/admin/onboarding"
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Setup-Wizard starten <ArrowRight size={12} />
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
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
