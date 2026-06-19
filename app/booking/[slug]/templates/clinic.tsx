"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, ExternalLink, HeartPulse, ShieldCheck } from "lucide-react";
import {
  lighten, withAlpha, getContrastColor, getAvatarRadius,
  buildAnimVariants, INDUSTRY_EMOJI, ICON_MAP, type TemplateProps,
} from "../_shared";

export function ClinicTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const accent = primaryColor || "#0EA5E9";
  const ctaText = cfg.ctaText?.trim() || "Termin vereinbaren";
  const ctaColor = cfg.ctaColor ?? accent;
  const textColor = getContrastColor(ctaColor);
  const avRadius = getAvatarRadius(cfg.avatarShape || "rounded");
  const emoji = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  const cta = cfg.confetti ? (
    <button onClick={handleCtaClick} className="group flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-sm font-bold shadow-xl active:scale-[0.98]"
      style={{ background: ctaColor, color: textColor, boxShadow: `0 16px 40px ${withAlpha(accent, 0.24)}` }}>
      <Calendar size={19} /><span className="flex-1">{ctaText}</span><ChevronRight size={18} />
    </button>
  ) : (
    <a href={`/booking/${slug}/book`} className="group flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold shadow-xl active:scale-[0.98]"
      style={{ background: ctaColor, color: textColor, boxShadow: `0 16px 40px ${withAlpha(accent, 0.24)}` }}>
      <Calendar size={19} /><span className="flex-1">{ctaText}</span><ChevronRight size={18} />
    </a>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-950">
      <div className="fixed inset-0 pointer-events-none" aria-hidden
        style={{ backgroundImage: `linear-gradient(${withAlpha(accent, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(accent, 0.05)} 1px, transparent 1px)`, backgroundSize: "34px 34px" }} />

      <div className="relative mx-auto flex max-w-md flex-col gap-5 px-5 py-8 pb-24">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-white bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {logoSrc ? (
              <img src={logoSrc} alt={tenantName} className="h-16 w-16 object-cover shadow-sm" style={{ borderRadius: avRadius }} />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center shadow-sm" style={{ background: lighten(accent, 0.86), borderRadius: avRadius }}>
                {emoji ? <span className="text-2xl">{emoji}</span> : <HeartPulse style={{ color: accent }} />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>
                <ShieldCheck size={12} /> Online Buchung
              </p>
              <h1 className="truncate text-xl font-bold">{tenantName}</h1>
              {tagline && <p className="mt-1 text-sm leading-relaxed text-slate-500">{tagline}</p>}
            </div>
          </div>
          {cfg.showWelcome && welcomeMsg && <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-500">{welcomeMsg}</p>}
        </motion.div>

        <motion.div style={{ perspective: 900 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <motion.div className="rounded-[28px] border border-white bg-white p-4 shadow-lg"
            animate={{ rotateX: [0, 2.5, 0], rotateY: [0, -2.5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span>Schnellzugriff</span>
              <span>{links.length + 1} Optionen</span>
            </div>
            {cta}
          </motion.div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="visible" className="flex flex-col gap-3">
          {links.map((link) => (
            <motion.a key={link.id} variants={item} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: accent }}>
                {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
              </span>
              <span className="flex-1 truncate">{link.title}</span>
              <ChevronRight size={16} className="text-slate-300" />
            </motion.a>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {showFloating && (
          <motion.a href={`/booking/${slug}/book`} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-5 left-5 right-5 z-40 mx-auto flex max-w-sm items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-2xl"
            style={{ background: ctaColor, color: textColor }}>
            <Calendar size={17} /> {ctaText}
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
