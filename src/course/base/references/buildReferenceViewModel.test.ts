import { describe, expect, it } from "vitest";
import { BASE_REFERENCE_CATALOG, type BaseReferenceCatalog } from "./catalog";
import { buildBaseReferenceViewModel } from "./buildReferenceViewModel";

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

  it("reveals only particle entries owned through the requested lesson", () => {
    const early = buildBaseReferenceViewModel("particle-atlas", "topic-questions-2", "en");
    expect(early.ok && early.model.entries.map(({ semanticId }) => semanticId)).toEqual([
      "base-particle-topic-wa",
      "base-particle-focus-subject-ga",
    ]);

    const later = buildBaseReferenceViewModel(
      "particle-atlas",
      "existence-location-3",
      "en",
    );
    expect(
      later.ok &&
        later.model.entries.some(
          ({ semanticId }) => semanticId === "base-particle-existence-location-ni",
        ),
    ).toBe(true);
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
    expect(included.has("base-particle-existence-location-ni")).toBe(false);
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
      ({ semanticId }) => semanticId === "base-particle-focus-subject-ga",
    )!;
    (ga.prerequisiteEntryIds as string[]).push(
      "base-particle-existence-location-ni",
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
