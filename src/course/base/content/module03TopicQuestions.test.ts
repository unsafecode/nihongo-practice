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

function jp(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map(({ jp }) => jp).join("");
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
    expect(owner("nominal-to")).toBe("topic-questions-4");
    expect(owner("listing-to")).toBe("topic-questions-4");
    expect(owner("companion-to")).toBe("topic-questions-4");
    expect(owner("question-ka")).toBe("topic-questions-4");
    expect(module03ConceptIds).toContain("possessive-no");
    expect(module03ConceptIds).not.toContain("explanatory-no");
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
      yukiCountry: "italy",
      speakerCity: "tokyo",
    });
  });

  it("has a coherent six-turn name, country, and companion clarification", () => {
    const dialogue = BASE_TOPIC_QUESTIONS_MODULE.lessons[3].dialogue;
    expect(dialogue?.turns.map(({ tokens }) => jp(tokens))).toEqual([
      "なまえはなんですか",
      "ゆきです",
      "くにはイタリアですか",
      "はい、イタリアです",
      "たなかさんとともだちですか",
      "はい、そうです",
    ]);
    expect(dialogue?.referentLedger).toEqual({
      learner: "speaker",
      partner: "yuki",
      country: "italy",
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
        expect(design.optionTargets).toHaveLength(2);
        expect(design.optionFactStatus[design.correctOptionIndex ?? 0]).toBe(
          "accepted-world",
        );
        expect(
          design.optionFactStatus.filter((status) => status === "rejected-context"),
        ).toHaveLength(1);
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
          expect(target.lexemeIds.every((id) => declared.has(id))).toBe(true);
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
      expect(sequence.filter((index) => index === 0)).toHaveLength(5);
      expect(sequence.filter((index) => index === 1)).toHaveLength(5);
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
          expect(otherAnswers.has(jp(promptTarget.tokens))).toBe(false);
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
        if (lessonIndex < 3) {
          expect(surface.endsWith("です")).toBe(true);
        } else {
          expect(
            surface.endsWith("です") ||
              surface.endsWith("ですか") ||
              ["アメリカとイタリア", "くにとなまえ"].includes(surface),
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
        "topic-questions-3-example-5-translation",
        "たなかさんのおとうさんです",
        "This is Tanaka's father (respectful reference).",
        "È il padre di Tanaka (riferimento rispettoso).",
      ],
      [
        "topic-questions-4-example-3-translation",
        "なまえはゆきですか",
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
  });
});
