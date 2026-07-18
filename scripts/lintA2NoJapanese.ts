/**
 * The A2 no-Japanese-in-module-files guard (Phase 3 Task 4).
 *
 * Module content files under `src/course/a2/content/module*.ts` (the M1-M4
 * `module0NXxx.ts` authoring files this task adds, and every later task's
 * module files) may only ever reference semantic IDs and English/Italian
 * copy — every Japanese/romaji literal for A2 belongs in
 * `a2SemanticCatalog.ts`, the A2 form registries (`a2/forms/*`), or the
 * contextual kanji catalog (`a2/kanji/*`). This script — and the pure
 * `findJapaneseViolations`/`lintA2NoJapanese` functions it wraps — scans
 * every non-test module file for hiragana, katakana (incl. halfwidth), CJK
 * ideographs, CJK compatibility ideographs, CJK symbols/punctuation, and
 * fullwidth ASCII, and refuses (non-zero exit, every violation printed) the
 * moment it finds one. Mirrors the `scripts/validateA1Release.ts` prebuild
 * gate's fail-closed shape.
 *
 * Run directly with `npx vite-node scripts/lintA2NoJapanese.ts`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Hiragana, katakana (incl. halfwidth), CJK ideographs, CJK compatibility
 * ideographs, CJK symbols/punctuation (incl. the iteration mark 々 and
 * ideographic punctuation like 。 and 、), and fullwidth ASCII (fullwidth
 * romaji/digits/punctuation, which can otherwise smuggle Japanese-rendered
 * text past a naive ASCII check). Identical range set to the A1 authoring
 * guard (`src/course/a1/authoring.ts`'s `JAPANESE_PATTERN`) — the same
 * content policy, independently enforced at the A2 content-file boundary.
 */
export const JAPANESE_CHARACTER_PATTERN =
  /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff01-\uff60\uff66-\uff9f]/;

/**
 * The same character class as {@link JAPANESE_CHARACTER_PATTERN}, but with a
 * `+` quantifier (so a contiguous run of Japanese-range characters — e.g. one
 * whole literal — collapses into a single match, matching this scanner's
 * "one violation per offending run" contract) and the `g` flag (so
 * `matchAll` finds every run on a line, not just the first). Derived from
 * the single source of truth above rather than duplicated, so the two can
 * never drift apart.
 */
const GLOBAL_JAPANESE_RUN_PATTERN = new RegExp(
  `${JAPANESE_CHARACTER_PATTERN.source}+`,
  "g",
);

export interface JapaneseViolation {
  readonly filePath: string;
  readonly line: number;
  readonly column: number;
  readonly snippet: string;
}

/** Scan one file's already-read text content for every Japanese-range run on
 * every line. A single call to `.exec()` (the previous implementation) only
 * ever finds the *first* run on a line — a second, separate Japanese literal
 * later on the same line silently escaped detection. `matchAll` with a
 * global, contiguous-run pattern instead iterates every run, so every
 * offending column is reported. */
export function findJapaneseViolations(
  filePath: string,
  content: string,
): readonly JapaneseViolation[] {
  const violations: JapaneseViolation[] = [];
  const lines = content.split("\n");
  lines.forEach((lineText, index) => {
    for (const match of lineText.matchAll(GLOBAL_JAPANESE_RUN_PATTERN)) {
      violations.push({
        filePath,
        line: index + 1,
        column: (match.index ?? 0) + 1,
        snippet: lineText.trim(),
      });
    }
  });
  return violations;
}

/** A guarded A2 content module file: `module*.ts`, excluding `*.test.ts`. */
export function isA2ContentModuleFile(fileName: string): boolean {
  return (
    fileName.startsWith("module") &&
    fileName.endsWith(".ts") &&
    !fileName.endsWith(".test.ts")
  );
}

/** Every guarded module file name in `contentDir`, sorted for deterministic output. */
export function listA2ContentModuleFiles(contentDir: string): readonly string[] {
  return readdirSync(contentDir).filter(isA2ContentModuleFile).sort();
}

/** Scan every guarded module file in `contentDir` and return every violation found. */
export function lintA2NoJapanese(contentDir: string): readonly JapaneseViolation[] {
  const violations: JapaneseViolation[] = [];
  for (const fileName of listA2ContentModuleFiles(contentDir)) {
    const filePath = join(contentDir, fileName);
    const content = readFileSync(filePath, "utf8");
    violations.push(...findJapaneseViolations(filePath, content));
  }
  return violations;
}

/** The real A2 content directory this script guards, resolved relative to this file. */
export const A2_CONTENT_DIR = fileURLToPath(
  new URL("../src/course/a2/content", import.meta.url),
);

const violations = lintA2NoJapanese(A2_CONTENT_DIR);

if (violations.length > 0) {
  console.error(
    `lintA2NoJapanese: refusing — ${violations.length} Japanese-literal violation(s) in A2 content module file(s):`,
  );
  for (const violation of violations) {
    console.error(
      `  - ${violation.filePath}:${violation.line}:${violation.column} ${violation.snippet}`,
    );
  }
  process.exit(1);
}

console.log(
  `lintA2NoJapanese: OK — 0 Japanese-literal violations across ${listA2ContentModuleFiles(A2_CONTENT_DIR).length} A2 content module file(s).`,
);
