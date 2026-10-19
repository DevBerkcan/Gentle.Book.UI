import { test, expect } from '@playwright/test';
import { DEMO_TENANTS, demoEmail, loginAsTenantAdmin } from './fixtures';

test.describe('Admin authentication', () => {
  test('valid credentials log in and land on the dashboard', async ({ page }) => {
    await loginAsTenantAdmin(page, DEMO_TENANTS.professional);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('wrong password is rejected with an error, no navigation', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByPlaceholder(/Buchungssystem-ID|Booking system ID/i).fill(DEMO_TENANTS.professional);
    await page.getByPlaceholder(/^E-Mail$|^Email$/i).fill(demoEmail(DEMO_TENANTS.professional));
    await page.getByPlaceholder(/Passwort|Password/i).fill('WrongPassword123!');
    await page.getByRole('button', { name: /Anmelden|Sign in/i }).click();

    await expect(page.getByText(/Ungültige Anmeldedaten|Invalid login credentials/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('unknown tenant slug is rejected with an error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByPlaceholder(/Buchungssystem-ID|Booking system ID/i).fill('this-tenant-does-not-exist-e2e');
    await page.getByPlaceholder(/^E-Mail$|^Email$/i).fill('nobody@example.test');
    await page.getByPlaceholder(/Passwort|Password/i).fill('whatever');
    await page.getByRole('button', { name: /Anmelden|Sign in/i }).click();

    await expect(page.getByText(/Ungültige Anmeldedaten|Invalid login credentials/i)).toBeVisible({ timeout: 10000 });
  });

  test('logout clears the session and protected routes redirect to login', async ({ page }) => {
    await loginAsTenantAdmin(page, DEMO_TENANTS.professional);

    // AdminNav exposes a logout action; drive it rather than clearing storage directly so this
    // exercises the real logout code path.
    await page.getByRole('button', { name: /Abmelden|Log out/i }).click().catch(async () => {
      // Fallback: some layouts tuck logout behind a user-menu toggle first.
      await page.getByText(/Owner|Inhaber/i).first().click();
      await page.getByRole('button', { name: /Abmelden|Log out/i }).click();
    });

    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });

    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });
});
