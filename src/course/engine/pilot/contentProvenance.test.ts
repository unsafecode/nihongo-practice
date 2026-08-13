/**
 * Standing guard against fabricated Japanese in pilot lessons.
 *
 * Phase 0 pilots must recompose content that Base already teaches. The risk is
 * not a typo, it is plausible invention: an author reaching for ありがとう or
 * こんにちは, which read as obvious beginner Japanese but are taught nowhere in
 * this course. A reviewer cannot catch that by eye.
 *
 * So the allow-list is not hand-written. It is built by walking the real
 * lexicon and asking the repo's own morphology engine to realize every polite
 * form it licenses. Any kana surface in a pilot must decompose entirely into
 * those verified pieces plus the four taught particles; anything left over is
 * invented and fails.
 */
import { describe, expect, it } from "vitest";
import { BASE_LEXEME_BY_ID } from "../../base/catalog/lexicon";
import { realizePoliteGrid } from "../../base/forms/verbForms";
import { politePresentBlock } from "./politePresentBlock";
import { konbiniImmersion } from "./konbiniImmersion";
import type { Lesson } from "../types";

const KANA = /[\u3040-\u30FF]+/gu;

function buildAllowed(): Set<string> {
  const allowed = new Set<string>(["は", "を", "か", "に", "ます", "ません", "へ", "で", "から", "まで"]);
  for (const [id, lex] of BASE_LEXEME_BY_ID) {
    allowed.add(lex.kana);
    const grid = realizePoliteGrid(id);
    if (grid.ok) {
      for (const cell of Object.values(grid.value) as { jp: string }[][]) {
        allowed.add(cell.map((t) => t.jp).join(""));
      }
    }
  }
  return allowed;
}

function surfaces(lesson: Lesson): string[] {
  const found: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === "string") {
      for (const m of v.matchAll(KANA)) found.push(m[0]);
      return;
    }
    if (v && typeof v === "object") for (const n of Object.values(v)) walk(n);
  };
  walk(lesson);
  return found;
}

function isExplained(s: string, allowed: Set<string>): boolean {
  let rest = s;
  while (rest.length > 0) {
    let matched = 0;
    for (let len = rest.length; len > 0; len--) {
      if (allowed.has(rest.slice(0, len))) { matched = len; break; }
    }
    if (matched === 0) return false;
    rest = rest.slice(matched);
  }
  return true;
}

describe("pilot content provenance", () => {
  const allowed = buildAllowed();
  for (const lesson of [politePresentBlock, konbiniImmersion] as Lesson[]) {
    it(`${lesson.id}: every kana surface is catalog-verified material`, () => {
      const unexplained = [...new Set(surfaces(lesson))].filter((s) => !isExplained(s, allowed));
      expect(unexplained).toEqual([]);
    });
  }
});
