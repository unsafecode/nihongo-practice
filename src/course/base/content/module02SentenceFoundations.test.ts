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
import {
  BASE_SENTENCE_FOUNDATIONS_EXAMPLES,
  BASE_SENTENCE_FOUNDATIONS_LESSONS,
  BASE_SENTENCE_FOUNDATIONS_MODULE,
  BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
  validateBaseSentenceFoundationsModule,
} from "./module02SentenceFoundations";

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

  it("uses every new lexeme visibly and retrieves it in the same lesson", () => {
    for (const lesson of BASE_SENTENCE_FOUNDATIONS_MODULE.lessons) {
      const visible = new Set(lesson.examples.flatMap(({ lexemeIds }) => lexemeIds));
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
  });

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
    expect(visible).not.toMatch(/んです|のです|たかい|しずか/);
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
  });
});
