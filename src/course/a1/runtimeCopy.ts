/**
 * Runtime i18n copy for the A1 release catalog (Phase 2 Task 6).
 *
 * `data/course.ts`'s `courseModules` derives its structure from the validated
 * A1 manifest, but the manifest itself carries no learner-visible text — only
 * locale-independent copy ids (`lesson.titleCopyId`, `module.outcomeCopyIds`,
 * `lesson.objectiveCopyIds`). This module is the single place that resolves
 * those ids into the four `CourseCopy` dictionaries the runtime needs
 * (`modules`, `lessons`, `objectives`, `outcomes`), each keyed exactly to the
 * ids `data/course.ts` actually assigns — no more, no fewer — so the i18n
 * orphan/coverage checks in `i18n/validate.test.ts` stay meaningful.
 *
 * Module and lesson *titles* are the one piece of genuinely new copy this
 * release needs (no legacy source ever named these 12 modules or 48 lessons).
 * Twelve short, honest module titles are authored by hand below; all 48
 * lesson titles are derived mechanically as "<Module title> <position in
 * module>" (e.g. "Sounds 1", "Descriptions 3") rather than fabricating a
 * distinct content claim per lesson — the actual "what this lesson teaches"
 * claim is already carried honestly by the lesson's Can-do objective copy
 * (`copy.objectives[...]`), shown alongside the title everywhere titles
 * appear.
 *
 * Can-do descriptor (`objectives`) and module-outcome (`outcomes`) text is
 * already authored in `a1/catalog/a1CopyGloss.ts` (`a1SharedCopy`) and
 * `a1/catalog/module01Sounds.ts` (`module1Copy`, for the one module-outcome
 * key the shared gloss doesn't carry). `a1/copy/en.ts` / `it.ts` aggregate
 * those plus every module's own lesson copy into one flat superset map per
 * locale (`a1CopyEn` / `a1CopyIt`); this module reads *only* the specific
 * descriptor/outcome keys `data/course.ts` actually references out of that
 * superset, rather than spreading the whole thing (which would leak hundreds
 * of unrelated exercise/hint copy ids into `CourseCopy["objectives"]`).
 */
import { a1CanDosAuthored } from "./catalog/canDos";
import {
  a1ContrastFeatureCopyId,
  module1ItemsByLesson,
} from "./catalog/module01Sounds";
import { a1CopyEn } from "./copy/en";
import { a1CopyIt } from "./copy/it";
import { A1_MODULE_IDS, A1_MODULE_MANIFEST } from "./manifest";
import type { ModuleCopy, LessonCopy } from "../i18n/types";

type Locale = "en" | "it";

const A1_MODULE_TITLES: Readonly<Record<Locale, Readonly<Record<string, string>>>> = {
  en: {
    sounds: "Sounds",
    introductions: "Introductions",
    "essential-questions": "Essential Questions",
    actions: "Actions",
    routines: "Routines",
    "past-negative": "Past & Negative",
    places: "Places",
    people: "People",
    descriptions: "Descriptions",
    shopping: "Shopping",
    "existence-needs": "Existence & Needs",
    capstones: "Bringing It Together",
  },
  it: {
    sounds: "Suoni",
    introductions: "Presentazioni",
    "essential-questions": "Domande essenziali",
    actions: "Azioni",
    routines: "Routine",
    "past-negative": "Passato e negazione",
    places: "Luoghi",
    people: "Persone",
    descriptions: "Descrizioni",
    shopping: "Acquisti",
    "existence-needs": "Esistenza e bisogni",
    capstones: "Mettere tutto insieme",
  },
};

function moduleTitle(locale: Locale, moduleId: string): string {
  const title = A1_MODULE_TITLES[locale][moduleId];
  if (!title) {
    throw new Error(`runtimeCopy: no authored module title for "${moduleId}" (${locale}).`);
  }
  return title;
}

/** `CourseCopy["modules"]` — one short authored title per A1 module id. */
export function a1RuntimeModuleCopy(locale: Locale): Record<string, ModuleCopy> {
  const out: Record<string, ModuleCopy> = {};
  for (const moduleId of A1_MODULE_IDS) {
    out[moduleId] = { title: moduleTitle(locale, moduleId) };
  }
  return out;
}

/**
 * `CourseCopy["lessons"]` — one title per A1 lesson id, derived mechanically
 * as "<module title> <position in module>" (never a fabricated per-lesson
 * content claim; see module doc comment).
 */
export function a1RuntimeLessonCopy(locale: Locale): Record<string, LessonCopy> {
  const out: Record<string, LessonCopy> = {};
  for (const moduleId of A1_MODULE_IDS) {
    const title = moduleTitle(locale, moduleId);
    A1_MODULE_MANIFEST[moduleId].lessonIds.forEach((lessonId, index) => {
      out[lessonId] = { title: `${title} ${index + 1}` };
    });
  }
  return out;
}

function copySource(locale: Locale): Readonly<Record<string, string>> {
  return locale === "en" ? a1CopyEn : a1CopyIt;
}

/**
 * `CourseCopy["objectives"]` — exactly the fifteen authored Can-do
 * descriptor strings `data/course.ts` assigns as lesson objective copy, never
 * the full aggregated superset (which would leak unrelated exercise copy).
 */
export function a1RuntimeObjectiveCopy(locale: Locale): Record<string, string> {
  const source = copySource(locale);
  const out: Record<string, string> = {};
  for (const canDo of a1CanDosAuthored) {
    const text = source[canDo.descriptorCopyId];
    if (!text) {
      throw new Error(
        `runtimeCopy: no authored objective copy for "${canDo.descriptorCopyId}" (${locale}).`,
      );
    }
    out[canDo.descriptorCopyId] = text;
  }
  return out;
}

/**
 * `CourseCopy["outcomes"]` — exactly the twelve authored module-outcome
 * strings `data/course.ts` assigns as module outcome copy.
 */
export function a1RuntimeOutcomeCopy(locale: Locale): Record<string, string> {
  const source = copySource(locale);
  const out: Record<string, string> = {};
  for (const moduleId of A1_MODULE_IDS) {
    const key = A1_MODULE_MANIFEST[moduleId].outcomeCopyId;
    const text = source[key];
    if (!text) {
      throw new Error(`runtimeCopy: no authored outcome copy for "${key}" (${locale}).`);
    }
    out[key] = text;
  }
  return out;
}

/**
 * `CourseCopy["phonetics"]` — exactly the copy the four phonetic `sounds-*`
 * lessons reference: every authored item's `hintCopyId` (its short
 * mora/glyph description, e.g. "The open vowel /a/."), every distinct
 * `contrastFeature` label the items declare (e.g. "Voicing (dakuten)"), and
 * the module's own `a1-phonetic-outcome-<lessonId>` Can-do-style outcome
 * text. All three already live in the aggregated `a1CopyEn`/`a1CopyIt`
 * superset (via `module1Copy`); this reads only the ids the phonetic catalog
 * actually assigns, the same narrow-projection discipline
 * `a1RuntimeObjectiveCopy`/`a1RuntimeOutcomeCopy` use, so the i18n
 * orphan/coverage checks stay meaningful.
 */
export function a1RuntimePhoneticCopy(locale: Locale): Record<string, string> {
  const source = copySource(locale);
  const out: Record<string, string> = {};
  const require = (key: string, what: string): string => {
    const text = source[key];
    if (!text) {
      throw new Error(`runtimeCopy: no authored ${what} copy for "${key}" (${locale}).`);
    }
    return text;
  };
  for (const [lessonId, items] of Object.entries(module1ItemsByLesson)) {
    const outcomeKey = `a1-phonetic-outcome-${lessonId}`;
    out[outcomeKey] = require(outcomeKey, "phonetic outcome");
    for (const item of items) {
      out[item.hintCopyId] = require(item.hintCopyId, "phonetic hint");
      const contrastKey = a1ContrastFeatureCopyId(item.contrastFeature);
      out[contrastKey] = require(contrastKey, "phonetic contrast-feature");
    }
  }
  return out;
}
