"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import {
  withAlpha, getContrastColor, getBorderRadius, getAvatarRadius,
  buildAnimVariants, FONT_FAMILY, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP,
  type TemplateProps,
} from "../_shared";

export function NeonTemplate({
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
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  const neonGlow = `0 0 20px ${withAlpha(primaryColor, 0.6)}, 0 0 60px ${withAlpha(primaryColor, 0.3)}`;
  const neonBorder = withAlpha(primaryColor, 0.5);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #060614 0%, #0a0a1e 60%, #080818 100%)", fontFamily }}>
      {fontQuery && <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>}

      {/* Neon grid overlay */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden
        style={{
          backgroundImage: `linear-gradient(${withAlpha(primaryColor, 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(primaryColor, 0.03)} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Neon glow blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: primaryColor }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: primaryColor }} />
      </div>

      <div className="relative max-w-md mx-auto px-5 py-14 pb-20 flex flex-col items-center gap-6">

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 text-center"
        >
          {/* Avatar with neon ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-lg opacity-60"
              style={{ background: primaryColor, transform: "scale(1.3)" }} />
            <div className="absolute -inset-1 rounded-full" style={{ boxShadow: neonGlow }} />
            {logoSrc ? (
              <img src={logoSrc} alt={tenantName}
                className="relative w-24 h-24 object-cover border-2"
                style={{ borderRadius: avRadius, borderColor: withAlpha(primaryColor, 0.8) }} />
            ) : (
              <div className="relative w-24 h-24 flex items-center justify-center border-2"
                style={{ background: `linear-gradient(135deg, ${withAlpha(primaryColor, 0.2)}, ${withAlpha(primaryColor, 0.05)})`, borderRadius: avRadius, borderColor: withAlpha(primaryColor, 0.8) }}>
                {emoji
                  ? <span className="text-4xl">{emoji}</span>
                  : <span className="text-4xl font-bold" style={{ color: primaryColor }}>{tenantName.charAt(0).toUpperCase()}</span>
                }
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mt-1" style={{ textShadow: neonGlow }}>
            {tenantName}
          </h1>
          {tagline && (
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: withAlpha(primaryColor, 0.7) }}>
              {tagline}
            </p>
          )}
          {cfg.showWelcome && welcomeMsg && (
            <p className="text-sm italic leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {welcomeMsg}
            </p>
          )}

          {/* Neon divider */}
          <div className="h-px w-20 mt-1" style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`, boxShadow: neonGlow }} />
        </motion.div>

        {/* Links */}
        <motion.div className="w-full flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
          {/* CTA */}
          <motion.div variants={item}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="w-full flex items-center gap-3 px-5 py-4 font-bold text-base transition-transform active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.8)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: neonGlow }}
              >
                <span className="flex-shrink-0 bg-white/15 p-2" style={{ borderRadius: btnRadius }}><Calendar size={20} /></span>
                <span className="flex-1">{ctaText}</span>
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                  <ChevronRight size={18} className="opacity-70" />
                </motion.span>
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="w-full flex items-center gap-3 px-5 py-4 font-bold text-base transition-transform active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.8)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: neonGlow, display: "flex" }}
              >
                <span className="flex-shrink-0 bg-white/15 p-2" style={{ borderRadius: btnRadius }}><Calendar size={20} /></span>
                <span className="flex-1">{ctaText}</span>
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                  <ChevronRight size={18} className="opacity-70" />
                </motion.span>
              </a>
            )}
            <div className="mt-2 text-center">
              <a href="/my-bookings" className="text-xs opacity-30 hover:opacity-60 transition-opacity" style={{ color: primaryColor }}>
                Meine Buchungen →
              </a>
            </div>
          </motion.div>

          {/* Custom links with neon borders */}
          {links.map((link) => (
            <motion.div key={link.id} variants={item}>
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="group w-full flex items-center gap-3 px-5 py-4 transition-all active:scale-[0.97]"
                style={{
                  background: withAlpha(primaryColor, 0.06),
                  borderRadius: btnRadius,
                  border: `1px solid ${neonBorder}`,
                  color: "#ffffff",
                }}
              >
                <span className="flex-shrink-0 p-2 text-white group-hover:scale-105 transition-transform"
                  style={{ background: withAlpha(primaryColor, 0.2), borderRadius: btnRadius, color: primaryColor }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
                </span>
                <span className="flex-1 font-semibold text-sm">{link.title}</span>
                <ExternalLink size={13} style={{ color: withAlpha(primaryColor, 0.5) }} className="group-hover:opacity-80 transition-opacity" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-4 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} style={{ color: withAlpha(primaryColor, 0.5) }} />
            <p className="text-xs text-white/30">
              Powered by <span className="font-semibold" style={{ color: primaryColor }}>GentleBook</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/20 hover:opacity-60">Datenschutz</a>
            <span className="text-[10px] text-white/10">·</span>
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/20 hover:opacity-60">Impressum</a>
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
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm active:scale-95 transition-transform"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "9999px", boxShadow: neonGlow }}>
                <Calendar size={16} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm active:scale-95 transition-transform"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "9999px", boxShadow: neonGlow }}>
                <Calendar size={16} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
