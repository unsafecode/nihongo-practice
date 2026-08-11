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
      "Me—a student. (spoken self-introduction fragment)",
      "Grandmother—a teacher. (photo-caption fragment)",
      "Photograph—family. (selection-note fragment)",
      "Morning—school. (schedule-note fragment)",
      "Trip—the sea. (itinerary fragment)",
      "Phone—grandmother. (routing-note fragment)",
      "Key—home. (matching-note fragment)",
      "Ticket—trip. (counter-note fragment)",
      "Bread—morning. (breakfast-note fragment)",
      "A cold—home. (care-note fragment)",
    ],
    purposes: [
      "Models a natural two-chunk self-introduction before the copula lesson.",
      "Models a person-plus-role photo caption.",
      "Models a media label followed by its selected content.",
      "Models time context followed by the final schedule item.",
      "Models an itinerary heading followed by its destination value.",
      "Models a routing label followed by the intended person.",
      "Models an object cue followed by its matching place.",
      "Models a document cue followed by its practical purpose.",
      "Models a food cue followed by its meal-time slot.",
      "Models a condition cue followed by the recoverable care location.",
    ],
    instructions: [
      'A photograph label needs the highlighted participant in its final slot. Choose the fitting fragment.',
      'A school label needs the matching role in its final slot. Choose the coherent fragment.',
      'A call-routing label needs the intended person in its final slot. Choose the coherent fragment.',
      'A photograph label needs the pictured group in its final slot. Supply the contextual fragment.',
      'A school inventory label needs its missing object. Choose the coherent fragment.',
      'The displayed call-routing note ends with the wrong value. Choose the repair.',
      'A key-matching label needs its associated place. Choose the coherent fragment.',
      'A ticket label needs its intended purpose. Retrieve the coherent fragment.',
      'Listen to the complete breakfast-note fragment, then choose its written match.',
      'Recall the care-note situation and say the full two-chunk fragment from memory.',
    ],
    accepted: [
      "The fragment identifies the highlighted participant without pretending to be a full clause.",
      "The selected role noun fills the requested field as one intact chunk.",
      "The final person title completes the call-routing fragment.",
      "The family noun completes the photograph label as one coherent fragment.",
      "The object fragment completes the checklist without adding unrelated material.",
      "The repair replaces the unrelated final value with the intended call recipient.",
      "The place value completes the key-matching fragment.",
      "The purpose value completes the ticket fragment.",
      "The written two-chunk fragment matches the complete breakfast recording.",
      "The spoken two-chunk fragment preserves the care-note order.",
    ],
    retry: [
      "Use the highlighted participant, not another person in the same scene.",
      "Fill a role field with a role noun rather than an event noun.",
      "Choose the person title required by the call label, not a weather value.",
      "The photograph label asks for the pictured group, not one unrelated person.",
      "Return to the missing checklist object and reject the event label.",
      "Treat the displayed routing value as the error, then select the intended person.",
      "Keep the key cue first and select its associated place for the final slot.",
      "Keep the ticket cue first and retrieve its purpose for the final slot.",
      "Listen to both chunks again rather than matching only one noun.",
      "Recall both chunks and their order; do not read a written choice aloud.",
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
      "Photograph—Tanaka. (explicit-context fragment)",
      "Tanaka. (the photograph label is recoverable)",
      "Photograph—Yamada. (explicit-context fragment)",
      "Yamada. (the photograph label is recoverable)",
      "Grandmother—a person. (explicit-category fragment)",
      "A person. (the pictured referent is recoverable)",
      "School—student. (explicit-role fragment)",
      "Student. (the school field is recoverable)",
      "Phone—teacher. (explicit-routing fragment)",
      "Teacher. (the phone field is recoverable)",
    ],
    purposes: [
      "States the photograph field and Tanaka value together.",
      "Pairs with the prior item to show omission of the photograph field.",
      "States a second photograph field and Yamada value together.",
      "Pairs with the prior item to show omission with a different referent.",
      "States the visible person and its broad category together.",
      "Pairs with the prior item to omit only the recoverable person.",
      "States the school field and role value together.",
      "Pairs with the prior item to omit the shared school field.",
      "States the phone field and routed role together.",
      "Pairs with the prior item to omit the shared phone field.",
    ],
    instructions: [
      'The explicit photograph label is already shared. Choose the sufficient remaining name.',
      'A second explicit photograph label is already shared. Choose its sufficient remaining name.',
      'A category card asks which participant is highlighted. Choose the contextual fragment.',
      'The explicit school-role pair is shared. Choose the sufficient final role.',
      'The explicit phone-routing pair is shared. Choose the sufficient final role.',
      'An explicit photograph pair ends with an unrelated object. Choose the human repair.',
      'An explicit photograph pair is shared. Choose the sufficient animal value.',
      'An explicit school-object pair is shared. Retrieve the sufficient object value.',
      'A key cue is shown. Listen for its paired place, then choose the sufficient value.',
      'Recall the item shown on the earlier screen and say only the sufficient fragment.',
    ],
    accepted: [
      "The photograph field is recoverable, so the matching name alone is sufficient.",
      "The second photograph field licenses its different one-name reply.",
      "The category noun answers the open identification slot without extra material.",
      "The school field is recoverable and the selected role remains as final information.",
      "The phone field is recoverable and the selected title remains as final information.",
      "The repair replaces the unrelated object with the person required by the photograph.",
      "The animal value is sufficient because the photograph field is already shared.",
      "The object value correctly retrieves the explicit school-object pair.",
      "The written place value matches the recorded word paired with the key cue.",
      "The spoken object fragment is sufficient for the shared screen.",
    ],
    retry: [
      "Remove only the shared photograph field and preserve its matching name.",
      "Keep the two photograph pairs distinct and preserve the second name.",
      "The slot asks for a human category, not an unrelated object.",
      "Omit the shared school field and supply only its role value.",
      "Omit the shared phone field and keep the person title, not a travel item.",
      "Diagnose the final object as wrong for the photograph pair before choosing the person.",
      "The photograph field is already visible, so answer with its animal value only.",
      "Recall the object paired with the explicit school field.",
      "Listen again for the place word paired with the visible key cue.",
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
      'A name card and photograph identify one person. Choose the complete identification.',
      'A second name card identifies another person. Choose the complete identification.',
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
    title: "Modifier order and complete short sentences",
    objective:
      "Place a name before its title and build complete short noun predicates without copying English order.",
    main:
      "Japanese modifiers come before the noun they describe. A bare name can stand before a title, while a complete short noun predicate keeps its identifying noun before です.",
    construction:
      "For a name-title unit, place the bare name first and the title second. For a complete short predicate, place the identifying noun before です.",
    constraints:
      "The name-title unit is a bounded modifier-head model. Possessive の and productive noun modification begin in TQ3.",
    commonError:
      "Do not reverse title and name, insert さん before せんせい, or put です before its noun.",
    nearestContrast:
      "SF2 showed what context can omit; SF4 shows internal modifier-head order and a complete short predicate.",
    recap:
      "Retrieve the bare names and student roles; put a name before せんせい and an identifying noun before です.",
    translations: [
      "This is Professor Sakura.",
      "This is Professor Ken.",
      "It is a book.",
      "It is a ticket.",
      "As for me—I'm a university student.",
      "As for my friend—they're an international student.",
      "As for Sora—they're a teacher.",
      "As for Mika—they're a teacher.",
      "As for Tanaka—they're a nurse.",
      "As for Yamada—they're a lawyer.",
    ],
    purposes: [
      "Introduces the bare-name-before-title model.",
      "Retrieves the modifier order with a second name.",
      "Shows a complete short object predicate.",
      "Shows another short predicate without English inversion.",
      "Contrasts an explicit referent with its final role predicate.",
      "Keeps a relationship referent distinct from the final role.",
      "Contrasts Sora as a hanging topic with the bounded title unit.",
      "Contrasts a hanging topic with a bounded name-title unit.",
      "Keeps Tanaka separate from the nurse predicate.",
      "Keeps Yamada separate from the lawyer predicate.",
    ],
    instructions: [
      'A staff card requires a bounded name-title unit. Choose the complete identification.',
      'The context requires a title compound rather than a spoken pause. Choose the matching form.',
      'Arrange the supplied name before the title and keep the predicate ending last.',
      'A role card requires a complete short noun predicate. Choose the completed form.',
      'Shorten the explicit-reference source while preserving its final role predicate.',
      'The displayed title unit reverses modifier and head. Choose the ordered repair.',
      'The established friend needs the role recorded in the shared profile. Choose the short predicate.',
      'The shared photograph needs its recorded group value. Retrieve the short predicate.',
      'Listen to the recorded occupation predicate and choose the exact match.',
      'Recall the second professional profile and say its short predicate from memory.',
    ],
    accepted: [
      "The bare name comes before the title and the completed predicate ends correctly.",
      "The selected form is a bounded name-title unit, not a hanging-topic pause.",
      "The supplied chunks preserve name-before-title and predicate-final order.",
      "The role noun now forms a complete short predicate.",
      "The shorter predicate preserves the source fact because the referent remains recoverable.",
      "The repair restores modifier-before-head order inside the title unit.",
      "The international-student predicate matches the established friend.",
      "The family predicate matches the shared photograph.",
      "The written nurse predicate matches the recording.",
      "The spoken lawyer predicate matches the remembered profile.",
    ],
    retry: [
      "Keep the bare name before the title; do not replace the compound with an unrelated role.",
      "Choose the bounded title unit rather than separating the words with a pause.",
      "Use the same chunks and place the name before its title.",
      "A bare role remains a fragment here; choose the form completed by です.",
      "Remove only the recoverable referent; the source predicate fact must stay unchanged.",
      "Diagnose the reversed title unit, then restore modifier-before-head order.",
      "Use the role stored for the friend, not an unrelated title.",
      "Retrieve the group value stored for the photograph.",
      "Listen again for the occupation noun and the complete predicate ending.",
      "Recall the professional profile and produce the predicate without reading a choice.",
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
      "Uses the established student role as topic and identifies Satou.",
      "Uses the established teacher role as topic and identifies Suzuki.",
      "Uses the doctor role as an established topic and identifies Mari.",
      "Repackages Tanaka's nurse fact as an established topic for direct comparison with が.",
      "Repackages Yamada's lawyer fact as an established topic for direct comparison with が.",
      "Retrieves the speaker as an established topic.",
      "Uses the university-student role as an established topic and identifies the speaker.",
    ],
    instructions: [
      'After one roster entry, a new person slot opens. Choose the focused identification that fills it.',
      'One person is already the discourse topic. Choose the statement that continues that topic.',
      'Arrange the newly selected person before the focused-subject marker and keep the identity predicate final.',
      'Apply the established-topic pattern to the next person in the roster.',
      'Repackage the same identity fact from a spoken hanging topic into a focused corrective answer.',
      'The candidate identifies the wrong person in an open role slot. Choose the focused factual repair.',
      'An occupational role is already the topic. Choose the person value established by the roster.',
      'Retrieve the earlier role-as-topic pattern and apply it to the next roster entry.',
      'Listen for an established role followed by its person value, then choose the exact statement.',
      'Recall the focused self-identification from the registration scene and say it from memory.',
    ],
    accepted: [
      "The newly selected person receives focus marking and matches the roster's open slot.",
      "The established person continues as topic rather than being presented as new focus.",
      "The selected person precedes the focus marker and the occupation remains predicate-final.",
      "The next roster person is established as topic and receives the recorded profession.",
      "The corrective answer focuses the person who actually holds the established role.",
      "The repair focuses Suzuki as the newly identified teacher.",
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
      "Preserve Tanaka's nurse fact while changing the hanging-topic source into corrective focus.",
      "The displayed candidate names the wrong role holder; keep が and focus the correct person.",
      "Keep the occupation topical and retrieve its person value from the roster.",
      "Apply the role-topic pattern to the lawyer entry rather than selecting an unrelated doctor.",
      "Listen for whether the role is established or the person is newly focused before choosing.",
      "Recall the registration's open person slot and produce the focused answer from memory.",
    ],
  }),
  ...semanticLessonCopy("topic-questions-3", {
    title: "Noun relations with の, も, and と",
    objective: "Build possessive noun phrases, add parallel items, and express bounded lists or companion relations.",
    main:
      "Between two nouns, の links a possessor or attribute to the following head. も adds a parallel item. と links a bounded noun list or marks a companion relation.",
    construction:
      "Keep the modifier before の and its head after it. Put the added item before も. Put と between listed nouns or after the companion.",
    constraints:
      "の is only possessive or attributive. と is only nominal listing or companion と; quotation and verb argument frames remain later.",
    commonError:
      "Do not reverse the nouns around の, use も without a parallel context, or treat と as a universal English and.",
    nearestContrast:
      "の builds one noun phrase, も adds a parallel participant, and と links peer nouns or a companion.",
    recap:
      "Retrieve the four family terms and the two country names; build one の phrase, one も addition, one と list, and one companion relation.",
    translations: [
      "This is my father.",
      "This is my mother.",
      "This is Tanaka's father (respectful reference).",
      "This is Yamada's mother (respectful reference).",
      "My father is also a teacher.",
      "My mother is also a doctor.",
      "The list is the United States and Italy.",
      "The list is Tokyo and Kyoto.",
      "I am friends with Tanaka.",
      "They are friends with me.",
    ],
    purposes: [
      "Introduces possessive の with the speaker and father.",
      "Changes the head noun while preserving modifier order.",
      "Uses a named possessor without changing the の relation.",
      "Provides a second named possessor for contrast.",
      "Introduces additive も after a parallel profession statement.",
      "Varies the additive predicate with a doctor identity.",
      "Introduces と as a bounded country list.",
      "Applies nominal と to a city list.",
      "Introduces the companion reading with a named person.",
      "Changes perspective while preserving the companion relation.",
    ],
    instructions: [
      'A family card belongs to the speaker. Choose the possessive identification that matches it.',
      'A named family card requires an attributive relation rather than topic marking. Choose the matching form.',
      'Arrange the named possessor before the respectful kinship head.',
      'A parallel profession is established. Complete the additive family statement.',
      'Transform the established-topic family statement into an additive statement without changing the fact.',
      'The displayed family statement uses the wrong noun relation. Choose the repair.',
      'Two country values must remain peer items. Choose the bounded list.',
      'The shared context asks for a companion relation, not possession. Retrieve the matching statement.',
      'Listen to the complete two-city list and choose the exact relation.',
      'Recall the named companion relation and say the complete statement from memory.',
    ],
    accepted: [
      "The speaker stays before の and the family head follows it.",
      "The named possessor and respectful kinship head form the intended attributive phrase.",
      "The supplied chunks preserve possessor-before-head order.",
      "The mother is added to the established doctor set with も.",
      "The transformation changes established topic marking to an additive relation without changing the fact.",
      "The repair replaces the subject relation with the required attributive relation.",
      "The two countries remain peer items linked by bounded-list と.",
      "The companion relation is distinct from a possessive noun phrase.",
      "The written city list matches the nominal relation in the recording.",
      "The spoken statement preserves the named companion relation.",
    ],
    retry: [
      "Keep the speaker before の and the family head after it.",
      "Choose the attributive relation; topic marking assigns a different structure.",
      "Use the same chunks and keep the named possessor first.",
      "Use も only after the parallel profession has been established.",
      "Preserve the family fact and change only topic marking into additive marking.",
      "The candidate identifies a subject instead of a kinship relation; restore の.",
      "Keep と between the two peer country nouns; の would create modification.",
      "Use companion と, not possessive の, for the shared relationship.",
      "Listen again for the link between both city nouns.",
      "Recall the companion statement without reading either written choice.",
    ],
  }),
  ...semanticLessonCopy("topic-questions-4", {
    title: "Questions and interactional endings",
    objective: "Ask content and yes-no questions with か, seek shared agreement with ね, and present an update with よ.",
    main:
      "Sentence-final か marks a content or yes-no question. Final ね invites or acknowledges shared agreement, while よ presents information as an update for the listener.",
    construction:
      "Complete the noun predicate first, then place か, ね, or よ at the end according to the interactional goal.",
    constraints:
      "Use one final interactional ending at a time. ね does not simply soften every sentence, and よ does not turn a statement into a question.",
    commonError:
      "Do not put か inside the noun phrase, answer a rejected value with はい, or use ね when the listener is being given a correction.",
    nearestContrast:
      "か asks, ね seeks shared alignment, and よ marks an assertive update. Earlier と remains a nominal or companion relation.",
    recap:
      "Ask だれですか and なまえはなんですか, confirm a country, then contrast a shared ね response with an informative よ correction.",
    translations: [
      "Who is it?",
      "Is the name Yuki?",
      "Is your country Italy?",
      "What is your name?",
      "Yes—I'm Yuki, just so you know.",
      "No—it's Italy.",
      "It is Italy, right?",
      "Is that Yuki?",
      "That's right, isn't it?",
    ],
    purposes: [
      "Introduces sentence-final か in an open identity question.",
      "Checks a name with the same completed-question procedure.",
      "Uses か for a practical country confirmation.",
      "Uses なん only inside a natural open question.",
      "Introduces よ as an assertive identity update.",
      "Uses いいえ plus よ for a corrected country value.",
      "Introduces ね for shared country confirmation.",
      "Uses the respectful third-person name in an identification question.",
      "Uses ね in a short acknowledgment of shared understanding.",
    ],
    instructions: [
      'The reply supplies one previously unknown profile value. Choose the open request that elicited it.',
      'A different visitor needs a yes-or-no confirmation of one profile field. Choose the complete question form.',
      'Arrange the supplied identity statement and place the question marker after the completed predicate.',
      'A photograph needs a yes-no identity confirmation rather than an open request. Choose the question.',
      'Transform the complete confirmation statement into a confirmation question.',
      'The displayed confirmation contradicts the established profile. Choose the factual repair.',
      'The speaker seeks shared confirmation of an established value. Choose the matching ending.',
      'An open question has just been answered with new information. Choose the assertive update.',
      'Listen for whether the short acknowledgment seeks alignment or supplies an update.',
      'Recall the open profile request and ask it aloud from memory.',
    ],
    accepted: [
      "The open question requests the missing profile field without supplying a guessed value.",
      "The final question marker turns the complete profile statement into a yes-or-no confirmation.",
      "The same identity chunks form a question only when か follows the completed predicate.",
      "The respectful name forms the intended yes-no identification question.",
      "The transformation preserves the confirmation content and changes the statement into a question.",
      "The correction rejects the false value with いいえ and supplies Italy as an update.",
      "Final ね invites shared confirmation of the established country.",
      "Final よ presents Yuki's identity as new information for the listener.",
      "The selected acknowledgment matches the interactional ending in the recording.",
      "The spoken open question asks for the missing profile value.",
    ],
    retry: [
      "Choose an open information request; a yes-or-no profile guess cannot fill this slot.",
      "Keep the complete statement intact and add the question marker only at the end.",
      "Use the same chunks and keep か after the completed predicate.",
      "Choose the respectful-name confirmation rather than the open alternative.",
      "Preserve the confirmation expression and change only its sentence force.",
      "The displayed value is denied, so the repair needs いいえ plus the established value and よ.",
      "Use ね for shared alignment; よ would present the value as a new update.",
      "Use よ after the answer when the listener is receiving new information.",
      "Listen again for the final ending and its interactional force.",
      "Recall the open request rather than reading a visible answer.",
    ],
  }),
  "topic-questions-4-clarification-dialogue-outcome":
    "The speakers learn Yuki's name, confirm Italy, and confirm the friendship with Tanaka.",
  "topic-questions-4-clarification-dialogue-turn-1-translation": "What is your name?",
  "topic-questions-4-clarification-dialogue-turn-1-purpose":
    "Opens the exchange with an information question.",
  "topic-questions-4-clarification-dialogue-turn-2-translation": "I'm Yuki.",
  "topic-questions-4-clarification-dialogue-turn-2-purpose":
    "Answers the open question with assertive-update よ.",
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
    "Closes the clarification with an assertive confirmation.",
  "noun-toshi-meaning": "city",
  "name-sakura-meaning": "Sakura (name used before a title)",
  "name-ken-meaning": "Ken (name used before a title)",
  "name-mika-meaning": "Mika (name used before a title)",
  "name-sora-meaning": "Sora (name used before a title)",
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
  "sentence-foundations-1-example-1-context": "A casual self-introduction uses two spoken noun chunks; it is still a fragment.",
  "sentence-foundations-1-example-2-context": "A photo caption places the person before the final role slot.",
  "sentence-foundations-1-example-3-context": "A selection note places the media label before the pictured group.",
  "sentence-foundations-1-example-4-context": "A schedule note places the time context before the final destination slot.",
  "sentence-foundations-1-example-5-context": "An itinerary places the trip heading before the selected place.",
  "sentence-foundations-1-example-6-context": "A routing note places the channel before the intended person.",
  "sentence-foundations-1-example-7-context": "A matching note places the object cue before its associated place.",
  "sentence-foundations-1-example-8-context": "A counter note places the document before its purpose.",
  "sentence-foundations-1-example-9-context": "A breakfast note places the food cue before its time slot.",
  "sentence-foundations-1-example-10-context": "A care note places the condition before the recoverable location.",
  "sentence-foundations-2-example-1-context": "The photograph field and Tanaka value are both explicit.",
  "sentence-foundations-2-example-2-context": "The same photograph field is recoverable, so only Tanaka remains.",
  "sentence-foundations-2-example-3-context": "A second photograph field and Yamada value are explicit.",
  "sentence-foundations-2-example-4-context": "The second photograph field is recoverable, so only Yamada remains.",
  "sentence-foundations-2-example-5-context": "The pictured person and broad human category are both explicit.",
  "sentence-foundations-2-example-6-context": "The pictured person is recoverable, so only the category remains.",
  "sentence-foundations-2-example-7-context": "The school field and student role are both explicit.",
  "sentence-foundations-2-example-8-context": "The school field is recoverable, so only the role remains.",
  "sentence-foundations-2-example-9-context": "The phone field and routed teacher role are both explicit.",
  "sentence-foundations-2-example-10-context": "The phone field is recoverable, so only the title remains.",
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
  "sentence-foundations-4-example-1-context": "The bare name Sakura modifies the following title in one bounded unit.",
  "sentence-foundations-4-example-2-context": "The bare name Ken supplies a second name-before-title model.",
  "sentence-foundations-4-example-3-context": "The book noun precedes the polite ending in a complete short predicate.",
  "sentence-foundations-4-example-4-context": "The ticket noun supplies a second complete short predicate.",
  "sentence-foundations-4-example-5-context": "The speaker is explicit before a pause; university student remains final.",
  "sentence-foundations-4-example-6-context": "The friend is explicit before a pause; international student remains final.",
  "sentence-foundations-4-example-7-context": "Sora before a pause contrasts with the bounded name-title unit.",
  "sentence-foundations-4-example-8-context": "Mika before a pause contrasts with the bounded name-title unit.",
  "sentence-foundations-4-example-9-context": "Tanaka is explicit and nurse is the final predicate.",
  "sentence-foundations-4-example-10-context": "Yamada is explicit and lawyer is the final predicate.",
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
