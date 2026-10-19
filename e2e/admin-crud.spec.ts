import { test, expect } from '@playwright/test';
import { DEMO_TENANTS, loginAsTenantAdmin, ensureStarterLocationAndCategory } from './fixtures';

// Closes the "So legst du Services richtig an" step-by-step onboarding guide modal that
// auto-opens on the Services page whenever the tenant has no services yet. Its close (X) button
// has no accessible name, so it's targeted by elimination: the only overlay button that isn't
// "Weiter"/"Zurück".
async function closeOnboardingGuideIfPresent(page: import('@playwright/test').Page) {
  const overlayButtons = page.locator('div.fixed.inset-0 button').filter({ hasNotText: /Weiter|Zurück/ });
  if (await overlayButtons.count() > 0) {
    await overlayButtons.first().click().catch(() => {});
  }
}

test.describe('Services admin CRUD', () => {
  test('create, edit and delete a service via the UI', async ({ page, request }) => {
    // The Services page hard-requires a BusinessLocation to exist before the "Standort" field
    // becomes selectable — none of the seeded demo tenants have one by default.
    await ensureStarterLocationAndCategory(request);

    await loginAsTenantAdmin(page, DEMO_TENANTS.starter);
    await page.goto('/admin/services');
    await page.locator('button:has-text("OK")').click().catch(() => {}); // cookie banner
    await closeOnboardingGuideIfPresent(page);

    const stamp = Date.now();
    const name = `E2E CRUD Service ${stamp}`;
    const editedName = `${name} Edited`;

    await page.getByRole('button', { name: 'Neuer Service', exact: true }).click();
    await page.getByLabel(/^Name/i).fill(name);
    await page.getByText('Kategorie auswählen').click();
    await page.getByRole('listbox', { name: /Kategorie/ }).getByText('E2E CRUD Category', { exact: true }).click();
    await page.getByLabel(/^Preis/i).fill('15');
    await page.getByRole('button', { name: 'Erstellen', exact: true }).click();

    // .first(): the create also briefly shows the name a second time elsewhere on the page.
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 10000 });

    // Edit — action icons have no aria-labels, so they're addressed by position (edit, toggle, delete).
    const row = page.locator('tr', { hasText: name }).first();
    await row.locator('button').nth(0).click();
    const nameInput = page.getByLabel(/^Name/i);
    await nameInput.fill('');
    await nameInput.fill(editedName);
    await page.getByRole('button', { name: /Speichern|Aktualisieren|Save/i }).last().click();
    await expect(page.getByText(editedName, { exact: true }).first()).toBeVisible({ timeout: 10000 });

    // Delete
    const editedRow = page.locator('tr', { hasText: editedName }).first();
    await editedRow.locator('button').nth(2).click();
    await page.getByRole('button', { name: 'Endgültig löschen' }).click();
    // Wait for the confirm modal itself to finish closing before checking the list — otherwise
    // its own lingering text (name + role in the modal body) is a false "still visible" match.
    await expect(page.getByRole('button', { name: 'Endgültig löschen' })).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(editedName, { exact: true })).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Employees admin CRUD', () => {
  test('create, edit and delete an employee via the UI', async ({ page }) => {
    await loginAsTenantAdmin(page, DEMO_TENANTS.starter);
    await page.goto('/admin/employees');
    await page.locator('button:has-text("OK")').click().catch(() => {}); // cookie banner

    const stamp = Date.now();
    const name = `E2E CRUD Employee ${stamp}`;
    const editedName = `${name} Edited`;

    await page.getByRole('button', { name: 'Mitarbeiter hinzufügen', exact: true }).click();
    await page.getByLabel(/^Name/i).fill(name);
    await page.getByLabel(/^Rolle/i).fill('Tester');
    await page.getByLabel(/Benutzername/i).fill(`e2e.crud.${stamp}`);
    await page.getByLabel(/^Passwort/i).fill('E2eCrud123!');
    await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();

    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 10000 });

    // Edit — card action icons have no aria-labels; edit is the first, delete is the last.
    const card = page.locator(`div:has-text("${name}"):has(button)`).last();
    await card.locator('button').nth(0).click();
    const nameInput = page.getByLabel(/^Name/i);
    await nameInput.fill('');
    await nameInput.fill(editedName);
    await page.getByRole('button', { name: /Speichern|Aktualisieren|Save/i }).last().click();
    await expect(page.getByText(editedName, { exact: true })).toBeVisible({ timeout: 10000 });

    // Delete
    const editedCard = page.locator(`div:has-text("${editedName}"):has(button)`).last();
    await editedCard.locator('button').last().click();
    await page.getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(page.getByRole('button', { name: 'Endgültig löschen' })).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(editedName, { exact: true })).not.toBeVisible({ timeout: 10000 });
  });
});
