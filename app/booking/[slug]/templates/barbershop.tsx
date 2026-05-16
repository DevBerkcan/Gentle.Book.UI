"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, Sparkles, ExternalLink, Scissors } from "lucide-react";
import {
  withAlpha, getContrastColor, getBorderRadius, getAvatarRadius,
  buildAnimVariants, FONT_FAMILY, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP,
  type TemplateProps,
} from "../_shared";

export function BarbershopTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const accent     = primaryColor || "#8B1A1A";
  const gold       = "#C9A84C";
  const cream      = "#FAF7F2";
  const darkBrown  = "#2C1A0E";
  const btnRadius  = getBorderRadius(cfg.buttonStyle || "rounded");
  const avRadius   = "9999px";
  const ctaText    = cfg.ctaText?.trim() || "Termin buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily = "'Playfair Display', Georgia, serif";
  const fontQuery  = "Playfair+Display:wght@400;600;700;900";
  const ctaColor   = cfg.ctaColor ?? accent;
  const ctaTextClr = getContrastColor(ctaColor);
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  return (
    <div className="min-h-screen" style={{ background: cream, fontFamily }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>

      {/* Barber stripe background pattern — subtle diagonal */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]" aria-hidden
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            ${accent} 0px,
            ${accent} 8px,
            ${cream} 8px,
            ${cream} 24px,
            #1a3a6b 24px,
            #1a3a6b 32px,
            ${cream} 32px,
            ${cream} 48px
          )`,
        }}
      />

      {/* Top header strip */}
      <div className="relative" style={{ background: darkBrown }}>
        <div className="max-w-sm mx-auto px-5 py-3 flex items-center justify-center gap-2">
          <div className="h-px flex-1" style={{ background: withAlpha(gold, 0.4) }} />
          {/* Animated barber pole */}
          <div className="relative w-5 h-5 rounded-sm overflow-hidden flex-shrink-0" style={{ border: `1px solid ${withAlpha(gold, 0.5)}` }}>
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 4px, white 4px, white 8px, #1a3a6b 8px, #1a3a6b 12px, white 12px, white 16px)`,
                backgroundSize: "24px 24px",
              }}
              animate={{ backgroundPosition: ["0% 0%", "0% 100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold" style={{ color: gold }}>
            Est. 2024
          </span>
          <div className="relative w-5 h-5 rounded-sm overflow-hidden flex-shrink-0" style={{ border: `1px solid ${withAlpha(gold, 0.5)}` }}>
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 4px, white 4px, white 8px, #1a3a6b 8px, #1a3a6b 12px, white 12px, white 16px)`,
                backgroundSize: "24px 24px",
              }}
              animate={{ backgroundPosition: ["0% 0%", "0% 100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>
          <div className="h-px flex-1" style={{ background: withAlpha(gold, 0.4) }} />
        </div>
      </div>

      <div className="relative max-w-sm mx-auto px-5 py-10 pb-20 flex flex-col items-center gap-6">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center gap-4 text-center"
        >
          {/* Avatar with gold ring */}
          <div className="relative">
            <div className="absolute -inset-1.5 rounded-full" style={{ background: `linear-gradient(135deg, ${gold}, #e8c97a, ${gold})` }} />
            <div className="absolute -inset-0.5 rounded-full bg-white" />
            {logoSrc ? (
              <img src={logoSrc} alt={tenantName}
                className="relative w-28 h-28 object-cover rounded-full border-4 border-white" />
            ) : (
              <div className="relative w-28 h-28 rounded-full flex items-center justify-center border-4 border-white"
                style={{ background: `linear-gradient(135deg, ${accent}, ${withAlpha(accent, 0.7)})` }}>
                {emoji
                  ? <span className="text-4xl">{emoji}</span>
                  : <span className="text-white text-4xl font-black">{tenantName.charAt(0).toUpperCase()}</span>
                }
              </div>
            )}
          </div>

          {/* Name with ornament — stamp entrance */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-px w-8" style={{ background: withAlpha(gold, 0.5) }} />
              <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: withAlpha(accent, 0.5) }}>The</span>
              <div className="h-px w-8" style={{ background: withAlpha(gold, 0.5) }} />
            </div>
            <motion.h1
              className="text-3xl font-black text-center"
              style={{ color: darkBrown, fontFamily, lineHeight: 1.1 }}
              initial={{ scale: 1.3, rotate: 2, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            >
              {tenantName}
            </motion.h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px w-12" style={{ background: withAlpha(gold, 0.5) }} />
              <Sparkles size={10} style={{ color: gold }} />
              <div className="h-px w-12" style={{ background: withAlpha(gold, 0.5) }} />
            </div>
          </div>

          {tagline && (
            <p className="text-sm italic leading-relaxed max-w-xs" style={{ color: withAlpha(darkBrown, 0.55), fontFamily }}>
              "{tagline}"
            </p>
          )}
          {cfg.showWelcome && welcomeMsg && (
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: withAlpha(darkBrown, 0.4) }}>{welcomeMsg}</p>
          )}
        </motion.div>

        {/* Links */}
        <motion.div className="w-full flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
          {/* CTA */}
          <motion.div variants={item}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="w-full flex items-center gap-3 px-6 py-4 font-bold text-base shadow-lg transition-all active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 6px 20px ${withAlpha(ctaColor, 0.3)}` }}
              >
                <Scissors size={18} className="flex-shrink-0" />
                <span className="flex-1 text-left" style={{ fontFamily }}>{ctaText}</span>
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <ChevronRight size={16} className="opacity-70" />
                </motion.span>
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="w-full flex items-center gap-3 px-6 py-4 font-bold text-base shadow-lg transition-all active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.85)})`, color: ctaTextClr, borderRadius: btnRadius, boxShadow: `0 6px 20px ${withAlpha(ctaColor, 0.3)}`, display: "flex" }}
              >
                <Scissors size={18} className="flex-shrink-0" />
                <span className="flex-1 text-left" style={{ fontFamily }}>{ctaText}</span>
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <ChevronRight size={16} className="opacity-70" />
                </motion.span>
              </a>
            )}
            <div className="mt-2 text-center">
              <a href="/my-bookings" className="text-xs italic transition-opacity hover:opacity-70" style={{ color: withAlpha(darkBrown, 0.35) }}>
                Meine Buchungen →
              </a>
            </div>
          </motion.div>

          {/* Custom links */}
          {links.map((link) => (
            <motion.div key={link.id} variants={item} whileHover={{ scale: 1.01, x: 4 }}>
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="group w-full flex items-center gap-4 px-5 py-3.5 transition-all active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  borderRadius: btnRadius,
                  border: `1px solid ${withAlpha(gold, 0.3)}`,
                  boxShadow: "0 2px 8px rgba(44,26,14,0.06)",
                  color: darkBrown,
                }}
              >
                <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${withAlpha(accent, 0.8)})` }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={16} />}
                </span>
                <span className="flex-1 font-semibold text-sm" style={{ fontFamily }}>{link.title}</span>
                <ExternalLink size={12} style={{ color: withAlpha(gold, 0.5) }} className="group-hover:opacity-80 transition-opacity" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-4 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} style={{ color: gold }} />
            <p className="text-xs italic" style={{ color: withAlpha(darkBrown, 0.35) }}>
              Powered by <span className="font-semibold not-italic" style={{ color: accent }}>GentleBook</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-60 transition-opacity" style={{ color: withAlpha(darkBrown, 0.25) }}>Datenschutz</a>
            <span className="text-[10px]" style={{ color: withAlpha(darkBrown, 0.15) }}>·</span>
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-60 transition-opacity" style={{ color: withAlpha(darkBrown, 0.25) }}>Impressum</a>
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
