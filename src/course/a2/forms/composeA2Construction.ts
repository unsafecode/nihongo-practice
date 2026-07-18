import { A2_CONSTRUCTIONS } from "./a2Constructions";
import { conjugate, type A2Fragment, type A2PlainForm } from "./a2Conjugation";

/**
 * The pure A2 construction composer (Phase 3 Task 2, design spec
 * §7.1/§9.2-§9.4/§13). It only accepts `suffix` constructions: it conjugates
 * the exact plain base the construction names (te/negative/past) for the
 * target verb sense, then appends the construction's fixed tail fragments.
 * `clause`/`connector`/`plain-inflection` constructions combine whole
 * clauses or add discourse tokens rather than attaching to one conjugated
 * verb — they are rejected here and realized as sentence-family
 * constructions in a later task.
 */

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
  | { readonly ok: true; readonly sentence: ComposedSentence }
  | {
      readonly ok: false;
      readonly error: "unknown-construction" | "unknown-verb" | "not-a-suffix-construction";
    };

/**
 * Compose a `suffix` construction onto the correctly conjugated base
 * (te/negative/past) for the target verb. Pure: the same input always
 * produces a deep-equal, independently-owned output.
 */
export function composeA2Construction(input: ComposeInput): ComposeResult {
  const construction = A2_CONSTRUCTIONS[input.constructionId];
  if (!construction) {
    return { ok: false, error: "unknown-construction" };
  }
  if (construction.kind !== "suffix" || construction.base === undefined || construction.tail === undefined) {
    return { ok: false, error: "not-a-suffix-construction" };
  }

  const conjugated = conjugate(input.senseId, construction.base);
  if (!conjugated.ok) {
    return { ok: false, error: "unknown-verb" };
  }

  const fragments: readonly A2Fragment[] = [...conjugated.result.fragments, ...construction.tail];
  return {
    ok: true,
    sentence: {
      jp: fragments.map((f) => f.jp).join(""),
      romaji: fragments.map((f) => f.romaji).join(""),
      reading: fragments.map((f) => f.reading ?? f.jp).join(""),
      base: construction.base,
      canDoId: construction.canDoId,
      fragments,
    },
  };
}
