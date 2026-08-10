import { deepFreeze } from "../../foundations/deepFreeze";
import { baseCanonicalPosition } from "../manifest";
import {
  BASE_REFERENCE_CATALOG,
  BASE_REFERENCE_EXAMPLES,
  baseReferenceCopyById,
  validateBaseReferenceCatalog,
  type BaseReferenceCanonicalCell,
  type BaseReferenceCatalog,
  type BaseReferenceDefinition,
  type BaseReferenceId,
  type BaseReferenceExample,
  type BaseReferenceLocale,
  type ReferenceGridModel,
} from "./catalog";

export type {
  BaseReferenceCatalog,
  BaseReferenceDefinition,
  BaseReferenceId,
  BaseReferenceLocale,
  ReferenceGridModel,
} from "./catalog";

export interface BaseReferenceEntryViewModel {
  readonly semanticId: string;
  readonly firstTeachLessonId: string;
  readonly sourceContentIds: readonly string[];
  readonly prerequisiteEntryIds: readonly string[];
  readonly copyId: string;
  readonly label: string;
  readonly explanation: string;
  readonly contrastIds: readonly string[];
  readonly exampleIds: readonly string[];
  readonly canonicalFormCells: readonly {
    readonly id: string;
    readonly columnId: string;
    readonly label: string;
    readonly value: BaseReferenceCanonicalCell["tokens"];
    readonly sourceContentIds: readonly string[];
    readonly desuFunction?: BaseReferenceCanonicalCell["desuFunction"];
  }[];
}

export interface BaseReferenceViewModel {
  readonly id: BaseReferenceId;
  readonly copyId: string;
  readonly label: string;
  readonly explanation: string;
  readonly firstTeachLessonId: string;
  readonly throughLessonId: string;
  readonly entries: readonly BaseReferenceEntryViewModel[];
  readonly grid: ReferenceGridModel;
  readonly stackedRows: ReferenceGridModel["rows"];
}

export type BaseReferenceViewModelResult =
  | Readonly<{ readonly ok: true; readonly model: BaseReferenceViewModel }>
  | Readonly<{
      readonly ok: false;
      readonly error: Readonly<{
        readonly code:
          | "unknown-reference"
          | "unknown-through-lesson"
          | "future-prerequisite";
        readonly referenceId: string;
      }>;
    }>;

function safeReferenceId(value: unknown): string {
  return typeof value === "string" ? value : "unknown-reference";
}

function failure(
  code:
    | "unknown-reference"
    | "unknown-through-lesson"
    | "future-prerequisite",
  referenceId: unknown,
): BaseReferenceViewModelResult {
  return deepFreeze({
    ok: false,
    error: { code, referenceId: safeReferenceId(referenceId) },
  });
}

function isLocale(value: unknown): value is BaseReferenceLocale {
  return value === "en" || value === "it";
}

/**
 * Builds the table and stacked-card data from one localized row collection.
 * The optional catalog is a validation seam for release checks; production
 * callers use the deeply frozen canonical catalog.
 */
export function buildBaseReferenceViewModel(
  referenceId: string,
  throughLessonId: string,
  locale: BaseReferenceLocale,
  catalog: BaseReferenceCatalog = BASE_REFERENCE_CATALOG,
  eligibleExamples: readonly BaseReferenceExample[] = BASE_REFERENCE_EXAMPLES,
): BaseReferenceViewModelResult {
  if (typeof referenceId !== "string") {
    return failure("unknown-reference", referenceId);
  }

  const throughPosition = baseCanonicalPosition(throughLessonId);
  if (throughPosition === null) {
    return failure("unknown-through-lesson", referenceId);
  }
  if (!isLocale(locale)) {
    // The task's fixed error union has no locale code. "unknown-reference" is
    // the closest fail-closed result because the requested localized surface
    // does not exist; never manufacture a fallback locale/model.
    return failure("unknown-reference", referenceId);
  }

  const validationErrors = validateBaseReferenceCatalog(catalog, eligibleExamples);
  if (validationErrors.some(({ code }) => code === "future-prerequisite")) {
    return failure("future-prerequisite", referenceId);
  }
  if (validationErrors.length > 0) {
    return failure("unknown-reference", referenceId);
  }

  const definition = catalog.find(
    (candidate) => candidate.id === referenceId,
  ) as BaseReferenceDefinition | undefined;
  if (!definition) {
    return failure("unknown-reference", referenceId);
  }
  const referencePosition = baseCanonicalPosition(definition.firstTeachLessonId);
  if (referencePosition === null || referencePosition > throughPosition) {
    return failure("unknown-reference", referenceId);
  }

  const entryById = new Map(
    definition.entries.map((entry) => [entry.semanticId, entry]),
  );
  const visibleEntries = definition.entries.filter((entry) => {
    const position = baseCanonicalPosition(entry.firstTeachLessonId);
    return position !== null && position <= throughPosition;
  });
  const visibleIds = new Set(visibleEntries.map(({ semanticId }) => semanticId));
  const allEntriesById = new Map(
    catalog.flatMap(({ entries }) =>
      entries.map((entry) => [entry.semanticId, entry] as const),
    ),
  );

  for (const visibleEntry of visibleEntries) {
    for (const prerequisiteId of visibleEntry.prerequisiteEntryIds) {
      const prerequisite = entryById.get(prerequisiteId);
      const prerequisitePosition = prerequisite
        ? baseCanonicalPosition(prerequisite.firstTeachLessonId)
        : null;
      if (
        !prerequisite ||
        prerequisitePosition === null ||
        prerequisitePosition > throughPosition ||
        !visibleIds.has(prerequisiteId)
      ) {
        return failure("future-prerequisite", referenceId);
      }
    }
  }

  const entries: BaseReferenceEntryViewModel[] = visibleEntries.map((entry) => ({
    semanticId: entry.semanticId,
    firstTeachLessonId: entry.firstTeachLessonId,
    sourceContentIds: entry.sourceContentIds,
    prerequisiteEntryIds: entry.prerequisiteEntryIds,
    copyId: entry.copyId,
    label: baseReferenceCopyById(entry.copyId)![locale].label,
    explanation: baseReferenceCopyById(entry.copyId)![locale].explanation,
    contrastIds: entry.contrastIds.filter((contrastId) => {
      const contrast = allEntriesById.get(contrastId);
      const contrastPosition = contrast
        ? baseCanonicalPosition(contrast.firstTeachLessonId)
        : null;
      return contrastPosition !== null && contrastPosition <= throughPosition;
    }),
    exampleIds: entry.exampleIds,
    canonicalFormCells: entry.canonicalFormCells.map((canonicalCell) => ({
      id: canonicalCell.id,
      columnId: canonicalCell.columnId,
      label: canonicalCell.copy[locale].label,
      value: canonicalCell.tokens,
      sourceContentIds: canonicalCell.sourceContentIds,
      ...(canonicalCell.desuFunction === undefined
        ? {}
        : { desuFunction: canonicalCell.desuFunction }),
    })),
  }));

  const rows: ReferenceGridModel["rows"] = entries.map((entry) => ({
    id: entry.semanticId,
    header: entry.label,
    cells: entry.canonicalFormCells.map(({
      columnId,
      label,
      value,
      sourceContentIds,
      desuFunction,
    }) => ({
      columnId,
      label,
      value,
      sourceContentIds,
      ...(desuFunction === undefined ? {} : { desuFunction }),
    })),
  }));
  const grid: ReferenceGridModel = {
    caption: baseReferenceCopyById(definition.copyId)![locale].label,
    columns: definition.columns.map((referenceColumn) => ({
      id: referenceColumn.id,
      label: referenceColumn.copy[locale].label,
    })),
    rows,
  };

  return deepFreeze({
    ok: true,
    model: {
      id: definition.id,
      copyId: definition.copyId,
      label: baseReferenceCopyById(definition.copyId)![locale].label,
      explanation: baseReferenceCopyById(definition.copyId)![locale].explanation,
      firstTeachLessonId: definition.firstTeachLessonId,
      throughLessonId,
      entries,
      grid,
      stackedRows: rows,
    },
  });
}
