import type { Locale } from "../../i18n/LocaleContext";
import {
  buildLessonViewModel,
  type FoundationLessonViewModelResult,
} from "./buildLessonViewModel";
import { foundationCatalogs, foundationCopy } from "./fixtures";

/**
 * Thin fixture wrapper over the catalog-parameterized production builder
 * (`./buildLessonViewModel`, Phase 2 Task 1). It supplies the Phase 1 fixture
 * catalogs, their bilingual copy, and the fixture catalog version, so the
 * fixture harness page and every foundation component/test keeps its existing
 * `(fixtureId, locale, seed)` entry point while the actual realization,
 * selection, generation, and localization logic is shared with the deep A1
 * release catalog. Selected ids/prompts/copy are byte-for-byte identical to the
 * pre-extraction builder because the fixture inputs and catalog version are
 * unchanged.
 *
 * This module imports the fixture catalog graph, so it stays out of the release
 * bundle: it is only reachable through the compile-time-gated fixture page. The
 * generic builder it wraps imports no fixtures and may ship freely.
 */

/** A stable catalog version for the fixture harness's deterministic selection. */
export const FOUNDATION_FIXTURE_CATALOG_VERSION =
  "phase1-foundation-fixture-v1";

/** Builds the whole fixture lesson view model for one fixture id/locale/seed. */
export function buildFoundationLessonViewModel(
  fixtureId: string,
  locale: Locale,
  seed: string,
): FoundationLessonViewModelResult {
  return buildLessonViewModel({
    catalogs: foundationCatalogs,
    copy: foundationCopy,
    lessonId: fixtureId,
    locale,
    catalogVersion: FOUNDATION_FIXTURE_CATALOG_VERSION,
    seed,
  });
}

// Re-export the catalog-neutral view-model shapes, error contract, guided
// delta, and localized label/instruction maps so existing foundation
// components and tests keep importing them from this module unchanged.
export {
  foundationAxisLabel,
  foundationAxisLabels,
  foundationGuidedDelta,
  foundationInstructionCopy,
  variantTranslationCopyId,
} from "./buildLessonViewModel";
export type {
  BuildLessonViewModelInput,
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
} from "./buildLessonViewModel";
