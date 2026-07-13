import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { browserStorage, readSetting, writeSetting } from "./storage";

export type Script = "hiragana" | "romaji";
const KEY = "nihongo.script";

export function normalizeScript(value: string | null): Script {
  return value === "romaji" ? "romaji" : "hiragana";
}

interface ScriptCtx {
  script: Script;
  persistenceAvailable: boolean;
  setScript: (s: Script) => void;
  toggle: () => void;
}

const Ctx = createContext<ScriptCtx | null>(null);

export function ScriptProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => browserStorage(), []);
  const [initial] = useState(() => {
    const stored = readSetting(storage, KEY);
    return {
      script: normalizeScript(stored.value),
      persistenceAvailable: stored.available,
    };
  });
  const [script, setScriptState] = useState<Script>(initial.script);
  const [persistenceAvailable, setPersistenceAvailable] = useState(
    initial.persistenceAvailable,
  );

  useEffect(() => {
    setPersistenceAvailable(writeSetting(storage, KEY, script));
  }, [script, storage]);

  const setScript = (s: Script) => setScriptState(s);
  const toggle = () =>
    setScriptState((s) => (s === "hiragana" ? "romaji" : "hiragana"));

  return (
    <Ctx.Provider value={{ script, persistenceAvailable, setScript, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useScript(): ScriptCtx {
  const value = useContext(Ctx);
  if (!value) throw new Error("useScript must be used inside ScriptProvider");
  return value;
}
