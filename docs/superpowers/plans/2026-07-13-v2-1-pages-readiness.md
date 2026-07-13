# V2.1 GitHub Pages Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the completed bilingual course safely deployable to GitHub Pages through an explicit manual workflow, with correct Vite base paths, runtime error surfacing, and documented activation steps—without publishing it yet.

**Architecture:** The application remains a static HashRouter SPA. A build-time environment variable selects the repository base path only in the Pages workflow; local development and preview remain rooted at `/`. GitHub Actions runs tests and the production build before uploading and deploying the artifact, and the workflow can only start through `workflow_dispatch`.

**Tech Stack:** Vite 6, React 18, TypeScript strict, Vitest 3, GitHub Actions Pages actions, static browser APIs.

---

## Outcome and prerequisites

This is plan **3 of 3**. Start only after plans 1 and 2 pass their verification gates.

At the end:

- local development still runs at `/`;
- Pages assets resolve under `/nihongo-practice/`;
- hash routes work after reload;
- the deploy workflow has no automatic trigger;
- tests/build are mandatory before deployment;
- unexpected runtime failures are visible and recoverable;
- the repository contains no backend, API key, or fake pronunciation service;
- publication still requires an explicit user-approved manual workflow run.

## File structure

```text
.github/
  workflows/
    deploy-pages.yml           # manual test/build/deploy workflow
src/
  errors/
    AppErrorBoundary.tsx       # visible unexpected-error boundary
    AppErrorBoundary.test.ts   # fallback and recovery behavior
    errorMessages.ts           # localized pure messages
    errorMessages.test.ts
  App.tsx                      # wrap routed application
vite.config.ts                 # environment-aware base path
README.md                      # exact activation/rollback procedure
```

---

### Task 1: Environment-aware Vite base path

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add the explicit Pages build variable**

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "GITHUB_PAGES");
  return {
    base: env.GITHUB_PAGES === "true" ? "/nihongo-practice/" : "/",
    plugins: [react()],
    server: {
      port: 5173,
      open: false,
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
```

No `404.html` fallback is needed because all application locations use `HashRouter`.

- [ ] **Step 2: Verify local and Pages build output**

Run:

```bash
rm -rf dist
npm run build
grep -Eo 'src="/[^"]+|href="/[^"]+' dist/index.html
```

Expected: local asset URLs begin with `/assets/`.

Then:

```bash
rm -rf dist
GITHUB_PAGES=true npm run build
grep -Eo 'src="/[^"]+|href="/[^"]+' dist/index.html
```

Expected: asset URLs begin with `/nihongo-practice/assets/`.

Finally run the normal build again so the local artifact is the default:

```bash
rm -rf dist
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "build: configure Vite base path for GitHub Pages"
```

---

### Task 2: Visible runtime error boundary

**Files:**
- Create: `src/errors/errorMessages.ts`
- Create: `src/errors/errorMessages.test.ts`
- Create: `src/errors/AppErrorBoundary.tsx`
- Create: `src/errors/AppErrorBoundary.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write localized recovery tests**

Create `src/errors/errorMessages.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { errorMessages } from "./errorMessages";

describe("errorMessages", () => {
  it("has complete Italian and English recovery copy", () => {
    expect(errorMessages.it).toEqual({
      title: "Qualcosa non ha funzionato",
      body: "L'app non può mostrare questa schermata. Ricarica per tornare al percorso.",
      reload: "Ricarica l'app",
    });
    expect(errorMessages.en).toEqual({
      title: "Something went wrong",
      body: "The app cannot display this screen. Reload to return to the course.",
      reload: "Reload the app",
    });
  });
});
```

Create `src/errors/AppErrorBoundary.test.ts`:

```ts
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AppErrorBoundary,
  recoverToCourse,
} from "./AppErrorBoundary";

describe("AppErrorBoundary", () => {
  it("renders localized recovery UI after an error", () => {
    const boundary = new AppErrorBoundary({
      locale: "en",
      children: null,
    });
    boundary.state = AppErrorBoundary.getDerivedStateFromError(
      new Error("boom"),
    );
    const html = renderToStaticMarkup(
      createElement(Fragment, null, boundary.render()),
    );
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Reload the app");
  });

  it("returns to the course hash before reloading", () => {
    const reload = vi.fn();
    const location = { hash: "#/broken", reload };
    recoverToCourse(location);
    expect(location.hash).toBe("#/percorso");
    expect(reload).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run and verify failure**

```bash
npx vitest run src/errors/errorMessages.test.ts src/errors/AppErrorBoundary.test.ts
```

Expected: FAIL because the message and boundary modules do not exist.

- [ ] **Step 3: Implement messages and boundary**

Create `src/errors/errorMessages.ts`:

```ts
export const errorMessages = {
  it: {
    title: "Qualcosa non ha funzionato",
    body: "L'app non può mostrare questa schermata. Ricarica per tornare al percorso.",
    reload: "Ricarica l'app",
  },
  en: {
    title: "Something went wrong",
    body: "The app cannot display this screen. Reload to return to the course.",
    reload: "Reload the app",
  },
} as const;
```

Create `src/errors/AppErrorBoundary.tsx`:

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";
import type { Locale } from "../i18n/LocaleContext";
import { errorMessages } from "./errorMessages";

interface Props {
  locale: Locale;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

interface RecoveryLocation {
  hash: string;
  reload: () => void;
}

export function recoverToCourse(location: RecoveryLocation): void {
  location.hash = "#/percorso";
  location.reload();
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unrecoverable application error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const copy = errorMessages[this.props.locale];
    return (
      <main className="app-error" role="alert">
        <p className="app-error__mark" aria-hidden="true">あ</p>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <button
          type="button"
          onClick={() => recoverToCourse(window.location)}
        >
          {copy.reload}
        </button>
      </main>
    );
  }
}
```

- [ ] **Step 4: Wrap the route tree**

Add:

```tsx
import { AppErrorBoundary } from "./errors/AppErrorBoundary";
```

Replace the `AppContent` return with this complete tree:

```tsx
return (
  <AppErrorBoundary locale={locale}>
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
  </AppErrorBoundary>
);
```

`LocaleProvider` and `ScriptProvider` remain around `AppContent`, so the boundary
can always select recovery copy. The boundary now also catches unexpected errors
from `HashRouter` and `ProgressProvider`.

- [ ] **Step 5: Style the recovery screen**

Add:

```css
.app-error {
  display: grid;
  min-height: 100vh;
  place-content: center;
  justify-items: start;
  padding: 2rem;
  background: var(--paper);
}

.app-error__mark {
  display: grid;
  width: 4rem;
  height: 4rem;
  margin: 0 0 1rem;
  place-items: center;
  border-radius: 1.2rem;
  background: var(--accent);
  color: white;
  font-size: 2rem;
  font-weight: 900;
}

.app-error button {
  border: 0;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--time);
  color: white;
  font-weight: 800;
}
```

- [ ] **Step 6: Test/build/commit**

```bash
npx vitest run src/errors/errorMessages.test.ts src/errors/AppErrorBoundary.test.ts
npm run build
git add src/errors src/App.tsx src/styles.css
git commit -m "feat: surface unrecoverable application errors"
```

---

### Task 3: Manual GitHub Pages workflow

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Create the workflow exactly**

```yaml
name: Deploy GitHub Pages

on:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Test
        run: npm test

      - name: Build for Pages
        run: npm run build
        env:
          GITHUB_PAGES: "true"

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify the trigger is manual-only**

Run:

```bash
grep -nE 'workflow_dispatch|push:|pull_request:' .github/workflows/deploy-pages.yml
```

Expected:

```text
4:  workflow_dispatch:
```

There must be no `push:` or `pull_request:` trigger.

- [ ] **Step 3: Validate the same commands locally**

```bash
npm ci
npm test
GITHUB_PAGES=true npm run build
test -s dist/index.html
```

Expected: install, tests, and Pages build succeed; `dist/index.html` is non-empty.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "ci: prepare manual GitHub Pages deployment"
```

Do not run the workflow and do not create/push a GitHub repository in this task.

---

### Task 4: Deployment documentation and privacy note

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a “GitHub Pages (prepared, not published)” section**

Append this exact bilingual section to `README.md`:

```markdown
## GitHub Pages (predisposto, non pubblicato)

L'app è interamente statica. Percorso, traduzioni bilingui, progressi,
Laboratorio, Sillabario e sintesi vocale del browser non richiedono un backend.

Il repository include il workflow esclusivamente manuale
`.github/workflows/deploy-pages.yml`.

Per pubblicare dopo un'approvazione esplicita:

1. Creare o collegare il repository GitHub come `nihongo-practice`.
2. Eseguire il push del branch approvato per la pubblicazione.
3. In **Settings → Pages**, scegliere **GitHub Actions** come sorgente.
4. Aprire **Actions → Deploy GitHub Pages → Run workflow**.
5. Verificare l'URL generato e tutte le route hash.

Il workflow non ha trigger `push` e non può pubblicare automaticamente.

### English

The app is fully static. The course, bilingual translations, progress,
Sentence Lab, Hiragana chart, and browser speech synthesis do not require a
backend.

The repository includes the manual-only workflow
`.github/workflows/deploy-pages.yml`.

To publish after explicit approval:

1. Create or connect the GitHub repository as `nihongo-practice`.
2. Push the branch approved for publication.
3. In **Settings → Pages**, select **GitHub Actions** as the source.
4. Open **Actions → Deploy GitHub Pages → Run workflow**.
5. Verify the generated URL and every hash route.

The workflow has no `push` trigger and cannot publish automatically.
```

- [ ] **Step 2: Document storage and speech privacy**

Append immediately below the Pages section:

```markdown
### Dati locali e voce

Le preferenze e i progressi restano sul browser e dispositivo correnti nelle
chiavi `nihongo.script`, `nihongo.locale.primary`,
`nihongo.locale.reference` e `nihongo.course.progress`.

La v2.1 usa soltanto la sintesi vocale fornita dal browser o dal sistema
operativo. L'app non registra audio e non invia testo o audio a un proprio
backend; l'eventuale elaborazione online di una voce dipende dal browser,
dal sistema e dalla voce scelta.

Un futuro riconoscimento vocale del browser potrebbe usare server del
fornitore e richiederà un avviso visibile. Una valutazione reale della
pronuncia richiederebbe invece un servizio con credenziali protette.

#### Local data and speech

Preferences and progress stay on the current browser and device under
`nihongo.script`, `nihongo.locale.primary`, `nihongo.locale.reference`, and
`nihongo.course.progress`.

V2.1 only uses speech synthesis supplied by the browser or operating system.
The app records no audio and sends no text or audio to an application backend;
whether a voice is processed online depends on the browser, operating system,
and selected voice.

Future browser speech recognition may use vendor servers and will require a
visible notice. Real pronunciation assessment would require a service with
protected credentials.
```

- [ ] **Step 3: Document rollback**

Append:

```markdown
### Disattivare o ripristinare Pages

- In **Settings → Pages**, usare **Unpublish site** per rimuovere il sito; oppure
- rieseguire il workflow di una distribuzione precedente già verificata, o
  eseguirlo manualmente da un branch che punta al commit desiderato.

La disattivazione di Pages non modifica lo sviluppo locale né i progressi già
salvati nei browser.

#### Disable or roll back Pages

- In **Settings → Pages**, use **Unpublish site** to remove the site; or
- rerun the workflow for a previously verified deployment, or run it manually
  from a branch that points to the desired commit.

Disabling Pages does not affect local development or progress already stored
in browsers.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: explain Pages activation and browser-only architecture"
```

---

### Task 5: Final release-candidate verification

**Files:**
- No source changes expected

- [ ] **Step 1: Clean install, tests, and both builds**

```bash
rm -rf node_modules dist
npm ci
npm test
npm run build
rm -rf dist
GITHUB_PAGES=true npm run build
```

Expected:

- install succeeds;
- all tests pass;
- both builds succeed;
- Pages `dist/index.html` references `/nihongo-practice/assets/`.

- [ ] **Step 2: Preview the Pages artifact under its base path**

Start the preview as a long-lived process. When using the Bash tool, run this
with `mode: "async"` and `detach: true`, keep the returned `shellId`, and do not
append `&`:

```bash
GITHUB_PAGES=true npm run preview -- --host 127.0.0.1 --port 5182 --strictPort
```

After the process reports the preview URL, run:

```bash
for attempt in 1 2 3 4 5; do
  curl -fsS http://127.0.0.1:5182/nihongo-practice/ >/dev/null && break
  sleep 1
done
curl -fsS http://127.0.0.1:5182/nihongo-practice/ >/dev/null
```

Open:

```text
http://127.0.0.1:5182/nihongo-practice/
```

Verify:

1. root application opens;
2. `#/percorso` loads;
3. direct refresh on a lesson hash works;
4. guided Lab links work;
5. audio buttons remain enabled where browser support exists;
6. IT/EN/reference/script settings persist;
7. completion persists;
8. no network request targets an application backend;
9. browser console has no errors;
10. switching IT/EN updates the document language and title;
11. there is no service worker serving stale content.

After browser verification, stop the process with `stop_bash` and the exact
`shellId` returned when it was started. Do not use a name-based kill command.
Confirm that the session reports the preview process as stopped.

- [ ] **Step 3: Repository safety check**

```bash
git status --short
git --no-pager log --oneline -12
rg -n -i '(api[_-]?key|client[_-]?secret|password)\s*[:=]' src .github README.md
grep -nE 'push:|pull_request:' .github/workflows/deploy-pages.yml || true
```

Expected:

- working tree clean;
- no committed credential;
- no automatic deployment trigger.

- [ ] **Step 4: Record readiness without publishing**

Do not create a deployment commit if no files changed. Report:

- test count;
- build sizes;
- branch name and HEAD;
- preview URL checked;
- workflow is manual-only;
- GitHub repository/Pages were not created or enabled;
- backend remains unnecessary for v2.1.

---

## V2.1 completion gate

V2.1 is ready for user review only when all three plan gates pass. Publication is a separate user-approved action after visual/content review of the finished branch.
