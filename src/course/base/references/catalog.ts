import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { baseCanonicalPosition } from "../manifest";
import {
  realizeIAdjectivePredicate,
  realizeNaAdjectiveAttributive,
  realizeNaAdjectivePredicate,
  realizeNounPredicate,
} from "../forms/adjectiveForms";
import {
  realizePoliteGrid,
  realizePoliteStem,
  realizeTeConstruction,
  realizeVerbDictionary,
} from "../forms/verbForms";
import {
  isPlainDataRecord,
  ownDataArrayValues,
  ownDataValue,
  strictRuntimeTokenSequence,
  type RuntimeDataRecord,
} from "../validation/runtimeGuards";

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
}

export interface BaseReferenceEntry {
  readonly semanticId: string;
  readonly firstTeachLessonId: string;
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
    }[];
  }[];
}

export type BaseReferenceCatalogValidationErrorCode =
  | "invalid-catalog-shape"
  | "invalid-reference-shape"
  | "invalid-entry-shape"
  | "duplicate-reference-id"
  | "duplicate-semantic-id"
  | "unknown-first-teach-lesson"
  | "invalid-prerequisite-reference"
  | "future-prerequisite"
  | "invalid-contrast-reference"
  | "invalid-example-reference"
  | "duplicate-cell-id"
  | "invalid-cell-reference";

export interface BaseReferenceCatalogValidationError {
  readonly code: BaseReferenceCatalogValidationErrorCode;
  readonly referenceId: string;
  readonly semanticId?: string;
  readonly detailId?: string;
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

function staticParticle(
  id: string,
  jp: string,
  romaji: string,
): readonly AssembledToken[] {
  return deepFreeze([
    {
      id: `${id}-token`,
      jp,
      romaji,
      kind: "particle",
      boundaryBefore: "attach",
      source: { domain: "catalog", referenceId: id },
    },
  ]);
}

function cell(
  id: string,
  columnId: string,
  enLabel: string,
  itLabel: string,
  tokens: readonly AssembledToken[],
): BaseReferenceCanonicalCell {
  return {
    id,
    columnId,
    copy: localized(enLabel, enLabel, itLabel, itLabel),
    tokens,
  };
}

function entry(
  semanticId: string,
  firstTeachLessonId: string,
  labels: readonly [string, string],
  explanations: readonly [string, string],
  canonicalFormCells: readonly BaseReferenceCanonicalCell[] = [],
  prerequisiteEntryIds: readonly string[] = [],
  contrastIds: readonly string[] = [],
  exampleIds: readonly string[] = [],
): BaseReferenceEntry {
  return {
    semanticId,
    firstTeachLessonId,
    prerequisiteEntryIds,
    copyId: `${semanticId}-copy`,
    copy: localized(labels[0], explanations[0], labels[1], explanations[1]),
    canonicalFormCells,
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
const TABERU_TE_IMASU = formValue(realizeTeConstruction("verb-taberu", "te-imasu"));
const NOUN_GRID = formValue(
  realizeNounPredicate({
    id: "base-reference-noun-student",
    kana: "がくせい",
    romaji: "gakusei",
  }),
);
const I_ADJECTIVE_GRID = formValue(realizeIAdjectivePredicate("adjective-takai"));
const NA_ADJECTIVE_GRID = formValue(
  realizeNaAdjectivePredicate("adjective-shizuka"),
);
const NA_ADJECTIVE_ATTRIBUTIVE = formValue(
  realizeNaAdjectiveAttributive("adjective-shizuka"),
);

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

const SENTENCE_ANATOMY_ENTRIES = [
  entry(
    "base-sentence-chunks",
    "sentence-foundations-1",
    ["Sentence chunks", "Blocchi della frase"],
    [
      "Build a sentence from meaningful chunks.",
      "Costruisci una frase con blocchi significativi.",
    ],
  ),
  entry(
    "base-sentence-predicate-types",
    "sentence-foundations-3",
    ["Predicate types", "Tipi di predicato"],
    [
      "A predicate may be nominal, verbal, or adjectival.",
      "Un predicato può essere nominale, verbale o aggettivale.",
    ],
    [],
    ["base-sentence-chunks"],
  ),
  entry(
    "base-sentence-endings",
    "sentence-foundations-3",
    ["Sentence endings", "Finali di frase"],
    [
      "An ending completes the predicate.",
      "Un finale completa il predicato.",
    ],
    [],
    ["base-sentence-predicate-types"],
  ),
  entry(
    "base-sentence-modifier-order",
    "sentence-foundations-4",
    ["Modifier order", "Ordine dei modificatori"],
    [
      "Modifiers come before the noun they describe.",
      "I modificatori precedono il nome che descrivono.",
    ],
    [],
    ["base-sentence-chunks"],
  ),
  entry(
    "base-sentence-topic-subject-status",
    "topic-questions-2",
    ["Topic and subject status", "Stato di tema e soggetto"],
    [
      "Topic and focused subject are distinct discourse roles.",
      "Tema e soggetto focalizzato sono ruoli discorsivi distinti.",
    ],
    [],
    ["base-sentence-chunks"],
  ),
] as const;

function particleEntry(
  semanticId: string,
  firstTeachLessonId: string,
  jp: string,
  romaji: string,
  labels: readonly [string, string],
  explanations: readonly [string, string],
  prerequisiteEntryIds: readonly string[] = ["base-particle-wa"],
  contrastIds: readonly string[] = [],
): BaseReferenceEntry {
  return entry(
    semanticId,
    firstTeachLessonId,
    labels,
    explanations,
    [cell(`${semanticId}-form`, "form", jp, jp, staticParticle(semanticId, jp, romaji))],
    prerequisiteEntryIds,
    contrastIds,
  );
}

const PARTICLE_ATLAS_ENTRIES = [
  particleEntry(
    "base-particle-wa",
    "topic-questions-1",
    "は",
    "wa",
    ["Topic は", "Tema は"],
    ["Marks the sentence topic.", "Segna il tema della frase."],
    [],
  ),
  particleEntry(
    "base-particle-ga",
    "topic-questions-2",
    "が",
    "ga",
    ["Focus/subject が", "Fuoco/soggetto が"],
    ["Marks a focused subject.", "Segna un soggetto focalizzato."],
    ["base-particle-wa"],
    ["base-particle-wa"],
  ),
  particleEntry(
    "base-particle-no-possessive-attributive",
    "topic-questions-3",
    "の",
    "no",
    ["Possessive/attributive の", "の possessivo/attributivo"],
    ["Links a possessor or attribute.", "Collega un possessore o attributo."],
  ),
  particleEntry(
    "base-particle-mo",
    "topic-questions-3",
    "も",
    "mo",
    ["Additive も", "も additivo"],
    ["Adds an also/too relation.", "Aggiunge una relazione di inclusione."],
  ),
  particleEntry(
    "base-particle-to-nominal-listing",
    "topic-questions-3",
    "と",
    "to",
    ["Nominal/listing と", "と nominale/per elenco"],
    ["Links nouns or lists items.", "Collega nomi o elementi di un elenco."],
  ),
  particleEntry(
    "base-particle-to-companion",
    "topic-questions-3",
    "と",
    "to",
    ["Companion と", "と di compagnia"],
    ["Marks a companion.", "Segna una persona in compagnia."],
    ["base-particle-to-nominal-listing"],
    ["base-particle-to-nominal-listing"],
  ),
  particleEntry(
    "base-particle-ka",
    "topic-questions-4",
    "か",
    "ka",
    ["Question か", "Domanda か"],
    ["Marks a question.", "Segna una domanda."],
  ),
  particleEntry(
    "base-particle-o",
    "argument-particles-1",
    "を",
    "o",
    ["Licensed object を", "Oggetto consentito を"],
    ["Marks a licensed direct object.", "Segna un oggetto diretto consentito."],
  ),
  particleEntry(
    "base-particle-ni-goal",
    "argument-particles-2",
    "に",
    "ni",
    ["Goal に", "Meta に"],
    ["Marks a movement goal.", "Segna una meta di movimento."],
  ),
  particleEntry(
    "base-particle-he",
    "argument-particles-2",
    "へ",
    "e",
    ["Direction へ", "Direzione へ"],
    ["Marks a direction.", "Segna una direzione."],
    ["base-particle-ni-goal"],
    ["base-particle-ni-goal"],
  ),
  particleEntry(
    "base-particle-de-action-place",
    "argument-particles-3",
    "で",
    "de",
    ["Action-place で", "Luogo d'azione で"],
    ["Marks where an action happens.", "Segna dove avviene un'azione."],
  ),
  particleEntry(
    "base-particle-de-means",
    "argument-particles-3",
    "で",
    "de",
    ["Means で", "Mezzo で"],
    ["Marks a means or instrument.", "Segna un mezzo o strumento."],
    ["base-particle-de-action-place"],
    ["base-particle-de-action-place"],
  ),
  particleEntry(
    "base-particle-ni-time",
    "time-movement-2",
    "に",
    "ni",
    ["Time に", "Tempo に"],
    ["Marks a specific time.", "Segna un momento specifico."],
  ),
  particleEntry(
    "base-particle-kara",
    "time-movement-2",
    "から",
    "kara",
    ["Source から", "Origine から"],
    ["Marks a starting point.", "Segna un punto di partenza."],
  ),
  particleEntry(
    "base-particle-made",
    "time-movement-2",
    "まで",
    "made",
    ["Limit まで", "Limite まで"],
    ["Marks an endpoint.", "Segna un punto finale."],
    ["base-particle-kara"],
    ["base-particle-kara"],
  ),
  particleEntry(
    "base-particle-existence-ni",
    "existence-location-2",
    "に",
    "ni",
    ["Existence-location に", "Luogo di esistenza に"],
    ["Marks where something exists.", "Segna dove qualcosa esiste."],
  ),
  particleEntry(
    "base-particle-existential-ga",
    "existence-location-2",
    "が",
    "ga",
    ["Existential が", "が esistenziale"],
    ["Marks what exists.", "Segna ciò che esiste."],
    ["base-particle-existence-ni"],
    ["base-particle-ga"],
  ),
] as const;

const VERB_ENTRIES = [
  entry(
    "base-verb-dictionary-form",
    "polite-verbs-1",
    ["Dictionary form", "Forma dizionario"],
    [
      "The dictionary form identifies the verb.",
      "La forma dizionario identifica il verbo.",
    ],
    [cell("verb-dictionary-kaku", "form", "Godan", "Godan", KAKU_DICTIONARY)],
  ),
  entry(
    "base-verb-class-godan",
    "polite-verbs-2",
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
    "polite-verbs-2",
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
    "polite-verbs-3",
    ["する class", "Classe する"],
    ["The する class has an explicit stem.", "La classe する ha un tema esplicito."],
    [
      cell("verb-class-suru", "form", "Dictionary", "Dizionario", SURU_DICTIONARY),
      cell("verb-stem-suru", "form", "Polite stem", "Tema cortese", SURU_POLITE_STEM),
    ],
    ["base-verb-dictionary-form"],
  ),
  entry(
    "base-verb-class-kuru",
    "polite-verbs-3",
    ["くる class", "Classe くる"],
    ["The くる class has an explicit stem.", "La classe くる ha un tema esplicito."],
    [
      cell("verb-class-kuru", "form", "Dictionary", "Dizionario", KURU_DICTIONARY),
      cell("verb-stem-kuru", "form", "Polite stem", "Tema cortese", KURU_POLITE_STEM),
    ],
    ["base-verb-dictionary-form"],
    ["base-verb-class-suru"],
  ),
  entry(
    "base-verb-polite-stems",
    "polite-verbs-3",
    ["Polite stems", "Temi cortesi"],
    [
      "Polite forms are built from the canonical stem.",
      "Le forme cortesi derivano dal tema canonico.",
    ],
    [cell("verb-polite-stem-kaku", "form", "Polite stem", "Tema cortese", KAKU_POLITE_STEM)],
    ["base-verb-class-godan"],
  ),
  entry(
    "base-verb-polite-forms",
    "polite-verbs-4",
    ["Polite forms", "Forme cortesi"],
    [
      "Polite endings attach to the stem.",
      "Le terminazioni cortesi si uniscono al tema.",
    ],
    politeCells("verb-polite-kaku", KAKU_POLITE_GRID),
    ["base-verb-polite-stems"],
  ),
  entry(
    "base-verb-exceptions",
    "time-movement-1",
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
    "requests-connection-1",
    ["Practical て forms", "Forme in て pratiche"],
    [
      "Use the licensed canonical form for connection.",
      "Usa la forma canonica consentita per collegare.",
    ],
    [cell("verb-te-kaku", "form", "て form", "Forma in て", KAKU_TE_FORM)],
    ["base-verb-class-godan"],
  ),
  entry(
    "base-verb-te-imasu",
    "requests-connection-4",
    ["Progressive/state construction", "Costruzione progressiva/di stato"],
    [
      "This is the Base ongoing or resulting-state construction.",
      "Questa è la costruzione Base per azione in corso o stato risultante.",
    ],
    [cell("verb-te-imasu-taberu", "form", "Construction", "Costruzione", TABERU_TE_IMASU)],
    ["base-verb-te-forms"],
  ),
] as const;

const TENSE_ENTRIES = [
  entry(
    "base-tense-dynamic-nonpast",
    "time-movement-1",
    ["Dynamic nonpast", "Non-passato dinamico"],
    [
      "Dynamic nonpast expresses a habit or future event, not an ongoing present.",
      "Il non-passato dinamico esprime abitudine o futuro, non un presente in corso.",
    ],
  ),
  entry(
    "base-tense-polite-grid",
    "time-movement-3",
    ["Four polite forms", "Quattro forme cortesi"],
    [
      "Compare nonpast and past across affirmative and negative polarity.",
      "Confronta non-passato e passato nelle polarità affermativa e negativa.",
    ],
    politeCells("tense-kaku", KAKU_POLITE_GRID),
    ["base-tense-dynamic-nonpast"],
  ),
] as const;

const ADJECTIVE_ENTRIES = [
  entry(
    "base-copula-reviewed-affirmative",
    "copula-adjectives-1",
    ["Reviewed affirmative copula", "Copula affermativa ripassata"],
    [
      "Review the affirmative noun predicate.",
      "Ripassa il predicato nominale affermativo.",
    ],
    [
      cell(
        "noun-predicate-affirmative",
        "affirmative",
        "Affirmative",
        "Affermativa",
        NOUN_GRID.affirmative.tokens,
      ),
    ],
  ),
  entry(
    "base-copula-noun-predicate-grid",
    "copula-adjectives-2",
    ["Noun-predicate copula", "Copula del predicato nominale"],
    [
      "Complete the remaining polite noun-predicate cells.",
      "Completa le restanti celle cortesi del predicato nominale.",
    ],
    [
      cell(
        "noun-predicate-negative",
        "negative",
        "Negative",
        "Negativa",
        NOUN_GRID.negative.tokens,
      ),
      cell(
        "noun-predicate-past-affirmative",
        "pastAffirmative",
        "Past affirmative",
        "Passata affermativa",
        NOUN_GRID.pastAffirmative.tokens,
      ),
      cell(
        "noun-predicate-past-negative",
        "pastNegative",
        "Past negative",
        "Passata negativa",
        NOUN_GRID.pastNegative.tokens,
      ),
    ],
    ["base-copula-reviewed-affirmative"],
  ),
  entry(
    "base-adjective-i-grid",
    "copula-adjectives-3",
    ["い-adjective grid", "Griglia degli aggettivi in い"],
    [
      "The adjective self-conjugates; the polite marker never becomes the plain copula.",
      "L'aggettivo si coniuga da sé; il marcatore cortese non diventa mai copula piana.",
    ],
    [
      cell("i-adjective-affirmative", "affirmative", "Affirmative", "Affermativa", I_ADJECTIVE_GRID.affirmative.tokens),
      cell("i-adjective-negative", "negative", "Negative", "Negativa", I_ADJECTIVE_GRID.negative.tokens),
      cell("i-adjective-past-affirmative", "pastAffirmative", "Past affirmative", "Passata affermativa", I_ADJECTIVE_GRID.pastAffirmative.tokens),
      cell("i-adjective-past-negative", "pastNegative", "Past negative", "Passata negativa", I_ADJECTIVE_GRID.pastNegative.tokens),
    ],
    ["base-copula-noun-predicate-grid"],
  ),
  entry(
    "base-adjective-na-grid",
    "copula-adjectives-4",
    ["な-adjective grid", "Griglia degli aggettivi in な"],
    [
      "Predicate forms use the nominal/copular path; attributive use takes な.",
      "Le forme predicative seguono il percorso nominale/copulare; l'uso attributivo prende な.",
    ],
    [
      cell("na-adjective-affirmative", "affirmative", "Affirmative", "Affermativa", NA_ADJECTIVE_GRID.affirmative.tokens),
      cell("na-adjective-negative", "negative", "Negative", "Negativa", NA_ADJECTIVE_GRID.negative.tokens),
      cell("na-adjective-past-affirmative", "pastAffirmative", "Past affirmative", "Passata affermativa", NA_ADJECTIVE_GRID.pastAffirmative.tokens),
      cell("na-adjective-past-negative", "pastNegative", "Past negative", "Passata negativa", NA_ADJECTIVE_GRID.pastNegative.tokens),
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
    [],
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
    [FORM_COLUMN, ...POLITE_COLUMNS],
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

const BASE_REFERENCE_ELIGIBLE_EXAMPLE_IDS: ReadonlySet<string> = new Set();

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
  "prerequisiteEntryIds",
  "copyId",
  "copy",
  "canonicalFormCells",
  "contrastIds",
  "exampleIds",
]);
const CELL_KEYS = new Set(["id", "columnId", "copy", "tokens"]);
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
  const record = exactRecord(value, CELL_KEYS);
  if (!record) return undefined;
  const id = ownDataValue(record, "id");
  const columnId = ownDataValue(record, "columnId");
  const copy = strictCopy(ownDataValue(record, "copy"));
  const tokens = strictRuntimeTokenSequence(ownDataValue(record, "tokens"));
  if (
    typeof id !== "string" ||
    id.trim() === "" ||
    typeof columnId !== "string" ||
    columnId.trim() === "" ||
    !copy ||
    !tokens
  ) {
    return undefined;
  }
  return { id, columnId, copy, tokens };
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
    prerequisiteEntryIds,
    copyId,
    copy,
    canonicalFormCells: canonicalFormCells as BaseReferenceCanonicalCell[],
    contrastIds,
    exampleIds,
  };
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

export function validateBaseReferenceCatalog(
  catalog: unknown,
  eligibleExampleIds: ReadonlySet<string> = BASE_REFERENCE_ELIGIBLE_EXAMPLE_IDS,
): readonly BaseReferenceCatalogValidationError[] {
  const rawReferences = ownDataArrayValues(catalog);
  if (!rawReferences) {
    return deepFreeze([validationError("invalid-catalog-shape")]);
  }

  const errors: BaseReferenceCatalogValidationError[] = [];
  const references: {
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
      parsedEntries.some((item) => !item) ||
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
    const entries = parsedEntries as BaseReferenceEntry[];
    const cells = parsedCells as BaseReferenceCanonicalCell[];
    references.push({
      id: referenceId,
      firstTeachLessonId,
      entries,
      cells,
      columnIds,
    });
    for (const entry of entries) {
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
    const seenCellIds = new Set<string>();
    for (const entry of reference.entries) {
      const entryPosition = baseCanonicalPosition(entry.firstTeachLessonId);
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
        if (!eligibleExampleIds.has(exampleId)) {
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
      for (const canonicalCell of entry.canonicalFormCells) {
        if (seenCellIds.has(canonicalCell.id)) {
          errors.push(
            validationError(
              "duplicate-cell-id",
              reference.id,
              entry.semanticId,
              canonicalCell.id,
            ),
          );
        }
        seenCellIds.add(canonicalCell.id);
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
    if (
      reference.cells.length !== expectedCells.length ||
      reference.cells.some((value, index) => value.id !== expectedCells[index]?.id)
    ) {
      errors.push(validationError("invalid-cell-reference", reference.id));
    }
  }
  return deepFreeze(errors);
}
