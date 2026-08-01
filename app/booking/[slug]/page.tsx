"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { getTenantInfo, getTenantLinks, type TenantLink } from "@/lib/api/booking";
import { apiOrigin } from "@/lib/api/client";
import type { Theme, LinktreeConfig } from "./_shared";
import { ClassicTemplate }   from "./templates/classic";
import { SoftTemplate }      from "./templates/soft";
import { HeroTemplate }      from "./templates/hero";
import { NeonTemplate }      from "./templates/neon";
import { MagazineTemplate }  from "./templates/magazine";
import { SplitTemplate }     from "./templates/split";
import { CorporateTemplate } from "./templates/corporate";
import { TattooTemplate }    from "./templates/tattoo";
import { BarbershopTemplate } from "./templates/barbershop";
import { BeautyTemplate }    from "./templates/beauty";
import { OrganicTemplate }   from "./templates/organic";
import { ClinicTemplate }    from "./templates/clinic";
import { FitnessTemplate }   from "./templates/fitness";
import { RestaurantTemplate } from "./templates/restaurant";
import { PortfolioTemplate } from "./templates/portfolio";

// ── Component ─────────────────────────────────────────────────────────────────
export default function TenantLinktreePage() {
  const { slug }   = useParams<{ slug: string }>();
  const router     = useRouter();
  const [tenantName, setTenantName]   = useState("");
  const [tagline,    setTagline]       = useState<string | null>(null);
  const [welcomeMsg, setWelcomeMsg]    = useState<string | null>(null);
  const [primaryColor, setPrimary]     = useState("#6355E4");
  const [logoUrl,    setLogoUrl]       = useState<string | null>(null);
  const [linktreeStyle, setStyle]      = useState<Theme>("gradient");
  const [industryType, setIndustry]    = useState<string | null>(null);
  const [cfg,        setCfg]           = useState<LinktreeConfig>({});
  const [links,      setLinks]         = useState<TenantLink[]>([]);
  const [loading,    setLoading]       = useState(true);
  const [notFound,   setNotFound]      = useState(false);
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([getTenantInfo(slug), getTenantLinks(slug)])
      .then(([info, tenantLinks]) => {
        if (!info?.name) { setNotFound(true); return; }
        setTenantName(info.companyName ?? info.name ?? slug);
        setTagline(info.tagline ?? null);
        if (info.welcomeMessage) setWelcomeMsg(info.welcomeMessage);
        if (info.primaryColor)   setPrimary(info.primaryColor);
        if (info.logoUrl)        setLogoUrl(info.logoUrl);
        if (info.linktreeStyle)  setStyle(info.linktreeStyle as Theme);
        if (info.industryType)   setIndustry(info.industryType);
        if (info.linktreeConfig) {
          try { setCfg(JSON.parse(info.linktreeConfig)); } catch { /* ignore */ }
        }
        setLinks(tenantLinks);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Scroll → show floating pill after 260px
  useEffect(() => {
    const handler = () => setShowFloating(window.scrollY > 260);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Confetti handler
  const handleCtaClick = useCallback(async (e: React.MouseEvent) => {
    if (!cfg.confetti) return;
    e.preventDefault();
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 } });
    setTimeout(() => router.push(`/booking/${slug}/book`), 250);
  }, [cfg.confetti, router, slug]);

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

  const logoSrc = logoUrl ? (logoUrl.startsWith("http") ? logoUrl : `${apiOrigin}${logoUrl}`) : null;

  // ── Template dispatch ──────────────────────────────────────────────────────
  const templateProps = {
    slug, tenantName, tagline, welcomeMsg, primaryColor, logoSrc,
    linktreeStyle, industryType, cfg,
    links: links as any,
    handleCtaClick, showFloating,
  };
  if (cfg.pageTemplate === "soft")       return <SoftTemplate      {...templateProps} />;
  if (cfg.pageTemplate === "hero")       return <HeroTemplate      {...templateProps} />;
  if (cfg.pageTemplate === "neon")       return <NeonTemplate      {...templateProps} />;
  if (cfg.pageTemplate === "magazine")   return <MagazineTemplate  {...templateProps} />;
  if (cfg.pageTemplate === "split")      return <SplitTemplate     {...templateProps} />;
  if (cfg.pageTemplate === "corporate")  return <CorporateTemplate {...templateProps} />;
  if (cfg.pageTemplate === "tattoo")     return <TattooTemplate    {...templateProps} />;
  if (cfg.pageTemplate === "barbershop") return <BarbershopTemplate {...templateProps} />;
  if (cfg.pageTemplate === "beauty")     return <BeautyTemplate    {...templateProps} />;
  if (cfg.pageTemplate === "organic")    return <OrganicTemplate   {...templateProps} />;
  if (cfg.pageTemplate === "clinic")     return <ClinicTemplate    {...templateProps} />;
  if (cfg.pageTemplate === "fitness")    return <FitnessTemplate   {...templateProps} />;
  if (cfg.pageTemplate === "restaurant") return <RestaurantTemplate {...templateProps} />;
  if (cfg.pageTemplate === "portfolio")  return <PortfolioTemplate {...templateProps} />;

  return <ClassicTemplate {...templateProps} />;
}
