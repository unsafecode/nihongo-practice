import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Icon, semanticIconIds } from "./Icon";

describe("Icon", () => {
  it("exposes exactly the eight approved semantic icon IDs", () => {
    expect([...semanticIconIds].sort()).toEqual(
      [
        "sounds",
        "sentence",
        "ordering",
        "time",
        "places",
        "people",
        "questions",
        "capstone",
      ].sort(),
    );
  });

  it("renders every semantic icon as inline SVG with no emoji text content", () => {
    for (const id of semanticIconIds) {
      const html = renderToStaticMarkup(
        createElement(Icon, { id, decorative: true }),
      );
      expect(html).toMatch(/^<svg/);
      // No emoji code points should ever appear in the rendered markup.
      expect(html).not.toMatch(
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
      );
    }
  });

  it("renders decorative icons as aria-hidden with no accessible name", () => {
    const html = renderToStaticMarkup(
      createElement(Icon, { id: "sounds", decorative: true }),
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("aria-label");
    expect(html).not.toContain('role="img"');
  });

  it("renders standalone/actionable icons with a non-empty accessible label", () => {
    const html = renderToStaticMarkup(
      createElement(Icon, { id: "capstone", label: "Capstone lesson" }),
    );
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Capstone lesson"');
    expect(html).not.toContain('aria-hidden="true"');
  });

  it("throws when a non-decorative icon is given an empty label", () => {
    expect(() =>
      renderToStaticMarkup(createElement(Icon, { id: "people", label: "" })),
    ).toThrow(/non-empty label/);
  });

  it("throws when a non-decorative icon is given no label at all", () => {
    expect(() =>
      renderToStaticMarkup(
        // @ts-expect-error -- missing label is an invalid runtime contract
        createElement(Icon, { id: "people" }),
      ),
    ).toThrow(/non-empty label/);
  });

  it("supports small/medium/large sizing without changing meaning", () => {
    const small = renderToStaticMarkup(
      createElement(Icon, { id: "time", decorative: true, size: "small" }),
    );
    const large = renderToStaticMarkup(
      createElement(Icon, { id: "time", decorative: true, size: "large" }),
    );
    expect(small).toMatch(/width="16"/);
    expect(large).toMatch(/width="32"/);
  });
});
