import type { ConceptId, JapaneseConcept, Scenario } from "../content/types";
import type { LocalePack } from "./types";

export function validateLocalePack(
  pack: LocalePack,
  concepts: Record<ConceptId, JapaneseConcept>,
  scenarios: Scenario[],
): string[] {
  const errors: string[] = [];
  for (const conceptId of Object.keys(concepts) as ConceptId[]) {
    if (!pack.concepts[conceptId]) errors.push(`missing concept:${conceptId}`);
  }
  for (const scenario of scenarios) {
    const copy = pack.scenarios[scenario.id];
    if (!copy) {
      errors.push(`missing scenario:${scenario.id}`);
      continue;
    }
    for (const slot of scenario.slots) {
      if (!copy.slots[slot.id]) {
        errors.push(`missing slot copy:${scenario.id}:${slot.id}`);
      }
      for (const conceptId of slot.optionIds) {
        const realization =
          pack.concepts[conceptId]?.realizations[slot.semanticRole];
        if (!realization) {
          errors.push(
            `missing realization:${scenario.id}:${slot.id}:${conceptId}:${slot.semanticRole}`,
          );
        }
      }
    }
  }
  return errors;
}
