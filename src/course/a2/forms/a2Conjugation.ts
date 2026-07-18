import { deepFreeze } from "../../foundations/deepFreeze";
import type { RomajiBoundaryBefore, RomajiTokenKind } from "../../../romaji/types";

/**
 * The A2 class-aware plain-form conjugation engine (Phase 3 Task 2, design
 * spec §7.1/§9.2-§9.4/§13). This is deliberately **not**
 * `src/lab/engine/conjugate.ts` — that engine only produces polite
 * ます-stem forms and romanizes long vowels with macrons (e.g. `mashō`).
 * This engine is plain-form (dictionary/negative/past/past-negative/て),
 * conjugation-class aware (ichidan, the nine godan sub-classes by final
 * mora, and the two irregulars する/来る — plus the 行く い-onbin
 * exception), and macron-free (long vowels are spelled out), consistent
 * with the A2 romaji policy.
 *
 * All verbal Japanese for the A2 form/aspect layer is authored here and in
 * `./a2Constructions`, nowhere else: `grammarSpiral.ts` only carries lesson
 * IDs, never Japanese/romaji literals.
 */

/**
 * A romaji-checkable fragment of a conjugated word. Mirrors the shared
 * `AssembledToken` shape (jp/romaji/kind/boundaryBefore) so a caller that
 * later assigns an `id`/`source` can feed these fragments through the same
 * romaji formatting the rest of the course uses. A kanji fragment carries
 * its kana `reading`; a kana-only morpheme omits `reading` (it reads as its
 * own kana).
 */
export interface A2Fragment {
  readonly jp: string;
  readonly romaji: string;
  readonly kind: RomajiTokenKind;
  readonly boundaryBefore: RomajiBoundaryBefore;
  readonly reading?: string;
}

/**
 * Every conjugation class the A2 plain-form paradigm distinguishes: one
 * ichidan class, the nine godan sub-classes (named by their dictionary-form
 * final mora — う/く/ぐ/す/つ/ぬ/ぶ/む/る), and the two irregulars する/来る.
 * `godan-u` is a real, distinct class (e.g. 買う) even though none of the 12
 * registered verbs below happens to use it.
 */
export type A2ConjugationClass =
  | "ichidan"
  | "godan-u"
  | "godan-ku"
  | "godan-gu"
  | "godan-su"
  | "godan-tsu"
  | "godan-nu"
  | "godan-bu"
  | "godan-mu"
  | "godan-ru"
  | "irregular-suru"
  | "irregular-kuru";

/** Every conjugation-class identity, runtime-checkable (not just a compile-time union). */
export const A2_CONJUGATION_CLASSES: readonly A2ConjugationClass[] = deepFreeze([
  "ichidan",
  "godan-u",
  "godan-ku",
  "godan-gu",
  "godan-su",
  "godan-tsu",
  "godan-nu",
  "godan-bu",
  "godan-mu",
  "godan-ru",
  "irregular-suru",
  "irregular-kuru",
]);

/** The five plain forms the A2 spiral's suffix constructions attach to. */
export type A2PlainForm = "dictionary" | "negative" | "past" | "past-negative" | "te";

/** A conjugation class that conjugates through the regular okurigana tables (excludes the two full-word irregulars). */
export type RegularA2ConjugationClass = Exclude<
  A2ConjugationClass,
  "irregular-suru" | "irregular-kuru"
>;

export interface A2Verb {
  readonly senseId: string;
  readonly conjClass: A2ConjugationClass;
  /**
   * The invariant root fragments: the kanji stem (lexical, carrying its
   * reading) plus any leading okurigana that never changes (e.g. べ in
   * 食べる). Empty for する and 来る, whose full words live in the irregular
   * tables below.
   */
  readonly stem: readonly A2Fragment[];
  /** 行く only: past/て use った/って (い-onbin exception), not the regular いた/いて. */
  readonly tePastException?: "iku";
}

interface Okurigana {
  readonly jp: string;
  readonly romaji: string;
}

type ClassTable = Readonly<Record<A2PlainForm, Okurigana>>;

/** Regular okurigana per class (appended to the verb stem). */
const OKURIGANA: Readonly<Record<RegularA2ConjugationClass, ClassTable>> = deepFreeze({
  ichidan: {
    dictionary: { jp: "る", romaji: "ru" },
    negative: { jp: "ない", romaji: "nai" },
    past: { jp: "た", romaji: "ta" },
    "past-negative": { jp: "なかった", romaji: "nakatta" },
    te: { jp: "て", romaji: "te" },
  },
  "godan-u": {
    dictionary: { jp: "う", romaji: "u" },
    negative: { jp: "わない", romaji: "wanai" },
    past: { jp: "った", romaji: "tta" },
    "past-negative": { jp: "わなかった", romaji: "wanakatta" },
    te: { jp: "って", romaji: "tte" },
  },
  "godan-ku": {
    dictionary: { jp: "く", romaji: "ku" },
    negative: { jp: "かない", romaji: "kanai" },
    past: { jp: "いた", romaji: "ita" },
    "past-negative": { jp: "かなかった", romaji: "kanakatta" },
    te: { jp: "いて", romaji: "ite" },
  },
  "godan-gu": {
    dictionary: { jp: "ぐ", romaji: "gu" },
    negative: { jp: "がない", romaji: "ganai" },
    past: { jp: "いだ", romaji: "ida" },
    "past-negative": { jp: "がなかった", romaji: "ganakatta" },
    te: { jp: "いで", romaji: "ide" },
  },
  "godan-su": {
    dictionary: { jp: "す", romaji: "su" },
    negative: { jp: "さない", romaji: "sanai" },
    past: { jp: "した", romaji: "shita" },
    "past-negative": { jp: "さなかった", romaji: "sanakatta" },
    te: { jp: "して", romaji: "shite" },
  },
  "godan-tsu": {
    dictionary: { jp: "つ", romaji: "tsu" },
    negative: { jp: "たない", romaji: "tanai" },
    past: { jp: "った", romaji: "tta" },
    "past-negative": { jp: "たなかった", romaji: "tanakatta" },
    te: { jp: "って", romaji: "tte" },
  },
  "godan-nu": {
    dictionary: { jp: "ぬ", romaji: "nu" },
    negative: { jp: "なない", romaji: "nanai" },
    past: { jp: "んだ", romaji: "nda" },
    "past-negative": { jp: "ななかった", romaji: "nanakatta" },
    te: { jp: "んで", romaji: "nde" },
  },
  "godan-bu": {
    dictionary: { jp: "ぶ", romaji: "bu" },
    negative: { jp: "ばない", romaji: "banai" },
    past: { jp: "んだ", romaji: "nda" },
    "past-negative": { jp: "ばなかった", romaji: "banakatta" },
    te: { jp: "んで", romaji: "nde" },
  },
  "godan-mu": {
    dictionary: { jp: "む", romaji: "mu" },
    negative: { jp: "まない", romaji: "manai" },
    past: { jp: "んだ", romaji: "nda" },
    "past-negative": { jp: "まなかった", romaji: "manakatta" },
    te: { jp: "んで", romaji: "nde" },
  },
  "godan-ru": {
    dictionary: { jp: "る", romaji: "ru" },
    negative: { jp: "らない", romaji: "ranai" },
    past: { jp: "った", romaji: "tta" },
    "past-negative": { jp: "らなかった", romaji: "ranakatta" },
    te: { jp: "って", romaji: "tte" },
  },
});

/** 行く い-onbin exception: past/て only (行った/行って, not 行いた/行いて). */
const IKU_EXCEPTION: Readonly<Pick<Record<A2PlainForm, Okurigana>, "past" | "te">> = deepFreeze({
  past: { jp: "った", romaji: "tta" },
  te: { jp: "って", romaji: "tte" },
});

/** A bound morpheme fragment (okurigana/endings): attaches with no boundary space. */
function M(jp: string, romaji: string): A2Fragment {
  return { jp, romaji, kind: "morpheme", boundaryBefore: "attach" };
}

/** A lexical kanji-root fragment carrying its own kana reading. */
function L(jp: string, reading: string, romaji: string): A2Fragment {
  return { jp, romaji, reading, kind: "lexical", boundaryBefore: "attach" };
}

/** する — full-word forms (no kanji root). */
const SURU_FORMS: Readonly<Record<A2PlainForm, readonly A2Fragment[]>> = deepFreeze({
  dictionary: [M("する", "suru")],
  negative: [M("しない", "shinai")],
  past: [M("した", "shita")],
  "past-negative": [M("しなかった", "shinakatta")],
  te: [M("して", "shite")],
});

/** 来る — kanji root 来 whose reading shifts (く/こ/き) plus ichidan-style okurigana. */
const KURU_FORMS: Readonly<Record<A2PlainForm, readonly A2Fragment[]>> = deepFreeze({
  dictionary: [L("来", "く", "ku"), M("る", "ru")],
  negative: [L("来", "こ", "ko"), M("ない", "nai")],
  past: [L("来", "き", "ki"), M("た", "ta")],
  "past-negative": [L("来", "こ", "ko"), M("なかった", "nakatta")],
  te: [L("来", "き", "ki"), M("て", "te")],
});

/** The exact 12 registered verb senses this task freezes, one per required conjugation-class exemplar. */
export const A2_VERBS: Readonly<Record<string, A2Verb>> = deepFreeze({
  "a2-sense-taberu": { senseId: "a2-sense-taberu", conjClass: "ichidan", stem: [L("食", "た", "ta"), M("べ", "be")] },
  "a2-sense-hanasu": { senseId: "a2-sense-hanasu", conjClass: "godan-su", stem: [L("話", "はな", "hana")] },
  "a2-sense-kaku": { senseId: "a2-sense-kaku", conjClass: "godan-ku", stem: [L("書", "か", "ka")] },
  "a2-sense-oyogu": { senseId: "a2-sense-oyogu", conjClass: "godan-gu", stem: [L("泳", "およ", "oyo")] },
  "a2-sense-matsu": { senseId: "a2-sense-matsu", conjClass: "godan-tsu", stem: [L("待", "ま", "ma")] },
  "a2-sense-shinu": { senseId: "a2-sense-shinu", conjClass: "godan-nu", stem: [L("死", "し", "shi")] },
  "a2-sense-asobu": { senseId: "a2-sense-asobu", conjClass: "godan-bu", stem: [L("遊", "あそ", "aso")] },
  "a2-sense-yomu": { senseId: "a2-sense-yomu", conjClass: "godan-mu", stem: [L("読", "よ", "yo")] },
  "a2-sense-kaeru": { senseId: "a2-sense-kaeru", conjClass: "godan-ru", stem: [L("帰", "かえ", "kae")] },
  "a2-sense-iku": {
    senseId: "a2-sense-iku",
    conjClass: "godan-ku",
    stem: [L("行", "い", "i")],
    tePastException: "iku",
  },
  "a2-sense-suru": { senseId: "a2-sense-suru", conjClass: "irregular-suru", stem: [] },
  "a2-sense-kuru": { senseId: "a2-sense-kuru", conjClass: "irregular-kuru", stem: [] },
});

export interface ConjugationResult {
  readonly form: A2PlainForm;
  readonly fragments: readonly A2Fragment[];
  /** Fragments' `jp` joined. */
  readonly jp: string;
  /** Fragments' `romaji` joined — fully concatenated, no spaces, no macrons. */
  readonly romaji: string;
  /** Fragments' `(reading ?? jp)` joined — the full kana reading. */
  readonly reading: string;
}

export type ConjugateResult =
  | { readonly ok: true; readonly result: ConjugationResult }
  | { readonly ok: false; readonly error: "unknown-verb" };

/**
 * Assemble one conjugation result. Every fragment is cloned before
 * assembly so the returned `fragments` array never aliases a table/stem
 * fragment object from `A2_VERBS`/`OKURIGANA`/`SURU_FORMS`/`KURU_FORMS` —
 * two calls (or a hostile mutation of one result) can never observe or
 * corrupt each other. The complete result is deep-frozen before returning.
 */
function assemble(form: A2PlainForm, fragments: readonly A2Fragment[]): ConjugationResult {
  const clonedFragments = fragments.map((fragment) => ({ ...fragment }));
  return deepFreeze({
    form,
    fragments: clonedFragments,
    jp: clonedFragments.map((f) => f.jp).join(""),
    romaji: clonedFragments.map((f) => f.romaji).join(""),
    reading: clonedFragments.map((f) => f.reading ?? f.jp).join(""),
  });
}

/**
 * Conjugate a single regular (non-irregular) class's stem into one plain
 * form. Pure and reusable: it takes the conjugation class and stem
 * fragments directly rather than a registered sense id, so a caller (e.g. a
 * test proving the `godan-u` okurigana table is correct) can exercise any
 * class's full paradigm without adding a 13th entry to `A2_VERBS`.
 */
export function conjugateClass(
  conjClass: RegularA2ConjugationClass,
  stem: readonly A2Fragment[],
  form: A2PlainForm,
  tePastException?: "iku",
): ConjugationResult {
  let tail = OKURIGANA[conjClass][form];
  if (tePastException === "iku" && (form === "past" || form === "te")) {
    tail = IKU_EXCEPTION[form];
  }
  const fragments: readonly A2Fragment[] = [...stem, M(tail.jp, tail.romaji)];
  return assemble(form, fragments);
}

/**
 * Conjugate a registered verb sense into one plain form. `senseId` selects
 * the verb entry (predicate identity still comes from the semantic-value
 * catalog per the Phase 1 contract); an unresolvable sense id is the only
 * rejection this operation reports.
 */
export function conjugate(senseId: string, form: A2PlainForm): ConjugateResult {
  const verb = A2_VERBS[senseId];
  if (!verb) return { ok: false, error: "unknown-verb" };
  if (verb.conjClass === "irregular-suru") {
    return { ok: true, result: assemble(form, SURU_FORMS[form]) };
  }
  if (verb.conjClass === "irregular-kuru") {
    return { ok: true, result: assemble(form, KURU_FORMS[form]) };
  }
  return {
    ok: true,
    result: conjugateClass(verb.conjClass, verb.stem, form, verb.tePastException),
  };
}
