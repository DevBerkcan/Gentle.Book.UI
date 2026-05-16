"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, Sparkles, ExternalLink, Leaf } from "lucide-react";
import {
  lighten, withAlpha, getContrastColor, getBorderRadius, getAvatarRadius,
  buildAnimVariants, FONT_FAMILY, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP,
  type TemplateProps,
} from "../_shared";

export function OrganicTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const green      = primaryColor || "#4A7C59";
  const beige      = "#F5F0E8";
  const darkGreen  = "#2D4A35";
  const btnRadius  = getBorderRadius(cfg.buttonStyle || "rounded");
  const avRadius   = getAvatarRadius(cfg.avatarShape || "circle");
  const ctaText    = cfg.ctaText?.trim() || "Termin buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily = "'DM Serif Display', Georgia, serif";
  const fontQuery  = "DM+Serif+Display:ital@0;1";
  const ctaColor   = cfg.ctaColor ?? green;
  const ctaTextClr = getContrastColor(ctaColor);
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  return (
    <div className="min-h-screen" style={{ background: beige, fontFamily }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>

      {/* Organic blob shapes — breathing animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <motion.div
          className="absolute -top-20 -right-20 w-72 h-72 opacity-20 blur-2xl"
          style={{ background: green }}
          animate={{ borderRadius: ["60% 40% 70% 30% / 50% 60% 40% 50%", "40% 60% 30% 70% / 60% 40% 60% 40%", "60% 40% 70% 30% / 50% 60% 40% 50%"] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -left-16 w-56 h-56 opacity-15 blur-2xl"
          style={{ background: green }}
          animate={{ borderRadius: ["40% 60% 30% 70% / 60% 40% 60% 40%", "70% 30% 60% 40% / 40% 60% 40% 60%", "40% 60% 30% 70% / 60% 40% 60% 40%"] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute -bottom-12 right-1/4 w-48 h-48 opacity-10 blur-2xl"
          style={{ background: green }}
          animate={{ borderRadius: ["70% 30% 50% 50% / 30% 70% 50% 50%", "50% 50% 30% 70% / 70% 30% 70% 30%", "70% 30% 50% 50% / 30% 70% 50% 50%"] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Wave header */}
      <div className="relative overflow-hidden" style={{ background: green, paddingBottom: "48px" }}>
        <div className="absolute inset-x-0 bottom-0" style={{ height: "56px" }}>
          <svg viewBox="0 0 375 56" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,56 C120,0 255,56 375,14 L375,56 Z" fill={beige} />
          </svg>
        </div>
        <div className="flex items-center justify-center pt-8 pb-4 gap-1.5">
          <Leaf size={12} className="text-white/50" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-medium">wellness</span>
          <Leaf size={12} className="text-white/50 scale-x-[-1]" />
        </div>
      </div>

      <div className="relative max-w-sm mx-auto px-5 -mt-16 pb-20 flex flex-col items-center gap-6">

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full flex flex-col items-center gap-4 text-center"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="absolute -inset-1.5 rounded-full opacity-60"
              style={{ background: `linear-gradient(135deg, ${green}, ${withAlpha(green, 0.4)})` }} />
            <div className="absolute -inset-0.5 rounded-full" style={{ background: beige }} />
            {logoSrc ? (
              <img src={logoSrc} alt={tenantName}
                className="relative w-24 h-24 object-cover"
                style={{ borderRadius: avRadius, border: `3px solid ${beige}` }} />
            ) : (
              <div className="relative w-24 h-24 flex items-center justify-center"
                style={{ background: lighten(green, 0.6), borderRadius: avRadius, border: `3px solid ${beige}` }}>
                {emoji
                  ? <span className="text-4xl">{emoji}</span>
                  : <Leaf size={32} style={{ color: green }} />
                }
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold" style={{ color: darkGreen, fontFamily }}>
              {tenantName}
            </h1>
            {tagline && (
              <p className="text-sm italic mt-1 leading-relaxed max-w-xs" style={{ color: withAlpha(darkGreen, 0.55) }}>
                {tagline}
              </p>
            )}
            {cfg.showWelcome && welcomeMsg && (
              <p className="text-xs mt-2 leading-relaxed max-w-xs" style={{ color: withAlpha(darkGreen, 0.4) }}>{welcomeMsg}</p>
            )}
          </div>

          {/* Leaf divider */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-px" style={{ background: withAlpha(green, 0.2) }} />
            <Leaf size={12} style={{ color: withAlpha(green, 0.4) }} />
            <div className="flex-1 h-px" style={{ background: withAlpha(green, 0.2) }} />
          </div>
        </motion.div>

        {/* Links */}
        <motion.div className="w-full flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
          {/* CTA */}
          <motion.div variants={item}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="w-full flex items-center gap-3 px-6 py-4 font-bold text-base shadow-md transition-all active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 6px 24px ${withAlpha(ctaColor, 0.3)}` }}
              >
                <motion.span animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                  <Leaf size={18} />
                </motion.span>
                <span className="flex-1 text-left" style={{ fontFamily }}>{ctaText}</span>
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}>
                  <ChevronRight size={16} className="opacity-70" />
                </motion.span>
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="w-full flex items-center gap-3 px-6 py-4 font-bold text-base shadow-md transition-all active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 6px 24px ${withAlpha(ctaColor, 0.3)}`, display: "flex" }}
              >
                <motion.span animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                  <Leaf size={18} />
                </motion.span>
                <span className="flex-1 text-left" style={{ fontFamily }}>{ctaText}</span>
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}>
                  <ChevronRight size={16} className="opacity-70" />
                </motion.span>
              </a>
            )}
            <div className="mt-2 text-center">
              <a href="/my-bookings" className="text-xs italic transition-opacity hover:opacity-70" style={{ color: withAlpha(green, 0.5) }}>
                Meine Buchungen →
              </a>
            </div>
          </motion.div>

          {/* Custom links */}
          {links.map((link) => (
            <motion.div key={link.id} variants={item}>
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="group w-full flex items-center gap-4 px-5 py-3.5 transition-all active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(8px)",
                  borderRadius: btnRadius,
                  border: `1px solid ${withAlpha(green, 0.18)}`,
                  boxShadow: `0 2px 10px ${withAlpha(green, 0.05)}`,
                  color: darkGreen,
                }}
              >
                <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${green}, ${withAlpha(green, 0.75)})` }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={16} />}
                </span>
                <span className="flex-1 font-semibold text-sm" style={{ fontFamily }}>{link.title}</span>
                <ExternalLink size={12} style={{ color: withAlpha(green, 0.35) }} className="group-hover:opacity-80 transition-opacity" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-4 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Leaf size={10} style={{ color: withAlpha(green, 0.4) }} />
            <p className="text-xs italic" style={{ color: withAlpha(darkGreen, 0.35) }}>
              Powered by <span className="font-semibold not-italic" style={{ color: green }}>GentleBook</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-60 transition-opacity" style={{ color: withAlpha(darkGreen, 0.25) }}>Datenschutz</a>
            <span className="text-[10px]" style={{ color: withAlpha(darkGreen, 0.15) }}>·</span>
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-60 transition-opacity" style={{ color: withAlpha(darkGreen, 0.25) }}>Impressum</a>
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
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "9999px", boxShadow: `0 8px 28px ${withAlpha(ctaColor, 0.4)}` }}>
                <Calendar size={16} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm shadow-2xl active:scale-95 transition-transform"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "9999px", boxShadow: `0 8px 28px ${withAlpha(ctaColor, 0.4)}` }}>
                <Calendar size={16} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
