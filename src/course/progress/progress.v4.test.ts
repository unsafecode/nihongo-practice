import { describe, expect, expectTypeOf, it } from "vitest";
import { lessonPlans } from "../catalog/lessonPlans";
import { courseModules as legacyAssembledCourseModules } from "../catalog/assembleCourse";
import { courseModulesByLevel } from "../data/course";
import { getLessonExercises } from "../components/lessonExerciseModel";
import { A1_LESSON_IDS } from "../a1/manifest";
import {
  A1_V3_LESSON_ID_MAP,
  A1_V3_PUBLISHED_LESSON_IDS,
  A1_V3_SAFE_SOURCE_LESSON_IDS,
  A1_V4_DESTINATION_LESSON_IDS,
  acknowledgeMigrationNotice,
  clearAll,
  clearLevel,
  CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
  emptyLevelProgress,
  emptyProgressV4,
  emptyProgressV5,
  migrateV4Catalog,
  migrateV4ToV5,
  migrateV3ToV4,
  parseProgress,
  recordCanDoEvidence,
  recordCheckpointAttempt,
  summarizeLevel,
  visitedLessonIdsForLevel,
  type CheckpointAttempt,
  type CourseProgressV3,
  type CourseProgressV4,
  type CourseProgressV5,
  type LevelProgress,
  type ModuleOutline,
  type StoredCourseProgressV4,
} from "./progress";
import { reviewKeyFor } from "./reviewQueue";

type Assert<T extends true> = T;
type IsAssignable<From, To> = [From] extends [To] ? true : false;
type V5DoesNotMatchV4 = Assert<
  IsAssignable<CourseProgressV5, CourseProgressV4> extends false ? true : false
>;

const T0 = "2026-07-16T10:00:00.000Z";
const T1 = "2026-07-16T11:00:00.000Z";
const T2 = "2026-07-16T12:00:00.000Z";

function v3Lesson(overrides: Partial<CourseProgressV3["lessons"][string]> = {}) {
  return {
    visitedAt: null,
    practicedAt: null,
    consolidatedAt: null,
    attemptedExerciseIds: [],
    acceptedExerciseIds: [],
    ...overrides,
  };
}

function v3Fixture(overrides: Partial<CourseProgressV3> = {}): CourseProgressV3 {
  return {
    schemaVersion: 3,
    catalogVersion: "a0-a1-v1",
    lessons: {},
    lastVisitedLessonId: null,
    reviewQueue: [],
    orphanedLessonIds: [],
    orphanedReviewKeys: [],
    updatedAt: T0,
    ...overrides,
  };
}

type CatalogSets = {
  readonly knownReviewKeysByLevel: Readonly<
    Record<"a1" | "a2", ReadonlySet<string>>
  >;
  readonly knownLessonIdsByLevel: Readonly<
    Record<"a1" | "a2", ReadonlySet<string>>
  >;
};

function currentCatalogSets(): CatalogSets {
  const knownLessonIdsByLevel = {
    a1: new Set(
      courseModulesByLevel.a1.flatMap((module) =>
        module.lessons.map((lesson) => lesson.id),
      ),
    ),
    a2: new Set(
      courseModulesByLevel.a2.flatMap((module) =>
        module.lessons.map((lesson) => lesson.id),
      ),
    ),
  };
  return {
    knownLessonIdsByLevel,
    knownReviewKeysByLevel: {
      a1: new Set(
        [...knownLessonIdsByLevel.a1].flatMap((lessonId) =>
          (getLessonExercises(lessonId)?.exercises ?? []).map((exercise) =>
            reviewKeyFor(lessonId, exercise.definitionId),
          ),
        ),
      ),
      a2: new Set(
        [...knownLessonIdsByLevel.a2].flatMap((lessonId) =>
          (getLessonExercises(lessonId)?.exercises ?? []).map((exercise) =>
            reviewKeyFor(lessonId, exercise.definitionId),
          ),
        ),
      ),
    },
  };
}

function exerciseIds(lessonId: string): string[] {
  const model = getLessonExercises(lessonId);
  if (!model) throw new Error(`fixture requires exercises for ${lessonId}`);
  return model.exercises.map((exercise) => exercise.definitionId);
}

function reviewEntry(
  lessonId: string,
  exerciseDefinitionId: string,
  lastMistakeAt: string,
) {
  return {
    reviewKey: reviewKeyFor(lessonId, exerciseDefinitionId),
    lessonId,
    exerciseDefinitionId,
    targetConceptIds: ["preserved-concept"],
    targetLexemeIds: ["preserved-lexeme"],
    mistakeCount: 3,
    lastMistakeAt,
  };
}

describe("A1_V3_PUBLISHED_LESSON_IDS / A1_V3_SAFE_SOURCE_LESSON_IDS / A1_V3_LESSON_ID_MAP / A1_V4_DESTINATION_LESSON_IDS", () => {
  it("keeps V4 and V5 schema/catalog discriminants independent", () => {
    expectTypeOf<V5DoesNotMatchV4>().toEqualTypeOf<true>();
    expectTypeOf<StoredCourseProgressV4>().toMatchTypeOf(emptyProgressV4());

    if (false) {
      // @ts-expect-error V5 progress cannot enter the V4 catalog migrator.
      migrateV4Catalog(emptyProgressV5());
    }

    expect(emptyProgressV4()).toMatchObject({
      schemaVersion: 4,
      catalogVersion: CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
    });
  });

  it("keeps the current A1 runtime destination catalog at the exact 16-module / 64-lesson manifest shape", () => {
    const current = currentCatalogSets();

    expect(courseModulesByLevel.a1).toHaveLength(16);
    expect(current.knownLessonIdsByLevel.a1).toHaveLength(64);
    expect([...current.knownLessonIdsByLevel.a1].sort()).toEqual(
      [...A1_LESSON_IDS].sort(),
    );
  });

  it("matches the exact real published a0-a1-v1 catalog (src/course/catalog/lessonPlans.ts), so a future lesson-id rename in that catalog fails this test instead of silently orphaning real visits", () => {
    // This is the load-bearing regression guard for the Phase 2 Task 5
    // spec-review blocker: the migration's reviewed source-id list must be
    // verified against the actual shipped v3 catalog, not a hand-typed guess
    // that happens to look plausible. `lessonPlans` is the real, currently
    // published a0-a1-v1 lesson catalog (imported from ../catalog/lessonPlans,
    // consumed by curriculum.ts/exercises.ts at runtime) — every one of its
    // 40 ids, in its own authored order, must appear here, whether or not it
    // is a *safe* migration source.
    expect(A1_V3_PUBLISHED_LESSON_IDS).toEqual(lessonPlans.map((plan) => plan.id));
    expect(A1_V3_PUBLISHED_LESSON_IDS).toHaveLength(40);
  });

  it("matches the legacy assembled courseModules catalog too (src/course/catalog/assembleCourse.ts, built from lessonPlans), confirming the published v3 list tracks what the v3 schema actually shipped, not just the leaf authoring file — Phase 2 Task 6 switched src/course/data/course.ts's courseModules to the validated v4 A1 release catalog, so that export is no longer the v3-equivalent comparison target here", () => {
    const assembledLessonIds = legacyAssembledCourseModules.flatMap((courseModule) =>
      courseModule.lessons.map((lesson) => lesson.id),
    );
    expect(new Set(A1_V3_PUBLISHED_LESSON_IDS)).toEqual(new Set(assembledLessonIds));
    expect(A1_V3_PUBLISHED_LESSON_IDS).toHaveLength(assembledLessonIds.length);
  });

  it("includes all four real named v3 capstone ids among published ids — not the impossible numbered capstones-1..4, which never existed in v3", () => {
    // capstones-1..4 are v4 A1 catalog ids (src/course/a1/catalog/module12Capstones.ts).
    // They cannot be v3 sources: no shipped v3 payload could ever contain them.
    expect(A1_V3_PUBLISHED_LESSON_IDS).toEqual(
      expect.arrayContaining([
        "capstones-orientation",
        "capstones-self-introduction",
        "capstones-everyday-outing",
        "capstones-travel-day",
      ]),
    );
    expect(A1_V3_PUBLISHED_LESSON_IDS).not.toEqual(
      expect.arrayContaining(["capstones-1", "capstones-2", "capstones-3", "capstones-4"]),
    );
  });

  it("recognises exactly 39 of the 40 published ids as safe migration sources: 35 unchanged ids + sounds-5 + the three semantic-twin named capstones", () => {
    // capstones-orientation is deliberately excluded: it is a capstone:false
    // warm-up (assessedConceptIds only, no capstone scenario content), and
    // the numbered v4 slot at the same ordinal position, capstones-4, is a
    // *different*, mixed identity/action/description/topic-change scenario
    // (module12Capstones.ts) — not a safe semantic equivalent of orientation.
    // So orientation has no safe v4 destination and must stay an A1 orphan.
    expect(A1_V3_SAFE_SOURCE_LESSON_IDS).toHaveLength(39);
    expect(A1_V3_SAFE_SOURCE_LESSON_IDS).not.toContain("capstones-orientation");
    expect(A1_V3_SAFE_SOURCE_LESSON_IDS).toEqual(
      expect.arrayContaining([
        "sounds-5",
        "capstones-self-introduction",
        "capstones-everyday-outing",
        "capstones-travel-day",
      ]),
    );

    const unmappedPublishedIds = A1_V3_PUBLISHED_LESSON_IDS.filter(
      (id) => !A1_V3_SAFE_SOURCE_LESSON_IDS.includes(id),
    );
    expect(unmappedPublishedIds).toEqual(["capstones-orientation"]);
  });

  it("has exactly 39 map entries (one per safely reviewed v3 source id) reducing to 38 unique v4 destinations (sounds-5 collapses onto sounds-4)", () => {
    expect(Object.keys(A1_V3_LESSON_ID_MAP)).toHaveLength(39);
    expect(new Set(Object.keys(A1_V3_LESSON_ID_MAP))).toEqual(
      new Set(A1_V3_SAFE_SOURCE_LESSON_IDS),
    );
    expect(A1_V3_LESSON_ID_MAP["capstones-orientation"]).toBeUndefined();
    expect(A1_V4_DESTINATION_LESSON_IDS).toHaveLength(38);
    expect(new Set(Object.values(A1_V3_LESSON_ID_MAP))).toEqual(
      new Set(A1_V4_DESTINATION_LESSON_IDS),
    );
  });

  it("maps every safe source id that is unchanged between v3 and v4 to itself", () => {
    const aliased = new Set([
      "sounds-5",
      "capstones-self-introduction",
      "capstones-everyday-outing",
      "capstones-travel-day",
    ]);
    for (const id of A1_V3_SAFE_SOURCE_LESSON_IDS) {
      if (aliased.has(id)) continue;
      expect(A1_V3_LESSON_ID_MAP[id]).toBe(id);
    }
  });

  it("aliases the retired sounds-5 lesson onto sounds-4", () => {
    expect(A1_V3_LESSON_ID_MAP["sounds-5"]).toBe("sounds-4");
  });

  it("aliases each of the three semantic-twin named v3 capstones onto its matching v4 numbered scenario — self-introduction→1, everyday-outing→2, travel-day→3 — never orientation, which has no safe twin", () => {
    expect(A1_V3_LESSON_ID_MAP["capstones-self-introduction"]).toBe("capstones-1");
    expect(A1_V3_LESSON_ID_MAP["capstones-everyday-outing"]).toBe("capstones-2");
    expect(A1_V3_LESSON_ID_MAP["capstones-travel-day"]).toBe("capstones-3");
    expect(A1_V3_LESSON_ID_MAP["capstones-orientation"]).toBeUndefined();
  });

  it("never routes any migrated visit onto capstones-4 — it is a mixed dialogue/topic-change scenario with no v3 source, not orientation's replacement", () => {
    expect(A1_V4_DESTINATION_LESSON_IDS).not.toContain("capstones-4");
  });
});

describe("migrateV3ToV4 — deterministic visited-only migration", () => {
  it("preserves only visitedAt for a safely mapped lesson, clearing every other kind of evidence", () => {
    const v3 = v3Fixture({
      lessons: {
        "sounds-1": v3Lesson({
          visitedAt: T0,
          practicedAt: T1,
          consolidatedAt: T2,
          attemptedExerciseIds: ["sounds-1-x1"],
          acceptedExerciseIds: ["sounds-1-x1"],
        }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-1"]).toEqual({
      visitedAt: T0,
      practicedAt: null,
      consolidatedAt: null,
      attemptedExerciseIds: [],
      acceptedExerciseIds: [],
    });
    expect(v4.migrationNotice?.preservedVisitedLessonIds).toEqual(["sounds-1"]);
    expect(v4.migrationNotice?.resetEvidenceLessonIds).toEqual(["sounds-1"]);
  });

  it("does not list a visited-only lesson (no stronger evidence lost) in resetEvidenceLessonIds", () => {
    const v3 = v3Fixture({
      lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.migrationNotice?.preservedVisitedLessonIds).toEqual(["sounds-1"]);
    expect(v4.migrationNotice?.resetEvidenceLessonIds).toEqual([]);
  });

  it("does not migrate a genuinely unreviewed/unmapped v3 lesson id into levels.a1.lessons", () => {
    const v3 = v3Fixture({
      lessons: { "some-genuinely-unknown-id": v3Lesson({ visitedAt: T0 }) },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["some-genuinely-unknown-id"]).toBeUndefined();
    expect(v4.levels.a1.orphanedLessonIds).toContain("some-genuinely-unknown-id");
  });

  it("orphans a mapped source lesson that carries real practiced/attempted evidence but never a recorded visit, instead of silently discarding it (Phase 2 Task 5 quality-review minor #6)", () => {
    // "sounds-1" is a safe, mapped source (A1_V3_LESSON_ID_MAP) that maps to
    // itself, but here it never actually has a visit — only stronger
    // evidence (practicedAt, attemptedExerciseIds) with `visitedAt: null`.
    // Nothing safely transfers to the destination (no visit ever happened),
    // so no `lessons["sounds-1"]` entry is created — but this source's real
    // evidence must not vanish with zero accounting, matching an unmapped
    // source id's orphan/recovery-data treatment.
    const v3 = v3Fixture({
      lessons: {
        "sounds-1": v3Lesson({
          visitedAt: null,
          practicedAt: T1,
          attemptedExerciseIds: ["sounds-1-x1"],
        }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-1"]).toBeUndefined();
    expect(v4.migrationNotice?.preservedVisitedLessonIds).not.toContain("sounds-1");
    expect(v4.migrationNotice?.resetEvidenceLessonIds).not.toContain("sounds-1");
    expect(v4.levels.a1.orphanedLessonIds).toContain("sounds-1");
  });

  it("does not orphan a mapped source lesson that has neither a visit nor any other evidence — a truly empty record is nothing to recover", () => {
    const v3 = v3Fixture({
      lessons: { "sounds-1": v3Lesson() },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-1"]).toBeUndefined();
    expect(v4.levels.a1.orphanedLessonIds).not.toContain("sounds-1");
  });

  it("orphans only the specific alias source with stray evidence when its sibling alias source has a genuine visit (sounds-5 evidence-only, sounds-4 visited)", () => {
    const v3 = v3Fixture({
      lessons: {
        "sounds-4": v3Lesson({ visitedAt: T0 }),
        "sounds-5": v3Lesson({
          visitedAt: null,
          consolidatedAt: T1,
          acceptedExerciseIds: ["sounds-5-x1"],
        }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    // sounds-4 still safely receives its own real visit...
    expect(v4.levels.a1.lessons["sounds-4"].visitedAt).toBe(T0);
    // ...and since a visit *did* land on the shared destination, sounds-5's
    // stronger evidence is correctly accounted for via resetEvidenceLessonIds
    // (the existing, already-correct branch) rather than orphaned twice.
    expect(v4.migrationNotice?.resetEvidenceLessonIds).toContain("sounds-4");
    expect(v4.levels.a1.orphanedLessonIds).not.toContain("sounds-5");
  });

  it.each([
    ["capstones-self-introduction", "capstones-1"],
    ["capstones-everyday-outing", "capstones-2"],
    ["capstones-travel-day", "capstones-3"],
  ])(
    "migrates the semantic-twin named v3 capstone %s to its matching v4 destination %s, preserving visitedAt and not orphaning it",
    (sourceId, destinationId) => {
      const v3 = v3Fixture({ lessons: { [sourceId]: v3Lesson({ visitedAt: T0 }) } });
      const v4 = migrateV3ToV4(v3);
      expect(v4.levels.a1.lessons[destinationId]).toEqual({
        visitedAt: T0,
        practicedAt: null,
        consolidatedAt: null,
        attemptedExerciseIds: [],
        acceptedExerciseIds: [],
      });
      expect(v4.levels.a1.lessons[sourceId]).toBeUndefined();
      expect(v4.levels.a1.orphanedLessonIds).not.toContain(sourceId);
      expect(v4.levels.a1.orphanedLessonIds).not.toContain(destinationId);
      expect(v4.migrationNotice?.preservedVisitedLessonIds).toContain(destinationId);
    },
  );

  it("flags a named v3 capstone's v4 destination in resetEvidenceLessonIds when stronger evidence was lost, and preserves its earliest visitedAt (self-introduction reset-evidence → capstones-1)", () => {
    const v3 = v3Fixture({
      lessons: {
        "capstones-self-introduction": v3Lesson({
          visitedAt: T0,
          practicedAt: T1,
          acceptedExerciseIds: ["capstones-self-introduction-x1"],
        }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["capstones-1"].visitedAt).toBe(T0);
    expect(v4.migrationNotice?.resetEvidenceLessonIds).toContain("capstones-1");
  });

  it("maps lastVisitedLessonId through the travel-day semantic-twin alias onto capstones-3", () => {
    const v4 = migrateV3ToV4(
      v3Fixture({ lastVisitedLessonId: "capstones-travel-day" }),
    );
    expect(v4.levels.a1.lastVisitedLessonId).toBe("capstones-3");
  });

  it("has no safe v4 twin for capstones-orientation (a capstone:false warm-up): it orphans instead of migrating, and never lands on capstones-4", () => {
    const v3 = v3Fixture({
      lessons: { "capstones-orientation": v3Lesson({ visitedAt: T0 }) },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["capstones-orientation"]).toBeUndefined();
    expect(v4.levels.a1.lessons["capstones-4"]).toBeUndefined();
    expect(v4.levels.a1.orphanedLessonIds).toEqual(["capstones-orientation"]);
    expect(v4.migrationNotice?.preservedVisitedLessonIds).not.toContain("capstones-orientation");
    expect(v4.migrationNotice?.preservedVisitedLessonIds).not.toContain("capstones-4");
  });

  it("preserves capstones-orientation's lastVisitedLessonId verbatim (unmapped, not aliased onto capstones-4 or any other id)", () => {
    const v4 = migrateV3ToV4(
      v3Fixture({ lastVisitedLessonId: "capstones-orientation" }),
    );
    expect(v4.levels.a1.lastVisitedLessonId).toBe("capstones-orientation");
  });

  it("never assigns capstones-4 any migrated visit, even when every named v3 capstone (including orientation) was visited", () => {
    const v3 = v3Fixture({
      lessons: {
        "capstones-orientation": v3Lesson({ visitedAt: T0 }),
        "capstones-self-introduction": v3Lesson({ visitedAt: T0 }),
        "capstones-everyday-outing": v3Lesson({ visitedAt: T0 }),
        "capstones-travel-day": v3Lesson({ visitedAt: T0 }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["capstones-4"]).toBeUndefined();
    expect(v4.migrationNotice?.preservedVisitedLessonIds).not.toContain("capstones-4");
    expect(v4.levels.a1.orphanedLessonIds).toEqual(["capstones-orientation"]);
  });

  it("aliases sounds-5 onto sounds-4, keeping the earliest visit when sounds-4 was visited first", () => {
    const v3 = v3Fixture({
      lessons: {
        "sounds-4": v3Lesson({ visitedAt: T0 }),
        "sounds-5": v3Lesson({ visitedAt: T1 }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-4"].visitedAt).toBe(T0);
    expect(v4.migrationNotice?.preservedVisitedLessonIds).toEqual(["sounds-4"]);
  });

  it("aliases sounds-5 onto sounds-4, keeping the earliest visit when sounds-5 was visited first", () => {
    const v3 = v3Fixture({
      lessons: {
        "sounds-4": v3Lesson({ visitedAt: T1 }),
        "sounds-5": v3Lesson({ visitedAt: T0 }),
      },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-4"].visitedAt).toBe(T0);
  });

  it("dedupes duplicate destinations deterministically regardless of which duplicate is present", () => {
    // Only sounds-5 visited (sounds-4 never visited directly): still lands on
    // the sounds-4 destination because the alias always maps forward.
    const v3 = v3Fixture({ lessons: { "sounds-5": v3Lesson({ visitedAt: T0 }) } });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.lessons["sounds-4"]).toEqual({
      visitedAt: T0,
      practicedAt: null,
      consolidatedAt: null,
      attemptedExerciseIds: [],
      acceptedExerciseIds: [],
    });
    expect(v4.levels.a1.lessons["sounds-5"]).toBeUndefined();
  });

  it("turns an unknown v3 lesson id into an A1 orphan", () => {
    const v3 = v3Fixture({
      lessons: { "some-genuinely-unknown-id": v3Lesson({ visitedAt: T0 }) },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.orphanedLessonIds).toEqual(["some-genuinely-unknown-id"]);
    expect(v4.levels.a1.lessons["some-genuinely-unknown-id"]).toBeUndefined();
  });

  it("carries forward pre-existing v3 orphans alongside newly discovered ones, deduplicated", () => {
    const v3 = v3Fixture({
      orphanedLessonIds: ["already-orphaned", "dup"],
      lessons: { dup: v3Lesson({ visitedAt: T0 }), fresh: v3Lesson({ visitedAt: T0 }) },
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.orphanedLessonIds).toEqual(["already-orphaned", "dup", "fresh"]);
  });

  it("produces a completely empty A2 level", () => {
    const v4 = migrateV3ToV4(v3Fixture({ lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) } }));
    expect(v4.levels.a2).toEqual(emptyLevelProgress());
  });

  it("clears the review queue and orphaned review keys entirely", () => {
    const v3 = v3Fixture({
      reviewQueue: [
        {
          reviewKey: "sounds-1:sounds-1-x1",
          lessonId: "sounds-1",
          exerciseDefinitionId: "sounds-1-x1",
          targetConceptIds: [],
          targetLexemeIds: [],
          mistakeCount: 1,
          lastMistakeAt: T0,
        },
      ],
      orphanedReviewKeys: ["ghost:ghost"],
    });
    const v4 = migrateV3ToV4(v3);
    expect(v4.levels.a1.reviewQueue).toEqual([]);
    expect(v4.levels.a1.orphanedReviewKeys).toEqual([]);
  });

  it("maps lastVisitedLessonId through the alias", () => {
    const v4 = migrateV3ToV4(v3Fixture({ lastVisitedLessonId: "sounds-5" }));
    expect(v4.levels.a1.lastVisitedLessonId).toBe("sounds-4");
  });

  it("preserves an opaque/unmapped lastVisitedLessonId verbatim", () => {
    const v4 = migrateV3ToV4(v3Fixture({ lastVisitedLessonId: "some-legacy-opaque-id" }));
    expect(v4.levels.a1.lastVisitedLessonId).toBe("some-legacy-opaque-id");
  });

  it("preserves a null lastVisitedLessonId", () => {
    const v4 = migrateV3ToV4(v3Fixture({ lastVisitedLessonId: null }));
    expect(v4.levels.a1.lastVisitedLessonId).toBeNull();
  });

  it("uses the source updatedAt verbatim, never a freshly stamped Date", () => {
    const v4 = migrateV3ToV4(v3Fixture({ updatedAt: "2020-01-01T00:00:00.000Z" }));
    expect(v4.updatedAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("starts migrationNotice.acknowledgedAt as null", () => {
    const v4 = migrateV3ToV4(v3Fixture());
    expect(v4.migrationNotice?.acknowledgedAt).toBeNull();
    expect(v4.migrationNotice?.fromSchemaVersion).toBe(3);
  });

  it("is a pure function: never mutates its input", () => {
    const v3 = v3Fixture({
      lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) },
      orphanedLessonIds: ["legacy"],
    });
    const snapshot = JSON.parse(JSON.stringify(v3));
    migrateV3ToV4(v3);
    expect(v3).toEqual(snapshot);
  });

  it("is deterministic/idempotent: migrating the same v3 payload twice yields equal (by value) results", () => {
    const v3 = v3Fixture({
      lessons: {
        "sounds-1": v3Lesson({ visitedAt: T0 }),
        "sounds-5": v3Lesson({ visitedAt: T1 }),
        "unknown-x": v3Lesson({ visitedAt: T0 }),
      },
      orphanedLessonIds: ["legacy"],
    });
    expect(migrateV3ToV4(v3)).toEqual(migrateV3ToV4(v3));
  });
});

describe("v4 catalog v1/v2 → v3 normalization", () => {
  function v1Fixture(): StoredCourseProgressV4 {
    const currentA1ExerciseIds = exerciseIds("introductions-1");
    const currentPhoneticExerciseIds = exerciseIds("sounds-1");
    const currentA2ExerciseIds = exerciseIds("connected-conversation-1");
    const removedSemanticDefinitionId = "introductions-1-round-1-8";
    const removedPhoneticDefinitionId = "snd1-sushi-ex";

    expect(currentA1ExerciseIds).toHaveLength(4);
    expect(currentPhoneticExerciseIds).toHaveLength(4);
    expect(currentA2ExerciseIds.length).toBeGreaterThan(0);
    expect(currentA1ExerciseIds).not.toContain(removedSemanticDefinitionId);
    expect(currentPhoneticExerciseIds).not.toContain(removedPhoneticDefinitionId);

    const knownA1Review = reviewEntry(
      "introductions-1",
      currentA1ExerciseIds[0]!,
      T1,
    );
    const removedSemanticReview = reviewEntry(
      "introductions-1",
      removedSemanticDefinitionId,
      T2,
    );
    const removedPhoneticReview = reviewEntry(
      "sounds-1",
      removedPhoneticDefinitionId,
      T2,
    );
    const knownA2Review = reviewEntry(
      "connected-conversation-1",
      currentA2ExerciseIds[0]!,
      T2,
    );

    return {
      schemaVersion: 4,
      catalogVersion: "a1-a2-v1",
      levels: {
        a1: {
          lessons: {
            "introductions-1": {
              visitedAt: T0,
              practicedAt: T1,
              consolidatedAt: T2,
              attemptedExerciseIds: [
                ...currentA1ExerciseIds,
                removedSemanticDefinitionId,
              ],
              acceptedExerciseIds: [
                ...currentA1ExerciseIds,
                removedSemanticDefinitionId,
              ],
            },
            "sounds-1": {
              visitedAt: T0,
              practicedAt: T1,
              consolidatedAt: T2,
              attemptedExerciseIds: [
                currentPhoneticExerciseIds[0]!,
                removedPhoneticDefinitionId,
              ],
              acceptedExerciseIds: [
                currentPhoneticExerciseIds[0]!,
                removedPhoneticDefinitionId,
              ],
            },
            "missing-a1-lesson": {
              visitedAt: T0,
              practicedAt: T1,
              consolidatedAt: T2,
              attemptedExerciseIds: ["missing-a1-definition"],
              acceptedExerciseIds: ["missing-a1-definition"],
            },
          },
          canDos: {
            "a1-can-do-identity": {
              canDoId: "a1-can-do-identity",
              visitedLessonIds: ["introductions-1"],
              practicedLessonIds: ["introductions-1"],
              acceptedTransferExerciseIds: [currentA1ExerciseIds[3]!],
              checkpointAttemptIds: ["a1-existing-attempt"],
              lastUpdatedAt: T2,
            },
          },
          checkpointAttempts: [
            {
              id: "a1-existing-attempt",
              checkpointId: "a1-checkpoint",
              attemptedAt: T2,
              acceptedExerciseIds: [...currentA1ExerciseIds],
              sampledCanDoIds: ["a1-can-do-identity"],
            },
          ],
          lastVisitedLessonId: "introductions-1",
          reviewQueue: [
            knownA1Review,
            removedSemanticReview,
            removedPhoneticReview,
          ],
          orphanedLessonIds: ["existing-a1-orphan"],
          orphanedReviewKeys: ["existing-a1-review-orphan"],
        },
        a2: {
          lessons: {
            "connected-conversation-1": {
              visitedAt: T0,
              practicedAt: T1,
              consolidatedAt: T2,
              attemptedExerciseIds: [...currentA2ExerciseIds],
              acceptedExerciseIds: [...currentA2ExerciseIds],
            },
          },
          canDos: {
            "a2-can-do-connected-conversation": {
              canDoId: "a2-can-do-connected-conversation",
              visitedLessonIds: ["connected-conversation-1"],
              practicedLessonIds: ["connected-conversation-1"],
              acceptedTransferExerciseIds: [currentA2ExerciseIds.at(-1)!],
              checkpointAttemptIds: ["a2-existing-attempt"],
              lastUpdatedAt: T2,
            },
          },
          checkpointAttempts: [
            {
              id: "a2-existing-attempt",
              checkpointId: "a2-checkpoint",
              attemptedAt: T2,
              acceptedExerciseIds: [...currentA2ExerciseIds],
              sampledCanDoIds: ["a2-can-do-connected-conversation"],
            },
          ],
          lastVisitedLessonId: "connected-conversation-1",
          reviewQueue: [knownA2Review],
          orphanedLessonIds: ["existing-a2-orphan"],
          orphanedReviewKeys: ["existing-a2-review-orphan"],
        },
      },
      migrationNotice: {
        fromSchemaVersion: 3,
        preservedVisitedLessonIds: ["sounds-1"],
        resetEvidenceLessonIds: ["sounds-1"],
        acknowledgedAt: T1,
      },
      updatedAt: T2,
    };
  }

  it("updates a legacy catalog without discarding lesson, Can-do, checkpoint, or A2 evidence", () => {
    const source = v1Fixture();
    const before = JSON.parse(JSON.stringify(source));
    const current = currentCatalogSets();
    const migrated = migrateV4Catalog(
      source,
      current.knownReviewKeysByLevel,
      current.knownLessonIdsByLevel,
    );

    expect(migrated.catalogVersion).toBe("a1-a2-v3");
    expect(migrated.updatedAt).toBe(source.updatedAt);
    expect(migrated.migrationNotice).toEqual(source.migrationNotice);
    expect(migrated.levels.a1.lessons).toEqual(source.levels.a1.lessons);
    expect(migrated.levels.a2.lessons).toEqual(source.levels.a2.lessons);
    expect(migrated.levels.a1.canDos).toEqual(source.levels.a1.canDos);
    expect(migrated.levels.a2.canDos).toEqual(source.levels.a2.canDos);
    expect(migrated.levels.a1.checkpointAttempts).toEqual(
      source.levels.a1.checkpointAttempts,
    );
    expect(migrated.levels.a2.checkpointAttempts).toEqual(
      source.levels.a2.checkpointAttempts,
    );
    expect(migrated.levels.a1.lastVisitedLessonId).toBe(
      source.levels.a1.lastVisitedLessonId,
    );
    expect(migrated.levels.a2.lastVisitedLessonId).toBe(
      source.levels.a2.lastVisitedLessonId,
    );
    expect(migrated.levels.a1.orphanedLessonIds).toEqual([
      "existing-a1-orphan",
      "missing-a1-lesson",
    ]);
    expect(migrated.levels.a2.orphanedLessonIds).toEqual(
      source.levels.a2.orphanedLessonIds,
    );
    expect(migrated.levels.a1.reviewQueue).toEqual([
      source.levels.a1.reviewQueue[0],
    ]);
    expect(migrated.levels.a2.reviewQueue).toEqual(source.levels.a2.reviewQueue);
    expect(migrated.levels.a1.orphanedReviewKeys).toEqual([
      "existing-a1-review-orphan",
      source.levels.a1.reviewQueue[1]!.reviewKey,
      source.levels.a1.reviewQueue[2]!.reviewKey,
    ]);
    expect(migrated.levels.a2.orphanedReviewKeys).toEqual(
      source.levels.a2.orphanedReviewKeys,
    );
    expect(source).toEqual(before);
  });

  it("migrates a realistic v2 catalog to v3 without resetting evidence, while reconciling only removed active reviews", () => {
    const source = {
      ...v1Fixture(),
      catalogVersion: "a1-a2-v2" as const,
    };
    const before = JSON.parse(JSON.stringify(source));
    const current = currentCatalogSets();

    const migrated = migrateV4Catalog(
      source,
      current.knownReviewKeysByLevel,
      current.knownLessonIdsByLevel,
    );

    expect(migrated.catalogVersion).toBe("a1-a2-v3");
    expect(migrated.updatedAt).toBe(source.updatedAt);
    expect(migrated.migrationNotice).toEqual(source.migrationNotice);
    expect(migrated.levels.a1.lessons).toEqual(source.levels.a1.lessons);
    expect(migrated.levels.a2).toEqual(source.levels.a2);
    expect(migrated.levels.a1.canDos).toEqual(source.levels.a1.canDos);
    expect(migrated.levels.a1.checkpointAttempts).toEqual(
      source.levels.a1.checkpointAttempts,
    );
    expect(migrated.levels.a1.lastVisitedLessonId).toBe(
      source.levels.a1.lastVisitedLessonId,
    );
    expect(migrated.levels.a1.reviewQueue).toEqual([
      source.levels.a1.reviewQueue[0],
    ]);
    expect(migrated.levels.a1.orphanedLessonIds).toEqual([
      "existing-a1-orphan",
      "missing-a1-lesson",
    ]);
    expect(migrated.levels.a1.orphanedReviewKeys).toEqual([
      "existing-a1-review-orphan",
      source.levels.a1.reviewQueue[1]!.reviewKey,
      source.levels.a1.reviewQueue[2]!.reviewKey,
    ]);
    for (const module of courseModulesByLevel.a1.filter(
      (courseModule) => courseModule.areaId === "foundations",
    )) {
      for (const lesson of module.lessons) {
        expect(migrated.levels.a1.lessons[lesson.id], lesson.id).toBeUndefined();
      }
    }
    expect(source).toEqual(before);

    const repeated = migrateV4Catalog(
      source,
      current.knownReviewKeysByLevel,
      current.knownLessonIdsByLevel,
    );
    expect(repeated).toEqual(migrated);
  });

  it("deduplicates legacy orphan ledgers in encounter order while retaining unknown lesson evidence", () => {
    const legacy = v1Fixture();
    const source = {
      ...legacy,
      catalogVersion: "a1-a2-v2" as const,
      levels: {
        ...legacy.levels,
        a1: {
          ...legacy.levels.a1,
          orphanedLessonIds: [
            "existing-a1-orphan",
            "existing-a1-orphan",
            "missing-a1-lesson",
          ],
          orphanedReviewKeys: [
            "existing-a1-review-orphan",
            "existing-a1-review-orphan",
          ],
        },
      },
    };
    const current = currentCatalogSets();

    const migrated = migrateV4Catalog(
      source,
      current.knownReviewKeysByLevel,
      current.knownLessonIdsByLevel,
    );

    expect(migrated.levels.a1.lessons["missing-a1-lesson"]).toEqual(
      source.levels.a1.lessons["missing-a1-lesson"],
    );
    expect(migrated.levels.a1.orphanedLessonIds).toEqual([
      "existing-a1-orphan",
      "missing-a1-lesson",
    ]);
    expect(migrated.levels.a1.orphanedReviewKeys).toEqual([
      "existing-a1-review-orphan",
      source.levels.a1.reviewQueue[1]!.reviewKey,
      source.levels.a1.reviewQueue[2]!.reviewKey,
    ]);
  });

  it("accepts catalog v2 through parseProgress into V5 while keeping V4 catalog normalization reference-stable", () => {
    const legacy = {
      ...v1Fixture(),
      catalogVersion: "a1-a2-v2" as const,
    };
    const current = currentCatalogSets();
    const parsed = parseProgress(
      JSON.stringify(legacy),
      current.knownLessonIdsByLevel.a1,
      current.knownReviewKeysByLevel,
      current.knownLessonIdsByLevel,
    );

    expect(parsed).toMatchObject({
      corrupted: false,
      migrated: true,
      progress: { catalogVersion: "base-a1-a2-v1", schemaVersion: 5 },
    });

    const currentV3 = emptyProgressV4();
    expect(
      migrateV4Catalog(
        currentV3,
        current.knownReviewKeysByLevel,
        current.knownLessonIdsByLevel,
      ),
    ).toBe(currentV3);
  });

  it("is deterministic and returns the same current-v3 reference when reconciliation has nothing to change", () => {
    const source = v1Fixture();
    const current = currentCatalogSets();
    const once = migrateV4Catalog(
      source,
      current.knownReviewKeysByLevel,
      current.knownLessonIdsByLevel,
    );
    const twice = migrateV4Catalog(
      source,
      current.knownReviewKeysByLevel,
      current.knownLessonIdsByLevel,
    );
    expect(twice).toEqual(once);
    expect(
      migrateV4Catalog(
        once,
        current.knownReviewKeysByLevel,
        current.knownLessonIdsByLevel,
      ),
    ).toBe(once);
  });

  it("normalizes a valid V4 catalog-v1 payload through V5 parsing and rejects an unknown future catalog revision", () => {
    const source = v1Fixture();
    const current = currentCatalogSets();
    const parsed = parseProgress(
      JSON.stringify(source),
      current.knownLessonIdsByLevel.a1,
      current.knownReviewKeysByLevel,
      current.knownLessonIdsByLevel,
    );

    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.catalogVersion).toBe("base-a1-a2-v1");
    expect(parsed.progress.levels.a1.orphanedReviewKeys).toContain(
      source.levels.a1.reviewQueue[1]!.reviewKey,
    );
    expect(
      parseProgress(
        JSON.stringify({ ...source, catalogVersion: "a1-a2-v99" }),
      ),
    ).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });
});

describe("parseProgress → CourseProgressV5", () => {
  it("treats null storage content as empty V5 progress", () => {
    expect(parseProgress(null)).toEqual({
      progress: emptyProgressV5(),
      corrupted: false,
      migrated: false,
    });
  });

  it("migrates a valid V4 payload losslessly into V5", () => {
    const progress = emptyProgressV4();
    const raw = JSON.stringify(progress);
    const parsed = parseProgress(raw);
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress).toEqual(migrateV4ToV5(progress));
  });

  it("migrates a valid V3 payload through V4 into V5", () => {
    const v3 = v3Fixture({ lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) } });
    const parsed = parseProgress(JSON.stringify(v3));
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress).toEqual(migrateV4ToV5(migrateV3ToV4(v3)));
  });

  it("migrates a valid v2 payload all the way through V3/V4 into V5", () => {
    const parsed = parseProgress(
      JSON.stringify({
        schemaVersion: 2,
        visitedLessonIds: ["sounds-1"],
        lastVisitedLessonId: "sounds-1",
        updatedAt: T0,
      }),
      new Set(["sounds-1"]),
    );
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.schemaVersion).toBe(5);
    expect(parsed.progress.levels.a0.lessons["sounds-1"].visitedAt).toBe(T0);
    expect(parsed.progress.levels.a0.lastVisitedLessonId).toBe("sounds-1");
  });

  it("migrates a valid v1 payload all the way through V3/V4 into V5", () => {
    const parsed = parseProgress(
      JSON.stringify({
        schemaVersion: 1,
        completedLessonIds: ["sounds-1"],
        lastVisitedLessonId: "sounds-1",
        updatedAt: T0,
      }),
      new Set(["sounds-1"]),
    );
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress.schemaVersion).toBe(5);
    expect(parsed.progress.levels.a0.lessons["sounds-1"].visitedAt).toBe(T0);
  });

  describe("migration notice conditions across v1/v2/v3 (Phase 2 Task 5 quality-review Important fix)", () => {
    // Grounds *why* the static notice/help copy must never assert a reset or
    // an orphan as a guaranteed fact: every one of these real, valid
    // migration inputs produces a shown notice (`migrated: true`) with an
    // empty `resetEvidenceLessonIds` and an empty `orphanedLessonIds` — the
    // copy is shown to these users too, and nothing was actually reset or
    // orphaned for them.
    it("shows a migration notice with no reset/orphan evidence for a v1 payload (v1 never had practice/checkpoint evidence to lose)", () => {
      const parsed = parseProgress(
        JSON.stringify({
          schemaVersion: 1,
          completedLessonIds: ["sounds-1"],
          lastVisitedLessonId: "sounds-1",
          updatedAt: T0,
        }),
        new Set(["sounds-1"]),
      );
      expect(parsed.migrated).toBe(true);
      expect(parsed.progress.migrationNotice).not.toBeNull();
      expect(parsed.progress.migrationNotice?.priorNotice?.resetEvidenceLessonIds).toEqual([]);
      expect(parsed.progress.levels.a1.orphanedLessonIds).toEqual([]);
    });

    it("shows a migration notice with no reset/orphan evidence for a v2 payload (v2 never had practice/checkpoint evidence to lose)", () => {
      const parsed = parseProgress(
        JSON.stringify({
          schemaVersion: 2,
          visitedLessonIds: ["sounds-1"],
          lastVisitedLessonId: "sounds-1",
          updatedAt: T0,
        }),
        new Set(["sounds-1"]),
      );
      expect(parsed.migrated).toBe(true);
      expect(parsed.progress.migrationNotice).not.toBeNull();
      expect(parsed.progress.migrationNotice?.priorNotice?.resetEvidenceLessonIds).toEqual([]);
      expect(parsed.progress.levels.a1.orphanedLessonIds).toEqual([]);
    });

    it("shows a migration notice with no reset/orphan evidence for a visited-only v3 payload (nothing to reset, nothing unmapped to orphan)", () => {
      const v3 = v3Fixture({
        lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) },
      });
      const parsed = parseProgress(JSON.stringify(v3));
      expect(parsed.migrated).toBe(true);
      expect(parsed.progress.migrationNotice).not.toBeNull();
      expect(parsed.progress.migrationNotice?.priorNotice?.resetEvidenceLessonIds).toEqual([]);
      expect(parsed.progress.levels.a1.orphanedLessonIds).toEqual([]);
    });
  });

  it("rejects malformed JSON as corrupted", () => {
    expect(parseProgress("{bad")).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });

  it("rejects a future/unknown schema version (6) without throwing", () => {
    expect(parseProgress(JSON.stringify({ schemaVersion: 6 }))).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });

  it("rejects a malformed v4 shape (wrong number of levels) as corrupted", () => {
    const malformed = { ...emptyProgressV4(), levels: { a1: emptyLevelProgress() } };
    expect(parseProgress(JSON.stringify(malformed))).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });

  it("rejects a v4 payload with migrationNotice entirely omitted as corrupted, never passing it through with migrationNotice silently undefined (Phase 2 Task 5 quality-review minor #2)", () => {
    // A truly valid V4 payload must explicitly carry `migrationNotice` as
    // either `null` or a valid record. A payload missing the field entirely
    // is corrupt/invalid — it must never be treated as valid-and-passed-
    // through, because that would return a `CourseProgressV4` whose
    // `migrationNotice` is `undefined`, violating the `| null` type contract.
    const { migrationNotice: _omitted, ...withoutMigrationNotice } = emptyProgressV4();
    const parsed = parseProgress(JSON.stringify(withoutMigrationNotice));
    expect(parsed.corrupted).toBe(true);
    expect(parsed.migrated).toBe(false);
    expect(parsed.progress).toEqual(emptyProgressV5());
    expect(parsed.progress.migrationNotice).not.toBeUndefined();
  });

  it("migrates a valid V4 payload whose migrationNotice is explicitly null", () => {
    const progress = { ...emptyProgressV4(), migrationNotice: null };
    const parsed = parseProgress(JSON.stringify(progress));
    expect(parsed.corrupted).toBe(false);
    expect(parsed.migrated).toBe(true);
    expect(parsed.progress).toEqual(migrateV4ToV5(progress));
  });

  it("rejects an invalid timestamp type in v4 as corrupted", () => {
    const malformed = { ...emptyProgressV4(), updatedAt: 12345 };
    expect(parseProgress(JSON.stringify(malformed))).toEqual({
      progress: emptyProgressV5(),
      corrupted: true,
      migrated: false,
    });
  });

  it("rejects an invalid timestamp type inside a level's lesson evidence as corrupted", () => {
    const malformed = {
      ...emptyProgressV4(),
      levels: {
        a1: { ...emptyLevelProgress(), lessons: { "sounds-1": { ...v3Lesson(), visitedAt: 42 } } },
        a2: emptyLevelProgress(),
      },
    };
    expect(parseProgress(JSON.stringify(malformed)).corrupted).toBe(true);
  });

  it("does not corrupt on extra/unknown lesson ids embedded directly in a valid v4 payload", () => {
    const withExtra: CourseProgressV4 = {
      ...emptyProgressV4(),
      levels: {
        a1: { ...emptyLevelProgress(), orphanedLessonIds: ["some-unknown-id"] },
        a2: emptyLevelProgress(),
      },
    };
    const parsed = parseProgress(JSON.stringify(withExtra));
    expect(parsed.corrupted).toBe(false);
    expect(parsed.progress.levels.a1.orphanedLessonIds).toEqual(["some-unknown-id"]);
  });
});

describe("recordCanDoEvidence", () => {
  it("records the first piece of evidence for a Can-do", () => {
    const level = emptyLevelProgress();
    const next = recordCanDoEvidence(level, {
      canDoId: "cd-greet",
      visitedLessonId: "introductions-1",
      at: T0,
    });
    expect(next.canDos["cd-greet"]).toEqual({
      canDoId: "cd-greet",
      visitedLessonIds: ["introductions-1"],
      practicedLessonIds: [],
      acceptedTransferExerciseIds: [],
      checkpointAttemptIds: [],
      lastUpdatedAt: T0,
    });
  });

  it("accumulates evidence across calls, deduplicated in encounter order", () => {
    let level = emptyLevelProgress();
    level = recordCanDoEvidence(level, { canDoId: "cd-greet", visitedLessonId: "introductions-1", at: T0 });
    level = recordCanDoEvidence(level, { canDoId: "cd-greet", practicedLessonId: "introductions-1", at: T1 });
    level = recordCanDoEvidence(level, {
      canDoId: "cd-greet",
      acceptedTransferExerciseId: "cd-greet-transfer-1",
      at: T2,
    });
    const evidence = level.canDos["cd-greet"];
    expect(evidence.visitedLessonIds).toEqual(["introductions-1"]);
    expect(evidence.practicedLessonIds).toEqual(["introductions-1"]);
    expect(evidence.acceptedTransferExerciseIds).toEqual(["cd-greet-transfer-1"]);
    expect(evidence.lastUpdatedAt).toBe(T2);
  });

  it("is idempotent by reference when nothing new is recorded", () => {
    const first = recordCanDoEvidence(emptyLevelProgress(), {
      canDoId: "cd-greet",
      visitedLessonId: "introductions-1",
      at: T0,
    });
    const again = recordCanDoEvidence(first, {
      canDoId: "cd-greet",
      visitedLessonId: "introductions-1",
      at: T1,
    });
    expect(again).toBe(first);
  });

  it("never invents a pass/fail verdict — evidence is only observational id lists", () => {
    const level = recordCanDoEvidence(emptyLevelProgress(), {
      canDoId: "cd-greet",
      checkpointAttemptId: "attempt-1",
      at: T0,
    });
    expect(Object.keys(level.canDos["cd-greet"]).sort()).toEqual([
      "acceptedTransferExerciseIds",
      "canDoId",
      "checkpointAttemptIds",
      "lastUpdatedAt",
      "practicedLessonIds",
      "visitedLessonIds",
    ]);
  });
});

describe("recordCheckpointAttempt", () => {
  function attempt(overrides: Partial<CheckpointAttempt> = {}): CheckpointAttempt {
    return {
      id: "attempt-1",
      checkpointId: "checkpoint-a1-1",
      attemptedAt: T0,
      acceptedExerciseIds: ["ex-1", "ex-2"],
      sampledCanDoIds: ["cd-greet"],
      ...overrides,
    };
  }

  it("appends a new checkpoint attempt", () => {
    const level = recordCheckpointAttempt(emptyLevelProgress(), attempt());
    expect(level.checkpointAttempts).toEqual([attempt()]);
  });

  it("is idempotent by attempt id: recording the same id twice is a no-op", () => {
    const first = recordCheckpointAttempt(emptyLevelProgress(), attempt());
    const again = recordCheckpointAttempt(first, attempt({ attemptedAt: T1 }));
    expect(again).toBe(first);
  });

  it("accumulates distinct attempt ids in order", () => {
    let level = recordCheckpointAttempt(emptyLevelProgress(), attempt({ id: "attempt-1" }));
    level = recordCheckpointAttempt(level, attempt({ id: "attempt-2" }));
    expect(level.checkpointAttempts.map((a) => a.id)).toEqual(["attempt-1", "attempt-2"]);
  });
});

describe("clearLevel / clearAll", () => {
  function nonEmptyProgress(): CourseProgressV4 {
    const a1: LevelProgress = {
      ...emptyLevelProgress(),
      lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) },
      lastVisitedLessonId: "sounds-1",
    };
    return { ...emptyProgressV4(), levels: { a1, a2: emptyLevelProgress() }, updatedAt: T0 };
  }

  it("clears only the targeted level, leaving the other level untouched", () => {
    const progress = nonEmptyProgress();
    const cleared = clearLevel(progress, "a1", T1);
    expect(cleared.levels.a1).toEqual(emptyLevelProgress());
    expect(cleared.levels.a2).toEqual(progress.levels.a2);
    expect(cleared.updatedAt).toBe(T1);
  });

  it("never touches the migrationNotice when clearing a level", () => {
    const progress: CourseProgressV4 = {
      ...nonEmptyProgress(),
      migrationNotice: {
        fromSchemaVersion: 3,
        preservedVisitedLessonIds: ["sounds-1"],
        resetEvidenceLessonIds: [],
        acknowledgedAt: null,
      },
    };
    const cleared = clearLevel(progress, "a1", T1);
    expect(cleared.migrationNotice).toEqual(progress.migrationNotice);
  });

  it("is a no-op (same reference) when the level is already empty", () => {
    const progress = emptyProgressV4();
    expect(clearLevel(progress, "a1", T1)).toBe(progress);
  });

  it("clears both levels entirely", () => {
    const progress = nonEmptyProgress();
    const cleared = clearAll(T1);
    expect(cleared.levels.a1).toEqual(emptyLevelProgress());
    expect(cleared.levels.a2).toEqual(emptyLevelProgress());
    expect(cleared.updatedAt).toBe(T1);
    expect(cleared).not.toBe(progress);
  });
});

describe("acknowledgeMigrationNotice", () => {
  it("stamps acknowledgedAt without deleting the migration record", () => {
    const migrated = migrateV3ToV4(v3Fixture({ lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) } }));
    const acknowledged = acknowledgeMigrationNotice(migrated, T1);
    expect(acknowledged.migrationNotice?.acknowledgedAt).toBe(T1);
    expect(acknowledged.migrationNotice?.preservedVisitedLessonIds).toEqual(
      migrated.migrationNotice?.preservedVisitedLessonIds,
    );
  });

  it("is a no-op when there is no migration notice", () => {
    const progress = emptyProgressV4();
    expect(acknowledgeMigrationNotice(progress, T1)).toBe(progress);
  });

  it("is a no-op when the notice is already acknowledged", () => {
    const migrated = migrateV3ToV4(v3Fixture());
    const once = acknowledgeMigrationNotice(migrated, T1);
    const twice = acknowledgeMigrationNotice(once, T2);
    expect(twice).toBe(once);
  });
});

describe("visitedLessonIdsForLevel / summarizeLevel", () => {
  const outline: ModuleOutline[] = [
    { id: "m1", prerequisiteIds: [], lessons: [{ id: "sounds-1" }, { id: "sounds-2" }] },
  ];

  it("projects only visited lesson ids for a level", () => {
    const level: LevelProgress = {
      ...emptyLevelProgress(),
      lessons: {
        "sounds-1": v3Lesson({ visitedAt: T0 }),
        "sounds-2": v3Lesson({ visitedAt: null }),
      },
    };
    expect(visitedLessonIdsForLevel(level)).toEqual(["sounds-1"]);
  });

  it("summarizes one level independently of the other level's evidence", () => {
    const a1: LevelProgress = {
      ...emptyLevelProgress(),
      lessons: { "sounds-1": v3Lesson({ visitedAt: T0 }) },
      lastVisitedLessonId: "sounds-1",
    };
    const a2: LevelProgress = {
      ...emptyLevelProgress(),
      lessons: { "sounds-2": v3Lesson({ visitedAt: T0 }) },
      lastVisitedLessonId: "sounds-2",
    };
    const progress: CourseProgressV4 = { ...emptyProgressV4(), levels: { a1, a2 } };

    const a1Summary = summarizeLevel(progress, "a1", outline);
    expect(a1Summary.visitedLessonCount).toBe(1);
    expect(a1Summary.totalLessonCount).toBe(2);
    expect(a1Summary.visitedPercent).toBe(50);

    const a2Summary = summarizeLevel(progress, "a2", outline);
    expect(a2Summary.visitedLessonCount).toBe(1);
    // A2's evidence must never be inflated/deflated by A1's — same outline,
    // independently computed from a2's own lessons only.
    expect(a2Summary.recommendedContinuationLessonId).not.toBe(
      a1Summary.recommendedContinuationLessonId,
    );
  });
});
