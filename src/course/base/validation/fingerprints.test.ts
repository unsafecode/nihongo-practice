import { describe, expect, it } from "vitest";
import type { AssembledToken } from "../../../romaji/types";
import type { BaseExample } from "../catalog/types";
import { validateParticleFrame } from "../forms/particleLicensing";
import {
  BASE_ACTIVITY_OPERATION_BY_CATEGORY,
  semanticFingerprintFor,
  visibleSurfaceFingerprint,
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
    predicateSenseId: null,
    predicateLexemeId: null,
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
    const form = example({ formIds: ["base-construction-te-imasu"] });
    const roles = example({ semanticRoleIds: ["topic"] });
    const discourse = example({ discourseFrameId: "one-off-2" });

    expect(semanticFingerprintFor(first)).not.toBe(semanticFingerprintFor(form));
    expect(semanticFingerprintFor(first)).not.toBe(semanticFingerprintFor(roles));
    expect(semanticFingerprintFor(first)).not.toBe(semanticFingerprintFor(discourse));
  });

  it("uses one NFKC-normalized visible surface regardless of token segmentation", () => {
    const singleToken = example({
      tokens: [token("single", "たべます")],
    });

    const segmented = example({
      tokens: [
        token("stem", "たべ", "lexical", "attach"),
        token("ending", "ます", "morpheme", "attach"),
      ],
    });

    expect(visibleSurfaceFingerprint(singleToken.tokens)).toBe("たべます");
    expect(visibleSurfaceFingerprint(segmented.tokens)).toBe("たべます");
    expect(semanticFingerprintFor(singleToken)).toBe(semanticFingerprintFor(segmented));
  });

  it("ignores terminal punctuation and whitespace in visible and semantic fingerprints", () => {
    const plain = example({ tokens: [token("plain", "なまえはなんですか")] });
    const punctuated = example({
      tokens: [
        token("spaced", " なまえ は なんですか "),
        token("punctuation", "？！", "punctuation"),
      ],
    });
    expect(visibleSurfaceFingerprint(punctuated.tokens)).toBe(
      visibleSurfaceFingerprint(plain.tokens),
    );
    expect(semanticFingerprintFor(punctuated)).toBe(
      semanticFingerprintFor(plain),
    );
  });

  it("filters explicit undefined particle values deterministically and rejects the malformed frame", () => {
    const malformed = example({
      particleFrame: {
        predicateSenseId: "eat",
        provided: { theme: undefined },
        attachmentLexemeIdByRole: { theme: "noun-gohan" },
      },
    });
    const missing = example({
      particleFrame: {
        predicateSenseId: "eat",
        provided: {},
        attachmentLexemeIdByRole: { theme: "noun-gohan" },
      },
    });

    expect(() => semanticFingerprintFor(malformed)).not.toThrow();
    expect(semanticFingerprintFor(malformed)).toBe(semanticFingerprintFor(missing));
    expect(
      validateParticleFrame("eat", { theme: undefined }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          expect.objectContaining({ code: "missing-role", role: "theme" }),
          expect.objectContaining({ code: "invalid-particle-frame", role: "theme" }),
        ]),
      }),
    );
  });

  it("fails closed when fingerprint input carries nullish runtime metadata", () => {
    const emptyTarget = {
      tokens: [],
      lexemeIds: [],
      conceptIds: [],
      formIds: [],
      patternCellIds: [],
      semanticRoleIds: [],
      interpretationTags: [],
    } as unknown as BaseExample;

    expect(() => semanticFingerprintFor(null as unknown as BaseExample)).not.toThrow();
    expect(semanticFingerprintFor(null as unknown as BaseExample)).toBe(
      semanticFingerprintFor(emptyTarget),
    );
  });

  it("normalizes only own plain-record particle entries without reading inherited values", () => {
    const inheritedProvided = Object.create({ theme: "object-o" }) as Record<string, unknown>;
    const inheritedFrame = Object.create({
      predicateSenseId: "eat",
      provided: inheritedProvided,
    }) as BaseExample["particleFrame"];
    const absent = example({ particleFrame: undefined });
    const inherited = example({
      particleFrame: inheritedFrame,
    });

    expect(() => semanticFingerprintFor(inherited)).not.toThrow();
    expect(semanticFingerprintFor(inherited)).toBe(semanticFingerprintFor(absent));
  });

  it("uses descriptor-extracted particle entries when normalizing hidden roles", () => {
    const hiddenProvided = {} as Record<string, unknown>;
    Object.defineProperty(hiddenProvided, "theme", {
      enumerable: false,
      value: "object-o",
    });
    const visible = example({
      particleFrame: {
        predicateSenseId: "eat",
        provided: { theme: "object-o" },
        attachmentLexemeIdByRole: { theme: "noun-gohan" },
      },
    });
    const hidden = example({
      particleFrame: {
        predicateSenseId: "eat",
        provided: hiddenProvided,
        attachmentLexemeIdByRole: { theme: "noun-gohan" },
      } as BaseExample["particleFrame"],
    });

    expect(semanticFingerprintFor(hidden)).toBe(semanticFingerprintFor(visible));
  });
});
