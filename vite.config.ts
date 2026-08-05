/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "GITHUB_PAGES");
  return {
    base: env.GITHUB_PAGES === "true" ? "/nihongo-practice/" : "/",
    plugins: [react()],
    server: {
      port: 5173,
      open: false,
    },
    build: {
      // Phase 2 Task 6, finding I3: keep every route's CSS in one file that
      // ships in `index.html`'s initial, render-blocking stylesheet link,
      // even though the route *JS* is lazy-split below. With Vite's default
      // per-chunk CSS splitting, a lazy route's stylesheet is only attached
      // (via a runtime-inserted, non-blocking <link>) once its JS chunk is
      // imported — a real gap in which React can mount and paint the route
      // with no CSS applied at all, so controls briefly render at the
      // browser's unstyled default size (e.g. a bare <input> or <a>, well
      // under the 44px touch target). A direct production-preview repro
      // proved this: it is why introducing lazy routes alone regressed the
      // 44px audit even though the exact same markup passed before. Merging
      // CSS keeps that guarantee intact while still letting the JS chunking
      // reduce what a first-time visitor to any one route downloads.
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          // Phase 2 Task 6, finding I3: split the rarely-changing framework
          // dependencies (react/react-dom/react-router) into their own
          // vendor chunk, separate from the app's own code. This is a pure
          // packaging change — it never touches route/Suspense timing or any
          // runtime behavior a component/e2e test could observe — so it is
          // always safe, unlike lazy route splitting. It also means a
          // browser that already cached the vendor chunk from a previous
          // release does not have to re-download it just because app code
          // changed.
          manualChunks(id: string): string | undefined {
            // Cross-level runtime modules eagerly assemble both courses, so
            // assigning every `/a1/` and `/a2/` module to level chunks produces
            // a static cycle (`course-a1 → course-a2 → course-a1`) and a browser
            // temporal-dead-zone failure before React mounts. Keep those runtime
            // modules with the entry and split only the large, leaf content
            // subtrees below. The production-bundle cycle test guards this shape.
            if (id.includes("/src/romaji/formatRomaji.ts")) return "course-foundations";
            if (
              id.includes("/src/course/foundations/") &&
              !id.endsWith(".tsx") &&
              !id.endsWith(".css")
            ) {
              return "course-foundations";
            }
            if (id.includes("/src/course/a1/catalog/")) return "course-a1-catalog";
            if (id.includes("/src/course/a2/content/")) return "course-a2-content";
            if (id.includes("node_modules")) {
              return "vendor";
            }
            return undefined;
          },
        },
      },
    },
    test: {
      environment: "node",
      // Phase 3 Task 3: KanjiRubyText.test.tsx is the first test file authored
      // directly in JSX (every earlier interactive component test used
      // `createElement` from a `.test.ts` file specifically to avoid needing
      // this). Included alongside the existing `.test.ts` patterns; nothing
      // about the default "node" environment changes; jsdom-dependent files
      // still opt in per-file with `/** @vitest-environment jsdom */`.
      include: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "scripts/**/*.test.ts",
      ],
    },
  };
});
