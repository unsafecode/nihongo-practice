import type { LabSelection } from "../../content/types";
import { lessonPath } from "../../routing/routePaths";
import type { SyllabaryGroupId } from "../../syllabary/groups";
import type {
  AuthoredSelection,
  ComparisonSection,
  ContrastDimension,
  CourseConceptId,
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
  | { readonly kind: "tool"; readonly group?: SyllabaryGroupId }
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
    }
  | {
      readonly kind: "journey";
      readonly scenes: readonly JourneySceneSpec[];
    };

/**
 * One scene of a capstone journey: a genuine authored two-endpoint
 * transformation. Each scene is validated exactly like a single lesson's
 * authored exploration, so a journey never renders an unproven interaction.
 */
interface JourneySceneSpec {
  readonly id: string;
  readonly initial: AuthoredSelection;
  readonly target: AuthoredSelection;
  readonly changedGearIds: readonly string[];
}

interface LessonSpec {
  readonly id: string;
  readonly moduleId: string;
  readonly order: number;
  readonly minutes: number;
  readonly gear: string;
  /** Course concepts this lesson is the first to introduce (Task A). */
  readonly introduces: readonly CourseConceptId[];
  /** Course concepts this lesson assumes already taught (Task A). */
  readonly requires: readonly CourseConceptId[];
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
      data: {
        id,
        objectiveId,
        target: "syllabary",
        ...(exploration.group ? { group: exploration.group } : {}),
        returnTarget,
      },
    };
  }
  if (exploration.kind === "journey") {
    return {
      kind: "journey",
      data: {
        id,
        objectiveId,
        returnTarget,
        scenes: exploration.scenes.map((scene) => ({
          id: scene.id,
          captionCopyId: `${spec.id}-journey-${scene.id}`,
          transformation: {
            id: `${id}-${scene.id}`,
            objectiveId,
            initialSelection: scene.initial,
            targetSelection: scene.target,
            changedGearIds: scene.changedGearIds,
            returnTarget,
          },
        })),
      },
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
    introducedConceptIds: spec.introduces,
    requiredConceptIds: spec.requires,
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
        introduces: [],
        requires: [],
        comparison: {
          base: "vowel-a",
          changed: "syllable-ka",
          dimension: "sound",
          changedSegmentIds: ["0"],
          changedGearIds: ["か"],
        },
        exploration: { kind: "tool", group: "gojuon" },
      }),
      lesson({
        id: "sounds-special",
        moduleId: "sounds",
        order: 2,
        minutes: 8,
        gear: "っ",
        introduces: [],
        requires: [],
        comparison: {
          base: "kana-kite",
          changed: "kana-kitte",
          dimension: "sound",
          changedSegmentIds: ["1"],
          changedGearIds: ["っ"],
        },
        exploration: { kind: "tool", group: "special-notes" },
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
        gear: "です",
        introduces: ["copula-desu", "topic-wa"],
        requires: [],
        comparison: {
          base: "it-is-water",
          changed: "this-is-water",
          dimension: "topic",
          changedSegmentIds: ["0", "1"],
          changedGearIds: ["これ", "は"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "it-is-water", segmentIds: [] },
          target: { exampleId: "this-is-water", segmentIds: ["0", "1"] },
          changedGearIds: ["これ", "は"],
        },
      }),
      lesson({
        id: "sentence-omission",
        moduleId: "sentence-map",
        order: 2,
        minutes: 7,
        gear: "は",
        introduces: ["topic-omission"],
        requires: ["topic-wa", "copula-desu"],
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
        introduces: ["object-o", "polite-masu"],
        requires: [],
        comparison: {
          base: "eat-masu",
          changed: "order-ramen-eat",
          dimension: "particle",
          changedSegmentIds: ["0", "1"],
          changedGearIds: ["ラーメン", "を"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "eat-masu", segmentIds: [] },
          target: { exampleId: "order-ramen-eat", segmentIds: ["0", "1"] },
          changedGearIds: ["ラーメン", "を"],
        },
      }),
      lesson({
        id: "actions-masu",
        moduleId: "actions",
        order: 2,
        minutes: 8,
        gear: "ください",
        introduces: ["request-kudasai"],
        requires: ["object-o"],
        comparison: {
          base: "order-ramen-eat",
          changed: "order-ramen-please",
          dimension: "request",
          changedSegmentIds: ["2"],
          changedGearIds: ["ください"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "water", segmentIds: [] },
          target: { exampleId: "water-please", segmentIds: ["1", "2"] },
          changedGearIds: ["を", "ください"],
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
        introduces: ["past-mashita"],
        requires: ["object-o", "polite-masu"],
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
        introduces: ["negative-masen"],
        requires: ["object-o", "polite-masu"],
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
        introduces: ["particle-de"],
        requires: ["object-o", "polite-masu"],
        comparison: {
          base: "eat-ramen",
          changed: "restaurant-eat",
          dimension: "particle",
          changedSegmentIds: ["0", "1"],
          changedGearIds: ["レストラン", "で"],
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
        gear: "に・へ",
        introduces: ["destination-ni", "direction-e"],
        requires: ["polite-masu"],
        comparison: {
          base: "go-bare",
          changed: "go-station",
          dimension: "particle",
          changedSegmentIds: ["0", "1"],
          changedGearIds: ["えき", "に"],
        },
        // The guided step honestly contrasts destination に with directional へ
        // on the same sentence (えきにいきます ↔ えきへいきます): both mark where
        // you go, so the delta is exactly the particle pair {に, へ}.
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
        gear: "と・に",
        introduces: ["person-ni", "with-to"],
        requires: ["polite-masu"],
        comparison: {
          base: "meet-teacher",
          changed: "meet-with-friend",
          dimension: "particle",
          changedSegmentIds: ["0", "1"],
          changedGearIds: ["ともだち", "と"],
        },
        exploration: {
          kind: "authored",
          initial: { exampleId: "meet-teacher", segmentIds: [] },
          target: { exampleId: "meet-with-friend", segmentIds: ["0", "1"] },
          changedGearIds: ["ともだち", "と"],
        },
      }),
      lesson({
        id: "people-desire",
        moduleId: "people",
        order: 2,
        minutes: 8,
        gear: "たい",
        introduces: ["desire-tai", "volitional-mashou", "offer-mashouka"],
        requires: ["object-o", "polite-masu"],
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
        introduces: ["question-ka"],
        requires: ["copula-desu", "topic-wa"],
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
        introduces: ["subject-ga", "existence-arimasu", "existence-imasu"],
        requires: [],
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
          changedGearIds: ["トイレ", "あり", "せんせい", "い"],
        },
      }),
      // Task 6 corrective redesign: destination-vs-direction (に/へ) now lives
      // in Module 5 (places-movement). This third Module 7 lesson consolidates
      // the module's own question + existence grammar already introduced above
      // — choosing whether a thing or a person exists and asking about it —
      // introducing no new concept and never claiming direction or an
      // affirmative movement drill.
      lesson({
        id: "traps-particles",
        moduleId: "questions-existence",
        order: 3,
        minutes: 9,
        gear: "ありますか・いますか",
        introduces: [],
        requires: ["question-ka", "existence-arimasu", "existence-imasu"],
        comparison: {
          base: "restroom-exists",
          changed: "restroom-exists-q",
          dimension: "question",
          changedSegmentIds: ["4"],
          changedGearIds: ["か"],
        },
        // Both endpoints are yes/no existence questions; the delta swaps the
        // thing-that-exists (トイレ + あり) for the person-that-exists
        // (せんせい + い), consolidating あります vs います under か.
        exploration: {
          kind: "authored",
          initial: { exampleId: "restroom-exists-q", segmentIds: ["0", "2"] },
          target: { exampleId: "teacher-exists-q", segmentIds: ["0", "2"] },
          changedGearIds: ["トイレ", "あり", "せんせい", "い"],
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
      // Sole capstone lesson (Task 3 §4). Task 6 makes this a genuine "day in
      // travel" synthesis. The comparison recombines several prior families in
      // one natural desire sentence — time (あした), companion + と, place +
      // で, and the desire ending たいです — while the guided step is a
      // multi-scene journey that replays the day (order/request, move to a
      // place, invite, ask whether something exists). It teaches no new grammar
      // (introduces: []), so its objective falls back to the families it
      // requires below.
      lesson({
        id: "traps-verbs",
        moduleId: "capstone",
        order: 1,
        minutes: 10,
        gear: "たいです",
        introduces: [],
        requires: [
          "object-o",
          "polite-masu",
          "particle-de",
          "destination-ni",
          "with-to",
          "request-kudasai",
          "desire-tai",
          "volitional-mashou",
          "question-ka",
          "existence-arimasu",
          "existence-imasu",
        ],
        comparison: {
          base: "eat-ramen",
          changed: "travel-day",
          dimension: "word-order",
          changedSegmentIds: ["0", "1", "2", "3", "4", "8"],
          changedGearIds: ["あした", "ともだち", "と", "レストラン", "で", "たいです"],
        },
        exploration: {
          kind: "journey",
          scenes: [
            // Order / request at the restaurant: ラーメンをたべます → ラーメンをください
            {
              id: "order",
              initial: { exampleId: "order-ramen-eat", segmentIds: ["2", "3"] },
              target: { exampleId: "order-ramen-please", segmentIds: ["2"] },
              changedGearIds: ["たべ", "ます", "ください"],
            },
            // Move to a place: いきます → えきにいきます
            {
              id: "move",
              initial: { exampleId: "go-bare", segmentIds: [] },
              target: { exampleId: "go-station", segmentIds: ["0", "1"] },
              changedGearIds: ["えき", "に"],
            },
            // Invite a companion: えきにいきます → えきにいきましょう
            {
              id: "invite",
              initial: { exampleId: "go-station", segmentIds: ["3"] },
              target: { exampleId: "lets-go", segmentIds: ["3"] },
              changedGearIds: ["ます", "ましょう"],
            },
            // Ask whether something exists: トイレがあります → トイレがありますか
            {
              id: "ask-exists",
              initial: { exampleId: "restroom-exists", segmentIds: [] },
              target: { exampleId: "restroom-exists-q", segmentIds: ["4"] },
              changedGearIds: ["か"],
            },
          ],
        },
      }),
    ],
  }),
];
