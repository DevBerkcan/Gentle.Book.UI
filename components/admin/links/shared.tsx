// components/admin/links/shared.tsx
// Small, generic UI atoms reused across the "Meine Links" editor's subcomponents.
"use client";

import type { ReactNode } from "react";
import {
  Sparkles, Instagram, MessageCircle, MapPin, Facebook, Youtube, Globe,
  Phone, Mail, ExternalLink, Calendar,
} from "lucide-react";
import { HelpTip } from "@/components/ui/help-tip";

export const ICON_OPTIONS = [
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

export const ICON_MAP: Record<string, ReactNode> = {
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

/** Consistent section label inside design accordion */
export function SectionLabel({ icon, children, tip }: { icon: ReactNode; children: ReactNode; tip?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[#6355E4]">{icon}</span>
      <span className="text-[11px] font-semibold text-[#374151] uppercase tracking-widest">{children}</span>
      {tip && <HelpTip text={tip} />}
    </div>
  );
}

/** Small inline tip banner with a lightbulb, used to guide non-technical admins */
export function TipBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#C7D2FE] bg-[#F8F7FF] px-3 py-2.5">
      <Sparkles size={13} className="mt-0.5 shrink-0 text-[#6355E4]" />
      <p className="text-[11px] leading-relaxed text-[#4C4B63]">{children}</p>
    </div>
  );
}

/** Option pill button used throughout the configurator */
export function OptionPill({
  active, onClick, children, className = "",
}: { active: boolean; onClick: () => void; children: ReactNode; className?: string }) {
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
export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
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
