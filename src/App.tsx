import { useEffect, useState } from "react";
import { Header, type Mode } from "./components/Header";
import { Phrasebook } from "./components/Phrasebook";
import { getCatalog } from "./i18n/catalog";
import { LocaleProvider, useLocale } from "./i18n/LocaleContext";
import { Lab } from "./lab/components/Lab";
import { ScriptProvider, useScript } from "./settings/ScriptContext";
import { Syllabary } from "./syllabary/Syllabary";

function AppContent() {
  const [mode, setMode] = useState<Mode>("laboratorio");
  const { locale, persistenceAvailable: localePersistence } = useLocale();
  const { persistenceAvailable: scriptPersistence } = useScript();
  const ui = getCatalog(locale).ui;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = ui.documentTitle;
  }, [locale, ui.documentTitle]);

  return (
    <div className="app">
      <Header mode={mode} onModeChange={setMode} />
      {!localePersistence || !scriptPersistence ? (
        <p className="settings-warning" role="status">{ui.settings.unavailable}</p>
      ) : null}
      {mode === "sillabario" && <Syllabary />}
      {mode === "frasario" && <Phrasebook />}
      {mode === "laboratorio" && <Lab />}
      <footer className="footer"><p>{ui.footer}</p></footer>
    </div>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <ScriptProvider>
        <AppContent />
      </ScriptProvider>
    </LocaleProvider>
  );
}
