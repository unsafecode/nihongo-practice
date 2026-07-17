import type {
  CanDo,
  CheckpointDefinition,
  Context,
  CourseLevel,
  FoundationCatalogs,
  FoundationLessonDefinition,
  FoundationModule,
  LearningTargetSense,
  LessonPositionRecord,
  PersonRole,
  Referent,
  SemanticValue,
  SemanticValueTokenFragment,
  SentenceFamily,
  SentenceVariant,
  VerbUseRecord,
} from "./types";
import { deepFreeze } from "./deepFreeze";

/**
 * Phase 1 Task 1 fixture data: representative A1/A2 sentence-foundation
 * content built exactly on the `./types` contracts. This module is
 * data-only — no realizer/selector/validator logic lives here (those are
 * later tasks' owner files); it only authors and exports frozen catalog
 * fixtures plus small strict lookup helpers.
 */

function frag(
  jp: string,
  romaji: string,
  kind: SemanticValueTokenFragment["kind"] = "lexical",
): SemanticValueTokenFragment {
  return { jp, romaji, kind, boundaryBefore: "attach" };
}

/**
 * Every fixture catalog/lesson/copy structure in this module is authored as
 * nested plain data (arrays of objects, objects of arrays, arrays of arrays,
 * ...) that must be frozen in place. The cycle-safe recursive freeze now lives
 * in the shared `./deepFreeze` utility so the A1 release authoring layer reuses
 * the exact same immutability guarantee instead of duplicating it.
 */
function freeze<T>(value: T): T {
  return deepFreeze(value);
}

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

const contexts: readonly Context[] = freeze([
  { id: "fixture-a1-context-first-meeting", labelCopyId: "fixture-a1-context-first-meeting-label" },
  { id: "fixture-a1-context-language-class", labelCopyId: "fixture-a1-context-language-class-label" },
  { id: "fixture-a1-context-workplace", labelCopyId: "fixture-a1-context-workplace-label" },
  { id: "fixture-a2-context-weekday-routine", labelCopyId: "fixture-a2-context-weekday-routine-label" },
  { id: "fixture-a2-context-after-work", labelCopyId: "fixture-a2-context-after-work-label" },
  { id: "fixture-a2-context-weekend-plan", labelCopyId: "fixture-a2-context-weekend-plan-label" },
]);

// ---------------------------------------------------------------------------
// Person roles
// ---------------------------------------------------------------------------

const personRoles: readonly PersonRole[] = freeze([
  { id: "fixture-role-learner", kind: "learner", labelCopyId: "fixture-role-learner-label" },
  { id: "fixture-role-yuki", kind: "persona", labelCopyId: "fixture-role-yuki-label" },
  { id: "fixture-a1-role-ken", kind: "persona", labelCopyId: "fixture-a1-role-ken-label" },
  { id: "fixture-a1-role-teacher", kind: "social", labelCopyId: "fixture-a1-role-teacher-label" },
  { id: "fixture-a1-role-classmate", kind: "social", labelCopyId: "fixture-a1-role-classmate-label" },
  { id: "fixture-a1-role-clerk", kind: "unnamed", labelCopyId: "fixture-a1-role-clerk-label" },
  { id: "fixture-a2-role-colleague", kind: "social", labelCopyId: "fixture-a2-role-colleague-label" },
  { id: "fixture-a2-role-neighbor", kind: "social", labelCopyId: "fixture-a2-role-neighbor-label" },
  { id: "fixture-a2-role-friend", kind: "social", labelCopyId: "fixture-a2-role-friend-label" },
  { id: "fixture-a2-role-traveler", kind: "unnamed", labelCopyId: "fixture-a2-role-traveler-label" },
]);

// ---------------------------------------------------------------------------
// Referents
// ---------------------------------------------------------------------------

const referents: readonly Referent[] = freeze([
  { id: "fixture-referent-yuki", personRoleId: "fixture-role-yuki", animacy: "animate", labelCopyId: "fixture-referent-yuki-label" },
  { id: "fixture-a1-referent-ken", personRoleId: "fixture-a1-role-ken", animacy: "animate", labelCopyId: "fixture-a1-referent-ken-label" },
  { id: "fixture-a1-referent-teacher", personRoleId: "fixture-a1-role-teacher", animacy: "animate", labelCopyId: "fixture-a1-referent-teacher-label" },
  { id: "fixture-a1-referent-classmate", personRoleId: "fixture-a1-role-classmate", animacy: "animate", labelCopyId: "fixture-a1-referent-classmate-label" },
  { id: "fixture-a1-referent-clerk", personRoleId: "fixture-a1-role-clerk", animacy: "animate", labelCopyId: "fixture-a1-referent-clerk-label" },
  { id: "fixture-a2-referent-colleague", personRoleId: "fixture-a2-role-colleague", animacy: "animate", labelCopyId: "fixture-a2-referent-colleague-label" },
  { id: "fixture-a2-referent-neighbor", personRoleId: "fixture-a2-role-neighbor", animacy: "animate", labelCopyId: "fixture-a2-referent-neighbor-label" },
  { id: "fixture-a2-referent-friend", personRoleId: "fixture-a2-role-friend", animacy: "animate", labelCopyId: "fixture-a2-referent-friend-label" },
  { id: "fixture-a2-referent-traveler", personRoleId: "fixture-a2-role-traveler", animacy: "animate", labelCopyId: "fixture-a2-referent-traveler-label" },
  { id: "fixture-a2-referent-learner-self", personRoleId: "fixture-role-learner", animacy: "animate", labelCopyId: "fixture-a2-referent-learner-self-label" },
]);

// ---------------------------------------------------------------------------
// Learning target senses
// ---------------------------------------------------------------------------

// Every sense below either declares a particle for *every* predicate-governed
// argument role in `argumentRoles` (a complete case frame) or leaves
// `argumentParticleByRole` empty (no predicate-specific case marking is
// authored yet). `agent` and `topic` are discourse-driven, so they are never
// required here. `live`/`work` are the motivating case: they share the
// `fixture-a1-residence-action` family/rule id, so the family/rule alone
// cannot distinguish に from で — the distinction lives here, on the sense.
const learningTargetSenses: readonly LearningTargetSense[] = freeze([
  { id: "fixture-a1-sense-be", lexemeId: "fixture-a1-lexeme-desu", learningUse: "productive", semanticFrameId: "fixture-frame-identity", predicate: "be", argumentRoles: ["topic"], argumentParticleByRole: {} },
  { id: "fixture-a1-sense-live", lexemeId: "fixture-a1-lexeme-sumu", learningUse: "productive", semanticFrameId: "fixture-frame-residence", predicate: "live", argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "ni" } },
  { id: "fixture-a1-sense-study", lexemeId: "fixture-a1-lexeme-benkyousuru", learningUse: "productive", semanticFrameId: "fixture-frame-study", predicate: "study", argumentRoles: ["agent", "theme"], argumentParticleByRole: {} },
  { id: "fixture-a1-sense-work", lexemeId: "fixture-a1-lexeme-hataraku", learningUse: "productive", semanticFrameId: "fixture-frame-work-location", predicate: "work", argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "de" } },
  { id: "fixture-a2-sense-wake", lexemeId: "fixture-a2-lexeme-okiru", learningUse: "productive", semanticFrameId: "fixture-frame-wake", predicate: "wake", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "fixture-a2-sense-work", lexemeId: "fixture-a2-lexeme-hataraku", learningUse: "productive", semanticFrameId: "fixture-frame-work-routine", predicate: "work", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "fixture-a2-sense-meet", lexemeId: "fixture-a2-lexeme-au", learningUse: "productive", semanticFrameId: "fixture-frame-meet", predicate: "meet", argumentRoles: ["agent", "companion", "time"], argumentParticleByRole: {} },
  { id: "fixture-a2-sense-eat", lexemeId: "fixture-a2-lexeme-taberu", learningUse: "productive", semanticFrameId: "fixture-frame-eat", predicate: "eat", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "fixture-a2-sense-go", lexemeId: "fixture-a2-lexeme-dekakeru", learningUse: "productive", semanticFrameId: "fixture-frame-go", predicate: "go", argumentRoles: ["agent", "time"], argumentParticleByRole: {} },
  { id: "fixture-a2-sense-invite", lexemeId: "fixture-a2-lexeme-sasou", learningUse: "productive", semanticFrameId: "fixture-frame-invite", predicate: "invite", argumentRoles: ["agent", "theme", "companion"], argumentParticleByRole: {} },
]);

// ---------------------------------------------------------------------------
// Semantic values (the only place Japanese/romaji content is authored)
// ---------------------------------------------------------------------------

const semanticValues: readonly SemanticValue[] = freeze([
  // referent-kind (subject surface forms)
  { id: "fixture-value-yuki", kind: "referent", animacy: "animate", tokenFragments: [frag("ゆき", "yuki")] },
  { id: "fixture-a1-value-ken", kind: "referent", animacy: "animate", tokenFragments: [frag("けん", "ken")] },
  { id: "fixture-a1-value-teacher-referent", kind: "referent", animacy: "animate", tokenFragments: [frag("せんせい", "sensei")] },
  { id: "fixture-a1-value-classmate-referent", kind: "referent", animacy: "animate", tokenFragments: [frag("どうきゅうせい", "doukyuusei")] },
  { id: "fixture-a1-value-clerk-referent", kind: "referent", animacy: "animate", tokenFragments: [frag("しゃいん", "shain")] },
  { id: "fixture-a2-value-colleague-referent", kind: "referent", animacy: "animate", tokenFragments: [frag("どうりょう", "douryou")] },
  { id: "fixture-a2-value-neighbor-referent", kind: "referent", animacy: "animate", tokenFragments: [frag("りんじん", "rinjin")] },
  { id: "fixture-a2-value-friend-referent", kind: "referent", animacy: "animate", tokenFragments: [frag("ともだち", "tomodachi")] },
  { id: "fixture-a2-value-traveler-referent", kind: "referent", animacy: "animate", tokenFragments: [frag("りょこうしゃ", "ryokousha")] },
  { id: "fixture-a2-value-learner-self-referent", kind: "referent", animacy: "animate", tokenFragments: [frag("わたし", "watashi")] },

  // predicate-sense-kind (polite ます-stem only; endings belong to realization rules)
  { id: "fixture-a1-value-be", kind: "predicate-sense", senseId: "fixture-a1-sense-be", tokenFragments: [] },
  { id: "fixture-a1-value-live", kind: "predicate-sense", senseId: "fixture-a1-sense-live", tokenFragments: [frag("すみ", "sumi")] },
  { id: "fixture-a1-value-study", kind: "predicate-sense", senseId: "fixture-a1-sense-study", tokenFragments: [frag("べんきょうし", "benkyoushi")] },
  { id: "fixture-a1-value-work", kind: "predicate-sense", senseId: "fixture-a1-sense-work", tokenFragments: [frag("はたらき", "hataraki")] },
  { id: "fixture-a2-value-wake", kind: "predicate-sense", senseId: "fixture-a2-sense-wake", tokenFragments: [frag("おき", "oki")] },
  { id: "fixture-a2-value-work", kind: "predicate-sense", senseId: "fixture-a2-sense-work", tokenFragments: [frag("はたらき", "hataraki")] },
  { id: "fixture-a2-value-meet", kind: "predicate-sense", senseId: "fixture-a2-sense-meet", tokenFragments: [frag("あい", "ai")] },
  { id: "fixture-a2-value-eat", kind: "predicate-sense", senseId: "fixture-a2-sense-eat", tokenFragments: [frag("たべ", "tabe")] },
  { id: "fixture-a2-value-go", kind: "predicate-sense", senseId: "fixture-a2-sense-go", tokenFragments: [frag("でかけ", "dekake")] },
  { id: "fixture-a2-value-invite", kind: "predicate-sense", senseId: "fixture-a2-sense-invite", tokenFragments: [frag("さそい", "sasoi")] },

  // object-kind
  { id: "fixture-a1-value-object-student", kind: "object", tokenFragments: [frag("がくせい", "gakusei")] },
  { id: "fixture-a1-value-object-doctor", kind: "object", tokenFragments: [frag("いしゃ", "isha")] },
  { id: "fixture-a1-value-object-teacher-role", kind: "object", tokenFragments: [frag("せんせい", "sensei")] },
  { id: "fixture-a1-value-object-japanese", kind: "object", tokenFragments: [frag("にほんご", "nihongo")] },
  { id: "fixture-a1-value-object-english", kind: "object", tokenFragments: [frag("えいご", "eigo")] },
  { id: "fixture-a2-value-object-lunch", kind: "object", tokenFragments: [frag("ランチ", "ranchi")] },
  { id: "fixture-a2-value-object-movie", kind: "object", tokenFragments: [frag("えいが", "eiga")] },

  // location-kind
  { id: "fixture-a1-value-location-rome", kind: "location", tokenFragments: [frag("ローマ", "rooma")] },
  { id: "fixture-a1-value-location-milan", kind: "location", tokenFragments: [frag("ミラノ", "mirano")] },
  { id: "fixture-a1-value-location-company", kind: "location", tokenFragments: [frag("かいしゃ", "kaisha")] },

  // time-kind
  { id: "fixture-a2-value-time-every-morning", kind: "time", tokenFragments: [frag("まいあさ", "maiasa")] },
  { id: "fixture-a2-value-time-morning", kind: "time", tokenFragments: [frag("あさ", "asa")] },
  { id: "fixture-a2-value-time-after-work", kind: "time", tokenFragments: [frag("しごとのあとで", "shigoto no ato de")] },
  { id: "fixture-a2-value-time-weekend", kind: "time", tokenFragments: [frag("しゅうまつ", "shuumatsu")] },
  { id: "fixture-a2-value-time-tomorrow", kind: "time", tokenFragments: [frag("あした", "ashita")] },
]);

// ---------------------------------------------------------------------------
// Sentence families
// ---------------------------------------------------------------------------

const sentenceFamilies: readonly SentenceFamily[] = freeze([
  {
    id: "fixture-a1-topic-copular",
    level: "a1",
    canDoIds: ["fixture-a1-can-do-personal-details"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "fixture-a1-rule-topic-copular",
    requiredConceptIds: ["fixture-concept-topic-wa", "fixture-concept-copula-desu"],
  },
  // `live` (location に) and `work` (location で) both use this family and
  // its `fixture-a1-rule-residence-action` realization rule. The family/
  // rule id is kept stable on purpose — no fixture churn — because the
  // particle distinction is not the family's job: `fixture-a1-rule-
  // residence-action` reads the location particle from the governing
  // predicate sense's own `argumentParticleByRole["location"]` case frame
  // (see `fixture-a1-sense-live`/`fixture-a1-sense-work` in
  // `learningTargetSenses`), so one generic rule realizes both
  // 「ローマにすみます」 and 「かいしゃではたらきます」 without a
  // string/sense special case anywhere in this family or its variants.
  {
    id: "fixture-a1-residence-action",
    level: "a1",
    canDoIds: ["fixture-a1-can-do-personal-details"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "location", axis: "location", valueKind: "location", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "location", "polarity-tense-form", "context"],
    realizationRuleId: "fixture-a1-rule-residence-action",
    requiredConceptIds: ["fixture-concept-location-particle"],
  },
  {
    id: "fixture-a1-object-action",
    level: "a1",
    canDoIds: ["fixture-a1-can-do-personal-details"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "fixture-a1-rule-object-action",
    requiredConceptIds: ["fixture-concept-object-particle-wo"],
  },
  {
    id: "fixture-a2-time-action",
    level: "a2",
    canDoIds: ["fixture-a2-can-do-routine-plans"],
    slotSchema: [
      // Subject is semantically required at the slot-schema level: every
      // variant — explicit or naturally omitted (pro-drop) — carries a
      // populated "subject" slot value, since the referent's semantic
      // presence is not affected by whether the surface form realizes it.
      // Only `discourse.subjectRealization` controls surface omission; the
      // realizer, not this schema, decides whether to emit subject/topic
      // tokens.
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "time", axis: "time", valueKind: "time", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "time", "polarity-tense-form", "context"],
    realizationRuleId: "fixture-a2-rule-time-action",
    requiredConceptIds: ["fixture-concept-time-expression"],
  },
  {
    id: "fixture-a2-sequence-action",
    level: "a2",
    canDoIds: ["fixture-a2-can-do-routine-plans"],
    slotSchema: [
      // See fixture-a2-time-action above: subject is semantically required
      // regardless of surface realization.
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "time", axis: "time", valueKind: "time", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "time", "polarity-tense-form", "context"],
    realizationRuleId: "fixture-a2-rule-sequence-action",
    requiredConceptIds: ["fixture-concept-sequence-after"],
  },
  {
    id: "fixture-a2-invitation-action",
    level: "a2",
    canDoIds: ["fixture-a2-can-do-routine-plans"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "polarity-tense-form", "context"],
    realizationRuleId: "fixture-a2-rule-invitation-action",
    requiredConceptIds: ["fixture-concept-invitation-particle-ni"],
  },
]);

const AFFIRMATIVE_PRESENT_POLITE = freeze({
  polarity: "affirmative",
  tense: "present",
  formality: "polite",
} as const);

/** Convenience builder for the A1/A2 discourse frame convention used across
 * this fixture set: the subject describes themselves (`speakerRoleId` ===
 * the subject's own role), except the learner's own omitted self-statement,
 * which has no addressee. */
function discourse(
  subjectReferentId: string | null,
  speakerRoleId: string,
  subjectRealization: "explicit" | "omitted",
  scenarioNoteCopyId: string,
  addresseeRoleId: string | null = "fixture-role-learner",
) {
  return {
    speakerRoleId,
    addresseeRoleId,
    subjectReferentId,
    subjectRealization,
    scenarioNoteCopyId,
  };
}

// ---------------------------------------------------------------------------
// Sentence variants — A1
// ---------------------------------------------------------------------------

const a1ModelVariants: readonly SentenceVariant[] = [
  {
    id: "fixture-a1-yuki-student-meeting",
    sentenceFamilyId: "fixture-a1-topic-copular",
    discourse: discourse("fixture-referent-yuki", "fixture-role-yuki", "explicit", "fixture-a1-yuki-student-meeting-scenario"),
    contextId: "fixture-a1-context-first-meeting",
    slotValues: { subject: "fixture-value-yuki", predicate: "fixture-a1-value-be", object: "fixture-a1-value-object-student" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a1-ken-doctor-meeting",
    sentenceFamilyId: "fixture-a1-topic-copular",
    discourse: discourse("fixture-a1-referent-ken", "fixture-a1-role-ken", "explicit", "fixture-a1-ken-doctor-meeting-scenario"),
    contextId: "fixture-a1-context-first-meeting",
    slotValues: { subject: "fixture-a1-value-ken", predicate: "fixture-a1-value-be", object: "fixture-a1-value-object-doctor" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a1-teacher-omitted-class",
    sentenceFamilyId: "fixture-a1-topic-copular",
    discourse: discourse("fixture-a1-referent-teacher", "fixture-a1-role-teacher", "omitted", "fixture-a1-teacher-omitted-class-scenario"),
    contextId: "fixture-a1-context-language-class",
    slotValues: { subject: "fixture-a1-value-teacher-referent", predicate: "fixture-a1-value-be", object: "fixture-a1-value-object-teacher-role" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a1-yuki-live-rome",
    sentenceFamilyId: "fixture-a1-residence-action",
    discourse: discourse("fixture-referent-yuki", "fixture-role-yuki", "explicit", "fixture-a1-yuki-live-rome-scenario"),
    contextId: "fixture-a1-context-first-meeting",
    slotValues: { subject: "fixture-value-yuki", predicate: "fixture-a1-value-live", location: "fixture-a1-value-location-rome" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a1-classmate-live-milan",
    sentenceFamilyId: "fixture-a1-residence-action",
    discourse: discourse("fixture-a1-referent-classmate", "fixture-a1-role-classmate", "explicit", "fixture-a1-classmate-live-milan-scenario"),
    contextId: "fixture-a1-context-language-class",
    slotValues: { subject: "fixture-a1-value-classmate-referent", predicate: "fixture-a1-value-live", location: "fixture-a1-value-location-milan" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a1-yuki-study-japanese",
    sentenceFamilyId: "fixture-a1-object-action",
    discourse: discourse("fixture-referent-yuki", "fixture-role-yuki", "explicit", "fixture-a1-yuki-study-japanese-scenario"),
    contextId: "fixture-a1-context-language-class",
    slotValues: { subject: "fixture-value-yuki", predicate: "fixture-a1-value-study", object: "fixture-a1-value-object-japanese" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a1-classmate-study-english",
    sentenceFamilyId: "fixture-a1-object-action",
    discourse: discourse("fixture-a1-referent-classmate", "fixture-a1-role-classmate", "explicit", "fixture-a1-classmate-study-english-scenario"),
    contextId: "fixture-a1-context-language-class",
    slotValues: { subject: "fixture-a1-value-classmate-referent", predicate: "fixture-a1-value-study", object: "fixture-a1-value-object-english" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a1-omitted-work-company",
    sentenceFamilyId: "fixture-a1-residence-action",
    discourse: discourse("fixture-a1-referent-clerk", "fixture-a1-role-clerk", "omitted", "fixture-a1-omitted-work-company-scenario"),
    contextId: "fixture-a1-context-workplace",
    slotValues: { subject: "fixture-a1-value-clerk-referent", predicate: "fixture-a1-value-work", location: "fixture-a1-value-location-company" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
];

const a1TransferVariants: readonly SentenceVariant[] = [
  {
    id: "fixture-a1-transfer-ken-study-japanese",
    sentenceFamilyId: "fixture-a1-object-action",
    discourse: discourse("fixture-a1-referent-ken", "fixture-a1-role-ken", "explicit", "fixture-a1-transfer-ken-study-japanese-scenario"),
    contextId: "fixture-a1-context-language-class",
    slotValues: { subject: "fixture-a1-value-ken", predicate: "fixture-a1-value-study", object: "fixture-a1-value-object-japanese" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
  {
    id: "fixture-a1-transfer-yuki-work-company",
    sentenceFamilyId: "fixture-a1-residence-action",
    discourse: discourse("fixture-referent-yuki", "fixture-role-yuki", "explicit", "fixture-a1-transfer-yuki-work-company-scenario"),
    contextId: "fixture-a1-context-workplace",
    slotValues: { subject: "fixture-value-yuki", predicate: "fixture-a1-value-work", location: "fixture-a1-value-location-company" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
  {
    id: "fixture-a1-transfer-classmate-live-rome",
    sentenceFamilyId: "fixture-a1-residence-action",
    discourse: discourse("fixture-a1-referent-classmate", "fixture-a1-role-classmate", "explicit", "fixture-a1-transfer-classmate-live-rome-scenario"),
    contextId: "fixture-a1-context-first-meeting",
    slotValues: { subject: "fixture-a1-value-classmate-referent", predicate: "fixture-a1-value-live", location: "fixture-a1-value-location-rome" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
  {
    id: "fixture-a1-transfer-omitted-study-english",
    sentenceFamilyId: "fixture-a1-object-action",
    discourse: discourse("fixture-a1-referent-clerk", "fixture-a1-role-clerk", "omitted", "fixture-a1-transfer-omitted-study-english-scenario"),
    contextId: "fixture-a1-context-language-class",
    slotValues: { subject: "fixture-a1-value-clerk-referent", predicate: "fixture-a1-value-study", object: "fixture-a1-value-object-english" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
  {
    id: "fixture-a1-transfer-teacher-do-work",
    sentenceFamilyId: "fixture-a1-residence-action",
    discourse: discourse("fixture-a1-referent-teacher", "fixture-a1-role-teacher", "explicit", "fixture-a1-transfer-teacher-do-work-scenario"),
    contextId: "fixture-a1-context-workplace",
    slotValues: { subject: "fixture-a1-value-teacher-referent", predicate: "fixture-a1-value-work", location: "fixture-a1-value-location-company" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
];

const a1RecurrenceVariants: readonly SentenceVariant[] = [
  {
    id: "fixture-a1-recur1-study",
    sentenceFamilyId: "fixture-a1-object-action",
    discourse: discourse("fixture-a1-referent-clerk", "fixture-a1-role-clerk", "explicit", "fixture-a1-recur1-study-scenario"),
    contextId: "fixture-a1-context-workplace",
    slotValues: { subject: "fixture-a1-value-clerk-referent", predicate: "fixture-a1-value-study", object: "fixture-a1-value-object-japanese" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "controlled-practice",
  },
  {
    id: "fixture-a1-recur2-study",
    sentenceFamilyId: "fixture-a1-object-action",
    discourse: discourse("fixture-a1-referent-ken", "fixture-a1-role-ken", "explicit", "fixture-a1-recur2-study-scenario"),
    contextId: "fixture-a1-context-language-class",
    slotValues: { subject: "fixture-a1-value-ken", predicate: "fixture-a1-value-study", object: "fixture-a1-value-object-english" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "controlled-practice",
  },
  {
    id: "fixture-a1-recur1-work",
    sentenceFamilyId: "fixture-a1-residence-action",
    discourse: discourse("fixture-a1-referent-classmate", "fixture-a1-role-classmate", "explicit", "fixture-a1-recur1-work-scenario"),
    contextId: "fixture-a1-context-workplace",
    slotValues: { subject: "fixture-a1-value-classmate-referent", predicate: "fixture-a1-value-work", location: "fixture-a1-value-location-company" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "controlled-practice",
  },
  {
    id: "fixture-a1-recur2-work",
    sentenceFamilyId: "fixture-a1-residence-action",
    discourse: discourse("fixture-a1-referent-ken", "fixture-a1-role-ken", "explicit", "fixture-a1-recur2-work-scenario"),
    contextId: "fixture-a1-context-workplace",
    slotValues: { subject: "fixture-a1-value-ken", predicate: "fixture-a1-value-work", location: "fixture-a1-value-location-company" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "controlled-practice",
  },
];

// ---------------------------------------------------------------------------
// Sentence variants — A2
// ---------------------------------------------------------------------------

const a2ModelVariants: readonly SentenceVariant[] = [
  {
    id: "fixture-a2-yuki-wake-weekday",
    sentenceFamilyId: "fixture-a2-time-action",
    discourse: discourse("fixture-referent-yuki", "fixture-role-yuki", "explicit", "fixture-a2-yuki-wake-weekday-scenario"),
    contextId: "fixture-a2-context-weekday-routine",
    slotValues: { subject: "fixture-value-yuki", predicate: "fixture-a2-value-wake", time: "fixture-a2-value-time-every-morning" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a2-colleague-work-morning",
    sentenceFamilyId: "fixture-a2-time-action",
    discourse: discourse("fixture-a2-referent-colleague", "fixture-a2-role-colleague", "explicit", "fixture-a2-colleague-work-morning-scenario"),
    contextId: "fixture-a2-context-weekday-routine",
    slotValues: { subject: "fixture-a2-value-colleague-referent", predicate: "fixture-a2-value-work", time: "fixture-a2-value-time-morning" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a2-friend-meet-after-work",
    sentenceFamilyId: "fixture-a2-sequence-action",
    discourse: discourse("fixture-a2-referent-friend", "fixture-a2-role-friend", "explicit", "fixture-a2-friend-meet-after-work-scenario"),
    contextId: "fixture-a2-context-after-work",
    slotValues: { subject: "fixture-a2-value-friend-referent", predicate: "fixture-a2-value-meet", time: "fixture-a2-value-time-after-work" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a2-omitted-eat-after-work",
    sentenceFamilyId: "fixture-a2-sequence-action",
    discourse: discourse("fixture-a2-referent-learner-self", "fixture-role-learner", "omitted", "fixture-a2-omitted-eat-after-work-scenario", null),
    contextId: "fixture-a2-context-after-work",
    slotValues: { subject: "fixture-a2-value-learner-self-referent", predicate: "fixture-a2-value-eat", time: "fixture-a2-value-time-after-work" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a2-neighbor-go-weekend",
    sentenceFamilyId: "fixture-a2-time-action",
    discourse: discourse("fixture-a2-referent-neighbor", "fixture-a2-role-neighbor", "explicit", "fixture-a2-neighbor-go-weekend-scenario"),
    contextId: "fixture-a2-context-weekend-plan",
    slotValues: { subject: "fixture-a2-value-neighbor-referent", predicate: "fixture-a2-value-go", time: "fixture-a2-value-time-weekend" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a2-traveler-go-tomorrow",
    sentenceFamilyId: "fixture-a2-time-action",
    discourse: discourse("fixture-a2-referent-traveler", "fixture-a2-role-traveler", "explicit", "fixture-a2-traveler-go-tomorrow-scenario"),
    contextId: "fixture-a2-context-weekend-plan",
    slotValues: { subject: "fixture-a2-value-traveler-referent", predicate: "fixture-a2-value-go", time: "fixture-a2-value-time-tomorrow" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a2-friend-invite-lunch",
    sentenceFamilyId: "fixture-a2-invitation-action",
    discourse: discourse("fixture-a2-referent-friend", "fixture-a2-role-friend", "explicit", "fixture-a2-friend-invite-lunch-scenario"),
    contextId: "fixture-a2-context-weekday-routine",
    slotValues: { subject: "fixture-a2-value-friend-referent", predicate: "fixture-a2-value-invite", object: "fixture-a2-value-object-lunch" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
  {
    id: "fixture-a2-colleague-invite-weekend",
    sentenceFamilyId: "fixture-a2-invitation-action",
    discourse: discourse("fixture-a2-referent-colleague", "fixture-a2-role-colleague", "explicit", "fixture-a2-colleague-invite-weekend-scenario"),
    contextId: "fixture-a2-context-weekend-plan",
    slotValues: { subject: "fixture-a2-value-colleague-referent", predicate: "fixture-a2-value-invite", object: "fixture-a2-value-object-movie" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "model",
  },
];

const a2TransferVariants: readonly SentenceVariant[] = [
  {
    id: "fixture-a2-transfer-neighbor-meet-after-work",
    sentenceFamilyId: "fixture-a2-sequence-action",
    // Naturally omitted subject: the neighbor was already established as the
    // conversational subject, so the surface form drops the subject phrase.
    // The "subject" slot value is still populated with the neighbor referent
    // (required per fixture-a2-sequence-action's slot schema) — only
    // `discourse.subjectRealization` ("omitted") controls that the realizer
    // must not emit subject/topic tokens for it.
    discourse: discourse("fixture-a2-referent-neighbor", "fixture-a2-role-neighbor", "omitted", "fixture-a2-transfer-neighbor-meet-after-work-scenario"),
    contextId: "fixture-a2-context-after-work",
    slotValues: { subject: "fixture-a2-value-neighbor-referent", predicate: "fixture-a2-value-meet", time: "fixture-a2-value-time-after-work" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
  {
    id: "fixture-a2-transfer-colleague-go-tomorrow",
    sentenceFamilyId: "fixture-a2-time-action",
    // Naturally omitted subject (see fixture-a2-transfer-neighbor-meet-after-work
    // above): the "subject" slot value stays populated with the colleague
    // referent — only its surface realization is dropped, per
    // `discourse.subjectRealization`.
    discourse: discourse("fixture-a2-referent-colleague", "fixture-a2-role-colleague", "omitted", "fixture-a2-transfer-colleague-go-tomorrow-scenario"),
    contextId: "fixture-a2-context-weekend-plan",
    slotValues: { subject: "fixture-a2-value-colleague-referent", predicate: "fixture-a2-value-go", time: "fixture-a2-value-time-tomorrow" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
  {
    id: "fixture-a2-transfer-friend-eat-weekend",
    sentenceFamilyId: "fixture-a2-sequence-action",
    discourse: discourse("fixture-a2-referent-friend", "fixture-a2-role-friend", "explicit", "fixture-a2-transfer-friend-eat-weekend-scenario"),
    contextId: "fixture-a2-context-weekend-plan",
    slotValues: { subject: "fixture-a2-value-friend-referent", predicate: "fixture-a2-value-eat", time: "fixture-a2-value-time-weekend" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
  {
    id: "fixture-a2-transfer-omitted-invite-lunch",
    sentenceFamilyId: "fixture-a2-invitation-action",
    discourse: discourse("fixture-a2-referent-learner-self", "fixture-role-learner", "omitted", "fixture-a2-transfer-omitted-invite-lunch-scenario", null),
    contextId: "fixture-a2-context-weekday-routine",
    slotValues: { subject: "fixture-a2-value-learner-self-referent", predicate: "fixture-a2-value-invite", object: "fixture-a2-value-object-lunch" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
  {
    id: "fixture-a2-transfer-traveler-work-morning",
    sentenceFamilyId: "fixture-a2-time-action",
    discourse: discourse("fixture-a2-referent-traveler", "fixture-a2-role-traveler", "explicit", "fixture-a2-transfer-traveler-work-morning-scenario"),
    contextId: "fixture-a2-context-weekday-routine",
    slotValues: { subject: "fixture-a2-value-traveler-referent", predicate: "fixture-a2-value-work", time: "fixture-a2-value-time-morning" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "transfer",
  },
];

const a2RecurrenceVariants: readonly SentenceVariant[] = [
  {
    id: "fixture-a2-recur1-meet",
    sentenceFamilyId: "fixture-a2-sequence-action",
    discourse: discourse("fixture-a2-referent-colleague", "fixture-a2-role-colleague", "explicit", "fixture-a2-recur1-meet-scenario"),
    contextId: "fixture-a2-context-weekend-plan",
    slotValues: { subject: "fixture-a2-value-colleague-referent", predicate: "fixture-a2-value-meet", time: "fixture-a2-value-time-weekend" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "controlled-practice",
  },
  {
    id: "fixture-a2-recur2-meet",
    sentenceFamilyId: "fixture-a2-sequence-action",
    discourse: discourse("fixture-a2-referent-traveler", "fixture-a2-role-traveler", "explicit", "fixture-a2-recur2-meet-scenario"),
    contextId: "fixture-a2-context-weekend-plan",
    slotValues: { subject: "fixture-a2-value-traveler-referent", predicate: "fixture-a2-value-meet", time: "fixture-a2-value-time-tomorrow" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "controlled-practice",
  },
  {
    id: "fixture-a2-recur1-go",
    sentenceFamilyId: "fixture-a2-time-action",
    discourse: discourse("fixture-a2-referent-friend", "fixture-a2-role-friend", "explicit", "fixture-a2-recur1-go-scenario"),
    contextId: "fixture-a2-context-weekend-plan",
    slotValues: { subject: "fixture-a2-value-friend-referent", predicate: "fixture-a2-value-go", time: "fixture-a2-value-time-weekend" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "controlled-practice",
  },
  {
    id: "fixture-a2-recur2-go",
    sentenceFamilyId: "fixture-a2-time-action",
    discourse: discourse("fixture-a2-referent-colleague", "fixture-a2-role-colleague", "explicit", "fixture-a2-recur2-go-scenario"),
    contextId: "fixture-a2-context-weekend-plan",
    slotValues: { subject: "fixture-a2-value-colleague-referent", predicate: "fixture-a2-value-go", time: "fixture-a2-value-time-tomorrow" },
    form: AFFIRMATIVE_PRESENT_POLITE,
    pedagogicalUse: "controlled-practice",
  },
];

const sentenceVariants: readonly SentenceVariant[] = freeze([
  ...a1ModelVariants,
  ...a1TransferVariants,
  ...a1RecurrenceVariants,
  ...a2ModelVariants,
  ...a2TransferVariants,
  ...a2RecurrenceVariants,
]);

// ---------------------------------------------------------------------------
// Modules and lesson positions
// ---------------------------------------------------------------------------

const modules: readonly FoundationModule[] = freeze([
  {
    id: "fixture-a1-module",
    level: "a1",
    order: 1,
    canDoIds: ["fixture-a1-can-do-personal-details"],
    lessonIds: ["fixture-a1-personal-details", "fixture-a1-lesson-recur-1"],
  },
  {
    id: "fixture-a1-module-2",
    level: "a1",
    order: 2,
    canDoIds: [],
    lessonIds: ["fixture-a1-lesson-recur-2"],
  },
  {
    id: "fixture-a2-module",
    level: "a2",
    order: 1,
    canDoIds: ["fixture-a2-can-do-routine-plans"],
    lessonIds: ["fixture-a2-routine-plans", "fixture-a2-lesson-recur-1"],
  },
  {
    id: "fixture-a2-module-2",
    level: "a2",
    order: 2,
    canDoIds: [],
    lessonIds: ["fixture-a2-lesson-recur-2"],
  },
]);

const lessonPositions: readonly LessonPositionRecord[] = freeze([
  { lessonId: "fixture-a1-personal-details", level: "a1", moduleId: "fixture-a1-module", position: 5 },
  { lessonId: "fixture-a1-lesson-recur-1", level: "a1", moduleId: "fixture-a1-module", position: 6 },
  { lessonId: "fixture-a1-lesson-recur-2", level: "a1", moduleId: "fixture-a1-module-2", position: 9 },
  { lessonId: "fixture-a2-routine-plans", level: "a2", moduleId: "fixture-a2-module", position: 3 },
  { lessonId: "fixture-a2-lesson-recur-1", level: "a2", moduleId: "fixture-a2-module", position: 4 },
  { lessonId: "fixture-a2-lesson-recur-2", level: "a2", moduleId: "fixture-a2-module-2", position: 7 },
]);

// ---------------------------------------------------------------------------
// Can-dos, checkpoints, levels
// ---------------------------------------------------------------------------

const canDos: readonly CanDo[] = freeze([
  {
    id: "fixture-a1-can-do-personal-details",
    level: "a1",
    domain: "interaction",
    descriptorCopyId: "fixture-a1-candos-personal-details-descriptor",
    contextIds: [
      "fixture-a1-context-first-meeting",
      "fixture-a1-context-language-class",
      "fixture-a1-context-workplace",
    ],
    lessonIds: ["fixture-a1-personal-details"],
    checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 2 },
    sourceNote: "product-authored-jf-cefr-aligned",
  },
  {
    id: "fixture-a2-can-do-routine-plans",
    level: "a2",
    domain: "interaction",
    descriptorCopyId: "fixture-a2-candos-routine-plans-descriptor",
    contextIds: [
      "fixture-a2-context-weekday-routine",
      "fixture-a2-context-after-work",
      "fixture-a2-context-weekend-plan",
    ],
    lessonIds: ["fixture-a2-routine-plans"],
    checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 2 },
    sourceNote: "product-authored-jf-cefr-aligned",
  },
]);

const checkpoints: readonly CheckpointDefinition[] = freeze([
  {
    id: "fixture-a1-checkpoint",
    level: "a1",
    sampledCanDoIds: ["fixture-a1-can-do-personal-details"],
    minAcceptedTransferTargetsPerCanDo: 2,
  },
  {
    id: "fixture-a2-checkpoint",
    level: "a2",
    sampledCanDoIds: ["fixture-a2-can-do-routine-plans"],
    minAcceptedTransferTargetsPerCanDo: 2,
  },
]);

const levels: readonly CourseLevel[] = freeze([
  {
    id: "a1",
    alignmentCopyId: "fixture-a1-level-alignment",
    moduleIds: ["fixture-a1-module", "fixture-a1-module-2"],
    canDoIds: ["fixture-a1-can-do-personal-details"],
  },
  {
    id: "a2",
    alignmentCopyId: "fixture-a2-level-alignment",
    moduleIds: ["fixture-a2-module", "fixture-a2-module-2"],
    canDoIds: ["fixture-a2-can-do-routine-plans"],
    recommendedPrerequisiteCheckpointId: "fixture-a1-checkpoint",
  },
]);

// ---------------------------------------------------------------------------
// Transfer variant ID map (round two candidates)
// ---------------------------------------------------------------------------

export const transferVariantIds: Readonly<Record<string, readonly string[]>> = freeze({
  "fixture-a1-personal-details": freeze(a1TransferVariants.map((v) => v.id)),
  "fixture-a2-routine-plans": freeze(a2TransferVariants.map((v) => v.id)),
});

// ---------------------------------------------------------------------------
// Lesson definitions
// ---------------------------------------------------------------------------

const DIVERSITY_CONSTRAINTS = freeze({
  modelCountRange: [8, 12] as const,
  exerciseCountRange: [8, 12] as const,
  minFamilies: 3,
  minPredicates: 3,
  minRoles: 3,
  minContexts: 2,
  minUniqueTargets: 5,
  maxTargetReuse: 2,
  minTransferExercises: 2,
  requireControlledConstruction: true,
});

const foundationLessonsList: readonly FoundationLessonDefinition[] = freeze([
  {
    id: "fixture-a1-personal-details",
    level: "a1",
    moduleId: "fixture-a1-module",
    primaryCanDoId: "fixture-a1-can-do-personal-details",
    supportingCanDoIds: [],
    modelVariantIds: a1ModelVariants.map((v) => v.id),
    familyIds: ["fixture-a1-topic-copular", "fixture-a1-residence-action", "fixture-a1-object-action"],
    practice: {
      lessonId: "fixture-a1-personal-details",
      roundOne: {
        id: "fixture-a1-personal-details-round-1",
        purpose: "guided-controlled",
        candidateVariantIds: a1ModelVariants.map((v) => v.id),
        selectionPolicyId: "balanced-v1",
        exerciseKinds: ["tile-ordering", "choice", "completion"],
        targetCount: 5,
      },
      roundTwo: {
        id: "fixture-a1-personal-details-round-2",
        purpose: "transfer",
        candidateVariantIds: a1TransferVariants.map((v) => v.id),
        selectionPolicyId: "balanced-v1",
        exerciseKinds: ["constrained-construction", "transformation", "completion"],
        targetCount: 5,
      },
    },
    diversityConstraints: DIVERSITY_CONSTRAINTS,
  },
  {
    id: "fixture-a2-routine-plans",
    level: "a2",
    moduleId: "fixture-a2-module",
    primaryCanDoId: "fixture-a2-can-do-routine-plans",
    supportingCanDoIds: [],
    modelVariantIds: a2ModelVariants.map((v) => v.id),
    familyIds: ["fixture-a2-time-action", "fixture-a2-sequence-action", "fixture-a2-invitation-action"],
    practice: {
      lessonId: "fixture-a2-routine-plans",
      roundOne: {
        id: "fixture-a2-routine-plans-round-1",
        purpose: "guided-controlled",
        candidateVariantIds: a2ModelVariants.map((v) => v.id),
        selectionPolicyId: "balanced-v1",
        exerciseKinds: ["tile-ordering", "choice", "completion"],
        targetCount: 5,
      },
      roundTwo: {
        id: "fixture-a2-routine-plans-round-2",
        purpose: "transfer",
        candidateVariantIds: a2TransferVariants.map((v) => v.id),
        selectionPolicyId: "balanced-v1",
        exerciseKinds: ["constrained-construction", "transformation", "completion"],
        targetCount: 5,
      },
    },
    diversityConstraints: DIVERSITY_CONSTRAINTS,
  },
]);

export const foundationLessons: readonly FoundationLessonDefinition[] = foundationLessonsList;

export const FOUNDATION_FIXTURE_LESSON_IDS: readonly string[] = freeze([
  "fixture-a1-personal-details",
  "fixture-a2-routine-plans",
]);

// ---------------------------------------------------------------------------
// Verb-use (productive recurrence) records
// ---------------------------------------------------------------------------

export const verbUseRecords: readonly VerbUseRecord[] = freeze([
  {
    id: "fixture-a1-verb-use-study",
    senseId: "fixture-a1-sense-study",
    learningUse: "productive",
    introductionLessonId: "fixture-a1-personal-details",
    // Two structurally distinct realizations: explicit subject vs the
    // naturally omitted subject (pro-drop), same family/tense/polarity.
    introductionVariantIds: ["fixture-a1-yuki-study-japanese", "fixture-a1-transfer-omitted-study-english"],
    introductionExercise: {
      lessonId: "fixture-a1-personal-details",
      roundId: "fixture-a1-personal-details-round-1",
      exerciseKind: "completion",
      targetVariantId: "fixture-a1-yuki-study-japanese",
    },
    laterUses: [
      { lessonId: "fixture-a1-lesson-recur-1", variantId: "fixture-a1-recur1-study" },
      { lessonId: "fixture-a1-lesson-recur-2", variantId: "fixture-a1-recur2-study" },
    ],
  },
  {
    id: "fixture-a1-verb-use-work",
    senseId: "fixture-a1-sense-work",
    learningUse: "productive",
    introductionLessonId: "fixture-a1-personal-details",
    introductionVariantIds: ["fixture-a1-omitted-work-company", "fixture-a1-transfer-yuki-work-company"],
    introductionExercise: {
      lessonId: "fixture-a1-personal-details",
      roundId: "fixture-a1-personal-details-round-2",
      exerciseKind: "completion",
      targetVariantId: "fixture-a1-transfer-yuki-work-company",
    },
    laterUses: [
      { lessonId: "fixture-a1-lesson-recur-1", variantId: "fixture-a1-recur1-work" },
      { lessonId: "fixture-a1-lesson-recur-2", variantId: "fixture-a1-recur2-work" },
    ],
  },
  {
    id: "fixture-a2-verb-use-meet",
    senseId: "fixture-a2-sense-meet",
    learningUse: "productive",
    introductionLessonId: "fixture-a2-routine-plans",
    // Two structurally distinct realizations: explicit subject vs the
    // naturally omitted subject (pro-drop) transfer target, same
    // family/tense/polarity.
    introductionVariantIds: ["fixture-a2-friend-meet-after-work", "fixture-a2-transfer-neighbor-meet-after-work"],
    introductionExercise: {
      lessonId: "fixture-a2-routine-plans",
      roundId: "fixture-a2-routine-plans-round-1",
      exerciseKind: "completion",
      targetVariantId: "fixture-a2-friend-meet-after-work",
    },
    laterUses: [
      { lessonId: "fixture-a2-lesson-recur-1", variantId: "fixture-a2-recur1-meet" },
      { lessonId: "fixture-a2-lesson-recur-2", variantId: "fixture-a2-recur2-meet" },
    ],
  },
  {
    id: "fixture-a2-verb-use-go",
    senseId: "fixture-a2-sense-go",
    learningUse: "productive",
    introductionLessonId: "fixture-a2-routine-plans",
    // Two structurally distinct realizations: explicit subject vs the
    // naturally omitted subject (pro-drop) transfer target, same
    // family/tense/polarity.
    introductionVariantIds: ["fixture-a2-neighbor-go-weekend", "fixture-a2-transfer-colleague-go-tomorrow"],
    introductionExercise: {
      lessonId: "fixture-a2-routine-plans",
      roundId: "fixture-a2-routine-plans-round-1",
      exerciseKind: "completion",
      targetVariantId: "fixture-a2-neighbor-go-weekend",
    },
    laterUses: [
      { lessonId: "fixture-a2-lesson-recur-1", variantId: "fixture-a2-recur1-go" },
      { lessonId: "fixture-a2-lesson-recur-2", variantId: "fixture-a2-recur2-go" },
    ],
  },
]);

// ---------------------------------------------------------------------------
// Foundation catalogs assembly
// ---------------------------------------------------------------------------

export const foundationCatalogs: FoundationCatalogs = freeze({
  levels,
  modules,
  checkpoints,
  canDos,
  contexts,
  personRoles,
  referents,
  learningTargetSenses,
  semanticValues,
  sentenceFamilies,
  sentenceVariants,
  lessons: foundationLessonsList,
  lessonPositions,
  verbUseRecords,
});

// ---------------------------------------------------------------------------
// Strict lookup maps and helpers
// ---------------------------------------------------------------------------

export const foundationFamilyById: Readonly<Record<string, SentenceFamily>> = freeze(
  Object.fromEntries(sentenceFamilies.map((family) => [family.id, family])),
);

export const foundationVariantById: Readonly<Record<string, SentenceVariant>> = freeze(
  Object.fromEntries(sentenceVariants.map((variant) => [variant.id, variant])),
);

export function fixtureFamily(id: string): SentenceFamily {
  const family = foundationFamilyById[id];
  if (!family) {
    throw new Error(`Unknown fixture sentence family id: ${id}`);
  }
  return family;
}

export function fixtureVariant(id: string): SentenceVariant {
  const variant = foundationVariantById[id];
  if (!variant) {
    throw new Error(`Unknown fixture sentence variant id: ${id}`);
  }
  return variant;
}

/**
 * Small immutable-override helper for later "invalid fixture" test cases:
 * returns a newly deep-frozen shallow copy of `base` with `overrides`
 * applied, never mutating `base` itself. The shallow copy means unshadowed
 * nested values keep their (already deep-frozen) shared references, while
 * anything from `overrides` — or the copy as a whole — is deep-frozen here.
 * Intentionally not a broad cloning framework.
 */
export function withFixtureOverride<T extends object>(base: T, overrides: Partial<T>): T {
  return freeze({ ...base, ...overrides });
}

// ---------------------------------------------------------------------------
// Bilingual fixture copy
// ---------------------------------------------------------------------------

/**
 * Stable convention mapping a semantic variant ID to the locale-owned copy ID
 * that holds its natural translation. Variants stay semantic IDs only (no
 * Japanese answer literals); the natural EN/IT rendering of a variant's meaning
 * lives in {@link foundationCopy} under this ID. Used by the foundation view
 * model (Phase 1 Task 5) to attach a translation label to each realized row.
 */
export function variantTranslationCopyId(variantId: string): string {
  return `${variantId}-translation`;
}

const copyEntries: readonly (readonly [string, string, string])[] = [
  // Can-do descriptors (exact aligned copy)
  [
    "fixture-a1-candos-personal-details-descriptor",
    "Exchange basic personal details in a short, supported conversation.",
    "Scambiare semplici informazioni personali in una breve conversazione guidata.",
  ],
  [
    "fixture-a2-candos-routine-plans-descriptor",
    "Describe a familiar routine and make a simple plan with another person.",
    "Descrivere una routine familiare e fare un semplice programma con un'altra persona.",
  ],

  // Level alignment copy
  [
    "fixture-a1-level-alignment",
    "A1 introduces personal details, everyday routines, and first-meeting conversation.",
    "L'A1 introduce i dati personali, la routine quotidiana e la conversazione al primo incontro.",
  ],
  [
    "fixture-a2-level-alignment",
    "A2 builds on A1 to describe familiar routines and make simple plans with others.",
    "L'A2 si basa sull'A1 per descrivere routine familiari e fare semplici programmi con altri.",
  ],

  // Context labels
  ["fixture-a1-context-first-meeting-label", "First meeting", "Primo incontro"],
  ["fixture-a1-context-language-class-label", "Language class", "Lezione di lingua"],
  ["fixture-a1-context-workplace-label", "Workplace", "Posto di lavoro"],
  ["fixture-a2-context-weekday-routine-label", "Weekday routine", "Routine feriale"],
  ["fixture-a2-context-after-work-label", "After work", "Dopo il lavoro"],
  ["fixture-a2-context-weekend-plan-label", "Weekend plan", "Programma del weekend"],

  // Person role labels
  ["fixture-role-learner-label", "You (the learner)", "Tu (chi impara)"],
  ["fixture-role-yuki-label", "Yuki", "Yuki"],
  ["fixture-a1-role-ken-label", "Ken", "Ken"],
  ["fixture-a1-role-teacher-label", "Teacher", "Insegnante"],
  ["fixture-a1-role-classmate-label", "Classmate", "Compagno di classe"],
  ["fixture-a1-role-clerk-label", "Company employee", "Impiegato d'azienda"],
  ["fixture-a2-role-colleague-label", "Colleague", "Collega"],
  ["fixture-a2-role-neighbor-label", "Neighbor", "Vicino di casa"],
  ["fixture-a2-role-friend-label", "Friend", "Amico"],
  ["fixture-a2-role-traveler-label", "Traveler", "Viaggiatore"],

  // Referent labels
  ["fixture-referent-yuki-label", "Yuki", "Yuki"],
  ["fixture-a1-referent-ken-label", "Ken", "Ken"],
  ["fixture-a1-referent-teacher-label", "the teacher", "l'insegnante"],
  ["fixture-a1-referent-classmate-label", "the classmate", "il compagno di classe"],
  ["fixture-a1-referent-clerk-label", "the company employee", "l'impiegato d'azienda"],
  ["fixture-a2-referent-colleague-label", "the colleague", "il collega"],
  ["fixture-a2-referent-neighbor-label", "the neighbor", "il vicino di casa"],
  ["fixture-a2-referent-friend-label", "the friend", "l'amico"],
  ["fixture-a2-referent-traveler-label", "the traveler", "il viaggiatore"],
  ["fixture-a2-referent-learner-self-label", "you (the learner)", "tu (chi impara)"],

  // Scenario notes — A1 models
  [
    "fixture-a1-yuki-student-meeting-scenario",
    "Yuki introduces herself as a student at a first meeting.",
    "Yuki si presenta come studentessa a un primo incontro.",
  ],
  [
    "fixture-a1-ken-doctor-meeting-scenario",
    "Ken introduces himself as a doctor at a first meeting.",
    "Ken si presenta come medico a un primo incontro.",
  ],
  [
    "fixture-a1-teacher-omitted-class-scenario",
    "The teacher states their role in class, naturally dropping the subject.",
    "L'insegnante dichiara il proprio ruolo in classe, omettendo naturalmente il soggetto.",
  ],
  [
    "fixture-a1-yuki-live-rome-scenario",
    "Yuki says she lives in Rome.",
    "Yuki dice che vive a Roma.",
  ],
  [
    "fixture-a1-classmate-live-milan-scenario",
    "A classmate says they live in Milan.",
    "Un compagno di classe dice che vive a Milano.",
  ],
  [
    "fixture-a1-yuki-study-japanese-scenario",
    "Yuki says she studies Japanese.",
    "Yuki dice che studia giapponese.",
  ],
  [
    "fixture-a1-classmate-study-english-scenario",
    "A classmate says they study English.",
    "Un compagno di classe dice che studia inglese.",
  ],
  [
    "fixture-a1-omitted-work-company-scenario",
    "A company employee mentions working there, naturally dropping the subject.",
    "Un impiegato d'azienda menziona di lavorarci, omettendo naturalmente il soggetto.",
  ],

  // Scenario notes — A1 transfers
  [
    "fixture-a1-transfer-ken-study-japanese-scenario",
    "Ken says he studies Japanese.",
    "Ken dice che studia giapponese.",
  ],
  [
    "fixture-a1-transfer-yuki-work-company-scenario",
    "Yuki says she works at the company.",
    "Yuki dice che lavora in azienda.",
  ],
  [
    "fixture-a1-transfer-classmate-live-rome-scenario",
    "A classmate says they live in Rome.",
    "Un compagno di classe dice che vive a Roma.",
  ],
  [
    "fixture-a1-transfer-omitted-study-english-scenario",
    "The company employee mentions studying English, naturally dropping the subject.",
    "L'impiegato d'azienda menziona di studiare inglese, omettendo naturalmente il soggetto.",
  ],
  [
    "fixture-a1-transfer-teacher-do-work-scenario",
    "The teacher says they also work at the company.",
    "L'insegnante dice che lavora anche in azienda.",
  ],

  // Scenario notes — A1 recurrence
  [
    "fixture-a1-recur1-study-scenario",
    "Later, the company employee also mentions studying Japanese.",
    "Più avanti, l'impiegato d'azienda menziona anche di studiare giapponese.",
  ],
  [
    "fixture-a1-recur2-study-scenario",
    "Later, Ken mentions studying English too.",
    "Più avanti, Ken menziona di studiare anche inglese.",
  ],
  [
    "fixture-a1-recur1-work-scenario",
    "Later, the classmate mentions working at the company.",
    "Più avanti, il compagno di classe menziona di lavorare in azienda.",
  ],
  [
    "fixture-a1-recur2-work-scenario",
    "Later, Ken mentions working at the company too.",
    "Più avanti, Ken menziona di lavorare anche in azienda.",
  ],

  // Scenario notes — A2 models
  [
    "fixture-a2-yuki-wake-weekday-scenario",
    "Yuki describes waking up every morning on weekdays.",
    "Yuki descrive il suo risveglio ogni mattina nei giorni feriali.",
  ],
  [
    "fixture-a2-colleague-work-morning-scenario",
    "A colleague describes working in the morning.",
    "Un collega descrive il suo lavoro al mattino.",
  ],
  [
    "fixture-a2-friend-meet-after-work-scenario",
    "A friend plans to meet up after work.",
    "Un amico programma di incontrarsi dopo il lavoro.",
  ],
  [
    "fixture-a2-omitted-eat-after-work-scenario",
    "You mention eating after work, naturally dropping the subject.",
    "Menzioni di mangiare dopo il lavoro, omettendo naturalmente il soggetto.",
  ],
  [
    "fixture-a2-neighbor-go-weekend-scenario",
    "A neighbor plans to go out on the weekend.",
    "Un vicino di casa programma di uscire nel weekend.",
  ],
  [
    "fixture-a2-traveler-go-tomorrow-scenario",
    "A traveler mentions going out tomorrow.",
    "Un viaggiatore menziona che uscirà domani.",
  ],
  [
    "fixture-a2-friend-invite-lunch-scenario",
    "A friend invites you to lunch.",
    "Un amico ti invita a pranzo.",
  ],
  [
    "fixture-a2-colleague-invite-weekend-scenario",
    "A colleague invites you to a movie on the weekend.",
    "Un collega ti invita al cinema nel weekend.",
  ],

  // Scenario notes — A2 transfers
  [
    "fixture-a2-transfer-neighbor-meet-after-work-scenario",
    "A neighbor plans to meet up after work.",
    "Un vicino di casa programma di incontrarsi dopo il lavoro.",
  ],
  [
    "fixture-a2-transfer-colleague-go-tomorrow-scenario",
    "A colleague mentions going out tomorrow.",
    "Un collega menziona che uscirà domani.",
  ],
  [
    "fixture-a2-transfer-friend-eat-weekend-scenario",
    "A friend mentions eating out on the weekend.",
    "Un amico menziona di mangiare fuori nel weekend.",
  ],
  [
    "fixture-a2-transfer-omitted-invite-lunch-scenario",
    "You mention inviting someone to lunch, naturally dropping the subject.",
    "Menzioni di invitare qualcuno a pranzo, omettendo naturalmente il soggetto.",
  ],
  [
    "fixture-a2-transfer-traveler-work-morning-scenario",
    "A traveler mentions working in the morning.",
    "Un viaggiatore menziona di lavorare al mattino.",
  ],

  // Scenario notes — A2 recurrence
  [
    "fixture-a2-recur1-meet-scenario",
    "Later, a colleague also plans to meet up on the weekend.",
    "Più avanti, anche un collega programma di incontrarsi nel weekend.",
  ],
  [
    "fixture-a2-recur2-meet-scenario",
    "Later, a traveler mentions meeting up tomorrow.",
    "Più avanti, un viaggiatore menziona di incontrarsi domani.",
  ],
  [
    "fixture-a2-recur1-go-scenario",
    "Later, a friend also plans to go out on the weekend.",
    "Più avanti, anche un amico programma di uscire nel weekend.",
  ],
  [
    "fixture-a2-recur2-go-scenario",
    "Later, a colleague mentions going out tomorrow too.",
    "Più avanti, un collega menziona che uscirà anche domani.",
  ],

  // ------------------------------------------------------------------
  // Variant translation copy (locale-owned natural meaning). Keyed by
  // variantTranslationCopyId(variantId). These are natural EN/IT
  // renderings of each variant's meaning — never Japanese literals and
  // never canonical answers. Omitted-subject variants read naturally in
  // each language (English keeps an explicit pronoun; Italian pro-drops).
  // ------------------------------------------------------------------

  // A1 models
  [
    "fixture-a1-yuki-student-meeting-translation",
    "Yuki is a student.",
    "Yuki è una studentessa.",
  ],
  [
    "fixture-a1-ken-doctor-meeting-translation",
    "Ken is a doctor.",
    "Ken è un medico.",
  ],
  [
    "fixture-a1-teacher-omitted-class-translation",
    "I'm the teacher.",
    "Sono l'insegnante.",
  ],
  [
    "fixture-a1-yuki-live-rome-translation",
    "Yuki lives in Rome.",
    "Yuki vive a Roma.",
  ],
  [
    "fixture-a1-classmate-live-milan-translation",
    "My classmate lives in Milan.",
    "Il mio compagno di classe vive a Milano.",
  ],
  [
    "fixture-a1-yuki-study-japanese-translation",
    "Yuki studies Japanese.",
    "Yuki studia giapponese.",
  ],
  [
    "fixture-a1-classmate-study-english-translation",
    "My classmate studies English.",
    "Il mio compagno di classe studia inglese.",
  ],
  [
    "fixture-a1-omitted-work-company-translation",
    "I work at a company.",
    "Lavoro in un'azienda.",
  ],

  // A1 transfers
  [
    "fixture-a1-transfer-ken-study-japanese-translation",
    "Ken studies Japanese.",
    "Ken studia giapponese.",
  ],
  [
    "fixture-a1-transfer-yuki-work-company-translation",
    "Yuki works at a company.",
    "Yuki lavora in un'azienda.",
  ],
  [
    "fixture-a1-transfer-classmate-live-rome-translation",
    "My classmate lives in Rome.",
    "Il mio compagno di classe vive a Roma.",
  ],
  [
    "fixture-a1-transfer-omitted-study-english-translation",
    "I study English.",
    "Studio inglese.",
  ],
  [
    "fixture-a1-transfer-teacher-do-work-translation",
    "The teacher works at a company.",
    "L'insegnante lavora in un'azienda.",
  ],

  // A2 models
  [
    "fixture-a2-yuki-wake-weekday-translation",
    "Yuki wakes up every morning.",
    "Yuki si sveglia ogni mattina.",
  ],
  [
    "fixture-a2-colleague-work-morning-translation",
    "My colleague works in the morning.",
    "Il mio collega lavora la mattina.",
  ],
  [
    "fixture-a2-friend-meet-after-work-translation",
    "My friend meets up after work.",
    "Il mio amico si vede con qualcuno dopo il lavoro.",
  ],
  [
    "fixture-a2-omitted-eat-after-work-translation",
    "I eat after work.",
    "Mangio dopo il lavoro.",
  ],
  [
    "fixture-a2-neighbor-go-weekend-translation",
    "My neighbor goes out on the weekend.",
    "Il mio vicino esce nel weekend.",
  ],
  [
    "fixture-a2-traveler-go-tomorrow-translation",
    "The traveler is going tomorrow.",
    "Il viaggiatore parte domani.",
  ],
  [
    "fixture-a2-friend-invite-lunch-translation",
    "My friend invites me to lunch.",
    "Il mio amico mi invita a pranzo.",
  ],
  [
    "fixture-a2-colleague-invite-weekend-translation",
    "My colleague invites me to a movie.",
    "Il mio collega mi invita al cinema.",
  ],

  // A2 transfers
  [
    "fixture-a2-transfer-neighbor-meet-after-work-translation",
    "My neighbor meets up after work.",
    "Il mio vicino si vede con qualcuno dopo il lavoro.",
  ],
  [
    "fixture-a2-transfer-colleague-go-tomorrow-translation",
    "My colleague is going tomorrow.",
    "Il mio collega parte domani.",
  ],
  [
    "fixture-a2-transfer-friend-eat-weekend-translation",
    "My friend eats out on the weekend.",
    "Il mio amico mangia fuori nel weekend.",
  ],
  [
    "fixture-a2-transfer-omitted-invite-lunch-translation",
    "I invite someone to lunch.",
    "Invito qualcuno a pranzo.",
  ],
  [
    "fixture-a2-transfer-traveler-work-morning-translation",
    "The traveler works in the morning.",
    "Il viaggiatore lavora la mattina.",
  ],
];

export const foundationCopy = freeze({
  en: freeze(Object.fromEntries(copyEntries.map(([key, en]) => [key, en]))),
  it: freeze(Object.fromEntries(copyEntries.map(([key, , it]) => [key, it]))),
});
