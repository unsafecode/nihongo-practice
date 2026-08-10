import type { AssembledToken } from "../../../romaji/types";
import type {
  BaseActivityDefinition,
  BaseConcept,
  BaseDialogue,
  BaseDialogueTurn,
  BaseExample,
  BaseLexeme,
  BaseLessonContent,
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
import { particleProvidedEntries } from "../forms/particleLicensing";

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
  "action-place",
  "means",
  "existence-location",
  "existential-subject",
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
]);
const PREDICATE_ASPECTS = new Set([
  "dynamic",
  "stative",
  "nominal",
  "adjectival",
]);
const INTERPRETATION_TAGS = new Set([
  "habitual",
  "future",
  "present-state",
  "ongoing-now",
  "resulting-state",
  "past",
  "negative",
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
  if (Object.getPrototypeOf(value) !== Array.prototype) return undefined;
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
  const indexKeys = new Set<string>();
  for (let index = 0; index < length.value; index += 1) {
    indexKeys.add(String(index));
    const descriptor = descriptors[String(index)];
    if (!descriptor || !("value" in descriptor)) return undefined;
    values.push(descriptor.value);
  }
  if (
    Object.keys(descriptors).some(
      (key) => key !== "length" && !indexKeys.has(key),
    )
  ) {
    return undefined;
  }
  return Object.freeze(values);
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
  return strictRuntimeTokenSequence(tokens) !== undefined;
}

export function strictRuntimeTokenSequence(
  tokens: readonly AssembledToken[] | unknown,
): readonly AssembledToken[] | undefined {
  const entries = ownDataArrayValues(tokens);
  if (entries === undefined || !entries.every(isStrictRuntimeToken)) {
    return undefined;
  }
  return entries as readonly AssembledToken[];
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
  const provided = particleProvidedEntries(ownDataValue(value, "provided"));
  return (
    provided.ok &&
    provided.entries.every(
      ([role, particleSense]) =>
        PARTICLE_FRAME_ROLES.has(role) &&
        PARTICLE_FRAME_SENSES.has(particleSense),
    )
  );
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

/**
 * Validates the raw object before anything can clone it or read a property.
 * Role values must be closed own-data strings before publication; licensing
 * between a predicate and those values remains the particle validator's job.
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
  const predicateAspect = ownDataValue(value, "predicateAspect");
  if (
    hasOwnDataValue(value, "predicateAspect") &&
    (typeof predicateAspect !== "string" || !PREDICATE_ASPECTS.has(predicateAspect))
  ) {
    return "invalid-visible-target";
  }
  if (
    !isStrictInterpretationTags(
      ownDataValue(value, "interpretationTags"),
      predicateAspect !== undefined,
    )
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

export function strictRuntimeVisibleTarget(
  value: unknown,
): BaseVisibleTarget | undefined {
  const issue = runtimeVisibleTargetIssue(value);
  if (issue !== undefined || !isPlainDataRecord(value)) return undefined;
  const tokens = strictRuntimeTokenSequence(ownDataValue(value, "tokens"));
  const lexemeIds = runtimeStringArrayValues(ownDataValue(value, "lexemeIds"));
  const conceptIds = runtimeStringArrayValues(ownDataValue(value, "conceptIds"));
  const formIds = runtimeStringArrayValues(ownDataValue(value, "formIds"));
  const patternCellIds = runtimeStringArrayValues(
    ownDataValue(value, "patternCellIds"),
  );
  const semanticRoleIds = runtimeStringArrayValues(
    ownDataValue(value, "semanticRoleIds"),
  );
  const interpretationTags = runtimeStringArrayValues(
    ownDataValue(value, "interpretationTags"),
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
  const predicateAspect = ownDataValue(value, "predicateAspect");
  const discourseFrameId = ownDataValue(value, "discourseFrameId");
  const particleFrame = ownDataValue(value, "particleFrame");
  return Object.freeze({
    tokens,
    lexemeIds,
    conceptIds,
    formIds,
    patternCellIds,
    semanticRoleIds,
    interpretationTags,
    predicateSenseId: ownDataValue(value, "predicateSenseId"),
    predicateLexemeId: ownDataValue(value, "predicateLexemeId"),
    ...(typeof predicateAspect === "string" ? { predicateAspect } : {}),
    ...(typeof discourseFrameId === "string" ? { discourseFrameId } : {}),
    ...(particleFrame !== undefined ? { particleFrame } : {}),
  } as BaseVisibleTarget);
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
  return strictRuntimeExample(value) !== undefined;
}

export function strictRuntimeExample(value: unknown): BaseExample | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  const target = strictRuntimeVisibleTarget(value);
  const id = ownDataValue(value, "id");
  const teachingPurposeCopyId = ownDataValue(value, "teachingPurposeCopyId");
  const translationCopy = ownDataValue(value, "translationCopy");
  const predicateAspect = ownDataValue(value, "predicateAspect");
  const discourseFrameId = ownDataValue(value, "discourseFrameId");
  if (
    !target ||
    typeof id !== "string" ||
    typeof teachingPurposeCopyId !== "string" ||
    !isRuntimeTranslationCopy(translationCopy) ||
    typeof predicateAspect !== "string" ||
    typeof discourseFrameId !== "string"
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
  });
}

export function isStrictRuntimeDialogueTurn(value: unknown): boolean {
  return strictRuntimeDialogueTurn(value) !== undefined;
}

export function strictRuntimeDialogueTurn(
  value: unknown,
): BaseDialogueTurn | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  const target = strictRuntimeVisibleTarget(value);
  const speakerId = ownDataValue(value, "speakerId");
  const predicateAspect = ownDataValue(value, "predicateAspect");
  const discourseFrameId = ownDataValue(value, "discourseFrameId");
  if (
    !target ||
    typeof speakerId !== "string" ||
    typeof predicateAspect !== "string" ||
    typeof discourseFrameId !== "string"
  ) {
    return undefined;
  }
  return Object.freeze({
    ...target,
    speakerId,
    predicateAspect: predicateAspect as BaseDialogueTurn["predicateAspect"],
    discourseFrameId,
  });
}

export function isStrictRuntimeDialogue(value: unknown): boolean {
  return strictRuntimeDialogue(value) !== undefined;
}

export function strictRuntimeDialogue(value: unknown): BaseDialogue | undefined {
  if (
    !isPlainDataRecord(value) ||
    typeof ownDataValue(value, "id") !== "string" ||
    typeof ownDataValue(value, "practicalOutcomeCopyId") !== "string"
  ) {
    return undefined;
  }
  const turns = ownDataArrayValues(ownDataValue(value, "turns"));
  if (turns === undefined) return undefined;
  const turnSnapshots = turns.map(strictRuntimeDialogueTurn);
  if (turnSnapshots.some((turn) => turn === undefined)) return undefined;
  return Object.freeze({
    id: ownDataValue(value, "id") as string,
    practicalOutcomeCopyId: ownDataValue(value, "practicalOutcomeCopyId") as string,
    turns: Object.freeze(turnSnapshots as BaseDialogueTurn[]),
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
  if (
    !isBaseActivityKind(category) ||
    !isBaseInteractionKind(interactionKind) ||
    !isBaseActivityMode(mode) ||
    !isBaseActivityOperation(operation) ||
    !assessedConceptIds ||
    !assessedLexemeIds
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
