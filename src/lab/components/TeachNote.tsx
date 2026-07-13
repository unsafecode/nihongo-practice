import type { Scenario } from "../../content/types";
import type { UiMessages } from "../../i18n/types";
import { conjugate, stem, type Form } from "../engine/conjugate";
import type { LabViewModel } from "./viewModel";

interface Props {
  verb: Scenario["verb"];
  form: Form;
  formCopy: LabViewModel["forms"][Form];
  ui: UiMessages["lab"];
}

export function TeachNote({ verb, form, formCopy, ui }: Props) {
  const stemJp = stem(verb.dict, verb.group);
  const conjugation = conjugate(verb, form);
  return (
    <div className="note">
      <span aria-hidden="true">💡</span> <b>{ui.rule}:</b> {ui.base}{" "}
      <b lang="ja">{stemJp}</b> (<i>{verb.stemRomaji}</i>) + {ui.ending}{" "}
      <b lang="ja">{conjugation.ending}</b> (
      <i>{conjugation.endingRomaji}</i>).
      <br />
      <span aria-hidden="true">🔎</span> <b>{formCopy.label}</b> ·{" "}
      {formCopy.grammar}
    </div>
  );
}
