import { deepFreeze } from "../../foundations/deepFreeze";

export interface V4OwnershipMigrationRow {
  readonly sourceLevel: "a1";
  readonly sourceLessonId: string;
  readonly destinationLevel: "a0";
  readonly destinationLessonId: string;
}

/**
 * Frozen Task 1 inventory of lesson ids whose published ownership moved from
 * A1 to Base. This roster validates the reviewed map below; it does not
 * generate it, so a mistaken positional remap cannot hide in implementation.
 */
export const V4_REHOMED_LESSON_IDS = deepFreeze([
  "sounds-1", "sounds-2", "sounds-3", "sounds-4",
  "sentence-foundations-1", "sentence-foundations-2",
  "sentence-foundations-3", "sentence-foundations-4",
  "topic-questions-1", "topic-questions-2", "topic-questions-3", "topic-questions-4",
  "polite-verbs-1", "polite-verbs-2", "polite-verbs-3", "polite-verbs-4",
  "time-movement-1", "time-movement-2", "time-movement-3", "time-movement-4",
] as const);

export const V4_OWNERSHIP_MIGRATION_MAP: readonly V4OwnershipMigrationRow[] = deepFreeze([
  { sourceLevel: "a1", sourceLessonId: "sounds-1", destinationLevel: "a0", destinationLessonId: "sounds-1" },
  { sourceLevel: "a1", sourceLessonId: "sounds-2", destinationLevel: "a0", destinationLessonId: "sounds-2" },
  { sourceLevel: "a1", sourceLessonId: "sounds-3", destinationLevel: "a0", destinationLessonId: "sounds-3" },
  { sourceLevel: "a1", sourceLessonId: "sounds-4", destinationLevel: "a0", destinationLessonId: "sounds-4" },
  { sourceLevel: "a1", sourceLessonId: "sentence-foundations-1", destinationLevel: "a0", destinationLessonId: "sentence-foundations-1" },
  { sourceLevel: "a1", sourceLessonId: "sentence-foundations-2", destinationLevel: "a0", destinationLessonId: "sentence-foundations-2" },
  { sourceLevel: "a1", sourceLessonId: "sentence-foundations-3", destinationLevel: "a0", destinationLessonId: "sentence-foundations-3" },
  { sourceLevel: "a1", sourceLessonId: "sentence-foundations-4", destinationLevel: "a0", destinationLessonId: "sentence-foundations-4" },
  { sourceLevel: "a1", sourceLessonId: "topic-questions-1", destinationLevel: "a0", destinationLessonId: "topic-questions-1" },
  { sourceLevel: "a1", sourceLessonId: "topic-questions-2", destinationLevel: "a0", destinationLessonId: "topic-questions-2" },
  { sourceLevel: "a1", sourceLessonId: "topic-questions-3", destinationLevel: "a0", destinationLessonId: "topic-questions-3" },
  { sourceLevel: "a1", sourceLessonId: "topic-questions-4", destinationLevel: "a0", destinationLessonId: "topic-questions-4" },
  { sourceLevel: "a1", sourceLessonId: "polite-verbs-1", destinationLevel: "a0", destinationLessonId: "polite-verbs-1" },
  { sourceLevel: "a1", sourceLessonId: "polite-verbs-2", destinationLevel: "a0", destinationLessonId: "polite-verbs-2" },
  { sourceLevel: "a1", sourceLessonId: "polite-verbs-3", destinationLevel: "a0", destinationLessonId: "polite-verbs-3" },
  { sourceLevel: "a1", sourceLessonId: "polite-verbs-4", destinationLevel: "a0", destinationLessonId: "polite-verbs-4" },
  { sourceLevel: "a1", sourceLessonId: "time-movement-1", destinationLevel: "a0", destinationLessonId: "time-movement-1" },
  { sourceLevel: "a1", sourceLessonId: "time-movement-2", destinationLevel: "a0", destinationLessonId: "time-movement-2" },
  { sourceLevel: "a1", sourceLessonId: "time-movement-3", destinationLevel: "a0", destinationLessonId: "time-movement-3" },
  { sourceLevel: "a1", sourceLessonId: "time-movement-4", destinationLevel: "a0", destinationLessonId: "time-movement-4" },
]);
