import { deepFreeze } from "../foundations/deepFreeze";
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

export const BASE_CANONICAL_POSITIONS: Readonly<Record<LessonId, number>> =
  deepFreeze(
    Object.fromEntries(BASE_LESSON_IDS.map((id, index) => [id, index + 1])),
  );

function moduleOutcomeCopyId(moduleId: ModuleId): string {
  return `base-module-outcome-${moduleId}`;
}

export const BASE_LESSON_MANIFEST: Readonly<
  Record<LessonId, BaseLessonManifestEntry>
> = deepFreeze(
  Object.fromEntries(
    BASE_MODULE_IDS.flatMap((moduleId) =>
      BASE_LESSON_IDS_BY_MODULE[moduleId].map((lessonId, index) => {
        const entry: BaseLessonManifestEntry = {
          lessonId,
          moduleId,
          order: (index + 1) as 1 | 2 | 3 | 4,
          contract: BASE_MANIFEST_SPEC.lessonContracts[lessonId],
          position: BASE_CANONICAL_POSITIONS[lessonId],
        };
        return [lessonId, entry];
      }),
    ),
  ),
);

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

  const lessonIds: LessonId[] = [];
  for (const moduleId of spec.moduleIds) {
    const moduleLessons = spec.lessonIdsByModule[moduleId] ?? [];
    if (moduleLessons.length !== 4) {
      push(
        "lessons-per-module",
        `Module "${moduleId}" must have exactly 4 lessons, has ${moduleLessons.length}.`,
      );
    }
    lessonIds.push(...moduleLessons);
    for (const lessonId of moduleLessons) {
      const actualContract = spec.lessonContracts[lessonId];
      if (!actualContract) {
        push("missing-lesson-contract", `Lesson "${lessonId}" has no contract.`);
      } else {
        const expectedContract = contractForLesson(lessonId);
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
    if (!Object.prototype.hasOwnProperty.call(spec.modulePrerequisites, moduleId)) {
      push("missing-prerequisite-record", `Module "${moduleId}" has no modulePrerequisites record.`);
      return;
    }
    const actual = spec.modulePrerequisites[moduleId];
    if (actual.length !== expected.length || actual.some((id, i) => id !== expected[i])) {
      push("prerequisite-chain", `Module "${moduleId}" does not follow the linear prerequisite chain.`);
    }
  });

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function validateBaseManifest(): BaseManifestValidationResult {
  return validateBaseManifestSpec(BASE_MANIFEST_SPEC);
}
