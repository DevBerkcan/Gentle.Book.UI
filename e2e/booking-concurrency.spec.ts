import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';

// Pure API-level test (no browser UI) against the local backend directly — the double-booking
// race is a database/transaction concern, not a frontend one, so this is the most direct way to
// prove it. Uses the demo-professional dev tenant (see e2e/fixtures.ts).
//
// Fixtures are named "E2E Shared ..." and reused across runs (find-or-create) rather than
// created fresh every time: this suite was originally create-only, and five manual re-runs while
// chasing a flaky result silently filled demo-professional's employee roster up to its
// Professional-plan limit (10) with throwaway rows. Reusing one fixed category/service/employee
// avoids that entirely and keeps repeated runs fast.
const API = 'http://localhost:5067/api';

async function findOrCreateCategory(api: APIRequestContext, auth: Record<string, string>) {
  const listRes = await api.get(`${API}/admin/services/categories`, { headers: auth });
  const existing = (await listRes.json()).find((c: any) => c.name === 'E2E Shared Category');
  if (existing) return existing;

  const res = await api.post(`${API}/admin/services/categories`, {
    headers: auth, data: { name: 'E2E Shared Category', description: null, displayOrder: 0 },
  });
  expect(res.ok(), `category create failed: ${await res.text()}`).toBeTruthy();
  return res.json();
}

async function findOrCreateService(api: APIRequestContext, auth: Record<string, string>, categoryId: string) {
  const listRes = await api.get(`${API}/admin/services`, { headers: auth });
  const existing = (await listRes.json()).find((s: any) => s.name === 'E2E Shared Service');
  if (existing) return existing;

  const res = await api.post(`${API}/admin/services`, {
    headers: auth,
    data: {
      name: 'E2E Shared Service', description: null, durationMinutes: 30, bufferTimeMinutes: 0,
      price: 10, displayOrder: 0, categoryId, currency: 'EUR', employeeIds: null,
    },
  });
  expect(res.ok(), `service create failed: ${await res.text()}`).toBeTruthy();
  return res.json();
}

async function findOrCreateEmployee(api: APIRequestContext, auth: Record<string, string>) {
  const listRes = await api.get(`${API}/employees`, { headers: auth });
  const list = await listRes.json();
  const existing = (Array.isArray(list) ? list : list.data).find((e: any) => e.name === 'E2E Shared Employee');
  if (existing) return existing;

  const res = await api.post(`${API}/employees`, {
    headers: auth,
    data: { name: 'E2E Shared Employee', role: 'Stylist', specialty: null, username: null, password: null, location: null },
  });
  expect(res.ok(), `employee create failed: ${await res.text()}`).toBeTruthy();
  return res.json();
}

test.describe('Booking double-booking prevention', () => {
  test('two simultaneous bookings for the same employee/slot — exactly one succeeds', async () => {
    const api = await playwrightRequest.newContext();

    const loginRes = await api.post(`${API}/auth/login`, {
      data: { tenantSlug: 'demo-professional', email: 'demo-professional@gentlebook.local', password: 'Demo123!' },
    });
    expect(loginRes.ok(), `login failed: ${await loginRes.text()}`).toBeTruthy();
    const { token } = await loginRes.json();
    const auth = { Authorization: `Bearer ${token}` };

    const category = await findOrCreateCategory(api, auth);
    const service = await findOrCreateService(api, auth, category.id);
    const employee = await findOrCreateEmployee(api, auth);
    const employeeId = employee.id ?? employee.data?.id;

    // A random future slot so repeated runs don't collide with a previous run's leftover booking
    // (the shared employee/service fixtures are reused, but each run still needs a fresh slot).
    const date = new Date();
    date.setDate(date.getDate() + 14 + Math.floor(Math.random() * 40)); // stays under the 60-day max-advance-booking limit
    const bookingDate = date.toISOString().slice(0, 10);
    const startTime = `${9 + Math.floor(Math.random() * 6)}:00`;

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
