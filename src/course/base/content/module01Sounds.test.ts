import { describe, expect, it } from "vitest";
import * as soundModule from "./module01Sounds";
import { getCourseCopy } from "../../i18n/catalog";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import { baseActivityPromptKey } from "../catalog/visibleTargets";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { BASE_AUDIO_CATALOG } from "../audio/catalog";
import {
  BASIC_HIRAGANA,
  BASE_SOUND_COPY_IDS,
  BASE_SOUND_LESSONS,
  BASE_SOUND_MODULE,
  BASE_SOUND_VALIDATION_CATALOGS,
  COMMON_YOON_RELEASE_SUBSET,
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
  it("uses an audible か/が listening contrast and keeps ず/づ spelling-only", () => {
    const sounds2 = BASE_SOUND_MODULE.lessons[1];
    const listening = sounds2.activityDesigns.find(
      (design) => design.operation === "identify-audio",
    );
    expect(listening?.activityId).toBe("snd2-listen-kaga");
    expect(listening?.contrastItemIds).toEqual(["snd2-ka", "snd2-ga"]);
    expect(listening?.canonicalAudioId).toBe("snd2-ga");
    const ka = BASE_AUDIO_CATALOG.find((record) => record.id === "snd2-ka")!;
    const ga = BASE_AUDIO_CATALOG.find((record) => record.id === "snd2-ga")!;
    expect(ka.sha256).not.toBe(ga.sha256);

    const spelling = sounds2.activityDesigns.find(
      (design) => design.operation === "recognize-kana",
    );
    expect(spelling?.contrastItemIds).toEqual(
      expect.arrayContaining(["snd2-ji", "snd2-di", "snd2-zu", "snd2-dzu"]),
    );
    expect(spelling?.canonicalAudioId).toBeNull();
    for (const locale of ["en", "it"] as const) {
      expect(
        getCourseCopy(locale).baseContent["snd2-listen-kaga-instruction"],
      ).not.toBe("");
      expect(
        getCourseCopy(locale).baseContent["snd2-listen-zudzu-instruction"],
      ).toBeUndefined();
    }
  });

  it("publishes truthful non-Japanese romaji for every sound surface", () => {
    const targetCatalog = (
      soundModule as unknown as {
        BASE_SOUND_TARGET_BY_ID?: ReadonlyMap<
          string,
          { kana: string; romaji: string }
        >;
      }
    ).BASE_SOUND_TARGET_BY_ID;
    expect(targetCatalog).toBeDefined();
    const japanese = /[\u3040-\u30ff\u3400-\u9fff]/;
    for (const definition of BASE_SOUND_MODULE.lessons) {
      for (const item of definition.contrastiveItems) {
        expect(item.romaji).not.toMatch(japanese);
        expect(item.romaji.trim()).not.toBe("");
        expect(item.romaji).toBe(
          soundModule.romanizeBaseSoundSurface(item.kana),
        );
      }
      for (const anchor of definition.anchorWords) {
        expect(anchor.romaji).not.toMatch(japanese);
        expect(anchor.romaji.trim()).not.toBe("");
        expect(anchor.romaji).toBe(
          soundModule.romanizeBaseSoundSurface(anchor.kana),
        );
      }
    }
    for (const target of targetCatalog?.values() ?? []) {
      expect(target.romaji).not.toMatch(japanese);
      expect(target.romaji.trim()).not.toBe("");
    }
    for (const target of BASE_SOUND_VALIDATION_CATALOGS.audioTargets.values()) {
      expect(target.tokens[0].romaji).not.toMatch(japanese);
      expect(target.tokens[0].romaji.trim()).not.toBe("");
      expect(target.tokens[0].romaji).toBe(
        soundModule.romanizeBaseSoundSurface(target.tokens[0].jp),
      );
    }
  });

  it("uses typed prompt, option, answer, and anchor targets without prompt stuffing", () => {
    const targetCatalog = (
      soundModule as unknown as {
        BASE_SOUND_TARGET_BY_ID?: ReadonlyMap<
          string,
          { kana: string; role: string }
        >;
      }
    ).BASE_SOUND_TARGET_BY_ID;
    expect(targetCatalog).toBeDefined();
    const kanji = /[\u3400-\u9fff]/;
    const katakana = /[\u30a1-\u30fa\u30fc]/;
    for (const definition of BASE_SOUND_MODULE.lessons) {
      const sound4 = definition.content.lessonId === "sounds-4";
      for (const design of definition.activityDesigns) {
        const prompt = targetCatalog?.get(design.promptTargetId);
        const answer = targetCatalog?.get(design.answerTargetId);
        const anchor = targetCatalog?.get(design.anchorTargetId);
        expect(prompt?.role).toBe("prompt");
        expect(answer?.role).toBe("answer");
        expect(anchor?.role).toBe("anchor");
        expect(prompt?.kana).not.toMatch(kanji);
        if (!sound4) expect(prompt?.kana).not.toMatch(katakana);
        expect(prompt?.kana).not.toContain("せんたく");
        expect(prompt?.kana).not.toContain("あんかあ");
        for (const optionId of design.optionTargetIds) {
          expect(targetCatalog?.get(optionId)?.role).toBe("option");
        }
      }
    }
  });

  it("uses plausible kana choices with varied correct positions and no meta answers", () => {
    const targetCatalog = (
      soundModule as unknown as {
        BASE_SOUND_TARGET_BY_ID?: ReadonlyMap<string, { kana: string }>;
      }
    ).BASE_SOUND_TARGET_BY_ID;
    const forbidden = /[≠＝→]|ひとつ/;
    for (const definition of BASE_SOUND_MODULE.lessons) {
      const correctPositions = new Set<number>();
      for (const design of definition.activityDesigns) {
        const answerIndex = design.correctOptionTargetId
          ? design.optionTargetIds.indexOf(design.correctOptionTargetId)
          : -1;
        if (design.operation !== "produce-spoken") {
          expect(answerIndex).toBeGreaterThanOrEqual(0);
          correctPositions.add(answerIndex);
        }
        for (const targetId of [
          design.promptTargetId,
          ...design.optionTargetIds,
          design.answerTargetId,
        ]) {
          expect(targetCatalog?.get(targetId)?.kana).not.toMatch(forbidden);
        }
      }
      expect(correctPositions).toEqual(new Set([0, 1]));
    }
  });

  it("links only contrast items visibly realized by typed activity surfaces", () => {
    const targetCatalog = (
      soundModule as unknown as {
        BASE_SOUND_TARGET_BY_ID?: ReadonlyMap<string, { kana: string }>;
      }
    ).BASE_SOUND_TARGET_BY_ID;
    const normalize = (value: string) =>
      value.replace(/[\s・／＿]/g, "");
    for (const definition of BASE_SOUND_MODULE.lessons) {
      const itemById = new Map(
        definition.contrastiveItems.map((item) => [item.id, item]),
      );
      for (const design of definition.activityDesigns) {
        const visible = [
          design.promptTargetId,
          ...design.optionTargetIds,
          design.answerTargetId,
          ...(design.canonicalAudioId ? [design.canonicalAudioId] : []),
        ]
          .map(
            (targetId) =>
              targetCatalog?.get(targetId)?.kana ??
              BASE_AUDIO_CATALOG.find((record) => record.id === targetId)?.kana ??
              "",
          )
          .map(normalize)
          .join("|");
        for (const contrastId of design.contrastItemIds) {
          expect(visible, `${design.activityId}:${contrastId}`).toContain(
            normalize(itemById.get(contrastId)?.kana ?? ""),
          );
        }
      }
    }
    for (const activityId of [
      "snd4-match-shashin",
      "snd4-assemble-kyaku",
      "snd4-read-chuui",
    ]) {
      const design = BASE_SOUND_MODULE.lessons[3].activityDesigns.find(
        (entry) => entry.activityId === activityId,
      )!;
      expect(design.contrastItemIds).not.toEqual(
        expect.arrayContaining(["snd4-byo", "snd4-pyo", "snd4-gyu", "snd4-ja"]),
      );
    }
    for (const visibleOnlyId of [
      "snd4-byo",
      "snd4-pyo",
      "snd4-gyu",
      "snd4-ja",
    ]) {
      expect(
        BASE_SOUND_MODULE.lessons[3].contrastiveItems.some(
          (item) => item.id === visibleOnlyId,
        ),
      ).toBe(true);
      expect(
        BASE_SOUND_MODULE.lessons[3].content.audioExemplarIds,
      ).toContain(visibleOnlyId);
    }
  });

  it("resolves every learner-facing lesson, anchor, and audio-state copy in both runtime locales", () => {
    for (const locale of ["en", "it"] as const) {
      const runtimeCopy = getCourseCopy(locale).baseContent;
      expect(Object.keys(runtimeCopy).sort()).toEqual([...BASE_SOUND_COPY_IDS].sort());
      for (const copyId of BASE_SOUND_COPY_IDS) {
        expect(runtimeCopy[copyId]?.trim(), `${locale}:${copyId}`).not.toBe("");
      }
    }
  });

  it("publishes all four lessons through the canonical Base depth pipeline", () => {
    expect(BASE_SOUND_LESSONS).toHaveLength(4);
    for (const lesson of BASE_SOUND_LESSONS) {
      expect(validateBaseLessonDepth(lesson, BASE_SOUND_VALIDATION_CATALOGS)).toEqual(
        [],
      );
      expect(Object.isFrozen(lesson)).toBe(true);
    }
  });

  it("exposes canonical sound catalogs through mutation-free runtime views", () => {
    for (const map of [
      BASE_SOUND_VALIDATION_CATALOGS.audioTargets,
      BASE_SOUND_VALIDATION_CATALOGS.acceptedAnswerTargets,
      BASE_SOUND_VALIDATION_CATALOGS.activityPromptTargets,
    ]) {
      expect("set" in map).toBe(false);
      expect("delete" in map).toBe(false);
      expect("clear" in map).toBe(false);
    }
    for (const set of [
      BASE_SOUND_VALIDATION_CATALOGS.copyIds,
      BASE_SOUND_VALIDATION_CATALOGS.contrastMapIds,
      BASE_SOUND_VALIDATION_CATALOGS.patternCellIds,
    ]) {
      expect("add" in set).toBe(false);
      expect("delete" in set).toBe(false);
      expect("clear" in set).toBe(false);
    }
    expect("set" in soundModule.BASE_SOUND_TARGET_BY_ID).toBe(false);
    for (const target of soundModule.BASE_SOUND_TARGET_BY_ID.values()) {
      expect(Object.isFrozen(target)).toBe(true);
    }
  });

  it("registers every anchor and every activity prompt, answer, and assessed target", () => {
    for (const definition of BASE_SOUND_MODULE.lessons) {
      const lesson = definition.content;
      for (const anchor of definition.anchorWords) {
        const lexeme = BASE_LEXEME_BY_ID.get(anchor.id);
        expect(lexeme?.kana).toBe(anchor.kana);
        expect(lexeme?.meaningCopyId).toBe(anchor.meaningCopyId);
        expect(lesson.anchorLexemeIds).toContain(anchor.id);
      }
      for (const activity of lesson.activities) {
        expect(
          BASE_SOUND_VALIDATION_CATALOGS.activityPromptTargets.has(
            baseActivityPromptKey(lesson.lessonId, activity.id),
          ),
        ).toBe(true);
        const prompt =
          BASE_SOUND_VALIDATION_CATALOGS.activityPromptTargets.get(
            baseActivityPromptKey(lesson.lessonId, activity.id),
          );
        const design = definition.activityDesigns.find(
          (entry) => entry.activityId === activity.id,
        )!;
        expect(prompt?.tokens[0].jp).toBe(
          soundModule.BASE_SOUND_TARGET_BY_ID.get(design.promptTargetId)?.kana,
        );
        expect(
          soundModule.BASE_SOUND_TARGET_BY_ID.get(design.anchorTargetId)?.kana,
        ).toBe(
          definition.anchorWords.find(
            (anchor) => anchor.id === design.anchorLexemeId,
          )?.kana,
        );
        expect(
          BASE_SOUND_VALIDATION_CATALOGS.acceptedAnswerTargets.has(activity.targetId) ||
            BASE_SOUND_VALIDATION_CATALOGS.audioTargets.has(activity.targetId),
        ).toBe(true);
        expect(
          activity.assessedConceptIds.length + activity.assessedLexemeIds.length,
        ).toBeGreaterThan(0);
      }
      for (const anchorId of lesson.anchorLexemeIds) {
        expect(
          definition.activityDesigns.some(
            (design) =>
              design.anchorLexemeId === anchorId &&
              soundModule.BASE_SOUND_TARGET_BY_ID.get(design.anchorTargetId)
                ?.role === "anchor",
          ),
        ).toBe(true);
      }
    }
  });

  it("binds each cognitive operation to substantive scoped evidence", () => {
    const expectedEvidence = new Map([
      ["discriminate-sound", "contrast-pair"],
      ["segment-morae", "segmented-morae"],
      ["recognize-kana", "kana-recognition"],
      ["map-script", "script-correspondence"],
      ["match-sound-word", "sound-word-match"],
      ["assemble-reading", "controlled-assembly"],
      ["identify-audio", "listening-identification"],
      ["produce-spoken", "read-aloud"],
    ]);
    for (const definition of BASE_SOUND_MODULE.lessons) {
      for (const design of definition.activityDesigns) {
        expect(design.evidenceTag).toBe(expectedEvidence.get(design.operation));
        const answer = soundModule.BASE_SOUND_TARGET_BY_ID.get(
          design.answerTargetId,
        );
        const anchor = soundModule.BASE_SOUND_TARGET_BY_ID.get(
          design.anchorTargetId,
        );
        if (design.operation === "segment-morae") {
          expect(answer?.kana).toContain("・");
        }
        if (
          design.operation === "match-sound-word" ||
          design.operation === "assemble-reading"
        ) {
          expect(answer?.kana).toBe(anchor?.kana);
        }
        if (design.operation === "identify-audio") {
          expect(design.canonicalAudioId).not.toBeNull();
        }
        if (design.operation === "produce-spoken") {
          expect(design.optionTargetIds).toEqual([]);
        } else {
          expect(new Set(design.optionTargetIds).size).toBeGreaterThanOrEqual(2);
          expect(design.optionTargetIds).toContain(
            design.correctOptionTargetId,
          );
        }
      }
    }
    const sounds2Evidence = new Set(
      BASE_SOUND_MODULE.lessons[1].activityDesigns.flatMap(
        (design) => design.contrastItemIds,
      ),
    );
    for (const id of [
      "snd2-ji",
      "snd2-di",
      "snd2-zu",
      "snd2-dzu",
      "snd2-pa",
      "snd2-pu",
    ]) {
      expect(sounds2Evidence.has(id), id).toBe(true);
    }
    expect(
      BASE_SOUND_MODULE.lessons[2].activityDesigns.some((design) =>
        design.contrastItemIds.includes("snd3-ka-kan"),
      ),
    ).toBe(true);
    const katakanaMapping = BASE_SOUND_MODULE.lessons[3].activityDesigns.find(
      (design) => design.operation === "map-script",
    );
    expect(
      soundModule.BASE_SOUND_TARGET_BY_ID.get(
        katakanaMapping?.answerTargetId ?? "",
      )?.kana,
    ).toBe("ア・カ・コ");
  });

  it("partitions each declared inventory into assessed coverage or an explicit rationale", () => {
    const inventories = new Map([
      ["basic-hiragana", BASIC_HIRAGANA],
      ["dakuten", DAKUTEN_HIRAGANA],
      ["handakuten", HANDAKUTEN_HIRAGANA],
      ["common-yoon", YOON_HIRAGANA],
      ["katakana-bridge", KATAKANA_BRIDGE],
    ]);
    for (const definition of BASE_SOUND_MODULE.lessons) {
      for (const coverage of definition.inventoryCoverage) {
        const inventory = inventories.get(coverage.inventoryId)!;
        expect(new Set([...coverage.represented, ...coverage.scopedOut])).toEqual(
          new Set(inventory),
        );
        if (coverage.scopedOut.length > 0) {
          expect(coverage.rationale?.en.trim()).not.toBe("");
          expect(coverage.rationale?.it.trim()).not.toBe("");
        } else {
          expect(coverage.rationale).toBeNull();
        }
      }
    }
  });

  it("allocates the complete mandatory inventory across exactly four scopes", () => {
    expect(new Set(BASIC_HIRAGANA).size).toBe(46);
    expect(BASIC_HIRAGANA).toHaveLength(46);
    expect(
      BASE_SOUND_MODULE.lessons.map((definition) => definition.content.lessonId),
    ).toEqual([
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
    expect(COMMON_YOON_RELEASE_SUBSET).toEqual([
      "きゃ",
      "しゃ",
      "ちゃ",
      "にゅ",
      "りょ",
      "ぎゅ",
      "じゃ",
      "びょ",
      "ぴょ",
    ]);
    expect(BASE_SOUND_MODULE.lessons[3].contrastiveItems.map((item) => item.kana)).toEqual(
      expect.arrayContaining([...COMMON_YOON_RELEASE_SUBSET]),
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

    for (const definition of BASE_SOUND_MODULE.lessons) {
      const lesson = definition.content;
      expect(lesson.contract).toBe("phonetic");
      expect(
        new Set(definition.contrastiveItems.map((item) => item.id)).size,
      ).toBe(
        definition.contrastiveItems.length,
      );
      expect(definition.contrastiveItems.length).toBeGreaterThanOrEqual(10);
      expect(definition.contrastiveItems.length).toBeLessThanOrEqual(16);
      expect(definition.anchorWords.length).toBeGreaterThanOrEqual(4);
      expect(definition.anchorWords.length).toBeLessThanOrEqual(8);
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
    for (const definition of BASE_SOUND_MODULE.lessons) {
      const lesson = definition.content;
      expect(lesson.audioExemplarIds).toEqual(
        definition.contrastiveItems.map((item) => item.audioId),
      );
      for (const item of definition.contrastiveItems) {
        const audio = audioById.get(item.audioId);
        expect(audio?.src).toMatch(/^\/audio\/base\/.+\.wav$/);
        expect(audio?.morae).toEqual(item.morae);
        expect(audio?.kana).toBe(item.kana);
        expect(item.explanation.en).not.toBe("");
        expect(item.explanation.it).not.toBe("");
      }
      for (const anchor of definition.anchorWords) {
        expect(getCourseCopy("en").baseContent[anchor.meaningCopyId]).not.toBe("");
        expect(getCourseCopy("it").baseContent[anchor.meaningCopyId]).not.toBe("");
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
        expect(getCourseCopy(locale).baseContent[id]).not.toBe("");
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
    duplicateLesson.lessons[1].content.lessonId =
      duplicateLesson.lessons[0].content.lessonId;
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
    paddedIds.lessons[0].content.contrastiveItemIds[0] = "count-only-padding";
    paddedIds.lessons[0].content.anchorLexemeIds[0] = "count-only-anchor-padding";
    expect(validateBaseSoundModule(paddedIds).errors).toContain(
      "invalid-lesson-shape",
    );

    const wrongAudio = cloneModule();
    wrongAudio.lessons[0].contrastiveItems[0].audioId = "missing-audio";
    expect(validateBaseSoundModule(wrongAudio).errors).toContain(
      "mismatched-audio-linkage",
    );

    const fakeRomaji = cloneModule();
    fakeRomaji.lessons[0].contrastiveItems[0].romaji = "wrong";
    expect(validateBaseSoundModule(fakeRomaji).errors).toContain(
      "invalid-lesson-shape",
    );

    const untypedPrompt = cloneModule();
    untypedPrompt.lessons[0].activityDesigns[0].promptTargetId =
      untypedPrompt.lessons[0].activityDesigns[0].anchorTargetId;
    expect(validateBaseSoundModule(untypedPrompt).errors).toContain(
      "invalid-activity-evidence",
    );

    const cosmeticOperation = cloneModule();
    cosmeticOperation.lessons[0].activityDesigns[1].evidenceTag =
      "contrast-pair";
    expect(validateBaseSoundModule(cosmeticOperation).errors).toContain(
      "invalid-activity-evidence",
    );

    const cosmeticSegmentation = cloneModule();
    cosmeticSegmentation.lessons[0].activityDesigns[1].correctOptionTargetId =
      cosmeticSegmentation.lessons[0].activityDesigns[1].optionTargetIds[1];
    expect(validateBaseSoundModule(cosmeticSegmentation).errors).toContain(
      "invalid-activity-evidence",
    );

    const falseLinkage = cloneModule();
    falseLinkage.lessons[3].activityDesigns[4].contrastItemIds.push(
      "snd4-byo",
    );
    expect(validateBaseSoundModule(falseLinkage).errors).toContain(
      "invalid-activity-evidence",
    );

    const inventedCoverage = cloneModule();
    inventedCoverage.lessons[3].inventoryCoverage[0].represented[0] = "みゃ";
    expect(validateBaseSoundModule(inventedCoverage).errors).toContain(
      "invalid-inventory-coverage",
    );

    const missingCoverage = cloneModule();
    missingCoverage.lessons[1].inventoryCoverage.pop();
    expect(validateBaseSoundModule(missingCoverage).errors).toContain(
      "invalid-inventory-coverage",
    );

    const sparse = cloneModule();
    delete sparse.lessons[0];
    expect(validateBaseSoundModule(sparse).errors).toContain("invalid-module-shape");

    const inherited = Object.setPrototypeOf(cloneModule(), { hidden: true });
    expect(validateBaseSoundModule(inherited).errors).toContain("invalid-module-shape");

    const getterLesson = cloneModule();
    Object.defineProperty(getterLesson.lessons[0].content, "contract", {
      get: () => "phonetic",
    });
    expect(validateBaseSoundModule(getterLesson).errors).toContain("invalid-lesson-shape");
  });
});
