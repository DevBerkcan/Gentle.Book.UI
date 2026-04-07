// app/admin/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Don't redirect on login page
    if (pathname === '/admin/login') {
      return;
    }

    // If not authenticated and not loading, redirect to login
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#E8C7C3]" />
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return (
      <>
        <AdminNav />
        {children}
      </>
    );
  }

  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}