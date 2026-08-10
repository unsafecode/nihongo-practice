import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import { lessonOwner } from "../../levels/ownership";
import {
  isPlainDataRecord,
  ownDataArrayValues,
  ownDataValue,
  strictRuntimeConcept,
  strictRuntimeRetrievalSystem,
} from "../validation/runtimeGuards";
import type {
  BaseConcept,
  BaseConceptKind,
  BaseReferenceSnapshotDefinition,
  BaseRetrievalSystem,
} from "./types";

function concept(
  id: string,
  kind: BaseConceptKind,
  firstTeachLessonId: string,
  prerequisiteIds: readonly string[] = [],
): BaseConcept {
  return { id, kind, firstTeachLessonId, prerequisiteIds };
}

export const BASE_CONCEPTS: readonly BaseConcept[] = deepFreeze([
  concept("sentence-chunks", "concept", "sentence-foundations-1"),
  concept("sentence-order", "concept", "sentence-foundations-2", ["sentence-chunks"]),
  concept("sentence-omission", "concept", "sentence-foundations-2", ["sentence-chunks"]),
  concept("affirmative-desu", "concept", "sentence-foundations-3", ["sentence-order"]),
  concept(
    "modifier-before-noun",
    "concept",
    "sentence-foundations-4",
    ["sentence-order"],
  ),
  concept("topic-wa", "concept", "topic-questions-1", ["sentence-order"]),
  concept("focus-subject-ga", "concept", "topic-questions-2", ["topic-wa"]),
  concept("possessive-no", "concept", "topic-questions-3", ["topic-wa"]),
  concept("additive-mo", "concept", "topic-questions-3", ["topic-wa"]),
  concept("nominal-listing-to", "concept", "topic-questions-3", ["topic-wa"]),
  concept("companion-to", "concept", "topic-questions-3", ["topic-wa"]),
  concept("question-ka", "concept", "topic-questions-4", ["topic-wa"]),
  concept("sentence-final-ne", "concept", "topic-questions-4", ["topic-wa"]),
  concept("sentence-final-yo", "concept", "topic-questions-4", ["topic-wa"]),
  concept("dictionary-lemma", "concept", "polite-verbs-1"),
  concept("godan-verb-class", "concept", "polite-verbs-1"),
  concept("polite-stems", "form", "polite-verbs-1"),
  concept("masu-nonpast", "form", "polite-verbs-1"),
  concept("ichidan-verb-class", "concept", "polite-verbs-2", ["dictionary-lemma"]),
  concept("suru-verb-class", "concept", "polite-verbs-3", ["dictionary-lemma"]),
  concept("kuru-verb-class", "concept", "polite-verbs-3", ["dictionary-lemma"]),
  concept("licensed-object-o", "concept", "argument-particles-1"),
  concept("goal-ni", "concept", "argument-particles-2"),
  concept("direction-he", "concept", "argument-particles-2"),
  concept("action-place-de", "concept", "argument-particles-3"),
  concept("means-de", "concept", "argument-particles-3"),
  concept(
    "dynamic-nonpast-semantics",
    "concept",
    "time-movement-1",
    ["masu-nonpast"],
  ),
  concept("time-ni", "concept", "time-movement-2"),
  concept("source-kara", "concept", "time-movement-2"),
  concept("limit-made", "concept", "time-movement-2"),
  concept(
    "four-polite-tense-cells",
    "form",
    "time-movement-3",
    ["masu-nonpast"],
  ),
  concept(
    "remaining-copula-cells",
    "form",
    "copula-adjectives-1",
    ["affirmative-desu"],
  ),
  concept("i-adjective-class", "concept", "copula-adjectives-1"),
  concept(
    "i-adjective-tense-polarity",
    "form",
    "copula-adjectives-2",
    ["i-adjective-class"],
  ),
  concept("na-adjective-class", "concept", "copula-adjectives-3"),
  concept(
    "na-adjective-predicate-and-attributive",
    "form",
    "copula-adjectives-3",
    ["remaining-copula-cells"],
  ),
  concept("aru-existence", "concept", "existence-location-1"),
  concept("iru-existence", "concept", "existence-location-1"),
  concept(
    "existence-location-frame",
    "concept",
    "existence-location-1",
    [],
  ),
  concept(
    "existence-location-ni",
    "concept",
    "existence-location-2",
    ["existence-location-frame"],
  ),
  concept(
    "existential-subject-ga",
    "concept",
    "existence-location-2",
    ["existence-location-frame"],
  ),
  concept("te-allomorphy", "form", "requests-connection-1", ["dictionary-lemma"]),
  concept("te-kudasai", "form", "requests-connection-2", ["te-allomorphy"]),
  concept("sequential-te", "form", "requests-connection-3", ["te-allomorphy"]),
  concept("te-imasu", "form", "requests-connection-4", ["te-allomorphy"]),
  concept(
    "reference-sentence-order",
    "reference-entry",
    "sentence-foundations-3",
    ["sentence-order"],
  ),
  concept(
    "reference-topic-particles",
    "reference-entry",
    "topic-questions-4",
    ["topic-wa", "focus-subject-ga"],
  ),
  concept(
    "reference-particle-frames",
    "reference-entry",
    "argument-particles-4",
    ["licensed-object-o", "goal-ni", "action-place-de"],
  ),
  concept(
    "reference-adjective-grid",
    "reference-entry",
    "copula-adjectives-4",
    ["i-adjective-tense-polarity", "na-adjective-predicate-and-attributive"],
  ),
  concept(
    "reference-te-forms",
    "reference-entry",
    "requests-connection-4",
    ["te-allomorphy", "te-kudasai", "sequential-te"],
  ),
]);

export const BASE_CONCEPT_BY_ID: ReadonlyMap<string, BaseConcept> =
  immutableReadonlyMap(BASE_CONCEPTS.map((entry) => [entry.id, entry]));

function referenceSnapshot(
  id: string,
  firstTeachLessonId: string,
): BaseReferenceSnapshotDefinition {
  return {
    id,
    firstTeachLessonId,
    titleCopyId: `${id}-title`,
  };
}

/**
 * Reference snapshots are catalog records rather than a bare ID set so their
 * first-teach ownership remains independently auditable.
 */
export const BASE_REFERENCE_SNAPSHOTS: readonly BaseReferenceSnapshotDefinition[] =
  deepFreeze(
    BASE_CONCEPTS.filter((concept) => concept.kind === "reference-entry").map(
      (concept) => referenceSnapshot(concept.id, concept.firstTeachLessonId),
    ),
  );

export const BASE_REFERENCE_SNAPSHOT_BY_ID: ReadonlyMap<
  string,
  BaseReferenceSnapshotDefinition
> = immutableReadonlyMap(
  BASE_REFERENCE_SNAPSHOTS.map((snapshot) => [snapshot.id, snapshot]),
);

function retrievalSystem(
  id: string,
  firstTeachLessonId: string,
  componentContentIds: readonly string[],
): BaseRetrievalSystem {
  return { id, firstTeachLessonId, componentContentIds };
}

/**
 * Canonical cumulative-retrieval systems use only stable content IDs. Locale
 * copy belongs to authored lessons, never to this catalog.
 */
export const BASE_RETRIEVAL_SYSTEMS: readonly BaseRetrievalSystem[] = deepFreeze([
  retrievalSystem(
    "sentence-anatomy",
    "sentence-foundations-2",
    ["sentence-chunks", "sentence-order", "affirmative-desu", "modifier-before-noun"],
  ),
  retrievalSystem(
    "particle-atlas",
    "argument-particles-4",
    [
      "topic-wa",
      "focus-subject-ga",
      "licensed-object-o",
      "goal-ni",
      "action-place-de",
    ],
  ),
  retrievalSystem(
    "verb-classes-conjugation",
    "polite-verbs-1",
    [
      "dictionary-lemma",
      "godan-verb-class",
      "ichidan-verb-class",
      "suru-verb-class",
      "kuru-verb-class",
      "polite-stems",
      "masu-nonpast",
    ],
  ),
  retrievalSystem(
    "tense-polarity",
    "time-movement-3",
    ["dynamic-nonpast-semantics", "four-polite-tense-cells"],
  ),
  retrievalSystem(
    "adjective-copula",
    "copula-adjectives-3",
    [
      "remaining-copula-cells",
      "i-adjective-tense-polarity",
      "na-adjective-predicate-and-attributive",
    ],
  ),
  retrievalSystem(
    "existence-location",
    "existence-location-2",
    [
      "aru-existence",
      "iru-existence",
      "existence-location-frame",
      "existence-location-ni",
      "existential-subject-ga",
    ],
  ),
  retrievalSystem(
    "bounded-te",
    "requests-connection-4",
    ["te-allomorphy", "te-kudasai", "sequential-te", "te-imasu"],
  ),
]);

export const BASE_RETRIEVAL_SYSTEM_BY_ID: ReadonlyMap<
  string,
  BaseRetrievalSystem
> = immutableReadonlyMap(
  BASE_RETRIEVAL_SYSTEMS.map((system) => [system.id, system]),
);

export type BaseRetrievalSystemValidationErrorCode =
  | "retrieval-system-invalid"
  | "retrieval-system-component-empty"
  | "retrieval-system-component-duplicate"
  | "retrieval-system-component-unresolved"
  | "retrieval-system-component-owner-mismatch";

export interface BaseRetrievalSystemValidationError {
  readonly code: BaseRetrievalSystemValidationErrorCode;
  readonly systemId: string;
  readonly componentId?: string;
}

type ComponentOwner = Readonly<{
  readonly contentId: string;
  readonly kind: BaseConceptKind | "lexeme";
  readonly levelId: string;
  readonly lessonId: string;
}>;

/**
 * Retrieval systems can introduce their components progressively. Their own
 * first-teach lesson therefore does not constrain component owners; it only
 * identifies when the system itself becomes reviewable.
 */
export function validateBaseRetrievalSystems(
  systems: readonly BaseRetrievalSystem[],
  concepts: readonly BaseConcept[],
  owners: readonly ComponentOwner[],
): readonly BaseRetrievalSystemValidationError[] {
  const errors: BaseRetrievalSystemValidationError[] = [];
  const componentOwners = (ownDataArrayValues(owners) ?? []).flatMap((owner) =>
    isPlainDataRecord(owner) &&
    typeof ownDataValue(owner, "contentId") === "string" &&
    typeof ownDataValue(owner, "kind") === "string" &&
    typeof ownDataValue(owner, "levelId") === "string" &&
    typeof ownDataValue(owner, "lessonId") === "string"
      ? [owner as ComponentOwner]
      : [],
  );
  const conceptsById = new Map<string, BaseConcept>();
  for (const rawConcept of ownDataArrayValues(concepts) ?? []) {
    const concept = strictRuntimeConcept(rawConcept);
    if (!concept) continue;
    conceptsById.set(concept.id, concept);
  }
  for (const rawSystem of ownDataArrayValues(systems) ?? []) {
    const system = strictRuntimeRetrievalSystem(rawSystem);
    if (!system) {
      const systemId =
        isPlainDataRecord(rawSystem) &&
        typeof ownDataValue(rawSystem, "id") === "string"
          ? (ownDataValue(rawSystem, "id") as string)
          : "unknown-system";
      errors.push({ code: "retrieval-system-invalid", systemId });
      continue;
    }
    const componentIds = system.componentContentIds;
    if (componentIds.length === 0) {
      errors.push({
        code: "retrieval-system-component-empty",
        systemId: system.id,
      });
      continue;
    }
    const seen = new Set<string>();
    for (const componentId of componentIds) {
      if (seen.has(componentId)) {
        errors.push({
          code: "retrieval-system-component-duplicate",
          systemId: system.id,
          componentId,
        });
        continue;
      }
      seen.add(componentId);
      const concept = conceptsById.get(componentId);
      if (!concept) {
        errors.push({
          code: "retrieval-system-component-unresolved",
          systemId: system.id,
          componentId,
        });
        continue;
      }
      const matchingOwners = componentOwners.filter(
        (owner) =>
          owner.contentId === componentId &&
          owner.kind === concept.kind &&
          owner.lessonId === concept.firstTeachLessonId &&
          owner.levelId === lessonOwner(concept.firstTeachLessonId)?.levelId,
      );
      if (matchingOwners.length !== 1) {
        errors.push({
          code: "retrieval-system-component-owner-mismatch",
          systemId: system.id,
          componentId,
        });
      }
    }
  }
  return deepFreeze(errors);
}
