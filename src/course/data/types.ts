import type { SemanticIconId } from "../../components/icons/Icon";
import type { LabSelection } from "../../content/types";
import type { LessonSectionId } from "../../routing/lessonSections";

/**
 * Stable semantic IDs (design spec §6.1/§6.2). Module and lesson IDs are
 * never renamed once published: bookmarked lesson URLs and stored progress
 * both depend on `LessonId` staying stable across data reshuffles.
 */
export type ModuleId = string;
export type LessonId = string;

/**
 * The four curriculum phases every module belongs to, in this fixed order
 * (design spec §4.2/§6.2). Phases group modules for `CourseMap` (later
 * task) and carry no gating behavior of their own.
 */
export type PhaseId = "orient" | "build" | "navigate" | "synthesize";

export const PHASE_IDS: readonly PhaseId[] = [
  "orient",
  "build",
  "navigate",
  "synthesize",
];

export type ToolTarget = "syllabary" | "lab";

export interface ExampleSegment {
  jp: string;
  romaji: string;
  kind: "word" | "particle" | "ending";
}

export interface StaticExample {
  id: string;
  jp: string;
  romaji: string;
  segments?: ExampleSegment[];
}

export type LessonBlock =
  | { type: "rule"; copyId: string; gear: string }
  | { type: "examples"; copyId: string; exampleIds: string[] }
  | { type: "comparison"; copyId: string; exampleIds: string[] }
  | {
      type: "callout";
      copyId: string;
      tone: "note" | "warning" | "exception";
    }
  | {
      type: "guidedTool";
      copyId: string;
      target: ToolTarget;
      preset?: LabSelection;
    }
  | { type: "summary"; copyId: string };

/**
 * A lesson's four internal sections (design spec §4.3/§6.2), sharing the
 * stable `LessonSectionId` contract already used by routing/scroll (Task 2)
 * so a lesson-section anchor link and a lesson's own data never disagree on
 * section identity. Each section still holds the existing `LessonBlock`
 * union for now; Task 5 replaces the raw block list with final typed
 * `TransformComparisonData`/`GuidedTransformationData` contracts.
 */
export interface RuleSection {
  readonly id: Extract<LessonSectionId, "rule">;
  readonly blocks: readonly LessonBlock[];
}

export interface ComparisonSection {
  readonly id: Extract<LessonSectionId, "comparison">;
  readonly blocks: readonly LessonBlock[];
}

export interface ExplorationSection {
  readonly id: Extract<LessonSectionId, "explore">;
  readonly blocks: readonly LessonBlock[];
}

export interface RecapSection {
  readonly id: Extract<LessonSectionId, "recap">;
  readonly blocks: readonly LessonBlock[];
}

export type LessonSection =
  | RuleSection
  | ComparisonSection
  | ExplorationSection
  | RecapSection;

/** Exactly four sections, always in this order (design spec §6.2). */
export type LessonSections = readonly [
  RuleSection,
  ComparisonSection,
  ExplorationSection,
  RecapSection,
];

export interface Lesson {
  id: LessonId;
  moduleId: ModuleId;
  order: number;
  /** Copy-catalog key for the lesson's title/objective entry (§6.2). */
  titleCopyId: string;
  /** Copy-catalog keys describing what the lesson teaches (§6.2). */
  objectiveCopyIds: string[];
  estimatedMinutes: number;
  sections: LessonSections;
}

export interface CourseModule {
  id: ModuleId;
  phase: PhaseId;
  order: number;
  /** Earlier modules this one advisorily builds on; never enforced/blocking. */
  prerequisiteIds: ModuleId[];
  /** Copy-catalog keys describing what the module's lessons add up to. */
  outcomeCopyIds: string[];
  estimatedMinutes: number;
  iconId: SemanticIconId;
  lessons: Lesson[];
}
