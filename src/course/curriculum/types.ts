import type { PhaseId } from "../data/types";

export interface ModuleCoverageBudget {
  readonly lessons: number;
  readonly introducedVerbs: number;
  readonly vocabulary: number;
}

export interface CurriculumModuleFoundation {
  readonly id: string;
  readonly order: number;
  readonly phase: PhaseId;
  readonly prerequisiteIds: readonly string[];
  readonly coverage: ModuleCoverageBudget;
}

export interface CurriculumFoundation {
  readonly version: "a0-a1-v1";
  readonly modules: readonly CurriculumModuleFoundation[];
}

export interface CurriculumCoverageTotals {
  readonly lessons: number;
  readonly introducedVerbs: number;
  readonly vocabulary: number;
}

export type CurriculumFoundationErrorCode =
  | "duplicate-module-id"
  | "duplicate-module-order"
  | "missing-prerequisite"
  | "prerequisite-not-earlier"
  | "prerequisite-cycle"
  | "invalid-phase-order"
  | "invalid-lesson-count"
  | "invalid-verb-count"
  | "invalid-vocabulary-count"
  | "invalid-module-count"
  | "invalid-lesson-total"
  | "invalid-verb-total"
  | "invalid-vocabulary-total";

export interface CurriculumFoundationError {
  readonly code: CurriculumFoundationErrorCode;
  readonly moduleId?: string;
  readonly referenceId?: string;
}

export interface CurriculumFoundationValidation {
  readonly valid: boolean;
  readonly errors: readonly CurriculumFoundationError[];
  readonly totals: CurriculumCoverageTotals;
}
