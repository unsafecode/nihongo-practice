import { deepFreeze } from "../../foundations/deepFreeze";
import { BASE_LESSON_MANIFEST } from "../manifest";
import type {
  BaseExample,
  BaseLessonContent,
  BaseValidationCatalogs,
} from "../catalog/types";
import { BASE_ACTIVITY_OPERATION_BY_CATEGORY } from "../catalog/types";
import {
  activityTargetOperationFingerprintFor,
  semanticFingerprintFor,
} from "./fingerprints";

export type BaseValidationErrorCode =
  | "phonetic-contrast-count"
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
  | "missing-explanation-block"
  | "missing-reference-snapshot"
  | "invalid-prerequisite"
  | "semantic-nonspoken-activity-count"
  | "semantic-category-coverage"
  | "activity-category-cap"
  | "semantic-listening-audio-count"
  | "semantic-spoken-audio-count"
  | "duplicate-activity-id"
  | "duplicate-target-operation"
  | "activity-category-operation-mismatch"
  | "fingerprint-resolution"
  | "worked-example-reused-by-activity"
  | "duplicate-semantic-fingerprint"
  | "dialogue-example-fingerprint-overlap"
  | "unresolved-reference"
  | "first-teach-before-owner"
  | "introduced-id-owner-mismatch"
  | "concept-prerequisite-order"
  | "concept-prerequisite-cycle"
  | "first-teach-owner-invalid"
  | "adjective-cell-before-module-seven"
  | "te-imasu-ongoing-before-requests-connection-4"
  | "dynamic-nonpast-ongoing-now"
  | "forbidden-explanatory-no"
  | "unlicensed-particle";

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
  const categoryCounts = new Map<string, number>();
  let nonspokenCount = 0;
  let listeningAudioCount = 0;
  let spokenAudioCount = 0;
  const workedIds = new Set(
    lesson.contract === "phonetic" ? [] : lesson.workedExampleIds,
  );

  for (const activity of lesson.activities) {
    if (activityIds.has(activity.id)) push("duplicate-activity-id", activity.id);
    activityIds.add(activity.id);
    if (
      BASE_ACTIVITY_OPERATION_BY_CATEGORY[activity.category] !== activity.operation
    ) {
      push(
        "activity-category-operation-mismatch",
        activity.id,
        `${activity.category}:${activity.operation}`,
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
    if (workedIds.has(activity.targetId)) {
      push("worked-example-reused-by-activity", activity.targetId);
    }
    if (activity.mode === "non-spoken") {
      nonspokenCount += 1;
      categoryCounts.set(
        activity.category,
        (categoryCounts.get(activity.category) ?? 0) + 1,
      );
    }
    if (
      activity.category === "listening" &&
      activity.interactionKind === "listening" &&
      activity.mode === "audio"
    ) {
      listeningAudioCount += 1;
    }
    if (
      activity.category === "spoken" &&
      activity.interactionKind === "spoken" &&
      activity.mode === "audio"
    ) {
      spokenAudioCount += 1;
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
  }
}

function countCountableLexemes(
  lexemeIds: readonly string[],
  catalogs: BaseValidationCatalogs,
): number {
  return uniqueIds(lexemeIds).filter((id) => catalogs.lexemes.get(id)?.countable).length;
}

function validateExampleReferences(
  examples: readonly BaseExample[],
  catalogs: BaseValidationCatalogs,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): readonly BaseExample[] {
  const fingerprints = new Set<string>();
  const uniqueExamples: BaseExample[] = [];
  for (const example of examples) {
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
      "example teaching-purpose copy",
      push,
    );
    if ("copyId" in example.translationCopy) {
      validateReference(
        example.translationCopy.copyId,
        catalogs.copyIds.has(example.translationCopy.copyId),
        "example translation copy",
        push,
      );
    } else {
      validateReference(
        example.translationCopy.enCopyId,
        catalogs.copyIds.has(example.translationCopy.enCopyId),
        "example English translation copy",
        push,
      );
      validateReference(
        example.translationCopy.itCopyId,
        catalogs.copyIds.has(example.translationCopy.itCopyId),
        "example Italian translation copy",
        push,
      );
    }
    for (const lexemeId of example.lexemeIds) {
      validateReference(lexemeId, catalogs.lexemes.has(lexemeId), "example lexeme", push);
    }
    for (const conceptId of example.conceptIds) {
      validateReference(conceptId, catalogs.concepts.has(conceptId), "example concept", push);
    }
    for (const formId of example.formIds) {
      validateReference(formId, catalogs.concepts.has(formId), "example form", push);
    }
    for (const patternCellId of example.patternCellIds) {
      validateReference(
        patternCellId,
        catalogs.patternCellIds.has(patternCellId),
        "example pattern cell",
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
      ...(referenceId ? { referenceId } : {}),
      ...(detail ? { detail } : {}),
    });
  };

  validateReference(lesson.recapCopyId, catalogs.copyIds.has(lesson.recapCopyId), "recap copy", push);
  for (const prerequisiteId of lesson.prerequisiteLessonIds) {
    if (!BASE_LESSON_MANIFEST[prerequisiteId]) {
      push("invalid-prerequisite", prerequisiteId);
    }
  }

  if (lesson.contract === "phonetic") {
    if (!isCountWithin(lesson.contrastiveItemIds.length, 10, 16)) {
      push("phonetic-contrast-count", undefined, `${lesson.contrastiveItemIds.length}`);
    }
    if (!isCountWithin(lesson.anchorLexemeIds.length, 4, 8)) {
      push("phonetic-anchor-count", undefined, `${lesson.anchorLexemeIds.length}`);
    }
    if (lesson.audioExemplarIds.length < 6) {
      push("phonetic-audio-count", undefined, `${lesson.audioExemplarIds.length}`);
    }
    for (const lexemeId of lesson.anchorLexemeIds) {
      validateReference(lexemeId, catalogs.lexemes.has(lexemeId), "phonetic anchor", push);
    }
    for (const audioId of lesson.audioExemplarIds) {
      validateReference(
        audioId,
        catalogs.audioTargets.has(audioId),
        "phonetic audio exemplar",
        push,
      );
    }
    const nonspoken = lesson.activities.filter((activity) => activity.mode === "non-spoken");
    const operations = new Set(
      nonspoken.flatMap((activity) => {
        const fingerprint = activityTargetOperationFingerprintFor(activity, catalogs);
        return fingerprint.ok ? [fingerprint.fingerprint] : [];
      }),
    );
    if (nonspoken.length < 6 || operations.size < 6) {
      push("phonetic-nonspoken-operations", undefined, `${operations.size}`);
    }
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
  const uniqueExamples = validateExampleReferences(examples, catalogs, push);
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
    for (const turn of dialogue.turns) {
      const fingerprint = semanticFingerprintFor(turn);
      if (
        exampleFingerprints.has(fingerprint) ||
        dialogueFingerprints.has(fingerprint)
      ) {
        push("dialogue-example-fingerprint-overlap", fingerprint);
      }
      dialogueFingerprints.add(fingerprint);
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
      if (!uniqueExamples.some((example) => example.patternCellIds.includes(patternCellId))) {
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
