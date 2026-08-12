# Base level — independent content and language review

Reviewer: independent content reviewer (claude-opus-5), 2026-08-12
Scope: master...HEAD, Base level (a0) — all visible Japanese, EN and IT

Method: Rather than read the 68k lines of `src/course/base/` by eye, I imported
`baseCanonicalCatalog` and `BASE_REFERENCE_CATALOG` at runtime with read-only
`vite-node` scripts and printed every learner-visible surface, then read the dumps
module by module. Nothing outside this file was written.

- **Dumped and read in full**: 40 lessons, 186 lexemes (kana + romaji + EN + IT gloss
  + verb class + first-teach lesson), 364 examples (kana, romaji, EN, IT, EN/IT purpose,
  `predicateAspect`, `interpretationTags`, `utteranceKind`, frame), 10 dialogues / 62 turns,
  392 activities (category, operation, EN/IT instruction, resolved accepted-answer surface,
  resolved option surfaces), 5 reference grids / 48 entries with every canonical form cell
  and its EN/IT column and cell labels, and 2532 Base copy records + 3845 UI-chrome i18n leaves.
- **Automated checks written and run**: (a) a full Hepburn transliterator (gojūon, dakuten,
  handakuten, yōon, っ gemination, ん, particle は→wa / へ→e / を→o) diffed against every
  token romaji and all 186 lexemes; (b) EN/IT key-set diff, empty-string and identical-string
  detection over both `src/course/base/copy/*` and `src/course/i18n/*`; (c) progressive-gloss
  detection over all non-`ています` dynamic predicates in both locales; (d) an out-of-scope
  grammar regex sweep (permission, prohibition, conditionals, volitional, potential,
  desiderative, plain `ている`, `〜てから`, `〜ながら`); (e) dialogue politeness sweep;
  (f) answer-leakage sweep (accepted-answer kana vs. every EN/IT instruction and retry hint);
  (g) listening option-set integrity; (h) sentence-final punctuation consistency.
- **Screenshots viewed**: `base-reference-verb-classes-it-desktop-1440`,
  `base-reference-verb-classes-it-mobile-390`, `base-lesson-dialogue-it-desktop-1440`,
  `base-migration-notice-it-desktop-1440`.
- **Read directly**: `src/course/base/references/catalog.ts`, `catalog/lexicon.ts`,
  `content/module03TopicQuestions.ts`, `content/module04PoliteVerbs.ts`,
  `content/module10Synthesis.ts`, `copy/en.ts`, `copy/it.ts`,
  `components/BaseReferencePage.tsx`, `a1/manifest.ts`, `a1/curriculum/inheritedBase.ts`,
  and `docs/superpowers/specs/2026-08-06-base-level-curriculum-redesign.md` §7.9.
- **Verified untouched**: `git --no-pager diff --stat master...HEAD -- src/course/a2` → empty.

Known-and-accepted per brief, not reported: externally pending audio/naturalness sign-off
(5028 unresolved ledger entries), and romaji intentionally shown alongside hiragana.

## Verdict

APPROVED WITH FINDINGS

No blocker. The Japanese is overwhelmingly correct: 0 romaji/kana mismatches, 0 EN/IT key
divergences across 2532 + 3845 strings, 0 progressive glosses on dynamic nonpast, 0
out-of-scope grammar, 0 answer leaks in 392 activities, and every reference conjugation grid
is correct. One register defect (F-C1) and two presentation/translation defects (F-C2, F-C3)
should be fixed before release; the rest are polish.

## Findings

### F-C1 — Bare plain-form 「そう」 answers inside two otherwise です/ます dialogues
- Severity: high
- Area: 2 (discourse and register consistency)
- Evidence: `src/course/base/content/module10Synthesis.ts:1948` and
  `src/course/base/content/module10Synthesis.ts:2620` — both are
  `[L("expression-sou"), TASK11_COMMA]` prefixes producing, in
  `base-synthesis-1-practical-dialogue`: 「**そう**、けんきゅうしゃです」 (EN "That's right, she
  is a researcher." / IT "Esatto, è una ricercatrice.") answering the partner's polite
  「おかあさんはけんきゅうしゃですか」; and in `base-synthesis-2-practical-dialogue`:
  「**そう**、しごとをします」 (EN "That's right, I work." / IT "Esatto, lavoro.") answering
  「ふだんしごとをしますか」.
- Finding: 「そう」 used alone as an affirmative response is **plain/casual register**. Both
  dialogues are otherwise uniformly です/ます, and one of them addresses the interlocutor's
  mother with the deferential 「おかあさん」, which makes a casual reply actively incongruous.
  The course itself never does this anywhere else: the lesson that introduces the lexeme,
  `topic-questions-4`, only ever produces 「そうです」/「そうですね」/「そうですよ」
  (`src/course/base/content/module03TopicQuestions.ts:762` and `:782`), and its activity
  answer key at `:769` is 「そうです」. So Base contradicts its own teaching in its own
  synthesis checkpoint. Correct polite forms here are 「はい、けんきゅうしゃです」,
  「そうです、けんきゅうしゃです」, or 「ええ、しごとをします」. Aggravating factor: both
  translations render it with polite English/Italian ("That's right" / "Esatto"), so the
  learner receives no signal that the Japanese they are being shown is a register drop.
  My automated politeness sweep missed this because it tested only the sentence-final
  predicate, which is correctly です/ます in both turns.
- Resolution: FIXED (2026-08-06). Both turns now answer 「そうです、…」 instead of bare
  「そう、」: `base-synthesis-1-practical-dialogue` turn 4 is 「そう、けんきゅうしゃです」 →
  「そうです、けんきゅうしゃです」 and `base-synthesis-2-practical-dialogue` turn 3 is
  「そう、しごとをします」 → 「そうです、しごとをします」
  (`src/course/base/content/module10Synthesis.ts:1949` and `:2621`). The EN/IT translations
  were already polite ("That's right, …" / "Esatto, …") and are now accurate to the Japanese,
  so they are unchanged; only the two authoring-side purpose notes were corrected from
  "brief familiar response" / "breve risposta familiare" to "brief polite response" /
  "breve risposta cortese". 「はい、」 was rejected because `validateBaseLexemeRecurrence`
  (`src/course/base/catalog/catalog.ts:375-426`) requires `expression-sou` to appear on at
  least two distinct synthesis surfaces, and these two turns are its only synthesis
  surfaces; dropping either one produces `insufficient-later-retrieval` for
  `topic-questions-4`. Emitting です after a non-nominal lexeme needed a new minimal
  `{ kind: "copula", form: "affirmative" }` Task 11 part plus the exported `TASK11_DESU`
  constant (`src/course/base/content/module04PoliteVerbs.ts`), because
  `realizeOwnedNounPredicate` only accepts `category: "noun"` and `expression-sou` is an
  expression; the new part renders `sou desu`, matching the existing 「そうです」 romaji
  spacing in `topic-questions-4`. Proving test: `src/course/base/content/catalog.test.ts`
  → "Base affirmative register consistency › never realizes そう as a bare plain-form
  affirmative response", which scans every canonical example and dialogue turn for
  `/そう(?!です)/u`. Before the fix it failed with
  `["base-synthesis-1-practical-dialogue:turn-4: そう、けんきゅうしゃです",
  "base-synthesis-2-practical-dialogue:turn-3: そう、しごとをします"]`.

### F-C2 — Reference grid puts the canonical polite stem かき under the "Form" column, contradicting its own cell label and its two sibling rows
- Severity: medium
- Area: 1 (reference forms) / 10 (label truthfulness)
- Evidence: `src/course/base/references/catalog.ts:761` —
  `cell("verb-polite-stem-kaku", "form", "Polite stem", "Tema cortese", KAKU_POLITE_STEM)`.
  Compare `:771` `cell("verb-stem-suru", "stem", "Polite stem", "Tema cortese", …)` and
  `:782` `cell("verb-stem-kuru", "stem", "Polite stem", "Tema cortese", …)`.
  Rendered proof — `tests/e2e/base-visuals.spec.ts-snapshots/base-reference-verb-classes-it-mobile-390-darwin.png`:
  the card "Temi cortesi" shows **"Forma"** above 「かき」 (kaki), while the very next two
  cards "Tema cortese di する" and "Tema cortese di くる" show **"Tema cortese"** above
  「し」 and 「き」. Same misalignment in the table view
  (`base-reference-verb-classes-it-desktop-1440-darwin.png`): かき sits in the *Forma*
  column, し and き sit in the *Tema cortese* column.
- Finding: the entry is `base-verb-polite-stems`, whose explanation is "Polite forms are
  built from the canonical stem." / "Le forme cortesi derivano dal tema canonico." — its
  form 「かき」 is a polite stem and belongs in the `stem` column that exists for exactly
  that purpose. As authored, the reference tells the learner that 「かき」 is a *Form* of
  the same kind as 「かく」/「たべる」/「する」/「くる」 (all of which sit in the same column),
  which is exactly the dictionary-form-vs-stem confusion `polite-verbs-3` exists to prevent.
  The columnId should be `"stem"`. Affects EN and IT equally.
- Resolution: UNRESOLVED — see coordinator

### F-C3 — Italian collapses the いい / きれい contrast that `copula-adjectives-4` exists to teach
- Severity: medium
- Area: 8 (EN/IT translation accuracy and parity)
- Evidence: `src/course/base/copy/it.ts:2024` `"Il parco era bello."` for
  `copula-adjectives-4-example-3` 「こうえんは**きれい**でした」 (な-adjective, copular past),
  and `src/course/base/copy/it.ts:2030` `"Il parco è bello."` for
  `copula-adjectives-4-example-9` 「こうえんは**いい**です」 (い-adjective). English keeps the
  two apart at `src/course/base/copy/en.ts:2045` `"The park was pretty."` and
  `en.ts:2051` `"The park is nice."`
- Finding: the two Italian strings are the same sentence in different tenses. Same noun
  (こうえん), same adjective (*bello*). An Italian learner reading the worked-examples list
  can only conclude that the difference between 「きれいでした」 and 「いいです」 is tense —
  which is precisely the inference the lesson is built to block. The lesson's own Italian
  purpose copy for example 9 (`it.ts:2042`) says *"Mantiene distinto il percorso degli
  aggettivi in い"* ("keeps the い-adjective path distinct"), so the translation defeats its
  own stated purpose. It also contradicts the app's own Italian gloss shown in the same
  lesson's vocabulary list: `it.ts:2090` `"adjective-ii-meaning": "buono"` versus
  `it.ts:2092` `"adjective-kirei-meaning": "bello; pulito"`. Correct Italian for example 9
  is *"Il parco è buono."* or, more idiomatically for いい applied to a place,
  *"Il parco va bene."* / *"Il parco è un bel posto."* — anything that does not reuse *bello*.
- Resolution: FIXED (2026-08-06). `copula-adjectives-4-example-9` 「こうえんはいいです」 is now
  translated `"Il parco è buono."` instead of `"Il parco è bello."`
  (`src/course/base/copy/it.ts` translations index 8, plus the mirrored authoring string in
  `src/course/base/content/module07CopulaAdjectives.ts:510`). `example-3`
  「こうえんはきれいでした」 keeps `"Il parco era bello."`, so the な-adjective and the
  い-adjective now render with different Italian adjectives, each matching its own IT lexeme
  gloss (`adjective-kirei-meaning` = "bello; pulito", `adjective-ii-meaning` = "buono") and
  matching how いい is already translated elsewhere in the module ("Il negozio era buono.",
  "La mensa non era buona."). EN is unchanged ("The park was pretty." / "The park is nice.").
  Proving test: `src/course/base/content/module07CopulaAdjectives.test.ts` → "copula-adjectives-4
  keeps the な / い adjective contrast in both locales" (3 cases). Before the fix it failed with
  `expected 'Il parco è bello.' not to match /bell[aeio]/iu` and
  `expected 'Il parco è bello.' to match /buon[aeio]?/iu`.

### F-C4 — One accepted answer teaches a non-standard variant of a class label the same lesson otherwise teaches as 「ごだんどうし」
- Severity: low
- Area: 1 (Japanese correctness of activity answers)
- Evidence: `src/course/base/content/module04PoliteVerbs.ts:497-500` —
  `"godan-verb-class-expanded": { kana: "ごだんのどうし", romaji: "godan no doushi" }`.
  It is the accepted answer for `polite-verbs-2-activity-8` (「よむ、**ごだんのどうし**」,
  distractor 「よむ、いちだんどうし」), while the other four class items in the same lesson
  accept 「ごだんどうし」: `polite-verbs-2-activity-1` 「およぐ、ごだんどうし」,
  `-activity-4` 「かえる、ごだんどうし」, `-activity-5` 「かえる、ごだんどうし、れいがい」,
  `-activity-10` 「はたらく、ごだんどうし」.
- Finding: 「ごだんのどうし」(五段の動詞) is grammatical Japanese but is not the standard
  grammatical term; Japanese grammar consistently uses 五段動詞. Within one lesson the
  answer key accepts two different spellings of the same label with no explanation, so a
  learner drilling class analysis is taught the term inconsistently. Use 「ごだんどうし」
  throughout, or explain the variant.
- Resolution: FIXED (2026-08-06). `polite-verbs-2-activity-8` now accepts
  「よむ、ごだんどうし」 instead of 「よむ、ごだんのどうし」, matching its four siblings. The
  bespoke `expandedGodanClassTarget` helper and the `"godan-verb-class-expanded"`
  `ANALYSIS_LABELS` entry (`src/course/base/content/module04PoliteVerbs.ts:497-500`) were
  deleted, along with the now-orphaned gloss in
  `src/course/base/review/naturalnessLedger.ts:227`. The Base pipeline has no multi-answer
  mechanism — `acceptedAnswers` is built as `[japanese(acceptedAnswerTarget)]` — so
  accepting both spellings was not an option. Judgement call: the variant label was
  load-bearing. `validatePublishedSemanticActivities`
  (`src/course/base/content/module02SentenceFoundations.ts:1539-1543`) requires each lesson's
  nine non-spoken items to contain at least two "longer", two "shorter" and two "tie"
  option-length pairs, and 「ごだんのどうし」(10 chars) was the only thing making item 8 tie
  with its 「よむ、いちだんどうし」 distractor; shortening it alone drops the lesson to
  `tie = 1` and the module throws `canonical-depth-failure` for `polite-verbs-2`. Rather than
  weaken that validator, the distractor was changed to
  「よむ、かへんどうし」 (`kuru-verb-class`, `SPECIAL_CELL`, `optionAnalysisIds` updated to
  `["godan-verb-class", "kuru-verb-class"]`), which is the same length as the corrected
  answer, restores `longer=2 / shorter=5 / tie=2`, introduces a class pair the lesson did not
  already drill, and leaves the item's instruction, accepted and retry copy — none of which
  names ichidan — valid in both locales. Proving test:
  `src/course/base/content/module04PoliteVerbs.test.ts` → "polite-verbs-2 names the godan class
  consistently › uses ごだんどうし in every accepted answer that names the godan class". Before
  the fix it failed with
  `[{ "answers": ["よむ、ごだんのどうし"], "id": "polite-verbs-2-activity-8" }]` vs `[]`.

### F-C5 — Sentence-final 。 applied to only 1–2 examples inside three lessons
- Severity: low
- Area: 7 (hiragana realization / orthographic consistency)
- Evidence: 43 of 364 examples end in 。 or ？; 321 do not; all 62 dialogue turns omit it.
  Three lessons mix both styles internally:
  `sentence-foundations-4-example-1` 「さくらせんせいです**。**」 and `-example-2`
  「けんせんせいです**。**」 versus `-example-3` 「ほんです」 … `-example-10` 「あい、がくせいです」;
  `topic-questions-1-example-9` 「とうきょうです**。**」 versus the other nine
  (e.g. `-example-1` 「わたしはがくせいです」);
  `topic-questions-2-example-1` 「たなかさんがかんごしです**。**」 versus the other nine
  (e.g. `-example-2` 「やまださんがべんごしです」).
- Finding: these are all `complete-clause` examples of the same kind rendered in the same
  worked-examples list, so the learner sees the same sentence type punctuated two ways on
  one screen. Pick one convention per lesson (the 321-example majority omits the mark).
- Resolution: UNRESOLVED — see coordinator

### F-C6 — Loanwords are written in hiragana, an orthography never used in real Japanese
- Severity: low
- Area: 1 (Japanese correctness) / 7 (script realization)
- Evidence: `src/course/base/catalog/lexicon.ts` — 「こんびに」 (konbini, IT "minimarket"),
  「といれ」 (toire, IT "bagno"), 「ばすてい」 (basutei, IT "fermata dell'autobus"),
  「えんじにあ」 (enjinia), 「ぱん」 (pan). Rendered in the vocabulary list at
  `tests/e2e/base-visuals.spec.ts-snapshots/base-lesson-dialogue-it-desktop-1440-darwin.png`.
  Used in learner-visible sentences, e.g. `base-synthesis-3-practical-dialogue`
  「**こんびに**はどこにありますか」 and 「すみません、**といれ**はどこにありますか」.
- Finding: these words are only ever written コンビニ, トイレ, バス停 (or バスてい),
  エンジニア, パン. Base's hiragana-first policy explains *why* this happens, but nothing in
  the learner-visible copy tells the learner that these particular words will look different
  in real Japanese, so the wrong orthography can be carried forward. A one-line note in the
  vocabulary section for loanwords would close this without breaking the hiragana-first rule.
- Resolution: UNRESOLVED — see coordinator

### F-C7 — A few examples are grammatical but semantically odd, and would not be said by a native speaker
- Severity: low
- Area: 1 (naturalness)
- Evidence:
  `requests-connection-4-example-9` 「やまださんは**ふく**をきています」 — EN "Yamada is
  wearing clothes." / IT "Yamada indossa dei vestiti." (also `base-synthesis-2-example-7`
  「ふくをきました」 "I wore the clothes.");
  `base-synthesis-4-example-7` 「**くにのとし**にびょういんがありますか」 — EN "Is there a
  hospital in a city in the country?" / IT "C'è un ospedale in una città del paese?";
  `base-synthesis-3-practical-dialogue` turn 4 「**きょう**、といれはうけつけにあります」 —
  "Today, the restroom is at the reception."
- Finding: 「ふくをきています」 is tautological — Japanese names the garment
  (シャツ/コート…); the sentence reads as "Yamada is dressed", which is not what the gloss
  says. 「くにのとし」 is a chain of two unanchored generic nouns with no referent, so the
  question has no interpretable meaning. Adding 「きょう」 to a permanent-location existence
  statement implies the restroom moves daily. All three are artefacts of building sentences
  only from the licensed lexicon; substituting an already-owned concrete noun would fix each
  without widening scope.
- Resolution: UNRESOLVED — see coordinator

### F-C8 — Interpretation metadata contradicts the authored translation in two places
- Severity: low
- Area: 4 (dynamic nonpast semantics)
- Evidence: `base-synthesis-3-example-4` 「きょう、きょうしつであそびます」 carries
  `interpretationTags = habitual` but is translated EN "I will play in the classroom
  **today**." / IT "**Oggi** giocherò in aula." — an unambiguously future reading
  (compare `time-movement-2-example-4` 「きょうやすみます」, correctly tagged `future`).
  Separately, `requests-connection-4-example-8` 「わたしはやまださんをしっています」 is
  `predicateAspect = stative` while `base-synthesis-4-example-2`
  「すずきさんはゆうめいなえんじにあをしっています」 is `predicateAspect = dynamic`, for the
  same verb; `src/course/base/catalog/lexicon.ts:210` declares `verb-shiru` stative.
- Finding: the *translations* are correct in every case, and I confirmed neither
  `interpretationTags` nor `predicateAspect` is rendered anywhere — grep across
  `src/course/components/` and `src/course/base/view/` returns no usage — so no learner sees
  a wrong claim. This is a data-quality defect only: these fields are what the
  dynamic-nonpast validators key on, so a mis-tag silently weakens the guard that keeps
  かきます from ever being glossed as progressive.
- Resolution: UNRESOLVED — see coordinator

### F-C9 — The "Dictionary form" reference row carries the cell label "Godan"
- Severity: low
- Area: 10 (label truthfulness)
- Evidence: `src/course/base/references/catalog.ts:698` —
  `cell("verb-dictionary-kaku", "form", "Godan", "Godan", KAKU_DICTIONARY)` inside the entry
  `base-verb-dictionary-form`, whose explanation is "The dictionary form identifies the
  verb." Every sibling class row uses `"Dictionary", "Dizionario"` for the same かく/たべる/
  する/くる cell (`:708`, `:723-724`, `:737`, `:747`).
- Finding: the label is simply wrong — "Godan" is a verb *class*, not a *form*, and this row
  is about form. It is also untranslated in Italian. It is currently masked at render:
  `src/course/components/BaseReferencePage.tsx:202` prefers the column label
  (`columnLabelById.get(cell.columnId) ?? cell.label`), so no learner sees it today. It
  should still be corrected to `"Dictionary", "Dizionario"`, because the fallback path
  would surface it if a column label were ever removed.
- Resolution: UNRESOLVED — see coordinator

### F-C10 — よ is reflected in translations only in the lesson that teaches it, and dropped thereafter
- Severity: low
- Area: 8 (EN/IT accuracy)
- Evidence: taught correctly in `topic-questions-4-example-5` 「はい、ゆきです**よ**。」 → EN
  "Yes—I'm Yuki, just so you know." / IT "Sì—sono Yuki, te lo dico." Dropped later in
  `argument-particles-2-example-9` 「やまださんはおおさかへいきます**よ**」 → EN "Yamada heads
  toward Osaka." / IT "Yamada si dirige verso Osaka.";
  `existence-location-1-example-5` 「ともだちはいます**よ**」 → EN "My friend is here." / IT
  "Il mio amico è qui."; `existence-location-1-example-10` 「じてんしゃはあります**よ**」 →
  EN "The bicycle is available." / IT "La bicicletta è disponibile."
- Finding: よ is a visible token the learner is asked to read, and the purpose copy for
  `argument-particles-2-example-9` still claims "Presents Yamada's route direction as an
  update" / "Presenta come informazione nuova la direzione di Yamada" — but neither
  translation carries any update/assertive nuance. Dropping よ is defensible under the
  "Natural translation" label, but it should be consistent with how the teaching lesson
  handles it, in both locales.
- Resolution: UNRESOLVED — see coordinator

### F-C11 — Stacked prenominal adjectives translated as coordination in both locales
- Severity: low
- Area: 8 (EN/IT accuracy)
- Evidence: `base-synthesis-1-example-3` 「けんはゆうめいないいきゃくです」 → EN "Ken is a
  famous, good customer." / IT "Ken è un cliente famoso e apprezzato."
- Finding: the Japanese is nested modification — ゆうめいな modifies the whole
  [いいきゃく] — not coordination. The English comma and the Italian *e* both present the
  two adjectives as a coordinated pair, which is what 「ゆうめいで、いいきゃく」 would mean;
  adjective て-form is deliberately outside Base scope, so the Japanese is the correct
  in-scope choice, but the translations should mirror the nesting (e.g. "Ken is a famous
  good customer" / "Ken è un famoso buon cliente"). The Italian additionally re-glosses
  いい as *apprezzato* ("appreciated/valued"), which is neither the lexicon gloss
  (`copy/it.ts:2090` "buono") nor a reading いい supports.
- Resolution: UNRESOLVED — see coordinator

## Areas with no findings

- **3 — Particles.** Every use of は / が / の / も / と / か / ね / よ / を / に / へ / で /
  から / まで across all 364 examples and 62 dialogue turns is correct: を direct object,
  に goal / specific time / existence location, へ direction, で action place and means,
  から–まで bounds, は topic and contrast, が focus and existential subject, の possessive and
  attributive, も additive, と listing / nominal link / comitative, か question, ね shared
  confirmation, よ assertive update. The particle atlas (20 entries) labels each sense
  correctly and gates it behind the lesson that teaches it, in both locales.
- **4 — Dynamic nonpast semantics.** Zero non-`ています` dynamic predicates are glossed as
  progressive in either EN or IT. The `ongoing-now` tag appears only in
  `requests-connection-4` (9 examples + 2 dialogue turns) and `base-synthesis-4-example-8`.
  The tense-polarity reference states it explicitly: "Dynamic nonpast expresses a habit or
  future event, not an action in progress now." / "Il non-passato dinamico esprime abitudine
  o futuro, non un'azione in corso adesso."
- **5 — Adjective and copula handling.** The full grid is correct in both the examples and
  the `adjective-copula` reference: がくせいです / がくせいではありません / がくせいでした /
  がくせいではありませんでした; たかいです / たかくないです / たかかったです / たかくなかったです;
  しずかです / しずかではありません / しずかでした / しずかではありませんでした / しずかな;
  the irregular いい → よかったです / よくなかったです is right; い-adjectives never take な and
  な-adjectives never self-inflect.
- **6 — Bounded て-form scope.** A regex sweep for permission (〜てもいい), prohibition
  (〜てはいけ), conditionals (〜たら / 〜ば), volitional (〜ましょう), potential, desiderative
  (〜たい), 〜てから, 〜ながら, plain 〜ている and 〜ていました produced only false positives
  (「はたらく」 matching 〜たら). Content matches the declared scope in
  `docs/superpowers/specs/2026-08-06-base-level-curriculum-redesign.md` §7.9 exactly:
  て formation, 〜てください, sequential 〜て, 〜ています, and nothing further.
- **7 — Romaji realization.** Zero mismatches between kana and romaji across every token in
  every example, dialogue turn, activity target, reference cell, and all 186 lexemes. Long
  vowels, っ gemination, ん, and ゃゅょ are all correct. Particle romanization is correct
  throughout: は→"wa", へ→"e", を→"o", and the copula 「ではありません」→"dewa arimasen".
  No non-hiragana appears on any Japanese surface.
- **8 — EN/IT structural parity.** 10/10 modules, 40/40 lessons, 10/10 objectives, 10/10
  outcomes, 2532/2532 Base content records and 3845/3845 UI-chrome i18n leaves present in
  both locales; zero keys present in one locale only; zero empty strings; zero untranslated
  English left in the Italian files. The only EN==IT identical strings are legitimately
  identical: `Tokyo`, `Kyoto`, `Osaka`, `Yuki`, `Base`, `A1`, `A2`, `Godan`, `Ichidan`,
  `Can-do`, `____`, and `expression-iie-meaning` = "no". (Semantic divergences found are
  reported as F-C3, F-C10, F-C11.)
- **9 — Answer leakage.** Zero of 392 activities contain their accepted answer's kana in
  either the EN or the IT instruction, or in the retry hint. All 40 listening activities have
  exactly one option surface matching the audio target. No duplicate option surfaces anywhere.
  The 36 "answer not among options" hits are listening items whose `targetId` is an audio
  reference by design, and each resolves to exactly one matching written option.
- **10 — Accessibility wording.** Every `aria-label`, `aria-live`, and `role="status"` string
  in `src/course/components/Base*.tsx` and `src/course/components/base/` resolves to a
  localized i18n key present in both locales — audio status (`Play audio` / `Riproduci audio`,
  `Playing…` / `Riproduzione…`, `Audio playback was blocked. Try again.` / `La riproduzione
  audio è stata bloccata. Riprova.`), practice regions (`Available tiles` / `Tasselli
  disponibili`, `Your answer` / `La tua risposta`), stage headings, and reference view
  switches (`Table view` / `Vista tabella`, `Cards view`). Each status string is truthful
  about the state it announces. (F-C9 is the only label defect, and it is not currently
  exposed.)
- **11 — Migration help copy.** `progressMigration.noticeTitle/noticeBody/acknowledge/
  helpTitle/helpBody` are fully present and accurate in both locales, and the Italian is
  native-quality, not a gloss of the English. The copy is honest about the limits of the
  migration — it says visits without a safe match are kept only as recovery data and that
  practice attempts tied to redesigned exercises may need repeating, rather than overstating
  what carried over. Verified rendered in
  `tests/e2e/base-visuals.spec.ts-snapshots/base-migration-notice-it-desktop-1440-darwin.png`.
- **12 — A1 containment.** `A1_LESSON_IDS` = 64, `A1_RETAINED_LESSON_IDS` = 44,
  `A1_REHOMED_LESSON_IDS` = 20; the intersection of retained and rehomed is empty, and the
  intersection of Base lesson IDs with retained A1 lesson IDs is empty. The five rehomed
  modules (`sounds`, `sentence-foundations`, `topic-questions`, `polite-verbs`,
  `time-movement`) survive in `src/course/a1/curriculum/inheritedBase.ts` only as a derived
  provenance record seeding A1's cumulative lexical closure — never as learner-visible A1
  lessons. Retained A1 therefore reuses Base vocabulary as *reviewed*, and cannot duplicate
  or contradict it, because the inherited set is read from the rehomed lessons' own
  `newLexemeIds` rather than hand-maintained.
- **13 — A2 immutability.** `git --no-pager diff --stat master...HEAD -- src/course/a2`
  produces no output. A2 is provably untouched.
