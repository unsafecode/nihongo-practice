/**
 * Generator for the per-lesson / per-module / per-level content QA reports
 * required by Section 21.4 item 8 of the master design specification.
 *
 * `a1ReportMarkdown` and `a2ReportMarkdown` already render the tables; before
 * Phase 4 nothing wrote them anywhere, so item 8 of the release checklist had
 * no artifact to point at. This script writes both, deterministically, so the
 * release record can cite a committed file instead of a test run.
 *
 * Run: `npx vite-node scripts/generateContentReports.ts`
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { a1ReportMarkdown } from "../src/course/a1/catalog/reports";
import { a2ReportMarkdown } from "../src/course/a2/catalog/reports";

const outputDir = fileURLToPath(new URL("../docs/release/content-reports/", import.meta.url));
mkdirSync(outputDir, { recursive: true });

const artifacts: readonly (readonly [string, string])[] = [
  ["a1-content-report.md", a1ReportMarkdown()],
  ["a2-content-report.md", a2ReportMarkdown()],
];

for (const [name, markdown] of artifacts) {
  const path = `${outputDir}${name}`;
  writeFileSync(path, markdown.endsWith("\n") ? markdown : `${markdown}\n`, "utf8");
  console.log(`generateContentReports: wrote ${markdown.split("\n").length} lines to ${path}`);
}
