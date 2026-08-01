/**
 * A2 content invariants (Phase 4 Tasks 6-13).
 *
 * Seven deterministic validators for the defect classes the Phase 3
 * double-check review found ungated. Every one of them is derived either from
 * the realized surface or from typed catalog data — never from an allow-list
 * of the specific ids that happened to be wrong, so a *new* offender authored
 * next year is caught too.
 *
 * These complement `a2RealizedIntegrity.test.ts` (duplicate terminal か,
 * `carriesOwnTopic` double topics, proper-name subject/copy agreement) rather
 * than replacing it.
 */
import { describe, expect, it } from "vitest";

import { realizeVariant } from "../../foundations/realizeFamily";
import type { SemanticValue, SentenceFamily, SentenceVariant } from "../../foundations/types";
import { a2SemanticBuiltLessons } from "./catalog";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "./a2SemanticCatalog";

const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
// Populated here for Tasks 7-13 validators appended below; unused by C1a.
const valueById = new Map<string, SemanticValue>(a2SemanticValues.map((v) => [v.id, v]));
void valueById;
const realizeCatalogs = {
  contexts: a2Contexts,
  personRoles: a2PersonRoles,
  referents: a2Referents,
  semanticValues: a2SemanticValues,
  learningTargetSenses: a2LearningTargetSenses,
};

/** One realized A2 surface plus everything the validators below need. */
interface RealizedRow {
  readonly id: string;
  readonly lessonId: string;
  readonly jp: string;
  readonly en: string;
  readonly it: string;
  readonly variant: SentenceVariant;
  readonly contextId: string;
  readonly predicateValueId: string | undefined;
  readonly subjectValueId: string | undefined;
}

/** Realizes every authored A2 model + transfer exactly once. */
const ROWS: readonly RealizedRow[] = a2SemanticBuiltLessons.flatMap((built) =>
  built.variants.map((variant) => {
    const family = famById.get(variant.sentenceFamilyId);
    if (!family) throw new Error(`unknown family for ${variant.id}`);
    const realized = realizeVariant(family, variant, realizeCatalogs, {
      availableConceptIds: [...family.requiredConceptIds],
    });
    if (!realized.ok) {
      throw new Error(`realize ${variant.id} failed: ${JSON.stringify(realized.errors)}`);
    }
    return {
      id: variant.id,
      lessonId: built.recipe.id,
      jp: realized.sentence.canonicalJapanese,
      en: built.en[`${variant.id}-translation`] ?? "",
      it: built.it[`${variant.id}-translation`] ?? "",
      variant,
      contextId: variant.contextId,
      predicateValueId: variant.slotValues.predicate,
      subjectValueId: variant.slotValues.subject,
    };
  }),
);

/**
 * The closed class of clause-initial discourse interjections A2 teaches. This
 * is a grammatical class, not a list of offending ids: any future value that
 * opens with one of these is covered automatically.
 */
const CLAUSE_INITIAL_INTERJECTIONS = [
  "すみません",
  "ありがとうございます",
  "ごめんなさい",
] as const;

/** `Xは` immediately followed by a clause-initial interjection. */
const TOPIC_BEFORE_INTERJECTION = new RegExp(
  `^[^、。]{1,10}は(${CLAUSE_INITIAL_INTERJECTIONS.join("|")})`,
);

describe("C1a — no topic phrase before a clause-initial interjection", () => {
  it("never emits `Xは` immediately before すみません / ありがとうございます / ごめんなさい", () => {
    const offenders = ROWS.filter((row) => TOPIC_BEFORE_INTERJECTION.test(row.jp)).map(
      (row) => `${row.id}: ${row.jp}`,
    );
    expect(offenders).toEqual([]);
  });
});
