import type {
  ExerciseCandidate,
  ExerciseCatalogsInput,
  ExerciseDefinition,
  ExerciseEvaluation,
  ExerciseExample,
  ExerciseGenerationErrorCode,
  ExercisePrompt,
  ExerciseSegmentKind,
  SegmentRef,
} from "../exercises/types";
import { evaluateExercise, generateExercise } from "../exercises/engine";
import {
  fingerprintedFromRealized,
  pickBlankToken,
  pickCompletionBlanks,
  pickDistractorTokens,
  transformationAxis,
  type SelectedPracticeTarget,
} from "./selectVariants";
import type { RealizedSentence } from "./types";

/**
 * Realized-token exercise derivation (design spec §11.2-§11.3, §16;
 * Phase 1 Task 3). This module never authors or copies a Japanese literal
 * into an `ExerciseDefinition` — every definition it builds carries only
 * references (`ExampleId`/`SegmentRef`) into an in-memory catalog built
 * directly from `RealizedSentence.tokens`, and the actual answer text is
 * always assembled by the existing, reference-only `generateExercise`.
 */

// ---------------------------------------------------------------------------
// Token-kind mapping
// ---------------------------------------------------------------------------

function mapTokenKind(kind: RealizedSentence["tokens"][number]["kind"]): ExerciseSegmentKind {
  switch (kind) {
    case "lexical":
      return "word";
    case "morpheme":
      return "ending";
    case "particle":
      return "particle";
    case "punctuation":
      return "punctuation";
  }
}

/** Pure mapper: a `RealizedSentence` into an `ExerciseExample`, deriving
 * every field from the realized tokens only (spec requirement #1). No Result
 * wrapper — this can never fail given a well-formed `RealizedSentence`. */
export function realizedExerciseExample(sentence: RealizedSentence): ExerciseExample {
  return {
    id: sentence.variantId,
    jp: sentence.canonicalJapanese,
    segments: sentence.tokens.map((token) => {
      const base = { id: token.id, jp: token.jp, kind: mapTokenKind(token.kind) };
      return token.reading === undefined ? base : { ...base, reading: token.reading };
    }),
    lexemeIds: sentence.usedLexemeSenseIds,
    conceptIds: sentence.usedConceptIds,
  };
}

// ---------------------------------------------------------------------------
// Context and errors
// ---------------------------------------------------------------------------

export interface FamilyPracticeContext {
  readonly seed: string;
  readonly realizedSentences: readonly RealizedSentence[];
}

export type FoundationPracticeErrorCode =
  | "missing-realized-target"
  | "no-eligible-token"
  | "insufficient-distractors"
  | "missing-transformation-source"
  | "incompatible-transformation"
  | "duplicate-realized-token"
  | "generation-failed";

export interface FoundationPracticeError {
  readonly code: FoundationPracticeErrorCode;
  readonly referenceId?: string;
  /** Preserved underlying `generateExercise` failure, when this error wraps
   * one (`generation-failed`) — never re-derived or guessed. */
  readonly underlyingCode?: ExerciseGenerationErrorCode;
}

export type FamilyExerciseResult =
  | { readonly ok: true; readonly prompt: ExercisePrompt }
  | { readonly ok: false; readonly error: FoundationPracticeError };

// ---------------------------------------------------------------------------
// Catalog assembly
// ---------------------------------------------------------------------------

function buildCatalogs(realizedSentences: readonly RealizedSentence[]): ExerciseCatalogsInput {
  const conceptIds = new Set<string>();
  const lexemeIds = new Set<string>();
  const examples: ExerciseExample[] = [];
  for (const sentence of realizedSentences) {
    for (const id of sentence.usedConceptIds) conceptIds.add(id);
    for (const id of sentence.usedLexemeSenseIds) lexemeIds.add(id);
    examples.push(realizedExerciseExample(sentence));
  }
  return {
    concepts: [...conceptIds].map((id) => ({ id })),
    lexemes: [...lexemeIds].map((id) => ({ id })),
    examples,
  };
}

function findDuplicateTokenId(realizedSentences: readonly RealizedSentence[]): string | undefined {
  const seen = new Set<string>();
  for (const sentence of realizedSentences) {
    for (const token of sentence.tokens) {
      if (seen.has(token.id)) return token.id;
      seen.add(token.id);
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// generateFamilyExercise
// ---------------------------------------------------------------------------

export function generateFamilyExercise(
  selectedTarget: SelectedPracticeTarget,
  sentence: RealizedSentence,
  context: FamilyPracticeContext,
): FamilyExerciseResult {
  if (sentence.variantId !== selectedTarget.variantId) {
    return { ok: false, error: { code: "missing-realized-target", referenceId: selectedTarget.variantId } };
  }
  const inContext = context.realizedSentences.some((candidate) => candidate.variantId === sentence.variantId);
  if (!inContext) {
    return { ok: false, error: { code: "missing-realized-target", referenceId: sentence.variantId } };
  }

  const duplicateTokenId = findDuplicateTokenId(context.realizedSentences);
  if (duplicateTokenId !== undefined) {
    return { ok: false, error: { code: "duplicate-realized-token", referenceId: duplicateTokenId } };
  }

  const catalogs = buildCatalogs(context.realizedSentences);

  const definitionResult = buildFamilyExerciseDefinition(selectedTarget, sentence, context);
  if (!definitionResult.ok) return definitionResult;

  const generated = generateExercise(definitionResult.definition, catalogs);
  if (!generated.ok) {
    return {
      ok: false,
      error: {
        code: "generation-failed",
        referenceId: generated.error.referenceId,
        underlyingCode: generated.error.code,
      },
    };
  }
  return { ok: true, prompt: generated.prompt };
}

type DefinitionResult =
  | { readonly ok: true; readonly definition: ExerciseDefinition }
  | { readonly ok: false; readonly error: FoundationPracticeError };

/** Builds the reference-only `ExerciseDefinition` for `selectedTarget`'s
 * assigned kind. Exported (in addition to being used internally by
 * `generateFamilyExercise`) so tests can recursively scan the resulting
 * definition object and prove it never carries a literal Japanese string —
 * only IDs and references into the realized-token catalog. */
export function buildFamilyExerciseDefinition(
  selectedTarget: SelectedPracticeTarget,
  sentence: RealizedSentence,
  context: FamilyPracticeContext,
): DefinitionResult {
  const base = {
    id: `${selectedTarget.targetId}::definition`,
    assessedConceptIds: sentence.usedConceptIds,
    assessedLexemeIds: sentence.usedLexemeSenseIds,
  };

  switch (selectedTarget.exerciseKind) {
    case "tile-ordering": {
      if (sentence.tokens.length === 0) {
        return { ok: false, error: { code: "no-eligible-token", referenceId: sentence.variantId } };
      }
      return {
        ok: true,
        definition: {
          ...base,
          kind: "tile-ordering",
          promptCopyId: "practice-prompt-tile-ordering",
          targetExampleId: sentence.variantId,
        },
      };
    }
    case "choice": {
      const blank = pickBlankToken(context.seed, sentence);
      if (!blank) {
        return { ok: false, error: { code: "no-eligible-token", referenceId: sentence.variantId } };
      }
      const distractors = pickDistractorTokens(context.seed, blank, context.realizedSentences, sentence.variantId);
      if (distractors.length === 0) {
        return { ok: false, error: { code: "insufficient-distractors", referenceId: blank.id } };
      }
      const distractorRefs: SegmentRef[] = distractors.map((entry) => ({
        exampleId: entry.sentence.variantId,
        segmentId: entry.token.id,
      }));
      return {
        ok: true,
        definition: {
          ...base,
          kind: "choice",
          promptCopyId: "practice-prompt-choice",
          targetExampleId: sentence.variantId,
          blankSegmentId: blank.id,
          distractorRefs,
        },
      };
    }
    case "completion": {
      const blanks = pickCompletionBlanks(context.seed, sentence);
      if (blanks.length === 0) {
        return { ok: false, error: { code: "no-eligible-token", referenceId: sentence.variantId } };
      }
      return {
        ok: true,
        definition: {
          ...base,
          kind: "completion",
          promptCopyId: "practice-prompt-completion",
          targetExampleId: sentence.variantId,
          blankSegmentIds: blanks.map((token) => token.id),
        },
      };
    }
    case "constrained-construction": {
      return {
        ok: true,
        definition: {
          ...base,
          kind: "constrained-construction",
          promptCopyId: "practice-prompt-constrained-construction",
          targetExampleId: sentence.variantId,
          intentCopyId: sentence.discourse.scenarioNoteCopyId,
        },
      };
    }
    case "transformation": {
      if (!selectedTarget.sourceVariantId) {
        return { ok: false, error: { code: "missing-transformation-source", referenceId: sentence.variantId } };
      }
      const source = context.realizedSentences.find(
        (candidate) => candidate.variantId === selectedTarget.sourceVariantId,
      );
      if (!source) {
        return {
          ok: false,
          error: { code: "missing-transformation-source", referenceId: selectedTarget.sourceVariantId },
        };
      }
      const axis = transformationAxis(fingerprintedFromRealized(source), fingerprintedFromRealized(sentence));
      if (!axis) {
        return {
          ok: false,
          error: { code: "incompatible-transformation", referenceId: source.variantId },
        };
      }
      return {
        ok: true,
        definition: {
          ...base,
          kind: "transformation",
          promptCopyId: "practice-prompt-transformation",
          promptExampleId: source.variantId,
          targetExampleId: sentence.variantId,
          transformation: axis,
        },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// evaluateFamilyExercise
// ---------------------------------------------------------------------------

/** Thin delegate to the existing, reused-unchanged `evaluateExercise`. */
export function evaluateFamilyExercise(
  prompt: ExercisePrompt,
  candidate: ExerciseCandidate,
): ExerciseEvaluation {
  return evaluateExercise(prompt, candidate);
}
