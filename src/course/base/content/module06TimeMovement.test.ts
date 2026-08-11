import { describe, expect, it } from "vitest";
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
    expect(BASE_TIME_MOVEMENT_MODULE.lessons.slice(0, 3).map(({ examples }) => examples.length))
      .toEqual([10, 10, 10]);
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

  it("removes rejected punctual-work and unnatural movement/time surfaces", () => {
    const visible = allTargets().map(({ tokens }) => jp(tokens));
    for (const rejected of [
      "くじにはたらきます",
      "ばんはたらきます",
      "えきにかえります",
      "がっこうへきます",
    ]) {
      expect(visible, rejected).not.toContain(rejected);
    }
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
        "analysis-habitual",
        "analysis-future",
        "interpretation-tag",
      ],
    });
    expect(design.promptTarget.predicateLexemeId).toBe(
      design.acceptedAnswerTarget.predicateLexemeId,
    );
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
