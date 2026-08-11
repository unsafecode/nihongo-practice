import { describe, expect, it } from "vitest";
import {
  BASE_FIRST_TEACH_OWNER_BY_KEY,
  firstTeachOwnerKey,
} from "../catalog/firstTeach";
import { BASE_LEXICON } from "../catalog/lexicon";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID,
  BASE_EXISTENCE_LOCATION_MODULE,
  validateBaseExistenceLocationModule,
} from "./module08ExistenceLocation";

describe("Task 12 existence-particle ownership", () => {
  it.each([
    ["base-particle-existence-ni", "concept"],
    ["base-particle-existential-ga", "concept"],
  ] as const)("owns %s at existence-location-2", (contentId, kind) => {
    expect(
      BASE_FIRST_TEACH_OWNER_BY_KEY.get(firstTeachOwnerKey(kind, contentId))
        ?.lessonId,
    ).toBe("existence-location-2");
  });

  it("allocates the required new lexemes to every module 08 lesson", () => {
    expect(
      [1, 2, 3, 4].map(
        (order) =>
          BASE_LEXICON.filter(
            ({ firstTeachLessonId }) =>
              firstTeachLessonId === `existence-location-${order}`,
          ).length,
      ),
    ).toEqual([5, 4, 4, 9]);
  });

  it("publishes three system lessons and one content lesson with a finding-place dialogue", () => {
    expect(
      BASE_EXISTENCE_LOCATION_MODULE.lessons.map(
        ({ content }) => content.contract,
      ),
    ).toEqual(["system", "system", "system", "content"]);
    for (const lesson of BASE_EXISTENCE_LOCATION_MODULE.lessons.slice(0, 3)) {
      expect(lesson.examples.length).toBeGreaterThanOrEqual(10);
      expect(lesson.examples.length).toBeLessThanOrEqual(14);
    }
    const practical = BASE_EXISTENCE_LOCATION_MODULE.lessons[3];
    expect(practical.examples.length).toBeGreaterThanOrEqual(6);
    expect(practical.examples.length).toBeLessThanOrEqual(10);
    expect(practical.dialogue?.turns.length).toBeGreaterThanOrEqual(4);
    expect(practical.dialogue?.turns.length).toBeLessThanOrEqual(8);
    expect(
      BASE_EXISTENCE_LOCATION_MODULE.lessons[2].content.introducedConceptIds,
    ).toEqual([
      "existence-vs-action-location",
      "existential-ga-vs-topic-wa",
    ]);
    for (const lesson of BASE_EXISTENCE_LOCATION_MODULE.lessons) {
      expect(lesson.content.activities.filter(({ mode }) => mode === "non-spoken")).toHaveLength(8);
      expect(lesson.content.activities.filter(({ mode }) => mode === "audio")).toHaveLength(2);
    }
    expect(validateBaseExistenceLocationModule(BASE_EXISTENCE_LOCATION_MODULE)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("grounds ある and いる in independent inanimate and animate entity classes", () => {
    expect(BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID.get("noun-tsukue")).toBe(
      "inanimate",
    );
    expect(BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID.get("noun-inu")).toBe(
      "animate",
    );
    for (const [lessonIndex, lesson] of BASE_EXISTENCE_LOCATION_MODULE.lessons.entries()) {
      for (const target of [
        ...lesson.examples,
        ...(lesson.dialogue?.turns ?? []),
        ...lesson.activityDesigns.flatMap((activity) => [
          ...activity.optionTargets,
          activity.acceptedAnswerTarget,
        ]),
      ]) {
        if (
          target.predicateLexemeId !== "verb-aru" &&
          target.predicateLexemeId !== "verb-iru"
        ) {
          continue;
        }
        expect(target.predicateAspect).toBe("stative");
        expect(target.interpretationTags).toContain("present-state");
        expect(target.interpretationTags).not.toContain("ongoing-now");
        if (lessonIndex === 0) {
          expect(target.particleFrame).toBeUndefined();
          expect(target.semanticRoleIds).toContain("topic");
        } else {
          expect(target.particleFrame?.provided["existence-location"]).toBe(
            "existence-location-ni",
          );
          expect(
            target.particleFrame?.provided["existential-subject"] ===
              "existential-subject-ga" ||
              target.semanticRoleIds.includes("topic"),
          ).toBe(true);
        }
      }
    }
  });

  it("rejects a cloned accepted target whose existence predicate contradicts its entity class", () => {
    const mutated = structuredClone(BASE_EXISTENCE_LOCATION_MODULE);
    const target = mutated.lessons[0].examples[0] as unknown as {
      lexemeIds: string[];
      predicateLexemeId: string | null;
      predicateSenseId: string | null;
    };
    target.lexemeIds = target.lexemeIds.map((id) =>
      id === "verb-aru" ? "verb-iru" : id,
    );
    target.predicateLexemeId = "verb-iru";
    target.predicateSenseId = "iru";

    expect(validateBaseExistenceLocationModule(mutated).ok).toBe(false);
  });

  it("rejects a coherently relabeled action-place で on an existence predicate", () => {
    const mutated = structuredClone(BASE_EXISTENCE_LOCATION_MODULE);
    const target = mutated.lessons[1].examples[0] as unknown as {
      tokens: {
        jp: string;
        romaji: string;
        source: { referenceId: string };
      }[];
      semanticRoleIds: string[];
      particleBindings: {
        role: string;
        particleSense: string;
        attachmentLexemeId: string;
      }[];
      particleFrame: {
        predicateSenseId: string;
        provided: Record<string, string>;
        attachmentLexemeIdByRole: Record<string, string>;
      };
    };
    const particle = target.tokens.find(
      ({ source }) => source.referenceId === "existence-location-ni",
    )!;
    particle.jp = "で";
    particle.romaji = "de";
    particle.source.referenceId = "action-place-de";
    target.semanticRoleIds[0] = "action-place";
    target.particleBindings[0] = {
      role: "action-place",
      particleSense: "action-place-de",
      attachmentLexemeId: "noun-heya",
    };
    target.particleFrame.provided = {
      "action-place": "action-place-de",
      "existential-subject": "existential-subject-ga",
    };
    target.particleFrame.attachmentLexemeIdByRole = {
      "action-place": "noun-heya",
      "existential-subject": "noun-isu",
    };

    expect(validateBaseExistenceLocationModule(mutated).ok).toBe(false);
  });

  it("names the exact authored locations in non-audio activity situations", () => {
    const frameLesson = BASE_EXISTENCE_LOCATION_MODULE.lessons[1];
    const practicalLesson = BASE_EXISTENCE_LOCATION_MODULE.lessons[3];
    const officeChairId = frameLesson.content.activities[0].instructionCopyId;
    const restroomId =
      practicalLesson.content.activities[4].instructionCopyId;
    const classroomEmployeeId =
      practicalLesson.content.activities[7].instructionCopyId;

    expect(baseNavigationCopyEn.content[officeChairId]).toMatch(/office/iu);
    expect(baseNavigationCopyIt.content[officeChairId]).toMatch(/ufficio/iu);
    expect(baseNavigationCopyEn.content[restroomId]).not.toMatch(/or bag/iu);
    expect(baseNavigationCopyIt.content[restroomId]).not.toMatch(
      /o la borsa/iu,
    );
    expect(baseNavigationCopyEn.content[classroomEmployeeId]).toMatch(
      /classroom/iu,
    );
    expect(baseNavigationCopyIt.content[classroomEmployeeId]).toMatch(
      /aula/iu,
    );
  });
});
