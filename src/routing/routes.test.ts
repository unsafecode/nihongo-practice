import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FoundationFixtureLoading,
  foundationFixturesEnabledFor,
  lessonPath,
  routePaths,
} from "./routes";

const routesSource = readFileSync(
  fileURLToPath(new URL("./routes.tsx", import.meta.url)),
  "utf8",
);

describe("routePaths", () => {
  it("defines all public locations", () => {
    expect(routePaths).toEqual({
      course: "/percorso",
      lesson: "/percorso/:moduleId/:lessonId",
      practice: "/pratica",
      lab: "/pratica/laboratorio",
      syllabary: "/pratica/sillabario",
      phrasebook: "/frasario",
    });
  });

  it("builds an encoded lesson URL", () => {
    expect(lessonPath("sentence map", "topic/omission"))
      .toBe("/percorso/sentence%20map/topic%2Fomission");
  });

  it("keeps the compile-time foundation fixture route out of public paths", () => {
    expect(Object.values(routePaths)).not.toContain(
      "/__fixtures__/foundation/:fixtureId",
    );
  });
});

describe("foundationFixturesEnabledFor", () => {
  it("enables the harness only for the exact string \"true\"", () => {
    expect(foundationFixturesEnabledFor("true")).toBe(true);
  });

  it("stays disabled for every other value", () => {
    for (const value of ["false", "TRUE", "1", "", undefined]) {
      expect(foundationFixturesEnabledFor(value)).toBe(false);
    }
  });

  it("is disabled by default in the normal build environment", () => {
    expect(
      foundationFixturesEnabledFor(import.meta.env.VITE_FOUNDATION_FIXTURES),
    ).toBe(false);
  });
});

describe("routes source contract: foundation fixtures excluded from release bundles", () => {
  it("never statically imports the foundation fixture page", () => {
    expect(routesSource).not.toMatch(
      /import\s+\{[^}]*FoundationFixturePage[^}]*\}\s+from/,
    );
  });

  it("loads the fixture page through a compile-time-gated dynamic import", () => {
    // The dynamic import references the page module by path so Rollup can
    // split it into its own chunk, and it is behind the VITE flag so a build
    // without the opt-in emits no import() call at all.
    expect(routesSource).toMatch(
      /import\(\s*["'][^"']*foundations\/FoundationFixturePage["']\s*\)/,
    );
    expect(routesSource).toMatch(/VITE_FOUNDATION_FIXTURES/);
    expect(routesSource).toMatch(/\blazy\(/);
    expect(routesSource).toMatch(/\bSuspense\b/);
  });

  it("registers the exact foundation fixture path and keeps the invalid-route fallback", () => {
    expect(routesSource).toContain(
      '"/__fixtures__/foundation/:fixtureId"',
    );
    expect(routesSource).toMatch(/element=\{<InvalidRoute\s*\/>\}/);
  });
});

describe("FoundationFixtureLoading", () => {
  it("renders an accessible busy main shell (no network, no backend)", () => {
    const html = renderToStaticMarkup(createElement(FoundationFixtureLoading));
    expect(html).toMatch(/^<main\b/);
    expect(html).toMatch(/aria-busy="true"/);
  });
});
