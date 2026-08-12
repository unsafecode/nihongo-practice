/**
 * A1 Can-do containment (Task 16).
 *
 * The four Foundations Can-dos — `sentence-foundations`, `topic-questions`,
 * `polite-verbs`, `time-movement` — plus the phonetic `sounds` outcome moved to
 * Base with their modules. A1's released catalogue no longer authors them; Base
 * does, under the *same* ids and the *same* descriptor copy ids, so no published
 * identifier changed. These tests assert both halves of that hand-over: A1 has
 * genuinely let go, and Base genuinely publishes an equivalent outcome.
 */

import { describe, expect, it } from "vitest";

import { BASE_LESSON_IDS_BY_MODULE } from "../../base/manifest";
import { baseCanDoById, baseCanDos } from "../../base/catalog/canDos";
import { A1_RETAINED_MODULE_IDS } from "../manifest";
import { a1SharedCopy } from "./a1CopyGloss";
import { a1CanDos } from "./a1SemanticCatalog";
import {
  A1_EXPANDED_FOUNDATION_CANDO_IDS,
  a1CanDosAuthored,
  a1ExpandedFoundationCanDos,
} from "./canDos";
import {
  A1_EXPANDED_FOUNDATION_CANDO_IDS as checkpointCanDoIds,
  a1Checkpoint,
} from "./checkpoint";

const REHOMED_CANDO_IDS = [
  "a1-can-do-sounds",
  "a1-can-do-sentence-foundations",
  "a1-can-do-topic-questions",
  "a1-can-do-polite-verbs",
  "a1-can-do-time-movement",
] as const;

const REHOMED_MODULE_BY_CANDO = {
  "a1-can-do-sounds": "sounds",
  "a1-can-do-sentence-foundations": "sentence-foundations",
  "a1-can-do-topic-questions": "topic-questions",
  "a1-can-do-polite-verbs": "polite-verbs",
  "a1-can-do-time-movement": "time-movement",
} as const;

describe("rehomed Foundations Can-dos", () => {
  it("is no longer published, sampled, or lesson-mapped by A1", () => {
    expect(A1_EXPANDED_FOUNDATION_CANDO_IDS).toEqual([]);
    expect(checkpointCanDoIds).toBe(A1_EXPANDED_FOUNDATION_CANDO_IDS);
    expect(a1ExpandedFoundationCanDos).toEqual([]);

    const publishedIds = a1CanDosAuthored.map(({ id }) => id);
    for (const canDoId of REHOMED_CANDO_IDS) {
      expect(publishedIds, canDoId).not.toContain(canDoId);
      expect(a1Checkpoint.sampledCanDoIds, canDoId).not.toContain(canDoId);
    }

    // Every A1 Can-do that remains maps only to retained A1 modules.
    const retainedModules = new Set<string>(A1_RETAINED_MODULE_IDS);
    for (const canDo of a1CanDosAuthored) {
      for (const lessonId of canDo.lessonIds) {
        expect(
          retainedModules.has(lessonId.slice(0, lessonId.lastIndexOf("-"))),
          `${canDo.id} → ${lessonId}`,
        ).toBe(true);
      }
    }
  });

  it("is published by Base under the same ids, descriptors, and bilingual copy", () => {
    const stubById = new Map(a1CanDos.map((stub) => [stub.id, stub]));

    for (const canDoId of REHOMED_CANDO_IDS) {
      const baseCanDo = baseCanDoById.get(canDoId);
      const stub = stubById.get(canDoId);

      expect(baseCanDo, canDoId).toBeDefined();
      expect(stub, canDoId).toBeDefined();
      expect(baseCanDo?.level).toBe("a0");
      // The published descriptor copy id is unchanged by the hand-over.
      expect(baseCanDo?.descriptorCopyId).toBe(stub?.descriptorCopyId);
      expect(baseCanDo?.lessonIds).toEqual(
        BASE_LESSON_IDS_BY_MODULE[REHOMED_MODULE_BY_CANDO[canDoId]],
      );
      expect(baseCanDo?.sourceNote).toBe("product-authored-jf-cefr-aligned");
      expect(baseCanDo?.checkpointEvidenceRule.evidenceKind).toBe("checkpoint-sampled");
      expect(a1SharedCopy.en[stub!.descriptorCopyId]?.trim()).not.toBe("");
      expect(a1SharedCopy.it[stub!.descriptorCopyId]?.trim()).not.toBe("");
    }

    expect(baseCanDos.map(({ id }) => id)).toEqual(
      expect.arrayContaining([...REHOMED_CANDO_IDS]),
    );
  });

  it("keeps every retained A1 Can-do sampled with bilingual descriptor copy", () => {
    expect(a1CanDosAuthored.length).toBeGreaterThan(0);

    for (const canDo of a1CanDosAuthored) {
      expect(a1Checkpoint.sampledCanDoIds, canDo.id).toContain(canDo.id);
      expect(canDo.contextIds.length, canDo.id).toBeGreaterThan(0);
      expect(canDo.sourceNote).toBe("product-authored-jf-cefr-aligned");
      expect(a1SharedCopy.en[canDo.descriptorCopyId]?.trim()).not.toBe("");
      expect(a1SharedCopy.it[canDo.descriptorCopyId]?.trim()).not.toBe("");
    }
  });
});
