'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, Users, ArrowRight, Calendar, UserCog, ShieldCheck } from 'lucide-react';
import { supportConfig } from '@/lib/config';
import { GentleBookMark } from '@/components/admin/GentleBookLogo';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Animated background blobs — same language as /admin/login */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#6355E4]/10 blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-[#17A398]/10 blur-3xl animate-pulse"
            style={{ animationDelay: '1.5s' }}
          />
          <div
            className="absolute top-2/3 left-1/2 h-56 w-56 rounded-full bg-[#6355E4]/5 blur-3xl animate-pulse"
            style={{ animationDelay: '3s' }}
          />
        </div>

        {/* Nav */}
        <nav className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-7">
          <div className="flex items-center gap-2.5">
            <GentleBookMark size={30} />
            <span className="text-lg font-bold tracking-tight">gentlebook</span>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/50">
            Interner Bereich
          </span>
        </nav>

        {/* Hero content */}
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/60"
          >
            <ShieldCheck size={14} className="text-[#17A398]" />
            Nur für Admins &amp; Mitarbeiter
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="mt-6 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl"
          >
            Euer Zugang zu{' '}
            <span className="bg-gradient-to-r from-[#6355E4] to-[#17A398] bg-clip-text text-transparent">
              gentlebook
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="mt-5 max-w-md text-base leading-relaxed text-white/45"
          >
            Meldet euch an, um Buchungen, Kunden und euer Team zu verwalten — je nachdem, ob ihr Admin oder Mitarbeiter seid.
          </motion.p>

          {/* Two entry points */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
            className="mt-12 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <LoginCard
              href="/admin/login"
              icon={<Building2 size={22} />}
              title="Admin-Login"
              description="Buchungssystem, Team & Einstellungen verwalten"
              accent="from-[#6355E4] to-[#5448C1]"
            />
            <LoginCard
              href="/admin/login?mode=employee"
              icon={<Users size={22} />}
              title="Mitarbeiter-Login"
              description="Eigener Kalender & eigene Termine"
              accent="from-[#17A398] to-[#0f8a7d]"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
          >
            <Link
              href="/admin/forgot-password"
              className="mt-7 inline-block text-sm text-white/35 transition-colors hover:text-white/60"
            >
              Passwort vergessen?
            </Link>
          </motion.div>
        </main>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="relative z-10 flex justify-center pb-10"
        >
          <div className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/30">
            Mehr
            <span className="block h-9 w-px animate-pulse bg-gradient-to-b from-[#6355E4] to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* ── Orientation strip (scroll-reveal, no sales pitch) ──── */}
      <section className="relative border-t border-white/5 bg-[#12121f] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <RevealItem>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
              Was ihr hier macht
            </p>
          </RevealItem>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: 'Buchungen im Blick',
                desc: 'Alle Termine, Kundendaten und Stornierungen an einem Ort.',
              },
              {
                icon: UserCog,
                title: 'Team organisieren',
                desc: 'Arbeitszeiten, Abwesenheiten und Zuständigkeiten verwalten.',
              },
              {
                icon: ShieldCheck,
                title: 'Sicher getrennt',
                desc: 'Admin- und Mitarbeiter-Zugänge mit jeweils passenden Rechten.',
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <RevealItem key={title} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6355E4]/20 to-[#17A398]/20">
                    <Icon size={18} className="text-[#8c82ef]" />
                  </div>
                  <h3 className="mb-1.5 font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-white/40">{desc}</p>
                </div>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0f0f1a] py-8 text-center text-xs text-white/25">
        <a href={supportConfig.mailto()} className="transition-colors hover:text-white/50">
          Fragen? {supportConfig.email}
        </a>
      </footer>
    </div>
  );
}

function LoginCard({
  href,
  icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link href={href} className="group relative block">
      <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left backdrop-blur-sm transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.07] group-hover:-translate-y-0.5">
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg`}
        >
          {icon}
        </div>
        <h2 className="flex items-center gap-1.5 text-base font-bold text-white">
          {title}
          <ArrowRight size={14} className="text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white/60" />
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/40">{description}</p>
      </div>
    </Link>
  );
}

function RevealItem({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
