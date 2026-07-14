"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Plus, Trash2, GripVertical, ExternalLink, Calendar,
  Instagram, MessageCircle, MapPin, Facebook, Youtube, Globe,
  Phone, Mail, Edit2, Check, X, Eye, CheckCircle2, AlertCircle,
  ArrowUp, ArrowDown, Palette, Loader2, Sparkles, ChevronDown,
  Circle, Grid3x3, Minus, Type, Pipette, LayoutList, LayoutGrid,
  Zap, Wind, Smile, QrCode, Download, Copy, Check as CheckIcon,
  SlidersHorizontal, Smartphone, Tablet, Monitor,
} from "lucide-react";
import QRCodeSVG from "react-qr-code";
import api from "@/lib/api/client";
import { useAuth } from "@/lib/contexts/AuthContext";
import { MagicCard } from "@/components/ui/magic-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { HelpTip } from "@/components/ui/help-tip";

// ── Design Tokens ─────────────────────────────────────────────────────────────
// Primary palette: neutral monochrome + single indigo accent
// bg:          #F7F7F8  (page background)
// surface:     #FFFFFF  (cards / panels)
// border:      #E5E7EB  (default borders)
// border-sub:  #F3F4F6  (subtle inner dividers)
// text-1:      #111318  (headings, strong text)
// text-2:      #374151  (body text)
// text-3:      #6B7280  (captions, hints)
// text-4:      #9CA3AF  (placeholders, disabled)
// accent:      #6355E4  (active states, primary CTA highlight)
// accent-bg:   #EEEBFC  (accent tint background)
// accent-bdr:  #C7D2FE  (accent border tint)
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

type Theme = "gradient" | "dark" | "minimal" | "bold" | "glass";
type BgPattern = "none" | "dots" | "waves" | "grid" | "circles";
type ButtonStyle = "rounded" | "pill" | "square";
type FontFamily = "inter" | "playfair" | "montserrat" | "dm-serif" | "josefin";
type CardStyle = "filled" | "outlined" | "gradient" | "ghost";
type LayoutMode = "list" | "grid";
type AnimSpeed = "none" | "slow" | "normal" | "fast";
type HeroStyle = "compact" | "editorial" | "immersive";
type SizeLevel = "sm" | "md" | "lg";
type SpacingLevel = "tight" | "normal" | "airy";
type MotionIntensity = "off" | "subtle" | "strong";
type StartFocus = "logo" | "cta" | "links";
type PreviewDevice = "mobile" | "tablet" | "desktop";
type PageTemplate =
  | "classic" | "soft" | "hero" | "neon" | "magazine" | "split" | "corporate"
  | "organic" | "tattoo" | "barbershop" | "beauty" | "clinic" | "fitness"
  | "restaurant" | "portfolio";

interface LinktreeConfig {
  ctaText: string;
  bgPattern: BgPattern;
  buttonStyle: ButtonStyle;
  fontFamily?: FontFamily;
  ctaColor?: string;
  avatarShape?: "circle" | "rounded" | "square";
  cardStyle?: CardStyle;
  layoutMode?: LayoutMode;
  animationSpeed?: AnimSpeed;
  showWelcome?: boolean;
  confetti?: boolean;
  bookingTheme?: "light" | "dark" | "branded";
  serviceLayout?: "list" | "cards";
  showPrices?: boolean;
  ctaBadge?: string;
  pageTemplate?: PageTemplate;
  colorScheme?: string;
  heroStyle?: HeroStyle;
  mediaScale?: SizeLevel;
  buttonSpacing?: SpacingLevel;
  cardDensity?: SpacingLevel;
  motionIntensity?: MotionIntensity;
  startFocus?: StartFocus;
}

const DEFAULT_CONFIG: LinktreeConfig = {
  ctaText: "Termin buchen",
  bgPattern: "none",
  buttonStyle: "rounded",
  fontFamily: "inter",
  ctaColor: undefined,
  avatarShape: "circle",
  cardStyle: "filled",
  layoutMode: "list",
  animationSpeed: "normal",
  showWelcome: false,
  confetti: false,
  bookingTheme: "light",
  serviceLayout: "list",
  showPrices: true,
  ctaBadge: "",
  pageTemplate: "classic",
  colorScheme: "auto",
  heroStyle: "compact",
  mediaScale: "md",
  buttonSpacing: "normal",
  cardDensity: "normal",
  motionIntensity: "subtle",
  startFocus: "logo",
};

// ── Industry Presets ──────────────────────────────────────────────────────────

const INDUSTRY_PRESETS: Record<string, { color: string; style: Theme; emoji: string; label: string; ctaText: string; bgPattern: BgPattern; buttonStyle: ButtonStyle }> = {
  Hairdresser: { color: "#C9A96E", style: "bold",     emoji: "✂️",  label: "Friseur",        ctaText: "Friseurtermin buchen",   bgPattern: "waves",   buttonStyle: "rounded" },
  Beauty:      { color: "#E8C7C3", style: "gradient",  emoji: "💄",  label: "Beauty",         ctaText: "Beauty-Termin buchen",   bgPattern: "dots",    buttonStyle: "pill"    },
  Barbershop:  { color: "#2C3E50", style: "dark",      emoji: "🪒",  label: "Barbershop",     ctaText: "Barber-Termin buchen",   bgPattern: "grid",    buttonStyle: "square"  },
  Massage:     { color: "#6B8E7F", style: "minimal",   emoji: "💆",  label: "Massage",        ctaText: "Massage buchen",         bgPattern: "circles", buttonStyle: "pill"    },
  Nail:        { color: "#D4A5C9", style: "glass",     emoji: "💅",  label: "Nails",          ctaText: "Nail-Termin buchen",     bgPattern: "dots",    buttonStyle: "pill"    },
  Physio:      { color: "#4A90D9", style: "minimal",   emoji: "🏋️", label: "Physiotherapie", ctaText: "Termin vereinbaren",     bgPattern: "none",    buttonStyle: "rounded" },
  Tattoo:      { color: "#1A1A2E", style: "dark",      emoji: "🎨",  label: "Tattoo",         ctaText: "Studio-Termin buchen",   bgPattern: "grid",    buttonStyle: "square"  },
  Yoga:        { color: "#7C9885", style: "glass",     emoji: "🧘",  label: "Yoga",           ctaText: "Session buchen",         bgPattern: "waves",   buttonStyle: "pill"    },
  Fitness:     { color: "#EF4444", style: "bold",      emoji: "🏋️", label: "Fitness",        ctaText: "Training buchen",        bgPattern: "grid",    buttonStyle: "rounded" },
  Restaurant:  { color: "#B45309", style: "bold",      emoji: "🍽️", label: "Restaurant",     ctaText: "Tisch reservieren",      bgPattern: "none",    buttonStyle: "rounded" },
  Coaching:    { color: "#2563EB", style: "minimal",   emoji: "💼",  label: "Coaching",       ctaText: "Erstgespräch buchen",    bgPattern: "grid",    buttonStyle: "rounded" },
  Other:       { color: "#E8C7C3", style: "gradient",  emoji: "📅",  label: "Andere",         ctaText: "Termin buchen",          bgPattern: "none",    buttonStyle: "rounded" },
};

// ── Color Palettes ────────────────────────────────────────────────────────────

const COLOR_PALETTES: { key: string; name: string; primary: string; bg: string; theme: Theme }[] = [
  { key: "blossom",  name: "Blossom",   primary: "#E8C7C3", bg: "#FDF6F5", theme: "gradient" },
  { key: "ocean",    name: "Ocean",     primary: "#4A90D9", bg: "#EFF6FF", theme: "minimal"  },
  { key: "forest",   name: "Forest",    primary: "#6B8E7F", bg: "#F0F7F4", theme: "minimal"  },
  { key: "gold",     name: "Gold",      primary: "#C9A96E", bg: "#FDFAF5", theme: "bold"     },
  { key: "lavender", name: "Lavendel",  primary: "#A78BFA", bg: "#FAF5FD", theme: "glass"    },
  { key: "midnight", name: "Midnight",  primary: "#818CF8", bg: "#0f0f1a", theme: "dark"     },
  { key: "ember",    name: "Ember",     primary: "#F97316", bg: "#FFF7ED", theme: "gradient" },
  { key: "obsidian", name: "Obsidian",  primary: "#E74C3C", bg: "#1A1A2E", theme: "dark"     },
  { key: "rose",     name: "Rose",      primary: "#F43F5E", bg: "#FFF1F2", theme: "glass"    },
  { key: "slate",    name: "Slate",     primary: "#64748B", bg: "#F8FAFC", theme: "minimal"  },
  { key: "mint",     name: "Mint",      primary: "#10B981", bg: "#F0FDF4", theme: "minimal"  },
  { key: "noir",     name: "Noir",      primary: "#ffffff", bg: "#0a0a0a", theme: "dark"     },
  { key: "saffron",  name: "Saffron",   primary: "#D97706", bg: "#FFFBEB", theme: "bold"     },
  { key: "clinical", name: "Clinical",  primary: "#0EA5E9", bg: "#F0F9FF", theme: "minimal"  },
  { key: "lime",     name: "Lime",      primary: "#84CC16", bg: "#F7FEE7", theme: "glass"    },
  { key: "mono",     name: "Mono",      primary: "#18181B", bg: "#FAFAFA", theme: "minimal"  },
];

// ── Page Templates ─────────────────────────────────────────────────────────────

const PAGE_TEMPLATES: {
  key: PageTemplate; name: string; desc: string;
  plan: "starter" | "pro" | "business";
  emoji: string;
  industry?: string;
}[] = [
  { key: "classic",    name: "Classic",    desc: "Zentriert, zeitlos",      plan: "starter",  emoji: "⭐" },
  { key: "soft",       name: "Soft",       desc: "Pastell, weich",          plan: "starter",  emoji: "🌸" },
  { key: "hero",       name: "Hero",       desc: "Großes Header-Banner",    plan: "starter",  emoji: "🦸" },
  { key: "neon",       name: "Neon",       desc: "Dunkel & leuchtend",      plan: "pro",      emoji: "⚡" },
  { key: "magazine",   name: "Magazine",   desc: "Redaktionell, kühl",      plan: "pro",      emoji: "📰" },
  { key: "split",      name: "Split",      desc: "Zweispaltig, modern",     plan: "pro",      emoji: "⬛" },
  { key: "corporate",  name: "Corporate",  desc: "Clean, professionell",    plan: "business", emoji: "🏢" },
  { key: "organic",    name: "Organic",    desc: "Fließend, natürlich",     plan: "starter",  emoji: "🌿", industry: "Wellness" },
  { key: "tattoo",     name: "Tattoo",     desc: "Dark & edgy",             plan: "starter",  emoji: "🎨", industry: "Tattoo"   },
  { key: "barbershop", name: "Barbershop", desc: "Vintage & warm",          plan: "starter",  emoji: "🪒", industry: "Barbershop"},
  { key: "beauty",     name: "Beauty",     desc: "Elegant & luxuriös",      plan: "starter",  emoji: "💄", industry: "Beauty"   },
  { key: "clinic",     name: "Clinic",     desc: "Vertrauen & Klarheit",    plan: "starter",  emoji: "🏥", industry: "Praxis"   },
  { key: "fitness",    name: "Fitness",    desc: "3D Energy Cards",         plan: "pro",      emoji: "🔥", industry: "Fitness"  },
  { key: "restaurant", name: "Restaurant", desc: "Reservierung & Genuss",   plan: "pro",      emoji: "🍽️", industry: "Food"     },
  { key: "portfolio",  name: "Portfolio",  desc: "Creator & Coach",         plan: "business", emoji: "◼", industry: "Creator"  },
];

const PLAN_ORDER = { starter: 0, pro: 1, business: 2 };

const TPL_VISUAL: Record<PageTemplate, { bg: string; accent: string }> = {
  classic:    { bg: "linear-gradient(145deg,#FDF6F5,#F6F5FA)", accent: "#E8C7C3" },
  soft:       { bg: "linear-gradient(145deg,#FFF0F8,#FFE0F0)", accent: "#F9A8D4" },
  hero:       { bg: "linear-gradient(145deg,#1a1a2e,#16213e)",  accent: "#E8C7C3" },
  neon:       { bg: "linear-gradient(145deg,#0D0D0D,#1a0028)",  accent: "#A855F7" },
  magazine:   { bg: "linear-gradient(145deg,#F8F8F8,#E8E8E8)", accent: "#1E1E1E" },
  split:      { bg: "linear-gradient(90deg,#1E1E1E 48%,#F8F8F8 52%)", accent: "#E8C7C3" },
  corporate:  { bg: "linear-gradient(145deg,#EFF6FF,#DBEAFE)", accent: "#2563EB" },
  organic:    { bg: "linear-gradient(145deg,#F0FDF4,#DCFCE7)", accent: "#16A34A" },
  tattoo:     { bg: "linear-gradient(145deg,#0A0A0A,#1A0A0A)", accent: "#EF4444" },
  barbershop: { bg: "linear-gradient(145deg,#FFF8F0,#FDEBD0)", accent: "#C9A96E" },
  beauty:     { bg: "linear-gradient(145deg,#FFF1F2,#FFE4E6)", accent: "#F43F5E" },
  clinic:     { bg: "linear-gradient(145deg,#F0F9FF,#E0F2FE)", accent: "#0EA5E9" },
  fitness:    { bg: "linear-gradient(145deg,#150505,#2D1515)", accent: "#EF4444" },
  restaurant: { bg: "linear-gradient(145deg,#FFFBEB,#FEF3C7)", accent: "#B45309" },
  portfolio:  { bg: "linear-gradient(145deg,#FAFAFA,#F0F0F0)", accent: "#18181B" },
};

const CMS_TEMPLATE_PACKS: {
  key: string; name: string; desc: string; icon: string;
  primaryColor: string; theme: Theme; config: LinktreeConfig;
}[] = [
  { key: "salon-launch", name: "Salon Launch", desc: "Friseur, Beauty, Nails", icon: "✂️", primaryColor: "#C9A96E", theme: "bold",
    config: { pageTemplate: "beauty", fontFamily: "playfair", buttonStyle: "pill", cardStyle: "filled", bgPattern: "dots", layoutMode: "list", animationSpeed: "normal", ctaText: "Wunschtermin buchen", ctaBadge: "Beliebt", bookingTheme: "branded", serviceLayout: "cards", showPrices: true, showWelcome: true, heroStyle: "editorial", mediaScale: "lg", buttonSpacing: "airy", cardDensity: "normal", motionIntensity: "subtle", startFocus: "logo" } },
  { key: "medical-trust", name: "Medical Trust", desc: "Praxis, Physio, Beratung", icon: "🏥", primaryColor: "#0EA5E9", theme: "minimal",
    config: { pageTemplate: "clinic", fontFamily: "inter", buttonStyle: "rounded", cardStyle: "outlined", bgPattern: "grid", layoutMode: "list", animationSpeed: "slow", ctaText: "Termin vereinbaren", ctaBadge: "Online", bookingTheme: "light", serviceLayout: "list", showPrices: false, showWelcome: true, heroStyle: "compact", mediaScale: "md", buttonSpacing: "normal", cardDensity: "tight", motionIntensity: "subtle", startFocus: "cta" } },
  { key: "fitness-energy", name: "Fitness Energy", desc: "Gym, Coaching, Yoga", icon: "🔥", primaryColor: "#EF4444", theme: "dark",
    config: { pageTemplate: "fitness", fontFamily: "montserrat", buttonStyle: "rounded", cardStyle: "gradient", bgPattern: "grid", layoutMode: "grid", animationSpeed: "fast", ctaText: "Training buchen", ctaBadge: "Neu", bookingTheme: "dark", serviceLayout: "cards", showPrices: true, showWelcome: false, confetti: true, heroStyle: "immersive", mediaScale: "lg", buttonSpacing: "airy", cardDensity: "normal", motionIntensity: "strong", startFocus: "cta" } },
  { key: "food-reservation", name: "Food Reservation", desc: "Restaurant, Cafe, Bar", icon: "🍽️", primaryColor: "#B45309", theme: "bold",
    config: { pageTemplate: "restaurant", fontFamily: "dm-serif", buttonStyle: "rounded", cardStyle: "filled", bgPattern: "none", layoutMode: "list", animationSpeed: "normal", ctaText: "Tisch reservieren", ctaBadge: "Heute", bookingTheme: "branded", serviceLayout: "cards", showPrices: true, showWelcome: true, heroStyle: "editorial", mediaScale: "md", buttonSpacing: "normal", cardDensity: "airy", motionIntensity: "subtle", startFocus: "cta" } },
  { key: "creator-pro", name: "Creator Pro", desc: "Coach, Portfolio, Beratung", icon: "◼", primaryColor: "#18181B", theme: "minimal",
    config: { pageTemplate: "portfolio", fontFamily: "josefin", buttonStyle: "square", cardStyle: "ghost", bgPattern: "none", layoutMode: "grid", animationSpeed: "normal", ctaText: "Call buchen", ctaBadge: "Limited", bookingTheme: "light", serviceLayout: "list", showPrices: false, showWelcome: true, heroStyle: "compact", mediaScale: "sm", buttonSpacing: "tight", cardDensity: "tight", motionIntensity: "subtle", startFocus: "links" } },
  { key: "night-studio", name: "Night Studio", desc: "Tattoo, Barber, Events", icon: "⚡", primaryColor: "#A855F7", theme: "dark",
    config: { pageTemplate: "neon", fontFamily: "josefin", buttonStyle: "square", cardStyle: "outlined", bgPattern: "grid", layoutMode: "grid", animationSpeed: "fast", ctaText: "Slot sichern", ctaBadge: "Live", bookingTheme: "dark", serviceLayout: "cards", showPrices: true, showWelcome: false, confetti: true, heroStyle: "immersive", mediaScale: "lg", buttonSpacing: "airy", cardDensity: "normal", motionIntensity: "strong", startFocus: "cta" } },
];

const THEMES: { value: Theme; label: string; desc: string }[] = [
  { value: "gradient", label: "Gradient", desc: "Sanfter Verlauf" },
  { value: "dark",     label: "Dark",     desc: "Dunkles Design"  },
  { value: "minimal",  label: "Minimal",  desc: "Klares Weiß"     },
  { value: "bold",     label: "Bold",     desc: "Vollfarbe"       },
  { value: "glass",    label: "Glass",    desc: "Milchglas"       },
];

const ICON_OPTIONS = [
  { value: "Instagram",  label: "Instagram",   icon: <Instagram size={15} /> },
  { value: "WhatsApp",   label: "WhatsApp",    icon: <MessageCircle size={15} /> },
  { value: "GoogleMaps", label: "Google Maps", icon: <MapPin size={15} /> },
  { value: "Facebook",   label: "Facebook",    icon: <Facebook size={15} /> },
  { value: "TikTok",     label: "TikTok",      icon: <span className="text-[11px] font-bold">TT</span> },
  { value: "YouTube",    label: "YouTube",     icon: <Youtube size={15} /> },
  { value: "Website",    label: "Website",     icon: <Globe size={15} /> },
  { value: "Phone",      label: "Telefon",     icon: <Phone size={15} /> },
  { value: "Email",      label: "E-Mail",      icon: <Mail size={15} /> },
  { value: "Custom",     label: "Sonstiges",   icon: <ExternalLink size={15} /> },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Booking:    <Calendar size={17} />,
  Instagram:  <Instagram size={17} />,
  WhatsApp:   <MessageCircle size={17} />,
  GoogleMaps: <MapPin size={17} />,
  Facebook:   <Facebook size={17} />,
  TikTok:     <span className="text-[11px] font-bold">TT</span>,
  YouTube:    <Youtube size={17} />,
  Website:    <Globe size={17} />,
  Phone:      <Phone size={17} />,
  Email:      <Mail size={17} />,
  Custom:     <ExternalLink size={17} />,
};

interface LinkItem {
  id: string; title: string; url: string;
  iconType: string; displayOrder: number; isActive: boolean;
}

type Toast = { id: number; type: "success" | "error"; message: string };
let toastCounter = 0;

// ── Reusable sub-components ───────────────────────────────────────────────────

/** Consistent section label inside design accordion */
function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[#6355E4]">{icon}</span>
      <span className="text-[11px] font-semibold text-[#374151] uppercase tracking-widest">{children}</span>
    </div>
  );
}

/** Option pill button used throughout the configurator */
function OptionPill({
  active, onClick, children, className = "",
}: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-[#EEEBFC] border-[#C7D2FE] text-[#6355E4] shadow-sm"
          : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#C7D2FE] hover:text-[#374151]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Toggle switch */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${on ? "bg-[#6355E4]" : "bg-[#D1D5DB]"}`}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-[3px]"}`}
      />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminLinksPage() {
  const { user, isEmployee } = useAuth();
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);
  const tenantSlug = (user as any)?.tenantSlug;

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("Instagram");
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const [theme, setTheme] = useState<Theme>("gradient");
  const [primaryColor, setPrimaryColor] = useState("#E8C7C3");
  const [config, setConfig] = useState<LinktreeConfig>(DEFAULT_CONFIG);
  const [industryType, setIndustryType] = useState<string>("Other");
  const [designOpen, setDesignOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [brandColors, setBrandColors] = useState<{ primary?: string; secondary?: string; accent?: string }>({});
  const [designSaving, setDesignSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tenantPlan, setTenantPlan] = useState<"starter" | "pro" | "business">("starter");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("mobile");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    loadLinks();
    api.get("/tenant/settings").then((res) => {
      const d = res.data?.data ?? res.data;
      if (d?.linktreeStyle) setTheme(d.linktreeStyle as Theme);
      if (d?.primaryColor) setPrimaryColor(d.primaryColor);
      setBrandColors({ primary: d?.primaryColor, secondary: d?.secondaryColor, accent: d?.accentColor });
      if (d?.linktreeConfig) {
        try { setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(d.linktreeConfig) }); } catch {}
      }
    }).catch(() => {});
    const slug = tenantSlug;
    if (slug) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/booking/${slug}/info`)
        .then(r => r.json()).then(d => { if (d?.industryType) setIndustryType(d.industryType); })
        .catch(() => {});
    }
    api.get("/tenant/subscription").then((res) => {
      const plan = res.data?.plan?.toLowerCase() ?? "starter";
      if (plan.includes("business")) setTenantPlan("business");
      else if (plan.includes("pro"))  setTenantPlan("pro");
      else                            setTenantPlan("starter");
    }).catch(() => {});
  }, [tenantSlug]);

  const saveDesign = useCallback(async (
    newTheme: Theme, newColor: string, newConfig: LinktreeConfig, silent = false
  ) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setDesignSaving(true);
      try {
        await api.put("/tenant/settings", {
          primaryColor: newColor, linktreeStyle: newTheme,
          linktreeConfig: JSON.stringify(newConfig),
        });
        setPreviewKey((k) => k + 1);
        if (!silent) showToast("success", "Design gespeichert");
      } catch {
        showToast("error", "Design konnte nicht gespeichert werden");
      } finally { setDesignSaving(false); }
    }, 600);
  }, [showToast]);

  async function applyPreset(key: string) {
    const preset = INDUSTRY_PRESETS[key] ?? INDUSTRY_PRESETS.Other;
    const newConfig: LinktreeConfig = { ...DEFAULT_CONFIG, ...config, ctaText: preset.ctaText, bgPattern: preset.bgPattern, buttonStyle: preset.buttonStyle };
    setTheme(preset.style); setPrimaryColor(preset.color); setConfig(newConfig);
    await saveDesign(preset.style, preset.color, newConfig, false);
    showToast("success", `Vorlage „${preset.label}" angewendet ✓`);
  }

  async function applyCmsTemplate(pack: typeof CMS_TEMPLATE_PACKS[number]) {
    const next: LinktreeConfig = { ...DEFAULT_CONFIG, ...config, ...pack.config, colorScheme: pack.key };
    setTheme(pack.theme); setPrimaryColor(pack.primaryColor); setConfig(next);
    await saveDesign(pack.theme, pack.primaryColor, next, false);
    showToast("success", `Paket „${pack.name}" angewendet`);
  }

  function applyBrandColors() {
    if (!brandColors.primary) return;
    const next: LinktreeConfig = {
      ...config,
      colorScheme: "brand",
      ctaColor: brandColors.accent || undefined,
    };
    setConfig(next);
    setPrimaryColor(brandColors.primary);
    saveDesign(theme, brandColors.primary, next, false);
    showToast("success", "Markenfarben aus den Einstellungen übernommen");
  }

  function applyColorScheme(palette: typeof COLOR_PALETTES[number]) {
    const next = { ...config, colorScheme: palette.key };
    setConfig(next); setPrimaryColor(palette.primary); setTheme(palette.theme);
    saveDesign(palette.theme, palette.primary, next, true);
  }

  function updateConfig(field: keyof LinktreeConfig, value: string | boolean | undefined) {
    const next = { ...config, [field]: value };
    setConfig(next);
    saveDesign(theme, primaryColor, next, true);
  }

  function updateTheme(t: Theme) { setTheme(t); saveDesign(t, primaryColor, config, true); }
  function updateColor(c: string) { setPrimaryColor(c); saveDesign(theme, c, config, true); }

  async function loadLinks() {
    setLoading(true);
    try {
      const res = await api.get("/admin/links");
      setLinks(res.data);
    } catch { showToast("error", "Fehler beim Laden der Links"); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    setSaving(true);
    try {
      const res = await api.post("/admin/links", {
        title: newTitle.trim(),
        url: newUrl.trim().startsWith("http") ? newUrl.trim() : `https://${newUrl.trim()}`,
        iconType: newIcon,
      });
      setLinks((prev) => [...prev, res.data]);
      setNewTitle(""); setNewUrl(""); setNewIcon("Instagram");
      setShowAddForm(false);
      showToast("success", `„${newTitle.trim()}" hinzugefügt`);
    } catch { showToast("error", "Fehler beim Anlegen des Links"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`„${title}" wirklich löschen?`)) return;
    try {
      await api.delete(`/admin/links/${id}`);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      showToast("success", `„${title}" gelöscht`);
    } catch { showToast("error", "Fehler beim Löschen"); }
  }

  function startEdit(link: LinkItem) {
    setEditingId(link.id); setEditTitle(link.title); setEditUrl(link.url); setEditIcon(link.iconType);
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    try {
      const trimmed = editUrl.trim();
      const normalizedUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      const res = await api.put(`/admin/links/${id}`, { title: editTitle.trim(), url: normalizedUrl, iconType: editIcon });
      setLinks((prev) => prev.map((l) => (l.id === id ? res.data : l)));
      setEditingId(null);
      showToast("success", "Link gespeichert");
    } catch { showToast("error", "Fehler beim Speichern"); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(link: LinkItem) {
    try {
      const res = await api.put(`/admin/links/${link.id}`, { isActive: !link.isActive });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? res.data : l)));
      showToast("success", link.isActive ? "Link deaktiviert" : "Link aktiviert");
    } catch { showToast("error", "Fehler beim Aktualisieren"); }
  }

  async function moveLink(index: number, direction: "up" | "down") {
    const newLinks = [...links];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLinks.length) return;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    setLinks(newLinks);
    try { await api.patch("/admin/links/reorder", newLinks.map((l) => l.id)); }
    catch { showToast("error", "Fehler beim Sortieren"); }
  }

  const previewUrl = tenantSlug ? `/booking/${tenantSlug}` : null;
  const previewDeviceStyle: Record<PreviewDevice, { width: string; label: string }> = {
    mobile: { width: "390px", label: "Mobile" },
    tablet: { width: "768px", label: "Tablet" },
    desktop: { width: "100%", label: "Desktop" },
  };

  // ── Shared input class ─────────────────────────────────────────────────────
  const inputCls = "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

  return (
    <div className="min-h-screen bg-[#F7F7F8] lg:flex lg:flex-row lg:overflow-hidden lg:h-screen">

      {/* ── Toast Stack ────────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id}
              initial={{ opacity: 0, x: 48, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium pointer-events-auto max-w-xs border ${
                toast.type === "success"
                  ? "bg-white border-[#D1FAE5] text-[#065F46]"
                  : "bg-white border-[#FEE2E2] text-[#991B1B]"
              }`}
            >
              {toast.type === "success"
                ? <CheckCircle2 size={15} className="text-[#10B981] shrink-0" />
                : <AlertCircle size={15} className="text-[#EF4444] shrink-0" />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── QR Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showQR && tenantSlug && (() => {
          const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/booking/${tenantSlug}`;
          const handleCopy = () => {
            navigator.clipboard.writeText(bookingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          };
          const handleDownload = () => {
            const svg = document.getElementById("qr-svg");
            if (!svg) return;
            const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
            a.download = `${tenantSlug}-qrcode.svg`; a.click();
          };
          return (
            <motion.div key="qr-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowQR(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="bg-white rounded-3xl shadow-2xl shadow-black/10 p-7 w-full max-w-sm flex flex-col items-center gap-5 border border-[#E5E7EB]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="font-semibold text-[#111318] text-base">QR-Code</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Zum Scannen & Teilen</p>
                  </div>
                  <button onClick={() => setShowQR(false)}
                    className="text-[#9CA3AF] hover:text-[#374151] p-1.5 hover:bg-[#F3F4F6] rounded-xl transition-colors">
                    <X size={17} />
                  </button>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB]">
                  <QRCodeSVG id="qr-svg" value={bookingUrl} size={200} fgColor="#111318" bgColor="#ffffff" level="M" />
                </div>
                <div className="w-full bg-[#F7F7F8] rounded-xl px-3 py-2.5 flex items-center gap-2 border border-[#E5E7EB]">
                  <p className="flex-1 text-xs text-[#6B7280] truncate font-mono">{bookingUrl}</p>
                  <button onClick={handleCopy}
                    className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                      copied ? "bg-[#D1FAE5] text-[#065F46]" : "bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F7F7F8]"
                    }`}>
                    {copied ? <><CheckIcon size={11} />Kopiert</> : <><Copy size={11} />Kopieren</>}
                  </button>
                </div>
                <button onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[#6355E4] text-white hover:bg-[#4338CA] transition-colors">
                  <Download size={14} />SVG herunterladen
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT EDITOR PANEL
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:w-[500px] lg:flex-shrink-0 lg:overflow-y-auto lg:h-full p-5 sm:p-6">
        <div className="max-w-2xl mx-auto">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-7">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-[22px] font-bold text-[#111318] tracking-tight">Meine Links</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#6355E4] text-white px-2.5 py-0.5 rounded-full">
                  <Sparkles size={8} />Live
                </span>
              </div>
              <p className="text-sm text-[#6B7280]">Profil & Design deiner öffentlichen Buchungsseite</p>
            </div>
            <div className="flex items-center gap-2">
              {tenantSlug && (
                <button onClick={() => setShowQR(true)}
                  className="flex items-center gap-1.5 text-sm bg-white text-[#374151] px-3 py-2 rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] hover:text-[#6355E4] transition-all">
                  <QrCode size={14} /><span className="hidden sm:inline">QR-Code</span>
                </button>
              )}
              {tenantSlug && (
                <>
                  <button onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-1.5 text-sm bg-white text-[#374151] px-3 py-2 rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] hover:text-[#6355E4] transition-all lg:hidden">
                    <Eye size={14} /><span className="hidden sm:inline">Vorschau</span>
                  </button>
                  <a href={`/booking/${tenantSlug}`} target="_blank" rel="noopener noreferrer"
                    className="hidden lg:flex items-center gap-1.5 text-sm bg-white text-[#374151] px-3 py-2 rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] hover:text-[#6355E4] transition-all">
                    <ExternalLink size={14} />Seite öffnen
                  </a>
                </>
              )}
              <ShimmerButton
                onClick={() => { setShowAddForm(true); setEditingId(null); }}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-[#6355E4] text-white hover:bg-[#4338CA]"
                shimmerDuration="2.5s"
              >
                <Plus size={15} />Link hinzufügen
              </ShimmerButton>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              DESIGN ACCORDION
          ══════════════════════════════════════════════════════════════════ */}
          <div className="mb-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <button
              onClick={() => setDesignOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F7F7F8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#6355E4] flex items-center justify-center shadow-sm flex-shrink-0">
                  <Palette size={14} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#111318] text-sm leading-tight">Seiten-Design</p>
                  {!designOpen && (
                    <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Template · Farben · Layout · Animationen</p>
                  )}
                </div>
                {designSaving && <Loader2 size={12} className="animate-spin text-[#6355E4] ml-1" />}
              </div>
              <ChevronDown size={15} className={`text-[#9CA3AF] transition-transform duration-200 ${designOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {designOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[#F3F4F6] px-5 pb-6 space-y-6 pt-5">

                    {/* ── Markenfarben aus den Einstellungen ──────────────── */}
                    <div>
                      <SectionLabel icon={<Pipette size={13} />}>Markenfarben</SectionLabel>
                      <div className="flex items-center justify-between gap-3 p-3.5 bg-[#F7F7F8] rounded-xl border border-[#F3F4F6]">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex -space-x-1.5 flex-shrink-0">
                            {[brandColors.primary, brandColors.secondary, brandColors.accent].filter(Boolean).map((c, i) => (
                              <span key={i} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#111318]">Farben aus den Einstellungen</p>
                            <p className="text-[10px] text-[#9CA3AF] truncate">
                              Primär-, Sekundär- & Akzentfarbe deines Studios ·{" "}
                              <a href="/admin/settings" className="underline hover:text-[#6355E4]">bearbeiten</a>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={applyBrandColors}
                          disabled={!brandColors.primary}
                          className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl bg-[#6355E4] text-white hover:bg-[#4338CA] disabled:opacity-40 transition-colors"
                        >
                          Übernehmen
                        </button>
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] mt-1.5">
                        Primärfarbe wird zur Seitenfarbe, Akzentfarbe zum Buchungsbutton
                      </p>
                    </div>

                    {/* ── CMS Template Packs ──────────────────────────────── */}
                    <div className="border-t border-[#F3F4F6] pt-5">
                      <SectionLabel icon={<Sparkles size={13} />}>Fertige Pakete</SectionLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {CMS_TEMPLATE_PACKS.map((pack) => {
                          const isActive = (config.colorScheme ?? "") === pack.key;
                          return (
                            <button key={pack.key} onClick={() => applyCmsTemplate(pack)}
                              className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                                isActive
                                  ? "border-[#A5B4FC] bg-[#EEEBFC] ring-1 ring-[#6355E4]/30"
                                  : "border-[#E5E7EB] bg-white hover:border-[#C7D2FE] hover:shadow-sm"
                              }`}
                            >
                              <motion.div aria-hidden
                                className="absolute -right-4 -top-4 h-14 w-14 rounded-xl opacity-20"
                                style={{ background: pack.primaryColor }}
                                animate={{ rotateX: [0, 15, 0], rotateY: [0, -18, 0], y: [0, 3, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                              />
                              <div className="relative flex items-start gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                                  style={{ background: `${pack.primaryColor}18`, color: pack.primaryColor }}>
                                  {pack.icon}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-[#111318]">{pack.name}</p>
                                  <p className="mt-0.5 text-[10px] leading-snug text-[#9CA3AF]">{pack.desc}</p>
                                </div>
                              </div>
                              <div className="relative mt-3 flex items-center gap-1.5">
                                {[pack.primaryColor, "#ffffff", "#111318"].map((c) => (
                                  <span key={c} className="h-2.5 w-2.5 rounded-full border border-[#E5E7EB]" style={{ background: c }} />
                                ))}
                                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                                  {(pack.config.pageTemplate ?? "classic").toString()}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] mt-2">Komplettes Seiten-Design in einem Klick: Layout, Farben, Animation und CTA</p>
                    </div>

                    {/* ── Seitenvorlage ───────────────────────────────────── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <SectionLabel icon={<LayoutGrid size={13} />}>Seitenvorlage</SectionLabel>
                        <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
                          {PAGE_TEMPLATES.length} Designs
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {PAGE_TEMPLATES.map((tpl) => {
                          const isActive = (config.pageTemplate ?? "classic") === tpl.key;
                          const isLocked = PLAN_ORDER[tpl.plan] > PLAN_ORDER[tenantPlan];
                          const visual = TPL_VISUAL[tpl.key as PageTemplate] ?? { bg: "#F7F7F8", accent: "#6355E4" };
                          return (
                            <MagicCard
                              key={tpl.key}
                              gradientColor={visual.accent}
                              gradientOpacity={isLocked ? 0 : 0.15}
                              gradientSize={100}
                              className={`relative flex flex-col rounded-xl border transition-all overflow-hidden text-left cursor-pointer ${
                                isActive
                                  ? "border-[#A5B4FC] ring-2 ring-[#6355E4]/20 shadow-sm"
                                  : isLocked
                                  ? "border-[#F3F4F6] opacity-45 cursor-not-allowed"
                                  : "border-[#E5E7EB] hover:border-[#C7D2FE]"
                              }`}
                              onClick={() => !isLocked && updateConfig("pageTemplate", tpl.key)}
                            >
                              <div className="w-full h-[54px] flex flex-col items-center justify-center gap-[3px] relative overflow-hidden"
                                style={{ background: visual.bg }}>
                                <div className="w-[13px] h-[13px] rounded-full shadow-sm" style={{ background: visual.accent }} />
                                <div className="h-[3px] w-7 rounded-full" style={{ background: visual.accent, opacity: 0.55 }} />
                                <div className="h-[5px] w-9 rounded-md" style={{ background: visual.accent, opacity: 0.38 }} />
                                <div className="absolute top-1 left-1.5 text-[10px] leading-none">{tpl.emoji}</div>
                                {isActive && (
                                  <div className="absolute top-1 right-1 w-[13px] h-[13px] bg-[#6355E4] rounded-full flex items-center justify-center">
                                    <Check size={7} className="text-white" strokeWidth={3} />
                                  </div>
                                )}
                                {isLocked && (
                                  <div className="absolute inset-0 bg-white/55 backdrop-blur-[1px] flex items-center justify-center">
                                    <span className="text-[8px] font-bold bg-[#111318] text-white px-1.5 py-0.5 rounded-full">
                                      {tpl.plan === "pro" ? "PRO" : "BIZ"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className={`px-2 py-1.5 ${isActive ? "bg-[#EEEBFC]" : "bg-white"} transition-colors`}>
                                <p className="text-[10px] font-bold text-[#111318] leading-tight">{tpl.name}</p>
                                <p className="text-[9px] text-[#9CA3AF] leading-tight truncate">{tpl.desc}</p>
                              </div>
                            </MagicCard>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── CTA-Text ─────────────────────────────────────────── */}
                    <div className="border-t border-[#F3F4F6] pt-5">
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2 flex items-center gap-1.5">
                        <Type size={11} className="text-[#6355E4]" />CTA-Text (Buchungsbutton)
                      </p>
                      <input type="text" value={config.ctaText} onChange={(e) => updateConfig("ctaText", e.target.value)}
                        placeholder="Termin buchen" className={inputCls} />
                    </div>

                    {/* ── Erweiterte Optionen (eingeklappt) ───────────────── */}
                    <button
                      onClick={() => setShowAdvanced((v) => !v)}
                      className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] hover:border-[#C7D2FE] transition-all"
                    >
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#374151]">
                        <SlidersHorizontal size={13} className="text-[#6355E4]" />
                        Erweiterte Design-Optionen
                        <span className="text-[10px] font-normal text-[#9CA3AF]">Feintuning · Schrift · Layout · Buchungsflow</span>
                      </span>
                      <ChevronDown size={14} className={`text-[#9CA3AF] transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} />
                    </button>

                    {showAdvanced && (<>

                    {/* ── Template Feintuning ─────────────────────────────── */}
                    <div className="border-t border-[#F3F4F6] pt-5">
                      <SectionLabel icon={<SlidersHorizontal size={13} />}>Template-Feintuning</SectionLabel>
                      <div className="space-y-4">

                        <div>
                          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Hero-Stil</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["compact","editorial","immersive"] as const).map((v) => (
                              <OptionPill key={v} active={(config.heroStyle ?? "compact") === v} onClick={() => updateConfig("heroStyle", v)}>
                                {v === "compact" ? "Kompakt" : v === "editorial" ? "Editorial" : "Immersiv"}
                              </OptionPill>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Bild / Logo-Größe</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["sm","md","lg"] as const).map((v) => (
                              <OptionPill key={v} active={(config.mediaScale ?? "md") === v} onClick={() => updateConfig("mediaScale", v)}>
                                {v === "sm" ? "Klein" : v === "md" ? "Mittel" : "Groß"}
                              </OptionPill>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Button-Abstände</p>
                            <div className="flex flex-col gap-1.5">
                              {(["tight","normal","airy"] as const).map((v) => (
                                <OptionPill key={v} active={(config.buttonSpacing ?? "normal") === v} onClick={() => updateConfig("buttonSpacing", v)}>
                                  {v === "tight" ? "Eng" : v === "normal" ? "Normal" : "Luftig"}
                                </OptionPill>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Karten-Dichte</p>
                            <div className="flex flex-col gap-1.5">
                              {(["tight","normal","airy"] as const).map((v) => (
                                <OptionPill key={v} active={(config.cardDensity ?? "normal") === v} onClick={() => updateConfig("cardDensity", v)}>
                                  {v === "tight" ? "Dicht" : v === "normal" ? "Normal" : "Großzügig"}
                                </OptionPill>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Animation</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["off","subtle","strong"] as const).map((v) => (
                              <OptionPill key={v} active={(config.motionIntensity ?? "subtle") === v} onClick={() => updateConfig("motionIntensity", v)}>
                                {v === "off" ? "Aus" : v === "subtle" ? "Dezent" : "Stark"}
                              </OptionPill>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Startbereich</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["logo","cta","links"] as const).map((v) => (
                              <OptionPill key={v} active={(config.startFocus ?? "logo") === v} onClick={() => updateConfig("startFocus", v)}>
                                {v === "logo" ? "Logo zuerst" : v === "cta" ? "CTA zuerst" : "Links zuerst"}
                              </OptionPill>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Farbpalette ─────────────────────────────────────── */}
                    <div className="border-t border-[#F3F4F6] pt-5">
                      <SectionLabel icon={<Pipette size={13} />}>Farbpalette</SectionLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {COLOR_PALETTES.map((palette) => {
                          const isActive = (config.colorScheme ?? "auto") === palette.key;
                          return (
                            <button key={palette.key} onClick={() => applyColorScheme(palette)} title={palette.name}
                              className={`flex items-center gap-2 px-2 py-2 rounded-xl border transition-all ${
                                isActive
                                  ? "border-[#A5B4FC] ring-1 ring-[#6355E4]/25 bg-[#EEEBFC]"
                                  : "border-[#E5E7EB] bg-white hover:border-[#C7D2FE]"
                              }`}
                            >
                              <div className="w-6 h-6 rounded-lg flex-shrink-0 shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.bg})` }} />
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-[#111318] leading-tight truncate">{palette.name}</p>
                                <p className="text-[9px] text-[#9CA3AF] font-mono leading-tight">{palette.primary}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] mt-2">Oder wähle unten eine eigene Primärfarbe</p>
                    </div>

                    {/* ── Branchenvorlage ─────────────────────────────────── */}
                    <div className="border-t border-[#F3F4F6] pt-5">
                      <SectionLabel icon={<Sparkles size={13} />}>Branchenvorlage</SectionLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(INDUSTRY_PRESETS).map(([key, preset]) => {
                          const isActive = key === industryType;
                          return (
                            <button key={key} onClick={() => applyPreset(key)}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                                isActive
                                  ? "border-[#A5B4FC] bg-[#EEEBFC] ring-1 ring-[#6355E4]/25"
                                  : "border-[#E5E7EB] bg-white hover:border-[#C7D2FE]"
                              }`}
                            >
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                                style={{ background: `${preset.color}18`, border: `1.5px solid ${preset.color}44` }}>
                                {preset.emoji}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-[#111318] leading-tight truncate">{preset.label}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <div className="w-2 h-2 rounded-full" style={{ background: preset.color }} />
                                  <span className="text-[9px] text-[#9CA3AF] font-mono truncate">{preset.color}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Hintergrund-Theme ────────────────────────────────── */}
                    <div className="border-t border-[#F3F4F6] pt-5">
                      <SectionLabel icon={<Palette size={13} />}>Hintergrund-Theme</SectionLabel>
                      <div className="grid grid-cols-5 gap-1.5">
                        {THEMES.map((t) => {
                          const bgPrev = t.value === "dark"
                            ? "linear-gradient(135deg, #0f0f1a, #1a1a2e)"
                            : t.value === "minimal" ? "#ffffff"
                            : t.value === "bold" ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)`
                            : t.value === "glass" ? `linear-gradient(135deg, ${primaryColor}44, ${primaryColor}22)`
                            : `linear-gradient(135deg, ${primaryColor}33, #fff)`;
                          return (
                            <button key={t.value} onClick={() => updateTheme(t.value)}
                              className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all ${
                                theme === t.value ? "ring-2 ring-[#6355E4]/50 ring-offset-1" : "hover:opacity-80"
                              }`}>
                              <div className="w-full h-9 rounded-lg"
                                style={{ background: bgPrev, border: t.value === "minimal" ? "1px solid #E5E7EB" : "none" }} />
                              <span className={`text-[10px] font-semibold ${theme === t.value ? "text-[#6355E4]" : "text-[#9CA3AF]"}`}>
                                {t.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Primärfarbe ──────────────────────────────────────── */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5 flex items-center gap-1.5">
                        <Pipette size={11} className="text-[#6355E4]" />Primärfarbe
                      </p>
                      <div className="flex items-center gap-3">
                        <input type="color" value={primaryColor} onChange={(e) => updateColor(e.target.value)}
                          className="w-9 h-9 rounded-xl cursor-pointer border-2 border-[#E5E7EB] shadow-sm overflow-hidden"
                          style={{ padding: "2px" }} />
                        <div className="flex gap-1.5 flex-wrap">
                          {["#E8C7C3","#C9A96E","#2C3E50","#6B8E7F","#D4A5C9","#4A90D9","#1A1A2E","#E74C3C","#2ECC71","#9B59B6","#F39C12","#1ABC9C"].map((c) => (
                            <button key={c} onClick={() => updateColor(c)}
                              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${primaryColor === c ? "border-[#6355E4] scale-110" : "border-white shadow-sm"}`}
                              style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── Hintergrundmuster ────────────────────────────────── */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Hintergrundmuster</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {([
                          { v: "none",    icon: <Minus size={13} />,     label: "Keins"  },
                          { v: "dots",    icon: <Circle size={13} />,    label: "Punkte" },
                          { v: "waves",   icon: <span className="text-xs">〜</span>, label: "Wellen" },
                          { v: "grid",    icon: <Grid3x3 size={13} />,   label: "Raster" },
                          { v: "circles", icon: <Circle size={15} />,    label: "Kreise" },
                        ] as const).map(({ v, icon, label }) => (
                          <OptionPill key={v} active={config.bgPattern === v} onClick={() => updateConfig("bgPattern", v)}
                            className="flex-col gap-0.5 px-3 py-2">
                            {icon}<span>{label}</span>
                          </OptionPill>
                        ))}
                      </div>
                    </div>

                    {/* ── Button-Form ──────────────────────────────────────── */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Button-Form</p>
                      <div className="flex gap-2">
                        {([
                          { v: "rounded", label: "Abgerundet", cls: "rounded-xl" },
                          { v: "pill",    label: "Pill",        cls: "rounded-full" },
                          { v: "square",  label: "Eckig",       cls: "rounded-none" },
                        ] as const).map(({ v, label, cls }) => (
                          <button key={v} onClick={() => updateConfig("buttonStyle", v)}
                            className={`flex-1 flex flex-col items-center gap-2 py-3 border text-xs font-medium transition-all ${cls} ${
                              config.buttonStyle === v
                                ? "bg-[#EEEBFC] border-[#A5B4FC] text-[#6355E4]"
                                : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#C7D2FE]"
                            }`}
                          >
                            <div className={`w-12 h-4 ${cls}`} style={{ background: primaryColor, opacity: 0.65 }} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Schriftart ───────────────────────────────────────── */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Schriftart</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {([
                          { v: "inter",      label: "Inter",      font: "sans-serif" },
                          { v: "playfair",   label: "Playfair",   font: "'Playfair Display', serif" },
                          { v: "montserrat", label: "Montserrat", font: "'Montserrat', sans-serif" },
                          { v: "dm-serif",   label: "DM Serif",   font: "'DM Serif Display', serif" },
                          { v: "josefin",    label: "Josefin",    font: "'Josefin Sans', sans-serif" },
                        ] as const).map(({ v, label, font }) => (
                          <button key={v} onClick={() => updateConfig("fontFamily", v)}
                            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all ${
                              (config.fontFamily ?? "inter") === v
                                ? "bg-[#EEEBFC] border-[#A5B4FC] ring-1 ring-[#6355E4]/20"
                                : "bg-white border-[#E5E7EB] hover:border-[#C7D2FE]"
                            }`}
                            style={{ fontFamily: font }}
                          >
                            <span className="text-sm font-semibold text-[#111318]">Aa</span>
                            <span className="text-[9px] text-[#9CA3AF] leading-tight">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Button-Farbe ─────────────────────────────────────── */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2 flex items-center gap-1.5">
                        <Pipette size={11} className="text-[#6355E4]" />Button-Farbe <span className="text-[#9CA3AF] font-normal">(optional)</span>
                      </p>
                      <div className="flex items-center gap-3">
                        <input type="color" value={config.ctaColor ?? primaryColor} onChange={(e) => updateConfig("ctaColor", e.target.value)}
                          className="w-9 h-9 rounded-xl cursor-pointer border-2 border-[#E5E7EB] shadow-sm overflow-hidden"
                          style={{ padding: "2px" }} />
                        <div className="flex gap-1.5 flex-wrap">
                          {["#ffffff","#111318","#C9A96E","#E74C3C","#2ECC71","#4A90D9"].map((c) => (
                            <button key={c} onClick={() => updateConfig("ctaColor", c)}
                              className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${config.ctaColor === c ? "border-[#6355E4] scale-110" : "border-white shadow-sm"}`}
                              style={{ background: c }} />
                          ))}
                        </div>
                        {config.ctaColor && (
                          <button onClick={() => updateConfig("ctaColor", undefined)}
                            className="text-[10px] text-[#9CA3AF] hover:text-[#374151] underline transition-colors">
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Avatar-Form ──────────────────────────────────────── */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Avatar-Form</p>
                      <div className="flex gap-2">
                        {([
                          { v: "circle",  label: "Kreis",     r: "9999px" },
                          { v: "rounded", label: "Abgerundet", r: "12px"   },
                          { v: "square",  label: "Quadrat",    r: "3px"    },
                        ] as const).map(({ v, label, r }) => (
                          <button key={v} onClick={() => updateConfig("avatarShape", v)}
                            className={`flex-1 flex flex-col items-center gap-2 py-3 border rounded-xl text-xs font-medium transition-all ${
                              (config.avatarShape ?? "circle") === v
                                ? "bg-[#EEEBFC] border-[#A5B4FC] text-[#6355E4]"
                                : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#C7D2FE]"
                            }`}
                          >
                            <div className="w-7 h-7 border-2 border-current opacity-50" style={{ borderRadius: r }} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Karten-Stil ──────────────────────────────────────── */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Link-Karten Stil</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([
                          { v: "filled",   label: "Filled",   cls: "bg-white shadow-sm border border-[#E5E7EB]" },
                          { v: "outlined", label: "Outlined", cls: "bg-transparent border-2 border-[#D1D5DB]" },
                          { v: "gradient", label: "Gradient", cls: "bg-gradient-to-r from-[#F3F4F6] to-white border border-[#E5E7EB]" },
                          { v: "ghost",    label: "Ghost",    cls: "bg-transparent" },
                        ] as const).map(({ v, label, cls }) => (
                          <button key={v} onClick={() => updateConfig("cardStyle", v)}
                            className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                              (config.cardStyle ?? "filled") === v
                                ? "border-[#A5B4FC] bg-[#EEEBFC] text-[#6355E4]"
                                : "border-[#E5E7EB] text-[#6B7280] bg-white hover:border-[#C7D2FE]"
                            }`}
                          >
                            <div className={`w-9 h-4 rounded-lg ${cls}`} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Layout ───────────────────────────────────────────── */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Layout</p>
                      <div className="flex gap-2">
                        <OptionPill active={(config.layoutMode ?? "list") === "list"} onClick={() => updateConfig("layoutMode", "list")} className="flex-1 justify-center gap-2 flex items-center">
                          <LayoutList size={13} />Liste
                        </OptionPill>
                        <OptionPill active={(config.layoutMode ?? "list") === "grid"} onClick={() => updateConfig("layoutMode", "grid")} className="flex-1 justify-center gap-2 flex items-center">
                          <LayoutGrid size={13} />Grid (Bento)
                        </OptionPill>
                      </div>
                    </div>

                    {/* ── Animationsgeschwindigkeit ────────────────────────── */}
                    <div>
                      <p className="text-[11px] font-semibold text-[#6B7280] mb-2 flex items-center gap-1.5">
                        <Wind size={11} className="text-[#6355E4]" />Animationsgeschwindigkeit
                      </p>
                      <div className="flex gap-1.5">
                        {(["none","slow","normal","fast"] as const).map((v) => (
                          <OptionPill key={v} active={(config.animationSpeed ?? "normal") === v} onClick={() => updateConfig("animationSpeed", v)} className="flex-1 justify-center">
                            {v === "none" ? "Keine" : v === "slow" ? "Langsam" : v === "normal" ? "Normal" : "Schnell"}
                          </OptionPill>
                        ))}
                      </div>
                    </div>

                    {/* ── Toggles ──────────────────────────────────────────── */}
                    <div className="space-y-2">
                      {[
                        {
                          icon: <Smile size={13} className="text-[#9CA3AF]" />,
                          label: "Willkommensnachricht",
                          hint: "Tagline unterhalb des Profilbilds",
                          value: config.showWelcome ?? false,
                          onToggle: () => updateConfig("showWelcome", !config.showWelcome),
                        },
                        {
                          icon: <Zap size={13} className="text-[#9CA3AF]" />,
                          label: "Konfetti beim Buchen",
                          hint: "Kurze Feier-Animation beim CTA-Klick",
                          value: config.confetti ?? false,
                          onToggle: () => updateConfig("confetti", !config.confetti),
                        },
                      ].map(({ icon, label, hint, value, onToggle }) => (
                        <div key={label} className="flex items-center justify-between py-3 px-3.5 bg-[#F7F7F8] rounded-xl border border-[#F3F4F6]">
                          <div className="flex items-center gap-2.5">
                            {icon}
                            <div>
                              <p className="text-xs font-semibold text-[#111318]">{label}</p>
                              <p className="text-[10px] text-[#9CA3AF]">{hint}</p>
                            </div>
                          </div>
                          <Toggle on={value} onToggle={onToggle} />
                        </div>
                      ))}
                    </div>

                    {/* ── Buchungsflow gestalten ───────────────────────────── */}
                    <div className="border-t border-[#F3F4F6] pt-5">
                      <SectionLabel icon={<Calendar size={13} />}>Buchungsflow gestalten</SectionLabel>

                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Buchungs-Hintergrund</p>
                          <div className="flex gap-2">
                            {([
                              { v: "light",   label: "Hell",    cls: "bg-gradient-to-br from-[#F3F4F6] to-white" },
                              { v: "dark",    label: "Dunkel",  cls: "" },
                              { v: "branded", label: "Branded", cls: "" },
                            ] as const).map(({ v, label, cls }) => (
                              <button key={v} onClick={() => updateConfig("bookingTheme", v)}
                                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 border rounded-xl text-xs font-medium transition-all ${
                                  (config.bookingTheme ?? "light") === v
                                    ? "border-[#A5B4FC] bg-[#EEEBFC] text-[#6355E4]"
                                    : "border-[#E5E7EB] text-[#6B7280] bg-white hover:border-[#C7D2FE]"
                                }`}
                              >
                                <div className={`w-11 h-5 rounded-lg border border-[#E5E7EB] ${cls}`}
                                  style={v === "dark" ? { background: "linear-gradient(135deg, #1a1a2e, #0f3460)" }
                                    : v === "branded" ? { background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)` } : {}} />
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Service-Ansicht</p>
                          <div className="flex gap-2">
                            <OptionPill active={(config.serviceLayout ?? "list") === "list"} onClick={() => updateConfig("serviceLayout", "list")} className="flex-1 justify-center gap-2 flex items-center">
                              <LayoutList size={13} />Liste
                            </OptionPill>
                            <OptionPill active={(config.serviceLayout ?? "list") === "cards"} onClick={() => updateConfig("serviceLayout", "cards")} className="flex-1 justify-center gap-2 flex items-center">
                              <LayoutGrid size={13} />Karten
                            </OptionPill>
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-3 px-3.5 bg-[#F7F7F8] rounded-xl border border-[#F3F4F6]">
                          <div>
                            <p className="text-xs font-semibold text-[#111318]">Preise anzeigen</p>
                            <p className="text-[10px] text-[#9CA3AF]">Im Service-Schritt des Buchungsflows</p>
                          </div>
                          <Toggle on={config.showPrices ?? true} onToggle={() => updateConfig("showPrices", !(config.showPrices ?? true))} />
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold text-[#6B7280] mb-2 flex items-center gap-1.5">
                            <Sparkles size={11} className="text-[#6355E4]" />Button-Badge <span className="text-[#9CA3AF] font-normal">(optional)</span>
                          </p>
                          <input type="text" value={config.ctaBadge ?? ""}
                            onChange={(e) => updateConfig("ctaBadge", e.target.value)}
                            placeholder='z.B. "Kostenlos" oder "Neu"'
                            className={inputCls} />
                          <p className="text-[10px] text-[#9CA3AF] mt-1.5">Erscheint als kleines Badge am Buchungsbutton</p>
                        </div>
                      </div>
                    </div>

                    </>)}

                    {/* Vorschau mobile link */}
                    {tenantSlug && (
                      <button onClick={() => setShowPreviewModal(true)}
                        className="flex items-center gap-1.5 text-xs text-[#6355E4] hover:underline font-medium lg:hidden">
                        <Eye size={12} />Vorschau öffnen
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              ADD LINK FORM
          ══════════════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="mb-4 bg-white rounded-2xl border border-[#C7D2FE] shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-[#111318] text-sm">Neuer Link</p>
                  <button onClick={() => setShowAddForm(false)}
                    className="text-[#9CA3AF] hover:text-[#374151] p-1 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                    <X size={15} />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                      className="flex-shrink-0 border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all">
                      {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titel (z.B. Instagram)" autoFocus
                      className={`flex-1 ${inputCls}`} />
                  </div>
                  <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://www.instagram.com/..."
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()} className={inputCls} />
                  <div className="flex gap-2 justify-end pt-1">
                    <button onClick={() => { setShowAddForm(false); setNewTitle(""); setNewUrl(""); }}
                      className="px-4 py-2 text-sm rounded-xl bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] font-medium transition-colors">
                      Abbrechen
                    </button>
                    <ShimmerButton onClick={handleCreate} disabled={saving || !newTitle.trim() || !newUrl.trim()}
                      className="px-5 py-2 text-sm rounded-xl disabled:opacity-40 flex items-center gap-1.5 bg-[#6355E4] text-white hover:bg-[#4338CA]"
                      shimmerDuration="2.5s">
                      {saving
                        ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <Plus size={13} />}
                      Hinzufügen
                    </ShimmerButton>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════════════════════════════════════════════════════════════
              FIXED BOOKING BUTTON
          ══════════════════════════════════════════════════════════════════ */}
          <div className="relative bg-white rounded-2xl border border-[#E5E7EB] shadow-sm mb-3 overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#6355E4] rounded-l-2xl" />
            <div className="flex items-center gap-3 px-4 py-3.5 pl-5">
              <div className="flex-shrink-0 text-[#D1D5DB]"><GripVertical size={15} /></div>
              <div className="flex-shrink-0 p-2 rounded-xl bg-[#EEEBFC] text-[#6355E4]">
                <Calendar size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#111318] text-sm">{config.ctaText || "Termin buchen"}</p>
                <p className="text-xs text-[#9CA3AF]">Immer erster Link · wird automatisch angeheftet</p>
              </div>
              <span className="text-[10px] bg-[#F3F4F6] text-[#6B7280] px-2.5 py-1 rounded-lg font-semibold">Fest</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              LINKS LIST
          ══════════════════════════════════════════════════════════════════ */}
          {loading ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <div className="inline-block w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin mb-3" />
              <p className="text-sm">Lade Links…</p>
            </div>
          ) : links.length === 0 && !showAddForm ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-14 bg-white rounded-2xl border border-dashed border-[#E5E7EB]">
              <Link2 size={32} className="text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-[#111318] font-semibold text-sm">Noch keine Links</p>
              <p className="text-sm text-[#9CA3AF] mt-1 mb-5">Füge Instagram, WhatsApp oder andere Links hinzu</p>
              <button onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 text-sm bg-[#6355E4] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#4338CA] transition-colors">
                <Plus size={13} />Ersten Link hinzufügen
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {links.map((link, i) => (
                  <motion.div key={link.id} layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: link.isActive ? 1 : 0.5, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                    className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden hover:border-[#C7D2FE] hover:shadow-md transition-all duration-200"
                  >
                    {editingId === link.id ? (
                      <div className="p-4 flex flex-col gap-3">
                        <div className="flex gap-2">
                          <select value={editIcon} onChange={(e) => setEditIcon(e.target.value)}
                            className="flex-shrink-0 border border-[#E5E7EB] rounded-xl px-2 py-2 text-sm bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all">
                            {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titel" autoFocus
                            className={`flex-1 ${inputCls}`} />
                        </div>
                        <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..."
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(link.id)} className={inputCls} />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-sm rounded-xl bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] font-medium transition-colors">
                            Abbrechen
                          </button>
                          <button onClick={() => handleSaveEdit(link.id)} disabled={saving}
                            className="px-4 py-2 text-sm rounded-xl bg-[#6355E4] text-white font-semibold hover:bg-[#4338CA] disabled:opacity-40 flex items-center gap-1.5 transition-colors">
                            {saving
                              ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              : <Check size={13} />}
                            Speichern
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button onClick={() => moveLink(i, "up")} disabled={i === 0}
                            className="text-[#D1D5DB] hover:text-[#374151] disabled:opacity-20 transition-colors">
                            <ArrowUp size={12} />
                          </button>
                          <button onClick={() => moveLink(i, "down")} disabled={i === links.length - 1}
                            className="text-[#D1D5DB] hover:text-[#374151] disabled:opacity-20 transition-colors">
                            <ArrowDown size={12} />
                          </button>
                        </div>
                        <div className="flex-shrink-0 p-2 rounded-xl bg-[#F3F4F6] text-[#6B7280]">
                          {ICON_MAP[link.iconType] ?? <ExternalLink size={17} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#111318] text-sm truncate">{link.title}</p>
                          <p className="text-xs text-[#9CA3AF] truncate">{link.url}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => handleToggleActive(link)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                              link.isActive
                                ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0]"
                                : "bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#E5E7EB]"
                            }`}>
                            {link.isActive ? "Aktiv" : "Aus"}
                          </button>
                          <button onClick={() => startEdit(link)}
                            className="p-1.5 text-[#9CA3AF] hover:text-[#6355E4] hover:bg-[#EEEBFC] transition-all rounded-lg">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(link.id, link.title)}
                            className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEE2E2] transition-all rounded-lg">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {links.length > 0 && (
            <p className="text-xs text-center text-[#9CA3AF] mt-4">
              {links.filter((l) => l.isActive).length} von {links.length} Links aktiv
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PREVIEW PANEL (desktop)
      ══════════════════════════════════════════════════════════════════════ */}
      {previewUrl && (
        <div className="hidden lg:flex flex-col flex-1 bg-[#EDEDEE] p-6 h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FC5F56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FDBC2C]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#29C940]" />
              </div>
              <div className="h-4 w-px bg-[#D1D5DB] mx-1" />
              <span className="text-xs font-semibold text-[#6B7280]">Live-Vorschau</span>
              {designSaving && <Loader2 size={11} className="animate-spin text-[#6355E4]" />}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-white border border-[#E5E7EB] shadow-sm p-1">
                {([
                  { v: "mobile",  icon: Smartphone },
                  { v: "tablet",  icon: Tablet },
                  { v: "desktop", icon: Monitor },
                ] as const).map(({ v, icon: Icon }) => (
                  <button key={v} onClick={() => setPreviewDevice(v)} title={previewDeviceStyle[v].label}
                    className={`p-1.5 rounded-lg transition-all ${
                      previewDevice === v ? "bg-[#EEEBFC] text-[#6355E4]" : "text-[#9CA3AF] hover:text-[#374151]"
                    }`}>
                    <Icon size={13} />
                  </button>
                ))}
              </div>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#111318] transition-colors bg-white border border-[#E5E7EB] shadow-sm px-2.5 py-1.5 rounded-xl">
                <ExternalLink size={11} />Öffnen
              </a>
            </div>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden bg-white shadow-xl border border-[#E5E7EB] flex flex-col">
            <div className="flex-shrink-0 h-9 bg-[#F3F4F6] border-b border-[#E5E7EB] flex items-center px-3 gap-2">
              <div className="flex-1 bg-white rounded-md h-5 flex items-center px-2 border border-[#E5E7EB]">
                <p className="text-[10px] text-[#9CA3AF] truncate font-mono">
                  {typeof window !== "undefined" ? window.location.origin : ""}{previewUrl}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex justify-center bg-[#F7F7F8] transition-all duration-300">
              <div className="h-full overflow-hidden transition-all duration-300"
                style={{ width: previewDeviceStyle[previewDevice].width, maxWidth: "100%" }}>
                <iframe key={previewKey}
                  src={previewUrl ? `${previewUrl}?v=${previewKey}` : undefined}
                  className="w-full h-full" style={{ border: "none", minHeight: "100%" }}
                  title="Buchungsseite Vorschau" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Preview Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showPreviewModal && previewUrl && (
          <motion.div key="preview-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="flex flex-col bg-white rounded-t-3xl overflow-hidden flex-1 mt-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3F4F6]">
                <p className="font-semibold text-sm text-[#111318] flex items-center gap-2">
                  <Eye size={13} className="text-[#6355E4]" />Live-Vorschau
                </p>
                <button onClick={() => setShowPreviewModal(false)}
                  className="text-[#9CA3AF] hover:text-[#374151] p-1.5 hover:bg-[#F3F4F6] rounded-xl transition-colors">
                  <X size={17} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe key={previewKey}
                  src={previewUrl ? `${previewUrl}?v=${previewKey}` : undefined}
                  className="w-full h-full" style={{ border: "none", height: "100%" }}
                  title="Buchungsseite Vorschau" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
