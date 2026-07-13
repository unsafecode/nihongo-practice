export interface Particle {
  jp: string;
  romaji: string;
}

export interface Segment {
  kind: string;
  jp: string;
  romaji: string;
  particle?: Particle;
}

export interface Assembled {
  jp: string;
  romaji: string;
}

export function assembleJP(segments: Segment[]): Assembled {
  const present = segments.filter((s) => s.jp.length > 0);
  const jp = present
    .map((s) => s.jp + (s.particle ? s.particle.jp : ""))
    .join("");
  const romaji = present
    .flatMap((s) => (s.particle ? [s.romaji, s.particle.romaji] : [s.romaji]))
    .join(" ");
  return { jp, romaji };
}

export type Form = "pres" | "past" | "neg" | "pastneg" | "vol" | "des";

export interface ItalianVerbTable {
  pres: string; past: string; future: string;
  neg: string; negFuture: string; pastneg: string;
  vol: string; des: string;
}

export interface ITParts {
  verb: ItalianVerbTable;
  form: Form;
  timeIt: string; // "oggi", "" se nessuno
  timeFuture: boolean; // il tempo selezionato è futuro?
  args: string[]; // frammenti già con articolo, in ordine, "" filtrati
}

export function italianVerb(v: ItalianVerbTable, form: Form, timeFuture: boolean): string {
  if (timeFuture && form === "pres") return v.future;
  if (timeFuture && form === "neg") return v.negFuture;
  return v[form];
}

export function assembleIT(p: ITParts): string {
  const verb = italianVerb(p.verb, p.form, p.timeFuture);
  const words = [p.timeIt, verb, ...p.args].filter((w) => w.length > 0);
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
