/**
 * A2 semantic catalog (Phase 3 Task 4).
 *
 * Owns every *data* catalog modules 1-4 (connected-conversation,
 * plans-invitations, experiences-narratives, reasons-opinions) author
 * directly: concept ids, contexts, person roles, referents, learning-target
 * senses (case frames), semantic values (the only place Japanese/romaji
 * lexical content is authored for these modules, alongside the A2 form
 * registries in `a2/forms/*` and the contextual kanji catalog in
 * `a2/kanji/*`), sentence families, and the bilingual scenario-copy helper
 * module content files use.
 *
 * Every A2 Japanese literal here is authored in hiragana/katakana only —
 * never a kanji glyph. Kanji *rendering* (furigana staging, reveal-on-demand)
 * is an out-of-scope UI concern this task does not implement; the contextual
 * kanji catalog (`a2/kanji/a2KanjiCatalog.ts`) already schedules exactly
 * which glyph a lexeme sense is *eligible* to render as, lesson by lesson,
 * and `a2LessonBuilders.ts` wires each lesson's `kanjiExposureIds` from that
 * real schedule independently of this file's sentence text.
 *
 * The 12 Task 2 verbs' Japanese is never re-typed by hand: every value that
 * uses one derives its content from `conjugate()` (or, for suffix
 * constructions like たことがあります, from `composeA2Construction()`), then
 * keeps only the kana *reading* of each fragment (never the kanji
 * orthography `conjugate()`/`composeA2Construction()` also carry) via
 * {@link kanaFragments} — one linguistic source of truth, a pure-kana
 * learner-facing surface.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  Context,
  LearningTargetSense,
  PersonRole,
  Referent,
  SemanticArgumentRole,
  SemanticValue,
  SemanticValueTokenFragment,
  SentenceFamily,
} from "../../foundations/types";
import {
  conjugate,
  conjugateClass,
  conjugateClassMasuStem,
  conjugateMasuStem,
  type A2Fragment,
  type A2PlainForm,
  type RegularA2ConjugationClass,
} from "../forms/a2Conjugation";
import { composeA2Construction } from "../forms/composeA2Construction";
import { A2_CONSTRUCTIONS } from "../forms/a2Constructions";

/** A bilingual (EN/IT) copy pair. Never carries Japanese. */
export interface Bilingual {
  readonly en: string;
  readonly it: string;
}

// ---------------------------------------------------------------------------
// Small authoring helpers
// ---------------------------------------------------------------------------

/** One authored hiragana/katakana fragment (default "lexical" kind, "attach"
 * boundary placeholder — actual romaji spacing is derived generically from
 * `kind` + token position by the realizer, never from this stored value). */
function frag(
  jp: string,
  romaji: string,
  kind: SemanticValueTokenFragment["kind"] = "lexical",
): SemanticValueTokenFragment {
  return { jp, romaji, kind, boundaryBefore: "attach" };
}

/** A grammatical particle fragment (a full-word-boundary token, e.g. と/から/ので). */
function particleFrag(jp: string, romaji: string): SemanticValueTokenFragment {
  return frag(jp, romaji, "particle");
}

/** A bound morpheme fragment (attaches directly to the preceding stem). */
function morphFrag(jp: string, romaji: string): SemanticValueTokenFragment {
  return frag(jp, romaji, "morpheme");
}

/** A punctuation fragment (attaches directly, no leading space). */
function punctFrag(jp: string, romaji: string): SemanticValueTokenFragment {
  return frag(jp, romaji, "punctuation");
}

/**
 * Convert a conjugated/composed A2 fragment sequence (which may carry kanji
 * orthography, e.g. `conjugate("a2-sense-hanasu", "dictionary")` → 話す) into
 * pure-kana `SemanticValueTokenFragment`s by keeping each fragment's own kana
 * `reading` (falling back to `jp` when a fragment carries no separate
 * reading, i.e. it is already kana-only). `conjugate()`/`composeA2Construction()`
 * remain the single linguistic source of truth for stem/okurigana
 * correctness; this only changes which *script* the learner sees.
 */
function kanaFragments(fragments: readonly A2Fragment[]): SemanticValueTokenFragment[] {
  return fragments.map((f) => ({
    jp: f.reading ?? f.jp,
    romaji: f.romaji,
    kind: f.kind,
    boundaryBefore: f.boundaryBefore,
  }));
}

/** Conjugate a registered Task 2 verb sense to one plain form, in pure kana.
 * Throws if the sense is not registered — a programming error in this
 * catalog, never a learner-facing failure. */
function plainKana(senseId: string, form: A2PlainForm): SemanticValueTokenFragment[] {
  const result = conjugate(senseId, form);
  if (!result.ok) {
    throw new Error(`a2SemanticCatalog: conjugate() could not resolve sense "${senseId}"`);
  }
  return kanaFragments(result.result.fragments);
}

/** Derive a registered Task 2 verb sense's polite ます-stem (via
 * `conjugateMasuStem()`), in pure kana — the single linguistic source of
 * truth every ます-stem used in this catalog (食べ/tabe, 行き/iki, 話し/hanashi,
 * 泳ぎ/oyogi, ...) derives from, never a hand-typed duplicate. Throws if the
 * sense is not registered — a programming error in this catalog, never a
 * learner-facing failure. */
function masuStemKana(senseId: string): SemanticValueTokenFragment[] {
  const result = conjugateMasuStem(senseId);
  if (!result.ok) {
    throw new Error(`a2SemanticCatalog: conjugateMasuStem() could not resolve sense "${senseId}"`);
  }
  return kanaFragments(result.result.fragments);
}

/** Compose a registered `suffix` construction (currently only
 * `experience-takoto`) for a registered verb sense, in pure kana. */
function composedKana(constructionId: string, senseId: string): SemanticValueTokenFragment[] {
  const result = composeA2Construction({ constructionId, senseId });
  if (!result.ok) {
    throw new Error(
      `a2SemanticCatalog: composeA2Construction() could not resolve "${constructionId}"/"${senseId}"`,
    );
  }
  return kanaFragments(result.sentence.fragments);
}

/**
 * Compose the "experience-takoto" (たことがあります) construction for a
 * registered verb sense, then remap its two independent-word tail fragments
 * — こと ("koto", a formal noun) and あります (the standalone existential verb)
 * — from `a2Constructions.ts`'s "morpheme" tail-fragment kind to their true
 * "lexical" kind (§ Phase 3/M6-review finding I3, "semantic rōmaji
 * boundaries"). `a2Constructions.ts` models every suffix tail as bound
 * morphemes for its own Task 2 raw-concatenation contract (see
 * `composeA2Construction.test.ts`, which asserts the fully-glued
 * `ittakotogaarimasu` on purpose) — this catalog is the Task 4 semantic
 * assembly boundary where the *realized* romaji actually needs a real
 * word-boundary space before each independent word, so the remap happens
 * only here, never in `a2Constructions.ts`/`composeA2Construction.ts`
 * themselves (their own semantics/tests are intentionally untouched). が
 * stays a "particle" fragment unchanged — it already spaces correctly. */
function experienceTakotoKana(senseId: string): SemanticValueTokenFragment[] {
  const INDEPENDENT_WORD_TAIL_JP: ReadonlySet<string> = new Set(["こと", "あります"]);
  return composedKana("experience-takoto", senseId).map((fragment) =>
    fragment.kind === "morpheme" && INDEPENDENT_WORD_TAIL_JP.has(fragment.jp)
      ? { ...fragment, kind: "lexical" as const }
      : fragment,
  );
}

// ---------------------------------------------------------------------------
// Phase 3 Task 5 (M5-M8): te-form/ている/permission/prohibition/request/
// negative-request suffix constructions, and the "possibility" clause
// construction, for verbs both inside and outside the frozen Task 2
// 12-verb `A2_VERBS` registry.
// ---------------------------------------------------------------------------

/**
 * Remap the given independent-word tail fragments (matched by their exact
 * `jp` text) from "morpheme" to "lexical" — a real word-boundary space
 * before each — generalizing `experienceTakotoKana`'s established fix for
 * the identical problem (§ Phase 3/M6-review finding I3, "semantic rōmaji
 * boundaries"). `a2Constructions.ts` intentionally models every suffix tail
 * as bound morphemes for its own Task 2 raw-concatenation contract; this
 * catalog is the semantic assembly boundary where the *realized* romaji
 * needs a real space before each independent word (います/ください/いい/です/
 * いけません are all real, standalone words — never bound morphemes), so the
 * remap happens only here. A bound morpheme that genuinely is NOT an
 * independent word (て, ない, で in ないでください) is never named, so it
 * correctly keeps attaching with no space.
 */
function remapIndependentWordTails(
  fragments: readonly SemanticValueTokenFragment[],
  independentWordsJp: ReadonlySet<string>,
): SemanticValueTokenFragment[] {
  return fragments.map((fragment) =>
    fragment.kind === "morpheme" && independentWordsJp.has(fragment.jp)
      ? { ...fragment, kind: "lexical" as const }
      : fragment,
  );
}

/** The independent-word tail fragments (by jp text) each M5-M8 suffix
 * construction's own `a2Constructions.ts` tail bakes as "morpheme" but
 * which are real, standalone words needing their own romaji space here.
 * `sequence-te`'s empty tail needs no entry (nothing to remap). */
const INDEPENDENT_WORD_TAIL_JP_BY_CONSTRUCTION: Readonly<Record<string, ReadonlySet<string>>> = {
  "ongoing-teiru": new Set(["います"]),
  "request-tekudasai": new Set(["ください"]),
  "permission-temoii": new Set(["いい", "です"]),
  "prohibition-tewaikenai": new Set(["いけません"]),
  "request-negative": new Set(["ください"]),
};

/** Compose a registered Task 2 verb sense through one of the M5-M8 suffix
 * constructions (`composeA2Construction`), with the construction's own
 * independent-word tail fragments remapped for natural romaji boundaries
 * (see {@link remapIndependentWordTails}). */
function suffixKana(constructionId: string, senseId: string): SemanticValueTokenFragment[] {
  const independentWords = INDEPENDENT_WORD_TAIL_JP_BY_CONSTRUCTION[constructionId] ?? new Set<string>();
  return remapIndependentWordTails(composedKana(constructionId, senseId), independentWords);
}

/**
 * A verb not among the Task 2 12-registered conjugation-class exemplars
 * (`a2Conjugation.ts`'s `A2_VERBS`), described by its own conjugation class
 * and kana stem — every M5-M8 kanji-linked verb this module introduces
 * (起きる/寝る/使う/作る/洗う/終わる/始まる/働く/入る/止まる/消す/座る/立つ/飲む).
 */
interface NewVerb {
  readonly conjClass: RegularA2ConjugationClass;
  readonly stem: readonly A2Fragment[];
}

/** A kana-only lexical root fragment (no separate kanji orthography is ever
 * authored in this catalog — see the file-level docstring). */
function newVerbFrag(jp: string, romaji: string): A2Fragment {
  return { jp, romaji, kind: "lexical", boundaryBefore: "attach" };
}

/** Conjugate a new (non-registered) verb to one plain form via
 * `conjugateClass()` — the exact same class-aware regular-okurigana engine
 * `conjugate()` itself delegates to for every registered verb — so a verb
 * outside the frozen 12-verb table is never hand-typed from scratch. */
function newVerbPlainKana(verb: NewVerb, form: A2PlainForm): SemanticValueTokenFragment[] {
  return kanaFragments(conjugateClass(verb.conjClass, verb.stem, form).fragments);
}

/** Derive a new (non-registered) verb's polite ます-stem via
 * `conjugateClassMasuStem()` — the same single linguistic source of truth
 * `conjugateMasuStem()` itself delegates to for every registered verb. */
function newVerbMasuStemKana(verb: NewVerb): SemanticValueTokenFragment[] {
  return kanaFragments(conjugateClassMasuStem(verb.conjClass, verb.stem).fragments);
}

/** Append ます to a masu-stem fragment sequence (either a registered verb's
 * `masuStemKana(...)` or a new verb's `newVerbMasuStemKana(...)`) — the
 * common final clause of many M5-M8 two-clause te-sequence whole-clause
 * bakes (§ mirrors the connector-utterance ...ます pattern already
 * established in M1-M4). */
function masuForm(stemFragments: readonly SemanticValueTokenFragment[]): SemanticValueTokenFragment[] {
  return [...stemFragments, morphFrag("ます", "masu")];
}

/**
 * Compose a new (non-registered) verb through one of the M5-M8 suffix
 * constructions: conjugate its own (conjClass, stem) to the construction's
 * exact plain base via `conjugateClass()` — never a hand-typed guess — then
 * append the construction's own real tail fragments from `A2_CONSTRUCTIONS`
 * (never re-typed), with the same independent-word remap `suffixKana` uses
 * for registered verbs.
 */
function newVerbSuffixKana(constructionId: string, verb: NewVerb): SemanticValueTokenFragment[] {
  const construction = A2_CONSTRUCTIONS[constructionId];
  if (!construction || construction.kind !== "suffix" || construction.base === undefined || construction.tail === undefined) {
    throw new Error(`a2SemanticCatalog: "${constructionId}" is not a registered suffix construction`);
  }
  const base = conjugateClass(verb.conjClass, verb.stem, construction.base);
  const fragments: A2Fragment[] = [...base.fragments, ...construction.tail.map((fragment) => ({ ...fragment }))];
  const independentWords = INDEPENDENT_WORD_TAIL_JP_BY_CONSTRUCTION[constructionId] ?? new Set<string>();
  return remapIndependentWordTails(kanaFragments(fragments), independentWords);
}

/**
 * "possibility" (M7): `a2Constructions.ts`'s own "possibility" entry is
 * `kind: "clause"` — like M1-M4's intentions-plans/reason-kara/reason-node/
 * opinion-toomou/connectors, it combines a whole clause rather than
 * attaching a suffix to one verb, so it is realized as a hand-composed
 * sentence-family construction here, never through `composeA2Construction`
 * (which only ever accepts `kind: "suffix"`). Mirrors
 * `experienceTakotoKana`'s こと+が+X tail shape exactly: a real
 * word-boundary space before each independent word (こと and できます/
 * できません are real, standalone words); が stays a "particle" fragment
 * unchanged (it already spaces correctly).
 */
function possibilityKana(
  dictionaryFormFragments: readonly SemanticValueTokenFragment[],
  polarity: "affirmative" | "negative",
): SemanticValueTokenFragment[] {
  return [
    ...dictionaryFormFragments,
    frag("こと", "koto"),
    particleFrag("が", "ga"),
    frag(polarity === "affirmative" ? "できます" : "できません", polarity === "affirmative" ? "dekimasu" : "dekimasen"),
  ];
}

// ---------------------------------------------------------------------------
// Concept IDs (one per M1-M4 grammar construction; families declare exactly
// which of these they require)
// ---------------------------------------------------------------------------

export const A2_CONCEPT_BACKCHANNEL_FOLLOWUP = "a2-concept-backchannel-followup";
export const A2_CONCEPT_CONNECTORS = "a2-concept-connectors";
export const A2_CONCEPT_CLARIFY_REPEAT = "a2-concept-clarify-repeat";
export const A2_CONCEPT_RECOGNIZE_PLAIN_FORMS = "a2-concept-recognize-plain-forms";
export const A2_CONCEPT_INTENTIONS_YOTEI = "a2-concept-intentions-yotei";
export const A2_CONCEPT_INTENTIONS_TSUMORI = "a2-concept-intentions-tsumori";
export const A2_CONCEPT_INVITE_ACCEPT_DECLINE = "a2-concept-invite-accept-decline";
export const A2_CONCEPT_ARRANGE_MEETING = "a2-concept-arrange-meeting";
export const A2_CONCEPT_EXPERIENCE_TAKOTO = "a2-concept-experience-takoto";
export const A2_CONCEPT_NARRATE_ORDER = "a2-concept-narrate-order";
export const A2_CONCEPT_REASON_KARA = "a2-concept-reason-kara";
export const A2_CONCEPT_REASON_NODE = "a2-concept-reason-node";
export const A2_CONCEPT_OPINION_TOOMOU = "a2-concept-opinion-toomou";
export const A2_CONCEPT_AGREE_DISAGREE = "a2-concept-agree-disagree";

/** Every A2 M1-M4 concept id, used as the module tests' available-concept universe. */
export const A2_M1_M4_CONCEPT_IDS: readonly string[] = deepFreeze([
  A2_CONCEPT_BACKCHANNEL_FOLLOWUP,
  A2_CONCEPT_CONNECTORS,
  A2_CONCEPT_CLARIFY_REPEAT,
  A2_CONCEPT_RECOGNIZE_PLAIN_FORMS,
  A2_CONCEPT_INTENTIONS_YOTEI,
  A2_CONCEPT_INTENTIONS_TSUMORI,
  A2_CONCEPT_INVITE_ACCEPT_DECLINE,
  A2_CONCEPT_ARRANGE_MEETING,
  A2_CONCEPT_EXPERIENCE_TAKOTO,
  A2_CONCEPT_NARRATE_ORDER,
  A2_CONCEPT_REASON_KARA,
  A2_CONCEPT_REASON_NODE,
  A2_CONCEPT_OPINION_TOOMOU,
  A2_CONCEPT_AGREE_DISAGREE,
]);

// --- Phase 3 Task 5 (M5-M8) concept ids ---
export const A2_CONCEPT_SEQUENCE_TE = "a2-concept-sequence-te";
export const A2_CONCEPT_ONGOING_TEIRU = "a2-concept-ongoing-teiru";
export const A2_CONCEPT_PERMISSION_TEMOII = "a2-concept-permission-temoii";
export const A2_CONCEPT_PROHIBITION_TEWAIKENAI = "a2-concept-prohibition-tewaikenai";
export const A2_CONCEPT_REQUEST_TEKUDASAI = "a2-concept-request-tekudasai";
export const A2_CONCEPT_NEGATIVE_REQUEST = "a2-concept-negative-request";
export const A2_CONCEPT_POSSIBILITY = "a2-concept-possibility";
export const A2_CONCEPT_ASK_FOR_HELP = "a2-concept-ask-for-help";
export const A2_CONCEPT_DESCRIBE_FACILITY = "a2-concept-describe-facility";
export const A2_CONCEPT_CONFIRM_UNDERSTANDING = "a2-concept-confirm-understanding";
export const A2_CONCEPT_RECOUNT_EXPERIENCE = "a2-concept-recount-experience";

/** Every A2 M5-M8 concept id, used as the module tests' available-concept universe. */
export const A2_M5_M8_CONCEPT_IDS: readonly string[] = deepFreeze([
  A2_CONCEPT_SEQUENCE_TE,
  A2_CONCEPT_ONGOING_TEIRU,
  A2_CONCEPT_PERMISSION_TEMOII,
  A2_CONCEPT_PROHIBITION_TEWAIKENAI,
  A2_CONCEPT_REQUEST_TEKUDASAI,
  A2_CONCEPT_NEGATIVE_REQUEST,
  A2_CONCEPT_POSSIBILITY,
  A2_CONCEPT_ASK_FOR_HELP,
  A2_CONCEPT_DESCRIBE_FACILITY,
  A2_CONCEPT_CONFIRM_UNDERSTANDING,
  A2_CONCEPT_RECOUNT_EXPERIENCE,
]);

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

export const a2Contexts: readonly Context[] = deepFreeze([
  { id: "a2-context-conversation", labelCopyId: "a2-context-conversation-label" },
  { id: "a2-context-among-friends", labelCopyId: "a2-context-among-friends-label" },
  { id: "a2-context-workplace", labelCopyId: "a2-context-workplace-label" },
  { id: "a2-context-cafe", labelCopyId: "a2-context-cafe-label" },
  { id: "a2-context-outing", labelCopyId: "a2-context-outing-label" },
  { id: "a2-context-plans", labelCopyId: "a2-context-plans-label" },
  { id: "a2-context-experiences", labelCopyId: "a2-context-experiences-label" },
  { id: "a2-context-reasons", labelCopyId: "a2-context-reasons-label" },
  // --- Phase 3 Task 5 (M5-M8) — ids fixed by the frozen Task 3 kanji
  // catalog, which already hard-codes these exact contextIds. ---
  { id: "a2-context-routines", labelCopyId: "a2-context-routines-label" },
  { id: "a2-context-rules", labelCopyId: "a2-context-rules-label" },
  { id: "a2-context-neighborhood", labelCopyId: "a2-context-neighborhood-label" },
  { id: "a2-context-restaurant", labelCopyId: "a2-context-restaurant-label" },
]);

// ---------------------------------------------------------------------------
// Person roles
// ---------------------------------------------------------------------------

// Canonical persona gender for the A2 M1-4 release (mirrors the A1 precedent
// of a single, fixed source of truth for Italian gender agreement): Emi is
// feminine, Sora is masculine. Generic roles (learner, teacher, colleague,
// friend, clerk) intentionally omit `gender` — the course never establishes
// one for them.
export const a2PersonRoles: readonly PersonRole[] = deepFreeze([
  { id: "a2-role-learner", kind: "learner", labelCopyId: "a2-role-learner-label" },
  { id: "a2-role-emi", kind: "persona", labelCopyId: "a2-role-emi-label", gender: "feminine" },
  { id: "a2-role-sora", kind: "persona", labelCopyId: "a2-role-sora-label", gender: "masculine" },
  { id: "a2-role-teacher", kind: "social", labelCopyId: "a2-role-teacher-label" },
  { id: "a2-role-colleague", kind: "social", labelCopyId: "a2-role-colleague-label" },
  { id: "a2-role-friend", kind: "social", labelCopyId: "a2-role-friend-label" },
  { id: "a2-role-clerk", kind: "unnamed", labelCopyId: "a2-role-clerk-label" },
]);

// ---------------------------------------------------------------------------
// Referents
// ---------------------------------------------------------------------------

export const a2Referents: readonly Referent[] = deepFreeze([
  { id: "a2-referent-self", personRoleId: "a2-role-learner", animacy: "animate", labelCopyId: "a2-referent-self-label" },
  { id: "a2-referent-emi", personRoleId: "a2-role-emi", animacy: "animate", labelCopyId: "a2-referent-emi-label" },
  { id: "a2-referent-sora", personRoleId: "a2-role-sora", animacy: "animate", labelCopyId: "a2-referent-sora-label" },
  { id: "a2-referent-teacher", personRoleId: "a2-role-teacher", animacy: "animate", labelCopyId: "a2-referent-teacher-label" },
  { id: "a2-referent-colleague", personRoleId: "a2-role-colleague", animacy: "animate", labelCopyId: "a2-referent-colleague-label" },
  { id: "a2-referent-friend", personRoleId: "a2-role-friend", animacy: "animate", labelCopyId: "a2-referent-friend-label" },
  { id: "a2-referent-clerk", personRoleId: "a2-role-clerk", animacy: "animate", labelCopyId: "a2-referent-clerk-label" },
]);

// ---------------------------------------------------------------------------
// Learning target senses (case frames)
// ---------------------------------------------------------------------------
// Reuses the registered Task 2 verb senses (`a2-sense-hanasu`, `a2-sense-iku`,
// `a2-sense-oyogu`, `a2-sense-matsu`, `a2-sense-taberu`) by their exact ids —
// they are not redeclared, only referenced — and adds the new senses M1-M4
// vocabulary needs that the 12-verb conjugation table does not cover.

const A2_LEARNING_TARGET_SENSES_M1_M4: readonly LearningTargetSense[] = [
  // --- reused Task 2 registered verb senses (own frames declared here; the
  // conjugation table in a2Conjugation.ts owns only their morphology) ---
  { id: "a2-sense-hanasu", lexemeId: "a2-lexeme-hanasu", learningUse: "productive", semanticFrameId: "a2-frame-talk-companion", predicate: "talk", argumentRoles: ["agent", "companion"], argumentParticleByRole: {} },
  { id: "a2-sense-iku", lexemeId: "a2-lexeme-iku", learningUse: "productive", semanticFrameId: "a2-frame-go", predicate: "go", argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "ni" } },
  { id: "a2-sense-oyogu", lexemeId: "a2-lexeme-oyogu", learningUse: "productive", semanticFrameId: "a2-frame-swim", predicate: "swim", argumentRoles: ["agent"], argumentParticleByRole: {} },
  { id: "a2-sense-matsu", lexemeId: "a2-lexeme-matsu", learningUse: "productive", semanticFrameId: "a2-frame-wait", predicate: "wait", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a2-sense-taberu", lexemeId: "a2-lexeme-taberu", learningUse: "productive", semanticFrameId: "a2-frame-eat", predicate: "eat", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a2-sense-asobu", lexemeId: "a2-lexeme-asobu", learningUse: "productive", semanticFrameId: "a2-frame-play", predicate: "play", argumentRoles: ["agent"], argumentParticleByRole: {} },
  { id: "a2-sense-yomu", lexemeId: "a2-lexeme-yomu", learningUse: "productive", semanticFrameId: "a2-frame-read", predicate: "read", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a2-sense-kaeru", lexemeId: "a2-lexeme-kaeru", learningUse: "productive", semanticFrameId: "a2-frame-return", predicate: "return", argumentRoles: ["agent"], argumentParticleByRole: {} },

  // --- M1 connected-conversation: new senses ---
  { id: "a2-sense-kiku", lexemeId: "a2-lexeme-kiku", learningUse: "productive", semanticFrameId: "a2-frame-ask", predicate: "ask", argumentRoles: ["theme"], argumentParticleByRole: {} },
  { id: "a2-sense-iu", lexemeId: "a2-lexeme-iu", learningUse: "productive", semanticFrameId: "a2-frame-say", predicate: "say", argumentRoles: ["theme"], argumentParticleByRole: {} },
  { id: "a2-sense-omou-lex", lexemeId: "a2-lexeme-omou", learningUse: "productive", semanticFrameId: "a2-frame-think-lexicalized", predicate: "think", argumentRoles: ["theme"], argumentParticleByRole: {} },
  // Recognition-only senses for cc4's bare `subject + plain-form predicate`
  // family (no location/theme slot); Japanese content still derives from
  // `conjugate()` against the real registered verb sense (see `plainKana`).
  { id: "a2-sense-plain-recog-iku", lexemeId: "a2-lexeme-plain-recog-iku", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-iku", predicate: "plain-recognize-go", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-taberu", lexemeId: "a2-lexeme-plain-recog-taberu", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-taberu", predicate: "plain-recognize-eat", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-hanasu", lexemeId: "a2-lexeme-plain-recog-hanasu", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-hanasu", predicate: "plain-recognize-talk", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-matsu", lexemeId: "a2-lexeme-plain-recog-matsu", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-matsu", predicate: "plain-recognize-wait", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-oyogu", lexemeId: "a2-lexeme-plain-recog-oyogu", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-oyogu", predicate: "plain-recognize-swim", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-asobu", lexemeId: "a2-lexeme-plain-recog-asobu", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-asobu", predicate: "plain-recognize-play", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-yomu", lexemeId: "a2-lexeme-plain-recog-yomu", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-yomu", predicate: "plain-recognize-read", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-kaeru", lexemeId: "a2-lexeme-plain-recog-kaeru", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-kaeru", predicate: "plain-recognize-return", argumentRoles: [], argumentParticleByRole: {} },

  // --- M2 plans-invitations: new senses ---
  { id: "a2-sense-au", lexemeId: "a2-lexeme-au", learningUse: "productive", semanticFrameId: "a2-frame-meet", predicate: "meet", argumentRoles: ["theme"], argumentParticleByRole: {} },

  // --- M3 experiences-narratives: new senses ---
  { id: "a2-sense-noboru", lexemeId: "a2-lexeme-noboru", learningUse: "productive", semanticFrameId: "a2-frame-climb", predicate: "climb", argumentRoles: ["agent"], argumentParticleByRole: {} },
  { id: "a2-sense-tanoshii", lexemeId: "a2-lexeme-tanoshii", learningUse: "productive", semanticFrameId: "a2-frame-fun", predicate: "fun", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "i" },
  { id: "a2-sense-yuumei", lexemeId: "a2-lexeme-yuumei", learningUse: "productive", semanticFrameId: "a2-frame-famous", predicate: "famous", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "na" },
  { id: "a2-sense-experience-lex", lexemeId: "a2-lexeme-experience", learningUse: "productive", semanticFrameId: "a2-frame-experience", predicate: "experience", argumentRoles: [], argumentParticleByRole: {} },
  // Dedicated たことがあります (experience-takoto) predicate senses: the bare
  // invariant family has no location/theme slot, so — exactly like M1's
  // `a2-sense-plain-recog-*` pattern — these decouple the frame from the
  // *real* registered verb sense (which legitimately declares "location"/
  // "theme" for its normal governed use) while still deriving the Japanese
  // fragments from that same real sense via `composedKana(...)` below (one
  // linguistic source of truth, two frames).
  { id: "a2-sense-exp-itta", lexemeId: "a2-lexeme-exp-itta", learningUse: "productive", semanticFrameId: "a2-frame-exp-itta", predicate: "experience-go", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-exp-tabeta", lexemeId: "a2-lexeme-exp-tabeta", learningUse: "productive", semanticFrameId: "a2-frame-exp-tabeta", predicate: "experience-eat", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-exp-matta", lexemeId: "a2-lexeme-exp-matta", learningUse: "productive", semanticFrameId: "a2-frame-exp-matta", predicate: "experience-wait", argumentRoles: [], argumentParticleByRole: {} },
  // Dedicated plain-past-adjective (recognize-plain-forms support) senses:
  // bare stem+past ending, no です, decoupled from the real adjective sense's
  // "topic" frame for the same slotless-family reason as above.
  { id: "a2-sense-plain-recog-tanoshii", lexemeId: "a2-lexeme-plain-recog-tanoshii", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-tanoshii", predicate: "plain-recognize-fun", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-yuumei", lexemeId: "a2-lexeme-plain-recog-yuumei", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-yuumei", predicate: "plain-recognize-famous", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-warui", lexemeId: "a2-lexeme-plain-recog-warui", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-warui", predicate: "plain-recognize-bad", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-recog-suki", lexemeId: "a2-lexeme-plain-recog-suki", learningUse: "receptive", semanticFrameId: "a2-frame-plain-recog-suki", predicate: "plain-recognize-like", argumentRoles: [], argumentParticleByRole: {} },

  // --- M4 reasons-opinions: new senses ---
  { id: "a2-sense-suki", lexemeId: "a2-lexeme-suki", learningUse: "productive", semanticFrameId: "a2-frame-like", predicate: "like", argumentRoles: ["topic", "theme"], argumentParticleByRole: {}, adjectiveClass: "na" },
  { id: "a2-sense-warui", lexemeId: "a2-lexeme-warui", learningUse: "productive", semanticFrameId: "a2-frame-bad", predicate: "bad", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "i" },
  { id: "a2-sense-kangaeru", lexemeId: "a2-lexeme-kangaeru", learningUse: "productive", semanticFrameId: "a2-frame-consider", predicate: "consider", argumentRoles: ["theme"], argumentParticleByRole: {} },

  // --- per-utterance senses (Phase 3 Task 4 fix: each distinct baked
  // utterance gets its own sense id, never a shared bucket, so per-lesson
  // predicate diversity is measured against real, distinct predicates) ---
  { id: "a2-sense-connector-test-ganbatta", lexemeId: "a2-lexeme-connector-test-ganbatta", learningUse: "productive", semanticFrameId: "a2-frame-connector-test-ganbatta", predicate: "connect-test-effort", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-morning-rain-clear", lexemeId: "a2-lexeme-connector-morning-rain-clear", learningUse: "productive", semanticFrameId: "a2-frame-connector-morning-rain-clear", predicate: "connect-weather-change", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-work-then-home", lexemeId: "a2-lexeme-connector-work-then-home", learningUse: "productive", semanticFrameId: "a2-frame-connector-work-then-home", predicate: "connect-work-home", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-friend-then-eat", lexemeId: "a2-lexeme-connector-friend-then-eat", learningUse: "productive", semanticFrameId: "a2-frame-connector-friend-then-eat", predicate: "connect-friend-meal", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-book-not-interesting", lexemeId: "a2-lexeme-connector-book-not-interesting", learningUse: "productive", semanticFrameId: "a2-frame-connector-book-not-interesting", predicate: "connect-book-opinion", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-rain-still-walked", lexemeId: "a2-lexeme-connector-rain-still-walked", learningUse: "productive", semanticFrameId: "a2-frame-connector-rain-still-walked", predicate: "connect-rain-walk", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-tv-then-bath", lexemeId: "a2-lexeme-connector-tv-then-bath", learningUse: "productive", semanticFrameId: "a2-frame-connector-tv-then-bath", predicate: "connect-tv-bath", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-tired-but-happy", lexemeId: "a2-lexeme-connector-tired-but-happy", learningUse: "productive", semanticFrameId: "a2-frame-connector-tired-but-happy", predicate: "connect-tired-happy", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-kikoemasen", lexemeId: "a2-lexeme-clarify-kikoemasen", learningUse: "productive", semanticFrameId: "a2-frame-clarify-kikoemasen", predicate: "clarify-couldnt-hear", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-ookiikoe", lexemeId: "a2-lexeme-clarify-ookiikoe", learningUse: "productive", semanticFrameId: "a2-frame-clarify-ookiikoe", predicate: "clarify-louder", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-douiuimi", lexemeId: "a2-lexeme-clarify-douiuimi", learningUse: "productive", semanticFrameId: "a2-frame-clarify-douiuimi", predicate: "clarify-what-mean", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-kanji-yomenai", lexemeId: "a2-lexeme-clarify-kanji-yomenai", learningUse: "productive", semanticFrameId: "a2-frame-clarify-kanji-yomenai", predicate: "clarify-cant-read-kanji", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-eigode", lexemeId: "a2-lexeme-clarify-eigode", learningUse: "productive", semanticFrameId: "a2-frame-clarify-eigode", predicate: "clarify-in-english", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-muzukashii", lexemeId: "a2-lexeme-clarify-muzukashii", learningUse: "productive", semanticFrameId: "a2-frame-clarify-muzukashii", predicate: "clarify-difficult", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-wakariyasuku", lexemeId: "a2-lexeme-clarify-wakariyasuku", learningUse: "productive", semanticFrameId: "a2-frame-clarify-wakariyasuku", predicate: "clarify-make-clear", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-nanto", lexemeId: "a2-lexeme-clarify-nanto", learningUse: "productive", semanticFrameId: "a2-frame-clarify-nanto", predicate: "clarify-what-did-you-say", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-agree-sansei", lexemeId: "a2-lexeme-agree-sansei", learningUse: "productive", semanticFrameId: "a2-frame-agree-sansei", predicate: "agree-in-favor", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-agree-soudesune", lexemeId: "a2-lexeme-agree-soudesune", learningUse: "productive", semanticFrameId: "a2-frame-agree-soudesune", predicate: "agree-soudesune", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-agree-watashimo", lexemeId: "a2-lexeme-agree-watashimo", learningUse: "productive", semanticFrameId: "a2-frame-agree-watashimo", predicate: "agree-me-too", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-arrange-cafe", lexemeId: "a2-lexeme-arrange-cafe", learningUse: "productive", semanticFrameId: "a2-frame-arrange-cafe", predicate: "arrange-cafe", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-arrange-eki", lexemeId: "a2-lexeme-arrange-eki", learningUse: "productive", semanticFrameId: "a2-frame-arrange-eki", predicate: "arrange-station", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-arrange-time-check", lexemeId: "a2-lexeme-arrange-time-check", learningUse: "productive", semanticFrameId: "a2-frame-arrange-time-check", predicate: "arrange-time-check", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-imikotoba", lexemeId: "a2-lexeme-clarify-imikotoba", learningUse: "productive", semanticFrameId: "a2-frame-clarify-imikotoba", predicate: "clarify-word-meaning", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-mouichido", lexemeId: "a2-lexeme-clarify-mouichido", learningUse: "productive", semanticFrameId: "a2-frame-clarify-mouichido", predicate: "clarify-again", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-wakarimasen", lexemeId: "a2-lexeme-clarify-wakarimasen", learningUse: "productive", semanticFrameId: "a2-frame-clarify-wakarimasen", predicate: "clarify-dont-understand", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-wakarimashita", lexemeId: "a2-lexeme-clarify-wakarimashita", learningUse: "productive", semanticFrameId: "a2-frame-clarify-wakarimashita", predicate: "clarify-understood", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-clarify-yukkuri", lexemeId: "a2-lexeme-clarify-yukkuri", learningUse: "productive", semanticFrameId: "a2-frame-clarify-yukkuri", predicate: "clarify-slowly", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-ame-demo-dekakeru", lexemeId: "a2-lexeme-connector-ame-demo-dekakeru", learningUse: "productive", semanticFrameId: "a2-frame-connector-ame-demo-dekakeru", predicate: "connect-weather-outing", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-benkyou-sorekara-neru", lexemeId: "a2-lexeme-connector-benkyou-sorekara-neru", learningUse: "productive", semanticFrameId: "a2-frame-connector-benkyou-sorekara-neru", predicate: "connect-study-sleep", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-isogashii-demo-ganbaru", lexemeId: "a2-lexeme-connector-isogashii-demo-ganbaru", learningUse: "productive", semanticFrameId: "a2-frame-connector-isogashii-demo-ganbaru", predicate: "connect-busy-fun", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-samui-demo-genki", lexemeId: "a2-lexeme-connector-samui-demo-genki", learningUse: "productive", semanticFrameId: "a2-frame-connector-samui-demo-genki", predicate: "connect-cold-genki", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-connector-shukudai-sorekara-terebi", lexemeId: "a2-lexeme-connector-shukudai-sorekara-terebi", learningUse: "productive", semanticFrameId: "a2-frame-connector-shukudai-sorekara-terebi", predicate: "connect-homework-tv", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-disagree-chigau", lexemeId: "a2-lexeme-disagree-chigau", learningUse: "productive", semanticFrameId: "a2-frame-disagree-chigau", predicate: "disagree-different", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-disagree-omoimasen", lexemeId: "a2-lexeme-disagree-omoimasen", learningUse: "productive", semanticFrameId: "a2-frame-disagree-omoimasen", predicate: "disagree-dont-think-so", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-followup-doushite", lexemeId: "a2-lexeme-followup-doushite", learningUse: "productive", semanticFrameId: "a2-frame-followup-doushite", predicate: "followup-doushite", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-followup-sonoato", lexemeId: "a2-lexeme-followup-sonoato", learningUse: "productive", semanticFrameId: "a2-frame-followup-sonoato", predicate: "followup-sonoato", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-invite-eiga", lexemeId: "a2-lexeme-invite-eiga", learningUse: "productive", semanticFrameId: "a2-frame-invite-eiga", predicate: "invite-movie", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-invite-oyogu", lexemeId: "a2-lexeme-invite-oyogu", learningUse: "productive", semanticFrameId: "a2-frame-invite-oyogu", predicate: "invite-swim", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-invite-shokuji", lexemeId: "a2-lexeme-invite-shokuji", learningUse: "productive", semanticFrameId: "a2-frame-invite-shokuji", predicate: "invite-meal", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-isogashii-tsukareta", lexemeId: "a2-lexeme-kara-isogashii-tsukareta", learningUse: "productive", semanticFrameId: "a2-frame-kara-isogashii-tsukareta", predicate: "reason-busy-tired", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-shiken-benkyou", lexemeId: "a2-lexeme-kara-shiken-benkyou", learningUse: "productive", semanticFrameId: "a2-frame-kara-shiken-benkyou", predicate: "reason-exam-study", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-suki-benkyou", lexemeId: "a2-lexeme-kara-suki-benkyou", learningUse: "productive", semanticFrameId: "a2-frame-kara-suki-benkyou", predicate: "reason-like-study", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-narrate-asagohan-gakkou", lexemeId: "a2-lexeme-narrate-asagohan-gakkou", learningUse: "productive", semanticFrameId: "a2-frame-narrate-asagohan-gakkou", predicate: "narrate-breakfast-school", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-narrate-kyouto-tanoshikatta", lexemeId: "a2-lexeme-narrate-kyouto-tanoshikatta", learningUse: "productive", semanticFrameId: "a2-frame-narrate-kyouto-tanoshikatta", predicate: "narrate-kyoto-fun", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-narrate-matsu-tabeta", lexemeId: "a2-lexeme-narrate-matsu-tabeta", learningUse: "productive", semanticFrameId: "a2-frame-narrate-matsu-tabeta", predicate: "narrate-wait-eat", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-narrate-umi-yama", lexemeId: "a2-lexeme-narrate-umi-yama", learningUse: "productive", semanticFrameId: "a2-frame-narrate-umi-yama", predicate: "narrate-sea-mountain", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-ame-ie", lexemeId: "a2-lexeme-node-ame-ie", learningUse: "productive", semanticFrameId: "a2-frame-node-ame-ie", predicate: "reason-rain-home", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-densha-kaigi", lexemeId: "a2-lexeme-node-densha-kaigi", learningUse: "productive", semanticFrameId: "a2-frame-node-densha-kaigi", predicate: "reason-train-meeting", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-isogashikatta-dekakenakatta", lexemeId: "a2-lexeme-node-isogashikatta-dekakenakatta", learningUse: "productive", semanticFrameId: "a2-frame-node-isogashikatta-dekakenakatta", predicate: "reason-was-busy-stayed", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-isogashii", lexemeId: "a2-lexeme-plain-isogashii", learningUse: "receptive", semanticFrameId: "a2-frame-plain-isogashii", predicate: "plain-busy", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-plain-isogashikunai", lexemeId: "a2-lexeme-plain-isogashikunai", learningUse: "receptive", semanticFrameId: "a2-frame-plain-isogashikunai", predicate: "plain-not-busy", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-react-honto", lexemeId: "a2-lexeme-react-honto", learningUse: "productive", semanticFrameId: "a2-frame-react-honto", predicate: "react-honto", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-react-soka", lexemeId: "a2-lexeme-react-soka", learningUse: "productive", semanticFrameId: "a2-frame-react-soka", predicate: "react-soka", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-react-taihen", lexemeId: "a2-lexeme-react-taihen", learningUse: "productive", semanticFrameId: "a2-frame-react-taihen", predicate: "react-taihen", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-react-yokatta", lexemeId: "a2-lexeme-react-yokatta", learningUse: "productive", semanticFrameId: "a2-frame-react-yokatta", predicate: "react-yokatta", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-respond-accept", lexemeId: "a2-lexeme-respond-accept", learningUse: "productive", semanticFrameId: "a2-frame-respond-accept", predicate: "respond-accept", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-respond-accept-happy", lexemeId: "a2-lexeme-respond-accept-happy", learningUse: "productive", semanticFrameId: "a2-frame-respond-accept-happy", predicate: "respond-accept-happy", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-respond-decline", lexemeId: "a2-lexeme-respond-decline", learningUse: "productive", semanticFrameId: "a2-frame-respond-decline", predicate: "respond-decline", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-toomou-benkyou-taihen", lexemeId: "a2-lexeme-toomou-benkyou-taihen", learningUse: "productive", semanticFrameId: "a2-frame-toomou-benkyou-taihen", predicate: "opinion-study-tough", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-toomou-kore-ii", lexemeId: "a2-lexeme-toomou-kore-ii", learningUse: "productive", semanticFrameId: "a2-frame-toomou-kore-ii", predicate: "opinion-this-good", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-toomou-sora-isogashii", lexemeId: "a2-lexeme-toomou-sora-isogashii", learningUse: "productive", semanticFrameId: "a2-frame-toomou-sora-isogashii", predicate: "opinion-sora-busy", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-toomou-yokunai", lexemeId: "a2-lexeme-toomou-yokunai", learningUse: "productive", semanticFrameId: "a2-frame-toomou-yokunai", predicate: "opinion-not-good", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-iku-raigetsu", lexemeId: "a2-lexeme-tsumori-iku-raigetsu", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-iku-raigetsu", predicate: "intend-go-next-month", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-oyogu-shuumatsu", lexemeId: "a2-lexeme-tsumori-oyogu-shuumatsu", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-oyogu-shuumatsu", predicate: "intend-swim-weekend", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-taberu-shokuji", lexemeId: "a2-lexeme-tsumori-taberu-shokuji", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-taberu-shokuji", predicate: "intend-eat-meal", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-au-doyoubi", lexemeId: "a2-lexeme-yotei-au-doyoubi", learningUse: "productive", semanticFrameId: "a2-frame-yotei-au-doyoubi", predicate: "plan-meet-saturday", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-iku-kyouto", lexemeId: "a2-lexeme-yotei-iku-kyouto", learningUse: "productive", semanticFrameId: "a2-frame-yotei-iku-kyouto", predicate: "plan-go-kyoto", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-matsu-raishuu", lexemeId: "a2-lexeme-yotei-matsu-raishuu", learningUse: "productive", semanticFrameId: "a2-frame-yotei-matsu-raishuu", predicate: "plan-wait-next-week", argumentRoles: [], argumentParticleByRole: {} },

  // --- auto-derived per-utterance senses (Phase 3 Task 4 M2-M4 batch) ---
  { id: "a2-sense-arrange-basho-henkou", lexemeId: "a2-lexeme-arrange-basho-henkou", learningUse: "productive", semanticFrameId: "a2-frame-arrange-basho-henkou", predicate: "arrange_basho_henkou", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-arrange-denwa", lexemeId: "a2-lexeme-arrange-denwa", learningUse: "productive", semanticFrameId: "a2-frame-arrange-denwa", predicate: "arrange_denwa", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-arrange-doyoubi-11ji", lexemeId: "a2-lexeme-arrange-doyoubi-11ji", learningUse: "productive", semanticFrameId: "a2-frame-arrange-doyoubi-11ji", predicate: "arrange_doyoubi_11ji", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-arrange-eigakan", lexemeId: "a2-lexeme-arrange-eigakan", learningUse: "productive", semanticFrameId: "a2-frame-arrange-eigakan", predicate: "arrange_eigakan", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-arrange-gakkou-mae", lexemeId: "a2-lexeme-arrange-gakkou-mae", learningUse: "productive", semanticFrameId: "a2-frame-arrange-gakkou-mae", predicate: "arrange_gakkou_mae", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-arrange-osoku-narisou", lexemeId: "a2-lexeme-arrange-osoku-narisou", learningUse: "productive", semanticFrameId: "a2-frame-arrange-osoku-narisou", predicate: "arrange_osoku_narisou", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-arrange-place-check", lexemeId: "a2-lexeme-arrange-place-check", learningUse: "productive", semanticFrameId: "a2-frame-arrange-place-check", predicate: "arrange_place_check", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-invite-hon", lexemeId: "a2-lexeme-invite-hon", learningUse: "productive", semanticFrameId: "a2-frame-invite-hon", predicate: "invite_hon", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-invite-tomodachi-issho", lexemeId: "a2-lexeme-invite-tomodachi-issho", learningUse: "productive", semanticFrameId: "a2-frame-invite-tomodachi-issho", predicate: "invite_tomodachi_issho", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-invite-yama", lexemeId: "a2-lexeme-invite-yama", learningUse: "productive", semanticFrameId: "a2-frame-invite-yama", predicate: "invite_yama", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-respond-accept-tanoshimi", lexemeId: "a2-lexeme-respond-accept-tanoshimi", learningUse: "productive", semanticFrameId: "a2-frame-respond-accept-tanoshimi", predicate: "respond_accept_tanoshimi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-respond-decline-tsugou", lexemeId: "a2-lexeme-respond-decline-tsugou", learningUse: "productive", semanticFrameId: "a2-frame-respond-decline-tsugou", predicate: "respond_decline_tsugou", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-respond-decline-work", lexemeId: "a2-lexeme-respond-decline-work", learningUse: "productive", semanticFrameId: "a2-frame-respond-decline-work", predicate: "respond_decline_work", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-au-sora", lexemeId: "a2-lexeme-tsumori-au-sora", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-au-sora", predicate: "tsumori_au_sora", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-au-tomodachi", lexemeId: "a2-lexeme-tsumori-au-tomodachi", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-au-tomodachi", predicate: "tsumori_au_tomodachi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-iku-raishuu", lexemeId: "a2-lexeme-tsumori-iku-raishuu", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-iku-raishuu", predicate: "tsumori_iku_raishuu", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-kaeru-hayaku", lexemeId: "a2-lexeme-tsumori-kaeru-hayaku", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-kaeru-hayaku", predicate: "tsumori_kaeru_hayaku", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-matsu-doyoubi", lexemeId: "a2-lexeme-tsumori-matsu-doyoubi", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-matsu-doyoubi", predicate: "tsumori_matsu_doyoubi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-matsu-emi", lexemeId: "a2-lexeme-tsumori-matsu-emi", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-matsu-emi", predicate: "tsumori_matsu_emi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-oyogu-umi", lexemeId: "a2-lexeme-tsumori-oyogu-umi", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-oyogu-umi", predicate: "tsumori_oyogu_umi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-taberu-ryouri", lexemeId: "a2-lexeme-tsumori-taberu-ryouri", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-taberu-ryouri", predicate: "tsumori_taberu_ryouri", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-yomu-hon", lexemeId: "a2-lexeme-tsumori-yomu-hon", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-yomu-hon", predicate: "tsumori_yomu_hon", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-au-emi", lexemeId: "a2-lexeme-yotei-au-emi", learningUse: "productive", semanticFrameId: "a2-frame-yotei-au-emi", predicate: "yotei_au_emi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-iku-natsuyasumi", lexemeId: "a2-lexeme-yotei-iku-natsuyasumi", learningUse: "productive", semanticFrameId: "a2-frame-yotei-iku-natsuyasumi", predicate: "yotei_iku_natsuyasumi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-iku-oosaka", lexemeId: "a2-lexeme-yotei-iku-oosaka", learningUse: "productive", semanticFrameId: "a2-frame-yotei-iku-oosaka", predicate: "yotei_iku_oosaka", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-iku-toukyou", lexemeId: "a2-lexeme-yotei-iku-toukyou", learningUse: "productive", semanticFrameId: "a2-frame-yotei-iku-toukyou", predicate: "yotei_iku_toukyou", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-matsu-douryou", lexemeId: "a2-lexeme-yotei-matsu-douryou", learningUse: "productive", semanticFrameId: "a2-frame-yotei-matsu-douryou", predicate: "yotei_matsu_douryou", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-miru-eiga", lexemeId: "a2-lexeme-yotei-miru-eiga", learningUse: "productive", semanticFrameId: "a2-frame-yotei-miru-eiga", predicate: "yotei_miru_eiga", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-oyogu-doyoubi", lexemeId: "a2-lexeme-yotei-oyogu-doyoubi", learningUse: "productive", semanticFrameId: "a2-frame-yotei-oyogu-doyoubi", predicate: "yotei_oyogu_doyoubi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-oyogu-shuumatsu", lexemeId: "a2-lexeme-yotei-oyogu-shuumatsu", learningUse: "productive", semanticFrameId: "a2-frame-yotei-oyogu-shuumatsu", predicate: "yotei_oyogu_shuumatsu", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-yotei-taberu-ashita", lexemeId: "a2-lexeme-yotei-taberu-ashita", learningUse: "productive", semanticFrameId: "a2-frame-yotei-taberu-ashita", predicate: "yotei_taberu_ashita", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-tsumori-hanasu-nihongo", lexemeId: "a2-lexeme-tsumori-hanasu-nihongo", learningUse: "productive", semanticFrameId: "a2-frame-tsumori-hanasu-nihongo", predicate: "tsumori_hanasu_nihongo", argumentRoles: [], argumentParticleByRole: {} },

  // --- auto-derived per-utterance senses (Phase 3 Task 4 M4 batch) ---
  { id: "a2-sense-agree-hontou-soudesune", lexemeId: "a2-lexeme-agree-hontou-soudesune", learningUse: "productive", semanticFrameId: "a2-frame-agree-hontou-soudesune", predicate: "agree_hontou_soudesune", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-agree-iikangae", lexemeId: "a2-lexeme-agree-iikangae", learningUse: "productive", semanticFrameId: "a2-frame-agree-iikangae", predicate: "agree_iikangae", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-disagree-chotto-chigau", lexemeId: "a2-lexeme-disagree-chotto-chigau", learningUse: "productive", semanticFrameId: "a2-frame-disagree-chotto-chigau", predicate: "disagree_chotto_chigau", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-disagree-souhaomoimasen", lexemeId: "a2-lexeme-disagree-souhaomoimasen", learningUse: "productive", semanticFrameId: "a2-frame-disagree-souhaomoimasen", predicate: "disagree_souhaomoimasen", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-ame-kasa", lexemeId: "a2-lexeme-kara-ame-kasa", learningUse: "productive", semanticFrameId: "a2-frame-kara-ame-kasa", predicate: "kara_ame_kasa", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-atama-byouin", lexemeId: "a2-lexeme-kara-atama-byouin", learningUse: "productive", semanticFrameId: "a2-frame-kara-atama-byouin", predicate: "kara_atama_byouin", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-densha-aruku", lexemeId: "a2-lexeme-kara-densha-aruku", learningUse: "productive", semanticFrameId: "a2-frame-kara-densha-aruku", predicate: "kara_densha_aruku", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-jikanganai-takushii", lexemeId: "a2-lexeme-kara-jikanganai-takushii", learningUse: "productive", semanticFrameId: "a2-frame-kara-jikanganai-takushii", predicate: "kara_jikanganai_takushii", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-nihongo-hanasu", lexemeId: "a2-lexeme-kara-nihongo-hanasu", learningUse: "productive", semanticFrameId: "a2-frame-kara-nihongo-hanasu", predicate: "kara_nihongo_hanasu", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-samui-uchi", lexemeId: "a2-lexeme-kara-samui-uchi", learningUse: "productive", semanticFrameId: "a2-frame-kara-samui-uchi", predicate: "kara_samui_uchi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-shigoto-owatta", lexemeId: "a2-lexeme-kara-shigoto-owatta", learningUse: "productive", semanticFrameId: "a2-frame-kara-shigoto-owatta", predicate: "kara_shigoto_owatta", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-shukudai-isogashii", lexemeId: "a2-lexeme-kara-shukudai-isogashii", learningUse: "productive", semanticFrameId: "a2-frame-kara-shukudai-isogashii", predicate: "kara_shukudai_isogashii", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-tsukareta-neru", lexemeId: "a2-lexeme-kara-tsukareta-neru", learningUse: "productive", semanticFrameId: "a2-frame-kara-tsukareta-neru", predicate: "kara_tsukareta_neru", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-kara-yasumi-asobu", lexemeId: "a2-lexeme-kara-yasumi-asobu", learningUse: "productive", semanticFrameId: "a2-frame-kara-yasumi-asobu", predicate: "kara_yasumi_asobu", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-ame-futta-uchi", lexemeId: "a2-lexeme-node-ame-futta-uchi", learningUse: "productive", semanticFrameId: "a2-frame-node-ame-futta-uchi", predicate: "node_ame_futta_uchi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-atama-itakatta-neta", lexemeId: "a2-lexeme-node-atama-itakatta-neta", learningUse: "productive", semanticFrameId: "a2-frame-node-atama-itakatta-neta", predicate: "node_atama_itakatta_neta", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-byouki-yasunda", lexemeId: "a2-lexeme-node-byouki-yasunda", learningUse: "productive", semanticFrameId: "a2-frame-node-byouki-yasunda", predicate: "node_byouki_yasunda", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-densha-aruita", lexemeId: "a2-lexeme-node-densha-aruita", learningUse: "productive", semanticFrameId: "a2-frame-node-densha-aruita", predicate: "node_densha_aruita", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-jikanganakatta-takushii", lexemeId: "a2-lexeme-node-jikanganakatta-takushii", learningUse: "productive", semanticFrameId: "a2-frame-node-jikanganakatta-takushii", predicate: "node_jikanganakatta_takushii", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-samukatta-kooto", lexemeId: "a2-lexeme-node-samukatta-kooto", learningUse: "productive", semanticFrameId: "a2-frame-node-samukatta-kooto", predicate: "node_samukatta_kooto", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-shigoto-owatta-kaetta", lexemeId: "a2-lexeme-node-shigoto-owatta-kaetta", learningUse: "productive", semanticFrameId: "a2-frame-node-shigoto-owatta-kaetta", predicate: "node_shigoto_owatta_kaetta", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-shiken-benkyou-mainichi", lexemeId: "a2-lexeme-node-shiken-benkyou-mainichi", learningUse: "productive", semanticFrameId: "a2-frame-node-shiken-benkyou-mainichi", predicate: "node_shiken_benkyou_mainichi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-shukudai-benkyou-yoru", lexemeId: "a2-lexeme-node-shukudai-benkyou-yoru", learningUse: "productive", semanticFrameId: "a2-frame-node-shukudai-benkyou-yoru", predicate: "node_shukudai_benkyou_yoru", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-node-yasumi-asonda", lexemeId: "a2-lexeme-node-yasumi-asonda", learningUse: "productive", semanticFrameId: "a2-frame-node-yasumi-asonda", predicate: "node_yasumi_asonda", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-toomou-ashita-ame", lexemeId: "a2-lexeme-toomou-ashita-ame", learningUse: "productive", semanticFrameId: "a2-frame-toomou-ashita-ame", predicate: "toomou_ashita_ame", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-toomou-hon-omoshiroi", lexemeId: "a2-lexeme-toomou-hon-omoshiroi", learningUse: "productive", semanticFrameId: "a2-frame-toomou-hon-omoshiroi", predicate: "toomou_hon_omoshiroi", argumentRoles: [], argumentParticleByRole: {} },
  { id: "a2-sense-toomou-nihongo-muzukashikunai", lexemeId: "a2-lexeme-toomou-nihongo-muzukashikunai", learningUse: "productive", semanticFrameId: "a2-frame-toomou-nihongo-muzukashikunai", predicate: "toomou_nihongo_muzukashikunai", argumentRoles: [], argumentParticleByRole: {} },
];

// ---------------------------------------------------------------------------
// Phase 3 Task 5 (M5-M8) — new verbs (outside the frozen Task 2 12-verb
// `A2_VERBS` table) and dedicated predicate senses.
// ---------------------------------------------------------------------------

/**
 * The M5-M8 kanji-linked verbs not among the Task 2 12-registered
 * conjugation-class exemplars (`a2Conjugation.ts`'s `A2_VERBS`) — every
 * conjugation class/stem below is conjugated through `conjugateClass()`/
 * `conjugateClassMasuStem()`, the exact same regular-okurigana engine
 * `conjugate()`/`conjugateMasuStem()` themselves delegate to, never a
 * hand-typed guess.
 */
const NEW_VERBS: Readonly<Record<string, NewVerb>> = {
  // --- M5 sequencing-ongoing (kanji A 起寝使作毎; kanji B 洗終始働) ---
  okiru: { conjClass: "ichidan", stem: [newVerbFrag("おき", "oki")] },
  neru: { conjClass: "ichidan", stem: [newVerbFrag("ね", "ne")] },
  tsukau: { conjClass: "godan-u", stem: [newVerbFrag("つか", "tsuka")] },
  tsukuru: { conjClass: "godan-ru", stem: [newVerbFrag("つく", "tsuku")] },
  arau: { conjClass: "godan-u", stem: [newVerbFrag("あら", "ara")] },
  owaru: { conjClass: "godan-ru", stem: [newVerbFrag("おわ", "owa")] },
  hajimaru: { conjClass: "godan-ru", stem: [newVerbFrag("はじま", "hajima")] },
  hataraku: { conjClass: "godan-ku", stem: [newVerbFrag("はたら", "hatara")] },
  // --- M6 permission-requests (kanji A 入口出止; kanji B 禁消座立) ---
  hairu: { conjClass: "godan-ru", stem: [newVerbFrag("はい", "hai")] },
  tomaru: { conjClass: "godan-ru", stem: [newVerbFrag("とま", "toma")] },
  kesu: { conjClass: "godan-su", stem: [newVerbFrag("け", "ke")] },
  suwaru: { conjClass: "godan-ru", stem: [newVerbFrag("すわ", "suwa")] },
  tatsu: { conjClass: "godan-tsu", stem: [newVerbFrag("た", "ta")] },
  // --- M7 neighborhood-services: あります existential (masu-stem only —
  // this catalog never needs ある's suppletive negative ない, so treating
  // its regular godan-ru masu-stem/dictionary/te/past forms via the same
  // class-aware engine is safe and never exercises the irregularity). ---
  aru: { conjClass: "godan-ru", stem: [newVerbFrag("あ", "a")] },
  // --- M7 neighborhood-services (ns4 spec-fix): two more genuinely
  // distinct dedicated existence-flavored ichidan verbs — います (animate
  // existence, for facility staff) and みえます (visibility) — so ns4's
  // predicate diversity comes from real distinct lexemes, never an
  // untracked ~ている recurrence. ---
  iru: { conjClass: "ichidan", stem: [newVerbFrag("い", "i")] },
  mieru: { conjClass: "ichidan", stem: [newVerbFrag("みえ", "mie")] },
  // --- M8 restaurant-problems (kanji A 食飲飯茶; kanji B 肉魚熱冷) ---
  nomu: { conjClass: "godan-mu", stem: [newVerbFrag("の", "no")] },
};

/** One dedicated M5-M8 predicate sense — mirrors the established Task 4
 * fix ("each distinct baked utterance gets its own sense id, never a
 * shared bucket, so per-lesson predicate diversity is measured against
 * real, distinct predicates"): every distinct verb+construction (or
 * whole-clause) combination below gets its own sense, decoupled from the
 * real registered verb's own governed-argument frame (which legitimately
 * declares "theme"/"location" for its normal governed use elsewhere).
 * `argumentRoles` defaults to `[]` — every `rule-invariant-object`/
 * `rule-invariant-utterance` family licenses no governed slot for its
 * dedicated sense — pass `["location"]` explicitly for a
 * `rule-invariant-location` family's dedicated sense (the family's own
 * `location` slot must be matched by the sense's frame, checked
 * generically by the realizer). */
function dedicatedSense(
  id: string,
  predicate: string,
  argumentRoles: readonly SemanticArgumentRole[] = [],
): LearningTargetSense {
  const bareId = id.replace(/^a2-sense-/, "");
  return {
    id,
    lexemeId: `a2-lexeme-${bareId}`,
    learningUse: "productive",
    semanticFrameId: `a2-frame-${bareId}`,
    predicate,
    argumentRoles: [...argumentRoles],
    argumentParticleByRole: {},
  };
}

const A2_LEARNING_TARGET_SENSES_M5_M8: readonly LearningTargetSense[] = [
  // --- M5 sequencing-ongoing: te-sequence whole-clause-bake senses (one
  // per distinct two-action utterance) ---
  dedicatedSense("a2-sense-seq-okite-arau", "seq_okite_arau"),
  dedicatedSense("a2-sense-seq-tsukutte-taberu", "seq_tsukutte_taberu"),
  dedicatedSense("a2-sense-seq-owatte-kaeru", "seq_owatte_kaeru"),
  dedicatedSense("a2-sense-seq-hajimatte-tsukau", "seq_hajimatte_tsukau"),
  dedicatedSense("a2-sense-seq-itte-hanasu", "seq_itte_hanasu"),
  dedicatedSense("a2-sense-seq-hataraite-tsukareta", "seq_hataraite_tsukareta"),
  dedicatedSense("a2-sense-seq-aratte-neru", "seq_aratte_neru"),
  dedicatedSense("a2-sense-seq-tsukatte-kaku", "seq_tsukatte_kaku"),
  dedicatedSense("a2-sense-seq-oyoide-tsukareta", "seq_oyoide_tsukareta"),
  dedicatedSense("a2-sense-seq-asonde-kaeru", "seq_asonde_kaeru"),
  dedicatedSense("a2-sense-seq-matte-hanasu", "seq_matte_hanasu"),
  // te-sequence with an object slot (single-clause te-form-chain, object
  // varies) — one sense per predicate, reused across multiple objects.
  dedicatedSense("a2-sense-seq-obj-tabete-nomu", "seq_obj_tabete_nomu"),
  dedicatedSense("a2-sense-seq-obj-yonde-neru", "seq_obj_yonde_neru"),
  dedicatedSense("a2-sense-seq-obj-tsukutte-taberu", "seq_obj_tsukutte_taberu"),
  // ongoing-teiru (object-compositional; one sense per verb, reused with
  // different objects for genuine recombination).
  dedicatedSense("a2-sense-teiru-taberu", "teiru_taberu"),
  dedicatedSense("a2-sense-teiru-nomu", "teiru_nomu"),
  dedicatedSense("a2-sense-teiru-yomu", "teiru_yomu"),
  dedicatedSense("a2-sense-teiru-kaku", "teiru_kaku"),
  dedicatedSense("a2-sense-teiru-hanasu", "teiru_hanasu"),
  dedicatedSense("a2-sense-teiru-asobu", "teiru_asobu"),
  dedicatedSense("a2-sense-teiru-hataraku", "teiru_hataraku"),
  dedicatedSense("a2-sense-teiru-matsu", "teiru_matsu"),

  // --- M6 permission-requests ---
  // permission-temoii (object-compositional)
  dedicatedSense("a2-sense-temoii-taberu", "temoii_taberu"),
  dedicatedSense("a2-sense-temoii-nomu", "temoii_nomu"),
  dedicatedSense("a2-sense-temoii-kaku", "temoii_kaku"),
  dedicatedSense("a2-sense-temoii-yomu", "temoii_yomu"),
  dedicatedSense("a2-sense-temoii-hanasu", "temoii_hanasu"),
  // permission-temoii (location-compositional)
  dedicatedSense("a2-sense-temoii-loc-hanasu", "temoii_loc_hanasu", ["location"]),
  dedicatedSense("a2-sense-temoii-loc-tsukau", "temoii_loc_tsukau", ["location"]),
  dedicatedSense("a2-sense-temoii-loc-matsu", "temoii_loc_matsu", ["location"]),
  // prohibition-tewaikenai (object-compositional)
  dedicatedSense("a2-sense-tewaikenai-taberu", "tewaikenai_taberu"),
  dedicatedSense("a2-sense-tewaikenai-nomu", "tewaikenai_nomu"),
  dedicatedSense("a2-sense-tewaikenai-kesu", "tewaikenai_kesu"),
  dedicatedSense("a2-sense-tewaikenai-hanasu", "tewaikenai_hanasu"),
  dedicatedSense("a2-sense-tewaikenai-suwaru", "tewaikenai_suwaru"),
  // prohibition-tewaikenai (location-compositional)
  dedicatedSense("a2-sense-tewaikenai-loc-taberu", "tewaikenai_loc_taberu", ["location"]),
  dedicatedSense("a2-sense-tewaikenai-loc-hanasu", "tewaikenai_loc_hanasu", ["location"]),
  dedicatedSense("a2-sense-tewaikenai-loc-tomaru", "tewaikenai_loc_tomaru", ["location"]),
  // request-tekudasai (object-compositional)
  dedicatedSense("a2-sense-tekudasai-kesu", "tekudasai_kesu"),
  dedicatedSense("a2-sense-tekudasai-matsu", "tekudasai_matsu"),
  dedicatedSense("a2-sense-tekudasai-kaku", "tekudasai_kaku"),
  dedicatedSense("a2-sense-tekudasai-suwaru", "tekudasai_suwaru"),
  dedicatedSense("a2-sense-tekudasai-tatsu", "tekudasai_tatsu"),
  dedicatedSense("a2-sense-tekudasai-taberu", "tekudasai_taberu"),
  dedicatedSense("a2-sense-tekudasai-hanasu", "tekudasai_hanasu"),
  // negative-request / naidekudasai (object-compositional)
  dedicatedSense("a2-sense-naidekudasai-hairu", "naidekudasai_hairu"),
  dedicatedSense("a2-sense-naidekudasai-tomaru", "naidekudasai_tomaru"),
  dedicatedSense("a2-sense-naidekudasai-taberu", "naidekudasai_taberu"),
  dedicatedSense("a2-sense-naidekudasai-suwaru", "naidekudasai_suwaru"),
  dedicatedSense("a2-sense-naidekudasai-kesu", "naidekudasai_kesu"),

  // --- M7 neighborhood-services ---
  // possibility (object-compositional; affirmative/negative)
  dedicatedSense("a2-sense-possibility-tsukau", "possibility_tsukau"),
  dedicatedSense("a2-sense-possibility-hanasu", "possibility_hanasu"),
  dedicatedSense("a2-sense-possibility-yomu", "possibility_yomu"),
  dedicatedSense("a2-sense-possibility-oyogu", "possibility_oyogu"),
  dedicatedSense("a2-sense-possibility-kaku", "possibility_kaku"),
  dedicatedSense("a2-sense-possibility-nashi-tsukau", "possibility_nashi_tsukau"),
  dedicatedSense("a2-sense-possibility-nashi-hanasu", "possibility_nashi_hanasu"),
  // ask-where (topic-copular どこですか whole-utterance)
  dedicatedSense("a2-sense-ask-where-byouin", "ask_where_byouin"),
  dedicatedSense("a2-sense-ask-where-ginkou", "ask_where_ginkou"),
  dedicatedSense("a2-sense-ask-where-yuubinkyoku", "ask_where_yuubinkyoku"),
  dedicatedSense("a2-sense-ask-where-toshokan", "ask_where_toshokan"),
  dedicatedSense("a2-sense-ask-where-eki", "ask_where_eki"),
  // ask-for-help (request phrase content, reusing tekudasai construction
  // shape but with its own dedicated per-utterance senses)
  dedicatedSense("a2-sense-help-oshiete-michi", "help_oshiete_michi"),
  dedicatedSense("a2-sense-help-oshiete-basho", "help_oshiete_basho"),
  dedicatedSense("a2-sense-help-tetsudatte", "help_tetsudatte"),
  // describe-facility (existence あります/います — governed location role)
  dedicatedSense("a2-sense-exist-aru", "exist_aru", ["location"]),
  // explain-facility (ns4 spec-fix): two more genuinely distinct
  // existence-flavored senses (animate います for facility staff; みえます
  // for visibility) — never an untracked ~ている recurrence.
  dedicatedSense("a2-sense-exist-iru", "exist_iru", ["location"]),
  dedicatedSense("a2-sense-exist-mieru", "exist_mieru", ["location"]),

  // --- M8 restaurant-problems ---
  // confirm-understanding / order-food (whole-clause bake)
  dedicatedSense("a2-sense-order-menu", "order_menu"),
  dedicatedSense("a2-sense-order-osusume", "order_osusume"),
  dedicatedSense("a2-sense-order-onegai", "order_onegai"),
  dedicatedSense("a2-sense-order-sorede-ii", "order_sorede_ii"),
  dedicatedSense("a2-sense-order-nani-ga-aru", "order_nani_ga_aru"),
  dedicatedSense("a2-sense-order-kore-kudasai", "order_kore_kudasai"),
  dedicatedSense("a2-sense-order-nomimono", "order_nomimono"),
  dedicatedSense("a2-sense-order-issho-ni", "order_issho_ni"),
  // recount-experience / report-problem (whole-clause bake)
  dedicatedSense("a2-sense-problem-konai", "problem_konai"),
  dedicatedSense("a2-sense-problem-chigau", "problem_chigau"),
  dedicatedSense("a2-sense-problem-tsumetai", "problem_tsumetai"),
  dedicatedSense("a2-sense-problem-atsui", "problem_atsui"),
  dedicatedSense("a2-sense-problem-tarinai", "problem_tarinai"),
  dedicatedSense("a2-sense-problem-machigai", "problem_machigai"),
  dedicatedSense("a2-sense-problem-nioi", "problem_nioi"),
  dedicatedSense("a2-sense-problem-daremo-konai", "problem_daremo_konai"),
  // negotiate-price / pay-handle-problem (te-sequence recurrence,
  // whole-clause bake, mirrors a2-sense-seq-* shape)
  dedicatedSense("a2-sense-seq-onegaishite-harau", "seq_onegaishite_harau"),
  dedicatedSense("a2-sense-seq-tanonde-matsu", "seq_tanonde_matsu"),
  dedicatedSense("a2-sense-seq-kazoete-harau", "seq_kazoete_harau"),
  dedicatedSense("a2-sense-seq-uketotte-kaeru", "seq_uketotte_kaeru"),
  dedicatedSense("a2-sense-seq-tabete-harau", "seq_tabete_harau"),
  dedicatedSense("a2-sense-seq-nonde-harau", "seq_nonde_harau"),
  dedicatedSense("a2-sense-seq-mite-tanomu", "seq_mite_tanomu"),
  dedicatedSense("a2-sense-seq-tabete-kaeru", "seq_tabete_kaeru"),
];

/** Every registered A2 learning-target sense — M1-M4's plus M5-M8's. */
export const a2LearningTargetSenses: readonly LearningTargetSense[] = deepFreeze([
  ...A2_LEARNING_TARGET_SENSES_M1_M4,
  ...A2_LEARNING_TARGET_SENSES_M5_M8,
]);

// ---------------------------------------------------------------------------
// Semantic values (the ONLY place hiragana/katakana content is authored for
// M1-M4, alongside the reused Task 2 form registries)
// ---------------------------------------------------------------------------

const a2AuthoredValuesM1: readonly SemanticValue[] = [
  // --- referent-kind (subject surface forms) ---
  { id: "a2-value-watashi", kind: "referent", animacy: "animate", tokenFragments: [frag("わたし", "watashi")] },
  { id: "a2-value-emi", kind: "referent", animacy: "animate", tokenFragments: [frag("えみ", "emi")] },
  { id: "a2-value-sora", kind: "referent", animacy: "animate", tokenFragments: [frag("そら", "sora")] },
  { id: "a2-value-friend-subject", kind: "referent", animacy: "animate", tokenFragments: [frag("ともだち", "tomodachi")] },
  { id: "a2-value-colleague-subject", kind: "referent", animacy: "animate", tokenFragments: [frag("どうりょう", "douryou")] },
  { id: "a2-value-teacher-subject", kind: "referent", animacy: "animate", tokenFragments: [frag("せんせい", "sensei")] },

  // --- object/companion-kind nouns ---
  { id: "a2-value-obj-namae", kind: "object", tokenFragments: [frag("なまえ", "namae")] },
  { id: "a2-value-obj-nani", kind: "object", tokenFragments: [frag("なに", "nani")] },
  { id: "a2-value-obj-hontou", kind: "object", tokenFragments: [frag("ほんとうのこと", "hontou no koto")] },
  { id: "a2-value-obj-soo", kind: "object", tokenFragments: [frag("そう", "sou")] },
  { id: "a2-value-obj-sensei-hanashi", kind: "object", tokenFragments: [frag("せんせいのはなし", "sensei no hanashi")] },
  { id: "a2-value-companion-friend", kind: "object", tokenFragments: [frag("ともだち", "tomodachi")] },
  { id: "a2-value-companion-colleague", kind: "object", tokenFragments: [frag("どうりょう", "douryou")] },
  { id: "a2-value-recipient-teacher", kind: "object", tokenFragments: [frag("せんせい", "sensei")] },
  { id: "a2-value-recipient-friend", kind: "object", tokenFragments: [frag("ともだち", "tomodachi")] },

  // --- predicate-sense-kind (polite ます-stems; endings belong to rules) ---
  { id: "a2-value-hanasu", kind: "predicate-sense", senseId: "a2-sense-hanasu", tokenFragments: masuStemKana("a2-sense-hanasu") },
  { id: "a2-value-kiku", kind: "predicate-sense", senseId: "a2-sense-kiku", tokenFragments: [frag("きき", "kiki")] },
  { id: "a2-value-iu", kind: "predicate-sense", senseId: "a2-sense-iu", tokenFragments: [frag("いい", "ii")] },
  { id: "a2-value-omou-lex", kind: "predicate-sense", senseId: "a2-sense-omou-lex", tokenFragments: [frag("おもい", "omoi")] },

  // --- invariant-kind fixed reaction/followup/connector/clarify utterances ---
  {
    id: "a2-value-react-soka",
    kind: "predicate-sense",
    senseId: "a2-sense-react-soka",
    tokenFragments: [frag("そう", "sou"), frag("です", "desu"), frag("か", "ka", "particle")],
  },
  {
    id: "a2-value-react-taihen",
    kind: "predicate-sense",
    senseId: "a2-sense-react-taihen",
    tokenFragments: [frag("たいへん", "taihen"), frag("です", "desu"), frag("ね", "ne", "particle")],
  },
  {
    id: "a2-value-react-yokatta",
    kind: "predicate-sense",
    senseId: "a2-sense-react-yokatta",
    tokenFragments: [
      frag("それは", "sore wa"),
      frag("よかった", "yokatta"),
      frag("です", "desu"),
      frag("ね", "ne", "particle"),
    ],
  },
  {
    id: "a2-value-react-honto",
    kind: "predicate-sense",
    senseId: "a2-sense-react-honto",
    tokenFragments: [frag("ほんとう", "hontou"), frag("です", "desu"), frag("か", "ka", "particle")],
  },
  {
    id: "a2-value-followup-sonoato",
    kind: "predicate-sense",
    senseId: "a2-sense-followup-sonoato",
    tokenFragments: [
      frag("その", "sono"),
      frag("あと", "ato"),
      punctFrag("、", ","),
      frag("どう", "dou"),
      frag("しました", "shimashita"),
      frag("か", "ka", "particle"),
    ],
  },
  {
    id: "a2-value-followup-doushite",
    kind: "predicate-sense",
    senseId: "a2-sense-followup-doushite",
    tokenFragments: [frag("どうして", "doushite"), frag("です", "desu"), frag("か", "ka", "particle")],
  },
  {
    id: "a2-value-connector-ame-demo-dekakeru",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-ame-demo-dekakeru",
    tokenFragments: [
      frag("きょう", "kyou"),
      particleFrag("は", "wa"),
      frag("あめ", "ame"),
      frag("です", "desu"),
      punctFrag("。", "."),
      frag("でも", "demo"),
      punctFrag("、", ","),
      frag("でかけ", "dekake"),
      morphFrag("ます", "masu"),
    ],
  },
  {
    id: "a2-value-connector-shukudai-sorekara-terebi",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-shukudai-sorekara-terebi",
    tokenFragments: [
      frag("しゅくだいを", "shukudai o"),
      frag("します", "shimasu"),
      punctFrag("。", "."),
      frag("それから", "sorekara"),
      punctFrag("、", ","),
      frag("テレビを", "terebi o"),
      frag("みます", "mimasu"),
    ],
  },
  {
    id: "a2-value-connector-isogashii-demo-ganbaru",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-isogashii-demo-ganbaru",
    tokenFragments: [
      frag("しごとは", "shigoto wa"),
      frag("いそがしい", "isogashii"),
      frag("です", "desu"),
      punctFrag("。", "."),
      frag("でも", "demo"),
      punctFrag("、", ","),
      frag("たのしい", "tanoshii"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-connector-benkyou-sorekara-neru",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-benkyou-sorekara-neru",
    tokenFragments: [
      frag("にほんごを", "nihongo o"),
      frag("べんきょうします", "benkyoushimasu"),
      punctFrag("。", "."),
      frag("それから", "sorekara"),
      punctFrag("、", ","),
      frag("ねます", "nemasu"),
    ],
  },
  {
    id: "a2-value-connector-samui-demo-genki",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-samui-demo-genki",
    tokenFragments: [
      frag("きょうは", "kyou wa"),
      frag("さむい", "samui"),
      frag("です", "desu"),
      punctFrag("。", "."),
      frag("でも", "demo"),
      punctFrag("、", ","),
      frag("げんき", "genki"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-connector-test-demo-ganbatta",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-test-ganbatta",
    tokenFragments: [
      frag("テストは", "tesuto wa"),
      frag("むずかしかった", "muzukashikatta"),
      frag("です", "desu"),
      punctFrag("。", "."),
      frag("でも", "demo"),
      punctFrag("、", ","),
      frag("がんばりました", "ganbarimashita"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-connector-ame-sorekara-hare",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-morning-rain-clear",
    tokenFragments: [
      frag("あさは", "asa wa"),
      frag("あめでした", "ame deshita"),
      punctFrag("。", "."),
      frag("それから", "sorekara"),
      punctFrag("、", ","),
      frag("はれました", "haremashita"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-connector-shigoto-sorekara-kaeru",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-work-then-home",
    tokenFragments: [
      frag("しごとが", "shigoto ga"),
      frag("おわりました", "owarimashita"),
      punctFrag("。", "."),
      frag("それから", "sorekara"),
      punctFrag("、", ","),
      frag("いえに", "ie ni"),
      frag("かえりました", "kaerimashita"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-connector-tomodachi-sorekara-taberu",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-friend-then-eat",
    tokenFragments: [
      frag("ともだちに", "tomodachi ni"),
      frag("あいました", "aimashita"),
      punctFrag("。", "."),
      frag("それから", "sorekara"),
      punctFrag("、", ","),
      frag("いっしょに", "issho ni"),
      frag("たべました", "tabemashita"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-connector-hon-demo-omoshirokunai",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-book-not-interesting",
    tokenFragments: [
      frag("ほんを", "hon o"),
      frag("よみました", "yomimashita"),
      punctFrag("。", "."),
      frag("でも", "demo"),
      punctFrag("、", ","),
      frag("あまり", "amari"),
      frag("おもしろく", "omoshiroku"),
      morphFrag("なかった", "nakatta"),
      frag("です", "desu"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-connector-ame-demo-sanpo",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-rain-still-walked",
    tokenFragments: [
      frag("あめでした", "ame deshita"),
      punctFrag("。", "."),
      frag("でも", "demo"),
      punctFrag("、", ","),
      frag("さんぽに", "sanpo ni"),
      frag("いきました", "ikimashita"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-connector-terebi-sorekara-ofuro",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-tv-then-bath",
    tokenFragments: [
      frag("テレビを", "terebi o"),
      frag("みました", "mimashita"),
      punctFrag("。", "."),
      frag("それから", "sorekara"),
      punctFrag("、", ","),
      frag("おふろに", "ofuro ni"),
      frag("はいりました", "hairimashita"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-connector-tsukareta-demo-ureshii",
    kind: "predicate-sense",
    senseId: "a2-sense-connector-tired-but-happy",
    tokenFragments: [
      frag("つかれました", "tsukaremashita"),
      punctFrag("。", "."),
      frag("でも", "demo"),
      punctFrag("、", ","),
      frag("うれしかった", "ureshikatta"),
      frag("です", "desu"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-clarify-mouichido",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-mouichido",
    tokenFragments: [
      frag("すみません", "sumimasen"),
      punctFrag("、", ","),
      frag("もういちど", "mou ichido"),
      frag("おねがいします", "onegaishimasu"),
    ],
  },
  {
    id: "a2-value-clarify-yukkuri",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-yukkuri",
    tokenFragments: [
      frag("もうすこし", "mou sukoshi"),
      frag("ゆっくり", "yukkuri"),
      frag("おねがいします", "onegaishimasu"),
    ],
  },
  {
    id: "a2-value-clarify-wakarimasen",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-wakarimasen",
    tokenFragments: [frag("すみません", "sumimasen"), punctFrag("、", ","), frag("わかりません", "wakarimasen")],
  },
  {
    id: "a2-value-clarify-wakarimashita",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-wakarimashita",
    tokenFragments: [frag("わかりました", "wakarimashita")],
  },
  {
    id: "a2-value-clarify-imikotoba",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-imikotoba",
    tokenFragments: [
      frag("その", "sono"),
      frag("ことば", "kotoba"),
      frag("の", "no", "particle"),
      frag("いみ", "imi"),
      particleFrag("は", "wa"),
      frag("なん", "nan"),
      frag("です", "desu"),
      frag("か", "ka", "particle"),
    ],
  },
  {
    id: "a2-value-clarify-kikoemasen",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-kikoemasen",
    tokenFragments: [frag("すみません", "sumimasen"), punctFrag("、", ","), frag("きこえませんでした", "kikoemasen deshita")],
  },
  {
    id: "a2-value-clarify-ookiikoe",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-ookiikoe",
    tokenFragments: [
      frag("もうすこし", "mou sukoshi"),
      frag("おおきい", "ookii"),
      frag("こえで", "koe de"),
      frag("おねがいします", "onegaishimasu"),
    ],
  },
  {
    id: "a2-value-clarify-douiuimi",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-douiuimi",
    tokenFragments: [
      frag("それは", "sore wa"),
      frag("どういう", "dou iu"),
      frag("いみ", "imi"),
      frag("です", "desu"),
      frag("か", "ka", "particle"),
    ],
  },
  {
    id: "a2-value-clarify-kanji-yomenai",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-kanji-yomenai",
    tokenFragments: [
      frag("すみません", "sumimasen"),
      punctFrag("、", ","),
      frag("この", "kono"),
      frag("かんじが", "kanji ga"),
      frag("よめません", "yomemasen"),
    ],
  },
  {
    id: "a2-value-clarify-eigode",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-eigode",
    tokenFragments: [frag("えいごで", "eigo de"), frag("おねがいします", "onegaishimasu")],
  },
  {
    id: "a2-value-clarify-muzukashii",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-muzukashii",
    tokenFragments: [
      frag("すこし", "sukoshi"),
      frag("むずかしい", "muzukashii"),
      frag("です", "desu"),
      punctFrag("。", "."),
      frag("もういちど", "mou ichido"),
      frag("おねがいします", "onegaishimasu"),
    ],
  },
  {
    id: "a2-value-clarify-wakariyasuku",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-wakariyasuku",
    tokenFragments: [frag("わかりやすく", "wakariyasuku"), frag("おねがいします", "onegaishimasu")],
  },
  {
    id: "a2-value-clarify-nanto",
    kind: "predicate-sense",
    senseId: "a2-sense-clarify-nanto",
    tokenFragments: [frag("なんと", "nan to"), frag("いいました", "iimashita"), frag("か", "ka", "particle")],
  },

  // --- M1L4 recognize-plain-forms: plain-form conjugations, pure kana ---
  // Each recognition value derives its Japanese from `conjugate()` against
  // the real registered verb sense (one linguistic source of truth), but
  // declares its OWN dedicated "recognition" predicate-sense id — a plain
  // form used inside a bare `subject + predicate` recognition family has no
  // location/theme slot to satisfy that sense's normal governed-argument
  // frame (used elsewhere, e.g. `a2-value-yotei-iku-kyouto`), so recognition
  // is modeled as its own distinct sense, exactly like A1's listen/ask
  // same-orthography-different-frame precedent.
  { id: "a2-value-plain-iku-dict", kind: "predicate-sense", senseId: "a2-sense-plain-recog-iku", tokenFragments: plainKana("a2-sense-iku", "dictionary") },
  { id: "a2-value-plain-iku-neg", kind: "predicate-sense", senseId: "a2-sense-plain-recog-iku", tokenFragments: plainKana("a2-sense-iku", "negative") },
  { id: "a2-value-plain-taberu-past", kind: "predicate-sense", senseId: "a2-sense-plain-recog-taberu", tokenFragments: plainKana("a2-sense-taberu", "past") },
  { id: "a2-value-plain-hanasu-dict", kind: "predicate-sense", senseId: "a2-sense-plain-recog-hanasu", tokenFragments: plainKana("a2-sense-hanasu", "dictionary") },
  { id: "a2-value-plain-matsu-past-neg", kind: "predicate-sense", senseId: "a2-sense-plain-recog-matsu", tokenFragments: plainKana("a2-sense-matsu", "past-negative") },
  { id: "a2-value-plain-oyogu-dict", kind: "predicate-sense", senseId: "a2-sense-plain-recog-oyogu", tokenFragments: plainKana("a2-sense-oyogu", "dictionary") },
  { id: "a2-value-plain-asobu-dict", kind: "predicate-sense", senseId: "a2-sense-plain-recog-asobu", tokenFragments: plainKana("a2-sense-asobu", "dictionary") },
  { id: "a2-value-plain-yomu-neg", kind: "predicate-sense", senseId: "a2-sense-plain-recog-yomu", tokenFragments: plainKana("a2-sense-yomu", "negative") },
  { id: "a2-value-plain-kaeru-past", kind: "predicate-sense", senseId: "a2-sense-plain-recog-kaeru", tokenFragments: plainKana("a2-sense-kaeru", "past") },
  { id: "a2-value-plain-taberu-neg", kind: "predicate-sense", senseId: "a2-sense-plain-recog-taberu", tokenFragments: plainKana("a2-sense-taberu", "negative") },
  { id: "a2-value-plain-hanasu-past", kind: "predicate-sense", senseId: "a2-sense-plain-recog-hanasu", tokenFragments: plainKana("a2-sense-hanasu", "past") },
  {
    id: "a2-value-plain-isogashii",
    kind: "predicate-sense",
    senseId: "a2-sense-plain-isogashii",
    tokenFragments: [frag("いそがしい", "isogashii")],
  },
  {
    id: "a2-value-plain-isogashikunai",
    kind: "predicate-sense",
    senseId: "a2-sense-plain-isogashikunai",
    tokenFragments: [frag("いそがしく", "isogashiku"), morphFrag("ない", "nai")],
  },
];

// ---------------------------------------------------------------------------
// M2 plans-invitations values
// ---------------------------------------------------------------------------

const a2AuthoredValuesM2: readonly SemanticValue[] = [
  // --- objects/locations/times ---
  { id: "a2-value-loc-kyouto", kind: "location", tokenFragments: [frag("きょうと", "kyouto")] },
  { id: "a2-value-time-shuumatsu", kind: "time", tokenFragments: [frag("しゅうまつ", "shuumatsu")] },
  { id: "a2-value-time-raigetsu", kind: "time", tokenFragments: [frag("らいげつ", "raigetsu")] },
  { id: "a2-value-time-raishuu", kind: "time", tokenFragments: [frag("らいしゅう", "raishuu")] },
  { id: "a2-value-time-doyoubi", kind: "time", tokenFragments: [frag("どようび", "doyoubi")] },
  { id: "a2-value-obj-eiga", kind: "object", tokenFragments: [frag("えいが", "eiga")] },
  { id: "a2-value-obj-shokuji", kind: "object", tokenFragments: [frag("しょくじ", "shokuji")] },
  { id: "a2-value-recipient-emi", kind: "object", tokenFragments: [frag("えみ", "emi")] },
  { id: "a2-value-recipient-sora", kind: "object", tokenFragments: [frag("そら", "sora")] },

  // --- predicate-sense-kind (polite ます-stem) ---
  { id: "a2-value-au", kind: "predicate-sense", senseId: "a2-sense-au", tokenFragments: [frag("あい", "ai")] },

  // --- invariant-kind plan/invite/respond/arrange utterances ---
  {
    id: "a2-value-yotei-iku-kyouto",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-iku-kyouto",
    tokenFragments: [frag("きょうとへ", "kyouto e"), ...plainKana("a2-sense-iku", "dictionary"), frag("よてい", "yotei"), frag("です", "desu")],
  },
  {
    id: "a2-value-yotei-au-doyoubi",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-au-doyoubi",
    tokenFragments: [
      frag("どようびに", "doyoubi ni"),
      frag("ともだちに", "tomodachi ni"),
      frag("あう", "au"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-matsu-raishuu",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-matsu-raishuu",
    tokenFragments: [
      frag("らいしゅう", "raishuu"),
      frag("そら", "sora"),
      particleFrag("さんを", "san o"),
      ...plainKana("a2-sense-matsu", "dictionary"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-taberu-ashita",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-taberu-ashita",
    tokenFragments: [
      frag("あした", "ashita"),
      frag("ともだちと", "tomodachi to"),
      frag("しょくじを", "shokuji o"),
      ...plainKana("a2-sense-taberu", "dictionary"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-oyogu-shuumatsu",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-oyogu-shuumatsu",
    tokenFragments: [
      frag("しゅうまつ", "shuumatsu"),
      frag("うみで", "umi de"),
      ...plainKana("a2-sense-oyogu", "dictionary"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-iku-oosaka",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-iku-oosaka",
    tokenFragments: [
      frag("らいげつ", "raigetsu"),
      frag("おおさかへ", "oosaka e"),
      ...plainKana("a2-sense-iku", "dictionary"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-au-emi",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-au-emi",
    tokenFragments: [
      frag("どようびに", "doyoubi ni"),
      frag("えみさんに", "emi san ni"),
      frag("あう", "au"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-matsu-douryou",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-matsu-douryou",
    tokenFragments: [
      frag("こんしゅう", "konshuu"),
      frag("どうりょうを", "douryou o"),
      ...plainKana("a2-sense-matsu", "dictionary"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-iku-toukyou",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-iku-toukyou",
    tokenFragments: [
      frag("らいしゅう", "raishuu"),
      frag("とうきょうへ", "toukyou e"),
      ...plainKana("a2-sense-iku", "dictionary"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-miru-eiga",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-miru-eiga",
    tokenFragments: [
      frag("きんようびに", "kinyoubi ni"),
      frag("えみさんと", "emi san to"),
      frag("えいがを", "eiga o"),
      frag("みる", "miru"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-oyogu-doyoubi",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-oyogu-doyoubi",
    tokenFragments: [
      frag("どようび", "doyoubi"),
      frag("そらさんと", "sora san to"),
      ...plainKana("a2-sense-oyogu", "dictionary"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-yotei-iku-natsuyasumi",
    kind: "predicate-sense",
    senseId: "a2-sense-yotei-iku-natsuyasumi",
    tokenFragments: [
      frag("なつやすみに", "natsuyasumi ni"),
      frag("うみへ", "umi e"),
      ...plainKana("a2-sense-iku", "dictionary"),
      frag("よてい", "yotei"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-oyogu-shuumatsu",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-oyogu-shuumatsu",
    tokenFragments: [
      frag("しゅうまつ", "shuumatsu"),
      ...plainKana("a2-sense-oyogu", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-taberu-shokuji",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-taberu-shokuji",
    tokenFragments: [
      frag("しょくじを", "shokuji o"),
      ...plainKana("a2-sense-taberu", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-iku-raigetsu",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-iku-raigetsu",
    tokenFragments: [
      frag("らいげつ", "raigetsu"),
      frag("きょうとに", "kyouto ni"),
      ...plainKana("a2-sense-iku", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-au-tomodachi",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-au-tomodachi",
    tokenFragments: [
      frag("こんしゅうのしゅうまつ", "konshuu no shuumatsu"),
      frag("ともだちに", "tomodachi ni"),
      frag("あう", "au"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-matsu-emi",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-matsu-emi",
    tokenFragments: [
      frag("えきで", "eki de"),
      frag("えみさんを", "emi san o"),
      ...plainKana("a2-sense-matsu", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-yomu-hon",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-yomu-hon",
    tokenFragments: [
      frag("しゅうまつ", "shuumatsu"),
      frag("ほんを", "hon o"),
      ...plainKana("a2-sense-yomu", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-kaeru-hayaku",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-kaeru-hayaku",
    tokenFragments: [
      frag("きょうは", "kyou wa"),
      frag("はやく", "hayaku"),
      ...plainKana("a2-sense-kaeru", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-au-sora",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-au-sora",
    tokenFragments: [
      frag("あした", "ashita"),
      frag("そらさんに", "sora san ni"),
      frag("あう", "au"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-oyogu-umi",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-oyogu-umi",
    tokenFragments: [
      frag("なつやすみに", "natsuyasumi ni"),
      frag("うみで", "umi de"),
      ...plainKana("a2-sense-oyogu", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-taberu-ryouri",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-taberu-ryouri",
    tokenFragments: [
      frag("こんばん", "konban"),
      frag("にほんの", "nihon no"),
      frag("りょうりを", "ryouri o"),
      ...plainKana("a2-sense-taberu", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-matsu-doyoubi",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-matsu-doyoubi",
    tokenFragments: [
      frag("どようび", "doyoubi"),
      frag("どうりょうを", "douryou o"),
      ...plainKana("a2-sense-matsu", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-iku-raishuu",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-iku-raishuu",
    tokenFragments: [
      frag("らいしゅう", "raishuu"),
      frag("とうきょうに", "toukyou ni"),
      ...plainKana("a2-sense-iku", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-tsumori-hanasu-nihongo",
    kind: "predicate-sense",
    senseId: "a2-sense-tsumori-hanasu-nihongo",
    tokenFragments: [
      frag("にほんごを", "nihongo o"),
      ...plainKana("a2-sense-hanasu", "dictionary"),
      frag("つもり", "tsumori"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-invite-eiga",
    kind: "predicate-sense",
    senseId: "a2-sense-invite-eiga",
    tokenFragments: [
      frag("いっしょに", "issho ni"),
      frag("えいがを", "eiga o"),
      frag("み", "mi"),
      morphFrag("ましょう", "mashou"),
      particleFrag("か", "ka"),
    ],
  },
  {
    id: "a2-value-invite-shokuji",
    kind: "predicate-sense",
    senseId: "a2-sense-invite-shokuji",
    tokenFragments: [
      frag("いっしょに", "issho ni"),
      frag("しょくじを", "shokuji o"),
      ...masuStemKana("a2-sense-taberu"),
      morphFrag("ませんか", "masen ka"),
    ],
  },
  {
    id: "a2-value-invite-oyogu",
    kind: "predicate-sense",
    senseId: "a2-sense-invite-oyogu",
    tokenFragments: [
      frag("しゅうまつ", "shuumatsu"),
      frag("いっしょに", "issho ni"),
      ...masuStemKana("a2-sense-oyogu"),
      morphFrag("ませんか", "masen ka"),
    ],
  },
  {
    id: "a2-value-invite-tomodachi-issho",
    kind: "predicate-sense",
    senseId: "a2-sense-invite-tomodachi-issho",
    tokenFragments: [
      frag("こんばん", "konban"),
      frag("いっしょに", "issho ni"),
      frag("しょくじを", "shokuji o"),
      ...masuStemKana("a2-sense-taberu"),
      morphFrag("ませんか", "masen ka"),
    ],
  },
  {
    id: "a2-value-invite-yama",
    kind: "predicate-sense",
    senseId: "a2-sense-invite-yama",
    tokenFragments: [
      frag("にちようびに", "nichiyoubi ni"),
      frag("いっしょに", "issho ni"),
      frag("やまに", "yama ni"),
      frag("のぼり", "nobori"),
      morphFrag("ませんか", "masen ka"),
    ],
  },
  {
    id: "a2-value-invite-hon",
    kind: "predicate-sense",
    senseId: "a2-sense-invite-hon",
    tokenFragments: [
      frag("こんど", "kondo"),
      frag("いっしょに", "issho ni"),
      frag("ほんやに", "hon'ya ni"),
      ...masuStemKana("a2-sense-iku"),
      morphFrag("ませんか", "masen ka"),
    ],
  },
  {
    id: "a2-value-respond-accept",
    kind: "predicate-sense",
    senseId: "a2-sense-respond-accept",
    tokenFragments: [
      frag("いい", "ii"),
      frag("です", "desu"),
      particleFrag("ね", "ne"),
      punctFrag("。", "."),
      ...masuStemKana("a2-sense-iku"),
      morphFrag("ましょう", "mashou"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-respond-decline",
    kind: "predicate-sense",
    senseId: "a2-sense-respond-decline",
    tokenFragments: [
      frag("すみません", "sumimasen"),
      punctFrag("、", ","),
      frag("そのひは", "sono hi wa"),
      frag("ちょっと", "chotto"),
      frag("つごうが", "tsugou ga"),
      frag("わるい", "warui"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-respond-accept-happy",
    kind: "predicate-sense",
    senseId: "a2-sense-respond-accept-happy",
    tokenFragments: [
      frag("ぜひ", "zehi"),
      punctFrag("、", ","),
      ...masuStemKana("a2-sense-iku"),
      morphFrag("たい", "tai"),
      frag("です", "desu"),
    ],
  },
  {
    id: "a2-value-respond-decline-work",
    kind: "predicate-sense",
    senseId: "a2-sense-respond-decline-work",
    tokenFragments: [
      frag("すみません", "sumimasen"),
      punctFrag("、", ","),
      frag("そのひは", "sono hi wa"),
      frag("しごとが", "shigoto ga"),
      frag("あります", "arimasu"),
    ],
  },
  {
    id: "a2-value-respond-accept-tanoshimi",
    kind: "predicate-sense",
    senseId: "a2-sense-respond-accept-tanoshimi",
    tokenFragments: [
      frag("いいですね", "ii desu ne"),
      punctFrag("。", "."),
      frag("たのしみに", "tanoshimi ni"),
      frag("しています", "shiteimasu"),
    ],
  },
  {
    id: "a2-value-respond-decline-tsugou",
    kind: "predicate-sense",
    senseId: "a2-sense-respond-decline-tsugou",
    tokenFragments: [
      frag("ざんねんですが", "zannen desu ga"),
      punctFrag("、", ","),
      frag("いけません", "ikemasen"),
    ],
  },
  {
    id: "a2-value-arrange-eki",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-eki",
    tokenFragments: [
      frag("ごじに", "goji ni"),
      frag("えきで", "eki de"),
      frag("あい", "ai"),
      morphFrag("ましょう", "mashou"),
    ],
  },
  {
    id: "a2-value-arrange-cafe",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-cafe",
    tokenFragments: [
      frag("どようびの", "doyoubi no"),
      frag("ごご", "gogo"),
      frag("さんじに", "sanji ni"),
      frag("カフェで", "kafe de"),
      frag("あい", "ai"),
      morphFrag("ましょう", "mashou"),
    ],
  },
  {
    id: "a2-value-arrange-time-check",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-time-check",
    tokenFragments: [
      frag("なんじに", "nanji ni"),
      frag("あい", "ai"),
      morphFrag("ましょう", "mashou"),
      particleFrag("か", "ka"),
    ],
  },
  {
    id: "a2-value-arrange-place-check",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-place-check",
    tokenFragments: [
      frag("どこで", "doko de"),
      frag("あい", "ai"),
      morphFrag("ましょう", "mashou"),
      particleFrag("か", "ka"),
    ],
  },
  {
    id: "a2-value-arrange-gakkou-mae",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-gakkou-mae",
    tokenFragments: [
      frag("くじに", "kuji ni"),
      frag("がっこうの", "gakkou no"),
      frag("まえで", "mae de"),
      frag("あい", "ai"),
      morphFrag("ましょう", "mashou"),
    ],
  },
  {
    id: "a2-value-arrange-eigakan",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-eigakan",
    tokenFragments: [
      frag("にじはんに", "nijihan ni"),
      frag("えいがかんの", "eigakan no"),
      frag("いりぐちで", "iriguchi de"),
      frag("あい", "ai"),
      morphFrag("ましょう", "mashou"),
    ],
  },
  {
    id: "a2-value-arrange-osoku-narisou",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-osoku-narisou",
    tokenFragments: [
      frag("すみません", "sumimasen"),
      punctFrag("、", ","),
      frag("すこし", "sukoshi"),
      frag("おそく", "osoku"),
      frag("なります", "narimasu"),
    ],
  },
  {
    id: "a2-value-arrange-basho-henkou",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-basho-henkou",
    tokenFragments: [
      frag("ばしょを", "basho o"),
      frag("かえても", "kaetemo"),
      frag("いいです", "ii desu"),
      frag("か", "ka", "particle"),
    ],
  },
  {
    id: "a2-value-arrange-denwa",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-denwa",
    tokenFragments: [
      frag("あとで", "atode"),
      frag("でんわします", "denwa shimasu"),
    ],
  },
  {
    id: "a2-value-arrange-doyoubi-11ji",
    kind: "predicate-sense",
    senseId: "a2-sense-arrange-doyoubi-11ji",
    tokenFragments: [
      frag("どようびの", "doyoubi no"),
      frag("じゅういちじに", "juuichiji ni"),
      frag("しましょう", "shimashou"),
    ],
  },
];

// ---------------------------------------------------------------------------
// M3 experiences-narratives values
// ---------------------------------------------------------------------------

const a2AuthoredValuesM3: readonly SemanticValue[] = [
  // --- objects/locations/times ---
  { id: "a2-value-loc-umi", kind: "location", tokenFragments: [frag("うみ", "umi")] },
  { id: "a2-value-loc-yama", kind: "location", tokenFragments: [frag("やま", "yama")] },
  { id: "a2-value-loc-kyoto-again", kind: "location", tokenFragments: [frag("きょうと", "kyouto")] },
  { id: "a2-value-time-kyonen", kind: "time", tokenFragments: [frag("きょねん", "kyonen")] },
  { id: "a2-value-time-natsu", kind: "time", tokenFragments: [frag("なつ", "natsu")] },
  { id: "a2-value-obj-asagohan", kind: "object", tokenFragments: [frag("あさごはん", "asagohan")] },
  { id: "a2-value-loc-gakkou", kind: "location", tokenFragments: [frag("がっこう", "gakkou")] },

  // --- adjective stems (reuse the existing i-/na-adjective mechanism; the
  // ending — present/past x affirmative/negative — is appended generically,
  // exactly as A1's own adjective senses work; no invariant needed here) ---
  { id: "a2-value-tanoshii-stem", kind: "predicate-sense", senseId: "a2-sense-tanoshii", tokenFragments: [frag("たのし", "tanoshi")] },
  { id: "a2-value-yuumei-stem", kind: "predicate-sense", senseId: "a2-sense-yuumei", tokenFragments: [frag("ゆうめい", "yuumei")] },

  // --- experience (たことがあります), reusing composeA2Construction for the
  // registered Task 2 verbs, and a hand-composed equivalent for 登る (not one
  // of the 12 registered verbs; the exact same tail shape as
  // a2Constructions.ts's own "experience-takoto" construction).
  //
  // C1 spec-fix ("translation/Japanese fact mismatch"): a single bare
  // "[verb]たことがあります" value used to be shared across every lesson line
  // that used that verb, even though their EN/IT copy asserted different
  // facts (which city; which food; waited where/for whom; which mountain).
  // Each fact now gets its own distinct value with the correct
  // object/location baked in before the (still shared, still
  // `experienceTakotoKana`-derived) たことがあります tail, so the realized
  // Japanese always carries exactly the fact its own copy asserts, and the
  // same Japanese never stands for two different facts. ---
  { id: "a2-value-exp-oyoida", kind: "predicate-sense", senseId: "a2-sense-oyogu", tokenFragments: experienceTakotoKana("a2-sense-oyogu") },
  {
    id: "a2-value-exp-itta-kyouto",
    kind: "predicate-sense",
    senseId: "a2-sense-exp-itta",
    tokenFragments: [frag("きょうとに", "kyouto ni"), ...experienceTakotoKana("a2-sense-iku")],
  },
  {
    id: "a2-value-exp-itta-tokyo",
    kind: "predicate-sense",
    senseId: "a2-sense-exp-itta",
    tokenFragments: [frag("とうきょうに", "toukyou ni"), ...experienceTakotoKana("a2-sense-iku")],
  },
  {
    id: "a2-value-exp-itta-oosaka",
    kind: "predicate-sense",
    senseId: "a2-sense-exp-itta",
    tokenFragments: [frag("おおさかに", "oosaka ni"), ...experienceTakotoKana("a2-sense-iku")],
  },
  {
    id: "a2-value-exp-tabeta-sushi",
    kind: "predicate-sense",
    senseId: "a2-sense-exp-tabeta",
    tokenFragments: [frag("すしを", "sushi o"), ...experienceTakotoKana("a2-sense-taberu")],
  },
  {
    id: "a2-value-exp-tabeta-nihonshoku",
    kind: "predicate-sense",
    senseId: "a2-sense-exp-tabeta",
    tokenFragments: [frag("にほんのりょうりを", "nihon no ryouri o"), ...experienceTakotoKana("a2-sense-taberu")],
  },
  {
    id: "a2-value-exp-tabeta-natto",
    kind: "predicate-sense",
    senseId: "a2-sense-exp-tabeta",
    tokenFragments: [frag("なっとうを", "nattou o"), ...experienceTakotoKana("a2-sense-taberu")],
  },
  {
    id: "a2-value-exp-matta",
    kind: "predicate-sense",
    senseId: "a2-sense-exp-matta",
    tokenFragments: [frag("えきで", "eki de"), ...experienceTakotoKana("a2-sense-matsu")],
  },
  {
    id: "a2-value-exp-matta-tomodachi",
    kind: "predicate-sense",
    senseId: "a2-sense-exp-matta",
    tokenFragments: [frag("ともだちを", "tomodachi o"), ...experienceTakotoKana("a2-sense-matsu")],
  },
  {
    id: "a2-value-exp-nobotta-yama",
    kind: "predicate-sense",
    senseId: "a2-sense-noboru",
    tokenFragments: [frag("やまに", "yama ni"), frag("のぼ", "nobo"), morphFrag("った", "tta"), frag("こと", "koto"), particleFrag("が", "ga"), frag("あります", "arimasu")],
  },
  {
    id: "a2-value-exp-nobotta-fuji",
    kind: "predicate-sense",
    senseId: "a2-sense-noboru",
    tokenFragments: [frag("ふじさんに", "fujisan ni"), frag("のぼ", "nobo"), morphFrag("った", "tta"), frag("こと", "koto"), particleFrag("が", "ga"), frag("あります", "arimasu")],
  },

  // --- plain-past adjectives (recognize-plain-forms support for en3): bare
  // stem + past ending, no です, distinct from the polite tanoshii/yuumei
  // description values above. ---
  { id: "a2-value-plain-tanoshikatta", kind: "predicate-sense", senseId: "a2-sense-plain-recog-tanoshii", tokenFragments: [frag("たのし", "tanoshi"), morphFrag("かった", "katta")] },
  { id: "a2-value-plain-yuumei-datta", kind: "predicate-sense", senseId: "a2-sense-plain-recog-yuumei", tokenFragments: [frag("ゆうめい", "yuumei"), morphFrag("だった", "datta")] },
  { id: "a2-value-plain-warukatta", kind: "predicate-sense", senseId: "a2-sense-plain-recog-warui", tokenFragments: [frag("わる", "waru"), morphFrag("かった", "katta")] },
  { id: "a2-value-plain-sukidatta", kind: "predicate-sense", senseId: "a2-sense-plain-recog-suki", tokenFragments: [frag("すき", "suki"), morphFrag("だった", "datta")] },

  // --- narrate-order: baked ordered two/three-clause narratives (plain-form
  // past, connector-linked — supports both connectors and recognize-plain-forms) ---
  {
    id: "a2-value-narrate-asagohan-gakkou",
    kind: "predicate-sense",
    senseId: "a2-sense-narrate-asagohan-gakkou",
    tokenFragments: [
      frag("あさごはんを", "asagohan o"),
      ...plainKana("a2-sense-taberu", "past"),
      punctFrag("。", "."),
      frag("それから", "sorekara"),
      punctFrag("、", ","),
      frag("がっこうへ", "gakkou e"),
      ...plainKana("a2-sense-iku", "past"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-narrate-umi-yama",
    kind: "predicate-sense",
    senseId: "a2-sense-narrate-umi-yama",
    tokenFragments: [
      frag("うみで", "umi de"),
      ...plainKana("a2-sense-oyogu", "past"),
      punctFrag("。", "."),
      frag("それから", "sorekara"),
      punctFrag("、", ","),
      frag("やまに", "yama ni"),
      frag("のぼ", "nobo"),
      morphFrag("った", "tta"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-narrate-matsu-tabeta",
    kind: "predicate-sense",
    senseId: "a2-sense-narrate-matsu-tabeta",
    tokenFragments: [
      frag("ともだちを", "tomodachi o"),
      ...plainKana("a2-sense-matsu", "past"),
      punctFrag("。", "."),
      frag("それから", "sorekara"),
      punctFrag("、", ","),
      frag("しょくじを", "shokuji o"),
      ...plainKana("a2-sense-taberu", "past"),
      punctFrag("。", "."),
    ],
  },
  {
    id: "a2-value-narrate-kyouto-tanoshikatta",
    kind: "predicate-sense",
    senseId: "a2-sense-narrate-kyouto-tanoshikatta",
    tokenFragments: [
      frag("きょねん", "kyonen"),
      frag("きょうとへ", "kyouto e"),
      ...plainKana("a2-sense-iku", "past"),
      punctFrag("。", "."),
      frag("とても", "totemo"),
      frag("たのし", "tanoshi"),
      morphFrag("かった", "katta"),
      frag("です", "desu"),
      punctFrag("。", "."),
    ],
  },
];

// ---------------------------------------------------------------------------
// M4 reasons-opinions values
// ---------------------------------------------------------------------------

const a2AuthoredValuesM4: readonly SemanticValue[] = [
  // --- adjective stems (reuse the existing na-/i-adjective mechanism) ---
  { id: "a2-value-suki-stem", kind: "predicate-sense", senseId: "a2-sense-suki", tokenFragments: [frag("すき", "suki")] },
  { id: "a2-value-warui-stem", kind: "predicate-sense", senseId: "a2-sense-warui", tokenFragments: [frag("わるい", "warui")] },

  // --- object-action verb (existing generic mechanism) ---
  { id: "a2-value-kangaeru", kind: "predicate-sense", senseId: "a2-sense-kangaeru", tokenFragments: [frag("かんがえ", "kangae")] },
  { id: "a2-value-obj-mondai", kind: "object", tokenFragments: [frag("もんだい", "mondai")] },
  { id: "a2-value-obj-nihon-tabemono", kind: "object", tokenFragments: [frag("にほんのたべもの", "nihon no tabemono")] },

  // --- reason-kara (から): baked reason-clause + main-clause ---
  {
    id: "a2-value-kara-shiken-benkyou",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-shiken-benkyou",
    tokenFragments: [
      frag("あした", "ashita"),
      frag("しけんが", "shiken ga"),
      frag("ある", "aru"),
      particleFrag("から", "kara"),
      punctFrag("、", ","),
      frag("べんきょうします", "benkyoushimasu"),
    ],
  },
  {
    id: "a2-value-kara-isogashii-tsukareta",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-isogashii-tsukareta",
    tokenFragments: [
      frag("しごとが", "shigoto ga"),
      frag("いそがしい", "isogashii"),
      particleFrag("から", "kara"),
      punctFrag("、", ","),
      frag("つかれました", "tsukaremashita"),
    ],
  },
  {
    id: "a2-value-kara-suki-benkyou",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-suki-benkyou",
    tokenFragments: [
      frag("にほんの", "nihon no"),
      frag("たべものが", "tabemono ga"),
      frag("すきだから", "suki dakara"),
      punctFrag("、", ","),
      frag("にほんごを", "nihongo o"),
      frag("べんきょうします", "benkyoushimasu"),
    ],
  },

  // --- reason-node (ので): softer, more objective reason ---
  {
    id: "a2-value-node-ame-ie",
    kind: "predicate-sense",
    senseId: "a2-sense-node-ame-ie",
    tokenFragments: [
      frag("あめだった", "ame datta"),
      particleFrag("ので", "node"),
      punctFrag("、", ","),
      frag("いえに", "ie ni"),
      frag("いました", "imashita"),
    ],
  },
  {
    id: "a2-value-node-isogashikatta-dekakenakatta",
    kind: "predicate-sense",
    senseId: "a2-sense-node-isogashikatta-dekakenakatta",
    tokenFragments: [
      frag("しごとが", "shigoto ga"),
      frag("いそがしかった", "isogashikatta"),
      particleFrag("ので", "node"),
      punctFrag("、", ","),
      frag("でかけませんでした", "dekakemasen deshita"),
    ],
  },
  {
    id: "a2-value-node-densha-kaigi",
    kind: "predicate-sense",
    senseId: "a2-sense-node-densha-kaigi",
    tokenFragments: [
      frag("でんしゃが", "densha ga"),
      frag("おくれた", "okureta"),
      particleFrag("ので", "node"),
      punctFrag("、", ","),
      frag("かいぎに", "kaigi ni"),
      frag("おくれました", "okuremashita"),
    ],
  },

  // --- opinion (と思います) ---
  {
    id: "a2-value-toomou-kore-ii",
    kind: "predicate-sense",
    senseId: "a2-sense-toomou-kore-ii",
    tokenFragments: [frag("これは", "kore wa"), frag("いい", "ii"), particleFrag("と", "to"), frag("おもいます", "omoimasu")],
  },
  {
    id: "a2-value-toomou-benkyou-taihen",
    kind: "predicate-sense",
    senseId: "a2-sense-toomou-benkyou-taihen",
    tokenFragments: [
      frag("にほんごの", "nihongo no"),
      frag("べんきょうは", "benkyou wa"),
      frag("たいへんだ", "taihen da"),
      particleFrag("と", "to"),
      frag("おもいます", "omoimasu"),
    ],
  },
  {
    id: "a2-value-toomou-sora-isogashii",
    kind: "predicate-sense",
    senseId: "a2-sense-toomou-sora-isogashii",
    tokenFragments: [
      frag("そらさんは", "sora san wa"),
      frag("いそがしい", "isogashii"),
      particleFrag("と", "to"),
      frag("おもいます", "omoimasu"),
    ],
  },
  {
    id: "a2-value-toomou-yokunai",
    kind: "predicate-sense",
    senseId: "a2-sense-toomou-yokunai",
    tokenFragments: [
      frag("それは", "sore wa"),
      frag("よく", "yoku"),
      morphFrag("ない", "nai"),
      particleFrag("と", "to"),
      frag("おもいます", "omoimasu"),
    ],
  },

  // --- agree/disagree fixed reactions ---
  {
    id: "a2-value-agree-soudesune",
    kind: "predicate-sense",
    senseId: "a2-sense-agree-soudesune",
    tokenFragments: [frag("そう", "sou"), frag("です", "desu"), particleFrag("ね", "ne")],
  },
  {
    id: "a2-value-agree-watashimo",
    kind: "predicate-sense",
    senseId: "a2-sense-agree-watashimo",
    tokenFragments: [frag("わたしも", "watashi mo"), frag("そう", "sou"), frag("おもいます", "omoimasu")],
  },
  {
    id: "a2-value-agree-sansei",
    kind: "predicate-sense",
    senseId: "a2-sense-agree-sansei",
    tokenFragments: [frag("さんせい", "sansei"), frag("です", "desu")],
  },
  {
    id: "a2-value-disagree-chigau",
    kind: "predicate-sense",
    senseId: "a2-sense-disagree-chigau",
    tokenFragments: [
      frag("そうですか", "sou desu ka"),
      punctFrag("。", "."),
      frag("わたしは", "watashi wa"),
      frag("ちがう", "chigau"),
      particleFrag("と", "to"),
      frag("おもいます", "omoimasu"),
    ],
  },
  {
    id: "a2-value-disagree-omoimasen",
    kind: "predicate-sense",
    senseId: "a2-sense-disagree-omoimasen",
    tokenFragments: [frag("わたしは", "watashi wa"), frag("そう", "sou"), frag("おもいません", "omoimasen")],
  },

  // --- reason-kara (から): 10 more baked reason-clause + main-clause pairs
  // (ro1 needs 13 distinct give-reasons/reason-kara sentences total) ---
  {
    id: "a2-value-kara-ame-kasa",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-ame-kasa",
    tokenFragments: [frag("あめが", "ame ga"), frag("ふる", "furu"), particleFrag("から", "kara"), punctFrag("、", ","), frag("かさを", "kasa o"), frag("もっていきます", "motte ikimasu")],
  },
  {
    id: "a2-value-kara-tsukareta-neru",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-tsukareta-neru",
    tokenFragments: [frag("つかれている", "tsukarete iru"), particleFrag("から", "kara"), punctFrag("、", ","), frag("はやく", "hayaku"), frag("ねます", "nemasu")],
  },
  {
    id: "a2-value-kara-jikanganai-takushii",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-jikanganai-takushii",
    tokenFragments: [frag("じかんが", "jikan ga"), frag("ない", "nai"), particleFrag("から", "kara"), punctFrag("、", ","), frag("タクシーで", "takushii de"), frag("いきます", "ikimasu")],
  },
  {
    id: "a2-value-kara-samui-uchi",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-samui-uchi",
    tokenFragments: [frag("さむい", "samui"), particleFrag("から", "kara"), punctFrag("、", ","), frag("うちに", "uchi ni"), frag("います", "imasu")],
  },
  {
    id: "a2-value-kara-shigoto-owatta",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-shigoto-owatta",
    tokenFragments: [frag("しごとが", "shigoto ga"), frag("おわった", "owatta"), particleFrag("から", "kara"), punctFrag("、", ","), frag("うちへ", "uchi e"), frag("かえります", "kaerimasu")],
  },
  {
    id: "a2-value-kara-atama-byouin",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-atama-byouin",
    tokenFragments: [frag("あたまが", "atama ga"), frag("いたい", "itai"), particleFrag("から", "kara"), punctFrag("、", ","), frag("びょういんへ", "byouin e"), frag("いきます", "ikimasu")],
  },
  {
    id: "a2-value-kara-yasumi-asobu",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-yasumi-asobu",
    tokenFragments: [frag("やすみだから", "yasumi dakara"), punctFrag("、", ","), frag("ともだちと", "tomodachi to"), frag("あそびます", "asobimasu")],
  },
  {
    id: "a2-value-kara-densha-aruku",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-densha-aruku",
    tokenFragments: [frag("でんしゃが", "densha ga"), frag("こんでいる", "konde iru"), particleFrag("から", "kara"), punctFrag("、", ","), frag("あるいて", "aruite"), frag("いきます", "ikimasu")],
  },
  {
    id: "a2-value-kara-shukudai-isogashii",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-shukudai-isogashii",
    tokenFragments: [frag("しゅくだいが", "shukudai ga"), frag("おおい", "ooi"), particleFrag("から", "kara"), punctFrag("、", ","), frag("いそがしい", "isogashii"), frag("です", "desu")],
  },
  {
    id: "a2-value-kara-nihongo-hanasu",
    kind: "predicate-sense",
    senseId: "a2-sense-kara-nihongo-hanasu",
    tokenFragments: [frag("にほんごが", "nihongo ga"), frag("すきだから", "suki dakara"), punctFrag("、", ","), frag("まいにち", "mainichi"), frag("はなします", "hanashimasu")],
  },

  // --- reason-node (ので): 10 more softer/objective reason pairs (ro2 needs
  // 13 distinct reason-node/give-reasons sentences total) ---
  {
    id: "a2-value-node-ame-futta-uchi",
    kind: "predicate-sense",
    senseId: "a2-sense-node-ame-futta-uchi",
    tokenFragments: [frag("あめが", "ame ga"), frag("ふった", "futta"), particleFrag("ので", "node"), punctFrag("、", ","), frag("うちに", "uchi ni"), frag("いました", "imashita")],
  },
  {
    id: "a2-value-node-jikanganakatta-takushii",
    kind: "predicate-sense",
    senseId: "a2-sense-node-jikanganakatta-takushii",
    tokenFragments: [frag("じかんが", "jikan ga"), frag("なかった", "nakatta"), particleFrag("ので", "node"), punctFrag("、", ","), frag("タクシーで", "takushii de"), frag("いきました", "ikimashita")],
  },
  {
    id: "a2-value-node-samukatta-kooto",
    kind: "predicate-sense",
    senseId: "a2-sense-node-samukatta-kooto",
    tokenFragments: [frag("さむかった", "samukatta"), particleFrag("ので", "node"), punctFrag("、", ","), frag("コートを", "kooto o"), frag("きました", "kimashita")],
  },
  {
    id: "a2-value-node-shigoto-owatta-kaetta",
    kind: "predicate-sense",
    senseId: "a2-sense-node-shigoto-owatta-kaetta",
    tokenFragments: [frag("しごとが", "shigoto ga"), frag("おわった", "owatta"), particleFrag("ので", "node"), punctFrag("、", ","), frag("うちへ", "uchi e"), frag("かえりました", "kaerimashita")],
  },
  {
    id: "a2-value-node-byouki-yasunda",
    kind: "predicate-sense",
    senseId: "a2-sense-node-byouki-yasunda",
    tokenFragments: [frag("びょうきだった", "byouki datta"), particleFrag("ので", "node"), punctFrag("、", ","), frag("がっこうを", "gakkou o"), frag("やすみました", "yasumimashita")],
  },
  {
    id: "a2-value-node-densha-aruita",
    kind: "predicate-sense",
    senseId: "a2-sense-node-densha-aruita",
    tokenFragments: [frag("でんしゃが", "densha ga"), frag("こんでいた", "konde ita"), particleFrag("ので", "node"), punctFrag("、", ","), frag("あるきました", "arukimashita")],
  },
  {
    id: "a2-value-node-shukudai-benkyou-yoru",
    kind: "predicate-sense",
    senseId: "a2-sense-node-shukudai-benkyou-yoru",
    tokenFragments: [frag("しゅくだいが", "shukudai ga"), frag("おおかった", "ookatta"), particleFrag("ので", "node"), punctFrag("、", ","), frag("よるまで", "yoru made"), frag("べんきょうしました", "benkyoushimashita")],
  },
  {
    id: "a2-value-node-atama-itakatta-neta",
    kind: "predicate-sense",
    senseId: "a2-sense-node-atama-itakatta-neta",
    tokenFragments: [frag("あたまが", "atama ga"), frag("いたかった", "itakatta"), particleFrag("ので", "node"), punctFrag("、", ","), frag("はやく", "hayaku"), frag("ねました", "nemashita")],
  },
  {
    id: "a2-value-node-yasumi-asonda",
    kind: "predicate-sense",
    senseId: "a2-sense-node-yasumi-asonda",
    tokenFragments: [frag("やすみだった", "yasumi datta"), particleFrag("ので", "node"), punctFrag("、", ","), frag("ともだちと", "tomodachi to"), frag("あそびました", "asobimashita")],
  },
  {
    id: "a2-value-node-shiken-benkyou-mainichi",
    kind: "predicate-sense",
    senseId: "a2-sense-node-shiken-benkyou-mainichi",
    tokenFragments: [frag("しけんが", "shiken ga"), frag("あった", "atta"), particleFrag("ので", "node"), punctFrag("、", ","), frag("まいにち", "mainichi"), frag("べんきょうしました", "benkyoushimashita")],
  },

  // --- opinion (と思います): 3 more (ro3 needs a richer toomou pool) ---
  {
    id: "a2-value-toomou-hon-omoshiroi",
    kind: "predicate-sense",
    senseId: "a2-sense-toomou-hon-omoshiroi",
    tokenFragments: [frag("このほんは", "kono hon wa"), frag("おもしろい", "omoshiroi"), particleFrag("と", "to"), frag("おもいます", "omoimasu")],
  },
  {
    id: "a2-value-toomou-nihongo-muzukashikunai",
    kind: "predicate-sense",
    senseId: "a2-sense-toomou-nihongo-muzukashikunai",
    tokenFragments: [frag("にほんごは", "nihongo wa"), frag("むずかしく", "muzukashiku"), morphFrag("ない", "nai"), particleFrag("と", "to"), frag("おもいます", "omoimasu")],
  },
  {
    id: "a2-value-toomou-ashita-ame",
    kind: "predicate-sense",
    senseId: "a2-sense-toomou-ashita-ame",
    tokenFragments: [frag("あしたは", "ashita wa"), frag("あめだ", "ame da"), particleFrag("と", "to"), frag("おもいます", "omoimasu")],
  },

  // --- agree/disagree: 2 more each (ro4 review/synthesis lesson) ---
  {
    id: "a2-value-agree-hontou-soudesune",
    kind: "predicate-sense",
    senseId: "a2-sense-agree-hontou-soudesune",
    tokenFragments: [frag("ほんとうに", "hontou ni"), frag("そう", "sou"), frag("です", "desu"), particleFrag("ね", "ne")],
  },
  {
    id: "a2-value-agree-iikangae",
    kind: "predicate-sense",
    senseId: "a2-sense-agree-iikangae",
    tokenFragments: [frag("いい", "ii"), frag("かんがえ", "kangae"), frag("です", "desu"), particleFrag("ね", "ne")],
  },
  {
    id: "a2-value-disagree-chotto-chigau",
    kind: "predicate-sense",
    senseId: "a2-sense-disagree-chotto-chigau",
    tokenFragments: [frag("うーん", "uun"), punctFrag("、", ","), frag("ちょっと", "chotto"), frag("ちがう", "chigau"), particleFrag("と", "to"), frag("おもいます", "omoimasu")],
  },
  {
    id: "a2-value-disagree-souhaomoimasen",
    kind: "predicate-sense",
    senseId: "a2-sense-disagree-souhaomoimasen",
    tokenFragments: [frag("わたしは", "watashi wa"), frag("そうは", "sou wa"), frag("おもいません", "omoimasen")],
  },
];

// ---------------------------------------------------------------------------
// Phase 3 Task 5 — Module 5: sequencing-ongoing (て-form sequencing,
// ~ている ongoing/resultant state)
// ---------------------------------------------------------------------------

const a2AuthoredValuesM5: readonly SemanticValue[] = [
  // --- objects reused across te-sequence-object and ongoing-teiru families ---
  { id: "a2-value-obj-pan", kind: "object", tokenFragments: [frag("パン", "pan")] },
  { id: "a2-value-obj-mizu", kind: "object", tokenFragments: [frag("みず", "mizu")] },
  { id: "a2-value-obj-hon-m5", kind: "object", tokenFragments: [frag("ほん", "hon")] },
  { id: "a2-value-obj-tegami", kind: "object", tokenFragments: [frag("てがみ", "tegami")] },
  { id: "a2-value-obj-nihongo-m5", kind: "object", tokenFragments: [frag("にほんご", "nihongo")] },
  { id: "a2-value-obj-basu", kind: "object", tokenFragments: [frag("バス", "basu")] },

  // --- te-sequence whole-clause bakes (a2-family-te-sequence, M5-1/M5-4) ---
  { id: "a2-value-seq-okite-arau", kind: "predicate-sense", senseId: "a2-sense-seq-okite-arau", tokenFragments: [...newVerbSuffixKana("sequence-te", NEW_VERBS.okiru), punctFrag("、", ","), frag("かおを", "kao o"), ...masuForm(newVerbMasuStemKana(NEW_VERBS.arau))] },
  { id: "a2-value-seq-tsukutte-taberu", kind: "predicate-sense", senseId: "a2-sense-seq-tsukutte-taberu", tokenFragments: [frag("あさごはんを", "asagohan o"), ...newVerbSuffixKana("sequence-te", NEW_VERBS.tsukuru), punctFrag("、", ","), ...masuForm(masuStemKana("a2-sense-taberu"))] },
  { id: "a2-value-seq-owatte-kaeru", kind: "predicate-sense", senseId: "a2-sense-seq-owatte-kaeru", tokenFragments: [frag("しごとが", "shigoto ga"), ...newVerbSuffixKana("sequence-te", NEW_VERBS.owaru), punctFrag("、", ","), frag("いえに", "ie ni"), ...masuForm(masuStemKana("a2-sense-kaeru"))] },
  { id: "a2-value-seq-hajimatte-tsukau", kind: "predicate-sense", senseId: "a2-sense-seq-hajimatte-tsukau", tokenFragments: [frag("じゅぎょうが", "jugyou ga"), ...newVerbSuffixKana("sequence-te", NEW_VERBS.hajimaru), punctFrag("、", ","), frag("ノートを", "nooto o"), ...masuForm(newVerbMasuStemKana(NEW_VERBS.tsukau))] },
  { id: "a2-value-seq-itte-hanasu", kind: "predicate-sense", senseId: "a2-sense-seq-itte-hanasu", tokenFragments: [frag("がっこうへ", "gakkou e"), ...suffixKana("sequence-te", "a2-sense-iku"), punctFrag("、", ","), frag("ともだちと", "tomodachi to"), ...masuForm(masuStemKana("a2-sense-hanasu"))] },
  { id: "a2-value-seq-hataraite-tsukareta", kind: "predicate-sense", senseId: "a2-sense-seq-hataraite-tsukareta", tokenFragments: [...newVerbSuffixKana("sequence-te", NEW_VERBS.hataraku), punctFrag("、", ","), frag("つかれました", "tsukaremashita")] },
  { id: "a2-value-seq-aratte-neru", kind: "predicate-sense", senseId: "a2-sense-seq-aratte-neru", tokenFragments: [frag("かおを", "kao o"), ...newVerbSuffixKana("sequence-te", NEW_VERBS.arau), punctFrag("、", ","), ...masuForm(newVerbMasuStemKana(NEW_VERBS.neru))] },
  { id: "a2-value-seq-tsukatte-kaku", kind: "predicate-sense", senseId: "a2-sense-seq-tsukatte-kaku", tokenFragments: [frag("コンピューターを", "konpyuutaa o"), ...newVerbSuffixKana("sequence-te", NEW_VERBS.tsukau), punctFrag("、", ","), frag("メールを", "meeru o"), ...masuForm(masuStemKana("a2-sense-kaku"))] },
  { id: "a2-value-seq-oyoide-tsukareta", kind: "predicate-sense", senseId: "a2-sense-seq-oyoide-tsukareta", tokenFragments: [...suffixKana("sequence-te", "a2-sense-oyogu"), punctFrag("、", ","), frag("つかれました", "tsukaremashita")] },
  { id: "a2-value-seq-asonde-kaeru", kind: "predicate-sense", senseId: "a2-sense-seq-asonde-kaeru", tokenFragments: [frag("ともだちと", "tomodachi to"), ...suffixKana("sequence-te", "a2-sense-asobu"), punctFrag("、", ","), frag("いえに", "ie ni"), ...masuForm(masuStemKana("a2-sense-kaeru"))] },
  { id: "a2-value-seq-matte-hanasu", kind: "predicate-sense", senseId: "a2-sense-seq-matte-hanasu", tokenFragments: [frag("ともだちを", "tomodachi o"), ...suffixKana("sequence-te", "a2-sense-matsu"), punctFrag("、", ","), ...masuForm(masuStemKana("a2-sense-hanasu"))] },

  // --- te-sequence with an object slot (a2-family-te-sequence-object, M5-2) ---
  { id: "a2-value-seq-obj-tabete-nomu", kind: "predicate-sense", senseId: "a2-sense-seq-obj-tabete-nomu", tokenFragments: [...suffixKana("sequence-te", "a2-sense-taberu"), punctFrag("、", ","), ...masuForm(newVerbMasuStemKana(NEW_VERBS.nomu))] },
  { id: "a2-value-seq-obj-yonde-neru", kind: "predicate-sense", senseId: "a2-sense-seq-obj-yonde-neru", tokenFragments: [...suffixKana("sequence-te", "a2-sense-yomu"), punctFrag("、", ","), ...masuForm(newVerbMasuStemKana(NEW_VERBS.neru))] },
  { id: "a2-value-seq-obj-tsukutte-taberu", kind: "predicate-sense", senseId: "a2-sense-seq-obj-tsukutte-taberu", tokenFragments: [...newVerbSuffixKana("sequence-te", NEW_VERBS.tsukuru), punctFrag("、", ","), ...masuForm(masuStemKana("a2-sense-taberu"))] },

  // --- ongoing-teiru (a2-family-ongoing-teiru, object-compositional; M5-3/M5-4) ---
  { id: "a2-value-teiru-taberu", kind: "predicate-sense", senseId: "a2-sense-teiru-taberu", tokenFragments: suffixKana("ongoing-teiru", "a2-sense-taberu") },
  { id: "a2-value-teiru-nomu", kind: "predicate-sense", senseId: "a2-sense-teiru-nomu", tokenFragments: newVerbSuffixKana("ongoing-teiru", NEW_VERBS.nomu) },
  { id: "a2-value-teiru-yomu", kind: "predicate-sense", senseId: "a2-sense-teiru-yomu", tokenFragments: suffixKana("ongoing-teiru", "a2-sense-yomu") },
  { id: "a2-value-teiru-kaku", kind: "predicate-sense", senseId: "a2-sense-teiru-kaku", tokenFragments: suffixKana("ongoing-teiru", "a2-sense-kaku") },
  { id: "a2-value-teiru-hanasu", kind: "predicate-sense", senseId: "a2-sense-teiru-hanasu", tokenFragments: suffixKana("ongoing-teiru", "a2-sense-hanasu") },
  { id: "a2-value-teiru-asobu", kind: "predicate-sense", senseId: "a2-sense-teiru-asobu", tokenFragments: suffixKana("ongoing-teiru", "a2-sense-asobu") },
  { id: "a2-value-teiru-hataraku", kind: "predicate-sense", senseId: "a2-sense-teiru-hataraku", tokenFragments: newVerbSuffixKana("ongoing-teiru", NEW_VERBS.hataraku) },
  { id: "a2-value-teiru-matsu", kind: "predicate-sense", senseId: "a2-sense-teiru-matsu", tokenFragments: suffixKana("ongoing-teiru", "a2-sense-matsu") },
];

// ---------------------------------------------------------------------------
// Phase 3 Task 5 — Module 6: permission-requests (~てもいい, ~てはいけない,
// ~てください, ~ないでください)
// ---------------------------------------------------------------------------

const a2AuthoredValuesM6: readonly SemanticValue[] = [
  // --- objects/locations ---
  { id: "a2-value-obj-denki", kind: "object", tokenFragments: [frag("でんき", "denki")] },
  { id: "a2-value-obj-kore-m6", kind: "object", tokenFragments: [frag("これ", "kore")] },
  { id: "a2-value-obj-yasai", kind: "object", tokenFragments: [frag("やさい", "yasai")] },
  { id: "a2-value-loc-koko", kind: "location", tokenFragments: [frag("ここ", "koko")] },
  { id: "a2-value-loc-toshokan", kind: "location", tokenFragments: [frag("としょかん", "toshokan")] },
  { id: "a2-value-loc-eki", kind: "location", tokenFragments: [frag("えき", "eki")] },
  { id: "a2-value-loc-kyoushitsu", kind: "location", tokenFragments: [frag("きょうしつ", "kyoushitsu")] },

  // --- permission-temoii (a2-family-permission-temoii, object; M6-1) ---
  { id: "a2-value-temoii-taberu", kind: "predicate-sense", senseId: "a2-sense-temoii-taberu", tokenFragments: suffixKana("permission-temoii", "a2-sense-taberu") },
  { id: "a2-value-temoii-nomu", kind: "predicate-sense", senseId: "a2-sense-temoii-nomu", tokenFragments: newVerbSuffixKana("permission-temoii", NEW_VERBS.nomu) },
  { id: "a2-value-temoii-kaku", kind: "predicate-sense", senseId: "a2-sense-temoii-kaku", tokenFragments: suffixKana("permission-temoii", "a2-sense-kaku") },
  { id: "a2-value-temoii-yomu", kind: "predicate-sense", senseId: "a2-sense-temoii-yomu", tokenFragments: suffixKana("permission-temoii", "a2-sense-yomu") },
  { id: "a2-value-temoii-hanasu", kind: "predicate-sense", senseId: "a2-sense-temoii-hanasu", tokenFragments: suffixKana("permission-temoii", "a2-sense-hanasu") },
  // --- permission-temoii (a2-family-permission-temoii-location; M6-1/M7) ---
  { id: "a2-value-temoii-loc-hanasu", kind: "predicate-sense", senseId: "a2-sense-temoii-loc-hanasu", tokenFragments: suffixKana("permission-temoii", "a2-sense-hanasu") },
  { id: "a2-value-temoii-loc-tsukau", kind: "predicate-sense", senseId: "a2-sense-temoii-loc-tsukau", tokenFragments: newVerbSuffixKana("permission-temoii", NEW_VERBS.tsukau) },
  { id: "a2-value-temoii-loc-matsu", kind: "predicate-sense", senseId: "a2-sense-temoii-loc-matsu", tokenFragments: suffixKana("permission-temoii", "a2-sense-matsu") },

  // --- prohibition-tewaikenai (a2-family-prohibition-tewaikenai, object; M6-2) ---
  { id: "a2-value-tewaikenai-taberu", kind: "predicate-sense", senseId: "a2-sense-tewaikenai-taberu", tokenFragments: suffixKana("prohibition-tewaikenai", "a2-sense-taberu") },
  { id: "a2-value-tewaikenai-nomu", kind: "predicate-sense", senseId: "a2-sense-tewaikenai-nomu", tokenFragments: newVerbSuffixKana("prohibition-tewaikenai", NEW_VERBS.nomu) },
  { id: "a2-value-tewaikenai-kesu", kind: "predicate-sense", senseId: "a2-sense-tewaikenai-kesu", tokenFragments: newVerbSuffixKana("prohibition-tewaikenai", NEW_VERBS.kesu) },
  { id: "a2-value-tewaikenai-hanasu", kind: "predicate-sense", senseId: "a2-sense-tewaikenai-hanasu", tokenFragments: suffixKana("prohibition-tewaikenai", "a2-sense-hanasu") },
  { id: "a2-value-tewaikenai-suwaru", kind: "predicate-sense", senseId: "a2-sense-tewaikenai-suwaru", tokenFragments: newVerbSuffixKana("prohibition-tewaikenai", NEW_VERBS.suwaru) },
  // --- prohibition-tewaikenai (a2-family-prohibition-tewaikenai-location) ---
  { id: "a2-value-tewaikenai-loc-taberu", kind: "predicate-sense", senseId: "a2-sense-tewaikenai-loc-taberu", tokenFragments: suffixKana("prohibition-tewaikenai", "a2-sense-taberu") },
  { id: "a2-value-tewaikenai-loc-hanasu", kind: "predicate-sense", senseId: "a2-sense-tewaikenai-loc-hanasu", tokenFragments: suffixKana("prohibition-tewaikenai", "a2-sense-hanasu") },
  { id: "a2-value-tewaikenai-loc-tomaru", kind: "predicate-sense", senseId: "a2-sense-tewaikenai-loc-tomaru", tokenFragments: newVerbSuffixKana("prohibition-tewaikenai", NEW_VERBS.tomaru) },

  // --- request-tekudasai (a2-family-request-tekudasai, object; M6-3) ---
  { id: "a2-value-tekudasai-kesu", kind: "predicate-sense", senseId: "a2-sense-tekudasai-kesu", tokenFragments: newVerbSuffixKana("request-tekudasai", NEW_VERBS.kesu) },
  { id: "a2-value-tekudasai-matsu", kind: "predicate-sense", senseId: "a2-sense-tekudasai-matsu", tokenFragments: suffixKana("request-tekudasai", "a2-sense-matsu") },
  { id: "a2-value-tekudasai-kaku", kind: "predicate-sense", senseId: "a2-sense-tekudasai-kaku", tokenFragments: suffixKana("request-tekudasai", "a2-sense-kaku") },
  { id: "a2-value-tekudasai-suwaru", kind: "predicate-sense", senseId: "a2-sense-tekudasai-suwaru", tokenFragments: newVerbSuffixKana("request-tekudasai", NEW_VERBS.suwaru) },
  { id: "a2-value-tekudasai-tatsu", kind: "predicate-sense", senseId: "a2-sense-tekudasai-tatsu", tokenFragments: newVerbSuffixKana("request-tekudasai", NEW_VERBS.tatsu) },
  { id: "a2-value-tekudasai-taberu", kind: "predicate-sense", senseId: "a2-sense-tekudasai-taberu", tokenFragments: suffixKana("request-tekudasai", "a2-sense-taberu") },
  { id: "a2-value-tekudasai-hanasu", kind: "predicate-sense", senseId: "a2-sense-tekudasai-hanasu", tokenFragments: suffixKana("request-tekudasai", "a2-sense-hanasu") },

  // --- negative-request / naidekudasai (a2-family-negative-request; M6-4) ---
  { id: "a2-value-naidekudasai-hairu", kind: "predicate-sense", senseId: "a2-sense-naidekudasai-hairu", tokenFragments: newVerbSuffixKana("request-negative", NEW_VERBS.hairu) },
  { id: "a2-value-naidekudasai-tomaru", kind: "predicate-sense", senseId: "a2-sense-naidekudasai-tomaru", tokenFragments: newVerbSuffixKana("request-negative", NEW_VERBS.tomaru) },
  { id: "a2-value-naidekudasai-taberu", kind: "predicate-sense", senseId: "a2-sense-naidekudasai-taberu", tokenFragments: suffixKana("request-negative", "a2-sense-taberu") },
  { id: "a2-value-naidekudasai-suwaru", kind: "predicate-sense", senseId: "a2-sense-naidekudasai-suwaru", tokenFragments: newVerbSuffixKana("request-negative", NEW_VERBS.suwaru) },
  { id: "a2-value-naidekudasai-kesu", kind: "predicate-sense", senseId: "a2-sense-naidekudasai-kesu", tokenFragments: newVerbSuffixKana("request-negative", NEW_VERBS.kesu) },
];

// ---------------------------------------------------------------------------
// Phase 3 Task 5 — Module 7: neighborhood-services (possibility, directions,
// facility existence)
// ---------------------------------------------------------------------------

const a2AuthoredValuesM7: readonly SemanticValue[] = [
  // --- objects/locations/facility names ---
  { id: "a2-value-obj-nihongo-m7", kind: "object", tokenFragments: [frag("にほんご", "nihongo")] },
  { id: "a2-value-obj-eigo", kind: "object", tokenFragments: [frag("えいご", "eigo")] },
  { id: "a2-value-obj-kaado", kind: "object", tokenFragments: [frag("カード", "kaado")] },
  { id: "a2-value-loc-eki-m7", kind: "location", tokenFragments: [frag("えきの", "eki no"), frag("ちかく", "chikaku")] },
  { id: "a2-value-fac-byouin-subject", kind: "referent", animacy: "inanimate", tokenFragments: [frag("びょういん", "byouin")] },
  { id: "a2-value-fac-ginkou-subject", kind: "referent", animacy: "inanimate", tokenFragments: [frag("ぎんこう", "ginkou")] },
  { id: "a2-value-fac-yuubinkyoku-subject", kind: "referent", animacy: "inanimate", tokenFragments: [frag("ゆうびんきょく", "yuubinkyoku")] },
  { id: "a2-value-fac-toshokan-subject", kind: "referent", animacy: "inanimate", tokenFragments: [frag("としょかん", "toshokan")] },
  { id: "a2-value-fac-koen-subject", kind: "referent", animacy: "inanimate", tokenFragments: [frag("こうえん", "kouen")] },
  // explain-facility (ns4 spec-fix): an animate subject for the あります/
  // います (inanimate/animate existence) contrast — facility staff.
  { id: "a2-value-fac-shokuin-subject", kind: "referent", animacy: "animate", tokenFragments: [frag("しょくいん", "shokuin")] },

  // --- possibility (a2-family-possibility, object-compositional; M7-1/M7-2) ---
  { id: "a2-value-possibility-tsukau", kind: "predicate-sense", senseId: "a2-sense-possibility-tsukau", tokenFragments: possibilityKana(newVerbPlainKana(NEW_VERBS.tsukau, "dictionary"), "affirmative") },
  { id: "a2-value-possibility-hanasu", kind: "predicate-sense", senseId: "a2-sense-possibility-hanasu", tokenFragments: possibilityKana(plainKana("a2-sense-hanasu", "dictionary"), "affirmative") },
  { id: "a2-value-possibility-yomu", kind: "predicate-sense", senseId: "a2-sense-possibility-yomu", tokenFragments: possibilityKana(plainKana("a2-sense-yomu", "dictionary"), "affirmative") },
  { id: "a2-value-possibility-oyogu", kind: "predicate-sense", senseId: "a2-sense-possibility-oyogu", tokenFragments: possibilityKana(plainKana("a2-sense-oyogu", "dictionary"), "affirmative") },
  { id: "a2-value-possibility-kaku", kind: "predicate-sense", senseId: "a2-sense-possibility-kaku", tokenFragments: possibilityKana(plainKana("a2-sense-kaku", "dictionary"), "affirmative") },
  { id: "a2-value-possibility-nashi-tsukau", kind: "predicate-sense", senseId: "a2-sense-possibility-nashi-tsukau", tokenFragments: possibilityKana(newVerbPlainKana(NEW_VERBS.tsukau, "dictionary"), "negative") },
  { id: "a2-value-possibility-nashi-hanasu", kind: "predicate-sense", senseId: "a2-sense-possibility-nashi-hanasu", tokenFragments: possibilityKana(plainKana("a2-sense-hanasu", "dictionary"), "negative") },

  // --- ask-where (a2-family-ask-where, rule-invariant-utterance whole-clause
  // bake; M7-3) ---
  { id: "a2-value-ask-where-byouin", kind: "predicate-sense", senseId: "a2-sense-ask-where-byouin", tokenFragments: [frag("びょういんは", "byouin wa"), frag("どこ", "doko"), frag("です", "desu")] },
  { id: "a2-value-ask-where-ginkou", kind: "predicate-sense", senseId: "a2-sense-ask-where-ginkou", tokenFragments: [frag("ぎんこうは", "ginkou wa"), frag("どこ", "doko"), frag("です", "desu")] },
  { id: "a2-value-ask-where-yuubinkyoku", kind: "predicate-sense", senseId: "a2-sense-ask-where-yuubinkyoku", tokenFragments: [frag("ゆうびんきょくは", "yuubinkyoku wa"), frag("どこ", "doko"), frag("です", "desu")] },
  { id: "a2-value-ask-where-toshokan", kind: "predicate-sense", senseId: "a2-sense-ask-where-toshokan", tokenFragments: [frag("としょかんは", "toshokan wa"), frag("どこ", "doko"), frag("です", "desu")] },
  { id: "a2-value-ask-where-eki", kind: "predicate-sense", senseId: "a2-sense-ask-where-eki", tokenFragments: [frag("えきは", "eki wa"), frag("どこ", "doko"), frag("です", "desu")] },
  // --- ask-for-help (request phrase content, reuses request-tekudasai's
  // own realized shape via dedicated per-utterance whole-clause bakes; M7-3) ---
  { id: "a2-value-help-oshiete-michi", kind: "predicate-sense", senseId: "a2-sense-help-oshiete-michi", tokenFragments: [frag("すみません", "sumimasen"), punctFrag("、", ","), frag("みちを", "michi o"), frag("おしえて", "oshiete"), frag("ください", "kudasai")] },
  { id: "a2-value-help-oshiete-basho", kind: "predicate-sense", senseId: "a2-sense-help-oshiete-basho", tokenFragments: [frag("すみません", "sumimasen"), punctFrag("、", ","), frag("ばしょを", "basho o"), frag("おしえて", "oshiete"), frag("ください", "kudasai")] },
  { id: "a2-value-help-tetsudatte", kind: "predicate-sense", senseId: "a2-sense-help-tetsudatte", tokenFragments: [frag("すみません", "sumimasen"), punctFrag("、", ","), frag("てつだって", "tetsudatte"), frag("ください", "kudasai")] },

  // --- describe-facility (a2-family-describe-facility, rule-existence; M7-4) ---
  { id: "a2-value-exist-aru", kind: "predicate-sense", senseId: "a2-sense-exist-aru", tokenFragments: newVerbMasuStemKana(NEW_VERBS.aru) },
  // --- explain-facility (ns4 spec-fix): two more genuinely distinct
  // existence-flavored senses through the SAME a2-family-describe-facility
  // (never an untracked ~ている recurrence) — います (animate existence, for
  // facility staff) and みえます (visibility, "can be seen"). ---
  { id: "a2-value-exist-iru", kind: "predicate-sense", senseId: "a2-sense-exist-iru", tokenFragments: newVerbMasuStemKana(NEW_VERBS.iru) },
  { id: "a2-value-exist-mieru", kind: "predicate-sense", senseId: "a2-sense-exist-mieru", tokenFragments: newVerbMasuStemKana(NEW_VERBS.mieru) },
];

// ---------------------------------------------------------------------------
// Phase 3 Task 5 — Module 8: restaurant-problems (ordering, special
// requests, reporting a problem, paying)
// ---------------------------------------------------------------------------

const a2AuthoredValuesM8: readonly SemanticValue[] = [
  // --- food/drink vocabulary ---
  { id: "a2-value-obj-raamen", kind: "object", tokenFragments: [frag("ラーメン", "raamen")] },
  { id: "a2-value-obj-ocha-m8", kind: "object", tokenFragments: [frag("おちゃ", "ocha")] },
  { id: "a2-value-obj-niku", kind: "object", tokenFragments: [frag("にく", "niku")] },
  { id: "a2-value-obj-menyuu", kind: "object", tokenFragments: [frag("メニュー", "menyuu")] },

  // --- confirm-understanding / order-food (whole-clause bake; M8-1) ---
  { id: "a2-value-order-menu", kind: "predicate-sense", senseId: "a2-sense-order-menu", tokenFragments: [frag("すみません", "sumimasen"), punctFrag("、", ","), frag("メニューを", "menyuu o"), frag("ください", "kudasai")] },
  { id: "a2-value-order-osusume", kind: "predicate-sense", senseId: "a2-sense-order-osusume", tokenFragments: [frag("おすすめは", "osusume wa"), frag("なん", "nan"), frag("です", "desu"), frag("か", "ka", "particle")] },
  { id: "a2-value-order-onegai", kind: "predicate-sense", senseId: "a2-sense-order-onegai", tokenFragments: [frag("ラーメンを", "raamen o"), frag("おねがいします", "onegaishimasu")] },
  { id: "a2-value-order-sorede-ii", kind: "predicate-sense", senseId: "a2-sense-order-sorede-ii", tokenFragments: [frag("はい", "hai"), punctFrag("、", ","), frag("それで", "sore de"), frag("いいです", "ii desu")] },
  { id: "a2-value-order-nani-ga-aru", kind: "predicate-sense", senseId: "a2-sense-order-nani-ga-aru", tokenFragments: [frag("のみものは", "nomimono wa"), frag("なにが", "nani ga"), frag("あります", "arimasu"), frag("か", "ka", "particle")] },
  { id: "a2-value-order-kore-kudasai", kind: "predicate-sense", senseId: "a2-sense-order-kore-kudasai", tokenFragments: [frag("これを", "kore o"), frag("ください", "kudasai")] },
  { id: "a2-value-order-nomimono", kind: "predicate-sense", senseId: "a2-sense-order-nomimono", tokenFragments: [frag("おちゃを", "ocha o"), frag("おねがいします", "onegaishimasu")] },
  { id: "a2-value-order-issho-ni", kind: "predicate-sense", senseId: "a2-sense-order-issho-ni", tokenFragments: [frag("ごはんも", "gohan mo"), frag("いっしょに", "issho ni"), frag("おねがいします", "onegaishimasu")] },

  // --- recount-experience / report-problem (whole-clause bake; M8-3) ---
  { id: "a2-value-problem-konai", kind: "predicate-sense", senseId: "a2-sense-problem-konai", tokenFragments: [frag("ラーメンを", "raamen o"), frag("たのみました", "tanomimashita"), punctFrag("が", "ga"), frag("まだ", "mada"), frag("きません", "kimasen")] },
  { id: "a2-value-problem-chigau", kind: "predicate-sense", senseId: "a2-sense-problem-chigau", tokenFragments: [frag("これは", "kore wa"), frag("わたしの", "watashi no"), frag("ちゅうもんと", "chuumon to"), frag("ちがいます", "chigaimasu")] },
  { id: "a2-value-problem-tsumetai", kind: "predicate-sense", senseId: "a2-sense-problem-tsumetai", tokenFragments: [frag("スープが", "suupu ga"), frag("つめたい", "tsumetai"), frag("です", "desu")] },
  { id: "a2-value-problem-atsui", kind: "predicate-sense", senseId: "a2-sense-problem-atsui", tokenFragments: [frag("おちゃが", "ocha ga"), frag("あつすぎ", "atsusugi"), frag("ます", "masu", "morpheme")] },
  { id: "a2-value-problem-tarinai", kind: "predicate-sense", senseId: "a2-sense-problem-tarinai", tokenFragments: [frag("フォークが", "fooku ga"), frag("たりません", "tarimasen")] },
  { id: "a2-value-problem-machigai", kind: "predicate-sense", senseId: "a2-sense-problem-machigai", tokenFragments: [frag("にくを", "niku o"), frag("たのみました", "tanomimashita"), punctFrag("が", "ga"), frag("さかなが", "sakana ga"), frag("きました", "kimashita")] },
  { id: "a2-value-problem-nioi", kind: "predicate-sense", senseId: "a2-sense-problem-nioi", tokenFragments: [frag("この", "kono"), frag("さかなは", "sakana wa"), frag("すこし", "sukoshi"), frag("へん", "hen"), frag("です", "desu")] },
  { id: "a2-value-problem-daremo-konai", kind: "predicate-sense", senseId: "a2-sense-problem-daremo-konai", tokenFragments: [frag("じゅっぷん", "juppun"), frag("まちました", "machimashita"), punctFrag("が", "ga"), frag("だれも", "dare mo"), frag("きません", "kimasen")] },

  // --- negotiate-price / pay-handle-problem (te-sequence recurrence,
  // whole-clause bake, mirrors a2-sense-seq-* shape; M8-4) ---
  { id: "a2-value-seq-onegaishite-harau", kind: "predicate-sense", senseId: "a2-sense-seq-onegaishite-harau", tokenFragments: [frag("おかんじょうを", "okanjou o"), frag("おねがいして", "onegaishite"), punctFrag("、", ","), frag("おかねを", "okane o"), frag("はらいました", "haraimashita")] },
  { id: "a2-value-seq-tanonde-matsu", kind: "predicate-sense", senseId: "a2-sense-seq-tanonde-matsu", tokenFragments: [frag("おかんじょうを", "okanjou o"), frag("たのんで", "tanonde"), punctFrag("、", ","), ...masuForm(masuStemKana("a2-sense-matsu"))] },
  { id: "a2-value-seq-kazoete-harau", kind: "predicate-sense", senseId: "a2-sense-seq-kazoete-harau", tokenFragments: [frag("おかねを", "okane o"), frag("かぞえて", "kazoete"), punctFrag("、", ","), frag("はらいました", "haraimashita")] },
  { id: "a2-value-seq-uketotte-kaeru", kind: "predicate-sense", senseId: "a2-sense-seq-uketotte-kaeru", tokenFragments: [frag("おつりを", "otsuri o"), frag("うけとって", "uketotte"), punctFrag("、", ","), ...masuForm(masuStemKana("a2-sense-kaeru"))] },
  { id: "a2-value-seq-tabete-harau", kind: "predicate-sense", senseId: "a2-sense-seq-tabete-harau", tokenFragments: [frag("ごはんを", "gohan o"), frag("たべて", "tabete"), punctFrag("、", ","), frag("はらいました", "haraimashita")] },
  { id: "a2-value-seq-nonde-harau", kind: "predicate-sense", senseId: "a2-sense-seq-nonde-harau", tokenFragments: [frag("おちゃを", "ocha o"), frag("のんで", "nonde"), punctFrag("、", ","), frag("はらいました", "haraimashita")] },
  { id: "a2-value-seq-mite-tanomu", kind: "predicate-sense", senseId: "a2-sense-seq-mite-tanomu", tokenFragments: [frag("メニューを", "menyuu o"), frag("みて", "mite"), punctFrag("、", ","), frag("ちゅうもんしました", "chuumon shimashita")] },
  { id: "a2-value-seq-tabete-kaeru", kind: "predicate-sense", senseId: "a2-sense-seq-tabete-kaeru", tokenFragments: [frag("ごはんを", "gohan o"), frag("たべて", "tabete"), punctFrag("、", ","), ...masuForm(masuStemKana("a2-sense-kaeru"))] },
];

export const a2SemanticValues: readonly SemanticValue[] = deepFreeze([
  ...a2AuthoredValuesM1,
  ...a2AuthoredValuesM2,
  ...a2AuthoredValuesM3,
  ...a2AuthoredValuesM4,
  ...a2AuthoredValuesM5,
  ...a2AuthoredValuesM6,
  ...a2AuthoredValuesM7,
  ...a2AuthoredValuesM8,
]);

// ---------------------------------------------------------------------------
// Sentence families (reference the realizer's stable semantic rule ids)
// ---------------------------------------------------------------------------

export const a2SentenceFamilies: readonly SentenceFamily[] = deepFreeze([
  {
    id: "a2-family-talk-companion",
    level: "a2",
    canDoIds: ["a2-cando-backchannel-followup"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "companion", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-companion-action",
    requiredConceptIds: [A2_CONCEPT_BACKCHANNEL_FOLLOWUP],
  },
  {
    id: "a2-family-ask-recipient",
    level: "a2",
    canDoIds: ["a2-cando-backchannel-followup"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-recipient-action",
    requiredConceptIds: [A2_CONCEPT_BACKCHANNEL_FOLLOWUP],
  },
  {
    id: "a2-family-say-object",
    level: "a2",
    canDoIds: ["a2-cando-backchannel-followup"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-object-action",
    requiredConceptIds: [A2_CONCEPT_BACKCHANNEL_FOLLOWUP],
  },
  {
    id: "a2-family-backchannel-reaction",
    level: "a2",
    canDoIds: ["a2-cando-backchannel-followup"],
    slotSchema: [{ id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false }],
    permittedAxes: ["predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_BACKCHANNEL_FOLLOWUP],
  },
  {
    id: "a2-family-connector-utterance",
    level: "a2",
    canDoIds: ["a2-cando-connectors"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_CONNECTORS],
  },
  {
    id: "a2-family-clarify-repeat",
    level: "a2",
    canDoIds: ["a2-cando-clarify-repeat"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_CLARIFY_REPEAT],
  },
  {
    id: "a2-family-plain-recognition",
    level: "a2",
    canDoIds: ["a2-cando-recognize-plain-forms"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "polarity-tense-form", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_RECOGNIZE_PLAIN_FORMS],
  },

  // --- M2 plans-invitations ---
  {
    id: "a2-family-plan-yotei",
    level: "a2",
    canDoIds: ["a2-cando-intentions-plans"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "polarity-tense-form", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_INTENTIONS_YOTEI],
  },
  {
    id: "a2-family-plan-tsumori",
    level: "a2",
    canDoIds: ["a2-cando-intentions-plans"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "polarity-tense-form", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_INTENTIONS_TSUMORI],
  },
  {
    id: "a2-family-invite",
    level: "a2",
    canDoIds: ["a2-cando-invite-accept-decline"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_INVITE_ACCEPT_DECLINE],
  },
  {
    id: "a2-family-respond-invite",
    level: "a2",
    canDoIds: ["a2-cando-invite-accept-decline"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_INVITE_ACCEPT_DECLINE],
  },
  {
    id: "a2-family-arrange-meeting",
    level: "a2",
    canDoIds: ["a2-cando-arrange-meeting"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_ARRANGE_MEETING],
  },

  // --- M3 experiences-narratives ---
  {
    id: "a2-family-experience-takoto",
    level: "a2",
    canDoIds: ["a2-cando-experience-takoto", "a2-cando-ask-experience"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "polarity-tense-form", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_EXPERIENCE_TAKOTO],
  },
  {
    id: "a2-family-narrate-order",
    level: "a2",
    canDoIds: ["a2-cando-narrate-order"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_NARRATE_ORDER],
  },

  // --- M4 reasons-opinions ---
  {
    id: "a2-family-reason-kara",
    level: "a2",
    canDoIds: ["a2-cando-give-reasons", "a2-cando-reason-kara"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_REASON_KARA],
  },
  {
    id: "a2-family-reason-node",
    level: "a2",
    canDoIds: ["a2-cando-reason-node", "a2-cando-give-reasons"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_REASON_NODE],
  },
  {
    id: "a2-family-opinion-toomou",
    level: "a2",
    canDoIds: ["a2-cando-opinion-toomou"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_OPINION_TOOMOU],
  },
  {
    id: "a2-family-agree-disagree",
    level: "a2",
    canDoIds: ["a2-cando-agree-disagree"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_AGREE_DISAGREE],
  },

  // --- M5 sequencing-ongoing ---
  {
    id: "a2-family-te-sequence",
    level: "a2",
    // Also satisfies restaurant-problems-4's primary Can-do
    // (pay-handle-problem): that lesson has no own
    // dedicated construction of its own — it teaches the skill entirely via
    // sequence-te recurrence in a payment/problem-handling context (per
    // the M8 recipe: "support [sequence-te]; te-form recurrence"), so this
    // family is the one that actually realizes every one of its transfers.
    canDoIds: ["a2-cando-sequence-te", "a2-cando-pay-handle-problem"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_SEQUENCE_TE],
  },
  {
    id: "a2-family-te-sequence-object",
    level: "a2",
    canDoIds: ["a2-cando-sequence-te", "a2-cando-describe-now"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "object", axis: "object", valueKind: "object", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "object", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-object",
    requiredConceptIds: [A2_CONCEPT_SEQUENCE_TE],
  },
  {
    id: "a2-family-ongoing-teiru",
    level: "a2",
    canDoIds: ["a2-cando-ongoing-teiru", "a2-cando-describe-ongoing", "a2-cando-morning-routine"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "object", axis: "object", valueKind: "object", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "object", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-object",
    requiredConceptIds: [A2_CONCEPT_ONGOING_TEIRU],
  },

  // --- M6 permission-requests ---
  {
    id: "a2-family-permission-temoii",
    level: "a2",
    canDoIds: ["a2-cando-permission-temoii"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "object", axis: "object", valueKind: "object", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "object", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-object",
    requiredConceptIds: [A2_CONCEPT_PERMISSION_TEMOII],
  },
  {
    id: "a2-family-permission-temoii-location",
    level: "a2",
    canDoIds: ["a2-cando-permission-temoii", "a2-cando-possibility"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "location", axis: "location", valueKind: "location", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "location", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-location",
    requiredConceptIds: [A2_CONCEPT_PERMISSION_TEMOII],
  },
  {
    id: "a2-family-prohibition-tewaikenai",
    level: "a2",
    canDoIds: ["a2-cando-prohibition-tewaikenai"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "object", axis: "object", valueKind: "object", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "object", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-object",
    requiredConceptIds: [A2_CONCEPT_PROHIBITION_TEWAIKENAI],
  },
  {
    id: "a2-family-prohibition-tewaikenai-location",
    level: "a2",
    canDoIds: ["a2-cando-prohibition-tewaikenai"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "location", axis: "location", valueKind: "location", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "location", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-location",
    requiredConceptIds: [A2_CONCEPT_PROHIBITION_TEWAIKENAI],
  },
  {
    id: "a2-family-request-tekudasai",
    level: "a2",
    // Also satisfies neighborhood-services-3's primary Can-do
    // (ask-directions, whose own dedicated whole-clause families
    // ask-where/ask-for-help have no transfers of their own — every
    // ns3 transfer recombines this family instead) and
    // restaurant-problems-2's primary Can-do (special-request, whose
    // t1-t3 transfers use this family too).
    canDoIds: ["a2-cando-request-tekudasai", "a2-cando-ask-directions", "a2-cando-special-request"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "object", axis: "object", valueKind: "object", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "object", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-object",
    requiredConceptIds: [A2_CONCEPT_REQUEST_TEKUDASAI],
  },
  {
    id: "a2-family-negative-request",
    level: "a2",
    canDoIds: ["a2-cando-negative-request"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "object", axis: "object", valueKind: "object", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "object", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-object",
    requiredConceptIds: [A2_CONCEPT_NEGATIVE_REQUEST],
  },

  // --- M7 neighborhood-services ---
  {
    id: "a2-family-possibility",
    level: "a2",
    canDoIds: ["a2-cando-possibility", "a2-cando-can-cannot"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "object", axis: "object", valueKind: "object", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "object", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-object",
    requiredConceptIds: [A2_CONCEPT_POSSIBILITY],
  },
  {
    id: "a2-family-ask-where",
    level: "a2",
    canDoIds: ["a2-cando-ask-directions"],
    slotSchema: [{ id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false }],
    permittedAxes: ["predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_ASK_FOR_HELP],
  },
  {
    id: "a2-family-ask-for-help",
    level: "a2",
    canDoIds: ["a2-cando-ask-directions"],
    slotSchema: [{ id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false }],
    permittedAxes: ["predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_ASK_FOR_HELP],
  },
  {
    id: "a2-family-describe-facility",
    level: "a2",
    canDoIds: ["a2-cando-explain-facility"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "location", axis: "location", valueKind: "location", optional: true },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "location", "context"],
    realizationRuleId: "rule-existence",
    requiredConceptIds: [A2_CONCEPT_DESCRIBE_FACILITY],
  },

  // --- M8 restaurant-problems ---
  {
    id: "a2-family-confirm-understanding",
    level: "a2",
    canDoIds: ["a2-cando-order-food"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_CONFIRM_UNDERSTANDING],
  },
  {
    id: "a2-family-recount-experience",
    level: "a2",
    canDoIds: ["a2-cando-report-problem"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [A2_CONCEPT_RECOUNT_EXPERIENCE],
  },
]);

// ---------------------------------------------------------------------------
// Bilingual copy: shared role/context labels + scenario notes
// ---------------------------------------------------------------------------

export const a2SharedCopy: { readonly en: Readonly<Record<string, string>>; readonly it: Readonly<Record<string, string>> } = deepFreeze({
  en: {
    "a2-role-learner-label": "Me (the learner)",
    "a2-role-emi-label": "Emi",
    "a2-role-sora-label": "Sora",
    "a2-role-teacher-label": "The teacher",
    "a2-role-colleague-label": "A colleague",
    "a2-role-friend-label": "A friend",
    "a2-role-clerk-label": "The shop clerk",
    "a2-referent-self-label": "I",
    "a2-referent-emi-label": "Emi",
    "a2-referent-sora-label": "Sora",
    "a2-referent-teacher-label": "The teacher",
    "a2-referent-colleague-label": "The colleague",
    "a2-referent-friend-label": "The friend",
    "a2-referent-clerk-label": "The clerk",
    "a2-context-conversation-label": "In everyday conversation",
    "a2-context-among-friends-label": "Chatting among friends",
    "a2-context-workplace-label": "At work",
    "a2-context-cafe-label": "At a cafe",
    "a2-context-outing-label": "On an outing",
    "a2-context-plans-label": "Making plans",
    "a2-context-experiences-label": "Talking about past experiences",
    "a2-context-reasons-label": "Explaining reasons and opinions",
    "a2-context-routines-label": "Describing a daily routine",
    "a2-context-rules-label": "Reading signs and rules",
    "a2-context-neighborhood-label": "Around the neighborhood",
    "a2-context-restaurant-label": "At a restaurant",
  },
  it: {
    "a2-role-learner-label": "Io (lo studente)",
    "a2-role-emi-label": "Emi",
    "a2-role-sora-label": "Sora",
    "a2-role-teacher-label": "L'insegnante",
    "a2-role-colleague-label": "Un collega",
    "a2-role-friend-label": "Un amico",
    "a2-role-clerk-label": "Il commesso",
    "a2-referent-self-label": "Io",
    "a2-referent-emi-label": "Emi",
    "a2-referent-sora-label": "Sora",
    "a2-referent-teacher-label": "L'insegnante",
    "a2-referent-colleague-label": "Il collega",
    "a2-referent-friend-label": "L'amico",
    "a2-referent-clerk-label": "Il commesso",
    "a2-context-conversation-label": "In una conversazione quotidiana",
    "a2-context-among-friends-label": "Chiacchierando tra amici",
    "a2-context-workplace-label": "Al lavoro",
    "a2-context-cafe-label": "Al bar",
    "a2-context-outing-label": "Durante una gita",
    "a2-context-plans-label": "Facendo programmi",
    "a2-context-experiences-label": "Parlando di esperienze passate",
    "a2-context-reasons-label": "Spiegando motivi e opinioni",
    "a2-context-routines-label": "Descrivendo una routine quotidiana",
    "a2-context-rules-label": "Leggendo cartelli e regole",
    "a2-context-neighborhood-label": "In giro per il quartiere",
    "a2-context-restaurant-label": "Al ristorante",
  },
});

const A2_CONTEXT_SCENARIO: Readonly<Record<string, Bilingual>> = deepFreeze({
  "a2-context-conversation": {
    en: "You are chatting naturally with someone about everyday things.",
    it: "Stai chiacchierando in modo naturale con qualcuno di cose quotidiane.",
  },
  "a2-context-among-friends": {
    en: "You are talking casually with a close friend.",
    it: "Stai parlando in modo informale con un amico stretto.",
  },
  "a2-context-workplace": {
    en: "You are talking with a colleague at work.",
    it: "Stai parlando con un collega al lavoro.",
  },
  "a2-context-cafe": {
    en: "You are chatting over coffee at a cafe.",
    it: "Stai chiacchierando davanti a un caffè.",
  },
  "a2-context-outing": {
    en: "You are out with friends, deciding what to do next.",
    it: "Sei fuori con amici e decidete cosa fare.",
  },
  "a2-context-plans": {
    en: "You are making plans with someone.",
    it: "Stai facendo programmi con qualcuno.",
  },
  "a2-context-experiences": {
    en: "You are talking about something you have experienced.",
    it: "Stai parlando di qualcosa che hai vissuto.",
  },
  "a2-context-reasons": {
    en: "You are explaining your reasons and sharing your opinion.",
    it: "Stai spiegando le tue ragioni e condividendo la tua opinione.",
  },
  "a2-context-routines": {
    en: "You are describing your daily routine, in order.",
    it: "Stai descrivendo la tua routine quotidiana, in ordine.",
  },
  "a2-context-rules": {
    en: "You are reading a sign or asking about what is and isn't allowed.",
    it: "Stai leggendo un cartello o chiedendo cosa è permesso e cosa no.",
  },
  "a2-context-neighborhood": {
    en: "You are out in the neighborhood, using local services.",
    it: "Sei in giro per il quartiere, usando i servizi locali.",
  },
  "a2-context-restaurant": {
    en: "You are at a restaurant, ordering and dealing with the staff.",
    it: "Sei al ristorante, stai ordinando e parlando con il personale.",
  },
});

/** The situational scenario note for an A2 M1-M4 context. */
export function a2Scenario(contextId: string): Bilingual {
  const scenario = A2_CONTEXT_SCENARIO[contextId];
  if (!scenario) throw new Error(`a2Scenario: missing scenario for context "${contextId}".`);
  return scenario;
}
