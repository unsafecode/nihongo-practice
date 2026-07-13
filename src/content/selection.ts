import { scenarios } from "./scenarios";
import { times } from "./times";
import type {
  ConceptId,
  LabSelection,
  Scenario,
  ScenarioSlot,
  TimeOption,
} from "./types";

export interface ResolvedSlot {
  slot: ScenarioSlot;
  conceptId: ConceptId;
}

export interface ResolvedLabSelection {
  scenario: Scenario;
  time: TimeOption;
  slots: ResolvedSlot[];
}

export function resolveLabSelection(
  selection: LabSelection,
): ResolvedLabSelection {
  const scenario = scenarios.find((item) => item.id === selection.scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${selection.scenarioId}`);
  const time = times.find((item) => item.id === selection.timeId);
  if (!time) throw new Error(`Unknown time: ${selection.timeId}`);

  const slotIds = new Set(scenario.slots.map((slot) => slot.id));
  for (const optionKey of Object.keys(selection.options)) {
    if (!slotIds.has(optionKey)) throw new Error(`Unknown slot: ${optionKey}`);
  }

  const slots = scenario.slots
    .map((slot): ResolvedSlot | null => {
      if (!Object.prototype.hasOwnProperty.call(selection.options, slot.id)) {
        throw new Error(`Missing slot: ${slot.id}`);
      }
      const conceptId = selection.options[slot.id] ?? null;
      if (conceptId === null) {
        if (!slot.optional) {
          throw new Error(`Missing required option: ${slot.id}`);
        }
        return null;
      }
      if (!slot.optionIds.includes(conceptId)) {
        throw new Error(`Invalid option for ${slot.id}: ${conceptId}`);
      }
      return { slot, conceptId };
    })
    .filter((entry): entry is ResolvedSlot => entry !== null);

  return { scenario, time, slots };
}
