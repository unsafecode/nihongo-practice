export type Group = "ichidan" | "godan" | "irregular";

const GODAN_STEM: Record<string, string> = {
  う: "い", く: "き", ぐ: "ぎ", す: "し", つ: "ち",
  ぬ: "に", ぶ: "び", む: "み", る: "り",
};

const IRREGULAR_STEM: Record<string, string> = {
  する: "し",
  くる: "き",
};

export function stem(dict: string, group: Group): string {
  if (group === "irregular") {
    const s = IRREGULAR_STEM[dict];
    if (!s) throw new Error(`Verbo irregolare sconosciuto: ${dict}`);
    return s;
  }
  if (group === "ichidan") {
    return dict.slice(0, -1); // togli る
  }
  const last = dict.slice(-1);
  const replaced = GODAN_STEM[last];
  if (!replaced) throw new Error(`Finale godan non valida: ${dict}`);
  return dict.slice(0, -1) + replaced;
}

export type Form = "pres" | "past" | "neg" | "pastneg" | "vol" | "des";

export interface Verb {
  dict: string; // forma del dizionario, es. たべる
  group: Group;
  stemRomaji: string; // es. "tabe" — la radice masu in rōmaji
}

export interface Conjugation {
  jp: string;
  romaji: string;
  ending: string; // suffisso in hiragana (per l'evidenziazione "ingranaggio")
  endingRomaji: string;
}

const SUFFIX: Record<Form, { jp: string; romaji: string }> = {
  pres: { jp: "ます", romaji: "masu" },
  past: { jp: "ました", romaji: "mashita" },
  neg: { jp: "ません", romaji: "masen" },
  pastneg: { jp: "ませんでした", romaji: "masen deshita" },
  vol: { jp: "ましょう", romaji: "mashō" },
  des: { jp: "たいです", romaji: "tai desu" },
};

export function conjugate(verb: Verb, form: Form): Conjugation {
  const s = stem(verb.dict, verb.group);
  const suf = SUFFIX[form];
  return {
    jp: s + suf.jp,
    romaji: verb.stemRomaji + suf.romaji, // es. "tabe"+"tai desu" = "tabetai desu"
    ending: suf.jp,
    endingRomaji: suf.romaji,
  };
}
