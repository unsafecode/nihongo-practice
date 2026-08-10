import { formatRomaji } from "../../../romaji/formatRomaji";
import type {
  AssembledToken,
  RomajiBoundaryBefore,
  RomajiFormatError,
} from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";

export interface BaseTokenSequencePart {
  readonly tokens: readonly AssembledToken[];
  readonly boundaryBefore?: RomajiBoundaryBefore;
}

export type ComposeBaseTokenSequenceErrorCode =
  | "empty-sequence"
  | "invalid-segment"
  | "invalid-composed-sequence";

export interface ComposeBaseTokenSequenceError {
  readonly code: ComposeBaseTokenSequenceErrorCode;
  readonly partIndex?: number;
  readonly detail?: unknown;
}

export type ComposeBaseTokenSequenceResult =
  | Readonly<{ readonly ok: true; readonly value: readonly AssembledToken[] }>
  | Readonly<{ readonly ok: false; readonly error: ComposeBaseTokenSequenceError }>;

function ok(value: readonly AssembledToken[]): ComposeBaseTokenSequenceResult {
  return Object.freeze({ ok: true, value });
}

function error(
  code: ComposeBaseTokenSequenceErrorCode,
  partIndex?: number,
  detail?: unknown,
): ComposeBaseTokenSequenceResult {
  return Object.freeze({
    ok: false,
    error: deepFreeze({
      code,
      ...(partIndex === undefined ? {} : { partIndex }),
      ...(detail === undefined ? {} : { detail }),
    }),
  });
}

function isBoundary(value: unknown): value is RomajiBoundaryBefore {
  return value === "attach" || value === "space";
}

function invalidSegment(
  partIndex: number,
  detail: readonly RomajiFormatError[] | string,
): ComposeBaseTokenSequenceResult {
  return error("invalid-segment", partIndex, detail);
}

function cloneTokenWithBoundary(
  token: AssembledToken,
  boundaryBefore: RomajiBoundaryBefore,
): AssembledToken {
  return {
    ...token,
    boundaryBefore,
    source: { ...token.source },
  };
}

/**
 * Canonical Base-token composition API.
 *
 * Form APIs intentionally return standalone sequences whose first token is
 * `attach` so `formatRomaji(formTokens)` is valid. Do not concatenate by
 * spreading prefix and form tokens: the predicate's first token must be rebased
 * to the insertion boundary during composition.
 */
export function composeBaseTokenSequences(
  parts: readonly BaseTokenSequencePart[],
): ComposeBaseTokenSequenceResult {
  if (parts.length === 0) return error("empty-sequence");

  const composed: AssembledToken[] = [];

  for (const [partIndex, part] of parts.entries()) {
    if (!Array.isArray(part.tokens) || part.tokens.length === 0) {
      return error("empty-sequence", partIndex);
    }
    if (part.boundaryBefore !== undefined && !isBoundary(part.boundaryBefore)) {
      return invalidSegment(partIndex, "invalid-boundary-before");
    }

    const segmentFormat = formatRomaji(part.tokens);
    if (!segmentFormat.ok) {
      return invalidSegment(partIndex, segmentFormat.errors);
    }

    for (const [tokenIndex, token] of part.tokens.entries()) {
      const boundaryBefore =
        tokenIndex === 0
          ? composed.length === 0
            ? "attach"
            : part.boundaryBefore ?? "space"
          : token.boundaryBefore;
      composed.push(cloneTokenWithBoundary(token, boundaryBefore));
    }
  }

  const frozen = deepFreeze(composed);
  const composedFormat = formatRomaji(frozen);
  if (!composedFormat.ok) {
    return error("invalid-composed-sequence", undefined, composedFormat.errors);
  }

  return ok(frozen);
}

/**
 * Ergonomic authoring helper for prefix + predicate forms.
 *
 * Use this for Tasks10-14 examples rather than direct array spread; predicate
 * insertion always requires a leading romaji space.
 */
export function composeBasePredicateTokens(
  prefixTokens: readonly AssembledToken[],
  formTokens: readonly AssembledToken[],
): ComposeBaseTokenSequenceResult {
  return composeBaseTokenSequences([
    { tokens: prefixTokens },
    { tokens: formTokens, boundaryBefore: "space" },
  ]);
}
