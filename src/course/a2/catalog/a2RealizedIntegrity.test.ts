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
import { a2AllVariants } from "./catalog";
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
