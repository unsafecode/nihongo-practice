import type { AssembledToken } from "../../../romaji/types";
import type {
  SemanticValue,
  SentenceFamily,
  SentenceVariant,
} from "../../foundations/types";
import type { A1Lexeme } from "./types";
import { a1LexemeByValueId } from "./lexicon";

export type ResolveLexemeResult =
  | { readonly ok: true; readonly lexeme: A1Lexeme }
  | {
      readonly ok: false;
      readonly code: "non-lexical-token" | "unmapped-token-source" | "missing-lexeme";
      readonly referenceId: string;
    };

export interface ResolveLexemeInput {
  readonly token: AssembledToken;
  readonly variant: SentenceVariant;
  readonly family: SentenceFamily;
  readonly semanticValues: readonly SemanticValue[];
  readonly lexemeByValueId?: Readonly<Record<string, A1Lexeme | undefined>>;
}

function nonLexical(referenceId: string): ResolveLexemeResult {
  return { ok: false, code: "non-lexical-token", referenceId };
}

function unmappedSource(referenceId: string): ResolveLexemeResult {
  return { ok: false, code: "unmapped-token-source", referenceId };
}

/**
 * Resolves a realized lexical token through its family source reference and
 * authored slot value. It never compares learner-visible strings or glosses.
 */
export function resolveLexeme({
  token,
  variant,
  family,
  semanticValues,
  lexemeByValueId = a1LexemeByValueId,
}: ResolveLexemeInput): ResolveLexemeResult {
  const referenceId = token.source.referenceId;
  if (token.kind !== "lexical") {
    return nonLexical(referenceId);
  }
  if (token.source.domain !== "family") {
    return unmappedSource(referenceId);
  }

  const sourceParts = referenceId.split("/");
  if (sourceParts.length !== 2 || sourceParts[0] !== variant.id) {
    return unmappedSource(referenceId);
  }

  const slotId = sourceParts[1];
  if (
    slotId === "" ||
    !family.slotSchema.some((slot) => slot.id === slotId) ||
    variant.sentenceFamilyId !== family.id
  ) {
    return unmappedSource(referenceId);
  }
  if (slotId === "subject" && variant.discourse.subjectRealization === "omitted") {
    return unmappedSource(referenceId);
  }

  const valueId = variant.slotValues[slotId];
  if (valueId === undefined || !semanticValues.some((value) => value.id === valueId)) {
    return unmappedSource(referenceId);
  }

  const lexeme = lexemeByValueId[valueId];
  if (lexeme === undefined) {
    return { ok: false, code: "missing-lexeme", referenceId: valueId };
  }
  return { ok: true, lexeme };
}
