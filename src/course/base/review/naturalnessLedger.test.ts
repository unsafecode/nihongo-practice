import { describe, expect, it } from "vitest";

import {
  BASE_AUDIO_REVIEW_INVENTORY,
  BASE_AUDIO_REVIEW_VALIDATION,
} from "../audio/reviewLedger";
import {
  BASE_NATURALNESS_REVIEW_INVENTORY,
  BASE_NATURALNESS_REVIEW_VALIDATION,
  BASE_NATURALNESS_CURRENT_CORPUS_FINGERPRINT,
  validateBaseNaturalnessReviewInventory,
} from "./naturalnessLedger";
import * as naturalnessLedger from "./naturalnessLedger";
import { canonicalReviewFingerprint } from "./fingerprint";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import { BASE_AUDIO_CATALOG } from "../audio/catalog";
import { BASE_REFERENCE_SNAPSHOTS } from "../catalog/concepts";
import { BASE_LEXICON } from "../catalog/lexicon";
import { BASE_SOUND_MODULE } from "../content/module01Sounds";
import { BASE_SENTENCE_FOUNDATIONS_MODULE } from "../content/module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_MODULE } from "../content/module03TopicQuestions";
import { BASE_POLITE_VERBS_MODULE } from "../content/module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_MODULE } from "../content/module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_MODULE } from "../content/module06TimeMovement";
import { BASE_COPULA_ADJECTIVES_MODULE } from "../content/module07CopulaAdjectives";
import { BASE_EXISTENCE_LOCATION_MODULE } from "../content/module08ExistenceLocation";
import { BASE_REQUESTS_CONNECTION_MODULE } from "../content/module09RequestsConnection";
import { BASE_SYNTHESIS_MODULE } from "../content/module10Synthesis";
import { BASE_REFERENCE_CATALOG } from "../references/catalog";

const semanticLessons = [
  ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons,
  ...BASE_TOPIC_QUESTIONS_MODULE.lessons,
  ...BASE_POLITE_VERBS_MODULE.lessons,
  ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
  ...BASE_TIME_MOVEMENT_MODULE.lessons,
  ...BASE_COPULA_ADJECTIVES_MODULE.lessons,
  ...BASE_EXISTENCE_LOCATION_MODULE.lessons,
  ...BASE_REQUESTS_CONNECTION_MODULE.lessons,
  ...BASE_SYNTHESIS_MODULE.lessons,
];

function independentlyReachableCopySourceIds(): Readonly<{
  direct: ReadonlySet<string>;
  all: ReadonlySet<string>;
}> {
  const direct = new Set<string>();
  const all = new Set<string>();
  const addDirect = (id: string | null | undefined) => {
    if (
      id &&
      typeof baseNavigationCopyEn.content[id] === "string" &&
      typeof baseNavigationCopyIt.content[id] === "string"
    ) {
      direct.add(id);
      all.add(id);
    }
  };

  for (const lexeme of BASE_LEXICON) addDirect(lexeme.meaningCopyId);
  for (const snapshot of BASE_REFERENCE_SNAPSHOTS) {
    addDirect(snapshot.titleCopyId);
  }
  const addReferenceCopy = (sourceId: string) => {
    all.add(`${sourceId}:label`);
    all.add(`${sourceId}:explanation`);
  };
  for (const reference of BASE_REFERENCE_CATALOG) {
    const prefix = `inline:reference:${reference.id}`;
    addReferenceCopy(`${prefix}:definition`);
    for (const column of reference.columns) {
      addReferenceCopy(`${prefix}:column:${column.id}`);
    }
    for (const entry of reference.entries) {
      addReferenceCopy(`${prefix}:entry:${entry.semanticId}`);
    }
    for (const cell of reference.cells) {
      addReferenceCopy(`${prefix}:cell:${cell.id}`);
    }
  }
  for (const record of BASE_AUDIO_CATALOG) {
    addDirect(record.failureStateIds.failed);
    addDirect(record.failureStateIds.unavailable);
    addDirect(record.failureStateIds.retryControl);
  }
  for (const lesson of BASE_SOUND_MODULE.lessons) {
    addDirect(lesson.content.recapCopyId);
    addDirect(lesson.content.phoneticExplanationCopyId);
    addDirect(lesson.content.contrastMapId);
    for (const anchor of lesson.anchorWords) addDirect(anchor.meaningCopyId);
    for (const activity of lesson.content.activities) {
      addDirect(activity.instructionCopyId);
      addDirect(activity.acceptedFeedbackCopyId);
      addDirect(activity.retryFeedbackCopyId);
    }
    all.add(`inline:${lesson.content.lessonId}:scope-note`);
    for (const item of lesson.contrastiveItems) {
      all.add(
        `inline:${lesson.content.lessonId}:contrast:${item.id}:explanation`,
      );
    }
    for (const anchor of lesson.anchorWords) {
      all.add(`inline:${lesson.content.lessonId}:anchor:${anchor.id}:status`);
    }
    for (const coverage of lesson.inventoryCoverage) {
      if (coverage.rationale) {
        all.add(
          `inline:${lesson.content.lessonId}:coverage:${coverage.inventoryId}:rationale`,
        );
      }
    }
  }
  all.add("inline:sounds:out-of-scope");

  for (const lesson of semanticLessons) {
    addDirect(lesson.titleCopyId);
    addDirect(lesson.objectiveCopyId);
    addDirect(lesson.content.recapCopyId);
    addDirect(lesson.explanation.mainCopyId);
    addDirect(lesson.explanation.constructionCopyId);
    addDirect(lesson.explanation.constraintsCopyId);
    addDirect(lesson.explanation.commonErrorCopyId);
    addDirect(lesson.explanation.nearestContrastId);
    for (const example of lesson.examples) {
      addDirect(
        "copyId" in example.translationCopy
          ? example.translationCopy.copyId
          : example.translationCopy.enCopyId,
      );
      addDirect(example.teachingPurposeCopyId);
      addDirect(example.contextCopyId);
    }
    if (lesson.dialogue) {
      addDirect(lesson.dialogue.practicalOutcomeCopyId);
      for (const copy of lesson.dialogue.turnCopy) {
        addDirect(copy.translationCopyId);
        addDirect(copy.purposeCopyId);
      }
    }
    for (const activity of lesson.content.activities) {
      addDirect(activity.instructionCopyId);
      addDirect(activity.acceptedFeedbackCopyId);
      addDirect(activity.retryFeedbackCopyId);
    }
    for (const design of lesson.activityDesigns) {
      addDirect(design.promptContextCopyId);
    }
  }

  for (const id of Object.keys(baseNavigationCopyEn.modules)) {
    all.add(`navigation:module:${id}:title`);
  }
  for (const id of Object.keys(baseNavigationCopyEn.lessons)) {
    all.add(`navigation:lesson:${id}:title`);
  }
  for (const id of Object.keys(baseNavigationCopyEn.objectives)) {
    all.add(`navigation:objective:${id}`);
  }
  for (const id of Object.keys(baseNavigationCopyEn.outcomes)) {
    all.add(`navigation:outcome:${id}`);
  }
  return { direct, all };
}

describe("independent Base naturalness inventory", () => {
  it("uses a type-safe canonical fingerprint encoding", () => {
    expect(canonicalReviewFingerprint(undefined)).not.toBe(
      canonicalReviewFingerprint("<undefined>"),
    );
    expect(canonicalReviewFingerprint({ b: 2, a: 1 })).toBe(
      canonicalReviewFingerprint({ a: 1, b: 2 }),
    );
  });

  it("enumerates every required learner-visible Japanese surface with provenance", () => {
    expect(BASE_NATURALNESS_REVIEW_INVENTORY.length).toBeGreaterThan(0);
    expect(
      new Set(BASE_NATURALNESS_REVIEW_INVENTORY.map(({ sourceKind }) => sourceKind)),
    ).toEqual(
      new Set([
        "example",
        "dialogue-turn",
        "prompt",
        "option",
        "accepted-answer",
        "spoken-answer",
        "audio-string",
        "localized-copy",
      ]),
    );

    for (const entry of BASE_NATURALNESS_REVIEW_INVENTORY) {
      expect(entry.contentId).not.toBe("");
      expect(entry.lessonId).not.toBe("");
      expect(entry.sourceId).not.toBe("");
      expect(entry.jp).not.toBe("");
      expect(entry.en.trim(), `${entry.contentId}:en`).not.toBe("");
      expect(entry.it.trim(), `${entry.contentId}:it`).not.toBe("");
      expect(entry.fingerprint).toMatch(/^[a-f0-9]{64}$/u);
      expect(entry.status).toBe("pending");
      expect(entry).not.toHaveProperty("reviewerIdentity");
      expect(entry).not.toHaveProperty("reviewedAt");
    }
    expect(BASE_NATURALNESS_REVIEW_VALIDATION.errors).toEqual([]);
  });

  it("covers every independently reachable localized copy and excludes only dead operation feedback", () => {
    const expected = independentlyReachableCopySourceIds();
    const actual = new Set(
      BASE_NATURALNESS_REVIEW_INVENTORY.filter(
        ({ sourceKind }) => sourceKind === "localized-copy",
      ).map(({ sourceId }) => sourceId),
    );

    expect([...actual].sort()).toEqual([...expected.all].sort());

    const dead = Object.keys(baseNavigationCopyEn.content)
      .filter((id) => !expected.direct.has(id))
      .sort();
    const unusedOperations = [
      "diagnose-error",
      "discriminate-form-function",
      "identify-audio",
      "order-chunks",
      "produce-controlled",
      "produce-spoken",
      "recognize-meaning",
      "retrieve-cumulative",
      "select-contextual-response",
      "transform-form",
    ];
    expect(dead).toEqual(
      unusedOperations
        .flatMap((operation) => [
          `${operation}-feedback-accepted`,
          `${operation}-feedback-retry`,
        ])
        .sort(),
    );
    expect(dead.some((id) => actual.has(id))).toBe(false);
  });

  it("covers every localized field rendered by the five reference view models", () => {
    const bySourceId = new Map(
      BASE_NATURALNESS_REVIEW_INVENTORY.map((entry) => [
        entry.sourceId,
        entry,
      ]),
    );
    const expectCopy = (
      sourceId: string,
      copy: Readonly<{
        readonly en: Readonly<{
          readonly label: string;
          readonly explanation: string;
        }>;
        readonly it: Readonly<{
          readonly label: string;
          readonly explanation: string;
        }>;
      }>,
    ) => {
      for (const field of ["label", "explanation"] as const) {
        expect(bySourceId.get(`${sourceId}:${field}`)).toMatchObject({
          en: copy.en[field],
          it: copy.it[field],
          sourceKind: "localized-copy",
          status: "pending",
        });
      }
    };

    for (const reference of BASE_REFERENCE_CATALOG) {
      const prefix = `inline:reference:${reference.id}`;
      expectCopy(`${prefix}:definition`, reference.copy);
      for (const column of reference.columns) {
        expectCopy(`${prefix}:column:${column.id}`, column.copy);
      }
      for (const entry of reference.entries) {
        expectCopy(`${prefix}:entry:${entry.semanticId}`, entry.copy);
      }
      for (const cell of reference.cells) {
        expectCopy(`${prefix}:cell:${cell.id}`, cell.copy);
      }
    }
  });

  it("changes the corpus fingerprint for every localized registry section and upstream source", () => {
    const fingerprintFor = (
      naturalnessLedger as unknown as {
        readonly baseNaturalnessCorpusFingerprintForSources?: (
          overrides?: Readonly<Record<string, unknown>>,
        ) => string;
      }
    ).baseNaturalnessCorpusFingerprintForSources;
    expect(fingerprintFor).toBeTypeOf("function");
    if (!fingerprintFor) return;

    const mutateCopy = (
      mutate: (copy: Record<string, Record<string, unknown>>) => void,
    ) => {
      const copy = structuredClone(baseNavigationCopyEn) as unknown as Record<
        string,
        Record<string, unknown>
      >;
      mutate(copy);
      return fingerprintFor({ copyEn: copy });
    };
    const changed = [
      mutateCopy((copy) => {
        (copy.modules.sounds as { title: string }).title += " changed";
      }),
      mutateCopy((copy) => {
        (copy.lessons["sounds-1"] as { title: string }).title += " changed";
      }),
      mutateCopy((copy) => {
        copy.objectives[Object.keys(copy.objectives)[0]] = "changed objective";
      }),
      mutateCopy((copy) => {
        copy.outcomes[Object.keys(copy.outcomes)[0]] = "changed outcome";
      }),
      mutateCopy((copy) => {
        copy.content[BASE_LEXICON[0].meaningCopyId] = "changed meaning";
      }),
      mutateCopy((copy) => {
        const title = BASE_REFERENCE_SNAPSHOTS.find(
          ({ titleCopyId }) =>
            typeof copy.content[titleCopyId] === "string",
        )?.titleCopyId;
        if (!title) throw new Error("Missing localized reference title.");
        copy.content[title] = "changed reference title";
      }),
    ];
    const soundModule = structuredClone(BASE_SOUND_MODULE);
    (
      soundModule.lessons[0].scopeNote as { en: string; it: string }
    ).en += " changed";
    changed.push(fingerprintFor({ soundModule }));
    const soundExplanation = structuredClone(BASE_SOUND_MODULE);
    (
      soundExplanation.lessons[0].contrastiveItems[0].explanation as {
        en: string;
        it: string;
      }
    ).en += " changed";
    changed.push(fingerprintFor({ soundModule: soundExplanation }));
    const soundCoverage = structuredClone(BASE_SOUND_MODULE);
    const rationale = soundCoverage.lessons
      .flatMap(({ inventoryCoverage }) => inventoryCoverage)
      .find((coverage) => coverage.rationale)?.rationale as
      | { en: string; it: string }
      | undefined;
    if (!rationale) throw new Error("Missing sound coverage rationale.");
    rationale.en += " changed";
    changed.push(fingerprintFor({ soundModule: soundCoverage }));
    const soundAnchorStatus = structuredClone(BASE_SOUND_MODULE);
    (
      soundAnchorStatus.lessons[0].anchorWords[0].status as {
        en: string;
        it: string;
      }
    ).en += " changed";
    changed.push(fingerprintFor({ soundModule: soundAnchorStatus }));
    const soundOutOfScope = structuredClone(BASE_SOUND_MODULE);
    (
      soundOutOfScope.outOfScope as { en: string; it: string }
    ).en += " changed";
    changed.push(fingerprintFor({ soundModule: soundOutOfScope }));
    const lexemes = structuredClone(BASE_LEXICON);
    (lexemes[0] as { kana: string }).kana += "あ";
    changed.push(fingerprintFor({ lexemes }));
    const referenceCatalog = structuredClone(BASE_REFERENCE_CATALOG);
    (referenceCatalog[0].copy.en as { label: string }).label =
      "Changed reference label";
    changed.push(fingerprintFor({ referenceCatalog }));
    const lessons = structuredClone(semanticLessons);
    (lessons[0].examples[0].tokens[0] as { jp: string }).jp += "あ";
    changed.push(fingerprintFor({ semanticLessons: lessons }));
    const audioCatalog = structuredClone(BASE_AUDIO_CATALOG);
    (audioCatalog[0].meaning as { en: string; it: string }).en += " changed";
    changed.push(fingerprintFor({ audioCatalog }));

    expect(
      changed.every(
        (fingerprint) =>
          fingerprint !== BASE_NATURALNESS_CURRENT_CORPUS_FINGERPRINT,
      ),
    ).toBe(true);
    // This case re-hashes the whole localized corpus once per registry section
    // and upstream source. It runs in ~3s alone but can exceed the 5s default
    // under a fully parallel suite, which made the full run flaky; the explicit
    // budget is generous headroom, not a relaxed assertion.
  }, 30_000);

  it("detects stale fingerprints without invoking hostile accessors", () => {
    const [first, ...rest] = BASE_NATURALNESS_REVIEW_INVENTORY;
    expect(first).toBeDefined();
    const stale = [{ ...first, fingerprint: "0".repeat(64) }, ...rest];
    expect(validateBaseNaturalnessReviewInventory(stale).ok).toBe(false);

    let getterCalls = 0;
    const hostile = Object.defineProperty([], "0", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return first;
      },
    });
    expect(validateBaseNaturalnessReviewInventory(hostile).ok).toBe(false);
    expect(getterCalls).toBe(0);
  });

  it("gives distinct Italian semantic cues distinct translations", () => {
    const allowedSharedNeutralItalian = new Set([
      "L'enunciato scritto corrisponde all'intera registrazione.",
      "Riascolta tutto prima di confrontare le opzioni.",
    ]);
    const byItalian = new Map<string, Map<string, string[]>>();

    for (const [id, english] of Object.entries(baseNavigationCopyEn.content)) {
      const italian = baseNavigationCopyIt.content[id];
      expect(italian, id).toBeDefined();
      const byEnglish = byItalian.get(italian) ?? new Map<string, string[]>();
      byEnglish.set(english, [...(byEnglish.get(english) ?? []), id]);
      byItalian.set(italian, byEnglish);
    }

    const collisions = [...byItalian]
      .filter(
        ([italian, byEnglish]) =>
          byEnglish.size > 1 && !allowedSharedNeutralItalian.has(italian),
      )
      .map(([italian, byEnglish]) => ({
        italian,
        meanings: [...byEnglish],
      }));
    expect(collisions).toEqual([]);
  });

  it("keeps internal project labels out of learner-visible copy", () => {
    const forbidden =
      /\bTask \d+\b|\bengine\b|\bauthored\b|\b(?:SF|TQ|PV|TM)\d\b|\bstored\b|motore.*Task|(?:classe|forma|regola|voce|analisi|cambiamento) registrat[oaie]/iu;
    const offending = BASE_NATURALNESS_REVIEW_INVENTORY
      .filter(({ sourceKind }) => sourceKind === "localized-copy")
      .map(({ contentId: id, en: english, it: italian }) => ({
        id,
        english,
        italian,
      }))
      .filter(({ english, italian }) => forbidden.test(`${english}\n${italian}`));

    expect(offending).toEqual([]);
  });

  it("excludes coined Japanese analysis labels and sentence-appended role tags", () => {
    const forbidden =
      /ふたつのぶんせき|するぐみ|くるぐみ|ごかんのもと|おとだけ|もとのかたち|、(?:もくてきち|しんこうほうこう|ばしょ|しゅだん)$/u;
    const offending = BASE_NATURALNESS_REVIEW_INVENTORY.filter(
      ({ sourceKind, jp }) =>
        sourceKind !== "localized-copy" && forbidden.test(jp),
    ).map(({ contentId, jp }) => ({ contentId, jp }));

    expect(offending).toEqual([]);
  });

  it("gives every retained Japanese analysis label an English and Italian gloss", () => {
    const retainedLabels = [
      "しゅうかん",
      "これから",
      "ばしょ",
      "しゅだん",
      "じしょけい",
      "みだしご",
      "げんけい",
      "じゅつご",
      "どうし",
      "ぶんまつのじゅつご",
      "れんようけい",
      "どうしのぶんるい",
      "どのしゅるいですか",
      "きいてください",
      "ごびだけ",
      "じしょけいかられんようけい",
      "れいがい",
      "とうちゃくてん",
      "ほうこう",
    ];
    const unglossed = BASE_NATURALNESS_REVIEW_INVENTORY.filter(
      ({ sourceKind }) => sourceKind !== "localized-copy",
    ).flatMap(({ contentId, jp, en, it }) =>
      retainedLabels
        .filter(
          (label) =>
            jp.includes(label) &&
            (en.includes(`「${label}」`) || it.includes(`「${label}」`)),
        )
        .map((label) => ({ contentId, label })),
    );

    expect(unglossed).toEqual([]);
  });

  it("uses literal fallback glosses only for deliberately malformed visible forms", () => {
    const fallbackSurfaces = new Set(
      BASE_NATURALNESS_REVIEW_INVENTORY.filter(
        ({ sourceKind }) => sourceKind !== "localized-copy",
      ).flatMap(({ en }) =>
        [...en.matchAll(/「([^」]+)」/gu)].map((match) => match[1]),
      ),
    );

    expect([...fallbackSurfaces].sort()).toEqual(
      [
        "あらいましたた",
        "いいて",
        "いき",
        "おきるます",
        "かえ",
        "かきますた",
        "きくます",
        "たかいだ",
        "つくり",
        "ねるます",
        "はなすます",
        "みせましだ",
        "やすむます",
        "よみまし",
      ].sort(),
    );
  });

  it("keeps reviewed zero-subject, title, person, focus, and request translations exact", () => {
    const expected = {
      "requests-connection-2-example-9-translation": {
        en: "Excuse me—please.",
        it: "Mi scusi, per favore.",
      },
      "copula-adjectives-4-example-8-translation": {
        en: "They are a well-presented student.",
        it: "È uno studente dall'aspetto curato.",
      },
      "topic-questions-2-example-2-translation": {
        en: "Yamada is the one who is the lawyer.",
        it: "È Yamada a essere l'avvocato.",
      },
      "argument-particles-2-example-10-translation": {
        en: "I return home.",
        it: "Torno a casa.",
      },
      "argument-particles-4-example-6-translation": {
        en: "I come to the office.",
        it: "Vengo in ufficio.",
      },
      "sentence-foundations-4-example-1-translation": {
        en: "This is Sakura, the teacher.",
        it: "Questa è Sakura, l'insegnante.",
      },
      "sentence-foundations-4-example-2-translation": {
        en: "This is Ken, the teacher.",
        it: "Questo è Ken, l'insegnante.",
      },
    } as const;

    for (const [id, copy] of Object.entries(expected)) {
      expect(baseNavigationCopyEn.content[id], `${id}:en`).toBe(copy.en);
      expect(baseNavigationCopyIt.content[id], `${id}:it`).toBe(copy.it);
    }
  });
});

describe("independent Base audio inventory", () => {
  it("keeps all physical and semantic audio entries fresh and pending", () => {
    const physical = BASE_AUDIO_REVIEW_INVENTORY.filter(
      ({ sourceKind }) => sourceKind === "physical-asset",
    );
    const semantic = BASE_AUDIO_REVIEW_INVENTORY.filter(
      ({ sourceKind }) => sourceKind === "semantic-audio",
    );

    expect(physical).toHaveLength(50);
    expect(semantic.length).toBeGreaterThan(0);
    expect(BASE_AUDIO_REVIEW_VALIDATION.errors).toEqual([]);
    expect(
      BASE_AUDIO_REVIEW_INVENTORY.every(({ status }) => status === "pending"),
    ).toBe(true);
  });

  it.runIf(process.env.BASE_REQUIRE_INDEPENDENT_REVIEW === "1")(
    "blocks completion while independent naturalness or audio reviews are pending",
    () => {
      const pending = [
        ...BASE_NATURALNESS_REVIEW_INVENTORY,
        ...BASE_AUDIO_REVIEW_INVENTORY,
      ].filter(({ status }) => status === "pending");
      expect(pending).toHaveLength(0);
    },
  );
});
