import { PHASE_IDS } from "../data/types";
import type {
  CurriculumCoverageTotals,
  CurriculumFoundation,
  CurriculumFoundationError,
  CurriculumFoundationValidation,
} from "./types";

export interface FoundationValidationOptions {
  readonly enforceReleaseTotals?: boolean;
}

const RELEASE_TOTALS: CurriculumCoverageTotals = {
  lessons: 40,
  introducedVerbs: 42,
  vocabulary: 270,
};

function findCycle(
  foundation: CurriculumFoundation,
): CurriculumFoundationError | null {
  const modulesById = new Map(
    foundation.modules.map((courseModule) => [courseModule.id, courseModule]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(moduleId: string): CurriculumFoundationError | null {
    if (visited.has(moduleId)) return null;
    visiting.add(moduleId);
    const courseModule = modulesById.get(moduleId);
    if (!courseModule) return null;

    for (const prerequisiteId of courseModule.prerequisiteIds) {
      if (!modulesById.has(prerequisiteId)) continue;
      if (visiting.has(prerequisiteId)) {
        return {
          code: "prerequisite-cycle",
          moduleId,
          referenceId: prerequisiteId,
        };
      }
      const cycle = visit(prerequisiteId);
      if (cycle) return cycle;
    }

    visiting.delete(moduleId);
    visited.add(moduleId);
    return null;
  }

  for (const courseModule of foundation.modules) {
    const cycle = visit(courseModule.id);
    if (cycle) return cycle;
  }
  return null;
}

export function validateCurriculumFoundation(
  foundation: CurriculumFoundation,
  options: FoundationValidationOptions = {},
): CurriculumFoundationValidation {
  const errors: CurriculumFoundationError[] = [];
  const enforceReleaseTotals = options.enforceReleaseTotals ?? true;
  const seenIds = new Set<string>();
  const seenOrders = new Set<number>();

  for (const courseModule of foundation.modules) {
    if (seenIds.has(courseModule.id)) {
      errors.push({ code: "duplicate-module-id", moduleId: courseModule.id });
    }
    seenIds.add(courseModule.id);
    if (seenOrders.has(courseModule.order)) {
      errors.push({ code: "duplicate-module-order", moduleId: courseModule.id });
    }
    seenOrders.add(courseModule.order);
  }

  const modulesById = new Map(
    foundation.modules.map((courseModule) => [courseModule.id, courseModule]),
  );
  for (const courseModule of foundation.modules) {
    for (const prerequisiteId of courseModule.prerequisiteIds) {
      const prerequisite = modulesById.get(prerequisiteId);
      if (!prerequisite) {
        errors.push({
          code: "missing-prerequisite",
          moduleId: courseModule.id,
          referenceId: prerequisiteId,
        });
      } else if (prerequisite.order >= courseModule.order) {
        errors.push({
          code: "prerequisite-not-earlier",
          moduleId: courseModule.id,
          referenceId: prerequisiteId,
        });
      }
    }
  }

  const cycle = findCycle(foundation);
  if (cycle) errors.push(cycle);

  let previousPhaseIndex = -1;
  for (const courseModule of [...foundation.modules].sort(
    (left, right) => left.order - right.order,
  )) {
    const phaseIndex = PHASE_IDS.indexOf(courseModule.phase);
    if (phaseIndex < previousPhaseIndex) {
      errors.push({ code: "invalid-phase-order", moduleId: courseModule.id });
    }
    previousPhaseIndex = Math.max(previousPhaseIndex, phaseIndex);
  }

  for (const courseModule of foundation.modules) {
    if (!Number.isInteger(courseModule.coverage.lessons) || courseModule.coverage.lessons <= 0) {
      errors.push({ code: "invalid-lesson-count", moduleId: courseModule.id });
    }
    if (
      !Number.isInteger(courseModule.coverage.introducedVerbs) ||
      courseModule.coverage.introducedVerbs < 0
    ) {
      errors.push({ code: "invalid-verb-count", moduleId: courseModule.id });
    }
    if (
      !Number.isInteger(courseModule.coverage.vocabulary) ||
      courseModule.coverage.vocabulary < 0
    ) {
      errors.push({ code: "invalid-vocabulary-count", moduleId: courseModule.id });
    }
  }

  const totals = foundation.modules.reduce<CurriculumCoverageTotals>(
    (sum, courseModule) => ({
      lessons: sum.lessons + courseModule.coverage.lessons,
      introducedVerbs:
        sum.introducedVerbs + courseModule.coverage.introducedVerbs,
      vocabulary: sum.vocabulary + courseModule.coverage.vocabulary,
    }),
    { lessons: 0, introducedVerbs: 0, vocabulary: 0 },
  );

  if (enforceReleaseTotals) {
    if (foundation.modules.length !== 12) {
      errors.push({ code: "invalid-module-count" });
    }
    if (totals.lessons !== RELEASE_TOTALS.lessons) {
      errors.push({ code: "invalid-lesson-total" });
    }
    if (totals.introducedVerbs !== RELEASE_TOTALS.introducedVerbs) {
      errors.push({ code: "invalid-verb-total" });
    }
    if (totals.vocabulary !== RELEASE_TOTALS.vocabulary) {
      errors.push({ code: "invalid-vocabulary-total" });
    }
  }

  return { valid: errors.length === 0, errors, totals };
}
