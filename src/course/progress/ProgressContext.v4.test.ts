/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import {
  LEVEL_RUNTIME,
  ProgressProvider,
  STORAGE_KEY,
  useProgress,
  type ProgressContextValue,
} from "./ProgressContext";
import { getLessonExercises } from "../components/lessonExerciseModel";
import { a1Checkpoint, A1_CHECKPOINT_SCENARIO_LESSON_IDS } from "../a1/catalog/checkpoint";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

/**
 * Real coverage for Phase 2 Task 6's `ProgressContext` V4 wiring (design
 * spec §8, §17): the pure V4 API in `progress.ts` (Can-do evidence,
 * checkpoint attempts, migration notice, level summary) is now exposed on
 * `useProgress()` and actually recorded from real lesson interactions —
 * never a fabricated pass/fail verdict, never A2 contamination.
 */

interface CallCounts {
  setItem: number;
  removeItem: number;
}

function instrumentedStorage(
  initial: Readonly<Record<string, string>> = {},
): { storage: Storage; calls: CallCounts } {
  const values = new Map<string, string>(Object.entries(initial));
  const calls: CallCounts = { setItem: 0, removeItem: 0 };
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      calls.removeItem += 1;
      values.delete(key);
    },
    setItem: (key, value) => {
      calls.setItem += 1;
      values.set(key, value);
    },
  };
  return { storage, calls };
}

async function withReplacedLocalStorage<T>(
  storage: Storage,
  fn: () => Promise<T> | T,
): Promise<T> {
  const original = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", {
    value: storage,
    configurable: true,
  });
  try {
    return await fn();
  } finally {
    if (original) Object.defineProperty(window, "localStorage", original);
  }
}

function Consumer({ onValue }: { onValue: (value: ProgressContextValue) => void }) {
  const value = useProgress();
  onValue(value);
  return null;
}

function appElement(onValue: (value: ProgressContextValue) => void) {
  return createElement(ProgressProvider, null, createElement(Consumer, { onValue }));
}

async function withMountedProvider(
  initial: Readonly<Record<string, string>>,
  fn: (get: () => ProgressContextValue) => Promise<void> | void,
): Promise<void> {
  const { storage } = instrumentedStorage(initial);
  const container = document.createElement("div");
  document.body.append(container);
  let latest: ProgressContextValue | undefined;
  await withReplacedLocalStorage(storage, async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(appElement((value) => (latest = value)));
    });
    await fn(() => {
      if (!latest) throw new Error("provider never rendered a value");
      return latest;
    });
    await act(async () => root.unmount());
  });
  container.remove();
}

/** Accepts every exercise of a lesson, in order, via `recordAttempt`. */
async function acceptAllExercises(
  get: () => ProgressContextValue,
  lessonId: string,
): Promise<void> {
  const model = getLessonExercises(lessonId);
  if (!model) throw new Error(`no exercise model for ${lessonId}`);
  for (const exercise of model.exercises) {
    await act(async () => {
      get().recordAttempt({
        lessonId,
        exerciseDefinitionId: exercise.definitionId,
        outcome: "accepted",
        targetConceptIds: exercise.prompt.assessedConceptIds,
        targetLexemeIds: exercise.prompt.assessedLexemeIds,
      });
    });
  }
}

describe("ProgressContext V5 exposure", () => {
  it("starts with no migration notice, empty Can-do evidence, and no checkpoint attempts for a fresh learner", async () => {
    await withMountedProvider({}, (get) => {
      const value = get();
      expect(value.migrationNotice).toBeNull();
      expect(value.canDoEvidence).toEqual({});
      expect(value.checkpointAttempts).toEqual([]);
      expect(value.levelSummary.level).toBe("a1");
      expect(value.levelSummary.totalLessonCount).toBe(44);
      expect(value.levelSummary.visitedLessonCount).toBe(0);
    });
  });

  it("records a phonetic lesson visit only in Base's canonical Can-do evidence", async () => {
    await withMountedProvider({}, async (get) => {
      await act(async () => get().markVisited("sounds-1"));
      const evidence = get().canDoEvidenceFor("a0")["a1-can-do-sounds"];
      expect(evidence).toBeDefined();
      expect(evidence!.visitedLessonIds).toEqual(["sounds-1"]);
      expect(get().levelSummaryFor("a0").visitedLessonCount).toBe(1);
      expect(get().levelSummary.visitedLessonCount).toBe(0);
    });
  });

  it("records practiced Can-do evidence once a lesson's required exercises are all attempted, and transfer evidence only for round-2 acceptances", async () => {
    await withMountedProvider({}, async (get) => {
      await acceptAllExercises(get, "introductions-1");

      // v3-compat surface still advances normally (unchanged, locked behavior).
      expect(get().progress.lessons["introductions-1"]?.practicedAt).not.toBeNull();

      const evidence = get().canDoEvidence["a1-can-do-identity"];
      expect(evidence).toBeDefined();
      expect(evidence!.practicedLessonIds).toContain("introductions-1");

      const model = getLessonExercises("introductions-1")!;
      const transferIds = model.exercises
        .filter((exercise) => exercise.practicePurpose === "transfer")
        .map((exercise) => exercise.definitionId);
      const guidedIds = model.exercises
        .filter((exercise) => exercise.practicePurpose === "guided-controlled")
        .map((exercise) => exercise.definitionId);
      expect(transferIds.length).toBeGreaterThan(0);
      expect(guidedIds.length).toBeGreaterThan(0);
      for (const id of transferIds) {
        expect(evidence!.acceptedTransferExerciseIds).toContain(id);
      }
      for (const id of guidedIds) {
        expect(evidence!.acceptedTransferExerciseIds).not.toContain(id);
      }
    });
  });

  it("does not reactivate retired phonetic exercise definitions as current Base requirements", async () => {
    await withMountedProvider({}, async (get) => {
      const model = getLessonExercises("sounds-1")!;
      expect(model.exercises.length).toBe(4);

      await acceptAllExercises(get, "sounds-1");

      expect(get().mutationError).toEqual({
        code: "unknown-exercise-definition",
        lessonId: "sounds-1",
      });
      expect(get().progressV5.levels.a0.lessons["sounds-1"]).toBeUndefined();
      expect(get().canDoEvidenceFor("a0")["a1-can-do-sounds"]).toBeUndefined();
    });
  });

  it("records exactly one idempotent checkpoint attempt once all four capstone lessons are consolidated, sampling retained A1 Can-dos honestly", async () => {
    await withMountedProvider({}, async (get) => {
      expect(A1_CHECKPOINT_SCENARIO_LESSON_IDS.length).toBe(4);
      for (const lessonId of A1_CHECKPOINT_SCENARIO_LESSON_IDS) {
        await acceptAllExercises(get, lessonId);
        expect(get().progress.lessons[lessonId]?.consolidatedAt, lessonId).not.toBeNull();
      }

      expect(get().checkpointAttempts.length).toBe(1);
      const attempt = get().checkpointAttempts[0]!;
      expect(attempt.checkpointId).toBe(a1Checkpoint.id);
      expect([...attempt.sampledCanDoIds].sort()).toEqual(
        [...LEVEL_RUNTIME.a1.checkpoint.sampledCanDoIds].sort(),
      );
      const expectedAccepted = A1_CHECKPOINT_SCENARIO_LESSON_IDS.flatMap(
        (lessonId) => get().progress.lessons[lessonId]!.acceptedExerciseIds,
      );
      expect([...attempt.acceptedExerciseIds].sort()).toEqual(
        [...expectedAccepted].sort(),
      );

      // Never a pass/fail verdict — only observational evidence fields exist.
      expect(Object.keys(attempt).sort()).toEqual(
        ["acceptedExerciseIds", "attemptedAt", "checkpointId", "id", "sampledCanDoIds"].sort(),
      );

      // Re-triggering (e.g. re-recording an already-accepted exercise) must
      // never duplicate the attempt.
      const lastCapstone =
        A1_CHECKPOINT_SCENARIO_LESSON_IDS[A1_CHECKPOINT_SCENARIO_LESSON_IDS.length - 1]!;
      await acceptAllExercises(get, lastCapstone);
      expect(get().checkpointAttempts.length).toBe(1);
      expect(get().checkpointAttempts[0]!.id).toBe(attempt.id);
    });
  });

  it("exposes a truthful, dismissible migration notice for a migrated schema-v3 payload, never auto-clearing it", async () => {
    const rawV3 = JSON.stringify({
      schemaVersion: 3,
      catalogVersion: "a0-a1-v1",
      lessons: {
        "sounds-1": {
          visitedAt: "2026-07-13T10:00:00.000Z",
          practicedAt: null,
          consolidatedAt: null,
          attemptedExerciseIds: [],
          acceptedExerciseIds: [],
        },
      },
      lastVisitedLessonId: "sounds-1",
      reviewQueue: [],
      orphanedLessonIds: [],
      orphanedReviewKeys: [],
      updatedAt: "2026-07-13T10:00:00.000Z",
    });
    await withMountedProvider({ [STORAGE_KEY]: rawV3 }, async (get) => {
      expect(get().migrationNotice).not.toBeNull();
      expect(get().migrationNotice!.acknowledgedAt).toBeNull();
      await act(async () => get().acknowledgeMigrationNotice());
      expect(get().migrationNotice!.acknowledgedAt).not.toBeNull();
      // Acknowledging never deletes the record — "what changed" stays visible.
      expect(get().migrationNotice!.fromSchemaVersion).toBe(4);
    });
  });
});
