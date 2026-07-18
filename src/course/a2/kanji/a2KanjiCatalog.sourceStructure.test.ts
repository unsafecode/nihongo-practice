import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Source-structure regression test (Phase 3 Task 3 quality fix, locked
 * decision L3): the authoritative plan requires every A2 contextual-kanji
 * row to carry all four explicit lesson ids — `firstSupported`,
 * `supportedRetrieval`, `revealable`, `assessed` — directly, authored by
 * hand in the row itself. There must be no runtime "cohort" computation
 * (`cohortA`/`cohortB` "first cohort"/"second cohort" helpers) deriving a
 * row's schedule from a module id and position.
 *
 * This inspects the catalog module's own *source text*, not its runtime
 * output: the computed and literal forms currently produce byte-identical
 * exposures, so a purely behavioral (output-based) test cannot tell them
 * apart. Reading the source directly is the only way to guarantee a future
 * contributor cannot reintroduce a computed-schedule helper without a test
 * failing.
 */
const CATALOG_SOURCE_PATH = fileURLToPath(new URL("./a2KanjiCatalog.ts", import.meta.url));
const CATALOG_SOURCE = readFileSync(CATALOG_SOURCE_PATH, "utf8");

const ROW_FIELDS = ["firstSupported", "supportedRetrieval", "revealable", "assessed"] as const;

describe("a2KanjiCatalog source structure — no cohort computation (locked decision L3)", () => {
  it("never declares a cohortA or cohortB schedule-computing helper", () => {
    expect(CATALOG_SOURCE).not.toMatch(/\bcohortA\b/);
    expect(CATALOG_SOURCE).not.toMatch(/\bcohortB\b/);
  });

  it("never calls a cohort helper from an authored row's stages", () => {
    expect(CATALOG_SOURCE).not.toMatch(/\bcohort[AB]\s*\(/);
  });

  it.each(ROW_FIELDS)(
    "authors exactly 120 rows with an explicit literal %s: \"...\" lesson-id field",
    (field) => {
      // Scoped to `field: "` (colon then a quoted string literal) so this
      // only counts authored row occurrences — never the `KanjiRow`
      // interface's own `field: string;` declaration (unquoted type
      // annotation) or a bare `"stage-name"` array/union member elsewhere.
      const pattern = new RegExp(`\\b${field}\\s*:\\s*"`, "g");
      const matches = CATALOG_SOURCE.match(pattern) ?? [];
      expect(matches).toHaveLength(120);
    },
  );
});
