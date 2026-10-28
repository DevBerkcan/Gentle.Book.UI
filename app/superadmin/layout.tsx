// app/superadmin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Building2, LogOut, Mail, Activity, Bell, FileText, Euro, AlertTriangle, ScrollText, TrendingUp, Sparkles, Scale, ShieldAlert, Menu, X } from 'lucide-react';
import { superAdminApi } from '@/lib/api/superadmin';
import { getSuperAdminToken, getSuperAdminUser, removeSuperAdminToken, removeSuperAdminUser } from '@/lib/auth/storage';
import { GentleBookMark } from '@/components/admin/GentleBookLogo';

function useSuperAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/superadmin/login') return;

    const token = getSuperAdminToken();
    const user = getSuperAdminUser();

    if (!token || !user) {
      router.push('/superadmin/login');
      return;
    }

    try {
      const parsed = JSON.parse(user);
      if (parsed.role !== 'SuperAdmin') {
        router.push('/superadmin/login');
      }
    } catch {
      router.push('/superadmin/login');
    }
  }, [pathname, router]);

  const logout = () => {
    removeSuperAdminToken();
    removeSuperAdminUser();
    router.push('/superadmin/login');
  };

  return { logout };
}

function SuperAdminNav({ logout }: { logout: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [pendingDataRequests, setPendingDataRequests] = useState(0);

  useEffect(() => {
    const refresh = () => {
      superAdminApi.getSubscriptionRequests('Pending')
        .then(r => setPendingRequests(r.pendingCount))
        .catch(() => {});
      superAdminApi.getAtRiskSubscriptions()
        .then(r => setAtRiskCount(r.totalAtRisk))
        .catch(() => {});
      superAdminApi.getDataRequests('Pending')
        .then(r => setPendingDataRequests(r.length))
        .catch(() => {});
    };
    refresh();
    // Refresh every 5 minutes
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const navItems = [
    { href: '/superadmin/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
    { href: '/superadmin/revenue',    label: 'Umsatz',          icon: TrendingUp },
    { href: '/superadmin/agency-ai-costs', label: 'KI-Kosten (Agency)', icon: Sparkles },
    { href: '/superadmin/tenants',    label: 'Buchungssysteme', icon: Building2 },
    { href: '/superadmin/requests',   label: 'Abo-Anfragen',    icon: Bell, badge: pendingRequests },
    { href: '/superadmin/invoices',   label: 'Rechnungen',      icon: FileText },
    { href: '/superadmin/pricing',    label: 'Preise',          icon: Euro },
    { href: '/superadmin/at-risk',    label: 'Gefährdete Kunden', icon: AlertTriangle, badge: atRiskCount },
    { href: '/superadmin/email-logs', label: 'E-Mail Logs',     icon: Mail },
    { href: '/superadmin/activity',   label: 'Aktivitäten',     icon: Activity },
    { href: '/superadmin/audit-log',  label: 'Audit-Log',       icon: ScrollText },
    { href: '/superadmin/legal-documents', label: 'Rechtstexte', icon: Scale },
    { href: '/superadmin/data-requests', label: 'Datenanfragen', icon: ShieldAlert, badge: pendingDataRequests },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/10 flex items-center gap-2.5">
        <GentleBookMark size={26} />
        <div>
          <p className="font-semibold text-white leading-tight">gentlebook</p>
          <p className="text-[11px] text-gray-400 leading-tight">Super Admin</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-medium shadow-lg shadow-[#6355E4]/25'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 bg-[#1a1a2e] text-white flex-col z-50">
        <NavContent />
      </aside>

      {/* ── Mobile/Tablet Top Bar ────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#1a1a2e] border-b border-white/10 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <GentleBookMark size={24} />
          <p className="font-semibold text-white text-sm leading-tight">gentlebook</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
          className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/8"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile/Tablet Drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[260px] bg-[#1a1a2e] border-r border-white/10 z-50"
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const ROUTE_TITLES: Record<string, string> = {
  '/superadmin/dashboard': 'Dashboard',
  '/superadmin/revenue': 'Umsatz',
  '/superadmin/agency-ai-costs': 'KI-Kosten',
  '/superadmin/tenants': 'Buchungssysteme',
  '/superadmin/requests': 'Abo-Anfragen',
  '/superadmin/invoices': 'Rechnungen',
  '/superadmin/pricing': 'Preise',
  '/superadmin/at-risk': 'Gefährdete Kunden',
  '/superadmin/email-logs': 'E-Mail Logs',
  '/superadmin/activity': 'Aktivitäten',
  '/superadmin/audit-log': 'Audit-Log',
  '/superadmin/legal-documents': 'Rechtstexte',
  '/superadmin/data-requests': 'Datenanfragen',
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useSuperAdminAuth();
  const pathname = usePathname();

  // Every route previously shared the one static <title> from the root layout.
  useEffect(() => {
    const matched = Object.entries(ROUTE_TITLES).find(([route]) => pathname?.startsWith(route));
    document.title = matched ? `${matched[1]} · Super Admin · GentleBook` : 'Super Admin · GentleBook';
  }, [pathname]);

  if (pathname === '/superadmin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F6F5FA]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-[#1E1E1E] focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg"
      >
        Zum Hauptinhalt springen
      </a>
      <SuperAdminNav logout={logout} />
      <main id="main-content" className="lg:ml-60 flex-1 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
