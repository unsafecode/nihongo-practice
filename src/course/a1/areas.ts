/**
 * Immutable A1 expanded-area authoring contracts.
 *
 * Areas partition the planned next-release manifest's module order for
 * authoring and future navigation. The published 12-module runtime remains
 * separate until Task 5 atomically promotes the expanded manifest; this file
 * does not make any planned module available to current course consumers.
 */

import { deepFreeze } from "../foundations/deepFreeze";
import { A1_EXPANDED_MODULE_IDS } from "./manifest";
import type {
  A1AreaId,
  A1AreaValidationError,
  A1AreaValidationResult,
  A1CourseArea,
} from "./types";

/** The only valid A1 area IDs, in planned next-release navigation order. */
export const A1_AREA_IDS: readonly A1AreaId[] = deepFreeze([
  "sounds",
  "foundations",
  "situations",
  "synthesis",
]);

/**
 * The exact expanded A1 area partition for next-release authoring. Copy IDs
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
 * Validate an arbitrary expanded-area partition without normalizing it. Each
 * diagnostic preserves the authored ID/order problem so callers can report
 * every defect.
 */
export function validateA1Areas(
  areas: readonly A1CourseArea[],
): A1AreaValidationResult {
  const errors: A1AreaValidationError[] = [];
  const push = (
    code: A1AreaValidationError["code"],
    message: string,
    detail?: string,
  ) => errors.push({ code, message, detail });

  if (areas.length !== A1_AREA_IDS.length) {
    push(
      "area-count",
      `Expected exactly ${A1_AREA_IDS.length} expanded A1 areas, received ${areas.length}.`,
    );
  }

  const seenAreaIds = new Set<string>();
  const seenModuleIds = new Set<string>();
  const expandedModuleIds = new Set<string>(A1_EXPANDED_MODULE_IDS);
  const authoredModuleIds: string[] = [];

  for (const [index, area] of areas.entries()) {
    const areaId = area.id;
    if (seenAreaIds.has(areaId)) {
      push(
        "duplicate-area-id",
        `Area id "${areaId}" appears more than once.`,
        areaId,
      );
    }
    seenAreaIds.add(areaId);

    if (!A1_AREA_IDS.includes(areaId)) {
      push("unknown-area-id", `Area id "${areaId}" is not recognized.`, areaId);
    }
    if (areaId !== A1_AREA_IDS[index]) {
      push(
        "area-order",
        `Area at position ${index + 1} must be "${A1_AREA_IDS[index]}".`,
        areaId,
      );
    }

    if (area.moduleIds.length === 0) {
      push("empty-area", `Area "${areaId}" must include at least one module.`, areaId);
    }

    for (const moduleId of area.moduleIds) {
      authoredModuleIds.push(moduleId);
      if (seenModuleIds.has(moduleId)) {
        push(
          "duplicate-module-membership",
          `Module "${moduleId}" appears in more than one A1 area.`,
          moduleId,
        );
      }
      seenModuleIds.add(moduleId);

      if (!expandedModuleIds.has(moduleId)) {
        push(
          "unknown-module-membership",
          `Area "${areaId}" includes module "${moduleId}" outside the expanded A1 plan.`,
          moduleId,
        );
      }
    }
  }

  for (const areaId of A1_AREA_IDS) {
    if (!seenAreaIds.has(areaId)) {
      push("missing-area-id", `Required area "${areaId}" is missing.`, areaId);
    }
  }

  for (const moduleId of A1_EXPANDED_MODULE_IDS) {
    if (!seenModuleIds.has(moduleId)) {
      push(
        "missing-module-membership",
        `Expanded A1 module "${moduleId}" is not assigned to an area.`,
        moduleId,
      );
    }
  }

  if (
    authoredModuleIds.length !== A1_EXPANDED_MODULE_IDS.length ||
    authoredModuleIds.some(
      (moduleId, index) => moduleId !== A1_EXPANDED_MODULE_IDS[index],
    )
  ) {
    push(
      "module-union-order",
      "A1 area module membership must equal A1_EXPANDED_MODULE_IDS in expanded order.",
    );
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
