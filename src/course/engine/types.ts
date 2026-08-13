export const LAYOUT_MODES = ['stage', 'editorial', 'workbench'] as const;
export type LayoutMode = (typeof LAYOUT_MODES)[number];

export const STEP_KINDS = [
  'hook', 'rule', 'lexBatch', 'guidedBuild', 'examples',
  'dialogueScene', 'comprehension', 'breakdown',
  'transform', 'listen', 'shadow', 'dictation',
  'roleplayTurn', 'debrief', 'quiz', 'recap', 'reference',
] as const;
export type StepKind = (typeof STEP_KINDS)[number];

export type LocalizedText = { readonly it: string; readonly en: string };

export type LessonId = string & { readonly __brand: 'LessonId' };
export type UnitId = string & { readonly __brand: 'UnitId' };
export type ConceptId = string & { readonly __brand: 'ConceptId' };
export type LexemeId = string & { readonly __brand: 'LexemeId' };
export type StepId = string & { readonly __brand: 'StepId' };
export type ArchetypeId =
  | 'new-block' | 'immersion' | 'workshop'
  | 'listening' | 'roleplay' | 'checkpoint';

export interface StepBase {
  readonly id: StepId;
  readonly kind: StepKind;
  /** Seconds of learner time. Used to derive lesson duration; never guessed at lesson level. */
  readonly estimateSeconds: number;
  readonly optional?: boolean;
}

export interface JapaneseLine {
  readonly kana: string;
  readonly romaji: string;
  readonly literal: LocalizedText;
  readonly natural: LocalizedText;
  readonly audioId?: string;
}

export interface HookStep extends StepBase {
  readonly kind: 'hook';
  readonly situation: LocalizedText;
  readonly canDo: LocalizedText;
}

export interface RuleStep extends StepBase {
  readonly kind: 'rule';
  readonly statement: LocalizedText;
  readonly boundary: LocalizedText;
  readonly counterExample: LocalizedText;
}

export interface LexBatchStep extends StepBase {
  readonly kind: 'lexBatch';
  /** Four to six. Enforced by validateLesson. */
  readonly lexemes: readonly LexemeId[];
}

export interface GuidedBuildStep extends StepBase {
  readonly kind: 'guidedBuild';
  readonly target: JapaneseLine;
  /** Ordered fragments the learner assembles. */
  readonly fragments: readonly string[];
  readonly distractors: readonly string[];
}

export interface ExamplesStep extends StepBase {
  readonly kind: 'examples';
  readonly lines: readonly JapaneseLine[];
}

export interface DialogueSceneStep extends StepBase {
  readonly kind: 'dialogueScene';
  readonly setting: LocalizedText;
  readonly turns: readonly { readonly speaker: string; readonly line: JapaneseLine }[];
}

export interface ComprehensionStep extends StepBase {
  readonly kind: 'comprehension';
  readonly question: LocalizedText;
  readonly options: readonly LocalizedText[];
  readonly correctIndex: number;
}

export interface BreakdownStep extends StepBase {
  readonly kind: 'breakdown';
  readonly line: JapaneseLine;
  readonly parts: readonly { readonly chunk: string; readonly role: LocalizedText }[];
}

export interface QuizStep extends StepBase {
  readonly kind: 'quiz';
  readonly prompt: LocalizedText;
  readonly options: readonly string[];
  readonly correctIndex: number;
}

export interface RecapStep extends StepBase {
  readonly kind: 'recap';
  readonly learned: readonly LocalizedText[];
  readonly next: LocalizedText;
}

/** Phase 0 subset. Phase 1 extends this union with the remaining seven kinds. */
export type Step =
  | HookStep | RuleStep | LexBatchStep | GuidedBuildStep | ExamplesStep
  | DialogueSceneStep | ComprehensionStep | BreakdownStep | QuizStep | RecapStep;

export interface Lesson {
  readonly id: LessonId;
  readonly unitId: UnitId;
  readonly archetype: ArchetypeId;
  readonly title: LocalizedText;
  readonly canDo: LocalizedText;
  readonly steps: readonly Step[];
  readonly teaches: readonly ConceptId[];
  readonly requires: readonly ConceptId[];
  readonly lexemes: readonly LexemeId[];
}

export interface PhaseSpec {
  readonly name: string;
  readonly kinds: readonly StepKind[];
  readonly min: number;
  readonly max: number;
}

export interface Archetype {
  readonly id: ArchetypeId;
  readonly layout: LayoutMode;
  readonly phases: readonly PhaseSpec[];
  readonly minSteps: number;
  readonly maxSteps: number;
}
