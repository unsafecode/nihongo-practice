import type { LessonSectionId } from "../../routing/lessonSections";
import type { ContrastDimension, ModuleId, PhaseId } from "../data/types";

export interface BlockCopy {
  eyebrow?: string;
  title: string;
  body?: string;
  bullets?: string[];
  action?: string;
}

export interface ExampleCopy {
  translation: string;
  note?: string;
}

export interface ModuleCopy {
  title: string;
}

export interface LessonCopy {
  title: string;
}

/** A single curriculum phase's localized name and concise purpose (§4.2/§6.2). */
export interface PhaseCopy {
  title: string;
  purpose: string;
}

export interface CourseCopy {
  home: {
    eyebrow: string;
    title: string;
    lead: string;
    continue: string;
    start: string;
    review: string;
    reset: string;
    resetConfirm: string;
    corruptProgress: string;
    dismiss: string;
    invalidRoute: (path: string) => string;
    /** Notice shown when a valid lesson deep-link's section anchor is absent. */
    missingAnchorTitle: string;
    missingAnchorBody: string;
    lessonsProgress: (visited: number, total: number) => string;
    /** Secondary hero action linking to free practice. */
    explorePractice: string;
    /** Notice title paired with the existing `corruptProgress` body. */
    corruptProgressTitle: string;
    /** Notice title paired with the existing `invalidRoute` body. */
    invalidRouteTitle: string;
    /** Notice shown when `persistenceAvailable === false` for progress. */
    persistenceWarningTitle: string;
    persistenceWarningBody: string;
  };
  lesson: {
    back: string;
    modulePosition: (current: number, total: number) => string;
    previous: string;
    next: string;
    /** Footer action returning to the phase course map. */
    map: string;
    listen: string;
    playing: string;
    legacyModuleNoticeTitle: string;
    legacyModuleNoticeBody: string;
    /**
     * The four section landmark names (design spec §4.3). Used verbatim as the
     * lesson rail's step labels, the mobile context bar's section name, and
     * each `<section>`'s accessible label, so the rail and the page can never
     * disagree on section identity.
     */
    sections: Record<LessonSectionId, string>;
    /** Accessible name for the lesson rail / section navigation landmark. */
    railLabel: string;
    /** Accessible name for the mobile "jump to a section" control. */
    sectionMenuLabel: string;
    /** Shared content-formatting fallback when a Japanese example cannot render. */
    contentFormattingError: string;
    /** Before/after comparison labels and the delta-strip heading (§6.3). */
    comparison: {
      before: string;
      after: string;
      /** Delta-strip heading introducing the changed gear(s). */
      changed: string;
      /** Localized name for each contrast dimension named on the delta strip. */
      dimensions: Record<ContrastDimension, string>;
    };
    /** Guided exploration endpoint labels and the syllabary link (§6.4). */
    guided: {
      initial: string;
      target: string;
      changed: string;
      openSyllabary: string;
      /** Accessible name for the multi-scene capstone journey list (§6.6). */
      journeyLabel: string;
    };
  };
  practice: {
    eyebrow: string;
    title: string;
    lead: string;
    labTitle: string;
    labBody: string;
    syllabaryTitle: string;
    syllabaryBody: string;
    open: string;
    guidedBoard: string;
    openGuidedLab: string;
    backToLesson: string;
    invalidPreset: string;
    invalidPresetTitle: string;
    invalidReturn: string;
    invalidReturnTitle: string;
  };
  /**
   * Localized chrome for the deterministic in-lesson practice exercises (design
   * spec §10.1-§10.3, §14; Slice C plan Task 4). Instruction and intent strings
   * themselves live in the shared curriculum copy catalog and are resolved by
   * copy id — this section owns only the surrounding UI labels, feedback states,
   * and accessible names. Feedback is always conveyed by text (never colour
   * alone), and control names describe their action for keyboard/touch parity.
   */
  exercises: {
    heading: string;
    intro: string;
    /** Accessible name for each exercise card, e.g. "Exercise 1 of 4". */
    position: (index: number, total: number) => string;
    submit: string;
    clear: string;
    /** Result labels — text, never colour alone (spec §14). */
    accepted: string;
    retry: string;
    invalid: string;
    /** Text input chrome for the three typed kinds. */
    answerLabel: string;
    answerPlaceholder: string;
    /** Transformation source-sentence and construction intent labels. */
    sourceLabel: string;
    intentLabel: string;
    /** Choice control group label (paired with the resolved instruction). */
    optionsLabel: string;
    /** Tile-ordering regions and per-tile action names. */
    bankLabel: string;
    answerAreaLabel: string;
    answerEmpty: string;
    addTile: (tile: string) => string;
    removeTile: (tile: string) => string;
    moveTileBack: (tile: string) => string;
    moveTileForward: (tile: string) => string;
    /** In-sentence blank marker for completion/choice prompts. */
    blank: string;
    /** Truthful lesson interaction-evidence states (spec §11.1). */
    statusLabel: string;
    statusVisited: string;
    statusPracticed: string;
    statusConsolidated: string;
    /** Notice shown when a lesson's exercises cannot be generated (spec §16). */
    unavailableTitle: string;
    unavailableBody: string;
  };
  /**
   * Localized copy for the optional in-lesson spoken attempt (design spec §5.3,
   * §12.1-§12.3; Slice D plan Task 3). Nested after the practice exercises in
   * the explore section — never a new route anchor, never a lesson gate. Every
   * string is truthful: the copy states only whether the browser recognized the
   * target sentence (matched / close / retry) or which mapped recognition state
   * occurred. It makes NO pronunciation, accuracy, accent, fluency, phoneme,
   * score, grade, or percentage claim in either locale, and never duplicates the
   * Japanese target (that lives once in the shared example catalog). Consent is
   * an app notice held in provider session memory only; its disclosure states
   * that speaking is optional, that the app stores no audio, that the recognized
   * text is not saved, that the browser/OS/voice may process the audio, and that
   * denying the microphone leaves every other exercise usable.
   */
  spokenAttempt: {
    heading: string;
    /** Intro stressing the step is optional and score-free. */
    intro: string;
    /** Region label above the visible target sentence. */
    targetLabel: string;
    /** Label paired with the localized meaning of the target. */
    meaningLabel: string;
    /** Model playback control and its in-progress label. */
    listen: string;
    playing: string;
    /** Pre-consent control that opens the privacy disclosure (never the mic). */
    tryButton: string;
    /** Consent notice title, body, and its two controls. */
    consentTitle: string;
    consentBody: string;
    /** Acknowledge only records consent — it MUST NOT start the recognizer. */
    consentAcknowledge: string;
    consentDismiss: string;
    /** The separate microphone controls shown only after consent. */
    micStart: string;
    micStop: string;
    tryAgain: string;
    /** Accessible name for the recognition status region. */
    statusRegionLabel: string;
    /** Active-attempt status text (text + shape, never colour alone). */
    statusListening: string;
    statusProcessing: string;
    /** The three honest recognition outcomes. */
    resultMatched: string;
    resultClose: string;
    resultRetry: string;
    /** The mapped recognition failures, each distinct and localized. */
    errorUnsupported: string;
    errorDenied: string;
    errorNoSpeech: string;
    errorAborted: string;
    errorNetwork: string;
    errorService: string;
    /** The always-available listen-and-repeat fallback (no scoring). */
    repeatTitle: string;
    repeatBody: string;
    /** Label preceding the recognized transcript (shown only in-state). */
    heardLabel: string;
    /** Per-segment record labels — matched/unmatched and the critical marker. */
    segmentsLabel: string;
    segmentMatched: string;
    segmentMissing: string;
    criticalLabel: string;
    /** Safe notice for a defensive unresolved segment record. */
    segmentUnavailable: string;
  };
  /**
   * Localized chrome for the compact sentence matrix, same-family guided
   * construction, and two-round practice UX (design spec §10.3, §11, §12;
   * Phase 1 Task 5). These are surrounding UI labels only — every Japanese
   * sentence, its romaji, and the natural translation come from realized
   * tokens and locale-owned variant translation copy, never from here. No
   * string claims certification, mastery, or fluency (§3.1).
   */
  foundation: {
    /** Heading for the scenario/person sentence matrix section. */
    matrixTitle: string;
    /** Short introduction shown under the matrix heading. */
    matrixIntro: string;
    /** Disclosure label revealing every model row. */
    showAll: string;
    /** Disclosure label collapsing back to the curated subset. */
    showFewer: string;
    /** Label for a row's speaker/role. */
    speakerLabel: string;
    /** Label for a row's scenario/context. */
    contextLabel: string;
    /** Label marking a naturally omitted (pro-dropped) subject. */
    omittedSubject: string;
    /** Heading for the same-family guided construction section. */
    guidedTitle: string;
    /** Label for the guided construction's starting sentence. */
    initialLabel: string;
    /** Label for the guided construction's target sentence. */
    targetLabel: string;
    /** Label introducing the list of active variation axes. */
    activeAxesLabel: string;
    /** Heading for practice round one (guided/controlled). */
    roundOneTitle: string;
    /** Introduction/purpose text for round one. */
    roundOneIntro: string;
    /** Heading for practice round two (transfer). */
    roundTwoTitle: string;
    /** Introduction/purpose text for round two. */
    roundTwoIntro: string;
    /** Label marking a transfer target. */
    transferLabel: string;
    /** Title of the localized content-unavailable notice. */
    unavailableTitle: string;
    /** Body of the localized content-unavailable notice. */
    unavailableBody: string;
  };
  /**
   * Home (design spec §10.4; Slice C plan Task 4 step 4). The title is the
   * Italian `Da ripassare`; English uses a plain beginner label. Empty, orphan,
   * and storage-unavailable states each have their own explicit string.
   */
  review: {
    title: string;
    lead: string;
    empty: string;
    count: (n: number) => string;
    fromLesson: (lessonTitle: string) => string;
    mistakes: (n: number) => string;
    practice: string;
    openLesson: string;
    /** Announced (polite live region) when a review-mode acceptance resolves. */
    resolved: string;
    orphaned: (n: number) => string;
    /** Notice for authored active entries that no longer resolve to an exercise. */
    unresolvable: (n: number) => string;
    unavailable: string;
  };
  /**
   * Copy for the phase-based course map (§4.1-4.4/§5.1-5.4/§6.2): phase
   * bands, per-module prerequisite/estimate/state text, and the
   * revisit/capstone state shown once every known lesson is visited.
   */
  courseMap: {
    heading: string;
    /** Keyed by PhaseId; a closed union, so `satisfies CourseCopy` already
     * enforces all four phases are present at compile time. */
    phases: Record<PhaseId, PhaseCopy>;
    /** Localized module names, or the localized "none/start here" text. */
    prerequisites: (moduleNames: string[]) => string;
    /** Shared wording for a module's total or a lesson's own estimate. */
    estimatedMinutes: (minutes: number) => string;
    coverageMetadata: (
      lessons: number,
      verbs: number,
      vocabularyItems: number,
    ) => string;
    stateCurrent: string;
    stateRecommended: string;
    stateVisited: string;
    expandLabel: (moduleTitle: string) => string;
    collapseLabel: (moduleTitle: string) => string;
    revisitTitle: string;
    revisitBody: string;
  };
  /**
   * Copy for the one-time v3→v4 progress migration notice and its
   * always-available explanation (design spec §17, Phase 2 Task 5). Truthful
   * only: it states that visited lessons were kept and that practice/
   * checkpoint evidence was reset because the exercises were redesigned. It
   * never claims certification, mastery, or that anything was "passed" —
   * alignment-only language throughout (§3.1).
   */
  progressMigration: {
    /** Title of the dismissible notice shown until the learner acknowledges it. */
    noticeTitle: string;
    /** Body explaining what was kept (visits) and what must be redone. */
    noticeBody: string;
    /** Action that records acknowledgement without deleting the migration record. */
    acknowledge: string;
    /** Heading for the explanation kept in progress help, regardless of acknowledgement. */
    helpTitle: string;
    /** Always-available explanation of the migration, shown in progress help. */
    helpBody: string;
  };
  /** Keyed by CourseModule.id. */
  modules: Record<ModuleId, ModuleCopy>;
  /** Keyed by Lesson.titleCopyId. */
  lessons: Record<string, LessonCopy>;
  /** Keyed by entries in Lesson.objectiveCopyIds. */
  objectives: Record<string, string>;
  /** Keyed by entries in CourseModule.outcomeCopyIds. */
  outcomes: Record<string, string>;
  blocks: Record<string, BlockCopy>;
  examples: Record<string, ExampleCopy>;
  /**
   * Localized captions for each guided-journey scene, keyed by a scene's
   * `captionCopyId` (Task 6 capstone §6.6). Kept in its own dictionary because
   * scenes are internal to one exploration rather than a lesson-level block.
   */
  journeyScenes: Record<string, string>;
}
