# Public Release Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the approved corrective v2.1 implementation and produce a secure, licensed, accurately documented, manually deployable public-release candidate.

**Architecture:** Rebase only the release design and plan commits onto the immutable corrective tip `49c5582`, preserving all corrective commits unchanged. Add release hardening as focused configuration and documentation commits protected by Node-based Vitest contract tests, then run the corrective unit, visual, dependency, license, Pages, and privacy gates.

**Tech Stack:** React 18, React Router 7, TypeScript, Vite 6, Vitest 3, Playwright, GitHub Actions, GitHub Pages.

---

## File map

| Path | Responsibility |
|---|---|
| `package.json` | Public project metadata, supported Node version, scripts, and direct dependency ranges |
| `package-lock.json` | Reproducible dependency graph with the patched React Router version |
| `LICENSE` | MIT grant for the project source |
| `src/release/packageMetadata.test.ts` | Executable contract for license and public package metadata |
| `.gitignore` | Build/test output and preventive local-secret exclusions |
| `.github/workflows/deploy-pages.yml` | Manual, master-only Pages validation, build, artifact, and deployment flow |
| `src/release/pagesWorkflow.test.ts` | Executable contract for manual/master-only Pages and secret-file ignore rules |
| `README.md` | Accurate corrected-v2.1 public overview, local development, privacy, validation, and Pages instructions |
| `index.html` | Accurate pre-hydration title and search/social description |
| `src/release/publicDocumentation.test.ts` | Executable contract preventing stale public release descriptions |

Existing corrective application, course, routing, style, and test files are
integrated unchanged from `49c5582`; they are not reconstructed in this plan.

### Task 1: Integrate the approved corrective baseline

**Files:**
- Preserve: all files in corrective tip `49c55823342e8907969ec2d49f22bf9a049d63a2`
- Replay: `docs/superpowers/specs/2026-07-15-public-release-remediation-design.md`
- Replay: `docs/superpowers/plans/2026-07-15-public-release-remediation.md`

- [ ] **Step 1: Confirm the exact pre-integration topology**

Run:

```bash
git rev-parse HEAD
git rev-parse 4d78cba29dcb19aa88905ccee40ae0eb5e77f985
git rev-parse 49c55823342e8907969ec2d49f22bf9a049d63a2
git rev-list --left-right --count \
  4d78cba29dcb19aa88905ccee40ae0eb5e77f985...HEAD
git status --short --branch
```

Expected:

- `4d78cba...` resolves successfully;
- `49c5582...` resolves successfully;
- the current branch contains exactly the committed release design and plan on
  top of `4d78cba`;
- the worktree is clean.

- [ ] **Step 2: Replay only the release-documentation commits onto the corrective tip**

Run:

```bash
git rebase --onto \
  49c55823342e8907969ec2d49f22bf9a049d63a2 \
  4d78cba29dcb19aa88905ccee40ae0eb5e77f985
```

Expected: rebase completes without conflict. The 23 corrective commits retain
their original object IDs; only the two release-documentation commits receive
new IDs.

- [ ] **Step 3: Verify the integrated ancestry and file set**

Run:

```bash
git merge-base --is-ancestor \
  49c55823342e8907969ec2d49f22bf9a049d63a2 HEAD
git rev-list --left-right --count \
  49c55823342e8907969ec2d49f22bf9a049d63a2...HEAD
git diff --quiet \
  49c55823342e8907969ec2d49f22bf9a049d63a2 HEAD -- \
  ':!docs/superpowers/specs/2026-07-15-public-release-remediation-design.md' \
  ':!docs/superpowers/plans/2026-07-15-public-release-remediation.md'
git status --short --branch
```

Expected:

- `merge-base --is-ancestor` exits 0;
- left/right count is `0 2`;
- there is no application/configuration difference from the corrective tip
  outside the two release documents;
- the worktree is clean.

- [ ] **Step 4: Install the corrective dependency graph**

Run:

```bash
npm ci
```

Expected: installation exits 0 from the lockfile. The known React Router audit
finding may still be reported here; Task 2 removes it.

- [ ] **Step 5: Run the corrective baseline tests before release hardening**

Run:

```bash
npm test
npm run build
```

Expected: both commands exit 0. Any failure stops the release work because it
would mean the integrated corrective baseline differs from its accepted state.

### Task 2: Patch React Router and establish the public license contract

**Files:**
- Create: `LICENSE`
- Create: `src/release/packageMetadata.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Write the failing package and license contract**

Create `src/release/packageMetadata.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface PackageMetadata {
  name: string;
  version: string;
  private: boolean;
  author: string;
  license: string;
  homepage: string;
  repository: {
    type: string;
    url: string;
  };
  engines: {
    node: string;
  };
  dependencies: Record<string, string>;
}

function readRootFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("public package metadata", () => {
  it("declares the corrected release and public repository", () => {
    const packageJson = JSON.parse(
      readRootFile("package.json"),
    ) as PackageMetadata;

    expect(packageJson).toMatchObject({
      name: "nihongo-practice",
      version: "2.1.0",
      private: true,
      author: "Riccardo Chiodaroli",
      license: "MIT",
      homepage: "https://unsafecode.github.io/nihongo-practice/",
      repository: {
        type: "git",
        url: "git+https://github.com/unsafecode/nihongo-practice.git",
      },
      engines: {
        node: ">=22",
      },
    });
    expect(packageJson.dependencies["react-router"]).toBe("^7.18.1");
  });

  it("contains the approved MIT grant", () => {
    const license = readRootFile("LICENSE");

    expect(license).toContain("MIT License");
    expect(license).toContain(
      "Copyright (c) 2026 Riccardo Chiodaroli",
    );
    expect(license).toContain(
      "Permission is hereby granted, free of charge",
    );
    expect(license).toContain(
      'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND',
    );
  });
});
```

- [ ] **Step 2: Run the focused contract to verify it fails**

Run:

```bash
npm test -- src/release/packageMetadata.test.ts
```

Expected: both tests fail because package metadata still says `0.1.0`, React
Router still says `^7.6.2`, and `LICENSE` does not exist.

- [ ] **Step 3: Add the MIT license**

Create `LICENSE`:

```text
MIT License

Copyright (c) 2026 Riccardo Chiodaroli

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Set public metadata and install the patched 7.x router**

Run:

```bash
npm pkg set \
  version=2.1.0 \
  author="Riccardo Chiodaroli" \
  license=MIT \
  homepage="https://unsafecode.github.io/nihongo-practice/" \
  repository.type=git \
  repository.url="git+https://github.com/unsafecode/nihongo-practice.git" \
  engines.node=">=22"
npm install 'react-router@^7.18.1'
```

Expected:

- `package.json` declares the exact values from the test;
- `package-lock.json` root metadata matches package version `2.1.0`;
- the installed and locked React Router version is at least `7.18.1` and remains
  below major version 8.

- [ ] **Step 5: Run the package contract and dependency audits**

Run:

```bash
npm test -- src/release/packageMetadata.test.ts
npm audit --omit=dev
npm audit
node -e '
const packageJson = require("./package.json");
const lock = require("./package-lock.json");
const locked = lock.packages["node_modules/react-router"].version;
if (packageJson.dependencies["react-router"] !== "^7.18.1") process.exit(1);
if (!/^7\./.test(locked)) process.exit(1);
console.log(`react-router=${locked}`);
'
```

Expected:

- 2 focused tests pass;
- both audits report 0 vulnerabilities and exit 0;
- the final command prints a `react-router=7.x.y` version at or above `7.18.1`.

- [ ] **Step 6: Commit dependency and licensing hardening**

Run:

```bash
git add LICENSE package.json package-lock.json \
  src/release/packageMetadata.test.ts
git commit -m "chore: harden public package metadata" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: a6949409-86f4-4695-a573-55888d8c6238"
```

Expected: one commit containing only the license, package metadata, lockfile
update, and focused contract test.

### Task 3: Enforce secret exclusions and master-only Pages deployment

**Files:**
- Create: `src/release/pagesWorkflow.test.ts`
- Modify: `.gitignore`
- Modify: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Write the failing Pages and ignore-rule contract**

Create `src/release/pagesWorkflow.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRootFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("public release workflow", () => {
  it("is manual-only, master-only, and uses current Pages actions", () => {
    const workflow = readRootFile(".github/workflows/deploy-pages.yml");

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/^\s{2}(push|pull_request):/m);
    expect(workflow).toContain(
      'if [[ "$GITHUB_REF" != "refs/heads/master" ]]; then',
    );
    expect(workflow).toContain("needs: validate-ref");
    expect(workflow).toContain("actions/configure-pages@v5");
    expect(workflow).toContain("actions/upload-pages-artifact@v4");
    expect(workflow).toContain("actions/deploy-pages@v4");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("name: github-pages");
  });

  it("ignores common local secret and credential files", () => {
    const rules = new Set(
      readRootFile(".gitignore")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    );

    for (const requiredRule of [
      ".env",
      ".env.*",
      "!.env.example",
      "!.env.*.example",
      ".npmrc",
      ".netrc",
      ".aws/",
      ".azure/",
      "*.pem",
      "*.key",
      "*.p12",
      "*.pfx",
      "*.crt",
      "*.cer",
      "credentials.json",
      "secrets.json",
      "auth-cache*",
      "cookies*.txt",
    ]) {
      expect(rules.has(requiredRule), requiredRule).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the focused contract to verify it fails**

Run:

```bash
npm test -- src/release/pagesWorkflow.test.ts
```

Expected:

- workflow test fails because there is no master-ref validation and the artifact
  action is still `@v3`;
- ignore-rule test fails because the explicit secret rules are absent.

- [ ] **Step 3: Add explicit preventive ignore rules**

Append this block to `.gitignore` after the Playwright transient-output block
and before editor/log patterns:

```gitignore
# Local environment and authentication material.
.env
.env.*
!.env.example
!.env.*.example
.npmrc
.netrc
.aws/
.azure/
*.pem
*.key
*.p12
*.pfx
*.crt
*.cer
credentials.json
secrets.json
auth-cache*
cookies*.txt
```

- [ ] **Step 4: Add explicit master validation and update the artifact action**

Replace `.github/workflows/deploy-pages.yml` with:

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
  validate-ref:
    runs-on: ubuntu-latest
    steps:
      - name: Require master
        shell: bash
        run: |
          if [[ "$GITHUB_REF" != "refs/heads/master" ]]; then
            echo "::error::GitHub Pages can only be deployed from master."
            exit 1
          fi

  build:
    needs: validate-ref
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
        uses: actions/upload-pages-artifact@v4
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

- [ ] **Step 5: Run the focused contract and inspect workflow syntax**

Run:

```bash
npm test -- src/release/pagesWorkflow.test.ts
node -e '
const fs = require("node:fs");
const workflow = fs.readFileSync(
  ".github/workflows/deploy-pages.yml",
  "utf8",
);
if (!workflow.includes("workflow_dispatch:")) process.exit(1);
if (/^\s{2}(push|pull_request):/m.test(workflow)) process.exit(1);
if (!workflow.includes("needs: validate-ref")) process.exit(1);
console.log("manual master-only Pages contract present");
'
```

Expected: 2 focused tests pass and the Node check prints
`manual master-only Pages contract present`.

- [ ] **Step 6: Commit workflow and ignore hardening**

Run:

```bash
git add .gitignore .github/workflows/deploy-pages.yml \
  src/release/pagesWorkflow.test.ts
git commit -m "ci: harden manual Pages release" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: a6949409-86f4-4695-a573-55888d8c6238"
```

Expected: one commit containing only the Pages/ignore changes and their focused
contract test.

### Task 4: Correct the public-facing documentation

**Files:**
- Create: `src/release/publicDocumentation.test.ts`
- Modify: `README.md`
- Modify: `index.html`

- [ ] **Step 1: Write the failing public-documentation contract**

Create `src/release/publicDocumentation.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRootFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("public release documentation", () => {
  it("describes the corrected v2.1 experience without stale mode copy", () => {
    const readme = readRootFile("README.md");

    expect(readme).toContain("## Esperienza v2.1 corretta");
    expect(readme).toContain("sette moduli guidati e un capstone");
    expect(readme).toContain("lezioni visitate");
    expect(readme).toContain("npm run test:e2e");
    expect(readme).toContain("## Licenza");
    expect(readme).toContain("MIT");
    expect(readme).not.toContain("## Le tre modalità (v2)");
    expect(readme).not.toContain("## Idee per la v3");
    expect(readme).not.toContain("non è un corso strutturato");
  });

  it("uses accurate pre-hydration page metadata", () => {
    const html = readRootFile("index.html");

    expect(html).toContain(
      "Percorso bilingue di giapponese pratico",
    );
    expect(html).toContain(
      "<title>Hanasō · Impara il giapponese</title>",
    );
    expect(html).not.toContain(
      "frasi parlate, solo hiragana, con audio",
    );
  });
});
```

- [ ] **Step 2: Run the focused contract to verify it fails**

Run:

```bash
npm test -- src/release/publicDocumentation.test.ts
```

Expected: both tests fail against the stale README and HTML description.

- [ ] **Step 3: Replace README with the corrected public overview**

Replace `README.md` with:

```markdown
# はなそう · Hanasō

Applicazione bilingue italiano/inglese per imparare il giapponese pratico da
viaggio. Un percorso guidato introduce suoni, struttura della frase, particelle,
tempo e polarità; Laboratorio, Sillabario e Frasario restano disponibili per la
pratica libera.

Il progetto è una SPA statica: non usa account, backend, analytics, tracker,
registrazione audio o servizi applicativi esterni.

## Esperienza v2.1 corretta

Il percorso comprende sette moduli guidati e un capstone. I moduli seguono i
prerequisiti, ma rimangono sempre accessibili:

- orientamento ai suoni essenziali;
- identificazione e struttura della frase;
- ordini e richieste;
- tempo e polarità;
- movimento e luoghi;
- persone, desideri e inviti;
- domande ed esistenza;
- sintesi in una giornata di viaggio.

Ogni lezione combina regola, confronto, esplorazione guidata e riepilogo.
Il progresso indica soltanto le **lezioni visitate**: non è un punteggio e non
afferma padronanza o completamento.

La lingua principale può essere italiano o inglese, con l'altra come traduzione
di controllo. La preferenza hiragana/rōmaji è indipendente.

## Pratica libera

- **Laboratorio delle frasi** — compone frasi attraverso scenari, forme verbali,
  tempi e complementi, con feedback di naturalezza.
- **Sillabario** — tavola hiragana interattiva con gojūon,
  dakuten/handakuten, yōon e note sui suoni speciali.
- **Frasario** — frasi pratiche da viaggio con testo bilingue e sintesi vocale.

## Dati locali e voce

Non esistono account né un backend. `localStorage` contiene soltanto:

- `nihongo.locale.primary`
- `nihongo.locale.reference`
- `nihongo.script`
- `nihongo.course.progress`

Se lo storage non è disponibile, l'app continua a funzionare per la sessione
corrente.

L'audio usa esclusivamente la sintesi vocale del browser o del sistema operativo.
L'app non registra audio e non invia testo o audio a un proprio backend.
L'eventuale elaborazione online di una voce dipende dal browser, dal sistema e
dalla voce scelta.

## Sviluppo locale

Requisito: Node.js 22 o successivo.

```bash
npm ci
npm run dev
```

Vite mostra l'indirizzo locale, normalmente `http://localhost:5173`.

## Verifica

```bash
npm test
npm run build
npm run test:e2e
GITHUB_PAGES=true npm run build
npm audit --omit=dev
npm audit
```

La release corretta usa sia Vitest sia l'accettazione Playwright a desktop e
mobile. Il solo successo della build non sostituisce i controlli visuali,
di navigazione, accessibilità e contenuto.

## Architettura

- React 18 + TypeScript
- React Router con `HashRouter`
- Vite
- Vitest
- Playwright
- Web Speech API (`speechSynthesis`)
- CSS e font Manrope self-hosted

Il router hash consente refresh e collegamenti profondi su GitHub Pages senza
regole server. Non sono presenti API applicative, service worker o dipendenze
runtime esterne.

## GitHub Pages

Il repository contiene il workflow manuale
`.github/workflows/deploy-pages.yml`. Non esistono trigger `push` o
`pull_request`, e il workflow rifiuta ref diverse da `master`.

Per pubblicare dopo l'approvazione esplicita:

1. Creare o collegare `https://github.com/unsafecode/nihongo-practice`.
2. Eseguire il push del commit approvato su `master`.
3. In **Settings → Pages**, selezionare **GitHub Actions** come sorgente.
4. Aprire **Actions → Deploy GitHub Pages → Run workflow** e scegliere `master`.
5. Verificare `https://unsafecode.github.io/nihongo-practice/` e le route hash.

Per disattivare il sito, usare **Settings → Pages → Unpublish site**. Per
ripristinare una release precedente, rieseguire il relativo deployment
verificato.

## Documentazione di progetto

`docs/superpowers/specs/` contiene le specifiche approvate;
`docs/superpowers/plans/` contiene i piani di implementazione. Questi documenti
sono inclusi intenzionalmente nella repository pubblica.

## Licenza

Distribuito secondo i termini della [licenza MIT](./LICENSE).
```

- [ ] **Step 4: Correct the static HTML metadata**

Change the metadata in `index.html` to:

```html
    <meta
      name="description"
      content="Percorso bilingue di giapponese pratico con lezioni guidate, laboratorio delle frasi, sillabario e audio del browser."
    />
    <title>Hanasō · Impara il giapponese</title>
```

Keep the existing charset, viewport, favicon, root element, and Vite entry
unchanged.

- [ ] **Step 5: Run the focused documentation contract**

Run:

```bash
npm test -- src/release/publicDocumentation.test.ts
```

Expected: 2 focused tests pass.

- [ ] **Step 6: Commit corrected public documentation**

Run:

```bash
git add README.md index.html src/release/publicDocumentation.test.ts
git commit -m "docs: prepare corrected v2.1 release" \
  -m "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  -m "Copilot-Session: a6949409-86f4-4695-a573-55888d8c6238"
```

Expected: one commit containing only README/HTML corrections and their focused
contract test.

### Task 5: Run the complete corrective and public-release gates

**Files:**
- Verify: all tracked files
- Do not commit: `node_modules/`, `dist/`, `test-results/`,
  `playwright-report/`, `.playwright/`

- [ ] **Step 1: Recreate the dependency tree from the final lockfile**

Run:

```bash
rm -rf node_modules dist test-results playwright-report .playwright
npm ci
```

Expected: clean installation exits 0 and reports 0 vulnerabilities.

- [ ] **Step 2: Run the complete Vitest and TypeScript/Vite gates**

Run:

```bash
npm test
npm run build
```

Expected:

- every corrective and release-contract test file passes;
- TypeScript emits no errors;
- Vite production build exits 0.

- [ ] **Step 3: Verify the Pages build base and artifact contents**

Run:

```bash
GITHUB_PAGES=true npm run build
grep -E '(/nihongo-practice/)(favicon|assets/)' dist/index.html
bad_refs=$(
  grep -REno '(src|href)="/[^"]+' \
    dist --include='*.html' --include='*.css' --include='*.js' |
    grep -v '="/nihongo-practice/' || true
)
test -z "$bad_refs"
find dist -type f -print | sort
```

Expected:

- build exits 0;
- favicon, CSS, JS, and font references use `/nihongo-practice/`;
- no deployable HTML/CSS/JS reference incorrectly starts at another root path;
- output contains only intentional static release assets.

- [ ] **Step 4: Install Chromium and run all corrective Playwright gates**

Run:

```bash
npx playwright install chromium
npm run test:e2e
```

Expected:

- desktop 1440 × 1000 and mobile 390 × 844 projects pass;
- navigation, geometry, target-size, font, console, request, and screenshot
  assertions pass;
- no snapshot is silently updated.

- [ ] **Step 5: Run production and complete dependency audits**

Run:

```bash
npm audit --omit=dev
npm audit
npm outdated --json || test "$?" -eq 1
```

Expected:

- both audits exit 0 with 0 vulnerabilities;
- outdated output may list intentional major-version upgrades, but React Router
  is not below the patched 7.x release required by Task 2.

- [ ] **Step 6: Verify direct dependency licenses and bundled notices**

Run:

```bash
node --input-type=module -e '
import fs from "node:fs";
const root = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const name of Object.keys(root.dependencies ?? {})) {
  const pkg = JSON.parse(
    fs.readFileSync(`node_modules/${name}/package.json`, "utf8"),
  );
  if (pkg.license !== "MIT") {
    throw new Error(`${name} has unexpected license ${pkg.license}`);
  }
  console.log(`${name}\t${pkg.version}\t${pkg.license}`);
}
'
node --input-type=module -e '
import fs from "node:fs";
const js = fs.readdirSync("dist/assets").find((file) => file.endsWith(".js"));
if (!js) throw new Error("Missing production JavaScript bundle");
const bundle = fs.readFileSync(`dist/assets/${js}`, "utf8");
if (!bundle.includes("@license React")) {
  throw new Error("React legal comments were not preserved");
}
console.log("bundled legal comments preserved");
'
```

Expected: React, React DOM, and React Router report MIT; bundle check reports
`bundled legal comments preserved`.

- [ ] **Step 7: Smoke-test the built Pages artifact**

Run in one shell:

```bash
GITHUB_PAGES=true npm run preview -- \
  --host 127.0.0.1 --port 4173 --strictPort \
  > /tmp/nihongo-pages-preview.log 2>&1 &
preview_pid=$!
trap 'kill "$preview_pid" 2>/dev/null || true' EXIT
sleep 2

index=$(curl -fsS http://127.0.0.1:4173/nihongo-practice/)
printf '%s' "$index" | grep '/nihongo-practice/favicon.svg'
printf '%s' "$index" | grep '/nihongo-practice/assets/'

for path in \
  '/nihongo-practice/' \
  '/nihongo-practice/favicon.svg' \
  '/nihongo-practice/#/percorso' \
  '/nihongo-practice/#/percorso/sounds/sounds-core'
do
  curl -fsS -o /dev/null \
    "http://127.0.0.1:4173${path}"
done
```

Expected: every request exits 0 and the index contains only repository-base
favicon and asset URLs. The Playwright suite supplies the console/network
assertions for the rendered hash routes.

- [ ] **Step 8: Recheck tracked secret paths and credential signatures without printing values**

Run:

```bash
if git ls-files | grep -Eai \
  '(^|/)(\.env($|\.)|[^/]*\.(pem|key|p12|pfx|crt|cer)$|\.npmrc$|\.netrc$|credentials\.json$|secrets\.json$|auth-cache|cookies.*\.txt$)'
then
  exit 1
fi

matches=$(
  git grep -IlE \
    '(github_pat_|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|DefaultEndpointsProtocol=|AccountKey=)' \
    -- . ':!package-lock.json' || true
)
test -z "$matches"
```

Expected: no tracked sensitive path or matching file is reported. Secret values
are never printed.

- [ ] **Step 9: Verify the final history, diff, and worktree**

Run:

```bash
git diff --check
git merge-base --is-ancestor \
  49c55823342e8907969ec2d49f22bf9a049d63a2 HEAD
git --no-pager log --oneline \
  49c55823342e8907969ec2d49f22bf9a049d63a2..HEAD
git --no-pager status --short --branch
```

Expected:

- no whitespace errors;
- the full corrective tip remains an ancestor;
- log shows the replayed design/plan plus three focused hardening commits;
- worktree has no tracked or untracked changes;
- ignored generated artifacts may remain locally but are not committed.

The implementation ends here. Do not create/configure a remote, push, create
the public repository, enable Pages, or run the deployment workflow.
