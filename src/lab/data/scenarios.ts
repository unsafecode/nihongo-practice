import type { Scenario } from "./types";

export const scenarios: Scenario[] = [
  {
    id: "mangiare",
    emoji: "🍜",
    label: "Mangiare",
    verb: {
      dict: "たべる", group: "ichidan", stemRomaji: "tabe",
      it: { pres: "mangio", past: "ho mangiato", future: "mangerò", neg: "non mangio", negFuture: "non mangerò", pastneg: "non ho mangiato", vol: "mangiamo", des: "voglio mangiare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "らーめん", romaji: "rāmen", it: "il ramen" },
        { jp: "すし", romaji: "sushi", it: "il sushi" },
        { jp: "おにぎり", romaji: "onigiri", it: "l'onigiri" },
      ]},
      { role: "place", label: "Dove", defaultIndex: 0, options: [
        { jp: "れすとらん", romaji: "resutoran", it: "al ristorante" },
        { jp: "いえ", romaji: "ie", it: "a casa" },
        { jp: "", romaji: "", it: "", none: true },
      ]},
    ],
  },
  {
    id: "bere",
    emoji: "🍺",
    label: "Bere",
    verb: {
      dict: "のむ", group: "godan", stemRomaji: "nomi",
      it: { pres: "bevo", past: "ho bevuto", future: "berrò", neg: "non bevo", negFuture: "non berrò", pastneg: "non ho bevuto", vol: "beviamo", des: "voglio bere" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "みず", romaji: "mizu", it: "l'acqua" },
        { jp: "びーる", romaji: "bīru", it: "la birra" },
        { jp: "おちゃ", romaji: "ocha", it: "il tè" },
      ]},
      { role: "place", label: "Dove", defaultIndex: 0, options: [
        { jp: "ばー", romaji: "bā", it: "al bar" },
        { jp: "いえ", romaji: "ie", it: "a casa" },
        { jp: "", romaji: "", it: "", none: true },
      ]},
    ],
  },
  {
    id: "comprare",
    emoji: "🛍️",
    label: "Comprare",
    verb: {
      dict: "かう", group: "godan", stemRomaji: "kai",
      it: { pres: "compro", past: "ho comprato", future: "comprerò", neg: "non compro", negFuture: "non comprerò", pastneg: "non ho comprato", vol: "compriamo", des: "voglio comprare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "きっぷ", romaji: "kippu", it: "il biglietto" },
        { jp: "おみやげ", romaji: "omiyage", it: "un souvenir" },
        { jp: "みず", romaji: "mizu", it: "dell'acqua" },
      ]},
      { role: "place", label: "Dove", defaultIndex: 0, options: [
        { jp: "みせ", romaji: "mise", it: "al negozio" },
        { jp: "えき", romaji: "eki", it: "in stazione" },
        { jp: "", romaji: "", it: "", none: true },
      ]},
    ],
  },
  {
    id: "guardare",
    emoji: "👀",
    label: "Guardare",
    verb: {
      dict: "みる", group: "ichidan", stemRomaji: "mi",
      it: { pres: "guardo", past: "ho guardato", future: "guarderò", neg: "non guardo", negFuture: "non guarderò", pastneg: "non ho guardato", vol: "guardiamo", des: "voglio guardare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "えいが", romaji: "eiga", it: "un film" },
        { jp: "ちず", romaji: "chizu", it: "la mappa" },
        { jp: "めにゅー", romaji: "menyū", it: "il menù" },
      ]},
    ],
  },
  {
    id: "andare",
    emoji: "🚉",
    label: "Andare",
    verb: {
      dict: "いく", group: "godan", stemRomaji: "iki",
      it: { pres: "vado", past: "sono andato/a", future: "andrò", neg: "non vado", negFuture: "non andrò", pastneg: "non sono andato/a", vol: "andiamo", des: "voglio andare" },
    },
    slots: [
      { role: "destination", label: "Dove", defaultIndex: 0, options: [
        { jp: "えき", romaji: "eki", it: "alla stazione" },
        { jp: "ほてる", romaji: "hoteru", it: "in hotel" },
        { jp: "くうこう", romaji: "kūkō", it: "all'aeroporto" },
      ]},
      { role: "transport", label: "Come", defaultIndex: 0, options: [
        { jp: "でんしゃ", romaji: "densha", it: "in treno" },
        { jp: "ばす", romaji: "basu", it: "in autobus" },
        { jp: "たくしー", romaji: "takushī", it: "in taxi" },
        { jp: "", romaji: "", it: "", none: true },
      ]},
    ],
  },
  {
    id: "tornare",
    emoji: "🏠",
    label: "Tornare",
    verb: {
      dict: "かえる", group: "godan", stemRomaji: "kaeri",
      it: { pres: "torno", past: "sono tornato/a", future: "tornerò", neg: "non torno", negFuture: "non tornerò", pastneg: "non sono tornato/a", vol: "torniamo", des: "voglio tornare" },
    },
    slots: [
      { role: "destination", label: "Dove", defaultIndex: 0, options: [
        { jp: "いえ", romaji: "ie", it: "a casa" },
        { jp: "ほてる", romaji: "hoteru", it: "in hotel" },
        { jp: "にほん", romaji: "nihon", it: "in Giappone" },
      ]},
    ],
  },
  {
    id: "prendere",
    emoji: "🚌",
    label: "Prendere (mezzo)",
    verb: {
      dict: "のる", group: "godan", stemRomaji: "nori",
      it: { pres: "prendo", past: "ho preso", future: "prenderò", neg: "non prendo", negFuture: "non prenderò", pastneg: "non ho preso", vol: "prendiamo", des: "voglio prendere" },
    },
    slots: [
      { role: "destination", label: "Cosa", defaultIndex: 0, options: [
        { jp: "でんしゃ", romaji: "densha", it: "il treno" },
        { jp: "ばす", romaji: "basu", it: "l'autobus" },
        { jp: "たくしー", romaji: "takushī", it: "il taxi" },
      ]},
    ],
  },
  {
    id: "aspettare",
    emoji: "⏳",
    label: "Aspettare",
    verb: {
      dict: "まつ", group: "godan", stemRomaji: "machi",
      it: { pres: "aspetto", past: "ho aspettato", future: "aspetterò", neg: "non aspetto", negFuture: "non aspetterò", pastneg: "non ho aspettato", vol: "aspettiamo", des: "voglio aspettare" },
    },
    slots: [
      { role: "object", label: "Chi/Cosa", defaultIndex: 0, options: [
        { jp: "ともだち", romaji: "tomodachi", it: "l'amico" },
        { jp: "ばす", romaji: "basu", it: "l'autobus" },
        { jp: "たくしー", romaji: "takushī", it: "il taxi" },
      ]},
    ],
  },
  {
    id: "incontrare",
    emoji: "🤝",
    label: "Incontrare",
    verb: {
      dict: "あう", group: "godan", stemRomaji: "ai",
      it: { pres: "incontro", past: "ho incontrato", future: "incontrerò", neg: "non incontro", negFuture: "non incontrerò", pastneg: "non ho incontrato", vol: "incontriamoci", des: "voglio incontrare" },
    },
    slots: [
      { role: "person", label: "Chi", defaultIndex: 0, options: [
        { jp: "ともだち", romaji: "tomodachi", it: "l'amico" },
        { jp: "せんせい", romaji: "sensei", it: "l'insegnante" },
        { jp: "かぞく", romaji: "kazoku", it: "la famiglia" },
      ]},
    ],
  },
  {
    id: "fare",
    emoji: "📞",
    label: "Fare",
    verb: {
      dict: "する", group: "irregular", stemRomaji: "shi",
      it: { pres: "faccio", past: "ho fatto", future: "farò", neg: "non faccio", negFuture: "non farò", pastneg: "non ho fatto", vol: "facciamo", des: "voglio fare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "よやく", romaji: "yoyaku", it: "una prenotazione" },
        { jp: "かいもの", romaji: "kaimono", it: "spese" },
        { jp: "でんわ", romaji: "denwa", it: "una telefonata" },
      ]},
    ],
  },
  {
    id: "venire",
    emoji: "🎉",
    label: "Venire",
    verb: {
      dict: "くる", group: "irregular", stemRomaji: "ki",
      it: { pres: "vengo", past: "sono venuto/a", future: "verrò", neg: "non vengo", negFuture: "non verrò", pastneg: "non sono venuto/a", vol: "veniamo", des: "voglio venire" },
    },
    slots: [
      { role: "destination", label: "Dove", defaultIndex: 0, options: [
        { jp: "にほん", romaji: "nihon", it: "in Giappone" },
        { jp: "みせ", romaji: "mise", it: "al negozio" },
        { jp: "ぱーてぃー", romaji: "pātī", it: "alla festa" },
      ]},
    ],
  },
  {
    id: "parlare",
    emoji: "💬",
    label: "Parlare",
    verb: {
      dict: "はなす", group: "godan", stemRomaji: "hanashi",
      it: { pres: "parlo", past: "ho parlato", future: "parlerò", neg: "non parlo", negFuture: "non parlerò", pastneg: "non ho parlato", vol: "parliamo", des: "voglio parlare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "にほんご", romaji: "nihongo", it: "giapponese" },
        { jp: "えいご", romaji: "eigo", it: "inglese" },
      ]},
    ],
  },
];
