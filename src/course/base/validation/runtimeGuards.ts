import type { AssembledToken } from "../../../romaji/types";

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

const hasOwn: (value: object, key: PropertyKey) => boolean =
  (Object as unknown as {
    hasOwn?: (value: object, key: PropertyKey) => boolean;
  }).hasOwn ??
  ((value, key) => Object.prototype.hasOwnProperty.call(value, key));

export function isPlainDataRecord(value: unknown): value is RuntimeDataRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every(
    (descriptor) => "value" in descriptor,
  );
}

export function ownDataValue(
  record: RuntimeDataRecord,
  key: string,
): unknown {
  if (!hasOwn(record, key)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

export function hasOwnDataValue(
  record: RuntimeDataRecord,
  key: string,
): boolean {
  if (!hasOwn(record, key)) return false;
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor !== undefined && "value" in descriptor;
}

/**
 * Reads array entries exclusively from their own data descriptors, so a sparse
 * array or an accessor element can never be treated as an authored sequence.
 */
export function ownDataArrayValues(value: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const descriptors = Object.getOwnPropertyDescriptors(value) as Record<
    string,
    PropertyDescriptor
  >;
  const length = descriptors["length"];
  if (
    !length ||
    !("value" in length) ||
    typeof length.value !== "number" ||
    !Number.isSafeInteger(length.value) ||
    length.value < 0 ||
    Object.getOwnPropertySymbols(value).length > 0 ||
    !Object.values(descriptors).every((descriptor) => "value" in descriptor)
  ) {
    return undefined;
  }
  const values: unknown[] = [];
  for (let index = 0; index < length.value; index += 1) {
    const descriptor = descriptors[String(index)];
    if (!descriptor || !("value" in descriptor)) return undefined;
    values.push(descriptor.value);
  }
  return values;
}

export function isRuntimeStringArray(value: unknown): value is readonly string[] {
  const entries = ownDataArrayValues(value);
  return entries !== undefined && entries.every((entry) => typeof entry === "string");
}

function isStrictRuntimeToken(value: unknown): value is AssembledToken {
  if (!isPlainDataRecord(value)) return false;
  const source = ownDataValue(value, "source");
  if (!isPlainDataRecord(source)) return false;
  const referenceId = ownDataValue(source, "referenceId");
  const domain = ownDataValue(source, "domain");
  const reading = ownDataValue(value, "reading");
  const kind = ownDataValue(value, "kind");
  const boundaryBefore = ownDataValue(value, "boundaryBefore");
  return (
    typeof ownDataValue(value, "id") === "string" &&
    typeof ownDataValue(value, "jp") === "string" &&
    typeof ownDataValue(value, "romaji") === "string" &&
    typeof kind === "string" &&
    TOKEN_KINDS.has(kind) &&
    typeof boundaryBefore === "string" &&
    TOKEN_BOUNDARIES.has(boundaryBefore) &&
    typeof domain === "string" &&
    TOKEN_SOURCE_DOMAINS.has(domain) &&
    typeof referenceId === "string" &&
    referenceId.trim().length > 0 &&
    (reading === undefined || typeof reading === "string")
  );
}

export function isStrictRuntimeTokenSequence(
  tokens: readonly AssembledToken[] | unknown,
): tokens is readonly AssembledToken[] {
  const entries = ownDataArrayValues(tokens);
  return entries !== undefined && entries.every(isStrictRuntimeToken);
}

export type RuntimeVisibleTargetIssue =
  | "invalid-visible-target"
  | "invalid-token-sequence"
  | "invalid-particle-frame";

function isSafeParticleFrame(value: unknown): boolean {
  if (!isPlainDataRecord(value)) return false;
  const predicateSenseId = ownDataValue(value, "predicateSenseId");
  if (typeof predicateSenseId !== "string" || !hasOwnDataValue(value, "provided")) {
    return false;
  }
  return isPlainDataRecord(ownDataValue(value, "provided"));
}

/**
 * Validates the raw object before anything can clone it or read a property.
 * Role values remain the particle validator's responsibility; this guard only
 * establishes that they are own data properties on a plain record.
 */
export function runtimeVisibleTargetIssue(
  value: unknown,
): RuntimeVisibleTargetIssue | undefined {
  if (!isPlainDataRecord(value)) return "invalid-visible-target";
  const tokens = ownDataValue(value, "tokens");
  if (!isStrictRuntimeTokenSequence(tokens)) return "invalid-token-sequence";
  const requiredStringArrays = [
    "lexemeIds",
    "conceptIds",
    "formIds",
    "patternCellIds",
    "semanticRoleIds",
    "interpretationTags",
  ] as const;
  if (
    !requiredStringArrays.every(
      (field) => hasOwnDataValue(value, field) && isRuntimeStringArray(ownDataValue(value, field)),
    )
  ) {
    return "invalid-visible-target";
  }
  const predicateSenseId = ownDataValue(value, "predicateSenseId");
  const predicateLexemeId = ownDataValue(value, "predicateLexemeId");
  if (
    !(
      (typeof predicateSenseId === "string" || predicateSenseId === null) &&
      (typeof predicateLexemeId === "string" || predicateLexemeId === null)
    )
  ) {
    return "invalid-visible-target";
  }
  if (
    hasOwnDataValue(value, "predicateAspect") &&
    ownDataValue(value, "predicateAspect") !== undefined &&
    typeof ownDataValue(value, "predicateAspect") !== "string"
  ) {
    return "invalid-visible-target";
  }
  if (
    hasOwnDataValue(value, "discourseFrameId") &&
    ownDataValue(value, "discourseFrameId") !== undefined &&
    typeof ownDataValue(value, "discourseFrameId") !== "string"
  ) {
    return "invalid-visible-target";
  }
  if (
    hasOwnDataValue(value, "particleFrame") &&
    ownDataValue(value, "particleFrame") !== undefined &&
    !isSafeParticleFrame(ownDataValue(value, "particleFrame"))
  ) {
    return "invalid-particle-frame";
  }
  return undefined;
}

function isRuntimeTranslationCopy(value: unknown): boolean {
  if (!isPlainDataRecord(value)) return false;
  const copyId = ownDataValue(value, "copyId");
  if (typeof copyId === "string") return true;
  return (
    typeof ownDataValue(value, "enCopyId") === "string" &&
    typeof ownDataValue(value, "itCopyId") === "string"
  );
}

export function isStrictRuntimeExample(value: unknown): boolean {
  if (!isPlainDataRecord(value) || runtimeVisibleTargetIssue(value) !== undefined) {
    return false;
  }
  return (
    typeof ownDataValue(value, "id") === "string" &&
    typeof ownDataValue(value, "teachingPurposeCopyId") === "string" &&
    isRuntimeTranslationCopy(ownDataValue(value, "translationCopy")) &&
    typeof ownDataValue(value, "predicateAspect") === "string" &&
    typeof ownDataValue(value, "discourseFrameId") === "string"
  );
}

export function isStrictRuntimeDialogueTurn(value: unknown): boolean {
  return (
    isPlainDataRecord(value) &&
    runtimeVisibleTargetIssue(value) === undefined &&
    typeof ownDataValue(value, "speakerId") === "string" &&
    typeof ownDataValue(value, "predicateAspect") === "string" &&
    typeof ownDataValue(value, "discourseFrameId") === "string"
  );
}

export function isStrictRuntimeDialogue(value: unknown): boolean {
  if (
    !isPlainDataRecord(value) ||
    typeof ownDataValue(value, "id") !== "string" ||
    typeof ownDataValue(value, "practicalOutcomeCopyId") !== "string"
  ) {
    return false;
  }
  const turns = ownDataArrayValues(ownDataValue(value, "turns"));
  return turns !== undefined && turns.every(isStrictRuntimeDialogueTurn);
}

export function isStrictRuntimeActivity(value: unknown): boolean {
  if (!isPlainDataRecord(value)) return false;
  const stringFields = [
    "id",
    "category",
    "interactionKind",
    "mode",
    "targetId",
    "operation",
    "instructionCopyId",
    "acceptedFeedbackCopyId",
    "retryFeedbackCopyId",
  ] as const;
  return (
    stringFields.every((field) => typeof ownDataValue(value, field) === "string") &&
    isRuntimeStringArray(ownDataValue(value, "assessedConceptIds")) &&
    isRuntimeStringArray(ownDataValue(value, "assessedLexemeIds"))
  );
}

export function isStrictRuntimeLexeme(value: unknown): boolean {
  if (!isPlainDataRecord(value)) return false;
  return (
    typeof ownDataValue(value, "id") === "string" &&
    typeof ownDataValue(value, "kana") === "string" &&
    typeof ownDataValue(value, "romaji") === "string" &&
    typeof ownDataValue(value, "meaningCopyId") === "string" &&
    typeof ownDataValue(value, "firstTeachLessonId") === "string" &&
    typeof ownDataValue(value, "countable") === "boolean" &&
    typeof ownDataValue(value, "category") === "string"
  );
}

export function isStrictRuntimeConcept(value: unknown): boolean {
  return (
    isPlainDataRecord(value) &&
    typeof ownDataValue(value, "id") === "string" &&
    typeof ownDataValue(value, "kind") === "string" &&
    isRuntimeStringArray(ownDataValue(value, "prerequisiteIds")) &&
    typeof ownDataValue(value, "firstTeachLessonId") === "string"
  );
}

export function isStrictRuntimeReferenceSnapshot(value: unknown): boolean {
  return (
    isPlainDataRecord(value) &&
    typeof ownDataValue(value, "id") === "string" &&
    typeof ownDataValue(value, "firstTeachLessonId") === "string" &&
    typeof ownDataValue(value, "titleCopyId") === "string"
  );
}

export function isStrictRuntimeRetrievalSystem(value: unknown): boolean {
  return (
    isPlainDataRecord(value) &&
    typeof ownDataValue(value, "id") === "string" &&
    typeof ownDataValue(value, "firstTeachLessonId") === "string" &&
    isRuntimeStringArray(ownDataValue(value, "componentContentIds"))
  );
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
  if (!isPlainDataRecord(value)) return false;
  const contract = ownDataValue(value, "contract");
  const activities = ownDataArrayValues(ownDataValue(value, "activities"));
  if (
    typeof ownDataValue(value, "lessonId") !== "string" ||
    typeof ownDataValue(value, "recapCopyId") !== "string" ||
    !isRuntimeStringArray(ownDataValue(value, "prerequisiteLessonIds")) ||
    activities === undefined ||
    !activities.every(isStrictRuntimeActivity)
  ) {
    return false;
  }

  if (contract === "phonetic") {
    return (
      isRuntimeStringArray(ownDataValue(value, "contrastiveItemIds")) &&
      isRuntimeStringArray(ownDataValue(value, "anchorLexemeIds")) &&
      isRuntimeStringArray(ownDataValue(value, "audioExemplarIds")) &&
      typeof ownDataValue(value, "phoneticExplanationCopyId") === "string" &&
      typeof ownDataValue(value, "contrastMapId") === "string"
    );
  }

  if (contract !== "content" && contract !== "system" && contract !== "synthesis") {
    return false;
  }
  return (
    isRuntimeStringArray(ownDataValue(value, "newLexemeIds")) &&
    isRuntimeStringArray(ownDataValue(value, "reviewLexemeIds")) &&
    isRuntimeStringArray(ownDataValue(value, "introducedConceptIds")) &&
    isRuntimeStringArray(ownDataValue(value, "reviewedConceptIds")) &&
    isExplanationBlockRecord(ownDataValue(value, "explanationBlockIds")) &&
    isRuntimeStringArray(ownDataValue(value, "patternCellIds")) &&
    isRuntimeStringArray(ownDataValue(value, "workedExampleIds")) &&
    (typeof ownDataValue(value, "dialogueId") === "string" ||
      ownDataValue(value, "dialogueId") === null) &&
    isRuntimeStringArray(ownDataValue(value, "referenceSnapshotIds")) &&
    typeof ownDataValue(value, "interactive") === "boolean" &&
    isRuntimeStringArray(ownDataValue(value, "retrievedSystemIds"))
  );
}

export function isStrictRuntimePrerequisiteLesson(value: unknown): boolean {
  return (
    isPlainDataRecord(value) &&
    typeof ownDataValue(value, "lessonId") === "string" &&
    isRuntimeStringArray(ownDataValue(value, "prerequisiteLessonIds"))
  );
}
