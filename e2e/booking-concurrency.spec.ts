import { test, expect, request as playwrightRequest } from '@playwright/test';
import { ensureSharedBookingFixtures } from './fixtures';

// Pure API-level test (no browser UI) against the local backend directly — the double-booking
// race is a database/transaction concern, not a frontend one, so this is the most direct way to
// prove it. Uses the shared "E2E Shared ..." fixtures on demo-professional (find-or-create, see
// fixtures.ts) rather than creating fresh rows every run.
const API = 'http://localhost:5067/api';

test.describe('Booking double-booking prevention', () => {
  test('two simultaneous bookings for the same employee/slot — exactly one succeeds', async () => {
    const api = await playwrightRequest.newContext();
    const { service, employeeId } = await ensureSharedBookingFixtures(api);

    // A random future slot so repeated runs don't collide with a previous run's leftover
    // booking, staying under the 60-day max-advance-booking limit.
    const date = new Date();
    date.setDate(date.getDate() + 14 + Math.floor(Math.random() * 40));
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
