import { describe, expect, it } from "vitest";
import type { Locale } from "../../../i18n/LocaleContext";
import { buildA1LessonViewModel } from "../a1LessonViewModel";
import { module1ItemsByLesson } from "../catalog/module01Sounds";
import {
  a1LessonContentById,
  a1LexemeById,
} from "./catalog";
import {
  buildA1CurriculumViewModel,
  type A1CurriculumViewModel,
} from "./buildA1CurriculumViewModel";
import { a1LexemeByValueId } from "./lexicon";
import type { A1LessonContent } from "./types";

const LOCALES: readonly Locale[] = ["en", "it"];

function contentFor(lessonId: string): A1LessonContent {
  const content = a1LessonContentById[lessonId];
  if (!content) throw new Error(`missing fixture content for ${lessonId}`);
  return content;
}

function expectOk(
  lessonId: string,
  locale: Locale,
): A1CurriculumViewModel {
  const result = buildA1CurriculumViewModel(lessonId, locale);
  expect(result.ok, `${lessonId} (${locale})`).toBe(true);
  if (!result.ok) {
    throw new Error(`${lessonId} (${locale}) failed: ${result.error.code}`);
  }
  return result.model;
}

function stableProjection(model: A1CurriculumViewModel) {
  return {
    lessonId: model.lessonId,
    prerequisites: model.overview.prerequisites.map(({ id }) => id),
    vocabulary: model.vocabulary.map(
      ({ id, kana, romaji, category, verb, isReview }) => ({
        id,
        kana,
        romaji,
        category,
        verb,
        isReview,
      }),
    ),
    vocabularyException: model.vocabularyException === null ? null : true,
    note: {
      id: model.note.id,
      kind: model.note.kind,
      pattern: model.note.pattern.map(({ kind, text }) => ({ kind, text })),
      nearestContrastId: model.note.nearestContrast?.id ?? null,
    },
    examples: model.examples.map((example) => ({
      variantId: example.variantId,
      japanese: example.spokenJapanese,
      tokens: example.tokens.map(({ token, role }) => ({
        id: token.id,
        jp: token.jp,
        romaji: token.romaji,
        kind: token.kind,
        role,
      })),
    })),
    dialogue: model.dialogue?.map((example) => ({
      variantId: example.variantId,
      japanese: example.spokenJapanese,
    })) ?? null,
    optionalPattern:
      model.optionalPattern?.rows.map((row) => ({
        variantId: row.variantId,
        tokens: row.tokens.map((token) => ({
          id: token.id,
          jp: token.jp,
          romaji: token.romaji,
        })),
      })) ?? null,
    activities: model.practice.activities.map((activity) => ({
      id: activity.id,
      function: activity.function,
      interactionKind: activity.interactionKind,
      targetRef: activity.targetRef,
    })),
    recapVocabulary: model.recap.vocabulary.map(({ id, isReview }) => ({ id, isReview })),
  };
}

describe("buildA1CurriculumViewModel — introductions-1", () => {
  const content = contentFor("introductions-1");

  for (const locale of LOCALES) {
    it(`joins the canonical instructional content in ${locale}`, () => {
      const model = expectOk("introductions-1", locale);
      const production = buildA1LessonViewModel("introductions-1", locale);
      expect(production.ok).toBe(true);
      if (!production.ok) return;

      expect(model.overview.canDo.trim()).not.toBe("");
      expect(model.overview.situation.trim()).not.toBe("");
      expect(model.overview.prerequisites).toHaveLength(1);
      expect(model.overview.prerequisites[0]).toMatchObject({
        id: "sounds-4",
      });
      expect(model.overview.prerequisites[0]?.title.trim()).not.toBe("");

      expect(model.vocabulary.map((entry) => entry.id)).toEqual(content.newLexemeIds);
      expect(model.vocabulary).toHaveLength(5);
      expect(model.vocabulary.length).toBeGreaterThanOrEqual(4);
      expect(model.vocabulary.length).toBeLessThanOrEqual(6);
      for (const vocabulary of model.vocabulary) {
        const canonical = a1LexemeById[vocabulary.id];
        expect(canonical, vocabulary.id).toBeDefined();
        expect(vocabulary).toMatchObject({
          kana: canonical?.kana,
          romaji: canonical?.romaji,
          meaning: canonical?.meaning[locale],
          category: canonical?.category,
        });
      }
      expect(model.vocabulary.find((entry) => entry.id === "a1-lexeme-aatisuto")).toMatchObject({
        kana: "アーティスト",
        romaji: "aatisuto",
        meaning: a1LexemeById["a1-lexeme-aatisuto"]?.meaning[locale],
        category: "person",
      });

      expect(model.note).toMatchObject({
        id: content.learningNoteId,
      });
      for (const value of [
        model.note.title,
        model.note.meaning,
        model.note.use,
        model.note.construction,
        model.note.typicalMistake,
      ]) {
        expect(value.trim()).not.toBe("");
      }
      expect(model.note.subjectOmission?.trim()).not.toBe("");
      expect(model.note.pattern.length).toBeGreaterThan(0);
      for (const token of model.note.pattern) {
        expect(token.label.trim()).not.toBe("");
      }
      expect(model.note.nearestContrast?.title.trim()).not.toBe("");

      expect(model.examples.map((example) => example.variantId)).toEqual(
        content.workedExampleVariantIds,
      );
      expect(model.examples).toHaveLength(2);
      for (const example of model.examples) {
        expect(example.tokens.length).toBeGreaterThan(0);
        expect(example.translation.trim()).not.toBe("");
        expect(example.spokenJapanese).toBe(example.tokens.map(({ token }) => token.jp).join(""));
        for (const glossed of example.tokens) {
          expect(glossed.roleLabel.trim(), glossed.token.id).not.toBe("");
          if (glossed.token.kind === "lexical") {
            expect(glossed.role).toBe("lexeme");
            expect(glossed.gloss?.trim(), glossed.token.id).not.toBe("");
          } else {
            expect(glossed.gloss).toBeNull();
            expect(glossed.role).toBe(
              glossed.token.kind === "particle"
                ? "particle"
                : glossed.token.kind === "morpheme"
                  ? "ending"
                  : "punctuation",
            );
          }
        }
      }

      expect(model.dialogue?.map((example) => example.variantId)).toEqual(
        content.dialogue?.turnVariantIds,
      );
      expect(model.optionalPattern).toEqual(production.model.matrix);

      expect(model.practice.activities).toEqual(content.practiceBlueprint.activities);
      expect(model.practice.activities).toHaveLength(5);
      expect(model.practice.activities.filter((activity) => activity.interactionKind !== "spoken")).toHaveLength(4);
      expect(model.practice.activities.at(-1)).toMatchObject({
        function: "listening-speaking",
        interactionKind: "spoken",
      });

      expect(model.recap.vocabulary.map((entry) => entry.id)).toEqual(content.newLexemeIds);
      expect(model.recap.retrievalCue.trim()).not.toBe("");
    });
  }

  it("keeps identifiers, Japanese, romaji, targets, and activity order locale-invariant", () => {
    expect(stableProjection(expectOk("introductions-1", "it"))).toEqual(
      stableProjection(expectOk("introductions-1", "en")),
    );
  });
});

describe("buildA1CurriculumViewModel — verb, phonetic, and capstone contracts", () => {
  it.each(["polite-verbs-1", "polite-verbs-2"])(
    "carries canonical dictionary, polite, and class metadata for verb vocabulary in %s",
    (lessonId) => {
      const model = expectOk(lessonId, "en");
      const verbs = model.vocabulary.filter((entry) => entry.category === "verb");
      expect(verbs.length).toBeGreaterThan(0);
      for (const verb of verbs) {
        expect(verb.verb).toBeDefined();
        expect(verb.verb?.dictionary.kana.trim()).not.toBe("");
        expect(verb.verb?.dictionary.romaji.trim()).not.toBe("");
        expect(verb.verb?.polite.kana.trim()).not.toBe("");
        expect(verb.verb?.polite.romaji.trim()).not.toBe("");
        expect(["godan", "ichidan", "irregular"]).toContain(verb.verb?.class);
      }
    },
  );

  it("uses phonetic item IDs for examples while glossing anchor words from canonical vocabulary", () => {
    const content = contentFor("sounds-4");
    const model = expectOk("sounds-4", "en");
    const items = module1ItemsByLesson["sounds-4"]!;

    expect(model.examples.map((example) => example.variantId)).toEqual(
      content.workedExampleVariantIds,
    );
    expect(model.examples.map((example) => example.tokens[0]?.token.source.referenceId)).toEqual(
      content.workedExampleVariantIds,
    );
    expect(model.examples.map((example) => example.spokenJapanese)).toEqual(
      content.workedExampleVariantIds.map(
        (id) => items.find((item) => item.id === id)?.glyph,
      ),
    );
    const coffee = model.examples.find((example) => example.variantId === "snd4-koohii");
    expect(coffee?.tokens[0]).toMatchObject({
      gloss: a1LexemeById["a1-lexeme-koohii"]?.meaning.en,
      role: "lexeme",
    });
    expect(model.optionalPattern).toBeNull();
  });

  it("marks a capstone's deterministic worked vocabulary as review rather than first exposure", () => {
    const content = contentFor("capstones-1");
    const model = expectOk("capstones-1", "en");
    const workedIds = new Set([
      ...content.workedExampleVariantIds,
      ...(content.dialogue?.turnVariantIds ?? []),
    ]);

    expect(content.newLexemeIds).toEqual([]);
    expect(model.vocabulary.length).toBeGreaterThanOrEqual(4);
    expect(model.vocabulary.length).toBeLessThanOrEqual(6);
    expect(model.vocabulary.every((entry) => entry.isReview === true)).toBe(true);
    expect(model.vocabulary.every((entry) => !("isNew" in entry))).toBe(true);
    expect(model.vocabularyException?.trim()).not.toBe("");
    expect(
      model.examples.concat(model.dialogue ?? []).every((example) => workedIds.has(example.variantId)),
    ).toBe(true);
    expect(model.recap.vocabulary.map((entry) => entry.id)).toEqual(
      model.vocabulary.map((entry) => entry.id),
    );
  });
});

describe("buildA1CurriculumViewModel — complete A1 coverage", () => {
  it("resolves every one of the 64 curriculum rows in both locales without a partial model", () => {
    for (const locale of LOCALES) {
      for (const content of Object.values(a1LessonContentById)) {
        if (!content) continue;
        const model = expectOk(content.lessonId, locale);
        expect(model.examples.length, content.lessonId).toBeGreaterThanOrEqual(2);
        expect(model.examples.length, content.lessonId).toBeLessThanOrEqual(3);
        expect(model.practice.activities, content.lessonId).toHaveLength(5);
        expect(
          model.practice.activities.filter((activity) => activity.interactionKind !== "spoken"),
          content.lessonId,
        ).toHaveLength(4);
        expect(model.recap.retrievalCue.trim(), content.lessonId).not.toBe("");
        if (content.newLexemeIds.length === 0) {
          expect(model.vocabulary.length, content.lessonId).toBeGreaterThanOrEqual(4);
          expect(model.vocabulary.length, content.lessonId).toBeLessThanOrEqual(6);
          expect(model.vocabulary.every((entry) => entry.isReview === true), content.lessonId).toBe(
            true,
          );
        } else {
          expect(model.vocabulary.map((entry) => entry.id), content.lessonId).toEqual(
            content.newLexemeIds,
          );
        }
      }
    }
  });
});

describe("buildA1CurriculumViewModel — fail-closed failures", () => {
  it("returns an unknown-lesson error instead of an empty model", () => {
    const result = buildA1CurriculumViewModel("not-a-real-lesson", "en");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      code: "unknown-lesson",
      referenceId: "not-a-real-lesson",
    });
    expect("model" in result).toBe(false);
  });

  it("returns unresolved-content when a required note cannot resolve", () => {
    const content = contentFor("introductions-1");
    const result = buildA1CurriculumViewModel("introductions-1", "en", {
      lessonContentById: {
        ...a1LessonContentById,
        "introductions-1": { ...content, learningNoteId: "missing-note" },
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      code: "unresolved-content",
      referenceId: "missing-note",
    });
    expect("model" in result).toBe(false);
  });

  it("returns unresolved-example when a content example does not resolve", () => {
    const content = contentFor("introductions-1");
    const result = buildA1CurriculumViewModel("introductions-1", "en", {
      lessonContentById: {
        ...a1LessonContentById,
        "introductions-1": {
          ...content,
          workedExampleVariantIds: ["missing-variant", "introductions-1-m4"],
        },
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      code: "unresolved-example",
      referenceId: "missing-variant",
    });
    expect("model" in result).toBe(false);
  });

  it("returns unresolved-gloss rather than inferring a word meaning from translation copy", () => {
    const result = buildA1CurriculumViewModel("introductions-1", "en", {
      lexemeByValueId: {
        ...a1LexemeByValueId,
        "a1-value-yuki": undefined,
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      code: "unresolved-gloss",
      referenceId: "a1-value-yuki",
    });
    expect("model" in result).toBe(false);
  });
});
