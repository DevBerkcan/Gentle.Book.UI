import { test, expect, request as playwrightRequest } from '@playwright/test';
import { DEMO_TENANTS, demoEmail, DEMO_PASSWORD } from './fixtures';

// Intake forms ("Formulare"/Anamnese) are gated to the Agency plan AND a fixed allow-list of
// industries that actually do a consultation before treatment (see IntakeFormIndustryGate.cs) —
// demo-agency is seeded as "Hairdresser", which qualifies for both gates.
const API = 'http://localhost:5067/api';

test.describe('Intake forms', () => {
  test('a required field set by the admin is offered after booking, filled by the customer, and visible on the booking', async ({ page, request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { tenantSlug: DEMO_TENANTS.agency, email: demoEmail(DEMO_TENANTS.agency), password: DEMO_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const auth = { Authorization: `Bearer ${token}` };

    // Idempotent field fixture, same pattern as the booking/voucher fixtures.
    const fieldsRes = await request.get(`${API}/admin/intake-form/fields`, { headers: auth });
    const fields = await fieldsRes.json();
    let field = fields.find((f: any) => f.label === 'E2E Intake Field');
    if (!field) {
      const res = await request.post(`${API}/admin/intake-form/fields`, {
        headers: auth,
        data: { label: 'E2E Intake Field', fieldType: 'Text', formType: 'Anamnese', categoryId: null, isRequired: true },
      });
      expect(res.ok(), `field create failed: ${await res.text()}`).toBeTruthy();
      field = await res.json();
    } else if (!field.isActive) {
      // Re-activate if a previous run (or manual testing) deactivated it.
      const res = await request.put(`${API}/admin/intake-form/fields/${field.id}`, {
        headers: auth,
        data: { label: field.label, fieldType: field.fieldType, formType: field.formType, categoryId: field.categoryId, isRequired: true, isActive: true },
      });
      expect(res.ok(), `field reactivate failed: ${await res.text()}`).toBeTruthy();
    }

    // A service + employee to book against — reuses the fixture set-up pattern from vouchers.spec.ts
    // (ensureSharedBookingFixtures targets demo-professional, which is a different plan/industry).
    const svcListRes = await request.get(`${API}/admin/services`, { headers: auth });
    let service = (await svcListRes.json()).find((s: any) => s.name === 'E2E Intake Service');
    if (!service) {
      const catListRes = await request.get(`${API}/admin/services/categories`, { headers: auth });
      let category = (await catListRes.json()).find((c: any) => c.name === 'E2E Intake Category');
      if (!category) {
        const res = await request.post(`${API}/admin/services/categories`, {
          headers: auth, data: { name: 'E2E Intake Category', description: null, displayOrder: 0 },
        });
        category = await res.json();
      }
      const locListRes = await request.get(`${API}/tenant/locations`, { headers: auth });
      let location = (await locListRes.json()).data.find((l: any) => l.name === 'E2E Intake Standort');
      if (!location) {
        const res = await request.post(`${API}/tenant/locations`, {
          headers: auth,
          data: { name: 'E2E Intake Standort', street: 'Teststrasse 1', postalCode: '10115', city: 'Berlin',
            countryCode: 'DE', currency: 'EUR', timeZone: 'Europe/Berlin', isDefault: false, isActive: true },
        });
        const locId = (await res.json()).data;
        location = { id: locId };
      }
      const res = await request.post(`${API}/admin/services`, {
        headers: auth,
        data: { name: 'E2E Intake Service', description: null, durationMinutes: 30, bufferTimeMinutes: 0,
          price: 40, displayOrder: 0, categoryId: category.id, currency: 'EUR', employeeIds: null },
      });
      service = await res.json();
    }

    const empListRes = await request.get(`${API}/employees`, { headers: auth });
    const empListBody = await empListRes.json();
    let employee = (Array.isArray(empListBody) ? empListBody : empListBody.data).find((e: any) => e.name === 'E2E Intake Employee');
    if (!employee) {
      const res = await request.post(`${API}/employees`, {
        headers: auth, data: { name: 'E2E Intake Employee', role: 'Stylist', specialty: null, username: null, password: null, location: null },
      });
      employee = await res.json();
    }
    const employeeId = employee.id ?? employee.data?.id;
    await request.post(`${API}/admin/services/employees/${employeeId}/services/bulk`, { headers: auth, data: [service.id] });

    // A unique date/customer per run so "already submitted" from a previous run never blocks this one.
    const stamp = Date.now();
    const offsetDays = 14 + Math.floor(Math.random() * 300);
    const bookingDate = new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
    // Manual admin bookings aren't gated by business hours (staff can book outside "online"
    // hours), so a wide day range plus a randomized hour keeps collisions with earlier test runs
    // (or this file's own earlier manual exploration bookings) effectively impossible.
    const startTime = `${String(8 + Math.floor(Math.random() * 10)).padStart(2, '0')}:00`;
    const customerEmail = `e2e-intake-${stamp}@example.test`;

    const bookRes = await request.post(`${API}/admin/manual/booking`, {
      headers: auth,
      data: {
        serviceId: service.id, bookingDate, startTime,
        firstName: 'E2E', lastName: `IntakeCustomer${stamp}`, email: customerEmail, phone: `+4917${String(stamp).slice(-8)}`,
        customerNotes: null, employeeId, voucherCode: null,
      },
    });
    expect(bookRes.ok(), `manual booking failed: ${await bookRes.text()}`).toBeTruthy();
    const booking = await bookRes.json();

    // The backend must consider the form available for this booking.
    const availRes = await request.get(`${API}/public/intake-form/for-booking/${booking.id}`);
    const avail = await availRes.json();
    expect(avail.available, 'intake form not offered for this booking').toBeTruthy();

    // Customer flow: confirmation page -> "Formular ausfüllen" link -> fill -> submit.
    await page.goto(`/booking/confirmation/${booking.id}`);
    await page.getByRole('button', { name: 'OK' }).click({ timeout: 3000 }).catch(() => {});
    const formLink = page.getByRole('link', { name: /Formular ausfüllen/i });
    await expect(formLink).toBeVisible({ timeout: 10000 });
    await formLink.click();

    await expect(page.getByText('E2E Intake Field')).toBeVisible({ timeout: 10000 });
    const answerText = `E2E answer ${stamp}`;
    // Fill every text input, not just the first — other required fields may exist from earlier
    // manual testing in this environment (categoryId: null fields apply to every service), and
    // the submit button stays disabled until all required fields are filled.
    const textInputs = page.locator('input[type=text], input:not([type])');
    const inputCount = await textInputs.count();
    for (let i = 0; i < inputCount; i++) {
      await textInputs.nth(i).fill(answerText);
    }
    await page.getByRole('button', { name: 'Formular absenden' }).click();
    await expect(page.getByText(/Vielen Dank/i)).toBeVisible({ timeout: 10000 });

    // Admin side: the response must be retrievable and show the submitted answer.
    const responseRes = await request.get(`${API}/admin/intake-form/responses/by-booking/${booking.id}`, { headers: auth });
    const response = await responseRes.json();
    expect(response.hasResponse).toBe(true);
    expect(response.answers.find((a: any) => a.label === 'E2E Intake Field')?.value).toBe(answerText);
  });
});
