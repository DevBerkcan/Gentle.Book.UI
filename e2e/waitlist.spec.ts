import { test, expect } from '@playwright/test';
import { ensureSharedBookingFixtures, waitForEmail } from './fixtures';

// Regression test for a bug found during this QA pass: the waitlist notification email links to
// /booking/{slug}/book?waitlistToken=...&serviceId=...&date=...&time=...&employeeId=..., promising
// a 15-minute exclusive reservation — but the booking page only ever read `serviceId` and
// `waitlistToken` from the URL, silently dropping `date`/`time`/`employeeId`. The customer landed
// on the current week's date picker with no indication which slot (or that any slot) was reserved
// for them. Fixed in app/booking/[slug]/book/page.tsx to pre-fill employee/date/time from the link
// and jump straight to the contact step with a reservation notice.

const API = 'http://localhost:5067/api';
const SMTP4DEV = 'http://localhost:5080';

test.describe('Waitlist notify-on-cancel', () => {
  test('customer B gets the freed slot after customer A cancels, claim link pre-fills the reserved slot', async ({ page, request }) => {
    const { auth, service, employeeId } = await ensureSharedBookingFixtures(request);

    const stamp = Date.now();
    // Randomized within the 60-day advance-booking window so repeated runs don't collide with a
    // slot a previous run's successful claim left permanently booked (unlike a cancellation, a
    // completed waitlist claim is a real booking that stays on the calendar). Restricted to
    // Mon–Fri at 14:00 to stay safely inside demo-professional's configured business hours
    // (Mon–Sat 09:00–18:00, Sat until 14:00 only, Sun closed).
    let bookingDate = '';
    for (let offsetDays = 14 + Math.floor(Math.random() * 40); offsetDays < 59; offsetDays++) {
      const d = new Date(Date.now() + offsetDays * 86400000);
      const day = d.getUTCDay();
      if (day >= 1 && day <= 5) { bookingDate = d.toISOString().slice(0, 10); break; }
    }
    const startTime = '14:00';
    const customerBEmail = `e2e-waitlist-${stamp}@example.test`;

    // Customer A books the slot.
    const bookRes = await request.post(`${API}/bookings`, {
      data: {
        serviceId: service.id,
        bookingDate,
        startTime,
        customer: { firstName: 'E2E', lastName: `WaitlistA-${stamp}`, email: `e2e-waitlist-a-${stamp}@example.test`, phone: `+4915${String(stamp).slice(-8)}` },
        customerNotes: null,
        employeeId,
      },
    });
    expect(bookRes.ok(), `booking create failed: ${await bookRes.text()}`).toBeTruthy();
    const booking = await bookRes.json();

    // Customer B joins the waitlist for that exact slot.
    const joinRes = await request.post(`${API}/public/demo-professional/waitlist`, {
      data: {
        firstName: 'E2E', lastName: 'WaitlistB', email: customerBEmail, phone: null, notes: null,
        serviceId: service.id, employeeId, preferredDate: bookingDate,
        preferredStartTime: startTime, preferredEndTime: '14:30',
      },
    });
    expect(joinRes.ok(), `waitlist join failed: ${await joinRes.text()}`).toBeTruthy();

    // Customer A cancels — this enqueues the Hangfire job that offers the slot to customer B.
    const cancelRes = await request.delete(`${API}/bookings/${booking.id}`, {
      headers: auth, data: { reason: 'E2E waitlist test', notifyCustomer: false },
    });
    expect(cancelRes.ok(), `cancel failed: ${await cancelRes.text()}`).toBeTruthy();

    // The notification email should arrive within a few seconds (local Hangfire runs in-process).
    const emailId = await waitForEmail(request, customerBEmail, 'Termin verfügbar');
    const htmlRes = await request.get(`${SMTP4DEV}/api/Messages/${emailId}/html`);
    const html = await htmlRes.text();
    const linkMatch = html.match(/href='([^']*waitlistToken[^']*)'/);
    expect(linkMatch, 'claim link with waitlistToken not found in email body').toBeTruthy();
    const claimUrl = linkMatch![1].replace('http://localhost:3000', '');

    // Visiting the claim link should pre-fill the reserved slot and land on the contact step —
    // not the current week's date picker (the bug this test guards against).
    await page.goto(claimUrl, { waitUntil: 'load' });
    await page.locator('button:has-text("OK")').click({ timeout: 3000 }).catch(() => {});
    const formattedDate = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(`${bookingDate}T00:00:00`));
    await expect(page.getByText(/exklusiv für Sie reserviert/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(formattedDate)).toBeVisible();
    await expect(page.getByText('14:00')).toBeVisible();

    // Complete the claim.
    await page.getByLabel(/Vorname/i).fill('E2E');
    await page.getByLabel(/Nachname/i).fill(`WaitlistB-Claimed-${stamp}`);
    await page.getByLabel(/^E-Mail/i).fill(customerBEmail);
    await page.getByLabel(/^Telefon/i).fill(`+4917${String(stamp).slice(-8)}`);
    await page.locator('input[type=checkbox]').first().check();
    await page.getByRole('button', { name: /Termin buchen/i }).click();
    await expect(page.getByText(/Termin bestätigt/i)).toBeVisible({ timeout: 10000 });

    // The waitlist entry should now be marked Booked, not left dangling as Notified.
    const listRes = await request.get(`${API}/waitlist`, { headers: auth });
    const entries = await listRes.json();
    const entry = entries.find((e: any) => e.email === customerBEmail);
    expect(entry?.status).toBe('Booked');
  });
});
