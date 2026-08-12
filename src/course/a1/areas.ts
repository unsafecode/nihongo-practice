/**
 * Immutable A1 area authoring contracts.
 *
 * Areas partition the canonical manifest's module order for authoring. Course
 * map presentation and progress grouping remain separate runtime concerns.
 */

import { deepFreeze } from "../foundations/deepFreeze";
import { A1_MODULE_IDS, A1_RETAINED_MODULE_IDS } from "./manifest";
import type {
  A1AreaId,
  A1AreaValidationError,
  A1AreaValidationResult,
  A1CourseArea,
} from "./types";

/** The only valid A1 area IDs, in canonical navigation order. */
export const A1_AREA_IDS: readonly A1AreaId[] = deepFreeze([
  "sounds",
  "foundations",
  "situations",
  "synthesis",
]);

/**
 * The exact canonical A1 area partition. Copy IDs
 * deliberately remain stable, locale-independent identifiers; localized copy
 * is resolved elsewhere.
 */
export const A1_AREAS: readonly A1CourseArea[] = deepFreeze([
  {
    id: "sounds",
    moduleIds: ["sounds"],
    titleCopyId: "a1-area-sounds-title",
    descriptionCopyId: "a1-area-sounds-description",
  },
  {
    id: "foundations",
    moduleIds: [
      "sentence-foundations",
      "topic-questions",
      "polite-verbs",
      "time-movement",
    ],
    titleCopyId: "a1-area-foundations-title",
    descriptionCopyId: "a1-area-foundations-description",
  },
  {
    id: "situations",
    moduleIds: [
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
    ],
    titleCopyId: "a1-area-situations-title",
    descriptionCopyId: "a1-area-situations-description",
  },
  {
    id: "synthesis",
    moduleIds: ["capstones"],
    titleCopyId: "a1-area-synthesis-title",
    descriptionCopyId: "a1-area-synthesis-description",
  },
]);

/**
 * The exact canonical A1 area partition restricted to modules Base has not
 * rehomed (Task 16 containment). `sounds` and `foundations` lose every
 * module they authored (Base owns all five) and drop out entirely; the
 * remaining two areas keep their id/order/copy unchanged with only
 * Base-owned modules filtered from `moduleIds`.
 */
export const A1_RETAINED_AREAS: readonly A1CourseArea[] = deepFreeze(
  A1_AREAS.flatMap((area) => {
    const moduleIds = area.moduleIds.filter((moduleId) =>
      A1_RETAINED_MODULE_IDS.includes(moduleId),
    );
    return moduleIds.length === 0 ? [] : [{ ...area, moduleIds }];
  }),
);

/** The retained A1 area ids, in canonical navigation order. */
export const A1_RETAINED_AREA_IDS: readonly A1AreaId[] = deepFreeze(
  A1_RETAINED_AREAS.map((area) => area.id),
);

/**
 * Validate an arbitrary canonical A1 area partition without normalizing it. Each
 * diagnostic preserves the authored ID/order problem so callers can report
 * every defect.
 */
export function validateA1Areas(
  areas: readonly A1CourseArea[],
): A1AreaValidationResult {
  return validateA1AreaPartition(areas, A1_AREA_IDS, A1_MODULE_IDS);
}

/**
 * Validate the *retained* A1 area partition — the canonical partition with the
 * modules Base rehomed (Task 16) removed. It runs the identical rule set, only
 * against the retained area/module universe, so the released level's area
 * presentation is gated exactly as strictly as the authoring contract is.
 */
export function validateA1RetainedAreas(
  areas: readonly A1CourseArea[],
): A1AreaValidationResult {
  return validateA1AreaPartition(
    areas,
    A1_RETAINED_AREA_IDS,
    A1_RETAINED_MODULE_IDS,
  );
}

function validateA1AreaPartition(
  areas: readonly A1CourseArea[],
  expectedAreaIds: readonly A1AreaId[],
  expectedModuleIds: readonly string[],
): A1AreaValidationResult {
  const errors: A1AreaValidationError[] = [];
  const push = (
    code: A1AreaValidationError["code"],
    message: string,
    detail?: string,
  ) => errors.push({ code, message, detail });
  let hasAreaIdentityError = false;
  let hasModuleMembershipError = false;

  if (areas.length !== expectedAreaIds.length) {
    hasAreaIdentityError = true;
    push(
      "area-count",
      `Expected exactly ${expectedAreaIds.length} canonical A1 areas, received ${areas.length}.`,
    );
  }

  const seenAreaIds = new Set<string>();
  const seenModuleIds = new Set<string>();
  const canonicalModuleIds = new Set<string>(expectedModuleIds);
  const authoredModuleIds: string[] = [];

  for (const area of areas) {
    const areaId = area.id;
    if (seenAreaIds.has(areaId)) {
      hasAreaIdentityError = true;
      push(
        "duplicate-area-id",
        `Area id "${areaId}" appears more than once.`,
        areaId,
      );
    }
    seenAreaIds.add(areaId);

    if (!expectedAreaIds.includes(areaId)) {
      hasAreaIdentityError = true;
      push("unknown-area-id", `Area id "${areaId}" is not recognized.`, areaId);
    }

    if (area.moduleIds.length === 0) {
      push("empty-area", `Area "${areaId}" must include at least one module.`, areaId);
    }

    for (const moduleId of area.moduleIds) {
      authoredModuleIds.push(moduleId);
      if (seenModuleIds.has(moduleId)) {
        hasModuleMembershipError = true;
        push(
          "duplicate-module-membership",
          `Module "${moduleId}" appears in more than one A1 area.`,
          moduleId,
        );
      }
      seenModuleIds.add(moduleId);

      if (!canonicalModuleIds.has(moduleId)) {
        hasModuleMembershipError = true;
        push(
          "unknown-module-membership",
          `Area "${areaId}" includes module "${moduleId}" outside the canonical A1 plan.`,
          moduleId,
        );
      }
    }
  }

  for (const areaId of expectedAreaIds) {
    if (!seenAreaIds.has(areaId)) {
      hasAreaIdentityError = true;
      push("missing-area-id", `Required area "${areaId}" is missing.`, areaId);
    }
  }

  if (!hasAreaIdentityError) {
    for (const [index, area] of areas.entries()) {
      if (area.id !== expectedAreaIds[index]) {
        push(
          "area-order",
          `Area at position ${index + 1} must be "${expectedAreaIds[index]}".`,
          area.id,
        );
      }
    }
  }

  for (const moduleId of expectedModuleIds) {
    if (!seenModuleIds.has(moduleId)) {
      hasModuleMembershipError = true;
      push(
        "missing-module-membership",
        `Canonical A1 module "${moduleId}" is not assigned to an area.`,
        moduleId,
      );
    }
  }

  if (
    !hasModuleMembershipError &&
    (
      authoredModuleIds.length !== expectedModuleIds.length ||
      authoredModuleIds.some(
        (moduleId, index) => moduleId !== expectedModuleIds[index],
      )
    )
  ) {
    push(
      "module-union-order",
      "A1 area module membership must equal the expected module order.",
    );
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
