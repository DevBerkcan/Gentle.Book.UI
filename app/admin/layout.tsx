// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { SupportWidget } from '@/components/admin/SupportWidget';
import { ImpersonateBanner } from '@/components/admin/ImpersonateBanner';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { MessageCircle, Mail, LockKeyhole, Check, ArrowRight, CheckCircle, Rocket } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api/client';
import { adminApi } from '@/lib/api/admin';

const MODAL_PLANS = [
  { key: 'Starter',      name: 'Starter',      price: 29,  employees: '2 Mitarbeiter' },
  { key: 'Professional', name: 'Professional',  price: 59,  employees: '10 Mitarbeiter', highlight: true },
  { key: 'Agency',       name: 'Business',      price: 99,  employees: 'Unlimited' },
];

function TrialExpiredModal() {
  const [requesting,    setRequesting]    = useState(false);
  const [requestedPlan, setRequestedPlan] = useState<string | null>(null);
  const [confirmed,     setConfirmed]     = useState(false);

  const handleRequest = async (planKey: string) => {
    if (requesting || requestedPlan) return;
    setRequesting(true);
    try {
      await adminApi.requestPlan(planKey);
      setRequestedPlan(planKey);
      setConfirmed(true);
    } catch {
      alert('Anfrage konnte nicht gesendet werden.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>

      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: '#C09995' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15" style={{ background: '#017172' }} />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1e1e2e 100%)' }}>

          {/* Header */}
          <div className="px-8 pt-8 pb-5 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <LockKeyhole size={30} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Testzeitraum abgelaufen</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Wählen Sie einen Plan und wir aktivieren ihn innerhalb von 24 Stunden.
            </p>
          </div>

          {confirmed ? (
            /* Confirmation state */
            <div className="mx-6 mb-6 rounded-2xl p-6 border border-green-500/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
              <CheckCircle size={36} className="text-green-400 mx-auto mb-3" />
              <p className="text-white font-semibold text-lg mb-1">Anfrage gesendet!</p>
              <p className="text-white/50 text-sm">
                Ihr <strong className="text-white/80">{requestedPlan}</strong>-Plan wird innerhalb von 24h aktiviert. Sie erhalten eine Bestätigungs-E-Mail.
              </p>
              <Link href="/admin/subscription" className="mt-4 inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors">
                Abonnement-Details <ArrowRight size={11} />
              </Link>
            </div>
          ) : (
            <>
              {/* Plan Cards */}
              <div className="px-6 mb-5 grid grid-cols-3 gap-2">
                {MODAL_PLANS.map(plan => (
                  <button
                    key={plan.key}
                    onClick={() => handleRequest(plan.key)}
                    disabled={requesting || !!requestedPlan}
                    className={`relative rounded-2xl p-4 text-left border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.highlight
                        ? 'border-[#017172] bg-[#017172]/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="bg-[#017172] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Empfohlen</span>
                      </div>
                    )}
                    <p className="text-[11px] text-white/50 font-medium mb-1">{plan.name}</p>
                    <p className="text-2xl font-black text-white leading-none">€{plan.price}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">/Monat</p>
                    <p className="text-[10px] text-white/50 mt-2">{plan.employees}</p>
                    <div className="mt-3 text-center">
                      {requesting ? (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="text-[11px] font-semibold text-white/70">Anfragen →</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Backup CTAs */}
              <div className="px-6 pb-4 flex gap-2.5">
                <a
                  href="https://wa.me/491754701892?text=Hallo%2C%20ich%20m%C3%B6chte%20GentleBook%20upgraden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a
                  href="mailto:support@gentlegroup.de?subject=Upgrade GentleBook"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white border border-white/15 transition-all hover:bg-white/10"
                >
                  <Mail size={14} /> E-Mail
                </a>
              </div>
            </>
          )}

          <div className="px-6 pb-6 text-center">
            <Link href="/admin/subscription" className="text-xs text-white/30 hover:text-white/60 transition-colors inline-flex items-center gap-1">
              Alle Plan-Details ansehen <ArrowRight size={11} />
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
          <ImpersonateBanner />
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
