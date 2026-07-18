import type { Locale } from "../../i18n/LocaleContext";
import type { AssembledToken } from "../../romaji/types";
import type { ExercisePrompt, ExerciseKind } from "../exercises/types";
import {
  realizeVariant,
  type RealizeVariantCatalogs,
} from "./realizeFamily";
import {
  selectVariants,
  type PracticeCandidate,
  type SelectedPracticeTarget,
  type SelectVariantsRoundConstraints,
} from "./selectVariants";
import {
  generateFamilyExercise,
  type FamilyPracticeContext,
} from "./practiceEngine";
import type {
  Context,
  FoundationCatalogs,
  FoundationLessonDefinition,
  LessonId,
  PersonRole,
  RealizedSentence,
  SentenceFamily,
  SentenceVariant,
  VariationAxis,
} from "./types";

/**
 * Catalog-parameterized production lesson view model for the compact sentence
 * matrix, same-family guided construction, and two-round practice UX (design
 * spec §10.3, §11, §12; Phase 1 Task 5, generalized in Phase 2 Task 1).
 *
 * Given a full {@link FoundationCatalogs} set, its localized {@link FoundationCopy},
 * a lesson id, a locale, a catalog version, and a deterministic seed, it
 * re-derives the whole preview page — realizing every model and practice
 * candidate with the lesson's own available concepts, running the production
 * selector for both rounds, and generating every selected exercise against one
 * complete realized context — and returns a typed success or a single typed
 * error. It never returns a partial page and makes no assumption about ID
 * prefixes or fixture constants: the same builder serves the Phase 1 fixture
 * harness and the deep A1 release catalog.
 *
 * Locale only resolves surrounding copy (translations, role/context labels,
 * scenario notes, instructions). It never touches variant/target selection or
 * ordering, so the selected target ids and the matrix order are identical
 * across locales.
 */

// ---------------------------------------------------------------------------
// Catalog-independent copy contract
// ---------------------------------------------------------------------------

/**
 * The localized copy any lesson catalog resolves surrounding text against: a
 * per-locale record of copy id → learner-visible string. Catalog-neutral — no
 * fixture-specific keys are assumed.
 */
export type FoundationCopy = Readonly<Record<Locale, Readonly<Record<string, string>>>>;

/**
 * The stable convention mapping a semantic variant id to the locale-owned copy
 * id that holds its natural translation. Variants stay semantic ids only (no
 * Japanese answer literals); the natural EN/IT rendering of a variant's meaning
 * lives in the catalog copy under this id. Every catalog that ships through
 * this builder — the fixture harness and the A1 release catalog — authors its
 * translations under the same convention so the builder stays catalog-neutral.
 */
export function variantTranslationCopyId(variantId: string): string {
  return `${variantId}-translation`;
}

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

export interface FoundationLocalizedRow {
  readonly variantId: string;
  readonly familyId: string;
  readonly contextId: string;
  readonly speakerRoleId: string;
  readonly subjectRealization: "explicit" | "omitted" | "vocative";
  readonly semanticFingerprint: string;
  readonly predicateSenseId: string;
  readonly pedagogicalUse: string;
  readonly tokens: readonly AssembledToken[];
  /** Localized natural translation (never a Japanese literal). */
  readonly translation: string;
  /** Localized speaker/role label. */
  readonly speaker: string;
  /** Localized scenario/context label. */
  readonly context: string;
}

export interface FoundationMatrixModel {
  /** All eight realized+localized model rows, in authored order. */
  readonly rows: readonly FoundationLocalizedRow[];
  /** The exact first three curated model variant ids (collapsed subset). */
  readonly initialVariantIds: readonly string[];
}

export interface FoundationGuidedModel {
  readonly familyId: string;
  readonly initial: FoundationLocalizedRow;
  readonly target: FoundationLocalizedRow;
  /** The semantic axes that actually change between initial and target. */
  readonly activeAxes: readonly VariationAxis[];
  /** Target token ids whose slot's semantic value differs from the initial. */
  readonly targetChangedTokenIds: readonly string[];
}

export interface FoundationRoundTarget {
  readonly targetId: string;
  readonly variantId: string;
  readonly familyId: string;
  readonly contextId: string;
  readonly speakerRoleId: string;
  readonly exerciseKind: ExerciseKind;
  readonly pedagogicalUse: string;
  readonly practicePurpose: "guided-controlled" | "transfer";
  readonly sourceVariantId?: string;
  readonly semanticFingerprint: string;
  readonly visibleTargetKey: string;
  readonly prompt: ExercisePrompt;
  readonly targetExampleId: string;
  /** Localized natural translation of the target's meaning. */
  readonly translation: string;
  /** Localized instruction for the exercise kind. */
  readonly instruction: string;
  /** Localized intent (constrained construction scenario note) or null. */
  readonly intentText: string | null;
}

export interface FoundationRoundModel {
  readonly roundId: string;
  readonly purpose: "guided-controlled" | "transfer";
  readonly targets: readonly FoundationRoundTarget[];
}

export interface FoundationLessonViewModel {
  readonly lessonId: string;
  readonly levelId: string;
  /** Localized primary Can-do descriptor. */
  readonly canDoDescriptor: string;
  readonly matrix: FoundationMatrixModel;
  readonly guided: FoundationGuidedModel;
  readonly rounds: readonly [FoundationRoundModel, FoundationRoundModel];
  /** Resolves an example id to its whole ordered token sequence. */
  readonly tokensForExample: (
    exampleId: string,
  ) => readonly AssembledToken[] | undefined;
  /** Resolves a `${exampleId}#${tokenId}` tile id to its assembled token. */
  readonly tokenForTile: (tileId: string) => AssembledToken | undefined;
}

export type FoundationViewModelErrorCode =
  | "unknown-lesson"
  | "realization-failed"
  | "selection-failed"
  | "generation-failed"
  | "guided-unavailable";

export interface FoundationViewModelError {
  readonly code: FoundationViewModelErrorCode;
  readonly detail?: string;
}

export type FoundationLessonViewModelResult =
  | { readonly ok: true; readonly model: FoundationLessonViewModel }
  | { readonly ok: false; readonly error: FoundationViewModelError };

/** The input every catalog supplies to build one lesson's whole view model. */
export interface BuildLessonViewModelInput {
  readonly catalogs: FoundationCatalogs;
  readonly copy: FoundationCopy;
  readonly lessonId: LessonId;
  readonly locale: Locale;
  readonly catalogVersion: string;
  readonly seed: string;
}

// ---------------------------------------------------------------------------
// Instruction copy (production; encouraging, never certification/mastery).
// Catalog-neutral: keyed only by the shared exercise-kind vocabulary.
// ---------------------------------------------------------------------------

const INSTRUCTION_COPY: Readonly<
  Record<ExerciseKind, Readonly<Record<Locale, string>>>
> = {
  "tile-ordering": {
    en: "Put the words in the right order.",
    it: "Metti le parole nell'ordine giusto.",
  },
  choice: {
    en: "Choose the word that fits the sentence.",
    it: "Scegli la parola che completa la frase.",
  },
  completion: {
    en: "Fill in the missing part of the sentence.",
    it: "Completa la parte mancante della frase.",
  },
  "constrained-construction": {
    en: "Build the sentence that fits this situation.",
    it: "Costruisci la frase adatta a questa situazione.",
  },
  transformation: {
    en: "Change the example so it matches the new meaning.",
    it: "Trasforma l'esempio per il nuovo significato.",
  },
};

/** The bilingual instruction map, exported so harnesses can prove parity. */
export const foundationInstructionCopy = INSTRUCTION_COPY;

// ---------------------------------------------------------------------------
// Semantic-axis labels (production; plain descriptive text, never colour alone).
// ---------------------------------------------------------------------------

const AXIS_LABELS: Readonly<
  Record<VariationAxis, Readonly<Record<Locale, string>>>
> = {
  "speaker-person": { en: "Who is speaking", it: "Chi parla" },
  "predicate-verb": { en: "Action or state", it: "Azione o stato" },
  object: { en: "What it is about", it: "Di cosa si tratta" },
  location: { en: "Place", it: "Luogo" },
  time: { en: "When", it: "Quando" },
  quantity: { en: "How many", it: "Quante" },
  "polarity-tense-form": { en: "Form of the verb", it: "Forma del verbo" },
  context: { en: "Situation", it: "Situazione" },
};

/** The bilingual axis-label map, exported so harnesses can prove parity. */
export const foundationAxisLabels = AXIS_LABELS;

/** The localized label for one semantic variation axis. Pure. */
export function foundationAxisLabel(axis: VariationAxis, locale: Locale): string {
  return AXIS_LABELS[axis][locale];
}

// ---------------------------------------------------------------------------
// Catalog indexing
// ---------------------------------------------------------------------------

interface Index {
  readonly catalogs: FoundationCatalogs;
  readonly familyById: Map<string, SentenceFamily>;
  readonly variantById: Map<string, SentenceVariant>;
  readonly contextById: Map<string, Context>;
  readonly roleById: Map<string, PersonRole>;
}

function byId<T extends { readonly id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function buildIndex(catalogs: FoundationCatalogs): Index {
  return {
    catalogs,
    familyById: byId(catalogs.sentenceFamilies),
    variantById: byId(catalogs.sentenceVariants),
    contextById: byId(catalogs.contexts),
    roleById: byId(catalogs.personRoles),
  };
}

function copyFor(copy: FoundationCopy, locale: Locale, copyId: string): string {
  return copy[locale][copyId] ?? "";
}

// ---------------------------------------------------------------------------
// Diversity → selection constraints (mirrors validateFoundations)
// ---------------------------------------------------------------------------

function selectionConstraints(
  lesson: FoundationLessonDefinition,
  round: "one" | "two",
): SelectVariantsRoundConstraints {
  const d = lesson.diversityConstraints;
  return {
    minFamilies: 1,
    minPredicates: 1,
    minRoles: 1,
    minContexts: 1,
    minUniqueVisibleTargets: d.minUniqueTargets,
    maxVisibleReuse: d.maxTargetReuse,
    minTransferTargets: round === "two" ? d.minTransferExercises : 0,
    requireControlledConstruction:
      round === "two" ? d.requireControlledConstruction : false,
  };
}

// ---------------------------------------------------------------------------
// Guided construction helpers (pure)
// ---------------------------------------------------------------------------

function formKey(variant: SentenceVariant): string {
  const f = variant.form;
  return `${f.polarity}|${f.tense}|${f.formality}`;
}

/** Parses the slot id a realized token belongs to from its source reference
 * `${variantId}/${slotId}`; rule/ending tokens (`${variantId}/rule/...`) have
 * no single slot segment and resolve to undefined. Honest — derived from the
 * token's own source reference, never from guessing on the surface string. */
function slotIdOfToken(token: AssembledToken): string | undefined {
  const parts = token.source.referenceId.split("/");
  return parts.length === 2 ? parts[1] : undefined;
}

/** The semantic axes that change between two same-family variants, and the
 * target token ids whose slot's semantic value actually differs. Pure. */
export function foundationGuidedDelta(
  family: SentenceFamily,
  initial: SentenceVariant,
  target: SentenceVariant,
  targetTokens: readonly AssembledToken[],
): { readonly activeAxes: readonly VariationAxis[]; readonly changedTokenIds: readonly string[] } {
  const changedSlots = new Set<string>();
  const axes = new Set<VariationAxis>();
  for (const slot of family.slotSchema) {
    if (initial.slotValues[slot.id] !== target.slotValues[slot.id]) {
      changedSlots.add(slot.id);
      axes.add(slot.axis);
    }
  }
  if (formKey(initial) !== formKey(target)) axes.add("polarity-tense-form");
  if (initial.contextId !== target.contextId) axes.add("context");
  if (
    initial.discourse.subjectRealization !== target.discourse.subjectRealization
  ) {
    axes.add("speaker-person");
  }
  const changedTokenIds = targetTokens
    .filter((token) => {
      const slot = slotIdOfToken(token);
      return slot !== undefined && changedSlots.has(slot);
    })
    .map((token) => token.id);
  return { activeAxes: [...axes], changedTokenIds };
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

export function buildLessonViewModel(
  input: BuildLessonViewModelInput,
): FoundationLessonViewModelResult {
  const { catalogs, copy, lessonId, locale, catalogVersion, seed } = input;
  const index = buildIndex(catalogs);
  const lesson = index.catalogs.lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    return { ok: false, error: { code: "unknown-lesson", detail: lessonId } };
  }

  const realizeCatalogs: RealizeVariantCatalogs = {
    contexts: index.catalogs.contexts,
    personRoles: index.catalogs.personRoles,
    referents: index.catalogs.referents,
    semanticValues: index.catalogs.semanticValues,
    learningTargetSenses: index.catalogs.learningTargetSenses,
  };

  const available = new Set<string>();
  for (const familyId of lesson.familyIds) {
    const family = index.familyById.get(familyId);
    if (family) for (const id of family.requiredConceptIds) available.add(id);
  }
  const availableConceptIds = [...available];

  const realizedCache = new Map<string, RealizedSentence | null>();
  const realize = (variantId: string): RealizedSentence | null => {
    const cached = realizedCache.get(variantId);
    if (cached !== undefined) return cached;
    const variant = index.variantById.get(variantId);
    const family = variant && index.familyById.get(variant.sentenceFamilyId);
    if (!variant || !family) {
      realizedCache.set(variantId, null);
      return null;
    }
    const result = realizeVariant(family, variant, realizeCatalogs, {
      availableConceptIds,
    });
    const sentence = result.ok ? result.sentence : null;
    realizedCache.set(variantId, sentence);
    return sentence;
  };

  const realizePool = (ids: readonly string[]): RealizedSentence[] | null => {
    const sentences: RealizedSentence[] = [];
    for (const id of ids) {
      const sentence = realize(id);
      if (!sentence) return null;
      sentences.push(sentence);
    }
    return sentences;
  };

  const modelSentences = realizePool(lesson.modelVariantIds);
  const roundOneCandidates = realizePool(
    lesson.practice.roundOne.candidateVariantIds,
  );
  const roundTwoCandidates = realizePool(
    lesson.practice.roundTwo.candidateVariantIds,
  );
  if (!modelSentences || !roundOneCandidates || !roundTwoCandidates) {
    return { ok: false, error: { code: "realization-failed", detail: lessonId } };
  }

  const sentenceById = new Map<string, RealizedSentence>();
  for (const sentence of [
    ...modelSentences,
    ...roundOneCandidates,
    ...roundTwoCandidates,
  ]) {
    if (!sentenceById.has(sentence.variantId)) {
      sentenceById.set(sentence.variantId, sentence);
    }
  }

  const modelFingerprints = modelSentences.map((s) => s.semanticFingerprint);

  const buildCandidates = (ids: readonly string[]): PracticeCandidate[] =>
    ids
      .map((id) => {
        const variant = index.variantById.get(id);
        const sentence = sentenceById.get(id);
        return variant && sentence ? { variant, sentence } : undefined;
      })
      .filter((c): c is PracticeCandidate => c !== undefined);

  const r1 = selectVariants({
    catalogVersion,
    lessonId: lesson.id,
    round: lesson.practice.roundOne,
    seed,
    candidates: buildCandidates(lesson.practice.roundOne.candidateVariantIds),
    modelSemanticFingerprints: modelFingerprints,
    alreadySelected: [],
    constraints: selectionConstraints(lesson, "one"),
  });
  if (!r1.ok) {
    return { ok: false, error: { code: "selection-failed", detail: lesson.practice.roundOne.id } };
  }
  const r2 = selectVariants({
    catalogVersion,
    lessonId: lesson.id,
    round: lesson.practice.roundTwo,
    seed,
    candidates: buildCandidates(lesson.practice.roundTwo.candidateVariantIds),
    modelSemanticFingerprints: modelFingerprints,
    alreadySelected: r1.targets,
    constraints: selectionConstraints(lesson, "two"),
  });
  if (!r2.ok) {
    return { ok: false, error: { code: "selection-failed", detail: lesson.practice.roundTwo.id } };
  }

  // Generate every selected exercise against one complete realized context.
  const context: FamilyPracticeContext = {
    seed: lesson.practice.lessonId,
    realizedSentences: [...sentenceById.values()],
  };
  const promptByTargetId = new Map<string, ExercisePrompt>();
  for (const target of [...r1.targets, ...r2.targets]) {
    const sentence = sentenceById.get(target.variantId);
    if (!sentence) {
      return { ok: false, error: { code: "generation-failed", detail: target.variantId } };
    }
    const result = generateFamilyExercise(target, sentence, context);
    if (!result.ok) {
      return { ok: false, error: { code: "generation-failed", detail: target.variantId } };
    }
    promptByTargetId.set(target.targetId, result.prompt);
  }

  // ---- Localized rows ----
  const rowFor = (variantId: string): FoundationLocalizedRow | null => {
    const sentence = sentenceById.get(variantId);
    const variant = index.variantById.get(variantId);
    if (!sentence || !variant) return null;
    const role = index.roleById.get(sentence.discourse.speakerRoleId);
    const context = index.contextById.get(sentence.contextId);
    return {
      variantId,
      familyId: sentence.familyId,
      contextId: sentence.contextId,
      speakerRoleId: sentence.discourse.speakerRoleId,
      subjectRealization: sentence.discourse.subjectRealization,
      semanticFingerprint: sentence.semanticFingerprint,
      predicateSenseId: sentence.predicateSenseId,
      pedagogicalUse: sentence.pedagogicalUse,
      tokens: sentence.tokens,
      translation: copyFor(copy, locale, variantTranslationCopyId(variantId)),
      speaker: role ? copyFor(copy, locale, role.labelCopyId) : "",
      context: context ? copyFor(copy, locale, context.labelCopyId) : "",
    };
  };

  const matrixRows: FoundationLocalizedRow[] = [];
  for (const id of lesson.modelVariantIds) {
    const row = rowFor(id);
    if (!row) return { ok: false, error: { code: "realization-failed", detail: id } };
    matrixRows.push(row);
  }

  // ---- Guided construction (same family, honest delta) ----
  const guided = buildGuided(lesson, index, sentenceById, rowFor);
  if (!guided) {
    return { ok: false, error: { code: "guided-unavailable", detail: lesson.id } };
  }

  // ---- Round models ----
  const toRoundTarget = (
    target: SelectedPracticeTarget,
    purpose: "guided-controlled" | "transfer",
  ): FoundationRoundTarget => {
    const prompt = promptByTargetId.get(target.targetId) as ExercisePrompt;
    const sentence = sentenceById.get(target.variantId);
    const intentText =
      target.exerciseKind === "constrained-construction" && sentence
        ? copyFor(copy, locale, sentence.discourse.scenarioNoteCopyId)
        : null;
    return {
      targetId: target.targetId,
      variantId: target.variantId,
      familyId: target.sentenceFamilyId,
      contextId: target.contextId,
      speakerRoleId: target.speakerRoleId,
      exerciseKind: target.exerciseKind,
      pedagogicalUse: target.pedagogicalUse,
      practicePurpose: purpose,
      ...(target.sourceVariantId !== undefined
        ? { sourceVariantId: target.sourceVariantId }
        : {}),
      semanticFingerprint: target.semanticFingerprint,
      visibleTargetKey: target.visibleTargetKey,
      prompt,
      targetExampleId: target.variantId,
      translation: copyFor(copy, locale, variantTranslationCopyId(target.variantId)),
      instruction: INSTRUCTION_COPY[target.exerciseKind][locale],
      intentText,
    };
  };

  const rounds: readonly [FoundationRoundModel, FoundationRoundModel] = [
    {
      roundId: lesson.practice.roundOne.id,
      purpose: "guided-controlled",
      targets: r1.targets.map((t) => toRoundTarget(t, "guided-controlled")),
    },
    {
      roundId: lesson.practice.roundTwo.id,
      purpose: "transfer",
      targets: r2.targets.map((t) => toRoundTarget(t, "transfer")),
    },
  ];

  // ---- Token resolvers ----
  const tokensForExample = (
    exampleId: string,
  ): readonly AssembledToken[] | undefined =>
    sentenceById.get(exampleId)?.tokens;
  const tokenForTile = (tileId: string): AssembledToken | undefined => {
    const hash = tileId.indexOf("#");
    if (hash < 0) return undefined;
    const exampleId = tileId.slice(0, hash);
    const tokenId = tileId.slice(hash + 1);
    return sentenceById
      .get(exampleId)
      ?.tokens.find((token) => token.id === tokenId);
  };

  const primaryCanDo = index.catalogs.canDos.find(
    (canDo) => canDo.id === lesson.primaryCanDoId,
  );

  return {
    ok: true,
    model: {
      lessonId: lesson.id,
      levelId: lesson.level,
      canDoDescriptor: primaryCanDo
        ? copyFor(copy, locale, primaryCanDo.descriptorCopyId)
        : "",
      matrix: {
        rows: matrixRows,
        initialVariantIds: lesson.modelVariantIds.slice(0, 3),
      },
      guided,
      rounds,
      tokensForExample,
      tokenForTile,
    },
  };
}

function buildGuided(
  lesson: FoundationLessonDefinition,
  index: Index,
  sentenceById: Map<string, RealizedSentence>,
  rowFor: (variantId: string) => FoundationLocalizedRow | null,
): FoundationGuidedModel | null {
  // Pick the first two model variants sharing a family, in authored order.
  const byFamily = new Map<string, string[]>();
  for (const id of lesson.modelVariantIds) {
    const variant = index.variantById.get(id);
    if (!variant) continue;
    const list = byFamily.get(variant.sentenceFamilyId) ?? [];
    list.push(id);
    byFamily.set(variant.sentenceFamilyId, list);
  }
  let pair: readonly [string, string] | null = null;
  for (const id of lesson.modelVariantIds) {
    const variant = index.variantById.get(id);
    if (!variant) continue;
    const list = byFamily.get(variant.sentenceFamilyId) ?? [];
    if (list.length >= 2) {
      pair = [list[0], list[1]];
      break;
    }
  }
  if (!pair) return null;
  const [initialId, targetId] = pair;
  const initialVariant = index.variantById.get(initialId);
  const targetVariant = index.variantById.get(targetId);
  const targetSentence = sentenceById.get(targetId);
  const initialRow = rowFor(initialId);
  const targetRow = rowFor(targetId);
  if (!initialVariant || !targetVariant || !targetSentence || !initialRow || !targetRow) {
    return null;
  }
  const family = index.familyById.get(targetVariant.sentenceFamilyId);
  if (!family || initialVariant.sentenceFamilyId !== targetVariant.sentenceFamilyId) {
    return null;
  }
  const { activeAxes, changedTokenIds } = foundationGuidedDelta(
    family,
    initialVariant,
    targetVariant,
    targetSentence.tokens,
  );
  if (activeAxes.length === 0 || changedTokenIds.length === 0) return null;
  return {
    familyId: family.id,
    initial: initialRow,
    target: targetRow,
    activeAxes,
    targetChangedTokenIds: changedTokenIds,
  };
}
