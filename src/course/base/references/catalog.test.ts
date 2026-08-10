import { describe, expect, it } from "vitest";
import { formatRomaji } from "../../../romaji/formatRomaji";
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
  BASE_REFERENCE_ELIGIBLE_EXAMPLE_IDS,
  BASE_REFERENCE_EXAMPLES,
  BASE_REFERENCE_CATALOG,
  BASE_REFERENCE_IDS,
  inspectBaseReferenceCatalog,
  referenceById,
  validateBaseReferenceCatalog,
  type BaseReferenceCatalog,
} from "./catalog";
import { BASE_CONCEPT_BY_ID } from "../catalog/concepts";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import { baseCanonicalPosition } from "../manifest";

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

  it("owns a non-empty entry at every reference first-teach lesson", () => {
    for (const reference of BASE_REFERENCE_CATALOG) {
      expect(
        reference.entries.some(
          ({ firstTeachLessonId }) =>
            firstTeachLessonId === reference.firstTeachLessonId,
        ),
      ).toBe(true);
    }
    expect(BASE_LEXEME_BY_ID.get("verb-kaku")?.firstTeachLessonId).toBe(
      "polite-verbs-1",
    );

    const emptyFirstTeach = mutableCatalog();
    (emptyFirstTeach[0] as { firstTeachLessonId: string }).firstTeachLessonId =
      "sounds-4";
    expect(validateBaseReferenceCatalog(emptyFirstTeach)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-first-teach-entry" }),
      ]),
    );
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
    expect(cellsFor("base-verb-dictionary-form")[0]?.sourceContentIds).toContain(
      "dictionary-lemma",
    );
    expect(
      cellsFor("base-verb-class-suru").find(({ id }) => id === "verb-stem-suru")
        ?.sourceContentIds,
    ).toContain("polite-stems");
    const sequential = cellsFor("base-verb-sequential-te")[0];
    expect(sequential?.sourceContentIds).toContain("sequential-te");
    expect(sequential?.sourceContentIds).not.toContain("te-allomorphy");
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
          BASE_REFERENCE_EXAMPLES.find(
            ({ id }) => id === entry.exampleIds[0],
          )?.firstTeachLessonId,
        ).toBe(entry.firstTeachLessonId);
      }
    }

    const catalog = mutableCatalog();
    (catalog[0].entries[0] as unknown as { exampleIds: string[] }).exampleIds = [
      BASE_REFERENCE_EXAMPLES.at(-1)!.id,
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

  it("returns a deeply immutable sanitized catalog snapshot", () => {
    expect(inspectBaseReferenceCatalog).toBeTypeOf("function");
    if (typeof inspectBaseReferenceCatalog !== "function") return;
    const inspection = inspectBaseReferenceCatalog(mutableCatalog());
    expect(inspection.errors).toEqual([]);
    expect(inspection.catalog).not.toBeNull();
    expect(inspection.examples).not.toBeNull();
    expect(Object.isFrozen(inspection)).toBe(true);
    expect(Object.isFrozen(inspection.catalog)).toBe(true);
    expect(Object.isFrozen(inspection.catalog![0].entries)).toBe(true);
    expect(Object.isFrozen(inspection.catalog![0].entries[0].copy.en)).toBe(true);
    expect(Object.isFrozen(inspection.examples)).toBe(true);
    expect(() =>
      (inspection.catalog![0].entries as unknown as unknown[]).push({}),
    ).toThrow();
    expect(inspectBaseReferenceCatalog()).toBe(inspectBaseReferenceCatalog());

    const supplied = mutableCatalog();
    const first = inspectBaseReferenceCatalog(supplied);
    (supplied[0].entries[0].sourceContentIds as string[]).push("te-imasu");
    const second = inspectBaseReferenceCatalog(supplied);
    expect(second).not.toBe(first);
    expect(second.catalog).toBeNull();
    expect(second.errors.length).toBeGreaterThan(0);
  });

  it("derives tense-polarity cells exactly from the canonical writing verb", () => {
    const expected = realizePoliteGrid("verb-kaku");
    expect(expected.ok).toBe(true);
    if (!expected.ok) return;
    const grid = referenceById["tense-polarity"].entries.find(
      ({ semanticId }) => semanticId === "base-tense-polite-grid",
    )!;
    const dynamic = referenceById["tense-polarity"].entries.find(
      ({ semanticId }) => semanticId === "base-tense-dynamic-nonpast",
    )!;
    expect(dynamic.canonicalFormCells.map(({ tokens }) => tokens)).toEqual([
      expected.value.affirmative,
    ]);
    expect(grid.canonicalFormCells.map(({ tokens }) => tokens)).toEqual(
      Object.values(expected.value).slice(1),
    );
    expect(referenceById["tense-polarity"].cells.map(({ tokens }) => tokens)).toEqual(
      Object.values(expected.value),
    );
  });

  it("publishes every entry cell without lossy last-wins dedupe", () => {
    for (const reference of BASE_REFERENCE_CATALOG) {
      const expected = reference.entries.flatMap(
        ({ canonicalFormCells }) => canonicalFormCells,
      );
      expect(reference.cells).toHaveLength(expected.length);
      expect(reference.cells.map(({ id }) => id)).toEqual(
        expected.map(({ id }) => id),
      );
      expect(reference.cells.map(({ sourceContentIds }) => sourceContentIds)).toEqual(
        expected.map(({ sourceContentIds }) => sourceContentIds),
      );
    }
    expect(referenceById["tense-polarity"].cells).toHaveLength(4);
    expect(referenceById["tense-polarity"].cells[0].sourceContentIds).toContain(
      "dynamic-nonpast-semantics",
    );
    expect(
      referenceById["tense-polarity"].cells
        .slice(1)
        .every(({ sourceContentIds }) =>
          sourceContentIds.includes("four-polite-tense-cells"),
        ),
    ).toBe(true);
  });

  it("rejects divergent non-last entry duplicates using the complete cell fingerprint", () => {
    type MutableEntryCell = {
      id: string;
      columnId: string;
      copy: {
        en: { label: string; explanation: string };
        it: { label: string; explanation: string };
      };
      tokens: {
        id: string;
        jp: string;
        romaji: string;
        kind: "lexical" | "particle" | "morpheme" | "punctuation";
        boundaryBefore: "attach" | "space";
        source: {
          domain: "catalog" | "exercise";
          referenceId: string;
        };
        reading?: string;
      }[];
      sourceContentIds: string[];
      desuFunction?: "politeness-marker" | "copula";
    };
    const forgedNonLastDuplicate = (
      mutate: (cell: MutableEntryCell) => void,
      entryIndex = 0,
    ) => {
      const catalog = mutableCatalog();
      const cells = catalog[0].entries[entryIndex]
        .canonicalFormCells as unknown as MutableEntryCell[];
      const forged = structuredClone(cells[0]);
      mutate(forged);
      cells.unshift(forged);
      return catalog;
    };
    const predicateEntryIndex = BASE_REFERENCE_CATALOG[0].entries.findIndex(
      ({ semanticId }) => semanticId === "base-sentence-predicate-types",
    );

    const catalogs = [
      forgedNonLastDuplicate((cell) => {
        cell.columnId = "topic";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.copy.en.label = "Forged";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.tokens[0].id = "forged-token-id";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.tokens[0].jp = "せんせい";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.tokens[0].romaji = "sensei";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.tokens[0].kind = "particle";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.tokens[0].boundaryBefore = "space";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.tokens[0].source.domain = "exercise";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.tokens[0].source.referenceId = "noun-sensei";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.tokens[0].reading = "forged";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.sourceContentIds = ["noun-sensei"];
      }),
      forgedNonLastDuplicate((cell) => {
        cell.desuFunction = "copula";
      }),
      forgedNonLastDuplicate((cell) => {
        cell.tokens.reverse();
      }, predicateEntryIndex),
    ];
    for (const catalog of catalogs) {
      expect(validateBaseReferenceCatalog(catalog)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "duplicate-cell-id" }),
        ]),
      );
    }
  });

  it("publishes real owned examples rather than circular ID reservations", () => {
    expect(BASE_REFERENCE_EXAMPLES).toHaveLength(
      BASE_REFERENCE_CATALOG.flatMap(({ entries }) => entries).length,
    );
    for (const example of BASE_REFERENCE_EXAMPLES) {
      expect(example.tokens.length).toBeGreaterThan(0);
      expect(example.sourceContentIds.length).toBeGreaterThan(0);
      const ownerPosition = baseCanonicalPosition(example.firstTeachLessonId);
      expect(ownerPosition).not.toBeNull();
      for (const sourceContentId of example.sourceContentIds) {
        const source =
          BASE_CONCEPT_BY_ID.get(sourceContentId) ??
          BASE_LEXEME_BY_ID.get(sourceContentId);
        expect(source).toBeDefined();
        expect(baseCanonicalPosition(source!.firstTeachLessonId)).toBeLessThanOrEqual(
          ownerPosition!,
        );
      }
    }
  });

  it("publishes formatter-valid tokens for every cell and example", () => {
    for (const reference of BASE_REFERENCE_CATALOG) {
      for (const publishedCell of reference.cells) {
        expect(formatRomaji(publishedCell.tokens)).toMatchObject({ ok: true });
      }
      for (const entry of reference.entries) {
        for (const formCell of entry.canonicalFormCells) {
          expect(formatRomaji(formCell.tokens)).toMatchObject({ ok: true });
        }
      }
    }
    for (const example of BASE_REFERENCE_EXAMPLES) {
      expect(formatRomaji(example.tokens)).toMatchObject({ ok: true });
    }
  });

  it("fails closed for invalid cell and example token sequences", () => {
    const invalidCellCatalog = mutableCatalog();
    const invalidCellToken = invalidCellCatalog[0].entries[0]
      .canonicalFormCells[0].tokens[0] as unknown as {
      boundaryBefore: "attach" | "space";
    };
    invalidCellToken.boundaryBefore = "space";
    expect(validateBaseReferenceCatalog(invalidCellCatalog)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-token-sequence" }),
      ]),
    );

    const invalidExamples = structuredClone(
      BASE_REFERENCE_EXAMPLES,
    ) as unknown as {
      id: string;
      firstTeachLessonId: string;
      sourceContentIds: string[];
      tokens: { boundaryBefore: "attach" | "space" }[];
    }[];
    invalidExamples[0].tokens[0].boundaryBefore = "space";
    expect(
      validateBaseReferenceCatalog(BASE_REFERENCE_CATALOG, invalidExamples),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-token-sequence" }),
      ]),
    );
  });

  it("rejects forged same-ID top-level cells by format and deep semantics", () => {
    type MutableCell = {
      id: string;
      columnId: string;
      copy: {
        en: { label: string; explanation: string };
        it: { label: string; explanation: string };
      };
      tokens: {
        id: string;
        jp: string;
        romaji: string;
        kind: "lexical" | "particle" | "morpheme" | "punctuation";
        boundaryBefore: "attach" | "space";
        source: { domain: "catalog"; referenceId: string };
        reading?: string;
      }[];
      sourceContentIds: string[];
      desuFunction?: "politeness-marker" | "copula";
    };
    const forgedCatalog = (
      mutate: (cell: MutableCell) => void,
      cellIndex = 0,
    ) => {
      const catalog = mutableCatalog();
      const publishedCells = catalog[0].cells as unknown as MutableCell[];
      const forged = structuredClone(publishedCells[cellIndex]);
      mutate(forged);
      publishedCells[cellIndex] = forged;
      return catalog;
    };

    for (const catalog of [
      forgedCatalog((cell) => {
        cell.tokens[0].boundaryBefore = "space";
      }),
      forgedCatalog((cell) => {
        cell.tokens[0].romaji = "";
      }),
      forgedCatalog((cell) => {
        cell.tokens[0].jp = "";
      }),
    ]) {
      expect(validateBaseReferenceCatalog(catalog)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "invalid-token-sequence" }),
        ]),
      );
    }

    const predicateCellIndex = BASE_REFERENCE_CATALOG[0].cells.findIndex(
      ({ desuFunction }) => desuFunction !== undefined,
    );
    for (const catalog of [
      forgedCatalog((cell) => {
        cell.columnId = "topic";
      }),
      forgedCatalog((cell) => {
        cell.tokens[0].jp = "せんせい";
        cell.tokens[0].romaji = "sensei";
      }),
      forgedCatalog((cell) => {
        cell.sourceContentIds = ["noun-sensei"];
      }),
      forgedCatalog((cell) => {
        cell.copy.en.label = "Forged label";
      }),
      forgedCatalog((cell) => {
        cell.desuFunction =
          cell.desuFunction === "copula" ? "politeness-marker" : "copula";
      }, predicateCellIndex),
    ]) {
      expect(validateBaseReferenceCatalog(catalog)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "invalid-cell-reference" }),
        ]),
      );
    }
  });

  it("stores and validates cell provenance against canonical owner registries", () => {
    for (const reference of BASE_REFERENCE_CATALOG) {
      for (const entry of reference.entries) {
        expect(entry.sourceContentIds.length).toBeGreaterThan(0);
        const entryPosition = baseCanonicalPosition(entry.firstTeachLessonId)!;
        expect(
          entry.sourceContentIds.some((sourceContentId) => {
            const source =
              BASE_CONCEPT_BY_ID.get(sourceContentId) ??
              BASE_LEXEME_BY_ID.get(sourceContentId);
            return (
              source !== undefined &&
              baseCanonicalPosition(source.firstTeachLessonId) === entryPosition
            );
          }),
        ).toBe(true);
        for (const formCell of entry.canonicalFormCells) {
          expect(formCell.sourceContentIds.length).toBeGreaterThan(0);
          for (const sourceContentId of formCell.sourceContentIds) {
            const source =
              BASE_CONCEPT_BY_ID.get(sourceContentId) ??
              BASE_LEXEME_BY_ID.get(sourceContentId);
            expect(source).toBeDefined();
            expect(
              baseCanonicalPosition(source!.firstTeachLessonId),
            ).toBeLessThanOrEqual(entryPosition);
          }
        }
      }
    }

    const futureSource = mutableCatalog();
    const early = futureSource[0].entries[0] as unknown as {
      sourceContentIds: string[];
      canonicalFormCells: { sourceContentIds: string[] }[];
    };
    early.sourceContentIds.push("te-imasu");
    early.canonicalFormCells[0].sourceContentIds.push("te-imasu");
    expect(validateBaseReferenceCatalog(futureSource)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "future-source-reference" }),
      ]),
    );

    const undisclosedFutureLexeme = mutableCatalog();
    const earlyCell = undisclosedFutureLexeme[0].entries[0]
      .canonicalFormCells[0] as unknown as {
      tokens: (typeof BASE_REFERENCE_CATALOG)[number]["entries"][number]["canonicalFormCells"][number]["tokens"];
    };
    earlyCell.tokens = referenceById["adjective-copula"].entries.find(
      ({ semanticId }) => semanticId === "base-adjective-i-grid",
    )!.canonicalFormCells[0].tokens;
    expect(validateBaseReferenceCatalog(undisclosedFutureLexeme)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-source-reference" }),
      ]),
    );

    const undisclosedFutureForm = mutableCatalog();
    const earlyPoliteCell = undisclosedFutureForm
      .find(({ id }) => id === "verb-classes-conjugation")!
      .entries.find(
        ({ semanticId }) => semanticId === "base-verb-polite-forms",
      )!.canonicalFormCells[0] as unknown as {
      tokens: (typeof BASE_REFERENCE_CATALOG)[number]["entries"][number]["canonicalFormCells"][number]["tokens"];
    };
    earlyPoliteCell.tokens = referenceById["tense-polarity"].entries.find(
      ({ semanticId }) => semanticId === "base-tense-polite-grid",
    )!.canonicalFormCells[1].tokens;
    expect(validateBaseReferenceCatalog(undisclosedFutureForm)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-source-reference" }),
      ]),
    );

    const unmappedSource = mutableCatalog();
    const hostileToken = unmappedSource[0].entries[0].canonicalFormCells[0]
      .tokens[0] as unknown as {
      source: { domain: "catalog"; referenceId: string };
    };
    hostileToken.source.referenceId = "unmapped-reference-source";
    expect(validateBaseReferenceCatalog(unmappedSource)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-source-reference" }),
      ]),
    );
  });

  it("uses distinct canonical anatomy surfaces with real particles and modifiers", () => {
    const entries = referenceById["sentence-anatomy"].entries;
    const surface = (semanticId: string, cellIndex = 0) =>
      entries
        .find((entry) => entry.semanticId === semanticId)!
        .canonicalFormCells[cellIndex].tokens.map(({ jp }) => jp)
        .join("");
    expect(surface("base-sentence-topic-subject-status")).toBe("がくせいは");
    expect(surface("base-sentence-topic-subject-status", 1)).toBe("せんせいが");
    expect(surface("base-sentence-modifier-order")).toBe("がくせいのせんせい");
    expect(
      entries.find(
        ({ semanticId }) => semanticId === "base-sentence-modifier-order",
      )?.firstTeachLessonId,
    ).toBe("topic-questions-3");

    const firstCellSurfaces = entries.map(({ canonicalFormCells }) =>
      canonicalFormCells[0].tokens.map(({ jp }) => jp).join(""),
    );
    expect(new Set(firstCellSurfaces).size).toBe(firstCellSurfaces.length);
  });

  it("progresses sentence predicate types through nominal, verbal, and adjectival owners", () => {
    const entries = referenceById["sentence-anatomy"].entries;
    const byId = (semanticId: string) =>
      entries.find((entry) => entry.semanticId === semanticId)!;
    expect(
      byId("base-sentence-predicate-types").canonicalFormCells[0].tokens
        .map(({ jp }) => jp)
        .join(""),
    ).toBe("がくせいです");
    expect(
      byId("base-sentence-predicate-type-verbal").canonicalFormCells[0].tokens
        .map(({ jp }) => jp)
        .join(""),
    ).toBe("かきます");
    expect(byId("base-sentence-predicate-type-verbal").firstTeachLessonId).toBe(
      "polite-verbs-4",
    );
    expect(
      byId("base-sentence-predicate-type-adjectival").canonicalFormCells[0].tokens
        .map(({ jp }) => jp)
        .join(""),
    ).toBe("たかいです");
    expect(
      byId("base-sentence-predicate-type-adjectival").firstTeachLessonId,
    ).toBe("copula-adjectives-3");
  });

  it("reveals only nonpast polite verb forms before tense ownership", () => {
    const entries = referenceById["verb-classes-conjugation"].entries;
    const initial = entries.find(
      ({ semanticId }) => semanticId === "base-verb-polite-forms",
    )!;
    const later = entries.find(
      ({ semanticId }) => semanticId === "base-verb-polite-tense-forms",
    )!;
    expect(initial.canonicalFormCells.map(({ columnId }) => columnId)).toEqual([
      "affirmative",
    ]);
    expect(initial.firstTeachLessonId).toBe("polite-verbs-4");
    expect(later.canonicalFormCells.map(({ columnId }) => columnId)).toEqual([
      "negative",
      "pastAffirmative",
      "pastNegative",
    ]);
    expect(later.firstTeachLessonId).toBe("time-movement-3");
  });

  it("aligns negative noun-predicate visibility to its lesson-one owner", () => {
    const entries = referenceById["adjective-copula"].entries;
    expect(
      entries
        .find(({ semanticId }) => semanticId === "base-copula-reviewed-affirmative")!
        .canonicalFormCells.map(({ columnId }) => columnId),
    ).toEqual(["affirmative", "negative"]);
    expect(
      entries
        .find(({ semanticId }) => semanticId === "base-copula-noun-predicate-grid")!
        .canonicalFormCells.map(({ columnId }) => columnId),
    ).toEqual(["pastAffirmative", "pastNegative"]);
  });

  it("encodes the reciprocal nonpast versus ongoing contrast", () => {
    const dynamic = referenceById["tense-polarity"].entries.find(
      ({ semanticId }) => semanticId === "base-tense-dynamic-nonpast",
    )!;
    const ongoing = referenceById["verb-classes-conjugation"].entries.find(
      ({ semanticId }) => semanticId === "base-verb-te-imasu",
    )!;
    expect(dynamic.contrastIds).toContain("base-verb-te-imasu");
    expect(ongoing.contrastIds).toContain("base-tense-dynamic-nonpast");
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
    expect(dictionary?.firstTeachLessonId).toBe("polite-verbs-1");

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
      "base-particle-wa",
      "base-particle-ga",
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
      "base-particle-existence-ni",
      "base-particle-existential-ga",
    ]);
  });

  it("is deeply immutable", () => {
    expect(Object.isFrozen(BASE_REFERENCE_CATALOG)).toBe(true);
    expect(Object.isFrozen(BASE_REFERENCE_CATALOG[0].entries)).toBe(true);
    expect(Object.isFrozen(BASE_REFERENCE_CATALOG[0].entries[0].copy.en)).toBe(true);
    expect(Object.getPrototypeOf(referenceById)).toBeNull();
    expect(Object.isFrozen(BASE_REFERENCE_EXAMPLES)).toBe(true);
    expect(Object.isFrozen(BASE_REFERENCE_EXAMPLES[0].sourceContentIds)).toBe(true);
    expect(() =>
      (BASE_REFERENCE_CATALOG[0].entries as unknown as unknown[]).push({}),
    ).toThrow();
  });

  it("publishes example eligibility through a truly immutable ReadonlySet view", () => {
    const eligibility = BASE_REFERENCE_ELIGIBLE_EXAMPLE_IDS;
    const originalIds = [...eligibility];
    const forgedId = "forged-reference-example";
    const mutable = eligibility as unknown as {
      add?: (id: string) => unknown;
      delete?: (id: string) => unknown;
      clear?: () => unknown;
    };

    expect(Object.isFrozen(eligibility)).toBe(true);
    expect(mutable.add).toBeUndefined();
    expect(mutable.delete).toBeUndefined();
    expect(mutable.clear).toBeUndefined();
    expect(() => Set.prototype.add.call(eligibility, forgedId)).toThrow();
    expect(() =>
      Set.prototype.delete.call(eligibility, originalIds[0]),
    ).toThrow();
    expect(() => Set.prototype.clear.call(eligibility)).toThrow();
    expect(Reflect.setPrototypeOf(eligibility, Set.prototype)).toBe(false);
    expect([...eligibility]).toEqual(originalIds);
    expect(eligibility.has(forgedId)).toBe(false);
    expect(eligibility.has(originalIds[0])).toBe(true);

    const fromForEach: string[] = [];
    eligibility.forEach((value, key, set) => {
      expect(set).toBe(eligibility);
      expect(key).toBe(value);
      fromForEach.push(value);
    });
    expect(fromForEach).toEqual(originalIds);
    expect([...eligibility.keys()]).toEqual(originalIds);
    expect([...eligibility.values()]).toEqual(originalIds);
    expect([...eligibility.entries()]).toEqual(
      originalIds.map((id) => [id, id]),
    );
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

  it("rejects nested entry getters and hostile example collections without reading them", () => {
    let getterReads = 0;
    const catalog = mutableCatalog();
    Object.defineProperty(catalog[0].entries[0], "sourceContentIds", {
      enumerable: true,
      get() {
        getterReads += 1;
        return ["sentence-chunks"];
      },
    });
    expect(validateBaseReferenceCatalog(catalog)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-entry-shape" }),
      ]),
    );
    expect(getterReads).toBe(0);

    const sparseExamples: unknown[] = [];
    sparseExamples.length = 1;
    expect(validateBaseReferenceCatalog(BASE_REFERENCE_CATALOG, sparseExamples)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-example-shape" }),
      ]),
    );

    const hostileExamples = new Proxy([], {
      getPrototypeOf() {
        throw new Error("example prototype trap");
      },
    });
    expect(() =>
      validateBaseReferenceCatalog(BASE_REFERENCE_CATALOG, hostileExamples),
    ).not.toThrow();
    expect(
      validateBaseReferenceCatalog(BASE_REFERENCE_CATALOG, hostileExamples),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-example-shape" }),
      ]),
    );
  });
});
