import type { AssembledToken, RomajiTokenKind } from "../../romaji/types";
import type { ExampleSegment } from "./types";

export type LegacySegmentKind = ExampleSegment["kind"];

function assertUnreachable(value: never): never {
  throw new Error(`unreachable segment kind: ${String(value)}`);
}

export function legacySegmentKindToTokenKind(
  kind: LegacySegmentKind,
): RomajiTokenKind {
  switch (kind) {
    case "word":
      return "lexical";
    case "particle":
      return "particle";
    case "ending":
      return "morpheme";
    case "punctuation":
      return "punctuation";
    default:
      return assertUnreachable(kind);
  }
}

export function exampleSegmentToAssembledToken(
  segment: ExampleSegment,
): AssembledToken | null {
  if (
    typeof segment.id !== "string" ||
    segment.id.length === 0 ||
    !segment.tokenKind ||
    !segment.boundaryBefore ||
    !segment.source?.referenceId
  ) {
    return null;
  }
  return {
    id: segment.id,
    jp: segment.jp,
    romaji: segment.romaji,
    kind: segment.tokenKind,
    boundaryBefore: segment.boundaryBefore,
    source: segment.source,
    ...(segment.reading ? { reading: segment.reading } : {}),
  };
}
