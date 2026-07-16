import { normalizeAnswer } from "./normalizeAnswer";
import type {
  ChoiceExerciseDefinition,
  CompletionExerciseDefinition,
  ConstrainedConstructionExerciseDefinition,
  ExerciseCandidate,
  ExerciseCatalogsInput,
  ExerciseChoiceOption,
  ExerciseDefinition,
  ExerciseEvaluation,
  ExerciseExample,
  ExerciseExampleSegment,
  ExerciseGenerationError,
  ExerciseGenerationErrorCode,
  ExerciseGenerationResult,
  ExercisePrompt,
  ExercisePromptSegment,
  ExerciseTile,
  SegmentRef,
  TileOrderingExerciseDefinition,
  TransformationExerciseDefinition,
} from "./types";

/**
 * The pure, deterministic exercise engine (design spec §10.1-§10.3, Slice C
 * plan Task 1). `generateExercise` resolves a definition's shared references
 * into a typed prompt; `evaluateExercise` scores a typed candidate against that
 * prompt. Both are total functions of their inputs: identical definition and
 * catalogs always yield the identical prompt and result — no `Date`, no
 * randomness, no locale- or iteration-order dependence.
 *
 * All structural problems (missing/duplicate segments, unresolved references,
 * impossible choice sets, implicit/unresolvable variants, absent targets) are
 * reported as a structured `ExerciseGenerationError` and never silently folded
 * into an accepted result or an empty exercise (§10.3).
 */

/** Internal control-flow signal converted to a Result at the API boundary. */
class GenerationFault {
  constructor(readonly error: ExerciseGenerationError) {}
}

function tileId(exampleId: string, segmentId: string): string {
  return `${exampleId}#${segmentId}`;
}

function byJpThenId(
  left: { readonly jp: string; readonly id: string },
  right: { readonly jp: string; readonly id: string },
): number {
  if (left.jp !== right.jp) return left.jp < right.jp ? -1 : 1;
  if (left.id !== right.id) return left.id < right.id ? -1 : 1;
  return 0;
}

class Resolver {
  private readonly examplesById: ReadonlyMap<string, ExerciseExample>;
  private readonly conceptIds: ReadonlySet<string>;
  private readonly lexemeIds: ReadonlySet<string>;

  constructor(
    private readonly definitionId: string,
    catalogs: ExerciseCatalogsInput,
  ) {
    this.examplesById = new Map(catalogs.examples.map((entry) => [entry.id, entry]));
    this.conceptIds = new Set(catalogs.concepts.map((entry) => entry.id));
    this.lexemeIds = new Set(catalogs.lexemes.map((entry) => entry.id));
  }

  fault(code: ExerciseGenerationErrorCode, referenceId?: string): never {
    throw new GenerationFault(
      referenceId === undefined
        ? { code, definitionId: this.definitionId }
        : { code, definitionId: this.definitionId, referenceId },
    );
  }

  requireConcepts(ids: readonly string[]): void {
    for (const id of ids) {
      if (!this.conceptIds.has(id)) this.fault("missing-concept", id);
    }
  }

  requireLexemes(ids: readonly string[]): void {
    for (const id of ids) {
      if (!this.lexemeIds.has(id)) this.fault("missing-lexeme", id);
    }
  }

  example(exampleId: string): ExerciseExample {
    const found = this.examplesById.get(exampleId);
    if (!found) this.fault("missing-example", exampleId);
    this.assertUniqueSegments(found);
    return found;
  }

  private assertUniqueSegments(example: ExerciseExample): void {
    const seen = new Set<string>();
    for (const segment of example.segments) {
      if (seen.has(segment.id)) this.fault("duplicate-segment", tileId(example.id, segment.id));
      seen.add(segment.id);
    }
  }

  segment(example: ExerciseExample, segmentId: string): ExerciseExampleSegment {
    const found = example.segments.find((segment) => segment.id === segmentId);
    if (!found) this.fault("missing-segment", segmentId);
    return found;
  }

  /** Resolve a segment reference, defaulting its example to `defaultExampleId`. */
  resolveRef(
    ref: SegmentRef,
    defaultExampleId: string,
  ): { readonly exampleId: string; readonly segment: ExerciseExampleSegment } {
    const exampleId = ref.exampleId ?? defaultExampleId;
    const example = this.example(exampleId);
    return { exampleId, segment: this.segment(example, ref.segmentId) };
  }

  /** Resolve a variant's explicit shared segments; empty refs are implicit. */
  resolveVariant(
    refs: readonly SegmentRef[],
    defaultExampleId: string,
  ): readonly { readonly exampleId: string; readonly segment: ExerciseExampleSegment }[] {
    if (refs.length === 0) this.fault("invalid-variant");
    return refs.map((ref) => {
      try {
        return this.resolveRef(ref, defaultExampleId);
      } catch (error) {
        if (error instanceof GenerationFault) this.fault("invalid-variant", error.error.referenceId);
        throw error;
      }
    });
  }
}

function makeTile(exampleId: string, segment: ExerciseExampleSegment): ExerciseTile {
  return segment.reading === undefined
    ? { id: tileId(exampleId, segment.id), jp: segment.jp, kind: segment.kind }
    : {
        id: tileId(exampleId, segment.id),
        jp: segment.jp,
        kind: segment.kind,
        reading: segment.reading,
      };
}

function makeOption(
  exampleId: string,
  segment: ExerciseExampleSegment,
): ExerciseChoiceOption {
  return segment.reading === undefined
    ? { id: tileId(exampleId, segment.id), jp: segment.jp, kind: segment.kind }
    : {
        id: tileId(exampleId, segment.id),
        jp: segment.jp,
        kind: segment.kind,
        reading: segment.reading,
      };
}

function promptSegments(
  example: ExerciseExample,
  blankIds: ReadonlySet<string>,
): readonly ExercisePromptSegment[] {
  return example.segments.map((segment) => {
    const base = {
      id: segment.id,
      jp: segment.jp,
      kind: segment.kind,
      isBlank: blankIds.has(segment.id),
    };
    return segment.reading === undefined ? base : { ...base, reading: segment.reading };
  });
}

function variantStrings(
  resolver: Resolver,
  definition: ExerciseDefinition,
  targetExampleId: string,
): readonly string[] {
  return (definition.acceptedVariants ?? []).map((variant) =>
    resolver
      .resolveVariant(variant.segmentRefs, targetExampleId)
      .map((resolved) => resolved.segment.jp)
      .join(""),
  );
}

function generateTileOrdering(
  resolver: Resolver,
  definition: TileOrderingExerciseDefinition,
): ExercisePrompt {
  const target = resolver.example(definition.targetExampleId);
  const baseTiles = target.segments.map((segment) => makeTile(target.id, segment));
  if (baseTiles.length === 0) resolver.fault("absent-target", target.id);

  const occupiedRenderedText = new Set(baseTiles.map((tile) => tile.jp));
  const distractorTiles = (definition.distractorRefs ?? []).map((ref) => {
    const resolved = resolver.resolveRef(ref, target.id);
    const tile = makeTile(resolved.exampleId, resolved.segment);
    if (occupiedRenderedText.has(tile.jp)) resolver.fault("duplicate-segment", tile.id);
    occupiedRenderedText.add(tile.jp);
    return tile;
  });
  const allTiles = [...baseTiles, ...distractorTiles];

  const seenIds = new Set<string>();
  for (const tile of allTiles) {
    if (seenIds.has(tile.id)) resolver.fault("duplicate-segment", tile.id);
    seenIds.add(tile.id);
  }

  const correctTileIds = baseTiles.map((tile) => tile.id);
  const acceptedTileOrders = (definition.acceptedVariants ?? []).map((variant) => {
    const order = resolver
      .resolveVariant(variant.segmentRefs, target.id)
      .map((resolved) => tileId(resolved.exampleId, resolved.segment.id));
    for (const id of order) {
      if (!seenIds.has(id)) resolver.fault("invalid-variant", id);
    }
    return order;
  });

  return {
    kind: "tile-ordering",
    definitionId: definition.id,
    promptCopyId: definition.promptCopyId,
    assessedConceptIds: definition.assessedConceptIds,
    assessedLexemeIds: definition.assessedLexemeIds,
    tiles: [...allTiles].sort(byJpThenId),
    correctTileIds,
    acceptedTileOrders,
  };
}

function generateChoice(
  resolver: Resolver,
  definition: ChoiceExerciseDefinition,
): ExercisePrompt {
  const target = resolver.example(definition.targetExampleId);
  const blank = resolver.segment(target, definition.blankSegmentId);
  const correctOption = makeOption(target.id, blank);
  const distractorOptions = definition.distractorRefs.map((ref) => {
    const resolved = resolver.resolveRef(ref, target.id);
    return makeOption(resolved.exampleId, resolved.segment);
  });
  const allOptions = [correctOption, ...distractorOptions];

  if (allOptions.length < 2) resolver.fault("impossible-choice", correctOption.id);
  const seenIds = new Set<string>();
  const seenJp = new Set<string>();
  for (const option of allOptions) {
    if (seenIds.has(option.id) || seenJp.has(option.jp)) {
      resolver.fault("impossible-choice", option.id);
    }
    seenIds.add(option.id);
    seenJp.add(option.jp);
  }

  const optionByJp = new Map(allOptions.map((option) => [option.jp, option]));
  const acceptedOptionIds = [correctOption.id];
  for (const variant of definition.acceptedVariants ?? []) {
    const assembled = resolver
      .resolveVariant(variant.segmentRefs, target.id)
      .map((resolved) => resolved.segment.jp)
      .join("");
    const option = optionByJp.get(assembled);
    if (!option) resolver.fault("invalid-variant", variant.id);
    if (!acceptedOptionIds.includes(option.id)) acceptedOptionIds.push(option.id);
  }

  return {
    kind: "choice",
    definitionId: definition.id,
    promptCopyId: definition.promptCopyId,
    assessedConceptIds: definition.assessedConceptIds,
    assessedLexemeIds: definition.assessedLexemeIds,
    sentenceSegments: promptSegments(target, new Set([blank.id])),
    blankSegmentId: blank.id,
    options: [...allOptions].sort(byJpThenId),
    correctOptionId: correctOption.id,
    acceptedOptionIds,
  };
}

function generateTransformation(
  resolver: Resolver,
  definition: TransformationExerciseDefinition,
): ExercisePrompt {
  const source = resolver.example(definition.promptExampleId);
  const target = resolver.example(definition.targetExampleId);
  if (target.jp === "") resolver.fault("absent-target", target.id);
  return {
    kind: "transformation",
    definitionId: definition.id,
    promptCopyId: definition.promptCopyId,
    assessedConceptIds: definition.assessedConceptIds,
    assessedLexemeIds: definition.assessedLexemeIds,
    promptExampleId: source.id,
    promptJp: source.jp,
    canonicalAnswer: target.jp,
    acceptedAnswers: [target.jp, ...variantStrings(resolver, definition, target.id)],
    permitKatakanaToHiragana: definition.permitKatakanaToHiragana ?? false,
  };
}

function generateCompletion(
  resolver: Resolver,
  definition: CompletionExerciseDefinition,
): ExercisePrompt {
  const target = resolver.example(definition.targetExampleId);
  if (definition.blankSegmentIds.length === 0) resolver.fault("absent-target", target.id);
  const blanks = definition.blankSegmentIds.map((id) => resolver.segment(target, id));
  const canonicalAnswer = blanks.map((segment) => segment.jp).join("");
  if (canonicalAnswer === "") resolver.fault("absent-target", target.id);
  return {
    kind: "completion",
    definitionId: definition.id,
    promptCopyId: definition.promptCopyId,
    assessedConceptIds: definition.assessedConceptIds,
    assessedLexemeIds: definition.assessedLexemeIds,
    sentenceSegments: promptSegments(target, new Set(definition.blankSegmentIds)),
    blankSegmentIds: [...definition.blankSegmentIds],
    canonicalAnswer,
    acceptedAnswers: [canonicalAnswer, ...variantStrings(resolver, definition, target.id)],
    permitKatakanaToHiragana: definition.permitKatakanaToHiragana ?? false,
  };
}

function generateConstrained(
  resolver: Resolver,
  definition: ConstrainedConstructionExerciseDefinition,
): ExercisePrompt {
  const target = resolver.example(definition.targetExampleId);
  if (target.jp === "") resolver.fault("absent-target", target.id);
  return {
    kind: "constrained-construction",
    definitionId: definition.id,
    promptCopyId: definition.promptCopyId,
    assessedConceptIds: definition.assessedConceptIds,
    assessedLexemeIds: definition.assessedLexemeIds,
    intentCopyId: definition.intentCopyId,
    canonicalAnswer: target.jp,
    acceptedAnswers: [target.jp, ...variantStrings(resolver, definition, target.id)],
    permitKatakanaToHiragana: definition.permitKatakanaToHiragana ?? false,
  };
}

/**
 * Resolve a definition's shared references into a typed prompt, or a structured
 * error. Pure and deterministic (spec §10.1).
 */
export function generateExercise(
  definition: ExerciseDefinition,
  catalogs: ExerciseCatalogsInput,
): ExerciseGenerationResult {
  const resolver = new Resolver(definition.id, catalogs);
  try {
    resolver.requireConcepts(definition.assessedConceptIds);
    resolver.requireLexemes(definition.assessedLexemeIds);
    let prompt: ExercisePrompt;
    switch (definition.kind) {
      case "tile-ordering":
        prompt = generateTileOrdering(resolver, definition);
        break;
      case "choice":
        prompt = generateChoice(resolver, definition);
        break;
      case "transformation":
        prompt = generateTransformation(resolver, definition);
        break;
      case "completion":
        prompt = generateCompletion(resolver, definition);
        break;
      case "constrained-construction":
        prompt = generateConstrained(resolver, definition);
        break;
    }
    return { ok: true, prompt };
  } catch (error) {
    if (error instanceof GenerationFault) return { ok: false, error: error.error };
    throw error;
  }
}

function invalid(reason: string): ExerciseEvaluation {
  return { status: "invalid-input", reason };
}

function retry(prompt: ExercisePrompt): ExerciseEvaluation {
  return {
    status: "retry",
    targetConceptIds: prompt.assessedConceptIds,
    targetLexemeIds: prompt.assessedLexemeIds,
  };
}

function sequenceEquals(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function renderedTileKey(tile: ExerciseTile): string {
  return JSON.stringify([tile.jp, tile.reading ?? ""]);
}

function evaluateTileOrdering(
  prompt: Extract<ExercisePrompt, { kind: "tile-ordering" }>,
  tileIds: readonly string[],
): ExerciseEvaluation {
  const tilesById = new Map(prompt.tiles.map((tile) => [tile.id, tile]));
  if (tileIds.length === 0) return invalid("empty-tile-order");
  const used = new Set<string>();
  for (const id of tileIds) {
    if (!tilesById.has(id)) return invalid("unknown-tile");
    if (used.has(id)) return invalid("duplicate-tile");
    used.add(id);
  }
  const accepted = [prompt.correctTileIds, ...prompt.acceptedTileOrders];
  if (!accepted.some((order) => order.length === tileIds.length)) {
    return invalid("tile-count-mismatch");
  }

  const candidateRendered = tileIds.map((id) => {
    const tile = tilesById.get(id);
    return tile === undefined ? "" : renderedTileKey(tile);
  });
  return accepted.some((order) => {
    const rendered = order.map((id) => {
      const tile = tilesById.get(id);
      return tile === undefined ? "" : renderedTileKey(tile);
    });
    return sequenceEquals(rendered, candidateRendered);
  })
    ? { status: "accepted" }
    : retry(prompt);
}

function evaluateText(
  prompt: Extract<
    ExercisePrompt,
    { kind: "transformation" | "completion" | "constrained-construction" }
  >,
  text: string,
): ExerciseEvaluation {
  const options = { katakanaToHiragana: prompt.permitKatakanaToHiragana };
  const normalized = normalizeAnswer(text, options);
  if (normalized === "") return invalid("empty-answer");
  const accepted = prompt.acceptedAnswers.some(
    (answer) => normalizeAnswer(answer, options) === normalized,
  );
  return accepted ? { status: "accepted" } : retry(prompt);
}

/**
 * Score a typed candidate against a prompt: `accepted`, `retry` (with the
 * assessed target to review), or `invalid-input` for structurally unusable
 * input (spec §10.3). Pure and deterministic; never fuzzy.
 */
export function evaluateExercise(
  prompt: ExercisePrompt,
  candidate: ExerciseCandidate,
): ExerciseEvaluation {
  if (prompt.kind !== candidate.kind) return invalid("candidate-kind-mismatch");
  switch (prompt.kind) {
    case "tile-ordering":
      return evaluateTileOrdering(
        prompt,
        (candidate as Extract<ExerciseCandidate, { kind: "tile-ordering" }>).tileIds,
      );
    case "choice": {
      const optionId = (candidate as Extract<ExerciseCandidate, { kind: "choice" }>)
        .optionId;
      if (!prompt.options.some((option) => option.id === optionId)) {
        return invalid("unknown-option");
      }
      return prompt.acceptedOptionIds.includes(optionId)
        ? { status: "accepted" }
        : retry(prompt);
    }
    case "transformation":
    case "completion":
    case "constrained-construction":
      return evaluateText(
        prompt,
        (
          candidate as Extract<
            ExerciseCandidate,
            { kind: "transformation" | "completion" | "constrained-construction" }
          >
        ).text,
      );
  }
}
