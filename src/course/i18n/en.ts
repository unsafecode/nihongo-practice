import type { CourseCopy } from "./types";
import { assembledCourseCopy } from "../catalog/assembleCourse";
import {
  a1RuntimeLessonCopy,
  a1RuntimeModuleCopy,
  a1RuntimeObjectiveCopy,
  a1RuntimeOutcomeCopy,
  a1RuntimePhoneticCopy,
} from "../a1/runtimeCopy";
import {
  a2RuntimeLessonCopy,
  a2RuntimeModuleCopy,
  a2RuntimeObjectiveCopy,
  a2RuntimeOutcomeCopy,
  a2RuntimeKanjiMeaningCopy,
} from "../a2/runtimeCopy";

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
    levelBadge: "A1, our alignment to JF/CEFR Can-do descriptors",
    courseShape: (moduleCount: number, lessonCount: number) =>
      `${moduleCount} modules, ${lessonCount} lessons`,
  },
  progressMutation: {
    title: "Progress was not updated",
    body: (lessonId: string) =>
      `We could not safely record progress for lesson “${lessonId}”. Please return to the course and try again.`,
    dismiss: "Dismiss",
  },
  canDoSummary: {
    heading: "What you can do so far",
    demonstratedCount: (demonstrated: number, total: number) =>
      `${demonstrated} of ${total} Can-do statements have accepted evidence`,
    tierNotStarted: "Not started",
    tierVisited: "Visited",
    tierPracticed: "Practiced",
    tierDemonstrated: "Demonstrated",
  },
  checkpoint: {
    heading: "A1 checkpoint",
    notMet:
      "Your checkpoint is met automatically once every scenario lesson is consolidated. There is no separate test to sit.",
    met: "Checkpoint met — every scenario lesson is consolidated.",
    evidenceLink: "See your Can-do evidence",
  },
  courseLevels: {
    selectorLabel: "Course level",
    recommendedMarker: "Recommended",
    base: "Base",
    a1: "A1",
    a2: "A2",
    baseHeading: "Base course",
    a1Heading: "A1 course",
    a2Heading: "A2 course",
    baseBadge: "Base, foundations for first-time learners",
    a2Badge: "A2, our alignment to JF/CEFR Can-do descriptors",
    baseAvailableHint:
      "Foundations for sound, kana, and first sentence patterns.",
    baseRecommendedHint:
      "Start here if you are new to the course and want foundations first.",
    a1AvailableHint:
      "A1 remains open and applies the foundations in everyday situations.",
    a1RecommendedHint:
      "A1 is recommended for learners ready to apply Base foundations in everyday situations.",
    a2AvailableHint:
      "A2 remains open and builds connected conversation.",
    a2RecommendedHint:
      "A2 remains open as a good next step after A1 and builds connected conversation.",
    a2CheckpointHeading: "A2 checkpoint",
    resetLevel: (levelLabel: string) => `Reset ${levelLabel} progress`,
    resetLevelConfirm: (levelLabel: string) =>
      `Do you really want to reset your ${levelLabel} course progress? Your other level's progress is kept.`,
  },
  kanji: {
    sectionHeading: "Kanji in this lesson",
    sectionIntro:
      "Each kanji is shown inside the word it belongs to. Recognize them there — the practice sentences stay in kana, and there is no writing to do.",
    assessedExplanation: (glyph: string) =>
      `You are being assessed on ${glyph}, so its reading is not shown here.`,
    revealShow: "Show the reading",
    revealHide: "Hide the reading",
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
    legacyLessonConsolidatedNoticeTitle: "This lesson moved here",
    legacyLessonConsolidatedNoticeBody:
      "The old sounds-5 lesson was merged into this one, which now covers its katakana content too.",
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
    recap: {
      canDoLabel: "Can-do",
      variationLabel: "What varied",
      vocabLabel: "Words in this lesson",
      nextRetrievalTitle: "Coming back for review",
      nextRetrievalBody:
        "Anything you did not get right here will reappear in your review queue so you can try it again.",
    },
  },
  a1Lesson: {
    sections: {
      rule: "Goal",
      vocabulary: "New words",
      grammar: "Grammar",
      comparison: "Examples",
      explore: "Practice",
      recap: "Recap",
    },
    overview: {
      canDoLabel: "Can-do",
      situationLabel: "Situation",
      prerequisitesLabel: "Builds on",
    },
    vocabulary: {
      newWordsHeading: "New words",
      reviewWordsHeading: "Known words to reuse",
      reviewBadge: "Review",
      reviewExceptionLabel: "Review note",
      showMeanings: "Show meanings",
      hideMeanings: "Hide meanings",
      meaningLabel: "Meaning",
      categoryLabel: "Category",
      categories: {
        pronoun: "Pronoun",
        person: "Person",
        noun: "Noun",
        verb: "Verb",
        adjective: "Adjective",
        "question-word": "Question word",
        time: "Time",
        expression: "Expression",
      },
      verbFormsLabel: "Verb forms",
      dictionaryLabel: "Dictionary form",
      politeLabel: "Polite form",
      classLabel: "Verb class",
      verbClasses: {
        godan: "Godan",
        ichidan: "Ichidan",
        irregular: "Irregular",
      },
    },
    learningNote: {
      kindLabel: "Note type",
      kinds: {
        grammar: "Grammar note",
        phonetic: "Sound note",
        synthesis: "Synthesis note",
      },
      meaningLabel: "Meaning",
      useLabel: "Use",
      constructionLabel: "Construction",
      typicalMistakeLabel: "Typical mistake",
      subjectOmissionLabel: "Subject omission",
      nearestContrastLabel: "Nearest contrast",
      patternLabel: "Pattern",
    },
    examples: {
      translationLabel: "Natural translation",
      glossesLabel: "Word by word",
      dialogueLabel: "Short dialogue",
      turnLabel: (position: number) => `Turn ${position}`,
      optionalPattern: "Explore the pattern",
    },
    practice: {
      functionLabel: "Practice function",
      functions: {
        "meaning-comprehension": "Understand the meaning",
        "form-discrimination": "Notice the form",
        "controlled-production": "Build the form",
        transformation: "Transform the pattern",
        "contextual-response": "Respond in context",
        "listening-speaking": "Listen and speak",
      },
    },
    audio: {
      play: "Play audio",
      playing: "Playing…",
      unavailable: "Japanese audio is unavailable in this browser.",
      failed: "Audio playback failed. Try again.",
      statusLabel: "Audio status",
    },
    recap: {
      meaningsAndFormsLabel: "Meanings and forms",
      retrievalCueLabel: "Retrieval cue",
      reviewExceptionLabel: "Review note",
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
    variedTask: "A different retrieval task for the same lesson focus.",
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
} satisfies Pick<CourseCopy, "home" | "progressMutation" | "canDoSummary" | "checkpoint" | "courseLevels" | "kanji" | "lesson" | "a1Lesson" | "practice" | "exercises" | "review" | "spokenAttempt" | "foundation" | "progressMigration">;

const enCourseMap: CourseCopy["courseMap"] = {
  heading: "The course",
  prerequisites: (moduleNames: string[]) =>
    moduleNames.length === 0
      ? "None — start here."
      : `Ideally after: ${moduleNames.join(", ")}.`,
  stateCurrent: "You are here",
  stateRecommended: "Recommended",
  stateVisited: "Visited",
  statePracticed: "Practiced",
  stateDemonstrated: "Demonstrated",
  expandLabel: (moduleTitle: string) => `Expand lessons for ${moduleTitle}`,
  collapseLabel: (moduleTitle: string) => `Collapse lessons for ${moduleTitle}`,
  revisitTitle: "You've visited every lesson",
  revisitBody:
    "You can revisit any lesson whenever you like — there's no final finish line to reach.",
};

const enCourseAreas: CourseCopy["courseAreas"] = {
  sounds: {
    title: "Sounds",
    description: "Learn sound and kana foundations.",
  },
  foundations: {
    title: "Foundations",
    description:
      "Build sentence structure, natural reference, polite verbs, particles, and basic time forms before scenario practice.",
  },
  situations: {
    title: "Everyday situations",
    description:
      "Apply foundations in conversations, routines, places, people, shopping, and needs.",
  },
  synthesis: {
    title: "Synthesis",
    description: "Combine known content in supported dialogues.",
  },
};


export const en = {
  ...enUi,
  courseMap: enCourseMap,
  courseAreas: enCourseAreas,
  // Module/lesson titles and Can-do objective/module-outcome copy are
  // resolved from the validated A1 release catalog's own copy ids (Phase 2
  // Task 6) — never from the legacy, disjoint curriculum catalog. `blocks`
  // and `examples`, however, are keyed by fine-grained ids (per-example
  // translations, `${legacyLessonId}-rule/-comparison/-explore/-recap`
  // section copy) that never collide with the A1 module/lesson/objective/
  // outcome namespace, and the shared example catalog (`data/examples.ts`)
  // is the same one the legacy `assembleCourse` pipeline produces this copy
  // from — so they're kept from the legacy course copy, still genuinely used
  // by the legacy `spokenAttemptModel`/`TransformComparison`/`GuidedToolLink`
  // consumers. `journeyScenes` has no shipped content in either pipeline.
  // A1 and A2 module/lesson/objective/outcome copy are merged into one map
  // per dictionary (Phase 3 Task 8). The two levels' module and lesson id
  // namespaces are disjoint (A2 ids are all `${a2Module}-${n}` prefixes A1
  // never uses), so the merge never collides; the i18n orphan/coverage checks
  // derive their known-id sets from both levels' `courseModulesByLevel`.
  modules: { ...a1RuntimeModuleCopy("en"), ...a2RuntimeModuleCopy("en") },
  lessons: { ...a1RuntimeLessonCopy("en"), ...a2RuntimeLessonCopy("en") },
  objectives: { ...a1RuntimeObjectiveCopy("en"), ...a2RuntimeObjectiveCopy("en") },
  outcomes: { ...a1RuntimeOutcomeCopy("en"), ...a2RuntimeOutcomeCopy("en") },
  blocks: assembledCourseCopy.en.blocks,
  examples: assembledCourseCopy.en.examples,
  journeyScenes: {} as CourseCopy["journeyScenes"],
  phonetics: a1RuntimePhoneticCopy("en"),
  kanjiMeanings: a2RuntimeKanjiMeaningCopy("en"),
} satisfies CourseCopy;
