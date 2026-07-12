// Contenuti didattici — giapponese pratico da viaggio.
// Scelta di design: SOLO hiragana per la scrittura (niente kanji né katakana),
// così chi impara deve leggere un solo sillabario. I prestiti che normalmente
// si scrivono in katakana (es. トイレ) qui sono resi in hiragana (といれ).
// Il romaji resta come guida alla pronuncia, la traduzione è in italiano.

export interface Phrase {
  hiragana: string;
  romaji: string;
  it: string;
  note?: string;
}

export interface Category {
  id: string;
  /** Etichetta in italiano per la UI */
  label: string;
  /** Nome della categoria in hiragana */
  hiragana: string;
  emoji: string;
  phrases: Phrase[];
}

export const categories: Category[] = [
  {
    id: "saluti",
    label: "Saluti",
    hiragana: "あいさつ",
    emoji: "👋",
    phrases: [
      { hiragana: "おはようございます", romaji: "ohayō gozaimasu", it: "Buongiorno (al mattino)" },
      { hiragana: "こんにちは", romaji: "konnichiwa", it: "Buongiorno / Salve" },
      { hiragana: "こんばんは", romaji: "konbanwa", it: "Buonasera" },
      { hiragana: "おやすみなさい", romaji: "oyasuminasai", it: "Buonanotte" },
      { hiragana: "さようなら", romaji: "sayōnara", it: "Arrivederci" },
      { hiragana: "またね", romaji: "mata ne", it: "A presto / Ci vediamo" },
      { hiragana: "はじめまして", romaji: "hajimemashite", it: "Piacere (di conoscerti)" },
    ],
  },
  {
    id: "base",
    label: "Parole base",
    hiragana: "きほんの ことば",
    emoji: "🔑",
    phrases: [
      { hiragana: "はい", romaji: "hai", it: "Sì" },
      { hiragana: "いいえ", romaji: "iie", it: "No" },
      { hiragana: "おねがいします", romaji: "onegai shimasu", it: "Per favore" },
      { hiragana: "ありがとう ございます", romaji: "arigatō gozaimasu", it: "Grazie (mille)" },
      { hiragana: "どういたしまして", romaji: "dō itashimashite", it: "Prego" },
      { hiragana: "すみません", romaji: "sumimasen", it: "Scusi / Mi scusi (anche per chiamare)" },
      { hiragana: "ごめんなさい", romaji: "gomen nasai", it: "Mi dispiace" },
      { hiragana: "だいじょうぶです", romaji: "daijōbu desu", it: "Va bene / Tutto ok" },
    ],
  },
  {
    id: "presentarsi",
    label: "Presentarsi",
    hiragana: "じこしょうかい",
    emoji: "🙋",
    phrases: [
      { hiragana: "わたしは ... です", romaji: "watashi wa ... desu", it: "Io sono ...", note: "Metti il tuo nome al posto di ..." },
      { hiragana: "いたりあから きました", romaji: "itaria kara kimashita", it: "Vengo dall'Italia" },
      { hiragana: "にほんごが すこし わかります", romaji: "nihongo ga sukoshi wakarimasu", it: "Capisco un po' di giapponese" },
      { hiragana: "えいごを はなせますか", romaji: "eigo o hanasemasu ka", it: "Parla inglese?" },
      { hiragana: "よろしく おねがいします", romaji: "yoroshiku onegai shimasu", it: "Piacere / Conto su di lei" },
    ],
  },
  {
    id: "mangiare",
    label: "Mangiare e bere",
    hiragana: "たべる・のむ",
    emoji: "🍜",
    phrases: [
      { hiragana: "おなかが すきました", romaji: "onaka ga sukimashita", it: "Ho fame" },
      { hiragana: "めにゅーを ください", romaji: "menyū o kudasai", it: "Il menù, per favore" },
      { hiragana: "これを ください", romaji: "kore o kudasai", it: "Questo, per favore" },
      { hiragana: "おすすめは なんですか", romaji: "osusume wa nan desu ka", it: "Cosa consiglia?" },
      { hiragana: "みずを ください", romaji: "mizu o kudasai", it: "Dell'acqua, per favore" },
      { hiragana: "おいしいです", romaji: "oishii desu", it: "È buono / delizioso" },
      { hiragana: "おかいけい おねがいします", romaji: "okaikei onegai shimasu", it: "Il conto, per favore" },
      { hiragana: "かんぱい", romaji: "kanpai", it: "Cin cin / Salute!" },
    ],
  },
  {
    id: "shopping",
    label: "Shopping",
    hiragana: "かいもの",
    emoji: "🛍️",
    phrases: [
      { hiragana: "いくらですか", romaji: "ikura desu ka", it: "Quanto costa?" },
      { hiragana: "たかいです", romaji: "takai desu", it: "È caro" },
      { hiragana: "これは なんですか", romaji: "kore wa nan desu ka", it: "Cos'è questo?" },
      { hiragana: "くれじっとかーどは つかえますか", romaji: "kurejitto kādo wa tsukaemasu ka", it: "Posso pagare con carta?" },
      { hiragana: "ふくろを ください", romaji: "fukuro o kudasai", it: "Una busta, per favore" },
      { hiragana: "みて いるだけです", romaji: "mite iru dake desu", it: "Sto solo guardando" },
    ],
  },
  {
    id: "indicazioni",
    label: "Indicazioni",
    hiragana: "みちあんない",
    emoji: "🧭",
    phrases: [
      { hiragana: "えきは どこですか", romaji: "eki wa doko desu ka", it: "Dov'è la stazione?" },
      { hiragana: "といれは どこですか", romaji: "toire wa doko desu ka", it: "Dov'è il bagno?" },
      { hiragana: "みぎです", romaji: "migi desu", it: "È a destra" },
      { hiragana: "ひだりです", romaji: "hidari desu", it: "È a sinistra" },
      { hiragana: "まっすぐです", romaji: "massugu desu", it: "Sempre dritto" },
      { hiragana: "ちかいですか", romaji: "chikai desu ka", it: "È vicino?" },
      { hiragana: "たくしーを よんで ください", romaji: "takushī o yonde kudasai", it: "Chiami un taxi, per favore" },
    ],
  },
  {
    id: "emergenze",
    label: "Emergenze",
    hiragana: "こまった とき",
    emoji: "🆘",
    phrases: [
      { hiragana: "たすけて", romaji: "tasukete", it: "Aiuto!" },
      { hiragana: "びょういんは どこですか", romaji: "byōin wa doko desu ka", it: "Dov'è l'ospedale?" },
      { hiragana: "けいさつを よんで ください", romaji: "keisatsu o yonde kudasai", it: "Chiami la polizia" },
      { hiragana: "みちに まよいました", romaji: "michi ni mayoimashita", it: "Mi sono perso" },
      { hiragana: "きぶんが わるいです", romaji: "kibun ga warui desu", it: "Mi sento male" },
      { hiragana: "ぱすぽーとを なくしました", romaji: "pasupōto o nakushimashita", it: "Ho perso il passaporto" },
    ],
  },
  {
    id: "numeri",
    label: "Numeri",
    hiragana: "すうじ",
    emoji: "🔢",
    phrases: [
      { hiragana: "いち", romaji: "ichi", it: "1" },
      { hiragana: "に", romaji: "ni", it: "2" },
      { hiragana: "さん", romaji: "san", it: "3" },
      { hiragana: "よん", romaji: "yon", it: "4" },
      { hiragana: "ご", romaji: "go", it: "5" },
      { hiragana: "ろく", romaji: "roku", it: "6" },
      { hiragana: "なな", romaji: "nana", it: "7" },
      { hiragana: "はち", romaji: "hachi", it: "8" },
      { hiragana: "きゅう", romaji: "kyū", it: "9" },
      { hiragana: "じゅう", romaji: "jū", it: "10" },
    ],
  },
];
