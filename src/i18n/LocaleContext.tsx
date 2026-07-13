import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { browserStorage, readSetting, writeSetting } from "../settings/storage";

export type Locale = "it" | "en";

const LOCALE_KEY = "nihongo.locale.primary";
const REFERENCE_KEY = "nihongo.locale.reference";

export function normalizeLocale(value: string | null): Locale {
  return value === "en" ? "en" : "it";
}

export function normalizeReference(value: string | null): boolean {
  return value === "true";
}

interface LocaleContextValue {
  locale: Locale;
  referenceLocale: Locale;
  showReference: boolean;
  persistenceAvailable: boolean;
  setLocale: (locale: Locale) => void;
  setShowReference: (show: boolean) => void;
}

const LocaleCtx = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => browserStorage(), []);
  const [initial] = useState(() => {
    const localeRead = readSetting(storage, LOCALE_KEY);
    const referenceRead = readSetting(storage, REFERENCE_KEY);
    return {
      locale: normalizeLocale(localeRead.value),
      showReference: normalizeReference(referenceRead.value),
      persistenceAvailable: localeRead.available && referenceRead.available,
    };
  });
  const [locale, setLocaleState] = useState<Locale>(initial.locale);
  const [showReference, setReferenceState] = useState(
    initial.showReference,
  );
  const [persistenceAvailable, setPersistenceAvailable] = useState(
    initial.persistenceAvailable,
  );

  useEffect(() => {
    const localeWritten = writeSetting(storage, LOCALE_KEY, locale);
    const referenceWritten = writeSetting(
      storage,
      REFERENCE_KEY,
      String(showReference),
    );
    setPersistenceAvailable(localeWritten && referenceWritten);
  }, [locale, showReference, storage]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      referenceLocale: locale === "it" ? "en" : "it",
      showReference,
      persistenceAvailable,
      setLocale: setLocaleState,
      setShowReference: setReferenceState,
    }),
    [locale, showReference, persistenceAvailable],
  );

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleCtx);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
