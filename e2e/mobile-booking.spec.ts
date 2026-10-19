import { test, expect, request as playwrightRequest } from '@playwright/test';
import { ensureSharedBookingFixtures } from './fixtures';

// Mobile/responsive check for the public booking wizard — the page real customers are most
// likely to open on a phone. Mirrors booking-wizard.spec.ts's click path but at an iPhone 13
// viewport, with an explicit no-horizontal-overflow check at every step (the single most common
// "looks fine on desktop, breaks on mobile" failure mode: a fixed-width element forcing the page
// wider than the viewport, which no desktop test would ever catch).
//
// Not using Playwright's devices['iPhone 13'] preset directly: it pins defaultBrowserType to
// WebKit, which isn't installed in this environment (only Chromium, per playwright.config.ts) —
// so the viewport/touch/UA fields are reproduced manually instead, staying on Chromium.
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
    .toBeLessThanOrEqual(clientWidth + 1); // +1: subpixel rounding tolerance
}

test.describe('Public booking wizard — mobile viewport', () => {
  test('a customer can complete a booking end to end on a phone-sized screen', async ({ page }) => {
    const api = await playwrightRequest.newContext();
    await ensureSharedBookingFixtures(api);
    await api.dispose();

    await page.goto('/booking/demo-professional/book');
    await page.getByRole('button', { name: 'OK' }).click().catch(() => {});

    // Step 1: service
    await expect(page.getByText('Schritt 1 von 4')).toBeVisible();
    await assertNoHorizontalOverflow(page, 'step 1 (service)');
    await page.getByText('E2E Shared Category', { exact: true }).click();
    await page.getByText('E2E Shared Service', { exact: true }).click();
    await page.getByRole('button', { name: /Weiter/i }).click();

    // Step 2: employee
    await expect(page.getByText('Schritt 2 von 4')).toBeVisible();
    await assertNoHorizontalOverflow(page, 'step 2 (employee)');
    await expect(page.getByText('E2E Shared Employee').first()).toBeVisible();
    await page.getByRole('button', { name: /Weiter/i }).click();

    // Step 3: date & time
    await expect(page.getByText('Schritt 3 von 4')).toBeVisible();
    await assertNoHorizontalOverflow(page, 'step 3 (date/time)');
    const enabledDay = page.getByRole('button', { name: /^(Mo|Di|Mi|Do|Fr|Sa) \d{1,2}$/ }).nth(1);
    await enabledDay.click();
    const timeSlot = page.locator('button:not([disabled])').filter({ hasText: /^\d{1,2}:\d{2}$/ }).first();
    await expect(timeSlot).toBeVisible({ timeout: 10000 });
    await timeSlot.click();
    await assertNoHorizontalOverflow(page, 'step 3 after slot pick');
    await page.getByRole('button', { name: /Weiter/i }).click();

    // Step 4: contact details — mobile keyboards/viewports are the most common place touch
    // targets and inputs overlap the fixed bottom CTA bar, so this step gets the closest look.
    await expect(page.getByText('Schritt 4 von 4')).toBeVisible();
    await assertNoHorizontalOverflow(page, 'step 4 (contact)');
    const stamp = Date.now();
    await page.getByLabel(/Vorname|First name/i).fill('E2E');
    await page.getByLabel(/Nachname|Last name/i).fill(`Mobile${stamp}`);
    await page.getByLabel(/^E-Mail|^Email/i).fill(`e2e-mobile-${stamp}@example.test`);
    await page.getByLabel(/Telefon|Phone/i).fill('+491701234567');
    const privacyCheckbox = page.getByRole('checkbox');
    if (await privacyCheckbox.count() > 0) await privacyCheckbox.first().check();

    const submitButton = page.getByRole('button', { name: /Jetzt buchen|Termin buchen|Book now|Confirm booking/i });
    await expect(submitButton).toBeInViewport();
    await submitButton.click();

    await expect(page).toHaveURL(/\/booking\/confirmation\//, { timeout: 15000 });
    await expect(page.getByText(/bestätigt|confirmed|Buchungsnummer|Booking number/i).first()).toBeVisible({ timeout: 10000 });
    await assertNoHorizontalOverflow(page, 'confirmation page');
  });
});
