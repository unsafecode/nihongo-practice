import { boundaryBefore, formatRomaji } from "../../romaji/formatRomaji";
import type {
  AssembledToken,
  RomajiBoundaryBefore,
  RomajiTokenKind,
  TokenSourceRef,
} from "../../romaji/types";
import type {
  Context,
  LearningTargetSense,
  LexemeSenseId,
  PersonRole,
  Referent,
  SemanticArgumentRole,
  SemanticParticleId,
  SemanticValue,
  SemanticValueId,
  SentenceFamily,
  SentenceSlotDefinition,
  SentenceSlotId,
  SentenceFamilyId,
  SentenceVariant,
  SentenceVariantId,
  RealizedSentence,
  ConceptId,
} from "./types";

/**
 * Pure sentence-family realization (design spec §9.2-§9.4, §10.1-§10.2,
 * §11.3; Phase 1 Task 2). `realizeVariant` turns one authored
 * `SentenceVariant` + its owning `SentenceFamily` into a `RealizedSentence`
 * (ordered tokens, canonical Japanese, romaji-checked, fingerprinted) — or a
 * deterministic, ordered list of `FamilyRealizationError`s. Nothing here
 * mutates its inputs or reads any ambient state; every catalog/concept
 * lookup the realizer needs is passed in explicitly through
 * `RealizeVariantCatalogs`/`RealizeVariantOptions` (an operation-local input
 * shape — never the full `FoundationCatalogs`), so a caller can never
 * silently assume a family's `requiredConceptIds` have been taught.
 */

// ---------------------------------------------------------------------------
// Public result/error contracts (operation-owned; not part of ./types)
// ---------------------------------------------------------------------------

export type FamilyRealizationErrorCode =
  | "missing-slot"
  | "illegal-axis-value"
  | "unmet-concept-requirement"
  | "incompatible-animacy"
  | "invalid-argument-structure"
  | "invalid-conjugation"
  | "unknown-sense"
  | "unresolved-discourse-reference"
  | "unknown-context"
  | "unknown-realization-rule"
  | "invalid-romaji-sequence"
  | "family-variant-mismatch"
  | "unknown-semantic-value";

export interface FamilyRealizationError {
  readonly code: FamilyRealizationErrorCode;
  readonly familyId: SentenceFamilyId;
  readonly variantId: SentenceVariantId;
  readonly slotId?: SentenceSlotId;
  readonly referenceId?: string;
}

export type FamilyRealizationResult =
  | { readonly ok: true; readonly sentence: RealizedSentence }
  | { readonly ok: false; readonly errors: readonly FamilyRealizationError[] };

/** The lesson-agnostic catalogs a realization needs to resolve references. */
export interface RealizeVariantCatalogs {
  readonly contexts: readonly Context[];
  readonly personRoles: readonly PersonRole[];
  readonly referents: readonly Referent[];
  readonly semanticValues: readonly SemanticValue[];
  readonly learningTargetSenses: readonly LearningTargetSense[];
}

/**
 * Operation-local options. `availableConceptIds` is deliberately required
 * (no default) — the caller must state exactly which concepts a specific
 * lesson has actually introduced (e.g. the representative lesson's taught
 * concept set); `family.requiredConceptIds` are never assumed taught.
 */
export interface RealizeVariantOptions {
  readonly availableConceptIds: readonly ConceptId[];
}

// ---------------------------------------------------------------------------
// Realization rule registry (fixed; no fallback rule)
// ---------------------------------------------------------------------------

/** How a rule assigns (or withholds) a case particle for one content slot.
 * `"favor-marker"` (Phase 3 Task 6, A2 comparison) appends the fixed
 * compositional の+ほう+が sequence after the slot's own value fragments —
 * three genuinely fixed grammar-level tokens (never authored per-lesson,
 * exactly like the vocative's さん+、), so "X のほうが" always follows any
 * favored-item value the lesson recombines. */
type SlotParticleStrategy =
  | { readonly kind: "none" }
  | { readonly kind: "fixed"; readonly particle: SemanticParticleId }
  | { readonly kind: "from-sense-metadata"; readonly role: SemanticArgumentRole }
  | { readonly kind: "favor-marker" };

interface ContentSlotRule {
  readonly slotId: SentenceSlotId;
  readonly particle: SlotParticleStrategy;
}

interface RealizationRuleDefinition {
  readonly id: string;
  /** "copula" families emit no predicate-stem token (the `predicate`
   * semantic value carries no lexical content of its own); "verb" families
   * emit the predicate-sense value's own token fragments before the ending;
   * "adjective" families emit the predicate stem then either an i-adjective
   * inflection + invariant です (`sense.adjectiveClass === "i"`) or the
   * conjugating polite-copula pieces (`"na"`); "request" families emit the
   * predicate value's own standalone politeness word (ください) with no
   * verbal/copular ending at all. "invariant" (Phase 3 Task 4, A2) families
   * emit the predicate value's own token fragments exactly as authored — no
   * ending, copula, or standalone-politeness word is ever appended after
   * them — for constructions whose complete realized content (a plain-form
   * conjugation, a suffix composition, or a whole baked clause/utterance) is
   * already computed once at catalog-authoring time (typically via
   * `a2/forms/a2Conjugation.ts`'s `conjugate()` or
   * `composeA2Construction()`), so there is nothing left for a generic
   * ending table to add. Purely additive: no existing rule references it. */
  readonly predicateKind: "copula" | "verb" | "adjective" | "request" | "invariant";
  /**
   * What the family's `object` slot (if any) means to the sense's own case
   * frame (§16 case-frame extension). `"copular-complement"` is a plain
   * predicate nominal — it never draws on `sense.argumentRoles`.
   * `"governed-theme"` is a predicate-governed argument — the sense must
   * declare `"theme"` in `argumentRoles`, checked generically from this
   * field rather than from a family/sense/Japanese string switch. `null`
   * means the rule has no `object` slot at all.
   */
  readonly objectRole: "copular-complement" | "governed-theme" | null;
  /** Non-subject, non-predicate slots, in the order their tokens/particles
   * are emitted (after subject/topic, before the predicate stem/ending). */
  readonly contentSlots: readonly ContentSlotRule[];
  /**
   * Which particle marks the explicit grammatical subject (§ Phase 2 M11).
   * Defaults to は (`"wa"`) — every fixture/M2-8 topic construction — but
   * presentational existence marks the entity subject が (`"ga"`). Read
   * generically at assembly time, never from a Japanese-string switch.
   */
  readonly subjectParticle?: SemanticParticleId;
  /**
   * A fixed adverb pushed immediately before the predicate value's own
   * fragments (Phase 3 Task 6, A2 superlative いちばん) — genuinely fixed
   * grammar-level content the rule itself contributes, never authored per
   * semantic value, so any adjective stem recombines with it compositionally.
   */
  readonly predicateAdverbPrefix?: { readonly jp: string; readonly romaji: string };
}

/**
 * Realization rules, keyed by *stable semantic rule id* (§16). Each id names a
 * grammatical construction — not a fixture — so both the Phase 1 fixture
 * harness and the deep A1 release catalog reference the same definition. The
 * fixture families still carry their original `fixture-*-rule-*` ids; those
 * resolve to the identical definition through `RULE_ALIASES` below, so this
 * rename is a pure generalization with no behavioral change for any fixture.
 */
const REALIZATION_RULES: Readonly<Record<string, RealizationRuleDefinition>> = {
  // Copula "X は Y です" — Y is a plain predicate nominal (never draws on the
  // sense's own case frame). Also carries every copular question ("X は なん
  // ですか", "だれ ですか", ...) when the variant's form is interrogative.
  "rule-topic-copular": {
    id: "rule-topic-copular",
    predicateKind: "copula",
    objectRole: "copular-complement",
    contentSlots: [{ slotId: "object", particle: { kind: "none" } }],
  },
  // Verb + a に/で location argument whose particle is read from the sense's
  // own case frame (`live` → に, `work`/`go`/`come` → に/で per sense).
  "rule-location-action": {
    id: "rule-location-action",
    predicateKind: "verb",
    objectRole: null,
    contentSlots: [
      { slotId: "location", particle: { kind: "from-sense-metadata", role: "location" } },
    ],
  },
  // Verb + a direct object marked を (a predicate-governed theme).
  "rule-object-action": {
    id: "rule-object-action",
    predicateKind: "verb",
    objectRole: "governed-theme",
    contentSlots: [{ slotId: "object", particle: { kind: "fixed", particle: "o" } }],
  },
  // Subject/topic + a polite verb with no governed argument. This keeps an
  // agent-only predicate distinct from object- and location-governing frames.
  "rule-bare-action": {
    id: "rule-bare-action",
    predicateKind: "verb",
    objectRole: null,
    contentSlots: [],
  },
  // Verb + a nominative theme marked が (e.g. 日本語がわかります). Structurally a
  // predicate-governed theme like the を rule, but with が case marking.
  "rule-nominative-action": {
    id: "rule-nominative-action",
    predicateKind: "verb",
    objectRole: "governed-theme",
    contentSlots: [{ slotId: "object", particle: { kind: "fixed", particle: "ga" } }],
  },
  // Verb + a に-marked recipient/target theme (e.g. invite/ask someone).
  "rule-recipient-action": {
    id: "rule-recipient-action",
    predicateKind: "verb",
    objectRole: "governed-theme",
    contentSlots: [{ slotId: "object", particle: { kind: "fixed", particle: "ni" } }],
  },
  // Verb + a と-marked companion. The companion noun fills a dedicated
  // `companion` slot; `companion` is a discourse-optional governed role, so no
  // theme licensing applies (objectRole null).
  "rule-companion-action": {
    id: "rule-companion-action",
    predicateKind: "verb",
    objectRole: null,
    contentSlots: [{ slotId: "companion", particle: { kind: "fixed", particle: "to" } }],
  },
  // Verb + a bare time adverbial (no particle).
  "rule-time-action": {
    id: "rule-time-action",
    predicateKind: "verb",
    objectRole: null,
    contentSlots: [{ slotId: "time", particle: { kind: "none" } }],
  },
  // Identical shape to `rule-time-action`; kept distinct so the two fixture
  // families that historically referenced separate rule ids map 1:1.
  "rule-sequence-action": {
    id: "rule-sequence-action",
    predicateKind: "verb",
    objectRole: null,
    contentSlots: [{ slotId: "time", particle: { kind: "none" } }],
  },
  // Verb + a に-marked point-in-time adverbial (a clock time or a named day):
  // "しちじにおきます", "げつようびにいきます". Structurally a time slot like
  // `rule-time-action`, but the schedule reading fixes the に particle instead
  // of leaving the adverbial bare, so a frequency adverb (bare) and a clock
  // time (に) never collapse to the same surface.
  "rule-schedule-action": {
    id: "rule-schedule-action",
    predicateKind: "verb",
    objectRole: null,
    contentSlots: [{ slotId: "time", particle: { kind: "fixed", particle: "ni" } }],
  },
  // Verb + a へ-marked direction ("えきへいきます"). へ marks the direction of
  // motion; the goal noun fills the `location` slot exactly like the に
  // destination rule, only the fixed particle differs.
  "rule-direction-action": {
    id: "rule-direction-action",
    predicateKind: "verb",
    objectRole: null,
    contentSlots: [{ slotId: "location", particle: { kind: "fixed", particle: "he" } }],
  },
  // Verb + a から source and a まで limit spanning a departure→arrival route
  // ("とうきょうからおおさかまでいきます"). Both endpoints are location-kind
  // slots; the rule fixes each particle, so the sense supplies no case
  // metadata of its own.
  "rule-route-action": {
    id: "rule-route-action",
    predicateKind: "verb",
    objectRole: null,
    contentSlots: [
      { slotId: "source", particle: { kind: "fixed", particle: "kara" } },
      { slotId: "goal", particle: { kind: "fixed", particle: "made" } },
    ],
  },
  // Verb + a で means-of-transport and a に destination
  // ("でんしゃでえきにいきます"). The transport noun is a means adjunct on its
  // own `transport` slot marked で — grammatically distinct from the action
  // place で (`work` at a place) — and the destination keeps the に marking.
  "rule-transport-action": {
    id: "rule-transport-action",
    predicateKind: "verb",
    objectRole: null,
    contentSlots: [
      { slotId: "transport", particle: { kind: "fixed", particle: "de" } },
      { slotId: "location", particle: { kind: "fixed", particle: "ni" } },
    ],
  },
  // --- Phase 2 Module 9-11 constructions ---
  // Adjectival predicate "X は <adj>です" — the thing described is the topic は
  // and takes no governed object. i-/na-class morphology is chosen from the
  // sense's `adjectiveClass`, not from this rule.
  "rule-description": {
    id: "rule-description",
    predicateKind: "adjective",
    objectRole: null,
    contentSlots: [],
  },
  // Adjectival preference/desire "X は Y が <adj>です" — the stimulus (liked
  // thing / wanted thing) is a が-marked governed theme, so the sense declares
  // `theme`. Covers すき/きらい (na) and ほしい (i) uniformly.
  "rule-preference": {
    id: "rule-preference",
    predicateKind: "adjective",
    objectRole: "governed-theme",
    contentSlots: [{ slotId: "object", particle: { kind: "fixed", particle: "ga" } }],
  },
  // Adjectival comparison "X は Y より <adj>です" — Y is a より-marked standard
  // (an adjunct, never a governed theme), so `objectRole` stays null.
  "rule-comparison": {
    id: "rule-comparison",
    predicateKind: "adjective",
    objectRole: null,
    contentSlots: [{ slotId: "standard", particle: { kind: "fixed", particle: "yori" } }],
  },
  // Verb + を object + a bare floating quantifier ("りんごを みっつ かいます").
  // The quantity slot carries a counter word and takes no particle.
  "rule-quantified-action": {
    id: "rule-quantified-action",
    predicateKind: "verb",
    objectRole: "governed-theme",
    contentSlots: [
      { slotId: "object", particle: { kind: "fixed", particle: "o" } },
      { slotId: "quantity", particle: { kind: "none" } },
    ],
  },
  // Polite request "Y を ください" — the requested item is a を-marked governed
  // theme; the predicate value carries the standalone politeness word ください
  // (no verbal/copular ending).
  "rule-request": {
    id: "rule-request",
    predicateKind: "request",
    objectRole: "governed-theme",
    contentSlots: [
      { slotId: "object", particle: { kind: "fixed", particle: "o" } },
      { slotId: "quantity", particle: { kind: "none" } },
    ],
  },
  // Presentational existence "X が (place に) あります/います" — the entity is
  // the が-marked subject; an optional に-marked location gives its position.
  // The verb (ある/いる) is a normal ます-stem, so `predicateKind` is "verb";
  // only the subject particle (が) and the sense's `requiredSubjectAnimacy`
  // distinguish it from a topic construction.
  "rule-existence": {
    id: "rule-existence",
    predicateKind: "verb",
    objectRole: null,
    subjectParticle: "ga",
    contentSlots: [{ slotId: "location", particle: { kind: "fixed", particle: "ni" } }],
  },
  // --- Phase 3 Task 4 A2 constructions: "invariant" predicateKind ---
  // The predicate value's own fragments ARE the complete realized content
  // (a plain-form conjugation, a suffix composition, or a whole baked
  // clause/utterance authored once at catalog time) — no ending, copula, or
  // standalone politeness word is ever appended after them.
  //
  // A fully self-contained utterance with no separate content slot at all —
  // backchannels/follow-ups, connector-linked two-clause discourse,
  // clarification set phrases, plain-form recognition dialogue, yotei/tsumori
  // intentions, invitations, meeting arrangements, たことがあります experience
  // (reusing `composeA2Construction("experience-takoto", ...)`), ordered
  // narratives, から/ので reason clauses, と思います opinions, and
  // agree/disagree reactions can all be realized through this one rule.
  "rule-invariant-utterance": {
    id: "rule-invariant-utterance",
    predicateKind: "invariant",
    objectRole: null,
    contentSlots: [],
  },
  // --- Phase 3 Task 5 (M5-M8): "invariant" + a non-empty contentSlots —
  // genuinely compositional te-form/ている/permission/prohibition/request
  // constructions, so transfer novelty comes from recombining a suffixed
  // verb with a different object/location, not from whole-clause
  // duplication or subject-only swapping. `objectRole`/case-frame licensing
  // stays `null` (like `rule-companion-action`/`rule-time-action`): the
  // predicate's dedicated sense carries no governed argument role of its
  // own (the invariant predicate value is already the complete conjugated
  // content), so no theme/case-frame entanglement with the "real" verb
  // sense's own frame is ever introduced.
  //
  // Object marked を (e.g. "パンをたべています", "パンをたべてください").
  "rule-invariant-object": {
    id: "rule-invariant-object",
    predicateKind: "invariant",
    objectRole: null,
    contentSlots: [{ slotId: "object", particle: { kind: "fixed", particle: "o" } }],
  },
  // Location marked で (e.g. "ここでたべてもいいです", "としょかんでべんきょうしてはいけません").
  "rule-invariant-location": {
    id: "rule-invariant-location",
    predicateKind: "invariant",
    objectRole: null,
    contentSlots: [{ slotId: "location", particle: { kind: "fixed", particle: "de" } }],
  },
  // --- Phase 3 Task 6 (A2 M9 shopping-returns): genuinely compositional
  // favor-marked comparison and が-marked superlative. Both are
  // `predicateKind: "adjective"` — the SAME i-/na-class conjugation the
  // fixture "rule-description"/"rule-comparison" families already use — so
  // one adjective stem value (e.g. やす "yasu") recombines honestly across
  // every FormSelection (やすいです/やすくないです/やすかったです), never a
  // per-comparison whole-clause bake.
  //
  // Favor-marked comparison "XのほうがYよりADJです": the favored item (X)
  // takes the fixed の+ほう+が sequence (see `pushFavorMarker` below,
  // dispatched by the "favor-marker" content-slot particle strategy); the
  // standard (Y) takes より exactly like the existing `rule-comparison`.
  "rule-comparison-favor": {
    id: "rule-comparison-favor",
    predicateKind: "adjective",
    objectRole: null,
    contentSlots: [
      { slotId: "favored", particle: { kind: "favor-marker" } },
      { slotId: "standard", particle: { kind: "fixed", particle: "yori" } },
    ],
  },
  // Superlative "Xがいちばん ADJです": が-marked favored item (identifying
  // "which one" among an implicit set), with いちばん — fixed grammar
  // content, never authored per-value — inserted immediately before the
  // predicate stem via `predicateAdverbPrefix`.
  "rule-superlative": {
    id: "rule-superlative",
    predicateKind: "adjective",
    objectRole: null,
    contentSlots: [{ slotId: "favored", particle: { kind: "fixed", particle: "ga" } }],
    predicateAdverbPrefix: { jp: "いちばん", romaji: "ichiban" },
  },
  // --- Phase 3 Task 7 (A2 M13 relationships-events): あげる/もらう give-receive ---
  // Verb + a に-marked recipient/source + a を-marked gift/theme object, in
  // that natural word order ("そらにほんをあげます", "そらにほんをもらいます").
  // The recipient is a real "referent"-kind content slot — never the
  // grammatical subject/topic (see `realizeVariant`'s `subject`-only
  // special-casing for animacy/vocative/explicit rendering) — so the SAME
  // giver/receiver referent values already used as subjects elsewhere (e.g.
  // "a2-value-sora") recombine here with no new vocabulary. The gift/theme
  // object is licensed exactly like `rule-object-action`'s own を object
  // (`objectRole: "governed-theme"`), so あげる/もらう's shared sense frame
  // (`argumentRoles: ["agent","theme"]`) is generically checked, never a
  // Japanese-string switch. Perspective (who gives, who receives) is carried
  // entirely by which referent fills `subject` vs. `recipient` and by the
  // predicate's own verb choice — never by a different particle pattern.
  "rule-recipient-object-action": {
    id: "rule-recipient-object-action",
    predicateKind: "verb",
    objectRole: "governed-theme",
    contentSlots: [
      { slotId: "recipient", particle: { kind: "fixed", particle: "ni" } },
      { slotId: "object", particle: { kind: "fixed", particle: "o" } },
    ],
  },
};

/**
 * Backwards-compatible aliases: the original fixture rule ids resolve to the
 * stable semantic rule they always denoted. Adding an alias here can only make
 * a previously-unknown id resolvable — it never changes an existing
 * definition — so no fixture realization can regress.
 */
const RULE_ALIASES: Readonly<Record<string, string>> = {
  "fixture-a1-rule-topic-copular": "rule-topic-copular",
  "fixture-a1-rule-residence-action": "rule-location-action",
  "fixture-a1-rule-object-action": "rule-object-action",
  "fixture-a2-rule-time-action": "rule-time-action",
  "fixture-a2-rule-sequence-action": "rule-sequence-action",
  "fixture-a2-rule-invitation-action": "rule-recipient-action",
};

/** Resolve a family's `realizationRuleId` to its definition, honoring the
 * stable id first and the fixture alias second. */
function resolveRule(id: string): RealizationRuleDefinition | undefined {
  const direct = REALIZATION_RULES[id];
  if (direct) return direct;
  const canonical = RULE_ALIASES[id];
  return canonical ? REALIZATION_RULES[canonical] : undefined;
}

// ---------------------------------------------------------------------------
// Conjugation tables (polite present/past x affirmative/negative only)
// ---------------------------------------------------------------------------

interface EndingForm {
  readonly jp: string;
  readonly romaji: string;
}

type FormKey =
  | "present-affirmative"
  | "present-negative"
  | "past-affirmative"
  | "past-negative";

function formKey(tense: string, polarity: string): FormKey | null {
  const key = `${tense}-${polarity}`;
  if (
    key === "present-affirmative" ||
    key === "present-negative" ||
    key === "past-affirmative" ||
    key === "past-negative"
  ) {
    return key;
  }
  return null;
}

const VERB_POLITE_ENDINGS: Readonly<Record<FormKey, EndingForm>> = {
  "present-affirmative": { jp: "ます", romaji: "masu" },
  "present-negative": { jp: "ません", romaji: "masen" },
  "past-affirmative": { jp: "ました", romaji: "mashita" },
  "past-negative": { jp: "ませんでした", romaji: "masen deshita" },
};

/**
 * The polite copula is realized as a sequence of *standalone predicate*
 * morphemes, each a space-bound word in rōmaji — never a single ending fused
 * onto the preceding nominal (which produced the `gakuseidesu` run-on) and
 * never a single token hiding an internal `"dewa arimasen"` join. Concatenating
 * the `jp` of every segment reproduces the canonical spelling unchanged
 * (`です` / `でした` / `ではありません` / `ではありませんでした`).
 */
const COPULA_POLITE_ENDINGS: Readonly<Record<FormKey, readonly EndingForm[]>> = {
  "present-affirmative": [{ jp: "です", romaji: "desu" }],
  "present-negative": [
    { jp: "では", romaji: "dewa" },
    { jp: "ありません", romaji: "arimasen" },
  ],
  "past-affirmative": [{ jp: "でした", romaji: "deshita" }],
  "past-negative": [
    { jp: "では", romaji: "dewa" },
    { jp: "ありません", romaji: "arimasen" },
    { jp: "でした", romaji: "deshita" },
  ],
};

const PARTICLE_TEXT: Readonly<Record<SemanticParticleId, EndingForm>> = {
  wa: { jp: "は", romaji: "wa" },
  ga: { jp: "が", romaji: "ga" },
  o: { jp: "を", romaji: "o" },
  ni: { jp: "に", romaji: "ni" },
  de: { jp: "で", romaji: "de" },
  to: { jp: "と", romaji: "to" },
  // Direction へ is written with the へ kana but pronounced (and romanized) "e".
  he: { jp: "へ", romaji: "e" },
  // Source から and limit まで frame a departure/arrival span.
  kara: { jp: "から", romaji: "kara" },
  made: { jp: "まで", romaji: "made" },
  // Comparison standard より ("A は B より おおきいです").
  yori: { jp: "より", romaji: "yori" },
};

/**
 * The fixed, universal polite vocative-address honorific さん (Task 4 final
 * spec-fix "natural vocative"): fixed grammar-level content, exactly like
 * the polite copula/particle tables above — never a modeled semantic value
 * or per-referent lesson content, so a vocative subject reuses only the
 * referent's own already-modeled name tokens.
 */
const VOCATIVE_HONORIFIC: EndingForm = { jp: "さん", romaji: "san" };

/** The comma that always separates a vocative address from the utterance it
 * introduces (「そらさん、いいですね。」), immediately following さん with no
 * space of its own — exactly like every other authored comma. */
const VOCATIVE_COMMA: EndingForm = { jp: "、", romaji: "," };

/**
 * The fixed favor-marker sequence (Phase 3 Task 6, A2 comparison): の
 * (attributive particle) + ほう (a real, standalone noun — "direction/side")
 * that together with the が pushed via `PARTICLE_TEXT.ga` produce
 * "Xのほうが". Grammar-level fixed content exactly like
 * `VOCATIVE_HONORIFIC`/`VOCATIVE_COMMA` above — never a modeled semantic
 * value or per-lesson content, so a favored-item value recombines with it
 * compositionally.
 */
const FAVOR_MARKER_NO: EndingForm = { jp: "の", romaji: "no" };
const FAVOR_MARKER_HOU: EndingForm = { jp: "ほう", romaji: "hou" };

/**
 * i-adjective polite conjugation (§ Phase 2 M9/M11). Each key gives the bound
 * inflection that attaches to the adjective stem (あつ→あつ+い / あつ+くない /
 * あつ+かった / あつ+くなかった); an invariant standalone です is appended after
 * it by the assembler, so `atsui desu` / `atsukunai desu` / `atsukatta desu` /
 * `atsukunakatta desu` render with the copula spaced off as its own word.
 */
const I_ADJECTIVE_ENDINGS: Readonly<Record<FormKey, EndingForm>> = {
  "present-affirmative": { jp: "い", romaji: "i" },
  "present-negative": { jp: "くない", romaji: "kunai" },
  "past-affirmative": { jp: "かった", romaji: "katta" },
  "past-negative": { jp: "くなかった", romaji: "kunakatta" },
};

/** The invariant polite copula word that follows an i-adjective (です). */
const I_ADJECTIVE_COPULA: EndingForm = { jp: "です", romaji: "desu" };

/** Governed argument roles: `agent`/`topic` are discourse-driven and never
 * appear here (see `argumentParticleByRole` in ./types). `theme` is deliberately
 * excluded — object/theme case-frame licensing is validated generically from
 * the realization rule's own `objectRole` metadata (see the "governed-theme"
 * check below), not from this role->slot-kind mapping. */
const GOVERNED_ARGUMENT_ROLES: readonly SemanticArgumentRole[] = [
  "location",
  "time",
  "companion",
  "goal",
];

// ---------------------------------------------------------------------------
// Small lookup helpers
// ---------------------------------------------------------------------------

function findById<T extends { readonly id: string }>(
  items: readonly T[],
  id: string,
): T | undefined {
  return items.find((item) => item.id === id);
}

function slotByValueKind(
  family: SentenceFamily,
  valueKind: SentenceSlotDefinition["valueKind"],
): SentenceSlotDefinition | undefined {
  return family.slotSchema.find((slot) => slot.valueKind === valueKind);
}

/** Maps a governed (non-discourse) argument role to the semantic value kind
 * the family slot backing it must carry. `companion` has no slot mapping —
 * it is realized purely through `discourse.addresseeRoleId` — and is
 * handled separately by the caller before this is ever consulted. `theme`
 * has no mapping here either: it is licensed through the rule's `objectRole`
 * metadata instead (see the "governed-theme" check below). */
function valueKindForGovernedRole(
  role: SemanticArgumentRole,
): SentenceSlotDefinition["valueKind"] | undefined {
  switch (role) {
    case "location":
      return "location";
    case "time":
      return "time";
    case "goal":
      return "location";
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Token construction
// ---------------------------------------------------------------------------

interface TokenBuilder {
  readonly tokens: AssembledToken[];
}

function pushToken(
  builder: TokenBuilder,
  variantId: SentenceVariantId,
  idSuffix: string,
  jp: string,
  romaji: string,
  kind: RomajiTokenKind,
  source: TokenSourceRef,
  reading?: string,
  boundaryOverride?: RomajiBoundaryBefore,
): void {
  const index = builder.tokens.length;
  const token: AssembledToken = {
    id: `${variantId}::${idSuffix}`,
    jp,
    romaji,
    kind,
    // The explicit boundary override lets a rule force a spacing decision the
    // token kind alone would not produce (e.g. a space-bound standalone
    // predicate morpheme). It is deliberately ignored for the first token so a
    // sentence can never open with an illegal leading space (see
    // `validateTokens`); index 0 always attaches.
    boundaryBefore: boundaryBefore(kind, index, index === 0 ? undefined : boundaryOverride),
    source,
    ...(reading ? { reading } : {}),
  };
  builder.tokens.push(token);
}

function pushSlotFragments(
  builder: TokenBuilder,
  variantId: SentenceVariantId,
  slotId: SentenceSlotId,
  value: SemanticValue,
): void {
  value.tokenFragments.forEach((fragment, index) => {
    pushToken(
      builder,
      variantId,
      `slot::${slotId}::${index}`,
      fragment.jp,
      fragment.romaji,
      fragment.kind,
      { domain: "family", referenceId: `${variantId}/${slotId}` },
      fragment.reading,
    );
  });
}

function pushParticle(
  builder: TokenBuilder,
  variantId: SentenceVariantId,
  name: SemanticParticleId,
): void {
  const text = PARTICLE_TEXT[name];
  pushToken(
    builder,
    variantId,
    `rule::${name}`,
    text.jp,
    text.romaji,
    "particle",
    { domain: "family", referenceId: `${variantId}/rule/${name}` },
  );
}

/**
 * Appends the fixed さん honorific (a standalone word — the generic
 * kind/position boundary rule already gives it a leading space here,
 * exactly like any other lexical word that is not the sentence's first
 * token) then the 、 that always follows a vocative address (an attached
 * punctuation token, like every other authored comma). Called only after
 * the vocative subject's own referent tokens have already been pushed (see
 * the "vocative" branch below), so さん never renders as the sentence's
 * first token.
 */
function pushVocativeAddress(builder: TokenBuilder, variantId: SentenceVariantId): void {
  pushToken(
    builder,
    variantId,
    "rule::vocative::honorific",
    VOCATIVE_HONORIFIC.jp,
    VOCATIVE_HONORIFIC.romaji,
    "lexical",
    { domain: "family", referenceId: `${variantId}/rule/vocative` },
  );
  pushToken(
    builder,
    variantId,
    "rule::vocative::comma",
    VOCATIVE_COMMA.jp,
    VOCATIVE_COMMA.romaji,
    "punctuation",
    { domain: "family", referenceId: `${variantId}/rule/vocative` },
  );
}

/**
 * Appends the fixed の+ほう+が favor-marker sequence (Phase 3 Task 6, A2
 * comparison) after a favored-item slot's own value fragments: の and が are
 * "particle"-kind tokens (a real leading space, like any other particle);
 * ほう is a real, standalone "lexical" noun (also space-bound). Together with
 * the slot's already-pushed value this renders "X のほうが" — called only
 * from the content-slot loop below, after that slot's fragments.
 */
function pushFavorMarker(builder: TokenBuilder, variantId: SentenceVariantId): void {
  pushToken(
    builder,
    variantId,
    "rule::favor::no",
    FAVOR_MARKER_NO.jp,
    FAVOR_MARKER_NO.romaji,
    "particle",
    { domain: "family", referenceId: `${variantId}/rule/favor` },
  );
  pushToken(
    builder,
    variantId,
    "rule::favor::hou",
    FAVOR_MARKER_HOU.jp,
    FAVOR_MARKER_HOU.romaji,
    "lexical",
    { domain: "family", referenceId: `${variantId}/rule/favor` },
  );
  pushParticle(builder, variantId, "ga");
}

/**
 * A verb's polite inflection (`ます`/`ません`/…) is a bound morpheme: it
 * attaches to the preceding predicate stem with no space, so たべ+ます renders
 * as `tabemasu`. Emitted as a single `morpheme` token whose default boundary
 * (attach) is exactly right.
 */
function pushAttachedInflection(
  builder: TokenBuilder,
  variantId: SentenceVariantId,
  ending: EndingForm,
): void {
  pushToken(
    builder,
    variantId,
    "rule::ending",
    ending.jp,
    ending.romaji,
    "morpheme",
    { domain: "family", referenceId: `${variantId}/rule/ending` },
  );
}

/**
 * A space-bound standalone predicate/copula morpheme: a grammatical word that
 * stands on its own in rōmaji (a leading space before it), as opposed to a
 * bound inflection that attaches to a stem. This is the reusable boundary
 * facility later request rules (e.g. a `ください` politeness word) can call to
 * emit their own space-separated morphemes. `idSuffix` keeps every emitted
 * token id unique and source-traceable when a form contributes several pieces.
 */
function pushStandalonePredicate(
  builder: TokenBuilder,
  variantId: SentenceVariantId,
  idSuffix: string,
  piece: EndingForm,
): void {
  pushToken(
    builder,
    variantId,
    idSuffix,
    piece.jp,
    piece.romaji,
    "morpheme",
    { domain: "family", referenceId: `${variantId}/rule/${idSuffix}` },
    undefined,
    "space",
  );
}

// ---------------------------------------------------------------------------
// realizeVariant
// ---------------------------------------------------------------------------

export function realizeVariant(
  family: SentenceFamily,
  variant: SentenceVariant,
  catalogs: RealizeVariantCatalogs,
  options: RealizeVariantOptions,
): FamilyRealizationResult {
  const familyId = family.id;
  const variantId = variant.id;
  const fail = (
    errors: readonly Omit<FamilyRealizationError, "familyId" | "variantId">[],
  ): FamilyRealizationResult => ({
    ok: false,
    errors: errors.map((error) => ({ familyId, variantId, ...error })),
  });

  // 1. family/variant identity.
  if (variant.sentenceFamilyId !== family.id) {
    return fail([{ code: "family-variant-mismatch" }]);
  }

  // 2. family-shape integrity: every schema slot's axis must be permitted.
  const axisErrors = family.slotSchema
    .filter((slot) => !family.permittedAxes.includes(slot.axis))
    .map((slot) => ({
      code: "illegal-axis-value" as const,
      slotId: slot.id,
      referenceId: slot.axis,
    }));
  if (axisErrors.length > 0) {
    return fail(axisErrors);
  }

  // 3. context.
  const context = findById(catalogs.contexts, variant.contextId);
  if (!context) {
    return fail([{ code: "unknown-context", referenceId: variant.contextId }]);
  }

  // 4-6. discourse role/referent resolution.
  const discourseErrors: Omit<FamilyRealizationError, "familyId" | "variantId">[] = [];
  if (!findById(catalogs.personRoles, variant.discourse.speakerRoleId)) {
    discourseErrors.push({
      code: "unresolved-discourse-reference",
      referenceId: variant.discourse.speakerRoleId,
    });
  }
  if (
    variant.discourse.addresseeRoleId !== null &&
    !findById(catalogs.personRoles, variant.discourse.addresseeRoleId)
  ) {
    discourseErrors.push({
      code: "unresolved-discourse-reference",
      referenceId: variant.discourse.addresseeRoleId,
    });
  }
  let subjectReferent: Referent | undefined;
  if (variant.discourse.subjectReferentId !== null) {
    subjectReferent = findById(catalogs.referents, variant.discourse.subjectReferentId);
    if (!subjectReferent) {
      discourseErrors.push({
        code: "unresolved-discourse-reference",
        referenceId: variant.discourse.subjectReferentId,
      });
    }
  }
  if (discourseErrors.length > 0) {
    return fail(discourseErrors);
  }

  // 7. every family slot in schema order: presence, value resolution, kind.
  const slotErrors: Omit<FamilyRealizationError, "familyId" | "variantId">[] = [];
  const resolvedSlotValues = new Map<SentenceSlotId, SemanticValue>();
  for (const slotDef of family.slotSchema) {
    const valueId: SemanticValueId | undefined = variant.slotValues[slotDef.id];
    if (valueId === undefined) {
      if (!slotDef.optional) {
        slotErrors.push({ code: "missing-slot", slotId: slotDef.id });
      }
      continue;
    }
    const value = findById(catalogs.semanticValues, valueId);
    if (!value) {
      slotErrors.push({
        code: "unknown-semantic-value",
        slotId: slotDef.id,
        referenceId: valueId,
      });
      continue;
    }
    if (value.kind !== slotDef.valueKind) {
      slotErrors.push({
        code: "invalid-argument-structure",
        slotId: slotDef.id,
        referenceId: value.kind,
      });
      continue;
    }
    resolvedSlotValues.set(slotDef.id, value);
  }
  // An explicit or vocative subject realization always needs a resolved
  // subject value to render — fail closed here, even if the family schema
  // marks the "subject" slot optional (or the family has no "subject" slot
  // at all), rather than reaching the assembly stage with nothing to emit.
  // Omitted subjects never render a value even when one is resolved, so
  // they impose no such requirement (see step 15).
  if (
    (variant.discourse.subjectRealization === "explicit" ||
      variant.discourse.subjectRealization === "vocative") &&
    !resolvedSlotValues.has("subject") &&
    !slotErrors.some((error) => error.slotId === "subject")
  ) {
    slotErrors.push({ code: "missing-slot", slotId: "subject" });
  }
  if (slotErrors.length > 0) {
    return fail(slotErrors);
  }

  // 8. no undeclared slot.
  const declaredSlotIds = new Set(family.slotSchema.map((slot) => slot.id));
  const undeclaredErrors = Object.keys(variant.slotValues)
    .filter((slotId) => !declaredSlotIds.has(slotId))
    .map((slotId) => ({
      code: "invalid-argument-structure" as const,
      slotId,
      referenceId: variant.slotValues[slotId],
    }));
  if (undeclaredErrors.length > 0) {
    return fail(undeclaredErrors);
  }

  // 9. subject value animacy must match the resolved discourse referent.
  const subjectSlotDef = family.slotSchema.find((slot) => slot.id === "subject");
  if (subjectSlotDef && subjectSlotDef.valueKind === "referent" && subjectReferent) {
    const subjectValue = resolvedSlotValues.get("subject");
    if (subjectValue && subjectValue.animacy && subjectValue.animacy !== subjectReferent.animacy) {
      return fail([{ code: "incompatible-animacy", slotId: "subject" }]);
    }
  }

  // 9b. every resolved slot value's senseId — predicate or non-predicate —
  // must resolve in `learningTargetSenses`, in deterministic family
  // slot-schema order (the `resolvedSlotValues` map was populated in that
  // same order at step 7, so a `for...of` over it iterates schema order).
  // Any slot kind may carry a senseId; this is not hardcoded to the
  // predicate slot. An unresolvable non-predicate senseId (e.g. an
  // object/location/time value pointing at a nonexistent sense) fails
  // closed here as `unknown-sense`, exactly like an unresolvable predicate
  // sense, and — because the realizer returns before ever reaching
  // assembly — it can never surface in a successful `usedLexemeSenseIds`.
  // Predicate-specific frame checks (step 11) run only after every slot's
  // sense reference is confirmed known-good here.
  const senseIdErrors: Omit<FamilyRealizationError, "familyId" | "variantId">[] = [];
  for (const [slotId, value] of resolvedSlotValues) {
    if (value.senseId && !findById(catalogs.learningTargetSenses, value.senseId)) {
      senseIdErrors.push({ code: "unknown-sense", slotId, referenceId: value.senseId });
    }
  }
  if (senseIdErrors.length > 0) {
    return fail(senseIdErrors);
  }

  // 10. resolve predicate sense.
  const predicateSlotDef = family.slotSchema.find((slot) => slot.id === "predicate");
  const predicateValue = predicateSlotDef ? resolvedSlotValues.get("predicate") : undefined;
  const senseId = predicateValue?.senseId;
  const sense = senseId ? findById(catalogs.learningTargetSenses, senseId) : undefined;
  if (!sense) {
    return fail([
      { code: "unknown-sense", slotId: "predicate", referenceId: senseId ?? "" },
    ]);
  }

  // 10b. existence-verb subject animacy (§ Phase 2 M11). A sense that pins the
  // animacy of its が-marked subject (あります → inanimate, います → animate)
  // can never be realized with a subject whose value carries the other
  // animacy — enforced generically from `requiredSubjectAnimacy`, never a
  // Japanese-string switch. Fails closed exactly like the topic-subject
  // animacy check (step 9).
  if (sense.requiredSubjectAnimacy) {
    const existenceSubject = resolvedSlotValues.get("subject");
    if (
      existenceSubject &&
      existenceSubject.animacy &&
      existenceSubject.animacy !== sense.requiredSubjectAnimacy
    ) {
      return fail([{ code: "incompatible-animacy", slotId: "subject" }]);
    }
  }

  // 11. sense argument frame vs. family structure/case-frame requirements.
  const rule = resolveRule(family.realizationRuleId);
  const frameErrors: Omit<FamilyRealizationError, "familyId" | "variantId">[] = [];
  const governedRoles = sense.argumentRoles.filter((role) =>
    GOVERNED_ARGUMENT_ROLES.includes(role),
  );
  for (const role of governedRoles) {
    // `companion` is discourse-optional: some senses (e.g. `invite`) list it
    // because a companion/addressee is semantically implied, but no fixture
    // family carries a dedicated companion slot and `discourse.addresseeRoleId`
    // is legitimately null even for those senses (naturally-omitted transfer
    // variants). It has no structural backing to validate here.
    if (role === "companion") {
      continue;
    }
    const valueKind = valueKindForGovernedRole(role);
    if (!valueKind || !slotByValueKind(family, valueKind)) {
      frameErrors.push({ code: "invalid-argument-structure", referenceId: role });
    }
  }
  const locationSlot = slotByValueKind(family, "location");
  if (locationSlot && !sense.argumentRoles.includes("location")) {
    frameErrors.push({
      code: "invalid-argument-structure",
      slotId: locationSlot.id,
      referenceId: "location",
    });
  }
  const timeSlot = slotByValueKind(family, "time");
  if (timeSlot && !sense.argumentRoles.includes("time")) {
    frameErrors.push({
      code: "invalid-argument-structure",
      slotId: timeSlot.id,
      referenceId: "time",
    });
  }
  if (rule) {
    // Object/theme case-frame licensing (§16 case-frame extension), driven
    // generically from the rule's own `objectRole` metadata — never from a
    // family/sense/Japanese string switch. A "governed-theme" object slot is
    // a predicate-governed argument, so the sense must declare `theme`; a
    // "copular-complement" object never requires it; `null` means the rule
    // has no object slot to license at all.
    if (rule.objectRole === "governed-theme" && !sense.argumentRoles.includes("theme")) {
      const objectSlot = slotByValueKind(family, "object");
      frameErrors.push({
        code: "invalid-argument-structure",
        slotId: objectSlot?.id ?? "object",
        referenceId: "theme",
      });
    }
    // Forward direction of the same invariant: `argumentRoles` is the
    // sense's *required* semantic frame, so a sense that declares `theme`
    // must never be realized through a rule/family that would silently
    // drop it — the selected rule must both be `"governed-theme"` and
    // actually have an `object` slot to carry it. `be`'s `topic` role is
    // deliberately not part of this check (`topic` is discourse-driven, not
    // a governed argument, and `topic-copular`'s `object` slot rightly stays
    // `copular-complement`); `companion` likewise stays discourse/addressee
    // metadata rather than a slot unless a future rule declares one (see
    // the `companion` skip above) and is never checked here either.
    if (
      sense.argumentRoles.includes("theme") &&
      (rule.objectRole !== "governed-theme" || !slotByValueKind(family, "object"))
    ) {
      const objectSlot = slotByValueKind(family, "object");
      frameErrors.push({
        code: "invalid-argument-structure",
        slotId: objectSlot?.id ?? "object",
        referenceId: "theme",
      });
    }
    for (const contentSlot of rule.contentSlots) {
      if (contentSlot.particle.kind === "from-sense-metadata") {
        const declaredParticle = sense.argumentParticleByRole[contentSlot.particle.role];
        if (!declaredParticle) {
          frameErrors.push({
            code: "invalid-argument-structure",
            slotId: contentSlot.slotId,
            referenceId: contentSlot.particle.role,
          });
        }
      }
    }
  }
  if (frameErrors.length > 0) {
    return fail(frameErrors);
  }

  // 12. required concepts must already be taught.
  const conceptErrors = family.requiredConceptIds
    .filter((conceptId) => !options.availableConceptIds.includes(conceptId))
    .map((conceptId) => ({
      code: "unmet-concept-requirement" as const,
      referenceId: conceptId,
    }));
  if (conceptErrors.length > 0) {
    return fail(conceptErrors);
  }

  // 13. resolve the realization rule itself (no fallback rule).
  if (!rule) {
    return fail([{ code: "unknown-realization-rule", referenceId: family.realizationRuleId }]);
  }

  // 14. execute: resolve the grammatical form's ending. An "invariant"
  // predicate's own baked fragments already ARE the complete realized
  // content (see the assembly step below) — its FormSelection is honest
  // *metadata describing* that baked register (plain/negative/past/
  // past-negative all included, § M4 spec-fix "form metadata"), never a
  // lookup key into the polite ending tables below, so it is the only
  // predicateKind allowed a non-"polite" formality.
  const isInvariant = rule.predicateKind === "invariant";
  if (!isInvariant && variant.form.formality !== "polite") {
    return fail([{ code: "invalid-conjugation", referenceId: variant.form.formality }]);
  }
  const key = formKey(variant.form.tense, variant.form.polarity);
  if (!key) {
    return fail([{ code: "invalid-conjugation", referenceId: variant.form.tense }]);
  }
  const isCopula = rule.predicateKind === "copula";
  const isAdjective = rule.predicateKind === "adjective";
  const isRequest = rule.predicateKind === "request";
  const verbEnding = VERB_POLITE_ENDINGS[key];
  const copulaPieces = COPULA_POLITE_ENDINGS[key];

  // 15. assemble tokens.
  const builder: TokenBuilder = { tokens: [] };
  if (variant.discourse.subjectRealization === "explicit") {
    // Validated above (step 7): an explicit subject always has a resolved
    // value here — no unsafe cast needed, and this never throws even if
    // that invariant were ever violated.
    const subjectValue = resolvedSlotValues.get("subject");
    if (subjectValue) {
      pushSlotFragments(builder, variant.id, "subject", subjectValue);
      // The subject particle is は for every topic construction and が for
      // presentational existence — read from the rule, never hardcoded.
      pushParticle(builder, variant.id, rule.subjectParticle ?? "wa");
    }
  } else if (variant.discourse.subjectRealization === "vocative") {
    // Task 4 final spec-fix ("natural vocative"): a direct-address vocative
    // (referent's own tokens + さん + 、) instead of a topic-marked subject —
    // never は, regardless of the rule's own `subjectParticle`, because a
    // vocative address is not the grammatical topic/subject of the
    // sentence that follows it. Validated above (step 7) exactly like
    // "explicit": a vocative subject always has a resolved value here.
    const subjectValue = resolvedSlotValues.get("subject");
    if (subjectValue) {
      pushSlotFragments(builder, variant.id, "subject", subjectValue);
      pushVocativeAddress(builder, variant.id);
    }
  }
  for (const contentSlot of rule.contentSlots) {
    const value = resolvedSlotValues.get(contentSlot.slotId);
    if (!value) continue;
    pushSlotFragments(builder, variant.id, contentSlot.slotId, value);
    if (contentSlot.particle.kind === "fixed") {
      pushParticle(builder, variant.id, contentSlot.particle.particle);
    } else if (contentSlot.particle.kind === "from-sense-metadata") {
      const particleId = sense.argumentParticleByRole[
        contentSlot.particle.role
      ] as SemanticParticleId;
      pushParticle(builder, variant.id, particleId);
    } else if (contentSlot.particle.kind === "favor-marker") {
      pushFavorMarker(builder, variant.id);
    }
  }
  // A fixed adverb (e.g. いちばん) the rule itself contributes, inserted
  // immediately before the predicate stem — genuinely fixed grammar content,
  // never authored per semantic value (§ Phase 3 Task 6 superlative).
  if (rule.predicateAdverbPrefix) {
    pushToken(
      builder,
      variant.id,
      "rule::predicate-adverb-prefix",
      rule.predicateAdverbPrefix.jp,
      rule.predicateAdverbPrefix.romaji,
      "lexical",
      { domain: "family", referenceId: `${variant.id}/rule/predicate-adverb-prefix` },
    );
  }
  // A verb, adjective, or invariant family emits its predicate value's own
  // stem/complete-content fragments before any ending; a request emits its
  // politeness word as a standalone word (below); a copula emits no stem. An
  // invariant predicate's fragments ARE the complete content — the branch
  // below adds nothing further after them.
  if ((rule.predicateKind === "verb" || isAdjective || isInvariant) && predicateValue) {
    pushSlotFragments(builder, variant.id, "predicate", predicateValue);
  }
  if (isInvariant) {
    // No ending, copula, or standalone politeness word is ever appended: the
    // predicate value's own fragments (pushed above) are already the
    // complete realized content.
  } else if (isCopula) {
    // The polite copula is a run of space-bound standalone predicate pieces
    // (です / でした / では + ありません [+ でした]); each is its own
    // traceable token so the shared formatter spaces them (`gakusei desu`),
    // never a hidden run-on ending fused onto the nominal.
    copulaPieces.forEach((piece, index) => {
      pushStandalonePredicate(builder, variant.id, `rule::copula::${index}`, piece);
    });
  } else if (isAdjective) {
    if (sense.adjectiveClass === "i") {
      // i-adjective: bound inflection on the stem (あつ+い) then an invariant
      // standalone です spaced off as its own word (`atsui desu`).
      pushAttachedInflection(builder, variant.id, I_ADJECTIVE_ENDINGS[key]);
      pushStandalonePredicate(builder, variant.id, "rule::adj-copula", I_ADJECTIVE_COPULA);
    } else {
      // na-adjective: the conjugating polite copula follows the stem
      // (しずか + です / しずか + では ありません).
      copulaPieces.forEach((piece, index) => {
        pushStandalonePredicate(builder, variant.id, `rule::copula::${index}`, piece);
      });
    }
  } else if (isRequest) {
    // Polite request: the predicate value carries the standalone politeness
    // word ください, emitted as its own spaced word after the を-marked item;
    // there is no verbal/copular ending.
    if (predicateValue) {
      predicateValue.tokenFragments.forEach((fragment, index) => {
        pushStandalonePredicate(builder, variant.id, `rule::request::${index}`, {
          jp: fragment.jp,
          romaji: fragment.romaji,
        });
      });
    }
  } else {
    // Verb inflection is a bound morpheme that attaches to its stem.
    pushAttachedInflection(builder, variant.id, verbEnding);
  }
  // Sentence-final interrogative particle か (§13). Appended after the
  // predicate ending as a spaced particle; only added for interrogative forms
  // so every plain-statement realization is byte-identical to before.
  if (variant.form.interrogative === true) {
    pushToken(
      builder,
      variant.id,
      "rule::interrogative",
      "か",
      "ka",
      "particle",
      { domain: "family", referenceId: `${variant.id}/rule/interrogative` },
    );
  }

  const romajiResult = formatRomaji(builder.tokens);
  if (!romajiResult.ok) {
    return fail([{ code: "invalid-romaji-sequence" }]);
  }

  const canonicalJapanese = builder.tokens.map((token) => token.jp).join("");
  const sortedSlotEntries = Object.keys(variant.slotValues)
    .sort()
    .map((key2) => `${key2}=${variant.slotValues[key2]}`)
    .join(",");
  const fingerprintSegments = [
    `family=${family.id}`,
    `speaker=${variant.discourse.speakerRoleId}`,
    `addressee=${variant.discourse.addresseeRoleId ?? "none"}`,
    `subjectReferent=${variant.discourse.subjectReferentId ?? "none"}`,
    `subjectRealization=${variant.discourse.subjectRealization}`,
    `sense=${sense.id}`,
    `context=${variant.contextId}`,
    `form=${variant.form.polarity}:${variant.form.tense}:${variant.form.formality}`,
    `slots=${sortedSlotEntries}`,
  ];
  // Mood is only recorded for questions, so statement fingerprints are
  // unchanged. A question and its matching statement therefore differ by
  // exactly this segment — the intended semantic distinction.
  if (variant.form.interrogative === true) {
    fingerprintSegments.push(`mood=interrogative`);
  }
  const semanticFingerprint = fingerprintSegments.join("|");

  // Every resolved semantic value's senseId, in deterministic family
  // slot-schema order (the `Map` insertion order from step 7), deduplicated
  // by first occurrence. Any slot kind may carry a senseId — this is not
  // hardcoded to the predicate slot alone — and the predicate's own sense
  // is included via its resolved value like any other slot.
  const usedLexemeSenseIds: LexemeSenseId[] = [];
  const seenSenseIds = new Set<LexemeSenseId>();
  for (const value of resolvedSlotValues.values()) {
    if (value.senseId && !seenSenseIds.has(value.senseId)) {
      seenSenseIds.add(value.senseId);
      usedLexemeSenseIds.push(value.senseId);
    }
  }

  const sentence: RealizedSentence = {
    familyId: family.id,
    variantId: variant.id,
    tokens: builder.tokens,
    canonicalJapanese,
    visibleTargetKey: canonicalJapanese.normalize("NFC"),
    semanticFingerprint,
    predicateSenseId: sense.id as LexemeSenseId,
    discourse: variant.discourse,
    contextId: variant.contextId,
    pedagogicalUse: variant.pedagogicalUse,
    usedConceptIds: [...family.requiredConceptIds],
    usedLexemeSenseIds,
  };

  return { ok: true, sentence };
}
