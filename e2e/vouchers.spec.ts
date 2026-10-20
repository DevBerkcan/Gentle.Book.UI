import { test, expect, request as playwrightRequest } from '@playwright/test';
import { DEMO_TENANTS, loginAsTenantAdmin, waitForEmail } from './fixtures';

// Vouchers/Gutscheine are an Agency-plan-exclusive feature (see AdminVoucherController's
// RequireAgencyPlanAsync), redeemable only through the admin's manual-booking flow — there is no
// self-service redemption in the public booking wizard (ManualBookingDto.VoucherCode is the only
// place a voucher code is accepted).
const API = 'http://localhost:5067/api';

// Regression test for a bug found during this QA pass: EmailService.SendVoucherIssuedEmailAsync
// formatted a monetary voucher's value as "{amount} Guthaben" (literally the German word for
// "credit/balance", not a currency) instead of "{amount} €" — a customer receiving the email saw
// e.g. "20,00 Guthaben" with no indication it meant Euros. The admin voucher list had the same gap
// (lib/i18n/translations.ts's monetaryRemainingTemplate had no currency symbol at all). Both fixed.
test.describe('Vouchers', () => {
  test('issuing a monetary voucher shows the currency everywhere: admin list and email', async ({ page, request }) => {
    const api = await playwrightRequest.newContext();
    const loginRes = await api.post(`${API}/auth/login`, {
      data: { tenantSlug: DEMO_TENANTS.agency, email: `${DEMO_TENANTS.agency}@gentlebook.local`, password: 'Demo123!' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const auth = { Authorization: `Bearer ${token}` };

    // Idempotent customer fixture, same pattern as ensureSharedBookingFixtures.
    const custListRes = await api.get(`${API}/customers?pageSize=200`, { headers: auth });
    const custList = (await custListRes.json()).items;
    let customer = custList.find((c: any) => c.email === 'e2e-voucher-customer@example.test');
    if (!customer) {
      const res = await api.post(`${API}/customers`, {
        headers: auth,
        data: { firstName: 'E2E', lastName: 'VoucherCustomer', email: 'e2e-voucher-customer@example.test', phone: '+491751112233' },
      });
      expect(res.ok(), `customer create failed: ${await res.text()}`).toBeTruthy();
      customer = await res.json();
    }
    await api.dispose();

    await loginAsTenantAdmin(page, DEMO_TENANTS.agency);
    await page.goto('/admin/vouchers');
    await page.locator('button:has-text("OK")').click({ timeout: 3000 }).catch(() => {});

    const amount = (10 + Math.floor(Math.random() * 90)).toString();
    await page.getByRole('button', { name: 'Gutschein ausstellen' }).click();
    await page.getByPlaceholder('Betrag').fill(amount);
    await page.getByPlaceholder(/Kund:in suchen/i).fill('VoucherCustomer');
    await page.getByRole('button', { name: /E2E VoucherCustomer/ }).click();
    await page.getByRole('button', { name: 'Ausstellen' }).click();
    // Wait for the issue request to finish and the form to close before looking for the new row —
    // otherwise the assertion below can run while "Ausstellen" is still mid-submit (spinner shown).
    await expect(page.getByRole('button', { name: 'Gutschein ausstellen' })).toBeVisible({ timeout: 10000 });

    // Admin list must show the amount with a currency symbol, not a bare number.
    const row = page.getByText(new RegExp(`E2E VoucherCustomer · ${amount}[.,]00\\s*€`));
    await expect(row).toBeVisible({ timeout: 10000 });

    // The voucher-issued email must also show the amount with a currency symbol.
    const emailId = await waitForEmail(request, 'e2e-voucher-customer@example.test', 'Gutschein');
    const htmlRes = await request.get(`http://localhost:5080/api/Messages/${emailId}/html`);
    const html = await htmlRes.text();
    expect(html, 'voucher email missing currency symbol next to the amount').toMatch(new RegExp(`${amount},00\\s*€`));
    expect(html, 'voucher email regressed to showing the literal word "Guthaben" as a fake unit').not.toMatch(/[\d.,]+\s*Guthaben/);
  });
});
