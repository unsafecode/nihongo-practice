import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import { BASE_LESSON_MANIFEST } from "../manifest";
import { BASE_CONCEPTS } from "./concepts";
import { BASE_LEXICON } from "./lexicon";
import type { BaseConcept, BaseConceptKind, BaseLexeme } from "./types";

export type FirstTeachOwnerKind =
  | "lexeme"
  | Extract<BaseConceptKind, "concept" | "form" | "reference-entry">;

export interface FirstTeachOwner {
  readonly contentId: string;
  readonly levelId: "a0";
  readonly lessonId: string;
  readonly kind: FirstTeachOwnerKind;
}

export type FirstTeachValidationErrorCode =
  | "duplicate-owner"
  | "missing-owner"
  | "missing-lesson"
  | "prerequisite-after-dependent"
  | "prerequisite-cycle"
  | "unknown-prerequisite";

export interface FirstTeachValidationError {
  readonly code: FirstTeachValidationErrorCode;
  readonly contentId?: string;
  readonly referenceId?: string;
  readonly lessonId?: string;
}

export function firstTeachOwnerKey(
  kind: FirstTeachOwnerKind,
  contentId: string,
): string {
  return `${kind}:${contentId}`;
}

function ownerForLexeme(lexeme: BaseLexeme): FirstTeachOwner {
  return {
    contentId: lexeme.id,
    levelId: "a0",
    lessonId: lexeme.firstTeachLessonId,
    kind: "lexeme",
  };
}

function ownerForConcept(concept: BaseConcept): FirstTeachOwner {
  return {
    contentId: concept.id,
    levelId: "a0",
    lessonId: concept.firstTeachLessonId,
    kind: concept.kind,
  };
}

export const BASE_FIRST_TEACH_OWNERS: readonly FirstTeachOwner[] = deepFreeze([
  ...BASE_LEXICON.map(ownerForLexeme),
  ...BASE_CONCEPTS.map(ownerForConcept),
]);

export const BASE_FIRST_TEACH_OWNER_BY_KEY: ReadonlyMap<string, FirstTeachOwner> =
  immutableReadonlyMap(
    BASE_FIRST_TEACH_OWNERS.map((owner) => [
      firstTeachOwnerKey(owner.kind, owner.contentId),
      owner,
    ]),
  );

function ownerLookup(
  owners: readonly FirstTeachOwner[],
): ReadonlyMap<string, FirstTeachOwner> {
  return immutableReadonlyMap(
    owners.map((owner) => [firstTeachOwnerKey(owner.kind, owner.contentId), owner]),
  );
}

function ownerKindForConcept(concept: BaseConcept): FirstTeachOwnerKind {
  return concept.kind;
}

function hasPrerequisiteCycle(concepts: readonly BaseConcept[]): readonly string[] {
  const byId = new Map(concepts.map((concept) => [concept.id, concept]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleIds = new Set<string>();

  const visit = (id: string): void => {
    if (visiting.has(id)) {
      cycleIds.add(id);
      return;
    }
    if (visited.has(id)) return;
    const concept = byId.get(id);
    if (!concept) return;
    visiting.add(id);
    for (const prerequisiteId of concept.prerequisiteIds) visit(prerequisiteId);
    visiting.delete(id);
    visited.add(id);
  };

  for (const concept of concepts) visit(concept.id);
  return [...cycleIds];
}

/**
 * Reports all ownership faults together so content authors can repair a batch
 * without repeatedly rebuilding a partial catalog.
 */
export function validateFirstTeachOwners(
  owners: readonly FirstTeachOwner[],
  concepts: readonly BaseConcept[],
  lexemes: readonly BaseLexeme[] = BASE_LEXICON,
): readonly FirstTeachValidationError[] {
  const errors: FirstTeachValidationError[] = [];
  const counts = new Map<string, number>();
  for (const owner of owners) {
    const key = firstTeachOwnerKey(owner.kind, owner.contentId);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!BASE_LESSON_MANIFEST[owner.lessonId]) {
      errors.push({
        code: "missing-lesson",
        contentId: owner.contentId,
        lessonId: owner.lessonId,
      });
    }
  }
  for (const [key, count] of counts) {
    if (count > 1) {
      const separator = key.indexOf(":");
      errors.push({ code: "duplicate-owner", contentId: key.slice(separator + 1) });
    }
  }

  const lookup = ownerLookup(owners);
  for (const lexeme of lexemes) {
    if (!lookup.has(firstTeachOwnerKey("lexeme", lexeme.id))) {
      errors.push({ code: "missing-owner", contentId: lexeme.id });
    }
  }
  for (const concept of concepts) {
    if (!lookup.has(firstTeachOwnerKey(ownerKindForConcept(concept), concept.id))) {
      errors.push({ code: "missing-owner", contentId: concept.id });
    }
  }

  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  for (const concept of concepts) {
    const dependent = lookup.get(firstTeachOwnerKey(ownerKindForConcept(concept), concept.id));
    if (!dependent) continue;
    for (const prerequisiteId of concept.prerequisiteIds) {
      const prerequisite = conceptById.get(prerequisiteId);
      if (!prerequisite) {
        errors.push({
          code: "unknown-prerequisite",
          contentId: concept.id,
          referenceId: prerequisiteId,
        });
        continue;
      }
      const prerequisiteOwner = lookup.get(
        firstTeachOwnerKey(ownerKindForConcept(prerequisite), prerequisiteId),
      );
      if (
        prerequisiteOwner &&
        BASE_LESSON_MANIFEST[prerequisiteOwner.lessonId] &&
        BASE_LESSON_MANIFEST[dependent.lessonId] &&
        BASE_LESSON_MANIFEST[prerequisiteOwner.lessonId].position >=
          BASE_LESSON_MANIFEST[dependent.lessonId].position
      ) {
        errors.push({
          code: "prerequisite-after-dependent",
          contentId: concept.id,
          referenceId: prerequisiteId,
        });
      }
    }
  }
  for (const contentId of hasPrerequisiteCycle(concepts)) {
    errors.push({ code: "prerequisite-cycle", contentId });
  }
  return deepFreeze(errors);
}
