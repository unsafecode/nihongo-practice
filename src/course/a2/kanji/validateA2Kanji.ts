/**
 * Validator for the A2 contextual kanji contract (Phase 3 Task 3, locked
 * decision L3): exact count/distribution, strict four-stage cardinality and
 * canonical order per entry, no glyph first introduced inside a synthesis
 * lesson, every exposure's reading resolvable and owned by its own entry, no
 * "standalone dump" (every exposure must carry a real contextual lexeme
 * sense and context), and — for every assessed exposure, in every
 * recognition mode — the assistance policy must actually withhold furigana
 * and romaji (a policy can be injected for testing; it defaults to the real
 * {@link a2KanjiAssistancePolicy}, so this check runs against production
 * behavior by default and is never dead code).
 *
 * ## Deterministic code mapping for ambiguous/compound failures
 *
 * There is no dedicated "unknown kanji entry" or "unresolvable lesson id"
 * code in the frozen A2 release vocabulary, so this validator maps them to
 * the closest named code, deterministically:
 *
 * - An exposure whose `kanjiId` matches no known entry, or whose
 *   `readingId` does not resolve to a reading owned by (and declared in)
 *   that entry, is reported as `kanji-unknown-reading` — the entry can't be
 *   resolved well enough to check reading ownership, so it is reported under
 *   the reading-resolution code rather than inventing a new one.
 * - Per-entry stage cardinality/resolution: if the `assessed` stage is
 *   present exactly once and its lesson id resolves, but any of
 *   `first-supported` / `supported-retrieval` / `revealable` is missing,
 *   duplicated, or unresolvable, the entry is `kanji-assessed-without-support`
 *   (it has been assessed without the earlier support stages actually being
 *   in place). If instead the `assessed` stage itself is missing, duplicated,
 *   or unresolvable (regardless of the other three), the entry is
 *   `kanji-exposure-order` — a broken assessed stage is a more fundamental
 *   structural break than "assessed without support", so the general
 *   ordering code is used instead.
 * - When all four stages resolve to exactly one lesson each: violating
 *   `first-supported < supported-retrieval` or `supported-retrieval <
 *   revealable` is `kanji-exposure-order`; violating `revealable < assessed`
 *   specifically is `kanji-furigana-premature-hide` (the dedicated code for
 *   the furigana-hide timing boundary, which also covers the
 *   revealable-equals-assessed case).
 */

import type { LessonId, ModuleId } from "../../foundations/types";
import { a2KanjiAssistancePolicy } from "./kanjiAssistancePolicy";
import type {
  KanjiActivityMode,
  KanjiAssistancePolicy,
  KanjiEntry,
  KanjiExposure,
  KanjiExposureStage,
  KanjiReading,
} from "./kanjiTypes";

/** Runtime-checkable tuple of every error code this validator can raise. */
export const KANJI_VALIDATION_ERROR_CODES = [
  "kanji-count",
  "kanji-unknown-reading",
  "kanji-exposure-order",
  "kanji-synthesis-first-exposure",
  "kanji-furigana-premature-hide",
  "kanji-assessed-without-support",
  "kanji-romaji-bypass",
  "kanji-standalone-dump",
  "kanji-distribution-sum",
] as const;

export type KanjiValidationErrorCode = (typeof KANJI_VALIDATION_ERROR_CODES)[number];

export interface KanjiValidationError {
  readonly code: KanjiValidationErrorCode;
  readonly id: string;
}

export interface KanjiValidationResult {
  readonly valid: boolean;
  readonly errors: readonly KanjiValidationError[];
}

export interface ValidateA2KanjiInput {
  readonly entries: readonly KanjiEntry[];
  readonly exposures: readonly KanjiExposure[];
  readonly readings: readonly KanjiReading[];
  readonly positions: Readonly<Record<LessonId, number>>;
  readonly synthesisLessonIds: readonly LessonId[];
  readonly countByModule: Readonly<Record<ModuleId, number>>;
  readonly expectedCount: number;
  readonly expectedByModule: Readonly<Record<ModuleId, number>>;
  /** Defaults to the real {@link a2KanjiAssistancePolicy}; inject a fake only for tests. */
  readonly policy?: KanjiAssistancePolicy;
}

const ALL_MODES: readonly KanjiActivityMode[] = ["read", "choose", "match"];

/** The three stages an `assessed` exposure must be preceded by. */
const REQUIRED_SUPPORT_STAGES: readonly KanjiExposureStage[] = [
  "first-supported",
  "supported-retrieval",
  "revealable",
];

export function validateA2Kanji(input: ValidateA2KanjiInput): KanjiValidationResult {
  const errors: KanjiValidationError[] = [];
  const policy = input.policy ?? a2KanjiAssistancePolicy;

  const entriesById = new Map(input.entries.map((e) => [e.id, e]));
  const readingsById = new Map(input.readings.map((r) => [r.id, r]));
  const synthesisLessons = new Set(input.synthesisLessonIds);

  // --- total count ---------------------------------------------------------
  if (input.entries.length !== input.expectedCount) {
    errors.push({
      code: "kanji-count",
      id: `expected ${input.expectedCount}, got ${input.entries.length}`,
    });
  }

  // --- per-module distribution + overall sum --------------------------------
  const moduleIds = new Set([
    ...Object.keys(input.countByModule),
    ...Object.keys(input.expectedByModule),
  ]);
  for (const moduleId of moduleIds) {
    const actual = input.countByModule[moduleId] ?? 0;
    const expected = input.expectedByModule[moduleId] ?? 0;
    if (actual !== expected) {
      errors.push({ code: "kanji-distribution-sum", id: moduleId });
    }
  }
  const totalFromModules = Object.values(input.countByModule).reduce((a, b) => a + b, 0);
  if (totalFromModules !== input.expectedCount) {
    errors.push({ code: "kanji-distribution-sum", id: "total" });
  }

  // --- per-exposure checks: reading resolution, standalone dump, synthesis,
  //     assessed-stage assistance-policy bypass ------------------------------
  for (const exposure of input.exposures) {
    const entry = entriesById.get(exposure.kanjiId);
    if (!entry) {
      errors.push({ code: "kanji-unknown-reading", id: exposure.id });
    } else {
      const reading = readingsById.get(exposure.readingId);
      const belongsToEntry = reading !== undefined && reading.kanjiId === exposure.kanjiId;
      const declaredByEntry = entry.readingIds.includes(exposure.readingId);
      if (!belongsToEntry || !declaredByEntry) {
        errors.push({ code: "kanji-unknown-reading", id: exposure.id });
      }
    }

    if (!exposure.lexemeSenseId || !exposure.contextId) {
      errors.push({ code: "kanji-standalone-dump", id: exposure.id });
    }

    if (exposure.stage === "first-supported" && synthesisLessons.has(exposure.lessonId)) {
      errors.push({ code: "kanji-synthesis-first-exposure", id: exposure.id });
    }

    if (exposure.stage === "assessed") {
      for (const mode of ALL_MODES) {
        const support = policy.supportFor(exposure, mode);
        if (support.furigana !== "hidden" || support.romaji !== "not-shown") {
          errors.push({ code: "kanji-romaji-bypass", id: `${exposure.id}:${mode}` });
        }
      }
    }
  }

  // --- per-entry stage cardinality + canonical order ------------------------
  const exposuresByKanji = new Map<string, KanjiExposure[]>();
  for (const exposure of input.exposures) {
    const list = exposuresByKanji.get(exposure.kanjiId) ?? [];
    list.push(exposure);
    exposuresByKanji.set(exposure.kanjiId, list);
  }

  const resolveSinglePosition = (list: readonly KanjiExposure[]): number | undefined => {
    if (list.length !== 1) return undefined;
    return input.positions[list[0].lessonId];
  };

  for (const entry of input.entries) {
    const exposuresForEntry = exposuresByKanji.get(entry.id) ?? [];
    const byStage = (stage: KanjiExposureStage) =>
      exposuresForEntry.filter((e) => e.stage === stage);

    const assessedPos = resolveSinglePosition(byStage("assessed"));
    const assessedOk = assessedPos !== undefined;

    const supportPositions = REQUIRED_SUPPORT_STAGES.map((stage) =>
      resolveSinglePosition(byStage(stage)),
    );
    const othersOk = supportPositions.every((p): p is number => p !== undefined);

    if (assessedOk && !othersOk) {
      errors.push({ code: "kanji-assessed-without-support", id: entry.id });
      continue;
    }
    if (!assessedOk) {
      errors.push({ code: "kanji-exposure-order", id: entry.id });
      continue;
    }

    const [firstSupportedPos, supportedRetrievalPos, revealablePos] = supportPositions as readonly number[];
    if (!(firstSupportedPos < supportedRetrievalPos)) {
      errors.push({ code: "kanji-exposure-order", id: entry.id });
    }
    if (!(supportedRetrievalPos < revealablePos)) {
      errors.push({ code: "kanji-exposure-order", id: entry.id });
    }
    if (!(revealablePos < assessedPos)) {
      errors.push({ code: "kanji-furigana-premature-hide", id: entry.id });
    }
  }

  return { valid: errors.length === 0, errors };
}
