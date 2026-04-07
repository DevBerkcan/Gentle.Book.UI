// lib/config.ts
import { Calendar, Instagram, MapPin, MessageCircle } from "lucide-react";

export const siteConfig = {
  title: "Skinbloom Aesthetics",
  description: "Medizinische Ästhetik & Anti-Aging in Basel",
  url: "https://skinbloom-aesthetics.ch",
  image: "/og-image.jpg",
};

export const socialLinks = [
  {
    label: "Online buchen",
    href: "/booking",
    icon: Calendar,
    variant: "primary" as const,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/skinbloom._aesthetics/",
    icon: Instagram,
    variant: "secondary" as const,
  },
  {
    label: "Route zu uns (Google Maps)",
    href: "https://maps.google.com/?q=Elisabethenstrasse+41+4051+Basel",
    icon: MapPin,
    variant: "maps" as const,
  },
  {
    label: "WhatsApp schreiben",
    href: "https://wa.me/41791234567",
    icon: MessageCircle,
    variant: "whatsapp" as const,
  },
];

export const footerLinks = [
  {
    label: "Impressum",
    href: "/impressum",
    category: "footer"
  },
  {
    label: "Datenschutz",
    href: "/datenschutz",
    category: "footer"
  },
  {
    label: "Cookie-Einstellungen",
    href: "#cookie",
    category: "footer"
  }
];