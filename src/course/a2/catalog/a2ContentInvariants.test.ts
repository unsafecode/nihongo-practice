/**
 * A2 content invariants (Phase 4 Tasks 6-13).
 *
 * Seven deterministic validators for the defect classes the Phase 3
 * double-check review found ungated. Every one of them is derived either from
 * the realized surface or from typed catalog data — never from an allow-list
 * of the specific ids that happened to be wrong, so a *new* offender authored
 * next year is caught too.
 *
 * These complement `a2RealizedIntegrity.test.ts` (duplicate terminal か,
 * `carriesOwnTopic` double topics, proper-name subject/copy agreement) rather
 * than replacing it.
 */
import { describe, expect, it } from "vitest";

import { realizeVariant } from "../../foundations/realizeFamily";
import type { SemanticValue, SentenceFamily, SentenceVariant } from "../../foundations/types";
import { a2SemanticBuiltLessons } from "./catalog";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "./a2SemanticCatalog";

const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
// Populated here for Tasks 7-13 validators appended below; unused by C1a.
const valueById = new Map<string, SemanticValue>(a2SemanticValues.map((v) => [v.id, v]));
const realizeCatalogs = {
  contexts: a2Contexts,
  personRoles: a2PersonRoles,
  referents: a2Referents,
  semanticValues: a2SemanticValues,
  learningTargetSenses: a2LearningTargetSenses,
};

/** One realized A2 surface plus everything the validators below need. */
interface RealizedRow {
  readonly id: string;
  readonly lessonId: string;
  readonly jp: string;
  readonly en: string;
  readonly it: string;
  readonly variant: SentenceVariant;
  readonly contextId: string;
  readonly predicateValueId: string | undefined;
  readonly subjectValueId: string | undefined;
}

/** Realizes every authored A2 model + transfer exactly once. */
const ROWS: readonly RealizedRow[] = a2SemanticBuiltLessons.flatMap((built) =>
  built.variants.map((variant) => {
    const family = famById.get(variant.sentenceFamilyId);
    if (!family) throw new Error(`unknown family for ${variant.id}`);
    const realized = realizeVariant(family, variant, realizeCatalogs, {
      availableConceptIds: [...family.requiredConceptIds],
    });
    if (!realized.ok) {
      throw new Error(`realize ${variant.id} failed: ${JSON.stringify(realized.errors)}`);
    }
    return {
      id: variant.id,
      lessonId: built.recipe.id,
      jp: realized.sentence.canonicalJapanese,
      en: built.en[`${variant.id}-translation`] ?? "",
      it: built.it[`${variant.id}-translation`] ?? "",
      variant,
      contextId: variant.contextId,
      predicateValueId: variant.slotValues.predicate,
      subjectValueId: variant.slotValues.subject,
    };
  }),
);

/**
 * The closed class of clause-initial discourse interjections A2 teaches. This
 * is a grammatical class, not a list of offending ids: any future value that
 * opens with one of these is covered automatically.
 */
const CLAUSE_INITIAL_INTERJECTIONS = [
  "すみません",
  "ありがとうございます",
  "ごめんなさい",
] as const;

/** `Xは` immediately followed by a clause-initial interjection. */
const TOPIC_BEFORE_INTERJECTION = new RegExp(
  `^[^、。]{1,10}は(${CLAUSE_INITIAL_INTERJECTIONS.join("|")})`,
);

describe("C1a — no topic phrase before a clause-initial interjection", () => {
  it("never emits `Xは` immediately before すみません / ありがとうございます / ごめんなさい", () => {
    const offenders = ROWS.filter((row) => TOPIC_BEFORE_INTERJECTION.test(row.jp)).map(
      (row) => `${row.id}: ${row.jp}`,
    );
    expect(offenders).toEqual([]);
  });
});

/** Predicate semantic types that never accept an animate grammatical topic. */
const IMPERSONAL_PREDICATE_TYPES = new Set<NonNullable<SemanticValue["predicateSemanticType"]>>([
  "quantity",
  "weather",
  "formula",
]);

describe("C1b — no animate topic over an impersonal predicate", () => {
  it("declares a predicateSemanticType on exactly these five impersonal values", () => {
    const typed = a2SemanticValues.filter((value) => value.predicateSemanticType !== undefined);
    expect(typed.map((value) => value.id).sort()).toEqual([
      "a2-value-kara-ame-kasa",
      "a2-value-node-ame-futta-uchi",
      "a2-value-node-ame-ie",
      "a2-value-reply-arigatougozaimasu",
      "a2-value-resv-hitori-desu",
    ]);
  });

  it("only ever declares predicateSemanticType on predicate-sense values", () => {
    const misplaced = a2SemanticValues
      .filter((value) => value.predicateSemanticType !== undefined && value.kind !== "predicate-sense")
      .map((value) => `${value.id}: kind=${value.kind}`);
    expect(misplaced).toEqual([]);
  });

  it("never gives an impersonal predicate an explicit animate topic", () => {
    const offenders = ROWS.filter((row) => {
      if (row.variant.discourse.subjectRealization !== "explicit") return false;
      const predicate = row.predicateValueId ? valueById.get(row.predicateValueId) : undefined;
      if (!predicate?.predicateSemanticType) return false;
      if (!IMPERSONAL_PREDICATE_TYPES.has(predicate.predicateSemanticType)) return false;
      const subject = row.subjectValueId ? valueById.get(row.subjectValueId) : undefined;
      return subject?.animacy === "animate";
    }).map((row) => `${row.id}: ${row.jp} [${valueById.get(row.predicateValueId ?? "")?.predicateSemanticType}]`);
    expect(offenders).toEqual([]);
  });
});

/**
 * Polite sentence-final endings A2 teaches, with the optional sentence-final
 * particles か/ね/よ. Anything else that ends a `。`-delimited sentence is
 * plain register. Only sentence-final position is inspected, so subordinate
 * clauses joined by て-form, から or ので never register as a second predicate.
 */
const POLITE_SENTENCE_END =
  /(です|ます|ません|でした|ました|ませんでした|ましょう)[かねよ]?$/;

describe("C2 — one register per realized sentence", () => {
  it("never mixes plain and polite sentence-final predicates inside one surface", () => {
    const offenders = ROWS.filter((row) => {
      const sentences = row.jp.split("。").filter((part) => part.trim().length > 0);
      if (sentences.length < 2) return false;
      const registers = new Set(sentences.map((s) => POLITE_SENTENCE_END.test(s)));
      return registers.size > 1;
    }).map((row) => `${row.id}: ${row.jp}`);
    expect(offenders).toEqual([]);
  });
});

describe("C3 — service titles fit the addressee's context", () => {
  it("declares serviceTitleContexts on every service-role address value", () => {
    // Intentionally red until Task 15 authors the front-desk and reception
    // address values (a2-value-frontdesk-subject, a2-value-reception-subject);
    // the assertion is the contract those values must meet.
    const declared = a2SemanticValues
      .filter((value) => value.serviceTitleContexts !== undefined)
      .map((value) => value.id)
      .sort();
    expect(declared).toEqual([
      "a2-value-clerk-subject",
      "a2-value-frontdesk-subject",
      "a2-value-reception-subject",
    ]);
  });

  it("never addresses a service role by a title its context does not license", () => {
    const offenders = ROWS.filter((row) => {
      if (row.variant.discourse.subjectRealization !== "vocative") return false;
      const subject = row.subjectValueId ? valueById.get(row.subjectValueId) : undefined;
      const allowed = subject?.serviceTitleContexts;
      if (!allowed) return false;
      return !allowed.includes(row.contextId);
    }).map((row) => `${row.id}: ${row.jp} [${row.contextId}]`);
    expect(offenders).toEqual([]);
  });
});

/**
 * English subject phrases that name a *specific* third party — including
 * named personas, third-person pronouns (She/He/They), and role nouns.
 * Impersonal "you"/"we"/"one" are deliberately absent: an impersonal gloss
 * over a subjectless Japanese sentence is correct, a specific one is not.
 */
const SPECIFIC_THIRD_PERSON_SUBJECT =
  /^(Sora|Emi|She|He|They|The teacher|My teacher|A friend|My friend|The friend|Your friend|A colleague|My colleague|The colleague|The clerk)\b/;

describe("C4 — gloss subject perspective matches the Japanese", () => {
  it("never glosses a subjectless Japanese sentence with a specific third-person subject", () => {
    const offenders = ROWS.filter(
      (row) =>
        row.variant.discourse.subjectRealization === "omitted" &&
        SPECIFIC_THIRD_PERSON_SUBJECT.test(row.en),
    ).map((row) => `${row.id}: ${row.jp} | ${row.en}`);
    expect(offenders).toEqual([]);
  });
});

/** "…says thank you" / "…said sorry" — attributing a fixed formula to someone. */
const GLOSS_REPORTS_A_FORMULA =
  /\b(says?|said)\s+(thank you|thanks|sorry|hello|goodbye|excuse me)\b/i;
/**
 * Quotative と plus any inflection of the speech verbs A2 teaches (言う, 話す).
 * Stem-based rather than a closed conjugation list so that te-forms
 * (…といってください), negatives (…といわないでください, …とはなさないでください)
 * and progressives are recognised as genuine quotative structure instead of
 * being flagged as missing it.
 *
 * 言う stems: いい (polite / continuative), いう (plain present), いっ (geminate
 * for て-form), いわ (irrealis for plain negative といわない-).
 * 話す stems: はなし (polite / continuative), はなす (plain present), はなさ
 * (irrealis for plain negative とはなさない-).
 */
const HAS_QUOTATIVE_STRUCTURE = /と(いい|いう|いっ|いわ|はなし|はなす|はなさ)/;

describe("C5 — reported speech is structurally reported", () => {
  it("requires quotative と + a speech verb whenever the gloss attributes a formula", () => {
    const offenders = ROWS.filter(
      (row) => GLOSS_REPORTS_A_FORMULA.test(row.en) && !HAS_QUOTATIVE_STRUCTURE.test(row.jp),
    ).map((row) => `${row.id}: ${row.jp} | ${row.en}`);
    expect(offenders).toEqual([]);
  });

  // Currently vacuous: no corpus row carries 「. This is a forward gate — once
  // quoted speech is authored, both glosses must carry a reporting verb or this
  // goes red.
  it("requires both English and Italian glosses to carry a reporting verb whenever the Japanese carries quotation marks", () => {
    const offenders = ROWS.filter(
      (row) =>
        row.jp.includes("「") &&
        !(/\b(says?|said)\b/i.test(row.en) && /\b(dice|ha detto|dicono)\b/i.test(row.it)),
    ).map((row) => `${row.id}: ${row.jp} | ${row.en} | ${row.it}`);
    expect(offenders).toEqual([]);
  });
});

const COMPARISON_FAMILY_IDS = new Set(["a2-family-comparison-favor", "a2-family-superlative"]);
const COMPARISON_OBJECT_SLOTS = ["favored", "standard"] as const;

describe("C6 — comparisons compare comparable things", () => {
  it("declares a comparisonDimension on every comparison adjective stem", () => {
    const stems = new Set<string>();
    for (const row of ROWS) {
      if (!COMPARISON_FAMILY_IDS.has(row.variant.sentenceFamilyId)) continue;
      if (row.predicateValueId) stems.add(row.predicateValueId);
    }
    const undeclared = [...stems]
      .filter((id) => valueById.get(id)?.comparisonDimension === undefined)
      .sort();
    expect(undeclared).toEqual([]);
  });

  it("declares comparableDimensions on every object used in a comparison slot", () => {
    const objects = new Set<string>();
    for (const row of ROWS) {
      if (!COMPARISON_FAMILY_IDS.has(row.variant.sentenceFamilyId)) continue;
      for (const slot of COMPARISON_OBJECT_SLOTS) {
        const id = row.variant.slotValues[slot];
        if (id) objects.add(id);
      }
    }
    const undeclared = [...objects]
      .filter((id) => valueById.get(id)?.comparableDimensions === undefined)
      .sort();
    expect(undeclared).toEqual([]);
  });

  it("never compares two things along a dimension one of them lacks", () => {
    const offenders: string[] = [];
    for (const row of ROWS) {
      if (!COMPARISON_FAMILY_IDS.has(row.variant.sentenceFamilyId)) continue;
      const dimension = row.predicateValueId
        ? valueById.get(row.predicateValueId)?.comparisonDimension
        : undefined;
      // Rows with no declared comparisonDimension are skipped here because
      // C6's first test already gates that case, so this test's coverage is
      // complete only while that test is green.
      if (!dimension) continue;
      for (const slot of COMPARISON_OBJECT_SLOTS) {
        const id = row.variant.slotValues[slot];
        if (!id) continue;
        const dimensions = valueById.get(id)?.comparableDimensions ?? [];
        if (!dimensions.includes(dimension)) {
          offenders.push(`${row.id}: ${slot}=${id} lacks "${dimension}" (${row.jp})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * Curated locative-gloss gate. Each entry pairs a locative phrase that must
 * not appear in a gloss unless the Japanese contains the corresponding word.
 * Deliberately small and exact rather than a general gloss-alignment engine,
 * which the catalog cannot support without per-fragment gloss authoring
 * (recorded as future work in the Phase 4 backlog).
 */
const LOCATIVE_GLOSS_RULES: readonly {
  readonly label: string;
  readonly en: RegExp;
  readonly it: RegExp;
  readonly requiredJapanese: string;
}[] = [
  { label: "sea", en: /\bin the sea\b/i, it: /\bnel mare\b/i, requiredJapanese: "うみ" },
  { label: "here", en: /\bhere\b/i, it: /\bqui\b/i, requiredJapanese: "ここ" },
];

describe("C7 — glosses do not invent a place the Japanese never names", () => {
  it.each(LOCATIVE_GLOSS_RULES)(
    "never claims $label unless the Japanese contains $requiredJapanese",
    (rule) => {
      const offenders = ROWS.filter(
        (row) =>
          (rule.en.test(row.en) || rule.it.test(row.it)) &&
          !row.jp.includes(rule.requiredJapanese),
      ).map((row) => `${row.id}: ${row.jp} | ${row.en} | ${row.it}`);
      expect(offenders).toEqual([]);
    },
  );
});
