import { deepFreeze } from "../../foundations/deepFreeze";
import { BASE_LESSON_MANIFEST } from "../manifest";
import {
  firstTeachOwnerKey,
  validateFirstTeachOwners,
  type FirstTeachOwner,
} from "../catalog/firstTeach";
import type {
  BaseConcept,
  BaseExample,
  BaseLessonContent,
  BaseValidationCatalogs,
} from "../catalog/types";
import { validateParticleFrame } from "../forms/particleLicensing";
import type { BaseValidationError, BaseValidationErrorCode } from "./lessonRules";

const ADJECTIVE_CELL_IDS = new Set([
  "remaining-copula-cells",
  "i-adjective-tense-polarity",
  "na-adjective-predicate-and-attributive",
]);
const FORBIDDEN_FORM_IDS = new Set(["explanatory-no", "ndesu"]);

function examplesFor(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
): readonly BaseExample[] {
  if (lesson.contract === "phonetic") return [];
  return lesson.workedExampleIds.flatMap((id) => {
    const example = catalogs.examples.get(id);
    return example ? [example] : [];
  });
}

function ownerKindForConcept(
  concept: BaseConcept | undefined,
): "concept" | "form" | "reference-entry" {
  return concept?.kind ?? "concept";
}

function tokensJapanese(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map((token) => token.jp).join("");
}

function positionFor(lessonId: string): number | undefined {
  return BASE_LESSON_MANIFEST[lessonId]?.position;
}

export function validateFirstTeachOrder(
  lessons: readonly BaseLessonContent[],
  owners: readonly FirstTeachOwner[],
  catalogs: BaseValidationCatalogs,
): readonly BaseValidationError[] {
  const errors: BaseValidationError[] = [];
  const ownerByKey = new Map(
    owners.map((owner) => [firstTeachOwnerKey(owner.kind, owner.contentId), owner]),
  );
  const push = (
    lessonId: string,
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ): void => {
    errors.push({
      code,
      stage: "sequence",
      lessonId,
      ...(referenceId ? { referenceId } : {}),
      ...(detail ? { detail } : {}),
    });
  };
  const validateOwnedReference = (
    lesson: BaseLessonContent,
    kind: FirstTeachOwner["kind"],
    id: string,
  ): void => {
    const owner = ownerByKey.get(firstTeachOwnerKey(kind, id));
    const lessonPosition = positionFor(lesson.lessonId);
    const ownerPosition = owner ? positionFor(owner.lessonId) : undefined;
    if (owner && lessonPosition !== undefined && ownerPosition !== undefined && ownerPosition > lessonPosition) {
      push(lesson.lessonId, "first-teach-before-owner", id);
    }
  };

  for (const lesson of lessons) {
    if (lesson.contract === "phonetic") {
      for (const activity of lesson.activities) {
        for (const lexemeId of activity.assessedLexemeIds) {
          validateOwnedReference(lesson, "lexeme", lexemeId);
        }
      }
      continue;
    }

    for (const lexemeId of [
      ...lesson.newLexemeIds,
      ...lesson.reviewLexemeIds,
      ...lesson.activities.flatMap((activity) => activity.assessedLexemeIds),
    ]) {
      validateOwnedReference(lesson, "lexeme", lexemeId);
    }
    const conceptIds = [
      ...lesson.introducedConceptIds,
      ...lesson.reviewedConceptIds,
      ...lesson.activities.flatMap((activity) => activity.assessedConceptIds),
    ];
    for (const conceptId of conceptIds) {
      const concept = catalogs.concepts.get(conceptId);
      validateOwnedReference(lesson, ownerKindForConcept(concept), conceptId);
    }
    for (const snapshotId of lesson.referenceSnapshotIds) {
      validateOwnedReference(lesson, "reference-entry", snapshotId);
    }

    for (const conceptId of lesson.introducedConceptIds) {
      const concept = catalogs.concepts.get(conceptId);
      const owner = ownerByKey.get(
        firstTeachOwnerKey(ownerKindForConcept(concept), conceptId),
      );
      if (owner?.lessonId !== lesson.lessonId) {
        push(lesson.lessonId, "introduced-id-owner-mismatch", conceptId);
      }
    }

    for (const example of examplesFor(lesson, catalogs)) {
      for (const lexemeId of example.lexemeIds) {
        validateOwnedReference(lesson, "lexeme", lexemeId);
      }
      for (const conceptId of example.conceptIds) {
        const concept = catalogs.concepts.get(conceptId);
        validateOwnedReference(lesson, ownerKindForConcept(concept), conceptId);
      }
      for (const formId of example.formIds) {
        const form = catalogs.concepts.get(formId);
        validateOwnedReference(lesson, ownerKindForConcept(form), formId);
        if (
          ADJECTIVE_CELL_IDS.has(formId) &&
          (BASE_LESSON_MANIFEST[lesson.lessonId]?.moduleId !== "copula-adjectives" &&
            BASE_LESSON_MANIFEST[lesson.lessonId]?.moduleId !== "existence-location" &&
            BASE_LESSON_MANIFEST[lesson.lessonId]?.moduleId !== "requests-connection" &&
            BASE_LESSON_MANIFEST[lesson.lessonId]?.moduleId !== "base-synthesis")
        ) {
          push(lesson.lessonId, "adjective-cell-before-module-seven", formId);
        }
        if (
          formId === "te-imasu" &&
          example.interpretationTags.includes("ongoing-now") &&
          lesson.lessonId !== "requests-connection-4"
        ) {
          push(
            lesson.lessonId,
            "te-imasu-ongoing-before-requests-connection-4",
            formId,
          );
        }
        if (FORBIDDEN_FORM_IDS.has(formId)) {
          push(lesson.lessonId, "forbidden-explanatory-no", formId);
        }
      }
      if (
        example.predicateAspect === "dynamic" &&
        example.interpretationTags.includes("ongoing-now")
      ) {
        push(lesson.lessonId, "dynamic-nonpast-ongoing-now", example.id);
      }
      if (example.particleFrame) {
        const frame = validateParticleFrame(
          example.particleFrame.predicateSenseId,
          example.particleFrame.provided,
        );
        if (!frame.ok) {
          for (const error of frame.errors) {
            push(
              lesson.lessonId,
              "unlicensed-particle",
              example.id,
              error.code,
            );
          }
        }
      }
    }
    if (lesson.dialogueId) {
      const dialogue = catalogs.dialogues.get(lesson.dialogueId);
      if (dialogue) {
        for (const turn of dialogue.turns) {
          for (const lexemeId of turn.lexemeIds) {
            validateOwnedReference(lesson, "lexeme", lexemeId);
          }
          for (const conceptId of turn.conceptIds) {
            const concept = catalogs.concepts.get(conceptId);
            validateOwnedReference(lesson, ownerKindForConcept(concept), conceptId);
          }
          for (const formId of turn.formIds) {
            const form = catalogs.concepts.get(formId);
            validateOwnedReference(lesson, ownerKindForConcept(form), formId);
            if (FORBIDDEN_FORM_IDS.has(formId)) {
              push(lesson.lessonId, "forbidden-explanatory-no", formId);
            }
          }
        }
      }
    }
    for (const id of [...lesson.introducedConceptIds, ...lesson.reviewedConceptIds]) {
      if (FORBIDDEN_FORM_IDS.has(id)) {
        push(lesson.lessonId, "forbidden-explanatory-no", id);
      }
    }
  }

  const ownerErrors = validateFirstTeachOwners(
    owners,
    [...catalogs.concepts.values()],
    [...catalogs.lexemes.values()],
  );
  for (const ownerError of ownerErrors) {
    const firstLessonId = lessons[0]?.lessonId ?? "unknown-lesson";
    if (ownerError.code === "prerequisite-after-dependent") {
      push(
        firstLessonId,
        "concept-prerequisite-order",
        ownerError.contentId,
        ownerError.referenceId,
      );
    } else if (ownerError.code === "prerequisite-cycle") {
      push(firstLessonId, "concept-prerequisite-cycle", ownerError.contentId);
    } else {
      push(firstLessonId, "first-teach-owner-invalid", ownerError.contentId, ownerError.code);
    }
  }
  return deepFreeze(errors);
}

/**
 * Builds the reviewable Japanese surface strictly from authoring tokens. It
 * intentionally has no locale or UI dependency.
 */
export function visibleJapaneseFor(
  lessons: readonly BaseLessonContent[],
  catalogs: BaseValidationCatalogs,
): string {
  const surfaces: string[] = [];
  for (const lesson of lessons) {
    if (lesson.contract === "phonetic") continue;
    for (const example of examplesFor(lesson, catalogs)) {
      surfaces.push(tokensJapanese(example.tokens));
    }
    if (lesson.dialogueId) {
      const dialogue = catalogs.dialogues.get(lesson.dialogueId);
      if (dialogue) {
        for (const turn of dialogue.turns) {
          surfaces.push(tokensJapanese(turn.tokens));
        }
      }
    }
    for (const activity of lesson.activities) {
      const accepted =
        catalogs.acceptedAnswerTokens.get(activity.targetId) ??
        catalogs.examples.get(activity.targetId)?.acceptedAnswerTokens;
      if (accepted) surfaces.push(tokensJapanese(accepted));
    }
  }
  return surfaces.join("");
}
