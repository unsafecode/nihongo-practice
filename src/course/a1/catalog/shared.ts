/**
 * A1 release shared catalog (Phase 2 Task 2).
 *
 * This module is the deeply-frozen, A1-wide semantic foundation the four A1
 * module files (`module01Sounds`..`module04Actions`) build on. It imports the
 * Phase 1 foundation *engine* contracts (types) and reuses the generalized
 * realizer's stable semantic rule IDs, but it never imports the Phase 1
 * foundation *fixtures*: the release layer authors its own `a1-*` roles,
 * referents, contexts, senses, semantic values, and sentence families.
 *
 * The only place Japanese/romaji lexical content is authored is a
 * `SemanticValue`'s token fragments (through {@link defineA1SemanticValue} or,
 * for the empty copula placeholder, a fragment-free frozen value). Sentence
 * families and variants carry semantic IDs only; rule particles and
 * inflectional endings are owned by the realizer's rules.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  CanDo,
  Context,
  FormSelection,
  FoundationCatalogs,
  FoundationLessonDefinition,
  LearningTargetSense,
  LessonDiversityConstraints,
  LessonPositionRecord,
  LessonPracticeDefinition,
  PedagogicalUse,
  PersonRole,
  Referent,
  SemanticValue,
  SemanticValueTokenFragment,
  SentenceFamily,
  SentenceVariant,
  VerbUseRecord,
} from "../../foundations/types";
import { A1_CANONICAL_POSITIONS } from "../manifest";
import { defineA1Lesson, defineA1SemanticValue, variantFromTuple } from "../authoring";
import type { A1LessonRecipe } from "../types";

// ---------------------------------------------------------------------------
// Small authoring helpers
// ---------------------------------------------------------------------------

/** One authored Japanese/romaji fragment (default "attach" boundary). */
export function frag(
  jp: string,
  romaji: string,
  kind: SemanticValueTokenFragment["kind"] = "lexical",
): SemanticValueTokenFragment {
  return { jp, romaji, kind, boundaryBefore: "attach" };
}

/** The single affirmative-present-polite form every A1 statement uses. */
export const A1_AFFIRMATIVE_PRESENT_POLITE: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "present",
  formality: "polite",
} as const);

/** The interrogative counterpart (adds the sentence-final か + mood). */
export const A1_AFFIRMATIVE_PRESENT_POLITE_QUESTION: FormSelection = deepFreeze({
  polarity: "affirmative",
  tense: "present",
  formality: "polite",
  interrogative: true,
} as const);

/** A bilingual (EN/IT) copy pair. Never carries Japanese. */
export interface Bilingual {
  readonly en: string;
  readonly it: string;
}

// ---------------------------------------------------------------------------
// Concept IDs (A1-owned; every family declares the constructions it needs)
// ---------------------------------------------------------------------------

export const A1_CONCEPT_TOPIC_WA = "a1-concept-topic-wa";
export const A1_CONCEPT_COPULA_DESU = "a1-concept-copula-desu";
export const A1_CONCEPT_INTERROGATIVE_KA = "a1-concept-interrogative-ka";
export const A1_CONCEPT_LOCATION_PARTICLE = "a1-concept-location-particle";
export const A1_CONCEPT_OBJECT_WO = "a1-concept-object-wo";
export const A1_CONCEPT_NOMINATIVE_GA = "a1-concept-nominative-ga";
export const A1_CONCEPT_RECIPIENT_NI = "a1-concept-recipient-ni";
export const A1_CONCEPT_COMPANION_TO = "a1-concept-companion-to";

/** Every A1 concept id, used as the module test's available-concept universe. */
export const A1_CONCEPT_IDS: readonly string[] = deepFreeze([
  A1_CONCEPT_TOPIC_WA,
  A1_CONCEPT_COPULA_DESU,
  A1_CONCEPT_INTERROGATIVE_KA,
  A1_CONCEPT_LOCATION_PARTICLE,
  A1_CONCEPT_OBJECT_WO,
  A1_CONCEPT_NOMINATIVE_GA,
  A1_CONCEPT_RECIPIENT_NI,
  A1_CONCEPT_COMPANION_TO,
]);

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

export const a1Contexts: readonly Context[] = deepFreeze([
  { id: "a1-context-first-meeting", labelCopyId: "a1-context-first-meeting-label" },
  { id: "a1-context-classroom", labelCopyId: "a1-context-classroom-label" },
  { id: "a1-context-workplace", labelCopyId: "a1-context-workplace-label" },
  { id: "a1-context-shop", labelCopyId: "a1-context-shop-label" },
  { id: "a1-context-station", labelCopyId: "a1-context-station-label" },
  { id: "a1-context-cafe", labelCopyId: "a1-context-cafe-label" },
]);

// ---------------------------------------------------------------------------
// Person roles
// ---------------------------------------------------------------------------

export const a1PersonRoles: readonly PersonRole[] = deepFreeze([
  { id: "a1-role-learner", kind: "learner", labelCopyId: "a1-role-learner-label" },
  { id: "a1-role-yuki", kind: "persona", labelCopyId: "a1-role-yuki-label" },
  { id: "a1-role-ken", kind: "persona", labelCopyId: "a1-role-ken-label" },
  { id: "a1-role-mina", kind: "persona", labelCopyId: "a1-role-mina-label" },
  { id: "a1-role-teacher", kind: "social", labelCopyId: "a1-role-teacher-label" },
  { id: "a1-role-classmate", kind: "social", labelCopyId: "a1-role-classmate-label" },
  { id: "a1-role-friend", kind: "social", labelCopyId: "a1-role-friend-label" },
  { id: "a1-role-clerk", kind: "unnamed", labelCopyId: "a1-role-clerk-label" },
  { id: "a1-role-person", kind: "unnamed", labelCopyId: "a1-role-person-label" },
  { id: "a1-role-thing", kind: "unnamed", labelCopyId: "a1-role-thing-label" },
]);

// ---------------------------------------------------------------------------
// Referents
// ---------------------------------------------------------------------------

export const a1Referents: readonly Referent[] = deepFreeze([
  { id: "a1-referent-self", personRoleId: "a1-role-learner", animacy: "animate", labelCopyId: "a1-referent-self-label" },
  { id: "a1-referent-yuki", personRoleId: "a1-role-yuki", animacy: "animate", labelCopyId: "a1-referent-yuki-label" },
  { id: "a1-referent-ken", personRoleId: "a1-role-ken", animacy: "animate", labelCopyId: "a1-referent-ken-label" },
  { id: "a1-referent-mina", personRoleId: "a1-role-mina", animacy: "animate", labelCopyId: "a1-referent-mina-label" },
  { id: "a1-referent-teacher", personRoleId: "a1-role-teacher", animacy: "animate", labelCopyId: "a1-referent-teacher-label" },
  { id: "a1-referent-classmate", personRoleId: "a1-role-classmate", animacy: "animate", labelCopyId: "a1-referent-classmate-label" },
  { id: "a1-referent-friend", personRoleId: "a1-role-friend", animacy: "animate", labelCopyId: "a1-referent-friend-label" },
  { id: "a1-referent-clerk", personRoleId: "a1-role-clerk", animacy: "animate", labelCopyId: "a1-referent-clerk-label" },
  { id: "a1-referent-person", personRoleId: "a1-role-person", animacy: "animate", labelCopyId: "a1-referent-person-label" },
  { id: "a1-referent-thing", personRoleId: "a1-role-thing", animacy: "inanimate", labelCopyId: "a1-referent-thing-label" },
]);

// ---------------------------------------------------------------------------
// Learning target senses (case frames)
// ---------------------------------------------------------------------------
//
// Each sense either declares a particle for every predicate-governed argument
// role it lists, or leaves `argumentParticleByRole` empty when the governing
// rule fixes the particle (を/が/に). `listen` and `ask` deliberately share the
// き orthography but are *distinct senses* with different semantic frames and
// governing rules (を vs に), so recurrence is tracked per-sense, never per
// spelling.

export const a1LearningTargetSenses: readonly LearningTargetSense[] = deepFreeze([
  { id: "a1-sense-be", lexemeId: "a1-lexeme-desu", learningUse: "productive", semanticFrameId: "a1-frame-identity", predicate: "be", argumentRoles: ["topic"], argumentParticleByRole: {} },
  { id: "a1-sense-live", lexemeId: "a1-lexeme-sumu", learningUse: "productive", semanticFrameId: "a1-frame-residence", predicate: "live", argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "ni" } },
  { id: "a1-sense-work", lexemeId: "a1-lexeme-hataraku", learningUse: "productive", semanticFrameId: "a1-frame-work-place", predicate: "work", argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "de" } },
  { id: "a1-sense-study", lexemeId: "a1-lexeme-benkyousuru", learningUse: "productive", semanticFrameId: "a1-frame-study", predicate: "study", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-understand", lexemeId: "a1-lexeme-wakaru", learningUse: "productive", semanticFrameId: "a1-frame-understand", predicate: "understand", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-do", lexemeId: "a1-lexeme-suru", learningUse: "productive", semanticFrameId: "a1-frame-do-activity", predicate: "do", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-go", lexemeId: "a1-lexeme-iku", learningUse: "productive", semanticFrameId: "a1-frame-go", predicate: "go", argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "ni" } },
  { id: "a1-sense-come", lexemeId: "a1-lexeme-kuru", learningUse: "productive", semanticFrameId: "a1-frame-come", predicate: "come", argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "ni" } },
  { id: "a1-sense-accompany", lexemeId: "a1-lexeme-iku", learningUse: "productive", semanticFrameId: "a1-frame-accompany", predicate: "go", argumentRoles: ["agent", "companion"], argumentParticleByRole: {} },
  { id: "a1-sense-eat", lexemeId: "a1-lexeme-taberu", learningUse: "productive", semanticFrameId: "a1-frame-eat", predicate: "eat", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-drink", lexemeId: "a1-lexeme-nomu", learningUse: "productive", semanticFrameId: "a1-frame-drink", predicate: "drink", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-read", lexemeId: "a1-lexeme-yomu", learningUse: "productive", semanticFrameId: "a1-frame-read", predicate: "read", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-write", lexemeId: "a1-lexeme-kaku", learningUse: "productive", semanticFrameId: "a1-frame-write", predicate: "write", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-buy", lexemeId: "a1-lexeme-kau", learningUse: "productive", semanticFrameId: "a1-frame-buy", predicate: "buy", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-see", lexemeId: "a1-lexeme-miru", learningUse: "productive", semanticFrameId: "a1-frame-see", predicate: "see", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-listen", lexemeId: "a1-lexeme-kiku", learningUse: "productive", semanticFrameId: "a1-frame-listen", predicate: "listen", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "a1-sense-ask", lexemeId: "a1-lexeme-kiku", learningUse: "productive", semanticFrameId: "a1-frame-ask", predicate: "ask", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
]);

// ---------------------------------------------------------------------------
// Semantic values (the ONLY place Japanese/romaji lexical content is authored)
// ---------------------------------------------------------------------------

/** The empty copula placeholder value: です is emitted by the rule ending, so
 * the `be` predicate sense contributes no fragment. Authored directly (not via
 * `defineA1SemanticValue`, which requires a non-empty fragment) but still
 * frozen and free of any Japanese literal. */
const a1CopulaValue: SemanticValue = deepFreeze({
  id: "a1-value-be",
  kind: "predicate-sense",
  senseId: "a1-sense-be",
  tokenFragments: [],
});

const a1AuthoredValues: readonly SemanticValue[] = [
  // --- referent-kind (subject surface forms) ---
  { id: "a1-value-watashi", kind: "referent", animacy: "animate", tokenFragments: [frag("わたし", "watashi")] },
  { id: "a1-value-yuki", kind: "referent", animacy: "animate", tokenFragments: [frag("ゆき", "yuki")] },
  { id: "a1-value-ken", kind: "referent", animacy: "animate", tokenFragments: [frag("けん", "ken")] },
  { id: "a1-value-mina", kind: "referent", animacy: "animate", tokenFragments: [frag("みな", "mina")] },
  { id: "a1-value-teacher-subject", kind: "referent", animacy: "animate", tokenFragments: [frag("せんせい", "sensei")] },
  { id: "a1-value-classmate-subject", kind: "referent", animacy: "animate", tokenFragments: [frag("クラスメート", "kurasumeeto")] },
  { id: "a1-value-friend-subject", kind: "referent", animacy: "animate", tokenFragments: [frag("ともだち", "tomodachi")] },
  { id: "a1-value-clerk-subject", kind: "referent", animacy: "animate", tokenFragments: [frag("てんいん", "ten'in")] },
  // demonstrative pronouns (inanimate subjects)
  { id: "a1-value-kore", kind: "referent", animacy: "inanimate", tokenFragments: [frag("これ", "kore")] },
  { id: "a1-value-sore", kind: "referent", animacy: "inanimate", tokenFragments: [frag("それ", "sore")] },
  { id: "a1-value-are", kind: "referent", animacy: "inanimate", tokenFragments: [frag("あれ", "are")] },
  // adnominal compound subjects (animate)
  { id: "a1-value-kono-hito", kind: "referent", animacy: "animate", tokenFragments: [frag("この", "kono"), frag("ひと", "hito")] },
  { id: "a1-value-sono-hito", kind: "referent", animacy: "animate", tokenFragments: [frag("その", "sono"), frag("ひと", "hito")] },
  { id: "a1-value-ano-hito", kind: "referent", animacy: "animate", tokenFragments: [frag("あの", "ano"), frag("ひと", "hito")] },
  // item subjects (inanimate)
  { id: "a1-value-toire-subject", kind: "referent", animacy: "inanimate", tokenFragments: [frag("トイレ", "toire")] },
  { id: "a1-value-paatii-subject", kind: "referent", animacy: "inanimate", tokenFragments: [frag("パーティー", "paatii")] },
  { id: "a1-value-mikan-subject", kind: "referent", animacy: "inanimate", tokenFragments: [frag("みかん", "mikan")] },
  { id: "a1-value-eki-subject", kind: "referent", animacy: "inanimate", tokenFragments: [frag("えき", "eki")] },

  // --- predicate-sense-kind (polite ます-stems; endings belong to rules) ---
  { id: "a1-value-live", kind: "predicate-sense", senseId: "a1-sense-live", tokenFragments: [frag("すみ", "sumi")] },
  { id: "a1-value-work", kind: "predicate-sense", senseId: "a1-sense-work", tokenFragments: [frag("はたらき", "hataraki")] },
  { id: "a1-value-study", kind: "predicate-sense", senseId: "a1-sense-study", tokenFragments: [frag("べんきょうし", "benkyoushi")] },
  { id: "a1-value-understand", kind: "predicate-sense", senseId: "a1-sense-understand", tokenFragments: [frag("わかり", "wakari")] },
  { id: "a1-value-do", kind: "predicate-sense", senseId: "a1-sense-do", tokenFragments: [frag("し", "shi")] },
  { id: "a1-value-go", kind: "predicate-sense", senseId: "a1-sense-go", tokenFragments: [frag("いき", "iki")] },
  { id: "a1-value-come", kind: "predicate-sense", senseId: "a1-sense-come", tokenFragments: [frag("き", "ki")] },
  { id: "a1-value-accompany", kind: "predicate-sense", senseId: "a1-sense-accompany", tokenFragments: [frag("いき", "iki")] },
  { id: "a1-value-eat", kind: "predicate-sense", senseId: "a1-sense-eat", tokenFragments: [frag("たべ", "tabe")] },
  { id: "a1-value-drink", kind: "predicate-sense", senseId: "a1-sense-drink", tokenFragments: [frag("のみ", "nomi")] },
  { id: "a1-value-read", kind: "predicate-sense", senseId: "a1-sense-read", tokenFragments: [frag("よみ", "yomi")] },
  { id: "a1-value-write", kind: "predicate-sense", senseId: "a1-sense-write", tokenFragments: [frag("かき", "kaki")] },
  { id: "a1-value-buy", kind: "predicate-sense", senseId: "a1-sense-buy", tokenFragments: [frag("かい", "kai")] },
  { id: "a1-value-see", kind: "predicate-sense", senseId: "a1-sense-see", tokenFragments: [frag("み", "mi")] },
  { id: "a1-value-listen", kind: "predicate-sense", senseId: "a1-sense-listen", tokenFragments: [frag("きき", "kiki")] },
  { id: "a1-value-ask", kind: "predicate-sense", senseId: "a1-sense-ask", tokenFragments: [frag("きき", "kiki")] },

  // --- object-kind (copular complements: occupations / nationalities) ---
  { id: "a1-value-obj-student", kind: "object", tokenFragments: [frag("がくせい", "gakusei")] },
  { id: "a1-value-obj-teacher", kind: "object", tokenFragments: [frag("せんせい", "sensei")] },
  { id: "a1-value-obj-doctor", kind: "object", tokenFragments: [frag("いしゃ", "isha")] },
  { id: "a1-value-obj-office-worker", kind: "object", tokenFragments: [frag("かいしゃいん", "kaishain")] },
  { id: "a1-value-obj-engineer", kind: "object", tokenFragments: [frag("エンジニア", "enjinia")] },
  { id: "a1-value-obj-clerk", kind: "object", tokenFragments: [frag("てんいん", "ten'in")] },
  { id: "a1-value-obj-japanese-person", kind: "object", tokenFragments: [frag("にほんじん", "nihonjin")] },
  { id: "a1-value-obj-italian-person", kind: "object", tokenFragments: [frag("イタリアじん", "itariajin")] },
  { id: "a1-value-obj-american-person", kind: "object", tokenFragments: [frag("アメリカじん", "amerikajin")] },
  // languages (を objects for study; が objects for understand)
  { id: "a1-value-obj-japanese", kind: "object", tokenFragments: [frag("にほんご", "nihongo")] },
  { id: "a1-value-obj-english", kind: "object", tokenFragments: [frag("えいご", "eigo")] },
  { id: "a1-value-obj-italian", kind: "object", tokenFragments: [frag("イタリアご", "itariago")] },
  // action objects (を)
  { id: "a1-value-obj-coffee", kind: "object", tokenFragments: [frag("コーヒー", "koohii")] },
  { id: "a1-value-obj-water", kind: "object", tokenFragments: [frag("みず", "mizu")] },
  { id: "a1-value-obj-tea", kind: "object", tokenFragments: [frag("おちゃ", "ocha")] },
  { id: "a1-value-obj-sushi", kind: "object", tokenFragments: [frag("すし", "sushi")] },
  { id: "a1-value-obj-bread", kind: "object", tokenFragments: [frag("パン", "pan")] },
  { id: "a1-value-obj-ramen", kind: "object", tokenFragments: [frag("ラーメン", "raamen")] },
  { id: "a1-value-obj-book", kind: "object", tokenFragments: [frag("ほん", "hon")] },
  { id: "a1-value-obj-letter", kind: "object", tokenFragments: [frag("てがみ", "tegami")] },
  { id: "a1-value-obj-newspaper", kind: "object", tokenFragments: [frag("しんぶん", "shinbun")] },
  { id: "a1-value-obj-movie", kind: "object", tokenFragments: [frag("えいが", "eiga")] },
  { id: "a1-value-obj-music", kind: "object", tokenFragments: [frag("おんがく", "ongaku")] },
  { id: "a1-value-obj-tv", kind: "object", tokenFragments: [frag("テレビ", "terebi")] },
  { id: "a1-value-obj-homework", kind: "object", tokenFragments: [frag("しゅくだい", "shukudai")] },
  // question-word complements (object-kind)
  { id: "a1-value-q-nan", kind: "object", tokenFragments: [frag("なん", "nan")] },
  { id: "a1-value-q-nani", kind: "object", tokenFragments: [frag("なに", "nani")] },
  { id: "a1-value-q-dare", kind: "object", tokenFragments: [frag("だれ", "dare")] },
  { id: "a1-value-q-doko", kind: "object", tokenFragments: [frag("どこ", "doko")] },
  { id: "a1-value-q-itsu", kind: "object", tokenFragments: [frag("いつ", "itsu")] },
  { id: "a1-value-q-ikura", kind: "object", tokenFragments: [frag("いくら", "ikura")] },
  { id: "a1-value-q-ikutsu", kind: "object", tokenFragments: [frag("いくつ", "ikutsu")] },
  { id: "a1-value-q-dore", kind: "object", tokenFragments: [frag("どれ", "dore")] },
  { id: "a1-value-q-dono-hon", kind: "object", tokenFragments: [frag("どの", "dono"), frag("ほん", "hon")] },
  // companion / recipient nouns (object-kind; と/に owned by the rule)
  { id: "a1-value-companion-friend", kind: "object", tokenFragments: [frag("ともだち", "tomodachi")] },
  { id: "a1-value-companion-classmate", kind: "object", tokenFragments: [frag("クラスメート", "kurasumeeto")] },
  { id: "a1-value-recipient-teacher", kind: "object", tokenFragments: [frag("せんせい", "sensei")] },
  { id: "a1-value-recipient-clerk", kind: "object", tokenFragments: [frag("てんいん", "ten'in")] },

  // --- location-kind (に/で per governing sense) ---
  { id: "a1-value-loc-tokyo", kind: "location", tokenFragments: [frag("とうきょう", "toukyou")] },
  { id: "a1-value-loc-osaka", kind: "location", tokenFragments: [frag("おおさか", "oosaka")] },
  { id: "a1-value-loc-kyoto", kind: "location", tokenFragments: [frag("きょうと", "kyouto")] },
  { id: "a1-value-loc-company", kind: "location", tokenFragments: [frag("かいしゃ", "kaisha")] },
  { id: "a1-value-loc-school", kind: "location", tokenFragments: [frag("がっこう", "gakkou")] },
  { id: "a1-value-loc-station", kind: "location", tokenFragments: [frag("えき", "eki")] },
  { id: "a1-value-loc-library", kind: "location", tokenFragments: [frag("としょかん", "toshokan")] },
  { id: "a1-value-loc-shop", kind: "location", tokenFragments: [frag("みせ", "mise")] },
  { id: "a1-value-loc-restaurant", kind: "location", tokenFragments: [frag("レストラン", "resutoran")] },
  { id: "a1-value-loc-supermarket", kind: "location", tokenFragments: [frag("スーパー", "suupaa")] },
  { id: "a1-value-loc-cafe", kind: "location", tokenFragments: [frag("カフェ", "kafe")] },
  { id: "a1-value-loc-park", kind: "location", tokenFragments: [frag("こうえん", "kouen")] },
];

export const a1SemanticValues: readonly SemanticValue[] = deepFreeze([
  a1CopulaValue,
  ...a1AuthoredValues.map((value) => defineA1SemanticValue(value)),
]);

// ---------------------------------------------------------------------------
// Sentence families (reference the realizer's stable semantic rule ids)
// ---------------------------------------------------------------------------

export const a1SentenceFamilies: readonly SentenceFamily[] = deepFreeze([
  {
    id: "a1-family-topic-copular",
    level: "a1",
    canDoIds: ["a1-can-do-identity"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-topic-copular",
    requiredConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_COPULA_DESU, A1_CONCEPT_INTERROGATIVE_KA],
  },
  {
    id: "a1-family-location-action",
    level: "a1",
    canDoIds: ["a1-can-do-identity", "a1-can-do-actions"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "location", axis: "location", valueKind: "location", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "location", "polarity-tense-form", "context"],
    realizationRuleId: "rule-location-action",
    requiredConceptIds: [A1_CONCEPT_LOCATION_PARTICLE],
  },
  {
    id: "a1-family-object-action",
    level: "a1",
    canDoIds: ["a1-can-do-actions"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-object-action",
    requiredConceptIds: [A1_CONCEPT_OBJECT_WO],
  },
  {
    id: "a1-family-nominative-action",
    level: "a1",
    canDoIds: ["a1-can-do-actions"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-nominative-action",
    requiredConceptIds: [A1_CONCEPT_NOMINATIVE_GA],
  },
  {
    id: "a1-family-recipient-action",
    level: "a1",
    canDoIds: ["a1-can-do-actions"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-recipient-action",
    requiredConceptIds: [A1_CONCEPT_RECIPIENT_NI],
  },
  {
    id: "a1-family-companion-action",
    level: "a1",
    canDoIds: ["a1-can-do-actions"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "companion", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-companion-action",
    requiredConceptIds: [A1_CONCEPT_COMPANION_TO],
  },
]);

// ---------------------------------------------------------------------------
// Can-do stubs (stable ids; Task 4 authors the full entries)
// ---------------------------------------------------------------------------

export const a1CanDos: readonly CanDo[] = deepFreeze([
  { id: "a1-can-do-sounds", level: "a1", domain: "listening", descriptorCopyId: "a1-can-do-sounds-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-identity", level: "a1", domain: "interaction", descriptorCopyId: "a1-can-do-identity-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-origins", level: "a1", domain: "interaction", descriptorCopyId: "a1-can-do-origins-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-questions", level: "a1", domain: "interaction", descriptorCopyId: "a1-can-do-questions-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-actions", level: "a1", domain: "spoken-production", descriptorCopyId: "a1-can-do-actions-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-daily-life", level: "a1", domain: "spoken-production", descriptorCopyId: "a1-can-do-daily-life-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
]);

// ---------------------------------------------------------------------------
// Variant builder (variant + its bilingual copy in one honest step)
// ---------------------------------------------------------------------------

/** The stable copy id holding a variant's natural translation (mirrors the
 * builder convention `${variantId}-translation`). */
export function a1TranslationCopyId(variantId: string): string {
  return `${variantId}-translation`;
}

/** The stable copy id holding a variant's scenario note. */
export function a1ScenarioCopyId(variantId: string): string {
  return `${variantId}-scenario`;
}

export interface A1VariantSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly speakerRole: string;
  readonly addresseeRole: string | null;
  readonly subjectReferent: string | null;
  readonly subjectRealization: "explicit" | "omitted";
  readonly slots: Readonly<Record<string, string>>;
  readonly interrogative?: boolean;
  readonly use: PedagogicalUse;
  readonly translation: Bilingual;
  readonly scenario: Bilingual;
}

export interface A1BuiltVariant {
  readonly variant: SentenceVariant;
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
}

/**
 * Expand a compact spec into a frozen `SentenceVariant` (via the authoring
 * `variantFromTuple`, which rejects any Japanese literal) plus its EN/IT copy
 * entries. Discourse `scenarioNoteCopyId` follows the `${id}-scenario`
 * convention so the view-model builder resolves constrained-construction
 * intent text against it.
 */
export function a1Variant(spec: A1VariantSpec): A1BuiltVariant {
  const variant = variantFromTuple({
    id: spec.id,
    familyId: spec.family,
    discourse: {
      speakerRoleId: spec.speakerRole,
      addresseeRoleId: spec.addresseeRole,
      subjectReferentId: spec.subjectReferent,
      subjectRealization: spec.subjectRealization,
      scenarioNoteCopyId: a1ScenarioCopyId(spec.id),
    },
    contextId: spec.context,
    slotValues: spec.slots,
    form: spec.interrogative
      ? A1_AFFIRMATIVE_PRESENT_POLITE_QUESTION
      : A1_AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: spec.use,
  });
  return {
    variant,
    en: {
      [a1TranslationCopyId(spec.id)]: spec.translation.en,
      [a1ScenarioCopyId(spec.id)]: spec.scenario.en,
    },
    it: {
      [a1TranslationCopyId(spec.id)]: spec.translation.it,
      [a1ScenarioCopyId(spec.id)]: spec.scenario.it,
    },
  };
}

// ---------------------------------------------------------------------------
// Structure key (mirrors validateFoundations §9.3) for verb-recurrence tests
// ---------------------------------------------------------------------------

/** A verb's structure key: family, subject realization, form, and sorted slot
 * shape — deliberately excluding person/context/value ids. Two intro variants
 * with different structure keys count as structurally distinct (§9.3 rule 2). */
export function a1StructureKey(variant: SentenceVariant): string {
  const slots = Object.keys(variant.slotValues).slice().sort().join(",");
  const f = variant.form;
  return `${variant.sentenceFamilyId}|${variant.discourse.subjectRealization}|${f.polarity}:${f.tense}:${f.formality}|${slots}`;
}

// ---------------------------------------------------------------------------
// Foundation-catalog assembly (for the module-local view-model pipeline)
// ---------------------------------------------------------------------------

export interface AssembleA1CatalogsInput {
  /** Instructional lesson recipes (modules 2-4) to expose to the builder. */
  readonly lessons: readonly A1LessonRecipe[];
  /** Every authored sentence variant referenced by the lessons. */
  readonly variants: readonly SentenceVariant[];
  /** Productive verb-use records (module-local; later reuse may be pending). */
  readonly verbUseRecords?: readonly VerbUseRecord[];
}

/**
 * Convert an A1 instructional lesson recipe into the Phase 1
 * `FoundationLessonDefinition` the view-model builder consumes. `familyIds` is
 * derived from the union of the lesson's model variants' families (authored
 * order preserved), never hand-declared.
 */
function toFoundationLesson(
  recipe: A1LessonRecipe,
  variantById: ReadonlyMap<string, SentenceVariant>,
): FoundationLessonDefinition {
  const familyIds: string[] = [];
  for (const variantId of recipe.modelVariantIds) {
    const variant = variantById.get(variantId);
    if (variant && !familyIds.includes(variant.sentenceFamilyId)) {
      familyIds.push(variant.sentenceFamilyId);
    }
  }
  return {
    id: recipe.id,
    level: "a1",
    moduleId: recipe.moduleId,
    primaryCanDoId: recipe.primaryCanDoId,
    supportingCanDoIds: recipe.supportingCanDoIds,
    modelVariantIds: recipe.modelVariantIds,
    familyIds,
    practice: recipe.practice,
    diversityConstraints: recipe.diversityConstraints,
  };
}

/**
 * Build a `FoundationCatalogs` from the shared A1 catalogs plus a set of
 * instructional lessons and their variants, ready for `buildLessonViewModel`,
 * `realizeVariant`, `selectVariants`, and `generateFamilyExercise`. Levels,
 * modules and checkpoints are intentionally empty — the view-model pipeline
 * reads none of them — while lesson positions come from the canonical manifest
 * so verb-recurrence tests can reason about ordering.
 */
export function assembleA1FoundationCatalogs(
  input: AssembleA1CatalogsInput,
): FoundationCatalogs {
  const variantById = new Map(input.variants.map((v) => [v.id, v]));
  const lessons = input.lessons.map((recipe) =>
    toFoundationLesson(recipe, variantById),
  );
  const lessonPositions: LessonPositionRecord[] = input.lessons.map((recipe) => ({
    lessonId: recipe.id,
    level: "a1",
    moduleId: recipe.moduleId,
    position: A1_CANONICAL_POSITIONS[recipe.id] ?? 0,
  }));
  return {
    levels: [],
    modules: [],
    checkpoints: [],
    canDos: a1CanDos,
    contexts: a1Contexts,
    personRoles: a1PersonRoles,
    referents: a1Referents,
    learningTargetSenses: a1LearningTargetSenses,
    semanticValues: a1SemanticValues,
    sentenceFamilies: a1SentenceFamilies,
    sentenceVariants: input.variants,
    lessons,
    lessonPositions,
    verbUseRecords: input.verbUseRecords ?? [],
  };
}

// ---------------------------------------------------------------------------
// Shared copy (role/context/referent labels + Can-do descriptors)
// ---------------------------------------------------------------------------

/**
 * Copy shared across all four modules: person-role labels, context labels,
 * referent labels, and Can-do descriptors. Flat, identical key sets per locale,
 * never Japanese. Module files contribute their own translation/scenario keys.
 */
export const a1SharedCopy: { readonly en: Readonly<Record<string, string>>; readonly it: Readonly<Record<string, string>> } = deepFreeze({
  en: {
    "a1-role-learner-label": "Me (the learner)",
    "a1-role-yuki-label": "Yuki",
    "a1-role-ken-label": "Ken",
    "a1-role-mina-label": "Mina",
    "a1-role-teacher-label": "The teacher",
    "a1-role-classmate-label": "A classmate",
    "a1-role-friend-label": "A friend",
    "a1-role-clerk-label": "The shop clerk",
    "a1-role-person-label": "A person",
    "a1-role-thing-label": "A thing",
    "a1-referent-self-label": "I",
    "a1-referent-yuki-label": "Yuki",
    "a1-referent-ken-label": "Ken",
    "a1-referent-mina-label": "Mina",
    "a1-referent-teacher-label": "The teacher",
    "a1-referent-classmate-label": "The classmate",
    "a1-referent-friend-label": "The friend",
    "a1-referent-clerk-label": "The clerk",
    "a1-referent-person-label": "The person",
    "a1-referent-thing-label": "The thing",
    "a1-context-first-meeting-label": "Meeting someone for the first time",
    "a1-context-classroom-label": "In the language classroom",
    "a1-context-workplace-label": "At work",
    "a1-context-shop-label": "In a shop",
    "a1-context-station-label": "At the station",
    "a1-context-cafe-label": "In a cafe",
    "a1-can-do-sounds-descriptor": "I can hear and read the basic sounds of Japanese.",
    "a1-can-do-identity-descriptor": "I can say who I am and give a few personal details.",
    "a1-can-do-origins-descriptor": "I can say where I am from and what languages I use.",
    "a1-can-do-questions-descriptor": "I can ask simple questions about people and things.",
    "a1-can-do-actions-descriptor": "I can say what I do with everyday objects and places.",
    "a1-can-do-daily-life-descriptor": "I can describe simple everyday activities.",
    "a1-module-outcome-introductions": "You can introduce yourself and other people with a few key facts.",
    "a1-module-outcome-essential-questions": "You can ask and recognize the everyday questions that keep a conversation going.",
    "a1-module-outcome-actions": "You can say what you and others do with everyday things, places, and people.",
  },
  it: {
    "a1-role-learner-label": "Io (chi impara)",
    "a1-role-yuki-label": "Yuki",
    "a1-role-ken-label": "Ken",
    "a1-role-mina-label": "Mina",
    "a1-role-teacher-label": "L'insegnante",
    "a1-role-classmate-label": "Un compagno di classe",
    "a1-role-friend-label": "Un amico",
    "a1-role-clerk-label": "Il commesso",
    "a1-role-person-label": "Una persona",
    "a1-role-thing-label": "Una cosa",
    "a1-referent-self-label": "Io",
    "a1-referent-yuki-label": "Yuki",
    "a1-referent-ken-label": "Ken",
    "a1-referent-mina-label": "Mina",
    "a1-referent-teacher-label": "L'insegnante",
    "a1-referent-classmate-label": "Il compagno di classe",
    "a1-referent-friend-label": "L'amico",
    "a1-referent-clerk-label": "Il commesso",
    "a1-referent-person-label": "La persona",
    "a1-referent-thing-label": "La cosa",
    "a1-context-first-meeting-label": "Conoscere qualcuno per la prima volta",
    "a1-context-classroom-label": "Nell'aula di lingua",
    "a1-context-workplace-label": "Al lavoro",
    "a1-context-shop-label": "In un negozio",
    "a1-context-station-label": "Alla stazione",
    "a1-context-cafe-label": "In un bar",
    "a1-can-do-sounds-descriptor": "So sentire e leggere i suoni di base del giapponese.",
    "a1-can-do-identity-descriptor": "So dire chi sono e dare alcuni dati personali.",
    "a1-can-do-origins-descriptor": "So dire da dove vengo e quali lingue uso.",
    "a1-can-do-questions-descriptor": "So fare domande semplici su persone e cose.",
    "a1-can-do-actions-descriptor": "So dire cosa faccio con oggetti e luoghi di tutti i giorni.",
    "a1-can-do-daily-life-descriptor": "So descrivere semplici attività quotidiane.",
    "a1-module-outcome-introductions": "Sai presentare te stesso e altre persone con alcuni dati chiave.",
    "a1-module-outcome-essential-questions": "Sai fare e riconoscere le domande quotidiane che tengono viva una conversazione.",
    "a1-module-outcome-actions": "Sai dire cosa fai tu e gli altri con le cose, i luoghi e le persone di ogni giorno.",
  },
});

// ---------------------------------------------------------------------------
// Bilingual copy composition helpers
// ---------------------------------------------------------------------------
//
// These helpers assemble *natural* English/Italian translations and scenario
// notes from small gloss tables so the module files stay DRY and consistent.
// They emit only English/Italian text — never Japanese — so they are safe to
// call outside the `defineA1SemanticValue` path.

/** Subject noun-phrase glosses, keyed by the subject slot's semantic value. */
export const A1_SUBJECT_GLOSS: Readonly<Record<string, Bilingual>> = deepFreeze({
  "a1-value-watashi": { en: "I", it: "Io" },
  "a1-value-yuki": { en: "Yuki", it: "Yuki" },
  "a1-value-ken": { en: "Ken", it: "Ken" },
  "a1-value-mina": { en: "Mina", it: "Mina" },
  "a1-value-teacher-subject": { en: "The teacher", it: "L'insegnante" },
  "a1-value-classmate-subject": { en: "The classmate", it: "Il compagno di classe" },
  "a1-value-friend-subject": { en: "The friend", it: "L'amico" },
  "a1-value-clerk-subject": { en: "The clerk", it: "Il commesso" },
  "a1-value-kore": { en: "This one", it: "Questo" },
  "a1-value-sore": { en: "That one", it: "Quello" },
  "a1-value-are": { en: "That one over there", it: "Quello là" },
  "a1-value-kono-hito": { en: "This person", it: "Questa persona" },
  "a1-value-sono-hito": { en: "That person", it: "Quella persona" },
  "a1-value-ano-hito": { en: "That person over there", it: "Quella persona là" },
  "a1-value-toire-subject": { en: "The toilet", it: "Il bagno" },
  "a1-value-paatii-subject": { en: "The party", it: "La festa" },
  "a1-value-mikan-subject": { en: "The tangerines", it: "I mandarini" },
  "a1-value-eki-subject": { en: "The station", it: "La stazione" },
});

/** Copular-complement glosses (occupations, nationalities). */
export const A1_COMPLEMENT_GLOSS: Readonly<Record<string, Bilingual>> = deepFreeze({
  "a1-value-obj-student": { en: "a student", it: "uno studente" },
  "a1-value-obj-teacher": { en: "a teacher", it: "un insegnante" },
  "a1-value-obj-doctor": { en: "a doctor", it: "un medico" },
  "a1-value-obj-office-worker": { en: "an office worker", it: "un impiegato" },
  "a1-value-obj-engineer": { en: "an engineer", it: "un ingegnere" },
  "a1-value-obj-clerk": { en: "a shop clerk", it: "un commesso" },
  "a1-value-obj-japanese-person": { en: "Japanese", it: "giapponese" },
  "a1-value-obj-italian-person": { en: "Italian", it: "italiano" },
  "a1-value-obj-american-person": { en: "American", it: "americano" },
});

/** Verb-object (theme) glosses, article baked in for natural target text. */
export const A1_OBJECT_GLOSS: Readonly<Record<string, Bilingual>> = deepFreeze({
  "a1-value-obj-japanese": { en: "Japanese", it: "il giapponese" },
  "a1-value-obj-english": { en: "English", it: "l'inglese" },
  "a1-value-obj-italian": { en: "Italian", it: "l'italiano" },
  "a1-value-obj-coffee": { en: "coffee", it: "il caffè" },
  "a1-value-obj-water": { en: "water", it: "l'acqua" },
  "a1-value-obj-tea": { en: "tea", it: "il tè" },
  "a1-value-obj-sushi": { en: "sushi", it: "il sushi" },
  "a1-value-obj-bread": { en: "bread", it: "il pane" },
  "a1-value-obj-ramen": { en: "ramen", it: "il ramen" },
  "a1-value-obj-book": { en: "a book", it: "un libro" },
  "a1-value-obj-letter": { en: "a letter", it: "una lettera" },
  "a1-value-obj-newspaper": { en: "the newspaper", it: "il giornale" },
  "a1-value-obj-movie": { en: "a movie", it: "un film" },
  "a1-value-obj-music": { en: "music", it: "la musica" },
  "a1-value-obj-tv": { en: "TV", it: "la TV" },
  "a1-value-obj-homework": { en: "homework", it: "i compiti" },
});

/** Verb clause templates for object/nominative predicates (3rd-person). */
const A1_VERB_CLAUSE: Readonly<
  Record<string, { en: (o: string) => string; it: (o: string) => string }>
> = {
  "a1-sense-study": { en: (o) => `studies ${o}`, it: (o) => `studia ${o}` },
  "a1-sense-do": { en: (o) => `does ${o}`, it: (o) => `fa ${o}` },
  "a1-sense-understand": { en: (o) => `understands ${o}`, it: (o) => `capisce ${o}` },
  "a1-sense-eat": { en: (o) => `eats ${o}`, it: (o) => `mangia ${o}` },
  "a1-sense-drink": { en: (o) => `drinks ${o}`, it: (o) => `beve ${o}` },
  "a1-sense-read": { en: (o) => `reads ${o}`, it: (o) => `legge ${o}` },
  "a1-sense-write": { en: (o) => `writes ${o}`, it: (o) => `scrive ${o}` },
  "a1-sense-buy": { en: (o) => `buys ${o}`, it: (o) => `compra ${o}` },
  "a1-sense-see": { en: (o) => `watches ${o}`, it: (o) => `guarda ${o}` },
  "a1-sense-listen": { en: (o) => `listens to ${o}`, it: (o) => `ascolta ${o}` },
};

/** Situational scenario notes, keyed by context (nonempty, natural, no JP). */
export const A1_CONTEXT_SCENARIO: Readonly<Record<string, Bilingual>> = deepFreeze({
  "a1-context-first-meeting": {
    en: "You have just met someone and are introducing yourselves.",
    it: "Hai appena conosciuto qualcuno e vi state presentando.",
  },
  "a1-context-classroom": {
    en: "You are in the language class, talking about your studies.",
    it: "Sei nell'aula di lingua e parli dei tuoi studi.",
  },
  "a1-context-workplace": {
    en: "You are chatting with a colleague at work.",
    it: "Chiacchieri con un collega al lavoro.",
  },
  "a1-context-shop": {
    en: "You are at the shop counter.",
    it: "Sei al banco del negozio.",
  },
  "a1-context-station": {
    en: "You are asking for help at the station.",
    it: "Chiedi aiuto alla stazione.",
  },
  "a1-context-cafe": {
    en: "You are ordering and chatting at a cafe.",
    it: "Ordini e chiacchieri al bar.",
  },
});

function glossOrThrow(
  table: Readonly<Record<string, Bilingual>>,
  id: string,
  kind: string,
): Bilingual {
  const g = table[id];
  if (!g) throw new Error(`Missing ${kind} gloss for "${id}".`);
  return g;
}

/** Natural "X is a Y" copular translation (handles first-person agreement). */
export function a1Copular(subjectValueId: string, complementValueId: string): Bilingual {
  const subj = glossOrThrow(A1_SUBJECT_GLOSS, subjectValueId, "subject");
  const comp = glossOrThrow(A1_COMPLEMENT_GLOSS, complementValueId, "complement");
  const first = subjectValueId === "a1-value-watashi";
  return {
    en: `${subj.en} ${first ? "am" : "is"} ${comp.en}.`,
    it: `${subj.it} ${first ? "sono" : "è"} ${comp.it}.`,
  };
}

/** Natural "X <verb>s <object>" translation for object/nominative predicates. */
export function a1VerbObject(
  subjectValueId: string,
  senseId: string,
  objectValueId: string,
): Bilingual {
  const subj = glossOrThrow(A1_SUBJECT_GLOSS, subjectValueId, "subject");
  const obj = glossOrThrow(A1_OBJECT_GLOSS, objectValueId, "object");
  const clause = A1_VERB_CLAUSE[senseId];
  if (!clause) throw new Error(`Missing verb clause for "${senseId}".`);
  return {
    en: `${subj.en} ${clause.en(obj.en)}.`,
    it: `${subj.it} ${clause.it(obj.it)}.`,
  };
}

/** The situational scenario note for a context. */
export function a1Scenario(contextId: string): Bilingual {
  return glossOrThrow(A1_CONTEXT_SCENARIO, contextId, "scenario");
}

// ---------------------------------------------------------------------------
// Instructional-lesson builder (models + transfers + practice + copy)
// ---------------------------------------------------------------------------
//
// One compact record per sentence line. Speaker defaults to the learner and
// addressee to the teacher (the standard A1 "learner asks/answers" framing);
// either may be overridden. The scenario note is derived from the context so
// every constrained-construction target resolves a real, natural intent.

export interface A1LineSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly subjectReferent: string | null;
  readonly subjectRealization: "explicit" | "omitted";
  readonly slots: Readonly<Record<string, string>>;
  readonly interrogative?: boolean;
  readonly translation: Bilingual;
  readonly speakerRole?: string;
  readonly addresseeRole?: string | null;
}

export interface A1InstructionalLessonInput {
  readonly id: string;
  readonly moduleId: string;
  readonly order: 1 | 2 | 3 | 4;
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly introducedSenseIds: readonly string[];
  readonly models: readonly A1LineSpec[];
  readonly transfers: readonly A1LineSpec[];
}

export interface A1BuiltLesson {
  readonly recipe: A1LessonRecipe;
  readonly variants: readonly SentenceVariant[];
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
}

const A1_ROUND_ONE_KINDS = ["tile-ordering", "choice", "completion"] as const;
const A1_ROUND_TWO_KINDS = [
  "constrained-construction",
  "completion",
  "tile-ordering",
] as const;

/** Referent → its person-role, derived from the frozen referent catalog. */
const A1_REFERENT_ROLE: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(a1Referents.map((r) => [r.id, r.personRoleId])),
);

/** Referents that are concrete, animate, named people who can voice a line.
 * Used to default a statement's speaker to its own subject (the self-
 * description convention the foundation fixtures also follow), while generic
 * subjects (self, an unnamed person, an inanimate thing, or none) fall back to
 * the learner as speaker. Question lessons override the speaker explicitly to
 * model who is actually asking. */
const A1_VOICEABLE_REFERENTS: ReadonlySet<string> = new Set([
  "a1-referent-yuki",
  "a1-referent-ken",
  "a1-referent-mina",
  "a1-referent-teacher",
  "a1-referent-classmate",
  "a1-referent-clerk",
  "a1-referent-friend",
]);

/** The default speaker for a line: an explicit override, else the subject's own
 * role when the subject is a named animate person, else the learner. Speaker
 * identity is discourse-only metadata — it never changes the realized Japanese,
 * so this default diversifies discourse roles without touching any surface. */
function defaultSpeakerRole(spec: A1LineSpec): string {
  if (spec.speakerRole !== undefined) return spec.speakerRole;
  const ref = spec.subjectReferent;
  if (ref !== null && A1_VOICEABLE_REFERENTS.has(ref)) {
    return A1_REFERENT_ROLE[ref] ?? "a1-role-learner";
  }
  return "a1-role-learner";
}

function lineVariant(spec: A1LineSpec, use: PedagogicalUse): A1BuiltVariant {
  return a1Variant({
    id: spec.id,
    family: spec.family,
    context: spec.context,
    speakerRole: defaultSpeakerRole(spec),
    addresseeRole: spec.addresseeRole === undefined ? "a1-role-teacher" : spec.addresseeRole,
    subjectReferent: spec.subjectReferent,
    subjectRealization: spec.subjectRealization,
    slots: spec.slots,
    interrogative: spec.interrogative,
    use,
    translation: spec.translation,
    scenario: a1Scenario(spec.context),
  });
}

/**
 * Expand an instructional lesson's eight models and five transfers into a
 * validated {@link A1LessonRecipe} (via {@link defineA1Lesson}), its frozen
 * variants, and the merged EN/IT translation+scenario copy. Diversity floors
 * are fixed to the A1 depth contract: eight models, ten exercises, ≥3
 * predicates, ≥3 roles, ≥2 contexts, five unique targets per round, reuse ≤2,
 * five transfer exercises, controlled construction required. `minFamilies` is
 * derived from the models' distinct families (never hand-declared).
 */
export function buildA1InstructionalLesson(
  input: A1InstructionalLessonInput,
): A1BuiltLesson {
  const modelBuilt = input.models.map((m) => lineVariant(m, "model"));
  const transferBuilt = input.transfers.map((t) => lineVariant(t, "transfer"));
  const modelIds = modelBuilt.map((b) => b.variant.id);
  const transferIds = transferBuilt.map((b) => b.variant.id);

  const modelFamilies = new Set(modelBuilt.map((b) => b.variant.sentenceFamilyId));

  const diversityConstraints: LessonDiversityConstraints = {
    modelCountRange: [8, 8],
    exerciseCountRange: [10, 10],
    minFamilies: modelFamilies.size,
    minPredicates: 3,
    minRoles: 3,
    minContexts: 2,
    minUniqueTargets: 5,
    maxTargetReuse: 2,
    minTransferExercises: 5,
    requireControlledConstruction: true,
  };

  const practice: LessonPracticeDefinition = {
    lessonId: input.id,
    roundOne: {
      id: `${input.id}-round-1`,
      purpose: "guided-controlled",
      candidateVariantIds: modelIds,
      selectionPolicyId: "a1-selection-default",
      exerciseKinds: [...A1_ROUND_ONE_KINDS],
      targetCount: 5,
    },
    roundTwo: {
      id: `${input.id}-round-2`,
      purpose: "transfer",
      candidateVariantIds: transferIds,
      selectionPolicyId: "a1-selection-default",
      exerciseKinds: [...A1_ROUND_TWO_KINDS],
      targetCount: 5,
    },
  };

  const recipe = defineA1Lesson({
    id: input.id,
    moduleId: input.moduleId,
    order: input.order,
    contract: "instructional",
    primaryCanDoId: input.primaryCanDoId,
    supportingCanDoIds: input.supportingCanDoIds,
    modelVariantIds: modelIds,
    guidedVariantIds: [modelIds[0], modelIds[1]],
    spokenVariantId: modelIds[0],
    practice,
    diversityConstraints,
    introducedConceptIds: input.introducedConceptIds,
    introducedSenseIds: input.introducedSenseIds,
  });

  const en: Record<string, string> = {};
  const it: Record<string, string> = {};
  for (const built of [...modelBuilt, ...transferBuilt]) {
    Object.assign(en, built.en);
    Object.assign(it, built.it);
  }

  return {
    recipe,
    variants: [...modelBuilt, ...transferBuilt].map((b) => b.variant),
    en,
    it,
  };
}

/**
 * Build a productive verb's introduction record from its ≥2 structurally
 * distinct intro variants and one correctness-bearing intro exercise. `laterUses`
 * is intentionally left to the caller (empty at module-local authoring time —
 * later spaced reuse is a future slice, never falsely pre-claimed here).
 */
export function a1VerbUseRecord(input: {
  readonly senseId: string;
  readonly introductionLessonId: string;
  readonly introductionVariantIds: readonly string[];
  readonly exerciseRoundId: string;
  readonly exerciseKind: "tile-ordering" | "choice" | "transformation" | "completion" | "constrained-construction";
  readonly exerciseTargetVariantId: string;
}): VerbUseRecord {
  return deepFreeze({
    id: `a1-verb-use-${input.senseId}`,
    senseId: input.senseId,
    learningUse: "productive",
    introductionLessonId: input.introductionLessonId,
    introductionVariantIds: [...input.introductionVariantIds],
    introductionExercise: {
      lessonId: input.introductionLessonId,
      roundId: input.exerciseRoundId,
      exerciseKind: input.exerciseKind,
      targetVariantId: input.exerciseTargetVariantId,
    },
    laterUses: [],
  });
}
