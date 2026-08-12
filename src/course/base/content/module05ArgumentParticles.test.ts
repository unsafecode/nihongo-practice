import { describe, expect, it } from "vitest";
import type { AssembledToken } from "../../../romaji/types";
import { BASE_FIRST_TEACH_OWNERS, firstTeachLessonPosition } from "../catalog/firstTeach";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  BASE_PARTICLE_SENSES,
  baseParticleSurfaceTokens,
  validateParticleFrame,
} from "../forms/particleLicensing";
import { visibleSurfaceFingerprint } from "../validation/fingerprints";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateFirstTeachOrder } from "../validation/sequenceRules";
import {
  BASE_ARGUMENT_PARTICLES_LESSONS,
  BASE_ARGUMENT_PARTICLES_MODULE,
  BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
  validateBaseArgumentParticlesModule,
} from "./module05ArgumentParticles";
import { validateTask11SemanticReview } from "./module04PoliteVerbs";

function jp(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map(({ jp }) => jp).join("");
}

function targetsForLesson(
  lesson: typeof BASE_ARGUMENT_PARTICLES_MODULE.lessons[number],
) {
  return [
    ...lesson.examples,
    ...(lesson.dialogue?.turns ?? []),
    ...lesson.activityDesigns.flatMap(({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
      promptTarget,
      ...optionTargets,
      acceptedAnswerTarget,
    ]),
  ];
}

function governedParticleMultiset(target: {
  readonly tokens: readonly {
    readonly kind: string;
    readonly source: { readonly referenceId: string };
  }[];
  readonly particleFrame?: {
    readonly provided: Readonly<Record<string, string>>;
  };
}): Readonly<{ visible: readonly string[]; declared: readonly string[] }> {
  const counted: ReadonlySet<string> = new Set(
    BASE_PARTICLE_SENSES.map(({ id }) => id),
  );
  return {
    visible: target.tokens
      .filter(
        ({ kind, source }) =>
          kind === "particle" && counted.has(source.referenceId),
      )
      .map(({ source }) => source.referenceId)
      .sort(),
    declared: Object.values(target.particleFrame?.provided ?? {}).sort(),
  };
}

describe("Base argument-particles module", () => {
  it("publishes four system lessons in the exact canonical order", () => {
    expect(
      BASE_ARGUMENT_PARTICLES_LESSONS.map(
        ({ lessonId, contract, prerequisiteLessonIds }) => [
          lessonId,
          contract,
          prerequisiteLessonIds,
        ],
      ),
    ).toEqual([
      ["argument-particles-1", "system", ["polite-verbs-4"]],
      ["argument-particles-2", "system", ["argument-particles-1"]],
      ["argument-particles-3", "system", ["argument-particles-2"]],
      ["argument-particles-4", "system", ["argument-particles-3"]],
    ]);
  });

  it("meets all depth, sequence, density, and 8+2 practice gates", () => {
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      expect(
        validateBaseLessonDepth(
          lesson.content,
          BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
        ),
        lesson.content.lessonId,
      ).toEqual([]);
      expect(lesson.examples.length).toBeGreaterThanOrEqual(10);
      expect(lesson.examples.length).toBeLessThanOrEqual(14);
      expect(lesson.activityDesigns).toHaveLength(10);
      expect(
        new Set(
          lesson.activityDesigns
            .filter(({ mode }) => mode === "non-spoken")
            .map(({ category }) => category),
        ).size,
      ).toBeGreaterThanOrEqual(6);
    }
    expect(
      validateFirstTeachOrder(
        BASE_ARGUMENT_PARTICLES_MODULE.sequence,
        BASE_FIRST_TEACH_OWNERS,
        BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
      ),
    ).toEqual([]);
    expect(validateBaseArgumentParticlesModule(BASE_ARGUMENT_PARTICLES_MODULE)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("publishes canonical particle pronunciation", () => {
    expect(baseParticleSurfaceTokens("object-o")).toMatchObject([
      { jp: "を", romaji: "o" },
    ]);
    expect(baseParticleSurfaceTokens("direction-he")).toMatchObject([
      { jp: "へ", romaji: "e" },
    ]);
  });

  it("cites and licenses every governed visible particle by predicate sense and role", () => {
    const governed = new Set([
      "object-o",
      "goal-ni",
      "direction-he",
      "action-place-de",
      "means-de",
    ]);
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      for (const target of targetsForLesson(lesson)) {
        const visibleGoverned = target.tokens
          .filter(
            ({ kind, source }) =>
              kind === "particle" && governed.has(source.referenceId),
          )
          .map(({ source }) => source.referenceId);
        if (visibleGoverned.length === 0) continue;
        expect(target.particleFrame, jp(target.tokens)).toBeDefined();
        expect(target.predicateSenseId).toBe(target.particleFrame?.predicateSenseId);
        expect(target.predicateLexemeId).toBeTypeOf("string");
        expect(target.lexemeIds).toContain(target.predicateLexemeId);
        expect(
          validateParticleFrame(
            target.particleFrame?.predicateSenseId,
            target.particleFrame?.provided,
          ),
          jp(target.tokens),
        ).toMatchObject({ ok: true });
        for (const [role, particleSense] of Object.entries(
          target.particleFrame?.provided ?? {},
        )) {
          if (
            ![
              "theme",
              "goal",
              "topic",
              "action-place",
              "means",
              "time",
              "source",
              "limit",
            ].includes(role)
          ) {
            continue;
          }
          expect(target.semanticRoleIds).toContain(
            role === "goal" && particleSense === "direction-he"
              ? "direction"
              : role,
          );
        }
      }
    }
  });

  it("holds the predicate constant when contrasting particle roles and surfaces", () => {
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      for (const design of lesson.activityDesigns.filter(
        ({ operation }) =>
          operation !== "recognize-meaning" &&
          operation !== "produce-spoken",
      )) {
        expect(design.optionTargets, design.id).toHaveLength(2);
        const predicates = design.optionTargets.map(
          ({ predicateLexemeId }) => predicateLexemeId,
        );
        expect(predicates[0], design.id).not.toBeNull();
        expect(predicates[1], design.id).toBe(predicates[0]);
      }
    }
  });

  it("holds every declared particle contrast constant outside its particle sense", () => {
    const particleAnalysisIds = new Set([
      "analysis-action-place",
      "analysis-means",
      "analysis-goal",
      "analysis-direction",
    ]);
    const structuralSignature = (
      target: (typeof BASE_ARGUMENT_PARTICLES_MODULE.lessons)[number]["activityDesigns"][number]["optionTargets"][number],
    ) =>
      target.tokens.map(({ jp, kind, source }) =>
        kind === "particle"
          ? "<particle>"
          : particleAnalysisIds.has(source.referenceId)
            ? "<particle-analysis>"
            : `${source.referenceId}:${jp}`,
      );
    const roleSignature = (
      target: (typeof BASE_ARGUMENT_PARTICLES_MODULE.lessons)[number]["activityDesigns"][number]["optionTargets"][number],
    ) =>
      [...target.semanticRoleIds]
        .map((role) =>
          role === "topic" || role === "additive-topic"
            ? "discourse-topic"
            : role === "goal" || role === "direction"
              ? "movement-target"
              : role === "action-place" || role === "means"
                ? "de-argument"
                : role,
        )
        .sort();

    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      for (const design of lesson.activityDesigns.filter(
        ({ reviewEvidence, optionTargets }) =>
          reviewEvidence.contrastAxis === "particle" &&
          optionTargets.length === 2,
      )) {
        const [left, right] = design.optionTargets;
        expect(structuralSignature(left), design.id).toEqual(
          structuralSignature(right),
        );
        expect(
          left.particleBindings?.map(
            ({ attachmentLexemeId }) => attachmentLexemeId,
          ),
          design.id,
        ).toEqual(
          right.particleBindings?.map(
            ({ attachmentLexemeId }) => attachmentLexemeId,
          ),
        );
        expect(roleSignature(left), design.id).toEqual(roleSignature(right));
      }
    }
  });

  it("rejects a forged lexical change under a particle contrast", () => {
    const lesson = structuredClone(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[0],
    );
    const design = lesson.activityDesigns[3];
    const target = design.optionTargets[1] as unknown as {
      tokens: AssembledToken[];
      lexemeIds: string[];
    };
    const subjectIndex = target.tokens.findIndex(
      ({ source }) => source.referenceId === "noun-satou",
    );
    target.tokens[subjectIndex] = {
      ...target.tokens[subjectIndex],
      jp: "やまださん",
      romaji: "Yamada-san",
      source: { domain: "catalog", referenceId: "noun-yamada" },
    };
    target.lexemeIds = target.lexemeIds.map((lexemeId) =>
      lexemeId === "noun-satou" ? "noun-yamada" : lexemeId,
    );
    expect(validateTask11SemanticReview([lesson])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "particle-contrast-not-isolated",
          activityId: design.id,
        }),
      ]),
    );
  });

  it("uses the unchanged source as the incorrect choice in particle transformations", () => {
    for (const design of [
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[0].activityDesigns[4],
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[1].activityDesigns[4],
    ]) {
      expect(design.operation).toBe("transform-form");
      const prompt = jp(design.promptTarget.tokens);
      const matchingIndex = design.optionTargets.findIndex(
        ({ tokens }) => jp(tokens) === prompt,
      );
      expect(matchingIndex, design.id).toBeGreaterThanOrEqual(0);
      expect(matchingIndex, design.id).not.toBe(design.correctOptionIndex);
    }
  });

  it("matches every visible Module 5 case/topic particle to the declared role multiset", () => {
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      for (const target of targetsForLesson(lesson)) {
        const { visible, declared } = governedParticleMultiset(target);
        if (visible.length === 0) continue;
        expect(declared, jp(target.tokens)).toEqual(visible);
      }
    }
  });

  it("reports token/frame mismatches for replaced, deleted, and inserted particles", () => {
    const lesson = BASE_ARGUMENT_PARTICLES_MODULE.lessons[0].content;
    const original = BASE_ARGUMENT_PARTICLES_MODULE.lessons[0].examples[0];
    const mutations = [
      original.tokens.map((token) =>
        token.source.referenceId === "object-o"
          ? {
              ...token,
              jp: "に",
              romaji: "ni",
              source: { ...token.source, referenceId: "goal-ni" },
            }
          : token,
      ),
      original.tokens.filter(
        ({ source }) => source.referenceId !== "object-o",
      ),
      [
        ...original.tokens,
        {
          ...baseParticleSurfaceTokens("goal-ni")[0],
          id: "adversarial-extra-goal",
        },
      ],
    ];
    for (const tokens of mutations) {
      const mutated = { ...original, tokens };
      const catalogs = {
        ...BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
        examples: new Map([
          ...BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS.examples,
          [original.id, mutated],
        ]),
      };
      expect(
        validateBaseLessonDepth(lesson, catalogs)
          .map(({ code }) => code as string)
          .filter((code) => code === "particle-frame-token-mismatch"),
      ).toEqual(["particle-frame-token-mismatch"]);
    }
  });

  it("rejects token-only AP1 A7 particle and attachment mutations with the authored frame unchanged", () => {
    const lessonRecord = BASE_ARGUMENT_PARTICLES_MODULE.lessons[0];
    const lesson = lessonRecord.content;
    const design = lessonRecord.activityDesigns[6];
    const original = design.acceptedAnswerTarget;
    expect(jp(original.tokens)).toBe("たなかさんはしゃしんをみます");
    expect(original.particleFrame).toMatchObject({
      provided: {
        topic: "topic-wa",
        theme: "object-o",
      },
      attachmentLexemeIdByRole: {
        topic: "noun-tanaka",
        theme: "anchor-shashin",
      },
    });

    const replaceAccepted = (
      target: typeof original,
    ): ReturnType<typeof validateBaseLessonDepth> => {
      const catalogs = {
        ...BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
        acceptedAnswerTargets: new Map([
          ...BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS.acceptedAnswerTargets,
          [design.acceptedAnswerTargetId, target],
        ]),
      };
      return validateBaseLessonDepth(lesson, catalogs);
    };
    const objectIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "object-o",
    );
    const topicNounIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "noun-tanaka",
    );
    const themeNounIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "anchor-shashin",
    );
    expect(objectIndex).toBeGreaterThanOrEqual(0);
    expect(topicNounIndex).toBeGreaterThanOrEqual(0);
    expect(themeNounIndex).toBeGreaterThanOrEqual(0);

    const deleted = {
      ...original,
      tokens: original.tokens.filter((_, index) => index !== objectIndex),
      conceptIds: ["licensed-object-o", "topicalized-object-wa"],
    };
    const replaced = {
      ...original,
      tokens: original.tokens.map((token, index) =>
        index === objectIndex
          ? { ...baseParticleSurfaceTokens("goal-ni")[0], id: token.id }
          : token,
      ),
      conceptIds: ["licensed-object-o", "goal-ni"],
    };
    const inserted = {
      ...original,
      tokens: [
        ...original.tokens.slice(0, objectIndex + 1),
        {
          ...baseParticleSurfaceTokens("additive-mo")[0],
          id: "adversarial-stray-mo",
        },
        ...original.tokens.slice(objectIndex + 1),
      ],
      conceptIds: ["licensed-object-o", "topic-wa", "additive-mo"],
    };
    const unenumerated = [
      "focus-subject-ga",
      "companion-to",
      "question-ka",
      "possessive-attributive-no",
    ].map((sense, index) => ({
      ...original,
      tokens: [
        ...original.tokens,
        {
          ...baseParticleSurfaceTokens(
            sense as Parameters<typeof baseParticleSurfaceTokens>[0],
          )[0],
          id: `adversarial-unenumerated-${index}`,
        },
      ],
      conceptIds: [...original.conceptIds, sense],
    }));
    const attachmentSwap = {
      ...original,
      tokens: original.tokens.map((token, index) => {
        if (index === topicNounIndex) {
          const replacement = original.tokens[themeNounIndex];
          return { ...replacement, id: token.id };
        }
        if (index === themeNounIndex) {
          const replacement = original.tokens[topicNounIndex];
          return { ...replacement, id: token.id };
        }
        return token;
      }),
      conceptIds: ["licensed-object-o", "topic-wa"],
    };

    for (const mutation of [
      deleted,
      replaced,
      inserted,
      attachmentSwap,
      ...unenumerated,
    ]) {
      const mismatches = replaceAccepted(mutation)
        .map(({ code }) => code)
        .filter((code) => code === "particle-frame-token-mismatch");
      expect(new Set(mismatches), jp(mutation.tokens)).toEqual(
        new Set(["particle-frame-token-mismatch"]),
      );
      expect(mutation.particleFrame).toBe(original.particleFrame);
    }

    const forgedNonNominalAttachment = {
      ...original,
      tokens: original.tokens.map((token, index) =>
        index === themeNounIndex
          ? {
              ...token,
              source: {
                ...token.source,
                referenceId: "analysis-future",
              },
            }
          : token,
      ),
      lexemeIds: [...original.lexemeIds, "analysis-future"],
      particleFrame: {
        ...original.particleFrame!,
        attachmentLexemeIdByRole: {
          ...original.particleFrame!.attachmentLexemeIdByRole,
          theme: "analysis-future",
        },
      },
    };
    expect(
      replaceAccepted(forgedNonNominalAttachment)
        .map(({ code }) => code)
        .filter((code) => code === "particle-frame-token-mismatch"),
    ).toEqual(expect.arrayContaining(["particle-frame-token-mismatch"]));

    const {
        particleFrame: _removedParticleFrame,
        ...missingParticleFrame
    } = original;
    expect(
        replaceAccepted(missingParticleFrame)
          .map(({ code }) => code)
          .filter((code) => code === "particle-frame-token-mismatch"),
    ).toEqual(expect.arrayContaining(["particle-frame-token-mismatch"]));

    const verbIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "verb-miru",
    );
    const forgedExtraRole = {
      ...original,
      tokens: [
        ...original.tokens.slice(0, verbIndex),
        {
          ...original.tokens[topicNounIndex],
          id: "adversarial-extra-goal-noun",
        },
        {
          ...baseParticleSurfaceTokens("goal-ni")[0],
          id: "adversarial-extra-goal-particle",
        },
        ...original.tokens.slice(verbIndex),
      ],
      semanticRoleIds: [...original.semanticRoleIds, "goal" as const],
      particleBindings: [
        ...(original.particleBindings ?? []),
        {
          role: "goal" as const,
          particleSense: "goal-ni" as const,
          attachmentLexemeId: "noun-tanaka",
        },
      ],
    };
    expect(
      replaceAccepted(forgedExtraRole)
        .map(({ code }) => code)
        .filter((code) => code === "particle-frame-token-mismatch"),
    ).toEqual(expect.arrayContaining(["particle-frame-token-mismatch"]));

    const forgedSemanticRole = {
      ...original,
      semanticRoleIds: [...original.semanticRoleIds, "goal" as const],
      conceptIds: ["goal-ni"],
    };
    expect(
      replaceAccepted(forgedSemanticRole)
        .map(({ code }) => code)
        .filter((code) => code === "particle-frame-token-mismatch"),
    ).toEqual(expect.arrayContaining(["particle-frame-token-mismatch"]));
  });

  it("teaches transitive theme o and a licensed topicalized theme", () => {
    const lesson = BASE_ARGUMENT_PARTICLES_MODULE.lessons[0];
    expect(lesson.examples.some(({ tokens }) => jp(tokens).includes("を"))).toBe(true);
    expect(
      lesson.examples.some(
        ({ patternCellIds, tokens, semanticRoleIds, predicateSenseId }) =>
          patternCellIds.includes("ap1-topicalized-theme-wa") &&
          jp(tokens).includes("は") &&
          semanticRoleIds.includes("theme") &&
          predicateSenseId !== null,
      ),
    ).toBe(true);
  });

  it("rejects an unrealized semantic role on a framed example", () => {
    const lesson = BASE_ARGUMENT_PARTICLES_MODULE.lessons[0].content;
    const original = BASE_ARGUMENT_PARTICLES_MODULE.lessons[0].examples[0];
    const mutated = {
      ...original,
      semanticRoleIds: [...original.semanticRoleIds, "goal" as const],
      conceptIds: ["goal-ni"],
    };
    const catalogs = {
      ...BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
      examples: new Map([
        ...BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS.examples,
        [original.id, mutated],
      ]),
    };
    expect(
      validateBaseLessonDepth(lesson, catalogs).map(({ code }) => code),
    ).toContain("particle-frame-token-mismatch");
  });

  it("keeps goal-ni, direction-he, and action-place roles semantically exact", () => {
    const movementRecord = BASE_ARGUMENT_PARTICLES_MODULE.lessons[1];
    const direction = movementRecord.examples[2];
    const forgedGoal = {
      ...direction,
      semanticRoleIds: direction.semanticRoleIds.map((role) =>
        role === "direction" ? ("goal" as const) : role,
      ),
    };
    expect(
      validateBaseLessonDepth(movementRecord.content, {
        ...BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
        examples: new Map([
          ...BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS.examples,
          [direction.id, forgedGoal],
        ]),
      }).map(({ code }) => code),
    ).toContain("particle-frame-token-mismatch");

    const placeRecord = BASE_ARGUMENT_PARTICLES_MODULE.lessons[2];
    for (const target of [
      ...placeRecord.examples,
      ...placeRecord.activityDesigns.flatMap(
        ({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
          promptTarget,
          ...optionTargets,
          acceptedAnswerTarget,
        ],
      ),
    ].filter((target) =>
      target.particleBindings?.some(({ role }) => role === "action-place"),
    )) {
      expect(target.semanticRoleIds, jp(target.tokens)).toContain("action-place");
      expect(target.semanticRoleIds, jp(target.tokens)).not.toContain("location");
    }
  });

  it("makes AP1 packaging contexts determinate without later particles", () => {
    for (const activityNumber of [2, 7]) {
      const en =
        baseNavigationCopyEn.content[
          `argument-particles-1-activity-${activityNumber}-instruction`
        ].toLowerCase();
      const it =
        baseNavigationCopyIt.content[
          `argument-particles-1-activity-${activityNumber}-instruction`
        ].toLowerCase();
      expect(en, `EN:A${activityNumber}`).toMatch(
        /(?:new information|already under discussion|neutral packaging|established topic)/u,
      );
      expect(it, `IT:A${activityNumber}`).toMatch(
        /(?:informazione nuova|già al centro|organizzazione neutra|tema stabilito)/u,
      );
    }

    const listening = BASE_ARGUMENT_PARTICLES_MODULE.lessons[0].activityDesigns[8];
    const visibleSenses = listening.optionTargets.flatMap(({ tokens }) =>
      tokens
        .filter(({ kind }) => kind === "particle")
        .map(({ source }) => source.referenceId),
    );
    expect(visibleSenses).not.toEqual(
      expect.arrayContaining([
        "question-ka",
        "interactional-ne",
        "interactional-yo",
      ]),
    );
    expect(jp(listening.optionTargets[0].tokens)).not.toContain("ね");
  });

  it("holds AP1 A4 constant except for object versus topical packaging", () => {
    const lesson = BASE_ARGUMENT_PARTICLES_MODULE.lessons[0];
    const design = lesson.activityDesigns[3];
    const structuralSources = design.optionTargets.map(({ tokens }) =>
      tokens
        .filter(
          ({ source }) =>
            source.referenceId !== "object-o" &&
            source.referenceId !== "topic-wa",
        )
        .map(({ source }) => source.referenceId),
    );
    expect(structuralSources[0]).toEqual(structuralSources[1]);
    expect(
      baseNavigationCopyEn.content[
        lesson.content.activities[3].instructionCopyId
      ].toLowerCase(),
    ).toMatch(/(?:new information|neutral)/u);
  });

  it("uses genuine clause contrasts instead of label-only AP3 choices", () => {
    const lesson = BASE_ARGUMENT_PARTICLES_MODULE.lessons[2];
    const withoutRoleLabel = (target: (typeof lesson.activityDesigns)[number]["optionTargets"][number]) =>
      target.tokens
        .filter(
          ({ source }) =>
            source.referenceId !== "analysis-action-place" &&
            source.referenceId !== "analysis-means" &&
            source.referenceId !== "japanese-comma" &&
            source.referenceId !== "japanese-period",
        )
        .map(({ jp }) => jp)
        .join("");
    for (const index of [0, 1, 3, 4, 6, 7]) {
      const design = lesson.activityDesigns[index];
      expect(design.optionTargets, design.id).toHaveLength(2);
      expect(
        withoutRoleLabel(design.optionTargets[0]),
        design.id,
      ).not.toBe(withoutRoleLabel(design.optionTargets[1]));
      expect(
        design.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
        design.id,
      ).toEqual([
        design.reviewEvidence.heldConstantPredicateLexemeId,
        design.reviewEvidence.heldConstantPredicateLexemeId,
      ]);
    }
  });

  it("keeps AP1 drinking feedback and AP4 diagnosis aligned to one causal repair", () => {
    const ap1Retry = [
      baseNavigationCopyEn.content[
        "argument-particles-1-activity-2-retry-feedback"
      ],
      baseNavigationCopyIt.content[
        "argument-particles-1-activity-2-retry-feedback"
      ],
    ].join(" ");
    expect(ap1Retry.toLowerCase()).not.toMatch(/(?:buy|buying|compra|comprare)/u);

    const design = BASE_ARGUMENT_PARTICLES_MODULE.lessons[3].activityDesigns[5];
    expect(design.reviewEvidence.error).toMatchObject({
      code: "means-context-mismatch",
      changedTokenSourceIds: ["noun-kasa", "noun-enpitsu"],
    });
    expect(
      design.promptTarget.tokens
        .filter(({ kind }) => kind === "particle")
        .map(({ source }) => source.referenceId),
    ).toEqual(
      design.acceptedAnswerTarget.tokens
        .filter(({ kind }) => kind === "particle")
        .map(({ source }) => source.referenceId),
    );

    const lesson = structuredClone(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons[3],
    );
    const cloned = lesson.activityDesigns[5];
    const accepted = cloned.acceptedAnswerTarget as unknown as {
      tokens: AssembledToken[];
    };
    const topicIndex = accepted.tokens.findIndex(
      ({ source }) => source.referenceId === "topic-wa",
    );
    expect(topicIndex).toBeGreaterThanOrEqual(0);
    accepted.tokens[topicIndex] = {
      ...baseParticleSurfaceTokens("additive-mo")[0],
      id: accepted.tokens[topicIndex].id,
    };
    (
      cloned.reviewEvidence.error as unknown as {
        changedTokenSourceIds: string[];
      }
    ).changedTokenSourceIds = [
      "noun-kasa",
      "noun-enpitsu",
      "topic-wa",
      "additive-mo",
    ];
    const errors = validateTask11SemanticReview([lesson]);
    expect(
      errors.some(
        ({ code, activityId }) =>
          code === "error-delta-invalid" && activityId === cloned.id,
      ),
    ).toBe(true);
  });

  it("distinguishes exact goal ni, direction e, action-place de, and means de senses", () => {
    const l2 = BASE_ARGUMENT_PARTICLES_MODULE.lessons[1].examples;
    expect(l2.some(({ tokens }) => jp(tokens).includes("に"))).toBe(true);
    expect(l2.some(({ tokens }) => jp(tokens).includes("へ"))).toBe(true);
    expect(
      new Set(
        l2.flatMap(({ particleFrame }) =>
          particleFrame ? [particleFrame.predicateSenseId] : [],
        ),
      ).size,
    ).toBeGreaterThanOrEqual(4);

    const l3 = BASE_ARGUMENT_PARTICLES_MODULE.lessons[2].examples;
    expect(
      l3.some(({ particleFrame }) =>
        Object.values(particleFrame?.provided ?? {}).includes("action-place-de"),
      ),
    ).toBe(true);
    expect(
      l3.some(({ particleFrame }) =>
        Object.values(particleFrame?.provided ?? {}).includes("means-de"),
      ),
    ).toBe(true);
  });

  it("rejects wrong particles instead of accepting cosmetic swaps", () => {
    expect(validateParticleFrame("eat", { theme: "goal-ni" })).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "unlicensed-particle" })],
    });
    expect(validateParticleFrame("go-goal", { goal: "direction-he" })).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "unlicensed-particle" })],
    });
    expect(validateParticleFrame("go-direction", { goal: "goal-ni" })).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "unlicensed-particle" })],
    });
    expect(validateParticleFrame("study-place", { "action-place": "means-de" })).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "unlicensed-particle" })],
    });
  });

  it("places verb classes before licensed argument teaching", () => {
    const owner = (contentId: string) =>
      BASE_FIRST_TEACH_OWNERS.find(({ contentId: id }) => id === contentId)?.lessonId;
    const classes = ["godan-verb-class", "ichidan-verb-class", "polite-stems", "masu-nonpast"];
    const arguments_ = ["licensed-object-o", "goal-ni", "direction-he", "action-place-de", "means-de"];
    for (const argument of arguments_) {
      for (const klass of classes) {
        expect(firstTeachLessonPosition(owner(klass)!)!).toBeLessThan(
          firstTeachLessonPosition(owner(argument)!)!,
        );
      }
    }
  });

  it("advances particle references only when their predicate frames are owned", () => {
    expect(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons.map(
        ({ content }) => content.referenceSnapshotIds,
      ),
    ).toEqual([
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation"],
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation"],
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation"],
      [
        "sentence-anatomy",
        "particle-atlas",
        "verb-classes-conjugation",
        "reference-particle-frames",
      ],
    ]);
  });

  it("contains no future forms, te forms, adjectives, or ongoing-now readings", () => {
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      for (const target of targetsForLesson(lesson)) {
        expect(target.formIds).toEqual(
          expect.not.arrayContaining([
            "four-polite-tense-cells",
            "base-form-te",
            "base-construction-te-kudasai",
            "base-construction-sequential-te",
            "base-construction-te-imasu",
          ]),
        );
        expect(target.interpretationTags).not.toContain("ongoing-now");
        expect(jp(target.tokens)).not.toContain("ています");
        expect(target.predicateAspect).not.toBe("adjectival");
      }
    }
  });

  it("sanitizes raw module input before reading semantic fields", () => {
    const hostile = new Proxy(BASE_ARGUMENT_PARTICLES_MODULE, {
      get() {
        throw new Error("raw module property read");
      },
    });

    expect(validateBaseArgumentParticlesModule(hostile)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("publishes natural copy and keeps accepted targets distinct from demonstrations", () => {
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
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
      ];
      for (const id of ids) {
        expect(baseNavigationCopyEn.content[id], `EN:${id}`).toBeTypeOf("string");
        expect(baseNavigationCopyIt.content[id], `IT:${id}`).toBeTypeOf("string");
      }
      const demos = new Set(
        lesson.examples.map(({ tokens }) => visibleSurfaceFingerprint(tokens)),
      );
      for (const { acceptedAnswerTarget } of lesson.activityDesigns) {
        expect(demos.has(visibleSurfaceFingerprint(acceptedAnswerTarget.tokens))).toBe(false);
      }
    }
  });

  it("fails closed on getters, sparse arrays, prototypes, and unknown IDs", () => {
    expect(Object.isFrozen(BASE_ARGUMENT_PARTICLES_MODULE)).toBe(true);
    const getter = {
      id: "argument-particles",
      get lessons() {
        return BASE_ARGUMENT_PARTICLES_MODULE.lessons;
      },
      sequence: BASE_ARGUMENT_PARTICLES_MODULE.sequence,
      worldFacts: BASE_ARGUMENT_PARTICLES_MODULE.worldFacts,
      worldFactIds: BASE_ARGUMENT_PARTICLES_MODULE.worldFactIds,
      worldFactLedger: BASE_ARGUMENT_PARTICLES_MODULE.worldFactLedger,
    };
    expect(validateBaseArgumentParticlesModule(getter)).toMatchObject({ ok: false });
    const sparse = [...BASE_ARGUMENT_PARTICLES_MODULE.lessons];
    delete (sparse as unknown[])[2];
    expect(
      validateBaseArgumentParticlesModule({
        ...BASE_ARGUMENT_PARTICLES_MODULE,
        lessons: sparse,
      }),
    ).toMatchObject({ ok: false });

    const wrongParticle = structuredClone(BASE_ARGUMENT_PARTICLES_MODULE);
    (
      wrongParticle.lessons[0].examples[0].particleFrame!.provided as {
        theme: string;
      }
    ).theme = "goal-ni";
    expect(validateBaseArgumentParticlesModule(wrongParticle)).toEqual({
      ok: false,
      errors: ["invalid-module-shape"],
    });
  });
});
