/**
 * Whole-level QA reports for the assembled A1 catalog (§16, Phase 2 Task 4).
 *
 * This module combines the 60 semantic lesson rows already computed by
 * `validateFoundations` (surfaced through `validateA1`) with the four phonetic
 * sounds lessons — which carry no sentence variants and therefore need their
 * own phonetic-specific fields — into a single 64-row release view, and adds
 * the module, level, verb-recurrence, Can-do, checkpoint and alias tables a
 * reviewer needs to sign off on the level. Everything here is a *computed*
 * actual, never an authored aggregate: the row order is canonical (by lesson
 * position / id), so the rendered Markdown is byte-identical no matter how the
 * input catalogs or copy keys happen to be ordered.
 *
 * `A1_REPORT=1` in the environment prints the Markdown to stdout once (for
 * pipeline capture); importing the module has no side effects otherwise.
 */

import {
  compareStrings,
  sortedUnique,
  type FoundationCoverageReports,
  type VerbUseReportRow,
  type CheckpointReportRow,
} from "../../foundations/reports";
import type { CanDo } from "../../foundations/types";
import { validateA1, type ValidateA1Result } from "./validateA1";
import { a1FoundationCatalogs, a1AllLessonPositions } from "./catalog";
import { module1ItemsByLesson, module1Lessons, type A1PhoneticItem } from "./module01Sounds";
import { a1CanDosAuthored, A1_SCENARIO_CANDO_IDS } from "./canDos";
import { A1_LEGACY_LESSON_ALIASES } from "../manifest";

// ---------------------------------------------------------------------------
// Report row contracts
// ---------------------------------------------------------------------------

/** Phonetic-specific coverage for one sounds lesson. */
export interface A1PhoneticLessonFields {
  readonly itemCount: number;
  readonly contrastFeatures: readonly string[];
  readonly exerciseKinds: readonly string[];
  readonly exerciseRefCount: number;
  readonly glyphs: readonly string[];
}

/** One row of the combined 64-lesson coverage table. */
export interface A1LessonReportRow {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly position: number;
  readonly kind: "semantic" | "phonetic";
  readonly modelCount: number;
  readonly familyCount: number;
  readonly predicateCount: number;
  readonly roleCount: number;
  readonly contextCount: number;
  readonly exerciseCount: number;
  readonly uniqueTargetCount: number;
  readonly maximumVisibleReuse: number;
  readonly transferCount: number;
  readonly primaryCanDoId: string;
  /** Present only for the four phonetic sounds lessons. */
  readonly phonetic?: A1PhoneticLessonFields;
  readonly complete: boolean;
}

/** One row of the 16-module coverage table. */
export interface A1ModuleReportRow {
  readonly moduleId: string;
  readonly order: number;
  readonly kind: "semantic" | "phonetic";
  readonly lessonIds: readonly string[];
  readonly lessonCount: number;
  readonly modelCount: number;
  readonly exerciseCount: number;
  readonly transferCount: number;
  readonly phoneticItemCount: number;
  readonly canDoIds: readonly string[];
  readonly complete: boolean;
}

/** The single A1 level row. */
export interface A1LevelReportRow {
  readonly level: "a1";
  readonly moduleCount: number;
  readonly lessonCount: number;
  readonly modelCount: number;
  readonly exerciseCount: number;
  readonly transferCount: number;
  readonly phoneticItemCount: number;
  readonly verbRecordCount: number;
  readonly complete: boolean;
}

/** One row of the Can-do evidence table. */
export interface A1CanDoReportRow {
  readonly canDoId: string;
  readonly domain: string;
  readonly scope: "module" | "scenario";
  readonly lessonIds: readonly string[];
  readonly primaryLessonCount: number;
  readonly supportingLessonCount: number;
  readonly transferEvidenceCount: number;
  readonly sourceNote: string;
}

/** One row of the legacy-alias table. */
export interface A1AliasReportRow {
  readonly legacyLessonId: string;
  readonly canonicalLessonId: string;
}

export interface A1CoverageReports {
  readonly byLesson: readonly A1LessonReportRow[];
  readonly byModule: readonly A1ModuleReportRow[];
  readonly level: A1LevelReportRow;
  readonly verbUse: readonly VerbUseReportRow[];
  readonly checkpoints: readonly CheckpointReportRow[];
  readonly canDos: readonly A1CanDoReportRow[];
  readonly aliases: readonly A1AliasReportRow[];
  readonly validation: {
    readonly valid: boolean;
    readonly foundationComplete: boolean;
    readonly errorCodes: readonly string[];
    readonly foundationDiagnostics: readonly string[];
  };
}

// ---------------------------------------------------------------------------
// Pure builders
// ---------------------------------------------------------------------------

function phoneticFields(items: readonly A1PhoneticItem[]): A1PhoneticLessonFields {
  return {
    itemCount: items.length,
    contrastFeatures: sortedUnique(items.map((item) => item.contrastFeature)),
    exerciseKinds: sortedUnique(items.map((item) => item.exerciseKind)),
    exerciseRefCount: new Set(items.map((item) => item.exerciseRefId)).size,
    glyphs: items.map((item) => item.glyph),
  };
}

/**
 * Builds the combined 64-lesson release report from a `validateA1` result
 * (defaulting to the frozen release view). The semantic rows come verbatim from
 * the wrapped foundation report; the phonetic rows are computed from the sounds
 * module items.
 */
export function buildA1Reports(result: ValidateA1Result = validateA1()): A1CoverageReports {
  const foundation: FoundationCoverageReports = result.foundationReport.reports;
  const positionByLesson = new Map(a1AllLessonPositions.map((record) => [record.lessonId, record]));

  // --- 64 lesson rows ------------------------------------------------------
  const lessonRows: A1LessonReportRow[] = [];

  for (const [lessonId, row] of Object.entries(foundation.byLesson)) {
    const position = positionByLesson.get(lessonId);
    lessonRows.push({
      lessonId,
      moduleId: row.moduleId,
      position: position?.position ?? row.position,
      kind: "semantic",
      modelCount: row.modelCount,
      familyCount: row.familyIds.length,
      predicateCount: row.predicateSenseIds.length,
      roleCount: row.roleIds.length,
      contextCount: row.contextIds.length,
      exerciseCount: row.exerciseCount,
      uniqueTargetCount: row.uniqueVisibleTargetCount,
      maximumVisibleReuse: row.maximumVisibleReuse,
      transferCount: row.transferTargetIds.length,
      primaryCanDoId: row.primaryCanDoId,
      complete: row.complete,
    });
  }

  const recipeById = new Map(module1Lessons.map((recipe) => [recipe.id, recipe]));
  for (const [lessonId, items] of Object.entries(module1ItemsByLesson)) {
    const position = positionByLesson.get(lessonId);
    const recipe = recipeById.get(lessonId);
    const fields = phoneticFields(items);
    lessonRows.push({
      lessonId,
      moduleId: position?.moduleId ?? "sounds",
      position: position?.position ?? 0,
      kind: "phonetic",
      modelCount: 0,
      familyCount: 0,
      predicateCount: 0,
      roleCount: 0,
      contextCount: 0,
      exerciseCount: fields.exerciseRefCount,
      uniqueTargetCount: fields.itemCount,
      maximumVisibleReuse: 0,
      transferCount: 0,
      primaryCanDoId: recipe?.primaryCanDoId ?? "a1-can-do-sounds",
      phonetic: fields,
      complete: items.length > 0,
    });
  }

  lessonRows.sort((left, right) => left.position - right.position || compareStrings(left.lessonId, right.lessonId));

  // --- 12 module rows ------------------------------------------------------
  const rowsByModule = new Map<string, A1LessonReportRow[]>();
  for (const row of lessonRows) {
    const list = rowsByModule.get(row.moduleId) ?? [];
    list.push(row);
    rowsByModule.set(row.moduleId, list);
  }
  const moduleRows: A1ModuleReportRow[] = a1FoundationCatalogs.modules.map((module) => {
    const rows = rowsByModule.get(module.id) ?? [];
    const foundationModule = foundation.byModule[module.id];
    let modelCount = 0;
    let exerciseCount = 0;
    let phoneticItemCount = 0;
    let complete = true;
    for (const row of rows) {
      modelCount += row.modelCount;
      exerciseCount += row.exerciseCount;
      if (row.phonetic) phoneticItemCount += row.phonetic.itemCount;
      if (!row.complete) complete = false;
    }
    return {
      moduleId: module.id,
      order: module.order,
      kind: rows.some((row) => row.kind === "phonetic") ? "phonetic" : "semantic",
      lessonIds: rows.map((row) => row.lessonId),
      lessonCount: rows.length,
      modelCount,
      exerciseCount,
      transferCount: foundationModule ? foundationModule.transferTargetIds.length : 0,
      phoneticItemCount,
      canDoIds: foundationModule ? [...foundationModule.canDoIds] : sortedUnique(rows.map((row) => row.primaryCanDoId)),
      complete,
    };
  });
  moduleRows.sort((left, right) => left.order - right.order);

  // --- level row -----------------------------------------------------------
  const levelModels = moduleRows.reduce((sum, row) => sum + row.modelCount, 0);
  const levelExercises = moduleRows.reduce((sum, row) => sum + row.exerciseCount, 0);
  const levelPhonetic = moduleRows.reduce((sum, row) => sum + row.phoneticItemCount, 0);
  const foundationLevel = foundation.byLevel["a1"];
  const level: A1LevelReportRow = {
    level: "a1",
    moduleCount: moduleRows.length,
    lessonCount: lessonRows.length,
    modelCount: levelModels,
    exerciseCount: levelExercises,
    transferCount: foundationLevel ? foundationLevel.transferCount : 0,
    phoneticItemCount: levelPhonetic,
    verbRecordCount: foundation.verbUse.length,
    complete: moduleRows.every((row) => row.complete),
  };

  // --- Can-do evidence rows ------------------------------------------------
  const canDoTransferEvidence = countTransferEvidence();
  const scenarioSet = new Set<string>(A1_SCENARIO_CANDO_IDS);
  const primaryByCanDo = new Map<string, number>();
  const supportingByCanDo = new Map<string, number>();
  for (const lesson of a1FoundationCatalogs.lessons) {
    primaryByCanDo.set(lesson.primaryCanDoId, (primaryByCanDo.get(lesson.primaryCanDoId) ?? 0) + 1);
    for (const supporting of lesson.supportingCanDoIds) {
      supportingByCanDo.set(supporting, (supportingByCanDo.get(supporting) ?? 0) + 1);
    }
  }
  const canDoRows: A1CanDoReportRow[] = [...a1CanDosAuthored]
    .sort((left, right) => compareStrings(left.id, right.id))
    .map((canDo: CanDo) => ({
      canDoId: canDo.id,
      domain: canDo.domain,
      scope: scenarioSet.has(canDo.id) ? "scenario" : "module",
      lessonIds: [...canDo.lessonIds].sort(compareStrings),
      primaryLessonCount: primaryByCanDo.get(canDo.id) ?? 0,
      supportingLessonCount: supportingByCanDo.get(canDo.id) ?? 0,
      transferEvidenceCount: canDoTransferEvidence.get(canDo.id) ?? 0,
      sourceNote: canDo.sourceNote ?? "",
    }));

  // --- alias rows ----------------------------------------------------------
  const aliasRows: A1AliasReportRow[] = Object.entries(A1_LEGACY_LESSON_ALIASES)
    .map(([legacyLessonId, canonicalLessonId]) => ({ legacyLessonId, canonicalLessonId }))
    .sort((left, right) => compareStrings(left.legacyLessonId, right.legacyLessonId));

  return {
    byLesson: lessonRows,
    byModule: moduleRows,
    level,
    verbUse: foundation.verbUse,
    checkpoints: foundation.checkpoints,
    canDos: canDoRows,
    aliases: aliasRows,
    validation: {
      valid: result.valid,
      foundationComplete: result.foundationReport.valid,
      errorCodes: sortedUnique(result.errors.map((error) => error.code)),
      foundationDiagnostics: sortedUnique(result.foundationReport.errors.map((error) => error.code)),
    },
  };
}

/** Counts distinct transfer variants whose family lists each Can-do. */
function countTransferEvidence(): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  const familyById = new Map(a1FoundationCatalogs.sentenceFamilies.map((family) => [family.id, family]));
  for (const variant of a1FoundationCatalogs.sentenceVariants) {
    if (variant.pedagogicalUse !== "transfer") continue;
    const family = familyById.get(variant.sentenceFamilyId);
    if (!family) continue;
    for (const canDoId of family.canDoIds) {
      counts.set(canDoId, (counts.get(canDoId) ?? 0) + 1);
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Deterministic Markdown rendering
// ---------------------------------------------------------------------------

export function a1ReportMarkdown(reports: A1CoverageReports = buildA1Reports()): string {
  const lines: string[] = [];

  lines.push("# A1 release report");
  lines.push("");
  lines.push(`Release valid: ${reports.validation.valid ? "yes" : "no"}`);
  lines.push(`Foundation complete: ${reports.validation.foundationComplete ? "yes" : "no"}`);
  if (reports.validation.errorCodes.length > 0) {
    lines.push(`Error codes: ${reports.validation.errorCodes.join(", ")}`);
  }
  if (reports.validation.foundationDiagnostics.length > 0) {
    lines.push(`Foundation diagnostics: ${reports.validation.foundationDiagnostics.join(", ")}`);
  }
  lines.push("");

  lines.push("## Level");
  lines.push("");
  lines.push("| Level | Modules | Lessons | Models | Exercises | Transfers | Phonetic items | Verb records |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  lines.push(
    `| ${reports.level.level} | ${reports.level.moduleCount} | ${reports.level.lessonCount} | ${reports.level.modelCount} | ${reports.level.exerciseCount} | ${reports.level.transferCount} | ${reports.level.phoneticItemCount} | ${reports.level.verbRecordCount} |`,
  );
  lines.push("");

  lines.push("## Modules");
  lines.push("");
  lines.push("| Order | Module | Kind | Lessons | Models | Exercises | Transfers | Phonetic items | Can-dos |");
  lines.push("| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const row of reports.byModule) {
    lines.push(
      `| ${row.order} | ${row.moduleId} | ${row.kind} | ${row.lessonCount} | ${row.modelCount} | ${row.exerciseCount} | ${row.transferCount} | ${row.phoneticItemCount} | ${row.canDoIds.join(", ")} |`,
    );
  }
  lines.push("");

  lines.push("## Lessons");
  lines.push("");
  lines.push(
    "| Pos | Lesson | Kind | Models | Families | Predicates | Roles | Contexts | Exercises | Unique | Max reuse | Transfers | Can-do |",
  );
  lines.push("| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const row of reports.byLesson) {
    lines.push(
      `| ${row.position} | ${row.lessonId} | ${row.kind} | ${row.modelCount} | ${row.familyCount} | ${row.predicateCount} | ${row.roleCount} | ${row.contextCount} | ${row.exerciseCount} | ${row.uniqueTargetCount} | ${row.maximumVisibleReuse} | ${row.transferCount} | ${row.primaryCanDoId} |`,
    );
  }
  lines.push("");

  lines.push("## Phonetic detail");
  lines.push("");
  lines.push("| Lesson | Items | Contrast features | Exercise kinds |");
  lines.push("| --- | ---: | --- | --- |");
  for (const row of reports.byLesson) {
    if (!row.phonetic) continue;
    lines.push(
      `| ${row.lessonId} | ${row.phonetic.itemCount} | ${row.phonetic.contrastFeatures.join(", ")} | ${row.phonetic.exerciseKinds.join(", ")} |`,
    );
  }
  lines.push("");

  lines.push("## Verb recurrence");
  lines.push("");
  lines.push("| Record | Sense | Use | Intro lesson | Intro pos | Structures | Later lessons | Max gap | Later module |");
  lines.push("| --- | --- | --- | --- | ---: | ---: | --- | ---: | --- |");
  for (const row of reports.verbUse) {
    lines.push(
      `| ${row.recordId} | ${row.senseId} | ${row.learningUse} | ${row.introductionLessonId} | ${row.introductionPosition} | ${row.distinctStructureCount} | ${row.laterUseLessonIds.join(", ")} | ${row.maxPositionGap} | ${row.hasLaterModule ? "yes" : "no"} |`,
    );
  }
  lines.push("");

  lines.push("## Can-dos");
  lines.push("");
  lines.push("| Can-do | Domain | Scope | Primary lessons | Supporting | Transfer evidence | Lessons |");
  lines.push("| --- | --- | --- | ---: | ---: | ---: | --- |");
  for (const row of reports.canDos) {
    lines.push(
      `| ${row.canDoId} | ${row.domain} | ${row.scope} | ${row.primaryLessonCount} | ${row.supportingLessonCount} | ${row.transferEvidenceCount} | ${row.lessonIds.join(", ")} |`,
    );
  }
  lines.push("");

  lines.push("## Checkpoints");
  lines.push("");
  lines.push("| Checkpoint | Level | Sampled Can-dos | Min transfer targets |");
  lines.push("| --- | --- | --- | ---: |");
  for (const row of reports.checkpoints) {
    lines.push(
      `| ${row.checkpointId} | ${row.level} | ${[...row.sampledCanDoIds].sort(compareStrings).join(", ")} | ${row.minAcceptedTransferTargetsPerCanDo} |`,
    );
  }
  lines.push("");

  lines.push("## Legacy aliases");
  lines.push("");
  lines.push("| Legacy lesson | Canonical lesson |");
  lines.push("| --- | --- |");
  for (const row of reports.aliases) {
    lines.push(`| ${row.legacyLessonId} | ${row.canonicalLessonId} |`);
  }

  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Optional, env-gated print (no side effects unless A1_REPORT=1)
// ---------------------------------------------------------------------------

if (typeof process !== "undefined" && process.env && process.env.A1_REPORT === "1") {
  // eslint-disable-next-line no-console
  console.log(a1ReportMarkdown());
}
