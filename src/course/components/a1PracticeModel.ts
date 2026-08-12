import {
  buildA1LessonViewModel,
  resolveA1LessonVariantSource,
} from "../a1/a1LessonViewModel";
import { module1ItemsByLesson } from "../a1/catalog/module01Sounds";
// Covers every published A1 route, including the twenty Base rehomed, so the
// historical 64-route practice paths keep resolving (Task 16).
import { legacyA1LessonContentById as a1LessonContentById } from "../a1/curriculum/catalog";
import { phoneticItemForPracticeTarget } from "../a1/curriculum/lessonContentHelpers";
import type {
  A1PracticeActivity,
  A1PracticeFunction,
} from "../a1/curriculum/types";
import {
  getLessonExercises,
  type GeneratedExercise,
  type LessonExercisesModel,
} from "./lessonExerciseModel";

export interface A1PracticeActivityModel {
  readonly id: string;
  readonly function: A1PracticeFunction;
  readonly interactionKind: A1PracticeActivity["interactionKind"];
  readonly targetRef: A1PracticeActivity["targetRef"];
  readonly generatedExercise?: GeneratedExercise;
  readonly spokenVariantId?: string;
}

export interface A1PracticeModel {
  readonly lessonId: string;
  readonly activities: readonly A1PracticeActivityModel[];
}

export type A1PracticeModelErrorCode =
  | "unknown-lesson"
  | "unresolved-exercise"
  | "duplicate-target"
  | "interaction-kind-mismatch"
  | "unresolved-spoken-target";

export interface A1PracticeModelError {
  readonly code: A1PracticeModelErrorCode;
  readonly lessonId: string;
  readonly referenceId: string;
}

export type A1PracticeModelResult =
  | { readonly ok: true; readonly model: A1PracticeModel }
  | { readonly ok: false; readonly error: A1PracticeModelError };

export interface A1PracticeModelDependencies {
  readonly getLessonExercises: (lessonId: string) => LessonExercisesModel | undefined;
  readonly buildA1LessonViewModel: typeof buildA1LessonViewModel;
}

const DEFAULT_DEPS: A1PracticeModelDependencies = {
  getLessonExercises,
  buildA1LessonViewModel,
};

function fail(
  code: A1PracticeModelErrorCode,
  lessonId: string,
  referenceId: string,
): A1PracticeModelResult {
  return { ok: false, error: { code, lessonId, referenceId } };
}

function isSpokenTarget(
  targetRef: A1PracticeActivity["targetRef"],
): targetRef is Readonly<{ spokenVariantId: string }> {
  return "spokenVariantId" in targetRef;
}

function expectedSemanticExerciseId(
  activity: A1PracticeActivity,
  built: ReturnType<typeof buildA1LessonViewModel>,
): string | undefined {
  if (isSpokenTarget(activity.targetRef)) return undefined;
  if (!built.ok) return undefined;
  const round =
    activity.targetRef.round === "one"
      ? built.model.rounds[0]
      : built.model.rounds[1];
  const target = round.targets[activity.targetRef.index];
  if (!target || target.prompt.kind !== activity.interactionKind) return undefined;
  return target.targetId;
}

/**
 * Joins the authored five-activity A1 blueprint to the generated exercise
 * catalog. The first four activities always carry exactly one generated
 * exercise; the fifth is a spoken target only.
 */
export function buildA1PracticeModel(
  lessonId: string,
  overrides: Partial<A1PracticeModelDependencies> = {},
): A1PracticeModelResult {
  const content = a1LessonContentById[lessonId];
  if (!content) return fail("unknown-lesson", lessonId, lessonId);

  const deps = { ...DEFAULT_DEPS, ...overrides };
  const exercises = deps.getLessonExercises(lessonId);
  if (!exercises || exercises.errors.length > 0) {
    return fail("unresolved-exercise", lessonId, lessonId);
  }

  const phoneticItems = module1ItemsByLesson[lessonId];
  const semanticFoundation = phoneticItems
    ? undefined
    : deps.buildA1LessonViewModel(lessonId, "en");
  const activities: A1PracticeActivityModel[] = [];
  for (const activity of content.practiceBlueprint.activities) {
    if (isSpokenTarget(activity.targetRef)) {
      const spokenTarget = activity.targetRef;
      const spokenResolves = phoneticItems
        ? phoneticItems.some((item) => item.id === spokenTarget.spokenVariantId)
        : resolveA1LessonVariantSource(
            lessonId,
            spokenTarget.spokenVariantId,
          ) !== undefined;
      if (!spokenResolves) {
        return fail(
          "unresolved-spoken-target",
          lessonId,
          spokenTarget.spokenVariantId,
        );
      }
      activities.push({
        id: activity.id,
        function: activity.function,
        interactionKind: activity.interactionKind,
        targetRef: activity.targetRef,
        spokenVariantId: spokenTarget.spokenVariantId,
      });
      continue;
    }

    const expectedId = phoneticItems
      ? phoneticItemForPracticeTarget(phoneticItems, activity.targetRef)?.exerciseRefId
      : semanticFoundation
        ? expectedSemanticExerciseId(activity, semanticFoundation)
        : undefined;
    if (!expectedId) {
      return fail("unresolved-exercise", lessonId, activity.id);
    }
    const matches = exercises.exercises.filter(
      (exercise) => exercise.definitionId === expectedId,
    );
    if (matches.length === 0) return fail("unresolved-exercise", lessonId, expectedId);
    if (matches.length > 1) return fail("duplicate-target", lessonId, expectedId);
    const generatedExercise = matches[0]!;
    if (
      generatedExercise.prompt.kind !== activity.interactionKind ||
      generatedExercise.practiceFunction !== activity.function
    ) {
      return fail("interaction-kind-mismatch", lessonId, expectedId);
    }
    activities.push({
      id: activity.id,
      function: activity.function,
      interactionKind: activity.interactionKind,
      targetRef: activity.targetRef,
      generatedExercise,
    });
  }

  if (activities.length !== 5) return fail("unresolved-exercise", lessonId, lessonId);
  return { ok: true, model: { lessonId, activities } };
}
