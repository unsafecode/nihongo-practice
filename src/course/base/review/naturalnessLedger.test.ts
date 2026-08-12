import { describe, expect, it } from "vitest";

import {
  BASE_AUDIO_REVIEW_INVENTORY,
  BASE_AUDIO_REVIEW_VALIDATION,
} from "../audio/reviewLedger";
import {
  BASE_NATURALNESS_REVIEW_INVENTORY,
  BASE_NATURALNESS_REVIEW_VALIDATION,
  validateBaseNaturalnessReviewInventory,
} from "./naturalnessLedger";
import { canonicalReviewFingerprint } from "./fingerprint";

describe("independent Base naturalness inventory", () => {
  it("uses a type-safe canonical fingerprint encoding", () => {
    expect(canonicalReviewFingerprint(undefined)).not.toBe(
      canonicalReviewFingerprint("<undefined>"),
    );
    expect(canonicalReviewFingerprint({ b: 2, a: 1 })).toBe(
      canonicalReviewFingerprint({ a: 1, b: 2 }),
    );
  });

  it("enumerates every required learner-visible Japanese surface with provenance", () => {
    expect(BASE_NATURALNESS_REVIEW_INVENTORY.length).toBeGreaterThan(0);
    expect(
      new Set(BASE_NATURALNESS_REVIEW_INVENTORY.map(({ sourceKind }) => sourceKind)),
    ).toEqual(
      new Set([
        "example",
        "dialogue-turn",
        "prompt",
        "option",
        "accepted-answer",
        "spoken-answer",
        "audio-string",
        "localized-copy",
      ]),
    );

    for (const entry of BASE_NATURALNESS_REVIEW_INVENTORY) {
      expect(entry.contentId).not.toBe("");
      expect(entry.lessonId).not.toBe("");
      expect(entry.sourceId).not.toBe("");
      expect(entry.jp).not.toBe("");
      expect(typeof entry.en).toBe("string");
      expect(typeof entry.it).toBe("string");
      expect(entry.fingerprint).toMatch(/^[a-f0-9]{64}$/u);
      expect(entry.status).toBe("pending");
      expect(entry).not.toHaveProperty("reviewerIdentity");
      expect(entry).not.toHaveProperty("reviewedAt");
    }
    expect(BASE_NATURALNESS_REVIEW_VALIDATION.errors).toEqual([]);
  });

  it("detects stale fingerprints without invoking hostile accessors", () => {
    const [first, ...rest] = BASE_NATURALNESS_REVIEW_INVENTORY;
    expect(first).toBeDefined();
    const stale = [{ ...first, fingerprint: "0".repeat(64) }, ...rest];
    expect(validateBaseNaturalnessReviewInventory(stale).ok).toBe(false);

    let getterCalls = 0;
    const hostile = Object.defineProperty([], "0", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return first;
      },
    });
    expect(validateBaseNaturalnessReviewInventory(hostile).ok).toBe(false);
    expect(getterCalls).toBe(0);
  });
});

describe("independent Base audio inventory", () => {
  it("keeps all physical and semantic audio entries fresh and pending", () => {
    const physical = BASE_AUDIO_REVIEW_INVENTORY.filter(
      ({ sourceKind }) => sourceKind === "physical-asset",
    );
    const semantic = BASE_AUDIO_REVIEW_INVENTORY.filter(
      ({ sourceKind }) => sourceKind === "semantic-audio",
    );

    expect(physical).toHaveLength(50);
    expect(semantic.length).toBeGreaterThan(0);
    expect(BASE_AUDIO_REVIEW_VALIDATION.errors).toEqual([]);
    expect(
      BASE_AUDIO_REVIEW_INVENTORY.every(({ status }) => status === "pending"),
    ).toBe(true);
  });

  it.runIf(process.env.BASE_REQUIRE_INDEPENDENT_REVIEW === "1")(
    "blocks completion while independent naturalness or audio reviews are pending",
    () => {
      const pending = [
        ...BASE_NATURALNESS_REVIEW_INVENTORY,
        ...BASE_AUDIO_REVIEW_INVENTORY,
      ].filter(({ status }) => status === "pending");
      expect(pending).toHaveLength(0);
    },
  );
});
