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

export interface ExampleSegment {
  /**
   * Stable within-example segment id (auto-assigned as the segment's index
   * string by `segmentedExample`). A comparison's `changedSegmentIds` and an
   * authored exploration's `segmentIds` reference these, so the renderer can
   * mark exactly the declared delta and nothing else (design spec §6.3).
   */
  id?: string;
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

/**
 * The locale-independent grammatical (or, for kana minimal pairs, phonetic)
 * axis a comparison contrasts along. Spec §6.3 enumerates nine grammatical
 * dimensions; `"sound"` additionally covers the two kana lessons whose real
 * contrast is a sound/orthography minimal pair (あ→か, きて→きって) with no
 * honest grammatical label. The visible name is localized separately; this
 * union stays locale-independent.
 */
export type ContrastDimension =
  | "particle"
  | "ending"
  | "time"
  | "polarity"
  | "topic"
  | "request"
  | "question"
  | "existence"
  | "word-order"
  | "sound";

/**
 * One real before/after contrast for a lesson's comparison section (§6.3).
 * `changedSegmentIds` name segments of the *changed* example that were
 * genuinely introduced relative to the base; `changedGearIds` are the
 * trimmed Japanese glyphs those segments carry. The renderer marks only
 * these; `validateComparison` proves the declaration is honest.
 */
export interface TransformComparisonData {
  readonly id: string;
  readonly baseExampleId: string;
  readonly changedExampleId: string;
  readonly contrastDimension: ContrastDimension;
  readonly changedGearIds: readonly string[];
  readonly changedSegmentIds: readonly string[];
}

/**
 * Where a guided external-tool link returns to (Task 7 wires the actual
 * round-trip). Always this lesson's own explore section anchor; validated
 * through the shared pure `createRouteTarget` helper so a return target and
 * the route contract can never disagree.
 */
export interface RouteReturnTarget {
  readonly pathname: string;
  readonly sectionId: LessonSectionId;
}

/**
 * A guided endpoint expressed as an authored static example plus the subset
 * of its segments treated as "selected". Used for lessons whose objective
 * the Lab engine cannot model (e.g. object-required scenarios, dictionary
 * form, pure word-order). Discriminated from `LabSelection` structurally by
 * the presence of `exampleId`.
 */
export interface AuthoredSelection {
  readonly exampleId: string;
  readonly segmentIds: readonly string[];
}

/**
 * A guided transformation: two endpoints (each either a live `LabSelection`
 * driving the existing Japanese engine, or an `AuthoredSelection`) plus the
 * changed gear glyphs between them. `validateExploration` proves the changed
 * gears exactly match the endpoint difference and that the endpoints differ.
 */
export interface GuidedTransformationData {
  readonly id: string;
  readonly objectiveId: string;
  readonly initialSelection: LabSelection | AuthoredSelection;
  readonly targetSelection: LabSelection | AuthoredSelection;
  readonly changedGearIds: readonly string[];
  readonly returnTarget: RouteReturnTarget;
}

/**
 * An honest guided-tool exploration for lessons that link out to the
 * Syllabary instead of showing an in-engine transformation. It never claims
 * a transformation it cannot render; it only describes what the link opens.
 */
export interface GuidedToolExploration {
  readonly id: string;
  readonly objectiveId: string;
  readonly target: "syllabary";
  readonly returnTarget: RouteReturnTarget;
}

/** A lesson's explore-section content: either a transformation or a tool link. */
export type GuidedExploration =
  | { readonly kind: "transformation"; readonly data: GuidedTransformationData }
  | { readonly kind: "tool"; readonly data: GuidedToolExploration };

/**
 * A lesson's four internal sections (design spec §4.3/§6.2), sharing the
 * stable `LessonSectionId` contract already used by routing/scroll (Task 2)
 * so a lesson-section anchor link and a lesson's own data never disagree on
 * section identity. Each section now owns a single focused, final typed
 * content boundary instead of a loose block list: the comparison section owns
 * one real `TransformComparisonData`, the explore section owns one honest
 * `GuidedExploration`, the rule section names the one grammatical gear it
 * introduces, and the recap is summary-only (its prose lives in the copy
 * catalog keyed by `copyId`).
 */
export interface RuleSection {
  readonly id: Extract<LessonSectionId, "rule">;
  /** Copy-catalog key for this section's localized heading body/prose. */
  readonly copyId: string;
  /** The single locale-independent grammatical "gear" this lesson introduces. */
  readonly gear: string;
}

export interface ComparisonSection {
  readonly id: Extract<LessonSectionId, "comparison">;
  readonly copyId: string;
  readonly comparison: TransformComparisonData;
}

export interface ExplorationSection {
  readonly id: Extract<LessonSectionId, "explore">;
  readonly copyId: string;
  readonly exploration: GuidedExploration;
}

export interface RecapSection {
  readonly id: Extract<LessonSectionId, "recap">;
  readonly copyId: string;
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
