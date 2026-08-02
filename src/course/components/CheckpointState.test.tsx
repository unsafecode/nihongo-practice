import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CheckpointState, type CheckpointStateProps } from "./CheckpointState";

function render(props: CheckpointStateProps): string {
  return renderToStaticMarkup(createElement(CheckpointState, props));
}

const BASE: CheckpointStateProps = {
  heading: "A2 checkpoint",
  body: "Your checkpoint is met automatically once every scenario lesson is consolidated.",
  linkLabel: "See your Can-do evidence",
  linkTargetId: "can-do-summary",
  met: false,
};

describe("CheckpointState", () => {
  it("explains how evidence accrues and links to the breakdown by its element id", () => {
    const html = render(BASE);
    expect(html).toContain("A2 checkpoint");
    // The prop is an element id, and the component builds the same-page
    // fragment from it. Click-time interception (so the fragment never reaches
    // HashRouter) is covered by tests/e2e/navigation.spec.ts.
    expect(html).toContain('href="#can-do-summary"');
    expect(html).toContain("See your Can-do evidence");
  });

  it("keeps the live region so the state change is announced", () => {
    const html = render({ ...BASE, body: "Met.", met: true });
    expect(html).toContain('role="status"');
    expect(html).toContain("Met.");
  });

  it("preserves the aria-labelledby association and section class name", () => {
    const html = render(BASE);
    expect(html).toContain('class="checkpoint-state"');
    expect(html).toContain('aria-labelledby="checkpoint-state-heading"');
  });

  it("keeps the heading id and class name", () => {
    const html = render(BASE);
    expect(html).toContain('id="checkpoint-state-heading"');
    expect(html).toContain('class="checkpoint-state__heading"');
  });

  it("keeps the body class name on the live region", () => {
    const html = render(BASE);
    expect(html).toContain('class="checkpoint-state__body"');
  });

  it("marks data-met=false when not met", () => {
    const html = render({ ...BASE, met: false });
    expect(html).toContain('data-met="false"');
  });

  it("marks data-met=true when met", () => {
    const html = render({ ...BASE, met: true });
    expect(html).toContain('data-met="true"');
  });
});
