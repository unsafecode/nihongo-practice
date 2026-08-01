import { describe, expect, it } from "vitest";
import { courseModulesByLevel } from "../data/course";
import { courseModules as legacyCourseModules } from "../catalog/assembleCourse";
import { examples } from "../data/examples";
import { lessonPlans } from "../catalog/lessonPlans";
import {
  A1_V3_LESSON_ID_MAP,
  A1_V3_PUBLISHED_LESSON_IDS,
  A1_V3_SAFE_SOURCE_LESSON_IDS,
} from "../progress/progress";
import { it as itCopy } from "./it";
import { en as enCopy } from "./en";
import type { CourseCopy } from "./types";

/** Every runtime course module across both levels (A1 + A2) — the merged copy
 * catalog (Phase 3 Task 8) covers both, so the coverage/orphan checks below
 * derive their known-id sets from both levels rather than A1 alone. */
const allRuntimeModules = [
  ...courseModulesByLevel.a1,
  ...courseModulesByLevel.a2,
];

function collectStaticStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStaticStrings);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStaticStrings);
  }
  return [];
}

describe.each([itCopy, enCopy])("course locale", (copy) => {
  it("covers every module, lesson, objective, and outcome copy id the A1 and A2 catalogs reference", () => {
    for (const courseModule of allRuntimeModules) {
      expect(copy.modules[courseModule.id]).toBeTruthy();
      for (const outcomeId of courseModule.outcomeCopyIds) {
        expect(copy.outcomes[outcomeId]).toBeTruthy();
      }
      for (const lesson of courseModule.lessons) {
        expect(copy.lessons[lesson.titleCopyId]).toBeTruthy();
        for (const objectiveId of lesson.objectiveCopyIds) {
          expect(copy.objectives[objectiveId]).toBeTruthy();
        }
      }
    }
  });

  it("contains no blank visible copy", () => {
    const staticCopy = collectStaticStrings({
      home: copy.home,
      lesson: copy.lesson,
      practice: copy.practice,
      exercises: copy.exercises,
      review: copy.review,
      courseMap: copy.courseMap,
      modules: copy.modules,
      lessons: copy.lessons,
      objectives: copy.objectives,
      outcomes: copy.outcomes,
      blocks: copy.blocks,
      examples: copy.examples,
    });
    expect(staticCopy.length).toBeGreaterThan(0);
    expect(staticCopy.every((value) => value.trim().length > 0)).toBe(true);
    expect(copy.home.invalidRoute("/missing").trim().length).toBeGreaterThan(0);
    expect(copy.home.missingAnchorTitle.trim().length).toBeGreaterThan(0);
    expect(copy.home.missingAnchorBody.trim().length).toBeGreaterThan(0);
    expect(copy.home.lessonsProgress(1, 16).trim().length).toBeGreaterThan(0);
    expect(copy.lesson.modulePosition(1, 8).trim().length).toBeGreaterThan(0);
    expect(copy.lesson.contentFormattingError.trim().length).toBeGreaterThan(0);
    expect(copy.courseMap.prerequisites([]).trim().length).toBeGreaterThan(0);
    expect(
      copy.courseMap.prerequisites(["Suoni e hiragana"]).trim().length,
    ).toBeGreaterThan(0);
    expect(copy.courseMap.expandLabel("X").trim().length).toBeGreaterThan(0);
    expect(copy.courseMap.collapseLabel("X").trim().length).toBeGreaterThan(0);
    // Exercise + review dynamic copy is never blank (design spec §10.3-§10.4).
    expect(copy.exercises.position(1, 4).trim().length).toBeGreaterThan(0);
    expect(copy.exercises.addTile("は").trim().length).toBeGreaterThan(0);
    expect(copy.exercises.removeTile("は").trim().length).toBeGreaterThan(0);
    expect(copy.exercises.moveTileBack("は").trim().length).toBeGreaterThan(0);
    expect(copy.exercises.moveTileForward("は").trim().length).toBeGreaterThan(0);
    expect(copy.review.count(1).trim().length).toBeGreaterThan(0);
    expect(copy.review.count(3).trim().length).toBeGreaterThan(0);
    expect(copy.review.fromLesson("X").trim().length).toBeGreaterThan(0);
    expect(copy.review.mistakes(1).trim().length).toBeGreaterThan(0);
    expect(copy.review.mistakes(2).trim().length).toBeGreaterThan(0);
    expect(copy.review.orphaned(1).trim().length).toBeGreaterThan(0);
    expect(copy.review.orphaned(2).trim().length).toBeGreaterThan(0);
  });

  it("has no orphan localized keys beyond what course data references", () => {
    const knownModuleIds = new Set(allRuntimeModules.map((m) => m.id));
    const knownLessonTitleIds = new Set(
      allRuntimeModules.flatMap((m) => m.lessons.map((l) => l.titleCopyId)),
    );
    const knownObjectiveIds = new Set(
      allRuntimeModules.flatMap((m) => m.lessons.flatMap((l) => l.objectiveCopyIds)),
    );
    const knownOutcomeIds = new Set(
      allRuntimeModules.flatMap((m) => m.outcomeCopyIds),
    );
    // `copy.blocks`/`copy.examples` are sourced from the legacy
    // `assembleCourse` pipeline (see i18n/en.ts, i18n/it.ts), not from the
    // live A1 `courseModules` — the live A1 lessons carry no `sections` at
    // all (the rule/comparison/explore/recap body lives in `A1LessonPage`'s
    // generic release view model instead). So their known-id sets are
    // derived from the legacy, fully-populated `courseModules` export.
    const knownBlockCopyIds = new Set(
      legacyCourseModules.flatMap((m) =>
        m.lessons.flatMap((l) => l.sections!.map((s) => s.copyId)),
      ),
    );
    const knownExampleIds = new Set(Object.keys(examples));

    expect(orphanKeys(copy.modules, knownModuleIds)).toEqual([]);
    expect(orphanKeys(copy.lessons, knownLessonTitleIds)).toEqual([]);
    expect(orphanKeys(copy.objectives, knownObjectiveIds)).toEqual([]);
    expect(orphanKeys(copy.outcomes, knownOutcomeIds)).toEqual([]);
    expect(orphanKeys(copy.blocks, knownBlockCopyIds)).toEqual([]);
    expect(orphanKeys(copy.examples, knownExampleIds)).toEqual([]);
  });
});

describe("spoken-attempt consent copy", () => {
  it.each([
    [enCopy.spokenAttempt, "I understand, continue", "Speak now"],
    [itCopy.spokenAttempt, "Ho capito, continua", "Parla ora"],
  ] as const)(
    "keeps acknowledgement separate from microphone permission (%s)",
    (copy, acknowledgement, micStart) => {
      expect(copy.consentAcknowledge).toBe(acknowledgement);
      expect(copy.consentAcknowledge.toLowerCase()).not.toMatch(
        /\b(activate|enable|start|use|microphone|attiva|avvia|inizia|usa|microfono)\b/,
      );
      expect(copy.micStart).toBe(micStart);
    },
  );
});

function orphanKeys(
  dictionary: Record<string, unknown>,
  knownIds: ReadonlySet<string>,
): string[] {
  return Object.keys(dictionary).filter((key) => !knownIds.has(key));
}

describe("locale parity", () => {
  it("shares identical key sets between it and en for every dictionary", () => {
    const dictionaries: Array<
      keyof Pick<
        CourseCopy,
        "modules" | "lessons" | "objectives" | "outcomes" | "blocks" | "examples"
      >
    > = ["modules", "lessons", "objectives", "outcomes", "blocks", "examples"];

    for (const key of dictionaries) {
      const itKeys = Object.keys(itCopy[key]).sort();
      const enKeys = Object.keys(enCopy[key]).sort();
      expect(itKeys).toEqual(enKeys);
    }
  });

  it("keeps the shared content-formatting error in both locales", () => {
    expect(enCopy.lesson.contentFormattingError).toBe(
      "This Japanese example could not be displayed.",
    );
    expect(itCopy.lesson.contentFormattingError).toBe(
      "Non è stato possibile mostrare questo esempio in giapponese.",
    );
  });
});

describe("A2 runtime copy (Phase 3 Task 8): level selector + kanji chrome", () => {
  // Any CJK / kana character — copy values are IT/EN UI text only, never
  // Japanese (the prebuild no-Japanese lint gate enforces the same rule).
  const JAPANESE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/;

  function courseLevelStrings(copy: CourseCopy): string[] {
    const c = copy.courseLevels;
    return [
      c.selectorLabel,
      c.a1,
      c.a2,
      c.a1Heading,
      c.a2Heading,
      c.a2Badge,
      c.a2AvailableHint,
      c.a2RecommendedHint,
      c.a2CheckpointHeading,
      c.resetLevel("A1"),
      c.resetLevel("A2"),
      c.resetLevelConfirm("A1"),
      c.resetLevelConfirm("A2"),
    ];
  }

  function kanjiStrings(copy: CourseCopy): string[] {
    const k = copy.kanji;
    return [k.sectionHeading, k.sectionIntro, k.assessedExplanation, k.revealShow, k.revealHide];
  }

  it("declares the same courseLevels and kanji keys in both locales", () => {
    expect(Object.keys(itCopy.courseLevels).sort()).toEqual(
      Object.keys(enCopy.courseLevels).sort(),
    );
    expect(Object.keys(itCopy.kanji).sort()).toEqual(Object.keys(enCopy.kanji).sort());
  });

  it.each([
    ["en", enCopy],
    ["it", itCopy],
  ] as const)("has non-empty, Japanese-free A2 level/kanji copy (%s)", (_locale, copy) => {
    for (const value of [...courseLevelStrings(copy), ...kanjiStrings(copy)]) {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(JAPANESE.test(value)).toBe(false);
    }
  });

  it("keeps the checkpoint copy an alignment claim, never certification/mastery", () => {
    for (const copy of [enCopy, itCopy]) {
      const body = `${copy.checkpoint.notMet} ${copy.checkpoint.met}`;
      expect(body.toLowerCase()).not.toMatch(
        /\b(certif|mastered|mastery|fluent|passed|superato|certificato|padronanza)\b/,
      );
    }
  });
});

describe("foundation UX copy", () => {
  const FOUNDATION_KEYS = [
    "matrixTitle",
    "matrixIntro",
    "showAll",
    "showFewer",
    "speakerLabel",
    "contextLabel",
    "omittedSubject",
    "guidedTitle",
    "initialLabel",
    "targetLabel",
    "activeAxesLabel",
    "roundOneTitle",
    "roundOneIntro",
    "roundTwoTitle",
    "roundTwoIntro",
    "transferLabel",
    "unavailableTitle",
    "unavailableBody",
  ] as const;

  it("declares exactly the required foundation keys in both locales", () => {
    expect(Object.keys(enCopy.foundation).sort()).toEqual(
      [...FOUNDATION_KEYS].sort(),
    );
    expect(Object.keys(itCopy.foundation).sort()).toEqual(
      [...FOUNDATION_KEYS].sort(),
    );
  });

  it.each([enCopy.foundation, itCopy.foundation])(
    "has natural, non-empty foundation copy (%#)",
    (foundation) => {
      for (const key of FOUNDATION_KEYS) {
        expect(foundation[key].trim().length).toBeGreaterThan(0);
      }
    },
  );

  it("never claims certification, mastery, or fluency", () => {
    const values = [
      ...Object.values(enCopy.foundation),
      ...Object.values(itCopy.foundation),
    ];
    for (const value of values) {
      expect(value.toLowerCase()).not.toMatch(
        /\b(certif\w*|master\w*|maestr\w*|fluen\w*)\b/,
      );
    }
  });
});

describe("progress migration copy (v3→v4, Phase 2 Task 5)", () => {
  const PROGRESS_MIGRATION_KEYS = [
    "noticeTitle",
    "noticeBody",
    "acknowledge",
    "helpTitle",
    "helpBody",
  ] as const;

  it("declares exactly the required progress migration keys in both locales", () => {
    expect(Object.keys(enCopy.progressMigration).sort()).toEqual(
      [...PROGRESS_MIGRATION_KEYS].sort(),
    );
    expect(Object.keys(itCopy.progressMigration).sort()).toEqual(
      [...PROGRESS_MIGRATION_KEYS].sort(),
    );
  });

  it.each([enCopy.progressMigration, itCopy.progressMigration])(
    "has natural, non-empty progress migration copy (%#)",
    (progressMigration) => {
      for (const key of PROGRESS_MIGRATION_KEYS) {
        expect(progressMigration[key].trim().length).toBeGreaterThan(0);
      }
    },
  );

  it("never claims certification, mastery, fluency, or that anything was passed", () => {
    const values = [
      ...Object.values(enCopy.progressMigration),
      ...Object.values(itCopy.progressMigration),
    ];
    for (const value of values) {
      expect(value.toLowerCase()).not.toMatch(
        /\b(certif\w*|master\w*|maestr\w*|fluen\w*|passed|superat\w*)\b/,
      );
    }
  });

  it("truthfully states that visited lessons were kept, in both locales", () => {
    // The core promise of the migration notice: visits carry over even
    // though redesigned practice/checkpoint evidence must be redone.
    expect(enCopy.progressMigration.noticeBody.toLowerCase()).toMatch(
      /\bvisited\b/,
    );
    expect(itCopy.progressMigration.noticeBody.toLowerCase()).toMatch(
      /\bvisitat\w*\b/,
    );
  });

  it("keeps the explanation available in progress help independent of the notice", () => {
    // helpTitle/helpBody must exist and be distinct from the notice copy —
    // acknowledging the notice must not remove this explanation (spec §17).
    expect(enCopy.progressMigration.helpBody).not.toBe(
      enCopy.progressMigration.noticeBody,
    );
    expect(itCopy.progressMigration.helpBody).not.toBe(
      itCopy.progressMigration.noticeBody,
    );
  });

  it("truthfully ties the 'visited lessons carry over' promise to every reviewed, actually-published a0-a1-v1 source lesson id it claims to cover — never a silently narrower subset", () => {
    // The spec-review blocker this test guards against: the migration notice
    // promises visited lessons are preserved, but an earlier version of the
    // reviewed map used an order-only correspondence that silently shifted
    // every capstone, including mapping capstones-orientation (a capstone:false
    // warm-up with no safe v4 twin) onto capstones-1 as if it safely carried
    // over. The three real semantic-twin capstones — self-introduction,
    // everyday-outing, travel-day — do safely carry over and must be covered
    // by the reviewed map. orientation does not: it has no safe v4 equivalent
    // (the numbered capstones-4 slot is a different, mixed dialogue/topic-
    // change scenario) and must stay excluded, so it is never falsely
    // described as preserved.
    expect(new Set(A1_V3_PUBLISHED_LESSON_IDS)).toEqual(
      new Set(lessonPlans.map((plan) => plan.id)),
    );
    for (const semanticTwinCapstone of [
      "capstones-self-introduction",
      "capstones-everyday-outing",
      "capstones-travel-day",
    ]) {
      expect(A1_V3_SAFE_SOURCE_LESSON_IDS).toContain(semanticTwinCapstone);
      expect(A1_V3_LESSON_ID_MAP[semanticTwinCapstone]).toBeDefined();
    }
  });

  it("distinguishes all published legacy lesson ids from the reviewed, safely mapped subset — the only published-but-unmapped id is capstones-orientation", () => {
    // capstones-orientation is real and published (it is one of the 40
    // lessonPlans.ts ids), but it is deliberately not in the safely mapped
    // subset: it has no safe v4 destination, so it must remain an A1 orphan
    // rather than being falsely described by the notice as preserved.
    const publishedButUnmapped = A1_V3_PUBLISHED_LESSON_IDS.filter(
      (id) => !A1_V3_SAFE_SOURCE_LESSON_IDS.includes(id),
    );
    expect(publishedButUnmapped).toEqual(["capstones-orientation"]);
  });

  it("truthfully scopes the migration notice's preservation promise to safely matched lessons, describing unmatched legacy visits as retained recovery/orphan data instead of a preserved equivalent", () => {
    const bodies = [
      enCopy.progressMigration.noticeBody,
      enCopy.progressMigration.helpBody,
      itCopy.progressMigration.noticeBody,
      itCopy.progressMigration.helpBody,
    ];
    for (const body of bodies) {
      expect(body.toLowerCase()).toMatch(/recover|recuper/);
    }
  });

  it("never asserts that a reset, evidence loss, or unmatched-lesson orphaning definitely happened — only ever describes them as conditional, scoped to whichever lessons/evidence actually apply (Phase 2 Task 5 quality-review Important fix)", () => {
    // This notice/help copy is static, locale-level text shown for *every*
    // v1/v2/v3→v4 migration — including a v1/v2 migration (which never had
    // any practice/checkpoint evidence to reset in the first place) and any
    // v3 migration with zero orphaned lessons and zero reset-evidence
    // lessons (see progress.v4.test.ts for those conditions). Phrasing these
    // as definite past occurrences ("were reset", "had no matching lesson")
    // is simply false whenever nothing was actually reset or orphaned; the
    // copy must only ever describe them as things that may apply, not
    // things that did apply.
    const definiteOccurrencePatterns: readonly RegExp[] = [
      /\bwere reset\b/i,
      /\bwas reset\b/i,
      /\bwere cleared\b/i,
      /\bwere erased\b/i,
      /\bhad no matching\b/i,
      /\bhad no safe match\b/i,
      /\ba few older\b/i,
      /\bsome older lessons\b/i,
      /\ba small number of older lessons\b/i,
      /\bfurono azzerat\w*\b/i,
      /\bsono stat[ei] azzerat\w*\b/i,
      /\bsono stat[ei] cancellat\w*\b/i,
      /\balcune vecchie lezioni\b/i,
      /\bun piccolo numero di vecchie lezioni\b/i,
      /\bnon (aveva|avevano) una (lezione corrispondente|corrispondenza sicura)\b/i,
    ];
    const bodies = [
      enCopy.progressMigration.noticeBody,
      enCopy.progressMigration.helpBody,
      itCopy.progressMigration.noticeBody,
      itCopy.progressMigration.helpBody,
    ];
    for (const body of bodies) {
      for (const pattern of definiteOccurrencePatterns) {
        expect(body).not.toMatch(pattern);
      }
    }
  });
});
