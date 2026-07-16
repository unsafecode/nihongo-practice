import { Fragment } from "react";
import type { ReactNode } from "react";

import { formatRomaji } from "./formatRomaji";
import type { AssembledToken } from "./types";

export interface RomajiSequenceProps {
  readonly tokens: readonly AssembledToken[];
  readonly highlightedTokenIds?: readonly string[];
  readonly highlightClassName?: string;
  readonly errorText: string;
  readonly renderToken?: (token: AssembledToken) => ReactNode;
}

function alertNode(errorText: string) {
  return <p role="alert">{errorText}</p>;
}

export function RomajiSequence({
  tokens,
  highlightedTokenIds = [],
  highlightClassName,
  errorText,
  renderToken,
}: RomajiSequenceProps) {
  const formatted = formatRomaji(tokens);
  if (!formatted.ok) return alertNode(errorText);

  const highlighted = new Set(highlightedTokenIds);
  const tokensById = new Map(tokens.map((token) => [token.id, token] as const));
  const content: ReactNode[] = [];

  for (const run of formatted.runs) {
    const token = tokensById.get(run.tokenId);
    if (!token) return alertNode(errorText);

    const renderedToken = renderToken ? renderToken(token) : run.text;
    content.push(
      <Fragment key={run.tokenId}>
        {run.separatorBefore}
        {highlighted.has(run.tokenId) ? (
          <mark className={highlightClassName}>{renderedToken}</mark>
        ) : (
          renderedToken
        )}
      </Fragment>,
    );
  }

  return <>{content}</>;
}
