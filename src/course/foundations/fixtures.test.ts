import { describe, expect, it } from "vitest";

import { validateRuntimeAliases } from "../data/personas";
import type {
  CanDo,
  FoundationLessonDefinition,
  LessonPositionRecord,
  PersonRole,
  Referent,
  SemanticValue,
  SentenceFamily,
  SentenceVariant,
} from "./types";
import {
  FOUNDATION_FIXTURE_LESSON_IDS,
  fixtureFamily,
  fixtureVariant,
  foundationCatalogs,
  foundationCopy,
  foundationFamilyById,
  foundationLessons,
  foundationVariantById,
  transferVariantIds,
  verbUseRecords,
} from "./fixtures";

/** Japanese (kana/kanji) code point ranges — used to prove no JP literal leaks. */
const JAPANESE_PATTERN =
  /[\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/;

function byId<T extends { readonly id: string }>(
  items: readonly T[],
): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function byKey<T, K extends string>(
  items: readonly T[],
  key: (item: T) => K,
): Map<K, T> {
  return new Map(items.map((item) => [key(item), item] as const));
}

/** Full-slot tuple signature used only by this test to prove structural facts. */
function tupleSignature(variant: SentenceVariant): string {
  return JSON.stringify({
    family: variant.sentenceFamilyId,
    subject: variant.discourse.subjectReferentId,
    subjectRealization: variant.discourse.subjectRealization,
    context: variant.contextId,
    slotValues: variant.slotValues,
    polarity: variant.form.polarity,
    tense: variant.form.tense,
  });
}

describe("foundation catalogs", () => {
  it("declares exactly the a1 and a2 levels", () => {
    expect(foundationCatalogs.levels.map((level) => level.id)).toEqual([
      "a1",
      "a2",
    ]);
  });

  it("exposes exactly the two fixture lessons", () => {
    expect(FOUNDATION_FIXTURE_LESSON_IDS).toEqual([
      "fixture-a1-personal-details",
      "fixture-a2-routine-plans",
    ]);
    expect(foundationLessons.map((lesson) => lesson.id)).toEqual(
      FOUNDATION_FIXTURE_LESSON_IDS,
    );
  });

  for (const lesson of foundationLessons) {
    describe(`lesson ${lesson.id}`, () => {
      it("has exactly 8 model variants", () => {
        expect(lesson.modelVariantIds).toHaveLength(8);
      });

      it("has a primary Can-do and at most two supporting Can-dos", () => {
        expect(typeof lesson.primaryCanDoId).toBe("string");
        expect(lesson.primaryCanDoId.length).toBeGreaterThan(0);
        expect(lesson.supportingCanDoIds.length).toBeLessThanOrEqual(2);
      });

      it("runs round one and round two at target count 5 each", () => {
        expect(lesson.practice.roundOne.targetCount).toBe(5);
        expect(lesson.practice.roundTwo.targetCount).toBe(5);
        expect(lesson.practice.roundOne.purpose).toBe("guided-controlled");
        expect(lesson.practice.roundTwo.purpose).toBe("transfer");
      });

      it("uses balanced-v1 selection and the required round-two exercise kinds", () => {
        expect(lesson.practice.roundOne.selectionPolicyId).toBe("balanced-v1");
        expect(lesson.practice.roundTwo.selectionPolicyId).toBe("balanced-v1");
        expect(lesson.practice.roundTwo.exerciseKinds).toContain(
          "constrained-construction",
        );
        expect(
          lesson.practice.roundTwo.exerciseKinds.includes("transformation") ||
            lesson.practice.roundTwo.exerciseKinds.includes("completion"),
        ).toBe(true);
      });

      it("declares the exact numeric diversity contract", () => {
        expect(lesson.diversityConstraints).toEqual({
          modelCountRange: [8, 12],
          exerciseCountRange: [8, 12],
          minFamilies: 3,
          minPredicates: 3,
          minRoles: 3,
          minContexts: 2,
          minUniqueTargets: 5,
          maxTargetReuse: 2,
          minTransferExercises: 2,
          requireControlledConstruction: true,
        });
      });

      it("round two's candidates are exactly this lesson's transfer variants", () => {
        expect(lesson.practice.roundTwo.candidateVariantIds).toEqual(
          transferVariantIds[lesson.id],
        );
        expect(transferVariantIds[lesson.id]).toHaveLength(5);
      });
    });
  }

  it("all catalog cross-references resolve", () => {
    const modulesById = byId(foundationCatalogs.modules);
    const checkpointsById = byId(foundationCatalogs.checkpoints);
    const canDosById = byId(foundationCatalogs.canDos);
    const contextsById = byId(foundationCatalogs.contexts);
    const personRolesById = byId(foundationCatalogs.personRoles);
    const referentsById = byId(foundationCatalogs.referents);
    const sensesById = byId(foundationCatalogs.learningTargetSenses);
    const semanticValuesById = byId(foundationCatalogs.semanticValues);
    const familiesById = byId(foundationCatalogs.sentenceFamilies);
    const variantsById = byId(foundationCatalogs.sentenceVariants);
    const lessonsById = byId(foundationCatalogs.lessons);
    const lessonPositionsById = byKey(
      foundationCatalogs.lessonPositions,
      (record: LessonPositionRecord) => record.lessonId,
    );

    for (const level of foundationCatalogs.levels) {
      for (const moduleId of level.moduleIds) {
        expect(modulesById.has(moduleId)).toBe(true);
      }
      for (const canDoId of level.canDoIds) {
        expect(canDosById.has(canDoId)).toBe(true);
      }
      if (level.recommendedPrerequisiteCheckpointId) {
        expect(
          checkpointsById.has(level.recommendedPrerequisiteCheckpointId),
        ).toBe(true);
      }
    }

    for (const foundationModule of foundationCatalogs.modules) {
      for (const canDoId of foundationModule.canDoIds) {
        expect(canDosById.has(canDoId)).toBe(true);
      }
      for (const lessonId of foundationModule.lessonIds) {
        expect(lessonPositionsById.has(lessonId)).toBe(true);
      }
    }

    for (const checkpoint of foundationCatalogs.checkpoints) {
      for (const canDoId of checkpoint.sampledCanDoIds) {
        expect(canDosById.has(canDoId)).toBe(true);
      }
    }

    for (const canDo of foundationCatalogs.canDos) {
      for (const contextId of canDo.contextIds) {
        expect(contextsById.has(contextId)).toBe(true);
      }
      for (const lessonId of canDo.lessonIds) {
        expect(lessonsById.has(lessonId)).toBe(true);
      }
    }

    for (const referent of foundationCatalogs.referents) {
      expect(personRolesById.has(referent.personRoleId)).toBe(true);
    }

    for (const sense of foundationCatalogs.learningTargetSenses) {
      expect(typeof sense.lexemeId).toBe("string");
    }

    for (const semanticValue of foundationCatalogs.semanticValues) {
      if (semanticValue.senseId) {
        expect(sensesById.has(semanticValue.senseId)).toBe(true);
      }
    }

    for (const variant of foundationCatalogs.sentenceVariants) {
      const family = familiesById.get(variant.sentenceFamilyId);
      expect(family).toBeDefined();
      expect(contextsById.has(variant.contextId)).toBe(true);
      expect(personRolesById.has(variant.discourse.speakerRoleId)).toBe(true);
      if (variant.discourse.addresseeRoleId) {
        expect(personRolesById.has(variant.discourse.addresseeRoleId)).toBe(
          true,
        );
      }
      if (variant.discourse.subjectReferentId) {
        expect(referentsById.has(variant.discourse.subjectReferentId)).toBe(
          true,
        );
      }

      const slotIds = new Set(
        (family as SentenceFamily).slotSchema.map((slot) => slot.id),
      );
      for (const [slotId, semanticValueId] of Object.entries(
        variant.slotValues,
      )) {
        expect(slotIds.has(slotId)).toBe(true);
        expect(semanticValuesById.has(semanticValueId)).toBe(true);
      }
      for (const slot of (family as SentenceFamily).slotSchema) {
        if (!slot.optional) {
          expect(variant.slotValues[slot.id]).toBeDefined();
        }
      }
    }

    for (const lesson of foundationCatalogs.lessons) {
      expect(modulesById.has(lesson.moduleId)).toBe(true);
      expect(canDosById.has(lesson.primaryCanDoId)).toBe(true);
      for (const supportingId of lesson.supportingCanDoIds) {
        expect(canDosById.has(supportingId)).toBe(true);
      }
      for (const variantId of lesson.modelVariantIds) {
        expect(variantsById.has(variantId)).toBe(true);
      }
      for (const familyId of lesson.familyIds) {
        expect(familiesById.has(familyId)).toBe(true);
      }
      for (const variantId of lesson.practice.roundOne.candidateVariantIds) {
        expect(variantsById.has(variantId)).toBe(true);
      }
      for (const variantId of lesson.practice.roundTwo.candidateVariantIds) {
        expect(variantsById.has(variantId)).toBe(true);
      }
    }

    for (const record of foundationCatalogs.lessonPositions) {
      expect(modulesById.has(record.moduleId)).toBe(true);
    }

    for (const verbUse of foundationCatalogs.verbUseRecords) {
      expect(lessonPositionsById.has(verbUse.introductionLessonId)).toBe(
        true,
      );
      for (const variantId of verbUse.introductionVariantIds) {
        expect(variantsById.has(variantId)).toBe(true);
      }
      expect(
        lessonsById.has(verbUse.introductionExercise.lessonId),
      ).toBe(true);
      expect(variantsById.has(verbUse.introductionExercise.targetVariantId)).toBe(
        true,
      );
      for (const laterUse of verbUse.laterUses) {
        expect(lessonPositionsById.has(laterUse.lessonId)).toBe(true);
        expect(variantsById.has(laterUse.variantId)).toBe(true);
      }
    }
  });

  it("has identical EN/IT copy keys and exact aligned Can-do descriptors", () => {
    const enKeys = Object.keys(foundationCopy.en).sort();
    const itKeys = Object.keys(foundationCopy.it).sort();
    expect(itKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(0);

    const a1CanDo = foundationCatalogs.canDos.find(
      (canDo) => canDo.id === "fixture-a1-can-do-personal-details",
    ) as CanDo;
    const a2CanDo = foundationCatalogs.canDos.find(
      (canDo) => canDo.id === "fixture-a2-can-do-routine-plans",
    ) as CanDo;

    expect(foundationCopy.en[a1CanDo.descriptorCopyId]).toBe(
      "Exchange basic personal details in a short, supported conversation.",
    );
    expect(foundationCopy.it[a1CanDo.descriptorCopyId]).toBe(
      "Scambiare semplici informazioni personali in una breve conversazione guidata.",
    );
    expect(foundationCopy.en[a2CanDo.descriptorCopyId]).toBe(
      "Describe a familiar routine and make a simple plan with another person.",
    );
    expect(foundationCopy.it[a2CanDo.descriptorCopyId]).toBe(
      "Descrivere una routine familiare e fare un semplice programma con un'altra persona.",
    );

    for (const canDo of foundationCatalogs.canDos) {
      expect(canDo.sourceNote).toBe("product-authored-jf-cefr-aligned");
    }
  });

  it("never uses certified/mastered/fluent/passed claim language in copy", () => {
    const forbidden = /certified|mastered|fluent|passed a1|passed a2/i;
    for (const value of Object.values(foundationCopy.en)) {
      expect(forbidden.test(value)).toBe(false);
    }
    for (const value of Object.values(foundationCopy.it)) {
      expect(forbidden.test(value)).toBe(false);
    }
  });

  it("carries no Japanese literal or answer-shaped field on variants or practice definitions", () => {
    for (const variant of foundationCatalogs.sentenceVariants) {
      const serialized = JSON.stringify(variant);
      expect(JAPANESE_PATTERN.test(serialized)).toBe(false);
      expect(serialized).not.toMatch(/"(canonicalJapanese|jp|romaji|answer)"/);
    }
    for (const lesson of foundationCatalogs.lessons) {
      const serialized = JSON.stringify(lesson.practice);
      expect(JAPANESE_PATTERN.test(serialized)).toBe(false);
      expect(serialized).not.toMatch(/"(canonicalJapanese|jp|romaji|answer)"/);
    }
  });

  it("passes validateRuntimeAliases cleanly", () => {
    expect(validateRuntimeAliases(foundationCatalogs)).toEqual([]);
    expect(validateRuntimeAliases(foundationCopy)).toEqual([]);
  });

  for (const lesson of foundationLessons) {
    describe(`lesson ${lesson.id} semantic diversity`, () => {
      const personRolesById = byId(foundationCatalogs.personRoles);
      const referentsById = byId(foundationCatalogs.referents);
      const semanticValuesById = byId(foundationCatalogs.semanticValues);
      const sensesById = byId(foundationCatalogs.learningTargetSenses);
      const familiesById = byId(foundationCatalogs.sentenceFamilies);

      function predicateOf(variant: SentenceVariant): string {
        const family = familiesById.get(
          variant.sentenceFamilyId,
        ) as SentenceFamily;
        const predicateSlot = family.slotSchema.find(
          (slot) => slot.axis === "predicate-verb",
        );
        if (!predicateSlot) return "none";
        const valueId = variant.slotValues[predicateSlot.id];
        const value = semanticValuesById.get(valueId) as SemanticValue;
        const sense = value.senseId ? sensesById.get(value.senseId) : undefined;
        return sense ? sense.predicate : "none";
      }

      function roleKindOf(variant: SentenceVariant): string {
        const referentId = variant.discourse.subjectReferentId;
        if (!referentId) return "none";
        const referent = referentsById.get(referentId) as Referent;
        const role = personRolesById.get(
          referent.personRoleId,
        ) as PersonRole;
        return role.kind;
      }

      it("spans at least 3 distinct predicates, 3 roles, and 2 contexts", () => {
        const models = lesson.modelVariantIds.map((id) => fixtureVariant(id));
        const predicates = new Set(models.map(predicateOf));
        const roles = new Set(
          models.map((variant) => variant.discourse.subjectReferentId),
        );
        const contexts = new Set(models.map((variant) => variant.contextId));

        expect(predicates.size).toBeGreaterThanOrEqual(3);
        expect(roles.size).toBeGreaterThanOrEqual(3);
        expect(contexts.size).toBeGreaterThanOrEqual(2);
      });

      it("uses at least 3 distinct person-role kinds and both explicit and omitted subjects", () => {
        const models = lesson.modelVariantIds.map((id) => fixtureVariant(id));
        const roleKinds = new Set(models.map(roleKindOf));
        const realizations = new Set(
          models.map((variant) => variant.discourse.subjectRealization),
        );

        expect(roleKinds.size).toBeGreaterThanOrEqual(3);
        expect(realizations.has("explicit")).toBe(true);
        expect(realizations.has("omitted")).toBe(true);
      });

      it("uses at least the 3 fixture families for this level", () => {
        const models = lesson.modelVariantIds.map((id) => fixtureVariant(id));
        const families = new Set(models.map((v) => v.sentenceFamilyId));
        expect(families.size).toBeGreaterThanOrEqual(3);
        for (const familyId of families) {
          expect(lesson.familyIds).toContain(familyId);
        }
      });
    });
  }

  it("keeps transfer variant IDs absent from the model set and their tuples absent from model tuples", () => {
    for (const lesson of foundationLessons) {
      const transferIds = transferVariantIds[lesson.id];
      for (const transferId of transferIds) {
        expect(lesson.modelVariantIds).not.toContain(transferId);
      }

      const modelTuples = new Set(
        lesson.modelVariantIds.map((id) => tupleSignature(fixtureVariant(id))),
      );
      for (const transferId of transferIds) {
        const transferTuple = tupleSignature(fixtureVariant(transferId));
        expect(modelTuples.has(transferTuple)).toBe(false);
      }
    }
  });

  it("meets the authored productive verb-recurrence prerequisites structurally", () => {
    const lessonPositionByLessonId = byKey(
      foundationCatalogs.lessonPositions,
      (record: LessonPositionRecord) => record.lessonId,
    );
    const lessonsById = byId(foundationLessons);

    expect(verbUseRecords.length).toBeGreaterThan(0);

    for (const verbUse of verbUseRecords) {
      // Rule 1: at least 2 structurally distinct realizations within the
      // introduction lesson itself (model or transfer targets both count).
      expect(verbUse.introductionVariantIds.length).toBeGreaterThanOrEqual(2);
      const introSignatures = new Set(
        verbUse.introductionVariantIds.map((id) =>
          tupleSignature(fixtureVariant(id)),
        ),
      );
      expect(introSignatures.size).toBeGreaterThanOrEqual(2);

      // Rule 2: a correctness-bearing exercise in the introduction lesson.
      const introLesson = lessonsById.get(
        verbUse.introductionExercise.lessonId,
      ) as FoundationLessonDefinition;
      expect(introLesson).toBeDefined();
      const round = [introLesson.practice.roundOne, introLesson.practice.roundTwo].find(
        (candidate) => candidate.id === verbUse.introductionExercise.roundId,
      );
      expect(round).toBeDefined();
      expect(round?.exerciseKinds).toContain(
        verbUse.introductionExercise.exerciseKind,
      );
      expect(round?.candidateVariantIds).toContain(
        verbUse.introductionExercise.targetVariantId,
      );

      // Rules 3-5: at least 2 later uses, one with a position gap >= 2, one
      // in a later module.
      expect(verbUse.laterUses.length).toBeGreaterThanOrEqual(2);
      const introPosition = lessonPositionByLessonId.get(
        verbUse.introductionLessonId,
      ) as LessonPositionRecord;

      const gaps = verbUse.laterUses.map((laterUse) => {
        const laterPosition = lessonPositionByLessonId.get(
          laterUse.lessonId,
        ) as LessonPositionRecord;
        return laterPosition.position - introPosition.position;
      });
      expect(gaps.some((gap) => gap >= 2)).toBe(true);

      const laterModules = verbUse.laterUses.map((laterUse) => {
        const laterPosition = lessonPositionByLessonId.get(
          laterUse.lessonId,
        ) as LessonPositionRecord;
        return laterPosition.moduleId;
      });
      expect(laterModules.some((moduleId) => moduleId !== introPosition.moduleId)).toBe(
        true,
      );

      // Rule 6: at least 2 distinct structures across introduction + reuse.
      const allSignatures = new Set([
        ...introSignatures,
        ...verbUse.laterUses.map((laterUse) =>
          tupleSignature(fixtureVariant(laterUse.variantId)),
        ),
      ]);
      expect(allSignatures.size).toBeGreaterThanOrEqual(2);
    }
  });

  it("exposes working strict lookup helpers", () => {
    const sampleFamilyId = foundationCatalogs.sentenceFamilies[0].id;
    const sampleVariantId = foundationCatalogs.sentenceVariants[0].id;

    expect(fixtureFamily(sampleFamilyId)).toBe(
      foundationFamilyById[sampleFamilyId],
    );
    expect(fixtureVariant(sampleVariantId)).toBe(
      foundationVariantById[sampleVariantId],
    );
    expect(() => fixtureFamily("not-a-real-family-id")).toThrow();
    expect(() => fixtureVariant("not-a-real-variant-id")).toThrow();
  });

  it("freezes every exported catalog array and rejects mutation", () => {
    expect(Object.isFrozen(foundationCatalogs.levels)).toBe(true);
    expect(Object.isFrozen(foundationCatalogs.sentenceVariants)).toBe(true);
    expect(Object.isFrozen(foundationLessons)).toBe(true);
    expect(Object.isFrozen(verbUseRecords)).toBe(true);
    expect(Object.isFrozen(foundationFamilyById)).toBe(true);
    expect(Object.isFrozen(foundationVariantById)).toBe(true);

    expect(() => {
      (foundationCatalogs.levels as unknown as unknown[]).push({});
    }).toThrow();
    expect(() => {
      (foundationLessons as unknown as unknown[]).push({});
    }).toThrow();
  });
});
