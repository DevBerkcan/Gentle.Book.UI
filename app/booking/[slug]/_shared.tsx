"use client";

import { useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Calendar, Instagram, MessageCircle, MapPin, Facebook, Youtube,
  Globe, Phone, Mail, ExternalLink,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LinktreeConfig {
  ctaText?: string;
  bgPattern?: string;
  buttonStyle?: string;
  fontFamily?: string;
  ctaColor?: string;
  avatarShape?: string;
  cardStyle?: string;
  layoutMode?: string;
  animationSpeed?: string;
  showWelcome?: boolean;
  confetti?: boolean;
  bookingTheme?: string;
  serviceLayout?: string;
  showPrices?: boolean;
  ctaBadge?: string;
  pageTemplate?: string;
  colorScheme?: string;
}

export interface TenantLinkItem {
  id: string;
  title: string;
  url: string;
  iconType: string;
}

export interface TemplateProps {
  slug: string;
  tenantName: string;
  tagline: string | null;
  welcomeMsg: string | null;
  primaryColor: string;
  logoSrc: string | null;
  linktreeStyle: string;
  industryType: string | null;
  cfg: LinktreeConfig;
  links: TenantLinkItem[];
  handleCtaClick: (e: React.MouseEvent) => void;
  showFloating: boolean;
}

// ── Google Fonts ───────────────────────────────────────────────────────────────

export const FONT_QUERY: Record<string, string> = {
  playfair:   "Playfair+Display:wght@400;600;700",
  montserrat: "Montserrat:wght@400;600;700",
  "dm-serif": "DM+Serif+Display",
  josefin:    "Josefin+Sans:wght@400;600;700",
};
export const FONT_FAMILY: Record<string, string> = {
  inter:      "Inter, sans-serif",
  playfair:   "'Playfair Display', serif",
  montserrat: "'Montserrat', sans-serif",
  "dm-serif": "'DM Serif Display', serif",
  josefin:    "'Josefin Sans', sans-serif",
};

export const INDUSTRY_EMOJI: Record<string, string> = {
  Hairdresser: "✂️", Beauty: "💄", Barbershop: "🪒",
  Massage: "💆", Nail: "💅", Physio: "🏋️", Tattoo: "🎨", Other: "📅",
};

export const ICON_MAP: Record<string, React.ReactNode> = {
  Booking:    <Calendar size={18} />,
  Instagram:  <Instagram size={18} />,
  WhatsApp:   <MessageCircle size={18} />,
  GoogleMaps: <MapPin size={18} />,
  Facebook:   <Facebook size={18} />,
  TikTok:     <span className="text-xs font-bold">TT</span>,
  YouTube:    <Youtube size={18} />,
  Website:    <Globe size={18} />,
  Phone:      <Phone size={18} />,
  Email:      <Mail size={18} />,
  Custom:     <ExternalLink size={18} />,
};

// ── Color utilities ───────────────────────────────────────────────────────────

export function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}
export function lighten(hex: string, amount = 0.85) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.round(r+(255-r)*amount)},${Math.round(g+(255-g)*amount)},${Math.round(b+(255-b)*amount)})`;
  } catch { return "#F5EDEB"; }
}
export function withAlpha(hex: string, alpha: number) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return hex; }
}
export function getContrastColor(hex: string): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#111111" : "#ffffff";
  } catch { return "#ffffff"; }
}
export function getBorderRadius(style?: string) {
  if (style === "pill")   return "9999px";
  if (style === "square") return "4px";
  return "16px";
}
export function getAvatarRadius(shape?: string) {
  if (shape === "rounded") return "20px";
  if (shape === "square")  return "4px";
  return "9999px";
}

// ── Animation builders ────────────────────────────────────────────────────────

export function buildAnimVariants(speed?: string) {
  const s = speed === "none"   ? { stagger: 0,    delay: 0,   stiffness: 500, damping: 40 }
          : speed === "slow"   ? { stagger: 0.15, delay: 0.4, stiffness: 180, damping: 28 }
          : speed === "fast"   ? { stagger: 0.04, delay: 0.1, stiffness: 380, damping: 18 }
          :                      { stagger: 0.07, delay: 0.2, stiffness: 280, damping: 22 };
  const container = { hidden: {}, visible: { transition: { staggerChildren: s.stagger, delayChildren: s.delay } } };
  const item = speed === "none"
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0,
        transition: { type: "spring", stiffness: s.stiffness, damping: s.damping } } };
  return { container, item };
}

// ── Theme config ──────────────────────────────────────────────────────────────

export type Theme = "gradient" | "dark" | "minimal" | "bold" | "glass";

export function getThemeConfig(theme: Theme, primary: string) {
  const light   = lighten(primary, 0.88);
  const mid     = lighten(primary, 0.65);
  const alpha20 = withAlpha(primary, 0.2);
  const alpha50 = withAlpha(primary, 0.5);
  switch (theme) {
    case "dark":
      return {
        bg: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
        cardBg: "rgba(255,255,255,0.06)", cardBorder: "rgba(255,255,255,0.1)", cardHover: "rgba(255,255,255,0.1)",
        textPrimary: "#ffffff", textSecondary: "rgba(255,255,255,0.55)", taglineCl: "rgba(255,255,255,0.5)", footerCl: "rgba(255,255,255,0.25)",
        iconBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.7)})`,
        ctaBg: `linear-gradient(135deg, ${primary} 0%, ${withAlpha(primary, 0.8)} 100%)`,
        ctaShadow: withAlpha(primary, 0.4), avatarBorder: "rgba(255,255,255,0.15)", glow: true, blur: false,
      };
    case "minimal":
      return {
        bg: "#ffffff",
        cardBg: "#ffffff", cardBorder: "#f0f0f0", cardHover: "#fafafa",
        textPrimary: "#111111", textSecondary: "#333333", taglineCl: "#888888", footerCl: "#cccccc",
        iconBg: primary, ctaBg: primary, ctaShadow: alpha20, avatarBorder: "#f0f0f0", glow: false, blur: false,
      };
    case "bold":
      return {
        bg: `linear-gradient(160deg, ${primary} 0%, ${mid} 100%)`,
        cardBg: "rgba(255,255,255,0.92)", cardBorder: "rgba(255,255,255,0.6)", cardHover: "#ffffff",
        textPrimary: "#1a1a1a", textSecondary: "#333333", taglineCl: "rgba(255,255,255,0.85)", footerCl: "rgba(255,255,255,0.5)",
        iconBg: primary, ctaBg: "#ffffff", ctaShadow: "rgba(0,0,0,0.2)", avatarBorder: "rgba(255,255,255,0.8)",
        ctaTextColor: primary, glow: false, blur: false,
      };
    case "glass":
      return {
        bg: `linear-gradient(135deg, ${lighten(primary, 0.5)} 0%, ${lighten(primary, 0.7)} 40%, ${lighten(primary, 0.4)} 100%)`,
        cardBg: "rgba(255,255,255,0.45)", cardBorder: "rgba(255,255,255,0.7)", cardHover: "rgba(255,255,255,0.65)",
        textPrimary: "#1a1a1a", textSecondary: "#333333", taglineCl: "#555555", footerCl: "rgba(0,0,0,0.35)",
        iconBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.75)})`,
        ctaBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.85)})`,
        ctaShadow: alpha50, avatarBorder: "rgba(255,255,255,0.9)", glow: true, blur: true,
      };
    default:
      return {
        bg: `linear-gradient(160deg, ${light} 0%, #ffffff 55%, ${lighten(primary, 0.72)} 100%)`,
        cardBg: "rgba(255,255,255,0.85)", cardBorder: "rgba(255,255,255,0.9)", cardHover: "#ffffff",
        textPrimary: "#1a1a1a", textSecondary: "#333333", taglineCl: "#777777", footerCl: "#cccccc",
        iconBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.75)})`,
        ctaBg: `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.8)})`,
        ctaShadow: withAlpha(primary, 0.35), avatarBorder: "#ffffff", glow: true, blur: false,
      };
  }
}

export function resolveCardStyle(style: string | undefined, cardBg: string, cardBorder: string, primary: string) {
  switch (style) {
    case "outlined":
      return { background: "transparent", border: `2px solid ${cardBorder}`, boxShadow: "none" };
    case "gradient":
      return { background: `linear-gradient(135deg, ${withAlpha(primary, 0.09)}, ${withAlpha(primary, 0.03)})`, border: `1px solid ${withAlpha(primary, 0.18)}` };
    case "ghost":
      return { background: "transparent", border: "none", boxShadow: "none" };
    default:
      return { background: cardBg, border: `1px solid ${cardBorder}` };
  }
}

// ── Background Pattern ────────────────────────────────────────────────────────

export function BgPattern({ pattern, color }: { pattern?: string; color?: string }) {
  const c  = color ? withAlpha(color, 0.08) : "rgba(0,0,0,0.06)";
  const c2 = color ? withAlpha(color, 0.05) : "rgba(0,0,0,0.04)";
  if (!pattern || pattern === "none") return null;
  if (pattern === "dots") return (
    <div className="fixed inset-0 pointer-events-none" aria-hidden
      style={{ backgroundImage: `radial-gradient(circle, ${c} 1.5px, transparent 1.5px)`, backgroundSize: "28px 28px" }} />
  );
  if (pattern === "grid") return (
    <div className="fixed inset-0 pointer-events-none" aria-hidden
      style={{ backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />
  );
  if (pattern === "waves") return (
    <svg className="fixed inset-0 w-full h-full pointer-events-none" aria-hidden preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="waves" x="0" y="0" width="120" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 Q30 5 60 20 Q90 35 120 20" fill="none" stroke={c} strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#waves)" />
    </svg>
  );
  if (pattern === "circles") return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute top-[10%] right-[5%] w-72 h-72 rounded-full"  style={{ background: c }} />
      <div className="absolute bottom-[15%] left-[8%] w-56 h-56 rounded-full" style={{ background: c2 }} />
      <div className="absolute top-[55%] left-[60%] w-40 h-40 rounded-full"  style={{ background: c }} />
    </div>
  );
  return null;
}

// ── Tilt Card ─────────────────────────────────────────────────────────────────

export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref  = useRef<HTMLDivElement>(null);
  const x    = useMotionValue(0);
  const y    = useMotionValue(0);
  const rotX = useTransform(y, [-40, 40], [5, -5]);
  const rotY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.div ref={ref}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
