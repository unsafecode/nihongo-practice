import type { A1CurriculumValidationError } from "../types";
import type { A1PracticeActivity, A1PracticeFunction } from "./types";

/**
 * One canonical lesson row derived by the curriculum validator. The raw
 * `visibleTargetKeys` are build-time diagnostics only: no UI or persistence
 * module imports this report surface.
 */
export interface A1LessonCurriculumReport {
  readonly lessonId: string;
  readonly newLexemeCount: number;
  readonly introducedLexemeIds: readonly string[];
  readonly usedLexemeIds: readonly string[];
  readonly learningNoteId: string;
  readonly prerequisiteConceptIds: readonly string[];
  readonly practiceFunctions: readonly A1PracticeFunction[];
  readonly interactionKinds: readonly A1PracticeActivity["interactionKind"][];
  readonly visibleTargetKeys: readonly string[];
}

export interface A1CurriculumReports {
  readonly byLesson: readonly A1LessonCurriculumReport[];
  readonly practiceFunctionDistribution: Readonly<Record<string, number>>;
  readonly interactionKindDistribution: Readonly<Record<string, number>>;
  readonly unresolvedFindings: readonly A1CurriculumValidationError[];
  readonly repeatedFindings: readonly A1CurriculumValidationError[];
}

export interface BuildA1CurriculumReportsInput {
  readonly rows: readonly A1LessonCurriculumReport[];
  readonly errors: readonly A1CurriculumValidationError[];
}

function countBy(values: readonly string[]): Readonly<Record<string, number>> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Object.freeze(
    Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right))),
  );
}

/** Builds deterministic aggregate reports from already-derived curriculum rows. */
export function buildA1CurriculumReports({
  rows,
  errors,
}: BuildA1CurriculumReportsInput): A1CurriculumReports {
  const unresolved = new Set([
    "missing-instructional-content",
    "unintroduced-lexeme-use",
    "unglossed-lexeme-use",
    "worked-example-unresolvable",
  ]);
  const repeated = new Set([
    "duplicate-lexeme-introduction",
    "duplicate-practice-target",
    "review-retrieval-clone",
  ]);

  return Object.freeze({
    byLesson: Object.freeze([...rows]),
    practiceFunctionDistribution: countBy(rows.flatMap((row) => row.practiceFunctions)),
    interactionKindDistribution: countBy(rows.flatMap((row) => row.interactionKinds)),
    unresolvedFindings: Object.freeze(errors.filter((error) => unresolved.has(error.code))),
    repeatedFindings: Object.freeze(errors.filter((error) => repeated.has(error.code))),
  });
}
