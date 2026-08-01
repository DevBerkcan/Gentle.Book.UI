// components/admin/links/constants.ts
// Static configuration data for the "Meine Links" editor — templates, packs, palettes, etc.
// Kept separate from components so both the editor and its pickers can import without cycles.
import type {
  BgPattern, ButtonStyle, LinktreeConfig, PageTemplate, PlanTier, Theme,
} from "./types";

export const DEFAULT_CONFIG: LinktreeConfig = {
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

export const INDUSTRY_PRESETS: Record<string, { color: string; style: Theme; emoji: string; label: string; ctaText: string; bgPattern: BgPattern; buttonStyle: ButtonStyle }> = {
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

export const COLOR_PALETTES: { key: string; name: string; primary: string; bg: string; theme: Theme }[] = [
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

export const PAGE_TEMPLATES: {
  key: PageTemplate; name: string; desc: string;
  plan: PlanTier;
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

export const PLAN_ORDER: Record<PlanTier, number> = { starter: 0, pro: 1, business: 2 };

/** Human-readable German label for a plan tier, used in upgrade hints. */
export const PLAN_LABEL: Record<PlanTier, string> = { starter: "Starter", pro: "Pro", business: "Agency" };

export const TPL_VISUAL: Record<PageTemplate, { bg: string; accent: string }> = {
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

export const CMS_TEMPLATE_PACKS: {
  key: string; name: string; desc: string; icon: string;
  primaryColor: string; theme: Theme; plan: PlanTier;
  config: LinktreeConfig;
}[] = [
  { key: "salon-launch", name: "Salon Launch", desc: "Friseur, Beauty, Nails", icon: "✂️", primaryColor: "#C9A96E", theme: "bold", plan: "starter",
    config: { pageTemplate: "beauty", fontFamily: "playfair", buttonStyle: "pill", cardStyle: "filled", bgPattern: "dots", layoutMode: "list", animationSpeed: "normal", ctaText: "Wunschtermin buchen", ctaBadge: "Beliebt", bookingTheme: "branded", serviceLayout: "cards", showPrices: true, showWelcome: true, heroStyle: "editorial", mediaScale: "lg", buttonSpacing: "airy", cardDensity: "normal", motionIntensity: "subtle", startFocus: "logo" } },
  { key: "barbershop-classic", name: "Barbershop Classic", desc: "Fade, Bart & klassische Rasur", icon: "🪒", primaryColor: "#C9A96E", theme: "bold", plan: "starter",
    config: { pageTemplate: "barbershop", fontFamily: "montserrat", buttonStyle: "square", cardStyle: "outlined", bgPattern: "grid", layoutMode: "list", animationSpeed: "normal", ctaText: "Rasur & Schnitt buchen", ctaBadge: "Direkt startklar", bookingTheme: "dark", serviceLayout: "cards", showPrices: true, showWelcome: true, heroStyle: "compact", mediaScale: "md", buttonSpacing: "normal", cardDensity: "normal", motionIntensity: "subtle", startFocus: "logo" } },
  { key: "hair-beauty-elegant", name: "Hair & Beauty Elegant", desc: "Friseur, Colorist, Styling", icon: "💇‍♀️", primaryColor: "#F9A8D4", theme: "gradient", plan: "starter",
    config: { pageTemplate: "soft", fontFamily: "playfair", buttonStyle: "pill", cardStyle: "filled", bgPattern: "dots", layoutMode: "list", animationSpeed: "slow", ctaText: "Wohlfühltermin buchen", ctaBadge: "Beliebt", bookingTheme: "branded", serviceLayout: "cards", showPrices: true, showWelcome: true, heroStyle: "editorial", mediaScale: "lg", buttonSpacing: "airy", cardDensity: "normal", motionIntensity: "subtle", startFocus: "logo" } },
  { key: "medical-trust", name: "Medical Trust", desc: "Praxis, Physio, Beratung", icon: "🏥", primaryColor: "#0EA5E9", theme: "minimal", plan: "starter",
    config: { pageTemplate: "clinic", fontFamily: "inter", buttonStyle: "rounded", cardStyle: "outlined", bgPattern: "grid", layoutMode: "list", animationSpeed: "slow", ctaText: "Termin vereinbaren", ctaBadge: "Online", bookingTheme: "light", serviceLayout: "list", showPrices: false, showWelcome: true, heroStyle: "compact", mediaScale: "md", buttonSpacing: "normal", cardDensity: "tight", motionIntensity: "subtle", startFocus: "cta" } },
  { key: "fitness-energy", name: "Fitness Energy", desc: "Gym, Coaching, Yoga", icon: "🔥", primaryColor: "#EF4444", theme: "dark", plan: "pro",
    config: { pageTemplate: "fitness", fontFamily: "montserrat", buttonStyle: "rounded", cardStyle: "gradient", bgPattern: "grid", layoutMode: "grid", animationSpeed: "fast", ctaText: "Training buchen", ctaBadge: "Neu", bookingTheme: "dark", serviceLayout: "cards", showPrices: true, showWelcome: false, confetti: true, heroStyle: "immersive", mediaScale: "lg", buttonSpacing: "airy", cardDensity: "normal", motionIntensity: "strong", startFocus: "cta" } },
  { key: "barber-dark-pro", name: "Barber Dark Pro", desc: "Edler Look für Premium-Barbershops", icon: "🖤", primaryColor: "#A855F7", theme: "dark", plan: "pro",
    config: { pageTemplate: "neon", fontFamily: "josefin", buttonStyle: "square", cardStyle: "outlined", bgPattern: "grid", layoutMode: "grid", animationSpeed: "normal", ctaText: "Premium-Slot sichern", ctaBadge: "Pro", bookingTheme: "dark", serviceLayout: "cards", showPrices: true, showWelcome: false, heroStyle: "immersive", mediaScale: "lg", buttonSpacing: "normal", cardDensity: "normal", motionIntensity: "strong", startFocus: "cta" } },
  { key: "food-reservation", name: "Food Reservation", desc: "Restaurant, Cafe, Bar", icon: "🍽️", primaryColor: "#B45309", theme: "bold", plan: "pro",
    config: { pageTemplate: "restaurant", fontFamily: "dm-serif", buttonStyle: "rounded", cardStyle: "filled", bgPattern: "none", layoutMode: "list", animationSpeed: "normal", ctaText: "Tisch reservieren", ctaBadge: "Heute", bookingTheme: "branded", serviceLayout: "cards", showPrices: true, showWelcome: true, heroStyle: "editorial", mediaScale: "md", buttonSpacing: "normal", cardDensity: "airy", motionIntensity: "subtle", startFocus: "cta" } },
  { key: "creator-pro", name: "Creator Pro", desc: "Coach, Portfolio, Beratung", icon: "◼", primaryColor: "#18181B", theme: "minimal", plan: "business",
    config: { pageTemplate: "portfolio", fontFamily: "josefin", buttonStyle: "square", cardStyle: "ghost", bgPattern: "none", layoutMode: "grid", animationSpeed: "normal", ctaText: "Call buchen", ctaBadge: "Limited", bookingTheme: "light", serviceLayout: "list", showPrices: false, showWelcome: true, heroStyle: "compact", mediaScale: "sm", buttonSpacing: "tight", cardDensity: "tight", motionIntensity: "subtle", startFocus: "links" } },
  { key: "night-studio", name: "Night Studio", desc: "Tattoo, Barber, Events", icon: "⚡", primaryColor: "#A855F7", theme: "dark", plan: "pro",
    config: { pageTemplate: "neon", fontFamily: "josefin", buttonStyle: "square", cardStyle: "outlined", bgPattern: "grid", layoutMode: "grid", animationSpeed: "fast", ctaText: "Slot sichern", ctaBadge: "Live", bookingTheme: "dark", serviceLayout: "cards", showPrices: true, showWelcome: false, confetti: true, heroStyle: "immersive", mediaScale: "lg", buttonSpacing: "airy", cardDensity: "normal", motionIntensity: "strong", startFocus: "cta" } },
];

export const THEMES: { value: Theme; label: string; desc: string }[] = [
  { value: "gradient", label: "Gradient", desc: "Sanfter Verlauf" },
  { value: "dark",     label: "Dark",     desc: "Dunkles Design"  },
  { value: "minimal",  label: "Minimal",  desc: "Klares Weiß"     },
  { value: "bold",     label: "Bold",     desc: "Vollfarbe"       },
  { value: "glass",    label: "Glass",    desc: "Milchglas"       },
];
