import type { CourseCopy } from "./types";

const enUi = {
  home: {
    eyebrow: "Guided course",
    title: "Build Japanese one gear at a time.",
    lead: "Start with sounds, learn to see sentence roles, and reach the patterns most useful while traveling.",
    continue: "Continue",
    allVisited: "All visited",
    start: "Start",
    review: "Review",
    reset: "Reset progress",
    resetConfirm: "Do you really want to reset your course progress?",
    corruptProgress: "Course progress could not be read and was reset. Language and script settings were not changed.",
    dismiss: "Dismiss",
    invalidRoute: (path: string) => `“${path}” does not exist. You are back at the course.`,
    lessonsProgress: (visited: number, total: number) =>
      `${visited} of ${total} lessons`,
  },
  lesson: {
    back: "All modules",
    modulePosition: (current: number, total: number) =>
      `Module ${current} of ${total}`,
    previous: "Previous lesson",
    next: "Next lesson",
    listen: "Listen",
    playing: "Playing…",
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
    body: "Each row combines a consonant with a・i・u・e・o.",
  },
  "sounds-core-examples": {
    title: "Read by columns",
    body: "Listen without forcing English-like stress.",
  },
  "sounds-core-tool": {
    title: "Explore core signs and modified sounds",
    body: "Work through the 46 signs, then compare dakuten and handakuten in the hiragana chart.",
  },
  "sounds-core-summary": {
    title: "Remember",
    bullets: ["Each sign has a short beat", "Rōmaji is temporary support", "Listen and repeat"],
  },
  "sounds-special-rule": {
    title: "Rhythm is written",
    body: "っ creates a pause and doubling; a long vowel lasts two beats.",
  },
  "sounds-special-examples": {
    title: "Compare length and pause",
    body: "Do not skip small signs.",
  },
  "sounds-special-tool": {
    title: "Find っ, ゃ, ゅ, ょ",
    body: "Use the special sections of the chart.",
  },
  "sounds-special-summary": {
    title: "Remember",
    bullets: ["っ is not pronounced by itself", "A long vowel lasts two beats", "ん is an independent mora"],
  },
  "sentence-order-rule": {
    title: "Details first, verb last",
    body: "Start from the action and add needed details before it.",
  },
  "sentence-order-examples": {
    title: "Follow the path",
    body: "Time → object → verb.",
  },
  "sentence-order-topic": {
    title: "は puts the topic on the table",
    body: "Do not translate は word for word; as a particle, it is pronounced wa.",
  },
  "sentence-order-tool": {
    title: "Open the first board",
    body: "See how time, object, and verb occupy different positions.",
  },
  "sentence-order-summary": {
    title: "Remember",
    bullets: ["The verb tends to come last", "Particles show roles", "Do not copy English word order"],
  },
  "sentence-omission-rule": {
    title: "Obvious information can disappear",
    body: "If context is clear, I, you, he, or she are often omitted.",
  },
  "sentence-omission-examples": {
    title: "With and without a topic",
    body: "りっちです can be enough after “what is your name?”.",
  },
  "sentence-omission-summary": {
    title: "Remember",
    bullets: ["は marks the topic", "です makes a noun sentence polite", "Do not always add わたし"],
  },
  "actions-object-rule": {
    title: "Noun + を + verb",
    body: "を labels what the verb acts on.",
  },
  "actions-object-examples": {
    title: "Same structure, different actions",
    body: "Noun and verb change; を keeps the role.",
  },
  "actions-object-tool": {
    title: "Move the object on the board",
    body: "Start with “eat,” then switch scenarios: drink, buy, watch, or speak.",
  },
  "actions-object-summary": {
    title: "Remember",
    bullets: ["を follows the object", "を is pronounced o", "The verb stays at the end"],
  },
  "actions-masu-rule": {
    title: "ます-form base + ending",
    body: "The part before ます is reused in polite forms.",
  },
  "actions-masu-examples": {
    title: "Find the base",
    body: "たべ・はなし remain visible.",
  },
  "actions-masu-tool": {
    title: "Change verb, keep the form",
    body: "Compare speaking and eating.",
  },
  "actions-masu-summary": {
    title: "Remember",
    bullets: ["ます is polite", "The base depends on the verb group", "The ending is the gear"],
  },
  "time-past-rule": {
    title: "ます → ました",
    body: "The base stays; ました marks a completed action.",
  },
  "time-past-examples": {
    title: "Today and yesterday",
    body: "Adverb and ending must tell the same time.",
  },
  "time-past-tool": {
    title: "Transform the sentence",
    body: "Move from today to yesterday and watch the ending.",
  },
  "time-past-summary": {
    title: "Remember",
    bullets: ["ます is non-past", "ました is past", "The future still uses ます"],
  },
  "time-negative-rule": {
    title: "ません and ませんでした",
    body: "Negation lives in the ending.",
  },
  "time-negative-examples": {
    title: "Not now, not yesterday",
    body: "ません is non-past; ませんでした is past.",
  },
  "time-negative-tool": {
    title: "Turn the action on and off",
    body: "Compare affirmative and negative.",
  },
  "time-negative-summary": {
    title: "Remember",
    bullets: ["ません negates the non-past", "ませんでした negates the past", "The base stays recognizable"],
  },
  "places-action-rule": {
    title: "Place + で",
    body: "で says where the action happens.",
  },
  "places-action-examples": {
    title: "Restaurant or home",
    body: "The place changes, the action stays.",
  },
  "places-action-tool": {
    title: "Add and remove the place",
    body: "The place is optional when context is clear.",
  },
  "places-action-summary": {
    title: "Remember",
    bullets: ["で = place of action", "Do not use に for this role", "The place comes before the object"],
  },
  "places-movement-rule": {
    title: "に for destination, で for transport",
    body: "With のる, the vehicle uses に because it is what you board. You will also meet へ, pronounced e, for direction.",
  },
  "places-movement-examples": {
    title: "Three roles, two particles",
    body: "Destination, transport, and boarded vehicle are different.",
  },
  "places-movement-tool": {
    title: "Build a trip",
    body: "Choose destination and transport separately.",
  },
  "places-movement-summary": {
    title: "Remember",
    bullets: ["えきに = to the station", "でんしゃで = by train", "でんしゃにのる = board the train"],
  },
  "people-particles-rule": {
    title: "The verb chooses the link",
    body: "あう uses に; まつ uses を.",
  },
  "people-particles-examples": {
    title: "Meet and wait",
    body: "Do not choose the particle by translating “person”.",
  },
  "people-particles-tool": {
    title: "Change the person",
    body: "Try friend, teacher, and family.",
  },
  "people-particles-summary": {
    title: "Remember",
    bullets: ["ともだちにあう", "ともだちをまつ", "Learn verb + particle together"],
  },
  "people-desire-rule": {
    title: "Base + たいです; base + ましょう",
    body: "One expresses desire; the other proposes shared action.",
  },
  "people-desire-examples": {
    title: "Want or shall we?",
    body: "Notice who performs the action.",
  },
  "people-desire-tool": {
    title: "Transform intent",
    body: "Move from I eat to I want to eat.",
  },
  "people-desire-summary": {
    title: "Remember",
    bullets: ["たいです = personal desire", "ましょう = suggestion", "They are not verb tenses"],
  },
  "travel-questions-rule": {
    title: "か closes a question; ください makes a request",
    body: "These are highly useful fixed travel patterns.",
  },
  "travel-questions-examples": {
    title: "Where? Please.",
    body: "Listen to intonation and recognize the structure.",
  },
  "travel-questions-tool": {
    title: "Put the pattern into a station scenario",
    body: "Open a movement sentence and notice the destination marked by に.",
  },
  "travel-questions-summary": {
    title: "Remember",
    bullets: ["ですか = polite question", "〜をください = I'd like…", "Avoid translating every word"],
  },
  "travel-existence-rule": {
    title: "あります for things; います for animate beings",
    body: "Both express existence; the choice depends on what exists.",
  },
  "travel-existence-examples": {
    title: "Restroom or teacher?",
    body: "A thing uses あります; a person uses います.",
  },
  "travel-existence-summary": {
    title: "Remember",
    bullets: ["things = あります", "people/animals = います", "が marks what exists"],
  },
  "traps-particles-rule": {
    title: "は→wa, へ→e, を→o",
    body: "These special readings occur when the signs are particles.",
  },
  "traps-particles-examples": {
    title: "Read the role, not only the sign",
    body: "The same sign can be read differently outside particle use.",
  },
  "traps-omission-callout": {
    title: "The subject can stay implicit",
    body: "When context is clear, Japanese does not repeat I, you, or he/she: do not always add わたし.",
  },
  "traps-existence-callout": {
    title: "Things and people do not “exist” the same way",
    body: "Use あります for things and います for people and animals.",
  },
  "traps-loanwords-callout": {
    title: "Loanwords stay in hiragana here",
    body: "For reading practice, the app shows words such as れすとらん in hiragana; real Japanese normally writes loanwords in katakana: レストラン.",
  },
  "traps-particles-summary": {
    title: "Remember",
    bullets: ["In こんにちは, は is read wa", "As a particle, へ is read e", "As a particle, を is read o"],
  },
  "traps-verbs-rule": {
    title: "かえる is godan",
    body: "Ending in る is not enough: the base here is かえり.",
  },
  "traps-verbs-examples": {
    title: "Group and time effect",
    body: "あした changes the translation, not the ます form.",
  },
  "traps-verbs-tool": {
    title: "Check it on the board",
    body: "Open “Go back” with tomorrow.",
  },
  "traps-verbs-summary": {
    title: "Remember",
    bullets: ["かえる→かえります", "Learn the group together with the verb", "Context expresses the future"],
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
};

export const en = {
  ...enUi,
  modules: enModules,
  lessons: enLessons,
  objectives: enObjectives,
  outcomes: enOutcomes,
  blocks: enBlocks,
  examples: enExamples,
} satisfies CourseCopy;
