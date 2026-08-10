import type { AssembledToken } from "../../../romaji/types";
import { formatRomaji } from "../../../romaji/formatRomaji";
import { deepFreeze } from "../../foundations/deepFreeze";
import { BASE_LESSON_MANIFEST } from "../manifest";
import type {
  BaseActivityDefinition,
  BaseDialogueTurn,
  BaseExample,
  BaseLessonContent,
  BaseValidationCatalogs,
} from "../catalog/types";
import { validateParticleFrame } from "../forms/particleLicensing";
import {
  BASE_ACTIVITY_INTERACTIONS_BY_CATEGORY,
  BASE_ACTIVITY_OPERATION_BY_CATEGORY,
  BASE_PHONETIC_ACTIVITY_OPERATIONS,
} from "../catalog/types";
import {
  activityTargetOperationFingerprintFor,
  activityTargetVisibleSurfaceFor,
  semanticFingerprintFor,
  visibleSurfaceFingerprint,
} from "./fingerprints";

export type BaseValidationErrorCode =
  | "phonetic-contrast-count"
  | "invalid-phonetic-contrast-id"
  | "phonetic-anchor-count"
  | "phonetic-audio-count"
  | "phonetic-nonspoken-operations"
  | "phonetic-listening-count"
  | "phonetic-spoken-count"
  | "content-new-lexeme-count"
  | "content-example-count"
  | "system-new-lexeme-count"
  | "system-example-count"
  | "system-pattern-cell-unrepresented"
  | "synthesis-new-content"
  | "synthesis-review-lexeme-count"
  | "synthesis-retrieved-system-count"
  | "synthesis-example-count"
  | "synthesis-dialogue-turn-count"
  | "dialogue-speaker-count"
  | "invalid-speaker"
  | "missing-explanation-block"
  | "missing-reference-snapshot"
  | "invalid-prerequisite"
  | "semantic-nonspoken-activity-count"
  | "semantic-category-coverage"
  | "activity-category-cap"
  | "illegal-activity-combination"
  | "semantic-listening-audio-count"
  | "semantic-spoken-audio-count"
  | "duplicate-activity-id"
  | "duplicate-target-operation"
  | "duplicate-visible-target"
  | "activity-category-operation-mismatch"
  | "fingerprint-resolution"
  | "worked-example-reused-by-activity"
  | "duplicate-semantic-fingerprint"
  | "dialogue-example-fingerprint-overlap"
  | "unresolved-reference"
  | "first-teach-before-owner"
  | "introduced-id-owner-mismatch"
  | "new-lexeme-owner-mismatch"
  | "concept-prerequisite-order"
  | "concept-prerequisite-cycle"
  | "first-teach-owner-invalid"
  | "adjective-cell-before-module-seven"
  | "te-imasu-ongoing-before-requests-connection-4"
  | "dynamic-nonpast-ongoing-now"
  | "forbidden-explanatory-no"
  | "unlicensed-particle"
  | "invalid-token-sequence";

export interface BaseValidationError {
  readonly code: BaseValidationErrorCode;
  readonly stage: "lesson-depth" | "sequence";
  readonly lessonId: string;
  readonly referenceId?: string;
  readonly detail?: string;
}

function isCountWithin(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function uniqueIds(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function resolvedExamples(
  lesson: BaseLessonContent & { readonly workedExampleIds: readonly string[] },
  catalogs: BaseValidationCatalogs,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): readonly BaseExample[] {
  const examples: BaseExample[] = [];
  for (const exampleId of lesson.workedExampleIds) {
    const example = catalogs.examples.get(exampleId);
    if (!example) {
      push("unresolved-reference", exampleId, "worked example");
    } else {
      examples.push(example);
    }
  }
  return examples;
}

function validateReference(
  id: string,
  resolves: boolean,
  detail: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  if (!resolves) push("unresolved-reference", id, detail);
}

/**
 * Keeps every authoring token sequence on the same romaji and boundary rules,
 * regardless of whether it belongs to an example, prompt, answer, or audio.
 */
export function validateTokenSequence(
  tokens: readonly AssembledToken[],
): ReturnType<typeof formatRomaji> {
  return formatRomaji(tokens);
}

function validateTokens(
  tokens: readonly AssembledToken[],
  referenceId: string,
  label: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  const formatted = validateTokenSequence(tokens);
  if (!formatted.ok) {
    push(
      "invalid-token-sequence",
      referenceId,
      `${label}:${formatted.errors.map((error) => error.code).join(",")}`,
    );
  }
}

function validateActivities(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
  semantic: boolean,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  const activityIds = new Set<string>();
  const operations = new Set<string>();
  const visibleTargets = new Set<string>();
  const categoryCounts = new Map<string, number>();
  let nonspokenCount = 0;
  let listeningAudioCount = 0;
  let spokenAudioCount = 0;
  const workedSurfaces = new Set(
    lesson.contract === "phonetic"
      ? []
      : lesson.workedExampleIds.flatMap((exampleId) => {
          const example = catalogs.examples.get(exampleId);
          return example ? [visibleSurfaceFingerprint(example.tokens)] : [];
        }),
  );

  const isPhoneticLesson = lesson.contract === "phonetic";
  const phoneticOperations = new Set<string>(BASE_PHONETIC_ACTIVITY_OPERATIONS);
  const isBaseActivityCategory = (
    activity: BaseActivityDefinition,
  ): boolean =>
    activity.category !== "listening" && activity.category !== "spoken";
  const hasLegalInteraction = (activity: BaseActivityDefinition): boolean => {
    const allowed = BASE_ACTIVITY_INTERACTIONS_BY_CATEGORY[activity.category];
    return allowed?.includes(activity.interactionKind) ?? false;
  };
  const hasLegalActivityCombination = (
    activity: BaseActivityDefinition,
  ): boolean => {
    const expectedOperation = BASE_ACTIVITY_OPERATION_BY_CATEGORY[activity.category];
    if (!expectedOperation) return false;
    if (!hasLegalInteraction(activity)) return false;
    if (!isBaseActivityCategory(activity)) {
      return activity.mode === "audio" && activity.operation === expectedOperation;
    }
    if (activity.mode !== "non-spoken") return false;
    return isPhoneticLesson
      ? phoneticOperations.has(activity.operation)
      : activity.operation === expectedOperation;
  };
  const coveredPhoneticOperations = new Set<string>();

  for (const activity of lesson.activities) {
    if (activityIds.has(activity.id)) push("duplicate-activity-id", activity.id);
    activityIds.add(activity.id);
    const expectedOperation = BASE_ACTIVITY_OPERATION_BY_CATEGORY[activity.category];
    const allowsPhoneticOperation =
      isPhoneticLesson &&
      isBaseActivityCategory(activity) &&
      phoneticOperations.has(activity.operation);
    if (expectedOperation !== activity.operation && !allowsPhoneticOperation) {
      push(
        "activity-category-operation-mismatch",
        activity.id,
        `${activity.category}:${activity.operation}`,
      );
    }
    const legalActivityCombination = hasLegalActivityCombination(activity);
    if (!legalActivityCombination) {
      push(
        "illegal-activity-combination",
        activity.id,
        `${activity.category}:${activity.mode}:${activity.interactionKind}:${activity.operation}`,
      );
    }
    const targetOperation = activityTargetOperationFingerprintFor(activity, catalogs);
    if (targetOperation.ok) {
      if (operations.has(targetOperation.fingerprint)) {
        push("duplicate-target-operation", targetOperation.fingerprint);
      }
      operations.add(targetOperation.fingerprint);
    } else {
      push(
        "fingerprint-resolution",
        activity.targetId,
        targetOperation.error.code,
      );
      push("unresolved-reference", activity.targetId, "activity target");
    }
    if (activity.activityPromptTokens) {
      validateTokens(
        activity.activityPromptTokens,
        activity.id,
        "activity prompt",
        push,
      );
    }
    if (!catalogs.examples.has(activity.targetId)) {
      const acceptedAnswer = catalogs.acceptedAnswerTokens.get(activity.targetId);
      if (acceptedAnswer) {
        validateTokens(
          acceptedAnswer,
          activity.targetId,
          "activity accepted target",
          push,
        );
      } else {
        const audioTarget = catalogs.audioTargets.get(activity.targetId);
        if (audioTarget) {
          validateTokens(
            audioTarget,
            activity.targetId,
            "activity audio target",
            push,
          );
        }
      }
    }
    validateReference(
      activity.instructionCopyId,
      catalogs.copyIds.has(activity.instructionCopyId),
      "activity instruction copy",
      push,
    );
    validateReference(
      activity.acceptedFeedbackCopyId,
      catalogs.copyIds.has(activity.acceptedFeedbackCopyId),
      "activity accepted feedback copy",
      push,
    );
    validateReference(
      activity.retryFeedbackCopyId,
      catalogs.copyIds.has(activity.retryFeedbackCopyId),
      "activity retry feedback copy",
      push,
    );
    for (const conceptId of activity.assessedConceptIds) {
      validateReference(conceptId, catalogs.concepts.has(conceptId), "assessed concept", push);
    }
    for (const lexemeId of activity.assessedLexemeIds) {
      validateReference(lexemeId, catalogs.lexemes.has(lexemeId), "assessed lexeme", push);
    }
    const targetSurface = activityTargetVisibleSurfaceFor(activity, catalogs);
    if (targetSurface !== undefined) {
      if (visibleTargets.has(targetSurface)) {
        push("duplicate-visible-target", activity.targetId, activity.id);
      }
      visibleTargets.add(targetSurface);
    }
    if (targetSurface && workedSurfaces.has(targetSurface)) {
      push("worked-example-reused-by-activity", activity.targetId);
    }
    if (
      semantic &&
      legalActivityCombination &&
      isBaseActivityCategory(activity) &&
      activity.mode === "non-spoken"
    ) {
      nonspokenCount += 1;
      categoryCounts.set(
        activity.category,
        (categoryCounts.get(activity.category) ?? 0) + 1,
      );
    }
    if (
      legalActivityCombination &&
      activity.category === "listening" &&
      activity.interactionKind === "listening" &&
      activity.mode === "audio"
    ) {
      listeningAudioCount += 1;
    }
    if (
      legalActivityCombination &&
      activity.category === "spoken" &&
      activity.interactionKind === "spoken" &&
      activity.mode === "audio"
    ) {
      spokenAudioCount += 1;
    }
    if (
      isPhoneticLesson &&
      legalActivityCombination &&
      isBaseActivityCategory(activity) &&
      activity.mode === "non-spoken"
    ) {
      coveredPhoneticOperations.add(activity.operation);
    }
  }

  if (semantic) {
    if (nonspokenCount < 8) {
      push("semantic-nonspoken-activity-count", undefined, `${nonspokenCount}`);
    }
    if (categoryCounts.size < 6) {
      push("semantic-category-coverage", undefined, `${categoryCounts.size}`);
    }
    for (const [category, count] of categoryCounts) {
      if (count > 2) push("activity-category-cap", category, `${count}`);
    }
    if (listeningAudioCount !== 1) {
      push("semantic-listening-audio-count", undefined, `${listeningAudioCount}`);
    }
    if (spokenAudioCount !== 1) {
      push("semantic-spoken-audio-count", undefined, `${spokenAudioCount}`);
    }
  } else if (
    BASE_PHONETIC_ACTIVITY_OPERATIONS.some(
      (operation) => !coveredPhoneticOperations.has(operation),
    )
  ) {
    push(
      "phonetic-nonspoken-operations",
      undefined,
      `${coveredPhoneticOperations.size}`,
    );
  }
}

function countCountableLexemes(
  lexemeIds: readonly string[],
  catalogs: BaseValidationCatalogs,
): number {
  return uniqueIds(lexemeIds).filter((id) => catalogs.lexemes.get(id)?.countable).length;
}

function countMeaningfulAnchors(
  lexemeIds: readonly string[],
  catalogs: BaseValidationCatalogs,
): number {
  return uniqueIds(lexemeIds).filter((id) => {
    const lexeme = catalogs.lexemes.get(id);
    return (
      lexeme?.countable === true &&
      lexeme.meaningCopyId.trim().length > 0
    );
  }).length;
}

type SentenceLike =
  | Pick<
      BaseExample,
      "tokens" | "lexemeIds" | "conceptIds" | "formIds" | "patternCellIds" | "particleFrame"
    >
  | Pick<
      BaseDialogueTurn,
      "tokens" | "lexemeIds" | "conceptIds" | "formIds" | "patternCellIds" | "particleFrame"
    >;

function validateSentenceLikeReferences(
  sentence: SentenceLike,
  catalogs: BaseValidationCatalogs,
  referenceId: string,
  label: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  validateTokens(sentence.tokens, referenceId, label, push);
  for (const lexemeId of sentence.lexemeIds) {
    validateReference(lexemeId, catalogs.lexemes.has(lexemeId), `${label} lexeme`, push);
  }
  for (const conceptId of sentence.conceptIds) {
    validateReference(conceptId, catalogs.concepts.has(conceptId), `${label} concept`, push);
  }
  for (const formId of sentence.formIds) {
    validateReference(formId, catalogs.concepts.has(formId), `${label} form`, push);
  }
  for (const patternCellId of sentence.patternCellIds) {
    validateReference(
      patternCellId,
      catalogs.patternCellIds.has(patternCellId),
      `${label} pattern cell`,
      push,
    );
  }
  if (sentence.particleFrame) {
    const frame = validateParticleFrame(
      sentence.particleFrame.predicateSenseId,
      sentence.particleFrame.provided,
    );
    if (!frame.ok) {
      for (const error of frame.errors) {
        push("unlicensed-particle", referenceId, error.code);
      }
    }
  }
}

interface CanonicalExampleReference {
  readonly example: BaseExample;
  readonly referenceId: string;
  readonly label: string;
}

function canonicalExampleReferences(
  lesson: BaseLessonContent,
  workedExamples: readonly BaseExample[],
  catalogs: BaseValidationCatalogs,
): readonly CanonicalExampleReference[] {
  const canonical = new Map<string, CanonicalExampleReference>();
  for (const example of workedExamples) {
    canonical.set(example.id, {
      example,
      referenceId: example.id,
      label: "example",
    });
  }
  for (const activity of lesson.activities) {
    const example = catalogs.examples.get(activity.targetId);
    if (!example || canonical.has(example.id)) continue;
    canonical.set(example.id, {
      example,
      referenceId: activity.targetId,
      label: "activity target example",
    });
  }
  return [...canonical.values()];
}

function validateExampleReferences(
  references: readonly CanonicalExampleReference[],
  catalogs: BaseValidationCatalogs,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): readonly BaseExample[] {
  const fingerprints = new Set<string>();
  const uniqueExamples: BaseExample[] = [];
  for (const { example, referenceId, label } of references) {
    validateSentenceLikeReferences(example, catalogs, referenceId, label, push);
    const fingerprint = semanticFingerprintFor(example);
    if (fingerprints.has(fingerprint)) {
      push("duplicate-semantic-fingerprint", fingerprint);
    } else {
      uniqueExamples.push(example);
    }
    fingerprints.add(fingerprint);
    validateReference(
      example.teachingPurposeCopyId,
      catalogs.copyIds.has(example.teachingPurposeCopyId),
      `${label} teaching-purpose copy`,
      push,
    );
    if ("copyId" in example.translationCopy) {
      validateReference(
        example.translationCopy.copyId,
        catalogs.copyIds.has(example.translationCopy.copyId),
        `${label} translation copy`,
        push,
      );
    } else {
      validateReference(
        example.translationCopy.enCopyId,
        catalogs.copyIds.has(example.translationCopy.enCopyId),
        `${label} English translation copy`,
        push,
      );
      validateReference(
        example.translationCopy.itCopyId,
        catalogs.copyIds.has(example.translationCopy.itCopyId),
        `${label} Italian translation copy`,
        push,
      );
    }
  }
  return uniqueExamples;
}

export function validateBaseLessonDepth(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
): readonly BaseValidationError[] {
  const errors: BaseValidationError[] = [];
  const push = (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ): void => {
    errors.push({
      code,
      stage: "lesson-depth",
      lessonId: lesson.lessonId,
      ...(referenceId !== undefined ? { referenceId } : {}),
      ...(detail !== undefined ? { detail } : {}),
    });
  };

  validateReference(lesson.recapCopyId, catalogs.copyIds.has(lesson.recapCopyId), "recap copy", push);
  for (const prerequisiteId of lesson.prerequisiteLessonIds) {
    if (!BASE_LESSON_MANIFEST[prerequisiteId]) {
      push("invalid-prerequisite", prerequisiteId);
    }
  }

  if (lesson.contract === "phonetic") {
    validateExampleReferences(
      canonicalExampleReferences(lesson, [], catalogs),
      catalogs,
      push,
    );
    const contrastiveItemIds = uniqueIds(lesson.contrastiveItemIds);
    for (const contrastiveItemId of contrastiveItemIds) {
      if (contrastiveItemId.trim().length === 0) {
        push("invalid-phonetic-contrast-id", contrastiveItemId);
      }
    }
    const substantiveContrastCount = contrastiveItemIds.filter(
      (id) => id.trim().length > 0,
    ).length;
    if (!isCountWithin(substantiveContrastCount, 10, 16)) {
      push("phonetic-contrast-count", undefined, `${substantiveContrastCount}`);
    }
    const meaningfulAnchorCount = countMeaningfulAnchors(
      lesson.anchorLexemeIds,
      catalogs,
    );
    if (!isCountWithin(meaningfulAnchorCount, 4, 8)) {
      push("phonetic-anchor-count", undefined, `${meaningfulAnchorCount}`);
    }
    for (const lexemeId of uniqueIds(lesson.anchorLexemeIds)) {
      validateReference(lexemeId, catalogs.lexemes.has(lexemeId), "phonetic anchor", push);
    }
    const audioSurfaces = new Set<string>();
    for (const audioId of uniqueIds(lesson.audioExemplarIds)) {
      const audioTarget = catalogs.audioTargets.get(audioId);
      validateReference(audioId, audioTarget !== undefined, "phonetic audio exemplar", push);
      if (audioTarget) {
        validateTokens(audioTarget, audioId, "phonetic audio exemplar", push);
        const surface = visibleSurfaceFingerprint(audioTarget);
        if (surface.length > 0) audioSurfaces.add(surface);
      }
    }
    if (audioSurfaces.size < 6) {
      push("phonetic-audio-count", undefined, `${audioSurfaces.size}`);
    }
    validateReference(
      lesson.phoneticExplanationCopyId,
      catalogs.copyIds.has(lesson.phoneticExplanationCopyId),
      "phonetic explanation copy",
      push,
    );
    validateReference(
      lesson.contrastMapId,
      catalogs.contrastMapIds.has(lesson.contrastMapId),
      "phonetic contrast map",
      push,
    );
    const listeningCount = lesson.activities.filter(
      (activity) =>
        activity.category === "listening" &&
        activity.interactionKind === "listening" &&
        activity.mode === "audio",
    ).length;
    const spokenCount = lesson.activities.filter(
      (activity) =>
        activity.category === "spoken" &&
        activity.interactionKind === "spoken" &&
        activity.mode === "audio",
    ).length;
    if (listeningCount !== 1) push("phonetic-listening-count", undefined, `${listeningCount}`);
    if (spokenCount !== 1) push("phonetic-spoken-count", undefined, `${spokenCount}`);
    validateActivities(lesson, catalogs, false, push);
    return deepFreeze(errors);
  }

  for (const explanationId of Object.values(lesson.explanationBlockIds)) {
    if (!explanationId) push("missing-explanation-block");
    else validateReference(explanationId, catalogs.copyIds.has(explanationId), "explanation block", push);
  }
  if (lesson.referenceSnapshotIds.length === 0) {
    push("missing-reference-snapshot");
  }
  for (const snapshotId of lesson.referenceSnapshotIds) {
    validateReference(
      snapshotId,
      catalogs.referenceSnapshotIds.has(snapshotId),
      "reference snapshot",
      push,
    );
  }
  for (const lexemeId of [...lesson.newLexemeIds, ...lesson.reviewLexemeIds]) {
    validateReference(lexemeId, catalogs.lexemes.has(lexemeId), "lesson lexeme", push);
  }
  for (const conceptId of [...lesson.introducedConceptIds, ...lesson.reviewedConceptIds]) {
    validateReference(conceptId, catalogs.concepts.has(conceptId), "lesson concept", push);
  }

  const examples = resolvedExamples(lesson, catalogs, push);
  const canonicalExamples = canonicalExampleReferences(lesson, examples, catalogs);
  const uniqueExamples = validateExampleReferences(canonicalExamples, catalogs, push);
  const workedExampleIds = new Set(examples.map((example) => example.id));
  const uniqueWorkedExamples = uniqueExamples.filter((example) =>
    workedExampleIds.has(example.id),
  );
  validateActivities(lesson, catalogs, true, push);

  const dialogue = lesson.dialogueId ? catalogs.dialogues.get(lesson.dialogueId) : undefined;
  if (lesson.dialogueId && !dialogue) {
    push("unresolved-reference", lesson.dialogueId, "dialogue");
  }
  if (dialogue) {
    validateReference(
      dialogue.practicalOutcomeCopyId,
      catalogs.copyIds.has(dialogue.practicalOutcomeCopyId),
      "dialogue outcome copy",
      push,
    );
    const exampleFingerprints = new Set(examples.map(semanticFingerprintFor));
    const dialogueFingerprints = new Set<string>();
    const speakerIds = new Set<string>();
    for (const [index, turn] of dialogue.turns.entries()) {
      const turnReferenceId = `${dialogue.id}:${index}`;
      const speakerId = turn.speakerId.trim();
      if (speakerId.length === 0) {
        push("invalid-speaker", turnReferenceId);
      } else {
        speakerIds.add(speakerId);
      }
      validateSentenceLikeReferences(
        turn,
        catalogs,
        turnReferenceId,
        "dialogue turn",
        push,
      );
      const fingerprint = semanticFingerprintFor(turn);
      if (
        exampleFingerprints.has(fingerprint) ||
        dialogueFingerprints.has(fingerprint)
      ) {
        push("dialogue-example-fingerprint-overlap", fingerprint);
      }
      dialogueFingerprints.add(fingerprint);
    }
    if (speakerIds.size < 2) {
      push("dialogue-speaker-count", dialogue.id, `${speakerIds.size}`);
    }
    if (lesson.interactive && !isCountWithin(dialogue.turns.length, 4, 8)) {
      push(
        "synthesis-dialogue-turn-count",
        lesson.dialogueId ?? undefined,
        `${dialogue.turns.length}`,
      );
    }
  } else if (lesson.interactive) {
    push("synthesis-dialogue-turn-count", lesson.dialogueId ?? undefined);
  }

  if (lesson.contract === "content") {
    const newCount = countCountableLexemes(lesson.newLexemeIds, catalogs);
    if (!isCountWithin(newCount, 8, 12)) {
      push("content-new-lexeme-count", undefined, `${newCount}`);
    }
    if (!isCountWithin(uniqueIds(lesson.workedExampleIds).length, 6, 10)) {
      push("content-example-count", undefined, `${uniqueIds(lesson.workedExampleIds).length}`);
    }
  }
  if (lesson.contract === "system") {
    const newCount = countCountableLexemes(lesson.newLexemeIds, catalogs);
    if (!isCountWithin(newCount, 3, 6)) {
      push("system-new-lexeme-count", undefined, `${newCount}`);
    }
    if (!isCountWithin(uniqueIds(lesson.workedExampleIds).length, 10, 14)) {
      push("system-example-count", undefined, `${uniqueIds(lesson.workedExampleIds).length}`);
    }
    for (const patternCellId of lesson.patternCellIds) {
      if (
        !uniqueWorkedExamples.some((example) =>
          example.patternCellIds.includes(patternCellId),
        )
      ) {
        push("system-pattern-cell-unrepresented", patternCellId);
      }
    }
  }
  if (lesson.contract === "synthesis") {
    if (lesson.newLexemeIds.length > 0 || lesson.introducedConceptIds.length > 0) {
      push("synthesis-new-content");
    }
    if (uniqueIds(lesson.reviewLexemeIds).length < 12) {
      push(
        "synthesis-review-lexeme-count",
        undefined,
        `${uniqueIds(lesson.reviewLexemeIds).length}`,
      );
    }
    if (uniqueIds(lesson.retrievedSystemIds).length < 4) {
      push(
        "synthesis-retrieved-system-count",
        undefined,
        `${uniqueIds(lesson.retrievedSystemIds).length}`,
      );
    }
    if (!isCountWithin(uniqueIds(lesson.workedExampleIds).length, 6, 10)) {
      push("synthesis-example-count", undefined, `${uniqueIds(lesson.workedExampleIds).length}`);
    }
    if (!dialogue || !isCountWithin(dialogue.turns.length, 4, 8)) {
      push("synthesis-dialogue-turn-count", lesson.dialogueId ?? undefined);
    }
  }
  return deepFreeze(errors);
}
