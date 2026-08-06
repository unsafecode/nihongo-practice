import { createHash } from "crypto";
import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { A1_LESSON_IDS_BY_MODULE, A1_MODULE_IDS } from "../a1/manifest";
import { A2_LESSON_IDS } from "../a2/manifest";
import { V4_ACTIVITY_INVENTORY } from "./migration/v4ActivityInventory";

const REHOMED_MODULE_IDS = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
] as const;

const REHOMED_LESSON_IDS = REHOMED_MODULE_IDS.flatMap(
  (moduleId) => A1_LESSON_IDS_BY_MODULE[moduleId],
);

const OTHER_LESSON_IDS = A1_MODULE_IDS.flatMap((moduleId) =>
  REHOMED_MODULE_IDS.includes(moduleId as (typeof REHOMED_MODULE_IDS)[number])
    ? []
    : A1_LESSON_IDS_BY_MODULE[moduleId],
);

describe("Base release baseline", () => {
  it("locks the current A1 module split and A2 editorial checksum", () => {
    expect(REHOMED_LESSON_IDS).toHaveLength(20);
    expect(OTHER_LESSON_IDS).toHaveLength(44);
    expect(new Set([...REHOMED_LESSON_IDS, ...OTHER_LESSON_IDS])).toHaveLength(64);

    const inventoryLessonIds = [...new Set(V4_ACTIVITY_INVENTORY.map((row) => row.lessonId))];
    expect(inventoryLessonIds.sort()).toEqual([...REHOMED_LESSON_IDS].sort());

    const a2EditorialSurfaces = readFileSync(
      new URL("../a2/catalog/a2EditorialSurfaces.golden.json", import.meta.url),
      "utf8",
    );
    expect(createHash("sha256").update(a2EditorialSurfaces).digest("hex")).toBe(
      "6ce32b1fd05ead0c10f494549e090d1cf7328734e2cc9041635f320270b2b38f",
    );
    expect(A2_LESSON_IDS).toHaveLength(60);
  });
});
