import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Script = "hiragana" | "romaji";
const KEY = "nihongo.script";

export function normalizeScript(value: string | null): Script {
  return value === "romaji" ? "romaji" : "hiragana";
}

interface ScriptCtx {
  script: Script;
  setScript: (s: Script) => void;
  toggle: () => void;
}

const Ctx = createContext<ScriptCtx | null>(null);

export function ScriptProvider({ children }: { children: ReactNode }) {
  const [script, setScriptState] = useState<Script>(() =>
    normalizeScript(typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null),
  );
  useEffect(() => {
    try { localStorage.setItem(KEY, script); } catch { /* ignore */ }
  }, [script]);

  const setScript = (s: Script) => setScriptState(s);
  const toggle = () => setScriptState((s) => (s === "hiragana" ? "romaji" : "hiragana"));

  return <Ctx.Provider value={{ script, setScript, toggle }}>{children}</Ctx.Provider>;
}

export function useScript(): ScriptCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useScript deve stare dentro <ScriptProvider>");
  return v;
}
