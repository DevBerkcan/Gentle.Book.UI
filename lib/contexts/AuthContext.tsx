// lib/contexts/AuthContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi, Employee, LoginCredentials } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  employee: Employee | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('access_token');
    const storedEmployee = localStorage.getItem('employee');
    
    if (token && storedEmployee) {
      try {
        setEmployee(JSON.parse(storedEmployee));
      } catch (error) {
        console.error('Error parsing stored employee:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('employee');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const result = await authApi.login(credentials);
    
    if (result.success && result.token && result.employee) {
      // Store in localStorage
      localStorage.setItem('access_token', result.token);
      localStorage.setItem('employee', JSON.stringify(result.employee));
      setEmployee(result.employee);
    }
    
    return { success: result.success, message: result.message };
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('employee');
    setEmployee(null);
    router.push('/admin/login');
  };

  const refreshEmployee = async () => {
    const result = await authApi.getCurrentEmployee();
    if (result.success && result.employee) {
      setEmployee(result.employee);
      localStorage.setItem('employee', JSON.stringify(result.employee));
    } else {
      // Token might be invalid
      await logout();
    }
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!employee) return false;
    
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(employee.role);
  };

  return (
    <AuthContext.Provider value={{
      employee,
      loading,
      isAuthenticated: !!employee,
      login,
      logout,
      refreshEmployee,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};