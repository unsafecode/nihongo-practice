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
      "Family—photograph. (album-note fragment)",
      "Morning—school. (schedule-note fragment)",
      "Trip—the sea. (itinerary fragment)",
      "Phone—grandmother. (routing-note fragment)",
      "Key—home. (matching-note fragment)",
      "Ticket—trip. (counter-note fragment)",
      "Photograph—Sakura. (identity-note fragment)",
      "Photograph—Ken. (identity-note fragment)",
    ],
    purposes: [
      "Models a natural two-chunk self-introduction before the copula lesson.",
      "Models a person-plus-role photo caption.",
      "Models an album heading followed by its media type.",
      "Models time context followed by the final schedule item.",
      "Models an itinerary heading followed by its destination value.",
      "Models a routing label followed by the intended person.",
      "Models an object cue followed by its matching place.",
      "Models a document cue followed by its practical purpose.",
      "Models a photograph cue followed by Sakura's name.",
      "Models a second photograph cue followed by Ken's name.",
    ],
    instructions: [
      'A group photograph places the speaker-badge wearer in the foreground. Choose the matching fragment.',
      'A school label needs the matching role in its final slot. Choose the coherent fragment.',
      'A call-routing label needs the intended person in its final slot. Choose the coherent fragment.',
      'A photograph label needs the pictured group in its final slot. Supply the contextual fragment.',
      'A school inventory label needs its missing object. Choose the coherent fragment.',
      'The displayed call-routing note ends with the wrong value. Choose the repair.',
      'A key-matching label needs its associated place. Choose the coherent fragment.',
      'A ticket label needs its named holder. Retrieve the coherent fragment.',
      'Listen to the complete home-delivery fragment, then choose its written match.',
      'Recall the morning wind-note and say the full two-chunk fragment from memory.',
    ],
    accepted: [
      "The fragment identifies the highlighted participant without pretending to be a full clause.",
      "The selected role noun fills the requested field as one intact chunk.",
      "The final person title completes the call-routing fragment.",
      "The family noun completes the photograph label as one coherent fragment.",
      "The object fragment completes the checklist without adding unrelated material.",
      "The repair replaces the unrelated final value with the intended call recipient.",
      "The school value completes the key-assignment fragment.",
      "The holder name completes the ticket fragment.",
      "The written home-delivery fragment matches the recording.",
      "The spoken morning-wind fragment preserves the cue order.",
    ],
    retry: [
      "Use the highlighted participant, not another person in the same scene.",
      "Fill a role field with a role noun rather than an event noun.",
      "Choose the person title required by the call label, not a weather value.",
      "The photograph label asks for the pictured group, not one unrelated person.",
      "Return to the missing checklist object and reject the event label.",
      "Treat the displayed routing value as the error, then select the intended person.",
      "Keep the key cue first and select its assigned building for the final slot.",
      "Keep the ticket cue first and retrieve its named holder.",
      "Listen to both home-delivery chunks rather than matching one noun.",
      "Recall the morning-wind chunks and their order; do not read a choice.",
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
      "Phone—photograph. (explicit-screen fragment)",
      "Photograph. (the phone field is recoverable)",
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
      "States the phone field and displayed photograph together.",
      "Pairs with the prior item to omit the shared phone field.",
    ],
    instructions: [
      'Transfer the first photograph pair into a two-chunk person-category note.',
      'Transfer the second photograph pair into a different two-chunk person-category note.',
      'The pictured grandmother belongs to the family unit. Choose the matching relationship note.',
      'The school roster asks which person holds the displayed role. Choose the two-chunk note.',
      'A classroom call requests the person’s title; the channel is already visible. Choose the sufficient chunk.',
      'An explicit photograph pair ends with an unrelated object. Choose the human repair.',
      'A photograph visibly shows one animal. Choose the sufficient animal chunk.',
      'A school shelf highlights one reading item. Retrieve the sufficient object chunk.',
      'A key cue is shown. Listen for its paired place, then choose the sufficient value.',
      'Recall the device paired with the displayed photograph and say that fragment from memory.',
    ],
    accepted: [
      "Tanaka is retained and the human category fills the second chunk.",
      "Yamada is retained and the human category fills the second chunk.",
      "Grandmother is related to the family unit; the response names both chunks.",
      "The student role is followed by the speaker identity in the roster note.",
      "The visible call channel is recoverable and the selected title is sufficient.",
      "The repair replaces the unrelated object with the person required by the photograph.",
      "The animal chunk matches the visible photograph context.",
      "The object chunk matches the highlighted school-shelf item.",
      "The written place value matches the recorded word paired with the key cue.",
      "The spoken device label matches the screen pair established earlier.",
    ],
    retry: [
      "Keep Tanaka first and supply the broad person category second.",
      "Keep Yamada first and supply the broad person category second.",
      "Use the family relationship, not an occupational category.",
      "Keep the role first and identify the speaker in the second chunk.",
      "Use the requested person title rather than a family category.",
      "Diagnose the final object as wrong for the photograph pair before choosing the person.",
      "Use the animal visibly grounded by the photograph.",
      "Recall the reading item highlighted on the school shelf.",
      "Listen again for the place word paired with the visible key cue.",
      "Recall the device from the earlier screen pair without reading an option.",
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
      'A campus photograph highlights the school building. Complete the polite noun-predicate reply.',
      'Transform the displayed noun fragment into a complete polite predicate.',
      'A key is displayed, but the candidate names bread. Choose the complete repair.',
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
      "As for Mika—they're a student.",
      "As for Sora—they're a student.",
      "As for Haru—they're a student.",
      "As for Ai—they're a student.",
    ],
    purposes: [
      "Introduces the bare-name-before-title model.",
      "Retrieves the modifier order with a second name.",
      "Shows a complete short object predicate.",
      "Shows another short predicate without English inversion.",
      "Contrasts an explicit referent with its final role predicate.",
      "Keeps a relationship referent distinct from the final role.",
      "Contrasts Mika as a hanging topic with the bounded title unit.",
      "Contrasts Sora as a hanging topic with the bounded title unit.",
      "Contrasts Haru as a hanging topic with the bounded title unit.",
      "Contrasts Ai as a hanging topic with the bounded title unit.",
    ],
    instructions: [
      'A staff card requires a bounded name-title unit. Choose the complete identification.',
      'The context requires a title compound rather than a spoken pause. Choose the matching form.',
      'Arrange the supplied name before the title and keep the predicate ending last.',
      'A role card requires a complete short noun predicate. Choose the completed form.',
      'The profile requests the broadest human category for the visible speaker. Choose the short predicate.',
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
      "The short predicate supplies the requested broad human category.",
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
      "Choose the broad human category, not the narrower student role.",
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
  "noun-gakusei-meaning": "student",
  "noun-sensei-meaning": "teacher; title for a teacher or professional",
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
  "noun-nihon-meaning": "Japan",
  "noun-chuugoku-meaning": "China",
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
      "It is Tokyo. (short answer from shared context)",
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
      "Models a short answer whose referent is grounded by prior context.",
      "Uses a counter document as topic in a contextually recoverable destination choice.",
    ],
    instructions: [
      'A Tokyo skyline photograph establishes the location as discourse topic. Choose the matching comment.',
      'Choose the version with explicit topic marking rather than a spoken pause.',
      'Arrange the photograph chunk before its marker and place the identifying comment last.',
      'The speaker is already under discussion. Choose the role statement consistent with the profile.',
      'Transform a hanging-topic statement into an explicitly topic-marked statement without changing the fact.',
      'The displayed statement conflicts with the established profile. Choose the factual repair.',
      'A familiar relationship is already the topic. Choose the profile comment that fits.',
      'A household animal is already under discussion. Retrieve the relationship comment established earlier.',
      'Listen once to the recorded topic sentence, then choose the exact matching comment.',
      'Recall the destination established for the ticket and say the short answer from memory.',
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
      "The spoken short answer preserves the ticket's established Osaka destination.",
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
      "Recall the counter fact and produce only its destination value from memory.",
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
      'A registration roster opens the person slot for the previously established university-student role. Give the focused identification from memory.',
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
      "Preserve Mari's friend relationship while changing the hanging-topic source into corrective focus.",
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
      "The list is Japan and China.",
      "The list is Tokyo and Kyoto.",
      "I am friends with Tanaka.",
      "This person is my friend.",
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
      'A family card belongs to the named person. Choose the possessive identification that matches it.',
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
      "The named possessor stays before の and the family head follows it.",
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
      "Keep the named possessor before の and the family head after it.",
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
      "Is your country Japan?",
      "What is it?",
      "Yes—I'm Yuki, just so you know.",
      "No—it's Japan.",
      "It is Japan, right?",
      "Are they a student?",
      "That's right, isn't it?",
    ],
    purposes: [
      "Introduces sentence-final か in an open identity question.",
      "Checks a name with the same completed-question procedure.",
      "Uses か for a practical country confirmation.",
      "Uses なん inside a complete open what-question.",
      "Introduces よ as an assertive identity update.",
      "Uses いいえ plus よ for a corrected country value.",
      "Introduces ね for shared country confirmation.",
      "Checks a student role with a completed yes-no question.",
      "Uses ね in a short acknowledgment of shared understanding.",
    ],
    instructions: [
      'The reply supplies one previously unknown profile value. Choose the open request that elicited it.',
      'A different visitor needs a yes-or-no confirmation of one profile field. Choose the complete question form.',
      'Arrange the supplied noun predicate and place the question marker after the completed form.',
      'A photograph needs a yes-no role confirmation rather than an open request. Choose the question.',
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
      "The same noun-predicate chunks form a question only when か follows the completed form.",
      "The role noun forms the intended yes-no identification question.",
      "The transformation preserves the confirmation content and changes the statement into a question.",
      "The correction rejects the false value with いいえ and supplies Japan as an update.",
      "Final ね invites shared confirmation of the established country.",
      "Final よ presents Yuki's identity as new information for the listener.",
      "The selected acknowledgment matches the interactional ending in the recording.",
      "The spoken open question asks for the missing profile value.",
    ],
    retry: [
      "Choose an open information request; a yes-or-no profile guess cannot fill this slot.",
      "Keep the complete statement intact and add the question marker only at the end.",
      "Use the same chunks and keep か after the completed predicate.",
      "Choose the role confirmation rather than the open alternative.",
      "Preserve the confirmation expression and change only its sentence force.",
      "The displayed value is denied, so the repair needs いいえ plus the established value and よ.",
      "Use ね for shared alignment; よ would present the value as a new update.",
      "Use よ after the answer when the listener is receiving new information.",
      "Listen again for the final ending and its interactional force.",
      "Recall the open request rather than reading a visible answer.",
    ],
  }),
  "topic-questions-4-clarification-dialogue-outcome":
    "The speakers learn Yuki's name, confirm Japan, and confirm the friendship with Tanaka.",
  "topic-questions-4-clarification-dialogue-turn-1-translation": "Is that Yuki?",
  "topic-questions-4-clarification-dialogue-turn-1-purpose":
    "Opens with a respectful identity confirmation.",
  "topic-questions-4-clarification-dialogue-turn-2-translation": "Yes, I'm Yuki.",
  "topic-questions-4-clarification-dialogue-turn-2-purpose":
    "Confirms the identity directly without adding a new role.",
  "topic-questions-4-clarification-dialogue-turn-3-translation":
    "Is Yuki's country Japan?",
  "topic-questions-4-clarification-dialogue-turn-3-purpose":
    "Explicitly establishes Yuki's country as topic and asks for confirmation.",
  "topic-questions-4-clarification-dialogue-turn-4-translation":
    "Yes, it is Japan.",
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
  "name-haru-meaning": "Haru (name used before a title)",
  "name-ai-meaning": "Ai (name used before a title)",
  "noun-yuki-meaning": "Yuki",
  "noun-yuki-san-meaning": "Yuki (respectful third-person reference)",
};

const POLITE_VERBS_COPY_EN: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("polite-verbs-1", {
    title: "Dictionary forms are lookup forms",
    objective:
      "Recognize a verb lemma and the final predicate item without assigning it a tense.",
    main:
      "A dictionary form is the stable lookup form of a verb. Here it names the action lexeme; it does not by itself label an English-style present tense.",
    construction:
      "Read the complete lemma, keep it as one predicate item, and use the preceding scene label only as a recognition cue.",
    constraints:
      "These cards are metalinguistic labels, not productive action sentences. Argument particles and polite endings come later.",
    commonError:
      "Do not call every dictionary form “present,” and do not infer a verb class from one final sound.",
    nearestContrast:
      "A noun card names a participant or thing; a verb lemma identifies the predicate lexeme for an action.",
    recap:
      "Retrieve かく, よむ, のむ, かう, はたらく, and あそぶ as complete lookup lemmas.",
    translations: [
      "かく is shown as a headword form.",
      "よむ is identified as a dictionary form.",
      "のむ is the base lemma.",
      "The headword is かう.",
      "The dictionary form is はたらく.",
      "The base lemma is あそぶ.",
      "かく is identified as the predicate.",
      "よむ is identified as a verb.",
      "はたらく can occupy the predicate-final slot.",
      "The predicate item is あそぶ.",
    ],
    purposes: [
      "Presents a complete lookup form, not a tense.",
      "Keeps the full lemma intact for lookup.",
      "Separates lemma identity from time reference.",
      "Shows an explicit metalinguistic label before the verb.",
      "Recognizes the longer verb as one lemma.",
      "Completes the six authored lookup lemmas.",
      "Names the verb's sentence role without making a bare pseudo-sentence.",
      "Uses an explicit grammatical analysis label.",
      "Recognizes the complete predicate item.",
      "Contrasts a predicate analysis with lookup analysis.",
    ],
    instructions: [
      "The highlighted item fills the final blank in a model clause. Choose its matching annotation.",
      "A librarian is filing the displayed card at the top of a verb entry. Choose the matching annotation.",
      "A teacher circles the action-bearing item in a model. Choose the matching card.",
      "The unchanged citation card is being added to a glossary. Choose its matching annotation.",
      "The worksheet asks how the displayed item functions inside a clause. Choose the complete three-part card.",
      "A glossary heading appears before the bold verb. Complete that card.",
      "The displayed annotation belongs to a glossary, but this card came from a clause. Repair only the annotation.",
      "In Yamada’s worksheet, the highlighted item supplies the action. Retrieve its annotated card.",
      "Listen to Satou’s complete analysis card, then choose its written match.",
      "From the displayed verb, say the hidden two-label analysis card.",
    ],
    accepted: [
      "The clause item is correctly annotated as じゅつご.",
      "The catalog card uses the みだし annotation.",
      "The action-bearing item is correctly marked どうし.",
      "The citation card is correctly marked じしょ.",
      "The selected card combines よむ with どうし and じゅつご.",
      "The heading precedes the verb on the completed card.",
      "The repair changes the glossary annotation to the clause-role annotation.",
      "The retrieved card marks the item as どうし.",
      "The selected analysis matches the full recording.",
      "The spoken card combines the hidden verb and predicate labels.",
    ],
    retry: [
      "Use the card’s position in the model clause, not its meaning.",
      "Use the catalog-entry context rather than the clause context.",
      "Choose the grammatical annotation supported by the teacher’s circle.",
      "Keep the verb unchanged and classify how the card is being used.",
      "Use the clause worksheet, not the glossary filing context.",
      "Match the heading-and-verb layout shown in the glossary.",
      "Change only the mismatched annotation; keep the verb unchanged.",
      "Retrieve the analysis requested by the worksheet.",
      "Listen through both parts before selecting.",
      "Recall the hidden analyzed card; no answer is displayed.",
    ],
  }),
  ...semanticLessonCopy("polite-verbs-2", {
    title: "Verb classes come from the stored lemma",
    objective:
      "Distinguish godan, ichidan, する, and くる classes while treating -iru/-eru spellings cautiously.",
    main:
      "Verb class is canonical lexical information. Many -iru/-eru verbs are ichidan, but an explicit exception such as かえる remains godan.",
    construction:
      "Compare the complete dictionary form with its stored class, then keep する and くる in their own special classes.",
    constraints:
      "Final る alone never proves ichidan. This lesson classifies forms; it does not yet ask you to produce stems.",
    commonError:
      "Do not strip る from every -iru/-eru verb: godan かえる must follow its stored class.",
    nearestContrast:
      "たべる is ichidan and かえる is godan even though both visibly end in -eru.",
    recap:
      "Classify およぐ and かえる as godan, たべる and みる as ichidan, and keep する/くる explicit.",
    translations: [
      "およぐ is godan: its final row changes in polite forms.",
      "かえる is a reviewed -eru exception: it is godan.",
      "たべる is ichidan.",
      "みる is ichidan.",
      "する has its own stored class.",
      "くる has its own stored class.",
      "Compare たべる (ichidan) with かえる (godan).",
      "Compare みる (ichidan) with special する.",
      "The godan label precedes およぐ.",
      "The くる-class label precedes くる.",
    ],
    purposes: [
      "Classifies from the stored verb class, not the final sound alone.",
      "Makes the explicit -eru exception visible.",
      "Contrasts an ordinary -eru ichidan verb with かえる.",
      "Adds an owned -iru ichidan form.",
      "Names the special class before deriving its stem.",
      "Keeps くる separate from final-sound guessing.",
      "Shows why -eru spelling alone cannot decide the class.",
      "Requires the stored class for two similar-looking endings.",
      "Applies class recognition in an explicit analysis card.",
      "Retrieves くる with its own explicit class label.",
    ],
    instructions: [
      "A sea-scene lookup card needs a class analysis. Choose the analysis supported by its stored lemma.",
      "A viewing-scene lookup card needs a class analysis. Choose the supported analysis.",
      "A menu card shows the verb used for eating. Choose the classification supported by its stored entry.",
      "The reviewed -eru exception card needs its stored analysis. Choose the supported analysis.",
      "The displayed return card was guessed from spelling alone. Choose the repair.",
      "The chart has a separate row for the basic verb used to do an action. Choose its stored entry.",
      "The chart has a separate row for the verb used when someone comes. Retrieve its stored entry.",
      "A reading-action lookup card needs a class analysis. Choose the supported analysis.",
      "Listen to the complete lookup-card analysis, then choose its written match.",
      "From the displayed verb card, say the hidden class-analysis card from memory.",
    ],
    accepted: [
      "およぐ is correctly classified as godan.",
      "みる follows the stored ichidan class.",
      "The eating verb follows its stored ichidan classification.",
      "かえる remains godan despite its -eru spelling.",
      "The repair uses lexical class information instead of a suffix guess.",
      "する is kept in its explicit special class.",
      "くる is retrieved as its own special class.",
      "The reading-action lookup card is correctly analyzed.",
      "The written class card matches the recording.",
      "The spoken card gives the stored godan analysis for the displayed verb.",
    ],
    retry: [
      "Use the stored class for およぐ, not a guess from meaning.",
      "Do not treat every る verb as godan.",
      "Compare the complete eating lemma with the two proposed classifications.",
      "Remember the explicit かえる exception.",
      "Identify the suffix-only guess as the error.",
      "Do not merge する with ordinary る verbs.",
      "Keep くる separate from する and regular classes.",
      "Compare the complete stored lemma against both proposed analyses.",
      "Listen to the full lemma before choosing.",
      "Produce the hidden class card rather than reading a choice.",
    ],
  }),
  ...semanticLessonCopy("polite-verbs-3", {
    title: "Build the polite stem from the canonical class",
    objective:
      "Derive godan and ichidan polite stems and use the explicit する→し and くる→き mappings.",
    main:
      "The polite stem is generated from the stored verb class. Godan moves to the i-row, ichidan removes る, する uses し, and くる uses き.",
    construction:
      "Start from the owned dictionary lemma, follow its class rule once, and stop at the stem; ます is not attached until the next lesson.",
    constraints:
      "A stem is a form-building piece, not a complete productive sentence.",
    commonError:
      "Do not produce すり or くり by treating special verbs as regular godan forms.",
    nearestContrast:
      "Godan かえる gives かえり, while ichidan たべる gives たべ.",
    recap:
      "Retrieve かき, たべ, し, and き, then extend し to the three owned する compounds.",
    translations: [
      "かく changes to the polite stem かき.",
      "まつ changes to まち.",
      "Godan かえる changes to かえり.",
      "Ichidan たべる changes to たべ.",
      "Ichidan みる changes to み.",
      "する has the explicit polite stem し.",
      "くる has the explicit polite stem き.",
      "べんきょうする keeps its noun and uses し.",
      "でんわする becomes でんわし.",
      "さんぽする becomes さんぽし.",
    ],
    purposes: [
      "Derives a godan stem through the canonical engine.",
      "Shows the godan つ-to-ち row change.",
      "Applies the stored exception class honestly.",
      "Removes the owned ichidan る.",
      "Confirms the short ichidan stem.",
      "Teaches the required する→し mapping.",
      "Teaches the required くる→き mapping.",
      "Derives a compound する stem without duplicating a string.",
      "Applies the same canonical compound rule to calling.",
      "Adds a distinct compound-stem meaning.",
    ],
    instructions: [
      "A writing lookup card needs its generated stem analysis. Choose the supported derivation.",
      "A waiting lookup card needs its generated stem analysis. Choose the supported derivation.",
      "Arrange every tile to match the displayed study-form card.",
      "Transform the displayed basic do-action lookup card into its owned stem analysis.",
      "Complete the displayed coming-verb card with its owned stem analysis.",
      "The displayed return stem follows the wrong class. Choose the repair.",
      "A telephone-action card needs its generated stem analysis. Choose the supported derivation.",
      "Retrieve the generated stem analysis for the displayed walking compound.",
      "Listen to the viewing-stem card and choose its written match.",
      "From the displayed reading lookup form, say the hidden stem analysis.",
    ],
    accepted: [
      "The godan engine yields かき.",
      "The godan engine changes まつ to まち.",
      "The study stem remains one final predicate piece.",
      "The source する is correctly transformed to し.",
      "The explicit くる mapping yields き.",
      "The repair follows godan かえる and yields かえり.",
      "The telephone compound keeps でんわ and uses し.",
      "The walking compound keeps さんぽ and uses し.",
      "The selected stem card matches the recording.",
      "The spoken card reproduces the hidden よむ→よみ analysis.",
    ],
    retry: [
      "Move the final godan row to its i-row form.",
      "Move the final つ to its godan i-row form ち.",
      "Use the same tiles and keep the stem final.",
      "Transform する to し; do not attach ます yet.",
      "Use the explicit くる→き mapping.",
      "Do not strip る from godan かえる.",
      "Preserve the compound noun before し.",
      "Retrieve さんぽし rather than another する compound.",
      "Listen through the complete stem.",
      "Recall and say the hidden reading stem; no option is visible.",
    ],
  }),
  ...semanticLessonCopy("polite-verbs-4", {
    title: "Polite nonpast actions with ます",
    objective:
      "Use short natural ます sentences with known topic chunks and recoverable omission.",
    main:
      "Attach ます to the canonical polite stem. With dynamic verbs, context gives a habitual or future reading; this lesson never means an action ongoing right now.",
    construction:
      "Use a known topic when it helps, or omit a recoverable participant, then place the generated ます predicate last.",
    constraints:
      "Do not add を, に, へ, で, から, or まで yet. An omitted argument stays implicit and is never labelled overt.",
    commonError:
      "Do not translate ます automatically as “is doing now,” and do not attach it directly to the dictionary form.",
    nearestContrast:
      "かく is the lookup lemma; かき is the polite stem; かきます is the owned productive predicate.",
    recap:
      "Use ます for a routine or planned action, choosing an explicit topic only when the discourse needs it.",
    translations: [
      "Tanaka wakes up.",
      "Satou walks.",
      "Suzuki listens.",
      "Mari will make it.",
      "Yuki rests regularly.",
      "My friend will sleep.",
      "The teacher will speak.",
      "I will go. (mover and goal recoverable)",
    ],
    purposes: [
      "Uses the owned ichidan stem plus ます.",
      "Builds a godan polite predicate from its generated stem.",
      "Leaves a recoverable theme unspoken without claiming it is overt.",
      "Uses context to license a future nonpast reading.",
      "Adds a habitual rest predicate with an explicit topic.",
      "Uses the new sleep predicate for a future plan.",
      "Uses an explicit known topic with the new speaking predicate.",
      "Introduces going without naming a goal before argument particles.",
    ],
    instructions: [
      "The learner’s alarm rings at seven each day. Choose the complete polite statement that fits that routine.",
      "Yamada’s route card is dated tomorrow. Choose the complete polite statement.",
      "Yamada’s route plan is shown. Order every tile into one complete sentence.",
      "Suzuki listens first; the roster adds Yamada to that same routine. Transform the displayed stem into Yamada’s complete statement.",
      "Mari will make one item; the schedule adds Tanaka to the same plan. Complete Tanaka’s statement.",
      "The displayed complete form attaches the polite ending to the wrong base. Choose the one-defect repair.",
      "Yuki rests first; the roster adds the teacher to the same routine. Choose the teacher’s statement.",
      "The friend will sleep first; the schedule adds Mari to the same plan. Retrieve Mari’s statement.",
      "Listen to the complete sentence about the teacher’s scheduled work and choose its written match.",
      "From the student cue, say the hidden planned-waiting sentence.",
    ],
    accepted: [
      "The ます predicate expresses the learner’s routine.",
      "The complete form matches Yamada’s stated travel plan.",
      "The explicit topic precedes the final walking predicate.",
      "Yamada is added with も, and the generated stem correctly takes ます.",
      "Tanaka is added with も to the established future plan.",
      "The repair uses the speaking predicate required by context.",
      "The teacher is added with も to the established rest routine.",
      "Mari is added with も to the established sleep plan.",
      "The selected sentence matches the complete recording.",
      "The spoken target is hidden, grounded, and complete.",
    ],
    retry: [
      "Use the complete polite wording for the stated wake-up routine.",
      "Use Yamada’s dated route card and select the complete form.",
      "Use every tile and keep the walking form last.",
      "Keep the listening verb and express Yamada’s additional routine.",
      "Keep the making verb and repair only the missing polite ending.",
      "Diagnose the malformed stem-plus-ending combination before selecting a repair.",
      "Keep the teacher’s additional rest routine and repair only the verb base.",
      "Retrieve Mari’s additional sleep plan.",
      "Listen through the complete ending.",
      "Recall the hidden waiting sentence from the cue.",
    ],
  }),
  "polite-verbs-4-practical-dialogue-outcome":
    "Confirm three familiar people’s routines using only owned topic and ます patterns.",
  "polite-verbs-4-practical-dialogue-turn-1-translation": "Does Yuki work?",
  "polite-verbs-4-practical-dialogue-turn-1-purpose":
    "Opens with a familiar topic and a polite routine question.",
  "polite-verbs-4-practical-dialogue-turn-2-translation": "Yes, she does.",
  "polite-verbs-4-practical-dialogue-turn-2-purpose":
    "Omits the recoverable Yuki topic in the answer.",
  "polite-verbs-4-practical-dialogue-turn-3-translation": "Does Yamada walk too?",
  "polite-verbs-4-practical-dialogue-turn-3-purpose":
    "Moves to Yamada's established walking routine.",
  "polite-verbs-4-practical-dialogue-turn-4-translation": "Yes, Yamada walks.",
  "polite-verbs-4-practical-dialogue-turn-4-purpose":
    "Confirms the new referent without contradicting the work routine.",
  "polite-verbs-4-practical-dialogue-turn-5-translation": "Does Mari study?",
  "polite-verbs-4-practical-dialogue-turn-5-purpose":
    "Checks another known routine without adding an argument particle.",
  "polite-verbs-4-practical-dialogue-turn-6-translation": "Yes, she studies.",
  "polite-verbs-4-practical-dialogue-turn-6-purpose":
    "Closes with natural omission and the known assertive particle.",
  "verb-kaku-meaning": "to write",
  "verb-yomu-meaning": "to read",
  "verb-nomu-meaning": "to drink",
  "verb-kau-meaning": "to buy",
  "verb-hataraku-meaning": "to work",
  "verb-asobu-meaning": "to play; spend leisure time",
  "verb-oyogu-meaning": "to swim",
  "verb-taberu-meaning": "to eat",
  "verb-miru-meaning": "to see; watch",
  "verb-kaeru-meaning": "to return; go home",
  "verb-suru-meaning": "to do",
  "verb-kuru-meaning": "to come",
  "verb-benkyou-suru-meaning": "to study",
  "verb-denwa-suru-meaning": "to telephone",
  "verb-sanpo-suru-meaning": "to take a walk",
  "verb-yasumu-meaning": "to rest; take a day off",
  "verb-okiru-meaning": "to wake up",
  "verb-neru-meaning": "to sleep; go to bed",
  "verb-aruku-meaning": "to walk",
  "verb-kiku-meaning": "to listen; ask",
  "verb-tsukuru-meaning": "to make",
  "verb-au-meaning": "to meet",
  "verb-utau-meaning": "to sing",
  "verb-hanasu-meaning": "to speak",
  "verb-matsu-meaning": "to wait",
  "verb-classes-conjugation-title": "Verb classes and conjugation",
  "tense-polarity-title": "Tense and polarity",
  "reference-particle-frames-title": "Predicate particle frames",
};

const ARGUMENT_PARTICLES_COPY_EN: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("argument-particles-1", {
    title: "The predicate licenses its theme",
    objective:
      "Use を, pronounced o, for a transitive theme and understand object topicalization with は.",
    main:
      "A transitive predicate sense licenses a theme. The ordinary overt marker is を (o); when that theme becomes the discourse topic, は replaces the visible を while the predicate still licenses the same role.",
    construction:
      "Choose the intended predicate sense first, identify its theme, then use を or the explicitly taught topicalized-theme pattern.",
    constraints:
      "を is pronounced o. は is not a decorative swap: it topicalizes the licensed theme and changes the discourse packaging.",
    commonError:
      "Do not choose a particle from an English preposition and do not leave を beside は on one topicalized theme.",
    nearestContrast:
      "ごはんをたべます presents the meal as an object; ごはんはたべます makes that same licensed theme the topic.",
    recap:
      "Retrieve eating, drinking, writing, buying, reading, and seeing senses, then mark or topicalize their themes.",
    translations: [
      "I eat rice / a meal.",
      "I drink water.",
      "I write a letter.",
      "I buy fruit.",
      "I read a magazine.",
      "I read a book.",
      "I look at a photograph.",
      "As for fruit, I buy it.",
      "As for water, I drink it.",
      "As for the letter, I will write it.",
    ],
    purposes: [
      "Marks the licensed theme of eating with を.",
      "Pairs the drinking sense with its overt theme.",
      "Uses the writing sense that licenses a theme.",
      "Uses を for the thing bought.",
      "Links the magazine to the reading predicate.",
      "Retrieves a known noun in the same licensed frame.",
      "Uses the seeing sense rather than an English preposition rule.",
      "Replaces overt を with は while preserving the purchased item.",
      "Contrasts a topicalized theme with ordinary を.",
      "Shows a recoverable future context with object topicalization.",
    ],
    instructions: [
      "The learner’s meal card introduces rice as new information. Choose the neutral eating sentence.",
      "Water is new information in Tanaka’s drink order. Choose the neutral packaging.",
      "Arrange every tile to match the displayed letter card.",
      "Satou’s receipt introduces fruit as new information. Choose the neutral purchase sentence.",
      "The magazine is already under discussion. Repackage the neutral purchase card as the established topic.",
      "The book purchase should be neutral, but the displayed card makes the book contrastive. Repair only that packaging.",
      "The photograph is new information in Tanaka’s report. Choose the neutral packaging.",
      "The roster asks for the learner’s neutral written-letter sentence. Retrieve it.",
      "Listen for whether Mari’s water purchase is neutral or already under discussion, then choose its written match.",
      "From the magazine cue, say Yamada’s hidden reading sentence.",
    ],
    accepted: [
      "The eating predicate licenses the rice theme and its を.",
      "The drinking predicate stays fixed and new information takes neutral を packaging.",
      "Every tile is used and the predicate remains final.",
      "The fruit is marked as the theme of buying.",
      "The purchase remains fixed while は marks the established magazine.",
      "The repair keeps buying fixed and restores neutral object packaging.",
      "The seeing sense licenses the photograph theme.",
      "The retrieved sentence writes the intended letter.",
      "The recording introduces water neutrally with を.",
      "The spoken target keeps を pronounced o.",
    ],
    retry: [
      "Keep the learner and eating fixed; follow the new-information context.",
      "Keep drinking fixed and follow the new-information context.",
      "Keep を after the letter and put the verb last.",
      "Keep Satou and buying fixed; follow the new-information context.",
      "Keep buying fixed and switch only the magazine’s discourse packaging.",
      "Keep the book purchase fixed and repair only neutral-versus-topical packaging.",
      "Keep seeing fixed and follow the new-information context.",
      "Keep the learner named and retain neutral letter packaging.",
      "Listen for the particle after water and the complete buying form.",
      "Recall the hidden reading sentence; no answer is shown.",
    ],
  }),
  ...semanticLessonCopy("argument-particles-2", {
    title: "Movement goal に and direction へ",
    objective:
      "Choose endpoint に or directional へ (pronounced e) from the intended movement sense.",
    main:
      "Movement verbs can frame a destination as a concrete goal with に or as a direction/route with へ. The predicate sense and intended view license the choice.",
    construction:
      "Identify go, come, or return; decide whether the message focuses on arrival or direction; then place に or へ after the destination.",
    constraints:
      "へ is pronounced e. に and へ are not cosmetic substitutes in these authored targets.",
    commonError:
      "Do not memorize both particles as a single English “to” and swap them without changing the intended frame.",
    nearestContrast:
      "えきにいきます targets the station as an endpoint; えきへいきます presents movement in that direction.",
    recap:
      "Use the exact go, come, or return sense with either a licensed goal or a licensed direction.",
    translations: [
      "I go to the station.",
      "I go to the university.",
      "I head toward the hospital.",
      "I head toward the shop.",
      "Tanaka comes to school.",
      "Tanaka returns home.",
      "Suzuki also heads toward Tokyo.",
      "Does Mari come to Kyoto?",
      "Yamada heads toward Osaka.",
      "They return home.",
    ],
    purposes: [
      "Uses に for a concrete endpoint licensed by going.",
      "Adds an explicit speaker topic to an endpoint-focused movement.",
      "Uses へ, pronounced e, for route direction.",
      "Keeps directional へ distinct from endpoint に.",
      "The coming sense licenses Tanaka's explicit arrival goal.",
      "Frames home as Tanaka's natural return goal.",
      "Combines an additive topic with a route direction.",
      "Turns the coming endpoint into a confirmation question.",
      "Presents Yamada's route direction as an update.",
      "Uses home as the natural endpoint of returning.",
    ],
    instructions: [
      "The ticket names the station as the stop where this trip ends. Choose the matching sentence.",
      "Tanaka’s route arrow continues past the university. Choose the matching sentence.",
      "Yamada’s appointment is at the hospital, where the trip ends. Order every tile.",
      "Complete Satou’s route toward the shop.",
      "Suzuki’s revised map shows an arrow continuing toward school rather than stopping there. Transform the sentence.",
      "Mari’s home itinerary is drawn as merely heading onward, although home is where this trip ends. Repair only that view.",
      "Tanaka’s map arrow points toward Tokyo and continues beyond it. Choose the matching sentence.",
      "Yamada’s ticket names Kyoto as the stop where the trip ends. Retrieve the matching route.",
      "Listen for Satou’s trip whose final stop is home and choose its written match.",
      "Suzuki’s map arrow points toward the hospital. Say the hidden sentence.",
    ],
    accepted: [
      "The station is licensed as the endpoint of going.",
      "Directional へ matches the route view.",
      "The destination particle stays with the hospital chunk.",
      "The shop is framed as Satou’s direction.",
      "The transformed sentence now uses the owned directional sense.",
      "The repair changes only the route from direction to endpoint.",
      "Tokyo is presented as a direction.",
      "Kyoto is the endpoint of Yamada’s going event.",
      "The recording matches the home-endpoint sentence.",
      "The spoken target pronounces へ as e.",
    ],
    retry: [
      "Choose the endpoint view, not the directional view.",
      "Use へ when the context describes heading toward a place.",
      "Use every tile and keep the movement form last.",
      "Keep the route context and choose directional へ.",
      "Change the licensed movement view, not merely the printed glyph.",
      "Diagnose whether the home context requires a direction or an endpoint.",
      "Treat Tokyo as a direction in this scene.",
      "Retrieve the Kyoto endpoint view rather than its directional counterpart.",
      "Listen for に after home.",
      "Recall the hidden route and pronounce へ as e.",
    ],
  }),
  ...semanticLessonCopy("argument-particles-3", {
    title: "Action place and means with で",
    objective:
      "Distinguish where an action happens from the means or instrument used, using predicate and context.",
    main:
      "The same surface で can mark an action place or a means. The predicate frame and the surrounding situation identify which role is overt.",
    construction:
      "Ask whether the noun names the setting of the action or the means used to carry it out, then select the licensed predicate sense.",
    constraints:
      "A place noun does not determine the role by itself. A train is a means in travel; a library is an action place for studying.",
    commonError:
      "Do not label every で phrase “at” or every transport noun “by” without checking the predicate.",
    nearestContrast:
      "としょかんでべんきょうします gives an action place; でんしゃでいきます gives a means.",
    recap:
      "Use action-place で for study, work, play, or eating, and means で for transport or an instrument.",
    translations: [
      "I study at the library.",
      "I play at the park.",
      "I work at the university.",
      "I work at the shop.",
      "I go by train.",
      "I go by bicycle.",
      "I write with a pencil.",
      "I work at the hospital.",
      "I play at home.",
      "I return by bicycle.",
    ],
    purposes: [
      "Marks the location where studying happens.",
      "Uses で as an action location.",
      "The work sense licenses an action place.",
      "Changes the workplace without changing the predicate frame.",
      "Uses で for a means of travel.",
      "Contrasts another travel means with an action place.",
      "Uses instrument context to select means で.",
      "Adds a third grounded workplace.",
      "Shows that the predicate and context, not the noun alone, select the role.",
      "Applies means で to returning.",
    ],
    instructions: [
      "The note says the learner stays at the library while writing. Choose the matching sentence.",
      "Tanaka stays at the shop while writing his note. Choose the matching sentence.",
      "Yamada’s ticket shows train travel. Order every tile into the matching sentence.",
      "Satou’s travel pass shows a bicycle icon. Choose the matching sentence.",
      "Suzuki’s note says the pencil is what is used for writing. Choose the matching sentence.",
      "Mari writes while at the shop, but the displayed annotation claims something she uses. Repair only the annotation.",
      "Retrieve Satou’s sentence about writing while at the park.",
      "Complete Yamada’s sentence about writing while at school.",
      "Listen for whether Mari travels by train or bicycle, then choose the written match.",
      "Say Mari’s hidden pencil-writing sentence.",
    ],
    accepted: [
      "The library is licensed as the action place for writing.",
      "The shop is licensed as Tanaka’s action place for writing.",
      "The train remains the means chunk and the verb stays final.",
      "The bicycle is overt as Satou’s travel means.",
      "The pencil is an instrument, so this is means で.",
      "The repair changes only the role label to the supported action-place analysis.",
      "The park is retrieved as Satou’s writing location.",
      "School is the location of Yamada’s writing.",
      "The written sentence matches the transport recording.",
      "The spoken answer keeps the instrument role grounded.",
    ],
    retry: [
      "Use the library as where the writing occurs, not what performs it.",
      "Keep writing fixed and select the shop sentence.",
      "Use every tile and keep で attached to the train chunk.",
      "Follow the bicycle shown on Satou’s travel pass.",
      "Follow what Suzuki uses when writing.",
      "Diagnose the incompatible label without changing the writing form.",
      "Retrieve the park writing sentence.",
      "Use the school writing context.",
      "Listen for the complete means phrase.",
      "Recall the hidden instrument sentence.",
    ],
  }),
  ...semanticLessonCopy("argument-particles-4", {
    title: "Predicate-led particle selection",
    objective:
      "Select を, に, へ, or で from the verb sense and overt role in a mixed practical context.",
    main:
      "Particle choice begins with the predicate sense and its semantic roles. English translations are checks on meaning, never an atomic preposition list.",
    construction:
      "Identify the intended event, name the overt role, consult its licensed frame, and only then realize the particle.",
    constraints:
      "A glyph swap that leaves the predicate frame unchanged is rejected when that exact sense does not license it.",
    commonError:
      "Do not choose a familiar particle first and force the rest of the sentence to fit it.",
    nearestContrast:
      "かさをかいます has a bought theme; しょくどうでたべます has the place where eating happens.",
    recap:
      "Lead with the predicate: theme, goal, direction, action place, and means each have a licensed realization.",
    translations: [
      "I eat at the cafeteria.",
      "I work at the office.",
      "I buy an umbrella.",
      "I write a diary.",
      "I head toward the station.",
      "They come to the office.",
      "I return by train.",
      "As for the book, I read it.",
      "I eat fruit.",
      "I eat at the park.",
    ],
    purposes: [
      "Selects action-place で from eating in a venue.",
      "Pairs the workplace with the work sense.",
      "The buying sense selects theme を.",
      "The writing sense selects the diary as theme.",
      "Chooses directional へ for a route view.",
      "Chooses goal に for an arrival endpoint.",
      "Selects means で from the transport context.",
      "Keeps the reading theme licensed under topicalization.",
      "Retrieves the eating theme with a different object.",
      "Retrieves action-place で through an eating venue.",
    ],
    instructions: [
      "The learner’s meal takes place in the cafeteria. Choose the matching sentence.",
      "Tanaka stays in the office while writing. Choose the matching sentence.",
      "Arrange every tile to match Yamada’s displayed umbrella card.",
      "Complete Satou’s diary-writing sentence.",
      "Suzuki’s map arrow continues toward and beyond the station. Choose the matching sentence.",
      "Mari’s desk record conflicts with the implausible noun on the displayed writing card. Replace only that noun.",
      "The diary is already under discussion. Retrieve the matching reading sentence.",
      "Yamada’s ticket lists the university as the stop where the trip ends. Complete the matching card.",
      "Listen to Satou’s route toward the park and choose its written match.",
      "Say Suzuki’s hidden umbrella-purchase sentence.",
    ],
    accepted: [
      "The cafeteria is the place of eating.",
      "The office is licensed as the location of Tanaka’s writing.",
      "The umbrella remains the bought theme.",
      "The diary is the theme of writing.",
      "Directional へ matches the route context.",
      "The pencil is a coherent writing means.",
      "The diary remains a licensed reading theme under は.",
      "University is the endpoint of going.",
      "The selected sentence matches the complete recording.",
      "The spoken answer uses を as o.",
    ],
    retry: [
      "Start from eating and identify what the cafeteria contributes.",
      "Keep writing fixed and choose where Tanaka is, not what Tanaka uses.",
      "Keep を after the umbrella and the verb final.",
      "Choose the diary as the item being written.",
      "Use へ for the authored route view.",
      "Diagnose the implausible umbrella-as-writing-instrument context.",
      "Keep reading fixed and package the diary as already established.",
      "Choose the endpoint view rather than the directional view.",
      "Listen for both the park chunk and the movement form.",
      "Recall the hidden purchase target.",
    ],
  }),
  "verb-iku-meaning": "to go",
  "noun-gohan-meaning": "cooked rice; meal",
  "noun-mizu-meaning": "water",
  "noun-tegami-meaning": "letter",
  "noun-kudamono-meaning": "fruit",
  "noun-zasshi-meaning": "magazine",
  "noun-eki-meaning": "station",
  "noun-daigaku-meaning": "university",
  "noun-byouin-meaning": "hospital",
  "noun-mise-meaning": "shop",
  "noun-toshokan-meaning": "library",
  "noun-kouen-meaning": "park",
  "noun-densha-meaning": "train",
  "noun-jitensha-meaning": "bicycle",
  "noun-enpitsu-meaning": "pencil",
  "noun-shokudou-meaning": "cafeteria; dining hall",
  "noun-jimusho-meaning": "office",
  "noun-kasa-meaning": "umbrella",
  "noun-nikki-meaning": "diary",
};

const TIME_MOVEMENT_COPY_EN: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("time-movement-1", {
    title: "Dynamic nonpast means habit or future",
    objective:
      "Use ふだん or まいしゅう versus あした to interpret dynamic ます predicates as habitual or future.",
    main:
      "Real Japanese time evidence selects the reading: ふだん and まいしゅう support recurrence, while あした supports a future event. None describes an action in progress now.",
    construction:
      "Read the visible time phrase first, keep the predicate unchanged, and align the resulting habitual or future meaning in English and Italian.",
    constraints:
      "Every target is explicitly habitual or future; none describes an action currently in progress.",
    commonError:
      "Do not translate every ます form with English “is …-ing.”",
    nearestContrast:
      "ふだんあるきます is habitual; あしたあるきます is future, and neither describes walking in progress now.",
    recap:
      "Use the visible Japanese time evidence to justify every habitual or future reading.",
    translations: [
      "Tanaka usually runs.",
      "Satou will work tomorrow.",
      "Mari cooks every week.",
      "Yuki will go out tomorrow.",
      "I will walk tomorrow. (speaker recoverable)",
      "We will study tomorrow. (group recoverable)",
      "Suzuki cooks every week.",
      "My friend goes out every week.",
      "I rest every week.",
      "Suzuki will sleep tomorrow.",
    ],
    purposes: [
      "Uses ふだん as real habitual evidence.",
      "Uses あした as real future evidence.",
      "Adds habitual evidence to a する compound.",
      "Uses an authored future time without ongoing meaning.",
      "Shows future nonpast with natural omission.",
      "Keeps the planned group implicit.",
      "Combines an explicit topic with weekly evidence.",
      "Contrasts a recurring outing with tomorrow's plan.",
      "Reviews rest with overt recurring-time evidence.",
      "Uses a scheduled sleep event, never an ongoing reading.",
    ],
    instructions: [
      "The learner’s card marks running as the usual routine. Choose the matching sentence.",
      "Tanaka’s work booking is dated tomorrow. Choose the matching sentence.",
      "Order every tile on Yamada’s weekly cooking card.",
      "Satou’s ticket is dated tomorrow. Complete the matching sentence.",
      "Suzuki’s running card is filed under every week. Choose the matching sentence.",
      "Mari’s outing is booked for tomorrow, but the displayed sentence says every week. Repair only the time phrase.",
      "Yuki’s calendar marks a rest day every week. Retrieve the matching sentence.",
      "The friend’s bedtime is on tomorrow’s schedule. Complete the matching sentence.",
      "Listen for whether Yamada studies tomorrow or every week, then choose its written match.",
      "Suzuki’s outing is on tomorrow’s calendar. Say the hidden sentence.",
    ],
    accepted: [
      "ふだん supplies explicit evidence for the usual running routine.",
      "あした supplies explicit evidence for Tanaka’s work plan.",
      "The weekly time phrase and topic precede the cooking predicate.",
      "Satou’s sentence contains the stated tomorrow evidence.",
      "Suzuki’s sentence contains the stated weekly evidence.",
      "The repair replaces only the weekly phrase with tomorrow.",
      "Yuki’s regular rest is retrieved with まいしゅう.",
      "The friend’s sleep event is grounded by あした.",
      "The selected tomorrow study sentence matches the recording.",
      "The spoken target is future, not an action in progress now.",
    ],
    retry: [
      "Follow ふだん; do not invent an action in progress.",
      "Follow the tomorrow time phrase.",
      "Use every tile and keep the cooking form last.",
      "Read the dated ticket before choosing the sentence.",
      "Distinguish every week from tomorrow.",
      "Replace the incorrect time evidence without moving it.",
      "Retrieve the established まいしゅう rest sentence.",
      "Keep the friend’s sleep with あした.",
      "Listen to the complete time phrase and study form.",
      "Recall the hidden future target with the owned nonpast form.",
    ],
  }),
  ...semanticLessonCopy("time-movement-2", {
    title: "Specific time, relative time, and bounds",
    objective:
      "Use specific-time に, omit obligatory に after relative times, and bound time or movement with から/まで.",
    main:
      "Specific scheduled times can take に. Relative expressions such as きょう and あした normally stand without obligatory に. Here から and まで only mark temporal or movement bounds.",
    construction:
      "Classify the time expression, then add に only for the authored specific-time target; use から for a start and まで for an endpoint.",
    constraints:
      "から never means cause here, and まで never introduces an advanced extension. Their bounds are explicit in context.",
    commonError:
      "Do not add に automatically after きょう or あした, and do not treat から/まで as one vague preposition pair.",
    nearestContrast:
      "しちじにおきます uses specific-time に; きょうやすみます uses a relative time with no に.",
    recap:
      "Distinguish a time point, a relative time, a temporal interval, and a movement path.",
    translations: [
      "I wake up at seven.",
      "I will go out at nine.",
      "I will study on Monday.",
      "I will rest today.",
      "I will go tomorrow.",
      "I will work from nine until five.",
      "I will travel from the station as far as the university.",
      "I will work from seven.",
      "I will study until five.",
      "I will return from the station.",
    ],
    purposes: [
      "Uses に with a specific clock time.",
      "Links a specific time to a punctual departure.",
      "Uses に with a named scheduled day.",
      "Shows that relative きょう takes no obligatory に.",
      "Omits に after the relative time あした.",
      "Bounds work in time with から and まで.",
      "Uses only movement source and endpoint bounds.",
      "Uses から as a bounded temporal start, not cause.",
      "Uses まで for a temporal limit.",
      "Uses から for a movement source.",
    ],
    instructions: [
      "The learner’s alarm card shows seven o’clock. Choose the sentence that matches it.",
      "Tanaka’s day-off note is dated today. Choose the matching sentence.",
      "Arrange every tile to match the displayed Monday schedule.",
      "Complete Satou’s plan for tomorrow.",
      "Tanaka’s study card states a nine o’clock start and a five o’clock finish. Choose the matching sentence.",
      "Mari’s route card states only a source where the plan requires both bounds. Repair only the missing limit.",
      "Retrieve Suzuki’s study-until-five sentence.",
      "Complete Yamada’s return from the station.",
      "Listen to Suzuki’s tomorrow plan and choose its written match.",
      "Say Satou’s hidden station-to-university route.",
    ],
    accepted: [
      "Seven is a specific time marked by に.",
      "Today appears naturally without obligatory に.",
      "The day-plus-に chunk precedes the predicate.",
      "Tomorrow is unmarked in this relative-time target.",
      "The study interval has an explicit start and endpoint.",
      "The repair uses movement bounds with a movement predicate.",
      "Five is the stated temporal limit.",
      "The station is the source of returning.",
      "The recording matches the unmarked relative-time sentence.",
      "The spoken route keeps both bounds explicit.",
    ],
    retry: [
      "Use に after the authored clock time.",
      "Do not insert obligatory に after きょう.",
      "Use every tile and keep the study form last.",
      "Keep あした unmarked in this target.",
      "Use から for nine and まで for five.",
      "Match the station/university path with travelling.",
      "Treat five as the limit, not a time point with に.",
      "Use から for the movement source.",
      "Listen for the absence of に after あした.",
      "Recall both route bounds before speaking.",
    ],
  }),
  ...semanticLessonCopy("time-movement-3", {
    title: "Four polite tense and polarity cells",
    objective:
      "Use ます, ません, ました, and ませんでした in the canonical four-cell order.",
    main:
      "The Task 7 form engine supplies exactly four polite cells: nonpast affirmative, nonpast negative, past affirmative, and past negative.",
    construction:
      "Choose time first, then polarity, and retrieve the generated ending without editing its token string.",
    constraints:
      "Dynamic nonpast remains habitual or future. Past forms describe completed or non-occurring past events, never progressive actions.",
    commonError:
      "Do not shorten ませんでした or mix a past time word with a nonpast form unless the context explicitly permits it.",
    nearestContrast:
      "かきません is nonpast negative; かきませんでした is past negative.",
    recap:
      "Recall the four cells in order and select each from time plus polarity.",
    translations: [
      "I will work this week.",
      "I will travel next week.",
      "I will not work this week.",
      "I will not buy it next week.",
      "I worked yesterday.",
      "I studied last week.",
      "I did not work yesterday.",
      "I did not play last week.",
      "Tanaka wrote it yesterday.",
      "Yamada will not study next week.",
      "I did not sing last week.",
      "I will not meet them next week.",
    ],
    purposes: [
      "Publishes the nonpast affirmative cell with a future reading.",
      "Uses the same cell for a future plan.",
      "Contrasts the same work predicate with negative polarity.",
      "Uses ません for a future negative.",
      "Publishes the ました past affirmative cell.",
      "Applies past affirmative to a する compound.",
      "Completes the same-verb grid with ませんでした.",
      "Uses past negative with another godan predicate.",
      "Combines an explicit topic with a recoverable theme.",
      "Completes the four-cell contrast in a grounded plan.",
      "Applies the past-negative cell to the newly owned singing verb.",
      "Applies future-negative ません to the newly owned meeting verb.",
    ],
    instructions: [
      "This week’s roster includes the learner’s work shift. Choose the matching sentence.",
      "Tanaka’s work shift appears on next week’s roster. Choose the matching sentence.",
      "Yamada’s attendance log shows a completed shift yesterday. Order every tile.",
      "Last week’s log records the study session as completed. Transform the displayed stem.",
      "Yesterday’s work log has no shift for Suzuki. Choose the matching sentence.",
      "Mari called off next week’s purchase, but the displayed form reports it as completed. Repair the form.",
      "Tanaka’s log has no singing entry for last week. Retrieve the matching sentence.",
      "Yamada’s calendar has no meeting this week. Choose the matching sentence.",
      "Listen to Satou’s yesterday-writing sentence and choose its match.",
      "Suzuki’s calendar has no study session next week. Say the hidden sentence.",
    ],
    accepted: [
      "The future work context selects ます.",
      "The future plan also selects nonpast affirmative.",
      "The past-time chunk precedes the generated ました form.",
      "The transformation yields the complete past affirmative.",
      "Past time plus negative polarity yields ませんでした.",
      "The repair uses ません for a future negative.",
      "The retrieved singing event is past and negative.",
      "The meeting plan is future/nonpast and negative.",
      "The selected sentence matches the past recording.",
      "The spoken target preserves the full ません ending.",
    ],
    retry: [
      "Choose the nonpast affirmative cell for the scheduled work.",
      "A future plan does not require a past ending.",
      "Use every tile and keep the form final.",
      "Build ました from the owned stem.",
      "Keep the complete ませんでした sequence.",
      "Diagnose the mismatch between next week and past.",
      "Retrieve the absent singing event from last week.",
      "Keep the meeting absent from this week’s calendar.",
      "Listen through the complete past ending.",
      "Recall the hidden negative plan from the cue.",
    ],
  }),
  ...semanticLessonCopy("time-movement-4", {
    title: "A practical schedule and route",
    objective:
      "Combine owned time, movement, argument particles, and four-cell forms in a coherent plan.",
    main:
      "A schedule selects time interpretation and polarity; a route selects goal, bounds, or means. Each sentence keeps its predicate-led licensing.",
    construction:
      "Ground the day or relative time, choose the event form, then add only the overt argument or movement roles needed.",
    constraints:
      "No action is described as ongoing now. から remains a start, まで a limit, and only owned forms appear.",
    commonError:
      "Do not mix yesterday with a future ending or use a transport means as an action place.",
    nearestContrast:
      "けさあるきました reports a past event; こんばんかいぎをします schedules a future event.",
    recap:
      "State one schedule item, one bounded route, one travel means, and one changed plan.",
    translations: [
      "I walked this morning.",
      "I will have the meeting tonight.",
      "I will do the work tomorrow.",
      "I will eat lunch today.",
      "Yamada studies at night every week.",
      "I will cook tonight.",
      "I rest on Sunday.",
      "I will check the schedule tomorrow.",
      "I will head toward the station tonight.",
      "I will not have the meeting tonight.",
    ],
    purposes: [
      "Uses a relative past-time expression without に.",
      "Combines a future relative time with a licensed theme.",
      "Keeps tomorrow free of obligatory に.",
      "Uses the meal as the eating theme.",
      "Combines weekly evidence with に on the night-time expression.",
      "Uses a future reading, never an action in progress now.",
      "Uses に with a named recurring day.",
      "Makes the schedule the licensed theme of checking.",
      "Adds a coherent future movement item to the schedule.",
      "Uses the nonpast negative for a cancelled future event.",
    ],
    instructions: [
      "The morning log records the walk as completed. Choose the matching sentence.",
      "The meeting is tomorrow. Choose the matching scheduled event.",
      "Arrange every tile to match the displayed evening work card.",
      "Yamada’s lunch is marked for tomorrow. Complete the matching sentence.",
      "Tanaka’s study card says every week at night, not today. Choose the matching sentence.",
      "The meeting was cancelled, but the displayed sentence still says it will happen. Repair only the ending.",
      "Retrieve Tanaka’s Sunday rest routine.",
      "Yamada’s schedule review is marked for tonight. Complete the matching sentence.",
      "Listen to Tanaka’s scheduled train trip and choose its written match.",
      "Suzuki’s meeting is on tonight’s calendar. Say the hidden sentence.",
    ],
    accepted: [
      "The completed morning event uses ました.",
      "The meeting is placed in the future plan.",
      "The work theme remains before the final predicate.",
      "Lunch is the licensed theme of eating.",
      "The sentence states both every week and night.",
      "The repair uses future negative ません.",
      "Sunday takes に in the authored routine.",
      "The schedule is the theme of checking.",
      "The selected route matches the complete recording.",
      "The spoken plan is future and affirmative.",
    ],
    retry: [
      "Use a past form for the completed morning walk.",
      "Keep the meeting in the stated future time.",
      "Use every tile and keep を after the work item.",
      "Keep eating with the lunch item.",
      "Keep both まいしゅう and よるに with the studying form.",
      "Diagnose polarity before choosing the repair.",
      "Retrieve the Sunday に routine.",
      "Choose the schedule-checking form.",
      "Listen for the train means and movement verb.",
      "Use both Suzuki and tonight from the cue; do not add an ongoing form.",
    ],
  }),
  "time-movement-4-practical-dialogue-outcome":
    "Confirm a Monday route, departure time, travel means, and evening meeting plan.",
  "time-movement-4-practical-dialogue-turn-1-translation":
    "Will you go to the university on Monday?",
  "time-movement-4-practical-dialogue-turn-1-purpose":
    "Opens by combining a specific day and movement goal.",
  "time-movement-4-practical-dialogue-turn-2-translation":
    "Yes, I will go at seven.",
  "time-movement-4-practical-dialogue-turn-2-purpose":
    "Answers with the recoverable destination omitted.",
  "time-movement-4-practical-dialogue-turn-3-translation":
    "Will you go from the station as far as the university?",
  "time-movement-4-practical-dialogue-turn-3-purpose":
    "Checks the bounded route without adding another sense of から.",
  "time-movement-4-practical-dialogue-turn-4-translation":
    "Yes, I will go by train.",
  "time-movement-4-practical-dialogue-turn-4-purpose":
    "Answers the route question with a coherent travel means.",
  "time-movement-4-practical-dialogue-turn-5-translation":
    "Will you have the meeting tonight?",
  "time-movement-4-practical-dialogue-turn-5-purpose":
    "Moves coherently from travel to the evening schedule.",
  "time-movement-4-practical-dialogue-turn-6-translation":
    "No, I will do it tomorrow.",
  "time-movement-4-practical-dialogue-turn-6-purpose":
    "Closes by postponing the recoverable meeting to tomorrow.",
  "verb-hashiru-meaning": "to run",
  "verb-ryokou-suru-meaning": "to travel",
  "verb-ryouri-suru-meaning": "to cook",
  "verb-dekakeru-meaning": "to go out",
  "noun-kyou-meaning": "today",
  "noun-ashita-meaning": "tomorrow",
  "noun-maishuu-meaning": "every week",
  "noun-fudan-meaning": "usually; ordinarily",
  "noun-getsuyoubi-meaning": "Monday",
  "noun-shichiji-meaning": "seven o'clock",
  "noun-kuji-meaning": "nine o'clock",
  "noun-goji-meaning": "five o'clock",
  "noun-kinou-meaning": "yesterday",
  "noun-senshuu-meaning": "last week",
  "noun-konshuu-meaning": "this week",
  "noun-raishuu-meaning": "next week",
  "noun-kaigi-meaning": "meeting",
  "noun-shigoto-meaning": "work; task",
  "noun-hirugohan-meaning": "lunch",
  "noun-yoru-meaning": "night; evening",
  "noun-kesa-meaning": "this morning",
  "noun-konban-meaning": "this evening; tonight",
  "noun-nichiyoubi-meaning": "Sunday",
  "noun-yotei-meaning": "schedule; plan",
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
  "sentence-foundations-1-example-3-context": "An album note places the family heading before its media type.",
  "sentence-foundations-1-example-4-context": "A schedule note places the time context before the final destination slot.",
  "sentence-foundations-1-example-5-context": "An itinerary places the trip heading before the selected place.",
  "sentence-foundations-1-example-6-context": "A routing note places the channel before the intended person.",
  "sentence-foundations-1-example-7-context": "A matching note places the object cue before its associated place.",
  "sentence-foundations-1-example-8-context": "A counter note places the document before its purpose.",
  "sentence-foundations-1-example-9-context": "A photograph label places the media cue before Sakura's name.",
  "sentence-foundations-1-example-10-context": "A second photograph label places the media cue before Ken's name.",
  "sentence-foundations-2-example-1-context": "The photograph field and Tanaka value are both explicit.",
  "sentence-foundations-2-example-2-context": "The same photograph field is recoverable, so only Tanaka remains.",
  "sentence-foundations-2-example-3-context": "A second photograph field and Yamada value are explicit.",
  "sentence-foundations-2-example-4-context": "The second photograph field is recoverable, so only Yamada remains.",
  "sentence-foundations-2-example-5-context": "The pictured person and broad human category are both explicit.",
  "sentence-foundations-2-example-6-context": "The pictured person is recoverable, so only the category remains.",
  "sentence-foundations-2-example-7-context": "The school field and student role are both explicit.",
  "sentence-foundations-2-example-8-context": "The school field is recoverable, so only the role remains.",
  "sentence-foundations-2-example-9-context": "The phone field and displayed photograph are both explicit.",
  "sentence-foundations-2-example-10-context": "The phone field is recoverable, so only the photograph remains.",
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
  "sentence-foundations-4-example-7-context": "Mika before a pause contrasts with the bounded name-title unit.",
  "sentence-foundations-4-example-8-context": "Sora before a pause contrasts with the bounded name-title unit.",
  "sentence-foundations-4-example-9-context": "Haru is explicit and student is the final predicate.",
  "sentence-foundations-4-example-10-context": "Ai is explicit and student is the final predicate.",
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
    "polite-verbs-1": { title: "Dictionary forms as lookup forms" },
    "polite-verbs-2": { title: "Distinguishing verb classes" },
    "polite-verbs-3": { title: "Building polite stems" },
    "polite-verbs-4": { title: "Using polite nonpast verbs" },
    "argument-particles-1": { title: "Transitive themes and topicalization" },
    "argument-particles-2": { title: "Movement goals and directions" },
    "argument-particles-3": { title: "Action places and means" },
    "argument-particles-4": { title: "Predicate-led particle choice" },
    "time-movement-1": { title: "Habitual and future nonpast" },
    "time-movement-2": { title: "Time points and bounds" },
    "time-movement-3": { title: "Four polite tense-polarity forms" },
    "time-movement-4": { title: "Planning a schedule and route" },
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
    ...POLITE_VERBS_COPY_EN,
    ...ARGUMENT_PARTICLES_COPY_EN,
    ...TIME_MOVEMENT_COPY_EN,
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
