import { test, expect } from '@playwright/test';
import { DEMO_TENANTS, loginAsTenantAdmin } from './fixtures';

test.describe('Customer management', () => {
  test('create a customer, find it via search, see it in the list', async ({ page }) => {
    await loginAsTenantAdmin(page, DEMO_TENANTS.professional);
    await page.goto('/admin/customers');

    const stamp = Date.now();
    const lastName = `E2ETest${stamp}`;

    await page.getByRole('button', { name: /Neuer Kunde|New customer|\+.*Kunde|\+.*customer/i }).click();
    await page.getByLabel(/Vorname|First name/i).fill('E2E');
    await page.getByLabel(/Nachname|Last name/i).fill(lastName);
    await page.getByLabel(/^E-Mail|^Email/i).fill(`e2e-customer-${stamp}@example.test`);
    // A unique phone number per run: the app correctly rejects a duplicate phone number, so
    // reusing a fixed one (like other specs' +491701234567) would collide across test runs.
    await page.getByLabel(/^Telefon$|^Phone$/i).fill(`+4917${String(stamp).slice(-8)}`);
    await page.getByRole('button', { name: /Anlegen|Speichern|Save|Erstellen|Create/i }).last().click();

    // The new customer should show up without a full reload (optimistic update or refetch).
    // .first(): creation also opens a detail panel showing the same name a second time.
    await expect(page.getByText(lastName).first()).toBeVisible({ timeout: 10000 });

    // Search should find it specifically, by its unique generated name.
    const searchBox = page.getByPlaceholder(/Suche|Search/i).first();
    await searchBox.fill(lastName);
    await expect(page.getByText(lastName).first()).toBeVisible({ timeout: 10000 });
  });
});
