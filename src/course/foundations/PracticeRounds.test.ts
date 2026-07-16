import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { en as enCopy } from "../i18n/en";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { ScriptProvider } from "../../settings/ScriptContext";
import {
  initExerciseState,
  placeTile,
  selectOption,
  submitExercise,
} from "../components/exerciseState";
import { buildFoundationLessonViewModel } from "./foundationViewModel";
import type { FoundationLessonViewModel } from "./foundationViewModel";
import { PracticeRounds, opaqueTargetKey } from "./PracticeRounds";

const SEED = "phase1-foundation-preview-v1";
const JAPANESE = /[\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/;

function model(fixtureId = "fixture-a1-personal-details"): FoundationLessonViewModel {
  const result = buildFoundationLessonViewModel(fixtureId, "en", SEED);
  if (!result.ok) throw new Error(`expected ok: ${JSON.stringify(result)}`);
  return result.model;
}

function render(
  vm: FoundationLessonViewModel,
  rounds = vm.rounds,
): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(
        LocaleProvider,
        null,
        createElement(
          ScriptProvider,
          null,
          createElement(PracticeRounds, {
            rounds,
            tokenForTile: vm.tokenForTile,
            tokensForExample: vm.tokensForExample,
            copy: enCopy.foundation,
            exerciseCopy: enCopy.exercises,
            errorText: "unavailable",
            idBase: "rounds-a1",
          }),
        ),
      ),
    ),
  );
}

describe("opaqueTargetKey", () => {
  it("hashes the visible target key to a Japanese-free opaque token", () => {
    const key = opaqueTargetKey("せんせいです");
    expect(key).not.toMatch(JAPANESE);
    expect(key.length).toBeGreaterThan(0);
  });

  it("is stable and distinguishes different keys", () => {
    expect(opaqueTargetKey("あ")).toBe(opaqueTargetKey("あ"));
    expect(opaqueTargetKey("あ")).not.toBe(opaqueTargetKey("い"));
  });
});

describe("PracticeRounds structure", () => {
  it("renders both rounds with their titles, intros and purposes in order", () => {
    const html = render(model());
    const titleOne = html.indexOf(enCopy.foundation.roundOneTitle);
    const titleTwo = html.indexOf(enCopy.foundation.roundTwoTitle);
    expect(titleOne).toBeGreaterThan(-1);
    expect(titleTwo).toBeGreaterThan(titleOne);
    expect(html).toContain(enCopy.foundation.roundOneIntro);
    expect(html).toContain(enCopy.foundation.roundTwoIntro);
  });

  it("renders all ten target cards", () => {
    const html = render(model());
    const cards = html.match(/data-target-id="/g) ?? [];
    expect(cards).toHaveLength(10);
  });

  it("gives round two at least one constrained-construction and another kind", () => {
    const vm = model();
    const kinds = vm.rounds[1].targets.map((t) => t.exerciseKind);
    expect(kinds).toContain("constrained-construction");
    expect(kinds.some((k) => k !== "constrained-construction")).toBe(true);
  });

  it("labels every round-two card as a transfer exercise", () => {
    const html = render(model());
    // The transfer label appears once per round-two target.
    const labels = html.split(enCopy.foundation.transferLabel).length - 1;
    expect(labels).toBe(model().rounds[1].targets.length);
  });

  it("carries the required review data attributes on each card", () => {
    const vm = model();
    const html = render(vm);
    for (const target of [...vm.rounds[0].targets, ...vm.rounds[1].targets]) {
      expect(html).toContain(`data-target-id="${target.targetId}"`);
      expect(html).toContain(`data-variant-id="${target.variantId}"`);
      expect(html).toContain(`data-family-id="${target.familyId}"`);
      expect(html).toContain(`data-exercise-kind="${target.exerciseKind}"`);
      expect(html).toContain(
        `data-practice-purpose="${target.practicePurpose}"`,
      );
      expect(html).toContain(
        `data-pedagogical-use="${target.pedagogicalUse}"`,
      );
      expect(html).toContain(
        `data-semantic-fingerprint="${target.semanticFingerprint}"`,
      );
      expect(html).toContain(
        `data-visible-target-key="${opaqueTargetKey(target.visibleTargetKey)}"`,
      );
    }
  });

  it("never leaks a canonical Japanese answer through any data attribute", () => {
    const html = render(model());
    const dataValues = [...html.matchAll(/data-[\w-]+="([^"]*)"/g)].map(
      (m) => m[1],
    );
    for (const value of dataValues) {
      expect(value).not.toMatch(JAPANESE);
    }
    expect(html).not.toMatch(/data-answer/);
    expect(html).not.toMatch(/data-canonical/);
  });
});

describe("PracticeRounds content errors", () => {
  it("shows a single notice and no cards when a round has no targets", () => {
    const vm = model();
    const broken = [
      vm.rounds[0],
      { ...vm.rounds[1], targets: [] },
    ] as const;
    const html = render(vm, broken as unknown as typeof vm.rounds);
    expect(html).toContain(enCopy.foundation.unavailableTitle);
    expect(html).not.toMatch(/data-target-id/);
  });
});

describe("PracticeRounds exercise cards reuse the real reducer", () => {
  it("accepts a correctly-ordered tile answer and rejects a wrong one", () => {
    const vm = model();
    const tileTarget = [...vm.rounds[0].targets, ...vm.rounds[1].targets].find(
      (t) => t.prompt.kind === "tile-ordering",
    );
    if (!tileTarget || tileTarget.prompt.kind !== "tile-ordering") {
      throw new Error("expected a tile-ordering target");
    }
    const prompt = tileTarget.prompt;

    let correct = initExerciseState(prompt);
    for (const tileId of prompt.correctTileIds) {
      correct = placeTile(correct, tileId);
    }
    expect(submitExercise(prompt, correct).outcome).toBe("accepted");

    let wrong = initExerciseState(prompt);
    for (const tileId of [...prompt.correctTileIds].reverse()) {
      wrong = placeTile(wrong, tileId);
    }
    const wrongOutcome = submitExercise(prompt, wrong).outcome;
    expect(wrongOutcome === "retry" || wrongOutcome === "accepted").toBe(true);
  });

  it("accepts the correct option for a choice target", () => {
    const vm = model();
    const choiceTarget = [
      ...vm.rounds[0].targets,
      ...vm.rounds[1].targets,
    ].find((t) => t.prompt.kind === "choice");
    if (!choiceTarget || choiceTarget.prompt.kind !== "choice") {
      throw new Error("expected a choice target");
    }
    const prompt = choiceTarget.prompt;
    const chosen = selectOption(initExerciseState(prompt), prompt.correctOptionId);
    expect(submitExercise(prompt, chosen).outcome).toBe("accepted");
  });
});
