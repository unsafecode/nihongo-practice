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
    stateCurrent: string;
    stateRecommended: string;
    stateVisited: string;
    expandLabel: (moduleTitle: string) => string;
    collapseLabel: (moduleTitle: string) => string;
    revisitTitle: string;
    revisitBody: string;
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
