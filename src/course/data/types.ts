import type { LabSelection } from "../../content/types";

export type ChapterId =
  | "sounds"
  | "sentence-map"
  | "actions"
  | "time"
  | "places"
  | "people"
  | "travel-patterns"
  | "traps";

export type ToolTarget = "syllabary" | "lab";

export interface ExampleSegment {
  jp: string;
  romaji: string;
  kind: "word" | "particle" | "ending";
}

export interface StaticExample {
  id: string;
  jp: string;
  romaji: string;
  segments?: ExampleSegment[];
}

export type LessonBlock =
  | { type: "rule"; copyId: string; gear: string }
  | { type: "examples"; copyId: string; exampleIds: string[] }
  | { type: "comparison"; copyId: string; exampleIds: string[] }
  | {
      type: "callout";
      copyId: string;
      tone: "note" | "warning" | "exception";
    }
  | {
      type: "guidedTool";
      copyId: string;
      target: ToolTarget;
      preset?: LabSelection;
    }
  | { type: "summary"; copyId: string };

export interface Lesson {
  id: string;
  chapterId: ChapterId;
  order: number;
  blocks: LessonBlock[];
}

export interface Chapter {
  id: ChapterId;
  order: number;
  emoji: string;
  locked: false;
  lessons: Lesson[];
}
