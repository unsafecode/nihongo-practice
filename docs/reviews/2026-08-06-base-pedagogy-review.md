# Base level — independent pedagogy and spec review

Reviewer: independent pedagogy reviewer (claude-opus-5), 2026-08-12
Scope: `master...HEAD` (`2714e63`, branch `unsafecode-finish-base-curriculum`), Base level (a0), 10 modules / 40 lessons
Method:

- **Spec.** Read `docs/superpowers/plans/2026-08-06-base-level-curriculum-redesign.md` — locked boundaries and file map, Task 7 (authoring contracts, form engines, particle licensing, first-teach ownership), Task 8 (five progressive references), Task 15 (routing for lessons and references), and the Base level spec sections.
- **Content and structure.** Read `src/course/base/manifest.ts`, `types.ts`, `catalog/` (lexicon, concepts, firstTeach, canDos, checkpoint, visibleTargets, activityContracts), `forms/`, `references/catalog.ts` and `references/buildReferenceViewModel.ts`, `content/module01…module10`, `copy/en.ts` and `copy/it.ts` (lesson explanation blocks for `topic-questions-1/2/3`, `argument-particles-2/3`, `polite-verbs-1/2/3/4`, `requests-connection-1/3/4`, `base-synthesis-1…4`).
- **Validation.** Read `validation/sequenceRules.ts`, `validation/lessonRules.ts`, `validateBase.ts`, `reports.ts`, `releaseBaseline.test.ts`.
- **Rendering.** Read `src/course/components/BaseLessonPage.tsx`, `BaseReferencePage.tsx`, `base/BaseExplanation.tsx`, `ModuleCard.tsx`, and `src/course/base/view/buildBaseLessonViewModel.ts`.
- **A1 boundary.** Read `src/course/a1/manifest.ts`, `src/course/a1/inheritedBaseConcepts.ts`, `src/course/a1/curriculum/grammar.ts`, `modules05to08.ts`, `modules09to12.ts`, `curriculum/buildA1CurriculumViewModel.ts`.
- **Measured evidence (read-only execution).** Ran `buildBaseReleaseInput()` and `buildBaseReleaseReport()` in throwaway `tsx` scripts that only print. Results: **0 catalog findings**; runtime shape 10 modules / 40 lessons with no error; **0** lessons failing `prerequisiteClosure`; 186 lexemes, 414 examples, 62 dialogue turns, 392 activities, 89 pattern cells, 5 references / 48 reference entries; contracts `{phonetic: 4, system: 27, content: 5, synthesis: 4}`; A1 11 modules / 44 lessons, A2 60 lessons. Also computed per-lesson new/review lexeme counts, per-lesson activity-category histograms, cumulative-retrieval coverage, retrieval "does it reach earlier lessons" analysis, review-lexeme reuse rates, and a Base-vs-retained-A1 first-teach duplication diff.
- **Rendered evidence (viewed PNGs).** `base-map-en-desktop-1440`, `base-map-it-mobile-390`, `base-lesson-dialogue-en-desktop-1440`, `base-lesson-synthesis-it-desktop-1440`, `base-reference-particle-atlas-en-desktop-1440`, `base-reference-verb-classes-it-desktop-1440`, `base-reference-sentence-anatomy-it-desktop-1440`, `base-reference-tense-polarity-it-desktop-1440`, `base-reference-adjective-copula-it-mobile-390` (all under `tests/e2e/base-visuals.spec.ts-snapshots/`).
- Did not run `npm run build`, `npm test`, or Playwright. Did not edit any file other than this one.

## Verdict

**APPROVED WITH FINDINGS**

The lessons themselves genuinely teach. Every semantic lesson carries five authored explanation blocks (main / construction / constraints / common error / nearest contrast) that are specific, correct, and contrastive — は vs が as topic vs focused subject, に vs へ as goal vs direction, で action-place vs means, godan vs ichidan with the かえる trap called out by name, the ています ambiguity. The dependency spine is machine-proven, not asserted: `validateFirstTeachOrder` (`src/course/base/validation/sequenceRules.ts:294`, rule `first-teach-before-owner` at `:460`) is applied at nine call sites covering examples, dialogue turns, and activity prompts/options/answers, and the measured run returns zero findings and full prerequisite closure for all 40 lessons. Practice is real retrieval: 38 of 43 `cumulative-retrieval` activities reach content first taught in a strictly earlier lesson, and all four synthesis lessons draw 100% of their practice targets from earlier lessons (36–55 distinct ids each, zero new lexemes).

Nothing found rises to blocker. No learner is misled by wrong Japanese, and every promised system is taught somewhere in prose plus worked examples plus practice. The findings below are about the **product layer failing to deliver teaching the catalog already contains** — most acutely F-P1, where the five progressive reference surfaces are authored, validated, snapshot-tested, and completely unreachable from inside Base.

## Findings

### F-P1 — The five progressive reference surfaces are unreachable from the Base UI, and default to a full reveal

- Severity: **high**
- Dimension: 5 (progressive references), 10 (open navigation), 11 (teach vs display)
- Evidence:
  - `grep -rn "baseReferencePath" src/ --include=*.ts --include=*.tsx` returns exactly four non-test sites: the builder itself (`src/routing/routePaths.ts:30`), and one consumer — `src/course/a1/curriculum/buildA1CurriculumViewModel.ts:557`. **No Base component imports or calls it.**
  - `grep -rn "href=" src/course/components/Base*.tsx src/course/components/base/*.tsx` returns **nothing**. The Base component layer contains no anchor to anywhere.
  - `src/course/components/base/BaseExplanation.tsx:104-114` — the in-lesson "Reference so far" section renders each reference snapshot as a bare `<li …>{snapshot.title}</li>`. This is the exact place a learner would expect to open the reference, and it is inert text.
  - `src/course/components/BaseReferencePage.tsx:78-79` — `const throughLessonId = throughLessonIdParam ?? BASE_LESSON_IDS[BASE_LESSON_IDS.length - 1]!;`. With no `throughLessonId` query param the page falls back to the **last** Base lesson, i.e. the maximal reveal. (The doc comment at `src/routing/routePaths.ts:26` describes this route as "never a silent default"; that is true only for an invalid present value, not for an absent one.)
  - `base-map-en-desktop-1440-darwin.png` and `base-map-it-mobile-390-darwin.png`: the header offers only Course / Free practice / Phrasebook; the map body offers modules, can-dos, checkpoint and review area — no reference entry point at any breakpoint.
- Finding: `buildBaseReferenceViewModel` implements careful progressive disclosure — entries are filtered by `baseCanonicalPosition(entry.firstTeachLessonId) <= throughPosition` and the model fails closed with `future-prerequisite` if a visible entry's prerequisite is not also visible (`src/course/base/references/buildReferenceViewModel.ts:143-200`). That machinery is the heart of the spec's Task 8 promise that a learner meets a growing system rather than a finished table. In the shipped product it never runs in its intended mode: a Base learner has no way to reach `/riferimenti/base/:id` except by typing it, and if they do, they get the fully revealed grid including systems they have not been taught. The A1 curriculum view links to these pages; Base, which owns them, does not. Net effect for dimension 11: the references are authored teaching that the product does not deliver.
- Resolution: UNRESOLVED — see coordinator

### F-P2 — Reference rows restate their own label instead of teaching when to use the form; authored contrasts and examples are computed and discarded

- Severity: **medium**
- Dimension: 4 (contrasts), 5 (progressive references), 11 (teach vs display)
- Evidence:
  - `src/course/base/references/catalog.ts:665-686` — the particle atlas entries. About 15 of the 20 "When to use it" glosses are tautologies of the row label: `"Topic"` → `"Marks the sentence topic."`; `"Nominal link"` → `"Links nominal elements."`; `"Question"` → `"Marks a question."`; `"Goal"` → `"Marks a movement goal."`; `"Direction"` → `"Marks a direction."`; `"Action place"` → `"Marks where an action happens."`; `"Means"` → `"Marks a means or instrument."`; `"Source"` → `"Marks a starting point."`; `"Limit"` → `"Marks an endpoint."`; `"Existence location"` → `"Marks where something exists."`; `"Existential subject"` → `"Marks what exists."` Only ね and よ (`:674-675`) carry a gloss that adds information.
  - The atlas puts three と senses (`listing-to`, `nominal-to`, `companion-to`, `:669-671`), two に senses that are not adjacent (`goal-ni` `:677`, `time-ni` `:681`, `existence-location-ni` `:684`), and two で senses (`action-place-de`, `means-de`, `:679-680`) into the same one-column table with no text distinguishing them.
  - `contrastIds` **is** authored for exactly the confusable pairs — `focus-subject-ga` ↔ `wa`, `nominal-to` ↔ `listing-to`, `companion-to` ↔ `listing-to`, `direction-he` ↔ `goal-ni`, `means-de` ↔ `action-place-de`, `limit-made` ↔ `source-kara`, `existential-subject-ga` ↔ `ga` (`catalog.ts:667-686`), survives the entry factory (`catalog.ts:147-148, 255-300`) and reaches the view model (`buildReferenceViewModel.ts:29-30, 182-189`).
  - `grep -n "contrast\|example" src/course/components/BaseReferencePage.tsx` → **no matches**. Neither `contrastIds` nor `exampleIds` is rendered anywhere.
  - `tests/e2e/base-visuals.spec.ts-snapshots/base-reference-particle-atlas-en-desktop-1440-darwin.png` confirms what a learner sees: a list of labels next to their own restatements.
- Finding: the particle atlas is the surface that should resolve exactly the confusions the level cares about (は/が, the three と, に/へ, で place vs means, から/まで). Instead it is a glossary whose right-hand column adds no information, while the pointers that would make it teach — the authored contrast links and the worked examples — are computed on every render and thrown away. This is the clearest instance of dimension 11's failure mode: data displayed, system not taught. (Note the contrast with `adjective-copula`, which does teach: `base-reference-adjective-copula-it-mobile-390-darwin.png` shows "L'aggettivo si coniuga da sé; il marcatore cortese non diventa mai copula piana" beside the full i-adjective and na-adjective paradigms.)
- Resolution: UNRESOLVED — see coordinator

### F-P3 — Retained A1 re-teaches as new five systems that Base now owns

- Severity: **medium**
- Dimension: 9 (transition into A1)
- Evidence:
  - `src/course/a1/inheritedBaseConcepts.ts:34-56` derives `A1_INHERITED_BASE_CONCEPT_IDS` **only** from the five *rehomed* modules (`sounds`, `sentence-foundations`, `topic-questions`, `polite-verbs`, `time-movement`) — 9 concepts. The six *new* Base modules (`argument-particles`, `copula-adjectives`, `existence-location`, `requests-connection`, `base-synthesis`) contribute nothing to the inherited set, so nothing suppresses A1's first-teaching notes for systems Base now teaches in full.
  - Companion と: Base first-teaches at `topic-questions-3`; A1 still introduces it as new at `people-3` via `a1-note-companion-to` (`src/course/a1/curriculum/modules05to08.ts:341`; note defined at `curriculum/grammar.ts:1071`).
  - から / まで: Base `time-movement-2`; A1 `places-3` via `a1-note-source-limit` (`modules05to08.ts:256`; `grammar.ts:1042`).
  - i- and na-adjectives: Base `copula-adjectives-3` and `-4`; A1 `descriptions-1` via `a1-note-adjectives` (`modules09to12.ts:82`; `grammar.ts:1100`).
  - あります / います: Base `existence-location-1`; A1 `existence-needs-1` via `a1-note-existence-aru-iru` (`modules09to12.ts:258`; `grammar.ts:1246`) — A1's note restates the animacy rule Base already established.
  - ください: partial overlap only. Base `requests-connection-2` teaches て + ください; A1 `shopping-3` / `a1-note-request-kudasai` (`modules09to12.ts:213`; `grammar.ts:1218`) teaches noun + を + ください, which Base does not cover. This one is a genuine extension and should be *rephrased* rather than removed.
- Finding: the boundary is proven to have **no gap** — `src/course/base/releaseBaseline.test.ts` shows the 64 published V4 A1 routes split disjointly into 20 Base-owned and 44 A1-retained, and every one of the 9 `A1_INHERITED_BASE_CONCEPT_IDS` is taught in Base. But it is not proven to have no **duplication**, and it does not. A learner arriving at A1 `descriptions-1` or `existence-needs-1` is told, as if for the first time, a rule they were taught and drilled 15 lessons earlier. That reads as the course losing track of the learner, and it wastes A1 lesson budget on re-explanation.
- Resolution: UNRESOLVED — see coordinator

### F-P4 — Every lesson in a module advertises the same module-level Can-do; the authored per-lesson objectives are never rendered

- Severity: **medium**
- Dimension: 3 (explanations), 10 (navigation hierarchy)
- Evidence:
  - `src/course/base/view/buildBaseLessonViewModel.ts:165-171` — `moduleCanDo(locale, moduleId)` resolves `copy.outcomes[manifestEntry.outcomeCopyId]`, a **module**-scoped string. It is the value assigned to `canDo` at `:188` (phonetic model) and `:304` (semantic model), and `BaseLessonPage.tsx:86` and `:128` render it as the lesson's Can-do.
  - `base-map-en-desktop-1440-darwin.png`: all four lesson rows of "Sound & Script" carry the identical line "I can notice and read the sound and script patterns used in the foundation course." (`ModuleCard.tsx:170-190` renders `copy.objectives[…]` per lesson row.)
  - `src/course/base/copy/en.ts:3455-3480` — the Base `objectives` dictionary contains only the **10** module descriptors (`a1-can-do-sounds-descriptor`, `base-can-do-argument-particles-descriptor`, …). There is no per-lesson objective in it.
  - Meanwhile `src/course/base/copy/en.ts:30-32` (`semanticLessonCopy`) emits a genuinely per-lesson `` `${lessonId}-objective` `` for all 36 semantic lessons, e.g. `sentence-foundations-1` → "Recognize short noun chunks that can fill a larger sentence role.", `topic-questions-1` → "Use は, pronounced wa, to establish or contrast a discourse topic." The matching `objectiveCopyId` field is authored in `content/module02SentenceFoundations.ts:1036`, `content/module03TopicQuestions.ts:883`, `content/module04PoliteVerbs.ts:1357` — and read by no view model or component (only `review/naturalnessLedger.ts`).
- Finding: the sharpest, most useful statement of what each individual lesson buys the learner already exists in two locales and is dead copy. What ships instead is a four-fold repetition of a coarse module descriptor, on the map and again at the top of each lesson. On the map this is actively unhelpful: the learner choosing among four lessons is given four identical reasons to pick any of them, which flattens the hierarchy the open-navigation design depends on. It also means 22 of the 36 authored objectives have no `objectiveCopyId` wiring at all (modules 01, 05–10), so the gap is structural, not just a rendering omission.
- Resolution: **RESOLVED (lesson surface)** — `buildSemanticModel` in `src/course/base/view/buildBaseLessonViewModel.ts` now resolves the lesson's own authored objective (`` `${lessonId}-objective` ``, derived by the same stable naming rule the authoring modules use and that `resolveDialogue` already relies on for turn translations) instead of `moduleCanDo`, so each of the 36 semantic lessons renders its own line in both locales. It fails closed with `missing-copy` on the objective copy id if either locale lacks the string — no fallback to the module descriptor. `moduleCanDo` is kept only in `buildPhoneticModel`, where the module descriptor genuinely is the framing because the phonetic contract authors no per-lesson objective in either locale. Proven by three tests in `src/course/base/view/buildBaseLessonViewModel.test.ts`: "advertises each semantic lesson's own authored objective instead of repeating the module can-do" (asserts `canDo === resolveBaseCopyText(locale, \`${lessonId}-objective\`)`, that it differs from the module outcome, and that each module × locale yields four *distinct* objectives), "fails closed when a lesson's authored objective is missing in a locale", and "keeps the module can-do only on the phonetic lessons, which author no per-lesson objective". The map surface (`ModuleCard.tsx` → `lesson.objectiveCopyIds` → shared `copy.objectives`, incl. the 22 lessons with no `objectiveCopyId` wiring) is a different, cross-level pipeline and remains open.

### F-P5 — "Known words to reuse" lists vocabulary that the lesson never uses

- Severity: **medium**
- Dimension: 2 (cognitive load), 6 (cumulative retrieval), 11 (teach vs display)
- Evidence (measured over `buildBaseReleaseInput().visibleTargets`, matching `reviewLexemeIds` against every learner-visible surface of the same lesson — examples, dialogue turns, activity prompts/options/answers):
  - `polite-verbs-1`: **11 review lexemes declared, 0 appear anywhere in the lesson.**
  - `polite-verbs-2`: 11 declared, 2 appear.
  - `copula-adjectives-3`: 10 declared, 3 appear.
  - `polite-verbs-3`: 14 declared, 7 appear. `existence-location-1`: 22 declared, 16 appear but only 8 reach practice. `time-movement-4`: 22 declared, 10 reach practice.
  - Level totals: 551 declared review lexemes, 450 visible anywhere (**101 unused, 18%**), only 362 used in practice.
  - The view model pushes every `reviewLexemeIds` entry into the rendered vocabulary list with `isReview: true` (`src/course/base/view/buildBaseLessonViewModel.ts`, semantic model), so all 11 of `polite-verbs-1`'s unused words are printed on the page.
  - The validator only enforces reuse for synthesis lessons — `validateSynthesisRetrievalSystems` (`src/course/base/validation/lessonRules.ts:1634-1730`) is why all four `base-synthesis-*` lessons score 12–13 / 12–13. Nothing constrains the other 36.
- Finding: a "known words to reuse" panel is a promise of retrieval. When a lesson lists 11 such words and then uses none of them, the panel is padding: it adds 11 rows of reading load to the page (dimension 2) while delivering zero retrieval (dimension 6). `polite-verbs-1` is the worst case and also a conspicuous one — it is the first lesson of the polite-verb module, exactly where a learner most needs the earlier vocabulary reactivated before new morphology lands, and its entire practice set (8 distinct target ids) touches nothing taught before it.
- Resolution: UNRESOLVED — see coordinator

### F-P6 — The `tense-polarity` reference never shows the four polite forms together, which is the one thing it promises

- Severity: **medium**
- Dimension: 5 (progressive references), 11 (teach vs display)
- Evidence:
  - `src/course/base/references/catalog.ts:1042-1051` — the reference's own blurb is "Compare the four canonical polite writing-verb forms." / "Confronta le quattro forme canoniche cortesi del verbo scrivere."
  - `catalog.ts:894-904` — the `base-tense-polite-grid` entry ("Four polite forms", blurb "Compare nonpast and past across affirmative and negative polarity") is built from `KAKU_POLITE_CELLS.slice(1)`, i.e. the affirmative cell is deliberately dropped because the previous entry owns it (`catalog.ts:882-893`).
  - `tests/e2e/base-visuals.spec.ts-snapshots/base-reference-tense-polarity-it-desktop-1440-darwin.png` shows the consequence: row "Non-passato dinamico" has かきます in the Affermativa column and three empty cells; row "Quattro forme cortesi" has かきません / かきました / かきませんでした and an **empty Affermativa cell**. The 2 × 2 tense × polarity paradigm never appears as a complete row anywhere on the page.
- Finding: this reference exists to make one specific system visible — the 2 × 2 grid of non-past/past × affirmative/negative. First-teach ownership is being honoured at the cost of the pedagogical artefact itself: the grid is split across two rows such that the learner sees a hole exactly where かきます belongs, in the row labelled "Four polite forms". A reference whose only job is a paradigm should show the paradigm; ownership can be indicated (a "reviewed" marker, a repeated cell attributed to the earlier entry) without breaking it. Compare `adjective-copula`, which solves the same ownership problem correctly by giving each entry complete rows (`base-reference-adjective-copula-it-mobile-390-darwin.png`).
- Resolution: **RESOLVED** — `src/course/base/references/catalog.ts` now builds `base-tense-polite-grid` from a new `TENSE_POLARITY_PARADIGM_CELLS` const (all four `KAKU_POLITE_CELLS`) instead of `KAKU_POLITE_CELLS.slice(1)`, so the "Four polite forms" row renders かきます / かきません / かきました / かきませんでした in canonical column order. First-teach ownership is preserved honestly rather than by weakening the validator: the canonical id `verb-polite-nonpast-affirmative` stays with the earlier `base-tense-dynamic-nonpast` row, and the repeat carries the distinct id `verb-polite-nonpast-affirmative-reviewed` (same "reviewed" convention as `base-copula-reviewed-affirmative`), which satisfies the `duplicate-cell-id` fingerprint guard because that guard legitimately rejects one id with two different `sourceContentIds` provenances. Proven by "renders the complete 2x2 paradigm in the tense-polarity row that promises the four polite forms" in `src/course/base/references/buildReferenceViewModel.test.ts` (EN + IT, asserts all four grid columns and the four rendered JP forms) and "keeps the tense-polarity paradigm row complete while the earlier row keeps first-teach ownership" in `src/course/base/references/catalog.test.ts` (asserts the four cells, the distinct repeat id, `four-polite-tense-cells` provenance, and `inspectBaseReferenceCatalog().errors === []`). The added surface re-inventoried the naturalness corpus fingerprint in `review/naturalnessLedger.ts`; at the time no approval had been recorded, so the new cell was `pending` external review like every other surface. It has since been signed by the focused delta review as one of the two added entries in the approved 2-added/19-changed/0-removed delta.

### F-P7 — The verb-classes reference omits the godan row shift and the て-form allomorphy the lessons actually teach

- Severity: **low**
- Dimension: 5 (progressive references)
- Evidence:
  - `tests/e2e/base-visuals.spec.ts-snapshots/base-reference-verb-classes-it-desktop-1440-darwin.png`: the "Verbi godan" row is captioned "Le terminazioni godan cambiano per riga" and shows only かく / かき / かきます; the "Forme in て pratiche" row shows only かいて.
  - `src/course/base/copy/en.ts` (`requests-connection-1` explanation blocks) teaches the full mapping in prose — く → いて, ぐ → いで, す → して, つ/る/う → って, ぬ/ぶ/む → んで — and `polite-verbs-2` teaches the き/ぎ/し/ち/に/び/み/い stem shift and the かえる ichidan-looking-godan trap.
  - `catalog.ts:1030-1040` — the reference is declared with `[FORM_COLUMN, STEM_COLUMN, ...POLITE_COLUMNS]` over `VERB_ENTRIES`, none of which carry a second godan verb from a different kana row.
- Finding: the row caption asserts a system ("the godan endings change by row") that the table then never instantiates: one verb, one row, one て-form. A learner who has met かく, のむ, はなす and かえる cannot use this reference to check which て-form のむ takes, nor to decide whether a -る verb is ichidan or godan — the two questions the reference is shaped to answer. The lessons do teach it, so no learner is stranded; the reference simply does not carry its share.
- Resolution: UNRESOLVED — see coordinator

### F-P8 — Two small holes in otherwise universal cumulative retrieval

- Severity: **low**
- Dimension: 6 (cumulative retrieval), 7 (activity taxonomy)
- Evidence (enumerated over `baseLessonContents` activity categories and `visibleTargets`):
  - `topic-questions-4` is the **only one of the 40 lessons** with zero `cumulative-retrieval` activities. Every other lesson has exactly one; the four synthesis lessons have two. Level total: 43.
  - `sounds-2`, `sounds-3`, `sounds-4` each carry an activity categorised `cumulative-retrieval` (`snd2-assemble-denwa`, `snd3-assemble-kippu`, `snd4-assemble-kyaku`) whose targets resolve **only** to that same lesson's own anchor word and own concept. Measured across the whole practice set, these three lessons touch **0** catalog ids first taught in an earlier lesson — the phonetic module never recycles the previous lesson's anchors.
  - `polite-verbs-1-activity-8` is likewise categorised `cumulative-retrieval` but targets `verb-asobu`, `verb-predicate-recognition`, `dictionary-lemma` — all first taught in `polite-verbs-1` itself (see also F-P5).
  - For contrast, the mechanism works everywhere else: 38 / 43 retrieval activities reach strictly earlier content, and `base-synthesis-1…4` draw 47 / 36 / 45 / 55 distinct practice ids of which **100%** predate the lesson.
- Finding: the category label promises the learner (and any future validator) that the item reaches back. In these five cases it does not, so the level's retrieval coverage is slightly weaker than its taxonomy claims, and `topic-questions-4` — a content lesson, the module's consolidation slot — ends its module with no backward reach at all.
- Resolution: UNRESOLVED — see coordinator

## Dimensions with no findings

Listed explicitly so the review is auditable.

- **1 — 40-lesson dependency sequence: no forward reference found.** `validateFirstTeachOrder` (`src/course/base/validation/sequenceRules.ts:294`) emits `first-teach-before-owner` (`:460`) over lexemes, concepts, forms, reference entries and particle senses, and is invoked at nine call sites (`:472, :515, :519, :528, :612, :621, :754, :768, :771`) covering example tokens, dialogue turns, and activity prompts, options and answers. Measured on this HEAD: `catalogFindings.length === 0`, and `prerequisiteClosure` holds for all 40 lessons. I additionally recomputed first-teach positions independently and found no visible target whose content predates its owner.
- **2 — Cognitive load per lesson is inside the authored envelope.** New lexemes per lesson range 3–12 (system lessons 3–6, content lessons 8–12), enforced per contract at `src/course/base/validation/lessonRules.ts:2103-2140`. New pattern cells run 2–5 per teaching lesson and 10–20 in synthesis lessons. Nothing exceeds the contract. (The *review* side of the load is the subject of F-P5, not this dimension.)
- **3 — Explanations are present, correct, and genuinely explanatory.** Every semantic lesson carries five distinct authored blocks — main, construction, constraints, common error, nearest contrast — and the view model fails closed if any is missing (`buildBaseLessonViewModel.ts`, `missing-copy` failures). Spot-read at `topic-questions-1/2/3`, `argument-particles-2/3`, `polite-verbs-1/2/3/4`, `requests-connection-1/3/4`, `base-synthesis-1…4` in both `copy/en.ts` and `copy/it.ts`: they state the rule, then the mechanism, then the boundary condition, then the specific error, then the nearest confusable — no templated filler, and the Italian is authored rather than machine-mirrored. (F-P4 concerns the unrendered per-lesson *objective*, a different string.)
- **4 — Confusable items are contrasted at the lesson level.** `topic-questions-2` re-packages the same fact with は and with が in adjacent examples 7–10 so the difference is information structure, not meaning; `argument-particles-2` sets に against へ; `argument-particles-3` sets で action-place against で means; `polite-verbs-2` sets たべる against かえる to break the "-る means ichidan" heuristic; `copula-adjectives-3/4` separate i-adjective self-inflection from the na-adjective/noun copula path; `requests-connection-3` calls out the ています progressive/resultative ambiguity. Every one of these is a real minimal pair with the contrast named. (The *reference-surface* half of this dimension is F-P2.)
- **7 — Activity taxonomy is varied and tests understanding, not just recognition.** 392 activities across all 10 categories; 8 per phonetic lesson and 10 per semantic lesson, spread over 8–10 distinct categories per lesson. 36 `error-diagnosis` and 27 `transformation` items require the learner to produce or repair, not select. Multiple-choice distractors are principled minimal pairs, not noise — e.g. the `existence-location-4` items contrast `…はどこにいますか` against `…はどこにありますか` on the animacy axis the lesson just taught.
- **8 — Synthesis lessons genuinely integrate.** `base-synthesis-1…4` introduce **zero** new lexemes, carry 12–20 pattern cells and two cumulative-retrieval activities each, and draw 36–55 distinct practice ids of which 100% were first taught earlier. Integration is enforced, not merely intended: `synthesis-system-before-teach` and `synthesis-system-component-before-teach` (`lessonRules.ts:1690, :1721`) plus the review-lexeme visibility checks at `:1634-1730`.
- **9 (gap half) — Base ends exactly where retained A1 begins, with no gap.** All 9 `A1_INHERITED_BASE_CONCEPT_IDS` are taught inside Base. `src/course/base/releaseBaseline.test.ts` proves the 64 published V4 A1 routes split disjointly into 20 Base-owned and 44 A1-retained with no route lost or invented, freezes the V4 activity inventory, and locks the A2 golden hash `6ce32b1f…` at 60 lessons. `A1_MODULE_IDS` still enumerates all 16 canonical modules, so published route ids are provably unchanged. (The duplication half of this dimension is F-P3.)
- **10 — Open navigation and responsive hierarchy are correct.** The course map shows all 10 Base modules unlocked with a "Start" affordance, soft "Ideally after: X" ordering rather than gating, a level selector with Base / A1 / A2 all open, the 10 module Can-dos, the Base checkpoint and a review area — verified at both `base-map-en-desktop-1440-darwin.png` and `base-map-it-mobile-390-darwin.png`. The reference pages present the same rows two ways from a single model — a table above 40rem and stacked cards below (`BaseReferencePage.tsx:111-218`) — and cells are placed by `columnId` rather than array index (`:152-169`), which is what makes progressive column omission safe. Mobile is a genuine reflow, not a shrunk table (`base-reference-adjective-copula-it-mobile-390-darwin.png`). (The missing link *into* the references is F-P1, filed under dimension 5.)
- **11 (lesson layer) — The lessons do visibly teach.** Read end to end, a Base lesson states the system, shows it assembled, names its boundary and its nearest confusable, then makes the learner produce and repair it. The failures of this dimension are confined to the surfaces above: the references (F-P1, F-P2, F-P6, F-P7), the objective line (F-P4), and the review-vocabulary panel (F-P5).

## Not reported (declared known and accepted)

- 5,028 unresolved audio human-ear and naturalness sign-offs (`reports.ts:556`, `pendingAudioReviews + pendingNaturalnessReviews`) — externally pending by design.
- A2 (`src/course/a2/`) frozen and unchanged.

## Coordinator findings (browser inspection, after the review above)

Filed by the coordinator while verifying the F-P1 fix in a real browser, not by the reviewer.

### F-P12 — References advertised column headings the learner had not reached yet

- Severity: medium (progressive-disclosure correctness, learner-visible)
- Found by: loading `#/riferimenti/base/sentence-anatomy?throughLessonId=sentence-foundations-4`
  in the built app. The table rendered *Tema* and *Soggetto focalizzato* headings with four blank
  cells beneath each, because `buildReferenceViewModel.ts` always published
  `definition.columns` in full while progressive disclosure had narrowed the rows.
- Why it matters: a Base reference exists to show *what the learner has been taught so far*. An
  empty column promises a distinction they have never met and, on a beginner surface, reads as
  content that is missing rather than not-yet-due.
- Resolution: FIXED — `grid.columns` is now filtered to the columns some visible row actually
  fills. Sparse columns (filled by only some rows) are deliberately kept, because that gap is the
  paradigm's own shape. Proven by "never advertises a column no visible row has reached yet" in
  `buildReferenceViewModel.test.ts`, which sweeps all 5 references × 40 lessons × both locales.
  Verified RED first: 112 offending combinations, beginning with
  `sentence-anatomy @ sentence-foundations-1 (en): empty column "topic"`.

### F-P1 (reference link) — verified in the browser

- The fix was confirmed end to end, not just in unit tests: the lesson renders
  `#/riferimenti/base/sentence-anatomy?throughLessonId=sentence-foundations-4`, clicking it
  navigates to the reference, and the destination is correctly scoped to that lesson.
