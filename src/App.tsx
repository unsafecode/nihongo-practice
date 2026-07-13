import { useState } from "react";
import { Header, type Mode } from "./components/Header";
import { Phrasebook } from "./components/Phrasebook";
import { LocaleProvider } from "./i18n/LocaleContext";
import { Lab } from "./lab/components/Lab";
import { ScriptProvider } from "./settings/ScriptContext";
import { Syllabary } from "./syllabary/Syllabary";

export default function App() {
  const [mode, setMode] = useState<Mode>("laboratorio");

  return (
    <LocaleProvider>
      <ScriptProvider>
        <div className="app">
          <Header mode={mode} onModeChange={setMode} />
          {mode === "sillabario" && <Syllabary />}
          {mode === "frasario" && <Phrasebook />}
          {mode === "laboratorio" && <Lab />}
          <footer className="footer">
            <p>
              Fatto per imparare · audio con la sintesi vocale del browser · solo
              hiragana
            </p>
          </footer>
        </div>
      </ScriptProvider>
    </LocaleProvider>
  );
}
