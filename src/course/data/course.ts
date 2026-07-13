import type { Chapter } from "./types";

export const chapters: Chapter[] = [
  {
    id: "sounds", order: 1, emoji: "あ", locked: false,
    lessons: [
      {
        id: "sounds-core", chapterId: "sounds", order: 1,
        blocks: [
          { type: "rule", copyId: "sounds-core-rule", gear: "あ" },
          { type: "examples", copyId: "sounds-core-examples", exampleIds: ["vowels", "k-row"] },
          { type: "guidedTool", copyId: "sounds-core-tool", target: "syllabary" },
          { type: "summary", copyId: "sounds-core-summary" },
        ],
      },
      {
        id: "sounds-special", chapterId: "sounds", order: 2,
        blocks: [
          { type: "rule", copyId: "sounds-special-rule", gear: "っ" },
          { type: "comparison", copyId: "sounds-special-examples", exampleIds: ["small-tsu", "long-vowel"] },
          { type: "guidedTool", copyId: "sounds-special-tool", target: "syllabary" },
          { type: "summary", copyId: "sounds-special-summary" },
        ],
      },
    ],
  },
  {
    id: "sentence-map", order: 2, emoji: "🗺️", locked: false,
    lessons: [
      {
        id: "sentence-order", chapterId: "sentence-map", order: 1,
        blocks: [
          { type: "rule", copyId: "sentence-order-rule", gear: "→" },
          { type: "examples", copyId: "sentence-order-examples", exampleIds: ["sentence-order"] },
          { type: "comparison", copyId: "sentence-order-topic", exampleIds: ["topic-copula"] },
          { type: "guidedTool", copyId: "sentence-order-tool", target: "lab", preset: { scenarioId: "eat", form: "pres", timeId: "today", options: { object: "ramen", place: null } } },
          { type: "summary", copyId: "sentence-order-summary" },
        ],
      },
      {
        id: "sentence-omission", chapterId: "sentence-map", order: 2,
        blocks: [
          { type: "rule", copyId: "sentence-omission-rule", gear: "は" },
          { type: "comparison", copyId: "sentence-omission-examples", exampleIds: ["topic-copula", "omitted-subject", "this-water"] },
          { type: "summary", copyId: "sentence-omission-summary" },
        ],
      },
    ],
  },
  {
    id: "actions", order: 3, emoji: "⚙️", locked: false,
    lessons: [
      {
        id: "actions-object", chapterId: "actions", order: 1,
        blocks: [
          { type: "rule", copyId: "actions-object-rule", gear: "を" },
          { type: "comparison", copyId: "actions-object-examples", exampleIds: ["eat-ramen", "drink-water"] },
          { type: "guidedTool", copyId: "actions-object-tool", target: "lab", preset: { scenarioId: "eat", form: "pres", timeId: "none", options: { object: "ramen", place: null } } },
          { type: "summary", copyId: "actions-object-summary" },
        ],
      },
      {
        id: "actions-masu", chapterId: "actions", order: 2,
        blocks: [
          { type: "rule", copyId: "actions-masu-rule", gear: "ます" },
          { type: "comparison", copyId: "actions-masu-examples", exampleIds: ["eat-sushi", "speak-english"] },
          { type: "guidedTool", copyId: "actions-masu-tool", target: "lab", preset: { scenarioId: "speak", form: "pres", timeId: "today", options: { language: "englishLanguage" } } },
          { type: "summary", copyId: "actions-masu-summary" },
        ],
      },
    ],
  },
  {
    id: "time", order: 4, emoji: "🕒", locked: false,
    lessons: [
      {
        id: "time-past", chapterId: "time", order: 1,
        blocks: [
          { type: "rule", copyId: "time-past-rule", gear: "ました" },
          { type: "comparison", copyId: "time-past-examples", exampleIds: ["today-eat", "yesterday-ate", "tomorrow-eat"] },
          { type: "guidedTool", copyId: "time-past-tool", target: "lab", preset: { scenarioId: "eat", form: "past", timeId: "yesterday", options: { object: "ramen", place: null } } },
          { type: "summary", copyId: "time-past-summary" },
        ],
      },
      {
        id: "time-negative", chapterId: "time", order: 2,
        blocks: [
          { type: "rule", copyId: "time-negative-rule", gear: "ません" },
          { type: "comparison", copyId: "time-negative-examples", exampleIds: ["today-not-eat", "yesterday-not-eat"] },
          { type: "guidedTool", copyId: "time-negative-tool", target: "lab", preset: { scenarioId: "eat", form: "neg", timeId: "today", options: { object: "ramen", place: null } } },
          { type: "summary", copyId: "time-negative-summary" },
        ],
      },
    ],
  },
  {
    id: "places", order: 5, emoji: "🚉", locked: false,
    lessons: [
      {
        id: "places-action", chapterId: "places", order: 1,
        blocks: [
          { type: "rule", copyId: "places-action-rule", gear: "で" },
          { type: "comparison", copyId: "places-action-examples", exampleIds: ["restaurant-eat", "home-drink"] },
          { type: "guidedTool", copyId: "places-action-tool", target: "lab", preset: { scenarioId: "eat", form: "pres", timeId: "today", options: { object: "ramen", place: "restaurant" } } },
          { type: "summary", copyId: "places-action-summary" },
        ],
      },
      {
        id: "places-movement", chapterId: "places", order: 2,
        blocks: [
          { type: "rule", copyId: "places-movement-rule", gear: "に・で" },
          { type: "comparison", copyId: "places-movement-examples", exampleIds: ["go-station", "go-by-train", "board-train", "return-godan"] },
          { type: "guidedTool", copyId: "places-movement-tool", target: "lab", preset: { scenarioId: "go", form: "pres", timeId: "today", options: { destination: "station", transport: "train" } } },
          { type: "summary", copyId: "places-movement-summary" },
        ],
      },
    ],
  },
  {
    id: "people", order: 6, emoji: "🤝", locked: false,
    lessons: [
      {
        id: "people-particles", chapterId: "people", order: 1,
        blocks: [
          { type: "rule", copyId: "people-particles-rule", gear: "に・を" },
          { type: "comparison", copyId: "people-particles-examples", exampleIds: ["meet-friend", "wait-friend"] },
          { type: "guidedTool", copyId: "people-particles-tool", target: "lab", preset: { scenarioId: "meet", form: "pres", timeId: "today", options: { person: "friend" } } },
          { type: "summary", copyId: "people-particles-summary" },
        ],
      },
      {
        id: "people-desire", chapterId: "people", order: 2,
        blocks: [
          { type: "rule", copyId: "people-desire-rule", gear: "たい・ましょう" },
          { type: "comparison", copyId: "people-desire-examples", exampleIds: ["want-sushi", "lets-go"] },
          { type: "guidedTool", copyId: "people-desire-tool", target: "lab", preset: { scenarioId: "eat", form: "des", timeId: "today", options: { object: "sushi", place: null } } },
          { type: "summary", copyId: "people-desire-summary" },
        ],
      },
    ],
  },
  {
    id: "travel-patterns", order: 7, emoji: "🧳", locked: false,
    lessons: [
      {
        id: "travel-questions", chapterId: "travel-patterns", order: 1,
        blocks: [
          { type: "rule", copyId: "travel-questions-rule", gear: "か・ください" },
          { type: "comparison", copyId: "travel-questions-examples", exampleIds: ["where-station", "where-hotel", "where-shop", "water-please", "menu-please"] },
          { type: "guidedTool", copyId: "travel-questions-tool", target: "lab", preset: { scenarioId: "go", form: "pres", timeId: "today", options: { destination: "station", transport: null } } },
          { type: "summary", copyId: "travel-questions-summary" },
        ],
      },
      {
        id: "travel-existence", chapterId: "travel-patterns", order: 2,
        blocks: [
          { type: "rule", copyId: "travel-existence-rule", gear: "あります・います" },
          { type: "comparison", copyId: "travel-existence-examples", exampleIds: ["restroom-exists", "teacher-exists"] },
          { type: "summary", copyId: "travel-existence-summary" },
        ],
      },
    ],
  },
  {
    id: "traps", order: 8, emoji: "💡", locked: false,
    lessons: [
      {
        id: "traps-particles", chapterId: "traps", order: 1,
        blocks: [
          { type: "rule", copyId: "traps-particles-rule", gear: "は・へ・を" },
          { type: "comparison", copyId: "traps-particles-examples", exampleIds: ["particle-wa", "particle-e", "eat-ramen"] },
          { type: "callout", copyId: "traps-omission-callout", tone: "note" },
          { type: "callout", copyId: "traps-existence-callout", tone: "exception" },
          { type: "callout", copyId: "traps-loanwords-callout", tone: "note" },
          { type: "summary", copyId: "traps-particles-summary" },
        ],
      },
      {
        id: "traps-verbs", chapterId: "traps", order: 2,
        blocks: [
          { type: "rule", copyId: "traps-verbs-rule", gear: "かえり" },
          { type: "comparison", copyId: "traps-verbs-examples", exampleIds: ["return-godan", "tomorrow-return"] },
          { type: "guidedTool", copyId: "traps-verbs-tool", target: "lab", preset: { scenarioId: "return", form: "pres", timeId: "tomorrow", options: { destination: "home" } } },
          { type: "summary", copyId: "traps-verbs-summary" },
        ],
      },
    ],
  },
];
