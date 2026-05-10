"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import {
  lighten, withAlpha, getContrastColor, getBorderRadius, getAvatarRadius,
  buildAnimVariants, FONT_FAMILY, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP,
  BgPattern, type TemplateProps,
} from "../_shared";

export function SoftTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const btnRadius  = "9999px";  // always pill in soft
  const avRadius   = getAvatarRadius(cfg.avatarShape);
  const ctaText    = cfg.ctaText?.trim() || "Termin buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily = FONT_FAMILY[cfg.fontFamily ?? "inter"] ?? FONT_FAMILY.inter;
  const fontQuery  = cfg.fontFamily && cfg.fontFamily !== "inter" ? FONT_QUERY[cfg.fontFamily] : null;
  const ctaColor   = cfg.ctaColor ?? primaryColor;
  const ctaTextClr = getContrastColor(ctaColor);

  const bgSoft   = `linear-gradient(160deg, ${lighten(primaryColor, 0.93)} 0%, ${lighten(primaryColor, 0.97)} 50%, #ffffff 100%)`;
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  return (
    <div className="min-h-screen" style={{ background: bgSoft, fontFamily }}>
      {fontQuery && <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>}

      {/* Soft blob decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-30 blur-3xl"
          style={{ background: lighten(primaryColor, 0.6) }} />
        <div className="absolute top-1/2 -left-20 w-60 h-60 rounded-full opacity-20 blur-3xl"
          style={{ background: lighten(primaryColor, 0.5) }} />
        <div className="absolute -bottom-20 right-1/4 w-48 h-48 rounded-full opacity-25 blur-3xl"
          style={{ background: lighten(primaryColor, 0.6) }} />
      </div>

      <BgPattern pattern={cfg.bgPattern} color={primaryColor} />

      <div className="relative max-w-sm mx-auto px-5 py-14 pb-20 flex flex-col items-center gap-6">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full rounded-3xl px-6 py-8 flex flex-col items-center gap-3 text-center shadow-sm border"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(16px)",
            borderColor: withAlpha(primaryColor, 0.12),
          }}
        >
          {/* Avatar */}
          <div className="relative mb-1">
            <div className="absolute inset-0 scale-125 blur-xl opacity-40 rounded-full"
              style={{ background: withAlpha(primaryColor, 0.6) }} />
            {logoSrc ? (
              <img src={logoSrc} alt={tenantName}
                className="relative w-24 h-24 object-cover border-4 border-white shadow-xl"
                style={{ borderRadius: avRadius }} />
            ) : (
              <div className="relative w-24 h-24 flex items-center justify-center border-4 border-white shadow-xl"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${withAlpha(primaryColor, 0.7)})`, borderRadius: avRadius }}>
                {emoji
                  ? <span className="text-4xl">{emoji}</span>
                  : <span className="text-white text-3xl font-bold">{tenantName.charAt(0).toUpperCase()}</span>
                }
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{tenantName}</h1>
          {tagline && <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{tagline}</p>}
          {cfg.showWelcome && welcomeMsg && (
            <p className="text-sm text-gray-400 italic leading-relaxed max-w-xs">{welcomeMsg}</p>
          )}

          {/* Soft dots */}
          <div className="flex gap-2 mt-1">
            {[0.3, 1, 0.4].map((op, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ background: withAlpha(primaryColor, op) }} />
            ))}
          </div>
        </motion.div>

        {/* Links */}
        <motion.div className="w-full flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
          {/* CTA */}
          <motion.div variants={item}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="w-full flex items-center gap-3 px-6 py-4 font-bold text-base shadow-xl transition-transform active:scale-[0.97] text-left"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 8px 30px ${withAlpha(ctaColor, 0.35)}` }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2 rounded-full"><Calendar size={20} /></span>
                <span className="flex-1">{ctaText}</span>
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
                  <ChevronRight size={18} className="opacity-70" />
                </motion.span>
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="w-full flex items-center gap-3 px-6 py-4 font-bold text-base shadow-xl transition-transform active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 8px 30px ${withAlpha(ctaColor, 0.35)}`, display: "flex" }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2 rounded-full"><Calendar size={20} /></span>
                <span className="flex-1">{ctaText}</span>
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
                  <ChevronRight size={18} className="opacity-70" />
                </motion.span>
              </a>
            )}
            <div className="mt-2 text-center">
              <a href="/my-bookings" className="text-xs opacity-40 hover:opacity-70 transition-opacity text-gray-600">
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
                  background: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(12px)",
                  borderRadius: "18px",
                  border: `1px solid ${withAlpha(primaryColor, 0.1)}`,
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  color: "#1a1a1a",
                }}
              >
                <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-white shadow-sm group-hover:scale-105 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${withAlpha(primaryColor, 0.7)})` }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={16} />}
                </span>
                <span className="flex-1 font-medium text-sm">{link.title}</span>
                <ExternalLink size={13} className="opacity-25 group-hover:opacity-50 transition-opacity" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-4 flex flex-col items-center gap-1.5">
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
