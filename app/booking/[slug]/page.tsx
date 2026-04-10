"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar, Instagram, MessageCircle, MapPin, Facebook, Youtube,
  Globe, Phone, Mail, ExternalLink, Loader2, ChevronRight, Sparkles,
} from "lucide-react";
import { getTenantInfo, getTenantLinks, type TenantLink } from "@/lib/api/booking";

// ── Icon Map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  Booking:    <Calendar size={20} />,
  Instagram:  <Instagram size={20} />,
  WhatsApp:   <MessageCircle size={20} />,
  GoogleMaps: <MapPin size={20} />,
  Facebook:   <Facebook size={20} />,
  TikTok:     <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>,
  YouTube:    <Youtube size={20} />,
  Website:    <Globe size={20} />,
  Phone:      <Phone size={20} />,
  Email:      <Mail size={20} />,
  Custom:     <ExternalLink size={20} />,
};

// ── Industry Emoji Map ────────────────────────────────────────────────────────
const INDUSTRY_EMOJI: Record<string, string> = {
  Hairdresser: "✂️",
  Beauty:      "💄",
  Barbershop:  "🪒",
  Massage:     "💆",
  Nail:        "💅",
  Physio:      "🏋️",
  Tattoo:      "🎨",
  Other:       "📅",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function lighten(hex: string, amount = 0.85) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
  } catch { return "#F5EDEB"; }
}
function withAlpha(hex: string, alpha: number) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return hex; }
}

// ── Button radius from buttonStyle ────────────────────────────────────────────
function getBorderRadius(style?: string) {
  if (style === "pill")   return "9999px";
  if (style === "square") return "4px";
  return "16px"; // rounded (default)
}

// ── Background Pattern SVG/CSS ────────────────────────────────────────────────
function getBgPattern(pattern?: string, color?: string): React.ReactNode {
  if (!pattern || pattern === "none") return null;
  const c = color ? withAlpha(color, 0.08) : "rgba(0,0,0,0.06)";
  const c2 = color ? withAlpha(color, 0.05) : "rgba(0,0,0,0.04)";

  if (pattern === "dots") {
    return (
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle, ${c} 1.5px, transparent 1.5px)`,
          backgroundSize: "28px 28px",
        }}
      />
    );
  }
  if (pattern === "grid") {
    return (
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />
    );
  }
  if (pattern === "waves") {
    return (
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="waves" x="0" y="0" width="120" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 20 Q30 5 60 20 Q90 35 120 20" fill="none" stroke={c} strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#waves)" />
      </svg>
    );
  }
  if (pattern === "circles") {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[10%] right-[5%]  w-72 h-72 rounded-full" style={{ background: c }} />
        <div className="absolute bottom-[15%] left-[8%] w-56 h-56 rounded-full" style={{ background: c2 }} />
        <div className="absolute top-[55%] left-[60%]  w-40 h-40 rounded-full" style={{ background: c }} />
      </div>
    );
  }
  return null;
}

// ── Animation Variants ────────────────────────────────────────────────────────
const stagger  = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } };
const slideUp  = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } } };
const fadeIn   = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.45 } } };
const popIn    = { hidden: { opacity: 0, scale: 0.88 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 320, damping: 20 } } };
const blurIn   = { hidden: { opacity: 0, filter: "blur(8px)" }, visible: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.5 } } };

// ── Theme Definitions ─────────────────────────────────────────────────────────
type Theme = "gradient" | "dark" | "minimal" | "bold" | "glass";

function getThemeConfig(theme: Theme, primary: string) {
  const light    = lighten(primary, 0.88);
  const mid      = lighten(primary, 0.65);
  const alpha20  = withAlpha(primary, 0.2);
  const alpha50  = withAlpha(primary, 0.5);

  switch (theme) {
    case "dark":
      return {
        bg: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
        cardBg: "rgba(255,255,255,0.06)", cardBorder: "rgba(255,255,255,0.1)", cardHover: "rgba(255,255,255,0.1)",
        textPrimary: "#ffffff", textSecondary: "rgba(255,255,255,0.55)", taglineCl: "rgba(255,255,255,0.5)", footerCl: "rgba(255,255,255,0.25)",
        iconBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.7)})`,
        ctaBg: `linear-gradient(135deg, ${primary} 0%, ${withAlpha(primary, 0.8)} 100%)`,
        ctaShadow: withAlpha(primary, 0.4), avatarBorder: "rgba(255,255,255,0.15)",
        itemVariant: slideUp, glow: true,
      };
    case "minimal":
      return {
        bg: "#ffffff",
        cardBg: "#ffffff", cardBorder: "#f0f0f0", cardHover: "#fafafa",
        textPrimary: "#111111", textSecondary: "#333333", taglineCl: "#888888", footerCl: "#cccccc",
        iconBg: primary, ctaBg: primary, ctaShadow: alpha20, avatarBorder: "#f0f0f0",
        itemVariant: fadeIn, glow: false,
      };
    case "bold":
      return {
        bg: `linear-gradient(160deg, ${primary} 0%, ${mid} 100%)`,
        cardBg: "rgba(255,255,255,0.92)", cardBorder: "rgba(255,255,255,0.6)", cardHover: "#ffffff",
        textPrimary: "#1a1a1a", textSecondary: "#333333", taglineCl: "rgba(255,255,255,0.85)", footerCl: "rgba(255,255,255,0.5)",
        iconBg: primary, ctaBg: "#ffffff", ctaShadow: "rgba(0,0,0,0.2)", avatarBorder: "rgba(255,255,255,0.8)",
        ctaTextColor: primary, itemVariant: popIn, glow: false,
      };
    case "glass":
      return {
        bg: `linear-gradient(135deg, ${lighten(primary, 0.5)} 0%, ${lighten(primary, 0.7)} 40%, ${lighten(primary, 0.4)} 100%)`,
        cardBg: "rgba(255,255,255,0.45)", cardBorder: "rgba(255,255,255,0.7)", cardHover: "rgba(255,255,255,0.65)",
        textPrimary: "#1a1a1a", textSecondary: "#333333", taglineCl: "#555555", footerCl: "rgba(0,0,0,0.35)",
        iconBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.75)})`,
        ctaBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.85)})`,
        ctaShadow: alpha50, avatarBorder: "rgba(255,255,255,0.9)",
        itemVariant: blurIn, glow: true, blur: true,
      };
    default: // gradient
      return {
        bg: `linear-gradient(160deg, ${light} 0%, #ffffff 55%, ${lighten(primary, 0.72)} 100%)`,
        cardBg: "rgba(255,255,255,0.85)", cardBorder: "rgba(255,255,255,0.9)", cardHover: "#ffffff",
        textPrimary: "#1a1a1a", textSecondary: "#333333", taglineCl: "#777777", footerCl: "#cccccc",
        iconBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.75)})`,
        ctaBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.8)})`,
        ctaShadow: withAlpha(primary, 0.35), avatarBorder: "#ffffff",
        itemVariant: slideUp, glow: true,
      };
  }
}

// ── LinktreeConfig type ───────────────────────────────────────────────────────
interface LinktreeConfig {
  ctaText?: string;
  bgPattern?: string;
  buttonStyle?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TenantLinktreePage() {
  const { slug } = useParams<{ slug: string }>();
  const [tenantName, setTenantName]   = useState("");
  const [tagline, setTagline]         = useState<string | null>(null);
  const [primaryColor, setPrimary]    = useState("#E8C7C3");
  const [logoUrl, setLogoUrl]         = useState<string | null>(null);
  const [linktreeStyle, setStyle]     = useState<Theme>("gradient");
  const [industryType, setIndustry]   = useState<string | null>(null);
  const [cfg, setCfg]                 = useState<LinktreeConfig>({});
  const [links, setLinks]             = useState<TenantLink[]>([]);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([getTenantInfo(slug), getTenantLinks(slug)])
      .then(([info, tenantLinks]) => {
        if (!info?.name) { setNotFound(true); return; }
        setTenantName(info.companyName ?? info.name ?? slug);
        setTagline(info.tagline ?? null);
        if (info.primaryColor) setPrimary(info.primaryColor);
        if (info.logoUrl)      setLogoUrl(info.logoUrl);
        if (info.linktreeStyle) setStyle(info.linktreeStyle as Theme);
        if (info.industryType)  setIndustry(info.industryType);
        if (info.linktreeConfig) {
          try { setCfg(JSON.parse(info.linktreeConfig)); } catch { /* ignore malformed JSON */ }
        }
        setLinks(tenantLinks);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: primaryColor }} />
        </motion.div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-2xl font-bold text-gray-800 mb-2">Profil nicht gefunden</p>
          <p className="text-gray-500">Der Link <span className="font-mono">/booking/{slug}</span> existiert nicht.</p>
        </div>
      </div>
    );
  }

  const t         = getThemeConfig(linktreeStyle, primaryColor);
  const logoSrc   = logoUrl
    ? (logoUrl.startsWith("http") ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL}${logoUrl}`)
    : null;
  const btnRadius  = getBorderRadius(cfg.buttonStyle);
  const ctaText    = cfg.ctaText?.trim() || "Termin buchen";
  const emoji      = industryType ? (INDUSTRY_EMOJI[industryType] ?? null) : null;

  return (
    <div className="min-h-screen" style={{ background: t.bg }}>

      {/* ── Background patterns ── */}
      {getBgPattern(cfg.bgPattern, primaryColor)}

      {/* ── Decorative background blobs ── */}
      {t.glow && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-25 blur-3xl"
            style={{ background: primaryColor }} />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: primaryColor }} />
          {linktreeStyle === "dark" && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
              style={{ background: primaryColor }} />
          )}
        </div>
      )}

      <div className="relative max-w-md mx-auto px-4 py-14 pb-16 flex flex-col items-center gap-5">

        {/* ── Profile ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 text-center"
        >
          {/* Avatar */}
          <div className="relative">
            {t.glow && (
              <div className="absolute inset-0 rounded-full blur-xl opacity-50 scale-125"
                style={{ background: primaryColor }} />
            )}
            {logoSrc ? (
              <img src={logoSrc} alt={tenantName}
                className="relative w-24 h-24 rounded-full object-cover shadow-2xl border-4"
                style={{ borderColor: t.avatarBorder }} />
            ) : (
              <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-4"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${withAlpha(primaryColor, 0.7)})`, borderColor: t.avatarBorder }}>
                {emoji ? (
                  <span className="text-3xl leading-none">{emoji}</span>
                ) : (
                  <span className="text-white text-3xl font-bold">{tenantName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            )}
          </div>

          {/* Name + tagline */}
          <div>
            <h1 className="text-2xl font-bold mt-1" style={{ color: linktreeStyle === "bold" ? "#fff" : t.textPrimary }}>
              {tenantName}
            </h1>
            {tagline && (
              <p className="text-sm mt-1.5 max-w-xs leading-relaxed" style={{ color: t.taglineCl }}>
                {tagline}
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
        <motion.div className="w-full flex flex-col gap-3 mt-1"
          variants={stagger} initial="hidden" animate="visible">

          {/* Booking CTA */}
          <motion.div variants={t.itemVariant}>
            <Link href={`/booking/${slug}/book`}
              className="group w-full flex items-center gap-3 px-5 py-4 font-bold text-base shadow-xl transition-transform active:scale-[0.97]"
              style={{
                background: t.ctaBg,
                boxShadow: `0 8px 30px ${t.ctaShadow}`,
                color: (t as any).ctaTextColor ?? "#ffffff",
                borderRadius: btnRadius,
              }}
            >
              <span className="flex-shrink-0 bg-white/20 p-2 group-hover:bg-white/30 transition-colors"
                style={{ borderRadius: btnRadius }}>
                <Calendar size={20} />
              </span>
              <span className="flex-1">{ctaText}</span>
              <motion.span
                className="opacity-70"
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              >
                <ChevronRight size={18} />
              </motion.span>
            </Link>
          </motion.div>

          {/* Custom links */}
          {links.map((link) => (
            <motion.div key={link.id} variants={t.itemVariant}>
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="group w-full flex items-center gap-3 px-5 py-4 font-semibold text-base shadow-sm transition-all active:scale-[0.97]"
                style={{
                  background: (t as any).blur ? t.cardBg : t.cardBg,
                  backdropFilter: (t as any).blur ? "blur(16px)" : undefined,
                  WebkitBackdropFilter: (t as any).blur ? "blur(16px)" : undefined,
                  border: `1px solid ${t.cardBorder}`,
                  color: t.textSecondary,
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  borderRadius: btnRadius,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = t.cardHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = t.cardBg; }}
              >
                <span className="flex-shrink-0 p-2 text-white transition-transform group-hover:scale-105"
                  style={{ background: t.iconBg, borderRadius: btnRadius }}>
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={20} />}
                </span>
                <span className="flex-1" style={{ color: t.textPrimary }}>{link.title}</span>
                <ExternalLink size={14} style={{ color: withAlpha("#888888", 0.5) }}
                  className="group-hover:opacity-80 transition-opacity" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-6 flex items-center gap-1.5"
        >
          <Sparkles size={11} style={{ color: withAlpha(primaryColor, 0.5) }} />
          <p className="text-xs" style={{ color: t.footerCl }}>
            Powered by{" "}
            <span className="font-semibold" style={{ color: primaryColor }}>GentleBook</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
