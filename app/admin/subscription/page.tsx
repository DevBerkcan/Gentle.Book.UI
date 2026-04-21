// app/admin/subscription/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Clock, CheckCircle, XCircle, AlertTriangle,
  Check, MessageCircle, Mail, Zap, Users, Star, Shield, RefreshCw,
} from 'lucide-react';
import api from '@/lib/api/client';

interface Subscription {
  plan: string;
  status: string;
  trialStartedAt: string;
  trialEndsAt: string;
  trialDaysRemaining: number;
  isInTrial: boolean;
  isAccessAllowed: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  Trial:     { label: 'Testphase',        bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Clock },
  Active:    { label: 'Aktiv',            bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
  PastDue:   { label: 'Zahlung offen',    bg: 'bg-red-50',    text: 'text-red-700',    icon: AlertTriangle },
  Cancelled: { label: 'Gekündigt',        bg: 'bg-gray-100',  text: 'text-gray-600',   icon: XCircle },
  Expired:   { label: 'Abgelaufen',       bg: 'bg-red-50',    text: 'text-red-700',    icon: XCircle },
};

const FEATURES = [
  { icon: Zap,        text: 'Unbegrenzte Buchungen' },
  { icon: Users,      text: 'Mehrere Mitarbeiter-Konten' },
  { icon: Mail,       text: 'Automatische E-Mail-Bestätigungen' },
  { icon: Star,       text: 'Professionelle Buchungsseite' },
  { icon: Shield,     text: 'Priority Support & Wartung' },
  { icon: RefreshCw,  text: 'Alle zukünftigen Updates' },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } };

export default function AdminSubscriptionPage() {
  const [sub, setSub]       = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenant/subscription')
      .then((res) => setSub(res.data?.data ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EFED] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#017172] border-t-transparent animate-spin" />
      </div>
    );
  }

  const statusCfg   = STATUS_CONFIG[sub?.status ?? 'Trial'] ?? STATUS_CONFIG['Trial'];
  const StatusIcon  = statusCfg.icon;
  const trialEnd    = sub?.trialEndsAt    ? new Date(sub.trialEndsAt)    : null;
  const trialStart  = sub?.trialStartedAt ? new Date(sub.trialStartedAt) : null;
  const TOTAL_DAYS  = 14;
  const usedDays    = Math.max(0, TOTAL_DAYS - (sub?.trialDaysRemaining ?? 0));
  const pct         = Math.min((usedDays / TOTAL_DAYS) * 100, 100);
  const isUrgent    = (sub?.trialDaysRemaining ?? 0) <= 3 && (sub?.isInTrial ?? false);
  const isWarning   = (sub?.trialDaysRemaining ?? 0) <= 7 && (sub?.trialDaysRemaining ?? 0) > 3 && (sub?.isInTrial ?? false);
  const barColor    = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#017172';
  const isExpired   = sub?.status === 'Expired' || sub?.isAccessAllowed === false;

  return (
    <div className="min-h-screen bg-[#F2EFED] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-[#017172] to-[#01a0a2] rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1E1E]">Abonnement</h1>
              <p className="text-[#8A8A8A] text-sm">Ihr aktueller Plan & Upgrade-Optionen</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">

          {/* Status Card */}
          {sub && (
            <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-[#8A8A8A] mb-1 uppercase tracking-wide font-medium">Aktueller Status</p>
                    <h2 className="text-xl font-bold text-[#1E1E1E]">
                      {sub.isInTrial ? `${sub.trialDaysRemaining} Tage Testphase verbleibend` : statusCfg.label}
                    </h2>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                    <StatusIcon size={13} />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Trial progress */}
                {sub.isInTrial && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#1E1E1E] flex items-center gap-1.5">
                        {isUrgent && (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            Dringend
                          </span>
                        )}
                        Testphase
                      </span>
                      <span className="text-sm font-semibold" style={{ color: barColor }}>
                        {sub.trialDaysRemaining} Tag{sub.trialDaysRemaining !== 1 ? 'e' : ''} verbleibend
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: barColor }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs text-[#8A8A8A]">
                      <span>{usedDays} von {TOTAL_DAYS} Tagen genutzt</span>
                      {trialEnd && <span>Endet {trialEnd.toLocaleDateString('de-DE')}</span>}
                    </div>
                  </div>
                )}

                {/* Expired warning */}
                {isExpired && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={16} className="text-red-600" />
                      <span className="font-semibold text-red-800 text-sm">Zugang gesperrt</span>
                    </div>
                    <p className="text-red-700 text-sm">Ihr Testzeitraum ist abgelaufen. Upgraden Sie, um wieder Zugang zu erhalten.</p>
                  </div>
                )}

                {/* Date grid */}
                <div className="grid grid-cols-2 gap-3">
                  {trialStart && (
                    <div className="bg-[#F5EDEB] rounded-2xl p-3">
                      <p className="text-xs text-[#8A8A8A] mb-0.5">Teststart</p>
                      <p className="font-semibold text-[#1E1E1E] text-sm">{trialStart.toLocaleDateString('de-DE')}</p>
                    </div>
                  )}
                  {trialEnd && (
                    <div className="bg-[#F5EDEB] rounded-2xl p-3">
                      <p className="text-xs text-[#8A8A8A] mb-0.5">Testende</p>
                      <p className="font-semibold text-[#1E1E1E] text-sm">{trialEnd.toLocaleDateString('de-DE')}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Pricing Card */}
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl shadow-xl"
            style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1e1e2e 50%, #17171f 100%)' }}
          >
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: '#C09995', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ background: '#017172', transform: 'translate(-30%, 30%)' }} />

            <div className="relative p-7 sm:p-8">
              {/* Plan header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-[#C09995]/20 border border-[#C09995]/30 text-[#C09995] text-xs font-bold px-3 py-1 rounded-full mb-3">
                    <Star size={11} fill="currentColor" /> GentleBook Pro
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-6xl font-black text-white leading-none">€49</span>
                    <div>
                      <span className="text-2xl font-bold text-white">,99</span>
                      <span className="text-white/50 text-base font-medium block">/Monat</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#C09995] text-white text-xs font-bold px-3 py-1.5 rounded-xl text-center leading-tight">
                  inkl. Support<br />& Wartung
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-7">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#C09995]/20 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-[#C09995]" />
                    </div>
                    <span className="text-sm text-white/80">{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://wa.me/491754701892?text=Hallo%2C%20ich%20m%C3%B6chte%20GentleBook%20upgraden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
                <a
                  href="mailto:support@gentlegroup.de?subject=Upgrade GentleBook Pro"
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm text-white border border-white/15 transition-all hover:bg-white/10 active:scale-[0.97]"
                >
                  <Mail size={18} /> E-Mail senden
                </a>
              </div>

              <p className="text-white/30 text-xs text-center mt-4">
                Monatlich kündbar · Keine versteckten Kosten · Sofort aktiviert
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
