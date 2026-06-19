"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, ExternalLink, Utensils } from "lucide-react";
import {
  lighten, withAlpha, getContrastColor, buildAnimVariants, INDUSTRY_EMOJI, ICON_MAP, type TemplateProps,
} from "../_shared";

export function RestaurantTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const accent = primaryColor || "#B45309";
  const paper = "#FFF7ED";
  const ink = "#24160f";
  const ctaText = cfg.ctaText?.trim() || "Tisch reservieren";
  const ctaColor = cfg.ctaColor ?? accent;
  const textColor = getContrastColor(ctaColor);
  const emoji = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const { container, item } = buildAnimVariants(cfg.animationSpeed);
  const BookingButton = cfg.confetti ? "button" : "a";
  const bookingProps = cfg.confetti ? { onClick: handleCtaClick } : { href: `/booking/${slug}/book` };

  return (
    <div className="min-h-screen" style={{ background: paper, color: ink, fontFamily: "'DM Serif Display', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Montserrat:wght@500;700&display=swap');`}</style>
      <div className="fixed inset-0 pointer-events-none opacity-40" aria-hidden
        style={{ backgroundImage: `radial-gradient(circle at 20% 10%, ${lighten(accent, 0.68)}, transparent 28%), radial-gradient(circle at 80% 72%, ${lighten(accent, 0.78)}, transparent 30%)` }} />

      <div className="relative mx-auto max-w-md px-5 py-8 pb-24">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border bg-white shadow-sm" style={{ borderColor: withAlpha(accent, 0.24) }}>
            {logoSrc ? <img src={logoSrc} alt={tenantName} className="h-full w-full rounded-full object-cover" /> : <span className="text-3xl">{emoji ?? <Utensils style={{ color: accent }} />}</span>}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.34em]" style={{ color: accent, fontFamily: "Montserrat, sans-serif" }}>Reservation</p>
          <h1 className="mt-2 text-4xl leading-none">{tenantName}</h1>
          {tagline && <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed opacity-60" style={{ fontFamily: "Montserrat, sans-serif" }}>{tagline}</p>}
        </motion.div>

        <motion.div className="mb-5 rounded-[32px] border bg-white p-5 shadow-xl" style={{ borderColor: withAlpha(accent, 0.16), perspective: 900 }}
          animate={{ rotateX: [0, 2, 0], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>
          <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: withAlpha(accent, 0.14), fontFamily: "Montserrat, sans-serif" }}>
            <span className="text-xs font-bold uppercase tracking-[0.18em] opacity-50">Heute offen</span>
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: lighten(accent, 0.86), color: accent }}>{cfg.ctaBadge || "Online"}</span>
          </div>
          {cfg.showWelcome && welcomeMsg && <p className="mb-4 text-sm leading-relaxed opacity-65" style={{ fontFamily: "Montserrat, sans-serif" }}>{welcomeMsg}</p>}
          <BookingButton {...bookingProps as any} className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-sm font-bold shadow-lg active:scale-[0.98]"
            style={{ background: ctaColor, color: textColor, fontFamily: "Montserrat, sans-serif" }}>
            <Calendar size={18} /><span className="flex-1">{ctaText}</span><ChevronRight size={18} />
          </BookingButton>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="visible" className="flex flex-col gap-3">
          {links.map((link) => (
            <motion.a key={link.id} variants={item} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-sm active:scale-[0.98]"
              style={{ borderColor: withAlpha(accent, 0.14), fontFamily: "Montserrat, sans-serif" }}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: lighten(accent, 0.86), color: accent }}>
                {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
              </span>
              <span className="flex-1 truncate text-sm font-bold">{link.title}</span>
            </motion.a>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {showFloating && (
          <motion.a href={`/booking/${slug}/book`} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-5 left-5 right-5 z-40 mx-auto flex max-w-sm items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-2xl"
            style={{ background: ctaColor, color: textColor, fontFamily: "Montserrat, sans-serif" }}>
            <Calendar size={17} /> {ctaText}
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
