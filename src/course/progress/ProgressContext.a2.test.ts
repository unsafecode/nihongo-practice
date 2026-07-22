/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import {
  ProgressProvider,
  useProgress,
  type ProgressContextValue,
} from "./ProgressContext";
import { getLessonExercises } from "../components/lessonExerciseModel";
import { a2Checkpoint } from "../a2/catalog/checkpoint";
import { A2_SYNTHESIS_LESSON_IDS } from "../a2/manifest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Phase 3 Task 8: `ProgressContext` records A2 evidence into the already
 * level-aware V4 store (`levels.a2`) with no destructive migration, leaving
 * `levels.a1` byte-identical. The level is inferred from the (disjoint) lesson
 * id, so the existing A1 markVisited/recordAttempt signatures stay unchanged.
 */

function memoryStorage(initial: Readonly<Record<string, string>> = {}): Storage {
  const values = new Map<string, string>(Object.entries(initial));
  return {
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
  };
}

async function withReplacedLocalStorage<T>(
  storage: Storage,
  fn: () => Promise<T> | T,
): Promise<T> {
  const original = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  try {
    return await fn();
  } finally {
    if (original) Object.defineProperty(window, "localStorage", original);
  }
}

function Consumer({ onValue }: { onValue: (value: ProgressContextValue) => void }) {
  onValue(useProgress());
  return null;
}

async function withMountedProvider(
  fn: (get: () => ProgressContextValue) => Promise<void> | void,
): Promise<void> {
  const storage = memoryStorage({});
  const container = document.createElement("div");
  document.body.append(container);
  let latest: ProgressContextValue | undefined;
  await withReplacedLocalStorage(storage, async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        createElement(ProgressProvider, null, createElement(Consumer, { onValue: (v) => (latest = v) })),
      );
    });
    await fn(() => {
      if (!latest) throw new Error("provider never rendered a value");
      return latest;
    });
    await act(async () => root.unmount());
  });
  container.remove();
}

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

describe("ProgressContext — level-aware A2 evidence (Phase 3 Task 8)", () => {
  it("reports an independent, empty A2 level summary (60 lessons) for a fresh learner", async () => {
    await withMountedProvider((get) => {
      const a2 = get().levelSummaryFor("a2");
      expect(a2.level).toBe("a2");
      expect(a2.totalLessonCount).toBe(60);
      expect(a2.visitedLessonCount).toBe(0);
      expect(get().canDoEvidenceFor("a2")).toEqual({});
      expect(get().checkpointAttemptsFor("a2")).toEqual([]);
    });
  });

  it("records an A2 lesson visit into levels.a2 and leaves levels.a1 byte-identical", async () => {
    await withMountedProvider(async (get) => {
      const a1Before = JSON.stringify(get().progressV4.levels.a1);

      await act(async () => get().markVisited("connected-conversation-1"));

      expect(get().levelSummaryFor("a2").visitedLessonCount).toBe(1);
      expect(get().levelSummaryFor("a1").visitedLessonCount).toBe(0);
      expect(get().lessonEvidence("connected-conversation-1")?.visitedAt).not.toBeNull();
      // A1 evidence never contaminated by an A2 mutation.
      expect(JSON.stringify(get().progressV4.levels.a1)).toBe(a1Before);
    });
  });

  it("records A2 Can-do + practiced evidence into levels.a2 while levels.a1 stays byte-identical", async () => {
    await withMountedProvider(async (get) => {
      const a1Before = JSON.stringify(get().progressV4.levels.a1);

      await acceptAllExercises(get, "connected-conversation-1");

      const a2Evidence = get().canDoEvidenceFor("a2");
      expect(Object.keys(a2Evidence).length).toBeGreaterThan(0);
      // The A1 Can-do evidence surface must remain completely empty.
      expect(get().canDoEvidence).toEqual({});
      expect(get().lessonEvidence("connected-conversation-1")?.practicedAt).not.toBeNull();
      expect(JSON.stringify(get().progressV4.levels.a1)).toBe(a1Before);
    });
  });

  it("records the separate A2 checkpoint attempt once all four synthesis lessons are consolidated", async () => {
    await withMountedProvider(async (get) => {
      for (const lessonId of A2_SYNTHESIS_LESSON_IDS) {
        await acceptAllExercises(get, lessonId);
      }
      const attempts = get().checkpointAttemptsFor("a2");
      expect(attempts.length).toBe(1);
      expect(attempts[0]!.checkpointId).toBe(a2Checkpoint.id);
      // A1 checkpoint attempts untouched.
      expect(get().checkpointAttemptsFor("a1")).toEqual([]);
    });
  });

  it("keeps the A1-projected surfaces working unchanged when only A2 evidence exists", async () => {
    await withMountedProvider(async (get) => {
      await act(async () => get().markVisited("connected-conversation-1"));
      // The v3-compat `progress` surface still projects A1 only.
      expect(get().progress.lessons["connected-conversation-1"]).toBeUndefined();
      expect(get().levelSummary.level).toBe("a1");
      expect(get().levelSummary.visitedLessonCount).toBe(0);
    });
  });
});
