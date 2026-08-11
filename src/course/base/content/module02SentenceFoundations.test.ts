import { describe, expect, it } from "vitest";
import {
  BASE_FIRST_TEACH_OWNER_BY_KEY,
  BASE_FIRST_TEACH_OWNERS,
  firstTeachOwnerKey,
} from "../catalog/firstTeach";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateFirstTeachOrder, visibleJapaneseFor } from "../validation/sequenceRules";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import { baseActivityPromptKey } from "../catalog/visibleTargets";
import {
  BASE_SENTENCE_FOUNDATIONS_EXAMPLES,
  BASE_SENTENCE_FOUNDATIONS_LESSONS,
  BASE_SENTENCE_FOUNDATIONS_MODULE,
  BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
  validateBaseSentenceFoundationsModule,
} from "./module02SentenceFoundations";

function jp(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map(({ jp }) => jp).join("");
}

function normalized(tokens: readonly { readonly jp: string }[]): string {
  return jp(tokens).normalize("NFKC").replace(/[、→◇◎●♪↺]/g, "").replace(/です$/, "");
}

describe("Base sentence-foundations module", () => {
  it("publishes the exact stable route order and system contracts", () => {
    expect(BASE_SENTENCE_FOUNDATIONS_LESSONS.map(({ lessonId, contract }) => [
      lessonId,
      contract,
    ])).toEqual([
      ["sentence-foundations-1", "system"],
      ["sentence-foundations-2", "system"],
      ["sentence-foundations-3", "system"],
      ["sentence-foundations-4", "system"],
    ]);
    expect(BASE_SENTENCE_FOUNDATIONS_LESSONS.map(({ prerequisiteLessonIds }) =>
      prerequisiteLessonIds,
    )).toEqual([
      ["sounds-4"],
      ["sentence-foundations-1"],
      ["sentence-foundations-2"],
      ["sentence-foundations-3"],
    ]);
  });

  it("passes production depth and sequence validation", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_LESSONS) {
      expect(
        validateBaseLessonDepth(
          lesson,
          BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
        ),
      ).toEqual([]);
    }
    expect(
      validateFirstTeachOrder(
        BASE_SENTENCE_FOUNDATIONS_LESSONS,
        BASE_FIRST_TEACH_OWNERS,
        BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
      ),
    ).toEqual([]);
    expect(validateBaseSentenceFoundationsModule(BASE_SENTENCE_FOUNDATIONS_MODULE))
      .toEqual({ ok: true, errors: [] });
  });

  it("first-teaches affirmative noun-predicate desu only in lesson 3", () => {
    expect(
      BASE_FIRST_TEACH_OWNER_BY_KEY.get(
        firstTeachOwnerKey("concept", "affirmative-desu"),
      )?.lessonId,
    ).toBe("sentence-foundations-3");
    expect(BASE_SENTENCE_FOUNDATIONS_LESSONS[2].introducedConceptIds).toContain(
      "affirmative-desu",
    );
    expect(
      BASE_SENTENCE_FOUNDATIONS_LESSONS.slice(0, 2).flatMap(
        ({ introducedConceptIds }) => introducedConceptIds,
      ),
    ).not.toContain("affirmative-desu");
  });

  it("assigns modifier-before-noun to SF4 with a genuine name-title model", () => {
    const sf4 = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons[3];
    expect(sf4.content.introducedConceptIds).toContain("modifier-before-noun");
    expect(
      BASE_FIRST_TEACH_OWNERS.find(
        ({ contentId }) => contentId === "modifier-before-noun",
      )?.lessonId,
    ).toBe("sentence-foundations-4");
    expect(sf4.patternCellIds).toContain("sf4-modifier-before-noun");
    expect(sf4.examples.map(({ tokens }) => jp(tokens))).toEqual(
      expect.arrayContaining(["さくらせんせいです。", "けんせんせいです。"]),
    );
  });

  it("has 10-14 unique worked examples, complete matrices, and the full 8+2 practice contract", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      expect(lesson.examples.length).toBeGreaterThanOrEqual(10);
      expect(lesson.examples.length).toBeLessThanOrEqual(14);
      expect(new Set(lesson.examples.map(({ id }) => id)).size).toBe(
        lesson.examples.length,
      );
      expect(new Set(lesson.examples.map(({ tokens }) =>
        tokens.map(({ jp }) => jp).join(""),
      )).size).toBe(lesson.examples.length);
      expect(lesson.content.patternCellIds).toEqual(lesson.patternCellIds);
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
      expect(new Set(lesson.activityDesigns.map(({ acceptedAnswers }) =>
        acceptedAnswers.join("\u001f"),
      )).size).toBe(lesson.activityDesigns.length);
      expect(lesson.activityDesigns.every(({ prompt, acceptedAnswers }) =>
        !acceptedAnswers.includes(prompt),
      )).toBe(true);
    }
  });

  it("authors contextual SF1/SF2 fragments and grammatical SF3/SF4 utterances", () => {
    const [sf1, sf2, sf3, sf4] = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons;
    for (const lesson of [sf1, sf2]) {
      expect(lesson.examples.every(({ utteranceKind }) =>
        utteranceKind === "contextual-fragment" || utteranceKind === "anatomy-model",
      )).toBe(true);
      expect(lesson.examples.every(({ contextCopyId }) => contextCopyId !== null)).toBe(true);
    }
    expect(sf3.examples.every(({ utteranceKind }) => utteranceKind === "complete-clause"))
      .toBe(true);
    expect(sf4.examples.every(({ utteranceKind }) =>
      utteranceKind === "complete-clause" || utteranceKind === "hanging-topic",
    )).toBe(true);
    const forbidden = /(?:たなかさん|やまださん)(?:せんせい|いしゃ|べんごし)です|わたしべんごしです/;
    expect(
      BASE_SENTENCE_FOUNDATIONS_EXAMPLES.map(({ tokens }) => jp(tokens)).join("\n"),
    ).not.toMatch(forbidden);
  });

  it("keeps the module character facts consistent", () => {
    expect(BASE_SENTENCE_FOUNDATIONS_MODULE.worldFacts).toEqual({
      speaker: "university-student",
      tanaka: "nurse",
      yamada: "lawyer",
      friend: "international-student",
    });

    const surfaces = BASE_SENTENCE_FOUNDATIONS_EXAMPLES.map(({ tokens }) =>
      jp(tokens),
    ).join("\n");
    expect(surfaces).not.toMatch(/たなかさん、(?:べんごし|いしゃ)です/);
    expect(surfaces).not.toMatch(/やまださん、(?:かんごし|いしゃ)です/);
  });

  it("never recasts a named professional as the generic friend category", () => {
    const visible = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons.flatMap((lesson) => [
      ...lesson.examples.map(({ tokens }) => jp(tokens)),
      ...lesson.activityDesigns.flatMap(({ promptTarget, optionTargets }) => [
        jp(promptTarget.tokens),
        ...optionTargets.map(({ tokens }) => jp(tokens)),
      ]),
    ]);
    expect(visible).not.toContain("たなかさん、ともだちです");
    expect(visible).not.toContain("やまださん、ともだちです");
  });

  it("authors every activity independently as one well-formed utterance", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      const authored = lesson.activityDesigns;
      expect(authored).toHaveLength(10);
      expect(authored.every(({ reviewed }) => reviewed)).toBe(true);
      expect(authored.every(({ promptContextCopyId }) => promptContextCopyId.length > 0))
        .toBe(true);
      if (lesson.content.lessonId === "sentence-foundations-3") {
        expect(authored.every(({ acceptedAnswerTarget }) =>
          !jp(acceptedAnswerTarget.tokens).includes("、"),
        )).toBe(true);
      }
      const surfaces = authored.flatMap(({ promptTarget, acceptedAnswerTarget, optionTargets }) => [
        jp(promptTarget.tokens),
        jp(acceptedAnswerTarget.tokens),
        ...optionTargets.map(({ tokens }) => jp(tokens)),
      ]);
      expect(surfaces.every((surface) => surface.trim().length > 0)).toBe(true);
      expect(new Set(authored.map(({ acceptedAnswerTarget }) =>
        jp(acceptedAnswerTarget.tokens),
      )).size).toBe(10);
    }
  });

  it("enforces the allowed clause shape for each sentence lesson", () => {
    BASE_SENTENCE_FOUNDATIONS_MODULE.lessons.forEach((lesson, lessonIndex) => {
      for (const { acceptedAnswerTarget } of lesson.activityDesigns) {
        const surface = jp(acceptedAnswerTarget.tokens);
        if (lessonIndex === 0) {
          expect(acceptedAnswerTarget.lexemeIds.length).toBeGreaterThanOrEqual(2);
          expect(surface).not.toContain("です");
        } else if (lessonIndex === 1) {
          expect(acceptedAnswerTarget.lexemeIds).toHaveLength(1);
          expect(surface).not.toMatch(/、|\u3067\u3059/);
        } else if (lessonIndex === 2) {
          expect(surface.endsWith("です")).toBe(true);
          expect(surface).not.toContain("、");
        } else {
          expect(surface.endsWith("です")).toBe(true);
          expect((surface.match(/、/g) ?? []).length).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  it("rejects normalized duplicate worked surfaces", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      const normalized = lesson.examples.map(({ tokens }) =>
        jp(tokens).normalize("NFKC").replace(/\s+/g, ""),
      );
      expect(new Set(normalized).size).toBe(normalized.length);
      expect(new Set(lesson.examples.map(({ discourseFrameId }) =>
        discourseFrameId,
      )).size).toBe(lesson.examples.length);
    }
  });

  it("publishes all options canonically and balances position and length cues", () => {
    const sequences: string[] = [];
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      const correctPositions = lesson.activityDesigns.map(({ correctOptionIndex }) =>
        correctOptionIndex,
      );
      expect(
        Math.abs(
          correctPositions.filter((index) => index === 0).length -
          correctPositions.filter((index) => index === 1).length,
        ),
      ).toBeLessThanOrEqual(1);
      expect(correctPositions.filter((index) => index === null)).toHaveLength(1);
      sequences.push(correctPositions.join(""));
      expect(lesson.content.activities.map(({ optionTargetIds }) =>
        optionTargetIds?.length,
      )).toEqual([...Array(9).fill(2), 0]);
      expect(lesson.activityDesigns.every(({ optionTargets }, index) =>
        lesson.content.activities[index].optionTargetIds?.every(
          (id, optionIndex) =>
            BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS.acceptedAnswerTargets.get(id) ===
            optionTargets[optionIndex],
        ),
      )).toBe(true);
      const correctIsLongest = lesson.activityDesigns.filter(
        ({ optionTargets, correctOptionIndex }) => {
          const lengths = optionTargets.map(({ tokens }) => jp(tokens).length);
          const correct = correctOptionIndex ?? 0;
          return lengths[correct] > lengths[correct === 0 ? 1 : 0];
        },
      ).length;
      expect(correctIsLongest).toBeLessThanOrEqual(6);
    }
    expect(new Set(sequences).size).toBe(4);
  });

  it("declares every visible lexeme and forbids cross-activity answer leakage", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      const declared = new Set([
        ...lesson.content.newLexemeIds,
        ...lesson.content.reviewLexemeIds,
      ]);
      for (const design of lesson.activityDesigns) {
        for (const target of [
          design.promptTarget,
          design.acceptedAnswerTarget,
          ...design.optionTargets,
        ]) {
          expect(target.lexemeIds.every((id) => declared.has(id)), idFor(design.id, target))
            .toBe(true);
        }
      }
      const answers = lesson.activityDesigns.map(({ acceptedAnswerTarget }) =>
        jp(acceptedAnswerTarget.tokens),
      );
      const worked = new Set(
        lesson.examples.map(({ tokens }) => jp(tokens)),
      );
      lesson.activityDesigns.forEach(({ promptTarget, optionTargets }, index) => {
        const otherAnswers = new Set(answers.filter((_, answerIndex) => answerIndex !== index));
        expect(
          otherAnswers.has(jp(promptTarget.tokens)),
          `${lesson.content.lessonId}:${index + 1}:prompt:${jp(promptTarget.tokens)}`,
        ).toBe(false);
        optionTargets.forEach((target, optionIndex) => {
          if (optionIndex !== lesson.activityDesigns[index].correctOptionIndex) {
            expect(
              otherAnswers.has(jp(target.tokens)),
              `${lesson.content.lessonId}:${index + 1}:distractor:${jp(target.tokens)}`,
            ).toBe(false);
            expect(
              worked.has(jp(target.tokens)),
              `${lesson.content.lessonId}:worked-distractor:${jp(target.tokens)}`,
            ).toBe(false);
          }
        });
      });
    }
  });

  it("uses operation-specific instructions and feedback", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      const instructions = lesson.content.activities.map(({ instructionCopyId }) =>
        instructionCopyId,
      );
      const accepted = lesson.content.activities.map(({ acceptedFeedbackCopyId }) =>
        acceptedFeedbackCopyId,
      );
      const retry = lesson.content.activities.map(({ retryFeedbackCopyId }) =>
        retryFeedbackCopyId,
      );
      expect(new Set(instructions).size).toBe(10);
      expect(new Set(accepted).size).toBeGreaterThanOrEqual(6);
      expect(new Set(retry).size).toBeGreaterThanOrEqual(6);
    }
  });

  it("authors category, operation, interaction, and pattern cell on every activity", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
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
        expect(design.patternCellId).toBe(
          design.acceptedAnswerTarget.patternCellIds[0],
        );
        expect(lesson.patternCellIds).toContain(design.patternCellId);
        design.optionTargets.forEach((target, optionIndex) => {
          expect(
            target.patternCellIds.every((id) => id === design.patternCellId),
          ).toBe(true);
          if (optionIndex === design.correctOptionIndex) {
            expect(target.patternCellIds).toContain(design.patternCellId);
          }
        });
      });
    }
  });

  it("carries honest operation evidence rather than index-derived activity labels", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        expect(design.contextTarget.copyId).toBe(design.promptContextCopyId);
        expect(design.contextTarget.revealsAnswer).toBe(false);
        expect(design.operationEvidence.kind).toBe(design.operation);
        if (design.operation === "order-chunks") {
          expect(design.operationEvidence.tileTargetIds?.length)
            .toBeGreaterThanOrEqual(2);
        }
        if (design.operation === "transform-form") {
          expect(design.operationEvidence.sourceTargetId).toBeTruthy();
          expect(design.operationEvidence.sourceTargetId)
            .not.toBe(design.acceptedAnswerTarget.tokens[0]?.id);
        }
        if (design.operation === "diagnose-error") {
          expect(design.operationEvidence.errorCode?.length).toBeGreaterThan(0);
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
      }
    }
  });

  it("does not echo answer nouns in prompt cues, including listening and recall", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        const promptLexemes = new Set(design.promptTarget.lexemeIds);
        if (
          design.operation !== "transform-form" &&
          design.operation !== "diagnose-error"
        ) {
          for (const id of promptLexemes) {
            if (design.acceptedAnswerTarget.lexemeIds.includes(id)) {
              const promptSurface = normalized(design.promptTarget.tokens);
              const answerSurface = normalized(design.acceptedAnswerTarget.tokens);
              expect(
                design.optionTargets.every((target) =>
                  target.lexemeIds.includes(id),
                ) || promptSurface.endsWith(answerSurface),
                `${lesson.content.lessonId}:${design.id}:${id}`,
              ).toBe(true);
            }
          }
        }
        if (
          design.operation === "transform-form" ||
          design.operation === "diagnose-error" ||
          design.operation === "order-chunks"
        ) {
          expect(jp(design.promptTarget.tokens)).not.toBe(
            jp(design.acceptedAnswerTarget.tokens),
          );
        } else {
          expect(normalized(design.promptTarget.tokens)).not.toBe(
            normalized(design.acceptedAnswerTarget.tokens),
          );
        }
      }
    }
  });

  it("publishes no scaffolding glyphs or arrow pseudo-Japanese", () => {
    const visible = visibleJapaneseFor(
      BASE_SENTENCE_FOUNDATIONS_LESSONS,
      BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
    );
    expect(visible).not.toMatch(/[◇◎●↔♪↺→]/);
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        expect(jp(design.promptTarget.tokens)).not.toMatch(/[◇◎●↔♪↺→]/);
        expect(design.optionTargets.map((target) => jp(target.tokens)))
          .not.toContain(jp(design.promptTarget.tokens));
      }
    }
  });

  it("keeps SF1/SF2 Japanese as contextual fragments with role metadata", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons.slice(0, 2)) {
      expect(lesson.roleModels.length).toBeGreaterThanOrEqual(2);
      for (const example of lesson.examples) {
        expect(example.utteranceKind).toBe("contextual-fragment");
        expect(example.tokens.every(({ jp }) => jp !== "→")).toBe(true);
        expect(example.roleModelId).toBeTruthy();
        expect(example.recoverableContextId).toBeTruthy();
      }
    }
  });

  it("uses multi-chunk SF1 fragments and explicit SF2 omission pairs without padding", () => {
    const [sf1, sf2] = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons;
    expect(
      sf1.examples.every(
        ({ tokens }) => tokens.filter(({ kind }) => kind === "lexical").length >= 2,
      ),
    ).toBe(true);
    const sf1Surfaces = new Set(sf1.examples.map(({ tokens }) => normalized(tokens)));
    expect(
      sf2.examples.some(({ tokens }) => sf1Surfaces.has(normalized(tokens))),
    ).toBe(false);
    const pairs = new Map<string | null | undefined, typeof sf2.examples[number][]>();
    for (const example of sf2.examples) {
      const pair = pairs.get(example.recoverableContextId) ?? [];
      pair.push(example);
      pairs.set(example.recoverableContextId, pair);
    }
    expect(pairs.size).toBe(5);
    for (const pair of pairs.values()) {
      expect(pair).toHaveLength(2);
      expect(
        pair.map(({ tokens }) =>
          tokens.filter(({ kind }) => kind === "lexical").length,
        ).sort(),
      ).toEqual([1, 2]);
    }
  });

  it("keeps spoken answers hidden while retaining a canonical grading target", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
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

  it("uses only shared fact ids and leaves structural activities non-factual", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns) {
        expect(design.worldFactId ?? "").not.toMatch(/-fact-\d+$/);
        if (
          ["order-chunks", "transform-form", "discriminate-form-function"].includes(
            design.operation,
          )
        ) {
          expect(design.worldFactId).toBeNull();
        }
      }
    }
  });

  it("keeps diagnosis prompt distinct from both repair choices", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
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

  it("uses typed semantic audio contracts without visible answer cues", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
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

  it("keeps every instruction free of Japanese target and gloss leakage", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
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

  it("covers every accepted activity with the canonical world ledger", () => {
    const ledger = (BASE_SENTENCE_FOUNDATIONS_MODULE as unknown as {
      worldFactLedger: readonly {
        id: string;
        acceptedTargetIds: readonly string[];
        rejectedTargetIds: readonly string[];
      }[];
    }).worldFactLedger;
    expect(ledger).toHaveLength(
      new Set(BASE_SENTENCE_FOUNDATIONS_MODULE.worldFactIds).size,
    );
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      lesson.activityDesigns.forEach((design, index) => {
        if (!design.worldFactId) return;
        expect(BASE_SENTENCE_FOUNDATIONS_MODULE.worldFactIds)
          .toContain(design.worldFactId);
        const fact = ledger.find(({ id }) => id === design.worldFactId);
        expect(fact?.acceptedTargetIds).toContain(
          design.acceptedAnswerTargetId,
        );
        if (design.correctOptionIndex !== null) {
          expect(fact?.rejectedTargetIds).toContain(
            design.optionTargetIds[design.correctOptionIndex === 0 ? 1 : 0],
          );
        }
        expect(index).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it("mixes position and length fingerprints per lesson", () => {
    const positionFingerprints = new Set<string>();
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      const positions = lesson.activityDesigns.map(
        ({ correctOptionIndex }) => correctOptionIndex,
      );
      const fingerprint = positions.join("");
      positionFingerprints.add(fingerprint);
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
    expect(positionFingerprints.size).toBe(4);
  });

  it("uses distinct, genuinely authored category sequences by lesson", () => {
    const fingerprints = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons.map((lesson) =>
      lesson.content.activities.map(({ category }) => category).join("|"),
    );
    expect(new Set(fingerprints).size).toBe(4);
  });

  it("publishes true chunk permutations for every ordering activity", () => {
    const normalizeTiles = (tokens: readonly { jp: string }[]) =>
      tokens.map(({ jp }) => jp).sort().join("|");
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      for (const design of lesson.activityDesigns.filter(
        ({ operation }) => operation === "order-chunks",
      )) {
        expect(normalizeTiles(design.optionTargets[0].tokens)).toBe(
          normalizeTiles(design.optionTargets[1].tokens),
        );
        expect(
          design.promptTarget.lexemeIds.every((id) =>
            design.optionTargets.every(({ lexemeIds }) => lexemeIds.includes(id)),
          ),
        ).toBe(true);
      }
    }
  });

  it("uses a complete erroneous noun predicate for post-copula diagnosis", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons.slice(2)) {
      const diagnosis = lesson.activityDesigns.find(
        ({ operation }) => operation === "diagnose-error",
      );
      expect(diagnosis?.promptTarget.formIds).toContain(
        "affirmative-desu",
      );
    }
  });

  it("gives every activity independent localized diagnostic feedback", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
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

  it("uses every new lexeme visibly and retrieves it in the same lesson", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
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
      const visible = new Set(lesson.examples.flatMap(({ lexemeIds }) => lexemeIds));
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
  });

  function idFor(
    activityId: string,
    target: { readonly tokens: readonly { readonly jp: string }[] },
  ): string {
    return `${activityId}:${jp(target.tokens)}`;
  }

  it("updates only the sentence-anatomy reference and keeps later forms absent", () => {
    expect(
      BASE_SENTENCE_FOUNDATIONS_LESSONS.map(({ referenceSnapshotIds }) =>
        referenceSnapshotIds,
      ),
    ).toEqual([
      ["sentence-anatomy"],
      ["sentence-anatomy"],
      ["sentence-anatomy"],
      ["sentence-anatomy"],
    ]);
    const visible = visibleJapaneseFor(
      BASE_SENTENCE_FOUNDATIONS_LESSONS,
      BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
    );
    expect(visible).not.toMatch(/のです|たかい|しずか/);
    expect(
      BASE_SENTENCE_FOUNDATIONS_MODULE.lessons.flatMap(
        ({ examples, activityDesigns }) => [
          ...examples.flatMap(({ tokens }) => tokens),
          ...activityDesigns.flatMap(({ promptTarget, optionTargets }) => [
            ...promptTarget.tokens,
            ...optionTargets.flatMap(({ tokens }) => tokens),
          ]),
        ],
      ).some(({ jp }) => jp === "んです"),
    ).toBe(false);
    const particles = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons.flatMap(
      ({ examples, activityDesigns }) => [
        ...examples.flatMap(({ tokens }) => tokens),
        ...activityDesigns.flatMap(({ promptTarget, acceptedAnswerTarget }) => [
          ...promptTarget.tokens,
          ...acceptedAnswerTarget.tokens,
        ]),
      ],
    ).filter(({ kind }) => kind === "particle");
    expect(particles).toEqual([]);
  });

  it("localizes every authored copy independently in EN and IT", () => {
    const ids = new Set<string>();
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      ids.add(lesson.titleCopyId);
      ids.add(lesson.objectiveCopyId);
      ids.add(lesson.content.recapCopyId);
      Object.values(lesson.explanation).forEach((id) => ids.add(id));
      lesson.examples.forEach(({ teachingPurposeCopyId, translationCopy }) => {
        ids.add(teachingPurposeCopyId);
        if ("copyId" in translationCopy) ids.add(translationCopy.copyId);
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
      expect(en, id).not.toBe(id);
      expect(it, id).not.toBe(id);
    }
    expect(
      [...ids].filter(
        (id) => baseNavigationCopyEn.content[id] !== baseNavigationCopyIt.content[id],
      ).length,
    ).toBeGreaterThan(ids.size * 0.9);
  });

  it("keeps reviewed Japanese, English, and Italian meanings aligned", () => {
    const reviewed = [
      ["sentence-foundations-3-example-1-translation", "かんごしです", "They're a nurse.", "È infermiere."],
      ["sentence-foundations-3-example-2-translation", "べんごしです", "They're a lawyer.", "È avvocato."],
      ["sentence-foundations-4-example-1-translation", "さくらせんせいです。", "This is Professor Sakura.", "È la professoressa Sakura."],
      ["sentence-foundations-4-example-2-translation", "けんせんせいです。", "This is Professor Ken.", "È il professor Ken."],
    ] as const;
    const examples = new Map(
      BASE_SENTENCE_FOUNDATIONS_EXAMPLES.map((example) => [
        "copyId" in example.translationCopy ? example.translationCopy.copyId : "",
        jp(example.tokens),
      ]),
    );
    for (const [copyId, japanese, en, it] of reviewed) {
      expect(examples.get(copyId)).toBe(japanese);
      expect(baseNavigationCopyEn.content[copyId]).toBe(en);
      expect(baseNavigationCopyIt.content[copyId]).toBe(it);
    }
  });

  it("has no orphan sentence-foundations content copy", () => {
    const used = new Set<string>();
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      [
        lesson.titleCopyId,
        lesson.objectiveCopyId,
        lesson.content.recapCopyId,
        ...Object.values(lesson.explanation),
      ].forEach((id) => used.add(id));
      lesson.examples.forEach((example) => {
        used.add(example.teachingPurposeCopyId);
        if ("copyId" in example.translationCopy) used.add(example.translationCopy.copyId);
        if (example.contextCopyId) used.add(example.contextCopyId);
      });
      lesson.content.activities.forEach((activity) => {
        used.add(activity.instructionCopyId);
        used.add(activity.acceptedFeedbackCopyId);
        used.add(activity.retryFeedbackCopyId);
      });
    }
    const owned = Object.keys(baseNavigationCopyEn.content).filter((id) =>
      id.startsWith("sentence-foundations-"),
    );
    expect(owned.filter((id) => !used.has(id))).toEqual([]);
  });

  it("publishes immutable examples and rejects adversarial module input", () => {
    expect(Object.isFrozen(BASE_SENTENCE_FOUNDATIONS_MODULE)).toBe(true);
    expect(Object.isFrozen(BASE_SENTENCE_FOUNDATIONS_EXAMPLES[0].tokens)).toBe(true);
    const inherited = Object.create(BASE_SENTENCE_FOUNDATIONS_MODULE);
    expect(validateBaseSentenceFoundationsModule(inherited)).toEqual({
      ok: false,
      errors: ["invalid-module-shape"],
    });
    const sparse = {
      ...BASE_SENTENCE_FOUNDATIONS_MODULE,
      lessons: new Array(4),
    };
    expect(validateBaseSentenceFoundationsModule(sparse).ok).toBe(false);
    expect(
      validateBaseSentenceFoundationsModule({
        ...BASE_SENTENCE_FOUNDATIONS_MODULE,
        worldFacts: { ...BASE_SENTENCE_FOUNDATIONS_MODULE.worldFacts, tanaka: "lawyer" },
      }).ok,
    ).toBe(false);
    const firstLesson = BASE_SENTENCE_FOUNDATIONS_MODULE.lessons[0];
    const firstActivity = firstLesson.content.activities[0];
    expect(
      validateBaseSentenceFoundationsModule({
        ...BASE_SENTENCE_FOUNDATIONS_MODULE,
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
          ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons.slice(1),
        ],
      }).ok,
    ).toBe(false);
    expect(
      validateBaseSentenceFoundationsModule({
        ...BASE_SENTENCE_FOUNDATIONS_MODULE,
        lessons: [
          {
            ...firstLesson,
            activityDesigns: [
              {
                ...firstLesson.activityDesigns[0],
                patternCellId: "sf1-context-chunk",
                operationEvidence: { kind: "diagnose-error" },
              },
              ...firstLesson.activityDesigns.slice(1),
            ],
          },
          ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons.slice(1),
        ],
      }).ok,
    ).toBe(false);
  });
});
