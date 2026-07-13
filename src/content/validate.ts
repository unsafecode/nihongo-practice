import type {
  ConceptId,
  JapaneseConcept,
  Scenario,
  TimeOption,
} from "./types";

interface Content {
  concepts: Record<ConceptId, JapaneseConcept>;
  scenarios: Scenario[];
  times: TimeOption[];
}

export function validateContent(content: Content): string[] {
  const errors: string[] = [];
  const scenarioIds = new Set<string>();
  const timeIds = new Set<string>();

  for (const scenario of content.scenarios) {
    if (scenarioIds.has(scenario.id)) errors.push(`duplicate scenario:${scenario.id}`);
    scenarioIds.add(scenario.id);
    const slotIds = new Set<string>();
    for (const slot of scenario.slots) {
      if (slotIds.has(slot.id)) errors.push(`duplicate slot:${scenario.id}:${slot.id}`);
      slotIds.add(slot.id);
      if (slot.optionIds.length === 0) errors.push(`empty options:${scenario.id}:${slot.id}`);
      if (!slot.optional && slot.defaultOptionId === null) {
        errors.push(`required default missing:${scenario.id}:${slot.id}`);
      }
      for (const conceptId of slot.optionIds) {
        if (!content.concepts[conceptId]) {
          errors.push(`unknown concept:${scenario.id}:${slot.id}:${conceptId}`);
        }
      }
      if (
        slot.defaultOptionId !== null &&
        !slot.optionIds.includes(slot.defaultOptionId)
      ) {
        errors.push(`invalid default:${scenario.id}:${slot.id}`);
      }
    }
  }

  for (const time of content.times) {
    if (timeIds.has(time.id)) errors.push(`duplicate time:${time.id}`);
    timeIds.add(time.id);
  }

  return errors;
}
