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
import {
  GUIDED_RETURN_PARAM,
  buildGuidedToolHref,
  type GuidedToolHref,
} from "../routing/guidedToolLink";
import { routePaths } from "../routing/routePaths";
import type { CreateRouteTargetInput } from "../routing/routeTarget";
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
}

function isForm(value: string | null): value is Form {
  return forms.some((form) => form === value);
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
  return [...params.keys()].some((key) => key !== GUIDED_RETURN_PARAM);
}

export function serializeLabPreset(selection: LabSelection): URLSearchParams {
  const { scenario } = resolveLabSelection(selection);
  if (!isForm(selection.form)) throw new Error(`Unknown form: ${selection.form}`);

  const params = new URLSearchParams({
    scenario: selection.scenarioId,
    form: selection.form,
    time: selection.timeId,
  });
  for (const slot of scenario.slots) {
    const value = selection.options[slot.id] ?? null;
    params.set(`slot.${slot.id}`, value ?? "");
  }
  return params;
}

/**
 * Builds a Lab deep link that carries this selection as a preset plus the
 * exact lesson return, using the shared guided-tool contract. Preset and
 * return are assembled here but validated independently downstream, so an
 * invalid return can never silently corrupt the preset (design spec §7.2).
 */
export function buildLabDeepLink(
  selection: LabSelection,
  returnInput: CreateRouteTargetInput,
): GuidedToolHref {
  return buildGuidedToolHref(
    routePaths.lab,
    serializeLabPreset(selection),
    returnInput,
  );
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
    ...scenario.slots.map((slot) => `slot.${slot.id}`),
  ]);
  for (const key of params.keys()) {
    // The return param is owned and validated by the shared guided-tool
    // contract; the preset parser ignores it so preset and return validate
    // independently (design spec §7.2, Task B.2).
    if (key === GUIDED_RETURN_PARAM) continue;
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

  return {
    selection: {
      scenarioId: scenario.id,
      form,
      timeId,
      options,
    },
  };
}
