import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { LabSelection } from "../../content/types";
import { getCourseCopy } from "../../course/i18n/catalog";
import type { SpeakOptions } from "../../hooks/useSpeech";
import { useLocale, type Locale } from "../../i18n/LocaleContext";
import { RomajiSequence } from "../../romaji/RomajiSequence";
import type { AssembledToken } from "../../romaji/types";
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

/**
 * A deliberately invalid sentinel forcing `RomajiSequence`'s localized error
 * path (never a silent fallback/concatenation) if a Lab part's token cannot
 * be located by id — this should not happen with real selections, but any
 * gap must surface, not silently drop content.
 */
const INVALID_TOKEN: AssembledToken = {
  id: "",
  jp: "",
  romaji: "",
  kind: "lexical",
  boundaryBefore: "attach",
  source: { domain: "lab", referenceId: "" },
};

/**
 * Renders a single gear (particle/ending) token with its existing
 * color-coded `<span>` wrapper — the same visual cue in both scripts,
 * driven by the token's own kind rather than a duplicated rule.
 */
function renderGearToken(token: AssembledToken): ReactNode {
  if (token.kind === "particle") {
    return <span className="particle">{token.romaji}</span>;
  }
  if (token.kind === "morpheme") {
    return <span className="ending">{token.romaji}</span>;
  }
  return token.romaji;
}

/**
 * The Japanese script never spaces words: renders the part's own text plus
 * any particle/ending glyph, color-coded, with no separators — unchanged
 * from the prior behavior.
 */
function JpPartText({ part }: { part: JapaneseSentencePart }) {
  const gear = part.particle ?? part.suffix;
  return (
    <>
      {part.jp}
      {gear ? <span className={gear.kind}>{gear.jp}</span> : null}
    </>
  );
}

/**
 * Extracts a Lab part's own token(s) from the full sentence token list by
 * id, then re-isolates the first one so it always attaches — required by
 * `formatRomaji`'s validation for any subset rendered on its own (a chip
 * is never the full sentence, so its first token's original mid-sentence
 * boundary would otherwise fail validation or inject a spurious space).
 */
function partTokens(
  part: JapaneseSentencePart,
  tokens: readonly AssembledToken[],
): AssembledToken[] {
  const byId = new Map(tokens.map((token) => [token.id, token] as const));
  const ids =
    part.kind === "time"
      ? ["time"]
      : part.kind === "verb"
        ? ["verb-stem", "verb-suffix"]
        : [`${part.id}-word`, `${part.id}-particle`];
  const [first, ...rest] = ids.map((id) => byId.get(id) ?? INVALID_TOKEN);
  return [{ ...first, boundaryBefore: "attach" }, ...rest];
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
  const { locale } = useLocale();
  const errorText = getCourseCopy(locale).lesson.contentFormattingError;
  const japanese = buildJapaneseSentence(selection);
  const bump = useBump(JSON.stringify(selection));
  const mainField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const subField: ScriptField = script === "hiragana" ? "romaji" : "jp";
  const compatible = vm.naturalness !== "incompatible";

  const chips = japanese.parts.map((part) => {
    const jp = <JpPartText part={part} />;
    const romaji = (
      <RomajiSequence
        tokens={partTokens(part, japanese.tokens)}
        errorText={errorText}
        renderToken={renderGearToken}
      />
    );
    if (part.kind === "time") {
      return (
        <Chip
          key={part.id}
          kind="time"
          role={vm.ui.lab.when}
          jp={jp}
          romaji={romaji}
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
          jp={jp}
          romaji={romaji}
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
        jp={jp}
        romaji={romaji}
        script={script}
      />
    );
  });

  const jpSentence = (
    <>
      {japanese.parts.map((part) => (
        <JpPartText key={part.id} part={part} />
      ))}
    </>
  );
  const romajiSentence = (
    <RomajiSequence
      tokens={japanese.tokens}
      errorText={errorText}
      renderToken={renderGearToken}
    />
  );
  const mainNode = mainField === "jp" ? jpSentence : romajiSentence;
  const subNode = subField === "jp" ? jpSentence : romajiSentence;

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
          {mainNode}
        </div>
        <div
          className={`sentence__sub${subField === "jp" ? " jp" : ""}`}
          lang={subField === "jp" ? "ja" : undefined}
        >
          {subNode}
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
