import type { AssembledToken } from "../../../romaji/types";
import { formatRomaji } from "../../../romaji/formatRomaji";
import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import { immutableReadonlySet } from "../../foundations/immutableReadonlySet";
import { baseCanonicalPosition } from "../manifest";
import { BASE_CONCEPT_BY_ID } from "../catalog/concepts";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import {
  type DesuFunction,
  realizeIAdjectivePredicate,
  realizeNaAdjectiveAttributive,
  realizeNaAdjectivePredicate,
  realizeOwnedNounPredicate,
} from "../forms/adjectiveForms";
import {
  composeBaseTokenSequences,
  isolateBaseTokenSequence,
} from "../forms/composeFormTokens";
import {
  realizePoliteGrid,
  realizePoliteStem,
  realizeTeConstruction,
  realizeVerbDictionary,
} from "../forms/verbForms";
import {
  BASE_PARTICLE_SENSES,
  baseParticleSurfaceTokens,
  particleSenseFirstTeachContentId,
  type BaseParticleSense,
} from "../forms/particleLicensing";
import {
  isPlainDataRecord,
  ownDataArrayValues,
  ownDataValue,
  strictRuntimeTokenSequence,
  type RuntimeDataRecord,
} from "../validation/runtimeGuards";

const FORM_CONTENT_ID_BY_TOKEN_SOURCE_ID: Readonly<Record<string, string>> = {
  masu: "masu-nonpast",
  masen: "four-polite-tense-cells",
  mashita: "four-polite-tense-cells",
  "masen-deshita": "four-polite-tense-cells",
  te: "base-form-te",
  "te-sequence": "base-construction-sequential-te",
  kudasai: "base-construction-te-kudasai",
  imasu: "base-construction-te-imasu",
  desu: "affirmative-desu",
  "dewa-arimasen": "negative-noun-predicate-copula",
  deshita: "remaining-copula-cells",
  "dewa-arimasen-deshita": "remaining-copula-cells",
  kunai: "i-adjective-tense-polarity",
  katta: "i-adjective-tense-polarity",
  kunakatta: "i-adjective-tense-polarity",
  na: "na-adjective-predicate-and-attributive",
};

function tokenSourceContentIds(
  tokens: readonly AssembledToken[],
): readonly string[] {
  return [
    ...new Set(
      tokens.flatMap(({ id, source }) => {
        const structuralFormIds = [
          ...(id.endsWith("-dictionary") ? ["dictionary-lemma"] : []),
          ...(id.endsWith("-polite-stem") ? ["polite-stems"] : []),
        ];
        if (BASE_LEXEME_BY_ID.has(source.referenceId)) {
          return [source.referenceId, ...structuralFormIds];
        }
        const particleSense = BASE_PARTICLE_SENSES.find(
          ({ id: senseId }) => senseId === source.referenceId,
        );
        if (particleSense) {
          return [
            particleSenseFirstTeachContentId(particleSense.id),
            ...structuralFormIds,
          ];
        }
        const formContentId =
          FORM_CONTENT_ID_BY_TOKEN_SOURCE_ID[source.referenceId];
        return formContentId
          ? [formContentId, ...structuralFormIds]
          : structuralFormIds;
      }),
    ),
  ];
}

function unmappedTokenSourceIds(
  tokens: readonly AssembledToken[],
): readonly string[] {
  return [
    ...new Set(
      tokens.flatMap(({ source }) =>
        BASE_LEXEME_BY_ID.has(source.referenceId) ||
        BASE_PARTICLE_SENSES.some(({ id }) => id === source.referenceId) ||
        FORM_CONTENT_ID_BY_TOKEN_SOURCE_ID[source.referenceId] !== undefined
          ? []
          : [source.referenceId],
      ),
    ),
  ];
}

export type BaseReferenceId =
  | "sentence-anatomy"
  | "particle-atlas"
  | "verb-classes-conjugation"
  | "tense-polarity"
  | "adjective-copula";

export type BaseReferenceLocale = "en" | "it";

export interface BaseReferenceLocalizedCopy {
  readonly label: string;
  readonly explanation: string;
}

export type BaseReferenceCopy = Readonly<
  Record<BaseReferenceLocale, BaseReferenceLocalizedCopy>
>;

export interface BaseReferenceColumn {
  readonly id: string;
  readonly copy: BaseReferenceCopy;
}

export interface BaseReferenceCanonicalCell {
  readonly id: string;
  readonly columnId: string;
  readonly copy: BaseReferenceCopy;
  readonly tokens: readonly AssembledToken[];
  readonly sourceContentIds: readonly string[];
  readonly desuFunction?: DesuFunction;
}

export interface BaseReferenceEntry {
  readonly semanticId: string;
  readonly firstTeachLessonId: string;
  readonly sourceContentIds: readonly string[];
  readonly prerequisiteEntryIds: readonly string[];
  readonly copyId: string;
  readonly copy: BaseReferenceCopy;
  readonly canonicalFormCells: readonly BaseReferenceCanonicalCell[];
  readonly contrastIds: readonly string[];
  readonly exampleIds: readonly string[];
}

export interface BaseReferenceDefinition {
  readonly id: BaseReferenceId;
  readonly firstTeachLessonId: string;
  readonly copyId: string;
  readonly copy: BaseReferenceCopy;
  readonly columns: readonly BaseReferenceColumn[];
  readonly entries: readonly BaseReferenceEntry[];
  readonly cells: readonly BaseReferenceCanonicalCell[];
}

export type BaseReferenceCatalog = readonly BaseReferenceDefinition[];

export interface ReferenceGridModel {
  readonly caption: string;
  readonly columns: readonly { readonly id: string; readonly label: string }[];
  readonly rows: readonly {
    readonly id: string;
    readonly header: string;
    readonly cells: readonly {
      readonly columnId: string;
      readonly label: string;
      readonly value: readonly AssembledToken[];
      readonly sourceContentIds: readonly string[];
      readonly desuFunction?: DesuFunction;
    }[];
  }[];
}

export type BaseReferenceCatalogValidationErrorCode =
  | "invalid-catalog-shape"
  | "invalid-reference-shape"
  | "missing-first-teach-entry"
  | "invalid-entry-shape"
  | "duplicate-reference-id"
  | "duplicate-semantic-id"
  | "unknown-first-teach-lesson"
  | "invalid-prerequisite-reference"
  | "future-prerequisite"
  | "invalid-contrast-reference"
  | "invalid-example-reference"
  | "invalid-example-shape"
  | "invalid-source-reference"
  | "future-source-reference"
  | "invalid-token-sequence"
  | "duplicate-cell-id"
  | "invalid-cell-reference";

export interface BaseReferenceCatalogValidationError {
  readonly code: BaseReferenceCatalogValidationErrorCode;
  readonly referenceId: string;
  readonly semanticId?: string;
  readonly detailId?: string;
}

export interface BaseReferenceCatalogInspection {
  readonly catalog: BaseReferenceCatalog | null;
  readonly examples: readonly BaseReferenceExample[] | null;
  readonly errors: readonly BaseReferenceCatalogValidationError[];
}

function localized(
  enLabel: string,
  enExplanation: string,
  itLabel: string,
  itExplanation: string,
): BaseReferenceCopy {
  return {
    en: { label: enLabel, explanation: enExplanation },
    it: { label: itLabel, explanation: itExplanation },
  };
}

function formValue<T>(
  result: Readonly<{ readonly ok: true; readonly value: T }> | Readonly<{ readonly ok: false }>,
): T {
  if (!result.ok) {
    throw new Error("A canonical Base form required by the reference catalog is unavailable.");
  }
  return result.value;
}

function cell(
  id: string,
  columnId: string,
  enLabel: string,
  itLabel: string,
  tokens: readonly AssembledToken[],
  desuFunction?: DesuFunction,
): BaseReferenceCanonicalCell {
  return {
    id,
    columnId,
    copy: localized(enLabel, enLabel, itLabel, itLabel),
    tokens,
    sourceContentIds: [],
    ...(desuFunction === undefined ? {} : { desuFunction }),
  };
}

function entry(
  semanticId: string,
  ownerContentId: string,
  labels: readonly [string, string],
  explanations: readonly [string, string],
  canonicalFormCells: readonly BaseReferenceCanonicalCell[] = [],
  prerequisiteEntryIds: readonly string[] = [],
  contrastIds: readonly string[] = [],
  exampleIds: readonly string[] = [`reference-example-${semanticId}`],
): BaseReferenceEntry {
  const owner =
    BASE_CONCEPT_BY_ID.get(ownerContentId) ?? BASE_LEXEME_BY_ID.get(ownerContentId);
  if (!owner) {
    throw new Error(`Unknown canonical Base owner: ${ownerContentId}`);
  }
  const sourcedCells = canonicalFormCells.map((canonicalCell) => {
    const tokenContentIds = tokenSourceContentIds(canonicalCell.tokens);
    return {
      ...canonicalCell,
      sourceContentIds: [
        ...new Set([
          ownerContentId,
          ...canonicalCell.sourceContentIds,
          ...tokenContentIds,
        ]),
      ],
    };
  });
  const sourceContentIds = [
    ...new Set([
      ownerContentId,
      ...sourcedCells.flatMap((canonicalCell) => canonicalCell.sourceContentIds),
    ]),
  ];
  return {
    semanticId,
    firstTeachLessonId: owner.firstTeachLessonId,
    sourceContentIds,
    prerequisiteEntryIds,
    copyId: `${semanticId}-copy`,
    copy: localized(labels[0], explanations[0], labels[1], explanations[1]),
    canonicalFormCells: sourcedCells,
    contrastIds,
    exampleIds,
  };
}

function column(
  id: string,
  enLabel: string,
  itLabel: string,
): BaseReferenceColumn {
  return {
    id,
    copy: localized(enLabel, enLabel, itLabel, itLabel),
  };
}

function reference(
  id: BaseReferenceId,
  firstTeachLessonId: string,
  labels: readonly [string, string],
  explanations: readonly [string, string],
  columns: readonly BaseReferenceColumn[],
  entries: readonly BaseReferenceEntry[],
): BaseReferenceDefinition {
  return {
    id,
    firstTeachLessonId,
    copyId: `base-reference-${id}-copy`,
    copy: localized(labels[0], explanations[0], labels[1], explanations[1]),
    columns,
    entries,
    cells: entries.flatMap(({ canonicalFormCells }) => canonicalFormCells),
  };
}

const FORM_COLUMN = column("form", "Form", "Forma");
const STEM_COLUMN = column("stem", "Polite stem", "Tema cortese");
const AFFIRMATIVE_COLUMN = column("affirmative", "Affirmative", "Affermativa");
const NEGATIVE_COLUMN = column("negative", "Negative", "Negativa");
const PAST_AFFIRMATIVE_COLUMN = column(
  "pastAffirmative",
  "Past affirmative",
  "Passata affermativa",
);
const PAST_NEGATIVE_COLUMN = column(
  "pastNegative",
  "Past negative",
  "Passata negativa",
);
const ATTRIBUTIVE_COLUMN = column("attributive", "Before a noun", "Prima di un nome");
const POLITE_COLUMNS = [
  AFFIRMATIVE_COLUMN,
  NEGATIVE_COLUMN,
  PAST_AFFIRMATIVE_COLUMN,
  PAST_NEGATIVE_COLUMN,
] as const;

const KAKU_DICTIONARY = formValue(realizeVerbDictionary("verb-kaku"));
const TABERU_DICTIONARY = formValue(realizeVerbDictionary("verb-taberu"));
const SURU_DICTIONARY = formValue(realizeVerbDictionary("verb-suru"));
const KURU_DICTIONARY = formValue(realizeVerbDictionary("verb-kuru"));
const KAKU_POLITE_STEM = formValue(realizePoliteStem("verb-kaku"));
const SURU_POLITE_STEM = formValue(realizePoliteStem("verb-suru"));
const KURU_POLITE_STEM = formValue(realizePoliteStem("verb-kuru"));
const KAKU_POLITE_GRID = formValue(realizePoliteGrid("verb-kaku"));
const IKU_TE_FORM = formValue(realizeTeConstruction("verb-iku", "te"));
const KAKU_TE_FORM = formValue(realizeTeConstruction("verb-kaku", "te"));
const TABERU_TE_SEQUENCE = formValue(
  realizeTeConstruction("verb-taberu", "sequence"),
);
const TABERU_TE_IMASU = formValue(realizeTeConstruction("verb-taberu", "te-imasu"));
const NOUN_GRID = formValue(realizeOwnedNounPredicate("noun-gakusei"));
const TEACHER_NOUN_GRID = formValue(realizeOwnedNounPredicate("noun-sensei"));
const I_ADJECTIVE_GRID = formValue(realizeIAdjectivePredicate("adjective-takai"));
const NA_ADJECTIVE_GRID = formValue(
  realizeNaAdjectivePredicate("adjective-shizuka"),
);
const NA_ADJECTIVE_ATTRIBUTIVE = formValue(
  realizeNaAdjectiveAttributive("adjective-shizuka"),
);

function predicateCell(
  id: string,
  columnId: string,
  enLabel: string,
  itLabel: string,
  predicateCell: Readonly<{ readonly tokens: readonly AssembledToken[]; readonly desuFunction: DesuFunction }>,
): BaseReferenceCanonicalCell {
  return cell(id, columnId, enLabel, itLabel, predicateCell.tokens, predicateCell.desuFunction);
}

function politeCells(
  prefix: string,
  grid: typeof KAKU_POLITE_GRID,
): readonly BaseReferenceCanonicalCell[] {
  return [
    cell(
      `${prefix}-affirmative`,
      "affirmative",
      "Affirmative",
      "Affermativa",
      grid.affirmative,
    ),
    cell(
      `${prefix}-negative`,
      "negative",
      "Negative",
      "Negativa",
      grid.negative,
    ),
    cell(
      `${prefix}-past-affirmative`,
      "pastAffirmative",
      "Past affirmative",
      "Passata affermativa",
      grid.pastAffirmative,
    ),
    cell(
      `${prefix}-past-negative`,
      "pastNegative",
      "Past negative",
      "Passata negativa",
      grid.pastNegative,
    ),
  ];
}

const KAKU_POLITE_CELLS = politeCells("tense-kaku", KAKU_POLITE_GRID).map(
  (canonicalCell, index) => ({
    ...canonicalCell,
    id: [
      "verb-polite-nonpast-affirmative",
      "verb-polite-nonpast-negative",
      "verb-polite-past-affirmative",
      "verb-polite-past-negative",
    ][index],
  }),
);
const STUDENT_NOUN = NOUN_GRID.affirmative.tokens.slice(0, 1);
const TEACHER_NOUN = TEACHER_NOUN_GRID.affirmative.tokens.slice(0, 1);
const SAKURA_NAME_LEXEME = BASE_LEXEME_BY_ID.get("name-sakura");
if (!SAKURA_NAME_LEXEME) {
  throw new Error("Missing canonical bare Sakura name.");
}
const SAKURA_NAME: readonly AssembledToken[] = [
  {
    id: "reference-name-sakura",
    jp: SAKURA_NAME_LEXEME.kana,
    romaji: SAKURA_NAME_LEXEME.romaji,
    kind: "lexical",
    boundaryBefore: "attach",
    source: { domain: "catalog", referenceId: SAKURA_NAME_LEXEME.id },
  },
];

function composedTokens(
  parts: readonly {
    readonly tokens: readonly AssembledToken[];
    readonly boundaryBefore?: "attach" | "space";
  }[],
): readonly AssembledToken[] {
  return formValue(composeBaseTokenSequences(parts));
}

const STUDENT_TOPIC = composedTokens([
  { tokens: STUDENT_NOUN },
  { tokens: baseParticleSurfaceTokens("topic-wa"), boundaryBefore: "space" },
]);
const TEACHER_SUBJECT = composedTokens([
  { tokens: TEACHER_NOUN },
  {
    tokens: baseParticleSurfaceTokens("focus-subject-ga"),
    boundaryBefore: "space",
  },
]);
const NAME_TITLE_MODIFIER = composedTokens([
  { tokens: SAKURA_NAME },
  { tokens: TEACHER_NOUN, boundaryBefore: "space" },
]);
const STANDALONE_DESU = formValue(
  isolateBaseTokenSequence(NOUN_GRID.affirmative.tokens.slice(1)),
);

const SENTENCE_ANATOMY_ENTRIES = [
  entry(
    "base-sentence-chunks",
    "sentence-chunks",
    ["Sentence chunks", "Blocchi della frase"],
    [
      "Build a sentence from meaningful chunks.",
      "Costruisci una frase con blocchi significativi.",
    ],
    [
      cell(
        "sentence-chunks-noun",
        "canonical-target",
        "Canonical noun",
        "Nome canonico",
        STUDENT_NOUN,
      ),
    ],
  ),
  entry(
    "base-sentence-predicate-types",
    "affirmative-desu",
    ["Nominal predicate", "Predicato nominale"],
    [
      "A noun predicate identifies a person or thing.",
      "Un predicato nominale identifica una persona o una cosa.",
    ],
    [
      predicateCell(
        "sentence-predicate-nominal",
        "canonical-target",
        "Noun predicate",
        "Predicato nominale",
        NOUN_GRID.affirmative,
      ),
    ],
    ["base-sentence-chunks"],
  ),
  entry(
    "base-sentence-endings",
    "affirmative-desu",
    ["Sentence endings", "Finali di frase"],
    [
      "An ending completes the predicate.",
      "Un finale completa il predicato.",
    ],
    [
      cell(
        "sentence-ending-desu",
        "canonical-target",
        "Polite ending",
        "Finale cortese",
        STANDALONE_DESU,
        NOUN_GRID.affirmative.desuFunction,
      ),
    ],
    ["base-sentence-predicate-types"],
  ),
  entry(
    "base-sentence-topic-subject-status",
    "focus-subject-ga",
    ["Topic and subject status", "Stato di tema e soggetto"],
    [
      "Topic and focused subject are distinct discourse roles.",
      "Tema e soggetto focalizzato sono ruoli discorsivi distinti.",
    ],
    [
      cell(
        "sentence-topic-target",
        "topic",
        "Topic chunk",
        "Blocco del tema",
        STUDENT_TOPIC,
      ),
      cell(
        "sentence-subject-target",
        "focusedSubject",
        "Focused-subject chunk",
        "Blocco del soggetto focalizzato",
        TEACHER_SUBJECT,
      ),
    ],
    ["base-sentence-chunks"],
  ),
  entry(
    "base-sentence-modifier-order",
    "modifier-before-noun",
    ["Modifier order", "Ordine dei modificatori"],
    [
      "Modifiers come before the noun they describe.",
      "I modificatori precedono il nome che descrivono.",
    ],
    [
      cell(
        "sentence-modifier-order-target",
        "canonical-target",
        "Modifier before noun",
        "Modificatore prima del nome",
        NAME_TITLE_MODIFIER,
      ),
    ],
    ["base-sentence-chunks"],
  ),
  entry(
    "base-sentence-predicate-type-verbal",
    "masu-nonpast",
    ["Verbal predicate", "Predicato verbale"],
    [
      "A verbal predicate expresses an action with its owned polite form.",
      "Un predicato verbale esprime un'azione con la forma cortese disponibile.",
    ],
    [
      cell(
        "sentence-predicate-verbal",
        "canonical-target",
        "Verbal predicate",
        "Predicato verbale",
        KAKU_POLITE_GRID.affirmative,
      ),
    ],
    ["base-sentence-predicate-types"],
  ),
  entry(
    "base-sentence-predicate-type-adjectival",
    "i-adjective-tense-polarity",
    ["Adjectival predicate", "Predicato aggettivale"],
    [
      "An adjectival predicate describes with its owned inflection.",
      "Un predicato aggettivale descrive con la flessione disponibile.",
    ],
    [
      predicateCell(
        "sentence-predicate-adjectival",
        "canonical-target",
        "Adjectival predicate",
        "Predicato aggettivale",
        I_ADJECTIVE_GRID.affirmative,
      ),
    ],
    ["base-sentence-predicate-types"],
  ),
] as const;

function particleEntry(
  sense: BaseParticleSense,
  labels: readonly [string, string],
  explanations: readonly [string, string],
  prerequisiteEntryIds: readonly string[] = ["base-particle-wa"],
  contrastIds: readonly string[] = [],
): BaseReferenceEntry {
  const definition = BASE_PARTICLE_SENSES.find(({ id }) => id === sense);
  if (!definition) throw new Error(`Unknown canonical particle sense: ${sense}`);
  const semanticId =
    sense === "topic-wa"
      ? "base-particle-wa"
      : sense === "focus-subject-ga"
        ? "base-particle-ga"
        : sense === "existence-location-ni"
          ? "base-particle-existence-ni"
          : sense === "existential-subject-ga"
            ? "base-particle-existential-ga"
            : `base-particle-${sense}`;
  return entry(
    semanticId,
    particleSenseFirstTeachContentId(sense),
    labels,
    explanations,
    [
      cell(
        `${semanticId}-form`,
        "form",
        labels[0],
        labels[1],
        baseParticleSurfaceTokens(sense),
      ),
    ],
    prerequisiteEntryIds,
    contrastIds,
  );
}

const PARTICLE_ATLAS_ENTRIES = [
  particleEntry("topic-wa", ["Topic", "Tema"], ["Marks the sentence topic.", "Segna il tema della frase."], []),
  particleEntry("focus-subject-ga", ["Focused subject", "Soggetto focalizzato"], ["Marks a focused subject.", "Segna un soggetto focalizzato."], ["base-particle-wa"], ["base-particle-wa"]),
  particleEntry("possessive-attributive-no", ["Possessive and attribute", "Possesso e attributo"], ["Links a possessor or attribute.", "Collega un possessore o attributo."]),
  particleEntry("additive-mo", ["Addition", "Aggiunta"], ["Adds an also/too relation.", "Aggiunge una relazione di inclusione."]),
  particleEntry("listing-to", ["Listing", "Elenco"], ["Links items in a noun list.", "Collega elementi in un elenco di nomi."]),
  particleEntry("nominal-to", ["Nominal link", "Collegamento nominale"], ["Links nominal elements.", "Collega elementi nominali."], ["base-particle-listing-to"], ["base-particle-listing-to"]),
  particleEntry("companion-to", ["Companion", "Compagnia"], ["Marks a companion.", "Segna una persona in compagnia."], ["base-particle-listing-to"], ["base-particle-listing-to"]),
  particleEntry("question-ka", ["Question", "Domanda"], ["Marks a question.", "Segna una domanda."]),
  particleEntry("interactional-ne", ["Shared confirmation", "Conferma condivisa"], ["Invites or acknowledges shared agreement.", "Invita o riconosce un accordo condiviso."], ["base-particle-question-ka"], ["base-particle-interactional-yo"]),
  particleEntry("interactional-yo", ["Assertive update", "Informazione assertiva"], ["Presents information as an update for the listener.", "Presenta un'informazione nuova per l'interlocutore."], ["base-particle-question-ka"], ["base-particle-interactional-ne"]),
  particleEntry("object-o", ["Direct object", "Oggetto diretto"], ["Marks a licensed direct object.", "Segna un oggetto diretto consentito."]),
  particleEntry("goal-ni", ["Goal", "Meta"], ["Marks a movement goal.", "Segna una meta di movimento."]),
  particleEntry("direction-he", ["Direction", "Direzione"], ["Marks a direction.", "Segna una direzione."], ["base-particle-goal-ni"], ["base-particle-goal-ni"]),
  particleEntry("action-place-de", ["Action place", "Luogo d'azione"], ["Marks where an action happens.", "Segna dove avviene un'azione."]),
  particleEntry("means-de", ["Means", "Mezzo"], ["Marks a means or instrument.", "Segna un mezzo o strumento."], ["base-particle-action-place-de"], ["base-particle-action-place-de"]),
  particleEntry("time-ni", ["Specific time", "Momento specifico"], ["Marks a specific time.", "Segna un momento specifico."]),
  particleEntry("source-kara", ["Source", "Origine"], ["Marks a starting point.", "Segna un punto di partenza."]),
  particleEntry("limit-made", ["Limit", "Limite"], ["Marks an endpoint.", "Segna un punto finale."], ["base-particle-source-kara"], ["base-particle-source-kara"]),
  particleEntry("existence-location-ni", ["Existence location", "Luogo d'esistenza"], ["Marks where something exists.", "Segna dove qualcosa esiste."]),
  particleEntry("existential-subject-ga", ["Existential subject", "Soggetto esistenziale"], ["Marks what exists.", "Segna ciò che esiste."], ["base-particle-existence-ni"], ["base-particle-ga"]),
] as const;

const VERB_ENTRIES = [
  entry(
    "base-verb-dictionary-form",
    "verb-kaku",
    ["Dictionary form", "Forma dizionario"],
    [
      "The dictionary form identifies the verb.",
      "La forma dizionario identifica il verbo.",
    ],
    [cell("verb-dictionary-kaku", "form", "Godan", "Godan", KAKU_DICTIONARY)],
  ),
  entry(
    "base-verb-class-godan",
    "godan-verb-class",
    ["Godan verbs", "Verbi godan"],
    [
      "Godan endings change by row.",
      "Le terminazioni godan cambiano per riga.",
    ],
    [cell("verb-class-godan", "form", "Dictionary", "Dizionario", KAKU_DICTIONARY)],
    ["base-verb-dictionary-form"],
  ),
  entry(
    "base-verb-class-ichidan",
    "ichidan-verb-class",
    ["Ichidan verbs", "Verbi ichidan"],
    [
      "Ichidan verbs use a stable stem.",
      "I verbi ichidan usano un tema stabile.",
    ],
    [
      cell(
        "verb-class-ichidan",
        "form",
        "Dictionary",
        "Dizionario",
        TABERU_DICTIONARY,
      ),
    ],
    ["base-verb-dictionary-form"],
    ["base-verb-class-godan"],
  ),
  entry(
    "base-verb-class-suru",
    "suru-verb-class",
    ["する class", "Classe する"],
    ["The する class has an explicit stem.", "La classe する ha un tema esplicito."],
    [
      cell("verb-class-suru", "form", "Dictionary", "Dizionario", SURU_DICTIONARY),
    ],
    ["base-verb-dictionary-form"],
  ),
  entry(
    "base-verb-class-kuru",
    "kuru-verb-class",
    ["くる class", "Classe くる"],
    ["The くる class has an explicit stem.", "La classe くる ha un tema esplicito."],
    [
      cell("verb-class-kuru", "form", "Dictionary", "Dizionario", KURU_DICTIONARY),
    ],
    ["base-verb-dictionary-form"],
    ["base-verb-class-suru"],
  ),
  entry(
    "base-verb-polite-stems",
    "polite-stems",
    ["Polite stems", "Temi cortesi"],
    [
      "Polite forms are built from the canonical stem.",
      "Le forme cortesi derivano dal tema canonico.",
    ],
    [cell("verb-polite-stem-kaku", "form", "Polite stem", "Tema cortese", KAKU_POLITE_STEM)],
    ["base-verb-class-godan"],
  ),
  entry(
    "base-verb-polite-stem-suru",
    "polite-stems",
    ["する polite stem", "Tema cortese di する"],
    [
      "The explicit する polite stem is し.",
      "Il tema cortese esplicito di する è し.",
    ],
    [cell("verb-stem-suru", "stem", "Polite stem", "Tema cortese", SURU_POLITE_STEM)],
    ["base-verb-class-suru"],
  ),
  entry(
    "base-verb-polite-stem-kuru",
    "polite-stems",
    ["くる polite stem", "Tema cortese di くる"],
    [
      "The explicit くる polite stem is き.",
      "Il tema cortese esplicito di くる è き.",
    ],
    [cell("verb-stem-kuru", "stem", "Polite stem", "Tema cortese", KURU_POLITE_STEM)],
    ["base-verb-class-kuru"],
  ),
  entry(
    "base-verb-polite-forms",
    "masu-nonpast",
    ["Polite forms", "Forme cortesi"],
    [
      "Polite endings attach to the stem.",
      "Le terminazioni cortesi si uniscono al tema.",
    ],
    [KAKU_POLITE_CELLS[0]],
    ["base-verb-polite-stems"],
  ),
  entry(
    "base-verb-polite-tense-forms",
    "four-polite-tense-cells",
    ["Polite tense forms", "Forme cortesi di tempo"],
    [
      "Negative and past polite forms become available with tense and polarity.",
      "Le forme cortesi negative e passate diventano disponibili con tempo e polarità.",
    ],
    KAKU_POLITE_CELLS.slice(1),
    ["base-verb-polite-forms"],
  ),
  entry(
    "base-verb-exceptions",
    "base-form-te",
    ["Explicit exceptions", "Eccezioni esplicite"],
    [
      "Stored exceptions override the regular class path.",
      "Le eccezioni registrate sostituiscono il percorso regolare.",
    ],
    [cell("verb-exception-iku", "form", "Exception", "Eccezione", IKU_TE_FORM)],
    ["base-verb-class-godan"],
  ),
  entry(
    "base-verb-te-forms",
    "base-form-te",
    ["Practical て forms", "Forme in て pratiche"],
    [
      "Use the licensed canonical form for connection.",
      "Usa la forma canonica consentita per collegare.",
    ],
    [cell("verb-te-kaku", "form", "て form", "Forma in て", KAKU_TE_FORM)],
    ["base-verb-class-godan"],
  ),
  entry(
    "base-verb-sequential-te",
    "base-construction-sequential-te",
    ["Sequential て form", "Forma sequenziale in て"],
    [
      "The sequential construction links two short events.",
      "La costruzione sequenziale collega due eventi brevi.",
    ],
    [
      cell(
        "verb-sequential-te-taberu",
        "form",
        "Sequential form",
        "Forma sequenziale",
        TABERU_TE_SEQUENCE,
      ),
    ],
    ["base-verb-te-forms"],
  ),
  entry(
    "base-verb-te-imasu",
    "base-construction-te-imasu",
    ["Progressive/state construction", "Costruzione progressiva/di stato"],
    [
      "This is the Base ongoing or resulting-state construction.",
      "Questa è la costruzione Base per azione in corso o stato risultante.",
    ],
    [cell("verb-te-imasu-taberu", "form", "Construction", "Costruzione", TABERU_TE_IMASU)],
    ["base-verb-sequential-te"],
    ["base-tense-dynamic-nonpast"],
  ),
] as const;

const TENSE_ENTRIES = [
  entry(
    "base-tense-dynamic-nonpast",
    "dynamic-nonpast-semantics",
    ["Dynamic nonpast", "Non-passato dinamico"],
    [
      "Dynamic nonpast expresses a habit or future event, not an action in progress now.",
      "Il non-passato dinamico esprime abitudine o futuro, non un'azione in corso adesso.",
    ],
    [KAKU_POLITE_CELLS[0]],
    [],
    ["base-verb-te-imasu"],
  ),
  entry(
    "base-tense-polite-grid",
    "four-polite-tense-cells",
    ["Four polite forms", "Quattro forme cortesi"],
    [
      "Compare nonpast and past across affirmative and negative polarity.",
      "Confronta non-passato e passato nelle polarità affermativa e negativa.",
    ],
    KAKU_POLITE_CELLS.slice(1),
    ["base-tense-dynamic-nonpast"],
  ),
] as const;

const ADJECTIVE_ENTRIES = [
  entry(
    "base-copula-reviewed-affirmative",
    "negative-noun-predicate-copula",
    ["Reviewed affirmative copula", "Copula affermativa ripassata"],
    [
      "Review the affirmative noun predicate.",
      "Ripassa il predicato nominale affermativo.",
    ],
    [
      predicateCell(
        "noun-predicate-affirmative",
        "affirmative",
        "Affirmative",
        "Affermativa",
        NOUN_GRID.affirmative,
      ),
      predicateCell(
        "noun-predicate-negative",
        "negative",
        "Negative",
        "Negativa",
        NOUN_GRID.negative,
      ),
    ],
  ),
  entry(
    "base-copula-noun-predicate-grid",
    "remaining-copula-cells",
    ["Noun-predicate copula", "Copula del predicato nominale"],
    [
      "Complete the remaining polite noun-predicate cells.",
      "Completa le restanti celle cortesi del predicato nominale.",
    ],
    [
      predicateCell(
        "noun-predicate-past-affirmative",
        "pastAffirmative",
        "Past affirmative",
        "Passata affermativa",
        NOUN_GRID.pastAffirmative,
      ),
      predicateCell(
        "noun-predicate-past-negative",
        "pastNegative",
        "Past negative",
        "Passata negativa",
        NOUN_GRID.pastNegative,
      ),
    ],
    ["base-copula-reviewed-affirmative"],
  ),
  entry(
    "base-adjective-i-grid",
    "i-adjective-tense-polarity",
    ["い-adjective grid", "Griglia degli aggettivi in い"],
    [
      "The adjective self-conjugates; the polite marker never becomes the plain copula.",
      "L'aggettivo si coniuga da sé; il marcatore cortese non diventa mai copula piana.",
    ],
    [
      predicateCell("i-adjective-affirmative", "affirmative", "Affirmative", "Affermativa", I_ADJECTIVE_GRID.affirmative),
      predicateCell("i-adjective-negative", "negative", "Negative", "Negativa", I_ADJECTIVE_GRID.negative),
      predicateCell("i-adjective-past-affirmative", "pastAffirmative", "Past affirmative", "Passata affermativa", I_ADJECTIVE_GRID.pastAffirmative),
      predicateCell("i-adjective-past-negative", "pastNegative", "Past negative", "Passata negativa", I_ADJECTIVE_GRID.pastNegative),
    ],
    ["base-copula-noun-predicate-grid"],
  ),
  entry(
    "base-adjective-na-grid",
    "na-adjective-predicate-and-attributive",
    ["な-adjective grid", "Griglia degli aggettivi in な"],
    [
      "Predicate forms use the nominal/copular path; attributive use takes な.",
      "Le forme predicative seguono il percorso nominale/copulare; l'uso attributivo prende な.",
    ],
    [
      predicateCell("na-adjective-affirmative", "affirmative", "Affirmative", "Affermativa", NA_ADJECTIVE_GRID.affirmative),
      predicateCell("na-adjective-negative", "negative", "Negative", "Negativa", NA_ADJECTIVE_GRID.negative),
      predicateCell("na-adjective-past-affirmative", "pastAffirmative", "Past affirmative", "Passata affermativa", NA_ADJECTIVE_GRID.pastAffirmative),
      predicateCell("na-adjective-past-negative", "pastNegative", "Past negative", "Passata negativa", NA_ADJECTIVE_GRID.pastNegative),
      cell("na-adjective-attributive", "attributive", "Before a noun", "Prima di un nome", NA_ADJECTIVE_ATTRIBUTIVE),
    ],
    ["base-adjective-i-grid"],
    ["base-adjective-i-grid"],
  ),
] as const;

export const BASE_REFERENCE_IDS: readonly BaseReferenceId[] = deepFreeze([
  "sentence-anatomy",
  "particle-atlas",
  "verb-classes-conjugation",
  "tense-polarity",
  "adjective-copula",
]);

export const BASE_REFERENCE_CATALOG: BaseReferenceCatalog = deepFreeze([
  reference(
    "sentence-anatomy",
    "sentence-foundations-1",
    ["Sentence anatomy", "Anatomia della frase"],
    [
      "See how a Base sentence is assembled progressively.",
      "Osserva come una frase Base viene costruita progressivamente.",
    ],
    [
      column("canonical-target", "Canonical target", "Obiettivo canonico"),
      column("topic", "Topic", "Tema"),
      column("focusedSubject", "Focused subject", "Soggetto focalizzato"),
    ],
    SENTENCE_ANATOMY_ENTRIES,
  ),
  reference(
    "particle-atlas",
    "topic-questions-1",
    ["Particle atlas", "Atlante delle particelle"],
    [
      "See each particle sense only after its lesson introduces it.",
      "Vedi ogni senso della particella solo dopo la lezione che lo introduce.",
    ],
    [FORM_COLUMN],
    PARTICLE_ATLAS_ENTRIES,
  ),
  reference(
    "verb-classes-conjugation",
    "polite-verbs-1",
    ["Verb classes and conjugation", "Classi verbali e coniugazione"],
    [
      "Recognize the class before reading its generated forms.",
      "Riconosci la classe prima di leggere le forme generate.",
    ],
    [FORM_COLUMN, STEM_COLUMN, ...POLITE_COLUMNS],
    VERB_ENTRIES,
  ),
  reference(
    "tense-polarity",
    "time-movement-1",
    ["Tense and polarity", "Tempo e polarità"],
    [
      "Compare the four canonical polite writing-verb forms.",
      "Confronta le quattro forme canoniche cortesi del verbo scrivere.",
    ],
    POLITE_COLUMNS,
    TENSE_ENTRIES,
  ),
  reference(
    "adjective-copula",
    "copula-adjectives-1",
    ["Adjectives and copula", "Aggettivi e copula"],
    [
      "Keep adjective inflection distinct from the noun-predicate copula.",
      "Distingui la flessione aggettivale dalla copula del predicato nominale.",
    ],
    [...POLITE_COLUMNS, ATTRIBUTIVE_COLUMN],
    ADJECTIVE_ENTRIES,
  ),
]);

export const referenceById: Readonly<Record<BaseReferenceId, BaseReferenceDefinition>> =
  deepFreeze(
    Object.assign(
      Object.create(null) as Record<BaseReferenceId, BaseReferenceDefinition>,
      ...BASE_REFERENCE_CATALOG.map((definition) => ({
        [definition.id]: definition,
      })),
    ),
  );

export const BASE_REFERENCE_COPY_BY_ID: ReadonlyMap<string, BaseReferenceCopy> =
  immutableReadonlyMap(
    BASE_REFERENCE_CATALOG.flatMap((reference) => [
      [reference.copyId, reference.copy] as const,
      ...reference.entries.map(
        (entry) => [entry.copyId, entry.copy] as const,
      ),
    ]),
  );

export interface BaseReferenceExample {
  readonly id: string;
  readonly firstTeachLessonId: string;
  readonly sourceContentIds: readonly string[];
  readonly tokens: readonly AssembledToken[];
}

/**
 * Canonical reference examples are real token targets with explicit ownership,
 * not reservations for content that may be authored by a later task.
 */
export const BASE_REFERENCE_EXAMPLES: readonly BaseReferenceExample[] =
  deepFreeze(
    BASE_REFERENCE_CATALOG.flatMap((reference) =>
      reference.entries.map((entry) => {
        const canonicalCell = entry.canonicalFormCells[0];
        if (!canonicalCell) {
          throw new Error(`Reference entry "${entry.semanticId}" has no example source.`);
        }
        return {
          id: entry.exampleIds[0]!,
          firstTeachLessonId: entry.firstTeachLessonId,
          sourceContentIds: canonicalCell.sourceContentIds,
          tokens: canonicalCell.tokens,
        };
      }),
    ),
  );

export const BASE_REFERENCE_ELIGIBLE_EXAMPLE_IDS: ReadonlySet<string> =
  immutableReadonlySet(
    BASE_REFERENCE_EXAMPLES.map(({ id }) => id),
  );
const REFERENCE_KEYS = new Set([
  "id",
  "firstTeachLessonId",
  "copyId",
  "copy",
  "columns",
  "entries",
  "cells",
]);
const ENTRY_KEYS = new Set([
  "semanticId",
  "firstTeachLessonId",
  "sourceContentIds",
  "prerequisiteEntryIds",
  "copyId",
  "copy",
  "canonicalFormCells",
  "contrastIds",
  "exampleIds",
]);
const CELL_KEYS = new Set([
  "id",
  "columnId",
  "copy",
  "tokens",
  "sourceContentIds",
]);
const PREDICATE_CELL_KEYS = new Set([
  "id",
  "columnId",
  "copy",
  "tokens",
  "sourceContentIds",
  "desuFunction",
]);
const EXAMPLE_KEYS = new Set([
  "id",
  "firstTeachLessonId",
  "sourceContentIds",
  "tokens",
]);
const COLUMN_KEYS = new Set(["id", "copy"]);
const COPY_KEYS = new Set(["en", "it"]);
const LOCALIZED_COPY_KEYS = new Set(["label", "explanation"]);

function exactRecord(
  value: unknown,
  keys: ReadonlySet<string>,
): RuntimeDataRecord | undefined {
  if (!isPlainDataRecord(value)) return undefined;
  try {
    const names = Object.getOwnPropertyNames(value);
    if (
      names.length !== keys.size ||
      names.some((name) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, name);
        return (
          !keys.has(name) ||
          descriptor === undefined ||
          !("value" in descriptor) ||
          !descriptor.enumerable
        );
      })
    ) {
      return undefined;
    }
    return value;
  } catch {
    return undefined;
  }
}

function stringArray(value: unknown): readonly string[] | undefined {
  const values = ownDataArrayValues(value);
  return values?.every((item) => typeof item === "string")
    ? (values as readonly string[])
    : undefined;
}

function strictCopy(value: unknown): BaseReferenceCopy | undefined {
  const record = exactRecord(value, COPY_KEYS);
  if (!record) return undefined;
  const copies = {} as Record<BaseReferenceLocale, BaseReferenceLocalizedCopy>;
  for (const locale of ["en", "it"] as const) {
    const localizedCopy = exactRecord(
      ownDataValue(record, locale),
      LOCALIZED_COPY_KEYS,
    );
    if (!localizedCopy) return undefined;
    const label = ownDataValue(localizedCopy, "label");
    const explanation = ownDataValue(localizedCopy, "explanation");
    if (
      typeof label !== "string" ||
      label.trim() === "" ||
      typeof explanation !== "string" ||
      explanation.trim() === ""
    ) {
      return undefined;
    }
    copies[locale] = { label, explanation };
  }
  return copies;
}

function strictCell(value: unknown): BaseReferenceCanonicalCell | undefined {
  const record =
    exactRecord(value, CELL_KEYS) ?? exactRecord(value, PREDICATE_CELL_KEYS);
  if (!record) return undefined;
  const id = ownDataValue(record, "id");
  const columnId = ownDataValue(record, "columnId");
  const copy = strictCopy(ownDataValue(record, "copy"));
  const tokens = strictRuntimeTokenSequence(ownDataValue(record, "tokens"));
  const sourceContentIds = stringArray(ownDataValue(record, "sourceContentIds"));
  const desuFunction = ownDataValue(record, "desuFunction");
  if (
    typeof id !== "string" ||
    id.trim() === "" ||
    typeof columnId !== "string" ||
    columnId.trim() === "" ||
    !copy ||
    !tokens ||
    !sourceContentIds ||
    sourceContentIds.length === 0 ||
    (desuFunction !== undefined &&
      desuFunction !== "politeness-marker" &&
      desuFunction !== "copula")
  ) {
    return undefined;
  }
  return {
    id,
    columnId,
    copy,
    tokens,
    sourceContentIds,
    ...(desuFunction === undefined
      ? {}
      : { desuFunction: desuFunction as DesuFunction }),
  };
}

function strictColumn(value: unknown): BaseReferenceColumn | undefined {
  const record = exactRecord(value, COLUMN_KEYS);
  if (!record) return undefined;
  const id = ownDataValue(record, "id");
  const copy = strictCopy(ownDataValue(record, "copy"));
  return typeof id === "string" && id.trim() !== "" && copy
    ? { id, copy }
    : undefined;
}

function strictEntry(value: unknown): BaseReferenceEntry | undefined {
  const record = exactRecord(value, ENTRY_KEYS);
  if (!record) return undefined;
  const semanticId = ownDataValue(record, "semanticId");
  const firstTeachLessonId = ownDataValue(record, "firstTeachLessonId");
  const sourceContentIds = stringArray(ownDataValue(record, "sourceContentIds"));
  const prerequisiteEntryIds = stringArray(
    ownDataValue(record, "prerequisiteEntryIds"),
  );
  const copyId = ownDataValue(record, "copyId");
  const copy = strictCopy(ownDataValue(record, "copy"));
  const rawCells = ownDataArrayValues(ownDataValue(record, "canonicalFormCells"));
  const canonicalFormCells = rawCells?.map(strictCell);
  const contrastIds = stringArray(ownDataValue(record, "contrastIds"));
  const exampleIds = stringArray(ownDataValue(record, "exampleIds"));
  if (
    typeof semanticId !== "string" ||
    semanticId.trim() === "" ||
    typeof firstTeachLessonId !== "string" ||
    !sourceContentIds ||
    sourceContentIds.length === 0 ||
    typeof copyId !== "string" ||
    copyId.trim() === "" ||
    !prerequisiteEntryIds ||
    !copy ||
    !rawCells ||
    !canonicalFormCells ||
    canonicalFormCells.some((item) => !item) ||
    !contrastIds ||
    !exampleIds
  ) {
    return undefined;
  }
  return {
    semanticId,
    firstTeachLessonId,
    sourceContentIds,
    prerequisiteEntryIds,
    copyId,
    copy,
    canonicalFormCells: canonicalFormCells as BaseReferenceCanonicalCell[],
    contrastIds,
    exampleIds,
  };
}

function strictExample(value: unknown): BaseReferenceExample | undefined {
  const record = exactRecord(value, EXAMPLE_KEYS);
  if (!record) return undefined;
  const id = ownDataValue(record, "id");
  const firstTeachLessonId = ownDataValue(record, "firstTeachLessonId");
  const sourceContentIds = stringArray(ownDataValue(record, "sourceContentIds"));
  const tokens = strictRuntimeTokenSequence(ownDataValue(record, "tokens"));
  if (
    typeof id !== "string" ||
    id.trim() === "" ||
    typeof firstTeachLessonId !== "string" ||
    !sourceContentIds ||
    sourceContentIds.length === 0 ||
    !tokens
  ) {
    return undefined;
  }
  return { id, firstTeachLessonId, sourceContentIds, tokens };
}

function canonicalCellFingerprint(
  cell: BaseReferenceCanonicalCell,
): string {
  return JSON.stringify({
    id: cell.id,
    columnId: cell.columnId,
    copy: {
      en: {
        label: cell.copy.en.label,
        explanation: cell.copy.en.explanation,
      },
      it: {
        label: cell.copy.it.label,
        explanation: cell.copy.it.explanation,
      },
    },
    tokens: cell.tokens.map((token) => ({
      id: token.id,
      jp: token.jp,
      romaji: token.romaji,
      kind: token.kind,
      boundaryBefore: token.boundaryBefore,
      source: {
        domain: token.source.domain,
        referenceId: token.source.referenceId,
      },
      reading: token.reading ?? null,
    })),
    sourceContentIds: [...cell.sourceContentIds],
    desuFunction: cell.desuFunction ?? null,
  });
}

function validationError(
  code: BaseReferenceCatalogValidationErrorCode,
  referenceId = "unknown-reference",
  semanticId?: string,
  detailId?: string,
): BaseReferenceCatalogValidationError {
  return {
    code,
    referenceId,
    ...(semanticId === undefined ? {} : { semanticId }),
    ...(detailId === undefined ? {} : { detailId }),
  };
}

function computeBaseReferenceCatalogInspection(
  catalog: unknown,
  eligibleExamples: unknown,
): BaseReferenceCatalogInspection {
  const rawReferences = ownDataArrayValues(catalog);
  if (!rawReferences) {
    return deepFreeze({
      catalog: null,
      examples: null,
      errors: [validationError("invalid-catalog-shape")],
    });
  }

  const errors: BaseReferenceCatalogValidationError[] = [];
  const rawExamples = ownDataArrayValues(eligibleExamples);
  const parsedExamples = rawExamples?.map(strictExample);
  const examplesById = new Map<string, BaseReferenceExample>();
  if (
    !rawExamples ||
    !parsedExamples ||
    parsedExamples.some((example) => !example)
  ) {
    errors.push(validationError("invalid-example-shape"));
  } else {
    for (const example of parsedExamples as BaseReferenceExample[]) {
      if (examplesById.has(example.id)) {
        errors.push(
          validationError(
            "invalid-example-shape",
            "unknown-reference",
            undefined,
            example.id,
          ),
        );
      }
      examplesById.set(example.id, example);
      if (!formatRomaji(example.tokens).ok) {
        errors.push(
          validationError(
            "invalid-token-sequence",
            "unknown-reference",
            undefined,
            example.id,
          ),
        );
      }
    }
  }
  const references: {
    readonly definition: BaseReferenceDefinition;
    readonly id: string;
    readonly firstTeachLessonId: string;
    readonly entries: readonly BaseReferenceEntry[];
    readonly cells: readonly BaseReferenceCanonicalCell[];
    readonly columnIds: ReadonlySet<string>;
  }[] = [];
  const referenceIds = new Set<string>();
  const semanticOwners = new Map<
    string,
    { readonly referenceId: string; readonly entry: BaseReferenceEntry }
  >();

  for (const rawReference of rawReferences) {
    const record = exactRecord(rawReference, REFERENCE_KEYS);
    const rawId = record ? ownDataValue(record, "id") : undefined;
    const referenceId =
      typeof rawId === "string" && rawId.trim() !== "" ? rawId : "unknown-reference";
    if (!record) {
      errors.push(validationError("invalid-reference-shape", referenceId));
      continue;
    }
    const firstTeachLessonId = ownDataValue(record, "firstTeachLessonId");
    const copyId = ownDataValue(record, "copyId");
    const copy = strictCopy(ownDataValue(record, "copy"));
    const rawColumns = ownDataArrayValues(ownDataValue(record, "columns"));
    const columns = rawColumns?.map(strictColumn);
    const rawEntries = ownDataArrayValues(ownDataValue(record, "entries"));
    const parsedEntries = rawEntries?.map(strictEntry);
    const rawCells = ownDataArrayValues(ownDataValue(record, "cells"));
    const parsedCells = rawCells?.map(strictCell);
    if (
      typeof rawId !== "string" ||
      rawId.trim() === "" ||
      typeof firstTeachLessonId !== "string" ||
      typeof copyId !== "string" ||
      copyId.trim() === "" ||
      !copy ||
      !rawColumns ||
      !columns ||
      columns.some((item) => !item) ||
      !rawEntries ||
      !parsedEntries ||
      !rawCells ||
      !parsedCells ||
      parsedCells.some((item) => !item)
    ) {
      errors.push(validationError("invalid-reference-shape", referenceId));
      continue;
    }
    if (referenceIds.has(referenceId)) {
      errors.push(validationError("duplicate-reference-id", referenceId));
    }
    referenceIds.add(referenceId);
    if (!BASE_REFERENCE_COPY_BY_ID.has(copyId as string)) {
      errors.push(validationError("invalid-reference-shape", referenceId));
    }
    if (baseCanonicalPosition(firstTeachLessonId) === null) {
      errors.push(
        validationError(
          "unknown-first-teach-lesson",
          referenceId,
          undefined,
          firstTeachLessonId,
        ),
      );
    }
    const columnIds = new Set(
      (columns as BaseReferenceColumn[]).map(({ id }) => id),
    );
    parsedEntries.forEach((parsedEntry, index) => {
      if (parsedEntry) return;
      const rawEntry = rawEntries[index];
      const semanticId =
        isPlainDataRecord(rawEntry) &&
        typeof ownDataValue(rawEntry, "semanticId") === "string"
          ? (ownDataValue(rawEntry, "semanticId") as string)
          : undefined;
      errors.push(
        validationError("invalid-entry-shape", referenceId, semanticId),
      );
    });
    const entries = parsedEntries.filter(
      (parsedEntry): parsedEntry is BaseReferenceEntry => parsedEntry !== undefined,
    );
    const cells = parsedCells as BaseReferenceCanonicalCell[];
    const definition: BaseReferenceDefinition = {
      id: referenceId as BaseReferenceId,
      firstTeachLessonId,
      copyId: copyId as string,
      copy,
      columns: columns as BaseReferenceColumn[],
      entries,
      cells,
    };
    references.push({
      definition,
      id: referenceId,
      firstTeachLessonId,
      entries,
      cells,
      columnIds,
    });
    if (
      !entries.some(
        (entry) => entry.firstTeachLessonId === firstTeachLessonId,
      )
    ) {
      errors.push(
        validationError("missing-first-teach-entry", referenceId),
      );
    }
    for (const entry of entries) {
      if (!BASE_REFERENCE_COPY_BY_ID.has(entry.copyId)) {
        errors.push(
          validationError("invalid-entry-shape", referenceId, entry.semanticId),
        );
      }
      if (semanticOwners.has(entry.semanticId)) {
        errors.push(
          validationError(
            "duplicate-semantic-id",
            referenceId,
            entry.semanticId,
          ),
        );
      } else {
        semanticOwners.set(entry.semanticId, { referenceId, entry });
      }
      if (baseCanonicalPosition(entry.firstTeachLessonId) === null) {
        errors.push(
          validationError(
            "unknown-first-teach-lesson",
            referenceId,
            entry.semanticId,
            entry.firstTeachLessonId,
          ),
        );
      }
    }
  }

  for (const reference of references) {
    const ownSemanticIds = new Set(
      reference.entries.map(({ semanticId }) => semanticId),
    );
    const expectedCells = reference.entries.flatMap(
      ({ canonicalFormCells }) => canonicalFormCells,
    );
    const seenCellIds = new Map<string, string>();
    for (const entry of reference.entries) {
      const entryPosition = baseCanonicalPosition(entry.firstTeachLessonId);
      let hasOwningSource = false;
      for (const sourceContentId of entry.sourceContentIds) {
        const source =
          BASE_CONCEPT_BY_ID.get(sourceContentId) ??
          BASE_LEXEME_BY_ID.get(sourceContentId);
        const sourcePosition = source
          ? baseCanonicalPosition(source.firstTeachLessonId)
          : null;
        if (!source || sourcePosition === null) {
          errors.push(
            validationError(
              "invalid-source-reference",
              reference.id,
              entry.semanticId,
              sourceContentId,
            ),
          );
        } else if (entryPosition !== null && sourcePosition > entryPosition) {
          errors.push(
            validationError(
              "future-source-reference",
              reference.id,
              entry.semanticId,
              sourceContentId,
            ),
          );
        } else if (sourcePosition === entryPosition) {
          hasOwningSource = true;
        }
      }
      if (!hasOwningSource) {
        errors.push(
          validationError(
            "invalid-source-reference",
            reference.id,
            entry.semanticId,
          ),
        );
      }
      for (const prerequisiteId of entry.prerequisiteEntryIds) {
        const prerequisite = semanticOwners.get(prerequisiteId);
        if (!prerequisite || !ownSemanticIds.has(prerequisiteId)) {
          errors.push(
            validationError(
              "invalid-prerequisite-reference",
              reference.id,
              entry.semanticId,
              prerequisiteId,
            ),
          );
          continue;
        }
        const prerequisitePosition = baseCanonicalPosition(
          prerequisite.entry.firstTeachLessonId,
        );
        if (
          entryPosition !== null &&
          prerequisitePosition !== null &&
          prerequisitePosition > entryPosition
        ) {
          errors.push(
            validationError(
              "future-prerequisite",
              reference.id,
              entry.semanticId,
              prerequisiteId,
            ),
          );
        }
      }
      for (const contrastId of entry.contrastIds) {
        if (!semanticOwners.has(contrastId)) {
          errors.push(
            validationError(
              "invalid-contrast-reference",
              reference.id,
              entry.semanticId,
              contrastId,
            ),
          );
        }
      }
      for (const exampleId of entry.exampleIds) {
        const example = examplesById.get(exampleId);
        const examplePosition = example
          ? baseCanonicalPosition(example.firstTeachLessonId)
          : null;
        if (
          !example ||
          examplePosition === null ||
          entryPosition === null ||
          examplePosition > entryPosition ||
          example.sourceContentIds.some(
            (sourceContentId) => !entry.sourceContentIds.includes(sourceContentId),
          )
        ) {
          errors.push(
            validationError(
              "invalid-example-reference",
              reference.id,
              entry.semanticId,
              exampleId,
            ),
          );
        }
      }
      const seenColumnIds = new Set<string>();
      for (const canonicalCell of entry.canonicalFormCells) {
        if (seenColumnIds.has(canonicalCell.columnId)) {
          errors.push(
            validationError(
              "invalid-cell-reference",
              reference.id,
              entry.semanticId,
              canonicalCell.columnId,
            ),
          );
        }
        seenColumnIds.add(canonicalCell.columnId);
        if (!formatRomaji(canonicalCell.tokens).ok) {
          errors.push(
            validationError(
              "invalid-token-sequence",
              reference.id,
              entry.semanticId,
              canonicalCell.id,
            ),
          );
        }
        for (const unmappedSourceId of unmappedTokenSourceIds(
          canonicalCell.tokens,
        )) {
          errors.push(
            validationError(
              "invalid-source-reference",
              reference.id,
              entry.semanticId,
              unmappedSourceId,
            ),
          );
        }
        for (const tokenContentId of tokenSourceContentIds(
          canonicalCell.tokens,
        )) {
          if (!canonicalCell.sourceContentIds.includes(tokenContentId)) {
            errors.push(
              validationError(
                "invalid-source-reference",
                reference.id,
                entry.semanticId,
                tokenContentId,
              ),
            );
          }
        }
        for (const sourceContentId of canonicalCell.sourceContentIds) {
          const source =
            BASE_CONCEPT_BY_ID.get(sourceContentId) ??
            BASE_LEXEME_BY_ID.get(sourceContentId);
          const sourcePosition = source
            ? baseCanonicalPosition(source.firstTeachLessonId)
            : null;
          if (!source || sourcePosition === null) {
            errors.push(
              validationError(
                "invalid-source-reference",
                reference.id,
                entry.semanticId,
                sourceContentId,
              ),
            );
          } else if (entryPosition !== null && sourcePosition > entryPosition) {
            errors.push(
              validationError(
                "future-source-reference",
                reference.id,
                entry.semanticId,
                sourceContentId,
              ),
            );
          }
        }
        const cellFingerprint = canonicalCellFingerprint(canonicalCell);
        const previousFingerprint = seenCellIds.get(canonicalCell.id);
        if (
          previousFingerprint !== undefined &&
          previousFingerprint !== cellFingerprint
        ) {
          errors.push(
            validationError(
              "duplicate-cell-id",
              reference.id,
              entry.semanticId,
              canonicalCell.id,
            ),
          );
        }
        seenCellIds.set(canonicalCell.id, cellFingerprint);
        if (!reference.columnIds.has(canonicalCell.columnId)) {
          errors.push(
            validationError(
              "invalid-cell-reference",
              reference.id,
              entry.semanticId,
              canonicalCell.columnId,
            ),
          );
        }
      }
    }
    for (const publishedCell of reference.cells) {
      if (!formatRomaji(publishedCell.tokens).ok) {
        errors.push(
          validationError(
            "invalid-token-sequence",
            reference.id,
            undefined,
            publishedCell.id,
          ),
        );
      }
    }
    if (
      reference.cells.length !== expectedCells.length ||
      reference.cells.some((value, index) => {
        const expected = expectedCells[index];
        return (
          expected === undefined ||
          canonicalCellFingerprint(value) !== canonicalCellFingerprint(expected)
        );
      })
    ) {
      errors.push(validationError("invalid-cell-reference", reference.id));
    }
  }
  if (errors.length > 0) {
    return deepFreeze({
      catalog: null,
      examples: null,
      errors,
    });
  }
  return deepFreeze({
    catalog: references.map(({ definition }) => definition),
    examples: parsedExamples as BaseReferenceExample[],
    errors: [],
  });
}

let canonicalInspection: BaseReferenceCatalogInspection | undefined;

export function inspectBaseReferenceCatalog(): BaseReferenceCatalogInspection;
export function inspectBaseReferenceCatalog(
  catalog: unknown,
  eligibleExamples?: unknown,
): BaseReferenceCatalogInspection;
export function inspectBaseReferenceCatalog(
  catalog?: unknown,
  eligibleExamples?: unknown,
): BaseReferenceCatalogInspection {
  const canonicalConvenience = arguments.length === 0;
  const catalogInput = canonicalConvenience
    ? BASE_REFERENCE_CATALOG
    : catalog;
  const examplesInput = canonicalConvenience
    ? BASE_REFERENCE_EXAMPLES
    : arguments.length >= 2
      ? eligibleExamples
      : BASE_REFERENCE_EXAMPLES;
  const canonicalInputs =
    catalogInput === BASE_REFERENCE_CATALOG &&
    examplesInput === BASE_REFERENCE_EXAMPLES;
  if (canonicalInputs && canonicalInspection) {
    return canonicalInspection;
  }
  const inspection = computeBaseReferenceCatalogInspection(
    catalogInput,
    examplesInput,
  );
  if (canonicalInputs) {
    canonicalInspection = inspection;
  }
  return inspection;
}

export function validateBaseReferenceCatalog(
  catalog: unknown,
  eligibleExamples?: unknown,
): readonly BaseReferenceCatalogValidationError[] {
  return arguments.length >= 2
    ? inspectBaseReferenceCatalog(catalog, eligibleExamples).errors
    : inspectBaseReferenceCatalog(catalog).errors;
}
