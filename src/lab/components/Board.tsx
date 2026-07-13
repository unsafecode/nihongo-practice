import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { Scenario, Form } from "../data/types";
import { PARTICLE } from "../data/types";
import { conjugate } from "../engine/conjugate";
import { assembleJP, assembleIT, type Segment } from "../engine/assemble";
import type { Script } from "../../settings/ScriptContext";
import type { SpeakOptions } from "../../hooks/useSpeech";
import { TIMES, JP_ORDER, IT_ORDER, ROLE_CHIP } from "./labData";
import { Chip } from "./Chip";

interface BoardProps {
  scenario: Scenario;
  form: Form;
  timeIndex: number;
  selections: number[];
  script: Script;
  supported: boolean;
  speakingKey: string | null;
  speak: (text: string, opts?: SpeakOptions) => void;
}

interface VisualSegment {
  jp: ReactNode;
  romaji: ReactNode;
}

export function Board({
  scenario,
  form,
  timeIndex,
  selections,
  script,
  supported,
  speakingKey,
  speak,
}: BoardProps) {
  const time = TIMES[timeIndex];
  const conj = conjugate(scenario.verb, form);
  const stemJp = conj.jp.slice(0, conj.jp.length - conj.ending.length);
  const stemRomaji = scenario.verb.stemRomaji;
  const bump = useBump(`${scenario.id}|${form}|${timeIndex}|${selections.join(",")}`);

  // Slot presenti (opzione ≠ none), ordinati come in giapponese.
  const present = scenario.slots
    .map((slot, i) => {
      const idx = selections[i] ?? slot.defaultIndex;
      return { slot, opt: slot.options[idx] ?? slot.options[slot.defaultIndex] };
    })
    .filter(({ opt }) => opt && !opt.none)
    .sort((a, b) => JP_ORDER.indexOf(a.slot.role) - JP_ORDER.indexOf(b.slot.role));

  // --- Chips ---
  const chips: ReactNode[] = [];
  if (!time.none) {
    chips.push(
      <Chip key="time" kind="time" role="quando" jp={time.jp} romaji={time.romaji} script={script} />,
    );
  }
  present.forEach(({ slot, opt }) => {
    const p = PARTICLE[slot.role];
    chips.push(
      <Chip
        key={slot.role}
        kind={ROLE_CHIP[slot.role]}
        role={`${slot.label} · ${p.jp}`}
        jp={<>{opt.jp}<span className="particle">{p.jp}</span></>}
        romaji={<>{opt.romaji} <span className="particle">{p.romaji}</span></>}
        script={script}
      />,
    );
  });
  chips.push(
    <Chip
      key="verb"
      kind="verb"
      role="verbo"
      jp={<>{stemJp}<span className="ending">{conj.ending}</span></>}
      romaji={<>{stemRomaji} <span className="ending">{conj.endingRomaji}</span></>}
      script={script}
      bump={bump}
    />,
  );

  // --- Frase completa (con ingranaggi evidenziati) ---
  const segs: VisualSegment[] = [];
  if (!time.none) segs.push({ jp: time.jp, romaji: time.romaji });
  present.forEach(({ slot, opt }) => {
    const p = PARTICLE[slot.role];
    segs.push({
      jp: <>{opt.jp}<span className="particle">{p.jp}</span></>,
      romaji: <>{opt.romaji} <span className="particle">{p.romaji}</span></>,
    });
  });
  segs.push({
    jp: <>{stemJp}<span className="ending">{conj.ending}</span></>,
    romaji: <>{stemRomaji} <span className="ending">{conj.endingRomaji}</span></>,
  });

  const mainNodes = joinSpaced(segs.map((s) => (script === "hiragana" ? s.jp : s.romaji)));
  const subNodes = joinSpaced(segs.map((s) => (script === "hiragana" ? s.romaji : s.jp)));

  // --- Italiano ---
  const itArgs = present
    .slice()
    .sort((a, b) => IT_ORDER[a.slot.role] - IT_ORDER[b.slot.role])
    .map(({ opt }) => opt.it)
    .filter((x) => x.length > 0);
  const itSentence = assembleIT({
    verb: scenario.verb.it,
    form,
    timeIt: time.none ? "" : time.it,
    timeFuture: !!time.future,
    args: itArgs,
  });

  // --- Audio (testo giapponese semplice, senza spazi) ---
  const audioSegments: Segment[] = [];
  if (!time.none) audioSegments.push({ kind: "time", jp: time.jp, romaji: time.romaji });
  present.forEach(({ slot, opt }) => {
    audioSegments.push({ kind: slot.role, jp: opt.jp, romaji: opt.romaji, particle: PARTICLE[slot.role] });
  });
  audioSegments.push({ kind: "verb", jp: conj.jp, romaji: conj.romaji });
  const audioText = assembleJP(audioSegments).jp;

  return (
    <div className="board">
      <div className="board__label">Lavagna</div>
      <div className="chips">{chips}</div>
      <div className="sentence">
        <div
          className={script === "hiragana" ? "sentence__main" : "sentence__main romaji"}
          lang={script === "hiragana" ? "ja" : undefined}
        >
          {mainNodes}
        </div>
        <div
          className={script === "hiragana" ? "sentence__sub" : "sentence__sub jp"}
          lang={script === "romaji" ? "ja" : undefined}
        >
          {subNodes}
        </div>
        <div className="sentence__it">{itSentence}</div>
        <button
          type="button"
          className="listen"
          disabled={!supported}
          onClick={() => speak(audioText, { key: "lab-full" })}
          aria-label="Ascolta la frase"
        >
          <span aria-hidden="true">▶</span>{" "}
          {speakingKey === "lab-full" ? "In riproduzione…" : "Ascolta"}
        </button>
        <div className="legend">
          <span>
            <span className="sw sw--p" /> <b>Particelle</b> — il <i>ruolo</i> delle parole (を chi/cosa, で dove, に verso…)
          </span>
          <span>
            <span className="sw sw--e" /> <b>Terminazioni</b> — <i>tempo</i> e <i>polarità</i> (ます, ました, ません…)
          </span>
        </div>
      </div>
    </div>
  );
}

/** Unisce nodi con uno spazio, preservando le key. */
function joinSpaced(nodes: ReactNode[]): ReactNode[] {
  return nodes.map((n, i) => (
    <Fragment key={i}>
      {i > 0 ? " " : null}
      {n}
    </Fragment>
  ));
}

/** Custom hook: true per ~200ms dopo ogni cambio della firma (anima il verbo). */
function useBump(sig: string): boolean {
  const [bump, setBump] = useState(false);
  const first = useRef(true);
  const prev = useRef(sig);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      prev.current = sig;
      return;
    }
    if (prev.current === sig) return;
    prev.current = sig;
    setBump(true);
    const t = setTimeout(() => setBump(false), 200);
    return () => clearTimeout(t);
  }, [sig]);
  return bump;
}
