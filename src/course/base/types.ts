import type {
  CopyId,
  LessonId,
  ModuleId,
} from "../foundations/types";

export type BaseLessonContract = "phonetic" | "system" | "content" | "synthesis";

export interface BaseLessonManifestEntry {
  readonly lessonId: LessonId;
  readonly moduleId: ModuleId;
  readonly order: 1 | 2 | 3 | 4;
  readonly contract: BaseLessonContract;
  readonly position: number;
}

export interface BaseModuleManifestEntry {
  readonly id: ModuleId;
  readonly order: number;
  readonly prerequisiteIds: readonly ModuleId[];
  readonly lessonIds: readonly LessonId[];
  readonly outcomeCopyId: CopyId;
}

export interface BaseManifestSpec {
  moduleIds: ModuleId[];
  lessonIdsByModule: Record<ModuleId, LessonId[]>;
  modulePrerequisites: Record<ModuleId, ModuleId[]>;
  lessonContracts: Record<LessonId, BaseLessonContract>;
}

export type BaseManifestErrorCode =
  | "module-count"
  | "lessons-per-module"
  | "duplicate-module-id"
  | "duplicate-lesson-id"
  | "missing-lesson-contract"
  | "lesson-contract-classification"
  | "missing-prerequisite-record"
  | "prerequisite-chain";

export interface BaseManifestValidationError {
  readonly code: BaseManifestErrorCode;
  readonly message: string;
}

export type BaseManifestValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly errors: readonly BaseManifestValidationError[] };
