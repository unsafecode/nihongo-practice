import type { ReactNode } from "react";
import type { Script } from "../../settings/ScriptContext";

interface ChipProps {
  kind: "time" | "obj" | "place" | "topic" | "verb";
  role: string; // etichetta piccola in alto (es. "cosa · を")
  jp: ReactNode; // testo giapponese, può contenere <span> ingranaggi
  romaji: ReactNode; // testo rōmaji, può contenere <span> ingranaggi
  script: Script;
  bump?: boolean; // animazione al cambio (verbo)
}

/**
 * Un "chip" della lavagna. Struttura e classi portate dal mockup:
 * lo script primario (grande) e secondario (piccolo) si scambiano in base
 * all'impostazione hiragana/rōmaji. Particelle e desinenze arrivano già
 * evidenziate come <span> dentro `jp`/`romaji`.
 */
export function Chip({ kind, role, jp, romaji, script, bump }: ChipProps) {
  return (
    <div className={`chip chip--${kind}${bump ? " bump" : ""}`}>
      <div className="chip__role">{role}</div>
      {script === "hiragana" ? (
        <>
          <div className="chip__main" lang="ja">{jp}</div>
          <div className="chip__sub">{romaji}</div>
        </>
      ) : (
        <>
          <div className="chip__main romaji">{romaji}</div>
          <div className="chip__sub jp" lang="ja">{jp}</div>
        </>
      )}
    </div>
  );
}
