import type { Form, Group } from "../engine/conjugate";

export type { Form, Group };
export type Script = "hiragana" | "romaji";

/** Ruolo grammaticale di uno slot → determina la particella e la posizione. */
export type Role = "object" | "destination" | "person" | "transport" | "place";

/** Particella associata a un ruolo. で=luogo, を=oggetto, に=meta/persona, へ=direzione. */
export const PARTICLE: Record<Role, { jp: string; romaji: string }> = {
  object: { jp: "を", romaji: "o" },
  destination: { jp: "に", romaji: "ni" },
  person: { jp: "に", romaji: "ni" },
  transport: { jp: "で", romaji: "de" },
  place: { jp: "で", romaji: "de" },
};

export interface Option {
  jp: string; // es. らーめん
  romaji: string; // es. rāmen
  it: string; // frammento italiano già con articolo/preposizione, es. "il ramen"
  none?: boolean; // opzione "nessuno" → lo slot viene omesso
}

export interface Slot {
  role: Role;
  label: string; // etichetta del controllo, es. "Cosa"
  options: Option[];
  defaultIndex: number; // opzione selezionata all'avvio
}

export interface TimeOption {
  jp: string;
  romaji: string;
  it: string; // es. "oggi", "" per nessuno
  none?: boolean;
  future?: boolean; // あした/こんばん → attiva la variante futura italiana
}

/** Tabella italiana completa del verbo: presente + varianti passato/futuro/etc. */
export interface ItalianVerb {
  pres: string; // "mangio"
  past: string; // "ho mangiato"
  future: string; // "mangerò"
  neg: string; // "non mangio"
  negFuture: string; // "non mangerò"
  pastneg: string; // "non ho mangiato"
  vol: string; // "mangiamo"
  des: string; // "voglio mangiare"
}

export interface Scenario {
  id: string;
  emoji: string;
  label: string; // "Mangiare"
  verb: {
    dict: string;
    group: Group;
    stemRomaji: string;
    it: ItalianVerb;
  };
  slots: Slot[];
}
