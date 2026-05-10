'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle, XCircle, AlertTriangle,
  Check, MessageCircle, Mail, Zap, Users, Star, Shield,
  BarChart2, Globe, ArrowRight,
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

interface Usage {
  plan: string;
  planDisplayName: string;
  employees: { current: number; limit: number; isUnlimited: boolean; percentage: number };
  services: { current: number; limit: number; isUnlimited: boolean; percentage: number };
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  Trial:     { label: 'Testphase',      bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Clock },
  Active:    { label: 'Aktiv',          bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
  PastDue:   { label: 'Zahlung offen',  bg: 'bg-red-50',    text: 'text-red-700',    icon: AlertTriangle },
  Cancelled: { label: 'Gekündigt',      bg: 'bg-gray-100',  text: 'text-gray-600',   icon: XCircle },
  Expired:   { label: 'Abgelaufen',     bg: 'bg-red-50',    text: 'text-red-700',    icon: XCircle },
};

const PLANS = [
  {
    name: 'Starter',
    price: 29,
    key: 'Starter',
    color: 'border-gray-200',
    highlight: false,
    employees: 2,
    services: 15,
    features: [
      '2 Mitarbeiter-Konten',
      'Bis zu 15 Services',
      'Automatische Buchungsbestätigungen',
      'Professionelle Buchungsseite',
      'E-Mail-Erinnerungen',
      'Standard Support',
    ],
  },
  {
    name: 'Pro',
    price: 59,
    key: 'Professional',
    color: 'border-[#017172]',
    highlight: true,
    employees: 10,
    services: 50,
    features: [
      '10 Mitarbeiter-Konten',
      'Bis zu 50 Services',
      'Automatische Buchungsbestätigungen',
      'Professionelle Buchungsseite',
      'Analytics & Umsatzberichte',
      'E-Mail-Erinnerungen',
      'Priority Support',
      'Alle zukünftigen Updates',
    ],
  },
  {
    name: 'Business',
    price: 99,
    key: 'Agency',
    color: 'border-gray-200',
    highlight: false,
    employees: null,
    services: null,
    features: [
      'Unbegrenzte Mitarbeiter',
      'Unbegrenzte Services',
      'Alles aus Pro',
      'Dedizierter Account Manager',
      'API-Zugang',
      'White-Label Option',
      'SLA Garantie',
    ],
  },
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

function UsageBar({ label, current, limit, isUnlimited, percentage }: { label: string; current: number; limit: number; isUnlimited: boolean; percentage: number }) {
  const color = percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-[#017172]';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {current} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: isUnlimited ? '10%' : `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminSubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tenant/subscription').then(r => r.data?.data ?? r.data).catch(() => null),
      api.get('/tenant/usage').then(r => r.data).catch(() => null),
    ]).then(([subData, usageData]) => {
      setSub(subData);
      setUsage(usageData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[sub?.status ?? 'Trial'];
  const StatusIcon = statusCfg?.icon ?? Clock;
  const currentPlanKey = sub?.plan ?? 'Trial';
  const isExpired = sub?.status === 'Expired';

  return (
    <motion.div
      className="p-6 max-w-5xl mx-auto space-y-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement & Plan</h1>
        <p className="text-gray-500 mt-1">Verwalten Sie Ihren Plan und sehen Sie Ihre aktuelle Nutzung</p>
      </motion.div>

      {/* Expired Warning */}
      {isExpired && (
        <motion.div variants={fadeUp} className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
          <XCircle className="text-red-500 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-red-800">Ihr Testzeitraum ist abgelaufen</p>
            <p className="text-red-600 text-sm mt-1">
              Wählen Sie unten einen Plan, um Ihr Studio wieder zu aktivieren.
            </p>
          </div>
        </motion.div>
      )}

      {/* Status Card */}
      {sub && (
        <motion.div variants={fadeUp} className={`rounded-2xl border p-6 ${statusCfg?.bg ?? 'bg-gray-50'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-white/60`}>
                <StatusIcon size={20} className={statusCfg?.text} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Aktueller Status</p>
                <p className={`font-bold text-lg ${statusCfg?.text}`}>{statusCfg?.label}</p>
              </div>
            </div>
            {sub.isInTrial && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Testphase endet</p>
                <p className="font-semibold text-gray-800">
                  {new Date(sub.trialEndsAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className={`text-sm font-medium ${sub.trialDaysRemaining <= 3 ? 'text-red-600' : sub.trialDaysRemaining <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
                  noch {sub.trialDaysRemaining} {sub.trialDaysRemaining === 1 ? 'Tag' : 'Tage'}
                </p>
              </div>
            )}
          </div>

          {/* Trial Progress Bar */}
          {sub.isInTrial && (() => {
            const total = 14;
            const used = total - sub.trialDaysRemaining;
            const pct = (used / total) * 100;
            const barColor = sub.trialDaysRemaining <= 3 ? 'bg-red-500' : sub.trialDaysRemaining <= 7 ? 'bg-amber-500' : 'bg-[#017172]';
            return (
              <div className="mt-4">
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{used} von 14 Testtagen verbraucht</p>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Usage Meter */}
      {usage && (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-[#017172]" />
            Aktuelle Nutzung ({usage.planDisplayName}-Plan)
          </h2>
          <div className="space-y-4">
            <UsageBar
              label="Mitarbeiter"
              current={usage.employees.current}
              limit={usage.employees.limit}
              isUnlimited={usage.employees.isUnlimited}
              percentage={usage.employees.percentage}
            />
            <UsageBar
              label="Services"
              current={usage.services.current}
              limit={usage.services.limit}
              isUnlimited={usage.services.isUnlimited}
              percentage={usage.services.percentage}
            />
          </div>
          {(usage.employees.percentage >= 80 || usage.services.percentage >= 80) && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle size={16} />
              Sie nähern sich dem Limit Ihres Plans. Upgraden Sie für mehr Kapazität.
            </div>
          )}
        </motion.div>
      )}

      {/* Pricing Cards */}
      <motion.div variants={fadeUp}>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pläne & Preise</h2>
        <p className="text-gray-500 text-sm mb-6">Monatlich kündbar · Keine versteckten Kosten · Sofort aktivierbar</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanKey === plan.key;
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border-2 p-6 flex flex-col
                  ${plan.highlight ? 'border-[#017172] shadow-lg' : 'border-gray-200'}
                  ${isCurrent ? 'ring-2 ring-[#017172]/30' : ''}
                  bg-white`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#017172] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Empfohlen
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Ihr Plan
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-3xl font-bold text-gray-900">€{plan.price}</span>
                    <span className="text-gray-500 mb-1">/Monat</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.employees ? `${plan.employees} Mitarbeiter · ${plan.services} Services` : 'Unbegrenzte Mitarbeiter & Services'}
                  </p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check size={15} className="text-[#017172] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/491754701892?text=Hallo%2C%20ich%20m%C3%B6chte%20den%20${plan.name}-Plan%20f%C3%BCr%20mein%20Studio%20buchen.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${plan.highlight
                        ? 'bg-[#017172] hover:bg-[#015f5f] text-white'
                        : 'bg-gray-900 hover:bg-gray-700 text-white'}`}
                  >
                    <MessageCircle size={16} />
                    {isCurrent ? 'Plan verlängern' : `${plan.name} buchen`}
                    <ArrowRight size={14} />
                  </a>
                  <a
                    href={`mailto:support@gentlegroup.de?subject=${plan.name}-Plan%20Upgrade&body=Hallo%2C%20ich%20m%C3%B6chte%20auf%20den%20${plan.name}-Plan%20upgraden.`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Mail size={15} />
                    Per E-Mail anfragen
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div variants={fadeUp} className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Fragen zu Ihrem Plan?</p>
          <p className="text-sm text-gray-500 mt-0.5">Wir helfen Ihnen gerne persönlich weiter.</p>
        </div>
        <div className="flex gap-3">
          <a
            href="https://wa.me/491754701892"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a
            href="mailto:support@gentlegroup.de"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Mail size={16} /> E-Mail
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
