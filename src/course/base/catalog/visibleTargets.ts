import type {
  BaseActivityDefinition,
  BaseValidationCatalogs,
  BaseVisibleTarget,
} from "./types";
import {
  visibleTargetFromExample,
  visibleTargetFromCatalogTarget,
} from "./types";
import {
  isPlainDataRecord,
  isStrictRuntimeExample,
  ownDataValue,
  runtimeVisibleTargetIssue,
  type RuntimeVisibleTargetIssue,
} from "../validation/runtimeGuards";

/**
 * A length-delimited key keeps prompt IDs stable and collision-safe even when
 * lesson or activity IDs contain punctuation.
 */
export function baseActivityPromptKey(lessonId: string, activityId: string): string {
  return `base-prompt:${lessonId.length}:${lessonId}${activityId.length}:${activityId}`;
}

export interface BaseVisibleTargetReference {
  readonly target: BaseVisibleTarget;
  readonly referenceId: string;
  readonly label: string;
  readonly source: "example" | "accepted-answer" | "audio" | "activity-prompt";
  readonly invalidReason?:
    | RuntimeVisibleTargetIssue
    | "invalid-example"
    | "invalid-activity";
}

function targetReference(
  rawTarget: unknown,
  referenceId: string,
  label: string,
  source: BaseVisibleTargetReference["source"],
): BaseVisibleTargetReference {
  const invalidReason = runtimeVisibleTargetIssue(rawTarget);
  return {
    target: visibleTargetFromCatalogTarget(rawTarget),
    referenceId,
    label,
    source,
    ...(invalidReason === undefined ? {} : { invalidReason }),
  };
}

/**
 * Resolves an activity's learner-visible target through the canonical
 * provenance catalogs. Examples supply the same shape through their view.
 */
export function activityTargetReferenceFor(
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): BaseVisibleTargetReference | undefined {
  if (!isPlainDataRecord(activity)) return undefined;
  const targetId = ownDataValue(activity, "targetId");
  if (typeof targetId !== "string") return undefined;
  const example = catalogs.examples.get(targetId);
  if (example) {
    return {
      target: visibleTargetFromExample(example),
      referenceId: targetId,
      label: "activity target example",
      source: "example",
      ...(!isStrictRuntimeExample(example) ? { invalidReason: "invalid-example" as const } : {}),
    };
  }
  const acceptedAnswer = catalogs.acceptedAnswerTargets.get(targetId);
  if (acceptedAnswer) {
    return targetReference(
      acceptedAnswer,
      targetId,
      "activity accepted target",
      "accepted-answer",
    );
  }
  const audioTarget = catalogs.audioTargets.get(targetId);
  if (audioTarget) {
    return targetReference(audioTarget, targetId, "activity audio target", "audio");
  }
  return undefined;
}

/** Resolves prompt provenance by the lesson-scoped canonical prompt key. */
export function activityPromptTargetReferenceFor(
  lessonId: string,
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): BaseVisibleTargetReference | undefined {
  if (!isPlainDataRecord(activity)) return undefined;
  const activityId = ownDataValue(activity, "id");
  if (typeof activityId !== "string") return undefined;
  const target = catalogs.activityPromptTargets.get(
    baseActivityPromptKey(lessonId, activityId),
  );
  return target
    ? targetReference(target, activityId, "activity prompt", "activity-prompt")
    : undefined;
}

export function audioTargetReferenceFor(
  audioTargetId: string,
  catalogs: BaseValidationCatalogs,
  label = "phonetic audio exemplar",
): BaseVisibleTargetReference | undefined {
  const target = catalogs.audioTargets.get(audioTargetId);
  return target
    ? targetReference(target, audioTargetId, label, "audio")
    : undefined;
}
