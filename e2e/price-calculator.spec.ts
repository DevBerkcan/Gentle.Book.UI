import { test, expect, request as pwRequest, type Page } from '@playwright/test';
import { DEMO_TENANTS, loginAsTenantAdmin } from './fixtures';

// "Preisrechner" link: SuperAdmin stores a per-studio HTTPS URL; Professional/Agency admins get
// a "Preisrechner" button top-left in the sidebar that opens it in a new tab; Starter never sees it.
const API = process.env.E2E_API_URL ?? 'http://localhost:5067/api';
const SA = { email: 'qa-superadmin@gentlebook.local', password: 'QaSuperAdmin123!' };

// One SuperAdmin login for the whole file — the API's auth-limit policy allows only 8 logins
// per IP per minute, and every test below also performs a tenant-admin login.
let saToken: string | null = null;

async function setUrlFor(slug: string, url: string | null) {
  const api = await pwRequest.newContext();
  if (!saToken) {
    const login = await api.post(`${API}/auth/superadmin/login`, { data: SA });
    expect(login.ok(), `SuperAdmin login failed: ${login.status()}`).toBeTruthy();
    saToken = (await login.json()).token;
  }
  const headers = { Authorization: `Bearer ${saToken}` };
  const tenants = await (await api.get(`${API}/superadmin/tenants?page=1&pageSize=200`, { headers })).json();
  const id = (tenants.items ?? tenants.data ?? tenants).find((t: { slug: string }) => t.slug === slug).id;
  const res = await api.put(`${API}/superadmin/tenants/${id}/price-calculator`, { headers, data: { url } });
  expect(res.ok()).toBeTruthy();
  await api.dispose();
}

async function priceCalculatorLink(page: Page) {
  return page.locator('aside').getByRole('link', { name: /Preisrechner|Price calculator/ });
}

test('Professional with URL: button opens the stored URL in a new tab', async ({ page }) => {
  await setUrlFor(DEMO_TENANTS.professional, 'https://preise.example.de/studio');
  await loginAsTenantAdmin(page, DEMO_TENANTS.professional);
  const link = await priceCalculatorLink(page);
  await expect(link).toBeVisible({ timeout: 15000 });
  await expect(link).toHaveAttribute('href', 'https://preise.example.de/studio');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});

test('Professional without URL: no button', async ({ page }) => {
  await setUrlFor(DEMO_TENANTS.professional, null);
  await loginAsTenantAdmin(page, DEMO_TENANTS.professional);
  await expect(page.locator('aside').getByRole('link', { name: /Dashboard/ }).first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1500);
  await expect(await priceCalculatorLink(page)).toHaveCount(0);
});

test('Agency with URL: button visible', async ({ page }) => {
  await setUrlFor(DEMO_TENANTS.agency, 'https://agency.example.de/rechner');
  await loginAsTenantAdmin(page, DEMO_TENANTS.agency);
  await expect(await priceCalculatorLink(page)).toHaveAttribute('href', 'https://agency.example.de/rechner', { timeout: 15000 });
});

test('Starter with stored URL: no button', async ({ page }) => {
  await setUrlFor(DEMO_TENANTS.starter, 'https://starter.example.de/');
  try {
    await loginAsTenantAdmin(page, DEMO_TENANTS.starter);
    await expect(page.locator('aside').getByRole('link', { name: /Dashboard/ }).first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);
    await expect(await priceCalculatorLink(page)).toHaveCount(0);
    await expect(page.locator('a[href="https://starter.example.de/"]')).toHaveCount(0);
  } finally {
    await setUrlFor(DEMO_TENANTS.starter, null);
  }
});
