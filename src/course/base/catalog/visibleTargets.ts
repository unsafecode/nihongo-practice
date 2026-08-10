import type {
  BaseActivityDefinition,
  BaseValidationCatalogs,
  BaseVisibleTarget,
} from "./types";
import { baseVisibleTargetForExample } from "./types";

export interface BaseVisibleTargetReference {
  readonly target: BaseVisibleTarget;
  readonly referenceId: string;
  readonly label: string;
  readonly source: "example" | "accepted-answer" | "audio" | "activity-prompt";
}

/**
 * Resolves an activity's learner-visible target through the canonical
 * provenance catalogs. Examples supply the same shape through their view.
 */
export function activityTargetReferenceFor(
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): BaseVisibleTargetReference | undefined {
  const example = catalogs.examples.get(activity.targetId);
  if (example) {
    return {
      target: baseVisibleTargetForExample(example),
      referenceId: activity.targetId,
      label: "activity target example",
      source: "example",
    };
  }
  const acceptedAnswer = catalogs.acceptedAnswerTargets.get(activity.targetId);
  if (acceptedAnswer) {
    return {
      target: acceptedAnswer,
      referenceId: activity.targetId,
      label: "activity accepted target",
      source: "accepted-answer",
    };
  }
  const audioTarget = catalogs.audioTargets.get(activity.targetId);
  if (audioTarget) {
    return {
      target: audioTarget,
      referenceId: activity.targetId,
      label: "activity audio target",
      source: "audio",
    };
  }
  return undefined;
}

/** Resolves prompt provenance by the activity ID, the canonical prompt key. */
export function activityPromptTargetReferenceFor(
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): BaseVisibleTargetReference | undefined {
  const target = catalogs.activityPromptTargets.get(activity.id);
  return target
    ? {
        target,
        referenceId: activity.id,
        label: "activity prompt",
        source: "activity-prompt",
      }
    : undefined;
}

export function audioTargetReferenceFor(
  audioTargetId: string,
  catalogs: BaseValidationCatalogs,
  label = "phonetic audio exemplar",
): BaseVisibleTargetReference | undefined {
  const target = catalogs.audioTargets.get(audioTargetId);
  return target
    ? {
        target,
        referenceId: audioTargetId,
        label,
        source: "audio",
      }
    : undefined;
}
