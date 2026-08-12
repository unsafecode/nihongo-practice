import { describe, expect, it } from "vitest";
import {
  BASE_REFERENCE_CATALOG,
  BASE_REFERENCE_EXAMPLES,
  type BaseReferenceCatalog,
} from "./catalog";
import { buildBaseReferenceViewModel } from "./buildReferenceViewModel";
import { BASE_CONCEPT_BY_ID } from "../catalog/concepts";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import { BASE_LESSON_IDS, baseCanonicalPosition } from "../manifest";

describe("buildBaseReferenceViewModel", () => {
  it("builds all five references through the final Base lesson", () => {
    for (const reference of BASE_REFERENCE_CATALOG) {
      const result = buildBaseReferenceViewModel(reference.id, "base-synthesis-4", "en");
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.model.entries).toHaveLength(reference.entries.length);
      expect(result.model.grid.rows).toHaveLength(reference.entries.length);
    }
  });

  it("builds a non-empty snapshot at every reference first-teach lesson", () => {
    for (const reference of BASE_REFERENCE_CATALOG) {
      const result = buildBaseReferenceViewModel(
        reference.id,
        reference.firstTeachLessonId,
        "en",
      );
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.model.entries.length).toBeGreaterThan(0);
      expect(result.model.grid.rows.length).toBeGreaterThan(0);
      expect(
        result.model.entries.some(
          ({ firstTeachLessonId }) =>
            firstTeachLessonId === reference.firstTeachLessonId,
        ),
      ).toBe(true);
    }
  });

  it("reveals real anatomy and predicate surfaces only at their exact owners", () => {
    const idsAt = (lessonId: string) => {
      const result = buildBaseReferenceViewModel(
        "sentence-anatomy",
        lessonId,
        "en",
      );
      expect(result.ok).toBe(true);
      return result.ok
        ? result.model.entries.map(({ semanticId }) => semanticId)
        : [];
    };
    expect(idsAt("sentence-foundations-3")).not.toContain(
      "base-sentence-modifier-order",
    );
    expect(idsAt("sentence-foundations-4")).toContain(
      "base-sentence-modifier-order",
    );
    expect(idsAt("topic-questions-3")).toContain(
      "base-sentence-modifier-order",
    );
    expect(idsAt("polite-verbs-3")).not.toContain(
      "base-sentence-predicate-type-verbal",
    );
    expect(idsAt("polite-verbs-4")).toContain(
      "base-sentence-predicate-type-verbal",
    );
    expect(idsAt("copula-adjectives-2")).not.toContain(
      "base-sentence-predicate-type-adjectival",
    );
    expect(idsAt("copula-adjectives-3")).toContain(
      "base-sentence-predicate-type-adjectival",
    );
  });

  it("reveals only particle entries owned through the requested lesson", () => {
    const early = buildBaseReferenceViewModel("particle-atlas", "topic-questions-2", "en");
    expect(early.ok && early.model.entries.map(({ semanticId }) => semanticId)).toEqual([
      "base-particle-wa",
      "base-particle-ga",
    ]);

    const later = buildBaseReferenceViewModel(
      "particle-atlas",
      "existence-location-3",
      "en",
    );
    expect(
      later.ok &&
        later.model.entries.some(
          ({ semanticId }) => semanticId === "base-particle-existence-ni",
        ),
    ).toBe(true);
  });

  it("reveals と at TQ3 and interactional endings only at TQ4", () => {
    const tq3 = buildBaseReferenceViewModel(
      "particle-atlas",
      "topic-questions-3",
      "en",
    );
    const tq4 = buildBaseReferenceViewModel(
      "particle-atlas",
      "topic-questions-4",
      "en",
    );
    const ids = (result: typeof tq3) =>
      result.ok ? result.model.entries.map(({ semanticId }) => semanticId) : [];
    expect(ids(tq3)).toEqual(
      expect.arrayContaining([
        "base-particle-listing-to",
        "base-particle-nominal-to",
        "base-particle-companion-to",
      ]),
    );
    expect(ids(tq3)).not.toEqual(
      expect.arrayContaining([
        "base-particle-interactional-ne",
        "base-particle-interactional-yo",
      ]),
    );
    expect(ids(tq4)).toEqual(
      expect.arrayContaining([
        "base-particle-question-ka",
        "base-particle-interactional-ne",
        "base-particle-interactional-yo",
      ]),
    );
  });

  it("has exact progressive checkpoints with no te-form leakage", () => {
    const anatomy = buildBaseReferenceViewModel(
      "sentence-anatomy",
      "sentence-foundations-1",
      "en",
    );
    const verbsBeforeTe = buildBaseReferenceViewModel(
      "verb-classes-conjugation",
      "time-movement-1",
      "en",
    );
    const verbsAtTe = buildBaseReferenceViewModel(
      "verb-classes-conjugation",
      "requests-connection-1",
      "en",
    );
    const tense = buildBaseReferenceViewModel("tense-polarity", "time-movement-3", "en");
    const adjectives = buildBaseReferenceViewModel(
      "adjective-copula",
      "copula-adjectives-4",
      "en",
    );
    expect(anatomy.ok && anatomy.model.grid.rows[0].cells.length).toBeGreaterThan(0);
    expect(
      verbsBeforeTe.ok &&
        verbsBeforeTe.model.entries.map(({ semanticId }) => semanticId),
    ).not.toContain("base-verb-exceptions");
    expect(
      verbsAtTe.ok && verbsAtTe.model.entries.map(({ semanticId }) => semanticId),
    ).toContain("base-verb-exceptions");
    expect(tense.ok && tense.model.entries.map(({ semanticId }) => semanticId)).toEqual([
      "base-tense-dynamic-nonpast",
      "base-tense-polite-grid",
    ]);
    expect(adjectives.ok && adjectives.model.entries.map(({ semanticId }) => semanticId)).toContain(
      "base-adjective-na-grid",
    );
  });

  it("reveals the generated てください row exactly at requests-connection-2", () => {
    const before = buildBaseReferenceViewModel(
      "verb-classes-conjugation",
      "requests-connection-1",
      "en",
    );
    const atOwner = buildBaseReferenceViewModel(
      "verb-classes-conjugation",
      "requests-connection-2",
      "en",
    );
    expect(before.ok && atOwner.ok).toBe(true);
    if (!before.ok || !atOwner.ok) return;

    expect(before.model.entries.map(({ semanticId }) => semanticId)).not.toContain(
      "base-verb-te-kudasai",
    );
    const request = atOwner.model.entries.find(
      ({ semanticId }) => semanticId === "base-verb-te-kudasai",
    );
    expect(request?.prerequisiteEntryIds).toEqual(["base-verb-te-forms"]);
    expect(
      request?.canonicalFormCells[0]?.value.map(({ jp }) => jp).join(""),
    ).toBe("たべてください");
  });

  it("keeps predicate cell functions in localized grid and card rows", () => {
    const result = buildBaseReferenceViewModel(
      "adjective-copula",
      "copula-adjectives-4",
      "it",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const iAdjective = result.model.entries.find(
      ({ semanticId }) => semanticId === "base-adjective-i-grid",
    )!;
    const naAdjective = result.model.entries.find(
      ({ semanticId }) => semanticId === "base-adjective-na-grid",
    )!;
    expect(iAdjective.canonicalFormCells[0]?.desuFunction).toBe("politeness-marker");
    expect(naAdjective.canonicalFormCells[0]?.desuFunction).toBe("copula");
    expect(result.model.grid.rows.find(({ id }) => id === iAdjective.semanticId)?.cells[0]).toMatchObject(
      { desuFunction: "politeness-marker" },
    );
  });

  it("includes exact prerequisite closure without future entry leakage", () => {
    const result = buildBaseReferenceViewModel(
      "particle-atlas",
      "argument-particles-2",
      "en",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const included = new Set(result.model.entries.map(({ semanticId }) => semanticId));
    for (const entry of result.model.entries) {
      expect(entry.prerequisiteEntryIds.every((id) => included.has(id))).toBe(true);
    }
    expect(included.has("base-particle-action-place-de")).toBe(false);
    expect(included.has("base-particle-existence-ni")).toBe(false);
  });

  it("fails closed for unknown references and lessons", () => {
    expect(buildBaseReferenceViewModel("missing", "topic-questions-2", "en")).toEqual({
      ok: false,
      error: { code: "unknown-reference", referenceId: "missing" },
    });
    expect(
      buildBaseReferenceViewModel("particle-atlas", "not-a-base-lesson", "en"),
    ).toEqual({
      ok: false,
      error: { code: "unknown-through-lesson", referenceId: "particle-atlas" },
    });
  });

  it("fails closed when an included entry depends on a future entry", () => {
    const catalog = structuredClone(BASE_REFERENCE_CATALOG) as BaseReferenceCatalog;
    const atlas = catalog.find(({ id }) => id === "particle-atlas")!;
    const ga = atlas.entries.find(
      ({ semanticId }) => semanticId === "base-particle-ga",
    )!;
    (ga.prerequisiteEntryIds as string[]).push(
      "base-particle-existence-ni",
    );
    expect(
      buildBaseReferenceViewModel(
        "particle-atlas",
        "topic-questions-2",
        "en",
        catalog,
      ),
    ).toEqual({
      ok: false,
      error: { code: "future-prerequisite", referenceId: "particle-atlas" },
    });
  });

  it("fails closed for catalog-level future prerequisites even when the entry is hidden", () => {
      const catalog = structuredClone(BASE_REFERENCE_CATALOG) as BaseReferenceCatalog;
      const atlas = catalog.find(({ id }) => id === "particle-atlas")!;
      const direction = atlas.entries.find(
        ({ semanticId }) => semanticId === "base-particle-direction-he",
      )!;
      (direction.prerequisiteEntryIds as string[]).push(
        "base-particle-existence-ni",
      );
      expect(
        buildBaseReferenceViewModel(
          "particle-atlas",
          "topic-questions-2",
          "en",
          catalog,
        ),
      ).toEqual({
        ok: false,
        error: { code: "future-prerequisite", referenceId: "particle-atlas" },
      });
  });

  it("threads eligible examples and rejects examples owned after their entry", () => {
      const examples = structuredClone(BASE_REFERENCE_EXAMPLES) as {
        id: string;
        firstTeachLessonId: string;
        sourceContentIds: string[];
        tokens: (typeof BASE_REFERENCE_EXAMPLES)[number]["tokens"];
      }[];
      examples[0] = {
        ...examples[0],
        firstTeachLessonId: "base-synthesis-4",
      };
      expect(
        buildBaseReferenceViewModel(
          "sentence-anatomy",
          "sentence-foundations-1",
          "en",
          BASE_REFERENCE_CATALOG,
          examples,
        ),
      ).toEqual({
        ok: false,
        error: { code: "unknown-reference", referenceId: "sentence-anatomy" },
      });
  });

  it("never renders source content before its canonical owner lesson", () => {
      const sourcePosition = (sourceContentId: string) => {
        const source =
          BASE_CONCEPT_BY_ID.get(sourceContentId) ??
          BASE_LEXEME_BY_ID.get(sourceContentId);
        expect(source).toBeDefined();
        return baseCanonicalPosition(source!.firstTeachLessonId)!;
      };
      const exampleById = new Map(
        BASE_REFERENCE_EXAMPLES.map((example) => [example.id, example]),
      );

      for (const throughLessonId of BASE_LESSON_IDS) {
        const throughPosition = baseCanonicalPosition(throughLessonId)!;
        for (const reference of BASE_REFERENCE_CATALOG) {
          const referencePosition = baseCanonicalPosition(reference.firstTeachLessonId)!;
          if (referencePosition > throughPosition) continue;
          const result = buildBaseReferenceViewModel(
            reference.id,
            throughLessonId,
            "en",
          );
          expect(result.ok).toBe(true);
          if (!result.ok) continue;
          for (const entry of result.model.entries) {
            for (const sourceContentId of entry.sourceContentIds) {
              expect(sourcePosition(sourceContentId)).toBeLessThanOrEqual(
                throughPosition,
              );
            }
            for (const formCell of entry.canonicalFormCells) {
              for (const sourceContentId of formCell.sourceContentIds) {
                expect(sourcePosition(sourceContentId)).toBeLessThanOrEqual(
                  throughPosition,
                );
              }
            }
            for (const exampleId of entry.exampleIds) {
              expect(
                baseCanonicalPosition(exampleById.get(exampleId)!.firstTeachLessonId),
              ).toBeLessThanOrEqual(throughPosition);
            }
          }
        }
      }
  });

  it("does not leak a future reciprocal contrast", () => {
      const early = buildBaseReferenceViewModel(
        "tense-polarity",
        "time-movement-1",
        "en",
      );
      const complete = buildBaseReferenceViewModel(
        "tense-polarity",
        "requests-connection-4",
        "en",
      );
      expect(early.ok).toBe(true);
      expect(complete.ok).toBe(true);
      if (!early.ok || !complete.ok) return;
      expect(early.model.entries[0].contrastIds).not.toContain(
        "base-verb-te-imasu",
      );
      expect(complete.model.entries[0].contrastIds).toContain(
        "base-verb-te-imasu",
      );
  });

  it("maps an invalid locale to the documented unknown-reference failure", () => {
      expect(
        buildBaseReferenceViewModel(
          "particle-atlas",
          "topic-questions-2",
          "fr" as "en",
        ),
      ).toEqual({
        ok: false,
        error: { code: "unknown-reference", referenceId: "particle-atlas" },
    });
  });

  it("fails closed for explicitly undefined custom catalog or examples", () => {
      expect(
        buildBaseReferenceViewModel(
          "particle-atlas",
          "topic-questions-2",
          "en",
          undefined as unknown as BaseReferenceCatalog,
        ),
      ).toEqual({
        ok: false,
        error: { code: "unknown-reference", referenceId: "particle-atlas" },
      });
      expect(
        buildBaseReferenceViewModel(
          "particle-atlas",
          "topic-questions-2",
          "en",
          BASE_REFERENCE_CATALOG,
          undefined as unknown as typeof BASE_REFERENCE_EXAMPLES,
        ),
      ).toEqual({
        ok: false,
        error: { code: "unknown-reference", referenceId: "particle-atlas" },
      });
      expect(
        buildBaseReferenceViewModel("particle-atlas", "topic-questions-2", "en"),
      ).toMatchObject({ ok: true });
  });

  it("localizes labels and explanations in English and Italian", () => {
    const en = buildBaseReferenceViewModel(
      "sentence-anatomy",
      "sentence-foundations-1",
      "en",
    );
    const it = buildBaseReferenceViewModel(
      "sentence-anatomy",
      "sentence-foundations-1",
      "it",
    );
    expect(en.ok && it.ok).toBe(true);
    if (!en.ok || !it.ok) return;
    expect(en.model.entries[0].label).toBe("Sentence chunks");
    expect(it.model.entries[0].label).toBe("Blocchi della frase");
    expect(en.model.entries[0].explanation).not.toBe(it.model.entries[0].explanation);
  });

  it("returns meaningful independent English and Italian copy for every surface", () => {
    for (const reference of BASE_REFERENCE_CATALOG) {
      const en = buildBaseReferenceViewModel(reference.id, "base-synthesis-4", "en");
      const it = buildBaseReferenceViewModel(reference.id, "base-synthesis-4", "it");
      expect(en.ok && it.ok).toBe(true);
      if (!en.ok || !it.ok) continue;
      expect(en.model.label.trim()).not.toBe("");
      expect(en.model.explanation.trim()).not.toBe("");
      expect(it.model.label.trim()).not.toBe("");
      expect(it.model.explanation.trim()).not.toBe("");
      for (const [enEntry, itEntry] of en.model.entries.map((entry, index) => [
        entry,
        it.model.entries[index]!,
      ] as const)) {
        expect(enEntry.label.trim()).not.toBe("");
        expect(enEntry.explanation.trim()).not.toBe("");
        expect(itEntry.label.trim()).not.toBe("");
        expect(itEntry.explanation.trim()).not.toBe("");
      }
    }
  });

  it("renders one validated custom-copy source consistently", () => {
    const catalog = structuredClone(BASE_REFERENCE_CATALOG) as BaseReferenceCatalog;
    const definition = catalog[0] as unknown as {
      copy: { en: { label: string; explanation: string } };
      columns: { copy: { en: { label: string; explanation: string } } }[];
      entries: {
        copy: { en: { label: string; explanation: string } };
        canonicalFormCells: {
          copy: { en: { label: string; explanation: string } };
        }[];
      }[];
    };
    definition.copy.en.label = "Custom reference";
    definition.copy.en.explanation = "Custom reference explanation";
    definition.columns[0].copy.en.label = "Custom column";
    definition.entries[0].copy.en.label = "Custom entry";
    definition.entries[0].copy.en.explanation = "Custom entry explanation";
    definition.entries[0].canonicalFormCells[0].copy.en.label = "Custom cell";

    const result = buildBaseReferenceViewModel(
      "sentence-anatomy",
      "sentence-foundations-1",
      "en",
      catalog,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.label).toBe("Custom reference");
    expect(result.model.explanation).toBe("Custom reference explanation");
    expect(result.model.grid.caption).toBe("Custom reference");
    expect(result.model.grid.columns[0].label).toBe("Custom column");
    expect(result.model.entries[0].label).toBe("Custom entry");
    expect(result.model.entries[0].explanation).toBe("Custom entry explanation");
    expect(result.model.entries[0].canonicalFormCells[0].label).toBe(
      "Custom cell",
    );
  });

  it("never consumes a Proxy get trap after descriptor-only validation", () => {
    const clean = structuredClone(BASE_REFERENCE_CATALOG) as BaseReferenceCatalog;
    const forgedAtlas = structuredClone(clean[1]) as unknown as {
      copy: { en: { label: string; explanation: string } };
      entries: { firstTeachLessonId: string }[];
    };
    forgedAtlas.copy.en.label = "FORGED ATLAS";
    for (const entry of forgedAtlas.entries) {
      entry.firstTeachLessonId = "topic-questions-1";
    }
    let getTrapReads = 0;
    const differential = new Proxy(clean as BaseReferenceCatalog, {
      get(target, property, receiver) {
        getTrapReads += 1;
        if (property === "1") return forgedAtlas;
        return Reflect.get(target, property, receiver);
      },
    });

    const result = buildBaseReferenceViewModel(
      "particle-atlas",
      "topic-questions-2",
      "en",
      differential,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(getTrapReads).toBe(0);
    expect(result.model.label).toBe("Particle atlas");
    expect(result.model.entries.map(({ semanticId }) => semanticId)).toEqual([
      "base-particle-wa",
      "base-particle-ga",
    ]);
  });

  it("uses identical semantic rows and labels for grids and stacked cards", () => {
    const result = buildBaseReferenceViewModel(
      "tense-polarity",
      "time-movement-3",
      "en",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.stackedRows).toBe(result.model.grid.rows);
    result.model.grid.rows.forEach((row, index) => {
      expect(result.model.stackedRows[index].header).toBe(row.header);
      expect(result.model.stackedRows[index].cells).toBe(row.cells);
    });
  });

  it("returns deeply immutable models", () => {
    const result = buildBaseReferenceViewModel(
      "adjective-copula",
      "copula-adjectives-4",
      "it",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.model.grid.rows[0].cells)).toBe(true);
  });

  it("does not execute getter or prototype traps at public boundaries", () => {
    let getterReads = 0;
    const hostileReference = Object.defineProperty({}, "toString", {
      get() {
        getterReads += 1;
        return () => "particle-atlas";
      },
    });
    expect(
      buildBaseReferenceViewModel(
        hostileReference as unknown as string,
        "topic-questions-2",
        "en",
      ),
    ).toEqual({
      ok: false,
      error: { code: "unknown-reference", referenceId: "unknown-reference" },
    });
    expect(getterReads).toBe(0);

    const hostileLesson = new Proxy(
      {},
      { getPrototypeOf: () => { throw new Error("do not inspect"); } },
    );
    expect(() =>
      buildBaseReferenceViewModel(
        "particle-atlas",
        hostileLesson as unknown as string,
        "en",
      ),
    ).not.toThrow();
  });
});
