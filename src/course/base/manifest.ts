import { deepFreeze } from "../foundations/deepFreeze";
import { immutableReadonlyMap } from "../foundations/immutableReadonlyMap";
import type { LessonId, ModuleId } from "../foundations/types";
import type {
  BaseLessonContract,
  BaseLessonManifestEntry,
  BaseManifestSpec,
  BaseManifestValidationError,
  BaseManifestValidationResult,
  BaseModuleManifestEntry,
} from "./types";

export type { BaseManifestSpec } from "./types";

const MODULE_ORDER: readonly ModuleId[] = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "argument-particles",
  "time-movement",
  "copula-adjectives",
  "existence-location",
  "requests-connection",
  "base-synthesis",
];

const CONTENT_LESSON_IDS: ReadonlySet<LessonId> = new Set([
  "topic-questions-4",
  "polite-verbs-4",
  "time-movement-4",
  "existence-location-4",
  "requests-connection-2",
]);

function fourLessons(moduleId: ModuleId): LessonId[] {
  return [1, 2, 3, 4].map((n) => `${moduleId}-${n}`);
}

function contractForLesson(lessonId: LessonId): BaseLessonContract {
  if (lessonId.startsWith("sounds-")) return "phonetic";
  if (lessonId.startsWith("base-synthesis-")) return "synthesis";
  if (CONTENT_LESSON_IDS.has(lessonId)) return "content";
  return "system";
}

function buildBaseManifestSpec(): BaseManifestSpec {
  const lessonIdsByModule: Record<ModuleId, LessonId[]> = {};
  const modulePrerequisites: Record<ModuleId, ModuleId[]> = {};
  const lessonContracts: Record<LessonId, BaseLessonContract> = {};

  MODULE_ORDER.forEach((moduleId, index) => {
    const lessonIds = fourLessons(moduleId);
    lessonIdsByModule[moduleId] = lessonIds;
    modulePrerequisites[moduleId] = index === 0 ? [] : [MODULE_ORDER[index - 1]];
    for (const lessonId of lessonIds) {
      lessonContracts[lessonId] = contractForLesson(lessonId);
    }
  });

  return {
    moduleIds: [...MODULE_ORDER],
    lessonIdsByModule,
    modulePrerequisites,
    lessonContracts,
  };
}

export const BASE_MANIFEST_SPEC: BaseManifestSpec = deepFreeze(
  buildBaseManifestSpec(),
);

export const BASE_MODULE_IDS: readonly ModuleId[] = deepFreeze([
  ...BASE_MANIFEST_SPEC.moduleIds,
]);

export const BASE_LESSON_IDS_BY_MODULE: Readonly<
  Record<ModuleId, readonly LessonId[]>
> = deepFreeze(
  Object.fromEntries(
    BASE_MODULE_IDS.map((moduleId) => [
      moduleId,
      [...BASE_MANIFEST_SPEC.lessonIdsByModule[moduleId]],
    ]),
  ),
);

export const BASE_LESSON_IDS: readonly LessonId[] = deepFreeze(
  BASE_MODULE_IDS.flatMap((moduleId) => [...BASE_LESSON_IDS_BY_MODULE[moduleId]]),
);

/**
 * The Base lesson graph has a mandatory linear spine. Additional earlier
 * prerequisites may be declared, but no lesson may skip its immediate
 * canonical predecessor.
 */
export const BASE_REQUIRED_PREREQUISITE_BY_LESSON: ReadonlyMap<
  LessonId,
  LessonId | null
> = immutableReadonlyMap(
  BASE_LESSON_IDS.map((lessonId, index) => [
    lessonId,
    index === 0 ? null : BASE_LESSON_IDS[index - 1],
  ]),
);

export function requiredBaseLessonPrerequisiteFor(
  lessonId: string,
): LessonId | null | undefined {
  return BASE_REQUIRED_PREREQUISITE_BY_LESSON.get(lessonId as LessonId);
}

const BASE_CANONICAL_POSITION_ENTRIES: readonly (readonly [LessonId, number])[] =
  BASE_LESSON_IDS.map((id, index) => [id, index + 1]);

export const BASE_CANONICAL_POSITIONS: Readonly<Record<LessonId, number>> =
  deepFreeze(
    Object.fromEntries(BASE_CANONICAL_POSITION_ENTRIES) as Record<LessonId, number>,
  );

const BASE_CANONICAL_POSITION_BY_ID: ReadonlyMap<LessonId, number> =
  immutableReadonlyMap(BASE_CANONICAL_POSITION_ENTRIES);

export function baseCanonicalPosition(id: unknown): number | null {
  return typeof id === "string"
    ? BASE_CANONICAL_POSITION_BY_ID.get(id as LessonId) ?? null
    : null;
}

function moduleOutcomeCopyId(moduleId: ModuleId): string {
  return `base-module-outcome-${moduleId}`;
}

const BASE_LESSON_MANIFEST_ENTRIES: readonly (
  readonly [LessonId, BaseLessonManifestEntry]
)[] = BASE_MODULE_IDS.flatMap((moduleId) =>
  BASE_LESSON_IDS_BY_MODULE[moduleId].map((lessonId, index) => {
    const position = baseCanonicalPosition(lessonId);
    if (position === null) {
      throw new Error(`Missing canonical Base position for "${lessonId}".`);
    }
    const entry: BaseLessonManifestEntry = {
      lessonId,
      moduleId,
      order: (index + 1) as 1 | 2 | 3 | 4,
      contract: BASE_MANIFEST_SPEC.lessonContracts[lessonId],
      position,
    };
    return [lessonId, entry];
  }),
);

export const BASE_LESSON_MANIFEST: Readonly<
  Record<LessonId, BaseLessonManifestEntry>
> = deepFreeze(
  Object.fromEntries(BASE_LESSON_MANIFEST_ENTRIES) as Record<
    LessonId,
    BaseLessonManifestEntry
  >,
);

const BASE_LESSON_MANIFEST_BY_ID: ReadonlyMap<LessonId, BaseLessonManifestEntry> =
  immutableReadonlyMap(BASE_LESSON_MANIFEST_ENTRIES);

export function baseLessonManifestEntry(
  id: unknown,
): BaseLessonManifestEntry | null {
  return typeof id === "string"
    ? BASE_LESSON_MANIFEST_BY_ID.get(id as LessonId) ?? null
    : null;
}

export const BASE_MODULE_MANIFEST: Readonly<
  Record<ModuleId, BaseModuleManifestEntry>
> = deepFreeze(
  Object.fromEntries(
    BASE_MODULE_IDS.map((moduleId, index) => {
      const entry: BaseModuleManifestEntry = {
        id: moduleId,
        order: index + 1,
        prerequisiteIds: [...BASE_MANIFEST_SPEC.modulePrerequisites[moduleId]],
        lessonIds: [...BASE_LESSON_IDS_BY_MODULE[moduleId]],
        outcomeCopyId: moduleOutcomeCopyId(moduleId),
      };
      return [moduleId, entry];
    }),
  ),
);

function findDuplicates<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    else seen.add(value);
  }
  return [...duplicates];
}

function ownDataValue(value: unknown, key: string): unknown {
  if (value === null || typeof value !== "object") return undefined;
  if (!Object.prototype.hasOwnProperty.call(value, key)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

export function validateBaseManifestSpec(
  spec: BaseManifestSpec,
): BaseManifestValidationResult {
  const errors: BaseManifestValidationError[] = [];
  const push = (code: BaseManifestValidationError["code"], message: string) =>
    errors.push({ code, message });

  if (spec.moduleIds.length !== 10) {
    push("module-count", `Base manifest must declare 10 modules, has ${spec.moduleIds.length}.`);
  }
  for (const duplicate of findDuplicates(spec.moduleIds)) {
    push("duplicate-module-id", `Module id "${duplicate}" appears more than once.`);
  }

  const lessonIds: string[] = [];
  for (const moduleId of spec.moduleIds) {
    const moduleLessonsValue = ownDataValue(spec.lessonIdsByModule, moduleId);
    const moduleLessons = Array.isArray(moduleLessonsValue)
      ? moduleLessonsValue
      : [];
    if (moduleLessons.length !== 4) {
      push(
        "lessons-per-module",
        `Module "${moduleId}" must have exactly 4 lessons, has ${moduleLessons.length}.`,
      );
    }
    for (const lessonId of moduleLessons) {
      if (typeof lessonId !== "string") {
        push("missing-lesson-contract", `Lesson "${String(lessonId)}" has no contract.`);
        continue;
      }
      lessonIds.push(lessonId);
      const actualContract = ownDataValue(spec.lessonContracts, lessonId);
      if (typeof actualContract !== "string") {
        push("missing-lesson-contract", `Lesson "${lessonId}" has no contract.`);
      } else {
        const expectedContract = contractForLesson(lessonId as LessonId);
        if (actualContract !== expectedContract) {
          push(
            "lesson-contract-classification",
            `Lesson "${lessonId}" contract "${actualContract}" must match fixed Base classification "${expectedContract}".`,
          );
        }
      }
    }
  }
  for (const duplicate of findDuplicates(lessonIds)) {
    push("duplicate-lesson-id", `Lesson id "${duplicate}" appears more than once.`);
  }

  spec.moduleIds.forEach((moduleId, index) => {
    const expected = index === 0 ? [] : [spec.moduleIds[index - 1]];
    const actual = ownDataValue(spec.modulePrerequisites, moduleId);
    if (!Array.isArray(actual)) {
      push("missing-prerequisite-record", `Module "${moduleId}" has no modulePrerequisites record.`);
      return;
    }
    if (actual.length !== expected.length || actual.some((id, i) => id !== expected[i])) {
      push("prerequisite-chain", `Module "${moduleId}" does not follow the linear prerequisite chain.`);
    }
  });

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function validateBaseManifest(): BaseManifestValidationResult {
  return validateBaseManifestSpec(BASE_MANIFEST_SPEC);
}
