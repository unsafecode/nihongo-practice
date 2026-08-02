import type { Locale } from "../../../i18n/LocaleContext";
import {
  buildLessonViewModel,
  type FoundationLessonViewModel,
  type FoundationLessonViewModelResult,
} from "../../foundations/buildLessonViewModel";
import { a2FoundationCatalogs, a2FoundationCopy, a2SemanticBuiltLessons } from "../catalog/catalog";
import {
  A2_KANJI_ENTRIES,
  A2_KANJI_EXPOSURES,
  A2_KANJI_READINGS,
} from "../kanji/a2KanjiCatalog";
import type {
  KanjiEntry,
  KanjiExposure,
  KanjiExposureStage,
  KanjiReading,
} from "../kanji/kanjiTypes";
import { A2_CONTEXTUAL_WORDS } from "../kanji/a2ContextualWords";
import { A2_RELEASE_CATALOG_VERSION, A2_RELEASE_SEED } from "../releaseIdentity";

/**
 * The single fail-closed source the A2 lesson page renders from (Phase 3
 * Task 8, plan step 7), mirroring A1's `buildA1LessonViewModel`: it resolves
 * one A2 lesson into the ordered models + two practice rounds from the frozen,
 * validated `a2FoundationCatalogs` (via the shared catalog-parameterized
 * `buildLessonViewModel`) *plus* that lesson's resolved contextual-kanji
 * exposures — each glyph's stage at this lesson, its contextual reading, and
 * its semantic-gloss copy reference — drawn from the frozen kanji catalog
 * (Phase 3 Task 3) via the lesson recipe's own wired `kanjiExposureIds`.
 *
 * It is fail-closed: an unknown lesson, a foundation build failure, or a kanji
 * exposure/entry/reading reference that does not resolve all surface as an
 * explicit error — never a success-shaped empty model the page would render as
 * a broken-but-silent lesson.
 */

/** One resolved contextual-kanji exposure, ready for the lesson page/kanji UI. */
export interface A2KanjiExposureView {
  readonly exposureId: string;
  readonly kanjiId: string;
  /** The kanji glyph itself (e.g. 話). */
  readonly glyph: string;
  /** This exposure's stage at this lesson (drives the assistance policy/UI). */
  readonly stage: KanjiExposureStage;
  /** The glyph's own kana reading inside this exposure's contextual lexeme. */
  readonly reading: string;
  /** The glyph's own romaji reading inside this exposure's contextual lexeme. */
  readonly romaji: string;
  /** The catalog reading id (so the page can reconstruct a `KanjiExposure`). */
  readonly readingId: string;
  /** The semantic-gloss copy id for this glyph in this lexeme (never Japanese). */
  readonly meaningCopyId: string;
  readonly lexemeSenseId: string;
  readonly contextId: string;
  /** The contextual word this glyph lives in. */
  readonly word: string;
  /** The contextual word's full kana reading (for ruby). */
  readonly wordKana: string;
}

export interface A2LessonViewModel {
  readonly lessonId: string;
  /** The ordered models + two practice rounds from the frozen A2 catalog. */
  readonly foundation: FoundationLessonViewModel;
  /** This lesson's resolved contextual-kanji exposures, in recipe order. */
  readonly kanjiExposures: readonly A2KanjiExposureView[];
}

export type A2LessonViewModelErrorCode =
  | "unknown-lesson"
  | "foundation-unavailable"
  | "unknown-kanji-exposure"
  | "unknown-kanji-entry"
  | "unknown-kanji-reading";

export interface A2LessonViewModelError {
  readonly code: A2LessonViewModelErrorCode;
  readonly lessonId: string;
  readonly referenceId?: string;
  readonly detail?: string;
}

export type A2LessonViewModelResult =
  | { readonly ok: true; readonly model: A2LessonViewModel }
  | { readonly ok: false; readonly error: A2LessonViewModelError };

/** The kanji-catalog lookups {@link resolveA2KanjiExposureViews} resolves against. */
export interface A2KanjiResolutionDeps {
  readonly entriesById: ReadonlyMap<string, KanjiEntry>;
  readonly readingsById: ReadonlyMap<string, KanjiReading>;
  readonly exposuresById: ReadonlyMap<string, KanjiExposure>;
}

export type A2KanjiResolutionResult =
  | { readonly ok: true; readonly views: readonly A2KanjiExposureView[] }
  | { readonly ok: false; readonly error: A2LessonViewModelError };

/**
 * Resolves a lesson's `kanjiExposureIds` into full exposure views, purely and
 * fail-closed: every referenced exposure must exist in the catalog, and its
 * `kanjiId`/`readingId` must resolve to a real entry/reading. A missing
 * reference returns a structured error rather than dropping the exposure — a
 * silently vanished glyph would be a success-shaped hole in an assessed
 * lesson. Kept pure (deps injected) so the fail-closed branches are unit
 * testable without a malformed real catalog.
 */
export function resolveA2KanjiExposureViews(
  lessonId: string,
  exposureIds: readonly string[],
  deps: A2KanjiResolutionDeps,
): A2KanjiResolutionResult {
  const views: A2KanjiExposureView[] = [];
  for (const exposureId of exposureIds) {
    const exposure = deps.exposuresById.get(exposureId);
    if (!exposure) {
      return {
        ok: false,
        error: { code: "unknown-kanji-exposure", lessonId, referenceId: exposureId },
      };
    }
    const entry = deps.entriesById.get(exposure.kanjiId);
    if (!entry) {
      return {
        ok: false,
        error: { code: "unknown-kanji-entry", lessonId, referenceId: exposure.kanjiId },
      };
    }
    const reading = deps.readingsById.get(exposure.readingId);
    if (!reading) {
      return {
        ok: false,
        error: { code: "unknown-kanji-reading", lessonId, referenceId: exposure.readingId },
      };
    }
    const senseSlug = exposure.lexemeSenseId.replace(/^a2-sense-/, "");
    const ctxWord = A2_CONTEXTUAL_WORDS[senseSlug];
    views.push({
      exposureId: exposure.id,
      kanjiId: entry.id,
      glyph: entry.glyph,
      stage: exposure.stage,
      reading: reading.kana,
      romaji: reading.romaji,
      readingId: reading.id,
      meaningCopyId: entry.meaningCopyId,
      lexemeSenseId: exposure.lexemeSenseId,
      contextId: exposure.contextId,
      word: ctxWord?.word ?? entry.glyph,
      wordKana: ctxWord?.wordKana ?? reading.kana,
    });
  }
  return { ok: true, views };
}

const recipeByLessonId = new Map(
  a2SemanticBuiltLessons.map((built) => [built.recipe.id, built.recipe]),
);

/**
 * The raw A2 foundation view model (models + rounds) for one lesson/locale,
 * built from the frozen A2 catalog with the release's fixed catalog version/
 * seed. Shared by {@link buildA2LessonViewModel}, the lesson-exercise model,
 * and the A2 spoken-attempt model so every consumer selects byte-identical
 * targets — the exact single-entry-point discipline A1 uses via
 * `buildA1LessonViewModel`.
 */
export function buildA2FoundationViewModel(
  lessonId: string,
  locale: Locale,
): FoundationLessonViewModelResult {
  return buildLessonViewModel({
    catalogs: a2FoundationCatalogs,
    copy: a2FoundationCopy,
    lessonId,
    locale,
    catalogVersion: A2_RELEASE_CATALOG_VERSION,
    seed: A2_RELEASE_SEED,
  });
}

const KANJI_DEPS: A2KanjiResolutionDeps = {
  entriesById: new Map(A2_KANJI_ENTRIES.map((entry) => [entry.id, entry])),
  readingsById: new Map(A2_KANJI_READINGS.map((reading) => [reading.id, reading])),
  exposuresById: new Map(A2_KANJI_EXPOSURES.map((exposure) => [exposure.id, exposure])),
};

/**
 * Builds the whole release lesson view model for one A2 lesson/locale: the
 * frozen catalog's models/rounds plus the lesson's resolved kanji exposures.
 * Fail-closed (see the module doc comment).
 */
export function buildA2LessonViewModel(
  lessonId: string,
  locale: Locale,
): A2LessonViewModelResult {
  const recipe = recipeByLessonId.get(lessonId);
  if (!recipe) {
    return { ok: false, error: { code: "unknown-lesson", lessonId } };
  }

  const foundationResult = buildA2FoundationViewModel(lessonId, locale);
  if (!foundationResult.ok) {
    return {
      ok: false,
      error: {
        code: "foundation-unavailable",
        lessonId,
        detail: foundationResult.error.code,
      },
    };
  }

  const kanjiResult = resolveA2KanjiExposureViews(
    lessonId,
    recipe.kanjiExposureIds,
    KANJI_DEPS,
  );
  if (!kanjiResult.ok) return { ok: false, error: kanjiResult.error };

  return {
    ok: true,
    model: {
      lessonId,
      foundation: foundationResult.model,
      kanjiExposures: kanjiResult.views,
    },
  };
}
