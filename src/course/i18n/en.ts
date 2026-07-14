import type { CourseCopy } from "./types";

const enUi = {
  home: {
    eyebrow: "Guided course",
    title: "Build Japanese one gear at a time.",
    lead: "Start with sounds, learn to see sentence roles, and reach the patterns most useful while traveling.",
    continue: "Continue",
    start: "Start",
    review: "Review",
    reset: "Reset progress",
    resetConfirm: "Do you really want to reset your course progress?",
    corruptProgress: "Course progress could not be read and was reset. Language and script settings were not changed.",
    dismiss: "Dismiss",
    invalidRoute: (path: string) => `“${path}” does not exist. You are back at the course.`,
    lessonsProgress: (visited: number, total: number) =>
      `${visited} of ${total} lessons`,
    explorePractice: "Explore free practice",
    corruptProgressTitle: "Progress reset",
    invalidRouteTitle: "Page not found",
    persistenceWarningTitle: "Progress will not be saved",
    persistenceWarningBody:
      "Your browser does not allow saving course progress in this session. You can keep using the app, but visited lessons will not be remembered after you close it.",
  },
  lesson: {
    back: "All modules",
    modulePosition: (current: number, total: number) =>
      `Module ${current} of ${total}`,
    previous: "Previous lesson",
    next: "Next lesson",
    map: "Course map",
    listen: "Listen",
    playing: "Playing…",
    legacyModuleNoticeTitle: "Updated module link",
    legacyModuleNoticeBody:
      "This lesson now lives in a different module. You have been taken to its current place.",
    sections: {
      rule: "Rule",
      comparison: "Compare",
      explore: "Explore",
      recap: "Recap",
    },
    railLabel: "Lesson sections",
    sectionMenuLabel: "Jump to a section",
    comparison: {
      before: "Before",
      after: "After",
      changed: "What changes",
      dimensions: {
        particle: "Particle",
        ending: "Ending",
        time: "Time",
        polarity: "Polarity",
        topic: "Topic",
        request: "Request",
        question: "Question",
        existence: "Existence",
        "word-order": "Word order",
        sound: "Sound",
      },
    },
    guided: {
      initial: "Starting point",
      target: "Target",
      changed: "Gears that change",
      openSyllabary: "Open the Syllabary",
    },
  },
  practice: {
    eyebrow: "Free practice",
    title: "Explore without losing the thread.",
    lead: "Open the tools whenever you want; the guided course stays available.",
    labTitle: "Sentence Lab",
    labBody: "Combine time, roles, and verb form on the board.",
    syllabaryTitle: "Hiragana chart",
    syllabaryBody: "Hear the core signs and practice recognizing them.",
    open: "Open",
    guidedBoard: "Guided board",
    openGuidedLab: "Open the guided Sentence Lab",
    backToLesson: "Back to lesson",
    invalidPreset: "This guided link is invalid, so the Sentence Lab opened with its default values.",
  },
} satisfies Pick<CourseCopy, "home" | "lesson" | "practice">;

const enCourseMap: CourseCopy["courseMap"] = {
  heading: "The course phases",
  phases: {
    orient: {
      title: "Orient",
      purpose: "Sounds and the basic sentence structure.",
    },
    build: {
      title: "Build",
      purpose: "Add actions, objects, and time references.",
    },
    navigate: {
      title: "Navigate",
      purpose: "Move between places, people, and everyday requests.",
    },
    synthesize: {
      title: "Synthesize",
      purpose: "Bring it all together in a closing lesson.",
    },
  },
  prerequisites: (moduleNames: string[]) =>
    moduleNames.length === 0
      ? "None — start here."
      : `Ideally after: ${moduleNames.join(", ")}.`,
  estimatedMinutes: (minutes: number) => `About ${minutes} min`,
  stateCurrent: "You are here",
  stateRecommended: "Recommended",
  stateVisited: "Visited",
  expandLabel: (moduleTitle: string) => `Expand lessons for ${moduleTitle}`,
  collapseLabel: (moduleTitle: string) => `Collapse lessons for ${moduleTitle}`,
  revisitTitle: "You've visited every lesson",
  revisitBody:
    "You can revisit any lesson whenever you like — there's no final finish line to reach.",
};

const enModules: CourseCopy["modules"] = {
  sounds: { title: "Sounds and hiragana" },
  "sentence-map": { title: "The sentence map" },
  actions: { title: "Actions and objects" },
  time: { title: "When does it happen?" },
  places: { title: "Places and movement" },
  people: { title: "People, wishes, and invitations" },
  "questions-existence": { title: "Questions, requests, and what exists" },
  capstone: { title: "Final synthesis: verbs and exceptions" },
};

const enOutcomes: CourseCopy["outcomes"] = {
  sounds: "Read and hear the signs used throughout the course.",
  "sentence-map": "See where the topic, details, and verb belong.",
  actions: "Link an action's object to the verb with を.",
  time: "Change time and switch between affirmative and negative without losing the structure.",
  places: "Distinguish where you act, where you go, and how you travel.",
  people: "Connect people, wishes, and suggestions.",
  "questions-existence":
    "Ask questions with か, make requests with ください, say that something or someone is there, and recognize the special particle readings of は・へ・を.",
  capstone: "Recognize that かえる is godan: ending in る is not enough to tell a verb's group.",
};

const enLessons: CourseCopy["lessons"] = {
  "sounds-core": { title: "The five core sounds" },
  "sounds-special": { title: "Small signs, big differences" },
  "sentence-order": { title: "The verb closes the sentence" },
  "sentence-omission": { title: "Who are we talking about?" },
  "actions-object": { title: "What receives the action?" },
  "actions-masu": { title: "The base stays, the ending changes" },
  "time-past": { title: "Today or yesterday?" },
  "time-negative": { title: "When it does not happen" },
  "places-action": { title: "Where does it happen?" },
  "places-movement": { title: "Destination, transport, or vehicle?" },
  "people-particles": { title: "The verb chooses the particle" },
  "people-desire": { title: "I want to… Shall we…?" },
  "travel-questions": { title: "Ask politely" },
  "travel-existence": { title: "Is there something or someone?" },
  "traps-particles": { title: "Written one way, pronounced another" },
  "traps-verbs": { title: "る does not identify the group" },
};

const enObjectives: CourseCopy["objectives"] = {
  "sounds-core": "Start with vowels: they remain recognizable in every row.",
  "sounds-special": "っ and long vowels change rhythm and meaning.",
  "sentence-order": "Details come first; the main action comes last.",
  "sentence-omission": "は introduces the topic; obvious information can disappear.",
  "actions-object": "を follows the direct object.",
  "actions-masu": "ます creates a reusable polite form.",
  "time-past": "ます and ました show whether the action is complete.",
  "time-negative": "ません and ませんでした negate without changing the base.",
  "places-action": "で marks where the action takes place.",
  "places-movement": "に and で mark different roles depending on meaning.",
  "people-particles": "You meet someone with に and wait for someone with を.",
  "people-desire": "たいです expresses desire; ましょう makes a suggestion.",
  "travel-questions": "か makes a question; ください requests something.",
  "travel-existence": "あります is for things; います is for people and animals.",
  "traps-particles": "As particles, は・へ・を have special readings.",
  "traps-verbs": "かえる is godan; the future remains implicit.",
};

const enBlocks: CourseCopy["blocks"] = {
  "sounds-core-rule": {
    title: "Five stable vowels",
    body: "Every row pairs a consonant with a・i・u・e・o.",
  },
  "sounds-core-comparison": {
    title: "From vowel to syllable",
    body: "Put a consonant in front of the vowel: あ becomes か.",
  },
  "sounds-core-explore": {
    title: "Explore signs and sounds in the Syllabary",
    body: "Walk through the 46 core signs and hear how dakuten and handakuten change them.",
  },
  "sounds-core-recap": {
    title: "In short",
    bullets: ["Every sign has a short beat", "Rōmaji is a temporary aid", "Listen and repeat"],
  },
  "sounds-special-rule": {
    title: "Rhythm is written",
    body: "っ creates a pause and doubles; a long vowel lasts two beats.",
  },
  "sounds-special-comparison": {
    title: "きて or きって?",
    body: "The small っ inserts a pause that changes the word.",
  },
  "sounds-special-explore": {
    title: "Look for っ and the small signs in the Syllabary",
    body: "Open the special sections and compare normal and small signs.",
  },
  "sounds-special-recap": {
    title: "In short",
    bullets: ["っ is not pronounced on its own", "A long vowel lasts two beats", "ん is its own mora"],
  },
  "sentence-order-rule": {
    title: "Details first, the verb last",
    body: "Start from the action and add what you need in front.",
  },
  "sentence-order-comparison": {
    title: "Add a time reference",
    body: "From “I eat ramen” to “today I eat ramen”: きょう opens the sentence.",
  },
  "sentence-order-explore": {
    title: "Move the time word to the front",
    body: "Compare the sentence with and without きょう in front.",
  },
  "sentence-order-recap": {
    title: "In short",
    bullets: ["The verb tends to close the sentence", "Particles show the roles", "Do not copy English word order"],
  },
  "sentence-omission-rule": {
    title: "What is obvious can disappear",
    body: "When context is clear, I, you, or he/she are often left out.",
  },
  "sentence-omission-comparison": {
    title: "With and without a topic",
    body: "わたしは can drop when context is clear: りっちです remains.",
  },
  "sentence-omission-explore": {
    title: "Remove the explicit topic",
    body: "Start from わたしは…, then look at the sentence with no topic.",
  },
  "sentence-omission-recap": {
    title: "In short",
    bullets: ["は marks the topic", "です makes a noun sentence polite", "Do not always add わたし"],
  },
  "actions-object-rule": {
    title: "Noun + を + verb",
    body: "を labels what the verb acts on.",
  },
  "actions-object-comparison": {
    title: "Add the object",
    body: "From “I eat” to “I eat ramen”: らーめん を comes before the verb.",
  },
  "actions-object-explore": {
    title: "Attach an object to the verb",
    body: "Start from the verb alone and add らーめん を in front.",
  },
  "actions-object-recap": {
    title: "In short",
    bullets: ["を follows the object", "を is pronounced o", "The verb stays at the end"],
  },
  "actions-masu-rule": {
    title: "ます-form stem + ending",
    body: "The part before ます is reused across polite forms.",
  },
  "actions-masu-comparison": {
    title: "From plain form to ます",
    body: "たべる becomes たべます: the stem たべ stays, the tail changes.",
  },
  "actions-masu-explore": {
    title: "Swap the ending",
    body: "Compare たべる and たべます while keeping the same stem.",
  },
  "actions-masu-recap": {
    title: "In short",
    bullets: ["ます is polite", "The stem depends on the group", "The ending is the gear"],
  },
  "time-past-rule": {
    title: "ます → ました",
    body: "The stem does not change; ました marks a completed action.",
  },
  "time-past-comparison": {
    title: "Today or yesterday?",
    body: "たべます becomes たべました once the action is done.",
  },
  "time-past-explore": {
    title: "Transform the tense on the board",
    body: "In the Lab, switch from ます to ました and watch the tail.",
  },
  "time-past-recap": {
    title: "In short",
    bullets: ["ます is non-past", "ました is past", "The future still uses ます"],
  },
  "time-negative-rule": {
    title: "ません and ませんでした",
    body: "Negation lives in the ending.",
  },
  "time-negative-comparison": {
    title: "Affirm or negate?",
    body: "たべます becomes たべません without touching the stem.",
  },
  "time-negative-explore": {
    title: "Turn the action on and off",
    body: "In the Lab, compare affirmative and negative.",
  },
  "time-negative-recap": {
    title: "In short",
    bullets: ["ません negates the non-past", "ませんでした negates the past", "The stem stays recognizable"],
  },
  "places-action-rule": {
    title: "Place + で",
    body: "で says where the action happens.",
  },
  "places-action-comparison": {
    title: "Add the place",
    body: "From “I eat ramen” to “I eat ramen at the restaurant”: れすとらん で.",
  },
  "places-action-explore": {
    title: "Add and remove the place",
    body: "In the Lab, insert a place with で and compare.",
  },
  "places-action-recap": {
    title: "In short",
    bullets: ["で = place of the action", "Do not use に for this role", "The place comes before the object"],
  },
  "places-movement-rule": {
    title: "に for the destination, で for the means",
    body: "For direction you will also meet へ, pronounced e.",
  },
  "places-movement-comparison": {
    title: "Destination or means?",
    body: "From “I go to the station” to “I go by train”: でんしゃ で marks the means.",
  },
  "places-movement-explore": {
    title: "Build a trip",
    body: "In the Lab, choose destination and means separately.",
  },
  "places-movement-recap": {
    title: "In short",
    bullets: ["えきに = to the station", "でんしゃで = by train", "でんしゃにのる = to board the train"],
  },
  "people-particles-rule": {
    title: "The verb chooses the link",
    body: "あう uses に; まつ uses を.",
  },
  "people-particles-comparison": {
    title: "Wait or meet?",
    body: "From ともだち を まつ to ともだち に あう: particle and verb both change.",
  },
  "people-particles-explore": {
    title: "Swap verb and particle",
    body: "Compare “wait for a friend” and “meet a friend”.",
  },
  "people-particles-recap": {
    title: "In short",
    bullets: ["ともだちにあう", "ともだちをまつ", "Learn verb + particle together"],
  },
  "people-desire-rule": {
    title: "Stem + たいです",
    body: "たいです expresses your personal wish to do something.",
  },
  "people-desire-comparison": {
    title: "I eat or I want to eat?",
    body: "たべます becomes たべたいです to express desire.",
  },
  "people-desire-explore": {
    title: "Change intent on the board",
    body: "In the Lab, switch from “I eat” to “I want to eat”.",
  },
  "people-desire-recap": {
    title: "In short",
    bullets: ["たいです = personal desire", "It attaches to the ます stem", "It is not a tense"],
  },
  "travel-questions-rule": {
    title: "か closes the question",
    body: "か at the end turns a statement into a polite question.",
  },
  "travel-questions-comparison": {
    title: "Only か is missing",
    body: "えきは どこです becomes a polite question by adding か.",
  },
  "travel-questions-explore": {
    title: "Add か at the end",
    body: "Compare the sentence with and without a final か.",
  },
  "travel-questions-recap": {
    title: "In short",
    bullets: ["か forms the question", "です か = polite question", "It comes up often while traveling"],
  },
  "travel-existence-rule": {
    title: "あります for things; います for animate beings",
    body: "Both mean “there is”, but the choice depends on what exists.",
  },
  "travel-existence-comparison": {
    title: "Thing or person?",
    body: "といれ が あります (thing) becomes せんせい が います (person).",
  },
  "travel-existence-explore": {
    title: "Swap thing and person",
    body: "Compare “there is a restroom” and “there is a teacher”.",
  },
  "travel-existence-recap": {
    title: "In short",
    bullets: ["things = あります", "people/animals = います", "が marks what exists"],
  },
  "traps-particles-rule": {
    title: "As a particle, へ is read e",
    body: "For direction, へ accompanies the destination and is pronounced e.",
  },
  "traps-particles-comparison": {
    title: "に or へ?",
    body: "えきに いきます becomes えきへ いきます: へ marks the direction.",
  },
  "traps-particles-explore": {
    title: "Swap に and へ",
    body: "Compare the destination with に and with へ.",
  },
  "traps-particles-recap": {
    title: "In short",
    bullets: ["As a particle, へ is read e", "へ marks the direction", "に and へ can alternate toward a destination"],
  },
  "traps-verbs-rule": {
    title: "かえる is godan",
    body: "Ending in る is not enough: here the stem is かえり.",
  },
  "traps-verbs-comparison": {
    title: "Add when",
    body: "かえります becomes あした かえります by adding the time reference.",
  },
  "traps-verbs-explore": {
    title: "Add あした",
    body: "Compare the sentence with and without あした in front.",
  },
  "traps-verbs-recap": {
    title: "In short",
    bullets: ["かえる→かえります", "Learn the group together with the verb", "The future is expressed by context"],
  },
};

const enExamples: CourseCopy["examples"] = {
  vowels: { translation: "a · i · u · e · o" },
  "k-row": { translation: "ka · ki · ku · ke · ko" },
  "small-tsu": { translation: "school" },
  "long-vowel": { translation: "today" },
  "sentence-order": { translation: "Today, I'm eating ramen." },
  "topic-copula": { translation: "I am Ricchi." },
  "omitted-subject": { translation: "I'm Ricchi." },
  "this-water": { translation: "This is water." },
  "eat-ramen": { translation: "I eat ramen." },
  "drink-water": { translation: "I drink water." },
  "eat-sushi": { translation: "I eat sushi." },
  "speak-english": { translation: "I speak English." },
  "today-eat": { translation: "Today, I'm eating ramen." },
  "tomorrow-eat": { translation: "Tomorrow, I'll eat ramen." },
  "yesterday-ate": { translation: "Yesterday, I ate ramen." },
  "today-not-eat": { translation: "Today, I'm not eating ramen." },
  "yesterday-not-eat": { translation: "Yesterday, I didn't eat ramen." },
  "restaurant-eat": { translation: "I eat ramen at the restaurant." },
  "home-drink": { translation: "I drink tea at home." },
  "go-station": { translation: "I go to the station." },
  "go-by-train": { translation: "I go by train." },
  "board-train": { translation: "I board the train." },
  "meet-friend": { translation: "I meet a friend." },
  "wait-friend": { translation: "I wait for a friend." },
  "want-sushi": { translation: "I want to eat sushi." },
  "lets-go": { translation: "Let's go to the station." },
  "where-station": { translation: "Where is the station?" },
  "where-hotel": { translation: "Where is the hotel?" },
  "where-shop": { translation: "Where is the shop?" },
  "water-please": { translation: "Water, please." },
  "menu-please": { translation: "The menu, please." },
  "restroom-exists": { translation: "There is a restroom." },
  "teacher-exists": { translation: "There is a teacher." },
  "particle-wa": { translation: "Hello." },
  "particle-e": { translation: "I go toward the station." },
  "return-godan": { translation: "I go back home." },
  "tomorrow-return": { translation: "Tomorrow, I'll go back home." },
  "vowel-a": { translation: "a" },
  "syllable-ka": { translation: "ka" },
  "kana-kite": { translation: "come" },
  "kana-kitte": { translation: "stamp" },
  "eat-dict": { translation: "to eat" },
  "eat-masu": { translation: "I eat." },
  "today-ate": { translation: "Today, I ate ramen." },
  "station-copula": { translation: "The station is where" },
};

export const en = {
  ...enUi,
  courseMap: enCourseMap,
  modules: enModules,
  lessons: enLessons,
  objectives: enObjectives,
  outcomes: enOutcomes,
  blocks: enBlocks,
  examples: enExamples,
} satisfies CourseCopy;
