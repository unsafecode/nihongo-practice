/** @vitest-environment jsdom */
import { act } from "react";
import { describe, expect, it } from "vitest";
import { BASE_LESSON_IDS, BASE_LESSON_MANIFEST } from "../manifest";
import { getCourseCopy } from "../../i18n/catalog";
import { buildBasePracticeModel } from "./buildBasePracticeModel";
import { canonicalAnswersForActivity, renderBaseActivity } from "./testHarness";

function disclosedSurfaces(container: HTMLElement): string {
  const attributeValues = [...container.querySelectorAll("*")].flatMap((node) =>
    [...node.attributes].map((attribute) => attribute.value),
  );
  return [container.textContent ?? "", ...attributeValues].join("\n");
}

function expectNoLeak(lessonId: string, index: number): void {
  const forbidden = canonicalAnswersForActivity(lessonId, index);
  if (forbidden.length === 0) return;
  const { container, unmount } = renderBaseActivity(lessonId, index);
  const disclosed = disclosedSurfaces(container);
  for (const answer of forbidden) {
    expect(disclosed).not.toContain(answer);
  }
  unmount();
}

const SAMPLE_LESSONS = [
  "argument-particles-1",
  "sounds-1",
  "sentence-foundations-1",
  "topic-questions-3",
  "requests-connection-2",
  "base-synthesis-4",
];

describe("Base practice pre-attempt leakage safety", () => {
  it("never discloses the canonical answer in text or any DOM attribute for a sample of lessons (every activity)", () => {
    for (const lessonId of SAMPLE_LESSONS) {
      const result = buildBasePracticeModel(lessonId, "en");
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      for (let index = 0; index < result.model.activities.length; index += 1) {
        expectNoLeak(lessonId, index);
      }
    }
  });

  it("never discloses the canonical answer in text or any DOM attribute for every activity of every one of the 40 Base lessons", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      const result = buildBasePracticeModel(lessonId, "en");
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      for (let index = 0; index < result.model.activities.length; index += 1) {
        expectNoLeak(lessonId, index);
      }
    }
  });

  it("never discloses the canonical answer for the first activity of every Base lesson", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      expectNoLeak(lessonId, 0);
    }
  });

  it("never discloses the canonical answer for the listening or spoken activity of every Base lesson", () => {
    for (const lessonId of BASE_LESSON_IDS) {
      const result = buildBasePracticeModel(lessonId, "en");
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const listeningIndex = result.model.activities.findIndex(
        (activity) => activity.mode === "listening",
      );
      const spokenIndex = result.model.activities.findIndex(
        (activity) => activity.mode === "spoken",
      );
      expect(listeningIndex).toBeGreaterThanOrEqual(0);
      expect(spokenIndex).toBeGreaterThanOrEqual(0);
      expectNoLeak(lessonId, listeningIndex);
      expectNoLeak(lessonId, spokenIndex);
    }
  });

  it("never renders a tile-ordering activity's initial bank in the canonical (correct) order, for every lesson", () => {
    let tileOrderingCount = 0;
    for (const lessonId of BASE_LESSON_IDS) {
      const result = buildBasePracticeModel(lessonId, "en");
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      for (let index = 0; index < result.model.activities.length; index += 1) {
        const activity = result.model.activities[index];
        if (activity.interactionKind !== "tile-ordering") continue;
        tileOrderingCount += 1;
        if (activity.tiles.length < 2) continue;
        const { container, unmount } = renderBaseActivity(lessonId, index);
        const renderedBankIds = [
          ...container.querySelectorAll(".base-practice-activity__bank [data-tile-id]"),
        ].map((node) => node.getAttribute("data-tile-id"));
        expect(renderedBankIds).toHaveLength(activity.correctTileIds.length);
        const matchesCanonical = renderedBankIds.every(
          (id, position) => id === activity.correctTileIds[position],
        );
        expect(matchesCanonical).toBe(false);
        unmount();
      }
    }
    expect(tileOrderingCount).toBeGreaterThan(0);
  });

  it("keeps option ids opaque (never the raw catalog target id) in DOM metadata", () => {
    const result = buildBasePracticeModel("argument-particles-1", "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const choiceActivity = result.model.activities.find(
      (activity) => activity.interactionKind === "choice",
    );
    expect(choiceActivity).toBeDefined();
    if (!choiceActivity || choiceActivity.interactionKind !== "choice") return;
    const index = result.model.activities.indexOf(choiceActivity);
    const { container, unmount } = renderBaseActivity("argument-particles-1", index);
    const disclosed = disclosedSurfaces(container);
    // Opaque option ids look like `k<base36>` (see `opaqueTargetKey`), never
    // the lesson-authored activity/option id shape (`<lessonId>-activity-N`).
    expect(disclosed).not.toMatch(/argument-particles-1-activity-\d+-option-\d+/);
    unmount();
  });

  it("does not mark which option is correct via any attribute before submit", () => {
    const result = buildBasePracticeModel("sentence-foundations-1", "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const choiceActivity = result.model.activities.find(
      (activity) => activity.interactionKind === "choice",
    );
    expect(choiceActivity).toBeDefined();
    if (!choiceActivity) return;
    const index = result.model.activities.indexOf(choiceActivity);
    const { container, unmount } = renderBaseActivity("sentence-foundations-1", index);
    for (const input of [...container.querySelectorAll("input[type=radio]")]) {
      expect(input.getAttribute("aria-selected")).toBeNull();
      expect(input.hasAttribute("data-correct")).toBe(false);
    }
    unmount();
  });

  it("covers every lesson contract in the fixed manifest", () => {
    const contracts = new Set(
      SAMPLE_LESSONS.map((lessonId) => BASE_LESSON_MANIFEST[lessonId].contract),
    );
    expect(contracts.size).toBeGreaterThanOrEqual(3);
  });
});

describe("Base practice authored instruction/feedback rendering", () => {
  it("exposes every activity's authored instruction as an accessible group/fieldset label (a <legend> or role=group aria-label matching activity.instruction)", () => {
    const lessonId = "sentence-foundations-1";
    const result = buildBasePracticeModel(lessonId, "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (let index = 0; index < result.model.activities.length; index += 1) {
      const activity = result.model.activities[index];
      const { container, unmount } = renderBaseActivity(lessonId, index);
      const legend = container.querySelector("legend");
      const group = container.querySelector('[role="group"]');
      const accessibleLabel = legend?.textContent ?? group?.getAttribute("aria-label") ?? null;
      expect(accessibleLabel).toBe(activity.instruction);
      unmount();
    }
  });

  it("renders authored acceptedFeedback/retryFeedback only after submit, for a choice activity", () => {
    const lessonId = "sentence-foundations-1";
    const result = buildBasePracticeModel(lessonId, "en");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const choiceActivity = result.model.activities.find(
      (activity) => activity.interactionKind === "choice",
    );
    expect(choiceActivity).toBeDefined();
    if (!choiceActivity || choiceActivity.interactionKind !== "choice") return;
    const index = result.model.activities.indexOf(choiceActivity);
    const { container, unmount } = renderBaseActivity(lessonId, index);

    // Before submit: neither feedback string appears.
    expect(container.textContent).not.toContain(choiceActivity.acceptedFeedback);
    expect(container.textContent).not.toContain(choiceActivity.retryFeedback);

    const correctInput = container.querySelector<HTMLInputElement>(
      `input[value="${choiceActivity.correctOptionId}"]`,
    );
    expect(correctInput).toBeDefined();
    act(() => {
      correctInput?.click();
    });
    const submitButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === getCourseCopy("en").baseLesson.practice.submit,
    );
    act(() => submitButton?.click());

    // After a correct submit: the authored accepted feedback appears.
    expect(container.textContent).toContain(choiceActivity.acceptedFeedback);
    unmount();
  });
});
