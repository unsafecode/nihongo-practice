import type {
  BaseActivityDefinition,
  BasePhoneticLessonContent,
} from "../catalog/types";
import type { BasePhoneticActivityOperation } from "../catalog/activityContracts";
import { deepFreeze } from "../../foundations/deepFreeze";
import { baseAudioRecordById } from "../audio/catalog";

type LocalizedText = Readonly<{ readonly en: string; readonly it: string }>;

export interface BaseSoundContrastiveItem {
  readonly id: string;
  readonly kana: string;
  readonly morae: readonly string[];
  readonly audioId: string;
  readonly explanation: LocalizedText;
}

export interface BaseSoundAnchorWord {
  readonly id: string;
  readonly kana: string;
  readonly morae: readonly string[];
  readonly meaning: LocalizedText;
  readonly status: LocalizedText;
}

export interface BaseSoundLesson extends BasePhoneticLessonContent {
  readonly scopeTags: readonly string[];
  readonly scopeNote: LocalizedText;
  readonly contrastiveItems: readonly BaseSoundContrastiveItem[];
  readonly anchorWords: readonly BaseSoundAnchorWord[];
}

export interface BaseSoundModule {
  readonly id: "sounds";
  readonly lessons: readonly BaseSoundLesson[];
  readonly outOfScope: LocalizedText;
}

export type BaseSoundModuleError =
  | "invalid-module-shape"
  | "invalid-lesson-shape"
  | "invalid-lesson-allocation"
  | "duplicate-contrast-id"
  | "invalid-contrast-count"
  | "invalid-anchor-count"
  | "invalid-phonetic-activities"
  | "mismatched-audio-linkage"
  | "semantic-padding"
  | "invalid-localized-copy";

export interface BaseSoundModuleValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseSoundModuleError[];
}

export const BASIC_HIRAGANA: readonly string[] = deepFreeze([
  "あ", "い", "う", "え", "お",
  "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ",
  "た", "ち", "つ", "て", "と",
  "な", "に", "ぬ", "ね", "の",
  "は", "ひ", "ふ", "へ", "ほ",
  "ま", "み", "む", "め", "も",
  "や", "ゆ", "よ",
  "ら", "り", "る", "れ", "ろ",
  "わ", "を", "ん",
]);

export const DAKUTEN_HIRAGANA: readonly string[] = deepFreeze([
  "が", "ぎ", "ぐ", "げ", "ご",
  "ざ", "じ", "ず", "ぜ", "ぞ",
  "だ", "ぢ", "づ", "で", "ど",
  "ば", "び", "ぶ", "べ", "ぼ",
]);

export const HANDAKUTEN_HIRAGANA: readonly string[] = deepFreeze([
  "ぱ", "ぴ", "ぷ", "ぺ", "ぽ",
]);

export const YOON_HIRAGANA: readonly string[] = deepFreeze([
  "きゃ", "きゅ", "きょ",
  "しゃ", "しゅ", "しょ",
  "ちゃ", "ちゅ", "ちょ",
  "にゃ", "にゅ", "にょ",
  "ひゃ", "ひゅ", "ひょ",
  "みゃ", "みゅ", "みょ",
  "りゃ", "りゅ", "りょ",
  "ぎゃ", "ぎゅ", "ぎょ",
  "じゃ", "じゅ", "じょ",
  "びゃ", "びゅ", "びょ",
  "ぴゃ", "ぴゅ", "ぴょ",
]);

export const KATAKANA_BRIDGE: readonly string[] = deepFreeze([
  "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ",
]);

export const SOUND_ACTIVITY_OPERATIONS: readonly BasePhoneticActivityOperation[] =
  deepFreeze([
    "discriminate-sound",
    "segment-morae",
    "recognize-kana",
    "map-script",
    "match-sound-word",
    "assemble-reading",
  ]);

function contrast(
  id: string,
  kana: string,
  morae: readonly string[],
  en: string,
  it: string,
): BaseSoundContrastiveItem {
  return {
    id,
    kana,
    morae,
    audioId: id,
    explanation: { en, it },
  };
}

function anchor(
  id: string,
  kana: string,
  morae: readonly string[],
  en: string,
  it: string,
): BaseSoundAnchorWord {
  return {
    id,
    kana,
    morae,
    meaning: { en, it },
    status: {
      en: "Meaningful anchor word for sound practice; not yet full sentence-ready vocabulary.",
      it: "Parola-ancora significativa per esercitare i suoni; non è ancora lessico pronto per frasi complete.",
    },
  };
}

const SOUND_1_ITEMS: readonly BaseSoundContrastiveItem[] = [
  contrast("snd1-vowel-a", "あ", ["あ"], "The open vowel あ.", "La vocale aperta あ."),
  contrast("snd1-vowel-i", "い", ["い"], "The front vowel い.", "La vocale anteriore い."),
  contrast("snd1-vowel-u", "う", ["う"], "The Japanese vowel う.", "La vocale giapponese う."),
  contrast("snd1-vowel-e", "え", ["え"], "The mid vowel え.", "La vocale media え."),
  contrast("snd1-vowel-o", "お", ["お"], "The rounded vowel お.", "La vocale arrotondata お."),
  contrast(
    "snd1-k-row",
    "かきくけこ",
    ["か", "き", "く", "け", "こ"],
    "The unvoiced k-row across all five vowels.",
    "La riga k non sonora con tutte e cinque le vocali.",
  ),
  contrast(
    "snd1-s-row",
    "さしすせそ",
    ["さ", "し", "す", "せ", "そ"],
    "The unvoiced s-row, including し.",
    "La riga s non sonora, compreso し.",
  ),
  contrast(
    "snd1-t-row",
    "たちつてと",
    ["た", "ち", "つ", "て", "と"],
    "The unvoiced t-row, including ち and つ.",
    "La riga t non sonora, compresi ち e つ.",
  ),
  contrast(
    "snd1-n-row",
    "なにぬねの",
    ["な", "に", "ぬ", "ね", "の"],
    "The n-row across all five vowels.",
    "La riga n con tutte e cinque le vocali.",
  ),
  contrast(
    "snd1-h-row",
    "はひふへほ",
    ["は", "ひ", "ふ", "へ", "ほ"],
    "The h-row, with the distinct articulation of ふ.",
    "La riga h, con l'articolazione particolare di ふ.",
  ),
  contrast(
    "snd1-m-row",
    "まみむめも",
    ["ま", "み", "む", "め", "も"],
    "The m-row across all five vowels.",
    "La riga m con tutte e cinque le vocali.",
  ),
  contrast(
    "snd1-glides-liquid-w-n",
    "やゆよらりるれろわをん",
    ["や", "ゆ", "よ", "ら", "り", "る", "れ", "ろ", "わ", "を", "ん"],
    "The remaining basic modern hiragana: y-, r-, w/を, and moraic ん.",
    "Gli hiragana moderni di base restanti: y-, r-, w/を e la mora ん.",
  ),
];

const SOUND_2_ITEMS: readonly BaseSoundContrastiveItem[] = [
  contrast("snd2-ka", "か", ["か"], "Unvoiced か before comparison with が.", "か non sonora prima del confronto con が."),
  contrast("snd2-ga", "が", ["が"], "Dakuten changes か to voiced が.", "Il dakuten trasforma か nella sonora が."),
  contrast("snd2-sa", "さ", ["さ"], "Unvoiced さ before comparison with ざ.", "さ non sonora prima del confronto con ざ."),
  contrast("snd2-za", "ざ", ["ざ"], "Dakuten changes さ to voiced ざ.", "Il dakuten trasforma さ nella sonora ざ."),
  contrast("snd2-ta", "た", ["た"], "Unvoiced た before comparison with だ.", "た non sonora prima del confronto con だ."),
  contrast("snd2-da", "だ", ["だ"], "Dakuten changes た to voiced だ.", "Il dakuten trasforma た nella sonora だ."),
  contrast("snd2-ha", "は", ["は"], "Unmarked は before b- and p-row contrasts.", "は senza segno prima dei contrasti con b e p."),
  contrast("snd2-ba", "ば", ["ば"], "Dakuten changes は to voiced ば.", "Il dakuten trasforma は nella sonora ば."),
  contrast("snd2-pa", "ぱ", ["ぱ"], "Handakuten changes は to ぱ.", "L'handakuten trasforma は in ぱ."),
  contrast("snd2-ji", "じ", ["じ"], "Recognize the common spelling じ.", "Riconosci la grafia comune じ."),
  contrast("snd2-di", "ぢ", ["ぢ"], "Recognize ぢ as a distinct spelling.", "Riconosci ぢ come grafia distinta."),
  contrast("snd2-zu", "ず", ["ず"], "Recognize the common spelling ず.", "Riconosci la grafia comune ず."),
  contrast("snd2-dzu", "づ", ["づ"], "Recognize づ as a distinct spelling.", "Riconosci づ come grafia distinta."),
  contrast("snd2-pu", "ぷ", ["ぷ"], "Handakuten creates the p-row sound ぷ.", "L'handakuten crea il suono della riga p ぷ."),
];

const SOUND_3_ITEMS: readonly BaseSoundContrastiveItem[] = [
  contrast("snd3-obasan", "おばさん", ["お", "ば", "さ", "ん"], "Four morae: お・ば・さ・ん.", "Quattro more: お・ば・さ・ん."),
  contrast("snd3-obasan-obaasan", "おばあさん", ["お", "ば", "あ", "さ", "ん"], "The long vowel adds a timing unit: お・ば・あ・さ・ん.", "La vocale lunga aggiunge un'unità ritmica: お・ば・あ・さ・ん."),
  contrast("snd3-koko", "ここ", ["こ", "こ"], "Two morae: こ・こ.", "Due more: こ・こ."),
  contrast("snd3-koukou", "こうこう", ["こ", "う", "こ", "う"], "Each う extends timing: こ・う・こ・う.", "Ogni う prolunga il ritmo: こ・う・こ・う."),
  contrast("snd3-kite", "きて", ["き", "て"], "Two morae without a closure.", "Due more senza chiusura."),
  contrast("snd3-kite-kitte", "きって", ["き", "っ", "て"], "Small っ occupies one timing unit: き・っ・て.", "Il piccolo っ occupa un'unità ritmica: き・っ・て."),
  contrast("snd3-saka", "さか", ["さ", "か"], "Two evenly timed morae.", "Due more con ritmo uniforme."),
  contrast("snd3-sakka", "さっか", ["さ", "っ", "か"], "Small っ adds closure timing.", "Il piccolo っ aggiunge il tempo di chiusura."),
  contrast("snd3-ka", "か", ["か"], "One mora without final ん.", "Una mora senza ん finale."),
  contrast("snd3-ka-kan", "かん", ["か", "ん"], "Moraic ん is its own timing unit.", "La ん moraica è un'unità ritmica autonoma."),
  contrast("snd3-ho", "ほ", ["ほ"], "One short mora.", "Una mora breve."),
  contrast("snd3-hoon", "ほおん", ["ほ", "お", "ん"], "Long-vowel timing plus moraic ん gives three morae.", "Vocale lunga più ん moraica: tre more."),
];

const SOUND_4_ITEMS: readonly BaseSoundContrastiveItem[] = [
  contrast("snd4-kya", "きゃ", ["きゃ"], "き plus small ゃ forms one mora.", "き più il piccolo ゃ forma una mora."),
  contrast("snd4-sha", "しゃ", ["しゃ"], "し plus small ゃ forms one mora.", "し più il piccolo ゃ forma una mora."),
  contrast("snd4-cha", "ちゃ", ["ちゃ"], "ち plus small ゃ forms one mora.", "ち più il piccolo ゃ forma una mora."),
  contrast("snd4-nyu", "にゅ", ["にゅ"], "に plus small ゅ forms one mora.", "に più il piccolo ゅ forma una mora."),
  contrast("snd4-ryo", "りょ", ["りょ"], "り plus small ょ forms one mora.", "り più il piccolo ょ forma una mora."),
  contrast("snd4-gyu", "ぎゅ", ["ぎゅ"], "Voiced ぎゅ is one mora.", "La sonora ぎゅ è una mora."),
  contrast("snd4-ja", "じゃ", ["じゃ"], "じゃ is one common yoon mora.", "じゃ è una mora yoon comune."),
  contrast("snd4-byo", "びょ", ["びょ"], "びょ is one mora.", "びょ è una mora."),
  contrast("snd4-pyo", "ぴょ", ["ぴょ"], "ぴょ is one mora.", "ぴょ è una mora."),
  contrast("snd4-katakana-a", "ア", ["ア"], "A bounded bridge: ア maps to hiragana あ.", "Ponte limitato: ア corrisponde all'hiragana あ."),
  contrast("snd4-katakana-ka", "カ", ["カ"], "A bounded bridge: カ maps to hiragana か.", "Ponte limitato: カ corrisponde all'hiragana か."),
  contrast("snd4-katakana-ko", "コ", ["コ"], "A bounded bridge: コ maps to hiragana こ.", "Ponte limitato: コ corrisponde all'hiragana こ."),
];

const SOUND_1_ANCHORS = [
  anchor("anchor-asa", "あさ", ["あ", "さ"], "morning", "mattina"),
  anchor("anchor-ie", "いえ", ["い", "え"], "house; home", "casa"),
  anchor("anchor-umi", "うみ", ["う", "み"], "sea", "mare"),
  anchor("anchor-neko", "ねこ", ["ね", "こ"], "cat", "gatto"),
];

const SOUND_2_ANCHORS = [
  anchor("anchor-kagi", "かぎ", ["か", "ぎ"], "key", "chiave"),
  anchor("anchor-kaze", "かぜ", ["か", "ぜ"], "wind", "vento"),
  anchor("anchor-denwa", "でんわ", ["で", "ん", "わ"], "telephone", "telefono"),
  anchor("anchor-pan", "ぱん", ["ぱ", "ん"], "bread", "pane"),
];

const SOUND_3_ANCHORS = [
  anchor("anchor-obaasan", "おばあさん", ["お", "ば", "あ", "さ", "ん"], "grandmother", "nonna"),
  anchor("anchor-gakkou", "がっこう", ["が", "っ", "こ", "う"], "school", "scuola"),
  anchor("anchor-hon", "ほん", ["ほ", "ん"], "book", "libro"),
  anchor("anchor-kippu", "きっぷ", ["き", "っ", "ぷ"], "ticket", "biglietto"),
];

const SOUND_4_ANCHORS = [
  anchor("anchor-kyaku", "きゃく", ["きゃ", "く"], "guest; customer", "ospite; cliente"),
  anchor("anchor-shashin", "しゃしん", ["しゃ", "し", "ん"], "photograph", "fotografia"),
  anchor("anchor-chuui", "ちゅうい", ["ちゅ", "う", "い"], "attention; caution", "attenzione"),
  anchor("anchor-ryokou", "りょこう", ["りょ", "こ", "う"], "travel", "viaggio"),
];

const ACTIVITY_SHAPES = [
  ["meaning-comprehension", "choice", "discriminate-sound"],
  ["form-function-discrimination", "choice", "segment-morae"],
  ["ordering", "tile-ordering", "recognize-kana"],
  ["controlled-production", "completion", "map-script"],
  ["transformation", "transformation", "match-sound-word"],
  ["cumulative-retrieval", "completion", "assemble-reading"],
  ["listening", "listening", "identify-audio"],
  ["spoken", "spoken", "produce-spoken"],
] as const;

function activities(
  lessonId: string,
  items: readonly BaseSoundContrastiveItem[],
): readonly BaseActivityDefinition[] {
  return ACTIVITY_SHAPES.map(([category, interactionKind, operation], index) => ({
    id: `${lessonId}-activity-${index + 1}-${operation}`,
    category,
    interactionKind,
    mode: index < 6 ? "non-spoken" : "audio",
    targetId: items[index].id,
    operation,
    instructionCopyId: `${lessonId}-${operation}-instruction`,
    acceptedFeedbackCopyId: "base-sounds-feedback-accepted",
    retryFeedbackCopyId: "base-sounds-feedback-retry",
    assessedConceptIds: [],
    assessedLexemeIds: [],
  }));
}

function lesson(
  lessonId: "sounds-1" | "sounds-2" | "sounds-3" | "sounds-4",
  prerequisiteLessonIds: readonly string[],
  items: readonly BaseSoundContrastiveItem[],
  anchors: readonly BaseSoundAnchorWord[],
  scopeTags: readonly string[],
  scopeNote: LocalizedText,
): BaseSoundLesson {
  return {
    lessonId,
    contract: "phonetic",
    prerequisiteLessonIds,
    activities: activities(lessonId, items),
    recapCopyId: `${lessonId}-recap`,
    contrastiveItemIds: items.map((item) => item.id),
    anchorLexemeIds: anchors.map((item) => item.id),
    audioExemplarIds: items.map((item) => item.audioId),
    phoneticExplanationCopyId: `${lessonId}-phonetic-explanation`,
    contrastMapId: `${lessonId}-contrast-map`,
    scopeTags,
    scopeNote,
    contrastiveItems: items,
    anchorWords: anchors,
  };
}

const RAW_BASE_SOUND_MODULE: BaseSoundModule = {
  id: "sounds",
  lessons: [
    lesson(
      "sounds-1",
      [],
      SOUND_1_ITEMS,
      SOUND_1_ANCHORS,
      ["five-vowels", "unvoiced-gojuon", "basic-modern-hiragana-46", "mora-counting"],
      {
        en: "Hiragana-first listening and reading: five vowels, unvoiced gojuon rows, all 46 basic modern hiragana, and mora counting.",
        it: "Ascolto e lettura a partire dall'hiragana: cinque vocali, righe gojuon non sonore, tutti i 46 hiragana moderni di base e conteggio delle more.",
      },
    ),
    lesson(
      "sounds-2",
      ["sounds-1"],
      SOUND_2_ITEMS,
      SOUND_2_ANCHORS,
      ["dakuten", "handakuten", "voiced-unvoiced-contrasts", "ji-di-zu-dzu-orthography"],
      {
        en: "Learn the spelling distinctions じ/ぢ and ず/づ; they are not universally acoustically distinct in modern standard Japanese.",
        it: "Impara le distinzioni ortografiche じ/ぢ e ず/づ; nel giapponese standard moderno non sono universalmente distinti all'ascolto.",
      },
    ),
    lesson(
      "sounds-3",
      ["sounds-2"],
      SOUND_3_ITEMS,
      SOUND_3_ANCHORS,
      ["long-vowels", "small-tsu", "moraic-n", "timing-contrasts"],
      {
        en: "Long vowels, small っ, and moraic ん each contribute timing; count morae rather than kana characters.",
        it: "Vocali lunghe, piccolo っ e ん moraica contribuiscono al ritmo; conta le more, non i caratteri kana.",
      },
    ),
    lesson(
      "sounds-4",
      ["sounds-3"],
      SOUND_4_ITEMS,
      SOUND_4_ANCHORS,
      ["common-yoon", "small-ya-yu-yo", "bounded-katakana-bridge-not-full-module"],
      {
        en: "Common yoon use small ゃ/ゅ/ょ and count as one mora. The katakana examples are a practical bridge, not a full katakana module.",
        it: "Gli yoon comuni usano i piccoli ゃ/ゅ/ょ e contano come una mora. Gli esempi in katakana sono un ponte pratico, non un modulo completo.",
      },
    ),
  ],
  outOfScope: {
    en: "Pitch accent is explicitly outside Base scope; this module focuses on segmental sounds, script, and mora timing.",
    it: "L'accento tonale è esplicitamente fuori dal Base; il modulo si concentra su suoni segmentali, scrittura e ritmo moraico.",
  },
};

const SEMANTIC_PADDING_FIELDS = [
  "newLexemeIds",
  "workedExampleIds",
  "dialogueId",
  "sentenceCount",
  "explanationBlockIds",
  "patternCellIds",
] as const;

function densePlainArray(value: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  try {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return undefined;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.keys(descriptors).length !== value.length + 1) return undefined;
    const result: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        return undefined;
      }
      result.push(descriptor.value);
    }
    return result;
  } catch {
    return undefined;
  }
}

function plainRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return undefined;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (
      Object.getOwnPropertyNames(value).some((key) => {
        const descriptor = descriptors[key];
        return !descriptor || !("value" in descriptor) || !descriptor.enumerable;
      })
    ) {
      return undefined;
    }
    return value as Readonly<Record<string, unknown>>;
  } catch {
    return undefined;
  }
}

function own(record: Readonly<Record<string, unknown>>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

function localized(value: unknown): boolean {
  const record = plainRecord(value);
  if (!record) return false;
  return (
    Object.getOwnPropertyNames(record).length === 2 &&
    typeof own(record, "en") === "string" &&
    (own(record, "en") as string).trim().length > 0 &&
    typeof own(record, "it") === "string" &&
    (own(record, "it") as string).trim().length > 0
  );
}

function stringArray(value: unknown): readonly string[] | undefined {
  const values = densePlainArray(value);
  return values?.every((entry) => typeof entry === "string" && entry.length > 0)
    ? (values as readonly string[])
    : undefined;
}

export function validateBaseSoundModule(value: unknown): BaseSoundModuleValidation {
  const module = plainRecord(value);
  const lessons = module ? densePlainArray(own(module, "lessons")) : undefined;
  if (!module || own(module, "id") !== "sounds" || !lessons || lessons.length !== 4) {
    return { ok: false, errors: ["invalid-module-shape"] };
  }
  const errors = new Set<BaseSoundModuleError>();
  if (!localized(own(module, "outOfScope"))) errors.add("invalid-localized-copy");
  const expectedLessonIds = ["sounds-1", "sounds-2", "sounds-3", "sounds-4"];
  const globalItemIds = new Set<string>();

  lessons.forEach((lessonValue, lessonIndex) => {
    const lessonRecord = plainRecord(lessonValue);
    if (!lessonRecord) {
      errors.add("invalid-lesson-shape");
      return;
    }
    const lessonId = own(lessonRecord, "lessonId");
    if (
      lessonId !== expectedLessonIds[lessonIndex] ||
      own(lessonRecord, "contract") !== "phonetic"
    ) {
      errors.add("invalid-lesson-allocation");
    }
    if (SEMANTIC_PADDING_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(lessonRecord, field))) {
      errors.add("semantic-padding");
    }
    if (!localized(own(lessonRecord, "scopeNote"))) errors.add("invalid-localized-copy");

    const items = densePlainArray(own(lessonRecord, "contrastiveItems"));
    if (!items || items.length < 10 || items.length > 16) {
      errors.add("invalid-contrast-count");
    }
    const itemIds: string[] = [];
    const itemAudioIds: string[] = [];
    for (const itemValue of items ?? []) {
      const item = plainRecord(itemValue);
      const morae = item ? stringArray(own(item, "morae")) : undefined;
      const id = item ? own(item, "id") : undefined;
      const kana = item ? own(item, "kana") : undefined;
      const audioId = item ? own(item, "audioId") : undefined;
      if (
        !item ||
        typeof id !== "string" ||
        typeof kana !== "string" ||
        typeof audioId !== "string" ||
        !morae ||
        morae.join("") !== kana ||
        !localized(own(item, "explanation"))
      ) {
        errors.add("invalid-lesson-shape");
        continue;
      }
      if (globalItemIds.has(id)) errors.add("duplicate-contrast-id");
      globalItemIds.add(id);
      itemIds.push(id);
      itemAudioIds.push(audioId);
      const audio = baseAudioRecordById(audioId);
      if (
        !audio ||
        audio.kana !== kana ||
        audio.morae.length !== morae.length ||
        audio.morae.some((mora, index) => mora !== morae[index])
      ) {
        errors.add("mismatched-audio-linkage");
      }
    }
    const audioExemplarIds = stringArray(own(lessonRecord, "audioExemplarIds"));
    const contrastiveItemIds = stringArray(own(lessonRecord, "contrastiveItemIds"));
    if (
      !contrastiveItemIds ||
      contrastiveItemIds.length !== itemIds.length ||
      contrastiveItemIds.some((id, index) => id !== itemIds[index])
    ) {
      errors.add("invalid-lesson-shape");
    }
    if (
      !audioExemplarIds ||
      audioExemplarIds.length !== itemAudioIds.length ||
      audioExemplarIds.some((id, index) => id !== itemAudioIds[index])
    ) {
      errors.add("mismatched-audio-linkage");
    }

    const anchors = densePlainArray(own(lessonRecord, "anchorWords"));
    if (!anchors || anchors.length < 4 || anchors.length > 8) {
      errors.add("invalid-anchor-count");
    }
    const anchorIds: string[] = [];
    for (const anchorValue of anchors ?? []) {
      const anchorRecord = plainRecord(anchorValue);
      const morae = anchorRecord ? stringArray(own(anchorRecord, "morae")) : undefined;
      const anchorId = anchorRecord ? own(anchorRecord, "id") : undefined;
      if (
        !anchorRecord ||
        typeof anchorId !== "string" ||
        typeof own(anchorRecord, "kana") !== "string" ||
        !morae ||
        morae.join("") !== own(anchorRecord, "kana") ||
        !localized(own(anchorRecord, "meaning")) ||
        !localized(own(anchorRecord, "status"))
      ) {
        errors.add("invalid-lesson-shape");
      } else {
        anchorIds.push(anchorId);
      }
    }
    const anchorLexemeIds = stringArray(own(lessonRecord, "anchorLexemeIds"));
    if (
      !anchorLexemeIds ||
      anchorLexemeIds.length !== anchorIds.length ||
      anchorLexemeIds.some((id, index) => id !== anchorIds[index])
    ) {
      errors.add("invalid-lesson-shape");
    }

    const activityValues = densePlainArray(own(lessonRecord, "activities"));
    const activityIds = new Set<string>();
    const targets = new Set<string>();
    const nonSpokenOperations = new Set<string>();
    let listening = 0;
    let spoken = 0;
    if (!activityValues || activityValues.length !== 8) {
      errors.add("invalid-phonetic-activities");
    }
    for (const activityValue of activityValues ?? []) {
      const activity = plainRecord(activityValue);
      if (!activity) {
        errors.add("invalid-phonetic-activities");
        continue;
      }
      const id = own(activity, "id");
      const target = own(activity, "targetId");
      const mode = own(activity, "mode");
      const category = own(activity, "category");
      const operation = own(activity, "operation");
      if (typeof id !== "string" || activityIds.has(id)) errors.add("invalid-phonetic-activities");
      else activityIds.add(id);
      if (typeof target !== "string" || targets.has(target)) errors.add("invalid-phonetic-activities");
      else targets.add(target);
      if (mode === "non-spoken" && typeof operation === "string") {
        nonSpokenOperations.add(operation);
      }
      if (category === "listening" && mode === "audio" && operation === "identify-audio") listening += 1;
      if (category === "spoken" && mode === "audio" && operation === "produce-spoken") spoken += 1;
    }
    if (
      nonSpokenOperations.size !== SOUND_ACTIVITY_OPERATIONS.length ||
      SOUND_ACTIVITY_OPERATIONS.some((operation) => !nonSpokenOperations.has(operation)) ||
      listening !== 1 ||
      spoken !== 1
    ) {
      errors.add("invalid-phonetic-activities");
    }
  });

  return { ok: errors.size === 0, errors: [...errors] };
}

const moduleValidation = validateBaseSoundModule(RAW_BASE_SOUND_MODULE);
if (!moduleValidation.ok) {
  throw new Error(`Invalid Base sound module: ${moduleValidation.errors.join(", ")}`);
}

export const BASE_SOUND_MODULE: BaseSoundModule = deepFreeze(RAW_BASE_SOUND_MODULE);
