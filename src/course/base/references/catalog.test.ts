import { describe, expect, it } from "vitest";
import {
  realizeIAdjectivePredicate,
  realizeNaAdjectivePredicate,
  realizeOwnedNounPredicate,
} from "../forms/adjectiveForms";
import {
  realizePoliteGrid,
  realizePoliteStem,
  realizeTeConstruction,
  realizeVerbDictionary,
} from "../forms/verbForms";
import {
  BASE_REFERENCE_COPY_BY_ID,
  BASE_REFERENCE_EXAMPLE_CONTRACTS,
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

  it("derives dictionary, stem, and te rows from their canonical verb engines", () => {
    const dictionary = realizeVerbDictionary("verb-kaku");
    const stem = realizePoliteStem("verb-kaku");
    const te = realizeTeConstruction("verb-kaku", "te");
    expect(dictionary.ok && stem.ok && te.ok).toBe(true);
    if (!dictionary.ok || !stem.ok || !te.ok) return;
    const cellsFor = (semanticId: string) =>
      referenceById["verb-classes-conjugation"].entries.find(
        (entry) => entry.semanticId === semanticId,
      )!.canonicalFormCells;
    expect(cellsFor("base-verb-dictionary-form")[0]?.tokens).toEqual(dictionary.value);
    expect(cellsFor("base-verb-polite-stems")[0]?.tokens).toEqual(stem.value);
    expect(cellsFor("base-verb-te-forms")[0]?.tokens).toEqual(te.value);
  });

  it("resolves every consumed copy ID and assigns examples only at eligible owners", () => {
    const consumedCopyIds = new Set(
      BASE_REFERENCE_CATALOG.flatMap((reference) => [
        reference.copyId,
        ...reference.entries.map(({ copyId }) => copyId),
      ]),
    );
    expect([...BASE_REFERENCE_COPY_BY_ID.keys()].sort()).toEqual(
      [...consumedCopyIds].sort(),
    );
    for (const reference of BASE_REFERENCE_CATALOG) {
      for (const item of [reference, ...reference.entries]) {
        const copy = BASE_REFERENCE_COPY_BY_ID.get(item.copyId);
        expect(copy?.en.label.trim()).not.toBe("");
        expect(copy?.en.explanation.trim()).not.toBe("");
        expect(copy?.it.label.trim()).not.toBe("");
        expect(copy?.it.explanation.trim()).not.toBe("");
      }
      for (const entry of reference.entries) {
        expect(entry.exampleIds).toHaveLength(1);
        expect(
          BASE_REFERENCE_EXAMPLE_CONTRACTS.find(
            ({ id }) => id === entry.exampleIds[0],
          )?.firstTeachLessonId,
        ).toBe(entry.firstTeachLessonId);
      }
    }

    const catalog = mutableCatalog();
    (catalog[0].entries[0] as unknown as { exampleIds: string[] }).exampleIds = [
      BASE_REFERENCE_EXAMPLE_CONTRACTS.at(-1)!.id,
    ];
    expect(validateBaseReferenceCatalog(catalog)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-example-reference" }),
      ]),
    );

    const badCopy = mutableCatalog();
    (badCopy[0] as unknown as { copyId: string }).copyId = "missing-copy";
    expect(validateBaseReferenceCatalog(badCopy)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-reference-shape" }),
      ]),
    );
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
    const grid = referenceById["tense-polarity"].entries.find(
      ({ semanticId }) => semanticId === "base-tense-polite-grid",
    )!;
    expect(grid.canonicalFormCells.map(({ tokens }) => tokens)).toEqual(
      Object.values(expected.value),
    );
  });

  it("keeps every reference row meaningful, eligible, and sourced at its first teach point", () => {
    for (const reference of BASE_REFERENCE_CATALOG) {
      expect(reference.columns.length).toBeGreaterThan(0);
      for (const entry of reference.entries) {
        expect(entry.canonicalFormCells.length).toBeGreaterThan(0);
        expect(entry.exampleIds.length).toBeGreaterThan(0);
      }
    }

    const dictionary = referenceById["verb-classes-conjugation"].entries.find(
      ({ semanticId }) => semanticId === "base-verb-dictionary-form",
    );
    expect(dictionary?.firstTeachLessonId).toBe("polite-verbs-2");

    const timeMovement = referenceById["verb-classes-conjugation"].entries.find(
      ({ semanticId }) => semanticId === "base-verb-exceptions",
    );
    expect(timeMovement?.firstTeachLessonId).toBe("requests-connection-1");
  });

  it("preserves canonical predicate cell functions and form-engine output", () => {
    const noun = realizeOwnedNounPredicate("noun-gakusei");
    const iAdjective = realizeIAdjectivePredicate("adjective-takai");
    const naAdjective = realizeNaAdjectivePredicate("adjective-shizuka");
    expect(noun.ok && iAdjective.ok && naAdjective.ok).toBe(true);
    if (!noun.ok || !iAdjective.ok || !naAdjective.ok) return;

    const entries = referenceById["adjective-copula"].entries;
    const cellsFor = (semanticId: string) =>
      entries.find((entry) => entry.semanticId === semanticId)!.canonicalFormCells;
    expect(cellsFor("base-copula-reviewed-affirmative")[0]).toMatchObject({
      tokens: noun.value.affirmative.tokens,
      desuFunction: "copula",
    });
    expect(cellsFor("base-adjective-i-grid")[0]).toMatchObject({
      tokens: iAdjective.value.affirmative.tokens,
      desuFunction: "politeness-marker",
    });
    expect(cellsFor("base-adjective-na-grid")[0]).toMatchObject({
      tokens: naAdjective.value.affirmative.tokens,
      desuFunction: "copula",
    });
    expect(
      [
        ...cellsFor("base-copula-reviewed-affirmative"),
        ...cellsFor("base-copula-noun-predicate-grid"),
      ].map(({ tokens }) => tokens),
    ).toEqual(Object.values(noun.value).map(({ tokens }) => tokens));
    expect(cellsFor("base-adjective-i-grid").map(({ tokens }) => tokens)).toEqual(
      Object.values(iAdjective.value).map(({ tokens }) => tokens),
    );
    expect(
      cellsFor("base-adjective-na-grid")
        .slice(0, 4)
        .map(({ tokens }) => tokens),
    ).toEqual(Object.values(naAdjective.value).map(({ tokens }) => tokens));
    expect(
      cellsFor("base-adjective-i-grid")
        .flatMap(({ tokens }) => tokens)
        .map(({ jp }) => jp)
        .join(""),
    ).not.toContain("高いだ");
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
      "base-particle-topic-wa",
      "base-particle-focus-subject-ga",
      "base-particle-possessive-attributive-no",
      "base-particle-additive-mo",
      "base-particle-listing-to",
      "base-particle-nominal-to",
      "base-particle-companion-to",
      "base-particle-question-ka",
      "base-particle-object-o",
      "base-particle-goal-ni",
      "base-particle-direction-he",
      "base-particle-action-place-de",
      "base-particle-means-de",
      "base-particle-time-ni",
      "base-particle-source-kara",
      "base-particle-limit-made",
      "base-particle-existence-location-ni",
      "base-particle-existential-subject-ga",
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
