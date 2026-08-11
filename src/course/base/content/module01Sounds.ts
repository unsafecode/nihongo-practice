import {
  defineBaseLessonContent,
  type BaseActivityDefinition,
  type BasePhoneticLessonContent,
  type BaseValidationCatalogs,
  type BaseVisibleTarget,
} from "../catalog/types";
import type {
  BasePhoneticActivityOperation,
} from "../catalog/activityContracts";
import { deepFreeze } from "../../foundations/deepFreeze";
import {
  BASE_AUDIO_CATALOG,
  baseAudioRecordById,
} from "../audio/catalog";
import {
  BASE_CONCEPT_BY_ID,
  BASE_REFERENCE_SNAPSHOT_BY_ID,
  BASE_RETRIEVAL_SYSTEM_BY_ID,
} from "../catalog/concepts";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import { baseActivityPromptKey } from "../catalog/visibleTargets";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import { immutableReadonlySet } from "../../foundations/immutableReadonlySet";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  DAKUTEN,
  GOJUON,
  YOON,
} from "../../../syllabary/kana";

type LocalizedText = Readonly<{ readonly en: string; readonly it: string }>;

export interface BaseSoundContrastiveItem {
  readonly id: string;
  readonly kana: string;
  readonly romaji: string;
  readonly morae: readonly string[];
  readonly audioId: string;
  readonly explanation: LocalizedText;
}

export interface BaseSoundAnchorWord {
  readonly id: string;
  readonly kana: string;
  readonly romaji: string;
  readonly morae: readonly string[];
  readonly meaningCopyId: string;
  readonly status: LocalizedText;
}

export type BaseSoundActivityEvidenceTag =
  | "contrast-pair"
  | "segmented-morae"
  | "kana-recognition"
  | "script-correspondence"
  | "sound-word-match"
  | "controlled-assembly"
  | "listening-identification"
  | "read-aloud";

export interface BaseSoundActivityDesign {
  readonly activityId: string;
  readonly operation: BaseActivityDefinition["operation"];
  readonly evidenceTag: BaseSoundActivityEvidenceTag;
  readonly promptTargetId: string;
  readonly optionTargetIds: readonly string[];
  readonly correctOptionTargetId: string | null;
  readonly answerTargetId: string;
  readonly anchorTargetId: string | null;
  readonly anchorLexemeId: string | null;
  readonly contrastItemIds: readonly string[];
  readonly canonicalAudioId: string | null;
  readonly requiresKanaScript: boolean;
}

export interface BaseSoundMoraSegment {
  readonly kana: string;
  readonly romaji: string | null;
}

export interface BaseSoundDisplayTarget {
  readonly id: string;
  readonly kana: string;
  readonly romaji: string;
  readonly role: "prompt" | "option" | "answer" | "anchor";
  readonly moraSegments: readonly BaseSoundMoraSegment[] | null;
}

export interface BaseSoundInventoryCoverage {
  readonly inventoryId:
    | "basic-hiragana"
    | "dakuten"
    | "handakuten"
    | "common-yoon"
    | "katakana-bridge";
  readonly represented: readonly string[];
  readonly scopedOut: readonly string[];
  readonly rationale: LocalizedText | null;
}

export interface BaseSoundLesson {
  readonly content: BasePhoneticLessonContent;
  readonly scopeTags: readonly string[];
  readonly scopeNote: LocalizedText;
  readonly contrastiveItems: readonly BaseSoundContrastiveItem[];
  readonly anchorWords: readonly BaseSoundAnchorWord[];
  readonly activityDesigns: readonly BaseSoundActivityDesign[];
  readonly inventoryCoverage: readonly BaseSoundInventoryCoverage[];
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
  | "invalid-activity-evidence"
  | "invalid-inventory-coverage"
  | "canonical-depth-failure"
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

export const COMMON_YOON_RELEASE_SUBSET: readonly string[] = deepFreeze([
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

const BASE_KANA_ROMAJI = new Map(
  [...GOJUON, ...DAKUTEN, ...YOON].flatMap((row) =>
    row.cells
      .filter((cell) => cell !== null)
      .map((cell) => [cell.kana, cell.romaji] as const),
  ),
);
BASE_KANA_ROMAJI.set("ゃ", "ya");
BASE_KANA_ROMAJI.set("ゅ", "yu");
BASE_KANA_ROMAJI.set("ょ", "yo");

function hiraganaFor(character: string): string {
  const codePoint = character.codePointAt(0);
  return codePoint !== undefined && codePoint >= 0x30a1 && codePoint <= 0x30f6
    ? String.fromCodePoint(codePoint - 0x60)
    : character;
}

export function romanizeBaseSoundSurface(kana: string): string {
  if (kana.includes("・")) {
    const morae = kana.split("・");
    return morae.includes("っ")
      ? romanizeBaseSoundSurface(morae.join(""))
      : morae.map(romanizeBaseSoundSurface).join(" ");
  }
  const normalized = [...kana].map(hiraganaFor).join("");
  const parts: string[] = [];
  let geminate = false;
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (character === "っ") {
      geminate = true;
      continue;
    }
    if (/[\s・／]/.test(character)) {
      parts.push(" ");
      continue;
    }
    if (character === "＿") {
      parts.push("_");
      continue;
    }
    const pair = normalized.slice(index, index + 2);
    const pairRomaji = BASE_KANA_ROMAJI.get(pair);
    const romaji = pairRomaji ?? BASE_KANA_ROMAJI.get(character);
    if (!romaji) {
      throw new Error(`No Base romaji source for "${character}" in "${kana}".`);
    }
    if (geminate) {
      parts.push(romaji[0]);
      geminate = false;
    }
    parts.push(romaji);
    if (pairRomaji) index += 1;
  }
  return parts.join("").replace(/\s+/g, " ").trim();
}

const BASE_SOUND_SURFACE_PUNCTUATION = new Set([" ", "　", "・", "＿"]);

function lessonOwnedKana(lessonId: string): ReadonlySet<string> | undefined {
  const basic = [...BASIC_HIRAGANA];
  if (lessonId === "sounds-1") return new Set(basic);
  const voiced = [...basic, ...DAKUTEN_HIRAGANA, ...HANDAKUTEN_HIRAGANA];
  if (lessonId === "sounds-2") return new Set(voiced);
  if (lessonId === "sounds-3") return new Set([...voiced, "っ"]);
  if (lessonId === "sounds-4") {
    return new Set([
      ...voiced,
      "っ",
      "ゃ",
      "ゅ",
      "ょ",
      ...KATAKANA_BRIDGE,
    ]);
  }
  return undefined;
}

export function isBaseSoundSurfaceOwnedByLesson(
  lessonId: string,
  surface: string,
): boolean {
  const owned = lessonOwnedKana(lessonId);
  return (
    owned !== undefined &&
    [...surface].every(
      (character) =>
        BASE_SOUND_SURFACE_PUNCTUATION.has(character) ||
        owned.has(character),
    )
  );
}

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
    romaji: romanizeBaseSoundSurface(kana),
    morae,
    audioId: id,
    explanation: { en, it },
  };
}

function anchor(
  id: string,
  kana: string,
  morae: readonly string[],
): BaseSoundAnchorWord {
  return {
    id,
    kana,
    romaji: romanizeBaseSoundSurface(kana),
    morae,
    meaningCopyId: `${id}-meaning`,
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
  anchor("anchor-asa", "あさ", ["あ", "さ"]),
  anchor("anchor-ie", "いえ", ["い", "え"]),
  anchor("anchor-umi", "うみ", ["う", "み"]),
  anchor("anchor-neko", "ねこ", ["ね", "こ"]),
];

const SOUND_2_ANCHORS = [
  anchor("anchor-kagi", "かぎ", ["か", "ぎ"]),
  anchor("anchor-kaze", "かぜ", ["か", "ぜ"]),
  anchor("anchor-denwa", "でんわ", ["で", "ん", "わ"]),
  anchor("anchor-pan", "ぱん", ["ぱ", "ん"]),
];

const SOUND_3_ANCHORS = [
  anchor("anchor-obaasan", "おばあさん", ["お", "ば", "あ", "さ", "ん"]),
  anchor("anchor-gakkou", "がっこう", ["が", "っ", "こ", "う"]),
  anchor("anchor-hon", "ほん", ["ほ", "ん"]),
  anchor("anchor-kippu", "きっぷ", ["き", "っ", "ぷ"]),
];

const SOUND_4_ANCHORS = [
  anchor("anchor-kyaku", "きゃく", ["きゃ", "く"]),
  anchor("anchor-shashin", "しゃしん", ["しゃ", "し", "ん"]),
  anchor("anchor-chuui", "ちゅうい", ["ちゅ", "う", "い"]),
  anchor("anchor-ryokou", "りょこう", ["りょ", "こ", "う"]),
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

const EVIDENCE_TAGS: readonly BaseSoundActivityEvidenceTag[] = [
  "contrast-pair",
  "segmented-morae",
  "kana-recognition",
  "script-correspondence",
  "sound-word-match",
  "controlled-assembly",
  "listening-identification",
  "read-aloud",
];

interface BaseSoundActivitySurfaceSeed {
  readonly prompt: string;
  readonly options: readonly string[];
  readonly correctIndex: 0 | 1 | 2 | null;
  readonly spokenAnswer?: string;
}

const ACTIVITY_SURFACES: Readonly<
  Record<string, BaseSoundActivitySurfaceSeed>
> = {
  "snd1-discriminate-vowels": { prompt: "いえ　＿", options: ["い", "え"], correctIndex: 0 },
  "snd1-segment-asa": { prompt: "あさ", options: ["あ・さ", "あ・し"], correctIndex: 0 },
  "snd1-recognize-gojuon": { prompt: "さ　＿　す　＿　そ", options: ["たちつてと", "さしすせそ"], correctIndex: 1 },
  "snd1-map-hiragana-row": { prompt: "か　き　く　け　＿", options: ["さしすせそ", "かきくけこ"], correctIndex: 1 },
  "snd1-match-ie": { prompt: "＿・え　い", options: ["いえ", "うえ"], correctIndex: 0 },
  "snd1-assemble-umi": { prompt: "み・う", options: ["うに", "うみ"], correctIndex: 1 },
  "snd1-listen-u": { prompt: "う　お", options: ["う", "お"], correctIndex: 0 },
  "snd1-read-neko": { prompt: "ねこ", options: [], correctIndex: null, spokenAnswer: "ねこ" },
  "snd2-discriminate-kaga": { prompt: "か　＿", options: ["か・が", "か・ざ"], correctIndex: 0 },
  "snd2-segment-kagi": { prompt: "かぎ", options: ["か・き", "か・ぎ"], correctIndex: 1 },
  "snd2-recognize-jidi": { prompt: "ち　＿　む　　つ　＿　く", options: ["ちぢむ・つづく", "ちじむ・つずく"], correctIndex: 0 },
  "snd2-map-dakuten": { prompt: "た　＿　は　ば　＿", options: ["ざ・な", "だ・ぱ"], correctIndex: 1 },
  "snd2-match-kaze": { prompt: "＿・ぜ　か", options: ["かぜ", "かせ"], correctIndex: 0 },
  "snd2-assemble-denwa": { prompt: "わ・で・ん", options: ["でわ", "でんわ"], correctIndex: 1 },
  "snd2-listen-kaga": { prompt: "か　が", options: ["が", "か"], correctIndex: 0 },
  "snd2-read-panpu": { prompt: "ぱ　ぷ", options: [], correctIndex: null, spokenAnswer: "ぱ　ぷ" },
  "snd3-discriminate-obasan": { prompt: "お・ば・＿・さ・ん", options: ["おばあさん", "おばさん"], correctIndex: 0 },
  "snd3-segment-gakkou": { prompt: "がっこう", options: ["が・つ・こ・う", "が・っ・こ・う"], correctIndex: 1 },
  "snd3-recognize-small-tsu": { prompt: "き・＿・て", options: ["きて", "きって"], correctIndex: 1 },
  "snd3-map-moraic-n": { prompt: "ほ　ん　　か　＿", options: ["ん", "な"], correctIndex: 0 },
  "snd3-match-hon": { prompt: "ん　ほ・＿", options: ["ほ", "ほん"], correctIndex: 1 },
  "snd3-assemble-kippu": { prompt: "ぷ・き・っ", options: ["きぷ", "きっぷ"], correctIndex: 1 },
  "snd3-listen-kan": { prompt: "か　かん", options: ["かん", "か"], correctIndex: 0 },
  "snd3-read-obaasan": { prompt: "おばあさん", options: [], correctIndex: null, spokenAnswer: "お・ば・あ・さ・ん" },
  "snd4-discriminate-yoon": { prompt: "きゃ　しゃ　＿", options: ["ちゃ", "ちや", "じゃ"], correctIndex: 0 },
  "snd4-segment-ryokou": { prompt: "りょこう", options: ["りょ・こ・う", "り・ょ・こう"], correctIndex: 0 },
  "snd4-recognize-small-yoon": { prompt: "きゅ　＿", options: ["にゅ　みゅ", "にゆ　みゆ"], correctIndex: 0 },
  "snd4-map-katakana": { prompt: "あ　か　こ", options: ["イ・キ・ク", "ア・カ・コ"], correctIndex: 1 },
  "snd4-match-shashin": { prompt: "＿・し・ん　しゃ", options: ["しゃしん", "しやしん"], correctIndex: 0 },
  "snd4-assemble-kyaku": { prompt: "く・きゃ", options: ["きやく", "きゃく"], correctIndex: 1 },
  "snd4-listen-nyuryo": { prompt: "にゅ　りょ", options: ["りょ", "にゅ"], correctIndex: 1 },
  "snd4-read-chuui": { prompt: "ちゅうい", options: [], correctIndex: null, spokenAnswer: "ちゅうい" },
};

function design(
  activityId: string,
  index: number,
  anchorLexemeId: string | null,
  contrastItemIds: readonly string[],
  canonicalAudioId: string | null = null,
  requiresKanaScript = false,
): BaseSoundActivityDesign {
  const surfaces = ACTIVITY_SURFACES[activityId];
  if (!surfaces) {
    throw new Error(`Missing Base sound activity surfaces for "${activityId}".`);
  }
  const optionTargetIds = surfaces.options.map(
    (_, optionIndex) => `${activityId}-option-${optionIndex + 1}`,
  );
  const correctOptionTargetId =
    surfaces.correctIndex === null
      ? null
      : optionTargetIds[surfaces.correctIndex] ?? null;
  if (
    (index === 7 && correctOptionTargetId !== null) ||
    (index !== 7 && correctOptionTargetId === null)
  ) {
    throw new Error(`Invalid Base sound answer position for "${activityId}".`);
  }
  return {
    activityId,
    operation: ACTIVITY_SHAPES[index][2],
    evidenceTag: EVIDENCE_TAGS[index],
    promptTargetId: `${activityId}-prompt`,
    optionTargetIds,
    correctOptionTargetId,
    answerTargetId: `${activityId}-answer`,
    anchorTargetId:
      anchorLexemeId === null ? null : `${anchorLexemeId}-target`,
    anchorLexemeId,
    contrastItemIds,
    canonicalAudioId,
    requiresKanaScript,
  };
}

const SOUND_1_ACTIVITY_DESIGNS: readonly BaseSoundActivityDesign[] = [
  design("snd1-discriminate-vowels", 0, "anchor-ie", ["snd1-vowel-i", "snd1-vowel-e"]),
  design("snd1-segment-asa", 1, "anchor-asa", ["snd1-vowel-a"]),
  design("snd1-recognize-gojuon", 2, "anchor-asa", ["snd1-s-row"]),
  design("snd1-map-hiragana-row", 3, "anchor-neko", ["snd1-k-row"]),
  design("snd1-match-ie", 4, "anchor-ie", ["snd1-vowel-i", "snd1-vowel-e"]),
  design("snd1-assemble-umi", 5, "anchor-umi", ["snd1-vowel-u"]),
  design("snd1-listen-u", 6, "anchor-umi", ["snd1-vowel-u", "snd1-vowel-o"], "snd1-vowel-u"),
  design("snd1-read-neko", 7, "anchor-neko", []),
];

const SOUND_2_ACTIVITY_DESIGNS: readonly BaseSoundActivityDesign[] = [
  design("snd2-discriminate-kaga", 0, "anchor-kagi", ["snd2-ka", "snd2-ga"]),
  design("snd2-segment-kagi", 1, "anchor-kagi", ["snd2-ka"]),
  design("snd2-recognize-jidi", 2, null, ["snd2-ji", "snd2-di", "snd2-zu", "snd2-dzu"], null, true),
  design("snd2-map-dakuten", 3, null, ["snd2-ta", "snd2-da", "snd2-ha", "snd2-ba", "snd2-pa"]),
  design("snd2-match-kaze", 4, "anchor-kaze", ["snd2-ka"]),
  design("snd2-assemble-denwa", 5, "anchor-denwa", []),
  design("snd2-listen-kaga", 6, "anchor-kagi", ["snd2-ka", "snd2-ga"], "snd2-ga"),
  design("snd2-read-panpu", 7, "anchor-pan", ["snd2-pa", "snd2-pu"]),
];

const SOUND_3_ACTIVITY_DESIGNS: readonly BaseSoundActivityDesign[] = [
  design("snd3-discriminate-obasan", 0, "anchor-obaasan", ["snd3-obasan", "snd3-obasan-obaasan"]),
  design("snd3-segment-gakkou", 1, "anchor-gakkou", []),
  design("snd3-recognize-small-tsu", 2, "anchor-kippu", ["snd3-kite", "snd3-kite-kitte"]),
  design("snd3-map-moraic-n", 3, "anchor-hon", ["snd3-ka", "snd3-ho"]),
  design("snd3-match-hon", 4, "anchor-hon", ["snd3-ho"]),
  design("snd3-assemble-kippu", 5, "anchor-kippu", []),
  design("snd3-listen-kan", 6, "anchor-hon", ["snd3-ka", "snd3-ka-kan"], "snd3-ka-kan"),
  design("snd3-read-obaasan", 7, "anchor-obaasan", ["snd3-obasan-obaasan"]),
];

const SOUND_4_ACTIVITY_DESIGNS: readonly BaseSoundActivityDesign[] = [
  design("snd4-discriminate-yoon", 0, "anchor-kyaku", ["snd4-kya", "snd4-sha", "snd4-cha"]),
  design("snd4-segment-ryokou", 1, "anchor-ryokou", ["snd4-ryo"]),
  design("snd4-recognize-small-yoon", 2, null, ["snd4-nyu"], null, true),
  design("snd4-map-katakana", 3, null, ["snd4-katakana-a", "snd4-katakana-ka", "snd4-katakana-ko"], null, true),
  design("snd4-match-shashin", 4, "anchor-shashin", ["snd4-sha"]),
  design("snd4-assemble-kyaku", 5, "anchor-kyaku", ["snd4-kya"]),
  design("snd4-listen-nyuryo", 6, "anchor-ryokou", ["snd4-nyu", "snd4-ryo"], "snd4-nyu"),
  design("snd4-read-chuui", 7, "anchor-chuui", []),
];

function activities(
  conceptId: string,
  designs: readonly BaseSoundActivityDesign[],
): readonly BaseActivityDefinition[] {
  return designs.map((entry, index) => {
    const [category, interactionKind] = ACTIVITY_SHAPES[index];
    const assessedLexemeIds =
      entry.anchorLexemeId !== null && activityAssessesAnchor(entry)
        ? [entry.anchorLexemeId]
        : [];
    return {
      id: entry.activityId,
      category,
      interactionKind,
      mode: index < 6 ? "non-spoken" : "audio",
      targetId: entry.canonicalAudioId ?? entry.answerTargetId,
      operation: entry.operation,
      instructionCopyId: `${entry.activityId}-instruction`,
      acceptedFeedbackCopyId: "base-sounds-feedback-accepted",
      retryFeedbackCopyId: "base-sounds-feedback-retry",
      assessedConceptIds: [conceptId],
      assessedLexemeIds,
    };
  });
}

function activityAssessesAnchor(design: BaseSoundActivityDesign): boolean {
  if (design.anchorLexemeId === null) return false;
  const surfaces = ACTIVITY_SURFACES[design.activityId];
  const anchor = BASE_LEXEME_BY_ID.get(design.anchorLexemeId);
  if (!surfaces || !anchor) return false;
  return [
    surfaces.prompt,
    ...surfaces.options,
    surfaces.spokenAnswer ?? "",
  ].some((surface) => surface.replace(/[\s・]/g, "").includes(anchor.kana));
}

function lesson(
  lessonId: "sounds-1" | "sounds-2" | "sounds-3" | "sounds-4",
  prerequisiteLessonIds: readonly string[],
  conceptId: string,
  items: readonly BaseSoundContrastiveItem[],
  anchors: readonly BaseSoundAnchorWord[],
  activityDesigns: readonly BaseSoundActivityDesign[],
  scopeTags: readonly string[],
  scopeNote: LocalizedText,
  inventoryCoverage: readonly BaseSoundInventoryCoverage[],
): BaseSoundLesson {
  const content = defineBaseLessonContent({
    lessonId,
    contract: "phonetic",
    prerequisiteLessonIds,
    activities: activities(conceptId, activityDesigns),
    recapCopyId: `${lessonId}-recap`,
    contrastiveItemIds: items.map((item) => item.id),
    anchorLexemeIds: anchors.map((item) => item.id),
    audioExemplarIds: items.map((item) => item.audioId),
    phoneticExplanationCopyId: `${lessonId}-phonetic-explanation`,
    contrastMapId: `${lessonId}-contrast-map`,
  });
  return {
    content,
    scopeTags,
    scopeNote,
    contrastiveItems: items,
    anchorWords: anchors,
    activityDesigns,
    inventoryCoverage,
  };
}

function inventoryCoverage(
  inventoryId: BaseSoundInventoryCoverage["inventoryId"],
  inventory: readonly string[],
  represented: readonly string[],
  rationale: LocalizedText | null,
): BaseSoundInventoryCoverage {
  const representedSet = new Set(represented);
  return {
    inventoryId,
    represented,
    scopedOut: inventory.filter((item) => !representedSet.has(item)),
    rationale,
  };
}

const RAW_BASE_SOUND_MODULE: BaseSoundModule = {
  id: "sounds",
  lessons: [
    lesson(
      "sounds-1",
      [],
      "sound-vowels-gojuon",
      SOUND_1_ITEMS,
      SOUND_1_ANCHORS,
      SOUND_1_ACTIVITY_DESIGNS,
      ["five-vowels", "unvoiced-gojuon", "basic-modern-hiragana-46", "mora-counting"],
      {
        en: "Hiragana-first listening and reading: five vowels, unvoiced gojuon rows, all 46 basic modern hiragana, and mora counting.",
        it: "Ascolto e lettura a partire dall'hiragana: cinque vocali, righe gojuon non sonore, tutti i 46 hiragana moderni di base e conteggio delle more.",
      },
      [inventoryCoverage("basic-hiragana", BASIC_HIRAGANA, BASIC_HIRAGANA, null)],
    ),
    lesson(
      "sounds-2",
      ["sounds-1"],
      "sound-voicing-marks",
      SOUND_2_ITEMS,
      SOUND_2_ANCHORS,
      SOUND_2_ACTIVITY_DESIGNS,
      ["dakuten", "handakuten", "voiced-unvoiced-contrasts", "ji-di-zu-dzu-orthography"],
      {
        en: "Learn the spelling distinctions じ/ぢ and ず/づ; they are not universally acoustically distinct in modern standard Japanese.",
        it: "Impara le distinzioni ortografiche じ/ぢ e ず/づ; nel giapponese standard moderno non sono universalmente distinti all'ascolto.",
      },
      [
        inventoryCoverage(
          "dakuten",
          DAKUTEN_HIRAGANA,
          SOUND_2_ITEMS.map((item) => item.kana).filter((kana) =>
            DAKUTEN_HIRAGANA.includes(kana),
          ),
          {
            en: "Base assesses representative dakuten contrasts from every voiced row; the remaining same-rule vowel variants stay reference-only.",
            it: "Il Base valuta contrasti rappresentativi con dakuten per ogni riga sonora; le altre varianti vocaliche della stessa regola restano di consultazione.",
          },
        ),
        inventoryCoverage(
          "handakuten",
          HANDAKUTEN_HIRAGANA,
          SOUND_2_ITEMS.map((item) => item.kana).filter((kana) =>
            HANDAKUTEN_HIRAGANA.includes(kana),
          ),
          {
            en: "Base assesses ぱ and ぷ directly; ぴ, ぺ, and ぽ remain visible reference variants governed by the same handakuten rule.",
            it: "Il Base valuta direttamente ぱ e ぷ; ぴ, ぺ e ぽ restano varianti visibili di consultazione con la stessa regola dell'handakuten.",
          },
        ),
      ],
    ),
    lesson(
      "sounds-3",
      ["sounds-2"],
      "sound-mora-timing",
      SOUND_3_ITEMS,
      SOUND_3_ANCHORS,
      SOUND_3_ACTIVITY_DESIGNS,
      ["long-vowels", "small-tsu", "moraic-n", "timing-contrasts"],
      {
        en: "Long vowels, small っ, and moraic ん each contribute timing; count morae rather than kana characters.",
        it: "Vocali lunghe, piccolo っ e ん moraica contribuiscono al ritmo; conta le more, non i caratteri kana.",
      },
      [],
    ),
    lesson(
      "sounds-4",
      ["sounds-3"],
      "sound-yoon-script-bridge",
      SOUND_4_ITEMS,
      SOUND_4_ANCHORS,
      SOUND_4_ACTIVITY_DESIGNS,
      ["common-yoon", "small-ya-yu-yo", "bounded-katakana-bridge-not-full-module"],
      {
        en: "Common yoon use small ゃ/ゅ/ょ and count as one mora. The katakana examples are a practical bridge, not a full katakana module.",
        it: "Gli yoon comuni usano i piccoli ゃ/ゅ/ょ e contano come una mora. Gli esempi in katakana sono un ponte pratico, non un modulo completo.",
      },
      [
        inventoryCoverage(
          "common-yoon",
          YOON_HIRAGANA,
          COMMON_YOON_RELEASE_SUBSET,
          {
            en: "The release subset covers frequent unvoiced, voiced, and handakuten yoon; the full reference inventory is not padded into this lesson.",
            it: "Il sottoinsieme pubblicato copre yoon frequenti non sonori, sonori e con handakuten; l'inventario completo di consultazione non viene usato per gonfiare la lezione.",
          },
        ),
        inventoryCoverage(
          "katakana-bridge",
          KATAKANA_BRIDGE,
          ["ア", "カ", "コ"],
          {
            en: "Only ア, カ, and コ are assessed as a practical script bridge; a full katakana inventory is outside this Base lesson.",
            it: "Solo ア, カ e コ sono valutati come ponte pratico tra scritture; l'inventario completo del katakana è fuori da questa lezione Base.",
          },
        ),
      ],
    ),
  ],
  outOfScope: {
    en: "Pitch accent is explicitly outside Base scope; this module focuses on segmental sounds, script, and mora timing.",
    it: "L'accento tonale è esplicitamente fuori dal Base; il modulo si concentra su suoni segmentali, scrittura e ritmo moraico.",
  },
};

const SOUND_CONCEPT_BY_LESSON: Readonly<Record<string, string>> = {
  "sounds-1": "sound-vowels-gojuon",
  "sounds-2": "sound-voicing-marks",
  "sounds-3": "sound-mora-timing",
  "sounds-4": "sound-yoon-script-bridge",
} as const;

function visibleTarget(
  id: string,
  kana: string,
  romaji: string,
  conceptId: string,
  lexemeIds: readonly string[] = [],
): BaseVisibleTarget {
  return {
    tokens: [
      {
        id: `${id}-token`,
        jp: kana,
        romaji,
        kind: "lexical",
        boundaryBefore: "attach",
        source: { domain: "catalog", referenceId: id },
      },
    ],
    lexemeIds,
    conceptIds: [conceptId],
    formIds: [],
    patternCellIds: [],
    semanticRoleIds: [],
    interpretationTags: [],
    predicateSenseId: null,
    predicateLexemeId: null,
  };
}

function displayTarget(
  id: string,
  kana: string,
  role: BaseSoundDisplayTarget["role"],
): BaseSoundDisplayTarget {
  const moraSegments = kana.includes("・")
    ? kana.split("・").map((mora) =>
        deepFreeze({
          kana: mora,
          romaji:
            mora === "っ" ? null : romanizeBaseSoundSurface(mora),
        }),
      )
    : null;
  return deepFreeze({
    id,
    kana,
    romaji: romanizeBaseSoundSurface(kana),
    role,
    moraSegments,
  });
}

const soundDisplayTargetEntries: readonly (
  readonly [string, BaseSoundDisplayTarget]
)[] = [
  ...RAW_BASE_SOUND_MODULE.lessons.flatMap((definition) =>
    definition.anchorWords.map((anchor) => [
      `${anchor.id}-target`,
      deepFreeze({
        id: `${anchor.id}-target`,
        kana: anchor.kana,
        romaji: anchor.romaji,
        role: "anchor" as const,
        moraSegments: null,
      }),
    ] as const),
  ),
  ...RAW_BASE_SOUND_MODULE.lessons.flatMap((definition) =>
    definition.activityDesigns.flatMap((design) => {
      const surfaces = ACTIVITY_SURFACES[design.activityId];
      if (!surfaces) {
        throw new Error(`Missing surfaces for "${design.activityId}".`);
      }
      const answer =
        surfaces.correctIndex === null
          ? surfaces.spokenAnswer
          : surfaces.options[surfaces.correctIndex];
      if (!answer) {
        throw new Error(`Missing answer surface for "${design.activityId}".`);
      }
      return [
        [
          design.promptTargetId,
          displayTarget(design.promptTargetId, surfaces.prompt, "prompt"),
        ] as const,
        ...design.optionTargetIds.map((optionTargetId, optionIndex) => [
          optionTargetId,
          displayTarget(
            optionTargetId,
            surfaces.options[optionIndex],
            "option",
          ),
        ] as const),
        [
          design.answerTargetId,
          displayTarget(design.answerTargetId, answer, "answer"),
        ] as const,
      ];
    }),
  ),
];

if (
  new Set(soundDisplayTargetEntries.map(([id]) => id)).size !==
  soundDisplayTargetEntries.length
) {
  throw new Error("Duplicate Base sound display target ID.");
}

export const BASE_SOUND_TARGET_BY_ID: ReadonlyMap<
  string,
  BaseSoundDisplayTarget
> = immutableReadonlyMap(soundDisplayTargetEntries);

const acceptedAnswerEntries = RAW_BASE_SOUND_MODULE.lessons.flatMap(
  (definition) => {
    const conceptId = SOUND_CONCEPT_BY_LESSON[definition.content.lessonId];
    return definition.activityDesigns
      .filter((design) => design.canonicalAudioId === null)
      .map((design) => {
        const target = BASE_SOUND_TARGET_BY_ID.get(design.answerTargetId);
        if (!target) {
          throw new Error(`Missing answer target "${design.answerTargetId}".`);
        }
        return [
          design.answerTargetId,
          visibleTarget(
            target.id,
            target.kana,
            target.romaji,
            conceptId,
            activityAssessesAnchor(design) &&
            design.anchorLexemeId !== null
              ? [design.anchorLexemeId]
              : [],
          ),
        ] as const;
      });
  },
);

const activityPromptEntries = RAW_BASE_SOUND_MODULE.lessons.flatMap(
  (definition) => {
    const conceptId = SOUND_CONCEPT_BY_LESSON[definition.content.lessonId];
    return definition.activityDesigns.map((design) => {
      const target = BASE_SOUND_TARGET_BY_ID.get(design.promptTargetId);
      if (!target) {
        throw new Error(`Missing prompt target "${design.promptTargetId}".`);
      }
      return [
        baseActivityPromptKey(definition.content.lessonId, design.activityId),
        visibleTarget(
          target.id,
          target.kana,
          target.romaji,
          conceptId,
          activityAssessesAnchor(design) &&
          design.anchorLexemeId !== null
            ? [design.anchorLexemeId]
            : [],
        ),
      ] as const;
    });
  },
);

function audioConceptId(audioId: string): string {
  if (audioId.startsWith("snd1-")) return "sound-vowels-gojuon";
  if (audioId.startsWith("snd2-")) return "sound-voicing-marks";
  if (audioId.startsWith("snd3-")) return "sound-mora-timing";
  return "sound-yoon-script-bridge";
}

const audioTargetEntries = BASE_AUDIO_CATALOG.map((record) => [
  record.id,
  visibleTarget(
    record.id,
    record.kana,
    romanizeBaseSoundSurface(record.kana),
    audioConceptId(record.id),
  ),
] as const);

const enCopyIds = Object.keys(baseNavigationCopyEn.content);
const itCopyIds = Object.keys(baseNavigationCopyIt.content);
if (
  enCopyIds.length !== itCopyIds.length ||
  enCopyIds.some(
    (copyId) =>
      !Object.prototype.hasOwnProperty.call(baseNavigationCopyIt.content, copyId),
  )
) {
  throw new Error("Base sound copy IDs must resolve independently in EN and IT.");
}

export const BASE_SOUND_COPY_IDS: readonly string[] = deepFreeze(
  [...enCopyIds].sort(),
);

export const BASE_SOUND_VALIDATION_CATALOGS: BaseValidationCatalogs =
  deepFreeze({
    lexemes: BASE_LEXEME_BY_ID,
    concepts: BASE_CONCEPT_BY_ID,
    examples: immutableReadonlyMap([]),
    dialogues: immutableReadonlyMap([]),
    audioTargets: immutableReadonlyMap(audioTargetEntries),
    acceptedAnswerTargets: immutableReadonlyMap(acceptedAnswerEntries),
    activityPromptTargets: immutableReadonlyMap(activityPromptEntries),
    copyIds: immutableReadonlySet(BASE_SOUND_COPY_IDS),
    contrastMapIds: immutableReadonlySet(
      RAW_BASE_SOUND_MODULE.lessons.map(
        (definition) => definition.content.contrastMapId,
      ),
    ),
    referenceSnapshots: BASE_REFERENCE_SNAPSHOT_BY_ID,
    patternCellIds: immutableReadonlySet<string>([]),
    patternCellIdsByLesson: immutableReadonlyMap([]),
    systems: BASE_RETRIEVAL_SYSTEM_BY_ID,
  });

export const BASE_SOUND_LESSONS: readonly BasePhoneticLessonContent[] =
  deepFreeze(
    RAW_BASE_SOUND_MODULE.lessons.map((definition) => definition.content),
  );

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

function visibleTargetSurface(target: BaseVisibleTarget | undefined): string {
  return target?.tokens.map((token) => token.jp).join("") ?? "";
}

function soundAssessmentRomajiFingerprint(
  target: BaseSoundDisplayTarget | undefined,
  useMoraSegments: boolean,
): string {
  if (!target) return "";
  return useMoraSegments && target.moraSegments
    ? target.moraSegments
        .map((segment) => segment.romaji ?? "[timing]")
        .join("|")
    : target.romaji;
}

function normalizedActivitySurface(value: string): string {
  return value.replace(/[\s・／＿]/g, "");
}

function isTruthfulBaseRomaji(kana: unknown, romaji: unknown): boolean {
  if (typeof kana !== "string" || typeof romaji !== "string") return false;
  try {
    return (
      romaji.trim().length > 0 &&
      !/[\u3040-\u30ff\u3400-\u9fff]/.test(romaji) &&
      romaji === romanizeBaseSoundSurface(kana)
    );
  } catch {
    return false;
  }
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

  lessons.forEach((definitionValue, lessonIndex) => {
    const definition = plainRecord(definitionValue);
    const content = definition ? plainRecord(own(definition, "content")) : undefined;
    if (!definition || !content) {
      errors.add("invalid-lesson-shape");
      return;
    }
    const lessonId = own(content, "lessonId");
    if (
      lessonId !== expectedLessonIds[lessonIndex] ||
      own(content, "contract") !== "phonetic"
    ) {
      errors.add("invalid-lesson-allocation");
    }
    if (
      SEMANTIC_PADDING_FIELDS.some((field) =>
        Object.prototype.hasOwnProperty.call(content, field),
      )
    ) {
      errors.add("semantic-padding");
    }
    if (!localized(own(definition, "scopeNote"))) {
      errors.add("invalid-localized-copy");
    }

    const items = densePlainArray(own(definition, "contrastiveItems"));
    if (!items || items.length < 10 || items.length > 16) {
      errors.add("invalid-contrast-count");
    }
    const itemIds: string[] = [];
    const itemKanaById = new Map<string, string>();
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
        !isTruthfulBaseRomaji(kana, own(item, "romaji")) ||
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
      itemKanaById.set(id, kana);
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
    const audioExemplarIds = stringArray(own(content, "audioExemplarIds"));
    const contrastiveItemIds = stringArray(own(content, "contrastiveItemIds"));
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

    const anchors = densePlainArray(own(definition, "anchorWords"));
    if (!anchors || anchors.length < 4 || anchors.length > 8) {
      errors.add("invalid-anchor-count");
    }
    const anchorIds: string[] = [];
    const anchorMoraeById = new Map<string, readonly string[]>();
    for (const anchorValue of anchors ?? []) {
      const anchorRecord = plainRecord(anchorValue);
      const morae = anchorRecord ? stringArray(own(anchorRecord, "morae")) : undefined;
      const anchorId = anchorRecord ? own(anchorRecord, "id") : undefined;
      if (
        !anchorRecord ||
        typeof anchorId !== "string" ||
        typeof own(anchorRecord, "kana") !== "string" ||
        !isTruthfulBaseRomaji(
          own(anchorRecord, "kana"),
          own(anchorRecord, "romaji"),
        ) ||
        typeof own(anchorRecord, "meaningCopyId") !== "string" ||
        !morae ||
        morae.join("") !== own(anchorRecord, "kana") ||
        !localized(own(anchorRecord, "status"))
      ) {
        errors.add("invalid-lesson-shape");
      } else {
        anchorIds.push(anchorId);
        anchorMoraeById.set(anchorId, morae);
        const lexeme = BASE_LEXEME_BY_ID.get(anchorId);
        if (
          !lexeme ||
          lexeme.kana !== own(anchorRecord, "kana") ||
          lexeme.meaningCopyId !== own(anchorRecord, "meaningCopyId")
        ) {
          errors.add("invalid-lesson-shape");
        }
      }
    }
    const anchorLexemeIds = stringArray(own(content, "anchorLexemeIds"));
    if (
      !anchorLexemeIds ||
      anchorLexemeIds.length !== anchorIds.length ||
      anchorLexemeIds.some((id, index) => id !== anchorIds[index])
    ) {
      errors.add("invalid-lesson-shape");
    }

    const designs = densePlainArray(own(definition, "activityDesigns"));
    const activityValues = densePlainArray(own(content, "activities"));
    const correctPositions: number[] = [];
    const relatedAnchorIds = new Set<string>();
    if (!designs || !activityValues || designs.length !== 8 || activityValues.length !== 8) {
      errors.add("invalid-phonetic-activities");
    } else {
      designs.forEach((designValue, index) => {
        const designRecord = plainRecord(designValue);
        const activityRecord = plainRecord(activityValues[index]);
        if (!designRecord || !activityRecord) {
          errors.add("invalid-activity-evidence");
          return;
        }
        const activityId = own(designRecord, "activityId");
        const operation = own(designRecord, "operation");
        const promptTargetId = own(designRecord, "promptTargetId");
        const optionTargetIds = stringArray(own(designRecord, "optionTargetIds"));
        const correctOptionTargetId = own(designRecord, "correctOptionTargetId");
        const answerTargetId = own(designRecord, "answerTargetId");
        const anchorTargetId = own(designRecord, "anchorTargetId");
        const anchorLexemeId = own(designRecord, "anchorLexemeId");
        const contrastIds = stringArray(own(designRecord, "contrastItemIds"));
        const canonicalAudioId = own(designRecord, "canonicalAudioId");
        const requiresKanaScript = own(designRecord, "requiresKanaScript");
        const promptTarget =
          typeof promptTargetId === "string"
            ? BASE_SOUND_TARGET_BY_ID.get(promptTargetId)
            : undefined;
        const optionTargets = (optionTargetIds ?? []).map((id) =>
          BASE_SOUND_TARGET_BY_ID.get(id),
        );
        const answerTarget =
          typeof answerTargetId === "string"
            ? BASE_SOUND_TARGET_BY_ID.get(answerTargetId)
            : undefined;
        const anchorTarget =
          typeof anchorTargetId === "string"
            ? BASE_SOUND_TARGET_BY_ID.get(anchorTargetId)
            : undefined;
        const targetId = own(activityRecord, "targetId");
        const publishedTarget =
          typeof targetId === "string"
            ? BASE_SOUND_VALIDATION_CATALOGS.acceptedAnswerTargets.get(targetId) ??
              BASE_SOUND_VALIDATION_CATALOGS.audioTargets.get(targetId)
            : undefined;
        const publishedPrompt =
          typeof lessonId === "string" && typeof activityId === "string"
            ? BASE_SOUND_VALIDATION_CATALOGS.activityPromptTargets.get(
                baseActivityPromptKey(lessonId, activityId),
              )
            : undefined;
        const correctPosition =
          typeof correctOptionTargetId === "string"
            ? (optionTargetIds ?? []).indexOf(correctOptionTargetId)
            : -1;
        if (correctPosition >= 0) correctPositions.push(correctPosition);
        const expectedAnswerKana =
          correctPosition >= 0
            ? optionTargets[correctPosition]?.kana
            : answerTarget?.kana;
        const anchorLexeme =
          typeof anchorLexemeId === "string"
            ? BASE_LEXEME_BY_ID.get(anchorLexemeId)
            : undefined;
        const typedTargets = [
          promptTarget,
          ...optionTargets,
          answerTarget,
          ...(anchorTarget ? [anchorTarget] : []),
        ];
        const targetRomajiValid = typedTargets.every(
          (target) =>
            target !== undefined &&
            target.romaji.trim().length > 0 &&
            !/[\u3040-\u30ff\u3400-\u9fff]/.test(target.romaji) &&
            target.romaji === romanizeBaseSoundSurface(target.kana),
        );
        const activitySurfaces = [
          promptTarget?.kana ?? "",
          ...optionTargets.map((target) => target?.kana ?? ""),
          answerTarget?.kana ?? "",
          ...(typeof canonicalAudioId === "string"
            ? [baseAudioRecordById(canonicalAudioId)?.kana ?? ""]
            : []),
        ];
        const linkedItemsVisible =
          contrastIds?.every((contrastId) => {
            const itemKana = itemKanaById.get(contrastId);
            return (
              itemKana !== undefined &&
              activitySurfaces.some((surface) =>
                normalizedActivitySurface(surface).includes(
                  normalizedActivitySurface(itemKana),
                ),
              )
            );
          }) === true;
        const listeningHashes =
          operation === "identify-audio"
            ? new Set(
                (contrastIds ?? [])
                  .map((id) => baseAudioRecordById(id)?.sha256)
                  .filter((hash): hash is string => typeof hash === "string"),
              )
            : null;
        const targetScriptValid = typedTargets.every(
          (target) =>
            target !== undefined &&
            typeof lessonId === "string" &&
            isBaseSoundSurfaceOwnedByLesson(lessonId, target.kana),
        );
        const noMetaAnswers = typedTargets.every(
          (target) => target !== undefined && !/[≠＝→]/.test(target.kana),
        );
        const promptRequiresTransformation =
          operation === "produce-spoken" ||
          operation === "segment-morae" ||
          normalizedActivitySurface(promptTarget?.kana ?? "") !==
            normalizedActivitySurface(answerTarget?.kana ?? "");
        const anchorMorae =
          typeof anchorLexemeId === "string"
            ? anchorMoraeById.get(anchorLexemeId)
            : undefined;
        const anchorRelationValid =
          anchorLexemeId === null && anchorTargetId === null
            ? true
            : typeof anchorLexemeId === "string" &&
              typeof anchorTargetId === "string" &&
              anchorTarget?.role === "anchor" &&
              anchorTarget.kana === anchorLexeme?.kana &&
              anchorMorae !== undefined &&
              anchorMorae.some((mora) =>
                activitySurfaces.some((surface) =>
                  normalizedActivitySurface(surface).includes(
                    normalizedActivitySurface(mora),
                  ),
                ),
              );
        if (anchorRelationValid && typeof anchorLexemeId === "string") {
          relatedAnchorIds.add(anchorLexemeId);
        }
        const validSegmentationTargetIds =
          operation === "segment-morae" && anchorMorae
            ? (optionTargetIds ?? []).filter((_, optionIndex) => {
                const segments = optionTargets[optionIndex]?.moraSegments;
                return (
                  segments !== null &&
                  segments !== undefined &&
                  segments.map((segment) => segment.kana).join("") ===
                    promptTarget?.kana &&
                  segments.map((segment) => segment.kana).join("・") ===
                    anchorMorae.join("・")
                );
              })
            : [];
        const segmentationOptionLengths =
          operation === "segment-morae"
            ? optionTargets.map(
                (target) => target?.moraSegments?.length ?? -1,
              )
            : [];
        const segmentationValid =
          operation !== "segment-morae" ||
          (promptTarget?.kana === anchorLexeme?.kana &&
            validSegmentationTargetIds.length === 1 &&
            validSegmentationTargetIds[0] === correctOptionTargetId &&
            new Set(segmentationOptionLengths).size === 1);
        const scriptOnlyActivityIds = new Set([
          "snd2-recognize-jidi",
          "snd4-recognize-small-yoon",
          "snd4-map-katakana",
        ]);
        const expectedKanaScriptRequirement =
          typeof activityId === "string" &&
          scriptOnlyActivityIds.has(activityId);
        const romajiFingerprintsCollide =
          soundAssessmentRomajiFingerprint(
            promptTarget,
            operation === "segment-morae",
          ) ===
          soundAssessmentRomajiFingerprint(
            answerTarget,
            operation === "segment-morae",
          );
        const romajiModeValid =
          typeof requiresKanaScript === "boolean" &&
          requiresKanaScript === expectedKanaScriptRequirement &&
          (!romajiFingerprintsCollide ||
            requiresKanaScript ||
            operation === "produce-spoken");
        const instructionId = own(activityRecord, "instructionCopyId");
        const instructionEn =
          typeof instructionId === "string"
            ? baseNavigationCopyEn.content[instructionId]
            : undefined;
        const instructionIt =
          typeof instructionId === "string"
            ? baseNavigationCopyIt.content[instructionId]
            : undefined;
        const forbiddenKana = [
          answerTarget?.kana,
          anchorTarget?.kana,
          typeof canonicalAudioId === "string"
            ? baseAudioRecordById(canonicalAudioId)?.kana
            : undefined,
        ].filter((surface): surface is string => typeof surface === "string");
        const instructionLeakFree = [instructionEn, instructionIt].every(
          (instruction) =>
            typeof instruction === "string" &&
            instruction.trim().length > 0 &&
            !/[\u3040-\u30ff\u3400-\u9fff]/.test(instruction) &&
            forbiddenKana.every((surface) => !instruction.includes(surface)),
        );
        const semanticEvidenceValid =
          (operation !== "discriminate-sound" || (contrastIds?.length ?? 0) >= 2) &&
          (operation !== "segment-morae" || answerTarget?.kana.includes("・") === true) &&
          (operation !== "match-sound-word" || answerTarget?.kana === anchorLexeme?.kana) &&
          (operation !== "assemble-reading" || answerTarget?.kana === anchorLexeme?.kana) &&
          (operation !== "identify-audio" ||
            (typeof canonicalAudioId === "string" &&
              (listeningHashes?.size ?? 0) >= 2)) &&
          (operation !== "produce-spoken" || optionTargetIds?.length === 0);
        const expectedActivityTargetId =
          typeof canonicalAudioId === "string" ? canonicalAudioId : answerTargetId;
        if (
          activityId !== own(activityRecord, "id") ||
          operation !== ACTIVITY_SHAPES[index][2] ||
          operation !== own(activityRecord, "operation") ||
          own(designRecord, "evidenceTag") !== EVIDENCE_TAGS[index] ||
          promptTarget?.role !== "prompt" ||
          optionTargets.some((target) => target?.role !== "option") ||
          answerTarget?.role !== "answer" ||
          !anchorRelationValid ||
          answerTarget?.kana !== expectedAnswerKana ||
          (index < 7 &&
            ((optionTargetIds?.length ?? 0) < 2 || correctPosition < 0)) ||
          (index === 7 &&
            ((optionTargetIds?.length ?? -1) !== 0 ||
              correctOptionTargetId !== null)) ||
          expectedActivityTargetId !== targetId ||
          visibleTargetSurface(publishedPrompt) !== promptTarget?.kana ||
          visibleTargetSurface(publishedTarget) !==
            (typeof canonicalAudioId === "string"
              ? baseAudioRecordById(canonicalAudioId)?.kana
              : answerTarget?.kana) ||
          (typeof anchorLexemeId === "string" &&
            !anchorIds.includes(anchorLexemeId)) ||
          !contrastIds ||
          contrastIds.some((id) => !itemIds.includes(id)) ||
          !linkedItemsVisible ||
          !targetRomajiValid ||
          !targetScriptValid ||
          !noMetaAnswers ||
          !promptRequiresTransformation ||
          !segmentationValid ||
          !romajiModeValid ||
          !instructionLeakFree ||
          !semanticEvidenceValid
        ) {
          errors.add("invalid-activity-evidence");
        }
      });
      const zeroPositions = correctPositions.filter(
        (position) => position === 0,
      ).length;
      const onePositions = correctPositions.filter(
        (position) => position === 1,
      ).length;
      if (
        correctPositions.length !== 7 ||
        Math.abs(zeroPositions - onePositions) !== 1 ||
        zeroPositions + onePositions !== 7
      ) {
        errors.add("invalid-activity-evidence");
      }
      if (anchorIds.some((anchorId) => !relatedAnchorIds.has(anchorId))) {
        errors.add("invalid-activity-evidence");
      }
    }

    const coverageValues = densePlainArray(own(definition, "inventoryCoverage"));
    if (!coverageValues) {
      errors.add("invalid-inventory-coverage");
    } else {
      const expectedCoverageIds = [
        ["basic-hiragana"],
        ["dakuten", "handakuten"],
        [],
        ["common-yoon", "katakana-bridge"],
      ][lessonIndex];
      const actualCoverageIds = coverageValues.map((coverageValue) => {
        const coverage = plainRecord(coverageValue);
        return coverage ? own(coverage, "inventoryId") : undefined;
      });
      if (
        actualCoverageIds.length !== expectedCoverageIds.length ||
        actualCoverageIds.some(
          (inventoryId, index) => inventoryId !== expectedCoverageIds[index],
        )
      ) {
        errors.add("invalid-inventory-coverage");
      }
      for (const coverageValue of coverageValues) {
        const coverage = plainRecord(coverageValue);
        const represented = coverage
          ? stringArray(own(coverage, "represented"))
          : undefined;
        const scopedOut = coverage
          ? stringArray(own(coverage, "scopedOut")) ?? []
          : undefined;
        const inventoryId = coverage ? own(coverage, "inventoryId") : undefined;
        const inventory =
          inventoryId === "basic-hiragana"
            ? BASIC_HIRAGANA
            : inventoryId === "dakuten"
              ? DAKUTEN_HIRAGANA
              : inventoryId === "handakuten"
                ? HANDAKUTEN_HIRAGANA
                : inventoryId === "common-yoon"
                  ? YOON_HIRAGANA
                  : inventoryId === "katakana-bridge"
                    ? KATAKANA_BRIDGE
                    : undefined;
        const combined = represented && scopedOut
          ? [...represented, ...scopedOut]
          : [];
        const rationale = coverage ? own(coverage, "rationale") : undefined;
        if (
          !coverage ||
          !inventory ||
          !represented ||
          !scopedOut ||
          new Set(combined).size !== inventory.length ||
          inventory.some((item) => !combined.includes(item)) ||
          (scopedOut.length > 0 && !localized(rationale)) ||
          (scopedOut.length === 0 && rationale !== null)
        ) {
          errors.add("invalid-inventory-coverage");
          continue;
        }
        const authoredRepresentations =
          inventoryId === "basic-hiragana"
            ? (items ?? []).flatMap((itemValue) => {
                const item = plainRecord(itemValue);
                return stringArray(item ? own(item, "morae") : undefined) ?? [];
              })
            : (items ?? [])
                .map((itemValue) => {
                  const item = plainRecord(itemValue);
                  return item ? own(item, "kana") : undefined;
                })
                .filter((kana): kana is string => typeof kana === "string");
        if (
          represented.some((item) => !authoredRepresentations.includes(item))
        ) {
          errors.add("invalid-inventory-coverage");
        }
      }
    }

    if (
      validateBaseLessonDepth(content, BASE_SOUND_VALIDATION_CATALOGS).length > 0
    ) {
      errors.add("canonical-depth-failure");
    }
  });

  return { ok: errors.size === 0, errors: [...errors] };
}

const moduleValidation = validateBaseSoundModule(RAW_BASE_SOUND_MODULE);
if (!moduleValidation.ok) {
  const depthDetails = RAW_BASE_SOUND_MODULE.lessons.flatMap((definition) =>
    validateBaseLessonDepth(
      definition.content,
      BASE_SOUND_VALIDATION_CATALOGS,
    ),
  );
  throw new Error(
    `Invalid Base sound module: ${moduleValidation.errors.join(", ")} ${JSON.stringify(depthDetails)}`,
  );
}

export const BASE_SOUND_MODULE: BaseSoundModule = deepFreeze(RAW_BASE_SOUND_MODULE);
