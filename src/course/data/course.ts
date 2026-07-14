import type { LabSelection } from "../../content/types";
import { lessonPath } from "../../routing/routePaths";
import type {
  AuthoredSelection,
  ComparisonSection,
  ContrastDimension,
  CourseModule,
  ExplorationSection,
  GuidedExploration,
  Lesson,
  LessonSections,
  RecapSection,
  RuleSection,
} from "./types";

/**
 * Task 5 lesson data (design spec §4.4, §6.2-§6.4). Every lesson is one
 * semantic page of exactly four sections (rule → comparison → explore →
 * recap). Instead of a loose block list, each lesson declares one real
 * before/after `TransformComparisonData` and one honest `GuidedExploration`
 * (a live Lab transformation, an authored two-endpoint transformation, or a
 * syllabary tool link). `validateComparison`/`validateExploration` (wired into
 * `validateCourse`) prove every declaration is honest: the comparison marks
 * only the segments genuinely introduced between its endpoints, and a
 * transformation's declared changed gears exactly equal its endpoint delta.
 * All Japanese here stays locale-independent; localized prose lives in the
 * copy catalog keyed by each section's `copyId`.
 */

interface ComparisonSpec {
  readonly base: string;
  readonly changed: string;
  readonly dimension: ContrastDimension;
  readonly changedSegmentIds: readonly string[];
  readonly changedGearIds: readonly string[];
}

type ExplorationSpec =
  | { readonly kind: "tool" }
  | {
      readonly kind: "authored";
      readonly initial: AuthoredSelection;
      readonly target: AuthoredSelection;
      readonly changedGearIds: readonly string[];
    }
  | {
      readonly kind: "lab";
      readonly initial: LabSelection;
      readonly target: LabSelection;
      readonly changedGearIds: readonly string[];
    };

interface LessonSpec {
  readonly id: string;
  readonly moduleId: string;
  readonly order: number;
  readonly minutes: number;
  readonly gear: string;
  readonly comparison: ComparisonSpec;
  readonly exploration: ExplorationSpec;
}

function buildExploration(spec: LessonSpec): GuidedExploration {
  const returnTarget = {
    pathname: lessonPath(spec.moduleId, spec.id),
    sectionId: "explore" as const,
  };
  const id = `exp-${spec.id}`;
  const objectiveId = spec.id;
  const exploration = spec.exploration;
  if (exploration.kind === "tool") {
    return {
      kind: "tool",
      data: { id, objectiveId, target: "syllabary", returnTarget },
    };
  }
  return {
    kind: "transformation",
    data: {
      id,
      objectiveId,
      initialSelection: exploration.initial,
      targetSelection: exploration.target,
      changedGearIds: exploration.changedGearIds,
      returnTarget,
    },
  };
}

function buildSections(spec: LessonSpec): LessonSections {
  const rule: RuleSection = {
    id: "rule",
    copyId: `${spec.id}-rule`,
    gear: spec.gear,
  };
  const comparison: ComparisonSection = {
    id: "comparison",
    copyId: `${spec.id}-comparison`,
    comparison: {
      id: `cmp-${spec.id}`,
      baseExampleId: spec.comparison.base,
      changedExampleId: spec.comparison.changed,
      contrastDimension: spec.comparison.dimension,
      changedGearIds: spec.comparison.changedGearIds,
      changedSegmentIds: spec.comparison.changedSegmentIds,
    },
  };
  const explore: ExplorationSection = {
    id: "explore",
    copyId: `${spec.id}-explore`,
    exploration: buildExploration(spec),
  };
  const recap: RecapSection = { id: "recap", copyId: `${spec.id}-recap` };
  return [rule, comparison, explore, recap];
}

function lesson(spec: LessonSpec): Lesson {
  return {
    id: spec.id,
    moduleId: spec.moduleId,
    order: spec.order,
    titleCopyId: spec.id,
    objectiveCopyIds: [spec.id],
    estimatedMinutes: spec.minutes,
    sections: buildSections(spec),
  };
}

function courseModule(
  base: Omit<CourseModule, "estimatedMinutes" | "outcomeCopyIds"> & {
    lessons: Lesson[];
  },
): CourseModule {
  return {
    ...base,
    outcomeCopyIds: [base.id],
    estimatedMinutes: base.lessons.reduce(
      (sum, item) => sum + item.estimatedMinutes,
      0,
    ),
  };
}

const eat = (
  form: LabSelection["form"],
  timeId: LabSelection["timeId"],
  options: LabSelection["options"],
): LabSelection => ({ scenarioId: "eat", form, timeId, options });

const go = (
  form: LabSelection["form"],
  timeId: LabSelection["timeId"],
  options: LabSelection["options"],
): LabSelection => ({ scenarioId: "go", form, timeId, options });

export const courseModules: CourseModule[] = [
  courseModule({
    id: "sounds",
    phase: "orient",
    order: 1,
    prerequisiteIds: [],
    iconId: "sounds",
    lessons: [
      lesson({
        id: "sounds-core",
        moduleId: "sounds",
        order: 1,
        minutes: 10,
        gear: "あ",
        comparison: {
          base: "vowel-a",
          changed: "syllable-ka",
          dimension: "sound",
          changedSegmentIds: ["0"],
          changedGearIds: ["か"],
        },
        exploration: { kind: "tool" },
      }),
      lesson({
        id: "sounds-special",
        moduleId: "sounds",
        order: 2,
        minutes: 8,
        gear: "っ",
        comparison: {
          base: "kana-kite",
          changed: "kana-kitte",
          dimension: "sound",
          changedSegmentIds: ["1"],
          changedGearIds: ["っ"],
        },
        exploration: { kind: "tool" },
      }),
    ],
  }),
  courseModule({
    id: "sentence-map",
    phase: "orient",
    order: 2,
    prerequisiteIds: ["sounds"],
    iconId: "sentence",
    lessons: [
      lesson({
        id: "sentence-order",
        moduleId: "sentence-map",
        order: 1,
        minutes: 9,
        gear: "→",
        comparison: {
          base: "eat-ramen",
          changed: "sentence-order",
          dimension: "word-order",
          changedSegmentIds: ["0"],
          changedGearIds: ["きょう"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "eat-ramen", segmentIds: [] },
          target: { exampleId: "sentence-order", segmentIds: ["0"] },
          changedGearIds: ["きょう"],
        },
      }),
      lesson({
        id: "sentence-omission",
        moduleId: "sentence-map",
        order: 2,
        minutes: 7,
        gear: "は",
        comparison: {
          base: "omitted-subject",
          changed: "topic-copula",
          dimension: "topic",
          changedSegmentIds: ["0", "1"],
          changedGearIds: ["わたし", "は"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "topic-copula", segmentIds: ["0", "1"] },
          target: { exampleId: "omitted-subject", segmentIds: [] },
          changedGearIds: ["わたし", "は"],
        },
      }),
    ],
  }),
  courseModule({
    id: "actions",
    phase: "build",
    order: 3,
    prerequisiteIds: ["sentence-map"],
    iconId: "ordering",
    lessons: [
      lesson({
        id: "actions-object",
        moduleId: "actions",
        order: 1,
        minutes: 8,
        gear: "を",
        comparison: {
          base: "eat-masu",
          changed: "eat-ramen",
          dimension: "particle",
          changedSegmentIds: ["0", "1"],
          changedGearIds: ["らーめん", "を"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "eat-masu", segmentIds: [] },
          target: { exampleId: "eat-ramen", segmentIds: ["0", "1"] },
          changedGearIds: ["らーめん", "を"],
        },
      }),
      lesson({
        id: "actions-masu",
        moduleId: "actions",
        order: 2,
        minutes: 8,
        gear: "ます",
        comparison: {
          base: "eat-dict",
          changed: "eat-masu",
          dimension: "ending",
          changedSegmentIds: ["1"],
          changedGearIds: ["ます"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "eat-dict", segmentIds: ["1"] },
          target: { exampleId: "eat-masu", segmentIds: ["1"] },
          changedGearIds: ["る", "ます"],
        },
      }),
    ],
  }),
  courseModule({
    id: "time",
    phase: "build",
    order: 4,
    prerequisiteIds: ["actions"],
    iconId: "time",
    lessons: [
      lesson({
        id: "time-past",
        moduleId: "time",
        order: 1,
        minutes: 8,
        gear: "ました",
        comparison: {
          base: "today-eat",
          changed: "today-ate",
          dimension: "time",
          changedSegmentIds: ["4"],
          changedGearIds: ["ました"],
        },
        exploration: {
          kind: "lab",
          initial: eat("pres", "today", { object: "ramen", place: null }),
          target: eat("past", "today", { object: "ramen", place: null }),
          changedGearIds: ["ます", "ました"],
        },
      }),
      lesson({
        id: "time-negative",
        moduleId: "time",
        order: 2,
        minutes: 8,
        gear: "ません",
        comparison: {
          base: "today-eat",
          changed: "today-not-eat",
          dimension: "polarity",
          changedSegmentIds: ["4"],
          changedGearIds: ["ません"],
        },
        exploration: {
          kind: "lab",
          initial: eat("pres", "today", { object: "ramen", place: null }),
          target: eat("neg", "today", { object: "ramen", place: null }),
          changedGearIds: ["ます", "ません"],
        },
      }),
    ],
  }),
  courseModule({
    id: "places",
    phase: "navigate",
    order: 5,
    prerequisiteIds: ["time"],
    iconId: "places",
    lessons: [
      lesson({
        id: "places-action",
        moduleId: "places",
        order: 1,
        minutes: 8,
        gear: "で",
        comparison: {
          base: "eat-ramen",
          changed: "restaurant-eat",
          dimension: "particle",
          changedSegmentIds: ["0", "1"],
          changedGearIds: ["れすとらん", "で"],
        },
        exploration: {
          kind: "lab",
          initial: eat("pres", "today", { object: "ramen", place: null }),
          target: eat("pres", "today", { object: "ramen", place: "restaurant" }),
          changedGearIds: ["で"],
        },
      }),
      lesson({
        id: "places-movement",
        moduleId: "places",
        order: 2,
        minutes: 9,
        gear: "に・で",
        comparison: {
          base: "go-station",
          changed: "go-by-train",
          dimension: "particle",
          changedSegmentIds: ["0", "1"],
          changedGearIds: ["でんしゃ", "で"],
        },
        exploration: {
          kind: "lab",
          initial: go("pres", "today", { destination: "station", transport: null }),
          target: go("pres", "today", { destination: "station", transport: "train" }),
          changedGearIds: ["で"],
        },
      }),
    ],
  }),
  courseModule({
    id: "people",
    phase: "navigate",
    order: 6,
    prerequisiteIds: ["places"],
    iconId: "people",
    lessons: [
      lesson({
        id: "people-particles",
        moduleId: "people",
        order: 1,
        minutes: 8,
        gear: "に・を",
        comparison: {
          base: "wait-friend",
          changed: "meet-friend",
          dimension: "particle",
          changedSegmentIds: ["1", "2"],
          changedGearIds: ["に", "あい"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "wait-friend", segmentIds: ["1", "2"] },
          target: { exampleId: "meet-friend", segmentIds: ["1", "2"] },
          changedGearIds: ["を", "まち", "に", "あい"],
        },
      }),
      lesson({
        id: "people-desire",
        moduleId: "people",
        order: 2,
        minutes: 8,
        gear: "たい",
        comparison: {
          base: "eat-sushi",
          changed: "want-sushi",
          dimension: "ending",
          changedSegmentIds: ["3"],
          changedGearIds: ["たいです"],
        },
        exploration: {
          kind: "lab",
          initial: eat("pres", "today", { object: "sushi", place: null }),
          target: eat("des", "today", { object: "sushi", place: null }),
          changedGearIds: ["ます", "たいです"],
        },
      }),
    ],
  }),
  courseModule({
    id: "questions-existence",
    phase: "navigate",
    order: 7,
    prerequisiteIds: ["people"],
    iconId: "questions",
    lessons: [
      lesson({
        id: "travel-questions",
        moduleId: "questions-existence",
        order: 1,
        minutes: 9,
        gear: "か",
        comparison: {
          base: "station-copula",
          changed: "where-station",
          dimension: "question",
          changedSegmentIds: ["4"],
          changedGearIds: ["か"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "station-copula", segmentIds: [] },
          target: { exampleId: "where-station", segmentIds: ["4"] },
          changedGearIds: ["か"],
        },
      }),
      lesson({
        id: "travel-existence",
        moduleId: "questions-existence",
        order: 2,
        minutes: 7,
        gear: "あります・います",
        comparison: {
          base: "restroom-exists",
          changed: "teacher-exists",
          dimension: "existence",
          changedSegmentIds: ["0", "2"],
          changedGearIds: ["せんせい", "い"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "restroom-exists", segmentIds: ["0", "2"] },
          target: { exampleId: "teacher-exists", segmentIds: ["0", "2"] },
          changedGearIds: ["といれ", "あり", "せんせい", "い"],
        },
      }),
      // Moved in from the former "traps" chapter (Task 3 §4/redistribution):
      // the destination-vs-direction particle contrast (に vs へ) fits this
      // module's navigation concept better than a standalone "traps" chapter.
      lesson({
        id: "traps-particles",
        moduleId: "questions-existence",
        order: 3,
        minutes: 9,
        gear: "へ",
        comparison: {
          base: "go-station",
          changed: "particle-e",
          dimension: "particle",
          changedSegmentIds: ["1"],
          changedGearIds: ["へ"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "go-station", segmentIds: ["1"] },
          target: { exampleId: "particle-e", segmentIds: ["1"] },
          changedGearIds: ["に", "へ"],
        },
      }),
    ],
  }),
  courseModule({
    id: "capstone",
    phase: "synthesize",
    order: 8,
    prerequisiteIds: ["questions-existence"],
    iconId: "capstone",
    lessons: [
      // Sole capstone lesson (Task 3 §4). The full day-in-travel synthesis
      // rewrite is Task 6; Task 5 preserves the "traps-verbs" lesson id and
      // gives it a genuine before/after (adding a time word to the かえります
      // sentence) plus a matching authored exploration.
      lesson({
        id: "traps-verbs",
        moduleId: "capstone",
        order: 1,
        minutes: 10,
        gear: "かえり",
        comparison: {
          base: "return-godan",
          changed: "tomorrow-return",
          dimension: "time",
          changedSegmentIds: ["0"],
          changedGearIds: ["あした"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "return-godan", segmentIds: [] },
          target: { exampleId: "tomorrow-return", segmentIds: ["0"] },
          changedGearIds: ["あした"],
        },
      }),
    ],
  }),
];
