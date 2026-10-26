"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, BookOpen, Ban, LogOut,
  Users, Scissors, Settings, CreditCard, Link2,
  BarChart3, Menu, X, ChevronRight, ChevronLeft, MessageSquare, Inbox, ClipboardList, Bot, KeyRound, Star, FileText as IntakeIcon, Ticket,
} from "lucide-react";
import { GentleBookMark } from "@/components/admin/GentleBookLogo";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { legalConfig } from "@/lib/config";
import api, { apiOrigin } from "@/lib/api/client";
import { resolveLogoUrl } from "@/lib/utils/logo";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const COLLAPSE_KEY = "admin-sidebar-collapsed";

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, employee, logout, isAuthenticated, isTenantAdmin, isLocationAdmin, isEmployee } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const [logoUrl, setLogoUrl]         = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [industryType, setIndustryType] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [employeePhotoUrl, setEmployeePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isTenantAdmin) {
      api.get("/tenant/settings").then((res) => {
        const d = res.data?.data ?? res.data;
        if (d?.logoUrl)     setLogoUrl(d.logoUrl);
        if (d?.companyName) setCompanyName(d.companyName);
        if (d?.industryType) setIndustryType(d.industryType);
      }).catch(() => {});
      api.get("/tenant/subscription").then((res) => {
        setPlan(res.data?.data?.plan ?? null);
      }).catch(() => {});
    }
  }, [isTenantAdmin]);

  useEffect(() => {
    if (isEmployee && user?.id) {
      api.get(`/employees/${user.id}`).then((res) => {
        setEmployeePhotoUrl(res.data?.photoUrl ?? null);
      }).catch(() => {});
    }
  }, [isEmployee, user?.id]);

  const avatarPhotoUrl = employeePhotoUrl
    ? (employeePhotoUrl.startsWith('http') ? employeePhotoUrl : `${apiOrigin}${employeePhotoUrl}`)
    : null;

  // Mirrors Configuration/AiFinderPlanGate.cs — the backend already rejects Trial/Starter at
  // the API level, but the nav link was shown to every plan regardless, so a trial tenant could
  // navigate straight into a feature they can't actually use.
  const AI_FINDER_PLANS = ["Professional", "Agency"];
  const showAiFinder = plan != null && AI_FINDER_PLANS.includes(plan);

  // Mirrors TrackingController.RequireAnalyticsPlanAsync (PlanLimits.HasAnalytics) — every other
  // nav-gated page here already hid itself correctly on an invalid plan (the page calls the API
  // and shows an inline upsell), but these links themselves were shown unconditionally, letting
  // a tenant on a plan without the feature navigate straight into an upsell screen.
  const ANALYTICS_PLANS = ["Trial", "Professional", "Agency"];
  const showAnalytics = plan != null && ANALYTICS_PLANS.includes(plan);

  // Mirrors Configuration/AgencyFeatureGate.cs (used by AdminReviewsController,
  // AdminVoucherController, TenantController's api-keys endpoints, and — combined with the
  // industry check below — AdminIntakeFormController).
  const isAgencyPlan = plan === "Agency" || plan === "Trial";
  const showReviews = isAgencyPlan;
  const showVouchers = isAgencyPlan;
  const showApiKeys = isAgencyPlan;

  // Mirrors Configuration/IntakeFormIndustryGate.cs ("Formulare" only makes sense for industries
  // that actually do a consultation before treatment) AND AgencyFeatureGate — the backend
  // requires both, per the sales page ("Digitale Anamnesebögen (branchenabhängig)" is listed
  // under Agency only).
  const INTAKE_FORM_INDUSTRIES = ["Beauty", "Hairdresser", "Nail", "Barbershop", "Tattoo", "Massage"];
  const showIntakeForm = isAgencyPlan && (industryType == null || INTAKE_FORM_INDUSTRIES.includes(industryType));

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "true");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--admin-sidebar-width", collapsed ? "72px" : "230px");
  }, [collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  if (!isAuthenticated) return null;

  const EMPLOYEE_NAV = [
    {
      label: t.admin.myArea,
      items: [
        { href: "/admin/employee-dashboard", label: t.admin.myArea,       icon: LayoutDashboard },
        { href: "/admin/calendar",           label: t.admin.myCalendar,   icon: Calendar },
        { href: "/admin/bookings",           label: t.admin.bookings,     icon: BookOpen },
        { href: "/admin/blocked-slots",      label: t.admin.absences,     icon: Ban },
        { href: "/admin/employee-notes",     label: t.admin.noteToAdmin,  icon: MessageSquare },
      ],
    },
  ];

  const NAV_GROUPS = [
    {
      label: t.admin.overview,
      items: [
        { href: "/admin/dashboard",    label: t.admin.dashboard, icon: LayoutDashboard },
        { href: "/admin/calendar",     label: t.admin.calendar,  icon: Calendar },
        { href: "/admin/bookings",     label: t.admin.bookings,  icon: BookOpen },
        { href: "/admin/waitlist",     label: t.admin.waitlist,  icon: ClipboardList },
        { href: "/admin/customers",    label: t.admin.customers, icon: Users },
      ],
    },
    {
      label: t.admin.teamAndServices,
      items: [
        { href: "/admin/services",      label: t.admin.services,   icon: Scissors },
        { href: "/admin/employees",     label: t.admin.employees,  icon: Users },
        { href: "/admin/blocked-slots", label: t.admin.absences,   icon: Ban },
      ],
    },
    {
      label: t.admin.analytics,
      items: [
        ...(showAnalytics ? [{ href: "/admin/tracking", label: t.admin.tracking, icon: BarChart3 }] : []),
        ...(showReviews   ? [{ href: "/admin/reviews",  label: t.admin.reviews,  icon: Star }]       : []),
      ],
    },
  ].filter(group => group.items.length > 0);

  const ADMIN_GROUP = {
    label: t.admin.administration,
    items: [
      { href: "/admin/inbox",        label: t.admin.inbox,        icon: Inbox },
      ...(showAiFinder ? [{ href: "/admin/ai-service-finder", label: t.admin.aiServiceFinder, icon: Bot }] : []),
      { href: "/admin/links",        label: t.admin.myLinks,      icon: Link2 },
      ...(showIntakeForm ? [{ href: "/admin/intake-form", label: t.admin.intakeForm, icon: IntakeIcon }] : []),
      { href: "/admin/settings",     label: t.admin.settings,     icon: Settings },
      ...(showApiKeys ? [{ href: "/admin/api-keys", label: t.admin.apiAccess, icon: KeyRound }] : []),
      { href: "/admin/subscription", label: t.admin.subscription, icon: CreditCard },
      // Gutscheine sind tenant-weites Guthaben, bewusst TenantAdmin/SuperAdmin only — nicht für
      // LocationAdmin (siehe AdminVoucherController). Nur anzeigen wenn nicht LocationAdmin.
      ...(showVouchers && !isLocationAdmin ? [{ href: "/admin/vouchers", label: t.admin.vouchers, icon: Ticket }] : []),
    ],
  };

  const groups = isEmployee ? EMPLOYEE_NAV : isTenantAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  const displayName = user?.name
    || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "")
    || employee?.name || "?";
  const ROLE_LABELS: Record<string, string> = {
    TenantAdmin: t.admin.roleOwner,
    LocationAdmin: t.admin.roleLocationAdmin,
    Employee: t.admin.roleEmployee,
    SuperAdmin: t.admin.roleOperator,
  };
  const rawRole = user?.role || employee?.role || "";
  const displayRole = ROLE_LABELS[rawRole] || rawRole;
  const initials = displayName === "?"
    ? "?"
    : displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin/dashboard" && pathname?.startsWith(href));

  // ── Sidebar content (shared desktop + mobile) ──────────────────────────
  const SidebarContent = ({ forceExpanded = false }: { forceExpanded?: boolean }) => {
    const isCollapsed = forceExpanded ? false : collapsed;
    return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`px-5 py-5 border-b border-white/8 ${isCollapsed ? "px-3" : ""}`}>
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          {isCollapsed ? (
            <GentleBookMark size={28} className="mx-auto" />
          ) : logoUrl
            ? <Image src={resolveLogoUrl(logoUrl)!} alt={companyName ?? "Logo"} width={180} height={40} unoptimized className="w-full max-w-[180px] h-10 object-contain object-left flex-shrink-0" />
            : (
              <>
                <GentleBookMark size={28} />
                {companyName && (
                  <span className="text-white/80 text-sm font-semibold truncate">{companyName}</span>
                )}
              </>
            )
          }
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={isCollapsed ? label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isCollapsed ? "justify-center" : ""
                    } ${
                      active
                        ? "bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white shadow-lg shadow-[#6355E4]/25"
                        : "text-white/55 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <Icon size={17} className={active ? "text-white" : "text-white/40 group-hover:text-white/80"} />
                    {!isCollapsed && <span className="flex-1">{label}</span>}
                    {!isCollapsed && active && <ChevronRight size={14} className="opacity-50" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/8">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            {avatarPhotoUrl ? (
              <Image
                src={avatarPhotoUrl}
                alt={displayName}
                width={32}
                height={32}
                title={displayName}
                className="w-8 h-8 rounded-xl object-cover flex-shrink-0 shadow-md shadow-[#6355E4]/30"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6355E4] to-[#17A398] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-[#6355E4]/30"
                title={displayName}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => setLang(lang === "de" ? "en" : "de")}
              className="text-[10px] font-bold text-white/40 hover:text-white transition-colors"
              title={lang === "de" ? "Switch to English" : "Zu Deutsch wechseln"}
              aria-label={lang === "de" ? "Switch to English" : "Zu Deutsch wechseln"}
            >
              {lang === "de" ? "EN" : "DE"}
            </button>
            <NotificationBell dark />
            <button
              onClick={logout}
              className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 p-1.5 rounded-lg hover:bg-red-400/10"
              title={t.admin.logout}
              aria-label={t.admin.logout}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1">
              <button
                onClick={() => setLang(lang === "de" ? "en" : "de")}
                className="text-[10px] font-bold px-2 py-1 rounded-full border border-white/15 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                {lang === "de" ? "EN" : "DE"}
              </button>
              <NotificationBell dark />
            </div>
            <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/6 transition-colors group">
              {avatarPhotoUrl ? (
                <Image
                  src={avatarPhotoUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-xl object-cover flex-shrink-0 shadow-md shadow-[#6355E4]/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6355E4] to-[#17A398] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-[#6355E4]/30">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                <p className="text-white/40 text-xs truncate">{displayRole}</p>
              </div>
              <button
                onClick={logout}
                className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 p-1.5 rounded-lg hover:bg-red-400/10"
                title={t.admin.logout}
                aria-label={t.admin.logout}
              >
                <LogOut size={15} />
              </button>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 pt-1 text-[10px] text-white/35">
              <a href={legalConfig.imprint} target="_blank" rel="noopener noreferrer" className="hover:text-white">{t.admin.imprint}</a>
              <a href={legalConfig.privacy} target="_blank" rel="noopener noreferrer" className="hover:text-white">{t.admin.privacy}</a>
              <a href={legalConfig.terms} target="_blank" rel="noopener noreferrer" className="hover:text-white">{t.admin.terms}</a>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className={`hidden md:flex fixed inset-y-0 left-0 flex-col bg-[#1a1a2e] border-r border-white/5 z-40 transition-[width] duration-200 ${
        collapsed ? "w-[72px]" : "w-[230px]"
      }`}>
        <SidebarContent />
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex absolute top-6 -right-3 w-6 h-6 rounded-full bg-[#1a1a2e] border border-white/10 items-center justify-center text-white/50 hover:text-white hover:bg-[#23233a] transition-colors z-50 shadow-md"
          title={collapsed ? t.admin.expandSidebar : t.admin.collapseSidebar}
          aria-label={collapsed ? t.admin.expandSidebar : t.admin.collapseSidebar}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1a1a2e] border-b border-white/8 z-40 flex items-center justify-between px-4">
        <Link href="/admin/dashboard" className="flex items-center">
          {logoUrl
            ? <Image src={resolveLogoUrl(logoUrl)!} alt={companyName ?? "Logo"} width={150} height={36} unoptimized className="h-9 w-[150px] object-contain object-left" />
            : <GentleBookMark size={24} />
          }
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="text-[10px] font-bold px-2 py-1 rounded-full border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            {lang === "de" ? "EN" : "DE"}
          </button>
          <NotificationBell dark />
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/8"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="md:hidden fixed inset-y-0 left-0 w-[260px] bg-[#1a1a2e] border-r border-white/8 z-50"
            >
              <SidebarContent forceExpanded />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
