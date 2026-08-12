import type { Locale } from "../../../i18n/LocaleContext";
import {
  BASE_REFERENCE_CATALOG,
  type BaseReferenceId,
} from "../../base/references/catalog";
import { baseReferencePath } from "../../../routing/routePaths";
import { BASE_REFERENCE_ID_BY_INHERITED_CONCEPT } from "./inheritedBase";
import type { AssembledToken } from "../../../romaji/types";
import {
  buildA1LessonViewModel,
  resolveA1LessonVariantSource,
} from "../a1LessonViewModel";
import {
  a1FoundationCatalogs,
  a1FoundationCopy,
} from "../catalog/catalog";
import {
  module1ItemsByLesson,
  type A1PhoneticItem,
} from "../catalog/module01Sounds";
import { a1RuntimeLessonCopy } from "../runtimeCopy";
import {
  a1LearningNoteById,
  a1LessonContentById,
  a1LexemeById,
} from "./catalog";
import type { A1LearningNote } from "./grammar";
import { phoneticItemForPracticeTarget } from "./lessonContentHelpers";
import { a1LexemeByValueId } from "./lexicon";
import { resolveLexeme } from "./resolveLexeme";
import type {
  A1LessonContent,
  A1Lexeme,
  A1PracticeActivity,
  A1PracticeFunction,
} from "./types";
import type { FoundationMatrixModel } from "../../foundations/buildLessonViewModel";

export interface A1CurriculumVocabularyItem {
  readonly id: string;
  readonly kana: string;
  readonly romaji: string;
  readonly meaning: string;
  readonly category: A1Lexeme["category"];
  readonly verb?: A1Lexeme["verb"];
  /** Present only for capstone retrieval vocabulary; never a new-word claim. */
  readonly isReview?: true;
}

export interface A1GlossedToken {
  readonly token: AssembledToken;
  readonly gloss: string | null;
  readonly role: "lexeme" | "particle" | "ending" | "punctuation";
  readonly roleLabel: string;
}

export interface A1CurriculumExample {
  readonly variantId: string;
  readonly tokens: readonly A1GlossedToken[];
  readonly translation: string;
  /**
   * Ephemeral realized Japanese for speech/audio consumers. It is assembled
   * from production tokens and is never authored curriculum data.
   */
  readonly spokenJapanese: string;
}

export interface A1CurriculumPracticeActivity {
  readonly id: string;
  readonly function: A1PracticeFunction;
  readonly interactionKind: A1PracticeActivity["interactionKind"];
  readonly targetRef: A1PracticeActivity["targetRef"];
}

export interface A1CurriculumNote {
  readonly id: string;
  readonly kind: A1LearningNote["kind"];
  readonly title: string;
  readonly meaning: string;
  readonly use: string;
  readonly construction: string;
  readonly typicalMistake: string;
  readonly subjectOmission: string | null;
  readonly pattern: readonly Readonly<{
    kind: A1LearningNote["pattern"][number]["kind"];
    text: string;
    label: string;
  }>[];
  readonly nearestContrast: Readonly<{ id: string; title: string }> | null;
}

export interface A1CurriculumViewModel {
  readonly lessonId: string;
  readonly overview: Readonly<{
    canDo: string;
    situation: string;
    prerequisites: readonly Readonly<{ id: string; title: string }>[];
  }>;
  readonly vocabulary: readonly A1CurriculumVocabularyItem[];
  readonly vocabularyException: string | null;
  readonly note: A1CurriculumNote;
  readonly examples: readonly A1CurriculumExample[];
  readonly dialogue: readonly A1CurriculumExample[] | null;
  /**
   * The exact production matrix for semantic lessons, not an independently
   * copied pattern. Phonetic lessons have no sentence matrix.
   */
  readonly optionalPattern: FoundationMatrixModel | null;
  readonly practice: Readonly<{
    activities: readonly A1CurriculumPracticeActivity[];
  }>;
  readonly recap: Readonly<{
    vocabulary: readonly A1CurriculumVocabularyItem[];
    retrievalCue: string;
    /**
     * The Base-owned grammar concepts this retained A1 lesson *reviews and
     * applies* rather than introduces (Task 16), each linked to the Base
     * progressive reference that actually teaches it. Derived from the
     * lesson's own note prerequisites, so it can never claim a concept the
     * lesson does not lean on, nor omit one it does.
     */
    reviewedBaseReferences: readonly A1ReviewedBaseReference[];
  }>;
}

/** One Base progressive reference a retained A1 lesson sends the learner to. */
export interface A1ReviewedBaseReference {
  readonly conceptId: string;
  readonly referenceId: BaseReferenceId;
  readonly href: string;
  readonly label: string;
}

export type A1CurriculumViewModelErrorCode =
  | "unknown-lesson"
  | "unresolved-content"
  | "unresolved-example"
  | "unresolved-gloss";

export interface A1CurriculumViewModelError {
  readonly code: A1CurriculumViewModelErrorCode;
  readonly lessonId: string;
  readonly referenceId: string;
}

export type A1CurriculumViewModelResult =
  | { readonly ok: true; readonly model: A1CurriculumViewModel }
  | { readonly ok: false; readonly error: A1CurriculumViewModelError };

type LessonContentIndex = Readonly<Record<string, A1LessonContent | undefined>>;
type LexemeIndex = Readonly<Record<string, A1Lexeme | undefined>>;
type NoteIndex = Readonly<Record<string, A1LearningNote | undefined>>;

/**
 * The dependencies are optional only to let unit tests prove every
 * fail-closed branch with a complete replacement lookup. Runtime callers use
 * the frozen release sources below.
 */
export interface A1CurriculumViewModelDependencies {
  readonly lessonContentById: LessonContentIndex;
  readonly lexemeById: LexemeIndex;
  readonly lexemeByValueId: LexemeIndex;
  readonly learningNoteById: NoteIndex;
  readonly phoneticItemsByLesson: Readonly<Record<string, readonly A1PhoneticItem[]>>;
}

const DEFAULT_DEPS: A1CurriculumViewModelDependencies = {
  lessonContentById: a1LessonContentById,
  lexemeById: a1LexemeById,
  lexemeByValueId: a1LexemeByValueId,
  learningNoteById: a1LearningNoteById,
  phoneticItemsByLesson: module1ItemsByLesson,
};

const ROLE_LABELS: Readonly<
  Record<Locale, Readonly<Record<Exclude<A1GlossedToken["role"], "lexeme">, string>>>
> = {
  en: {
    particle: "Particle",
    ending: "Ending",
    punctuation: "Punctuation",
  },
  it: {
    particle: "Particella",
    ending: "Finale",
    punctuation: "Punteggiatura",
  },
};

const LEXEME_ROLE_LABEL: Readonly<Record<Locale, string>> = {
  en: "Word",
  it: "Parola",
};

function fail(
  code: A1CurriculumViewModelErrorCode,
  lessonId: string,
  referenceId: string,
): A1CurriculumViewModelResult {
  return { ok: false, error: { code, lessonId, referenceId } };
}

function nonEmpty(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function isSpokenTarget(
  targetRef: A1PracticeActivity["targetRef"],
): targetRef is Readonly<{ spokenVariantId: string }> {
  return "spokenVariantId" in targetRef;
}

function roleForToken(token: AssembledToken): A1GlossedToken["role"] {
  switch (token.kind) {
    case "lexical":
      return "lexeme";
    case "particle":
      return "particle";
    case "morpheme":
      return "ending";
    case "punctuation":
      return "punctuation";
  }
}

function roleLabel(
  token: AssembledToken,
  role: A1GlossedToken["role"],
  note: A1LearningNote,
  locale: Locale,
): string {
  if (role === "lexeme") return LEXEME_ROLE_LABEL[locale];
  const noteKind = role === "ending" ? "ending" : role;
  const structural = note.pattern.find(
    (pattern) => pattern.kind === noteKind && pattern.text === token.jp,
  );
  return structural?.label[locale] ?? ROLE_LABELS[locale][role];
}

type GlossedSemanticTokenResult =
  | {
      readonly ok: true;
      readonly tokens: readonly A1GlossedToken[];
      readonly lexemeIds: readonly string[];
    }
  | { readonly ok: false; readonly referenceId: string };

function glossSemanticTokens(
  lessonId: string,
  variantId: string,
  tokens: readonly AssembledToken[],
  note: A1LearningNote,
  locale: Locale,
  deps: A1CurriculumViewModelDependencies,
): GlossedSemanticTokenResult {
  const source = resolveA1LessonVariantSource(lessonId, variantId);
  if (!source) return { ok: false, referenceId: variantId };

  const glossed: A1GlossedToken[] = [];
  const lexemeIds: string[] = [];
  for (const token of tokens) {
    const role = roleForToken(token);
    if (role !== "lexeme") {
      glossed.push({
        token,
        gloss: null,
        role,
        roleLabel: roleLabel(token, role, note, locale),
      });
      continue;
    }
    const resolved = resolveLexeme({
      token,
      variant: source.variant,
      family: source.family,
      semanticValues: source.semanticValues,
      lexemeByValueId: deps.lexemeByValueId,
    });
    if (!resolved.ok || !nonEmpty(resolved.lexeme.meaning[locale])) {
      return {
        ok: false,
        referenceId: resolved.ok ? resolved.lexeme.id : resolved.referenceId,
      };
    }
    lexemeIds.push(resolved.lexeme.id);
    glossed.push({
      token,
      gloss: resolved.lexeme.meaning[locale],
      role,
      roleLabel: roleLabel(token, role, note, locale),
    });
  }
  return { ok: true, tokens: glossed, lexemeIds };
}

type ResolvedSemanticExample =
  | {
      readonly ok: true;
      readonly example: A1CurriculumExample;
      readonly lexemeIds: readonly string[];
    }
  | { readonly ok: false; readonly referenceId: string; readonly gloss: boolean };

function resolveSemanticExample(
  lessonId: string,
  variantId: string,
  rowsByVariantId: ReadonlyMap<string, {
    readonly variantId: string;
    readonly tokens: readonly AssembledToken[];
    readonly translation: string;
  }>,
  note: A1LearningNote,
  locale: Locale,
  deps: A1CurriculumViewModelDependencies,
): ResolvedSemanticExample {
  const row = rowsByVariantId.get(variantId);
  if (!row || !nonEmpty(row.translation)) {
    return { ok: false, referenceId: variantId, gloss: false };
  }
  const tokenResult = glossSemanticTokens(
    lessonId,
    variantId,
    row.tokens,
    note,
    locale,
    deps,
  );
  if (!tokenResult.ok) {
    return { ok: false, referenceId: tokenResult.referenceId, gloss: true };
  }
  return {
    ok: true,
    example: {
      variantId,
      tokens: tokenResult.tokens,
      translation: row.translation,
      spokenJapanese: row.tokens.map((token) => token.jp).join(""),
    },
    lexemeIds: tokenResult.lexemeIds,
  };
}

function vocabularyItem(
  lexeme: A1Lexeme,
  locale: Locale,
  review: boolean,
): A1CurriculumVocabularyItem | undefined {
  const meaning = lexeme.meaning[locale];
  if (!nonEmpty(meaning)) return undefined;
  return {
    id: lexeme.id,
    kana: lexeme.kana,
    romaji: lexeme.romaji,
    meaning,
    category: lexeme.category,
    ...(lexeme.verb ? { verb: lexeme.verb } : {}),
    ...(review ? { isReview: true } : {}),
  };
}

function resolveVocabulary(
  ids: readonly string[],
  locale: Locale,
  review: boolean,
  deps: A1CurriculumViewModelDependencies,
): { readonly ok: true; readonly items: readonly A1CurriculumVocabularyItem[] }
  | { readonly ok: false; readonly referenceId: string } {
  const items: A1CurriculumVocabularyItem[] = [];
  for (const id of ids) {
    const item = deps.lexemeById[id];
    const vocabulary = item ? vocabularyItem(item, locale, review) : undefined;
    if (!vocabulary) return { ok: false, referenceId: id };
    items.push(vocabulary);
  }
  return { ok: true, items };
}

function resolveNote(
  noteId: string,
  locale: Locale,
  deps: A1CurriculumViewModelDependencies,
): { readonly ok: true; readonly note: A1CurriculumNote; readonly source: A1LearningNote }
  | { readonly ok: false; readonly referenceId: string } {
  const note = deps.learningNoteById[noteId];
  if (
    !note ||
    !nonEmpty(note.title[locale]) ||
    !nonEmpty(note.meaning[locale]) ||
    !nonEmpty(note.use[locale]) ||
    !nonEmpty(note.construction[locale]) ||
    !nonEmpty(note.typicalMistake[locale])
  ) {
    return { ok: false, referenceId: noteId };
  }
  const contrast =
    note.nearestContrastId === undefined
      ? null
      : deps.learningNoteById[note.nearestContrastId];
  if (note.nearestContrastId !== undefined && (!contrast || !nonEmpty(contrast.title[locale]))) {
    return { ok: false, referenceId: note.nearestContrastId };
  }
  const pattern = note.pattern.map((token) => ({
    kind: token.kind,
    text: token.text,
    label: token.label[locale],
  }));
  if (pattern.some((token) => !nonEmpty(token.label))) {
    return { ok: false, referenceId: noteId };
  }
  return {
    ok: true,
    source: note,
    note: {
      id: note.id,
      kind: note.kind,
      title: note.title[locale],
      meaning: note.meaning[locale],
      use: note.use[locale],
      construction: note.construction[locale],
      typicalMistake: note.typicalMistake[locale],
      subjectOmission: note.subjectOmissionNote?.[locale] ?? null,
      pattern,
      nearestContrast:
        contrast === null || contrast === undefined
          ? null
          : { id: contrast.id, title: contrast.title[locale] },
    },
  };
}

function phoneticGloss(
  item: A1PhoneticItem,
  lexemes: LexemeIndex,
  locale: Locale,
): string | null {
  const anchor = Object.values(lexemes).find(
    (lexeme) =>
      lexeme !== undefined &&
      (lexeme.kana === item.kana || lexeme.kana === item.glyph),
  );
  return anchor && nonEmpty(anchor.meaning[locale]) ? anchor.meaning[locale] : null;
}

function assembledTokenForPhoneticItem(item: A1PhoneticItem): AssembledToken {
  return {
    id: item.id,
    jp: item.glyph,
    romaji: item.roman,
    kind: "lexical",
    boundaryBefore: "attach",
    source: { domain: "catalog", referenceId: item.id },
    ...(item.kana !== item.glyph ? { reading: item.kana } : {}),
  };
}

function resolvePhoneticExample(
  item: A1PhoneticItem,
  locale: Locale,
  deps: A1CurriculumViewModelDependencies,
): { readonly ok: true; readonly example: A1CurriculumExample }
  | { readonly ok: false; readonly referenceId: string } {
  const translation = a1FoundationCopy[locale][item.hintCopyId];
  if (!nonEmpty(translation)) return { ok: false, referenceId: item.hintCopyId };
  const token = assembledTokenForPhoneticItem(item);
  return {
    ok: true,
    example: {
      variantId: item.id,
      tokens: [
        {
          token,
          gloss: phoneticGloss(item, deps.lexemeById, locale),
          role: "lexeme",
          roleLabel: LEXEME_ROLE_LABEL[locale],
        },
      ],
      translation,
      spokenJapanese: item.glyph,
    },
  };
}

function resolvePractice(
  lessonId: string,
  content: A1LessonContent,
  semantic: ReturnType<typeof buildA1LessonViewModel> | null,
  phoneticItems: readonly A1PhoneticItem[] | undefined,
): { readonly ok: true; readonly activities: readonly A1CurriculumPracticeActivity[] }
  | { readonly ok: false; readonly referenceId: string } {
  const activities: A1CurriculumPracticeActivity[] = [];
  for (const activity of content.practiceBlueprint.activities) {
    if (isSpokenTarget(activity.targetRef)) {
      const spokenTarget = activity.targetRef;
      const resolved = phoneticItems
        ? phoneticItems.some((item) => item.id === spokenTarget.spokenVariantId)
        : resolveA1LessonVariantSource(lessonId, spokenTarget.spokenVariantId) !== undefined;
      if (!resolved) return { ok: false, referenceId: spokenTarget.spokenVariantId };
    } else if (phoneticItems) {
      const item = phoneticItemForPracticeTarget(phoneticItems, activity.targetRef);
      if (!item) return { ok: false, referenceId: `${activity.targetRef.round}:${activity.targetRef.index}` };
      const expectedKind = item.exerciseKind === "mora-tiling" ? "tile-ordering" : "choice";
      if (activity.interactionKind !== expectedKind) return { ok: false, referenceId: activity.id };
    } else {
      if (!semantic?.ok) return { ok: false, referenceId: lessonId };
      const round =
        activity.targetRef.round === "one"
          ? semantic.model.rounds[0]
          : semantic.model.rounds[1];
      const target = round.targets[activity.targetRef.index];
      if (!target || target.prompt.kind !== activity.interactionKind) {
        return { ok: false, referenceId: activity.id };
      }
    }
    activities.push({
      id: activity.id,
      function: activity.function,
      interactionKind: activity.interactionKind,
      targetRef: activity.targetRef,
    });
  }
  return { ok: true, activities };
}

/**
 * Builds the pure learner-facing A1 curriculum model from the existing
 * canonical catalogs and production realization. Any unresolved dependency
 * returns one typed error; no partial success is ever returned.
 */
/**
 * The Base progressive references a retained A1 lesson points back to.
 *
 * Only concepts the lesson genuinely requires — from its learning note's
 * prerequisites and its authored `prerequisiteConceptIds` — and only those Base
 * first-teaches (Task 16 containment). The result is deduplicated and sorted so
 * the recap renders deterministically in both locales.
 */
function reviewedBaseReferencesFor(
  requiredConceptIds: readonly string[],
  prerequisiteConceptIds: readonly string[],
  locale: Locale,
): readonly A1ReviewedBaseReference[] {
  const conceptIds = [
    ...new Set([...requiredConceptIds, ...prerequisiteConceptIds]),
  ]
    .filter((conceptId) => BASE_REFERENCE_ID_BY_INHERITED_CONCEPT[conceptId] !== undefined)
    .sort();

  return conceptIds.flatMap((conceptId) => {
    const referenceId = BASE_REFERENCE_ID_BY_INHERITED_CONCEPT[conceptId]!;
    const definition = BASE_REFERENCE_CATALOG.find(
      (candidate) => candidate.id === referenceId,
    );
    // Base owns the label; A1 never restates it in a locale file.
    const label = definition?.copy[locale].label;
    return label === undefined
      ? []
      : [{ conceptId, referenceId, href: baseReferencePath(referenceId), label }];
  });
}

export function buildA1CurriculumViewModel(
  lessonId: string,
  locale: Locale,
  overrides: Partial<A1CurriculumViewModelDependencies> = {},
): A1CurriculumViewModelResult {
  const deps = { ...DEFAULT_DEPS, ...overrides };
  const content = deps.lessonContentById[lessonId];
  if (!content) return fail("unknown-lesson", lessonId, lessonId);

  const noteResult = resolveNote(content.learningNoteId, locale, deps);
  if (!noteResult.ok) return fail("unresolved-content", lessonId, noteResult.referenceId);

  const phoneticItems = deps.phoneticItemsByLesson[lessonId];
  const semantic = phoneticItems ? null : buildA1LessonViewModel(lessonId, locale);
  if (!phoneticItems && (!semantic || !semantic.ok)) {
    return fail("unresolved-content", lessonId, lessonId);
  }
  const semanticModel = semantic?.ok ? semantic.model : null;

  const prerequisiteCopy = a1RuntimeLessonCopy(locale);
  const prerequisites: { id: string; title: string }[] = [];
  for (const prerequisiteId of content.prerequisiteLessonIds) {
    const title = prerequisiteCopy[prerequisiteId]?.title;
    if (!nonEmpty(title)) return fail("unresolved-content", lessonId, prerequisiteId);
    prerequisites.push({ id: prerequisiteId, title });
  }

  const canDo = phoneticItems
    ? (() => {
        const canDoDefinition = a1FoundationCatalogs.canDos.find((candidate) =>
          candidate.lessonIds.includes(lessonId),
        );
        return canDoDefinition
          ? a1FoundationCopy[locale][canDoDefinition.descriptorCopyId]
          : undefined;
      })()
    : semanticModel!.canDoDescriptor;
  if (!nonEmpty(canDo) || !nonEmpty(content.situation[locale]) || !nonEmpty(content.retrievalCue[locale])) {
    return fail("unresolved-content", lessonId, lessonId);
  }

  const examples: A1CurriculumExample[] = [];
  const dialogue: A1CurriculumExample[] = [];
  const reviewedLexemeIds: string[] = [];

  if (phoneticItems) {
    const itemById = new Map(phoneticItems.map((item) => [item.id, item] as const));
    for (const itemId of content.workedExampleVariantIds) {
      const item = itemById.get(itemId);
      if (!item) return fail("unresolved-example", lessonId, itemId);
      const example = resolvePhoneticExample(item, locale, deps);
      if (!example.ok) return fail("unresolved-content", lessonId, example.referenceId);
      examples.push(example.example);
    }
    if (content.dialogue !== undefined) {
      return fail("unresolved-example", lessonId, content.dialogue.turnVariantIds[0]);
    }
  } else {
    const rowsByVariantId = new Map(
      semanticModel!.matrix.rows.map((row) => [row.variantId, row] as const),
    );
    for (const variantId of content.workedExampleVariantIds) {
      const example = resolveSemanticExample(
        lessonId,
        variantId,
        rowsByVariantId,
        noteResult.source,
        locale,
        deps,
      );
      if (!example.ok) {
        return fail(
          example.gloss ? "unresolved-gloss" : "unresolved-example",
          lessonId,
          example.referenceId,
        );
      }
      examples.push(example.example);
      reviewedLexemeIds.push(...example.lexemeIds);
    }
    for (const variantId of content.dialogue?.turnVariantIds ?? []) {
      const example = resolveSemanticExample(
        lessonId,
        variantId,
        rowsByVariantId,
        noteResult.source,
        locale,
        deps,
      );
      if (!example.ok) {
        return fail(
          example.gloss ? "unresolved-gloss" : "unresolved-example",
          lessonId,
          example.referenceId,
        );
      }
      dialogue.push(example.example);
      reviewedLexemeIds.push(...example.lexemeIds);
    }
  }

  const review = content.newLexemeIds.length === 0;
  const vocabularyIds = review
    ? [...new Set(reviewedLexemeIds)].slice(0, 6)
    : content.newLexemeIds;
  if (review && vocabularyIds.length < 4) {
    return fail("unresolved-content", lessonId, "capstone-review-vocabulary");
  }
  const vocabularyResult = resolveVocabulary(vocabularyIds, locale, review, deps);
  if (!vocabularyResult.ok) {
    return fail("unresolved-content", lessonId, vocabularyResult.referenceId);
  }

  const vocabularyException = content.vocabularyException?.reason[locale] ?? null;
  if (
    content.vocabularyException !== undefined &&
    !nonEmpty(vocabularyException ?? undefined)
  ) {
    return fail("unresolved-content", lessonId, "vocabulary-exception");
  }

  const practice = resolvePractice(lessonId, content, semantic, phoneticItems);
  if (!practice.ok) return fail("unresolved-content", lessonId, practice.referenceId);

  return {
    ok: true,
    model: {
      lessonId,
      overview: {
        canDo,
        situation: content.situation[locale],
        prerequisites,
      },
      vocabulary: vocabularyResult.items,
      vocabularyException,
      note: noteResult.note,
      examples,
      dialogue: dialogue.length > 0 ? dialogue : null,
      optionalPattern: semanticModel?.matrix ?? null,
      practice: { activities: practice.activities },
      recap: {
        vocabulary: vocabularyResult.items,
        retrievalCue: content.retrievalCue[locale],
        reviewedBaseReferences: reviewedBaseReferencesFor(
          noteResult.source.requiredConceptIds,
          content.prerequisiteConceptIds,
          locale,
        ),
      },
    },
  };
}
