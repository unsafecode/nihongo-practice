import { deepFreeze } from "../foundations/deepFreeze";
import { immutableReadonlyMap } from "../foundations/immutableReadonlyMap";
import type { LessonId, ModuleId } from "../foundations/types";
import { BASE_LESSON_IDS, BASE_LESSON_IDS_BY_MODULE, BASE_MODULE_IDS } from "../base/manifest";
import {
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_LESSON_IDS_BY_MODULE,
  A1_RETAINED_MODULE_IDS,
} from "../a1/manifest";
import { A2_LESSON_IDS, A2_LESSON_IDS_BY_MODULE, A2_MODULE_IDS } from "../a2/manifest";
import { LEGACY_LESSON_ALIASES } from "../routing/lessonRouteResolution";
import type { CourseLevelId } from "./types";

export interface LessonOwner {
  readonly levelId: CourseLevelId;
  readonly moduleId: ModuleId;
}

export interface CurrentLessonRouteEntry extends LessonOwner {
  readonly routeKey: string;
  readonly lessonId: LessonId;
}

export interface PublishedRouteAliasEntry extends LessonOwner {
  readonly routeKey: string;
  readonly aliasModuleId: ModuleId;
  readonly aliasLessonId: LessonId;
  readonly moduleId: ModuleId;
  readonly lessonId: LessonId;
  readonly owner: LessonOwner;
  readonly consolidated: boolean;
}

interface LevelPartition {
  readonly levelId: CourseLevelId;
  readonly moduleIds: readonly ModuleId[];
  readonly lessonIdsByModule: Readonly<Partial<Record<ModuleId, readonly LessonId[]>>>;
  readonly lessonIds: readonly LessonId[];
}

const LEVEL_PARTITIONS: readonly LevelPartition[] = [
  {
    levelId: "a0",
    moduleIds: BASE_MODULE_IDS,
    lessonIdsByModule: BASE_LESSON_IDS_BY_MODULE,
    lessonIds: BASE_LESSON_IDS,
  },
  {
    levelId: "a1",
    moduleIds: A1_RETAINED_MODULE_IDS,
    lessonIdsByModule: A1_RETAINED_LESSON_IDS_BY_MODULE,
    lessonIds: A1_RETAINED_LESSON_IDS,
  },
  {
    levelId: "a2",
    moduleIds: A2_MODULE_IDS,
    lessonIdsByModule: A2_LESSON_IDS_BY_MODULE,
    lessonIds: A2_LESSON_IDS,
  },
];

function routeKey(moduleId: ModuleId, lessonId: LessonId): string {
  return `${moduleId}/${lessonId}`;
}

function assertUnique<T>(values: readonly T[], label: string): void {
  const seen = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`course ownership: duplicate ${label} "${String(value)}"`);
    }
    seen.add(value);
  }
}

function buildCurrentRegistry(): readonly CurrentLessonRouteEntry[] {
  const entries: CurrentLessonRouteEntry[] = [];

  for (const partition of LEVEL_PARTITIONS) {
    for (const moduleId of partition.moduleIds) {
      const lessonIds = partition.lessonIdsByModule[moduleId];
      if (!lessonIds) {
        throw new Error(`course ownership: no lessons for module "${moduleId}"`);
      }
      for (const lessonId of lessonIds) {
        entries.push({
          routeKey: routeKey(moduleId, lessonId),
          levelId: partition.levelId,
          moduleId,
          lessonId,
        });
      }
    }
  }

  assertUnique(
    LEVEL_PARTITIONS.flatMap((partition) => [...partition.moduleIds]),
    "module id",
  );
  assertUnique(entries.map((entry) => entry.lessonId), "lesson id");
  assertUnique(entries.map((entry) => entry.routeKey), "route key");

  const expectedOrder = LEVEL_PARTITIONS.flatMap((partition) => [...partition.lessonIds]);
  const actualOrder = entries.map((entry) => entry.lessonId);
  if (actualOrder.length !== expectedOrder.length || actualOrder.some((id, index) => id !== expectedOrder[index])) {
    throw new Error("course ownership: current registry order does not match level partitions");
  }

  return deepFreeze(entries);
}

const currentLessonRouteEntries: readonly CurrentLessonRouteEntry[] = buildCurrentRegistry();

export const currentLessonRouteRegistry: ReadonlyMap<LessonId, CurrentLessonRouteEntry> =
  immutableReadonlyMap(currentLessonRouteEntries.map((entry) => [entry.lessonId, entry]));

const ownerByLessonId: ReadonlyMap<LessonId, LessonOwner> = new Map(
  currentLessonRouteEntries.map((entry) => [
    entry.lessonId,
    deepFreeze({ levelId: entry.levelId, moduleId: entry.moduleId }),
  ]),
);

const ownerByModuleId: ReadonlyMap<ModuleId, CourseLevelId> = new Map(
  currentLessonRouteEntries.map((entry) => [entry.moduleId, entry.levelId]),
);

function buildAliasRegistry(): readonly PublishedRouteAliasEntry[] {
  const currentRouteKeys = new Set(currentLessonRouteEntries.map((entry) => entry.routeKey));
  const currentLessonIds = new Set(currentLessonRouteEntries.map((entry) => entry.lessonId));
  const aliasLessonIds = new Set<LessonId>();
  const aliasRouteKeys = new Set<string>();
  const entries: PublishedRouteAliasEntry[] = [];

  for (const alias of LEGACY_LESSON_ALIASES) {
    const owner = ownerByLessonId.get(alias.lessonId);
    if (!owner) {
      throw new Error(
        `course ownership: alias "${alias.legacyLessonId}" targets unresolved lesson "${alias.lessonId}"`,
      );
    }
    if (owner.moduleId !== alias.moduleId) {
      throw new Error(
        `course ownership: alias "${alias.legacyLessonId}" target module "${alias.moduleId}" does not match owner "${owner.moduleId}"`,
      );
    }
    if (currentLessonIds.has(alias.legacyLessonId)) {
      throw new Error(`course ownership: alias id "${alias.legacyLessonId}" is a current lesson id`);
    }
    const key = routeKey(alias.legacyModuleId, alias.legacyLessonId);
    if (currentRouteKeys.has(key)) {
      throw new Error(`course ownership: alias route key "${key}" duplicates a current route`);
    }
    if (aliasLessonIds.has(alias.legacyLessonId)) {
      throw new Error(`course ownership: duplicate alias id "${alias.legacyLessonId}"`);
    }
    if (aliasRouteKeys.has(key)) {
      throw new Error(`course ownership: duplicate alias route key "${key}"`);
    }
    aliasLessonIds.add(alias.legacyLessonId);
    aliasRouteKeys.add(key);
    entries.push({
      routeKey: key,
      aliasModuleId: alias.legacyModuleId,
      aliasLessonId: alias.legacyLessonId,
      moduleId: alias.moduleId,
      lessonId: alias.lessonId,
      levelId: owner.levelId,
      owner,
      consolidated: alias.consolidated ?? false,
    });
  }

  return deepFreeze(entries);
}

const publishedRouteAliasEntries: readonly PublishedRouteAliasEntry[] = buildAliasRegistry();

export const publishedRouteAliasRegistry: ReadonlyMap<LessonId, PublishedRouteAliasEntry> =
  immutableReadonlyMap(publishedRouteAliasEntries.map((entry) => [entry.aliasLessonId, entry]));

export function lessonOwner(id: LessonId): LessonOwner | null {
  return ownerByLessonId.get(id) ?? null;
}

export function moduleOwner(id: ModuleId): CourseLevelId | null {
  return ownerByModuleId.get(id) ?? null;
}

export function lessonIdsForLevel(level: CourseLevelId): readonly LessonId[] {
  return LEVEL_PARTITIONS.find((partition) => partition.levelId === level)?.lessonIds ?? [];
}
