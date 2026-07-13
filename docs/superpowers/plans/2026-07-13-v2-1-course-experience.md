# V2.1 Guided Course Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the bilingual v2 tools into an eight-chapter guided learning path with 16 complete lessons, explicit local progress, deep links, guided Lab presets, and the approved warm editorial UI.

**Architecture:** `HashRouter` provides GitHub-Pages-safe routes for Course, Free Practice, and Phrasebook. Locale-free course definitions reference typed copy IDs, shared Japanese examples, and valid Lab selections; IT/EN course catalogs contain all explanatory copy. A versioned progress context persists completed and last-visited lesson IDs through the safe storage adapter created in plan 1.

**Tech Stack:** React 18, React Router 7.6.2 (declarative/library mode), TypeScript strict, Vitest 3, existing Vite/CSS/Web Speech stack.

---

## Outcome and prerequisites

This is plan **2 of 3**. Start only after the verification gate in:

`docs/superpowers/plans/2026-07-13-v2-1-content-localization.md`

At the end:

- `#/percorso` is the default route;
- the path has 8 chapters and 16 complete lessons;
- every chapter is always accessible;
- completion is explicit and reversible;
- Lab and Syllabary live under Free Practice and remain directly accessible;
- lessons link to valid guided Lab/Syllabary presets;
- the UI matches `docs/superpowers/specs/2026-07-13-foundation-v2-1-mockup.html`;
- Phrasebook remains available and bilingual;
- no exercise scoring, speech recognition, or backend is added.

## File structure

```text
src/
  routing/
    routes.tsx                   # route tree + redirect notice
    routes.test.ts               # route metadata validation
  i18n/
    types.ts                     # extend shell navigation/brand/settings copy
    it.ts
    en.ts
  course/
    data/
      types.ts                   # chapter/lesson/block/example types
      examples.ts                # shared Japanese static examples
      course.ts                  # 8 chapters / 16 lessons
      validate.ts
      validate.test.ts
    i18n/
      types.ts                   # localized course copy
      it.ts
      en.ts
      catalog.ts
      validate.test.ts
    progress/
      progress.ts                # parse/migrate/update pure functions
      progress.test.ts
      ProgressContext.tsx
    components/
      CourseHome.tsx
      ChapterCard.tsx
      LessonPage.tsx
      LessonSidebar.tsx
      LessonBlock.tsx
      RuleBlock.tsx
      ExampleBlock.tsx
      ComparisonBlock.tsx
      CalloutBlock.tsx
      GuidedLabPreview.tsx
      GuidedToolBlock.tsx
      SummaryBlock.tsx
      PracticeHome.tsx
      RouteNotice.tsx
    course.css                   # approved warm editorial UI
  lab/
    presets.ts                   # URL-safe Lab selection parsing
    presets.test.ts
    components/Lab.tsx           # load preset + return link
  App.tsx                        # provider/router shell
  components/Header.tsx          # new primary navigation
  styles.css                     # global editorial shell
package.json                     # react-router
package-lock.json
```

---

### Task 1: Hash routing shell

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/routing/routes.tsx`
- Create: `src/routing/routes.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/it.ts`
- Modify: `src/i18n/en.ts`

- [ ] **Step 1: Install React Router**

Run:

```bash
npm install react-router@7.6.2
```

Expected: package and lockfile update; no peer dependency warnings.

- [ ] **Step 2: Write route metadata tests**

Create `src/routing/routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { lessonPath, routePaths } from "./routes";

describe("routePaths", () => {
  it("defines all public locations", () => {
    expect(routePaths).toEqual({
      course: "/percorso",
      lesson: "/percorso/:chapterId/:lessonId",
      practice: "/pratica",
      lab: "/pratica/laboratorio",
      syllabary: "/pratica/sillabario",
      phrasebook: "/frasario",
    });
  });

  it("builds an encoded lesson URL", () => {
    expect(lessonPath("sentence map", "topic/omission"))
      .toBe("/percorso/sentence%20map/topic%2Fomission");
  });
});
```

- [ ] **Step 3: Run and verify failure**

```bash
npx vitest run src/routing/routes.test.ts
```

Expected: FAIL because `routes.tsx` is missing.

- [ ] **Step 4: Add route constants and temporary route components**

Create `src/routing/routes.tsx`:

```tsx
import { Navigate, Route, Routes, useLocation } from "react-router";
import { Phrasebook } from "../components/Phrasebook";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { Lab } from "../lab/components/Lab";
import { Syllabary } from "../syllabary/Syllabary";

export const routePaths = {
  course: "/percorso",
  lesson: "/percorso/:chapterId/:lessonId",
  practice: "/pratica",
  lab: "/pratica/laboratorio",
  syllabary: "/pratica/sillabario",
  phrasebook: "/frasario",
} as const;

export function lessonPath(chapterId: string, lessonId: string): string {
  return `/percorso/${encodeURIComponent(chapterId)}/${encodeURIComponent(lessonId)}`;
}

function Placeholder({ page }: { page: "course" | "practice" }) {
  const { locale } = useLocale();
  return (
    <main className="route-placeholder">
      <h1>{getCatalog(locale).ui.nav[page]}</h1>
    </main>
  );
}

function InvalidRoute() {
  const location = useLocation();
  return (
    <Navigate
      replace
      to={routePaths.course}
      state={{ invalidPath: location.pathname }}
    />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to={routePaths.course} />} />
      <Route path={routePaths.course} element={<Placeholder page="course" />} />
      <Route path={routePaths.lesson} element={<Placeholder page="course" />} />
      <Route path={routePaths.practice} element={<Placeholder page="practice" />} />
      <Route path={routePaths.lab} element={<Lab />} />
      <Route path={routePaths.syllabary} element={<Syllabary />} />
      <Route path={routePaths.phrasebook} element={<Phrasebook />} />
      <Route path="*" element={<InvalidRoute />} />
    </Routes>
  );
}
```

- [ ] **Step 5: Replace mode state with HashRouter**

`App.tsx`:

```tsx
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
```

- [ ] **Step 6: Convert Header mode buttons to NavLink**

Extend `UiMessages.nav` in `src/i18n/types.ts` with:

```ts
primary: string;
course: string;
practice: string;
```

Add these values to the existing `nav` object in each locale:

```ts
// src/i18n/it.ts
primary: "Navigazione principale",
course: "Percorso",
practice: "Pratica libera",

// src/i18n/en.ts
primary: "Primary navigation",
course: "Course",
practice: "Free practice",
```

In `Header.tsx`, add:

```tsx
import { NavLink } from "react-router";
import { routePaths } from "../routing/routes";
```

Delete the `Mode` type and Header props, and change the declaration to
`export function Header()`. The component already reads `ui` from the active
locale catalog. Replace the local `modes` list with:

```tsx
const primaryNav = [
  { to: routePaths.course, label: ui.nav.course },
  { to: routePaths.practice, label: ui.nav.practice },
  { to: routePaths.phrasebook, label: ui.nav.phrasebook },
];
```

Render each with:

```tsx
<nav className="modenav" aria-label={ui.nav.primary}>
  {primaryNav.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        `modenav__item${isActive ? " is-active" : ""}`
      }
    >
      {item.label}
    </NavLink>
  ))}
</nav>
```

Retain locale/reference/script controls from plan 1.

- [ ] **Step 7: Test, build, commit**

```bash
npx vitest run src/routing/routes.test.ts
npm run build
git add package.json package-lock.json src/App.tsx src/components/Header.tsx src/i18n src/routing
git commit -m "feat(routing): add GitHub-Pages-safe application routes"
```

---

### Task 2: Course schema, shared examples, and validation

**Files:**
- Create: `src/course/data/types.ts`
- Create: `src/course/data/examples.ts`
- Create: `src/course/data/course.ts`
- Create: `src/course/data/validate.ts`
- Create: `src/course/data/validate.test.ts`

- [ ] **Step 1: Write failing course validation tests**

Create `src/course/data/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { chapters } from "./course";
import { examples } from "./examples";
import { validateCourse } from "./validate";

describe("course structure", () => {
  it("contains 8 chapters and 16 lessons", () => {
    expect(chapters).toHaveLength(8);
    expect(chapters.flatMap((chapter) => chapter.lessons)).toHaveLength(16);
  });

  it("has unique IDs and valid references", () => {
    expect(validateCourse(chapters, examples)).toEqual([]);
  });

  it("keeps every chapter open and ordered", () => {
    expect(chapters.map((chapter) => chapter.order)).toEqual([1,2,3,4,5,6,7,8]);
    expect(chapters.every((chapter) => chapter.locked === false)).toBe(true);
  });

  it("gives every chapter at least one guided tool", () => {
    expect(chapters.every((chapter) =>
      chapter.lessons.some((lesson) =>
        lesson.blocks.some((block) => block.type === "guidedTool"),
      ),
    )).toBe(true);
  });
});
```

- [ ] **Step 2: Run and verify failure**

```bash
npx vitest run src/course/data/validate.test.ts
```

Expected: FAIL because course modules do not exist.

- [ ] **Step 3: Define course types**

Create `src/course/data/types.ts`:

```ts
import type { LabSelection } from "../../content/types";

export type ChapterId =
  | "sounds"
  | "sentence-map"
  | "actions"
  | "time"
  | "places"
  | "people"
  | "travel-patterns"
  | "traps";

export type ToolTarget = "syllabary" | "lab";

export interface ExampleSegment {
  jp: string;
  romaji: string;
  kind: "word" | "particle" | "ending";
}

export interface StaticExample {
  id: string;
  jp: string;
  romaji: string;
  segments?: ExampleSegment[];
}

export type LessonBlock =
  | { type: "rule"; copyId: string; gear: string }
  | { type: "examples"; copyId: string; exampleIds: string[] }
  | { type: "comparison"; copyId: string; exampleIds: string[] }
  | {
      type: "callout";
      copyId: string;
      tone: "note" | "warning" | "exception";
    }
  | {
      type: "guidedTool";
      copyId: string;
      target: ToolTarget;
      preset?: LabSelection;
    }
  | { type: "summary"; copyId: string };

export interface Lesson {
  id: string;
  chapterId: ChapterId;
  order: number;
  blocks: LessonBlock[];
}

export interface Chapter {
  id: ChapterId;
  order: number;
  emoji: string;
  locked: false;
  lessons: Lesson[];
}
```

- [ ] **Step 4: Add all shared Japanese examples**

Create `src/course/data/examples.ts`:

```ts
import type { StaticExample } from "./types";

function segmentedExample(
  id: string,
  segments: NonNullable<StaticExample["segments"]>,
): StaticExample {
  return {
    id,
    jp: segments.map((segment) => segment.jp).join(""),
    romaji: segments.map((segment) => segment.romaji).join(""),
    segments,
  };
}

const list: StaticExample[] = [
  { id: "vowels", jp: "あ・い・う・え・お", romaji: "a · i · u · e · o" },
  { id: "k-row", jp: "か・き・く・け・こ", romaji: "ka · ki · ku · ke · ko" },
  { id: "small-tsu", jp: "がっこう", romaji: "gakkō" },
  { id: "long-vowel", jp: "きょう", romaji: "kyō" },
  segmentedExample("sentence-order", [
    { jp: "きょう ", romaji: "kyō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("topic-copula", [
    { jp: "わたし", romaji: "watashi ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "りっち", romaji: "Ricchi ", kind: "word" },
    { jp: "です", romaji: "desu", kind: "ending" },
  ]),
  segmentedExample("omitted-subject", [
    { jp: "りっち", romaji: "Ricchi ", kind: "word" },
    { jp: "です", romaji: "desu", kind: "ending" },
  ]),
  segmentedExample("this-water", [
    { jp: "これ", romaji: "kore ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "みず", romaji: "mizu ", kind: "word" },
    { jp: "です", romaji: "desu", kind: "ending" },
  ]),
  segmentedExample("eat-ramen", [
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("drink-water", [
    { jp: "みず", romaji: "mizu ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "のみ", romaji: "nomi", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("eat-sushi", [
    { jp: "すし", romaji: "sushi ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("speak-english", [
    { jp: "えいご", romaji: "eigo ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "はなし", romaji: "hanashi", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("today-eat", [
    { jp: "きょう ", romaji: "kyō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("tomorrow-eat", [
    { jp: "あした ", romaji: "ashita ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("yesterday-ate", [
    { jp: "きのう ", romaji: "kinō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ました", romaji: "mashita", kind: "ending" },
  ]),
  segmentedExample("today-not-eat", [
    { jp: "きょう ", romaji: "kyō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ません", romaji: "masen", kind: "ending" },
  ]),
  segmentedExample("yesterday-not-eat", [
    { jp: "きのう ", romaji: "kinō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ませんでした", romaji: "masen deshita", kind: "ending" },
  ]),
  segmentedExample("restaurant-eat", [
    { jp: "れすとらん", romaji: "resutoran ", kind: "word" },
    { jp: "で ", romaji: "de ", kind: "particle" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("home-drink", [
    { jp: "いえ", romaji: "ie ", kind: "word" },
    { jp: "で ", romaji: "de ", kind: "particle" },
    { jp: "おちゃ", romaji: "ocha ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "のみ", romaji: "nomi", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("go-station", [
    { jp: "えき", romaji: "eki ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "いき", romaji: "iki", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("go-by-train", [
    { jp: "でんしゃ", romaji: "densha ", kind: "word" },
    { jp: "で ", romaji: "de ", kind: "particle" },
    { jp: "いき", romaji: "iki", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("board-train", [
    { jp: "でんしゃ", romaji: "densha ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "のり", romaji: "nori", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("meet-friend", [
    { jp: "ともだち", romaji: "tomodachi ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "あい", romaji: "ai", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("wait-friend", [
    { jp: "ともだち", romaji: "tomodachi ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "まち", romaji: "machi", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("want-sushi", [
    { jp: "すし", romaji: "sushi ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "たいです", romaji: "tai desu", kind: "ending" },
  ]),
  segmentedExample("lets-go", [
    { jp: "えき", romaji: "eki ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "いき", romaji: "iki", kind: "word" },
    { jp: "ましょう", romaji: "mashō", kind: "ending" },
  ]),
  segmentedExample("where-station", [
    { jp: "えき", romaji: "eki ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "どこ", romaji: "doko ", kind: "word" },
    { jp: "です", romaji: "desu ", kind: "ending" },
    { jp: "か", romaji: "ka", kind: "particle" },
  ]),
  segmentedExample("water-please", [
    { jp: "みず", romaji: "mizu ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "ください", romaji: "kudasai", kind: "ending" },
  ]),
  segmentedExample("where-hotel", [
    { jp: "ほてる", romaji: "hoteru ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "どこ", romaji: "doko ", kind: "word" },
    { jp: "です", romaji: "desu ", kind: "ending" },
    { jp: "か", romaji: "ka", kind: "particle" },
  ]),
  segmentedExample("menu-please", [
    { jp: "めにゅー", romaji: "menyū ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "ください", romaji: "kudasai", kind: "ending" },
  ]),
  segmentedExample("where-shop", [
    { jp: "みせ", romaji: "mise ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "どこ", romaji: "doko ", kind: "word" },
    { jp: "です", romaji: "desu ", kind: "ending" },
    { jp: "か", romaji: "ka", kind: "particle" },
  ]),
  segmentedExample("restroom-exists", [
    { jp: "といれ", romaji: "toire ", kind: "word" },
    { jp: "が ", romaji: "ga ", kind: "particle" },
    { jp: "あり", romaji: "ari", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("teacher-exists", [
    { jp: "せんせい", romaji: "sensei ", kind: "word" },
    { jp: "が ", romaji: "ga ", kind: "particle" },
    { jp: "い", romaji: "i", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("particle-wa", [
    { jp: "こんにち", romaji: "konnichi", kind: "word" },
    { jp: "は", romaji: "wa", kind: "particle" },
  ]),
  segmentedExample("particle-e", [
    { jp: "えき", romaji: "eki ", kind: "word" },
    { jp: "へ ", romaji: "e ", kind: "particle" },
    { jp: "いき", romaji: "iki", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("return-godan", [
    { jp: "いえ", romaji: "ie ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "かえり", romaji: "kaeri", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("tomorrow-return", [
    { jp: "あした ", romaji: "ashita ", kind: "word" },
    { jp: "いえ", romaji: "ie ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "かえり", romaji: "kaeri", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
];

export const examples = Object.fromEntries(
  list.map((example) => [example.id, example]),
) as Record<string, StaticExample>;
```

- [ ] **Step 5: Define 8 chapters and 16 lessons**

Create `src/course/data/course.ts`:

```ts
import type { Chapter } from "./types";

export const chapters: Chapter[] = [
  {
    id: "sounds", order: 1, emoji: "あ", locked: false,
    lessons: [
      {
        id: "sounds-core", chapterId: "sounds", order: 1,
        blocks: [
          { type: "rule", copyId: "sounds-core-rule", gear: "あ" },
          { type: "examples", copyId: "sounds-core-examples", exampleIds: ["vowels", "k-row"] },
          { type: "guidedTool", copyId: "sounds-core-tool", target: "syllabary" },
          { type: "summary", copyId: "sounds-core-summary" },
        ],
      },
      {
        id: "sounds-special", chapterId: "sounds", order: 2,
        blocks: [
          { type: "rule", copyId: "sounds-special-rule", gear: "っ" },
          { type: "comparison", copyId: "sounds-special-examples", exampleIds: ["small-tsu", "long-vowel"] },
          { type: "guidedTool", copyId: "sounds-special-tool", target: "syllabary" },
          { type: "summary", copyId: "sounds-special-summary" },
        ],
      },
    ],
  },
  {
    id: "sentence-map", order: 2, emoji: "🗺️", locked: false,
    lessons: [
      {
        id: "sentence-order", chapterId: "sentence-map", order: 1,
        blocks: [
          { type: "rule", copyId: "sentence-order-rule", gear: "→" },
          { type: "examples", copyId: "sentence-order-examples", exampleIds: ["sentence-order"] },
          { type: "comparison", copyId: "sentence-order-topic", exampleIds: ["topic-copula"] },
          { type: "guidedTool", copyId: "sentence-order-tool", target: "lab", preset: { scenarioId: "eat", form: "pres", timeId: "today", options: { object: "ramen", place: null } } },
          { type: "summary", copyId: "sentence-order-summary" },
        ],
      },
      {
        id: "sentence-omission", chapterId: "sentence-map", order: 2,
        blocks: [
          { type: "rule", copyId: "sentence-omission-rule", gear: "は" },
          { type: "comparison", copyId: "sentence-omission-examples", exampleIds: ["topic-copula", "omitted-subject", "this-water"] },
          { type: "summary", copyId: "sentence-omission-summary" },
        ],
      },
    ],
  },
  {
    id: "actions", order: 3, emoji: "⚙️", locked: false,
    lessons: [
      {
        id: "actions-object", chapterId: "actions", order: 1,
        blocks: [
          { type: "rule", copyId: "actions-object-rule", gear: "を" },
          { type: "comparison", copyId: "actions-object-examples", exampleIds: ["eat-ramen", "drink-water"] },
          { type: "guidedTool", copyId: "actions-object-tool", target: "lab", preset: { scenarioId: "eat", form: "pres", timeId: "none", options: { object: "ramen", place: null } } },
          { type: "summary", copyId: "actions-object-summary" },
        ],
      },
      {
        id: "actions-masu", chapterId: "actions", order: 2,
        blocks: [
          { type: "rule", copyId: "actions-masu-rule", gear: "ます" },
          { type: "comparison", copyId: "actions-masu-examples", exampleIds: ["eat-sushi", "speak-english"] },
          { type: "guidedTool", copyId: "actions-masu-tool", target: "lab", preset: { scenarioId: "speak", form: "pres", timeId: "today", options: { language: "englishLanguage" } } },
          { type: "summary", copyId: "actions-masu-summary" },
        ],
      },
    ],
  },
  {
    id: "time", order: 4, emoji: "🕒", locked: false,
    lessons: [
      {
        id: "time-past", chapterId: "time", order: 1,
        blocks: [
          { type: "rule", copyId: "time-past-rule", gear: "ました" },
          { type: "comparison", copyId: "time-past-examples", exampleIds: ["today-eat", "yesterday-ate", "tomorrow-eat"] },
          { type: "guidedTool", copyId: "time-past-tool", target: "lab", preset: { scenarioId: "eat", form: "past", timeId: "yesterday", options: { object: "ramen", place: null } } },
          { type: "summary", copyId: "time-past-summary" },
        ],
      },
      {
        id: "time-negative", chapterId: "time", order: 2,
        blocks: [
          { type: "rule", copyId: "time-negative-rule", gear: "ません" },
          { type: "comparison", copyId: "time-negative-examples", exampleIds: ["today-not-eat", "yesterday-not-eat"] },
          { type: "guidedTool", copyId: "time-negative-tool", target: "lab", preset: { scenarioId: "eat", form: "neg", timeId: "today", options: { object: "ramen", place: null } } },
          { type: "summary", copyId: "time-negative-summary" },
        ],
      },
    ],
  },
  {
    id: "places", order: 5, emoji: "🚉", locked: false,
    lessons: [
      {
        id: "places-action", chapterId: "places", order: 1,
        blocks: [
          { type: "rule", copyId: "places-action-rule", gear: "で" },
          { type: "comparison", copyId: "places-action-examples", exampleIds: ["restaurant-eat", "home-drink"] },
          { type: "guidedTool", copyId: "places-action-tool", target: "lab", preset: { scenarioId: "eat", form: "pres", timeId: "today", options: { object: "ramen", place: "restaurant" } } },
          { type: "summary", copyId: "places-action-summary" },
        ],
      },
      {
        id: "places-movement", chapterId: "places", order: 2,
        blocks: [
          { type: "rule", copyId: "places-movement-rule", gear: "に・で" },
          { type: "comparison", copyId: "places-movement-examples", exampleIds: ["go-station", "go-by-train", "board-train", "return-godan"] },
          { type: "guidedTool", copyId: "places-movement-tool", target: "lab", preset: { scenarioId: "go", form: "pres", timeId: "today", options: { destination: "station", transport: "train" } } },
          { type: "summary", copyId: "places-movement-summary" },
        ],
      },
    ],
  },
  {
    id: "people", order: 6, emoji: "🤝", locked: false,
    lessons: [
      {
        id: "people-particles", chapterId: "people", order: 1,
        blocks: [
          { type: "rule", copyId: "people-particles-rule", gear: "に・を" },
          { type: "comparison", copyId: "people-particles-examples", exampleIds: ["meet-friend", "wait-friend"] },
          { type: "guidedTool", copyId: "people-particles-tool", target: "lab", preset: { scenarioId: "meet", form: "pres", timeId: "today", options: { person: "friend" } } },
          { type: "summary", copyId: "people-particles-summary" },
        ],
      },
      {
        id: "people-desire", chapterId: "people", order: 2,
        blocks: [
          { type: "rule", copyId: "people-desire-rule", gear: "たい・ましょう" },
          { type: "comparison", copyId: "people-desire-examples", exampleIds: ["want-sushi", "lets-go"] },
          { type: "guidedTool", copyId: "people-desire-tool", target: "lab", preset: { scenarioId: "eat", form: "des", timeId: "today", options: { object: "sushi", place: null } } },
          { type: "summary", copyId: "people-desire-summary" },
        ],
      },
    ],
  },
  {
    id: "travel-patterns", order: 7, emoji: "🧳", locked: false,
    lessons: [
      {
        id: "travel-questions", chapterId: "travel-patterns", order: 1,
        blocks: [
          { type: "rule", copyId: "travel-questions-rule", gear: "か・ください" },
          { type: "comparison", copyId: "travel-questions-examples", exampleIds: ["where-station", "where-hotel", "where-shop", "water-please", "menu-please"] },
          { type: "guidedTool", copyId: "travel-questions-tool", target: "lab", preset: { scenarioId: "go", form: "pres", timeId: "today", options: { destination: "station", transport: null } } },
          { type: "summary", copyId: "travel-questions-summary" },
        ],
      },
      {
        id: "travel-existence", chapterId: "travel-patterns", order: 2,
        blocks: [
          { type: "rule", copyId: "travel-existence-rule", gear: "あります・います" },
          { type: "comparison", copyId: "travel-existence-examples", exampleIds: ["restroom-exists", "teacher-exists"] },
          { type: "summary", copyId: "travel-existence-summary" },
        ],
      },
    ],
  },
  {
    id: "traps", order: 8, emoji: "💡", locked: false,
    lessons: [
      {
        id: "traps-particles", chapterId: "traps", order: 1,
        blocks: [
          { type: "rule", copyId: "traps-particles-rule", gear: "は・へ・を" },
          { type: "comparison", copyId: "traps-particles-examples", exampleIds: ["particle-wa", "particle-e", "eat-ramen"] },
          { type: "callout", copyId: "traps-omission-callout", tone: "note" },
          { type: "callout", copyId: "traps-existence-callout", tone: "exception" },
          { type: "callout", copyId: "traps-loanwords-callout", tone: "note" },
          { type: "summary", copyId: "traps-particles-summary" },
        ],
      },
      {
        id: "traps-verbs", chapterId: "traps", order: 2,
        blocks: [
          { type: "rule", copyId: "traps-verbs-rule", gear: "かえり" },
          { type: "comparison", copyId: "traps-verbs-examples", exampleIds: ["return-godan", "tomorrow-return"] },
          { type: "guidedTool", copyId: "traps-verbs-tool", target: "lab", preset: { scenarioId: "return", form: "pres", timeId: "tomorrow", options: { destination: "home" } } },
          { type: "summary", copyId: "traps-verbs-summary" },
        ],
      },
    ],
  },
];
```

- [ ] **Step 6: Implement validation**

Create `src/course/data/validate.ts`:

```ts
import { resolveLabSelection } from "../../content/selection";
import { classifyNaturalness } from "../../lab/engine/naturalness";
import type { Chapter, StaticExample } from "./types";

export function validateCourse(
  chapters: Chapter[],
  examples: Record<string, StaticExample>,
): string[] {
  const errors: string[] = [];
  const chapterIds = new Set<string>();
  const lessonIds = new Set<string>();
  for (const chapter of chapters) {
    if (chapterIds.has(chapter.id)) errors.push(`duplicate chapter:${chapter.id}`);
    chapterIds.add(chapter.id);
    for (const lesson of chapter.lessons) {
      if (lesson.chapterId !== chapter.id) {
        errors.push(`wrong chapter:${lesson.id}`);
      }
      if (lessonIds.has(lesson.id)) errors.push(`duplicate lesson:${lesson.id}`);
      lessonIds.add(lesson.id);
      for (const block of lesson.blocks) {
        if ("exampleIds" in block) {
          for (const id of block.exampleIds) {
            if (!examples[id]) errors.push(`unknown example:${lesson.id}:${id}`);
          }
        }
        if (block.type === "guidedTool" && block.target === "lab") {
          if (!block.preset) {
            errors.push(`missing preset:${lesson.id}`);
            continue;
          }
          try {
            resolveLabSelection(block.preset);
            const naturalness = classifyNaturalness(
              block.preset.form,
              block.preset.timeId,
            );
            if (naturalness !== "natural") {
              errors.push(`non-natural preset:${lesson.id}:${naturalness}`);
            }
          } catch (error) {
            const reason =
              error instanceof Error ? error.message : "unknown selection error";
            errors.push(`invalid preset:${lesson.id}:${reason}`);
          }
        }
      }
    }
  }
  for (const example of Object.values(examples)) {
    if (!example.segments) continue;
    if (example.segments.map((segment) => segment.jp).join("") !== example.jp) {
      errors.push(`example jp segments:${example.id}`);
    }
    if (
      example.segments.map((segment) => segment.romaji).join("") !==
      example.romaji
    ) {
      errors.push(`example romaji segments:${example.id}`);
    }
  }
  return errors;
}
```

- [ ] **Step 7: Run and commit**

```bash
npx vitest run src/course/data/validate.test.ts
npx tsc --noEmit
git add src/course/data
git commit -m "feat(course): define eight-chapter learning path"
```

---

### Task 3: Complete bilingual course copy

**Files:**
- Create: `src/course/i18n/types.ts`
- Create: `src/course/i18n/it.ts`
- Create: `src/course/i18n/en.ts`
- Create: `src/course/i18n/catalog.ts`
- Create: `src/course/i18n/validate.test.ts`

- [ ] **Step 1: Define course copy types**

Create `src/course/i18n/types.ts`:

```ts
import type { ChapterId } from "../data/types";

export interface BlockCopy {
  eyebrow?: string;
  title: string;
  body?: string;
  bullets?: string[];
  action?: string;
}

export interface ExampleCopy {
  translation: string;
  note?: string;
}

export interface LessonCopy {
  title: string;
  lead: string;
}

export interface ChapterCopy {
  title: string;
  description: string;
}

export interface CourseCopy {
  home: {
    eyebrow: string;
    title: string;
    lead: string;
    continue: string;
    completed: string;
    start: string;
    review: string;
    reset: string;
    resetConfirm: string;
    corruptProgress: string;
    dismiss: string;
    invalidRoute: (path: string) => string;
    lessonsProgress: (completed: number, total: number) => string;
  };
  lesson: {
    back: string;
    chapterPosition: (current: number, total: number) => string;
    complete: string;
    undoComplete: string;
    previous: string;
    next: string;
    listen: string;
    playing: string;
  };
  practice: {
    eyebrow: string;
    title: string;
    lead: string;
    labTitle: string;
    labBody: string;
    syllabaryTitle: string;
    syllabaryBody: string;
    open: string;
    guidedBoard: string;
    openGuidedLab: string;
    backToLesson: string;
    invalidPreset: string;
  };
  chapters: Record<ChapterId, ChapterCopy>;
  lessons: Record<string, LessonCopy>;
  blocks: Record<string, BlockCopy>;
  examples: Record<string, ExampleCopy>;
}
```

- [ ] **Step 2: Write failing bilingual coverage test**

Create `src/course/i18n/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { chapters } from "../data/course";
import { examples } from "../data/examples";
import { it as itCopy } from "./it";
import { en as enCopy } from "./en";

function collectStaticStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStaticStrings);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStaticStrings);
  }
  return [];
}

describe.each([itCopy, enCopy])("course locale", (copy) => {
  it("covers every chapter, lesson, block and example", () => {
    for (const chapter of chapters) {
      expect(copy.chapters[chapter.id]).toBeTruthy();
      for (const lesson of chapter.lessons) {
        expect(copy.lessons[lesson.id]).toBeTruthy();
        for (const block of lesson.blocks) {
          const blockCopy = copy.blocks[block.copyId];
          expect(blockCopy).toBeTruthy();
          if (block.type === "summary") {
            expect(blockCopy.bullets?.length).toBeGreaterThan(0);
          }
          if ("exampleIds" in block) {
            for (const exampleId of block.exampleIds) {
              expect(examples[exampleId]).toBeTruthy();
              expect(copy.examples[exampleId]).toBeTruthy();
            }
          }
        }
      }
    }
  });

  it("contains no blank visible copy", () => {
    const staticCopy = collectStaticStrings({
      home: copy.home,
      lesson: copy.lesson,
      practice: copy.practice,
      chapters: copy.chapters,
      lessons: copy.lessons,
      blocks: copy.blocks,
      examples: copy.examples,
    });
    expect(staticCopy.length).toBeGreaterThan(0);
    expect(staticCopy.every((value) => value.trim().length > 0)).toBe(true);
    expect(copy.home.invalidRoute("/missing").trim().length).toBeGreaterThan(0);
    expect(copy.home.lessonsProgress(1, 16).trim().length).toBeGreaterThan(0);
    expect(copy.lesson.chapterPosition(1, 8).trim().length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run and verify failure**

```bash
npx vitest run src/course/i18n/validate.test.ts
```

Expected: FAIL because the locale files do not exist.

- [ ] **Step 4: Add complete chapter and lesson copy**

Create `src/course/i18n/it.ts` and `src/course/i18n/en.ts` as objects satisfying
`CourseCopy`. Start each file with its exact shared UI copy:

```ts
// src/course/i18n/it.ts
import type { CourseCopy } from "./types";

const itUi = {
  home: {
    eyebrow: "Percorso guidato",
    title: "Costruisci il giapponese, un ingranaggio alla volta.",
    lead: "Parti dai suoni, impara a vedere i ruoli nella frase e arriva agli schemi più utili in viaggio.",
    continue: "Continua",
    completed: "Percorso completato",
    start: "Inizia",
    review: "Ripassa",
    reset: "Azzera i progressi",
    resetConfirm: "Vuoi davvero azzerare i progressi del percorso?",
    corruptProgress: "I progressi del percorso erano illeggibili e sono stati azzerati. Lingua e scrittura non sono cambiate.",
    dismiss: "Chiudi",
    invalidRoute: (path: string) => `La pagina “${path}” non esiste. Sei tornato al percorso.`,
    lessonsProgress: (completed: number, total: number) =>
      `${completed} di ${total} lezioni`,
  },
  lesson: {
    back: "Tutti i capitoli",
    chapterPosition: (current: number, total: number) =>
      `Capitolo ${current} di ${total}`,
    complete: "Segna come completata",
    undoComplete: "Segna da ripassare",
    previous: "Lezione precedente",
    next: "Lezione successiva",
    listen: "Ascolta",
    playing: "In riproduzione…",
  },
  practice: {
    eyebrow: "Pratica libera",
    title: "Esplora senza perdere il filo.",
    lead: "Apri gli strumenti quando vuoi: il percorso resta sempre disponibile.",
    labTitle: "Laboratorio delle frasi",
    labBody: "Combina tempo, ruoli e forma verbale sulla lavagna.",
    syllabaryTitle: "Sillabario hiragana",
    syllabaryBody: "Ascolta i segni di base e allenati a riconoscerli.",
    open: "Apri",
    guidedBoard: "Lavagna guidata",
    openGuidedLab: "Apri il Laboratorio guidato",
    backToLesson: "Torna alla lezione",
    invalidPreset: "Il collegamento guidato non è valido: il Laboratorio è partito dai valori iniziali.",
  },
} satisfies Pick<CourseCopy, "home" | "lesson" | "practice">;
```

```ts
// src/course/i18n/en.ts
import type { CourseCopy } from "./types";

const enUi = {
  home: {
    eyebrow: "Guided course",
    title: "Build Japanese one gear at a time.",
    lead: "Start with sounds, learn to see sentence roles, and reach the patterns most useful while traveling.",
    continue: "Continue",
    completed: "Course complete",
    start: "Start",
    review: "Review",
    reset: "Reset progress",
    resetConfirm: "Do you really want to reset your course progress?",
    corruptProgress: "Course progress could not be read and was reset. Language and script settings were not changed.",
    dismiss: "Dismiss",
    invalidRoute: (path: string) => `“${path}” does not exist. You are back at the course.`,
    lessonsProgress: (completed: number, total: number) =>
      `${completed} of ${total} lessons`,
  },
  lesson: {
    back: "All chapters",
    chapterPosition: (current: number, total: number) =>
      `Chapter ${current} of ${total}`,
    complete: "Mark lesson complete",
    undoComplete: "Mark for review",
    previous: "Previous lesson",
    next: "Next lesson",
    listen: "Listen",
    playing: "Playing…",
  },
  practice: {
    eyebrow: "Free practice",
    title: "Explore without losing the thread.",
    lead: "Open the tools whenever you want; the guided course stays available.",
    labTitle: "Sentence Lab",
    labBody: "Combine time, roles, and verb form on the board.",
    syllabaryTitle: "Hiragana chart",
    syllabaryBody: "Hear the core signs and practice recognizing them.",
    open: "Open",
    guidedBoard: "Guided board",
    openGuidedLab: "Open the guided Sentence Lab",
    backToLesson: "Back to lesson",
    invalidPreset: "This guided link is invalid, so the Sentence Lab opened with its default values.",
  },
} satisfies Pick<CourseCopy, "home" | "lesson" | "practice">;
```

Use this exact bilingual table:

Store the translated rows as `const itChapters: CourseCopy["chapters"]`,
`const enChapters: CourseCopy["chapters"]`, `const itLessons:
CourseCopy["lessons"]`, and `const enLessons: CourseCopy["lessons"]` in their
respective locale files.

| Chapter | IT title / description | EN title / description |
|---|---|---|
| sounds | Suoni e hiragana / Leggi e ascolta i segni che userai in tutto il percorso. | Sounds and hiragana / Read and hear the signs used throughout the course. |
| sentence-map | La mappa della frase / Vedi dove vanno tema, dettagli e verbo. | The sentence map / See where the topic, details, and verb belong. |
| actions | Azioni e oggetti / Collega l'oggetto dell'azione al verbo con を. | Actions and objects / Link an action's object to the verb with を. |
| time | Quando succede? / Cambia tempo e passa dall'affermativo al negativo senza perdere la struttura. | When does it happen? / Change time and switch between affirmative and negative without losing the structure. |
| places | Luoghi e movimento / Distingui dove agisci, dove vai e come ti muovi. | Places and movement / Distinguish where you act, where you go, and how you travel. |
| people | Persone, desideri e inviti / Collega persone, desideri e proposte. | People, wishes, and invitations / Connect people, wishes, and suggestions. |
| travel-patterns | Schemi pratici da viaggio / Fai domande, formula richieste e indica che qualcosa o qualcuno c'è. | Practical travel patterns / Ask questions, make requests, and say that something or someone is there. |
| traps | Trappole ed eccezioni / Riconosci le eccezioni che incontrerai più spesso. | Common traps and exceptions / Recognize the exceptions you will meet most often. |

Lesson titles/leads:

| Lesson | IT | EN |
|---|---|---|
| sounds-core | I cinque suoni di base / Parti dalle vocali: restano riconoscibili in ogni riga. | The five core sounds / Start with vowels: they remain recognizable in every row. |
| sounds-special | Piccoli segni, grandi differenze / っ e le vocali lunghe cambiano ritmo e significato. | Small signs, big differences / っ and long vowels change rhythm and meaning. |
| sentence-order | Il verbo chiude la frase / I dettagli arrivano prima; l'azione principale arriva alla fine. | The verb closes the sentence / Details come first; the main action comes last. |
| sentence-omission | Di chi stiamo parlando? / は introduce il tema; ciò che è ovvio può sparire. | Who are we talking about? / は introduces the topic; obvious information can disappear. |
| actions-object | Che cosa riceve l'azione? / を viene dopo l'oggetto diretto. | What receives the action? / を follows the direct object. |
| actions-masu | La base resta, la coda cambia / ます crea una forma cortese e riutilizzabile. | The base stays, the ending changes / ます creates a reusable polite form. |
| time-past | Oggi o ieri? / ます e ました mostrano se l'azione è conclusa. | Today or yesterday? / ます and ました show whether the action is complete. |
| time-negative | Quando non succede / ません e ませんでした negano senza cambiare la base. | When it does not happen / ません and ませんでした negate without changing the base. |
| places-action | Dove avviene? / で marca il luogo in cui si svolge l'azione. | Where does it happen? / で marks where the action takes place. |
| places-movement | Meta, mezzo o veicolo? / に e で segnano ruoli diversi secondo ciò che vuoi dire. | Destination, transport, or vehicle? / に and で mark different roles depending on meaning. |
| people-particles | La particella dipende dal verbo / Incontri qualcuno con に, aspetti qualcuno con を. | The verb chooses the particle / You meet someone with に and wait for someone with を. |
| people-desire | Voglio… Facciamo…? / たいです esprime desiderio; ましょう propone. | I want to… Shall we…? / たいです expresses desire; ましょう makes a suggestion. |
| travel-questions | Chiedere con cortesia / か trasforma la frase in domanda; ください serve per fare una richiesta. | Ask politely / か makes a question; ください requests something. |
| travel-existence | C'è qualcosa o qualcuno? / あります si usa per cose; います per persone e animali. | Is there something or someone? / あります is for things; います is for people and animals. |
| traps-particles | Si scrive così, si legge diversamente / Come particelle, は・へ・を hanno pronunce speciali. | Written one way, pronounced another / As particles, は・へ・を have special readings. |
| traps-verbs | る non basta per riconoscere il gruppo / かえる è godan; il futuro resta implicito. | る does not identify the group / かえる is godan; the future remains implicit. |

- [ ] **Step 5: Add complete block copy**

For each `copyId`, create one `BlockCopy`. Use the following exact content. The text before `/` is IT; the text after `/` is EN.

Store the resulting maps as `const itBlocks: CourseCopy["blocks"]` and
`const enBlocks: CourseCopy["blocks"]`.

| Copy ID | Title | Body or bullets |
|---|---|---|
| sounds-core-rule | Cinque vocali stabili / Five stable vowels | Ogni riga combina una consonante con a・i・u・e・o. / Each row combines a consonant with a・i・u・e・o. |
| sounds-core-examples | Leggi per colonne / Read by columns | Ascolta senza imporre il ritmo dell'italiano. / Listen without forcing English-like stress. |
| sounds-core-tool | Esplora segni base e suoni modificati / Explore core signs and modified sounds | Percorri i 46 segni, poi confronta dakuten e handakuten nel Sillabario. / Work through the 46 signs, then compare dakuten and handakuten in the hiragana chart. |
| sounds-core-summary | Ricorda / Remember | IT=`Ogni segno ha un ritmo breve`,`Il rōmaji è un aiuto temporaneo`,`Ascolta e ripeti`; EN=`Each sign has a short beat`,`Rōmaji is temporary support`,`Listen and repeat`. |
| sounds-special-rule | Il ritmo è scritto / Rhythm is written | っ crea una pausa e raddoppia; una vocale lunga dura due tempi. / っ creates a pause and doubling; a long vowel lasts two beats. |
| sounds-special-examples | Confronta durata e pausa / Compare length and pause | Non saltare i piccoli segni. / Do not skip small signs. |
| sounds-special-tool | Cerca っ, ゃ, ゅ, ょ / Find っ, ゃ, ゅ, ょ | Usa le sezioni speciali del Sillabario. / Use the special sections of the chart. |
| sounds-special-summary | Ricorda / Remember | IT=`っ non si pronuncia da solo`,`Una vocale lunga dura due battiti`,`ん è una mora autonoma`; EN=`っ is not pronounced by itself`,`A long vowel lasts two beats`,`ん is an independent mora`. |
| sentence-order-rule | I dettagli prima, il verbo alla fine / Details first, verb last | Parti dall'azione e aggiungi ciò che serve davanti. / Start from the action and add needed details before it. |
| sentence-order-examples | Segui il percorso / Follow the path | Tempo → oggetto → verbo. / Time → object → verb. |
| sentence-order-topic | は mette il tema sul tavolo / は puts the topic on the table | Non tradurre は parola per parola; quando è particella, si pronuncia wa. / Do not translate は word for word; as a particle, it is pronounced wa. |
| sentence-order-tool | Apri la prima lavagna / Open the first board | Osserva come tempo, oggetto e verbo occupano posizioni diverse. / See how time, object, and verb occupy different positions. |
| sentence-order-summary | Ricorda / Remember | IT=`Il verbo tende a chiudere la frase`,`Le particelle mostrano i ruoli`,`L'ordine italiano non va copiato`; EN=`The verb tends to come last`,`Particles show roles`,`Do not copy English word order`. |
| sentence-omission-rule | Ciò che è ovvio può sparire / Obvious information can disappear | Se il contesto è chiaro, io, tu o lui/lei spesso non vengono detti. / If context is clear, I, you, he, or she are often omitted. |
| sentence-omission-examples | Con e senza tema / With and without a topic | りっちです può bastare dopo “come ti chiami?”. / りっちです can be enough after “what is your name?”. |
| sentence-omission-summary | Ricorda / Remember | IT=`は indica il tema`,`です rende cortese la frase nominale`,`Non aggiungere sempre わたし`; EN=`は marks the topic`,`です makes a noun sentence polite`,`Do not always add わたし`. |
| actions-object-rule | Nome + を + verbo / Noun + を + verb | を etichetta ciò su cui agisce il verbo. / を labels what the verb acts on. |
| actions-object-examples | Stessa struttura, azioni diverse / Same structure, different actions | Cambiano nome e verbo; を mantiene il ruolo. / Noun and verb change; を keeps the role. |
| actions-object-tool | Muovi l'oggetto sulla lavagna / Move the object on the board | Parti da “mangiare”, poi cambia scenario: bere, comprare, guardare o parlare. / Start with “eat,” then switch scenarios: drink, buy, watch, or speak. |
| actions-object-summary | Ricorda / Remember | IT=`を segue l'oggetto`,`を si pronuncia o`,`Il verbo resta in fondo`; EN=`を follows the object`,`を is pronounced o`,`The verb stays at the end`. |
| actions-masu-rule | Base della forma in ます + desinenza / ます-form base + ending | La parte che precede ます si riusa nelle forme cortesi. / The part before ます is reused in polite forms. |
| actions-masu-examples | Trova la base / Find the base | たべ・はなし restano visibili. / たべ・はなし remain visible. |
| actions-masu-tool | Cambia verbo, conserva la forma / Change verb, keep the form | Confronta parlare e mangiare. / Compare speaking and eating. |
| actions-masu-summary | Ricorda / Remember | IT=`ます è cortese`,`La base dipende dal gruppo`,`La desinenza è l'ingranaggio`; EN=`ます is polite`,`The base depends on the verb group`,`The ending is the gear`. |
| time-past-rule | ます → ました / ます → ました | La base non cambia; ました indica azione conclusa. / The base stays; ました marks a completed action. |
| time-past-examples | Oggi e ieri / Today and yesterday | L'avverbio e la desinenza devono raccontare lo stesso tempo. / Adverb and ending must tell the same time. |
| time-past-tool | Trasforma la frase / Transform the sentence | Passa da oggi a ieri e osserva la coda. / Move from today to yesterday and watch the ending. |
| time-past-summary | Ricorda / Remember | IT=`ます è non-passato`,`ました è passato`,`Il futuro usa ancora ます`; EN=`ます is non-past`,`ました is past`,`The future still uses ます`. |
| time-negative-rule | ません e ませんでした / ません and ませんでした | La negazione vive nella desinenza. / Negation lives in the ending. |
| time-negative-examples | Non ora, non ieri / Not now, not yesterday | ません è non-passato; ませんでした è passato. / ません is non-past; ませんでした is past. |
| time-negative-tool | Accendi e spegni l'azione / Turn the action on and off | Confronta affermativo e negativo. / Compare affirmative and negative. |
| time-negative-summary | Ricorda / Remember | IT=`ません nega il non-passato`,`ませんでした nega il passato`,`La base resta riconoscibile`; EN=`ません negates the non-past`,`ませんでした negates the past`,`The base stays recognizable`. |
| places-action-rule | Luogo + で / Place + で | で dice dove si svolge l'azione. / で says where the action happens. |
| places-action-examples | Ristorante o casa / Restaurant or home | Il luogo cambia, l'azione resta. / The place changes, the action stays. |
| places-action-tool | Aggiungi e togli il luogo / Add and remove the place | Il luogo è opzionale se il contesto è chiaro. / The place is optional when context is clear. |
| places-action-summary | Ricorda / Remember | IT=`で = luogo dell'azione`,`Non usare に per questa funzione`,`Il luogo precede l'oggetto`; EN=`で = place of action`,`Do not use に for this role`,`The place comes before the object`. |
| places-movement-rule | に per la meta, で per il mezzo / に for destination, で for transport | Con のる, il veicolo usa に perché è ciò su cui sali. Per indicare la direzione incontrerai anche へ, pronunciata e. / With のる, the vehicle uses に because it is what you board. You will also meet へ, pronounced e, for direction. |
| places-movement-examples | Tre ruoli, due particelle / Three roles, two particles | Meta, mezzo e veicolo non sono la stessa cosa. / Destination, transport, and boarded vehicle are different. |
| places-movement-tool | Costruisci un viaggio / Build a trip | Scegli meta e mezzo separatamente. / Choose destination and transport separately. |
| places-movement-summary | Ricorda / Remember | IT=`えきに = verso la stazione`,`でんしゃで = in treno`,`でんしゃにのる = salire sul treno`; EN=`えきに = to the station`,`でんしゃで = by train`,`でんしゃにのる = board the train`. |
| people-particles-rule | Il verbo sceglie il collegamento / The verb chooses the link | あう usa に; まつ usa を. / あう uses に; まつ uses を. |
| people-particles-examples | Incontrare e aspettare / Meet and wait | Non scegliere la particella traducendo “persona”. / Do not choose the particle by translating “person”. |
| people-particles-tool | Cambia persona / Change the person | Prova amico, insegnante e famiglia. / Try friend, teacher, and family. |
| people-particles-summary | Ricorda / Remember | IT=`ともだちにあう`,`ともだちをまつ`,`Impara verbo + particella insieme`; EN=`ともだちにあう`,`ともだちをまつ`,`Learn verb + particle together`. |
| people-desire-rule | Base + たいです; base + ましょう / Base + たいです; base + ましょう | Una forma esprime desiderio, l'altra propone un'azione condivisa. / One expresses desire; the other proposes shared action. |
| people-desire-examples | Voglio o facciamo? / Want or shall we? | Guarda chi compie l'azione. / Notice who performs the action. |
| people-desire-tool | Cambia intenzione / Transform intent | Passa da mangio a voglio mangiare. / Move from I eat to I want to eat. |
| people-desire-summary | Ricorda / Remember | IT=`たいです = desiderio personale`,`ましょう = proposta`,`Non sono tempi verbali`; EN=`たいです = personal desire`,`ましょう = suggestion`,`They are not verb tenses`. |
| travel-questions-rule | か chiude la domanda; ください formula una richiesta / か closes a question; ください makes a request | Sono schemi fissi molto utili in viaggio. / These are highly useful fixed travel patterns. |
| travel-questions-examples | Dove? Per favore. / Where? Please. | Ascolta l'intonazione ma riconosci anche la struttura. / Listen to intonation and recognize the structure. |
| travel-questions-tool | Porta lo schema alla stazione / Put the pattern into a station scenario | Apri una frase di movimento e osserva la destinazione con に. / Open a movement sentence and notice the destination marked by に. |
| travel-questions-summary | Ricorda / Remember | IT=`ですか = domanda cortese`,`〜をください = vorrei…`,`Evita di tradurre ogni parola`; EN=`ですか = polite question`,`〜をください = I'd like…`,`Avoid translating every word`. |
| travel-existence-rule | あります per cose; います per esseri animati / あります for things; います for animate beings | Entrambi significano “esserci/esistere”, ma la scelta dipende da ciò che esiste. / Both express existence; the choice depends on what exists. |
| travel-existence-examples | Bagno o insegnante? / Restroom or teacher? | Una cosa usa あります; una persona usa います. / A thing uses あります; a person uses います. |
| travel-existence-summary | Ricorda / Remember | IT=`cose = あります`,`persone/animali = います`,`が marca ciò che esiste`; EN=`things = あります`,`people/animals = います`,`が marks what exists`. |
| traps-particles-rule | は→wa, へ→e, を→o / は→wa, へ→e, を→o | Queste letture speciali compaiono quando i segni sono particelle. / These special readings occur when the signs are particles. |
| traps-particles-examples | Leggi il ruolo, non solo il segno / Read the role, not only the sign | La stessa grafia può avere una lettura diversa fuori dalla particella. / The same sign can be read differently outside particle use. |
| traps-omission-callout | Il soggetto può restare sottinteso / The subject can stay implicit | Se il contesto è chiaro, il giapponese non ripete io, tu o lui/lei: non aggiungere sempre わたし. / When context is clear, Japanese does not repeat I, you, or he/she: do not always add わたし. |
| traps-existence-callout | Cose e persone non “esistono” allo stesso modo / Things and people do not “exist” the same way | Usa あります per cose; usa います per persone e animali. / Use あります for things and います for people and animals. |
| traps-loanwords-callout | Qui i prestiti restano in hiragana / Loanwords stay in hiragana here | Per allenare la lettura, l'app mostra parole come れすとらん in hiragana; nel giapponese reale i prestiti si scrivono normalmente in katakana: レストラン. / For reading practice, the app shows words such as れすとらん in hiragana; real Japanese normally writes loanwords in katakana: レストラン. |
| traps-particles-summary | Ricorda / Remember | IT=`In こんにちは, は si legge wa`,`Come particella, へ si legge e`,`Come particella, を si legge o`; EN=`In こんにちは, は is read wa`,`As a particle, へ is read e`,`As a particle, を is read o`. |
| traps-verbs-rule | かえる è godan / かえる is godan | Finire in る non basta: qui la base è かえり. / Ending in る is not enough: the base here is かえり. |
| traps-verbs-examples | Gruppo ed effetto del tempo / Group and time effect | あした cambia la traduzione, non la forma ます. / あした changes the translation, not the ます form. |
| traps-verbs-tool | Verifica sulla lavagna / Check it on the board | Apri “Tornare” con domani. / Open “Go back” with tomorrow. |
| traps-verbs-summary | Ricorda / Remember | IT=`かえる→かえります`,`Il gruppo va imparato insieme al verbo`,`Il futuro è espresso dal contesto`; EN=`かえる→かえります`,`Learn the group together with the verb`,`Context expresses the future`. |

For every summary row, store three explicit translated strings, not slash-delimited source text.

- [ ] **Step 6: Add example translations**

Create an entry for every example ID with these translations:

Store the maps as `const itExamples: CourseCopy["examples"]` and
`const enExamples: CourseCopy["examples"]`. Then finish each locale file:

```ts
// src/course/i18n/it.ts
export const it = {
  ...itUi,
  chapters: itChapters,
  lessons: itLessons,
  blocks: itBlocks,
  examples: itExamples,
} satisfies CourseCopy;
```

```ts
// src/course/i18n/en.ts
export const en = {
  ...enUi,
  chapters: enChapters,
  lessons: enLessons,
  blocks: enBlocks,
  examples: enExamples,
} satisfies CourseCopy;
```

| ID | IT | EN |
|---|---|---|
| vowels | a · i · u · e · o | a · i · u · e · o |
| k-row | ka · ki · ku · ke · ko | ka · ki · ku · ke · ko |
| small-tsu | scuola | school |
| long-vowel | oggi | today |
| sentence-order | Oggi mangio il ramen. | Today, I'm eating ramen. |
| topic-copula | Sono Ricchi. | I am Ricchi. |
| omitted-subject | Sono Ricchi. | I'm Ricchi. |
| this-water | Questa è dell'acqua. | This is water. |
| eat-ramen | Mangio il ramen. | I eat ramen. |
| drink-water | Bevo dell'acqua. | I drink water. |
| eat-sushi | Mangio il sushi. | I eat sushi. |
| speak-english | Parlo inglese. | I speak English. |
| today-eat | Oggi mangio il ramen. | Today, I'm eating ramen. |
| tomorrow-eat | Domani mangerò il ramen. | Tomorrow, I'll eat ramen. |
| yesterday-ate | Ieri ho mangiato il ramen. | Yesterday, I ate ramen. |
| today-not-eat | Oggi non mangio il ramen. | Today, I'm not eating ramen. |
| yesterday-not-eat | Ieri non ho mangiato il ramen. | Yesterday, I didn't eat ramen. |
| restaurant-eat | Mangio il ramen al ristorante. | I eat ramen at the restaurant. |
| home-drink | Bevo il tè a casa. | I drink tea at home. |
| go-station | Vado alla stazione. | I go to the station. |
| go-by-train | Vado in treno. | I go by train. |
| board-train | Salgo sul treno. | I board the train. |
| meet-friend | Incontro un amico. | I meet a friend. |
| wait-friend | Aspetto un amico. | I wait for a friend. |
| want-sushi | Voglio mangiare il sushi. | I want to eat sushi. |
| lets-go | Andiamo alla stazione. | Let's go to the station. |
| where-station | Dov'è la stazione? | Where is the station? |
| where-hotel | Dov'è l'hotel? | Where is the hotel? |
| where-shop | Dov'è il negozio? | Where is the shop? |
| water-please | Dell'acqua, per favore. | Water, please. |
| menu-please | Il menù, per favore. | The menu, please. |
| restroom-exists | C'è un bagno. | There is a restroom. |
| teacher-exists | C'è un insegnante. | There is a teacher. |
| particle-wa | Buongiorno. | Hello. |
| particle-e | Vado verso la stazione. | I go toward the station. |
| return-godan | Torno a casa. | I go back home. |
| tomorrow-return | Domani tornerò a casa. | Tomorrow, I'll go back home. |

- [ ] **Step 7: Create locale catalog lookup and run tests**

`src/course/i18n/catalog.ts`:

```ts
import type { Locale } from "../../i18n/LocaleContext";
import { it } from "./it";
import { en } from "./en";

export const courseCatalog = { it, en } as const;

export function getCourseCopy(locale: Locale) {
  return courseCatalog[locale];
}
```

Run:

```bash
npx vitest run src/course/i18n/validate.test.ts
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add src/course/i18n
git commit -m "feat(course): add complete Italian and English lessons"
```

---

### Task 4: Versioned local progress

**Files:**
- Create: `src/course/progress/progress.ts`
- Create: `src/course/progress/progress.test.ts`
- Create: `src/course/progress/ProgressContext.tsx`
- Modify: `src/App.tsx`
- Modify: `src/i18n/it.ts`
- Modify: `src/i18n/en.ts`

- [ ] **Step 1: Write progress tests**

Create `src/course/progress/progress.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  emptyProgress,
  parseProgress,
  setLessonComplete,
  setLastVisited,
  completionPercent,
} from "./progress";
import {
  loadProgress,
  resetStoredProgress,
  STORAGE_KEY,
} from "./ProgressContext";

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

describe("course progress", () => {
  it("parses valid v1 progress", () => {
    const parsed = parseProgress(JSON.stringify({
      schemaVersion: 1,
      completedLessonIds: ["sounds-core"],
      lastVisitedLessonId: "sounds-special",
      updatedAt: "2026-07-13T10:00:00.000Z",
    }));
    expect(parsed.progress.completedLessonIds).toEqual(["sounds-core"]);
    expect(parsed.corrupted).toBe(false);
  });

  it("isolates corrupt data", () => {
    expect(parseProgress("{bad")).toEqual({
      progress: emptyProgress(),
      corrupted: true,
    });
  });

  it("rejects unsupported schema versions", () => {
    const parsed = parseProgress(JSON.stringify({
      schemaVersion: 2,
      completedLessonIds: [],
      lastVisitedLessonId: null,
      updatedAt: "2026-07-13T10:00:00.000Z",
    }));
    expect(parsed.corrupted).toBe(true);
  });

  it("removes only the corrupt progress key", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, "{bad");
    storage.setItem("nihongo.locale.primary", "it");

    expect(loadProgress(storage).corrupted).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem("nihongo.locale.primary")).toBe("it");
  });

  it("resets only stored course progress", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ completedLessonIds: ["sounds-core"] }));
    storage.setItem("nihongo.script", "hiragana");

    expect(resetStoredProgress(storage)).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem("nihongo.script")).toBe("hiragana");
  });

  it("reports that null storage cannot persist progress", () => {
    expect(loadProgress(null).persistenceAvailable).toBe(false);
  });

  it("completes and reopens a lesson", () => {
    const done = setLessonComplete(emptyProgress(), "sounds-core", true);
    expect(done.completedLessonIds).toEqual(["sounds-core"]);
    expect(setLessonComplete(done, "sounds-core", false).completedLessonIds).toEqual([]);
  });

  it("records the last visited lesson", () => {
    expect(setLastVisited(emptyProgress(), "sounds-special").lastVisitedLessonId)
      .toBe("sounds-special");
  });

  it("calculates percentage across 16 lessons", () => {
    expect(completionPercent(["a", "b", "c", "d"], 16)).toBe(25);
  });
});
```

- [ ] **Step 2: Implement pure progress functions**

Create `src/course/progress/progress.ts`:

```ts
export interface CourseProgressV1 {
  schemaVersion: 1;
  completedLessonIds: string[];
  lastVisitedLessonId: string | null;
  updatedAt: string;
}

export function emptyProgress(): CourseProgressV1 {
  return {
    schemaVersion: 1,
    completedLessonIds: [],
    lastVisitedLessonId: null,
    updatedAt: new Date(0).toISOString(),
  };
}

export function parseProgress(raw: string | null): {
  progress: CourseProgressV1;
  corrupted: boolean;
} {
  if (raw === null) return { progress: emptyProgress(), corrupted: false };
  try {
    const value = JSON.parse(raw) as Partial<CourseProgressV1>;
    if (
      value.schemaVersion !== 1 ||
      !Array.isArray(value.completedLessonIds) ||
      !value.completedLessonIds.every((id) => typeof id === "string") ||
      !(value.lastVisitedLessonId === null || typeof value.lastVisitedLessonId === "string") ||
      typeof value.updatedAt !== "string"
    ) {
      return { progress: emptyProgress(), corrupted: true };
    }
    return { progress: value as CourseProgressV1, corrupted: false };
  } catch {
    return { progress: emptyProgress(), corrupted: true };
  }
}

export function setLessonComplete(
  progress: CourseProgressV1,
  lessonId: string,
  complete: boolean,
): CourseProgressV1 {
  const ids = new Set(progress.completedLessonIds);
  complete ? ids.add(lessonId) : ids.delete(lessonId);
  return {
    ...progress,
    completedLessonIds: [...ids],
    updatedAt: new Date().toISOString(),
  };
}

export function setLastVisited(
  progress: CourseProgressV1,
  lessonId: string,
): CourseProgressV1 {
  return {
    ...progress,
    lastVisitedLessonId: lessonId,
    updatedAt: new Date().toISOString(),
  };
}

export function completionPercent(completed: string[], total: number): number {
  return total === 0 ? 0 : Math.round((completed.length / total) * 100);
}
```

- [ ] **Step 3: Implement ProgressContext**

Create `src/course/progress/ProgressContext.tsx`:

```tsx
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  browserStorage,
  readSetting,
  removeSetting,
  writeSetting,
} from "../../settings/storage";
import {
  type CourseProgressV1,
  emptyProgress,
  parseProgress,
  setLastVisited,
  setLessonComplete,
} from "./progress";

export const STORAGE_KEY = "nihongo.course.progress";

interface ProgressContextValue {
  progress: CourseProgressV1;
  corrupted: boolean;
  persistenceAvailable: boolean;
  markVisited: (lessonId: string) => void;
  setComplete: (lessonId: string, complete: boolean) => void;
  dismissCorruption: () => void;
  reset: () => void;
}

interface InitialProgress {
  progress: CourseProgressV1;
  corrupted: boolean;
  persistenceAvailable: boolean;
}

export function loadProgress(storage: Storage | null): InitialProgress {
  const stored = readSetting(storage, STORAGE_KEY);
  const parsed = parseProgress(stored.value);
  const cleanupAvailable = parsed.corrupted
    ? removeSetting(storage, STORAGE_KEY)
    : stored.available;
  return {
    ...parsed,
    persistenceAvailable: stored.available && cleanupAvailable,
  };
}

export function resetStoredProgress(storage: Storage | null): boolean {
  return removeSetting(storage, STORAGE_KEY);
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => browserStorage(), []);
  const [initial] = useState(() => loadProgress(storage));
  const [progress, setProgress] = useState(initial.progress);
  const [corrupted, setCorrupted] = useState(initial.corrupted);
  const [persistenceAvailable, setPersistenceAvailable] = useState(
    initial.persistenceAvailable,
  );

  useEffect(() => {
    setPersistenceAvailable(
      writeSetting(storage, STORAGE_KEY, JSON.stringify(progress)),
    );
  }, [progress, storage]);

  const markVisited = useCallback((lessonId: string) => {
    setProgress((current) => setLastVisited(current, lessonId));
  }, []);

  const setComplete = useCallback((lessonId: string, complete: boolean) => {
    setProgress((current) => setLessonComplete(current, lessonId, complete));
  }, []);

  const dismissCorruption = useCallback(() => {
    setCorrupted(false);
  }, []);

  const reset = useCallback(() => {
    setCorrupted(false);
    setPersistenceAvailable(resetStoredProgress(storage));
    setProgress(emptyProgress());
  }, [storage]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      corrupted,
      persistenceAvailable,
      markVisited,
      setComplete,
      dismissCorruption,
      reset,
    }),
    [
      progress,
      corrupted,
      persistenceAvailable,
      markVisited,
      setComplete,
      dismissCorruption,
      reset,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used within ProgressProvider");
  return value;
}
```

The reset confirmation belongs to `CourseHome`; call `reset()` only after the user confirms.

- [ ] **Step 4: Wrap AppContent**

Add:

```tsx
import {
  ProgressProvider,
  useProgress,
} from "./course/progress/ProgressContext";
```

Add this component before `AppContent`:

```tsx
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
```

Replace the `HashRouter` return in `AppContent` with:

```tsx
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
```

Update the existing `settings.unavailable` copy now that course progress also
uses local storage:

```ts
// src/i18n/it.ts
unavailable:
  "Le preferenze e i progressi non possono essere salvati in questo browser.",

// src/i18n/en.ts
unavailable:
  "Preferences and progress cannot be saved in this browser.",
```

- [ ] **Step 5: Run tests and commit**

```bash
npx vitest run src/course/progress/progress.test.ts
npm run build
git add src/course/progress src/App.tsx src/i18n/it.ts src/i18n/en.ts
git commit -m "feat(course): add versioned local learning progress"
```

---

### Task 5: Course home

**Files:**
- Create: `src/course/components/CourseHome.tsx`
- Create: `src/course/components/ChapterCard.tsx`
- Create: `src/course/components/RouteNotice.tsx`
- Modify: `src/routing/routes.tsx`
- Create: `src/course/course.css`

- [ ] **Step 1: Replace the Course placeholder**

Create `src/course/components/CourseHome.tsx`:

```tsx
import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { chapters } from "../data/course";
import type { Lesson } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { completionPercent } from "../progress/progress";
import { useProgress } from "../progress/ProgressContext";
import { lessonPath } from "../../routing/routes";
import { ChapterCard } from "./ChapterCard";
import { RouteNotice } from "./RouteNotice";
import "../course.css";

const lessons = chapters.flatMap((chapter) => chapter.lessons);

function chapterFor(lesson: Lesson) {
  const chapter = chapters.find((item) => item.id === lesson.chapterId);
  if (!chapter) throw new Error(`Missing chapter for lesson ${lesson.id}`);
  return chapter;
}

export function CourseHome() {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { progress, corrupted, dismissCorruption, reset } = useProgress();
  const completed = new Set(progress.completedLessonIds);
  const firstIncomplete = lessons.find((lesson) => !completed.has(lesson.id));
  const lastVisited = lessons.find(
    (lesson) =>
      lesson.id === progress.lastVisitedLessonId && !completed.has(lesson.id),
  );
  const continuation = lastVisited ?? firstIncomplete ?? lessons[0];
  const continuationChapter = chapterFor(continuation);
  const completedCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const percent = completionPercent(
    lessons.filter((lesson) => completed.has(lesson.id)).map((lesson) => lesson.id),
    lessons.length,
  );
  const allComplete = completedCount === lessons.length;

  const resetProgress = () => {
    if (window.confirm(copy.home.resetConfirm)) reset();
  };

  return (
    <main className="course-home">
      <RouteNotice />
      {corrupted ? (
        <div className="route-notice" role="status">
          <p>{copy.home.corruptProgress}</p>
          <button type="button" onClick={dismissCorruption}>
            {copy.home.dismiss}
          </button>
        </div>
      ) : null}

      <section className="course-hero" aria-labelledby="course-title">
        <div>
          <p className="course-eyebrow">{copy.home.eyebrow}</p>
          <h1 id="course-title">{copy.home.title}</h1>
          <p className="course-lead">{copy.home.lead}</p>
        </div>
        <div className="course-hero__progress">
          <p>
            <strong>{allComplete ? copy.home.completed : `${percent}%`}</strong>
            <span>
              {copy.home.lessonsProgress(
                completedCount,
                lessons.length,
              )}
            </span>
          </p>
          <div
            className="course-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <Link
            className="course-primary-action"
            to={lessonPath(continuationChapter.id, continuation.id)}
          >
            {allComplete ? copy.home.review : copy.home.continue}
          </Link>
          <button
            className="course-reset"
            type="button"
            onClick={resetProgress}
            disabled={
              completedCount === 0 && progress.lastVisitedLessonId === null
            }
          >
            {copy.home.reset}
          </button>
        </div>
      </section>

      <section className="chapter-grid" aria-label={copy.home.eyebrow}>
        {chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            completedLessonIds={completed}
          />
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Implement ChapterCard**

Create `src/course/components/ChapterCard.tsx`:

```tsx
import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath } from "../../routing/routes";
import type { Chapter } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

interface ChapterCardProps {
  chapter: Chapter;
  completedLessonIds: ReadonlySet<string>;
}

export function ChapterCard({
  chapter,
  completedLessonIds,
}: ChapterCardProps) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const chapterCopy = copy.chapters[chapter.id];
  const completed = chapter.lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id)
  ).length;
  const total = chapter.lessons.length;
  const done = completed === total;
  const target =
    chapter.lessons.find((lesson) => !completedLessonIds.has(lesson.id)) ??
    chapter.lessons[0];
  const progressLabel = copy.home.lessonsProgress(completed, total);

  return (
    <article className={`chapter-card${done ? " is-complete" : ""}`}>
      <div className="chapter-card__meta">
        <span aria-hidden="true">{chapter.emoji}</span>
        <span>{String(chapter.order).padStart(2, "0")}</span>
        {done ? <span className="chapter-card__check" aria-hidden="true">✓</span> : null}
      </div>
      <h2>{chapterCopy.title}</h2>
      <p>{chapterCopy.description}</p>
      <div className="chapter-card__footer">
        <div>
          <span>{progressLabel}</span>
          <div
            className="course-progress course-progress--small"
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
          >
            <span style={{ width: `${(completed / total) * 100}%` }} />
          </div>
        </div>
        <Link
          to={lessonPath(chapter.id, target.id)}
          aria-label={`${done ? copy.home.review : copy.home.start}: ${chapterCopy.title}; ${progressLabel}`}
        >
          {done ? copy.home.review : copy.home.start}
        </Link>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Implement route notices**

Create `src/course/components/RouteNotice.tsx`:

```tsx
import { useLocation, useNavigate } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { getCourseCopy } from "../i18n/catalog";

function invalidPathFromState(state: unknown): string | null {
  if (
    typeof state === "object" &&
    state !== null &&
    "invalidPath" in state &&
    typeof state.invalidPath === "string"
  ) {
    return state.invalidPath;
  }
  return null;
}

export function RouteNotice() {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const location = useLocation();
  const navigate = useNavigate();
  const invalidPath = invalidPathFromState(location.state);

  if (!invalidPath) return null;

  return (
    <div className="route-notice" role="status">
      <p>{copy.home.invalidRoute(invalidPath)}</p>
      <button
        type="button"
        onClick={() =>
          navigate(
            { pathname: location.pathname, search: location.search },
            { replace: true, state: null },
          )
        }
      >
        {copy.home.dismiss}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Add the initial warm editorial CSS**

Create `src/course/course.css` with these tokens and home layout:

```css
:root {
  --course-paper: #f8f0e4;
  --course-surface: #fffaf2;
  --course-ink: #24231f;
  --course-muted: #736d64;
  --course-line: #e7d9c7;
  --course-coral: #e4572e;
  --course-coral-soft: #fae1d5;
  --course-teal: #2f6f6a;
  --course-teal-soft: #dbeae7;
  --course-board: #292c32;
  --course-particle: #ffd08a;
  --course-ending: #ff9d7a;
}

.course-home {
  max-width: 76rem;
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 4.5rem) 1.25rem 5rem;
}

.course-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
  align-items: end;
}

.course-hero h1 {
  max-width: 12ch;
  margin: 0.45rem 0 0.8rem;
  font-size: clamp(2.6rem, 6vw, 5.3rem);
  line-height: 0.96;
  letter-spacing: -0.055em;
}

.course-progress {
  height: 0.5rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e9ddcf;
}

.course-progress > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--course-coral), #ef8b56);
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 2rem;
}

.chapter-card {
  border: 1px solid var(--course-line);
  border-radius: 1rem;
  padding: 1.1rem;
  background: color-mix(in srgb, white 76%, transparent);
}

@media (max-width: 720px) {
  .course-hero,
  .chapter-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Wire the route, test build, commit**

In `src/routing/routes.tsx`, add:

```tsx
import { CourseHome } from "../course/components/CourseHome";
```

Replace only the Course placeholder route with:

```tsx
<Route path={routePaths.course} element={<CourseHome />} />
```

```bash
npm run build
git add src/course/components src/course/course.css src/routing/routes.tsx
git commit -m "feat(course): add open eight-chapter course home"
```

---

### Task 6: Lesson renderer and explicit completion

**Files:**
- Create: `src/course/components/LessonPage.tsx`
- Create: `src/course/components/LessonSidebar.tsx`
- Create: `src/course/components/LessonBlock.tsx`
- Create: `src/course/components/RuleBlock.tsx`
- Create: `src/course/components/ExampleBlock.tsx`
- Create: `src/course/components/ComparisonBlock.tsx`
- Create: `src/course/components/CalloutBlock.tsx`
- Create: `src/course/components/GuidedToolBlock.tsx`
- Create: `src/course/components/SummaryBlock.tsx`
- Modify: `src/routing/routes.tsx`
- Modify: `src/course/course.css`

- [ ] **Step 1: Implement strict lesson lookup**

Create `src/course/components/LessonPage.tsx`:

```tsx
import { useEffect } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useParams,
} from "react-router";
import { SpeechNotice } from "../../components/SpeechNotice";
import { useSpeech } from "../../hooks/useSpeech";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath, routePaths } from "../../routing/routes";
import { chapters } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";
import { useProgress } from "../progress/ProgressContext";
import { LessonBlock } from "./LessonBlock";
import { LessonSidebar } from "./LessonSidebar";

const orderedLessons = chapters.flatMap((chapter) =>
  chapter.lessons.map((lesson) => ({ chapter, lesson })),
);

export function LessonPage() {
  const { chapterId, lessonId } = useParams<{
    chapterId: string;
    lessonId: string;
  }>();
  const location = useLocation();
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { supported, japaneseVoiceAvailable, playbackFailed } = useSpeech();
  const { progress, markVisited, setComplete } = useProgress();
  const chapter = chapters.find((item) => item.id === chapterId);
  const lesson = chapter?.lessons.find((item) => item.id === lessonId);

  useEffect(() => {
    if (lesson) markVisited(lesson.id);
  }, [lesson, markVisited]);

  if (!chapter || !lesson) {
    return (
      <Navigate
        replace
        to={routePaths.course}
        state={{ invalidPath: location.pathname }}
      />
    );
  }

  const currentIndex = orderedLessons.findIndex(
    (item) => item.lesson.id === lesson.id,
  );
  const previous = orderedLessons[currentIndex - 1];
  const next = orderedLessons[currentIndex + 1];
  const completed = new Set(progress.completedLessonIds);
  const isComplete = completed.has(lesson.id);
  const lessonCopy = copy.lessons[lesson.id];

  return (
    <main className="lesson-layout">
      <LessonSidebar
        chapter={chapter}
        currentLessonId={lesson.id}
        completedLessonIds={completed}
      />

      <article className="lesson-main">
        <header className="lesson-header">
          <p className="course-eyebrow">
            {copy.lesson.chapterPosition(chapter.order, chapters.length)}
          </p>
          <h1>{lessonCopy.title}</h1>
          <p>{lessonCopy.lead}</p>
        </header>

        <SpeechNotice
          supported={supported}
          japaneseVoiceAvailable={japaneseVoiceAvailable}
          playbackFailed={playbackFailed}
        />

        <div className="lesson-blocks">
          {lesson.blocks.map((block, index) => (
            <LessonBlock key={`${block.copyId}-${index}`} block={block} />
          ))}
        </div>

        <footer className="lesson-footer">
          <div>
            {previous ? (
              <Link to={lessonPath(previous.chapter.id, previous.lesson.id)}>
                ← {copy.lesson.previous}
              </Link>
            ) : <span />}
            {next ? (
              <Link to={lessonPath(next.chapter.id, next.lesson.id)}>
                {copy.lesson.next} →
              </Link>
            ) : <span />}
          </div>
          <button
            type="button"
            className={isComplete ? "course-secondary-action" : "course-primary-action"}
            aria-pressed={isComplete}
            onClick={() => setComplete(lesson.id, !isComplete)}
          >
            {isComplete ? copy.lesson.undoComplete : copy.lesson.complete}
          </button>
        </footer>
      </article>
    </main>
  );
}
```

- [ ] **Step 2: Implement LessonSidebar**

Create `src/course/components/LessonSidebar.tsx`:

```tsx
import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { lessonPath, routePaths } from "../../routing/routes";
import type { Chapter } from "../data/types";
import { chapters } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";

interface LessonSidebarProps {
  chapter: Chapter;
  currentLessonId: string;
  completedLessonIds: ReadonlySet<string>;
}

export function LessonSidebar({
  chapter,
  currentLessonId,
  completedLessonIds,
}: LessonSidebarProps) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const chapterCopy = copy.chapters[chapter.id];
  const completed = chapter.lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id)
  ).length;
  const progressLabel = copy.home.lessonsProgress(
    completed,
    chapter.lessons.length,
  );

  const content = () => (
    <>
      <Link className="lesson-sidebar__back" to={routePaths.course}>
        ← {copy.lesson.back}
      </Link>
      <p className="course-eyebrow">
        {copy.lesson.chapterPosition(chapter.order, chapters.length)}
      </p>
      <h2>{chapterCopy.title}</h2>
      <p>{chapterCopy.description}</p>
      <div
        className="course-progress course-progress--small"
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={0}
        aria-valuemax={chapter.lessons.length}
        aria-valuenow={completed}
      >
        <span style={{ width: `${(completed / chapter.lessons.length) * 100}%` }} />
      </div>
      <ol className="lesson-sidebar__list">
        {chapter.lessons.map((lesson) => {
          const done = completedLessonIds.has(lesson.id);
          const current = lesson.id === currentLessonId;
          return (
            <li key={lesson.id} className={done ? "is-complete" : ""}>
              <Link
                to={lessonPath(chapter.id, lesson.id)}
                aria-current={current ? "page" : undefined}
              >
                <span aria-hidden="true">{done ? "✓" : lesson.order}</span>
                {copy.lessons[lesson.id].title}
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );

  return (
    <>
      <aside className="lesson-sidebar">{content()}</aside>
      <details className="lesson-sidebar-mobile">
        <summary>
          {copy.lesson.chapterPosition(chapter.order, chapters.length)} ·{" "}
          {chapterCopy.title}
        </summary>
        <div>{content()}</div>
      </details>
    </>
  );
}
```

- [ ] **Step 3: Implement block dispatch**

`LessonBlock.tsx`:

```tsx
import type { LessonBlock as LessonBlockData } from "../data/types";
import { CalloutBlock } from "./CalloutBlock";
import { ComparisonBlock } from "./ComparisonBlock";
import { ExampleBlock } from "./ExampleBlock";
import { GuidedToolBlock } from "./GuidedToolBlock";
import { RuleBlock } from "./RuleBlock";
import { SummaryBlock } from "./SummaryBlock";

export function LessonBlock({ block }: { block: LessonBlockData }) {
  switch (block.type) {
    case "rule": return <RuleBlock block={block} />;
    case "examples": return <ExampleBlock block={block} />;
    case "comparison": return <ComparisonBlock block={block} />;
    case "callout": return <CalloutBlock block={block} />;
    case "guidedTool": return <GuidedToolBlock block={block} />;
    case "summary": return <SummaryBlock block={block} />;
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}
```

- [ ] **Step 4: Implement visual rules from the approved mockup**

Create `src/course/components/RuleBlock.tsx`:

```tsx
import { useLocale } from "../../i18n/LocaleContext";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

type RuleData = Extract<LessonBlock, { type: "rule" }>;

export function RuleBlock({ block }: { block: RuleData }) {
  const { locale } = useLocale();
  const content = getCourseCopy(locale).blocks[block.copyId];
  return (
    <section className="lesson-rule">
      <div className="lesson-rule__gear" lang="ja" aria-hidden="true">
        {block.gear}
      </div>
      <div>
        {content.eyebrow ? (
          <p className="course-eyebrow">{content.eyebrow}</p>
        ) : null}
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </div>
    </section>
  );
}
```

Create `src/course/components/ExampleBlock.tsx`:

```tsx
import { useLocale } from "../../i18n/LocaleContext";
import { getCatalog } from "../../i18n/catalog";
import { useSpeech } from "../../hooks/useSpeech";
import { useScript } from "../../settings/ScriptContext";
import type { LessonBlock, StaticExample } from "../data/types";
import { examples } from "../data/examples";
import { getCourseCopy } from "../i18n/catalog";

type ExamplesData = Extract<LessonBlock, { type: "examples" }>;
type ScriptField = "jp" | "romaji";

function ExampleText({
  example,
  field,
}: {
  example: StaticExample;
  field: ScriptField;
}) {
  if (!example.segments) return <>{example[field]}</>;
  return (
    <>
      {example.segments.map((segment, index) => (
        <span
          key={`${segment.jp}-${index}`}
          className={segment.kind === "word" ? undefined : segment.kind}
        >
          {segment[field]}
        </span>
      ))}
    </>
  );
}

export function ExampleCollection({
  exampleIds,
  variant,
}: {
  exampleIds: string[];
  variant: "examples" | "comparison";
}) {
  const { locale, referenceLocale, showReference } = useLocale();
  const { script } = useScript();
  const { supported, speakingKey, playbackFailed, speak } = useSpeech();
  const copy = getCourseCopy(locale);
  const referenceCopy = getCourseCopy(referenceLocale);
  const ui = getCatalog(locale).ui;
  const mainField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const subField: ScriptField = script === "hiragana" ? "romaji" : "jp";
  const hasGears = exampleIds.some((exampleId) =>
    examples[exampleId].segments?.some((segment) => segment.kind !== "word"),
  );

  return (
    <>
      {hasGears ? (
        <div className="lesson-gear-legend">
          <span><b className="particle" lang="ja">を</b>{ui.lab.particles}</span>
          <span><b className="ending" lang="ja">ます</b>{ui.lab.endings}</span>
        </div>
      ) : null}
      <div className={`lesson-examples lesson-examples--${variant}`}>
        {playbackFailed ? (
          <p className="notice notice--warn lesson-audio-error" role="alert">
            {ui.speech.failed}
          </p>
        ) : null}
        {exampleIds.map((exampleId) => {
          const example = examples[exampleId];
          const translation = copy.examples[exampleId];
          const reference = referenceCopy.examples[exampleId];
          const speechKey = `course-${example.id}`;
          return (
            <article className="lesson-example" key={example.id}>
            <p
              className={`lesson-example__main${mainField === "romaji" ? " is-romaji" : ""}`}
              lang={mainField === "jp" ? "ja" : undefined}
            >
              <ExampleText example={example} field={mainField} />
            </p>
            <p
              className="lesson-example__sub"
              lang={subField === "jp" ? "ja" : undefined}
            >
              <ExampleText example={example} field={subField} />
            </p>
            <p className="lesson-example__translation">
              {translation.translation}
            </p>
            {translation.note ? (
              <p className="lesson-example__note">{translation.note}</p>
            ) : null}
            {showReference ? (
              <p className="lesson-example__reference">
                <span>{referenceLocale.toUpperCase()}</span>{" "}
                {reference.translation}
              </p>
            ) : null}
            <button
              type="button"
              className="lesson-listen"
              disabled={!supported}
              onClick={() =>
                speak(example.jp.replace(/\s+/g, ""), { key: speechKey })
              }
              aria-label={`${copy.lesson.listen}: ${translation.translation}`}
            >
              <span aria-hidden="true">▶</span>{" "}
              <span aria-live="polite">
                {speakingKey === speechKey
                  ? copy.lesson.playing
                  : copy.lesson.listen}
              </span>
            </button>
            </article>
          );
        })}
      </div>
    </>
  );
}

export function ExampleBlock({ block }: { block: ExamplesData }) {
  const { locale } = useLocale();
  const content = getCourseCopy(locale).blocks[block.copyId];
  return (
    <section className="lesson-section">
      <header className="lesson-section__header">
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </header>
      <ExampleCollection exampleIds={block.exampleIds} variant="examples" />
    </section>
  );
}
```

Create `src/course/components/ComparisonBlock.tsx`:

```tsx
import { useLocale } from "../../i18n/LocaleContext";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { ExampleCollection } from "./ExampleBlock";

type ComparisonData = Extract<LessonBlock, { type: "comparison" }>;

export function ComparisonBlock({ block }: { block: ComparisonData }) {
  const { locale } = useLocale();
  const content = getCourseCopy(locale).blocks[block.copyId];
  return (
    <section className="lesson-section">
      <header className="lesson-section__header">
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </header>
      <ExampleCollection exampleIds={block.exampleIds} variant="comparison" />
    </section>
  );
}
```

Create `src/course/components/CalloutBlock.tsx`:

```tsx
import { useLocale } from "../../i18n/LocaleContext";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

type CalloutData = Extract<LessonBlock, { type: "callout" }>;

export function CalloutBlock({ block }: { block: CalloutData }) {
  const { locale } = useLocale();
  const content = getCourseCopy(locale).blocks[block.copyId];
  return (
    <aside className={`lesson-callout lesson-callout--${block.tone}`}>
      <h2>{content.title}</h2>
      {content.body ? <p>{content.body}</p> : null}
    </aside>
  );
}
```

Create `src/course/components/GuidedToolBlock.tsx`:

```tsx
import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { routePaths } from "../../routing/routes";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

type GuidedToolData = Extract<LessonBlock, { type: "guidedTool" }>;

export function GuidedToolBlock({ block }: { block: GuidedToolData }) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const content = copy.blocks[block.copyId];
  const to =
    block.target === "lab" ? routePaths.lab : routePaths.syllabary;

  return (
    <section className="lesson-guided-tool">
      <div>
        <p className="course-eyebrow">{copy.practice.eyebrow}</p>
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </div>
      <Link className="course-primary-action" to={to}>
        {content.action ?? copy.practice.open} →
      </Link>
    </section>
  );
}
```

Create `src/course/components/SummaryBlock.tsx`:

```tsx
import { useLocale } from "../../i18n/LocaleContext";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

type SummaryData = Extract<LessonBlock, { type: "summary" }>;

export function SummaryBlock({ block }: { block: SummaryData }) {
  const { locale, referenceLocale, showReference } = useLocale();
  const primary = getCourseCopy(locale).blocks[block.copyId];
  const reference = getCourseCopy(referenceLocale).blocks[block.copyId];

  return (
    <section className="lesson-summary">
      <h2>{primary.title}</h2>
      <ul>
        {primary.bullets?.map((bullet) => <li key={bullet}>{bullet}</li>)}
      </ul>
      {showReference && reference.bullets ? (
        <div className="lesson-summary__reference">
          <span>{referenceLocale.toUpperCase()}</span>
          <ul>
            {reference.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 5: Verify completion/navigation behavior**

Start `npm run dev -- --port 5181 --strictPort` in detached async mode, retain
its `shellId`, and open `#/percorso/sounds/sounds-core`. Confirm:

1. the first lesson has no previous link and has a next link;
2. the completion button changes to the reversible “review” state without navigating;
3. the sidebar immediately shows the completion check;
4. the next link remains available before and after completion;
5. `#/percorso/traps/traps-verbs` has a previous link and no next link.

Stop that exact server with `stop_bash` and the retained `shellId`.

- [ ] **Step 6: Add lesson CSS**

Extend `course.css`:

```css
.lesson-layout {
  display: grid;
  grid-template-columns: 17.375rem minmax(0, 1fr);
  max-width: 86rem;
  min-height: calc(100vh - var(--header-height));
  margin: 0 auto;
}

.lesson-sidebar {
  position: sticky;
  top: var(--header-height);
  height: calc(100vh - var(--header-height));
  overflow: auto;
  border-right: 1px solid var(--course-line);
  padding: 1.75rem 1.4rem 2.5rem;
}

.lesson-sidebar-mobile {
  display: none;
}

.lesson-sidebar h2 {
  margin: 0.45rem 0 0.55rem;
  font-size: 1.45rem;
}

.lesson-sidebar__back {
  display: inline-block;
  margin-bottom: 1.8rem;
}

.lesson-sidebar__list {
  display: grid;
  gap: 0.45rem;
  padding: 0;
  margin: 1.3rem 0 0;
  list-style: none;
}

.lesson-sidebar__list a {
  display: grid;
  grid-template-columns: 1.8rem 1fr;
  gap: 0.65rem;
  align-items: center;
  border-radius: 0.7rem;
  padding: 0.7rem;
  color: var(--course-ink);
  text-decoration: none;
}

.lesson-sidebar__list a[aria-current="page"] {
  background: var(--course-coral-soft);
}

.lesson-sidebar__list .is-complete a > span {
  color: var(--course-teal);
  font-weight: 800;
}

.lesson-main {
  width: min(100%, 64rem);
  padding: clamp(2rem, 6vw, 5.5rem);
}

.lesson-header h1 {
  max-width: 13ch;
  margin: 0.7rem 0 1rem;
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 0.98;
  letter-spacing: -0.045em;
}

.lesson-header > p:last-child {
  max-width: 42rem;
  color: var(--course-muted);
  font-size: 1.12rem;
  line-height: 1.65;
}

.lesson-blocks {
  display: grid;
  gap: 1.6rem;
  margin-top: 2.5rem;
}

.lesson-rule {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 1.1rem;
  border: 1px solid #efc9b7;
  border-radius: 1.2rem;
  padding: 1.25rem;
  background: linear-gradient(115deg, #fff9f2, var(--course-coral-soft));
}

.lesson-rule__gear {
  display: grid;
  min-height: 4.5rem;
  place-items: center;
  border-radius: 1rem;
  background: var(--course-coral);
  color: white;
  font-size: 1.35rem;
  font-weight: 900;
  text-align: center;
}

.lesson-rule h2,
.lesson-section h2,
.lesson-guided-tool h2,
.lesson-summary h2 {
  margin: 0 0 0.45rem;
}

.lesson-section {
  display: grid;
  gap: 1rem;
}

.lesson-section__header > p {
  max-width: 44rem;
  margin: 0;
  color: var(--course-muted);
}

.lesson-gear-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  color: var(--course-muted);
  font-size: 0.78rem;
}

.lesson-gear-legend > span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.lesson-gear-legend b {
  border-radius: 0.35rem;
  padding: 0.1rem 0.3rem;
  background: var(--course-board);
}

.lesson-gear-legend .particle { color: #f4bd55; }
.lesson-gear-legend .ending { color: #ff835e; }

.lesson-examples {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.lesson-audio-error {
  grid-column: 1 / -1;
  margin: 0;
}

.lesson-examples--examples:has(.lesson-example:only-child) {
  grid-template-columns: 1fr;
}

.lesson-example {
  position: relative;
  border-radius: 1rem;
  padding: 1.2rem;
  background: var(--course-board);
  color: #f8f0e4;
}

.lesson-example__main,
.lesson-example__sub,
.lesson-example__translation,
.lesson-example__reference,
.lesson-example__note {
  margin: 0;
}

.lesson-example__main {
  padding-right: 3rem;
  font-size: clamp(1.65rem, 4vw, 2.55rem);
  font-weight: 800;
  line-height: 1.3;
}

.lesson-example__main.is-romaji {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
}

.lesson-example__sub {
  margin-top: 0.2rem;
  color: #c9c4bb;
}

.lesson-example__translation {
  margin-top: 1.05rem;
  font-size: 1.05rem;
}

.lesson-example__reference {
  margin-top: 0.35rem;
  color: #a9d3cd;
  font-size: 0.9rem;
}

.lesson-example__reference > span,
.lesson-summary__reference > span {
  margin-right: 0.35rem;
  color: #72b7ad;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.lesson-example .particle {
  color: #f4bd55;
}

.lesson-example .ending {
  color: #ff835e;
}

.lesson-listen {
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  border: 1px solid #5a5d63;
  border-radius: 999px;
  padding: 0.42rem 0.65rem;
  background: transparent;
  color: inherit;
}

.lesson-guided-tool {
  display: flex;
  gap: 1.2rem;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--course-line);
  border-radius: 1rem;
  padding: 1.2rem;
  background: var(--course-surface);
}

.lesson-callout {
  border-left: 0.35rem solid var(--course-teal);
  border-radius: 0.8rem;
  padding: 1rem 1.1rem;
  background: var(--course-teal-soft);
}

.lesson-callout--warning {
  border-left-color: #b77520;
  background: #fff3cf;
}

.lesson-callout--exception {
  border-left-color: var(--course-coral);
  background: var(--course-coral-soft);
}

.lesson-callout h2 {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
}

.lesson-callout p {
  margin: 0;
}

.lesson-summary {
  border-radius: 1rem;
  padding: 1.35rem;
  background: var(--course-teal-soft);
}

.lesson-summary ul {
  margin-bottom: 0;
}

.lesson-summary__reference {
  border-top: 1px solid color-mix(in srgb, var(--course-teal) 25%, transparent);
  margin-top: 1rem;
  padding-top: 1rem;
}

.lesson-footer {
  display: grid;
  gap: 1.1rem;
  border-top: 1px solid var(--course-line);
  margin-top: 2.5rem;
  padding-top: 1.5rem;
}

.lesson-footer > div {
  display: flex;
  justify-content: space-between;
}

@media (max-width: 850px) {
  .lesson-layout { grid-template-columns: 1fr; }
  .lesson-sidebar { display: none; }
  .lesson-sidebar-mobile {
    display: block;
    border-bottom: 1px solid var(--course-line);
    padding: 1rem 1.25rem;
  }
  .lesson-sidebar-mobile > div {
    padding-top: 1rem;
  }
  .lesson-examples { grid-template-columns: 1fr; }
  .lesson-guided-tool { align-items: flex-start; flex-direction: column; }
}
```

- [ ] **Step 7: Wire route, build, commit**

In `src/routing/routes.tsx`, add:

```tsx
import { LessonPage } from "../course/components/LessonPage";
```

Replace only the Lesson placeholder route with:

```tsx
<Route path={routePaths.lesson} element={<LessonPage />} />
```

```bash
npm run build
git add src/course src/routing/routes.tsx
git commit -m "feat(course): render bilingual lessons with completion"
```

---

### Task 7: Guided Lab and Syllabary links

**Files:**
- Create: `src/lab/presets.ts`
- Create: `src/lab/presets.test.ts`
- Modify: `src/lab/components/Lab.tsx`
- Create: `src/course/components/GuidedLabPreview.tsx`
- Modify: `src/course/components/GuidedToolBlock.tsx`
- Create: `src/course/components/PracticeHome.tsx`
- Modify: `src/course/course.css`
- Modify: `src/lab/lab.css`
- Modify: `src/routing/routes.tsx`

- [ ] **Step 1: Write preset round-trip tests**

Create `src/lab/presets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LabSelection } from "../content/types";
import {
  hasLabPreset,
  parseLabPreset,
  serializeLabPreset,
} from "./presets";

const selection = {
  scenarioId: "eat",
  form: "past",
  timeId: "yesterday",
  options: { object: "ramen", place: null },
} satisfies LabSelection;

describe("Lab presets", () => {
  it("round trips a valid selection", () => {
    const params = serializeLabPreset(
      selection,
      "/percorso/actions/actions-object",
    );
    expect(parseLabPreset(params)).toEqual({
      selection,
      from: "/percorso/actions/actions-object",
    });
    expect(hasLabPreset(params)).toBe(true);
  });

  it("rejects invalid scenario/form/time/concepts", () => {
    expect(parseLabPreset(new URLSearchParams("scenario=bad"))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=bad&time=today&slot.object=ramen&slot.place=",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=bad&slot.object=ramen&slot.place=",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=train&slot.place=",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen",
    ))).toBeNull();
  });

  it("distinguishes direct Lab visits from malformed preset links", () => {
    const empty = new URLSearchParams();
    expect(hasLabPreset(empty)).toBe(false);
    expect(parseLabPreset(empty)).toBeNull();
  });

  it("rejects duplicate, unknown, and external return parameters", () => {
    const unknownOnly = new URLSearchParams("extra=1");
    expect(hasLabPreset(unknownOnly)).toBe(true);
    expect(parseLabPreset(unknownOnly)).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&scenario=go&form=pres&time=today&slot.object=ramen&slot.place=",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&extra=1",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&from=https://example.com",
    ))).toBeNull();
    expect(parseLabPreset(new URLSearchParams(
      "scenario=eat&form=pres&time=today&slot.object=ramen&slot.place=&from=/percorso/../../frasario",
    ))).toBeNull();
    expect(() => serializeLabPreset({
      ...selection,
      options: { ...selection.options, extra: "ramen" },
    })).toThrow("Unknown slot: extra");
    expect(() => serializeLabPreset({
      ...selection,
      options: { object: "ramen" },
    })).toThrow("Missing slot: place");
  });
});
```

- [ ] **Step 2: Implement URL-safe presets**

Create `src/lab/presets.ts`:

```ts
import { scenarios } from "../content/scenarios";
import { resolveLabSelection } from "../content/selection";
import { times } from "../content/times";
import type {
  ConceptId,
  LabSelection,
  Scenario,
  ScenarioSlot,
  TimeId,
} from "../content/types";
import type { Form } from "./engine/conjugate";

const forms: readonly Form[] = [
  "pres",
  "past",
  "neg",
  "pastneg",
  "vol",
  "des",
];

export interface ParsedLabPreset {
  selection: LabSelection;
  from: string | null;
}

function isForm(value: string | null): value is Form {
  return forms.some((form) => form === value);
}

function isCoursePath(value: string): boolean {
  return /^\/percorso\/[a-z0-9-]+\/[a-z0-9-]+$/.test(value);
}

function scenarioById(value: string | null): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === value);
}

function isTimeId(value: string | null): value is TimeId {
  return times.some((time) => time.id === value);
}

function isSlotOption(
  slot: ScenarioSlot,
  value: string,
): value is ConceptId {
  return slot.optionIds.some((optionId) => optionId === value);
}

export function hasLabPreset(params: URLSearchParams): boolean {
  return [...params.keys()].length > 0;
}

export function serializeLabPreset(
  selection: LabSelection,
  from?: string,
): URLSearchParams {
  const { scenario } = resolveLabSelection(selection);
  if (!isForm(selection.form)) throw new Error(`Unknown form: ${selection.form}`);
  if (from !== undefined && !isCoursePath(from)) {
    throw new Error(`Invalid course return path: ${from}`);
  }

  const params = new URLSearchParams({
    scenario: selection.scenarioId,
    form: selection.form,
    time: selection.timeId,
  });
  for (const slot of scenario.slots) {
    const value = selection.options[slot.id] ?? null;
    params.set(`slot.${slot.id}`, value ?? "");
  }
  if (from !== undefined) params.set("from", from);
  return params;
}

export function parseLabPreset(
  params: URLSearchParams,
): ParsedLabPreset | null {
  const scenario = scenarioById(params.get("scenario"));
  const form = params.get("form");
  const timeId = params.get("time");
  if (
    !scenario ||
    !isForm(form) ||
    !isTimeId(timeId)
  ) {
    return null;
  }

  const allowedKeys = new Set([
    "scenario",
    "form",
    "time",
    "from",
    ...scenario.slots.map((slot) => `slot.${slot.id}`),
  ]);
  for (const key of params.keys()) {
    if (!allowedKeys.has(key) || params.getAll(key).length !== 1) return null;
  }

  const options: Record<string, ConceptId | null> = {};
  for (const slot of scenario.slots) {
    const key = `slot.${slot.id}`;
    if (!params.has(key)) return null;
    const value = params.get(key);
    if (value === "") {
      if (!slot.optional) return null;
      options[slot.id] = null;
      continue;
    }
    if (!value || !isSlotOption(slot, value)) return null;
    options[slot.id] = value;
  }

  const from = params.get("from");
  if (from !== null && !isCoursePath(from)) return null;

  return {
    selection: {
      scenarioId: scenario.id,
      form,
      timeId,
      options,
    },
    from,
  };
}
```

- [ ] **Step 3: Generate guided links**

Create `src/course/components/GuidedLabPreview.tsx`:

```tsx
import { Fragment } from "react";
import { Link } from "react-router";
import { useSpeech } from "../../hooks/useSpeech";
import { getCatalog } from "../../i18n/catalog";
import { useLocale } from "../../i18n/LocaleContext";
import { buildJapaneseSentence } from "../../lab/engine/japanese";
import { useScript } from "../../settings/ScriptContext";
import type { LabSelection } from "../../content/types";
import { getCourseCopy } from "../i18n/catalog";
import { buildLabViewModel } from "../../lab/components/viewModel";
import type { JapaneseSentencePart } from "../../lab/engine/japanese";

type ScriptField = "jp" | "romaji";

interface GuidedLabPreviewProps {
  selection: LabSelection;
  to: string;
  title: string;
  body?: string;
}

function PartText({
  part,
  field,
}: {
  part: JapaneseSentencePart;
  field: ScriptField;
}) {
  const gear = part.particle ?? part.suffix;
  const separator = field === "romaji" && gear ? " " : "";
  return (
    <>
      {part[field]}
      {gear ? (
        <>
          {separator}
          <span className={gear.kind}>{gear[field]}</span>
        </>
      ) : null}
    </>
  );
}

export function GuidedLabPreview({
  selection,
  to,
  title,
  body,
}: GuidedLabPreviewProps) {
  const { locale, referenceLocale, showReference } = useLocale();
  const { script } = useScript();
  const { supported, speakingKey, playbackFailed, speak } = useSpeech();
  const courseCopy = getCourseCopy(locale);
  const ui = getCatalog(locale).ui;
  const japanese = buildJapaneseSentence(selection);
  const vm = buildLabViewModel(selection, locale, referenceLocale);
  const primaryField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const secondaryField: ScriptField =
    script === "hiragana" ? "romaji" : "jp";
  const speechKey = `guided-${selection.scenarioId}-${selection.form}-${selection.timeId}`;

  const partLabel = (part: JapaneseSentencePart): string => {
    if (part.kind === "time") return vm.ui.lab.when;
    if (part.kind === "verb") return vm.forms[selection.form].grammar;
    const slot = vm.slots.find((item) => item.id === part.id);
    if (!slot) throw new Error(`Missing guided slot copy: ${part.id}`);
    return `${slot.copy.prompt} · ${part.particle?.jp ?? ""}`;
  };

  return (
    <section className="guided-board">
      <div className="guided-board__top">
        <div>
          <p className="guided-board__label">
            {courseCopy.practice.guidedBoard}
          </p>
          <h2>{title}</h2>
          {body ? <p>{body}</p> : null}
        </div>
        <button
          type="button"
          className="guided-board__listen"
          disabled={!supported}
          onClick={() => speak(japanese.sentence.jp, { key: speechKey })}
        >
          <span aria-hidden="true">▶</span>{" "}
          <span aria-live="polite">
            {speakingKey === speechKey
              ? courseCopy.lesson.playing
              : courseCopy.lesson.listen}
          </span>
        </button>
      </div>

      {playbackFailed ? (
        <p className="guided-board__error" role="alert">
          {ui.speech.failed}
        </p>
      ) : null}

      <div className="guided-board__chips">
        {japanese.parts.map((part) => (
          <div className="guided-board__chip" key={part.id}>
            <small>{partLabel(part)}</small>
            <b lang={primaryField === "jp" ? "ja" : undefined}>
              <PartText part={part} field={primaryField} />
            </b>
            <span lang={secondaryField === "jp" ? "ja" : undefined}>
              <PartText part={part} field={secondaryField} />
            </span>
          </div>
        ))}
      </div>

      <p
        className={`guided-board__sentence${
          primaryField === "romaji" ? " is-romaji" : ""
        }`}
        lang={primaryField === "jp" ? "ja" : undefined}
      >
        {japanese.parts.map((part, index) => (
          <Fragment key={part.id}>
            {index > 0 ? " " : null}
            <PartText part={part} field={primaryField} />
          </Fragment>
        ))}
      </p>
      <p
        className="guided-board__secondary"
        lang={secondaryField === "jp" ? "ja" : undefined}
      >
        {japanese.parts.map((part, index) => (
          <Fragment key={part.id}>
            {index > 0 ? " " : null}
            <PartText part={part} field={secondaryField} />
          </Fragment>
        ))}
      </p>
      <p className="guided-board__translation">
        {vm.sentence.primary}
        {showReference ? (
          <>
            {" · "}
            <span>{referenceLocale.toUpperCase()}: {vm.sentence.reference}</span>
          </>
        ) : null}
      </p>
      <div className="guided-board__legend">
        <span><b className="particle" lang="ja">を</b>{ui.lab.particles}</span>
        <span><b className="ending" lang="ja">ます</b>{ui.lab.endings}</span>
      </div>
      <Link className="guided-board__action" to={to}>
        {courseCopy.practice.openGuidedLab} →
      </Link>
    </section>
  );
}
```

Replace `src/course/components/GuidedToolBlock.tsx` with:

```tsx
import { Link, useLocation } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { serializeLabPreset } from "../../lab/presets";
import { routePaths } from "../../routing/routes";
import type { LessonBlock } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { GuidedLabPreview } from "./GuidedLabPreview";

type GuidedToolData = Extract<LessonBlock, { type: "guidedTool" }>;

export function GuidedToolBlock({ block }: { block: GuidedToolData }) {
  const { locale } = useLocale();
  const location = useLocation();
  const copy = getCourseCopy(locale);
  const content = copy.blocks[block.copyId];
  if (block.target === "lab") {
    if (!block.preset) {
      throw new Error(`Missing Lab preset for ${block.copyId}`);
    }
    const params = serializeLabPreset(block.preset, location.pathname);
    const to = `${routePaths.lab}?${params.toString()}`;
    return (
      <GuidedLabPreview
        selection={block.preset}
        to={to}
        title={content.title}
        body={content.body}
      />
    );
  }

  return (
    <section className="lesson-guided-tool">
      <div>
        <p className="course-eyebrow">{copy.practice.eyebrow}</p>
        <h2>{content.title}</h2>
        {content.body ? <p>{content.body}</p> : null}
      </div>
      <Link className="course-primary-action" to={routePaths.syllabary}>
        {content.action ?? copy.practice.open} →
      </Link>
    </section>
  );
}
```

Append to `src/course/course.css`:

```css
.guided-board {
  position: relative;
  overflow: hidden;
  border-radius: 1.4rem;
  padding: 1.45rem;
  background: var(--course-board);
  box-shadow: 0 1.25rem 2.8rem rgba(41, 44, 50, 0.18);
  color: white;
}

.guided-board::after {
  position: absolute;
  width: 14rem;
  height: 14rem;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--course-teal) 52%, transparent),
    transparent 68%
  );
  content: "";
  inset: -6rem -5rem auto auto;
}

.guided-board > * {
  position: relative;
  z-index: 1;
}

.guided-board__top {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
}

.guided-board__top h2 {
  margin: 0.35rem 0;
}

.guided-board__top > div > p:last-child,
.guided-board__translation,
.guided-board__secondary {
  color: #c8cbd2;
}

.guided-board__label {
  margin: 0;
  color: #89d1c8;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.guided-board__listen {
  flex: 0 0 auto;
  border: 1px solid #59606d;
  border-radius: 0.65rem;
  padding: 0.55rem 0.7rem;
  background: #373b44;
  color: white;
  font-weight: 800;
}

.guided-board__error {
  border: 1px solid #ffb49b;
  border-radius: 0.7rem;
  padding: 0.7rem;
  background: #5a3028;
  color: white;
}

.guided-board__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin: 1.2rem 0 1rem;
}

.guided-board__chip {
  display: grid;
  border-radius: 0.75rem;
  padding: 0.7rem 0.8rem;
  background: white;
  color: var(--course-ink);
}

.guided-board__chip small,
.guided-board__chip > span {
  color: #716f6a;
  font-size: 0.66rem;
}

.guided-board__chip b {
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: 1.1rem;
}

.guided-board__chip .particle {
  border-radius: 0.3rem;
  padding: 0 0.12rem;
  background: #fff0cf;
  color: #a96000;
}

.guided-board__chip .ending {
  border-radius: 0.3rem;
  padding: 0 0.12rem;
  background: #fde2d9;
  color: #b73b1e;
}

.guided-board__sentence {
  margin: 0;
  font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: clamp(1.55rem, 4vw, 2rem);
  font-weight: 850;
}

.guided-board__sentence .particle,
.guided-board__secondary .particle {
  color: var(--course-particle);
}

.guided-board__sentence .ending,
.guided-board__secondary .ending {
  color: var(--course-ending);
}

.guided-board__secondary,
.guided-board__translation {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
}

.guided-board__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  border-top: 1px solid #4a4e57;
  margin-top: 1rem;
  padding-top: 0.8rem;
  color: #d5d7dc;
  font-size: 0.7rem;
}

.guided-board__legend > span {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}

.guided-board__legend b {
  border-radius: 0.3rem;
  padding: 0.1rem 0.3rem;
  background: #373b44;
}

.guided-board__legend .particle { color: var(--course-particle); }
.guided-board__legend .ending { color: var(--course-ending); }

.guided-board__action {
  display: inline-block;
  border-radius: 0.75rem;
  margin-top: 1.1rem;
  padding: 0.75rem 0.95rem;
  background: var(--course-coral);
  color: white;
  text-decoration: none;
  font-weight: 850;
}

@media (max-width: 620px) {
  .guided-board__top {
    flex-direction: column;
  }
}
```

- [ ] **Step 4: Load preset and show return link in Lab**

In `src/lab/components/Lab.tsx`, add:

```tsx
import { Link, useSearchParams } from "react-router";
import { getCourseCopy } from "../../course/i18n/catalog";
import { hasLabPreset, parseLabPreset } from "../presets";
```

Immediately after reading locale settings, add the one-time preset snapshot and
use it in the existing `LabSelection` state initializer:

```tsx
const [searchParams] = useSearchParams();
const [initialPreset] = useState(() => ({
  attempted: hasLabPreset(searchParams),
  parsed: parseLabPreset(searchParams),
}));
const [selection, setSelection] = useState<LabSelection>(() =>
  initialPreset.parsed?.selection ?? defaultSelection(scenarios[0].id),
);
const courseCopy = getCourseCopy(locale);
```

Replace the previous `useState<LabSelection>` declaration rather than creating a
second selection state. Direct visits have `attempted: false`; malformed guided
links have `attempted: true` and `parsed: null`.

Render these elements immediately after `SpeechNotice`:

```tsx
{initialPreset.attempted && !initialPreset.parsed ? (
  <p className="preset-notice" role="status">
    {courseCopy.practice.invalidPreset}
  </p>
) : null}
{initialPreset.parsed?.from ? (
  <Link className="guided-return" to={initialPreset.parsed.from}>
    ← {courseCopy.practice.backToLesson}
  </Link>
) : null}
```

Append to `src/lab/lab.css`:

```css
.preset-notice {
  border: 1px solid #d3a64b;
  border-radius: 0.8rem;
  margin: 0 0 1rem;
  padding: 0.75rem 0.9rem;
  background: #fff3cf;
  color: #684d13;
}

.guided-return {
  display: inline-block;
  margin: 0 0 1rem;
  font-weight: 800;
}
```

- [ ] **Step 5: Implement PracticeHome**

Create `src/course/components/PracticeHome.tsx`:

```tsx
import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { routePaths } from "../../routing/routes";
import { getCourseCopy } from "../i18n/catalog";

export function PracticeHome() {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale).practice;
  return (
    <main className="practice-home">
      <header>
        <p className="course-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.lead}</p>
      </header>
      <div className="practice-grid">
        <article>
          <span aria-hidden="true">組</span>
          <h2>{copy.labTitle}</h2>
          <p>{copy.labBody}</p>
          <Link to={routePaths.lab}>{copy.open} →</Link>
        </article>
        <article>
          <span aria-hidden="true">あ</span>
          <h2>{copy.syllabaryTitle}</h2>
          <p>{copy.syllabaryBody}</p>
          <Link to={routePaths.syllabary}>{copy.open} →</Link>
        </article>
      </div>
    </main>
  );
}
```

Append to `src/course/course.css`:

```css
.practice-home {
  width: min(100% - 2.5rem, 70rem);
  margin: 0 auto;
  padding: clamp(2.5rem, 7vw, 6rem) 0;
}

.practice-home header {
  max-width: 48rem;
}

.practice-home h1 {
  margin: 0.5rem 0 0.8rem;
  font-size: clamp(2.5rem, 6vw, 4.8rem);
  line-height: 0.98;
}

.practice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.practice-grid article {
  border: 1px solid var(--course-line);
  border-radius: 1rem;
  padding: 1.4rem;
  background: var(--course-surface);
}

.practice-grid article > span {
  color: var(--course-coral);
  font-size: 2rem;
  font-weight: 900;
}

@media (max-width: 680px) {
  .practice-grid { grid-template-columns: 1fr; }
}
```

In `src/routing/routes.tsx`, import `PracticeHome` and replace the Practice
placeholder:

```tsx
import { PracticeHome } from "../course/components/PracticeHome";
```

```tsx
<Route path={routePaths.practice} element={<PracticeHome />} />
```

- [ ] **Step 6: Test/build/commit**

```bash
npx vitest run src/lab/presets.test.ts
npm run build
git add src/lab src/course src/routing/routes.tsx
git commit -m "feat(course): connect lessons to guided practice"
```

---

### Task 8: Editorial shell, responsiveness, and accessibility

**Files:**
- Modify: `src/styles.css`
- Modify: `src/course/course.css`
- Modify: `src/lab/lab.css`
- Modify: `src/components/Header.tsx`
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/it.ts`
- Modify: `src/i18n/en.ts`

- [ ] **Step 1: Apply the approved shell tokens**

Align global tokens with:

```css
:root {
  --paper: #f8f0e4;
  --surface: #fffaf2;
  --ink: #24231f;
  --muted: #736d64;
  --line: #e7d9c7;
  --accent: #e4572e;
  --accent-soft: #fae1d5;
  --time: #2f6f6a;
  --time-soft: #dbeae7;
  --board: #292c32;
  --gear-particle: #ffd08a;
  --gear-ending: #ff9d7a;
  --header-height: 4.75rem;
  --course-paper: var(--paper);
  --course-surface: var(--surface);
  --course-ink: var(--ink);
  --course-muted: var(--muted);
  --course-line: var(--line);
  --course-coral: var(--accent);
  --course-coral-soft: var(--accent-soft);
  --course-teal: var(--time);
  --course-teal-soft: var(--time-soft);
  --course-board: var(--board);
  --course-particle: var(--gear-particle);
  --course-ending: var(--gear-ending);
}
```

Delete the duplicate literal-valued `:root` block from `course.css`; these aliases
keep all existing course selectors mapped to the approved global tokens.

- [ ] **Step 2: Match the approved header**

Extend `UiMessages` in `src/i18n/types.ts`:

```ts
brand: {
  title: string;
  subtitle: string;
};
settings: {
  menu: string;
  language: string;
  writing: string;
  reference: string;
  unavailable: string;
};
```

Keep the complete `nav` object from Task 1 unchanged. Add `brand`, add
`settings.menu`, and replace the remaining settings copy with these exact
final values:

```ts
// src/i18n/it.ts
brand: {
  title: "Giapponese pratico",
  subtitle: "Parlato · costruzione delle frasi · hiragana prima di tutto",
},
settings: {
  menu: "Impostazioni",
  language: "Lingua",
  writing: "Scrittura",
  reference: "Mostra traduzione di controllo",
  unavailable: "Le preferenze restano attive solo per questa sessione.",
},
```

```ts
// src/i18n/en.ts
brand: {
  title: "Practical Japanese",
  subtitle: "Speaking · sentence building · hiragana first",
},
settings: {
  menu: "Settings",
  language: "Language",
  writing: "Script",
  reference: "Show reference translation",
  unavailable: "Preferences will remain active for this session only.",
},
```

Replace `src/components/Header.tsx` with:

```tsx
import { NavLink } from "react-router";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { routePaths } from "../routing/routes";
import { useScript } from "../settings/ScriptContext";

export function Header() {
  const {
    locale,
    showReference,
    setLocale,
    setShowReference,
  } = useLocale();
  const { script, setScript } = useScript();
  const ui = getCatalog(locale).ui;
  const navItems = [
    { to: routePaths.course, label: ui.nav.course },
    { to: routePaths.practice, label: ui.nav.practice },
    { to: routePaths.phrasebook, label: ui.nav.phrasebook },
  ];

  const settings = () => (
    <>
      <div className="localetoggle" role="group" aria-label={ui.settings.language}>
        {(["it", "en"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={locale === item ? "is-active" : ""}
            aria-pressed={locale === item}
            onClick={() => setLocale(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="scripttoggle" role="group" aria-label={ui.settings.writing}>
        <button
          type="button"
          className={script === "hiragana" ? "is-active" : ""}
          aria-pressed={script === "hiragana"}
          onClick={() => setScript("hiragana")}
        >
          <span className="k" lang="ja" aria-hidden="true">あ</span> Hiragana
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
      <label className="reference-toggle">
        <input
          type="checkbox"
          checked={showReference}
          onChange={(event) => setShowReference(event.target.checked)}
        />
        {ui.settings.reference}
      </label>
    </>
  );

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo" lang="ja" aria-hidden="true">はなそう</span>
        <div className="header__text">
          <span className="header__title">{ui.brand.title}</span>
          <span className="header__subtitle">{ui.brand.subtitle}</span>
        </div>
      </div>

      <nav className="modenav" aria-label={ui.nav.primary}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `modenav__item${isActive ? " is-active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="header__settings header__settings--desktop">
        {settings()}
      </div>
      <details className="header__settings-mobile">
        <summary>⚙ {ui.settings.menu}</summary>
        <div>{settings()}</div>
      </details>
    </header>
  );
}
```

Append these layout rules to `src/styles.css`, replacing conflicting Header and
mode-navigation declarations:

```css
.header {
  position: sticky;
  z-index: 20;
  top: 0;
  display: grid;
  grid-template-columns: minmax(15rem, 1fr) auto minmax(15rem, 1fr);
  gap: 1rem;
  align-items: center;
  min-height: var(--header-height);
  border-bottom: 1px solid color-mix(in srgb, var(--line) 82%, transparent);
  padding: 0.65rem clamp(1rem, 3vw, 2rem);
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur(18px);
}

.header__brand,
.header__settings,
.modenav {
  display: flex;
  align-items: center;
}

.header__brand { gap: 0.75rem; }
.header__logo { color: var(--accent); font-size: 1.35rem; font-weight: 900; }
.header__text { display: grid; }
.header__title { color: var(--ink); font-weight: 900; }
.header__subtitle { color: var(--muted); font-size: 0.72rem; }

.modenav {
  gap: 0.2rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.22rem;
  background: var(--surface);
}

.modenav__item {
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.modenav__item.is-active {
  background: var(--ink);
  color: var(--surface);
}

.header__settings {
  justify-content: flex-end;
  gap: 0.55rem;
}

.header__settings-mobile { display: none; }

@media (max-width: 980px) {
  :root { --header-height: 8.5rem; }
  .header {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }
  .modenav {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-self: stretch;
    overflow-x: auto;
  }
  .header__settings--desktop { display: none; }
  .header__settings-mobile {
    display: block;
    justify-self: end;
  }
  .header__settings-mobile > summary {
    cursor: pointer;
    font-weight: 800;
  }
  .header__settings-mobile > div {
    display: grid;
    gap: 0.7rem;
    min-width: min(20rem, calc(100vw - 2rem));
    padding-top: 0.8rem;
  }
}

@media (max-width: 520px) {
  .header__subtitle { display: none; }
}
```

- [ ] **Step 3: Complete the accessibility CSS and audit**

The components created in Tasks 5–7 already contain the following behavior.
Verify each item in the rendered application and keep the attributes unchanged:

- `aria-current="page"` on active route/lesson;
- `aria-pressed` on locale/script controls;
- visible `:focus-visible` outline using `--time`;
- `role="status"` for informational notices and `role="alert"` for playback failures;
- `aria-live="polite"` for speech state, not whole pages;
- buttons with text plus icon, never icon-only;
- particle/ending labels adjacent to color legend;
- `@media (prefers-reduced-motion: reduce)` disables bump/transition animations.

Add:

```css
:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--time) 72%, white);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Responsive visual verification**

Start `npm run dev -- --port 5181 --strictPort` with the Bash tool in detached
async mode and retain its `shellId`. Verify at:

- 1440×900: sticky lesson sidebar and two-column examples;
- 1024×768: no overflow;
- 390×844: collapsed sidebar, single-column examples, reachable controls;
- guided Lab blocks: dark board, highlighted particles/endings, audio state, and
  localized primary/reference translations;
- keyboard-only: complete one lesson and navigate next;
- reduced motion: no bump animation.

Fix only issues found against these explicit expectations.
Stop that exact dev server with `stop_bash` and the retained `shellId`.

- [ ] **Step 5: Build and commit**

```bash
npm test
npm run build
git add src
git commit -m "feat(ui): apply approved warm editorial course design"
```

---

### Task 9: Course documentation and final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the user experience**

Add this section to `README.md`, after the setup instructions:

```markdown
## Esperienza v2.1

L'app è organizzata in tre aree:

- **Percorso** — 8 capitoli e 16 lezioni compatte, dai suoni alle trappole comuni. Tutti i capitoli sono sempre aperti.
- **Pratica libera** — Laboratorio delle frasi e Sillabario hiragana, accessibili anche dai collegamenti guidati nelle lezioni.
- **Frasario** — frasi pratiche da viaggio con testo e audio.

Italiano e inglese sono entrambi completi. Una lingua è primaria; l'altra può comparire sotto esempi, frasi e riepiloghi come traduzione di controllo. Hiragana/rōmaji è un'impostazione indipendente.

La conclusione di una lezione è un'azione esplicita e reversibile. I progressi restano solo nel browser e non bloccano mai i contenuti.

### Dati locali

Non esistono account né un backend. `localStorage` contiene soltanto:

- `nihongo.locale.primary`
- `nihongo.locale.reference`
- `nihongo.script`
- `nihongo.course.progress`

Se lo storage non è disponibile, l'app continua a funzionare per la sessione corrente.

### Fuori dallo scope v2.1

Gli esercizi deterministici sono previsti per v2.2. Il riconoscimento vocale è previsto per v2.3 e non verrà presentato come valutazione della pronuncia. Una valutazione fonetica reale richiederebbe un servizio con credenziali protette.
```

- [ ] **Step 2: Full verification**

Run:

```bash
npm test
npm run build
```

Then manually verify:

1. root redirects to `#/percorso`;
2. all 8 chapter cards open;
3. all 16 lessons render in IT and EN;
4. reference translation toggles;
5. every audio example speaks Japanese;
6. complete/uncomplete survives reload;
7. invalid lesson redirects with notice;
8. reset affects only course progress;
9. each dark guided Lab board renders, speaks, opens its preset, and returns;
10. Syllabary/Frasario remain functional;
11. console has no errors.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document the v2.1 guided course"
```

---

## Plan 2 verification gate

Do not start plan 3 until:

- all automated tests pass;
- production build succeeds;
- the 11 manual checks above pass;
- screenshots at 1440×900 and 390×844 match the approved warm editorial direction;
- no process/server remains running.
