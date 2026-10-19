import { test, expect, request as playwrightRequest } from '@playwright/test';

// Pure API-level test (no browser UI) against the local backend directly — the double-booking
// race is a database/transaction concern, not a frontend one, so this is the most direct way to
// prove it. Uses the demo-professional dev tenant (see e2e/fixtures.ts); creates its own
// category/service/employee via the real admin API so it doesn't depend on manual seeding.
const API = 'http://localhost:5067/api';

test.describe('Booking double-booking prevention', () => {
  test('two simultaneous bookings for the same employee/slot — exactly one succeeds', async () => {
    const api = await playwrightRequest.newContext();

    const loginRes = await api.post(`${API}/auth/login`, {
      data: { tenantSlug: 'demo-professional', email: 'demo-professional@gentlebook.local', password: 'Demo123!' },
    });
    expect(loginRes.ok(), `login failed: ${await loginRes.text()}`).toBeTruthy();
    const { token } = await loginRes.json();
    const auth = { Authorization: `Bearer ${token}` };

    const catRes = await api.post(`${API}/admin/services/categories`, {
      headers: auth,
      data: { name: `E2E Category ${Date.now()}`, description: null, displayOrder: 0 },
    });
    expect(catRes.ok(), `category create failed: ${await catRes.text()}`).toBeTruthy();
    const category = await catRes.json();

    const svcRes = await api.post(`${API}/admin/services`, {
      headers: auth,
      data: {
        name: `E2E Service ${Date.now()}`, description: null, durationMinutes: 30, bufferTimeMinutes: 0,
        price: 10, displayOrder: 0, categoryId: category.id, currency: 'EUR', employeeIds: null,
      },
    });
    expect(svcRes.ok(), `service create failed: ${await svcRes.text()}`).toBeTruthy();
    const service = await svcRes.json();

    const empRes = await api.post(`${API}/employees`, {
      headers: auth,
      data: { name: `E2E Employee ${Date.now()}`, role: 'Stylist', specialty: null, username: null, password: null, location: null },
    });
    expect(empRes.ok(), `employee create failed: ${await empRes.text()}`).toBeTruthy();
    const employee = await empRes.json();
    const employeeId = employee.id ?? employee.data?.id;

    // A fixed future slot, specific to this test run (random minute) so repeated runs don't
    // collide with a previous run's leftover booking.
    const date = new Date();
    date.setDate(date.getDate() + 14);
    const bookingDate = date.toISOString().slice(0, 10);
    const startTime = `${9 + (Math.floor(Math.random() * 6))}:00`;

    const bookingPayload = (suffix: string) => ({
      serviceId: service.id,
      bookingDate,
      startTime,
      customer: { firstName: 'E2E', lastName: suffix, email: `e2e-${suffix}-${Date.now()}@example.test`, phone: '+491701234567' },
      customerNotes: null,
      employeeId,
    });

    const [resA, resB] = await Promise.all([
      api.post(`${API}/bookings`, { data: bookingPayload('A') }),
      api.post(`${API}/bookings`, { data: bookingPayload('B') }),
    ]);

    const statuses = [resA.status(), resB.status()].sort();
    // One booking succeeds (201); the other is rejected as a conflict (409) — never both 201.
    expect(statuses, `got statuses ${JSON.stringify(statuses)}: A=${await resA.text()} B=${await resB.text()}`).toEqual([201, 409]);

    await api.dispose();
  });
});
