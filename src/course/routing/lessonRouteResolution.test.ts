import { describe, expect, it } from "vitest";
import { lessonPath } from "../../routing/routePaths";
import { A1_LESSON_IDS, A1_MODULE_IDS } from "../a1/manifest";
import { BASE_LESSON_IDS } from "../base/manifest";
import { legacyA1CourseModules as courseModules } from "../data/course";
import type { CourseModule, Lesson, LessonSections } from "../data/types";
import {
  baseNeighbors,
  isLegacyConsolidatedRedirectState,
  isLegacyModuleRedirectState,
  LEGACY_CONSOLIDATED_REDIRECT_STATE,
  LEGACY_LESSON_ALIASES,
  LEGACY_MODULE_REDIRECT_STATE,
  levelOwningModule,
  resolveLessonRoute,
  resolveOwnedLessonRoute,
} from "./lessonRouteResolution";

function emptySections(): LessonSections {
  return [
    { id: "rule", copyId: "fixture-rule", gear: "x" },
    {
      id: "comparison",
      copyId: "fixture-comparison",
      comparison: {
        id: "fixture-cmp",
        baseExampleId: "fixture-a",
        changedExampleId: "fixture-b",
        contrastDimension: "sound",
        changedGearIds: ["x"],
        changedSegmentIds: ["s"],
      },
    },
    {
      id: "explore",
      copyId: "fixture-explore",
      exploration: {
        kind: "tool",
        data: {
          id: "fixture-expl",
          objectiveId: "fixture-obj",
          target: "syllabary",
          returnTarget: { pathname: "/percorso/mx/lx", sectionId: "explore" },
        },
      },
    },
    { id: "recap", copyId: "fixture-recap" },
  ];
}

function makeLesson(id: string, moduleId: string): Lesson {
  return {
    id,
    moduleId,
    order: 1,
    titleCopyId: id,
    objectiveCopyIds: [],
    introducedConceptIds: [],
    requiredConceptIds: [],
    estimatedMinutes: 1,
    sections: emptySections(),
  };
}

function makeModule(id: string, lessons: Lesson[]): CourseModule {
  return {
    id,
    phase: "orient",
    order: 1,
    prerequisiteIds: [],
    outcomeCopyIds: [],
    estimatedMinutes: 1,
    coverage: { verbCount: 0, vocabularyCount: 0 },
    iconId: "sounds",
    lessons,
  };
}

const currentLessonIds = new Set(
  courseModules.flatMap((module) => module.lessons.map((lesson) => lesson.id)),
);

describe("LEGACY_LESSON_ALIASES", () => {
  it("covers every retired v2.1 lesson id and maps each to a real current lesson", () => {
    const removedV2Lessons = [
      "sounds-core",
      "sounds-special",
      "sentence-order",
      "sentence-omission",
      "actions-object",
      "actions-masu",
      "time-past",
      "time-negative",
      "places-action",
      "places-movement",
      "people-particles",
      "people-desire",
      "travel-questions",
      "travel-existence",
      "traps-particles",
      "traps-verbs",
    ];
    const aliased = new Set(
      LEGACY_LESSON_ALIASES.map((alias) => alias.legacyLessonId),
    );
    for (const legacyId of removedV2Lessons) {
      expect(aliased.has(legacyId), legacyId).toBe(true);
      expect(currentLessonIds.has(legacyId), legacyId).toBe(false);
    }
    for (const alias of LEGACY_LESSON_ALIASES) {
      const module = courseModules.find((m) => m.id === alias.moduleId);
      expect(module, alias.moduleId).toBeDefined();
      expect(
        module?.lessons.some((lesson) => lesson.id === alias.lessonId),
        alias.lessonId,
      ).toBe(true);
    }
  });
});

describe("resolveLessonRoute: canonical match", () => {
  it("resolves a canonical module+lesson pair normally", () => {
    const result = resolveLessonRoute("sounds", "sounds-1", courseModules);
    expect(result.kind).toBe("match");
    if (result.kind !== "match") throw new Error("expected match");
    expect(result.courseModule.id).toBe("sounds");
    expect(result.lesson.id).toBe("sounds-1");
  });

  it("resolves every canonical A1 module/lesson route, including all 64 expanded lessons", () => {
    const routes = courseModules.flatMap((courseModule) =>
      courseModule.lessons.map((lesson) => ({
        moduleId: courseModule.id,
        lessonId: lesson.id,
      })),
    );

    expect(routes).toHaveLength(64);
    expect(routes.map((route) => route.moduleId)).toEqual(
      A1_MODULE_IDS.flatMap((moduleId) => Array(4).fill(moduleId)),
    );
    expect(routes.map((route) => route.lessonId)).toEqual(A1_LESSON_IDS);
    for (const route of routes) {
      const result = resolveLessonRoute(route.moduleId, route.lessonId, courseModules);
      expect(result.kind, `${route.moduleId}/${route.lessonId}`).toBe("match");
    }
  });
});

describe("resolveLessonRoute: legacy aliases", () => {
  it("redirects each retired v2.1 lesson url to its canonical current lesson", () => {
    for (const alias of LEGACY_LESSON_ALIASES) {
      const result = resolveLessonRoute(
        alias.legacyModuleId,
        alias.legacyLessonId,
        courseModules,
      );
      expect(result.kind, alias.legacyLessonId).toBe("redirect");
      if (result.kind !== "redirect") continue;
      expect(result.courseModule.id).toBe(alias.moduleId);
      expect(result.lesson.id).toBe(alias.lessonId);
      expect(result.moduleChanged).toBe(
        alias.legacyModuleId !== alias.moduleId,
      );
    }
  });

  it("distinguishes a same-module rename from a cross-module redirect", () => {
    const sameModule = resolveLessonRoute(
      "sounds",
      "sounds-core",
      courseModules,
    );
    const crossModule = resolveLessonRoute(
      "time",
      "time-past",
      courseModules,
    );

    expect(sameModule).toMatchObject({
      kind: "redirect",
      moduleChanged: false,
      courseModule: { id: "sounds" },
      lesson: { id: "sounds-1" },
    });
    expect(crossModule).toMatchObject({
      kind: "redirect",
      moduleChanged: true,
      courseModule: { id: "past-negative" },
      lesson: { id: "past-negative-1" },
    });
  });

  it("redirects the retired sounds-5 lesson to sounds-4 and flags it as a content consolidation, not a rename", () => {
    const result = resolveLessonRoute("sounds", "sounds-5", courseModules);
    expect(result).toMatchObject({
      kind: "redirect",
      moduleChanged: false,
      consolidated: true,
      courseModule: { id: "sounds" },
      lesson: { id: "sounds-4" },
    });
  });

  it("marks every other legacy alias as a non-consolidated redirect", () => {
    for (const alias of LEGACY_LESSON_ALIASES) {
      if (alias.legacyLessonId === "sounds-5") continue;
      const result = resolveLessonRoute(
        alias.legacyModuleId,
        alias.legacyLessonId,
        courseModules,
      );
      if (result.kind !== "redirect") throw new Error("expected redirect");
      expect(result.consolidated, alias.legacyLessonId).toBe(false);
    }
  });

  it("redirects a legacy lesson to its canonical lesson even from a removed module id", () => {
    // The old capstone module id is gone; the retired lesson still resolves.
    const result = resolveLessonRoute("capstone", "traps-verbs", courseModules);
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") throw new Error("expected redirect");
    expect(result.courseModule.id).toBe("capstones");
    expect(result.lesson.id).toBe("capstones-3");
  });

  it("redirects an even-older chapter url form of a retired lesson", () => {
    const result = resolveLessonRoute("traps", "traps-verbs", courseModules);
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") throw new Error("expected redirect");
    expect(result.courseModule.id).toBe("capstones");
  });
});

describe("resolveLessonRoute: mismatches are invalid", () => {
  it("rejects a current lesson paired with a different current module", () => {
    const result = resolveLessonRoute("sounds", "actions-1", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects an unknown module id paired with a current lesson", () => {
    const result = resolveLessonRoute("bogus-module", "sounds-1", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects an unknown lesson id under a real module", () => {
    const result = resolveLessonRoute("sounds", "bogus-lesson", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects an unknown lesson id even under a recognized legacy module", () => {
    const result = resolveLessonRoute(
      "sentence-map",
      "bogus-lesson",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });

  it("never accepts a lesson by id alone: missing moduleId is invalid", () => {
    const result = resolveLessonRoute(undefined, "sounds-1", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects a missing lessonId", () => {
    const result = resolveLessonRoute("sounds", undefined, courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });
});

describe("resolveLessonRoute: isolated fixtures (no dependency on real course data)", () => {
  it("still matches/rejects the same way against a small synthetic module set", () => {
    const modules: CourseModule[] = [
      makeModule("alpha", [makeLesson("alpha-1", "alpha")]),
      makeModule("beta", [makeLesson("beta-1", "beta")]),
    ];

    expect(resolveLessonRoute("alpha", "alpha-1", modules).kind).toBe("match");
    expect(resolveLessonRoute("beta", "alpha-1", modules)).toEqual({
      kind: "invalid",
    });
    expect(resolveLessonRoute("gamma", "alpha-1", modules)).toEqual({
      kind: "invalid",
    });
  });
});

describe("resolveLessonRoute: canonical redirect target/state contract", () => {
  it("provides enough data to build the canonical lessonPath for a redirect", () => {
    const result = resolveLessonRoute(
      "sentence-map",
      "sentence-order",
      courseModules,
    );
    if (result.kind !== "redirect") throw new Error("expected redirect");
    const target = lessonPath(result.courseModule.id, result.lesson.id);
    expect(target).toBe("/percorso/introductions/introductions-1");
  });

  it("exposes a one-time redirect notice state marker distinguishable from any other router state", () => {
    expect(isLegacyModuleRedirectState(LEGACY_MODULE_REDIRECT_STATE)).toBe(true);
    expect(isLegacyModuleRedirectState(null)).toBe(false);
    expect(isLegacyModuleRedirectState(undefined)).toBe(false);
    expect(isLegacyModuleRedirectState({})).toBe(false);
    expect(isLegacyModuleRedirectState({ invalidPath: "/x" })).toBe(false);
    expect(isLegacyModuleRedirectState({ legacyModuleRedirect: false })).toBe(
      false,
    );
  });

  it("exposes a distinct one-time consolidation notice state marker, not conflated with the legacy-module marker", () => {
    expect(
      isLegacyConsolidatedRedirectState(LEGACY_CONSOLIDATED_REDIRECT_STATE),
    ).toBe(true);
    expect(isLegacyConsolidatedRedirectState(LEGACY_MODULE_REDIRECT_STATE)).toBe(
      false,
    );
    expect(
      isLegacyModuleRedirectState(LEGACY_CONSOLIDATED_REDIRECT_STATE),
    ).toBe(false);
    expect(isLegacyConsolidatedRedirectState(null)).toBe(false);
    expect(isLegacyConsolidatedRedirectState(undefined)).toBe(false);
    expect(isLegacyConsolidatedRedirectState({})).toBe(false);
    expect(
      isLegacyConsolidatedRedirectState({ legacyLessonConsolidated: false }),
    ).toBe(false);
  });
});

describe("levelOwningModule", () => {
  it("resolves the owning level for a module in each of the three levels", () => {
    expect(levelOwningModule("sounds")).toBe("a0");
    expect(levelOwningModule("introductions")).toBe("a1");
    expect(levelOwningModule("connected-conversation")).toBe("a2");
  });

  it("never guesses a1 for an unknown module", () => {
    expect(levelOwningModule("not-a-real-module")).toBeNull();
  });
});

describe("baseNeighbors", () => {
  it("computes previous/next from the ordered Base list, crossing a module boundary", () => {
    expect(baseNeighbors("time-movement-4")).toEqual({
      previousLessonId: "time-movement-3",
      nextLessonId: "copula-adjectives-1",
    });
  });

  it("has no previous at the first Base lesson and no next at the last", () => {
    expect(baseNeighbors(BASE_LESSON_IDS[0])).toEqual({
      previousLessonId: null,
      nextLessonId: BASE_LESSON_IDS[1],
    });
    expect(baseNeighbors(BASE_LESSON_IDS[BASE_LESSON_IDS.length - 1])).toEqual({
      previousLessonId: BASE_LESSON_IDS[BASE_LESSON_IDS.length - 2],
      nextLessonId: null,
    });
  });

  it("returns nulls for a lesson id outside the Base list", () => {
    expect(baseNeighbors("introductions-1")).toEqual({
      previousLessonId: null,
      nextLessonId: null,
    });
    expect(baseNeighbors("not-a-real-lesson")).toEqual({
      previousLessonId: null,
      nextLessonId: null,
    });
  });
});

describe("resolveOwnedLessonRoute: total three-level ownership", () => {
  it("resolves rehomed lessons as Base and keeps previous/next Base-local", () => {
    const route = resolveOwnedLessonRoute("sounds", "sounds-1");
    expect(route).toMatchObject({ kind: "match", levelId: "a0" });
    expect(baseNeighbors("time-movement-4")).toEqual({
      previousLessonId: "time-movement-3",
      nextLessonId: "copula-adjectives-1",
    });
  });

  it("resolves a retained A1 lesson and a real A2 lesson to their own levels", () => {
    expect(resolveOwnedLessonRoute("introductions", "introductions-1")).toMatchObject({
      kind: "match",
      levelId: "a1",
    });
    expect(
      resolveOwnedLessonRoute("connected-conversation", "connected-conversation-1"),
    ).toMatchObject({ kind: "match", levelId: "a2" });
  });

  it("never defaults an unknown module to A1", () => {
    expect(resolveOwnedLessonRoute("unknown", "sounds-1")).toEqual({
      kind: "invalid",
      reason: "unknown-module",
    });
  });

  it("rejects a current lesson paired with a different, but real and owned, module", () => {
    expect(resolveOwnedLessonRoute("sounds", "actions-1")).toEqual({
      kind: "invalid",
      reason: "unknown-lesson",
    });
    expect(resolveOwnedLessonRoute("existence-location", "sounds-1")).toEqual({
      kind: "invalid",
      reason: "wrong-module",
    });
  });

  it("rejects an unknown lesson under a real, owned module", () => {
    expect(resolveOwnedLessonRoute("sounds", "bogus-lesson")).toEqual({
      kind: "invalid",
      reason: "unknown-lesson",
    });
  });

  it("never accepts a lesson by id alone: missing params are invalid", () => {
    expect(resolveOwnedLessonRoute(undefined, "sounds-1")).toEqual({
      kind: "invalid",
      reason: "missing-params",
    });
    expect(resolveOwnedLessonRoute("sounds", undefined)).toEqual({
      kind: "invalid",
      reason: "missing-params",
    });
  });

  it("validates legacy aliases before owner-specific matching, even from a module id no level currently owns", () => {
    // "capstone"/"traps" are pre-rebuild module ids: no level owns them, so an
    // owner-first check would fail before ever reaching the alias table.
    const capstone = resolveOwnedLessonRoute("capstone", "traps-verbs");
    expect(capstone).toMatchObject({
      kind: "redirect",
      levelId: "a1",
      courseModule: { id: "capstones" },
      lesson: { id: "capstones-3" },
    });

    const traps = resolveOwnedLessonRoute("traps", "traps-verbs");
    expect(traps).toMatchObject({
      kind: "redirect",
      levelId: "a1",
      courseModule: { id: "capstones" },
    });
  });

  it("redirects every alias to its canonical current owner, matching each alias's declared moduleId", () => {
    for (const alias of LEGACY_LESSON_ALIASES) {
      const result = resolveOwnedLessonRoute(alias.legacyModuleId, alias.legacyLessonId);
      expect(result.kind, alias.legacyLessonId).toBe("redirect");
      if (result.kind !== "redirect") continue;
      expect(result.courseModule.id, alias.legacyLessonId).toBe(alias.moduleId);
      expect(result.lesson.id, alias.legacyLessonId).toBe(alias.lessonId);
    }
  });

  it("resolves a rehomed sounds alias (sounds-core) as Base, not A1", () => {
    const result = resolveOwnedLessonRoute("sounds", "sounds-core");
    expect(result).toMatchObject({
      kind: "redirect",
      levelId: "a0",
      courseModule: { id: "sounds" },
      lesson: { id: "sounds-1" },
    });
  });

  it("keeps a current-lesson-under-wrong-module invalid even for a Base module", () => {
    // "sentence-foundations" is a real, owned Base module, but does not own
    // "sounds-1" — pairing them must never silently render under the wrong
    // module.
    expect(
      resolveOwnedLessonRoute("sentence-foundations", "sounds-1"),
    ).toEqual({ kind: "invalid", reason: "wrong-module" });
  });
});
