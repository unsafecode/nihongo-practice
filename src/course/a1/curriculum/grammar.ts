import { deepFreeze } from "../../foundations/deepFreeze";
import type { FormSelection } from "../../foundations/types";
import { A1_CONCEPT_IDS } from "../catalog/a1SemanticCatalog";
import type { Bilingual } from "./types";

/** A learner-facing explanation for one realized polite verb form. */
export type A1ExplainedVerbForm = Readonly<
  Pick<FormSelection, "polarity" | "tense" | "formality">
>;

export interface A1LearningNote {
  readonly id: string;
  readonly kind: "grammar" | "phonetic" | "synthesis";
  readonly explainedConceptIds: readonly string[];
  readonly requiredConceptIds: readonly string[];
  /** Explicitly explained forms; validators compare these with `variant.form`. */
  readonly explainedVerbForms?: readonly A1ExplainedVerbForm[];
  readonly title: Bilingual;
  readonly meaning: Bilingual;
  readonly use: Bilingual;
  readonly construction: Bilingual;
  readonly typicalMistake: Bilingual;
  readonly subjectOmissionNote?: Bilingual;
  readonly pattern: readonly Readonly<{
    kind: "slot" | "particle" | "ending" | "punctuation";
    text: string;
    label: Bilingual;
  }>[];
  readonly nearestContrastId?: string;
}

type LearningNoteIndex = Readonly<Record<string, A1LearningNote | undefined>>;

const NOTE_KINDS = new Set<A1LearningNote["kind"]>(["grammar", "phonetic", "synthesis"]);
const PATTERN_TOKEN_KINDS = new Set<A1LearningNote["pattern"][number]["kind"]>([
  "slot",
  "particle",
  "ending",
  "punctuation",
]);

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertBilingual(value: unknown, label: string): asserts value is Bilingual {
  if (value === null || typeof value !== "object") {
    throw new Error(`${label} must be bilingual.`);
  }

  const copy = value as Bilingual;
  assertNonEmptyString(copy.en, `${label}.en`);
  assertNonEmptyString(copy.it, `${label}.it`);
}

function assertUniqueIds(ids: unknown, label: string): asserts ids is readonly string[] {
  if (!Array.isArray(ids)) {
    throw new Error(`${label} ids must be an array.`);
  }

  const seen = new Set<string>();
  for (const id of ids) {
    assertNonEmptyString(id, `${label} id`);
    if (seen.has(id)) {
      throw new Error(`Duplicate ${label} id "${id}".`);
    }
    seen.add(id);
  }
}

function formKey(form: A1ExplainedVerbForm): string {
  return `${form.polarity}:${form.tense}:${form.formality}`;
}

function assertExplainedVerbForms(
  forms: unknown,
): asserts forms is readonly A1ExplainedVerbForm[] {
  if (forms === undefined) return;
  if (!Array.isArray(forms)) {
    throw new Error("Explained verb forms must be an array.");
  }
  const seen = new Set<string>();
  for (const form of forms) {
    if (
      form === null ||
      typeof form !== "object" ||
      !["affirmative", "negative"].includes((form as A1ExplainedVerbForm).polarity) ||
      !["present", "past"].includes((form as A1ExplainedVerbForm).tense) ||
      (form as A1ExplainedVerbForm).formality !== "polite"
    ) {
      throw new Error("Explained verb form must be a polite polarity/tense form.");
    }
    const key = formKey(form as A1ExplainedVerbForm);
    if (seen.has(key)) {
      throw new Error(`Duplicate explained verb form "${key}".`);
    }
    seen.add(key);
  }
}

function assertPattern(
  pattern: unknown,
): asserts pattern is A1LearningNote["pattern"] {
  if (!Array.isArray(pattern) || pattern.length === 0) {
    throw new Error("Pattern must be a non-empty array.");
  }

  for (const token of pattern) {
    if (token === null || typeof token !== "object") {
      throw new Error("Pattern token must be an object.");
    }

    const entry = token as A1LearningNote["pattern"][number];
    if (!PATTERN_TOKEN_KINDS.has(entry.kind)) {
      throw new Error(`Unknown pattern token kind "${String(entry.kind)}".`);
    }
    assertNonEmptyString(entry.text, "Pattern token text");
    assertBilingual(entry.label, "Pattern token label");
  }
}

export function defineA1LearningNote(input: A1LearningNote): A1LearningNote {
  assertNonEmptyString(input.id, "Learning note id");
  if (!NOTE_KINDS.has(input.kind)) {
    throw new Error(`Unknown learning note kind "${String(input.kind)}".`);
  }
  assertUniqueIds(input.explainedConceptIds, "explained concept");
  assertUniqueIds(input.requiredConceptIds, "required concept");
  assertExplainedVerbForms(input.explainedVerbForms);
  assertBilingual(input.title, "Learning note title");
  assertBilingual(input.meaning, "Learning note meaning");
  assertBilingual(input.use, "Learning note use");
  assertBilingual(input.construction, "Learning note construction");
  assertBilingual(input.typicalMistake, "Learning note typical mistake");
  if (input.subjectOmissionNote !== undefined) {
    assertBilingual(input.subjectOmissionNote, "Learning note subject omission note");
  }
  assertPattern(input.pattern);
  if (input.nearestContrastId !== undefined) {
    assertNonEmptyString(input.nearestContrastId, "Learning note nearest contrast id");
  }

  return deepFreeze(input);
}

const token = (
  kind: A1LearningNote["pattern"][number]["kind"],
  text: string,
  en: string,
  it: string,
) => ({ kind, text, label: { en, it } } as const);

export const a1LearningNotes: readonly A1LearningNote[] = deepFreeze([
  defineA1LearningNote({
    id: "a1-note-sounds-mora-vowels",
    kind: "phonetic",
    explainedConceptIds: [],
    requiredConceptIds: [],
    title: { en: "Hear the beat: mora and vowels", it: "Ascolta il ritmo: mora e vocali" },
    meaning: {
      en: "Japanese rhythm counts morae: short sound units. The five vowels are clear and steady.",
      it: "Il ritmo giapponese conta le more: piccole unità sonore. Le cinque vocali sono chiare e regolari.",
    },
    use: {
      en: "Tap one beat for each mora while reading slowly.",
      it: "Batti un colpo per ogni mora mentre leggi lentamente.",
    },
    construction: {
      en: "Read each vowel as one mora: a, i, u, e, o.",
      it: "Leggi ogni vocale come una mora: a, i, u, e, o.",
    },
    typicalMistake: {
      en: "Do not replace Japanese vowel length or rhythm with English spelling habits.",
      it: "Non sostituire la lunghezza vocalica o il ritmo giapponese con abitudini ortografiche inglesi.",
    },
    pattern: [
      token("slot", "あ", "a vowel; one mora", "vocale a; una mora"),
      token("slot", "い", "i vowel; one mora", "vocale i; una mora"),
      token("slot", "う", "u vowel; one mora", "vocale u; una mora"),
      token("slot", "え", "e vowel; one mora", "vocale e; una mora"),
      token("slot", "お", "o vowel; one mora", "vocale o; una mora"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-sounds-gojuon-voicing",
    kind: "phonetic",
    explainedConceptIds: [],
    requiredConceptIds: [],
    title: { en: "Notice voicing in the kana grid", it: "Riconosci la sonorizzazione nella griglia kana" },
    meaning: {
      en: "Dakuten and handakuten marks change a kana's sound, such as か to が and は to ば or ぱ.",
      it: "I segni dakuten e handakuten cambiano il suono di un kana, per esempio か in が e は in ば o ぱ.",
    },
    use: {
      en: "Compare the marked and unmarked kana aloud before learning whole words.",
      it: "Confronta ad alta voce i kana con e senza segno prima di imparare parole intere.",
    },
    construction: {
      en: "A small mark at the upper right changes the consonant, not the vowel.",
      it: "Un piccolo segno in alto a destra cambia la consonante, non la vocale.",
    },
    typicalMistake: {
      en: "Do not ignore the marks: か and が are different sounds and different words.",
      it: "Non ignorare i segni: か e が sono suoni e parole diversi.",
    },
    pattern: [
      token("slot", "か", "unvoiced ka", "ka non sonoro"),
      token("slot", "が", "voiced ga with dakuten", "ga sonoro con dakuten"),
      token("slot", "は", "ha row", "riga ha"),
      token("slot", "ぱ", "pa with handakuten", "pa con handakuten"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-sounds-small-tsu-long-vowels",
    kind: "phonetic",
    explainedConceptIds: [],
    requiredConceptIds: [],
    title: { en: "Count small っ and long vowels", it: "Conta il piccolo っ e le vocali lunghe" },
    meaning: {
      en: "Small っ is a silent mora before a doubled consonant; a long vowel lasts two morae.",
      it: "Il piccolo っ è una mora silenziosa prima di una consonante doppia; una vocale lunga dura due more.",
    },
    use: {
      en: "Pause for っ and hold a long vowel for an extra beat.",
      it: "Fai una pausa per っ e prolunga una vocale lunga per un colpo in più.",
    },
    construction: {
      en: "Hiragana may spell a long vowel with another vowel; katakana often uses ー.",
      it: "In hiragana una vocale lunga può essere scritta con un'altra vocale; in katakana si usa spesso ー.",
    },
    typicalMistake: {
      en: "Do not skip っ or shorten ー: changing the mora count can change the word.",
      it: "Non saltare っ né accorciare ー: cambiare il numero di more può cambiare la parola.",
    },
    pattern: [
      token("slot", "き", "ki mora", "mora ki"),
      token("slot", "っ", "small tsu; silent mora", "piccolo tsu; mora silenziosa"),
      token("slot", "て", "te after a doubled consonant", "te dopo una consonante doppia"),
      token("slot", "コ", "ko mora", "mora ko"),
      token("slot", "ー", "long-vowel mark; one extra mora", "segno di vocale lunga; una mora in più"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-sounds-katakana-bridge",
    kind: "phonetic",
    explainedConceptIds: [],
    requiredConceptIds: [],
    title: { en: "Use katakana as a sound bridge", it: "Usa il katakana come ponte sonoro" },
    meaning: {
      en: "Katakana often writes loanwords, but it follows Japanese mora rhythm rather than the source spelling.",
      it: "Il katakana scrive spesso prestiti linguistici, ma segue il ritmo a more del giapponese e non l'ortografia d'origine.",
    },
    use: {
      en: "Read katakana one mora at a time, then connect it to a familiar international word if helpful.",
      it: "Leggi il katakana una mora alla volta, poi collegalo a una parola internazionale nota se aiuta.",
    },
    construction: {
      en: "Katakana uses the same sound system as hiragana and often uses ー for a long vowel.",
      it: "Il katakana usa lo stesso sistema sonoro dell'hiragana e spesso usa ー per una vocale lunga.",
    },
    typicalMistake: {
      en: "Do not pronounce a loanword as if its English or Italian spelling were written.",
      it: "Non pronunciare un prestito come se fosse scritta la sua ortografia inglese o italiana.",
    },
    pattern: [
      token("slot", "コ", "ko mora", "mora ko"),
      token("slot", "ー", "long vowel; one extra mora", "vocale lunga; una mora in più"),
      token("slot", "ヒ", "hi mora", "mora hi"),
      token("slot", "ー", "long vowel; one extra mora", "vocale lunga; una mora in più"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-sentence-shape-omission",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-topic-wa", "a1-concept-copula-desu"],
    requiredConceptIds: [],
    title: { en: "Put the predicate last", it: "Metti il predicato alla fine" },
    meaning: {
      en: "Japanese normally finishes the clause with its predicate. は sets a topic, です closes a polite identification, and context can supply an unspoken subject or object.",
      it: "Il giapponese normalmente conclude la frase con il predicato. は imposta un tema, です chiude un'identificazione cortese e il contesto può fornire un soggetto o un oggetto non espresso.",
    },
    use: {
      en: "Find the final verb, adjective, or copula first when you listen or build a sentence.",
      it: "Quando ascolti o costruisci una frase, individua prima il verbo, l'aggettivo o la copula finale.",
    },
    construction: {
      en: "Place the topic before は when it is stated, put the other information before the final predicate, and close a polite identification with です.",
      it: "Metti il tema prima di は quando è espresso, metti le altre informazioni prima del predicato finale e chiudi un'identificazione cortese con です.",
    },
    typicalMistake: {
      en: "Do not keep English word order or put the predicate before the information it completes.",
      it: "Non mantenere l'ordine delle parole inglese né mettere il predicato prima delle informazioni che completa.",
    },
    pattern: [
      token("slot", "topic", "topic, if stated", "tema, se espresso"),
      token("slot", "information", "other information", "altre informazioni"),
      token("slot", "predicate", "final predicate", "predicato finale"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-personal-reference",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: [],
    title: { en: "Say the person once, then omit it", it: "Nomina la persona, poi omettila" },
    meaning: {
      en: "Japanese usually leaves out I, you, and other subjects when context is clear.",
      it: "Il giapponese di solito omette io, tu e gli altri soggetti quando il contesto è chiaro.",
    },
    use: {
      en: "Establish yourself with わたし; then prefer a name, title, or omission to あなた. Use あなた only when the person cannot otherwise be clear.",
      it: "Per stabilire chi sei usa わたし; poi preferisci un nome, un titolo o l'omissione a あなた. Usa あなた solo quando la persona non può essere altrimenti chiara.",
    },
    construction: {
      en: "State the person or topic when needed, then give the information and polite copula.",
      it: "Indica la persona o il tema quando serve, poi dai l'informazione e la copula cortese.",
    },
    typicalMistake: {
      en: "Do not repeat わたし or あなた in every sentence.",
      it: "Non ripetere わたし o あなた in ogni frase.",
    },
    subjectOmissionNote: {
      en: "Omit it only when the listener can recover the person from context.",
      it: "Omettila solo quando chi ascolta può ricavare la persona dal contesto.",
    },
    pattern: [
      token("slot", "person", "person/topic", "persona/tema"),
      token("particle", "は", "topic particle", "particella del tema"),
      token("slot", "information", "information", "informazione"),
      token("ending", "です", "polite copula", "copula cortese"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-sentence-chunks",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: ["a1-concept-topic-wa", "a1-concept-copula-desu"],
    title: {
      en: "Build sentences from chunks",
      it: "Costruisci frasi a blocchi",
    },
    meaning: {
      en: "Japanese places the predicate at the end. Keep topic, information, and final predicate as chunks instead of translating one word at a time.",
      it: "Il giapponese mette il predicato alla fine. Tieni tema, informazione e predicato finale come blocchi invece di tradurre una parola alla volta.",
    },
    use: {
      en: "Use chunks to listen for the final predicate and to assemble a short polite sentence.",
      it: "Usa i blocchi per riconoscere il predicato finale e per comporre una breve frase cortese.",
    },
    construction: {
      en: "State a topic when useful, add its information, and finish with the learned polite predicate.",
      it: "Esprimi un tema quando è utile, aggiungi la sua informazione e termina con il predicato cortese imparato.",
    },
    typicalMistake: {
      en: "Do not put the predicate in the middle just to copy English or Italian word order.",
      it: "Non mettere il predicato in mezzo solo per copiare l'ordine delle parole inglese o italiano.",
    },
    pattern: [
      token("slot", "topic", "topic, if stated", "tema, se espresso"),
      token("particle", "は", "topic particle", "particella del tema"),
      token("slot", "information", "identity or other information", "identità o altra informazione"),
      token("ending", "です", "final polite predicate", "predicato cortese finale"),
    ],
    nearestContrastId: "a1-note-topic-wa-copula-desu",
  }),
  defineA1LearningNote({
    id: "a1-note-recoverable-omission",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: ["a1-concept-topic-wa", "a1-concept-copula-desu"],
    title: {
      en: "Omit only what context recovers",
      it: "Ometti solo ciò che il contesto recupera",
    },
    meaning: {
      en: "A topic or subject can be left unsaid when the listener can recover it from the situation or the previous turn.",
      it: "Un tema o soggetto può restare non detto quando chi ascolta lo ricava dalla situazione o dal turno precedente.",
    },
    use: {
      en: "Name the person or topic once, then omit it in a following sentence only when the reference stays clear.",
      it: "Nomina una volta la persona o il tema, poi omettilo nella frase seguente solo quando il riferimento resta chiaro.",
    },
    construction: {
      en: "Use the known context for the omitted topic, then say the information and final predicate.",
      it: "Usa il contesto noto per il tema omesso, poi di' l'informazione e il predicato finale.",
    },
    typicalMistake: {
      en: "Do not omit a person or topic when the listener could reasonably choose the wrong one.",
      it: "Non omettere una persona o un tema quando chi ascolta potrebbe ragionevolmente scegliere quello sbagliato.",
    },
    subjectOmissionNote: {
      en: "Omission is natural only when the intended topic or subject is recoverable from context.",
      it: "L'omissione è naturale solo quando il tema o soggetto previsto è ricavabile dal contesto.",
    },
    pattern: [
      token("slot", "known context", "known topic or subject", "tema o soggetto noto"),
      token("punctuation", "→", "allows omission in the next turn", "permette l'omissione nel turno seguente"),
      token("slot", "information", "information about that known topic", "informazione su quel tema noto"),
      token("ending", "predicate", "final predicate", "predicato finale"),
    ],
    nearestContrastId: "a1-note-personal-reference",
  }),
  defineA1LearningNote({
    id: "a1-note-anata-limited",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: ["a1-concept-topic-wa"],
    title: {
      en: "Treat あなた as limited, not everyday you",
      it: "Tratta あなた come limitato, non come il tu quotidiano",
    },
    meaning: {
      en: "あなた can mean “you”, but it is not the everyday equivalent of English “you”.",
      it: "あなた può significare «tu» o «lei», ma non è l'equivalente quotidiano dell'inglese «you».",
    },
    use: {
      en: "Prefer わたし for yourself, names, titles, or omit the addressee when it is clear; use あなた only when another reference is unavoidable.",
      it: "Preferisci わたし per te stesso, nomi, titoli o ometti l'interlocutore quando è chiaro; usa あなた solo quando un altro riferimento è inevitabile.",
    },
    construction: {
      en: "Choose a name, title, or omission first; if あなた is unavoidable, place it in the ordinary topic or subject position.",
      it: "Scegli prima un nome, un titolo o l'omissione; se あなた è inevitabile, mettilo nella normale posizione di tema o soggetto.",
    },
    typicalMistake: {
      en: "Do not call あなた the everyday equivalent of English “you” or put it into every sentence.",
      it: "Non chiamare あなた l'equivalente quotidiano dell'inglese «you» e non inserirlo in ogni frase.",
    },
    pattern: [
      token("slot", "name／title／omission", "preferred addressee reference", "riferimento preferito all'interlocutore"),
      token("punctuation", "／", "use あなた only when unavoidable", "usa あなた solo quando è inevitabile"),
      token("slot", "information", "information for the addressee", "informazione per l'interlocutore"),
      token("ending", "predicate", "final predicate", "predicato finale"),
    ],
    nearestContrastId: "a1-note-personal-reference",
  }),
  defineA1LearningNote({
    id: "a1-note-identity-dialogue",
    kind: "synthesis",
    explainedConceptIds: [],
    requiredConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
    ],
    title: {
      en: "Combine known identity references in dialogue",
      it: "Combina riferimenti d'identità già noti nel dialogo",
    },
    meaning: {
      en: "This is synthesis, not new grammar: combine known people, identity information, polite predicates, and recoverable omission.",
      it: "Questa è sintesi, non grammatica nuova: combina persone note, informazioni d'identità, predicati cortesi e omissione ricavabile dal contesto.",
    },
    use: {
      en: "Use it to introduce people, then omit a reference only after the listener can recover it.",
      it: "Usalo per presentare persone, poi ometti un riferimento solo quando chi ascolta può ricavarlo.",
    },
    construction: {
      en: "Choose a known topic, keep the predicate final, and use the known polite statement ending.",
      it: "Scegli un tema noto, mantieni finale il predicato e usa la finale affermativa cortese nota.",
    },
    typicalMistake: {
      en: "Do not invent a new identity pattern or repeat a pronoun when the reference is already clear.",
      it: "Non inventare una nuova struttura d'identità né ripetere un pronome quando il riferimento è già chiaro.",
    },
    pattern: [
      token("slot", "known person", "known identity reference", "riferimento d'identità noto"),
      token("particle", "は", "topic particle when a topic is stated", "particella del tema quando il tema è espresso"),
      token("slot", "known identity information", "known identity information", "informazione d'identità nota"),
      token("ending", "です", "known polite statement ending", "finale affermativa cortese nota"),
    ],
    nearestContrastId: "a1-note-synthesis-recombine",
  }),
  defineA1LearningNote({
    id: "a1-note-question-dialogue",
    kind: "synthesis",
    explainedConceptIds: [],
    requiredConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
      "a1-concept-nominative-ga",
      "a1-concept-interrogative-ka",
    ],
    title: {
      en: "Clarify a known item in dialogue",
      it: "Chiarisci un oggetto noto nel dialogo",
    },
    meaning: {
      en: "This is synthesis, not new grammar: combine known this/that words, a focused which one, and polite identity questions.",
      it: "Questa è sintesi, non grammatica nuova: combina parole note per questo/quello, quale in fuoco e domande d'identità cortesi.",
    },
    use: {
      en: "Use it to check an item, identify it, and ask which item fits when a choice is still unclear.",
      it: "Usalo per verificare un oggetto, identificarlo e chiedere quale oggetto va bene quando una scelta non è ancora chiara.",
    },
    construction: {
      en: "Use a known item with は for a statement or question; use どれ with が when the chosen item is the focus.",
      it: "Usa un oggetto noto con は per un'affermazione o una domanda; usa どれ con が quando l'oggetto scelto è in fuoco.",
    },
    typicalMistake: {
      en: "Do not use a literal this-is-which-one pattern when you mean to ask which item is the known thing.",
      it: "Non usare una struttura letterale questo-è-quale quando vuoi chiedere quale oggetto è la cosa nota.",
    },
    pattern: [
      token("slot", "known item", "this, that, or that over there", "questo, quello o quello laggiù"),
      token("particle", "は", "topic particle for the known item", "particella del tema per l'oggetto noto"),
      token("slot", "identity", "known identity information", "informazione d'identità nota"),
      token("ending", "です／か", "polite statement or question ending", "finale cortese per affermazione o domanda"),
      token("punctuation", "／", "or", "oppure"),
      token("slot", "どれ", "which one in focus", "quale in fuoco"),
      token("particle", "が", "focused-subject particle", "particella del soggetto in fuoco"),
    ],
    nearestContrastId: "a1-note-question-ka-words",
  }),
  defineA1LearningNote({
    id: "a1-note-topic-wa-copula-desu",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-topic-wa", "a1-concept-copula-desu"],
    requiredConceptIds: [],
    title: { en: "Set a topic with は and finish with です", it: "Imposta il tema con は e termina con です" },
    meaning: {
      en: "は marks what the clause is about, and です is a polite copula. Neither is simply the English subject.",
      it: "は segna ciò di cui parla la frase e です è una copula cortese. Nessuno dei due equivale semplicemente al soggetto inglese.",
    },
    use: {
      en: "Use this shape to identify or describe a stated topic politely.",
      it: "Usa questa struttura per identificare o descrivere con cortesia un tema espresso.",
    },
    construction: {
      en: "Put the topic before は, then information, then final です.",
      it: "Metti il tema prima di は, poi l'informazione e infine です.",
    },
    typicalMistake: {
      en: "Do not read は as ha when it is the topic particle, or treat it as a word for 'is'.",
      it: "Non leggere は come ha quando è la particella del tema e non trattarla come una parola per 'essere'.",
    },
    pattern: [
      token("slot", "topic", "topic", "tema"),
      token("particle", "は", "topic particle; read wa", "particella del tema; si legge wa"),
      token("slot", "information", "identity or description", "identità o descrizione"),
      token("ending", "です", "polite copula", "copula cortese"),
    ],
    nearestContrastId: "a1-note-particle-ga",
  }),
  defineA1LearningNote({
    id: "a1-note-question-ka-words",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-interrogative-ka"],
    requiredConceptIds: ["a1-concept-copula-desu"],
    title: { en: "Ask with か and question words", it: "Fai domande con か e le parole interrogative" },
    meaning: {
      en: "Sentence-final か makes a polite question; だれ, なに・なん, and どこ ask who, what, and where.",
      it: "か alla fine della frase rende cortese una domanda; だれ, なに・なん e どこ chiedono chi, che cosa e dove.",
    },
    use: {
      en: "Use なん before です for a neutral “what?” and なに when you deliberately stress “what exactly?”; keep the question word in the information slot and put か at the end.",
      it: "Usa なん prima di です per un neutro «che cosa?» e なに quando vuoi sottolineare «che cos'è esattamente?»; tieni la parola interrogativa nello spazio dell'informazione e metti か alla fine.",
    },
    construction: {
      en: "Use a question word or known information before the final polite predicate plus か.",
      it: "Usa una parola interrogativa o un'informazione nota prima del predicato cortese finale più か.",
    },
    typicalMistake: {
      en: "Do not move the question word to the start by English habit or omit final か in a polite question.",
      it: "Non spostare la parola interrogativa all'inizio per abitudine inglese e non omettere か finale in una domanda cortese.",
    },
    pattern: [
      token("slot", "だれ／なに・なん／どこ", "question word: who / what / where", "parola interrogativa: chi / che cosa / dove"),
      token("slot", "information", "other information", "altre informazioni"),
      token("ending", "です", "polite predicate", "predicato cortese"),
      token("ending", "か", "question ending", "finale interrogativa"),
      token("punctuation", "？", "question mark", "punto interrogativo"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-dictionary-masu-classes",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: [],
    title: { en: "Find the dictionary form, use ます politely", it: "Trova la forma di dizionario, usa ます con cortesia" },
    meaning: {
      en: "The dictionary form is the verb's lookup lemma, not an infinitive. ます is used for polite nonpast speech.",
      it: "La forma di dizionario è il lemma con cui cercare il verbo, non un infinito. ます si usa nel parlato cortese al non-passato.",
    },
    use: {
      en: "Look up the dictionary form, then learn the taught polite form for the situation.",
      it: "Cerca la forma di dizionario, poi impara la forma cortese insegnata per la situazione.",
    },
    construction: {
      en: "Godan, ichidan, する, and くる form polite verbs differently; learn the needed form with each verb.",
      it: "Godan, ichidan, する e くる formano i verbi cortesi in modo diverso; impara la forma necessaria con ogni verbo.",
    },
    typicalMistake: {
      en: "Do not call the dictionary form an infinitive or add ます directly to every dictionary form.",
      it: "Non chiamare la forma di dizionario un infinito e non aggiungere ます direttamente a ogni forma di dizionario.",
    },
    pattern: [
      token("slot", "たべる", "dictionary form; lookup lemma", "forma di dizionario; lemma"),
      token("punctuation", "→", "changes to", "diventa"),
      token("ending", "たべます", "polite nonpast verb", "verbo cortese non-passato"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-particle-ga",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-nominative-ga"],
    requiredConceptIds: ["a1-concept-topic-wa"],
    title: { en: "Use が for focus or grammatical subject", it: "Usa が per il fuoco o il soggetto grammaticale" },
    meaning: {
      en: "が can mark the focused answer or the grammatical subject. It is not simply the English subject.",
      it: "が può segnare la risposta in fuoco o il soggetto grammaticale. Non equivale semplicemente al soggetto inglese.",
    },
    use: {
      en: "Use が when the person or thing itself is the new focus, especially after a question word or with existence.",
      it: "Usa が quando la persona o la cosa stessa è il nuovo fuoco, soprattutto dopo una parola interrogativa o con l'esistenza.",
    },
    construction: {
      en: "Put the focused noun before が and keep the predicate final.",
      it: "Metti il nome in fuoco prima di が e mantieni il predicato alla fine.",
    },
    typicalMistake: {
      en: "Do not replace every は with が: は sets a topic, while が highlights or grammatically marks a subject.",
      it: "Non sostituire ogni は con が: は imposta un tema, mentre が mette in rilievo o segna grammaticalmente un soggetto.",
    },
    pattern: [
      token("slot", "focus", "focused person or thing", "persona o cosa in fuoco"),
      token("particle", "が", "focus or grammatical-subject particle", "particella del fuoco o del soggetto grammaticale"),
      token("slot", "predicate", "final predicate", "predicato finale"),
    ],
    nearestContrastId: "a1-note-topic-wa-copula-desu",
  }),
  defineA1LearningNote({
    id: "a1-note-particle-o",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-object-wo"],
    requiredConceptIds: [],
    title: { en: "Mark a direct object with を", it: "Segna l'oggetto diretto con を" },
    meaning: {
      en: "を marks the direct object of many actions and is pronounced o.",
      it: "を segna l'oggetto diretto di molte azioni e si pronuncia o.",
    },
    use: {
      en: "Use it for the thing you eat, drink, read, buy, or otherwise act on.",
      it: "Usala per la cosa che mangi, bevi, leggi, compri o su cui compi un'altra azione.",
    },
    construction: {
      en: "Place the object before を and the action verb at the end.",
      it: "Metti l'oggetto prima di を e il verbo d'azione alla fine.",
    },
    typicalMistake: {
      en: "Do not pronounce を as wo in this particle use or put it after the verb.",
      it: "Non pronunciare を come wo in questo uso e non metterla dopo il verbo.",
    },
    pattern: [
      token("slot", "object", "direct object", "oggetto diretto"),
      token("particle", "を", "direct-object particle; read o", "particella dell'oggetto diretto; si legge o"),
      token("slot", "verb", "final action verb", "verbo d'azione finale"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-particle-de",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-location-particle"],
    requiredConceptIds: [],
    title: { en: "Use で for an action place or means", it: "Usa で per il luogo dell'azione o il mezzo" },
    meaning: {
      en: "で marks where an action happens or the means used to do it.",
      it: "で segna dove avviene un'azione o il mezzo usato per compierla.",
    },
    use: {
      en: "Use it for a place of activity, or for a tool or language used to perform an action.",
      it: "Usala per un luogo di attività, oppure per uno strumento o una lingua usati per compiere un'azione.",
    },
    construction: {
      en: "Put the action place or means before で, then finish with the action.",
      it: "Metti il luogo dell'azione o il mezzo prima di で, poi termina con l'azione.",
    },
    typicalMistake: {
      en: "Do not use で for a destination or a time; those roles use other patterns.",
      it: "Non usare で per una destinazione o un tempo; quei ruoli usano altre strutture.",
    },
    pattern: [
      token("slot", "place／means", "action place or means", "luogo dell'azione o mezzo"),
      token("particle", "で", "action-place or means particle", "particella del luogo d'azione o del mezzo"),
      token("slot", "action", "final action", "azione finale"),
    ],
    nearestContrastId: "a1-note-location-ni-de-contrast",
  }),
  defineA1LearningNote({
    id: "a1-note-location-ni-de-contrast",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-location-particle"],
    requiredConceptIds: [],
    title: {
      en: "Contrast destination に and action place で",
      it: "Confronta la destinazione に e il luogo dell'azione で",
    },
    meaning: {
      en: "After a place, に marks the destination for going or coming; で marks the setting where an activity happens.",
      it: "Dopo un luogo, に segna la destinazione con andare o venire; で segna il contesto in cui avviene un'attività.",
    },
    use: {
      en: "Ask whether the place answers “where to?” or “where does the activity happen?”",
      it: "Chiediti se il luogo risponde a «dove si va?» o a «dove avviene l'attività?».",
    },
    construction: {
      en: "Place + に + go or come; place + で + an activity such as work.",
      it: "Luogo + に + andare o venire; luogo + で + un'attività come lavorare.",
    },
    typicalMistake: {
      en: "Do not say *placeでいきます for a destination or *placeに働きます for an activity setting.",
      it: "Non dire *luogoでいきます per una destinazione o *luogoに働きます per il luogo di un'attività.",
    },
    pattern: [
      token("slot", "destination", "destination", "destinazione"),
      token("particle", "に", "destination particle for go or come", "particella di destinazione con andare o venire"),
      token("slot", "go／come", "final movement verb", "verbo di movimento finale"),
      token("punctuation", "／", "contrast with an action place", "confronta con un luogo dell'azione"),
      token("slot", "action place", "setting where an activity happens", "luogo in cui avviene un'attività"),
      token("particle", "で", "action-place particle", "particella del luogo dell'azione"),
      token("slot", "activity (e.g. work)", "final activity", "attività finale (per esempio lavorare)"),
    ],
    nearestContrastId: "a1-note-particle-ni-destination",
  }),
  defineA1LearningNote({
    id: "a1-note-particle-ni",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-recipient-ni", "a1-concept-companion-to"],
    requiredConceptIds: [],
    title: { en: "Use に for a recipient", it: "Usa に per un destinatario" },
    meaning: {
      en: "に has several roles. Here it marks the recipient of an action; と instead marks a companion. Time and destination uses are learned separately.",
      it: "に ha vari ruoli. Qui segna il destinatario di un'azione; と invece segna un compagno. Gli usi di tempo e destinazione si imparano separatamente.",
    },
    use: {
      en: "Use it with actions such as giving, writing, or asking someone.",
      it: "Usala con azioni come dare, scrivere o chiedere a qualcuno.",
    },
    construction: {
      en: "Put the recipient before に; put a companion before と; keep the action final.",
      it: "Metti il destinatario prima di に; metti un compagno prima di と; mantieni l'azione finale.",
    },
    typicalMistake: {
      en: "Do not assume every に means 'to': check whether it marks a recipient, time, or destination.",
      it: "Non supporre che ogni に significhi 'a': verifica se segna un destinatario, un tempo o una destinazione.",
    },
    pattern: [
      token("slot", "recipient", "recipient", "destinatario"),
      token("particle", "に", "recipient particle", "particella del destinatario"),
      token("slot", "action", "final action", "azione finale"),
    ],
    nearestContrastId: "a1-note-time-ni",
  }),
  defineA1LearningNote({
    id: "a1-note-particle-he",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-direction-he"],
    requiredConceptIds: [],
    title: { en: "Use へ for direction", it: "Usa へ per la direzione" },
    meaning: {
      en: "へ points in the direction of movement and is pronounced e as a particle.",
      it: "へ indica la direzione di un movimento e come particella si pronuncia e.",
    },
    use: {
      en: "Use it with going, coming, or returning when direction is the useful idea.",
      it: "Usala con andare, venire o tornare quando è utile l'idea della direzione.",
    },
    construction: {
      en: "Put the destination before へ and finish with a movement verb.",
      it: "Metti la destinazione prima di へ e termina con un verbo di movimento.",
    },
    typicalMistake: {
      en: "Do not read this particle as he or use it to mark where an action happens.",
      it: "Non leggere questa particella come he e non usarla per segnare dove avviene un'azione.",
    },
    pattern: [
      token("slot", "destination", "direction or destination", "direzione o destinazione"),
      token("particle", "へ", "direction particle; read e", "particella di direzione; si legge e"),
      token("slot", "movement verb", "final movement verb", "verbo di movimento finale"),
    ],
    nearestContrastId: "a1-note-particle-ni-destination",
  }),
  defineA1LearningNote({
    id: "a1-note-time-ni",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-time-schedule"],
    requiredConceptIds: [],
    title: { en: "Mark a specific time with に", it: "Segna un momento preciso con に" },
    meaning: {
      en: "に can mark a specific scheduled time, such as an hour or day.",
      it: "に può segnare un momento preciso in programma, come un'ora o un giorno.",
    },
    use: {
      en: "Use it when you need to anchor an action to a specific time.",
      it: "Usala quando devi ancorare un'azione a un momento preciso.",
    },
    construction: {
      en: "Put the time before に, then place the rest of the clause before the final predicate.",
      it: "Metti il tempo prima di に, poi il resto della frase prima del predicato finale.",
    },
    typicalMistake: {
      en: "Do not confuse time に with recipient に or destination に.",
      it: "Non confondere il に del tempo con il に del destinatario o della destinazione.",
    },
    pattern: [
      token("slot", "time", "specific time", "momento preciso"),
      token("particle", "に", "time particle", "particella del tempo"),
      token("slot", "action", "final action", "azione finale"),
    ],
    nearestContrastId: "a1-note-particle-ni",
  }),
  defineA1LearningNote({
    id: "a1-note-frequency",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-frequency"],
    requiredConceptIds: [],
    title: { en: "Add a frequency word", it: "Aggiungi una parola di frequenza" },
    meaning: {
      en: "Words such as いつも, ときどき, and まいにち say how often an action happens.",
      it: "Parole come いつも, ときどき e まいにち dicono quanto spesso avviene un'azione.",
    },
    use: {
      en: "Use a frequency word to turn a single action into a routine or habit.",
      it: "Usa una parola di frequenza per trasformare un'azione singola in una routine o un'abitudine.",
    },
    construction: {
      en: "Put the frequency word before the final predicate, with time information when needed.",
      it: "Metti la parola di frequenza prima del predicato finale, insieme a un'indicazione di tempo se serve.",
    },
    typicalMistake: {
      en: "Do not add に automatically to every frequency word.",
      it: "Non aggiungere automaticamente に a ogni parola di frequenza.",
    },
    pattern: [
      token("slot", "frequency", "frequency word", "parola di frequenza"),
      token("slot", "action", "final action", "azione finale"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-mashita",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: [],
    explainedVerbForms: [{ polarity: "affirmative", tense: "past", formality: "polite" }],
    title: { en: "Use ました for a polite past action", it: "Usa ました per un'azione passata cortese" },
    meaning: {
      en: "ました is the polite affirmative past ending for taught verbs.",
      it: "ました è la finale affermativa passata cortese per i verbi studiati.",
    },
    use: {
      en: "Use it when you politely say that an action happened or was completed.",
      it: "Usala quando dici con cortesia che un'azione è avvenuta o è stata completata.",
    },
    construction: {
      en: "Replace the learned polite nonpast ending ます with ました.",
      it: "Sostituisci la finale cortese non-passata ます già imparata con ました.",
    },
    typicalMistake: {
      en: "Do not use ました for a present routine; use ます for polite nonpast.",
      it: "Non usare ました per una routine presente; usa ます per il non-passato cortese.",
    },
    pattern: [
      token("slot", "verb stem", "learned polite verb stem", "tema verbale cortese imparato"),
      token("ending", "ました", "polite affirmative past ending", "finale affermativa passata cortese"),
    ],
    nearestContrastId: "a1-note-masu-masen",
  }),
  defineA1LearningNote({
    id: "a1-note-masu-masen",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: [],
    explainedVerbForms: [{ polarity: "negative", tense: "present", formality: "polite" }],
    title: { en: "Choose ます or ません", it: "Scegli ます o ません" },
    meaning: {
      en: "ます is polite nonpast affirmative; ません is polite nonpast negative.",
      it: "ます è l'affermativo cortese non-passato; ません è il negativo cortese non-passato.",
    },
    use: {
      en: "Use these endings for current, habitual, or future actions in a polite context.",
      it: "Usa queste finali per azioni attuali, abituali o future in un contesto cortese.",
    },
    construction: {
      en: "Attach either ます or ません to the learned polite verb stem.",
      it: "Unisci ます o ません al tema verbale cortese imparato.",
    },
    typicalMistake: {
      en: "Do not treat ません as past; it is a nonpast negative.",
      it: "Non trattare ません come passato; è un negativo non-passato.",
    },
    pattern: [
      token("slot", "verb stem", "learned polite verb stem", "tema verbale cortese imparato"),
      token("ending", "ます／ません", "polite nonpast affirmative / negative ending", "finale cortese non-passata affermativa / negativa"),
    ],
    nearestContrastId: "a1-note-mashita",
  }),
  defineA1LearningNote({
    id: "a1-note-mashita-masen-deshita",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: [],
    explainedVerbForms: [{ polarity: "negative", tense: "past", formality: "polite" }],
    title: { en: "Make the polite past negative", it: "Forma il negativo passato cortese" },
    meaning: {
      en: "ました is polite past affirmative, while ませんでした is polite past negative.",
      it: "ました è il passato affermativo cortese, mentre ませんでした è il passato negativo cortese.",
    },
    use: {
      en: "Use ませんでした when an action did not happen in the past.",
      it: "Usa ませんでした quando un'azione non è avvenuta nel passato.",
    },
    construction: {
      en: "Use the learned polite verb stem plus ました or ませんでした.",
      it: "Usa il tema verbale cortese imparato più ました o ませんでした.",
    },
    typicalMistake: {
      en: "Do not combine ません and ました; the past-negative ending is one form: ませんでした.",
      it: "Non combinare ません e ました; la finale negativa passata è un'unica forma: ませんでした.",
    },
    pattern: [
      token("slot", "verb stem", "learned polite verb stem", "tema verbale cortese imparato"),
      token("ending", "ました／ませんでした", "polite past affirmative / negative ending", "finale cortese passata affermativa / negativa"),
    ],
    nearestContrastId: "a1-note-mashita",
  }),
  defineA1LearningNote({
    id: "a1-note-copula-tense-polarity",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: ["a1-concept-copula-desu"],
    title: { en: "Change です for tense and polarity", it: "Cambia です per tempo e polarità" },
    meaning: {
      en: "The polite copula has nonpast, negative, past, and past-negative forms.",
      it: "La copula cortese ha forme non-passate, negative, passate e negative passate.",
    },
    use: {
      en: "Use these forms after noun or na-adjective information when you need to change time or polarity.",
      it: "Usa queste forme dopo informazioni con nome o aggettivo in na quando devi cambiare tempo o polarità.",
    },
    construction: {
      en: "Choose です, ではありません, でした, or ではありませんでした as the final copula.",
      it: "Scegli です, ではありません, でした o ではありませんでした come copula finale.",
    },
    typicalMistake: {
      en: "Do not use verb ending ませんでした after a noun; use the copula's past-negative form.",
      it: "Non usare la finale verbale ませんでした dopo un nome; usa la forma negativa passata della copula.",
    },
    pattern: [
      token("slot", "information", "noun or na-adjective information", "informazione con nome o aggettivo in na"),
      token("ending", "です／ではありません／でした／ではありませんでした", "polite copula ending", "finale della copula cortese"),
    ],
    nearestContrastId: "a1-note-mashita-masen-deshita",
  }),
  defineA1LearningNote({
    id: "a1-note-particle-ni-destination",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-location-particle", "a1-concept-direction-he"],
    requiredConceptIds: [],
    title: { en: "Use に for an arrival destination", it: "Usa に per una destinazione di arrivo" },
    meaning: {
      en: "With movement verbs, に can mark the destination or arrival point; へ marks direction toward that destination and is read e.",
      it: "Con i verbi di movimento, に può segnare la destinazione o il punto di arrivo; へ segna la direzione verso quella destinazione e si legge e.",
    },
    use: {
      en: "Use it when the arrival destination matters with going, coming, or returning.",
      it: "Usala quando conta la destinazione di arrivo con andare, venire o tornare.",
    },
    construction: {
      en: "Put the destination before に for arrival, or before へ for direction, then finish with a movement verb.",
      it: "Metti la destinazione prima di に per l'arrivo, oppure prima di へ per la direzione, poi termina con un verbo di movimento.",
    },
    typicalMistake: {
      en: "Do not use destination に for the place where an action happens; use で for that action place.",
      it: "Non usare il に di destinazione per il luogo in cui avviene un'azione; per quel luogo usa で.",
    },
    pattern: [
      token("slot", "destination", "arrival destination", "destinazione di arrivo"),
      token("particle", "に", "destination particle", "particella di destinazione"),
      token("slot", "movement verb", "final movement verb", "verbo di movimento finale"),
    ],
    nearestContrastId: "a1-note-location-ni-de-contrast",
  }),
  defineA1LearningNote({
    id: "a1-note-particle-he-contrast",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-direction-he"],
    requiredConceptIds: [],
    title: { en: "Compare destination に and direction へ", it: "Confronta il に di destinazione e il へ di direzione" },
    meaning: {
      en: "に presents a destination or arrival point; へ emphasizes direction toward it and is read e.",
      it: "に presenta una destinazione o un punto di arrivo; へ enfatizza la direzione verso di essa e si legge e.",
    },
    use: {
      en: "Choose the taught particle that fits whether you mean arrival destination or direction.",
      it: "Scegli la particella studiata secondo che tu intenda la destinazione di arrivo o la direzione.",
    },
    construction: {
      en: "Both follow the destination and come before a final movement verb.",
      it: "Entrambe seguono la destinazione e precedono un verbo di movimento finale.",
    },
    typicalMistake: {
      en: "Do not pronounce particle へ as he or use either particle for an action place.",
      it: "Non pronunciare la particella へ come he e non usare nessuna delle due per un luogo d'azione.",
    },
    pattern: [
      token("slot", "destination", "destination", "destinazione"),
      token("particle", "に／へ", "arrival destination / direction particle; へ reads e", "particella di arrivo / direzione; へ si legge e"),
      token("slot", "movement verb", "final movement verb", "verbo di movimento finale"),
    ],
    nearestContrastId: "a1-note-particle-ni-destination",
  }),
  defineA1LearningNote({
    id: "a1-note-particle-de-transport",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-transport-de"],
    requiredConceptIds: ["a1-concept-direction-he"],
    title: { en: "Use で for transport", it: "Usa で per il trasporto" },
    meaning: {
      en: "With transport, で marks the means used to travel, not the destination.",
      it: "Con il trasporto, で segna il mezzo usato per viaggiare, non la destinazione.",
    },
    use: {
      en: "Use it with a train, bus, car, bicycle, or similar means before a movement verb.",
      it: "Usala con treno, autobus, automobile, bicicletta o un mezzo simile prima di un verbo di movimento.",
    },
    construction: {
      en: "Put the transport before で; add a destination phrase separately when needed.",
      it: "Metti il mezzo di trasporto prima di で; aggiungi separatamente una frase di destinazione se serve.",
    },
    typicalMistake: {
      en: "Do not confuse transport で with destination に or へ, or with an action place.",
      it: "Non confondere il で del trasporto con il に o へ di destinazione, né con un luogo d'azione.",
    },
    pattern: [
      token("slot", "transport", "means of transport", "mezzo di trasporto"),
      token("particle", "で", "transport-means particle", "particella del mezzo di trasporto"),
      token("slot", "movement verb", "final movement verb", "verbo di movimento finale"),
    ],
    nearestContrastId: "a1-note-particle-de",
  }),
  defineA1LearningNote({
    id: "a1-note-source-limit",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-source-limit"],
    requiredConceptIds: [],
    title: { en: "Show a start and limit with から and まで", it: "Mostra inizio e limite con から e まで" },
    meaning: {
      en: "から marks a starting point and まで marks an endpoint in time or place.",
      it: "から segna un punto di partenza e まで segna un punto finale nel tempo o nello spazio.",
    },
    use: {
      en: "Use them to say from when or where something starts and until when or where it continues.",
      it: "Usali per dire da quando o da dove qualcosa inizia e fino a quando o dove continua.",
    },
    construction: {
      en: "Place the start before から and the limit before まで; use either one alone when enough.",
      it: "Metti l'inizio prima di から e il limite prima di まで; usa anche solo uno dei due quando basta.",
    },
    typicalMistake: {
      en: "Do not reverse them: から starts, while まで sets the limit.",
      it: "Non invertirli: から inizia, mentre まで stabilisce il limite.",
    },
    pattern: [
      token("slot", "start", "starting time or place", "tempo o luogo di partenza"),
      token("particle", "から", "source or starting-point particle", "particella della fonte o del punto di partenza"),
      token("slot", "limit", "ending time or place", "tempo o luogo finale"),
      token("particle", "まで", "limit or endpoint particle", "particella del limite o del punto finale"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-companion-to",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-companion-to"],
    requiredConceptIds: [],
    title: { en: "Use と for a companion", it: "Usa と per un compagno" },
    meaning: {
      en: "と can mark the person or animal you do an action with.",
      it: "と può segnare la persona o l'animale con cui compi un'azione.",
    },
    use: {
      en: "Use it to say who accompanies you in going, eating, studying, or another shared action.",
      it: "Usala per dire chi ti accompagna nell'andare, mangiare, studiare o in un'altra azione condivisa.",
    },
    construction: {
      en: "Put the companion before と and keep the shared action final.",
      it: "Metti il compagno prima di と e mantieni finale l'azione condivisa.",
    },
    typicalMistake: {
      en: "Do not use recipient に when you mean 'with' a companion.",
      it: "Non usare il に del destinatario quando intendi 'con' un compagno.",
    },
    pattern: [
      token("slot", "companion", "companion", "compagno"),
      token("particle", "と", "companion particle; with", "particella del compagno; con"),
      token("slot", "action", "final shared action", "azione condivisa finale"),
    ],
    nearestContrastId: "a1-note-particle-ni",
  }),
  defineA1LearningNote({
    id: "a1-note-adjectives",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-adjective"],
    requiredConceptIds: [],
    title: { en: "Describe with i- and na-adjectives", it: "Descrivi con aggettivi in i e in na" },
    meaning: {
      en: "i-adjectives and na-adjectives describe things, but their polite predicate shapes are not identical.",
      it: "Gli aggettivi in i e in na descrivono le cose, ma le loro forme predicative cortesi non sono identiche.",
    },
    use: {
      en: "Use an i-adjective such as あつい or a na-adjective such as しずか to give a description.",
      it: "Usa un aggettivo in i come あつい o un aggettivo in na come しずか per dare una descrizione.",
    },
    construction: {
      en: "Use i-adjective plus です, or na-adjective plus です in a polite predicate; do not add な there.",
      it: "Usa aggettivo in i più です, oppure aggettivo in na più です nel predicato cortese; lì non aggiungere な.",
    },
    typicalMistake: {
      en: "Do not say しずかなです: な links a na-adjective to a noun, not to predicate です.",
      it: "Non dire しずかなです: な collega un aggettivo in na a un nome, non al predicato です.",
    },
    pattern: [
      token("slot", "topic", "topic", "tema"),
      token("particle", "は", "topic particle; read wa", "particella del tema; si legge wa"),
      token("slot", "adjective", "i- or na-adjective", "aggettivo in i o in na"),
      token("ending", "です", "polite predicate ending", "finale predicativa cortese"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-preference-ga",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-preference-ga"],
    requiredConceptIds: ["a1-concept-nominative-ga"],
    title: { en: "Mark what you like with が", it: "Segna ciò che ti piace con が" },
    meaning: {
      en: "With すきです or きらいです, the liked or disliked thing is commonly marked by が.",
      it: "Con すきです o きらいです, la cosa che piace o non piace è comunemente segnata da が.",
    },
    use: {
      en: "Use this shape to state a preference politely.",
      it: "Usa questa struttura per esprimere con cortesia una preferenza.",
    },
    construction: {
      en: "State the person as topic when needed, then the liked thing plus が, then すきです or きらいです.",
      it: "Indica la persona come tema quando serve, poi la cosa che piace più が, quindi すきです o きらいです.",
    },
    typicalMistake: {
      en: "Do not automatically use を after the liked thing in this basic preference pattern.",
      it: "Non usare automaticamente を dopo la cosa che piace in questa struttura di preferenza di base.",
    },
    pattern: [
      token("slot", "person", "person or topic", "persona o tema"),
      token("particle", "は", "topic particle; read wa", "particella del tema; si legge wa"),
      token("slot", "liked thing", "liked or disliked thing", "cosa che piace o non piace"),
      token("particle", "が", "preference particle", "particella della preferenza"),
      token("ending", "すきです／きらいです", "polite preference predicate", "predicato cortese di preferenza"),
    ],
    nearestContrastId: "a1-note-particle-o",
  }),
  defineA1LearningNote({
    id: "a1-note-comparison-yori",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-comparison-yori"],
    requiredConceptIds: ["a1-concept-adjective"],
    title: { en: "Compare with より", it: "Confronta con より" },
    meaning: {
      en: "より marks the comparison point: the topic is more adjective than that point.",
      it: "より segna il termine di confronto: il tema è più aggettivo di quel termine.",
    },
    use: {
      en: "Use it to make a simple comparison between two known things.",
      it: "Usala per fare un confronto semplice tra due cose note.",
    },
    construction: {
      en: "Put the topic first, then the comparison point plus より, then the final adjective.",
      it: "Metti prima il tema, poi il termine di confronto più より, quindi l'aggettivo finale.",
    },
    typicalMistake: {
      en: "Do not reverse the two items: the item before より is the comparison point.",
      it: "Non invertire i due elementi: l'elemento prima di より è il termine di confronto.",
    },
    pattern: [
      token("slot", "topic", "thing being described", "cosa descritta"),
      token("particle", "は", "topic particle; read wa", "particella del tema; si legge wa"),
      token("slot", "comparison point", "comparison point", "termine di confronto"),
      token("particle", "より", "comparison particle; than", "particella di confronto; di"),
      token("slot", "adjective", "final adjective", "aggettivo finale"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-quantity",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-quantity"],
    requiredConceptIds: [],
    title: { en: "Place a quantity with what it counts", it: "Colloca una quantità con ciò che conta" },
    meaning: {
      en: "Numbers and counters tell how many or how much; the quantity stays close to the noun or action it qualifies.",
      it: "Numeri e contatori dicono quanti o quanto; la quantità resta vicina al nome o all'azione che specifica.",
    },
    use: {
      en: "Use a number for prices, amounts, or a counted item in a simple purchase or action.",
      it: "Usa un numero per prezzi, quantità o un elemento contato in un acquisto o un'azione semplice.",
    },
    construction: {
      en: "Put the number with its counter or unit, then place it where it qualifies the noun or action.",
      it: "Metti il numero con il suo contatore o unità, poi collocalo dove specifica il nome o l'azione.",
    },
    typicalMistake: {
      en: "Do not assume Italian or English plural order decides the Japanese quantity position.",
      it: "Non presumere che l'ordine plurale italiano o inglese decida la posizione della quantità in giapponese.",
    },
    pattern: [
      token("slot", "item", "item, if stated", "elemento, se espresso"),
      token("slot", "number + counter", "quantity with counter or unit", "quantità con contatore o unità"),
      token("slot", "predicate", "final predicate", "predicato finale"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-request-kudasai",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-request-kudasai"],
    requiredConceptIds: ["a1-concept-object-wo"],
    title: { en: "Request an item with ください", it: "Chiedi un oggetto con ください" },
    meaning: {
      en: "ください is a polite request meaning 'please give me' in this item-request pattern.",
      it: "ください è una richiesta cortese che in questa struttura di richiesta di oggetti significa 'per favore, mi dia'.",
    },
    use: {
      en: "Use it to request a known item politely in a shop, café, or similar everyday setting.",
      it: "Usala per richiedere con cortesia un oggetto noto in un negozio, in un bar o in un contesto quotidiano simile.",
    },
    construction: {
      en: "Put the requested item before を, then finish with ください.",
      it: "Metti l'oggetto richiesto prima di を, poi termina con ください.",
    },
    typicalMistake: {
      en: "Do not add ます after ください in this request pattern.",
      it: "Non aggiungere ます dopo ください in questa struttura di richiesta.",
    },
    pattern: [
      token("slot", "item", "requested item", "oggetto richiesto"),
      token("particle", "を", "direct-object particle; read o", "particella dell'oggetto diretto; si legge o"),
      token("ending", "ください", "polite item-request ending", "finale cortese per richiedere un oggetto"),
    ],
  }),
  defineA1LearningNote({
    id: "a1-note-existence-aru-iru",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-existence-aru-iru"],
    requiredConceptIds: ["a1-concept-nominative-ga"],
    title: { en: "Choose あります or います for existence", it: "Scegli あります o います per l'esistenza" },
    meaning: {
      en: "あります is used for inanimate things; います is used for people and animals.",
      it: "あります si usa per le cose inanimate; います si usa per persone e animali.",
    },
    use: {
      en: "Use this shape to say that something or someone exists, often at a stated location.",
      it: "Usa questa struttura per dire che una cosa o una persona esiste, spesso in un luogo indicato.",
    },
    construction: {
      en: "Put the location before に, the existing thing before が, then end with あります or います.",
      it: "Metti il luogo prima di に, la cosa esistente prima di が, poi termina con あります o います.",
    },
    typicalMistake: {
      en: "Do not choose あります for a person or animal, or います for an inanimate object.",
      it: "Non scegliere あります per una persona o un animale, né います per un oggetto inanimato.",
    },
    pattern: [
      token("slot", "location", "location", "luogo"),
      token("particle", "に", "existence-location particle", "particella del luogo di esistenza"),
      token("slot", "thing or person", "existing thing or person", "cosa o persona esistente"),
      token("particle", "が", "grammatical-subject particle", "particella del soggetto grammaticale"),
      token("ending", "あります／います", "inanimate / animate existence ending", "finale di esistenza inanimata / animata"),
    ],
    nearestContrastId: "a1-note-particle-ga",
  }),
  defineA1LearningNote({
    id: "a1-note-location-relations",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: ["a1-concept-existence-aru-iru"],
    title: { en: "Locate things with relation expressions", it: "Localizza le cose con espressioni di relazione" },
    meaning: {
      en: "Expressions such as つくえのうえ and かばんのなか name a relation and can be followed by に for location.",
      it: "Espressioni come つくえのうえ e かばんのなか nominano una relazione e possono essere seguite da に per il luogo.",
    },
    use: {
      en: "Use them when you say where a thing, person, or animal exists.",
      it: "Usale quando dici dove esiste una cosa, una persona o un animale.",
    },
    construction: {
      en: "Build the relation expression, add に, then use the existence pattern with が and あります or います.",
      it: "Costruisci l'espressione di relazione, aggiungi に, poi usa la struttura di esistenza con が e あります o います.",
    },
    typicalMistake: {
      en: "Do not use で for this existence location; で marks an action place.",
      it: "Non usare で per questo luogo di esistenza; で segna un luogo d'azione.",
    },
    pattern: [
      token("slot", "relation expression", "place relation expression", "espressione di relazione spaziale"),
      token("particle", "に", "existence-location particle", "particella del luogo di esistenza"),
      token("slot", "thing or person", "existing thing or person", "cosa o persona esistente"),
      token("particle", "が", "grammatical-subject particle", "particella del soggetto grammaticale"),
      token("ending", "あります／います", "existence ending", "finale di esistenza"),
    ],
    nearestContrastId: "a1-note-particle-de",
  }),
  defineA1LearningNote({
    id: "a1-note-needs-wants",
    kind: "grammar",
    explainedConceptIds: [],
    requiredConceptIds: ["a1-concept-preference-ga"],
    title: { en: "Say what you want with ほしい", it: "Di' ciò che vuoi con ほしい" },
    meaning: {
      en: "In this basic pattern, ほしい describes what the speaker wants; the wanted thing takes が.",
      it: "In questa struttura di base, ほしい descrive ciò che vuole chi parla; la cosa desiderata prende が.",
    },
    use: {
      en: "Use it for your own simple wish or need. To ask what the addressee wants, use a question.",
      it: "Usalo per un tuo semplice desiderio o bisogno. Per chiedere che cosa vuole l'interlocutore, usa una domanda.",
    },
    construction: {
      en: "State わたし as topic when needed, then the wanted thing + が + ほしいです.",
      it: "Se serve, indica わたし come tema, poi la cosa desiderata + が + ほしいです.",
    },
    typicalMistake: {
      en: "Do not use bare ほしいです to state another person's desire; later patterns or quoting are required and are outside this A1 lesson. Do not use を after the wanted thing.",
      it: "Non usare ほしいです da solo per dire il desiderio di un'altra persona; servono strutture successive o il discorso riportato, fuori da questa lezione A1. Non usare を dopo la cosa desiderata.",
    },
    pattern: [
      token("slot", "person", "person or topic", "persona o tema"),
      token("particle", "は", "topic particle; read wa", "particella del tema; si legge wa"),
      token("slot", "wanted thing", "wanted thing", "cosa desiderata"),
      token("particle", "が", "wanted-thing particle", "particella della cosa desiderata"),
      token("ending", "ほしいです", "polite want predicate", "predicato cortese di desiderio"),
    ],
    nearestContrastId: "a1-note-preference-ga",
  }),
  defineA1LearningNote({
    id: "a1-note-synthesis-recombine",
    kind: "synthesis",
    explainedConceptIds: [],
    requiredConceptIds: [],
    title: { en: "Recombine what you already know", it: "Ricomponi ciò che già conosci" },
    meaning: {
      en: "No new grammar: retrieval combines known topics, particles, vocabulary, and predicate forms.",
      it: "Nessuna grammatica nuova: il recupero combina temi, particelle, vocabolario e forme predicative già noti.",
    },
    use: {
      en: "Choose familiar pieces for the situation and retrieve them without introducing a new rule.",
      it: "Scegli pezzi familiari per la situazione e recuperali senza introdurre una nuova regola.",
    },
    construction: {
      en: "Start from a known predicate, add known particle phrases, then state a topic only when useful.",
      it: "Parti da un predicato noto, aggiungi frasi con particelle note, poi esprimi un tema solo quando è utile.",
    },
    typicalMistake: {
      en: "Do not invent a new pattern just because several known forms appear together.",
      it: "Non inventare una nuova struttura solo perché compaiono insieme varie forme note.",
    },
    pattern: [
      token("slot", "known topic", "known topic, if needed", "tema noto, se serve"),
      token("slot", "known particle phrase", "known particle phrase", "frase con particella nota"),
      token("slot", "known predicate", "known final predicate", "predicato finale noto"),
    ],
  }),
]);

function buildLearningNoteIndex(notes: readonly A1LearningNote[]): LearningNoteIndex {
  const knownConceptIds = new Set(A1_CONCEPT_IDS);
  const explainedConceptIds = new Set<string>();
  const byId: Record<string, A1LearningNote | undefined> = {};

  for (const note of notes) {
    if (byId[note.id] !== undefined) {
      throw new Error(`Duplicate A1 learning note id "${note.id}".`);
    }
    byId[note.id] = note;

    for (const conceptId of note.explainedConceptIds) {
      if (!knownConceptIds.has(conceptId)) {
        throw new Error(`A1 learning note "${note.id}" explains missing concept "${conceptId}".`);
      }
      explainedConceptIds.add(conceptId);
    }
    for (const conceptId of note.requiredConceptIds) {
      if (!knownConceptIds.has(conceptId)) {
        throw new Error(`A1 learning note "${note.id}" requires missing concept "${conceptId}".`);
      }
    }
  }

  for (const note of notes) {
    if (note.nearestContrastId !== undefined) {
      if (note.nearestContrastId === note.id) {
        throw new Error(`A1 learning note "${note.id}" cannot contrast with itself.`);
      }
      if (byId[note.nearestContrastId] === undefined) {
        throw new Error(
          `A1 learning note "${note.id}" references missing contrast "${note.nearestContrastId}".`,
        );
      }
    }
  }

  for (const conceptId of A1_CONCEPT_IDS) {
    if (!explainedConceptIds.has(conceptId)) {
      throw new Error(`A1 concept "${conceptId}" is missing a learner note.`);
    }
  }

  return deepFreeze(byId);
}

export const a1LearningNoteById: LearningNoteIndex = buildLearningNoteIndex(a1LearningNotes);

/**
 * Next-release-only composite notes. They keep the published A1 note index
 * stable while letting the staged Foundations preview teach combined forms
 * honestly before Task 5 promotes the whole area.
 */
export const a1ExpandedFoundationLearningNotes: readonly A1LearningNote[] =
  deepFreeze([
    defineA1LearningNote({
      id: "a1-note-masu-object-o",
      kind: "grammar",
      explainedConceptIds: ["a1-concept-object-wo"],
      requiredConceptIds: [],
      explainedVerbForms: [
        { polarity: "affirmative", tense: "present", formality: "polite" },
      ],
      title: {
        en: "Use ます with a direct object",
        it: "Usa ます con un oggetto diretto",
      },
      meaning: {
        en: "ます is the polite nonpast affirmative ending, and を marks the thing the action affects.",
        it: "ます è la finale affermativa cortese non-passata e を segna la cosa su cui agisce l'azione.",
      },
      use: {
        en: "Use this shape when you politely say what you eat, drink, read, or write.",
        it: "Usa questa struttura quando dici con cortesia che cosa mangi, bevi, leggi o scrivi.",
      },
      construction: {
        en: "Put the object before を, then add ます to the learned polite verb stem.",
        it: "Metti l'oggetto prima di を, poi aggiungi ます al tema verbale cortese imparato.",
      },
      typicalMistake: {
        en: "Do not put を after the verb or use a dictionary form where the polite ます form is required.",
        it: "Non mettere を dopo il verbo e non usare la forma di dizionario quando serve la forma cortese in ます.",
      },
      pattern: [
        token("slot", "object", "direct object", "oggetto diretto"),
        token("particle", "を", "direct-object particle; read o", "particella dell'oggetto diretto; si legge o"),
        token("slot", "verb stem", "learned polite verb stem", "tema verbale cortese imparato"),
        token("ending", "ます", "polite nonpast affirmative ending", "finale affermativa cortese non-passata"),
      ],
      nearestContrastId: "a1-note-masu-masen",
    }),
    defineA1LearningNote({
      id: "a1-note-direction-transport-dialogue",
      kind: "synthesis",
      explainedConceptIds: [
        "a1-concept-direction-he",
        "a1-concept-transport-de",
      ],
      requiredConceptIds: ["a1-concept-location-particle"],
      title: {
        en: "Combine direction and transport in a travel exchange",
        it: "Combina direzione e trasporto in uno scambio di viaggio",
      },
      meaning: {
        en: "に marks an arrival destination, へ points toward a destination, and で marks the means of travel.",
        it: "に segna una destinazione di arrivo, へ indica la direzione verso una destinazione e で segna il mezzo di trasporto.",
      },
      use: {
        en: "Use the destination particle and the transport phrase together when a short travel exchange needs both details.",
        it: "Usa insieme la particella di destinazione e la frase di trasporto quando un breve scambio di viaggio richiede entrambi i dettagli.",
      },
      construction: {
        en: "Put the transport before で, the destination before に or へ, and keep the polite movement verb final.",
        it: "Metti il mezzo prima di で, la destinazione prima di に o へ e mantieni finale il verbo di movimento cortese.",
      },
      typicalMistake: {
        en: "Do not use transport で as an action place, or use へ for the place where an activity happens.",
        it: "Non usare il で del trasporto come luogo dell'azione e non usare へ per il luogo in cui avviene un'attività.",
      },
      pattern: [
        token("slot", "transport", "means of transport", "mezzo di trasporto"),
        token("particle", "で", "transport-means particle", "particella del mezzo di trasporto"),
        token("slot", "destination", "arrival point or direction", "punto di arrivo o direzione"),
        token("particle", "に／へ", "destination or direction particle", "particella di destinazione o direzione"),
        token("slot", "movement verb", "final polite movement verb", "verbo di movimento cortese finale"),
      ],
      nearestContrastId: "a1-note-particle-he-contrast",
    }),
  ]);

/** Complete note lookup for staged Foundations authoring; not the published view. */
export const a1CanonicalFoundationLearningNoteById: LearningNoteIndex =
  buildLearningNoteIndex([
    ...a1LearningNotes,
    ...a1ExpandedFoundationLearningNotes,
  ]);

/**
 * The one substantive note that first teaches each grammar concept. Later
 * mentions may reinforce a concept, but never unlock it for curriculum use.
 */
export const a1ConceptFirstTeachingNoteId: Readonly<Record<string, string>> = deepFreeze({
  "a1-concept-topic-wa": "a1-note-sentence-shape-omission",
  "a1-concept-copula-desu": "a1-note-sentence-shape-omission",
  "a1-concept-interrogative-ka": "a1-note-question-ka-words",
  "a1-concept-location-particle": "a1-note-location-ni-de-contrast",
  "a1-concept-object-wo": "a1-note-particle-o",
  "a1-concept-nominative-ga": "a1-note-particle-ga",
  "a1-concept-recipient-ni": "a1-note-particle-ni",
  "a1-concept-companion-to": "a1-note-companion-to",
  "a1-concept-time-schedule": "a1-note-time-ni",
  "a1-concept-frequency": "a1-note-frequency",
  "a1-concept-direction-he": "a1-note-particle-ni-destination",
  "a1-concept-source-limit": "a1-note-source-limit",
  "a1-concept-transport-de": "a1-note-particle-de-transport",
  "a1-concept-adjective": "a1-note-adjectives",
  "a1-concept-preference-ga": "a1-note-preference-ga",
  "a1-concept-comparison-yori": "a1-note-comparison-yori",
  "a1-concept-quantity": "a1-note-quantity",
  "a1-concept-request-kudasai": "a1-note-request-kudasai",
  "a1-concept-existence-aru-iru": "a1-note-existence-aru-iru",
});

function validateA1ConceptFirstTeachingNoteIds(
  firstTeachingNoteId: Readonly<Record<string, string>>,
): void {
  const knownConceptIds = new Set(A1_CONCEPT_IDS);

  for (const [conceptId, noteId] of Object.entries(firstTeachingNoteId)) {
    if (!knownConceptIds.has(conceptId)) {
      throw new Error(`A1 first-teaching map contains unknown concept "${conceptId}".`);
    }
    const note = a1LearningNoteById[noteId];
    if (!note) {
      throw new Error(
        `A1 first-teaching map assigns "${conceptId}" to missing note "${noteId}".`,
      );
    }
    if (!note.explainedConceptIds.includes(conceptId)) {
      throw new Error(
        `A1 first-teaching map assigns "${conceptId}" to note "${noteId}" that does not explain it.`,
      );
    }
  }

  for (const conceptId of A1_CONCEPT_IDS) {
    if (firstTeachingNoteId[conceptId] === undefined) {
      throw new Error(`A1 first-teaching map is missing concept "${conceptId}".`);
    }
  }
}

validateA1ConceptFirstTeachingNoteIds(a1ConceptFirstTeachingNoteId);
