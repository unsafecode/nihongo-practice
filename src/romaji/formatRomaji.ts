import type {
  AssembledToken,
  RomajiBoundaryBefore,
  RomajiFormatError,
  RomajiFormatResult,
  RomajiRun,
  RomajiTokenKind,
} from "./types";

export function boundaryBefore(
  kind: RomajiTokenKind,
  index: number,
  override?: RomajiBoundaryBefore,
): RomajiBoundaryBefore {
  if (override) return override;
  if (index === 0) return "attach";
  return kind === "morpheme" || kind === "punctuation" ? "attach" : "space";
}

function isEmpty(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}

function validateTokens(tokens: readonly AssembledToken[]): RomajiFormatError[] {
  const errors: RomajiFormatError[] = [];

  if (tokens.length === 0) {
    return [{ code: "empty-sequence" }];
  }

  const seenIds = new Set<string>();

  for (const [index, token] of tokens.entries()) {
    const tokenId = token.id || undefined;
    const sourceId = token.source?.referenceId || undefined;

    if (isEmpty(token.id) || isEmpty(token.jp) || isEmpty(sourceId)) {
      errors.push({
        code: "unresolved-token",
        ...(tokenId ? { tokenId } : {}),
        ...(sourceId ? { referenceId: sourceId } : {}),
      });
    }

    if (isEmpty(token.romaji)) {
      errors.push({
        code: "empty-romaji",
        ...(tokenId ? { tokenId } : {}),
      });
    }

    if (index === 0 && token.boundaryBefore !== "attach") {
      errors.push({
        code: "invalid-first-boundary",
        ...(tokenId ? { tokenId } : {}),
      });
    }

    if (token.kind === "punctuation" && token.boundaryBefore !== "attach") {
      errors.push({
        code: "illegal-punctuation-spacing",
        ...(tokenId ? { tokenId } : {}),
      });
    }

    if (!isEmpty(token.id)) {
      if (seenIds.has(token.id)) {
        errors.push({ code: "duplicate-token-id", tokenId: token.id });
      } else {
        seenIds.add(token.id);
      }
    }
  }

  return errors;
}

export function formatRomaji(tokens: readonly AssembledToken[]): RomajiFormatResult {
  const errors = validateTokens(tokens);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const runs: RomajiRun[] = [];
  let text = "";

  for (const token of tokens) {
    const separatorBefore = token.boundaryBefore === "space" ? " " : "";
    runs.push({
      tokenId: token.id,
      separatorBefore,
      text: token.romaji,
    });
    text += separatorBefore + token.romaji;
  }

  return { ok: true, text, runs };
}

