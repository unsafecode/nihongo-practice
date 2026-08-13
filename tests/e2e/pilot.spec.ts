import { expect, test, type Page } from "@playwright/test";
import {
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  auditTouchTargets,
  gotoReady,
  routeUrls,
  setupPageObservers,
} from "./helpers";
import { konbiniImmersion } from "../../src/course/engine/pilot/konbiniImmersion";
import { politePresentBlock } from "../../src/course/engine/pilot/politePresentBlock";
import type { Lesson, Step } from "../../src/course/engine/types";

/**
 * Task 14 — proves the two Phase 0 pilot lessons (Task 11/12, exposed by the
 * preview route in Task 13) actually work end to end in a real Chromium
 * page, not just in the jsdom-based unit tests next to each step view.
 * jsdom performs no layout at all — every element's `scrollWidth` is
 * permanently 0 there — so those unit tests deliberately never assert on
 * rendered geometry (overflow, touch targets, a rail that visually
 * advances). That is exactly what this spec adds.
 *
 * The walking driver below dispatches purely on each step's `kind`, never on
 * a lesson id or an archetype id: `src/course/engine/archetypes.ts` treats
 * the archetype itself as data, so a spec that branched on "which lesson is
 * this" would quietly defeat the entire point of a data-driven lesson
 * engine. The two lesson modules are imported directly (the same convention
 * `a1-depth.spec.ts` and others already use for fixture data) only so the
 * driver knows which option/fragment is *correct* — something that must
 * never be readable from the rendered DOM itself (assertion 6 below).
 */

interface Pilot {
  readonly name: string;
  readonly slug: string;
  readonly lesson: Lesson;
  readonly layoutClass: "lesson-engine--editorial" | "lesson-engine--stage";
}

const PILOTS: readonly Pilot[] = [
  {
    name: "polite present block (editorial)",
    slug: "polite-present-block",
    lesson: politePresentBlock,
    layoutClass: "lesson-engine--editorial",
  },
  {
    name: "konbini immersion (stage)",
    slug: "konbini-immersion",
    lesson: konbiniImmersion,
    layoutClass: "lesson-engine--stage",
  },
];

/** Attribute/text substrings that would let a learner read a correct answer
 * out of the markup before answering. Checked against the *current* step's
 * `outerHTML` for every interactive kind, before it is interacted with. */
const SUSPICIOUS_LEAK_PATTERN =
  /data-(correct|answer|solution|expected|target|fragment)|aria-(correct|answer|solution)\b/i;

async function assertNoAnswerLeak(page: Page, context: string): Promise<void> {
  const html = await page.locator(".engine-step").evaluate((el) => el.outerHTML);
  expect(html, `${context}: markup must not leak the correct answer`).not.toMatch(
    SUSPICIOUS_LEAK_PATTERN,
  );
  expect(html, `${context}: markup must not leak a raw correctIndex`).not.toContain(
    "correctIndex",
  );
}

/** Parses "Passo N di M" / "Step N of M" out of the rail's aria-label. */
async function readStepCounter(page: Page): Promise<{ current: number; total: number }> {
  const label = await page.locator(".engine-rail__count").getAttribute("aria-label");
  if (!label) throw new Error("engine-rail__count is missing its aria-label");
  const match = /(\d+)\D+(\d+)/.exec(label);
  if (!match) throw new Error(`unparseable step counter label: "${label}"`);
  return { current: Number(match[1]), total: Number(match[2]) };
}

/** Reads the stage meter's inline `width: N%`. `null` on the editorial
 * layout, which has no meter at all (facts sheet: it uses a section rail
 * instead). */
async function readMeterWidthPercent(page: Page): Promise<number | null> {
  const fill = page.locator(".lesson-engine__meter-fill");
  if ((await fill.count()) === 0) return null;
  const style = await fill.getAttribute("style");
  const match = /width:\s*([\d.]+)%/.exec(style ?? "");
  return match ? Number(match[1]) : null;
}

/**
 * Generic advance driver: dispatches on `step.kind` only.
 *  - Informational kinds (hook/rule/lexBatch/examples/dialogueScene/recap)
 *    all render exactly one `.engine-primary` "Continua" button.
 *  - `quiz`/`comprehension` advance on the correct `.engine-option`.
 *  - `breakdown` advances by revealing every part with `.engine-reveal`.
 *  - `guidedBuild` advances by clicking each correct fragment chip, in
 *    order, by its exact accessible name.
 */
async function advance(page: Page, step: Step): Promise<void> {
  await expect(page.locator(".engine-step"), "exactly one step view must be visible").toHaveCount(
    1,
  );

  switch (step.kind) {
    case "hook":
    case "rule":
    case "lexBatch":
    case "examples":
    case "dialogueScene":
    case "recap":
      await page.locator(".engine-step .engine-primary").click();
      return;

    case "quiz":
    case "comprehension":
      await assertNoAnswerLeak(page, `${step.kind} step "${step.id}"`);
      await page.locator(".engine-step .engine-option").nth(step.correctIndex).click();
      return;

    case "breakdown": {
      await assertNoAnswerLeak(page, `breakdown step "${step.id}"`);
      const total = step.parts.length;
      for (let revealed = 0; revealed < total; revealed += 1) {
        await page.locator(".engine-step .engine-reveal").click();
      }
      return;
    }

    case "guidedBuild": {
      await assertNoAnswerLeak(page, `guidedBuild step "${step.id}"`);
      for (const fragment of step.fragments) {
        await page
          .locator(".engine-step .engine-chips")
          .getByRole("button", { name: fragment, exact: true })
          .click();
      }
      return;
    }

    default: {
      // The ten cases above are every kind `Step` currently defines (the
      // remaining `StepKind` values belong to archetypes with no step view
      // yet), so this is provably unreachable today. Kept — instead of an
      // `as never` cast that would silently swallow the case — so a future
      // eleventh step kind fails this spec loudly instead of the driver
      // quietly no-op-ing on it.
      const unreachable: never = step;
      throw new Error(
        `pilot.spec.ts has no generic driver for step kind: ${JSON.stringify(unreachable)}`,
      );
    }
  }
}

/** Walks every step of `lesson` from the page's current (first) position
 * through to the final recap, recording the rail counter and — for stage
 * lessons — the meter fill width read *before* each step is interacted
 * with. */
async function walkLesson(
  page: Page,
  lesson: Lesson,
): Promise<{ counters: readonly number[]; meterWidths: readonly (number | null)[] }> {
  const counters: number[] = [];
  const meterWidths: (number | null)[] = [];
  for (const step of lesson.steps) {
    const { current, total } = await readStepCounter(page);
    expect(total, "the rail's stated total must equal the lesson's real step count").toBe(
      lesson.steps.length,
    );
    counters.push(current);
    meterWidths.push(await readMeterWidthPercent(page));
    await advance(page, step);
  }
  return { counters, meterWidths };
}

for (const pilot of PILOTS) {
  test.describe(`pilot lesson: ${pilot.name}`, () => {
    test("renders one step at a time and walks to completion with the rail advancing", async ({
      page,
    }) => {
      const observers = await setupPageObservers(page);
      const url = routeUrls.pilot(pilot.slug);
      await gotoReady(page, url);

      await expect(
        page.locator(`.lesson-engine.${pilot.layoutClass}`),
        `root container must carry .${pilot.layoutClass}`,
      ).toHaveCount(1);

      const { counters, meterWidths } = await walkLesson(page, pilot.lesson);

      // Assertion 1 (one step at a time) is enforced on every iteration
      // inside `advance()`. Assertion 2 (walk to completion): every step in
      // the lesson was driven above without throwing, and the counter below
      // proves the walk actually reached the final step rather than
      // stalling silently partway through.
      expect(counters).toHaveLength(pilot.lesson.steps.length);
      expect(counters[0]).toBe(1);
      expect(counters[counters.length - 1]).toBe(pilot.lesson.steps.length);

      // Assertion 3 — the counter strictly increases across the whole walk.
      for (let index = 1; index < counters.length; index += 1) {
        expect(
          counters[index],
          `step counter must strictly increase at position ${index} (${counters[index - 1]} -> ${counters[index]})`,
        ).toBeGreaterThan(counters[index - 1]);
      }

      if (pilot.layoutClass === "lesson-engine--stage") {
        const widths = meterWidths.filter((width): width is number => width !== null);
        expect(
          widths,
          "the stage layout must expose a meter fill width at every step",
        ).toHaveLength(counters.length);
        for (let index = 1; index < widths.length; index += 1) {
          expect(
            widths[index],
            `meter fill width must increase at position ${index} (${widths[index - 1]}% -> ${widths[index]}%)`,
          ).toBeGreaterThan(widths[index - 1]);
        }
      } else {
        expect(meterWidths.every((width) => width === null), "the editorial layout has no meter").toBe(
          true,
        );
      }

      // The walk must still land on exactly one visible step view, still
      // reporting completion, after driving the final recap's own button.
      await expect(page.locator(".engine-step")).toHaveCount(1);
      const final = await readStepCounter(page);
      expect(final.current).toBe(pilot.lesson.steps.length);

      // Assertion 5.
      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);

      // Assertion 7 — no page-level horizontal overflow (this file runs
      // under both the desktop-1440 and mobile-390 projects, so this
      // already covers the narrower viewport where the two-column
      // editorial rail is the likelier offender).
      await assertNoHorizontalOverflow(page);

      // Assertion 8 — every actionable target meets the 44px minimum.
      expect(await auditTouchTargets(page)).toEqual([]);
    });

    test("reload mid-lesson resumes at the same step", async ({ page }) => {
      const observers = await setupPageObservers(page);
      const url = routeUrls.pilot(pilot.slug);
      await gotoReady(page, url);

      // Advance a few steps (fewer than the lesson's length so a reload
      // genuinely lands mid-lesson, not on the last step).
      const stepsToAdvance = Math.min(3, pilot.lesson.steps.length - 1);
      for (let index = 0; index < stepsToAdvance; index += 1) {
        await advance(page, pilot.lesson.steps[index]!);
      }

      const before = await readStepCounter(page);
      expect(before.current).toBe(stepsToAdvance + 1);

      const storageKey = `nihongo.engine.pilot.${pilot.lesson.id}.step`;
      const storedValue = await page.evaluate(
        (key) => window.localStorage.getItem(key),
        storageKey,
      );
      expect(storedValue, "the runner must persist the resume index").toBe(String(stepsToAdvance));

      // `setupPageObservers` installs an init script that clears all
      // storage on every new document load (including a reload) so
      // unrelated tests stay deterministic. Re-seed just the one key this
      // test cares about, the same way `a1-depth.spec.ts` does for its own
      // reload/resume assertion, so the reload below genuinely exercises
      // "resume from storage" rather than a false pass from state that was
      // never actually cleared.
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key, value as string),
        [storageKey, storedValue as string],
      );

      await page.reload({ waitUntil: "load" });
      await gotoReady(page, url);

      const after = await readStepCounter(page);
      expect(after.current, "reload must resume at the same step").toBe(before.current);

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });
  });
}
