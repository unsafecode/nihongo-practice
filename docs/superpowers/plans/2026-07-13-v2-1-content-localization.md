# V2.1 Semantic Content and Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v2 Italian-fragment data model with a locale-independent Japanese core, complete Italian/English catalogs, natural sentence realizers, and pedagogical naturalness feedback while preserving the existing three-mode application.

**Architecture:** Japanese concepts, scenarios, particles, verbs, and time options live in `src/content/` without source-language strings. Typed IT/EN catalogs provide clean control labels, role-specific realizations, UI messages, and predicate forms; pure locale realizers create complete natural sentences. Existing React screens consume a single locale context and a tested Lab view model rather than concatenating translated fragments.

**Tech Stack:** React 18, TypeScript strict, Vitest 3, existing Vite 6 build, Web Speech API, localStorage.

---

## Outcome and sequencing

This is plan **1 of 3** for v2.1. Implement it on top of commit `8131bc9` on branch `unsafecode-sentence-lab-v2`.

At the end:

- all existing modes remain available;
- IT/EN is selectable globally;
- the optional reference translation works in Lab and Phrasebook;
- all current user-visible copy is localized;
- Lab option labels are clean nouns, not sentence fragments;
- sentence realizations are natural and tested in both languages;
- incompatible time/form combinations are explained;
- no course routing or progress UI exists yet (plan 2).

## File structure

```text
src/
  content/
    types.ts                   # locale-free concepts/scenarios/times
    concepts.ts                # canonical Japanese vocabulary
    scenarios.ts               # 12 locale-free scenarios
    times.ts                   # time options
    selection.ts               # strict semantic selection resolver
    validate.ts                # core reference validation
    validate.test.ts
  i18n/
    types.ts                   # LocalePack, messages, predicate forms
    it.ts                      # complete Italian catalog
    en.ts                      # complete English catalog
    catalog.ts                 # locale lookup
    validate.ts                # locale completeness validation
    validate.test.ts
    LocaleContext.tsx          # primary language + reference translation
    LocaleContext.test.ts      # pure normalization tests
  settings/
    storage.ts                 # safe localStorage adapter
    storage.test.ts
  lab/
    engine/
      naturalness.ts
      naturalness.test.ts
      realize.ts
      realize.test.ts
      japanese.ts              # reusable JP parts/sentence model
      japanese.test.ts
      assemble.ts              # MODIFY: keep JP assembler; remove IT assembler
      assemble.test.ts         # MODIFY: JP tests only
    components/
      labData.ts               # MODIFY: forms from locale catalog
      viewModel.ts             # new pure adapter for UI
      viewModel.test.ts
      Board.tsx                # MODIFY
      ControlPanel.tsx         # MODIFY
      TeachNote.tsx            # MODIFY
      Lab.tsx                  # MODIFY
    data/
      types.ts                 # DELETE after migration
      scenarios.ts             # DELETE after migration
      scenarios.test.ts        # REPLACE with content validation tests
    lab.css                    # MODIFY: naturalness/reference styles
  data/
    phrases.ts                 # MODIFY: IDs + IT/EN translations
    phrases.test.ts            # NEW: bilingual completeness
  syllabary/
    kana.ts                    # MODIFY: localized intro/notes
    Syllabary.tsx              # MODIFY
  components/
    Header.tsx                 # MODIFY: locale/reference controls
    Phrasebook.tsx             # MODIFY
    PhraseCard.tsx             # MODIFY
    CategoryNav.tsx            # MODIFY
    SpeechNotice.tsx           # MODIFY
  App.tsx                      # MODIFY: LocaleProvider + localized footer
  styles.css                   # MODIFY: locale controls/reference text
```

---

### Task 1: Safe persisted settings and locale context

**Files:**
- Create: `src/settings/storage.ts`
- Create: `src/settings/storage.test.ts`
- Create: `src/i18n/LocaleContext.tsx`
- Create: `src/i18n/LocaleContext.test.ts`
- Modify: `src/settings/ScriptContext.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing tests for safe storage and locale normalization**

Create `src/settings/storage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readSetting, removeSetting, writeSetting } from "./storage";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

function blockedStorage(): Storage {
  const blocked = (): never => {
    throw new Error("blocked");
  };
  return {
    get length() { return 0; },
    clear: blocked,
    getItem: blocked,
    key: blocked,
    removeItem: blocked,
    setItem: blocked,
  };
}

describe("settings storage", () => {
  it("reads and writes a setting", () => {
    const storage = memoryStorage();
    expect(writeSetting(storage, "x", "it")).toBe(true);
    expect(readSetting(storage, "x")).toEqual({ value: "it", available: true });
    expect(removeSetting(storage, "x")).toBe(true);
    expect(readSetting(storage, "x")).toEqual({ value: null, available: true });
  });

  it("reports unavailable storage without throwing", () => {
    const broken = blockedStorage();
    expect(readSetting(broken, "x")).toEqual({ value: null, available: false });
    expect(writeSetting(broken, "x", "it")).toBe(false);
    expect(removeSetting(broken, "x")).toBe(false);
  });
});
```

Create `src/i18n/LocaleContext.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeLocale, normalizeReference } from "./LocaleContext";

describe("locale settings", () => {
  it("defaults to Italian", () => {
    expect(normalizeLocale(null)).toBe("it");
    expect(normalizeLocale("fr")).toBe("it");
  });

  it("accepts English", () => {
    expect(normalizeLocale("en")).toBe("en");
  });

  it("normalizes the reference toggle", () => {
    expect(normalizeReference("true")).toBe(true);
    expect(normalizeReference("false")).toBe(false);
    expect(normalizeReference(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
npx vitest run src/settings/storage.test.ts src/i18n/LocaleContext.test.ts
```

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement the storage adapter**

Create `src/settings/storage.ts`:

```ts
export interface StoredValue {
  value: string | null;
  available: boolean;
}

export function readSetting(storage: Storage | null, key: string): StoredValue {
  if (!storage) return { value: null, available: false };
  try {
    return { value: storage.getItem(key), available: true };
  } catch {
    return { value: null, available: false };
  }
}

export function writeSetting(
  storage: Storage | null,
  key: string,
  value: string,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeSetting(storage: Storage | null, key: string): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Implement the locale context**

Create `src/i18n/LocaleContext.tsx`:

```tsx
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
  const storage = browserStorage();
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
```

Use a stable `storage` value in the provider so effects do not rerun because of identity changes:

```tsx
const storage = useMemo(() => browserStorage(), []);
```

Replace the non-memoized declaration in the code above with this line.

- [ ] **Step 5: Migrate ScriptContext to the shared adapter**

Replace direct `localStorage` access in `src/settings/ScriptContext.tsx`:

```tsx
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
```

- [ ] **Step 6: Install LocaleProvider before any localized consumer**

Replace `src/App.tsx` with:

```tsx
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
```

This early provider wiring is required because the Lab and Phrasebook start
consuming `useLocale()` in Tasks 6 and 7; no intermediate commit may render those
components outside the provider.

- [ ] **Step 7: Run tests, typecheck, and build**

Run:

```bash
npx vitest run src/settings/storage.test.ts src/i18n/LocaleContext.test.ts src/settings/script.test.ts
npx tsc --noEmit
npm run build
```

Expected: all tests pass, TypeScript reports no errors, and the existing v2 UI
still builds with the new provider.

- [ ] **Step 8: Commit**

```bash
git add src/settings src/i18n/LocaleContext.tsx src/i18n/LocaleContext.test.ts src/App.tsx
git commit -m "feat(i18n): add persisted locale settings"
```

---

### Task 2: Locale-free Japanese content core

**Files:**
- Create: `src/content/types.ts`
- Create: `src/content/concepts.ts`
- Create: `src/content/times.ts`
- Create: `src/content/scenarios.ts`
- Create: `src/content/validate.ts`
- Create: `src/content/validate.test.ts`

- [ ] **Step 1: Write the failing core validation tests**

Create `src/content/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { concepts } from "./concepts";
import { scenarios } from "./scenarios";
import { times } from "./times";
import { validateContent } from "./validate";

describe("semantic content", () => {
  it("contains all 31 concepts, 12 scenarios, and six time options", () => {
    expect(Object.keys(concepts)).toHaveLength(31);
    expect(scenarios).toHaveLength(12);
    expect(times).toHaveLength(6);
  });

  it("has unique IDs and valid concept references", () => {
    expect(validateContent({ concepts, scenarios, times })).toEqual([]);
  });

  it("models boarding separately from a destination", () => {
    const board = scenarios.find((scenario) => scenario.id === "board");
    expect(board?.slots[0]).toMatchObject({
      semanticRole: "vehicleBoarded",
      particle: { jp: "に", romaji: "ni" },
    });
  });

  it("preserves the v2 defaults while allowing optional slots to be cleared", () => {
    const eating = scenarios.find((scenario) => scenario.id === "eat");
    const going = scenarios.find((scenario) => scenario.id === "go");
    expect(eating?.slots.find((slot) => slot.id === "place")).toMatchObject({
      optional: true,
      defaultOptionId: "restaurant",
    });
    expect(going?.slots.find((slot) => slot.id === "transport")).toMatchObject({
      optional: true,
      defaultOptionId: "train",
    });
  });

  it("keeps かえる as godan", () => {
    const returning = scenarios.find((scenario) => scenario.id === "return");
    expect(returning?.verb).toMatchObject({
      dict: "かえる",
      group: "godan",
      stemRomaji: "kaeri",
    });
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npx vitest run src/content/validate.test.ts
```

Expected: FAIL because the content modules do not exist.

- [ ] **Step 3: Create the core types**

Create `src/content/types.ts`:

```ts
import type { Form, Verb } from "../lab/engine/conjugate";

export type ConceptId =
  | "ramen" | "sushi" | "onigiri" | "water" | "beer" | "tea"
  | "ticket" | "souvenir" | "movie" | "map" | "menu"
  | "restaurant" | "home" | "bar" | "shop" | "station"
  | "hotel" | "airport" | "japan" | "party"
  | "train" | "bus" | "taxi"
  | "friend" | "teacher" | "family"
  | "reservation" | "shopping" | "phoneCall"
  | "japaneseLanguage" | "englishLanguage";

export type ScenarioId =
  | "eat" | "drink" | "buy" | "watch" | "go" | "return"
  | "board" | "wait" | "meet" | "do" | "come" | "speak";

export type SemanticRole =
  | "object"
  | "actionPlace"
  | "destination"
  | "transport"
  | "personTarget"
  | "vehicleBoarded";

export type TimeId =
  | "today"
  | "yesterday"
  | "tomorrow"
  | "tonight"
  | "everyDay"
  | "none";

export interface JapaneseConcept {
  id: ConceptId;
  jp: string;
  romaji: string;
}

export interface ScenarioSlot {
  id: string;
  semanticRole: SemanticRole;
  particle: { jp: string; romaji: string };
  optionIds: ConceptId[];
  defaultOptionId: ConceptId | null;
  optional: boolean;
}

export interface Scenario {
  id: ScenarioId;
  emoji: string;
  verb: Verb;
  slots: ScenarioSlot[];
}

export interface TimeOption {
  id: TimeId;
  jp: string;
  romaji: string;
}

export interface LabSelection {
  scenarioId: ScenarioId;
  form: Form;
  timeId: TimeId;
  options: Record<string, ConceptId | null>;
}
```

- [ ] **Step 4: Create the canonical concept table**

Create `src/content/concepts.ts`:

```ts
import type { ConceptId, JapaneseConcept } from "./types";

const rows: Array<[ConceptId, string, string]> = [
  ["ramen", "らーめん", "rāmen"],
  ["sushi", "すし", "sushi"],
  ["onigiri", "おにぎり", "onigiri"],
  ["water", "みず", "mizu"],
  ["beer", "びーる", "bīru"],
  ["tea", "おちゃ", "ocha"],
  ["ticket", "きっぷ", "kippu"],
  ["souvenir", "おみやげ", "omiyage"],
  ["movie", "えいが", "eiga"],
  ["map", "ちず", "chizu"],
  ["menu", "めにゅー", "menyū"],
  ["restaurant", "れすとらん", "resutoran"],
  ["home", "いえ", "ie"],
  ["bar", "ばー", "bā"],
  ["shop", "みせ", "mise"],
  ["station", "えき", "eki"],
  ["hotel", "ほてる", "hoteru"],
  ["airport", "くうこう", "kūkō"],
  ["japan", "にほん", "nihon"],
  ["party", "ぱーてぃー", "pātī"],
  ["train", "でんしゃ", "densha"],
  ["bus", "ばす", "basu"],
  ["taxi", "たくしー", "takushī"],
  ["friend", "ともだち", "tomodachi"],
  ["teacher", "せんせい", "sensei"],
  ["family", "かぞく", "kazoku"],
  ["reservation", "よやく", "yoyaku"],
  ["shopping", "かいもの", "kaimono"],
  ["phoneCall", "でんわ", "denwa"],
  ["japaneseLanguage", "にほんご", "nihongo"],
  ["englishLanguage", "えいご", "eigo"],
];

export const concepts = Object.fromEntries(
  rows.map(([id, jp, romaji]) => [id, { id, jp, romaji }]),
) as Record<ConceptId, JapaneseConcept>;
```

- [ ] **Step 5: Create times and the 12 scenarios**

Create `src/content/times.ts`:

```ts
import type { TimeOption } from "./types";

export const times: TimeOption[] = [
  { id: "today", jp: "きょう", romaji: "kyō" },
  { id: "yesterday", jp: "きのう", romaji: "kinō" },
  { id: "tomorrow", jp: "あした", romaji: "ashita" },
  { id: "tonight", jp: "こんばん", romaji: "konban" },
  { id: "everyDay", jp: "まいにち", romaji: "mainichi" },
  { id: "none", jp: "", romaji: "" },
];
```

Create `src/content/scenarios.ts`. Use these exact records:

```ts
import type { ConceptId, Scenario, ScenarioSlot, SemanticRole } from "./types";

const particle = {
  o: { jp: "を", romaji: "o" },
  ni: { jp: "に", romaji: "ni" },
  de: { jp: "で", romaji: "de" },
} as const;

function slot(
  id: string,
  semanticRole: SemanticRole,
  particleValue: { jp: string; romaji: string },
  optionIds: ConceptId[],
  defaultOptionId: ConceptId | null = optionIds[0] ?? null,
  optional = false,
): ScenarioSlot {
  return { id, semanticRole, particle: particleValue, optionIds, defaultOptionId, optional };
}

export const scenarios: Scenario[] = [
  {
    id: "eat", emoji: "🍜",
    verb: { dict: "たべる", group: "ichidan", stemRomaji: "tabe" },
    slots: [
      slot("object", "object", particle.o, ["ramen", "sushi", "onigiri"]),
      slot("place", "actionPlace", particle.de, ["restaurant", "home"], "restaurant", true),
    ],
  },
  {
    id: "drink", emoji: "🍺",
    verb: { dict: "のむ", group: "godan", stemRomaji: "nomi" },
    slots: [
      slot("object", "object", particle.o, ["water", "beer", "tea"]),
      slot("place", "actionPlace", particle.de, ["bar", "home"], "bar", true),
    ],
  },
  {
    id: "buy", emoji: "🛍️",
    verb: { dict: "かう", group: "godan", stemRomaji: "kai" },
    slots: [
      slot("object", "object", particle.o, ["ticket", "souvenir", "water"]),
      slot("place", "actionPlace", particle.de, ["shop", "station"], "shop", true),
    ],
  },
  {
    id: "watch", emoji: "👀",
    verb: { dict: "みる", group: "ichidan", stemRomaji: "mi" },
    slots: [slot("object", "object", particle.o, ["movie", "map", "menu"])],
  },
  {
    id: "go", emoji: "🚉",
    verb: { dict: "いく", group: "godan", stemRomaji: "iki" },
    slots: [
      slot("destination", "destination", particle.ni, ["station", "hotel", "airport"]),
      slot("transport", "transport", particle.de, ["train", "bus", "taxi"], "train", true),
    ],
  },
  {
    id: "return", emoji: "🏠",
    verb: { dict: "かえる", group: "godan", stemRomaji: "kaeri" },
    slots: [slot("destination", "destination", particle.ni, ["home", "hotel", "japan"])],
  },
  {
    id: "board", emoji: "🚌",
    verb: { dict: "のる", group: "godan", stemRomaji: "nori" },
    slots: [slot("vehicle", "vehicleBoarded", particle.ni, ["train", "bus", "taxi"])],
  },
  {
    id: "wait", emoji: "⏳",
    verb: { dict: "まつ", group: "godan", stemRomaji: "machi" },
    slots: [slot("target", "object", particle.o, ["friend", "bus", "taxi"])],
  },
  {
    id: "meet", emoji: "🤝",
    verb: { dict: "あう", group: "godan", stemRomaji: "ai" },
    slots: [slot("person", "personTarget", particle.ni, ["friend", "teacher", "family"])],
  },
  {
    id: "do", emoji: "📞",
    verb: { dict: "する", group: "irregular", stemRomaji: "shi" },
    slots: [slot("activity", "object", particle.o, ["reservation", "shopping", "phoneCall"])],
  },
  {
    id: "come", emoji: "🎉",
    verb: { dict: "くる", group: "irregular", stemRomaji: "ki" },
    slots: [slot("destination", "destination", particle.ni, ["japan", "shop", "party"])],
  },
  {
    id: "speak", emoji: "💬",
    verb: { dict: "はなす", group: "godan", stemRomaji: "hanashi" },
    slots: [slot("language", "object", particle.o, ["japaneseLanguage", "englishLanguage"])],
  },
];
```

- [ ] **Step 6: Implement deterministic reference validation**

Create `src/content/validate.ts`:

```ts
import type {
  ConceptId,
  JapaneseConcept,
  Scenario,
  TimeOption,
} from "./types";

interface Content {
  concepts: Record<ConceptId, JapaneseConcept>;
  scenarios: Scenario[];
  times: TimeOption[];
}

export function validateContent(content: Content): string[] {
  const errors: string[] = [];
  const scenarioIds = new Set<string>();
  const timeIds = new Set<string>();

  for (const scenario of content.scenarios) {
    if (scenarioIds.has(scenario.id)) errors.push(`duplicate scenario:${scenario.id}`);
    scenarioIds.add(scenario.id);
    const slotIds = new Set<string>();
    for (const slot of scenario.slots) {
      if (slotIds.has(slot.id)) errors.push(`duplicate slot:${scenario.id}:${slot.id}`);
      slotIds.add(slot.id);
      if (!slot.optional && slot.defaultOptionId === null) {
        errors.push(`required default missing:${scenario.id}:${slot.id}`);
      }
      for (const conceptId of slot.optionIds) {
        if (!content.concepts[conceptId]) {
          errors.push(`unknown concept:${scenario.id}:${slot.id}:${conceptId}`);
        }
      }
      if (
        slot.defaultOptionId !== null &&
        !slot.optionIds.includes(slot.defaultOptionId)
      ) {
        errors.push(`invalid default:${scenario.id}:${slot.id}`);
      }
    }
  }

  for (const time of content.times) {
    if (timeIds.has(time.id)) errors.push(`duplicate time:${time.id}`);
    timeIds.add(time.id);
  }

  return errors;
}
```

- [ ] **Step 7: Run tests, then commit**

Run:

```bash
npx vitest run src/content/validate.test.ts src/lab/engine/conjugate.test.ts
npx tsc --noEmit
```

Expected: PASS, including the existing かえる conjugation test.

Commit:

```bash
git add src/content
git commit -m "feat(content): add locale-free Japanese core"
```

---

### Task 3: Typed IT/EN catalogs and completeness validation

**Files:**
- Create: `src/i18n/types.ts`
- Create: `src/i18n/it.ts`
- Create: `src/i18n/en.ts`
- Create: `src/i18n/catalog.ts`
- Create: `src/i18n/validate.ts`
- Create: `src/i18n/validate.test.ts`

- [ ] **Step 1: Write failing catalog validation tests**

Create `src/i18n/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { concepts } from "../content/concepts";
import { scenarios } from "../content/scenarios";
import { it as itCopy } from "./it";
import { en as enCopy } from "./en";
import { validateLocalePack } from "./validate";

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

describe.each([itCopy, enCopy])("locale $locale", (pack) => {
  it("covers all concepts, scenarios, forms and times", () => {
    expect(validateLocalePack(pack, concepts, scenarios)).toEqual([]);
  });

  it("contains no blank visible copy", () => {
    const visibleCopy = collectStrings({
      ui: pack.ui,
      forms: pack.forms,
      times: Object.fromEntries(
        Object.entries(pack.times).filter(([id]) => id !== "none"),
      ),
      concepts: pack.concepts,
      scenarios: pack.scenarios,
    });
    expect(visibleCopy.length).toBeGreaterThan(0);
    expect(visibleCopy.every((value) => value.trim().length > 0)).toBe(true);
  });
});

it("uses clean display labels instead of sentence fragments", () => {
  expect(itCopy.concepts.restaurant.label).toBe("ristorante");
  expect(itCopy.concepts.restaurant.realizations.actionPlace).toBe("al ristorante");
  expect(enCopy.concepts.restaurant.label).toBe("restaurant");
  expect(enCopy.concepts.restaurant.realizations.actionPlace).toBe("at the restaurant");
});

it("uses practical form labels first", () => {
  expect(
    Object.fromEntries(
      Object.entries(itCopy.forms).map(([id, copy]) => [id, copy.label]),
    ),
  ).toEqual({
    pres: "Ora / abitudine / futuro",
    past: "È successo",
    neg: "Non succede / non succederà",
    pastneg: "Non è successo",
    vol: "Facciamo…?",
    des: "Voglio…",
  });
  expect(itCopy.forms.pres.grammar).toBe(
    "non-passato affermativo · 〜ます",
  );
  expect(itCopy.scenarios.wait.slots.target).toEqual({
    prompt: "Chi o che cosa?",
    grammar: "oggetto diretto",
  });
  expect(enCopy.forms.vol.label).toBe("Shall we…?");
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```bash
npx vitest run src/i18n/validate.test.ts
```

Expected: FAIL because locale modules do not exist.

- [ ] **Step 3: Define locale types**

Create `src/i18n/types.ts`:

```ts
import type {
  ConceptId,
  ScenarioId,
  SemanticRole,
  TimeId,
} from "../content/types";
import type { Form } from "../lab/engine/conjugate";
import type { Locale } from "./LocaleContext";

export interface PredicateForms {
  current: string;
  habitual: string;
  future: string;
  past: string;
  currentNegative: string;
  habitualNegative: string;
  futureNegative: string;
  pastNegative: string;
  suggestion: string;
  desire: string;
}

export interface LocalizedConcept {
  label: string;
  realizations: Partial<Record<SemanticRole, string>>;
}

export interface SlotCopy {
  prompt: string;
  grammar: string;
}

export interface ScenarioCopy {
  title: string;
  slots: Record<string, SlotCopy>;
  predicate: PredicateForms;
  predicateByOption?: Partial<Record<ConceptId, PredicateForms>>;
}

export interface UiMessages {
  documentTitle: string;
  brand: {
    title: string;
    subtitle: string;
  };
  nav: {
    modes: string;
    syllabary: string;
    phrasebook: string;
    laboratory: string;
  };
  settings: {
    language: string;
    writing: string;
    reference: string;
    unavailable: string;
  };
  common: {
    listen: string;
    slow: string;
    playing: string;
    none: string;
    optional: string;
    phrases: string;
  };
  lab: {
    scenario: string;
    board: string;
    verb: string;
    verbForm: string;
    when: string;
    rule: string;
    base: string;
    ending: string;
    particles: string;
    endings: string;
    natural: string;
    contextual: string;
    incompatible: string;
  };
  speech: {
    unsupported: string;
    missingVoice: string;
    failed: string;
  };
  syllabary: {
    title: string;
    base: string;
    voiced: string;
    combinations: string;
    notes: string;
  };
  phrasebook: {
    categoriesLabel: string;
  };
  footer: string;
}

export interface LocalePack {
  locale: Locale;
  ui: UiMessages;
  forms: Record<Form, { label: string; grammar: string }>;
  times: Record<TimeId, string>;
  concepts: Record<ConceptId, LocalizedConcept>;
  scenarios: Record<ScenarioId, ScenarioCopy>;
}
```

- [ ] **Step 4: Create the complete Italian and English concept catalogs**

In `src/i18n/it.ts` and `src/i18n/en.ts`, create `concepts` with this complete table. The first localized value is the clean label; subsequent values are role realizations.

Start both files with:

```ts
import type { LocalePack, PredicateForms } from "./types";
```

Name the typed maps in each file `concepts`, `scenarios`, `forms`, `times`, and
`ui`, using `LocalePack["concepts"]` (and the corresponding indexed type) so
missing keys fail during type-checking.

| Concept | IT label | IT realizations | EN label | EN realizations |
|---|---|---|---|---|
| ramen | ramen | object=`il ramen` | ramen | object=`ramen` |
| sushi | sushi | object=`il sushi` | sushi | object=`sushi` |
| onigiri | onigiri | object=`l'onigiri` | onigiri | object=`an onigiri` |
| water | acqua | object=`dell'acqua` | water | object=`water` |
| beer | birra | object=`la birra` | beer | object=`beer` |
| tea | tè | object=`il tè` | tea | object=`tea` |
| ticket | biglietto | object=`un biglietto` | ticket | object=`a ticket` |
| souvenir | souvenir | object=`un souvenir` | souvenir | object=`a souvenir` |
| movie | film | object=`un film` | movie | object=`a movie` |
| map | mappa | object=`la mappa` | map | object=`the map` |
| menu | menù | object=`il menù` | menu | object=`the menu` |
| restaurant | ristorante | actionPlace=`al ristorante` | restaurant | actionPlace=`at the restaurant` |
| home | casa | actionPlace=`a casa`, destination=`a casa` | home | actionPlace=`at home`, destination=`home` |
| bar | bar | actionPlace=`al bar` | bar | actionPlace=`at the bar` |
| shop | negozio | actionPlace=`al negozio`, destination=`al negozio` | shop | actionPlace=`at the shop`, destination=`to the shop` |
| station | stazione | actionPlace=`in stazione`, destination=`alla stazione` | station | actionPlace=`at the station`, destination=`to the station` |
| hotel | hotel | destination=`in hotel` | hotel | destination=`to the hotel` |
| airport | aeroporto | destination=`all'aeroporto` | airport | destination=`to the airport` |
| japan | Giappone | destination=`in Giappone` | Japan | destination=`to Japan` |
| party | festa | destination=`alla festa` | party | destination=`to the party` |
| train | treno | transport=`in treno`, vehicleBoarded=`il treno`, object=`il treno` | train | transport=`by train`, vehicleBoarded=`the train`, object=`the train` |
| bus | autobus | transport=`in autobus`, vehicleBoarded=`l'autobus`, object=`l'autobus` | bus | transport=`by bus`, vehicleBoarded=`the bus`, object=`the bus` |
| taxi | taxi | transport=`in taxi`, vehicleBoarded=`il taxi`, object=`il taxi` | taxi | transport=`by taxi`, vehicleBoarded=`a taxi`, object=`a taxi` |
| friend | amico | object=`un amico`, personTarget=`un amico` | friend | object=`a friend`, personTarget=`a friend` |
| teacher | insegnante | personTarget=`l'insegnante` | teacher | personTarget=`the teacher` |
| family | famiglia | personTarget=`la mia famiglia` | family | personTarget=`my family` |
| reservation | prenotazione | object=`una prenotazione` | reservation | object=`a reservation` |
| shopping | acquisti | object=`acquisti` | shopping | object=`some shopping` |
| phoneCall | telefonata | object=`una telefonata` | phone call | object=`a phone call` |
| japaneseLanguage | giapponese | object=`giapponese` | Japanese | object=`Japanese` |
| englishLanguage | inglese | object=`inglese` | English | object=`English` |

Represent every row exactly like:

```ts
restaurant: {
  label: "ristorante",
  realizations: { actionPlace: "al ristorante" },
},
```

and:

```ts
restaurant: {
  label: "restaurant",
  realizations: { actionPlace: "at the restaurant" },
},
```

- [ ] **Step 5: Add complete scenario copy and predicate forms**

Use this exact scenario metadata in `it.ts`:

| ID | Title | Slot prompts |
|---|---|---|
| eat | Mangiare qualcosa | object=`Che cosa? / oggetto diretto`; place=`Dove avviene? / luogo dell'azione` |
| drink | Bere qualcosa | object=`Che cosa? / oggetto diretto`; place=`Dove avviene? / luogo dell'azione` |
| buy | Comprare qualcosa | object=`Che cosa? / oggetto diretto`; place=`Dove avviene? / luogo dell'azione` |
| watch | Guardare o consultare | object=`Che cosa? / oggetto diretto` |
| go | Andare in un luogo | destination=`Verso dove? / destinazione`; transport=`Con quale mezzo? / mezzo di trasporto` |
| return | Tornare | destination=`Verso dove? / destinazione` |
| board | Salire su un mezzo | vehicle=`Su quale mezzo? / mezzo su cui si sale` |
| wait | Aspettare qualcuno o qualcosa | target=`Chi o che cosa? / oggetto diretto` |
| meet | Incontrare qualcuno | person=`Chi incontri? / persona incontrata` |
| do | Fare un'attività | activity=`Quale attività? / oggetto diretto` |
| come | Venire in un luogo | destination=`Verso dove? / destinazione` |
| speak | Parlare una lingua | language=`Quale lingua? / oggetto diretto` |

Use these English titles/prompts:

| ID | Title | Slot prompts |
|---|---|---|
| eat | Eat something | object=`What? / direct object`; place=`Where does it happen? / place of action` |
| drink | Drink something | object=`What? / direct object`; place=`Where does it happen? / place of action` |
| buy | Buy something | object=`What? / direct object`; place=`Where does it happen? / place of action` |
| watch | Watch or look at something | object=`What? / direct object` |
| go | Go somewhere | destination=`Where to? / destination`; transport=`How? / means of transport` |
| return | Go back | destination=`Where to? / destination` |
| board | Board a vehicle | vehicle=`Which vehicle? / vehicle being boarded` |
| wait | Wait for someone or something | target=`Who or what? / direct object` |
| meet | Meet someone | person=`Who? / person met` |
| do | Do an activity | activity=`Which activity? / direct object` |
| come | Come somewhere | destination=`Where to? / destination` |
| speak | Speak a language | language=`Which language? / direct object` |

Create a helper at the top of each locale file:

```ts
const p = (
  current: string,
  habitual: string,
  future: string,
  past: string,
  currentNegative: string,
  habitualNegative: string,
  futureNegative: string,
  pastNegative: string,
  suggestion: string,
  desire: string,
): PredicateForms => ({
  current, habitual, future, past,
  currentNegative, habitualNegative, futureNegative, pastNegative,
  suggestion, desire,
});
```

Use these exact Italian predicate rows:

```ts
eat: p("mangio", "mangio", "mangerò", "ho mangiato", "non mangio", "non mangio", "non mangerò", "non ho mangiato", "mangiamo", "voglio mangiare"),
drink: p("bevo", "bevo", "berrò", "ho bevuto", "non bevo", "non bevo", "non berrò", "non ho bevuto", "beviamo", "voglio bere"),
buy: p("compro", "compro", "comprerò", "ho comprato", "non compro", "non compro", "non comprerò", "non ho comprato", "compriamo", "voglio comprare"),
watch: p("guardo", "guardo", "guarderò", "ho guardato", "non guardo", "non guardo", "non guarderò", "non ho guardato", "guardiamo", "voglio guardare"),
go: p("vado", "vado", "andrò", "sono andato/a", "non vado", "non vado", "non andrò", "non sono andato/a", "andiamo", "voglio andare"),
return: p("torno", "torno", "tornerò", "sono tornato/a", "non torno", "non torno", "non tornerò", "non sono tornato/a", "torniamo", "voglio tornare"),
board: p("prendo", "prendo", "prenderò", "ho preso", "non prendo", "non prendo", "non prenderò", "non ho preso", "prendiamo", "voglio prendere"),
wait: p("aspetto", "aspetto", "aspetterò", "ho aspettato", "non aspetto", "non aspetto", "non aspetterò", "non ho aspettato", "aspettiamo", "voglio aspettare"),
meet: p("incontro", "incontro", "incontrerò", "ho incontrato", "non incontro", "non incontro", "non incontrerò", "non ho incontrato", "incontriamo", "voglio incontrare"),
come: p("vengo", "vengo", "verrò", "sono venuto/a", "non vengo", "non vengo", "non verrò", "non sono venuto/a", "veniamo", "voglio venire"),
speak: p("parlo", "parlo", "parlerò", "ho parlato", "non parlo", "non parlo", "non parlerò", "non ho parlato", "parliamo", "voglio parlare"),
```

For Italian `watch`, use natural collocations for map and menu:

```ts
predicateByOption: {
  map: p("consulto", "consulto", "consulterò", "ho consultato", "non consulto", "non consulto", "non consulterò", "non ho consultato", "consultiamo", "voglio consultare"),
  menu: p("consulto", "consulto", "consulterò", "ho consultato", "non consulto", "non consulto", "non consulterò", "non ho consultato", "consultiamo", "voglio consultare"),
},
```

For `do`, use option-specific predicates so every collocation is natural:

```ts
predicate: p("faccio", "faccio", "farò", "ho fatto", "non faccio", "non faccio", "non farò", "non ho fatto", "facciamo", "voglio fare"),
predicateByOption: {
  reservation: p("faccio", "faccio", "farò", "ho fatto", "non faccio", "non faccio", "non farò", "non ho fatto", "facciamo", "voglio fare"),
  shopping: p("faccio", "faccio", "farò", "ho fatto", "non faccio", "non faccio", "non farò", "non ho fatto", "facciamo", "voglio fare"),
  phoneCall: p("faccio", "faccio", "farò", "ho fatto", "non faccio", "non faccio", "non farò", "non ho fatto", "facciamo", "voglio fare"),
},
```

Use these exact English predicate rows:

```ts
eat: p("I'm eating", "I eat", "I'll eat", "I ate", "I'm not eating", "I don't eat", "I won't eat", "I didn't eat", "let's eat", "I want to eat"),
drink: p("I'm drinking", "I drink", "I'll drink", "I drank", "I'm not drinking", "I don't drink", "I won't drink", "I didn't drink", "let's drink", "I want to drink"),
buy: p("I'm buying", "I buy", "I'll buy", "I bought", "I'm not buying", "I don't buy", "I won't buy", "I didn't buy", "let's buy", "I want to buy"),
watch: p("I'm looking at", "I look at", "I'll look at", "I looked at", "I'm not looking at", "I don't look at", "I won't look at", "I didn't look at", "let's look at", "I want to look at"),
go: p("I'm going", "I go", "I'll go", "I went", "I'm not going", "I don't go", "I won't go", "I didn't go", "let's go", "I want to go"),
return: p("I'm going back", "I go back", "I'll go back", "I went back", "I'm not going back", "I don't go back", "I won't go back", "I didn't go back", "let's go back", "I want to go back"),
board: p("I'm taking", "I take", "I'll take", "I took", "I'm not taking", "I don't take", "I won't take", "I didn't take", "let's take", "I want to take"),
wait: p("I'm waiting for", "I wait for", "I'll wait for", "I waited for", "I'm not waiting for", "I don't wait for", "I won't wait for", "I didn't wait for", "let's wait for", "I want to wait for"),
meet: p("I'm meeting", "I meet", "I'll meet", "I met", "I'm not meeting", "I don't meet", "I won't meet", "I didn't meet", "let's meet", "I want to meet"),
come: p("I'm coming", "I come", "I'll come", "I came", "I'm not coming", "I don't come", "I won't come", "I didn't come", "let's come", "I want to come"),
speak: p("I'm speaking", "I speak", "I'll speak", "I spoke", "I'm not speaking", "I don't speak", "I won't speak", "I didn't speak", "let's speak", "I want to speak"),
```

For English `watch`, override `movie` with `watch` forms:

```ts
predicateByOption: {
  movie: p("I'm watching", "I watch", "I'll watch", "I watched", "I'm not watching", "I don't watch", "I won't watch", "I didn't watch", "let's watch", "I want to watch"),
},
```

For English `do`, use:

```ts
predicate: p("I'm doing", "I do", "I'll do", "I did", "I'm not doing", "I don't do", "I won't do", "I didn't do", "let's do", "I want to do"),
predicateByOption: {
  reservation: p("I'm making", "I make", "I'll make", "I made", "I'm not making", "I don't make", "I won't make", "I didn't make", "let's make", "I want to make"),
  shopping: p("I'm doing", "I do", "I'll do", "I did", "I'm not doing", "I don't do", "I won't do", "I didn't do", "let's do", "I want to do"),
  phoneCall: p("I'm making", "I make", "I'll make", "I made", "I'm not making", "I don't make", "I won't make", "I didn't make", "let's make", "I want to make"),
},
```

- [ ] **Step 6: Add form, time and UI message catalogs**

Use these complete form maps:

```ts
// it
{
  pres: {
    label: "Ora / abitudine / futuro",
    grammar: "non-passato affermativo · 〜ます",
  },
  past: {
    label: "È successo",
    grammar: "passato affermativo · 〜ました",
  },
  neg: {
    label: "Non succede / non succederà",
    grammar: "non-passato negativo · 〜ません",
  },
  pastneg: {
    label: "Non è successo",
    grammar: "passato negativo · 〜ませんでした",
  },
  vol: {
    label: "Facciamo…?",
    grammar: "proposta / invito · 〜ましょう",
  },
  des: {
    label: "Voglio…",
    grammar: "desiderio · 〜たいです",
  },
}
```

```ts
// en
{
  pres: {
    label: "Now / habit / future",
    grammar: "non-past affirmative · 〜ます",
  },
  past: {
    label: "It happened",
    grammar: "past affirmative · 〜ました",
  },
  neg: {
    label: "It doesn't / won't happen",
    grammar: "non-past negative · 〜ません",
  },
  pastneg: {
    label: "It didn't happen",
    grammar: "past negative · 〜ませんでした",
  },
  vol: {
    label: "Shall we…?",
    grammar: "suggestion / invitation · 〜ましょう",
  },
  des: {
    label: "I want to…",
    grammar: "desire · 〜たいです",
  },
}
```

Use these times:

```ts
// it
{ today: "oggi", yesterday: "ieri", tomorrow: "domani", tonight: "stasera", everyDay: "ogni giorno", none: "" }

// en
{ today: "today", yesterday: "yesterday", tomorrow: "tomorrow", tonight: "tonight", everyDay: "every day", none: "" }
```

Populate every `UiMessages` field. Use these exact values:

```ts
// it
{
  documentTitle: "Hanasō · Impara il giapponese",
  brand: {
    title: "Giapponese pratico",
    subtitle: "Parlato · costruzione delle frasi · hiragana prima di tutto",
  },
  nav: {
    modes: "Modalità di studio",
    syllabary: "Sillabario",
    phrasebook: "Frasario",
    laboratory: "Laboratorio",
  },
  settings: {
    language: "Lingua",
    writing: "Scrittura",
    reference: "Mostra l'inglese di riferimento",
    unavailable: "Le preferenze non possono essere salvate in questo browser.",
  },
  common: {
    listen: "Ascolta",
    slow: "Lento",
    playing: "In riproduzione…",
    none: "—",
    optional: "opzionale",
    phrases: "frasi",
  },
  lab: {
    scenario: "Scenario",
    board: "Lavagna",
    verb: "Verbo",
    verbForm: "Che cosa succede al verbo?",
    when: "Quando?",
    rule: "Regola",
    base: "base della forma in ます:",
    ending: "desinenza:",
    particles: "Particelle: mostrano il ruolo delle parole.",
    endings: "Desinenze: mostrano la forma e se la frase è affermativa o negativa.",
    natural: "Combinazione naturale",
    contextual: "Possibile, ma il passato richiede un contesto: per esempio «ogni giorno, durante quel viaggio» oppure, più tardi nella stessa sera, «stasera ho mangiato presto».",
    incompatible: "Questa combinazione non concorda nel modello base. Con ieri scegli una forma passata; con domani una forma non-passata. Desideri e inviti riferiti al passato richiedono costruzioni non ancora incluse.",
  },
  speech: {
    unsupported: "Questo browser non supporta la sintesi vocale.",
    missingVoice: "Non è disponibile una voce giapponese; il testo resta utilizzabile.",
    failed: "Non è stato possibile riprodurre l'audio. Puoi continuare a usare il testo.",
  },
  syllabary: {
    title: "Sillabario · Hiragana",
    base: "Segni e suoni di base",
    voiced: "Dakuten e handakuten",
    combinations: "Combinazioni con ゃ・ゅ・ょ piccoli",
    notes: "Da ricordare",
  },
  phrasebook: { categoriesLabel: "Categorie di frasi" },
  footer: "Fatto per imparare · audio del browser · hiragana prima di tutto",
}
```

```ts
// en
{
  documentTitle: "Hanasō · Learn Japanese",
  brand: {
    title: "Practical Japanese",
    subtitle: "Speaking · sentence building · hiragana first",
  },
  nav: {
    modes: "Study modes",
    syllabary: "Hiragana",
    phrasebook: "Phrasebook",
    laboratory: "Sentence Lab",
  },
  settings: {
    language: "Language",
    writing: "Writing",
    reference: "Show Italian reference",
    unavailable: "Preferences cannot be saved in this browser.",
  },
  common: {
    listen: "Listen",
    slow: "Slow",
    playing: "Playing…",
    none: "—",
    optional: "optional",
    phrases: "phrases",
  },
  lab: {
    scenario: "Scenario",
    board: "Board",
    verb: "Verb",
    verbForm: "What happens to the verb?",
    when: "When?",
    rule: "Rule",
    base: "ます-form base:",
    ending: "ending:",
    particles: "Particles show each word's role.",
    endings: "Endings show the form and whether the sentence is affirmative or negative.",
    natural: "Natural combination",
    contextual: "Possible, but the past needs context: for example, “every day during that trip” or, later the same evening, “tonight I ate early.”",
    incompatible: "This combination does not fit the basic model. With yesterday, choose a past form; with tomorrow, choose a non-past form. Past wishes and invitations require patterns not included yet.",
  },
  speech: {
    unsupported: "This browser does not support speech synthesis.",
    missingVoice: "No Japanese voice is available; all text remains usable.",
    failed: "Audio playback failed. You can continue using the text.",
  },
  syllabary: {
    title: "Hiragana",
    base: "Core signs and sounds",
    voiced: "Dakuten and handakuten",
    combinations: "Combinations with small ゃ・ゅ・ょ",
    notes: "Remember",
  },
  phrasebook: { categoriesLabel: "Phrase categories" },
  footer: "Made for learning · browser audio · hiragana first",
}
```

Finish the Italian file with:

```ts
export const it = {
  locale: "it",
  ui,
  forms,
  times,
  concepts,
  scenarios,
} satisfies LocalePack;
```

Finish the English file with:

```ts
export const en = {
  locale: "en",
  ui,
  forms,
  times,
  concepts,
  scenarios,
} satisfies LocalePack;
```

- [ ] **Step 7: Implement catalog lookup and validation**

Create `src/i18n/catalog.ts`:

```ts
import type { Locale } from "./LocaleContext";
import type { LocalePack } from "./types";
import { it } from "./it";
import { en } from "./en";

export const catalogs: Record<Locale, LocalePack> = { it, en };

export function getCatalog(locale: Locale): LocalePack {
  return catalogs[locale];
}
```

Create `src/i18n/validate.ts`:

```ts
import type { ConceptId, JapaneseConcept, Scenario } from "../content/types";
import type { LocalePack } from "./types";

export function validateLocalePack(
  pack: LocalePack,
  concepts: Record<ConceptId, JapaneseConcept>,
  scenarios: Scenario[],
): string[] {
  const errors: string[] = [];
  for (const conceptId of Object.keys(concepts) as ConceptId[]) {
    if (!pack.concepts[conceptId]) errors.push(`missing concept:${conceptId}`);
  }
  for (const scenario of scenarios) {
    const copy = pack.scenarios[scenario.id];
    if (!copy) {
      errors.push(`missing scenario:${scenario.id}`);
      continue;
    }
    for (const slot of scenario.slots) {
      if (!copy.slots[slot.id]) {
        errors.push(`missing slot copy:${scenario.id}:${slot.id}`);
      }
      for (const conceptId of slot.optionIds) {
        const realization =
          pack.concepts[conceptId]?.realizations[slot.semanticRole];
        if (!realization) {
          errors.push(
            `missing realization:${scenario.id}:${slot.id}:${conceptId}:${slot.semanticRole}`,
          );
        }
      }
    }
  }
  return errors;
}
```

- [ ] **Step 8: Run tests and commit**

Run:

```bash
npx vitest run src/i18n/validate.test.ts
npx tsc --noEmit
```

Expected: all catalog validation tests pass.

Commit:

```bash
git add src/i18n
git commit -m "feat(i18n): add complete Italian and English catalogs"
```

---

### Task 4: Pedagogical naturalness classifier

**Files:**
- Create: `src/lab/engine/naturalness.ts`
- Create: `src/lab/engine/naturalness.test.ts`

- [ ] **Step 1: Write the full compatibility matrix test**

Create `src/lab/engine/naturalness.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyNaturalness } from "./naturalness";

describe("classifyNaturalness", () => {
  it.each([
    ["pres", "today", "natural"],
    ["pres", "yesterday", "incompatible"],
    ["pres", "tomorrow", "natural"],
    ["pres", "tonight", "natural"],
    ["pres", "everyDay", "natural"],
    ["pres", "none", "natural"],
    ["past", "today", "natural"],
    ["past", "yesterday", "natural"],
    ["past", "tomorrow", "incompatible"],
    ["past", "tonight", "contextual"],
    ["past", "everyDay", "contextual"],
    ["past", "none", "natural"],
    ["neg", "today", "natural"],
    ["neg", "yesterday", "incompatible"],
    ["neg", "tomorrow", "natural"],
    ["neg", "tonight", "natural"],
    ["neg", "everyDay", "natural"],
    ["neg", "none", "natural"],
    ["pastneg", "today", "natural"],
    ["pastneg", "yesterday", "natural"],
    ["pastneg", "tomorrow", "incompatible"],
    ["pastneg", "tonight", "contextual"],
    ["pastneg", "everyDay", "contextual"],
    ["pastneg", "none", "natural"],
    ["vol", "today", "natural"],
    ["vol", "yesterday", "incompatible"],
    ["vol", "tomorrow", "natural"],
    ["vol", "tonight", "natural"],
    ["vol", "everyDay", "natural"],
    ["vol", "none", "natural"],
    ["des", "today", "natural"],
    ["des", "yesterday", "incompatible"],
    ["des", "tomorrow", "natural"],
    ["des", "tonight", "natural"],
    ["des", "everyDay", "natural"],
    ["des", "none", "natural"],
  ] as const)("%s + %s -> %s", (form, timeId, expected) => {
    expect(classifyNaturalness(form, timeId)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```bash
npx vitest run src/lab/engine/naturalness.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the classifier**

Create `src/lab/engine/naturalness.ts`:

```ts
import type { TimeId } from "../../content/types";
import type { Form } from "./conjugate";

export type Naturalness = "natural" | "contextual" | "incompatible";

export function classifyNaturalness(
  form: Form,
  timeId: TimeId,
): Naturalness {
  if (timeId === "none") return "natural";
  if (form === "pres" || form === "neg") {
    return timeId === "yesterday" ? "incompatible" : "natural";
  }
  if (form === "past" || form === "pastneg") {
    if (timeId === "tomorrow") return "incompatible";
    if (timeId === "tonight" || timeId === "everyDay") return "contextual";
    return "natural";
  }
  if (timeId === "yesterday") return "incompatible";
  return "natural";
}
```

- [ ] **Step 4: Run and commit**

```bash
npx vitest run src/lab/engine/naturalness.test.ts
git add src/lab/engine/naturalness.ts src/lab/engine/naturalness.test.ts
git commit -m "feat(lab): classify time and form naturalness"
```

---

### Task 5: Natural bilingual sentence realizer

**Files:**
- Create: `src/content/selection.ts`
- Create: `src/lab/engine/realize.ts`
- Create: `src/lab/engine/realize.test.ts`

- [ ] **Step 1: Write golden tests for all 12 scenarios**

Create `src/lab/engine/realize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LabSelection, ScenarioId } from "../../content/types";
import { realizeSentence } from "./realize";

const defaults: Record<ScenarioId, LabSelection["options"]> = {
  eat: { object: "ramen", place: "restaurant" },
  drink: { object: "water", place: "bar" },
  buy: { object: "ticket", place: "station" },
  watch: { object: "movie" },
  go: { destination: "station", transport: "train" },
  return: { destination: "home" },
  board: { vehicle: "train" },
  wait: { target: "friend" },
  meet: { person: "friend" },
  do: { activity: "reservation" },
  come: { destination: "japan" },
  speak: { language: "japaneseLanguage" },
};

const expected = {
  eat: ["Oggi mangio il ramen al ristorante.", "Today, I'm eating ramen at the restaurant."],
  drink: ["Oggi bevo dell'acqua al bar.", "Today, I'm drinking water at the bar."],
  buy: ["Oggi compro un biglietto in stazione.", "Today, I'm buying a ticket at the station."],
  watch: ["Oggi guardo un film.", "Today, I'm watching a movie."],
  go: ["Oggi vado alla stazione in treno.", "Today, I'm going to the station by train."],
  return: ["Oggi torno a casa.", "Today, I'm going back home."],
  board: ["Oggi prendo il treno.", "Today, I'm taking the train."],
  wait: ["Oggi aspetto un amico.", "Today, I'm waiting for a friend."],
  meet: ["Oggi incontro un amico.", "Today, I'm meeting a friend."],
  do: ["Oggi faccio una prenotazione.", "Today, I'm making a reservation."],
  come: ["Oggi vengo in Giappone.", "Today, I'm coming to Japan."],
  speak: ["Oggi parlo giapponese.", "Today, I'm speaking Japanese."],
} as const;

describe("golden bilingual realizations", () => {
  (Object.keys(expected) as ScenarioId[]).forEach((scenarioId) => {
    it(scenarioId, () => {
      const selection: LabSelection = {
        scenarioId,
        form: "pres",
        timeId: "today",
        options: defaults[scenarioId],
      };
      expect(realizeSentence(selection, "it")).toBe(expected[scenarioId][0]);
      expect(realizeSentence(selection, "en")).toBe(expected[scenarioId][1]);
    });
  });
});

describe("time and form selection", () => {
  const base: LabSelection = {
    scenarioId: "eat",
    form: "pres",
    timeId: "tomorrow",
    options: { object: "sushi", place: null },
  };

  it("uses future for a future adverb", () => {
    expect(realizeSentence(base, "it")).toBe("Domani mangerò il sushi.");
    expect(realizeSentence(base, "en")).toBe("Tomorrow, I'll eat sushi.");
  });

  it("uses habitual forms with every day", () => {
    const habitual = { ...base, timeId: "everyDay" as const };
    expect(realizeSentence(habitual, "it")).toBe("Ogni giorno mangio il sushi.");
    expect(realizeSentence(habitual, "en")).toBe("Every day, I eat sushi.");
  });

  it("uses past forms", () => {
    const past = { ...base, form: "past" as const, timeId: "yesterday" as const };
    expect(realizeSentence(past, "it")).toBe("Ieri ho mangiato il sushi.");
    expect(realizeSentence(past, "en")).toBe("Yesterday, I ate sushi.");
  });

  it("uses present, future, and past negative forms", () => {
    const current = { ...base, form: "neg" as const, timeId: "today" as const };
    expect(realizeSentence(current, "it")).toBe("Oggi non mangio il sushi.");
    expect(realizeSentence(current, "en")).toBe("Today, I'm not eating sushi.");

    const future = { ...current, timeId: "tomorrow" as const };
    expect(realizeSentence(future, "it")).toBe("Domani non mangerò il sushi.");
    expect(realizeSentence(future, "en")).toBe("Tomorrow, I won't eat sushi.");

    const past = {
      ...base,
      form: "pastneg" as const,
      timeId: "yesterday" as const,
    };
    expect(realizeSentence(past, "it")).toBe(
      "Ieri non ho mangiato il sushi.",
    );
    expect(realizeSentence(past, "en")).toBe(
      "Yesterday, I didn't eat sushi.",
    );
  });

  it("uses option-specific collocations", () => {
    const shopping: LabSelection = {
      scenarioId: "do",
      form: "pres",
      timeId: "today",
      options: { activity: "shopping" },
    };
    expect(realizeSentence(shopping, "it")).toBe("Oggi faccio acquisti.");
    expect(realizeSentence(shopping, "en")).toBe("Today, I'm doing some shopping.");

    const map: LabSelection = {
      scenarioId: "watch",
      form: "pres",
      timeId: "today",
      options: { object: "map" },
    };
    expect(realizeSentence(map, "it")).toBe("Oggi consulto la mappa.");
    expect(realizeSentence(map, "en")).toBe("Today, I'm looking at the map.");
  });

  it("rejects incomplete or out-of-scenario selections", () => {
    expect(() => realizeSentence({
      ...base,
      options: { object: "train", place: null },
    }, "it")).toThrow("Invalid option for object: train");
    expect(() => realizeSentence({
      ...base,
      options: { object: null, place: null },
    }, "it")).toThrow("Missing required option: object");
    expect(() => realizeSentence({
      ...base,
      options: { object: "sushi" },
    }, "it")).toThrow("Missing slot: place");
    expect(() => realizeSentence({
      ...base,
      options: { ...base.options, extra: "sushi" },
    }, "it")).toThrow("Unknown slot: extra");
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```bash
npx vitest run src/lab/engine/realize.test.ts
```

Expected: FAIL because `realizeSentence` does not exist.

- [ ] **Step 3: Implement the realizer**

Create `src/content/selection.ts`:

```ts
import { scenarios } from "./scenarios";
import { times } from "./times";
import type {
  ConceptId,
  LabSelection,
  Scenario,
  ScenarioSlot,
  TimeOption,
} from "./types";

export interface ResolvedSlot {
  slot: ScenarioSlot;
  conceptId: ConceptId;
}

export interface ResolvedLabSelection {
  scenario: Scenario;
  time: TimeOption;
  slots: ResolvedSlot[];
}

export function resolveLabSelection(
  selection: LabSelection,
): ResolvedLabSelection {
  const scenario = scenarios.find((item) => item.id === selection.scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${selection.scenarioId}`);
  const time = times.find((item) => item.id === selection.timeId);
  if (!time) throw new Error(`Unknown time: ${selection.timeId}`);

  const slotIds = new Set(scenario.slots.map((slot) => slot.id));
  for (const optionKey of Object.keys(selection.options)) {
    if (!slotIds.has(optionKey)) throw new Error(`Unknown slot: ${optionKey}`);
  }

  const slots = scenario.slots
    .map((slot): ResolvedSlot | null => {
      if (!Object.prototype.hasOwnProperty.call(selection.options, slot.id)) {
        throw new Error(`Missing slot: ${slot.id}`);
      }
      const conceptId = selection.options[slot.id] ?? null;
      if (conceptId === null) {
        if (!slot.optional) {
          throw new Error(`Missing required option: ${slot.id}`);
        }
        return null;
      }
      if (!slot.optionIds.includes(conceptId)) {
        throw new Error(`Invalid option for ${slot.id}: ${conceptId}`);
      }
      return { slot, conceptId };
    })
    .filter((entry): entry is ResolvedSlot => entry !== null);

  return { scenario, time, slots };
}
```

Create `src/lab/engine/realize.ts`:

```ts
import { resolveLabSelection } from "../../content/selection";
import type {
  ConceptId,
  LabSelection,
  SemanticRole,
  TimeId,
} from "../../content/types";
import { getCatalog } from "../../i18n/catalog";
import type { Locale } from "../../i18n/LocaleContext";
import type { PredicateForms, ScenarioCopy } from "../../i18n/types";
import type { Form } from "./conjugate";

const ROLE_ORDER: SemanticRole[] = [
  "object",
  "personTarget",
  "vehicleBoarded",
  "destination",
  "transport",
  "actionPlace",
];

function predicateFor(
  forms: PredicateForms,
  form: Form,
  timeId: TimeId,
): string {
  if (form === "past") return forms.past;
  if (form === "pastneg") return forms.pastNegative;
  if (form === "vol") return forms.suggestion;
  if (form === "des") return forms.desire;
  const future = timeId === "tomorrow" || timeId === "tonight";
  const habitual = timeId === "everyDay";
  if (form === "neg") {
    if (future) return forms.futureNegative;
    return habitual ? forms.habitualNegative : forms.currentNegative;
  }
  if (future) return forms.future;
  return habitual ? forms.habitual : forms.current;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

function primaryOption(
  scenarioCopy: ScenarioCopy,
  options: Record<string, ConceptId | null>,
): ConceptId | null {
  const values = Object.values(options).filter(
    (value): value is ConceptId => value !== null,
  );
  return values.find((value) => scenarioCopy.predicateByOption?.[value]) ?? null;
}

export function realizeSentence(
  selection: LabSelection,
  locale: Locale,
): string {
  const pack = getCatalog(locale);
  const { scenario, slots, time } = resolveLabSelection(selection);
  const copy = pack.scenarios[scenario.id];
  const optionOverride = primaryOption(copy, selection.options);
  const forms =
    (optionOverride && copy.predicateByOption?.[optionOverride]) ?? copy.predicate;
  const predicate = predicateFor(forms, selection.form, selection.timeId);
  const args = slots
    .slice()
    .sort(
      (a, b) =>
        ROLE_ORDER.indexOf(a.slot.semanticRole) -
        ROLE_ORDER.indexOf(b.slot.semanticRole),
    )
    .map(({ slot, conceptId }) => {
      const value = pack.concepts[conceptId].realizations[slot.semanticRole];
      if (!value) {
        throw new Error(
          `Missing ${locale} realization: ${conceptId}/${slot.semanticRole}`,
        );
      }
      return value;
    });

  const localizedTime = pack.times[time.id];
  const core = [predicate, ...args].join(" ");
  if (!localizedTime) return `${capitalize(core)}.`;
  const prefix =
    locale === "en"
      ? `${capitalize(localizedTime)},`
      : capitalize(localizedTime);
  return `${prefix} ${core}.`;
}
```

- [ ] **Step 4: Run all realizer/catalog tests**

```bash
npx vitest run src/lab/engine/realize.test.ts src/i18n/validate.test.ts
npx tsc --noEmit
```

Expected: all golden sentences pass. If a catalog string differs, fix the catalog, not the test, unless the output is demonstrably more natural in both languages and the spec is updated in the same commit.

- [ ] **Step 5: Commit**

```bash
git add src/content/selection.ts src/lab/engine/realize.ts src/lab/engine/realize.test.ts
git commit -m "feat(lab): realize natural Italian and English sentences"
```

---

### Task 6: Pure Lab view model and React migration

**Files:**
- Create: `src/lab/components/viewModel.ts`
- Create: `src/lab/components/viewModel.test.ts`
- Create: `src/lab/engine/japanese.ts`
- Create: `src/lab/engine/japanese.test.ts`
- Modify: `src/lab/engine/assemble.ts`
- Modify: `src/lab/components/Lab.tsx`
- Modify: `src/lab/components/Board.tsx`
- Modify: `src/lab/components/ControlPanel.tsx`
- Modify: `src/lab/components/TeachNote.tsx`
- Modify: `src/lab/components/labData.ts`
- Modify: `src/lab/lab.css`

- [ ] **Step 1: Write failing view-model and Japanese-model tests**

Create `src/lab/components/viewModel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildLabViewModel } from "./viewModel";

describe("buildLabViewModel", () => {
  it("separates labels from sentence realizations", () => {
    const vm = buildLabViewModel(
      {
        scenarioId: "eat",
        form: "pres",
        timeId: "today",
        options: { object: "ramen", place: "restaurant" },
      },
      "it",
      "en",
    );
    expect(vm.scenarioTitle).toBe("Mangiare qualcosa");
    expect(vm.slots[1].options[0]).toMatchObject({
      label: "ristorante",
      jp: "れすとらん",
    });
    expect(vm.sentence.primary).toBe("Oggi mangio il ramen al ristorante.");
    expect(vm.sentence.reference).toBe(
      "Today, I'm eating ramen at the restaurant.",
    );
    expect(vm.naturalness).toBe("natural");
  });

  it("marks incompatible combinations", () => {
    const vm = buildLabViewModel(
      {
        scenarioId: "eat",
        form: "past",
        timeId: "tomorrow",
        options: { object: "ramen", place: null },
      },
      "it",
      "en",
    );
    expect(vm.naturalness).toBe("incompatible");
  });
});
```

Create `src/lab/engine/japanese.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LabSelection } from "../../content/types";
import { buildJapaneseSentence } from "./japanese";

const golden = [
  {
    name: "eat",
    selection: { scenarioId: "eat", form: "pres", timeId: "today", options: { object: "ramen", place: "restaurant" } },
    jp: "きょうれすとらんでらーめんをたべます",
  },
  {
    name: "drink",
    selection: { scenarioId: "drink", form: "pres", timeId: "today", options: { object: "water", place: "bar" } },
    jp: "きょうばーでみずをのみます",
  },
  {
    name: "buy",
    selection: { scenarioId: "buy", form: "pres", timeId: "today", options: { object: "ticket", place: "shop" } },
    jp: "きょうみせできっぷをかいます",
  },
  {
    name: "watch",
    selection: { scenarioId: "watch", form: "pres", timeId: "today", options: { object: "movie" } },
    jp: "きょうえいがをみます",
  },
  {
    name: "go",
    selection: { scenarioId: "go", form: "pres", timeId: "today", options: { destination: "station", transport: "train" } },
    jp: "きょうでんしゃでえきにいきます",
  },
  {
    name: "return",
    selection: { scenarioId: "return", form: "pres", timeId: "today", options: { destination: "home" } },
    jp: "きょういえにかえります",
  },
  {
    name: "board",
    selection: { scenarioId: "board", form: "pres", timeId: "today", options: { vehicle: "train" } },
    jp: "きょうでんしゃにのります",
  },
  {
    name: "wait",
    selection: { scenarioId: "wait", form: "pres", timeId: "today", options: { target: "friend" } },
    jp: "きょうともだちをまちます",
  },
  {
    name: "meet",
    selection: { scenarioId: "meet", form: "pres", timeId: "today", options: { person: "friend" } },
    jp: "きょうともだちにあいます",
  },
  {
    name: "do",
    selection: { scenarioId: "do", form: "pres", timeId: "today", options: { activity: "reservation" } },
    jp: "きょうよやくをします",
  },
  {
    name: "come",
    selection: { scenarioId: "come", form: "pres", timeId: "today", options: { destination: "japan" } },
    jp: "きょうにほんにきます",
  },
  {
    name: "speak",
    selection: { scenarioId: "speak", form: "pres", timeId: "today", options: { language: "japaneseLanguage" } },
    jp: "きょうにほんごをはなします",
  },
] satisfies Array<{ name: string; selection: LabSelection; jp: string }>;

describe("buildJapaneseSentence", () => {
  it.each(golden)("preserves v2 output for $name", ({ selection, jp }) => {
    expect(buildJapaneseSentence(selection).sentence.jp).toBe(jp);
  });

  it("preserves the v2 Japanese order and highlighted gears", () => {
    const model = buildJapaneseSentence({
      scenarioId: "eat",
      form: "pres",
      timeId: "today",
      options: { object: "ramen", place: "restaurant" },
    });

    expect(model.parts.map((part) => part.id)).toEqual([
      "time",
      "place",
      "object",
      "verb",
    ]);
    expect(model.sentence).toEqual({
      jp: "きょうれすとらんでらーめんをたべます",
      romaji: "kyō resutoran de rāmen o tabemasu",
    });
    expect(model.parts[model.parts.length - 1]).toMatchObject({
      kind: "verb",
      jp: "たべ",
      suffix: { jp: "ます", romaji: "masu", kind: "ending" },
    });
  });

  it("omits an optional slot selected as null", () => {
    const model = buildJapaneseSentence({
      scenarioId: "eat",
      form: "pres",
      timeId: "tomorrow",
      options: { object: "sushi", place: null },
    });
    expect(model.sentence.jp).toBe("あしたすしをたべます");
    expect(model.parts.map((part) => part.id)).toEqual([
      "time",
      "object",
      "verb",
    ]);
  });
});
```

- [ ] **Step 2: Run and verify failure**

```bash
npx vitest run src/lab/components/viewModel.test.ts src/lab/engine/japanese.test.ts
```

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement the view model**

Create `src/lab/components/viewModel.ts`:

```ts
import { concepts } from "../../content/concepts";
import { scenarios } from "../../content/scenarios";
import { times } from "../../content/times";
import type { LabSelection } from "../../content/types";
import { getCatalog } from "../../i18n/catalog";
import type { Locale } from "../../i18n/LocaleContext";
import { classifyNaturalness } from "../engine/naturalness";
import { realizeSentence } from "../engine/realize";

export function buildLabViewModel(
  selection: LabSelection,
  locale: Locale,
  referenceLocale: Locale,
) {
  const scenario = scenarios.find((item) => item.id === selection.scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${selection.scenarioId}`);
  const pack = getCatalog(locale);
  const copy = pack.scenarios[scenario.id];
  return {
    scenario,
    scenarioTitle: copy.title,
    forms: pack.forms,
    times: times.map((time) => ({
      ...time,
      label: pack.times[time.id] || pack.ui.common.none,
    })),
    slots: scenario.slots.map((slot) => ({
      ...slot,
      copy: copy.slots[slot.id],
      options: slot.optionIds.map((conceptId) => ({
        id: conceptId,
        jp: concepts[conceptId].jp,
        romaji: concepts[conceptId].romaji,
        label: pack.concepts[conceptId].label,
      })),
    })),
    sentence: {
      primary: realizeSentence(selection, locale),
      reference: realizeSentence(selection, referenceLocale),
    },
    naturalness: classifyNaturalness(selection.form, selection.timeId),
    ui: pack.ui,
  };
}

export type LabViewModel = ReturnType<typeof buildLabViewModel>;
```

- [ ] **Step 4: Implement one reusable Japanese sentence model**

In `src/lab/engine/assemble.ts`, widen `Segment.kind` from the legacy
V2-only union to `string`. The assembler never branches on this metadata, and
the semantic model introduces the stable `"slot"` kind:

```ts
export interface Segment {
  kind: string;
  jp: string;
  romaji: string;
  particle?: Particle;
}
```

Create `src/lab/engine/japanese.ts`:

```ts
import { concepts } from "../../content/concepts";
import { resolveLabSelection } from "../../content/selection";
import type {
  LabSelection,
  Scenario,
  SemanticRole,
  TimeOption,
} from "../../content/types";
import { assembleJP, type Assembled, type Segment } from "./assemble";
import { conjugate } from "./conjugate";

const JP_ROLE_ORDER: SemanticRole[] = [
  "actionPlace",
  "transport",
  "personTarget",
  "object",
  "destination",
  "vehicleBoarded",
];

export interface JapaneseSentencePart {
  id: string;
  kind: "time" | "slot" | "verb";
  jp: string;
  romaji: string;
  semanticRole?: SemanticRole;
  particle?: { jp: string; romaji: string; kind: "particle" };
  suffix?: { jp: string; romaji: string; kind: "ending" };
}

export interface JapaneseSentenceModel {
  scenario: Scenario;
  time: TimeOption;
  parts: JapaneseSentencePart[];
  sentence: Assembled;
}

export function buildJapaneseSentence(
  selection: LabSelection,
): JapaneseSentenceModel {
  const { scenario, time, slots } = resolveLabSelection(selection);
  const selected = slots
    .slice()
    .sort(
      (a, b) =>
        JP_ROLE_ORDER.indexOf(a.slot.semanticRole) -
        JP_ROLE_ORDER.indexOf(b.slot.semanticRole),
    );

  const conjugation = conjugate(scenario.verb, selection.form);
  const parts: JapaneseSentencePart[] = [];
  if (time.jp) {
    parts.push({
      id: "time",
      kind: "time",
      jp: time.jp,
      romaji: time.romaji,
    });
  }
  for (const { slot, conceptId } of selected) {
    const concept = concepts[conceptId];
    parts.push({
      id: slot.id,
      kind: "slot",
      jp: concept.jp,
      romaji: concept.romaji,
      semanticRole: slot.semanticRole,
      particle: { ...slot.particle, kind: "particle" },
    });
  }
  parts.push({
    id: "verb",
    kind: "verb",
    jp: conjugation.jp.slice(0, -conjugation.ending.length),
    romaji: scenario.verb.stemRomaji,
    suffix: {
      jp: conjugation.ending,
      romaji: conjugation.endingRomaji,
      kind: "ending",
    },
  });

  const segments: Segment[] = parts.map((part) => ({
    kind: part.kind,
    jp: `${part.jp}${part.suffix?.jp ?? ""}`,
    romaji: `${part.romaji}${part.suffix?.romaji ?? ""}`,
    particle: part.particle,
  }));

  return {
    scenario,
    time,
    parts,
    sentence: assembleJP(segments),
  };
}
```

In `Board.tsx`, derive the chips, full Japanese sentence, and `audioText` from
`buildJapaneseSentence(selection)`. Use each part's explicit `particle` or
`suffix` metadata for highlighting. Remove the old index-based Japanese sorting
and duplicated audio-segment assembly so the Lab and guided lesson board cannot
drift.

- [ ] **Step 5: Replace index-based Lab state with stable IDs**

Replace `src/lab/components/Lab.tsx` with:

```tsx
import { useState } from "react";
import { SpeechNotice } from "../../components/SpeechNotice";
import { scenarios } from "../../content/scenarios";
import type {
  ConceptId,
  LabSelection,
  ScenarioId,
  TimeId,
} from "../../content/types";
import { useSpeech } from "../../hooks/useSpeech";
import { getCatalog } from "../../i18n/catalog";
import { useLocale } from "../../i18n/LocaleContext";
import { useScript } from "../../settings/ScriptContext";
import type { Form } from "../engine/conjugate";
import { Board } from "./Board";
import { ControlPanel } from "./ControlPanel";
import { TeachNote } from "./TeachNote";
import { buildLabViewModel } from "./viewModel";
import "../lab.css";

function defaultSelection(scenarioId: ScenarioId): LabSelection {
  const scenario =
    scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  return {
    scenarioId: scenario.id,
    form: "pres",
    timeId: "today",
    options: Object.fromEntries(
      scenario.slots.map((slot) => [slot.id, slot.defaultOptionId]),
    ),
  };
}

export function Lab() {
  const { locale, referenceLocale, showReference } = useLocale();
  const { script } = useScript();
  const { supported, japaneseVoiceAvailable, speakingKey, speak } = useSpeech();
  const [selection, setSelection] = useState<LabSelection>(() =>
    defaultSelection(scenarios[0].id),
  );
  const pack = getCatalog(locale);
  const vm = buildLabViewModel(selection, locale, referenceLocale);

  const setScenario = (scenarioId: ScenarioId) => {
    setSelection((current) => {
      const next = defaultSelection(scenarioId);
      return {
        ...next,
        form: current.form,
        timeId: current.timeId,
      };
    });
  };

  const setForm = (form: Form) => {
    setSelection((current) => ({ ...current, form }));
  };

  const setTime = (timeId: TimeId) => {
    setSelection((current) => ({ ...current, timeId }));
  };

  const setOption = (slotId: string, conceptId: ConceptId | null) => {
    setSelection((current) => ({
      ...current,
      options: { ...current.options, [slotId]: conceptId },
    }));
  };

  return (
    <div className="lab-page">
      <SpeechNotice
        supported={supported}
        japaneseVoiceAvailable={japaneseVoiceAvailable}
      />

      <div
        className="scenario"
        role="group"
        aria-label={vm.ui.lab.scenario}
      >
        <span className="scenario__label">{vm.ui.lab.scenario}:</span>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={`pill${
              scenario.id === selection.scenarioId ? " is-active" : ""
            }`}
            aria-pressed={scenario.id === selection.scenarioId}
            onClick={() => setScenario(scenario.id)}
          >
            <span aria-hidden="true">{scenario.emoji}</span>{" "}
            {pack.scenarios[scenario.id].title}
          </button>
        ))}
      </div>

      <TeachNote
        verb={vm.scenario.verb}
        form={selection.form}
        formCopy={vm.forms[selection.form]}
        ui={vm.ui.lab}
      />

      <div className="lab">
        <Board
          selection={selection}
          vm={vm}
          script={script}
          showReference={showReference}
          referenceLocale={referenceLocale}
          supported={supported}
          speakingKey={speakingKey}
          speak={speak}
        />
        <ControlPanel
          selection={selection}
          vm={vm}
          script={script}
          onFormChange={setForm}
          onTimeChange={setTime}
          onOptionChange={setOption}
        />
      </div>
    </div>
  );
}
```

Changing scenarios deliberately preserves the selected time and verb form, as v2
did, while replacing only the scenario-specific slots with their defaults.

- [ ] **Step 6: Migrate the Lab components**

Replace `src/lab/components/labData.ts` with:

```ts
import type { SemanticRole } from "../../content/types";
import type { Form } from "../engine/conjugate";

export const FORM_IDS: Form[] = [
  "pres",
  "past",
  "neg",
  "pastneg",
  "vol",
  "des",
];

export const ROLE_CHIP: Record<
  SemanticRole,
  "obj" | "place" | "topic"
> = {
  object: "obj",
  actionPlace: "place",
  transport: "place",
  destination: "topic",
  personTarget: "topic",
  vehicleBoarded: "topic",
};
```

Replace `src/lab/components/ControlPanel.tsx` with:

```tsx
import type {
  ConceptId,
  LabSelection,
  TimeId,
} from "../../content/types";
import type { Script } from "../../settings/ScriptContext";
import { conjugate, type Form } from "../engine/conjugate";
import { FORM_IDS, ROLE_CHIP } from "./labData";
import type { LabViewModel } from "./viewModel";

interface Props {
  selection: LabSelection;
  vm: LabViewModel;
  script: Script;
  onFormChange: (form: Form) => void;
  onTimeChange: (timeId: TimeId) => void;
  onOptionChange: (slotId: string, conceptId: ConceptId | null) => void;
}

export function ControlPanel({
  selection,
  vm,
  script,
  onFormChange,
  onTimeChange,
  onOptionChange,
}: Props) {
  return (
    <div className="controls">
      <div className="panel forms">
        <h3>
          <span className="dot dot--verb" />
          {vm.ui.lab.verbForm}
        </h3>
        <div className="opts">
          {FORM_IDS.map((formId) => {
            const copy = vm.forms[formId];
            const conjugation = conjugate(vm.scenario.verb, formId);
            return (
              <button
                key={formId}
                type="button"
                className={`opt${
                  selection.form === formId ? " is-active" : ""
                }`}
                aria-pressed={selection.form === formId}
                onClick={() => onFormChange(formId)}
              >
                <span
                  className="jp"
                  lang={script === "hiragana" ? "ja" : undefined}
                >
                  {script === "hiragana"
                    ? conjugation.ending
                    : conjugation.endingRomaji}
                </span>
                <span className="opt__label">
                  {copy.label} · {copy.grammar}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h3>
          <span className="dot dot--time" />
          {vm.ui.lab.when}
        </h3>
        <div className="opts">
          {vm.times.map((time) => {
            const empty = time.id === "none";
            return (
              <button
                key={time.id}
                type="button"
                className={`opt${
                  selection.timeId === time.id ? " is-active" : ""
                }`}
                aria-pressed={selection.timeId === time.id}
                onClick={() => onTimeChange(time.id)}
              >
                <span
                  className="jp"
                  lang={!empty && script === "hiragana" ? "ja" : undefined}
                >
                  {empty
                    ? vm.ui.common.none
                    : script === "hiragana"
                      ? time.jp
                      : time.romaji}
                </span>
                {!empty ? (
                  <span className="opt__label">{time.label}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {vm.slots.map((slot) => (
        <div className="panel" key={slot.id}>
          <h3>
            <span className={`dot dot--${ROLE_CHIP[slot.semanticRole]}`} />
            <span className="panel__title">
              <span>{slot.copy.prompt}</span>
              <small>
                {slot.copy.grammar} · <span lang="ja">{slot.particle.jp}</span>
                {slot.optional ? ` · ${vm.ui.common.optional}` : ""}
              </small>
            </span>
          </h3>
          <div className="opts">
            {slot.optional ? (
              <button
                type="button"
                className={`opt${
                  selection.options[slot.id] === null ? " is-active" : ""
                }`}
                aria-pressed={selection.options[slot.id] === null}
                onClick={() => onOptionChange(slot.id, null)}
              >
                <span className="jp">{vm.ui.common.none}</span>
              </button>
            ) : null}
            {slot.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`opt${
                  selection.options[slot.id] === option.id ? " is-active" : ""
                }`}
                aria-pressed={selection.options[slot.id] === option.id}
                onClick={() => onOptionChange(slot.id, option.id)}
              >
                <span
                  className="jp"
                  lang={script === "hiragana" ? "ja" : undefined}
                >
                  {script === "hiragana" ? option.jp : option.romaji}
                </span>
                <span className="opt__label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

Replace `src/lab/components/TeachNote.tsx` with:

```tsx
import type { Scenario } from "../../content/types";
import type { UiMessages } from "../../i18n/types";
import { conjugate, stem, type Form } from "../engine/conjugate";
import type { LabViewModel } from "./viewModel";

interface Props {
  verb: Scenario["verb"];
  form: Form;
  formCopy: LabViewModel["forms"][Form];
  ui: UiMessages["lab"];
}

export function TeachNote({ verb, form, formCopy, ui }: Props) {
  const stemJp = stem(verb.dict, verb.group);
  const conjugation = conjugate(verb, form);
  return (
    <div className="note">
      <span aria-hidden="true">💡</span> <b>{ui.rule}:</b> {ui.base}{" "}
      <b lang="ja">{stemJp}</b> (<i>{verb.stemRomaji}</i>) + {ui.ending}{" "}
      <b lang="ja">{conjugation.ending}</b> (
      <i>{conjugation.endingRomaji}</i>).
      <br />
      <span aria-hidden="true">🔎</span> <b>{formCopy.label}</b> ·{" "}
      {formCopy.grammar}
    </div>
  );
}
```

Replace `src/lab/components/Board.tsx` with:

```tsx
import {
  Fragment,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import type { LabSelection } from "../../content/types";
import type { SpeakOptions } from "../../hooks/useSpeech";
import type { Locale } from "../../i18n/LocaleContext";
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

function PartText({
  part,
  field,
}: {
  part: JapaneseSentencePart;
  field: ScriptField;
}) {
  const gear = part.particle ?? part.suffix;
  return (
    <>
      {part[field]}
      {gear ? (
        <>
          {field === "romaji" ? " " : null}
          <span className={gear.kind}>{gear[field]}</span>
        </>
      ) : null}
    </>
  );
}

function joinSpaced(nodes: ReactNode[]): ReactNode[] {
  return nodes.map((node, index) => (
    <Fragment key={index}>
      {index > 0 ? " " : null}
      {node}
    </Fragment>
  ));
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
  const japanese = buildJapaneseSentence(selection);
  const bump = useBump(JSON.stringify(selection));
  const mainField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const subField: ScriptField = script === "hiragana" ? "romaji" : "jp";
  const compatible = vm.naturalness !== "incompatible";

  const chips = japanese.parts.map((part) => {
    if (part.kind === "time") {
      return (
        <Chip
          key={part.id}
          kind="time"
          role={vm.ui.lab.when}
          jp={<PartText part={part} field="jp" />}
          romaji={<PartText part={part} field="romaji" />}
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
          jp={<PartText part={part} field="jp" />}
          romaji={<PartText part={part} field="romaji" />}
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
        jp={<PartText part={part} field="jp" />}
        romaji={<PartText part={part} field="romaji" />}
        script={script}
      />
    );
  });

  const mainNodes = joinSpaced(
    japanese.parts.map((part) => (
      <PartText part={part} field={mainField} />
    )),
  );
  const subNodes = joinSpaced(
    japanese.parts.map((part) => (
      <PartText part={part} field={subField} />
    )),
  );

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
          {mainNodes}
        </div>
        <div
          className={`sentence__sub${subField === "jp" ? " jp" : ""}`}
          lang={subField === "jp" ? "ja" : undefined}
        >
          {subNodes}
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
```

For an incompatible combination, keep Japanese visible, replace both localized
translations with a single muted `—`, and show the explanation above. Do not
render the generated source-language sentence at all.

- [ ] **Step 7: Add CSS for reference and naturalness**

In `src/lab/lab.css`, rename the source-language-specific selectors:

```css
.sentence__translation {
  margin-top: 10px;
  color: var(--gear-particle);
  font-size: 1.15rem;
  font-weight: 700;
}

.sentence__translation.is-unavailable {
  color: rgba(255, 255, 255, 0.55);
}

.opt__label {
  margin-left: 5px;
  color: var(--ink-soft);
  font-size: 0.8rem;
}

.opt.is-active .opt__label {
  color: rgba(255, 255, 255, 0.85);
}

.panel__title {
  display: grid;
  gap: 0.12rem;
}

.panel__title small {
  color: var(--ink-soft);
  font-size: 0.72rem;
  font-weight: 650;
}
```

Delete the old `.sentence__it`, `.opt .it`, and `.opt.is-active .it` rules.
Then append:

```css
.sentence__reference {
  margin-top: 0.35rem;
  color: color-mix(in srgb, var(--paper) 68%, transparent);
  font-size: 0.78rem;
}

.naturalness {
  margin: 0 0 1rem;
  border-radius: 0.8rem;
  padding: 0.75rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 700;
}

.naturalness--contextual {
  border: 1px solid #d3a64b;
  background: #fff3cf;
  color: #684d13;
}

.naturalness--incompatible {
  border: 1px solid #d7836f;
  background: #fde2d9;
  color: #742d1b;
}
```

- [ ] **Step 8: Run tests and build, then commit**

```bash
npx vitest run src/lab/components/viewModel.test.ts src/lab/engine
npm run build
git add src/lab
git commit -m "feat(lab): migrate UI to semantic bilingual content"
```

Expected: all tests pass and build succeeds.

---

### Task 7: Bilingual Phrasebook content

**Files:**
- Modify: `src/data/phrases.ts`
- Create: `src/data/phrases.test.ts`
- Modify: `src/components/Phrasebook.tsx`
- Modify: `src/components/PhraseCard.tsx`
- Modify: `src/components/CategoryNav.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing completeness test**

Create `src/data/phrases.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { categories } from "./phrases";

describe("phrasebook translations", () => {
  it("has stable IDs and complete IT/EN text", () => {
    const ids = new Set<string>();
    const categoryIds = new Set<string>();
    for (const category of categories) {
      expect(categoryIds.has(category.id)).toBe(false);
      categoryIds.add(category.id);
      expect(category.labels.it.length).toBeGreaterThan(0);
      expect(category.labels.en.length).toBeGreaterThan(0);
      for (const phrase of category.phrases) {
        expect(ids.has(phrase.id)).toBe(false);
        ids.add(phrase.id);
        expect(phrase.translations.it.length).toBeGreaterThan(0);
        expect(phrase.translations.en.length).toBeGreaterThan(0);
        expect(
          Object.values(phrase.notes ?? {}).every(
            (note) => note.trim().length > 0,
          ),
        ).toBe(true);
      }
    }
    expect(categoryIds.size).toBe(8);
    expect(ids.size).toBe(57);
  });

  it("keeps reviewed Italian and English wording", () => {
    const phrases = categories.flatMap((category) => category.phrases);
    const phrase = (id: string) => {
      const match = phrases.find((item) => item.id === id);
      if (!match) throw new Error(`Missing phrase: ${id}`);
      return match.translations;
    };

    expect(phrase("base-04")).toEqual({
      it: "Grazie mille",
      en: "Thank you very much",
    });
    expect(phrase("saluti-01")).toEqual({
      it: "Buongiorno",
      en: "Good morning",
    });
    expect(phrase("saluti-07")).toEqual({
      it: "Piacere",
      en: "Nice to meet you",
    });
    expect(phrase("presentarsi-05")).toEqual({
      it: "Piacere di conoscerti",
      en: "I look forward to getting to know you",
    });
    expect(phrase("emergenze-03")).toEqual({
      it: "Chiami la polizia, per favore",
      en: "Please call the police",
    });
  });
});
```

- [ ] **Step 2: Run and verify failure**

```bash
npx vitest run src/data/phrases.test.ts
```

Expected: FAIL because current phrases use `it` and categories use `label`.

- [ ] **Step 3: Change the Phrasebook types**

At the top of `src/data/phrases.ts`:

```ts
import type { Locale } from "../i18n/LocaleContext";

export type LocalizedText = Record<Locale, string>;

export interface Phrase {
  id: string;
  hiragana: string;
  romaji: string;
  translations: LocalizedText;
  notes?: Partial<Record<Locale, string>>;
}

export interface Category {
  id: string;
  labels: LocalizedText;
  hiragana: string;
  emoji: string;
  phrases: Phrase[];
}
```

- [ ] **Step 4: Migrate all category and phrase copy**

Use these category labels:

| ID | IT | EN |
|---|---|---|
| saluti | Saluti | Greetings |
| base | Espressioni essenziali | Essentials |
| presentarsi | Presentarsi | Introductions |
| mangiare | Mangiare e bere | Food and drinks |
| shopping | Shopping | Shopping |
| indicazioni | Indicazioni | Directions |
| emergenze | Emergenze | Emergencies |
| numeri | Numeri | Numbers |

Assign stable phrase IDs `${categoryId}-${two-digit-index}` and these English translations in existing phrase order:

```ts
const english = {
  saluti: [
    "Good morning",
    "Hello",
    "Good evening",
    "Good night",
    "Goodbye",
    "See you",
    "Nice to meet you",
  ],
  base: [
    "Yes",
    "No",
    "Please",
    "Thank you very much",
    "You're welcome",
    "Excuse me / Sorry",
    "I'm sorry",
    "It's okay / I'm fine",
  ],
  presentarsi: [
    "I'm …",
    "I'm from Italy",
    "I understand a little Japanese",
    "Do you speak English?",
    "I look forward to getting to know you",
  ],
  mangiare: [
    "I'm hungry",
    "The menu, please",
    "This one, please",
    "What do you recommend?",
    "Water, please",
    "It's delicious",
    "The bill, please",
    "Cheers!",
  ],
  shopping: [
    "How much is it?",
    "It's expensive",
    "What is this?",
    "Can I pay by credit card?",
    "A bag, please",
    "I'm just looking",
  ],
  indicazioni: [
    "Where is the station?",
    "Where is the restroom?",
    "It's on the right",
    "It's on the left",
    "Straight ahead",
    "Is it nearby?",
    "Please call a taxi",
  ],
  emergenze: [
    "Help!",
    "Where is the hospital?",
    "Please call the police",
    "I'm lost",
    "I feel sick",
    "I lost my passport",
  ],
  numeri: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
} as const;
```

Preserve the existing Italian translations except:

- `saluti-01`: use `Buongiorno` instead of the explanatory parenthesis;
- `saluti-07`: use `Piacere` instead of the parenthetical fragment;
- `base-04`: use `Grazie mille` instead of `Grazie (mille)`;
- `base-06`: use `Mi scusi / Scusa` instead of the explanatory fragment in parentheses;
- `base-08`: use `Va bene / Sto bene` instead of `Va bene / Tutto ok`;
- `presentarsi-01`: use `Sono …` instead of `Io sono …`;
- `presentarsi-02`: retain the natural `Vengo dall'Italia`;
- `presentarsi-05`: use `Piacere di conoscerti` instead of `Conto su di lei`;
- `mangiare-06`: use `È delizioso` instead of `È buono / delizioso`;
- `indicazioni-05`: retain the natural `Sempre dritto`;
- `emergenze-03`: use `Chiami la polizia, per favore`;
- `emergenze-04`: retain `Mi sono perso/a`.

Localize the one note:

```ts
notes: {
  it: "Metti il tuo nome al posto di …",
  en: "Replace … with your name",
}
```

- [ ] **Step 5: Migrate Phrasebook components**

Replace `src/components/CategoryNav.tsx` with:

```tsx
import type { Category } from "../data/phrases";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";

interface Props {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeId, onSelect }: Props) {
  const { locale } = useLocale();
  const ui = getCatalog(locale).ui;
  return (
    <nav className="catnav" aria-label={ui.phrasebook.categoriesLabel}>
      {categories.map((category) => {
        const active = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            className={`catnav__item${active ? " is-active" : ""}`}
            onClick={() => onSelect(category.id)}
            aria-pressed={active}
          >
            <span className="catnav__emoji" aria-hidden="true">
              {category.emoji}
            </span>
            <span className="catnav__labels">
              <span className="catnav__label">
                {category.labels[locale]}
              </span>
              <span className="catnav__jp" lang="ja" aria-hidden="true">
                {category.hiragana}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
```

Replace `src/components/PhraseCard.tsx` with:

```tsx
import type { Phrase } from "../data/phrases";
import type { SpeakOptions } from "../hooks/useSpeech";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { useScript } from "../settings/ScriptContext";

interface Props {
  phrase: Phrase;
  phraseKey: string;
  isSpeaking: boolean;
  supported: boolean;
  onSpeak: (text: string, opts: SpeakOptions) => void;
}

export function PhraseCard({
  phrase,
  phraseKey,
  isSpeaking,
  supported,
  onSpeak,
}: Props) {
  const { locale, referenceLocale, showReference } = useLocale();
  const { script } = useScript();
  const ui = getCatalog(locale).ui;
  const translation = phrase.translations[locale];

  return (
    <article className={`card${isSpeaking ? " is-speaking" : ""}`}>
      {script === "hiragana" ? (
        <>
          <p className="card__hiragana" lang="ja">{phrase.hiragana}</p>
          <p className="card__romaji">{phrase.romaji}</p>
        </>
      ) : (
        <>
          <p className="card__hiragana card__hiragana--romaji">
            {phrase.romaji}
          </p>
          <p className="card__romaji card__romaji--jp" lang="ja">
            {phrase.hiragana}
          </p>
        </>
      )}
      <p className="card__translation">{translation}</p>
      {showReference ? (
        <p className="card__reference">
          <span>{referenceLocale.toUpperCase()}</span>{" "}
          {phrase.translations[referenceLocale]}
        </p>
      ) : null}
      {phrase.notes?.[locale] ? (
        <p className="card__note">{phrase.notes[locale]}</p>
      ) : null}

      <div className="card__actions">
        <button
          type="button"
          className="btn btn--play"
          disabled={!supported}
          onClick={() =>
            onSpeak(phrase.hiragana, { rate: 1, key: phraseKey })
          }
          aria-label={`${ui.common.listen}: ${translation}`}
        >
          <span aria-hidden="true">▶</span>{" "}
          {isSpeaking ? ui.common.playing : ui.common.listen}
        </button>
        <button
          type="button"
          className="btn btn--slow"
          disabled={!supported}
          onClick={() =>
            onSpeak(phrase.hiragana, { rate: 0.6, key: phraseKey })
          }
          aria-label={`${ui.common.slow}: ${translation}`}
        >
          <span aria-hidden="true">🐢</span> {ui.common.slow}
        </button>
      </div>
    </article>
  );
}
```

Replace `src/components/Phrasebook.tsx` with:

```tsx
import { useState } from "react";
import { categories } from "../data/phrases";
import { useSpeech } from "../hooks/useSpeech";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { CategoryNav } from "./CategoryNav";
import { PhraseCard } from "./PhraseCard";
import { SpeechNotice } from "./SpeechNotice";

export function Phrasebook() {
  const { locale } = useLocale();
  const [activeId, setActiveId] = useState(categories[0].id);
  const { supported, japaneseVoiceAvailable, speakingKey, speak } = useSpeech();
  const ui = getCatalog(locale).ui;
  const active =
    categories.find((category) => category.id === activeId) ?? categories[0];

  return (
    <main className="app__main">
      <CategoryNav
        categories={categories}
        activeId={activeId}
        onSelect={setActiveId}
      />
      <section className="content">
        <SpeechNotice
          supported={supported}
          japaneseVoiceAvailable={japaneseVoiceAvailable}
        />
        <div className="content__head">
          <h2 className="content__title">
            <span aria-hidden="true">{active.emoji}</span>
            {active.labels[locale]}
            <span className="content__jp" lang="ja">
              {active.hiragana}
            </span>
          </h2>
          <p className="content__count">
            {active.phrases.length} {ui.common.phrases}
          </p>
        </div>
        <div className="grid">
          {active.phrases.map((phrase) => (
            <PhraseCard
              key={phrase.id}
              phrase={phrase}
              phraseKey={phrase.id}
              isSpeaking={speakingKey === phrase.id}
              supported={supported}
              onSpeak={speak}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
```

In `src/styles.css`, rename the existing `.card__it` selector to
`.card__translation`; keep its declarations unchanged.

- [ ] **Step 6: Run tests and commit**

```bash
npx vitest run src/data/phrases.test.ts
npm run build
git add src/data/phrases.ts src/data/phrases.test.ts src/components src/styles.css
git commit -m "feat(phrasebook): add reviewed Italian and English content"
```

---

### Task 8: Localize the app shell and Syllabary

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Phrasebook.tsx`
- Modify: `src/components/SpeechNotice.tsx`
- Modify: `src/hooks/useSpeech.ts`
- Create: `src/hooks/useSpeech.test.ts`
- Modify: `src/lab/components/Lab.tsx`
- Modify: `src/syllabary/kana.ts`
- Modify: `src/syllabary/Syllabary.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Localize the application shell**

Replace `src/App.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { Header, type Mode } from "./components/Header";
import { Phrasebook } from "./components/Phrasebook";
import { getCatalog } from "./i18n/catalog";
import { LocaleProvider, useLocale } from "./i18n/LocaleContext";
import { Lab } from "./lab/components/Lab";
import {
  ScriptProvider,
  useScript,
} from "./settings/ScriptContext";
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
        <p className="settings-warning" role="status">
          {ui.settings.unavailable}
        </p>
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
```

- [ ] **Step 2: Localize Header and add language/reference controls**

Replace `src/components/Header.tsx` with:

```tsx
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { useScript } from "../settings/ScriptContext";

export type Mode = "sillabario" | "frasario" | "laboratorio";

interface Props {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function Header({ mode, onModeChange }: Props) {
  const {
    locale,
    showReference,
    setLocale,
    setShowReference,
  } = useLocale();
  const { script, setScript } = useScript();
  const ui = getCatalog(locale).ui;
  const modes: Array<{ id: Mode; label: string; emoji: string }> = [
    { id: "sillabario", label: ui.nav.syllabary, emoji: "🈂️" },
    { id: "frasario", label: ui.nav.phrasebook, emoji: "📖" },
    { id: "laboratorio", label: ui.nav.laboratory, emoji: "🧑‍🏫" },
  ];

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo" lang="ja" aria-hidden="true">
          はなそう
        </span>
        <div className="header__text">
          <h1 className="header__title">{ui.brand.title}</h1>
          <p className="header__subtitle">{ui.brand.subtitle}</p>
        </div>
      </div>

      <div className="header__tools">
        <nav className="modenav" aria-label={ui.nav.modes}>
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`modenav__item${
                mode === item.id ? " is-active" : ""
              }`}
              aria-pressed={mode === item.id}
              onClick={() => onModeChange(item.id)}
            >
              <span aria-hidden="true">{item.emoji}</span> {item.label}
            </button>
          ))}
        </nav>

        <div className="header__settings">
          <div
            className="localetoggle"
            role="group"
            aria-label={ui.settings.language}
          >
            <button
              type="button"
              className={locale === "it" ? "is-active" : ""}
              aria-pressed={locale === "it"}
              onClick={() => setLocale("it")}
            >
              IT
            </button>
            <button
              type="button"
              className={locale === "en" ? "is-active" : ""}
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>

          <label className="reference-toggle">
            <input
              type="checkbox"
              checked={showReference}
              onChange={(event) => setShowReference(event.target.checked)}
            />
            {ui.settings.reference}
          </label>

          <div
            className="scripttoggle"
            role="group"
            aria-label={ui.settings.writing}
          >
            <button
              type="button"
              className={script === "hiragana" ? "is-active" : ""}
              aria-pressed={script === "hiragana"}
              onClick={() => setScript("hiragana")}
            >
              <span className="k" lang="ja" aria-hidden="true">あ</span>{" "}
              Hiragana
            </button>
            <button
              type="button"
              className={script === "romaji" ? "is-active" : ""}
              aria-pressed={script === "romaji"}
              onClick={() => setScript("romaji")}
            >
              <span className="k" aria-hidden="true">A</span> Rōmaji
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Write the speech-error classification test**

Create `src/hooks/useSpeech.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { shouldReportSpeechError } from "./useSpeech";

describe("speech error reporting", () => {
  it("ignores cancellation caused by replacing or stopping audio", () => {
    expect(shouldReportSpeechError("canceled")).toBe(false);
    expect(shouldReportSpeechError("interrupted")).toBe(false);
  });

  it("reports actionable playback failures", () => {
    expect(shouldReportSpeechError("audio-busy")).toBe(true);
    expect(shouldReportSpeechError("synthesis-failed")).toBe(true);
  });
});
```

Run:

```bash
npx vitest run src/hooks/useSpeech.test.ts
```

Expected: FAIL because `shouldReportSpeechError` does not exist.

- [ ] **Step 4: Expose and announce actionable playback failures**

In `src/hooks/useSpeech.ts`, extend `UseSpeech` and add the classifier:

```ts
export interface UseSpeech {
  supported: boolean;
  japaneseVoiceAvailable: boolean;
  speakingKey: string | null;
  playbackFailed: boolean;
  speak: (text: string, opts?: SpeakOptions) => void;
  cancel: () => void;
}

export function shouldReportSpeechError(error: string): boolean {
  return error !== "canceled" && error !== "interrupted";
}
```

Add state beside `speakingKey`:

```ts
const [playbackFailed, setPlaybackFailed] = useState(false);
```

Replace `cancel` and `speak` with:

```ts
const cancel = useCallback(() => {
  if (!supported) return;
  utteranceRef.current = null;
  window.speechSynthesis.cancel();
  setSpeakingKey(null);
  setPlaybackFailed(false);
}, [supported]);

const speak = useCallback(
  (text: string, opts: SpeakOptions = {}) => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    utteranceRef.current = null;
    synth.cancel();
    setSpeakingKey(null);
    setPlaybackFailed(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = opts.rate ?? 1;
    if (voice) utterance.voice = voice;

    const key = opts.key ?? text;
    utterance.onstart = () => {
      if (utteranceRef.current === utterance) setSpeakingKey(key);
    };
    utterance.onend = () => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setSpeakingKey(null);
    };
    utterance.onerror = (event) => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setSpeakingKey(null);
      if (shouldReportSpeechError(event.error)) setPlaybackFailed(true);
    };

    utteranceRef.current = utterance;
    try {
      synth.speak(utterance);
    } catch {
      utteranceRef.current = null;
      setSpeakingKey(null);
      setPlaybackFailed(true);
    }
  },
  [supported, voice],
);
```

Return `playbackFailed` with the existing hook values.

Replace `SpeechNotice.tsx` with:

```tsx
import { useLocale } from "../i18n/LocaleContext";
import { getCatalog } from "../i18n/catalog";

interface Props {
  supported: boolean;
  japaneseVoiceAvailable: boolean;
  playbackFailed: boolean;
}

export function SpeechNotice({
  supported,
  japaneseVoiceAvailable,
  playbackFailed,
}: Props) {
  const { locale } = useLocale();
  const speech = getCatalog(locale).ui.speech;

  if (!supported) {
    return <div className="notice notice--warn" role="status">{speech.unsupported}</div>;
  }
  if (playbackFailed) {
    return <div className="notice notice--warn" role="alert">{speech.failed}</div>;
  }
  if (!japaneseVoiceAvailable) {
    return <div className="notice" role="status">{speech.missingVoice}</div>;
  }
  return null;
}
```

In `Phrasebook.tsx`, `Lab.tsx`, and `Syllabary.tsx`, use the extended hook and
notice props:

```tsx
const {
  supported,
  japaneseVoiceAvailable,
  speakingKey,
  playbackFailed,
  speak,
} = useSpeech();

<SpeechNotice
  supported={supported}
  japaneseVoiceAvailable={japaneseVoiceAvailable}
  playbackFailed={playbackFailed}
/>
```

Run:

```bash
npx vitest run src/hooks/useSpeech.test.ts
```

Expected: PASS.

- [ ] **Step 5: Localize Syllabary notes and correct terminology**

Change `SpecialNote`:

```ts
import type { Locale } from "../i18n/LocaleContext";

export interface SpecialNote {
  kana: string;
  title: Record<Locale, string>;
  body: Record<Locale, string>;
}
```

Replace `NOTES` with this complete bilingual content:

```ts
export const NOTES: SpecialNote[] = [
  {
    kana: "っ",
    title: {
      it: "Piccolo つ — raddoppio consonantico",
      en: "Small つ — consonant doubling",
    },
    body: {
      it: "Il piccolo つ raddoppia la consonante successiva: がっこう = gakkō, きって = kitte. Segna una breve pausa, non un suono autonomo.",
      en: "A small つ doubles the next consonant: がっこう = gakkō, きって = kitte. It is a short pause, not a separate sound.",
    },
  },
  {
    kana: "ー",
    title: {
      it: "Segno di vocale lunga",
      en: "Long-vowel mark",
    },
    body: {
      it: "Allunga la vocale precedente, soprattutto nei prestiti scritti in katakana. In hiragana, una vocale lunga si scrive di solito aggiungendo una vocale.",
      en: "It lengthens the previous vowel, especially in katakana loanwords. In hiragana, long vowels are usually written with an additional vowel.",
    },
  },
  {
    kana: "ん",
    title: {
      it: "ん — nasale moraica",
      en: "ん — the moraic nasal",
    },
    body: {
      it: "È l'unico suono simile a una consonante che può occupare da solo un'unità ritmica. La pronuncia si adatta al suono successivo.",
      en: "It is the only consonant-like sound that stands alone. Its pronunciation adapts to the following sound.",
    },
  },
];
```

Replace the old Italian-only introduction with:

```ts
export const INTRO = {
  it: "L'hiragana è uno dei sistemi di scrittura del giapponese: ogni segno rappresenta un suono ritmico. Impara a leggerlo per usare tutto il resto dell'app. Tocca una casella per ascoltare.",
  en: "Hiragana is one of the Japanese writing systems: each sign represents a rhythmic sound unit. Learn it to use the rest of the app. Tap a cell to listen.",
} satisfies Record<Locale, string>;
```

Replace `src/syllabary/Syllabary.tsx` with:

```tsx
import { Fragment } from "react";
import { SpeechNotice } from "../components/SpeechNotice";
import { useSpeech } from "../hooks/useSpeech";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { useScript } from "../settings/ScriptContext";
import {
  DAKUTEN,
  GOJUON,
  INTRO,
  NOTES,
  VOWELS,
  YOON,
  YOON_VOWELS,
  type Kana,
  type KanaRow,
} from "./kana";
import "./syllabary.css";

export function Syllabary() {
  const { locale } = useLocale();
  const { script } = useScript();
  const {
    supported,
    japaneseVoiceAvailable,
    speakingKey,
    playbackFailed,
    speak,
  } = useSpeech();
  const ui = getCatalog(locale).ui;

  const cell = (kana: Kana | null, key: string) => {
    if (!kana) {
      return <div className="kana-empty" key={key} aria-hidden="true" />;
    }
    const active = speakingKey === kana.kana;
    return (
      <button
        key={key}
        type="button"
        className={`kana${active ? " is-active" : ""}`}
        onClick={() => speak(kana.kana, { key: kana.kana })}
        disabled={!supported}
        aria-label={`${kana.kana} (${kana.romaji})`}
      >
        {script === "hiragana" ? (
          <>
            <span className="kana__main" lang="ja">{kana.kana}</span>
            <span className="kana__sub">{kana.romaji}</span>
          </>
        ) : (
          <>
            <span className="kana__main kana__main--romaji">
              {kana.romaji}
            </span>
            <span className="kana__sub kana__sub--jp" lang="ja">
              {kana.kana}
            </span>
          </>
        )}
      </button>
    );
  };

  const grid = (rows: KanaRow[], heads: string[]) => (
    <div
      className="kana-grid"
      style={{
        gridTemplateColumns:
          `2.2rem repeat(${heads.length}, minmax(0, 1fr))`,
      }}
    >
      <div className="kana-corner" aria-hidden="true" />
      {heads.map((head) => (
        <div className="kana-head" key={`head-${head}`}>{head}</div>
      ))}
      {rows.map((row) => (
        <Fragment key={row.label}>
          <div className="kana-rowlabel">{row.label}</div>
          {row.cells.map((entry, index) =>
            cell(entry, `${row.label}-${index}`),
          )}
        </Fragment>
      ))}
    </div>
  );

  return (
    <main className="syllabary">
      <SpeechNotice
        supported={supported}
        japaneseVoiceAvailable={japaneseVoiceAvailable}
        playbackFailed={playbackFailed}
      />
      <div className="syllabary__intro">
        <h1>{ui.syllabary.title}</h1>
        <p>{INTRO[locale]}</p>
      </div>
      <section className="kana-section">
        <h2>Gojūon · {ui.syllabary.base}</h2>
        {grid(GOJUON, VOWELS)}
      </section>
      <section className="kana-section">
        <h2>{ui.syllabary.voiced}</h2>
        {grid(DAKUTEN, VOWELS)}
      </section>
      <section className="kana-section">
        <h2>Yōon · {ui.syllabary.combinations}</h2>
        {grid(YOON, YOON_VOWELS)}
      </section>
      <section className="kana-section">
        <h2>{ui.syllabary.notes}</h2>
        <div className="kana-notes">
          {NOTES.map((note) => (
            <div className="kana-note" key={note.kana}>
              <span className="kana-note__glyph" lang="ja">
                {note.kana}
              </span>
              <div>
                <b>{note.title[locale]}</b>
                <p>{note.body[locale]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Add shell styles**

Add to `styles.css`:

```css
.header__settings {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.localetoggle {
  display: inline-flex;
  gap: 0.2rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  padding: 0.2rem;
  background: var(--paper);
}

.localetoggle button {
  border: 0;
  border-radius: 0.55rem;
  padding: 0.45rem 0.65rem;
  background: transparent;
  color: var(--muted);
  font-weight: 800;
}

.localetoggle button.is-active {
  background: white;
  color: var(--ink);
}

.reference-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.card__reference {
  margin: -0.35rem 0 0.75rem;
  color: var(--muted);
  font-size: 0.75rem;
}

.settings-warning {
  margin: 0;
  padding: 0.55rem 1rem;
  background: #fff3cf;
  color: #684d13;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
}
```

At the existing `@media (max-width: 820px)` breakpoint, add:

```css
.header__settings {
  width: 100%;
  justify-content: flex-start;
}

.reference-toggle {
  flex-basis: 100%;
}
```

- [ ] **Step 7: Run the full suite and commit**

```bash
npm test
npm run build
git add src/App.tsx src/components src/hooks src/lab/components/Lab.tsx src/syllabary src/styles.css
git commit -m "feat(i18n): localize app shell and hiragana trainer"
```

Expected: all tests pass and the application builds.

---

### Task 9: Remove legacy Italian-only Lab data

**Files:**
- Modify: `src/lab/engine/assemble.ts`
- Modify: `src/lab/engine/assemble.test.ts`
- Delete: `src/lab/data/types.ts`
- Delete: `src/lab/data/scenarios.ts`
- Delete: `src/lab/data/scenarios.test.ts`
- Modify imports across `src/lab/`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Confirm no runtime imports remain**

Run:

```bash
rg 'lab/data|assembleIT|italianVerb|ItalianVerb|TimeOption\.it|Option\.it|sentence__it|card__it|className="it"' src
```

Expected before cleanup: matches only in legacy files/tests. If matches remain in migrated components, fix those imports before deletion.

- [ ] **Step 2: Keep only the Japanese assembler**

`src/lab/engine/assemble.ts` must contain only:

```ts
export interface Particle {
  jp: string;
  romaji: string;
}

export interface Segment {
  kind: string;
  jp: string;
  romaji: string;
  particle?: Particle;
}

export interface Assembled {
  jp: string;
  romaji: string;
}

export function assembleJP(segments: Segment[]): Assembled {
  const present = segments.filter((segment) => segment.jp.length > 0);
  return {
    jp: present
      .map((segment) => segment.jp + (segment.particle?.jp ?? ""))
      .join(""),
    romaji: present
      .flatMap((segment) =>
        segment.particle
          ? [segment.romaji, segment.particle.romaji]
          : [segment.romaji],
      )
      .join(" "),
  };
}
```

Keep the two existing Japanese assembler tests and remove the Italian assembler tests.

- [ ] **Step 3: Delete legacy files and update README**

Delete the three `src/lab/data/*` files. Update README:

- replace Italian-only architecture references with `src/content/` + `src/i18n/`;
- document IT/EN and reference translation;
- explain naturalness statuses;
- keep the かえる note;
- do not document the future course yet.

Replace the Italian-only `package.json` description with:

```json
"description": "Bilingual practical Japanese learning with hiragana, sentence building, and browser speech."
```

- [ ] **Step 4: Verify no legacy terms and run final validation**

```bash
rg 'lab/data|assembleIT|italianVerb|ItalianVerb|TimeOption\.it|Option\.it|sentence__it|card__it|className="it"' src
npm test
npm run build
git status --short
```

Expected:

- first command has no matches;
- all tests pass;
- build succeeds;
- status contains only intended README/cleanup changes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(lab): remove legacy Italian-only data model"
```

---

## Plan 1 verification gate

Before starting plan 2:

1. Run `npm test` and record the passed test count.
2. Run `npm run build`.
3. Start `npm run dev -- --port 5181 --strictPort` with the Bash tool in
   detached async mode and retain its `shellId`.
4. Verify manually:
   - IT/EN changes all three modes;
   - reference translation appears only when enabled;
   - optional Lab controls show `—` in both locales;
   - restaurant option says “ristorante/restaurant”, while the sentence says “al ristorante/at the restaurant”;
   - changing IT/EN updates both `document.documentElement.lang` and the page title;
   - きのう + ます shows an incompatible explanation;
   - まいにち + ました shows a contextual explanation;
   - Japanese audio still plays;
   - browser console has no errors.
5. Stop that exact server with `stop_bash` and the retained `shellId`.
