import { useEffect, useState } from "react";
import { scenarios } from "../data/scenarios";
import { useSpeech } from "../../hooks/useSpeech";
import { useScript } from "../../settings/ScriptContext";
import { SpeechNotice } from "../../components/SpeechNotice";
import type { Form } from "../data/types";
import { TIMES } from "./labData";
import { Board } from "./Board";
import { ControlPanel } from "./ControlPanel";
import { TeachNote } from "./TeachNote";
import "../lab.css";

/**
 * Modalità Laboratorio: la "lavagna delle frasi". L'utente sceglie uno scenario
 * reale, la forma del verbo, il tempo e i complementi, e vede la frase montarsi
 * con particelle e desinenze evidenziate (gli "ingranaggi").
 */
export function Lab() {
  const { script } = useScript();
  const { supported, japaneseVoiceAvailable, speakingKey, speak } = useSpeech();

  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [form, setForm] = useState<Form>("pres");
  const [timeIndex, setTimeIndex] = useState(0);

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];
  const [selections, setSelections] = useState<number[]>(() =>
    scenario.slots.map((s) => s.defaultIndex),
  );

  // Reset dei complementi ai default quando cambia lo scenario.
  useEffect(() => {
    setSelections(scenario.slots.map((s) => s.defaultIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  const setSelection = (slotIndex: number, optionIndex: number) =>
    setSelections((prev) => prev.map((v, i) => (i === slotIndex ? optionIndex : v)));

  const time = TIMES[timeIndex];

  return (
    <div className="lab-page">
      <SpeechNotice supported={supported} japaneseVoiceAvailable={japaneseVoiceAvailable} />

      <div className="scenario">
        <span className="scenario__label">SCENARIO:</span>
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`pill${s.id === scenarioId ? " is-active" : ""}`}
            onClick={() => setScenarioId(s.id)}
          >
            <span aria-hidden="true">{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>

      <TeachNote
        verb={scenario.verb}
        form={form}
        timeIt={time.none ? "" : time.it}
        timeFuture={!!time.future}
      />

      <div className="lab">
        <Board
          scenario={scenario}
          form={form}
          timeIndex={timeIndex}
          selections={selections}
          script={script}
          supported={supported}
          speakingKey={speakingKey}
          speak={speak}
        />
        <ControlPanel
          scenario={scenario}
          form={form}
          setForm={setForm}
          timeIndex={timeIndex}
          setTimeIndex={setTimeIndex}
          selections={selections}
          setSelection={setSelection}
          script={script}
        />
      </div>
    </div>
  );
}
