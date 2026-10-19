import { test, expect } from '@playwright/test';

// Employee and SuperAdmin logins — the two roles not covered by auth.spec.ts (TenantAdmin only).
// Credentials are dev-only, created for this QA pass (see docs/qa/TEST_ACCOUNTS.md):
//   - Employee "E2E Shared Employee" / e2e-shared-employee / E2eEmployee123! on demo-professional
//   - SuperAdmin qa-superadmin@gentlebook.local / QaSuperAdmin123! (bootstrapped locally)

test.describe('Employee role', () => {
  test('employee login lands on the employee dashboard, not the admin one', async ({ page }) => {
    await page.goto('/admin/login?mode=employee');
    await page.getByPlaceholder(/Benutzername|Username/i).fill('e2e-shared-employee');
    await page.getByPlaceholder(/Passwort|Password/i).fill('E2eEmployee123!');
    await page.getByRole('button', { name: /Anmelden|Sign in/i }).click();

    await expect(page).toHaveURL(/\/admin\/employee-dashboard/, { timeout: 15000 });
    // Employees must not reach tenant-admin-only pages — redirect-guarded, not just hidden nav.
    // waitUntil: 'commit' (not the default 'load') because the client-side redirect away from
    // this page can fire before the navigation's load event, which Playwright/Chromium otherwise
    // reports as a hard ERR_ABORTED on goto() rather than a navigation to redirect to observe.
    await page.goto('/admin/subscription', { waitUntil: 'commit' });
    await expect(page).not.toHaveURL(/\/admin\/subscription/, { timeout: 10000 });
  });
});

test.describe('SuperAdmin role', () => {
  test('superadmin login lands on the tenants overview', async ({ page }) => {
    await page.goto('/superadmin/login');
    await page.getByRole('button', { name: 'OK' }).click({ timeout: 3000 }).catch(() => {});
    await page.locator('input[type=email], input[name=email]').first().fill('qa-superadmin@gentlebook.local');
    await page.locator('input[type=password]').first().fill('QaSuperAdmin123!');
    await page.getByRole('button', { name: /Anmelden|Sign in|Login/i }).click();

    await expect(page).toHaveURL(/\/superadmin\/tenants/, { timeout: 15000 });
    // The four dev-only demo tenants should be visible in the platform-wide list.
    await expect(page.getByText('demo-professional')).toBeVisible({ timeout: 10000 });
  });
});
