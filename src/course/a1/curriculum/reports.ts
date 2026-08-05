import type {
  A1CurriculumValidationError,
  A1LessonContract,
} from "../types";
import type { A1PracticeActivity, A1PracticeFunction } from "./types";

/**
 * One canonical lesson row derived by the curriculum validator. The raw
 * `visibleTargetKeys` are build-time diagnostics only: no UI or persistence
 * module imports this report surface.
 */
export interface A1LessonCurriculumReport {
  readonly lessonId: string;
  readonly contract: A1LessonContract;
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
  readonly lessonContractDistribution: Readonly<Record<string, number>>;
  readonly productionBuilds: A1ProductionBuildReport;
  readonly practiceFunctionDistribution: Readonly<Record<string, number>>;
  readonly interactionKindDistribution: Readonly<Record<string, number>>;
  readonly unresolvedFindings: readonly A1CurriculumValidationError[];
  readonly repeatedFindings: readonly A1CurriculumValidationError[];
}

/**
 * The actual production builders analyzed by the validator. Counts are attempt
 * counts, not declarations, so a green report proves the runtime-facing
 * semantic view/practice paths were both invoked.
 */
export interface A1ProductionBuildReport {
  readonly analyzed: boolean;
  readonly semanticLessonCount: number;
  readonly curriculumViewBuildCount: number;
  readonly practiceModelBuildCount: number;
}

export interface BuildA1CurriculumReportsInput {
  readonly rows: readonly A1LessonCurriculumReport[];
  readonly errors: readonly A1CurriculumValidationError[];
  readonly productionBuilds?: A1ProductionBuildReport;
}

function countBy(values: readonly string[]): Readonly<Record<string, number>> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Object.freeze(
    Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right))),
  );
}

/** Builds deterministic aggregate reports from already-derived curriculum rows. */
export function buildA1CurriculumReports(
  input: BuildA1CurriculumReportsInput,
): A1CurriculumReports {
  const { rows, errors } = input;
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
    lessonContractDistribution: countBy(rows.map((row) => row.contract)),
    productionBuilds: Object.freeze(
      input.productionBuilds ?? {
        analyzed: false,
        semanticLessonCount: 0,
        curriculumViewBuildCount: 0,
        practiceModelBuildCount: 0,
      },
    ),
    practiceFunctionDistribution: countBy(rows.flatMap((row) => row.practiceFunctions)),
    interactionKindDistribution: countBy(rows.flatMap((row) => row.interactionKinds)),
    unresolvedFindings: Object.freeze(errors.filter((error) => unresolved.has(error.code))),
    repeatedFindings: Object.freeze(errors.filter((error) => repeated.has(error.code))),
  });
}
