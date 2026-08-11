import { describe, expect, it } from "vitest";
import type { AssembledToken } from "../../../romaji/types";
import {
  BASE_FIRST_TEACH_OWNERS,
  firstTeachLessonPosition,
} from "../catalog/firstTeach";
import {
  BASE_LEXEME_BY_ID,
  BASE_TASK11_LEXEME_RECURRENCE_BY_ID,
  BASE_TASK11_LEXEME_RECURRENCE_PLANS,
} from "../catalog/lexicon";
import { BASE_REFERENCE_SNAPSHOT_BY_ID } from "../catalog/concepts";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import { realizePoliteGrid } from "../forms/verbForms";
import { baseParticleSurfaceTokens } from "../forms/particleLicensing";
import { visibleSurfaceFingerprint } from "../validation/fingerprints";
import {
  activityTargetOperationFingerprintFor,
  semanticFingerprintFor,
} from "../validation/fingerprints";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateFirstTeachOrder } from "../validation/sequenceRules";
import {
  BASE_TIME_MOVEMENT_LESSONS,
  BASE_TIME_MOVEMENT_MODULE,
  BASE_TIME_MOVEMENT_TENSE_CELLS,
  BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
  validateBaseTimeMovementModule,
  validateTask11RecurrencePlans,
} from "./module06TimeMovement";
import { BASE_SENTENCE_FOUNDATIONS_MODULE } from "./module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_MODULE } from "./module03TopicQuestions";
import { BASE_POLITE_VERBS_MODULE } from "./module04PoliteVerbs";
import { validateTask11SemanticReview } from "./module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_MODULE } from "./module05ArgumentParticles";

function jp(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map(({ jp }) => jp).join("");
}

function allTargets() {
  return BASE_TIME_MOVEMENT_MODULE.lessons.flatMap((lesson) => [
    ...lesson.examples,
    ...(lesson.dialogue?.turns ?? []),
    ...lesson.activityDesigns.flatMap(({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
      promptTarget,
      ...optionTargets,
      acceptedAnswerTarget,
    ]),
  ]);
}

describe("Base time-movement module", () => {
  it("publishes the exact order, contracts, and prerequisites", () => {
    expect(
      BASE_TIME_MOVEMENT_LESSONS.map(
        ({ lessonId, contract, prerequisiteLessonIds }) => [
          lessonId,
          contract,
          prerequisiteLessonIds,
        ],
      ),
    ).toEqual([
      ["time-movement-1", "system", ["argument-particles-4"]],
      ["time-movement-2", "system", ["time-movement-1"]],
      ["time-movement-3", "system", ["time-movement-2"]],
      ["time-movement-4", "content", ["time-movement-3"]],
    ]);
  });

  it("meets depth, sequence, density, dialogue, and 8+2 gates", () => {
    for (const lesson of BASE_TIME_MOVEMENT_MODULE.lessons) {
      expect(
        validateBaseLessonDepth(
          lesson.content,
          BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
        ),
        lesson.content.lessonId,
      ).toEqual([]);
      expect(lesson.activityDesigns).toHaveLength(10);
      expect(
        new Set(
          lesson.activityDesigns
            .filter(({ mode }) => mode === "non-spoken")
            .map(({ category }) => category),
        ).size,
      ).toBeGreaterThanOrEqual(6);
    }
    for (const lesson of BASE_TIME_MOVEMENT_MODULE.lessons.slice(0, 3)) {
      expect(lesson.examples.length).toBeGreaterThanOrEqual(10);
      expect(lesson.examples.length).toBeLessThanOrEqual(14);
    }
    expect(BASE_TIME_MOVEMENT_MODULE.lessons[3].examples.length).toBeGreaterThanOrEqual(6);
    expect(BASE_TIME_MOVEMENT_MODULE.lessons[3].dialogue?.turns.length).toBeGreaterThanOrEqual(4);
    expect(
      validateFirstTeachOrder(
        BASE_TIME_MOVEMENT_MODULE.sequence,
        BASE_FIRST_TEACH_OWNERS,
        BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
      ),
    ).toEqual([]);
    expect(validateBaseTimeMovementModule(BASE_TIME_MOVEMENT_MODULE)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("publishes the exact four Task 7 cells in canonical order", () => {
    const grid = realizePoliteGrid("verb-kaku");
    expect(grid.ok).toBe(true);
    if (!grid.ok) return;
    expect(BASE_TIME_MOVEMENT_TENSE_CELLS.map(({ id }) => id)).toEqual([
      "verb-polite-nonpast-affirmative",
      "verb-polite-nonpast-negative",
      "verb-polite-past-affirmative",
      "verb-polite-past-negative",
    ]);
    expect(BASE_TIME_MOVEMENT_TENSE_CELLS.map(({ tokens }) => jp(tokens))).toEqual([
      "かきます",
      "かきません",
      "かきました",
      "かきませんでした",
    ]);
    expect(BASE_TIME_MOVEMENT_TENSE_CELLS.map(({ tokens }) => tokens)).toEqual([
      grid.value.affirmative,
      grid.value.negative,
      grid.value.pastAffirmative,
      grid.value.pastNegative,
    ]);
  });

  it("authors all four はたらく cells as same-verb minimal contrasts", () => {
    const surfaces = BASE_TIME_MOVEMENT_MODULE.lessons[2].examples.map(
      ({ tokens }) => jp(tokens),
    );
    expect(surfaces).toEqual(
      expect.arrayContaining([
        expect.stringContaining("はたらきます"),
        expect.stringContaining("はたらきません"),
        expect.stringContaining("はたらきました"),
        expect.stringContaining("はたらきませんでした"),
      ]),
    );
  });

  it("uses dynamic nonpast only for habitual or future readings", () => {
    for (const target of allTargets()) {
      if (
        target.predicateAspect !== "dynamic" ||
        !target.formIds.includes("masu-nonpast")
      ) {
        continue;
      }
      expect(target.interpretationTags).not.toContain("ongoing-now");
      expect(
        target.interpretationTags.some((tag) => tag === "habitual" || tag === "future"),
        jp(target.tokens),
      ).toBe(true);
    }
    const dynamicExamples = BASE_TIME_MOVEMENT_MODULE.lessons[0].examples;
    expect(dynamicExamples.some(({ interpretationTags }) => interpretationTags.includes("habitual")))
      .toBe(true);
    expect(dynamicExamples.some(({ interpretationTags }) => interpretationTags.includes("future")))
      .toBe(true);
  });

  it("uses real Japanese evidence in at least six TM1 operations", () => {
    const lesson = BASE_TIME_MOVEMENT_MODULE.lessons[0];
    const withoutMetalabel = (target: (typeof lesson.activityDesigns)[number]["optionTargets"][number]) =>
      target.tokens
        .filter(
          ({ source }) =>
            ![
              "analysis-habitual",
              "analysis-routine",
              "analysis-future",
              "japanese-comma",
              "japanese-period",
            ].includes(source.referenceId),
        )
        .map(({ jp }) => jp)
        .join("");
    const genuine = lesson.activityDesigns
      .filter(({ operation }) => operation !== "produce-spoken")
      .filter(
        ({ optionTargets }) =>
          optionTargets.length === 2 &&
          withoutMetalabel(optionTargets[0]) !==
            withoutMetalabel(optionTargets[1]),
      );
    expect(genuine.length).toBeGreaterThanOrEqual(6);
    for (const design of lesson.activityDesigns) {
      expect(
        [
          design.promptTarget,
          ...design.optionTargets,
          design.acceptedAnswerTarget,
        ].some(({ tokens }) =>
          tokens.some(
            ({ source }) => source.referenceId === "analysis-routine",
          ),
        ),
        design.id,
      ).toBe(false);
    }
  });

  it("keeps EN and IT translations aligned to habit/future rather than ongoing-now", () => {
    for (const lesson of BASE_TIME_MOVEMENT_MODULE.lessons) {
      for (const reviewed of lesson.reviewedTranslations) {
        expect(reviewed.en.toLowerCase()).not.toMatch(
          /\b(?:currently|right now|is (?:eating|going|reading|writing|working|studying))\b/u,
        );
        expect(reviewed.it.toLowerCase()).not.toMatch(
          /\b(?:adesso|in questo momento|sta (?:mangiando|andando|leggendo|scrivendo|lavorando|studiando))\b/u,
        );
        if (reviewed.semanticTag === "habitual") {
          expect(reviewed.enSemantic).toBe("habitual");
          expect(reviewed.itSemantic).toBe("habitual");
        }
        if (reviewed.semanticTag === "future") {
          expect(reviewed.enSemantic).toBe("future");
          expect(reviewed.itSemantic).toBe("future");
        }
      }
    }
  });

  it("contrasts specific time ni with relative-time omission", () => {
    const examples = BASE_TIME_MOVEMENT_MODULE.lessons[1].examples;
    expect(
      examples.some(
        ({ patternCellIds, tokens }) =>
          patternCellIds.includes("tm2-specific-time-ni") && jp(tokens).includes("に"),
      ),
    ).toBe(true);
    expect(
      examples.some(
        ({ patternCellIds, tokens }) =>
          patternCellIds.includes("tm2-relative-time-zero") &&
          !jp(tokens).includes("に"),
      ),
    ).toBe(true);
  });

  it("uses kara and made only as explicit time or movement bounds", () => {
    const examples = BASE_TIME_MOVEMENT_MODULE.lessons[1].examples;
    const bounded = examples.filter(({ tokens }) => /から|まで/u.test(jp(tokens)));
    expect(bounded.length).toBeGreaterThanOrEqual(4);
    for (const target of bounded) {
      expect(target.patternCellIds).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^tm2-(?:time|movement)-bounds$/u),
        ]),
      );
      expect(target.particleFrame).toBeDefined();
      expect(Object.values(target.particleFrame?.provided ?? {})).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^(?:source-kara|limit-made)$/u),
        ]),
      );
    }
  });

  it("marks every named-day event with canonical time-ni", () => {
    for (const target of allTargets().filter(
      ({ predicateLexemeId }) => predicateLexemeId !== null,
    )) {
      for (const [index, token] of target.tokens.entries()) {
        if (
          token.source.referenceId !== "noun-getsuyoubi" &&
          token.source.referenceId !== "noun-nichiyoubi"
        ) {
          continue;
        }
        expect(
          target.tokens[index + 1]?.source.referenceId,
          jp(target.tokens),
        ).toBe("time-ni");
      }
    }
  });

  it("authors and validates every Task11 particle binding, including frameless wa and mo", () => {
    const lessons = [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ];
    const particleTargets = lessons.flatMap((lesson) => [
      ...lesson.examples,
      ...(lesson.dialogue?.turns ?? []),
      ...lesson.activityDesigns.flatMap(
        ({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
          promptTarget,
          ...optionTargets,
          acceptedAnswerTarget,
        ],
      ),
    ]).filter(({ tokens }) => tokens.some(({ kind }) => kind === "particle"));
    expect(new Set(particleTargets).size).toBeGreaterThanOrEqual(154);
    for (const target of particleTargets) {
      const bindings = (
        target as typeof target & {
          readonly particleBindings?: readonly {
            readonly role: string;
            readonly particleSense: string;
            readonly attachmentLexemeId: string;
          }[];
        }
      ).particleBindings;
      expect(bindings, jp(target.tokens)).toBeDefined();
      expect(bindings, jp(target.tokens)).toHaveLength(
        target.tokens.filter(({ kind }) => kind === "particle").length,
      );
    }

    const lessonRecord = BASE_TIME_MOVEMENT_MODULE.lessons[2];
    const lesson = lessonRecord.content;
    const design = lessonRecord.activityDesigns[0];
    const original = design.acceptedAnswerTarget;
    const topicIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "topic-wa",
    );
    const nounIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "noun-watashi",
    );
    const timeIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "noun-konshuu",
    );
    const replaceAccepted = (target: typeof original) => {
      const catalogs = {
        ...BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
        acceptedAnswerTargets: new Map([
          ...BASE_TIME_MOVEMENT_VALIDATION_CATALOGS.acceptedAnswerTargets,
          [design.acceptedAnswerTargetId, target],
        ]),
      };
      return validateBaseLessonDepth(lesson, catalogs).map(({ code }) => code);
    };
    const mutations = [
      {
        ...original,
        tokens: original.tokens.filter(
          (_, index) => index !== topicIndex,
        ),
        particleBindings: (original.particleBindings ?? []).filter(
          ({ role }) => role !== "topic",
        ),
        conceptIds: ["topic-wa", "additive-mo"],
      },
      {
        ...original,
        tokens: original.tokens.map((token, index) =>
          index === topicIndex
            ? {
                ...baseParticleSurfaceTokens("additive-mo")[0],
                id: token.id,
              }
            : token,
        ),
        particleBindings: (original.particleBindings ?? []).map((binding) =>
          binding.role === "topic"
            ? { ...binding, particleSense: "additive-mo" as const }
            : binding,
        ),
        conceptIds: ["additive-mo"],
      },
      {
        ...original,
        tokens: [
          ...original.tokens.slice(0, timeIndex + 1),
          {
            ...baseParticleSurfaceTokens("topic-wa")[0],
            id: "adversarial-time-topic",
          },
          ...original.tokens.slice(timeIndex + 1),
        ],
        particleBindings: [
          ...(original.particleBindings ?? []),
          {
            role: "topic" as const,
            particleSense: "topic-wa" as const,
            attachmentLexemeId: "noun-konshuu",
          },
        ],
        conceptIds: ["topic-wa"],
      },
      {
        ...original,
        semanticRoleIds: [...original.semanticRoleIds, "goal" as const],
        conceptIds: ["goal-ni"],
      },
      {
        ...original,
        tokens: original.tokens.filter((_, index) => index !== topicIndex),
        conceptIds: ["topic-wa", "additive-mo"],
      },
      {
        ...original,
        particleBindings: (original.particleBindings ?? []).filter(
          ({ role }) => role !== "topic",
        ),
      },
      {
        ...original,
        tokens: original.tokens.map((token, index) =>
          index === topicIndex
            ? {
                ...baseParticleSurfaceTokens("additive-mo")[0],
                id: token.id,
              }
            : token,
        ),
        conceptIds: ["topic-wa"],
      },
      {
        ...original,
        tokens: [
          ...original.tokens,
          {
            ...baseParticleSurfaceTokens("additive-mo")[0],
            id: "adversarial-extra-additive",
          },
        ],
      },
      {
        ...original,
        tokens: original.tokens.map((token, index) =>
          index === nounIndex
            ? {
                ...token,
                jp: "たなかさん",
                romaji: "tanaka-san",
                source: {
                  ...token.source,
                  referenceId: "noun-tanaka",
                },
              }
            : token,
        ),
      },
      {
        ...original,
        semanticRoleIds: original.semanticRoleIds.filter(
          (role) => role !== "topic",
        ),
        conceptIds: ["topic-wa"],
      },
      {
        ...original,
        semanticRoleIds: [...original.semanticRoleIds, "topic" as const],
      },
    ];
    for (const mutation of mutations) {
      expect(replaceAccepted(mutation), jp(mutation.tokens)).toContain(
        "particle-frame-token-mismatch",
      );
    }
  });

  it("rejects bidirectional role mutations on a generic frameless example", () => {
    const lessonRecord = BASE_TIME_MOVEMENT_MODULE.lessons[0];
    const lesson = lessonRecord.content;
    const original = lessonRecord.examples[0];
    const topicIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "topic-wa",
    );
    const timeIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "noun-fudan",
    );
    const replaceExample = (target: typeof original) => {
      const catalogs = {
        ...BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
        examples: new Map([
          ...BASE_TIME_MOVEMENT_VALIDATION_CATALOGS.examples,
          [original.id, target],
        ]),
      };
      return validateBaseLessonDepth(lesson, catalogs).map(({ code }) => code);
    };
    const mutations = [
      {
        ...original,
        tokens: original.tokens.filter((_, index) => index !== topicIndex),
        particleBindings: (original.particleBindings ?? []).filter(
          ({ role }) => role !== "topic",
        ),
        conceptIds: ["topic-wa", "additive-mo"],
      },
      {
        ...original,
        tokens: original.tokens.map((token, index) =>
          index === topicIndex
            ? {
                ...baseParticleSurfaceTokens("additive-mo")[0],
                id: token.id,
              }
            : token,
        ),
        particleBindings: (original.particleBindings ?? []).map((binding) =>
          binding.role === "topic"
            ? { ...binding, particleSense: "additive-mo" as const }
            : binding,
        ),
        conceptIds: ["additive-mo"],
      },
      {
        ...original,
        tokens: [
          ...original.tokens.slice(0, timeIndex + 1),
          {
            ...baseParticleSurfaceTokens("topic-wa")[0],
            id: "adversarial-extra-time-topic",
          },
          ...original.tokens.slice(timeIndex + 1),
        ],
        particleBindings: [
          ...(original.particleBindings ?? []),
          {
            role: "topic" as const,
            particleSense: "topic-wa" as const,
            attachmentLexemeId: "noun-fudan",
          },
        ],
      },
      {
        ...original,
        semanticRoleIds: [...original.semanticRoleIds, "goal" as const],
        conceptIds: ["goal-ni"],
      },
      {
        ...original,
        semanticRoleIds: original.semanticRoleIds.filter(
          (role) => role !== "topic",
        ),
      },
      {
        ...original,
        particleBindings: (original.particleBindings ?? []).map((binding) =>
          binding.role === "topic"
            ? { ...binding, attachmentLexemeId: "noun-fudan" }
            : binding,
        ),
        conceptIds: ["topic-wa"],
      },
    ];
    for (const mutation of mutations) {
      expect(replaceExample(mutation), jp(mutation.tokens)).toContain(
        "particle-frame-token-mismatch",
      );
    }
  });

  it("catalogs time nouns by grammatical time behavior", () => {
    const expected = new Map([
      ["noun-ashita", "relative"],
      ["noun-maishuu", "recurring"],
      ["noun-shichiji", "specific"],
      ["noun-konshuu", "relative"],
      ["noun-yoru", "specific"],
    ]);
    for (const [lexemeId, timeSemantics] of expected) {
      const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
      expect(
        lexeme?.category === "noun" ? lexeme.timeSemantics : undefined,
        lexemeId,
      ).toBe(timeSemantics);
    }
  });

  it("rejects a particleless event time whose semantic role is removed", () => {
    const lessonRecord = BASE_TIME_MOVEMENT_MODULE.lessons[0];
    const lesson = lessonRecord.content;
    const original = lessonRecord.examples[4];
    expect(original.semanticRoleIds).toContain("time");
    const mutated = {
      ...original,
      semanticRoleIds: original.semanticRoleIds.filter((role) => role !== "time"),
    };
    const catalogs = {
      ...BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
      examples: new Map([
        ...BASE_TIME_MOVEMENT_VALIDATION_CATALOGS.examples,
        [original.id, mutated],
      ]),
    };
    expect(
      validateBaseLessonDepth(lesson, catalogs).map(({ code }) => code),
    ).toContain("particle-frame-token-mismatch");
  });

  it("grounds TM4 recurring study and makes the spoken cue recoverable", () => {
    const lesson = BASE_TIME_MOVEMENT_MODULE.lessons[3];
    const a5 = lesson.activityDesigns[4];
    expect(a5.acceptedAnswerTarget.lexemeIds).toContain("noun-maishuu");
    expect(a5.acceptedAnswerTarget.predicateLexemeId).toBe(
      "verb-benkyou-suru",
    );
    const a10 = lesson.activityDesigns[9];
    expect(a10.promptTarget.lexemeIds).toContain("noun-suzuki");
    expect(a10.promptTarget.lexemeIds).toContain("noun-konban");
  });

  it("detects ambiguous time-to-verb kana boundaries generically", () => {
    const lessons = [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ];
    expect(
      validateTask11SemanticReview(lessons).filter(
        ({ code }) => code === "kana-boundary-ambiguous",
      ),
    ).toEqual([]);

    const mutated = structuredClone(BASE_TIME_MOVEMENT_MODULE.lessons[0]);
    const example = mutated.examples[0] as unknown as {
      tokens: AssembledToken[];
      lexemeIds: string[];
      semanticRoleIds: string[];
      particleBindings: {
        role: string;
        particleSense: string;
        attachmentLexemeId: string;
      }[];
    };
    example.tokens = example.tokens.filter(
      ({ source }) =>
        source.referenceId !== "noun-tanaka" &&
        source.referenceId !== "topic-wa",
    );
    example.lexemeIds = example.lexemeIds.filter(
      (lexemeId) => lexemeId !== "noun-tanaka",
    );
    example.semanticRoleIds = example.semanticRoleIds.filter(
      (role) => role !== "topic",
    );
    example.particleBindings = [];
    expect(validateTask11SemanticReview([mutated])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "kana-boundary-ambiguous" }),
      ]),
    );

    const particleMediated = structuredClone(mutated);
    const particleExample = particleMediated.examples[0] as unknown as {
      tokens: AssembledToken[];
    };
    particleExample.tokens.splice(1, 0, {
      ...baseParticleSurfaceTokens("time-ni")[0],
      id: "adversarial-time-ni",
    });
    expect(validateTask11SemanticReview([particleMediated])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "kana-boundary-ambiguous" }),
      ]),
    );

    const withVerbOnset = (
      lemmaId: string,
      kana: string,
      romaji: string,
    ) => {
      const lesson = structuredClone(mutated);
      const target = lesson.examples[0] as unknown as {
        tokens: AssembledToken[];
        lexemeIds: string[];
        predicateLexemeId: string;
        predicateSenseId: string;
      };
      const verbIndex = target.tokens.findIndex(
        ({ source }) => source.referenceId === "verb-hashiru",
      );
      target.tokens[verbIndex] = {
        ...target.tokens[verbIndex],
        jp: kana,
        romaji,
        source: { domain: "catalog", referenceId: lemmaId },
      };
      target.lexemeIds = target.lexemeIds.map((lexemeId) =>
        lexemeId === "verb-hashiru" ? lemmaId : lexemeId,
      );
      target.predicateLexemeId = lemmaId;
      target.predicateSenseId = lemmaId.slice("verb-".length);
      return lesson;
    };
    for (const probe of [
      withVerbOnset("verb-dekakeru", "でかけ", "dekake"),
      withVerbOnset("verb-motte-kuru", "もってき", "motte ki"),
    ]) {
      expect(validateTask11SemanticReview([probe])).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "kana-boundary-ambiguous" }),
        ]),
      );
    }

    const explicitTopic = structuredClone(mutated);
    const explicitTarget = explicitTopic.examples[0] as unknown as {
      tokens: AssembledToken[];
    };
    explicitTarget.tokens.splice(1, 0, {
      ...baseParticleSurfaceTokens("topic-wa")[0],
      id: "adversarial-time-topic",
    });
    expect(validateTask11SemanticReview([explicitTopic])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "kana-boundary-ambiguous" }),
      ]),
    );
  });

  it("separates the TM1 correction whose verb begins like a particle", () => {
    const diagnosis = BASE_TIME_MOVEMENT_MODULE.lessons[0].activityDesigns[5];
    expect(jp(diagnosis.optionTargets[0].tokens)).toContain(
      "まいしゅう、でかけます",
    );
  });

  it("declares a detectable time-interpretation error for TM1 diagnosis", () => {
    const design = BASE_TIME_MOVEMENT_MODULE.lessons[0].activityDesigns[5] as
      typeof BASE_TIME_MOVEMENT_MODULE.lessons[0]["activityDesigns"][number] & {
        readonly reviewEvidence?: {
          readonly error: {
            readonly code: string;
            readonly defectAxis: string;
            readonly changedTokenSourceIds: readonly string[];
          } | null;
        };
      };
    expect(design.reviewEvidence?.error).toMatchObject({
      code: "dynamic-nonpast-interpretation-mismatch",
      defectAxis: "interpretation",
      changedTokenSourceIds: [
        "noun-maishuu",
        "noun-ashita",
        "interpretation-tag",
      ],
    });
    expect(design.promptTarget.predicateLexemeId).toBe(
      design.acceptedAnswerTarget.predicateLexemeId,
    );
    const promptSources = design.promptTarget.tokens.map(
      ({ source }) => source.referenceId,
    );
    const answerSources = design.acceptedAnswerTarget.tokens.map(
      ({ source }) => source.referenceId,
    );
    const promptChangedIndex = promptSources.findIndex((source) =>
      design.reviewEvidence?.error?.changedTokenSourceIds.includes(source),
    );
    const answerChangedIndex = answerSources.findIndex((source) =>
      design.reviewEvidence?.error?.changedTokenSourceIds.includes(source),
    );
    expect(promptChangedIndex).toBe(answerChangedIndex);
  });

  it("rejects an unrelated extra edit for every declared diagnosis code", () => {
    for (const sourceLesson of [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ]) {
      for (const [designIndex, sourceDesign] of sourceLesson.activityDesigns.entries()) {
        if (sourceDesign.operation !== "diagnose-error") continue;
        const lesson = structuredClone(sourceLesson);
        const design = lesson.activityDesigns[designIndex];
        const answer = design.acceptedAnswerTarget as unknown as {
          tokens: AssembledToken[];
        };
        answer.tokens = [
          ...answer.tokens,
          {
            id: `${design.id}-adversarial-unrelated-edit`,
            jp: "そう",
            romaji: "sou",
            kind: "lexical",
            boundaryBefore: "attach",
            source: {
              domain: "catalog",
              referenceId: "expression-sou",
            },
          },
        ];
        const error = design.reviewEvidence.error as unknown as {
          changedTokenSourceIds: string[];
        };
        error.changedTokenSourceIds = [
          ...error.changedTokenSourceIds,
          "expression-sou",
        ];
        expect(
          validateTask11SemanticReview([lesson]).some(
            ({ code, activityId }) =>
              code === "error-delta-invalid" && activityId === design.id,
          ),
          design.id,
        ).toBe(true);
      }
    }
  });

  it("rejects positional edits even when error source multisets stay valid", () => {
    const lesson = structuredClone(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[3],
    );
    const design = lesson.activityDesigns[5];
    const answer = design.acceptedAnswerTarget as unknown as {
      tokens: AssembledToken[];
    };
    const mariIndex = answer.tokens.findIndex(
      ({ source }) => source.referenceId === "noun-mari",
    );
    const pencilIndex = answer.tokens.findIndex(
      ({ source }) => source.referenceId === "noun-enpitsu",
    );
    [answer.tokens[mariIndex], answer.tokens[pencilIndex]] = [
      answer.tokens[pencilIndex],
      answer.tokens[mariIndex],
    ];
    expect(validateTask11SemanticReview([lesson])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "error-delta-invalid",
          activityId: design.id,
        }),
      ]),
    );
  });

  it("uses full grammatical polarity competitors for TM4 diagnosis", () => {
    const design = BASE_TIME_MOVEMENT_MODULE.lessons[3].activityDesigns[5];
    expect(design.optionTargets).toHaveLength(2);
    expect(
      design.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
    ).toEqual(["verb-suru", "verb-suru"]);
    for (const option of design.optionTargets) {
      expect(jp(option.tokens)).not.toContain("、");
      expect(
        option.formIds.includes("masu-nonpast") ||
          option.formIds.includes("four-polite-tense-cells"),
        jp(option.tokens),
      ).toBe(true);
    }
    expect(
      design.optionTargets.some(
        ({ tokens }) => jp(tokens) === jp(design.promptTarget.tokens),
      ),
    ).toBe(true);
  });

  it("contains no te forms, teimasu, adjectives, or later concepts on any surface", () => {
    const forbidden = new Set([
      "te-allomorphy",
      "te-kudasai",
      "sequential-te",
      "te-imasu",
      "negative-noun-predicate-copula",
      "remaining-copula-cells",
      "i-adjective-tense-polarity",
      "na-adjective-predicate-and-attributive",
      "explanatory-no",
    ]);
    for (const target of allTargets()) {
      expect(jp(target.tokens)).not.toContain("ています");
      expect(target.predicateAspect).not.toBe("adjectival");
      expect(
        [...target.conceptIds, ...target.formIds].some((id) => forbidden.has(id)),
        jp(target.tokens),
      ).toBe(false);
    }
  });

  it("advances the exact four reference snapshots without future rows", () => {
    expect(
      BASE_TIME_MOVEMENT_MODULE.lessons.map(
        ({ content }) => content.referenceSnapshotIds,
      ),
    ).toEqual([
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation", "tense-polarity"],
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation", "tense-polarity"],
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation", "tense-polarity"],
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation", "tense-polarity"],
    ]);
    for (const lesson of [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ]) {
      for (const snapshotId of lesson.content.referenceSnapshotIds) {
        const copyId =
          BASE_REFERENCE_SNAPSHOT_BY_ID.get(snapshotId)?.titleCopyId ?? "";
        expect(baseNavigationCopyEn.content[copyId], `EN:${copyId}`).toBeTypeOf(
          "string",
        );
        expect(baseNavigationCopyIt.content[copyId], `IT:${copyId}`).toBeTypeOf(
          "string",
        );
        expect(baseNavigationCopyEn.content[copyId]).not.toBe(
          baseNavigationCopyIt.content[copyId],
        );
      }
    }
  });

  it("registers a genuinely later recurrence for every new Task 11 lexeme", () => {
    const newLexemeIds = [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ].flatMap(({ content }) => content.newLexemeIds);
    expect(new Set(newLexemeIds).size).toBe(newLexemeIds.length);
    expect(
      BASE_TASK11_LEXEME_RECURRENCE_PLANS.map(({ lexemeId }) => lexemeId).sort(),
    ).toEqual([...newLexemeIds].sort());
    for (const lexemeId of newLexemeIds) {
      const lexeme = BASE_LEXEME_BY_ID.get(lexemeId)!;
      const plan = BASE_TASK11_LEXEME_RECURRENCE_BY_ID.get(lexemeId)! as
        | (typeof BASE_TASK11_LEXEME_RECURRENCE_PLANS)[number]
        | undefined;
      expect(plan, lexemeId).toBeDefined();
      if (!plan) continue;
      expect(
        plan.plannedLessonIds.length +
          (plan.plannedSynthesisLessonIds?.length ?? 0),
        lexemeId,
      ).toBeGreaterThan(0);
      for (const lessonId of plan.plannedLessonIds) {
        expect(firstTeachLessonPosition(lessonId), lessonId).toBeGreaterThan(
          firstTeachLessonPosition(lexeme.firstTeachLessonId)!,
        );
        const authoredLesson = [
          ...BASE_POLITE_VERBS_MODULE.lessons,
          ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
          ...BASE_TIME_MOVEMENT_MODULE.lessons,
        ].find(({ content }) => content.lessonId === lessonId);
        if (authoredLesson) {
          expect(
            [
              ...authoredLesson.examples,
              ...(authoredLesson.dialogue?.turns ?? []),
              ...authoredLesson.activityDesigns.flatMap(
                ({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
                  promptTarget,
                  ...optionTargets,
                  acceptedAnswerTarget,
                ],
              ),
            ].some(({ lexemeIds }) => lexemeIds.includes(lexemeId)),
            `${lexemeId}:${lessonId}`,
          ).toBe(true);
        } else {
          throw new Error(`Non-authored recurrence: ${lexemeId}:${lessonId}`);
        }
      }
      for (const lessonId of plan.plannedSynthesisLessonIds ?? []) {
        expect(lessonId).toMatch(/^base-synthesis-/u);
        expect(firstTeachLessonPosition(lessonId), lessonId).toBeGreaterThan(
          firstTeachLessonPosition(lexeme.firstTeachLessonId)!,
        );
      }
    }
    expect(BASE_LEXEME_BY_ID.size).toBeLessThanOrEqual(250);
    expect(Object.isFrozen(BASE_TASK11_LEXEME_RECURRENCE_PLANS)).toBe(true);
    expect("clear" in BASE_TASK11_LEXEME_RECURRENCE_BY_ID).toBe(false);
    const forged = BASE_TASK11_LEXEME_RECURRENCE_PLANS.map((plan, index) =>
      index === 0
        ? {
            ...plan,
            plannedLessonIds: ["time-movement-4"],
            plannedSynthesisLessonIds: [],
          }
        : plan,
    );
    expect(
      validateTask11RecurrencePlans(
        [
          ...BASE_POLITE_VERBS_MODULE.lessons,
          ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
          ...BASE_TIME_MOVEMENT_MODULE.lessons,
        ],
        forged,
      ),
    ).toEqual([
      expect.stringMatching(/^recurrence-plan-unrealized:/u),
    ]);
  });

  it("publishes complete localized copy and a grounded schedule dialogue", () => {
    const practical = BASE_TIME_MOVEMENT_MODULE.lessons[3];
    expect(practical.dialogue?.turns.map(({ speakerId }) => speakerId)).toEqual(
      expect.arrayContaining(["learner", "partner"]),
    );
    for (const lesson of BASE_TIME_MOVEMENT_MODULE.lessons) {
      const ids = [
        lesson.titleCopyId,
        lesson.objectiveCopyId,
        lesson.content.recapCopyId,
        ...Object.values(lesson.explanation),
        ...lesson.examples.flatMap((example) => [
          example.teachingPurposeCopyId,
          "copyId" in example.translationCopy ? example.translationCopy.copyId : "",
        ]),
        ...lesson.activityDesigns.map(({ promptContextCopyId }) => promptContextCopyId),
        ...lesson.content.activities.flatMap((activity) => [
          activity.instructionCopyId,
          activity.acceptedFeedbackCopyId,
          activity.retryFeedbackCopyId,
        ]),
        ...(lesson.dialogue
          ? [
              lesson.dialogue.practicalOutcomeCopyId,
              ...lesson.dialogue.turnCopy.flatMap(({ purposeCopyId, translationCopyId }) => [
                purposeCopyId,
                translationCopyId,
              ]),
            ]
          : []),
      ];
      for (const id of ids) {
        expect(baseNavigationCopyEn.content[id], `EN:${id}`).toBeTypeOf("string");
        expect(baseNavigationCopyIt.content[id], `IT:${id}`).toBeTypeOf("string");
      }
    }
    for (const lesson of [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ]) {
      for (const translation of lesson.reviewedTranslations) {
        expect(baseNavigationCopyEn.content[translation.copyId]).toBe(
          translation.en,
        );
        expect(baseNavigationCopyIt.content[translation.copyId]).toBe(
          translation.it,
        );
      }
    }
  });

  it("keeps pre-attempt EN and IT instructions free of accepted answers", () => {
    const task11Lessons = [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ];
    const classTerms = {
      en: [
        ["godan-verb-class", "godan"],
        ["ichidan-verb-class", "ichidan"],
        ["suru-verb-class", "suru"],
        ["kuru-verb-class", "kuru"],
      ],
      it: [
        ["godan-verb-class", "godan"],
        ["ichidan-verb-class", "ichidan"],
        ["suru-verb-class", "suru"],
        ["kuru-verb-class", "kuru"],
      ],
    } as const;
    const cellTerms = {
      en: new Map([
        ["verb-polite-nonpast-affirmative", "nonpast affirmative"],
        ["verb-polite-nonpast-negative", "nonpast negative"],
        ["verb-polite-past-affirmative", "past affirmative"],
        ["verb-polite-past-negative", "past negative"],
      ]),
      it: new Map([
        ["verb-polite-nonpast-affirmative", "non-passato affermativo"],
        ["verb-polite-nonpast-negative", "non-passato negativo"],
        ["verb-polite-past-affirmative", "passato affermativo"],
        ["verb-polite-past-negative", "passato negativo"],
      ]),
    };
    const leaks: string[] = [];
    for (const lesson of task11Lessons) {
      for (const [index, design] of lesson.activityDesigns.entries()) {
        const activity = lesson.content.activities[index];
        for (const locale of ["en", "it"] as const) {
          const copy =
            (locale === "en" ? baseNavigationCopyEn : baseNavigationCopyIt)
              .content[activity.instructionCopyId]
              ?.toLowerCase() ?? "";
          const forbidden = new Set<string>([
            jp(design.acceptedAnswerTarget.tokens).toLowerCase(),
            ...design.acceptedAnswerTarget.lexemeIds.flatMap((id) => {
              const lexeme = BASE_LEXEME_BY_ID.get(id);
              return lexeme ? [lexeme.kana.toLowerCase()] : [];
            }),
            ...design.acceptedAnswerTarget.tokens.flatMap((token) =>
              token.kind === "particle" ? [token.jp] : [],
            ),
            ...classTerms[locale].flatMap(([conceptId, term]) =>
              design.acceptedAnswerTarget.conceptIds.includes(conceptId)
                ? [term]
                : [],
            ),
            cellTerms[locale].get(design.patternCellId) ?? "",
          ]);
          for (const value of forbidden) {
            if (value.length > 0 && copy.includes(value)) {
              leaks.push(`${locale}:${activity.id}:${value}`);
            }
          }
        }
      }
    }
    expect(leaks).toEqual([]);
  });

  it("rejects paraphrased analysis and hyphenated cell labels before an attempt", () => {
    const lesson = structuredClone(BASE_TIME_MOVEMENT_MODULE.lessons[2]);
    const design = lesson.activityDesigns[7];
    const instructionCopyId =
      lesson.content.activities[7].instructionCopyId;
    const en = {
      ...baseNavigationCopyEn.content,
      [instructionCopyId]:
        "Choose the past-negative cell for the crossed-out event.",
    };
    const it = {
      ...baseNavigationCopyIt.content,
      [instructionCopyId]:
        "Scegli la cella passato-negativa per l'evento barrato.",
    };
    expect(
      validateTask11SemanticReview([lesson], en, it),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "instruction-answer-leakage",
          activityId: design.id,
        }),
      ]),
    );

    const integrated = structuredClone(
      BASE_TIME_MOVEMENT_MODULE.lessons[3],
    );
    const integratedDesign = integrated.activityDesigns[0];
    const integratedCopyId =
      integrated.content.activities[0].instructionCopyId;
    expect(
      validateTask11SemanticReview(
        [integrated],
        {
          ...baseNavigationCopyEn.content,
          [integratedCopyId]: "Choose the past-affirmative cell.",
        },
        baseNavigationCopyIt.content,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "instruction-answer-leakage",
          activityId: integratedDesign.id,
        }),
      ]),
    );

    const mixed = structuredClone(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[3],
    );
    const mixedDesign = mixed.activityDesigns[4];
    const mixedCopyId = mixed.content.activities[4].instructionCopyId;
    expect(
      validateTask11SemanticReview(
        [mixed],
        {
          ...baseNavigationCopyEn.content,
          [mixedCopyId]: "Choose the direction analysis.",
        },
        baseNavigationCopyIt.content,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "instruction-answer-leakage",
          activityId: mixedDesign.id,
        }),
      ]),
    );
  });

  it("uses situational instructions instead of naming the answer analysis", () => {
    const forbidden = {
      en: /(?:past-negative|past negative|unnegated event|completed time and negative polarity|time and polarity|without obligatory|special-class analysis|endpoint|the setting|instrument)/iu,
      it: /(?:passato-negativ|evento non negato|tempo concluso e polarità negativa|tempo e polarità|senza .*obbligatori|analisi della classe speciale|punto d.arrivo|l.ambiente|lo strumento)/iu,
    };
    for (const lesson of [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ]) {
      for (const activity of lesson.content.activities) {
        expect(
          baseNavigationCopyEn.content[activity.instructionCopyId],
          `EN:${activity.id}`,
        ).not.toMatch(forbidden.en);
        expect(
          baseNavigationCopyIt.content[activity.instructionCopyId],
          `IT:${activity.id}`,
        ).not.toMatch(forbidden.it);
      }
    }
  });

  it("keeps ordering instructions neutral and rejects role vocabulary", () => {
    const ids = [
      "argument-particles-1-activity-3-instruction",
      "time-movement-2-activity-3-instruction",
      "time-movement-4-activity-3-instruction",
    ];
    for (const id of ids) {
      expect(baseNavigationCopyEn.content[id], `EN:${id}`).not.toMatch(
        /\b(?:theme|predicate)\b/iu,
      );
      expect(baseNavigationCopyIt.content[id], `IT:${id}`).not.toMatch(
        /\b(?:tema|predicato)\b/iu,
      );
    }

    const lesson = structuredClone(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[0],
    );
    const design = lesson.activityDesigns[2];
    const copyId = lesson.content.activities[2].instructionCopyId;
    expect(
      validateTask11SemanticReview(
        [lesson],
        {
          ...baseNavigationCopyEn.content,
          [copyId]:
            "Order Yamada, the letter theme, and the final predicate.",
        },
        baseNavigationCopyIt.content,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "instruction-answer-leakage",
          activityId: design.id,
        }),
      ]),
    );
  });

  it("keeps every instruction and retry free of role-answer terminology", () => {
    const forbidden = {
      en: /\b(?:theme|predicate|role|analysis label)\b/iu,
      it: /\b(?:tema|predicato|ruolo|etichetta di analisi)\b/iu,
    };
    for (const lesson of [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ]) {
      for (const activity of lesson.content.activities) {
        for (const [locale, copy, pattern] of [
          ["EN", baseNavigationCopyEn.content, forbidden.en],
          ["IT", baseNavigationCopyIt.content, forbidden.it],
        ] as const) {
          expect(
            copy[activity.instructionCopyId],
            `${locale}:${activity.id}:instruction`,
          ).not.toMatch(pattern);
          expect(
            copy[activity.retryFeedbackCopyId],
            `${locale}:${activity.id}:retry`,
          ).not.toMatch(pattern);
        }
      }
    }

    const lesson = structuredClone(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[0],
    );
    const design = lesson.activityDesigns[0];
    const retryCopyId = lesson.content.activities[0].retryFeedbackCopyId;
    expect(
      validateTask11SemanticReview(
        [lesson],
        {
          ...baseNavigationCopyEn.content,
          [retryCopyId]: "Use the licensed theme role.",
        },
        baseNavigationCopyIt.content,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "instruction-answer-leakage",
          activityId: design.id,
        }),
      ]),
    );
  });

  it("rejects answer-bearing retry copy across every decisive axis", () => {
    const scenarios = [
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[1],
        index: 0,
        locale: "en",
        retry: "Choose godan.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[0],
        index: 1,
        locale: "it",
        retry: "Usa l'analisi del lemma.",
      },
      {
        lesson: BASE_ARGUMENT_PARTICLES_MODULE.lessons[1],
        index: 1,
        locale: "en",
        retry: "Use へ rather than に.",
      },
      {
        lesson: BASE_ARGUMENT_PARTICLES_MODULE.lessons[1],
        index: 8,
        locale: "en",
        retry: "Listen for に after home.",
      },
      {
        lesson: BASE_ARGUMENT_PARTICLES_MODULE.lessons[1],
        index: 9,
        locale: "it",
        retry: "Pronuncia へ come e.",
      },
      {
        lesson: BASE_ARGUMENT_PARTICLES_MODULE.lessons[1],
        index: 0,
        locale: "it",
        retry: "Scegli la meta.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[1],
        index: 5,
        locale: "it",
        retry: "Usa il rapporto origine-limite.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[2],
        index: 0,
        locale: "it",
        retry: "Scegli il non-passato affermativo.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[2],
        index: 3,
        locale: "en",
        retry: "Build ました.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[0],
        index: 1,
        locale: "en",
        retry: "Follow tomorrow.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[0],
        index: 1,
        locale: "it",
        retry: "Segui domani.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[2],
        index: 2,
        locale: "en",
        retry: "Keep the stem final.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[2],
        index: 2,
        locale: "it",
        retry: "Metti la base alla fine.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[0],
        index: 5,
        locale: "en",
        retry: "Replace the phrase without moving it.",
      },
    ] as const;

    for (const { lesson, index, locale, retry } of scenarios) {
      const activity = lesson.content.activities[index];
      const retryCopyId = activity.retryFeedbackCopyId;
      const en = {
        ...baseNavigationCopyEn.content,
        ...(locale === "en" ? { [retryCopyId]: retry } : {}),
      };
      const it = {
        ...baseNavigationCopyIt.content,
        ...(locale === "it" ? { [retryCopyId]: retry } : {}),
      };
      expect(
        validateTask11SemanticReview([lesson], en, it),
        `${locale}:${activity.id}:${retry}`,
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "instruction-answer-leakage",
            activityId: activity.id,
          }),
        ]),
      );
    }
  });

  it("keeps all twelve listening activities neutral and audio-required", () => {
    const lessons = [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ];
    const listening = lessons.flatMap((lesson) =>
      lesson.activityDesigns
        .map((design, index) => ({
          design,
          definition: lesson.content.activities[index],
        }))
        .filter(({ design }) => design.operation === "identify-audio"),
    );
    expect(listening).toHaveLength(12);
    const listeningIds = new Set(
      listening.map(({ design }) => design.id),
    );
    expect(
      validateTask11SemanticReview(lessons).filter(
        ({ code, activityId }) =>
          (code === "instruction-answer-leakage" ||
            code === "listening-terms-missing") &&
          listeningIds.has(activityId),
      ),
    ).toEqual([]);
    for (const { design, definition } of listening) {
      expect(design.contextTarget.audioRequired, design.id).toBe(true);
      expect(design.audioContract, design.id).toMatchObject({
        kind: "semantic-synthesis",
        promptVisible: false,
      });
      expect(design.audioTargetId, design.id).not.toBeNull();
      expect(
        baseNavigationCopyEn.content[definition.instructionCopyId],
        `EN:${design.id}`,
      ).toMatch(/\blisten\b/iu);
      expect(
        baseNavigationCopyIt.content[definition.instructionCopyId],
        `IT:${design.id}`,
      ).toMatch(/\bascolta\b/iu);
    }
  });

  it("keeps every visible listening cue shared by both options or neither", () => {
    const lessons = [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ];
    for (const lesson of lessons) {
      const design = lesson.activityDesigns.find(
        ({ operation }) => operation === "identify-audio",
      )!;
      expect(design.contextTarget.revealsAnswer, design.id).toBe(false);
      for (const token of design.promptTarget.tokens.filter(
        ({ kind }) => kind !== "punctuation",
      )) {
        const occurrence = design.optionTargets.map((option) =>
          option.tokens.some(
            ({ source }) =>
              source.referenceId === token.source.referenceId,
          ),
        );
        expect(occurrence[0], `${design.id}:${token.jp}`).toBe(occurrence[1]);
      }
      const promptSurface = jp(design.promptTarget.tokens).replace(/[、。\s]/gu, "");
      if (promptSurface.length > 1) {
        const occurrence = design.optionTargets.map(({ tokens }) =>
          jp(tokens).replace(/[、。\s]/gu, "").includes(promptSurface),
        );
        expect(occurrence[0], `${design.id}:${promptSurface}`).toBe(
          occurrence[1],
        );
      }
    }
  });

  it("rejects an accepted-only token forged into a listening cue", () => {
    const lesson = structuredClone(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[0],
    );
    const design = lesson.activityDesigns[8];
    const acceptedOnly = design.acceptedAnswerTarget.tokens.find(
      ({ source }) => source.referenceId === "object-o",
    )!;
    (
      design.promptTarget as unknown as {
        tokens: AssembledToken[];
      }
    ).tokens = [{ ...acceptedOnly, id: "adversarial-listening-cue" }];
    expect(validateTask11SemanticReview([lesson])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "listening-cue-decisive",
          activityId: design.id,
        }),
      ]),
    );

    const metadataOnly = structuredClone(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[0],
    );
    (
      metadataOnly.activityDesigns[8].contextTarget as unknown as {
        revealsAnswer: boolean;
      }
    ).revealsAnswer = true;
    expect(validateTask11SemanticReview([metadataOnly])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "listening-cue-decisive",
          activityId: metadataOnly.activityDesigns[8].id,
        }),
      ]),
    );
  });

  it("rejects accepted-side listening synonyms in both locales", () => {
    const scenarios = [
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[2],
        locale: "en",
        instruction:
          "Listen to the viewing-stem card and choose its written match.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[2],
        locale: "it",
        instruction:
          "Ascolta la scheda della base pre-ます e scegli la forma scritta.",
      },
      {
        lesson: BASE_ARGUMENT_PARTICLES_MODULE.lessons[1],
        locale: "en",
        instruction:
          "Listen for the trip whose final stop is home and choose its match.",
      },
      {
        lesson: BASE_ARGUMENT_PARTICLES_MODULE.lessons[1],
        locale: "it",
        instruction:
          "Ascolta il viaggio con fermata finale a casa e scegli la forma.",
      },
      {
        lesson: BASE_ARGUMENT_PARTICLES_MODULE.lessons[3],
        locale: "en",
        instruction:
          "Listen to the route toward the park and choose its match.",
      },
      {
        lesson: BASE_ARGUMENT_PARTICLES_MODULE.lessons[3],
        locale: "it",
        instruction:
          "Ascolta il percorso verso il parco e scegli la forma scritta.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[1],
        locale: "en",
        instruction: "Listen to the tomorrow plan and choose its match.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[1],
        locale: "it",
        instruction: "Ascolta il piano di domani e scegli la forma scritta.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[2],
        locale: "en",
        instruction:
          "Listen to the yesterday-writing sentence and choose its match.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[2],
        locale: "it",
        instruction:
          "Ascolta la frase sulla scrittura di ieri e scegli la forma.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[3],
        locale: "en",
        instruction:
          "Listen to the scheduled train trip and choose its written match.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[3],
        locale: "it",
        instruction:
          "Ascolta il viaggio in treno programmato e scegli la forma scritta.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[0],
        locale: "en",
        instruction: "Listen for the headword.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[0],
        locale: "en",
        instruction: "Listen for the entry title.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[0],
        locale: "en",
        instruction: "Listen for the dictionary entry.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[0],
        locale: "it",
        instruction: "Ascolta la voce di dizionario.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[0],
        locale: "it",
        instruction: "Ascolta la parola d'azione.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[2],
        locale: "en",
        instruction: "Listen for the past form.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[2],
        locale: "en",
        instruction: "Listen for the past-tense form.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[2],
        locale: "it",
        instruction: "Ascolta la forma al passato.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[2],
        locale: "it",
        instruction: "Ascolta la frase completata.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[3],
        locale: "it",
        instruction: "Ascolta la forma affermativa.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[3],
        locale: "it",
        instruction: "Ascolta la forma non negativa.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[0],
        locale: "en",
        instruction: "Listen for the recurring plan.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[0],
        locale: "en",
        instruction: "Listen for the routine.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[0],
        locale: "en",
        instruction: "Listen for the one-off plan.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[0],
        locale: "it",
        instruction: "Ascolta la lettura ricorrente.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[0],
        locale: "it",
        instruction: "Ascolta la lettura abituale.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[1],
        locale: "it",
        instruction: "Ascolta la classe.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[2],
        locale: "it",
        instruction: "Ascolta la radice.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[2],
        locale: "en",
        instruction: "Listen for the stems.",
      },
      {
        lesson: BASE_POLITE_VERBS_MODULE.lessons[2],
        locale: "en",
        instruction: "Listen for the pre‑masu form.",
      },
      {
        lesson: BASE_TIME_MOVEMENT_MODULE.lessons[1],
        locale: "it",
        instruction: "Ascolta la forma programmata per il giorno dopo.",
      },
    ] as const;

    for (const { lesson, locale, instruction } of scenarios) {
      const activity = lesson.content.activities[8];
      for (const copyId of [
        activity.instructionCopyId,
        activity.retryFeedbackCopyId,
      ]) {
        const en = {
          ...baseNavigationCopyEn.content,
          ...(locale === "en" ? { [copyId]: instruction } : {}),
        };
        const it = {
          ...baseNavigationCopyIt.content,
          ...(locale === "it" ? { [copyId]: instruction } : {}),
        };
        expect(
          validateTask11SemanticReview([lesson], en, it),
          `${locale}:${activity.id}:${copyId}:${instruction}`,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: "instruction-answer-leakage",
              activityId: activity.id,
            }),
          ]),
        );
      }
    }
  });

  it("rejects listening contrasts with no derivable semantic terms", () => {
    const lesson = structuredClone(
      BASE_POLITE_VERBS_MODULE.lessons[0],
    );
    const design = lesson.activityDesigns[8] as unknown as {
      optionTargets: typeof lesson.activityDesigns[8]["optionTargets"];
      acceptedAnswerTarget: typeof lesson.activityDesigns[8]["acceptedAnswerTarget"];
      id: string;
    };
    design.optionTargets = [
      design.acceptedAnswerTarget,
      structuredClone(design.acceptedAnswerTarget),
    ];
    expect(validateTask11SemanticReview([lesson])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "listening-terms-missing",
          activityId: design.id,
        }),
      ]),
    );
  });

  it("keeps TM2 time-bound instructions factually parallel without naming the cell", () => {
    const lesson = BASE_TIME_MOVEMENT_MODULE.lessons[1];
    const copyId = lesson.content.activities[4].instructionCopyId;
    expect(baseNavigationCopyEn.content[copyId]).toMatch(
      /\bnine\b.*\bfive\b/iu,
    );
    expect(baseNavigationCopyIt.content[copyId]).toBe(
      "La scheda di studio di Tanaka indica l’inizio alle nove e la fine alle cinque. Scegli la frase corrispondente.",
    );
    expect(baseNavigationCopyIt.content[copyId]).not.toMatch(
      /lettura delimitata/iu,
    );
  });

  it("uses genuine intercity travel for the bounded route repair", () => {
    const design = BASE_TIME_MOVEMENT_MODULE.lessons[1].activityDesigns[5];
    expect(design.promptTarget.predicateLexemeId).toBe("verb-ryokou-suru");
    expect(design.acceptedAnswerTarget.predicateLexemeId).toBe(
      "verb-ryokou-suru",
    );
    expect(jp(design.promptTarget.tokens)).not.toContain("えきから");
    expect(jp(design.acceptedAnswerTarget.tokens)).toBe(
      "まりさんはとうきょうからおおさかまでりょこうします",
    );
  });

  it("rejects meta-label synonyms for both TM2 bound cells", () => {
    const lesson = BASE_TIME_MOVEMENT_MODULE.lessons[1];
    const scenarios = [
      {
        index: 4,
        locale: "en",
        instruction: "Choose the bounded reading.",
      },
      {
        index: 4,
        locale: "en",
        instruction: "Choose the start-and-finish pattern.",
      },
      {
        index: 4,
        locale: "it",
        instruction: "Scegli la lettura delimitata.",
      },
      {
        index: 4,
        locale: "it",
        instruction: "Scegli lo schema di inizio e fine.",
      },
      {
        index: 5,
        locale: "en",
        instruction: "Choose the bounded route.",
      },
      {
        index: 5,
        locale: "it",
        instruction: "Scegli il percorso delimitato.",
      },
    ] as const;

    for (const { index, locale, instruction } of scenarios) {
      const activity = lesson.content.activities[index];
      const copyId = activity.instructionCopyId;
      const en = {
        ...baseNavigationCopyEn.content,
        ...(locale === "en" ? { [copyId]: instruction } : {}),
      };
      const it = {
        ...baseNavigationCopyIt.content,
        ...(locale === "it" ? { [copyId]: instruction } : {}),
      };
      expect(
        validateTask11SemanticReview([lesson], en, it),
        `${locale}:${activity.id}:${instruction}`,
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "instruction-answer-leakage",
            activityId: activity.id,
          }),
        ]),
      );
    }
  });

  it("does not reuse worked examples as prompts, options, or error candidates", () => {
    const lessons = [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ];
    const demonstrations = new Map<string, string>();
    for (const lesson of lessons) {
      for (const target of [
        ...lesson.examples,
        ...(lesson.dialogue?.turns ?? []),
      ]) {
        demonstrations.set(
          visibleSurfaceFingerprint(target.tokens),
          "id" in target ? String(target.id) : lesson.dialogue?.id ?? "",
        );
      }
    }
    for (const lesson of lessons) {
      for (const design of lesson.activityDesigns) {
        for (const [kind, target] of [
          ["prompt", design.promptTarget],
          ...design.optionTargets.map(
            (option) => ["option", option] as const,
          ),
        ] as const) {
          const duplicate = demonstrations.get(
            visibleSurfaceFingerprint(target.tokens),
          );
          if (!duplicate) continue;
          expect(design.category, `${design.id}:${kind}:${duplicate}`).toBe(
            "cumulative-retrieval",
          );
          expect(
            design.operationEvidence.sourceTargetId,
            `${design.id}:${kind}:${duplicate}`,
          ).toBeTypeOf("string");
          expect(design.operation, `${design.id}:${kind}:${duplicate}`).not.toBe(
            "diagnose-error",
          );
        }
      }
    }
  });

  it("includes multi-token prompts in cross-module corpus validation", () => {
    const pv3 = BASE_POLITE_VERBS_MODULE.lessons[2];
    const tm3 = BASE_TIME_MOVEMENT_MODULE.lessons[2];
    const earlier = pv3.activityDesigns[2].acceptedAnswerTarget;
    const laterPrompt = tm3.activityDesigns[3].promptTarget;
    expect(visibleSurfaceFingerprint(laterPrompt.tokens)).not.toBe(
      visibleSurfaceFingerprint(earlier.tokens),
    );
    expect(validateTask11SemanticReview([pv3, tm3])).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "worked-surface-reused",
          activityId: tm3.activityDesigns[3].id,
        }),
      ]),
    );

    const mutated = structuredClone(tm3);
    const design = mutated.activityDesigns[3];
    (design.promptTarget as unknown as { tokens: AssembledToken[] }).tokens = [
      ...earlier.tokens,
    ];
    expect(validateTask11SemanticReview([pv3, mutated])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "worked-surface-reused",
          activityId: design.id,
        }),
      ]),
    );
  });

  it("treats bare yes/no prefixes as discourse-neutral for corpus reuse", () => {
    const lessons = [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ];
    const normalized = (tokens: readonly { readonly jp: string }[]) =>
      jp(tokens)
        .normalize("NFKC")
        .replace(/^(?:はい|いいえ)[、,]?/u, "")
        .replace(/[、。,\s]/gu, "");
    const demonstrations = new Map<string, string>();
    for (const lesson of lessons) {
      for (const target of [
        ...lesson.examples,
        ...(lesson.dialogue?.turns ?? []),
      ]) {
        demonstrations.set(
          normalized(target.tokens),
          "id" in target ? String(target.id) : lesson.dialogue?.id ?? "",
        );
      }
    }
    for (const lesson of lessons) {
      for (const design of lesson.activityDesigns) {
        for (const target of [
          design.promptTarget,
          ...design.optionTargets,
        ]) {
          expect(
            demonstrations.get(normalized(target.tokens)),
            `${design.id}:${jp(target.tokens)}`,
          ).toBeUndefined();
        }
      }
    }

    const mutated = structuredClone(BASE_ARGUMENT_PARTICLES_MODULE.lessons[0]);
    const example = mutated.examples[0];
    const option = mutated.activityDesigns[0]
      .optionTargets[0] as unknown as { tokens: AssembledToken[] };
    option.tokens = [
      {
        id: "adversarial-hai",
        jp: "はい",
        romaji: "hai",
        kind: "lexical",
        boundaryBefore: "attach",
        source: { domain: "catalog", referenceId: "expression-hai" },
      },
      {
        id: "adversarial-comma",
        jp: "、",
        romaji: ",",
        kind: "punctuation",
        boundaryBefore: "attach",
        source: { domain: "catalog", referenceId: "japanese-comma" },
      },
      ...example.tokens,
    ];
    expect(
      validateTask11SemanticReview([mutated]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "worked-surface-reused",
          activityId: mutated.activityDesigns[0].id,
        }),
      ]),
    );
  });

  it("does not reveal the correct option through terminal punctuation", () => {
    for (const lesson of [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ]) {
      for (const design of lesson.activityDesigns.filter(
        ({ optionTargets }) => optionTargets.length === 2,
      )) {
        const punctuation = design.optionTargets.map(({ tokens }) =>
          tokens[tokens.length - 1]?.kind === "punctuation"
            ? tokens[tokens.length - 1].jp
            : "",
        );
        expect(punctuation[0], design.id).toEqual(punctuation[1]);
      }
    }
    const mutated = structuredClone(BASE_POLITE_VERBS_MODULE.lessons[3]);
    const design = mutated.activityDesigns[0];
    const option = design.optionTargets[0] as unknown as {
      tokens: AssembledToken[];
    };
    option.tokens = [
      ...option.tokens,
      {
        id: "adversarial-period",
        jp: "。",
        romaji: ".",
        kind: "punctuation",
        boundaryBefore: "attach",
        source: { domain: "catalog", referenceId: "japanese-period" },
      },
    ];
    expect(validateTask11SemanticReview([mutated])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "option-punctuation-tell",
          activityId: design.id,
        }),
      ]),
    );
  });

  it("publishes exact visible grounding for every world fact", () => {
    for (const module of [
      BASE_POLITE_VERBS_MODULE,
      BASE_ARGUMENT_PARTICLES_MODULE,
      BASE_TIME_MOVEMENT_MODULE,
    ]) {
      expect(new Set(module.worldFactIds).size).toBe(module.worldFactIds.length);
      expect(module.worldFactLedger.map(({ id }) => id)).toEqual(
        [...new Set(module.worldFactIds)],
      );
      for (const lesson of module.lessons) {
        for (const design of lesson.activityDesigns) {
          if (design.worldFactId === null) continue;
          const grounding = (
            design as typeof design & {
              readonly worldFactGrounding?: {
                readonly factId: string;
                readonly referentId: string;
                readonly acceptedTargetId: string;
                readonly conflictingTargetIds: readonly string[];
              };
            }
          ).worldFactGrounding;
          expect(grounding, design.id).toEqual({
            factId: design.worldFactId,
            referentId: design.referentId,
            acceptedTargetId: design.acceptedAnswerTargetId,
            conflictingTargetIds: expect.any(Array),
          });
          expect(
            design.acceptedAnswerTarget.lexemeIds.some(
              (id) =>
                id === design.referentId ||
                id.endsWith(`-${design.referentId}`),
            ) || design.contextTarget.copyId.length > 0,
            design.id,
          ).toBe(true);
        }
      }
    }
    expect(BASE_POLITE_VERBS_MODULE.worldFacts.yukiRoutine).toBe("works");
    const practicalFacts = BASE_TIME_MOVEMENT_MODULE.lessons[3].activityDesigns
      .map(({ worldFactId }) => worldFactId)
      .filter((id): id is string => id !== null);
    expect(new Set(practicalFacts).size).toBe(practicalFacts.length);
  });

  it("keeps every practice target distinct from examples and dialogue", () => {
    for (const lesson of BASE_TIME_MOVEMENT_MODULE.lessons) {
      const demos = new Set([
        ...lesson.examples.map(({ tokens }) => visibleSurfaceFingerprint(tokens)),
        ...(lesson.dialogue?.turns.map(({ tokens }) => visibleSurfaceFingerprint(tokens)) ?? []),
      ]);
      for (const { acceptedAnswerTarget } of lesson.activityDesigns) {
        expect(demos.has(visibleSurfaceFingerprint(acceptedAnswerTarget.tokens))).toBe(false);
      }
    }
  });

  it("has no normalized reuse, prompt leakage, or shared practice fingerprints across lessons", () => {
    const demonstrations = new Set<string>();
    for (const lesson of [
      ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons,
      ...BASE_TOPIC_QUESTIONS_MODULE.lessons,
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ]) {
      for (const target of [
        ...lesson.examples,
        ...(lesson.dialogue?.turns ?? []),
      ]) {
        const fingerprint = visibleSurfaceFingerprint(target.tokens);
        expect(demonstrations.has(fingerprint), lesson.content.lessonId).toBe(
          false,
        );
        demonstrations.add(fingerprint);
      }
    }

    const visiblePractice = new Set<string>();
    const semanticPractice = new Set<string>();
    const targetOperations = new Set<string>();
    const task11Lessons = [
      ...BASE_POLITE_VERBS_MODULE.lessons,
      ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
      ...BASE_TIME_MOVEMENT_MODULE.lessons,
    ];
    const positionFingerprints = task11Lessons.map((lesson) =>
      lesson.activityDesigns
        .filter(({ operation }) => operation !== "produce-spoken")
        .map(({ correctOptionIndex }) => correctOptionIndex)
        .join(""),
    );
    expect(new Set(positionFingerprints).size).toBe(task11Lessons.length);
    for (const fingerprint of positionFingerprints) {
      expect(fingerprint).not.toMatch(/^(?:01){4}0$|^(?:10){4}1$/u);
      expect(
        Math.abs(
          [...fingerprint].filter((position) => position === "0").length -
            [...fingerprint].filter((position) => position === "1").length,
        ),
      ).toBeLessThanOrEqual(1);
    }
    for (const lesson of task11Lessons) {
      for (const design of lesson.activityDesigns) {
        const prompt = jp(design.promptTarget.tokens);
        expect(prompt.includes(jp(design.acceptedAnswerTarget.tokens))).toBe(
          false,
        );
        const definition = lesson.content.activities.find(
          ({ id }) => id === design.id,
        )!;
        const operationFingerprint = activityTargetOperationFingerprintFor(
          lesson.content.lessonId,
          definition,
          BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
        );
        expect(operationFingerprint.ok).toBe(true);
        if (operationFingerprint.ok) {
          expect(
            targetOperations.has(operationFingerprint.fingerprint),
            design.id,
          ).toBe(false);
          targetOperations.add(operationFingerprint.fingerprint);
        }
        for (const target of [
          ...design.optionTargets,
          ...(design.operation === "produce-spoken"
            ? [design.acceptedAnswerTarget]
            : []),
        ]) {
          const visible = visibleSurfaceFingerprint(target.tokens);
          const semantic = semanticFingerprintFor(target);
          expect(visiblePractice.has(visible), design.id).toBe(false);
          expect(semanticPractice.has(semantic), design.id).toBe(false);
          visiblePractice.add(visible);
          semanticPractice.add(semantic);
        }
      }
    }
  });

  it("deep-freezes exports and rejects adversarial module shapes", () => {
    expect(Object.isFrozen(BASE_TIME_MOVEMENT_MODULE)).toBe(true);
    expect(Object.isFrozen(BASE_TIME_MOVEMENT_TENSE_CELLS)).toBe(true);
    const duplicate = [
      BASE_TIME_MOVEMENT_MODULE.lessons[0],
      BASE_TIME_MOVEMENT_MODULE.lessons[0],
      ...BASE_TIME_MOVEMENT_MODULE.lessons.slice(2),
    ];
    expect(
      validateBaseTimeMovementModule({
        ...BASE_TIME_MOVEMENT_MODULE,
        lessons: duplicate,
      }),
    ).toMatchObject({ ok: false });
    expect(validateBaseTimeMovementModule(Object.create(null))).toMatchObject({
      ok: false,
    });
  });
});
