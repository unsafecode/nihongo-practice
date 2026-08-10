import type { AssembledToken } from "../../../romaji/types";
import { formatRomaji } from "../../../romaji/formatRomaji";
import { deepFreeze } from "../../foundations/deepFreeze";
import {
  BASE_CANONICAL_POSITIONS,
  BASE_LESSON_MANIFEST,
  requiredBaseLessonPrerequisiteFor,
} from "../manifest";
import { firstTeachLessonPosition } from "../catalog/firstTeach";
import type {
  BaseActivityDefinition,
  BaseExample,
  BaseLessonContent,
  BaseValidationCatalogs,
  BaseVisibleTarget,
} from "../catalog/types";
import {
  activityPromptTargetReferenceFor,
  activityTargetReferenceFor,
  audioTargetReferenceFor,
} from "../catalog/visibleTargets";
import {
  BASE_PARTICLE_FRAME_BY_PREDICATE,
  validateParticleFrame,
} from "../forms/particleLicensing";
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
  | "system-pattern-matrix-missing"
  | "system-pattern-matrix-empty"
  | "system-pattern-matrix-not-substantive"
  | "system-pattern-matrix-duplicate"
  | "system-pattern-matrix-unresolved"
  | "system-pattern-cell-set-mismatch"
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
  | "duplicate-target-operation"
  | "duplicate-visible-target"
  | "activity-category-operation-mismatch"
  | "fingerprint-resolution"
  | "worked-example-reused-by-activity"
  | "duplicate-semantic-fingerprint"
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
  | "invalid-particle-frame"
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
  | "synthesis-system-not-visible"
  | "synthesis-system-not-retrieved"
  | "duplicate-prerequisite"
  | "self-prerequisite"
  | "future-prerequisite"
  | "lesson-prerequisite-cycle";

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
const TOKEN_KINDS = new Set(["lexical", "particle", "morpheme", "punctuation"]);
const TOKEN_BOUNDARIES = new Set(["attach", "space"]);
const TOKEN_SOURCE_DOMAINS = new Set([
  "catalog",
  "lab",
  "exercise",
  "speech",
  "test",
  "family",
]);

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

function isStrictRuntimeToken(token: unknown): token is AssembledToken {
  if (!isPlainDataRecord(token)) return false;
  const source = ownDataValue(token, "source");
  if (!isPlainDataRecord(source)) return false;
  const referenceId = ownDataValue(source, "referenceId");
  const domain = ownDataValue(source, "domain");
  const reading = ownDataValue(token, "reading");
  return (
    typeof ownDataValue(token, "id") === "string" &&
    typeof ownDataValue(token, "jp") === "string" &&
    typeof ownDataValue(token, "romaji") === "string" &&
    typeof ownDataValue(token, "kind") === "string" &&
    TOKEN_KINDS.has(ownDataValue(token, "kind") as string) &&
    typeof ownDataValue(token, "boundaryBefore") === "string" &&
    TOKEN_BOUNDARIES.has(ownDataValue(token, "boundaryBefore") as string) &&
    typeof domain === "string" &&
    TOKEN_SOURCE_DOMAINS.has(domain) &&
    typeof referenceId === "string" &&
    referenceId.trim().length > 0 &&
    (reading === undefined || typeof reading === "string")
  );
}

function isStrictRuntimeTokenSequence(
  tokens: readonly AssembledToken[] | unknown,
): tokens is readonly AssembledToken[] {
  return Array.isArray(tokens) && tokens.every(isStrictRuntimeToken);
}

export function validateTokenSequence(
  tokens: readonly AssembledToken[] | unknown,
): ReturnType<typeof formatRomaji> {
  if (!isStrictRuntimeTokenSequence(tokens)) {
    return {
      ok: false,
      errors: [{ code: "unresolved-token" }],
    };
  }
  return formatRomaji(tokens);
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
): void {
  if (!isStrictRuntimeTokenSequence(tokens)) {
    push("token-sequence-invalid", referenceId, `${label}:invalid-runtime-token`);
    return;
  }
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
    const promptTarget = activityPromptTargetReferenceFor(
      lesson.lessonId,
      activity,
      catalogs,
    );
    if (promptTarget) {
      validateSentenceLikeReferences(
        promptTarget.target,
        catalogs,
        promptTarget.referenceId,
        promptTarget.label,
        push,
      );
    }
    const activityTarget = activityTargetReferenceFor(activity, catalogs);
    if (activityTarget && activityTarget.source !== "example") {
      validateSentenceLikeReferences(
        activityTarget.target,
        catalogs,
        activityTarget.referenceId,
        activityTarget.label,
        push,
      );
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
    const visibleLexemeIds = new Set<string>();
    const visibleContentIds = new Set<string>();
    for (const provenance of [promptTarget, activityTarget]) {
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

type SentenceLike = BaseVisibleTarget;

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isParticleFrame(value: unknown): value is Readonly<Record<string, unknown>> {
  return isPlainDataRecord(value);
}

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
  const targetLexemeIds = target.lexemeIds;
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
  if (!Array.isArray(tokens)) return;
  const reported = new Set<string>();
  for (const token of tokens) {
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
): void {
  if (sentence === null || typeof sentence !== "object" || Array.isArray(sentence)) {
    push("invalid-visible-target", referenceId, label);
    return;
  }
  const target = sentence as Readonly<Record<string, unknown>>;
  const requiredArrays = [
    "tokens",
    "lexemeIds",
    "conceptIds",
    "formIds",
    "patternCellIds",
    "semanticRoleIds",
    "interpretationTags",
  ] as const;
  if (!requiredArrays.every((field) => Array.isArray(target[field]))) {
    push("invalid-visible-target", referenceId, label);
    return;
  }
  const predicateSenseId = ownDataValue(target, "predicateSenseId");
  const predicateLexemeId = ownDataValue(target, "predicateLexemeId");
  if (
    !(
      (typeof predicateSenseId === "string" || predicateSenseId === null) &&
      (typeof predicateLexemeId === "string" || predicateLexemeId === null)
    )
  ) {
    push("invalid-visible-target", referenceId, `${label}:predicate-provenance`);
    if (target.particleFrame !== undefined) {
      push(
        "particle-frame-predicate-mismatch",
        referenceId,
        `${label}:predicate-provenance`,
      );
    }
    return;
  }
  validateTokens(target.tokens, referenceId, label, push);
  if (
    !isStringArray(target.lexemeIds) ||
    !isStringArray(target.conceptIds) ||
    !isStringArray(target.formIds) ||
    !isStringArray(target.patternCellIds)
  ) {
    push("invalid-visible-target", referenceId, label);
    return;
  }
  for (const lexemeId of target.lexemeIds) {
    validateReference(lexemeId, catalogs.lexemes.has(lexemeId), `${label} lexeme`, push);
  }
  for (const conceptId of target.conceptIds) {
    validateReference(conceptId, catalogs.concepts.has(conceptId), `${label} concept`, push);
  }
  for (const formId of target.formIds) {
    validateReference(formId, catalogs.concepts.has(formId), `${label} form`, push);
  }
  for (const patternCellId of target.patternCellIds) {
    validateReference(
      patternCellId,
      catalogs.patternCellIds.has(patternCellId),
      `${label} pattern cell`,
      push,
    );
  }
  validateCanonicalTokenSourceProvenance(
    target.tokens,
    target.lexemeIds,
    target.conceptIds,
    target.formIds,
    catalogs,
    referenceId,
    label,
    push,
  );
  if (target.particleFrame !== undefined) {
    if (isParticleFrame(target.particleFrame)) {
      validateParticlePredicateProvenance(
        target,
        target.particleFrame,
        referenceId,
        label,
        push,
      );
    }
    if (
      !isParticleFrame(target.particleFrame) ||
      typeof ownDataValue(target.particleFrame, "predicateSenseId") !== "string" ||
      !isParticleFrame(ownDataValue(target.particleFrame, "provided"))
    ) {
      push("invalid-particle-frame", referenceId, `${label}:malformed`);
      return;
    }
    const frame = validateParticleFrame(
      ownDataValue(target.particleFrame, "predicateSenseId"),
      ownDataValue(target.particleFrame, "provided"),
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

function targetStringField(
  target: BaseVisibleTarget | unknown,
  field: "lexemeIds" | "conceptIds" | "formIds",
): readonly string[] {
  if (target === null || typeof target !== "object" || Array.isArray(target)) {
    return [];
  }
  const value = (target as Readonly<Record<string, unknown>>)[field];
  return isStringArray(value) ? value : [];
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
    const lexeme = catalogs.lexemes.get(lexemeId);
    if (lexeme && !lexeme.countable) {
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
    if (
      activity.mode !== "non-spoken" ||
      activity.category !== "cumulative-retrieval"
    ) {
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
  const lessonPosition = firstTeachLessonPosition(lesson.lessonId);

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
    const system = catalogs.systems.get(systemId);
    if (!system) {
      push("unresolved-reference", systemId, "retrieved system");
      continue;
    }
    const systemPosition = firstTeachLessonPosition(system.firstTeachLessonId);
    const taughtBefore =
      lessonPosition !== undefined &&
      systemPosition !== undefined &&
      systemPosition < lessonPosition;
    if (!taughtBefore) {
      push(
        "synthesis-system-before-teach",
        systemId,
        system.firstTeachLessonId,
      );
    }
    let hasOnlyCanonicalComponents = system.componentContentIds.length > 0;
    for (const componentId of system.componentContentIds) {
      if (!catalogs.concepts.has(componentId)) {
        hasOnlyCanonicalComponents = false;
        push("unresolved-reference", componentId, "retrieved system component");
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
  const seenPrerequisites = new Set<string>();
  const lessonPosition = BASE_CANONICAL_POSITIONS[lesson.lessonId];
  const requiredPrerequisite = requiredBaseLessonPrerequisiteFor(lesson.lessonId);
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
    if (!BASE_LESSON_MANIFEST[prerequisiteId]) {
      push("invalid-prerequisite", prerequisiteId);
    } else if (
      lessonPosition !== undefined &&
      BASE_CANONICAL_POSITIONS[prerequisiteId] >= lessonPosition
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
    }
    const audioSurfaces = new Set<string>();
    for (const audioId of uniqueIds(lesson.audioExemplarIds)) {
      const audioTarget = audioTargetReferenceFor(audioId, catalogs);
      validateReference(audioId, audioTarget !== undefined, "phonetic audio exemplar", push);
      if (audioTarget) {
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
      catalogs.referenceSnapshots.has(snapshotId),
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

  validateDeclaredContentEvidence(lesson, examples, dialogue, catalogs, push);

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
    const canonicalMatrix = catalogs.patternCellIdsByLesson.get(lesson.lessonId);
    if (!canonicalMatrix) {
      push("system-pattern-matrix-missing", lesson.lessonId);
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
      for (const patternCellId of lesson.patternCellIds) {
        if (!catalogs.patternCellIds.has(patternCellId)) {
          push("system-pattern-matrix-unresolved", patternCellId);
        }
      }
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
    validateSynthesisRetrievalSystems(lesson, examples, dialogue, catalogs, push);
    if (!isCountWithin(uniqueIds(lesson.workedExampleIds).length, 6, 10)) {
      push("synthesis-example-count", undefined, `${uniqueIds(lesson.workedExampleIds).length}`);
    }
    if (!dialogue || !isCountWithin(dialogue.turns.length, 4, 8)) {
      push("synthesis-dialogue-turn-count", lesson.dialogueId ?? undefined);
    }
  }
  return deepFreeze(errors);
}
