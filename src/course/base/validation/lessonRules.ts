import type { AssembledToken } from "../../../romaji/types";
import { formatRomaji } from "../../../romaji/formatRomaji";
import { deepFreeze } from "../../foundations/deepFreeze";
import type { SemanticArgumentRole } from "../../foundations/types";
import {
  baseCanonicalPosition,
  baseLessonManifestEntry,
  requiredBaseLessonPrerequisiteFor,
} from "../manifest";
import { firstTeachLessonPosition } from "../catalog/firstTeach";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import type {
  BaseActivityDefinition,
  BaseExample,
  BaseLexeme,
  BaseLessonContent,
  BaseValidationCatalogs,
  BaseVisibleTarget,
} from "../catalog/types";
import {
  activityPromptTargetReferenceFor,
  activityOptionTargetReferencesFor,
  activityTargetReferenceFor,
  audioTargetReferenceFor,
  baseActivityPromptKey,
} from "../catalog/visibleTargets";
import {
  BASE_PARTICLE_FRAME_BY_PREDICATE,
  BASE_PARTICLE_SENSES,
  particleProvidedEntries,
  type BaseParticleRole,
  validateParticleFrameEntries,
} from "../forms/particleLicensing";
import {
  BASE_PHONETIC_ACTIVITY_OPERATIONS,
} from "../catalog/types";
import {
  baseActivityInteractionsFor,
  baseActivityOperationFor,
  isBaseActivityKind,
} from "../catalog/activityContracts";
import {
  activityTargetOperationFingerprintFor,
  activityTargetVisibleSurfaceFor,
  semanticFingerprintFor,
  visibleSurfaceFingerprint,
} from "./fingerprints";
import {
  invalidRuntimeCatalogFields,
  isStrictRuntimeConcept,
  isStrictRuntimeLexeme,
  isStrictRuntimeReferenceSnapshot,
  isStrictRuntimeTokenSequence as isStrictRawRuntimeTokenSequence,
  ownDataArrayValues,
  runtimeStringArrayValues,
  runtimeActivityShapeIssues,
  runtimeVisibleTargetIssue,
  strictRuntimeConcept,
  strictRuntimeDialogue,
  strictRuntimeDialogueTurn,
  strictRuntimeExample,
  strictRuntimeLesson,
  strictRuntimeLexeme,
  strictRuntimeRetrievalSystem,
  strictRuntimeTokenSequence,
  strictRuntimeVisibleTarget,
  strictRuntimeLessonWithContract,
  type RuntimeVisibleTargetShape,
} from "./runtimeGuards";

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
  | "content-pattern-diversity"
  | "content-context-diversity"
  | "system-new-lexeme-count"
  | "system-example-count"
  | "system-pattern-cell-unrepresented"
  | "system-pattern-matrix-missing"
  | "system-pattern-matrix-empty"
  | "system-pattern-matrix-not-substantive"
  | "system-pattern-matrix-duplicate"
  | "system-pattern-matrix-unresolved"
  | "system-pattern-cell-set-mismatch"
  | "invalid-pattern-cell-id"
  | "duplicate-pattern-cell-id"
  | "semantic-pattern-cell-declaration-missing"
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
  | "missing-required-prerequisite"
  | "semantic-nonspoken-activity-count"
  | "semantic-category-coverage"
  | "activity-category-cap"
  | "illegal-activity-combination"
  | "semantic-listening-audio-count"
  | "semantic-spoken-audio-count"
  | "duplicate-activity-id"
  | "invalid-activity-shape"
  | "duplicate-target-operation"
  | "duplicate-visible-target"
  | "activity-category-operation-mismatch"
  | "fingerprint-resolution"
  | "worked-example-reused-by-activity"
  | "duplicate-semantic-fingerprint"
  | "duplicate-visible-example-surface"
  | "dialogue-example-fingerprint-overlap"
  | "unresolved-reference"
  | "first-teach-before-owner"
  | "missing-first-teach-owner"
  | "owner-catalog-mismatch"
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
  | "invalid-token-sequence"
  | "token-sequence-invalid"
  | "invalid-visible-target"
  | "invalid-lesson-shape"
  | "invalid-example-shape"
  | "invalid-dialogue-shape"
  | "invalid-visible-target-shape"
  | "invalid-catalog-entry"
  | "invalid-particle-frame"
  | "particle-frame-token-mismatch"
  | "particle-frame-predicate-mismatch"
  | "target-provenance-mismatch"
  | "new-lexeme-not-visible"
  | "new-lexeme-not-retrieved"
  | "introduced-content-not-visible"
  | "introduced-content-not-retrieved"
  | "duplicate-new-lexeme"
  | "new-lexeme-not-countable"
  | "assessed-id-not-visible"
  | "review-lexeme-not-visible"
  | "review-lexeme-not-retrieved"
  | "synthesis-retrieved-system-duplicate"
  | "synthesis-system-before-teach"
  | "synthesis-system-component-before-teach"
  | "synthesis-system-not-visible"
  | "synthesis-system-not-retrieved"
  | "retrieved-system-outside-synthesis"
  | "duplicate-prerequisite"
  | "self-prerequisite"
  | "future-prerequisite"
  | "lesson-prerequisite-cycle"
  | "unknown-base-lesson"
  | "lesson-contract-mismatch"
  | "missing-canonical-contract-fields";

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
    const rawExample = catalogs.examples.get(exampleId);
    const example = strictRuntimeExample(rawExample);
    if (!rawExample) {
      push("unresolved-reference", exampleId, "worked example");
    } else if (!example) {
      reportMalformedParticleFrame(
        rawExample,
        exampleId,
        "worked example",
        push,
        "example",
      );
      push("invalid-example-shape", exampleId, "worked example");
    } else {
      examples.push(example);
    }
  }
  return examples;
}

function validateWorkedExampleVisibleSurfaces(
  examples: readonly BaseExample[],
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  const seen = new Set<string>();
  for (const example of examples) {
    const surface = visibleSurfaceFingerprint(example.tokens);
    if (seen.has(surface)) {
      push("duplicate-visible-example-surface", example.id, surface);
      continue;
    }
    seen.add(surface);
  }
}

function reportMalformedParticleFrame(
  target: unknown,
  referenceId: string,
  _label: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
  targetShape: RuntimeVisibleTargetShape = "target",
): void {
  if (
    runtimeVisibleTargetIssue(target, targetShape) !== "invalid-particle-frame"
  ) {
    return;
  }
  push("invalid-particle-frame", referenceId, "malformed-particle-frame");
  if (!isPlainDataRecord(target)) return;
  const particleFrame = ownDataValue(target, "particleFrame");
  if (!isPlainDataRecord(particleFrame)) return;
  const frame = validateParticleFrameEntries(
    ownDataValue(particleFrame, "predicateSenseId"),
    particleProvidedEntries(ownDataValue(particleFrame, "provided")),
  );
  if (!frame.ok) {
    for (const error of frame.errors) {
      push(
        error.code === "unlicensed-particle"
          ? "unlicensed-particle"
          : "invalid-particle-frame",
        referenceId,
        error.code,
      );
    }
  }
}

function reportMalformedDialogueParticleFrames(
  dialogue: unknown,
  dialogueId: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  if (!isPlainDataRecord(dialogue)) return;
  const turns = ownDataArrayValues(ownDataValue(dialogue, "turns"));
  if (!turns) return;
  turns.forEach((turn, index) =>
    reportMalformedParticleFrame(
      turn,
      `${dialogueId}:${index}`,
      "dialogue turn",
      push,
      "dialogue-turn",
    ),
  );
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

function validateCatalogRecord(
  value: unknown,
  id: string,
  label: string,
  isValid: (value: unknown) => boolean,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): boolean {
  if (!isValid(value)) {
    push("invalid-catalog-entry", id, label);
    return false;
  }
  return true;
}

const hasOwn: (value: object, key: PropertyKey) => boolean =
  (Object as unknown as {
    hasOwn?: (value: object, key: PropertyKey) => boolean;
  }).hasOwn ??
  ((value, key) => Object.prototype.hasOwnProperty.call(value, key));

function isPlainDataRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every(
    (descriptor) => "value" in descriptor,
  );
}

function ownDataValue(
  record: Readonly<Record<string, unknown>>,
  key: string,
): unknown {
  if (!hasOwn(record, key)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

function lessonIdFrom(value: unknown): string {
  return isPlainDataRecord(value) &&
    typeof ownDataValue(value, "lessonId") === "string"
    ? (ownDataValue(value, "lessonId") as string)
    : "unknown-lesson";
}

function lessonContractFrom(value: unknown): string | undefined {
  return isPlainDataRecord(value) &&
    typeof ownDataValue(value, "contract") === "string"
    ? (ownDataValue(value, "contract") as string)
    : undefined;
}

function canonicalLessonForManifest(
  rawLesson: unknown,
  contract: BaseLessonContent["contract"],
): BaseLessonContent | undefined {
  const normalized = strictRuntimeLessonWithContract(rawLesson, contract);
  return normalized === undefined ? undefined : (normalized as BaseLessonContent);
}

function strictLexemeFor(
  catalogs: BaseValidationCatalogs,
  lexemeId: string,
): BaseLexeme | undefined {
  return strictRuntimeLexeme(catalogs.lexemes.get(lexemeId));
}

function isStrictRuntimeTokenSequence(
  tokens: readonly AssembledToken[] | unknown,
): tokens is readonly AssembledToken[] {
  return isStrictRawRuntimeTokenSequence(tokens);
}

export function validateTokenSequence(
  tokens: readonly AssembledToken[] | unknown,
): ReturnType<typeof formatRomaji> {
  const tokenSnapshot = strictRuntimeTokenSequence(tokens);
  if (!tokenSnapshot) {
    return {
      ok: false,
      errors: [{ code: "unresolved-token" }],
    };
  }
  return formatRomaji(tokenSnapshot);
}

function validateTokens(
  tokens: readonly AssembledToken[] | unknown,
  referenceId: string,
  label: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
  ignoredFormatErrors: ReadonlySet<string> = new Set(),
): void {
  if (!isStrictRuntimeTokenSequence(tokens)) {
    push("token-sequence-invalid", referenceId, `${label}:invalid-runtime-token`);
    return;
  }
  const formatted = validateTokenSequence(tokens);
  if (!formatted.ok) {
    const errors = formatted.errors.filter(
      ({ code }) => !ignoredFormatErrors.has(code),
    );
    if (errors.length === 0) return;
    push(
      "invalid-token-sequence",
      referenceId,
      `${label}:${errors.map((error) => error.code).join(",")}`,
    );
  }
}

function reportInvalidVisibleTarget(
  reason: string | undefined,
  referenceId: string,
  label: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  if (reason === "invalid-example") {
    push("invalid-example-shape", referenceId, label);
    return;
  }
  push("invalid-visible-target-shape", referenceId, `${label}:${reason ?? "invalid"}`);
  if (reason === "invalid-token-sequence") {
    push("token-sequence-invalid", referenceId, `${label}:invalid-runtime-token`);
  }
}

function validateActivities(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
  semantic: boolean,
  workedExamples: readonly BaseExample[],
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
    workedExamples.map((example) => visibleSurfaceFingerprint(example.tokens)),
  );

  const isPhoneticLesson = lesson.contract === "phonetic";
  const phoneticOperations = new Set<string>(BASE_PHONETIC_ACTIVITY_OPERATIONS);
  const isBaseActivityCategory = (
    activity: BaseActivityDefinition,
  ): boolean =>
    isBaseActivityKind(activity.category) &&
    activity.category !== "listening" &&
    activity.category !== "spoken";
  const hasLegalInteraction = (activity: BaseActivityDefinition): boolean => {
    const allowed = baseActivityInteractionsFor(activity.category);
    return allowed?.includes(activity.interactionKind) ?? false;
  };
  const hasLegalActivityCombination = (
    activity: BaseActivityDefinition,
  ): boolean => {
    const expectedOperation = baseActivityOperationFor(activity.category);
    if (expectedOperation === null) return false;
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
    const expectedOperation = baseActivityOperationFor(activity.category);
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
    const activityTarget = activityTargetReferenceFor(activity, catalogs);
    const optionTargets = activityOptionTargetReferencesFor(activity, catalogs);
    if (
      activity.optionTargetIds !== undefined &&
      optionTargets.length !== activity.optionTargetIds.length
    ) {
      for (const optionTargetId of activity.optionTargetIds) {
        if (!catalogs.acceptedAnswerTargets.has(optionTargetId)) {
          push("unresolved-reference", optionTargetId, "activity option target");
        }
      }
    }
    if (!activityTarget?.invalidReason) {
      const targetOperation = activityTargetOperationFingerprintFor(
        lesson.lessonId,
        activity,
        catalogs,
      );
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
    }
    const promptTarget = activityPromptTargetReferenceFor(
      lesson.lessonId,
      activity,
      catalogs,
    );
    if (promptTarget) {
      if (promptTarget.invalidReason) {
        reportInvalidVisibleTarget(
          promptTarget.invalidReason,
          promptTarget.referenceId,
          promptTarget.label,
          push,
        );
        if (promptTarget.invalidReason === "invalid-particle-frame") {
          reportMalformedParticleFrame(
            catalogs.activityPromptTargets.get(
              baseActivityPromptKey(lesson.lessonId, activity.id),
            ),
            promptTarget.referenceId,
            promptTarget.label,
            push,
          );
        }
      } else {
        validateSentenceLikeReferences(
          promptTarget.target,
          catalogs,
          promptTarget.referenceId,
          promptTarget.label,
          push,
        );
      }
    }
    if (activityTarget?.invalidReason) {
      reportInvalidVisibleTarget(
        activityTarget.invalidReason,
        activityTarget.referenceId,
        activityTarget.label,
        push,
      );
      if (activityTarget.invalidReason === "invalid-example") {
        reportMalformedParticleFrame(
          catalogs.examples.get(activity.targetId),
          activityTarget.referenceId,
          activityTarget.label,
          push,
          "example",
        );
      } else if (activityTarget.invalidReason === "invalid-particle-frame") {
        reportMalformedParticleFrame(
          catalogs.acceptedAnswerTargets.get(activity.targetId) ??
            catalogs.audioTargets.get(activity.targetId),
          activityTarget.referenceId,
          activityTarget.label,
          push,
        );
      }
    } else if (activityTarget && activityTarget.source !== "example") {
      validateSentenceLikeReferences(
        activityTarget.target,
        catalogs,
        activityTarget.referenceId,
        activityTarget.label,
        push,
      );
    }
    for (const optionTarget of optionTargets) {
      if (optionTarget.invalidReason) {
        reportInvalidVisibleTarget(
          optionTarget.invalidReason,
          optionTarget.referenceId,
          optionTarget.label,
          push,
        );
      } else {
        validateSentenceLikeReferences(
          optionTarget.target,
          catalogs,
          optionTarget.referenceId,
          optionTarget.label,
          push,
          "target",
          activity.operation === "order-chunks" &&
            optionTarget.referenceId !== activity.targetId,
        );
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
      const concept = catalogs.concepts.get(conceptId);
      if (concept !== undefined) {
        validateCatalogRecord(
          concept,
          conceptId,
          "assessed concept",
          isStrictRuntimeConcept,
          push,
        );
      }
    }
    for (const lexemeId of activity.assessedLexemeIds) {
      validateReference(lexemeId, catalogs.lexemes.has(lexemeId), "assessed lexeme", push);
      const lexeme = catalogs.lexemes.get(lexemeId);
      if (lexeme !== undefined) {
        validateCatalogRecord(
          lexeme,
          lexemeId,
          "assessed lexeme",
          isStrictRuntimeLexeme,
          push,
        );
      }
    }
    const visibleLexemeIds = new Set<string>();
    const visibleContentIds = new Set<string>();
    for (const provenance of [promptTarget, activityTarget, ...optionTargets]) {
      if (!provenance) continue;
      targetStringField(provenance.target, "lexemeIds").forEach((id) =>
        visibleLexemeIds.add(id),
      );
      targetStringField(provenance.target, "conceptIds").forEach((id) =>
        visibleContentIds.add(id),
      );
      // Forms are content IDs too: assessments may name either a concept or
      // its form record, so the canonical union deliberately includes both.
      targetStringField(provenance.target, "formIds").forEach((id) =>
        visibleContentIds.add(id),
      );
    }
    for (const lexemeId of activity.assessedLexemeIds) {
      if (!visibleLexemeIds.has(lexemeId)) {
        push("assessed-id-not-visible", lexemeId, `activity:${activity.id}:lexeme`);
      }
    }
    for (const conceptId of activity.assessedConceptIds) {
      if (!visibleContentIds.has(conceptId)) {
        push("assessed-id-not-visible", conceptId, `activity:${activity.id}:content`);
      }
    }
    const targetSurface = activityTargetVisibleSurfaceFor(
      lesson.lessonId,
      activity,
      catalogs,
    );
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
  return uniqueIds(lexemeIds).filter(
    (id) => strictLexemeFor(catalogs, id)?.countable === true,
  ).length;
}

function countMeaningfulAnchors(
  lexemeIds: readonly string[],
  catalogs: BaseValidationCatalogs,
): number {
  return uniqueIds(lexemeIds).filter((id) => {
    const lexeme = strictLexemeFor(catalogs, id);
    if (!lexeme) return false;
    return (
      lexeme.countable === true &&
      lexeme.meaningCopyId.trim().length > 0
    );
  }).length;
}

function validateSemanticPatternDeclaration(
  lesson: Exclude<BaseLessonContent, { readonly contract: "phonetic" }>,
  catalogs: BaseValidationCatalogs,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  const canonicalMatrix = runtimeStringArrayValues(
    catalogs.patternCellIdsByLesson.get(lesson.lessonId),
  );
  if (
    catalogs.patternCellIdsByLesson.has(lesson.lessonId) &&
    canonicalMatrix === undefined
  ) {
    push("invalid-catalog-entry", lesson.lessonId, "pattern cell matrix");
  } else if (lesson.patternCellIds.length === 0 && canonicalMatrix !== undefined) {
    push("semantic-pattern-cell-declaration-missing", lesson.lessonId);
  }
  const seen = new Set<string>();
  for (const patternCellId of lesson.patternCellIds) {
    if (typeof patternCellId !== "string" || patternCellId.trim().length === 0) {
      push("invalid-pattern-cell-id", String(patternCellId));
      continue;
    }
    if (seen.has(patternCellId)) {
      push("duplicate-pattern-cell-id", patternCellId);
      continue;
    }
    seen.add(patternCellId);
    validateReference(
      patternCellId,
      catalogs.patternCellIds.has(patternCellId),
      "lesson pattern cell",
      push,
    );
  }
}

type SentenceLike = BaseVisibleTarget;

function validateParticlePredicateProvenance(
  target: Readonly<Record<string, unknown>>,
  frame: Readonly<Record<string, unknown>>,
  referenceId: string,
  label: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  const framePredicateSenseId = ownDataValue(frame, "predicateSenseId");
  const targetPredicateSenseId = ownDataValue(target, "predicateSenseId");
  const targetPredicateLexemeId = ownDataValue(target, "predicateLexemeId");
  const targetLexemeIds = ownDataValue(target, "lexemeIds");
  const registry =
    typeof framePredicateSenseId === "string"
      ? BASE_PARTICLE_FRAME_BY_PREDICATE.get(
          framePredicateSenseId as Parameters<
            typeof BASE_PARTICLE_FRAME_BY_PREDICATE.get
          >[0],
        )
      : undefined;
  const valid =
    typeof framePredicateSenseId === "string" &&
    targetPredicateSenseId === framePredicateSenseId &&
    typeof targetPredicateLexemeId === "string" &&
    Array.isArray(targetLexemeIds) &&
    targetLexemeIds.includes(targetPredicateLexemeId) &&
    registry?.allowedPredicateLexemeIds.includes(targetPredicateLexemeId) === true;
  if (!valid) {
    push(
      "particle-frame-predicate-mismatch",
      referenceId,
      `${label}:predicate-provenance`,
    );
  }
}

const PARTICLE_FRAME_TOKEN_SENSES: ReadonlySet<string> = new Set(
  BASE_PARTICLE_SENSES.map(({ id }) => id),
);

const CLAUSE_FINAL_PARTICLE_SENSES = new Set([
  "question-ka",
  "interactional-ne",
  "interactional-yo",
]);
const CLAUSE_FINAL_PARTICLE_ROLES = new Set(["question", "interaction"]);
const PREDICATE_FRAME_PARTICLE_ROLES = new Set([
  "theme",
  "goal",
  "action-place",
  "means",
  "time",
  "source",
  "limit",
  "existence-location",
  "existential-subject",
]);
const TASK11_REFERENCE_PREFIX =
  /^(?:polite-verbs|argument-particles|time-movement|copula-adjectives|existence-location|requests-connection)-/u;
const SEMANTIC_ROLES_BY_PARTICLE_ROLE: Readonly<
  Partial<Record<BaseParticleRole, readonly SemanticArgumentRole[]>>
> = {
  topic: ["topic"],
  "additive-topic": ["additive-topic"],
  "focus-subject": ["focus-subject"],
  theme: ["theme"],
  goal: ["goal", "direction"],
  "action-place": ["action-place"],
  "existence-location": ["existence-location"],
  "existential-subject": ["existential-subject"],
  means: ["means"],
  time: ["time"],
  source: ["source"],
  limit: ["limit"],
  possessor: ["possessor"],
  listing: ["listing"],
  companion: ["companion"],
};
const PARTICLE_SENSES_BY_BINDING_ROLE: Readonly<
  Partial<Record<BaseParticleRole, readonly string[]>>
> = {
  topic: ["topic-wa"],
  "additive-topic": ["additive-mo"],
  "focus-subject": ["focus-subject-ga"],
  theme: ["object-o", "topic-wa"],
  goal: ["goal-ni", "direction-he"],
  "action-place": ["action-place-de"],
  "existence-location": ["existence-location-ni"],
  "existential-subject": ["existential-subject-ga"],
  means: ["means-de"],
  time: ["time-ni"],
  source: ["source-kara"],
  limit: ["limit-made"],
  possessor: ["possessive-attributive-no"],
  listing: ["listing-to"],
  companion: ["companion-to"],
  question: ["question-ka"],
  interaction: ["interactional-ne", "interactional-yo"],
};
const PARTICLE_ROLES_BY_SEMANTIC_ROLE: Readonly<
  Partial<Record<SemanticArgumentRole, readonly BaseParticleRole[]>>
> = {
  topic: ["topic"],
  "additive-topic": ["additive-topic"],
  "focus-subject": ["focus-subject"],
  theme: ["theme"],
  goal: ["goal"],
  direction: ["goal"],
  "action-place": ["action-place"],
  "existence-location": ["existence-location"],
  "existential-subject": ["existential-subject"],
  time: ["time"],
  means: ["means"],
  source: ["source"],
  limit: ["limit"],
  possessor: ["possessor"],
  listing: ["listing"],
  companion: ["companion"],
};
function timeSemanticsForLexeme(
  lexemeId: string,
): "relative" | "recurring" | "specific" | undefined {
  const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
  return lexeme?.category === "noun" ? lexeme.timeSemantics : undefined;
}

function validateParticleTokenMultiset(
  target: BaseVisibleTarget,
  referenceId: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  const bindings = target.particleBindings;
  if (!bindings) {
    if (TASK11_REFERENCE_PREFIX.test(referenceId)) {
      push("particle-frame-token-mismatch", referenceId, "missing-bindings");
    }
    return;
  }
  const visible = target.tokens
    .flatMap((token, index) => {
      const sense = token.source.referenceId;
      if (
        token.kind !== "particle" ||
        !PARTICLE_FRAME_TOKEN_SENSES.has(sense)
      ) {
        return [];
      }
      const attachmentLexemeId = CLAUSE_FINAL_PARTICLE_SENSES.has(sense)
        ? target.predicateLexemeId
        : target.tokens[index - 1]?.source.referenceId;
      return [`${sense}@${attachmentLexemeId ?? ""}`];
    })
    .sort();
  const declared = bindings
    .map(
      ({ particleSense, attachmentLexemeId }) =>
        `${particleSense}@${attachmentLexemeId}`,
    )
    .sort();
  const semanticRolesAreUnique =
    new Set(target.semanticRoleIds).size === target.semanticRoleIds.length;
  const bindingsAreUnique =
    new Set(
      bindings.map(
        ({ role, particleSense, attachmentLexemeId }) =>
          `${role}:${particleSense}@${attachmentLexemeId}`,
      ),
    ).size === bindings.length;
  const attachmentsAreCanonical = bindings.every(
    ({ role, attachmentLexemeId }) =>
      CLAUSE_FINAL_PARTICLE_ROLES.has(role)
        ? attachmentLexemeId === target.predicateLexemeId
        : target.lexemeIds.includes(attachmentLexemeId) &&
          BASE_LEXEME_BY_ID.get(attachmentLexemeId)?.category === "noun",
  );
  const bindingRolesAgree = bindings.every(({ role, particleSense }) => {
    const semanticRoles = SEMANTIC_ROLES_BY_PARTICLE_ROLE[role];
    const allowedSenses = PARTICLE_SENSES_BY_BINDING_ROLE[role];
    return (
      (!semanticRoles ||
        semanticRoles.some((semanticRole) =>
          target.semanticRoleIds.includes(semanticRole),
        )) &&
      allowedSenses?.includes(particleSense) === true
    );
  });
  const semanticRolesRealized = target.semanticRoleIds.every(
    (semanticRole) => {
      const expectedRoles = PARTICLE_ROLES_BY_SEMANTIC_ROLE[semanticRole];
      if (!expectedRoles) return true;
      const matchingBindings = bindings.filter(({ role, particleSense }) => {
        if (!expectedRoles.includes(role)) return false;
        if (semanticRole === "goal") return particleSense === "goal-ni";
        if (semanticRole === "direction") return particleSense === "direction-he";
        return true;
      });
      if (matchingBindings.length === 1) return true;
      if (semanticRole !== "time" || matchingBindings.length !== 0) {
        return false;
      }
      if (
        bindings.some(
          ({ role, attachmentLexemeId }) =>
            (role === "source" || role === "limit") &&
            timeSemanticsForLexeme(attachmentLexemeId) !== undefined,
        )
      ) {
        return true;
      }
      return (
        (target.conceptIds.includes("relative-time-omission") ||
          target.conceptIds.includes("habit-future-time-cues")) &&
        target.lexemeIds.some((lexemeId) => {
          const semantics = timeSemanticsForLexeme(lexemeId);
          return semantics === "relative" || semantics === "recurring";
        })
      );
    },
  );
  const visibleTimeRoleAgrees =
    target.predicateLexemeId === null ||
    !target.lexemeIds.some(
      (lexemeId) => timeSemanticsForLexeme(lexemeId) !== undefined,
    ) ||
    target.semanticRoleIds.includes("time");
  const frameEntries = target.particleFrame
    ? particleProvidedEntries(target.particleFrame.provided).entries
    : [];
  const frameBindingMatches = (
    role: string,
    particleSense: string,
  ): boolean => {
    const attachmentLexemeId =
      target.particleFrame?.attachmentLexemeIdByRole[
        role as keyof NonNullable<
          typeof target.particleFrame
        >["attachmentLexemeIdByRole"]
      ];
    return bindings.some(
      (binding) =>
        binding.role === role &&
        binding.particleSense === particleSense &&
        binding.attachmentLexemeId === attachmentLexemeId,
    );
  };
  const frameBindingsAgree = !target.particleFrame
    ? !(
        target.predicateSenseId !== null &&
        bindings.some(({ role }) =>
          PREDICATE_FRAME_PARTICLE_ROLES.has(role),
        )
      )
    : frameEntries.every(([role, particleSense]) =>
        frameBindingMatches(role, particleSense),
      ) &&
      bindings.every(({ role, particleSense, attachmentLexemeId }) => {
        const frameSense = frameEntries.find(
          ([frameRole]) => frameRole === role,
        )?.[1];
        return (
          frameSense === particleSense &&
          target.particleFrame?.attachmentLexemeIdByRole[
            role as keyof typeof target.particleFrame.attachmentLexemeIdByRole
          ] === attachmentLexemeId
        );
      });
  if (
    !attachmentsAreCanonical ||
    !semanticRolesAreUnique ||
    !bindingsAreUnique ||
    !bindingRolesAgree ||
    !semanticRolesRealized ||
    !visibleTimeRoleAgrees ||
    !frameBindingsAgree ||
    visible.length !== declared.length ||
    visible.some((sense, index) => sense !== declared[index])
  ) {
    push(
      "particle-frame-token-mismatch",
      referenceId,
      `${visible.join(",")}:${declared.join(",")}`,
    );
  }
}

function validateCanonicalTokenSourceProvenance(
  tokens: unknown,
  lexemeIds: readonly string[],
  conceptIds: readonly string[],
  formIds: readonly string[],
  catalogs: BaseValidationCatalogs,
  referenceId: string,
  label: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  const tokenEntries = ownDataArrayValues(tokens);
  if (!tokenEntries) return;
  const reported = new Set<string>();
  for (const token of tokenEntries) {
    if (!isPlainDataRecord(token)) continue;
    const source = ownDataValue(token, "source");
    if (!isPlainDataRecord(source)) continue;
    const sourceReferenceId = ownDataValue(source, "referenceId");
    if (typeof sourceReferenceId !== "string") continue;
    const isMissingLexemeProvenance =
      catalogs.lexemes.has(sourceReferenceId) &&
      !lexemeIds.includes(sourceReferenceId);
    const isMissingContentProvenance =
      catalogs.concepts.has(sourceReferenceId) &&
      !conceptIds.includes(sourceReferenceId) &&
      !formIds.includes(sourceReferenceId);
    if (
      (isMissingLexemeProvenance || isMissingContentProvenance) &&
      !reported.has(sourceReferenceId)
    ) {
      reported.add(sourceReferenceId);
      push(
        "target-provenance-mismatch",
        sourceReferenceId,
        `${label}:${referenceId}`,
      );
    }
  }
}

function validateSentenceLikeReferences(
  sentence: SentenceLike | unknown,
  catalogs: BaseValidationCatalogs,
  referenceId: string,
  label: string,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
  targetShape: RuntimeVisibleTargetShape = "target",
  allowIntentionalOrderingError = false,
): void {
  const targetIssue = runtimeVisibleTargetIssue(sentence, targetShape);
  if (targetIssue !== undefined) {
    reportInvalidVisibleTarget(targetIssue, referenceId, label, push);
    if (targetIssue === "invalid-particle-frame") {
      reportMalformedParticleFrame(
        sentence,
        referenceId,
        label,
        push,
        targetShape,
      );
    }
    return;
  }
  const target =
    targetShape === "example"
      ? strictRuntimeExample(sentence)
      : targetShape === "dialogue-turn"
        ? strictRuntimeDialogueTurn(sentence)
        : strictRuntimeVisibleTarget(sentence);
  if (!target) {
    push("invalid-visible-target-shape", referenceId, label);
    return;
  }
  const targetRecord = target as unknown as Readonly<Record<string, unknown>>;
  const tokens = target.tokens;
  const lexemeIds = target.lexemeIds;
  const conceptIds = target.conceptIds;
  const formIds = target.formIds;
  const patternCellIds = target.patternCellIds;
  validateTokens(
    tokens,
    referenceId,
    label,
    push,
    allowIntentionalOrderingError
      ? new Set(["invalid-first-boundary"])
      : new Set(),
  );
  for (const lexemeId of lexemeIds) {
    validateReference(lexemeId, catalogs.lexemes.has(lexemeId), `${label} lexeme`, push);
    const lexeme = catalogs.lexemes.get(lexemeId);
    if (lexeme !== undefined) {
      validateCatalogRecord(
        lexeme,
        lexemeId,
        `${label} lexeme`,
        isStrictRuntimeLexeme,
        push,
      );
    }
  }
  for (const conceptId of conceptIds) {
    validateReference(conceptId, catalogs.concepts.has(conceptId), `${label} concept`, push);
    const concept = catalogs.concepts.get(conceptId);
    if (concept !== undefined) {
      validateCatalogRecord(
        concept,
        conceptId,
        `${label} concept`,
        isStrictRuntimeConcept,
        push,
      );
    }
  }
  for (const formId of formIds) {
    validateReference(formId, catalogs.concepts.has(formId), `${label} form`, push);
    const form = catalogs.concepts.get(formId);
    if (form !== undefined) {
      validateCatalogRecord(
        form,
        formId,
        `${label} form`,
        isStrictRuntimeConcept,
        push,
      );
    }
  }
  for (const patternCellId of patternCellIds) {
    validateReference(
      patternCellId,
      catalogs.patternCellIds.has(patternCellId),
      `${label} pattern cell`,
      push,
    );
  }
  validateCanonicalTokenSourceProvenance(
    tokens,
    lexemeIds,
    conceptIds,
    formIds,
    catalogs,
    referenceId,
    label,
    push,
  );
  const particleFrame = ownDataValue(targetRecord, "particleFrame");
  if (particleFrame !== undefined) {
    if (isPlainDataRecord(particleFrame)) {
      validateParticlePredicateProvenance(
        targetRecord,
        particleFrame,
        referenceId,
        label,
        push,
      );
    }
    if (
      !isPlainDataRecord(particleFrame) ||
      typeof ownDataValue(particleFrame, "predicateSenseId") !== "string"
    ) {
      push("invalid-particle-frame", referenceId, `${label}:malformed`);
      return;
    }
    const provided = particleProvidedEntries(
      ownDataValue(particleFrame, "provided"),
    );
    const frame = validateParticleFrameEntries(
      ownDataValue(particleFrame, "predicateSenseId"),
      provided,
    );
    if (!frame.ok) {
      for (const error of frame.errors) {
        push(
          error.code === "unlicensed-particle"
            ? "unlicensed-particle"
            : "invalid-particle-frame",
          referenceId,
          error.code,
        );
      }
    }
  }
  validateParticleTokenMultiset(target, referenceId, push);
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
    const example = strictRuntimeExample(catalogs.examples.get(activity.targetId));
    if (!example || canonical.has(example.id)) {
      continue;
    }
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
    validateSentenceLikeReferences(
      example,
      catalogs,
      referenceId,
      label,
      push,
      "example",
    );
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

function contentPatternCellCount(examples: readonly BaseExample[]): number {
  const patternCellIds = new Set<string>();
  for (const example of examples) {
    for (const patternCellId of uniqueIds(example.patternCellIds)) {
      const normalized = patternCellId.trim();
      if (normalized.length > 0) {
        patternCellIds.add(normalized);
      }
    }
  }
  return patternCellIds.size;
}

function contentDiscourseFrameCount(examples: readonly BaseExample[]): number {
  const discourseFrames = new Set<string>();
  for (const example of examples) {
    const discourseFrameId = example.discourseFrameId.trim();
    if (discourseFrameId.length > 0) {
      discourseFrames.add(discourseFrameId);
    }
  }
  return discourseFrames.size;
}

function targetStringField(
  target: BaseVisibleTarget | unknown,
  field: "lexemeIds" | "conceptIds" | "formIds",
): readonly string[] {
  if (target === null || typeof target !== "object" || Array.isArray(target)) {
    return [];
  }
  const record = target as Readonly<Record<string, unknown>>;
  if (!isPlainDataRecord(record)) return [];
  const value = ownDataValue(record, field);
  return runtimeStringArrayValues(value) ?? [];
}

interface DeclaredContentEvidence {
  readonly visibleLexemeIds: ReadonlySet<string>;
  readonly visibleContentIds: ReadonlySet<string>;
  readonly retrievedLexemeIds: ReadonlySet<string>;
  readonly retrievedContentIds: ReadonlySet<string>;
}

function collectDeclaredContentEvidence(
  lesson: Exclude<BaseLessonContent, { readonly contract: "phonetic" }>,
  workedExamples: readonly BaseExample[],
  dialogue: { readonly turns: readonly BaseVisibleTarget[] } | undefined,
  catalogs: BaseValidationCatalogs,
): DeclaredContentEvidence {
  const visibleLexemeIds = new Set<string>();
  const visibleContentIds = new Set<string>();
  const retrievedLexemeIds = new Set<string>();
  const retrievedContentIds = new Set<string>();
  const addVisible = (target: BaseVisibleTarget): void => {
    targetStringField(target, "lexemeIds").forEach((id) => visibleLexemeIds.add(id));
    targetStringField(target, "conceptIds").forEach((id) => visibleContentIds.add(id));
    targetStringField(target, "formIds").forEach((id) => visibleContentIds.add(id));
  };
  const addRetrieved = (target: BaseVisibleTarget): void => {
    targetStringField(target, "lexemeIds").forEach((id) => retrievedLexemeIds.add(id));
    targetStringField(target, "conceptIds").forEach((id) => retrievedContentIds.add(id));
    targetStringField(target, "formIds").forEach((id) => retrievedContentIds.add(id));
  };

  workedExamples.forEach(addVisible);
  dialogue?.turns.forEach(addVisible);
  for (const activity of lesson.activities) {
    if (activity.mode !== "non-spoken") continue;
    const prompt = activityPromptTargetReferenceFor(
      lesson.lessonId,
      activity,
      catalogs,
    );
    if (prompt) addRetrieved(prompt.target);
    const target = activityTargetReferenceFor(activity, catalogs);
    if (target) addRetrieved(target.target);
    for (const option of activityOptionTargetReferencesFor(activity, catalogs)) {
      addRetrieved(option.target);
    }
  }
  return {
    visibleLexemeIds,
    visibleContentIds,
    retrievedLexemeIds,
    retrievedContentIds,
  };
}

function validateDeclaredContentEvidence(
  lesson: Exclude<BaseLessonContent, { readonly contract: "phonetic" }>,
  workedExamples: readonly BaseExample[],
  dialogue: { readonly turns: readonly BaseVisibleTarget[] } | undefined,
  catalogs: BaseValidationCatalogs,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  const evidence = collectDeclaredContentEvidence(
    lesson,
    workedExamples,
    dialogue,
    catalogs,
  );
  const declaredNewLexemeIds = uniqueIds(lesson.newLexemeIds);
  for (const lexemeId of declaredNewLexemeIds) {
    const lexeme = strictLexemeFor(catalogs, lexemeId);
    if (lexeme?.countable === false) {
      push("new-lexeme-not-countable", lexemeId);
    }
    if (!evidence.visibleLexemeIds.has(lexemeId)) {
      push("new-lexeme-not-visible", lexemeId);
    }
    if (!evidence.retrievedLexemeIds.has(lexemeId)) {
      push("new-lexeme-not-retrieved", lexemeId);
    }
  }
  for (const lexemeId of declaredNewLexemeIds) {
    if (lesson.newLexemeIds.filter((id) => id === lexemeId).length > 1) {
      push("duplicate-new-lexeme", lexemeId);
    }
  }
  for (const contentId of uniqueIds(lesson.introducedConceptIds)) {
    if (!evidence.visibleContentIds.has(contentId)) {
      push("introduced-content-not-visible", contentId);
    }
    if (!evidence.retrievedContentIds.has(contentId)) {
      push("introduced-content-not-retrieved", contentId);
    }
  }
}

function contentIdsForTarget(target: BaseVisibleTarget | unknown): readonly string[] {
  return [
    ...targetStringField(target, "conceptIds"),
    ...targetStringField(target, "formIds"),
  ];
}

interface SynthesisSystemEvidence {
  readonly visibleLexemeIds: ReadonlySet<string>;
  readonly visibleContentIds: ReadonlySet<string>;
  readonly activeRetrievalLexemeIds: ReadonlySet<string>;
  readonly activeRetrievalContentIds: ReadonlySet<string>;
}

function collectSynthesisSystemEvidence(
  lesson: Extract<BaseLessonContent, { readonly contract: "synthesis" }>,
  workedExamples: readonly BaseExample[],
  dialogue: { readonly turns: readonly BaseVisibleTarget[] } | undefined,
  catalogs: BaseValidationCatalogs,
): SynthesisSystemEvidence {
  const visibleLexemeIds = new Set<string>();
  const visibleContentIds = new Set<string>();
  const activeRetrievalLexemeIds = new Set<string>();
  const activeRetrievalContentIds = new Set<string>();
  const addVisible = (target: BaseVisibleTarget): void => {
    targetStringField(target, "lexemeIds").forEach((id) => visibleLexemeIds.add(id));
    contentIdsForTarget(target).forEach((id) => visibleContentIds.add(id));
  };
  const addRetrieved = (target: BaseVisibleTarget): void => {
    targetStringField(target, "lexemeIds").forEach((id) =>
      activeRetrievalLexemeIds.add(id),
    );
    contentIdsForTarget(target).forEach((id) =>
      activeRetrievalContentIds.add(id),
    );
  };
  workedExamples.forEach(addVisible);
  dialogue?.turns.forEach(addVisible);

  for (const activity of lesson.activities) {
    if (activity.mode !== "non-spoken") {
      continue;
    }
    const prompt = activityPromptTargetReferenceFor(
      lesson.lessonId,
      activity,
      catalogs,
    );
    if (prompt) {
      addRetrieved(prompt.target);
    }
    const target = activityTargetReferenceFor(activity, catalogs);
    if (target) {
      addRetrieved(target.target);
    }
  }
  return {
    visibleLexemeIds,
    visibleContentIds,
    activeRetrievalLexemeIds,
    activeRetrievalContentIds,
  };
}

function validateSynthesisRetrievalSystems(
  lesson: Extract<BaseLessonContent, { readonly contract: "synthesis" }>,
  workedExamples: readonly BaseExample[],
  dialogue: { readonly turns: readonly BaseVisibleTarget[] } | undefined,
  catalogs: BaseValidationCatalogs,
  hasCanonicalLessonPosition: boolean,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  const evidence = collectSynthesisSystemEvidence(
    lesson,
    workedExamples,
    dialogue,
    catalogs,
  );
  const seen = new Set<string>();
  let validSystemCount = 0;
  const lessonPosition = hasCanonicalLessonPosition
    ? firstTeachLessonPosition(lesson.lessonId)
    : undefined;

  for (const lexemeId of uniqueIds(lesson.reviewLexemeIds)) {
    if (!evidence.visibleLexemeIds.has(lexemeId)) {
      push("review-lexeme-not-visible", lexemeId);
    }
    if (!evidence.activeRetrievalLexemeIds.has(lexemeId)) {
      push("review-lexeme-not-retrieved", lexemeId);
    }
  }

  for (const systemId of lesson.retrievedSystemIds) {
    if (seen.has(systemId)) {
      push("synthesis-retrieved-system-duplicate", systemId);
      continue;
    }
    seen.add(systemId);
    const rawSystem = catalogs.systems.get(systemId);
    if (!rawSystem) {
      push("unresolved-reference", systemId, "retrieved system");
      continue;
    }
    const system = strictRuntimeRetrievalSystem(rawSystem);
    if (!system) {
      push("invalid-catalog-entry", systemId, "retrieved system");
      continue;
    }
    const systemPosition = firstTeachLessonPosition(system.firstTeachLessonId);
    const taughtBefore =
      lessonPosition !== undefined &&
      systemPosition !== undefined &&
      systemPosition < lessonPosition;
    if (lessonPosition !== undefined && !taughtBefore) {
      push(
        "synthesis-system-before-teach",
        systemId,
        system.firstTeachLessonId,
      );
    }
    let hasOnlyCanonicalComponents = system.componentContentIds.length > 0;
    for (const componentId of system.componentContentIds) {
      const rawComponent = catalogs.concepts.get(componentId);
      if (!rawComponent) {
        hasOnlyCanonicalComponents = false;
        push("unresolved-reference", componentId, "retrieved system component");
        continue;
      }
      const component = strictRuntimeConcept(rawComponent);
      if (!component) {
        hasOnlyCanonicalComponents = false;
        push("invalid-catalog-entry", componentId, "retrieved system component");
        continue;
      }
      const componentIsClaimed =
        evidence.visibleContentIds.has(componentId) ||
        evidence.activeRetrievalContentIds.has(componentId);
      const componentPosition = firstTeachLessonPosition(
        component.firstTeachLessonId,
      );
      if (
        componentIsClaimed &&
        lessonPosition !== undefined &&
        (componentPosition === undefined || componentPosition >= lessonPosition)
      ) {
        push(
          "synthesis-system-component-before-teach",
          componentId,
          component.firstTeachLessonId,
        );
      }
    }
    const visiblyApplied = system.componentContentIds.some((componentId) =>
      evidence.visibleContentIds.has(componentId),
    );
    if (!visiblyApplied) {
      push("synthesis-system-not-visible", systemId);
    }
    const activelyRetrieved = system.componentContentIds.some((componentId) =>
      evidence.activeRetrievalContentIds.has(componentId),
    );
    if (!activelyRetrieved) {
      push("synthesis-system-not-retrieved", systemId);
    }
    if (
      taughtBefore &&
      hasOnlyCanonicalComponents &&
      visiblyApplied &&
      activelyRetrieved
    ) {
      validSystemCount += 1;
    }
  }
  if (validSystemCount < 4) {
    push("synthesis-retrieved-system-count", undefined, `${validSystemCount}`);
  }
}

function reportMalformedRuntimeActivities(
  rawLesson: unknown,
  push: (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ) => void,
): void {
  if (!isPlainDataRecord(rawLesson)) return;
  const activities = ownDataArrayValues(ownDataValue(rawLesson, "activities"));
  if (!activities) return;
  activities.forEach((activity, index) => {
    const activityId =
      isPlainDataRecord(activity) &&
      typeof ownDataValue(activity, "id") === "string"
        ? (ownDataValue(activity, "id") as string)
        : `activity-${index + 1}`;
    for (const code of runtimeActivityShapeIssues(activity)) {
      push(code, activityId);
    }
  });
}

export function validateBaseLessonDepth(
  rawLesson: BaseLessonContent | unknown,
  rawCatalogs: BaseValidationCatalogs | unknown,
): readonly BaseValidationError[] {
  const errors: BaseValidationError[] = [];
  const lessonId = lessonIdFrom(rawLesson);
  const push = (
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ): void => {
    errors.push({
      code,
      stage: "lesson-depth",
      lessonId,
      ...(referenceId !== undefined ? { referenceId } : {}),
      ...(detail !== undefined ? { detail } : {}),
    });
  };

  const manifest =
    lessonId === "unknown-lesson" ? null : baseLessonManifestEntry(lessonId);
  const hasCanonicalLessonPosition = manifest !== null;
  if (lessonId !== "unknown-lesson" && !manifest) {
    push("unknown-base-lesson", lessonId);
  }
  const declaredContract = lessonContractFrom(rawLesson);
  let lesson: BaseLessonContent | undefined;
  if (
    manifest &&
    declaredContract !== undefined &&
    declaredContract !== manifest.contract
  ) {
    push(
      "lesson-contract-mismatch",
      lessonId,
      `${declaredContract}:${manifest.contract}`,
    );
    lesson = canonicalLessonForManifest(rawLesson, manifest.contract);
    if (!lesson) {
      push(
        "missing-canonical-contract-fields",
        lessonId,
        manifest.contract,
      );
      return deepFreeze(errors);
    }
  } else if (!strictRuntimeLesson(rawLesson)) {
    reportMalformedRuntimeActivities(rawLesson, push);
    push("invalid-lesson-shape", lessonId, "lesson");
    return deepFreeze(errors);
  } else {
    lesson = strictRuntimeLesson(rawLesson) as BaseLessonContent;
  }
  const catalogFields = invalidRuntimeCatalogFields(rawCatalogs);
  if (catalogFields.length > 0) {
    for (const field of catalogFields) {
      push("invalid-catalog-entry", field, "catalogs");
    }
    return deepFreeze(errors);
  }
  const catalogs = rawCatalogs as BaseValidationCatalogs;

  validateReference(lesson.recapCopyId, catalogs.copyIds.has(lesson.recapCopyId), "recap copy", push);
  const seenPrerequisites = new Set<string>();
  const lessonPosition = hasCanonicalLessonPosition
    ? baseCanonicalPosition(lesson.lessonId)
    : null;
  const requiredPrerequisite = hasCanonicalLessonPosition
    ? requiredBaseLessonPrerequisiteFor(lesson.lessonId)
    : undefined;
  if (
    requiredPrerequisite !== undefined &&
    requiredPrerequisite !== null &&
    !lesson.prerequisiteLessonIds.includes(requiredPrerequisite)
  ) {
    push("missing-required-prerequisite", requiredPrerequisite);
  }
  for (const prerequisiteId of lesson.prerequisiteLessonIds) {
    if (seenPrerequisites.has(prerequisiteId)) {
      push("duplicate-prerequisite", prerequisiteId);
    }
    seenPrerequisites.add(prerequisiteId);
    if (prerequisiteId === lesson.lessonId) {
      push("self-prerequisite", prerequisiteId);
    }
    if (baseLessonManifestEntry(prerequisiteId) === null) {
      push("invalid-prerequisite", prerequisiteId);
    } else if (
      hasCanonicalLessonPosition &&
      lessonPosition !== null &&
      (baseCanonicalPosition(prerequisiteId) ?? -1) >= lessonPosition
    ) {
      push("future-prerequisite", prerequisiteId);
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
      const lexeme = catalogs.lexemes.get(lexemeId);
      if (lexeme !== undefined) {
        validateCatalogRecord(
          lexeme,
          lexemeId,
          "phonetic anchor",
          isStrictRuntimeLexeme,
          push,
        );
      }
    }
    const audioSurfaces = new Set<string>();
    for (const audioId of uniqueIds(lesson.audioExemplarIds)) {
      const audioTarget = audioTargetReferenceFor(audioId, catalogs);
      validateReference(audioId, audioTarget !== undefined, "phonetic audio exemplar", push);
      if (audioTarget) {
        if (audioTarget.invalidReason) {
          reportInvalidVisibleTarget(
            audioTarget.invalidReason,
            audioTarget.referenceId,
            audioTarget.label,
            push,
          );
          if (audioTarget.invalidReason === "invalid-particle-frame") {
            reportMalformedParticleFrame(
              catalogs.audioTargets.get(audioId),
              audioTarget.referenceId,
              audioTarget.label,
              push,
            );
          }
          continue;
        }
        validateSentenceLikeReferences(
          audioTarget.target,
          catalogs,
          audioTarget.referenceId,
          audioTarget.label,
          push,
        );
        const surface = visibleSurfaceFingerprint(audioTarget.target.tokens);
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
    validateActivities(lesson, catalogs, false, [], push);
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
      catalogs.referenceSnapshots.has(snapshotId),
      "reference snapshot",
      push,
    );
    const snapshot = catalogs.referenceSnapshots.get(snapshotId);
    if (snapshot !== undefined) {
      validateCatalogRecord(
        snapshot,
        snapshotId,
        "reference snapshot",
        isStrictRuntimeReferenceSnapshot,
        push,
      );
    }
  }
  for (const lexemeId of [...lesson.newLexemeIds, ...lesson.reviewLexemeIds]) {
    validateReference(lexemeId, catalogs.lexemes.has(lexemeId), "lesson lexeme", push);
    const lexeme = catalogs.lexemes.get(lexemeId);
    if (lexeme !== undefined) {
      validateCatalogRecord(lexeme, lexemeId, "lesson lexeme", isStrictRuntimeLexeme, push);
    }
  }
  for (const conceptId of [...lesson.introducedConceptIds, ...lesson.reviewedConceptIds]) {
    validateReference(conceptId, catalogs.concepts.has(conceptId), "lesson concept", push);
    const concept = catalogs.concepts.get(conceptId);
    if (concept !== undefined) {
      validateCatalogRecord(
        concept,
        conceptId,
        "lesson concept",
        isStrictRuntimeConcept,
        push,
      );
    }
  }

  const examples = resolvedExamples(lesson, catalogs, push);
  validateWorkedExampleVisibleSurfaces(examples, push);
  const canonicalExamples = canonicalExampleReferences(lesson, examples, catalogs);
  const uniqueExamples = validateExampleReferences(canonicalExamples, catalogs, push);
  const workedExampleIds = new Set(examples.map((example) => example.id));
  const uniqueWorkedExamples = uniqueExamples.filter((example) =>
    workedExampleIds.has(example.id),
  );
  validateActivities(lesson, catalogs, true, examples, push);

  const rawDialogue = lesson.dialogueId
    ? catalogs.dialogues.get(lesson.dialogueId)
    : undefined;
  const dialogue =
    rawDialogue ? strictRuntimeDialogue(rawDialogue) : undefined;
  if (lesson.dialogueId && !rawDialogue) {
    push("unresolved-reference", lesson.dialogueId, "dialogue");
  } else if (lesson.dialogueId && rawDialogue && !dialogue) {
    reportMalformedDialogueParticleFrames(rawDialogue, lesson.dialogueId, push);
    push("invalid-dialogue-shape", lesson.dialogueId, "dialogue");
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
        "dialogue-turn",
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

  validateDeclaredContentEvidence(lesson, examples, dialogue, catalogs, push);
  validateSemanticPatternDeclaration(lesson, catalogs, push);

  if (
    lesson.contract !== "synthesis" &&
    lesson.retrievedSystemIds.length > 0
  ) {
    for (const systemId of lesson.retrievedSystemIds) {
      push("retrieved-system-outside-synthesis", systemId);
    }
  }

  if (lesson.contract === "content") {
    const newCount = countCountableLexemes(lesson.newLexemeIds, catalogs);
    if (!isCountWithin(newCount, 8, 12)) {
      push("content-new-lexeme-count", undefined, `${newCount}`);
    }
    const uniqueWorkedExampleCount = uniqueWorkedExamples.length;
    if (!isCountWithin(uniqueWorkedExampleCount, 6, 10)) {
      push("content-example-count", undefined, `${uniqueWorkedExampleCount}`);
    }
    const patternCount = contentPatternCellCount(uniqueWorkedExamples);
    if (patternCount < 2) {
      push("content-pattern-diversity", undefined, `${patternCount}`);
    }
    const discourseFrameCount = contentDiscourseFrameCount(uniqueWorkedExamples);
    if (discourseFrameCount < 3) {
      push("content-context-diversity", undefined, `${discourseFrameCount}`);
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
    const rawCanonicalMatrix = catalogs.patternCellIdsByLesson.get(lesson.lessonId);
    const canonicalMatrix = runtimeStringArrayValues(rawCanonicalMatrix);
    if (rawCanonicalMatrix === undefined) {
      push("system-pattern-matrix-missing", lesson.lessonId);
    } else if (!canonicalMatrix) {
      push("invalid-catalog-entry", lesson.lessonId, "pattern cell matrix");
    } else {
      const substantiveCells = canonicalMatrix.filter(
        (cellId) => typeof cellId === "string" && cellId.trim().length > 0,
      );
      const canonicalCellSet = new Set(substantiveCells);
      if (canonicalMatrix.length === 0) {
        push("system-pattern-matrix-empty", lesson.lessonId);
      }
      if (canonicalCellSet.size < 2) {
        push("system-pattern-matrix-not-substantive", lesson.lessonId);
      }
      if (canonicalCellSet.size !== canonicalMatrix.length) {
        push("system-pattern-matrix-duplicate", lesson.lessonId);
      }
      for (const patternCellId of canonicalMatrix) {
        if (
          typeof patternCellId !== "string" ||
          patternCellId.trim().length === 0 ||
          !catalogs.patternCellIds.has(patternCellId)
        ) {
          push("system-pattern-matrix-unresolved", String(patternCellId));
        }
      }
      const declaredCellSet = new Set(lesson.patternCellIds);
      const declarationMatches =
        lesson.patternCellIds.length === declaredCellSet.size &&
        declaredCellSet.size === canonicalCellSet.size &&
        [...canonicalCellSet].every((cellId) => declaredCellSet.has(cellId));
      if (!declarationMatches) {
        push("system-pattern-cell-set-mismatch", lesson.lessonId);
      }
      for (const patternCellId of canonicalCellSet) {
        if (
          !uniqueWorkedExamples.some((example) =>
            example.patternCellIds.includes(patternCellId),
          )
        ) {
          push("system-pattern-cell-unrepresented", patternCellId);
        }
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
    validateSynthesisRetrievalSystems(
      lesson,
      examples,
      dialogue,
      catalogs,
      hasCanonicalLessonPosition,
      push,
    );
    if (!isCountWithin(uniqueIds(lesson.workedExampleIds).length, 6, 10)) {
      push("synthesis-example-count", undefined, `${uniqueIds(lesson.workedExampleIds).length}`);
    }
    if (!dialogue || !isCountWithin(dialogue.turns.length, 4, 8)) {
      push("synthesis-dialogue-turn-count", lesson.dialogueId ?? undefined);
    }
  }
  return deepFreeze(errors);
}
