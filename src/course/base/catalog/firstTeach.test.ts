import { describe, expect, it } from "vitest";
import { BASE_CONCEPT_BY_ID, BASE_CONCEPTS } from "./concepts";
import {
  defineBaseLessonContent,
  type BasePhoneticLessonContent,
} from "./types";
import {
  BASE_FIRST_TEACH_OWNER_BY_KEY,
  BASE_FIRST_TEACH_OWNERS,
  firstTeachOwnerKey,
  validateFirstTeachOwners,
} from "./firstTeach";

describe("Base first-teach ownership", () => {
  it("deep-freezes authoring content and rejects duplicate structural activity IDs", () => {
    const lesson: BasePhoneticLessonContent = {
      lessonId: "sounds-1",
      contract: "phonetic",
      prerequisiteLessonIds: [],
      recapCopyId: "recap",
      activities: [
        {
          id: "activity-1",
          category: "meaning-comprehension",
          interactionKind: "choice",
          mode: "non-spoken",
          targetId: "target-1",
          operation: "recognize-meaning",
          instructionCopyId: "instruction-1",
          acceptedFeedbackCopyId: "accepted-1",
          retryFeedbackCopyId: "retry-1",
          assessedConceptIds: [],
          assessedLexemeIds: [],
        },
      ],
      contrastiveItemIds: ["contrast-1"],
      anchorLexemeIds: ["verb-kaku"],
      audioExemplarIds: ["audio-1"],
      phoneticExplanationCopyId: "explanation-1",
      contrastMapId: "contrast-map-1",
    };

    const defined = defineBaseLessonContent(lesson);

    expect(Object.isFrozen(defined)).toBe(true);
    expect(Object.isFrozen(defined.activities)).toBe(true);
    expect(Object.isFrozen(defined.activities[0])).toBe(true);
    expect(() =>
      defineBaseLessonContent({
        ...lesson,
        activities: [...lesson.activities, { ...lesson.activities[0] }],
      }),
    ).toThrow(
      expect.objectContaining({
        code: "duplicate-activity-id",
      }),
    );
    expect(() =>
      defineBaseLessonContent({
        ...lesson,
        contract: "system",
      } as unknown as BasePhoneticLessonContent),
    ).toThrow(
      expect.objectContaining({
        code: "wrong-contract-fields",
      }),
    );
  });

  it("assigns one frozen a0 owner to each lexeme, concept, form, and reference entry", () => {
    expect(BASE_FIRST_TEACH_OWNERS.length).toBeGreaterThan(40);
    expect(Object.isFrozen(BASE_FIRST_TEACH_OWNERS)).toBe(true);
    expect(
      BASE_FIRST_TEACH_OWNER_BY_KEY.get(firstTeachOwnerKey("concept", "affirmative-desu")),
    ).toMatchObject({
      levelId: "a0",
      lessonId: "sentence-foundations-3",
      kind: "concept",
    });

    expect(
      BASE_FIRST_TEACH_OWNER_BY_KEY.get(firstTeachOwnerKey("form", "te-imasu")),
    ).toMatchObject({ lessonId: "requests-connection-4", kind: "form" });
    expect(
      BASE_FIRST_TEACH_OWNER_BY_KEY.get(
        firstTeachOwnerKey("reference-entry", "reference-te-forms"),
      ),
    ).toMatchObject({ lessonId: "requests-connection-4" });
  });

  it("publishes concepts through frozen arrays and an immutable map view", () => {
    const mutable = BASE_CONCEPT_BY_ID as unknown as {
      clear?: () => void;
      set?: (id: string, value: unknown) => void;
    };
    mutable.clear?.();
    mutable.set?.("invented-concept", {});

    expect(Object.isFrozen(BASE_CONCEPTS)).toBe(true);
    expect(Object.isFrozen(BASE_CONCEPTS[0])).toBe(true);
    expect("set" in BASE_CONCEPT_BY_ID).toBe(false);
    expect(BASE_CONCEPT_BY_ID.get("affirmative-desu")?.firstTeachLessonId).toBe(
      "sentence-foundations-3",
    );
  });

  it("keeps critical particle, verb, time, adjective, and existence owners at their first lesson", () => {
    const owner = (kind: "concept" | "form", contentId: string) =>
      BASE_FIRST_TEACH_OWNER_BY_KEY.get(firstTeachOwnerKey(kind, contentId))?.lessonId;

    expect(owner("concept", "topic-wa")).toBe("topic-questions-1");
    expect(owner("concept", "focus-subject-ga")).toBe("topic-questions-2");
    expect(owner("concept", "possessive-no")).toBe("topic-questions-3");
    expect(owner("concept", "question-ka")).toBe("topic-questions-4");
    expect(owner("concept", "godan-verb-class")).toBe("polite-verbs-1");
    expect(owner("form", "four-polite-tense-cells")).toBe("time-movement-3");
    expect(owner("concept", "existence-location-frame")).toBe("existence-location-1");
    expect(owner("form", "te-kudasai")).toBe("requests-connection-2");
    expect(owner("form", "sequential-te")).toBe("requests-connection-3");
  });

  it("accepts the canonical owner graph and its prerequisite order", () => {
    expect(validateFirstTeachOwners(BASE_FIRST_TEACH_OWNERS, BASE_CONCEPTS)).toEqual([]);
  });

  it("reports duplicate ownership additively", () => {
    const duplicate = BASE_FIRST_TEACH_OWNERS.find(
      (owner) => owner.contentId === "affirmative-desu" && owner.kind === "concept",
    );
    expect(duplicate).toBeDefined();
    if (!duplicate) return;

    expect(
      validateFirstTeachOwners([...BASE_FIRST_TEACH_OWNERS, duplicate], BASE_CONCEPTS),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate-owner", contentId: "affirmative-desu" }),
      ]),
    );
  });

  it("reports missing lessons and prerequisite ownership ordered after their dependent", () => {
    const mutatedOwners = BASE_FIRST_TEACH_OWNERS.map((owner) =>
      owner.contentId === "topic-wa" && owner.kind === "concept"
        ? { ...owner, lessonId: "time-movement-4" }
        : owner,
    );
    const missingLesson = {
      contentId: "fictional",
      levelId: "a0" as const,
      lessonId: "missing-lesson",
      kind: "concept" as const,
    };

    expect(
      validateFirstTeachOwners([...mutatedOwners, missingLesson], BASE_CONCEPTS),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-lesson", contentId: "fictional" }),
        expect.objectContaining({
          code: "prerequisite-after-dependent",
          contentId: "focus-subject-ga",
          referenceId: "topic-wa",
        }),
      ]),
    );
  });

  it("reports a prerequisite cycle independently of ownership order", () => {
    const cyclicConcepts = BASE_CONCEPTS.map((concept) =>
      concept.id === "topic-wa"
        ? { ...concept, prerequisiteIds: ["focus-subject-ga"] }
        : concept.id === "focus-subject-ga"
          ? { ...concept, prerequisiteIds: ["topic-wa"] }
          : concept,
    );

    expect(validateFirstTeachOwners(BASE_FIRST_TEACH_OWNERS, cyclicConcepts)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "prerequisite-cycle" }),
      ]),
    );
  });
});
