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
      journeyLabel: "A day of travel, scene by scene",
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
    invalidPresetTitle: "Invalid guided link",
    invalidReturn: "This return link is invalid; use the navigation to go back to the lesson.",
    invalidReturnTitle: "Invalid return",
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
  "questions-existence": { title: "Questions and existence" },
  capstone: { title: "Synthesis: a day of travel" },
};
const enOutcomes: CourseCopy["outcomes"] = {
  sounds: "Read and hear the signs used throughout the course.",
  "sentence-map": "Mark the topic with は and close the sentence with です.",
  actions: "Link the object to the verb with を and ask for something with ください.",
  time: "Change time and switch between affirmative and negative without losing the structure.",
  places: "Tell where you act with で apart from where you go with に and へ.",
  people: "Connect people with と and に, express wishes, and make suggestions.",
  "questions-existence":
    "Ask questions with か and say that something or someone is there with あります・います.",
  capstone:
    "Recombine ordering, movement, people, wishes, questions, and existence across one travel day.",
};

const enLessons: CourseCopy["lessons"] = {
  "sounds-core": { title: "The five core sounds" },
  "sounds-special": { title: "Small signs, big differences" },
  "sentence-order": { title: "This is… (これは…です)" },
  "sentence-omission": { title: "Who are we talking about?" },
  "actions-object": { title: "What receives the action?" },
  "actions-masu": { title: "Asking with ください" },
  "time-past": { title: "Today or yesterday?" },
  "time-negative": { title: "When it does not happen" },
  "places-action": { title: "Where does it happen?" },
  "places-movement": { title: "Where are you going? に and へ" },
  "people-particles": { title: "Who are you doing it with?" },
  "people-desire": { title: "I want to… Shall we…?" },
  "travel-questions": { title: "Ask politely" },
  "travel-existence": { title: "Is there something or someone?" },
  "traps-particles": { title: "Is it there? Ask with か" },
  "traps-verbs": { title: "A day of travel" },
};

const enObjectives: CourseCopy["objectives"] = {
  "sounds-core": "Start with vowels: they remain recognizable in every row.",
  "sounds-special": "っ and long vowels change rhythm and meaning.",
  "sentence-order": "これは marks the topic with は; です closes the noun sentence.",
  "sentence-omission": "は introduces the topic; obvious information can disappear.",
  "actions-object": "を follows the direct object.",
  "actions-masu": "ください turns the sentence into a polite request.",
  "time-past": "ます is non-past; ました shows the action is complete.",
  "time-negative": "ません and ませんでした negate without changing the base.",
  "places-action": "で marks where the action takes place.",
  "places-movement":
    "に marks the destination you move toward; へ points in the same direction.",
  "people-particles": "に marks the person you meet; と marks who you do it with.",
  "people-desire":
    "たいです expresses a wish; ましょう proposes (“let's…”), ましょうか offers or asks tentatively (“shall we…? / would you like…?”).",
  "travel-questions": "か at the end turns a statement into a polite question.",
  "travel-existence": "あります is for things; います is for people and animals.",
  "traps-particles":
    "Ask whether a thing (あります) or a person (います) is there by ending with か.",
  "traps-verbs":
    "Recombine ordering, movement, people, wishes, questions, and existence into one travel day.",
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
    title: "Topic + は + です",
    body: "これは marks the topic; です closes the sentence politely. Write it as one string: これはみずです.",
  },
  "sentence-order-comparison": {
    title: "Add the topic",
    body: "From みずです to これはみずです: これは says what you are talking about.",
  },
  "sentence-order-explore": {
    title: "Add これは in front",
    body: "Compare the sentence with and without これは in front.",
  },
  "sentence-order-recap": {
    title: "In short",
    bullets: ["これは marks the topic with は", "です makes a noun sentence polite", "これはみずです is written without spaces"],
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
    body: "From たべます to ラーメンをたべます: ラーメンを comes before the verb.",
  },
  "actions-object-explore": {
    title: "Attach an object to the verb",
    body: "Start from たべます and add ラーメンを in front.",
  },
  "actions-object-recap": {
    title: "In short",
    bullets: ["を follows the object", "を is pronounced o", "The verb stays at the end"],
  },
  "actions-masu-rule": {
    title: "Object + を + ください",
    body: "ください politely asks for something: ラーメンをください.",
  },
  "actions-masu-comparison": {
    title: "Eat or order?",
    body: "From ラーメンをたべます to ラーメンをください: ください makes the request.",
  },
  "actions-masu-explore": {
    title: "Turn it into a request",
    body: "Start from みず and add をください to ask: みずをください.",
  },
  "actions-masu-recap": {
    title: "In short",
    bullets: ["ください = polite request", "を marks what you ask for", "Handy for ordering while traveling"],
  },
  "time-past-rule": {
    title: "ます → ました",
    body: "The stem does not change; ました marks a completed action.",
  },
  "time-past-comparison": {
    title: "Non-past or past?",
    body: "たべます becomes たべました once the action is done.",
  },
  "time-past-explore": {
    title: "Transform the tense on the board",
    body: "In the Lab, switch from ます to ました and watch the tail.",
  },
  "time-past-recap": {
    title: "In short",
    bullets: ["ます is non-past", "ました is past", "The future comes from context and time words"],
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
    body: "From “I eat ramen” to “I eat ramen at the restaurant”: レストランで.",
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
    title: "Destination with に — and its twin へ",
    body: "に marks the place you move toward: えきにいきます. へ (read e) points the same way: えきへいきます.",
  },
  "places-movement-comparison": {
    title: "Add the destination",
    body: "From いきます to えきにいきます: えきに says where you go.",
  },
  "places-movement-explore": {
    title: "Swap に for へ",
    body: "From えきにいきます to えきへいきます: both mark where you head; へ is the directional twin of に (spelled he, read e).",
  },
  "places-movement-recap": {
    title: "In short",
    bullets: [
      "に marks the destination of movement: えきにいきます",
      "へ points in the same direction, read e: えきへいきます",
      "いきます = I go",
    ],
  },
  "people-particles-rule": {
    title: "に for the person, と for company",
    body: "せんせいにあいます: に marks who you meet. ともだちと…: と marks who with.",
  },
  "people-particles-comparison": {
    title: "Add the company",
    body: "From せんせいにあいます to ともだちとせんせいにあいます: ともだちと says who with.",
  },
  "people-particles-explore": {
    title: "Add ともだちと in front",
    body: "Start from せんせいにあいます and add ともだちと to say who with.",
  },
  "people-particles-recap": {
    title: "In short",
    bullets: ["に marks the person you meet", "と marks who you do it with", "せんせいにあいます / ともだちとあいます"],
  },
  "people-desire-rule": {
    title: "Stem + たいです",
    body: "たいです expresses the wish to do something: たべたいです.",
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
    bullets: [
      "たいです = “I want to…”",
      "いきましょう = suggestion (“let's go”)",
      "いきましょうか = tentative offer (“shall we go? / would you like to go?”)",
    ],
  },
  "travel-questions-rule": {
    title: "か closes the question",
    body: "か at the end turns a statement into a polite question.",
  },
  "travel-questions-comparison": {
    title: "Only か is missing",
    body: "えきはどこです becomes えきはどこですか by adding か.",
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
    body: "トイレがあります (thing) becomes せんせいがいます (person).",
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
    title: "Ask if it's there with か",
    body: "End an existence sentence with か to ask a yes/no question: トイレがありますか?",
  },
  "traps-particles-comparison": {
    title: "Statement → question",
    body: "トイレがあります becomes トイレがありますか: か turns the existence statement into a yes/no question.",
  },
  "traps-particles-explore": {
    title: "A thing or a person?",
    body: "Swap the thing for a person: トイレがありますか ↔ せんせいがいますか (あります for things, います for people).",
  },
  "traps-particles-recap": {
    title: "In short",
    bullets: [
      "か at the end asks a yes/no question",
      "あります asks about things, います about people",
      "トイレがありますか / せんせいがいますか",
    ],
  },
  "traps-verbs-rule": {
    title: "Recombine the gears",
    body: "No new grammar: line up time, companion, place, object, and the wish ending.",
  },
  "traps-verbs-comparison": {
    title: "Recombine the gears",
    body: "From ラーメンをたべます to あしたともだちとレストランでラーメンをたべたいです: あした (when), と (with whom), で (where), and たいです (the wish) all come into play.",
  },
  "traps-verbs-explore": {
    title: "Walk through the day",
    body: "Replay the day scene by scene: order at the restaurant, head to the station, invite a friend, and ask whether something is there.",
  },
  "traps-verbs-recap": {
    title: "In short",
    bullets: [
      "One day reuses many gears at once",
      "order → move → invite → ask if it's there",
      "Reuse what you know, with no new grammar",
    ],
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
  "it-is-water": { translation: "It's water." },
  "this-is-water": { translation: "This is water." },
  water: { translation: "Water." },
  "order-ramen-eat": { translation: "I eat ramen." },
  "order-ramen-please": { translation: "One ramen, please." },
  "go-bare": { translation: "I go." },
  "meet-teacher": { translation: "I meet the teacher." },
  "meet-with-friend": { translation: "I meet the teacher with a friend." },
  "travel-day": { translation: "Tomorrow I want to eat ramen at a restaurant with a friend." },
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
  "restroom-exists-q": { translation: "Is there a restroom?" },
  "teacher-exists-q": { translation: "Is there a teacher?" },
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

const enJourneyScenes: CourseCopy["journeyScenes"] = {
  "traps-verbs-journey-order": "1. Order at the restaurant: ask for ramen with ください.",
  "traps-verbs-journey-move": "2. Head out: say where you go with に.",
  "traps-verbs-journey-invite": "3. Invite a friend along with ましょう.",
  "traps-verbs-journey-ask-exists": "4. Ask whether something is there with か.",
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
  journeyScenes: enJourneyScenes,
} satisfies CourseCopy;
