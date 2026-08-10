import type { SemanticIconId } from "../../components/icons/Icon";
import { A1_AREAS } from "../a1/areas";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import {
  A1_MODULE_IDS,
  A1_MODULE_MANIFEST,
  A1_RETAINED_LESSON_IDS_BY_MODULE,
  A1_RETAINED_MODULE_IDS,
} from "../a1/manifest";
import { a2CanDosAuthored, a2SemanticBuiltLessons } from "../a2/catalog/catalog";
import { A2_MODULE_IDS, A2_MODULE_MANIFEST } from "../a2/manifest";
import { baseCanDos } from "../base/catalog/canDos";
import { BASE_MODULE_IDS, BASE_MODULE_MANIFEST } from "../base/manifest";
import type { A1CourseArea } from "../a1/types";
import type { CourseLevelId } from "../levels/types";
import {
  assertA1CourseShape,
  assertA2CourseShape,
  assertBaseCourseShape,
} from "./runtimeShapeAssertion";
import type { CourseModule, Lesson } from "./types";

const BASE_MODULE_ICON_IDS: Readonly<Record<string, SemanticIconId>> = {
  sounds: "sounds",
  "sentence-foundations": "sentence",
  "topic-questions": "questions",
  "polite-verbs": "ordering",
  "argument-particles": "sentence",
  "time-movement": "time",
  "copula-adjectives": "descriptions",
  "existence-location": "existence",
  "requests-connection": "questions",
  "base-synthesis": "capstone",
};

const A1_MODULE_ICON_IDS: Readonly<Record<string, SemanticIconId>> = {
  sounds: "sounds",
  "sentence-foundations": "sentence",
  "topic-questions": "questions",
  "polite-verbs": "ordering",
  "time-movement": "time",
  introductions: "identity",
  "essential-questions": "questions",
  actions: "ordering",
  routines: "time",
  "past-negative": "sentence",
  places: "places",
  people: "people",
  descriptions: "descriptions",
  shopping: "shopping",
  "existence-needs": "existence",
  capstones: "capstone",
};

const A2_MODULE_ICON_IDS: Readonly<Record<string, SemanticIconId>> = {
  "connected-conversation": "people",
  "plans-invitations": "time",
  "experiences-narratives": "sentence",
  "reasons-opinions": "questions",
  "sequencing-ongoing": "ordering",
  "permission-requests": "identity",
  "neighborhood-services": "places",
  "restaurant-problems": "existence",
  "shopping-returns": "shopping",
  "health-advice": "descriptions",
  "work-study-messages": "sentence",
  "travel-reservations": "places",
  "relationships-events": "people",
  "practical-texts": "questions",
  "a2-synthesis": "capstone",
};

function primaryDescriptorByLesson(
  level: string,
  canDos: readonly { readonly descriptorCopyId: string; readonly lessonIds: readonly string[] }[],
  requireUnique = false,
): ReadonlyMap<string, string> {
  const descriptors = new Map<string, string>();
  for (const canDo of canDos) {
    for (const lessonId of canDo.lessonIds) {
      if (requireUnique && descriptors.has(lessonId)) {
        throw new Error(
          `data/course: ${level} lesson "${lessonId}" has duplicate primary Can-do descriptors.`,
        );
      }
      descriptors.set(lessonId, canDo.descriptorCopyId);
    }
  }
  return descriptors;
}

function lessonFromDescriptor(
  level: string,
  descriptors: ReadonlyMap<string, string>,
  lessonId: string,
  moduleId: string,
  order: number,
): Lesson {
  const objectiveCopyId = descriptors.get(lessonId);
  if (!objectiveCopyId) {
    throw new Error(
      `data/course: ${level} lesson "${lessonId}" has no authored Can-do descriptor.`,
    );
  }
  return {
    id: lessonId,
    moduleId,
    order,
    titleCopyId: lessonId,
    objectiveCopyIds: [objectiveCopyId],
  };
}

const baseDescriptorsByLesson = primaryDescriptorByLesson("a0", baseCanDos, true);

function buildBaseModule(moduleId: string): CourseModule {
  const manifest = BASE_MODULE_MANIFEST[moduleId];
  const iconId = BASE_MODULE_ICON_IDS[moduleId];
  if (!manifest || !iconId) {
    throw new Error(`data/course: missing Base runtime metadata for module "${moduleId}".`);
  }
  return {
    id: moduleId,
    order: manifest.order,
    prerequisiteIds: [...manifest.prerequisiteIds],
    outcomeCopyIds: [manifest.outcomeCopyId],
    iconId,
    lessons: manifest.lessonIds.map((lessonId, index) =>
      lessonFromDescriptor("a0", baseDescriptorsByLesson, lessonId, moduleId, index + 1),
    ),
  };
}

export const baseCourseModules: readonly CourseModule[] = BASE_MODULE_IDS.map(buildBaseModule);
assertBaseCourseShape(baseCourseModules);

const a1AreaByModule = new Map(
  A1_AREAS.flatMap((area) => area.moduleIds.map((moduleId) => [moduleId, area.id])),
);

/** The authored area presentation after Base-owned modules have moved out. */
export const a1RetainedAreas: readonly A1CourseArea[] = A1_AREAS.flatMap((area) => {
  const moduleIds = area.moduleIds.filter((moduleId) => A1_RETAINED_MODULE_IDS.includes(moduleId));
  return moduleIds.length === 0 ? [] : [{ ...area, moduleIds }];
});

const a1DescriptorsByLesson = primaryDescriptorByLesson("a1", a1CanDosAuthored);

function buildA1Module(
  moduleId: string,
  order: number,
  retained: boolean,
): CourseModule {
  const manifest = A1_MODULE_MANIFEST[moduleId];
  const iconId = A1_MODULE_ICON_IDS[moduleId];
  const areaId = a1AreaByModule.get(moduleId);
  const lessonIds = retained
    ? A1_RETAINED_LESSON_IDS_BY_MODULE[moduleId]
    : manifest?.lessonIds;
  if (!manifest || !iconId || !areaId || !lessonIds) {
    throw new Error(`data/course: missing A1 runtime metadata for module "${moduleId}".`);
  }
  const retainedIds = new Set(A1_RETAINED_MODULE_IDS);
  return {
    id: moduleId,
    areaId,
    order,
    prerequisiteIds: manifest.prerequisiteIds.filter(
      (prerequisiteId) => !retained || retainedIds.has(prerequisiteId),
    ),
    outcomeCopyIds: [manifest.outcomeCopyId],
    iconId,
    lessons: lessonIds.map((lessonId, index) =>
      lessonFromDescriptor("a1", a1DescriptorsByLesson, lessonId, moduleId, index + 1),
    ),
  };
}

/**
 * The explicitly legacy, full A1 metadata assembly remains only for the heavy
 * source validator until source catalogs are physically rehomed in Task 16.
 * It is never an active level runtime.
 */
export const legacyA1CourseModules: CourseModule[] = A1_MODULE_IDS.map((moduleId, index) =>
  buildA1Module(moduleId, index + 1, false),
);

const retainedA1CourseModules: readonly CourseModule[] = A1_RETAINED_MODULE_IDS.map(
  (moduleId, index) => buildA1Module(moduleId, index + 1, true),
);
assertA1CourseShape(retainedA1CourseModules);

/** @deprecated Use `courseModulesByLevel.a1`; it is the retained A1 runtime. */
export const courseModules: readonly CourseModule[] = retainedA1CourseModules;

const a2DescriptorByCanDo = new Map(
  a2CanDosAuthored.map((canDo) => [canDo.id, canDo.descriptorCopyId]),
);
const a2PrimaryCanDoByLesson = new Map(
  a2SemanticBuiltLessons.map((built) => [built.recipe.id, built.recipe.primaryCanDoId]),
);

function buildA2Module(moduleId: string): CourseModule {
  const manifest = A2_MODULE_MANIFEST[moduleId];
  const iconId = A2_MODULE_ICON_IDS[moduleId];
  if (!manifest || !iconId) {
    throw new Error(`data/course: missing A2 runtime metadata for module "${moduleId}".`);
  }
  return {
    id: moduleId,
    order: manifest.order,
    prerequisiteIds: [...manifest.prerequisiteIds],
    outcomeCopyIds: [manifest.outcomeCopyId],
    iconId,
    lessons: manifest.lessonIds.map((lessonId, index) => {
      const primaryCanDoId = a2PrimaryCanDoByLesson.get(lessonId);
      const objectiveCopyId = primaryCanDoId
        ? a2DescriptorByCanDo.get(primaryCanDoId)
        : undefined;
      if (!objectiveCopyId) {
        throw new Error(`data/course: A2 lesson "${lessonId}" has no authored Can-do descriptor.`);
      }
      return {
        id: lessonId,
        moduleId,
        order: index + 1,
        titleCopyId: lessonId,
        objectiveCopyIds: [objectiveCopyId],
      };
    }),
  };
}

export const a2CourseModules: readonly CourseModule[] = A2_MODULE_IDS.map(buildA2Module);
assertA2CourseShape(a2CourseModules);

export const courseModulesByLevel: Readonly<
  Record<CourseLevelId, readonly CourseModule[]>
> = {
  a0: baseCourseModules,
  a1: courseModules,
  a2: a2CourseModules,
};

export type CourseModulesLevel = keyof typeof courseModulesByLevel;
