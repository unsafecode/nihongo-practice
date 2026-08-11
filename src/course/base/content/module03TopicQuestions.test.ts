import { describe, expect, it } from "vitest";
import {
  BASE_FIRST_TEACH_OWNERS,
  BASE_PARTICLE_SENSE_FIRST_TEACH_OWNER_BY_SENSE,
} from "../catalog/firstTeach";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateFirstTeachOrder, visibleJapaneseFor } from "../validation/sequenceRules";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  BASE_TOPIC_QUESTIONS_EXAMPLES,
  BASE_TOPIC_QUESTIONS_LESSONS,
  BASE_TOPIC_QUESTIONS_MODULE,
  BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
  module03ConceptIds,
  validateBaseTopicQuestionsModule,
} from "./module03TopicQuestions";
import { baseActivityPromptKey } from "../catalog/visibleTargets";
import { BASE_SENTENCE_FOUNDATIONS_MODULE } from "./module02SentenceFoundations";

function jp(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map(({ jp }) => jp).join("");
}

function normalized(tokens: readonly { readonly jp: string }[]): string {
  return jp(tokens).normalize("NFKC").replace(/[、。◇◎●♪↺]/g, "").replace(/ですか?$/, "");
}

function surfaceFingerprint(tokens: readonly { readonly jp: string }[]): string {
  return jp(tokens)
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[、。？！?!]+$/g, "");
}

function particleSenses(target: {
  readonly tokens: readonly {
    readonly kind: string;
    readonly source: { readonly referenceId: string };
  }[];
}): readonly string[] {
  return target.tokens
    .filter(({ kind }) => kind === "particle")
    .map(({ source }) => source.referenceId);
}

describe("Base topic-questions module", () => {
  it("publishes the exact stable route order and contracts", () => {
    expect(BASE_TOPIC_QUESTIONS_LESSONS.map(({ lessonId, contract }) => [
      lessonId,
      contract,
    ])).toEqual([
      ["topic-questions-1", "system"],
      ["topic-questions-2", "system"],
      ["topic-questions-3", "system"],
      ["topic-questions-4", "content"],
    ]);
    expect(BASE_TOPIC_QUESTIONS_LESSONS.map(({ prerequisiteLessonIds }) =>
      prerequisiteLessonIds,
    )).toEqual([
      ["sentence-foundations-4"],
      ["topic-questions-1"],
      ["topic-questions-2"],
      ["topic-questions-3"],
    ]);
  });

  it("passes real production depth and sequence gates with sentence prerequisites", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_LESSONS) {
      expect(
        validateBaseLessonDepth(
          lesson,
          BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
        ),
      ).toEqual([]);
    }
    expect(
      validateFirstTeachOrder(
        BASE_TOPIC_QUESTIONS_MODULE.sequence,
        BASE_FIRST_TEACH_OWNERS,
        BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
      ),
    ).toEqual([]);
    expect(validateBaseTopicQuestionsModule(BASE_TOPIC_QUESTIONS_MODULE)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("owns particle senses progressively and keeps possessive no bounded", () => {
    const owner = (sense: Parameters<
      typeof BASE_PARTICLE_SENSE_FIRST_TEACH_OWNER_BY_SENSE.get
    >[0]) =>
      BASE_PARTICLE_SENSE_FIRST_TEACH_OWNER_BY_SENSE.get(sense)?.lessonId;
    expect(owner("topic-wa")).toBe("topic-questions-1");
    expect(owner("focus-subject-ga")).toBe("topic-questions-2");
    expect(owner("possessive-attributive-no")).toBe("topic-questions-3");
    expect(owner("additive-mo")).toBe("topic-questions-3");
    expect(owner("nominal-to")).toBe("topic-questions-3");
    expect(owner("listing-to")).toBe("topic-questions-3");
    expect(owner("companion-to")).toBe("topic-questions-3");
    expect(owner("question-ka")).toBe("topic-questions-4");
    expect(owner("interactional-ne" as never)).toBe("topic-questions-4");
    expect(owner("interactional-yo" as never)).toBe("topic-questions-4");
    expect(module03ConceptIds).toContain("possessive-no");
    expect(module03ConceptIds).not.toContain("explanatory-no");
  });

  it("implements the authoritative TQ3 and TQ4 concept sequence", () => {
    const [,, tq3, tq4] = BASE_TOPIC_QUESTIONS_MODULE.lessons;
    expect(tq3.content.introducedConceptIds).toEqual(
      expect.arrayContaining([
        "possessive-no",
        "additive-mo",
        "nominal-listing-to",
        "companion-to",
      ]),
    );
    expect(tq3.content.introducedConceptIds).not.toContain("modifier-before-noun");
    expect(tq3.content.reviewedConceptIds).toContain("modifier-before-noun");
    expect(tq4.content.introducedConceptIds).toEqual(
      expect.arrayContaining(["question-ka", "interactional-ne", "interactional-yo"]),
    );
    expect(tq4.content.introducedConceptIds).not.toContain("companion-to");
    expect(tq3.patternCellIds).toEqual(
      expect.arrayContaining([
        "tq3-attributive-no",
        "tq3-additive-mo",
        "tq3-nominal-list",
        "tq3-companion",
      ]),
    );
    expect(tq4.patternCellIds).toEqual(
      expect.arrayContaining([
        "tq4-question-answer",
        "tq4-interactional-ne",
        "tq4-interactional-yo",
      ]),
    );
  });

  it("uses hiragana-first country spellings and no unowned katakana", () => {
    const visible = visibleJapaneseFor(
      BASE_TOPIC_QUESTIONS_MODULE.sequence,
      BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
    );
    expect(visible).toContain("にほん");
    expect(visible).toContain("ちゅうごく");
    expect(visible).not.toMatch(/[\u30A0-\u30FF]/u);
  });

  it("uses negative polarity for correction and grammatical question competitors", () => {
    const tq2Diagnosis = BASE_TOPIC_QUESTIONS_MODULE.lessons[1].activityDesigns[5];
    expect(jp(tq2Diagnosis.acceptedAnswerTarget.tokens)).toBe(
      "すずきさんがせんせいです",
    );
    const tq4 = BASE_TOPIC_QUESTIONS_MODULE.lessons[3];
    expect(jp(tq4.activityDesigns[5].acceptedAnswerTarget.tokens)).toBe(
      "いいえ、くにはにほんですよ",
    );
    expect(jp(tq4.activityDesigns[6].acceptedAnswerTarget.tokens)).not.toBe(
      jp(tq4.activityDesigns[5].acceptedAnswerTarget.tokens),
    );
    const visible = tq4.activityDesigns.flatMap(
      ({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
        jp(promptTarget.tokens),
        jp(acceptedAnswerTarget.tokens),
        ...optionTargets.map(({ tokens }) => jp(tokens)),
      ],
    );
    expect(visible.some((surface) => surface.includes("だれは"))).toBe(false);
  });

  it("keeps spoken grading targets hidden from learner-visible options", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const index = lesson.activityDesigns.findIndex(
        ({ operation }) => operation === "produce-spoken",
      );
      const design = lesson.activityDesigns[index] as typeof lesson.activityDesigns[number] & {
        readonly acceptedAnswerTargetId?: string;
      };
      expect(design.optionTargetIds).toEqual([]);
      expect(design.optionTargets).toEqual([]);
      expect(design.correctOptionIndex).toBeNull();
      expect(design.acceptedAnswerTargetId).toBe(
        lesson.content.activities[index].targetId,
      );
      expect(lesson.content.activities[index].optionTargetIds).toEqual([]);
    }
  });

  it("has no accidental normalized example reuse across the eight lessons", () => {
    const allLessons = [
      ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons,
      ...BASE_TOPIC_QUESTIONS_MODULE.lessons,
    ];
    const seen = new Map<string, string>();
    for (const lesson of allLessons) {
      for (const example of lesson.examples) {
        const surface = surfaceFingerprint(example.tokens);
        expect(seen.get(surface), surface).toBeUndefined();
        seen.set(surface, lesson.content.lessonId);
      }
    }
  });

  it("never reuses a worked example or dialogue fingerprint as an accepted answer", () => {
    const duplicates: string[] = [];
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const preAttempt = new Set([
        ...lesson.examples.map(({ tokens }) => surfaceFingerprint(tokens)),
        ...(lesson.dialogue?.turns.map(({ tokens }) => surfaceFingerprint(tokens)) ?? []),
      ]);
      for (const { acceptedAnswerTarget } of lesson.activityDesigns) {
        if (preAttempt.has(surfaceFingerprint(acceptedAnswerTarget.tokens))) {
          duplicates.push(`${lesson.content.lessonId}:${jp(acceptedAnswerTarget.tokens)}`);
        }
      }
    }
    expect(duplicates).toEqual([]);
  });

  it("keeps every practice and audio target distinct from pre-attempt surfaces", () => {
    for (const lesson of [
      ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons,
      ...BASE_TOPIC_QUESTIONS_MODULE.lessons,
    ]) {
      const preAttempt = new Set([
        ...lesson.examples.map(({ tokens }) => surfaceFingerprint(tokens)),
        ...("dialogue" in lesson
          ? lesson.dialogue?.turns.map(({ tokens }) => surfaceFingerprint(tokens)) ?? []
          : []),
      ]);
      const collisions = lesson.activityDesigns.flatMap(
        ({ optionTargets, acceptedAnswerTarget }) =>
          [acceptedAnswerTarget, ...optionTargets]
            .filter((target) => preAttempt.has(surfaceFingerprint(target.tokens)))
            .map((target) => jp(target.tokens)),
      );
      expect(collisions, lesson.content.lessonId).toEqual([]);
    }
  });

  it("publishes unique normalized practice surfaces within each lesson", () => {
    for (const lesson of [
      ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons,
      ...BASE_TOPIC_QUESTIONS_MODULE.lessons,
    ]) {
      const surfaces = lesson.activityDesigns.flatMap(
        ({ optionTargets, acceptedAnswerTarget }) =>
          [...optionTargets, ...(optionTargets.length === 0 ? [acceptedAnswerTarget] : [])].map((target) =>
            surfaceFingerprint(target.tokens),
          ),
      );
      const counts = new Map<string, number>();
      surfaces.forEach((surface) => counts.set(surface, (counts.get(surface) ?? 0) + 1));
      expect(
        [...counts].filter(([, count]) => count > 1).map(([surface]) => surface),
        lesson.content.lessonId,
      ).toEqual([]);
    }
  });

  it("keeps normalized dialogue turns distinct from worked examples", () => {
    const tq4 = BASE_TOPIC_QUESTIONS_MODULE.lessons[3];
    const examples = new Set(
      tq4.examples.map(({ tokens }) => surfaceFingerprint(tokens)),
    );
    expect(
      tq4.dialogue?.turns.filter(({ tokens }) =>
        examples.has(surfaceFingerprint(tokens)),
      ),
    ).toEqual([]);
  });

  it("uses peer countries for TQ3 listing transfer", () => {
    expect(
      jp(
        BASE_TOPIC_QUESTIONS_MODULE.lessons[2].activityDesigns[6]
          .acceptedAnswerTarget.tokens,
      ),
    ).toBe("ちゅうごくとにほんです");
  });

  it("keeps TQ2 spoken focus in person-ga-role order", () => {
    const spoken = BASE_TOPIC_QUESTIONS_MODULE.lessons[1].activityDesigns[9];
    expect(jp(spoken.promptTarget.tokens)).toBe("ひと");
    expect(jp(spoken.acceptedAnswerTarget.tokens)).toBe(
      "わたしがだいがくせいです",
    );
    expect(spoken.worldFactId).toBe("speaker-role");
  });

  it("moves TQ2 transformation to Mari's distinct relationship fact", () => {
    const activity = BASE_TOPIC_QUESTIONS_MODULE.lessons[1].activityDesigns[4];
    expect(jp(activity.promptTarget.tokens)).toBe("まりさん、ともだちです");
    expect(jp(activity.acceptedAnswerTarget.tokens)).toBe(
      "まりさんがともだちです",
    );
    expect(activity.worldFactId).toBe("mari-relationship");
  });

  it("keeps omission prompts from exposing their accepted chunks", () => {
    const sf2 = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons[1].activityDesigns;
    expect(jp(sf2[4].promptTarget.tokens)).toBe("でんわ、がっこう");
    expect(jp(sf2[6].promptTarget.tokens)).toBe("しゃしん");
    expect(jp(sf2[7].promptTarget.tokens)).toBe("がっこう");
    const sf4 = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons[3].activityDesigns;
    expect(jp(sf4[4].promptTarget.tokens)).toBe("わたし");
    for (const design of [sf2[4], sf2[6], sf2[7], sf4[4]]) {
      expect(design.promptTarget.lexemeIds).not.toEqual(
        expect.arrayContaining([...design.acceptedAnswerTarget.lexemeIds]),
      );
    }
  });

  it("keeps the dialogue role and country facts explicit and coherent", () => {
    const tq4 = BASE_TOPIC_QUESTIONS_MODULE.lessons[3];
    expect(jp(tq4.dialogue?.turns[0].tokens ?? [])).toBe("ゆきさんですか");
    expect(jp(tq4.dialogue?.turns[1].tokens ?? [])).toBe("はい、ゆきです");
    expect(jp(tq4.dialogue?.turns[2].tokens ?? [])).toBe(
      "ゆきさんのくにはにほんですか",
    );
    expect(
      baseNavigationCopyEn.content[
        "topic-questions-4-clarification-dialogue-turn-3-translation"
      ],
    ).toBe("Is Yuki's country Japan?");
    expect(
      baseNavigationCopyIt.content[
        "topic-questions-4-clarification-dialogue-turn-3-translation"
      ],
    ).toBe("Il paese di Yuki è il Giappone?");
    expect(
      baseNavigationCopyEn.content[
        "topic-questions-4-clarification-dialogue-turn-3-purpose"
      ],
    ).not.toMatch(/は/);
  });

  it("classifies SF4 A5 as meaning selection rather than transformation", () => {
    const activity = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons[3].activityDesigns[4];
    expect(activity.category).toBe("meaning-comprehension");
    expect(activity.operation).toBe("recognize-meaning");
    expect(activity.operationEvidence.kind).toBe("recognize-meaning");
  });

  it("grounds reviewed contexts in the actual visible scene or fact", () => {
    const copy = baseNavigationCopyEn.content;
    expect(copy["sentence-foundations-1-activity-1-instruction"]).toMatch(
      /foreground|speaker badge/i,
    );
    expect(copy["sentence-foundations-3-activity-4-instruction"]).toMatch(
      /highlights.*school building/i,
    );
    expect(copy["sentence-foundations-3-activity-6-instruction"]).toMatch(
      /key.*displayed|displayed.*key/i,
    );
    expect(copy["topic-questions-1-activity-1-instruction"]).toMatch(
      /tokyo skyline|capital skyline/i,
    );
    expect(jp(BASE_TOPIC_QUESTIONS_MODULE.lessons[3].activityDesigns[3].optionTargets[1].tokens))
      .toBe("ともだちはだれですか");
  });

  it("keeps wind, companion gloss, and spoken focus context semantically bounded", () => {
    expect(baseNavigationCopyEn.content["sentence-foundations-1-activity-10-instruction"])
      .toMatch(/wind/i);
    expect(baseNavigationCopyEn.content["sentence-foundations-1-activity-10-instruction"])
      .not.toMatch(/cold|symptom/i);
    expect(baseNavigationCopyEn.content["topic-questions-3-example-10-translation"])
      .toBe("This person is my friend.");
    expect(baseNavigationCopyIt.content["topic-questions-3-example-10-translation"])
      .toBe("Questa persona è mia amica o un mio amico.");

    const tq2 = BASE_TOPIC_QUESTIONS_MODULE.lessons[1];
    const spoken = tq2.activityDesigns[9];
    expect(surfaceFingerprint(spoken.promptTarget.tokens)).not.toBe(
      surfaceFingerprint(tq2.examples[9].tokens),
    );
    expect(spoken.promptTarget.lexemeIds).not.toContain("noun-watashi");
    expect(spoken.promptTarget.lexemeIds).not.toContain("noun-daigakusei");
  });

  it("requires learner-visible grounding metadata for every world fact", () => {
    for (const lesson of [
      ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons,
      ...BASE_TOPIC_QUESTIONS_MODULE.lessons,
    ]) {
      for (const design of lesson.activityDesigns) {
        if (!design.worldFactId) continue;
        expect(design.referentId).toBeTruthy();
        expect(design.promptContextCopyId).toBeTruthy();
      }
    }
  });

  it("grounds the two spoken recalls in visible lesson facts", () => {
    const sf2 = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons[1].activityDesigns[9];
    expect(jp(sf2.promptTarget.tokens)).toBe("しゃしん");
    expect(jp(sf2.acceptedAnswerTarget.tokens)).toBe("でんわ");

    const tq1 = BASE_TOPIC_QUESTIONS_MODULE.lessons[0].activityDesigns[9];
    expect(jp(tq1.promptTarget.tokens)).toBe("きっぷ");
    expect(jp(tq1.acceptedAnswerTarget.tokens)).toBe("おおさかです");
    expect(tq1.worldFactId).toBe("ticket-destination-osaka");
  });

  it("uses native hiragana-first country nouns instead of loanword spellings", () => {
    const visible = visibleJapaneseFor(
      BASE_TOPIC_QUESTIONS_MODULE.sequence,
      BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
    );
    expect(visible).toContain("にほん");
    expect(visible).toContain("ちゅうごく");
    expect(visible).not.toMatch(/アメリカ|イタリア|あめりか|いたりあ/u);
  });

  it("authors distinct, semantically linked TQ2 prompts", () => {
    const tq2 = BASE_TOPIC_QUESTIONS_MODULE.lessons[1];
    const prompts = tq2.activityDesigns.map(({ promptTarget }) =>
      normalized(promptTarget.tokens),
    );
    expect(new Set(prompts).size).toBe(prompts.length);
    expect(prompts.slice(6)).toEqual([
      "かんごし",
      "べんごし",
      "りゅうがくせい",
      "ひと",
    ]);
  });

  it("links selection prompts to every option or to an explicit shared fact", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        if (
          ["order-chunks", "transform-form", "diagnose-error", "identify-audio", "produce-spoken"]
            .includes(design.operation)
        ) {
          continue;
        }
        const promptLexemes = design.promptTarget.lexemeIds;
        const shared = promptLexemes.some((id) =>
          design.optionTargets.every(({ lexemeIds }) => lexemeIds.includes(id)),
        );
        expect(
          shared || (design.worldFactId !== null && design.referentId !== null),
          `${lesson.content.lessonId}:${design.id}`,
        ).toBe(true);
      }
    }
  });

  it("does not describe wa-marked examples as focused", () => {
    const tq2 = BASE_TOPIC_QUESTIONS_MODULE.lessons[1];
    tq2.examples.forEach((example, index) => {
      if (!particleSenses(example).includes("topic-wa")) return;
      const purposeId = `topic-questions-2-example-${index + 1}-purpose`;
      expect(baseNavigationCopyEn.content[purposeId]).not.toMatch(/focus/i);
      expect(baseNavigationCopyIt.content[purposeId]).not.toMatch(/focal/i);
    });
  });

  it("uses shared fact ids only for factual activities", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        expect(design.worldFactId ?? "").not.toMatch(/-fact-\d+$/);
        if (!design.worldFactId) {
          expect(design.operationEvidence.errorCode).not.toBe(
            "world-fact-mismatch",
          );
        }
      }
    }
  });

  it("has system/content example density plus a genuine additional clarification dialogue", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons.slice(0, 3)) {
      expect(lesson.examples.length).toBeGreaterThanOrEqual(10);
      expect(lesson.examples.length).toBeLessThanOrEqual(14);
    }
    const practical = BASE_TOPIC_QUESTIONS_MODULE.lessons[3];
    expect(practical.examples.length).toBeGreaterThanOrEqual(6);
    expect(practical.examples.length).toBeLessThanOrEqual(10);
    expect(practical.dialogue?.turns.length).toBeGreaterThanOrEqual(4);
    expect(practical.dialogue?.turns.length).toBeLessThanOrEqual(8);
    const exampleSurfaces = new Set(
      practical.examples.map(({ tokens }) => tokens.map(({ jp }) => jp).join("")),
    );
    expect(
      practical.dialogue?.turns.every(
        ({ tokens }) => !exampleSurfaces.has(tokens.map(({ jp }) => jp).join("")),
      ),
    ).toBe(true);
    expect(new Set(practical.dialogue?.turns.map(({ speakerId }) => speakerId)).size)
      .toBeGreaterThanOrEqual(2);
    expect(practical.dialogue?.outcome).toBe("identity-clarified");
  });

  it("uses socially correct family terms", () => {
    const tq3 = BASE_TOPIC_QUESTIONS_MODULE.lessons[2];
    const surfaces = [
      ...tq3.examples.map(({ tokens }) => jp(tokens)),
      ...tq3.activityDesigns.flatMap(({ promptTarget, optionTargets }) => [
        jp(promptTarget.tokens),
        ...optionTargets.map(({ tokens }) => jp(tokens)),
      ]),
    ].join("\n");
    expect(surfaces).not.toMatch(/(?:たなかさん|やまださん|さとうさん|すずきさん|まりさん)の(?:ちち|はは|あに|あね)/);
    expect(surfaces).toMatch(/たなかさんのおとうさん/);
    expect(surfaces).toMatch(/やまださんのおかあさん/);
  });

  it("keeps the shared character ledger consistent", () => {
    expect(BASE_TOPIC_QUESTIONS_MODULE.worldFacts).toEqual({
      speaker: "university-student",
      tanaka: "nurse",
      yamada: "lawyer",
      satou: "student",
      suzuki: "teacher",
      mari: "doctor",
      yukiCountry: "japan",
      speakerCity: "tokyo",
    });
  });

  it("has a coherent six-turn name, country, and companion clarification", () => {
    const dialogue = BASE_TOPIC_QUESTIONS_MODULE.lessons[3].dialogue;
    expect(dialogue?.turns.map(({ tokens }) => jp(tokens))).toEqual([
      "ゆきさんですか",
      "はい、ゆきです",
      "ゆきさんのくにはにほんですか",
      "はい、にほんです",
      "たなかさんとともだちですか",
      "はい、そうですよ",
    ]);
    expect(dialogue?.referentLedger).toEqual({
      learner: "speaker",
      partner: "yuki",
      country: "japan",
      companion: "tanaka",
    });
  });

  it("publishes every option canonically with no future or undeclared lexemes", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const declared = new Set([
        ...lesson.content.newLexemeIds,
        ...lesson.content.reviewLexemeIds,
      ]);
      lesson.activityDesigns.forEach((design, index) => {
        expect(lesson.content.activities[index].optionTargetIds).toEqual(
          design.optionTargetIds,
        );
        expect(design.optionTargets).toHaveLength(
          design.operation === "produce-spoken" ? 0 : 2,
        );
        if (design.correctOptionIndex === null) {
          expect(design.optionFactStatus).toEqual([]);
        } else {
          expect(design.optionFactStatus[design.correctOptionIndex]).toBe(
            "accepted-world",
          );
          expect(
            design.optionFactStatus.filter((status) => status === "rejected-context"),
          ).toHaveLength(1);
        }
        design.optionTargetIds.forEach((id, optionIndex) => {
          expect(
            BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS.acceptedAnswerTargets.get(id),
          ).toBe(design.optionTargets[optionIndex]);
        });
        for (const target of [
          design.promptTarget,
          design.acceptedAnswerTarget,
          ...design.optionTargets,
        ]) {
          expect(
            target.lexemeIds.every((id) => declared.has(id)),
            `${lesson.content.lessonId}:${design.id}:${target.lexemeIds
              .filter((id) => !declared.has(id))
              .join(",")}`,
          ).toBe(true);
        }
      });
    }
  });

  it("fails closed for unresolved and future-owned option targets", () => {
    const lesson = BASE_TOPIC_QUESTIONS_LESSONS[0];
    const first = lesson.activities[0];
    const unresolved = {
      ...lesson,
      activities: [
        { ...first, optionTargetIds: ["missing-option", first.optionTargetIds?.[1] ?? ""] },
        ...lesson.activities.slice(1),
      ],
    };
    expect(
      validateBaseLessonDepth(
        unresolved,
        BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
      ).map(({ code }) => code),
    ).toContain("unresolved-reference");

    const futureTarget = {
      ...BASE_TOPIC_QUESTIONS_MODULE.lessons[0].activityDesigns[0].optionTargets[0],
      tokens: [{
        id: "future-adjective",
        jp: "たかい",
        romaji: "takai",
        kind: "lexical" as const,
        boundaryBefore: "attach" as const,
        source: { domain: "catalog" as const, referenceId: "adjective-takai" },
      }],
      lexemeIds: ["adjective-takai"],
    };
    const acceptedAnswerTargets = new Map(
      BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS.acceptedAnswerTargets,
    );
    acceptedAnswerTargets.set(first.optionTargetIds?.[0] ?? "", futureTarget);
    expect(
      validateFirstTeachOrder(
        BASE_TOPIC_QUESTIONS_MODULE.sequence,
        BASE_FIRST_TEACH_OWNERS,
        { ...BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS, acceptedAnswerTargets },
      ).map(({ code }) => code),
    ).toContain("first-teach-before-owner");
  });

  it("balances option position and length without identical lesson sequences", () => {
    const sequences = BASE_TOPIC_QUESTIONS_MODULE.lessons.map((lesson) =>
      lesson.activityDesigns.map(({ correctOptionIndex }) => correctOptionIndex),
    );
    sequences.forEach((sequence) => {
      expect(
        Math.abs(
          sequence.filter((index) => index === 0).length -
          sequence.filter((index) => index === 1).length,
        ),
      ).toBeLessThanOrEqual(1);
      expect(sequence.filter((index) => index === null)).toHaveLength(1);
    });
    expect(new Set(sequences.map((sequence) => sequence.join(""))).size).toBe(4);
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const longest = lesson.activityDesigns.filter(
        ({ optionTargets, correctOptionIndex }) => {
          const lengths = optionTargets.map(({ tokens }) => jp(tokens).length);
          const correct = correctOptionIndex ?? 0;
          return lengths[correct] > lengths[correct === 0 ? 1 : 0];
        },
      ).length;
      expect(longest).toBeLessThanOrEqual(6);
    }
  });

  it("prevents cross-activity prompt and distractor answer leakage", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const answers = lesson.activityDesigns.map(({ acceptedAnswerTarget }) =>
        jp(acceptedAnswerTarget.tokens),
      );
      const worked = new Set(lesson.examples.map(({ tokens }) => jp(tokens)));
      lesson.activityDesigns.forEach(
        ({ promptTarget, optionTargets, correctOptionIndex }, index) => {
          const otherAnswers = new Set(
            answers.filter((_, answerIndex) => answerIndex !== index),
          );
          expect(
            otherAnswers.has(jp(promptTarget.tokens)) &&
              !jp(promptTarget.tokens).endsWith(
                jp(lesson.activityDesigns[index].acceptedAnswerTarget.tokens),
              ),
            `${lesson.content.lessonId}:${index + 1}:prompt:${jp(promptTarget.tokens)}`,
          ).toBe(false);
          optionTargets.forEach((target, optionIndex) => {
            if (optionIndex !== correctOptionIndex) {
              expect(
                otherAnswers.has(jp(target.tokens)),
                `${lesson.content.lessonId}:${index + 1}:${jp(target.tokens)}`,
              ).toBe(false);
              expect(
                worked.has(jp(target.tokens)),
                `${lesson.content.lessonId}:worked-distractor:${jp(target.tokens)}`,
              ).toBe(false);
            }
          });
        },
      );
    }
  });

  it("keeps normalized examples and reviewed semantic tags distinct", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const surfaces = lesson.examples.map(({ tokens }) =>
        jp(tokens).normalize("NFKC").replace(/\s+/g, ""),
      );
      expect(new Set(surfaces).size).toBe(surfaces.length);
      expect(
        new Set(
          lesson.reviewedTranslations.map(({ semanticTag }) => semanticTag),
        ).size,
      ).toBe(lesson.reviewedTranslations.length);
    }
  });

  it("limits accepted answers to complete clauses or reviewed practical list fragments", () => {
    BASE_TOPIC_QUESTIONS_MODULE.lessons.forEach((lesson, lessonIndex) => {
      for (const { acceptedAnswerTarget } of lesson.activityDesigns) {
        const surface = jp(acceptedAnswerTarget.tokens);
        const clause = surface.replace(/。$/u, "");
        if (lessonIndex < 3) {
          expect(clause.endsWith("です")).toBe(true);
        } else {
          expect(
            clause.endsWith("です") ||
              clause.endsWith("ですか") ||
              clause.endsWith("ですね") ||
              clause.endsWith("ですよ"),
          ).toBe(true);
        }
      }
    });
  });

  it("uses context to distinguish wa and ga rather than replacement drills", () => {
    const tq2 = BASE_TOPIC_QUESTIONS_MODULE.lessons[1];
    expect(tq2.activityDesigns.every(({ informationStructure }) =>
      informationStructure === "established-topic" ||
      informationStructure === "focused-new-subject",
    )).toBe(true);
    expect(tq2.activityDesigns.every(({ promptContextCopyId }) =>
      promptContextCopyId.length > 0,
    )).toBe(true);
    expect(tq2.activityDesigns.every(({ prompt, acceptedAnswers }) =>
      !acceptedAnswers.includes(prompt),
    )).toBe(true);
    for (const design of tq2.activityDesigns.slice(0, 4)) {
      expect(design.promptTarget.lexemeIds.length).toBeGreaterThan(0);
      expect(design.contextTarget.kind).toBe("information-structure");
      expect(design.contextTarget.informationStructure).toBe(
        design.informationStructure,
      );
      expect(
        design.informationStructure === "focused-new-subject"
          ? particleSenses(design.acceptedAnswerTarget).includes("focus-subject-ga")
          : particleSenses(design.acceptedAnswerTarget).includes("topic-wa"),
      ).toBe(true);
    }
    for (const design of tq2.activityDesigns.slice(4, 6)) {
      expect(design.promptTarget.tokens.length).toBeGreaterThanOrEqual(3);
      expect(design.contextTarget.kind).toBe("information-structure");
    }
  });

  it("authors explicit operation metadata and operation-specific evidence", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      lesson.activityDesigns.forEach((design, index) => {
        const activity = lesson.content.activities[index];
        expect({
          category: design.category,
          interactionKind: design.interactionKind,
          mode: design.mode,
          operation: design.operation,
        }).toEqual({
          category: activity.category,
          interactionKind: activity.interactionKind,
          mode: activity.mode,
          operation: activity.operation,
        });
        expect(design.operationEvidence.kind).toBe(design.operation);
        if (design.operation === "order-chunks") {
          expect(design.operationEvidence.tileTargetIds?.length)
            .toBeGreaterThanOrEqual(2);
        }
        if (design.operation === "transform-form") {
          expect(design.operationEvidence.sourceTargetId).toBeTruthy();
        }
        if (design.operation === "diagnose-error") {
          expect(design.operationEvidence.errorCode).toBeTruthy();
          expect(design.operationEvidence.candidateTargetId).toBe(
            baseActivityPromptKey(lesson.content.lessonId, design.id),
          );
        }
        if (design.operation === "identify-audio") {
          expect(design.contextTarget.audioRequired).toBe(true);
        }
        if (design.operation === "produce-spoken") {
          expect(design.contextTarget.recallRequired).toBe(true);
        }
      });
    }
  });

  it("realizes each authored particle pattern cell in the accepted answer", () => {
    const expectedSenseByCell: Readonly<Record<string, readonly string[]>> = {
      "tq1-topic-comment": ["topic-wa"],
      "tq1-topic-contrast": ["topic-wa"],
      "tq1-grounded-answer": ["grounded-response"],
      "tq2-focused-subject": ["focus-subject-ga"],
      "tq2-wa-ga-contrast": ["topic-wa"],
      "tq3-attributive-no": ["possessive-attributive-no"],
      "tq3-additive-mo": ["additive-mo"],
      "tq3-nominal-list": ["listing-to", "nominal-to"],
      "tq3-companion": ["companion-to"],
      "tq4-question-answer": ["question-ka", "response-expression"],
      "tq4-interactional-ne": ["interactional-ne"],
      "tq4-interactional-yo": ["interactional-yo"],
    };
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        expect(design.patternCellId).toBe(
          design.acceptedAnswerTarget.patternCellIds[0],
        );
        const senses = particleSenses(design.acceptedAnswerTarget);
        const realizedSenses = [
          ...senses,
          ...(design.patternCellId === "tq1-grounded-answer"
            ? ["grounded-response"]
            : []),
          ...(design.acceptedAnswerTarget.lexemeIds.some((id) =>
            ["expression-hai", "expression-iie"].includes(id),
          )
            ? ["response-expression"]
            : []),
        ];
        expect(
          (expectedSenseByCell[design.patternCellId] ?? []).some((sense) =>
            realizedSenses.includes(sense),
          ),
          `${lesson.content.lessonId}:${design.id}:${design.patternCellId}`,
        ).toBe(true);
        design.optionTargets.forEach((target, optionIndex) => {
          expect(
            target.patternCellIds.every((id) => id === design.patternCellId),
          ).toBe(true);
          if (optionIndex === design.correctOptionIndex) {
            expect(target.patternCellIds).toContain(design.patternCellId);
          }
        });
      }
    }
  });

  it("derives concept evidence only from visible answer and option forms", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      lesson.activityDesigns.forEach((design, index) => {
        expect(design.promptTarget.patternCellIds).toEqual([]);
        const promptParticleContentIds = new Set(
          particleSenses(design.promptTarget).map((sense) => {
            if (sense === "possessive-attributive-no") return "possessive-no";
            if (sense === "listing-to" || sense === "nominal-to") {
              return "nominal-listing-to";
            }
            return sense;
          }),
        );
        if (particleSenses(design.promptTarget).includes("possessive-attributive-no")) {
          promptParticleContentIds.add("modifier-before-noun");
        }
        expect(
          design.promptTarget.conceptIds.every((id) =>
            promptParticleContentIds.has(id),
          ),
        ).toBe(true);
        const visibleContent = new Set(
          [design.acceptedAnswerTarget, ...design.optionTargets].flatMap((target) => [
            ...target.conceptIds,
            ...target.formIds,
          ]),
        );
        expect(
          lesson.content.activities[index].assessedConceptIds.every((id) =>
            visibleContent.has(id),
          ),
        ).toBe(true);
      });
    }
  });

  it("uses typed non-echo contexts for listening, speaking, and natural nan", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        const promptLexemes = new Set(design.promptTarget.lexemeIds);
        if (
          design.operation !== "transform-form" &&
          design.operation !== "diagnose-error" &&
          design.operation !== "order-chunks"
        ) {
          for (const id of promptLexemes) {
            if (design.acceptedAnswerTarget.lexemeIds.includes(id)) {
              expect(
                design.optionTargets.every((target) =>
                  target.lexemeIds.includes(id),
                ) ||
                  (design.worldFactId !== null && design.referentId !== null),
                `${lesson.content.lessonId}:${design.id}:${id}`,
              ).toBe(true);
            }
          }
          expect(normalized(design.promptTarget.tokens)).not.toBe(
            normalized(design.acceptedAnswerTarget.tokens),
          );
        } else {
          expect(jp(design.promptTarget.tokens)).not.toBe(
            jp(design.acceptedAnswerTarget.tokens),
          );
        }
        if (design.operation === "identify-audio") {
          expect(design.contextTarget.audioRequired).toBe(true);
        }
        if (design.operation === "produce-spoken") {
          expect(design.contextTarget.recallRequired).toBe(true);
        }
      }
    }
    const nanTargets = BASE_TOPIC_QUESTIONS_MODULE.lessons.flatMap(
      ({ examples, dialogue, activityDesigns }) => [
        ...examples,
        ...(dialogue?.turns ?? []),
        ...activityDesigns.flatMap(({ promptTarget, optionTargets }) => [
          promptTarget,
          ...optionTargets,
        ]),
      ],
    ).filter(({ lexemeIds }) => lexemeIds.includes("noun-nan"));
    expect(nanTargets.length).toBeGreaterThan(0);
    expect(nanTargets.every((target) => jp(target.tokens).includes("なんですか")))
      .toBe(true);
  });

  it("contains no visible scaffolding glyphs or arrows", () => {
    const visible = visibleJapaneseFor(
      BASE_TOPIC_QUESTIONS_MODULE.sequence,
      BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
    );
    expect(visible).not.toMatch(/[◇◎●↔♪↺→]/);
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        const prompt = jp(design.promptTarget.tokens);
        expect(prompt).not.toMatch(/[◇◎●↔♪↺→]/);
        expect(design.optionTargets.map((target) => jp(target.tokens)))
          .not.toContain(prompt);
      }
    }
  });

  it("authors contextual diagnosis prompts and separate repair options", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns.filter(
        ({ operation }) => operation === "diagnose-error",
      )) {
        const prompt = jp(design.promptTarget.tokens);
        expect(design.optionTargets.map((target) => jp(target.tokens)))
          .not.toContain(prompt);
        expect(design.operationEvidence.candidateTargetId).toBe(
          baseActivityPromptKey(lesson.content.lessonId, design.id),
        );
      }
    }
  });

  it("uses canonical world facts for every accepted factual answer", () => {
    const ledger = (BASE_TOPIC_QUESTIONS_MODULE as unknown as {
      worldFactLedger: readonly {
        id: string;
        acceptedTargetIds: readonly string[];
        rejectedTargetIds: readonly string[];
      }[];
    }).worldFactLedger;
    expect(ledger).toHaveLength(
      new Set(BASE_TOPIC_QUESTIONS_MODULE.worldFactIds).size,
    );
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        if (!design.worldFactId) continue;
        expect(BASE_TOPIC_QUESTIONS_MODULE.worldFactIds)
          .toContain(design.worldFactId);
        if (design.operationEvidence.errorCode === "world-fact-mismatch") {
          expect(design.worldFactId).toBeTruthy();
          expect(
            ledger.find(({ id }) => id === design.worldFactId)?.rejectedTargetIds,
          ).toContain(
            baseActivityPromptKey(lesson.content.lessonId, design.id),
          );
        }
        const fact = ledger.find(({ id }) => id === design.worldFactId);
        expect(fact?.acceptedTargetIds).toContain(
          design.acceptedAnswerTargetId,
        );
        if (design.correctOptionIndex !== null) {
          expect(fact?.rejectedTargetIds).toContain(
            design.optionTargetIds[design.correctOptionIndex === 0 ? 1 : 0],
          );
        }
      }
    }
  });

  it("publishes a typed semantic audio contract for each listening item", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const listening = lesson.activityDesigns.find(
        ({ operation }) => operation === "identify-audio",
      );
      expect(listening?.audioContract).toEqual(
        expect.objectContaining({
          kind: "semantic-synthesis",
          targetId: listening?.audioTargetId,
          promptVisible: false,
        }),
      );
    }
  });

  it("marks every semantic example and dialogue turn with utterance kind", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      expect(lesson.examples.every(({ utteranceKind }) => utteranceKind))
        .toBe(true);
      expect(lesson.dialogue?.turns.every(({ utteranceKind }) => utteranceKind) ?? true)
        .toBe(true);
    }
    expect(
      BASE_TOPIC_QUESTIONS_MODULE.lessons[3].examples.every(
        ({ utteranceKind }) => utteranceKind === "complete-clause",
      ),
    ).toBe(true);
  });

  it("keeps instructions free of target strings and Japanese answer leakage", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      lesson.activityDesigns.forEach((design, index) => {
        const copyId = lesson.content.activities[index].instructionCopyId;
        for (const text of [
          baseNavigationCopyEn.content[copyId],
          baseNavigationCopyIt.content[copyId],
        ]) {
          expect(text).not.toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/);
          for (const target of design.optionTargets) {
            expect(text).not.toContain(jp(target.tokens));
          }
        }
      });
    }
  });

  it("keeps Yuki's country Japan in every accepted world surface", () => {
    const tq4 = BASE_TOPIC_QUESTIONS_MODULE.lessons[3];
    for (const design of tq4.activityDesigns.filter(
      ({ worldFactId }) => worldFactId === "yuki-country",
    )) {
      const accepted = jp(design.acceptedAnswerTarget.tokens);
      expect(accepted).not.toContain("ちゅうごく");
      if (design.worldFactId === "yuki-country") {
        expect(accepted).toContain("にほん");
        if (design.operationEvidence.errorCode === "world-fact-mismatch") {
          expect(jp(design.promptTarget.tokens)).toContain("ちゅうごく");
        }
      }
    }
  });

  it("mixes non-alternating position and length fingerprints", () => {
    const fingerprints = new Set<string>();
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const fingerprint = lesson.activityDesigns
        .map(({ correctOptionIndex }) => correctOptionIndex)
        .join("");
      fingerprints.add(fingerprint);
      expect(fingerprint).not.toBe("0101010101");
      expect(fingerprint).not.toBe("1010101010");
      const distribution = { longer: 0, shorter: 0, tie: 0 };
      lesson.activityDesigns.forEach(({ optionTargets, correctOptionIndex }) => {
        const lengths = optionTargets.map(({ tokens }) => jp(tokens).length);
        const correct = correctOptionIndex ?? 0;
        const other = correct === 0 ? 1 : 0;
        if (lengths[correct] > lengths[other]) distribution.longer += 1;
        else if (lengths[correct] < lengths[other]) distribution.shorter += 1;
        else distribution.tie += 1;
      });

      expect(distribution.longer).toBeGreaterThanOrEqual(2);
      expect(distribution.shorter).toBeGreaterThanOrEqual(2);
      expect(distribution.tie).toBeGreaterThanOrEqual(2);
    }
    expect(fingerprints.size).toBe(4);
  });

  it("uses a distinct authored category sequence for every lesson", () => {
    const fingerprints = BASE_TOPIC_QUESTIONS_MODULE.lessons.map((lesson) =>
      lesson.content.activities.map(({ category }) => category).join("|"),
    );
    expect(new Set(fingerprints).size).toBe(4);
  });

  it("never uses bare person or family as exhaustive-focus evidence", () => {
    const lesson = BASE_TOPIC_QUESTIONS_MODULE.lessons[1];
    const surfaces = [
      ...lesson.examples,
      ...lesson.activityDesigns.flatMap(({ promptTarget, optionTargets }) => [
        promptTarget,
        ...optionTargets,
      ]),
    ].map(({ tokens }) => jp(tokens));
    expect(surfaces.some((surface) => /^(ひと|かぞく)(が|は)/u.test(surface))).toBe(false);
  });

  it("gives every activity independent localized diagnostic feedback", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const accepted = lesson.content.activities.map(
        ({ acceptedFeedbackCopyId }) => acceptedFeedbackCopyId,
      );
      const retry = lesson.content.activities.map(
        ({ retryFeedbackCopyId }) => retryFeedbackCopyId,
      );
      expect(new Set(accepted).size).toBe(10);
      expect(new Set(retry).size).toBe(10);
      expect(new Set(accepted.map((id) => baseNavigationCopyEn.content[id])).size).toBe(10);
      expect(new Set(retry.map((id) => baseNavigationCopyIt.content[id])).size).toBe(10);
    }
  });

  it("maps reviewed Japanese meanings to explicit EN and IT records", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      for (const record of lesson.reviewedTranslations) {
        expect(record.japanese).toBe(jp(record.target.tokens));
        expect(baseNavigationCopyEn.content[record.copyId]).toBe(record.en);
        expect(baseNavigationCopyIt.content[record.copyId]).toBe(record.it);
        expect(record.semanticTag.length).toBeGreaterThan(0);
      }
      expect(lesson.reviewedTranslations).toHaveLength(lesson.examples.length);
    }
    const reviewed = [
      [
        "topic-questions-2-example-1-translation",
        "たなかさんがかんごしです。",
        "Tanaka is the one who is the nurse.",
        "È Tanaka a essere l'infermiere.",
      ],
      [
        "topic-questions-2-example-4-translation",
        "がくせいはさとうさんです",
        "The student is Satou.",
        "Lo studente è Satou.",
      ],
      [
        "topic-questions-3-example-3-translation",
        "たなかさんのおとうさんです。",
        "This is Tanaka's father (respectful reference).",
        "È il padre di Tanaka (riferimento rispettoso).",
      ],
      [
        "topic-questions-4-example-2-translation",
        "なまえはゆきですか。",
        "Is the name Yuki?",
        "Il nome è Yuki?",
      ],
    ] as const;
    const records = BASE_TOPIC_QUESTIONS_MODULE.lessons.flatMap(
      ({ reviewedTranslations }) => reviewedTranslations,
    );
    for (const [copyId, japanese, en, it] of reviewed) {
      expect(records).toContainEqual(
        expect.objectContaining({ copyId, japanese, en, it }),
      );
    }
  });

  it("keeps activity instructions semantically aligned in both locales", () => {
    expect(baseNavigationCopyEn.content["topic-questions-4-activity-8-instruction"])
      .toMatch(/new information|update/i);
    expect(baseNavigationCopyIt.content["topic-questions-4-activity-8-instruction"])
      .toMatch(/informazione nuova|aggiornamento/i);
    expect(baseNavigationCopyEn.content["topic-questions-2-activity-1-instruction"])
      .toMatch(/newly selected|open/i);
    expect(baseNavigationCopyIt.content["topic-questions-2-activity-1-instruction"])
      .toMatch(/appena selezionata|si apre|aperto/i);
  });

  it("uses operation-specific diagnostic copy", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      expect(
        new Set(
          lesson.content.activities.map(({ acceptedFeedbackCopyId }) =>
            acceptedFeedbackCopyId,
          ),
        ).size,
      ).toBeGreaterThanOrEqual(6);
      expect(
        new Set(
          lesson.content.activities.map(({ retryFeedbackCopyId }) =>
            retryFeedbackCopyId,
          ),
        ).size,
      ).toBeGreaterThanOrEqual(6);
    }
  });

  it("uses 8+2 practice with stable, non-leaking, non-fixed answers", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      const nonSpoken = lesson.content.activities.filter(
        ({ mode }) => mode === "non-spoken",
      );
      expect(nonSpoken).toHaveLength(8);
      expect(new Set(nonSpoken.map(({ category }) => category)).size)
        .toBeGreaterThanOrEqual(6);
      expect(lesson.content.activities.filter(({ category }) =>
        category === "listening",
      )).toHaveLength(1);
      expect(lesson.content.activities.filter(({ category }) =>
        category === "spoken",
      )).toHaveLength(1);
      const positions = lesson.activityDesigns
        .filter(({ correctOptionIndex }) => correctOptionIndex !== null)
        .map(({ correctOptionIndex }) => correctOptionIndex);
      expect(new Set(positions).size).toBeGreaterThanOrEqual(2);
      expect(lesson.activityDesigns.every(({ prompt, acceptedAnswers }) =>
        !acceptedAnswers.includes(prompt),
      )).toBe(true);
      expect(new Set(lesson.content.activities.map(({ id }) => id)).size)
        .toBe(10);
    }
  });

  it("makes each new lexeme visible and retrievable without future leakage", () => {
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      expect(new Set(lesson.content.newLexemeIds).size).toBe(
        lesson.content.newLexemeIds.length,
      );
      expect(new Set(lesson.content.reviewLexemeIds).size).toBe(
        lesson.content.reviewLexemeIds.length,
      );
      expect(
        lesson.content.newLexemeIds.some((id) =>
          lesson.content.reviewLexemeIds.includes(id),
        ),
      ).toBe(false);
      const visible = new Set([
        ...lesson.examples.flatMap(({ lexemeIds }) => lexemeIds),
        ...(lesson.dialogue?.turns.flatMap(({ lexemeIds }) => lexemeIds) ?? []),
      ]);
      const retrieved = new Set(
        lesson.activityDesigns.flatMap(
          ({ promptTarget, acceptedAnswerTarget, optionTargets }) => [
            ...promptTarget.lexemeIds,
            ...acceptedAnswerTarget.lexemeIds,
            ...optionTargets.flatMap(({ lexemeIds }) => lexemeIds),
          ],
        ),
      );
      expect(lesson.content.newLexemeIds.every((id) => visible.has(id))).toBe(true);
      expect(lesson.content.newLexemeIds.every((id) => retrieved.has(id))).toBe(true);
    }
    const visible = visibleJapaneseFor(
      BASE_TOPIC_QUESTIONS_MODULE.sequence,
      BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
    );
    expect(visible).not.toMatch(/のです|たかい|しずか/);
    expect(
      BASE_TOPIC_QUESTIONS_MODULE.lessons.flatMap(
        ({ examples, dialogue, activityDesigns }) => [
          ...examples.flatMap(({ tokens }) => tokens),
          ...(dialogue?.turns.flatMap(({ tokens }) => tokens) ?? []),
          ...activityDesigns.flatMap(({ promptTarget, optionTargets }) => [
            ...promptTarget.tokens,
            ...optionTargets.flatMap(({ tokens }) => tokens),
          ]),
        ],
      ).some(({ jp }) => jp === "んです"),
    ).toBe(false);
    const laterParticleSurfaces = new Set(["を", "に", "へ", "で", "から", "まで"]);
    const particleTokens = BASE_TOPIC_QUESTIONS_MODULE.lessons.flatMap(
      ({ examples, dialogue, activityDesigns }) => [
        ...examples.flatMap(({ tokens }) => tokens),
        ...(dialogue?.turns.flatMap(({ tokens }) => tokens) ?? []),
        ...activityDesigns.flatMap(({ promptTarget, acceptedAnswerTarget }) => [
          ...promptTarget.tokens,
          ...acceptedAnswerTarget.tokens,
        ]),
      ],
    ).filter(({ kind }) => kind === "particle");
    expect(particleTokens.some(({ jp }) => laterParticleSurfaces.has(jp))).toBe(false);
  });

  it("uses sentence-anatomy and particle-atlas at the exact progressive points", () => {
    expect(
      BASE_TOPIC_QUESTIONS_LESSONS.map(({ referenceSnapshotIds }) =>
        referenceSnapshotIds,
      ),
    ).toEqual([
      ["sentence-anatomy", "particle-atlas"],
      ["sentence-anatomy", "particle-atlas"],
      ["sentence-anatomy", "particle-atlas"],
      ["sentence-anatomy", "particle-atlas"],
    ]);
  });

  it("represents wa pronunciation, ga focus, bounded no/mo, and to/ka truthfully", () => {
    const japanese = BASE_TOPIC_QUESTIONS_EXAMPLES.map(({ tokens }) =>
      tokens.map(({ jp }) => jp).join(""),
    ).join("\n");
    expect(japanese).toContain("は");
    expect(japanese).toContain("が");
    expect(japanese).toContain("の");
    expect(japanese).toContain("も");
    expect(japanese).toContain("と");
    expect(japanese).toContain("か");
    const waTokens = BASE_TOPIC_QUESTIONS_EXAMPLES.flatMap(({ tokens }) => tokens)
      .filter(({ jp }) => jp === "は");
    expect(waTokens.length).toBeGreaterThan(0);
    expect(waTokens.every(({ romaji }) => romaji === "wa")).toBe(true);
    const allCopy = Object.values(baseNavigationCopyEn.content).join(" ");
    expect(allCopy).not.toMatch(/Japanese has no subjects/i);
    expect(allCopy).not.toMatch(/は is (?:the )?subject marker/i);
    expect(allCopy).not.toMatch(/が (?:always )?replaces は/i);
  });

  it("has EN/IT copy parity including dialogue translations and purpose", () => {
    const ids = new Set<string>();
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      ids.add(lesson.titleCopyId);
      ids.add(lesson.objectiveCopyId);
      ids.add(lesson.content.recapCopyId);
      Object.values(lesson.explanation).forEach((id) => ids.add(id));
      lesson.examples.forEach(({ teachingPurposeCopyId, translationCopy }) => {
        ids.add(teachingPurposeCopyId);
        if ("copyId" in translationCopy) ids.add(translationCopy.copyId);
      });
      lesson.dialogue?.turnCopy.forEach(({ translationCopyId, purposeCopyId }) => {
        ids.add(translationCopyId);
        ids.add(purposeCopyId);
      });

      lesson.content.activities.forEach(
        ({ instructionCopyId, acceptedFeedbackCopyId, retryFeedbackCopyId }) => {
          ids.add(instructionCopyId);
          ids.add(acceptedFeedbackCopyId);
          ids.add(retryFeedbackCopyId);
        },
      );
    }
    for (const id of ids) {
      const en = baseNavigationCopyEn.content[id];
      const it = baseNavigationCopyIt.content[id];
      expect(en?.trim(), id).toBeTruthy();
      expect(it?.trim(), id).toBeTruthy();
      expect(it, id).not.toBe(en);
    }
  });

  it("has no orphan topic-questions content copy", () => {
    const used = new Set<string>();
    for (const lesson of BASE_TOPIC_QUESTIONS_MODULE.lessons) {
      [
        lesson.titleCopyId,
        lesson.objectiveCopyId,
        lesson.content.recapCopyId,
        ...Object.values(lesson.explanation),
      ].forEach((id) => used.add(id));
      lesson.examples.forEach((example) => {
        used.add(example.teachingPurposeCopyId);
        if ("copyId" in example.translationCopy) used.add(example.translationCopy.copyId);
      });
      lesson.content.activities.forEach((activity) => {
        used.add(activity.instructionCopyId);
        used.add(activity.acceptedFeedbackCopyId);
        used.add(activity.retryFeedbackCopyId);
      });
      if (lesson.dialogue) {
        used.add(lesson.dialogue.practicalOutcomeCopyId);
        lesson.dialogue.turnCopy.forEach(({ translationCopyId, purposeCopyId }) => {
          used.add(translationCopyId);
          used.add(purposeCopyId);
        });
      }
    }
    const owned = Object.keys(baseNavigationCopyEn.content).filter((id) =>
      id.startsWith("topic-questions-"),
    );
    expect(owned.filter((id) => !used.has(id))).toEqual([]);
  });

  it("is immutable and fails closed for getters, sparse arrays, and prototypes", () => {
    expect(Object.isFrozen(BASE_TOPIC_QUESTIONS_MODULE)).toBe(true);
    expect(Object.isFrozen(BASE_TOPIC_QUESTIONS_EXAMPLES[0])).toBe(true);
    const getter = Object.defineProperty({}, "id", {
      enumerable: true,
      get: () => "topic-questions",
    });
    expect(validateBaseTopicQuestionsModule(getter).ok).toBe(false);
    expect(
      validateBaseTopicQuestionsModule({
        ...BASE_TOPIC_QUESTIONS_MODULE,
        lessons: new Array(4),
      }).ok,
    ).toBe(false);
    expect(
      validateBaseTopicQuestionsModule(
        Object.create(BASE_TOPIC_QUESTIONS_MODULE),
      ).ok,
    ).toBe(false);
    expect(
      validateBaseTopicQuestionsModule({
        ...BASE_TOPIC_QUESTIONS_MODULE,
        worldFacts: { ...BASE_TOPIC_QUESTIONS_MODULE.worldFacts, yukiCountry: "america" },
      }).ok,
    ).toBe(false);
    const firstLesson = BASE_TOPIC_QUESTIONS_MODULE.lessons[0];
    const firstActivity = firstLesson.content.activities[0];
    expect(
      validateBaseTopicQuestionsModule({
        ...BASE_TOPIC_QUESTIONS_MODULE,
        lessons: [
          {
            ...firstLesson,
            content: {
              ...firstLesson.content,
              activities: [
                {
                  ...firstActivity,
                  optionTargetIds: [
                    firstActivity.optionTargetIds?.[0] ?? "",
                    firstActivity.optionTargetIds?.[0] ?? "",
                  ],
                },
                ...firstLesson.content.activities.slice(1),
              ],
            },
          },
          ...BASE_TOPIC_QUESTIONS_MODULE.lessons.slice(1),
        ],
      }).ok,
    ).toBe(false);
    expect(
      validateBaseTopicQuestionsModule({
        ...BASE_TOPIC_QUESTIONS_MODULE,
        lessons: [
          {
            ...firstLesson,
            activityDesigns: [
              {
                ...firstLesson.activityDesigns[0],
                patternCellId: "tq1-topic-contrast",
                operationEvidence: { kind: "diagnose-error" },
              },
              ...firstLesson.activityDesigns.slice(1),
            ],
          },
          ...BASE_TOPIC_QUESTIONS_MODULE.lessons.slice(1),
        ],
      }).ok,
    ).toBe(false);
  });
});
