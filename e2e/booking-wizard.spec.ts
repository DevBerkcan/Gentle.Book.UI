import { test, expect, request as playwrightRequest } from '@playwright/test';
import { ensureSharedBookingFixtures } from './fixtures';

// Drives the full public booking wizard (service → employee → date/time → contact → confirm)
// through the real browser UI against the local stack, using the shared "E2E Shared ..."
// fixtures (see fixtures.ts) — created, and the employee assigned to the service, if missing.
test.describe('Public booking wizard', () => {
  test('a customer can complete a booking end to end', async ({ page }) => {
    const api = await playwrightRequest.newContext();
    await ensureSharedBookingFixtures(api);
    await api.dispose();

    await page.goto('/booking/demo-professional/book');
    await page.getByRole('button', { name: 'OK' }).click().catch(() => {});

    // Step 1: service
    await expect(page.getByText('Schritt 1 von 4')).toBeVisible();
    await page.getByText('E2E Shared Category', { exact: true }).click();
    await page.getByText('E2E Shared Service', { exact: true }).click();
    await page.getByRole('button', { name: /Weiter/i }).click();

    // Step 2: employee — with only one employee assigned to the service, the wizard
    // pre-selects it automatically; just confirm and move on.
    await expect(page.getByText('Schritt 2 von 4')).toBeVisible();
    await expect(page.getByText('E2E Shared Employee').first()).toBeVisible();
    await page.getByRole('button', { name: /Weiter/i }).click();

    // Step 3: date & time — day cards render as "Mo\n19" (newline, not space) in raw innerText,
    // which plain hasText-regex matching doesn't normalize but accessible-name computation does
    // — use getByRole/name for that reason, not a text filter. Pick the *second* enabled day, not
    // the first: the first is "today", which (depending on wall-clock time) can have every
    // remaining slot already in the past and therefore disabled.
    await expect(page.getByText('Schritt 3 von 4')).toBeVisible();
    const enabledDay = page.getByRole('button', { name: /^(Mo|Di|Mi|Do|Fr|Sa) \d{1,2}$/ }).nth(1);
    await enabledDay.click();
    const timeSlot = page.locator('button:not([disabled])').filter({ hasText: /^\d{1,2}:\d{2}$/ }).first();
    await expect(timeSlot).toBeVisible({ timeout: 10000 });
    await timeSlot.click();
    await page.getByRole('button', { name: /Weiter/i }).click();

    // Step 4: contact details
    await expect(page.getByText('Schritt 4 von 4')).toBeVisible();
    const stamp = Date.now();
    await page.getByLabel(/Vorname|First name/i).fill('E2E');
    await page.getByLabel(/Nachname|Last name/i).fill(`Wizard${stamp}`);
    await page.getByLabel(/^E-Mail|^Email/i).fill(`e2e-wizard-${stamp}@example.test`);
    await page.getByLabel(/Telefon|Phone/i).fill('+491701234567');
    const privacyCheckbox = page.getByRole('checkbox');
    if (await privacyCheckbox.count() > 0) await privacyCheckbox.first().check();

    await page.getByRole('button', { name: /Jetzt buchen|Termin buchen|Book now|Confirm booking/i }).click();

    await expect(page).toHaveURL(/\/booking\/confirmation\//, { timeout: 15000 });
    await expect(page.getByText(/bestätigt|confirmed|Buchungsnummer|Booking number/i).first()).toBeVisible({ timeout: 10000 });
  });
});
