import { boundaryBefore, formatRomaji } from "../../romaji/formatRomaji";
import type { AssembledToken } from "../../romaji/types";

export interface Particle {
  jp: string;
  romaji: string;
}

export interface Segment {
  kind: string;
  jp: string;
  romaji: string;
  particle?: Particle;
}

export interface Assembled {
  jp: string;
  romaji: string;
}

function tokenId(index: number, suffix?: string): string {
  return suffix ? `segment-${index}-${suffix}` : `segment-${index}`;
}

function segmentTokens(segments: readonly Segment[]): AssembledToken[] {
  const tokens: AssembledToken[] = [];

  for (const [index, segment] of segments.entries()) {
    if (segment.jp.length === 0) continue;
    tokens.push({
      id: tokenId(index),
      jp: segment.jp,
      romaji: segment.romaji,
      kind: "lexical",
      boundaryBefore: boundaryBefore("lexical", tokens.length),
      source: { domain: "lab", referenceId: tokenId(index) },
    });
    if (!segment.particle) continue;
    tokens.push({
      id: tokenId(index, "particle"),
      jp: segment.particle.jp,
      romaji: segment.particle.romaji,
      kind: "particle",
      boundaryBefore: boundaryBefore("particle", tokens.length),
      source: { domain: "lab", referenceId: tokenId(index, "particle") },
    });
  }

  return tokens;
}

export function assembleJP(
  segments: Segment[],
  tokens: readonly AssembledToken[] = segmentTokens(segments),
): Assembled {
  const present = segments.filter((segment) => segment.jp.length > 0);
  const formatted = formatRomaji(tokens);
  if (!formatted.ok) {
    throw new Error(
      `invalid Lab romaji: ${formatted.errors
        .map((error) => error.code)
        .join(",")}`,
    );
  }
  return {
    jp: present
      .map((segment) => segment.jp + (segment.particle?.jp ?? ""))
      .join(""),
    romaji: formatted.text,
  };
}
