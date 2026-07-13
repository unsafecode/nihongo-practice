// Contenuti didattici — giapponese pratico da viaggio.
// Scelta di design: SOLO hiragana per la scrittura (niente kanji né katakana),
// così chi impara deve leggere un solo sillabario. I prestiti che normalmente
// si scrivono in katakana (es. トイレ) qui sono resi in hiragana (といれ).
// Il romaji resta come guida alla pronuncia, la traduzione è localizzata.

import type { Locale } from "../i18n/LocaleContext";
export type LocalizedText = Record<Locale, string>;
export interface Phrase {
  id: string;
  hiragana: string;
  romaji: string;
  translations: LocalizedText;
  notes?: Partial<Record<Locale, string>>;
}
export interface Category {
  id: string;
  labels: LocalizedText;
  hiragana: string;
  emoji: string;
  phrases: Phrase[];
}

export const categories: Category[] = [
  {
    id: "saluti",
    labels: { it: "Saluti", en: "Greetings" },
    hiragana: "あいさつ",
    emoji: "👋",
    phrases: [
      { id: "saluti-01", hiragana: "おはようございます", romaji: "ohayō gozaimasu", translations: { it: "Buongiorno", en: "Good morning" } },
      { id: "saluti-02", hiragana: "こんにちは", romaji: "konnichiwa", translations: { it: "Buongiorno / Salve", en: "Hello" } },
      { id: "saluti-03", hiragana: "こんばんは", romaji: "konbanwa", translations: { it: "Buonasera", en: "Good evening" } },
      { id: "saluti-04", hiragana: "おやすみなさい", romaji: "oyasuminasai", translations: { it: "Buonanotte", en: "Good night" } },
      { id: "saluti-05", hiragana: "さようなら", romaji: "sayōnara", translations: { it: "Arrivederci", en: "Goodbye" } },
      { id: "saluti-06", hiragana: "またね", romaji: "mata ne", translations: { it: "A presto / Ci vediamo", en: "See you" } },
      { id: "saluti-07", hiragana: "はじめまして", romaji: "hajimemashite", translations: { it: "Piacere", en: "Nice to meet you" } },
    ],
  },
  {
    id: "base",
    labels: { it: "Espressioni essenziali", en: "Essentials" },
    hiragana: "きほんの ことば",
    emoji: "🔑",
    phrases: [
      { id: "base-01", hiragana: "はい", romaji: "hai", translations: { it: "Sì", en: "Yes" } },
      { id: "base-02", hiragana: "いいえ", romaji: "iie", translations: { it: "No", en: "No" } },
      { id: "base-03", hiragana: "おねがいします", romaji: "onegai shimasu", translations: { it: "Per favore", en: "Please" } },
      { id: "base-04", hiragana: "ありがとう ございます", romaji: "arigatō gozaimasu", translations: { it: "Grazie mille", en: "Thank you very much" } },
      { id: "base-05", hiragana: "どういたしまして", romaji: "dō itashimashite", translations: { it: "Prego", en: "You're welcome" } },
      { id: "base-06", hiragana: "すみません", romaji: "sumimasen", translations: { it: "Mi scusi / Scusa", en: "Excuse me / Sorry" } },
      { id: "base-07", hiragana: "ごめんなさい", romaji: "gomen nasai", translations: { it: "Mi dispiace", en: "I'm sorry" } },
      { id: "base-08", hiragana: "だいじょうぶです", romaji: "daijōbu desu", translations: { it: "Va bene / Sto bene", en: "It's okay / I'm fine" } },
    ],
  },
  {
    id: "presentarsi",
    labels: { it: "Presentarsi", en: "Introductions" },
    hiragana: "じこしょうかい",
    emoji: "🙋",
    phrases: [
      { id: "presentarsi-01", hiragana: "わたしは ... です", romaji: "watashi wa ... desu", translations: { it: "Sono …", en: "I'm …" }, notes: { it: "Metti il tuo nome al posto di …", en: "Replace … with your name" } },
      { id: "presentarsi-02", hiragana: "いたりあから きました", romaji: "itaria kara kimashita", translations: { it: "Vengo dall'Italia", en: "I'm from Italy" } },
      { id: "presentarsi-03", hiragana: "にほんごが すこし わかります", romaji: "nihongo ga sukoshi wakarimasu", translations: { it: "Capisco un po' di giapponese", en: "I understand a little Japanese" } },
      { id: "presentarsi-04", hiragana: "えいごを はなせますか", romaji: "eigo o hanasemasu ka", translations: { it: "Parla inglese?", en: "Do you speak English?" } },
      { id: "presentarsi-05", hiragana: "よろしく おねがいします", romaji: "yoroshiku onegai shimasu", translations: { it: "Piacere di conoscerti", en: "I look forward to getting to know you" } },
    ],
  },
  {
    id: "mangiare",
    labels: { it: "Mangiare e bere", en: "Food and drinks" },
    hiragana: "たべる・のむ",
    emoji: "🍜",
    phrases: [
      { id: "mangiare-01", hiragana: "おなかが すきました", romaji: "onaka ga sukimashita", translations: { it: "Ho fame", en: "I'm hungry" } },
      { id: "mangiare-02", hiragana: "めにゅーを ください", romaji: "menyū o kudasai", translations: { it: "Il menù, per favore", en: "The menu, please" } },
      { id: "mangiare-03", hiragana: "これを ください", romaji: "kore o kudasai", translations: { it: "Questo, per favore", en: "This one, please" } },
      { id: "mangiare-04", hiragana: "おすすめは なんですか", romaji: "osusume wa nan desu ka", translations: { it: "Cosa consiglia?", en: "What do you recommend?" } },
      { id: "mangiare-05", hiragana: "みずを ください", romaji: "mizu o kudasai", translations: { it: "Dell'acqua, per favore", en: "Water, please" } },
      { id: "mangiare-06", hiragana: "おいしいです", romaji: "oishii desu", translations: { it: "È delizioso", en: "It's delicious" } },
      { id: "mangiare-07", hiragana: "おかいけい おねがいします", romaji: "okaikei onegai shimasu", translations: { it: "Il conto, per favore", en: "The bill, please" } },
      { id: "mangiare-08", hiragana: "かんぱい", romaji: "kanpai", translations: { it: "Cin cin / Salute!", en: "Cheers!" } },
    ],
  },
  {
    id: "shopping",
    labels: { it: "Shopping", en: "Shopping" },
    hiragana: "かいもの",
    emoji: "🛍️",
    phrases: [
      { id: "shopping-01", hiragana: "いくらですか", romaji: "ikura desu ka", translations: { it: "Quanto costa?", en: "How much is it?" } },
      { id: "shopping-02", hiragana: "たかいです", romaji: "takai desu", translations: { it: "È caro", en: "It's expensive" } },
      { id: "shopping-03", hiragana: "これは なんですか", romaji: "kore wa nan desu ka", translations: { it: "Cos'è questo?", en: "What is this?" } },
      { id: "shopping-04", hiragana: "くれじっとかーどは つかえますか", romaji: "kurejitto kādo wa tsukaemasu ka", translations: { it: "Posso pagare con carta?", en: "Can I pay by credit card?" } },
      { id: "shopping-05", hiragana: "ふくろを ください", romaji: "fukuro o kudasai", translations: { it: "Una busta, per favore", en: "A bag, please" } },
      { id: "shopping-06", hiragana: "みて いるだけです", romaji: "mite iru dake desu", translations: { it: "Sto solo guardando", en: "I'm just looking" } },
    ],
  },
  {
    id: "indicazioni",
    labels: { it: "Indicazioni", en: "Directions" },
    hiragana: "みちあんない",
    emoji: "🧭",
    phrases: [
      { id: "indicazioni-01", hiragana: "えきは どこですか", romaji: "eki wa doko desu ka", translations: { it: "Dov'è la stazione?", en: "Where is the station?" } },
      { id: "indicazioni-02", hiragana: "といれは どこですか", romaji: "toire wa doko desu ka", translations: { it: "Dov'è il bagno?", en: "Where is the restroom?" } },
      { id: "indicazioni-03", hiragana: "みぎです", romaji: "migi desu", translations: { it: "È a destra", en: "It's on the right" } },
      { id: "indicazioni-04", hiragana: "ひだりです", romaji: "hidari desu", translations: { it: "È a sinistra", en: "It's on the left" } },
      { id: "indicazioni-05", hiragana: "まっすぐです", romaji: "massugu desu", translations: { it: "Sempre dritto", en: "Straight ahead" } },
      { id: "indicazioni-06", hiragana: "ちかいですか", romaji: "chikai desu ka", translations: { it: "È vicino?", en: "Is it nearby?" } },
      { id: "indicazioni-07", hiragana: "たくしーを よんで ください", romaji: "takushī o yonde kudasai", translations: { it: "Chiami un taxi, per favore", en: "Please call a taxi" } },
    ],
  },
  {
    id: "emergenze",
    labels: { it: "Emergenze", en: "Emergencies" },
    hiragana: "こまった とき",
    emoji: "🆘",
    phrases: [
      { id: "emergenze-01", hiragana: "たすけて", romaji: "tasukete", translations: { it: "Aiuto!", en: "Help!" } },
      { id: "emergenze-02", hiragana: "びょういんは どこですか", romaji: "byōin wa doko desu ka", translations: { it: "Dov'è l'ospedale?", en: "Where is the hospital?" } },
      { id: "emergenze-03", hiragana: "けいさつを よんで ください", romaji: "keisatsu o yonde kudasai", translations: { it: "Chiami la polizia, per favore", en: "Please call the police" } },
      { id: "emergenze-04", hiragana: "みちに まよいました", romaji: "michi ni mayoimashita", translations: { it: "Mi sono perso/a", en: "I'm lost" } },
      { id: "emergenze-05", hiragana: "きぶんが わるいです", romaji: "kibun ga warui desu", translations: { it: "Mi sento male", en: "I feel sick" } },
      { id: "emergenze-06", hiragana: "ぱすぽーとを なくしました", romaji: "pasupōto o nakushimashita", translations: { it: "Ho perso il passaporto", en: "I lost my passport" } },
    ],
  },
  {
    id: "numeri",
    labels: { it: "Numeri", en: "Numbers" },
    hiragana: "すうじ",
    emoji: "🔢",
    phrases: [
      { id: "numeri-01", hiragana: "いち", romaji: "ichi", translations: { it: "1", en: "1" } },
      { id: "numeri-02", hiragana: "に", romaji: "ni", translations: { it: "2", en: "2" } },
      { id: "numeri-03", hiragana: "さん", romaji: "san", translations: { it: "3", en: "3" } },
      { id: "numeri-04", hiragana: "よん", romaji: "yon", translations: { it: "4", en: "4" } },
      { id: "numeri-05", hiragana: "ご", romaji: "go", translations: { it: "5", en: "5" } },
      { id: "numeri-06", hiragana: "ろく", romaji: "roku", translations: { it: "6", en: "6" } },
      { id: "numeri-07", hiragana: "なな", romaji: "nana", translations: { it: "7", en: "7" } },
      { id: "numeri-08", hiragana: "はち", romaji: "hachi", translations: { it: "8", en: "8" } },
      { id: "numeri-09", hiragana: "きゅう", romaji: "kyū", translations: { it: "9", en: "9" } },
      { id: "numeri-10", hiragana: "じゅう", romaji: "jū", translations: { it: "10", en: "10" } },
    ],
  },
];
