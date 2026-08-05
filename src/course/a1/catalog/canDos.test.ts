import { describe, expect, it } from "vitest";

import { A1_EXPANDED_LESSON_IDS_BY_MODULE } from "../manifest";
import { a1SharedCopy } from "./a1CopyGloss";
import {
  A1_EXPANDED_FOUNDATION_CANDO_IDS,
  a1CanDosAuthored,
  a1ExpandedFoundationCanDos,
} from "./canDos";
import {
  A1_EXPANDED_FOUNDATION_CANDO_IDS as checkpointCanDoIds,
  a1Checkpoint,
} from "./checkpoint";

const EXPECTED_CANDO_IDS = [
  "a1-can-do-sentence-foundations",
  "a1-can-do-topic-questions",
  "a1-can-do-polite-verbs",
  "a1-can-do-time-movement",
];

describe("published Foundations Can-dos", () => {
  it("maps every Foundations module to one practical, bilingual Can-do", () => {
    expect(A1_EXPANDED_FOUNDATION_CANDO_IDS).toEqual(EXPECTED_CANDO_IDS);
    expect(checkpointCanDoIds).toBe(A1_EXPANDED_FOUNDATION_CANDO_IDS);
    expect(a1ExpandedFoundationCanDos).toEqual([
      expect.objectContaining({
        id: "a1-can-do-sentence-foundations",
        domain: "spoken-production",
        lessonIds: A1_EXPANDED_LESSON_IDS_BY_MODULE["sentence-foundations"],
      }),
      expect.objectContaining({
        id: "a1-can-do-topic-questions",
        domain: "interaction",
        lessonIds: A1_EXPANDED_LESSON_IDS_BY_MODULE["topic-questions"],
      }),
      expect.objectContaining({
        id: "a1-can-do-polite-verbs",
        domain: "spoken-production",
        lessonIds: A1_EXPANDED_LESSON_IDS_BY_MODULE["polite-verbs"],
      }),
      expect.objectContaining({
        id: "a1-can-do-time-movement",
        domain: "spoken-production",
        lessonIds: A1_EXPANDED_LESSON_IDS_BY_MODULE["time-movement"],
      }),
    ]);

    for (const canDo of a1ExpandedFoundationCanDos) {
      expect(canDo.contextIds.length).toBeGreaterThan(0);
      expect(canDo.sourceNote).toBe("product-authored-jf-cefr-aligned");
      expect(canDo.checkpointEvidenceRule).toEqual({
        evidenceKind: "checkpoint-sampled",
        minAcceptedTransferTargets: 3,
      });
      expect(a1SharedCopy.en[canDo.descriptorCopyId]?.trim()).not.toBe("");
      expect(a1SharedCopy.it[canDo.descriptorCopyId]?.trim()).not.toBe("");
    }
  });

  it("includes Foundations Can-dos and their checkpoint coverage in the published release", () => {
    const publishedIds = a1CanDosAuthored.map(({ id }) => id);

    expect(publishedIds).toEqual(
      expect.arrayContaining([...A1_EXPANDED_FOUNDATION_CANDO_IDS]),
    );
    expect(a1Checkpoint.sampledCanDoIds).toEqual(
      expect.arrayContaining([...A1_EXPANDED_FOUNDATION_CANDO_IDS]),
    );
  });
});
