"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Calendar, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import {
  withAlpha, getContrastColor, getBorderRadius, getAvatarRadius,
  buildAnimVariants, FONT_FAMILY, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP, ThemeTokenStyle,
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

  // A single glow formula, reused everywhere via the --tenant-glow token — previously the
  // avatar additionally stacked a second, separate pulsing blur layer on top of this; removed
  // so "neon" reads as one confident glow instead of several competing ones.
  const neonGlow = `0 0 20px ${withAlpha(primaryColor, 0.55)}, 0 0 44px ${withAlpha(primaryColor, 0.22)}`;
  const tokens = {
    "--tenant-accent": primaryColor,
    "--tenant-glow": neonGlow,
    "--tenant-glow-border": withAlpha(primaryColor, 0.5),
    "--tenant-icon-dim": withAlpha(primaryColor, 0.5),
    "--tenant-card-bg": withAlpha(primaryColor, 0.06),
    "--tenant-icon-bg": withAlpha(primaryColor, 0.2),
    "--tenant-cta-bg": `linear-gradient(135deg, ${ctaColor}, ${withAlpha(ctaColor, 0.8)})`,
    "--tenant-cta-text": ctaTextClr,
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #060614 0%, #0a0a1e 60%, #080818 100%)", fontFamily }}>
      <ThemeTokenStyle tokens={tokens} />
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
          style={{ background: "var(--tenant-accent)" }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--tenant-accent)" }} />
      </div>

      <div className="relative max-w-md mx-auto px-5 py-14 pb-20 flex flex-col items-center gap-6">

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 text-center"
        >
          {/* Avatar with a single pulsing neon ring */}
          <div className="relative">
            <motion.div
              className="absolute -inset-1 rounded-full"
              animate={{ boxShadow: [`0 0 16px ${withAlpha(primaryColor, 0.45)}, 0 0 36px ${withAlpha(primaryColor, 0.18)}`, `0 0 24px ${withAlpha(primaryColor, 0.7)}, 0 0 50px ${withAlpha(primaryColor, 0.28)}`, `0 0 16px ${withAlpha(primaryColor, 0.45)}, 0 0 36px ${withAlpha(primaryColor, 0.18)}`] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            />
            {logoSrc ? (
              <Image src={logoSrc} alt={tenantName}
                width={96}
                height={96}
                unoptimized
                className="relative w-24 h-24 object-contain bg-white border-2"
                style={{ borderRadius: avRadius, borderColor: "var(--tenant-glow-border)" }} />
            ) : (
              <div className="relative w-24 h-24 flex items-center justify-center border-2"
                style={{ background: `linear-gradient(135deg, ${withAlpha(primaryColor, 0.2)}, ${withAlpha(primaryColor, 0.05)})`, borderRadius: avRadius, borderColor: "var(--tenant-glow-border)" }}>
                {emoji
                  ? <span className="text-4xl">{emoji}</span>
                  : <span className="text-4xl font-bold" style={{ color: "var(--tenant-accent)" }}>{tenantName.charAt(0).toUpperCase()}</span>
                }
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mt-1" style={{ textShadow: "var(--tenant-glow)" }}>
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
          <div className="h-px w-20 mt-1" style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`, boxShadow: "var(--tenant-glow)" }} />
        </motion.div>

        {/* Links */}
        <motion.div className="w-full flex flex-col gap-3" variants={container} initial="hidden" animate="visible">
          {/* CTA */}
          <motion.div variants={item}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="w-full flex items-center gap-3 px-5 py-4 font-bold text-base transition-transform active:scale-[0.97]"
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: btnRadius, boxShadow: "var(--tenant-glow)" }}
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
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: btnRadius, boxShadow: "var(--tenant-glow)", display: "flex" }}
              >
                <span className="flex-shrink-0 bg-white/15 p-2" style={{ borderRadius: btnRadius }}><Calendar size={20} /></span>
                <span className="flex-1">{ctaText}</span>
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                  <ChevronRight size={18} className="opacity-70" />
                </motion.span>
              </a>
            )}
            <div className="mt-2 text-center">
              <a href="/my-bookings" className="text-xs opacity-30 hover:opacity-60 transition-opacity" style={{ color: "var(--tenant-accent)" }}>
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
                  background: "var(--tenant-card-bg)",
                  borderRadius: btnRadius,
                  border: "1px solid var(--tenant-glow-border)",
                  color: "#ffffff",
                }}
              >
                <span className="flex-shrink-0 p-2 text-white group-hover:scale-105 transition-transform"
                  style={{ background: "var(--tenant-icon-bg)", borderRadius: btnRadius, color: "var(--tenant-accent)" }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={18} />}
                </span>
                <span className="flex-1 font-semibold text-sm">{link.title}</span>
                <ExternalLink size={13} style={{ color: "var(--tenant-icon-dim)" }} className="group-hover:opacity-80 transition-opacity" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-4 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} style={{ color: "var(--tenant-icon-dim)" }} />
            <p className="text-xs text-white/30">
              Powered by <span className="font-semibold" style={{ color: "var(--tenant-accent)" }}>GentleBook</span>
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
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: "9999px", boxShadow: "var(--tenant-glow)" }}>
                <Calendar size={16} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm active:scale-95 transition-transform"
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: "9999px", boxShadow: "var(--tenant-glow)" }}>
                <Calendar size={16} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
