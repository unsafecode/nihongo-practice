import type { Scenario, Form } from "../data/types";
import { PARTICLE } from "../data/types";
import type { Script } from "../../settings/ScriptContext";
import { TIMES, FORMS, ROLE_CHIP } from "./labData";

interface Props {
  scenario: Scenario;
  form: Form;
  setForm: (f: Form) => void;
  timeIndex: number;
  setTimeIndex: (i: number) => void;
  selections: number[];
  setSelection: (slotIndex: number, optionIndex: number) => void;
  script: Script;
}

export function ControlPanel({
  scenario,
  form,
  setForm,
  timeIndex,
  setTimeIndex,
  selections,
  setSelection,
  script,
}: Props) {
  return (
    <div className="controls">
      <div className="panel forms">
        <h3>
          <span className="dot dot--verb" /> Forma del verbo
        </h3>
        <div className="opts">
          {FORMS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`opt${form === f.id ? " is-active" : ""}`}
              onClick={() => setForm(f.id)}
            >
              <span className="jp" lang={script === "hiragana" ? "ja" : undefined}>
                {script === "hiragana" ? f.jp : f.romaji}
              </span>
              <span className="it">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>
          <span className="dot dot--time" /> Quando (avverbio di tempo)
        </h3>
        <div className="opts">
          {TIMES.map((t, i) => (
            <button
              key={i}
              type="button"
              className={`opt${timeIndex === i ? " is-active" : ""}`}
              onClick={() => setTimeIndex(i)}
            >
              <span className="jp" lang={!t.none && script === "hiragana" ? "ja" : undefined}>
                {t.none ? "—" : script === "hiragana" ? t.jp : t.romaji}
              </span>
              <span className="it">{t.none ? "(nessuno)" : t.it}</span>
            </button>
          ))}
        </div>
      </div>

      {scenario.slots.map((slot, si) => {
        const p = PARTICLE[slot.role];
        const optional = slot.options.some((o) => o.none);
        return (
          <div className="panel" key={si}>
            <h3>
              <span className={`dot dot--${ROLE_CHIP[slot.role]}`} /> {slot.label} ({p.jp})
              {optional ? " — opzionale" : ""}
            </h3>
            <div className="opts">
              {slot.options.map((o, oi) => (
                <button
                  key={oi}
                  type="button"
                  className={`opt${selections[si] === oi ? " is-active" : ""}`}
                  onClick={() => setSelection(si, oi)}
                >
                  <span className="jp" lang={!o.none && script === "hiragana" ? "ja" : undefined}>
                    {o.none ? "—" : script === "hiragana" ? o.jp : o.romaji}
                  </span>
                  <span className="it">{o.none ? "(nessuno)" : o.it}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
