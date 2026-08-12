/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { BASE_LESSON_IDS, BASE_LESSON_MANIFEST } from "../manifest";
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
      const result = buildBasePracticeModel(lessonId);
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
      const result = buildBasePracticeModel(lessonId);
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

  it("keeps option ids opaque (never the raw catalog target id) in DOM metadata", () => {
    const result = buildBasePracticeModel("argument-particles-1");
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
    const result = buildBasePracticeModel("sentence-foundations-1");
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
