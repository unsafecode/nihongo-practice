import { deepFreeze } from "../../foundations/deepFreeze";
import { BASE_LESSON_MANIFEST } from "../manifest";
import {
  firstTeachOwnerKey,
  firstTeachLessonPosition,
  validateFirstTeachOwners,
  type FirstTeachOwner,
} from "../catalog/firstTeach";
import type {
  BaseConcept,
  BaseDialogueTurn,
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
const TE_IMASU_FORM_IDS = new Set(["te-imasu"]);
const TE_IMASU_OWNER_LESSON_ID = "requests-connection-4";

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
  return firstTeachLessonPosition(lessonId);
}

function isBeforeLesson(lessonId: string, referenceLessonId: string): boolean {
  const position = positionFor(lessonId);
  const referencePosition = positionFor(referenceLessonId);
  return (
    position !== undefined &&
    referencePosition !== undefined &&
    position < referencePosition
  );
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
  const validateSentence = (
    lesson: BaseLessonContent,
    sentence: BaseExample | BaseDialogueTurn,
    referenceId: string,
  ): void => {
    for (const lexemeId of sentence.lexemeIds) {
      validateOwnedReference(lesson, "lexeme", lexemeId);
    }
    for (const conceptId of sentence.conceptIds) {
      const concept = catalogs.concepts.get(conceptId);
      validateOwnedReference(lesson, ownerKindForConcept(concept), conceptId);
    }
    for (const formId of sentence.formIds) {
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
        TE_IMASU_FORM_IDS.has(formId) &&
        sentence.interpretationTags.includes("ongoing-now") &&
        isBeforeLesson(lesson.lessonId, TE_IMASU_OWNER_LESSON_ID)
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
      sentence.predicateAspect === "dynamic" &&
      sentence.interpretationTags.includes("ongoing-now") &&
      !sentence.formIds.some((formId) => TE_IMASU_FORM_IDS.has(formId))
    ) {
      push(lesson.lessonId, "dynamic-nonpast-ongoing-now", referenceId);
    }
    if (sentence.particleFrame) {
      const frame = validateParticleFrame(
        sentence.particleFrame.predicateSenseId,
        sentence.particleFrame.provided,
      );
      if (!frame.ok) {
        for (const error of frame.errors) {
          push(
            lesson.lessonId,
            "unlicensed-particle",
            referenceId,
            error.code,
          );
        }
      }
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
    for (const lexemeId of lesson.newLexemeIds) {
      const owner = ownerByKey.get(firstTeachOwnerKey("lexeme", lexemeId));
      if (owner?.lessonId !== lesson.lessonId) {
        push(lesson.lessonId, "new-lexeme-owner-mismatch", lexemeId);
      }
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
      validateSentence(lesson, example, example.id);
    }
    if (lesson.dialogueId) {
      const dialogue = catalogs.dialogues.get(lesson.dialogueId);
      if (dialogue) {
        for (const [index, turn] of dialogue.turns.entries()) {
          validateSentence(lesson, turn, `${dialogue.id}:${index}`);
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
  const emitted = new Set<string>();
  const append = (key: string, tokens: readonly { readonly jp: string }[]): void => {
    if (emitted.has(key)) return;
    emitted.add(key);
    surfaces.push(tokensJapanese(tokens));
  };
  const appendActivityTarget = (targetId: string): void => {
    const example = catalogs.examples.get(targetId);
    if (example) {
      append(`example:${example.id}`, example.tokens);
      return;
    }
    const acceptedAnswer = catalogs.acceptedAnswerTokens.get(targetId);
    if (acceptedAnswer) {
      append(`accepted-answer:${targetId}`, acceptedAnswer);
      return;
    }
    const audioTarget = catalogs.audioTargets.get(targetId);
    if (audioTarget) append(`audio:${targetId}`, audioTarget);
  };
  for (const lesson of lessons) {
    if (lesson.contract !== "phonetic") {
      for (const example of examplesFor(lesson, catalogs)) {
        append(`example:${example.id}`, example.tokens);
      }
      if (lesson.dialogueId) {
        const dialogue = catalogs.dialogues.get(lesson.dialogueId);
        if (dialogue) {
          for (const [index, turn] of dialogue.turns.entries()) {
            append(`dialogue:${dialogue.id}:${index}`, turn.tokens);
          }
        }
      }
    }
    for (const activity of lesson.activities) {
      if (activity.activityPromptTokens) {
        append(`activity-prompt:${lesson.lessonId}:${activity.id}`, activity.activityPromptTokens);
      }
      appendActivityTarget(activity.targetId);
    }
    if (lesson.contract === "phonetic") {
      for (const audioExemplarId of lesson.audioExemplarIds) {
        const audioTarget = catalogs.audioTargets.get(audioExemplarId);
        if (audioTarget) append(`audio:${audioExemplarId}`, audioTarget);
      }
    }
  }
  return surfaces.join("");
}
