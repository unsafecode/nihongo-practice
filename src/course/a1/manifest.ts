/**
 * Immutable canonical A1 manifest for the published 16-module / 64-lesson
 * release. Every exported array and map is derived from its declarative source
 * and deep-frozen. Outcome copy IDs are locale-independent ASCII identifiers;
 * the manifest carries no learner-visible text.
 */

import { deepFreeze } from "../foundations/deepFreeze";
import type {
  A1LessonContract,
  A1LessonManifestEntry,
  A1ManifestSpec,
  A1ManifestValidationError,
  A1ManifestValidationResult,
  A1ModuleManifestEntry,
} from "./types";
import type { LessonId, ModuleId } from "../foundations/types";

export type { A1ManifestSpec } from "./types";

// ---------------------------------------------------------------------------
// Declarative source of truth
// ---------------------------------------------------------------------------

/** Canonical module order. Lesson IDs, URLs, and progress keys remain stable. */
const CANONICAL_MODULE_ORDER: readonly ModuleId[] = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
  "introductions",
  "essential-questions",
  "actions",
  "routines",
  "past-negative",
  "places",
  "people",
  "descriptions",
  "shopping",
  "existence-needs",
  "capstones",
];

const CAPSTONE_MODULE_ID: ModuleId = "capstones";

/** Build the canonical `${module}-${1..4}` lesson-ID list for a module. */
function fourLessons(moduleId: ModuleId): LessonId[] {
  return [1, 2, 3, 4].map((n) => `${moduleId}-${n}`);
}

function buildManifestSpec(
  moduleOrder: readonly ModuleId[],
): A1ManifestSpec {
  const lessonIdsByModule: Record<ModuleId, LessonId[]> = {};
  const modulePrerequisites: Record<ModuleId, ModuleId[]> = {};
  const moduleContracts: Record<ModuleId, A1LessonContract> = {};

  moduleOrder.forEach((moduleId, index) => {
    lessonIdsByModule[moduleId] = fourLessons(moduleId);
    modulePrerequisites[moduleId] =
      index === 0 ? [] : [moduleOrder[index - 1]];
    if (moduleId === CAPSTONE_MODULE_ID) {
      moduleContracts[moduleId] = "synthesis";
    } else if (index === 0) {
      moduleContracts[moduleId] = "phonetic";
    } else {
      moduleContracts[moduleId] = "instructional";
    }
  });

  return {
    moduleIds: [...moduleOrder],
    lessonIdsByModule,
    modulePrerequisites,
    moduleContracts,
    capstoneModuleId: CAPSTONE_MODULE_ID,
    aliases: { "sounds-5": "sounds-4" },
  };
}

/** The deep-frozen canonical A1 release spec. */
export const A1_MANIFEST_SPEC: A1ManifestSpec = deepFreeze(
  buildManifestSpec(CANONICAL_MODULE_ORDER),
);

/**
 * @deprecated The Foundations plan is now canonical. This identity alias is
 * retained for downstream authoring integrations that still import the legacy
 * expanded name; it must never diverge from {@link A1_MANIFEST_SPEC}.
 */
export const A1_EXPANDED_MANIFEST_SPEC = A1_MANIFEST_SPEC;

// ---------------------------------------------------------------------------
// Published release derived ID arrays and maps
// ---------------------------------------------------------------------------

export const A1_MODULE_IDS: readonly ModuleId[] = deepFreeze([
  ...A1_MANIFEST_SPEC.moduleIds,
]);

export const A1_LESSON_IDS_BY_MODULE: Readonly<
  Record<ModuleId, readonly LessonId[]>
> = deepFreeze(
  Object.fromEntries(
    A1_MODULE_IDS.map((moduleId) => [
      moduleId,
      [...A1_MANIFEST_SPEC.lessonIdsByModule[moduleId]],
    ]),
  ),
);

export const A1_LESSON_IDS: readonly LessonId[] = deepFreeze(
  A1_MODULE_IDS.flatMap((moduleId) => [...A1_LESSON_IDS_BY_MODULE[moduleId]]),
);

const RETAINED_RUNTIME_MODULE_ORDER: readonly ModuleId[] = [
  "introductions",
  "essential-questions",
  "actions",
  "routines",
  "past-negative",
  "places",
  "people",
  "descriptions",
  "shopping",
  "existence-needs",
  "capstones",
];

export const A1_RETAINED_MODULE_IDS: readonly ModuleId[] = deepFreeze([
  ...RETAINED_RUNTIME_MODULE_ORDER,
]);

export const A1_RETAINED_LESSON_IDS_BY_MODULE: Readonly<
  Partial<Record<ModuleId, readonly LessonId[]>>
> = deepFreeze(
  Object.fromEntries(
    A1_RETAINED_MODULE_IDS.map((moduleId) => [
      moduleId,
      [...A1_LESSON_IDS_BY_MODULE[moduleId]],
    ]),
  ),
);

export const A1_RETAINED_LESSON_IDS: readonly LessonId[] = deepFreeze(
  A1_RETAINED_MODULE_IDS.flatMap((moduleId) => [
    ...(A1_RETAINED_LESSON_IDS_BY_MODULE[moduleId] ?? []),
  ]),
);

export const A1_CAPSTONE_LESSON_IDS: readonly LessonId[] = deepFreeze([
  ...A1_LESSON_IDS_BY_MODULE[A1_MANIFEST_SPEC.capstoneModuleId],
]);

export const A1_CANONICAL_POSITIONS: Readonly<Record<LessonId, number>> =
  deepFreeze(
    Object.fromEntries(A1_LESSON_IDS.map((id, index) => [id, index + 1])),
  );

// ---------------------------------------------------------------------------
// Deprecated expanded names
// ---------------------------------------------------------------------------

/** @deprecated Use {@link A1_MODULE_IDS}; this is the same frozen array. */
export const A1_EXPANDED_MODULE_IDS = A1_MODULE_IDS;
/** @deprecated Use {@link A1_LESSON_IDS_BY_MODULE}; this is the same frozen map. */
export const A1_EXPANDED_LESSON_IDS_BY_MODULE = A1_LESSON_IDS_BY_MODULE;
/** @deprecated Use {@link A1_LESSON_IDS}; this is the same frozen array. */
export const A1_EXPANDED_LESSON_IDS = A1_LESSON_IDS;
/** @deprecated Use {@link A1_CANONICAL_POSITIONS}; this is the same frozen map. */
export const A1_EXPANDED_CANONICAL_POSITIONS = A1_CANONICAL_POSITIONS;

export const A1_LEGACY_LESSON_ALIASES: Readonly<Record<LessonId, LessonId>> =
  deepFreeze({ ...A1_MANIFEST_SPEC.aliases });

/** Outcome copy IDs are locale-independent ASCII identifiers. */
function moduleOutcomeCopyId(moduleId: ModuleId): string {
  return `a1-module-outcome-${moduleId}`;
}

export const A1_LESSON_MANIFEST: Readonly<
  Record<LessonId, A1LessonManifestEntry>
> = deepFreeze(
  Object.fromEntries(
    A1_MODULE_IDS.flatMap((moduleId) => {
      const contract = A1_MANIFEST_SPEC.moduleContracts[moduleId];
      return A1_LESSON_IDS_BY_MODULE[moduleId].map((lessonId, index) => {
        const entry: A1LessonManifestEntry = {
          lessonId,
          moduleId,
          order: (index + 1) as 1 | 2 | 3 | 4,
          contract,
          position: A1_CANONICAL_POSITIONS[lessonId],
        };
        return [lessonId, entry];
      });
    }),
  ),
);

export const A1_MODULE_MANIFEST: Readonly<
  Record<ModuleId, A1ModuleManifestEntry>
> = deepFreeze(
  Object.fromEntries(
    A1_MODULE_IDS.map((moduleId, index) => {
      const entry: A1ModuleManifestEntry = {
        id: moduleId,
        order: index + 1,
        contract: A1_MANIFEST_SPEC.moduleContracts[moduleId],
        prerequisiteIds: [...A1_MANIFEST_SPEC.modulePrerequisites[moduleId]],
        lessonIds: [...A1_LESSON_IDS_BY_MODULE[moduleId]],
        outcomeCopyId: moduleOutcomeCopyId(moduleId),
      };
      return [moduleId, entry];
    }),
  ),
);

// ---------------------------------------------------------------------------
// Published-ID preservation, retained/new partition
// ---------------------------------------------------------------------------

/**
 * Every previously-published *numbered* (non-capstone) lesson ID. Exactly one
 * of these — `sounds-5` — is retired (aliased to `sounds-4`); the other 35 are
 * retained directly in the canonical manifest. The four previously-published
 * *named* capstones are intentionally excluded: they are renumbered to
 * `capstones-1..4` and tracked separately.
 */
export const A1_LEGACY_PUBLISHED_LESSON_IDS: readonly LessonId[] = deepFreeze([
  "sounds-1",
  "sounds-2",
  "sounds-3",
  "sounds-4",
  "sounds-5",
  "introductions-1",
  "introductions-2",
  "introductions-3",
  "essential-questions-1",
  "essential-questions-2",
  "essential-questions-3",
  "actions-1",
  "actions-2",
  "actions-3",
  "routines-1",
  "routines-2",
  "routines-3",
  "past-negative-1",
  "past-negative-2",
  "past-negative-3",
  "places-1",
  "places-2",
  "places-3",
  "places-4",
  "people-1",
  "people-2",
  "people-3",
  "descriptions-1",
  "descriptions-2",
  "descriptions-3",
  "shopping-1",
  "shopping-2",
  "shopping-3",
  "existence-needs-1",
  "existence-needs-2",
  "existence-needs-3",
]);

const LESSON_ID_SET: ReadonlySet<LessonId> = new Set(A1_LESSON_IDS);
const CAPSTONE_ID_SET: ReadonlySet<LessonId> = new Set(A1_CAPSTONE_LESSON_IDS);
const PUBLISHED_ID_SET: ReadonlySet<LessonId> = new Set(
  A1_LEGACY_PUBLISHED_LESSON_IDS,
);

/** Published numbered IDs that survive directly into the canonical manifest. */
export const A1_RETAINED_PUBLISHED_LESSON_IDS: readonly LessonId[] = deepFreeze(
  A1_LEGACY_PUBLISHED_LESSON_IDS.filter((id) => LESSON_ID_SET.has(id)),
);

/** Canonical lessons that are neither retained-published nor renumbered capstones. */
export const A1_NEW_LESSON_IDS: readonly LessonId[] = deepFreeze(
  A1_LESSON_IDS.filter(
    (id) => !PUBLISHED_ID_SET.has(id) && !CAPSTONE_ID_SET.has(id),
  ),
);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function findDuplicates<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    else seen.add(value);
  }
  return [...duplicates];
}

/**
 * Validate an arbitrary manifest spec, returning every structured violation.
 * Deliberately additive: it collects all failures rather than throwing on the
 * first, so tests can assert on a specific code without ordering assumptions.
 */
export function validateA1ManifestSpec(
  spec: A1ManifestSpec,
): A1ManifestValidationResult {
  const errors: A1ManifestValidationError[] = [];
  const push = (code: A1ManifestValidationError["code"], message: string) =>
    errors.push({ code, message });

  const moduleIds = spec.moduleIds;

  // Duplicate module IDs.
  for (const dup of findDuplicates(moduleIds)) {
    push("duplicate-module-id", `Module id "${dup}" appears more than once.`);
  }

  // Per-module lesson count and cross-module duplicate lessons.
  const allLessonIds: LessonId[] = [];
  for (const moduleId of moduleIds) {
    const lessonIds = spec.lessonIdsByModule[moduleId] ?? [];
    if (lessonIds.length !== 4) {
      push(
        "module-lesson-count",
        `Module "${moduleId}" must have exactly 4 lessons, has ${lessonIds.length}.`,
      );
    }
    allLessonIds.push(...lessonIds);
  }
  for (const dup of findDuplicates(allLessonIds)) {
    push("duplicate-lesson-id", `Lesson id "${dup}" appears more than once.`);
  }
  const canonicalLessonSet = new Set(allLessonIds);

  // Capstone module must be final.
  if (moduleIds[moduleIds.length - 1] !== spec.capstoneModuleId) {
    push(
      "capstone-not-final",
      `Capstone module "${spec.capstoneModuleId}" must be the final module.`,
    );
  }

  // Aliases: target must exist; source must not itself be a canonical lesson.
  for (const [source, target] of Object.entries(spec.aliases)) {
    if (!canonicalLessonSet.has(target)) {
      push(
        "alias-target-missing",
        `Alias "${source}" targets non-existent lesson "${target}".`,
      );
    }
    if (canonicalLessonSet.has(source)) {
      push(
        "alias-source-published",
        `Alias source "${source}" is itself a canonical lesson.`,
      );
    }
  }

  // Prerequisite chain: every prerequisite must appear earlier in module order.
  const moduleIndex = new Map(moduleIds.map((id, index) => [id, index]));
  for (const moduleId of moduleIds) {
    const selfIndex = moduleIndex.get(moduleId);
    if (selfIndex === undefined) continue;
    for (const prereq of spec.modulePrerequisites[moduleId] ?? []) {
      const prereqIndex = moduleIndex.get(prereq);
      if (prereqIndex === undefined || prereqIndex >= selfIndex) {
        push(
          "prerequisite-order",
          `Module "${moduleId}" prerequisite "${prereq}" is not an earlier module.`,
        );
      }
    }
  }

  // Contract assignment: module 1 phonetic, capstone synthesis, rest instructional.
  moduleIds.forEach((moduleId, index) => {
    const expected: A1LessonContract =
      moduleId === spec.capstoneModuleId
        ? "synthesis"
        : index === 0
          ? "phonetic"
          : "instructional";
    const actual = spec.moduleContracts[moduleId];
    if (actual !== expected) {
      push(
        "contract-assignment",
        `Module "${moduleId}" contract "${actual}" should be "${expected}".`,
      );
    }
  });

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/** Validate the canonical manifest spec. */
export function validateA1Manifest(): A1ManifestValidationResult {
  return validateA1ManifestSpec(A1_MANIFEST_SPEC);
}
