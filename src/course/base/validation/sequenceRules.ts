import { deepFreeze } from "../../foundations/deepFreeze";
import { lessonOwner } from "../../levels/ownership";
import {
  BASE_CANONICAL_POSITIONS,
  BASE_LESSON_MANIFEST,
  requiredBaseLessonPrerequisiteFor,
} from "../manifest";
import {
  firstTeachOwnerKey,
  firstTeachLessonPosition,
  validateFirstTeachOwners,
  type FirstTeachOwner,
} from "../catalog/firstTeach";
import {
  baseVisibleTargetForDialogueTurn,
  type BaseConcept,
  type BaseExample,
  type BaseLessonContent,
  type BaseValidationCatalogs,
  type BaseVisibleTarget,
} from "../catalog/types";
import {
  activityPromptTargetReferenceFor,
  activityTargetReferenceFor,
  audioTargetReferenceFor,
} from "../catalog/visibleTargets";
import {
  BASE_PARTICLE_FRAME_BY_PREDICATE,
  particleSenseFirstTeachContentId,
  validateParticleFrame,
} from "../forms/particleLicensing";
import type { BaseValidationError, BaseValidationErrorCode } from "./lessonRules";

export {
  BASE_REQUIRED_PREREQUISITE_BY_LESSON,
  requiredBaseLessonPrerequisiteFor,
} from "../manifest";

const ADJECTIVE_CELL_IDS = new Set([
  "remaining-copula-cells",
  "i-adjective-tense-polarity",
  "na-adjective-predicate-and-attributive",
]);
const FORBIDDEN_FORM_IDS = new Set(["explanatory-no", "ndesu"]);
const TE_IMASU_FORM_IDS = new Set(["te-imasu"]);
const TE_IMASU_OWNER_LESSON_ID = "requests-connection-4";

function workedExamplesFor(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
): readonly BaseExample[] {
  if (lesson.contract === "phonetic") return [];
  return lesson.workedExampleIds.flatMap((id) => {
    const example = catalogs.examples.get(id);
    return example ? [example] : [];
  });
}

interface CanonicalExampleReference {
  readonly example: BaseExample;
  readonly referenceId: string;
  readonly sourceLabel: string;
}

function canonicalExamplesFor(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
): readonly CanonicalExampleReference[] {
  const canonical = new Map<string, CanonicalExampleReference>();
  for (const example of workedExamplesFor(lesson, catalogs)) {
    canonical.set(example.id, {
      example,
      referenceId: example.id,
      sourceLabel: "example",
    });
  }
  for (const activity of lesson.activities) {
    const example = catalogs.examples.get(activity.targetId);
    if (!example || canonical.has(example.id)) continue;
    canonical.set(example.id, {
      example,
      referenceId: activity.targetId,
      sourceLabel: "activity target example",
    });
  }
  return [...canonical.values()];
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

/**
 * Valid lesson prerequisites always point strictly backward in the canonical
 * order, so a valid graph cannot contain a cycle. This full-array pass still
 * reports cycles additively for malformed authoring input.
 */
export function validateBaseLessonPrerequisiteGraph(
  lessons: readonly BaseLessonContent[],
): readonly BaseValidationError[] {
  const errors: BaseValidationError[] = [];
  const push = (
    lessonId: string,
    code: BaseValidationErrorCode,
    referenceId?: string,
  ): void => {
    errors.push({
      code,
      stage: "sequence",
      lessonId,
      ...(referenceId ? { referenceId } : {}),
    });
  };
  const byLessonId = new Map(lessons.map((lesson) => [lesson.lessonId, lesson]));

  for (const lesson of lessons) {
    const seen = new Set<string>();
    const lessonPosition = BASE_CANONICAL_POSITIONS[lesson.lessonId];
    const requiredPrerequisite = requiredBaseLessonPrerequisiteFor(lesson.lessonId);
    if (
      requiredPrerequisite !== undefined &&
      requiredPrerequisite !== null &&
      !lesson.prerequisiteLessonIds.includes(requiredPrerequisite)
    ) {
      push(lesson.lessonId, "missing-required-prerequisite", requiredPrerequisite);
    }
    for (const prerequisiteId of lesson.prerequisiteLessonIds) {
      if (seen.has(prerequisiteId)) {
        push(lesson.lessonId, "duplicate-prerequisite", prerequisiteId);
      }
      seen.add(prerequisiteId);
      if (prerequisiteId === lesson.lessonId) {
        push(lesson.lessonId, "self-prerequisite", prerequisiteId);
      }
      if (!BASE_LESSON_MANIFEST[prerequisiteId]) {
        push(lesson.lessonId, "invalid-prerequisite", prerequisiteId);
        continue;
      }
      if (
        lessonPosition !== undefined &&
        BASE_CANONICAL_POSITIONS[prerequisiteId] >= lessonPosition
      ) {
        push(lesson.lessonId, "future-prerequisite", prerequisiteId);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];
  const cycleLessonIds = new Set<string>();
  const visit = (lessonId: string): void => {
    if (visiting.has(lessonId)) {
      const start = path.indexOf(lessonId);
      path.slice(start).forEach((id) => cycleLessonIds.add(id));
      return;
    }
    if (visited.has(lessonId)) return;
    const lesson = byLessonId.get(lessonId);
    if (!lesson) return;
    visiting.add(lessonId);
    path.push(lessonId);
    for (const prerequisiteId of lesson.prerequisiteLessonIds) {
      if (byLessonId.has(prerequisiteId)) visit(prerequisiteId);
    }
    path.pop();
    visiting.delete(lessonId);
    visited.add(lessonId);
  };
  for (const lesson of lessons) visit(lesson.lessonId);
  for (const lessonId of cycleLessonIds) {
    push(lessonId, "lesson-prerequisite-cycle", lessonId);
  }
  return deepFreeze(errors);
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
    sourceLabel?: string,
    reportedId = id,
  ): void => {
    const owner = ownerByKey.get(firstTeachOwnerKey(kind, id));
    const catalogFirstTeachLessonId =
      kind === "lexeme"
        ? catalogs.lexemes.get(id)?.firstTeachLessonId
        : kind === "reference-entry"
          ? catalogs.referenceSnapshots.get(id)?.firstTeachLessonId
          : catalogs.concepts.get(id)?.firstTeachLessonId;
    if (!owner) {
      push(lesson.lessonId, "missing-first-teach-owner", reportedId, sourceLabel);
      if (owners.some((candidate) => candidate.contentId === id)) {
        push(lesson.lessonId, "owner-catalog-mismatch", reportedId, sourceLabel);
      }
      return;
    }
    const catalogLesson = catalogFirstTeachLessonId
      ? lessonOwner(catalogFirstTeachLessonId)
      : undefined;
    if (
      catalogFirstTeachLessonId !== undefined &&
      (owner.lessonId !== catalogFirstTeachLessonId ||
        (catalogLesson != null && owner.levelId !== catalogLesson.levelId))
    ) {
      push(lesson.lessonId, "owner-catalog-mismatch", reportedId, sourceLabel);
    }
    const lessonPosition = positionFor(lesson.lessonId);
    const ownerPosition = owner ? positionFor(owner.lessonId) : undefined;
    if (owner && lessonPosition !== undefined && ownerPosition !== undefined && ownerPosition > lessonPosition) {
      push(lesson.lessonId, "first-teach-before-owner", reportedId, sourceLabel);
    }
  };
  const validateParticleSenseOwner = (
    lesson: BaseLessonContent,
    particleSense: string,
    sourceLabel?: string,
  ): void => {
    const contentId = particleSenseFirstTeachContentId(
      particleSense as Parameters<typeof particleSenseFirstTeachContentId>[0],
    );
    const concept = catalogs.concepts.get(contentId);
    validateOwnedReference(
      lesson,
      ownerKindForConcept(concept),
      contentId,
      sourceLabel,
      particleSense,
    );
  };
  const validateSentence = (
    lesson: BaseLessonContent,
    sentence: BaseVisibleTarget,
    referenceId: string,
    sourceLabel?: string,
  ): void => {
    for (const lexemeId of sentence.lexemeIds) {
      validateOwnedReference(lesson, "lexeme", lexemeId, sourceLabel);
    }
    for (const conceptId of sentence.conceptIds) {
      const concept = catalogs.concepts.get(conceptId);
      validateOwnedReference(
        lesson,
        ownerKindForConcept(concept),
        conceptId,
        sourceLabel,
      );
    }
    for (const formId of sentence.formIds) {
      const form = catalogs.concepts.get(formId);
      validateOwnedReference(
        lesson,
        ownerKindForConcept(form),
        formId,
        sourceLabel,
      );
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
      const predicateFrame = BASE_PARTICLE_FRAME_BY_PREDICATE.get(
        sentence.particleFrame.predicateSenseId as Parameters<
          typeof BASE_PARTICLE_FRAME_BY_PREDICATE.get
        >[0],
      );
      if (
        sentence.predicateSenseId !== sentence.particleFrame.predicateSenseId ||
        typeof sentence.predicateLexemeId !== "string" ||
        !sentence.lexemeIds.includes(sentence.predicateLexemeId) ||
        predicateFrame?.allowedPredicateLexemeIds.includes(
          sentence.predicateLexemeId,
        ) !== true
      ) {
        push(
          lesson.lessonId,
          "particle-frame-predicate-mismatch",
          referenceId,
          sourceLabel,
        );
      }
      const provided = sentence.particleFrame.provided;
      if (
        provided !== null &&
        typeof provided === "object" &&
        !Array.isArray(provided)
      ) {
        for (const particleSense of Object.values(provided)) {
          if (typeof particleSense === "string") {
            validateParticleSenseOwner(lesson, particleSense, sourceLabel);
          }
        }
      }
      const frame = validateParticleFrame(
        sentence.particleFrame.predicateSenseId,
        sentence.particleFrame.provided,
      );
      if (!frame.ok) {
        for (const error of frame.errors) {
          push(
            lesson.lessonId,
            error.code === "unlicensed-particle"
              ? "unlicensed-particle"
              : "invalid-particle-frame",
            referenceId,
            error.code,
          );
        }
      }
    }
  };

  for (const lesson of lessons) {
    for (const activity of lesson.activities) {
      for (const lexemeId of activity.assessedLexemeIds) {
        validateOwnedReference(
          lesson,
          "lexeme",
          lexemeId,
          `activity assessment:${activity.id}`,
        );
      }
      for (const conceptId of activity.assessedConceptIds) {
        const concept = catalogs.concepts.get(conceptId);
        validateOwnedReference(
          lesson,
          ownerKindForConcept(concept),
          conceptId,
          `activity assessment:${activity.id}`,
        );
      }
      const promptTarget = activityPromptTargetReferenceFor(
        lesson.lessonId,
        activity,
        catalogs,
      );
      if (promptTarget) {
        validateSentence(
          lesson,
          promptTarget.target,
          promptTarget.referenceId,
          promptTarget.label,
        );
      }
      const target = activityTargetReferenceFor(activity, catalogs);
      if (target && target.source !== "example") {
        validateSentence(lesson, target.target, target.referenceId, target.label);
      }
    }
    for (const reference of canonicalExamplesFor(lesson, catalogs)) {
      validateSentence(
        lesson,
        reference.example,
        reference.referenceId,
        reference.sourceLabel,
      );
    }

    if (lesson.contract === "phonetic") {
      for (const audioExemplarId of lesson.audioExemplarIds) {
        const target = audioTargetReferenceFor(audioExemplarId, catalogs);
        if (target) {
          validateSentence(lesson, target.target, target.referenceId, target.label);
        }
      }
    }

    if (lesson.contract === "phonetic") continue;

    for (const lexemeId of [
      ...lesson.newLexemeIds,
      ...lesson.reviewLexemeIds,
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

    if (lesson.dialogueId) {
      const dialogue = catalogs.dialogues.get(lesson.dialogueId);
      if (dialogue) {
        for (const [index, turn] of dialogue.turns.entries()) {
          validateSentence(
            lesson,
            baseVisibleTargetForDialogueTurn(turn),
            `${dialogue.id}:${index}`,
          );
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
    [...catalogs.referenceSnapshots.values()],
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
    } else if (ownerError.code === "missing-owner") {
      push(firstLessonId, "missing-first-teach-owner", ownerError.contentId);
    } else if (ownerError.code === "owner-catalog-mismatch") {
      push(firstLessonId, "owner-catalog-mismatch", ownerError.contentId);
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
  const appendActivityTarget = (
    activity: BaseLessonContent["activities"][number],
  ): void => {
    const target = activityTargetReferenceFor(activity, catalogs);
    if (target) append(`${target.source}:${target.referenceId}`, target.target.tokens);
  };
  for (const lesson of lessons) {
    if (lesson.contract !== "phonetic") {
      for (const example of workedExamplesFor(lesson, catalogs)) {
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
      const promptTarget = activityPromptTargetReferenceFor(
        lesson.lessonId,
        activity,
        catalogs,
      );
      if (promptTarget) {
        append(
          `activity-prompt:${lesson.lessonId}:${activity.id}`,
          promptTarget.target.tokens,
        );
      }
      appendActivityTarget(activity);
    }
    if (lesson.contract === "phonetic") {
      for (const audioExemplarId of lesson.audioExemplarIds) {
        const audioTarget = audioTargetReferenceFor(audioExemplarId, catalogs);
        if (audioTarget) append(`audio:${audioExemplarId}`, audioTarget.target.tokens);
      }
    }
  }
  return surfaces.join("");
}
