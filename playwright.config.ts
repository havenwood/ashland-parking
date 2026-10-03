import { defineConfig, devices } from '@playwright/test';

/** Override with PORT=… to run several checkouts side by side. */
const PORT = Number(process.env.PORT ?? 4322);

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}/ashland-parking/` },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/ashland-parking/`,
    reuseExistingServer: !process.env.CI,
  },
});
