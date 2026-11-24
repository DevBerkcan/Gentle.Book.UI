import { test, expect, request as pwRequest } from '@playwright/test';
import { DEMO_TENANTS, DEMO_PASSWORD, demoEmail, loginAsTenantAdmin } from './fixtures';

// "Abgesagte Termine nachbesetzen": the waitlist page shows how many freed slots were refilled.
// The numbers on screen must match the API (which the WaitlistStatsTests unit test pins down).
const API = process.env.E2E_API_URL ?? 'http://localhost:5067/api';
const SLUG = DEMO_TENANTS.professional;

test('Warteliste zeigt wieder gefüllte Lücken passend zur API', async ({ page }) => {
  const api = await pwRequest.newContext();
  const login = await (await api.post(`${API}/auth/login`, { data: { tenantSlug: SLUG, email: demoEmail(SLUG), password: DEMO_PASSWORD } })).json();
  const stats = await (await api.get(`${API}/waitlist/stats`, { headers: { Authorization: `Bearer ${login.token ?? login.data?.token}` } })).json();
  await api.dispose();
  test.skip(stats.total.offered === 0, 'Noch keine angebotenen Lücken in dieser Datenbank (waitlist.spec.ts erzeugt welche).');

  await loginAsTenantAdmin(page, SLUG);
  await page.goto('/admin/waitlist');
  const card = page.getByTestId('waitlist-refill-stats');
  await expect(card).toBeVisible({ timeout: 20000 });
  await expect(card).toContainText('Wieder gefüllte Lücken');
  await expect(card).toContainText(`Insgesamt: ${stats.total.refilled} von ${stats.total.offered} angebotenen Lücken gefüllt`);
  await page.waitForTimeout(500);
  await card.screenshot({ path: test.info().outputPath('waitlist-refill.png') });
});
