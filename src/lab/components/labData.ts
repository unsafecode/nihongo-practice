import type { Form, Role, TimeOption } from "../data/types";

/** Asse dei tempi condiviso (avverbi). L'ultima è la sentinella "nessuno". */
export const TIMES: TimeOption[] = [
  { jp: "きょう", romaji: "kyō", it: "oggi", future: false },
  { jp: "きのう", romaji: "kinō", it: "ieri", future: false },
  { jp: "あした", romaji: "ashita", it: "domani", future: true },
  { jp: "こんばん", romaji: "konban", it: "stasera", future: true },
  { jp: "まいにち", romaji: "mainichi", it: "ogni giorno", future: false },
  { jp: "", romaji: "", it: "", none: true, future: false },
];

export interface FormOption {
  id: Form;
  label: string; // etichetta italiana (dal mockup)
  jp: string; // desinenza in hiragana
  romaji: string; // desinenza in rōmaji
}

/** Le 6 forme cortesi, etichette dal mockup. */
export const FORMS: FormOption[] = [
  { id: "pres", label: "presente / futuro", jp: "ます", romaji: "masu" },
  { id: "past", label: "passato", jp: "ました", romaji: "mashita" },
  { id: "neg", label: "negativo", jp: "ません", romaji: "masen" },
  { id: "pastneg", label: "passato neg.", jp: "ませんでした", romaji: "masen deshita" },
  { id: "vol", label: "invito / volitiva", jp: "ましょう", romaji: "mashō" },
  { id: "des", label: "voglio…", jp: "たいです", romaji: "tai desu" },
];

/** Ordine giapponese degli slot (il tempo va prima, il verbo dopo). */
export const JP_ORDER: Role[] = ["place", "transport", "person", "object", "destination"];

/** Ruolo → classe cromatica del chip (dai colori del mockup). */
export const ROLE_CHIP: Record<Role, "obj" | "place" | "topic"> = {
  object: "obj",
  place: "place",
  transport: "place",
  destination: "topic",
  person: "topic",
};

/** Ordine dei complementi in italiano (il luogo va in fondo). */
export const IT_ORDER: Record<Role, number> = {
  object: 0,
  destination: 0,
  person: 0,
  transport: 1,
  place: 2,
};
