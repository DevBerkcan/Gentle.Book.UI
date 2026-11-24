import { test, expect, request as pwRequest, type APIRequestContext } from '@playwright/test';
import { DEMO_TENANTS, DEMO_PASSWORD, demoEmail, loginAsTenantAdmin } from './fixtures';

// "Freunde machen Freude" + Studio-Pass through the real UI — the sales demo:
// Lisa (regular) invites Anna via WhatsApp link → Anna's first visit is completed → both see their
// bonus in their pass → the studio sees the won first visit and marks the bonus as redeemed.
// Data setup goes through the normal API entry points; assertions are on what people see.
const API = process.env.E2E_API_URL ?? 'http://localhost:5067/api';
const SLUG = DEMO_TENANTS.professional;
const stamp = Date.now();
const REWARD = 'Nail-Art-Upgrade beim nächsten Besuch';

let headers: Record<string, string> = {};
let lisaId = '';
let annaId = '';
let lisaPassPath = '';
let annaPassPath = '';
let sharePath = '';

async function freeSlot(api: APIRequestContext, serviceId: string, employeeId: string, used: Set<string>) {
  for (let d = 3; d < 60; d++) {
    const date = new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
    const r = await (await api.get(`${API}/availability/${serviceId}?date=${date}&employeeId=${employeeId}&tenantSlug=${SLUG}`)).json();
    for (const s of r.availableSlots ?? []) {
      const key = `${date} ${s.startTime}`;
      if (s.isAvailable && !used.has(key)) { used.add(key); return { date, time: s.startTime as string }; }
    }
  }
  throw new Error('no free slot');
}

test.beforeAll(async () => {
  const api = await pwRequest.newContext();
  const login = await (await api.post(`${API}/auth/login`, { data: { tenantSlug: SLUG, email: demoEmail(SLUG), password: DEMO_PASSWORD } })).json();
  headers = { Authorization: `Bearer ${login.token ?? login.data?.token}` };
  expect((await api.put(`${API}/referrals/settings`, { headers, data: { enabled: true, rewardText: REWARD } })).ok()).toBeTruthy();

  const services = await (await api.get(`${API}/services?tenantSlug=${SLUG}`)).json();
  let service: { id: string } | null = null; let employee: { id: string } | null = null;
  for (const s of services) {
    const emps = await (await api.get(`${API}/employees/by-service/${s.id}?activeOnly=true&tenantSlug=${SLUG}`)).json();
    if (Array.isArray(emps) && emps.length) { service = s; employee = emps[0]; break; }
  }
  const used = new Set<string>();
  const customerIdOf = async (bookingId: string) =>
    (await (await api.get(`${API}/treatment-packages/for-booking/${bookingId}`, { headers })).json()).customerId as string;

  // Lisa: a regular with one completed visit (studio books her manually).
  const s1 = await freeSlot(api, service!.id, employee!.id, used);
  const lisaBooking = await (await api.post(`${API}/admin/manual/booking`, {
    headers,
    data: { serviceId: service!.id, bookingDate: s1.date, startTime: s1.time, firstName: 'Lisa', lastName: `Stamm${stamp}`, email: `lisa-ui-${stamp}@example.de`, phone: null, customerNotes: null, employeeId: employee!.id, voucherCode: null },
  })).json();
  await api.patch(`${API}/admin/bookings/${lisaBooking.id}/status`, { headers, data: { status: 'Completed', adminNotes: null } });
  lisaId = await customerIdOf(lisaBooking.id);
  lisaPassPath = (await (await api.get(`${API}/referrals/customer/${lisaId}`, { headers })).json()).passPath;
  sharePath = (await (await api.get(`${API}/pass/${lisaPassPath.split('/').pop()}`)).json()).referral.sharePath;

  // Anna books herself via Lisa's link (public booking), then her first visit is completed.
  const code = sharePath.split('ref=')[1];
  const s2 = await freeSlot(api, service!.id, employee!.id, used);
  const annaBooking = await (await api.post(`${API}/bookings?tenantSlug=${SLUG}`, {
    data: {
      serviceId: service!.id, bookingDate: s2.date, startTime: s2.time, employeeId: employee!.id, customerNotes: null, referralCode: code,
      customer: { firstName: 'Anna', lastName: `Freundin${stamp}`, email: `anna-ui-${stamp}@example.de`, phone: `0161${stamp % 10000000}` },
    },
  })).json();
  await api.patch(`${API}/admin/bookings/${annaBooking.id}/status`, { headers, data: { status: 'Completed', adminNotes: null } });
  annaId = await customerIdOf(annaBooking.id);
  annaPassPath = (await (await api.get(`${API}/referrals/customer/${annaId}`, { headers })).json()).passPath;

  // Lisa has a next appointment and an open laser package, so the pass shows everything.
  const s3 = await freeSlot(api, service!.id, employee!.id, used);
  await api.post(`${API}/admin/manual/booking`, {
    headers,
    data: { serviceId: service!.id, bookingDate: s3.date, startTime: s3.time, firstName: 'Lisa', lastName: `Stamm${stamp}`, email: `lisa-ui-${stamp}@example.de`, phone: null, customerNotes: null, employeeId: null, voucherCode: null },
  });
  await api.post(`${API}/treatment-packages`, { headers, data: { customerId: lisaId, serviceId: service!.id, totalSessions: 6, previouslyUsedSessions: 3 } });
  await api.dispose();
});

test.describe('Kundin (Handy)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Studio-Pass: Termin, Paket, Bonus und „Freundin einladen“ per WhatsApp', async ({ page }) => {
    await page.goto(lisaPassPath);
    await expect(page.getByTestId('studio-pass')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Hallo Lisa' })).toBeVisible();
    await expect(page.getByTestId('pass-next-appointment')).toContainText('Termin verwalten');
    await expect(page.getByTestId('pass-packages')).toContainText('Noch 3 von 6 Sitzungen offen');
    await expect(page.getByTestId('pass-packages').getByRole('link', { name: /Nächste Sitzung buchen/ })).toHaveAttribute('href', /packageToken=/);
    await expect(page.getByTestId('pass-rewards')).toContainText('Danke für Ihre Empfehlung');
    await expect(page.getByTestId('pass-rewards')).toContainText(REWARD);

    const wa = page.getByTestId('pass-share-whatsapp');
    await expect(wa).toBeVisible();
    const href = decodeURIComponent((await wa.getAttribute('href'))!);
    expect(href).toContain('https://wa.me/?text=');
    expect(href).toContain(sharePath);
    expect(href).toContain(REWARD);
    await expect(page.getByTestId('pass-referral')).toContainText('1 eingeladen · 1 Erstbesuche');

    const html = await page.content();
    expect(html).not.toContain(`lisa-ui-${stamp}`); // no e-mail on the pass
    await page.waitForTimeout(500);
    await page.screenshot({ path: test.info().outputPath('pass-lisa.png'), fullPage: true });
  });

  test('Freundin öffnet den Link: Einladungshinweis auf der Buchungsseite', async ({ page }) => {
    await page.goto(sharePath);
    await expect(page.getByTestId('referral-banner')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('referral-banner')).toContainText('Sie wurden von einer Freundin eingeladen');
    expect(await page.content()).not.toContain(`Stamm${stamp}`); // referrer's name is never shown
  });

  test('Annas Pass zeigt den Willkommensbonus; ungültiger Pass zeigt Hinweis', async ({ page }) => {
    await page.goto(annaPassPath);
    await expect(page.getByTestId('pass-rewards')).toContainText('Willkommensbonus', { timeout: 20000 });
    await page.goto('/pass/ungueltig');
    await expect(page.getByTestId('pass-not-found')).toBeVisible({ timeout: 20000 });
  });
});

test('Studio: Dashboard-Kennzahlen, Kundenkartei mit Bonus einlösen, Einstellungen', async ({ page }) => {
  await loginAsTenantAdmin(page, SLUG);

  await page.goto('/admin/dashboard');
  const card = page.getByTestId('referral-stats-card');
  await expect(card).toBeVisible({ timeout: 20000 });
  await expect(card).toContainText('Wahrgenommene Ersttermine');
  await expect(card).toContainText(`Lisa Stamm${stamp} → Anna Freundin${stamp}`);
  await page.waitForTimeout(600);
  await card.screenshot({ path: test.info().outputPath('dashboard-referral.png') });

  await page.goto(`/admin/customers?customer=${lisaId}`);
  const panel = page.getByTestId('customer-pass-panel');
  await expect(panel).toBeVisible({ timeout: 20000 });
  await expect(panel).toContainText(`Anna Freundin${stamp}`);
  await expect(panel).toContainText('Erstbesuch wahrgenommen');
  await panel.getByRole('button', { name: 'Als eingelöst markieren' }).click();
  await expect(panel).toContainText('Eingelöst am', { timeout: 10000 });
  await panel.screenshot({ path: test.info().outputPath('kundenkartei-freundesaktion.png') });

  await page.goto('/admin/settings#section-referral');
  const section = page.getByTestId('referral-settings');
  await expect(section).toBeVisible({ timeout: 20000 });
  await expect(section.getByRole('checkbox')).toBeChecked();
  await expect(section.getByLabel('Prämie für beide')).toHaveValue(REWARD);
});

test('Lisas Pass zeigt den Bonus danach als eingelöst', async ({ page }) => {
  await page.goto(lisaPassPath);
  await expect(page.getByTestId('pass-rewards')).toContainText('Eingelöst', { timeout: 20000 });
});
