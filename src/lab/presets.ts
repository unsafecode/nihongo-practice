import { scenarios } from "../content/scenarios";
import { resolveLabSelection } from "../content/selection";
import { times } from "../content/times";
import type {
  ConceptId,
  LabSelection,
  Scenario,
  ScenarioSlot,
  TimeId,
} from "../content/types";
import type { Form } from "./engine/conjugate";

const forms: readonly Form[] = [
  "pres",
  "past",
  "neg",
  "pastneg",
  "vol",
  "des",
];

export interface ParsedLabPreset {
  selection: LabSelection;
  from: string | null;
}

function isForm(value: string | null): value is Form {
  return forms.some((form) => form === value);
}

function isCoursePath(value: string): boolean {
  return /^\/percorso\/[a-z0-9-]+\/[a-z0-9-]+$/.test(value);
}

function scenarioById(value: string | null): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === value);
}

function isTimeId(value: string | null): value is TimeId {
  return times.some((time) => time.id === value);
}

function isSlotOption(
  slot: ScenarioSlot,
  value: string,
): value is ConceptId {
  return slot.optionIds.some((optionId) => optionId === value);
}

export function hasLabPreset(params: URLSearchParams): boolean {
  return [...params.keys()].length > 0;
}

export function serializeLabPreset(
  selection: LabSelection,
  from?: string,
): URLSearchParams {
  const { scenario } = resolveLabSelection(selection);
  if (!isForm(selection.form)) throw new Error(`Unknown form: ${selection.form}`);
  if (from !== undefined && !isCoursePath(from)) {
    throw new Error(`Invalid course return path: ${from}`);
  }

  const params = new URLSearchParams({
    scenario: selection.scenarioId,
    form: selection.form,
    time: selection.timeId,
  });
  for (const slot of scenario.slots) {
    const value = selection.options[slot.id] ?? null;
    params.set(`slot.${slot.id}`, value ?? "");
  }
  if (from !== undefined) params.set("from", from);
  return params;
}

export function parseLabPreset(
  params: URLSearchParams,
): ParsedLabPreset | null {
  const scenario = scenarioById(params.get("scenario"));
  const form = params.get("form");
  const timeId = params.get("time");
  if (
    !scenario ||
    !isForm(form) ||
    !isTimeId(timeId)
  ) {
    return null;
  }

  const allowedKeys = new Set([
    "scenario",
    "form",
    "time",
    "from",
    ...scenario.slots.map((slot) => `slot.${slot.id}`),
  ]);
  for (const key of params.keys()) {
    if (!allowedKeys.has(key) || params.getAll(key).length !== 1) return null;
  }

  const options: Record<string, ConceptId | null> = {};
  for (const slot of scenario.slots) {
    const key = `slot.${slot.id}`;
    if (!params.has(key)) return null;
    const value = params.get(key);
    if (value === "") {
      if (!slot.optional) return null;
      options[slot.id] = null;
      continue;
    }
    if (!value || !isSlotOption(slot, value)) return null;
    options[slot.id] = value;
  }

  const from = params.get("from");
  if (from !== null && !isCoursePath(from)) return null;

  return {
    selection: {
      scenarioId: scenario.id,
      form,
      timeId,
      options,
    },
    from,
  };
}
