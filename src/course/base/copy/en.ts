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
      "speaker chunk: I → final identity chunk: student",
      "speaker chunk: I → final identity chunk: teacher",
      "role chunk: student → person chunk: me",
      "photo chunk → identified animal chunk: cat",
      "key chunk → associated place chunk: home",
      "wind chunk → scene chunk: sea",
      "ticket chunk → event chunk: trip",
      "time chunk: morning → place chunk: school",
      "telephone chunk → intended person chunk: teacher",
      "bread chunk → contrasting object chunk: book",
    ],
    purposes: [
      "Separates a speaker-reference chunk from a final role chunk.",
      "Contrasts a professional-title chunk with the preceding speaker chunk.",
      "Shows that a role cue and a person answer are separate meaningful chunks.",
      "Uses a visual context cue to select one concrete animal chunk.",
      "Uses an object association to retrieve a place chunk without making a clause.",
      "Uses an environmental cue to retrieve a scene chunk.",
      "Distinguishes a ticket chunk from the event chunk it evokes.",
      "Contrasts a time chunk with the place chunk supplied by context.",
      "Uses a communication-medium chunk to retrieve an intended person.",
      "Contrasts two object chunks without treating either as syntax.",
    ],
    instructions: [
      "In a group photograph, select the fragment that points to the speaker.",
      "At registration, select the fragment that labels the student role.",
      "Arrange teacher as the cue chunk and me as the final person-answer chunk.",
      "When pointing at the animal in a picture, choose the cat fragment.",
      "Transform the school→travel model by replacing only the final chunk with book.",
      "The candidate says telephone for the key-and-map context; diagnose it by selecting home.",
      "For the scene with waves, choose the sea fragment.",
      "For the building shown on the morning route, choose the school fragment.",
      "Listen to the recorded object name, then choose the matching fragment.",
      "Recall the requested travel document from the earlier counter scene and say only its fragment.",
    ],
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
      "photo cue → final answer chunk: Tanaka",
      "photo cue → final answer chunk: Yamada",
      "person chunk → focused person chunk: me",
      "photo cue → recoverable final answer chunk: cat",
      "school cue → recoverable final answer chunk: book",
      "key cue → recoverable final answer chunk: home",
      "telephone cue → recoverable final answer chunk: photograph",
      "travel cue → recoverable final answer chunk: ticket",
      "morning cue → recoverable final answer chunk: school",
      "home cue → recoverable final answer chunk: telephone",
    ],
    purposes: [
      "Shows a photo cue followed by the final person-identification answer.",
      "Contrasts a second named answer under the same recoverable photo context.",
      "Uses a category cue to focus the speaker-reference answer.",
      "Shows how shared visual context licenses a one-chunk animal answer.",
      "Shows how a shared school setting licenses a one-chunk object answer.",
      "Shows how an associated key licenses a recoverable place answer.",
      "Uses a shared screen to license a one-chunk photograph answer.",
      "Uses a travel situation to license the final ticket answer.",
      "Uses a shared time frame to license the school answer.",
      "Uses a shared form field to license the telephone answer.",
    ],
    instructions: [
      "From the named-person card, retrieve the Tanaka fragment only.",
      "From the second card, retrieve the Yamada fragment only.",
      "Arrange me as the first chunk and person as the final category chunk.",
      "In the role slot at the end of the anatomy model, choose student.",
      "Transform person→student into person→teacher without reversing the chunk order.",
      "The candidate answers telephone for the shared photograph; diagnose it by selecting me.",
      "With the pictured referent shared, answer only cat.",
      "With the object already pointed out, answer only book.",
      "Listen to the recorded location answer for the shared map, then choose the matching fragment.",
      "Recall the item from the earlier telephone-screen scene and say only that fragment.",
    ],
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
      "They're a nurse.",
      "They're a lawyer.",
      "They're a friend.",
      "They're a doctor.",
      "I'm a student.",
      "They're a teacher.",
      "It's me.",
      "They're a person.",
      "It's a cat.",
      "It's a home.",
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
    ],
    instructions: [
      "The nurse is the person in the first photograph; choose the complete answer identifying Tanaka.",
      "The lawyer is the person in the second photograph; choose the complete answer identifying Yamada.",
      "Arrange ticket before です to build the complete noun predicate.",
      "The map points to the school; choose the complete polite identification.",
      "Transform the displayed morning and です chunks into the correct predicate order.",
      "The candidate identifies the key as the sea; diagnose it by choosing the key predicate.",
      "The doctor points to the desk item; choose the complete predicate identifying the telephone.",
      "A customer arrives; choose the complete predicate identifying a guest.",
      "Listen without reading an answer, then choose the complete noun predicate that matches the recording.",
      "Recall the event named by the earlier ticket scene and say its complete polite predicate.",
    ],
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
      "As for me—I'm a student.",
      "As for Tanaka—they're a nurse.",
      "As for Yamada—they're a lawyer.",
      "As for my friend—they're an international student.",
      "I'm a university student. (The speaker is recoverable.)",
      "They're an international student. (The friend is recoverable.)",
      "They're my family. (The people in the photo are recoverable.)",
      "They're a student. (The person is recoverable.)",
      "They're a teacher. (The person is recoverable.)",
      "They're a person. (The referent is recoverable.)",
    ],
    purposes: [
      "Labels an explicit spoken hanging topic and its final identity predicate.",
      "Keeps Tanaka separate from the nurse predicate instead of fusing nouns.",
      "Keeps Yamada separate from the lawyer predicate.",
      "Uses a relationship noun as an explicit hanging topic.",
      "Omits the recoverable speaker and leaves a complete predicate.",
      "Omits the recoverable friend while preserving the identity.",
      "Retrieves a visible group from the photo context.",
      "Shows a general role answer with a recoverable person.",
      "Shows a title answer with a recoverable person.",
      "Shows that omission depends on an established referent.",
    ],
    instructions: [
      "With the speaker explicitly reintroduced, choose “As for me—university student.”",
      "With Tanaka reintroduced as a hanging topic, identify the friendship relation.",
      "Arrange Yamada before the pause and friend in the final predicate.",
      "With the friend explicit, choose student rather than the unrelated international-student candidate.",
      "Transform “As for me—the sea” into the shorter answer that omits the recoverable speaker.",
      "The shared family photo asks for the animal; diagnose the candidate that answers “family” and identify the cat.",
      "The object being discussed is shared; answer only that it is a telephone.",
      "The place is shared; answer only that it is a home.",
      "Listen to the counter reply, then choose the complete predicate that matches the recorded item.",
      "Recall the shared building from the earlier route and say its complete predicate.",
    ],
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
      "As for Tanaka, they are a friend.",
      "Yamada, by contrast, is a friend.",
      "Tokyo is a city.",
      "Returning to Kyoto: it is a city.",
      "As for Osaka, the correct category is city.",
      "As for my friend, they are a student.",
      "As for the family member in question, it is Tanaka.",
      "As for the cat, it is a friend.",
      "As for me, my city answer is Tokyo.",
    ],
    purposes: [
      "Establishes the speaker as a discourse topic.",
      "Uses a named person as an established topic.",
      "Gives は a genuine contrastive reading.",
      "Introduces Tokyo in a simple category comment.",
      "Resumes Kyoto as a previously mentioned topic.",
      "Uses は to correct Osaka's category without treating it as focused new subject.",
      "Keeps topic marking separate from occupational focus.",
      "Uses a family topic to select the member identified as Tanaka.",
      "Applies topic marking to a non-human referent.",
      "Uses a photo as topic and its depicted place as comment.",
    ],
    instructions: [
      "The photo shows Tokyo; identify Tokyo itself, not the generic category city.",
      "Choose the version that explicitly marks the photograph as topic with は, not the hanging-topic pause.",
      "Arrange photograph + は before Osaka and です to form the intended topic comment.",
      "You are the established topic and the known role is university student, not nurse.",
      "Transform the hanging-topic Tanaka nurse statement into an explicit は-topic statement without changing the fact.",
      "The candidate assigns Yamada the nurse role; diagnose the world-fact error and select lawyer.",
      "Your friend is the established topic; identify them as an international student.",
      "The cat is already being discussed as part of the household; choose the family comment.",
      "Listen to the recorded home-location topic sentence and choose the matching city comment.",
      "Recall the destination from the earlier ticket scenario and say the full contrasting topic sentence.",
    ],
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
      "Tanaka is the one who is the nurse.",
      "No—Yamada is the one who is the lawyer.",
      "My friend is the one who is an international student.",
      "The student is Satou.",
      "The teacher is Suzuki.",
      "The doctor is Mari.",
      "The person is me.",
      "The family member is Tanaka.",
      "As for me, I am a university student.",
      "As for the family member, it is Tanaka.",
    ],
    purposes: [
      "Introduces Tanaka as the newly selected nurse.",
      "Uses が for corrective focus on Yamada as the lawyer.",
      "Selects the friend as the international student.",
      "Identifies Satou from the focused student role.",
      "Identifies Suzuki from the focused teacher role.",
      "Uses the doctor role as an established topic and identifies Mari.",
      "Selects the pictured person as the speaker.",
      "Selects Tanaka as the relevant family member.",
      "Retrieves the speaker as an established topic.",
      "Contrasts a family topic with a focused family-member selection.",
    ],
    instructions: [
      "The highlighted person in the photograph is Satou; choose the identification that matches that new selection.",
      "The conversation has already established Satou and now confirms the student role; choose the continuing-topic packaging.",
      "Arrange the chunks to present Mari as the newly selected doctor.",
      "The conversation is already about Mari and now confirms the doctor role; complete the continuing comment.",
      "Repackage the same Suzuki–teacher fact from a hanging topic into a corrective focused answer.",
      "The candidate conflicts with the roster: Suzuki, not Mari, is the teacher already under discussion.",
      "The nurse role is already the topic; identify Tanaka as its value.",
      "The lawyer role is already the topic; identify Yamada as its value.",
      "Listen for the international-student role as topic and choose the relationship noun named in the recording.",
      "Recall the focused self-identification from the earlier registration scenario and say it aloud.",
    ],
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
      "This is my father.",
      "This is my mother.",
      "This is my older brother.",
      "This is my older sister.",
      "This is Tanaka's father (respectful reference).",
      "This is Yamada's mother (respectful reference).",
      "My father is also a teacher.",
      "My mother is also a doctor.",
      "My older brother is also a student.",
      "My older sister is also a lawyer.",
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
    instructions: [
      "After another teacher is mentioned, say that Tanaka's father is also a teacher.",
      "After another doctor is mentioned, say that Yamada's mother is also a doctor.",
      "Arrange わたし + の + あに as one noun phrase before additive も and the student predicate.",
      "Add that my older sister is also a lawyer, keeping わたしの together.",
      "Transform the father statement from established-topic は to additive も after another teacher is mentioned.",
      "The candidate uses が although another doctor was just mentioned; diagnose it with additive も.",
      "After another teacher is mentioned, add the respectful father term おとうさん with も.",
      "After another doctor is mentioned, add the respectful mother term おかあさん with も.",
      "Listen for a possessor plus a respectful paternal head noun, then choose the exact phrase.",
      "Recall the respectful maternal phrase from the earlier family card and say it aloud.",
    ],
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
      "Is it the United States?",
      "Is the name Yuki?",
      "The list is the United States and Italy.",
      "name and country",
      "I am friends with Tanaka.",
      "Yes, it is Yuki.",
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
    instructions: [
      "Ask for the name with the natural complete question なまえはなんですか.",
      "For a different visitor, confirm whether the country is the United States.",
      "Arrange America + と + Italy in that order to build the bounded nominal list.",
      "When asked which two fields are needed, answer with country and name.",
      "Transform the complete statement そうです into the confirmation question そうですか.",
      "Yuki's country is Italy; diagnose the candidate that incorrectly confirms the United States and choose the Italy confirmation.",
      "Reject the United States claim and correct Yuki's country with “No—as for the country, it is Italy.”",
      "Ask whether the listener is friends with Yuki, using companion と and か: “Are you friends with Yuki?”",
      "Listen to the companion statement and choose the exact relationship phrase you hear.",
      "Ask aloud who the listener is friends with, using companion と and か.",
    ],
    accepted: "The nominal relation or question achieves the intended clarification.",
    retry: "Keep と within its nominal relation and place か after the completed predicate.",
  }),
  "topic-questions-4-clarification-dialogue-outcome":
    "The speakers learn Yuki's name, confirm Italy, and confirm the friendship with Tanaka.",
  "topic-questions-4-clarification-dialogue-turn-1-translation": "What is your name?",
  "topic-questions-4-clarification-dialogue-turn-1-purpose":
    "Opens the exchange with an information question.",
  "topic-questions-4-clarification-dialogue-turn-2-translation": "I'm Yuki.",
  "topic-questions-4-clarification-dialogue-turn-2-purpose":
    "Answers the open question directly.",
  "topic-questions-4-clarification-dialogue-turn-3-translation":
    "Is your country Italy?",
  "topic-questions-4-clarification-dialogue-turn-3-purpose":
    "Checks the same partner's country with は and か.",
  "topic-questions-4-clarification-dialogue-turn-4-translation":
    "Yes, it is Italy.",
  "topic-questions-4-clarification-dialogue-turn-4-purpose":
    "Confirms the country without changing referents.",
  "topic-questions-4-clarification-dialogue-turn-5-translation":
    "Are you friends with Tanaka?",
  "topic-questions-4-clarification-dialogue-turn-5-purpose":
    "Checks the companion relationship.",
  "topic-questions-4-clarification-dialogue-turn-6-translation":
    "Yes, that is correct.",
  "topic-questions-4-clarification-dialogue-turn-6-purpose":
    "Closes the clarification with confirmation.",
  "noun-toshi-meaning": "city",
  "noun-yuki-meaning": "Yuki",
};

const SEMANTIC_OPERATION_COPY_EN: Readonly<Record<string, string>> = {
  "recognize-meaning-feedback-accepted":
    "The selected utterance matches the meaning established by the context.",
  "recognize-meaning-feedback-retry":
    "Re-read who or what the context identifies before choosing a meaning.",
  "discriminate-form-function-feedback-accepted":
    "The selected form performs the discourse function requested.",
  "discriminate-form-function-feedback-retry":
    "Separate the form you can see from the function the context requires.",
  "order-chunks-feedback-accepted":
    "The chunks preserve the intended predicate-final organization.",
  "order-chunks-feedback-retry":
    "Locate the identifying predicate chunk and keep it final.",
  "produce-controlled-feedback-accepted":
    "The controlled response expresses the requested identification.",
  "produce-controlled-feedback-retry":
    "Use only the licensed chunks and complete the requested identification.",
  "transform-form-feedback-accepted":
    "The transformed utterance preserves the fact while changing the requested packaging.",
  "transform-form-feedback-retry":
    "Keep the underlying fact constant and change only the requested discourse packaging.",
  "diagnose-error-feedback-accepted":
    "The diagnosis identifies the actual form, information-structure, or world-fact mismatch.",
  "diagnose-error-feedback-retry":
    "Check the context, then isolate whether the candidate conflicts in form, discourse role, or stated fact.",
  "select-contextual-response-feedback-accepted":
    "The response is grammatical and advances this context naturally.",
  "select-contextual-response-feedback-retry":
    "Choose the utterance that answers this speaker without adding an unrelated clause.",
  "retrieve-cumulative-feedback-accepted":
    "The response retrieves the earlier pattern and applies the current distinction.",
  "retrieve-cumulative-feedback-retry":
    "Recover the earlier noun-predicate pattern before applying the new distinction.",
  "identify-audio-feedback-accepted":
    "The selected written utterance matches the complete recording.",
  "identify-audio-feedback-retry":
    "Listen for the whole chunk sequence, including the particle or final です.",
  "produce-spoken-feedback-accepted":
    "The spoken response preserves the intended chunks and particle pronunciation.",
  "produce-spoken-feedback-retry":
    "Say one coherent utterance, keeping は as wa and the predicate ending intact.",
  "noun-otousan-meaning": "someone else's father; father (respectful)",
  "noun-okaasan-meaning": "someone else's mother; mother (respectful)",
  "noun-nan-meaning": "what",
};

const SENTENCE_EXAMPLE_CONTEXT_COPY_EN: Readonly<Record<string, string>> = {
  "sentence-foundations-1-example-1-context": "An anatomy diagram links the speaker chunk to the final student identity chunk; it is not presented as a spoken sentence.",
  "sentence-foundations-1-example-2-context": "A second diagram links the speaker chunk to a teacher identity for structural comparison.",
  "sentence-foundations-1-example-3-context": "The diagram reverses the informational direction: a student-role cue leads to the person me.",
  "sentence-foundations-1-example-4-context": "A photograph supplies the context; cat is the noun chunk selected from it.",
  "sentence-foundations-1-example-5-context": "A key supplies a contextual association with the home chunk.",
  "sentence-foundations-1-example-6-context": "Wind supplies the scene cue; sea is the selected noun chunk.",
  "sentence-foundations-1-example-7-context": "A ticket supplies the cue for the travel chunk.",
  "sentence-foundations-1-example-8-context": "Morning supplies the time cue for the school chunk.",
  "sentence-foundations-1-example-9-context": "A telephone context identifies the intended teacher chunk.",
  "sentence-foundations-1-example-10-context": "Two concrete object chunks are contrasted without claiming they form a clause.",
  "sentence-foundations-2-example-1-context": "In a photograph-identification task, the visible cue leads to the final answer Tanaka.",
  "sentence-foundations-2-example-2-context": "A second photograph leads to the final answer Yamada.",
  "sentence-foundations-2-example-3-context": "The category person is the cue; the focused final answer is me.",
  "sentence-foundations-2-example-4-context": "Because the photograph is shared, the final answer can be only the cat fragment.",
  "sentence-foundations-2-example-5-context": "Because the school setting is shared, the requested object can be answered as book.",
  "sentence-foundations-2-example-6-context": "Because the key and map are shared, home is recoverable as the final answer.",
  "sentence-foundations-2-example-7-context": "A shared telephone screen makes photograph a sufficient final answer.",
  "sentence-foundations-2-example-8-context": "At a travel counter, the shared situation makes ticket a sufficient answer.",
  "sentence-foundations-2-example-9-context": "On the morning route, the shared destination can be answered as school.",
  "sentence-foundations-2-example-10-context": "In a home-contact form, the shared field can be answered as telephone.",
  "sentence-foundations-3-example-1-context": "Asked for Tanaka's occupation, the speaker supplies the complete predicate “nurse + です.”",
  "sentence-foundations-3-example-2-context": "Asked for Yamada's occupation, the speaker supplies the complete predicate “lawyer + です.”",
  "sentence-foundations-3-example-3-context": "Asked about the relationship, the speaker identifies the person as a friend.",
  "sentence-foundations-3-example-4-context": "Asked for the profession, the speaker identifies the person as a doctor.",
  "sentence-foundations-3-example-5-context": "Asked for the speaker's role, the answer is the complete student predicate.",
  "sentence-foundations-3-example-6-context": "Asked for the classroom role, the answer is the complete teacher predicate.",
  "sentence-foundations-3-example-7-context": "Asked who appears in a photograph, the speaker answers “me.”",
  "sentence-foundations-3-example-8-context": "Asked whether the figure is human, the answer identifies a person.",
  "sentence-foundations-3-example-9-context": "Asked what animal is shown, the answer identifies a cat.",
  "sentence-foundations-3-example-10-context": "Asked which place is shown, the answer identifies a home.",
  "sentence-foundations-4-example-1-context": "In relaxed speech, the speaker explicitly hangs わたし before a pause, then gives the student predicate.",
  "sentence-foundations-4-example-2-context": "Tanaka is reintroduced as a spoken hanging topic; nurse remains the final predicate.",
  "sentence-foundations-4-example-3-context": "Yamada is reintroduced as a spoken hanging topic; lawyer remains the final predicate.",
  "sentence-foundations-4-example-4-context": "The friend is reintroduced before a pause; international student is the new information.",
  "sentence-foundations-4-example-5-context": "The question is about the speaker, so the speaker is omitted and university student remains.",
  "sentence-foundations-4-example-6-context": "The question is about the friend, so the friend is omitted and international student remains.",
  "sentence-foundations-4-example-7-context": "The people in the photograph are already visible; the answer identifies them as family.",
  "sentence-foundations-4-example-8-context": "The person being discussed is recoverable; only the student predicate is spoken.",
  "sentence-foundations-4-example-9-context": "The person being discussed is recoverable; only the teacher predicate is spoken.",
  "sentence-foundations-4-example-10-context": "The referent is established; the answer supplies only the human category.",
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
    ...SEMANTIC_OPERATION_COPY_EN,
    ...SENTENCE_EXAMPLE_CONTEXT_COPY_EN,
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
