import type { LocalePack, PredicateForms } from "./types";

const p = (
  current: string,
  habitual: string,
  future: string,
  past: string,
  currentNegative: string,
  habitualNegative: string,
  futureNegative: string,
  pastNegative: string,
  suggestion: string,
  desire: string,
): PredicateForms => ({
  current, habitual, future, past,
  currentNegative, habitualNegative, futureNegative, pastNegative,
  suggestion, desire,
});

const watching = p("I'm watching", "I watch", "I'll watch", "I watched", "I'm not watching", "I don't watch", "I won't watch", "I didn't watch", "let's watch", "I want to watch");
const doing = p("I'm doing", "I do", "I'll do", "I did", "I'm not doing", "I don't do", "I won't do", "I didn't do", "let's do", "I want to do");
const making = p("I'm making", "I make", "I'll make", "I made", "I'm not making", "I don't make", "I won't make", "I didn't make", "let's make", "I want to make");

const concepts: LocalePack["concepts"] = {
  ramen: { label: "ramen", realizations: { object: "ramen" } },
  sushi: { label: "sushi", realizations: { object: "sushi" } },
  onigiri: { label: "onigiri", realizations: { object: "an onigiri" } },
  water: { label: "water", realizations: { object: "water" } },
  beer: { label: "beer", realizations: { object: "beer" } },
  tea: { label: "tea", realizations: { object: "tea" } },
  ticket: { label: "ticket", realizations: { object: "a ticket" } },
  souvenir: { label: "souvenir", realizations: { object: "a souvenir" } },
  movie: { label: "movie", realizations: { object: "a movie" } },
  map: { label: "map", realizations: { object: "the map" } },
  menu: { label: "menu", realizations: { object: "the menu" } },
  restaurant: { label: "restaurant", realizations: { actionPlace: "at the restaurant" } },
  home: { label: "home", realizations: { actionPlace: "at home", destination: "home" } },
  bar: { label: "bar", realizations: { actionPlace: "at the bar" } },
  shop: { label: "shop", realizations: { actionPlace: "at the shop", destination: "to the shop" } },
  station: { label: "station", realizations: { actionPlace: "at the station", destination: "to the station" } },
  hotel: { label: "hotel", realizations: { destination: "to the hotel" } },
  airport: { label: "airport", realizations: { destination: "to the airport" } },
  japan: { label: "Japan", realizations: { destination: "to Japan" } },
  party: { label: "party", realizations: { destination: "to the party" } },
  train: { label: "train", realizations: { transport: "by train", vehicleBoarded: "the train", object: "the train" } },
  bus: { label: "bus", realizations: { transport: "by bus", vehicleBoarded: "the bus", object: "the bus" } },
  taxi: { label: "taxi", realizations: { transport: "by taxi", vehicleBoarded: "a taxi", object: "a taxi" } },
  friend: { label: "friend", realizations: { object: "a friend", personTarget: "a friend" } },
  teacher: { label: "teacher", realizations: { personTarget: "the teacher" } },
  family: { label: "family", realizations: { personTarget: "my family" } },
  reservation: { label: "reservation", realizations: { object: "a reservation" } },
  shopping: { label: "shopping", realizations: { object: "some shopping" } },
  phoneCall: { label: "phone call", realizations: { object: "a phone call" } },
  japaneseLanguage: { label: "Japanese", realizations: { object: "Japanese" } },
  englishLanguage: { label: "English", realizations: { object: "English" } },
};

const scenarios: LocalePack["scenarios"] = {
  eat: {
    title: "Eat something",
    slots: { object: { prompt: "What?", grammar: "direct object" }, place: { prompt: "Where does it happen?", grammar: "place of action" } },
    predicate: p("I'm eating", "I eat", "I'll eat", "I ate", "I'm not eating", "I don't eat", "I won't eat", "I didn't eat", "let's eat", "I want to eat"),
  },
  drink: {
    title: "Drink something",
    slots: { object: { prompt: "What?", grammar: "direct object" }, place: { prompt: "Where does it happen?", grammar: "place of action" } },
    predicate: p("I'm drinking", "I drink", "I'll drink", "I drank", "I'm not drinking", "I don't drink", "I won't drink", "I didn't drink", "let's drink", "I want to drink"),
  },
  buy: {
    title: "Buy something",
    slots: { object: { prompt: "What?", grammar: "direct object" }, place: { prompt: "Where does it happen?", grammar: "place of action" } },
    predicate: p("I'm buying", "I buy", "I'll buy", "I bought", "I'm not buying", "I don't buy", "I won't buy", "I didn't buy", "let's buy", "I want to buy"),
  },
  watch: {
    title: "Watch or look at something",
    slots: { object: { prompt: "What?", grammar: "direct object" } },
    predicate: p("I'm looking at", "I look at", "I'll look at", "I looked at", "I'm not looking at", "I don't look at", "I won't look at", "I didn't look at", "let's look at", "I want to look at"),
    predicateByOption: { movie: watching },
  },
  go: {
    title: "Go somewhere",
    slots: { destination: { prompt: "Where to?", grammar: "destination" }, transport: { prompt: "How?", grammar: "means of transport" } },
    predicate: p("I'm going", "I go", "I'll go", "I went", "I'm not going", "I don't go", "I won't go", "I didn't go", "let's go", "I want to go"),
  },
  return: {
    title: "Go back",
    slots: { destination: { prompt: "Where to?", grammar: "destination" } },
    predicate: p("I'm going back", "I go back", "I'll go back", "I went back", "I'm not going back", "I don't go back", "I won't go back", "I didn't go back", "let's go back", "I want to go back"),
  },
  board: {
    title: "Board a vehicle",
    slots: { vehicle: { prompt: "Which vehicle?", grammar: "vehicle being boarded" } },
    predicate: p("I'm taking", "I take", "I'll take", "I took", "I'm not taking", "I don't take", "I won't take", "I didn't take", "let's take", "I want to take"),
  },
  wait: {
    title: "Wait for someone or something",
    slots: { target: { prompt: "Who or what?", grammar: "direct object" } },
    predicate: p("I'm waiting for", "I wait for", "I'll wait for", "I waited for", "I'm not waiting for", "I don't wait for", "I won't wait for", "I didn't wait for", "let's wait for", "I want to wait for"),
  },
  meet: {
    title: "Meet someone",
    slots: { person: { prompt: "Who?", grammar: "person met" } },
    predicate: p("I'm meeting", "I meet", "I'll meet", "I met", "I'm not meeting", "I don't meet", "I won't meet", "I didn't meet", "let's meet", "I want to meet"),
  },
  do: {
    title: "Do an activity",
    slots: { activity: { prompt: "Which activity?", grammar: "direct object" } },
    predicate: doing,
    predicateByOption: { reservation: making, shopping: doing, phoneCall: making },
  },
  come: {
    title: "Come somewhere",
    slots: { destination: { prompt: "Where to?", grammar: "destination" } },
    predicate: p("I'm coming", "I come", "I'll come", "I came", "I'm not coming", "I don't come", "I won't come", "I didn't come", "let's come", "I want to come"),
  },
  speak: {
    title: "Speak a language",
    slots: { language: { prompt: "Which language?", grammar: "direct object" } },
    predicate: p("I'm speaking", "I speak", "I'll speak", "I spoke", "I'm not speaking", "I don't speak", "I won't speak", "I didn't speak", "let's speak", "I want to speak"),
  },
};

const forms: LocalePack["forms"] = {
  pres: { label: "Now / habit / future", grammar: "non-past affirmative · 〜ます" },
  past: { label: "It happened", grammar: "past affirmative · 〜ました" },
  neg: { label: "It doesn't / won't happen", grammar: "non-past negative · 〜ません" },
  pastneg: { label: "It didn't happen", grammar: "past negative · 〜ませんでした" },
  vol: { label: "Shall we…?", grammar: "suggestion / invitation · 〜ましょう" },
  des: { label: "I want to…", grammar: "desire · 〜たいです" },
};

const times: LocalePack["times"] = { today: "today", yesterday: "yesterday", tomorrow: "tomorrow", tonight: "tonight", everyDay: "every day", none: "" };

const ui: LocalePack["ui"] = {
  documentTitle: "Hanasō · Learn Japanese",
  brand: {
    title: "Practical Japanese",
    subtitle: "Speaking · sentence building · hiragana first",
  },
  nav: { modes: "Study modes", syllabary: "Hiragana", phrasebook: "Phrasebook", laboratory: "Sentence Lab", primary: "Primary navigation", course: "Course", practice: "Free practice" },
  settings: {
    menu: "Settings",
    language: "Language",
    writing: "Script",
    reference: "Show reference translation",
    unavailable: "Preferences will remain active for this session only.",
  },
  common: { listen: "Listen", slow: "Slow", playing: "Playing…", none: "—", optional: "optional", phrases: "phrases" },
  lab: {
    scenario: "Scenario", board: "Board", verb: "Verb", verbForm: "What happens to the verb?", when: "When?", rule: "Rule",
    base: "ます-form base:", ending: "ending:",
    particles: "Particles show each word's role.",
    endings: "Endings show the form and whether the sentence is affirmative or negative.",
    natural: "Natural combination",
    contextual: "Possible, but the past needs context: for example, “every day during that trip” or, later the same evening, “tonight I ate early.”",
    incompatible: "This combination does not fit the basic model. With yesterday, choose a past form; with tomorrow, choose a non-past form. Past wishes and invitations require patterns not included yet.",
  },
  speech: {
    unsupported: "This browser does not support speech synthesis.",
    missingVoice: "No Japanese voice is available; all text remains usable.",
    failed: "Audio playback failed. You can continue using the text.",
  },
  syllabary: { title: "Hiragana", base: "Core signs and sounds", voiced: "Dakuten and handakuten", combinations: "Combinations with small ゃ・ゅ・ょ", notes: "Remember" },
  phrasebook: { categoriesLabel: "Phrase categories" },
  footer: "Made for learning · browser audio · hiragana first",
};

export const en = { locale: "en", ui, forms, times, concepts, scenarios } satisfies LocalePack;
