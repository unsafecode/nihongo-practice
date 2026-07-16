export type PersonaId = "yuki" | "ken" | "mina";

export interface Persona {
  readonly id: PersonaId;
  readonly japaneseName: string;
  readonly latinName: string;
}

export const genericPersonas = [
  { id: "yuki", japaneseName: "ゆき", latinName: "Yuki" },
  { id: "ken", japaneseName: "けん", latinName: "Ken" },
  { id: "mina", japaneseName: "みな", latinName: "Mina" },
] as const satisfies readonly Persona[];

export const personasById = Object.fromEntries(
  genericPersonas.map((persona) => [persona.id, persona]),
) as Readonly<Record<PersonaId, Persona>>;

export function validateRuntimeAliases(input: unknown): string[] {
  const serialized = JSON.stringify(input).normalize("NFKC");
  const latinAlias = ["ric", "chi"].join("");
  const kanaAlias = ["り", "っち"].join("");
  const errors: string[] = [];

  if (serialized.toLocaleLowerCase("en").includes(latinAlias)) {
    errors.push("forbidden-latin-alias");
  }
  if (serialized.includes(kanaAlias)) {
    errors.push("forbidden-kana-alias");
  }

  return errors;
}
