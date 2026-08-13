/** @vitest-environment jsdom */
import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { archetypeById } from "../archetypes";
import type { Archetype } from "../types";
import type { LayoutProps } from "./layout";
import { StageLayout } from "./StageLayout";
import { EditorialLayout } from "./EditorialLayout";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mount(element: ReactElement): { container: HTMLElement; root: Root } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(LocaleProvider, null, element));
  });
  return { container, root };
}

const body = (): ReactElement =>
  createElement("div", { className: "step-body" }, "STEP-BODY");

function props(overrides: Partial<LayoutProps>): LayoutProps {
  return {
    archetype: archetypeById("immersion"),
    stepIndex: 0,
    stepCount: 8,
    phaseIndex: 0,
    children: body(),
    ...overrides,
  };
}

/** A made-up archetype proves the editorial rail is derived from data, not a list. */
const syntheticEditorial = (): Archetype =>
  ({
    id: "synthetic",
    layout: "editorial",
    minSteps: 3,
    maxSteps: 9,
    phases: [
      { name: "alpha", label: { it: "Alfa", en: "Alpha" }, kinds: ["hook"], min: 1, max: 2 },
      { name: "beta", label: { it: "Beta", en: "Bravo" }, kinds: ["rule"], min: 1, max: 2 },
      { name: "gamma", label: { it: "Gamma", en: "Charlie" }, kinds: ["recap"], min: 1, max: 2 },
    ],
  }) as unknown as Archetype;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("StageLayout", () => {
  it("exposes a single main landmark and no navigation landmark", () => {
    const { container } = mount(createElement(StageLayout, props({})));
    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(container.querySelector("nav")).toBeNull();
    expect(container.querySelector('[role="navigation"]')).toBeNull();
  });

  it("renders progress as accessible text", () => {
    const { container } = mount(
      createElement(StageLayout, props({ stepIndex: 2, stepCount: 11 })),
    );
    const count = container.querySelector(".engine-rail__count");
    expect(count?.textContent).toContain("3 / 11");
    expect(count?.getAttribute("aria-label") ?? "").not.toBe("");
  });

  it("renders the step body inside the main region", () => {
    const { container } = mount(createElement(StageLayout, props({})));
    expect(container.querySelector("main .step-body")).not.toBeNull();
  });

  it("hides the back control on the first step", () => {
    const { container } = mount(
      createElement(StageLayout, props({ stepIndex: 0, onBack: () => {} })),
    );
    expect(container.querySelector(".lesson-engine__back")).toBeNull();
  });

  it("calls onBack when the back control is used", () => {
    let backs = 0;
    const { container } = mount(
      createElement(
        StageLayout,
        props({ stepIndex: 1, onBack: () => { backs += 1; } }),
      ),
    );
    const back = container.querySelector(".lesson-engine__back");
    expect(back).not.toBeNull();
    act(() => {
      back?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(backs).toBe(1);
  });
});

describe("EditorialLayout", () => {
  it("exposes a main landmark and a navigation landmark", () => {
    const { container } = mount(
      createElement(EditorialLayout, props({ archetype: archetypeById("new-block") })),
    );
    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(container.querySelector("nav")).not.toBeNull();
  });

  it("lists exactly the archetype's phase labels as section entries", () => {
    const archetype = archetypeById("new-block");
    const { container } = mount(
      createElement(EditorialLayout, props({ archetype })),
    );
    const entries = Array.from(container.querySelectorAll("nav li")).map(
      (item) => item.textContent,
    );
    // Labels, never the machine `name`: rendering the key put raw English
    // ids into the Italian UI.
    expect(entries).toEqual(archetype.phases.map((phase) => phase.label.it));
    expect(entries).not.toContain("alpha");
  });

  it("derives the rail from any archetype's phases, not a hard-coded list", () => {
    const archetype = syntheticEditorial();
    const { container } = mount(
      createElement(EditorialLayout, props({ archetype, phaseIndex: 1 })),
    );
    const entries = Array.from(container.querySelectorAll("nav li"));
    expect(entries.map((item) => item.textContent)).toEqual(["Alfa", "Beta", "Gamma"]);
  });

  it("marks the current phase entry with aria-current='step'", () => {
    const archetype = archetypeById("new-block");
    const { container } = mount(
      createElement(EditorialLayout, props({ archetype, phaseIndex: 2 })),
    );
    const entries = Array.from(container.querySelectorAll("nav li"));
    expect(entries).toHaveLength(archetype.phases.length);
    entries.forEach((entry, index) => {
      expect(entry.getAttribute("aria-current")).toBe(index === 2 ? "step" : null);
    });
  });

  it("renders progress as accessible text", () => {
    const { container } = mount(
      createElement(
        EditorialLayout,
        props({ archetype: archetypeById("new-block"), stepIndex: 2, stepCount: 11 }),
      ),
    );
    const count = container.querySelector(".engine-rail__count");
    expect(count?.textContent).toContain("3 / 11");
    expect(count?.getAttribute("aria-label") ?? "").not.toBe("");
  });

  it("renders the step body inside the main region", () => {
    const { container } = mount(
      createElement(EditorialLayout, props({ archetype: archetypeById("new-block") })),
    );
    expect(container.querySelector("main .step-body")).not.toBeNull();
  });

  it("hides the back control on the first step", () => {
    const { container } = mount(
      createElement(
        EditorialLayout,
        props({ archetype: archetypeById("new-block"), stepIndex: 0, onBack: () => {} }),
      ),
    );
    expect(container.querySelector(".lesson-engine__back")).toBeNull();
  });

  it("calls onBack when the back control is used", () => {
    let backs = 0;
    const { container } = mount(
      createElement(
        EditorialLayout,
        props({
          archetype: archetypeById("new-block"),
          stepIndex: 3,
          onBack: () => { backs += 1; },
        }),
      ),
    );
    const back = container.querySelector(".lesson-engine__back");
    expect(back).not.toBeNull();
    act(() => {
      back?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(backs).toBe(1);
  });
});
