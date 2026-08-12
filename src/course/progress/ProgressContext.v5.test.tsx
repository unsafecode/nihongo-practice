/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import {
  ProgressProvider,
  LEVEL_RUNTIME,
  STORAGE_KEY,
  loadProgress,
  prepareProgress,
  runtimeForLesson,
  useProgress,
  type ProgressContextValue,
} from "./ProgressContext";
import { emptyProgressV4 } from "./progress";
import { currentLessonRouteRegistry } from "../levels/ownership";
import { getLessonExercises } from "../components/lessonExerciseModel";
import { V4_ACTIVITY_MIGRATION_MAP } from "../base/migration/v4ActivityMap";
import { a1Checkpoint } from "../a1/catalog/checkpoint";
import { A1_LESSON_IDS } from "../a1/manifest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LEGACY_LOAD_UPDATED_AT = "2026-08-06T08:15:00.000Z";

function memoryStorage(): { storage: Storage; value: (key: string) => string | null } {
  const values = new Map<string, string>();
  return {
    storage: {
      get length() {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      key: (index) => [...values.keys()][index] ?? null,
      removeItem: (key) => {
        values.delete(key);
      },
      setItem: (key, value) => {
        values.set(key, value);
      },
    },
    value: (key) => values.get(key) ?? null,
  };
}

function Consumer({ onValue }: { onValue: (value: ProgressContextValue) => void }) {
  const value = useProgress();
  onValue(value);
  return value.mutationError
    ? createElement(
        "p",
        { role: "alert", "data-error-code": value.mutationError.code },
        value.mutationError.lessonId,
      )
    : null;
}

function assertLegacyLoadPreservesBaseAndA1Visits(progress: ReturnType<typeof loadProgress>["progress"]) {
  expect(progress.updatedAt).toBe(LEGACY_LOAD_UPDATED_AT);
  expect(progress.levels.a0.lessons["sounds-1"]).toEqual({
    visitedAt: LEGACY_LOAD_UPDATED_AT,
    practicedAt: null,
    consolidatedAt: null,
    attemptedExerciseIds: [],
    acceptedExerciseIds: [],
  });
  expect(progress.levels.a1.lessons["introductions-1"]).toEqual({
    visitedAt: LEGACY_LOAD_UPDATED_AT,
    practicedAt: null,
    consolidatedAt: null,
    attemptedExerciseIds: [],
    acceptedExerciseIds: [],
  });
  expect(progress.levels.a0.lastVisitedLessonId).toBe("sounds-1");
  expect(progress.migrationNotice?.resumeLevel).toBe("a0");

  for (const level of ["a0", "a1", "a2"] as const) {
    expect(progress.levels[level].orphanedLessonIds).not.toContain("sounds-1");
    expect(progress.levels[level].orphanedLessonIds).not.toContain("introductions-1");
    expect(progress.levels[level].orphanedLessonRecords["sounds-1"]).toBeUndefined();
    expect(progress.levels[level].orphanedLessonRecords["introductions-1"]).toBeUndefined();
  }

  expect(progress.levels.a1.orphanedLessonIds).not.toContain("sounds-5");
  expect(progress.levels.a1.lessons["sounds-5"]).toBeUndefined();
  expect(progress.levels.a0.lessons["sounds-4"]).toEqual({
    visitedAt: LEGACY_LOAD_UPDATED_AT,
    practicedAt: null,
    consolidatedAt: null,
    attemptedExerciseIds: [],
    acceptedExerciseIds: [],
  });
}

describe("ProgressContext V5 legacy load migration", () => {
  it.each([
    [
      "V1",
      {
        schemaVersion: 1,
        completedLessonIds: ["sounds-1", "introductions-1", "sounds-5"],
        lastVisitedLessonId: "sounds-1",
        updatedAt: LEGACY_LOAD_UPDATED_AT,
      },
    ],
    [
      "V2",
      {
        schemaVersion: 2,
        visitedLessonIds: ["sounds-1", "introductions-1", "sounds-5"],
        lastVisitedLessonId: "sounds-1",
        updatedAt: LEGACY_LOAD_UPDATED_AT,
      },
    ],
  ] as const)("preserves pre-split Base and retained A1 visits from %s payloads", (_, payload) => {
    const preparedStore = memoryStorage();
    preparedStore.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    const prepared = prepareProgress(preparedStore.storage);
    expect(prepared.corrupted).toBe(false);
    expect(prepared.migrated).toBe(true);
    assertLegacyLoadPreservesBaseAndA1Visits(prepared.progress);
    expect(JSON.parse(preparedStore.value(STORAGE_KEY) ?? "null")).toEqual(payload);

    const loadStore = memoryStorage();
    loadStore.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    const loaded = loadProgress(loadStore.storage);
    expect(loaded).toMatchObject({
      corrupted: false,
      migrated: true,
      persistenceAvailable: true,
      loadStatus: "migrated",
    });
    assertLegacyLoadPreservesBaseAndA1Visits(loaded.progress);
    expect(JSON.parse(loadStore.value(STORAGE_KEY) ?? "null")).toMatchObject({
      schemaVersion: 5,
      updatedAt: LEGACY_LOAD_UPDATED_AT,
    });
  });

  it.each([
    [
      "V1",
      {
        schemaVersion: 1,
        completedLessonIds: A1_LESSON_IDS,
        lastVisitedLessonId: "time-movement-4",
        updatedAt: LEGACY_LOAD_UPDATED_AT,
      },
    ],
    [
      "V2",
      {
        schemaVersion: 2,
        visitedLessonIds: A1_LESSON_IDS,
        lastVisitedLessonId: "time-movement-4",
        updatedAt: LEGACY_LOAD_UPDATED_AT,
      },
    ],
  ] as const)("injects every pre-split current ID when loading %s payloads", (_, payload) => {
    const store = memoryStorage();
    store.storage.setItem(STORAGE_KEY, JSON.stringify(payload));

    const loaded = loadProgress(store.storage);
    const { progress } = loaded;
    const activeLessonIds = [
      ...Object.keys(progress.levels.a0.lessons),
      ...Object.keys(progress.levels.a1.lessons),
    ];

    expect(loaded).toMatchObject({
      corrupted: false,
      migrated: true,
      loadStatus: "migrated",
    });
    expect(Object.keys(progress.levels.a0.lessons)).toHaveLength(20);
    expect(Object.keys(progress.levels.a1.lessons)).toHaveLength(44);
    expect(activeLessonIds.sort()).toEqual([...A1_LESSON_IDS].sort());
    expect(progress.levels.a0.lastVisitedLessonId).toBe("time-movement-4");
    expect(progress.levels.a1.lastVisitedLessonId).not.toBeNull();
    expect(progress.levels.a1.lessons[progress.levels.a1.lastVisitedLessonId!]).toBeDefined();
    for (const lessonId of A1_LESSON_IDS) {
      for (const level of ["a0", "a1", "a2"] as const) {
        expect(progress.levels[level].orphanedLessonIds).not.toContain(lessonId);
        expect(progress.levels[level].orphanedLessonRecords[lessonId]).toBeUndefined();
      }
    }
  });
});

describe("ProgressContext V5 owner failures", () => {
  it("rejects an unknown visit without creating A1 evidence", async () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    const store = memoryStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: store.storage,
    });
    const container = document.createElement("div");
    document.body.append(container);
    let latest: ProgressContextValue | undefined;
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          createElement(
            ProgressProvider,
            null,
            createElement(Consumer, { onValue: (value) => (latest = value) }),
          ),
        );
      });
      if (!latest) throw new Error("provider did not render");
      const before = latest.progressV5;

      await act(async () => latest?.markVisited("unknown-lesson"));

      expect(latest.progressV5).toBe(before);
      expect(latest.mutationError).toEqual({
        code: "unknown-lesson-owner",
        lessonId: "unknown-lesson",
      });
      expect(container.querySelector('[role="alert"]')?.textContent).toBe("unknown-lesson");
      expect(store.value("nihongo.course.progress")).toContain('"schemaVersion":5');
    } finally {
      await act(async () => root.unmount());
      container.remove();
      if (original) Object.defineProperty(window, "localStorage", original);
      else delete (window as { localStorage?: Storage }).localStorage;
    }
  });

  it("rejects unknown attempts and review resolutions without changing any level", async () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    const store = memoryStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: store.storage,
    });
    const container = document.createElement("div");
    document.body.append(container);
    let latest: ProgressContextValue | undefined;
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          createElement(
            ProgressProvider,
            null,
            createElement(Consumer, { onValue: (value) => (latest = value) }),
          ),
        );
      });
      if (!latest) throw new Error("provider did not render");
      const before = latest.progressV5;
      const input = {
        lessonId: "unknown-lesson",
        exerciseDefinitionId: "unknown-definition",
        targetConceptIds: [],
        targetLexemeIds: [],
      };

      await act(async () => latest?.recordAttempt({ ...input, outcome: "retry" }));
      expect(latest.progressV5).toBe(before);
      expect(latest.progressV5.updatedAt).toBe(before.updatedAt);
      expect(latest.mutationError).toEqual({
        code: "unknown-lesson-owner",
        lessonId: "unknown-lesson",
      });
      expect(container.querySelector('[role="alert"]')?.textContent).toBe("unknown-lesson");

      await act(async () => latest?.clearMutationError());
      await act(async () => latest?.resolveReview(input));
      expect(latest.progressV5).toBe(before);
      expect(latest.progressV5.levels).toBe(before.levels);
      expect(latest.mutationError).toEqual({
        code: "unknown-lesson-owner",
        lessonId: "unknown-lesson",
      });
      expect(container.querySelector('[role="alert"]')?.textContent).toBe("unknown-lesson");
    } finally {
      await act(async () => root.unmount());
      container.remove();
      if (original) Object.defineProperty(window, "localStorage", original);
      else delete (window as { localStorage?: Storage }).localStorage;
    }
  });
});

describe("ProgressContext V5 canonical ownership", () => {
  it("resolves every current lesson to its one complete runtime and fails closed for unknown lessons", () => {
    expect(currentLessonRouteRegistry.size).toBe(144);
    for (const [lessonId, owner] of currentLessonRouteRegistry) {
      const result = runtimeForLesson(lessonId);
      expect(result).toMatchObject({ ok: true, level: owner.levelId });
      if (result.ok) {
        expect(result.runtime.knownLessonIds.has(lessonId)).toBe(true);
        expect(result.runtime.lessonToCanDoId.get(lessonId)).toEqual(expect.any(String));
      }
    }
    expect(runtimeForLesson("not-a-current-lesson")).toEqual({
      ok: false,
      lessonId: "not-a-current-lesson",
    });
  });

  it("fails closed when a registry owner is absent from its runtime's Can-do map", () => {
    const inconsistentRuntime = {
      ...LEVEL_RUNTIME,
      a0: {
        ...LEVEL_RUNTIME.a0,
        lessonToCanDoId: new Map(),
      },
    };
    expect(runtimeForLesson("sounds-1", inconsistentRuntime)).toEqual({
      ok: false,
      lessonId: "sounds-1",
    });
  });

  it("keeps retired V4 Base activity ids out of current Base requirements", () => {
    expect(LEVEL_RUNTIME.a0.knownReviewKeys).toEqual(new Set());
    expect(LEVEL_RUNTIME.a0.checkpointScenarioLessonIds).toEqual([
      "base-synthesis-1",
      "base-synthesis-2",
      "base-synthesis-3",
      "base-synthesis-4",
    ]);
    for (const activity of V4_ACTIVITY_MIGRATION_MAP) {
      expect(LEVEL_RUNTIME.a0.knownReviewKeys.has(`${activity.destinationLessonId}:${activity.destinationActivityId}`)).toBe(false);
    }
  });

  it("records retained A1 checkpoint evidence without Base-owned Can-dos while preserving historical attempts", async () => {
    const retainedA1CanDoIds = new Set(LEVEL_RUNTIME.a1.lessonToCanDoId.values());
    const retainedSampledCanDoIds = a1Checkpoint.sampledCanDoIds.filter((id) =>
      retainedA1CanDoIds.has(id),
    );
    // Task 16 removed the five Base-owned outcomes from the authored A1
    // checkpoint, so nothing Base owns is sampled any more. Historical stored
    // attempts still name them, and must survive untouched — that is what the
    // fixture below records.
    const baseOwnedSampledCanDoIds = [
      "a1-can-do-sounds",
      "a1-can-do-sentence-foundations",
      "a1-can-do-topic-questions",
      "a1-can-do-polite-verbs",
      "a1-can-do-time-movement",
    ];
    expect(retainedSampledCanDoIds.length).toBeGreaterThan(0);
    expect(a1Checkpoint.sampledCanDoIds).toEqual(retainedSampledCanDoIds);
    for (const canDoId of baseOwnedSampledCanDoIds) {
      expect(retainedA1CanDoIds.has(canDoId), canDoId).toBe(false);
    }

    const historicalAttempt = {
      id: "legacy-a1-checkpoint-attempt",
      checkpointId: a1Checkpoint.id,
      attemptedAt: "2026-08-06T00:00:00.000Z",
      acceptedExerciseIds: ["legacy-a1-exercise"],
      sampledCanDoIds: [
        ...baseOwnedSampledCanDoIds,
        ...a1Checkpoint.sampledCanDoIds,
      ],
    };
    const historicalStore = memoryStorage();
    const v4 = emptyProgressV4();
    historicalStore.storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...v4,
        levels: {
          ...v4.levels,
          a1: {
            ...v4.levels.a1,
            checkpointAttempts: [historicalAttempt],
          },
        },
      }),
    );
    expect(loadProgress(historicalStore.storage).progress.levels.a1.checkpointAttempts[0]).toEqual(
      historicalAttempt,
    );

    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    const store = memoryStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: store.storage,
    });
    const container = document.createElement("div");
    document.body.append(container);
    let latest: ProgressContextValue | undefined;
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          createElement(
            ProgressProvider,
            null,
            createElement(Consumer, { onValue: (value) => (latest = value) }),
          ),
        );
      });
      if (!latest) throw new Error("provider did not render");

      for (const lessonId of LEVEL_RUNTIME.a1.checkpointScenarioLessonIds) {
        const exercises = getLessonExercises(lessonId)?.exercises ?? [];
        expect(exercises.length).toBeGreaterThan(0);
        for (const exercise of exercises) {
          await act(async () =>
            latest?.recordAttempt({
              lessonId,
              exerciseDefinitionId: exercise.definitionId,
              outcome: "accepted",
              targetConceptIds: exercise.prompt.assessedConceptIds,
              targetLexemeIds: exercise.prompt.assessedLexemeIds,
            }),
          );
        }
        expect(latest.progressV5.levels.a1.lessons[lessonId]?.consolidatedAt).not.toBeNull();
      }

      const attempts = latest.progressV5.levels.a1.checkpointAttempts;
      expect(attempts).toHaveLength(1);
      const [attempt] = attempts;
      expect(attempt!.sampledCanDoIds).toEqual(retainedSampledCanDoIds);
      for (const canDoId of baseOwnedSampledCanDoIds) {
        expect(attempt!.sampledCanDoIds).not.toContain(canDoId);
        expect(latest.progressV5.levels.a1.canDos[canDoId]).toBeUndefined();
      }
      for (const canDoId of retainedSampledCanDoIds) {
        expect(latest.progressV5.levels.a1.canDos[canDoId]?.checkpointAttemptIds).toContain(
          attempt!.id,
        );
      }
    } finally {
      await act(async () => root.unmount());
      container.remove();
      if (original) Object.defineProperty(window, "localStorage", original);
      else delete (window as { localStorage?: Storage }).localStorage;
    }
  });

  it("writes a visit into only the canonical owner level", async () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    const store = memoryStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: store.storage,
    });
    const container = document.createElement("div");
    document.body.append(container);
    let latest: ProgressContextValue | undefined;
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          createElement(
            ProgressProvider,
            null,
            createElement(Consumer, { onValue: (value) => (latest = value) }),
          ),
        );
      });
      if (!latest) throw new Error("provider did not render");

      for (const [lessonId, level] of [
        ["sounds-1", "a0"],
        ["introductions-1", "a1"],
        ["connected-conversation-1", "a2"],
      ] as const) {
        const before = latest.progressV5;
        await act(async () => latest?.markVisited(lessonId));
        expect(latest.progressV5.levels[level].lessons[lessonId]?.visitedAt).not.toBeNull();
        for (const otherLevel of ["a0", "a1", "a2"] as const) {
          if (otherLevel !== level) {
            expect(latest.progressV5.levels[otherLevel]).toEqual(before.levels[otherLevel]);
          }
        }
      }
      expect(latest.progressV5.levels.a1.lessons["sounds-1"]).toBeUndefined();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      if (original) Object.defineProperty(window, "localStorage", original);
      else delete (window as { localStorage?: Storage }).localStorage;
    }
  });

  it("rejects a stale definition and records an exact current definition only", async () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    const store = memoryStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: store.storage,
    });
    const container = document.createElement("div");
    document.body.append(container);
    let latest: ProgressContextValue | undefined;
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          createElement(
            ProgressProvider,
            null,
            createElement(Consumer, { onValue: (value) => (latest = value) }),
          ),
        );
      });
      if (!latest) throw new Error("provider did not render");
      const before = latest.progressV5;
      const stale = {
        lessonId: "introductions-1",
        exerciseDefinitionId: "introductions-1-retired",
        outcome: "accepted" as const,
        targetConceptIds: [],
        targetLexemeIds: [],
      };
      await act(async () => latest?.recordAttempt(stale));
      expect(latest.progressV5).toBe(before);
      expect(latest.mutationError).toEqual({
        code: "unknown-exercise-definition",
        lessonId: "introductions-1",
      });

      const exercise = getLessonExercises("introductions-1")!.exercises[0]!;
      await act(async () =>
        latest?.recordAttempt({
          lessonId: "introductions-1",
          exerciseDefinitionId: exercise.definitionId,
          outcome: "accepted",
          targetConceptIds: exercise.prompt.assessedConceptIds,
          targetLexemeIds: exercise.prompt.assessedLexemeIds,
        }),
      );
      expect(latest.progressV5.levels.a1.lessons["introductions-1"]?.attemptedExerciseIds).toEqual([
        exercise.definitionId,
      ]);
      expect(latest.progressV5.levels.a0.lessons["introductions-1"]).toBeUndefined();
      expect(latest.progressV5.levels.a2.lessons["introductions-1"]).toBeUndefined();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      if (original) Object.defineProperty(window, "localStorage", original);
      else delete (window as { localStorage?: Storage }).localStorage;
    }
  });

  it("keeps clearLevel total for Base, A1, and A2, then resets to a current V5 record", async () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    const store = memoryStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: store.storage,
    });
    const container = document.createElement("div");
    document.body.append(container);
    let latest: ProgressContextValue | undefined;
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          createElement(
            ProgressProvider,
            null,
            createElement(Consumer, { onValue: (value) => (latest = value) }),
          ),
        );
      });
      if (!latest) throw new Error("provider did not render");
      for (const lessonId of ["sounds-1", "introductions-1", "connected-conversation-1"]) {
        await act(async () => latest?.markVisited(lessonId));
      }
      expect(latest.levelSummaryFor("a0").visitedLessonCount).toBe(1);
      expect(latest.levelSummaryFor("a1").visitedLessonCount).toBe(1);
      expect(latest.levelSummaryFor("a2").visitedLessonCount).toBe(1);

      const a1Before = latest.progressV5.levels.a1;
      const a2Before = latest.progressV5.levels.a2;
      await act(async () => latest?.clearLevel("a0"));
      expect(latest.levelSummaryFor("a0").visitedLessonCount).toBe(0);
      expect(latest.progressV5.levels.a1).toEqual(a1Before);
      expect(latest.progressV5.levels.a2).toEqual(a2Before);

      const a2AfterBaseClear = latest.progressV5.levels.a2;
      await act(async () => latest?.clearLevel("a1"));
      expect(latest.levelSummaryFor("a1").visitedLessonCount).toBe(0);
      expect(latest.progressV5.levels.a2).toEqual(a2AfterBaseClear);
      await act(async () => latest?.clearLevel("a2"));
      expect(latest.levelSummaryFor("a2").visitedLessonCount).toBe(0);

      await act(async () => latest?.reset());
      expect(latest.progressV5.schemaVersion).toBe(5);
      expect(latest.progressV5.migrationNotice).toBeNull();
      expect(JSON.parse(store.value("nihongo.course.progress") ?? "null")).toMatchObject({
        schemaVersion: 5,
        migrationNotice: null,
      });
      const reloaded = loadProgress(store.storage);
      expect(reloaded.progress.schemaVersion).toBe(5);
      expect(reloaded.progress.migrationNotice).toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      if (original) Object.defineProperty(window, "localStorage", original);
      else delete (window as { localStorage?: Storage }).localStorage;
    }
  });
});
