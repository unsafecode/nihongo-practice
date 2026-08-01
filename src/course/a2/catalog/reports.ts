/**
 * Whole-level QA reports for the assembled A2 catalog (Phase 3 Task 7).
 *
 * Combines the 60 lesson rows `validateFoundations` already computes
 * (surfaced through the module-level `validateFoundations` call below) with
 * the two whole-level dimensions A1 never needed: the 15-row grammar spiral
 * (structural + content-evidence verdict per form, see
 * `forms/validateA2GrammarSpiral.ts`) and the 120-glyph contextual kanji
 * catalog (order/no-bypass verdict per glyph, see
 * `kanji/validateA2Kanji.ts`). Everything here is a *computed* actual,
 * never an authored aggregate: row order is canonical (by lesson position/
 * id), so the rendered Markdown is byte-identical no matter how the input
 * catalogs happen to be ordered.
 *
 * `A2_REPORT=1` in the environment prints the Markdown to stdout once (for
 * pipeline capture); importing the module has no side effects otherwise.
 */

import {
  compareStrings,
  sortedUnique,
  type CheckpointReportRow,
} from "../../foundations/reports";
import { validateFoundations } from "../../foundations/validateFoundations";
import {
  a2FoundationCatalogs,
  a2FoundationCopy,
  a2SemanticBuiltLessons,
  A2_AVAILABLE_CONTENT_BY_LESSON,
} from "./catalog";
import { A2_CANONICAL_POSITIONS } from "../manifest";
import { A2_CANDO_REGISTRY, type A2CanDoGroup } from "./canDos";
import { A2_GRAMMAR_SPIRAL, type A2GrammarForm } from "../forms/grammarSpiral";
import {
  validateA2GrammarSpiral,
  auditA2GrammarSpiralEvidence,
  type GrammarEvidenceLesson,
} from "../forms/validateA2GrammarSpiral";
import { validateA2Kanji } from "../kanji/validateA2Kanji";
import {
  A2_KANJI_ENTRIES,
  A2_KANJI_EXPOSURES,
  A2_KANJI_READINGS,
  A2_KANJI_DISTRIBUTION,
  a2KanjiCountByModule,
} from "../kanji/a2KanjiCatalog";
import type { KanjiExposure } from "../kanji/kanjiTypes";
import { A2_RELEASE_CATALOG_VERSION, A2_RELEASE_SEED } from "../releaseIdentity";

// Re-exported (not redeclared) from `../releaseIdentity`. Coverage reports
// describe the selection a learner is actually served, so they must be built
// from the same `catalogVersion`/`seed` the validator and runtime use.
export { A2_RELEASE_CATALOG_VERSION, A2_RELEASE_SEED };

// ---------------------------------------------------------------------------
// Report row contracts
// ---------------------------------------------------------------------------

/** One row of the combined 60-lesson coverage table. */
export interface A2LessonReportRow {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly position: number;
  readonly modelCount: number;
  readonly exerciseCount: number;
  readonly uniqueTargetCount: number;
  readonly maximumVisibleReuse: number;
  readonly predicateCount: number;
  readonly roleCount: number;
  readonly contextCount: number;
  readonly transferCount: number;
  /** Whether round two's exercise kinds include `constrained-construction`
   * (every A2 instructional lesson's `requireControlledConstruction`
   * contract — see `instructionalLessonKit.ts`). */
  readonly controlledProduction: boolean;
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly complete: boolean;
}

/** One row of the 15-module coverage table. */
export interface A2ModuleReportRow {
  readonly moduleId: string;
  readonly order: number;
  readonly lessonIds: readonly string[];
  readonly lessonCount: number;
  readonly modelCount: number;
  readonly exerciseCount: number;
  readonly transferCount: number;
  readonly canDoIds: readonly string[];
  readonly complete: boolean;
}

/** The single A2 level row. */
export interface A2LevelReportRow {
  readonly level: "a2";
  readonly moduleCount: number;
  readonly lessonCount: number;
  readonly modelCount: number;
  readonly exerciseCount: number;
  readonly transferCount: number;
  readonly complete: boolean;
}

/** One row of the Can-do evidence table. */
export interface A2CanDoReportRow {
  readonly canDoId: string;
  readonly group: A2CanDoGroup;
  readonly domain: string;
  readonly lessonIds: readonly string[];
  readonly transferEvidenceCount: number;
  readonly sourceNote: string;
}

/** One row of the 15-form grammar spiral table. */
export interface A2GrammarReportRow {
  readonly formId: string;
  readonly canDoId: string;
  readonly introLessonId: string;
  readonly controlledPracticeLessonId: string;
  readonly transferLessonId: string;
  readonly recurrenceLessonIds: readonly string[];
  /** From `validateA2GrammarSpiral`: every role resolves, in canonical order. */
  readonly structurallyValid: boolean;
  /** From `auditA2GrammarSpiralEvidence`: every role is backed by real,
   * content-matching lesson variants (transfer role additionally requires a
   * `pedagogicalUse: "transfer"` match). */
  readonly evidenceComplete: boolean;
}

/** One row of the 120-glyph kanji table. */
export interface A2KanjiEntryReportRow {
  readonly kanjiId: string;
  readonly glyph: string;
  readonly firstSupportedLessonId: string;
  readonly supportedRetrievalLessonId: string;
  readonly revealableLessonId: string;
  readonly assessedLessonId: string;
  /** first-supported < supported-retrieval < revealable < assessed, all in
   * canonical position order (`kanji-exposure-order`/
   * `kanji-furigana-premature-hide` never fire for this glyph). */
  readonly orderValid: boolean;
  /** No `kanji-romaji-bypass`: furigana/romaji are genuinely withheld at
   * the assessed stage in every recognition mode. */
  readonly noBypassValid: boolean;
}

/** The whole-level kanji report. */
export interface A2KanjiReport {
  readonly total: number;
  readonly byModule: Readonly<Record<string, number>>;
  readonly entries: readonly A2KanjiEntryReportRow[];
  readonly valid: boolean;
  readonly errorCodes: readonly string[];
}

export interface A2CoverageReports {
  readonly levels: readonly string[];
  readonly moduleCount: number;
  readonly lessonCount: number;
  readonly byLesson: readonly A2LessonReportRow[];
  readonly byModule: readonly A2ModuleReportRow[];
  readonly byLevel: A2LevelReportRow;
  readonly canDos: readonly A2CanDoReportRow[];
  readonly grammar: readonly A2GrammarReportRow[];
  readonly kanji: A2KanjiReport;
  readonly checkpoint: CheckpointReportRow;
  readonly validation: {
    readonly valid: boolean;
    readonly foundationComplete: boolean;
    readonly errorCodes: readonly string[];
  };
}

// ---------------------------------------------------------------------------
// Pure builders
// ---------------------------------------------------------------------------

function buildGrammarRows(): readonly A2GrammarReportRow[] {
  const structural = validateA2GrammarSpiral(A2_GRAMMAR_SPIRAL, A2_CANONICAL_POSITIONS);
  const structurallyInvalidFormIds = new Set(structural.errors.map((error) => error.id.split(":")[0]));

  const servingFamiliesByCanDoId = new Map<string, Set<string>>();
  for (const family of a2FoundationCatalogs.sentenceFamilies) {
    for (const canDoId of family.canDoIds) {
      const set = servingFamiliesByCanDoId.get(canDoId) ?? new Set<string>();
      set.add(family.id);
      servingFamiliesByCanDoId.set(canDoId, set);
    }
  }

  const evidenceByLessonId = new Map<string, GrammarEvidenceLesson>();
  for (const built of a2SemanticBuiltLessons) {
    evidenceByLessonId.set(built.recipe.id, {
      variants: built.variants.map((variant) => ({
        sentenceFamilyId: variant.sentenceFamilyId,
        pedagogicalUse: variant.pedagogicalUse,
      })),
    });
  }
  const evidence = auditA2GrammarSpiralEvidence(A2_GRAMMAR_SPIRAL, servingFamiliesByCanDoId, evidenceByLessonId);
  const invalidEvidenceFormIds = new Set(evidence.errors.map((error) => error.id.split(":")[0]));

  return [...A2_GRAMMAR_SPIRAL]
    .sort((left: A2GrammarForm, right: A2GrammarForm) => compareStrings(left.id, right.id))
    .map((row) => ({
      formId: row.id,
      canDoId: row.canDoId,
      introLessonId: row.introLessonId,
      controlledPracticeLessonId: row.controlledPracticeLessonId,
      transferLessonId: row.transferLessonId,
      recurrenceLessonIds: row.recurrenceLessonIds,
      structurallyValid: !structurallyInvalidFormIds.has(row.id),
      evidenceComplete: !invalidEvidenceFormIds.has(row.id),
    }));
}

function buildKanjiReport(): A2KanjiReport {
  const countByModule = a2KanjiCountByModule();
  const result = validateA2Kanji({
    entries: A2_KANJI_ENTRIES,
    exposures: A2_KANJI_EXPOSURES,
    readings: A2_KANJI_READINGS,
    positions: A2_CANONICAL_POSITIONS,
    synthesisLessonIds: ["a2-synthesis-1", "a2-synthesis-2", "a2-synthesis-3", "a2-synthesis-4"],
    countByModule,
    expectedCount: 120,
    expectedByModule: A2_KANJI_DISTRIBUTION,
  });
  const invalidEntryIds = new Set(
    result.errors
      .filter((error) => error.code === "kanji-exposure-order" || error.code === "kanji-furigana-premature-hide" || error.code === "kanji-assessed-without-support")
      .map((error) => error.id),
  );
  const bypassEntryIds = new Set(
    result.errors
      .filter((error) => error.code === "kanji-romaji-bypass")
      .map((error) => error.id.split(":")[0]),
  );

  const exposuresByKanji = new Map<string, KanjiExposure[]>();
  for (const exposure of A2_KANJI_EXPOSURES) {
    const list = exposuresByKanji.get(exposure.kanjiId) ?? [];
    list.push(exposure);
    exposuresByKanji.set(exposure.kanjiId, list);
  }

  const entries: A2KanjiEntryReportRow[] = [...A2_KANJI_ENTRIES]
    .sort((left, right) => compareStrings(left.id, right.id))
    .map((entry) => {
      const exposures = exposuresByKanji.get(entry.id) ?? [];
      const byStage = (stage: string) => exposures.find((exposure) => exposure.stage === stage);
      return {
        kanjiId: entry.id,
        glyph: entry.glyph,
        firstSupportedLessonId: byStage("first-supported")?.lessonId ?? "",
        supportedRetrievalLessonId: byStage("supported-retrieval")?.lessonId ?? "",
        revealableLessonId: byStage("revealable")?.lessonId ?? "",
        assessedLessonId: byStage("assessed")?.lessonId ?? "",
        orderValid: !invalidEntryIds.has(entry.id),
        noBypassValid: !bypassEntryIds.has(entry.id),
      };
    });

  return {
    total: A2_KANJI_ENTRIES.length,
    byModule: countByModule,
    entries,
    valid: result.valid,
    errorCodes: sortedUnique(result.errors.map((error) => error.code)),
  };
}

function computeTransferEvidenceCounts(): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  const familyById = new Map(a2FoundationCatalogs.sentenceFamilies.map((family) => [family.id, family]));
  for (const variant of a2FoundationCatalogs.sentenceVariants) {
    if (variant.pedagogicalUse !== "transfer") continue;
    const family = familyById.get(variant.sentenceFamilyId);
    if (!family) continue;
    for (const canDoId of family.canDoIds) {
      counts.set(canDoId, (counts.get(canDoId) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Builds the combined 60-lesson release report from the real, frozen A2
 * release catalogs (never a fixture) — the real `validateFoundations` result
 * is computed fresh (deterministic given the fixed catalog version/seed
 * below), so every lesson row, the grammar spiral, and the kanji catalog
 * report against genuinely current data.
 */
export function buildA2Reports(): A2CoverageReports {
  const result = validateFoundations({
    catalogs: a2FoundationCatalogs,
    foundationCopy: a2FoundationCopy,
    catalogVersion: A2_RELEASE_CATALOG_VERSION,
    seed: A2_RELEASE_SEED,
    availableContentByLesson: A2_AVAILABLE_CONTENT_BY_LESSON,
  });
  const foundation = result.reports;
  const builtByLessonId = new Map(a2SemanticBuiltLessons.map((built) => [built.recipe.id, built]));

  // --- 60 lesson rows -------------------------------------------------------
  const lessonRows: A2LessonReportRow[] = [];
  for (const [lessonId, row] of Object.entries(foundation.byLesson)) {
    const built = builtByLessonId.get(lessonId);
    const controlledProduction =
      built?.recipe.practice.roundTwo.exerciseKinds.includes("constrained-construction") ?? false;
    lessonRows.push({
      lessonId,
      moduleId: row.moduleId,
      position: A2_CANONICAL_POSITIONS[lessonId] ?? row.position,
      modelCount: row.modelCount,
      exerciseCount: row.exerciseCount,
      uniqueTargetCount: row.uniqueVisibleTargetCount,
      maximumVisibleReuse: row.maximumVisibleReuse,
      predicateCount: row.predicateSenseIds.length,
      roleCount: row.roleIds.length,
      contextCount: row.contextIds.length,
      transferCount: row.transferTargetIds.length,
      controlledProduction,
      primaryCanDoId: row.primaryCanDoId,
      supportingCanDoIds: row.supportingCanDoIds,
      complete: row.complete,
    });
  }
  lessonRows.sort((left, right) => left.position - right.position || compareStrings(left.lessonId, right.lessonId));

  // --- 15 module rows --------------------------------------------------------
  const rowsByModule = new Map<string, A2LessonReportRow[]>();
  for (const row of lessonRows) {
    const list = rowsByModule.get(row.moduleId) ?? [];
    list.push(row);
    rowsByModule.set(row.moduleId, list);
  }
  const moduleRows: A2ModuleReportRow[] = a2FoundationCatalogs.modules.map((module) => {
    const rows = rowsByModule.get(module.id) ?? [];
    const foundationModule = foundation.byModule[module.id];
    let modelCount = 0;
    let exerciseCount = 0;
    let complete = true;
    for (const row of rows) {
      modelCount += row.modelCount;
      exerciseCount += row.exerciseCount;
      if (!row.complete) complete = false;
    }
    return {
      moduleId: module.id,
      order: module.order,
      lessonIds: rows.map((row) => row.lessonId),
      lessonCount: rows.length,
      modelCount,
      exerciseCount,
      transferCount: foundationModule ? foundationModule.transferTargetIds.length : 0,
      canDoIds: foundationModule ? [...foundationModule.canDoIds] : sortedUnique(rows.map((row) => row.primaryCanDoId)),
      complete,
    };
  });
  moduleRows.sort((left, right) => left.order - right.order);

  // --- level row ---------------------------------------------------------
  const levelModels = moduleRows.reduce((sum, row) => sum + row.modelCount, 0);
  const levelExercises = moduleRows.reduce((sum, row) => sum + row.exerciseCount, 0);
  const foundationLevel = foundation.byLevel["a2"];
  const byLevel: A2LevelReportRow = {
    level: "a2",
    moduleCount: moduleRows.length,
    lessonCount: lessonRows.length,
    modelCount: levelModels,
    exerciseCount: levelExercises,
    transferCount: foundationLevel ? foundationLevel.transferCount : 0,
    complete: moduleRows.every((row) => row.complete),
  };

  // --- Can-do rows -----------------------------------------------------------
  const transferEvidence = computeTransferEvidenceCounts();
  const registryById = new Map(A2_CANDO_REGISTRY.map((stub) => [stub.id, stub]));
  const canDoRows: A2CanDoReportRow[] = [...a2FoundationCatalogs.canDos]
    .sort((left, right) => compareStrings(left.id, right.id))
    .map((canDo) => {
      const registered = registryById.get(canDo.id);
      return {
        canDoId: canDo.id,
        group: registered?.group ?? "topical",
        domain: canDo.domain,
        lessonIds: [...canDo.lessonIds].sort(compareStrings),
        transferEvidenceCount: transferEvidence.get(canDo.id) ?? 0,
        sourceNote: canDo.sourceNote ?? "",
      };
    });

  // --- checkpoint row ----------------------------------------------------
  const checkpoint = foundation.checkpoints.find((row) => row.checkpointId === "a2-checkpoint");
  if (!checkpoint) {
    throw new Error("buildA2Reports: a2-checkpoint not present in the foundation report — this is a wiring bug.");
  }

  return {
    levels: ["a2"],
    moduleCount: moduleRows.length,
    lessonCount: lessonRows.length,
    byLesson: lessonRows,
    byModule: moduleRows,
    byLevel,
    canDos: canDoRows,
    grammar: buildGrammarRows(),
    kanji: buildKanjiReport(),
    checkpoint,
    validation: {
      valid: result.valid,
      foundationComplete: result.valid,
      errorCodes: sortedUnique(result.errors.map((error) => error.code)),
    },
  };
}

// ---------------------------------------------------------------------------
// Deterministic Markdown rendering
// ---------------------------------------------------------------------------

export function a2ReportMarkdown(reports: A2CoverageReports = buildA2Reports()): string {
  const lines: string[] = [];

  lines.push("# A2 release report");
  lines.push("");
  lines.push(`Release valid: ${reports.validation.valid ? "yes" : "no"}`);
  lines.push(`Foundation complete: ${reports.validation.foundationComplete ? "yes" : "no"}`);
  if (reports.validation.errorCodes.length > 0) {
    lines.push(`Error codes: ${reports.validation.errorCodes.join(", ")}`);
  }
  lines.push("");

  lines.push("## Level");
  lines.push("");
  lines.push("| Level | Modules | Lessons | Models | Exercises | Transfers |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: |");
  lines.push(
    `| ${reports.byLevel.level} | ${reports.byLevel.moduleCount} | ${reports.byLevel.lessonCount} | ${reports.byLevel.modelCount} | ${reports.byLevel.exerciseCount} | ${reports.byLevel.transferCount} |`,
  );
  lines.push("");

  lines.push("## Modules");
  lines.push("");
  lines.push("| Order | Module | Lessons | Models | Exercises | Transfers | Can-dos |");
  lines.push("| ---: | --- | ---: | ---: | ---: | ---: | --- |");
  for (const row of reports.byModule) {
    lines.push(
      `| ${row.order} | ${row.moduleId} | ${row.lessonCount} | ${row.modelCount} | ${row.exerciseCount} | ${row.transferCount} | ${row.canDoIds.join(", ")} |`,
    );
  }
  lines.push("");

  lines.push("## Lessons");
  lines.push("");
  lines.push(
    "| Pos | Lesson | Models | Predicates | Roles | Contexts | Exercises | Unique | Max reuse | Transfers | Controlled | Can-do |",
  );
  lines.push("| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |");
  for (const row of reports.byLesson) {
    lines.push(
      `| ${row.position} | ${row.lessonId} | ${row.modelCount} | ${row.predicateCount} | ${row.roleCount} | ${row.contextCount} | ${row.exerciseCount} | ${row.uniqueTargetCount} | ${row.maximumVisibleReuse} | ${row.transferCount} | ${row.controlledProduction ? "yes" : "no"} | ${row.primaryCanDoId} |`,
    );
  }
  lines.push("");

  lines.push("## Grammar spiral");
  lines.push("");
  lines.push("| Form | Can-do | Intro | Practice | Transfer | Recurrence | Structural | Evidence |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const row of reports.grammar) {
    lines.push(
      `| ${row.formId} | ${row.canDoId} | ${row.introLessonId} | ${row.controlledPracticeLessonId} | ${row.transferLessonId} | ${row.recurrenceLessonIds.join(", ")} | ${row.structurallyValid ? "ok" : "FAIL"} | ${row.evidenceComplete ? "ok" : "FAIL"} |`,
    );
  }
  lines.push("");

  lines.push("## Kanji");
  lines.push("");
  lines.push(`Total glyphs: ${reports.kanji.total} (valid: ${reports.kanji.valid ? "yes" : "no"})`);
  lines.push("");
  lines.push("| Module | New glyphs |");
  lines.push("| --- | ---: |");
  for (const [moduleId, count] of Object.entries(reports.kanji.byModule).sort((left, right) => compareStrings(left[0], right[0]))) {
    lines.push(`| ${moduleId} | ${count} |`);
  }
  lines.push("");
  lines.push("| Kanji | Glyph | First | Retrieval | Revealable | Assessed | Order | No-bypass |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const entry of reports.kanji.entries) {
    lines.push(
      `| ${entry.kanjiId} | ${entry.glyph} | ${entry.firstSupportedLessonId} | ${entry.supportedRetrievalLessonId} | ${entry.revealableLessonId} | ${entry.assessedLessonId} | ${entry.orderValid ? "ok" : "FAIL"} | ${entry.noBypassValid ? "ok" : "FAIL"} |`,
    );
  }
  lines.push("");

  lines.push("## Can-dos");
  lines.push("");
  lines.push("| Can-do | Group | Domain | Transfer evidence | Lessons |");
  lines.push("| --- | --- | --- | ---: | --- |");
  for (const row of reports.canDos) {
    lines.push(
      `| ${row.canDoId} | ${row.group} | ${row.domain} | ${row.transferEvidenceCount} | ${row.lessonIds.join(", ")} |`,
    );
  }
  lines.push("");

  lines.push("## Checkpoint");
  lines.push("");
  lines.push("| Checkpoint | Level | Sampled Can-dos | Min transfer targets |");
  lines.push("| --- | --- | --- | ---: |");
  lines.push(
    `| ${reports.checkpoint.checkpointId} | ${reports.checkpoint.level} | ${reports.checkpoint.sampledCanDoIds.length} | ${reports.checkpoint.minAcceptedTransferTargetsPerCanDo} |`,
  );

  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Optional, env-gated print (no side effects unless A2_REPORT=1)
// ---------------------------------------------------------------------------

if (typeof process !== "undefined" && process.env && process.env.A2_REPORT === "1") {
  // eslint-disable-next-line no-console
  console.log(a2ReportMarkdown());
}
