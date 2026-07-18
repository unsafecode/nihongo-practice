/**
 * The single source of truth for the A1 release's deterministic selection
 * identity (Phase 2 §M1: seed/version gate parity).
 *
 * `selectVariants` (`../foundations/selectVariants.ts`) ranks every practice
 * candidate by `fnv1a32(catalogVersion|lessonId|roundId|seed|variantId)`, so
 * *which* candidate a round selects is a function of `catalogVersion` and
 * `seed`, not just of the catalog and the round's constraints. Both the
 * release validator (`catalog/validateA1.ts`, which wraps
 * `validateFoundations` to re-run the very same selection for its release
 * gate checks) and the runtime lesson-view builder (`a1LessonViewModel.ts`,
 * which every real lesson page, review-queue resolution, and spoken-attempt
 * model calls through) must hand `selectVariants` *exactly* the same pair of
 * values, or the level the validator certifies is not byte-identical,
 * exercise-for-exercise, to the level a learner is actually served.
 *
 * Before this module existed, the validator and the runtime builder each
 * declared their own same-named `A1_RELEASE_CATALOG_VERSION` /
 * `A1_RELEASE_SEED` constants with *different* literal values
 * (`"a1-release"` / `"seed-a1-release"` vs. `"a1-release-v1"` /
 * `"a1-release-seed-v1"`) — a silent parity gap despite both symbols reading
 * as if they were the release's one fixed identity. Every caller must import
 * these two constants from here (never redeclare its own), so the validated
 * release and the shipped release are provably the same release.
 */

/** The stable catalog version for the release's deterministic selection. */
export const A1_RELEASE_CATALOG_VERSION = "a1-release-v1" as const;

/**
 * The fixed deterministic seed every real lesson page, exercise-model
 * resolution, spoken-attempt build, and release-validation run uses. Fixed
 * (not per-visit-random) so a learner's recorded exercise/target ids stay
 * stable across sessions, so the review queue can regenerate the identical
 * prompt later, and so the release validator's selection is provably the
 * runtime's selection.
 */
export const A1_RELEASE_SEED = "a1-release-seed-v1" as const;
