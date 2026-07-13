import type { ChapterId } from "../data/types";

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

export interface LessonCopy {
  title: string;
  lead: string;
}

export interface ChapterCopy {
  title: string;
  description: string;
}

export interface CourseCopy {
  home: {
    eyebrow: string;
    title: string;
    lead: string;
    continue: string;
    completed: string;
    start: string;
    review: string;
    reset: string;
    resetConfirm: string;
    corruptProgress: string;
    dismiss: string;
    invalidRoute: (path: string) => string;
    lessonsProgress: (completed: number, total: number) => string;
  };
  lesson: {
    back: string;
    chapterPosition: (current: number, total: number) => string;
    complete: string;
    undoComplete: string;
    previous: string;
    next: string;
    listen: string;
    playing: string;
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
  chapters: Record<ChapterId, ChapterCopy>;
  lessons: Record<string, LessonCopy>;
  blocks: Record<string, BlockCopy>;
  examples: Record<string, ExampleCopy>;
}
