"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, ExternalLink, ArrowUpRight } from "lucide-react";
import {
  withAlpha, getContrastColor, buildAnimVariants, ICON_MAP, type TemplateProps,
} from "../_shared";

export function PortfolioTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const accent = primaryColor || "#18181B";
  const ctaText = cfg.ctaText?.trim() || "Call buchen";
  const ctaColor = cfg.ctaColor ?? accent;
  const textColor = getContrastColor(ctaColor);
  const { container, item } = buildAnimVariants(cfg.animationSpeed);
  const BookingButton = cfg.confetti ? "button" : "a";
  const bookingProps = cfg.confetti ? { onClick: handleCtaClick } : { href: `/booking/${slug}/book` };

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="fixed inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8 pb-24">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Booking CMS</p>
            <h1 className="text-4xl font-black leading-none tracking-normal sm:text-5xl">{tenantName}</h1>
            {tagline && <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-500">{tagline}</p>}
          </div>
          {logoSrc && <img src={logoSrc} alt={tenantName} className="h-16 w-16 rounded-2xl object-cover" />}
        </motion.header>

        <motion.div className="mb-5 grid grid-cols-[1fr_auto] gap-3 rounded-[30px] border border-zinc-200 bg-zinc-50 p-4"
          style={{ perspective: 900 }}
          animate={{ rotateX: [0, 1.5, 0], rotateY: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">Next action</p>
            <p className="mt-2 text-2xl font-black">Book a slot</p>
            {cfg.showWelcome && welcomeMsg && <p className="mt-2 text-sm leading-relaxed text-zinc-500">{welcomeMsg}</p>}
          </div>
          <motion.div className="h-16 w-16 rounded-2xl" style={{ background: accent }}
            animate={{ rotate: [0, 12, 0], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
        </motion.div>

        <BookingButton {...bookingProps as any} className="mb-5 flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-sm font-black uppercase shadow-xl active:scale-[0.98]"
          style={{ background: ctaColor, color: textColor, boxShadow: `0 18px 50px ${withAlpha(accent, 0.18)}` }}>
          <Calendar size={18} /><span className="flex-1">{ctaText}</span><ChevronRight size={18} />
        </BookingButton>

        <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {links.map((link, index) => (
            <motion.a key={link.id} variants={item} href={link.url} target="_blank" rel="noopener noreferrer"
              className={`group flex min-h-[118px] flex-col justify-between rounded-[26px] border border-zinc-200 p-4 transition-colors hover:bg-zinc-950 hover:text-white ${index === 0 ? "sm:col-span-2" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950 group-hover:bg-white">
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
                </span>
                <ArrowUpRight size={18} className="text-zinc-300 group-hover:text-white" />
              </div>
              <span className="mt-5 text-lg font-black leading-tight">{link.title}</span>
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
