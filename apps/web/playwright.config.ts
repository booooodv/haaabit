import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: [
    {
      command:
        "node -e \"require('fs').closeSync(require('fs').openSync('/tmp/haaabit-playwright.db','w'))\" && pnpm exec prisma db push --config prisma.config.ts --schema prisma/schema.prisma --url file:/tmp/haaabit-playwright.db --accept-data-loss && pnpm --filter @haaabit/api dev",
      cwd: "../..",
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: "file:/tmp/haaabit-playwright.db",
        BETTER_AUTH_SECRET: "playwright-secret-with-at-least-thirty-two-characters",
        BETTER_AUTH_URL: "http://127.0.0.1:3001",
        CORS_ORIGIN: "http://127.0.0.1:3000",
        PORT: "3001",
      },
    },
    {
      command: "pnpm --filter @haaabit/web exec next dev --hostname 127.0.0.1 --port 3000",
      cwd: "../..",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:3001",
        API_BASE_URL: "http://127.0.0.1:3001",
      },
    },
  ],
});
