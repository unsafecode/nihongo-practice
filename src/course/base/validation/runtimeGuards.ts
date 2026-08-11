import type { AssembledToken, TokenSourceRef } from "../../../romaji/types";
import type {
  BaseActivityDefinition,
  BaseConcept,
  BaseDialogue,
  BaseDialogueTurn,
  BaseExample,
  BaseLexeme,
  BaseLessonContent,
  BaseParticleFrame,
  BaseReferenceSnapshotDefinition,
  BaseRetrievalSystem,
  BaseTranslationCopy,
  BaseVisibleTarget,
} from "../catalog/types";
import {
  baseActivityOperationFor,
  isBaseActivityKind,
  isBaseActivityMode,
  isBaseActivityOperation,
  isBaseInteractionKind,
} from "../catalog/activityContracts";

export type RuntimeDataRecord = Readonly<Record<string, unknown>>;

const TOKEN_KINDS = new Set(["lexical", "particle", "morpheme", "punctuation"]);
const TOKEN_BOUNDARIES = new Set(["attach", "space"]);
const TOKEN_SOURCE_DOMAINS = new Set([
  "catalog",
  "lab",
  "exercise",
  "speech",
  "test",
  "family",
]);
const PARTICLE_FRAME_ROLES = new Set([
  "theme",
  "goal",
  "topic",
  "focus-subject",
  "action-place",
  "means",
  "time",
  "source",
  "limit",
  "existence-location",
  "existential-subject",
  "possessor",
  "companion",
  "listing",
  "nominal-complement",
  "question",
  "interaction",
]);
const PARTICLE_FRAME_SENSES = new Set([
  "topic-wa",
  "focus-subject-ga",
  "object-o",
  "goal-ni",
  "direction-he",
  "action-place-de",
  "means-de",
  "existence-location-ni",
  "existential-subject-ga",
  "time-ni",
  "source-kara",
  "limit-made",
  "possessive-attributive-no",
  "additive-mo",
  "companion-to",
  "listing-to",
  "nominal-to",
  "question-ka",
  "interactional-ne",
  "interactional-yo",
]);
const PREDICATE_ASPECTS = new Set([
  "dynamic",
  "stative",
  "nominal",
  "adjectival",
]);
const INTERPRETATION_TAGS = new Set([
  "metalinguistic",
  "habitual",
  "future",
  "present-state",
  "ongoing-now",
  "resulting-state",
  "past",
  "negative",
]);

const TOKEN_KEYS = new Set([
  "id",
  "jp",
  "romaji",
  "kind",
  "boundaryBefore",
  "source",
  "reading",
]);
const TOKEN_REQUIRED_KEYS = [
  "id",
  "jp",
  "romaji",
  "kind",
  "boundaryBefore",
  "source",
] as const;
const TOKEN_SOURCE_KEYS = new Set(["domain", "referenceId"]);
const TOKEN_SOURCE_REQUIRED_KEYS = ["domain", "referenceId"] as const;
const PARTICLE_FRAME_KEYS = new Set([
  "predicateSenseId",
  "provided",
  "attachmentLexemeIdByRole",
]);
const PARTICLE_FRAME_REQUIRED_KEYS = [
  "predicateSenseId",
  "provided",
  "attachmentLexemeIdByRole",
] as const;
const BASE_VISIBLE_TARGET_REQUIRED_KEYS = [
  "tokens",
  "lexemeIds",
  "conceptIds",
  "formIds",
  "patternCellIds",
  "semanticRoleIds",
  "interpretationTags",
  "predicateSenseId",
  "predicateLexemeId",
] as const;
const BASE_VISIBLE_TARGET_OPTIONAL_KEYS = [
  "predicateAspect",
  "discourseFrameId",
  "particleFrame",
] as const;
const BASE_VISIBLE_TARGET_KEYS = new Set([
  ...BASE_VISIBLE_TARGET_REQUIRED_KEYS,
  ...BASE_VISIBLE_TARGET_OPTIONAL_KEYS,
]);
const BASE_EXAMPLE_KEYS = new Set([
  ...BASE_VISIBLE_TARGET_KEYS,
  "id",
  "teachingPurposeCopyId",
  "translationCopy",
  "utteranceKind",
  "contextCopyId",
  "roleModelId",
  "recoverableContextId",
]);
const BASE_DIALOGUE_TURN_KEYS = new Set([
  ...BASE_VISIBLE_TARGET_KEYS,
  "speakerId",
  "utteranceKind",
]);
const BASE_DIALOGUE_KEYS = new Set(["id", "practicalOutcomeCopyId", "turns"]);
const BASE_DIALOGUE_REQUIRED_KEYS = [
  "id",
  "practicalOutcomeCopyId",
  "turns",
] as const;
const TRANSLATION_COPY_ID_KEYS = new Set(["copyId"]);
const TRANSLATION_COPY_ID_REQUIRED_KEYS = ["copyId"] as const;
const TRANSLATION_LOCALIZED_KEYS = new Set(["enCopyId", "itCopyId"]);
const TRANSLATION_LOCALIZED_REQUIRED_KEYS = ["enCopyId", "itCopyId"] as const;

export type RuntimeVisibleTargetShape =
  | "target"
  | "example"
  | "dialogue-turn";

interface PlainDataRecordInspection {
  readonly record: RuntimeDataRecord;
  readonly names: readonly string[];
  readonly descriptors: Readonly<Record<string, PropertyDescriptor>>;
}

function inspectPlainDataRecord(value: unknown): PlainDataRecordInspection | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return undefined;
    if (Object.getOwnPropertySymbols(value).length > 0) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value) as Record<
      string,
      PropertyDescriptor
    >;
    const names = Object.getOwnPropertyNames(value);
    if (
      names.some((name) => {
        const descriptor = descriptors[name];
        return descriptor === undefined || !("value" in descriptor);
      })
    ) {
      return undefined;
    }
    return {
      record: value as RuntimeDataRecord,
      names,
      descriptors,
    };
  } catch {
    return undefined;
  }
}

function exactEnumerableDataRecord(
  value: unknown,
  allowedKeys: ReadonlySet<string>,
  requiredKeys: readonly string[],
): RuntimeDataRecord | undefined {
  const inspection = inspectPlainDataRecord(value);
  if (!inspection) return undefined;
  for (const key of requiredKeys) {
    if (inspection.descriptors[key] === undefined) return undefined;
  }
  for (const key of inspection.names) {
    const descriptor = inspection.descriptors[key];
    if (
      !allowedKeys.has(key) ||
      descriptor === undefined ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    ) {
      return undefined;
    }
  }
  return inspection.record;
}

export function isPlainDataRecord(value: unknown): value is RuntimeDataRecord {
  return inspectPlainDataRecord(value) !== undefined;
}

export function ownDataValue(
  record: RuntimeDataRecord,
  key: string,
): unknown {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    return descriptor && "value" in descriptor ? descriptor.value : undefined;
  } catch {
    return undefined;
  }
}

export function hasOwnDataValue(
  record: RuntimeDataRecord,
  key: string,
): boolean {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    return descriptor !== undefined && "value" in descriptor;
  } catch {
    return false;
  }
}

/**
 * Reads array entries exclusively from their own data descriptors, so a sparse
 * array or an accessor element can never be treated as an authored sequence.
 */
export function ownDataArrayValues(value: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  try {
    if (Object.getPrototypeOf(value) !== Array.prototype) return undefined;
    if (Object.getOwnPropertySymbols(value).length > 0) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value) as Record<
      string,
      PropertyDescriptor
    >;
    const names = Object.getOwnPropertyNames(value);
    const length = descriptors["length"];
    if (
      !length ||
      !("value" in length) ||
      typeof length.value !== "number" ||
      !Number.isSafeInteger(length.value) ||
      length.value < 0 ||
      length.enumerable
    ) {
      return undefined;
    }
    const indexKeys = names.filter((key) => key !== "length");
    if (indexKeys.length !== length.value) return undefined;
    for (const key of indexKeys) {
      const index = Number(key);
      const descriptor = descriptors[key];
      if (
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index >= length.value ||
        String(index) !== key ||
        descriptor === undefined ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      ) {
        return undefined;
      }
    }
    const values: unknown[] = [];
    for (let index = 0; index < length.value; index += 1) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        return undefined;
      }
      values.push(descriptor.value);
    }
    return Object.freeze(values);
  } catch {
    return undefined;
  }
}

export function runtimeStringArrayValues(
  value: unknown,
): readonly string[] | undefined {
  const entries = ownDataArrayValues(value);
  if (entries === undefined || entries.some((entry) => typeof entry !== "string")) {
    return undefined;
  }
  return entries as readonly string[];
}

export function isRuntimeStringArray(value: unknown): value is readonly string[] {
  return runtimeStringArrayValues(value) !== undefined;
}

function strictRuntimeTokenSource(value: unknown): TokenSourceRef | undefined {
  const source = exactEnumerableDataRecord(
    value,
    TOKEN_SOURCE_KEYS,
    TOKEN_SOURCE_REQUIRED_KEYS,
  );
  if (!source) return undefined;
  const domain = ownDataValue(source, "domain");
  const referenceId = ownDataValue(source, "referenceId");
  if (
    typeof domain !== "string" ||
    !TOKEN_SOURCE_DOMAINS.has(domain) ||
    typeof referenceId !== "string" ||
    referenceId.trim().length === 0
  ) {
    return undefined;
  }
  return Object.freeze({
    domain: domain as TokenSourceRef["domain"],
    referenceId,
  });
}

function strictRuntimeToken(value: unknown): AssembledToken | undefined {
  const token = exactEnumerableDataRecord(
    value,
    TOKEN_KEYS,
    TOKEN_REQUIRED_KEYS,
  );
  if (!token) return undefined;
  const id = ownDataValue(token, "id");
  const jp = ownDataValue(token, "jp");
  const romaji = ownDataValue(token, "romaji");
  const kind = ownDataValue(token, "kind");
  const boundaryBefore = ownDataValue(token, "boundaryBefore");
  const source = strictRuntimeTokenSource(ownDataValue(token, "source"));
  const reading = ownDataValue(token, "reading");
  if (
    typeof id !== "string" ||
    typeof jp !== "string" ||
    typeof romaji !== "string" ||
    typeof kind !== "string" ||
    !TOKEN_KINDS.has(kind) ||
    typeof boundaryBefore !== "string" ||
    !TOKEN_BOUNDARIES.has(boundaryBefore) ||
    !source ||
    (hasOwnDataValue(token, "reading") && typeof reading !== "string")
  ) {
    return undefined;
  }
  return Object.freeze({
    id,
    jp,
    romaji,
    kind: kind as AssembledToken["kind"],
    boundaryBefore: boundaryBefore as AssembledToken["boundaryBefore"],
    source,
    ...(typeof reading === "string" ? { reading } : {}),
  });
}

export function isStrictRuntimeToken(value: unknown): value is AssembledToken {
  return strictRuntimeToken(value) !== undefined;
}

export function isStrictRuntimeTokenSequence(
  tokens: readonly AssembledToken[] | unknown,
): tokens is readonly AssembledToken[] {
  return strictRuntimeTokenSequence(tokens) !== undefined;
}

export function strictRuntimeTokenSequence(
  tokens: readonly AssembledToken[] | unknown,
): readonly AssembledToken[] | undefined {
  const entries = ownDataArrayValues(tokens);
  if (entries === undefined) {
    return undefined;
  }
  const snapshots: AssembledToken[] = [];
  for (const entry of entries) {
    const snapshot = strictRuntimeToken(entry);
    if (!snapshot) return undefined;
    snapshots.push(snapshot);
  }
  return Object.freeze(snapshots);
}

export type RuntimeVisibleTargetIssue =
  | "invalid-visible-target"
  | "invalid-token-sequence"
  | "invalid-particle-frame";

function strictParticleProvided(
  value: unknown,
): BaseParticleFrame["provided"] | undefined {
  const provided = exactEnumerableDataRecord(
    value,
    PARTICLE_FRAME_ROLES,
    [],
  );
  if (!provided) return undefined;
  const snapshot = Object.create(null) as Record<string, string>;
  for (const role of Object.getOwnPropertyNames(provided)) {
    const particleSense = ownDataValue(provided, role);
    if (
      !PARTICLE_FRAME_ROLES.has(role) ||
      typeof particleSense !== "string" ||
      !PARTICLE_FRAME_SENSES.has(particleSense)
    ) {
      return undefined;
    }
    snapshot[role] = particleSense;
  }
  return Object.freeze(snapshot) as BaseParticleFrame["provided"];
}

function strictParticleAttachments(
  value: unknown,
): BaseParticleFrame["attachmentLexemeIdByRole"] | undefined {
  const attachments = exactEnumerableDataRecord(
    value,
    PARTICLE_FRAME_ROLES,
    [],
  );
  if (!attachments) return undefined;
  const snapshot = Object.create(null) as Record<string, string>;
  for (const role of Object.getOwnPropertyNames(attachments)) {
    const lexemeId = ownDataValue(attachments, role);
    if (
      !PARTICLE_FRAME_ROLES.has(role) ||
      typeof lexemeId !== "string" ||
      lexemeId.trim().length === 0
    ) {
      return undefined;
    }
    snapshot[role] = lexemeId;
  }
  return Object.freeze(
    snapshot,
  ) as BaseParticleFrame["attachmentLexemeIdByRole"];
}

function strictRuntimeParticleFrame(value: unknown): BaseParticleFrame | undefined {
  const frame = exactEnumerableDataRecord(
    value,
    PARTICLE_FRAME_KEYS,
    PARTICLE_FRAME_REQUIRED_KEYS,
  );
  if (!frame) return undefined;
  const predicateSenseId = ownDataValue(frame, "predicateSenseId");
  const provided = strictParticleProvided(ownDataValue(frame, "provided"));
  const attachmentLexemeIdByRole = strictParticleAttachments(
    ownDataValue(frame, "attachmentLexemeIdByRole"),
  );
  if (
    typeof predicateSenseId !== "string" ||
    !provided ||
    !attachmentLexemeIdByRole
  ) {
    return undefined;
  }
  return Object.freeze({
    predicateSenseId,
    provided,
    attachmentLexemeIdByRole,
  });
}

export function isSafeParticleFrame(value: unknown): boolean {
  return strictRuntimeParticleFrame(value) !== undefined;
}

function isStrictInterpretationTags(
  value: unknown,
  requireAtLeastOne: boolean,
): boolean {
  const entries = ownDataArrayValues(value);
  if (!entries) return false;
  if (requireAtLeastOne && entries.length === 0) return false;
  const tags = new Set<string>();
  for (const entry of entries) {
    if (
      typeof entry !== "string" ||
      entry.trim().length === 0 ||
      !INTERPRETATION_TAGS.has(entry) ||
      tags.has(entry)
    ) {
      return false;
    }
    tags.add(entry);
  }
  return true;
}

function visibleTargetKeysFor(
  shape: RuntimeVisibleTargetShape,
): ReadonlySet<string> {
  if (shape === "example") return BASE_EXAMPLE_KEYS;
  if (shape === "dialogue-turn") return BASE_DIALOGUE_TURN_KEYS;
  return BASE_VISIBLE_TARGET_KEYS;
}

/**
 * Validates the raw object before anything can clone it or read a property.
 * Role values must be closed own-data strings before publication; licensing
 * between a predicate and those values remains the particle validator's job.
 */
export function runtimeVisibleTargetIssue(
  value: unknown,
  shape: RuntimeVisibleTargetShape = "target",
): RuntimeVisibleTargetIssue | undefined {
  const target = exactEnumerableDataRecord(
    value,
    visibleTargetKeysFor(shape),
    BASE_VISIBLE_TARGET_REQUIRED_KEYS,
  );
  if (!target) return "invalid-visible-target";
  const tokens = ownDataValue(target, "tokens");
  if (!isStrictRuntimeTokenSequence(tokens)) return "invalid-token-sequence";
  const requiredStringArrays = [
    "lexemeIds",
    "conceptIds",
    "formIds",
    "patternCellIds",
    "semanticRoleIds",
  ] as const;
  if (
    !requiredStringArrays.every(
      (field) =>
        hasOwnDataValue(target, field) &&
        isRuntimeStringArray(ownDataValue(target, field)),
    )
  ) {
    return "invalid-visible-target";
  }
  const predicateSenseId = ownDataValue(target, "predicateSenseId");
  const predicateLexemeId = ownDataValue(target, "predicateLexemeId");
  if (
    !(
      (typeof predicateSenseId === "string" || predicateSenseId === null) &&
      (typeof predicateLexemeId === "string" || predicateLexemeId === null)
    )
  ) {
    return "invalid-visible-target";
  }
  const predicateAspect = ownDataValue(target, "predicateAspect");
  if (
    hasOwnDataValue(target, "predicateAspect") &&
    (typeof predicateAspect !== "string" || !PREDICATE_ASPECTS.has(predicateAspect))
  ) {
    return "invalid-visible-target";
  }
  if (
    !isStrictInterpretationTags(
      ownDataValue(target, "interpretationTags"),
      predicateAspect !== undefined,
    )
  ) {
    return "invalid-visible-target";
  }
  if (
    hasOwnDataValue(target, "discourseFrameId") &&
    typeof ownDataValue(target, "discourseFrameId") !== "string"
  ) {
    return "invalid-visible-target";
  }
  if (
    hasOwnDataValue(target, "particleFrame") &&
    !isSafeParticleFrame(ownDataValue(target, "particleFrame"))
  ) {
    return "invalid-particle-frame";
  }
  return undefined;
}

function strictRuntimeVisibleTargetForShape(
  value: unknown,
  shape: RuntimeVisibleTargetShape,
): BaseVisibleTarget | undefined {
  const target = exactEnumerableDataRecord(
    value,
    visibleTargetKeysFor(shape),
    BASE_VISIBLE_TARGET_REQUIRED_KEYS,
  );
  if (!target || runtimeVisibleTargetIssue(target, shape) !== undefined) {
    return undefined;
  }
  const tokens = strictRuntimeTokenSequence(ownDataValue(target, "tokens"));
  const lexemeIds = runtimeStringArrayValues(ownDataValue(target, "lexemeIds"));
  const conceptIds = runtimeStringArrayValues(ownDataValue(target, "conceptIds"));
  const formIds = runtimeStringArrayValues(ownDataValue(target, "formIds"));
  const patternCellIds = runtimeStringArrayValues(
    ownDataValue(target, "patternCellIds"),
  );
  const semanticRoleIds = runtimeStringArrayValues(
    ownDataValue(target, "semanticRoleIds"),
  );
  const interpretationTags = runtimeStringArrayValues(
    ownDataValue(target, "interpretationTags"),
  );
  if (
    !tokens ||
    !lexemeIds ||
    !conceptIds ||
    !formIds ||
    !patternCellIds ||
    !semanticRoleIds ||
    !interpretationTags
  ) {
    return undefined;
  }
  const predicateSenseId = ownDataValue(target, "predicateSenseId");
  const predicateLexemeId = ownDataValue(target, "predicateLexemeId");
  const predicateAspect = ownDataValue(target, "predicateAspect");
  const discourseFrameId = ownDataValue(target, "discourseFrameId");
  const particleFrame = hasOwnDataValue(target, "particleFrame")
    ? strictRuntimeParticleFrame(ownDataValue(target, "particleFrame"))
    : undefined;
  if (
    !(
      (typeof predicateSenseId === "string" || predicateSenseId === null) &&
      (typeof predicateLexemeId === "string" || predicateLexemeId === null)
    ) ||
    (hasOwnDataValue(target, "particleFrame") && !particleFrame)
  ) {
    return undefined;
  }
  return Object.freeze({
    tokens,
    lexemeIds,
    conceptIds,
    formIds,
    patternCellIds,
    semanticRoleIds,
    interpretationTags,
    predicateSenseId,
    predicateLexemeId,
    ...(typeof predicateAspect === "string" ? { predicateAspect } : {}),
    ...(typeof discourseFrameId === "string" ? { discourseFrameId } : {}),
    ...(particleFrame ? { particleFrame } : {}),
  } as BaseVisibleTarget);
}

export function strictRuntimeVisibleTarget(
  value: unknown,
): BaseVisibleTarget | undefined {
  return strictRuntimeVisibleTargetForShape(value, "target");
}

function strictRuntimeTranslationCopy(
  value: unknown,
): BaseTranslationCopy | undefined {
  const copy = exactEnumerableDataRecord(
    value,
    TRANSLATION_COPY_ID_KEYS,
    TRANSLATION_COPY_ID_REQUIRED_KEYS,
  );
  const copyId = copy ? ownDataValue(copy, "copyId") : undefined;
  if (typeof copyId === "string") {
    return Object.freeze({ copyId });
  }
  const localized = exactEnumerableDataRecord(
    value,
    TRANSLATION_LOCALIZED_KEYS,
    TRANSLATION_LOCALIZED_REQUIRED_KEYS,
  );
  const enCopyId = localized ? ownDataValue(localized, "enCopyId") : undefined;
  const itCopyId = localized ? ownDataValue(localized, "itCopyId") : undefined;
  if (typeof enCopyId !== "string" || typeof itCopyId !== "string") {
    return undefined;
  }
  return Object.freeze({ enCopyId, itCopyId });
}

export function isStrictRuntimeExample(value: unknown): boolean {
  return strictRuntimeExample(value) !== undefined;
}

export function strictRuntimeExample(value: unknown): BaseExample | undefined {
  const example = exactEnumerableDataRecord(
    value,
    BASE_EXAMPLE_KEYS,
    BASE_VISIBLE_TARGET_REQUIRED_KEYS,
  );
  if (!example) return undefined;
  const target = strictRuntimeVisibleTargetForShape(example, "example");
  const id = ownDataValue(example, "id");
  const teachingPurposeCopyId = ownDataValue(example, "teachingPurposeCopyId");
  const translationCopy = strictRuntimeTranslationCopy(
    ownDataValue(example, "translationCopy"),
  );
  const predicateAspect = ownDataValue(example, "predicateAspect");
  const discourseFrameId = ownDataValue(example, "discourseFrameId");
  const utteranceKind = ownDataValue(example, "utteranceKind");
  const contextCopyId = ownDataValue(example, "contextCopyId");
  const roleModelId = ownDataValue(example, "roleModelId");
  const recoverableContextId = ownDataValue(example, "recoverableContextId");
  if (
    !target ||
    typeof id !== "string" ||
    typeof teachingPurposeCopyId !== "string" ||
    !translationCopy ||
    typeof predicateAspect !== "string" ||
    typeof discourseFrameId !== "string" ||
    (utteranceKind !== undefined &&
      ![
        "contextual-fragment",
        "anatomy-model",
        "complete-clause",
        "hanging-topic",
      ].includes(utteranceKind as string)) ||
    (contextCopyId !== undefined &&
      contextCopyId !== null &&
      typeof contextCopyId !== "string") ||
    (roleModelId !== undefined &&
      roleModelId !== null &&
      typeof roleModelId !== "string") ||
    (recoverableContextId !== undefined &&
      recoverableContextId !== null &&
      typeof recoverableContextId !== "string")
  ) {
    return undefined;
  }
  return Object.freeze({
    ...target,
    id,
    teachingPurposeCopyId,
    translationCopy: translationCopy as BaseTranslationCopy,
    predicateAspect: predicateAspect as BaseExample["predicateAspect"],
    discourseFrameId,
    ...(typeof utteranceKind === "string"
      ? { utteranceKind: utteranceKind as BaseExample["utteranceKind"] }
      : {}),
    ...(contextCopyId === null || typeof contextCopyId === "string"
      ? { contextCopyId }
      : {}),
    ...(roleModelId === null || typeof roleModelId === "string"
      ? { roleModelId }
      : {}),
    ...(recoverableContextId === null || typeof recoverableContextId === "string"
      ? { recoverableContextId }
      : {}),
  });
}

export function isStrictRuntimeDialogueTurn(value: unknown): boolean {
  return strictRuntimeDialogueTurn(value) !== undefined;
}

export function strictRuntimeDialogueTurn(
  value: unknown,
): BaseDialogueTurn | undefined {
  const turn = exactEnumerableDataRecord(
    value,
    BASE_DIALOGUE_TURN_KEYS,
    BASE_VISIBLE_TARGET_REQUIRED_KEYS,
  );
  if (!turn) return undefined;
  const target = strictRuntimeVisibleTargetForShape(turn, "dialogue-turn");
  const speakerId = ownDataValue(turn, "speakerId");
  const predicateAspect = ownDataValue(turn, "predicateAspect");
  const discourseFrameId = ownDataValue(turn, "discourseFrameId");
  const utteranceKind = ownDataValue(turn, "utteranceKind");
  if (
    !target ||
    typeof speakerId !== "string" ||
    typeof predicateAspect !== "string" ||
    typeof discourseFrameId !== "string" ||
    (utteranceKind !== undefined &&
      !["contextual-fragment", "complete-clause", "hanging-topic"].includes(
        utteranceKind as string,
      ))
  ) {
    return undefined;
  }
  return Object.freeze({
    ...target,
    speakerId,
    predicateAspect: predicateAspect as BaseDialogueTurn["predicateAspect"],
    discourseFrameId,
    ...(typeof utteranceKind === "string"
      ? { utteranceKind: utteranceKind as BaseDialogueTurn["utteranceKind"] }
      : {}),
  });
}

export function isStrictRuntimeDialogue(value: unknown): boolean {
  return strictRuntimeDialogue(value) !== undefined;
}

export function strictRuntimeDialogue(value: unknown): BaseDialogue | undefined {
  const dialogue = exactEnumerableDataRecord(
    value,
    BASE_DIALOGUE_KEYS,
    BASE_DIALOGUE_REQUIRED_KEYS,
  );
  if (!dialogue) return undefined;
  const id = ownDataValue(dialogue, "id");
  const practicalOutcomeCopyId = ownDataValue(dialogue, "practicalOutcomeCopyId");
  if (typeof id !== "string" || typeof practicalOutcomeCopyId !== "string") {
    return undefined;
  }
  const turns = ownDataArrayValues(ownDataValue(dialogue, "turns"));
  if (turns === undefined) return undefined;
  const turnSnapshots: BaseDialogueTurn[] = [];
  for (const turn of turns) {
    const snapshot = strictRuntimeDialogueTurn(turn);
    if (!snapshot) return undefined;
    turnSnapshots.push(snapshot);
  }
  return Object.freeze({
    id,
    practicalOutcomeCopyId,
    turns: Object.freeze(turnSnapshots),
  });
}

export function isStrictRuntimeActivity(value: unknown): boolean {
  return strictRuntimeActivity(value) !== undefined;
}

export function strictRuntimeActivity(
  value: unknown,
): BaseActivityDefinition | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  const stringFields = [
    "id",
    "targetId",
    "instructionCopyId",
    "acceptedFeedbackCopyId",
    "retryFeedbackCopyId",
  ] as const;
  if (!stringFields.every((field) => typeof ownDataValue(value, field) === "string")) {
    return undefined;
  }
  const category = ownDataValue(value, "category");
  const interactionKind = ownDataValue(value, "interactionKind");
  const mode = ownDataValue(value, "mode");
  const operation = ownDataValue(value, "operation");
  const assessedConceptIds = runtimeStringArrayValues(
    ownDataValue(value, "assessedConceptIds"),
  );
  const assessedLexemeIds = runtimeStringArrayValues(
    ownDataValue(value, "assessedLexemeIds"),
  );
  const optionTargetIds = hasOwnDataValue(value, "optionTargetIds")
    ? runtimeStringArrayValues(ownDataValue(value, "optionTargetIds"))
    : undefined;
  if (
    !isBaseActivityKind(category) ||
    !isBaseInteractionKind(interactionKind) ||
    !isBaseActivityMode(mode) ||
    !isBaseActivityOperation(operation) ||
    !assessedConceptIds ||
    !assessedLexemeIds ||
    (hasOwnDataValue(value, "optionTargetIds") && !optionTargetIds)
  ) {
    return undefined;
  }
  return Object.freeze({
    id: ownDataValue(value, "id") as string,
    category,
    interactionKind,
    mode,
    targetId: ownDataValue(value, "targetId") as string,
    operation,
    instructionCopyId: ownDataValue(value, "instructionCopyId") as string,
    acceptedFeedbackCopyId: ownDataValue(value, "acceptedFeedbackCopyId") as string,
    retryFeedbackCopyId: ownDataValue(value, "retryFeedbackCopyId") as string,
    assessedConceptIds,
    assessedLexemeIds,
    ...(optionTargetIds ? { optionTargetIds } : {}),
  });
}

export type RuntimeActivityShapeIssue =
  | "invalid-activity-shape"
  | "activity-category-operation-mismatch";

export function runtimeActivityShapeIssues(
  value: unknown,
): readonly RuntimeActivityShapeIssue[] {
  if (!isPlainDataRecord(value)) {
    return ["invalid-activity-shape", "activity-category-operation-mismatch"];
  }
  const category = ownDataValue(value, "category");
  const interactionKind = ownDataValue(value, "interactionKind");
  const mode = ownDataValue(value, "mode");
  const operation = ownDataValue(value, "operation");
  if (
    !isBaseActivityKind(category) ||
    !isBaseInteractionKind(interactionKind) ||
    !isBaseActivityMode(mode) ||
    !isBaseActivityOperation(operation)
  ) {
    return ["invalid-activity-shape", "activity-category-operation-mismatch"];
  }
  const expectedOperation = baseActivityOperationFor(category);
  return expectedOperation === operation
    ? []
    : ["activity-category-operation-mismatch"];
}

export function isStrictRuntimeLexeme(value: unknown): boolean {
  return strictRuntimeLexeme(value) !== undefined;
}

export function strictRuntimeLexeme(value: unknown): BaseLexeme | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  if (
    typeof ownDataValue(value, "id") === "string" &&
    typeof ownDataValue(value, "kana") === "string" &&
    typeof ownDataValue(value, "romaji") === "string" &&
    typeof ownDataValue(value, "meaningCopyId") === "string" &&
    typeof ownDataValue(value, "firstTeachLessonId") === "string" &&
    typeof ownDataValue(value, "countable") === "boolean" &&
    typeof ownDataValue(value, "category") === "string"
  ) {
    return value as unknown as BaseLexeme;
  }
  return undefined;
}

export function isStrictRuntimeConcept(value: unknown): boolean {
  return strictRuntimeConcept(value) !== undefined;
}

export function strictRuntimeConcept(value: unknown): BaseConcept | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  const prerequisiteIds = runtimeStringArrayValues(
    ownDataValue(value, "prerequisiteIds"),
  );
  if (
    typeof ownDataValue(value, "id") !== "string" ||
    typeof ownDataValue(value, "kind") !== "string" ||
    !prerequisiteIds ||
    typeof ownDataValue(value, "firstTeachLessonId") !== "string"
  ) {
    return undefined;
  }
  return Object.freeze({
    id: ownDataValue(value, "id") as string,
    kind: ownDataValue(value, "kind") as BaseConcept["kind"],
    prerequisiteIds,
    firstTeachLessonId: ownDataValue(value, "firstTeachLessonId") as string,
  });
}

export function isStrictRuntimeReferenceSnapshot(value: unknown): boolean {
  return strictRuntimeReferenceSnapshot(value) !== undefined;
}

export function strictRuntimeReferenceSnapshot(
  value: unknown,
): BaseReferenceSnapshotDefinition | undefined {
  if (
    !isPlainDataRecord(value) ||
    typeof ownDataValue(value, "id") !== "string" ||
    typeof ownDataValue(value, "firstTeachLessonId") !== "string" ||
    typeof ownDataValue(value, "titleCopyId") !== "string"
  ) {
    return undefined;
  }
  return value as unknown as BaseReferenceSnapshotDefinition;
}

export function isStrictRuntimeRetrievalSystem(value: unknown): boolean {
  return strictRuntimeRetrievalSystem(value) !== undefined;
}

export function strictRuntimeRetrievalSystem(
  value: unknown,
): BaseRetrievalSystem | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  const componentContentIds = runtimeStringArrayValues(
    ownDataValue(value, "componentContentIds"),
  );
  if (
    typeof ownDataValue(value, "id") !== "string" ||
    typeof ownDataValue(value, "firstTeachLessonId") !== "string" ||
    !componentContentIds
  ) {
    return undefined;
  }
  return Object.freeze({
    id: ownDataValue(value, "id") as string,
    firstTeachLessonId: ownDataValue(value, "firstTeachLessonId") as string,
    componentContentIds,
  });
}

function isSafeReadonlyMap(value: unknown): boolean {
  if (value instanceof Map) return true;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const get = Object.getOwnPropertyDescriptor(value, "get");
  const has = Object.getOwnPropertyDescriptor(value, "has");
  const values = Object.getOwnPropertyDescriptor(value, "values");
  const iterator = Object.getOwnPropertyDescriptor(value, Symbol.iterator);
  return (
    get !== undefined &&
    "value" in get &&
    typeof get.value === "function" &&
    has !== undefined &&
    "value" in has &&
    typeof has.value === "function" &&
    values !== undefined &&
    "value" in values &&
    typeof values.value === "function" &&
    iterator !== undefined &&
    "value" in iterator &&
    typeof iterator.value === "function"
  );
}

function isSafeReadonlySet(value: unknown): boolean {
  if (value instanceof Set) return true;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const has = Object.getOwnPropertyDescriptor(value, "has");
  return has !== undefined && "value" in has && typeof has.value === "function";
}

const CATALOG_MAP_FIELDS = [
  "lexemes",
  "concepts",
  "examples",
  "dialogues",
  "audioTargets",
  "acceptedAnswerTargets",
  "activityPromptTargets",
  "referenceSnapshots",
  "patternCellIdsByLesson",
  "systems",
] as const;

const CATALOG_SET_FIELDS = [
  "copyIds",
  "contrastMapIds",
  "patternCellIds",
] as const;

export function invalidRuntimeCatalogFields(value: unknown): readonly string[] {
  if (!isPlainDataRecord(value)) return ["catalogs"];
  const invalid = [
    ...CATALOG_MAP_FIELDS.filter(
      (field) =>
        !hasOwnDataValue(value, field) || !isSafeReadonlyMap(ownDataValue(value, field)),
    ),
    ...CATALOG_SET_FIELDS.filter(
      (field) =>
        !hasOwnDataValue(value, field) || !isSafeReadonlySet(ownDataValue(value, field)),
    ),
  ];
  return invalid;
}

function isExplanationBlockRecord(value: unknown): boolean {
  if (!isPlainDataRecord(value)) return false;
  return ["main", "construction", "constraints", "commonError", "nearestContrast"].every(
    (field) => typeof ownDataValue(value, field) === "string",
  );
}

export function isStrictRuntimeLesson(value: unknown): boolean {
  return strictRuntimeLesson(value) !== undefined;
}

export function strictRuntimeLesson(value: unknown): BaseLessonContent | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  const contract = ownDataValue(value, "contract");
  const activities = ownDataArrayValues(ownDataValue(value, "activities"));
  const activitySnapshots = activities?.map(strictRuntimeActivity);
  if (
    typeof ownDataValue(value, "lessonId") !== "string" ||
    typeof ownDataValue(value, "recapCopyId") !== "string" ||
    !runtimeStringArrayValues(ownDataValue(value, "prerequisiteLessonIds")) ||
    activities === undefined ||
    activitySnapshots === undefined ||
    activitySnapshots.some((activity) => activity === undefined)
  ) {
    return undefined;
  }
  const common = {
    lessonId: ownDataValue(value, "lessonId") as BaseLessonContent["lessonId"],
    contract,
    prerequisiteLessonIds: runtimeStringArrayValues(
      ownDataValue(value, "prerequisiteLessonIds"),
    ) as BaseLessonContent["prerequisiteLessonIds"],
    activities: Object.freeze(activitySnapshots as BaseActivityDefinition[]),
    recapCopyId: ownDataValue(value, "recapCopyId") as string,
  };

  if (contract === "phonetic") {
    const contrastiveItemIds = runtimeStringArrayValues(
      ownDataValue(value, "contrastiveItemIds"),
    );
    const anchorLexemeIds = runtimeStringArrayValues(
      ownDataValue(value, "anchorLexemeIds"),
    );
    const audioExemplarIds = runtimeStringArrayValues(
      ownDataValue(value, "audioExemplarIds"),
    );
    if (
      !contrastiveItemIds ||
      !anchorLexemeIds ||
      !audioExemplarIds ||
      typeof ownDataValue(value, "phoneticExplanationCopyId") !== "string" ||
      typeof ownDataValue(value, "contrastMapId") !== "string"
    ) {
      return undefined;
    }
    return Object.freeze({
      ...common,
      contract,
      contrastiveItemIds,
      anchorLexemeIds,
      audioExemplarIds,
      phoneticExplanationCopyId: ownDataValue(value, "phoneticExplanationCopyId") as string,
      contrastMapId: ownDataValue(value, "contrastMapId") as string,
    }) as BaseLessonContent;
  }

  if (contract !== "content" && contract !== "system" && contract !== "synthesis") {
    return undefined;
  }
  const newLexemeIds = runtimeStringArrayValues(ownDataValue(value, "newLexemeIds"));
  const reviewLexemeIds = runtimeStringArrayValues(
    ownDataValue(value, "reviewLexemeIds"),
  );
  const introducedConceptIds = runtimeStringArrayValues(
    ownDataValue(value, "introducedConceptIds"),
  );
  const reviewedConceptIds = runtimeStringArrayValues(
    ownDataValue(value, "reviewedConceptIds"),
  );
  const patternCellIds = runtimeStringArrayValues(
    ownDataValue(value, "patternCellIds"),
  );
  const workedExampleIds = runtimeStringArrayValues(
    ownDataValue(value, "workedExampleIds"),
  );
  const referenceSnapshotIds = runtimeStringArrayValues(
    ownDataValue(value, "referenceSnapshotIds"),
  );
  const retrievedSystemIds = runtimeStringArrayValues(
    ownDataValue(value, "retrievedSystemIds"),
  );
  const dialogueId = ownDataValue(value, "dialogueId");
  const explanationBlockIds = ownDataValue(value, "explanationBlockIds");
  if (
    !newLexemeIds ||
    !reviewLexemeIds ||
    !introducedConceptIds ||
    !reviewedConceptIds ||
    !isExplanationBlockRecord(explanationBlockIds) ||
    !patternCellIds ||
    !workedExampleIds ||
    !(typeof dialogueId === "string" || dialogueId === null) ||
    !referenceSnapshotIds ||
    typeof ownDataValue(value, "interactive") !== "boolean" ||
    !retrievedSystemIds
  ) {
    return undefined;
  }
  const explanationBlocks = explanationBlockIds as Readonly<Record<string, unknown>>;
  return Object.freeze({
    ...common,
    contract,
    newLexemeIds,
    reviewLexemeIds,
    introducedConceptIds,
    reviewedConceptIds,
    explanationBlockIds: Object.freeze({
      main: ownDataValue(explanationBlocks, "main") as string,
      construction: ownDataValue(explanationBlocks, "construction") as string,
      constraints: ownDataValue(explanationBlocks, "constraints") as string,
      commonError: ownDataValue(explanationBlocks, "commonError") as string,
      nearestContrast: ownDataValue(explanationBlocks, "nearestContrast") as string,
    }),
    patternCellIds,
    workedExampleIds,
    dialogueId,
    referenceSnapshotIds,
    interactive: ownDataValue(value, "interactive") as boolean,
    retrievedSystemIds,
  }) as BaseLessonContent;
}

type RuntimeBaseLessonContract =
  | "phonetic"
  | "content"
  | "system"
  | "synthesis";

/**
 * Reinterprets a descriptor-safe lesson record under its manifest contract.
 * Callers use this only after reporting a contract mismatch, so semantic
 * contracts cannot accidentally validate with another semantic range.
 */
export function strictRuntimeLessonWithContract(
  value: unknown,
  contract: RuntimeBaseLessonContract,
): unknown | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  delete descriptors.contract;
  const normalized = Object.create(Object.getPrototypeOf(value));
  Object.defineProperties(normalized, descriptors);
  Object.defineProperty(normalized, "contract", {
    configurable: true,
    enumerable: true,
    value: contract,
    writable: true,
  });
  return strictRuntimeLesson(normalized);
}

export function isStrictRuntimePrerequisiteLesson(value: unknown): boolean {
  return strictRuntimePrerequisiteLesson(value) !== undefined;
}

export function strictRuntimePrerequisiteLesson(
  value: unknown,
): Readonly<{
  readonly lessonId: string;
  readonly prerequisiteLessonIds: readonly string[];
}> | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  const prerequisiteLessonIds = runtimeStringArrayValues(
    ownDataValue(value, "prerequisiteLessonIds"),
  );
  if (
    typeof ownDataValue(value, "lessonId") !== "string" ||
    !prerequisiteLessonIds
  ) {
    return undefined;
  }
  return Object.freeze({
    lessonId: ownDataValue(value, "lessonId") as string,
    prerequisiteLessonIds,
  });
}
