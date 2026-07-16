import type { CourseCopy } from "./types";
import { assembledCourseCopy } from "../catalog/assembleCourse";

const enUi = {
  home: {
    eyebrow: "Guided course",
    title: "Build Japanese one gear at a time.",
    lead: "Start with sounds, learn to see sentence roles, and reach the patterns most useful while traveling.",
    continue: "Continue",
    start: "Start",
    review: "Review",
    reset: "Reset progress",
    resetConfirm: "Do you really want to reset your course progress?",
    corruptProgress: "Course progress could not be read and was reset. Language and script settings were not changed.",
    dismiss: "Dismiss",
    invalidRoute: (path: string) => `“${path}” does not exist. You are back at the course.`,
    missingAnchorTitle: "Section not found",
    missingAnchorBody:
      "The linked lesson section could not be reached, so we kept you at the top of the lesson. You can scroll to find it.",
    lessonsProgress: (visited: number, total: number) =>
      `${visited} of ${total} lessons`,
    explorePractice: "Explore free practice",
    corruptProgressTitle: "Progress reset",
    invalidRouteTitle: "Page not found",
    persistenceWarningTitle: "Progress will not be saved",
    persistenceWarningBody:
      "Your browser does not allow saving course progress in this session. You can keep using the app, but visited lessons will not be remembered after you close it.",
  },
  lesson: {
    back: "All modules",
    modulePosition: (current: number, total: number) =>
      `Module ${current} of ${total}`,
    previous: "Previous lesson",
    next: "Next lesson",
    map: "Course map",
    listen: "Listen",
    playing: "Playing…",
    legacyModuleNoticeTitle: "Updated module link",
    legacyModuleNoticeBody:
      "This lesson now lives in a different module. You have been taken to its current place.",
    sections: {
      rule: "Rule",
      comparison: "Compare",
      explore: "Explore",
      recap: "Recap",
    },
    railLabel: "Lesson sections",
    sectionMenuLabel: "Jump to a section",
    comparison: {
      before: "Before",
      after: "After",
      changed: "What changes",
      dimensions: {
        particle: "Particle",
        ending: "Ending",
        time: "Time",
        polarity: "Polarity",
        topic: "Topic",
        request: "Request",
        question: "Question",
        existence: "Existence",
        "word-order": "Word order",
        sound: "Sound",
      },
    },
    guided: {
      initial: "Starting point",
      target: "Target",
      changed: "Gears that change",
      openSyllabary: "Open the Syllabary",
      journeyLabel: "A day of travel, scene by scene",
    },
  },
  practice: {
    eyebrow: "Free practice",
    title: "Explore without losing the thread.",
    lead: "Open the tools whenever you want; the guided course stays available.",
    labTitle: "Sentence Lab",
    labBody: "Combine time, roles, and verb form on the board.",
    syllabaryTitle: "Hiragana chart",
    syllabaryBody: "Hear the core signs and practice recognizing them.",
    open: "Open",
    guidedBoard: "Guided board",
    openGuidedLab: "Open the guided Sentence Lab",
    backToLesson: "Back to lesson",
    invalidPreset: "This guided link is invalid, so the Sentence Lab opened with its default values.",
    invalidPresetTitle: "Invalid guided link",
    invalidReturn: "This return link is invalid; use the navigation to go back to the lesson.",
    invalidReturnTitle: "Invalid return",
  },
  exercises: {
    heading: "Practice",
    intro: "Try these short exercises. They use only what this lesson has shown you.",
    position: (index: number, total: number) => `Exercise ${index} of ${total}`,
    submit: "Check",
    clear: "Clear",
    accepted: "Correct",
    retry: "Not yet — try again.",
    invalid: "Enter an answer before checking.",
    answerLabel: "Your answer, in Japanese",
    answerPlaceholder: "Type in Japanese…",
    sourceLabel: "Starting sentence",
    intentLabel: "Meaning",
    optionsLabel: "Choose one",
    bankLabel: "Available tiles",
    answerAreaLabel: "Your sentence",
    answerEmpty: "Add tiles to build your sentence.",
    addTile: (tile: string) => `Add ${tile}`,
    removeTile: (tile: string) => `Remove ${tile}`,
    moveTileBack: (tile: string) => `Move ${tile} earlier`,
    moveTileForward: (tile: string) => `Move ${tile} later`,
    blank: "____",
    statusLabel: "Lesson status",
    statusVisited: "Opened",
    statusPracticed: "Practiced",
    statusConsolidated: "Consolidated",
    unavailableTitle: "Exercises unavailable",
    unavailableBody:
      "This lesson's exercises could not be prepared. You can still read the lesson and use the rest of the course.",
  },
  review: {
    title: "To review",
    lead: "Exercises you missed come back here so you can practice them again.",
    empty: "Nothing to review yet. Missed exercises will appear here.",
    count: (n: number) => (n === 1 ? "1 to review" : `${n} to review`),
    fromLesson: (lessonTitle: string) => `From: ${lessonTitle}`,
    mistakes: (n: number) => (n === 1 ? "1 miss" : `${n} misses`),
    practice: "Review now",
    openLesson: "Open lesson",
    resolved: "Reviewed — removed from your list.",
    orphaned: (n: number) =>
      n === 1
        ? "1 saved review item is from an older version and is set aside."
        : `${n} saved review items are from an older version and are set aside.`,
    unavailable:
      "Your browser is not saving progress in this session, so this list will reset when you close the app.",
  },
} satisfies Pick<CourseCopy, "home" | "lesson" | "practice" | "exercises" | "review">;

const enCourseMap: CourseCopy["courseMap"] = {
  heading: "The course phases",
  phases: {
    orient: {
      title: "Orient",
      purpose: "Sounds and the basic sentence structure.",
    },
    build: {
      title: "Build",
      purpose: "Add actions, objects, and time references.",
    },
    navigate: {
      title: "Navigate",
      purpose: "Move between places, people, and everyday requests.",
    },
    synthesize: {
      title: "Synthesize",
      purpose: "Bring it all together in a closing lesson.",
    },
  },
  prerequisites: (moduleNames: string[]) =>
    moduleNames.length === 0
      ? "None — start here."
      : `Ideally after: ${moduleNames.join(", ")}.`,
  estimatedMinutes: (minutes: number) => `About ${minutes} min`,
  coverageMetadata: (lessons, verbs, vocabularyItems) =>
    `${lessons} lessons · ${verbs} verbs · ${vocabularyItems} words`,
  stateCurrent: "You are here",
  stateRecommended: "Recommended",
  stateVisited: "Visited",
  expandLabel: (moduleTitle: string) => `Expand lessons for ${moduleTitle}`,
  collapseLabel: (moduleTitle: string) => `Collapse lessons for ${moduleTitle}`,
  revisitTitle: "You've visited every lesson",
  revisitBody:
    "You can revisit any lesson whenever you like — there's no final finish line to reach.",
};


export const en = {
  ...enUi,
  courseMap: enCourseMap,
  // Projected from the shared curriculum copy catalog (spec §9.1); key set is
  // identical to the Italian catalog because both come from one source.
  ...assembledCourseCopy.en,
} satisfies CourseCopy;
