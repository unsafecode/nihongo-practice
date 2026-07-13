import { Fragment } from "react";
import { Link } from "react-router";
import { useSpeech } from "../../hooks/useSpeech";
import { getCatalog } from "../../i18n/catalog";
import { useLocale } from "../../i18n/LocaleContext";
import { buildJapaneseSentence } from "../../lab/engine/japanese";
import { useScript } from "../../settings/ScriptContext";
import type { LabSelection } from "../../content/types";
import { getCourseCopy } from "../i18n/catalog";
import { buildLabViewModel } from "../../lab/components/viewModel";
import type { JapaneseSentencePart } from "../../lab/engine/japanese";

type ScriptField = "jp" | "romaji";

interface GuidedLabPreviewProps {
  selection: LabSelection;
  to: string;
  title: string;
  body?: string;
}

function PartText({
  part,
  field,
}: {
  part: JapaneseSentencePart;
  field: ScriptField;
}) {
  const gear = part.particle ?? part.suffix;
  const separator = field === "romaji" && gear ? " " : "";
  return (
    <>
      {part[field]}
      {gear ? (
        <>
          {separator}
          <span className={gear.kind}>{gear[field]}</span>
        </>
      ) : null}
    </>
  );
}

export function GuidedLabPreview({
  selection,
  to,
  title,
  body,
}: GuidedLabPreviewProps) {
  const { locale, referenceLocale, showReference } = useLocale();
  const { script } = useScript();
  const { supported, speakingKey, playbackFailed, speak } = useSpeech();
  const courseCopy = getCourseCopy(locale);
  const ui = getCatalog(locale).ui;
  const japanese = buildJapaneseSentence(selection);
  const vm = buildLabViewModel(selection, locale, referenceLocale);
  const primaryField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const secondaryField: ScriptField =
    script === "hiragana" ? "romaji" : "jp";
  const speechKey = `guided-${selection.scenarioId}-${selection.form}-${selection.timeId}`;

  const partLabel = (part: JapaneseSentencePart): string => {
    if (part.kind === "time") return vm.ui.lab.when;
    if (part.kind === "verb") return vm.forms[selection.form].grammar;
    const slot = vm.slots.find((item) => item.id === part.id);
    if (!slot) throw new Error(`Missing guided slot copy: ${part.id}`);
    return `${slot.copy.prompt} · ${part.particle?.jp ?? ""}`;
  };

  return (
    <section className="guided-board">
      <div className="guided-board__top">
        <div>
          <p className="guided-board__label">
            {courseCopy.practice.guidedBoard}
          </p>
          <h2>{title}</h2>
          {body ? <p>{body}</p> : null}
        </div>
        <button
          type="button"
          className="guided-board__listen"
          disabled={!supported}
          onClick={() => speak(japanese.sentence.jp, { key: speechKey })}
        >
          <span aria-hidden="true">▶</span>{" "}
          <span aria-live="polite">
            {speakingKey === speechKey
              ? courseCopy.lesson.playing
              : courseCopy.lesson.listen}
          </span>
        </button>
      </div>

      {playbackFailed ? (
        <p className="guided-board__error" role="alert">
          {ui.speech.failed}
        </p>
      ) : null}

      <div className="guided-board__chips">
        {japanese.parts.map((part) => (
          <div className="guided-board__chip" key={part.id}>
            <small>{partLabel(part)}</small>
            <b lang={primaryField === "jp" ? "ja" : undefined}>
              <PartText part={part} field={primaryField} />
            </b>
            <span lang={secondaryField === "jp" ? "ja" : undefined}>
              <PartText part={part} field={secondaryField} />
            </span>
          </div>
        ))}
      </div>

      <p
        className={`guided-board__sentence${
          primaryField === "romaji" ? " is-romaji" : ""
        }`}
        lang={primaryField === "jp" ? "ja" : undefined}
      >
        {japanese.parts.map((part, index) => (
          <Fragment key={part.id}>
            {index > 0 ? " " : null}
            <PartText part={part} field={primaryField} />
          </Fragment>
        ))}
      </p>
      <p
        className="guided-board__secondary"
        lang={secondaryField === "jp" ? "ja" : undefined}
      >
        {japanese.parts.map((part, index) => (
          <Fragment key={part.id}>
            {index > 0 ? " " : null}
            <PartText part={part} field={secondaryField} />
          </Fragment>
        ))}
      </p>
      <p className="guided-board__translation">
        {vm.sentence.primary}
        {showReference ? (
          <>
            {" · "}
            <span>{referenceLocale.toUpperCase()}: {vm.sentence.reference}</span>
          </>
        ) : null}
      </p>
      <div className="guided-board__legend">
        <span><b className="particle" lang="ja">を</b>{ui.lab.particles}</span>
        <span><b className="ending" lang="ja">ます</b>{ui.lab.endings}</span>
      </div>
      <Link className="guided-board__action" to={to}>
        {courseCopy.practice.openGuidedLab} →
      </Link>
    </section>
  );
}
