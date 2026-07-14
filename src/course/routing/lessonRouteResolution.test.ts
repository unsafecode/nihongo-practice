import { describe, expect, it } from "vitest";
import { lessonPath } from "../../routing/routePaths";
import { courseModules } from "../data/course";
import type { CourseModule, Lesson, LessonSections } from "../data/types";
import {
  isLegacyModuleRedirectState,
  LEGACY_MODULE_ALIASES,
  LEGACY_MODULE_REDIRECT_STATE,
  resolveLessonRoute,
} from "./lessonRouteResolution";

function emptySections(): LessonSections {
  return [
    { id: "rule", blocks: [] },
    { id: "comparison", blocks: [] },
    { id: "explore", blocks: [] },
    { id: "recap", blocks: [] },
  ];
}

function makeLesson(id: string, moduleId: string): Lesson {
  return {
    id,
    moduleId,
    order: 1,
    titleCopyId: id,
    objectiveCopyIds: [],
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
    iconId: "sounds",
    lessons,
  };
}

describe("LEGACY_MODULE_ALIASES", () => {
  it("contains only the two real Task 3 renames", () => {
    expect(LEGACY_MODULE_ALIASES).toEqual({
      "travel-patterns": "questions-existence",
      traps: "capstone",
    });
  });
});

describe("resolveLessonRoute: canonical match", () => {
  it("resolves a canonical module+lesson pair normally", () => {
    const result = resolveLessonRoute("sounds", "sounds-core", courseModules);
    expect(result.kind).toBe("match");
    if (result.kind !== "match") throw new Error("expected match");
    expect(result.courseModule.id).toBe("sounds");
    expect(result.lesson.id).toBe("sounds-core");
  });
});

describe("resolveLessonRoute: legacy aliases", () => {
  it("redirects the former travel-patterns alias to questions-existence", () => {
    const result = resolveLessonRoute(
      "travel-patterns",
      "travel-questions",
      courseModules,
    );
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") throw new Error("expected redirect");
    expect(result.courseModule.id).toBe("questions-existence");
    expect(result.lesson.id).toBe("travel-questions");
  });

  it("redirects the former traps alias to capstone", () => {
    const result = resolveLessonRoute(
      "traps",
      "traps-verbs",
      courseModules,
    );
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") throw new Error("expected redirect");
    expect(result.courseModule.id).toBe("capstone");
    expect(result.lesson.id).toBe("traps-verbs");
  });
});

describe("resolveLessonRoute: mismatches are invalid", () => {
  it("rejects a canonical module paired with a lesson from another module (the traps-verbs regression)", () => {
    const result = resolveLessonRoute("sounds", "traps-verbs", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects a legacy alias paired with a lesson outside its canonical module", () => {
    const result = resolveLessonRoute(
      "travel-patterns",
      "sounds-core",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects the traps alias paired with a lesson that moved to questions-existence, not capstone", () => {
    const result = resolveLessonRoute(
      "traps",
      "travel-questions",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });
});

describe("resolveLessonRoute: unknown segments are invalid", () => {
  it("rejects an unknown module id", () => {
    const result = resolveLessonRoute(
      "bogus-module",
      "sounds-core",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects an unknown lesson id under a real module", () => {
    const result = resolveLessonRoute("sounds", "bogus-lesson", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects an unknown lesson id even under a recognized legacy alias", () => {
    const result = resolveLessonRoute(
      "travel-patterns",
      "bogus-lesson",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });

  it("never accepts a lesson by id alone: missing moduleId is invalid", () => {
    const result = resolveLessonRoute(undefined, "sounds-core", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects a missing lessonId", () => {
    const result = resolveLessonRoute("sounds", undefined, courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });
});

describe("resolveLessonRoute: isolated fixtures (no dependency on real course data)", () => {
  it("still matches/redirects/rejects the same way against a small synthetic module set", () => {
    const modules: CourseModule[] = [
      makeModule("alpha", [makeLesson("alpha-1", "alpha")]),
      makeModule("beta", [makeLesson("beta-1", "beta")]),
    ];

    expect(resolveLessonRoute("alpha", "alpha-1", modules).kind).toBe(
      "match",
    );
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
      "travel-patterns",
      "travel-questions",
      courseModules,
    );
    if (result.kind !== "redirect") throw new Error("expected redirect");
    const target = lessonPath(result.courseModule.id, result.lesson.id);
    expect(target).toBe("/percorso/questions-existence/travel-questions");
  });

  it("exposes a one-time redirect notice state marker distinguishable from any other router state", () => {
    expect(isLegacyModuleRedirectState(LEGACY_MODULE_REDIRECT_STATE)).toBe(
      true,
    );
    expect(isLegacyModuleRedirectState(null)).toBe(false);
    expect(isLegacyModuleRedirectState(undefined)).toBe(false);
    expect(isLegacyModuleRedirectState({})).toBe(false);
    expect(isLegacyModuleRedirectState({ invalidPath: "/x" })).toBe(false);
    expect(
      isLegacyModuleRedirectState({ legacyModuleRedirect: false }),
    ).toBe(false);
  });
});
