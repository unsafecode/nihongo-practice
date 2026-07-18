import type { LessonId } from "../../foundations/types";
import type { A2GrammarForm } from "./grammarSpiral";

/** Runtime-checkable tuple of every error code this validator can raise. */
export const A2_GRAMMAR_SPIRAL_ERROR_CODES = [
  "grammar-form-missing-cando",
  "grammar-form-missing-intro",
  "grammar-form-missing-practice",
  "grammar-form-missing-transfer",
  "grammar-form-missing-recurrence",
  "grammar-role-before-intro",
] as const;

export type GrammarSpiralErrorCode = (typeof A2_GRAMMAR_SPIRAL_ERROR_CODES)[number];

export interface GrammarSpiralError {
  readonly code: GrammarSpiralErrorCode;
  readonly id: string;
}

export interface GrammarSpiralResult {
  readonly valid: boolean;
  readonly errors: readonly GrammarSpiralError[];
}

/** Resolve a lesson id to its canonical position, treating falsy/unknown ids alike. */
function resolvePosition(
  lessonId: LessonId | undefined,
  positions: Readonly<Record<LessonId, number>>,
): number | undefined {
  if (!lessonId) return undefined;
  return positions[lessonId];
}

/**
 * Validate the A2 grammar spiral (Phase 3 Task 2, design spec §9.4). Checks
 * that every form has all five roles (Can-do, intro, controlled practice,
 * transfer, recurrence) and that no non-intro role's lesson canonically
 * precedes its own intro lesson. An empty *or* unknown (unresolvable)
 * lesson id is treated identically: the role's own `grammar-form-missing-*`
 * code is raised rather than silently skipping validation for that role.
 */
export function validateA2GrammarSpiral(
  forms: readonly A2GrammarForm[],
  positions: Readonly<Record<LessonId, number>>,
): GrammarSpiralResult {
  const errors: GrammarSpiralError[] = [];

  for (const f of forms) {
    if (!f.canDoId) {
      errors.push({ code: "grammar-form-missing-cando", id: f.id });
    }

    const introPos = resolvePosition(f.introLessonId, positions);
    if (introPos === undefined) {
      errors.push({ code: "grammar-form-missing-intro", id: f.id });
    }

    const practicePos = resolvePosition(f.controlledPracticeLessonId, positions);
    if (practicePos === undefined) {
      errors.push({ code: "grammar-form-missing-practice", id: f.id });
    } else if (introPos !== undefined && practicePos < introPos) {
      errors.push({
        code: "grammar-role-before-intro",
        id: `${f.id}:${f.controlledPracticeLessonId}`,
      });
    }

    const transferPos = resolvePosition(f.transferLessonId, positions);
    if (transferPos === undefined) {
      errors.push({ code: "grammar-form-missing-transfer", id: f.id });
    } else if (introPos !== undefined && transferPos < introPos) {
      errors.push({
        code: "grammar-role-before-intro",
        id: `${f.id}:${f.transferLessonId}`,
      });
    }

    if (f.recurrenceLessonIds.length === 0) {
      errors.push({ code: "grammar-form-missing-recurrence", id: f.id });
    } else {
      for (const lessonId of f.recurrenceLessonIds) {
        const pos = resolvePosition(lessonId, positions);
        if (pos === undefined) {
          errors.push({
            code: "grammar-form-missing-recurrence",
            id: `${f.id}:${lessonId}`,
          });
        } else if (introPos !== undefined && pos < introPos) {
          errors.push({ code: "grammar-role-before-intro", id: `${f.id}:${lessonId}` });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
