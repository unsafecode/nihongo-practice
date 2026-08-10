import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import type { BaseConcept, BaseConceptKind } from "./types";

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
