import { describe, expect, it } from "vitest";
import {
  lessonHasOpenReview,
  orderedReviewQueue,
  reconcileReviewQueueEntries,
  reconcileReviewQueue,
  resolveReviewEntry,
  reviewKeyFor,
  upsertReviewMistake,
  type ReviewMistake,
} from "./reviewQueue";
import { emptyProgress, type ReviewQueueEntry } from "./progress";

function mistake(overrides: Partial<ReviewMistake> = {}): ReviewMistake {
  return {
    lessonId: "l1",
    exerciseDefinitionId: "l1-x1",
    targetConceptIds: ["c-topic"],
    targetLexemeIds: ["w-neko"],
    at: "2026-07-16T10:00:00.000Z",
    ...overrides,
  };
}

describe("reviewQueue — stable key derivation", () => {
  it("derives a stable lessonId:exerciseDefinitionId review key", () => {
    expect(reviewKeyFor("existence-basics-1", "existence-basics-1-x2")).toBe(
      "existence-basics-1:existence-basics-1-x2",
    );
  });
});

describe("reviewQueue — upsert and increment", () => {
  it("adds a fresh entry with mistakeCount 1", () => {
    const queue = upsertReviewMistake([], mistake());
    expect(queue).toEqual([
      {
        reviewKey: "l1:l1-x1",
        lessonId: "l1",
        exerciseDefinitionId: "l1-x1",
        targetConceptIds: ["c-topic"],
        targetLexemeIds: ["w-neko"],
        mistakeCount: 1,
        lastMistakeAt: "2026-07-16T10:00:00.000Z",
      },
    ]);
  });

  it("deduplicates duplicate retries into one entry and increments the count", () => {
    const once = upsertReviewMistake([], mistake());
    const twice = upsertReviewMistake(
      once,
      mistake({ at: "2026-07-16T10:05:00.000Z" }),
    );
    expect(twice).toHaveLength(1);
    expect(twice[0]).toMatchObject({
      reviewKey: "l1:l1-x1",
      mistakeCount: 2,
      lastMistakeAt: "2026-07-16T10:05:00.000Z",
    });
  });

  it("does not mutate the input queue", () => {
    const original: ReviewQueueEntry[] = [];
    const next = upsertReviewMistake(original, mistake());
    expect(original).toEqual([]);
    expect(next).not.toBe(original);
  });
});

describe("reviewQueue — deterministic ordering (most recent first, key tie-break)", () => {
  it("orders by most recent mistake, breaking ties by review key ascending", () => {
    let queue = upsertReviewMistake([], mistake({ lessonId: "lb", exerciseDefinitionId: "lb-x1", at: "2026-07-16T10:00:00.000Z" }));
    queue = upsertReviewMistake(queue, mistake({ lessonId: "la", exerciseDefinitionId: "la-x1", at: "2026-07-16T12:00:00.000Z" }));
    // Same timestamp as la — tie broken by review key ascending.
    queue = upsertReviewMistake(queue, mistake({ lessonId: "la", exerciseDefinitionId: "la-x2", at: "2026-07-16T12:00:00.000Z" }));
    expect(queue.map((entry) => entry.reviewKey)).toEqual([
      "la:la-x1",
      "la:la-x2",
      "lb:lb-x1",
    ]);
  });

  it("re-sorts an out-of-order stored queue without mutating it", () => {
    const stored: ReviewQueueEntry[] = [
      { reviewKey: "a:a", lessonId: "a", exerciseDefinitionId: "a", targetConceptIds: [], targetLexemeIds: [], mistakeCount: 1, lastMistakeAt: "2026-07-16T09:00:00.000Z" },
      { reviewKey: "b:b", lessonId: "b", exerciseDefinitionId: "b", targetConceptIds: [], targetLexemeIds: [], mistakeCount: 1, lastMistakeAt: "2026-07-16T11:00:00.000Z" },
    ];
    expect(orderedReviewQueue(stored).map((e) => e.reviewKey)).toEqual(["b:b", "a:a"]);
    expect(stored[0].reviewKey).toBe("a:a");
  });
});

describe("reviewQueue — resolution and reopening", () => {
  it("removes the resolved entry and is a no-op for an absent key", () => {
    const queue = upsertReviewMistake([], mistake());
    expect(resolveReviewEntry(queue, "l1:l1-x1")).toEqual([]);
    expect(resolveReviewEntry(queue, "nope:nope")).toEqual(queue);
  });

  it("reopens a resolved item on a later mistake as a single deduplicated entry", () => {
    const first = upsertReviewMistake([], mistake());
    const resolved = resolveReviewEntry(first, "l1:l1-x1");
    const reopened = upsertReviewMistake(resolved, mistake({ at: "2026-07-16T13:00:00.000Z" }));
    expect(reopened).toHaveLength(1);
    expect(reopened[0]).toMatchObject({ mistakeCount: 1, lastMistakeAt: "2026-07-16T13:00:00.000Z" });
  });
});

describe("reviewQueue — lesson open-review lookup", () => {
  it("reports whether an active entry exists for a lesson", () => {
    const queue = upsertReviewMistake([], mistake());
    expect(lessonHasOpenReview(queue, "l1")).toBe(true);
    expect(lessonHasOpenReview(queue, "l2")).toBe(false);
  });
});

describe("reviewQueue — catalog reconciliation preserves orphans", () => {
  it("moves unknown review keys to orphanedReviewKeys and keeps known entries active", () => {
    const known = upsertReviewMistake([], mistake({ lessonId: "known", exerciseDefinitionId: "known-x1" }));
    const withOrphan = upsertReviewMistake(known, mistake({ lessonId: "removed", exerciseDefinitionId: "removed-x1" }));
    const progress = { ...emptyProgress(), reviewQueue: withOrphan };
    const reconciled = reconcileReviewQueue(progress, new Set(["known:known-x1"]));
    expect(reconciled.reviewQueue.map((e) => e.reviewKey)).toEqual(["known:known-x1"]);
    expect(reconciled.orphanedReviewKeys).toEqual(["removed:removed-x1"]);
  });

  it("preserves pre-existing orphaned keys and is idempotent", () => {
    const progress = {
      ...emptyProgress(),
      reviewQueue: upsertReviewMistake([], mistake({ lessonId: "removed", exerciseDefinitionId: "removed-x1" })),
      orphanedReviewKeys: ["legacy:legacy-x1"],
    };
    const once = reconcileReviewQueue(progress, new Set<string>());
    expect(once.orphanedReviewKeys).toEqual(["legacy:legacy-x1", "removed:removed-x1"]);
    const twice = reconcileReviewQueue(once, new Set<string>());
    expect(twice).toEqual(once);
  });

  it("returns the same reference when nothing needs reconciling", () => {
    const progress = {
      ...emptyProgress(),
      reviewQueue: upsertReviewMistake([], mistake({ lessonId: "known", exerciseDefinitionId: "known-x1" })),
    };
    const reconciled = reconcileReviewQueue(progress, new Set(["known:known-x1"]));
    expect(reconciled).toBe(progress);
  });

  it("keeps the raw queue and orphan arrays by reference when no reconciliation is needed", () => {
    const queue = upsertReviewMistake(
      [],
      mistake({ lessonId: "known", exerciseDefinitionId: "known-x1" }),
    );
    const orphanedReviewKeys = ["legacy:legacy-x1"];

    const reconciled = reconcileReviewQueueEntries(
      queue,
      orphanedReviewKeys,
      new Set(["known:known-x1"]),
    );

    expect(reconciled.changed).toBe(false);
    expect(reconciled.reviewQueue).toBe(queue);
    expect(reconciled.orphanedReviewKeys).toBe(orphanedReviewKeys);
  });
});
