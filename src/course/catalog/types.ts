import type { PhaseId } from "../data/types";
import type { PersonaId } from "../data/personas";

export type ConceptId = string;
export type LexemeId = string;
export type ExampleId = string;
export type ExerciseDefinitionId = string;
export type SpeechPromptId = string;

export interface ConceptCatalogEntry {
  readonly id: ConceptId;
  readonly prerequisiteIds: readonly ConceptId[];
  readonly surfaceGears: readonly string[];
}

export interface LexemeCatalogEntry {
  readonly id: LexemeId;
  readonly japanese: string;
  readonly reading: string;
  readonly category: "verb" | "noun" | "adjective" | "expression" | "other";
  readonly script: "hiragana" | "katakana";
}

export interface ExampleCatalogEntry {
  readonly id: ExampleId;
  readonly lexemeIds: readonly LexemeId[];
  readonly conceptIds: readonly ConceptId[];
}

export interface CurriculumCatalogEntry {
  readonly id: string;
  readonly phase: PhaseId;
  readonly prerequisiteIds: readonly string[];
  readonly exampleIds: readonly ExampleId[];
  readonly exerciseIds: readonly ExerciseDefinitionId[];
  readonly speechPromptId: SpeechPromptId | null;
}

export interface ExerciseCatalogEntry {
  readonly id: ExerciseDefinitionId;
  readonly targetExampleId: ExampleId;
  readonly assessedConceptIds: readonly ConceptId[];
  readonly assessedLexemeIds: readonly LexemeId[];
}

export interface SpeechPromptCatalogEntry {
  readonly id: SpeechPromptId;
  readonly targetExampleId: ExampleId;
}

export interface PersonaCatalogEntry {
  readonly id: PersonaId;
  readonly japaneseName: string;
  readonly latinName: string;
}
