const ACCESS_TOKEN_KEY = 'access_token';
const AUTH_USER_KEY = 'auth_user';
const EMPLOYEE_KEY = 'employee';
const SUPERADMIN_TOKEN_KEY = 'superadmin_token';
const SUPERADMIN_USER_KEY = 'superadmin_user';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function getLocalStorageItem(key: string): string | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorageItem(key: string, value: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function removeLocalStorageItem(key: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

export const getAccessToken = () => getLocalStorageItem(ACCESS_TOKEN_KEY);
export const setAccessToken = (value: string) => setLocalStorageItem(ACCESS_TOKEN_KEY, value);
export const removeAccessToken = () => removeLocalStorageItem(ACCESS_TOKEN_KEY);

export const getAuthUser = () => getLocalStorageItem(AUTH_USER_KEY);
export const setAuthUser = (value: string) => setLocalStorageItem(AUTH_USER_KEY, value);
export const removeAuthUser = () => removeLocalStorageItem(AUTH_USER_KEY);

export const getLegacyEmployee = () => getLocalStorageItem(EMPLOYEE_KEY);
export const setLegacyEmployee = (value: string) => setLocalStorageItem(EMPLOYEE_KEY, value);
export const removeLegacyEmployee = () => removeLocalStorageItem(EMPLOYEE_KEY);

export const getSuperAdminToken = () => getLocalStorageItem(SUPERADMIN_TOKEN_KEY);
export const setSuperAdminToken = (value: string) => setLocalStorageItem(SUPERADMIN_TOKEN_KEY, value);
export const removeSuperAdminToken = () => removeLocalStorageItem(SUPERADMIN_TOKEN_KEY);

export const getSuperAdminUser = () => getLocalStorageItem(SUPERADMIN_USER_KEY);
export const setSuperAdminUser = (value: string) => setLocalStorageItem(SUPERADMIN_USER_KEY, value);
export const removeSuperAdminUser = () => removeLocalStorageItem(SUPERADMIN_USER_KEY);

export const clearAuthStorage = () => {
  removeAccessToken();
  removeAuthUser();
  removeLegacyEmployee();
};

export const clearSuperAdminStorage = () => {
  removeSuperAdminToken();
  removeSuperAdminUser();
};
