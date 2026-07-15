import { describe, expect, it } from "vitest";
import { validateCatalogReferences } from "./validate";

describe("validateCatalogReferences", () => {
  it("reports missing references without dropping them", () => {
    expect(
      validateCatalogReferences({
        conceptIds: ["topic-wa"],
        lexemeIds: [],
        exampleIds: [],
        personaIds: ["yuki"],
        referencedConceptIds: ["topic-wa", "question-ka"],
        referencedLexemeIds: ["water"],
        referencedExampleIds: ["self-introduction"],
        referencedPersonaIds: ["yuki", "ken"],
      }),
    ).toEqual([
      { code: "missing-concept-reference", id: "question-ka" },
      { code: "missing-example-reference", id: "self-introduction" },
      { code: "missing-lexeme-reference", id: "water" },
      { code: "missing-persona-reference", id: "ken" },
    ]);
  });

  it("reports duplicate declared ids in deterministic order", () => {
    expect(
      validateCatalogReferences({
        conceptIds: ["topic-wa", "topic-wa"],
        lexemeIds: ["water", "water"],
        exampleIds: ["intro", "intro"],
        personaIds: ["yuki", "yuki"],
        referencedConceptIds: [],
        referencedLexemeIds: [],
        referencedExampleIds: [],
        referencedPersonaIds: [],
      }),
    ).toEqual([
      { code: "duplicate-concept-id", id: "topic-wa" },
      { code: "duplicate-example-id", id: "intro" },
      { code: "duplicate-lexeme-id", id: "water" },
      { code: "duplicate-persona-id", id: "yuki" },
    ]);
  });
});
