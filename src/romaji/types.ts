export type RomajiBoundaryBefore = "space" | "attach";

export type RomajiTokenKind =
  | "lexical"
  | "particle"
  | "morpheme"
  | "punctuation";

export interface TokenSourceRef {
  readonly domain: "catalog" | "lab" | "exercise" | "speech" | "test";
  readonly referenceId: string;
}

export interface AssembledToken {
  readonly id: string;
  readonly jp: string;
  readonly romaji: string;
  readonly kind: RomajiTokenKind;
  readonly boundaryBefore: RomajiBoundaryBefore;
  readonly source: TokenSourceRef;
  readonly reading?: string;
}

export interface RomajiRun {
  readonly tokenId: string;
  readonly separatorBefore: "" | " ";
  readonly text: string;
}

export type RomajiFormatErrorCode =
  | "empty-sequence"
  | "empty-romaji"
  | "invalid-first-boundary"
  | "unresolved-token"
  | "illegal-punctuation-spacing"
  | "duplicate-token-id";

export interface RomajiFormatError {
  readonly code: RomajiFormatErrorCode;
  readonly tokenId?: string;
}

export type RomajiFormatResult =
  | { readonly ok: true; readonly text: string; readonly runs: readonly RomajiRun[] }
  | { readonly ok: false; readonly errors: readonly RomajiFormatError[] };
