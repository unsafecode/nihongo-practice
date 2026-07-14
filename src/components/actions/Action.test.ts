import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ActionButton, ActionLink, actionVariants } from "./Action";

describe("action primitives", () => {
  it("exposes exactly the five approved variants", () => {
    expect([...actionVariants].sort()).toEqual(
      ["primary", "secondary", "destructive", "inline", "icon"].sort(),
    );
  });

  it("renders an ActionButton with the shared action class and a variant modifier", () => {
    for (const variant of actionVariants) {
      const html = renderToStaticMarkup(
        createElement(ActionButton, { variant }, "Go"),
      );
      expect(html).toContain('class="action action--' + variant + '"');
      expect(html).toContain("<button");
    }
  });

  it("defaults ActionButton type to button so it never submits a form by accident", () => {
    const html = renderToStaticMarkup(
      createElement(ActionButton, { variant: "primary" }, "Go"),
    );
    expect(html).toContain('type="button"');
  });

  it("forwards disabled state to the rendered button", () => {
    const html = renderToStaticMarkup(
      createElement(ActionButton, { variant: "secondary", disabled: true }, "Go"),
    );
    expect(html).toContain("disabled");
  });

  it("merges caller-provided className with the action classes", () => {
    const html = renderToStaticMarkup(
      createElement(
        ActionButton,
        { variant: "inline", className: "course-reset" },
        "Reset",
      ),
    );
    expect(html).toContain('class="action action--inline course-reset"');
  });

  it("renders an ActionLink as an anchor with the shared action class and a variant modifier", () => {
    for (const variant of actionVariants) {
      const html = renderToStaticMarkup(
        createElement(
          MemoryRouter,
          null,
          createElement(ActionLink, { variant, to: "/percorso" }, "Go"),
        ),
      );
      expect(html).toContain('class="action action--' + variant + '"');
      expect(html).toContain("<a ");
      expect(html).toContain('href="/percorso"');
    }
  });
});
