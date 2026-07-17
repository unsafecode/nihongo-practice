/** @vitest-environment jsdom */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ProgressProvider,
  STORAGE_KEY,
  useProgress,
  type ProgressContextValue,
} from "./ProgressContext";
import { emptyProgressV4 } from "./progress";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

/**
 * Real regression coverage for the Phase 2 Task 5 quality-review minors
 * #4/#5: `ProgressProvider`'s lazy `useState` initializer must never write to
 * storage during render (a React purity violation, dangerous under
 * StrictMode/concurrent rendering), and a migrated v1/v2/v3 payload must be
 * written back to storage exactly once on mount — never twice (once from the
 * old render-phase `loadProgress` call, once more from the always-running
 * mount effect).
 *
 * `ProgressProvider` always resolves its storage via `browserStorage()`
 * (`window.localStorage`), so these tests swap `window.localStorage` for a
 * counting in-memory stand-in rather than injecting a storage prop — there
 * is no such prop, and adding one is out of scope for this fix.
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

function rawV3Payload(): string {
  return JSON.stringify({
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
}

function Consumer({
  onValue,
}: {
  onValue: (value: ProgressContextValue) => void;
}) {
  const value = useProgress();
  onValue(value);
  return null;
}

function appElement(onValue: (value: ProgressContextValue) => void) {
  return createElement(ProgressProvider, null, createElement(Consumer, { onValue }));
}

describe("ProgressProvider initialization — side effects (Phase 2 Task 5 quality-review minors #4/#5)", () => {
  it.each([
    ["a migrated v3 payload", { [STORAGE_KEY]: rawV3Payload() }],
    ["a corrupted payload", { [STORAGE_KEY]: "{not json" }],
    ["a current v4 payload", { [STORAGE_KEY]: JSON.stringify(emptyProgressV4()) }],
    ["no stored value at all", {}],
  ])(
    "performs zero localStorage writes while rendering: %s (lazy state init must stay pure)",
    async (_label, initial) => {
      const { storage, calls } = instrumentedStorage(initial);
      await withReplacedLocalStorage(storage, () => {
        renderToStaticMarkup(appElement(() => {}));
      });
      expect(calls).toEqual({ setItem: 0, removeItem: 0 });
    },
  );

  it("commits exactly one write-back after mount for a migrated v3 payload, never a duplicate", async () => {
    const { storage, calls } = instrumentedStorage({
      [STORAGE_KEY]: rawV3Payload(),
    });
    const container = document.createElement("div");
    document.body.append(container);
    await withReplacedLocalStorage(storage, async () => {
      const root = createRoot(container);
      await act(async () => {
        root.render(appElement(() => {}));
      });
      expect(calls.setItem).toBe(1);
      expect(calls.removeItem).toBe(0);
      // The one write that did happen must actually be the migrated v4, not
      // a stale/duplicate copy of the original v3 bytes.
      expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "null").schemaVersion).toBe(4);
      await act(async () => root.unmount());
    });
    container.remove();
  });

  it("removes then recreates storage exactly once for a corrupted payload (unchanged net behavior, now fully deferred to the mount effect)", async () => {
    const { storage, calls } = instrumentedStorage({
      [STORAGE_KEY]: "{not json",
    });
    const container = document.createElement("div");
    document.body.append(container);
    await withReplacedLocalStorage(storage, async () => {
      const root = createRoot(container);
      await act(async () => {
        root.render(appElement(() => {}));
      });
      expect(calls.removeItem).toBe(1);
      expect(calls.setItem).toBe(1);
      await act(async () => root.unmount());
    });
    container.remove();
  });

  it("persists exactly once on mount for an already-current v4 payload (preserves the existing always-persist-on-mount contract)", async () => {
    const { storage, calls } = instrumentedStorage({
      [STORAGE_KEY]: JSON.stringify(emptyProgressV4()),
    });
    const container = document.createElement("div");
    document.body.append(container);
    await withReplacedLocalStorage(storage, async () => {
      const root = createRoot(container);
      await act(async () => {
        root.render(appElement(() => {}));
      });
      expect(calls.setItem).toBe(1);
      expect(calls.removeItem).toBe(0);
      await act(async () => root.unmount());
    });
    container.remove();
  });

  it("still persists every subsequent change after the deduplicated initial mount write (ongoing persistence is unaffected)", async () => {
    const { storage, calls } = instrumentedStorage({});
    const container = document.createElement("div");
    document.body.append(container);
    let latest: ProgressContextValue | undefined;
    await withReplacedLocalStorage(storage, async () => {
      const root = createRoot(container);
      await act(async () => {
        root.render(appElement((value) => (latest = value)));
      });
      expect(calls.setItem).toBe(1);
      await act(async () => {
        latest?.markVisited("sounds-1");
      });
      expect(calls.setItem).toBe(2);
      await act(async () => root.unmount());
    });
    container.remove();
  });
});
