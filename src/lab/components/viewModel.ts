import { concepts } from "../../content/concepts";
import { scenarios } from "../../content/scenarios";
import { times } from "../../content/times";
import type { LabSelection } from "../../content/types";
import { getCatalog } from "../../i18n/catalog";
import type { Locale } from "../../i18n/LocaleContext";
import { classifyNaturalness } from "../engine/naturalness";
import { realizeSentence } from "../engine/realize";

export function buildLabViewModel(
  selection: LabSelection,
  locale: Locale,
  referenceLocale: Locale,
) {
  const scenario = scenarios.find((item) => item.id === selection.scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${selection.scenarioId}`);
  const pack = getCatalog(locale);
  const copy = pack.scenarios[scenario.id];
  return {
    scenario,
    scenarioTitle: copy.title,
    forms: pack.forms,
    times: times.map((time) => ({
      ...time,
      label: pack.times[time.id] || pack.ui.common.none,
    })),
    slots: scenario.slots.map((slot) => ({
      ...slot,
      copy: copy.slots[slot.id],
      options: slot.optionIds.map((conceptId) => ({
        id: conceptId,
        jp: concepts[conceptId].jp,
        romaji: concepts[conceptId].romaji,
        label: pack.concepts[conceptId].label,
      })),
    })),
    sentence: {
      primary: realizeSentence(selection, locale),
      reference: realizeSentence(selection, referenceLocale),
    },
    naturalness: classifyNaturalness(selection.form, selection.timeId),
    ui: pack.ui,
  };
}

export type LabViewModel = ReturnType<typeof buildLabViewModel>;
