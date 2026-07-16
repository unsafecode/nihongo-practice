import { describe, expect, it } from "vitest";

import { foundationCatalogs, foundationCopy } from "./fixtures";
import type { FoundationCatalogs } from "./types";
import { sortAxes, sortedUnique, foundationReportMarkdown } from "./reports";
import { validateFoundations, type ValidateFoundationsResult } from "./validateFoundations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATALOG_VERSION = "cat-v1";
const SEED = "seed-x";

function runValid(): ValidateFoundationsResult {
  return validateFoundations({
    catalogs: foundationCatalogs,
    foundationCopy,
    catalogVersion: CATALOG_VERSION,
    seed: SEED,
  });
}

/** Reverse an array without mutating the (frozen) source. */
function rev<T>(values: readonly T[]): T[] {
  return [...values].reverse();
}

/** Rebuild a record with keys in reverse insertion order. */
function reverseKeys(obj: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(obj).reverse()) out[key] = obj[key];
  return out;
}

/**
 * Produce a semantically identical catalog with every collection reversed and
 * a copy object whose keys are reversed. Canonical sorting inside the reports
 * must render this byte-identically to the original ordering.
 */
function reorderedInput(): {
  catalogs: FoundationCatalogs;
  foundationCopy: { en: Record<string, string>; it: Record<string, string> };
} {
  const c = foundationCatalogs;
  return {
    catalogs: {
      levels: rev(c.levels),
      modules: rev(c.modules),
      checkpoints: rev(c.checkpoints),
      canDos: rev(c.canDos),
      contexts: rev(c.contexts),
      personRoles: rev(c.personRoles),
      referents: rev(c.referents),
      learningTargetSenses: rev(c.learningTargetSenses),
      semanticValues: rev(c.semanticValues),
      sentenceFamilies: rev(c.sentenceFamilies),
      sentenceVariants: rev(c.sentenceVariants),
      lessons: rev(c.lessons),
      lessonPositions: rev(c.lessonPositions),
      verbUseRecords: rev(c.verbUseRecords),
    },
    foundationCopy: {
      en: reverseKeys(foundationCopy.en),
      it: reverseKeys(foundationCopy.it),
    },
  };
}

const LESSON_HEADER =
  "| Lesson | Models | Families | Predicates | Roles | Contexts | Exercises | Unique targets | Max reuse | Transfers | Can-do |";
const LESSON_SEP = "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |";

// ---------------------------------------------------------------------------
// Pure ordering helpers
// ---------------------------------------------------------------------------

describe("reports ordering helpers", () => {
  it("orders variation axes by the canonical pedagogical axis order", () => {
    expect(sortAxes(["context", "predicate-verb", "speaker-person"])).toEqual([
      "speaker-person",
      "predicate-verb",
      "context",
    ]);
  });

  it("dedupes and sorts arbitrary string sets deterministically", () => {
    expect(sortedUnique(["b", "a", "b", "c", "a"])).toEqual(["a", "b", "c"]);
  });
});

// ---------------------------------------------------------------------------
// Lesson coverage rows
// ---------------------------------------------------------------------------

describe("foundation lesson coverage reports", () => {
  it("computes exact A1 lesson coverage counts from realized content", () => {
    const { reports } = runValid();
    const a1 = reports.byLesson["fixture-a1-personal-details"];
    expect(a1).toMatchObject({
      lessonId: "fixture-a1-personal-details",
      level: "a1",
      moduleId: "fixture-a1-module",
      modelCount: 8,
      familyIds: [
        "fixture-a1-object-action",
        "fixture-a1-residence-action",
        "fixture-a1-topic-copular",
      ],
      predicateSenseIds: [
        "fixture-a1-sense-be",
        "fixture-a1-sense-live",
        "fixture-a1-sense-study",
        "fixture-a1-sense-work",
      ],
      omittedSubjectCount: 2,
      contextIds: [
        "fixture-a1-context-first-meeting",
        "fixture-a1-context-language-class",
        "fixture-a1-context-workplace",
      ],
      exerciseCount: 10,
      uniqueVisibleTargetCount: 10,
      maximumVisibleReuse: 1,
      primaryCanDoId: "fixture-a1-can-do-personal-details",
      supportingCanDoIds: [],
      validationErrorCodes: [],
      complete: true,
    });
    expect(a1.roleIds).toHaveLength(5);
    expect(a1.transferTargetIds).toEqual([
      "fixture-a1-transfer-classmate-live-rome",
      "fixture-a1-transfer-ken-study-japanese",
      "fixture-a1-transfer-omitted-study-english",
      "fixture-a1-transfer-teacher-do-work",
      "fixture-a1-transfer-yuki-work-company",
    ]);
    expect(a1.modelDuplicateTransferIds).toEqual([]);
  });

  it("computes exact A2 lesson coverage counts from realized content", () => {
    const { reports } = runValid();
    const a2 = reports.byLesson["fixture-a2-routine-plans"];
    expect(a2).toMatchObject({
      lessonId: "fixture-a2-routine-plans",
      level: "a2",
      moduleId: "fixture-a2-module",
      modelCount: 8,
      omittedSubjectCount: 1,
      exerciseCount: 10,
      uniqueVisibleTargetCount: 10,
      maximumVisibleReuse: 1,
      primaryCanDoId: "fixture-a2-can-do-routine-plans",
      complete: true,
    });
    expect(a2.predicateSenseIds).toHaveLength(6);
    expect(a2.roleIds).toHaveLength(6);
    expect(a2.transferTargetIds).toEqual([
      "fixture-a2-transfer-colleague-go-tomorrow",
      "fixture-a2-transfer-friend-eat-weekend",
      "fixture-a2-transfer-neighbor-meet-after-work",
      "fixture-a2-transfer-omitted-invite-lunch",
      "fixture-a2-transfer-traveler-work-morning",
    ]);
  });

  it("keeps the visible-target keys as canonical Japanese orthography", () => {
    const { reports } = runValid();
    const a1 = reports.byLesson["fixture-a1-personal-details"];
    const keys = Object.keys(a1.visibleTargetCounts);
    expect(keys).toHaveLength(10);
    expect(keys).toContain("ゆきはがくせいです");
    for (const key of keys) {
      // No latin / ascii leakage into the human-visible target keys.
      expect(/^[^\u0000-\u007F]+$/u.test(key)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Module and level aggregation (computed, never authored)
// ---------------------------------------------------------------------------

describe("module coverage aggregation", () => {
  it("aggregates lesson rows into module unions and counts", () => {
    const { reports } = runValid();
    const mod = reports.byModule["fixture-a1-module"];
    expect(mod).toMatchObject({
      moduleId: "fixture-a1-module",
      level: "a1",
      order: 1,
      lessonIds: ["fixture-a1-personal-details"],
      lessonCount: 1,
      modelCount: 8,
      exerciseCount: 10,
      canDoIds: ["fixture-a1-can-do-personal-details"],
      complete: true,
    });
    expect(mod.familyIds).toEqual([
      "fixture-a1-object-action",
      "fixture-a1-residence-action",
      "fixture-a1-topic-copular",
    ]);
    expect(mod.transferTargetIds).toHaveLength(5);
  });

  it("reports empty recurrence-only modules with zeroed aggregates", () => {
    const { reports } = runValid();
    const mod = reports.byModule["fixture-a1-module-2"];
    expect(mod).toMatchObject({
      lessonIds: [],
      lessonCount: 0,
      modelCount: 0,
      exerciseCount: 0,
      familyIds: [],
      transferTargetIds: [],
    });
  });
});

describe("level coverage aggregation", () => {
  it("aggregates modules, lessons, models, exercises, transfers and verb recurrence", () => {
    const { reports } = runValid();
    const level = reports.byLevel["a1"];
    expect(level).toMatchObject({
      level: "a1",
      moduleIds: ["fixture-a1-module", "fixture-a1-module-2"],
      lessonIds: ["fixture-a1-personal-details"],
      canDoIds: ["fixture-a1-can-do-personal-details"],
      moduleCount: 2,
      lessonCount: 1,
      modelCount: 8,
      exerciseCount: 10,
      transferCount: 5,
      complete: true,
    });
    expect(level.verbRecurrence).toEqual([
      {
        recordId: "fixture-a1-verb-use-study",
        senseId: "fixture-a1-sense-study",
        learningUse: "productive",
        spacedReuse: true,
        laterModule: true,
        structureReuse: true,
        complete: true,
      },
      {
        recordId: "fixture-a1-verb-use-work",
        senseId: "fixture-a1-sense-work",
        learningUse: "productive",
        spacedReuse: true,
        laterModule: true,
        structureReuse: true,
        complete: true,
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Verb recurrence rows: structure keys carry no person/context/value IDs
// ---------------------------------------------------------------------------

describe("verb recurrence report rows", () => {
  it("emits structure keys that ignore person, context and value identity", () => {
    const { reports } = runValid();
    const study = reports.verbUse.find((r) => r.recordId === "fixture-a1-verb-use-study");
    expect(study).toBeDefined();
    expect(study?.introductionStructureKeys).toEqual([
      "fixture-a1-object-action|explicit|affirmative:present:polite|object,predicate,subject",
      "fixture-a1-object-action|omitted|affirmative:present:polite|object,predicate,subject",
    ]);
    expect(study?.distinctStructureCount).toBe(2);
    expect(study?.maxPositionGap).toBe(4);
    expect(study?.hasLaterModule).toBe(true);
    for (const key of study?.introductionStructureKeys ?? []) {
      // Person, context and semantic-value IDs must never leak into a
      // structure signature (§9.3).
      expect(key).not.toContain("referent");
      expect(key).not.toContain("context");
      expect(key).not.toContain("value");
      expect(key).not.toContain("role");
    }
  });
});

// ---------------------------------------------------------------------------
// Markdown rendering: exact tables + byte-stable under reordering
// ---------------------------------------------------------------------------

describe("foundationReportMarkdown", () => {
  it("renders the exact lesson coverage header and rows", () => {
    const md = foundationReportMarkdown(runValid().reports);
    expect(md.startsWith("## Lesson coverage\n")).toBe(true);
    expect(md).toContain(LESSON_HEADER);
    expect(md).toContain(LESSON_SEP);
    expect(md).toContain(
      "| fixture-a1-personal-details | 8 | 3 | 4 | 5 | 3 | 10 | 10 | 1 | 5 | fixture-a1-can-do-personal-details |",
    );
    expect(md).toContain(
      "| fixture-a2-routine-plans | 8 | 3 | 6 | 6 | 3 | 10 | 10 | 1 | 5 | fixture-a2-can-do-routine-plans |",
    );
  });

  it("renders the verb recurrence and checkpoint tables", () => {
    const md = foundationReportMarkdown(runValid().reports);
    expect(md).toContain("## Verb recurrence");
    expect(md).toContain(
      "| Record | Sense | Use | Intro lesson | Intro pos | Structures | Later lessons | Max gap | Later module |",
    );
    expect(md).toContain(
      "| fixture-a1-verb-use-study | fixture-a1-sense-study | productive | fixture-a1-personal-details | 5 | 2 | fixture-a1-lesson-recur-1, fixture-a1-lesson-recur-2 | 4 | yes |",
    );
    expect(md).toContain("## Can-do checkpoints");
    expect(md).toContain("| Checkpoint | Level | Sampled Can-dos | Min transfer targets |");
    expect(md).toContain(
      "| fixture-a1-checkpoint | a1 | fixture-a1-can-do-personal-details | 2 |",
    );
  });

  it("ends with a single trailing newline", () => {
    const md = foundationReportMarkdown(runValid().reports);
    expect(md.endsWith("\n")).toBe(true);
    expect(md.endsWith("\n\n")).toBe(false);
  });

  it("is byte-identical after reordering input catalogs and copy keys", () => {
    const canonical = foundationReportMarkdown(runValid().reports);
    const reordered = reorderedInput();
    const result = validateFoundations({
      catalogs: reordered.catalogs,
      foundationCopy: reordered.foundationCopy,
      catalogVersion: CATALOG_VERSION,
      seed: SEED,
    });
    expect(result.valid).toBe(true);
    expect(foundationReportMarkdown(result.reports)).toBe(canonical);
  });

  it("optionally prints deterministic markdown without writing a file when FOUNDATION_REPORT=1", () => {
    const md = foundationReportMarkdown(runValid().reports);
    if (process.env.FOUNDATION_REPORT === "1") {
      // Human inspection only — this is stdout, never a file write.
      // eslint-disable-next-line no-console
      console.log(md);
    }
    // The rendering is a pure function of the reports: identical across calls.
    expect(foundationReportMarkdown(runValid().reports)).toBe(md);
  });
});
