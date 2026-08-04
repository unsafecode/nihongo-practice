/**
 * A1 semantic catalog (quality-review M5 extraction from the former
 * `shared.ts` monolith).
 *
 * Owns every *data* catalog the A1 release authors directly: concept ids,
 * contexts, person roles, referents, learning-target senses (case frames),
 * semantic values (the only place Japanese/romaji lexical content is
 * authored), sentence families, and the stable Can-do id stubs. This module
 * never builds lessons or composes bilingual copy — see
 * `a1LessonBuilders.ts` and `a1CopyGloss.ts` for those concerns. Re-exported
 * through the `shared.ts` barrel so existing `from "./shared"` imports keep
 * working unchanged.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  CanDo,
  Context,
  LearningTargetSense,
  PersonRole,
  Referent,
  SemanticValue,
  SemanticValueTokenFragment,
  SentenceFamily,
} from "../../foundations/types";
import { defineA1SemanticValue } from "../authoring";

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
export const A1_CONCEPT_TIME_SCHEDULE = "a1-concept-time-schedule";
export const A1_CONCEPT_FREQUENCY = "a1-concept-frequency";
export const A1_CONCEPT_DIRECTION_HE = "a1-concept-direction-he";
export const A1_CONCEPT_SOURCE_LIMIT = "a1-concept-source-limit";
export const A1_CONCEPT_TRANSPORT_DE = "a1-concept-transport-de";
// --- Phase 2 Modules 9-11 constructions ---
export const A1_CONCEPT_ADJECTIVE = "a1-concept-adjective";
export const A1_CONCEPT_PREFERENCE = "a1-concept-preference-ga";
export const A1_CONCEPT_COMPARISON = "a1-concept-comparison-yori";
export const A1_CONCEPT_QUANTITY = "a1-concept-quantity";
export const A1_CONCEPT_REQUEST = "a1-concept-request-kudasai";
export const A1_CONCEPT_EXISTENCE = "a1-concept-existence-aru-iru";

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
  A1_CONCEPT_TIME_SCHEDULE,
  A1_CONCEPT_FREQUENCY,
  A1_CONCEPT_DIRECTION_HE,
  A1_CONCEPT_SOURCE_LIMIT,
  A1_CONCEPT_TRANSPORT_DE,
  A1_CONCEPT_ADJECTIVE,
  A1_CONCEPT_PREFERENCE,
  A1_CONCEPT_COMPARISON,
  A1_CONCEPT_QUANTITY,
  A1_CONCEPT_REQUEST,
  A1_CONCEPT_EXISTENCE,
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
  { id: "a1-context-home", labelCopyId: "a1-context-home-label" },
  { id: "a1-context-town", labelCopyId: "a1-context-town-label" },
  { id: "a1-context-family", labelCopyId: "a1-context-family-label" },
  { id: "a1-context-weather", labelCopyId: "a1-context-weather-label" },
  // Module 5 routine senses each own a dedicated, base-sense-free practice
  // context so the same-orthography routine/base sense pairs stay contextually
  // distinct (no conflation).
  { id: "a1-context-weekday-study", labelCopyId: "a1-context-weekday-study-label" },
  { id: "a1-context-mealtime-routine", labelCopyId: "a1-context-mealtime-routine-label" },
  { id: "a1-context-evening-reading", labelCopyId: "a1-context-evening-reading-label" },
]);

// ---------------------------------------------------------------------------
// Person roles
// ---------------------------------------------------------------------------

// Canonical persona gender agreement for the whole A1 release (independent
// finding, Phase 2 Task 7): Ken is masculine, Mina and Yuki are feminine.
// This is the single source of truth `a1CopyGloss.ts`'s gender-aware copular
// complement selection reads from — never re-declared per call site. Generic
// roles (learner, teacher, classmate, friend, clerk, person, thing,
// creature) intentionally omit `gender`: the course never establishes a
// real-world gender for them, so callers must not guess one.
export const a1PersonRoles: readonly PersonRole[] = deepFreeze([
  { id: "a1-role-learner", kind: "learner", labelCopyId: "a1-role-learner-label" },
  { id: "a1-role-yuki", kind: "persona", labelCopyId: "a1-role-yuki-label", gender: "feminine" },
  { id: "a1-role-ken", kind: "persona", labelCopyId: "a1-role-ken-label", gender: "masculine" },
  { id: "a1-role-mina", kind: "persona", labelCopyId: "a1-role-mina-label", gender: "feminine" },
  { id: "a1-role-teacher", kind: "social", labelCopyId: "a1-role-teacher-label" },
  { id: "a1-role-classmate", kind: "social", labelCopyId: "a1-role-classmate-label" },
  { id: "a1-role-friend", kind: "social", labelCopyId: "a1-role-friend-label" },
  { id: "a1-role-clerk", kind: "unnamed", labelCopyId: "a1-role-clerk-label" },
  { id: "a1-role-person", kind: "unnamed", labelCopyId: "a1-role-person-label" },
  { id: "a1-role-thing", kind: "unnamed", labelCopyId: "a1-role-thing-label" },
  { id: "a1-role-creature", kind: "unnamed", labelCopyId: "a1-role-creature-label" },
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
  { id: "a1-referent-creature", personRoleId: "a1-role-creature", animacy: "animate", labelCopyId: "a1-referent-creature-label" },
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
  // --- Module 5 routine senses: [agent, time] frames. Same orthography as an
  // action verb but a *distinct* time-anchored frame (the sanctioned
  // listen/ask precedent), so they can appear in schedule/frequency families
  // that carry a time slot (which the action senses, lacking a `time` role,
  // structurally cannot). Particles come from the governing rule (bare or に),
  // so `argumentParticleByRole` stays empty.
  { id: "a1-sense-wake", lexemeId: "a1-lexeme-okiru", learningUse: "productive", semanticFrameId: "a1-frame-wake", predicate: "wake", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "a1-sense-sleep", lexemeId: "a1-lexeme-neru", learningUse: "productive", semanticFrameId: "a1-frame-sleep", predicate: "sleep", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "a1-sense-go-out", lexemeId: "a1-lexeme-dekakeru", learningUse: "productive", semanticFrameId: "a1-frame-go-out", predicate: "go-out", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "a1-sense-return", lexemeId: "a1-lexeme-kaeru", learningUse: "productive", semanticFrameId: "a1-frame-return", predicate: "return", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "a1-sense-study-routine", lexemeId: "a1-lexeme-benkyousuru", learningUse: "productive", semanticFrameId: "a1-frame-study-routine", predicate: "study", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "a1-sense-eat-routine", lexemeId: "a1-lexeme-taberu", learningUse: "productive", semanticFrameId: "a1-frame-eat-routine", predicate: "eat", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "a1-sense-read-routine", lexemeId: "a1-lexeme-yomu", learningUse: "productive", semanticFrameId: "a1-frame-read-routine", predicate: "read", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  // --- Module 9 description senses: predicate adjectives. Each carries its
  // i-/na-class in `adjectiveClass` so the realizer chooses the morphology
  // generically (い / くない / かった / くなかった for i-class; conjugating です
  // for na-class). A plain description takes only the topic は subject, so the
  // frame is `[topic]` with no governed argument. Like / dislike additionally
  // govern a が-marked stimulus (`theme`).
  { id: "a1-sense-hot", lexemeId: "a1-lexeme-atsui", learningUse: "productive", semanticFrameId: "a1-frame-hot", predicate: "hot", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "i" },
  { id: "a1-sense-cold", lexemeId: "a1-lexeme-samui", learningUse: "productive", semanticFrameId: "a1-frame-cold", predicate: "cold", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "i" },
  { id: "a1-sense-big", lexemeId: "a1-lexeme-ookii", learningUse: "productive", semanticFrameId: "a1-frame-big", predicate: "big", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "i" },
  { id: "a1-sense-small", lexemeId: "a1-lexeme-chiisai", learningUse: "productive", semanticFrameId: "a1-frame-small", predicate: "small", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "i" },
  { id: "a1-sense-quiet", lexemeId: "a1-lexeme-shizuka", learningUse: "productive", semanticFrameId: "a1-frame-quiet", predicate: "quiet", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "na" },
  { id: "a1-sense-like", lexemeId: "a1-lexeme-suki", learningUse: "productive", semanticFrameId: "a1-frame-like", predicate: "like", argumentRoles: ["topic", "theme"], argumentParticleByRole: {}, adjectiveClass: "na" },
  { id: "a1-sense-dislike", lexemeId: "a1-lexeme-kirai", learningUse: "productive", semanticFrameId: "a1-frame-dislike", predicate: "dislike", argumentRoles: ["topic", "theme"], argumentParticleByRole: {}, adjectiveClass: "na" },
  // --- Module 10 shopping senses: two price adjectives (i-class) and the polite
  // request predicate ください (governs a を-marked theme, no verbal ending).
  { id: "a1-sense-expensive", lexemeId: "a1-lexeme-takai", learningUse: "productive", semanticFrameId: "a1-frame-expensive", predicate: "expensive", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "i" },
  { id: "a1-sense-cheap", lexemeId: "a1-lexeme-yasui", learningUse: "productive", semanticFrameId: "a1-frame-cheap", predicate: "cheap", argumentRoles: ["topic"], argumentParticleByRole: {}, adjectiveClass: "i" },
  { id: "a1-sense-request", lexemeId: "a1-lexeme-kudasai", learningUse: "productive", semanticFrameId: "a1-frame-request", predicate: "request", argumentRoles: ["theme"], argumentParticleByRole: {} },
  // --- Module 11 existence/needs senses. あります pins an inanimate が-subject,
  // います an animate one — enforced generically via `requiredSubjectAnimacy`,
  // never a Japanese-string switch. ほしい (want, i-class) governs a が-marked
  // wanted thing (`theme`).
  { id: "a1-sense-exist-inanimate", lexemeId: "a1-lexeme-aru", learningUse: "productive", semanticFrameId: "a1-frame-exist-inanimate", predicate: "exist", argumentRoles: ["location"], argumentParticleByRole: {}, requiredSubjectAnimacy: "inanimate" },
  { id: "a1-sense-exist-animate", lexemeId: "a1-lexeme-iru", learningUse: "productive", semanticFrameId: "a1-frame-exist-animate", predicate: "exist", argumentRoles: ["location"], argumentParticleByRole: {}, requiredSubjectAnimacy: "animate" },
  { id: "a1-sense-want", lexemeId: "a1-lexeme-hoshii", learningUse: "productive", semanticFrameId: "a1-frame-want", predicate: "want", argumentRoles: ["topic", "theme"], argumentParticleByRole: {}, adjectiveClass: "i" },
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
  // Module 5 routine predicate stems (polite ます-stems).
  { id: "a1-value-wake", kind: "predicate-sense", senseId: "a1-sense-wake", tokenFragments: [frag("おき", "oki")] },
  { id: "a1-value-sleep", kind: "predicate-sense", senseId: "a1-sense-sleep", tokenFragments: [frag("ね", "ne")] },
  { id: "a1-value-go-out", kind: "predicate-sense", senseId: "a1-sense-go-out", tokenFragments: [frag("でかけ", "dekake")] },
  { id: "a1-value-return", kind: "predicate-sense", senseId: "a1-sense-return", tokenFragments: [frag("かえり", "kaeri")] },
  { id: "a1-value-study-routine", kind: "predicate-sense", senseId: "a1-sense-study-routine", tokenFragments: [frag("べんきょうし", "benkyoushi")] },
  { id: "a1-value-eat-routine", kind: "predicate-sense", senseId: "a1-sense-eat-routine", tokenFragments: [frag("たべ", "tabe")] },
  { id: "a1-value-read-routine", kind: "predicate-sense", senseId: "a1-sense-read-routine", tokenFragments: [frag("よみ", "yomi")] },

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
  //
  // `a1-value-companion-friend` / `a1-value-recipient-friend` (both ともだち)
  // and `a1-value-recipient-teacher` / `a1-value-companion-teacher` (both
  // せんせい) are deliberately duplicated semantic ids, not a copy/paste
  // artifact: each candidate-pool distractor generator (companion-role
  // exercises draw from the `a1-value-companion-*` id family, recipient-role
  // exercises from `a1-value-recipient-*`) is namespaced by *role*, not by
  // surface form. Collapsing the pair onto one shared id would let a
  // companion exercise accidentally offer a recipient-only value (or vice
  // versa) as a plausible distractor, since the generator can only exclude a
  // value's *own* id family, not its Japanese surface text. Keep both ids;
  // only add a shared value if a future exercise legitimately draws
  // candidates from both roles at once.
  { id: "a1-value-companion-friend", kind: "object", tokenFragments: [frag("ともだち", "tomodachi")] },
  { id: "a1-value-companion-classmate", kind: "object", tokenFragments: [frag("クラスメート", "kurasumeeto")] },
  { id: "a1-value-recipient-teacher", kind: "object", tokenFragments: [frag("せんせい", "sensei")] },
  { id: "a1-value-recipient-clerk", kind: "object", tokenFragments: [frag("てんいん", "ten'in")] },
  // Module 8 recipient/companion people (person-target に / companion と).
  // See the role-namespacing note above — same deliberate duplication, same
  // reason (companion vs. recipient candidate pools must never cross).
  { id: "a1-value-recipient-friend", kind: "object", tokenFragments: [frag("ともだち", "tomodachi")] },
  { id: "a1-value-companion-teacher", kind: "object", tokenFragments: [frag("せんせい", "sensei")] },
  { id: "a1-value-companion-child", kind: "object", tokenFragments: [frag("こども", "kodomo")] },
  { id: "a1-value-recipient-person", kind: "object", tokenFragments: [frag("ひと", "hito")] },
  { id: "a1-value-companion-family", kind: "object", tokenFragments: [frag("かぞく", "kazoku")] },
  // Module 7 means-of-transport nouns (で adjunct; object-kind, distinct from
  // the action-place で of `work`).
  { id: "a1-value-transport-train", kind: "object", tokenFragments: [frag("でんしゃ", "densha")] },
  { id: "a1-value-transport-bus", kind: "object", tokenFragments: [frag("バス", "basu")] },
  { id: "a1-value-transport-car", kind: "object", tokenFragments: [frag("くるま", "kuruma")] },
  { id: "a1-value-transport-bicycle", kind: "object", tokenFragments: [frag("じてんしゃ", "jitensha")] },
  { id: "a1-value-transport-subway", kind: "object", tokenFragments: [frag("ちかてつ", "chikatetsu")] },
  { id: "a1-value-transport-taxi", kind: "object", tokenFragments: [frag("タクシー", "takushii")] },
  { id: "a1-value-transport-airplane", kind: "object", tokenFragments: [frag("ひこうき", "hikouki")] },
  { id: "a1-value-transport-ship", kind: "object", tokenFragments: [frag("ふね", "fune")] },

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
  // Module 7 additional destinations / route endpoints.
  { id: "a1-value-loc-home", kind: "location", tokenFragments: [frag("いえ", "ie")] },
  { id: "a1-value-loc-airport", kind: "location", tokenFragments: [frag("くうこう", "kuukou")] },
  { id: "a1-value-loc-bank", kind: "location", tokenFragments: [frag("ぎんこう", "ginkou")] },
  { id: "a1-value-loc-hospital", kind: "location", tokenFragments: [frag("びょういん", "byouin")] },
  { id: "a1-value-loc-room", kind: "location", tokenFragments: [frag("へや", "heya")] },
  { id: "a1-value-loc-town", kind: "location", tokenFragments: [frag("まち", "machi")] },

  // --- referent-kind kin subjects (Module 8) ---
  // Own-family plain forms — used when the speaker talks about their OWN family
  // to others (never honorific for one's own relatives).
  { id: "a1-value-kin-mother", kind: "referent", animacy: "animate", tokenFragments: [frag("はは", "haha")] },
  { id: "a1-value-kin-father", kind: "referent", animacy: "animate", tokenFragments: [frag("ちち", "chichi")] },
  { id: "a1-value-kin-older-brother", kind: "referent", animacy: "animate", tokenFragments: [frag("あに", "ani")] },
  { id: "a1-value-kin-older-sister", kind: "referent", animacy: "animate", tokenFragments: [frag("あね", "ane")] },
  { id: "a1-value-kin-younger-brother", kind: "referent", animacy: "animate", tokenFragments: [frag("おとうと", "otouto")] },
  { id: "a1-value-kin-younger-sister", kind: "referent", animacy: "animate", tokenFragments: [frag("いもうと", "imouto")] },
  // Other-family honorific forms — used when referring to the LISTENER's (or a
  // third party's) family respectfully.
  { id: "a1-value-kin-mother-hon", kind: "referent", animacy: "animate", tokenFragments: [frag("おかあさん", "okaasan")] },
  { id: "a1-value-kin-father-hon", kind: "referent", animacy: "animate", tokenFragments: [frag("おとうさん", "otousan")] },

  // --- time-kind (schedule に clock/day times; bare sequence + frequency) ---
  // Clock times (schedule rule fixes に).
  { id: "a1-value-time-5", kind: "time", tokenFragments: [frag("ごじ", "goji")] },
  { id: "a1-value-time-6", kind: "time", tokenFragments: [frag("ろくじ", "rokuji")] },
  { id: "a1-value-time-7", kind: "time", tokenFragments: [frag("しちじ", "shichiji")] },
  { id: "a1-value-time-8", kind: "time", tokenFragments: [frag("はちじ", "hachiji")] },
  { id: "a1-value-time-9", kind: "time", tokenFragments: [frag("くじ", "kuji")] },
  { id: "a1-value-time-10", kind: "time", tokenFragments: [frag("じゅうじ", "juuji")] },
  { id: "a1-value-time-11", kind: "time", tokenFragments: [frag("じゅういちじ", "juuichiji")] },
  // Days of the week (schedule rule fixes に).
  { id: "a1-value-day-monday", kind: "time", tokenFragments: [frag("げつようび", "getsuyoubi")] },
  { id: "a1-value-day-tuesday", kind: "time", tokenFragments: [frag("かようび", "kayoubi")] },
  { id: "a1-value-day-wednesday", kind: "time", tokenFragments: [frag("すいようび", "suiyoubi")] },
  { id: "a1-value-day-thursday", kind: "time", tokenFragments: [frag("もくようび", "mokuyoubi")] },
  { id: "a1-value-day-friday", kind: "time", tokenFragments: [frag("きんようび", "kinyoubi")] },
  { id: "a1-value-day-saturday", kind: "time", tokenFragments: [frag("どようび", "doyoubi")] },
  { id: "a1-value-day-sunday", kind: "time", tokenFragments: [frag("にちようび", "nichiyoubi")] },
  // Day-part sequence adverbs (bare — no particle).
  { id: "a1-value-seq-morning", kind: "time", tokenFragments: [frag("あさ", "asa")] },
  { id: "a1-value-seq-noon", kind: "time", tokenFragments: [frag("ひる", "hiru")] },
  { id: "a1-value-seq-night", kind: "time", tokenFragments: [frag("よる", "yoru")] },
  { id: "a1-value-seq-evening", kind: "time", tokenFragments: [frag("ばん", "ban")] },
  // Frequency adverbs (bare — a case-marking particle here would be
  // ungrammatical; the naturalness regression pins this).
  { id: "a1-value-freq-everyday", kind: "time", tokenFragments: [frag("まいにち", "mainichi")] },
  { id: "a1-value-freq-every-morning", kind: "time", tokenFragments: [frag("まいあさ", "maiasa")] },
  { id: "a1-value-freq-often", kind: "time", tokenFragments: [frag("よく", "yoku")] },
  { id: "a1-value-freq-sometimes", kind: "time", tokenFragments: [frag("ときどき", "tokidoki")] },
  { id: "a1-value-freq-always", kind: "time", tokenFragments: [frag("いつも", "itsumo")] },

  // === Phase 2 Module 9 — description subjects & adjective stems ===========
  // Inanimate description subjects (topic は).
  { id: "a1-value-today", kind: "referent", animacy: "inanimate", tokenFragments: [frag("きょう", "kyou")] },
  { id: "a1-value-heya", kind: "referent", animacy: "inanimate", tokenFragments: [frag("へや", "heya")] },
  { id: "a1-value-machi", kind: "referent", animacy: "inanimate", tokenFragments: [frag("まち", "machi")] },
  // Predicate adjective stems (the class-specific ending belongs to the rule).
  // i-adjectives carry the bare stem (い / くない / … attach in the realizer);
  // na-adjectives carry the full stem word (the copula です follows).
  { id: "a1-value-hot", kind: "predicate-sense", senseId: "a1-sense-hot", tokenFragments: [frag("あつ", "atsu")] },
  { id: "a1-value-cold", kind: "predicate-sense", senseId: "a1-sense-cold", tokenFragments: [frag("さむ", "samu")] },
  { id: "a1-value-big", kind: "predicate-sense", senseId: "a1-sense-big", tokenFragments: [frag("おおき", "ooki")] },
  { id: "a1-value-small", kind: "predicate-sense", senseId: "a1-sense-small", tokenFragments: [frag("ちいさ", "chiisa")] },
  { id: "a1-value-quiet", kind: "predicate-sense", senseId: "a1-sense-quiet", tokenFragments: [frag("しずか", "shizuka")] },
  { id: "a1-value-like", kind: "predicate-sense", senseId: "a1-sense-like", tokenFragments: [frag("すき", "suki")] },
  { id: "a1-value-dislike", kind: "predicate-sense", senseId: "a1-sense-dislike", tokenFragments: [frag("きらい", "kirai")] },
  // Comparison standards (より-marked; object-kind demonstratives).
  { id: "a1-value-obj-kore", kind: "object", tokenFragments: [frag("これ", "kore")] },
  { id: "a1-value-obj-sore", kind: "object", tokenFragments: [frag("それ", "sore")] },
  { id: "a1-value-obj-are", kind: "object", tokenFragments: [frag("あれ", "are")] },

  // === Phase 2 Module 10 — prices, quantities, request ====================
  // Price copular complements (object-kind; "…えん" split so romaji spaces).
  { id: "a1-value-price-100", kind: "object", tokenFragments: [frag("ひゃく", "hyaku"), frag("えん", "en")] },
  { id: "a1-value-price-300", kind: "object", tokenFragments: [frag("さんびゃく", "sanbyaku"), frag("えん", "en")] },
  { id: "a1-value-price-500", kind: "object", tokenFragments: [frag("ごひゃく", "gohyaku"), frag("えん", "en")] },
  { id: "a1-value-price-1000", kind: "object", tokenFragments: [frag("せん", "sen"), frag("えん", "en")] },
  // Price adjective stems (i-class).
  { id: "a1-value-expensive", kind: "predicate-sense", senseId: "a1-sense-expensive", tokenFragments: [frag("たか", "taka")] },
  { id: "a1-value-cheap", kind: "predicate-sense", senseId: "a1-sense-cheap", tokenFragments: [frag("やす", "yasu")] },
  // Shopping objects (を theme, also preference/existence themes).
  { id: "a1-value-obj-apple", kind: "object", tokenFragments: [frag("りんご", "ringo")] },
  { id: "a1-value-obj-mikan", kind: "object", tokenFragments: [frag("みかん", "mikan")] },
  { id: "a1-value-obj-ticket", kind: "object", tokenFragments: [frag("きっぷ", "kippu")] },
  { id: "a1-value-obj-bag", kind: "object", tokenFragments: [frag("かばん", "kaban")] },
  { id: "a1-value-obj-money", kind: "object", tokenFragments: [frag("おかね", "okane")] },
  // Floating quantifiers (bare — no particle; quantity-kind).
  { id: "a1-value-qty-1", kind: "quantity", tokenFragments: [frag("ひとつ", "hitotsu")] },
  { id: "a1-value-qty-2", kind: "quantity", tokenFragments: [frag("ふたつ", "futatsu")] },
  { id: "a1-value-qty-3", kind: "quantity", tokenFragments: [frag("みっつ", "mittsu")] },
  { id: "a1-value-qty-4", kind: "quantity", tokenFragments: [frag("よっつ", "yottsu")] },
  { id: "a1-value-qty-5", kind: "quantity", tokenFragments: [frag("いつつ", "itsutsu")] },
  // Polite request word ください (standalone; emitted after the を-item).
  { id: "a1-value-request", kind: "predicate-sense", senseId: "a1-sense-request", tokenFragments: [frag("ください", "kudasai")] },

  // === Phase 2 Module 11 — existence entities, positions, want ============
  // Existence subjects (が-marked). Inanimate → あります; animate → います.
  { id: "a1-value-ex-book", kind: "referent", animacy: "inanimate", tokenFragments: [frag("ほん", "hon")] },
  { id: "a1-value-ex-pen", kind: "referent", animacy: "inanimate", tokenFragments: [frag("ペン", "pen")] },
  { id: "a1-value-ex-key", kind: "referent", animacy: "inanimate", tokenFragments: [frag("かぎ", "kagi")] },
  { id: "a1-value-ex-money", kind: "referent", animacy: "inanimate", tokenFragments: [frag("おかね", "okane")] },
  { id: "a1-value-ex-cat", kind: "referent", animacy: "animate", tokenFragments: [frag("ねこ", "neko")] },
  { id: "a1-value-ex-dog", kind: "referent", animacy: "animate", tokenFragments: [frag("いぬ", "inu")] },
  { id: "a1-value-ex-child", kind: "referent", animacy: "animate", tokenFragments: [frag("こども", "kodomo")] },
  { id: "a1-value-ex-person", kind: "referent", animacy: "animate", tokenFragments: [frag("ひと", "hito")] },
  // Position location nouns (に-marked; multi-fragment → spaced romaji).
  { id: "a1-value-loc-on-desk", kind: "location", tokenFragments: [frag("つくえ", "tsukue"), frag("の", "no"), frag("うえ", "ue")] },
  { id: "a1-value-loc-in-bag", kind: "location", tokenFragments: [frag("かばん", "kaban"), frag("の", "no"), frag("なか", "naka")] },
  { id: "a1-value-loc-under-chair", kind: "location", tokenFragments: [frag("いす", "isu"), frag("の", "no"), frag("した", "shita")] },
  { id: "a1-value-loc-near-station", kind: "location", tokenFragments: [frag("えき", "eki"), frag("の", "no"), frag("ちかく", "chikaku")] },
  // Want adjective stem (i-class; ほし + い → ほしい).
  { id: "a1-value-want", kind: "predicate-sense", senseId: "a1-sense-want", tokenFragments: [frag("ほし", "hoshi")] },
  // Existence predicate stems (normal ます-stems: あり / い).
  { id: "a1-value-exist-inanimate", kind: "predicate-sense", senseId: "a1-sense-exist-inanimate", tokenFragments: [frag("あり", "ari")] },
  { id: "a1-value-exist-animate", kind: "predicate-sense", senseId: "a1-sense-exist-animate", tokenFragments: [frag("い", "i")] },
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
    canDoIds: ["a1-can-do-identity", "a1-can-do-origins", "a1-can-do-people", "a1-can-do-scenario-1"],
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
    canDoIds: ["a1-can-do-actions", "a1-can-do-questions"],
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
  {
    // Module 5: verb + に-marked clock time / named day ("しちじにおきます").
    id: "a1-family-schedule-action",
    level: "a1",
    canDoIds: ["a1-can-do-daily-life"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "time", axis: "time", valueKind: "time", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "time", "polarity-tense-form", "context"],
    realizationRuleId: "rule-schedule-action",
    requiredConceptIds: [A1_CONCEPT_TIME_SCHEDULE],
  },
  {
    // Module 5: verb + bare time adverbial — day-part sequence (あさ) and
    // frequency adverbs (まいにち, よく). No particle: a case marker here would
    // be ungrammatical.
    id: "a1-family-adverbial-time-action",
    level: "a1",
    canDoIds: ["a1-can-do-daily-life"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "time", axis: "time", valueKind: "time", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "time", "polarity-tense-form", "context"],
    realizationRuleId: "rule-time-action",
    requiredConceptIds: [A1_CONCEPT_FREQUENCY],
  },
  {
    // Module 7: verb + へ-marked direction ("えきへいきます").
    id: "a1-family-direction-action",
    level: "a1",
    canDoIds: ["a1-can-do-places"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "location", axis: "location", valueKind: "location", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "location", "polarity-tense-form", "context"],
    realizationRuleId: "rule-direction-action",
    requiredConceptIds: [A1_CONCEPT_DIRECTION_HE],
  },
  {
    // Module 7: verb + から source + まで limit ("とうきょうからおおさかまでいきます").
    id: "a1-family-route-action",
    level: "a1",
    canDoIds: ["a1-can-do-places"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "source", axis: "location", valueKind: "location", optional: false },
      { id: "goal", axis: "location", valueKind: "location", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "location", "polarity-tense-form", "context"],
    realizationRuleId: "rule-route-action",
    requiredConceptIds: [A1_CONCEPT_SOURCE_LIMIT],
  },
  {
    // Module 7: verb + で transport + に destination ("でんしゃでえきにいきます").
    id: "a1-family-transport-action",
    level: "a1",
    canDoIds: ["a1-can-do-places"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "transport", axis: "object", valueKind: "object", optional: false },
      { id: "location", axis: "location", valueKind: "location", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "location", "polarity-tense-form", "context"],
    realizationRuleId: "rule-transport-action",
    requiredConceptIds: [A1_CONCEPT_TRANSPORT_DE],
  },
  {
    // Module 9: adjectival description "X は <adj>です". No governed object; the
    // described thing is the topic. i-/na-morphology comes from the sense's
    // adjectiveClass, never this family.
    id: "a1-family-description",
    level: "a1",
    canDoIds: ["a1-can-do-descriptions", "a1-can-do-scenario-4"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "polarity-tense-form", "context"],
    realizationRuleId: "rule-description",
    requiredConceptIds: [A1_CONCEPT_ADJECTIVE],
  },
  {
    // Module 9: preference/desire "X は Y が <adj>です" — Y is a が-marked
    // governed theme (すき/きらい/ほしい).
    id: "a1-family-preference",
    level: "a1",
    canDoIds: ["a1-can-do-descriptions", "a1-can-do-scenario-3"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-preference",
    requiredConceptIds: [A1_CONCEPT_PREFERENCE],
  },
  {
    // Module 9: comparison "X は Y より <adj>です" — Y is a より-marked standard
    // (an adjunct, not a governed theme).
    id: "a1-family-comparison",
    level: "a1",
    canDoIds: ["a1-can-do-descriptions"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "standard", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "rule-comparison",
    requiredConceptIds: [A1_CONCEPT_COMPARISON],
  },
  {
    // Module 10: verb + を object + bare floating quantifier
    // ("りんごを みっつ かいます"). The quantity slot takes no particle.
    id: "a1-family-quantified-action",
    level: "a1",
    canDoIds: ["a1-can-do-shopping", "a1-can-do-scenario-2"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
      { id: "quantity", axis: "quantity", valueKind: "quantity", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "quantity", "polarity-tense-form", "context"],
    realizationRuleId: "rule-quantified-action",
    requiredConceptIds: [A1_CONCEPT_QUANTITY],
  },
  {
    // Module 10: polite request "Y を ください" — the item is a を-marked
    // governed theme; the predicate value carries the standalone ください.
    id: "a1-family-request",
    level: "a1",
    canDoIds: ["a1-can-do-shopping"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
      // Optional bare floating quantifier ("りんごを みっつ ください"). Its
      // presence/absence is a genuine second structure for the request sense.
      { id: "quantity", axis: "quantity", valueKind: "quantity", optional: true },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "quantity", "polarity-tense-form", "context"],
    realizationRuleId: "rule-request",
    requiredConceptIds: [A1_CONCEPT_REQUEST],
  },
  {
    // Module 11: presentational existence "X が (place に) あります/います". The
    // entity is the が-marked subject; the optional に-location gives position.
    // あります vs います is chosen from requiredSubjectAnimacy, never a string
    // switch.
    id: "a1-family-existence",
    level: "a1",
    canDoIds: ["a1-can-do-existence"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "location", axis: "location", valueKind: "location", optional: true },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "location", "polarity-tense-form", "context"],
    realizationRuleId: "rule-existence",
    requiredConceptIds: [A1_CONCEPT_EXISTENCE],
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
  { id: "a1-can-do-places", level: "a1", domain: "spoken-production", descriptorCopyId: "a1-can-do-places-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-people", level: "a1", domain: "interaction", descriptorCopyId: "a1-can-do-people-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  // Phase 2 module Can-dos.
  { id: "a1-can-do-descriptions", level: "a1", domain: "spoken-production", descriptorCopyId: "a1-can-do-descriptions-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-shopping", level: "a1", domain: "interaction", descriptorCopyId: "a1-can-do-shopping-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-existence", level: "a1", domain: "spoken-production", descriptorCopyId: "a1-can-do-existence-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  // Phase 2 capstone scenario Can-dos (one per Module 12 synthesis lesson).
  { id: "a1-can-do-scenario-1", level: "a1", domain: "interaction", descriptorCopyId: "a1-can-do-scenario-1-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-scenario-2", level: "a1", domain: "interaction", descriptorCopyId: "a1-can-do-scenario-2-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-scenario-3", level: "a1", domain: "interaction", descriptorCopyId: "a1-can-do-scenario-3-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
  { id: "a1-can-do-scenario-4", level: "a1", domain: "interaction", descriptorCopyId: "a1-can-do-scenario-4-descriptor", contextIds: [], lessonIds: [], checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 } },
]);
