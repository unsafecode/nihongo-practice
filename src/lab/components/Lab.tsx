import { useState } from "react";
import { useSearchParams } from "react-router";
import { ActionLink } from "../../components/actions/Action";
import { Notice } from "../../components/Notice";
import { SpeechNotice } from "../../components/SpeechNotice";
import { scenarios } from "../../content/scenarios";
import type {
  ConceptId,
  LabSelection,
  ScenarioId,
  TimeId,
} from "../../content/types";
import { useSpeech } from "../../hooks/useSpeech";
import { getCatalog } from "../../i18n/catalog";
import { useLocale } from "../../i18n/LocaleContext";
import { useScript } from "../../settings/ScriptContext";
import { getCourseCopy } from "../../course/i18n/catalog";
import { readGuidedReturn } from "../../routing/guidedToolLink";
import type { Form } from "../engine/conjugate";
import { hasLabPreset, parseLabPreset } from "../presets";
import { Board } from "./Board";
import { ControlPanel } from "./ControlPanel";
import { TeachNote } from "./TeachNote";
import { buildLabViewModel } from "./viewModel";
import "../lab.css";

function defaultSelection(scenarioId: ScenarioId): LabSelection {
  const scenario =
    scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  return {
    scenarioId: scenario.id,
    form: "pres",
    timeId: "today",
    options: Object.fromEntries(
      scenario.slots.map((slot) => [slot.id, slot.defaultOptionId]),
    ),
  };
}

export function Lab() {
  const { locale, referenceLocale, showReference } = useLocale();
  const { script } = useScript();
  const { supported, japaneseVoiceAvailable, speakingKey, playbackFailed, speak } = useSpeech();
  const [searchParams] = useSearchParams();
  const [initialPreset] = useState(() => ({
    attempted: hasLabPreset(searchParams),
    parsed: parseLabPreset(searchParams),
  }));
  const [guidedReturn] = useState(() => readGuidedReturn(searchParams));
  const [selection, setSelection] = useState<LabSelection>(() =>
    initialPreset.parsed?.selection ?? defaultSelection(scenarios[0].id),
  );
  const courseCopy = getCourseCopy(locale);
  const pack = getCatalog(locale);
  const vm = buildLabViewModel(selection, locale, referenceLocale);

  const setScenario = (scenarioId: ScenarioId) => {
    setSelection((current) => {
      const next = defaultSelection(scenarioId);
      return {
        ...next,
        form: current.form,
        timeId: current.timeId,
      };
    });
  };

  const setForm = (form: Form) => {
    setSelection((current) => ({ ...current, form }));
  };

  const setTime = (timeId: TimeId) => {
    setSelection((current) => ({ ...current, timeId }));
  };

  const setOption = (slotId: string, conceptId: ConceptId | null) => {
    setSelection((current) => ({
      ...current,
      options: { ...current.options, [slotId]: conceptId },
    }));
  };

  return (
    <div className="lab-page">
      <SpeechNotice
        supported={supported}
        japaneseVoiceAvailable={japaneseVoiceAvailable}
        playbackFailed={playbackFailed}
      />
      {initialPreset.attempted && !initialPreset.parsed ? (
        <Notice
          tone="warning"
          title={courseCopy.practice.invalidPresetTitle}
          body={courseCopy.practice.invalidPreset}
        />
      ) : null}
      {guidedReturn.status === "invalid" ? (
        <Notice
          tone="warning"
          title={courseCopy.practice.invalidReturnTitle}
          body={courseCopy.practice.invalidReturn}
        />
      ) : null}
      {guidedReturn.status === "valid" ? (
        <ActionLink
          className="guided-return"
          variant="secondary"
          to={guidedReturn.href}
        >
          ← {courseCopy.practice.backToLesson}
        </ActionLink>
      ) : null}

      <div
        className="scenario"
        role="group"
        aria-label={vm.ui.lab.scenario}
      >
        <span className="scenario__label">{vm.ui.lab.scenario}:</span>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={`pill${
              scenario.id === selection.scenarioId ? " is-active" : ""
            }`}
            aria-pressed={scenario.id === selection.scenarioId}
            onClick={() => setScenario(scenario.id)}
          >
            <span aria-hidden="true">{scenario.emoji}</span>{" "}
            {pack.scenarios[scenario.id].title}
          </button>
        ))}
      </div>

      <TeachNote
        verb={vm.scenario.verb}
        form={selection.form}
        formCopy={vm.forms[selection.form]}
        ui={vm.ui.lab}
      />

      <div className="lab">
        <Board
          selection={selection}
          vm={vm}
          script={script}
          showReference={showReference}
          referenceLocale={referenceLocale}
          supported={supported}
          speakingKey={speakingKey}
          speak={speak}
        />
        <ControlPanel
          selection={selection}
          vm={vm}
          script={script}
          onFormChange={setForm}
          onTimeChange={setTime}
          onOptionChange={setOption}
        />
      </div>
    </div>
  );
}
