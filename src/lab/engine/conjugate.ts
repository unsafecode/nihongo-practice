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
