"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, Sparkles, ExternalLink, ArrowUpRight } from "lucide-react";
import {
  withAlpha, getContrastColor, getBorderRadius, getAvatarRadius,
  buildAnimVariants, FONT_FAMILY, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP,
  type TemplateProps,
} from "../_shared";

export function MagazineTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const accent     = primaryColor || "#1A1A2E";
  const btnRadius  = "0px";
  const avRadius   = getAvatarRadius(cfg.avatarShape || "square");
  const ctaText    = cfg.ctaText?.trim() || "Jetzt buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily = "'Playfair Display', Georgia, serif";
  const sansFam    = "'Montserrat', sans-serif";
  const fontQuery  = "Playfair+Display:wght@700;900&family=Montserrat:wght@400;500;600";
  const ctaColor   = cfg.ctaColor ?? accent;
  const ctaTextClr = getContrastColor(ctaColor);
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: sansFam }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>

      {/* Header strip */}
      <div style={{ background: accent, color: "#fff" }}>
        <div className="max-w-sm mx-auto px-5 py-2 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[0.35em] opacity-50" style={{ fontFamily: sansFam }}>
            vol. 01 — 2024
          </span>
          <div className="flex gap-1 items-center">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full opacity-40 bg-white" />
            ))}
          </div>
          <span className="text-[9px] uppercase tracking-[0.35em] opacity-50" style={{ fontFamily: sansFam }}>
            booking
          </span>
        </div>
      </div>

      {/* Hero section */}
      <div className="relative overflow-hidden" style={{ background: accent, minHeight: "200px" }}>
        {/* Big background letter */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[240px] font-black leading-none opacity-[0.04] text-white"
            style={{ fontFamily }}>
            {tenantName.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="relative max-w-sm mx-auto px-5 pt-10 pb-16 flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex items-end gap-4">
            {logoSrc ? (
              <img src={logoSrc} alt={tenantName}
                className="w-20 h-20 object-cover border-2 border-white/20 flex-shrink-0"
                style={{ borderRadius: avRadius }} />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center border-2 border-white/20 flex-shrink-0"
                style={{ background: withAlpha("#fff", 0.08), borderRadius: avRadius }}>
                {emoji
                  ? <span className="text-3xl">{emoji}</span>
                  : <span className="text-white text-3xl font-black" style={{ fontFamily }}>{tenantName.charAt(0).toUpperCase()}</span>
                }
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/40 mb-1" style={{ fontFamily: sansFam }}>Studio</p>
              <h1 className="text-2xl font-black text-white leading-tight" style={{ fontFamily }}>
                {tenantName}
              </h1>
            </div>
          </div>

          {tagline && (
            <p className="text-sm leading-relaxed text-white/60 max-w-xs" style={{ fontFamily: sansFam }}>
              {tagline}
            </p>
          )}
        </div>
      </div>

      {/* Pull-up white section */}
      <div className="relative max-w-sm mx-auto -mt-8">
        <div className="bg-white mx-4 px-5 pt-5 pb-3 shadow-xl" style={{ borderRadius: "0px" }}>
          {cfg.showWelcome && welcomeMsg && (
            <p className="text-xs leading-relaxed text-gray-400 mb-4 italic" style={{ fontFamily }}>{welcomeMsg}</p>
          )}

          {/* Horizontal rule */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-0.5" style={{ background: accent }} />
            <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400" style={{ fontFamily: sansFam }}>Buchung</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Links */}
          <motion.div className="flex flex-col" variants={container} initial="hidden" animate="visible">
            {/* CTA */}
            <motion.div variants={item} className="mb-4">
              {cfg.confetti ? (
                <button onClick={handleCtaClick}
                  className="w-full flex items-center gap-3 px-5 py-4 font-bold text-sm transition-all active:scale-[0.98]"
                  style={{ background: ctaColor, color: ctaTextClr, borderRadius: btnRadius, fontFamily: sansFam, letterSpacing: "0.05em" }}
                >
                  <Calendar size={16} className="flex-shrink-0" />
                  <span className="flex-1 text-left uppercase tracking-wider text-xs">{ctaText}</span>
                  <ArrowUpRight size={16} className="opacity-70" />
                </button>
              ) : (
                <a href={`/booking/${slug}/book`}
                  className="w-full flex items-center gap-3 px-5 py-4 font-bold text-sm transition-all active:scale-[0.98]"
                  style={{ background: ctaColor, color: ctaTextClr, borderRadius: btnRadius, fontFamily: sansFam, letterSpacing: "0.05em", display: "flex" }}
                >
                  <Calendar size={16} className="flex-shrink-0" />
                  <span className="flex-1 text-left uppercase tracking-wider text-xs">{ctaText}</span>
                  <ArrowUpRight size={16} className="opacity-70" />
                </a>
              )}
              <a href="/my-bookings" className="block text-center text-[10px] uppercase tracking-widest mt-2 transition-opacity hover:opacity-70"
                style={{ color: withAlpha(accent, 0.35), fontFamily: sansFam }}>
                Meine Buchungen →
              </a>
            </motion.div>

            {/* Custom links — full-width editorial rows */}
            {links.map((link, idx) => (
              <motion.div key={link.id} variants={item}>
                {idx > 0 && <div className="h-px bg-gray-100" />}
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-3 py-3.5 transition-all"
                  style={{ color: "#1a1a1a" }}
                >
                  {/* Left accent bar */}
                  <div className="w-0.5 h-full self-stretch min-h-[32px]" style={{ background: withAlpha(accent, 0.15) }} />
                  <span className="flex-shrink-0 p-1.5" style={{ color: accent }}>
                    {ICON_MAP[link.iconType] ?? <ExternalLink size={16} />}
                  </span>
                  <span className="flex-1 font-semibold text-sm" style={{ fontFamily: sansFam }}>{link.title}</span>
                  <ArrowUpRight size={13} className="opacity-20 group-hover:opacity-50 transition-opacity" />
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mx-4 py-4 flex items-center justify-between">
          <div className="h-px flex-1" style={{ background: withAlpha(accent, 0.1) }} />
          <p className="text-[10px] uppercase tracking-widest mx-3 text-gray-300" style={{ fontFamily: sansFam }}>
            GentleBook
          </p>
          <div className="h-px flex-1" style={{ background: withAlpha(accent, 0.1) }} />
        </motion.div>
        <div className="mx-4 pb-6 flex justify-center gap-4">
          <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-300 hover:opacity-60 transition-opacity" style={{ fontFamily: sansFam }}>Datenschutz</a>
          <span className="text-[10px] text-gray-200">·</span>
          <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-300 hover:opacity-60 transition-opacity" style={{ fontFamily: sansFam }}>Impressum</a>
        </div>
      </div>

      {/* Floating CTA */}
      <AnimatePresence>
        {showFloating && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-transform"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "0px", boxShadow: `0 8px 32px ${withAlpha(ctaColor, 0.4)}`, fontFamily: sansFam }}>
                <Calendar size={14} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-transform"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "0px", boxShadow: `0 8px 32px ${withAlpha(ctaColor, 0.4)}`, fontFamily: sansFam }}>
                <Calendar size={14} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
