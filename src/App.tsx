import { useEffect } from "react";
import { HashRouter } from "react-router";
import { Header } from "./components/Header";
import { AppRoutes } from "./routing/routes";
import { LocaleProvider, useLocale } from "./i18n/LocaleContext";
import { getCatalog } from "./i18n/catalog";
import { ScriptProvider, useScript } from "./settings/ScriptContext";

function AppContent() {
  const { locale, persistenceAvailable: localePersistence } = useLocale();
  const { persistenceAvailable: scriptPersistence } = useScript();
  const ui = getCatalog(locale).ui;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = ui.documentTitle;
  }, [locale, ui.documentTitle]);

  return (
    <HashRouter>
      <div className="app">
        <Header />
        {!localePersistence || !scriptPersistence ? (
          <p className="settings-warning" role="status">
            {ui.settings.unavailable}
          </p>
        ) : null}
        <AppRoutes />
        <footer className="footer"><p>{ui.footer}</p></footer>
      </div>
    </HashRouter>
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
