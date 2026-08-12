/**
 * The level-agnostic content invariants, run against A1.
 *
 * A1 was never reviewed variant-by-variant the way A2 was in Phase 3, and
 * Phase 4 changed shared foundation code (release identity, the diversity
 * floor, exercise-kind rotation) that A1 consumes. These are the three A2
 * gates whose rules are purely structural, so they apply unchanged.
 */
import { describe, expect, it } from "vitest";

import { realizeVariant } from "../../foundations/realizeFamily";
import type { SentenceFamily, SentenceVariant } from "../../foundations/types";
import { A1_INHERITED_BASE_CONCEPT_IDS } from "../inheritedBaseConcepts";
import { partitionA1AuthoredConceptIds } from "../inheritedBaseConcepts";
import { a1SemanticBuiltLessons } from "./catalog";
import {
  a1Contexts,
  a1LearningTargetSenses,
  a1PersonRoles,
  a1Referents,
  a1SemanticValues,
  a1SentenceFamilies,
} from "./shared";

const famById = new Map<string, SentenceFamily>(
  a1SentenceFamilies.map((f) => [f.id, f]),
);
const realizeCatalogs = {
  contexts: a1Contexts,
  personRoles: a1PersonRoles,
  referents: a1Referents,
  semanticValues: a1SemanticValues,
  learningTargetSenses: a1LearningTargetSenses,
};

interface Row {
  readonly id: string;
  readonly jp: string;
  readonly en: string;
  readonly it: string;
}

/** Realizes every authored A1 model + transfer exactly once. */
const ROWS: readonly Row[] = a1SemanticBuiltLessons.flatMap((built) =>
  built.variants.map((variant: SentenceVariant) => {
    const family = famById.get(variant.sentenceFamilyId);
    if (!family) {
      throw new Error(
        `unknown family ${variant.sentenceFamilyId} (variant ${variant.id})`,
      );
    }
    const realized = realizeVariant(family, variant, realizeCatalogs, {
      availableConceptIds: [...family.requiredConceptIds],
    });
    if (!realized.ok) {
      throw new Error(
        `realize ${variant.id} failed: ${JSON.stringify(realized.errors)}`,
      );
    }
    return {
      id: variant.id,
      jp: realized.sentence.canonicalJapanese,
      en: built.en[`${variant.id}-translation`] ?? "",
      it: built.it[`${variant.id}-translation`] ?? "",
    };
  }),
);

const TOPIC_BEFORE_INTERJECTION =
  /^[^、。]{1,10}は(すみません|ありがとうございます|ごめんなさい)/;
const POLITE_TAIL =
  /(です|ます|ません|でした|ました|ませんでした|ましょう)[かねよ]?$/;

describe("A1 content invariants", () => {
  it("never puts a topic in front of an interjection", () => {
    const offenders = ROWS.filter((row) =>
      TOPIC_BEFORE_INTERJECTION.test(row.jp),
    ).map((row) => `${row.id}: ${row.jp}`);
    expect(offenders).toEqual([]);
  });

  it("keeps one register per sentence", () => {
    const offenders = ROWS.filter((row) => {
      const clauses = row.jp
        .split("。")
        .filter((clause) => clause.length > 0);
      if (clauses.length < 2) return false;
      const polite = clauses.map((clause) => POLITE_TAIL.test(clause));
      return polite.some(Boolean) && !polite.every(Boolean);
    }).map((row) => `${row.id}: ${row.jp}`);
    expect(offenders).toEqual([]);
  });

  it("gives every variant both glosses", () => {
    const offenders = ROWS.filter(
      (row) => row.en.length === 0 || row.it.length === 0,
    ).map((row) => row.id);
    expect(offenders).toEqual([]);
  });
});

describe("A1 recipes never claim a Base-owned first teach (Task 16)", () => {
  it("moves every inherited concept out of introducedConceptIds and into reviewedConceptIds", () => {
    const inherited = new Set<string>(A1_INHERITED_BASE_CONCEPT_IDS);
    let reviewedTotal = 0;

    for (const built of a1SemanticBuiltLessons) {
      const { recipe } = built;
      for (const conceptId of recipe.introducedConceptIds) {
        expect(
          inherited.has(conceptId),
          `${recipe.id} claims to introduce Base-owned "${conceptId}"`,
        ).toBe(false);
      }
      for (const conceptId of recipe.reviewedConceptIds) {
        expect(inherited.has(conceptId), `${recipe.id} → ${conceptId}`).toBe(true);
      }
      expect(
        recipe.introducedConceptIds.filter((id) =>
          recipe.reviewedConceptIds.includes(id),
        ),
        recipe.id,
      ).toEqual([]);
      reviewedTotal += recipe.reviewedConceptIds.length;
    }

    // The split is only meaningful if retained A1 genuinely reuses Base grammar.
    expect(reviewedTotal).toBeGreaterThan(0);
  });

  it("partitions an authored concept list without losing or duplicating an id", () => {
    const authored = [
      "a1-concept-topic-wa",
      "a1-concept-adjective",
      "a1-concept-object-wo",
      "a1-concept-quantity",
    ];
    const partition = partitionA1AuthoredConceptIds(authored);

    expect([...partition.introduced, ...partition.reviewed].sort()).toEqual(
      [...authored].sort(),
    );
    expect(partition.reviewed).toEqual([
      "a1-concept-topic-wa",
      "a1-concept-object-wo",
    ]);
    expect(partition.introduced).toEqual([
      "a1-concept-adjective",
      "a1-concept-quantity",
    ]);
  });
});
