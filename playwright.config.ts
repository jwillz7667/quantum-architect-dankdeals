import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000, // 30 second timeout for each test
  use: {
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    trace: 'on-first-retry',
    actionTimeout: 10000, // 10 second timeout for actions
    navigationTimeout: 30000, // 30 second timeout for navigation
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: process.env.CI
    ? {
        command: 'npm run preview', // Use preview (production build) in CI
        port: 4173, // Preview runs on port 4173
        reuseExistingServer: false,
        timeout: 120000, // 2 minute timeout for server start
      }
    : {
        command: 'npm run dev',
        port: 5173,
        reuseExistingServer: true,
        timeout: 120000, // 2 minute timeout for server start
      },
});
