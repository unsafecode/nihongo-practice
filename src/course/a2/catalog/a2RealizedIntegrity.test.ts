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
});
