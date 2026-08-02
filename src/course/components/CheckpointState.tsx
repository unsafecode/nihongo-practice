import type { ReactElement } from "react";
import {
  prefersReducedMotion,
  resolveScrollBehavior,
} from "../../routing/scrollPlan";

export interface CheckpointStateProps {
  readonly heading: string;
  readonly body: string;
  readonly linkLabel: string;
  /**
   * The DOM `id` of the in-page section this control reveals — the per-Can-do
   * breakdown that already renders above this component — NOT an href.
   *
   * The app mounts a `HashRouter` (`App.tsx`), so the URL fragment *is* the
   * route. This section therefore has no URL: a `<a href="#can-do-summary">`
   * would advertise a navigable location that does not exist — clicking it
   * sets the hash, the router reads path `/can-do-summary`, matches nothing,
   * falls to the `*` catch-all, and redirects the learner to the course home
   * with a false "page does not exist" warning. `preventDefault` can intercept
   * a *click*, but not the href itself: ⌘/middle-click, "copy link address",
   * bookmarking, and session restore all read the attribute and land on the
   * false banner. So this is rendered as a `<button>` — an in-page action, not
   * a destination — and takes an element id, never an href, so the router can
   * never be handed a fragment that detonates it. The narrowed prop keeps that
   * trap closed by the type: the next caller cannot re-arm it.
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
  function handleEvidenceLinkActivation(): void {
    // A <button> dispatches this handler for both mouse and keyboard
    // (Enter/Space) activation, so the keyboard path is covered without any
    // special-casing — and there is no href for a modified click to reach.
    if (typeof document === "undefined") return;
    const target = document.getElementById(linkTargetId);
    if (!target) return;
    // Keep this an in-page move: scroll to the section AND move focus to it,
    // exactly as the Syllabary group jumps do (src/syllabary/Syllabary.tsx
    // `focusGroup`) — a native fragment link moves both viewport and focus, so
    // scrolling alone would leave a keyboard/AT user's focus and reading
    // position stranded on this control while the page scrolls out from under
    // them. The section is `tabIndex={-1}` (programmatically focusable, not
    // tab-stop) and carries `aria-labelledby`, so focusing it announces its
    // heading. Reuse the shared reduced-motion helper so the preference is
    // resolved in exactly one place (RouteScrollManager and the Syllabary jumps
    // use the same one).
    target.scrollIntoView({
      behavior: resolveScrollBehavior(prefersReducedMotion()),
      block: "start",
    });
    target.focus({ preventScroll: true });
  }

  // DISCLOSED RESIDUAL (not "fixed"): a <button> makes the broken fragment
  // `#can-do-summary` *unreachable*, not *valid* — hand-typed, or restored from
  // a link shared during today's deploy window, it still lands on the false
  // "page not found" banner (the prop docblock explains why the fragment has no
  // route). That exposure is minutes wide and nobody holds such a link, so
  // removing the href — the thing consumers copy, bookmark, and restore — is the
  // right trade. The complete fix is teaching the router to resolve the fragment
  // to this section: the RouteScrollManager scope (documented "never moves
  // focus", see RouteScrollManager.tsx:27), deliberately not authorised for this
  // corrective task and filed for the backlog.
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
      <button
        type="button"
        className="checkpoint-state__link"
        onClick={handleEvidenceLinkActivation}
      >
        {linkLabel}
      </button>
    </section>
  );
}
