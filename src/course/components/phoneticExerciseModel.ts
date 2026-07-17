import type { Locale } from "../../i18n/LocaleContext";
import type { AssembledToken } from "../../romaji/types";
import { DAKUTEN, GOJUON } from "../../syllabary/kana";
import {
  module1ItemsByLesson,
  type A1PhoneticExerciseKind,
  type A1PhoneticItem,
} from "../a1/catalog/module01Sounds";
import type {
  ChoicePrompt,
  ExerciseChoiceOption,
  ExercisePromptSegment,
  ExerciseTile,
  TileOrderingPrompt,
} from "../exercises/types";
import { assembledTokenForPhoneticItem } from "./a1SpokenAttemptModel";
import type {
  GeneratedExercise,
  LessonExerciseModelError,
  LessonExercisesModel,
} from "./lessonExerciseModel";

/**
 * Deterministic runtime exercises for the four phonetic (`sounds-*`) lessons
 * (Phase 2 Task 6, finding I1). The sentence engine has no predicate/role for
 * an isolated phonetic item, so these are hand-assembled `ChoicePrompt`/
 * `TileOrderingPrompt` values built directly from `module01Sounds`'s
 * validated 10-item-per-lesson catalog — never a second, hand-authored
 * answer table. Every option/tile is another catalog item's own id/glyph, so
 * `evaluateExercise` (unmodified) and the rest of the generic exercise UI
 * (`LessonExercises`, `ExerciseView`, `ProgressContext`) render, evaluate,
 * and record them exactly like any semantic exercise.
 *
 * One exercise per authored item (exactly 10 per lesson, one target each):
 *   - `minimal-pair-listening` → a 2-option choice between the item and its
 *     authored `contrastWithId` partner (the same pair the recap/comparison
 *     view already displays, per `A1LessonPage.tsx`'s `PhoneticSection`).
 *   - `reading-choice` → a 3-option choice between the item and 2 distractors
 *     drawn from other `reading-choice` items in the *same lesson* via a
 *     deterministic cyclic offset — never a cross-kind or cross-lesson item.
 *   - `mora-tiling` → a tile-ordering prompt whose tiles are only the item's
 *     own characters (no distractor tiles), each tile's romaji derived from
 *     the shared `GOJUON`/`DAKUTEN` kana tables (chōonpu repeats the
 *     preceding mora's vowel) — never a second, hand-authored romaji string.
 *
 * Distractor selection is bounded so no single item is ever shown as an
 * *other* exercise's option more than twice in one lesson (verified for the
 * real catalog in `phoneticExerciseModel.test.ts`): `minimal-pair-listening`
 * distractors are the catalog's own 1:1/near-1:1 contrast pairing, and
 * `reading-choice`'s 2-distractor cyclic ring gives every item in a same-kind
 * subgroup of size N ≥ 3 an in-degree of exactly 2, regardless of N.
 */

// ── Per-mora romaji (mora-tiling only) ───────────────────────────────────────

const KANA_ROMAJI: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const row of [...GOJUON, ...DAKUTEN]) {
    for (const cell of row.cells) {
      if (cell) map.set(cell.kana, cell.romaji);
    }
  }
  return map;
})();

const CHOONPU = "ー";
const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30fa;
const KATAKANA_TO_HIRAGANA_OFFSET = 0x60;

/** A katakana character's hiragana equivalent (the same static offset every
 * kana table in this app assumes), or the character unchanged when it is
 * already hiragana (or otherwise not in the main katakana block). */
function toHiraganaEquivalent(ch: string): string {
  const code = ch.codePointAt(0) ?? 0;
  if (code >= KATAKANA_START && code <= KATAKANA_END) {
    return String.fromCodePoint(code - KATAKANA_TO_HIRAGANA_OFFSET);
  }
  return ch;
}

/** One mora's romaji, resolved only from the shared `GOJUON`/`DAKUTEN` kana
 * tables — never a second, hand-authored romaji table. The chōonpu (ー) has
 * no table entry of its own: it repeats the vowel of the immediately
 * preceding resolved mora (コ "ko" + ー → "o", so "コー" reads "koo"). */
function moraRomaji(kanaChar: string, precedingRomaji: string | null): string {
  if (kanaChar === CHOONPU) {
    const vowel = precedingRomaji?.slice(-1);
    if (!vowel) throw new Error(`phonetic model: chōonpu with no preceding mora`);
    return vowel;
  }
  const romaji = KANA_ROMAJI.get(toHiraganaEquivalent(kanaChar));
  if (!romaji) {
    throw new Error(`phonetic model: no romaji mapping for mora "${kanaChar}"`);
  }
  return romaji;
}

interface Mora {
  readonly jp: string;
  readonly romaji: string;
}

/** A glyph's own moras (Unicode-safe character split), each resolved via
 * {@link moraRomaji}. Concatenating every mora's romaji reproduces the
 * item's authored `roman` field exactly for every real mora-tiling item
 * (verified in `phoneticExerciseModel.test.ts`). */
function moras(glyph: string): readonly Mora[] {
  const result: Mora[] = [];
  for (const ch of Array.from(glyph)) {
    result.push({ jp: ch, romaji: moraRomaji(ch, result.at(-1)?.romaji ?? null) });
  }
  return result;
}

// ── Deterministic option/tile ordering (mirrors engine.ts's byJpThenId) ─────

function byJpThenId(
  left: { readonly jp: string; readonly id: string },
  right: { readonly jp: string; readonly id: string },
): number {
  if (left.jp !== right.jp) return left.jp < right.jp ? -1 : 1;
  if (left.id !== right.id) return left.id < right.id ? -1 : 1;
  return 0;
}

// ── Instruction copy (fixed per exercise kind, IT/EN parity) ────────────────

const CHOICE_INSTRUCTION: Readonly<Record<Locale, string>> = {
  en: "Choose the option that matches the character shown.",
  it: "Scegli l'opzione che corrisponde al carattere mostrato.",
};

const TILE_ORDERING_INSTRUCTION: Readonly<Record<Locale, string>> = {
  en: "Arrange the tiles to spell the word.",
  it: "Disponi i tasselli per comporre la parola.",
};

const NULL_INTENT: Readonly<Record<Locale, string | null>> = { en: null, it: null };

function instructionFor(kind: A1PhoneticExerciseKind): Readonly<Record<Locale, string>> {
  return kind === "mora-tiling" ? TILE_ORDERING_INSTRUCTION : CHOICE_INSTRUCTION;
}

// ── Choice-kind exercises (minimal-pair-listening, reading-choice) ──────────

const SENTENCE_SEGMENT_ID = "target";

function optionFor(item: A1PhoneticItem): ExerciseChoiceOption {
  return {
    id: item.id,
    jp: item.glyph,
    kind: "word",
    ...(item.kana !== item.glyph ? { reading: item.kana } : {}),
  };
}

function sentenceSegmentFor(item: A1PhoneticItem): ExercisePromptSegment {
  return {
    id: SENTENCE_SEGMENT_ID,
    jp: item.glyph,
    kind: "word",
    isBlank: false,
    ...(item.kana !== item.glyph ? { reading: item.kana } : {}),
  };
}

function buildChoicePrompt(
  item: A1PhoneticItem,
  distractors: readonly A1PhoneticItem[],
): ChoicePrompt {
  const correctOption = optionFor(item);
  const options = [correctOption, ...distractors.map(optionFor)].sort(byJpThenId);
  return {
    kind: "choice",
    definitionId: item.exerciseRefId,
    promptCopyId: item.exerciseRefId,
    assessedConceptIds: [item.id],
    assessedLexemeIds: [],
    sentenceSegments: [sentenceSegmentFor(item)],
    blankSegmentId: SENTENCE_SEGMENT_ID,
    options,
    correctOptionId: correctOption.id,
    acceptedOptionIds: [correctOption.id],
  };
}

/** Cyclic-offset distractors within a same-kind subgroup of a lesson: item at
 * `indexInSubgroup` draws the items at `indexInSubgroup + offset` (mod N) for
 * each offset. For any subgroup of size N ≥ 3 and 2 distinct, non-zero
 * offsets, this gives every item in the subgroup an in-degree (reuse-as-
 * distractor count) of exactly `offsets.length` — never unbounded. */
function subgroupDistractors(
  subgroup: readonly A1PhoneticItem[],
  indexInSubgroup: number,
  offsets: readonly number[],
): readonly A1PhoneticItem[] {
  const n = subgroup.length;
  return offsets.map((offset) => subgroup[(indexInSubgroup + offset) % n]!);
}

const READING_CHOICE_OFFSETS = [1, 2] as const;

// ── Tile-ordering exercises (mora-tiling) ───────────────────────────────────

interface MoraTiles {
  readonly tiles: readonly ExerciseTile[];
  readonly tokens: readonly AssembledToken[];
}

function moraTiles(item: A1PhoneticItem): MoraTiles {
  const tiles: ExerciseTile[] = [];
  const tokens: AssembledToken[] = [];
  moras(item.glyph).forEach((mora, index) => {
    const id = `${item.id}-mora-${index}`;
    tiles.push({ id, jp: mora.jp, kind: "word" });
    tokens.push({
      id,
      jp: mora.jp,
      romaji: mora.romaji,
      kind: "lexical",
      boundaryBefore: "attach",
      source: { domain: "exercise", referenceId: item.exerciseRefId },
    });
  });
  return { tiles, tokens };
}

function buildTileOrderingPrompt(
  item: A1PhoneticItem,
): { readonly prompt: TileOrderingPrompt; readonly tokens: readonly AssembledToken[] } {
  const { tiles, tokens } = moraTiles(item);
  return {
    prompt: {
      kind: "tile-ordering",
      definitionId: item.exerciseRefId,
      promptCopyId: item.exerciseRefId,
      assessedConceptIds: [item.id],
      assessedLexemeIds: [],
      tiles: [...tiles].sort(byJpThenId),
      correctTileIds: tiles.map((tile) => tile.id),
      acceptedTileOrders: [],
    },
    tokens,
  };
}

// ── Per-item exercise assembly ──────────────────────────────────────────────

interface PhoneticExerciseBuild {
  readonly exercise: GeneratedExercise;
  readonly tokenEntries: readonly (readonly [string, AssembledToken])[];
  readonly exampleTokenEntries: readonly (readonly [string, readonly AssembledToken[]])[];
}

function buildPhoneticExercise(
  lessonId: string,
  item: A1PhoneticItem,
  itemsById: ReadonlyMap<string, A1PhoneticItem>,
  readingChoiceSubgroup: readonly A1PhoneticItem[],
  readingChoiceIndexById: ReadonlyMap<string, number>,
): PhoneticExerciseBuild | { readonly error: LessonExerciseModelError } {
  const instruction = instructionFor(item.exerciseKind);
  const practicePurpose = "guided-controlled" as const;

  if (item.exerciseKind === "mora-tiling") {
    const { prompt, tokens } = buildTileOrderingPrompt(item);
    return {
      exercise: {
        definitionId: item.exerciseRefId,
        targetExampleId: item.id,
        prompt,
        instruction,
        intentText: NULL_INTENT,
        practicePurpose,
      },
      tokenEntries: tokens.map((token) => [token.id, token] as const),
      exampleTokenEntries: [[item.id, tokens]],
    };
  }

  const distractors =
    item.exerciseKind === "minimal-pair-listening"
      ? (() => {
          const partner = itemsById.get(item.contrastWithId);
          return partner ? [partner] : null;
        })()
      : (() => {
          const index = readingChoiceIndexById.get(item.id);
          return index === undefined
            ? null
            : subgroupDistractors(readingChoiceSubgroup, index, READING_CHOICE_OFFSETS);
        })();

  if (!distractors) {
    return {
      error: {
        code: "phonetic-exercise-unresolved-distractor",
        lessonId,
        detail: `${item.id}->${item.contrastWithId}`,
      },
    };
  }

  const prompt = buildChoicePrompt(item, distractors);
  const ownToken = assembledTokenForPhoneticItem(item);
  const tokenEntries: (readonly [string, AssembledToken])[] = [
    [item.id, ownToken],
    [`${item.id}#${SENTENCE_SEGMENT_ID}`, ownToken],
    ...distractors.map(
      (distractor) => [distractor.id, assembledTokenForPhoneticItem(distractor)] as const,
    ),
  ];
  return {
    exercise: {
      definitionId: item.exerciseRefId,
      targetExampleId: item.id,
      prompt,
      instruction,
      intentText: NULL_INTENT,
      practicePurpose,
    },
    tokenEntries,
    exampleTokenEntries: [[item.id, [ownToken]]],
  };
}

// ── Public per-lesson build ──────────────────────────────────────────────────

export interface PhoneticLessonBuild {
  readonly model: LessonExercisesModel;
  readonly tokenByTileId: ReadonlyMap<string, AssembledToken>;
  readonly tokensByExampleId: ReadonlyMap<string, readonly AssembledToken[]>;
}

/** The four phonetic lesson ids, from `module01Sounds`'s own item roster —
 * the single source of truth, never re-derived by exclusion elsewhere. */
export const phoneticLessonIds: ReadonlySet<string> = new Set(
  Object.keys(module1ItemsByLesson),
);

function emptyBuild(lessonId: string): PhoneticLessonBuild {
  return {
    model: { lessonId, exercises: [], errors: [] },
    tokenByTileId: new Map(),
    tokensByExampleId: new Map(),
  };
}

/** The deterministic runtime exercise model for one phonetic lesson: exactly
 * 10 exercises (one per authored item), plus the real `AssembledToken`s every
 * option/tile resolves to — fail-closed to an empty exercise list (with a
 * `LessonExerciseModelError`) if any item's distractor set cannot be
 * resolved, never a partial or silently-wrong exercise set. */
export function buildPhoneticLessonModel(lessonId: string): PhoneticLessonBuild {
  const items = module1ItemsByLesson[lessonId];
  if (!items || items.length === 0) return emptyBuild(lessonId);

  const itemsById = new Map(items.map((item) => [item.id, item] as const));
  const readingChoiceSubgroup = items.filter((item) => item.exerciseKind === "reading-choice");
  const readingChoiceIndexById = new Map(
    readingChoiceSubgroup.map((item, index) => [item.id, index] as const),
  );

  const exercises: GeneratedExercise[] = [];
  const errors: LessonExerciseModelError[] = [];
  const tokenByTileId = new Map<string, AssembledToken>();
  const tokensByExampleId = new Map<string, readonly AssembledToken[]>();

  for (const item of items) {
    const built = buildPhoneticExercise(
      lessonId,
      item,
      itemsById,
      readingChoiceSubgroup,
      readingChoiceIndexById,
    );
    if ("error" in built) {
      errors.push(built.error);
      continue;
    }
    exercises.push(built.exercise);
    for (const [id, token] of built.tokenEntries) tokenByTileId.set(id, token);
    for (const [id, tokens] of built.exampleTokenEntries) tokensByExampleId.set(id, tokens);
  }

  return {
    model: { lessonId, exercises: errors.length > 0 ? [] : exercises, errors },
    tokenByTileId,
    tokensByExampleId,
  };
}
