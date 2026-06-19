"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, ExternalLink, Flame, Zap } from "lucide-react";
import {
  withAlpha, getContrastColor, buildAnimVariants, INDUSTRY_EMOJI, ICON_MAP, type TemplateProps,
} from "../_shared";

export function FitnessTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const accent = primaryColor || "#EF4444";
  const ctaText = cfg.ctaText?.trim() || "Training buchen";
  const ctaColor = cfg.ctaColor ?? accent;
  const textColor = getContrastColor(ctaColor);
  const emoji = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const { container, item } = buildAnimVariants(cfg.animationSpeed);
  const allLinks = links.slice(0, 6);

  const BookingButton = cfg.confetti ? "button" : "a";
  const bookingProps = cfg.confetti ? { onClick: handleCtaClick } : { href: `/booking/${slug}/book` };

  return (
    <div className="min-h-screen overflow-hidden bg-[#08090d] text-white">
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${withAlpha(accent, 0.12)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(accent, 0.1)} 1px, transparent 1px)`, backgroundSize: "44px 44px" }} />
        <motion.div className="absolute -right-24 top-20 h-64 w-64 rounded-[40px] opacity-40 blur-3xl" style={{ background: accent }}
          animate={{ rotate: [0, 35, 0], scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }} />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 py-8 pb-24">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Performance</span>
            <Zap size={18} style={{ color: accent }} />
          </div>
          <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-normal">{tenantName}</h1>
          {tagline && <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">{tagline}</p>}
        </motion.div>

        <motion.div style={{ perspective: 1000 }} className="mb-5">
          <motion.div className="relative overflow-hidden rounded-[32px] border border-white/10 p-5 shadow-2xl"
            style={{ background: `linear-gradient(145deg, ${withAlpha(accent, 0.28)}, rgba(255,255,255,0.06))`, transformStyle: "preserve-3d" }}
            animate={{ rotateX: [0, 5, 0], rotateY: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}>
            <motion.div className="absolute right-4 top-4 h-16 w-16 rounded-2xl" style={{ background: accent, transform: "translateZ(40px)" }}
              animate={{ rotate: [0, 18, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
            <div className="relative flex items-end gap-4">
              {logoSrc ? <img src={logoSrc} alt={tenantName} className="h-24 w-24 rounded-3xl object-cover" /> : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 text-4xl">{emoji ?? <Flame style={{ color: accent }} />}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Next slot</p>
                <p className="mt-1 text-2xl font-black">Heute</p>
              </div>
            </div>
            {cfg.showWelcome && welcomeMsg && <p className="relative mt-4 text-sm text-white/55">{welcomeMsg}</p>}
          </motion.div>
        </motion.div>

        <BookingButton {...bookingProps as any} className="mb-4 flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-sm font-black uppercase shadow-2xl active:scale-[0.98]"
          style={{ background: ctaColor, color: textColor, boxShadow: `0 18px 50px ${withAlpha(accent, 0.38)}` }}>
          <Calendar size={19} /><span className="flex-1">{ctaText}</span><ChevronRight size={18} />
        </BookingButton>

        <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          {allLinks.map((link) => (
            <motion.a key={link.id} variants={item} href={link.url} target="_blank" rel="noopener noreferrer"
              className="min-h-[108px] rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-sm font-bold backdrop-blur transition-transform active:scale-[0.97]">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: withAlpha(accent, 0.18), color: accent }}>
                {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
              </span>
              <span className="block leading-tight">{link.title}</span>
            </motion.a>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {showFloating && (
          <motion.a href={`/booking/${slug}/book`} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-5 left-5 right-5 z-40 mx-auto flex max-w-sm items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black uppercase shadow-2xl"
            style={{ background: ctaColor, color: textColor }}>
            <Calendar size={17} /> {ctaText}
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
