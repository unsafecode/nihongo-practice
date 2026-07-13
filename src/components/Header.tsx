import { useScript } from "../settings/ScriptContext";

export type Mode = "sillabario" | "frasario" | "laboratorio";

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
}

const MODES: { id: Mode; label: string; emoji: string }[] = [
  { id: "sillabario", label: "Sillabario", emoji: "🈂️" },
  { id: "frasario", label: "Frasario", emoji: "📖" },
  { id: "laboratorio", label: "Laboratorio", emoji: "🧑‍🏫" },
];

export function Header({ mode, onModeChange }: Props) {
  const { script, setScript } = useScript();

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo" lang="ja" aria-hidden="true">
          はなそう
        </span>
        <div className="header__text">
          <h1 className="header__title">Giapponese pratico</h1>
          <p className="header__subtitle">
            Parlato · costruzione frasi · solo hiragana
          </p>
        </div>
      </div>

      <div className="header__tools">
        <nav className="modenav" aria-label="Modalità">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`modenav__item${mode === m.id ? " is-active" : ""}`}
              aria-pressed={mode === m.id}
              onClick={() => onModeChange(m.id)}
            >
              <span aria-hidden="true">{m.emoji}</span> {m.label}
            </button>
          ))}
        </nav>

        <div className="scripttoggle" role="group" aria-label="Scrittura">
          <button
            type="button"
            className={script === "hiragana" ? "is-active" : ""}
            aria-pressed={script === "hiragana"}
            onClick={() => setScript("hiragana")}
          >
            <span className="k" lang="ja" aria-hidden="true">
              あ
            </span>{" "}
            Hiragana
          </button>
          <button
            type="button"
            className={script === "romaji" ? "is-active" : ""}
            aria-pressed={script === "romaji"}
            onClick={() => setScript("romaji")}
          >
            <span className="k" aria-hidden="true">
              A
            </span>{" "}
            Rōmaji
          </button>
        </div>
      </div>
    </header>
  );
}
