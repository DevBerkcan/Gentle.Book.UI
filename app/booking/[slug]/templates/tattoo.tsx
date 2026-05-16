"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import {
  withAlpha, getContrastColor, getBorderRadius, getAvatarRadius,
  buildAnimVariants, FONT_FAMILY, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP,
  type TemplateProps,
} from "../_shared";

export function TattooTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const accent     = primaryColor || "#ff3333";
  const btnRadius  = "4px";
  const avRadius   = getAvatarRadius("square");
  const ctaText    = cfg.ctaText?.trim() || "Termin buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily = "'Josefin Sans', 'Montserrat', sans-serif";
  const fontQuery  = "Josefin+Sans:wght@400;600;700";
  const ctaColor   = cfg.ctaColor ?? accent;
  const ctaTextClr = getContrastColor(ctaColor);
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", fontFamily }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>

      {/* Grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Animated accent glow top */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 pointer-events-none"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        style={{ background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`, boxShadow: `0 0 30px ${withAlpha(accent, 0.8)}` }}
      />

      <div className="relative max-w-sm mx-auto px-5 py-14 pb-20 flex flex-col items-center gap-6">

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full flex flex-col items-center gap-4 text-center"
        >
          {/* Avatar — ink-drop entrance + pulsing glow ring */}
          <motion.div
            className="relative"
            initial={{ scale: 0, filter: "drop-shadow(0 0 0px transparent)" }}
            animate={{ scale: 1, filter: `drop-shadow(0 0 12px ${withAlpha(accent, 0.7)})` }}
            transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
          >
            <motion.div
              className="absolute -inset-0.5"
              animate={{ boxShadow: [`0 0 0px ${withAlpha(accent, 0)}`, `0 0 18px ${withAlpha(accent, 0.9)}`, `0 0 0px ${withAlpha(accent, 0)}`] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ background: accent }}
            />
            {logoSrc ? (
              <img src={logoSrc} alt={tenantName}
                className="relative w-24 h-24 object-cover"
                style={{ borderRadius: avRadius }} />
            ) : (
              <div className="relative w-24 h-24 flex items-center justify-center bg-[#1a1a1a]"
                style={{ borderRadius: avRadius }}>
                {emoji
                  ? <span className="text-4xl">{emoji}</span>
                  : <span className="font-bold text-3xl" style={{ color: accent, fontFamily }}>{tenantName.charAt(0).toUpperCase()}</span>
                }
              </div>
            )}
          </motion.div>

          <div>
            <motion.h1
              className="text-3xl font-bold uppercase tracking-widest text-white"
              style={{ fontFamily, letterSpacing: "0.2em" }}
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.2em" }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            >
              {tenantName}
            </motion.h1>
            {tagline && (
              <p className="text-sm mt-1 tracking-wider uppercase" style={{ color: withAlpha(accent, 0.7), letterSpacing: "0.1em" }}>
                {tagline}
              </p>
            )}
            {cfg.showWelcome && welcomeMsg && (
              <p className="text-xs mt-2 italic" style={{ color: "rgba(255,255,255,0.35)" }}>{welcomeMsg}</p>
            )}
          </div>

          {/* Barbed wire divider */}
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: withAlpha(accent, 0.3) }} />
            <span className="text-xs tracking-[0.4em] uppercase" style={{ color: withAlpha(accent, 0.5) }}>✦</span>
            <div className="flex-1 h-px" style={{ background: withAlpha(accent, 0.3) }} />
          </div>
        </motion.div>

        {/* Links */}
        <motion.div className="w-full flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
          {/* CTA */}
          <motion.div variants={item}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="w-full flex items-center gap-3 px-5 py-4 font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.97] border"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: btnRadius, borderColor: ctaColor, letterSpacing: "0.15em" }}
              >
                <Calendar size={18} />
                <span className="flex-1 text-left">{ctaText}</span>
                <ChevronRight size={16} className="opacity-70" />
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="w-full flex items-center gap-3 px-5 py-4 font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.97] border"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: btnRadius, borderColor: ctaColor, letterSpacing: "0.15em", display: "flex" }}
              >
                <Calendar size={18} />
                <span className="flex-1 text-left">{ctaText}</span>
                <ChevronRight size={16} className="opacity-70" />
              </a>
            )}
            <div className="mt-2 text-center">
              <a href="/my-bookings" className="text-xs uppercase tracking-widest transition-opacity hover:opacity-60" style={{ color: withAlpha(accent, 0.4), letterSpacing: "0.1em" }}>
                Meine Buchungen →
              </a>
            </div>
          </motion.div>

          {/* Custom links — outline style, slide from left */}
          {links.map((link) => (
            <motion.div key={link.id} variants={item}
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 4, borderColor: withAlpha(accent, 0.7) } as any}
            >
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="group w-full flex items-center gap-4 px-5 py-3.5 transition-all active:scale-[0.97] border"
                style={{
                  background: "transparent",
                  borderRadius: btnRadius,
                  border: `1px solid ${withAlpha(accent, 0.35)}`,
                  color: "#ffffff",
                }}
              >
                <span className="flex-shrink-0 p-1.5 text-sm" style={{ color: accent, border: `1px solid ${withAlpha(accent, 0.4)}`, borderRadius: "2px" }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={16} />}
                </span>
                <span className="flex-1 text-sm font-semibold uppercase tracking-wider" style={{ letterSpacing: "0.08em" }}>{link.title}</span>
                <ExternalLink size={12} style={{ color: withAlpha(accent, 0.35) }} className="group-hover:opacity-80 transition-opacity" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-4 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} style={{ color: withAlpha(accent, 0.4) }} />
            <p className="text-[10px] uppercase tracking-widest text-white/20">
              Powered by <span className="font-semibold" style={{ color: withAlpha(accent, 0.6) }}>GentleBook</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/15 hover:opacity-60">Datenschutz</a>
            <span className="text-[10px] text-white/10">·</span>
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/15 hover:opacity-60">Impressum</a>
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
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "4px" }}>
                <Calendar size={16} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "4px" }}>
                <Calendar size={16} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
