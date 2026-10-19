import { type Page, type APIRequestContext, expect } from '@playwright/test';

const API = 'http://localhost:5067/api';

// Dev-only demo tenants seeded by Program.cs (IsDevelopment() block) — never real customers.
// One per plan tier. Password is the same fixed dev value for all four, intentionally.
export const DEMO_TENANTS = {
  trial: 'demo-trial',
  starter: 'demo-starter',
  professional: 'demo-professional',
  agency: 'demo-agency',
} as const;

export const DEMO_PASSWORD = 'Demo123!';

export function demoEmail(slug: string) {
  return `${slug}@gentlebook.local`;
}

/** Drives the real admin login form (tenant-admin mode) — not a localStorage shortcut. */
export async function loginAsTenantAdmin(page: Page, slug: string, password = DEMO_PASSWORD) {
  await page.goto('/admin/login');
  // Admin mode is the default tab, but assert it in case that ever changes.
  await page.getByRole('button', { name: /admin/i }).first().click().catch(() => {});
  await page.getByPlaceholder(/Buchungssystem-ID|Booking system ID/i).fill(slug);
  await page.getByPlaceholder(/^E-Mail$|^Email$/i).fill(demoEmail(slug));
  await page.getByPlaceholder(/Passwort|Password/i).fill(password);
  await page.getByRole('button', { name: /Anmelden|Sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/(dashboard|onboarding)/, { timeout: 15000 });
}

/**
 * Find-or-create a shared "E2E Shared ..." category/service/employee fixture set for
 * demo-professional, with the employee assigned to the service (bookable end to end), and
 * return a bearer token for further API calls. Idempotent — safe to call from every spec that
 * needs booking fixtures, instead of each one creating (and accumulating) its own rows.
 */
export async function ensureSharedBookingFixtures(api: APIRequestContext) {
  const loginRes = await api.post(`${API}/auth/login`, {
    data: { tenantSlug: DEMO_TENANTS.professional, email: demoEmail(DEMO_TENANTS.professional), password: DEMO_PASSWORD },
  });
  expect(loginRes.ok(), `login failed: ${await loginRes.text()}`).toBeTruthy();
  const { token } = await loginRes.json();
  const auth = { Authorization: `Bearer ${token}` };

  const catListRes = await api.get(`${API}/admin/services/categories`, { headers: auth });
  let category = (await catListRes.json()).find((c: any) => c.name === 'E2E Shared Category');
  if (!category) {
    const res = await api.post(`${API}/admin/services/categories`, {
      headers: auth, data: { name: 'E2E Shared Category', description: null, displayOrder: 0 },
    });
    expect(res.ok(), `category create failed: ${await res.text()}`).toBeTruthy();
    category = await res.json();
  }

  const svcListRes = await api.get(`${API}/admin/services`, { headers: auth });
  let service = (await svcListRes.json()).find((s: any) => s.name === 'E2E Shared Service');
  if (!service) {
    const res = await api.post(`${API}/admin/services`, {
      headers: auth,
      data: {
        name: 'E2E Shared Service', description: null, durationMinutes: 30, bufferTimeMinutes: 0,
        price: 10, displayOrder: 0, categoryId: category.id, currency: 'EUR', employeeIds: null,
      },
    });
    expect(res.ok(), `service create failed: ${await res.text()}`).toBeTruthy();
    service = await res.json();
  }

  const empListRes = await api.get(`${API}/employees`, { headers: auth });
  const empList = await empListRes.json();
  let employee = (Array.isArray(empList) ? empList : empList.data).find((e: any) => e.name === 'E2E Shared Employee');
  if (!employee) {
    const res = await api.post(`${API}/employees`, {
      headers: auth,
      data: { name: 'E2E Shared Employee', role: 'Stylist', specialty: null, username: null, password: null, location: null },
    });
    expect(res.ok(), `employee create failed: ${await res.text()}`).toBeTruthy();
    employee = await res.json();
  }
  const employeeId = employee.id ?? employee.data?.id;

  // Idempotent: re-assigning an already-assigned service is a harmless no-op server-side.
  const assignRes = await api.post(`${API}/admin/services/employees/${employeeId}/services/bulk`, {
    headers: auth, data: [service.id],
  });
  expect(assignRes.ok(), `employee/service assignment failed: ${await assignRes.text()}`).toBeTruthy();

  return { token, auth, category, service, employeeId };
}
