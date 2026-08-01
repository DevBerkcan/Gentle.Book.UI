// components/admin/links/types.ts
// Shared types for the "Meine Links" admin editor and its subcomponents.

export type Theme = "gradient" | "dark" | "minimal" | "bold" | "glass";
export type BgPattern = "none" | "dots" | "waves" | "grid" | "circles";
export type ButtonStyle = "rounded" | "pill" | "square";
export type FontFamily = "inter" | "playfair" | "montserrat" | "dm-serif" | "josefin";
export type CardStyle = "filled" | "outlined" | "gradient" | "ghost";
export type LayoutMode = "list" | "grid";
export type AnimSpeed = "none" | "slow" | "normal" | "fast";
export type HeroStyle = "compact" | "editorial" | "immersive";
export type SizeLevel = "sm" | "md" | "lg";
export type SpacingLevel = "tight" | "normal" | "airy";
export type MotionIntensity = "off" | "subtle" | "strong";
export type StartFocus = "logo" | "cta" | "links";
export type PreviewDevice = "mobile" | "tablet" | "desktop";
export type PlanTier = "starter" | "pro" | "business";
export type PageTemplate =
  | "classic" | "soft" | "hero" | "neon" | "magazine" | "split" | "corporate"
  | "organic" | "tattoo" | "barbershop" | "beauty" | "clinic" | "fitness"
  | "restaurant" | "portfolio";

export interface LinktreeConfig {
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

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconType: string;
  displayOrder: number;
  isActive: boolean;
}

export type ToastKind = "success" | "error";
export interface ToastMessage {
  id: number;
  type: ToastKind;
  message: string;
}

/** What a click on a locked (plan-gated) template/pack should show — one shared shape for both pickers. */
export interface LockedHint {
  itemName: string;
  requiredPlanLabel: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Sent via postMessage (same-origin only) into the public /booking/[slug] iframe so an admin can
 * preview an AI Brand Import proposal using the exact same template rendering logic as the
 * public page, without persisting anything to TenantSettings until they explicitly apply it.
 */
export interface BrandPreviewOverride {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  pageTemplate?: string;
  fontFamily?: string;
  buttonStyle?: string;
  cardStyle?: string;
  animationSpeed?: string;
  logoUrl?: string;
}

export const BRAND_PREVIEW_MESSAGE_TYPE = "gentlebook-brand-preview";

