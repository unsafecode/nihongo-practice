import type {
  A1LessonSectionId,
  A2LessonSectionId,
} from "../../routing/lessonSections";
import type { ContrastDimension, ModuleId } from "../data/types";
import type { A1PracticeFunction } from "../a1/curriculum/types";

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

export interface CourseAreaCopy {
  title: string;
  description: string;
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
    /**
     * Hero alignment badge (Phase 2 Task 6, design spec §3.1/§5): states the
     * level and its JF/CEFR alignment claim, never a certification claim.
     */
    levelBadge: string;
    /** Exact "16 modules, 64 lessons" structural statement — a fixed course
     * shape, never a completion/progress claim (that is `lessonsProgress`). */
    courseShape: (moduleCount: number, lessonCount: number) => string;
  };
  /** A fail-closed progress mutation could not be recorded for this lesson. */
  progressMutation: {
    title: string;
    body: (lessonId: string) => string;
    dismiss: string;
  };
  /**
   * The Course Home Can-do evidence summary (design spec §8/§17, Phase 2
   * Task 6): one line per authored Can-do, each showing only its recorded
   * evidence tier — never a pass/fail or mastery verdict.
   */
  canDoSummary: {
    heading: string;
    demonstratedCount: (demonstrated: number, total: number) => string;
    tierNotStarted: string;
    tierVisited: string;
    tierPracticed: string;
    tierDemonstrated: string;
  };
  /**
   * The Course Home checkpoint attempt-state section (design spec §8/§17,
   * Phase 2 Task 6): reports only whether the bounded A1 checkpoint scenario
   * has been attempted and what evidence that attempt produced — never a
   * pass/fail, certified, completed, mastered, or "passed A1" claim.
   */
  checkpoint: {
    heading: string;
    /** Body when no checkpoint evidence has been recorded yet. */
    notMet: string;
    /** Body once every scenario lesson is consolidated and the checkpoint is met. */
    met: string;
    /** Label for the anchor linking to the per-Can-do evidence breakdown above. */
    evidenceLink: string;
  };
  /**
   * The URL-reflected level dimension. The selector renders Base/A1/A2 as
   * enabled links with soft recommendations only. Every string is alignment/
   * practice copy, never a certification/mastery/"passed" claim.
   */
  courseLevels: {
    /** Visible accessible name for the three-option level selector group. */
    selectorLabel: string;
    /** Visible marker appended to the softly recommended option. */
    recommendedMarker: string;
    /** Selector option labels (short, e.g. "Base" / "A1" / "A2"). */
    base: string;
    a1: string;
    a2: string;
    /** Level map headings (the focus target when the level changes). */
    baseHeading: string;
    a1Heading: string;
    a2Heading: string;
    /** Base hero alignment badge. */
    baseBadge: string;
    /** A1 hero badge for the retained everyday-situations course. */
    a1Badge: string;
    /** A2 hero alignment badge — states the level + its JF/CEFR alignment claim. */
    a2Badge: string;
    /** Base hint when not recommended. */
    baseAvailableHint: string;
    /** Soft hint recommending Base to fresh learners. */
    baseRecommendedHint: string;
    /** A1 hint: remains open and applies foundations in situations. */
    a1AvailableHint: string;
    /** Soft hint recommending A1 after Base foundations are ready. */
    a1RecommendedHint: string;
    /** A2 hint: remains open and builds connected conversation. */
    a2AvailableHint: string;
    /** Soft "recommended next" hint shown once the A1 checkpoint is attempted. */
    a2RecommendedHint: string;
    /** Level-specific checkpoint headings. */
    baseCheckpointHeading: string;
    a1CheckpointHeading: string;
    a2CheckpointHeading: string;
    /** Fail-closed explanation when a configured Can-do descriptor is absent. */
    descriptorUnavailableTitle: string;
    descriptorUnavailableBody: string;
    /** Checkpoint state is observational: it reports attempts, never a result. */
    checkpointNotAttempted: (levelLabel: string) => string;
    checkpointAttemptRecorded: (levelLabel: string) => string;
    /**
     * Level-scoped destructive-reset copy (Phase 3 Task 8 spec-fix, ISSUE 3).
     * `resetLevel` is the button label and `resetLevelConfirm` the
     * `window.confirm` prompt, both taking the selected level's short label
     * (e.g. "A1"/"A2") so the action always names exactly which level it
     * clears and reassures the learner the other level is kept — never a
     * whole-progress wipe, never a mastery/completion claim.
     */
    resetLevel: (levelLabel: string) => string;
    resetLevelConfirm: (levelLabel: string) => string;
  };
  /**
   * Localized chrome for the A2 contextual-kanji UI (Phase 3 Task 8; Task 3
   * `KanjiRubyText`). `assessedExplanation` (`a2-kanji-why-visible`),
   * `revealShow` (`a2-kanji-reveal-show`), and `revealHide`
   * (`a2-kanji-reveal-hide`) are the exact copy the recognition-only kanji
   * renderer requires. No Japanese in any value; recognition-only (no
   * handwriting/IME claim).
   */
  kanji: {
    sectionHeading: string;
    sectionIntro: string;
    /**
     * `a2-kanji-why-visible`. Parameterised on the taught glyph: the assessed
     * stage shows no ruby and no gloss, so the explanation names the character
     * under test in the copy itself (e.g. "Su 毎 …") — the one non-visual cue
     * of *which* glyph is being assessed. Naming the glyph cannot leak the
     * answer, which is its reading, not its identity. House idiom: a function
     * taking the glyph, like `resetLevel(levelLabel)`.
     */
    assessedExplanation: (glyph: string) => string;
    revealShow: string;
    revealHide: string;
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
    /** Notice shown when a retired lesson's content merged into another lesson (e.g. sounds-5 → sounds-4), not merely renamed. */
    legacyLessonConsolidatedNoticeTitle: string;
    legacyLessonConsolidatedNoticeBody: string;
    /**
     * A2's four established section landmark names. Used verbatim as the A2
     * lesson rail's step labels, mobile context bar labels, and landmarks.
     */
    sections: Record<A2LessonSectionId, string>;
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
    /**
     * The A1 deep-lesson recap anchor's four fixed labels (Phase 2 Task 6):
     * the restated Can-do, the restated variation/contrast summary, the
     * vocabulary/item recap, and the honest note that anything missed
     * returns to the review queue. No string here claims certification,
     * mastery, or completion of A1 (§3.1) — only what this one lesson
     * covered and what happens next.
     */
    recap: {
      canDoLabel: string;
      variationLabel: string;
      vocabLabel: string;
      nextRetrievalTitle: string;
      nextRetrievalBody: string;
    };
  };
  /**
   * Localized chrome for A1's vocabulary-first six-section lesson experience.
   * Japanese itself always comes from the curriculum view model; these values
   * are surrounding UI labels only.
   */
  a1Lesson: {
    sections: Record<A1LessonSectionId, string>;
    overview: {
      canDoLabel: string;
      situationLabel: string;
      prerequisitesLabel: string;
    };
    vocabulary: {
      newWordsHeading: string;
      reviewWordsHeading: string;
      reviewBadge: string;
      reviewExceptionLabel: string;
      showMeanings: string;
      hideMeanings: string;
      meaningLabel: string;
      categoryLabel: string;
      categories: Record<
        | "pronoun"
        | "person"
        | "noun"
        | "verb"
        | "adjective"
        | "question-word"
        | "time"
        | "expression",
        string
      >;
      verbFormsLabel: string;
      dictionaryLabel: string;
      politeLabel: string;
      classLabel: string;
      verbClasses: Record<"godan" | "ichidan" | "irregular", string>;
    };
    learningNote: {
      kindLabel: string;
      kinds: Record<"grammar" | "phonetic" | "synthesis", string>;
      meaningLabel: string;
      useLabel: string;
      constructionLabel: string;
      typicalMistakeLabel: string;
      subjectOmissionLabel: string;
      nearestContrastLabel: string;
      patternLabel: string;
    };
    examples: {
      translationLabel: string;
      glossesLabel: string;
      dialogueLabel: string;
      turnLabel: (position: number) => string;
      optionalPattern: string;
    };
    practice: {
      functionLabel: string;
      functions: Record<A1PracticeFunction, string>;
    };
    audio: {
      play: string;
      playing: string;
      unavailable: string;
      failed: string;
      statusLabel: string;
    };
    recap: {
      meaningsAndFormsLabel: string;
      retrievalCueLabel: string;
      reviewExceptionLabel: string;
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
    /** Small label for A1's safe alternate retrieval task. */
    variedTask: string;
    /** Announced (polite live region) when a review-mode acceptance resolves. */
    resolved: string;
    orphaned: (n: number) => string;
    /** Notice for authored active entries that no longer resolve to an exercise. */
    unresolvable: (n: number) => string;
    unavailable: string;
  };
  /**
   * Per-module course-map copy: prerequisite/state text and the revisit state
   * shown once every known lesson is visited. A1 area headings/descriptions
   * live in `courseAreas`; no map copy claims a fabricated module time estimate
   * or verb/vocabulary coverage count.
   */
  courseMap: {
    heading: string;
    /** Localized module names, or the localized "none/start here" text. */
    prerequisites: (moduleNames: string[]) => string;
    stateCurrent: string;
    stateRecommended: string;
    stateVisited: string;
    /** Redundant text for a lesson whose required exercises have all been
     * attempted at least once (never shown alongside stateDemonstrated —
     * design spec §17, Phase 2 Task 6: the higher evidence tier wins). */
    statePracticed: string;
    /** Redundant text for a lesson whose required exercises have all been
     * accepted at least once — the "demonstrated" evidence tier. Never a
     * pass/fail verdict, only an observed-evidence label. */
    stateDemonstrated: string;
    expandLabel: (moduleTitle: string) => string;
    collapseLabel: (moduleTitle: string) => string;
    revisitTitle: string;
    revisitBody: string;
  };
  /** Named course-map groups. A1 supplies four explicit areas; A2 stays flat. */
  courseAreas: Record<string, CourseAreaCopy>;
  /**
   * Copy for the one-time schema-v3→schema-v4 progress migration notice and its
   * always-available explanation (design spec §17, Phase 2 Task 5). Truthful
   * only: it is static, locale-level text shown for every v1/v2/v3
   * migration, so it must never assert a reset or an orphan as a guaranteed
   * fact (many of those migrations reset nothing and orphan nothing). It
   * states only always-true, conditionally-scoped facts — safely matching
   * lesson visits carry over, redesigned practice/checkpoint evidence may
   * need to be repeated, and any unmatched old records are retained as
   * recovery data — never that evidence loss or orphaning definitely
   * occurred. It never claims certification, mastery, or that anything was
   * "passed" — alignment-only language throughout (§3.1).
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
  /**
   * Localized descriptive text for the A1 phonetic item catalog (Phase 2
   * Task 6), keyed by `A1PhoneticItem.hintCopyId` and by each phonetic
   * lesson's `a1-phonetic-outcome-<lessonId>` copy id. Kept separate from
   * `blocks`/`objectives` because the phonetic catalog is not lesson-section
   * or Can-do content — it is the one-mora/one-glyph description shown
   * alongside a phonetic lesson's vocabulary-first A1 content and its spoken
   * listen/repeat equivalent.
   */
  phonetics: Record<string, string>;
  /**
   * Localized semantic gloss for each A2 contextual kanji (Phase 3 Task 8
   * spec-fix, ISSUE 2), keyed by the frozen kanji catalog's per-entry
   * `meaningCopyId`. Real EN/IT support copy only — never Japanese — surfaced
   * next to a glyph at its supported stages so a kanji item shows a genuine
   * meaning instead of a dangling copy id. Withheld at the assessed stage by
   * the renderer so it can never leak the target of an assessed recognition.
   */
  kanjiMeanings: Record<string, string>;
}
