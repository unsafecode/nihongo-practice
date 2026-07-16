import { describe, expect, it } from "vitest";

import { validateRuntimeAliases } from "../data/personas";
import type {
  CanDo,
  FoundationLessonDefinition,
  LessonPositionRecord,
  LearningTargetSense,
  PersonRole,
  Referent,
  SemanticArgumentRole,
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
  withFixtureOverride,
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

/**
 * Full-slot semantic tuple signature. This intentionally includes
 * subject/context/slot-*value* IDs and is used **only** by the transfer
 * unseen-tuple test below, which must prove a transfer target's full
 * semantic combination (who + where/when + concrete lexical choices) never
 * duplicates a model's — a person or scenario swap *should* count there.
 */
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

/**
 * True *structural* signature (master spec §9.3): person-role diversity is
 * separate from structural diversity, so a subject/context/value swap alone
 * must never count as a distinct realization. Only pedagogically load-bearing
 * shape survives: the sentence family, whether the subject is realized or
 * naturally omitted, the form axis (tense/polarity), and the argument shape
 * (the *set* of populated slot names — not their concrete semantic values).
 */
function structuralSignature(variant: SentenceVariant): string {
  return JSON.stringify({
    family: variant.sentenceFamilyId,
    subjectRealization: variant.discourse.subjectRealization,
    tense: variant.form.tense,
    polarity: variant.form.polarity,
    argumentShape: Object.keys(variant.slotValues).sort(),
  });
}

/**
 * Predicate case frames govern lexical particles only. `agent` and `topic`
 * are discourse-driven, so they must never be required here.
 */
const GOVERNED_ARGUMENT_ROLES = new Set<SemanticArgumentRole>([
  "theme",
  "location",
  "time",
  "companion",
  "goal",
]);

function requiresPredicateParticle(role: SemanticArgumentRole): boolean {
  return GOVERNED_ARGUMENT_ROLES.has(role);
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

  describe("structural signature", () => {
    it("is unchanged by a subject-referent, context, or slot-value-only swap", () => {
      // Same family, same explicit realization, same tense/polarity, same
      // argument shape ({object, predicate, subject}) — only the subject
      // referent (yuki vs classmate), context, and object slot *value*
      // (japanese vs english) differ. None of those are structural.
      const yuki = fixtureVariant("fixture-a1-yuki-study-japanese");
      const classmate = fixtureVariant("fixture-a1-classmate-study-english");

      expect(yuki.discourse.subjectReferentId).not.toBe(
        classmate.discourse.subjectReferentId,
      );
      expect(yuki.slotValues.object).not.toBe(classmate.slotValues.object);
      expect(structuralSignature(yuki)).toBe(structuralSignature(classmate));
    });

    it("changes when subject realization flips from explicit to omitted", () => {
      const explicitVariant = fixtureVariant(
        "fixture-a1-transfer-yuki-work-company",
      );
      const omittedVariant = fixtureVariant("fixture-a1-omitted-work-company");

      expect(structuralSignature(explicitVariant)).not.toBe(
        structuralSignature(omittedVariant),
      );
    });

    it("changes when the argument shape (populated slot set) differs", () => {
      // Genuinely different argument shapes (time vs object), not an
      // explicit/omitted pair — that distinction is covered separately below
      // so it can't be conflated with subject-slot omission.
      const timeShaped = fixtureVariant("fixture-a2-friend-meet-after-work");
      const objectShaped = fixtureVariant("fixture-a2-friend-invite-lunch");

      expect(Object.keys(timeShaped.slotValues).sort()).not.toEqual(
        Object.keys(objectShaped.slotValues).sort(),
      );
      expect(structuralSignature(timeShaped)).not.toBe(
        structuralSignature(objectShaped),
      );
    });

    it("still differs explicit vs omitted even when the populated slot set is identical", () => {
      // Canonical convention: an omitted-subject variant retains its
      // "subject" slot value (the referent stays semantically populated —
      // only surface realization is dropped). So this pair's argument
      // shapes are identical; only `subjectRealization` distinguishes them
      // structurally, and it must keep doing so.
      const explicitVariant = fixtureVariant("fixture-a2-friend-meet-after-work");
      const omittedVariant = fixtureVariant(
        "fixture-a2-transfer-neighbor-meet-after-work",
      );

      expect(Object.keys(explicitVariant.slotValues).sort()).toEqual(
        Object.keys(omittedVariant.slotValues).sort(),
      );
      expect(structuralSignature(explicitVariant)).not.toBe(
        structuralSignature(omittedVariant),
      );
    });
  });

  describe("omitted-subject semantic consistency", () => {
    const semanticValuesById = byId(foundationCatalogs.semanticValues);

    /**
     * The semantic value canonically used to realize a subject referent,
     * derived from the fixture set's own already-consistent variants (any
     * referent used as an explicit/populated subject anywhere must always
     * resolve to exactly one semantic value). This lets the invariant below
     * check every variant — including omitted ones — without hard-coding a
     * referent -> value naming assumption.
     */
    function canonicalSubjectValueId(referentId: string): string {
      const valueIds = new Set(
        foundationCatalogs.sentenceVariants
          .filter(
            (variant) =>
              variant.discourse.subjectReferentId === referentId &&
              variant.slotValues.subject !== undefined,
          )
          .map((variant) => variant.slotValues.subject),
      );
      expect(valueIds.size).toBe(1);
      return [...valueIds][0] as string;
    }

    it("gives every variant with a subject referent a matching subject slot value, explicit or omitted", () => {
      const withReferent = foundationCatalogs.sentenceVariants.filter(
        (variant) => variant.discourse.subjectReferentId !== null,
      );
      expect(withReferent.length).toBeGreaterThan(0);

      for (const variant of withReferent) {
        const referentId = variant.discourse.subjectReferentId as string;
        const expectedValueId = canonicalSubjectValueId(referentId);
        expect(variant.slotValues.subject).toBe(expectedValueId);
      }
    });

    it("retains the subject semantic value on every omitted-subject variant", () => {
      const omittedVariants = foundationCatalogs.sentenceVariants.filter(
        (variant) => variant.discourse.subjectRealization === "omitted",
      );
      expect(omittedVariants.length).toBeGreaterThan(0);

      for (const variant of omittedVariants) {
        expect(variant.discourse.subjectReferentId).not.toBeNull();
        expect(variant.slotValues.subject).toBeDefined();
        expect(
          semanticValuesById.has(variant.slotValues.subject as string),
        ).toBe(true);
      }
    });

    it("marks the A2 time-action and sequence-action subject slot as semantically required", () => {
      // Omission is a discourse-controlled surface choice, not evidence the
      // semantic slot itself is optional — both A2 families that permit
      // pro-drop still require a populated subject slot value.
      const timeAction = fixtureFamily("fixture-a2-time-action");
      const sequenceAction = fixtureFamily("fixture-a2-sequence-action");
      const subjectSlotOf = (family: SentenceFamily) =>
        family.slotSchema.find((slot) => slot.id === "subject");

      expect(subjectSlotOf(timeAction)?.optional).toBe(false);
      expect(subjectSlotOf(sequenceAction)?.optional).toBe(false);
    });

    // Note: rendering (whether the realizer actually emits subject/topic
    // tokens) is out of scope here — that's gated on
    // `discourse.subjectRealization` by the Task 2 realizer, not tested by
    // this fixture-data invariant suite.
  });

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
      // Structural distinctness excludes semantic substitutions (subject
      // referent, context, concrete slot values) — a person swap alone must
      // not satisfy this rule; see `structuralSignature`.
      expect(verbUse.introductionVariantIds.length).toBeGreaterThanOrEqual(2);
      const introSignatures = new Set(
        verbUse.introductionVariantIds.map((id) =>
          structuralSignature(fixtureVariant(id)),
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
          structuralSignature(fixtureVariant(laterUse.variantId)),
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

  describe("deep immutability", () => {
    it("deep-freezes a representative sentence variant's nested records", () => {
      const variant = fixtureVariant("fixture-a1-yuki-live-rome");

      expect(Object.isFrozen(variant)).toBe(true);
      expect(Object.isFrozen(variant.slotValues)).toBe(true);
      expect(Object.isFrozen(variant.discourse)).toBe(true);
      expect(Object.isFrozen(variant.form)).toBe(true);

      expect(() => {
        (variant.slotValues as Record<string, string>).predicate = "tampered";
      }).toThrow();
      expect(() => {
        (variant.discourse as { subjectRealization: string }).subjectRealization =
          "tampered";
      }).toThrow();
      expect(() => {
        (variant.form as { tense: string }).tense = "past";
      }).toThrow();

      expect(variant.slotValues.predicate).toBe("fixture-a1-value-live");
      expect(variant.discourse.subjectRealization).toBe("explicit");
      expect(variant.form.tense).toBe("present");
    });

    it("deep-freezes a sentence family's slot schema entries", () => {
      const family = fixtureFamily("fixture-a1-residence-action");

      expect(Object.isFrozen(family)).toBe(true);
      expect(Object.isFrozen(family.slotSchema)).toBe(true);
      expect(Object.isFrozen(family.slotSchema[0])).toBe(true);
      expect(Object.isFrozen(family.permittedAxes)).toBe(true);

      expect(() => {
        (family.slotSchema[0] as { optional: boolean }).optional = true;
      }).toThrow();
      expect(family.slotSchema[0].optional).toBe(false);
    });

    it("deep-freezes a semantic value's token fragments", () => {
      const value = foundationCatalogs.semanticValues.find(
        (candidate) => candidate.id === "fixture-a1-value-live",
      ) as SemanticValue;

      expect(Object.isFrozen(value)).toBe(true);
      expect(Object.isFrozen(value.tokenFragments)).toBe(true);
      expect(Object.isFrozen(value.tokenFragments[0])).toBe(true);

      expect(() => {
        (value.tokenFragments[0] as { jp: string }).jp = "tampered";
      }).toThrow();
      expect(value.tokenFragments[0].jp).toBe("すみ");
    });

    it("deep-freezes lesson practice round candidates and diversity constraints", () => {
      const lesson = foundationLessons.find(
        (candidate) => candidate.id === "fixture-a1-personal-details",
      ) as FoundationLessonDefinition;

      expect(Object.isFrozen(lesson.practice)).toBe(true);
      expect(Object.isFrozen(lesson.practice.roundOne)).toBe(true);
      expect(Object.isFrozen(lesson.practice.roundOne.candidateVariantIds)).toBe(
        true,
      );
      expect(Object.isFrozen(lesson.diversityConstraints)).toBe(true);
      expect(Object.isFrozen(lesson.diversityConstraints.modelCountRange)).toBe(
        true,
      );

      expect(() => {
        (
          lesson.practice.roundOne.candidateVariantIds as unknown as unknown[]
        ).push("tampered");
      }).toThrow();
      expect(() => {
        (
          lesson.diversityConstraints.modelCountRange as unknown as number[]
        )[0] = 999;
      }).toThrow();
    });

    it("deep-freezes the bilingual copy record maps", () => {
      expect(Object.isFrozen(foundationCopy)).toBe(true);
      expect(Object.isFrozen(foundationCopy.en)).toBe(true);
      expect(Object.isFrozen(foundationCopy.it)).toBe(true);

      expect(() => {
        (foundationCopy.en as Record<string, string>)[
          "fixture-a1-level-alignment"
        ] = "tampered";
      }).toThrow();
    });

    it("withFixtureOverride returns a newly deep-frozen view without mutating the original", () => {
      const originalFamily = fixtureFamily("fixture-a1-residence-action");
      const originalPermittedAxes = originalFamily.permittedAxes;

      const overridden = withFixtureOverride(originalFamily, {
        permittedAxes: [...originalFamily.permittedAxes, "time"],
      });

      expect(overridden).not.toBe(originalFamily);
      expect(Object.isFrozen(overridden)).toBe(true);
      expect(Object.isFrozen(overridden.permittedAxes)).toBe(true);
      expect(overridden.permittedAxes).toContain("time");

      // The original must be untouched — same reference, same contents.
      expect(fixtureFamily("fixture-a1-residence-action")).toBe(originalFamily);
      expect(originalFamily.permittedAxes).toBe(originalPermittedAxes);
      expect(originalFamily.permittedAxes).not.toContain("time");

      expect(() => {
        (overridden.permittedAxes as unknown as unknown[]).push("context");
      }).toThrow();
    });
  });

  describe("natural location case frame", () => {
    it("gives every sense either no particle requirements or full coverage of its governed argument roles", () => {
      for (const sense of foundationCatalogs.learningTargetSenses) {
        const governedRoles = sense.argumentRoles
          .filter(requiresPredicateParticle)
          .slice()
          .sort();
        const particleRoles = Object.keys(sense.argumentParticleByRole).sort();

        expect(
          particleRoles.length === 0 ||
            JSON.stringify(particleRoles) === JSON.stringify(governedRoles),
        ).toBe(true);
      }
    });

    it("treats topic as discourse-driven, not predicate-governed, even beside a governed location role", () => {
      const topicAndLocationSense: LearningTargetSense = {
        id: "fixture-test-topic-location",
        lexemeId: "fixture-test-lexeme",
        learningUse: "productive",
        semanticFrameId: "fixture-test-frame",
        predicate: "live",
        argumentRoles: ["topic", "location"],
        argumentParticleByRole: { location: "ni" },
      };

      expect(requiresPredicateParticle("topic")).toBe(false);
      expect(requiresPredicateParticle("location")).toBe(true);
      expect(
        topicAndLocationSense.argumentRoles.filter(requiresPredicateParticle).sort(),
      ).toEqual(["location"]);
      expect(Object.keys(topicAndLocationSense.argumentParticleByRole).sort()).toEqual(
        ["location"],
      );
    });

    it("assigns location に to live and location で to work in the shared residence-action family", () => {
      const liveSense = foundationCatalogs.learningTargetSenses.find(
        (sense) => sense.id === "fixture-a1-sense-live",
      );
      const workSense = foundationCatalogs.learningTargetSenses.find(
        (sense) => sense.id === "fixture-a1-sense-work",
      );

      expect(liveSense?.argumentParticleByRole).toEqual({ location: "ni" });
      expect(workSense?.argumentParticleByRole).toEqual({ location: "de" });
    });

    it("lets same-family senses carry different case frames purely through sense metadata", () => {
      const liveVariant = fixtureVariant("fixture-a1-yuki-live-rome");
      const workVariant = fixtureVariant("fixture-a1-omitted-work-company");
      expect(liveVariant.sentenceFamilyId).toBe("fixture-a1-residence-action");
      expect(workVariant.sentenceFamilyId).toBe("fixture-a1-residence-action");

      const liveSense = foundationCatalogs.learningTargetSenses.find(
        (sense) => sense.id === "fixture-a1-sense-live",
      );
      const workSense = foundationCatalogs.learningTargetSenses.find(
        (sense) => sense.id === "fixture-a1-sense-work",
      );

      // Same family/rule id, but the case frame differs by sense metadata —
      // never by a hard-coded string/sense special case on the variants.
      expect(liveSense?.argumentParticleByRole.location).toBe("ni");
      expect(workSense?.argumentParticleByRole.location).toBe("de");
      expect(liveSense?.argumentParticleByRole.location).not.toBe(
        workSense?.argumentParticleByRole.location,
      );
    });
  });
});
