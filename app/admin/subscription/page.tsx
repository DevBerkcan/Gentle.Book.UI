// app/admin/subscription/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Clock, CheckCircle, XCircle, AlertTriangle, Sparkles, Mail, Zap, Users } from 'lucide-react';
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

const PLAN_LABELS: Record<string, string> = {
  Trial:        'Testversion (14 Tage)',
  Starter:      'Starter',
  Professional: 'Professional',
  Agency:       'Agency',
};

export default function AdminSubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenant/subscription')
      .then((res) => setSub(res.data?.data ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#E8C7C3]" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-sm">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1E1E1E]">Kein Abonnement gefunden</h2>
          <p className="text-[#8A8A8A] mt-2 text-sm">Bitte kontaktieren Sie den Support.</p>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG['Trial'];
  const StatusIcon = statusCfg.icon;

  const trialEnd   = sub.trialEndsAt    ? new Date(sub.trialEndsAt)    : null;
  const trialStart = sub.trialStartedAt ? new Date(sub.trialStartedAt) : null;

  // Trial progress
  const TOTAL_DAYS = 14;
  const usedDays   = Math.max(0, TOTAL_DAYS - sub.trialDaysRemaining);
  const pct        = Math.min((usedDays / TOTAL_DAYS) * 100, 100);
  const isUrgent   = sub.trialDaysRemaining <= 3 && sub.isInTrial;
  const isWarning  = sub.trialDaysRemaining <= 7 && sub.trialDaysRemaining > 3 && sub.isInTrial;
  const barColor   = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#E8C7C3';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E1E1E]">Abonnement</h1>
            <p className="text-[#8A8A8A] text-sm">Ihr aktueller Plan</p>
          </div>
        </div>

        {/* Main status card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="bg-white rounded-3xl border border-[#E8C7C3]/20 shadow-sm overflow-hidden"
        >
          <div className="p-6">
            {/* Plan + badge */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs text-[#8A8A8A] mb-1 uppercase tracking-wide font-medium">Aktueller Plan</p>
                <h2 className="text-2xl font-bold text-[#1E1E1E]">{PLAN_LABELS[sub.plan] ?? sub.plan}</h2>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                <StatusIcon size={13} />
                {statusCfg.label}
              </span>
            </div>

            {/* Trial progress bar */}
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
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
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
            {sub.status === 'Expired' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={16} className="text-red-600" />
                  <span className="font-semibold text-red-800 text-sm">Testphase abgelaufen</span>
                </div>
                <p className="text-red-700 text-sm">Bitte kontaktieren Sie uns für ein Upgrade.</p>
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

        {/* Upgrade CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.1 }}
          className="bg-gradient-to-br from-[#1E1E1E] to-[#2C2C2C] rounded-3xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-xl flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold">Upgrade & Support</h3>
              <p className="text-white/50 text-xs">Fragen zu Ihrem Plan?</p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {[
              { icon: Zap,     text: 'Unbegrenzte Buchungen' },
              { icon: Users,   text: 'Mehrere Mitarbeiter-Konten' },
              { icon: Mail,    text: 'Automatische E-Mail-Bestätigungen' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-white/75">
                <Icon size={14} className="text-[#E8C7C3] flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>

          <a
            href="mailto:support@gentlegroup.de"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-[#1E1E1E] font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            <Mail size={14} /> support@gentlegroup.de
          </a>
        </motion.div>

      </div>
    </div>
  );
}
