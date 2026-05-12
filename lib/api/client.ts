// lib/api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request: attach JWT from localStorage.
// SuperAdmin calls (/superadmin/*) use superadmin_token; all others use access_token.
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const isSuperAdminRoute = config.url?.includes('/superadmin');
      const token = isSuperAdminRoute
        ? localStorage.getItem('superadmin_token')
        : localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function showSessionExpiredToast(redirect: () => void) {
  const toast = document.createElement('div');
  toast.textContent = 'Ihre Sitzung ist abgelaufen. Sie werden zur Anmeldung weitergeleitet...';
  toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#1E1E1E;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
  document.body.appendChild(toast);
  setTimeout(() => { toast.remove(); redirect(); }, 2500);
}

// Response: handle 401/402 globally.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;
    const path = window.location.pathname;

    if (status === 401) {
      if (path.startsWith('/superadmin')) {
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_user');
        if (!path.includes('/superadmin/login')) {
          showSessionExpiredToast(() => { window.location.href = '/superadmin/login'; });
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('employee');
        if (!path.includes('/admin/login')) {
          showSessionExpiredToast(() => { window.location.href = '/admin/login'; });
        }
      }
    }

    if (status === 402) {
      if (!path.includes('/admin/subscription') && !path.includes('/admin/login')) {
        window.location.href = '/admin/subscription';
      }
    }

    return Promise.reject(error);
  }
);

export const extractData = <T>(response: any, isList = true): T => {
  try {
    const { data } = response;
    if (!data) return (isList ? [] : null) as T;
    const responseData = data.data !== undefined ? data.data
      : data.Data !== undefined ? data.Data
      : data;
    return responseData as T;
  } catch {
    return (isList ? [] : null) as T;
  }
};

export default api;
