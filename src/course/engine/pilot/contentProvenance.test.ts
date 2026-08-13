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
import {
  BASE_PARTICLE_SENSES,
  baseParticleSurfaceTokens,
} from "../../base/forms/particleLicensing";
import { realizePoliteGrid } from "../../base/forms/verbForms";
import { politePresentBlock } from "./politePresentBlock";
import { konbiniImmersion } from "./konbiniImmersion";
import type { Lesson } from "../types";

const KANA = /[\u3040-\u30FF]+/gu;

/**
 * The taught particles are derived, never written down here. BASE_PARTICLE_SENSES
 * is the curriculum's own register of what Base teaches, so deriving from it
 * keeps this guard tracking the curriculum instead of drifting from it.
 *
 * This started as a hand-written set and drifted exactly as predicted: it
 * omitted six taught surfaces — が, の, も, と, ね, よ — so a pilot line as
 * ordinary as ひとがかいます was reported as invented. A false positive here is
 * worse than a gap, because it pushes the next author to "correct" real content
 * or to widen the list by hand again.
 *
 * Keyed by surface because senses share one: three (companion, listing, nominal)
 * all realize と, and both subject senses realize が.
 */
const TAUGHT_PARTICLES: ReadonlyMap<string, string> = new Map(
  BASE_PARTICLE_SENSES.map((sense) => {
    const tokens = baseParticleSurfaceTokens(sense.id);
    return [tokens.map((t) => t.jp).join(""), tokens.map((t) => t.romaji).join("")] as const;
  }),
);

function buildAllowed(): Set<string> {
  const allowed = new Set<string>(TAUGHT_PARTICLES.keys());
  for (const [id, lex] of BASE_LEXEME_BY_ID) {
    allowed.add(lex.kana);
    const grid = realizePoliteGrid(id);
    if (grid.ok) {
      for (const cell of Object.values(grid.value) as { jp: string }[][]) {
        allowed.add(cell.map((t) => t.jp).join(""));
        // A breakdown step legitimately shows a form in pieces — かいます split
        // into かい and ます — so the engine's own segmentation is allowed too,
        // rather than hand-listing the suffixes and getting them wrong.
        for (const token of cell) allowed.add(token.jp);
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

/**
 * A lesson's `teaches` list drives what the learner is told they are getting.
 * Listing a particle the lesson never actually shows is a silent lie: the
 * konbini pilot originally claimed `question-ka` while its dialogue contained
 * no question at all.
 *
 * The obvious check — does the particle appear anywhere in the text — is
 * useless, because か also sits inside かいます and わかりました, and は inside
 * はい. So the particle must appear either as a standalone token the lesson
 * has actually segmented (a breakdown chunk or a guidedBuild fragment), or
 * sentence-finally, which is the only position that identifies か as the
 * question particle rather than a syllable.
 *
 * Only particle concepts are checked, because only they have a single
 * unambiguous surface.
 */
const PARTICLE_SURFACE: Readonly<Record<string, string>> = {
  "topic-wa": "は",
  "question-ka": "か",
  "object-o": "を",
  "goal-ni": "に",
};

function segmentedTokens(lesson: Lesson): string[] {
  const tokens: string[] = [];
  for (const step of lesson.steps) {
    if (step.kind === "breakdown") tokens.push(...step.parts.map((part) => part.chunk));
    if (step.kind === "guidedBuild") tokens.push(...step.fragments, ...step.distractors);
  }
  return tokens;
}

describe("pilot lessons show the particles they claim to teach", () => {
  for (const lesson of [politePresentBlock, konbiniImmersion] as Lesson[]) {
    it(`${lesson.id}: every taught particle appears in a position that identifies it`, () => {
      const tokens = segmentedTokens(lesson);
      const lines = surfaces(lesson);
      const unshown = lesson.teaches
        .filter((concept) => concept in PARTICLE_SURFACE)
        .filter((concept) => {
          const particle = PARTICLE_SURFACE[concept]!;
          const segmented = tokens.includes(particle);
          const sentenceFinal = lines.some((s) => s.length > 1 && s.endsWith(particle));
          return !segmented && !sentenceFinal;
        });
      expect(unshown).toEqual([]);
    });
  }
});

/**
 * The guard above proves every kana surface is catalog-verified material. It
 * says nothing about the romaji sitting beside it, and a wrong reading next to
 * right kana is the least visible content defect there is: the Japanese looks
 * correct, so review slides past it, and the learner is taught a wrong reading.
 *
 * Irregular polite stems are where this actually bites — はなす → はなします is
 * "hanashimasu", not "hanasimasu", and まつ → まちます is "machimasu". So the
 * expected reading is not hand-written either: it comes from the same
 * morphology engine that realizes the forms, decomposed longest-match the way
 * the kana guard decomposes surfaces.
 */
// Punctuation is the only reading written by hand; particles come from
// TAUGHT_PARTICLES, which the morphology engine supplies.
const PUNCTUATION_ROMAJI: Readonly<Record<string, string>> = { "、": ",", "。": "." };

function buildReadings(): Map<string, string> {
  const readings = new Map<string, string>([
    ...TAUGHT_PARTICLES,
    ...Object.entries(PUNCTUATION_ROMAJI),
  ]);
  for (const [id, lex] of BASE_LEXEME_BY_ID) {
    const entry = lex as { kana: string; romaji?: string };
    if (entry.romaji) readings.set(entry.kana, entry.romaji);
    const grid = realizePoliteGrid(id);
    if (grid.ok) {
      for (const cell of Object.values(grid.value) as { jp: string; romaji: string }[][]) {
        readings.set(cell.map((t) => t.jp).join(""), cell.map((t) => t.romaji).join(""));
        for (const token of cell) readings.set(token.jp, token.romaji);
      }
    }
  }
  return readings;
}

function readingFor(kana: string, readings: Map<string, string>): string | undefined {
  let rest = kana;
  const parts: string[] = [];
  while (rest.length > 0) {
    let matched = 0;
    for (let len = rest.length; len > 0; len--) {
      if (readings.has(rest.slice(0, len))) { matched = len; break; }
    }
    if (matched === 0) return undefined;
    parts.push(readings.get(rest.slice(0, matched))!);
    rest = rest.slice(matched);
  }
  return parts.join("");
}

function japaneseLines(lesson: Lesson): { kana: string; romaji: string }[] {
  const found: { kana: string; romaji: string }[] = [];
  const walk = (v: unknown): void => {
    if (!v || typeof v !== "object") return;
    const node = v as Record<string, unknown>;
    if (typeof node.kana === "string" && typeof node.romaji === "string")
      found.push({ kana: node.kana, romaji: node.romaji });
    for (const n of Object.values(node)) walk(n);
  };
  walk(lesson);
  return found;
}

describe("pilot romaji matches the readings the morphology engine realizes", () => {
  const readings = buildReadings();
  // Spacing and case are presentation choices; the reading itself is not.
  const bare = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, "");

  for (const lesson of [politePresentBlock, konbiniImmersion] as Lesson[]) {
    it(`${lesson.id}: every line's romaji is the canonical reading of its kana`, () => {
      const lines = japaneseLines(lesson);
      expect(lines.length).toBeGreaterThan(0);
      const mismatched = lines
        .map((line) => ({ ...line, expected: readingFor(line.kana, readings) }))
        .filter((line) => line.expected !== undefined && bare(line.expected) !== bare(line.romaji))
        .map((line) => `${line.kana}: "${line.romaji}" should read "${line.expected!}"`);
      expect(mismatched).toEqual([]);
    });

    it(`${lesson.id}: every line's kana resolves to a known reading`, () => {
      const unresolvable = japaneseLines(lesson)
        .filter((line) => readingFor(line.kana, readings) === undefined)
        .map((line) => line.kana);
      expect(unresolvable).toEqual([]);
    });
  }
});

/**
 * The guards above are only as good as their allow-list, and the failure mode is
 * silent: a taught particle missing from the seed does not weaken the guard, it
 * makes it reject real content, which pressures the next author into "fixing"
 * correct Japanese or hand-widening the list again.
 *
 * So assert the derivation actually covers the curriculum. This is the test that
 * would have caught the original hand-written seed, which was missing が, の, も,
 * と, ね and よ.
 */
describe("the provenance allow-list tracks the curriculum", () => {
  it("covers every particle surface Base teaches", () => {
    const allowed = buildAllowed();
    const missing = BASE_PARTICLE_SENSES.map((sense) => ({
      sense: sense.id,
      surface: baseParticleSurfaceTokens(sense.id).map((token) => token.jp).join(""),
    })).filter((entry) => !allowed.has(entry.surface));
    expect(missing).toEqual([]);
  });

  it("knows a reading for every particle surface Base teaches", () => {
    const readings = buildReadings();
    const unread = BASE_PARTICLE_SENSES.map((sense) =>
      baseParticleSurfaceTokens(sense.id).map((token) => token.jp).join(""),
    ).filter((surface) => !readings.has(surface));
    expect(unread).toEqual([]);
  });

  it("derives from a non-empty curriculum, so the checks above cannot pass vacuously", () => {
    expect(BASE_PARTICLE_SENSES.length).toBeGreaterThan(0);
    expect(TAUGHT_PARTICLES.size).toBeGreaterThan(0);
  });
});
