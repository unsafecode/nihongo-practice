/**
 * The single source of truth for the A2 release's deterministic selection
 * identity (Phase 3 Task 1, following A1's `releaseIdentity.ts` pattern).
 *
 * `selectVariants` (`../foundations/selectVariants.ts`) ranks every practice
 * candidate by `fnv1a32(catalogVersion|lessonId|roundId|seed|variantId)`, so
 * *which* candidate a round selects is a function of `catalogVersion` and
 * `seed`, not just of the catalog and the round's constraints. When the A2
 * release validator and the runtime lesson-view builder exist (later tasks),
 * both must hand `selectVariants` *exactly* this same pair of values, or the
 * level the validator certifies would not be byte-identical, exercise-for-
 * exercise, to the level a learner is actually served.
 *
 * Every future A2 caller must import these two constants from here — never
 * redeclare its own same-named literal — so the validated release and the
 * shipped release stay provably the same release, avoiding the exact silent
 * parity gap A1 had before this module pattern was introduced there.
 */

/** The stable catalog version for the release's deterministic selection. */
export const A2_RELEASE_CATALOG_VERSION = "a2-release-v1" as const;

/**
 * The fixed deterministic seed every real lesson page, exercise-model
 * resolution, spoken-attempt build, and release-validation run uses. Fixed
 * (not per-visit-random) so a learner's recorded exercise/target ids stay
 * stable across sessions, so the review queue can regenerate the identical
 * prompt later, and so the release validator's selection is provably the
 * runtime's selection.
 */
export const A2_RELEASE_SEED = "a2-release-seed-v1" as const;
