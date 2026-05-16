"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, ExternalLink, ArrowRight } from "lucide-react";
import {
  withAlpha, getContrastColor, getAvatarRadius,
  buildAnimVariants, INDUSTRY_EMOJI, ICON_MAP,
  type TemplateProps,
} from "../_shared";

export function CorporateTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const accent     = primaryColor || "#1B2A4A";
  const btnRadius  = "8px";
  const avRadius   = getAvatarRadius(cfg.avatarShape || "square");
  const ctaText    = cfg.ctaText?.trim() || "Termin vereinbaren";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const sansFam    = "'Inter', 'Helvetica Neue', Arial, sans-serif";
  const ctaColor   = cfg.ctaColor ?? accent;
  const ctaTextClr = getContrastColor(ctaColor);
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: sansFam }}>

      {/* Top accent line — draws in on load */}
      <div className="h-1 w-full overflow-hidden" style={{ background: withAlpha(accent, 0.12) }}>
        <motion.div
          className="h-full"
          style={{ background: accent }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-sm mx-auto px-6 py-5 flex items-center gap-4">
          {/* Avatar — small, square */}
          {logoSrc ? (
            <img src={logoSrc} alt={tenantName}
              className="w-12 h-12 object-cover flex-shrink-0 border border-gray-200"
              style={{ borderRadius: avRadius }} />
          ) : (
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-gray-200"
              style={{ background: accent, borderRadius: avRadius }}>
              {emoji
                ? <span className="text-xl">{emoji}</span>
                : <span className="text-white text-lg font-bold">{tenantName.charAt(0).toUpperCase()}</span>
              }
            </div>
          )}

          <div className="flex-1 min-w-0">
            <motion.h1
              className="text-base font-semibold uppercase tracking-widest truncate"
              style={{ color: accent, letterSpacing: "0.12em" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {tenantName}
            </motion.h1>
            {tagline && (
              <motion.p
                className="text-xs text-gray-400 mt-0.5 truncate"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                {tagline}
              </motion.p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-6 py-8 pb-24 flex flex-col gap-4">

        {/* Welcome message */}
        {cfg.showWelcome && welcomeMsg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-white border border-gray-100 rounded-lg px-5 py-4"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <p className="text-xs leading-relaxed text-gray-500">{welcomeMsg}</p>
          </motion.div>
        )}

        {/* Divider label */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex items-center gap-3"
        >
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Terminbuchung</span>
          <div className="flex-1 h-px bg-gray-200" />
        </motion.div>

        {/* Links */}
        <motion.div className="flex flex-col gap-2.5" variants={container} initial="hidden" animate="visible">

          {/* CTA */}
          <motion.div variants={item}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="w-full flex items-center gap-3 px-5 py-4 font-semibold text-sm transition-all active:scale-[0.98] hover:opacity-90"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 2px 12px ${withAlpha(ctaColor, 0.25)}` }}
              >
                <Calendar size={16} className="flex-shrink-0" />
                <span className="flex-1 text-left tracking-wide">{ctaText}</span>
                <ArrowRight size={15} className="opacity-60" />
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="w-full flex items-center gap-3 px-5 py-4 font-semibold text-sm transition-all active:scale-[0.98] hover:opacity-90"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 2px 12px ${withAlpha(ctaColor, 0.25)}`, display: "flex" }}
              >
                <Calendar size={16} className="flex-shrink-0" />
                <span className="flex-1 text-left tracking-wide">{ctaText}</span>
                <ArrowRight size={15} className="opacity-60" />
              </a>
            )}
            <a href="/my-bookings"
              className="block text-center text-[11px] mt-2 transition-opacity hover:opacity-70 tracking-wide text-gray-400">
              Meine Buchungen →
            </a>
          </motion.div>

          {/* Divider before custom links */}
          {links.length > 0 && (
            <motion.div variants={item} className="h-px bg-gray-100 my-1" />
          )}

          {/* Custom links */}
          {links.map((link) => (
            <motion.div key={link.id} variants={item} whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="group w-full flex items-center gap-3 px-5 py-3.5 bg-white transition-all active:scale-[0.98] hover:shadow-md"
                style={{
                  borderRadius: btnRadius,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  color: "#1a1a1a",
                }}
              >
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white"
                  style={{ background: accent, borderRadius: "6px" }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={14} />}
                </span>
                <span className="flex-1 font-medium text-sm text-gray-700">{link.title}</span>
                <ExternalLink size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-6 flex flex-col items-center gap-1.5">
          <p className="text-[10px] text-gray-300 tracking-wider uppercase">
            Powered by <span className="font-semibold" style={{ color: withAlpha(accent, 0.5) }}>GentleBook</span>
          </p>
          <div className="flex items-center gap-3">
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-300 hover:opacity-60">Datenschutz</a>
            <span className="text-[10px] text-gray-200">·</span>
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-300 hover:opacity-60">Impressum</a>
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
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-semibold text-sm shadow-xl active:scale-95 transition-transform tracking-wide"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "8px", boxShadow: `0 6px 24px ${withAlpha(ctaColor, 0.35)}` }}>
                <Calendar size={15} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-semibold text-sm shadow-xl active:scale-95 transition-transform tracking-wide"
                style={{ background: ctaColor, color: ctaTextClr, borderRadius: "8px", boxShadow: `0 6px 24px ${withAlpha(ctaColor, 0.35)}` }}>
                <Calendar size={15} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
