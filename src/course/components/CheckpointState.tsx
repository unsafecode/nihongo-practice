import type { ReactElement } from "react";

export interface CheckpointStateProps {
  readonly heading: string;
  readonly body: string;
  readonly linkLabel: string;
  readonly linkHref: string;
  readonly met: boolean;
}

/**
 * The checkpoint section of the course home.
 *
 * There is deliberately nothing to launch: a checkpoint is *evidence*, met
 * automatically once every scenario lesson is consolidated
 * (`ProgressContext.withCheckpointAttempt`). Before Phase 4 this section was
 * titled like a test the learner could sit, with no way to sit it. It now
 * says how the evidence accrues and links to the per-Can-do breakdown that
 * already renders above it.
 */
export function CheckpointState({
  heading,
  body,
  linkLabel,
  linkHref,
  met,
}: CheckpointStateProps): ReactElement {
  return (
    <section
      className="checkpoint-state"
      aria-labelledby="checkpoint-state-heading"
      data-met={met}
    >
      <h2 id="checkpoint-state-heading" className="checkpoint-state__heading">
        {heading}
      </h2>
      <p className="checkpoint-state__body" role="status">
        {body}
      </p>
      <a className="checkpoint-state__link" href={linkHref}>
        {linkLabel}
      </a>
    </section>
  );
}
