import {
  Fragment,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import type { LabSelection } from "../../content/types";
import type { SpeakOptions } from "../../hooks/useSpeech";
import type { Locale } from "../../i18n/LocaleContext";
import type { Script } from "../../settings/ScriptContext";
import {
  buildJapaneseSentence,
  type JapaneseSentencePart,
} from "../engine/japanese";
import { Chip } from "./Chip";
import { ROLE_CHIP } from "./labData";
import type { LabViewModel } from "./viewModel";

interface Props {
  selection: LabSelection;
  vm: LabViewModel;
  script: Script;
  showReference: boolean;
  referenceLocale: Locale;
  supported: boolean;
  speakingKey: string | null;
  speak: (text: string, opts?: SpeakOptions) => void;
}

type ScriptField = "jp" | "romaji";

function PartText({
  part,
  field,
}: {
  part: JapaneseSentencePart;
  field: ScriptField;
}) {
  const gear = part.particle ?? part.suffix;
  return (
    <>
      {part[field]}
      {gear ? (
        <>
          {field === "romaji" ? " " : null}
          <span className={gear.kind}>{gear[field]}</span>
        </>
      ) : null}
    </>
  );
}

function joinSpaced(nodes: ReactNode[]): ReactNode[] {
  return nodes.map((node, index) => (
    <Fragment key={index}>
      {index > 0 ? " " : null}
      {node}
    </Fragment>
  ));
}

export function Board({
  selection,
  vm,
  script,
  showReference,
  referenceLocale,
  supported,
  speakingKey,
  speak,
}: Props) {
  const japanese = buildJapaneseSentence(selection);
  const bump = useBump(JSON.stringify(selection));
  const mainField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const subField: ScriptField = script === "hiragana" ? "romaji" : "jp";
  const compatible = vm.naturalness !== "incompatible";

  const chips = japanese.parts.map((part) => {
    if (part.kind === "time") {
      return (
        <Chip
          key={part.id}
          kind="time"
          role={vm.ui.lab.when}
          jp={<PartText part={part} field="jp" />}
          romaji={<PartText part={part} field="romaji" />}
          script={script}
        />
      );
    }
    if (part.kind === "verb") {
      return (
        <Chip
          key={part.id}
          kind="verb"
          role={vm.ui.lab.verb}
          jp={<PartText part={part} field="jp" />}
          romaji={<PartText part={part} field="romaji" />}
          script={script}
          bump={bump}
        />
      );
    }
    if (!part.semanticRole) {
      throw new Error(`Missing semantic role for Lab part: ${part.id}`);
    }
    const slot = vm.slots.find((item) => item.id === part.id);
    if (!slot) throw new Error(`Missing Lab slot copy: ${part.id}`);
    return (
      <Chip
        key={part.id}
        kind={ROLE_CHIP[part.semanticRole]}
        role={`${slot.copy.prompt} · ${part.particle?.jp ?? ""}`}
        jp={<PartText part={part} field="jp" />}
        romaji={<PartText part={part} field="romaji" />}
        script={script}
      />
    );
  });

  const mainNodes = joinSpaced(
    japanese.parts.map((part) => (
      <PartText part={part} field={mainField} />
    )),
  );
  const subNodes = joinSpaced(
    japanese.parts.map((part) => (
      <PartText part={part} field={subField} />
    )),
  );

  return (
    <div className="board">
      <div className="board__label">{vm.ui.lab.board}</div>
      {vm.naturalness !== "natural" ? (
        <div
          className={`naturalness naturalness--${vm.naturalness}`}
          role="status"
        >
          {vm.naturalness === "contextual"
            ? vm.ui.lab.contextual
            : vm.ui.lab.incompatible}
        </div>
      ) : null}
      <div className="chips">{chips}</div>
      <div className="sentence">
        <div
          className={`sentence__main${
            mainField === "romaji" ? " romaji" : ""
          }`}
          lang={mainField === "jp" ? "ja" : undefined}
        >
          {mainNodes}
        </div>
        <div
          className={`sentence__sub${subField === "jp" ? " jp" : ""}`}
          lang={subField === "jp" ? "ja" : undefined}
        >
          {subNodes}
        </div>
        <div
          className={`sentence__translation${
            compatible ? "" : " is-unavailable"
          }`}
        >
          {compatible ? vm.sentence.primary : vm.ui.common.none}
        </div>
        {compatible && showReference ? (
          <div className="sentence__reference">
            <span>{referenceLocale.toUpperCase()}</span> {vm.sentence.reference}
          </div>
        ) : null}
        <button
          type="button"
          className="listen"
          disabled={!supported}
          onClick={() =>
            speak(japanese.sentence.jp, { key: "lab-full" })
          }
          aria-label={`${vm.ui.common.listen}: ${japanese.sentence.jp}`}
        >
          <span aria-hidden="true">▶</span>{" "}
          {speakingKey === "lab-full"
            ? vm.ui.common.playing
            : vm.ui.common.listen}
        </button>
        <div className="legend">
          <span>
            <span className="sw sw--p" /> {vm.ui.lab.particles}
          </span>
          <span>
            <span className="sw sw--e" /> {vm.ui.lab.endings}
          </span>
        </div>
      </div>
    </div>
  );
}

function useBump(signature: string): boolean {
  const [bump, setBump] = useState(false);
  const first = useRef(true);
  const previous = useRef(signature);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      previous.current = signature;
      return;
    }
    if (previous.current === signature) return;
    previous.current = signature;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 200);
    return () => window.clearTimeout(timer);
  }, [signature]);
  return bump;
}
