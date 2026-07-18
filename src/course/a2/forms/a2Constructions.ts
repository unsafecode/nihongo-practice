import type { A2Fragment, A2PlainForm } from "./a2Conjugation";

/**
 * The A2 grammar-spiral construction registry (Phase 3 Task 2, design spec
 * §7.1/L2). Every one of the 15 spiral forms is named here alongside the
 * Can-do it serves. `suffix` constructions additionally name the exact
 * plain base (`A2PlainForm`) they attach to and the fixed tail fragments
 * appended after it — `composeA2Construction` conjugates that base and
 * appends the tail. `clause`/`connector`/`plain-inflection` forms are not
 * suffixes: they combine whole clauses or add discourse tokens and are
 * realized as explicit sentence-family constructions in a later task, never
 * by attaching a morpheme to one verb.
 *
 * All verbal Japanese for the A2 form/aspect layer is authored here and in
 * `./a2Conjugation`, nowhere else.
 */

export type A2ConstructionKind =
  | "plain-inflection" // the four plain forms themselves (no extra tail)
  | "suffix" // conjugate a plain base, then append a fixed tail
  | "clause" // subordinate-clause family, realized in a later task (not a suffix)
  | "connector"; // discourse connector between sentences (not a suffix)

export interface A2Construction {
  readonly id: string;
  readonly kind: A2ConstructionKind;
  readonly canDoId: string;
  /** For `suffix` constructions: which conjugated plain base to build on. */
  readonly base?: A2PlainForm;
  /** For `suffix` constructions: fragments appended after the base. */
  readonly tail?: readonly A2Fragment[];
}

/** A standalone grammatical particle fragment (attaches with no boundary space; fully concatenated romaji). */
function P(jp: string, romaji: string): A2Fragment {
  return { jp, romaji, kind: "particle", boundaryBefore: "attach" };
}

/** A bound morpheme/word fragment appended after a conjugated base. */
function M(jp: string, romaji: string): A2Fragment {
  return { jp, romaji, kind: "morpheme", boundaryBefore: "attach" };
}

/** The 15 spiral forms (L2), each bound to its named Can-do. Suffix forms name their base + tail. */
export const A2_CONSTRUCTIONS: Readonly<Record<string, A2Construction>> = {
  "recognize-plain-forms": {
    id: "recognize-plain-forms",
    kind: "plain-inflection",
    canDoId: "a2-cando-recognize-plain-forms",
  },
  "sequence-te": {
    id: "sequence-te",
    kind: "suffix",
    canDoId: "a2-cando-sequence-te",
    base: "te",
    tail: [],
  },
  "ongoing-teiru": {
    id: "ongoing-teiru",
    kind: "suffix",
    canDoId: "a2-cando-ongoing-teiru",
    base: "te",
    tail: [M("います", "imasu")],
  },
  "request-tekudasai": {
    id: "request-tekudasai",
    kind: "suffix",
    canDoId: "a2-cando-request-tekudasai",
    base: "te",
    tail: [M("ください", "kudasai")],
  },
  "permission-temoii": {
    id: "permission-temoii",
    kind: "suffix",
    canDoId: "a2-cando-permission-temoii",
    base: "te",
    tail: [P("も", "mo"), M("いい", "ii"), M("です", "desu")],
  },
  "prohibition-tewaikenai": {
    id: "prohibition-tewaikenai",
    kind: "suffix",
    canDoId: "a2-cando-prohibition-tewaikenai",
    base: "te",
    tail: [P("は", "wa"), M("いけません", "ikemasen")],
  },
  "request-negative": {
    id: "request-negative",
    kind: "suffix",
    canDoId: "a2-cando-negative-request",
    base: "negative",
    tail: [M("で", "de"), M("ください", "kudasai")],
  },
  "experience-takoto": {
    id: "experience-takoto",
    kind: "suffix",
    canDoId: "a2-cando-experience-takoto",
    base: "past",
    tail: [M("こと", "koto"), P("が", "ga"), M("あります", "arimasu")],
  },
  "intentions-plans": {
    id: "intentions-plans",
    kind: "clause",
    canDoId: "a2-cando-intentions-plans",
  },
  "reason-kara": {
    id: "reason-kara",
    kind: "clause",
    canDoId: "a2-cando-reason-kara",
  },
  "reason-node": {
    id: "reason-node",
    kind: "clause",
    canDoId: "a2-cando-reason-node",
  },
  "opinion-toomou": {
    id: "opinion-toomou",
    kind: "clause",
    canDoId: "a2-cando-opinion-toomou",
  },
  compare: {
    id: "compare",
    kind: "clause",
    canDoId: "a2-cando-compare",
  },
  possibility: {
    id: "possibility",
    kind: "clause",
    canDoId: "a2-cando-possibility",
  },
  connectors: {
    id: "connectors",
    kind: "connector",
    canDoId: "a2-cando-connectors",
  },
};
