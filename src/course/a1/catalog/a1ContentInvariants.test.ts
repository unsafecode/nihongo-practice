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
