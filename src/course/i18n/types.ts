import type { ModuleId } from "../data/types";

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

export interface CourseCopy {
  home: {
    eyebrow: string;
    title: string;
    lead: string;
    continue: string;
    allVisited: string;
    start: string;
    review: string;
    reset: string;
    resetConfirm: string;
    corruptProgress: string;
    dismiss: string;
    invalidRoute: (path: string) => string;
    lessonsProgress: (visited: number, total: number) => string;
  };
  lesson: {
    back: string;
    modulePosition: (current: number, total: number) => string;
    previous: string;
    next: string;
    listen: string;
    playing: string;
    legacyModuleNoticeTitle: string;
    legacyModuleNoticeBody: string;
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
}
