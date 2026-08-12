/**
 * A1 `a1LessonBuilders.ts` characterization baseline (Phase 3 Task 4,
 * pre-refactor safety net).
 *
 * `buildA1InstructionalLesson`/`a1Variant`/`a1StructureKey`/
 * `assembleA1FoundationCatalogs` are about to have their internals rewritten
 * to delegate the level-agnostic parts of lesson assembly to the new shared
 * `instructionalLessonKit`. This suite pins Module 2 (introductions)'s exact
 * *observable* output — built recipe/practice/diversity fields, variant ids,
 * families, realized Japanese/rōmaji/fingerprints for every model+transfer,
 * the assembled `FoundationCatalogs` lesson/position rows, and the merged
 * EN/IT copy — as the byte-identical baseline the refactor must reproduce.
 *
 * Deliberately scoped to public, already-exported surface only (`./shared`),
 * exactly like every other A1 module test — never the shared kit itself,
 * which A1 must not import (level-agnostic kit, no upward dependency).
 */
import { describe, expect, it } from "vitest";

import {
  a1Contexts,
  a1LearningTargetSenses,
  a1PersonRoles,
  a1Referents,
  a1SemanticValues,
  a1SentenceFamilies,
  assembleA1FoundationCatalogs,
  a1StructureKey,
} from "./shared";
import {
  module2Lessons,
  module2Recipe,
  module2VerbUseRecords,
} from "./module02Introductions";
import { realizeVariant } from "../../foundations/realizeFamily";
import { formatRomaji } from "../../../romaji/formatRomaji";
import type { SentenceFamily, SentenceVariant } from "../../foundations/types";

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

function realize(variant: SentenceVariant) {
  const fam = famById.get(variant.sentenceFamilyId);
  if (!fam) throw new Error(`unknown family ${variant.sentenceFamilyId}`);
  const r = realizeVariant(fam, variant, realizeCatalogs, {
    availableConceptIds: [...fam.requiredConceptIds],
  });
  if (!r.ok) throw new Error(`realize ${variant.id} failed: ${JSON.stringify(r.errors)}`);
  const romaji = formatRomaji(r.sentence.tokens);
  if (!romaji.ok) throw new Error(`formatRomaji ${variant.id} failed`);
  return { sentence: r.sentence, romaji: romaji.text };
}

describe("A1 characterization baseline · module 2 (introductions) — pre-kit-extraction", () => {
  it("pins the exact built lesson ids, order, and model/transfer counts", () => {
    expect(module2Lessons.map((b) => b.recipe.id)).toEqual([
      "introductions-1",
      "introductions-2",
      "introductions-3",
      "introductions-4",
    ]);
    expect(module2Lessons.map((b) => b.recipe.order)).toEqual([1, 2, 3, 4]);
    for (const built of module2Lessons) {
      const models = built.variants.filter((v) => v.pedagogicalUse === "model");
      const transfers = built.variants.filter((v) => v.pedagogicalUse === "transfer");
      expect(models).toHaveLength(8);
      expect(transfers).toHaveLength(5);
    }
  });

  it("pins the exact recipe/practice/diversity fields for every module-2 lesson", () => {
    const summary = module2Lessons.map((built) => ({
      id: built.recipe.id,
      moduleId: built.recipe.moduleId,
      order: built.recipe.order,
      contract: built.recipe.contract,
      primaryCanDoId: built.recipe.primaryCanDoId,
      supportingCanDoIds: built.recipe.supportingCanDoIds,
      modelVariantIds: built.recipe.modelVariantIds,
      guidedVariantIds: built.recipe.guidedVariantIds,
      spokenVariantId: built.recipe.spokenVariantId,
      introducedConceptIds: built.recipe.introducedConceptIds,
      // Task 16: Base-owned concepts are recorded as reviewed here, so the
      // pinned baseline shows both halves of the authored concept list.
      reviewedConceptIds: built.recipe.reviewedConceptIds,
      introducedSenseIds: built.recipe.introducedSenseIds,
      practice: built.recipe.practice,
      diversityConstraints: built.recipe.diversityConstraints,
    }));
    expect(summary).toMatchSnapshot();
  });

  it("pins the exact variant ids and families (in authored order) per lesson", () => {
    const summary = module2Lessons.map((built) => ({
      id: built.recipe.id,
      variantIds: built.variants.map((v) => v.id),
      families: built.variants.map((v) => v.sentenceFamilyId),
      subjectReferents: built.variants.map((v) => v.discourse.subjectReferentId),
      speakerRoles: built.variants.map((v) => v.discourse.speakerRoleId),
      structureKeys: built.variants.map((v) => a1StructureKey(v)),
    }));
    expect(summary).toMatchSnapshot();
  });

  it("pins the exact realized Japanese/rōmaji/fingerprint for every module-2 variant", () => {
    const summary = module2Lessons.flatMap((built) =>
      built.variants.map((variant) => {
        const { sentence, romaji } = realize(variant);
        return {
          id: variant.id,
          jp: sentence.canonicalJapanese,
          romaji,
          visibleTargetKey: sentence.visibleTargetKey,
          semanticFingerprint: sentence.semanticFingerprint,
          predicateSenseId: sentence.predicateSenseId,
          contextId: sentence.contextId,
          pedagogicalUse: sentence.pedagogicalUse,
        };
      }),
    );
    expect(summary).toMatchSnapshot();
  });

  it("pins the exact assembled FoundationCatalogs lesson/position rows for module 2", () => {
    const catalogs = assembleA1FoundationCatalogs({
      lessons: module2Lessons.map((b) => b.recipe),
      variants: module2Lessons.flatMap((b) => [...b.variants]),
      verbUseRecords: [...module2VerbUseRecords],
    });
    const lessonRows = catalogs.lessons.map((l) => ({
      id: l.id,
      level: l.level,
      moduleId: l.moduleId,
      primaryCanDoId: l.primaryCanDoId,
      supportingCanDoIds: l.supportingCanDoIds,
      modelVariantIds: l.modelVariantIds,
      familyIds: l.familyIds,
      practice: l.practice,
      diversityConstraints: l.diversityConstraints,
    }));
    expect(lessonRows).toMatchSnapshot();
    expect(catalogs.lessonPositions).toMatchSnapshot();
    expect(catalogs.verbUseRecords).toMatchSnapshot();
  });

  it("pins the exact module recipe (module02Recipe)", () => {
    expect(module2Recipe).toMatchSnapshot();
  });

  it("pins the exact merged EN/IT translation+scenario copy for module 2", () => {
    const en: Record<string, string> = {};
    const it: Record<string, string> = {};
    for (const built of module2Lessons) {
      Object.assign(en, built.en);
      Object.assign(it, built.it);
    }
    expect({ en, it }).toMatchSnapshot();
  });
});
