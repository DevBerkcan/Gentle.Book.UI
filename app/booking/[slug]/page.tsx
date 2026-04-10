"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar, Instagram, MessageCircle, MapPin, Facebook, Youtube,
  Globe, Phone, Mail, ExternalLink, Loader2, ChevronRight,
} from "lucide-react";
import { getTenantInfo, getTenantLinks, type TenantLink } from "@/lib/api/booking";

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

// Blend a hex color with white to get a lighter version
function lighten(hex: string, amount = 0.85): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lr = Math.round(r + (255 - r) * amount);
    const lg = Math.round(g + (255 - g) * amount);
    const lb = Math.round(b + (255 - b) * amount);
    return `rgb(${lr},${lg},${lb})`;
  } catch {
    return "#F5EDEB";
  }
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const profileVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function TenantLinktreePage() {
  const { slug } = useParams<{ slug: string }>();
  const [tenantName, setTenantName] = useState("");
  const [tagline, setTagline] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#E8C7C3");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [links, setLinks] = useState<TenantLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([getTenantInfo(slug), getTenantLinks(slug)])
      .then(([info, tenantLinks]) => {
        if (!info || !info.name) { setNotFound(true); return; }
        setTenantName(info.companyName ?? info.name ?? slug);
        setTagline(info.tagline ?? null);
        if (info.primaryColor) setPrimaryColor(info.primaryColor);
        if (info.logoUrl) setLogoUrl(info.logoUrl);
        setLinks(tenantLinks);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${lighten("#E8C7C3", 0.7)} 0%, #fff 100%)` }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <Loader2 className="animate-spin" size={36} style={{ color: "#E8C7C3" }} />
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

  const bgLight = lighten(primaryColor, 0.88);
  const bgMid = lighten(primaryColor, 0.7);
  const logoSrc = logoUrl
    ? (logoUrl.startsWith("http") ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL}${logoUrl}`)
    : null;

  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(160deg, ${bgLight} 0%, #ffffff 60%, ${bgMid} 100%)` }}
    >
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: primaryColor }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-15 blur-3xl"
          style={{ background: primaryColor }}
        />
      </div>

      <div className="relative max-w-md mx-auto px-4 py-12 pb-16 flex flex-col items-center gap-5">

        {/* ── Profile ────────────────────────────────────────────────── */}
        <motion.div
          variants={profileVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-3 text-center"
        >
          {/* Avatar / Logo */}
          {logoSrc ? (
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-lg opacity-40 scale-110"
                style={{ background: primaryColor }}
              />
              <img
                src={logoSrc}
                alt={tenantName}
                className="relative w-24 h-24 rounded-full object-cover shadow-2xl border-4 border-white"
              />
            </div>
          ) : (
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-lg opacity-40 scale-110"
                style={{ background: primaryColor }}
              />
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-2xl border-4 border-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)` }}
              >
                {tenantName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{tenantName}</h1>
            {tagline && (
              <p className="text-sm text-gray-500 mt-1.5 max-w-xs leading-relaxed">{tagline}</p>
            )}
          </div>

          {/* Divider dot */}
          <div className="flex gap-1.5 mt-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: i === 1 ? primaryColor : `${primaryColor}66` }}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Links ──────────────────────────────────────────────────── */}
        <motion.div
          className="w-full flex flex-col gap-3 mt-1"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Booking CTA — always first */}
          <motion.div variants={itemVariants}>
            <Link
              href={`/booking/${slug}/book`}
              className="group w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-transform active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
                boxShadow: `0 8px 32px ${primaryColor}55`,
              }}
            >
              <span className="flex-shrink-0 bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                <Calendar size={20} />
              </span>
              <span className="flex-1">Termin buchen</span>
              <motion.span
                className="text-white/70"
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              >
                <ChevronRight size={18} />
              </motion.span>
            </Link>
          </motion.div>

          {/* Custom links */}
          {links.map((link) => (
            <motion.div key={link.id} variants={itemVariants}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white text-gray-800 font-semibold text-base shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                <span
                  className="flex-shrink-0 p-2 rounded-xl text-white transition-transform group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}bb)` }}
                >
                  {ICON_MAP[link.iconType] ?? <ExternalLink size={20} />}
                </span>
                <span className="flex-1">{link.title}</span>
                <ExternalLink size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <span className="font-semibold" style={{ color: primaryColor }}>
              GentleBook
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
