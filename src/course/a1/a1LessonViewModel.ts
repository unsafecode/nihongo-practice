import type { Locale } from "../../i18n/LocaleContext";
import type {
  SemanticValue,
  SentenceFamily,
  SentenceVariant,
} from "../foundations/types";
import {
  buildLessonViewModel,
  type FoundationLessonViewModelResult,
} from "../foundations/buildLessonViewModel";
import {
  a1FoundationCatalogs,
  a1FoundationCopy,
  a1SemanticBuiltLessons,
} from "./catalog/catalog";
import {
  A1_RELEASE_CATALOG_VERSION,
  A1_RELEASE_SEED,
} from "./releaseIdentity";

/**
 * Thin release wrapper over the catalog-parameterized production builder
 * (`../foundations/buildLessonViewModel`, Phase 2 Task 1), mirroring
 * `../foundations/foundationViewModel.ts`'s fixture wrapper but supplying the
 * real, validated A1 release catalogs instead of the Phase 1 fixture catalogs
 * (Phase 2 Task 6). Every runtime lesson page, review-queue exercise
 * resolution, and spoken-attempt model shares this one entry point and the
 * one fixed catalog version/seed pair from `./releaseIdentity` (Phase 2
 * §M1), so a target's `targetId`/`prompt` stay identical across every
 * render and across the exercise catalog, the UI, and the release validator.
 *
 * Only the 44 semantic (non-phonetic) lessons resolve through this builder —
 * the sounds module carries no sentence variants (see `catalog/catalog.ts`)
 * and is rendered from `catalog/module01Sounds.ts`'s phonetic item catalog
 * instead (`A1LessonPage.tsx`).
 */

// Re-exported so existing importers of this module's release identity keep
// working unchanged; `./releaseIdentity` is the one place these two values
// are declared (also imported directly by `catalog/validateA1.ts`).
export { A1_RELEASE_CATALOG_VERSION, A1_RELEASE_SEED };

/** Builds the whole release lesson view model for one A1 lesson/locale. */
export function buildA1LessonViewModel(
  lessonId: string,
  locale: Locale,
): FoundationLessonViewModelResult {
  return buildLessonViewModel({
    catalogs: a1FoundationCatalogs,
    copy: a1FoundationCopy,
    lessonId,
    locale,
    catalogVersion: A1_RELEASE_CATALOG_VERSION,
    seed: A1_RELEASE_SEED,
  });
}

/**
 * The structural source for a realized A1 variant. Curriculum view models use
 * this alongside the production-built tokens to resolve lexical glosses by
 * semantic value, never by parsing Japanese or translating a whole sentence.
 */
export interface A1LessonVariantSource {
  readonly variant: SentenceVariant;
  readonly family: SentenceFamily;
  readonly semanticValues: readonly SemanticValue[];
}

const semanticLessonById = new Map(
  a1SemanticBuiltLessons.map((lesson) => [lesson.recipe.id, lesson] as const),
);
const familyById = new Map(
  a1FoundationCatalogs.sentenceFamilies.map((family) => [family.id, family] as const),
);

/** Resolves a variant only when it belongs to the requested semantic lesson. */
export function resolveA1LessonVariantSource(
  lessonId: string,
  variantId: string,
): A1LessonVariantSource | undefined {
  const lesson = semanticLessonById.get(lessonId);
  const variant = lesson?.variants.find((candidate) => candidate.id === variantId);
  if (!variant) return undefined;
  const family = familyById.get(variant.sentenceFamilyId);
  if (!family) return undefined;
  return {
    variant,
    family,
    semanticValues: a1FoundationCatalogs.semanticValues,
  };
}

// Re-export the catalog-neutral view-model shapes, error contract, guided
// delta, and localized label/instruction maps so A1 components and tests
// import them from this one module, matching the fixture wrapper's shape.
export {
  foundationAxisLabel,
  foundationAxisLabels,
  foundationGuidedDelta,
  foundationInstructionCopy,
  variantTranslationCopyId,
} from "../foundations/buildLessonViewModel";
export type {
  FoundationCopy,
  FoundationGuidedModel,
  FoundationLessonViewModel,
  FoundationLessonViewModelResult,
  FoundationLocalizedRow,
  FoundationMatrixModel,
  FoundationRoundModel,
  FoundationRoundTarget,
  FoundationViewModelError,
  FoundationViewModelErrorCode,
} from "../foundations/buildLessonViewModel";
