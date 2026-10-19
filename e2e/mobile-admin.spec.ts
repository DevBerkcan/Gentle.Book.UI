import { test, expect } from '@playwright/test';
import { DEMO_TENANTS, demoEmail, DEMO_PASSWORD } from './fixtures';

// Mobile/responsive check for the admin area — tenant admins realistically check bookings from
// their phone, not just the customer-facing booking wizard (covered by mobile-booking.spec.ts).
//
// Not using Playwright's devices[...] presets: they pin defaultBrowserType to WebKit, which isn't
// installed in this environment (only Chromium, per playwright.config.ts) — so the viewport/
// touch/UA fields are reproduced manually instead, staying on Chromium.
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
});

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page, step: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `horizontal overflow at ${step}: scrollWidth=${scrollWidth} > clientWidth=${clientWidth}`)
    .toBeLessThanOrEqual(clientWidth + 1);
}

test.describe('Admin area — mobile viewport', () => {
  test('login, dashboard and the collapsed hamburger nav all work on a phone-sized screen', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('button:has-text("OK")').click({ timeout: 3000 }).catch(() => {});
    await assertNoHorizontalOverflow(page, 'login page');

    await page.getByPlaceholder(/Buchungssystem-ID/i).fill(DEMO_TENANTS.starter);
    await page.getByPlaceholder(/^E-Mail$/i).fill(demoEmail(DEMO_TENANTS.starter));
    await page.getByPlaceholder(/Passwort/i).fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: /Anmelden/i }).click();
    await expect(page).toHaveURL(/\/admin\/(dashboard|onboarding)/, { timeout: 15000 });
    await assertNoHorizontalOverflow(page, 'dashboard');

    // The sidebar is collapsed behind a hamburger icon at this width — find it by position
    // (top-right of the header bar) since it has no accessible name/aria-label.
    let hamburger;
    for (const btn of await page.locator('button').all()) {
      const box = await btn.boundingBox();
      if (box && box.y < 50 && box.x > 300) { hamburger = btn; break; }
    }
    expect(hamburger, 'hamburger nav toggle not found in the header').toBeTruthy();
    await hamburger!.click();
    // .last(): the desktop sidebar's matching link stays in the DOM (display:none) at this
    // width — the mobile drawer's copy, which is what should actually be visible, renders second.
    await expect(page.getByText('Dashboard', { exact: true }).last()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Mitarbeiter', { exact: true }).last()).toBeVisible();
    await assertNoHorizontalOverflow(page, 'nav drawer open');
  });
});
