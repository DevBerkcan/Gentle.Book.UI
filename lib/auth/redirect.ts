// lib/auth/redirect.ts
// Single, central place for "where does a user land after login" — reused by both the
// admin and employee login branches so the decision is never duplicated/drifted across
// call sites (e.g. a future "resume after forced password change" flow).

export type LoginKind = 'admin' | 'employee';

export interface PostLoginRedirectInput {
  kind: LoginKind;
  /** From the login API response — the authoritative, server-persisted flag. Never derive this from the URL. */
  mustChangePassword?: boolean;
  /** Optional intended destination captured before the user was sent to /admin/login. */
  next?: string | null;
}

export const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
export const ADMIN_SETTINGS_MUST_CHANGE_PATH = '/admin/settings?mustChangePassword=1';
export const EMPLOYEE_DASHBOARD_PATH = '/admin/employee-dashboard';

/**
 * Only same-origin, relative `/admin/...` paths are ever accepted as a post-login return
 * target. Rejects absolute URLs, protocol-relative URLs ("//evil.com"), and anything with
 * an embedded scheme, so a crafted `next` query parameter can never be used to build an
 * open redirect off of GentleBook.
 */
export function isSafeAdminRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith('/admin/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  return true;
}

/**
 * Resolves the single, role-aware destination for a user right after a successful login.
 * `mustChangePassword` must come from the login API response, not from anything client-supplied.
 */
export function resolvePostLoginRedirect(input: PostLoginRedirectInput): string {
  if (input.kind === 'employee') {
    return EMPLOYEE_DASHBOARD_PATH;
  }

  if (input.mustChangePassword) {
    return ADMIN_SETTINGS_MUST_CHANGE_PATH;
  }

  if (isSafeAdminRedirectPath(input.next)) {
    return input.next;
  }

  return ADMIN_DASHBOARD_PATH;
}
