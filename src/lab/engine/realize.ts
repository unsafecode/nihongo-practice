import { resolveLabSelection } from "../../content/selection";
import type {
  ConceptId,
  LabSelection,
  SemanticRole,
  TimeId,
} from "../../content/types";
import { getCatalog } from "../../i18n/catalog";
import type { Locale } from "../../i18n/LocaleContext";
import type { PredicateForms, ScenarioCopy } from "../../i18n/types";
import type { Form } from "./conjugate";

const ROLE_ORDER: SemanticRole[] = [
  "object",
  "personTarget",
  "vehicleBoarded",
  "destination",
  "transport",
  "actionPlace",
];

function predicateFor(
  forms: PredicateForms,
  form: Form,
  timeId: TimeId,
): string {
  if (form === "past") return forms.past;
  if (form === "pastneg") return forms.pastNegative;
  if (form === "vol") return forms.suggestion;
  if (form === "des") return forms.desire;
  const future = timeId === "tomorrow" || timeId === "tonight";
  const habitual = timeId === "everyDay";
  if (form === "neg") {
    if (future) return forms.futureNegative;
    return habitual ? forms.habitualNegative : forms.currentNegative;
  }
  if (future) return forms.future;
  return habitual ? forms.habitual : forms.current;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

function primaryOption(
  scenarioCopy: ScenarioCopy,
  options: Record<string, ConceptId | null>,
): ConceptId | null {
  const values = Object.values(options).filter(
    (value): value is ConceptId => value !== null,
  );
  return values.find((value) => scenarioCopy.predicateByOption?.[value]) ?? null;
}

export function realizeSentence(
  selection: LabSelection,
  locale: Locale,
): string {
  const pack = getCatalog(locale);
  const { scenario, slots, time } = resolveLabSelection(selection);
  const copy = pack.scenarios[scenario.id];
  const optionOverride = primaryOption(copy, selection.options);
  const forms =
    (optionOverride && copy.predicateByOption?.[optionOverride]) ?? copy.predicate;
  const predicate = predicateFor(forms, selection.form, selection.timeId);
  const args = slots
    .slice()
    .sort(
      (a, b) =>
        ROLE_ORDER.indexOf(a.slot.semanticRole) -
        ROLE_ORDER.indexOf(b.slot.semanticRole),
    )
    .map(({ slot, conceptId }) => {
      const value = pack.concepts[conceptId].realizations[slot.semanticRole];
      if (!value) {
        throw new Error(
          `Missing ${locale} realization: ${conceptId}/${slot.semanticRole}`,
        );
      }
      return value;
    });

  const localizedTime = pack.times[time.id];
  const core = [predicate, ...args].join(" ");
  if (!localizedTime) return `${capitalize(core)}.`;
  const prefix =
    locale === "en"
      ? `${capitalize(localizedTime)},`
      : capitalize(localizedTime);
  return `${prefix} ${core}.`;
}
