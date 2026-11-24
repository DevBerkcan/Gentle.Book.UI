import { test, expect, request as pwRequest, type APIRequestContext } from '@playwright/test';
import { DEMO_TENANTS, DEMO_PASSWORD, demoEmail, loginAsTenantAdmin } from './fixtures';

// Behandlungspakete + "Offene Folgetermine" through the real UI. The data setup (a customer with
// a 6-session package, 3 sessions completed) goes through the normal API entry points; the
// assertions are on what the studio owner actually sees and clicks.
const API = process.env.E2E_API_URL ?? 'http://localhost:5067/api';
const SLUG = DEMO_TENANTS.professional;
const stamp = Date.now();
const LAST_NAME = `Paket${stamp}`;
const NOTE = 'Intern: Hauttyp II, Kühlung beachten';

let customerId = '';
let packageId = '';
let packageLinkPath = '';
let serviceName = '';
let completedBookingId = '';

async function freeSlot(api: APIRequestContext, serviceId: string, employeeId: string, used: Set<string>) {
  for (let d = 2; d < 60; d++) {
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
  const login = await api.post(`${API}/auth/login`, { data: { tenantSlug: SLUG, email: demoEmail(SLUG), password: DEMO_PASSWORD } });
  expect(login.ok()).toBeTruthy();
  const body = await login.json();
  const headers = { Authorization: `Bearer ${body.token ?? body.data?.token}` };

  const services = await (await api.get(`${API}/services?tenantSlug=${SLUG}`)).json();
  let service: { id: string; name: string } | null = null;
  let employee: { id: string } | null = null;
  for (const s of services) {
    const emps = await (await api.get(`${API}/employees/by-service/${s.id}?activeOnly=true&tenantSlug=${SLUG}`)).json();
    if (Array.isArray(emps) && emps.length) { service = s; employee = emps[0]; break; }
  }
  expect(service && employee).toBeTruthy();
  serviceName = service!.name;

  const customer = await (await api.post(`${API}/customers`, {
    headers, data: { firstName: 'Lena', lastName: LAST_NAME, email: `lena-${stamp}@example.de`, phone: null, notes: NOTE },
  })).json();
  customerId = customer.id ?? customer.data?.id;

  const pkg = await (await api.post(`${API}/treatment-packages`, {
    headers, data: { customerId, serviceId: service!.id, totalSessions: 6 },
  })).json();
  packageId = pkg.id;
  packageLinkPath = pkg.bookingLinkPath;

  const used = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const slot = await freeSlot(api, service!.id, employee!.id, used);
    const b = await (await api.post(`${API}/admin/manual/booking`, {
      headers,
      data: {
        serviceId: service!.id, bookingDate: slot.date, startTime: slot.time, firstName: 'Lena', lastName: LAST_NAME,
        email: null, phone: null, customerNotes: null, employeeId: employee!.id, voucherCode: null, treatmentPackageId: packageId,
      },
    })).json();
    const done = await api.patch(`${API}/admin/bookings/${b.id}/status`, { headers, data: { status: 'Completed', adminNotes: null } });
    expect(done.ok()).toBeTruthy();
    completedBookingId = b.id;
  }
  await api.dispose();
});

test('Dashboard → Kundenkartei → Termindetails → Termin buchen', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await loginAsTenantAdmin(page, SLUG);

  // Dashboard: "Offene Folgetermine" lists the package with reason + open sessions.
  await page.goto('/admin/dashboard');
  const card = page.getByTestId('follow-ups-card');
  await expect(card).toBeVisible({ timeout: 20000 });
  const item = card.getByTestId('follow-up-item').filter({ hasText: LAST_NAME });
  await expect(item).toBeVisible();
  await expect(item).toContainText('Folgetermin fehlt');
  await expect(item).toContainText('3 von 6 offen');
  await expect(item).toContainText(serviceName);

  // "Buchungslink kopieren" puts the personal link on the clipboard.
  await item.getByRole('button', { name: /Buchungslink kopieren/ }).click();
  await expect(item.getByRole('button', { name: /Link kopiert/ })).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('packageToken=');
  expect(clip).toContain(`/booking/${SLUG}/book?serviceId=`);
  await page.waitForTimeout(800); // let modal/fade-in animations settle for a readable screenshot
  await page.screenshot({ path: test.info().outputPath('dashboard-follow-ups.png'), fullPage: false });

  // Kundenkartei: progress 3 of 6, internal note.
  await page.goto(`/admin/customers?customer=${customerId}`);
  const panel = page.getByTestId('customer-packages-panel');
  await expect(panel).toBeVisible({ timeout: 20000 });
  await expect(panel.getByTestId('package-progress')).toContainText('3 von 6 Sitzungen abgeschlossen');
  await expect(panel.getByTestId('package-progress')).toContainText('3 offen');
  await expect(page.getByText(NOTE)).toBeVisible();
  await page.waitForTimeout(800); // let modal/fade-in animations settle for a readable screenshot
  await panel.screenshot({ path: test.info().outputPath('kundenkartei-paket.png') });

  // Termindetails: package + internal note directly in the appointment view.
  await page.goto('/admin/bookings');
  await page.getByPlaceholder('Name, E-Mail, Telefon...').first().fill(LAST_NAME);
  const row = page.locator('tbody tr').filter({ hasText: LAST_NAME }).first();
  await expect(row).toBeVisible({ timeout: 20000 });
  await row.click();
  await expect(page.getByTestId('booking-package-panel')).toContainText('3 von 6 Sitzungen abgeschlossen', { timeout: 15000 });
  await expect(page.getByTestId('booking-internal-notes')).toContainText(NOTE);
  await page.waitForTimeout(800); // let modal/fade-in animations settle for a readable screenshot
  await page.getByTestId('booking-package-panel').screenshot({ path: test.info().outputPath('termindetails-paket.png') });
  await page.getByTestId('booking-internal-notes').screenshot({ path: test.info().outputPath('termindetails-notiz.png') });
  await page.keyboard.press('Escape');

  // "Termin buchen" from the dashboard opens the manual booking form prefilled as a package session.
  await page.goto('/admin/dashboard');
  await card.getByTestId('follow-up-item').filter({ hasText: LAST_NAME })
    .getByRole('button', { name: /Termin buchen/ }).click();
  await expect(page).toHaveURL(/\/admin\/bookings/);
  const banner = page.getByTestId('package-booking-banner');
  await expect(banner).toBeVisible({ timeout: 20000 });
  await expect(banner).toContainText(`Lena ${LAST_NAME}`);
  await expect(page.getByRole('dialog').getByText(serviceName).first()).toBeVisible();
  await page.waitForTimeout(800); // let modal/fade-in animations settle for a readable screenshot
  await page.screenshot({ path: test.info().outputPath('termin-buchen-paket.png'), fullPage: false });
});

test('Persönlicher Link: Hinweis ohne Kundendaten, Leistung vorausgewählt; ungültiger Link warnt', async ({ page }) => {
  await page.goto(packageLinkPath);
  const banner = page.getByTestId('package-link-banner');
  await expect(banner).toBeVisible({ timeout: 20000 });
  await expect(banner).toContainText('Folgetermin für Ihr Behandlungspaket');
  const html = await page.content();
  expect(html).not.toContain(LAST_NAME);
  expect(html).not.toContain('Hauttyp');
  await page.waitForTimeout(800); // let modal/fade-in animations settle for a readable screenshot
  await page.screenshot({ path: test.info().outputPath('oeffentlicher-link.png'), fullPage: false });

  await page.goto(`/booking/${SLUG}/book?packageToken=ungueltig`);
  await expect(page.getByTestId('package-link-invalid')).toBeVisible({ timeout: 20000 });
});
