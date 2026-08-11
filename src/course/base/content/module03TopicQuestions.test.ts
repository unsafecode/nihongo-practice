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
      const visible = new Set([
        ...lesson.examples.flatMap(({ lexemeIds }) => lexemeIds),
        ...(lesson.dialogue?.turns.flatMap(({ lexemeIds }) => lexemeIds) ?? []),
      ]);
      const retrieved = new Set(
        lesson.activityDesigns.flatMap(
          ({ promptTarget, acceptedAnswerTarget }) => [
            ...promptTarget.lexemeIds,
            ...acceptedAnswerTarget.lexemeIds,
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
    expect(visible).not.toMatch(/んです|のです|たかい|しずか/);
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
  });
});
