import { test, expect, type Page } from '@playwright/test';

// SuperAdmin functional pages beyond login — read-only navigation smoke test. Credentials are
// dev-only (see docs/qa/TEST_ACCOUNTS.md): qa-superadmin@gentlebook.local / QaSuperAdmin123!.
// Each page is asserted on its own distinct h1 so a misrouted/stuck page (e.g. one that silently
// still renders the previous page's content after a client-side nav) would be caught.

async function loginAsSuperAdmin(page: Page) {
  await page.goto('/superadmin/login');
  await page.getByRole('button', { name: 'OK' }).click({ timeout: 3000 }).catch(() => {});
  await page.locator('input[type=email], input[name=email]').first().fill('qa-superadmin@gentlebook.local');
  await page.locator('input[type=password]').first().fill('QaSuperAdmin123!');
  await page.getByRole('button', { name: /Anmelden|Sign in|Login/i }).click();
  await expect(page).toHaveURL(/\/superadmin\/tenants/, { timeout: 15000 });
}

const pages: Array<{ path: string; heading: string | RegExp }> = [
  { path: 'dashboard', heading: 'Plattform-Übersicht' },
  { path: 'revenue', heading: 'Umsatz' },
  { path: 'pricing', heading: 'Preise' },
  { path: 'audit-log', heading: 'Audit-Log' },
  { path: 'email-logs', heading: /E-Mail Logs/ },
  { path: 'agency-ai-costs', heading: /KI-Kosten/ },
  { path: 'at-risk', heading: 'Gefährdete Kunden' },
  { path: 'requests', heading: 'Abo-Anfragen' },
  { path: 'invoices', heading: 'Rechnungen' },
  { path: 'activity', heading: 'Plattform-Aktivitäten' },
];

test.describe('SuperAdmin functional pages', () => {
  test('every platform-admin page loads with no console errors and its own heading', async ({ page }) => {
    await loginAsSuperAdmin(page);

    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    for (const { path, heading } of pages) {
      consoleErrors.length = 0;
      await page.goto(`/superadmin/${path}`, { waitUntil: 'load' });
      await expect(page.locator('h1').first(), `heading on /superadmin/${path}`).toHaveText(heading, { timeout: 10000 });
      expect(consoleErrors, `console errors on /superadmin/${path}: ${consoleErrors.join('; ')}`).toHaveLength(0);
    }
  });

  test('tenants overview lists the seeded demo tenants and opens a tenant detail', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await expect(page.getByText('demo-professional')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('demo-starter')).toBeVisible();
    await expect(page.getByText('demo-agency')).toBeVisible();

    // The tenant name itself isn't a link — the gear icon (first of 4 action icons per row:
    // settings, open booking page, suspend, delete) opens the tenant detail/settings view.
    const row = page.locator('tr', { hasText: 'Demo Salon Professional' }).first();
    await row.locator('button, a').first().click();
    await expect(page).not.toHaveURL(/\/superadmin\/tenants$/, { timeout: 10000 });
  });
});
