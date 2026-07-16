import { boundaryBefore, formatRomaji } from "../../romaji/formatRomaji";
import type {
  AssembledToken,
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

/** How a rule assigns (or withholds) a case particle for one content slot. */
type SlotParticleStrategy =
  | { readonly kind: "none" }
  | { readonly kind: "fixed"; readonly particle: SemanticParticleId }
  | { readonly kind: "from-sense-metadata"; readonly role: SemanticArgumentRole };

interface ContentSlotRule {
  readonly slotId: SentenceSlotId;
  readonly particle: SlotParticleStrategy;
}

interface RealizationRuleDefinition {
  readonly id: string;
  /** "copula" families emit no predicate-stem token (the `predicate`
   * semantic value carries no lexical content of its own); "verb" families
   * emit the predicate-sense value's own token fragments before the ending. */
  readonly predicateKind: "copula" | "verb";
  /** Non-subject, non-predicate slots, in the order their tokens/particles
   * are emitted (after subject/topic, before the predicate stem/ending). */
  readonly contentSlots: readonly ContentSlotRule[];
}

const REALIZATION_RULES: Readonly<Record<string, RealizationRuleDefinition>> = {
  "fixture-a1-rule-topic-copular": {
    id: "fixture-a1-rule-topic-copular",
    predicateKind: "copula",
    contentSlots: [{ slotId: "object", particle: { kind: "none" } }],
  },
  "fixture-a1-rule-residence-action": {
    id: "fixture-a1-rule-residence-action",
    predicateKind: "verb",
    contentSlots: [
      { slotId: "location", particle: { kind: "from-sense-metadata", role: "location" } },
    ],
  },
  "fixture-a1-rule-object-action": {
    id: "fixture-a1-rule-object-action",
    predicateKind: "verb",
    contentSlots: [{ slotId: "object", particle: { kind: "fixed", particle: "o" } }],
  },
  "fixture-a2-rule-time-action": {
    id: "fixture-a2-rule-time-action",
    predicateKind: "verb",
    contentSlots: [{ slotId: "time", particle: { kind: "none" } }],
  },
  "fixture-a2-rule-sequence-action": {
    id: "fixture-a2-rule-sequence-action",
    predicateKind: "verb",
    contentSlots: [{ slotId: "time", particle: { kind: "none" } }],
  },
  "fixture-a2-rule-invitation-action": {
    id: "fixture-a2-rule-invitation-action",
    predicateKind: "verb",
    contentSlots: [{ slotId: "object", particle: { kind: "fixed", particle: "ni" } }],
  },
};

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

const COPULA_POLITE_ENDINGS: Readonly<Record<FormKey, EndingForm>> = {
  "present-affirmative": { jp: "です", romaji: "desu" },
  "present-negative": { jp: "ではありません", romaji: "dewa arimasen" },
  "past-affirmative": { jp: "でした", romaji: "deshita" },
  "past-negative": { jp: "ではありませんでした", romaji: "dewa arimasen deshita" },
};

const PARTICLE_TEXT: Readonly<Record<SemanticParticleId, EndingForm>> = {
  wa: { jp: "は", romaji: "wa" },
  o: { jp: "を", romaji: "o" },
  ni: { jp: "に", romaji: "ni" },
  de: { jp: "で", romaji: "de" },
  to: { jp: "と", romaji: "to" },
};

/** Governed argument roles: `agent`/`topic` are discourse-driven and never
 * appear here (see `argumentParticleByRole` in ./types). */
const GOVERNED_ARGUMENT_ROLES: readonly SemanticArgumentRole[] = [
  "theme",
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
 * handled separately by the caller before this is ever consulted. */
function valueKindForGovernedRole(
  role: SemanticArgumentRole,
): SentenceSlotDefinition["valueKind"] | undefined {
  switch (role) {
    case "theme":
      return "object";
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
): void {
  const index = builder.tokens.length;
  const token: AssembledToken = {
    id: `${variantId}::${idSuffix}`,
    jp,
    romaji,
    kind,
    boundaryBefore: boundaryBefore(kind, index),
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

function pushEnding(
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

  // 11. sense argument frame vs. family structure/case-frame requirements.
  const rule = REALIZATION_RULES[family.realizationRuleId];
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

  // 14. execute: resolve the grammatical form's ending table.
  if (variant.form.formality !== "polite") {
    return fail([{ code: "invalid-conjugation", referenceId: variant.form.formality }]);
  }
  const key = formKey(variant.form.tense, variant.form.polarity);
  if (!key) {
    return fail([{ code: "invalid-conjugation", referenceId: variant.form.tense }]);
  }
  const endingTable = rule.predicateKind === "copula" ? COPULA_POLITE_ENDINGS : VERB_POLITE_ENDINGS;
  const ending = endingTable[key];

  // 15. assemble tokens.
  const builder: TokenBuilder = { tokens: [] };
  if (variant.discourse.subjectRealization === "explicit") {
    const subjectValue = resolvedSlotValues.get("subject") as SemanticValue;
    pushSlotFragments(builder, variant.id, "subject", subjectValue);
    pushParticle(builder, variant.id, "wa");
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
    }
  }
  if (rule.predicateKind === "verb" && predicateValue) {
    pushSlotFragments(builder, variant.id, "predicate", predicateValue);
  }
  pushEnding(builder, variant.id, ending);

  const romajiResult = formatRomaji(builder.tokens);
  if (!romajiResult.ok) {
    return fail([{ code: "invalid-romaji-sequence" }]);
  }

  const canonicalJapanese = builder.tokens.map((token) => token.jp).join("");
  const sortedSlotEntries = Object.keys(variant.slotValues)
    .sort()
    .map((key2) => `${key2}=${variant.slotValues[key2]}`)
    .join(",");
  const semanticFingerprint = [
    `family=${family.id}`,
    `speaker=${variant.discourse.speakerRoleId}`,
    `addressee=${variant.discourse.addresseeRoleId ?? "none"}`,
    `subjectReferent=${variant.discourse.subjectReferentId ?? "none"}`,
    `subjectRealization=${variant.discourse.subjectRealization}`,
    `sense=${sense.id}`,
    `context=${variant.contextId}`,
    `form=${variant.form.polarity}:${variant.form.tense}:${variant.form.formality}`,
    `slots=${sortedSlotEntries}`,
  ].join("|");

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
    usedLexemeSenseIds: [sense.id],
  };

  return { ok: true, sentence };
}
