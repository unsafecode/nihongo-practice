/**
 * A2 exact metrics-report gate (Phase 3 Task 9 exit gate).
 *
 * The single, machine-readable "did the whole A2 release come out to the
 * exact planned shape?" gate. Where `reports.test.ts` proves the report
 * *builds* and renders stably, this proves every number, key, and type of the
 * `buildA2Reports()` output against the frozen release plan — and fails
 * *loudly* (unexpected/missing key, wrong type, out-of-budget value) rather
 * than silently tolerating drift.
 *
 * Every expected figure below is the release plan, authored here and never
 * derived from the actual report in the same run:
 *   - levels exactly ["a2"], 15 modules, 60 lessons;
 *   - per lesson: 8-12 models, 8-12 exercises, ≥5 unique targets, ≤2 reuse,
 *     ≥3 predicates, ≥3 roles, ≥2 contexts, ≥2 transfers, controlled
 *     production, complete;
 *   - 15 grammar forms, each with a real intro (earliest), a controlled
 *     practice, a transfer, and ≥1 strictly-later recurrence;
 *   - 120 kanji glyphs in the exact per-module distribution
 *     (8,12,9,8,9,8,8,8,8,8,8,9,8,9,0 — sum 120), every glyph strictly
 *     first-supported < supported-retrieval < revealable < assessed, no
 *     synthesis first-support, no romaji bypass at the assessed stage.
 */
import { describe, expect, it } from "vitest";

import { buildA2Reports, type A2CoverageReports } from "./reports";
import { A2_KANJI_DISTRIBUTION } from "../kanji/a2KanjiCatalog";
import {
  A2_CANONICAL_POSITIONS,
  A2_MODULE_IDS,
  A2_SYNTHESIS_LESSON_IDS,
} from "../manifest";

const reports: A2CoverageReports = buildA2Reports();

// The release plan, authored here (never read back from `reports`).
const EXPECTED_MODULE_ORDER: readonly string[] = [
  "connected-conversation",
  "plans-invitations",
  "experiences-narratives",
  "reasons-opinions",
  "sequencing-ongoing",
  "permission-requests",
  "neighborhood-services",
  "restaurant-problems",
  "shopping-returns",
  "health-advice",
  "work-study-messages",
  "travel-reservations",
  "relationships-events",
  "practical-texts",
  "a2-synthesis",
];
const EXPECTED_KANJI_DISTRIBUTION: readonly number[] = [
  8, 12, 9, 8, 9, 8, 8, 8, 8, 8, 8, 9, 8, 9, 0,
];
const EXPECTED_KANJI_TOTAL = 120;
const EXPECTED_MODULE_COUNT = 15;
const EXPECTED_LESSON_COUNT = 60;
const EXPECTED_GRAMMAR_COUNT = 15;
const EXPECTED_CANDO_COUNT = 59;

const synthesisLessonIds = new Set<string>(A2_SYNTHESIS_LESSON_IDS);
const positionOf = (lessonId: string): number => {
  const position = A2_CANONICAL_POSITIONS[lessonId];
  expect(position, `canonical position for ${lessonId}`).toBeTypeOf("number");
  return position;
};

/** Fail loudly on any missing or extra key. */
function expectExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  label: string,
): void {
  expect(Object.keys(value).sort(), `${label} keys`).toEqual([...expectedKeys].sort());
}

type FieldType = "string" | "number" | "boolean" | "string[]";
function expectFieldTypes(
  value: Record<string, unknown>,
  types: Readonly<Record<string, FieldType>>,
  label: string,
): void {
  for (const [key, kind] of Object.entries(types)) {
    const actual = value[key];
    if (kind === "string[]") {
      expect(Array.isArray(actual), `${label}.${key} is array`).toBe(true);
      for (const item of actual as unknown[]) {
        expect(typeof item, `${label}.${key}[] item`).toBe("string");
      }
    } else {
      expect(typeof actual, `${label}.${key} type`).toBe(kind);
    }
  }
}

describe("A2 metrics report — machine-readable shape (exact keys/types, fail loud)", () => {
  it("exposes exactly the documented top-level keys", () => {
    expectExactKeys(
      reports as unknown as Record<string, unknown>,
      [
        "levels",
        "moduleCount",
        "lessonCount",
        "byLesson",
        "byModule",
        "byLevel",
        "canDos",
        "grammar",
        "kanji",
        "checkpoint",
        "validation",
      ],
      "reports",
    );
  });

  it("byLevel row has the exact keys and value types", () => {
    expectExactKeys(
      reports.byLevel as unknown as Record<string, unknown>,
      ["level", "moduleCount", "lessonCount", "modelCount", "exerciseCount", "transferCount", "complete"],
      "byLevel",
    );
    expectFieldTypes(
      reports.byLevel as unknown as Record<string, unknown>,
      {
        level: "string",
        moduleCount: "number",
        lessonCount: "number",
        modelCount: "number",
        exerciseCount: "number",
        transferCount: "number",
        complete: "boolean",
      },
      "byLevel",
    );
  });

  it("every lesson row has the exact keys and value types", () => {
    expect(reports.byLesson.length).toBe(EXPECTED_LESSON_COUNT);
    for (const row of reports.byLesson) {
      expectExactKeys(
        row as unknown as Record<string, unknown>,
        [
          "lessonId",
          "moduleId",
          "position",
          "modelCount",
          "exerciseCount",
          "uniqueTargetCount",
          "maximumVisibleReuse",
          "predicateCount",
          "roleCount",
          "contextCount",
          "transferCount",
          "controlledProduction",
          "primaryCanDoId",
          "supportingCanDoIds",
          "complete",
        ],
        `lesson ${row.lessonId}`,
      );
      expectFieldTypes(
        row as unknown as Record<string, unknown>,
        {
          lessonId: "string",
          moduleId: "string",
          position: "number",
          modelCount: "number",
          exerciseCount: "number",
          uniqueTargetCount: "number",
          maximumVisibleReuse: "number",
          predicateCount: "number",
          roleCount: "number",
          contextCount: "number",
          transferCount: "number",
          controlledProduction: "boolean",
          primaryCanDoId: "string",
          supportingCanDoIds: "string[]",
          complete: "boolean",
        },
        `lesson ${row.lessonId}`,
      );
    }
  });

  it("kanji report and every glyph entry have the exact keys and value types", () => {
    expectExactKeys(
      reports.kanji as unknown as Record<string, unknown>,
      ["total", "byModule", "entries", "valid", "errorCodes"],
      "kanji",
    );
    expect(reports.kanji.entries.length).toBe(EXPECTED_KANJI_TOTAL);
    for (const entry of reports.kanji.entries) {
      expectExactKeys(
        entry as unknown as Record<string, unknown>,
        [
          "kanjiId",
          "glyph",
          "firstSupportedLessonId",
          "supportedRetrievalLessonId",
          "revealableLessonId",
          "assessedLessonId",
          "orderValid",
          "noBypassValid",
        ],
        `kanji ${entry.kanjiId}`,
      );
      expectFieldTypes(
        entry as unknown as Record<string, unknown>,
        {
          kanjiId: "string",
          glyph: "string",
          firstSupportedLessonId: "string",
          supportedRetrievalLessonId: "string",
          revealableLessonId: "string",
          assessedLessonId: "string",
          orderValid: "boolean",
          noBypassValid: "boolean",
        },
        `kanji ${entry.kanjiId}`,
      );
    }
  });

  it("every grammar row has the exact keys and value types", () => {
    expect(reports.grammar.length).toBe(EXPECTED_GRAMMAR_COUNT);
    for (const row of reports.grammar) {
      expectExactKeys(
        row as unknown as Record<string, unknown>,
        [
          "formId",
          "canDoId",
          "introLessonId",
          "controlledPracticeLessonId",
          "transferLessonId",
          "recurrenceLessonIds",
          "structurallyValid",
          "evidenceComplete",
        ],
        `grammar ${row.formId}`,
      );
      expectFieldTypes(
        row as unknown as Record<string, unknown>,
        {
          formId: "string",
          canDoId: "string",
          introLessonId: "string",
          controlledPracticeLessonId: "string",
          transferLessonId: "string",
          recurrenceLessonIds: "string[]",
          structurallyValid: "boolean",
          evidenceComplete: "boolean",
        },
        `grammar ${row.formId}`,
      );
    }
  });
});

describe("A2 metrics report — exact level/module/lesson counts", () => {
  it("reports exactly one level (a2), 15 modules, 60 lessons", () => {
    expect(reports.levels).toEqual(["a2"]);
    expect(reports.moduleCount).toBe(EXPECTED_MODULE_COUNT);
    expect(reports.lessonCount).toBe(EXPECTED_LESSON_COUNT);
    expect(reports.byModule).toHaveLength(EXPECTED_MODULE_COUNT);
    expect(reports.byLesson).toHaveLength(EXPECTED_LESSON_COUNT);
  });

  it("orders the 15 modules exactly by the frozen release order", () => {
    expect(reports.byModule.map((row) => row.moduleId)).toEqual(EXPECTED_MODULE_ORDER);
    expect(reports.byModule.map((row) => row.order)).toEqual(
      Array.from({ length: EXPECTED_MODULE_COUNT }, (_, index) => index + 1),
    );
    // The manifest module order must itself match the plan (guards the source).
    expect([...A2_MODULE_IDS]).toEqual(EXPECTED_MODULE_ORDER);
  });

  it("orders the 60 lessons by strictly ascending position 1..60", () => {
    expect(reports.byLesson.map((row) => row.position)).toEqual(
      Array.from({ length: EXPECTED_LESSON_COUNT }, (_, index) => index + 1),
    );
  });

  it("aggregates the exact level totals and marks the level complete", () => {
    expect(reports.byLevel).toEqual({
      level: "a2",
      moduleCount: 15,
      lessonCount: 60,
      modelCount: 508,
      exerciseCount: 600,
      transferCount: 300,
      complete: true,
    });
  });

  it("surfaces a clean release verdict (valid, complete, no error codes)", () => {
    expect(reports.validation.valid).toBe(true);
    expect(reports.validation.foundationComplete).toBe(true);
    expect(reports.validation.errorCodes).toEqual([]);
  });
});

describe("A2 metrics report — per-lesson depth budget (every one of the 60 lessons)", () => {
  it("gives every lesson 8-12 models, 8-12 exercises, ≥5 unique targets, ≤2 reuse, ≥3 predicates/roles, ≥2 contexts, ≥2 transfers, controlled production, complete", () => {
    expect(reports.byLesson.length).toBe(EXPECTED_LESSON_COUNT); // non-vacuous
    for (const row of reports.byLesson) {
      const where = row.lessonId;
      expect(row.modelCount, `${where} models`).toBeGreaterThanOrEqual(8);
      expect(row.modelCount, `${where} models`).toBeLessThanOrEqual(12);
      expect(row.exerciseCount, `${where} exercises`).toBeGreaterThanOrEqual(8);
      expect(row.exerciseCount, `${where} exercises`).toBeLessThanOrEqual(12);
      expect(row.uniqueTargetCount, `${where} unique targets`).toBeGreaterThanOrEqual(5);
      expect(row.maximumVisibleReuse, `${where} max reuse`).toBeLessThanOrEqual(2);
      expect(row.predicateCount, `${where} predicates`).toBeGreaterThanOrEqual(3);
      // Synthesis (capstone) lessons are two-speaker scenes: minRoles is 2.
      const expectedMinRoles = row.lessonId.startsWith("a2-synthesis-") ? 2 : 3;
      expect(row.roleCount, `${where} roles`).toBeGreaterThanOrEqual(expectedMinRoles);
      expect(row.contextCount, `${where} contexts`).toBeGreaterThanOrEqual(2);
      expect(row.transferCount, `${where} transfers`).toBeGreaterThanOrEqual(2);
      expect(row.controlledProduction, `${where} controlled production`).toBe(true);
      expect(row.complete, `${where} complete`).toBe(true);
    }
  });

  it("keeps each lesson's module attribution inside the 15 planned modules", () => {
    const moduleIds = new Set(EXPECTED_MODULE_ORDER);
    for (const row of reports.byLesson) {
      expect(moduleIds.has(row.moduleId), `${row.lessonId} moduleId ${row.moduleId}`).toBe(true);
    }
  });
});

describe("A2 metrics report — grammar spiral (15 forms, intro→practice→transfer→later recurrence)", () => {
  it("reports exactly 15 structurally-valid, evidence-complete forms", () => {
    expect(reports.grammar).toHaveLength(EXPECTED_GRAMMAR_COUNT);
    for (const row of reports.grammar) {
      expect(row.structurallyValid, row.formId).toBe(true);
      expect(row.evidenceComplete, row.formId).toBe(true);
    }
  });

  it("every form resolves a real intro (earliest), practice, transfer, and ≥1 strictly-later recurrence", () => {
    for (const row of reports.grammar) {
      const intro = positionOf(row.introLessonId);
      const practice = positionOf(row.controlledPracticeLessonId);
      const transfer = positionOf(row.transferLessonId);
      expect(row.recurrenceLessonIds.length, `${row.formId} recurrences`).toBeGreaterThanOrEqual(1);
      const recurrences = row.recurrenceLessonIds.map(positionOf);
      // The introduction is the earliest exposure of the form.
      expect(intro, `${row.formId} intro before practice`).toBeLessThan(practice);
      expect(intro, `${row.formId} intro before transfer`).toBeLessThan(transfer);
      // Every recurrence is strictly later than all of intro/practice/transfer.
      const latestCore = Math.max(intro, practice, transfer);
      expect(Math.min(...recurrences), `${row.formId} recurrence after core`).toBeGreaterThan(latestCore);
    }
  });
});

describe("A2 metrics report — contextual kanji (120 glyphs, exact distribution, strict staging)", () => {
  it("reports exactly 120 glyphs, all order/no-bypass valid, no error codes", () => {
    expect(reports.kanji.total).toBe(EXPECTED_KANJI_TOTAL);
    expect(reports.kanji.entries).toHaveLength(EXPECTED_KANJI_TOTAL);
    expect(reports.kanji.valid).toBe(true);
    expect(reports.kanji.errorCodes).toEqual([]);
  });

  it("matches the exact frozen per-module distribution (8,12,9,8,9,8,8,8,8,8,8,9,8,9,0 — sum 120)", () => {
    // Object shape matches the frozen catalog constant …
    expect(reports.kanji.byModule).toEqual(A2_KANJI_DISTRIBUTION);
    // … and, read in canonical module order, matches the authored plan array.
    const ordered = EXPECTED_MODULE_ORDER.map((moduleId) => reports.kanji.byModule[moduleId]);
    expect(ordered).toEqual([...EXPECTED_KANJI_DISTRIBUTION]);
    expect(ordered.reduce((sum, count) => sum + count, 0)).toBe(EXPECTED_KANJI_TOTAL);
    // The synthesis module introduces no new kanji.
    expect(reports.kanji.byModule["a2-synthesis"]).toBe(0);
  });

  it("stages every glyph strictly first-supported < supported-retrieval < revealable < assessed, never first-supported in synthesis, romaji withheld when assessed", () => {
    for (const entry of reports.kanji.entries) {
      const where = entry.kanjiId;
      const firstSupported = positionOf(entry.firstSupportedLessonId);
      const supportedRetrieval = positionOf(entry.supportedRetrievalLessonId);
      const revealable = positionOf(entry.revealableLessonId);
      const assessed = positionOf(entry.assessedLessonId);
      expect(firstSupported, `${where} first<supported`).toBeLessThan(supportedRetrieval);
      expect(supportedRetrieval, `${where} supported<revealable`).toBeLessThan(revealable);
      expect(revealable, `${where} revealable<assessed`).toBeLessThan(assessed);
      expect(synthesisLessonIds.has(entry.firstSupportedLessonId), `${where} first-support not synthesis`).toBe(false);
      expect(entry.orderValid, `${where} orderValid`).toBe(true);
      // noBypassValid ⇒ furigana/romaji genuinely withheld at the assessed stage.
      expect(entry.noBypassValid, `${where} noBypassValid (romaji not shown at assessed)`).toBe(true);
    }
  });
});

describe("A2 metrics report — checkpoint + Can-do budget", () => {
  it("samples all 59 Can-dos with 3 accepted transfer targets each and no validation errors", () => {
    expect(reports.canDos).toHaveLength(EXPECTED_CANDO_COUNT);
    expect(reports.checkpoint.sampledCanDoIds).toHaveLength(EXPECTED_CANDO_COUNT);
    expect(reports.checkpoint.minAcceptedTransferTargetsPerCanDo).toBe(3);
    expect(reports.checkpoint.validationErrorCodes).toEqual([]);
    for (const canDoId of reports.checkpoint.sampledCanDoIds) {
      expect(reports.checkpoint.canDoEvidenceMins[canDoId], canDoId).toBe(3);
    }
  });
});

describe("A2 metrics report — deterministic build", () => {
  it("produces a deeply-equal report on an independent rebuild", () => {
    expect(buildA2Reports()).toEqual(reports);
  });
});
