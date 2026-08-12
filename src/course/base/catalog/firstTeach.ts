import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import {
  lessonIdsForLevel,
  lessonOwner,
} from "../../levels/ownership";
import {
  COURSE_LEVEL_IDS,
  type CourseLevelId,
} from "../../levels/types";
import { BASE_CONCEPTS, BASE_REFERENCE_SNAPSHOTS } from "./concepts";
import { BASE_LEXICON } from "./lexicon";
import type {
  BaseConcept,
  BaseConceptKind,
  BaseLexeme,
  BaseReferenceSnapshotDefinition,
} from "./types";
import {
  BASE_PARTICLE_SENSES,
  particleSenseFirstTeachContentId,
  type BaseParticleSense,
} from "../forms/particleLicensing";

export type FirstTeachOwnerKind =
  | "lexeme"
  | Extract<BaseConceptKind, "concept" | "form" | "reference-entry">;

export interface FirstTeachOwner {
  readonly contentId: string;
  readonly levelId: CourseLevelId;
  readonly lessonId: string;
  readonly kind: FirstTeachOwnerKind;
}

export type FirstTeachValidationErrorCode =
  | "duplicate-owner"
  | "missing-owner"
  | "owner-catalog-mismatch"
  | "missing-lesson"
  | "owner-level-mismatch"
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

function particleSenseOwner(
  sense: BaseParticleSense,
): FirstTeachOwner {
  const contentId = particleSenseFirstTeachContentId(sense);
  const concept = BASE_CONCEPTS.find((entry) => entry.id === contentId);
  if (!concept) {
    throw new Error(
      `Particle sense "${sense}" maps to unknown first-teach content "${contentId}".`,
    );
  }
  const owner = BASE_FIRST_TEACH_OWNER_BY_KEY.get(
    firstTeachOwnerKey(concept.kind, contentId),
  );
  if (!owner || owner.lessonId !== concept.firstTeachLessonId) {
    throw new Error(
      `Particle sense "${sense}" does not have a canonical first-teach owner.`,
    );
  }
  return owner;
}

export const BASE_PARTICLE_SENSE_FIRST_TEACH_OWNER_BY_SENSE: ReadonlyMap<
  BaseParticleSense,
  FirstTeachOwner
> = immutableReadonlyMap(
  BASE_PARTICLE_SENSES.map((sense) => [
    sense.id,
    particleSenseOwner(sense.id),
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

interface CatalogOwnerDefinition {
  readonly contentId: string;
  readonly kind: FirstTeachOwnerKind;
  readonly levelId: CourseLevelId;
  readonly lessonId: string;
}

function catalogOwnerDefinitions(
  concepts: readonly BaseConcept[],
  lexemes: readonly BaseLexeme[],
  referenceSnapshots: readonly BaseReferenceSnapshotDefinition[],
): readonly CatalogOwnerDefinition[] {
  const levelFor = (lessonId: string): CourseLevelId =>
    lessonOwner(lessonId)?.levelId ?? "a0";
  return [
    ...lexemes.map((lexeme) => ({
      contentId: lexeme.id,
      kind: "lexeme" as const,
      levelId: levelFor(lexeme.firstTeachLessonId),
      lessonId: lexeme.firstTeachLessonId,
    })),
    ...concepts.map((concept) => ({
      contentId: concept.id,
      kind: ownerKindForConcept(concept),
      levelId: levelFor(concept.firstTeachLessonId),
      lessonId: concept.firstTeachLessonId,
    })),
    ...referenceSnapshots.map((snapshot) => ({
      contentId: snapshot.id,
      kind: "reference-entry" as const,
      levelId: levelFor(snapshot.firstTeachLessonId),
      lessonId: snapshot.firstTeachLessonId,
    })),
  ];
}

const CANONICAL_LESSON_POSITION_BY_ID: ReadonlyMap<string, number> = (() => {
  let position = 0;
  return immutableReadonlyMap(
    COURSE_LEVEL_IDS.flatMap((levelId) =>
      lessonIdsForLevel(levelId).map((lessonId) => [lessonId, position++] as const),
    ),
  );
})();

export function firstTeachLessonPosition(lessonId: string): number | undefined {
  return CANONICAL_LESSON_POSITION_BY_ID.get(lessonId);
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
  referenceSnapshots: readonly BaseReferenceSnapshotDefinition[] = BASE_REFERENCE_SNAPSHOTS,
): readonly FirstTeachValidationError[] {
  const errors: FirstTeachValidationError[] = [];
  const counts = new Map<string, number>();
  for (const owner of owners) {
    const key = firstTeachOwnerKey(owner.kind, owner.contentId);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    const lesson = lessonOwner(owner.lessonId);
    if (!lesson) {
      errors.push({
        code: "missing-lesson",
        contentId: owner.contentId,
        lessonId: owner.lessonId,
      });
    } else if (lesson.levelId !== owner.levelId) {
      errors.push({
        code: "owner-level-mismatch",
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
  for (const expected of catalogOwnerDefinitions(
    concepts,
    lexemes,
    referenceSnapshots,
  )) {
    const expectedKey = firstTeachOwnerKey(expected.kind, expected.contentId);
    const matchingOwners = owners.filter(
      (owner) =>
        owner.contentId === expected.contentId &&
        owner.kind === expected.kind &&
        owner.levelId === expected.levelId &&
        owner.lessonId === expected.lessonId,
    );
    if (!lookup.has(expectedKey)) {
      errors.push({ code: "missing-owner", contentId: expected.contentId });
    }
    if (matchingOwners.length !== 1) {
      errors.push({
        code: "owner-catalog-mismatch",
        contentId: expected.contentId,
        lessonId: expected.lessonId,
      });
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
        firstTeachLessonPosition(prerequisiteOwner.lessonId) !== undefined &&
        firstTeachLessonPosition(dependent.lessonId) !== undefined &&
        firstTeachLessonPosition(prerequisiteOwner.lessonId)! >=
          firstTeachLessonPosition(dependent.lessonId)!
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
