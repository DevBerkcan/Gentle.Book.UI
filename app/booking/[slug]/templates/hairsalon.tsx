"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronRight, Sparkles, ExternalLink, Scissors, Circle } from "lucide-react";
import {
  lighten, withAlpha, getContrastColor, getBorderRadius,
  buildAnimVariants, INDUSTRY_EMOJI, ICON_MAP, ThemeTokenStyle,
  type TemplateProps,
} from "../_shared";

// Six "vanity bulb" dots arranged around the oval mirror avatar, pulsing in a staggered loop.
const BULB_ANGLES = [0, 60, 120, 180, 240, 300];

export function HairsalonTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const brass      = primaryColor || "#B08D57";
  const silver     = "#C9C3BC";
  const champagneBg = lighten(brass, 0.93);
  const inkText    = "#2E2824";
  const btnRadius  = getBorderRadius(cfg.buttonStyle || "pill");
  const ctaText    = cfg.ctaText?.trim() || "Styling-Termin buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily = "'Josefin Sans', sans-serif";
  const fontQuery  = "Josefin+Sans:wght@300;400;600;700";
  const ctaColor   = cfg.ctaColor ?? brass;
  const ctaTextClr = getContrastColor(ctaColor);
  const tokens = {
    "--tenant-brass": brass,
    "--tenant-silver": silver,
    "--tenant-bg": champagneBg,
    "--tenant-text": inkText,
    "--tenant-divider": withAlpha(silver, 0.35),
    "--tenant-card-border": withAlpha(silver, 0.3),
    "--tenant-avatar-ring": `linear-gradient(135deg, ${silver}, ${brass}, ${silver})`,
    "--tenant-icon-bg": `linear-gradient(135deg, ${silver}, ${brass})`,
    "--tenant-cta-bg": `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.8)})`,
    "--tenant-cta-text": ctaTextClr,
    "--tenant-cta-shadow": withAlpha(ctaColor, 0.3),
    "--tenant-cta-shadow-floating": withAlpha(ctaColor, 0.35),
  };
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--tenant-bg)", fontFamily }}>
      <ThemeTokenStyle tokens={tokens} />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>

      {/* Brushed-metal hairline texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden
        style={{ backgroundImage: `repeating-linear-gradient(115deg, ${silver} 0px, ${silver} 1px, transparent 1px, transparent 14px)` }}
      />
      {/* Mirror-glint sweep drifting across the whole page */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{ background: `linear-gradient(100deg, transparent 40%, ${withAlpha("#ffffff", 0.5)} 50%, transparent 60%)` }}
        animate={{ x: ["-30%", "130%"] }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      />

      <div className="relative max-w-sm mx-auto px-5 py-14 pb-20 flex flex-col items-center gap-6">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full rounded-3xl px-6 py-8 flex flex-col items-center gap-3 text-center"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--tenant-card-border)",
            boxShadow: `0 4px 40px ${withAlpha(brass, 0.12)}, 0 0 0 1px ${withAlpha(silver, 0.08)}`,
          }}
        >
          {/* Oval "vanity mirror" avatar with pulsing bulb-dot ring */}
          <div className="relative mb-2 w-28 h-24">
            <div className="absolute -inset-2 rounded-[50%]" style={{ background: "var(--tenant-avatar-ring)" }} />
            <div className="absolute -inset-1 rounded-[50%] bg-white" />
            {BULB_ANGLES.map((deg, i) => (
              <motion.span
                key={deg}
                className="absolute w-[5px] h-[5px] rounded-full"
                style={{
                  background: i % 2 === 0 ? silver : brass,
                  top: "50%", left: "50%",
                  transform: `rotate(${deg}deg) translate(58px) rotate(${-deg}deg)`,
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.3, ease: "easeInOut" }}
              />
            ))}
            <div className="relative overflow-hidden rounded-[50%] w-full h-full">
              {logoSrc ? (
                <Image src={logoSrc} alt={tenantName}
                  width={112} height={96} unoptimized
                  className="w-full h-full object-contain bg-white border-2 border-white" />
              ) : (
                <div className="w-full h-full flex items-center justify-center border-2 border-white"
                  style={{ background: "var(--tenant-icon-bg)" }}>
                  {emoji
                    ? <span className="text-3xl">{emoji}</span>
                    : <span className="text-white text-2xl font-bold">{tenantName.charAt(0).toUpperCase()}</span>
                  }
                </div>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold uppercase tracking-[0.08em]" style={{ color: "var(--tenant-text)", fontFamily }}>
            {tenantName}
          </h1>

          {tagline && (
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: withAlpha(inkText, 0.5), fontFamily }}>
              {tagline}
            </p>
          )}
          {cfg.showWelcome && welcomeMsg && (
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: withAlpha(inkText, 0.35) }}>{welcomeMsg}</p>
          )}

          {/* Scissors divider — idle ambient "snip" loop */}
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px flex-1" style={{ background: "var(--tenant-divider)" }} />
            <motion.span
              animate={{ rotate: [0, -14, 0, 14, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              style={{ color: withAlpha(brass, 0.7), display: "inline-flex" }}
            >
              <Scissors size={13} />
            </motion.span>
            <div className="h-px flex-1" style={{ background: "var(--tenant-divider)" }} />
          </div>
        </motion.div>

        {/* Links */}
        <motion.div className="w-full flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
          {/* CTA */}
          <motion.div variants={item}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="w-full flex items-center gap-3 px-6 py-4 font-bold text-base shadow-lg transition-all active:scale-[0.97]"
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: btnRadius, boxShadow: `0 8px 28px var(--tenant-cta-shadow)` }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2 rounded-full"><Sparkles size={18} /></span>
                <span className="flex-1 text-left" style={{ fontFamily }}>{ctaText}</span>
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                  <ChevronRight size={16} className="opacity-70" />
                </motion.span>
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="w-full flex items-center gap-3 px-6 py-4 font-bold text-base shadow-lg transition-all active:scale-[0.97]"
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: btnRadius, boxShadow: `0 8px 28px var(--tenant-cta-shadow)`, display: "flex" }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2 rounded-full"><Sparkles size={18} /></span>
                <span className="flex-1 text-left" style={{ fontFamily }}>{ctaText}</span>
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                  <ChevronRight size={16} className="opacity-70" />
                </motion.span>
              </a>
            )}
            <div className="mt-2 text-center">
              <a href="/my-bookings" className="text-xs transition-opacity hover:opacity-70" style={{ color: withAlpha(brass, 0.6) }}>
                Meine Buchungen →
              </a>
            </div>
          </motion.div>

          {/* Custom links — brass accent bar + mirror-sheen hover sweep */}
          {links.map((link) => (
            <motion.div key={link.id} variants={item}>
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="group relative w-full flex items-center gap-4 px-5 py-3.5 overflow-hidden transition-all active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(10px)",
                  borderRadius: btnRadius,
                  border: "1px solid var(--tenant-card-border)",
                  borderLeft: `3px solid ${brass}`,
                  boxShadow: `0 2px 12px ${withAlpha(brass, 0.06)}`,
                  color: "var(--tenant-text)",
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
                  style={{ background: `linear-gradient(100deg, transparent 30%, ${withAlpha("#ffffff", 0.55)} 50%, transparent 70%)` }}
                />
                <span className="relative flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-white shadow-sm"
                  style={{ background: "var(--tenant-icon-bg)" }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={15} />}
                </span>
                <span className="relative flex-1 font-semibold text-sm" style={{ fontFamily }}>{link.title}</span>
                <ExternalLink size={12} className="relative group-hover:opacity-80 transition-opacity" style={{ color: withAlpha(silver, 0.8) }} />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-4 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Circle size={6} fill={withAlpha(brass, 0.5)} style={{ color: withAlpha(brass, 0.5) }} />
            <p className="text-xs" style={{ color: withAlpha(inkText, 0.35) }}>
              Powered by <span className="font-semibold" style={{ color: "var(--tenant-brass)" }}>GentleBook</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-60 transition-opacity" style={{ color: withAlpha(inkText, 0.25) }}>Datenschutz</a>
            <span className="text-[10px]" style={{ color: withAlpha(inkText, 0.15) }}>·</span>
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-60 transition-opacity" style={{ color: withAlpha(inkText, 0.25) }}>Impressum</a>
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
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: "9999px", boxShadow: `0 8px 30px var(--tenant-cta-shadow-floating)` }}>
                <Sparkles size={16} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm shadow-2xl active:scale-95 transition-transform"
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: "9999px", boxShadow: `0 8px 30px var(--tenant-cta-shadow-floating)` }}>
                <Sparkles size={16} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
