import type { CourseLevelId, VariationAxis } from "./types";
import { COURSE_LEVEL_IDS } from "../levels/types";

/**
 * Machine-readable coverage reports and deterministic Markdown rendering for
 * the sentence-foundation catalogs (design spec §16.3; Phase 1 Task 4). This
 * module owns the *report* data contracts and their pure aggregation/render
 * helpers; the staged validation that produces the per-lesson rows lives in
 * `validateFoundations.ts` (which imports these types and calls
 * `aggregateFoundationReports`). Every field here is a *computed* actual —
 * never an authored aggregate — so a reviewer can inspect why a lesson passes
 * without reading the whole catalog.
 */

// ---------------------------------------------------------------------------
// Report contracts
// ---------------------------------------------------------------------------

/** Actual, computed coverage for one authored instructional lesson. */
export interface LessonCoverageReport {
  readonly lessonId: string;
  readonly level: CourseLevelId;
  readonly moduleId: string;
  /** Canonical lesson position (from `lessonPositions`), used for stable
   * ordering of report tables independent of input array order. */
  readonly position: number;
  readonly modelCount: number;
  readonly modelSemanticFingerprints: readonly string[];
  readonly familyIds: readonly string[];
  readonly variationAxes: readonly VariationAxis[];
  readonly productiveSenseIds: readonly string[];
  readonly receptiveSenseIds: readonly string[];
  readonly predicateSenseIds: readonly string[];
  readonly roleIds: readonly string[];
  readonly omittedSubjectCount: number;
  readonly contextIds: readonly string[];
  readonly exerciseCount: number;
  readonly visibleTargetCounts: Readonly<Record<string, number>>;
  readonly uniqueVisibleTargetCount: number;
  readonly maximumVisibleReuse: number;
  readonly transferTargetIds: readonly string[];
  readonly modelDuplicateTransferIds: readonly string[];
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly validationErrorCodes: readonly string[];
  /** True when no validation error is attributed to this lesson. */
  readonly complete: boolean;
}

/** Actual coverage for one module, aggregated purely from its lesson rows. */
export interface ModuleCoverageReport {
  readonly moduleId: string;
  readonly level: CourseLevelId;
  readonly order: number;
  readonly lessonIds: readonly string[];
  readonly lessonCount: number;
  readonly modelCount: number;
  readonly exerciseCount: number;
  readonly familyIds: readonly string[];
  readonly predicateSenseIds: readonly string[];
  readonly roleIds: readonly string[];
  readonly contextIds: readonly string[];
  readonly transferTargetIds: readonly string[];
  readonly canDoIds: readonly string[];
  readonly complete: boolean;
}

/** Per-verb recurrence status derived from the verb-use rows. */
export interface VerbRecurrenceStatus {
  readonly recordId: string;
  readonly senseId: string;
  readonly learningUse: string;
  readonly spacedReuse: boolean;
  readonly laterModule: boolean;
  readonly structureReuse: boolean;
  readonly complete: boolean;
}

/** Actual coverage for one level, aggregated purely from module/lesson rows. */
export interface LevelCoverageReport {
  readonly level: CourseLevelId;
  readonly moduleIds: readonly string[];
  readonly lessonIds: readonly string[];
  readonly canDoIds: readonly string[];
  readonly moduleCount: number;
  readonly lessonCount: number;
  readonly modelCount: number;
  readonly exerciseCount: number;
  readonly transferCount: number;
  readonly verbRecurrence: readonly VerbRecurrenceStatus[];
  readonly complete: boolean;
}

/** One row of the verb introduction/recurrence table. */
export interface VerbUseReportRow {
  readonly recordId: string;
  readonly senseId: string;
  readonly learningUse: string;
  readonly introductionLessonId: string;
  readonly introductionPosition: number;
  readonly introductionStructureKeys: readonly string[];
  readonly laterUseLessonIds: readonly string[];
  readonly laterUsePositions: readonly number[];
  readonly maxPositionGap: number;
  readonly hasLaterModule: boolean;
  readonly distinctStructureCount: number;
  readonly validationErrorCodes: readonly string[];
}

/** One row of the Can-do/checkpoint evidence table. */
export interface CheckpointReportRow {
  readonly checkpointId: string;
  readonly level: CourseLevelId;
  readonly sampledCanDoIds: readonly string[];
  readonly minAcceptedTransferTargetsPerCanDo: number;
  readonly canDoEvidenceMins: Readonly<Record<string, number>>;
  readonly validationErrorCodes: readonly string[];
}

export interface FoundationCoverageReports {
  readonly byLesson: Readonly<Record<string, LessonCoverageReport>>;
  readonly byModule: Readonly<Record<string, ModuleCoverageReport>>;
  readonly byLevel: Readonly<Record<string, LevelCoverageReport>>;
  readonly verbUse: readonly VerbUseReportRow[];
  readonly checkpoints: readonly CheckpointReportRow[];
}

// ---------------------------------------------------------------------------
// Deterministic ordering helpers
// ---------------------------------------------------------------------------

const AXIS_ORDER: readonly VariationAxis[] = [
  "speaker-person",
  "predicate-verb",
  "object",
  "location",
  "time",
  "polarity-tense-form",
  "context",
];

export function sortAxes(axes: Iterable<VariationAxis>): readonly VariationAxis[] {
  const set = new Set(axes);
  return AXIS_ORDER.filter((axis) => set.has(axis));
}

const LEVEL_RANK_BY_ID: ReadonlyMap<CourseLevelId, number> = new Map(
  COURSE_LEVEL_IDS.map((level, index) => [level, index]),
);

function levelRank(level: CourseLevelId): number {
  return LEVEL_RANK_BY_ID.get(level) ?? COURSE_LEVEL_IDS.length;
}

/** Stable string comparison (code-point order) used everywhere ids are sorted. */
export function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function sortedUnique(values: Iterable<string>): readonly string[] {
  return [...new Set(values)].sort(compareStrings);
}

// ---------------------------------------------------------------------------
// Aggregation inputs (owned by the validator, passed in already computed)
// ---------------------------------------------------------------------------

export interface ModuleMeta {
  readonly id: string;
  readonly level: CourseLevelId;
  readonly order: number;
  readonly canDoIds: readonly string[];
}

export interface LevelMeta {
  readonly level: CourseLevelId;
  readonly moduleIds: readonly string[];
  readonly canDoIds: readonly string[];
}

export interface AggregateReportsInput {
  readonly lessonRows: readonly LessonCoverageReport[];
  readonly modules: readonly ModuleMeta[];
  readonly levels: readonly LevelMeta[];
  readonly verbUse: readonly VerbUseReportRow[];
  readonly checkpoints: readonly CheckpointReportRow[];
}

// ---------------------------------------------------------------------------
// Pure aggregation
// ---------------------------------------------------------------------------

/** Ordered by canonical lesson position (level, module order, position). */
export function sortLessonRows(
  rows: readonly LessonCoverageReport[],
  moduleOrderById: ReadonlyMap<string, number>,
): readonly LessonCoverageReport[] {
  return [...rows].sort((left, right) => {
    const levelDelta = levelRank(left.level) - levelRank(right.level);
    if (levelDelta !== 0) return levelDelta;
    const orderDelta =
      (moduleOrderById.get(left.moduleId) ?? 0) - (moduleOrderById.get(right.moduleId) ?? 0);
    if (orderDelta !== 0) return orderDelta;
    if (left.position !== right.position) return left.position - right.position;
    return compareStrings(left.lessonId, right.lessonId);
  });
}

function verbStatus(row: VerbUseReportRow): VerbRecurrenceStatus {
  const receptive = row.learningUse === "receptive";
  const spacedReuse = row.maxPositionGap >= 2;
  const laterModule = row.hasLaterModule;
  const structureReuse = row.distinctStructureCount >= 2;
  const complete =
    row.validationErrorCodes.length === 0 &&
    (receptive || (spacedReuse && laterModule && structureReuse));
  return {
    recordId: row.recordId,
    senseId: row.senseId,
    learningUse: row.learningUse,
    spacedReuse,
    laterModule,
    structureReuse,
    complete,
  };
}

export function aggregateFoundationReports(
  input: AggregateReportsInput,
): FoundationCoverageReports {
  const moduleOrderById = new Map(input.modules.map((module) => [module.id, module.order]));

  const byLessonEntries = [...input.lessonRows]
    .sort((left, right) => compareStrings(left.lessonId, right.lessonId))
    .map((row) => [row.lessonId, row] as const);
  const byLesson: Record<string, LessonCoverageReport> = {};
  for (const [id, row] of byLessonEntries) byLesson[id] = row;

  const rowsByModule = new Map<string, LessonCoverageReport[]>();
  for (const row of input.lessonRows) {
    const list = rowsByModule.get(row.moduleId) ?? [];
    list.push(row);
    rowsByModule.set(row.moduleId, list);
  }

  const byModule: Record<string, ModuleCoverageReport> = {};
  for (const module of [...input.modules].sort((l, r) => compareStrings(l.id, r.id))) {
    const rows = sortLessonRows(rowsByModule.get(module.id) ?? [], moduleOrderById);
    const families = new Set<string>();
    const predicates = new Set<string>();
    const roles = new Set<string>();
    const contexts = new Set<string>();
    const transfers = new Set<string>();
    let modelCount = 0;
    let exerciseCount = 0;
    let complete = true;
    for (const row of rows) {
      modelCount += row.modelCount;
      exerciseCount += row.exerciseCount;
      for (const id of row.familyIds) families.add(id);
      for (const id of row.predicateSenseIds) predicates.add(id);
      for (const id of row.roleIds) roles.add(id);
      for (const id of row.contextIds) contexts.add(id);
      for (const id of row.transferTargetIds) transfers.add(id);
      if (!row.complete) complete = false;
    }
    byModule[module.id] = {
      moduleId: module.id,
      level: module.level,
      order: module.order,
      lessonIds: rows.map((row) => row.lessonId),
      lessonCount: rows.length,
      modelCount,
      exerciseCount,
      familyIds: sortedUnique(families),
      predicateSenseIds: sortedUnique(predicates),
      roleIds: sortedUnique(roles),
      contextIds: sortedUnique(contexts),
      transferTargetIds: sortedUnique(transfers),
      canDoIds: sortedUnique(module.canDoIds),
      complete,
    };
  }

  const verbByIntroLesson = new Map<string, VerbUseReportRow[]>();
  for (const row of input.verbUse) {
    const list = verbByIntroLesson.get(row.introductionLessonId) ?? [];
    list.push(row);
    verbByIntroLesson.set(row.introductionLessonId, list);
  }

  const byLevel: Record<string, LevelCoverageReport> = {};
  for (const level of [...input.levels].sort((l, r) => levelRank(l.level) - levelRank(r.level))) {
    const moduleReports = level.moduleIds
      .map((id) => byModule[id])
      .filter((report): report is ModuleCoverageReport => report !== undefined);
    const lessonIds: string[] = [];
    let modelCount = 0;
    let exerciseCount = 0;
    const transfers = new Set<string>();
    let complete = true;
    for (const report of moduleReports) {
      for (const id of report.lessonIds) lessonIds.push(id);
      modelCount += report.modelCount;
      exerciseCount += report.exerciseCount;
      for (const id of report.transferTargetIds) transfers.add(id);
      if (!report.complete) complete = false;
    }
    const verbRows: VerbUseReportRow[] = [];
    for (const id of lessonIds) {
      for (const row of verbByIntroLesson.get(id) ?? []) verbRows.push(row);
    }
    const verbRecurrence = verbRows
      .sort((l, r) => compareStrings(l.recordId, r.recordId))
      .map(verbStatus);
    if (verbRecurrence.some((status) => !status.complete)) complete = false;
    byLevel[level.level] = {
      level: level.level,
      moduleIds: [...level.moduleIds],
      lessonIds,
      canDoIds: sortedUnique(level.canDoIds),
      moduleCount: level.moduleIds.length,
      lessonCount: lessonIds.length,
      modelCount,
      exerciseCount,
      transferCount: transfers.size,
      verbRecurrence,
      complete,
    };
  }

  const verbUse = [...input.verbUse].sort((left, right) => {
    if (left.introductionPosition !== right.introductionPosition) {
      return left.introductionPosition - right.introductionPosition;
    }
    return compareStrings(left.recordId, right.recordId);
  });

  const checkpoints = [...input.checkpoints].sort((left, right) => {
    const levelDelta = levelRank(left.level) - levelRank(right.level);
    if (levelDelta !== 0) return levelDelta;
    return compareStrings(left.checkpointId, right.checkpointId);
  });

  return { byLesson, byModule, byLevel, verbUse, checkpoints };
}

// ---------------------------------------------------------------------------
// Deterministic Markdown rendering
// ---------------------------------------------------------------------------

function moduleOrderMap(reports: FoundationCoverageReports): ReadonlyMap<string, number> {
  const map = new Map<string, number>();
  for (const report of Object.values(reports.byModule)) map.set(report.moduleId, report.order);
  return map;
}

/**
 * Renders stable, canonically sorted review tables. The output is
 * byte-identical after any reordering of the input catalogs or copy keys,
 * because every row is derived from the already-aggregated reports and sorted
 * by canonical position/id — never by input array order.
 */
export function foundationReportMarkdown(reports: FoundationCoverageReports): string {
  const lines: string[] = [];
  const orderById = moduleOrderMap(reports);
  const lessonRows = sortLessonRows(Object.values(reports.byLesson), orderById);

  lines.push("## Lesson coverage");
  lines.push("");
  lines.push(
    "| Lesson | Models | Families | Predicates | Roles | Contexts | Exercises | Unique targets | Max reuse | Transfers | Can-do |",
  );
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const row of lessonRows) {
    lines.push(
      `| ${row.lessonId} | ${row.modelCount} | ${row.familyIds.length} | ${row.predicateSenseIds.length} | ${row.roleIds.length} | ${row.contextIds.length} | ${row.exerciseCount} | ${row.uniqueVisibleTargetCount} | ${row.maximumVisibleReuse} | ${row.transferTargetIds.length} | ${row.primaryCanDoId} |`,
    );
  }
  lines.push("");

  lines.push("## Verb recurrence");
  lines.push("");
  lines.push(
    "| Record | Sense | Use | Intro lesson | Intro pos | Structures | Later lessons | Max gap | Later module |",
  );
  lines.push("| --- | --- | --- | --- | ---: | ---: | --- | ---: | --- |");
  for (const row of reports.verbUse) {
    lines.push(
      `| ${row.recordId} | ${row.senseId} | ${row.learningUse} | ${row.introductionLessonId} | ${row.introductionPosition} | ${row.distinctStructureCount} | ${row.laterUseLessonIds.join(", ")} | ${row.maxPositionGap} | ${row.hasLaterModule ? "yes" : "no"} |`,
    );
  }
  lines.push("");

  lines.push("## Can-do checkpoints");
  lines.push("");
  lines.push("| Checkpoint | Level | Sampled Can-dos | Min transfer targets |");
  lines.push("| --- | --- | --- | ---: |");
  for (const row of reports.checkpoints) {
    lines.push(
      `| ${row.checkpointId} | ${row.level} | ${[...row.sampledCanDoIds].sort(compareStrings).join(", ")} | ${row.minAcceptedTransferTargetsPerCanDo} |`,
    );
  }

  return lines.join("\n") + "\n";
}
