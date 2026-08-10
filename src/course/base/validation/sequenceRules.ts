import { deepFreeze } from "../../foundations/deepFreeze";
import { lessonOwner } from "../../levels/ownership";
import {
  BASE_CANONICAL_POSITIONS,
  BASE_LESSON_MANIFEST,
  requiredBaseLessonPrerequisiteFor,
} from "../manifest";
import {
  firstTeachOwnerKey,
  firstTeachLessonPosition,
  validateFirstTeachOwners,
  type FirstTeachOwner,
} from "../catalog/firstTeach";
import { validateBaseRetrievalSystems } from "../catalog/concepts";
import {
  baseVisibleTargetForDialogueTurn,
  type BaseConcept,
  type BaseExample,
  type BaseLessonContent,
  type BaseValidationCatalogs,
  type BaseVisibleTarget,
} from "../catalog/types";
import {
  activityPromptTargetReferenceFor,
  activityTargetReferenceFor,
  audioTargetReferenceFor,
} from "../catalog/visibleTargets";
import {
  invalidRuntimeCatalogFields,
  isPlainDataRecord,
  isStrictRuntimeConcept,
  isStrictRuntimeDialogue,
  isStrictRuntimeExample,
  isStrictRuntimeLesson,
  isStrictRuntimeLexeme,
  isStrictRuntimePrerequisiteLesson,
  isStrictRuntimeReferenceSnapshot,
  isStrictRuntimeRetrievalSystem,
  ownDataArrayValues,
  ownDataValue,
  strictRuntimeLessonWithContract,
} from "./runtimeGuards";
import {
  BASE_PARTICLE_FRAME_BY_PREDICATE,
  particleSenseFirstTeachContentId,
  validateParticleFrame,
} from "../forms/particleLicensing";
import type { BaseValidationError, BaseValidationErrorCode } from "./lessonRules";

export {
  BASE_REQUIRED_PREREQUISITE_BY_LESSON,
  requiredBaseLessonPrerequisiteFor,
} from "../manifest";

const ADJECTIVE_CELL_IDS = new Set([
  "remaining-copula-cells",
  "i-adjective-tense-polarity",
  "na-adjective-predicate-and-attributive",
]);
const FORBIDDEN_FORM_IDS = new Set(["explanatory-no", "ndesu"]);
const TE_IMASU_FORM_IDS = new Set(["te-imasu"]);
const TE_IMASU_OWNER_LESSON_ID = "requests-connection-4";

function workedExamplesFor(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
): readonly BaseExample[] {
  if (lesson.contract === "phonetic") return [];
  return lesson.workedExampleIds.flatMap((id) => {
    const example = catalogs.examples.get(id);
    return example && isStrictRuntimeExample(example) ? [example] : [];
  });
}

interface CanonicalExampleReference {
  readonly example: BaseExample;
  readonly referenceId: string;
  readonly sourceLabel: string;
}

function canonicalExamplesFor(
  lesson: BaseLessonContent,
  catalogs: BaseValidationCatalogs,
): readonly CanonicalExampleReference[] {
  const canonical = new Map<string, CanonicalExampleReference>();
  for (const example of workedExamplesFor(lesson, catalogs)) {
    canonical.set(example.id, {
      example,
      referenceId: example.id,
      sourceLabel: "example",
    });
  }
  for (const activity of lesson.activities) {
    const example = catalogs.examples.get(activity.targetId);
    if (!example || !isStrictRuntimeExample(example) || canonical.has(example.id)) {
      continue;
    }
    canonical.set(example.id, {
      example,
      referenceId: activity.targetId,
      sourceLabel: "activity target example",
    });
  }
  return [...canonical.values()];
}

function ownerKindForConcept(
  concept: BaseConcept | undefined,
): "concept" | "form" | "reference-entry" {
  return isStrictRuntimeConcept(concept)
    ? (ownDataValue(
        concept as unknown as Readonly<Record<string, unknown>>,
        "kind",
      ) as "concept" | "form" | "reference-entry")
    : "concept";
}

function tokensJapanese(tokens: unknown): string {
  const entries = ownDataArrayValues(tokens);
  if (!entries) return "";
  return entries
    .map((token) =>
      isPlainDataRecord(token) && typeof ownDataValue(token, "jp") === "string"
        ? (ownDataValue(token, "jp") as string)
        : "",
    )
    .join("");
}

function positionFor(lessonId: string): number | undefined {
  return firstTeachLessonPosition(lessonId);
}

function lessonIdFrom(value: unknown): string {
  return isPlainDataRecord(value) &&
    typeof ownDataValue(value, "lessonId") === "string"
    ? (ownDataValue(value, "lessonId") as string)
    : "unknown-lesson";
}

function lessonContractFrom(value: unknown): string | undefined {
  return isPlainDataRecord(value) &&
    typeof ownDataValue(value, "contract") === "string"
    ? (ownDataValue(value, "contract") as string)
    : undefined;
}

function canonicalLessonForManifest(
  rawLesson: unknown,
  contract: BaseLessonContent["contract"],
): BaseLessonContent | undefined {
  const normalized = strictRuntimeLessonWithContract(rawLesson, contract);
  return normalized === undefined ? undefined : (normalized as BaseLessonContent);
}

function hasCanonicalBaseLesson(lessonId: string): boolean {
  return BASE_LESSON_MANIFEST[lessonId] !== undefined;
}

function isBeforeLesson(lessonId: string, referenceLessonId: string): boolean {
  const position = positionFor(lessonId);
  const referencePosition = positionFor(referenceLessonId);
  return (
    position !== undefined &&
    referencePosition !== undefined &&
    position < referencePosition
  );
}

/**
 * Valid lesson prerequisites always point strictly backward in the canonical
 * order, so a valid graph cannot contain a cycle. This full-array pass still
 * reports cycles additively for malformed authoring input.
 */
export function validateBaseLessonPrerequisiteGraph(
  lessons: readonly BaseLessonContent[] | unknown,
): readonly BaseValidationError[] {
  const errors: BaseValidationError[] = [];
  const push = (
    lessonId: string,
    code: BaseValidationErrorCode,
    referenceId?: string,
  ): void => {
    errors.push({
      code,
      stage: "sequence",
      lessonId,
      ...(referenceId ? { referenceId } : {}),
    });
  };
  const rawLessons = ownDataArrayValues(lessons);
  if (!rawLessons) {
    push("unknown-lesson", "invalid-lesson-shape", "lessons");
    return deepFreeze(errors);
  }
  const validLessons: BaseLessonContent[] = [];
  for (const rawLesson of rawLessons) {
    const candidateLessonId = lessonIdFrom(rawLesson);
    if (
      candidateLessonId !== "unknown-lesson" &&
      !hasCanonicalBaseLesson(candidateLessonId)
    ) {
      push(candidateLessonId, "unknown-base-lesson", candidateLessonId);
    }
    if (!isStrictRuntimePrerequisiteLesson(rawLesson)) {
      push(candidateLessonId, "invalid-lesson-shape", "prerequisite lesson");
      continue;
    }
    validLessons.push(rawLesson as BaseLessonContent);
  }
  const byLessonId = new Map(
    validLessons.map((lesson) => [lesson.lessonId, lesson]),
  );

  for (const lesson of validLessons) {
    const seen = new Set<string>();
    const hasCanonicalPosition = hasCanonicalBaseLesson(lesson.lessonId);
    const lessonPosition = hasCanonicalPosition
      ? BASE_CANONICAL_POSITIONS[lesson.lessonId]
      : undefined;
    const requiredPrerequisite = hasCanonicalPosition
      ? requiredBaseLessonPrerequisiteFor(lesson.lessonId)
      : undefined;
    if (
      requiredPrerequisite !== undefined &&
      requiredPrerequisite !== null &&
      !lesson.prerequisiteLessonIds.includes(requiredPrerequisite)
    ) {
      push(lesson.lessonId, "missing-required-prerequisite", requiredPrerequisite);
    }
    for (const prerequisiteId of lesson.prerequisiteLessonIds) {
      if (seen.has(prerequisiteId)) {
        push(lesson.lessonId, "duplicate-prerequisite", prerequisiteId);
      }
      seen.add(prerequisiteId);
      if (prerequisiteId === lesson.lessonId) {
        push(lesson.lessonId, "self-prerequisite", prerequisiteId);
      }
      if (!BASE_LESSON_MANIFEST[prerequisiteId]) {
        push(lesson.lessonId, "invalid-prerequisite", prerequisiteId);
        continue;
      }
      if (
        hasCanonicalPosition &&
        lessonPosition !== undefined &&
        BASE_CANONICAL_POSITIONS[prerequisiteId] >= lessonPosition
      ) {
        push(lesson.lessonId, "future-prerequisite", prerequisiteId);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];
  const cycleLessonIds = new Set<string>();
  const visit = (lessonId: string): void => {
    if (visiting.has(lessonId)) {
      const start = path.indexOf(lessonId);
      path.slice(start).forEach((id) => cycleLessonIds.add(id));
      return;
    }
    if (visited.has(lessonId)) return;
    const lesson = byLessonId.get(lessonId);
    if (!lesson) return;
    visiting.add(lessonId);
    path.push(lessonId);
    for (const prerequisiteId of lesson.prerequisiteLessonIds) {
      if (byLessonId.has(prerequisiteId)) visit(prerequisiteId);
    }
    path.pop();
    visiting.delete(lessonId);
    visited.add(lessonId);
  };
  for (const lesson of validLessons) visit(lesson.lessonId);
  for (const lessonId of cycleLessonIds) {
    push(lessonId, "lesson-prerequisite-cycle", lessonId);
  }
  return deepFreeze(errors);
}

export function validateFirstTeachOrder(
  rawLessons: readonly BaseLessonContent[] | unknown,
  rawOwners: readonly FirstTeachOwner[] | unknown,
  rawCatalogs: BaseValidationCatalogs | unknown,
): readonly BaseValidationError[] {
  const errors: BaseValidationError[] = [];
  const push = (
    lessonId: string,
    code: BaseValidationErrorCode,
    referenceId?: string,
    detail?: string,
  ): void => {
    errors.push({
      code,
      stage: "sequence",
      lessonId,
      ...(referenceId ? { referenceId } : {}),
      ...(detail ? { detail } : {}),
    });
  };
  const ownerEntries = ownDataArrayValues(rawOwners);
  if (!ownerEntries) {
    push("unknown-lesson", "invalid-catalog-entry", "first-teach-owners");
    return deepFreeze(errors);
  }
  const owners: FirstTeachOwner[] = [];
  for (const rawOwner of ownerEntries) {
    const ownerIsValid =
      isPlainDataRecord(rawOwner) &&
      typeof ownDataValue(rawOwner, "contentId") === "string" &&
      typeof ownDataValue(rawOwner, "levelId") === "string" &&
      typeof ownDataValue(rawOwner, "lessonId") === "string" &&
      ["lexeme", "concept", "form", "reference-entry"].includes(
        ownDataValue(rawOwner, "kind") as string,
      );
    if (!ownerIsValid) {
      push("unknown-lesson", "invalid-catalog-entry", "first-teach-owner");
      continue;
    }
    owners.push(rawOwner as unknown as FirstTeachOwner);
  }
  const ownerByKey = new Map(
    owners.map((owner) => [firstTeachOwnerKey(owner.kind, owner.contentId), owner]),
  );
  const lessonEntries = ownDataArrayValues(rawLessons);
  if (!lessonEntries) {
    push("unknown-lesson", "invalid-lesson-shape", "lessons");
    return deepFreeze(errors);
  }
  const lessons: BaseLessonContent[] = [];
  for (const rawLesson of lessonEntries) {
    const candidateLessonId = lessonIdFrom(rawLesson);
    const manifest =
      candidateLessonId === "unknown-lesson"
        ? undefined
        : BASE_LESSON_MANIFEST[candidateLessonId];
    if (candidateLessonId !== "unknown-lesson" && !manifest) {
      push(candidateLessonId, "unknown-base-lesson", candidateLessonId);
    }
    const declaredContract = lessonContractFrom(rawLesson);
    if (
      manifest &&
      declaredContract !== undefined &&
      declaredContract !== manifest.contract
    ) {
      push(
        candidateLessonId,
        "lesson-contract-mismatch",
        candidateLessonId,
        `${declaredContract}:${manifest.contract}`,
      );
      const canonicalLesson = canonicalLessonForManifest(
        rawLesson,
        manifest.contract,
      );
      if (!canonicalLesson) {
        push(
          candidateLessonId,
          "missing-canonical-contract-fields",
          candidateLessonId,
          manifest.contract,
        );
        continue;
      }
      lessons.push(canonicalLesson);
      continue;
    }
    if (!isStrictRuntimeLesson(rawLesson)) {
      push(candidateLessonId, "invalid-lesson-shape", "lesson");
      continue;
    }
    lessons.push(rawLesson as BaseLessonContent);
  }
  const catalogFields = invalidRuntimeCatalogFields(rawCatalogs);
  if (catalogFields.length > 0) {
    for (const field of catalogFields) {
      push(lessons[0]?.lessonId ?? "unknown-lesson", "invalid-catalog-entry", field);
    }
    return deepFreeze(errors);
  }
  const catalogs = rawCatalogs as BaseValidationCatalogs;
  const validateOwnedReference = (
    lesson: BaseLessonContent,
    kind: FirstTeachOwner["kind"],
    id: string,
    sourceLabel?: string,
    reportedId = id,
  ): void => {
    const owner = ownerByKey.get(firstTeachOwnerKey(kind, id));
    const catalogRecord =
      kind === "lexeme"
        ? catalogs.lexemes.get(id)
        : kind === "reference-entry"
          ? catalogs.referenceSnapshots.get(id)
          : catalogs.concepts.get(id);
    const validCatalogRecord =
      kind === "lexeme"
        ? isStrictRuntimeLexeme(catalogRecord)
        : kind === "reference-entry"
          ? isStrictRuntimeReferenceSnapshot(catalogRecord)
          : isStrictRuntimeConcept(catalogRecord);
    if (catalogRecord && !validCatalogRecord) {
      push(lesson.lessonId, "invalid-catalog-entry", id, sourceLabel);
    }
    const catalogFirstTeachLessonId = validCatalogRecord
      ? (ownDataValue(
          catalogRecord as unknown as Readonly<Record<string, unknown>>,
          "firstTeachLessonId",
        ) as string)
      : undefined;
    if (!owner) {
      push(lesson.lessonId, "missing-first-teach-owner", reportedId, sourceLabel);
      if (owners.some((candidate) => candidate.contentId === id)) {
        push(lesson.lessonId, "owner-catalog-mismatch", reportedId, sourceLabel);
      }
      return;
    }
    const catalogLesson = catalogFirstTeachLessonId
      ? lessonOwner(catalogFirstTeachLessonId)
      : undefined;
    if (
      catalogFirstTeachLessonId !== undefined &&
      (owner.lessonId !== catalogFirstTeachLessonId ||
        (catalogLesson != null && owner.levelId !== catalogLesson.levelId))
    ) {
      push(lesson.lessonId, "owner-catalog-mismatch", reportedId, sourceLabel);
    }
    const lessonPosition = hasCanonicalBaseLesson(lesson.lessonId)
      ? positionFor(lesson.lessonId)
      : undefined;
    const ownerPosition = owner ? positionFor(owner.lessonId) : undefined;
    if (owner && lessonPosition !== undefined && ownerPosition !== undefined && ownerPosition > lessonPosition) {
      push(lesson.lessonId, "first-teach-before-owner", reportedId, sourceLabel);
    }
  };
  const validateParticleSenseOwner = (
    lesson: BaseLessonContent,
    particleSense: string,
    sourceLabel?: string,
  ): void => {
    const contentId = particleSenseFirstTeachContentId(
      particleSense as Parameters<typeof particleSenseFirstTeachContentId>[0],
    );
    const concept = catalogs.concepts.get(contentId);
    validateOwnedReference(
      lesson,
      ownerKindForConcept(concept),
      contentId,
      sourceLabel,
      particleSense,
    );
  };
  const validateSentence = (
    lesson: BaseLessonContent,
    sentence: BaseVisibleTarget,
    referenceId: string,
    sourceLabel?: string,
  ): void => {
    const lessonManifest = BASE_LESSON_MANIFEST[lesson.lessonId];
    for (const lexemeId of sentence.lexemeIds) {
      validateOwnedReference(lesson, "lexeme", lexemeId, sourceLabel);
    }
    for (const conceptId of sentence.conceptIds) {
      const concept = catalogs.concepts.get(conceptId);
      validateOwnedReference(
        lesson,
        ownerKindForConcept(concept),
        conceptId,
        sourceLabel,
      );
    }
    for (const formId of sentence.formIds) {
      const form = catalogs.concepts.get(formId);
      validateOwnedReference(
        lesson,
        ownerKindForConcept(form),
        formId,
        sourceLabel,
      );
      if (
        ADJECTIVE_CELL_IDS.has(formId) &&
        lessonManifest !== undefined &&
        (lessonManifest.moduleId !== "copula-adjectives" &&
          lessonManifest.moduleId !== "existence-location" &&
          lessonManifest.moduleId !== "requests-connection" &&
          lessonManifest.moduleId !== "base-synthesis")
      ) {
        push(lesson.lessonId, "adjective-cell-before-module-seven", formId);
      }
      if (
        TE_IMASU_FORM_IDS.has(formId) &&
        sentence.interpretationTags.includes("ongoing-now") &&
        lessonManifest !== undefined &&
        isBeforeLesson(lesson.lessonId, TE_IMASU_OWNER_LESSON_ID)
      ) {
        push(
          lesson.lessonId,
          "te-imasu-ongoing-before-requests-connection-4",
          formId,
        );
      }
      if (FORBIDDEN_FORM_IDS.has(formId)) {
        push(lesson.lessonId, "forbidden-explanatory-no", formId);
      }
    }
    if (
      sentence.predicateAspect === "dynamic" &&
      sentence.interpretationTags.includes("ongoing-now") &&
      !sentence.formIds.some((formId) => TE_IMASU_FORM_IDS.has(formId))
    ) {
      push(lesson.lessonId, "dynamic-nonpast-ongoing-now", referenceId);
    }
    if (sentence.particleFrame) {
      const predicateFrame = BASE_PARTICLE_FRAME_BY_PREDICATE.get(
        sentence.particleFrame.predicateSenseId as Parameters<
          typeof BASE_PARTICLE_FRAME_BY_PREDICATE.get
        >[0],
      );
      if (
        sentence.predicateSenseId !== sentence.particleFrame.predicateSenseId ||
        typeof sentence.predicateLexemeId !== "string" ||
        !sentence.lexemeIds.includes(sentence.predicateLexemeId) ||
        predicateFrame?.allowedPredicateLexemeIds.includes(
          sentence.predicateLexemeId,
        ) !== true
      ) {
        push(
          lesson.lessonId,
          "particle-frame-predicate-mismatch",
          referenceId,
          sourceLabel,
        );
      }
      const provided = sentence.particleFrame.provided;
      if (
        provided !== null &&
        typeof provided === "object" &&
        !Array.isArray(provided)
      ) {
        for (const particleSense of Object.values(provided)) {
          if (typeof particleSense === "string") {
            validateParticleSenseOwner(lesson, particleSense, sourceLabel);
          }
        }
      }
      const frame = validateParticleFrame(
        sentence.particleFrame.predicateSenseId,
        sentence.particleFrame.provided,
      );
      if (!frame.ok) {
        for (const error of frame.errors) {
          push(
            lesson.lessonId,
            error.code === "unlicensed-particle"
              ? "unlicensed-particle"
              : "invalid-particle-frame",
            referenceId,
            error.code,
          );
        }
      }
    }
  };

  for (const lesson of lessons) {
    for (const activity of lesson.activities) {
      for (const lexemeId of activity.assessedLexemeIds) {
        validateOwnedReference(
          lesson,
          "lexeme",
          lexemeId,
          `activity assessment:${activity.id}`,
        );
      }
      for (const conceptId of activity.assessedConceptIds) {
        const concept = catalogs.concepts.get(conceptId);
        validateOwnedReference(
          lesson,
          ownerKindForConcept(concept),
          conceptId,
          `activity assessment:${activity.id}`,
        );
      }
      const promptTarget = activityPromptTargetReferenceFor(
        lesson.lessonId,
        activity,
        catalogs,
      );
      if (promptTarget) {
        if (promptTarget.invalidReason) {
          push(
            lesson.lessonId,
            promptTarget.invalidReason === "invalid-particle-frame"
              ? "invalid-particle-frame"
              : "invalid-visible-target-shape",
            promptTarget.referenceId,
            promptTarget.label,
          );
        } else {
          validateSentence(
            lesson,
            promptTarget.target,
            promptTarget.referenceId,
            promptTarget.label,
          );
        }
      }
      const target = activityTargetReferenceFor(activity, catalogs);
      if (target?.invalidReason) {
        push(
          lesson.lessonId,
          target.invalidReason === "invalid-particle-frame"
            ? "invalid-particle-frame"
            : "invalid-visible-target-shape",
          target.referenceId,
          target.label,
        );
      } else if (target && target.source !== "example") {
        validateSentence(lesson, target.target, target.referenceId, target.label);
      }
    }
    for (const reference of canonicalExamplesFor(lesson, catalogs)) {
      validateSentence(
        lesson,
        reference.example,
        reference.referenceId,
        reference.sourceLabel,
      );
    }

    if (lesson.contract === "phonetic") {
      for (const audioExemplarId of lesson.audioExemplarIds) {
        const target = audioTargetReferenceFor(audioExemplarId, catalogs);
        if (target?.invalidReason) {
          push(
            lesson.lessonId,
            target.invalidReason === "invalid-particle-frame"
              ? "invalid-particle-frame"
              : "invalid-visible-target-shape",
            target.referenceId,
            target.label,
          );
        } else if (target) {
          validateSentence(lesson, target.target, target.referenceId, target.label);
        }
      }
    }

    if (lesson.contract === "phonetic") continue;

    for (const lexemeId of [
      ...lesson.newLexemeIds,
      ...lesson.reviewLexemeIds,
    ]) {
      validateOwnedReference(lesson, "lexeme", lexemeId);
    }
    for (const lexemeId of lesson.newLexemeIds) {
      const owner = ownerByKey.get(firstTeachOwnerKey("lexeme", lexemeId));
      if (owner?.lessonId !== lesson.lessonId) {
        push(lesson.lessonId, "new-lexeme-owner-mismatch", lexemeId);
      }
    }
    const conceptIds = [
      ...lesson.introducedConceptIds,
      ...lesson.reviewedConceptIds,
    ];
    for (const conceptId of conceptIds) {
      const concept = catalogs.concepts.get(conceptId);
      validateOwnedReference(lesson, ownerKindForConcept(concept), conceptId);
    }
    for (const snapshotId of lesson.referenceSnapshotIds) {
      validateOwnedReference(lesson, "reference-entry", snapshotId);
    }

    for (const conceptId of lesson.introducedConceptIds) {
      const concept = catalogs.concepts.get(conceptId);
      const owner = ownerByKey.get(
        firstTeachOwnerKey(ownerKindForConcept(concept), conceptId),
      );
      if (owner?.lessonId !== lesson.lessonId) {
        push(lesson.lessonId, "introduced-id-owner-mismatch", conceptId);
      }
    }

    if (lesson.dialogueId) {
      const rawDialogue = catalogs.dialogues.get(lesson.dialogueId);
      if (rawDialogue && !isStrictRuntimeDialogue(rawDialogue)) {
        push(lesson.lessonId, "invalid-dialogue-shape", lesson.dialogueId);
      } else if (rawDialogue) {
        const dialogue = rawDialogue;
        for (const [index, turn] of dialogue.turns.entries()) {
          validateSentence(
            lesson,
            baseVisibleTargetForDialogueTurn(turn),
            `${dialogue.id}:${index}`,
          );
        }
      }
    }
    for (const id of [...lesson.introducedConceptIds, ...lesson.reviewedConceptIds]) {
      if (FORBIDDEN_FORM_IDS.has(id)) {
        push(lesson.lessonId, "forbidden-explanatory-no", id);
      }
    }
  }

  const validConcepts = [...catalogs.concepts.values()].filter(
    isStrictRuntimeConcept,
  ) as BaseConcept[];
  const validLexemes = [...catalogs.lexemes.values()].filter(
    isStrictRuntimeLexeme,
  ) as Parameters<typeof validateFirstTeachOwners>[2];
  const validSnapshots = [...catalogs.referenceSnapshots.values()].filter(
    isStrictRuntimeReferenceSnapshot,
  ) as Parameters<typeof validateFirstTeachOwners>[3];
  const firstLessonId = lessons[0]?.lessonId ?? "unknown-lesson";
  for (const system of [...catalogs.systems.values()]) {
    if (isStrictRuntimeRetrievalSystem(system)) continue;
    const systemId =
      isPlainDataRecord(system) && typeof ownDataValue(system, "id") === "string"
        ? (ownDataValue(system, "id") as string)
        : "unknown-system";
    push(firstLessonId, "invalid-catalog-entry", systemId, "retrieval system");
  }
  for (const systemError of validateBaseRetrievalSystems(
    [...catalogs.systems.values()].filter(isStrictRuntimeRetrievalSystem) as Parameters<
      typeof validateBaseRetrievalSystems
    >[0],
    validConcepts,
    owners,
  )) {
    if (systemError.code === "retrieval-system-component-unresolved") {
      push(
        firstLessonId,
        "unresolved-reference",
        systemError.componentId,
        "retrieval system component",
      );
    } else if (systemError.code === "retrieval-system-component-owner-mismatch") {
      push(
        firstLessonId,
        "owner-catalog-mismatch",
        systemError.componentId,
        "retrieval system component",
      );
    } else {
      push(
        firstLessonId,
        "invalid-catalog-entry",
        systemError.systemId,
        systemError.code,
      );
    }
  }
  const ownerErrors = validateFirstTeachOwners(
    owners,
    validConcepts,
    validLexemes,
    validSnapshots,
  );
  for (const ownerError of ownerErrors) {
    if (ownerError.code === "prerequisite-after-dependent") {
      push(
        firstLessonId,
        "concept-prerequisite-order",
        ownerError.contentId,
        ownerError.referenceId,
      );
    } else if (ownerError.code === "prerequisite-cycle") {
      push(firstLessonId, "concept-prerequisite-cycle", ownerError.contentId);
    } else if (ownerError.code === "missing-owner") {
      push(firstLessonId, "missing-first-teach-owner", ownerError.contentId);
    } else if (ownerError.code === "owner-catalog-mismatch") {
      push(firstLessonId, "owner-catalog-mismatch", ownerError.contentId);
    } else {
      push(firstLessonId, "first-teach-owner-invalid", ownerError.contentId, ownerError.code);
    }
  }
  return deepFreeze(errors);
}

/**
 * Builds the reviewable Japanese surface strictly from authoring tokens. It
 * intentionally has no locale or UI dependency.
 */
export function visibleJapaneseFor(
  rawLessons: readonly BaseLessonContent[] | unknown,
  rawCatalogs: BaseValidationCatalogs | unknown,
): string {
  const lessonEntries = ownDataArrayValues(rawLessons);
  if (!lessonEntries || invalidRuntimeCatalogFields(rawCatalogs).length > 0) {
    return "";
  }
  const catalogs = rawCatalogs as BaseValidationCatalogs;
  const surfaces: string[] = [];
  const emitted = new Set<string>();
  const append = (key: string, tokens: unknown): void => {
    if (emitted.has(key)) return;
    emitted.add(key);
    surfaces.push(tokensJapanese(tokens));
  };
  const appendActivityTarget = (
    activity: BaseLessonContent["activities"][number],
  ): void => {
    const target = activityTargetReferenceFor(activity, catalogs);
    if (target && !target.invalidReason) {
      append(`${target.source}:${target.referenceId}`, target.target.tokens);
    }
  };
  for (const rawLesson of lessonEntries) {
    const lessonId = lessonIdFrom(rawLesson);
    const manifest = BASE_LESSON_MANIFEST[lessonId];
    if (!manifest) continue;
    const declaredContract = lessonContractFrom(rawLesson);
    const lesson =
      declaredContract !== undefined && declaredContract !== manifest.contract
        ? canonicalLessonForManifest(rawLesson, manifest.contract)
        : isStrictRuntimeLesson(rawLesson)
          ? (rawLesson as BaseLessonContent)
          : undefined;
    if (!lesson) continue;
    if (lesson.contract !== "phonetic") {
      for (const example of workedExamplesFor(lesson, catalogs)) {
        append(`example:${example.id}`, example.tokens);
      }
      if (lesson.dialogueId) {
        const dialogue = catalogs.dialogues.get(lesson.dialogueId);
        if (dialogue && isStrictRuntimeDialogue(dialogue)) {
          for (const [index, turn] of dialogue.turns.entries()) {
            append(`dialogue:${dialogue.id}:${index}`, turn.tokens);
          }
        }
      }
    }
    for (const activity of lesson.activities) {
      const promptTarget = activityPromptTargetReferenceFor(
        lesson.lessonId,
        activity,
        catalogs,
      );
      if (promptTarget && !promptTarget.invalidReason) {
        append(
          `activity-prompt:${lesson.lessonId}:${activity.id}`,
          promptTarget.target.tokens,
        );
      }
      appendActivityTarget(activity);
    }
    if (lesson.contract === "phonetic") {
      for (const audioExemplarId of lesson.audioExemplarIds) {
        const audioTarget = audioTargetReferenceFor(audioExemplarId, catalogs);
        if (audioTarget && !audioTarget.invalidReason) {
          append(`audio:${audioExemplarId}`, audioTarget.target.tokens);
        }
      }
    }
  }
  return surfaces.join("");
}
