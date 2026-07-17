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
    contentFormattingError: "This Japanese example could not be displayed.",
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
    unresolvable: (n: number) =>
      n === 1
        ? "1 authored review item cannot currently be shown because its exercise is no longer available."
        : `${n} authored review items cannot currently be shown because their exercises are no longer available.`,
    unavailable:
      "Your browser is not saving progress in this session, so this list will reset when you close the app.",
  },
  spokenAttempt: {
    heading: "Try saying it (optional)",
    intro:
      "This step is optional. Listen to the model and say the sentence aloud. Every lesson works fully without it.",
    targetLabel: "Sentence to say",
    meaningLabel: "Meaning",
    listen: "Play the model",
    playing: "Playing…",
    tryButton: "Try speaking",
    consentTitle: "Before you use the microphone",
    consentBody:
      "Speaking is optional. The app stores no audio and does not save the recognized text. Your browser, operating system, or its speech voice may process the audio to turn it into text. If you do not allow the microphone, every other exercise still works.",
    consentAcknowledge: "I understand, continue",
    consentDismiss: "Not now",
    micStart: "Speak now",
    micStop: "Stop",
    tryAgain: "Try again",
    statusRegionLabel: "Spoken attempt status",
    statusListening: "Listening…",
    statusProcessing: "Checking what your browser heard…",
    resultMatched: "Your browser recognized the sentence.",
    resultClose: "Your browser recognized almost all of the sentence.",
    resultRetry: "Your browser did not recognize the sentence. Try again.",
    errorUnsupported:
      "This browser cannot turn speech into text. You can still play the model and repeat it aloud.",
    errorDenied:
      "The microphone is blocked. You can still play the model and repeat it aloud.",
    errorNoSpeech:
      "Your browser did not hear anything. Try again, or play the model and repeat it aloud.",
    errorAborted: "The recording stopped.",
    errorNetwork:
      "Turning speech into text needs a connection right now and the service is not reachable. You can still play the model and repeat it aloud.",
    errorService:
      "Turning speech into text is not available right now. You can still play the model and repeat it aloud.",
    repeatTitle: "Listen and repeat",
    repeatBody: "Play the model and say the sentence aloud whenever you like.",
    heardLabel: "Your browser heard:",
    segmentsLabel: "Word by word",
    segmentMatched: "recognized",
    segmentMissing: "not recognized",
    criticalLabel: "key word",
    segmentUnavailable: "Segment unavailable",
  },
  foundation: {
    matrixTitle: "Sentence matrix",
    matrixIntro:
      "See how the same pattern works across people and settings. Reveal the rest whenever you like.",
    showAll: "Show all examples",
    showFewer: "Show fewer examples",
    speakerLabel: "Speaker",
    contextLabel: "Setting",
    omittedSubject: "Subject left unsaid",
    guidedTitle: "Guided construction",
    initialLabel: "Start from",
    targetLabel: "Build toward",
    activeAxesLabel: "What changes",
    roundOneTitle: "Practice round 1",
    roundOneIntro: "Recognize and build the patterns you just saw.",
    roundTwoTitle: "Practice round 2",
    roundTwoIntro:
      "Put the pieces together in new combinations you have not practiced yet.",
    transferLabel: "New combination",
    unavailableTitle: "This lesson could not be prepared",
    unavailableBody:
      "Some of this lesson's content could not be built right now. Nothing was shown so you never practice against a broken example.",
  },
  progressMigration: {
    noticeTitle: "Your course progress was rebuilt",
    noticeBody:
      "The course structure changed. Any lesson visit that safely matches the new structure is still marked as visited. Any visit without a safe match in the new structure is kept only as recovery data, not shown as visited. Practice attempts, review items, and checkpoint results tied to redesigned exercises may need to be repeated.",
    acknowledge: "Got it",
    helpTitle: "About the course rebuild",
    helpBody:
      "An earlier version of this course tracked progress differently. When the structure changed, any lesson visit that safely matches the new structure carries over automatically. Practice attempts, saved review items, and checkpoint results tied to exercises that were redesigned may need to be completed again, since they no longer match the new exercises exactly. Any older visit without a safe match in the new structure is retained as recovery data rather than shown as an equivalent visited lesson.",
  },
} satisfies Pick<CourseCopy, "home" | "lesson" | "practice" | "exercises" | "review" | "spokenAttempt" | "foundation" | "progressMigration">;

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
