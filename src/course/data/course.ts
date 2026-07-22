import type { SemanticIconId } from "../../components/icons/Icon";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import { A1_MODULE_IDS, A1_MODULE_MANIFEST } from "../a1/manifest";
import { a2CanDosAuthored, a2SemanticBuiltLessons } from "../a2/catalog/catalog";
import { A2_MODULE_IDS, A2_MODULE_MANIFEST } from "../a2/manifest";
import { assertA1CourseShape, assertA2CourseShape } from "./runtimeShapeAssertion";
import type { CourseModule, Lesson } from "./types";

/**
 * The runtime course source (Phase 2 Task 6, design spec §5/§6/§17).
 *
 * `courseModules` no longer comes from the legacy hand-assembled A0→A1
 * catalog: it is derived directly from the already-validated A1 release
 * catalog (Phase 2 Tasks 1-5) — the manifest for structure/order/
 * prerequisites/icon, and each lesson's authored Can-do descriptor for its
 * objective copy.
 *
 * The full content-cross-referencing release gate (`validateA1Release()`,
 * 2500+ lines across `validateA1.ts`+`validateFoundations.ts`) is
 * deliberately *not* imported here any more (Phase 2 Task 6, finding I3): it
 * now runs as the `prebuild` npm script (`scripts/validateA1Release.ts`)
 * before every `vite build`, and by the test suite (`validateA1.test.ts`) —
 * never inside the shipped browser bundle, where nothing could ever act on
 * its result anyway. What *does* still run here, at import time, is
 * `assertA1CourseShape()` — a small, always-bundled structural sanity check
 * (ids present/unique, counts positive, the release's known fixed module/
 * lesson totals) that throws rather than exporting anything partial. The
 * fail-closed guarantee is preserved, just split: full content validation
 * moves earlier (build time), and a lightweight shape assertion stays here
 * (runtime) as a last-resort guard against a corrupted assembly ever
 * shipping silently.
 *
 * The deep lesson body (rule/comparison/explore/recap) is not modelled here
 * at all: `A1LessonPage` resolves it lesson-by-lesson from the foundation
 * view model (`buildA1LessonViewModel`) or, for the four phonetic `sounds-*`
 * lessons, from `module1ItemsByLesson` directly. This module only carries the
 * stable routing/navigation/copy-id metadata every module/course-map/progress
 * consumer needs.
 */

/**
 * Exactly one icon per module, in module order — a purely decorative 1:1
 * mapping over the runtime's fixed 12-icon set (never a content claim).
 */
const MODULE_ICON_IDS: Readonly<Record<string, SemanticIconId>> = {
  sounds: "sounds",
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

/**
 * Every lesson names exactly one authored Can-do (`canDos.ts`'s
 * `CANDO_LESSONS` table, validated by the release gate's Can-do checks), so
 * this reverse map is total and never fabricated: a lesson missing from it is
 * a genuine authoring gap, not something this module papers over.
 */
const primaryCanDoByLessonId = new Map<string, string>();
for (const canDo of a1CanDosAuthored) {
  for (const lessonId of canDo.lessonIds) {
    primaryCanDoByLessonId.set(lessonId, canDo.descriptorCopyId);
  }
}

function buildLesson(lessonId: string, moduleId: string, order: number): Lesson {
  const objectiveCopyId = primaryCanDoByLessonId.get(lessonId);
  if (!objectiveCopyId) {
    throw new Error(
      `data/course: lesson "${lessonId}" has no authored Can-do descriptor to source its objective copy from.`,
    );
  }
  return {
    id: lessonId,
    moduleId,
    order,
    // Every A1 lesson's title copy is keyed by its own stable lesson id
    // (`i18n/en.ts` / `i18n/it.ts` resolve the actual localized title text).
    titleCopyId: lessonId,
    objectiveCopyIds: [objectiveCopyId],
  };
}

function buildModule(moduleId: string): CourseModule {
  const manifestEntry = A1_MODULE_MANIFEST[moduleId];
  const iconId = MODULE_ICON_IDS[moduleId];
  if (!iconId) {
    throw new Error(`data/course: no semantic icon mapped for module "${moduleId}".`);
  }
  return {
    id: moduleId,
    order: manifestEntry.order,
    prerequisiteIds: [...manifestEntry.prerequisiteIds],
    outcomeCopyIds: [manifestEntry.outcomeCopyId],
    iconId,
    lessons: manifestEntry.lessonIds.map((lessonId, index) =>
      buildLesson(lessonId, moduleId, index + 1),
    ),
  };
}

const assembledModules: CourseModule[] = A1_MODULE_IDS.map(buildModule);
assertA1CourseShape(assembledModules);

export const courseModules: CourseModule[] = assembledModules;

// ---------------------------------------------------------------------------
// A2 runtime course (Phase 3 Task 8, design spec §5)
// ---------------------------------------------------------------------------

/**
 * The A2 runtime course is derived from the frozen A2 release exactly as A1 is
 * (Phase 3 Task 8): `A2_MODULE_MANIFEST` supplies structure/order/prerequisites
 * and each module's outcome copy id, and each lesson's objective copy comes
 * from the primary Can-do its authored recipe actually names — never
 * fabricated. The build never imports the full `validateA2Release()` content
 * gate (that runs at prebuild / in the test suite); it only calls the small,
 * always-bundled `assertA2CourseShape()` so a corrupted assembly throws rather
 * than exporting a partial `a2CourseModules`.
 */

/**
 * One decorative semantic icon per A2 module, in module order. A2 has fifteen
 * modules but the runtime only ships twelve semantic icons, so icons are
 * reused across modules — the mapping is purely decorative (never a content
 * claim), exactly like A1's own 1:1 map.
 */
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

/** Each A2 Can-do's descriptor copy id, by Can-do id (the authoritative,
 * validated A2 registry — never fabricated). */
const a2DescriptorByCanDoId = new Map(
  a2CanDosAuthored.map((canDo) => [canDo.id, canDo.descriptorCopyId]),
);

/**
 * Each A2 lesson's own primary Can-do id, taken straight from its authored
 * recipe (`built.recipe.primaryCanDoId`). Unlike A1 — where every lesson maps
 * 1:1 to a single authored Can-do — an A2 lesson has one primary plus several
 * supporting Can-dos and a Can-do can serve many lessons, so the primary must
 * come from the recipe itself, not from scanning Can-do `lessonIds`.
 */
const a2PrimaryCanDoByLessonId = new Map<string, string>(
  a2SemanticBuiltLessons.map((built) => [built.recipe.id, built.recipe.primaryCanDoId]),
);

function buildA2Lesson(lessonId: string, moduleId: string, order: number): Lesson {
  const primaryCanDoId = a2PrimaryCanDoByLessonId.get(lessonId);
  if (!primaryCanDoId) {
    throw new Error(
      `data/course: A2 lesson "${lessonId}" has no authored recipe to source its primary Can-do from.`,
    );
  }
  const objectiveCopyId = a2DescriptorByCanDoId.get(primaryCanDoId);
  if (!objectiveCopyId) {
    throw new Error(
      `data/course: A2 lesson "${lessonId}" primary Can-do "${primaryCanDoId}" has no authored descriptor copy.`,
    );
  }
  return {
    id: lessonId,
    moduleId,
    order,
    // Every A2 lesson's title copy is keyed by its own stable lesson id, the
    // same convention A1 uses (`a2/runtimeCopy.ts` resolves the localized text).
    titleCopyId: lessonId,
    objectiveCopyIds: [objectiveCopyId],
  };
}

function buildA2Module(moduleId: string): CourseModule {
  const manifestEntry = A2_MODULE_MANIFEST[moduleId];
  const iconId = A2_MODULE_ICON_IDS[moduleId];
  if (!iconId) {
    throw new Error(`data/course: no semantic icon mapped for A2 module "${moduleId}".`);
  }
  return {
    id: moduleId,
    order: manifestEntry.order,
    prerequisiteIds: [...manifestEntry.prerequisiteIds],
    outcomeCopyIds: [manifestEntry.outcomeCopyId],
    iconId,
    lessons: manifestEntry.lessonIds.map((lessonId, index) =>
      buildA2Lesson(lessonId, moduleId, index + 1),
    ),
  };
}

const a2AssembledModules: CourseModule[] = A2_MODULE_IDS.map(buildA2Module);
assertA2CourseShape(a2AssembledModules);

export const a2CourseModules: CourseModule[] = a2AssembledModules;

/**
 * The level-aware runtime course handle (Phase 3 Task 8). `a1` is the exact
 * same `courseModules` reference every existing A1 consumer already imports —
 * so A1 output/URLs stay byte-for-byte stable — and `a2` is the fail-closed
 * A2 derivation above.
 */
export const courseModulesByLevel = {
  a1: courseModules,
  a2: a2CourseModules,
} as const;

/** A runtime course level id (`"a1"` | `"a2"`). */
export type CourseModulesLevel = keyof typeof courseModulesByLevel;
