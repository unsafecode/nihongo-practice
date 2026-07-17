/**
 * A1 Module 1 — Sounds.
 *
 * Four phonetic lessons that build the Japanese sound system bottom-up:
 * core mora and the five vowels, the full gojūon plus dakuten and yōon,
 * the small っ (gemination) and long vowels, and the high-frequency katakana
 * a beginner meets on day one. `sounds-4` deliberately consolidates the
 * breadth of the retired `sounds-5` (aliased in the manifest) into the
 * katakana survey.
 *
 * Unlike the instructional modules, sounds are not realized through the
 * sentence engine — there is no predicate or role here. Instead this file owns
 * a small, self-contained **phonetic item catalog**: the one place (besides the
 * semantic-value table) where Japanese glyphs are authored. Each item carries a
 * visible glyph, its kana reading, a wāpuro roman transcription and explicit
 * minimal-pair contrast metadata, plus one deterministic exercise reference.
 * There are no hidden canonical answers — the roman field is a description of
 * the glyph, and exercises reference items by id rather than embedding a key.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import { defineA1Module, defineA1PhoneticLesson } from "../authoring";
import type { A1ModuleRecipe, A1PhoneticLessonRecipe } from "../types";
import type { Bilingual } from "./shared";

const MODULE_ID = "sounds";

/** Deterministic exercise families used across the phonetic lessons. */
export type A1PhoneticExerciseKind =
  | "minimal-pair-listening"
  | "mora-tiling"
  | "reading-choice";

/**
 * One authored phonetic target. `glyph` is what the learner sees; `kana` is its
 * reading; `roman` is a wāpuro transcription (long vowels written out, e.g.
 * コーヒー → koohii — the reviewed koohii policy). `contrastWithId` names the
 * minimal-pair partner that isolates `contrastFeature`. `exerciseRefId` is the
 * stable id of this item's one practice reference; no answer is embedded.
 */
export interface A1PhoneticItem {
  readonly id: string;
  readonly glyph: string;
  readonly kana: string;
  readonly roman: string;
  readonly contrastWithId: string;
  readonly contrastFeature: string;
  readonly exerciseRefId: string;
  readonly exerciseKind: A1PhoneticExerciseKind;
  readonly hintCopyId: string;
}

interface ItemSeed {
  readonly id: string;
  readonly glyph: string;
  readonly kana: string;
  readonly roman: string;
  readonly contrastWithId: string;
  readonly contrastFeature: string;
  readonly kind: A1PhoneticExerciseKind;
  readonly hint: Bilingual;
}

const HINTS: Record<string, Bilingual> = {};

function seed(items: readonly ItemSeed[]): readonly A1PhoneticItem[] {
  return items.map((s) => {
    HINTS[`${s.id}-hint`] = s.hint;
    return Object.freeze({
      id: s.id,
      glyph: s.glyph,
      kana: s.kana,
      roman: s.roman,
      contrastWithId: s.contrastWithId,
      contrastFeature: s.contrastFeature,
      exerciseRefId: `${s.id}-ex`,
      exerciseKind: s.kind,
      hintCopyId: `${s.id}-hint`,
    });
  });
}

const L = (en: string, it: string): Bilingual => ({ en, it });

// ---------------------------------------------------------------------------
// sounds-1 — core mora & the five vowels
// ---------------------------------------------------------------------------

const sounds1Items = seed([
  { id: "snd1-a", glyph: "あ", kana: "あ", roman: "a", contrastWithId: "snd1-i", contrastFeature: "vowel-quality", kind: "minimal-pair-listening", hint: L("The open vowel /a/.", "La vocale aperta /a/.") },
  { id: "snd1-i", glyph: "い", kana: "い", roman: "i", contrastWithId: "snd1-a", contrastFeature: "vowel-quality", kind: "minimal-pair-listening", hint: L("The front vowel /i/.", "La vocale anteriore /i/.") },
  { id: "snd1-u", glyph: "う", kana: "う", roman: "u", contrastWithId: "snd1-o", contrastFeature: "vowel-quality", kind: "minimal-pair-listening", hint: L("The unrounded /u/.", "La /u/ non arrotondata.") },
  { id: "snd1-e", glyph: "え", kana: "え", roman: "e", contrastWithId: "snd1-i", contrastFeature: "vowel-quality", kind: "minimal-pair-listening", hint: L("The mid vowel /e/.", "La vocale media /e/.") },
  { id: "snd1-o", glyph: "お", kana: "お", roman: "o", contrastWithId: "snd1-u", contrastFeature: "vowel-quality", kind: "minimal-pair-listening", hint: L("The rounded /o/.", "La /o/ arrotondata.") },
  { id: "snd1-ka", glyph: "か", kana: "か", roman: "ka", contrastWithId: "snd1-a", contrastFeature: "consonant-onset", kind: "reading-choice", hint: L("k-row: consonant + /a/.", "Riga k: consonante + /a/.") },
  { id: "snd1-ki", glyph: "き", kana: "き", roman: "ki", contrastWithId: "snd1-ka", contrastFeature: "vowel-quality", kind: "reading-choice", hint: L("k-row: consonant + /i/.", "Riga k: consonante + /i/.") },
  { id: "snd1-sa", glyph: "さ", kana: "さ", roman: "sa", contrastWithId: "snd1-ka", contrastFeature: "consonant-place", kind: "reading-choice", hint: L("s-row: consonant + /a/.", "Riga s: consonante + /a/.") },
  { id: "snd1-su", glyph: "す", kana: "す", roman: "su", contrastWithId: "snd1-u", contrastFeature: "consonant-onset", kind: "reading-choice", hint: L("s-row: consonant + /u/.", "Riga s: consonante + /u/.") },
  { id: "snd1-se", glyph: "せ", kana: "せ", roman: "se", contrastWithId: "snd1-e", contrastFeature: "consonant-onset", kind: "reading-choice", hint: L("s-row: consonant + /e/.", "Riga s: consonante + /e/.") },
]);

// ---------------------------------------------------------------------------
// sounds-2 — gojūon, dakuten & yōon
// ---------------------------------------------------------------------------

const sounds2Items = seed([
  { id: "snd2-ka", glyph: "か", kana: "か", roman: "ka", contrastWithId: "snd2-ga", contrastFeature: "voicing", kind: "minimal-pair-listening", hint: L("Voiceless ka.", "Ka sorda.") },
  { id: "snd2-ga", glyph: "が", kana: "が", roman: "ga", contrastWithId: "snd2-ka", contrastFeature: "voicing", kind: "minimal-pair-listening", hint: L("Dakuten voices ka to ga.", "Il dakuten sonorizza ka in ga.") },
  { id: "snd2-ki", glyph: "き", kana: "き", roman: "ki", contrastWithId: "snd2-gi", contrastFeature: "voicing", kind: "minimal-pair-listening", hint: L("Voiceless ki.", "Ki sorda.") },
  { id: "snd2-gi", glyph: "ぎ", kana: "ぎ", roman: "gi", contrastWithId: "snd2-ki", contrastFeature: "voicing", kind: "minimal-pair-listening", hint: L("Dakuten voices ki to gi.", "Il dakuten sonorizza ki in gi.") },
  { id: "snd2-sa", glyph: "さ", kana: "さ", roman: "sa", contrastWithId: "snd2-za", contrastFeature: "voicing", kind: "minimal-pair-listening", hint: L("Voiceless sa.", "Sa sorda.") },
  { id: "snd2-za", glyph: "ざ", kana: "ざ", roman: "za", contrastWithId: "snd2-sa", contrastFeature: "voicing", kind: "minimal-pair-listening", hint: L("Dakuten voices sa to za.", "Il dakuten sonorizza sa in za.") },
  { id: "snd2-kya", glyph: "きゃ", kana: "きゃ", roman: "kya", contrastWithId: "snd2-ki", contrastFeature: "palatalization", kind: "reading-choice", hint: L("Yōon ki + small ya makes one mora kya.", "Yōon ki + ya piccola formano una mora kya.") },
  { id: "snd2-kyu", glyph: "きゅ", kana: "きゅ", roman: "kyu", contrastWithId: "snd2-kya", contrastFeature: "glide-vowel", kind: "reading-choice", hint: L("Yōon ki + small yu makes kyu.", "Yōon ki + yu piccola formano kyu.") },
  { id: "snd2-kyo", glyph: "きょ", kana: "きょ", roman: "kyo", contrastWithId: "snd2-kya", contrastFeature: "glide-vowel", kind: "reading-choice", hint: L("Yōon ki + small yo makes kyo.", "Yōon ki + yo piccola formano kyo.") },
  { id: "snd2-sha", glyph: "しゃ", kana: "しゃ", roman: "sha", contrastWithId: "snd2-sa", contrastFeature: "palatalization", kind: "reading-choice", hint: L("Yōon shi + small ya makes sha.", "Yōon shi + ya piccola formano sha.") },
]);

// ---------------------------------------------------------------------------
// sounds-3 — small っ (gemination) & long vowels
// ---------------------------------------------------------------------------

const sounds3Items = seed([
  { id: "snd3-kite", glyph: "きて", kana: "きて", roman: "kite", contrastWithId: "snd3-kitte", contrastFeature: "gemination", kind: "minimal-pair-listening", hint: L("No sokuon: ki-te.", "Senza sokuon: ki-te.") },
  { id: "snd3-kitte", glyph: "きって", kana: "きって", roman: "kitte", contrastWithId: "snd3-kite", contrastFeature: "gemination", kind: "minimal-pair-listening", hint: L("The small tsu (sokuon) doubles the stop: kit-te.", "Il piccolo tsu (sokuon) raddoppia l'occlusiva: kit-te.") },
  { id: "snd3-obasan", glyph: "おばさん", kana: "おばさん", roman: "obasan", contrastWithId: "snd3-obaasan", contrastFeature: "vowel-length", kind: "minimal-pair-listening", hint: L("Short a: obasan (aunt).", "a breve: obasan (zia).") },
  { id: "snd3-obaasan", glyph: "おばあさん", kana: "おばあさん", roman: "obaasan", contrastWithId: "snd3-obasan", contrastFeature: "vowel-length", kind: "minimal-pair-listening", hint: L("Long aa: obaasan (grandmother).", "aa lunga: obaasan (nonna).") },
  { id: "snd3-koko", glyph: "ここ", kana: "ここ", roman: "koko", contrastWithId: "snd3-koukou", contrastFeature: "vowel-length", kind: "mora-tiling", hint: L("Two short mora: ko-ko.", "Due mora brevi: ko-ko.") },
  { id: "snd3-koukou", glyph: "こうこう", kana: "こうこう", roman: "koukou", contrastWithId: "snd3-koko", contrastFeature: "vowel-length", kind: "mora-tiling", hint: L("Long o written as ou: kou-kou.", "o lunga scritta ou: kou-kou.") },
  { id: "snd3-e", glyph: "え", kana: "え", roman: "e", contrastWithId: "snd3-ee", contrastFeature: "vowel-length", kind: "minimal-pair-listening", hint: L("Single mora e.", "Una sola mora e.") },
  { id: "snd3-ee", glyph: "ええ", kana: "ええ", roman: "ee", contrastWithId: "snd3-e", contrastFeature: "vowel-length", kind: "minimal-pair-listening", hint: L("Long ee (casual yes).", "ee lunga (sì informale).") },
  { id: "snd3-to", glyph: "と", kana: "と", roman: "to", contrastWithId: "snd3-tou", contrastFeature: "vowel-length", kind: "mora-tiling", hint: L("Single mora to.", "Una sola mora to.") },
  { id: "snd3-tou", glyph: "とう", kana: "とう", roman: "tou", contrastWithId: "snd3-to", contrastFeature: "vowel-length", kind: "mora-tiling", hint: L("Long o written as ou: tou.", "o lunga scritta ou: tou.") },
]);

// ---------------------------------------------------------------------------
// sounds-4 — high-frequency katakana (consolidates retired sounds-5 breadth)
// ---------------------------------------------------------------------------

const sounds4Items = seed([
  { id: "snd4-koohii", glyph: "コーヒー", kana: "コーヒー", roman: "koohii", contrastWithId: "snd4-terebi", contrastFeature: "chouonpu-length", kind: "mora-tiling", hint: L("The chōonpu bar marks long vowels: koohii.", "Il chōonpu (barra) segna le vocali lunghe: koohii.") },
  { id: "snd4-terebi", glyph: "テレビ", kana: "テレビ", roman: "terebi", contrastWithId: "snd4-koohii", contrastFeature: "katakana-word", kind: "reading-choice", hint: L("Loanword: terebi (TV).", "Prestito: terebi (TV).") },
  { id: "snd4-pan", glyph: "パン", kana: "パン", roman: "pan", contrastWithId: "snd4-raamen", contrastFeature: "handakuten", kind: "reading-choice", hint: L("Handakuten pa-row: pan (bread).", "Riga pa con handakuten: pan (pane).") },
  { id: "snd4-resutoran", glyph: "レストラン", kana: "レストラン", roman: "resutoran", contrastWithId: "snd4-terebi", contrastFeature: "katakana-word", kind: "mora-tiling", hint: L("Loanword: resutoran (restaurant).", "Prestito: resutoran (ristorante).") },
  { id: "snd4-kafe", glyph: "カフェ", kana: "カフェ", roman: "kafe", contrastWithId: "snd4-koohii", contrastFeature: "small-kana-combo", kind: "reading-choice", hint: L("A small e-kana makes fe: kafe.", "Una piccola e-kana forma fe: kafe.") },
  { id: "snd4-suupaa", glyph: "スーパー", kana: "スーパー", roman: "suupaa", contrastWithId: "snd4-koohii", contrastFeature: "chouonpu-length", kind: "mora-tiling", hint: L("Two chōonpu: suu-paa.", "Due chōonpu: suu-paa.") },
  { id: "snd4-raamen", glyph: "ラーメン", kana: "ラーメン", roman: "raamen", contrastWithId: "snd4-pan", contrastFeature: "chouonpu-length", kind: "mora-tiling", hint: L("Chōonpu after ra: raamen.", "Chōonpu dopo ra: raamen.") },
  { id: "snd4-amerika", glyph: "アメリカ", kana: "アメリカ", roman: "amerika", contrastWithId: "snd4-itaria", contrastFeature: "katakana-word", kind: "reading-choice", hint: L("Country name: amerika.", "Nome di paese: amerika.") },
  { id: "snd4-itaria", glyph: "イタリア", kana: "イタリア", roman: "itaria", contrastWithId: "snd4-amerika", contrastFeature: "katakana-word", kind: "reading-choice", hint: L("Country name: itaria.", "Nome di paese: itaria.") },
  { id: "snd4-kurasumeeto", glyph: "クラスメート", kana: "クラスメート", roman: "kurasumeeto", contrastWithId: "snd4-suupaa", contrastFeature: "chouonpu-length", kind: "mora-tiling", hint: L("Chōonpu in the meeto part: kurasumeeto.", "Chōonpu nella parte meeto: kurasumeeto.") },
]);

export const module1PhoneticItems: readonly A1PhoneticItem[] = Object.freeze([
  ...sounds1Items,
  ...sounds2Items,
  ...sounds3Items,
  ...sounds4Items,
]);

/** Items grouped by their owning lesson (used by the module-local test). */
export const module1ItemsByLesson: Readonly<
  Record<string, readonly A1PhoneticItem[]>
> = Object.freeze({
  "sounds-1": sounds1Items,
  "sounds-2": sounds2Items,
  "sounds-3": sounds3Items,
  "sounds-4": sounds4Items,
});

// ---------------------------------------------------------------------------
// Lesson recipes
// ---------------------------------------------------------------------------

function phoneticLesson(
  id: string,
  order: 1 | 2 | 3 | 4,
  items: readonly A1PhoneticItem[],
): A1PhoneticLessonRecipe {
  return defineA1PhoneticLesson({
    id,
    moduleId: MODULE_ID,
    order,
    contract: "phonetic",
    primaryCanDoId: "a1-can-do-sounds",
    supportingCanDoIds: [],
    contrastiveItemIds: items.map((i) => i.id),
    practiceTargetRefs: items.map((i) => i.exerciseRefId),
    outcomeCopyId: `a1-phonetic-outcome-${id}`,
  });
}

export const module1Lessons: readonly A1PhoneticLessonRecipe[] = [
  phoneticLesson("sounds-1", 1, sounds1Items),
  phoneticLesson("sounds-2", 2, sounds2Items),
  phoneticLesson("sounds-3", 3, sounds3Items),
  phoneticLesson("sounds-4", 4, sounds4Items),
];

export const module1Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

// ---------------------------------------------------------------------------
// Copy — phonetic outcomes + per-item hints (no Japanese, EN/IT parity)
// ---------------------------------------------------------------------------

const OUTCOMES: Record<string, Bilingual> = {
  "a1-phonetic-outcome-sounds-1": L(
    "You can hear and read the five vowels and the core mora.",
    "Sai ascoltare e leggere le cinque vocali e le mora di base.",
  ),
  "a1-phonetic-outcome-sounds-2": L(
    "You can read the gojūon with dakuten voicing and yōon glides.",
    "Sai leggere il gojūon con la sonorizzazione dakuten e le yōon.",
  ),
  "a1-phonetic-outcome-sounds-3": L(
    "You can hear the small tsu (sokuon) and long vowels that change meaning.",
    "Sai distinguere il piccolo tsu (sokuon) e le vocali lunghe che cambiano senso.",
  ),
  "a1-phonetic-outcome-sounds-4": L(
    "You can read the everyday katakana words you meet first.",
    "Sai leggere le parole in katakana di uso quotidiano più comuni.",
  ),
  "a1-module-outcome-sounds": L(
    "You can read kana and hear the contrasts that carry meaning.",
    "Sai leggere i kana e cogliere i contrasti che portano significato.",
  ),
};

export const module1Copy: { readonly en: Record<string, string>; readonly it: Record<string, string> } = (() => {
  const en: Record<string, string> = {};
  const it: Record<string, string> = {};
  for (const [key, b] of Object.entries({ ...OUTCOMES, ...HINTS })) {
    en[key] = b.en;
    it[key] = b.it;
  }
  return { en, it };
})();
