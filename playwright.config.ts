import { defineConfig, devices } from "@playwright/test";

/**
 * Deterministic Chromium acceptance suite for the corrective redesign
 * (design spec §9.2-§9.3). It runs against a *built* Vite production preview
 * — not the dev server and not any external site — served at the real
 * GitHub Pages base (`/nihongo-practice/`) so the HashRouter app is exercised
 * exactly as it ships. No backend, API key, or network egress is involved.
 *
 * The preview port is fixed and derived once here so the webServer health
 * check, the `baseURL`, and the in-test route helpers cannot disagree.
 */
const PREVIEW_PORT = 4319;
export const PREVIEW_BASE_PATH = "/nihongo-practice/";
export const PREVIEW_ORIGIN = `http://localhost:${PREVIEW_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // Single worker keeps layout, font rendering, and screenshot pixels
  // deterministic and avoids cross-test resource contention.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // `list` only: never emit/serve the HTML report (which would leave an
  // untracked playwright-report/ artifact behind).
  reporter: [["list"]],
  // Traces/videos are intentionally disabled so no temp artifacts are
  // produced or committed; snapshots are the only committed evidence.
  outputDir: "./test-results",

  expect: {
    toHaveScreenshot: {
      // Freeze CSS animations/transitions and hide the caret so a reviewed
      // baseline is byte-stable on re-run; scale in CSS pixels so the two
      // device-scale-factor:1 viewports render at their nominal size.
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },

  use: {
    baseURL: PREVIEW_ORIGIN,
    // Deterministic environment for every context (design spec §9.2).
    locale: "it-IT",
    timezoneId: "Europe/Rome",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "off",
    video: "off",
    screenshot: "off",
    // Nominal CSS pixels at the two approved reference viewports.
    deviceScaleFactor: 1,
  },

  projects: [
    {
      name: "desktop-1440",
      // The deterministic media preferences are repeated per project because a
      // project `use` that spreads a `devices[...]` preset does not inherit the
      // top-level media emulation reliably; setting them here guarantees the
      // emulated context (design spec §9.2) regardless of merge order.
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 1,
        colorScheme: "light",
        reducedMotion: "reduce",
      },
    },
    {
      name: "mobile-390",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        colorScheme: "light",
        reducedMotion: "reduce",
      },
    },
  ],

  webServer: {
    // Build fresh, then serve the built app at the Pages base. GITHUB_PAGES is
    // injected via env (below) so Vite's loadEnv resolves base to
    // `/nihongo-practice/` cross-platform without a shell-specific prefix.
    command: `npm run build && npm run preview -- --port ${PREVIEW_PORT} --strictPort`,
    url: `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}`,
    timeout: 120_000,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
    env: { GITHUB_PAGES: "true", VITE_FOUNDATION_FIXTURES: "true" },
  },
});
