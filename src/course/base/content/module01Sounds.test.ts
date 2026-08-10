import { describe, expect, it } from "vitest";
import { BASE_AUDIO_CATALOG, BASE_AUDIO_COPY } from "../audio/catalog";
import {
  BASIC_HIRAGANA,
  BASE_SOUND_MODULE,
  DAKUTEN_HIRAGANA,
  HANDAKUTEN_HIRAGANA,
  KATAKANA_BRIDGE,
  SOUND_ACTIVITY_OPERATIONS,
  YOON_HIRAGANA,
  validateBaseSoundModule,
} from "./module01Sounds";

type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key] extends readonly (infer Item)[]
    ? Mutable<Item>[]
    : T[Key] extends object
      ? Mutable<T[Key]>
      : T[Key];
};

function cloneModule(): Mutable<typeof BASE_SOUND_MODULE> {
  return structuredClone(BASE_SOUND_MODULE) as Mutable<typeof BASE_SOUND_MODULE>;
}

function assertDeepFrozen(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) assertDeepFrozen(child, seen);
}

describe("Base module 1 complete sound system", () => {
  it("allocates the complete mandatory inventory across exactly four scopes", () => {
    expect(new Set(BASIC_HIRAGANA).size).toBe(46);
    expect(BASIC_HIRAGANA).toHaveLength(46);
    expect(BASE_SOUND_MODULE.lessons.map((lesson) => lesson.lessonId)).toEqual([
      "sounds-1",
      "sounds-2",
      "sounds-3",
      "sounds-4",
    ]);
    expect(BASE_SOUND_MODULE.lessons[0].scopeTags).toEqual(
      expect.arrayContaining([
        "five-vowels",
        "unvoiced-gojuon",
        "basic-modern-hiragana-46",
        "mora-counting",
      ]),
    );
    expect(
      BASE_SOUND_MODULE.lessons[0].contrastiveItems.flatMap((item) => item.morae),
    ).toEqual(BASIC_HIRAGANA);
    expect(DAKUTEN_HIRAGANA).toEqual(
      expect.arrayContaining(["が", "ざ", "だ", "ば"]),
    );
    expect(HANDAKUTEN_HIRAGANA).toEqual(["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"]);
    expect(YOON_HIRAGANA).toEqual(
      expect.arrayContaining(["きゃ", "しゃ", "ちゃ", "にゅ", "りょ"]),
    );
    expect(KATAKANA_BRIDGE.length).toBeGreaterThan(0);
    expect(KATAKANA_BRIDGE.length).toBeLessThan(BASIC_HIRAGANA.length);
    expect(BASE_SOUND_MODULE.lessons[3].scopeTags).toContain(
      "bounded-katakana-bridge-not-full-module",
    );
  });

  it("meets the exact phonetic contract without sentence or semantic padding", () => {
    expect(SOUND_ACTIVITY_OPERATIONS).toEqual([
      "discriminate-sound",
      "segment-morae",
      "recognize-kana",
      "map-script",
      "match-sound-word",
      "assemble-reading",
    ]);

    for (const lesson of BASE_SOUND_MODULE.lessons) {
      expect(lesson.contract).toBe("phonetic");
      expect(new Set(lesson.contrastiveItems.map((item) => item.id)).size).toBe(
        lesson.contrastiveItems.length,
      );
      expect(lesson.contrastiveItems.length).toBeGreaterThanOrEqual(10);
      expect(lesson.contrastiveItems.length).toBeLessThanOrEqual(16);
      expect(lesson.anchorWords.length).toBeGreaterThanOrEqual(4);
      expect(lesson.anchorWords.length).toBeLessThanOrEqual(8);
      expect(new Set(lesson.audioExemplarIds).size).toBeGreaterThanOrEqual(6);

      const nonSpoken = lesson.activities.filter(
        (activity) => activity.mode === "non-spoken",
      );
      expect(nonSpoken).toHaveLength(6);
      expect(new Set(nonSpoken.map((activity) => activity.operation))).toEqual(
        new Set(SOUND_ACTIVITY_OPERATIONS),
      );
      expect(
        lesson.activities.filter((activity) => activity.category === "listening"),
      ).toHaveLength(1);
      expect(
        lesson.activities.filter((activity) => activity.category === "spoken"),
      ).toHaveLength(1);
      expect(new Set(lesson.activities.map((activity) => activity.id)).size).toBe(8);
      expect(new Set(lesson.activities.map((activity) => activity.targetId)).size).toBe(8);

      for (const forbidden of [
        "newLexemeIds",
        "workedExampleIds",
        "dialogueId",
        "sentenceCount",
        "explanationBlockIds",
        "patternCellIds",
      ]) {
        expect(lesson).not.toHaveProperty(forbidden);
      }
    }
  });

  it("links every assessed contrast to canonical audio and localized visible context", () => {
    const audioById = new Map(BASE_AUDIO_CATALOG.map((record) => [record.id, record]));
    for (const lesson of BASE_SOUND_MODULE.lessons) {
      expect(lesson.audioExemplarIds).toEqual(
        lesson.contrastiveItems.map((item) => item.audioId),
      );
      for (const item of lesson.contrastiveItems) {
        const audio = audioById.get(item.audioId);
        expect(audio?.src).toMatch(/^\/audio\/base\/.+\.wav$/);
        expect(audio?.morae).toEqual(item.morae);
        expect(audio?.kana).toBe(item.kana);
        expect(item.explanation.en).not.toBe("");
        expect(item.explanation.it).not.toBe("");
      }
      for (const anchor of lesson.anchorWords) {
        expect(anchor.meaning.en).not.toBe("");
        expect(anchor.meaning.it).not.toBe("");
        expect(anchor.status.en).toContain("anchor");
        expect(anchor.status.it).toContain("ancor");
      }
    }
    for (const locale of ["en", "it"] as const) {
      for (const id of [
        "base-audio-failed",
        "base-audio-unavailable",
        "base-audio-retry",
      ]) {
        expect(BASE_AUDIO_COPY[locale][id]).not.toBe("");
      }
    }
  });

  it("teaches mora timing accurately and bounds contested sound claims", () => {
    const timing = BASE_SOUND_MODULE.lessons[2];
    expect(timing.scopeTags).toEqual(
      expect.arrayContaining(["long-vowels", "small-tsu", "moraic-n", "timing-contrasts"]),
    );
    const longVowel = timing.contrastiveItems.find((item) => item.id === "snd3-obasan-obaasan");
    const smallTsu = timing.contrastiveItems.find((item) => item.id === "snd3-kite-kitte");
    const moraicN = timing.contrastiveItems.find((item) => item.id === "snd3-ka-kan");
    expect(longVowel?.morae).toEqual(["お", "ば", "あ", "さ", "ん"]);
    expect(smallTsu?.morae).toEqual(["き", "っ", "て"]);
    expect(moraicN?.morae).toEqual(["か", "ん"]);

    const yoon = BASE_SOUND_MODULE.lessons[3].contrastiveItems.find(
      (item) => item.kana === "きゃ",
    );
    expect(yoon?.morae).toEqual(["きゃ"]);

    const voiced = BASE_SOUND_MODULE.lessons[1];
    expect(voiced.scopeTags).toEqual(
      expect.arrayContaining(["dakuten", "handakuten", "ji-di-zu-dzu-orthography"]),
    );
    expect(voiced.scopeNote.en).toContain("not universally acoustically distinct");
    expect(voiced.scopeNote.it).toContain("non sono universalmente distinti");
  });

  it("excludes pitch accent explicitly in both locales", () => {
    expect(BASE_SOUND_MODULE.outOfScope.en.toLowerCase()).toContain("pitch accent");
    expect(BASE_SOUND_MODULE.outOfScope.it.toLowerCase()).toContain("accento tonale");
    expect(BASE_SOUND_MODULE.outOfScope.en).toContain("outside Base");
    expect(BASE_SOUND_MODULE.outOfScope.it).toContain("fuori dal Base");
  });

  it("deep-freezes the module and fails closed on duplicates and hostile shapes", () => {
    assertDeepFrozen(BASE_SOUND_MODULE);
    expect(validateBaseSoundModule(cloneModule())).toEqual({ ok: true, errors: [] });

    const duplicateLesson = cloneModule();
    duplicateLesson.lessons[1].lessonId = duplicateLesson.lessons[0].lessonId;
    expect(validateBaseSoundModule(duplicateLesson).errors).toContain(
      "invalid-lesson-allocation",
    );

    const duplicateItem = cloneModule();
    duplicateItem.lessons[0].contrastiveItems[1].id =
      duplicateItem.lessons[0].contrastiveItems[0].id;
    expect(validateBaseSoundModule(duplicateItem).errors).toContain(
      "duplicate-contrast-id",
    );

    const paddedIds = cloneModule();
    paddedIds.lessons[0].contrastiveItemIds[0] = "count-only-padding";
    paddedIds.lessons[0].anchorLexemeIds[0] = "count-only-anchor-padding";
    expect(validateBaseSoundModule(paddedIds).errors).toContain(
      "invalid-lesson-shape",
    );

    const wrongAudio = cloneModule();
    wrongAudio.lessons[0].contrastiveItems[0].audioId = "missing-audio";
    expect(validateBaseSoundModule(wrongAudio).errors).toContain(
      "mismatched-audio-linkage",
    );

    const sparse = cloneModule();
    delete sparse.lessons[0];
    expect(validateBaseSoundModule(sparse).errors).toContain("invalid-module-shape");

    const inherited = Object.setPrototypeOf(cloneModule(), { hidden: true });
    expect(validateBaseSoundModule(inherited).errors).toContain("invalid-module-shape");

    const getterLesson = cloneModule();
    Object.defineProperty(getterLesson.lessons[0], "contract", {
      get: () => "phonetic",
    });
    expect(validateBaseSoundModule(getterLesson).errors).toContain("invalid-lesson-shape");
  });
});
