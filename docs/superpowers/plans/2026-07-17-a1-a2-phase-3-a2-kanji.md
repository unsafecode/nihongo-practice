# A2 Complete Path + Contextual Kanji Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the complete **A2 level, aligned with JF/CEFR Can-do** descriptors (an alignment claim only — never implies or claims any certification) — exactly 15 modules × 4 = 60 lessons, a Can-do-serving grammar spiral, a 120-glyph contextual-kanji recognition system, a two-level selector UX, and truthful A2 checkpoint/progress — on top of the frozen A1 release, reusing the shared Phase 1 foundation/exercise/validator architecture with zero destructive progress migration.

**Architecture:** A2 mirrors A1's proven pipeline — a declarative frozen manifest (`a2/manifest.ts`) → authored semantic catalogs (families/senses/values, no Japanese literals in lesson builders) → the shared pure `realizeVariant` + `validateFoundations` oracle → a release gate (`validateA2Release`) run at `prebuild` → deterministic runtime view-models keyed by a shared release version/seed. Three genuinely new subsystems extend the shared architecture rather than fork it: (1) an **A2 form/aspect layer** that teaches plain forms, て-form, 〜ている and the clause-combining spiral by adding bound-morpheme ending registries and clause families to the *existing* realizer; (2) a **contextual-kanji layer** (`KanjiEntry`/`KanjiExposure`/assistance policy) that renders semantic ruby, enforces first-supported→supported-retrieval→revealable→assessed ordering, and never lets hiragana/romaji bypass an assessed recognition target; (3) a **level layer** that adds an explicit A2 `CourseLevel`, a URL-routable level selector, and separate A2 Can-do/checkpoint evidence in the already-level-aware V4 progress record. A2 has **no phonetic module**, so all 60 lessons use the single instructional/synthesis depth contract and pass straight through `validateFoundations`.

**Tech Stack:** TypeScript 5.6 (strict), React 18.3, react-router 7 (HashRouter, GitHub Pages), Vite 6, Vitest 3, Playwright, vite-node (prebuild gate). Node types 22. Browser-only, static, privacy-preserving (no network at runtime), accessible (WCAG AA, 200% zoom, ≥44px targets, no horizontal overflow at 320px).

---

## How to work this plan

- **Execution model:** subagent-driven-development. Every task below begins with a **fresh spec re-read step** (the implementer re-reads the named spec sections against the current code *before* writing tests) and ends with a **subagent quality-review step** (a second subagent reviews the finished task diff against the spec + this plan and files inline findings). Do not skip either; they are numbered steps.
- **TDD is mandatory.** Every code step is: write the failing test → run it, see the exact failure → write the minimal implementation → run it, see it pass → commit. Documentation/data-table steps commit on their own.
- **Commit granularity:** one commit per numbered "Commit" step. Never batch two tasks into one commit.
- **Canonical Japanese lives in data, not boilerplate.** Lesson builders reference semantic *IDs* (`a2-value-*`, `a2-sense-*`, `a2-family-*`); the actual kana/kanji strings live only in the semantic-value catalog, the realizer ending registries, and the kanji catalog. A lint step (Task 4 Step 2) fails if a Japanese code point appears in any `src/course/a2/**/module*.ts` lesson file.
- **Baseline (verified at plan authoring, HEAD `53e4d11`):** `npx tsc --noEmit` → clean; `npx vitest run` → green; `npm run build` → succeeds; `GITHUB_PAGES=true npm run build` → succeeds. If any is red before you start, stop and fix the baseline first.

---

## Locked decisions (authoritative reference)

These three tables are the single source of truth the code encodes. They are repeated at the top of the task that implements each one; if you edit a table, edit both copies.

### L1 — The fixed 60-lesson A2 manifest (15 modules × 4)

Module IDs are kebab-case and are the lesson-ID prefixes (`<module>-1..4`). Order is prerequisite order (each module's prerequisite is the previous module). Module 15 (`a2-synthesis`) is the synthesis/capstone module; its lessons introduce **no new** family/sense/value/kanji (capstone-no-new-content rule) and lesson 4 is the A2 checkpoint scenario. Every lesson's outcome is a concrete Can-do served by that lesson.

| # | Module ID | Lesson ID | Outcome (EN gloss; IT parity authored in copy) |
|---|-----------|-----------|-----------------------------------------------|
| 1 | connected-conversation | connected-conversation-1 | React with natural backchannels and a follow-up question to keep a short chat going |
| | | connected-conversation-2 | Link two related remarks on one topic using でも and それから |
| | | connected-conversation-3 | Ask someone to repeat or speak slowly, and confirm you understood |
| | | connected-conversation-4 | Recognize and respond to casual plain-form statements among friends |
| 2 | plans-invitations | plans-invitations-1 | Say what you plan to do this week using 〜予定です with days and times |
| | | plans-invitations-2 | State a weekend intention using plain-form + つもりです |
| | | plans-invitations-3 | Invite someone and accept or decline politely |
| | | plans-invitations-4 | Arrange when and where to meet and confirm the appointment |
| 3 | experiences-narratives | experiences-narratives-1 | Say whether you have ever done something using 〜たことがあります |
| | | experiences-narratives-2 | Tell a short past story in order (きのう…それから…) |
| | | experiences-narratives-3 | Describe how an experience felt using plain-past adjectives |
| | | experiences-narratives-4 | Ask about someone's past experiences and react |
| 4 | reasons-opinions | reasons-opinions-1 | Give a reason using 〜から |
| | | reasons-opinions-2 | Explain a situation politely using 〜ので |
| | | reasons-opinions-3 | State an opinion using plain-form + と思います |
| | | reasons-opinions-4 | Agree or disagree gently and add a short reason |
| 5 | sequencing-ongoing | sequencing-ongoing-1 | Describe a sequence of actions using the て-form |
| | | sequencing-ongoing-2 | Say what someone is doing right now using 〜ています |
| | | sequencing-ongoing-3 | Describe habits and ongoing states using 〜ています |
| | | sequencing-ongoing-4 | Narrate a morning routine as one connected sequence |
| 6 | permission-requests | permission-requests-1 | Ask for and give permission using 〜てもいいですか |
| | | permission-requests-2 | Say what is not allowed using 〜てはいけません |
| | | permission-requests-3 | Make a polite request using 〜てください |
| | | permission-requests-4 | Ask someone not to do something using 〜ないでください |
| 7 | neighborhood-services | neighborhood-services-1 | Ask whether you can do something at a place (使えますか) |
| | | neighborhood-services-2 | Say what you can and cannot do at local facilities |
| | | neighborhood-services-3 | Ask for and follow simple directions to a nearby facility |
| | | neighborhood-services-4 | Explain what a neighborhood place is for and its hours |
| 8 | restaurant-problems | restaurant-problems-1 | Order food and drink and ask about the menu |
| | | restaurant-problems-2 | Make special requests politely |
| | | restaurant-problems-3 | Report a problem with an order and ask for a fix |
| | | restaurant-problems-4 | Handle paying and small restaurant problems in a short exchange |
| 9 | shopping-returns | shopping-returns-1 | Compare two products using 〜のほうが〜より |
| | | shopping-returns-2 | Say which is the most … using 〜がいちばん… |
| | | shopping-returns-3 | Ask about price, size, and availability and decide |
| | | shopping-returns-4 | Explain a problem with a purchase and ask to return or exchange it |
| 10 | health-advice | health-advice-1 | Describe symptoms and how you feel |
| | | health-advice-2 | Give and receive advice using 〜たほうがいいです |
| | | health-advice-3 | Ask about and explain what to do to get better |
| | | health-advice-4 | Make or change a clinic appointment because you are unwell |
| 11 | work-study-messages | work-study-messages-1 | Write a short message to say you will be late or absent, with a reason |
| | | work-study-messages-2 | Ask a colleague or teacher to do something for you politely |
| | | work-study-messages-3 | Report progress on work or study and what is left to do |
| | | work-study-messages-4 | Reply to a request and confirm what you will do |
| 12 | travel-reservations | travel-reservations-1 | Make a simple reservation with dates and numbers |
| | | travel-reservations-2 | Ask about and describe a travel schedule (departure/arrival) |
| | | travel-reservations-3 | Explain a travel problem and ask for help |
| | | travel-reservations-4 | Change or cancel a booking and confirm the new plan |
| 13 | relationships-events | relationships-events-1 | Talk about family and friends and how you are related |
| | | relationships-events-2 | Say who gave or received something using あげます / もらいます |
| | | relationships-events-3 | Talk about events and celebrations and what you did |
| | | relationships-events-4 | Choose and describe a gift and explain who it is for |
| 14 | practical-texts | practical-texts-1 | Read a schedule or timetable and answer when/where questions |
| | | practical-texts-2 | Understand a notice or sign (hours, prices, prohibitions) |
| | | practical-texts-3 | Read a short message or invitation and reply appropriately |
| | | practical-texts-4 | Fill in a simple form with times, dates, and numbers |
| 15 | a2-synthesis | a2-synthesis-1 | Scenario: plan and arrange a weekend outing (plans + invitation + reasons) |
| | | a2-synthesis-2 | Scenario: handle a service/shopping situation with a comparison and a request/return |
| | | a2-synthesis-3 | Scenario: manage a health/absence situation with advice and a message |
| | | a2-synthesis-4 | Scenario: recount a trip and read its practical texts (A2 checkpoint scenario) |

**Route count:** 60 lesson routes + 1 course route per level. **Lesson-ID stability:** these 60 IDs are frozen; never renumber. Any future rename goes through `A2_LEGACY_LESSON_ALIASES` (empty at release).

### L2 — Grammar spiral coverage matrix (Can-do-serving; §7.1)

Each row: the form, its **named Can-do**, the **first supported intro** lesson, a **controlled-practice** lesson, a **true-transfer** lesson, and **≥1 spaced later recurrence**. Forms appear only as content that serves a Can-do — never as a standalone grammar drill. Introduction-before-use is enforced by `validateFoundations`'s `availableContentByLesson` gate (a form's construction/concept ID is only "available" in lessons at or after its intro lesson).

| # | Form | Named Can-do ID | Intro (first-supported) | Controlled practice | True transfer | Spaced recurrence |
|---|------|-----------------|-------------------------|---------------------|---------------|-------------------|
| 1 | Plain forms (る/ない/た/なかった; い-adj plain; だ) | a2-cando-recognize-plain-forms | connected-conversation-4 | reasons-opinions-3 | experiences-narratives-2 | a2-synthesis-1, a2-synthesis-4 |
| 2 | て-form (sequential connective) | a2-cando-sequence-te | sequencing-ongoing-1 | sequencing-ongoing-2 | sequencing-ongoing-4 | restaurant-problems-4, a2-synthesis-3 |
| 3 | 〜ている (ongoing / resultant state) | a2-cando-ongoing-teiru | sequencing-ongoing-3 | sequencing-ongoing-4 | work-study-messages-3 | relationships-events-3, a2-synthesis-2 |
| 4 | 〜てください (request) | a2-cando-request-tekudasai | permission-requests-3 | restaurant-problems-2 | work-study-messages-2 | travel-reservations-3, a2-synthesis-3 |
| 5 | 〜てもいい (permission) | a2-cando-permission-temoii | permission-requests-1 | permission-requests-3 | neighborhood-services-1 | restaurant-problems-2, a2-synthesis-2 |
| 6 | 〜てはいけない (prohibition) | a2-cando-prohibition-tewaikenai | permission-requests-2 | permission-requests-4 | practical-texts-2 | a2-synthesis-2 |
| 7 | 〜ないでください (negative request) | a2-cando-negative-request | permission-requests-4 | health-advice-3 | travel-reservations-3 | a2-synthesis-3 |
| 8 | 〜たことがある (experience) | a2-cando-experience-takoto | experiences-narratives-1 | experiences-narratives-3 | travel-reservations-2 | relationships-events-3, a2-synthesis-4 |
| 9 | 予定 / つもり (plans / intentions) | a2-cando-intentions-plans | plans-invitations-1 (予定), plans-invitations-2 (つもり) | plans-invitations-3 | plans-invitations-4 | travel-reservations-1, a2-synthesis-1 |
| 10 | 〜から (reason) | a2-cando-reason-kara | reasons-opinions-1 | reasons-opinions-4 | health-advice-2 | work-study-messages-1, a2-synthesis-3 |
| 11 | 〜ので (reason, softer/polite) | a2-cando-reason-node | reasons-opinions-2 | work-study-messages-1 | travel-reservations-3 | a2-synthesis-3 |
| 12 | 〜と思う (opinion) | a2-cando-opinion-toomou | reasons-opinions-3 | reasons-opinions-4 | shopping-returns-3 | practical-texts-3, a2-synthesis-2 |
| 13 | Comparisons (のほうが / より / いちばん) | a2-cando-compare | shopping-returns-1 (のほうが/より), shopping-returns-2 (いちばん) | shopping-returns-3 | travel-reservations-2 | a2-synthesis-2 |
| 14 | Possibility (使えます / 〜ことができる) | a2-cando-possibility | neighborhood-services-1 | neighborhood-services-2 | shopping-returns-3 | travel-reservations-1, a2-synthesis-2 |
| 15 | Connectors (でも / それから / だから) | a2-cando-connectors | connected-conversation-2 | reasons-opinions-4 | experiences-narratives-2 | practical-texts-3, a2-synthesis-1 |

A dedicated validator (`validateA2GrammarSpiral`, Task 2) fails the release if any form lacks any of the five roles, or if a controlled-practice/transfer/recurrence lesson precedes the intro lesson in canonical order.

### L3 — Contextual kanji inventory: exactly 120 glyphs, contextually distributed, M15 introduces zero new glyphs

**Count decision:** exactly **120** unique glyphs (inside the spec's 100–150 band; the user preference). A1 taught **no** kanji (romaji/hiragana only), so all 120 are first-introduced in A2 — no A1 overlap to reconcile. Every glyph is anchored to a **contextual lexeme** drawn from its module's Can-dos (no standalone kanji dump). **Modality is recognition only:** read / choose / match — never handwriting, stroke order, or IME production.

**Distribution (per module, sums to exactly 120):** M1=8, M2=12, M3=9, M4=8, M5=9, M6=8, M7=8, M8=8, M9=8, M10=8, M11=8, M12=9, M13=8, M14=9, **M15=0**. The synthesis module (M15) introduces **zero new glyphs** — it only re-exposes and assesses glyphs first supported in M1–M14 (the four M14 straddling glyphs 料/金/開/閉 have their assessed stage at `a2-synthesis-4`, i.e. M15 *assesses earlier* glyphs). This is a deliberate change from an earlier "8 per module" mechanical assumption: eight high-frequency glyphs (今 日 来 月 年 毎 山 本) that were previously first-exposed at synthesis are moved into contextually appropriate earlier modules (see the table) so that **no glyph is first-supported at any synthesis lesson**. The per-module counts are the authoritative constant `A2_KANJI_DISTRIBUTION` (Task 3); nothing derives them from a uniform "8".

**Per-glyph four-stage schedule — every stage is explicit in the table (no cohort shortcut).** The inventory table lists all four canonical stages per glyph: **first-supported → supported-retrieval → revealable → assessed**. Every row satisfies strict `first-supported < supported-retrieval < revealable < assessed` in canonical lesson order (module order 1..15 × lesson 1..4), so assessment always follows at least one supported retrieval and one revealable exposure. Two spacing patterns recur (they are *descriptive*, not a builder mechanism — the builder reads the four explicit columns, §Task 3):

- **Within-module (A):** first-supported `M-1` → supported-retrieval `M-2` → revealable `M-3` → assessed `M-4`.
- **Straddling (B):** first-supported `M-2` → supported-retrieval `M-3` → revealable `M-4` → assessed = the **next** module's `-1` (M14's straddling glyphs assess at `a2-synthesis-4`, the checkpoint).

**Moved-glyph per-glyph readings (for the Task 3 builder `kana`/`romaji` fields).** The table's reading column shows the whole contextual lexeme; the recognition-target reading for the eight relocated glyphs is: 今→こん (`kon`, in 今週), 日→び (`bi`, in 曜日), 来→らい (`rai`, in 来月), 月→げつ (`getsu`, in 来月), 年→ねん (`nen`, in 去年), 毎→まい (`mai`, in 毎日), 山→やま (`yama`, standalone 山), 本→ほん (`hon`, standalone 本).

| Module | Glyph | Contextual lexeme (reading) | First-supported | Supported-retrieval | Revealable | Assessed |
|--------|-------|-----------------------------|-----------------|---------------------|------------|----------|
| M1 | 話 | 話します (はなします) | connected-conversation-1 | connected-conversation-2 | connected-conversation-3 | connected-conversation-4 |
| M1 | 言 | 言います (いいます) | connected-conversation-1 | connected-conversation-2 | connected-conversation-3 | connected-conversation-4 |
| M1 | 聞 | 聞きます (ききます) | connected-conversation-1 | connected-conversation-2 | connected-conversation-3 | connected-conversation-4 |
| M1 | 友 | 友だち (ともだち) | connected-conversation-1 | connected-conversation-2 | connected-conversation-3 | connected-conversation-4 |
| M1 | 思 | 思います (おもいます) | connected-conversation-2 | connected-conversation-3 | connected-conversation-4 | plans-invitations-1 |
| M1 | 名 | 名前 (なまえ) | connected-conversation-2 | connected-conversation-3 | connected-conversation-4 | plans-invitations-1 |
| M1 | 前 | 名前 (なまえ) | connected-conversation-2 | connected-conversation-3 | connected-conversation-4 | plans-invitations-1 |
| M1 | 何 | 何 (なに) | connected-conversation-2 | connected-conversation-3 | connected-conversation-4 | plans-invitations-1 |
| M2 | 予 | 予定 (よてい) | plans-invitations-1 | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 |
| M2 | 定 | 予定 (よてい) | plans-invitations-1 | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 |
| M2 | 曜 | 曜日 (ようび) | plans-invitations-1 | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 |
| M2 | 会 | 会います (あいます) | plans-invitations-1 | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 |
| M2 | 今 | 今週 (こんしゅう) | plans-invitations-1 | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 |
| M2 | 日 | 曜日 (ようび) | plans-invitations-1 | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 |
| M2 | 週 | 今週 (こんしゅう) | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 | experiences-narratives-1 |
| M2 | 末 | 週末 (しゅうまつ) | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 | experiences-narratives-1 |
| M2 | 待 | 待ちます (まちます) | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 | experiences-narratives-1 |
| M2 | 約 | 約束 (やくそく) | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 | experiences-narratives-1 |
| M2 | 来 | 来月 (らいげつ) | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 | experiences-narratives-1 |
| M2 | 月 | 来月 (らいげつ) | plans-invitations-2 | plans-invitations-3 | plans-invitations-4 | experiences-narratives-1 |
| M3 | 去 | 去年 (きょねん) | experiences-narratives-1 | experiences-narratives-2 | experiences-narratives-3 | experiences-narratives-4 |
| M3 | 楽 | 楽しい (たのしい) | experiences-narratives-1 | experiences-narratives-2 | experiences-narratives-3 | experiences-narratives-4 |
| M3 | 初 | 初めて (はじめて) | experiences-narratives-1 | experiences-narratives-2 | experiences-narratives-3 | experiences-narratives-4 |
| M3 | 度 | 一度 (いちど) | experiences-narratives-1 | experiences-narratives-2 | experiences-narratives-3 | experiences-narratives-4 |
| M3 | 年 | 去年 (きょねん) | experiences-narratives-1 | experiences-narratives-2 | experiences-narratives-3 | experiences-narratives-4 |
| M3 | 有 | 有名 (ゆうめい) | experiences-narratives-2 | experiences-narratives-3 | experiences-narratives-4 | reasons-opinions-1 |
| M3 | 泳 | 泳ぎます (およぎます) | experiences-narratives-2 | experiences-narratives-3 | experiences-narratives-4 | reasons-opinions-1 |
| M3 | 登 | 登ります (のぼります) | experiences-narratives-2 | experiences-narratives-3 | experiences-narratives-4 | reasons-opinions-1 |
| M3 | 旅 | 旅行 (りょこう) | experiences-narratives-2 | experiences-narratives-3 | experiences-narratives-4 | reasons-opinions-1 |
| M4 | 理 | 理由 (りゆう) | reasons-opinions-1 | reasons-opinions-2 | reasons-opinions-3 | reasons-opinions-4 |
| M4 | 由 | 理由 (りゆう) | reasons-opinions-1 | reasons-opinions-2 | reasons-opinions-3 | reasons-opinions-4 |
| M4 | 考 | 考えます (かんがえます) | reasons-opinions-1 | reasons-opinions-2 | reasons-opinions-3 | reasons-opinions-4 |
| M4 | 意 | 意見 (いけん) | reasons-opinions-1 | reasons-opinions-2 | reasons-opinions-3 | reasons-opinions-4 |
| M4 | 見 | 意見 (いけん) | reasons-opinions-2 | reasons-opinions-3 | reasons-opinions-4 | sequencing-ongoing-1 |
| M4 | 気 | 気持ち (きもち) | reasons-opinions-2 | reasons-opinions-3 | reasons-opinions-4 | sequencing-ongoing-1 |
| M4 | 持 | 気持ち (きもち) | reasons-opinions-2 | reasons-opinions-3 | reasons-opinions-4 | sequencing-ongoing-1 |
| M4 | 悪 | 悪い (わるい) | reasons-opinions-2 | reasons-opinions-3 | reasons-opinions-4 | sequencing-ongoing-1 |
| M5 | 起 | 起きます (おきます) | sequencing-ongoing-1 | sequencing-ongoing-2 | sequencing-ongoing-3 | sequencing-ongoing-4 |
| M5 | 寝 | 寝ます (ねます) | sequencing-ongoing-1 | sequencing-ongoing-2 | sequencing-ongoing-3 | sequencing-ongoing-4 |
| M5 | 使 | 使います (つかいます) | sequencing-ongoing-1 | sequencing-ongoing-2 | sequencing-ongoing-3 | sequencing-ongoing-4 |
| M5 | 作 | 作ります (つくります) | sequencing-ongoing-1 | sequencing-ongoing-2 | sequencing-ongoing-3 | sequencing-ongoing-4 |
| M5 | 毎 | 毎日 (まいにち) | sequencing-ongoing-1 | sequencing-ongoing-2 | sequencing-ongoing-3 | sequencing-ongoing-4 |
| M5 | 洗 | 洗います (あらいます) | sequencing-ongoing-2 | sequencing-ongoing-3 | sequencing-ongoing-4 | permission-requests-1 |
| M5 | 終 | 終わります (おわります) | sequencing-ongoing-2 | sequencing-ongoing-3 | sequencing-ongoing-4 | permission-requests-1 |
| M5 | 始 | 始まります (はじまります) | sequencing-ongoing-2 | sequencing-ongoing-3 | sequencing-ongoing-4 | permission-requests-1 |
| M5 | 働 | 働きます (はたらきます) | sequencing-ongoing-2 | sequencing-ongoing-3 | sequencing-ongoing-4 | permission-requests-1 |
| M6 | 入 | 入ります (はいります) | permission-requests-1 | permission-requests-2 | permission-requests-3 | permission-requests-4 |
| M6 | 口 | 入口 (いりぐち) | permission-requests-1 | permission-requests-2 | permission-requests-3 | permission-requests-4 |
| M6 | 出 | 出口 (でぐち) | permission-requests-1 | permission-requests-2 | permission-requests-3 | permission-requests-4 |
| M6 | 止 | 止まります (とまります) | permission-requests-1 | permission-requests-2 | permission-requests-3 | permission-requests-4 |
| M6 | 禁 | 禁止 (きんし) | permission-requests-2 | permission-requests-3 | permission-requests-4 | neighborhood-services-1 |
| M6 | 消 | 消します (けします) | permission-requests-2 | permission-requests-3 | permission-requests-4 | neighborhood-services-1 |
| M6 | 座 | 座ります (すわります) | permission-requests-2 | permission-requests-3 | permission-requests-4 | neighborhood-services-1 |
| M6 | 立 | 立ちます (たちます) | permission-requests-2 | permission-requests-3 | permission-requests-4 | neighborhood-services-1 |
| M7 | 病 | 病院 (びょういん) | neighborhood-services-1 | neighborhood-services-2 | neighborhood-services-3 | neighborhood-services-4 |
| M7 | 院 | 病院 (びょういん) | neighborhood-services-1 | neighborhood-services-2 | neighborhood-services-3 | neighborhood-services-4 |
| M7 | 銀 | 銀行 (ぎんこう) | neighborhood-services-1 | neighborhood-services-2 | neighborhood-services-3 | neighborhood-services-4 |
| M7 | 行 | 銀行 (ぎんこう) | neighborhood-services-1 | neighborhood-services-2 | neighborhood-services-3 | neighborhood-services-4 |
| M7 | 局 | 郵便局 (ゆうびんきょく) | neighborhood-services-2 | neighborhood-services-3 | neighborhood-services-4 | restaurant-problems-1 |
| M7 | 便 | 便利 (べんり) | neighborhood-services-2 | neighborhood-services-3 | neighborhood-services-4 | restaurant-problems-1 |
| M7 | 図 | 図書館 (としょかん) | neighborhood-services-2 | neighborhood-services-3 | neighborhood-services-4 | restaurant-problems-1 |
| M7 | 館 | 図書館 (としょかん) | neighborhood-services-2 | neighborhood-services-3 | neighborhood-services-4 | restaurant-problems-1 |
| M8 | 食 | 食べます (たべます) | restaurant-problems-1 | restaurant-problems-2 | restaurant-problems-3 | restaurant-problems-4 |
| M8 | 飲 | 飲みます (のみます) | restaurant-problems-1 | restaurant-problems-2 | restaurant-problems-3 | restaurant-problems-4 |
| M8 | 飯 | ご飯 (ごはん) | restaurant-problems-1 | restaurant-problems-2 | restaurant-problems-3 | restaurant-problems-4 |
| M8 | 茶 | お茶 (おちゃ) | restaurant-problems-1 | restaurant-problems-2 | restaurant-problems-3 | restaurant-problems-4 |
| M8 | 肉 | 肉 (にく) | restaurant-problems-2 | restaurant-problems-3 | restaurant-problems-4 | shopping-returns-1 |
| M8 | 魚 | 魚 (さかな) | restaurant-problems-2 | restaurant-problems-3 | restaurant-problems-4 | shopping-returns-1 |
| M8 | 熱 | 熱い (あつい) | restaurant-problems-2 | restaurant-problems-3 | restaurant-problems-4 | shopping-returns-1 |
| M8 | 冷 | 冷たい (つめたい) | restaurant-problems-2 | restaurant-problems-3 | restaurant-problems-4 | shopping-returns-1 |
| M9 | 買 | 買います (かいます) | shopping-returns-1 | shopping-returns-2 | shopping-returns-3 | shopping-returns-4 |
| M9 | 店 | 店 (みせ) | shopping-returns-1 | shopping-returns-2 | shopping-returns-3 | shopping-returns-4 |
| M9 | 円 | 千円 (せんえん) | shopping-returns-1 | shopping-returns-2 | shopping-returns-3 | shopping-returns-4 |
| M9 | 番 | 一番 (いちばん) | shopping-returns-1 | shopping-returns-2 | shopping-returns-3 | shopping-returns-4 |
| M9 | 千 | 千円 (せんえん) | shopping-returns-2 | shopping-returns-3 | shopping-returns-4 | health-advice-1 |
| M9 | 万 | 一万 (いちまん) | shopping-returns-2 | shopping-returns-3 | shopping-returns-4 | health-advice-1 |
| M9 | 安 | 安い (やすい) | shopping-returns-2 | shopping-returns-3 | shopping-returns-4 | health-advice-1 |
| M9 | 高 | 高い (たかい) | shopping-returns-2 | shopping-returns-3 | shopping-returns-4 | health-advice-1 |
| M10 | 医 | 医者 (いしゃ) | health-advice-1 | health-advice-2 | health-advice-3 | health-advice-4 |
| M10 | 者 | 医者 (いしゃ) | health-advice-1 | health-advice-2 | health-advice-3 | health-advice-4 |
| M10 | 薬 | 薬 (くすり) | health-advice-1 | health-advice-2 | health-advice-3 | health-advice-4 |
| M10 | 体 | 体 (からだ) | health-advice-1 | health-advice-2 | health-advice-3 | health-advice-4 |
| M10 | 頭 | 頭 (あたま) | health-advice-2 | health-advice-3 | health-advice-4 | work-study-messages-1 |
| M10 | 痛 | 痛い (いたい) | health-advice-2 | health-advice-3 | health-advice-4 | work-study-messages-1 |
| M10 | 元 | 元気 (げんき) | health-advice-2 | health-advice-3 | health-advice-4 | work-study-messages-1 |
| M10 | 休 | 休みます (やすみます) | health-advice-2 | health-advice-3 | health-advice-4 | work-study-messages-1 |
| M11 | 社 | 会社 (かいしゃ) | work-study-messages-1 | work-study-messages-2 | work-study-messages-3 | work-study-messages-4 |
| M11 | 仕 | 仕事 (しごと) | work-study-messages-1 | work-study-messages-2 | work-study-messages-3 | work-study-messages-4 |
| M11 | 事 | 仕事 (しごと) | work-study-messages-1 | work-study-messages-2 | work-study-messages-3 | work-study-messages-4 |
| M11 | 教 | 教えます (おしえます) | work-study-messages-1 | work-study-messages-2 | work-study-messages-3 | work-study-messages-4 |
| M11 | 学 | 学校 (がっこう) | work-study-messages-2 | work-study-messages-3 | work-study-messages-4 | travel-reservations-1 |
| M11 | 校 | 学校 (がっこう) | work-study-messages-2 | work-study-messages-3 | work-study-messages-4 | travel-reservations-1 |
| M11 | 先 | 先生 (せんせい) | work-study-messages-2 | work-study-messages-3 | work-study-messages-4 | travel-reservations-1 |
| M11 | 生 | 学生 (がくせい) | work-study-messages-2 | work-study-messages-3 | work-study-messages-4 | travel-reservations-1 |
| M12 | 空 | 空港 (くうこう) | travel-reservations-1 | travel-reservations-2 | travel-reservations-3 | travel-reservations-4 |
| M12 | 港 | 空港 (くうこう) | travel-reservations-1 | travel-reservations-2 | travel-reservations-3 | travel-reservations-4 |
| M12 | 駅 | 駅 (えき) | travel-reservations-1 | travel-reservations-2 | travel-reservations-3 | travel-reservations-4 |
| M12 | 電 | 電車 (でんしゃ) | travel-reservations-1 | travel-reservations-2 | travel-reservations-3 | travel-reservations-4 |
| M12 | 山 | 山 (やま) | travel-reservations-1 | travel-reservations-2 | travel-reservations-3 | travel-reservations-4 |
| M12 | 車 | 電車 (でんしゃ) | travel-reservations-2 | travel-reservations-3 | travel-reservations-4 | relationships-events-1 |
| M12 | 着 | 着きます (つきます) | travel-reservations-2 | travel-reservations-3 | travel-reservations-4 | relationships-events-1 |
| M12 | 発 | 出発 (しゅっぱつ) | travel-reservations-2 | travel-reservations-3 | travel-reservations-4 | relationships-events-1 |
| M12 | 泊 | 泊まります (とまります) | travel-reservations-2 | travel-reservations-3 | travel-reservations-4 | relationships-events-1 |
| M13 | 母 | 母 (はは) | relationships-events-1 | relationships-events-2 | relationships-events-3 | relationships-events-4 |
| M13 | 父 | 父 (ちち) | relationships-events-1 | relationships-events-2 | relationships-events-3 | relationships-events-4 |
| M13 | 家 | 家族 (かぞく) | relationships-events-1 | relationships-events-2 | relationships-events-3 | relationships-events-4 |
| M13 | 族 | 家族 (かぞく) | relationships-events-1 | relationships-events-2 | relationships-events-3 | relationships-events-4 |
| M13 | 結 | 結婚 (けっこん) | relationships-events-2 | relationships-events-3 | relationships-events-4 | practical-texts-1 |
| M13 | 婚 | 結婚 (けっこん) | relationships-events-2 | relationships-events-3 | relationships-events-4 | practical-texts-1 |
| M13 | 誕 | 誕生日 (たんじょうび) | relationships-events-2 | relationships-events-3 | relationships-events-4 | practical-texts-1 |
| M13 | 送 | 送ります (おくります) | relationships-events-2 | relationships-events-3 | relationships-events-4 | practical-texts-1 |
| M14 | 時 | 時間 (じかん) | practical-texts-1 | practical-texts-2 | practical-texts-3 | practical-texts-4 |
| M14 | 間 | 時間 (じかん) | practical-texts-1 | practical-texts-2 | practical-texts-3 | practical-texts-4 |
| M14 | 分 | 五分 (ごふん) | practical-texts-1 | practical-texts-2 | practical-texts-3 | practical-texts-4 |
| M14 | 半 | 半 (はん) | practical-texts-1 | practical-texts-2 | practical-texts-3 | practical-texts-4 |
| M14 | 本 | 本 (ほん) | practical-texts-1 | practical-texts-2 | practical-texts-3 | practical-texts-4 |
| M14 | 料 | 料金 (りょうきん) | practical-texts-2 | practical-texts-3 | practical-texts-4 | a2-synthesis-4 |
| M14 | 金 | 料金 (りょうきん) | practical-texts-2 | practical-texts-3 | practical-texts-4 | a2-synthesis-4 |
| M14 | 開 | 開きます (あきます) | practical-texts-2 | practical-texts-3 | practical-texts-4 | a2-synthesis-4 |
| M14 | 閉 | 閉まります (しまります) | practical-texts-2 | practical-texts-3 | practical-texts-4 | a2-synthesis-4 |

**Per-module distribution (sums to 120):**

| Module | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | M11 | M12 | M13 | M14 | M15 | **Total** |
|--------|----|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----------|
| Glyphs | 8 | 12 | 9 | 8 | 9 | 8 | 8 | 8 | 8 | 8 | 8 | 9 | 8 | 9 | 0 | **120** |

> **M15 note (synthesis introduces zero new glyphs):** the synthesis module introduces **no new** families/senses/values **and no new kanji glyphs**. Its lessons re-expose and consolidate glyphs already first-supported in M1–M14; the only glyphs whose formal **assessed** stage lands inside M15 are the four M14 straddling glyphs 料/金/開/閉 (assessed at `a2-synthesis-4`, the checkpoint), which is *assessment of earlier glyphs*, not first exposure. No glyph has its **first-supported** stage at any `a2-synthesis-*` lesson (enforced by the `kanji-synthesis-first-exposure` validator code, Task 3 Step 10). The checkpoint reading section therefore samples already-supported glyphs; it never introduces a glyph.

---
## Task 1: A2 contracts, frozen manifest, level, copy architecture, release identity

Establishes the immutable spine every later task references: the 60-lesson manifest (mirroring `a1/manifest.ts`), the A2 lesson-recipe/error-code types (mirroring `a1/types.ts`), the A2 `CourseLevel`, release identity constants, and the copy-key skeleton. No content yet.

**Files:**
- Create: `src/course/a2/manifest.ts`
- Create: `src/course/a2/types.ts`
- Create: `src/course/a2/releaseIdentity.ts`
- Create: `src/course/a2/catalog/level.ts`
- Test: `src/course/a2/manifest.test.ts`
- Test: `src/course/a2/releaseIdentity.test.ts`
- Reference (read, do not edit): `src/course/a1/manifest.ts`, `src/course/a1/types.ts` (lines 65–311), `src/course/a1/releaseIdentity.ts`, `src/course/foundations/types.ts` (`CourseLevel` at 110–117, `CheckpointDefinition` at 102–107), `src/course/a1/catalog/checkpoint.ts` (see `a1Level` at 83–88 and `A1_LEVEL_ID`).

- [ ] **Step 1: Fresh spec re-read.** Re-read spec §5 (two-level architecture), §7 (A2 modules/lessons), §7.1 (grammar spiral), §22 Phase 3 scope/exit (lines ~1299–1318). Confirm against L1/L2 above: 15 modules, 60 lessons, `a2-synthesis` is synthesis, no phonetic module. Write nothing yet.

- [ ] **Step 2: Write the failing manifest test.**

```ts
// src/course/a2/manifest.test.ts
import { describe, it, expect } from "vitest";
import {
  A2_MANIFEST_SPEC,
  A2_MODULE_IDS,
  A2_LESSON_IDS,
  A2_LESSON_IDS_BY_MODULE,
  A2_SYNTHESIS_LESSON_IDS,
  A2_CANONICAL_POSITIONS,
  validateA2ManifestSpec,
} from "./manifest";

describe("A2 manifest", () => {
  it("declares exactly 15 modules in prerequisite order", () => {
    expect(A2_MODULE_IDS).toEqual([
      "connected-conversation", "plans-invitations", "experiences-narratives",
      "reasons-opinions", "sequencing-ongoing", "permission-requests",
      "neighborhood-services", "restaurant-problems", "shopping-returns",
      "health-advice", "work-study-messages", "travel-reservations",
      "relationships-events", "practical-texts", "a2-synthesis",
    ]);
  });

  it("declares exactly 60 stable lesson IDs (module-1..4)", () => {
    expect(A2_LESSON_IDS).toHaveLength(60);
    expect(A2_LESSON_IDS_BY_MODULE["permission-requests"]).toEqual([
      "permission-requests-1", "permission-requests-2",
      "permission-requests-3", "permission-requests-4",
    ]);
    expect(A2_SYNTHESIS_LESSON_IDS).toEqual([
      "a2-synthesis-1", "a2-synthesis-2", "a2-synthesis-3", "a2-synthesis-4",
    ]);
  });

  it("assigns canonical positions 1..60", () => {
    expect(A2_CANONICAL_POSITIONS["connected-conversation-1"]).toBe(1);
    expect(A2_CANONICAL_POSITIONS["a2-synthesis-4"]).toBe(60);
  });

  it("marks a2-synthesis as the synthesis module and others instructional", () => {
    expect(A2_MANIFEST_SPEC.moduleContracts["a2-synthesis"]).toBe("synthesis");
    expect(A2_MANIFEST_SPEC.moduleContracts["restaurant-problems"]).toBe("instructional");
  });

  it("has no phonetic module (A2 teaches no new script)", () => {
    expect(Object.values(A2_MANIFEST_SPEC.moduleContracts)).not.toContain("phonetic");
  });

  it("validates the canonical spec with zero structural errors", () => {
    expect(validateA2ManifestSpec(A2_MANIFEST_SPEC).errors).toEqual([]);
  });
});
```

- [ ] **Step 3: Run it, see it fail.**

Run: `npx vitest run src/course/a2/manifest.test.ts`
Expected: FAIL — `Cannot find module './manifest'`.

- [ ] **Step 4: Write `src/course/a2/types.ts`.** Mirror `a1/types.ts` but drop phonetic contracts and add A2-specific error codes. Full file:

```ts
import type { LessonId, ModuleId } from "../foundations/types";

/** A2 lesson pedagogical contract. No "phonetic" — A2 teaches no new script. */
export type A2LessonContract = "instructional" | "synthesis";

export interface A2ManifestSpec {
  readonly moduleIds: readonly ModuleId[];
  readonly lessonIdsByModule: Readonly<Record<ModuleId, readonly LessonId[]>>;
  readonly modulePrerequisites: Readonly<Record<ModuleId, readonly ModuleId[]>>;
  readonly moduleContracts: Readonly<Record<ModuleId, A2LessonContract>>;
  readonly synthesisModuleId: ModuleId;
  readonly aliases: Readonly<Record<LessonId, LessonId>>;
}

export interface A2ModuleManifestEntry {
  readonly moduleId: ModuleId;
  readonly order: number;
  readonly lessonIds: readonly LessonId[];
  readonly contract: A2LessonContract;
  readonly prerequisites: readonly ModuleId[];
  readonly outcomeCopyId: string;
}

export interface A2LessonManifestEntry {
  readonly lessonId: LessonId;
  readonly moduleId: ModuleId;
  readonly position: number;
  readonly outcomeCopyId: string;
}

export interface A2ManifestValidationError {
  readonly code: A2ManifestErrorCode;
  readonly id?: string;
}

export type A2ManifestErrorCode =
  | "module-count"
  | "lessons-per-module"
  | "duplicate-lesson-id"
  | "unknown-synthesis-module"
  | "prerequisite-cycle"
  | "alias-target-missing";

export interface A2ManifestValidationResult {
  readonly valid: boolean;
  readonly errors: readonly A2ManifestValidationError[];
}

/**
 * Release-gate error codes (Task 7 `validateA2Release`). Mirrors the A1 tuple
 * plus A2-only grammar-spiral and kanji codes. Kept as a readonly tuple so the
 * union type derives from the runtime list the reporter iterates.
 */
export const A2_RELEASE_ERROR_CODES = [
  "module-count",
  "lessons-per-module",
  "route-count",
  "unknown-lesson-id",
  "manifest-mismatch",
  "synthesis-structure",
  "synthesis-introduces-new",
  "unknown-content",
  "recurrence-incomplete",
  "foundation-invalid",
  "cando-not-sampled",
  "cando-untransferred",
  "checkpoint-min-transfer",
  "checkpoint-module-coverage",
  "checkpoint-claims-certification",
  "copy-parity",
  "copy-contains-japanese",
  "personal-alias-match",
  // grammar spiral (§7.1)
  "grammar-form-missing-cando",
  "grammar-form-missing-intro",
  "grammar-form-missing-practice",
  "grammar-form-missing-transfer",
  "grammar-form-missing-recurrence",
  "grammar-role-before-intro",
  // kanji (§14)
  "kanji-count",
  "kanji-unknown-reading",
  "kanji-exposure-order",
  "kanji-synthesis-first-exposure",
  "kanji-furigana-premature-hide",
  "kanji-assessed-without-support",
  "kanji-romaji-bypass",
  "kanji-standalone-dump",
  "kanji-distribution-sum",
] as const;

export type A2ReleaseErrorCode = (typeof A2_RELEASE_ERROR_CODES)[number];
```

- [ ] **Step 5: Write `src/course/a2/manifest.ts`.** Mirror `a1/manifest.ts` exactly, substituting the 15-module order and `synthesisModuleId`. Full file:

```ts
import { deepFreeze } from "../foundations/deepFreeze";
import type {
  A2LessonContract,
  A2ManifestSpec,
  A2ManifestValidationError,
  A2ManifestValidationResult,
} from "./types";
import type { LessonId, ModuleId } from "../foundations/types";

export type { A2ManifestSpec } from "./types";

const MODULE_ORDER: readonly ModuleId[] = [
  "connected-conversation",
  "plans-invitations",
  "experiences-narratives",
  "reasons-opinions",
  "sequencing-ongoing",
  "permission-requests",
  "neighborhood-services",
  "restaurant-problems",
  "shopping-returns",
  "health-advice",
  "work-study-messages",
  "travel-reservations",
  "relationships-events",
  "practical-texts",
  "a2-synthesis",
];

const SYNTHESIS_MODULE_ID: ModuleId = "a2-synthesis";

function fourLessons(moduleId: ModuleId): LessonId[] {
  return [1, 2, 3, 4].map((n) => `${moduleId}-${n}`);
}

function buildCanonicalSpec(): A2ManifestSpec {
  const lessonIdsByModule: Record<ModuleId, LessonId[]> = {};
  const modulePrerequisites: Record<ModuleId, ModuleId[]> = {};
  const moduleContracts: Record<ModuleId, A2LessonContract> = {};

  MODULE_ORDER.forEach((moduleId, index) => {
    lessonIdsByModule[moduleId] = fourLessons(moduleId);
    modulePrerequisites[moduleId] =
      index === 0 ? [] : [MODULE_ORDER[index - 1]];
    moduleContracts[moduleId] =
      moduleId === SYNTHESIS_MODULE_ID ? "synthesis" : "instructional";
  });

  return {
    moduleIds: [...MODULE_ORDER],
    lessonIdsByModule,
    modulePrerequisites,
    moduleContracts,
    synthesisModuleId: SYNTHESIS_MODULE_ID,
    aliases: {},
  };
}

export const A2_MANIFEST_SPEC: A2ManifestSpec = deepFreeze(buildCanonicalSpec());

export const A2_MODULE_IDS: readonly ModuleId[] = deepFreeze([
  ...A2_MANIFEST_SPEC.moduleIds,
]);

export const A2_LESSON_IDS_BY_MODULE: Readonly<
  Record<ModuleId, readonly LessonId[]>
> = deepFreeze(
  Object.fromEntries(
    A2_MODULE_IDS.map((moduleId) => [
      moduleId,
      [...A2_MANIFEST_SPEC.lessonIdsByModule[moduleId]],
    ]),
  ),
);

export const A2_LESSON_IDS: readonly LessonId[] = deepFreeze(
  A2_MODULE_IDS.flatMap((moduleId) => [...A2_LESSON_IDS_BY_MODULE[moduleId]]),
);

export const A2_SYNTHESIS_LESSON_IDS: readonly LessonId[] = deepFreeze([
  ...A2_LESSON_IDS_BY_MODULE[A2_MANIFEST_SPEC.synthesisModuleId],
]);

export const A2_CANONICAL_POSITIONS: Readonly<Record<LessonId, number>> =
  deepFreeze(
    Object.fromEntries(A2_LESSON_IDS.map((id, index) => [id, index + 1])),
  );

export const A2_LEGACY_LESSON_ALIASES: Readonly<Record<LessonId, LessonId>> =
  deepFreeze({ ...A2_MANIFEST_SPEC.aliases });

export function validateA2ManifestSpec(
  spec: A2ManifestSpec,
): A2ManifestValidationResult {
  const errors: A2ManifestValidationError[] = [];
  if (spec.moduleIds.length !== 15) errors.push({ code: "module-count" });
  const seen = new Set<LessonId>();
  for (const moduleId of spec.moduleIds) {
    const lessons = spec.lessonIdsByModule[moduleId] ?? [];
    if (lessons.length !== 4) {
      errors.push({ code: "lessons-per-module", id: moduleId });
    }
    for (const lessonId of lessons) {
      if (seen.has(lessonId)) errors.push({ code: "duplicate-lesson-id", id: lessonId });
      seen.add(lessonId);
    }
  }
  if (!spec.moduleIds.includes(spec.synthesisModuleId)) {
    errors.push({ code: "unknown-synthesis-module", id: spec.synthesisModuleId });
  }
  for (const [lessonId, target] of Object.entries(spec.aliases)) {
    if (!seen.has(target)) errors.push({ code: "alias-target-missing", id: lessonId });
  }
  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 6: Run the manifest test, see it pass.**

Run: `npx vitest run src/course/a2/manifest.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Write the failing release-identity test.**

```ts
// src/course/a2/releaseIdentity.test.ts
import { describe, it, expect } from "vitest";
import {
  A2_RELEASE_CATALOG_VERSION,
  A2_RELEASE_SEED,
} from "./releaseIdentity";

describe("A2 release identity", () => {
  it("pins a stable catalog version and seed shared by validator and runtime", () => {
    expect(A2_RELEASE_CATALOG_VERSION).toBe("a2-release-v1");
    expect(A2_RELEASE_SEED).toBe("a2-release-seed-v1");
  });
});
```

- [ ] **Step 8: Run it, see it fail** (`Cannot find module './releaseIdentity'`), then write `src/course/a2/releaseIdentity.ts`:

```ts
/**
 * Single source of truth for the A2 release's deterministic identity. Imported
 * by BOTH the release validator (`validateA2Release`) and the runtime
 * view-model builder, so what is validated is byte-identical to what ships.
 * Mirrors `a1/releaseIdentity.ts`.
 */
export const A2_RELEASE_CATALOG_VERSION = "a2-release-v1" as const;
export const A2_RELEASE_SEED = "a2-release-seed-v1" as const;
```

Run: `npx vitest run src/course/a2/releaseIdentity.test.ts` → PASS.

- [ ] **Step 9: Write the failing level test, then `src/course/a2/catalog/level.ts`.** The A2 level uses the **actual** `CourseLevel` shape from `foundations/types.ts` — `{ id, alignmentCopyId, moduleIds, canDoIds, recommendedPrerequisiteCheckpointId? }` (there is no `order`/`titleCopyId`/`alignmentClaim` field; do not invent any). Task 1 has no Can-dos yet, so this file exports the level **identity constants** plus a pure `buildA2Level(canDoIds)` helper; Task 7 calls it with `a2CanDosAuthored.map((c) => c.id)` once Can-dos exist. Failing test first:

```ts
// src/course/a2/catalog/level.test.ts
import { describe, it, expect } from "vitest";
import type { CanDoId } from "../../foundations/types";
import {
  A2_LEVEL_ID, A2_ALIGNMENT_COPY_ID, A2_RECOMMENDED_PREREQUISITE_CHECKPOINT_ID, buildA2Level,
} from "./level";
import { A2_MODULE_IDS } from "../manifest";

describe("buildA2Level", () => {
  const canDoIds: readonly CanDoId[] = ["a2-cando-recognize-plain-forms", "a2-cando-sequence-te"];
  it("produces the exact CourseLevel shape (no invented fields)", () => {
    const level = buildA2Level(canDoIds);
    expect(level).toEqual({
      id: A2_LEVEL_ID,
      alignmentCopyId: A2_ALIGNMENT_COPY_ID,
      moduleIds: [...A2_MODULE_IDS],
      canDoIds: [...canDoIds],
      recommendedPrerequisiteCheckpointId: A2_RECOMMENDED_PREREQUISITE_CHECKPOINT_ID,
    });
    // Exactly the five real keys — nothing else.
    expect(Object.keys(level).sort()).toEqual(
      ["alignmentCopyId", "canDoIds", "id", "moduleIds", "recommendedPrerequisiteCheckpointId"],
    );
  });
  it("recommends but does not require the A1 checkpoint", () => {
    expect(A2_RECOMMENDED_PREREQUISITE_CHECKPOINT_ID).toBe("a1-checkpoint");
  });
});
```

Run: `npx vitest run src/course/a2/catalog/level.test.ts` → FAIL (`Cannot find module './level'`). Then write the implementation:

```ts
// src/course/a2/catalog/level.ts
import { deepFreeze } from "../../foundations/deepFreeze";
import type { CanDoId, CheckpointId, CopyId, CourseLevel, CourseLevelId } from "../../foundations/types";
import { A2_MODULE_IDS } from "../manifest";

export const A2_LEVEL_ID: CourseLevelId = "a2";
/** Copy key for the JF/CEFR *alignment* statement (never a certification claim; §8, §20). */
export const A2_ALIGNMENT_COPY_ID: CopyId = "a2-level-a2-alignment";
/** A2 recommends — but does not require — the A1 checkpoint before starting (§8). */
export const A2_RECOMMENDED_PREREQUISITE_CHECKPOINT_ID: CheckpointId = "a1-checkpoint";

/**
 * Build the A2 `CourseLevel` from the authored Can-do IDs. Pure; the module set
 * is the frozen manifest order. Assembled in Task 7 with `a2CanDosAuthored`.
 */
export function buildA2Level(canDoIds: readonly CanDoId[]): CourseLevel {
  return deepFreeze({
    id: A2_LEVEL_ID,
    alignmentCopyId: A2_ALIGNMENT_COPY_ID,
    moduleIds: [...A2_MODULE_IDS],
    canDoIds: [...canDoIds],
    recommendedPrerequisiteCheckpointId: A2_RECOMMENDED_PREREQUISITE_CHECKPOINT_ID,
  });
}
```

Run: `npx vitest run src/course/a2/catalog/level.test.ts` → PASS.

- [ ] **Step 10: Typecheck.**

Run: `npx tsc --noEmit`
Expected: clean (no errors).

- [ ] **Step 11: Commit.**

```bash
git add src/course/a2/manifest.ts src/course/a2/types.ts \
  src/course/a2/releaseIdentity.ts src/course/a2/catalog/level.ts \
  src/course/a2/catalog/level.test.ts \
  src/course/a2/manifest.test.ts src/course/a2/releaseIdentity.test.ts
git commit -m "feat(a2): frozen 60-lesson manifest, types, release identity, level"
```

- [ ] **Step 12: Subagent quality review.** Dispatch a review subagent: "Review the Task 1 diff against spec §5/§7/§22 and plan table L1. Confirm exactly 15 modules, 60 lesson IDs, no phonetic contract, synthesis module = a2-synthesis, release constants match `a2-release-v1`/`a2-release-seed-v1`, and no Japanese literals appear. Report any mismatch as an inline finding." Fix findings before Task 2.

---
## Task 2: A2 form/aspect layer — realizer extension + grammar-spiral validator

The A1 realizer only conjugates **polite** endings (ます/ません/ました/ませんでした) plus i-adjective and copula endings (`src/course/foundations/realizeFamily.ts` lines 357–435). The A2 spiral (L2) needs **plain** forms, the て-form, 〜ている, and seven clause-combining constructions. Plain/て/past forms are **not** a single suffix appended to a generic stem: Japanese verbs split into conjugation classes (ichidan, nine godan sub-classes by final mora, and the two irregulars する/来る) that each realize the dictionary/negative/past/past-negative/て forms differently (e.g. 書く→書いて but 泳ぐ→泳いで, 待つ→待って, 読む→読んで, and the 行く i-onbin exception 行った/行って). This task builds a **conjugation-class-aware engine** that generates each plain base correctly while preserving the kanji root and its kana/romaji reading, then a composer that attaches each construction onto the *correct* generated base, then the grammar-spiral coverage validator that enforces every form's five roles.

> **Do NOT reuse `src/lab/engine/conjugate.ts`.** It only produces polite masu-stem forms and uses a different long-vowel convention (ō macrons). The A2 engine below is plain-form, class-aware, and macron-free (long vowels are spelled out, e.g. `imasu`, `arimasu`), consistent with the A2 romaji policy.

**Design:** all canonical Japanese for verb inflection lives in two data files — `a2Conjugation.ts` (the per-class okurigana tables, the two irregular tables, and the 12-verb class table) and `a2Constructions.ts` (the per-construction base + tail). `conjugate(senseId, form)` returns a class-correct `ConjugationResult`; `composeA2Construction({constructionId, senseId})` conjugates the required base and appends the construction tail. Predicate identity (which verb a lesson targets) still comes from the semantic-value catalog (Phase 1 contract): a sense ID selects the verb entry. No fork of the shared realizer; the A2 engine is additive.

**Files:**
- Create: `src/course/a2/forms/a2Conjugation.ts` (fragment model, class tables, 12-verb table, `conjugate`)
- Create: `src/course/a2/forms/a2Constructions.ts` (15 spiral constructions → kind/canDo/base/tail)
- Create: `src/course/a2/forms/composeA2Construction.ts` (pure composer onto the correct base)
- Create: `src/course/a2/forms/grammarSpiral.ts`
- Create: `src/course/a2/forms/validateA2GrammarSpiral.ts`
- Test: `src/course/a2/forms/a2Conjugation.test.ts`
- Test: `src/course/a2/forms/composeA2Construction.test.ts`
- Test: `src/course/a2/forms/validateA2GrammarSpiral.test.ts`
- Reference (read): `src/romaji/types.ts` (`RomajiTokenKind`, `RomajiBoundaryBefore`), `src/course/foundations/realizeFamily.ts` (polite endings 357–435, boundary logic 563–600 — background only), `src/course/foundations/types.ts` (`RealizedSentence` 477–503).

- [ ] **Step 1: Fresh spec re-read.** Re-read §7.1 (grammar spiral), §9.2–§9.4 (realization), §10 (families), §13 (romaji tokens). Confirm every L2 verbal form is generated by a **conjugation class** (ichidan / godan-u,ku,gu,su,tsu,nu,bu,mu,ru / irregular する・来る, plus the 行く exception) and that each construction attaches to a specific plain base (dictionary/negative/past/te). Write nothing yet.

- [ ] **Step 2: Write the failing conjugation-engine test.** The engine must produce the five plain forms for all 12 required verbs, preserving each kanji root and its kana/romaji reading, with class-correct okurigana and the 行く/する/来る irregularities. Romaji is fully concatenated (no spaces) and macron-free.

```ts
// src/course/a2/forms/a2Conjugation.test.ts
import { describe, it, expect } from "vitest";
import { conjugate, A2_VERBS, type A2PlainForm } from "./a2Conjugation";

type Row = Readonly<Record<A2PlainForm, readonly [jp: string, reading: string, romaji: string]>>;

// Full expected paradigm for every required verb (dictionary/negative/past/past-negative/te).
const EXPECTED: Readonly<Record<string, Row>> = {
  "a2-sense-taberu": { // 食べる — ichidan
    dictionary: ["食べる", "たべる", "taberu"], negative: ["食べない", "たべない", "tabenai"],
    past: ["食べた", "たべた", "tabeta"], "past-negative": ["食べなかった", "たべなかった", "tabenakatta"],
    te: ["食べて", "たべて", "tabete"],
  },
  "a2-sense-hanasu": { // 話す — godan-su
    dictionary: ["話す", "はなす", "hanasu"], negative: ["話さない", "はなさない", "hanasanai"],
    past: ["話した", "はなした", "hanashita"], "past-negative": ["話さなかった", "はなさなかった", "hanasanakatta"],
    te: ["話して", "はなして", "hanashite"],
  },
  "a2-sense-kaku": { // 書く — godan-ku (i-onbin te/past いた/いて)
    dictionary: ["書く", "かく", "kaku"], negative: ["書かない", "かかない", "kakanai"],
    past: ["書いた", "かいた", "kaita"], "past-negative": ["書かなかった", "かかなかった", "kakanakatta"],
    te: ["書いて", "かいて", "kaite"],
  },
  "a2-sense-oyogu": { // 泳ぐ — godan-gu (voiced onbin いだ/いで)
    dictionary: ["泳ぐ", "およぐ", "oyogu"], negative: ["泳がない", "およがない", "oyoganai"],
    past: ["泳いだ", "およいだ", "oyoida"], "past-negative": ["泳がなかった", "およがなかった", "oyoganakatta"],
    te: ["泳いで", "およいで", "oyoide"],
  },
  "a2-sense-matsu": { // 待つ — godan-tsu (促音便 った/って)
    dictionary: ["待つ", "まつ", "matsu"], negative: ["待たない", "またない", "matanai"],
    past: ["待った", "まった", "matta"], "past-negative": ["待たなかった", "またなかった", "matanakatta"],
    te: ["待って", "まって", "matte"],
  },
  "a2-sense-shinu": { // 死ぬ — godan-nu (撥音便 んだ/んで)
    dictionary: ["死ぬ", "しぬ", "shinu"], negative: ["死なない", "しなない", "shinanai"],
    past: ["死んだ", "しんだ", "shinda"], "past-negative": ["死ななかった", "しななかった", "shinanakatta"],
    te: ["死んで", "しんで", "shinde"],
  },
  "a2-sense-asobu": { // 遊ぶ — godan-bu (撥音便 んだ/んで)
    dictionary: ["遊ぶ", "あそぶ", "asobu"], negative: ["遊ばない", "あそばない", "asobanai"],
    past: ["遊んだ", "あそんだ", "asonda"], "past-negative": ["遊ばなかった", "あそばなかった", "asobanakatta"],
    te: ["遊んで", "あそんで", "asonde"],
  },
  "a2-sense-yomu": { // 読む — godan-mu (撥音便 んだ/んで)
    dictionary: ["読む", "よむ", "yomu"], negative: ["読まない", "よまない", "yomanai"],
    past: ["読んだ", "よんだ", "yonda"], "past-negative": ["読まなかった", "よまなかった", "yomanakatta"],
    te: ["読んで", "よんで", "yonde"],
  },
  "a2-sense-kaeru": { // 帰る — godan-ru (促音便 った/って; NOT ichidan despite -eru)
    dictionary: ["帰る", "かえる", "kaeru"], negative: ["帰らない", "かえらない", "kaeranai"],
    past: ["帰った", "かえった", "kaetta"], "past-negative": ["帰らなかった", "かえらなかった", "kaeranakatta"],
    te: ["帰って", "かえって", "kaette"],
  },
  "a2-sense-iku": { // 行く — godan-ku with 行った/行って exception (NOT 行いた/行いて)
    dictionary: ["行く", "いく", "iku"], negative: ["行かない", "いかない", "ikanai"],
    past: ["行った", "いった", "itta"], "past-negative": ["行かなかった", "いかなかった", "ikanakatta"],
    te: ["行って", "いって", "itte"],
  },
  "a2-sense-suru": { // する — irregular
    dictionary: ["する", "する", "suru"], negative: ["しない", "しない", "shinai"],
    past: ["した", "した", "shita"], "past-negative": ["しなかった", "しなかった", "shinakatta"],
    te: ["して", "して", "shite"],
  },
  "a2-sense-kuru": { // 来る — irregular (root reading shifts く/こ/き)
    dictionary: ["来る", "くる", "kuru"], negative: ["来ない", "こない", "konai"],
    past: ["来た", "きた", "kita"], "past-negative": ["来なかった", "こなかった", "konakatta"],
    te: ["来て", "きて", "kite"],
  },
};

const FORMS: readonly A2PlainForm[] = ["dictionary", "negative", "past", "past-negative", "te"];

describe("a2 conjugation engine", () => {
  it("registers exactly the 12 required verbs", () => {
    expect(Object.keys(A2_VERBS).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  for (const senseId of Object.keys(EXPECTED)) {
    for (const form of FORMS) {
      const [jp, reading, romaji] = EXPECTED[senseId][form];
      it(`${senseId} ${form} → ${jp} / ${reading} / ${romaji}`, () => {
        const r = conjugate(senseId, form);
        expect(r.ok).toBe(true);
        if (r.ok) {
          expect(r.result.jp).toBe(jp);
          expect(r.result.reading).toBe(reading);
          expect(r.result.romaji).toBe(romaji);
        }
      });
    }
  }

  it("keeps the kanji glyph as the visible root while the reading carries kana", () => {
    const r = conjugate("a2-sense-kuru", "past"); // 来た, reading きた
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.fragments[0].jp).toBe("来");
      expect(r.result.fragments[0].reading).toBe("き");
      expect(r.result.fragments[0].kind).toBe("lexical");
    }
  });

  it("rejects an unknown verb and an unknown sense id", () => {
    expect(conjugate("a2-sense-nope", "te")).toEqual({ ok: false, error: "unknown-verb" });
  });
});
```

- [ ] **Step 3: Run it, see it fail** (`Cannot find module './a2Conjugation'`).

- [ ] **Step 4: Write `src/course/a2/forms/a2Conjugation.ts`.** The class-aware engine. All verbal Japanese lives here.

```ts
import type { RomajiTokenKind, RomajiBoundaryBefore } from "../../../romaji/types";

/**
 * A romaji-checkable fragment of a conjugated word. Mirrors the shared
 * AssembledToken shape (jp/romaji/kind/boundaryBefore) so downstream romaji
 * formatting is identical. A kanji fragment carries its kana `reading`; a kana
 * morpheme omits `reading` (it reads as its own kana).
 */
export interface A2Fragment {
  readonly jp: string;
  readonly romaji: string;
  readonly kind: RomajiTokenKind;
  readonly boundaryBefore: RomajiBoundaryBefore;
  readonly reading?: string;
}

export type A2ConjugationClass =
  | "ichidan"
  | "godan-u" | "godan-ku" | "godan-gu" | "godan-su" | "godan-tsu"
  | "godan-nu" | "godan-bu" | "godan-mu" | "godan-ru"
  | "irregular-suru" | "irregular-kuru";

export type A2PlainForm = "dictionary" | "negative" | "past" | "past-negative" | "te";

export interface A2Verb {
  readonly senseId: string;
  readonly conjClass: A2ConjugationClass;
  /**
   * The invariant root fragments: the kanji stem (lexical, carrying its reading)
   * plus any leading okurigana that never changes (e.g. べ in 食べる). Empty for
   * する and 来る, whose full words live in the irregular tables below.
   */
  readonly stem: readonly A2Fragment[];
  /** 行く only: past/te use った/って (i-onbin exception), not the regular いた/いて. */
  readonly tePastException?: "iku";
}

type Okurigana = { readonly jp: string; readonly romaji: string };
type ClassTable = Readonly<Record<A2PlainForm, Okurigana>>;

/** Regular okurigana per class (appended to the verb stem). */
const OKURIGANA: Readonly<Record<Exclude<A2ConjugationClass, "irregular-suru" | "irregular-kuru">, ClassTable>> = {
  "ichidan":   { dictionary: { jp: "る",   romaji: "ru" },   negative: { jp: "ない",   romaji: "nai" },   past: { jp: "た",   romaji: "ta" },   "past-negative": { jp: "なかった",   romaji: "nakatta" },   te: { jp: "て",   romaji: "te" } },
  "godan-u":   { dictionary: { jp: "う",   romaji: "u" },    negative: { jp: "わない", romaji: "wanai" }, past: { jp: "った", romaji: "tta" }, "past-negative": { jp: "わなかった", romaji: "wanakatta" }, te: { jp: "って", romaji: "tte" } },
  "godan-ku":  { dictionary: { jp: "く",   romaji: "ku" },   negative: { jp: "かない", romaji: "kanai" }, past: { jp: "いた", romaji: "ita" }, "past-negative": { jp: "かなかった", romaji: "kanakatta" }, te: { jp: "いて", romaji: "ite" } },
  "godan-gu":  { dictionary: { jp: "ぐ",   romaji: "gu" },   negative: { jp: "がない", romaji: "ganai" }, past: { jp: "いだ", romaji: "ida" }, "past-negative": { jp: "がなかった", romaji: "ganakatta" }, te: { jp: "いで", romaji: "ide" } },
  "godan-su":  { dictionary: { jp: "す",   romaji: "su" },   negative: { jp: "さない", romaji: "sanai" }, past: { jp: "した", romaji: "shita" }, "past-negative": { jp: "さなかった", romaji: "sanakatta" }, te: { jp: "して", romaji: "shite" } },
  "godan-tsu": { dictionary: { jp: "つ",   romaji: "tsu" },  negative: { jp: "たない", romaji: "tanai" }, past: { jp: "った", romaji: "tta" }, "past-negative": { jp: "たなかった", romaji: "tanakatta" }, te: { jp: "って", romaji: "tte" } },
  "godan-nu":  { dictionary: { jp: "ぬ",   romaji: "nu" },   negative: { jp: "なない", romaji: "nanai" }, past: { jp: "んだ", romaji: "nda" }, "past-negative": { jp: "ななかった", romaji: "nanakatta" }, te: { jp: "んで", romaji: "nde" } },
  "godan-bu":  { dictionary: { jp: "ぶ",   romaji: "bu" },   negative: { jp: "ばない", romaji: "banai" }, past: { jp: "んだ", romaji: "nda" }, "past-negative": { jp: "ばなかった", romaji: "banakatta" }, te: { jp: "んで", romaji: "nde" } },
  "godan-mu":  { dictionary: { jp: "む",   romaji: "mu" },   negative: { jp: "まない", romaji: "manai" }, past: { jp: "んだ", romaji: "nda" }, "past-negative": { jp: "まなかった", romaji: "manakatta" }, te: { jp: "んで", romaji: "nde" } },
  "godan-ru":  { dictionary: { jp: "る",   romaji: "ru" },   negative: { jp: "らない", romaji: "ranai" }, past: { jp: "った", romaji: "tta" }, "past-negative": { jp: "らなかった", romaji: "ranakatta" }, te: { jp: "って", romaji: "tte" } },
};

/** 行く i-onbin exception: past/te only. */
const IKU_EXCEPTION: Readonly<Pick<Record<A2PlainForm, Okurigana>, "past" | "te">> = {
  past: { jp: "った", romaji: "tta" },
  te: { jp: "って", romaji: "tte" },
};

const M = (jp: string, romaji: string): A2Fragment => ({ jp, romaji, kind: "morpheme", boundaryBefore: "attach" });
const L = (jp: string, reading: string, romaji: string): A2Fragment => ({ jp, romaji, reading, kind: "lexical", boundaryBefore: "attach" });

/** する — full-word forms (no kanji root). */
const SURU_FORMS: Readonly<Record<A2PlainForm, readonly A2Fragment[]>> = {
  dictionary: [M("する", "suru")], negative: [M("しない", "shinai")],
  past: [M("した", "shita")], "past-negative": [M("しなかった", "shinakatta")], te: [M("して", "shite")],
};

/** 来る — kanji root 来 whose reading shifts (く/こ/き) plus ichidan-style okurigana. */
const KURU_FORMS: Readonly<Record<A2PlainForm, readonly A2Fragment[]>> = {
  dictionary: [L("来", "く", "ku"), M("る", "ru")],
  negative: [L("来", "こ", "ko"), M("ない", "nai")],
  past: [L("来", "き", "ki"), M("た", "ta")],
  "past-negative": [L("来", "こ", "ko"), M("なかった", "nakatta")],
  te: [L("来", "き", "ki"), M("て", "te")],
};

export const A2_VERBS: Readonly<Record<string, A2Verb>> = {
  "a2-sense-taberu": { senseId: "a2-sense-taberu", conjClass: "ichidan",   stem: [L("食", "た", "ta"), M("べ", "be")] },
  "a2-sense-hanasu": { senseId: "a2-sense-hanasu", conjClass: "godan-su",  stem: [L("話", "はな", "hana")] },
  "a2-sense-kaku":   { senseId: "a2-sense-kaku",   conjClass: "godan-ku",  stem: [L("書", "か", "ka")] },
  "a2-sense-oyogu":  { senseId: "a2-sense-oyogu",  conjClass: "godan-gu",  stem: [L("泳", "およ", "oyo")] },
  "a2-sense-matsu":  { senseId: "a2-sense-matsu",  conjClass: "godan-tsu", stem: [L("待", "ま", "ma")] },
  "a2-sense-shinu":  { senseId: "a2-sense-shinu",  conjClass: "godan-nu",  stem: [L("死", "し", "shi")] },
  "a2-sense-asobu":  { senseId: "a2-sense-asobu",  conjClass: "godan-bu",  stem: [L("遊", "あそ", "aso")] },
  "a2-sense-yomu":   { senseId: "a2-sense-yomu",   conjClass: "godan-mu",  stem: [L("読", "よ", "yo")] },
  "a2-sense-kaeru":  { senseId: "a2-sense-kaeru",  conjClass: "godan-ru",  stem: [L("帰", "かえ", "kae")] },
  "a2-sense-iku":    { senseId: "a2-sense-iku",    conjClass: "godan-ku",  stem: [L("行", "い", "i")], tePastException: "iku" },
  "a2-sense-suru":   { senseId: "a2-sense-suru",   conjClass: "irregular-suru", stem: [] },
  "a2-sense-kuru":   { senseId: "a2-sense-kuru",   conjClass: "irregular-kuru", stem: [] },
};

export interface ConjugationResult {
  readonly form: A2PlainForm;
  readonly fragments: readonly A2Fragment[];
  readonly jp: string;      // fragments' jp joined
  readonly romaji: string;  // fragments' romaji joined — no spaces, no macrons
  readonly reading: string; // fragments' (reading ?? jp) joined — full kana reading
}

export type ConjugateResult =
  | { ok: true; result: ConjugationResult }
  | { ok: false; error: "unknown-verb" };

function assemble(form: A2PlainForm, fragments: readonly A2Fragment[]): ConjugationResult {
  return {
    form,
    fragments,
    jp: fragments.map((f) => f.jp).join(""),
    romaji: fragments.map((f) => f.romaji).join(""),
    reading: fragments.map((f) => f.reading ?? f.jp).join(""),
  };
}

export function conjugate(senseId: string, form: A2PlainForm): ConjugateResult {
  const verb = A2_VERBS[senseId];
  if (!verb) return { ok: false, error: "unknown-verb" };
  if (verb.conjClass === "irregular-suru") return { ok: true, result: assemble(form, SURU_FORMS[form]) };
  if (verb.conjClass === "irregular-kuru") return { ok: true, result: assemble(form, KURU_FORMS[form]) };
  let tail = OKURIGANA[verb.conjClass][form];
  if (verb.tePastException === "iku" && (form === "past" || form === "te")) tail = IKU_EXCEPTION[form];
  const fragments: readonly A2Fragment[] = [...verb.stem, M(tail.jp, tail.romaji)];
  return { ok: true, result: assemble(form, fragments) };
}
```

- [ ] **Step 5: Run the conjugation test, see it pass** (`npx vitest run src/course/a2/forms/a2Conjugation.test.ts` → PASS — 62 assertions: 12 verbs × 5 forms + the 2 boundary/rejection cases).

- [ ] **Step 6: Write the failing construction-registry + composer test.** `a2Constructions.ts` maps every L2 form ID → its `kind` (`plain-inflection` | `suffix` | `clause` | `connector`), the named Can-do it serves, and (for `suffix`) the plain **base** it attaches to plus the appended **tail**. `composeA2Construction` conjugates the base and appends the tail.

```ts
// src/course/a2/forms/composeA2Construction.test.ts
import { describe, it, expect } from "vitest";
import { A2_CONSTRUCTIONS } from "./a2Constructions";
import { composeA2Construction } from "./composeA2Construction";

describe("A2 construction registry", () => {
  it("registers all 15 spiral forms with a served Can-do", () => {
    expect(Object.keys(A2_CONSTRUCTIONS)).toHaveLength(15);
    expect(A2_CONSTRUCTIONS["ongoing-teiru"].canDoId).toBe("a2-cando-ongoing-teiru");
    expect(A2_CONSTRUCTIONS["reason-kara"].kind).toBe("clause");
    expect(A2_CONSTRUCTIONS["recognize-plain-forms"].kind).toBe("plain-inflection");
    expect(A2_CONSTRUCTIONS["connectors"].kind).toBe("connector");
  });
  it("declares the correct plain base for each suffix construction", () => {
    expect(A2_CONSTRUCTIONS["ongoing-teiru"].base).toBe("te");
    expect(A2_CONSTRUCTIONS["request-negative"].base).toBe("negative");
    expect(A2_CONSTRUCTIONS["experience-takoto"].base).toBe("past");
  });
});

describe("composeA2Construction — consumes the correct conjugated base", () => {
  it("読む + ongoing-teiru → 読んでいます (te base)", () => {
    const r = composeA2Construction({ constructionId: "ongoing-teiru", senseId: "a2-sense-yomu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("読んでいます");
      expect(r.sentence.reading).toBe("よんでいます");
      expect(r.sentence.romaji).toBe("yondeimasu");
      expect(r.sentence.base).toBe("te");
    }
  });
  it("読む + experience-takoto → 読んだことがあります (past base)", () => {
    const r = composeA2Construction({ constructionId: "experience-takoto", senseId: "a2-sense-yomu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("読んだことがあります");
      expect(r.sentence.romaji).toBe("yondakotogaarimasu");
    }
  });
  it("行く + experience-takoto uses the 行った exception → 行ったことがあります", () => {
    const r = composeA2Construction({ constructionId: "experience-takoto", senseId: "a2-sense-iku" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sentence.jp).toBe("行ったことがあります");
  });
  it("話す + prohibition-tewaikenai → 話してはいけません (te base + はいけません)", () => {
    const r = composeA2Construction({ constructionId: "prohibition-tewaikenai", senseId: "a2-sense-hanasu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sentence.jp).toBe("話してはいけません");
      expect(r.sentence.reading).toBe("はなしてはいけません");
      expect(r.sentence.romaji).toBe("hanashitewaikemasen");
    }
  });
  it("食べる + request-negative → 食べないでください (negative base)", () => {
    const r = composeA2Construction({ constructionId: "request-negative", senseId: "a2-sense-taberu" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sentence.jp).toBe("食べないでください");
  });
  it("rejects a clause construction (not a suffix) and an unknown verb", () => {
    expect(composeA2Construction({ constructionId: "reason-kara", senseId: "a2-sense-yomu" }))
      .toEqual({ ok: false, error: "not-a-suffix-construction" });
    expect(composeA2Construction({ constructionId: "ongoing-teiru", senseId: "a2-sense-nope" }))
      .toEqual({ ok: false, error: "unknown-verb" });
  });
});
```

- [ ] **Step 7: Run it, see it fail**, then write `src/course/a2/forms/a2Constructions.ts`:

```ts
import type { A2Fragment, A2PlainForm } from "./a2Conjugation";

export type A2ConstructionKind =
  | "plain-inflection" // the four plain forms themselves (no extra tail)
  | "suffix"           // conjugate a plain base, then append a fixed tail
  | "clause"           // subordinate-clause family, realized in Task 4 (not a suffix)
  | "connector";       // discourse connector between sentences (not a suffix)

export interface A2Construction {
  readonly id: string;
  readonly kind: A2ConstructionKind;
  readonly canDoId: string;
  /** For `suffix`: which conjugated base to build on. */
  readonly base?: A2PlainForm;
  /** For `suffix`: fragments appended after the base. */
  readonly tail?: readonly A2Fragment[];
}

const P = (jp: string, romaji: string): A2Fragment => ({ jp, romaji, kind: "particle", boundaryBefore: "attach" });
const M = (jp: string, romaji: string): A2Fragment => ({ jp, romaji, kind: "morpheme", boundaryBefore: "attach" });

/** The 15 spiral forms (L2), each bound to its named Can-do. Suffix forms name their base + tail. */
export const A2_CONSTRUCTIONS: Readonly<Record<string, A2Construction>> = {
  "recognize-plain-forms":  { id: "recognize-plain-forms",  kind: "plain-inflection", canDoId: "a2-cando-recognize-plain-forms" },
  "sequence-te":            { id: "sequence-te",            kind: "suffix", canDoId: "a2-cando-sequence-te",            base: "te",       tail: [] },
  "ongoing-teiru":          { id: "ongoing-teiru",          kind: "suffix", canDoId: "a2-cando-ongoing-teiru",          base: "te",       tail: [M("います", "imasu")] },
  "request-tekudasai":      { id: "request-tekudasai",      kind: "suffix", canDoId: "a2-cando-request-tekudasai",      base: "te",       tail: [M("ください", "kudasai")] },
  "permission-temoii":      { id: "permission-temoii",      kind: "suffix", canDoId: "a2-cando-permission-temoii",      base: "te",       tail: [P("も", "mo"), M("いい", "ii"), M("です", "desu")] },
  "prohibition-tewaikenai": { id: "prohibition-tewaikenai", kind: "suffix", canDoId: "a2-cando-prohibition-tewaikenai", base: "te",       tail: [P("は", "wa"), M("いけません", "ikemasen")] },
  "request-negative":       { id: "request-negative",       kind: "suffix", canDoId: "a2-cando-negative-request",       base: "negative", tail: [M("で", "de"), M("ください", "kudasai")] },
  "experience-takoto":      { id: "experience-takoto",      kind: "suffix", canDoId: "a2-cando-experience-takoto",      base: "past",     tail: [M("こと", "koto"), P("が", "ga"), M("あります", "arimasu")] },
  "intentions-plans":       { id: "intentions-plans",       kind: "clause",    canDoId: "a2-cando-intentions-plans" },
  "reason-kara":            { id: "reason-kara",            kind: "clause",    canDoId: "a2-cando-reason-kara" },
  "reason-node":            { id: "reason-node",            kind: "clause",    canDoId: "a2-cando-reason-node" },
  "opinion-toomou":         { id: "opinion-toomou",         kind: "clause",    canDoId: "a2-cando-opinion-toomou" },
  "compare":                { id: "compare",                kind: "clause",    canDoId: "a2-cando-compare" },
  "possibility":            { id: "possibility",            kind: "clause",    canDoId: "a2-cando-possibility" },
  "connectors":             { id: "connectors",             kind: "connector", canDoId: "a2-cando-connectors" },
};
```

> **Why clause/connector forms are not suffixes.** 予定/つもり, から, ので, と思う, comparisons (のほうが/より/いちばん), possibility (使えます/ことができる), and connectors (でも/それから/だから) combine *clauses* or add discourse tokens; they are realized as explicit sentence-family constructions in Task 4 (the shared realizer), not by attaching a morpheme to one verb. The composer therefore rejects them with `not-a-suffix-construction`, and the grammar-spiral validator (Steps 10–12) still checks their five pedagogical roles from `grammarSpiral.ts`.

- [ ] **Step 8: Write `src/course/a2/forms/composeA2Construction.ts`.** A pure composer: look up the construction, conjugate the required base for the target verb, append the tail, and concatenate jp/romaji/reading.

```ts
import { A2_CONSTRUCTIONS } from "./a2Constructions";
import { conjugate, type A2Fragment, type A2PlainForm } from "./a2Conjugation";

export interface ComposeInput {
  readonly constructionId: string;
  readonly senseId: string;
}

export interface ComposedSentence {
  readonly jp: string;
  readonly romaji: string;
  readonly reading: string;
  readonly base: A2PlainForm;
  readonly canDoId: string;
  readonly fragments: readonly A2Fragment[];
}

export type ComposeResult =
  | { ok: true; sentence: ComposedSentence }
  | { ok: false; error: "unknown-construction" | "unknown-verb" | "not-a-suffix-construction" };

/**
 * Compose a `suffix` construction onto the CORRECT conjugated base
 * (te / negative / past) for the target verb. Clause/plain-inflection/connector
 * constructions are realized by sentence families in Task 4, not here. Pure.
 */
export function composeA2Construction(input: ComposeInput): ComposeResult {
  const c = A2_CONSTRUCTIONS[input.constructionId];
  if (!c) return { ok: false, error: "unknown-construction" };
  if (c.kind !== "suffix" || c.base === undefined || c.tail === undefined) {
    return { ok: false, error: "not-a-suffix-construction" };
  }
  const conj = conjugate(input.senseId, c.base);
  if (!conj.ok) return { ok: false, error: "unknown-verb" };
  const fragments: readonly A2Fragment[] = [...conj.result.fragments, ...c.tail];
  return {
    ok: true,
    sentence: {
      jp: fragments.map((f) => f.jp).join(""),
      romaji: fragments.map((f) => f.romaji).join(""),
      reading: fragments.map((f) => f.reading ?? f.jp).join(""),
      base: c.base,
      canDoId: c.canDoId,
      fragments,
    },
  };
}
```

- [ ] **Step 9: Run the composer test, see it pass** (`npx vitest run src/course/a2/forms/composeA2Construction.test.ts` → PASS). This proves the class-correct bases feed the constructions: 読む→ています uses the んで te-form, 行く→たこと uses the った exception past, 話す→はいけません uses the して te-form.


- [ ] **Step 10: Write the failing grammar-spiral validator test.** The spiral (L2) is encoded as data in `grammarSpiral.ts`; the validator proves every form has all five roles and that no role lesson precedes the intro in canonical order.

```ts
// src/course/a2/forms/validateA2GrammarSpiral.test.ts
import { describe, it, expect } from "vitest";
import { A2_GRAMMAR_SPIRAL } from "./grammarSpiral";
import { validateA2GrammarSpiral } from "./validateA2GrammarSpiral";
import { A2_CANONICAL_POSITIONS } from "../manifest";

describe("A2 grammar spiral", () => {
  it("covers all 15 forms with a Can-do, intro, practice, transfer, recurrence", () => {
    expect(A2_GRAMMAR_SPIRAL).toHaveLength(15);
    for (const form of A2_GRAMMAR_SPIRAL) {
      expect(form.canDoId).toMatch(/^a2-cando-/);
      expect(form.introLessonId).toBeTruthy();
      expect(form.controlledPracticeLessonId).toBeTruthy();
      expect(form.transferLessonId).toBeTruthy();
      expect(form.recurrenceLessonIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("passes the release validator with zero errors", () => {
    expect(validateA2GrammarSpiral(A2_GRAMMAR_SPIRAL, A2_CANONICAL_POSITIONS).errors).toEqual([]);
  });

  it("flags a role lesson that precedes its intro", () => {
    const broken = A2_GRAMMAR_SPIRAL.map((f) =>
      f.id === "ongoing-teiru"
        ? { ...f, transferLessonId: "connected-conversation-1" }
        : f,
    );
    const codes = validateA2GrammarSpiral(broken, A2_CANONICAL_POSITIONS).errors.map((e) => e.code);
    expect(codes).toContain("grammar-role-before-intro");
  });
});
```

- [ ] **Step 11: Run it, see it fail**, then write `src/course/a2/forms/grammarSpiral.ts` encoding **L2 exactly**:

```ts
import type { LessonId } from "../../foundations/types";

export interface A2GrammarForm {
  readonly id: string;
  readonly canDoId: string;
  readonly introLessonId: LessonId;
  readonly controlledPracticeLessonId: LessonId;
  readonly transferLessonId: LessonId;
  readonly recurrenceLessonIds: readonly LessonId[];
}

/** The frozen grammar spiral (plan table L2). One row per spiral form. */
export const A2_GRAMMAR_SPIRAL: readonly A2GrammarForm[] = [
  { id: "recognize-plain-forms", canDoId: "a2-cando-recognize-plain-forms", introLessonId: "connected-conversation-4", controlledPracticeLessonId: "reasons-opinions-3", transferLessonId: "experiences-narratives-2", recurrenceLessonIds: ["a2-synthesis-1", "a2-synthesis-4"] },
  { id: "sequence-te", canDoId: "a2-cando-sequence-te", introLessonId: "sequencing-ongoing-1", controlledPracticeLessonId: "sequencing-ongoing-2", transferLessonId: "sequencing-ongoing-4", recurrenceLessonIds: ["restaurant-problems-4", "a2-synthesis-3"] },
  { id: "ongoing-teiru", canDoId: "a2-cando-ongoing-teiru", introLessonId: "sequencing-ongoing-3", controlledPracticeLessonId: "sequencing-ongoing-4", transferLessonId: "work-study-messages-3", recurrenceLessonIds: ["relationships-events-3", "a2-synthesis-2"] },
  { id: "request-tekudasai", canDoId: "a2-cando-request-tekudasai", introLessonId: "permission-requests-3", controlledPracticeLessonId: "restaurant-problems-2", transferLessonId: "work-study-messages-2", recurrenceLessonIds: ["travel-reservations-3", "a2-synthesis-3"] },
  { id: "permission-temoii", canDoId: "a2-cando-permission-temoii", introLessonId: "permission-requests-1", controlledPracticeLessonId: "permission-requests-3", transferLessonId: "neighborhood-services-1", recurrenceLessonIds: ["restaurant-problems-2", "a2-synthesis-2"] },
  { id: "prohibition-tewaikenai", canDoId: "a2-cando-prohibition-tewaikenai", introLessonId: "permission-requests-2", controlledPracticeLessonId: "permission-requests-4", transferLessonId: "practical-texts-2", recurrenceLessonIds: ["a2-synthesis-2"] },
  { id: "request-negative", canDoId: "a2-cando-negative-request", introLessonId: "permission-requests-4", controlledPracticeLessonId: "health-advice-3", transferLessonId: "travel-reservations-3", recurrenceLessonIds: ["a2-synthesis-3"] },
  { id: "experience-takoto", canDoId: "a2-cando-experience-takoto", introLessonId: "experiences-narratives-1", controlledPracticeLessonId: "experiences-narratives-3", transferLessonId: "travel-reservations-2", recurrenceLessonIds: ["relationships-events-3", "a2-synthesis-4"] },
  { id: "intentions-plans", canDoId: "a2-cando-intentions-plans", introLessonId: "plans-invitations-1", controlledPracticeLessonId: "plans-invitations-3", transferLessonId: "plans-invitations-4", recurrenceLessonIds: ["travel-reservations-1", "a2-synthesis-1"] },
  { id: "reason-kara", canDoId: "a2-cando-reason-kara", introLessonId: "reasons-opinions-1", controlledPracticeLessonId: "reasons-opinions-4", transferLessonId: "health-advice-2", recurrenceLessonIds: ["work-study-messages-1", "a2-synthesis-3"] },
  { id: "reason-node", canDoId: "a2-cando-reason-node", introLessonId: "reasons-opinions-2", controlledPracticeLessonId: "work-study-messages-1", transferLessonId: "travel-reservations-3", recurrenceLessonIds: ["a2-synthesis-3"] },
  { id: "opinion-toomou", canDoId: "a2-cando-opinion-toomou", introLessonId: "reasons-opinions-3", controlledPracticeLessonId: "reasons-opinions-4", transferLessonId: "shopping-returns-3", recurrenceLessonIds: ["practical-texts-3", "a2-synthesis-2"] },
  { id: "compare", canDoId: "a2-cando-compare", introLessonId: "shopping-returns-1", controlledPracticeLessonId: "shopping-returns-3", transferLessonId: "travel-reservations-2", recurrenceLessonIds: ["a2-synthesis-2"] },
  { id: "possibility", canDoId: "a2-cando-possibility", introLessonId: "neighborhood-services-1", controlledPracticeLessonId: "neighborhood-services-2", transferLessonId: "shopping-returns-3", recurrenceLessonIds: ["travel-reservations-1", "a2-synthesis-2"] },
  { id: "connectors", canDoId: "a2-cando-connectors", introLessonId: "connected-conversation-2", controlledPracticeLessonId: "reasons-opinions-4", transferLessonId: "experiences-narratives-2", recurrenceLessonIds: ["practical-texts-3", "a2-synthesis-1"] },
];
```

> **Note on `compare`/`intentions-plans`:** L2 lists a secondary intro sublesson (いちばん at shopping-returns-2; つもり at plans-invitations-2). Those are *additional* introductions the content tasks author; the spiral row pins the *first* supported intro. The content validator (Task 7) additionally checks the secondary sublesson exists.

- [ ] **Step 12: Write `src/course/a2/forms/validateA2GrammarSpiral.ts`:**

```ts
import type { LessonId } from "../../foundations/types";
import type { A2GrammarForm } from "./grammarSpiral";

export interface GrammarSpiralError {
  readonly code:
    | "grammar-form-missing-cando"
    | "grammar-form-missing-intro"
    | "grammar-form-missing-practice"
    | "grammar-form-missing-transfer"
    | "grammar-form-missing-recurrence"
    | "grammar-role-before-intro";
  readonly id: string;
}

export interface GrammarSpiralResult {
  readonly valid: boolean;
  readonly errors: readonly GrammarSpiralError[];
}

export function validateA2GrammarSpiral(
  forms: readonly A2GrammarForm[],
  positions: Readonly<Record<LessonId, number>>,
): GrammarSpiralResult {
  const errors: GrammarSpiralError[] = [];
  for (const f of forms) {
    if (!f.canDoId) errors.push({ code: "grammar-form-missing-cando", id: f.id });
    if (!f.introLessonId) errors.push({ code: "grammar-form-missing-intro", id: f.id });
    if (!f.controlledPracticeLessonId) errors.push({ code: "grammar-form-missing-practice", id: f.id });
    if (!f.transferLessonId) errors.push({ code: "grammar-form-missing-transfer", id: f.id });
    if (f.recurrenceLessonIds.length === 0) errors.push({ code: "grammar-form-missing-recurrence", id: f.id });

    const intro = positions[f.introLessonId];
    const roleLessons = [
      f.controlledPracticeLessonId,
      f.transferLessonId,
      ...f.recurrenceLessonIds,
    ];
    for (const lessonId of roleLessons) {
      const pos = positions[lessonId];
      if (intro !== undefined && pos !== undefined && pos < intro) {
        errors.push({ code: "grammar-role-before-intro", id: `${f.id}:${lessonId}` });
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 13: Run all Task 2 tests, see them pass.**

Run: `npx vitest run src/course/a2/forms/`
Expected: PASS (all three files).

- [ ] **Step 14: Typecheck + commit.**

```bash
npx tsc --noEmit
git add src/course/a2/forms/
git commit -m "feat(a2): conjugation-class engine, construction composer, grammar-spiral validator"
```

- [ ] **Step 15: Subagent quality review.** Dispatch: "Review the Task 2 diff against spec §7.1/§9.2–§9.4/§13 and plan table L2. Confirm (a) the conjugation engine covers every class — ichidan, all nine godan sub-classes, する, 来る, plus the 行く った/って exception — and that all 12 verbs' five plain forms match the paradigm table (glyph root preserved, reading + macron-free romaji correct, e.g. 書いて/かいて/kaite, 泳いで/oyoide, 死んで/shinde, 帰って/kaette, 来た/きた/kita); (b) every construction attaches to the CORRECT base (て for ています/てください/てもいいです/てはいけません, negative for ないでください, past for たことがあります) and the composer rejects clause/connector forms; (c) all 15 spiral forms are registered with the exact Can-do IDs from L2 and the validator rejects a role-before-intro. Verify verbal Japanese lives only in `a2Conjugation.ts`/`a2Constructions.ts`. File inline findings." Fix before Task 3.

---
## Task 3: Contextual-kanji layer — types, 120-glyph catalog, assistance policy, validators, UI primitives

Adds the recognition-only kanji system (§14). Catalog data lives in `a2KanjiCatalog.ts` (the only place kanji glyphs/readings live for the course); the assistance policy and validators enforce exposure ordering and the no-bypass guarantees; the UI primitive extends the existing `<ruby>` rendering in `JapaneseSegmentText.tsx`.

**Files:**
- Create: `src/course/a2/kanji/kanjiTypes.ts`
- Create: `src/course/a2/kanji/a2KanjiCatalog.ts`
- Create: `src/course/a2/kanji/kanjiAssistancePolicy.ts`
- Create: `src/course/a2/kanji/validateA2Kanji.ts`
- Create: `src/course/components/KanjiRubyText.tsx`
- Modify: `src/course/components/JapaneseSegmentText.tsx` (add a `kanjiExposure` render path; see Step 12)
- Test: `src/course/a2/kanji/a2KanjiCatalog.test.ts`
- Test: `src/course/a2/kanji/kanjiAssistancePolicy.test.ts`
- Test: `src/course/a2/kanji/validateA2Kanji.test.ts`
- Test: `src/course/components/KanjiRubyText.test.tsx`
- Reference (read): spec §14.1–§14.5, `src/course/components/JapaneseSegmentText.tsx`, `src/settings/ScriptContext.tsx`, plan table L3.

- [ ] **Step 1: Fresh spec re-read.** Re-read §14 in full. Note the exact interfaces (`KanjiEntry`, `KanjiExposure`, `KanjiAssistancePolicy`) and the four failure conditions: assessed-without-prior-support, furigana-hidden-too-early, undeclared-reading, romaji-only-completion. Write nothing yet.

- [ ] **Step 2: Write `src/course/a2/kanji/kanjiTypes.ts`** (types first; no test needed for pure type decls, but they are exercised by Step 3's catalog test).

```ts
import type { ContextId, LessonId, LexemeSenseId } from "../../foundations/types";

export type KanjiId = string;
export type KanjiReadingId = string;
export type KanjiExposureId = string;

export type KanjiExposureStage =
  | "first-supported"
  | "supported-retrieval"
  | "revealable"
  | "assessed";

/** Recognition-only activity modes. NO production/handwriting mode exists. */
export type KanjiActivityMode = "read" | "choose" | "match";

export interface KanjiReading {
  readonly id: KanjiReadingId;
  readonly kanjiId: KanjiId;
  /** Kana reading used in this contextual lexeme (e.g. はな for 話 in 話します). */
  readonly kana: string;
  readonly romaji: string;
}

export interface KanjiEntry {
  readonly id: KanjiId;
  readonly glyph: string;
  readonly meaningCopyId: string;
  readonly readingIds: readonly KanjiReadingId[];
}

export interface KanjiExposure {
  readonly id: KanjiExposureId;
  readonly kanjiId: KanjiId;
  readonly lexemeSenseId: LexemeSenseId;
  readonly lessonId: LessonId;
  readonly stage: KanjiExposureStage;
  readonly readingId: KanjiReadingId;
  readonly contextId: ContextId;
}

export interface KanjiSupport {
  readonly furigana: "visible" | "revealable" | "hidden";
  readonly romaji: "allowed" | "not-shown";
}

export interface KanjiAssistancePolicy {
  supportFor(exposure: KanjiExposure, mode: KanjiActivityMode): KanjiSupport;
}
```

- [ ] **Step 3: Write the failing catalog test.** The catalog exposes: 120 entries; the exact per-module distribution (`A2_KANJI_DISTRIBUTION`) summing to 120; four exposures per kanji in STRICTLY increasing canonical order; no glyph first-supported at a synthesis lesson; every reading declared.

```ts
// src/course/a2/kanji/a2KanjiCatalog.test.ts
import { describe, it, expect } from "vitest";
import {
  A2_KANJI_ENTRIES,
  A2_KANJI_EXPOSURES,
  A2_KANJI_READINGS,
  A2_KANJI_DISTRIBUTION,
  a2KanjiCountByModule,
} from "./a2KanjiCatalog";
import { A2_CANONICAL_POSITIONS, A2_SYNTHESIS_LESSON_IDS } from "../manifest";

const STAGE_ORDER = ["first-supported", "supported-retrieval", "revealable", "assessed"] as const;

describe("A2 kanji catalog", () => {
  it("contains exactly 120 unique glyphs", () => {
    expect(A2_KANJI_ENTRIES).toHaveLength(120);
    const glyphs = new Set(A2_KANJI_ENTRIES.map((k) => k.glyph));
    expect(glyphs.size).toBe(120);
  });

  it("distributes kanji per the L3 table (M2=12, M3/M5/M12/M14=9, M15=0), summing to 120", () => {
    const counts = a2KanjiCountByModule();
    expect(counts).toEqual(A2_KANJI_DISTRIBUTION);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(120);
    expect(counts["a2-synthesis"]).toBe(0);
  });

  it("gives every kanji four exposures in STRICTLY increasing canonical order", () => {
    for (const entry of A2_KANJI_ENTRIES) {
      const exposures = A2_KANJI_EXPOSURES.filter((e) => e.kanjiId === entry.id);
      expect(exposures.map((e) => e.stage)).toEqual([...STAGE_ORDER]);
      const positions = exposures.map((e) => A2_CANONICAL_POSITIONS[e.lessonId]);
      // strict monotonic: first-supported < supported-retrieval < revealable < assessed
      expect(positions[0]).toBeLessThan(positions[1]);
      expect(positions[1]).toBeLessThan(positions[2]);
      expect(positions[2]).toBeLessThan(positions[3]);
    }
  });

  it("introduces NO glyph at a synthesis lesson (M15 first-exposes nothing)", () => {
    const synthesis = new Set(A2_SYNTHESIS_LESSON_IDS);
    const firstSupported = A2_KANJI_EXPOSURES.filter((e) => e.stage === "first-supported");
    expect(firstSupported).toHaveLength(120);
    for (const e of firstSupported) {
      expect(synthesis.has(e.lessonId)).toBe(false);
    }
  });

  it("declares a reading for every exposure", () => {
    const readingIds = new Set(A2_KANJI_READINGS.map((r) => r.id));
    for (const e of A2_KANJI_EXPOSURES) expect(readingIds.has(e.readingId)).toBe(true);
  });
});
```

- [ ] **Step 4: Run it, see it fail** (`Cannot find module './a2KanjiCatalog'`).

- [ ] **Step 5: Write `src/course/a2/kanji/a2KanjiCatalog.ts`.** Encode L3 as a compact per-module data array and a builder that expands each glyph's four exposures via the L3 schedule. This keeps the 120 rows readable and the exposure schedule DRY. Structure (fill all 15 modules from table L3; M1 shown in full, then the same builder call for M2–M15 with each module's 8-row array):

```ts
import { deepFreeze } from "../../foundations/deepFreeze";
import type { ModuleId } from "../../foundations/types";
import type {
  KanjiEntry,
  KanjiExposure,
  KanjiReading,
} from "./kanjiTypes";

/** One authored row from plan table L3 (contextual, recognition-only). All four
 * stage lessons are explicit columns from table L3 — there is no cohort shortcut;
 * the builder reads exactly these four lesson IDs. */
interface KanjiRow {
  readonly glyph: string;
  readonly meaningCopyId: string;
  readonly kana: string; // recognition-target reading for this glyph in the lexeme
  readonly romaji: string;
  readonly lexemeSenseId: string; // the a2-sense-* the glyph first appears in
  readonly contextId: string;
  readonly firstSupported: string;
  readonly supportedRetrieval: string;
  readonly revealable: string;
  readonly assessed: string;
}

/** Module 1 — connected-conversation (plan table L3, rows 1-8). */
const M1_ROWS: readonly KanjiRow[] = [
  { glyph: "話", meaningCopyId: "a2-kanji-hanasu-meaning", kana: "はな", romaji: "hana", lexemeSenseId: "a2-sense-hanasu", contextId: "a2-context-conversation", firstSupported: "connected-conversation-1", supportedRetrieval: "connected-conversation-2", revealable: "connected-conversation-3", assessed: "connected-conversation-4" },
  { glyph: "言", meaningCopyId: "a2-kanji-iu-meaning", kana: "い", romaji: "i", lexemeSenseId: "a2-sense-iu", contextId: "a2-context-conversation", firstSupported: "connected-conversation-1", supportedRetrieval: "connected-conversation-2", revealable: "connected-conversation-3", assessed: "connected-conversation-4" },
  { glyph: "聞", meaningCopyId: "a2-kanji-kiku-meaning", kana: "き", romaji: "ki", lexemeSenseId: "a2-sense-kiku", contextId: "a2-context-conversation", firstSupported: "connected-conversation-1", supportedRetrieval: "connected-conversation-2", revealable: "connected-conversation-3", assessed: "connected-conversation-4" },
  { glyph: "友", meaningCopyId: "a2-kanji-tomo-meaning", kana: "とも", romaji: "tomo", lexemeSenseId: "a2-sense-tomodachi", contextId: "a2-context-conversation", firstSupported: "connected-conversation-1", supportedRetrieval: "connected-conversation-2", revealable: "connected-conversation-3", assessed: "connected-conversation-4" },
  { glyph: "思", meaningCopyId: "a2-kanji-omou-meaning", kana: "おも", romaji: "omo", lexemeSenseId: "a2-sense-omou", contextId: "a2-context-conversation", firstSupported: "connected-conversation-2", supportedRetrieval: "connected-conversation-3", revealable: "connected-conversation-4", assessed: "plans-invitations-1" },
  { glyph: "名", meaningCopyId: "a2-kanji-namae-meaning", kana: "な", romaji: "na", lexemeSenseId: "a2-sense-namae", contextId: "a2-context-conversation", firstSupported: "connected-conversation-2", supportedRetrieval: "connected-conversation-3", revealable: "connected-conversation-4", assessed: "plans-invitations-1" },
  { glyph: "前", meaningCopyId: "a2-kanji-mae-meaning", kana: "まえ", romaji: "mae", lexemeSenseId: "a2-sense-namae", contextId: "a2-context-conversation", firstSupported: "connected-conversation-2", supportedRetrieval: "connected-conversation-3", revealable: "connected-conversation-4", assessed: "plans-invitations-1" },
  { glyph: "何", meaningCopyId: "a2-kanji-nani-meaning", kana: "なに", romaji: "nani", lexemeSenseId: "a2-sense-nani", contextId: "a2-context-conversation", firstSupported: "connected-conversation-2", supportedRetrieval: "connected-conversation-3", revealable: "connected-conversation-4", assessed: "plans-invitations-1" },
];

// M2_ROWS … M14_ROWS: author identically from plan table L3 — one KanjiRow per
// glyph, copying that row's four explicit lesson columns
// (First-supported / Supported-retrieval / Revealable / Assessed). There is NO
// cohort computation: every stage lesson is taken verbatim from the table.
// M15 (a2-synthesis) introduces ZERO new glyphs, so:
const M15_ROWS: readonly KanjiRow[] = [];
// The eight relocated glyphs (今 日 来 月 → plans-invitations; 年 →
// experiences-narratives; 毎 → sequencing-ongoing; 山 → travel-reservations;
// 本 → practical-texts) are authored inside their NEW module arrays with the
// per-glyph readings from L3 (今→こん/kon, 日→び/bi, 来→らい/rai, 月→げつ/getsu,
// 年→ねん/nen, 毎→まい/mai, 山→やま/yama, 本→ほん/hon).

const ALL_ROWS_BY_MODULE: Readonly<Record<ModuleId, readonly KanjiRow[]>> = {
  "connected-conversation": M1_ROWS,
  // "plans-invitations": M2_ROWS (12 rows), … "practical-texts": M14_ROWS (9 rows),
  "a2-synthesis": M15_ROWS, // [] — no new glyphs at synthesis
};

/** The authoritative per-module glyph counts from table L3 (sums to 120). */
export const A2_KANJI_DISTRIBUTION: Readonly<Record<ModuleId, number>> = deepFreeze({
  "connected-conversation": 8,
  "plans-invitations": 12,
  "experiences-narratives": 9,
  "reasons-opinions": 8,
  "sequencing-ongoing": 9,
  "permission-requests": 8,
  "neighborhood-services": 8,
  "restaurant-problems": 8,
  "shopping-returns": 8,
  "health-advice": 8,
  "work-study-messages": 8,
  "travel-reservations": 9,
  "relationships-events": 8,
  "practical-texts": 9,
  "a2-synthesis": 0,
});

function buildCatalog() {
  const entries: KanjiEntry[] = [];
  const readings: KanjiReading[] = [];
  const exposures: KanjiExposure[] = [];
  for (const rows of Object.values(ALL_ROWS_BY_MODULE)) {
    for (const row of rows) {
      const kanjiId = `a2-kanji-${row.romaji}-${row.glyph}`;
      const readingId = `${kanjiId}-reading`;
      readings.push({ id: readingId, kanjiId, kana: row.kana, romaji: row.romaji });
      entries.push({ id: kanjiId, glyph: row.glyph, meaningCopyId: row.meaningCopyId, readingIds: [readingId] });
      const schedule: ReadonlyArray<[KanjiExposure["stage"], string]> = [
        ["first-supported", row.firstSupported],
        ["supported-retrieval", row.supportedRetrieval],
        ["revealable", row.revealable],
        ["assessed", row.assessed],
      ];
      schedule.forEach(([stage, lessonId]) => {
        exposures.push({
          id: `${kanjiId}-${stage}`,
          kanjiId, lexemeSenseId: row.lexemeSenseId, lessonId, stage,
          readingId, contextId: row.contextId,
        });
      });
    }
  }
  return { entries, readings, exposures };
}

const CATALOG = buildCatalog();
export const A2_KANJI_ENTRIES: readonly KanjiEntry[] = deepFreeze(CATALOG.entries);
export const A2_KANJI_READINGS: readonly KanjiReading[] = deepFreeze(CATALOG.readings);
export const A2_KANJI_EXPOSURES: readonly KanjiExposure[] = deepFreeze(CATALOG.exposures);

export function a2KanjiCountByModule(): Readonly<Record<ModuleId, number>> {
  const counts = Object.fromEntries(
    (Object.keys(A2_KANJI_DISTRIBUTION) as ModuleId[]).map((m) => [m, 0]),
  ) as Record<ModuleId, number>;
  for (const [m, rows] of Object.entries(ALL_ROWS_BY_MODULE)) {
    counts[m as ModuleId] = rows.length;
  }
  return counts;
}
```

> **Authoring note:** M2–M14 arrays are mechanical transcriptions of table L3 (glyph, contextual lexeme reading, and the four explicit stage-lesson columns). Do not paraphrase; copy the exact glyphs/readings/lesson IDs, including the eight relocated glyphs in their new modules (M2 has 12 rows, M3/M5/M12/M14 have 9 rows each). `M15_ROWS` is `[]` — the synthesis module introduces no glyph. The `lexemeSenseId`/`contextId` reference the semantic senses/contexts authored in Tasks 4–7; if a sense is not yet authored when Task 3 runs, use the sense ID string the content task will create (they are named deterministically, e.g. `a2-sense-hanasu`) — the kanji validator (Step 10) only cross-checks these against the assembled catalog at release time (Task 7), not at unit-test time.

- [ ] **Step 6: Run the catalog test, see it pass** (author enough of M2–M15 to reach 120; the test enforces the count). `npx vitest run src/course/a2/kanji/a2KanjiCatalog.test.ts` → PASS.

- [ ] **Step 7: Write the failing assistance-policy test** — the policy is the truth table for §14.3.

```ts
// src/course/a2/kanji/kanjiAssistancePolicy.test.ts
import { describe, it, expect } from "vitest";
import { a2KanjiAssistancePolicy } from "./kanjiAssistancePolicy";
import type { KanjiExposure } from "./kanjiTypes";

const at = (stage: KanjiExposure["stage"]): KanjiExposure => ({
  id: "x", kanjiId: "k", lexemeSenseId: "s", lessonId: "l",
  stage, readingId: "r", contextId: "c",
});

describe("A2 kanji assistance policy (§14.3)", () => {
  it("shows furigana at first-supported and supported-retrieval", () => {
    expect(a2KanjiAssistancePolicy.supportFor(at("first-supported"), "read").furigana).toBe("visible");
    expect(a2KanjiAssistancePolicy.supportFor(at("supported-retrieval"), "read").furigana).toBe("visible");
  });
  it("makes furigana revealable at the revealable stage", () => {
    expect(a2KanjiAssistancePolicy.supportFor(at("revealable"), "choose").furigana).toBe("revealable");
  });
  it("hides furigana only in an assessed recognition activity", () => {
    expect(a2KanjiAssistancePolicy.supportFor(at("assessed"), "choose").furigana).toBe("hidden");
  });
  it("never shows romaji in an assessed kanji-recognition activity (no bypass)", () => {
    expect(a2KanjiAssistancePolicy.supportFor(at("assessed"), "choose").romaji).toBe("not-shown");
    expect(a2KanjiAssistancePolicy.supportFor(at("assessed"), "read").romaji).toBe("not-shown");
  });
  it("allows romaji support before assessment", () => {
    expect(a2KanjiAssistancePolicy.supportFor(at("first-supported"), "read").romaji).toBe("allowed");
  });
});
```

- [ ] **Step 8: Run it, see it fail**, then write `src/course/a2/kanji/kanjiAssistancePolicy.ts`:

```ts
import type {
  KanjiActivityMode,
  KanjiAssistancePolicy,
  KanjiExposure,
  KanjiSupport,
} from "./kanjiTypes";

/**
 * The §14.3 assistance truth table. First exposure shows furigana; support
 * becomes revealable after practice; assessment hides furigana ONLY at the
 * assessed stage and never substitutes romaji for the assessed glyph
 * (no-bypass), regardless of the global hiragana/romaji script setting.
 */
export const a2KanjiAssistancePolicy: KanjiAssistancePolicy = {
  supportFor(exposure: KanjiExposure, _mode: KanjiActivityMode): KanjiSupport {
    switch (exposure.stage) {
      case "first-supported":
      case "supported-retrieval":
        return { furigana: "visible", romaji: "allowed" };
      case "revealable":
        return { furigana: "revealable", romaji: "allowed" };
      case "assessed":
        return { furigana: "hidden", romaji: "not-shown" };
    }
  },
};
```

- [ ] **Step 9: Write the failing kanji-release-validator test.** Validates count, per-module distribution, STRICT four-stage exposure order, no first-exposure at a synthesis lesson, premature-hide, assessed-without-support, undeclared reading, romaji-bypass, and standalone-dump (every exposure must reference a lexeme sense, i.e. be contextual).

```ts
// src/course/a2/kanji/validateA2Kanji.test.ts
import { describe, it, expect } from "vitest";
import { validateA2Kanji } from "./validateA2Kanji";
import {
  A2_KANJI_ENTRIES, A2_KANJI_EXPOSURES, A2_KANJI_READINGS, A2_KANJI_DISTRIBUTION,
  a2KanjiCountByModule,
} from "./a2KanjiCatalog";
import { A2_CANONICAL_POSITIONS, A2_SYNTHESIS_LESSON_IDS } from "../manifest";

const input = {
  entries: A2_KANJI_ENTRIES,
  exposures: A2_KANJI_EXPOSURES,
  readings: A2_KANJI_READINGS,
  positions: A2_CANONICAL_POSITIONS,
  synthesisLessonIds: A2_SYNTHESIS_LESSON_IDS,
  countByModule: a2KanjiCountByModule(),
  expectedCount: 120,
  expectedByModule: A2_KANJI_DISTRIBUTION,
};

describe("validateA2Kanji", () => {
  it("passes the real 120-glyph catalog", () => {
    expect(validateA2Kanji(input).errors).toEqual([]);
  });
  it("flags a wrong count", () => {
    const codes = validateA2Kanji({ ...input, expectedCount: 100 }).errors.map((e) => e.code);
    expect(codes).toContain("kanji-count");
  });
  it("flags a per-module distribution mismatch", () => {
    const codes = validateA2Kanji({
      ...input,
      expectedByModule: { ...A2_KANJI_DISTRIBUTION, "a2-synthesis": 8 },
    }).errors.map((e) => e.code);
    expect(codes).toContain("kanji-distribution-sum");
  });
  it("flags an assessed exposure with no prior supported exposure", () => {
    const broken = A2_KANJI_EXPOSURES.filter(
      (e) => !(e.kanjiId === A2_KANJI_ENTRIES[0].id && e.stage !== "assessed"),
    );
    const codes = validateA2Kanji({ ...input, exposures: broken }).errors.map((e) => e.code);
    expect(codes).toContain("kanji-assessed-without-support");
  });
  it("flags a non-strict stage order (revealable == assessed)", () => {
    const target = A2_KANJI_ENTRIES[0].id;
    const assessedLesson = A2_KANJI_EXPOSURES.find(
      (e) => e.kanjiId === target && e.stage === "revealable",
    )!.lessonId;
    const broken = A2_KANJI_EXPOSURES.map((e) =>
      e.kanjiId === target && e.stage === "assessed" ? { ...e, lessonId: assessedLesson } : e,
    );
    const codes = validateA2Kanji({ ...input, exposures: broken }).errors.map((e) => e.code);
    expect(codes).toContain("kanji-exposure-order");
  });
  it("flags a glyph first-supported at a synthesis lesson", () => {
    const target = A2_KANJI_ENTRIES[0].id;
    const broken = A2_KANJI_EXPOSURES.map((e) =>
      e.kanjiId === target && e.stage === "first-supported"
        ? { ...e, lessonId: "a2-synthesis-1" as const }
        : e,
    );
    const codes = validateA2Kanji({ ...input, exposures: broken }).errors.map((e) => e.code);
    expect(codes).toContain("kanji-synthesis-first-exposure");
  });
  it("flags an undeclared reading", () => {
    const broken = A2_KANJI_EXPOSURES.map((e, i) =>
      i === 0 ? { ...e, readingId: "no-such-reading" } : e,
    );
    const codes = validateA2Kanji({ ...input, exposures: broken }).errors.map((e) => e.code);
    expect(codes).toContain("kanji-unknown-reading");
  });
});
```

- [ ] **Step 10: Run it, see it fail**, then write `src/course/a2/kanji/validateA2Kanji.ts`:

```ts
import type { LessonId } from "../../foundations/types";
import type { LessonId, ModuleId } from "../../foundations/types";
import type { KanjiEntry, KanjiExposure, KanjiReading } from "./kanjiTypes";

export type KanjiValidationCode =
  | "kanji-count"
  | "kanji-distribution-sum"
  | "kanji-unknown-reading"
  | "kanji-exposure-order"
  | "kanji-synthesis-first-exposure"
  | "kanji-furigana-premature-hide"
  | "kanji-assessed-without-support"
  | "kanji-romaji-bypass"
  | "kanji-standalone-dump";

export interface KanjiValidationError {
  readonly code: KanjiValidationCode;
  readonly id?: string;
}

export interface ValidateA2KanjiInput {
  readonly entries: readonly KanjiEntry[];
  readonly exposures: readonly KanjiExposure[];
  readonly readings: readonly KanjiReading[];
  readonly positions: Readonly<Record<LessonId, number>>;
  /** Lesson IDs that belong to the synthesis module (no first-supported allowed). */
  readonly synthesisLessonIds: readonly LessonId[];
  /** Actual glyph count per module (from a2KanjiCountByModule()). */
  readonly countByModule: Readonly<Record<ModuleId, number>>;
  readonly expectedCount: number;
  /** Authoritative per-module distribution from table L3 (sums to expectedCount). */
  readonly expectedByModule: Readonly<Record<ModuleId, number>>;
}

const STAGE_RANK = {
  "first-supported": 0,
  "supported-retrieval": 1,
  "revealable": 2,
  "assessed": 3,
} as const;

export function validateA2Kanji(
  input: ValidateA2KanjiInput,
): { valid: boolean; errors: readonly KanjiValidationError[] } {
  const errors: KanjiValidationError[] = [];
  const glyphs = new Set(input.entries.map((e) => e.glyph));
  if (glyphs.size !== input.expectedCount) errors.push({ code: "kanji-count" });

  // Per-module distribution must match L3 exactly, and sum to expectedCount.
  const modules = new Set<ModuleId>([
    ...(Object.keys(input.expectedByModule) as ModuleId[]),
    ...(Object.keys(input.countByModule) as ModuleId[]),
  ]);
  let distributionSum = 0;
  for (const m of modules) {
    const actual = input.countByModule[m] ?? 0;
    distributionSum += actual;
    if (actual !== (input.expectedByModule[m] ?? 0)) {
      errors.push({ code: "kanji-distribution-sum", id: m });
    }
  }
  if (distributionSum !== input.expectedCount) {
    errors.push({ code: "kanji-distribution-sum" });
  }

  const synthesis = new Set<LessonId>(input.synthesisLessonIds);
  const readingIds = new Set(input.readings.map((r) => r.id));
  const byKanji = new Map<string, KanjiExposure[]>();
  for (const e of input.exposures) {
    if (!readingIds.has(e.readingId)) errors.push({ code: "kanji-unknown-reading", id: e.id });
    if (!e.lexemeSenseId) errors.push({ code: "kanji-standalone-dump", id: e.id });
    // No glyph may be first-supported at a synthesis lesson (M15 introduces nothing).
    if (e.stage === "first-supported" && synthesis.has(e.lessonId)) {
      errors.push({ code: "kanji-synthesis-first-exposure", id: e.id });
    }
    (byKanji.get(e.kanjiId) ?? byKanji.set(e.kanjiId, []).get(e.kanjiId)!).push(e);
  }

  for (const [kanjiId, list] of byKanji) {
    const ordered = [...list].sort(
      (a, b) => STAGE_RANK[a.stage] - STAGE_RANK[b.stage],
    );
    // canonical position must STRICTLY increase across the four stages
    for (let i = 1; i < ordered.length; i++) {
      const prev = input.positions[ordered[i - 1].lessonId];
      const cur = input.positions[ordered[i].lessonId];
      if (prev !== undefined && cur !== undefined && cur <= prev) {
        errors.push({ code: "kanji-exposure-order", id: kanjiId });
      }
    }
    const assessed = ordered.find((e) => e.stage === "assessed");
    const hasSupport = ordered.some(
      (e) => e.stage === "first-supported" || e.stage === "supported-retrieval",
    );
    if (assessed && !hasSupport) {
      errors.push({ code: "kanji-assessed-without-support", id: kanjiId });
    }
    // premature hide: an assessed exposure whose position precedes a support
    if (assessed) {
      const assessedPos = input.positions[assessed.lessonId];
      const earliestSupportPos = Math.min(
        ...ordered
          .filter((e) => e.stage === "first-supported" || e.stage === "supported-retrieval")
          .map((e) => input.positions[e.lessonId] ?? Infinity),
      );
      if (assessedPos !== undefined && assessedPos <= earliestSupportPos) {
        errors.push({ code: "kanji-furigana-premature-hide", id: kanjiId });
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
```

> **Strict ordering:** the `cur <= prev` test fires whenever two stages share a canonical position (the earlier design allowed `revealable === assessed`; that is now rejected). Every L3 row satisfies `first-supported < supported-retrieval < revealable < assessed`, so the real catalog passes. **Synthesis first-exposure:** `kanji-synthesis-first-exposure` fires if any glyph is first-supported at an `a2-synthesis-*` lesson; since M15 introduces zero glyphs, the real catalog passes.

> **`kanji-romaji-bypass`** is asserted at the *activity* boundary, not the catalog: the release validator (Task 7) checks that no assessed kanji exercise renders under a romaji substitution by running the assistance policy over each assessed exposure and asserting `romaji === "not-shown"`. The code is declared here so Task 7 can emit it.

- [ ] **Step 11: Run the kanji validator test, see it pass.** `npx vitest run src/course/a2/kanji/` → PASS.

- [ ] **Step 12: Extend `JapaneseSegmentText.tsx` for semantic kanji ruby + reveal, and add `KanjiRubyText.tsx`.** First read the current segment renderer (it already emits `<ruby><rt>` when a segment carries a `reading`). Add a `KanjiRubyText` wrapper that consumes an exposure + the assistance policy + the global `Script` setting and renders:
  - `furigana: "visible"` → `<ruby>話<rt>はな</rt></ruby>` (rt hidden from a11y name via `aria-hidden` on the rt, glyph remains the accessible text);
  - `furigana: "revealable"` → glyph with a `<button>` that toggles the `<rt>` (keyboard-focusable, ≥44px hit area, `aria-expanded`);
  - `furigana: "hidden"` (assessed) → bare glyph, **no** `<rt>`, and — even if `Script === "romaji"` — **no romaji substitution** (the component ignores romaji mode for assessed exposures and renders an explanatory `<span class="kanji-why">` tooltip/caption from a copy key `a2-kanji-why-visible`).

Test:

```tsx
// src/course/components/KanjiRubyText.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KanjiRubyText } from "./KanjiRubyText";
import type { KanjiExposure } from "../a2/kanji/kanjiTypes";

const exposure = (stage: KanjiExposure["stage"]): KanjiExposure => ({
  id: "x", kanjiId: "k", lexemeSenseId: "s", lessonId: "l",
  stage, readingId: "r", contextId: "c",
});

describe("KanjiRubyText", () => {
  it("renders furigana rt at first-supported", () => {
    render(<KanjiRubyText glyph="話" reading="はな" romaji="hana" exposure={exposure("first-supported")} script="hiragana" />);
    expect(screen.getByText("はな")).toBeInTheDocument();
    expect(screen.getByText("話")).toBeInTheDocument();
  });

  it("does NOT show romaji or furigana for an assessed glyph even in romaji mode", () => {
    render(<KanjiRubyText glyph="話" reading="はな" romaji="hana" exposure={exposure("assessed")} script="romaji" />);
    expect(screen.getByText("話")).toBeInTheDocument();
    expect(screen.queryByText("はな")).not.toBeInTheDocument();
    expect(screen.queryByText("hana")).not.toBeInTheDocument();
  });

  it("exposes a reveal control at the revealable stage", () => {
    render(<KanjiRubyText glyph="話" reading="はな" romaji="hana" exposure={exposure("revealable")} script="hiragana" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });
});
```

Implementation `src/course/components/KanjiRubyText.tsx`:

```tsx
import { useState } from "react";
import type { Script } from "../../settings/ScriptContext";
import type { KanjiExposure } from "../a2/kanji/kanjiTypes";
import { a2KanjiAssistancePolicy } from "../a2/kanji/kanjiAssistancePolicy";

export interface KanjiRubyTextProps {
  readonly glyph: string;
  readonly reading: string;
  readonly romaji: string;
  readonly exposure: KanjiExposure;
  readonly script: Script;
  /** Recognition mode of the surrounding activity; defaults to "read". */
  readonly mode?: "read" | "choose" | "match";
}

/**
 * Renders one contextual kanji glyph with policy-governed reading support
 * (§14.3). The glyph itself is ALWAYS the accessible text node; the furigana
 * `<rt>` is decorative (aria-hidden). Romaji mode never replaces an assessed
 * glyph; instead a short caption explains why the kanji stays visible.
 */
export function KanjiRubyText(props: KanjiRubyTextProps) {
  const support = a2KanjiAssistancePolicy.supportFor(props.exposure, props.mode ?? "read");
  const [revealed, setRevealed] = useState(false);

  if (support.furigana === "hidden") {
    return (
      <span className="kanji kanji-assessed">
        <span lang="ja">{props.glyph}</span>
        <span className="kanji-why" role="note">{/* copy: a2-kanji-why-visible */}</span>
      </span>
    );
  }

  if (support.furigana === "revealable") {
    return (
      <button
        type="button"
        className="kanji kanji-reveal"
        aria-expanded={revealed}
        onClick={() => setRevealed((v) => !v)}
      >
        <ruby lang="ja">
          {props.glyph}
          <rt aria-hidden={!revealed}>{revealed ? props.reading : ""}</rt>
        </ruby>
      </button>
    );
  }

  // visible (first-supported / supported-retrieval)
  return (
    <ruby className="kanji" lang="ja">
      {props.glyph}
      <rt aria-hidden>{props.reading}</rt>
    </ruby>
  );
}
```

> Note the component imports only the reading string (never derives romaji for assessed) — the `romaji` prop exists for below-assessment activities that may show a romaji hint per the policy; it is deliberately unused when `support.romaji === "not-shown"`. If your lint forbids unused props, thread `romaji` into the non-assessed branch's title/caption per §14.3's "pronunciation support may be revealed where the assistance policy permits."

- [ ] **Step 13: Run the component test + full kanji suite + typecheck.**

Run: `npx vitest run src/course/a2/kanji/ src/course/components/KanjiRubyText.test.tsx && npx tsc --noEmit`
Expected: PASS + clean.

- [ ] **Step 14: Commit.**

```bash
git add src/course/a2/kanji/ src/course/components/KanjiRubyText.tsx \
  src/course/components/KanjiRubyText.test.tsx src/course/components/JapaneseSegmentText.tsx
git commit -m "feat(a2): contextual-kanji types, 120-glyph catalog, assistance policy, ruby UI, validators"
```

- [ ] **Step 15: Subagent quality review.** Dispatch: "Review Task 3 against spec §14 and plan table L3. Confirm exactly 120 unique glyphs, the per-module counts match `A2_KANJI_DISTRIBUTION` (M2=12, M3/M5/M12/M14=9, M15=0, others 8) and sum to 120, per-glyph four-stage STRICT monotonic ordering (first-supported < supported-retrieval < revealable < assessed), no glyph first-supported at any `a2-synthesis-*` lesson, assessment strictly after a support stage, assistance policy hides furigana ONLY at assessed and never shows romaji for assessed (no bypass in romaji mode), and the ruby component keeps the glyph as the accessible text with decorative rt. Confirm recognition-only (no handwriting/IME anywhere). File inline findings." Fix before Task 4.

---
## Task 4: A2 authoring helpers, semantic-catalog conventions, Japanese-literal lint, and content M1–M4

Establishes the shared A2 lesson builder (analogous to `buildA1InstructionalLesson`), the A2 semantic-catalog naming conventions (families/senses/values that reuse A1 where possible and add the spiral families), the guardrail lint that keeps Japanese out of lesson files, and authors the first content slice: **connected-conversation, plans-invitations, experiences-narratives, reasons-opinions** (16 lessons). Every lesson runs through the shared `validateFoundations` depth/transfer/recurrence oracle (§9.1).

**Per-lesson depth contract (every A2 lesson, §9.1):** 8–12 model sentences, ≥3 distinct predicates/actions, ≥3 person-roles, ≥2 contexts, 8–12 exercises, ≥5 unique visible-target sentences, no target reused by >2 exercises, ≥2 true transfers (≥1 controlled-production). Connected discourse/dialogue where the Can-do is conversational; practical text where the Can-do is a reading task. Productive-verb recurrence contract identical to A1 (`a2VerbUseRecord` + `withA2LaterUses`).

**Files:**
- Create: `src/course/a2/catalog/a2SemanticCatalog.ts` (families, senses, contexts, referents, person-roles, semantic values — the ONLY place A2 Japanese content lives)
- Create: `src/course/a2/catalog/a2LessonBuilders.ts` (`buildA2InstructionalLesson`, `a2Variant`, `a2VerbUseRecord`, `withA2LaterUses`, `assembleA2FoundationCatalogs`)
- Create: `src/course/foundations/instructionalLessonKit.ts` (level-agnostic `buildInstructionalLesson`/`verbUseRecord`/`withLaterUses` extracted from A1 so A1 and A2 share one implementation, §15)
- Modify: `src/course/a1/catalog/a1LessonBuilders.ts` (thin-wrap the extracted kit; signatures unchanged) + add `src/course/a1/catalog/a1LessonBuilders.characterization.test.ts`
- Create: `src/course/a2/catalog/canDos.ts` (mirrors `a1/catalog/canDos.ts`: `A2_CANDO_LESSONS` map (id→lessonIds) as the authoring input; the derived frozen `a2CanDosAuthored: readonly CanDo[]` array and `a2CanDoById` map built from it)
- Create: `src/course/a2/content/module01ConnectedConversation.ts`
- Create: `src/course/a2/content/module02PlansInvitations.ts`
- Create: `src/course/a2/content/module03ExperiencesNarratives.ts`
- Create: `src/course/a2/content/module04ReasonsOpinions.ts`
- Create: `scripts/lintA2NoJapanese.ts` + `src/course/a2/content/noJapaneseLint.test.ts`
- Test: `src/course/a2/content/module01ConnectedConversation.test.ts` (+ one test file per module)
- Reference (read): `src/course/a1/catalog/a1LessonBuilders.ts`, `src/course/a1/catalog/module02Introductions.ts`, `src/course/a1/catalog/a1SemanticCatalog.ts`, `src/course/foundations/validateFoundations.ts` (`ValidateFoundationsInput`), plan tables L1/L2/L3.

- [ ] **Step 1: Fresh spec re-read.** Re-read §9 (depth/transfer contract), §10 (families), §11 (exercise selection), §12 (lesson experience). Confirm the floors above and that dialogues are required for conversational Can-dos. Write nothing yet.

- [ ] **Step 2: Write the failing Japanese-literal lint test + implement the lint.** This guardrail enforces "canonical Japanese in semantic values, not lesson boilerplate."

```ts
// src/course/a2/content/noJapaneseLint.test.ts
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CONTENT_DIR = join(__dirname);
// Matches Hiragana, Katakana, and CJK Unified Ideographs.
const JAPANESE = /[\u3040-\u30ff\u3400-\u9fff]/;

describe("A2 content files contain no Japanese literals", () => {
  it("has no kana/kanji in any module*.ts lesson file", () => {
    const offenders: string[] = [];
    for (const file of readdirSync(CONTENT_DIR)) {
      if (!/^module\d+.*\.ts$/.test(file) || file.endsWith(".test.ts")) continue;
      const text = readFileSync(join(CONTENT_DIR, file), "utf8");
      text.split("\n").forEach((line, i) => {
        if (JAPANESE.test(line)) offenders.push(`${file}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
```

Run: `npx vitest run src/course/a2/content/noJapaneseLint.test.ts`
Expected: PASS trivially now (no module files yet). It becomes a live guard as content lands. Also add `scripts/lintA2NoJapanese.ts` (same regex over the content dir, `process.exit(1)` on offenders) and wire it into the release gate in Task 7.

- [ ] **Step 3: Write the A2 semantic catalog (`a2SemanticCatalog.ts`) with complete typed authoring helpers — no partial objects, no `as unknown`.** Every family/sense/value is a fully-populated record of the real `foundations/types.ts` shapes. Three thin helpers fill only the invariant defaults; the caller supplies all semantic content. Verb Japanese is **not** re-authored here — it is derived from the Task 2 engine's `A2_VERBS` table via `conjugate(senseId, "dictionary")` (single source of truth, §15).

```ts
// src/course/a2/catalog/a2SemanticCatalog.ts
import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  Context, LearningTargetSense, PersonRole, SemanticValue, SemanticValueTokenFragment,
  SentenceFamily,
} from "../../foundations/types";
import { defineA1SemanticValue } from "../../a1/authoring";
import { conjugate, A2_VERBS } from "./a2Conjugation";
// Reuse A1 noun/location/time values verbatim where an A2 lesson re-encounters
// them — import the frozen collection, never re-declare (avoids canonical-answer
// duplication, §15).
import { a1SemanticValues } from "../../a1/catalog/a1SemanticCatalog";

/** One authored fragment (default "attach" boundary), same convention as A1. */
export function frag(
  jp: string, romaji: string,
  kind: SemanticValueTokenFragment["kind"] = "lexical",
  reading?: string,
): SemanticValueTokenFragment {
  return reading === undefined
    ? { jp, romaji, kind, boundaryBefore: "attach" }
    : { jp, romaji, kind, boundaryBefore: "attach", reading };
}

// --- A2 spiral concept ids (each family declares the constructions it needs) ---
export const A2_CONCEPT_TE_SEQUENCE = "a2-concept-te-sequence";
export const A2_CONCEPT_TEIRU = "a2-concept-teiru-ongoing";
export const A2_CONCEPT_TEMOII = "a2-concept-temoii-permission";
export const A2_CONCEPT_TEWAIKENAI = "a2-concept-tewaikenai-prohibition";
export const A2_CONCEPT_TEKUDASAI = "a2-concept-tekudasai-request";
export const A2_CONCEPT_NAIDEKUDASAI = "a2-concept-naidekudasai-negreq";
export const A2_CONCEPT_TAKOTO = "a2-concept-takoto-experience";
export const A2_CONCEPT_YOTEI = "a2-concept-yotei-plan";
export const A2_CONCEPT_TSUMORI = "a2-concept-tsumori-intention";
export const A2_CONCEPT_KARA = "a2-concept-kara-reason";
export const A2_CONCEPT_NODE = "a2-concept-node-reason";
export const A2_CONCEPT_TOOMOU = "a2-concept-toomou-opinion";
export const A2_CONCEPT_COMPARISON = "a2-concept-comparison-yori";
export const A2_CONCEPT_SUPERLATIVE = "a2-concept-superlative-ichiban";
export const A2_CONCEPT_POSSIBILITY = "a2-concept-possibility-dekiru";
export const A2_CONCEPT_MORAU_AGERU = "a2-concept-giving-receiving";

export const A2_CONCEPT_IDS: readonly string[] = deepFreeze([
  A2_CONCEPT_TE_SEQUENCE, A2_CONCEPT_TEIRU, A2_CONCEPT_TEMOII, A2_CONCEPT_TEWAIKENAI,
  A2_CONCEPT_TEKUDASAI, A2_CONCEPT_NAIDEKUDASAI, A2_CONCEPT_TAKOTO, A2_CONCEPT_YOTEI,
  A2_CONCEPT_TSUMORI, A2_CONCEPT_KARA, A2_CONCEPT_NODE, A2_CONCEPT_TOOMOU,
  A2_CONCEPT_COMPARISON, A2_CONCEPT_SUPERLATIVE, A2_CONCEPT_POSSIBILITY, A2_CONCEPT_MORAU_AGERU,
]);

/** Conversational + practical contexts (≥2 per lesson per §9.1); one per setting used in M1–M15. */
export const A2_CONTEXTS: readonly Context[] = deepFreeze([
  { id: "a2-context-conversation", labelCopyId: "a2-context-conversation-label" },
  { id: "a2-context-among-friends", labelCopyId: "a2-context-among-friends-label" },
  { id: "a2-context-workplace", labelCopyId: "a2-context-workplace-label" },
  { id: "a2-context-clinic", labelCopyId: "a2-context-clinic-label" },
  { id: "a2-context-restaurant", labelCopyId: "a2-context-restaurant-label" },
  { id: "a2-context-shop", labelCopyId: "a2-context-shop-label" },
  { id: "a2-context-station", labelCopyId: "a2-context-station-label" },
  { id: "a2-context-notice", labelCopyId: "a2-context-notice-label" },
]);

/** A2 person roles. `a2-role-learner`/`a2-role-partner` are the default speaker/
 * addressee the builder assigns; personas voice dialogue turns. */
export const A2_PERSON_ROLES: readonly PersonRole[] = deepFreeze([
  { id: "a2-role-learner", kind: "learner", labelCopyId: "a2-role-learner-label" },
  { id: "a2-role-partner", kind: "social", labelCopyId: "a2-role-partner-label" },
  { id: "a2-role-colleague", kind: "social", labelCopyId: "a2-role-colleague-label" },
  { id: "a2-role-clerk", kind: "unnamed", labelCopyId: "a2-role-clerk-label" },
  { id: "a2-role-doctor", kind: "social", labelCopyId: "a2-role-doctor-label" },
  { id: "a2-role-haruka", kind: "persona", labelCopyId: "a2-role-haruka-label", gender: "feminine" },
  { id: "a2-role-takeshi", kind: "persona", labelCopyId: "a2-role-takeshi-label", gender: "masculine" },
]);

// ---------------------------------------------------------------------------
// Typed authoring helpers (populate invariants only; caller supplies all content)
// ---------------------------------------------------------------------------

/** Build a complete A2 `SentenceFamily`; only `level:"a2"` is defaulted. */
export function a2Family(spec: Omit<SentenceFamily, "level">): SentenceFamily {
  return deepFreeze({ ...spec, level: "a2" as const });
}

/** Build a complete productive A2 verbal `LearningTargetSense`. */
export function a2VerbSense(spec: {
  readonly id: string;
  readonly lexemeId: string;
  readonly semanticFrameId: string;
  readonly predicate: string;
  readonly argumentRoles: LearningTargetSense["argumentRoles"];
  readonly argumentParticleByRole: LearningTargetSense["argumentParticleByRole"];
}): LearningTargetSense {
  return deepFreeze({ ...spec, learningUse: "productive" as const });
}

/**
 * Build a predicate-sense value from the engine's dictionary form (§15: the
 * verb Japanese has exactly one source — the Task 2 conjugation table).
 */
export function a2PredicateValue(senseId: string): SemanticValue {
  const dict = conjugate(senseId, "dictionary");
  if (!dict.ok) {
    throw new Error(`a2PredicateValue: unknown verb sense "${senseId}"`);
  }
  const { jp, romaji, reading } = dict.result;
  return defineA1SemanticValue({
    id: `a2-value-${senseId.replace("a2-sense-", "")}-dict`,
    kind: "predicate-sense",
    senseId,
    tokenFragments: [frag(jp, romaji, "lexical", reading)],
  });
}

// --- Families: one a2Family(...) per L2 spiral form (three fully worked; the
//     remaining 13 follow the identical pattern below) ---
export const A2_FAMILIES: readonly SentenceFamily[] = deepFreeze([
  a2Family({
    id: "a2-family-te-sequence",
    canDoIds: ["a2-cando-sequence-te"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "first-action", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "second-action", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-te-sequence",
    requiredConceptIds: [A2_CONCEPT_TE_SEQUENCE],
  }),
  a2Family({
    id: "a2-family-teiru-ongoing",
    canDoIds: ["a2-cando-describe-ongoing"],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: true },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "object", "context"],
    realizationRuleId: "rule-teiru-ongoing",
    requiredConceptIds: [A2_CONCEPT_TEIRU],
  }),
  a2Family({
    id: "a2-family-kara-reason",
    canDoIds: ["a2-cando-give-reasons"],
    slotSchema: [
      { id: "reason-clause", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      { id: "main-clause", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["predicate-verb", "polarity-tense-form", "context"],
    realizationRuleId: "rule-kara-reason",
    requiredConceptIds: [A2_CONCEPT_KARA],
  }),
  // One a2Family(...) per remaining L2 form, each a complete record built by the
  // same helper (id, canDoIds from the L2 Can-do table, slotSchema, permittedAxes,
  // realizationRuleId, requiredConceptIds): a2-family-temoii-permission,
  // a2-family-tewaikenai-prohibition, a2-family-tekudasai-request,
  // a2-family-naidekudasai-negreq, a2-family-takoto-experience,
  // a2-family-yotei-plan, a2-family-tsumori-intention, a2-family-node-reason,
  // a2-family-toomou-opinion, a2-family-comparison-yori,
  // a2-family-superlative-ichiban, a2-family-possibility-dekiru,
  // a2-family-morau-ageru. No object is partial; the Step 4 test asserts all 16.
]);

// --- Senses: A2-owned productive senses for the 12 spiral verbs (fully worked).
//     Sense ids and lexeme roots match A2_VERBS so the realizer + kanji agree. ---
export const A2_VERB_SENSES: readonly LearningTargetSense[] = deepFreeze([
  a2VerbSense({ id: "a2-sense-taberu", lexemeId: "a2-lexeme-taberu", semanticFrameId: "a2-frame-eat",    predicate: "eat",    argumentRoles: ["agent", "theme"],    argumentParticleByRole: {} }),
  a2VerbSense({ id: "a2-sense-hanasu", lexemeId: "a2-lexeme-hanasu", semanticFrameId: "a2-frame-speak",  predicate: "speak",  argumentRoles: ["agent", "theme"],    argumentParticleByRole: {} }),
  a2VerbSense({ id: "a2-sense-kaku",   lexemeId: "a2-lexeme-kaku",   semanticFrameId: "a2-frame-write",  predicate: "write",  argumentRoles: ["agent", "theme"],    argumentParticleByRole: {} }),
  a2VerbSense({ id: "a2-sense-oyogu",  lexemeId: "a2-lexeme-oyogu",  semanticFrameId: "a2-frame-swim",   predicate: "swim",   argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "de" } }),
  a2VerbSense({ id: "a2-sense-matsu",  lexemeId: "a2-lexeme-matsu",  semanticFrameId: "a2-frame-wait",   predicate: "wait",   argumentRoles: ["agent", "theme"],    argumentParticleByRole: {} }),
  a2VerbSense({ id: "a2-sense-shinu",  lexemeId: "a2-lexeme-shinu",  semanticFrameId: "a2-frame-die",    predicate: "die",    argumentRoles: ["agent"],             argumentParticleByRole: {} }),
  a2VerbSense({ id: "a2-sense-asobu",  lexemeId: "a2-lexeme-asobu",  semanticFrameId: "a2-frame-play",   predicate: "play",   argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "de" } }),
  a2VerbSense({ id: "a2-sense-yomu",   lexemeId: "a2-lexeme-yomu",   semanticFrameId: "a2-frame-read",   predicate: "read",   argumentRoles: ["agent", "theme"],    argumentParticleByRole: {} }),
  a2VerbSense({ id: "a2-sense-kaeru",  lexemeId: "a2-lexeme-kaeru",  semanticFrameId: "a2-frame-return", predicate: "return", argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "ni" } }),
  a2VerbSense({ id: "a2-sense-iku",    lexemeId: "a2-lexeme-iku",    semanticFrameId: "a2-frame-go",     predicate: "go",     argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "ni" } }),
  a2VerbSense({ id: "a2-sense-suru",   lexemeId: "a2-lexeme-suru",   semanticFrameId: "a2-frame-do",     predicate: "do",     argumentRoles: ["agent", "theme"],    argumentParticleByRole: {} }),
  a2VerbSense({ id: "a2-sense-kuru",   lexemeId: "a2-lexeme-kuru",   semanticFrameId: "a2-frame-come",   predicate: "come",   argumentRoles: ["agent", "location"], argumentParticleByRole: { location: "ni" } }),
]);

// --- Values: verb predicate values derived from the engine; nouns imported from A1 ---
export const A2_VERB_VALUES: readonly SemanticValue[] = deepFreeze(
  Object.keys(A2_VERBS).map((senseId) => a2PredicateValue(senseId)),
);

/** Object/location/time values reused from A1 (imported frozen, never re-authored). */
export const A2_REUSED_VALUES: readonly SemanticValue[] = a1SemanticValues;

export const A2_VALUES: readonly SemanticValue[] = deepFreeze([
  ...A2_VERB_VALUES,
  ...A2_REUSED_VALUES,
]);
```

The `realizationRuleId`s (`rule-te-sequence`, `rule-teiru-ongoing`, `rule-kara-reason`, and the 13 siblings) are registered in the shared realizer rule table beside A1's — see `src/course/foundations/realizeFamily.ts` (Task 2 wires the suffix rules to delegate to `composeA2Construction`; the clause families own their own slot order there). Because every family/sense/value is built by a **fully-typed** helper, the compiler rejects a missing field — there is no `as unknown` escape hatch and no partial literal anywhere in this file.
- [ ] **Step 4: Write the failing builder test** (`buildA2InstructionalLesson` produces a recipe + ≥8 variants + bilingual copy, and wires kanji exposures for the lesson).

```ts
// src/course/a2/content/module01ConnectedConversation.test.ts
import { describe, it, expect } from "vitest";
import { module01ConnectedConversation } from "./module01ConnectedConversation";
import { validateFoundations } from "../../foundations/validateFoundations";
import { assembleA2FoundationCatalogs } from "../catalog/a2LessonBuilders";
import { A2_RELEASE_CATALOG_VERSION, A2_RELEASE_SEED } from "../releaseIdentity";

describe("connected-conversation module", () => {
  it("has 4 lessons with 8–12 models and ≥2 transfers each", () => {
    expect(module01ConnectedConversation).toHaveLength(4);
    for (const lesson of module01ConnectedConversation) {
      // Real A1LessonRecipe-shaped fields (see foundations types): models are
      // `modelVariantIds`; transfers are the round-two candidate set.
      expect(lesson.recipe.modelVariantIds.length).toBeGreaterThanOrEqual(8);
      expect(lesson.recipe.modelVariantIds.length).toBeLessThanOrEqual(12);
      expect(lesson.recipe.practice.roundTwo.candidateVariantIds.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("passes the shared foundation depth/transfer validator", () => {
    const { catalogs, copy } = assembleA2FoundationCatalogs(module01ConnectedConversation);
    // M1 is the first module, so every transfer's content is introduced
    // in-module: the per-lesson closure fallback applies and no cumulative
    // `availableContentByLesson` is needed here (Task 7 supplies it course-wide).
    const result = validateFoundations({
      catalogs,
      foundationCopy: copy,
      catalogVersion: A2_RELEASE_CATALOG_VERSION,
      seed: A2_RELEASE_SEED,
    });
    expect(result.valid).toBe(true);
  });
});
```

- [ ] **Step 5: Run the Step 4 test, see it fail, then build the shared lesson kit and the A2 wrapper.** The A1 builder in `a1LessonBuilders.ts` is ~500 lines and level-specific; per §15 (no duplication) we do **not** copy it. Instead we extract its genuinely level-agnostic core into `src/course/foundations/instructionalLessonKit.ts`, make A1 a thin config over it (pinned byte-identical by a characterization test), and make A2 a second thin config. This is three sub-steps; every body is complete.

  **Step 5.1 — Extract `src/course/foundations/instructionalLessonKit.ts`.** The kit owns the round/diversity/recipe assembly and catalog merge, generic over the level's recipe type `R`. The level supplies its `buildVariant` (the existing `a1Variant`, and the new `a2Variant`) and its `defineLesson` validator through a config object; the kit imports **no** level module.

```ts
// src/course/foundations/instructionalLessonKit.ts
import { deepFreeze } from "./deepFreeze";
import type {
  Bilingual, FormSelection, FoundationCatalogs, LessonDiversityConstraints,
  LessonPracticeDefinition, PedagogicalUse, SentenceVariant, VerbLaterUse, VerbUseRecord,
} from "./types";

/** Level-agnostic compact line spec (A1 and A2 both author this shape). */
export interface KitLineSpec {
  readonly id: string;
  readonly family: string;
  readonly context: string;
  readonly subjectReferent: string | null;
  readonly subjectRealization: "explicit" | "omitted";
  readonly slots: Readonly<Record<string, string>>;
  readonly interrogative?: boolean;
  readonly form?: FormSelection;
  readonly translation: Bilingual;
  readonly speakerRole?: string;
  readonly addresseeRole?: string | null;
}

export interface KitBuiltVariant {
  readonly variant: SentenceVariant;
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
}

/** Everything the kit needs from a specific CEFR level, injected as data. */
export interface LessonKitConfig<R> {
  readonly learnerRole: string;              // e.g. "a1-role-learner"
  readonly defaultAddresseeRole: string | null; // e.g. "a1-role-teacher"
  readonly referentRole: Readonly<Record<string, string>>;
  readonly voiceableReferents: ReadonlySet<string>;
  readonly roundOneKinds: readonly string[];
  readonly roundTwoKinds: readonly string[];
  readonly selectionPolicyId: string;        // e.g. "a1-selection-default"
  readonly scenarioCopy: (context: string) => Bilingual;
  readonly buildVariant: (spec: KitLineSpec & { readonly use: PedagogicalUse }) => KitBuiltVariant;
  readonly defineLesson: (recipe: KitRecipeInput) => R;
}

/** The recipe payload the kit hands the level's validator (matches A1LessonRecipe). */
export interface KitRecipeInput {
  readonly id: string;
  readonly moduleId: string;
  readonly order: 1 | 2 | 3 | 4;
  readonly contract: "instructional" | "synthesis";
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly modelVariantIds: readonly string[];
  readonly guidedVariantIds: readonly [string, string];
  readonly spokenVariantId: string;
  readonly practice: LessonPracticeDefinition;
  readonly diversityConstraints: LessonDiversityConstraints;
  readonly introducedConceptIds: readonly string[];
  readonly introducedSenseIds: readonly string[];
}

export interface KitLessonInput {
  readonly id: string;
  readonly moduleId: string;
  readonly order: 1 | 2 | 3 | 4;
  readonly contract?: "instructional" | "synthesis";
  readonly primaryCanDoId: string;
  readonly supportingCanDoIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly introducedSenseIds: readonly string[];
  readonly models: readonly KitLineSpec[];
  readonly transfers: readonly KitLineSpec[];
  readonly kanjiExposureIds?: readonly string[];
}

export interface KitBuiltLesson<R> {
  readonly recipe: R;
  readonly variants: readonly SentenceVariant[];
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
  readonly kanjiExposureIds: readonly string[];
}

function speakerRoleFor<R>(spec: KitLineSpec, config: LessonKitConfig<R>): string {
  if (spec.speakerRole !== undefined) return spec.speakerRole;
  const ref = spec.subjectReferent;
  if (ref !== null && config.voiceableReferents.has(ref)) {
    return config.referentRole[ref] ?? config.learnerRole;
  }
  return config.learnerRole;
}

function lineVariant<R>(
  spec: KitLineSpec, use: PedagogicalUse, config: LessonKitConfig<R>,
): KitBuiltVariant {
  return config.buildVariant({
    ...spec,
    speakerRole: speakerRoleFor(spec, config),
    addresseeRole: spec.addresseeRole === undefined ? config.defaultAddresseeRole : spec.addresseeRole,
    use,
  });
}

/** Assemble one instructional lesson. Diversity floors are the fixed §9.1 contract. */
export function buildInstructionalLesson<R>(
  input: KitLessonInput, config: LessonKitConfig<R>,
): KitBuiltLesson<R> {
  const modelBuilt = input.models.map((m) => lineVariant(m, "model", config));
  const transferBuilt = input.transfers.map((t) => lineVariant(t, "transfer", config));
  const modelIds = modelBuilt.map((b) => b.variant.id);
  const transferIds = transferBuilt.map((b) => b.variant.id);
  const modelFamilies = new Set(modelBuilt.map((b) => b.variant.sentenceFamilyId));

  const diversityConstraints: LessonDiversityConstraints = {
    modelCountRange: [8, 8],
    exerciseCountRange: [10, 10],
    minFamilies: modelFamilies.size,
    minPredicates: 3,
    minRoles: 3,
    minContexts: 2,
    minUniqueTargets: 5,
    maxTargetReuse: 2,
    minTransferExercises: 5,
    requireControlledConstruction: true,
  };

  const practice: LessonPracticeDefinition = {
    lessonId: input.id,
    roundOne: {
      id: `${input.id}-round-1`,
      purpose: "guided-controlled",
      candidateVariantIds: modelIds,
      selectionPolicyId: config.selectionPolicyId,
      exerciseKinds: [...config.roundOneKinds],
      targetCount: 5,
    },
    roundTwo: {
      id: `${input.id}-round-2`,
      purpose: "transfer",
      candidateVariantIds: transferIds,
      selectionPolicyId: config.selectionPolicyId,
      exerciseKinds: [...config.roundTwoKinds],
      targetCount: 5,
    },
  };

  const recipe = config.defineLesson({
    id: input.id,
    moduleId: input.moduleId,
    order: input.order,
    contract: input.contract ?? "instructional",
    primaryCanDoId: input.primaryCanDoId,
    supportingCanDoIds: input.supportingCanDoIds,
    modelVariantIds: modelIds,
    guidedVariantIds: [modelIds[0], modelIds[1]],
    spokenVariantId: modelIds[0],
    practice,
    diversityConstraints,
    introducedConceptIds: input.introducedConceptIds,
    introducedSenseIds: input.introducedSenseIds,
  });

  const en: Record<string, string> = {};
  const it: Record<string, string> = {};
  for (const built of [...modelBuilt, ...transferBuilt]) {
    Object.assign(en, built.en);
    Object.assign(it, built.it);
  }

  return deepFreeze({
    recipe,
    variants: [...modelBuilt, ...transferBuilt].map((b) => b.variant),
    en, it,
    kanjiExposureIds: input.kanjiExposureIds ? [...input.kanjiExposureIds] : [],
  });
}

/** Generic verb-use intro record (id prefix is the only level-specific bit). */
export function verbUseRecord(idPrefix: "a1" | "a2", input: {
  readonly senseId: string;
  readonly introductionLessonId: string;
  readonly introductionVariantIds: readonly string[];
  readonly exerciseRoundId: string;
  readonly exerciseKind: "tile-ordering" | "choice" | "transformation" | "completion" | "constrained-construction";
  readonly exerciseTargetVariantId: string;
}): VerbUseRecord {
  return deepFreeze({
    id: `${idPrefix}-verb-use-${input.senseId}`,
    senseId: input.senseId,
    learningUse: "productive",
    introductionLessonId: input.introductionLessonId,
    introductionVariantIds: [...input.introductionVariantIds],
    introductionExercise: {
      lessonId: input.introductionLessonId,
      roundId: input.exerciseRoundId,
      exerciseKind: input.exerciseKind,
      targetVariantId: input.exerciseTargetVariantId,
    },
    laterUses: [],
  });
}

/** Immutably append later spaced reuses to a frozen verb-use record. */
export function withLaterUses(record: VerbUseRecord, additions: readonly VerbLaterUse[]): VerbUseRecord {
  return deepFreeze({ ...record, laterUses: [...record.laterUses, ...additions.map((u) => ({ ...u }))] });
}
```

  **Step 5.2 — Refactor A1 to the kit and pin it byte-identical.** In `a1LessonBuilders.ts`, replace the bodies of `buildA1InstructionalLesson`, `a1VerbUseRecord`, `withA1LaterUses` with thin delegations (the exported *signatures* are unchanged), delete the now-unused local `lineVariant`/`defaultSpeakerRole` (the kit owns that logic), and declare the A1 config:

```ts
// src/course/a1/catalog/a1LessonBuilders.ts  (bodies only — signatures unchanged)
import {
  buildInstructionalLesson, verbUseRecord, withLaterUses, type LessonKitConfig,
} from "../../foundations/instructionalLessonKit";
import type { A1LessonRecipe } from "../types";
import { defineA1Lesson } from "../authoring";

const A1_LESSON_KIT: LessonKitConfig<A1LessonRecipe> = {
  learnerRole: "a1-role-learner",
  defaultAddresseeRole: "a1-role-teacher",
  referentRole: A1_REFERENT_ROLE,
  voiceableReferents: A1_VOICEABLE_REFERENTS,
  roundOneKinds: A1_ROUND_ONE_KINDS,
  roundTwoKinds: A1_ROUND_TWO_KINDS,
  selectionPolicyId: "a1-selection-default",
  scenarioCopy: (context) => a1Scenario(context),
  buildVariant: (spec) => a1Variant({ ...spec, scenario: a1Scenario(spec.context) }),
  defineLesson: (r) => defineA1Lesson(r as A1LessonRecipe),
};

export function buildA1InstructionalLesson(input: A1InstructionalLessonInput): A1BuiltLesson {
  const built = buildInstructionalLesson<A1LessonRecipe>(input, A1_LESSON_KIT);
  return { recipe: built.recipe, variants: built.variants, en: built.en, it: built.it };
}

export function a1VerbUseRecord(input: {
  readonly senseId: string;
  readonly introductionLessonId: string;
  readonly introductionVariantIds: readonly string[];
  readonly exerciseRoundId: string;
  readonly exerciseKind: "tile-ordering" | "choice" | "transformation" | "completion" | "constrained-construction";
  readonly exerciseTargetVariantId: string;
}): VerbUseRecord {
  return verbUseRecord("a1", input);
}
export function withA1LaterUses(record: VerbUseRecord, additions: readonly VerbLaterUse[]): VerbUseRecord {
  return withLaterUses(record, additions);
}
```

  Write the characterization test **before** the refactor and keep it green through it (it fails only if A1 output byte-changes). `assembleA1FoundationCatalogs` is unchanged by the refactor; it takes `{ lessons: recipes, variants }` (see its real signature) and `module02Introductions.ts` exports `module2Lessons: readonly A1BuiltLesson[]`:

```ts
// src/course/a1/catalog/a1LessonBuilders.characterization.test.ts
import { describe, it, expect } from "vitest";
import { module2Lessons } from "./module02Introductions";
import { assembleA1FoundationCatalogs } from "./a1LessonBuilders";

describe("A1 builder refactor is behaviour-preserving", () => {
  it("produces byte-identical catalogs for module 2 (snapshot pin)", () => {
    const catalogs = assembleA1FoundationCatalogs({
      lessons: module2Lessons.map((b) => b.recipe),
      variants: module2Lessons.flatMap((b) => [...b.variants]),
    });
    // Pin the exact realized output: variant ids, families, and lesson ids.
    expect(catalogs.sentenceVariants.map((v) => v.id)).toMatchSnapshot("m2-variant-ids");
    expect(catalogs.sentenceVariants.map((v) => v.sentenceFamilyId)).toMatchSnapshot("m2-families");
    expect(catalogs.lessons.map((l) => l.id)).toMatchSnapshot("m2-lesson-ids");
  });
});
```

  Run: `npx vitest run src/course/a1` → the whole A1 suite (module tests + `validateA1` + this snapshot) stays PASS, proving the extraction changed nothing observable.

  **Step 5.3 — Write `src/course/a2/catalog/a2LessonBuilders.ts` (thin A2 config over the kit).** No `unknown`, no mirror directive:

```ts
// src/course/a2/catalog/a2LessonBuilders.ts
import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  Bilingual, FoundationCatalogs, FoundationLessonDefinition, LessonPositionRecord,
  PedagogicalUse, SentenceVariant, VerbLaterUse, VerbUseRecord,
} from "../../foundations/types";
import type { A1LessonRecipe } from "../../a1/types";
import { defineA1Lesson, variantFromTuple } from "../../a1/authoring"; // level-agnostic primitives
import { a1Referents } from "../../a1/catalog/a1SemanticCatalog"; // A2 reuses A1 named referents
import { A2_CANONICAL_POSITIONS } from "../manifest";
import {
  buildInstructionalLesson, verbUseRecord, withLaterUses,
  type KitBuiltVariant, type KitLessonInput, type KitLineSpec, type LessonKitConfig,
} from "../../foundations/instructionalLessonKit";
import {
  A2_CONTEXTS, A2_FAMILIES, A2_PERSON_ROLES, A2_VALUES, A2_VERB_SENSES,
} from "./a2SemanticCatalog";

export type A2LineSpec = KitLineSpec;                 // identical shape
export type A2InstructionalLessonInput = KitLessonInput;

export interface A2BuiltLesson {
  readonly recipe: A1LessonRecipe;                    // same validated recipe shape
  readonly variants: readonly SentenceVariant[];
  readonly en: Readonly<Record<string, string>>;
  readonly it: Readonly<Record<string, string>>;
  readonly kanjiExposureIds: readonly string[];
}

export function a2TranslationCopyId(id: string): string { return `a2-copy-${id}-translation`; }
export function a2ScenarioCopyId(id: string): string { return `a2-copy-${id}-scenario`; }
function a2Scenario(context: string): Bilingual {
  return { en: `Context: ${context}.`, it: `Contesto: ${context}.` };
}

const A2_AFFIRMATIVE_PRESENT_POLITE = { polarity: "affirmative", tense: "present", formality: "polite" } as const;
const A2_AFFIRMATIVE_PRESENT_POLITE_QUESTION = { ...A2_AFFIRMATIVE_PRESENT_POLITE, interrogative: true } as const;

/** Expand a compact A2 line into a frozen SentenceVariant + its EN/IT copy. */
export function a2Variant(spec: A2LineSpec & { readonly use: PedagogicalUse }): KitBuiltVariant {
  if (spec.form !== undefined && spec.interrogative === true) {
    throw new Error(`a2Variant "${spec.id}": \`form\` and \`interrogative:true\` are mutually exclusive.`);
  }
  const variant = variantFromTuple({
    id: spec.id,
    familyId: spec.family,
    discourse: {
      speakerRoleId: spec.speakerRole ?? "a2-role-learner",
      addresseeRoleId: spec.addresseeRole ?? "a2-role-partner",
      subjectReferentId: spec.subjectReferent,
      subjectRealization: spec.subjectRealization,
      scenarioNoteCopyId: a2ScenarioCopyId(spec.id),
    },
    contextId: spec.context,
    slotValues: spec.slots,
    form: spec.form ?? (spec.interrogative ? A2_AFFIRMATIVE_PRESENT_POLITE_QUESTION : A2_AFFIRMATIVE_PRESENT_POLITE),
    pedagogicalUse: spec.use,
  });
  const scenario = a2Scenario(spec.context);
  return {
    variant,
    en: { [a2TranslationCopyId(spec.id)]: spec.translation.en, [a2ScenarioCopyId(spec.id)]: scenario.en },
    it: { [a2TranslationCopyId(spec.id)]: spec.translation.it, [a2ScenarioCopyId(spec.id)]: scenario.it },
  };
}

const A2_ROUND_ONE_KINDS = ["tile-ordering", "choice", "completion"] as const;
const A2_ROUND_TWO_KINDS = ["constrained-construction", "completion", "tile-ordering"] as const;
const A2_REFERENT_ROLE: Readonly<Record<string, string>> = Object.freeze({});
const A2_VOICEABLE_REFERENTS: ReadonlySet<string> = new Set<string>();

const A2_LESSON_KIT: LessonKitConfig<A1LessonRecipe> = {
  learnerRole: "a2-role-learner",
  defaultAddresseeRole: "a2-role-partner",
  referentRole: A2_REFERENT_ROLE,
  voiceableReferents: A2_VOICEABLE_REFERENTS,
  roundOneKinds: A2_ROUND_ONE_KINDS,
  roundTwoKinds: A2_ROUND_TWO_KINDS,
  selectionPolicyId: "a2-selection-default",
  scenarioCopy: a2Scenario,
  buildVariant: a2Variant,
  defineLesson: (r) => defineA1Lesson(r as A1LessonRecipe), // same recipe validator/shape
};

export function buildA2InstructionalLesson(input: A2InstructionalLessonInput): A2BuiltLesson {
  const built = buildInstructionalLesson<A1LessonRecipe>(input, A2_LESSON_KIT);
  return {
    recipe: built.recipe, variants: built.variants,
    en: built.en, it: built.it, kanjiExposureIds: built.kanjiExposureIds,
  };
}

export function a2VerbUseRecord(input: {
  readonly senseId: string;
  readonly introductionLessonId: string;
  readonly introductionVariantIds: readonly string[];
  readonly exerciseRoundId: string;
  readonly exerciseKind: "tile-ordering" | "choice" | "transformation" | "completion" | "constrained-construction";
  readonly exerciseTargetVariantId: string;
}): VerbUseRecord {
  return verbUseRecord("a2", input);
}
export function withA2LaterUses(record: VerbUseRecord, additions: readonly VerbLaterUse[]): VerbUseRecord {
  return withLaterUses(record, additions);
}

/**
 * Convert an A2 lesson recipe into the `FoundationLessonDefinition` the
 * view-model/validator pipeline consumes. `familyIds` is derived from the
 * union of the lesson's model variants' families (authored order), never
 * hand-declared — identical rule to A1's `toFoundationLesson`.
 */
function toA2FoundationLesson(
  recipe: A1LessonRecipe,
  variantById: ReadonlyMap<string, SentenceVariant>,
): FoundationLessonDefinition {
  const familyIds: string[] = [];
  for (const variantId of recipe.modelVariantIds) {
    const variant = variantById.get(variantId);
    if (variant && !familyIds.includes(variant.sentenceFamilyId)) {
      familyIds.push(variant.sentenceFamilyId);
    }
  }
  return {
    id: recipe.id,
    level: "a2",
    moduleId: recipe.moduleId,
    primaryCanDoId: recipe.primaryCanDoId,
    supportingCanDoIds: recipe.supportingCanDoIds,
    modelVariantIds: recipe.modelVariantIds,
    familyIds,
    practice: recipe.practice,
    diversityConstraints: recipe.diversityConstraints,
  };
}

/** Merge built A2 lessons + the shared A2 catalogs into a `FoundationCatalogs`
 * (plus the aggregated EN/IT copy). Levels/modules/checkpoints stay empty — the
 * view-model pipeline reads none of them; Task 7 assembles those for release. */
export function assembleA2FoundationCatalogs(
  lessons: readonly A2BuiltLesson[],
): {
  readonly catalogs: FoundationCatalogs;
  readonly copy: { readonly en: Record<string, string>; readonly it: Record<string, string> };
} {
  const en: Record<string, string> = {};
  const it: Record<string, string> = {};
  const variants: SentenceVariant[] = [];
  for (const lesson of lessons) {
    Object.assign(en, lesson.en);
    Object.assign(it, lesson.it);
    variants.push(...lesson.variants);
  }
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const foundationLessons = lessons.map((l) => toA2FoundationLesson(l.recipe, variantById));
  const lessonPositions: LessonPositionRecord[] = lessons.map((l) => ({
    lessonId: l.recipe.id,
    level: "a2",
    moduleId: l.recipe.moduleId,
    position: A2_CANONICAL_POSITIONS[l.recipe.id] ?? 0,
  }));
  const catalogs: FoundationCatalogs = {
    levels: [],
    modules: [],
    checkpoints: [],
    canDos: [],                 // supplied by Task 4 Step 8 (a2CanDosAuthored) / Task 7
    contexts: [...A2_CONTEXTS],
    personRoles: [...A2_PERSON_ROLES],
    referents: [...a1Referents], // A2 reuses A1 named referents; imported, not re-authored
    learningTargetSenses: [...A2_VERB_SENSES],
    semanticValues: [...A2_VALUES],
    sentenceFamilies: [...A2_FAMILIES],
    sentenceVariants: variants,
    lessons: foundationLessons,
    lessonPositions,
    verbUseRecords: [],
  };
  return deepFreeze({ catalogs, copy: { en, it } });
}
```

  Run: `npx vitest run src/course/a2/content/module01ConnectedConversation.test.ts` → PASS once M1 content (Step 6) exists; before that it fails on the missing module import, which is the expected red for Step 6.
- [ ] **Step 6: Author `module01ConnectedConversation.ts` (fully-worked reference).** Lesson 1 (`connected-conversation-1`) in full; the other three follow the same builder call with the per-lesson data in the M1 contract table below. Lesson 1:

```ts
import { buildA2InstructionalLesson } from "../catalog/a2LessonBuilders";

const connectedConversation1 = buildA2InstructionalLesson({
  id: "connected-conversation-1",
  moduleId: "connected-conversation",
  order: 1,
  primaryCanDoId: "a2-cando-backchannel-followup",
  supportingCanDoIds: ["a2-cando-recognize-plain-forms"],
  introducedConceptIds: ["a2-concept-backchannel"],
  introducedSenseIds: ["a2-sense-hanasu", "a2-sense-kiku", "a2-sense-iu"],
  kanjiExposureIds: [
    "a2-kanji-hana-話-first-supported",
    "a2-kanji-i-言-first-supported",
    "a2-kanji-ki-聞-first-supported",
    "a2-kanji-tomo-友-first-supported",
  ],
  models: [
    // 8–12 lines. Each references semantic value IDs only — no Japanese here.
    { id: "cc1-m1", family: "a1-family-topic-copular", context: "a2-context-conversation",
      subjectReferent: "a2-ref-speaker", subjectRealization: "explicit",
      slots: { topic: "a2-value-weekend-topic", predicate: "a2-value-busy-adj" },
      translation: { en: "This weekend was busy.", it: "Questo fine settimana è stato impegnato." } },
    // cc1-m2 … cc1-m8+ : vary predicate (話す/聞く/言う), role (speaker/partner/third),
    // context (conversation/among-friends), including ≥1 backchannel dialogue turn.
  ],
  transfers: [
    { id: "cc1-t1", family: "a2-family-te-sequence", context: "a2-context-among-friends",
      subjectReferent: "a2-ref-partner", subjectRealization: "omitted",
      slots: { action1: "a2-value-listen", action2: "a2-value-ask-back" },
      translation: { en: "They listened and then asked a question back.", it: "Ha ascoltato e poi ha rifatto una domanda." } },
    // cc1-t2 : controlled-production transfer (new role/context, no model tuple reuse).
  ],
});

export const module01ConnectedConversation = [
  connectedConversation1,
  // connectedConversation2, connectedConversation3, connectedConversation4
];
```

**M1 per-lesson authoring contract** (each lesson: 8–12 models, ≥3 predicates, ≥3 roles, ≥2 contexts, 8–12 exercises, ≥5 unique targets, reuse ≤2, ≥2 transfers):

| Lesson | Primary Can-do | Spiral form(s) introduced | Families | Kanji first-supported | Discourse |
|--------|----------------|---------------------------|----------|------------------------|-----------|
| connected-conversation-1 | a2-cando-backchannel-followup | — (recognizes plain forms receptively) | a1-family-topic-copular, a2-family-te-sequence | 話 言 聞 友 | backchannel dialogue |
| connected-conversation-2 | a2-cando-connectors (intro) | connectors (でも/それから) | a2-family-te-sequence, a1-family-object-action | 思 名 前 何 | linked two-turn discourse |
| connected-conversation-3 | a2-cando-clarify-repeat | request (てください preview via set phrase) | a2-family-tekudasai-request | (revealable 話言聞友) | clarification dialogue |
| connected-conversation-4 | a2-cando-recognize-plain-forms (intro) | plain forms | a1-family-topic-copular (plain), a2-family-te-sequence | (assessed 話言聞友) | casual plain-form dialogue |

- [ ] **Step 7: Author M2–M4 modules** using the same builder and each module's contract table:

**M2 plans-invitations** (予定/つもり intro; calendar kanji 予定曜会週末待約):

| Lesson | Primary Can-do | Spiral form(s) | Families |
|--------|----------------|----------------|----------|
| plans-invitations-1 | a2-cando-intentions-plans (予定 intro) | 予定 | a2-family-yotei-plan, a1-family-schedule-action |
| plans-invitations-2 | a2-cando-intentions-plans (つもり intro) | つもり (plain-form clause) | a2-family-tsumori-intention |
| plans-invitations-3 | a2-cando-invite-accept-decline | 予定/つもり controlled practice | a1-family-request, a2-family-yotei-plan |
| plans-invitations-4 | a2-cando-arrange-meeting | 予定/つもり transfer | a1-family-schedule-action, a2-family-te-sequence |

**M3 experiences-narratives** (たことがある intro; plain past; kanji 去楽初度有泳登旅):

| Lesson | Primary Can-do | Spiral form(s) | Families |
|--------|----------------|----------------|----------|
| experiences-narratives-1 | a2-cando-experience-takoto (intro) | たことがある | a2-family-takoto-experience |
| experiences-narratives-2 | a2-cando-narrate-order | plain forms transfer; connectors transfer | a2-family-te-sequence, a1-family-adverbial-time-action |
| experiences-narratives-3 | a2-cando-experience-takoto (practice) | たことがある controlled practice | a2-family-takoto-experience, a1-family-description |
| experiences-narratives-4 | a2-cando-ask-experience | question forms over 〜たことがありますか | a2-family-takoto-experience |

**M4 reasons-opinions** (から/ので/と思う intro; kanji 理由考意見気持悪):

| Lesson | Primary Can-do | Spiral form(s) | Families |
|--------|----------------|----------------|----------|
| reasons-opinions-1 | a2-cando-reason-kara (intro) | から | a2-family-kara-reason |
| reasons-opinions-2 | a2-cando-reason-node (intro) | ので | a2-family-node-reason |
| reasons-opinions-3 | a2-cando-opinion-toomou (intro); plain forms practice | と思う; plain forms | a2-family-toomou-opinion |
| reasons-opinions-4 | a2-cando-agree-disagree | connectors practice; から/と思う practice | a2-family-toomou-opinion, a2-family-kara-reason |

- [ ] **Step 8: Populate the Can-do inventory and derive `a2CanDosAuthored` in `canDos.ts` — exact, no placeholder arrays.**

  **8a — The complete 60-lesson primary + supporting inventory (source of truth for every recipe's `primaryCanDoId`/`supportingCanDoIds`).** Every lesson has exactly **one primary** Can-do and **≤2 supporting** Can-dos; every Can-do listed here is served by ≥1 lesson, and (proven in 8c) has transfer evidence.

  | Lesson | Primary Can-do | Supporting (≤2) |
  |--------|----------------|-----------------|
  | connected-conversation-1 | a2-cando-backchannel-followup | — |
  | connected-conversation-2 | a2-cando-connectors | — |
  | connected-conversation-3 | a2-cando-clarify-repeat | — |
  | connected-conversation-4 | a2-cando-recognize-plain-forms | — |
  | plans-invitations-1 | a2-cando-intentions-plans | — |
  | plans-invitations-2 | a2-cando-intentions-plans | a2-cando-recognize-plain-forms |
  | plans-invitations-3 | a2-cando-invite-accept-decline | a2-cando-intentions-plans |
  | plans-invitations-4 | a2-cando-arrange-meeting | a2-cando-intentions-plans |
  | experiences-narratives-1 | a2-cando-experience-takoto | — |
  | experiences-narratives-2 | a2-cando-narrate-order | a2-cando-connectors, a2-cando-recognize-plain-forms |
  | experiences-narratives-3 | a2-cando-experience-takoto | a2-cando-recognize-plain-forms |
  | experiences-narratives-4 | a2-cando-ask-experience | a2-cando-experience-takoto |
  | reasons-opinions-1 | a2-cando-give-reasons | a2-cando-reason-kara |
  | reasons-opinions-2 | a2-cando-reason-node | a2-cando-give-reasons |
  | reasons-opinions-3 | a2-cando-opinion-toomou | a2-cando-recognize-plain-forms |
  | reasons-opinions-4 | a2-cando-agree-disagree | a2-cando-opinion-toomou, a2-cando-connectors |
  | sequencing-ongoing-1 | a2-cando-sequence-te | — |
  | sequencing-ongoing-2 | a2-cando-describe-now | a2-cando-sequence-te |
  | sequencing-ongoing-3 | a2-cando-describe-ongoing | a2-cando-ongoing-teiru |
  | sequencing-ongoing-4 | a2-cando-morning-routine | a2-cando-sequence-te, a2-cando-ongoing-teiru |
  | permission-requests-1 | a2-cando-permission-temoii | — |
  | permission-requests-2 | a2-cando-prohibition-tewaikenai | — |
  | permission-requests-3 | a2-cando-request-tekudasai | a2-cando-permission-temoii |
  | permission-requests-4 | a2-cando-negative-request | a2-cando-prohibition-tewaikenai |
  | neighborhood-services-1 | a2-cando-possibility | a2-cando-permission-temoii |
  | neighborhood-services-2 | a2-cando-can-cannot | a2-cando-possibility |
  | neighborhood-services-3 | a2-cando-ask-directions | — |
  | neighborhood-services-4 | a2-cando-explain-facility | — |
  | restaurant-problems-1 | a2-cando-order-food | — |
  | restaurant-problems-2 | a2-cando-special-request | a2-cando-request-tekudasai, a2-cando-permission-temoii |
  | restaurant-problems-3 | a2-cando-report-problem | — |
  | restaurant-problems-4 | a2-cando-pay-handle-problem | a2-cando-sequence-te |
  | shopping-returns-1 | a2-cando-compare | — |
  | shopping-returns-2 | a2-cando-compare | — |
  | shopping-returns-3 | a2-cando-ask-price-decide | a2-cando-opinion-toomou, a2-cando-possibility |
  | shopping-returns-4 | a2-cando-return-exchange | — |
  | health-advice-1 | a2-cando-describe-symptoms | — |
  | health-advice-2 | a2-cando-advice-tahouga | a2-cando-reason-kara |
  | health-advice-3 | a2-cando-get-better | a2-cando-negative-request |
  | health-advice-4 | a2-cando-clinic-appointment | — |
  | work-study-messages-1 | a2-cando-message-late-absent | a2-cando-reason-kara, a2-cando-reason-node |
  | work-study-messages-2 | a2-cando-ask-colleague | a2-cando-request-tekudasai |
  | work-study-messages-3 | a2-cando-report-progress | a2-cando-ongoing-teiru |
  | work-study-messages-4 | a2-cando-reply-confirm | — |
  | travel-reservations-1 | a2-cando-make-reservation | a2-cando-intentions-plans, a2-cando-possibility |
  | travel-reservations-2 | a2-cando-travel-schedule | a2-cando-experience-takoto, a2-cando-compare |
  | travel-reservations-3 | a2-cando-travel-problem | a2-cando-request-tekudasai, a2-cando-negative-request |
  | travel-reservations-4 | a2-cando-change-cancel | — |
  | relationships-events-1 | a2-cando-family-relations | — |
  | relationships-events-2 | a2-cando-give-receive | — |
  | relationships-events-3 | a2-cando-events-celebrations | a2-cando-ongoing-teiru, a2-cando-experience-takoto |
  | relationships-events-4 | a2-cando-choose-gift | a2-cando-reason-kara |
  | practical-texts-1 | a2-cando-read-schedule | — |
  | practical-texts-2 | a2-cando-read-notice | a2-cando-prohibition-tewaikenai |
  | practical-texts-3 | a2-cando-read-reply-message | a2-cando-opinion-toomou, a2-cando-connectors |
  | practical-texts-4 | a2-cando-fill-form | — |
  | a2-synthesis-1 | a2-cando-scenario-weekend-outing | a2-cando-intentions-plans, a2-cando-connectors |
  | a2-synthesis-2 | a2-cando-scenario-service-shopping | a2-cando-compare, a2-cando-permission-temoii |
  | a2-synthesis-3 | a2-cando-scenario-health-absence | a2-cando-reason-kara, a2-cando-request-tekudasai |
  | a2-synthesis-4 | a2-cando-scenario-trip-recount | a2-cando-experience-takoto, a2-cando-recognize-plain-forms |

  This is 59 distinct Can-dos: 15 grammar (L2), 40 topical, 4 scenario. Two grammar Can-dos (`a2-cando-reason-kara`, `a2-cando-ongoing-teiru`) appear only as supporting/spiral roles; their intro/practice/transfer lessons come from `A2_GRAMMAR_SPIRAL` (§7.1), so they are still served and transferred.

  **8b — The Can-do identity registry (id → domain).** `descriptorCopyId` is `${id}-descriptor` (EN+IT copy authored in Task 1's copy files). Grouped by `CanDoDomain`:

```ts
// src/course/a2/catalog/canDos.ts
import { deepFreeze } from "../../foundations/deepFreeze";
import type { CanDo, CanDoDomain, ContextId, LessonId } from "../../foundations/types";
import { A2_GRAMMAR_SPIRAL } from "../forms/grammarSpiral";
// the 15 module built-lesson arrays (each `readonly A2BuiltLesson[]`)
import { module1Lessons } from "../content/module01ConnectedConversation";
import { module2Lessons } from "../content/module02PlansInvitations";
import { module3Lessons } from "../content/module03ExperiencesNarratives";
import { module4Lessons } from "../content/module04ReasonsOpinions";
import { module5Lessons } from "../content/module05SequencingOngoing";
import { module6Lessons } from "../content/module06PermissionRequests";
import { module7Lessons } from "../content/module07NeighborhoodServices";
import { module8Lessons } from "../content/module08RestaurantProblems";
import { module9Lessons } from "../content/module09ShoppingReturns";
import { module10Lessons } from "../content/module10HealthAdvice";
import { module11Lessons } from "../content/module11WorkStudyMessages";
import { module12Lessons } from "../content/module12TravelReservations";
import { module13Lessons } from "../content/module13RelationshipsEvents";
import { module14Lessons } from "../content/module14PracticalTexts";
import { module15Lessons } from "../content/module15Synthesis";

const CANDO_DOMAINS: Readonly<Record<CanDoDomain, readonly string[]>> = {
  listening: ["a2-cando-recognize-plain-forms"],
  reading: ["a2-cando-read-schedule", "a2-cando-read-notice", "a2-cando-read-reply-message"],
  writing: [
    "a2-cando-message-late-absent", "a2-cando-ask-colleague", "a2-cando-report-progress",
    "a2-cando-reply-confirm", "a2-cando-fill-form",
  ],
  "spoken-production": [
    "a2-cando-sequence-te", "a2-cando-ongoing-teiru", "a2-cando-intentions-plans",
    "a2-cando-opinion-toomou", "a2-cando-compare", "a2-cando-connectors",
    "a2-cando-narrate-order", "a2-cando-give-reasons", "a2-cando-describe-now",
    "a2-cando-describe-ongoing", "a2-cando-morning-routine", "a2-cando-can-cannot",
    "a2-cando-explain-facility", "a2-cando-describe-symptoms", "a2-cando-family-relations",
    "a2-cando-give-receive", "a2-cando-events-celebrations", "a2-cando-scenario-trip-recount",
  ],
  interaction: [
    "a2-cando-request-tekudasai", "a2-cando-permission-temoii", "a2-cando-prohibition-tewaikenai",
    "a2-cando-negative-request", "a2-cando-experience-takoto", "a2-cando-reason-kara",
    "a2-cando-reason-node", "a2-cando-possibility", "a2-cando-backchannel-followup",
    "a2-cando-clarify-repeat", "a2-cando-invite-accept-decline", "a2-cando-arrange-meeting",
    "a2-cando-ask-experience", "a2-cando-agree-disagree", "a2-cando-ask-directions",
    "a2-cando-order-food", "a2-cando-special-request", "a2-cando-report-problem",
    "a2-cando-pay-handle-problem", "a2-cando-ask-price-decide", "a2-cando-return-exchange",
    "a2-cando-advice-tahouga", "a2-cando-get-better", "a2-cando-clinic-appointment",
    "a2-cando-make-reservation", "a2-cando-travel-schedule", "a2-cando-travel-problem",
    "a2-cando-change-cancel", "a2-cando-choose-gift", "a2-cando-scenario-weekend-outing",
    "a2-cando-scenario-service-shopping", "a2-cando-scenario-health-absence",
  ],
};

/** id → domain, inverted from the registry above (one authoritative source). */
const DOMAIN_BY_CANDO: ReadonlyMap<string, CanDoDomain> = new Map(
  (Object.entries(CANDO_DOMAINS) as [CanDoDomain, readonly string[]][])
    .flatMap(([domain, ids]) => ids.map((id) => [id, domain] as const)),
);
```

  **8c — Derive `A2_CANDO_LESSONS` from the two sources of truth (spiral ∪ recipes) and build the frozen Can-dos.** Grammar Can-dos take their canonical lessons from `A2_GRAMMAR_SPIRAL`; every Can-do additionally accretes each lesson whose recipe names it primary or supporting. This makes the map derived (never hand-drifted) and guarantees each Can-do's `lessonIds` is complete:

```ts
const ALL_A2_LESSONS = [
  ...module1Lessons, ...module2Lessons, ...module3Lessons, ...module4Lessons,
  ...module5Lessons, ...module6Lessons, ...module7Lessons, ...module8Lessons,
  ...module9Lessons, ...module10Lessons, ...module11Lessons, ...module12Lessons,
  ...module13Lessons, ...module14Lessons, ...module15Lessons,
] as const;

function addLesson(map: Map<string, LessonId[]>, canDoId: string, lessonId: LessonId): void {
  const list = map.get(canDoId) ?? [];
  if (!list.includes(lessonId)) list.push(lessonId);
  map.set(canDoId, list);
}

/** Can-do → the lessons that serve it (spiral roles first, then recipe roles). */
export const A2_CANDO_LESSONS: ReadonlyMap<string, readonly LessonId[]> = (() => {
  const map = new Map<string, LessonId[]>();
  for (const f of A2_GRAMMAR_SPIRAL) {
    for (const id of [f.introLessonId, f.controlledPracticeLessonId, f.transferLessonId, ...f.recurrenceLessonIds]) {
      addLesson(map, f.canDoId, id);
    }
  }
  for (const b of ALL_A2_LESSONS) {
    addLesson(map, b.recipe.primaryCanDoId, b.recipe.id);
    for (const s of b.recipe.supportingCanDoIds) addLesson(map, s, b.recipe.id);
  }
  return map;
})();

/** contextIds are computed from the variants those lessons actually teach. */
function contextsFor(lessonIds: readonly LessonId[]): readonly ContextId[] {
  const seen = new Set<ContextId>();
  for (const b of ALL_A2_LESSONS) {
    if (!lessonIds.includes(b.recipe.id)) continue;
    for (const v of b.variants) if (v.contextId) seen.add(v.contextId);
  }
  return [...seen];
}

export const a2CanDosAuthored: readonly CanDo[] = deepFreeze(
  [...DOMAIN_BY_CANDO.keys()].map((id): CanDo => {
    const lessonIds = A2_CANDO_LESSONS.get(id) ?? [];
    const domain = DOMAIN_BY_CANDO.get(id);
    if (!domain) throw new Error(`a2 Can-do "${id}" has no domain`);
    if (lessonIds.length === 0) throw new Error(`a2 Can-do "${id}" is served by no lesson`);
    return {
      id, level: "a2", domain,
      descriptorCopyId: `${id}-descriptor`,
      contextIds: contextsFor(lessonIds),
      lessonIds,
      checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 },
      sourceNote: "product-authored-jf-cefr-aligned",
    };
  }),
);

export const a2CanDoById: ReadonlyMap<string, CanDo> = new Map(
  a2CanDosAuthored.map((c) => [c.id, c]),
);

/** The 55 module (non-scenario) outcome ids, catalogue order. */
export const A2_MODULE_CANDO_IDS: readonly string[] = Object.freeze(
  a2CanDosAuthored.map((c) => c.id).filter((id) => !id.startsWith("a2-cando-scenario-")),
);

/** The 4 capstone-scenario outcome ids, catalogue order. */
export const A2_SCENARIO_CANDO_IDS: readonly string[] = Object.freeze([
  "a2-cando-scenario-weekend-outing",
  "a2-cando-scenario-service-shopping",
  "a2-cando-scenario-health-absence",
  "a2-cando-scenario-trip-recount",
]);
```

  The release validator (Task 7) proves coverage from `a2CanDosAuthored`; `data/course.ts` + `CourseHome.tsx` (Task 8) source objective/summary copy from `a2CanDoById`. Task 1's `buildA2Level(a2CanDosAuthored.map((c) => c.id))` now receives the real id list.

- [ ] **Step 9: Run the M1–M4 tests + foundation validation + no-Japanese lint + typecheck.**

Run: `npx vitest run src/course/a2/content/module01ConnectedConversation.test.ts src/course/a2/content/module02PlansInvitations.test.ts src/course/a2/content/module03ExperiencesNarratives.test.ts src/course/a2/content/module04ReasonsOpinions.test.ts src/course/a2/content/noJapaneseLint.test.ts && npx tsc --noEmit`
Expected: PASS + clean. Each module test asserts the depth floors and `validateFoundations(...).valid === true`.

- [ ] **Step 10: Commit.**

```bash
git add src/course/a2/catalog/ src/course/a2/content/module0{1,2,3,4}*.ts \
  src/course/a2/content/module0{1,2,3,4}*.test.ts \
  src/course/a2/content/noJapaneseLint.test.ts scripts/lintA2NoJapanese.ts
git commit -m "feat(a2): authoring helpers, semantic catalog, no-Japanese lint, content M1–M4"
```

- [ ] **Step 11: Subagent quality review.** Dispatch: "Review Task 4 against spec §9–§12 and plan L1/L2/L3. For each of the 16 M1–M4 lessons confirm: 8–12 models, ≥3 predicates, ≥3 roles, ≥2 contexts, ≥5 unique targets, reuse ≤2, ≥2 transfers (≥1 controlled-production), dialogue present for conversational Can-dos; the spiral forms introduced match L2's intro lessons; kanji first-supported exposures match L3; and NO Japanese appears in any module file (lint green). File inline findings." Fix before Task 5.

---
## Task 5: Content M5–M8 — sequencing-ongoing, permission-requests, neighborhood-services, restaurant-problems

Authors 16 lessons with `buildA2InstructionalLesson` (Task 4 Step 5) and the shared semantic catalog (Task 4 Step 3), introducing the te-form/ている/permission/prohibition/request/possibility spiral forms and their kanji (L3 M5–M8). Same depth contract as Task 4.

**Files:**
- Create: `src/course/a2/content/module05SequencingOngoing.ts` (+ `.test.ts`)
- Create: `src/course/a2/content/module06PermissionRequests.ts` (+ `.test.ts`)
- Create: `src/course/a2/content/module07NeighborhoodServices.ts` (+ `.test.ts`)
- Create: `src/course/a2/content/module08RestaurantProblems.ts` (+ `.test.ts`)
- Modify: `src/course/a2/catalog/a2SemanticCatalog.ts` (add senses/values/contexts for M5–M8), `src/course/a2/catalog/canDos.ts` (add M5–M8 Can-do→lesson entries)
- Reference (read): Task 4 files, plan L1/L2/L3.

- [ ] **Step 1: Fresh spec re-read.** Re-read §7.1 (te-form, ている, てもいい/てはいけない/てください/ないでください, possibility), §9.1 depth floors. Confirm the M5–M8 rows of L2 and L3.

- [ ] **Step 2: Author M5–M8** via the Task 4 builder, one `buildA2InstructionalLesson` call per lesson, using these contract tables (every lesson: 8–12 models, ≥3 predicates, ≥3 roles, ≥2 contexts, 8–12 exercises, ≥5 unique targets, reuse ≤2, ≥2 transfers, ≥1 controlled-production):

**M5 sequencing-ongoing** (kanji 起寝使作洗終始働):

| Lesson | Primary Can-do | Spiral form (role per L2) | Families |
|--------|----------------|---------------------------|----------|
| sequencing-ongoing-1 | a2-cando-sequence-te (intro) | て-form intro | a2-family-te-sequence |
| sequencing-ongoing-2 | a2-cando-describe-now | て-form controlled practice | a2-family-te-sequence, a1-family-object-action |
| sequencing-ongoing-3 | a2-cando-ongoing-teiru (intro) | ている intro | a2-family-teiru-ongoing |
| sequencing-ongoing-4 | a2-cando-morning-routine | て-form transfer; ている controlled practice | a2-family-te-sequence, a2-family-teiru-ongoing |

**M6 permission-requests** (kanji 入口出止禁消座立):

| Lesson | Primary Can-do | Spiral form | Families |
|--------|----------------|-------------|----------|
| permission-requests-1 | a2-cando-permission-temoii (intro) | てもいい intro | a2-family-temoii-permission |
| permission-requests-2 | a2-cando-prohibition-tewaikenai (intro) | てはいけない intro | a2-family-tewaikenai-prohibition |
| permission-requests-3 | a2-cando-request-tekudasai (intro) | てください intro; てもいい practice | a2-family-tekudasai-request |
| permission-requests-4 | a2-cando-negative-request (intro) | ないでください intro; てはいけない practice | a2-family-naidekudasai-negreq |

**M7 neighborhood-services** (kanji 病院銀行局便図館):

| Lesson | Primary Can-do | Spiral form | Families |
|--------|----------------|-------------|----------|
| neighborhood-services-1 | a2-cando-possibility (intro); てもいい transfer | possibility intro | a2-family-dekiru-possibility, a2-family-temoii-permission |
| neighborhood-services-2 | a2-cando-can-cannot | possibility controlled practice | a2-family-dekiru-possibility |
| neighborhood-services-3 | a2-cando-ask-directions | request practice | a1-family-direction-action, a2-family-tekudasai-request |
| neighborhood-services-4 | a2-cando-explain-facility | ている recurrence (hours/state) | a2-family-teiru-ongoing, a1-family-existence |

**M8 restaurant-problems** (kanji 食飲飯茶肉魚熱冷):

| Lesson | Primary Can-do | Spiral form | Families |
|--------|----------------|-------------|----------|
| restaurant-problems-1 | a2-cando-order-food | plain forms/description | a1-family-object-action |
| restaurant-problems-2 | a2-cando-special-request | てください practice; てもいい recurrence | a2-family-tekudasai-request, a2-family-temoii-permission |
| restaurant-problems-3 | a2-cando-report-problem | plain forms/description | a1-family-description, a2-family-kara-reason |
| restaurant-problems-4 | a2-cando-pay-handle-problem | て-form recurrence | a2-family-te-sequence |

- [ ] **Step 3: Extend `a2SemanticCatalog.ts` and `canDos.ts`** with the M5–M8 senses/values/contexts and Can-do→lesson entries. Reuse A1 verb senses (食べる/飲む/行く etc.) by importing from `a1SemanticCatalog.ts`; add only new A2 senses.

- [ ] **Step 4: Run the four module tests + foundation validation + lint + typecheck.**

Run: `npx vitest run src/course/a2/content/module0{5,6,7,8}*.test.ts src/course/a2/content/noJapaneseLint.test.ts && npx tsc --noEmit`
Expected: PASS + clean (each test asserts depth floors and `validateFoundations(...).valid === true`, with `availableContentByLesson` including M1–M4 so cross-module forms/kanji introduced earlier are available).

- [ ] **Step 5: Commit.**

```bash
git add src/course/a2/content/module0{5,6,7,8}*.ts \
  src/course/a2/content/module0{5,6,7,8}*.test.ts \
  src/course/a2/catalog/a2SemanticCatalog.ts src/course/a2/catalog/canDos.ts
git commit -m "feat(a2): content M5–M8 (te-form, teiru, permission/prohibition/requests, possibility)"
```

- [ ] **Step 6: Subagent quality review.** Dispatch: "Review Task 5 (M5–M8) against §9 depth floors and L2/L3. Confirm each of the 16 lessons meets all floors, the spiral roles match L2 (te-form intro=sequencing-ongoing-1, ている intro=sequencing-ongoing-3, てもいい/てはいけない/てください/ないでください intros in permission-requests-1..4, possibility intro=neighborhood-services-1), kanji first-supported/revealable/assessed match L3, cross-module introduction-before-use holds, and no Japanese in module files. File inline findings." Fix before Task 6.

---

## Task 6: Content M9–M12 — shopping-returns, health-advice, work-study-messages, travel-reservations

Authors 16 lessons introducing comparisons/advice/reason-recurrence/experience-transfer spiral roles and the L3 M9–M12 kanji. Same builder and contract as Tasks 4–5.

**Files:**
- Create: `src/course/a2/content/module09ShoppingReturns.ts` (+ `.test.ts`)
- Create: `src/course/a2/content/module10HealthAdvice.ts` (+ `.test.ts`)
- Create: `src/course/a2/content/module11WorkStudyMessages.ts` (+ `.test.ts`)
- Create: `src/course/a2/content/module12TravelReservations.ts` (+ `.test.ts`)
- Modify: `src/course/a2/catalog/a2SemanticCatalog.ts`, `src/course/a2/catalog/canDos.ts`
- Reference (read): Task 4 files, plan L1/L2/L3.

- [ ] **Step 1: Fresh spec re-read.** Re-read §7.1 (comparisons, から/ので recurrence, たことがある transfer, ている transfer), §9.1. Confirm M9–M12 rows of L2/L3. Note the `〜たほうがいい` advice pattern (M10) is an A2 content phrase realized via `a2-family-nohouga-comparison`-adjacent advice family — author `a2-family-tahouga-advice` if the shared realizer needs it; it is NOT one of the 15 spiral forms (it is supporting content), so it does not enter the grammar-spiral validator.

- [ ] **Step 2: Author M9–M12** via the Task 4 builder with these contract tables (all depth floors as before):

**M9 shopping-returns** (kanji 買店円番千万安高):

| Lesson | Primary Can-do | Spiral form (role per L2) | Families |
|--------|----------------|---------------------------|----------|
| shopping-returns-1 | a2-cando-compare (intro のほうが/より) | comparison intro | a2-family-nohouga-comparison |
| shopping-returns-2 | a2-cando-compare (intro いちばん) | superlative intro | a2-family-ichiban-superlative |
| shopping-returns-3 | a2-cando-ask-price-decide | comparison practice; と思う transfer; possibility transfer | a2-family-nohouga-comparison, a2-family-toomou-opinion, a2-family-dekiru-possibility |
| shopping-returns-4 | a2-cando-return-exchange | から/ので recurrence | a2-family-kara-reason, a1-family-object-action |

**M10 health-advice** (kanji 医者薬体頭痛元休):

| Lesson | Primary Can-do | Spiral form | Families |
|--------|----------------|-------------|----------|
| health-advice-1 | a2-cando-describe-symptoms | description/existence | a1-family-description, a1-family-existence |
| health-advice-2 | a2-cando-advice-tahouga; から transfer | から transfer | a2-family-tahouga-advice, a2-family-kara-reason |
| health-advice-3 | a2-cando-get-better; negative-request transfer | ないでください transfer | a2-family-naidekudasai-negreq, a2-family-tahouga-advice |
| health-advice-4 | a2-cando-clinic-appointment | ので recurrence; request recurrence | a2-family-node-reason, a2-family-tekudasai-request |

**M11 work-study-messages** (kanji 社仕事教学校先生):

| Lesson | Primary Can-do | Spiral form | Families |
|--------|----------------|-------------|----------|
| work-study-messages-1 | a2-cando-message-late-absent | から recurrence; ので controlled practice | a2-family-kara-reason, a2-family-node-reason |
| work-study-messages-2 | a2-cando-ask-colleague; てください transfer | てください transfer | a2-family-tekudasai-request |
| work-study-messages-3 | a2-cando-report-progress; ている transfer | ている transfer | a2-family-teiru-ongoing |
| work-study-messages-4 | a2-cando-reply-confirm | plain-form/opinion recurrence | a2-family-toomou-opinion, a2-family-te-sequence |

**M12 travel-reservations** (kanji 空港駅電車着発泊):

| Lesson | Primary Can-do | Spiral form | Families |
|--------|----------------|-------------|----------|
| travel-reservations-1 | a2-cando-make-reservation; 予定 recurrence; possibility recurrence | plans recurrence | a2-family-yotei-plan, a2-family-dekiru-possibility |
| travel-reservations-2 | a2-cando-travel-schedule; たことがある transfer; comparison transfer | experience transfer; comparison transfer | a2-family-takoto-experience, a2-family-nohouga-comparison |
| travel-reservations-3 | a2-cando-travel-problem; negative-request transfer; ので transfer | negative-request + ので transfer | a2-family-naidekudasai-negreq, a2-family-node-reason |
| travel-reservations-4 | a2-cando-change-cancel | て-form/request recurrence | a2-family-te-sequence, a2-family-tekudasai-request |

- [ ] **Step 3: Extend `a2SemanticCatalog.ts` + `canDos.ts`** for M9–M12 (add `a2-family-tahouga-advice` and its rule to the semantic catalog + realizer if not already present; reuse A1 senses for 買う/行く/etc.).

- [ ] **Step 4: Run tests + foundation validation + lint + typecheck.**

Run: `npx vitest run src/course/a2/content/module{09,10,11,12}*.test.ts src/course/a2/content/noJapaneseLint.test.ts && npx tsc --noEmit`
Expected: PASS + clean.

- [ ] **Step 5: Commit.**

```bash
git add src/course/a2/content/module{09,10,11,12}*.ts \
  src/course/a2/content/module{09,10,11,12}*.test.ts \
  src/course/a2/catalog/a2SemanticCatalog.ts src/course/a2/catalog/canDos.ts
git commit -m "feat(a2): content M9–M12 (comparisons, advice, work/study messages, travel)"
```

- [ ] **Step 6: Subagent quality review.** Dispatch: "Review Task 6 (M9–M12) against §9 and L2/L3. Confirm depth floors, spiral transfer/recurrence roles land in the exact L2 lessons (comparison intro=shopping-returns-1/2, comparison transfer=travel-reservations-2, たことがある transfer=travel-reservations-2, ている transfer=work-study-messages-3, negative-request transfer=travel-reservations-3, から transfer=health-advice-2), kanji stages match L3, and no Japanese in module files. File inline findings." Fix before Task 7.

---
## Task 7: Content M13–M15, A2 checkpoint, machine-readable reports, and the `validateA2Release` gate

Authors the final 12 lessons (relationships-events, practical-texts, a2-synthesis), assembles the A2 level/modules/checkpoint catalog, builds the byLesson/byModule/byLevel + grammar + kanji reports (§16.3), and composes the full release validator run at `prebuild`. The synthesis module introduces **no new** family/sense/value/kanji (§7, capstone rule); the A2 checkpoint is separate from A1 and makes an alignment (never certification) claim.

**Files:**
- Create: `src/course/a2/content/module13RelationshipsEvents.ts` (+ `.test.ts`)
- Create: `src/course/a2/content/module14PracticalTexts.ts` (+ `.test.ts`)
- Create: `src/course/a2/content/module15Synthesis.ts` (+ `.test.ts`)
- Create: `src/course/a2/catalog/checkpoint.ts` (`a2Checkpoint`, `a2Modules`, wires `a2Level`)
- Create: `src/course/a2/catalog/catalog.ts` (deep-frozen assembled `FoundationCatalogs` for A2 + `A2_AVAILABLE_CONTENT_BY_LESSON`)
- Create: `src/course/a2/catalog/reports.ts` (`buildA2Reports`, `a2ReportMarkdown`, `A2CoverageReports`)
- Create: `src/course/a2/catalog/validateA2.ts` (`validateA2`, `validateA2Release`)
- Create: `src/course/a2/catalog/validateA2.test.ts`, `src/course/a2/catalog/reports.test.ts`
- Create: `scripts/validateA2Release.ts`
- Modify: `package.json` (extend `prebuild` to run the A2 gate too)
- Reference (read): `src/course/a1/catalog/checkpoint.ts`, `src/course/a1/catalog/catalog.ts`, `src/course/a1/catalog/reports.ts`, `src/course/a1/catalog/validateA1.ts`, `scripts/validateA1Release.ts`, spec §16, §22 exit criteria.

- [ ] **Step 1: Fresh spec re-read.** Re-read §7 (synthesis module), §8 (Can-do/checkpoint), §16 (validators + reports), §20 (no certification claim), §22 exit criteria. Confirm the checkpoint must be truthful and separate from A1.

- [ ] **Step 2: Author M13–M15** via the Task 4 builder. M13/M14 are instructional; M15 is synthesis (reuses only already-introduced families/senses/values/kanji). Contract tables:

**M13 relationships-events** (kanji 母父家族結婚誕送; giving/receiving):

| Lesson | Primary Can-do | Spiral form (role per L2) | Families |
|--------|----------------|---------------------------|----------|
| relationships-events-1 | a2-cando-family-relations | description/existence | a1-family-description, a1-family-existence |
| relationships-events-2 | a2-cando-give-receive | あげる/もらう | a2-family-morau-ageru |
| relationships-events-3 | a2-cando-events-celebrations; ている recurrence; たことがある recurrence | ている + たことがある recurrence | a2-family-teiru-ongoing, a2-family-takoto-experience |
| relationships-events-4 | a2-cando-choose-gift | reason/opinion recurrence | a2-family-kara-reason, a2-family-morau-ageru |

**M14 practical-texts** (kanji 時間分半料金開閉; reading tasks — practical text required per §9.1):

| Lesson | Primary Can-do | Spiral form | Families / text |
|--------|----------------|-------------|-----------------|
| practical-texts-1 | a2-cando-read-schedule | time/schedule reading | a1-family-schedule-action + practical timetable text |
| practical-texts-2 | a2-cando-read-notice; てはいけない transfer | prohibition transfer | a2-family-tewaikenai-prohibition + notice/sign text |
| practical-texts-3 | a2-cando-read-reply-message; と思う recurrence; connectors recurrence | opinion + connectors recurrence | a2-family-toomou-opinion + message text |
| practical-texts-4 | a2-cando-fill-form | numbers/times reading+choice | a1-family-quantified-action + form text |

**M15 a2-synthesis** (kanji 今日本毎年来月山; four integrating scenarios; NO new families/senses/values):

| Lesson | Scenario Can-do | Integrates (recurrence only) |
|--------|-----------------|------------------------------|
| a2-synthesis-1 | a2-cando-scenario-weekend-outing | 予定/つもり, connectors, から, plain forms |
| a2-synthesis-2 | a2-cando-scenario-service-shopping | comparison, possibility, てもいい/てはいけない, と思う, ている |
| a2-synthesis-3 | a2-cando-scenario-health-absence | advice, から/ので, てください/ないでください, て-form |
| a2-synthesis-4 | a2-cando-scenario-trip-recount (A2 checkpoint scenario) | たことがある, plain forms, practical-text reading |

> M15 lessons pass `introducedSenseIds: []` / `introducedConceptIds: []` to the builder; the release validator's `synthesis-introduces-new` check fails if any M15 lesson introduces a family/sense/value/kanji not already available before M15.

- [ ] **Step 3: Write `src/course/a2/catalog/checkpoint.ts`** — assemble `a2Modules`, the synthesis-integration map, and the `a2Checkpoint` (samples **every** module + scenario Can-do; the 4 synthesis scenarios collectively carry the checkpoint transfer for all 14 instructional modules).

```ts
import { deepFreeze } from "../../foundations/deepFreeze";
import type { CheckpointDefinition, FoundationModule, LessonId, ModuleId } from "../../foundations/types";
import { A2_LEVEL_ID } from "./level";
import { A2_MODULE_IDS, A2_LESSON_IDS_BY_MODULE } from "../manifest";
import { a2CanDosAuthored, A2_MODULE_CANDO_IDS, A2_SCENARIO_CANDO_IDS } from "./canDos";

/** A module's Can-dos = every authored Can-do served by one of its lessons. */
function canDoIdsForModule(moduleId: ModuleId): readonly string[] {
  const lessons = new Set<LessonId>(A2_LESSON_IDS_BY_MODULE[moduleId]);
  return a2CanDosAuthored
    .filter((c) => c.lessonIds.some((id) => lessons.has(id)))
    .map((c) => c.id);
}

export const a2Modules: readonly FoundationModule[] = deepFreeze(
  A2_MODULE_IDS.map((moduleId, index): FoundationModule => ({
    id: moduleId,
    level: A2_LEVEL_ID,
    order: index + 1,
    canDoIds: canDoIdsForModule(moduleId),
    lessonIds: [...A2_LESSON_IDS_BY_MODULE[moduleId]],
  })),
);

/**
 * How each capstone scenario integrates the 14 instructional modules (§7). The
 * union of these lists is exactly the 14 instructional module ids — proven by
 * `checkpoint-module-coverage` — so sampling the 4 scenario Can-dos exercises
 * transfer from every instructional module through the synthesis lessons.
 */
export const A2_SYNTHESIS_INTEGRATION: Readonly<Record<string, readonly ModuleId[]>> = {
  "a2-cando-scenario-weekend-outing": ["connected-conversation", "plans-invitations", "reasons-opinions", "relationships-events"],
  "a2-cando-scenario-service-shopping": ["permission-requests", "neighborhood-services", "restaurant-problems", "shopping-returns"],
  "a2-cando-scenario-health-absence": ["sequencing-ongoing", "permission-requests", "health-advice", "work-study-messages"],
  "a2-cando-scenario-trip-recount": ["experiences-narratives", "travel-reservations", "practical-texts"],
};

/** Learner must accept 3 transfer targets per sampled Can-do (matches each
 * Can-do's own `checkpointEvidenceRule.minAcceptedTransferTargets`; satisfiable
 * because every serving lesson authors ≥5 transfer exercises). */
export const A2_CHECKPOINT_MIN_TRANSFER_TARGETS = 3;

/**
 * The A2 checkpoint (§8/§17). Separate from A1. Samples **all** module and
 * scenario Can-dos (mirroring A1 — no "representative" subset), and requires
 * accepted transfer evidence per Can-do. It states a JF/CEFR-A2 *alignment*,
 * never a certification (§20); the copy key `a2-checkpoint-claim` must not
 * contain "certificate"/equivalent (enforced by `checkpoint-claims-certification`).
 */
export const a2Checkpoint: CheckpointDefinition = deepFreeze({
  id: "a2-checkpoint",
  level: "a2",
  sampledCanDoIds: [...A2_MODULE_CANDO_IDS, ...A2_SCENARIO_CANDO_IDS],
  minAcceptedTransferTargetsPerCanDo: A2_CHECKPOINT_MIN_TRANSFER_TARGETS,
});
```

- [ ] **Step 4: Write `src/course/a2/catalog/catalog.ts`** — the deep-frozen assembled `FoundationCatalogs` for A2 plus `A2_AVAILABLE_CONTENT_BY_LESSON` (built from canonical order so `validateFoundations` gates introduction-before-use). Mirror `a1/catalog/catalog.ts`. Export `a2FoundationCatalogs`.

- [ ] **Step 5: Write the failing reports test**, then `reports.ts`. Reports mirror `A1CoverageReports` and add grammar + kanji sections (§16.3).

```ts
// src/course/a2/catalog/reports.test.ts
import { describe, it, expect } from "vitest";
import { buildA2Reports } from "./reports";

describe("A2 coverage reports", () => {
  const reports = buildA2Reports();
  it("reports all 60 lessons and 15 modules and 1 level", () => {
    expect(Object.keys(reports.byLesson)).toHaveLength(60);
    expect(Object.keys(reports.byModule)).toHaveLength(15);
    expect(Object.keys(reports.byLevel)).toEqual(["a2"]);
  });
  it("reports per-lesson unique targets, reuse, predicates, roles, contexts", () => {
    const r = reports.byLesson["connected-conversation-1"];
    expect(r.uniqueTargets).toBeGreaterThanOrEqual(5);
    expect(r.maxTargetReuse).toBeLessThanOrEqual(2);
    expect(r.predicateCount).toBeGreaterThanOrEqual(3);
    expect(r.roleCount).toBeGreaterThanOrEqual(3);
    expect(r.contextCount).toBeGreaterThanOrEqual(2);
  });
  it("reports grammar-spiral roles and kanji exposure stages", () => {
    expect(reports.grammar.find((g) => g.id === "ongoing-teiru")?.introLessonId)
      .toBe("sequencing-ongoing-3");
    expect(reports.kanji.totalGlyphs).toBe(120);
    expect(reports.kanji.byModule["connected-conversation"]).toBe(8);
  });
});
```

`reports.ts` computes these from the assembled `a2FoundationCatalogs`, `A2_GRAMMAR_SPIRAL`, and the kanji catalog. `a2ReportMarkdown()` renders reviewable tables (a build artifact; not committed unless §16.3's "small stable summary" is chosen — it is not for this release).

- [ ] **Step 6: Write the failing release-validator test**, then `validateA2.ts`. `validateA2Release()` composes every gate over the frozen catalogs and returns `{ valid, errors, reports }` with `A2ReleaseErrorCode`s (Task 1 types).

```ts
// src/course/a2/catalog/validateA2.test.ts
import { describe, it, expect } from "vitest";
import { validateA2Release } from "./validateA2";

describe("validateA2Release", () => {
  const result = validateA2Release();
  it("reports the frozen A2 release catalog as content-valid", () => {
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
  it("produces coverage reports alongside validation", () => {
    expect(Object.keys(result.reports.byLesson)).toHaveLength(60);
  });
});
```

`validateA2Release()` must run, in stable order:
1. `validateA2ManifestSpec(A2_MANIFEST_SPEC)` → module/lesson counts, route count = 60.
2. `validateFoundations({ catalogs: a2FoundationCatalogs, availableContentByLesson: A2_AVAILABLE_CONTENT_BY_LESSON, ... })` → all depth/transfer/recurrence/introduction/answer-derivation/uniqueness codes (`foundation-invalid` wraps any).
3. `validateA2GrammarSpiral(A2_GRAMMAR_SPIRAL, A2_CANONICAL_POSITIONS)` → the six grammar codes.
4. `validateA2Kanji({ entries: A2_KANJI_ENTRIES, exposures: A2_KANJI_EXPOSURES, readings: A2_KANJI_READINGS, positions: A2_CANONICAL_POSITIONS, synthesisLessonIds: A2_SYNTHESIS_LESSON_IDS, countByModule: a2KanjiCountByModule(), expectedCount: 120, expectedByModule: A2_KANJI_DISTRIBUTION })` → kanji codes; this includes the **`kanji-distribution-sum`** check (each module's count equals `A2_KANJI_DISTRIBUTION[module]` and the total is 120), the strict four-stage **`kanji-exposure-order`** check, the **`kanji-synthesis-first-exposure`** check (no glyph first-supported at any `a2-synthesis-*` lesson), and the **romaji-bypass** check (for every `assessed` exposure, assert `a2KanjiAssistancePolicy.supportFor(e, "choose").romaji === "not-shown"`, else `kanji-romaji-bypass`).
5. Can-do coverage + transfer evidence (over `a2CanDosAuthored`, `a2Checkpoint`, `A2_SYNTHESIS_INTEGRATION`):
   - every authored Can-do is served by ≥1 lesson **whose recipe includes a transfer exercise** (round-two constrained-construction/completion), else `cando-untransferred`;
   - every checkpoint-sampled Can-do resolves to an authored Can-do (`cando-not-sampled`) and has ≥`minAcceptedTransferTargetsPerCanDo` authored transfer targets across its serving lessons (`checkpoint-min-transfer`) — count transfer-exercise target variants over `A2_CANDO_LESSONS.get(id)`;
   - the union of `A2_SYNTHESIS_INTEGRATION` values equals the 14 instructional module ids exactly (no missing, no synthesis self-reference), else `checkpoint-module-coverage`:

```ts
const INSTRUCTIONAL = A2_MODULE_IDS.filter((m) => m !== A2_MANIFEST_SPEC.synthesisModuleId);
const covered = new Set(Object.values(A2_SYNTHESIS_INTEGRATION).flat());
for (const m of INSTRUCTIONAL) {
  if (!covered.has(m)) errors.push({ code: "checkpoint-module-coverage", id: m });
}
for (const m of covered) {
  if (!INSTRUCTIONAL.includes(m)) errors.push({ code: "checkpoint-module-coverage", id: m });
}
```
6. Synthesis-no-new-content: M15 lessons introduce nothing new (`synthesis-introduces-new`).
7. Copy parity: EN/IT key + semantic parity, and no Japanese in copy values (`copy-parity`, `copy-contains-japanese`); personal-alias normalized-match check (`personal-alias-match`).
8. Checkpoint truthfulness: `a2-checkpoint-claim` copy makes no certification claim (`checkpoint-claims-certification`).

Return `errors` in the fixed stage order above so output is deterministic.

- [ ] **Step 7: Run the reports + validator tests, see them pass.**

Run: `npx vitest run src/course/a2/catalog/reports.test.ts src/course/a2/catalog/validateA2.test.ts && npx tsc --noEmit`
Expected: PASS + clean. If `validateA2Release()` reports errors, fix the offending *content* (do not weaken the validator).

- [ ] **Step 8: Write `scripts/validateA2Release.ts`** (mirror `scripts/validateA1Release.ts`):

```ts
import { validateA2Release } from "../src/course/a2/catalog/validateA2";

const result = validateA2Release();
if (!result.valid) {
  console.error(
    `validateA2Release: refusing to build — ${result.errors.length} content error(s) in the A2 release catalog:`,
  );
  for (const error of result.errors) {
    const parts = [error.code];
    if (error.id) parts.push(`id=${error.id}`);
    console.error(`  - ${parts.join(" ")}`);
  }
  process.exit(1);
}
console.log(`validateA2Release: OK — the A2 release catalog is content-valid (0 errors).`);
```

- [ ] **Step 9: Wire the prebuild gate.** In `package.json`, change `prebuild` so both level gates run (A1 unchanged, A2 added), and add the no-Japanese lint:

```json
"prebuild": "vite-node scripts/validateA1Release.ts && vite-node scripts/validateA2Release.ts && vite-node scripts/lintA2NoJapanese.ts",
```

- [ ] **Step 10: Run the full prebuild + build.**

Run: `npm run prebuild && GITHUB_PAGES=true npm run build`
Expected: both validators print `OK`, lint prints no offenders, `tsc --noEmit` clean, `vite build` succeeds with base `/nihongo-practice/`.

- [ ] **Step 11: Commit.**

```bash
git add src/course/a2/content/module1{3,4,5}*.ts src/course/a2/content/module1{3,4,5}*.test.ts \
  src/course/a2/catalog/checkpoint.ts src/course/a2/catalog/catalog.ts \
  src/course/a2/catalog/reports.ts src/course/a2/catalog/reports.test.ts \
  src/course/a2/catalog/validateA2.ts src/course/a2/catalog/validateA2.test.ts \
  scripts/validateA2Release.ts package.json
git commit -m "feat(a2): content M13–M15, checkpoint, coverage reports, release gate + prebuild wiring"
```

- [ ] **Step 12: Subagent quality review.** Dispatch: "Review Task 7 against §7/§8/§16/§20/§22. Confirm: M15 introduces no new content (synthesis rule), the A2 checkpoint is separate from A1 and makes an alignment—not certification—claim, `validateA2Release()` composes all eight stages and returns zero errors over the frozen catalogs, reports cover 60 lessons/15 modules/1 level with per-lesson actual coverage (not just totals), the kanji distribution sums to 120, and the prebuild runs both level gates + the no-Japanese lint. File inline findings." Fix before Task 8.

---
## Task 8: Runtime — level selector, A2 lesson page, progress/review, speech truthfulness, kanji UI

Makes A2 inspectable and directly routable in the browser while keeping A1 URLs stable and never hard-locking A2. Adds a URL-reflected level dimension (back/forward safe), derives the A2 runtime course from the frozen catalog (fail-closed), wires the A2 lesson experience including the kanji ruby/reveal/assessment UI and no-romaji-bypass, and integrates the already-level-aware V4 progress + separate A2 checkpoint. **No destructive progress migration** — V4 is already level-aware (`CourseProgressV4.levels.{a1,a2}`); A1 evidence is untouched.

**Files:**
- Modify: `src/routing/routePaths.ts` (add `courseLevelParam` + `coursePathForLevel()`)
- Modify: `src/course/data/course.ts` (derive `a2CourseModules`; export `courseModulesByLevel`)
- Modify: `src/course/data/runtimeShapeAssertion.ts` (add `assertA2CourseShape`)
- Create: `src/course/components/LevelSelector.tsx` (+ `.test.tsx`)
- Modify: `src/course/components/CourseHome.tsx` (level-aware: read `livello` param, render selector + selected level's map + that level's Can-do/checkpoint sections)
- Create: `src/course/a2/view/buildA2LessonViewModel.ts` (+ `.test.ts`) — resolves an A2 lesson's models/exercises + kanji exposures for the page
- Modify: `src/course/components/LessonPage.tsx` (or the A1 lesson page) to resolve level from module id and render A2 lessons
- Modify: `src/course/components/JapaneseSegmentText.tsx` usage sites / lesson rendering to feed kanji exposures to `KanjiRubyText` (Task 3)
- Modify: `src/course/i18n/catalog.ts` (+ its `.test.ts`) — add A2 home/level/checkpoint copy keys, IT+EN
- Reference (read): `src/course/progress/progress.ts` (`summarizeLevel`, `visitedLessonIdsForLevel`, `recordCanDoEvidence`, `recordCheckpointAttempt`, `clearLevel`), `src/settings/ScriptContext.tsx`, `src/i18n/LocaleContext.tsx`, `src/course/routing/lessonRouteResolution.ts`.

- [ ] **Step 1: Fresh spec re-read.** Re-read §5 (two-level, A2 inspectable/recommended-not-locked), §12 (lesson experience), §14.3 (script interaction/no-bypass), §17 (progress, no migration), §19 (accessibility), §20 (speech truthfulness). Confirm the level selector must reflect in the URL and A2 is never hard-locked.

- [ ] **Step 2: Add the URL level dimension (back/forward safe) without colliding with the lesson route.** In `routePaths.ts`:

```ts
/** Query param that selects the visible level on the course map (§5). A query
 * param — not a new path segment — so it never collides with the existing
 * `/percorso/:moduleId/:lessonId` lesson route and still yields distinct
 * history entries for browser back/forward. */
export const courseLevelParam = "livello";

/** Course-map URL focused on a given level, e.g. `/percorso?livello=a2`. A1 is
 * the default and renders at the bare `/percorso` (no param) so every existing
 * A1 URL stays byte-for-byte stable. */
export function coursePathForLevel(level: "a1" | "a2"): string {
  return level === "a1" ? routePaths.course : `${routePaths.course}?${courseLevelParam}=a2`;
}
```

- [ ] **Step 3: Write the failing runtime-shape test**, then derive the A2 runtime course + fail-closed assertion.

```ts
// src/course/data/course.test.ts (add)
import { courseModulesByLevel } from "./course";
it("derives 15 A2 runtime modules / 60 lessons from the frozen A2 catalog", () => {
  const a2 = courseModulesByLevel.a2;
  expect(a2).toHaveLength(15);
  expect(a2.flatMap((m) => m.lessons)).toHaveLength(60);
});
```

In `course.ts`, derive `a2CourseModules` from `A2_MODULE_MANIFEST` + `a2CanDosAuthored` exactly as A1 is derived (reuse `buildLesson`/`MODULE_ICON_IDS` pattern with an A2 icon map), call `assertA2CourseShape(a2CourseModules)`, and export:

```ts
export const courseModulesByLevel = { a1: courseModules, a2: a2CourseModules } as const;
```

`assertA2CourseShape` mirrors `assertA1CourseShape` (ids present/unique, counts positive, fixed totals 15/60) and throws rather than exporting partial content.

- [ ] **Step 4: Run the shape test.** Run: `npx vitest run src/course/data/course.test.ts && npx tsc --noEmit` → PASS + clean.

- [ ] **Step 5: Write `LevelSelector.tsx`** — an accessible two-option control (A1/A2) reflecting the `livello` param. Selecting a level calls `navigate(coursePathForLevel(level))` (pushes history → back/forward works). It shows A2 as **recommended after the A1 checkpoint** (a soft hint from `summarizeLevel(progress,"a1",…)` + A1 checkpoint state) but never disables A2 — A2 is always selectable and directly routable via URL. Focus moves to the level heading on change (`useRef` + `.focus()`), preserving keyboard context. Test asserts: both options always enabled, URL param drives selection, focus moves, hint text present but non-blocking.

- [ ] **Step 6: Make `CourseHome.tsx` level-aware.** Read the `livello` search param (default `a1`); pick `courseModulesByLevel[level]`; render `<LevelSelector>`, the selected level's `CourseMap`, and that level's own truthful sections computed with `summarizeLevel(progressV4, level, outline)`, `buildCanDoSummaryModel(...)` over that level's Can-dos (`a2CanDosAuthored` for A2), and that level's checkpoint section (`a2Checkpoint` for A2). A1 and A2 evidence never cross-contaminate (separate summaries — §5/§8). Update `course.test`/`CourseHome.test` snapshots. **Do not** change A1's default `/percorso` output.

- [ ] **Step 7: Write `buildA2LessonViewModel.ts`** (+ test) — mirrors `buildA1LessonViewModel`: given a lessonId, returns the ordered models + exercises from `a2FoundationCatalogs` plus the lesson's `kanjiExposures` (glyph, stage at this lesson, reading, semantic gloss) resolved from the kanji catalog (Task 3) via the lesson's `kanjiExposureIds`. The view model is the single source the page renders from. Test: `buildA2LessonViewModel("sequencing-ongoing-3")` returns ≥8 models and its `ている` kanji exposures at the correct stage.

- [ ] **Step 8: Render A2 lessons in the lesson page with the kanji UI + no-bypass.** In the lesson page, resolve the level from the module id (A2 module ids are disjoint from A1's, so `A2_MODULE_IDS.has(moduleId)` selects the A2 renderer). Render Japanese via `KanjiRubyText` (Task 3), passing each exposure's stage + the active `Script` from `ScriptContext`:
  - stages `first-supported`/`supported-retrieval`: furigana shown (semantic `<rt>`).
  - stage `revealable`: furigana hidden behind an accessible **reveal** control (`aria-expanded`, ≥44px).
  - stage `assessed`: bare glyph, furigana suppressed **even in romaji mode**, with the visible explanation caption (`a2KanjiAssistancePolicy` returns `romaji:"not-shown"` at assessed → no romaji bypass). A test renders an assessed exposure in `romaji` mode and asserts no romaji/furigana leaks into the DOM.

- [ ] **Step 9: Progress + review + speech.** Reuse the existing V4 level-aware functions unchanged: `markLessonVisited`/`recordCanDoEvidence`/`recordCheckpointAttempt` already accept a `level`, and A2 records start empty (`emptyLevelProgress()`), so **no migration runs** and A1 evidence is untouched. The review surface reads the selected level's evidence. Speech stays truthful (§20): reuse the existing speech-availability guard — never claim audio that isn't produced; A2 adds no new audio claims. Add a progress test asserting recording A2 evidence leaves `progress.levels.a1` byte-identical.

- [ ] **Step 10: A2 copy (IT+EN parity).** Add A2 home/level-selector/checkpoint copy keys to `i18n/catalog.ts` in both locales; the copy-parity + no-Japanese checks (Task 7) already gate these. Add a catalog test asserting the A2 keys exist in both `it` and `en` with no Japanese characters.

- [ ] **Step 11: Full app checks.**

Run: `npx vitest run && npx tsc --noEmit && npm run prebuild && GITHUB_PAGES=true npm run build`
Expected: all tests pass, clean types, both release gates print `OK`, production build succeeds under `/nihongo-practice/`.

- [ ] **Step 12: Commit.**

```bash
git add src/routing/routePaths.ts src/course/data/course.ts src/course/data/course.test.ts \
  src/course/data/runtimeShapeAssertion.ts \
  src/course/components/LevelSelector.tsx src/course/components/LevelSelector.test.tsx \
  src/course/components/CourseHome.tsx src/course/components/CourseHome.test.tsx \
  src/course/a2/view/buildA2LessonViewModel.ts src/course/a2/view/buildA2LessonViewModel.test.ts \
  src/course/components/LessonPage.tsx src/course/components/JapaneseSegmentText.tsx \
  src/course/i18n/catalog.ts src/course/i18n/catalog.test.ts
git commit -m "feat(a2): runtime level selector, A2 lesson page + kanji UI, level-aware progress"
```

- [ ] **Step 13: Subagent quality review.** Dispatch: "Review Task 8 against §5/§12/§14.3/§17/§19/§20. Confirm: A2 is directly routable and never hard-locked (selector always enabled; A2 recommended only as a soft hint after the A1 checkpoint), the `livello` URL param drives selection and supports back/forward without colliding with the lesson route, A1 `/percorso` output is unchanged, the kanji UI hides furigana only at `assessed` and never leaks romaji/furigana in romaji mode at assessed, no destructive progress migration runs and A1 evidence is byte-identical after recording A2 evidence, and IT/EN copy parity holds. File inline findings." Fix before Task 9.

---
## Task 9: Integrated E2E, editorial + linguistic review, accessibility, and the release gate report

Proves the whole A2 release end-to-end in a real built preview, adds the editorial (IT/EN parity, natural Japanese, persona/register/counter/transitivity) and accessibility (200% zoom, ≥44px targets, no overflow at 320px, mobile) gates, and emits the exact machine-readable metrics report. This is the exit gate for §22.

**Files:**
- Create: `tests/e2e/a2-level.spec.ts` (level switch + URL/back-forward, A2 lesson render, kanji reveal, romaji no-bypass)
- Create: `src/course/a2/catalog/editorial.test.ts` (IT/EN parity + natural-Japanese + persona/register/counter/transitivity assertions over A2 content)
- Create: `src/course/a2/catalog/metricsReport.test.ts` (asserts the exact metrics report shape/values)
- Modify: `tests/e2e/zoom-a11y.spec.ts` (extend the existing 200%-zoom / ≥44px / no-overflow sweep to an A2 lesson + the level selector)
- Modify: `tests/e2e/screenshots.spec.ts` (add A2 course-map + A2 lesson + kanji-assessed baselines)
- Reference (read): `playwright.config.ts` (built-preview harness, `PREVIEW_BASE_PATH`), `tests/e2e/a1-depth.spec.ts`, `tests/e2e/speech.spec.ts`, `tests/e2e/zoom-a11y.spec.ts`, spec §19/§21/§22.

- [ ] **Step 1: Fresh spec re-read.** Re-read §19 (accessibility budgets), §21 (gates), §22 (exit criteria + required metrics). Confirm the exact metric fields the report must contain.

- [ ] **Step 2: Write the editorial + linguistic vitest gate** `src/course/a2/catalog/editorial.test.ts` over the frozen A2 catalogs. This gate is exhaustive — it inspects **every** realized variant, not a sample:
  - **IT/EN parity (all ids):** structural EN/IT key + placeholder parity over the **entire** aggregated A2 copy is already enforced exhaustively by `validateA2Release()` stage 7 (`copy-parity`, over every copy id — no sampling); semantic/meaning parity across all rows is covered by the human adversarial reviewer in Step 3. This editorial gate therefore focuses on the realized Japanese, register, transitivity, and counters rather than re-checking copy keys.
  - **Natural Japanese (all variants):** for every variant, `realizeVariant(...).sentence.canonicalJapanese` equals the authored expected surface and `formatRomaji(sentence.tokens).text` equals the authored rōmaji. The authored table length must equal `a2FoundationCatalogs.sentenceVariants.length`, so no variant escapes inspection.
  - **Register (all verb targets):** each grammar family declares a register; polite targets end in a polite morpheme (`ください`/`ですか`/`ます`/`ました`/`ません`/`です`/`でした`), plain targets must NOT (they end in `る`/`ない`/`た`/`なかった`/`て`/`で`/`だ`). Asserted from the realized surface, driven by an authored `variantId → register` column.
  - **Transitivity/particle (all verb targets):** cross-check the sense's own case frame — `sense.argumentParticleByRole.theme === "o"` ⇒ the realized tokens contain an `を` particle token; `=== "ga"` ⇒ they do not mark the theme with `を`. The authored `objectParticle` column must equal the particle the sense's frame assigns, so authored intent and sense metadata can never drift.
  - **Counters (all counting sentences):** where a sentence counts, the authored `counter` column (e.g. `まい`, `さつ`, `だい`) must appear in the realized `canonicalJapanese`; counters surface as floating lexical quantifiers (the A1 `りんごをみっつかいます` pattern), so assert by substring on the realized surface.

```ts
import { it, expect } from "vitest";
import { a2FoundationCatalogs } from "./catalog";
import { realizeVariant } from "../../foundations/realizeFamily";
import { formatRomaji } from "../../../romaji/formatRomaji";
import type { AssembledToken } from "../../../romaji/types";
import type { SentenceFamily, SentenceVariant } from "../../foundations/types";

// All linguistic inputs come from the single frozen `a2FoundationCatalogs`
// (Task 7 Step 4) — never re-imported catalogs — so this gate can never drift
// from the released content. `FoundationCatalogs` exposes every field the
// realizer needs (`sentenceFamilies`, `contexts`, `personRoles`, `referents`,
// `semanticValues`, `learningTargetSenses`, `sentenceVariants`).
const famById = new Map<string, SentenceFamily>(
  a2FoundationCatalogs.sentenceFamilies.map((f) => [f.id, f]),
);
const senseById = new Map(
  a2FoundationCatalogs.learningTargetSenses.map((s) => [s.id, s]),
);
const realizeCatalogs = {
  contexts: a2FoundationCatalogs.contexts,
  personRoles: a2FoundationCatalogs.personRoles,
  referents: a2FoundationCatalogs.referents,
  semanticValues: a2FoundationCatalogs.semanticValues,
  learningTargetSenses: a2FoundationCatalogs.learningTargetSenses,
};
const allVariants: readonly SentenceVariant[] = a2FoundationCatalogs.sentenceVariants;
const variantById = new Map(allVariants.map((v) => [v.id, v]));

function realize(v: SentenceVariant) {
  const fam = famById.get(v.sentenceFamilyId);
  if (!fam) throw new Error(`no family ${v.sentenceFamilyId} for ${v.id}`);
  const r = realizeVariant(fam, v, realizeCatalogs, {
    availableConceptIds: [...fam.requiredConceptIds],
  });
  if (!r.ok) throw new Error(`realize ${v.id} failed: ${JSON.stringify(r.errors)}`);
  return r.sentence;
}
const romajiOf = (tokens: readonly AssembledToken[]): string => {
  const r = formatRomaji(tokens);
  if (!r.ok) throw new Error(`formatRomaji failed: ${JSON.stringify(r.errors)}`);
  return r.text;
};

const POLITE_SUFFIX = /(ください|ですか|ます|ました|ません|ませんでした|です|でした)$/;
const PLAIN_SUFFIX = /(る|ない|た|なかった|て|で|だ)$/;

type EditorialRow = {
  readonly variantId: string;
  readonly jp: string;
  readonly romaji: string;
  readonly register: "plain" | "polite";
  readonly objectParticle: "を" | "が" | "none";
  readonly counter?: string;
};

// EVERY realized A2 variant — authored from realizer output during Tasks 4–7 and
// re-verified here each run. Populate one row per variant (count-asserted below).
const EDITORIAL: readonly EditorialRow[] = [
  // e.g. { variantId: "sequence-te-1-m5", jp: "あさごはんをたべてがっこうへいきます",
  //        romaji: "asagohan o tabete gakkou he ikimasu", register: "polite",
  //        objectParticle: "を" },
  // …exactly a2FoundationCatalogs.sentenceVariants.length rows…
];

it("inspects every A2 variant exactly once (no sampling)", () => {
  expect(EDITORIAL.length).toBe(allVariants.length);
  expect(new Set(EDITORIAL.map((r) => r.variantId)).size).toBe(allVariants.length);
  for (const r of EDITORIAL) expect(variantById.has(r.variantId), r.variantId).toBe(true);
});

it("every A2 target is realizer-derived (natural Japanese + rōmaji)", () => {
  for (const row of EDITORIAL) {
    const s = realize(variantById.get(row.variantId) as SentenceVariant);
    expect(s.canonicalJapanese, row.variantId).toBe(row.jp);
    expect(romajiOf(s.tokens), row.variantId).toBe(row.romaji);
  }
});

it("register matches each construction's declared register", () => {
  for (const row of EDITORIAL) {
    const s = realize(variantById.get(row.variantId) as SentenceVariant);
    if (row.register === "polite") {
      expect(POLITE_SUFFIX.test(s.canonicalJapanese), `${row.variantId} polite`).toBe(true);
    } else {
      expect(POLITE_SUFFIX.test(s.canonicalJapanese), `${row.variantId} not polite`).toBe(false);
      expect(PLAIN_SUFFIX.test(s.canonicalJapanese), `${row.variantId} plain`).toBe(true);
    }
  }
});

it("transitivity/particle matches each sense's case frame", () => {
  for (const row of EDITORIAL) {
    const s = realize(variantById.get(row.variantId) as SentenceVariant);
    const sense = senseById.get(s.predicateSenseId);
    const themeParticle = sense?.argumentParticleByRole.theme; // "o" | "ga" | undefined
    const hasWo = s.tokens.some((t) => t.kind === "particle" && t.jp === "を");
    if (row.objectParticle === "を") {
      expect(themeParticle, row.variantId).toBe("o");
      expect(hasWo, `${row.variantId} を present`).toBe(true);
    } else if (row.objectParticle === "が") {
      expect(themeParticle, row.variantId).toBe("ga");
      expect(hasWo, `${row.variantId} no を`).toBe(false);
    }
  }
});

it("counters match the realized counted noun", () => {
  for (const row of EDITORIAL) {
    if (!row.counter) continue;
    const s = realize(variantById.get(row.variantId) as SentenceVariant);
    expect(s.canonicalJapanese.includes(row.counter), `${row.variantId} counter ${row.counter}`).toBe(true);
  }
});
```

- [ ] **Step 3: Independent adversarial linguistic/content review — EVERY row, read-only.** Dispatch a **fresh** reviewer subagent (no prior context on this plan) as a read-only linguistic/content auditor. It must inspect **every** A2 artifact — not a sample — and file inline findings. Scope (exhaustive):
  - **Every realized model** in all 60 lessons (the full `EDITORIAL` surface set + rōmaji), **every** transfer/production target, **every** dialogue turn, and **every** practical text (schedules, notices, messages, forms).
  - **Every EN and IT translation/gloss** for semantic faithfulness (not just key parity).
  - **Every accepted answer variant** in the practice specs (constrained-construction/completion option sets).
  - **Every kanji glyph, lexeme, reading, and the four-stage exposure schedule** across all 120 entries.

  For each, the reviewer explicitly checks: **particles** (は/が/を/に/で/へ/と/から/より case correctness), **conjugations** (class-correct dictionary/negative/past/past-negative/て per Task 2; no cross-class suffixing), **register** (plain vs polite consistent with the construction and speaker role), **omission/ellipsis** (natural topic/subject drop — not stilted, not ambiguous), **transitivity** (自動詞/他動詞 pair choice vs particle), **counters** (counter matches the counted noun class), **meanings/readings** (each kanji reading is the one taught for that lexeme; gloss matches the sense), **naturalness** (a native/near-native would say it this way), **Can-do fit** (the model actually evidences the lesson's primary Can-do), and **no-bypass** (romaji/furigana never leaks an assessed glyph).

  Findings are triaged Critical / Important / Minor. **Fix all Critical, all Important, and every valid Minor** by editing the offending content (never by weakening a gate), then **re-dispatch a fresh reviewer and repeat until the verdict is APPROVED with zero open Critical/Important and no valid open Minor.** This APPROVED verdict is a hard precondition for the metrics gate (Step 4) and release sign-off (Step 9). Sampling copy parity (Step 2) is explicitly **insufficient** on its own — this structural + semantic pass over all content is required.

- [ ] **Step 4: Write the metrics-report gate** `src/course/a2/catalog/metricsReport.test.ts`. The report (from `buildA2Reports`, Task 7) must contain and satisfy exactly:

| Metric | Requirement |
|--------|-------------|
| `levels` | `["a2"]` (this plan's scope) |
| `moduleCount` | 15 |
| `lessonCount` | 60 |
| `perLesson.models` | every lesson 8–12 |
| `perLesson.exercises` | every lesson 8–12 |
| `perLesson.uniqueTargets` | every lesson ≥5 |
| `perLesson.maxTargetReuse` | every lesson ≤2 |
| `perLesson.predicates/roles/contexts` | ≥3 / ≥3 / ≥2 |
| `perLesson.transfers` | ≥2 (≥1 controlled-production) |
| `grammar.forms` | 15, each with intro+practice+transfer+≥1 recurrence |
| `kanji.totalGlyphs` | 120 |
| `kanji.byModule` | matches `A2_KANJI_DISTRIBUTION` (M2=12, M3/M5/M12/M14=9, M15=0, others 8), sum 120 |
| `kanji.everyGlyph` | has first-supported < supported-retrieval < revealable < assessed (strict), no first-supported at any `a2-synthesis-*` lesson, assessed after ≥1 practice, romaji `not-shown` at assessed |

```ts
it("emits the exact A2 metrics and all satisfy the depth/grammar/kanji budgets", () => {
  const m = buildA2Reports();
  expect(m.lessonCount).toBe(60);
  expect(m.kanji.totalGlyphs).toBe(120);
  for (const r of Object.values(m.byLesson)) {
    expect(r.models).toBeGreaterThanOrEqual(8);
    expect(r.models).toBeLessThanOrEqual(12);
    expect(r.uniqueTargets).toBeGreaterThanOrEqual(5);
    expect(r.maxTargetReuse).toBeLessThanOrEqual(2);
    expect(r.transfers).toBeGreaterThanOrEqual(2);
  }
});
```

- [ ] **Step 5: Write the A2 E2E spec** `tests/e2e/a2-level.spec.ts` against the built preview (`PREVIEW_BASE_PATH`):
  1. From `/percorso`, the level selector shows A1 selected and A2 selectable (not disabled).
  2. Selecting A2 navigates to `…/percorso?livello=a2`, shows the 15 A2 modules; browser **Back** returns to A1; **Forward** returns to A2 (URL-driven).
  3. Open `sequencing-ongoing-3`; assert ≥8 models render and a `ている` kanji shows semantic furigana at its early stage.
  4. Open a lesson where a glyph is at `revealable`; furigana hidden until the reveal control (≥44px, `aria-expanded`) is activated.
  5. Switch script to **romaji**, open a lesson where a glyph is `assessed`; assert the DOM contains the bare glyph and **no** romaji/furigana for it (no bypass), plus the explanation caption.
  6. A2 checkpoint section renders as separate from A1 and makes an alignment (not certification) claim.

- [ ] **Step 6: Extend accessibility + screenshots.** In `zoom-a11y.spec.ts` add an A2 lesson + the level selector to the existing 200%-zoom / ≥44px-target / no-horizontal-overflow-at-320px sweep. In `screenshots.spec.ts` add `course-a2-map`, `lesson-a2-teiru`, and `lesson-a2-kanji-assessed` baselines (desktop 1440 + mobile 390), matching the existing naming.

- [ ] **Step 7: Run every gate (the exact release command sequence).**

```bash
npx vitest run
npx tsc --noEmit
npm run prebuild            # runs validateA1Release + validateA2Release + lintA2NoJapanese
npm run build
GITHUB_PAGES=true npm run build
npx playwright test
npx playwright test --update-snapshots   # only to (re)generate the new A2 baselines, then review
```

Expected: all unit/type/build/Pages/Playwright green; both release validators print `OK`; the metrics report satisfies every budget; new screenshots reviewed and committed.

- [ ] **Step 8: Commit.**

```bash
git add tests/e2e/a2-level.spec.ts tests/e2e/zoom-a11y.spec.ts tests/e2e/screenshots.spec.ts \
  tests/e2e/screenshots.spec.ts-snapshots \
  src/course/a2/catalog/editorial.test.ts src/course/a2/catalog/metricsReport.test.ts
git commit -m "test(a2): integrated E2E, editorial/linguistic + accessibility gates, metrics report"
```

- [ ] **Step 9: Subagent quality review (release sign-off).** Dispatch: "Act as the release reviewer for the A2 gate against §19/§21/§22. First confirm the independent adversarial linguistic review (Step 3) reached an APPROVED verdict with zero open Critical/Important/valid-Minor findings — if not, stop and report. Then independently run `npx vitest run`, `npx tsc --noEmit`, `npm run prebuild`, `GITHUB_PAGES=true npm run build`, and `npx playwright test`. Confirm: 60 lessons / 15 modules / 120 kanji, every depth/grammar/kanji budget met in the metrics report, level switching is URL/back-forward correct and A2 is never hard-locked, romaji mode never bypasses an assessed glyph, IT/EN parity + natural-Japanese hold, 200% zoom / ≥44px / no 320px overflow pass, A1 evidence untouched (no migration). Report any failure with the exact failing command. File inline findings." Fix before declaring the release gate green.

---

## Self-review (run by the plan author before hand-off)

**1. Spec + task coverage — every user-locked requirement maps to a task:**

| Locked requirement | Where |
|--------------------|-------|
| A2 = 15 modules × 4 = 60 stable IDs; fixed manifest with 4 outcomes/module across all approved themes | L1 table; Task 1 (frozen `A2_MANIFEST_SPEC`); Tasks 4–7 (content) |
| Grammar spiral (plain, て, ている, てください, てもいい, てはいけない, negative requests, たことがある, 予定/つもり, から/ので, と思う, comparisons, possibility, connectors) as Can-do-serving content; named Can-do + intro + controlled practice + true transfer + spaced recurrence; exact coverage matrix | L2 matrix; Task 2 (`A2_GRAMMAR_SPIRAL` + validator); Tasks 4–7 place each role |
| Depth contract per non-phonetic lesson (8–12 models, ≥3 predicates, ≥3 roles, ≥2 contexts, 8–12 exercises, ≥5 visible targets, reuse ≤2, ≥2 transfers) + dialogue/connected discourse + practical text; identical productive-verb recurrence contract | Task 4 builder floors + `validateFoundations`; M14 practical texts; verb-recurrence helper `withA2LaterUses` |
| Exactly 100–150 contextual kanji (chosen: **120**) with glyph, contextual lexeme/reading, module/first lesson, revealable lesson, assessed lesson; distributed, Can-do-tied; no standalone dump | L3 inventory + distribution table; Task 3 catalog; `kanji-standalone-dump` validator code |
| Kanji exposure/policy types, semantic ruby `<rt>`, first-supported→supported-retrieval→revealable→assessed ordering, assess-only-after-practice, no romaji bypass even in romaji mode, explicit explanation; validators reject count/reading/order/premature-hide/bypass; per-module distribution sums to inventory | Task 3 (types/policy/validators/`KanjiRubyText`); Task 7 romaji-bypass + distribution-sum checks; Task 8 UI |
| Extend shared semantic-family/exercise architecture; no canonical-answer duplication; deterministic selection (shared seed/runtime/validator); machine-readable lesson/module/level/grammar/kanji reports | Task 1 (`A2_RELEASE_SEED`); Task 2/3 reuse foundations; Task 7 `reports.ts` |
| Two explicit levels; separate Can-do/progress/checkpoint evidence; A2 inspectable/routable but recommended-after-A1-checkpoint, never hard-locked; level selector URL/focus/back-forward/locale/script persistence; A2 checkpoint separate + truthful | Task 1 (`a2Level`); Task 7 (`a2Checkpoint`); Task 8 (selector, URL param, separate summaries) |
| IT/EN parity, natural Japanese, persona/discourse/register/sense/counter/transitivity | Task 9 `editorial.test.ts`; Task 7 copy-parity + no-Japanese checks |
| Browser-only/static/HashRouter/Pages/privacy/speech-truthfulness/accessibility/mobile/200% zoom/≥44px/no overflow | Task 8 (speech guard, Pages build) + Task 9 (zoom-a11y, screenshots) |
| V4 progress compatibility: no new destructive migration unless proven necessary; A1 evidence untouched | Task 8 Step 9 (reuse level-aware V4; A1 byte-identical test) |
| Full unit/type/build/Pages/Playwright/screenshot/editorial/linguistic gates + exact metrics report; fresh per-task spec review + subagent quality review | Every task Step 1 (fresh re-read) + final Step (subagent review); Task 9 metrics report + release sign-off |
| Decomposition: T1 contracts/manifest/level/copy; T2 forms/realizer/validators; T3 kanji catalog/policy/UI; T4–T7 content slices (M1-4, M5-8, M9-12, M13-15+checkpoint/reports); T8 runtime; T9 E2E/editorial/gate; each independently testable/committable with precise file ownership | Tasks 1–9 as written; each has explicit Files + per-task commit |
| Commit only the plan file with the exact message + trailers | Final commit step below |

**2. Placeholder scan (actual command + honest result):** run

```bash
grep -nE 'TODO|TBD|fill in|implement later|as unknown|/\* … \*/|/\* \.\.\. \*/|/\* mirror|mirror A1|same as A1|representative across|CEFR-aligned|add all senses' \
  docs/superpowers/plans/2026-07-17-a1-a2-phase-3-a2-kanji.md
```

Expected: **zero load-bearing hits.** The only ellipses that remain are two kinds, both legitimate and non-load-bearing: (a) illustrative `// e.g. …` comments that sit **next to** a fully specified contract (the surrounding code/table is complete), and (b) the `EDITORIAL` / expected-surface data tables in `editorial.test.ts`, which are authored **during execution** from real realizer output — exactly as A1's `EXPECTED_SENTENCES` table is. Those tables are **count-enforced** (`EDITORIAL.length === a2FoundationCatalogs.sentenceVariants.length` and a unique-id check), so no variant can silently escape inspection; they are data-authoring steps, not hand-waves, and cannot be pre-enumerated because the exact surfaces depend on generated conjugations produced in Tasks 2/4–7. No step that changes code is left as prose: every code step shows the code or an exact contract table + command. Canonical Japanese lives only in the L1/L2/L3 tables and semantic-value references, never as React/boilerplate. Do not claim "no placeholders" without re-running the command above and reading its output.

**3. Type/signature consistency (checked across tasks):**
- `buildA2InstructionalLesson` / `A2LineSpec` (Task 4) — referenced with the same name/shape in Tasks 5–7.
- `A2_GRAMMAR_SPIRAL` + `validateA2GrammarSpiral` (Task 2) — same names in Task 7 validator + Task 9 metrics.
- Kanji: `KanjiActivityMode`, `a2KanjiAssistancePolicy.supportFor(exposure, mode).romaji` (Task 3) — same accessor in Task 7 (bypass check) and Task 8 Step 8 (UI).
- `A2ReleaseErrorCode` codes referenced in Task 7 (`synthesis-introduces-new`, `kanji-romaji-bypass`, `checkpoint-claims-certification`, `copy-contains-japanese`, `personal-alias-match`, `kanji-distribution-sum`) are **all** present in the `A2_RELEASE_ERROR_CODES` tuple defined in Task 1 (verified against lines listing the tuple) — the union is already total; keep it total if new checks are added.
- `courseModulesByLevel`, `coursePathForLevel`, `courseLevelParam`, `assertA2CourseShape`, `buildA2LessonViewModel` (Task 8) — used consistently by CourseHome/LessonPage/E2E.
- `buildA2Reports` / `A2CoverageReports` (Task 7) — same names in Task 9 gates.
- `a2Level`, `a2Checkpoint`, `a2CanDosAuthored`, `A2_CANDO_LESSONS`, `a2FoundationCatalogs`, `A2_AVAILABLE_CONTENT_BY_LESSON` — defined Tasks 1/3/4/7, consumed Task 8.

Fixes applied inline: unified the kanji policy accessor name to `supportFor(...)` everywhere; unified `courseModulesByLevel` (not `a2CourseModules` alone) as the exported runtime handle; made the checkpoint sample **all** module + scenario Can-dos with no "representative" subset (mirroring A1), with `minAcceptedTransferTargetsPerCanDo = A2_CHECKPOINT_MIN_TRANSFER_TARGETS = 3`; corrected `kanji-distribution-sum` to the exact tuple name (was bare `distribution-sum`) and confirmed the `A2_RELEASE_ERROR_CODES` union is already total (now also including `cando-untransferred` and `checkpoint-module-coverage`); made `canDos.ts` export both the derived `A2_CANDO_LESSONS` map **and** the derived `a2CanDosAuthored` array (+ `a2CanDoById`), mirroring A1, so Task 7 (coverage) and Task 8 (`data/course.ts`/`CourseHome`) both resolve.

**4. Blocker-specific correctness checks (added at controller request — each maps to a concrete gate):**
- **Product language:** the level/checkpoint copy states "A2, aligned with JF/CEFR Can-do", never a certificate; enforced by `checkpoint-claims-certification` over `a2-checkpoint-claim`. The only occurrences of the token `CEFR-aligned` in this file are inside this self-review's scan pattern above — no heading, goal, or copy value uses it.
- **Conjugation-class coverage:** Task 2's `a2Conjugation.ts` enumerates ichidan; all nine godan sub-classes (u/ku/gu/su/tsu/nu/bu/mu/ru); irregular する・来る; plus the 行く った/って exception — with per-form tests for 食べる/話す/書く/泳ぐ/待つ/死ぬ/遊ぶ/読む/帰る/行く/する/来る (glyph root preserved, macron-free romaji). No generic る/ない/た/て is appended to a shared "stem". Constructions consume the correct base (て/ない/past/dictionary), verified in Task 2 Step 6 + Step 15 review.
- **M15 zero new kanji:** `A2_KANJI_DISTRIBUTION["a2-synthesis"] === 0`; `kanji-synthesis-first-exposure` rejects any glyph first-supported at an `a2-synthesis-*` lesson; distribution M1=8,M2=12,M3=9,M4=8,M5=9,M6=8,M7=8,M8=8,M9=8,M10=8,M11=8,M12=9,M13=8,M14=9,M15=0 sums to 120 via `kanji-distribution-sum`.
- **Strict four-stage kanji ordering:** `kanji-exposure-order` asserts first-supported `<` supported-retrieval `<` revealable `<` assessed by canonical position (strict `<`, never `≤`) for all 120 glyphs; revealable and assessed are distinct stages (no collapse).
- **All-rows linguistic review:** Task 9 Step 3 mandates a fresh read-only reviewer over **every** model/transfer/dialogue/practical-text/EN+IT gloss/accepted variant/kanji exposure (particles, conjugations, register, omission, transitivity, counters, readings, naturalness, Can-do fit, no-bypass), fixed to APPROVED before sign-off; the automated `editorial.test.ts` count-check guarantees the surface set it audits is complete.
- **Exact actual type signatures:** `a2Level` uses the real `CourseLevel` shape `{ id: "a2", alignmentCopyId, moduleIds, canDoIds, recommendedPrerequisiteCheckpointId: "a1-checkpoint" }`; `a2Checkpoint` uses the real `CheckpointDefinition` (`sampledCanDoIds`, `minAcceptedTransferTargetsPerCanDo`); `a2Modules` uses the real `FoundationModule` (`{ id, level, order, canDoIds, lessonIds }`); Can-dos use the real `CanDo` (`checkpointEvidenceRule.evidenceKind: "checkpoint-sampled"`); `A2_PERSON_ROLES` uses the real `PersonRole` (`{ id, kind, labelCopyId, gender? }`). All copied verbatim from `src/course/foundations/types.ts`; no invented fields, no `as unknown`.

---

## Final commit (plan only)

```bash
git add docs/superpowers/plans/2026-07-17-a1-a2-phase-3-a2-kanji.md
git commit -m "docs: correct A2 conjugation, kanji scheduling, and execution detail" \
  --trailer "Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>" \
  --trailer "Copilot-Session: 5bb2b5fa-6441-4a34-98fa-de7aa78e0359"
```

## Execution hand-off

Plan complete and saved to `docs/superpowers/plans/2026-07-17-a1-a2-phase-3-a2-kanji.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task (fresh spec re-read → implement → two-stage review) using **superpowers:subagent-driven-development**, reviewing between tasks.
2. **Inline Execution** — execute tasks in-session with **superpowers:executing-plans**, batching with checkpoints.

Which approach?
