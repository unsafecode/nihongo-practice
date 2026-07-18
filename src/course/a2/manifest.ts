/**
 * The exact, immutable A2 release manifest (Phase 3 Task 1).
 *
 * There is no content yet — this is the frozen structural spine every later
 * A2 task (recipes, catalogs, the release validator) builds on top of. A
 * single declarative {@link A2ManifestSpec} is the source of truth; every
 * exported array and map is derived from it and deep-frozen. The manifest
 * encodes the plan's fixed lesson table: fifteen modules in prerequisite
 * order, exactly four lessons each (60 total), canonical positions 1-60, a
 * single synthesis module (`a2-synthesis`) with the rest instructional, no
 * phonetic module, and an empty legacy-alias map at release (A2 has no
 * previously-published lesson ids to reconcile).
 *
 * Outcome copy IDs are locale-independent ASCII identifiers; the manifest
 * never carries learner-visible text.
 */

import { deepFreeze } from "../foundations/deepFreeze";
import type {
  A2LessonContract,
  A2LessonManifestEntry,
  A2ManifestSpec,
  A2ManifestValidationError,
  A2ManifestValidationResult,
  A2ModuleManifestEntry,
} from "./types";
import type { LessonId, ModuleId } from "../foundations/types";

export type { A2ManifestSpec } from "./types";

// ---------------------------------------------------------------------------
// Declarative source of truth
// ---------------------------------------------------------------------------

const MODULE_ORDER: readonly ModuleId[] = [
  "connected-conversation",
  "plans-invitations",
  "experiences-narratives",
  "reasons-opinions",
  "sequencing-ongoing",
  "permission-requests",
  "neighborhood-services",
  "restaurant-problems",
  "shopping-returns",
  "health-advice",
  "work-study-messages",
  "travel-reservations",
  "relationships-events",
  "practical-texts",
  "a2-synthesis",
];

const SYNTHESIS_MODULE_ID: ModuleId = "a2-synthesis";

/** Build the canonical `${module}-${1..4}` lesson-ID list for a module. */
function fourLessons(moduleId: ModuleId): LessonId[] {
  return [1, 2, 3, 4].map((n) => `${moduleId}-${n}`);
}

function buildCanonicalSpec(): A2ManifestSpec {
  const lessonIdsByModule: Record<ModuleId, LessonId[]> = {};
  const modulePrerequisites: Record<ModuleId, ModuleId[]> = {};
  const moduleContracts: Record<ModuleId, A2LessonContract> = {};

  MODULE_ORDER.forEach((moduleId, index) => {
    lessonIdsByModule[moduleId] = fourLessons(moduleId);
    modulePrerequisites[moduleId] =
      index === 0 ? [] : [MODULE_ORDER[index - 1]];
    moduleContracts[moduleId] =
      moduleId === SYNTHESIS_MODULE_ID ? "synthesis" : "instructional";
  });

  return {
    moduleIds: [...MODULE_ORDER],
    lessonIdsByModule,
    modulePrerequisites,
    moduleContracts,
    synthesisModuleId: SYNTHESIS_MODULE_ID,
    aliases: {},
  };
}

/** The canonical manifest spec, deep-frozen (the runtime source of truth). */
export const A2_MANIFEST_SPEC: A2ManifestSpec = deepFreeze(buildCanonicalSpec());

// ---------------------------------------------------------------------------
// Derived ID arrays and maps
// ---------------------------------------------------------------------------

export const A2_MODULE_IDS: readonly ModuleId[] = deepFreeze([
  ...A2_MANIFEST_SPEC.moduleIds,
]);

export const A2_LESSON_IDS_BY_MODULE: Readonly<
  Record<ModuleId, readonly LessonId[]>
> = deepFreeze(
  Object.fromEntries(
    A2_MODULE_IDS.map((moduleId) => [
      moduleId,
      [...A2_MANIFEST_SPEC.lessonIdsByModule[moduleId]],
    ]),
  ),
);

export const A2_LESSON_IDS: readonly LessonId[] = deepFreeze(
  A2_MODULE_IDS.flatMap((moduleId) => [...A2_LESSON_IDS_BY_MODULE[moduleId]]),
);

export const A2_SYNTHESIS_LESSON_IDS: readonly LessonId[] = deepFreeze([
  ...A2_LESSON_IDS_BY_MODULE[A2_MANIFEST_SPEC.synthesisModuleId],
]);

export const A2_CANONICAL_POSITIONS: Readonly<Record<LessonId, number>> =
  deepFreeze(
    Object.fromEntries(A2_LESSON_IDS.map((id, index) => [id, index + 1])),
  );

export const A2_LEGACY_LESSON_ALIASES: Readonly<Record<LessonId, LessonId>> =
  deepFreeze({ ...A2_MANIFEST_SPEC.aliases });

/** Outcome copy IDs are locale-independent ASCII identifiers. */
function moduleOutcomeCopyId(moduleId: ModuleId): string {
  return `a2-module-outcome-${moduleId}`;
}

export const A2_LESSON_MANIFEST: Readonly<
  Record<LessonId, A2LessonManifestEntry>
> = deepFreeze(
  Object.fromEntries(
    A2_MODULE_IDS.flatMap((moduleId) => {
      const contract = A2_MANIFEST_SPEC.moduleContracts[moduleId];
      return A2_LESSON_IDS_BY_MODULE[moduleId].map((lessonId, index) => {
        const entry: A2LessonManifestEntry = {
          lessonId,
          moduleId,
          order: (index + 1) as 1 | 2 | 3 | 4,
          contract,
          position: A2_CANONICAL_POSITIONS[lessonId],
        };
        return [lessonId, entry];
      });
    }),
  ),
);

export const A2_MODULE_MANIFEST: Readonly<
  Record<ModuleId, A2ModuleManifestEntry>
> = deepFreeze(
  Object.fromEntries(
    A2_MODULE_IDS.map((moduleId, index) => {
      const entry: A2ModuleManifestEntry = {
        id: moduleId,
        order: index + 1,
        contract: A2_MANIFEST_SPEC.moduleContracts[moduleId],
        prerequisiteIds: [...A2_MANIFEST_SPEC.modulePrerequisites[moduleId]],
        lessonIds: [...A2_LESSON_IDS_BY_MODULE[moduleId]],
        outcomeCopyId: moduleOutcomeCopyId(moduleId),
      };
      return [moduleId, entry];
    }),
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
 * Detect any cycle in the module prerequisite graph via DFS with a
 * recursion-stack guard. Generic over the spec's own (possibly malformed)
 * `modulePrerequisites`, so it does not assume prerequisites only ever point
 * to an earlier position in `moduleIds` the way the canonical spec does.
 */
function findPrerequisiteCycle(
  moduleIds: readonly ModuleId[],
  modulePrerequisites: Record<ModuleId, ModuleId[]>,
): ModuleId[] {
  const inCycle = new Set<ModuleId>();
  const visited = new Set<ModuleId>();
  const stack = new Set<ModuleId>();

  function visit(moduleId: ModuleId, path: ModuleId[]): void {
    if (stack.has(moduleId)) {
      // Found a cycle: mark every module from its first occurrence in path.
      const cycleStart = path.indexOf(moduleId);
      for (const id of path.slice(cycleStart)) inCycle.add(id);
      return;
    }
    if (visited.has(moduleId)) return;
    visited.add(moduleId);
    stack.add(moduleId);
    for (const prereq of modulePrerequisites[moduleId] ?? []) {
      visit(prereq, [...path, moduleId]);
    }
    stack.delete(moduleId);
  }

  for (const moduleId of moduleIds) visit(moduleId, []);
  return [...inCycle];
}

/**
 * Validate an arbitrary manifest spec, returning every structured violation.
 * Deliberately additive: it collects all failures rather than throwing on the
 * first, so tests can assert on a specific code without ordering assumptions.
 */
export function validateA2ManifestSpec(
  spec: A2ManifestSpec,
): A2ManifestValidationResult {
  const errors: A2ManifestValidationError[] = [];
  const push = (code: A2ManifestValidationError["code"], message: string) =>
    errors.push({ code, message });

  const moduleIds = spec.moduleIds;

  // Exact module count.
  if (moduleIds.length !== 15) {
    push(
      "module-count",
      `Manifest must declare exactly 15 modules, has ${moduleIds.length}.`,
    );
  }

  // Duplicate module IDs.
  for (const dup of findDuplicates(moduleIds)) {
    push("duplicate-module-id", `Module id "${dup}" appears more than once.`);
  }
  const declaredModuleIdSet = new Set(moduleIds);

  // Per-module lesson count and cross-module duplicate lessons.
  const allLessonIds: LessonId[] = [];
  for (const moduleId of moduleIds) {
    const lessonIds = spec.lessonIdsByModule[moduleId] ?? [];
    if (lessonIds.length !== 4) {
      push(
        "lessons-per-module",
        `Module "${moduleId}" must have exactly 4 lessons, has ${lessonIds.length}.`,
      );
    }
    allLessonIds.push(...lessonIds);
  }
  for (const dup of findDuplicates(allLessonIds)) {
    push("duplicate-lesson-id", `Lesson id "${dup}" appears more than once.`);
  }
  const canonicalLessonSet = new Set(allLessonIds);

  // The synthesis module must actually be one of the declared modules.
  if (!moduleIds.includes(spec.synthesisModuleId)) {
    push(
      "unknown-synthesis-module",
      `Synthesis module "${spec.synthesisModuleId}" is not among the declared modules.`,
    );
  }

  // Prerequisites must reference a declared module id; no dangling ids.
  for (const moduleId of moduleIds) {
    for (const prereq of spec.modulePrerequisites[moduleId] ?? []) {
      if (!declaredModuleIdSet.has(prereq)) {
        push(
          "unknown-prerequisite",
          `Module "${moduleId}" prerequisite "${prereq}" is not a declared module.`,
        );
      }
    }
  }

  // Prerequisite graph must be acyclic.
  const cycleModules = findPrerequisiteCycle(moduleIds, spec.modulePrerequisites);
  if (cycleModules.length > 0) {
    push(
      "prerequisite-cycle",
      `Module prerequisite graph has a cycle involving: ${cycleModules.sort().join(", ")}.`,
    );
  }

  // Aliases: target must exist among canonical lessons.
  for (const [source, target] of Object.entries(spec.aliases)) {
    if (!canonicalLessonSet.has(target)) {
      push(
        "alias-target-missing",
        `Alias "${source}" targets non-existent lesson "${target}".`,
      );
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/** Validate the canonical manifest spec. */
export function validateA2Manifest(): A2ManifestValidationResult {
  return validateA2ManifestSpec(A2_MANIFEST_SPEC);
}
