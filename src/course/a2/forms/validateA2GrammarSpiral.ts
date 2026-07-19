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

// ---------------------------------------------------------------------------
// Content-evidence audit (Phase 3 Task 6 spec-fix, "grammar spiral content
// mismatch") — a layer ON TOP OF the purely structural checks above.
// ---------------------------------------------------------------------------

/** Runtime-checkable tuple of every error code {@link auditA2GrammarSpiralEvidence} can raise. */
export const A2_GRAMMAR_EVIDENCE_ERROR_CODES = [
  "grammar-form-no-role-evidence",
  "grammar-form-no-transfer-pedagogical-evidence",
] as const;

export type GrammarEvidenceErrorCode = (typeof A2_GRAMMAR_EVIDENCE_ERROR_CODES)[number];

export interface GrammarEvidenceError {
  readonly code: GrammarEvidenceErrorCode;
  readonly id: string;
}

export interface GrammarEvidenceResult {
  readonly valid: boolean;
  readonly errors: readonly GrammarEvidenceError[];
}

/** Minimal shape this audit needs from a real, already-realized lesson
 * variant — just enough to know which sentence family it uses and whether
 * it is a `"model"` or a `"transfer"`. Kept structural/generic (never a
 * `SentenceVariant` import) so this stays a pure, reusable, level-agnostic
 * audit layer, exactly like {@link validateA2GrammarSpiral} itself. */
export interface GrammarEvidenceVariant {
  readonly sentenceFamilyId: string;
  readonly pedagogicalUse: string;
}

/** One real lesson's full set of authored model/transfer variants, keyed by
 * the caller under its own `LessonId` in the `evidenceByLessonId` map passed
 * to {@link auditA2GrammarSpiralEvidence}. */
export interface GrammarEvidenceLesson {
  readonly variants: readonly GrammarEvidenceVariant[];
}

const GRAMMAR_EVIDENCE_ROLES = ["intro", "practice", "transfer"] as const;
type GrammarEvidenceRole = (typeof GRAMMAR_EVIDENCE_ROLES)[number];

function roleLessonId(form: A2GrammarForm, role: GrammarEvidenceRole): LessonId {
  if (role === "intro") return form.introLessonId;
  if (role === "practice") return form.controlledPracticeLessonId;
  return form.transferLessonId;
}

/**
 * Content-evidence audit (Phase 3 Task 6 spec-fix, "grammar spiral content
 * mismatch"): {@link validateA2GrammarSpiral} only ever proves a role's
 * lesson id *resolves* to a real, correctly-ordered lesson — it never opens
 * that lesson's own authored content, so a grammar-spiral row can silently
 * drift from the real construction it claims to teach. This is exactly what
 * happened: `reason-node`'s own `transferLessonId` names
 * `travel-reservations-3`, a lesson whose own authored models/transfers
 * never once used the `a2-family-reason-node` family, even though the
 * spiral claims that lesson is where reason-node genuinely transfers.
 *
 * For every form/role whose lesson the caller supplies real evidence for
 * (`evidenceByLessonId` — a role lesson outside the caller's currently built
 * scope, e.g. a future M13+ lesson, is silently skipped: not yet judgeable,
 * exactly like {@link validateA2GrammarSpiral}'s own `resolvePosition`
 * treats an unresolvable id), this verifies the lesson's own authored
 * variants — never `recipe.primaryCanDoId`/`supportingCanDoIds`
 * declarations alone, which are hand-authored labels that can drift exactly
 * like the lesson-id reference itself already did — contain at least one
 * MODEL or TRANSFER variant whose sentence family genuinely serves the
 * form's own Can-do (per `servingFamiliesByCanDoId`, derived from the real,
 * frozen `SentenceFamily.canDoIds`). Since a role's own *transfer* lesson
 * specifically promises a freer-task TRANSFER of the construction — never
 * just a walk-on model cameo — this additionally requires at least one of
 * those matching variants to itself be pedagogically a `"transfer"`.
 */
export function auditA2GrammarSpiralEvidence(
  forms: readonly A2GrammarForm[],
  servingFamiliesByCanDoId: ReadonlyMap<string, ReadonlySet<string>>,
  evidenceByLessonId: ReadonlyMap<LessonId, GrammarEvidenceLesson>,
): GrammarEvidenceResult {
  const errors: GrammarEvidenceError[] = [];

  for (const form of forms) {
    const servingFamilies = servingFamiliesByCanDoId.get(form.canDoId) ?? new Set<string>();
    for (const role of GRAMMAR_EVIDENCE_ROLES) {
      const lessonId = roleLessonId(form, role);
      const lesson = evidenceByLessonId.get(lessonId);
      if (!lesson) continue; // outside the caller's currently-built scope — not yet judgeable

      const matching = lesson.variants.filter((v) => servingFamilies.has(v.sentenceFamilyId));
      if (matching.length === 0) {
        errors.push({ code: "grammar-form-no-role-evidence", id: `${form.id}:${role}:${lessonId}` });
        continue;
      }
      if (role === "transfer" && !matching.some((v) => v.pedagogicalUse === "transfer")) {
        errors.push({ code: "grammar-form-no-transfer-pedagogical-evidence", id: `${form.id}:${lessonId}` });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
