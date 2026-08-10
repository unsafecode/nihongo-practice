import { describe, expect, it } from "vitest";
import { realizePoliteGrid } from "../forms/verbForms";
import {
  BASE_REFERENCE_CATALOG,
  BASE_REFERENCE_IDS,
  referenceById,
  validateBaseReferenceCatalog,
  type BaseReferenceCatalog,
} from "./catalog";

function mutableCatalog(): BaseReferenceCatalog {
  return structuredClone(BASE_REFERENCE_CATALOG) as BaseReferenceCatalog;
}

describe("Base reference catalog", () => {
  it("publishes exactly the five required references in canonical order", () => {
    expect(BASE_REFERENCE_IDS).toEqual([
      "sentence-anatomy",
      "particle-atlas",
      "verb-classes-conjugation",
      "tense-polarity",
      "adjective-copula",
    ]);
    expect(BASE_REFERENCE_CATALOG.map(({ id }) => id)).toEqual(BASE_REFERENCE_IDS);
  });

  it("declares complete progressive entry metadata", () => {
    for (const reference of BASE_REFERENCE_CATALOG) {
      expect(reference.entries.length).toBeGreaterThan(0);
      for (const entry of reference.entries) {
        expect(entry.semanticId).not.toBe("");
        expect(entry.firstTeachLessonId).not.toBe("");
        expect(Array.isArray(entry.prerequisiteEntryIds)).toBe(true);
        expect(entry.copyId).not.toBe("");
        for (const locale of ["en", "it"] as const) {
          expect(entry.copy[locale].label).not.toBe("");
          expect(entry.copy[locale].explanation).not.toBe("");
        }
        expect(Array.isArray(entry.canonicalFormCells)).toBe(true);
        expect(Array.isArray(entry.contrastIds)).toBe(true);
        expect(Array.isArray(entry.exampleIds)).toBe(true);
      }
    }
    expect(validateBaseReferenceCatalog(BASE_REFERENCE_CATALOG)).toEqual([]);
  });

  it("derives tense-polarity cells exactly from the canonical writing verb", () => {
    const expected = realizePoliteGrid("verb-kaku");
    expect(expected.ok).toBe(true);
    if (!expected.ok) return;
    expect(referenceById["tense-polarity"].cells.map(({ tokens }) => tokens)).toEqual(
      Object.values(expected.value),
    );
  });

  it("covers every required subject across all five references", () => {
    expect(referenceById["sentence-anatomy"].entries.map(({ semanticId }) => semanticId)).toEqual(
      expect.arrayContaining([
        "base-sentence-chunks",
        "base-sentence-topic-subject-status",
        "base-sentence-modifier-order",
        "base-sentence-predicate-types",
        "base-sentence-endings",
      ]),
    );
    expect(
      referenceById["verb-classes-conjugation"].entries.map(({ semanticId }) => semanticId),
    ).toEqual(
      expect.arrayContaining([
        "base-verb-dictionary-form",
        "base-verb-class-godan",
        "base-verb-class-ichidan",
        "base-verb-class-suru",
        "base-verb-class-kuru",
        "base-verb-exceptions",
        "base-verb-polite-stems",
        "base-verb-polite-forms",
        "base-verb-te-forms",
        "base-verb-te-imasu",
      ]),
    );
    expect(referenceById["adjective-copula"].entries.map(({ semanticId }) => semanticId)).toEqual(
      expect.arrayContaining([
        "base-copula-reviewed-affirmative",
        "base-copula-noun-predicate-grid",
        "base-adjective-i-grid",
        "base-adjective-na-grid",
      ]),
    );
    expect(referenceById["particle-atlas"].entries.map(({ semanticId }) => semanticId)).toEqual([
      "base-particle-wa",
      "base-particle-ga",
      "base-particle-no-possessive-attributive",
      "base-particle-mo",
      "base-particle-to-nominal-listing",
      "base-particle-to-companion",
      "base-particle-ka",
      "base-particle-o",
      "base-particle-ni-goal",
      "base-particle-he",
      "base-particle-de-action-place",
      "base-particle-de-means",
      "base-particle-ni-time",
      "base-particle-kara",
      "base-particle-made",
      "base-particle-existence-ni",
      "base-particle-existential-ga",
    ]);
  });

  it("is deeply immutable", () => {
    expect(Object.isFrozen(BASE_REFERENCE_CATALOG)).toBe(true);
    expect(Object.isFrozen(BASE_REFERENCE_CATALOG[0].entries)).toBe(true);
    expect(Object.isFrozen(BASE_REFERENCE_CATALOG[0].entries[0].copy.en)).toBe(true);
    expect(Object.getPrototypeOf(referenceById)).toBeNull();
    expect(() =>
      (BASE_REFERENCE_CATALOG[0].entries as unknown as unknown[]).push({}),
    ).toThrow();
  });

  it("rejects duplicate semantic IDs and unresolved contrasts or examples", () => {
    const duplicate = mutableCatalog();
    (duplicate[1].entries[0] as { semanticId: string }).semanticId =
      duplicate[0].entries[0].semanticId;
    expect(validateBaseReferenceCatalog(duplicate)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "duplicate-semantic-id" })]),
    );

    const badContrast = mutableCatalog();
    (badContrast[0].entries[0].contrastIds as string[]).push("missing-contrast");
    expect(validateBaseReferenceCatalog(badContrast)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-contrast-reference" }),
      ]),
    );

    const badExample = mutableCatalog();
    (badExample[0].entries[0].exampleIds as string[]).push("missing-example");
    expect(validateBaseReferenceCatalog(badExample)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-example-reference" }),
      ]),
    );
  });

  it("fails closed for getter, prototype, sparse-array, and proxy inputs", () => {
    let getterReads = 0;
    const getterCatalog = Object.defineProperty({}, "entries", {
      enumerable: true,
      get() {
        getterReads += 1;
        return [];
      },
    });
    expect(() => validateBaseReferenceCatalog(getterCatalog)).not.toThrow();
    expect(getterReads).toBe(0);
    expect(validateBaseReferenceCatalog(getterCatalog)[0]?.code).toBe("invalid-catalog-shape");

    const inherited = Object.create({ id: "sentence-anatomy" });
    inherited.entries = [];
    expect(validateBaseReferenceCatalog([inherited])[0]?.code).toBe(
      "invalid-reference-shape",
    );

    const sparse: unknown[] = [];
    sparse.length = 1;
    expect(validateBaseReferenceCatalog(sparse)[0]?.code).toBe("invalid-catalog-shape");

    const hostile = new Proxy([], {
      getPrototypeOf() {
        throw new Error("prototype trap");
      },
    });
    expect(() => validateBaseReferenceCatalog(hostile)).not.toThrow();
    expect(validateBaseReferenceCatalog(hostile)[0]?.code).toBe("invalid-catalog-shape");
  });
});
