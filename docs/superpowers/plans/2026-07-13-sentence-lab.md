# Laboratorio (v2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Laboratorio" sentence-construction mode (plus a "Sillabario" hiragana trainer and a global hiragana/rōmaji setting) to the existing nihongo-practice app, so the learner sees how one realistic sentence transforms across verb tenses, particles, time, place and object — with the particles/endings ("ingranaggi") highlighted and audio on every piece.

**Architecture:** A pure, dependency-free **rule engine** conjugates 12 verbs into 6 polite forms from their masu-stem, and an **assembler** builds the Japanese + rōmaji + Italian sentence from the current selection. Data (12 scenarios) is fully authored with rōmaji and Italian baked in — no transliteration, no LLM. React UI reuses the existing `useSpeech` hook. A tiny React Context holds the global script preference (persisted to localStorage). The app root gains a 3-mode switch (Sillabario / Frasario / Laboratorio); the existing phrasebook is preserved unchanged as "Frasario".

**Tech Stack:** Vite + React 18 + TypeScript (strict), hand-written CSS, Web Speech API (existing `useSpeech`), **vitest** (new, for engine/assembler unit tests, node environment — no jsdom).

---

## File Structure

```
docs/superpowers/
  specs/2026-07-13-sentence-lab-design.md   # the approved spec (copy from scratch)
  plans/2026-07-13-sentence-lab.md          # this plan (copy from scratch)

src/
  App.tsx                       # MODIFY: 3-mode switch + ScriptProvider wrapper
  settings/
    ScriptContext.tsx           # NEW: script context + useScript hook + persistence
  components/
    Header.tsx                  # MODIFY: brand + mode nav + script toggle (props)
    Phrasebook.tsx              # NEW: v1 content extracted here (Frasario mode)
    PhraseCard.tsx              # MODIFY: honor script setting (emphasis flip)
  syllabary/
    kana.ts                     # NEW: hiragana data (rows, dakuten, yōon, notes)
    Syllabary.tsx               # NEW: interactive kana grid with audio
    syllabary.css               # NEW
  lab/
    engine/
      conjugate.ts              # NEW: stem() + conjugate() (pure)
      conjugate.test.ts         # NEW: 12 verbs × 6 forms ground truth
      assemble.ts               # NEW: assembleJP() + assembleIT() (pure)
      assemble.test.ts          # NEW: canonical assembly cases
    data/
      types.ts                  # NEW: Form, Group, Verb, Role, Option, Slot, Scenario
      scenarios.ts              # NEW: 12 fully-authored scenarios
    components/
      Lab.tsx                   # NEW: mode container (scenario picker, rule-on-top, 2 cols)
      TeachNote.tsx             # NEW: dynamic rule box
      Board.tsx                 # NEW: chips + full sentence + Ascolta + legend
      Chip.tsx                  # NEW: one slot chip (primary/secondary script, gears)
      ControlPanel.tsx          # NEW: option buttons per axis (side controls)
    lab.css                     # NEW (ported from files/mockup.html)

vite.config.ts                  # MODIFY: add vitest `test` block
package.json                    # MODIFY: add vitest devDep + "test" script
tsconfig.json                   # (unchanged; tests use explicit vitest imports)
README.md                       # MODIFY: document v2 modes
```

**Reference artifacts (in the session scratch `files/`):** `spec.md` (full design) and `mockup.html` (the approved, working UI reference — source of truth for lab markup + CSS + the `chipHTML()` / `italianVerb()` logic). Port CSS/markup from the mockup; do not re-invent the visual design.

---

## Task 0: Test tooling + docs

**Files:**
- Create: `docs/superpowers/specs/2026-07-13-sentence-lab-design.md` (copy of scratch `spec.md`)
- Create: `docs/superpowers/plans/2026-07-13-sentence-lab.md` (copy of scratch `plan.md`)
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/lab/engine/sanity.test.ts` (temporary)

- [ ] **Step 1: Copy spec + plan into the repo**

Copy the two scratch files into `docs/superpowers/specs/` and `docs/superpowers/plans/` at the paths above.

- [ ] **Step 2: Add vitest to package.json**

Add to `devDependencies`: `"vitest": "^2.1.8"`. Add to `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`. Then run `npm install`.

- [ ] **Step 3: Configure vitest in vite.config.ts**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Sanity test**

Create `src/lab/engine/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("tooling", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm test`
Expected: 1 passed. Then delete `src/lab/engine/sanity.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add vitest + v2 design docs"
```

---

## Task 1: Conjugation engine — stem

**Files:**
- Create: `src/lab/engine/conjugate.ts`
- Create: `src/lab/engine/conjugate.test.ts`

**Background:** All 6 polite forms are `stem + suffix`. Only the stem derivation differs by group.
- **ichidan:** drop final る (たべる→たべ).
- **godan:** change the final う-row kana to its い-row: `う→い く→き ぐ→ぎ す→し つ→ち ぬ→に ぶ→び む→み る→り`.
- **irregular:** lookup — する→し, くる→き.
Store rōmaji stem in data (`stemRomaji`), so the engine never transliterates.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { stem } from "./conjugate";

describe("stem", () => {
  const cases: Array<[string, "ichidan" | "godan" | "irregular", string]> = [
    ["たべる", "ichidan", "たべ"],
    ["みる", "ichidan", "み"],
    ["のむ", "godan", "のみ"],
    ["かう", "godan", "かい"],
    ["いく", "godan", "いき"],
    ["かえる", "godan", "かえり"], // godan nonostante sembri ichidan
    ["のる", "godan", "のり"],
    ["まつ", "godan", "まち"],
    ["あう", "godan", "あい"],
    ["はなす", "godan", "はなし"],
    ["する", "irregular", "し"],
    ["くる", "irregular", "き"],
  ];
  it.each(cases)("%s (%s) -> %s", (dict, group, expected) => {
    expect(stem(dict, group)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`stem is not a function`). Run: `npm test`.

- [ ] **Step 3: Implement stem**

```ts
export type Group = "ichidan" | "godan" | "irregular";

const GODAN_STEM: Record<string, string> = {
  う: "い", く: "き", ぐ: "ぎ", す: "し", つ: "ち",
  ぬ: "に", ぶ: "び", む: "み", る: "り",
};

const IRREGULAR_STEM: Record<string, string> = {
  する: "し",
  くる: "き",
};

export function stem(dict: string, group: Group): string {
  if (group === "irregular") {
    const s = IRREGULAR_STEM[dict];
    if (!s) throw new Error(`Verbo irregolare sconosciuto: ${dict}`);
    return s;
  }
  if (group === "ichidan") {
    return dict.slice(0, -1); // togli る
  }
  const last = dict.slice(-1);
  const replaced = GODAN_STEM[last];
  if (!replaced) throw new Error(`Finale godan non valida: ${dict}`);
  return dict.slice(0, -1) + replaced;
}
```

- [ ] **Step 4: Run — expect PASS.** Run: `npm test`.

- [ ] **Step 5: Commit**

```bash
git add src/lab/engine/conjugate.ts src/lab/engine/conjugate.test.ts
git commit -m "feat(lab): conjugation stem for ichidan/godan/irregular"
```

---

## Task 2: Conjugation engine — 6 polite forms

**Files:**
- Modify: `src/lab/engine/conjugate.ts`
- Modify: `src/lab/engine/conjugate.test.ts`

**The 6 forms** (uniform suffixes on the stem):

| id | suffix (hiragana) | suffix (rōmaji) | senso |
|----|----|----|----|
| `pres` | ます | masu | presente/futuro affermativo |
| `past` | ました | mashita | passato affermativo |
| `neg`  | ません | masen | presente/futuro negativo |
| `pastneg` | ませんでした | masen deshita | passato negativo |
| `vol`  | ましょう | mashō | volitivo ("facciamo / andiamo?") |
| `des`  | たいです | tai desu | desiderativo ("voglio…") |

- [ ] **Step 1: Add the failing test** (append to `conjugate.test.ts`)

```ts
import { conjugate, type Form, type Verb } from "./conjugate";

const VERBS: Verb[] = [
  { dict: "たべる", group: "ichidan", stemRomaji: "tabe" },
  { dict: "のむ", group: "godan", stemRomaji: "nomi" },
  { dict: "かう", group: "godan", stemRomaji: "kai" },
  { dict: "みる", group: "ichidan", stemRomaji: "mi" },
  { dict: "いく", group: "godan", stemRomaji: "iki" },
  { dict: "かえる", group: "godan", stemRomaji: "kaeri" },
  { dict: "のる", group: "godan", stemRomaji: "nori" },
  { dict: "まつ", group: "godan", stemRomaji: "machi" },
  { dict: "あう", group: "godan", stemRomaji: "ai" },
  { dict: "する", group: "irregular", stemRomaji: "shi" },
  { dict: "くる", group: "irregular", stemRomaji: "ki" },
  { dict: "はなす", group: "godan", stemRomaji: "hanashi" },
];

// verità di riferimento per たべる (le altre seguono la stessa struttura)
describe("conjugate たべる", () => {
  const v = VERBS[0];
  const expect_: Record<Form, [string, string]> = {
    pres: ["たべます", "tabemasu"],
    past: ["たべました", "tabemashita"],
    neg: ["たべません", "tabemasen"],
    pastneg: ["たべませんでした", "tabemasen deshita"],
    vol: ["たべましょう", "tabemashō"],
    des: ["たべたいです", "tabetai desu"],
  };
  (Object.keys(expect_) as Form[]).forEach((f) => {
    it(f, () => {
      const r = conjugate(v, f);
      expect([r.jp, r.romaji]).toEqual(expect_[f]);
    });
  });
});

describe("conjugate — stem giapponese per tutti i verbi (forma pres)", () => {
  const expected: Record<string, string> = {
    たべる: "たべます", のむ: "のみます", かう: "かいます", みる: "みます",
    いく: "いきます", かえる: "かえります", のる: "のります", まつ: "まちます",
    あう: "あいます", する: "します", くる: "きます", はなす: "はなします",
  };
  VERBS.forEach((v) => {
    it(v.dict, () => {
      expect(conjugate(v, "pres").jp).toBe(expected[v.dict]);
    });
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`conjugate is not a function`).

- [ ] **Step 3: Implement conjugate + types**

Append to `conjugate.ts`:

```ts
export type Form = "pres" | "past" | "neg" | "pastneg" | "vol" | "des";

export interface Verb {
  dict: string; // forma del dizionario, es. たべる
  group: Group;
  stemRomaji: string; // es. "tabe" — la radice masu in rōmaji
}

export interface Conjugation {
  jp: string;
  romaji: string;
  ending: string; // suffisso in hiragana (per l'evidenziazione "ingranaggio")
  endingRomaji: string;
}

const SUFFIX: Record<Form, { jp: string; romaji: string }> = {
  pres: { jp: "ます", romaji: "masu" },
  past: { jp: "ました", romaji: "mashita" },
  neg: { jp: "ません", romaji: "masen" },
  pastneg: { jp: "ませんでした", romaji: "masen deshita" },
  vol: { jp: "ましょう", romaji: "mashō" },
  des: { jp: "たいです", romaji: "tai desu" },
};

export function conjugate(verb: Verb, form: Form): Conjugation {
  const s = stem(verb.dict, verb.group);
  const suf = SUFFIX[form];
  return {
    jp: s + suf.jp,
    romaji: verb.stemRomaji + suf.romaji, // es. "tabe"+"tai desu" = "tabetai desu"
    ending: suf.jp,
    endingRomaji: suf.romaji,
  };
}
```

*(Note: `des`/`pastneg` rōmaji contain a space, e.g. `tabetai desu`; that's intentional and matches spec §4.)*

- [ ] **Step 4: Run — expect PASS.** Run: `npm test`. All 12 verbs + the 6-form たべる table pass.

- [ ] **Step 5: Commit**

```bash
git add src/lab/engine/conjugate.ts src/lab/engine/conjugate.test.ts
git commit -m "feat(lab): 6 polite conjugation forms"
```

---

## Task 3: Data model types

**Files:**
- Create: `src/lab/data/types.ts`

- [ ] **Step 1: Write types**

```ts
import type { Form, Group } from "../engine/conjugate";

export type { Form, Group };
export type Script = "hiragana" | "romaji";

/** Ruolo grammaticale di uno slot → determina la particella e la posizione. */
export type Role = "object" | "destination" | "person" | "transport" | "place";

/** Particella associata a un ruolo. で=luogo, を=oggetto, に=meta/persona, へ=direzione. */
export const PARTICLE: Record<Role, { jp: string; romaji: string }> = {
  object: { jp: "を", romaji: "o" },
  destination: { jp: "に", romaji: "ni" },
  person: { jp: "に", romaji: "ni" },
  transport: { jp: "で", romaji: "de" },
  place: { jp: "で", romaji: "de" },
};

export interface Option {
  jp: string; // es. らーめん
  romaji: string; // es. rāmen
  it: string; // frammento italiano già con articolo/preposizione, es. "il ramen"
  none?: boolean; // opzione "nessuno" → lo slot viene omesso
}

export interface Slot {
  role: Role;
  label: string; // etichetta del controllo, es. "Cosa"
  options: Option[];
  defaultIndex: number; // opzione selezionata all'avvio
}

export interface TimeOption {
  jp: string;
  romaji: string;
  it: string; // es. "oggi", "" per nessuno
  none?: boolean;
  future?: boolean; // あした/こんばん → attiva la variante futura italiana
}

/** Tabella italiana completa del verbo: presente + varianti passato/futuro/etc. */
export interface ItalianVerb {
  pres: string; // "mangio"
  past: string; // "ho mangiato"
  future: string; // "mangerò"
  neg: string; // "non mangio"
  negFuture: string; // "non mangerò"
  pastneg: string; // "non ho mangiato"
  vol: string; // "mangiamo"
  des: string; // "voglio mangiare"
}

export interface Scenario {
  id: string;
  emoji: string;
  label: string; // "Mangiare"
  verb: {
    dict: string;
    group: Group;
    stemRomaji: string;
    it: ItalianVerb;
  };
  slots: Slot[];
}
```

- [ ] **Step 2: Typecheck.** Run: `npx tsc --noEmit`. Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lab/data/types.ts
git commit -m "feat(lab): data model types (Scenario/Slot/Option/Role)"
```

---

## Task 4: Scenarios data (12)

**Files:**
- Create: `src/lab/data/scenarios.ts`
- Create: `src/lab/data/scenarios.test.ts`

Author all 12 scenarios. Shared time axis lives with the Board (Task 8), not per-scenario. Each scenario's core slot is listed first; optional slots (place/transport) include a `none` option.

- [ ] **Step 1: Write the data-integrity test first**

```ts
import { describe, it, expect } from "vitest";
import { scenarios } from "./scenarios";
import { conjugate } from "../engine/conjugate";

describe("scenarios data", () => {
  it("almeno 10 scenari", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(10);
  });
  it("id univoci", () => {
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  scenarios.forEach((s) => {
    it(`${s.id}: il verbo si coniuga`, () => {
      expect(conjugate(s.verb, "pres").jp.length).toBeGreaterThan(1);
    });
    it(`${s.id}: ogni slot ha un default valido e opzioni complete`, () => {
      s.slots.forEach((slot) => {
        expect(slot.options[slot.defaultIndex]).toBeTruthy();
        slot.options.forEach((o) => {
          expect(o.jp.length).toBeGreaterThan(0);
          expect(o.romaji.length).toBeGreaterThan(0);
          expect(typeof o.it).toBe("string");
        });
      });
    });
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (module not found).

- [ ] **Step 3: Write scenarios.ts**

```ts
import type { Scenario } from "./types";

export const scenarios: Scenario[] = [
  {
    id: "mangiare",
    emoji: "🍜",
    label: "Mangiare",
    verb: {
      dict: "たべる", group: "ichidan", stemRomaji: "tabe",
      it: { pres: "mangio", past: "ho mangiato", future: "mangerò", neg: "non mangio", negFuture: "non mangerò", pastneg: "non ho mangiato", vol: "mangiamo", des: "voglio mangiare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "らーめん", romaji: "rāmen", it: "il ramen" },
        { jp: "すし", romaji: "sushi", it: "il sushi" },
        { jp: "おにぎり", romaji: "onigiri", it: "l'onigiri" },
      ]},
      { role: "place", label: "Dove", defaultIndex: 0, options: [
        { jp: "れすとらん", romaji: "resutoran", it: "al ristorante" },
        { jp: "いえ", romaji: "ie", it: "a casa" },
        { jp: "", romaji: "", it: "", none: true },
      ]},
    ],
  },
  {
    id: "bere",
    emoji: "🍺",
    label: "Bere",
    verb: {
      dict: "のむ", group: "godan", stemRomaji: "nomi",
      it: { pres: "bevo", past: "ho bevuto", future: "berrò", neg: "non bevo", negFuture: "non berrò", pastneg: "non ho bevuto", vol: "beviamo", des: "voglio bere" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "みず", romaji: "mizu", it: "l'acqua" },
        { jp: "びーる", romaji: "bīru", it: "la birra" },
        { jp: "おちゃ", romaji: "ocha", it: "il tè" },
      ]},
      { role: "place", label: "Dove", defaultIndex: 0, options: [
        { jp: "ばー", romaji: "bā", it: "al bar" },
        { jp: "いえ", romaji: "ie", it: "a casa" },
        { jp: "", romaji: "", it: "", none: true },
      ]},
    ],
  },
  {
    id: "comprare",
    emoji: "🛍️",
    label: "Comprare",
    verb: {
      dict: "かう", group: "godan", stemRomaji: "kai",
      it: { pres: "compro", past: "ho comprato", future: "comprerò", neg: "non compro", negFuture: "non comprerò", pastneg: "non ho comprato", vol: "compriamo", des: "voglio comprare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "きっぷ", romaji: "kippu", it: "il biglietto" },
        { jp: "おみやげ", romaji: "omiyage", it: "un souvenir" },
        { jp: "みず", romaji: "mizu", it: "dell'acqua" },
      ]},
      { role: "place", label: "Dove", defaultIndex: 0, options: [
        { jp: "みせ", romaji: "mise", it: "al negozio" },
        { jp: "えき", romaji: "eki", it: "in stazione" },
        { jp: "", romaji: "", it: "", none: true },
      ]},
    ],
  },
  {
    id: "guardare",
    emoji: "👀",
    label: "Guardare",
    verb: {
      dict: "みる", group: "ichidan", stemRomaji: "mi",
      it: { pres: "guardo", past: "ho guardato", future: "guarderò", neg: "non guardo", negFuture: "non guarderò", pastneg: "non ho guardato", vol: "guardiamo", des: "voglio guardare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "えいが", romaji: "eiga", it: "un film" },
        { jp: "ちず", romaji: "chizu", it: "la mappa" },
        { jp: "めにゅー", romaji: "menyū", it: "il menù" },
      ]},
    ],
  },
  {
    id: "andare",
    emoji: "🚉",
    label: "Andare",
    verb: {
      dict: "いく", group: "godan", stemRomaji: "iki",
      it: { pres: "vado", past: "sono andato/a", future: "andrò", neg: "non vado", negFuture: "non andrò", pastneg: "non sono andato/a", vol: "andiamo", des: "voglio andare" },
    },
    slots: [
      { role: "destination", label: "Dove", defaultIndex: 0, options: [
        { jp: "えき", romaji: "eki", it: "alla stazione" },
        { jp: "ほてる", romaji: "hoteru", it: "in hotel" },
        { jp: "くうこう", romaji: "kūkō", it: "all'aeroporto" },
      ]},
      { role: "transport", label: "Come", defaultIndex: 0, options: [
        { jp: "でんしゃ", romaji: "densha", it: "in treno" },
        { jp: "ばす", romaji: "basu", it: "in autobus" },
        { jp: "たくしー", romaji: "takushī", it: "in taxi" },
        { jp: "", romaji: "", it: "", none: true },
      ]},
    ],
  },
  {
    id: "tornare",
    emoji: "🏠",
    label: "Tornare",
    verb: {
      dict: "かえる", group: "godan", stemRomaji: "kaeri",
      it: { pres: "torno", past: "sono tornato/a", future: "tornerò", neg: "non torno", negFuture: "non tornerò", pastneg: "non sono tornato/a", vol: "torniamo", des: "voglio tornare" },
    },
    slots: [
      { role: "destination", label: "Dove", defaultIndex: 0, options: [
        { jp: "いえ", romaji: "ie", it: "a casa" },
        { jp: "ほてる", romaji: "hoteru", it: "in hotel" },
        { jp: "にほん", romaji: "nihon", it: "in Giappone" },
      ]},
    ],
  },
  {
    id: "prendere",
    emoji: "🚌",
    label: "Prendere (mezzo)",
    verb: {
      dict: "のる", group: "godan", stemRomaji: "nori",
      it: { pres: "prendo", past: "ho preso", future: "prenderò", neg: "non prendo", negFuture: "non prenderò", pastneg: "non ho preso", vol: "prendiamo", des: "voglio prendere" },
    },
    slots: [
      { role: "destination", label: "Cosa", defaultIndex: 0, options: [
        { jp: "でんしゃ", romaji: "densha", it: "il treno" },
        { jp: "ばす", romaji: "basu", it: "l'autobus" },
        { jp: "たくしー", romaji: "takushī", it: "il taxi" },
      ]},
    ],
  },
  {
    id: "aspettare",
    emoji: "⏳",
    label: "Aspettare",
    verb: {
      dict: "まつ", group: "godan", stemRomaji: "machi",
      it: { pres: "aspetto", past: "ho aspettato", future: "aspetterò", neg: "non aspetto", negFuture: "non aspetterò", pastneg: "non ho aspettato", vol: "aspettiamo", des: "voglio aspettare" },
    },
    slots: [
      { role: "object", label: "Chi/Cosa", defaultIndex: 0, options: [
        { jp: "ともだち", romaji: "tomodachi", it: "l'amico" },
        { jp: "ばす", romaji: "basu", it: "l'autobus" },
        { jp: "たくしー", romaji: "takushī", it: "il taxi" },
      ]},
    ],
  },
  {
    id: "incontrare",
    emoji: "🤝",
    label: "Incontrare",
    verb: {
      dict: "あう", group: "godan", stemRomaji: "ai",
      it: { pres: "incontro", past: "ho incontrato", future: "incontrerò", neg: "non incontro", negFuture: "non incontrerò", pastneg: "non ho incontrato", vol: "incontriamoci", des: "voglio incontrare" },
    },
    slots: [
      { role: "person", label: "Chi", defaultIndex: 0, options: [
        { jp: "ともだち", romaji: "tomodachi", it: "l'amico" },
        { jp: "せんせい", romaji: "sensei", it: "l'insegnante" },
        { jp: "かぞく", romaji: "kazoku", it: "la famiglia" },
      ]},
    ],
  },
  {
    id: "fare",
    emoji: "📞",
    label: "Fare",
    verb: {
      dict: "する", group: "irregular", stemRomaji: "shi",
      it: { pres: "faccio", past: "ho fatto", future: "farò", neg: "non faccio", negFuture: "non farò", pastneg: "non ho fatto", vol: "facciamo", des: "voglio fare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "よやく", romaji: "yoyaku", it: "una prenotazione" },
        { jp: "かいもの", romaji: "kaimono", it: "spese" },
        { jp: "でんわ", romaji: "denwa", it: "una telefonata" },
      ]},
    ],
  },
  {
    id: "venire",
    emoji: "🎉",
    label: "Venire",
    verb: {
      dict: "くる", group: "irregular", stemRomaji: "ki",
      it: { pres: "vengo", past: "sono venuto/a", future: "verrò", neg: "non vengo", negFuture: "non verrò", pastneg: "non sono venuto/a", vol: "veniamo", des: "voglio venire" },
    },
    slots: [
      { role: "destination", label: "Dove", defaultIndex: 0, options: [
        { jp: "にほん", romaji: "nihon", it: "in Giappone" },
        { jp: "みせ", romaji: "mise", it: "al negozio" },
        { jp: "ぱーてぃー", romaji: "pātī", it: "alla festa" },
      ]},
    ],
  },
  {
    id: "parlare",
    emoji: "💬",
    label: "Parlare",
    verb: {
      dict: "はなす", group: "godan", stemRomaji: "hanashi",
      it: { pres: "parlo", past: "ho parlato", future: "parlerò", neg: "non parlo", negFuture: "non parlerò", pastneg: "non ho parlato", vol: "parliamo", des: "voglio parlare" },
    },
    slots: [
      { role: "object", label: "Cosa", defaultIndex: 0, options: [
        { jp: "にほんご", romaji: "nihongo", it: "giapponese" },
        { jp: "えいご", romaji: "eigo", it: "inglese" },
      ]},
    ],
  },
];
```

- [ ] **Step 4: Run — expect PASS.** Run: `npm test`.

- [ ] **Step 5: Commit**

```bash
git add src/lab/data/scenarios.ts src/lab/data/scenarios.test.ts
git commit -m "feat(lab): 12 authored scenarios + data integrity tests"
```

---

## Task 5: Assembler — Japanese + rōmaji

**Files:**
- Create: `src/lab/engine/assemble.ts`
- Create: `src/lab/engine/assemble.test.ts`

**Assembly order (JP):** `[time] [place で] [transport で] [person に] [object を] [destination に] [verb]`.
Rules: omit any slot whose selected option is `none`/empty; time has no particle; each present slot renders `word + particle`. Rōmaji mirrors JP with spaces between segments.

A `Selection` maps `role → Option` (only present roles) plus the time and the conjugated verb pieces. The assembler receives already-resolved pieces to stay pure and simple.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { assembleJP, type Segment } from "./assemble";

describe("assembleJP", () => {
  it("time + object + verb", () => {
    const segs: Segment[] = [
      { kind: "time", jp: "きょう", romaji: "kyō" },
      { kind: "object", jp: "らーめん", romaji: "rāmen", particle: { jp: "を", romaji: "o" } },
      { kind: "verb", jp: "たべます", romaji: "tabemasu" },
    ];
    const r = assembleJP(segs);
    expect(r.jp).toBe("きょうらーめんをたべます");
    expect(r.romaji).toBe("kyō rāmen o tabemasu");
  });

  it("omette i segmenti vuoti", () => {
    const segs: Segment[] = [
      { kind: "object", jp: "みず", romaji: "mizu", particle: { jp: "を", romaji: "o" } },
      { kind: "verb", jp: "のみます", romaji: "nomimasu" },
    ];
    const r = assembleJP(segs);
    expect(r.jp).toBe("みずをのみます");
    expect(r.romaji).toBe("mizu o nomimasu");
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement assembleJP**

```ts
export interface Particle {
  jp: string;
  romaji: string;
}

export interface Segment {
  kind: "time" | "place" | "transport" | "person" | "object" | "destination" | "verb";
  jp: string;
  romaji: string;
  particle?: Particle;
}

export interface Assembled {
  jp: string;
  romaji: string;
}

export function assembleJP(segments: Segment[]): Assembled {
  const present = segments.filter((s) => s.jp.length > 0);
  const jp = present
    .map((s) => s.jp + (s.particle ? s.particle.jp : ""))
    .join("");
  const romaji = present
    .flatMap((s) => (s.particle ? [s.romaji, s.particle.romaji] : [s.romaji]))
    .join(" ");
  return { jp, romaji };
}
```

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add src/lab/engine/assemble.ts src/lab/engine/assemble.test.ts
git commit -m "feat(lab): Japanese/rōmaji sentence assembler"
```

---

## Task 6: Assembler — Italian (tense-vs-time rule)

**Files:**
- Modify: `src/lab/engine/assemble.ts`
- Modify: `src/lab/engine/assemble.test.ts`

**Italian order:** `[timeIT] [verbIT] [argIT...] [placeIT]` where arg/place fragments already carry article/preposition. Capitalize first letter.

**Tense-vs-time rule (spec §7):** the base Italian verb comes from the form. BUT when `form ∈ {pres, neg}` **and** the time is a future time (`future: true`), use the future Italian variant (`future` / `negFuture`). This encodes "present = future in Japanese; only the adverb disambiguates."

Form → ItalianVerb field:
- `pres` → `pres` (or `future` if future time)
- `neg` → `neg` (or `negFuture` if future time)
- `past` → `past`; `pastneg` → `pastneg`; `vol` → `vol`; `des` → `des`.

- [ ] **Step 1: Add failing tests**

```ts
import { assembleIT, italianVerb, type Form, type ITParts } from "./assemble";

describe("italianVerb — regola tempo/verbo", () => {
  const v = { pres: "mangio", past: "ho mangiato", future: "mangerò", neg: "non mangio", negFuture: "non mangerò", pastneg: "non ho mangiato", vol: "mangiamo", des: "voglio mangiare" };
  it("presente + oggi -> mangio", () => {
    expect(italianVerb(v, "pres", false)).toBe("mangio");
  });
  it("presente + domani -> mangerò", () => {
    expect(italianVerb(v, "pres", true)).toBe("mangerò");
  });
  it("negativo + stasera -> non mangerò", () => {
    expect(italianVerb(v, "neg", true)).toBe("non mangerò");
  });
  it("passato ignora il tempo futuro", () => {
    expect(italianVerb(v, "past", true)).toBe("ho mangiato");
  });
});

describe("assembleIT", () => {
  const v = { pres: "mangio", past: "ho mangiato", future: "mangerò", neg: "non mangio", negFuture: "non mangerò", pastneg: "non ho mangiato", vol: "mangiamo", des: "voglio mangiare" };
  it("oggi mangio il ramen al ristorante", () => {
    const parts: ITParts = { verb: v, form: "pres", timeIt: "oggi", timeFuture: false, args: ["il ramen", "al ristorante"] };
    expect(assembleIT(parts)).toBe("Oggi mangio il ramen al ristorante");
  });
  it("ieri ho mangiato il ramen", () => {
    const parts: ITParts = { verb: v, form: "past", timeIt: "ieri", timeFuture: false, args: ["il ramen"] };
    expect(assembleIT(parts)).toBe("Ieri ho mangiato il ramen");
  });
  it("stasera mangerò il ramen (presente+tempo futuro)", () => {
    const parts: ITParts = { verb: v, form: "pres", timeIt: "stasera", timeFuture: true, args: ["il ramen"] };
    expect(assembleIT(parts)).toBe("Stasera mangerò il ramen");
  });
  it("senza tempo: Mangio il ramen", () => {
    const parts: ITParts = { verb: v, form: "pres", timeIt: "", timeFuture: false, args: ["il ramen"] };
    expect(assembleIT(parts)).toBe("Mangio il ramen");
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement**

Append to `assemble.ts`:

```ts
export type Form = "pres" | "past" | "neg" | "pastneg" | "vol" | "des";

export interface ItalianVerbTable {
  pres: string; past: string; future: string;
  neg: string; negFuture: string; pastneg: string;
  vol: string; des: string;
}

export interface ITParts {
  verb: ItalianVerbTable;
  form: Form;
  timeIt: string; // "oggi", "" se nessuno
  timeFuture: boolean; // il tempo selezionato è futuro?
  args: string[]; // frammenti già con articolo, in ordine, "" filtrati
}

export function italianVerb(v: ItalianVerbTable, form: Form, timeFuture: boolean): string {
  if (timeFuture && form === "pres") return v.future;
  if (timeFuture && form === "neg") return v.negFuture;
  return v[form];
}

export function assembleIT(p: ITParts): string {
  const verb = italianVerb(p.verb, p.form, p.timeFuture);
  const words = [p.timeIt, verb, ...p.args].filter((w) => w.length > 0);
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
```

- [ ] **Step 4: Run — expect PASS.** Run: `npm test` (whole suite green).

- [ ] **Step 5: Commit**

```bash
git add src/lab/engine/assemble.ts src/lab/engine/assemble.test.ts
git commit -m "feat(lab): Italian assembler with tense-vs-time rule"
```

---

## Task 7: Script context + setting

**Files:**
- Create: `src/settings/ScriptContext.tsx`
- Create: `src/settings/script.test.ts`

- [ ] **Step 1: Failing test for the pure helper**

```ts
import { describe, it, expect } from "vitest";
import { normalizeScript } from "./ScriptContext";

describe("normalizeScript", () => {
  it("default hiragana", () => {
    expect(normalizeScript(null)).toBe("hiragana");
    expect(normalizeScript("boh")).toBe("hiragana");
  });
  it("accetta romaji", () => {
    expect(normalizeScript("romaji")).toBe("romaji");
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement context**

```tsx
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
```

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add src/settings/ScriptContext.tsx src/settings/script.test.ts
git commit -m "feat(settings): global hiragana/romaji script context"
```

---

## Task 8: Lab components

**Files:**
- Create: `src/lab/components/Chip.tsx`, `Board.tsx`, `ControlPanel.tsx`, `TeachNote.tsx`, `Lab.tsx`
- Create: `src/lab/lab.css`

**UI source of truth:** `files/mockup.html`. Port its markup and CSS. Key behaviors it already encodes: primary/secondary script swap, gears highlighting (particles amber, endings coral, verb stem neutral), rule box on top, 2-column grid (Board left/sticky, controls right), the time axis (`きょう/きのう/あした/こんばん/まいにち` + nessuno), the "Ascolta" buttons, and the bump animation on change.

**Shared time axis** (define at top of `Board.tsx` or a small `time.ts`):

```ts
export const TIMES = [
  { jp: "きょう", romaji: "kyō", it: "oggi", future: false },
  { jp: "きのう", romaji: "kinō", it: "ieri", future: false },
  { jp: "あした", romaji: "ashita", it: "domani", future: true },
  { jp: "こんばん", romaji: "konban", it: "stasera", future: true },
  { jp: "まいにち", romaji: "mainichi", it: "ogni giorno", future: false },
  { jp: "", romaji: "", it: "", none: true, future: false },
] as const;

export const FORMS = [
  { id: "pres", label: "Presente/Futuro" },
  { id: "past", label: "Passato" },
  { id: "neg", label: "Negativo" },
  { id: "pastneg", label: "Passato neg." },
  { id: "vol", label: "Volitivo" },
  { id: "des", label: "Desiderativo" },
] as const;
```

- [ ] **Step 1: Chip.tsx** — one gear-aware chip.

Props: `{ primary: string; secondary: string; kind: "word" | "particle" | "ending" | "verbstem" | "time"; onSpeak?: () => void; speaking?: boolean }`. Renders big `primary`, small `secondary`, class per `kind` mapping to the mockup's gear colors. Optional speaker button.

```tsx
interface ChipProps {
  primary: string;
  secondary: string;
  kind: "word" | "particle" | "ending" | "verbstem" | "time" | "verb";
  onSpeak?: () => void;
  speaking?: boolean;
}

export function Chip({ primary, secondary, kind, onSpeak, speaking }: ChipProps) {
  return (
    <span className={`chip chip--${kind}${speaking ? " chip--speaking" : ""}`}>
      <span className="chip__primary" lang={/[ぁ-ん]/.test(primary) ? "ja" : undefined}>{primary}</span>
      {secondary && <span className="chip__secondary">{secondary}</span>}
      {onSpeak && (
        <button className="chip__speak" onClick={onSpeak} aria-label="Ascolta">🔊</button>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Board.tsx** — renders the whiteboard from the current selection.

Props: `{ scenario, form, time, selections, script, speak, speakingKey }`. It:
1. Builds ordered `Segment[]` (time, place で, transport で, person に, object を, destination に, verb) using `PARTICLE` from types and `conjugate()` for the verb.
2. Calls `assembleJP(segments)` for the full sentence line.
3. Builds the Italian line via `assembleIT` (map selections→IT fragments in IT order: place fragment last).
4. Renders one `<Chip>` per present segment: word chips (`kind="word"`), a particle chip after each (`kind="particle"`, primary=particle.jp/romaji per script), the verb split into stem chip (`kind="verbstem"`) + ending chip (`kind="ending"`).
5. Renders the full JP sentence (big, script-aware) with an "Ascolta la frase" button (`speak(fullJP, {key:"full"})`), the rōmaji/hiragana secondary line, and the Italian translation.
6. Renders the gears legend (particle=ruolo, desinenza=tempo/polarità) — copy from mockup.

Use `useScript()` for which text is primary. For verb: primary stem = script==hiragana ? japaneseStem : verb.stemRomaji; ending per script.

- [ ] **Step 3: ControlPanel.tsx** — the side controls.

Props: `{ scenario, form, setForm, timeIndex, setTimeIndex, selections, setSelection, script }`. Renders, stacked vertically (side column): a **Tempo** group (6 forms as buttons — from `FORMS`), a **Quando** group (`TIMES`), and one group per scenario slot (`slot.label`, its options; `none` renders as "—"). Active button highlighted. Labels show primary script. Each button sets state in `Lab`.

- [ ] **Step 4: TeachNote.tsx** — the rule box (on top).

Props: `{ form, timeFuture }`. Returns a short Italian rule string for the active form, e.g.:
- pres: "ます = presente **e** futuro. È l'avverbio di tempo (きょう/あした…) a dire quando."
- past: "ました = passato. La radice non cambia, cambia solo la desinenza."
- neg: "ません = negativo presente/futuro."
- pastneg: "ませんでした = passato negativo."
- vol: "ましょう = «facciamo…?» / proposta."
- des: "たいです = «voglio…» (desiderio)."
When `form==="pres" && timeFuture` add: " Qui il tempo è futuro → in italiano usiamo il futuro." Render full-width above the two columns (mockup `.note` at top).

- [ ] **Step 5: Lab.tsx** — container + state.

Holds state: `scenarioId`, `form`, `timeIndex`, and `selections: Record<Role,int index>` (reset to slot defaults on scenario change via `useEffect`). Layout (match mockup): scenario picker (chips row of 12), then `<TeachNote>` full-width, then `.lab` two-column grid: left `<Board>` (sticky), right `<ControlPanel>`. Pull `speak/speakingKey/supported` from `useSpeech()`.

- [ ] **Step 6: lab.css** — port from `files/mockup.html` `<style>`.

Copy the mockup styles for `.lab`, `.board`, `.chip` + `.chip--*` gear colors, `.sentence`, `.controls`, `.note`, `.legend`, `.scenarios`, script-toggle, and the bump animation. Map mockup CSS vars to the app palette in `src/styles.css` (`--ink`, `--accent:#e4572e`, `--time:#2f6f6a`, board dark bg). Ensure the big chip text is large (mockup already sized) and gears stay highlighted in both scripts.

- [ ] **Step 7: Typecheck + manual smoke.** Run `npx tsc --noEmit` (0 errors). Run `npm run dev`, open the Lab in the browser canvas, switch scenarios/forms/time, confirm sentence + gears update and audio plays.

- [ ] **Step 8: Commit**

```bash
git add src/lab/components src/lab/lab.css
git commit -m "feat(lab): whiteboard UI (Board, Chip, ControlPanel, TeachNote, Lab)"
```

---

## Task 9: Sillabario mode

**Files:**
- Create: `src/syllabary/kana.ts`, `Syllabary.tsx`, `syllabary.css`

- [ ] **Step 1: kana.ts** — hiragana data.

Export arrays: `GOJUON` (base 46: a/ka/sa/ta/na/ha/ma/ya/ra/wa rows + ん), `DAKUTEN` (が/ざ/だ/ば/ぱ rows), `YOON` (きゃ/しゃ/ちゃ…). Each cell: `{ kana: string; romaji: string }`; empty slots as `null`. Include a short intro note (Italian) about hiragana. Full data table is in spec §2.1.

```ts
export interface Kana { kana: string; romaji: string; }
export const GOJUON: (Kana | null)[][] = [
  [{ kana: "あ", romaji: "a" }, { kana: "い", romaji: "i" }, { kana: "う", romaji: "u" }, { kana: "え", romaji: "e" }, { kana: "お", romaji: "o" }],
  [{ kana: "か", romaji: "ka" }, { kana: "き", romaji: "ki" }, { kana: "く", romaji: "ku" }, { kana: "け", romaji: "ke" }, { kana: "こ", romaji: "ko" }],
  // …sa, ta, na, ha, ma rows…
  [{ kana: "や", romaji: "ya" }, null, { kana: "ゆ", romaji: "yu" }, null, { kana: "よ", romaji: "yo" }],
  [{ kana: "ら", romaji: "ra" }, { kana: "り", romaji: "ri" }, { kana: "る", romaji: "ru" }, { kana: "れ", romaji: "re" }, { kana: "ろ", romaji: "ro" }],
  [{ kana: "わ", romaji: "wa" }, null, null, null, { kana: "を", romaji: "o" }],
  [{ kana: "ん", romaji: "n" }, null, null, null, null],
];
// DAKUTEN and YOON similarly (see spec §2.1 for full cells).
```

- [ ] **Step 2: Syllabary.tsx** — interactive grid.

Uses `useSpeech()`. Renders the gojūon grid (and dakuten/yōon sections). Each non-null cell is a button showing kana (big) + romaji (small), `onClick={() => speak(kana, {key: kana})}`, highlighted while `speakingKey===kana`. Respects `useScript()` only for emphasis order (kana always shown, romaji always shown here since it's a learning table). Add the intro note on top.

- [ ] **Step 3: syllabary.css** — grid layout (CSS grid, 5 columns), big kana, small romaji, hover/active states using palette.

- [ ] **Step 4: Typecheck + manual smoke.** `npx tsc --noEmit`; in dev, click cells and hear audio.

- [ ] **Step 5: Commit**

```bash
git add src/syllabary
git commit -m "feat(syllabary): interactive hiragana trainer with audio"
```

---

## Task 10: Integration — modes + header + script toggle

**Files:**
- Create: `src/components/Phrasebook.tsx`
- Modify: `src/App.tsx`, `src/components/Header.tsx`, `src/components/PhraseCard.tsx`, `src/styles.css`

- [ ] **Step 1: Extract v1 into Phrasebook.tsx**

Move the current phrasebook JSX from `App.tsx` (the `<main className="app__main">…</main>` block: `CategoryNav` + content + grid) into a new `Phrasebook` component. It owns its own `activeId` state and uses `useSpeech()`. No behavior change.

- [ ] **Step 2: App.tsx — mode switch + provider**

```tsx
import { useState } from "react";
import { ScriptProvider } from "./settings/ScriptContext";
import { Header, type Mode } from "./components/Header";
import { Phrasebook } from "./components/Phrasebook";
import { Syllabary } from "./syllabary/Syllabary";
import { Lab } from "./lab/components/Lab";

export default function App() {
  const [mode, setMode] = useState<Mode>("laboratorio");
  return (
    <ScriptProvider>
      <div className="app">
        <Header mode={mode} onModeChange={setMode} />
        {mode === "sillabario" && <Syllabary />}
        {mode === "frasario" && <Phrasebook />}
        {mode === "laboratorio" && <Lab />}
        <footer className="footer">
          <p>Fatto per imparare · audio con la sintesi vocale del browser · solo hiragana</p>
        </footer>
      </div>
    </ScriptProvider>
  );
}
```

- [ ] **Step 3: Header.tsx — nav + script toggle**

Add `export type Mode = "sillabario" | "frasario" | "laboratorio";`. Props `{ mode, onModeChange }`. Render the brand, a mode nav (3 buttons: Sillabario / Frasario / Laboratorio, active highlighted), and the script toggle (`あ Hiragana` / `A Rōmaji`) wired to `useScript()` (`script`, `setScript`). Port toggle markup/styles from the mockup.

- [ ] **Step 4: PhraseCard.tsx — honor script**

Use `useScript()`. When `script==="romaji"`, show romaji as the primary (big) line and hiragana small; when `hiragana`, keep current (hiragana big, romaji small). Minimal change to the existing render.

- [ ] **Step 5: styles.css — header nav + toggle**

Add styles for the mode nav (segmented control) and script toggle to match the mockup. Keep existing tokens.

- [ ] **Step 6: Typecheck + build + manual verify**

Run `npx tsc --noEmit` then `npm run build` (expect success). In dev: all 3 modes switch; script toggle flips emphasis app-wide and persists across reload (localStorage).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: 3-mode switch (Sillabario/Frasario/Laboratorio) + script toggle"
```

---

## Task 11: Docs + final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README** — document the three modes, the hiragana/rōmaji setting, the rule engine (12 verbs × 6 forms), and `npm test`.

- [ ] **Step 2: Full test + build**

Run: `npm test` (all green) and `npm run build` (success).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document v2 modes and conjugation engine"
```

---

## Self-Review notes (author)

- **Spec coverage:** §1 gears → Chip kinds + legend (Task 8). §2 3 modes → Tasks 8/9/10. §2.1 Sillabario → Task 9. §2.2 script setting → Task 7 + Task 10. §3 engine → Tasks 1–2. §4 ground truth → Task 2 tests. §5 data model → Tasks 3–4. §6 layout (rule-on-top, 2 cols) → Task 8. §7 IT tense/time rule → Task 6. §8 romaji-in-data → Options/stemRomaji (Tasks 2–4). §9 vitest → Task 0 + engine tests. §10 file structure → File Structure section. §11 out-of-scope → not implemented (correct).
- **Type consistency:** `Form` ids (`pres/past/neg/pastneg/vol/des`) identical across conjugate.ts, types.ts, assemble.ts. `Role`→`PARTICLE` mapping single source in types.ts. `stemRomaji` naming consistent.
- **Known gotcha to preserve:** かえる is **godan** (→かえり) — asserted in Task 1 test.
- **UI CSS** intentionally references `files/mockup.html` (a real, approved reference artifact), not a placeholder.
