"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Calendar, ChevronRight, Sparkles, ExternalLink, Star } from "lucide-react";
import {
  lighten, withAlpha, getContrastColor, getBorderRadius,
  buildAnimVariants, INDUSTRY_EMOJI, ICON_MAP, ThemeTokenStyle,
  type TemplateProps,
} from "../_shared";

export function BeautyTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const rose       = primaryColor || "#D4847A";
  const gold       = "#C9A84C";
  const roseLighter = lighten(rose, 0.94);
  const btnRadius  = getBorderRadius(cfg.buttonStyle || "pill");
  const ctaText    = cfg.ctaText?.trim() || "Termin buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontFamily = "'Playfair Display', Georgia, serif";
  const fontQuery  = "Playfair+Display:ital,wght@0,400;0,600;0,700;1,400";
  const ctaColor   = cfg.ctaColor ?? rose;
  const ctaTextClr = getContrastColor(ctaColor);
  const tokens = {
    "--tenant-rose": rose,
    "--tenant-gold": gold,
    "--tenant-bg": roseLighter,
    "--tenant-text": "#2d1a15",
    "--tenant-divider": withAlpha(gold, 0.25),
    "--tenant-card-border": withAlpha(gold, 0.2),
    "--tenant-avatar-ring": `linear-gradient(135deg, ${gold}, ${withAlpha(rose, 0.6)})`,
    "--tenant-icon-bg": `linear-gradient(135deg, ${rose}, ${withAlpha(rose, 0.7)})`,
    "--tenant-cta-bg": `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.8)})`,
    "--tenant-cta-text": ctaTextClr,
    "--tenant-cta-shadow": withAlpha(ctaColor, 0.35),
    "--tenant-cta-shadow-floating": withAlpha(ctaColor, 0.4),
  };
  const { container, item } = buildAnimVariants(cfg.animationSpeed);

  return (
    <div className="min-h-screen" style={{ background: "var(--tenant-bg)", fontFamily }}>
      <ThemeTokenStyle tokens={tokens} />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>

      {/* Soft gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30 blur-3xl"
          style={{ background: `linear-gradient(135deg, ${rose}, ${withAlpha(gold, 0.3)})` }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--tenant-rose)" }} />
      </div>

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
            boxShadow: `0 4px 40px ${withAlpha(rose, 0.12)}, 0 0 0 1px ${withAlpha(gold, 0.06)}`,
          }}
        >
          {/* Avatar with a soft rose/gold ring — a single static accent instead of a
              continuously spinning conic-gradient ring layered under a shimmer sweep */}
          <div className="relative mb-1">
            <div className="absolute -inset-2 rounded-full opacity-80" style={{ background: "var(--tenant-avatar-ring)" }} />
            <div className="absolute -inset-1 rounded-full bg-white" />
            <div className="relative overflow-hidden rounded-full">
              {logoSrc ? (
                <Image src={logoSrc} alt={tenantName}
                  width={96}
                  height={96}
                  unoptimized
                  className="w-24 h-24 object-contain bg-white rounded-full border-2 border-white" />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-white"
                  style={{ background: "var(--tenant-icon-bg)" }}>
                  {emoji
                    ? <span className="text-4xl">{emoji}</span>
                    : <span className="text-white text-3xl font-bold">{tenantName.charAt(0).toUpperCase()}</span>
                  }
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--tenant-text)", fontFamily }}>
              {tenantName}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={9} fill={gold} style={{ color: "var(--tenant-gold)" }} />
              ))}
            </div>
          </div>

          {tagline && (
            <p className="text-sm italic leading-relaxed max-w-xs" style={{ color: withAlpha("#2d1a15", 0.5), fontFamily }}>
              {tagline}
            </p>
          )}
          {cfg.showWelcome && welcomeMsg && (
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: withAlpha("#2d1a15", 0.35) }}>{welcomeMsg}</p>
          )}

          {/* Rose petal divider */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="h-px flex-1" style={{ background: "var(--tenant-divider)" }} />
            <span className="text-sm" style={{ color: withAlpha(rose, 0.5) }}>✿</span>
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
                <span className="flex-shrink-0 bg-white/20 p-2 rounded-full"><Calendar size={18} /></span>
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
                <span className="flex-shrink-0 bg-white/20 p-2 rounded-full"><Calendar size={18} /></span>
                <span className="flex-1 text-left" style={{ fontFamily }}>{ctaText}</span>
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                  <ChevronRight size={16} className="opacity-70" />
                </motion.span>
              </a>
            )}
            <div className="mt-2 text-center">
              <a href="/my-bookings" className="text-xs italic transition-opacity hover:opacity-70" style={{ color: withAlpha(rose, 0.5) }}>
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
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(10px)",
                  borderRadius: btnRadius,
                  border: "1px solid var(--tenant-card-border)",
                  boxShadow: `0 2px 12px ${withAlpha(rose, 0.06)}`,
                  color: "var(--tenant-text)",
                }}
              >
                <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-white shadow-sm"
                  style={{ background: "var(--tenant-icon-bg)" }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={15} />}
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
            <Star size={9} fill={withAlpha(gold, 0.5)} style={{ color: withAlpha(gold, 0.5) }} />
            <p className="text-xs italic" style={{ color: withAlpha("#2d1a15", 0.35) }}>
              Powered by <span className="font-semibold not-italic" style={{ color: "var(--tenant-rose)" }}>GentleBook</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-60 transition-opacity" style={{ color: withAlpha("#2d1a15", 0.25) }}>Datenschutz</a>
            <span className="text-[10px]" style={{ color: withAlpha("#2d1a15", 0.15) }}>·</span>
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-60 transition-opacity" style={{ color: withAlpha("#2d1a15", 0.25) }}>Impressum</a>
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
                <Calendar size={16} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm shadow-2xl active:scale-95 transition-transform"
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: "9999px", boxShadow: `0 8px 30px var(--tenant-cta-shadow-floating)` }}>
                <Calendar size={16} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
