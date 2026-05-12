"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import {
  lighten, withAlpha, getContrastColor, getBorderRadius, getAvatarRadius,
  buildAnimVariants, FONT_FAMILY, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP,
  type TemplateProps,
} from "../_shared";

export function SplitTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const accent     = primaryColor || "#017172";
  const btnRadius  = getBorderRadius(cfg.buttonStyle || "rounded");
  const avRadius   = getAvatarRadius(cfg.avatarShape || "circle");
  const ctaText    = cfg.ctaText?.trim() || "Termin buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily = FONT_FAMILY[cfg.fontFamily ?? "inter"] ?? FONT_FAMILY.inter;
  const fontQuery  = cfg.fontFamily && cfg.fontFamily !== "inter" ? FONT_QUERY[cfg.fontFamily] : null;
  const ctaColor   = cfg.ctaColor ?? accent;
  const ctaTextClr = getContrastColor(ctaColor);
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  const leftBg = lighten(accent, 0.92);

  return (
    <div className="min-h-screen" style={{ fontFamily }}>
      {fontQuery && <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>}

      {/* Desktop: flex-row / Mobile: flex-col */}
      <div className="min-h-screen flex flex-col md:flex-row">

        {/* Left panel — fixed info */}
        <div className="md:w-[280px] md:min-h-screen flex-shrink-0 flex flex-col items-center justify-center p-8 md:p-10 gap-5 text-center md:sticky md:top-0 md:h-screen"
          style={{ background: leftBg, borderRight: `1px solid ${withAlpha(accent, 0.1)}` }}>

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative inline-block">
              <div className="absolute -inset-1.5 rounded-full opacity-50"
                style={{ background: `linear-gradient(135deg, ${accent}, ${withAlpha(accent, 0.3)})` }} />
              {logoSrc ? (
                <img src={logoSrc} alt={tenantName}
                  className="relative w-24 h-24 object-cover border-2 border-white shadow-lg"
                  style={{ borderRadius: avRadius }} />
              ) : (
                <div className="relative w-24 h-24 flex items-center justify-center border-2 border-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${withAlpha(accent, 0.7)})`, borderRadius: avRadius }}>
                  {emoji
                    ? <span className="text-4xl">{emoji}</span>
                    : <span className="text-white text-3xl font-bold">{tenantName.charAt(0).toUpperCase()}</span>
                  }
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-2"
          >
            <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>{tenantName}</h1>
            {tagline && (
              <p className="text-sm leading-relaxed text-gray-500 max-w-[200px]">{tagline}</p>
            )}
            {cfg.showWelcome && welcomeMsg && (
              <p className="text-xs leading-relaxed text-gray-400 italic max-w-[200px] mt-1">{welcomeMsg}</p>
            )}
            {/* Accent dot row */}
            <div className="flex gap-1.5 mt-2">
              {[1, 0.4, 0.2].map((op, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: withAlpha(accent, op) }} />
              ))}
            </div>
          </motion.div>

          {/* Vertical divider on desktop only */}
          <div className="hidden md:block absolute right-0 top-1/4 bottom-1/4 w-px" style={{ background: withAlpha(accent, 0.12) }} />
        </div>

        {/* Right panel — scrollable links */}
        <div className="flex-1 min-h-screen flex flex-col justify-start px-5 py-10 md:px-10 md:py-14 pb-24" style={{ background: "#ffffff" }}>

          <motion.div className="max-w-sm w-full mx-auto flex flex-col gap-3" variants={container} initial="hidden" animate="visible">

            {/* Section heading */}
            <motion.div variants={item} className="mb-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-3">Buchung & Links</p>
            </motion.div>

            {/* CTA */}
            <motion.div variants={item}>
              {cfg.confetti ? (
                <button onClick={handleCtaClick}
                  className="w-full flex items-center gap-3 px-5 py-4 font-bold text-sm shadow-md transition-all active:scale-[0.97]"
                  style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 4px 20px ${withAlpha(ctaColor, 0.3)}` }}
                >
                  <span className="flex-shrink-0 bg-white/20 p-2 rounded-full"><Calendar size={18} /></span>
                  <span className="flex-1 text-left">{ctaText}</span>
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <ChevronRight size={16} className="opacity-70" />
                  </motion.span>
                </button>
              ) : (
                <a href={`/booking/${slug}/book`}
                  className="w-full flex items-center gap-3 px-5 py-4 font-bold text-sm shadow-md transition-all active:scale-[0.97]"
                  style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 4px 20px ${withAlpha(ctaColor, 0.3)}`, display: "flex" }}
                >
                  <span className="flex-shrink-0 bg-white/20 p-2 rounded-full"><Calendar size={18} /></span>
                  <span className="flex-1 text-left">{ctaText}</span>
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <ChevronRight size={16} className="opacity-70" />
                  </motion.span>
                </a>
              )}
              <a href="/my-bookings" className="block text-center text-xs mt-2 transition-opacity hover:opacity-70 text-gray-400">
                Meine Buchungen →
              </a>
            </motion.div>

            {links.length > 0 && (
              <motion.div variants={item}>
                <div className="h-px my-2" style={{ background: withAlpha(accent, 0.08) }} />
              </motion.div>
            )}

            {/* Custom links */}
            {links.map((link) => (
              <motion.div key={link.id} variants={item}>
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                  className="group w-full flex items-center gap-4 px-5 py-3.5 transition-all active:scale-[0.97]"
                  style={{
                    background: withAlpha(accent, 0.04),
                    borderRadius: btnRadius,
                    border: `1px solid ${withAlpha(accent, 0.1)}`,
                    color: "#1a1a1a",
                  }}
                >
                  <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-white shadow-sm group-hover:scale-105 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${withAlpha(accent, 0.7)})` }}>
                    {ICON_MAP[link.iconType] ?? <ExternalLink size={16} />}
                  </span>
                  <span className="flex-1 font-medium text-sm">{link.title}</span>
                  <ExternalLink size={13} className="opacity-25 group-hover:opacity-50 transition-opacity" />
                </a>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="max-w-sm w-full mx-auto mt-10 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={10} style={{ color: withAlpha(accent, 0.4) }} />
              <p className="text-[10px] text-gray-300">
                Powered by <span className="font-semibold" style={{ color: accent }}>GentleBook</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-300 hover:opacity-60">Datenschutz</a>
              <span className="text-[10px] text-gray-200">·</span>
              <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-300 hover:opacity-60">Impressum</a>
            </div>
          </motion.div>
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
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm shadow-2xl active:scale-95 transition-transform"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "9999px", boxShadow: `0 8px 32px ${withAlpha(ctaColor, 0.4)}` }}>
                <Calendar size={16} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm shadow-2xl active:scale-95 transition-transform"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "9999px", boxShadow: `0 8px 32px ${withAlpha(ctaColor, 0.4)}` }}>
                <Calendar size={16} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
