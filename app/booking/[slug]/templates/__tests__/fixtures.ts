// Shared fixture builder for the booking-template smoke tests. One canonical
// TemplateProps shape, reused across every template's test so fixtures don't drift.
import type { LinktreeConfig, TemplateProps, TenantLinkItem } from "../../_shared";

const LINKS: TenantLinkItem[] = [
  { id: "l1", title: "Instagram", url: "https://instagram.com/example", iconType: "Instagram" },
  { id: "l2", title: "WhatsApp", url: "https://wa.me/123456", iconType: "WhatsApp" },
];

export function buildTestTemplateProps(overrides: Partial<TemplateProps> = {}): TemplateProps {
  return {
    slug: "test-tenant",
    tenantName: "Test Salon",
    tagline: "Dein Ort für Wohlbefinden",
    welcomeMsg: "Schön, dass du hier bist!",
    primaryColor: "#6355E4",
    logoSrc: null,
    linktreeStyle: "gradient",
    industryType: "Hairdresser",
    cfg: {},
    links: LINKS,
    handleCtaClick: () => {},
    showFloating: false,
    ...overrides,
  };
}

export const DEFAULT_CONFIG: LinktreeConfig = {};

export const DARK_CONFIG: LinktreeConfig = {
  buttonStyle: "pill",
  cardStyle: "outlined",
  fontFamily: "montserrat",
  bgPattern: "grid",
  layoutMode: "grid",
  animationSpeed: "fast",
  showWelcome: true,
  confetti: true,
};

export const FULL_CONFIG: LinktreeConfig = {
  ctaText: "Jetzt Termin sichern",
  bgPattern: "dots",
  buttonStyle: "square",
  fontFamily: "playfair",
  ctaColor: "#17A398",
  avatarShape: "rounded",
  cardStyle: "gradient",
  layoutMode: "list",
  animationSpeed: "slow",
  showWelcome: true,
  confetti: false,
  bookingTheme: "branded",
  serviceLayout: "cards",
  showPrices: true,
  ctaBadge: "Neu",
  colorScheme: "brand",
  heroStyle: "immersive",
  mediaScale: "lg",
  buttonSpacing: "airy",
  cardDensity: "airy",
  motionIntensity: "strong",
  startFocus: "cta",
};
