import { describe, expect, it } from "vitest";
import type { AssembledToken } from "../../../romaji/types";
import type { BaseExample } from "../catalog/types";
import {
  BASE_ACTIVITY_OPERATION_BY_CATEGORY,
  semanticFingerprintFor,
} from "./fingerprints";

function token(
  id: string,
  jp: string,
  kind: AssembledToken["kind"] = "lexical",
  boundaryBefore: AssembledToken["boundaryBefore"] = "space",
): AssembledToken {
  return {
    id,
    jp,
    romaji: `r-${id}`,
    kind,
    boundaryBefore,
    source: { domain: "test", referenceId: id },
  };
}

function example(overrides: Partial<BaseExample> = {}): BaseExample {
  return {
    id: "first",
    tokens: [token("first-token", "Ａ　猫")],
    lexemeIds: ["noun-neko"],
    conceptIds: ["dictionary-lemma"],
    formIds: ["masu-nonpast"],
    patternCellIds: ["cell-1"],
    semanticFingerprint: "fake-author-supplied-value",
    teachingPurposeCopyId: "purpose-first",
    translationCopy: { copyId: "translation-first" },
    predicateAspect: "dynamic",
    interpretationTags: ["habitual"],
    semanticRoleIds: ["agent", "theme"],
    discourseFrameId: "routine-1",
    particleFrame: {
      predicateSenseId: "see",
      provided: { theme: "focus-subject-ga" },
    },
    ...overrides,
  } as BaseExample;
}

describe("Base canonical fingerprints", () => {
  it("is deterministic, immutable, and insensitive to cosmetic IDs and copy", () => {
    const first = example();
    const cosmetic = example({
      id: "second",
      tokens: [token("second-token", "A 猫")],
      teachingPurposeCopyId: "purpose-second",
      translationCopy: { copyId: "translation-second" },
      semanticFingerprint: "another-fake-value",
    } as unknown as Partial<BaseExample>);

    const before = JSON.stringify(first);
    expect(semanticFingerprintFor(first)).toBe(semanticFingerprintFor(cosmetic));
    expect(JSON.stringify(first)).toBe(before);
    expect(Object.isFrozen(BASE_ACTIVITY_OPERATION_BY_CATEGORY)).toBe(true);
    expect(BASE_ACTIVITY_OPERATION_BY_CATEGORY.ordering).toBe("order-chunks");
  });

  it("keeps form, role, and discourse distinctions in the canonical semantic key", () => {
    const first = example();
    const form = example({ formIds: ["te-imasu"] });
    const roles = example({ semanticRoleIds: ["topic"] });
    const discourse = example({ discourseFrameId: "one-off-2" });

    expect(semanticFingerprintFor(first)).not.toBe(semanticFingerprintFor(form));
    expect(semanticFingerprintFor(first)).not.toBe(semanticFingerprintFor(roles));
    expect(semanticFingerprintFor(first)).not.toBe(semanticFingerprintFor(discourse));
  });
});
