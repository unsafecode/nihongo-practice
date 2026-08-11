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
    accepted: readonly string[];
    retry: readonly string[];
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
    ...Object.fromEntries(
      values.accepted.map((feedback, index) => [
        `${lessonId}-activity-${index + 1}-feedback-accepted`,
        feedback,
      ]),
    ),
    ...Object.fromEntries(
      values.retry.map((feedback, index) => [
        `${lessonId}-activity-${index + 1}-feedback-retry`,
        feedback,
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
      "Me. (contextual fragment)",
      "Student. (contextual fragment)",
      "Teacher. (contextual fragment)",
      "A cat. (contextual fragment)",
      "Home. (contextual fragment)",
      "The sea. (contextual fragment)",
      "A book. (contextual fragment)",
      "School. (contextual fragment)",
      "A photograph. (contextual fragment)",
      "A ticket. (contextual fragment)",
    ],
    purposes: [
      "Shows a speaker-reference fragment licensed by a shared photograph.",
      "Shows a role-label fragment licensed by a registration field.",
      "Shows a title fragment licensed by a classroom scene.",
      "Shows an animal fragment licensed by a visible picture.",
      "Shows a place fragment licensed by a shared map.",
      "Shows a scene fragment licensed by visible surroundings.",
      "Shows an object fragment licensed by a shared request.",
      "Shows a place fragment licensed by a route card.",
      "Shows an object fragment licensed by a shared screen.",
      "Shows a travel-item fragment licensed by a counter exchange.",
    ],
    instructions: [
      'A group photograph highlights one participant. Choose the fragment that fits the situation.',
      'A school photograph has one role field in its caption. Choose the fragment that completes it.',
      'A call to a classroom leaves the intended person unidentified. Choose the matching fragment.',
      'A picture highlights one animal. Supply only the contextual reply fragment.',
      'A school checklist has one missing object. Choose the fragment that completes it.',
      'A map-and-key scenario contains an incorrect reply. Choose the repair that fits the situation.',
      'A coastal scene establishes the referent visually. Choose the natural fragment reply.',
      'A morning route recalls an earlier place card. Retrieve the matching fragment.',
      'Listen once to the recorded object word, then choose the matching fragment.',
      'Recall the travel-counter request and say the fragment from memory.',
    ],
    accepted: [
      "The fragment identifies the highlighted participant without pretending to be a full clause.",
      "The selected role noun fills the requested field as one intact chunk.",
      "The person title matches the classroom referent established by the scene.",
      "The animal noun is a sufficient fragment for the shared picture.",
      "The object fragment completes the checklist without adding unrelated material.",
      "The repair replaces the unrelated fragment with the location licensed by the map.",
      "The coastal context makes the selected scene noun recoverable.",
      "The route context correctly retrieves the earlier place fragment.",
      "The written fragment matches the complete recorded object word.",
      "The spoken fragment supplies exactly the travel item requested.",
    ],
    retry: [
      "Use the highlighted participant, not another person in the same scene.",
      "Fill a role field with a role noun rather than an event noun.",
      "Choose the human title established by the classroom, not a weather noun.",
      "The picture asks for its animal referent; keep the response to one fragment.",
      "Return to the missing checklist object and reject the event label.",
      "Treat the displayed reply as the error, then select the location that belongs with the key.",
      "Recover the visible coastal referent before selecting the reply fragment.",
      "Recall which place the earlier route card established.",
      "Listen to the entire recording again and match its noun as one unit.",
      "Recall the requested item; do not read either written choice aloud.",
    ],
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
      "Tanaka. (sufficient reply fragment)",
      "Yamada. (sufficient reply fragment)",
      "A person. (sufficient reply fragment)",
      "Me. (recoverable-context fragment)",
      "Student. (recoverable-context fragment)",
      "Teacher. (recoverable-context fragment)",
      "A cat. (recoverable-context fragment)",
      "A book. (recoverable-context fragment)",
      "Home. (recoverable-context fragment)",
      "A photograph. (recoverable-context fragment)",
    ],
    purposes: [
      "Uses a shared photograph to license a one-name reply.",
      "Uses a second shared photograph to license a different one-name reply.",
      "Uses a visible category field to license a one-noun reply.",
      "Shows omission of a recoverable photographed person.",
      "Shows omission of a recoverable registration field.",
      "Shows omission of a recoverable classroom participant.",
      "Shows omission of a recoverable pictured referent.",
      "Shows omission of a recoverable pointed object.",
      "Shows omission of a recoverable mapped location.",
      "Shows omission of a recoverable screen field.",
    ],
    instructions: [
      'A travel roster asks for one named participant. Choose the sufficient fragment reply.',
      'A school roster asks for a different participant. Choose the sufficient fragment reply.',
      'A category card asks which participant is highlighted. Choose the contextual fragment.',
      'A role field is left blank in a structural model. Complete only the final fragment.',
      'A phone contact card establishes the referent; choose the role fragment that completes the model.',
      'A participant field received an unrelated object reply. Choose the contextual repair.',
      'The referent pictured on a phone is already shared. Choose the shortest sufficient reply.',
      'An object is already being pointed to. Retrieve the sufficient fragment from the earlier model.',
      'Listen to the recorded location reply, then choose the fragment you hear.',
      'Recall the item shown on the earlier screen and say only the sufficient fragment.',
    ],
    accepted: [
      "The named participant is recoverable from the travel roster, so the short reply is sufficient.",
      "The second name identifies the different participant established by the school roster.",
      "The category noun answers the open identification slot without extra material.",
      "The role fragment occupies the final information slot in the structural model.",
      "The selected title supplies the phone contact's role while the person remains recoverable.",
      "The repair replaces an unrelated object with the participant required by the open field.",
      "The animal fragment is sufficient because the phone image already shares the referent.",
      "The object noun correctly retrieves the earlier pointed-item pattern.",
      "The written location fragment matches the complete recording.",
      "The spoken object fragment is sufficient for the shared screen.",
    ],
    retry: [
      "Use the travel roster to recover which named participant the reply must identify.",
      "Keep the two roster referents distinct and select the school entry's name.",
      "The slot asks for a human category, not an unrelated object.",
      "Supply only the role that completes the model's final information.",
      "Distinguish a person title from an unrelated travel item.",
      "Diagnose the displayed object as wrong for the participant field before choosing the human repair.",
      "The referent is already visible on the phone, so answer with the matching animal noun only.",
      "Recall the pointed object rather than selecting another travel item.",
      "Listen again for the location noun; no fuller clause has been introduced yet.",
      "Recall the object on the shared screen and say only that fragment.",
    ],
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
      'An occupation card and a photograph identify one person. Choose the complete identification.',
      'A second occupation card identifies another person. Choose the complete identification.',
      'Arrange the supplied noun and polite ending into one complete predicate.',
      'A map highlights one building. Complete the polite noun-predicate reply.',
      'Transform the displayed noun fragment into a complete polite predicate.',
      'The displayed candidate names the wrong item. Choose the complete repair.',
      'A professional points to one desk object. Choose the complete contextual response.',
      'A customer enters and the role is recoverable. Retrieve the complete polite reply.',
      'Listen once, then choose the complete noun predicate that matches the recording.',
      'Recall the earlier event card and say its complete polite predicate from memory.',
    ],
    accepted: [
      "The complete predicate identifies the photographed person and closes with the polite copula.",
      "The selected clause identifies the second person rather than leaving a bare occupation noun.",
      "The supplied noun precedes the copula in the only grammatical ordering.",
      "The building noun forms a complete polite identification in the map context.",
      "The former fragment now functions as a complete affirmative noun predicate.",
      "The repair names the displayed item and supplies the required predicate ending.",
      "The desk object, not the professional, is the recoverable referent of the reply.",
      "The customer role is recovered and expressed as a complete predicate.",
      "The written noun predicate matches both the noun and ending in the recording.",
      "The spoken response recalls the event and supplies a complete polite predicate.",
    ],
    retry: [
      "Choose the full identification; a bare occupation noun is only a fragment here.",
      "Check that the person identification is complete rather than an unattached role noun.",
      "Keep the noun before the copula; reversing those chunks is not a Japanese predicate.",
      "Use the highlighted building as the predicate noun and close the clause politely.",
      "Preserve the source noun and add only the affirmative predicate ending.",
      "The displayed predicate names the wrong item; replace its noun while preserving a complete ending.",
      "Follow what the professional points to rather than naming the professional's role.",
      "Retrieve the entering person's role and make it a complete noun predicate.",
      "Listen for the initial noun and the final copula before choosing.",
      "Produce the remembered predicate from memory rather than reading a visible option.",
    ],
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
      "As for Yamada—they're a person.",
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
      "Uses Yamada as an explicit hanging topic before a broad human category.",
      "Uses a relationship noun as an explicit hanging topic.",
      "Omits the recoverable speaker and leaves a complete predicate.",
      "Omits the recoverable friend while preserving the identity.",
      "Retrieves a visible group from the photo context.",
      "Shows a general role answer with a recoverable person.",
      "Shows a title answer with a recoverable person.",
      "Shows that omission depends on an established referent.",
    ],
    instructions: [
      'The speaker is reintroduced before a pause. Choose the identity that matches the shared facts.',
      'A named participant is reintroduced before a pause. Choose the human-category statement with explicit reference.',
      'Arrange the named participant before the pause and the identity information after it.',
      'A relationship referent is explicit. Complete the broader category reply required by the context.',
      'Transform the explicit-reference source into the shorter reply licensed by shared context.',
      'The displayed candidate misidentifies the highlighted animal. Choose the contextual repair.',
      'The object under discussion is recoverable. Choose the sufficient complete predicate.',
      'The place under discussion is recoverable. Retrieve the sufficient complete predicate.',
      'Listen to the counter reply, then choose the complete predicate you hear.',
      'Recall the building from the earlier route and say the complete predicate from memory.',
    ],
    accepted: [
      "The hanging topic names the speaker, and the final predicate matches the shared profile.",
      "The explicit participant and human-category predicate form a natural spoken hanging-topic utterance.",
      "The named participant precedes the pause, while the identifying predicate remains final.",
      "The explicit relationship referent is followed by the broader role supplied as new information.",
      "The shorter predicate preserves the source fact because the referent remains recoverable.",
      "The repair identifies the highlighted animal instead of the erroneous object category.",
      "The object predicate is sufficient because the discourse referent is already established.",
      "The location predicate retrieves a known place without restating its referent.",
      "The written predicate exactly matches the recorded counter reply.",
      "The spoken predicate retrieves the building while leaving the shared referent unspoken.",
    ],
    retry: [
      "Use the shared speaker profile after the pause; do not assign an unrelated role.",
      "Retain the named participant before the pause when the task requests explicit reference.",
      "Put the participant before the pause and the identity information in predicate-final order.",
      "Keep the relationship referent explicit and supply the category requested by the context.",
      "Remove only the recoverable referent; the source predicate fact must stay unchanged.",
      "Diagnose the displayed category as wrong, then identify the pictured animal.",
      "The referent is recoverable, but the predicate still has to name the correct object.",
      "Retrieve the place established by the prior scene rather than a portable object.",
      "Listen again for both the counter noun and the complete predicate ending.",
      "Recall the route's building and say the predicate without reading either choice.",
    ],
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
      "As for the nurse, it is Tanaka.",
      "As for the lawyer, by contrast, it is Yamada.",
      "Tokyo is a city.",
      "Returning to Kyoto: it is a city.",
      "As for Osaka, the correct category is city.",
      "As for the international student, it is my friend.",
      "As for the photograph, it shows my family.",
      "As for the photograph, it shows a cat.",
      "As for the ticket, it is for Osaka.",
    ],
    purposes: [
      "Establishes the speaker as a discourse topic.",
      "Uses an occupation as an established roster topic.",
      "Gives は a genuine contrastive reading with a second roster role.",
      "Introduces Tokyo in a simple category comment.",
      "Resumes Kyoto as a previously mentioned topic.",
      "Uses は to correct Osaka's category without treating it as focused new subject.",
      "Uses an established role as topic and supplies its person value.",
      "Uses a photograph as topic and identifies the pictured group as family.",
      "Uses a photograph as topic and identifies its depicted animal.",
      "Uses a counter document as topic in a contextually recoverable destination choice.",
    ],
    instructions: [
      'A photograph is the established discourse anchor. Choose the comment matching what it depicts.',
      'Choose the version with explicit topic marking rather than a spoken pause.',
      'Arrange the photograph chunk before its marker and place the identifying comment last.',
      'The speaker is already under discussion. Choose the role statement consistent with the profile.',
      'Transform a hanging-topic statement into an explicitly topic-marked statement without changing the fact.',
      'The displayed statement conflicts with the established profile. Choose the factual repair.',
      'A familiar relationship is already the topic. Choose the profile comment that fits.',
      'A household animal is already under discussion. Retrieve the relationship comment established earlier.',
      'Listen once to the recorded topic sentence, then choose the exact matching comment.',
      'Recall the earlier ticket scenario and say the complete topic sentence from memory.',
    ],
    accepted: [
      "The marked photograph is the discourse anchor and the final comment identifies what it depicts.",
      "The explicit topic marker, pronounced wa, replaces the spoken pause without changing the fact.",
      "The photograph remains the topic and the city value stays in the final predicate.",
      "The speaker is the established topic and the selected role matches the shared profile.",
      "The transformation preserves Tanaka's occupation while replacing the hanging pause with topic marking.",
      "The repair restores Yamada's recorded occupation under the established topic.",
      "The familiar relationship stays topical and receives the correct profile comment.",
      "The household animal is treated contrastively while retaining its established relationship.",
      "The recorded sentence identifies the pictured participant under an explicit topic.",
      "The spoken counter sentence keeps the document topical and the selected value final.",
    ],
    retry: [
      "Keep the established anchor before the topic marker and place its identifying comment last.",
      "Choose explicit topic marking, not the otherwise possible spoken hanging-topic pause.",
      "Use the photograph as the topic; reversing topic and identifying value changes the message.",
      "Continue the speaker topic with the role from the shared profile.",
      "Change only the discourse packaging; Tanaka's occupation must remain the same.",
      "The candidate conflicts with the roster, so repair Yamada's role rather than the topic structure.",
      "Retrieve the established friend's profile before selecting the comment.",
      "Use the relationship established for the animal, not a human occupation.",
      "Listen again for both the topic noun and its final identifying value.",
      "Recall the counter scenario and produce the full topic-comment sentence from memory.",
    ],
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
      "As for Tanaka, they are the nurse.",
      "As for Yamada, they are the lawyer.",
      "As for me, I am a university student.",
      "As for the university student, it is me.",
    ],
    purposes: [
      "Introduces Tanaka as the newly selected nurse.",
      "Uses が for corrective focus on Yamada as the lawyer.",
      "Selects the friend as the international student.",
      "Identifies Satou from the focused student role.",
      "Identifies Suzuki from the focused teacher role.",
      "Uses the doctor role as an established topic and identifies Mari.",
      "Repackages Tanaka's nurse fact as an established topic for direct comparison with が.",
      "Repackages Yamada's lawyer fact as an established topic for direct comparison with が.",
      "Retrieves the speaker as an established topic.",
      "Uses the university-student role as an established topic and identifies the speaker.",
    ],
    instructions: [
      'A photograph highlights a newly selected person. Choose the identification that answers the open slot.',
      'One person is already the discourse topic. Choose the statement that continues that topic.',
      'Arrange the newly selected person before the focused-subject marker and keep the identity predicate final.',
      'One person is already under discussion. Complete the continuing identity comment.',
      'Repackage the same identity fact from a spoken hanging topic into a focused corrective answer.',
      'The candidate selects the wrong person for an established role. Choose the factual and discourse repair.',
      'An occupational role is already the topic. Choose the person value established by the roster.',
      'Retrieve the earlier role-as-topic pattern and apply it to the next roster entry.',
      'Listen for an established role followed by its person value, then choose the exact statement.',
      'Recall the focused self-identification from the registration scene and say it from memory.',
    ],
    accepted: [
      "The newly selected person receives focus marking and matches the photograph's open identity slot.",
      "The established person continues as topic rather than being presented as new focus.",
      "The selected person precedes the focus marker and the occupation remains predicate-final.",
      "The continuing person topic receives the profession recorded in the roster.",
      "The corrective answer focuses the person who actually holds the established role.",
      "The repair replaces the wrong person and resumes the established role as topic.",
      "The occupation is the established topic and Tanaka supplies its recorded person value.",
      "The earlier role-as-topic pattern correctly retrieves Yamada as the lawyer.",
      "The written sentence matches the recording's established-role information structure.",
      "The spoken self-identification focuses the speaker as the missing person value.",
    ],
    retry: [
      "Use focus marking for the person filling the open slot, then check the roster identity.",
      "The person is already under discussion, so continue that topic instead of refocusing it.",
      "Arrange the same person, marker, and occupation chunks; do not reverse identity and role.",
      "Continue the established person and select the profession assigned in the roster.",
      "Preserve Suzuki's teacher fact while changing the hanging-topic source into corrective focus.",
      "The displayed candidate names the wrong role holder; repair both the person and discourse packaging.",
      "Keep the occupation topical and retrieve its person value from the roster.",
      "Apply the role-topic pattern to the lawyer entry rather than selecting an unrelated doctor.",
      "Listen for whether the role is established or the person is newly focused before choosing.",
      "Recall the registration's open person slot and produce the focused answer from memory.",
    ],
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
      'Another professional has just been mentioned. Choose the statement adding the named parent with the same role.',
      'A parallel profession is already active in the discourse. Choose the statement that adds the named parent.',
      'Arrange the possessor and kinship noun as one phrase before the additive relation and final predicate.',
      'Complete the parallel-family statement while keeping the possessor inside the noun phrase.',
      'Transform the established-topic family statement into an additive statement without changing the fact.',
      'The candidate uses a focused-subject relation where an additive relation is required. Choose the repair.',
      'A parallel role was just mentioned. Choose the respectful kinship statement that adds another person.',
      'Retrieve the additive family pattern for the next respectful kinship term.',
      'Listen for a possessor plus respectful kinship head, then choose the exact phrase.',
      'Recall the respectful kinship phrase from the earlier family card and say it from memory.',
    ],
    accepted: [
      "The named possessor stays before the kinship head, and the new family member is added to the shared role.",
      "The respectful kinship phrase is intact and the additive marker links it to the parallel profession.",
      "The possessor precedes the kinship head, after which the additive relation and predicate follow.",
      "The speaker's kinship phrase remains intact while the parallel profession is added.",
      "The transformation changes established topic marking to an additive relation without changing the fact.",
      "The repair replaces inappropriate focus with the additive relation required by the prior statement.",
      "The respectful third-person kinship phrase adds another holder of the established role.",
      "The second respectful kinship phrase continues the additive professional set.",
      "The written phrase matches the recorded possessor and respectful kinship head.",
      "The spoken phrase preserves the named possessor before the respectful kinship noun.",
    ],
    retry: [
      "Keep the named possessor attached to the kinship noun and use addition only for the parallel role.",
      "Do not turn the parallel family member into a mere topic; preserve the additive relation.",
      "Use the same chunks in modifier–head order before adding the profession predicate.",
      "Keep the speaker as possessor inside the noun phrase before expressing the parallel role.",
      "Preserve the family fact and change only topic marking into additive marking.",
      "The context already contains a parallel doctor; diagnose focus as the wrong relation.",
      "Use a respectful third-person kinship term with its named possessor, then mark the addition.",
      "Retrieve the additive pattern and keep the respectful kinship reference explicit.",
      "Listen again for the possessor boundary and the respectful head noun.",
      "Recall the full respectful phrase; do not replace possession with subject focus.",
    ],
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
      "Is that Yuki?",
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
      "Uses the respectful third-person name in an identification question.",
    ],
    instructions: [
      'The reply supplies one previously unknown profile value. Choose the open request that elicited it.',
      'A different visitor needs a yes-or-no confirmation of one profile field. Choose the complete question form.',
      'Arrange the two supplied nouns with the bounded-list link between them.',
      'Two form fields are requested. Supply the bounded nominal list as a contextual fragment.',
      'Transform the complete confirmation statement into a confirmation question.',
      'The displayed confirmation contradicts the established profile. Choose the factual repair.',
      'Reject the displayed profile claim and supply the established value in one coherent response.',
      'The listener is asked whether another person shares the stated relationship. Choose the complete question.',
      'Listen once to the recorded relationship statement and choose the exact form you hear.',
      'Recall the missing-relationship request and ask it aloud from memory.',
    ],
    accepted: [
      "The open question requests the missing profile field without supplying a guessed value.",
      "The final question marker turns the complete profile statement into a yes-or-no confirmation.",
      "The bounded list places the nominal link between the two supplied nouns.",
      "The contextual fragment lists the two requested fields rather than making one modify the other.",
      "The transformation preserves the confirmation content and changes the statement into a question.",
      "The repair restores the established profile value while retaining an affirmative response.",
      "The correction rejects the false claim and supplies the established value in the same turn.",
      "The question asks whether the listener shares the stated relationship with Yuki.",
      "The selected written statement matches the relationship and particle heard in the recording.",
      "The spoken open question asks for the missing person in the relationship.",
    ],
    retry: [
      "Choose an open information request; a yes-or-no profile guess cannot fill this slot.",
      "Keep the complete statement intact and add the question marker only at the end.",
      "Use exactly the same two noun chunks and keep the listing relation between them.",
      "The task requests two peer fields, not a possessive noun phrase.",
      "Preserve the confirmation expression and change only its sentence force.",
      "The displayed value conflicts with the ledger; select the affirmative repair with the established value.",
      "A correction needs both rejection and the ledger's replacement value.",
      "Use the companion relation inside a complete question, not a topic statement.",
      "Listen again for the relation marker; the possessive alternative expresses a different relation.",
      "Recall the open relationship request rather than producing a topic assertion.",
    ],
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
  "noun-yuki-san-meaning": "Yuki (respectful third-person reference)",
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
  "sentence-foundations-1-example-1-context": 'A group photograph makes the speaker recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-1-example-2-context": 'A registration field makes the requested role recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-1-example-3-context": 'A classroom scene makes the requested title recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-1-example-4-context": 'A visible picture makes the animal referent recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-1-example-5-context": 'A shared map makes the location field recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-1-example-6-context": 'The visible surroundings make the scene referent recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-1-example-7-context": 'A shared object request makes the missing field recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-1-example-8-context": 'A route card makes the destination field recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-1-example-9-context": 'A shared screen makes the object field recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-1-example-10-context": 'A counter exchange makes the requested document recoverable; the spoken reply is only a fragment.',
  "sentence-foundations-2-example-1-context": 'A shared photograph makes the requested name recoverable; one name is a sufficient fragment.',
  "sentence-foundations-2-example-2-context": 'A second photograph establishes a different referent; one name is a sufficient fragment.',
  "sentence-foundations-2-example-3-context": 'A visible category field makes the requested category recoverable; one noun is sufficient.',
  "sentence-foundations-2-example-4-context": 'The photographed person is already shared, so the reply omits that referent.',
  "sentence-foundations-2-example-5-context": 'The registration field is already shared, so the reply omits the full question.',
  "sentence-foundations-2-example-6-context": 'The classroom participant is already shared, so the reply omits that referent.',
  "sentence-foundations-2-example-7-context": 'The pictured animal is already shared, so the reply omits the full identification.',
  "sentence-foundations-2-example-8-context": 'The pointed object is already shared, so the reply omits the full identification.',
  "sentence-foundations-2-example-9-context": 'The mapped location is already shared, so the reply omits the full identification.',
  "sentence-foundations-2-example-10-context": 'The screen field is already shared, so the reply omits the full identification.',
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
  "sentence-foundations-4-example-3-context": "Yamada is reintroduced as a spoken hanging topic; the broad human category remains the final predicate.",
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
