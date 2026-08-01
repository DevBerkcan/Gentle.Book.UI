"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Calendar, ChevronRight, Sparkles, ExternalLink } from "lucide-react";
import {
  withAlpha, getThemeConfig, buildThemeTokens, ThemeTokenStyle,
  buildAnimVariants, FONT_QUERY, INDUSTRY_EMOJI, ICON_MAP,
  BgPattern, TiltCard, type TemplateProps,
} from "../_shared";

export function ClassicTemplate({
  slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
  linktreeStyle, industryType, cfg, links, handleCtaClick, showFloating,
}: TemplateProps) {
  const tokens      = buildThemeTokens(linktreeStyle as any, primaryColor, cfg);
  // getThemeConfig is still used directly for glow/blur — render-behavior flags, not style
  // values, so they don't belong in the CSS-var token map.
  const t           = getThemeConfig(linktreeStyle as any, primaryColor);
  const ctaText     = cfg.ctaText?.trim() || "Termin buchen";
  const emoji       = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;
  const fontQuery   = cfg.fontFamily && cfg.fontFamily !== "inter" ? FONT_QUERY[cfg.fontFamily] : null;
  const resolvedAnimSpeed = cfg.motionIntensity === "off"
    ? "none"
    : cfg.motionIntensity === "strong"
    ? "fast"
    : cfg.animationSpeed;
  const { container, item: itemVariant } = buildAnimVariants(resolvedAnimSpeed);
  const isGrid      = cfg.layoutMode === "grid";
  const avatarSize  = cfg.mediaScale === "lg" ? "w-28 h-28" : cfg.mediaScale === "sm" ? "w-16 h-16" : "w-20 h-20";
  const avatarText  = cfg.mediaScale === "lg" ? "text-5xl" : cfg.mediaScale === "sm" ? "text-2xl" : "text-3xl";
  const heroGap     = cfg.heroStyle === "immersive" ? "gap-7 py-16" : cfg.heroStyle === "editorial" ? "gap-6 py-14" : "gap-5 py-14";
  const buttonPad   = cfg.buttonSpacing === "airy" ? "px-6 py-5" : cfg.buttonSpacing === "tight" ? "px-4 py-3" : "px-5 py-4";
  const cardPad     = cfg.cardDensity === "airy" ? "px-5 py-5" : cfg.cardDensity === "tight" ? "px-3 py-3" : "px-5 py-4";
  const gridCardPad = cfg.cardDensity === "airy" ? "px-4 py-6" : cfg.cardDensity === "tight" ? "px-3 py-4" : "px-3 py-5";
  const linkGap     = cfg.cardDensity === "tight" ? "gap-2" : cfg.cardDensity === "airy" ? "gap-4" : "gap-3";
  const showProfileFirst = (cfg.startFocus ?? "logo") === "logo";
  const showCtaFirst = cfg.startFocus === "cta";
  const showLinksFirst = cfg.startFocus === "links";

  return (
    <div className="min-h-screen" style={{ background: "var(--tenant-bg)", fontFamily: "var(--tenant-font)" }}>
      <ThemeTokenStyle tokens={tokens} />

      {/* ── Google Fonts inject ── */}
      {fontQuery && (
        <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap');`}</style>
      )}

      {/* ── CTA Shimmer CSS ── */}
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(250%)} }
        .cta-shimmer { position: relative; overflow: hidden; }
        .cta-shimmer::after { content:''; position:absolute; top:0; left:0; width:35%; height:100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          animation: shimmer 2.8s infinite; pointer-events:none; }
      `}</style>

      {/* ── Background pattern ── */}
      <BgPattern pattern={cfg.bgPattern} color={primaryColor} />

      {/* ── Decorative glow blobs ── */}
      {t.glow && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-25 blur-3xl" style={{ background: primaryColor }} />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl"  style={{ background: primaryColor }} />
          {linktreeStyle === "dark" && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: primaryColor }} />
          )}
        </div>
      )}

      <div className={`relative max-w-md mx-auto px-4 pb-16 flex flex-col items-center ${heroGap}`}>

        {/* ── Profile ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex flex-col items-center gap-3 text-center ${showProfileFirst ? "order-1" : showCtaFirst ? "order-2" : "order-3"}`}
        >
          {/* Avatar */}
          <div className="relative">
            {t.glow && (
              <div className="absolute inset-0 blur-xl opacity-50 scale-125" style={{ background: primaryColor, borderRadius: "var(--tenant-radius-avatar)" }} />
            )}
            {logoSrc ? (
              <Image src={logoSrc} alt={tenantName}
                width={128}
                height={128}
                unoptimized
                className={`relative ${avatarSize} object-contain shadow-2xl border-4 bg-white`}
                style={{ borderRadius: "var(--tenant-radius-avatar)", borderColor: "var(--tenant-avatar-border)", padding: '6px' }} />
            ) : (
              <div className={`relative ${avatarSize} flex items-center justify-center shadow-2xl border-4`}
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${withAlpha(primaryColor, 0.7)})`, borderRadius: "var(--tenant-radius-avatar)", borderColor: "var(--tenant-avatar-border)" }}>
                {emoji
                  ? <span className={`${avatarText} leading-none`}>{emoji}</span>
                  : <span className={`text-white ${avatarText} font-bold`}>{tenantName.charAt(0).toUpperCase()}</span>
                }
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <h1 className="text-2xl font-bold mt-1" style={{ color: linktreeStyle === "bold" ? "#fff" : "var(--tenant-text-primary)" }}>
              {tenantName}
            </h1>
            {tagline && (
              <p className="text-sm mt-1.5 max-w-xs leading-relaxed" style={{ color: "var(--tenant-tagline)" }}>
                {tagline}
              </p>
            )}
            {cfg.showWelcome && welcomeMsg && (
              <p className="text-sm max-w-xs text-center leading-relaxed mt-2 italic" style={{ color: "var(--tenant-tagline)" }}>
                {welcomeMsg}
              </p>
            )}
          </div>

          {/* Decorative dots */}
          <div className="flex gap-1.5 mt-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: i === 1 ? primaryColor : withAlpha(primaryColor, 0.4) }} />
            ))}
          </div>
        </motion.div>

        {/* ── Links ── */}
        <motion.div
          className={`w-full mt-1 ${isGrid ? `grid grid-cols-1 ${linkGap}` : `flex flex-col ${linkGap}`} ${showCtaFirst ? "order-1" : showLinksFirst ? "order-1" : "order-2"}`}
          variants={container} initial="hidden" animate="visible"
        >
          {/* Booking CTA — always full width */}
          <motion.div variants={itemVariant} className={`col-span-full ${showLinksFirst ? "order-2" : "order-1"}`}>
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className={`cta-shimmer group w-full flex items-center gap-3 ${buttonPad} font-bold text-base shadow-xl transition-transform active:scale-[0.97] text-left`}
                style={{ background: "var(--tenant-cta-bg)", boxShadow: `0 8px 30px var(--tenant-cta-shadow)`, color: "var(--tenant-cta-text)", borderRadius: "var(--tenant-radius-button)" }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2 group-hover:bg-white/30 transition-colors" style={{ borderRadius: "var(--tenant-radius-button)" }}>
                  <Calendar size={20} />
                </span>
                <span className="flex-1">{ctaText}</span>
                <motion.span className="opacity-70" animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
                  <ChevronRight size={18} />
                </motion.span>
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className={`cta-shimmer group w-full flex items-center gap-3 ${buttonPad} font-bold text-base shadow-xl transition-transform active:scale-[0.97]`}
                style={{ background: "var(--tenant-cta-bg)", boxShadow: `0 8px 30px var(--tenant-cta-shadow)`, color: "var(--tenant-cta-text)", borderRadius: "var(--tenant-radius-button)", display: "flex" }}
              >
                <span className="flex-shrink-0 bg-white/20 p-2 group-hover:bg-white/30 transition-colors" style={{ borderRadius: "var(--tenant-radius-button)" }}>
                  <Calendar size={20} />
                </span>
                <span className="flex-1">{ctaText}</span>
                <motion.span className="opacity-70" animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}>
                  <ChevronRight size={18} />
                </motion.span>
              </a>
            )}
            <div className="mt-2 text-center">
              <a
                href="/my-bookings"
                className="text-xs opacity-50 hover:opacity-80 transition-opacity"
                style={{ color: "var(--tenant-text-primary)" }}
              >
                Meine Buchungen anzeigen →
              </a>
            </div>
          </motion.div>

          {/* Custom links — list or grid */}
          {isGrid ? (
            <div className={`grid grid-cols-2 ${linkGap} ${showLinksFirst ? "order-1" : "order-2"}`}>
              {links.map((link) => (
                <motion.div key={link.id} variants={itemVariant}>
                  <TiltCard>
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-2.5 ${gridCardPad} font-semibold text-sm text-center active:scale-[0.97] transition-all w-full`}
                      style={{ background: "var(--tenant-card-bg)", border: "var(--tenant-card-border)", borderRadius: "var(--tenant-radius-button)", backdropFilter: t.blur ? "blur(16px)" : undefined, WebkitBackdropFilter: t.blur ? "blur(16px)" : undefined }}
                    >
                      <span className="p-2.5 rounded-xl text-white" style={{ background: "var(--tenant-icon-bg)", borderRadius: "var(--tenant-radius-button)" }}>
                        {ICON_MAP[link.iconType] ?? <ExternalLink size={20} />}
                      </span>
                      <span style={{ color: "var(--tenant-text-primary)" }}>{link.title}</span>
                    </a>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`flex flex-col ${linkGap} ${showLinksFirst ? "order-1" : "order-2"}`}>
            {links.map((link) => (
              <motion.div key={link.id} variants={itemVariant}>
                <TiltCard>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`group w-full flex items-center gap-3 ${cardPad} font-semibold text-base active:scale-[0.97] transition-all`}
                    style={{ background: "var(--tenant-card-bg)", border: "var(--tenant-card-border)", borderRadius: "var(--tenant-radius-button)", backdropFilter: t.blur ? "blur(16px)" : undefined, WebkitBackdropFilter: t.blur ? "blur(16px)" : undefined, color: "var(--tenant-text-secondary)", boxShadow: "var(--tenant-card-shadow)" }}
                  >
                    <span className="flex-shrink-0 p-2 text-white transition-transform group-hover:scale-105" style={{ background: "var(--tenant-icon-bg)", borderRadius: "var(--tenant-radius-button)" }}>
                      {ICON_MAP[link.iconType] ?? <ExternalLink size={20} />}
                    </span>
                    <span className="flex-1" style={{ color: "var(--tenant-text-primary)" }}>{link.title}</span>
                    <ExternalLink size={14} style={{ color: withAlpha("#888888", 0.5) }} className="group-hover:opacity-80 transition-opacity" />
                  </a>
                </TiltCard>
              </motion.div>
            ))}
            </div>
          )}
        </motion.div>

        {/* ── Footer ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-6 space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} style={{ color: withAlpha(primaryColor, 0.5) }} />
            <p className="text-xs" style={{ color: "var(--tenant-footer)" }}>
              Powered by <span className="font-semibold" style={{ color: primaryColor }}>GentleBook</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-80 transition-opacity" style={{ color: "var(--tenant-footer)" }}>Datenschutz</a>
            <span className="text-[10px]" style={{ color: withAlpha(t.footerCl, 0.4) }}>·</span>
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:opacity-80 transition-opacity" style={{ color: "var(--tenant-footer)" }}>Impressum</a>
          </div>
        </motion.div>
      </div>

      {/* ── Floating CTA pill ── */}
      <AnimatePresence>
        {showFloating && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none"
          >
            {cfg.confetti ? (
              <button onClick={handleCtaClick}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm shadow-2xl active:scale-95 transition-transform"
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: "9999px", boxShadow: `0 8px 32px var(--tenant-cta-shadow)` }}
              >
                <Calendar size={16} />{ctaText}
              </button>
            ) : (
              <a href={`/booking/${slug}/book`}
                className="pointer-events-auto flex items-center gap-2.5 px-7 py-3.5 font-bold text-sm shadow-2xl active:scale-95 transition-transform"
                style={{ background: "var(--tenant-cta-bg)", color: "var(--tenant-cta-text)", borderRadius: "9999px", boxShadow: `0 8px 32px var(--tenant-cta-shadow)` }}
              >
                <Calendar size={16} />{ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
