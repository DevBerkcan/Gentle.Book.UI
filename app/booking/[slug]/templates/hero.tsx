"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import {
  lighten, withAlpha, getContrastColor, getBorderRadius, getAvatarRadius,
  buildAnimVariants, FONT_FAMILY, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP,
  BgPattern, type TemplateProps,
} from "../_shared";

export function HeroTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const btnRadius  = getBorderRadius(cfg.buttonStyle);
  const avRadius   = getAvatarRadius(cfg.avatarShape);
  const ctaText    = cfg.ctaText?.trim() || "Termin buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily = FONT_FAMILY[cfg.fontFamily ?? "inter"] ?? FONT_FAMILY.inter;
  const fontQuery  = cfg.fontFamily && cfg.fontFamily !== "inter" ? FONT_QUERY[cfg.fontFamily] : null;
  const ctaColor   = cfg.ctaColor ?? primaryColor;
  const ctaTextClr = getContrastColor(ctaColor);
  const headerTextClr = getContrastColor(primaryColor);
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily }}>
      {fontQuery && <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>}

      <BgPattern pattern={cfg.bgPattern} color={primaryColor} />

      {/* Hero header band */}
      <div className="relative w-full pb-16"
        style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${withAlpha(primaryColor, 0.85)} 100%)` }}>
        <div className="max-w-md mx-auto px-5 pt-10 pb-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-2" style={{ color: headerTextClr }}
          >
            {tenantName}
          </motion.h1>
          {tagline && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: withAlpha(headerTextClr, 0.75) }}>
              {tagline}
            </motion.p>
          )}
        </div>

        {/* Avatar overlapping the header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="absolute -bottom-14 left-1/2 -translate-x-1/2"
        >
          {logoSrc ? (
            <img src={logoSrc} alt={tenantName}
              className="w-28 h-28 object-cover border-4 border-white shadow-2xl"
              style={{ borderRadius: avRadius }} />
          ) : (
            <div className="w-28 h-28 flex items-center justify-center border-4 border-white shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${withAlpha(primaryColor, 0.7)})`, borderRadius: avRadius }}>
              {emoji
                ? <span className="text-4xl">{emoji}</span>
                : <span className="text-white text-4xl font-bold">{tenantName.charAt(0).toUpperCase()}</span>
              }
            </div>
          )}
        </motion.div>
      </div>

      {/* Content below header */}
      <div className="relative max-w-md mx-auto px-5 pt-20 pb-20">

        {cfg.showWelcome && welcomeMsg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-center text-sm text-gray-500 italic mb-5 leading-relaxed">
            {welcomeMsg}
          </motion.p>
        )}

        {/* Links */}
        <motion.div className="flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
          {/* CTA */}
          <motion.div variants={item}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="w-full flex items-center gap-3 px-5 py-4 font-bold text-base shadow-lg transition-transform active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 8px 24px ${withAlpha(ctaColor, 0.35)}` }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2" style={{ borderRadius: btnRadius }}><Calendar size={20} /></span>
                <span className="flex-1">{ctaText}</span>
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
                  <ChevronRight size={18} className="opacity-70" />
                </motion.span>
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="w-full flex items-center gap-3 px-5 py-4 font-bold text-base shadow-lg transition-transform active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 8px 24px ${withAlpha(ctaColor, 0.35)}`, display: "flex" }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2" style={{ borderRadius: btnRadius }}><Calendar size={20} /></span>
                <span className="flex-1">{ctaText}</span>
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
                  <ChevronRight size={18} className="opacity-70" />
                </motion.span>
              </a>
            )}
            <div className="mt-2 text-center">
              <a href="/my-bookings" className="text-xs text-gray-400 opacity-50 hover:opacity-80 transition-opacity">
                Meine Buchungen →
              </a>
            </div>
          </motion.div>

          {/* Custom links as clean white cards */}
          {links.map((link) => (
            <motion.div key={link.id} variants={item}>
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="group w-full flex items-center gap-3 px-5 py-4 bg-white transition-all active:scale-[0.97] hover:shadow-md"
                style={{ borderRadius: btnRadius, border: "1px solid #f0f0f0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", color: "#1a1a1a" }}
              >
                <span className="flex-shrink-0 p-2 text-white group-hover:scale-105 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${withAlpha(primaryColor, 0.75)})`, borderRadius: btnRadius }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
                </span>
                <span className="flex-1 font-semibold text-sm">{link.title}</span>
                <ExternalLink size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-8 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} style={{ color: withAlpha(primaryColor, 0.5) }} />
            <p className="text-xs text-gray-400">
              Powered by <span className="font-semibold" style={{ color: primaryColor }}>GentleBook</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-300 hover:opacity-80">Datenschutz</a>
            <span className="text-[10px] text-gray-200">·</span>
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-300 hover:opacity-80">Impressum</a>
          </div>
        </motion.div>
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
