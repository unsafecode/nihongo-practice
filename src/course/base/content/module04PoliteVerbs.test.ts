import { describe, expect, it } from "vitest";
import { BASE_FIRST_TEACH_OWNERS, firstTeachLessonPosition } from "../catalog/firstTeach";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  realizePoliteNonpast,
  realizePoliteGrid,
  realizePoliteStem,
  realizeVerbDictionary,
} from "../forms/verbForms";
import { baseParticleSurfaceTokens } from "../forms/particleLicensing";
import { visibleSurfaceFingerprint } from "../validation/fingerprints";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateFirstTeachOrder, visibleJapaneseFor } from "../validation/sequenceRules";
import {
  BASE_POLITE_VERB_FORM_RECORDS,
  BASE_POLITE_VERBS_LESSONS,
  BASE_POLITE_VERBS_MODULE,
  BASE_POLITE_VERBS_VALIDATION_CATALOGS,
  task11Cue,
  task11Lexeme,
  task11Particle,
  validateBasePoliteVerbsModule,
} from "./module04PoliteVerbs";

function jp(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map(({ jp }) => jp).join("");
}

type ReviewEvidence = Readonly<{
  readonly contrastAxis: string;
  readonly heldConstantPredicateLexemeId: string | null;
  readonly optionAnalysisIds: readonly string[];
  readonly error:
    | Readonly<{
        readonly code: string;
        readonly defectAxis: string;
        readonly erroneousTargetId: string;
        readonly repairTargetId: string;
        readonly changedTokenSourceIds: readonly string[];
      }>
    | null;
}>;

function reviewEvidence(value: unknown): ReviewEvidence | undefined {
  return (
    value as {
      readonly reviewEvidence?: ReviewEvidence;
    }
  ).reviewEvidence;
}

function expectedForm(
  lemmaId: string,
  kind: typeof BASE_POLITE_VERB_FORM_RECORDS[number]["kind"],
): readonly { readonly jp: string }[] {
  if (kind === "dictionary") {
    const result = realizeVerbDictionary(lemmaId);
    expect(result.ok, `${lemmaId}:${kind}`).toBe(true);
    if (!result.ok) throw new Error(`${lemmaId}:${kind}`);
    return result.value;
  }
  if (kind === "polite-stem") {
    const result = realizePoliteStem(lemmaId);
    expect(result.ok, `${lemmaId}:${kind}`).toBe(true);
    if (!result.ok) throw new Error(`${lemmaId}:${kind}`);
    return result.value;
  }
  if (kind === "polite-nonpast") {
    const result = realizePoliteNonpast(lemmaId);
    expect(result.ok, `${lemmaId}:${kind}`).toBe(true);
    if (!result.ok) throw new Error(`${lemmaId}:${kind}`);
    return result.value;
  }
  const result = realizePoliteGrid(lemmaId);
  expect(result.ok, `${lemmaId}:${kind}`).toBe(true);
  if (!result.ok) throw new Error(`${lemmaId}:${kind}`);
  return kind === "nonpast-negative"
    ? result.value.negative
    : kind === "past-affirmative"
      ? result.value.pastAffirmative
      : result.value.pastNegative;
}

function requiredCopyIds(): readonly string[] {
  return BASE_POLITE_VERBS_MODULE.lessons.flatMap((lesson) => [
    lesson.titleCopyId,
    lesson.objectiveCopyId,
    lesson.content.recapCopyId,
    ...Object.values(lesson.explanation),
    ...lesson.examples.flatMap((example) => [
      example.teachingPurposeCopyId,
      "copyId" in example.translationCopy ? example.translationCopy.copyId : "",
    ]),
    ...lesson.content.activities.flatMap((activity) => [
      activity.instructionCopyId,
      activity.acceptedFeedbackCopyId,
      activity.retryFeedbackCopyId,
    ]),
    ...lesson.activityDesigns.map(({ promptContextCopyId }) => promptContextCopyId),
    ...(lesson.dialogue
      ? [
          lesson.dialogue.practicalOutcomeCopyId,
          ...lesson.dialogue.turnCopy.flatMap(({ purposeCopyId, translationCopyId }) => [
            purposeCopyId,
            translationCopyId,
          ]),
        ]
      : []),
  ]);
}

describe("Base polite-verbs module", () => {
  it("derives exact discourse and argument semantics for authored cue particles", () => {
    expect(
      task11Cue(
        task11Lexeme("noun-daigaku"),
        task11Particle("direction-he", "goal", "noun-daigaku"),
        task11Lexeme("noun-tanaka"),
        task11Particle("focus-subject-ga", "focus-subject", "noun-tanaka"),
        task11Lexeme("noun-yamada"),
        task11Particle("possessive-attributive-no", "possessor", "noun-yamada"),
        task11Lexeme("noun-mari"),
        task11Particle("listing-to", "listing", "noun-mari"),
      ).semanticRoleIds,
    ).toEqual(["direction", "focus-subject", "possessor", "listing"]);
  });

  it("publishes the exact lesson order, contracts, and prerequisites", () => {
    expect(
      BASE_POLITE_VERBS_LESSONS.map(
        ({ lessonId, contract, prerequisiteLessonIds }) => [
          lessonId,
          contract,
          prerequisiteLessonIds,
        ],
      ),
    ).toEqual([
      ["polite-verbs-1", "system", ["topic-questions-4"]],
      ["polite-verbs-2", "system", ["polite-verbs-1"]],
      ["polite-verbs-3", "system", ["polite-verbs-2"]],
      ["polite-verbs-4", "content", ["polite-verbs-3"]],
    ]);
  });

  it("meets production depth, sequence, dialogue, and 8+2 activity gates", () => {
    for (const lesson of BASE_POLITE_VERBS_MODULE.lessons) {
      expect(
        validateBaseLessonDepth(
          lesson.content,
          BASE_POLITE_VERBS_VALIDATION_CATALOGS,
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
    expect(BASE_POLITE_VERBS_MODULE.lessons.slice(0, 3).map(({ examples }) => examples.length))
      .toEqual([10, 10, 10]);
    expect(BASE_POLITE_VERBS_MODULE.lessons[3].examples.length).toBeGreaterThanOrEqual(6);
    expect(BASE_POLITE_VERBS_MODULE.lessons[3].dialogue?.turns.length).toBeGreaterThanOrEqual(4);
    expect(
      validateFirstTeachOrder(
        BASE_POLITE_VERBS_MODULE.sequence,
        BASE_FIRST_TEACH_OWNERS,
        BASE_POLITE_VERBS_VALIDATION_CATALOGS,
      ),
    ).toEqual([]);
    expect(validateBasePoliteVerbsModule(BASE_POLITE_VERBS_MODULE)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("derives every published dictionary, stem, and masu form from Task 7", () => {
    for (const record of BASE_POLITE_VERB_FORM_RECORDS) {
      expect(record.tokens).toEqual(expectedForm(record.lemmaId, record.kind));
      expect(record.tokens.every(Object.isFrozen)).toBe(true);
    }
    const byLemma = (lemmaId: string, kind: typeof BASE_POLITE_VERB_FORM_RECORDS[number]["kind"]) =>
      jp(
        BASE_POLITE_VERB_FORM_RECORDS.find(
          (record) => record.lemmaId === lemmaId && record.kind === kind,
        )?.tokens ?? [],
      );
    expect(byLemma("verb-kaeru", "polite-stem")).toBe("かえり");
    expect(byLemma("verb-taberu", "polite-stem")).toBe("たべ");
    expect(byLemma("verb-suru", "polite-stem")).toBe("し");
    expect(byLemma("verb-kuru", "polite-stem")).toBe("き");
  });

  it("assesses PV2 class analysis on the same lemma instead of unrelated meanings", () => {
    const lesson = BASE_POLITE_VERBS_MODULE.lessons[1];
    for (const design of lesson.activityDesigns.filter(
      ({ operation }) => operation !== "produce-spoken",
    )) {
      const evidence = reviewEvidence(design);
      expect(evidence?.contrastAxis, design.id).toBe("verb-class");
      expect(evidence?.heldConstantPredicateLexemeId, design.id).toBeTypeOf(
        "string",
      );
      expect(evidence?.optionAnalysisIds, design.id).toHaveLength(2);
      expect(new Set(evidence?.optionAnalysisIds).size, design.id).toBe(2);
      expect(
        design.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
        design.id,
      ).toEqual([
        evidence?.heldConstantPredicateLexemeId,
        evidence?.heldConstantPredicateLexemeId,
      ]);
    }
    const kaeru = lesson.activityDesigns[4];
    expect(kaeru.promptTarget.lexemeIds).toContain("verb-kaeru");
    expect(kaeru.optionTargets.map(({ conceptIds }) => conceptIds)).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(["godan-verb-class"]),
        expect.arrayContaining(["ichidan-verb-class"]),
      ]),
    );
  });

  it("holds the predicate constant for every visible verb-analysis contrast", () => {
    for (const lesson of BASE_POLITE_VERBS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        const evidence = reviewEvidence(design);
        if (
          !evidence ||
          !["meaning", "verb-class", "polite-stem", "polite-form"].includes(
            evidence.contrastAxis,
          ) ||
          design.optionTargets.length !== 2
        ) {
          continue;
        }
        expect(
          design.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
          design.id,
        ).toEqual([
          evidence.heldConstantPredicateLexemeId,
          evidence.heldConstantPredicateLexemeId,
        ]);
      }
    }
  });

  it("declares detectable structural errors and limits each diagnosis repair", () => {
    for (const [lessonIndex, activityIndex, code] of [
      [1, 4, "verb-class-mismatch"],
      [2, 5, "incorrect-ichidan-stem"],
      [3, 5, "malformed-polite-form"],
    ] as const) {
      const design =
        BASE_POLITE_VERBS_MODULE.lessons[lessonIndex].activityDesigns[
          activityIndex
        ];
      const error = reviewEvidence(design)?.error;
      expect(error, design.id).toMatchObject({
        code,
        erroneousTargetId: expect.any(String),
        repairTargetId: design.acceptedAnswerTargetId,
      });
      expect(error?.changedTokenSourceIds.length, design.id).toBeGreaterThan(0);
      expect(new Set(error?.changedTokenSourceIds).size, design.id).toBe(
        error?.changedTokenSourceIds.length,
      );
    }
  });

  it("removes pseudo-sentence form cards before argument particles", () => {
    const visible = BASE_POLITE_VERBS_MODULE.lessons
      .slice(0, 3)
      .flatMap((lesson) => [
        ...lesson.examples.map(({ tokens }) => jp(tokens)),
        ...lesson.activityDesigns.flatMap(
          ({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
            jp(promptTarget.tokens),
            ...optionTargets.map(({ tokens }) => jp(tokens)),
            jp(acceptedAnswerTarget.tokens),
          ],
        ),
      ]);
    for (const malformed of [
      "かぞく、よむ",
      "きっぷ、かう",
      "せんせい、はたらく",
      "わたし、のむ",
      "たなかさん、はたらく",
      "ぱん、のむ",
      "ぱん、かう",
      "よむ、がくせい",
      "ほん、よむ",
      "かぎ、かう",
      "がくせい、はたらく",
      "ともだち、あそぶ",
      "たなかさん、いえかえる",
      "まりさん、いえかえり",
      "すずきさん、いえし",
      "ともだち、うみおよぐ",
      "ともだち、ほんべんきょうし",
    ]) {
      expect(visible, malformed).not.toContain(malformed);
    }

    for (const target of BASE_POLITE_VERBS_MODULE.lessons[0].examples) {
      const commaIndex = target.tokens.findIndex(({ jp }) => jp === "、");
      if (commaIndex < 0) continue;
      expect(
        target.tokens.some(
          ({ source }) =>
            source.referenceId.startsWith("analysis-") ||
            source.referenceId === "dictionary-lemma" ||
            source.referenceId === "verb-predicate-recognition",
        ),
        jp(target.tokens),
      ).toBe(true);
    }
  });

  it("keeps PV2 and PV4 activity copy aligned with the authored analyses", () => {
    const copies = {
      pv2a3: [
        baseNavigationCopyEn.content[
          "polite-verbs-2-activity-3-accepted-feedback"
        ],
        baseNavigationCopyEn.content[
          "polite-verbs-2-activity-3-retry-feedback"
        ],
        baseNavigationCopyIt.content[
          "polite-verbs-2-activity-3-accepted-feedback"
        ],
        baseNavigationCopyIt.content[
          "polite-verbs-2-activity-3-retry-feedback"
        ],
      ].join(" "),
      pv4a1: [
        baseNavigationCopyEn.content[
          "polite-verbs-4-activity-1-instruction"
        ],
        baseNavigationCopyEn.content[
          "polite-verbs-4-activity-1-retry-feedback"
        ],
        baseNavigationCopyIt.content[
          "polite-verbs-4-activity-1-instruction"
        ],
        baseNavigationCopyIt.content[
          "polite-verbs-4-activity-1-retry-feedback"
        ],
      ].join(" "),
    };
    expect(copies.pv2a3.toLowerCase()).not.toMatch(
      /(?:final slot|keep (?:the )?tiles|posizione finale|mantieni (?:le )?tessere|がくせい)/u,
    );
    expect(copies.pv4a1.toLowerCase()).not.toMatch(
      /(?:sleep|sleeping|dormire|dormendo)/u,
    );
    const pv4a1 = BASE_POLITE_VERBS_MODULE.lessons[3].activityDesigns[0];
    expect(jp(pv4a1.promptTarget.tokens)).not.toContain("ねる、じしょ、いく、じしょ");
    expect(
      pv4a1.optionTargets.every(
        ({ predicateLexemeId }) => predicateLexemeId === "verb-okiru",
      ),
    ).toBe(true);
  });

  it("makes PV2 and PV4 listening depend on the recording", () => {
    const pv2 = BASE_POLITE_VERBS_MODULE.lessons[1].activityDesigns[8];
    expect(pv2.operation).toBe("identify-audio");
    expect(
      pv2.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
    ).toEqual(["verb-miru", "verb-miru"]);
    expect(pv2.optionTargets[0].conceptIds).toContain("ichidan-verb-class");
    expect(pv2.optionTargets[1].conceptIds).toContain("godan-verb-class");
    for (const option of pv2.optionTargets) {
      expect(option.tokens[0].source.referenceId).toBe("verb-miru");
      expect(
        option.tokens.some(
          ({ source }) => source.referenceId === "analysis-source",
        ),
      ).toBe(true);
    }

    const pv3 = BASE_POLITE_VERBS_MODULE.lessons[2].activityDesigns[8];
    expect(pv3.operation).toBe("identify-audio");
    expect(
      pv3.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
    ).toEqual(["verb-miru", "verb-miru"]);
    expect(
      pv3.optionTargets.some(({ tokens }) =>
        tokens.some(
          ({ source }) => source.referenceId === "analysis-dictionary",
        ),
      ),
    ).toBe(false);
    expect(
      pv3.optionTargets.map(({ tokens }) =>
        tokens
          .filter(({ kind }) => kind !== "punctuation")
          .at(-1)?.jp,
      ),
    ).toEqual(["み", "みり"]);

    const pv4 = BASE_POLITE_VERBS_MODULE.lessons[3].activityDesigns[8];
    expect(pv4.operation).toBe("identify-audio");
    expect(
      pv4.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
    ).toEqual(["verb-hataraku", "verb-hataraku"]);
    expect(
      pv4.optionTargets.every(({ tokens }) =>
        tokens.some(({ source }) => source.referenceId === "masu"),
      ),
    ).toBe(true);
    expect(
      pv4.optionTargets.map(({ tokens }) =>
        tokens.some(({ source }) => source.referenceId === "question-ka"),
      ),
    ).toEqual([false, true]);
  });

  it("makes the PV1 spoken analysis recoverable from a clause context", () => {
    const lesson = BASE_POLITE_VERBS_MODULE.lessons[0];
    const spoken = lesson.activityDesigns[9];
    expect(spoken.operation).toBe("produce-spoken");
    for (const locale of [
      baseNavigationCopyEn.content[
        lesson.content.activities[9].instructionCopyId
      ],
      baseNavigationCopyIt.content[
        lesson.content.activities[9].instructionCopyId
      ],
    ]) {
      expect(locale).toMatch(/(?:clause|frase)/iu);
      expect(locale).not.toContain(spoken.acceptedAnswers[0]);
    }
  });

  it("grounds PV2/PV3 prompts in the exact verb being analyzed", () => {
    const pv2a3 = BASE_POLITE_VERBS_MODULE.lessons[1].activityDesigns[2];
    expect(pv2a3.promptTarget.lexemeIds).toContain("verb-taberu");
    expect(pv2a3.promptTarget.lexemeIds).not.toContain("noun-gakusei");

    const pv3 = BASE_POLITE_VERBS_MODULE.lessons[2].activityDesigns;
    expect(pv3[0].promptTarget.lexemeIds).toContain("verb-kaku");
    expect(pv3[0].promptTarget.lexemeIds).not.toContain("verb-matsu");
    expect(pv3[3].promptTarget.lexemeIds).toContain("verb-suru");
    expect(pv3[3].promptTarget.lexemeIds).not.toContain("noun-satou");
  });

  it("uses a genuine multi-part semantic operation for PV1 A5", () => {
    const design = BASE_POLITE_VERBS_MODULE.lessons[0].activityDesigns[4];
    expect(design.operation).not.toBe("order-chunks");
    for (const option of design.optionTargets) {
      expect(
        option.tokens.filter(({ kind }) => kind !== "punctuation").length,
      ).toBeGreaterThanOrEqual(3);
    }
    expect(
      baseNavigationCopyEn.content[
        "polite-verbs-1-activity-5-instruction"
      ].toLowerCase(),
    ).not.toMatch(/(?:left|first|begins|order)/u);
    expect(
      baseNavigationCopyIt.content[
        "polite-verbs-1-activity-5-instruction"
      ].toLowerCase(),
    ).not.toMatch(/(?:sinistr|prima|inizia|ordina)/u);
  });

  it("does not derive half of PV4 practice by swapping only wa and mo", () => {
    const lesson = BASE_POLITE_VERBS_MODULE.lessons[3];
    const normalizeDiscourse = (
      target: (typeof lesson.examples)[number] | (typeof lesson.activityDesigns)[number]["acceptedAnswerTarget"],
    ) =>
      target.tokens
        .map(({ jp, source }) =>
          source.referenceId === "topic-wa" ||
          source.referenceId === "additive-mo"
            ? "<discourse>"
            : jp,
        )
        .join("");
    const examples = new Set(lesson.examples.map(normalizeDiscourse));
    for (const index of [3, 4, 6, 7]) {
      const design = lesson.activityDesigns[index];
      expect(
        examples.has(normalizeDiscourse(design.acceptedAnswerTarget)),
        design.id,
      ).toBe(false);
    }
  });

  it("uses full same-lemma clauses for every PV4 form competitor", () => {
    const lesson = BASE_POLITE_VERBS_MODULE.lessons[3];
    for (const index of [0, 1, 3, 4, 5, 6, 7, 8]) {
      const design = lesson.activityDesigns[index];
      expect(design.optionTargets).toHaveLength(2);
      expect(
        design.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
        design.id,
      ).toEqual([
        design.reviewEvidence.heldConstantPredicateLexemeId,
        design.reviewEvidence.heldConstantPredicateLexemeId,
      ]);
      for (const option of design.optionTargets) {
        expect(
          option.semanticRoleIds.some(
            (role) => role === "topic" || role === "additive-topic",
          ),
          design.id,
        ).toBe(true);
        expect(
          option.tokens.some(
            ({ source }) =>
              source.referenceId === "topic-wa" ||
              source.referenceId === "additive-mo",
          ),
          `${design.id}:${jp(option.tokens)}`,
        ).toBe(true);
        expect(jp(option.tokens).length).toBeGreaterThan(4);
      }
    }
  });

  it("rejects frameless PV4 additive mutations independently of conceptIds", () => {
    const lessonRecord = BASE_POLITE_VERBS_MODULE.lessons[3];
    const lesson = lessonRecord.content;
    const design = lessonRecord.activityDesigns[3];
    const original = design.acceptedAnswerTarget;
    expect(jp(original.tokens)).toContain("も");
    expect(
      (original as typeof original & { readonly particleBindings?: unknown })
        .particleBindings,
    ).toBeDefined();
    const additiveIndex = original.tokens.findIndex(
      ({ source }) => source.referenceId === "additive-mo",
    );
    const nounIndex = additiveIndex - 1;
    const replaceAccepted = (target: typeof original) => {
      const catalogs = {
        ...BASE_POLITE_VERBS_VALIDATION_CATALOGS,
        acceptedAnswerTargets: new Map([
          ...BASE_POLITE_VERBS_VALIDATION_CATALOGS.acceptedAnswerTargets,
          [design.acceptedAnswerTargetId, target],
        ]),
      };
      return validateBaseLessonDepth(lesson, catalogs).map(({ code }) => code);
    };
    const mutations = [
      {
        ...original,
        tokens: original.tokens.filter((_, index) => index !== additiveIndex),
        conceptIds: ["topic-wa", "additive-mo"],
      },
      {
        ...original,
        tokens: original.tokens.map((token, index) =>
          index === additiveIndex
            ? { ...baseParticleSurfaceTokens("topic-wa")[0], id: token.id }
            : token,
        ),
        conceptIds: ["additive-mo"],
      },
      {
        ...original,
        tokens: [
          ...original.tokens,
          {
            ...baseParticleSurfaceTokens("topic-wa")[0],
            id: "adversarial-extra-topic",
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
        conceptIds: ["additive-mo", "topic-wa"],
      },
    ];
    for (const mutation of mutations) {
      expect(replaceAccepted(mutation), jp(mutation.tokens)).toContain(
        "particle-frame-token-mismatch",
      );
    }
  });

  it("teaches lookup lemmas, then classes, then stems, then productive masu", () => {
    const owner = (contentId: string) =>
      BASE_FIRST_TEACH_OWNERS.find(({ contentId: id }) => id === contentId)?.lessonId;
    expect(owner("dictionary-lemma")).toBe("polite-verbs-1");
    expect(owner("verb-predicate-recognition")).toBe("polite-verbs-1");
    expect(owner("godan-verb-class")).toBe("polite-verbs-2");
    expect(owner("ichidan-verb-class")).toBe("polite-verbs-2");
    expect(owner("polite-stems")).toBe("polite-verbs-3");
    expect(owner("masu-nonpast")).toBe("polite-verbs-4");
    expect(firstTeachLessonPosition(owner("godan-verb-class")!)).toBeLessThan(
      firstTeachLessonPosition(owner("polite-stems")!)!,
    );
    expect(firstTeachLessonPosition(owner("polite-stems")!)).toBeLessThan(
      firstTeachLessonPosition(owner("masu-nonpast")!)!,
    );
  });

  it("advances the exact owned reference snapshots without future rows", () => {
    expect(
      BASE_POLITE_VERBS_MODULE.lessons.map(
        ({ content }) => content.referenceSnapshotIds,
      ),
    ).toEqual(
      Array.from({ length: 4 }, () => [
        "sentence-anatomy",
        "particle-atlas",
        "verb-classes-conjugation",
      ]),
    );
  });

  it("keeps argument particles and later forms out of productive Module 4 surfaces", () => {
    const visible = visibleJapaneseFor(
      BASE_POLITE_VERBS_MODULE.sequence.slice(-4),
      BASE_POLITE_VERBS_VALIDATION_CATALOGS,
    );
    expect(visible).not.toContain("ています");
    const forbiddenArgumentSenses = new Set([
      "object-o",
      "goal-ni",
      "direction-he",
      "action-place-de",
      "means-de",
      "time-ni",
      "source-kara",
      "limit-made",
    ]);
    for (const lesson of BASE_POLITE_VERBS_MODULE.lessons) {
      for (const target of [
        ...lesson.examples,
        ...(lesson.dialogue?.turns ?? []),
        ...lesson.activityDesigns.flatMap(({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
          promptTarget,
          ...optionTargets,
          acceptedAnswerTarget,
        ]),
      ]) {
        expect(
          target.tokens.some(
            ({ kind, source }) =>
              kind === "particle" &&
              forbiddenArgumentSenses.has(source.referenceId),
          ),
        ).toBe(false);
        expect(target.formIds).not.toContain("four-polite-tense-cells");
        expect(target.formIds).not.toContain("te-imasu");
        expect(target.interpretationTags).not.toContain("ongoing-now");
      }
    }
  });

  it("uses only owned masu predicates in the practical lesson", () => {
    const lesson = BASE_POLITE_VERBS_MODULE.lessons[3];
    for (const target of [...lesson.examples, ...(lesson.dialogue?.turns ?? [])]) {
      expect(target.formIds).toContain("masu-nonpast");
      expect(jp(target.tokens)).toContain("ます");
      expect(target.predicateAspect).toBe("dynamic");
      expect(target.interpretationTags.some((tag) => tag === "habitual" || tag === "future"))
        .toBe(true);
    }
  });

  it("uses and retrieves every genuinely new lexeme in its owning lesson", () => {
    for (const lesson of BASE_POLITE_VERBS_MODULE.lessons) {
      const visible = new Set(lesson.examples.flatMap(({ lexemeIds }) => lexemeIds));
      lesson.dialogue?.turns.forEach(({ lexemeIds }) =>
        lexemeIds.forEach((id) => visible.add(id)),
      );
      const retrieved = new Set(
        lesson.activityDesigns
          .filter(({ mode }) => mode === "non-spoken")
          .flatMap(({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
            ...promptTarget.lexemeIds,
            ...optionTargets.flatMap(({ lexemeIds }) => lexemeIds),
            ...acceptedAnswerTarget.lexemeIds,
          ]),
      );
      for (const id of lesson.content.newLexemeIds) {
        expect(BASE_LEXEME_BY_ID.get(id)?.firstTeachLessonId).toBe(
          lesson.content.lessonId,
        );
        expect(visible.has(id), `visible:${id}`).toBe(true);
        expect(retrieved.has(id), `retrieved:${id}`).toBe(true);
      }
    }
  });

  it("publishes independent EN and IT copy for every visible copy ID", () => {
    for (const id of requiredCopyIds()) {
      expect(baseNavigationCopyEn.content[id], `EN:${id}`).toBeTypeOf("string");
      expect(baseNavigationCopyIt.content[id], `IT:${id}`).toBeTypeOf("string");
      expect(baseNavigationCopyEn.content[id].trim()).not.toBe("");
      expect(baseNavigationCopyIt.content[id].trim()).not.toBe("");
      expect(baseNavigationCopyEn.content[id]).not.toBe(baseNavigationCopyIt.content[id]);
    }
  });

  it("does not recycle examples or dialogue turns as accepted answers", () => {
    for (const lesson of BASE_POLITE_VERBS_MODULE.lessons) {
      const preAttempt = new Set([
        ...lesson.examples.map(({ tokens }) => visibleSurfaceFingerprint(tokens)),
        ...(lesson.dialogue?.turns.map(({ tokens }) => visibleSurfaceFingerprint(tokens)) ?? []),
      ]);
      for (const { acceptedAnswerTarget } of lesson.activityDesigns) {
        expect(preAttempt.has(visibleSurfaceFingerprint(acceptedAnswerTarget.tokens))).toBe(false);
      }
    }
  });

  it("fails closed for malformed module data and exports deep-frozen snapshots", () => {
    expect(Object.isFrozen(BASE_POLITE_VERBS_MODULE)).toBe(true);
    expect(Object.isFrozen(BASE_POLITE_VERBS_MODULE.lessons[0].examples)).toBe(true);
    const sparse = new Array(4);
    sparse[0] = BASE_POLITE_VERBS_MODULE.lessons[0];
    expect(
      validateBasePoliteVerbsModule({
        ...BASE_POLITE_VERBS_MODULE,
        lessons: sparse,
      }),
    ).toMatchObject({ ok: false });
    const inherited = Object.create(BASE_POLITE_VERBS_MODULE);
    expect(validateBasePoliteVerbsModule(inherited)).toMatchObject({ ok: false });
    const hostile = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw new Error("hostile prototype trap");
        },
      },
    );
    expect(() => validateBasePoliteVerbsModule(hostile)).not.toThrow();
    expect(validateBasePoliteVerbsModule(hostile)).toMatchObject({ ok: false });
  });
});
