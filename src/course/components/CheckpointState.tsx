import type { MouseEvent, ReactElement } from "react";
import {
  prefersReducedMotion,
  resolveScrollBehavior,
} from "../../routing/scrollPlan";

export interface CheckpointStateProps {
  readonly heading: string;
  readonly body: string;
  readonly linkLabel: string;
  /**
   * The DOM `id` of the in-page section this link reveals — the per-Can-do
   * breakdown that already renders above this component — NOT an arbitrary
   * href.
   *
   * The app mounts a `HashRouter` (`App.tsx`), so the URL fragment *is* the
   * route. A bare `<a href="#can-do-summary">` therefore does not scroll
   * in-page: clicking it sets the hash, the router reads path
   * `/can-do-summary`, matches nothing, falls to the `*` catch-all, and
   * redirects the learner to the course home with a false "page does not
   * exist" warning. Taking an element id instead of an href makes that
   * failure impossible to *express*: no caller can hand this component a
   * fragment that detonates the router, and the component's only job is the
   * in-page scroll it now owns.
   */
  readonly linkTargetId: string;
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
  linkTargetId,
  met,
}: CheckpointStateProps): ReactElement {
  function handleEvidenceLinkActivation(
    event: MouseEvent<HTMLAnchorElement>,
  ): void {
    // Only intercept a plain primary activation. Browsers dispatch keyboard
    // Enter on a link as a button-0 click, so this also covers the keyboard
    // path. A modified click (new tab/window) is left to the browser.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    if (typeof document === "undefined") return;
    const target = document.getElementById(linkTargetId);
    if (!target) return;
    // Keep this an in-page move: scroll to the section AND move focus to it,
    // exactly as the Syllabary group jumps do (Syllabary.tsx `focusGroup`) —
    // a native fragment link moves both viewport and focus, so scrolling alone
    // would leave a keyboard/AT user's focus and reading position stranded on
    // this link while the page scrolls out from under them. The section is
    // `tabIndex={-1}` (programmatically focusable, not tab-stop) and carries
    // `aria-labelledby`, so focusing it announces its heading. Reuse the shared
    // reduced-motion helper so the preference is resolved in exactly one place
    // (RouteScrollManager and the Syllabary jumps use the same one).
    event.preventDefault();
    target.scrollIntoView({
      behavior: resolveScrollBehavior(prefersReducedMotion()),
      block: "start",
    });
    target.focus({ preventScroll: true });
  }

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
      <a
        className="checkpoint-state__link"
        href={`#${linkTargetId}`}
        onClick={handleEvidenceLinkActivation}
      >
        {linkLabel}
      </a>
    </section>
  );
}
