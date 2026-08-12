/**
 * The catalog content retained A1 inherits from Base (Task 16).
 *
 * The four Foundations modules moved to Base with their sixteen lessons. Those
 * lessons still *model* semantic values, senses, grammar concepts and verb forms
 * that retained A1 lessons legitimately recombine in their transfers — a learner
 * reaching `actions-1` has already met `a1-value-obj-sushi` in Base.
 *
 * This module derives that inherited content from the rehomed lessons' own
 * authored model variants, realized through the canonical realizer, so it can
 * never claim more than Base actually teaches. It is deliberately *not* a
 * hand-written allow-list.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import { realizeVariant } from "../../foundations/realizeFamily";
import type { SentenceVariant } from "../../foundations/types";
import { a1AllStagedFoundationsBuiltLessons } from "../curriculum/foundationsArea03to04";
import {
  a1CanonicalContexts,
  a1CanonicalLearningTargetSenses,
  a1CanonicalPersonRoles,
  a1CanonicalReferents,
  a1CanonicalSemanticValues,
  a1CanonicalSentenceFamilies,
} from "./a1SemanticCatalog";

export interface A1InheritedBaseContent {
  readonly conceptIds: readonly string[];
  readonly senseIds: readonly string[];
  readonly semanticValueIds: readonly string[];
  readonly forms: readonly string[];
}

const familyById = new Map(
  a1CanonicalSentenceFamilies.map((family) => [family.id, family]),
);

const realizeCatalogs = {
  contexts: a1CanonicalContexts,
  personRoles: a1CanonicalPersonRoles,
  referents: a1CanonicalReferents,
  semanticValues: a1CanonicalSemanticValues,
  learningTargetSenses: a1CanonicalLearningTargetSenses,
};

function formKey(form: SentenceVariant["form"]): string {
  return `${form.polarity}:${form.tense}:${form.formality}${
    form.interrogative ? ":interrogative" : ""
  }`;
}

function deriveInheritedContent(): A1InheritedBaseContent {
  const conceptIds = new Set<string>();
  const senseIds = new Set<string>();
  const semanticValueIds = new Set<string>();
  const forms = new Set<string>();

  for (const built of a1AllStagedFoundationsBuiltLessons) {
    const modelIds = new Set<string>(built.recipe.modelVariantIds);
    for (const variant of built.variants) {
      if (!modelIds.has(variant.id)) continue;
      for (const valueId of Object.values(variant.slotValues)) {
        semanticValueIds.add(valueId);
      }
      forms.add(formKey(variant.form));

      const family = familyById.get(variant.sentenceFamilyId);
      if (!family) continue;
      const realized = realizeVariant(family, variant, realizeCatalogs, {
        availableConceptIds: [...family.requiredConceptIds],
      });
      if (!realized.ok) continue;
      for (const senseId of realized.sentence.usedLexemeSenseIds) senseIds.add(senseId);
      for (const conceptId of realized.sentence.usedConceptIds) conceptIds.add(conceptId);
    }
  }

  return {
    conceptIds: [...conceptIds].sort(),
    senseIds: [...senseIds].sort(),
    semanticValueIds: [...semanticValueIds].sort(),
    forms: [...forms].sort(),
  };
}

/** The concepts, senses, values and forms Base models before retained A1 opens. */
export const A1_INHERITED_BASE_CONTENT: A1InheritedBaseContent = deepFreeze(
  deriveInheritedContent(),
);
