import type { CourseModule, Lesson, LessonBlock, LessonSections } from "./types";

/**
 * Groups a lesson's existing blocks into the four stable sections
 * (rule/comparison/explore/recap) by block type, deterministically and
 * without dropping any block. This is data migration only: Task 5 replaces
 * the raw block lists inside `comparison`/`explore` with final typed
 * `TransformComparisonData`/`GuidedTransformationData` contracts.
 */
function sectionize(blocks: LessonBlock[]): LessonSections {
  const rule: LessonBlock[] = [];
  const comparison: LessonBlock[] = [];
  const explore: LessonBlock[] = [];
  const recap: LessonBlock[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "rule":
        rule.push(block);
        break;
      case "examples":
      case "comparison":
        comparison.push(block);
        break;
      case "guidedTool":
        explore.push(block);
        break;
      case "callout":
      case "summary":
        recap.push(block);
        break;
    }
  }
  return [
    { id: "rule", blocks: rule },
    { id: "comparison", blocks: comparison },
    { id: "explore", blocks: explore },
    { id: "recap", blocks: recap },
  ];
}

function lesson(
  id: string,
  moduleId: string,
  order: number,
  estimatedMinutes: number,
  blocks: LessonBlock[],
): Lesson {
  return {
    id,
    moduleId,
    order,
    titleCopyId: id,
    objectiveCopyIds: [id],
    estimatedMinutes,
    sections: sectionize(blocks),
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

export const courseModules: CourseModule[] = [
  courseModule({
    id: "sounds",
    phase: "orient",
    order: 1,
    prerequisiteIds: [],
    iconId: "sounds",
    lessons: [
      lesson("sounds-core", "sounds", 1, 10, [
        { type: "rule", copyId: "sounds-core-rule", gear: "あ" },
        { type: "examples", copyId: "sounds-core-examples", exampleIds: ["vowels", "k-row"] },
        { type: "guidedTool", copyId: "sounds-core-tool", target: "syllabary" },
        { type: "summary", copyId: "sounds-core-summary" },
      ]),
      lesson("sounds-special", "sounds", 2, 8, [
        { type: "rule", copyId: "sounds-special-rule", gear: "っ" },
        { type: "comparison", copyId: "sounds-special-examples", exampleIds: ["small-tsu", "long-vowel"] },
        { type: "guidedTool", copyId: "sounds-special-tool", target: "syllabary" },
        { type: "summary", copyId: "sounds-special-summary" },
      ]),
    ],
  }),
  courseModule({
    id: "sentence-map",
    phase: "orient",
    order: 2,
    prerequisiteIds: ["sounds"],
    iconId: "sentence",
    lessons: [
      lesson("sentence-order", "sentence-map", 1, 9, [
        { type: "rule", copyId: "sentence-order-rule", gear: "→" },
        { type: "examples", copyId: "sentence-order-examples", exampleIds: ["sentence-order"] },
        { type: "comparison", copyId: "sentence-order-topic", exampleIds: ["topic-copula"] },
        { type: "guidedTool", copyId: "sentence-order-tool", target: "lab", preset: { scenarioId: "eat", form: "pres", timeId: "today", options: { object: "ramen", place: null } } },
        { type: "summary", copyId: "sentence-order-summary" },
      ]),
      lesson("sentence-omission", "sentence-map", 2, 7, [
        { type: "rule", copyId: "sentence-omission-rule", gear: "は" },
        { type: "comparison", copyId: "sentence-omission-examples", exampleIds: ["topic-copula", "omitted-subject", "this-water"] },
        { type: "summary", copyId: "sentence-omission-summary" },
      ]),
    ],
  }),
  courseModule({
    id: "actions",
    phase: "build",
    order: 3,
    prerequisiteIds: ["sentence-map"],
    iconId: "ordering",
    lessons: [
      lesson("actions-object", "actions", 1, 8, [
        { type: "rule", copyId: "actions-object-rule", gear: "を" },
        { type: "comparison", copyId: "actions-object-examples", exampleIds: ["eat-ramen", "drink-water"] },
        { type: "guidedTool", copyId: "actions-object-tool", target: "lab", preset: { scenarioId: "eat", form: "pres", timeId: "none", options: { object: "ramen", place: null } } },
        { type: "summary", copyId: "actions-object-summary" },
      ]),
      lesson("actions-masu", "actions", 2, 8, [
        { type: "rule", copyId: "actions-masu-rule", gear: "ます" },
        { type: "comparison", copyId: "actions-masu-examples", exampleIds: ["eat-sushi", "speak-english"] },
        { type: "guidedTool", copyId: "actions-masu-tool", target: "lab", preset: { scenarioId: "speak", form: "pres", timeId: "today", options: { language: "englishLanguage" } } },
        { type: "summary", copyId: "actions-masu-summary" },
      ]),
    ],
  }),
  courseModule({
    id: "time",
    phase: "build",
    order: 4,
    prerequisiteIds: ["actions"],
    iconId: "time",
    lessons: [
      lesson("time-past", "time", 1, 8, [
        { type: "rule", copyId: "time-past-rule", gear: "ました" },
        { type: "comparison", copyId: "time-past-examples", exampleIds: ["today-eat", "yesterday-ate", "tomorrow-eat"] },
        { type: "guidedTool", copyId: "time-past-tool", target: "lab", preset: { scenarioId: "eat", form: "past", timeId: "yesterday", options: { object: "ramen", place: null } } },
        { type: "summary", copyId: "time-past-summary" },
      ]),
      lesson("time-negative", "time", 2, 8, [
        { type: "rule", copyId: "time-negative-rule", gear: "ません" },
        { type: "comparison", copyId: "time-negative-examples", exampleIds: ["today-not-eat", "yesterday-not-eat"] },
        { type: "guidedTool", copyId: "time-negative-tool", target: "lab", preset: { scenarioId: "eat", form: "neg", timeId: "today", options: { object: "ramen", place: null } } },
        { type: "summary", copyId: "time-negative-summary" },
      ]),
    ],
  }),
  courseModule({
    id: "places",
    phase: "navigate",
    order: 5,
    prerequisiteIds: ["time"],
    iconId: "places",
    lessons: [
      lesson("places-action", "places", 1, 8, [
        { type: "rule", copyId: "places-action-rule", gear: "で" },
        { type: "comparison", copyId: "places-action-examples", exampleIds: ["restaurant-eat", "home-drink"] },
        { type: "guidedTool", copyId: "places-action-tool", target: "lab", preset: { scenarioId: "eat", form: "pres", timeId: "today", options: { object: "ramen", place: "restaurant" } } },
        { type: "summary", copyId: "places-action-summary" },
      ]),
      lesson("places-movement", "places", 2, 9, [
        { type: "rule", copyId: "places-movement-rule", gear: "に・で" },
        { type: "comparison", copyId: "places-movement-examples", exampleIds: ["go-station", "go-by-train", "board-train", "return-godan"] },
        { type: "guidedTool", copyId: "places-movement-tool", target: "lab", preset: { scenarioId: "go", form: "pres", timeId: "today", options: { destination: "station", transport: "train" } } },
        { type: "summary", copyId: "places-movement-summary" },
      ]),
    ],
  }),
  courseModule({
    id: "people",
    phase: "navigate",
    order: 6,
    prerequisiteIds: ["places"],
    iconId: "people",
    lessons: [
      lesson("people-particles", "people", 1, 8, [
        { type: "rule", copyId: "people-particles-rule", gear: "に・を" },
        { type: "comparison", copyId: "people-particles-examples", exampleIds: ["meet-friend", "wait-friend"] },
        { type: "guidedTool", copyId: "people-particles-tool", target: "lab", preset: { scenarioId: "meet", form: "pres", timeId: "today", options: { person: "friend" } } },
        { type: "summary", copyId: "people-particles-summary" },
      ]),
      lesson("people-desire", "people", 2, 8, [
        { type: "rule", copyId: "people-desire-rule", gear: "たい・ましょう" },
        { type: "comparison", copyId: "people-desire-examples", exampleIds: ["want-sushi", "lets-go"] },
        { type: "guidedTool", copyId: "people-desire-tool", target: "lab", preset: { scenarioId: "eat", form: "des", timeId: "today", options: { object: "sushi", place: null } } },
        { type: "summary", copyId: "people-desire-summary" },
      ]),
    ],
  }),
  courseModule({
    id: "questions-existence",
    phase: "navigate",
    order: 7,
    prerequisiteIds: ["people"],
    iconId: "questions",
    lessons: [
      lesson("travel-questions", "questions-existence", 1, 9, [
        { type: "rule", copyId: "travel-questions-rule", gear: "か・ください" },
        { type: "comparison", copyId: "travel-questions-examples", exampleIds: ["where-station", "where-hotel", "where-shop", "water-please", "menu-please"] },
        { type: "guidedTool", copyId: "travel-questions-tool", target: "lab", preset: { scenarioId: "go", form: "pres", timeId: "today", options: { destination: "station", transport: null } } },
        { type: "summary", copyId: "travel-questions-summary" },
      ]),
      lesson("travel-existence", "questions-existence", 2, 7, [
        { type: "rule", copyId: "travel-existence-rule", gear: "あります・います" },
        { type: "comparison", copyId: "travel-existence-examples", exampleIds: ["restroom-exists", "teacher-exists"] },
        { type: "summary", copyId: "travel-existence-summary" },
      ]),
      // Moved in from the former "traps" chapter (Task 3 §4/redistribution):
      // this lesson's questions-vs-existence particle contrasts belong with
      // this module's concept better than as a standalone "traps" chapter.
      lesson("traps-particles", "questions-existence", 3, 9, [
        { type: "rule", copyId: "traps-particles-rule", gear: "は・へ・を" },
        { type: "comparison", copyId: "traps-particles-examples", exampleIds: ["particle-wa", "particle-e", "eat-ramen"] },
        { type: "callout", copyId: "traps-omission-callout", tone: "note" },
        { type: "callout", copyId: "traps-existence-callout", tone: "exception" },
        { type: "callout", copyId: "traps-loanwords-callout", tone: "note" },
        { type: "summary", copyId: "traps-particles-summary" },
      ]),
    ],
  }),
  courseModule({
    id: "capstone",
    phase: "synthesize",
    order: 8,
    prerequisiteIds: ["questions-existence"],
    iconId: "capstone",
    lessons: [
      // Sole capstone placeholder/content shell (Task 3 §4): the full
      // day-in-travel synthesis rewrite with only common exceptions is
      // Task 6; this preserves the "traps-verbs" lesson id/content as-is.
      lesson("traps-verbs", "capstone", 1, 10, [
        { type: "rule", copyId: "traps-verbs-rule", gear: "かえり" },
        { type: "comparison", copyId: "traps-verbs-examples", exampleIds: ["return-godan", "tomorrow-return"] },
        { type: "guidedTool", copyId: "traps-verbs-tool", target: "lab", preset: { scenarioId: "return", form: "pres", timeId: "tomorrow", options: { destination: "home" } } },
        { type: "summary", copyId: "traps-verbs-summary" },
      ]),
    ],
  }),
];
