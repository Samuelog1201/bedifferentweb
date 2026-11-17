import { defineConfig, devices } from "@playwright/test";
import { approvedProductionWhatsAppNumber } from "./src/lib/whatsapp";

const e2ePort = 43173;
const e2eOrigin = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: e2eOrigin,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${e2ePort}`,
    url: e2eOrigin,
    env: { NEXT_PUBLIC_WHATSAPP_NUMBER: approvedProductionWhatsAppNumber },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
