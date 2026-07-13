import { useEffect } from "react";
import { HashRouter } from "react-router";
import { Header } from "./components/Header";
import { AppRoutes } from "./routing/routes";
import { LocaleProvider, useLocale } from "./i18n/LocaleContext";
import { getCatalog } from "./i18n/catalog";
import { ScriptProvider, useScript } from "./settings/ScriptContext";
import {
  ProgressProvider,
  useProgress,
} from "./course/progress/ProgressContext";

function PersistenceWarning({
  settingsUnavailable,
}: {
  settingsUnavailable: boolean;
}) {
  const { locale } = useLocale();
  const { persistenceAvailable: progressPersistence } = useProgress();
  if (!settingsUnavailable && progressPersistence) return null;
  return (
    <p className="settings-warning" role="status">
      {getCatalog(locale).ui.settings.unavailable}
    </p>
  );
}

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
      <ProgressProvider>
        <div className="app">
          <Header />
          <PersistenceWarning
            settingsUnavailable={!localePersistence || !scriptPersistence}
          />
          <AppRoutes />
          <footer className="footer"><p>{ui.footer}</p></footer>
        </div>
      </ProgressProvider>
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
