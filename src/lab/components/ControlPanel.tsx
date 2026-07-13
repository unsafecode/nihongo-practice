import type {
  ConceptId,
  LabSelection,
  TimeId,
} from "../../content/types";
import type { Script } from "../../settings/ScriptContext";
import { conjugate, type Form } from "../engine/conjugate";
import { FORM_IDS, ROLE_CHIP } from "./labData";
import type { LabViewModel } from "./viewModel";

interface Props {
  selection: LabSelection;
  vm: LabViewModel;
  script: Script;
  onFormChange: (form: Form) => void;
  onTimeChange: (timeId: TimeId) => void;
  onOptionChange: (slotId: string, conceptId: ConceptId | null) => void;
}

export function ControlPanel({
  selection,
  vm,
  script,
  onFormChange,
  onTimeChange,
  onOptionChange,
}: Props) {
  return (
    <div className="controls">
      <div className="panel forms">
        <h3>
          <span className="dot dot--verb" />
          {vm.ui.lab.verbForm}
        </h3>
        <div className="opts">
          {FORM_IDS.map((formId) => {
            const copy = vm.forms[formId];
            const conjugation = conjugate(vm.scenario.verb, formId);
            return (
              <button
                key={formId}
                type="button"
                className={`opt${
                  selection.form === formId ? " is-active" : ""
                }`}
                aria-pressed={selection.form === formId}
                onClick={() => onFormChange(formId)}
              >
                <span
                  className="jp"
                  lang={script === "hiragana" ? "ja" : undefined}
                >
                  {script === "hiragana"
                    ? conjugation.ending
                    : conjugation.endingRomaji}
                </span>
                <span className="opt__label">
                  {copy.label} · {copy.grammar}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h3>
          <span className="dot dot--time" />
          {vm.ui.lab.when}
        </h3>
        <div className="opts">
          {vm.times.map((time) => {
            const empty = time.id === "none";
            return (
              <button
                key={time.id}
                type="button"
                className={`opt${
                  selection.timeId === time.id ? " is-active" : ""
                }`}
                aria-pressed={selection.timeId === time.id}
                onClick={() => onTimeChange(time.id)}
              >
                <span
                  className="jp"
                  lang={!empty && script === "hiragana" ? "ja" : undefined}
                >
                  {empty
                    ? vm.ui.common.none
                    : script === "hiragana"
                      ? time.jp
                      : time.romaji}
                </span>
                {!empty ? (
                  <span className="opt__label">{time.label}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {vm.slots.map((slot) => (
        <div className="panel" key={slot.id}>
          <h3>
            <span className={`dot dot--${ROLE_CHIP[slot.semanticRole]}`} />
            <span className="panel__title">
              <span>{slot.copy.prompt}</span>
              <small>
                {slot.copy.grammar} · <span lang="ja">{slot.particle.jp}</span>
                {slot.optional ? ` · ${vm.ui.common.optional}` : ""}
              </small>
            </span>
          </h3>
          <div className="opts">
            {slot.optional ? (
              <button
                type="button"
                className={`opt${
                  selection.options[slot.id] === null ? " is-active" : ""
                }`}
                aria-pressed={selection.options[slot.id] === null}
                onClick={() => onOptionChange(slot.id, null)}
              >
                <span className="jp">{vm.ui.common.none}</span>
              </button>
            ) : null}
            {slot.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`opt${
                  selection.options[slot.id] === option.id ? " is-active" : ""
                }`}
                aria-pressed={selection.options[slot.id] === option.id}
                onClick={() => onOptionChange(slot.id, option.id)}
              >
                <span
                  className="jp"
                  lang={script === "hiragana" ? "ja" : undefined}
                >
                  {script === "hiragana" ? option.jp : option.romaji}
                </span>
                <span className="opt__label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
