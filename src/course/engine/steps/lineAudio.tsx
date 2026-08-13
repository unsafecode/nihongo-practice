import type { ReactElement } from "react";
import type { AssembledToken } from "../../../romaji/types";
import { BaseAudioButton, useBaseAudioPlayback } from "../../components/base/BaseAudioButton";
import type { JapaneseLine } from "../types";

/**
 * Wraps a `JapaneseLine`'s own verified kana in a single lexical token so the
 * shared Base synthesis control can voice it. Synthesis reads nothing but
 * `.jp` (see `useBaseAudioPlayback`), so the `romaji`/`source` fields are
 * carried only for token shape; passing an empty array instead would leave a
 * permanently dead audio control. Exported for direct unit testing because the
 * resulting `status` cannot be asserted through the rendered control — jsdom
 * exposes no `speechSynthesis`, so every status is "unavailable" there and a
 * DOM-level assertion would pass vacuously.
 */
export function lineTokens(idBase: string, line: JapaneseLine): readonly AssembledToken[] {
  return [
    {
      id: `${idBase}-line`,
      jp: line.kana,
      romaji: line.romaji,
      kind: "lexical",
      boundaryBefore: "attach",
      source: { domain: "exercise", referenceId: idBase },
    },
  ];
}

interface LineAudioProps {
  readonly idBase: string;
  readonly line: JapaneseLine;
}

/**
 * One canonical audio control for a single lesson line. Isolated into its own
 * component so `useBaseAudioPlayback` is called exactly once per line, always
 * unconditionally, never inside a loop or after an early return.
 */
export function LineAudio({ idBase, line }: LineAudioProps): ReactElement {
  const tokens = lineTokens(idBase, line);
  const { status, play } = useBaseAudioPlayback({ kind: "synthesis", tokens }, idBase);
  return <BaseAudioButton idBase={idBase} status={status} onPlay={play} onRetry={play} />;
}
