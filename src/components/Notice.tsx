import type { ReactElement } from "react";
import { ActionButton } from "./actions/Action";

export type NoticeTone = "info" | "warning" | "error";

export interface NoticeProps {
  tone: NoticeTone;
  title: string;
  body: string;
  dismissLabel?: string;
  onDismiss?: () => void;
}

/**
 * Shared styled notice for route, preset, storage, speech, warning, and
 * error states. `dismissLabel` is the accessible name for the dismiss
 * action; `onDismiss` is the callback it invokes. Both must be present for
 * the dismiss control to render.
 */
export function Notice({
  tone,
  title,
  body,
  dismissLabel,
  onDismiss,
}: NoticeProps): ReactElement {
  const role = tone === "error" ? "alert" : "status";
  const canDismiss = Boolean(onDismiss && dismissLabel);

  return (
    <div className={`notice notice--${tone}`} role={role}>
      <div className="notice__body">
        <p className="notice__title">{title}</p>
        <p className="notice__text">{body}</p>
      </div>
      {canDismiss ? (
        <ActionButton
          type="button"
          variant="icon"
          className="notice__dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <span aria-hidden="true">×</span>
        </ActionButton>
      ) : null}
    </div>
  );
}
