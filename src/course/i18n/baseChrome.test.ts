import { describe, expect, it } from "vitest";

import { BASE_DIAGNOSTIC_DIMENSION_IDS } from "../base/diagnostic/model";
import { A1_LESSON_SECTION_IDS } from "../../routing/lessonSections";
import { en as enCopy } from "./en";
import { it as itCopy } from "./it";
import type { CourseCopy } from "./types";

/**
 * Build-time gate for the Base level's localized *chrome* (Task 16).
 *
 * Base's Japanese, its rōmaji and its authored meanings are catalog data —
 * `baseContent` copy ids resolved from `src/course/base/copy/`, never restated
 * here. What this file governs is the surrounding UI text every Base surface
 * needs: the level selector and its soft recommendations, the level map and
 * checkpoint headings, the deep lesson's six section labels, the explanation
 * labels, the practice/activity controls, the audio and speech states, the
 * progressive-reference page, the entry diagnostic, the V4 progress migration
 * notice and its historical-evidence explanation, and every fail-closed error
 * surface.
 *
 * Three things are asserted for all of it:
 *   1. EN and IT declare the *same key structure*, recursively — a missing or
 *      extra Italian key fails here rather than rendering an English string to
 *      an Italian learner;
 *   2. no value is blank in either locale, including the function-shaped ones
 *      exercised with sentinel arguments;
 *   3. no value is an accidental EN-identical fallback where the two languages
 *      genuinely differ. Short shared tokens ("Base", "A1", "A2", "OK" …) are
 *      allow-listed explicitly, so the gate cannot be satisfied by widening it
 *      silently.
 *
 * It also re-asserts that no Base chrome string contains Japanese: canonical
 * Japanese belongs to the catalog, never to a locale file.
 */

const JAPANESE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u;

/**
 * Values that are legitimately identical in English and Italian: proper names
 * of the levels themselves and shared abbreviations. Anything else that is
 * EN-identical is an untranslated fallback.
 */
const SHARED_ACROSS_LOCALES: ReadonlySet<string> = new Set([
  "Base",
  "A1",
  "A2",
  // "No" is the Italian word for "no" as well as the English one.
  "No",
]);

type CopyNode = string | ((...args: never[]) => string) | { [key: string]: CopyNode };

/** Sentinel arguments for the function-shaped copy values in the Base chrome. */
function callTemplate(fn: (...args: never[]) => string): string {
  // Every Base-chrome template takes either a level id, a label, or a position.
  // Calling with each shape and keeping the first non-empty result exercises
  // the template without pinning it to one signature.
  const candidates: unknown[][] = [["a0"], ["Base"], [1], [1, 4], []];
  for (const args of candidates) {
    try {
      const value = (fn as (...args: unknown[]) => string)(...args);
      if (typeof value === "string" && value.trim().length > 0) return value;
    } catch {
      // Try the next shape.
    }
  }
  throw new Error("Base chrome template produced no non-empty string");
}

function keyStructure(node: CopyNode, path = ""): string[] {
  if (typeof node === "string") return [`${path}:string`];
  if (typeof node === "function") return [`${path}:fn`];
  return Object.keys(node)
    .sort()
    .flatMap((key) => keyStructure(node[key]!, path === "" ? key : `${path}.${key}`));
}

function flatten(node: CopyNode, path = ""): [string, string][] {
  if (typeof node === "string") return [[path, node]];
  if (typeof node === "function") return [[path, callTemplate(node)]];
  return Object.entries(node).flatMap(([key, value]) =>
    flatten(value, path === "" ? key : `${path}.${key}`),
  );
}

/** Every Base-facing chrome section, by the surface it serves. */
function baseChrome(copy: CourseCopy): Record<string, CopyNode> {
  return {
    // selector + recommendation + map + checkpoint headings
    courseLevels: copy.courseLevels as unknown as CopyNode,
    // sections / explanations / activities / audio
    baseLesson: copy.baseLesson as unknown as CopyNode,
    // speech: Base's spoken activity reuses the shared consent/mic copy rather
    // than authoring a second privacy disclosure, so it is gated here too.
    spokenAttempt: copy.spokenAttempt as unknown as CopyNode,
    // the non-spoken practice controls Base shares with the A1 exercise UI
    practice: copy.practice as unknown as CopyNode,
    // progressive references
    baseReferencePage: copy.baseReferencePage as unknown as CopyNode,
    // optional entry diagnostic
    baseDiagnostic: copy.baseDiagnostic as unknown as CopyNode,
    // V4 migration notice + the always-available historical-evidence help
    progressMigration: copy.progressMigration as unknown as CopyNode,
    // historical evidence reporting (tiers are observational, never verdicts)
    canDoSummary: copy.canDoSummary as unknown as CopyNode,
    checkpoint: copy.checkpoint as unknown as CopyNode,
    // fail-closed error surfaces shared with the Base pages
    progressMutation: copy.progressMutation as unknown as CopyNode,
  };
}

describe("Base localized chrome (Task 16)", () => {
  it("declares an identical key structure in English and Italian", () => {
    expect(keyStructure(baseChrome(itCopy))).toEqual(keyStructure(baseChrome(enCopy)));
  });

  it("covers every Base lesson section, diagnostic dimension, and audio state", () => {
    for (const copy of [enCopy, itCopy]) {
      expect(Object.keys(copy.baseLesson.sections).sort()).toEqual(
        [...A1_LESSON_SECTION_IDS].sort(),
      );
      expect(Object.keys(copy.baseDiagnostic.dimensions).sort()).toEqual(
        [...BASE_DIAGNOSTIC_DIMENSION_IDS].sort(),
      );
      expect(Object.keys(copy.baseLesson.audio).sort()).toEqual(
        [
          "blocked",
          "failed",
          "idle",
          "playing",
          "retry",
          "statusLabel",
          "stopped",
          "unavailable",
        ],
      );
    }
  });

  it.each([
    ["en", enCopy],
    ["it", itCopy],
  ] as const)("has no blank or Japanese-bearing Base chrome (%s)", (_locale, copy) => {
    const entries = flatten(baseChrome(copy));
    expect(entries.length).toBeGreaterThan(0);

    for (const [path, value] of entries) {
      expect(value.trim().length, path).toBeGreaterThan(0);
      expect(JAPANESE.test(value), `${path} contains Japanese`).toBe(false);
    }
  });

  it("never falls back to the English string for an Italian value", () => {
    const english = new Map(flatten(baseChrome(enCopy)));
    const italian = new Map(flatten(baseChrome(itCopy)));

    const untranslated = [...italian.entries()]
      .filter(([path, value]) => english.get(path) === value)
      .map(([path, value]) => ({ path, value }))
      .filter(({ value }) => !SHARED_ACROSS_LOCALES.has(value.trim()));

    expect(
      untranslated,
      `untranslated Base chrome: ${untranslated.map(({ path }) => path).join(", ")}`,
    ).toEqual([]);
  });

  it("keeps Base chrome observational — never a certification or mastery claim", () => {
    for (const copy of [enCopy, itCopy]) {
      const body = flatten(baseChrome(copy))
        .map(([, value]) => value)
        .join(" ")
        .toLowerCase();
      expect(body).not.toMatch(
        /\b(certif|mastered|mastery|fluent|passed|superato|certificato|padronanza|bloccat)\b/,
      );
    }
  });
});
