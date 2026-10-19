import { defineConfig, devices } from '@playwright/test';

// Points at the local dev stack only (see docs/qa/TEST_ACCOUNTS.md). Never run against
// gentlebook.de / gentlebook.runasp.net — there is no staging environment, so "local" is the
// only safe target for automated E2E runs.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
