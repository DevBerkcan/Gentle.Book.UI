import { type Page, expect } from '@playwright/test';

// Dev-only demo tenants seeded by Program.cs (IsDevelopment() block) — never real customers.
// One per plan tier. Password is the same fixed dev value for all four, intentionally.
export const DEMO_TENANTS = {
  trial: 'demo-trial',
  starter: 'demo-starter',
  professional: 'demo-professional',
  agency: 'demo-agency',
} as const;

export const DEMO_PASSWORD = 'Demo123!';

export function demoEmail(slug: string) {
  return `${slug}@gentlebook.local`;
}

/** Drives the real admin login form (tenant-admin mode) — not a localStorage shortcut. */
export async function loginAsTenantAdmin(page: Page, slug: string, password = DEMO_PASSWORD) {
  await page.goto('/admin/login');
  // Admin mode is the default tab, but assert it in case that ever changes.
  await page.getByRole('button', { name: /admin/i }).first().click().catch(() => {});
  await page.getByPlaceholder(/Buchungssystem-ID|Booking system ID/i).fill(slug);
  await page.getByPlaceholder(/^E-Mail$|^Email$/i).fill(demoEmail(slug));
  await page.getByPlaceholder(/Passwort|Password/i).fill(password);
  await page.getByRole('button', { name: /Anmelden|Sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/(dashboard|onboarding)/, { timeout: 15000 });
}
