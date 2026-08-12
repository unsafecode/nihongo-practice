import { describe, expect, it } from "vitest";
import {
  BASE_FIRST_TEACH_OWNER_BY_KEY,
  firstTeachOwnerKey,
} from "../catalog/firstTeach";
import { BASE_LEXICON } from "../catalog/lexicon";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  realizeIAdjectiveAttributive,
  validateBasePredicate,
} from "../forms/adjectiveForms";
import {
  BASE_MEANING_ACTIVITY_SHAPE,
  BASE_SENTENCE_FOUNDATIONS_MODULE,
} from "./module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_MODULE } from "./module03TopicQuestions";
import { BASE_POLITE_VERBS_MODULE } from "./module04PoliteVerbs";
import {
  buildTask11Lesson,
  task11Target,
  type BaseTask11Part,
} from "./module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_MODULE } from "./module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_MODULE } from "./module06TimeMovement";
import {
  BASE_COPULA_ADJECTIVES_MODULE,
  BASE_COPULA_ADJECTIVES_PREDICATE_CELLS,
  validateBaseCopulaAdjectivesModule,
} from "./module07CopulaAdjectives";

function japanese(target: {
  readonly tokens: readonly { readonly jp: string }[];
}): string {
  return target.tokens.map(({ jp }) => jp).join("");
}

describe("Task 12 copula and adjective ownership", () => {
  it("owns the i-adjective negative form at copula-adjectives-3", () => {
    expect(
      BASE_FIRST_TEACH_OWNER_BY_KEY.get(
        firstTeachOwnerKey("form", "base-form-i-adjective-negative"),
      )?.lessonId,
    ).toBe("copula-adjectives-3");
  });

  it("keeps adjective and negative noun-predicate morphology out of modules 02-06", () => {
    const modules = [
      BASE_SENTENCE_FOUNDATIONS_MODULE,
      BASE_TOPIC_QUESTIONS_MODULE,
      BASE_POLITE_VERBS_MODULE,
      BASE_ARGUMENT_PARTICLES_MODULE,
      BASE_TIME_MOVEMENT_MODULE,
    ];
    const visibleJapanese = modules.flatMap(({ lessons }) =>
      lessons.flatMap((lesson) => [
        ...lesson.examples.map(japanese),
        ...(lesson.dialogue?.turns.map(japanese) ?? []),
        ...lesson.activityDesigns.flatMap((activity) => [
          japanese(activity.promptTarget),
          ...activity.optionTargets.map(japanese),
          japanese(activity.acceptedAnswerTarget),
        ]),
      ]),
    );

    expect(visibleJapanese.join("\n")).not.toMatch(
      /くないです|かったです|ではありません/u,
    );
  });

  it("rejects an i-adjective followed by plain copula だ deterministically", () => {
    expect(
      validateBasePredicate({
        predicateKind: "i-adjective",
        lexemeId: "adjective-takai",
        form: "affirmative",
        ending: "da",
        surface: "たかいだ",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "i-adjective-copula-da",
        lexemeId: "adjective-takai",
      },
    });
  });

  it("generates i-adjective attributive form from the canonical adjective engine", () => {
    const result = realizeIAdjectiveAttributive("adjective-oishii");
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.map(({ jp }) => jp).join("")).toBe("おいしい");
  });

  it.each([
      [
        {
          kind: "predicate-form",
          predicateKind: "noun",
          lexemeId: "noun-gakusei",
          form: "negative",
        },
        "がくせいではありません",
        "base-form-noun-predicate-negative",
      ],
      [
        {
          kind: "predicate-form",
          predicateKind: "i-adjective",
          lexemeId: "adjective-takai",
          form: "negative",
        },
        "たかくないです",
        "base-form-i-adjective-negative",
      ],
      [
        {
          kind: "na-adjective-attributive",
          lexemeId: "adjective-shizuka",
        },
        "しずかな",
        "base-form-na-adjective-attributive",
      ],
    ] as const)(
      "builds %s only through the canonical predicate-form source",
      (part, expected, expectedFormId) => {
        const target = task11Target([part as BaseTask11Part], {
          conceptIds: [],
          patternCellIds: ["test-cell"],
          semanticRoleIds: [],
          interpretationTags: ["present-state"],
          predicateSenseId: part.lexemeId,
          predicateLexemeId: part.lexemeId,
          predicateAspect:
            part.kind === "predicate-form" && part.predicateKind === "noun"
              ? "nominal"
              : "adjectival",
        });
        const built = buildTask11Lesson({
          lessonId: "copula-adjectives-3",
          contract: "system",
          prerequisiteLessonIds: ["copula-adjectives-2"],
          newLexemeIds: [],
          reviewLexemeIds: [part.lexemeId],
          introducedConceptIds: [],
          reviewedConceptIds: [],
          patternCellIds: ["test-cell"],
          referenceSnapshotIds: [],
          examples: [
            {
              target,
              frame: "test",
              utteranceKind: "complete-clause",
              en: "Test.",
              it: "Prova.",
              purposeEn: "Tests canonical realization.",
              purposeIt: "Verifica la realizzazione canonica.",
              semanticTag: "present-state",
            },
          ],
          activities: [],
          dialogue: null,
        });

        expect(japanese(built.lesson.examples[0])).toBe(expected);
        expect(built.lesson.examples[0].formIds).toContain(expectedFormId);
      },
  );

  it("keeps authored fact statuses attached to targets when options reorder", () => {
    const answer = task11Target(
      [
        {
          kind: "predicate-form",
          predicateKind: "noun",
          lexemeId: "noun-gakusei",
          form: "affirmative",
        },
      ],
      {
        conceptIds: [],
        patternCellIds: ["test-cell"],
        semanticRoleIds: [],
        interpretationTags: ["present-state"],
        predicateSenseId: "gakusei",
        predicateLexemeId: "noun-gakusei",
        predicateAspect: "nominal",
      },
    );
    const distractor = task11Target(
      [
        {
          kind: "predicate-form",
          predicateKind: "noun",
          lexemeId: "noun-sensei",
          form: "affirmative",
        },
      ],
      {
        conceptIds: [],
        patternCellIds: ["test-cell"],
        semanticRoleIds: [],
        interpretationTags: ["present-state"],
        predicateSenseId: "sensei",
        predicateLexemeId: "noun-sensei",
        predicateAspect: "nominal",
      },
    );
    const authoredStatuses = {
      answerFactStatus: "rejected-context",
      distractorFactStatus: "accepted-world",
    } as const;
    const built = buildTask11Lesson({
      lessonId: "copula-adjectives-1",
      contract: "system",
      prerequisiteLessonIds: [],
      newLexemeIds: [],
      reviewLexemeIds: ["noun-gakusei", "noun-sensei"],
      introducedConceptIds: [],
      reviewedConceptIds: [],
      patternCellIds: ["test-cell"],
      referenceSnapshotIds: [],
      examples: [],
      activities: [
        {
          prompt: answer,
          answer,
          distractor,
          correctOptionIndex: 1,
          promptContextCopyId: "test-context",
          patternCellId: "test-cell",
          shape: BASE_MEANING_ACTIVITY_SHAPE,
          referentId: "noun-gakusei",
          worldFactId: "fact-target-bound-status",
          errorCode: null,
          ...authoredStatuses,
        },
      ],
      dialogue: null,
    });

    expect(built.lesson.activityDesigns[0].optionFactStatus).toEqual([
      "accepted-world",
      "rejected-context",
    ]);
  });

  it("allocates three to six genuinely new lexemes to every module 07 lesson", () => {
    expect(
      [1, 2, 3, 4].map(
        (order) =>
          BASE_LEXICON.filter(
            ({ firstTeachLessonId }) =>
              firstTeachLessonId === `copula-adjectives-${order}`,
          ).length,
      ),
    ).toEqual([3, 3, 3, 4]);
  });

  it("publishes exactly four system lessons with the complete semantic contract", () => {
    expect(BASE_COPULA_ADJECTIVES_MODULE.lessons).toHaveLength(4);
    expect(
      BASE_COPULA_ADJECTIVES_MODULE.lessons.map(
        ({ content }) => content.contract,
      ),
    ).toEqual(["system", "system", "system", "system"]);
    for (const lesson of BASE_COPULA_ADJECTIVES_MODULE.lessons) {
      expect(lesson.examples.length).toBeGreaterThanOrEqual(10);
      expect(lesson.examples.length).toBeLessThanOrEqual(14);
      expect(lesson.content.newLexemeIds.length).toBeGreaterThanOrEqual(3);
      expect(lesson.content.newLexemeIds.length).toBeLessThanOrEqual(6);
      expect(lesson.content.activities.filter(({ mode }) => mode === "non-spoken")).toHaveLength(8);
      expect(lesson.content.activities.filter(({ mode }) => mode === "audio")).toHaveLength(2);
      expect(
        new Set(lesson.content.activities.map(({ category }) => category)).size,
      ).toBeGreaterThanOrEqual(8);
      expect(lesson.content.referenceSnapshotIds).toContain(
        "reference-adjective-grid",
      );
    }
    expect(validateBaseCopulaAdjectivesModule(BASE_COPULA_ADJECTIVES_MODULE)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("progressively publishes every generated noun, i, and na predicate cell", () => {
    expect(
      BASE_COPULA_ADJECTIVES_PREDICATE_CELLS.map(
        ({ lessonId, id, tokens }) => [
          lessonId,
          id,
          tokens.map(({ jp }) => jp).join(""),
        ],
      ),
    ).toEqual([
      ["copula-adjectives-1", "noun-predicate-affirmative", "がくせいです"],
      ["copula-adjectives-1", "noun-predicate-negative", "がくせいではありません"],
      ["copula-adjectives-2", "noun-predicate-past-affirmative", "がくせいでした"],
      [
        "copula-adjectives-2",
        "noun-predicate-past-negative",
        "がくせいではありませんでした",
      ],
      ["copula-adjectives-3", "i-adjective-affirmative", "おいしいです"],
      ["copula-adjectives-3", "i-adjective-negative", "おいしくないです"],
      ["copula-adjectives-3", "i-adjective-past-affirmative", "おいしかったです"],
      [
        "copula-adjectives-3",
        "i-adjective-past-negative",
        "おいしくなかったです",
      ],
      ["copula-adjectives-4", "na-adjective-affirmative", "しずかです"],
      ["copula-adjectives-4", "na-adjective-negative", "しずかではありません"],
      ["copula-adjectives-4", "na-adjective-past-affirmative", "しずかでした"],
      [
        "copula-adjectives-4",
        "na-adjective-past-negative",
        "しずかではありませんでした",
      ],
      ["copula-adjectives-4", "na-adjective-attributive", "しずかな"],
    ]);
  });

  it("rejects a cloned accepted target containing the deliberate たかいだ error", () => {
    const mutated = structuredClone(BASE_COPULA_ADJECTIVES_MODULE);
    const lesson = mutated.lessons.find(
      ({ content }) => content.lessonId === "copula-adjectives-3",
    )!;
    const diagnosis = lesson.activityDesigns.find(
      ({ promptTarget }) => japanese(promptTarget).includes("たかいだ"),
    )!;
    const target = lesson.activityDesigns.find(
      ({ acceptedAnswerTarget }) =>
        acceptedAnswerTarget.predicateLexemeId === "adjective-takai" &&
        japanese(acceptedAnswerTarget).endsWith("です"),
    )!.acceptedAnswerTarget as unknown as {
      tokens: typeof diagnosis.promptTarget.tokens;
      formIds: typeof diagnosis.promptTarget.formIds;
    };
    const erroneous = diagnosis.promptTarget;
    target.tokens = structuredClone(erroneous.tokens);
    target.formIds = structuredClone(erroneous.formIds);

    expect(validateBaseCopulaAdjectivesModule(mutated).ok).toBe(false);
  });

  it("rejects a cloned attributive target with its required な omitted", () => {
    const mutated = structuredClone(BASE_COPULA_ADJECTIVES_MODULE);
    const lesson = mutated.lessons.find(
      ({ content }) => content.lessonId === "copula-adjectives-4",
    )!;
    const diagnosis = lesson.activityDesigns.find(
      ({ promptTarget }) =>
        japanese(promptTarget).includes("しずかしょくどう"),
    )!;
    const target = diagnosis.acceptedAnswerTarget as unknown as {
      tokens: typeof diagnosis.promptTarget.tokens;
      formIds: typeof diagnosis.promptTarget.formIds;
    };
    target.tokens = structuredClone(diagnosis.promptTarget.tokens);
    target.formIds = structuredClone(diagnosis.promptTarget.formIds);

    expect(validateBaseCopulaAdjectivesModule(mutated).ok).toBe(false);
  });

  it("keeps the missing-な diagnosis content-preserving and causally minimal", () => {
    const diagnosis =
      BASE_COPULA_ADJECTIVES_MODULE.lessons[3].activityDesigns.find(
        ({ category }) => category === "error-diagnosis",
      )!;
    const distractor =
      diagnosis.optionTargets[
        diagnosis.correctOptionIndex === 0 ? 1 : 0
      ];

    expect(diagnosis.reviewEvidence.error?.changedTokenSourceIds).toEqual([
      "na",
    ]);
    for (const target of [
      diagnosis.promptTarget,
      diagnosis.acceptedAnswerTarget,
      distractor,
    ]) {
      expect(target.lexemeIds).toEqual(
        expect.arrayContaining(["adjective-shizuka", "noun-shokudou"]),
      );
    }
    expect(distractor.patternCellIds).not.toContain(
      "na-adjective-attributive",
    );
  });

  it("rejects adjective-less targets labeled as な-attributive", () => {
    const mutated = structuredClone(BASE_COPULA_ADJECTIVES_MODULE);
    const diagnosis = mutated.lessons[3].activityDesigns.find(
      ({ category }) => category === "error-diagnosis",
    )!;
    const target = diagnosis.optionTargets[
      diagnosis.correctOptionIndex === 0 ? 1 : 0
    ] as unknown as {
      patternCellIds: string[];
      tokens: typeof diagnosis.acceptedAnswerTarget.tokens;
      lexemeIds: string[];
      formIds: string[];
    };
    const nounOnly = diagnosis.acceptedAnswerTarget.tokens.filter(
      ({ source }) => source.referenceId !== "adjective-shizuka" &&
        source.referenceId !== "na",
    );
    target.patternCellIds = ["na-adjective-attributive"];
    target.tokens = nounOnly;
    target.lexemeIds = ["noun-shokudou"];
    target.formIds = target.formIds.filter(
      (id) => id !== "base-form-na-adjective-attributive",
    );

    expect(validateBaseCopulaAdjectivesModule(mutated).ok).toBe(false);
  });

  it("fails closed when an authored predicate realization has no known cell", () => {
    const mutated = structuredClone(BASE_COPULA_ADJECTIVES_MODULE);
    const target = mutated.lessons[2].examples[0] as unknown as {
      patternCellIds: string[];
    };
    target.patternCellIds = [];

    expect(validateBaseCopulaAdjectivesModule(mutated).ok).toBe(false);
  });

  it("rejects trailing predicate-form junk after an otherwise canonical cell", () => {
    const mutated = structuredClone(BASE_COPULA_ADJECTIVES_MODULE);
    const target = mutated.lessons[2].examples[0] as unknown as {
      tokens: Array<
        (typeof BASE_COPULA_ADJECTIVES_MODULE.lessons)[number]["examples"][number]["tokens"][number]
      >;
    };
    target.tokens.push(structuredClone(target.tokens.at(-1)!));

    expect(validateBaseCopulaAdjectivesModule(mutated).ok).toBe(false);
  });

  it("uses a one-argument な-adjective instead of contradictory きらい roles", () => {
    const lesson = BASE_COPULA_ADJECTIVES_MODULE.lessons[3];
    expect(lesson.content.newLexemeIds).toContain("adjective-genki");
    expect(lesson.content.newLexemeIds).not.toContain("adjective-kirai");
    expect(
      [
        ...lesson.examples,
        ...lesson.activityDesigns.flatMap((activity) => [
          activity.promptTarget,
          activity.acceptedAnswerTarget,
          ...activity.optionTargets,
        ]),
      ].some(({ lexemeIds }) => lexemeIds.includes("adjective-kirai")),
    ).toBe(false);
  });

  it("gives every hidden copula/adjective answer a complete recoverable proposition", () => {
    const expected = [
      [/Satou.*(?:not.*company employee|company employee.*(?:not|reject))/iu, /Satou.*(?:non.*impiegat|impiegat.*(?:non|escl))/iu],
      [/(?:cook|chef).*(?:not.*engineer|engineering.*past)/iu, /cuoc.*(?:non.*ingegner|ingegner.*passat)/iu],
      [/magazine.*(?:was not good|negative review)/iu, /rivista.*(?:non era buona|giudizio negativo)/iu],
      [/student.*(?:pretty|good-looking).*(?:now|current)/iu, /student.*(?:bell|gradevol).*(?:ora|attual)/iu],
    ] as const;
    BASE_COPULA_ADJECTIVES_MODULE.lessons.forEach((lesson, index) => {
      const spokenIndex = lesson.content.activities.findIndex(
        ({ operation }) => operation === "produce-spoken",
      );
      const activity = lesson.content.activities[spokenIndex];
      const design = lesson.activityDesigns[spokenIndex];
      const en = baseNavigationCopyEn.content[activity.instructionCopyId];
      const it = baseNavigationCopyIt.content[activity.instructionCopyId];
      expect(en).toMatch(expected[index][0]);
      expect(it).toMatch(expected[index][1]);
      expect(en.normalize("NFKC")).not.toContain(japanese(design.acceptedAnswerTarget));
      expect(it.normalize("NFKC")).not.toContain(japanese(design.acceptedAnswerTarget));
    });
  });

  it("grounds lesson 1 activity 7 in an explicit negative company-role fact", () => {
    const lesson = BASE_COPULA_ADJECTIVES_MODULE.lessons[0];
    const activity = lesson.content.activities[6];
    expect(baseNavigationCopyEn.content[activity.instructionCopyId]).toMatch(
      /friend.*(?:not|crosses out).*company employee/iu,
    );
    expect(baseNavigationCopyIt.content[activity.instructionCopyId]).toMatch(
      /amic.*(?:non|barra).*impiegat/iu,
    );
  });

  it("grounds every factual Module 07 choice in authored evidence", () => {
    const groundedFactIds: string[] = [];
    for (const lesson of BASE_COPULA_ADJECTIVES_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        expect(design.worldFactGrounding, design.id).not.toBeNull();
        expect(design.worldFactId, design.id).toMatch(/^fact-/u);
        groundedFactIds.push(design.worldFactId!);
        if (design.correctOptionIndex !== null) {
          expect(
            design.optionFactStatus[design.correctOptionIndex],
            design.id,
          ).toBe("accepted-world");
          expect(
            design.optionFactStatus[design.correctOptionIndex === 0 ? 1 : 0],
            design.id,
          ).toBe("rejected-context");
        }
      }
    }
    expect(BASE_COPULA_ADJECTIVES_MODULE.worldFactIds).toEqual(
      groundedFactIds,
    );
    expect(
      BASE_COPULA_ADJECTIVES_MODULE.worldFactLedger.map(({ id }) => id),
    ).toEqual(groundedFactIds);
  });

  it("rejects a cloned predicative な-adjective with its copula omitted", () => {
    const mutated = structuredClone(BASE_COPULA_ADJECTIVES_MODULE);
    const target = mutated.lessons[3].examples.find(
      ({ predicateLexemeId, patternCellIds }) =>
        predicateLexemeId === "adjective-shizuka" &&
        patternCellIds.includes("na-adjective-affirmative"),
    )! as unknown as {
      tokens: { source: { referenceId: string } }[];
    };
    target.tokens = target.tokens.filter(
      ({ source }) => source.referenceId !== "desu",
    );

    expect(validateBaseCopulaAdjectivesModule(mutated).ok).toBe(false);
  });

  it("describes the authored missing-な defect consistently in both locales", () => {
    const lesson = BASE_COPULA_ADJECTIVES_MODULE.lessons[3];
    const diagnosis = lesson.activityDesigns.find(
      ({ category }) => category === "error-diagnosis",
    )!;
    const defective = japanese(diagnosis.promptTarget);
    const commonErrorId = lesson.content.explanationBlockIds.commonError;

    expect(baseNavigationCopyEn.content[commonErrorId]).toContain(defective);
    expect(baseNavigationCopyIt.content[commonErrorId]).toContain(defective);
  });

  it("keeps activity situations aligned with the displayed adjective referents", () => {
    const iAdjectiveLesson = BASE_COPULA_ADJECTIVES_MODULE.lessons[2];
    const naAdjectiveLesson = BASE_COPULA_ADJECTIVES_MODULE.lessons[3];
    const iRetryId =
      iAdjectiveLesson.content.activities[1].retryFeedbackCopyId;
    const naInstructionId =
      naAdjectiveLesson.content.activities[5].instructionCopyId;

    expect(baseNavigationCopyEn.content[iRetryId]).toMatch(/rice/iu);
    expect(baseNavigationCopyIt.content[iRetryId]).toMatch(/riso/iu);
    expect(baseNavigationCopyEn.content[naInstructionId]).toMatch(
      /cafeteria/iu,
    );
    expect(baseNavigationCopyIt.content[naInstructionId]).toMatch(/mensa/iu);

  });

  it("keeps the health-card situation consistent through feedback in both locales", () => {
    const activity =
      BASE_COPULA_ADJECTIVES_MODULE.lessons[3].content.activities[3];
    for (const copyId of [
      activity.acceptedFeedbackCopyId,
      activity.retryFeedbackCopyId,
    ]) {
      expect(baseNavigationCopyEn.content[copyId]).toMatch(/health card/iu);
      expect(baseNavigationCopyIt.content[copyId]).toMatch(/scheda sanitaria/iu);
    }
  });

  it("keeps the na-adjective nearest contrast aligned across locales", () => {
    const lesson = BASE_COPULA_ADJECTIVES_MODULE.lessons[3];
    const nearestContrastId =
      lesson.content.explanationBlockIds.nearestContrast;

    for (const copy of [baseNavigationCopyEn, baseNavigationCopyIt]) {
      expect(copy.content[nearestContrastId]).toContain("しずかなしょくどう");
    }
  });

  it("translates きれい as appearance rather than elegance", () => {
    const naAdjectiveLesson = BASE_COPULA_ADJECTIVES_MODULE.lessons[3];
    const translationCopy =
      naAdjectiveLesson.examples[7].translationCopy;
    const prettyStudentTranslationId =
      "copyId" in translationCopy
        ? translationCopy.copyId
        : translationCopy.itCopyId;
    expect(
      baseNavigationCopyIt.content[prettyStudentTranslationId],
    ).not.toMatch(/elegante/iu);
  });

  it("does not invent a demonstrative in the umbrella translation", () => {
    const translationCopy =
      BASE_COPULA_ADJECTIVES_MODULE.lessons[2].examples[4].translationCopy;
    const umbrellaEnTranslationId =
      "copyId" in translationCopy
        ? translationCopy.copyId
        : translationCopy.enCopyId;
    const umbrellaItTranslationId =
      "copyId" in translationCopy
        ? translationCopy.copyId
        : translationCopy.itCopyId;
    expect(baseNavigationCopyIt.content[umbrellaItTranslationId]).toBe(
      "L'ombrello è costoso.",
    );
    expect(baseNavigationCopyEn.content[umbrellaEnTranslationId]).toBe(
      "The umbrella is expensive.",
    );
  });
});
