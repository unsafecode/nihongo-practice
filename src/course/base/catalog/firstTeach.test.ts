import { describe, expect, it } from "vitest";
import * as conceptsCatalog from "./concepts";
import { BASE_CONCEPT_BY_ID, BASE_CONCEPTS } from "./concepts";
import {
  defineBaseLessonContent,
  type BaseConcept,
  type BasePhoneticLessonContent,
  type BaseSystemLessonContent,
} from "./types";
import {
  BASE_FIRST_TEACH_OWNER_BY_KEY,
  BASE_FIRST_TEACH_OWNERS,
  BASE_PARTICLE_SENSE_FIRST_TEACH_OWNER_BY_SENSE,
  firstTeachOwnerKey,
  validateFirstTeachOwners,
} from "./firstTeach";
import { BASE_LEXICON } from "./lexicon";
import {
  BASE_PARTICLE_SENSE_CONTENT_ID_BY_SENSE,
  BASE_PARTICLE_SENSES,
} from "../forms/particleLicensing";

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
        code: "lesson-contract-mismatch",
      }),
    );
  });

  it("requires manifest-backed contracts and complete plain-record lesson fields", () => {
    const semanticLesson: BaseSystemLessonContent = {
      lessonId: "sentence-foundations-3",
      contract: "system",
      prerequisiteLessonIds: [],
      recapCopyId: "recap",
      activities: [],
      newLexemeIds: [],
      reviewLexemeIds: [],
      introducedConceptIds: [],
      reviewedConceptIds: [],
      explanationBlockIds: {
        main: "main",
        construction: "construction",
        constraints: "constraints",
        commonError: "common-error",
        nearestContrast: "nearest-contrast",
      },
      patternCellIds: [],
      workedExampleIds: [],
      dialogueId: null,
      referenceSnapshotIds: [],
      interactive: false,
      retrievedSystemIds: [],
    };

    expect(() =>
      defineBaseLessonContent({
        ...semanticLesson,
        lessonId: "unknown-base-lesson",
      }),
    ).toThrow(expect.objectContaining({ code: "unknown-lesson-id" }));
    expect(() =>
      defineBaseLessonContent({
        ...semanticLesson,
        lessonId: "topic-questions-4",
      }),
    ).toThrow(expect.objectContaining({ code: "lesson-contract-mismatch" }));
    expect(() =>
      defineBaseLessonContent({
        ...semanticLesson,
        explanationBlockIds: {
          main: "main",
          construction: "construction",
        },
      } as unknown as BaseSystemLessonContent),
    ).toThrow(expect.objectContaining({ code: "wrong-contract-fields" }));
    expect(() =>
      defineBaseLessonContent({
        ...semanticLesson,
        explanationBlockIds: [
          "main",
          "construction",
          "constraints",
          "common-error",
          "nearest-contrast",
        ],
      } as unknown as BaseSystemLessonContent),
    ).toThrow(expect.objectContaining({ code: "wrong-contract-fields" }));
    expect(() =>
      defineBaseLessonContent({
        ...semanticLesson,
        activities: null,
      } as unknown as BaseSystemLessonContent),
    ).toThrow(expect.objectContaining({ code: "wrong-contract-fields" }));
    expect(() =>
      defineBaseLessonContent({
        ...semanticLesson,
        activities: [
          {
            id: "invalid-activity",
            category: "bogus",
            interactionKind: "choice",
            mode: "non-spoken",
            targetId: "target",
            operation: "recognize-meaning",
            instructionCopyId: "instruction",
            acceptedFeedbackCopyId: "accepted",
            retryFeedbackCopyId: "retry",
            assessedConceptIds: [],
            assessedLexemeIds: [],
          },
        ],
      } as unknown as BaseSystemLessonContent),
    ).toThrow(expect.objectContaining({ code: "wrong-contract-fields" }));
  });

  it("rejects opposite contract fields and publishes a clone of shallow-frozen authoring input", () => {
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
    const shallowFrozen = Object.freeze(lesson);
    const defined = defineBaseLessonContent(shallowFrozen);

    (lesson.activities[0] as { targetId: string }).targetId = "mutated-target";
    (lesson.activities[0].assessedLexemeIds as string[]).push("verb-taberu");

    expect(defined.activities[0]).toMatchObject({
      targetId: "target-1",
      assessedLexemeIds: [],
    });
    expect(Object.isFrozen(defined.activities[0].assessedLexemeIds)).toBe(true);
    expect(() =>
      defineBaseLessonContent({
        ...lesson,
        newLexemeIds: [],
        introducedConceptIds: [],
      } as unknown as BasePhoneticLessonContent),
    ).toThrow(expect.objectContaining({ code: "wrong-contract-fields" }));

    const semanticLesson: BaseSystemLessonContent = {
      lessonId: "sentence-foundations-3",
      contract: "system",
      prerequisiteLessonIds: ["sentence-foundations-2"],
      recapCopyId: "recap",
      activities: [],
      newLexemeIds: [],
      reviewLexemeIds: [],
      introducedConceptIds: [],
      reviewedConceptIds: [],
      explanationBlockIds: {
        main: "main",
        construction: "construction",
        constraints: "constraints",
        commonError: "common-error",
        nearestContrast: "nearest-contrast",
      },
      patternCellIds: [],
      workedExampleIds: [],
      dialogueId: null,
      referenceSnapshotIds: [],
      interactive: false,
      retrievedSystemIds: [],
    };
    expect(() =>
      defineBaseLessonContent({
        ...semanticLesson,
        contrastiveItemIds: [],
        anchorLexemeIds: [],
        audioExemplarIds: [],
        phoneticExplanationCopyId: "hidden",
        contrastMapId: "hidden",
      } as unknown as BaseSystemLessonContent),
    ).toThrow(expect.objectContaining({ code: "wrong-contract-fields" }));
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

  it("publishes immutable canonical retrieval systems without localized text", () => {
    const systems = (
      conceptsCatalog as Readonly<Record<string, unknown>>
    ).BASE_RETRIEVAL_SYSTEMS as
      | readonly {
          readonly id: string;
          readonly firstTeachLessonId: string;
          readonly componentContentIds: readonly string[];
        }[]
      | undefined;
    const index = (
      conceptsCatalog as Readonly<Record<string, unknown>>
    ).BASE_RETRIEVAL_SYSTEM_BY_ID as
      | ReadonlyMap<string, { readonly id: string }>
      | undefined;

    expect(systems).toBeDefined();
    expect(index).toBeDefined();
    expect(Object.isFrozen(systems)).toBe(true);
    expect(
      systems?.map((system) => system.id),
    ).toEqual(
      expect.arrayContaining([
        "sentence-anatomy",
        "particle-atlas",
        "verb-classes-conjugation",
        "tense-polarity",
        "adjective-copula",
        "existence-location",
        "bounded-te",
      ]),
    );
    expect(systems?.every((system) => system.componentContentIds.length > 0)).toBe(
      true,
    );
    expect(index?.get("bounded-te")?.id).toBe("bounded-te");
    expect(index && "set" in index).toBe(false);
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

  it("maps every particle sense to an immutable canonical first-teach owner", () => {
    expect(Object.isFrozen(BASE_PARTICLE_SENSE_CONTENT_ID_BY_SENSE)).toBe(true);
    expect(BASE_PARTICLE_SENSE_FIRST_TEACH_OWNER_BY_SENSE.size).toBe(
      BASE_PARTICLE_SENSES.length,
    );
    for (const sense of BASE_PARTICLE_SENSES) {
      const contentId = BASE_PARTICLE_SENSE_CONTENT_ID_BY_SENSE[sense.id];
      const owner = BASE_PARTICLE_SENSE_FIRST_TEACH_OWNER_BY_SENSE.get(sense.id);
      expect(contentId).toBeTruthy();
      expect(owner).toMatchObject({
        contentId,
        lessonId: sense.firstTeachLessonId,
      });
    }
  });

  it("accepts the canonical owner graph and its prerequisite order", () => {
    expect(validateFirstTeachOwners(BASE_FIRST_TEACH_OWNERS, BASE_CONCEPTS)).toEqual([]);
  });

  it("requires every catalog owner to match its canonical lesson and kind", () => {
    const movedKaku = BASE_FIRST_TEACH_OWNERS.map((owner) =>
      owner.kind === "lexeme" && owner.contentId === "verb-kaku"
        ? { ...owner, lessonId: "sounds-1" }
        : owner,
    );
    const kindMismatch = BASE_FIRST_TEACH_OWNERS.map((owner) =>
      owner.kind === "form" && owner.contentId === "te-imasu"
        ? { ...owner, kind: "concept" as const }
        : owner,
    );

    expect(validateFirstTeachOwners(movedKaku, BASE_CONCEPTS, BASE_LEXICON)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "owner-catalog-mismatch",
          contentId: "verb-kaku",
        }),
      ]),
    );
    expect(validateFirstTeachOwners(kindMismatch, BASE_CONCEPTS, BASE_LEXICON)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "owner-catalog-mismatch",
          contentId: "te-imasu",
        }),
      ]),
    );
  });

  it("requires metadata-bearing reference snapshots to have reference-entry owners", () => {
    const orphanSnapshot = {
      id: "reference-orphan",
      firstTeachLessonId: "sentence-foundations-3",
      titleCopyId: "reference-orphan-title",
    };

    expect(
      validateFirstTeachOwners(
        BASE_FIRST_TEACH_OWNERS,
        BASE_CONCEPTS,
        BASE_LEXICON,
        [orphanSnapshot],
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-owner",
          contentId: orphanSnapshot.id,
        }),
      ]),
    );
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

  it("uses canonical Base, A1, and A2 lesson order for global ownership", () => {
    const baseConcept: BaseConcept = {
      id: "fixture-base-concept",
      kind: "concept",
      prerequisiteIds: [],
      firstTeachLessonId: "base-synthesis-4",
    };
    const a1Concept: BaseConcept = {
      id: "fixture-a1-concept",
      kind: "concept",
      prerequisiteIds: [baseConcept.id],
      firstTeachLessonId: "introductions-1",
    };
    const a2Concept: BaseConcept = {
      id: "fixture-a2-concept",
      kind: "concept",
      prerequisiteIds: [a1Concept.id],
      firstTeachLessonId: "connected-conversation-1",
    };
    const owners = [
      ...BASE_FIRST_TEACH_OWNERS,
      {
        contentId: baseConcept.id,
        levelId: "a0" as const,
        lessonId: baseConcept.firstTeachLessonId,
        kind: "concept" as const,
      },
      {
        contentId: a1Concept.id,
        levelId: "a1" as const,
        lessonId: a1Concept.firstTeachLessonId,
        kind: "concept" as const,
      },
      {
        contentId: a2Concept.id,
        levelId: "a2" as const,
        lessonId: a2Concept.firstTeachLessonId,
        kind: "concept" as const,
      },
    ];

    expect(
      validateFirstTeachOwners(
        owners,
        [...BASE_CONCEPTS, baseConcept, a1Concept, a2Concept],
      ),
    ).toEqual([]);

    const baseDependingOnA1: BaseConcept = {
      ...baseConcept,
      id: "fixture-base-after-a1",
      prerequisiteIds: [a1Concept.id],
    };
    expect(
      validateFirstTeachOwners(
        [
          ...owners,
          {
            contentId: baseDependingOnA1.id,
            levelId: "a0" as const,
            lessonId: baseDependingOnA1.firstTeachLessonId,
            kind: "concept" as const,
          },
        ],
        [...BASE_CONCEPTS, baseConcept, a1Concept, a2Concept, baseDependingOnA1],
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "prerequisite-after-dependent",
          contentId: baseDependingOnA1.id,
          referenceId: a1Concept.id,
        }),
      ]),
    );
  });
});
