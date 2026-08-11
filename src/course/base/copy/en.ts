import { deepFreeze } from "../../foundations/deepFreeze";
import type { LessonCopy, ModuleCopy } from "../../i18n/types";

export interface BaseNavigationCopy {
  readonly modules: Readonly<Record<string, ModuleCopy>>;
  readonly lessons: Readonly<Record<string, LessonCopy>>;
  readonly objectives: Readonly<Record<string, string>>;
  readonly outcomes: Readonly<Record<string, string>>;
  readonly content: Readonly<Record<string, string>>;
}

function semanticLessonCopy(
  lessonId: string,
  values: Readonly<{
    title: string;
    objective: string;
    main: string;
    construction: string;
    constraints: string;
    commonError: string;
    nearestContrast: string;
    recap: string;
    translations: readonly string[];
    purposes: readonly string[];
    instructions: readonly string[];
    accepted: string;
    retry: string;
  }>,
): Record<string, string> {
  return {
    [`${lessonId}-title`]: values.title,
    [`${lessonId}-objective`]: values.objective,
    [`${lessonId}-explanation-main`]: values.main,
    [`${lessonId}-explanation-construction`]: values.construction,
    [`${lessonId}-explanation-constraints`]: values.constraints,
    [`${lessonId}-explanation-common-error`]: values.commonError,
    [`${lessonId}-explanation-nearest-contrast`]: values.nearestContrast,
    [`${lessonId}-recap`]: values.recap,
    [`${lessonId}-feedback-accepted`]: values.accepted,
    [`${lessonId}-feedback-retry`]: values.retry,
    ...Object.fromEntries(
      values.translations.flatMap((translation, index) => [
        [`${lessonId}-example-${index + 1}-translation`, translation],
        [`${lessonId}-example-${index + 1}-purpose`, values.purposes[index]],
      ]),
    ),
    ...Object.fromEntries(
      values.instructions.map((instruction, index) => [
        `${lessonId}-activity-${index + 1}-instruction`,
        instruction,
      ]),
    ),
  };
}

const SENTENCE_ACTIVITY_INSTRUCTIONS = [
  "Choose the meaning supported by the displayed context.",
  "Choose the form that performs the stated sentence function.",
  "Put the meaningful chunks in the requested order.",
  "Complete the response with the controlled target.",
  "Transform the displayed material as instructed.",
  "Choose the diagnosis that identifies the actual error.",
  "Build the response that fits this brief context.",
  "Retrieve the earlier material and complete the new response.",
  "Listen once and choose the matching response.",
  "Say the requested response aloud without reading an answer first.",
] as const;

const SENTENCE_FOUNDATIONS_COPY_EN: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("sentence-foundations-1", {
    title: "Meaningful sentence chunks",
    objective: "Recognize short noun chunks that can fill a larger sentence role.",
    main:
      "Japanese sentences are organized in meaningful chunks, and the predicate is the final core chunk. These first items are noun chunks, not a claim that every isolated noun is a complete sentence.",
    construction:
      "Identify one meaningful unit, keep its sounds together, and treat it as a chunk that can later stand before or inside a predicate.",
    constraints:
      "A grammatical subject, a discourse topic, and focused new information are different notions. This lesson labels chunks without assigning all three roles to one noun.",
    commonError:
      "Do not translate English word order one word at a time or call the first visible noun the subject automatically.",
    nearestContrast:
      "A vocabulary item names something; a sentence chunk is that item functioning as one unit in a particular utterance.",
    recap:
      "Retrieve the meanings of わたし, がくせい, and せんせい, then identify each as one movable noun chunk.",
    translations: [
      "student",
      "teacher",
      "I; me",
      "cat",
      "house; home",
      "sea",
      "book",
      "school",
      "photograph",
      "ticket",
    ],
    purposes: [
      "Establishes a person-category noun as one chunk.",
      "Contrasts a professional title with the student chunk.",
      "Introduces a speaker-reference chunk without assigning topic or subject.",
      "Reuses a familiar animal noun as a complete lexical unit.",
      "Keeps a familiar place noun together as one chunk.",
      "Retrieves a sound-module noun without adding grammar.",
      "Treats a concrete object noun as one unit.",
      "Shows that a longer mora pattern still forms one chunk.",
      "Retrieves a familiar visual-object noun.",
      "Closes the set with another concrete noun chunk.",
    ],
    instructions: SENTENCE_ACTIVITY_INSTRUCTIONS,
    accepted: "That response preserves the intended meaningful chunks.",
    retry: "Read each noun as one unit; do not split it into English-sized pieces.",
  }),
  ...semanticLessonCopy("sentence-foundations-2", {
    title: "Predicate-final order and recoverable omission",
    objective:
      "Track a predicate-final message while distinguishing grammatical and discourse roles.",
    main:
      "The predicate comes at the end of its clause. Material already recoverable from the situation may be omitted, but Japanese still has grammatical subjects when the construction calls for them.",
    construction:
      "Establish the shared person or thing, place the identifying information in the final predicate chunk, and omit only material that the listener can safely recover.",
    constraints:
      "Omission is licensed by context, not by any supposed absence of grammatical subjects. Topic, subject, and focus can coincide, but they do not mean the same thing.",
    commonError:
      "Do not insert わたし into every response, and do not erase a needed subject merely because Japanese often leaves recoverable material unspoken.",
    nearestContrast:
      "An explicit reference names the participant; a recoverable omission leaves that participant understood while preserving the same grammatical relation.",
    recap:
      "Recall たなかさん, やまださん, and ひと, then decide what is final information and what the context can recover.",
    translations: [
      "Tanaka",
      "Yamada",
      "person",
      "student",
      "teacher",
      "I; me",
      "cat",
      "book",
      "house; home",
      "photograph",
    ],
    purposes: [
      "Introduces a named participant for explicit reference.",
      "Adds a second named participant for genuine contrast.",
      "Supplies a general human noun for category reference.",
      "Retrieves a familiar identity as final information.",
      "Retrieves a professional identity in shared context.",
      "Shows a reference that can often be recovered in conversation.",
      "Tests omission with a non-human referent.",
      "Extends recoverability to a concrete object.",
      "Keeps a place referent distinct from its discourse status.",
      "Uses a familiar noun in a fresh identification context.",
    ],
    instructions: SENTENCE_ACTIVITY_INSTRUCTIONS,
    accepted: "The final information is clear and any omission is recoverable.",
    retry: "Find the final identifying chunk, then restore only what the context requires.",
  }),
  ...semanticLessonCopy("sentence-foundations-3", {
    title: "Affirmative noun predicates with です",
    objective: "Form a polite affirmative noun predicate with noun plus です.",
    main:
      "In an affirmative noun predicate, です is the polite copula that completes an identification such as がくせいです.",
    construction:
      "Choose the noun that identifies the person or thing, place it in predicate-final position, and attach the separate polite copula chunk です.",
    constraints:
      "Here です belongs to noun predicates. A later い-adjective plus です uses です as a politeness marker rather than this noun-predicate copula, so です is not universal sentence glue.",
    commonError:
      "Do not add です to every Japanese word or put it before the noun it completes.",
    nearestContrast:
      "がくせい names the category; がくせいです makes that noun a polite affirmative predicate.",
    recap:
      "Produce かんごしです, べんごしです, ともだちです, and いしゃです, identifying the noun and the copula separately.",
    translations: [
      "is a nurse",
      "is a lawyer",
      "is a friend",
      "is a doctor",
      "is a student",
      "is a teacher",
      "is me",
      "is a person",
      "is a cat",
      "is a house",
      "is the sea",
      "is a ticket",
    ],
    purposes: [
      "First-teaches the affirmative noun-predicate copula.",
      "Applies です to an occupational noun.",
      "Applies です to a relationship noun.",
      "Applies です to a profession noun.",
      "Retrieves a familiar category with the new copula.",
      "Contrasts a second familiar category predicate.",
      "Allows a contextually natural speaker identification.",
      "Pairs a general human noun with the copula.",
      "Extends the noun predicate to an animal identity.",
      "Extends the noun predicate to a familiar place.",
      "Extends the predicate to a familiar natural feature.",
      "Extends the predicate to a concrete travel item.",
    ],
    instructions: SENTENCE_ACTIVITY_INSTRUCTIONS,
    accepted: "The noun predicate ends correctly with the affirmative copula です.",
    retry: "Keep the identifying noun before です and use no later tense or negative form.",
  }),
  ...semanticLessonCopy("sentence-foundations-4", {
    title: "Reference, topic, subject, and focus",
    objective:
      "Distinguish grammatical subject from discourse topic, new focus, and recoverable reference.",
    main:
      "A grammatical subject belongs to sentence structure; a discourse topic sets what the utterance is about; focus presents salient new information. Any recoverable participant may remain unspoken.",
    construction:
      "First identify the structural predicate, then ask what the discourse is about, what information is new, and which participant the context already supplies.",
    constraints:
      "These labels answer different questions. This lesson does not assign は or が yet and does not claim that a topic mechanically replaces a subject.",
    commonError:
      "Do not call every omitted element a topic, every first noun a subject, or every final noun the focus without checking the discourse.",
    nearestContrast:
      "Grammar identifies structural relations; discourse explains why a speaker states or omits a particular chunk in this context.",
    recap:
      "Retrieve だいがくせい, りゅうがくせい, and かぞく, then label the predicate and state what the context recovers.",
    translations: [
      "is a university student",
      "is an international student",
      "is family",
      "is Professor Tanaka",
      "is Professor Yamada",
      "is Dr. Tanaka",
      "is employee Yamada",
      "I am a lawyer",
      "I am a university student",
      "my friend is an international student",
    ],
    purposes: [
      "Adds a precise student identity for discourse analysis.",
      "Contrasts another student identity as new information.",
      "Introduces a family-category predicate.",
      "Shows a name-plus-title predicate chunk.",
      "Varies the named title while keeping predicate-final order.",
      "Uses a name with a professional title.",
      "Keeps reference and occupational focus distinct.",
      "Makes the speaker reference explicit for comparison.",
      "Contrasts explicit and recoverable speaker reference.",
      "Separates a recoverable friend from the new identity.",
    ],
    instructions: SENTENCE_ACTIVITY_INSTRUCTIONS,
    accepted: "The structural and discourse labels fit this context.",
    retry: "Identify the predicate first, then distinguish topic, subject, focus, and omission.",
  }),
  "sentence-anatomy-title": "Sentence anatomy",
  "particle-atlas-title": "Particle atlas",
  "noun-watashi-meaning": "I; me",
  "noun-tanaka-meaning": "Tanaka (polite name)",
  "noun-yamada-meaning": "Yamada (polite name)",
  "noun-hito-meaning": "person",
  "noun-kangoshi-meaning": "nurse",
  "noun-bengoshi-meaning": "lawyer",
  "noun-tomodachi-meaning": "friend",
  "noun-isha-meaning": "doctor",
  "noun-daigakusei-meaning": "university student",
  "noun-ryuugakusei-meaning": "international student",
  "noun-kazoku-meaning": "family",
  "noun-tokyo-meaning": "Tokyo",
  "noun-kyoto-meaning": "Kyoto",
  "noun-osaka-meaning": "Osaka",
  "noun-satou-meaning": "Satou (polite name)",
  "noun-suzuki-meaning": "Suzuki (polite name)",
  "noun-mari-meaning": "Mari (polite name)",
  "noun-chichi-meaning": "my father",
  "noun-haha-meaning": "my mother",
  "noun-ani-meaning": "my older brother",
  "noun-ane-meaning": "my older sister",
  "noun-namae-meaning": "name",
  "noun-kuni-meaning": "country",
  "noun-amerika-meaning": "United States; America",
  "noun-itaria-meaning": "Italy",
  "noun-dare-meaning": "who",
  "expression-hai-meaning": "yes",
  "expression-iie-meaning": "no",
  "expression-sou-meaning": "so; that is correct",
};

const TOPIC_ACTIVITY_INSTRUCTIONS = [
  "Choose the interpretation licensed by the displayed particle.",
  "Choose the particle form that matches the stated discourse function.",
  "Put the topic or focused chunk before the predicate.",
  "Complete the response with the requested particle relation.",
  "Transform the earlier sentence to express the new discourse intent.",
  "Choose the explanation of the particle error.",
  "Build the response that advances this exchange naturally.",
  "Retrieve the earlier sentence pattern and add the current distinction.",
  "Listen once, then choose the particle relation you hear.",
  "Say the complete response aloud with the particle pronounced naturally.",
] as const;

const TOPIC_QUESTIONS_COPY_EN: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("topic-questions-1", {
    title: "Setting a topic with は",
    objective: "Use は, pronounced wa, to establish or contrast a discourse topic.",
    main:
      "The particle は is written は and pronounced wa here. It marks what the utterance is about or sets up a contrast; it is not a generic subject marker.",
    construction:
      "Place the established noun before は, then finish with the noun predicate that comments on that topic.",
    constraints:
      "A topic can correspond to a grammatical subject in some sentences, but the two notions are not interchangeable.",
    commonError:
      "Do not pronounce topic は as ha, and do not label every は-marked phrase as the grammatical subject.",
    nearestContrast:
      "は organizes established or contrasted discourse; the next lesson uses が to present a focused subject as salient information.",
    recap:
      "Retrieve とうきょう, きょうと, おおさか, and とし, then pronounce each topic は as wa.",
    translations: [
      "As for me, I am a student.",
      "As for Tanaka, they are a teacher.",
      "Yamada, by contrast, is a doctor.",
      "Tokyo is a city.",
      "Kyoto is a city.",
      "Osaka is a city.",
      "As for my friend, they are a lawyer.",
      "In my family, the person in question is a teacher.",
      "As for the cat, it is a friend.",
      "As for the photograph, it shows Tokyo.",
    ],
    purposes: [
      "Establishes the speaker as a discourse topic.",
      "Uses a named person as an established topic.",
      "Gives は a genuine contrastive reading.",
      "Introduces Tokyo in a simple category comment.",
      "Reuses the city predicate with a new topic.",
      "Completes the three-city contrast without changing the rule.",
      "Keeps topic marking separate from occupational focus.",
      "Shows a recoverable family member under a family topic.",
      "Applies topic marking to a non-human referent.",
      "Uses a photo as topic and its depicted place as comment.",
    ],
    instructions: TOPIC_ACTIVITY_INSTRUCTIONS,
    accepted: "The は-marked chunk is an established or contrasted topic, pronounced wa.",
    retry: "Ask what the utterance is about; do not substitute the label subject automatically.",
  }),
  ...semanticLessonCopy("topic-questions-2", {
    title: "Focused subjects with が",
    objective: "Use が for a focused subject and contrast that choice with は.",
    main:
      "The particle が marks a grammatical subject when that participant is presented as focused, newly identified, or contrastively selected.",
    construction:
      "Place the participant supplied as the focused answer before が, then state the predicate that identifies that participant.",
    constraints:
      "が does not mechanically replace は. The choice changes discourse packaging: focused subject with が versus established or contrasted topic with は.",
    commonError:
      "Do not memorize は equals subject and が equals a replacement subject marker; inspect what is established and what is new.",
    nearestContrast:
      "たなかさんは... comments on Tanaka as topic; たなかさんが... selects Tanaka as the focused subject.",
    recap:
      "Retrieve さとうさん, すずきさん, and まりさん, then choose が for a focused answer and は for an established topic.",
    translations: [
      "Satou is the one who is a student.",
      "Suzuki is the one who is the teacher.",
      "Mari is the one who is the doctor.",
      "As for Satou, they are a lawyer.",
      "As for Suzuki, they are a student.",
      "As for Mari, they are a teacher.",
      "Tanaka is the one who is the doctor.",
      "Yamada is the one who is the lawyer.",
      "As for me, I am a student.",
      "My friend is the one who is the teacher.",
    ],
    purposes: [
      "Introduces a new named subject as the focused answer.",
      "Varies the focused participant with the same construction.",
      "Completes a three-person focused-answer set.",
      "Contrasts an established Satou topic with focused が.",
      "Contrasts an established Suzuki topic with focused が.",
      "Contrasts an established Mari topic with focused が.",
      "Uses が for corrective selection of Tanaka.",
      "Uses が for corrective selection of Yamada.",
      "Retrieves は as a true topic contrast.",
      "Shows a newly salient relationship noun as subject.",
    ],
    instructions: TOPIC_ACTIVITY_INSTRUCTIONS,
    accepted: "The particle matches the intended topic or focused-subject reading.",
    retry: "Decide first whether the participant is established or newly selected, then choose は or が.",
  }),
  ...semanticLessonCopy("topic-questions-3", {
    title: "Attributive の and additive も",
    objective: "Link a noun attribute with の and add a parallel item with も.",
    main:
      "Between two nouns, の links a possessor or attribute to the following noun. The particle も marks an additive relation such as also or too.",
    construction:
      "For の, place the possessor or attribute first and the head noun second. For も, place the parallel item before も and complete its predicate.",
    constraints:
      "This lesson covers only possessive or attributive の. It does not introduce nominalizing の, explanatory のです, or んです.",
    commonError:
      "Do not reverse the two nouns around の, and do not use も unless a parallel item is already available in the discourse.",
    nearestContrast:
      "の builds one larger noun phrase; も relates a new item additively to an earlier statement.",
    recap:
      "Retrieve ちち, はは, あに, and あね; build a noun phrase with の and add a parallel family member with も.",
    translations: [
      "is my father",
      "is my mother",
      "is my older brother",
      "is my older sister",
      "is Tanaka's father",
      "is Yamada's mother",
      "my father is also a teacher",
      "my mother is also a doctor",
      "my older brother is also a student",
      "my older sister is also a lawyer",
    ],
    purposes: [
      "Introduces possessive の with the speaker and father.",
      "Changes the head noun while preserving modifier order.",
      "Extends the family noun phrase to an older brother.",
      "Extends the family noun phrase to an older sister.",
      "Uses a named possessor without changing the の relation.",
      "Provides a second named possessor for contrast.",
      "Introduces additive も after a parallel profession statement.",
      "Varies the additive predicate with a doctor identity.",
      "Applies も to an older brother as an additional student.",
      "Applies も to an older sister as an additional lawyer.",
    ],
    instructions: TOPIC_ACTIVITY_INSTRUCTIONS,
    accepted: "The noun order or additive relation matches the intended meaning.",
    retry: "Keep the modifier before の and the head noun after it; use も only for a parallel addition.",
  }),
  ...semanticLessonCopy("topic-questions-4", {
    title: "Clarifying with と and か",
    objective: "List nominal items, mark a companion relation, and ask a practical question with か.",
    main:
      "The particle と links nominal items in a bounded list or marks a companion relation. Sentence-final か turns the polite noun predicate into a question.",
    construction:
      "Join only the intended nouns with と; for a companion, place that person before と. Put か after the completed polite predicate to request confirmation or information.",
    constraints:
      "This lesson does not use quotation と or later verb argument frames. Its と is limited to nominal linking, listing, and a transparent companion relation.",
    commonError:
      "Do not treat と as a universal and, and do not place か inside the noun phrase it questions.",
    nearestContrast:
      "と connects nominal participants or list items; か scopes over the completed question. Neither has the topic function of は.",
    recap:
      "Ask だれですか, confirm a くに, list アメリカとイタリア, and clarify a companion relation before answering はい or いいえ.",
    translations: [
      "Who is it?",
      "Is the country the United States?",
      "Is the name Yuki?",
      "It is the United States and Italy.",
      "name and country",
      "I am friends with Tanaka.",
      "Yes, that is correct.",
      "No, it is Italy.",
    ],
    purposes: [
      "Introduces sentence-final か in an open identity question.",
      "Uses か for practical country confirmation.",
      "Checks a name with the same completed-question procedure.",
      "Introduces と as a bounded nominal list.",
      "Uses nominal と in a practical requested-details label.",
      "Introduces the companion reading without a later verb frame.",
      "Supplies a natural affirmative clarification response.",
      "Supplies a correction after a rejected assumption.",
    ],
    instructions: TOPIC_ACTIVITY_INSTRUCTIONS,
    accepted: "The nominal relation or question achieves the intended clarification.",
    retry: "Keep と within its nominal relation and place か after the completed predicate.",
  }),
  "topic-questions-4-clarification-dialogue-outcome":
    "The speakers identify Yuki, correct the country, and confirm the relationship.",
  "topic-questions-4-clarification-dialogue-turn-1-translation": "What is your name?",
  "topic-questions-4-clarification-dialogue-turn-1-purpose":
    "Opens the exchange with an information question.",
  "topic-questions-4-clarification-dialogue-turn-2-translation": "It is Yuki.",
  "topic-questions-4-clarification-dialogue-turn-2-purpose":
    "Answers the open question directly.",
  "topic-questions-4-clarification-dialogue-turn-3-translation":
    "Are they from the United States?",
  "topic-questions-4-clarification-dialogue-turn-3-purpose":
    "Checks a country attribute with bounded の.",
  "topic-questions-4-clarification-dialogue-turn-4-translation":
    "No, they are from Italy.",
  "topic-questions-4-clarification-dialogue-turn-4-purpose":
    "Rejects the assumption and supplies the correction.",
  "topic-questions-4-clarification-dialogue-turn-5-translation":
    "Are they friends with Tanaka?",
  "topic-questions-4-clarification-dialogue-turn-5-purpose":
    "Checks the companion relationship.",
  "topic-questions-4-clarification-dialogue-turn-6-translation":
    "Yes, I am friends with Tanaka.",
  "topic-questions-4-clarification-dialogue-turn-6-purpose":
    "Closes the clarification with confirmation.",
  "noun-toshi-meaning": "city",
  "noun-yuki-meaning": "Yuki",
};

/**
 * These stable keys were previously surfaced through the expanded A1 navigation
 * copy. Base owns them at runtime; the common catalog merges these values last.
 */
export const BASE_REHOMED_NAVIGATION_KEYS = deepFreeze({
  modules: [
    "sounds",
    "sentence-foundations",
    "topic-questions",
    "polite-verbs",
    "time-movement",
  ],
  lessons: [
    "sounds-1",
    "sounds-2",
    "sounds-3",
    "sounds-4",
    "sentence-foundations-1",
    "sentence-foundations-2",
    "sentence-foundations-3",
    "sentence-foundations-4",
    "topic-questions-1",
    "topic-questions-2",
    "topic-questions-3",
    "topic-questions-4",
    "polite-verbs-1",
    "polite-verbs-2",
    "polite-verbs-3",
    "polite-verbs-4",
    "time-movement-1",
    "time-movement-2",
    "time-movement-3",
    "time-movement-4",
  ],
  objectives: [
    "a1-can-do-sentence-foundations-descriptor",
    "a1-can-do-topic-questions-descriptor",
    "a1-can-do-polite-verbs-descriptor",
    "a1-can-do-time-movement-descriptor",
  ],
  outcomes: [],
  content: [],
});

export function mergeBaseNavigationDictionary<T>(
  dictionary: keyof BaseNavigationCopy,
  a1: Readonly<Record<string, T>>,
  a2: Readonly<Record<string, T>>,
  base: Readonly<Record<string, T>>,
): Record<string, T> {
  for (const key of Object.keys(a2)) {
    if (key in a1) {
      throw new Error(`course copy: ${dictionary} key "${key}" collides between A1 and A2.`);
    }
  }

  const reviewedBaseKeys = new Set(BASE_REHOMED_NAVIGATION_KEYS[dictionary]);
  for (const key of Object.keys(base)) {
    if (key in a2) {
      throw new Error(`course copy: ${dictionary} key "${key}" collides between Base and A2.`);
    }
    if (key in a1 && !reviewedBaseKeys.has(key)) {
      throw new Error(
        `course copy: ${dictionary} key "${key}" collides outside the reviewed Base rehome.`,
      );
    }
  }

  // Base is authoritative for explicitly rehomed stable navigation keys.
  return { ...a1, ...a2, ...base };
}

export const baseNavigationCopyEn: BaseNavigationCopy = deepFreeze({
  modules: {
    sounds: { title: "Sound & Script" },
    "sentence-foundations": { title: "Sentence Foundations" },
    "topic-questions": { title: "Topics & Questions" },
    "polite-verbs": { title: "Polite Actions" },
    "argument-particles": { title: "Roles & Particles" },
    "time-movement": { title: "Time & Movement" },
    "copula-adjectives": { title: "Description & Connection" },
    "existence-location": { title: "Existence & Location" },
    "requests-connection": { title: "Requests & Connection" },
    "base-synthesis": { title: "Foundation Synthesis" },
  },
  lessons: {
    "sounds-1": { title: "Listening for Japanese sounds" },
    "sounds-2": { title: "Reading hiragana patterns" },
    "sounds-3": { title: "Noticing sound changes" },
    "sounds-4": { title: "Reading katakana in context" },
    "sentence-foundations-1": { title: "Building a short sentence" },
    "sentence-foundations-2": { title: "Naming people and things" },
    "sentence-foundations-3": { title: "Choosing a natural reference" },
    "sentence-foundations-4": { title: "Exchanging simple details" },
    "topic-questions-1": { title: "Setting a topic" },
    "topic-questions-2": { title: "Giving a focused answer" },
    "topic-questions-3": { title: "Asking who, what, and where" },
    "topic-questions-4": { title: "Pointing to people and things" },
    "polite-verbs-1": { title: "Recognizing action words" },
    "polite-verbs-2": { title: "Talking about an object" },
    "polite-verbs-3": { title: "Saying an action politely" },
    "polite-verbs-4": { title: "Placing an action" },
    "argument-particles-1": { title: "Marking the person involved" },
    "argument-particles-2": { title: "Marking an object" },
    "argument-particles-3": { title: "Marking a destination" },
    "argument-particles-4": { title: "Connecting sentence roles" },
    "time-movement-1": { title: "Placing an event in time" },
    "time-movement-2": { title: "Talking about a routine" },
    "time-movement-3": { title: "Talking about before and after" },
    "time-movement-4": { title: "Describing a simple journey" },
    "copula-adjectives-1": { title: "Describing with a copula" },
    "copula-adjectives-2": { title: "Adding a simple quality" },
    "copula-adjectives-3": { title: "Linking two descriptions" },
    "copula-adjectives-4": { title: "Comparing familiar details" },
    "existence-location-1": { title: "Saying that something is there" },
    "existence-location-2": { title: "Locating a person or thing" },
    "existence-location-3": { title: "Asking about what is around" },
    "existence-location-4": { title: "Describing a familiar place" },
    "requests-connection-1": { title: "Making a simple request" },
    "requests-connection-2": { title: "Responding helpfully" },
    "requests-connection-3": { title: "Connecting two short ideas" },
    "requests-connection-4": { title: "Handling a small exchange" },
    "base-synthesis-1": { title: "Introducing yourself clearly" },
    "base-synthesis-2": { title: "Asking and answering basics" },
    "base-synthesis-3": { title: "Managing a familiar situation" },
    "base-synthesis-4": { title: "Combining foundation patterns" },
  },
  objectives: {
    "a1-can-do-sounds-descriptor":
      "I can notice and read the sound and script patterns used in the foundation course.",
    "a1-can-do-sentence-foundations-descriptor":
      "I can build short polite sentences to identify people and things in a familiar exchange.",
    "a1-can-do-topic-questions-descriptor":
      "I can set a topic and ask or answer simple questions about familiar people and things.",
    "a1-can-do-polite-verbs-descriptor":
      "I can use a short polite action sentence for a familiar person, object, or place.",
    "base-can-do-argument-particles-descriptor":
      "I can use basic sentence-role markers to make a short familiar message easier to follow.",
    "a1-can-do-time-movement-descriptor":
      "I can place a familiar activity in time and describe a simple movement or routine.",
    "base-can-do-copula-adjectives-descriptor":
      "I can make a short description by connecting familiar identity and quality information.",
    "base-can-do-existence-location-descriptor":
      "I can say that a familiar person or thing is present and give a simple location.",
    "base-can-do-requests-connection-descriptor":
      "I can make or respond to a simple practical request and connect short familiar ideas.",
    "base-can-do-synthesis-descriptor":
      "I can combine the foundation patterns in a short, supported everyday exchange.",
  },
  outcomes: {
    "base-module-outcome-sounds":
      "Use sound and script awareness to approach short Japanese words with care.",
    "base-module-outcome-sentence-foundations":
      "Build short, polite identity sentences for familiar people and things.",
    "base-module-outcome-topic-questions":
      "Guide a brief exchange with a topic and simple question words.",
    "base-module-outcome-polite-verbs":
      "Describe familiar actions in short polite sentences.",
    "base-module-outcome-argument-particles":
      "Make familiar sentence roles clearer with basic linking markers.",
    "base-module-outcome-time-movement":
      "Talk simply about time, routines, and movement.",
    "base-module-outcome-copula-adjectives":
      "Describe familiar people and things with connected short statements.",
    "base-module-outcome-existence-location":
      "Say what is present and where it is in a familiar place.",
    "base-module-outcome-requests-connection":
      "Take part in a small practical exchange with a request and response.",
    "base-module-outcome-base-synthesis":
      "Use the foundation mechanics together in a supported everyday exchange.",
  },
  content: {
    ...SENTENCE_FOUNDATIONS_COPY_EN,
    ...TOPIC_QUESTIONS_COPY_EN,
    "base-audio-failed":
      "The canonical recording could not play. Kana, mora breaks, and meaning remain visible.",
    "base-audio-unavailable":
      "The canonical recording is unavailable. No browser voice is substituted.",
    "base-audio-retry": "Retry the canonical recording",
    "base-sounds-feedback-accepted": "That sound or reading matches the target.",
    "base-sounds-feedback-retry": "Compare the visible kana and mora breaks, then try again.",
    "sounds-1-recap": "You distinguished the five vowels, the basic gojuon, and all 46 modern hiragana.",
    "sounds-1-phonetic-explanation": "A mora is a timing unit. Begin with hiragana and count each basic kana as one mora here.",
    "sounds-1-contrast-map": "Compare vowel quality, then follow each unvoiced gojuon row across the five vowels.",
    "sounds-2-recap": "You compared unvoiced, dakuten, and handakuten spellings without inventing a universal じ/ぢ or ず/づ sound split.",
    "sounds-2-phonetic-explanation": "Dakuten voices a row; handakuten marks the p-row. じ/ぢ and ず/づ remain important spelling distinctions.",
    "sounds-2-contrast-map": "Compare か/が, さ/ざ, た/だ, and は/ば/ぱ, then recognize じ/ぢ and ず/づ.",
    "sounds-3-recap": "You counted long vowels, small っ, and moraic ん as timing units.",
    "sounds-3-phonetic-explanation": "Kana character count is not always mora count: long vowels, small っ, and ん carry timing.",
    "sounds-3-contrast-map": "Compare short/long vowels, plain/geminate consonants, and forms with or without moraic ん.",
    "sounds-4-recap": "You read common yoon as one mora and used a small, practical katakana bridge.",
    "sounds-4-phonetic-explanation": "A full-sized kana plus small ゃ, ゅ, or ょ forms one yoon mora.",
    "sounds-4-contrast-map": "Compare common yoon and map only the bounded katakana set back to familiar hiragana.",
    "snd1-discriminate-vowels-instruction": "Choose the kana that begins the displayed word.",
    "snd1-segment-asa-instruction": "Choose the option with the correct mora boundaries.",
    "snd1-recognize-gojuon-instruction": "Choose the row that completes the displayed kana pattern.",
    "snd1-map-hiragana-row-instruction": "Choose the row that completes the displayed script mapping.",
    "snd1-match-ie-instruction": "Choose the word that matches the displayed mora cue.",
    "snd1-assemble-umi-instruction": "Choose the word assembled from the displayed mora tiles.",
    "snd1-listen-u-instruction": "Listen once, then choose the matching kana.",
    "snd1-read-neko-instruction": "Read the displayed kana aloud at an even mora rhythm.",
    "snd2-discriminate-kaga-instruction": "Choose the pair that keeps the consonant row while adding voicing.",
    "snd2-segment-kagi-instruction": "Choose the option with the correct mora boundaries.",
    "snd2-recognize-jidi-instruction": "Choose the spelling that preserves the repeated base kana when the voicing mark is added.",
    "snd2-map-dakuten-instruction": "Choose the option that completes the displayed mark mapping.",
    "snd2-match-kaze-instruction": "Choose the word that matches the displayed mora cue.",
    "snd2-assemble-denwa-instruction": "Choose the word assembled from the displayed mora tiles.",
    "snd2-listen-kaga-instruction": "Listen once, then choose the matching kana.",
    "snd2-read-panpu-instruction": "Read the displayed kana aloud at an even mora rhythm.",
    "snd3-discriminate-obasan-instruction": "Choose the option that matches the displayed timing slots.",
    "snd3-segment-gakkou-instruction": "Choose the option with the correct mora boundaries.",
    "snd3-recognize-small-tsu-instruction": "Choose the option requested by the displayed kana contrast.",
    "snd3-map-moraic-n-instruction": "Choose the option that completes the displayed timing slot.",
    "snd3-match-hon-instruction": "Choose the word that matches the displayed mora cue.",
    "snd3-assemble-kippu-instruction": "Choose the word assembled from the displayed mora tiles.",
    "snd3-listen-kan-instruction": "Listen once, then choose the matching kana.",
    "snd3-read-obaasan-instruction": "Read the displayed kana aloud at an even mora rhythm.",
    "snd4-discriminate-yoon-instruction": "Choose the option that follows the displayed kana pattern.",
    "snd4-segment-ryokou-instruction": "Choose the option with the correct mora boundaries.",
    "snd4-recognize-small-yoon-instruction": "Choose the option that follows the displayed kana pattern.",
    "snd4-map-katakana-instruction": "Choose the option that completes the displayed script mapping.",
    "snd4-match-shashin-instruction": "Choose the word that matches the displayed mora cue.",
    "snd4-assemble-kyaku-instruction": "Choose the word assembled from the displayed mora tiles.",
    "snd4-listen-nyuryo-instruction": "Listen once, then choose the matching kana.",
    "snd4-read-chuui-instruction": "Read the displayed kana aloud at an even mora rhythm.",
    "anchor-asa-meaning": "morning",
    "anchor-ie-meaning": "house; home",
    "anchor-umi-meaning": "sea",
    "anchor-neko-meaning": "cat",
    "anchor-kagi-meaning": "key",
    "anchor-kaze-meaning": "wind",
    "anchor-denwa-meaning": "telephone",
    "anchor-pan-meaning": "bread",
    "anchor-obaasan-meaning": "grandmother",
    "anchor-gakkou-meaning": "school",
    "anchor-hon-meaning": "book",
    "anchor-kippu-meaning": "ticket",
    "anchor-kyaku-meaning": "guest; customer",
    "anchor-shashin-meaning": "photograph",
    "anchor-chuui-meaning": "attention; caution",
    "anchor-ryokou-meaning": "travel",
  },
});
