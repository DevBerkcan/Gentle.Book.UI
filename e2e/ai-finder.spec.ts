import { test, expect } from '@playwright/test';
import { DEMO_TENANTS, demoEmail, DEMO_PASSWORD, ensureSharedBookingFixtures } from './fixtures';

// AI Finder ("KI & Service Finder") requires Professional+ plan (AiFinderPlanGate.cs). On
// Professional specifically, the recommendation is purely rule-based — no AI call, no cost (the
// optional AI-phrased wording on top is Agency-only and has its own tracked $/month budget,
// confirmed via the admin UI's own "Aktuell nutzen wir eine regelbasierte Antwort" banner and
// usedAiFallback:true on Evaluate) — safe to exercise the full flow here with zero API spend.
//
// Regression test for a bug found during this QA pass: configJson for a SingleChoice question
// must be `{"options": ["Label A", "Label B"]}` (flat strings — see parseOptions() in
// app/booking/[slug]/finder/page.tsx) — a {value,label} object shape (a reasonable first guess)
// silently fails to parse and the question falls back to a bare free-text input instead of
// selectable choices, with no error of any kind.
const API = 'http://localhost:5067/api';

test.describe('AI Service Finder', () => {
  test('a rule-based recommendation guides a customer to a booking draft and a real booking', async ({ page, request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { tenantSlug: DEMO_TENANTS.professional, email: demoEmail(DEMO_TENANTS.professional), password: DEMO_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const auth = { Authorization: `Bearer ${token}` };

    const { service } = await ensureSharedBookingFixtures(request);

    // Idempotent industry-settings + question + rule fixture, same pattern as the other specs.
    const profilesRes = await request.get(`${API}/admin/ai-finder/industry-profiles`, { headers: auth });
    const hairdresserProfile = (await profilesRes.json()).find((p: any) => p.key === 'barbershop_hairdresser');
    expect(hairdresserProfile, 'barbershop_hairdresser industry profile not found').toBeTruthy();

    const settingsRes = await request.put(`${API}/admin/ai-finder/industry-settings`, {
      headers: auth,
      data: { primaryIndustryProfileId: hairdresserProfile.id, isFinderEnabled: true, settingsJson: null, enabledCapabilities: [] },
    });
    expect(settingsRes.ok(), `industry settings save failed: ${await settingsRes.text()}`).toBeTruthy();

    const questionsRes = await request.get(`${API}/admin/ai-finder/questions`, { headers: auth });
    const questions = await questionsRes.json();
    let question = questions.find((q: any) => q.questionKey === 'e2e_goal');
    const questionPayload = {
      id: question?.id ?? null,
      industryProfileId: null,
      questionKey: 'e2e_goal',
      questionText: 'E2E: Was moechtest du machen lassen?',
      answerType: 'SingleChoice',
      isRequired: true,
      displayOrder: 0,
      configJson: JSON.stringify({ options: ['E2E Haarschnitt', 'E2E Coloration'] }),
      isActive: true,
    };
    const upsertQRes = await request.put(`${API}/admin/ai-finder/questions`, { headers: auth, data: { questions: [questionPayload] } });
    expect(upsertQRes.ok(), `question save failed: ${await upsertQRes.text()}`).toBeTruthy();

    const rulesRes = await request.get(`${API}/admin/ai-finder/rules`, { headers: auth });
    const rules = await rulesRes.json();
    let rule = rules.find((r: any) => r.conditionJson?.includes('e2e_goal'));
    const rulePayload = {
      id: rule?.id ?? null,
      serviceId: service.id,
      ruleType: 'RecommendService',
      conditionJson: JSON.stringify({ questionKey: 'e2e_goal', operator: 'equals', value: 'E2E Haarschnitt' }),
      resultJson: JSON.stringify({ score: 100, serviceIds: [service.id] }),
      priority: 10,
      isActive: true,
      approvalStatus: 'Approved',
    };
    const upsertRRes = await request.put(`${API}/admin/ai-finder/rules`, { headers: auth, data: { rules: [rulePayload] } });
    expect(upsertRRes.ok(), `rule save failed: ${await upsertRRes.text()}`).toBeTruthy();

    // Customer flow: the finder entry point on the booking page, then the finder itself.
    await page.goto('/booking/demo-professional/book');
    await page.getByRole('button', { name: 'OK' }).click({ timeout: 3000 }).catch(() => {});
    await page.getByRole('button', { name: 'Finder starten' }).click();
    await expect(page).toHaveURL(/\/booking\/demo-professional\/finder/, { timeout: 10000 });

    await page.getByText('E2E Haarschnitt', { exact: true }).click();
    await page.getByRole('button', { name: 'Empfehlung anzeigen' }).click();

    // The recommended service must be the one the rule targets, and selected by default.
    const recommendedOption = page.getByText('E2E Shared Service', { exact: true });
    await expect(recommendedOption).toBeVisible({ timeout: 10000 });
    // Confirms the regression fix: the question rendered as real selectable options (which we
    // just clicked above), not a free-text fallback silently accepting anything.
    await expect(page.getByText(/regelbasierte Antwort/i)).toBeVisible();

    const offsetDays = 14 + Math.floor(Math.random() * 40);
    const d = new Date(Date.now() + offsetDays * 86400000);
    await page.locator('input[type=date]').fill(d.toISOString().slice(0, 10));
    await page.locator('input[type=time]').fill('10:00');
    const stamp = Date.now();
    const customerEmail = `e2e-finder-${stamp}@example.test`;
    await page.getByPlaceholder('Vorname').fill('E2E');
    await page.getByPlaceholder('Nachname').fill(`Finder${stamp}`);
    await page.getByPlaceholder('E-Mail').fill(customerEmail);
    await page.getByPlaceholder('Telefon').fill('+491751234567');
    await page.getByRole('button', { name: 'Buchungsentwurf erstellen' }).click();

    // Regression check: the draft-expiry notice must be a formatted date/time, not a raw ISO string.
    const expiryNotice = page.getByText(/Entwurf g(u|ü)e?ltig bis/i);
    await expect(expiryNotice).toBeVisible({ timeout: 10000 });
    await expect(expiryNotice).not.toContainText('T');
    await expect(expiryNotice).toContainText('Uhr');

    await page.locator('input[type=checkbox]').check();
    await page.getByRole('button', { name: /Buchung final best(a|ä)e?tigen/i }).click();

    await expect(page).toHaveURL(/\/booking\/confirmation\//, { timeout: 15000 });
    await expect(page.getByText(/Termin best(a|ä)e?tigt/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(customerEmail).first()).toBeVisible();
  });
});
