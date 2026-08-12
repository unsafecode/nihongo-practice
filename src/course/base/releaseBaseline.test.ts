import { createHash } from "crypto";
import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import {
  A1_LESSON_IDS,
  A1_LESSON_IDS_BY_MODULE,
  A1_MODULE_IDS,
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_MODULE_IDS,
} from "../a1/manifest";
import { A2_LESSON_IDS } from "../a2/manifest";
import { BASE_LESSON_IDS_BY_MODULE, BASE_MODULE_IDS } from "./manifest";
import { V4_ACTIVITY_INVENTORY } from "./migration/v4ActivityInventory";

/**
 * The five modules Task 16 rehomed from A1 into Base. They are named once here
 * and then cross-checked from *both* levels' manifests, so a module that
 * silently reappears in A1 — or silently disappears from Base — fails this
 * baseline rather than passing on a one-sided derivation.
 */
const REHOMED_MODULE_IDS = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
] as const;

/** The twenty rehomed routes, derived from *Base's* published manifest. */
const REHOMED_LESSON_IDS = REHOMED_MODULE_IDS.flatMap(
  (moduleId) => BASE_LESSON_IDS_BY_MODULE[moduleId] ?? [],
);

/** The forty-four retained routes, derived from A1's canonical manifest. */
const RETAINED_LESSON_IDS = A1_RETAINED_MODULE_IDS.flatMap(
  (moduleId) => A1_LESSON_IDS_BY_MODULE[moduleId],
);

describe("Base release baseline", () => {
  it("splits the 64 published V4 A1 routes into 20 Base-owned and 44 A1-retained", () => {
    // Base publishes all five rehomed modules, and A1 publishes none of them.
    for (const moduleId of REHOMED_MODULE_IDS) {
      expect(BASE_MODULE_IDS, moduleId).toContain(moduleId);
      expect(A1_RETAINED_MODULE_IDS, moduleId).not.toContain(moduleId);
      // The canonical A1 authoring manifest still records the module, so the
      // published route ids and positions are provably unchanged.
      expect(A1_MODULE_IDS, moduleId).toContain(moduleId);
    }

    expect(REHOMED_LESSON_IDS).toHaveLength(20);
    expect(RETAINED_LESSON_IDS).toHaveLength(44);
    expect(RETAINED_LESSON_IDS).toEqual(A1_RETAINED_LESSON_IDS);

    // Disjoint …
    expect(
      REHOMED_LESSON_IDS.filter((lessonId) => RETAINED_LESSON_IDS.includes(lessonId)),
    ).toEqual([]);
    // … and their union is exactly the 64 original published A1 route ids.
    expect(new Set([...REHOMED_LESSON_IDS, ...RETAINED_LESSON_IDS]).size).toBe(64);
    expect([...REHOMED_LESSON_IDS, ...RETAINED_LESSON_IDS].sort()).toEqual(
      [...A1_LESSON_IDS].sort(),
    );
    expect(A1_LESSON_IDS).toHaveLength(64);
  });

  it("locks the frozen V4 activity inventory to exactly the rehomed routes", () => {
    const inventoryLessonIds = [...new Set(V4_ACTIVITY_INVENTORY.map((row) => row.lessonId))];
    expect(inventoryLessonIds.sort()).toEqual([...REHOMED_LESSON_IDS].sort());
  });

  it("locks the A2 editorial checksum and route count", () => {
    const a2EditorialSurfaces = readFileSync(
      new URL("../a2/catalog/a2EditorialSurfaces.golden.json", import.meta.url),
      "utf8",
    );
    expect(createHash("sha256").update(a2EditorialSurfaces).digest("hex")).toBe(
      "6ce32b1fd05ead0c10f494549e090d1cf7328734e2cc9041635f320270b2b38f",
    );
    expect(
      readFileSync(new URL("../../../.gitattributes", import.meta.url), "utf8"),
    ).toContain("src/course/a2/catalog/a2EditorialSurfaces.golden.json text eol=lf");
    expect(A2_LESSON_IDS).toHaveLength(60);
  });
});
