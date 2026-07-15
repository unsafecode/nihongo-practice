import { describe, expect, it } from "vitest";
import { it as itCopy } from "./it";
import { en as enCopy } from "./en";
import type { CourseCopy } from "./types";
import { examples } from "../data/examples";

/**
 * Shipped-content quality suite (design spec §7, §8.3, §13). These tests inspect
 * the *real shipped* bilingual copy and runtime examples — not synthetic
 * fixtures — so a stale instructional claim from the retired course, or a
 * space-broken Japanese example, can never silently regress once the complete
 * A0→A1 course is assembled. The pedagogy gates (concept order, reuse,
 * capstones, locale key parity) are proven on the shared catalogs by
 * `validateCurriculum`.
 */

const COURSE_DICTS = [
  "modules",
  "lessons",
  "objectives",
  "outcomes",
  "blocks",
  "examples",
] as const;

/** Flatten every localized string a learner can read in the course content. */
function courseCopyStrings(copy: CourseCopy): string[] {
  const out: string[] = [];
  for (const dict of COURSE_DICTS) {
    const table = copy[dict] as Record<string, unknown>;
    for (const entry of Object.values(table)) {
      if (typeof entry === "string") {
        out.push(entry);
        continue;
      }
      if (!entry || typeof entry !== "object") continue;
      for (const value of Object.values(entry)) {
        if (typeof value === "string") out.push(value);
        else if (Array.isArray(value)) {
          for (const bullet of value) {
            if (typeof bullet === "string") out.push(bullet);
          }
        }
      }
    }
  }
  return out;
}

const allShippedStrings = [
  ...courseCopyStrings(itCopy),
  ...courseCopyStrings(enCopy),
];

describe("shipped copy — no stale instructional claims", () => {
  it("ships no chapter / trap / mastery / godan / completion claims", () => {
    for (const value of allShippedStrings) {
      expect(value).not.toMatch(/godan|ichidan/i);
      expect(value).not.toMatch(/\bchapters?\b|capitolo|capitoli/i);
      expect(value).not.toMatch(/\btraps?\b|trappol/i);
      expect(value).not.toMatch(/mastery|padronanz/i);
      expect(value).not.toMatch(/\bcompletion\b|completament/i);
    }
  });
});

describe("shipped Japanese examples — continuous kana (spec §8.3)", () => {
  it("renders every example's Japanese as continuous kana with no ASCII spaces", () => {
    const spaced: string[] = [];
    for (const example of Object.values(examples)) {
      if (/\s/.test(example.jp)) spaced.push(`${example.id}:${example.jp}`);
    }
    expect(spaced).toEqual([]);
  });

  it("keeps each example's concatenated segments equal to its jp/romaji strings", () => {
    for (const example of Object.values(examples)) {
      if (!example.segments) continue;
      expect(example.segments.map((s) => s.jp).join("")).toBe(example.jp);
      expect(example.segments.map((s) => s.romaji).join("")).toBe(
        example.romaji,
      );
    }
  });
});
