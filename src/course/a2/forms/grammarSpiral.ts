import { deepFreeze } from "../../foundations/deepFreeze";
import type { LessonId } from "../../foundations/types";

/**
 * One row of the A2 grammar spiral (Phase 3 Task 2, design spec plan table
 * L2). Each grammar point is introduced once, drilled with controlled
 * practice, transferred into a freer task, and recurs later in the release
 * so learners keep meeting it. This file is lesson-ID data only — no
 * Japanese literals live here; see `a2Conjugation.ts`/`a2Constructions.ts`
 * for the verbal Japanese those lesson IDs eventually attach to.
 */
export interface A2GrammarForm {
  readonly id: string;
  readonly canDoId: string;
  readonly introLessonId: LessonId;
  readonly controlledPracticeLessonId: LessonId;
  readonly transferLessonId: LessonId;
  readonly recurrenceLessonIds: readonly LessonId[];
}

/** The frozen A2 grammar spiral. Exactly 15 rows, one per Can-do form. */
export const A2_GRAMMAR_SPIRAL: readonly A2GrammarForm[] = deepFreeze([
  {
    id: "recognize-plain-forms",
    canDoId: "a2-cando-recognize-plain-forms",
    introLessonId: "connected-conversation-4",
    controlledPracticeLessonId: "reasons-opinions-3",
    transferLessonId: "experiences-narratives-2",
    recurrenceLessonIds: ["a2-synthesis-1", "a2-synthesis-4"],
  },
  {
    id: "sequence-te",
    canDoId: "a2-cando-sequence-te",
    introLessonId: "sequencing-ongoing-1",
    controlledPracticeLessonId: "sequencing-ongoing-2",
    transferLessonId: "sequencing-ongoing-4",
    recurrenceLessonIds: ["restaurant-problems-4", "a2-synthesis-3"],
  },
  {
    id: "ongoing-teiru",
    canDoId: "a2-cando-ongoing-teiru",
    introLessonId: "sequencing-ongoing-3",
    controlledPracticeLessonId: "sequencing-ongoing-4",
    transferLessonId: "work-study-messages-3",
    recurrenceLessonIds: ["relationships-events-3", "a2-synthesis-2"],
  },
  {
    id: "request-tekudasai",
    canDoId: "a2-cando-request-tekudasai",
    introLessonId: "permission-requests-3",
    controlledPracticeLessonId: "restaurant-problems-2",
    transferLessonId: "work-study-messages-2",
    recurrenceLessonIds: ["travel-reservations-3", "a2-synthesis-3"],
  },
  {
    id: "permission-temoii",
    canDoId: "a2-cando-permission-temoii",
    introLessonId: "permission-requests-1",
    controlledPracticeLessonId: "permission-requests-3",
    transferLessonId: "neighborhood-services-1",
    recurrenceLessonIds: ["restaurant-problems-2", "a2-synthesis-2"],
  },
  {
    id: "prohibition-tewaikenai",
    canDoId: "a2-cando-prohibition-tewaikenai",
    introLessonId: "permission-requests-2",
    controlledPracticeLessonId: "permission-requests-4",
    transferLessonId: "practical-texts-2",
    recurrenceLessonIds: ["a2-synthesis-2"],
  },
  {
    id: "request-negative",
    canDoId: "a2-cando-negative-request",
    introLessonId: "permission-requests-4",
    controlledPracticeLessonId: "health-advice-3",
    transferLessonId: "travel-reservations-3",
    recurrenceLessonIds: ["a2-synthesis-3"],
  },
  {
    id: "experience-takoto",
    canDoId: "a2-cando-experience-takoto",
    introLessonId: "experiences-narratives-1",
    controlledPracticeLessonId: "experiences-narratives-3",
    transferLessonId: "travel-reservations-2",
    recurrenceLessonIds: ["relationships-events-3", "a2-synthesis-4"],
  },
  {
    id: "intentions-plans",
    canDoId: "a2-cando-intentions-plans",
    introLessonId: "plans-invitations-1",
    controlledPracticeLessonId: "plans-invitations-3",
    transferLessonId: "plans-invitations-4",
    recurrenceLessonIds: ["travel-reservations-1", "a2-synthesis-1"],
  },
  {
    id: "reason-kara",
    canDoId: "a2-cando-reason-kara",
    introLessonId: "reasons-opinions-1",
    controlledPracticeLessonId: "reasons-opinions-4",
    transferLessonId: "health-advice-2",
    recurrenceLessonIds: ["work-study-messages-1", "a2-synthesis-3"],
  },
  {
    id: "reason-node",
    canDoId: "a2-cando-reason-node",
    introLessonId: "reasons-opinions-2",
    controlledPracticeLessonId: "work-study-messages-1",
    transferLessonId: "travel-reservations-3",
    recurrenceLessonIds: ["a2-synthesis-3"],
  },
  {
    id: "opinion-toomou",
    canDoId: "a2-cando-opinion-toomou",
    introLessonId: "reasons-opinions-3",
    controlledPracticeLessonId: "reasons-opinions-4",
    transferLessonId: "shopping-returns-3",
    recurrenceLessonIds: ["practical-texts-3", "a2-synthesis-2"],
  },
  {
    id: "compare",
    canDoId: "a2-cando-compare",
    introLessonId: "shopping-returns-1",
    controlledPracticeLessonId: "shopping-returns-3",
    transferLessonId: "travel-reservations-2",
    recurrenceLessonIds: ["a2-synthesis-2"],
  },
  {
    id: "possibility",
    canDoId: "a2-cando-possibility",
    introLessonId: "neighborhood-services-1",
    controlledPracticeLessonId: "neighborhood-services-2",
    transferLessonId: "shopping-returns-3",
    recurrenceLessonIds: ["travel-reservations-1", "a2-synthesis-2"],
  },
  {
    id: "connectors",
    canDoId: "a2-cando-connectors",
    introLessonId: "connected-conversation-2",
    controlledPracticeLessonId: "reasons-opinions-4",
    transferLessonId: "experiences-narratives-2",
    recurrenceLessonIds: ["practical-texts-3", "a2-synthesis-1"],
  },
]);
