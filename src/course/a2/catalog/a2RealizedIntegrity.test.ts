/**
 * A2 realized-content integrity gate (Phase 3 Task 7 repair).
 *
 * A fail-closed regression surface that realizes EVERY authored A2 sentence
 * variant through the shared realizer and rejects two generic defect classes
 * a fresh spec review found in frozen learner-facing answer keys — never a
 * brittle allow-list of the specific ids that happened to be wrong:
 *
 *  A. Duplicate terminal question particle. A predicate value that bakes its
 *     own sentence-final か combined with an interrogative form produces
 *     `…ですかか`. This scans every realized answer key for a duplicated
 *     terminal か and fails closed. Sentence-final か is only ever emitted by
 *     the interrogative realization rule or a value's own baked particle, so
 *     a terminal `かか` is always the composition bug and never a normal
 *     lexeme.
 *
 *  B. Double topic / incoherent explicit subject. A predicate value that is
 *     itself a self-contained, independently topical statement (a posted
 *     schedule/notice/form line, a self-topical message, a standalone
 *     reason-kara decision, a weather report) must never additionally be
 *     given an explicit grammatical subject/topic — doing so bakes two
 *     top-level は topics (`そらは…でんしゃは…`) or an incoherent person
 *     topic over an impersonal posted text. Rather than counting は
 *     (legitimate constructions nest contrastive/embedded は — e.g. a
 *     first-person opinion `わたしはこれはいいとおもいます`), this reads the
 *     typed `SemanticValue.carriesOwnTopic` flag: any variant whose resolved
 *     predicate value is so flagged AND whose discourse realizes an explicit
 *     subject is rejected.
 */
import { describe, expect, it } from "vitest";

import { realizeVariant } from "../../foundations/realizeFamily";
import type { SemanticValue, SentenceFamily, SentenceVariant } from "../../foundations/types";
import { a2AllVariants, a2SemanticBuiltLessons } from "./catalog";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "./a2SemanticCatalog";

const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
const valueById = new Map<string, SemanticValue>(a2SemanticValues.map((v) => [v.id, v]));
const realizeCatalogs = {
  contexts: a2Contexts,
  personRoles: a2PersonRoles,
  referents: a2Referents,
  semanticValues: a2SemanticValues,
  learningTargetSenses: a2LearningTargetSenses,
};

function realize(variant: SentenceVariant) {
  const fam = famById.get(variant.sentenceFamilyId);
  expect(fam, `family ${variant.sentenceFamilyId}`).toBeDefined();
  const r = realizeVariant(fam as SentenceFamily, variant, realizeCatalogs, {
    availableConceptIds: [...(fam as SentenceFamily).requiredConceptIds],
  });
  if (!r.ok) {
    throw new Error(`realize ${variant.id} failed: ${JSON.stringify(r.errors)}`);
  }
  return r.sentence;
}

/** Finding C — a NAMED person (proper name: Sora/Emi) added as an
 * untracked subject must appear in the copy. This complements finding B: B
 * only rejects an explicit subject over a value that already carries its own
 * baked topic (`carriesOwnTopic`), so a proper-name person added to a
 * NON-self-topical whole clause whose bilingual copy silently omits that
 * person slips past B entirely. Proper names are locale-invariant (they read
 * identically in EN and IT), so this check is exact and false-positive-free —
 * it is deliberately scoped to proper-name individuals, never common-noun
 * role/family subjects (friend/teacher/haha/…), whose copy realization is
 * locale-dependent. It is scoped to lines authored the M13/M14/M15 way — a
 * bare, untracked semantic value (`subjectReferentId === null`) — never a
 * genuine tracked-discourse-referent line (M1-M12's own, deliberately
 * different, `subjectReferent`-driven vocative convention), and never an
 * `"omitted"` subject (the legitimate impersonal case). */
const KNOWN_PERSON_NAME_SUBJECTS: Readonly<Record<string, RegExp>> = {
  "a2-value-sora": /\bsora\b/i,
  "a2-value-emi": /\bemi\b/i,
};

interface PersonNameSubjectCandidate {
  readonly id: string;
  readonly subjectValueId: string;
  readonly en: string;
  readonly it: string;
}

/** Every model+transfer whose subject is a known proper-name person value,
 * realized with an explicit/vocative (never "omitted") subject and authored
 * as a bare untracked value (`subjectReferentId === null`). Takes the built
 * lessons as a parameter so the detector can also be exercised against a
 * representative synthetic fixture. */
function collectUntrackedPersonNameSubjects(
  builtLessons: readonly { readonly variants: readonly SentenceVariant[]; readonly en: Readonly<Record<string, string>>; readonly it: Readonly<Record<string, string>> }[],
): PersonNameSubjectCandidate[] {
  const out: PersonNameSubjectCandidate[] = [];
  for (const built of builtLessons) {
    for (const variant of built.variants) {
      if (variant.discourse.subjectRealization === "omitted") continue;
      if (variant.discourse.subjectReferentId !== null) continue;
      const subjectValueId = variant.slotValues.subject;
      if (!subjectValueId || !(subjectValueId in KNOWN_PERSON_NAME_SUBJECTS)) continue;
      out.push({
        id: variant.id,
        subjectValueId,
        en: built.en[`${variant.id}-translation`] ?? "",
        it: built.it[`${variant.id}-translation`] ?? "",
      });
    }
  }
  return out;
}

/** Of the candidates, keep only those whose EN or IT copy fails to name the
 * added proper-name subject. */
function personNameCopyOffenders(
  candidates: readonly PersonNameSubjectCandidate[],
): PersonNameSubjectCandidate[] {
  return candidates.filter((c) => {
    const re = KNOWN_PERSON_NAME_SUBJECTS[c.subjectValueId];
    return !(re.test(c.en) && re.test(c.it));
  });
}

describe("A2 realized-content integrity — no duplicate terminal question particle (finding A)", () => {
  it("no realized variant answer key ends in a duplicated か (…かか)", () => {
    const offenders: string[] = [];
    for (const variant of a2AllVariants) {
      const jp = realize(variant).canonicalJapanese;
      if (/かか$/.test(jp)) {
        offenders.push(`${variant.id}: ${jp}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("A2 realized-content integrity — no double top-level topic (finding B)", () => {
  it("no explicit-subject variant composes an additional subject over a self-topical (carriesOwnTopic) value", () => {
    const offenders: string[] = [];
    for (const variant of a2AllVariants) {
      if (variant.discourse.subjectRealization !== "explicit") continue;
      const predId = variant.slotValues.predicate;
      if (!predId) continue;
      const value = valueById.get(predId);
      if (value?.carriesOwnTopic === true) {
        offenders.push(`${variant.id}: explicit subject over self-topical ${predId} → ${realize(variant).canonicalJapanese}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every carriesOwnTopic value is a whole-clause predicate-sense value (metadata is honest)", () => {
    // Guards the flag itself: `carriesOwnTopic` marks a self-contained,
    // whole-clause statement (a posted line, a self-contained message, a
    // standalone decision/weather report). It must therefore only ever sit
    // on a `predicate-sense` value — never on a bare object/referent/time
    // noun that legitimately fills a subject-less slot — so the gate above
    // stays anchored to real clause-level structure, not an arbitrary label.
    const dishonest: string[] = [];
    for (const value of a2SemanticValues) {
      if (value.carriesOwnTopic !== true) continue;
      if (value.kind !== "predicate-sense") {
        dishonest.push(`${value.id}: kind=${value.kind}`);
      }
    }
    expect(dishonest, dishonest.join("\n")).toEqual([]);
  });

  it("every whole-clause predicate-sense value that opens with a top-level topic AND contains an internal sentence boundary is marked carriesOwnTopic (mandatory-flag gate; excludes single-clause embedded opinion frames)", () => {
    // The complementary, forward direction of finding B: rather than only
    // rejecting an explicit subject over an already-flagged value, this
    // proves every value that is STRUCTURALLY a self-contained multi-clause
    // utterance opening with its own top-level topic は (a weather report,
    // a contrast/sequence connector like `きょうは…です。でも、…`) actually
    // carries the flag — so a future authoring omission fails closed instead
    // of silently re-admitting a double-topic answer key.
    //
    // The gate is deliberately anchored to real clause structure, never a
    // naive は count: it fires ONLY when BOTH (a) the value opens with a
    // top-level topic — its first fragment is a baked `…は` noun-topic, or a
    // bare noun immediately followed by a standalone は particle — AND (b) it
    // contains an INTERNAL sentence boundary (a 。 that is not the final
    // fragment), i.e. it is genuinely two independent clauses. This cleanly
    // EXCLUDES legitimate single-clause embedded opinion frames
    // (`これはいいとおもいます`, `わたしはそうおもいません`) and topic-fronted
    // questions (`びょういんはどこですか`), which are one clause with no
    // internal boundary and are never double-topic hazards.
    const opensWithTopLevelTopic = (fragments: SemanticValue["tokenFragments"]): boolean => {
      if (fragments.length === 0) return false;
      const first = fragments[0];
      if (first.jp.length > 1 && first.jp.endsWith("は")) return true;
      const second = fragments[1];
      return second !== undefined && second.jp === "は" && second.kind === "particle";
    };
    const hasInternalSentenceBoundary = (fragments: SemanticValue["tokenFragments"]): boolean =>
      fragments.some((f, i) => i < fragments.length - 1 && f.kind === "punctuation" && f.jp === "。");

    const unmarked: string[] = [];
    for (const value of a2SemanticValues) {
      if (value.kind !== "predicate-sense") continue;
      if (!opensWithTopLevelTopic(value.tokenFragments)) continue;
      if (!hasInternalSentenceBoundary(value.tokenFragments)) continue;
      if (value.carriesOwnTopic !== true) {
        unmarked.push(`${value.id}: ${value.tokenFragments.map((f) => f.jp).join("")}`);
      }
    }
    expect(unmarked, unmarked.join("\n")).toEqual([]);
  });
});

describe("A2 realized-content integrity — a named person added as an untracked subject must appear in the copy (finding C)", () => {
  it("the detector fires on a representative offender fixture and never on a correctly-named one", () => {
    const offender = {
      id: "fixture-offender",
      subjectValueId: "a2-value-sora",
      en: "The teacher will send a letter.",
      it: "L'insegnante manderà una lettera.",
    };
    const named = {
      id: "fixture-named",
      subjectValueId: "a2-value-sora",
      en: "Sora will send a letter.",
      it: "Sora manderà una lettera.",
    };
    expect(personNameCopyOffenders([offender]).map((o) => o.id)).toEqual(["fixture-offender"]);
    expect(personNameCopyOffenders([named])).toEqual([]);
  });

  it("at least one all-60 variant really adds an untracked proper-name (Sora/Emi) subject, so the sweep below is non-vacuous", () => {
    expect(collectUntrackedPersonNameSubjects(a2SemanticBuiltLessons).length).toBeGreaterThan(0);
  });

  it("no all-60 variant adds an untracked proper-name subject whose EN or IT copy omits that name", () => {
    const offenders = personNameCopyOffenders(collectUntrackedPersonNameSubjects(a2SemanticBuiltLessons));
    expect(
      offenders,
      offenders.map((o) => `${o.id} (${o.subjectValueId}): EN=${JSON.stringify(o.en)} IT=${JSON.stringify(o.it)}`).join("\n"),
    ).toEqual([]);
  });
});
