import { expect, type Page, type Request } from "@playwright/test";
import { PREVIEW_BASE_PATH, PREVIEW_ORIGIN } from "../../playwright.config";

/**
 * Shared, strict acceptance helpers for the corrective-redesign Playwright
 * suite. Everything here is deliberately conservative: guards collect real
 * runtime evidence (console errors, page errors, unhandled rejections,
 * every network request) and the audits measure the *actual* rendered DOM
 * (computed styles, bounding boxes, fonts) rather than trusting class names
 * alone. No helper weakens a criterion with a large tolerance; the only
 * slack is a <1px subpixel epsilon on geometry, which is standards-justified.
 */

/** Absolute URL builders for the HashRouter app under the Pages base. */
export const routeUrls = {
  home: `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}#/percorso`,
  practice: `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}#/pratica`,
  lab: `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}#/pratica/laboratorio`,
  syllabary: `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}#/pratica/sillabario`,
  lesson: (moduleId: string, lessonId: string) =>
    `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}#/percorso/${moduleId}/${lessonId}`,
} as const;

/**
 * The representative content-rich lesson used across the visual and
 * navigation suites: it exercises a real before/after comparison, the sticky
 * rail + context bar, a compact dark Lab-backed guided board, and a fully
 * populated prev/map/next footer.
 */
export const REPRESENTATIVE_LESSON = { moduleId: "time", lessonId: "time-past" } as const;

/** A "sound" lesson whose explore links out to a specific Syllabary group. */
export const SOUND_LESSON = { moduleId: "sounds", lessonId: "sounds-core" } as const;
export const SOUND_LESSON_GROUP = "gojuon";

export interface PageObservers {
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
  readonly requests: string[];
  readonly externalRequests: string[];
  unhandledRejections(page: Page): Promise<string[]>;
}

const UNHANDLED_KEY = "__e2eUnhandledRejections__";

function isSameOriginOrInert(url: string): boolean {
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("about:")
  ) {
    return true;
  }
  return url.startsWith(PREVIEW_ORIGIN + "/") || url === PREVIEW_ORIGIN;
}

/**
 * Installs every runtime guard on a fresh page *before* navigation:
 *  - records `console.error` output and uncaught page exceptions,
 *  - records an unhandled-promise-rejection log inside the page,
 *  - records every outgoing request and flags any non-local origin,
 *  - clears persisted course state on every full document load so each
 *    test starts deterministically (SPA hash navigation does not re-run
 *    init scripts, so in-flow progress within a single test still persists).
 * Must be called before the first `goto`.
 */
export async function setupPageObservers(page: Page): Promise<PageObservers> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requests: string[] = [];
  const externalRequests: string[] = [];

  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* storage may be unavailable; ignore */
    }
  });

  await page.addInitScript((key: string) => {
    (window as unknown as Record<string, string[]>)[key] = [];
    window.addEventListener("unhandledrejection", (event) => {
      const store = (window as unknown as Record<string, string[]>)[key];
      store.push(String(event.reason));
    });
  }, UNHANDLED_KEY);

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });
  page.on("request", (req: Request) => {
    const url = req.url();
    requests.push(url);
    if (!isSameOriginOrInert(url)) externalRequests.push(url);
  });

  return {
    consoleErrors,
    pageErrors,
    requests,
    externalRequests,
    async unhandledRejections(target: Page) {
      return target.evaluate((key: string) => {
        const store = (window as unknown as Record<string, string[]>)[key];
        return Array.isArray(store) ? store.slice() : [];
      }, UNHANDLED_KEY);
    },
  };
}

/** Navigates to a route and waits until fonts are ready and the app painted. */
export async function gotoReady(page: Page, url: string): Promise<void> {
  // Pin the deterministic media environment on the page itself. Setting these
  // through the project `use` block does not reliably reach `matchMedia` when
  // the project spreads a `devices[...]` preset, so emulate per page to
  // guarantee reduced-motion + light scheme (design spec §9.2) everywhere.
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto(url, { waitUntil: "load" });
  await page.locator("#root >> :is(main, .lab-page)").first().waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Settle a single animation frame so post-mount layout (rail, sticky
  // offsets) is committed before any measurement.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
}

/** Fails if any console error, uncaught exception, or unhandled rejection occurred. */
export async function assertNoRuntimeErrors(
  page: Page,
  observers: PageObservers,
): Promise<void> {
  const unhandled = await observers.unhandledRejections(page);
  expect(observers.consoleErrors, "console.error output").toEqual([]);
  expect(observers.pageErrors, "uncaught page exceptions").toEqual([]);
  expect(unhandled, "unhandled promise rejections").toEqual([]);
}

/** Fails if any request targeted a non-local origin (external site or backend/API). */
export function assertLocalOnlyNetwork(observers: PageObservers): void {
  expect(observers.externalRequests, "non-local network requests").toEqual([]);
}

/** Measures document/body horizontal overflow at the current viewport. */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      innerWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
    };
  });
  // A single subpixel of slack absorbs fractional layout rounding without
  // masking a real overflowing element (which overflows by many pixels).
  expect(
    overflow.scrollWidth,
    `documentElement.scrollWidth (${overflow.scrollWidth}) must not exceed clientWidth (${overflow.clientWidth})`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
  expect(
    overflow.bodyScrollWidth,
    `body.scrollWidth (${overflow.bodyScrollWidth}) must not exceed viewport (${overflow.innerWidth})`,
  ).toBeLessThanOrEqual(overflow.innerWidth + 1);
}

export interface TargetOffender {
  readonly description: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Audits every *visible, enabled, non-decorative* actionable target on the
 * current screen and returns those smaller than 44×44 CSS px. Native
 * checkbox/radio inputs are excluded because their 44px hit area is provided
 * by the wrapping styled label (which is itself audited).
 */
export async function auditTouchTargets(page: Page): Promise<TargetOffender[]> {
  return page.evaluate(() => {
    const MIN = 44;
    const EPSILON = 0.5;
    const selector = [
      "a[href]",
      "button",
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])',
      "label.reference-toggle",
      "summary",
      '[role="button"]',
    ].join(",");
    const offenders: { description: string; width: number; height: number }[] = [];
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    for (const el of elements) {
      if (el.hasAttribute("disabled")) continue;
      if (el.getAttribute("aria-hidden") === "true") continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      const visible =
        typeof el.checkVisibility === "function"
          ? el.checkVisibility({
              opacityProperty: true,
              visibilityProperty: true,
              contentVisibilityAuto: true,
            } as CheckVisibilityOptions)
          : true;
      if (!visible) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.width < MIN - EPSILON || rect.height < MIN - EPSILON) {
        const cls = el.getAttribute("class") ?? "";
        const text = (el.textContent ?? "").trim().slice(0, 40);
        offenders.push({
          description: `${el.tagName.toLowerCase()}.${cls} "${text}"`,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
        });
      }
    }
    return offenders;
  });
}

/**
 * Returns visible actionable `<button>`/`<a href>` elements whose *own rendered
 * appearance* is indistinguishable from a browser-default control.
 *
 * Rather than trusting an allowlisted class or a `closest()` ancestor chain
 * (which a pure layout container such as `.course-hero__actions` would wave
 * through), this measures each control's computed-style signature and compares
 * it — deterministically, in the live Chromium context and under the same
 * global stylesheet — against a temporary, classless reference `<button>` and
 * `<a href>`. A control that matches the naked reference on *every* signature
 * field is reported even if it carries an allowlisted class; a control that
 * differs on any field (e.g. an intentionally transparent inline/rail action
 * whose padding, weight, decoration, border, or min-size is its own) is not.
 *
 * The reference nodes are inserted, measured, and removed within this call, so
 * the audit is side-effect free.
 */
export async function auditNakedActions(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    // The deliberate computed-style signature: a control's self-evident visual
    // "chrome". Two controls that agree on all of these are visually the same
    // to a user, so an app control that agrees with the naked reference is,
    // by definition, naked.
    const SIGNATURE_PROPS = [
      "backgroundColor",
      "backgroundImage",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "borderTopStyle",
      "borderRightStyle",
      "borderBottomStyle",
      "borderLeftStyle",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "borderTopLeftRadius",
      "borderTopRightRadius",
      "borderBottomRightRadius",
      "borderBottomLeftRadius",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "boxShadow",
      "textDecorationLine",
      "color",
      "fontWeight",
      "fontFamily",
      "minWidth",
      "minHeight",
      "cursor",
    ] as const;

    type Signature = Record<string, string>;

    const signatureOf = (el: Element): Signature => {
      const style = getComputedStyle(el);
      const sig: Signature = {};
      for (const prop of SIGNATURE_PROPS) {
        let value = style.getPropertyValue(
          // camelCase → kebab-case for getPropertyValue.
          prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
        );
        // `min-width`/`min-height: auto` resolves to `auto` for a flex/grid
        // item but to `0px` for a block-level control. That divergence is a
        // pure layout-context artifact, not a styling signal — both mean "no
        // explicit minimum", unlike a real action's declared 44px target. Fold
        // the two spellings together so context never masks a naked control.
        if (
          (prop === "minWidth" || prop === "minHeight") &&
          value === "auto"
        ) {
          value = "0px";
        }
        sig[prop] = value;
      }
      return sig;
    };

    // Build the naked references under the same global stylesheet. They are
    // classless, so they receive only the browser default plus any truly
    // global bare-element rules (e.g. `button { font: inherit }`) — never a
    // container-scoped or component rule. Appending to <body> keeps them clear
    // of descendant selectors that intentionally style specific controls.
    const refButton = document.createElement("button");
    refButton.type = "button";
    const refAnchor = document.createElement("a");
    refAnchor.setAttribute("href", "#");
    document.body.append(refButton, refAnchor);
    const referenceButton = signatureOf(refButton);
    const referenceAnchor = signatureOf(refAnchor);
    refButton.remove();
    refAnchor.remove();

    const naked: string[] = [];
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("button, a[href]"),
    );
    for (const el of elements) {
      if (el.getAttribute("aria-hidden") === "true") continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      const visible =
        typeof el.checkVisibility === "function"
          ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
          : true;
      if (!visible) continue;

      const reference =
        el.tagName === "BUTTON" ? referenceButton : referenceAnchor;
      const sig = signatureOf(el);
      const differing = SIGNATURE_PROPS.filter(
        (prop) => sig[prop] !== reference[prop],
      );
      // Indistinguishable from the naked reference on every signature field.
      if (differing.length === 0) {
        const cls = el.getAttribute("class") ?? "";
        const text = (el.textContent ?? "").trim().slice(0, 40);
        const refKind = el.tagName === "BUTTON" ? "<button>" : "<a href>";
        const evidence = [
          `background=${sig.backgroundColor}`,
          `border=${sig.borderTopWidth} ${sig.borderTopStyle} ${sig.borderTopColor}`,
          `radius=${sig.borderTopLeftRadius}`,
          `padding=${sig.paddingTop} ${sig.paddingRight} ${sig.paddingBottom} ${sig.paddingLeft}`,
          `shadow=${sig.boxShadow}`,
          `decoration=${sig.textDecorationLine}`,
          `weight=${sig.fontWeight}`,
          `minSize=${sig.minWidth}x${sig.minHeight}`,
          `cursor=${sig.cursor}`,
        ].join(", ");
        naked.push(
          `${el.tagName.toLowerCase()}.${cls} "${text}" — indistinguishable from the naked ${refKind} reference (${evidence})`,
        );
      }
    }
    return naked;
  });
}

/** Bounding rect of the first element matching `selector`. */
export async function rectOf(page: Page, selector: string) {
  return page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
  }, selector);
}

/** Full-header (border-box, including the 1px bottom border) height. */
export async function headerBottom(page: Page): Promise<number> {
  const rect = await rectOf(page, ".header");
  if (!rect) throw new Error(".header not found");
  return rect.bottom;
}

export interface FontEvidence {
  readonly manropeCheck: boolean;
  readonly bodyFamily: string;
  readonly controlFamily: string;
  readonly japaneseFamily: string;
  readonly loadedManropeFaces: number;
  readonly woff2Resources: string[];
}

/** Collects direct evidence that self-hosted Manrope is actually loaded/applied. */
export async function collectFontEvidence(
  page: Page,
  controlSelector: string,
  japaneseSelector: string,
): Promise<FontEvidence> {
  return page.evaluate(
    ({ controlSel, jpSel }: { controlSel: string; jpSel: string }) => {
      const loadedManropeFaces = Array.from(document.fonts).filter(
        (face) => face.family.replace(/["']/g, "") === "Manrope" && face.status === "loaded",
      ).length;
      const woff2Resources = performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((name) => name.includes(".woff2"));
      const control = document.querySelector(controlSel);
      const japanese = document.querySelector(jpSel);
      return {
        manropeCheck: document.fonts.check('16px "Manrope"'),
        bodyFamily: getComputedStyle(document.body).fontFamily,
        controlFamily: control ? getComputedStyle(control).fontFamily : "",
        japaneseFamily: japanese ? getComputedStyle(japanese).fontFamily : "",
        loadedManropeFaces,
        woff2Resources,
      };
    },
    { controlSel: controlSelector, jpSel: japaneseSelector },
  );
}

/* ------------------------------------------------------------------ *
 * Deterministic WCAG 2.1 contrast helper (pure, runs Node-side).
 * ------------------------------------------------------------------ */

function parseRgb(color: string): [number, number, number, number] {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) throw new Error(`Unsupported color: ${color}`);
  const parts = match[1].split(",").map((p) => p.trim());
  const [r, g, b] = parts.slice(0, 3).map((p) => Number.parseFloat(p));
  const a = parts.length > 3 ? Number.parseFloat(parts[3]) : 1;
  return [r, g, b, a];
}

function channelLuminance(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: [number, number, number, number]): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** WCAG contrast ratio between two opaque CSS `rgb()`/`rgba()` colors. */
export function contrastRatio(foreground: string, background: string): number {
  const fg = parseRgb(foreground);
  const bg = parseRgb(background);
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Reads an element's computed text color and the first opaque background
 * color found walking up its ancestors (falling back to the body paper).
 */
export async function resolveColors(
  page: Page,
  selector: string,
): Promise<{ color: string; background: string }> {
  const result = await page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const color = getComputedStyle(el).color;
    let node: Element | null = el;
    let background = "rgba(0, 0, 0, 0)";
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      const match = bg.match(/rgba?\(([^)]+)\)/);
      const alpha = match && match[1].split(",").length > 3
        ? Number.parseFloat(match[1].split(",")[3])
        : 1;
      if (bg !== "transparent" && alpha === 1) {
        background = bg;
        break;
      }
      node = node.parentElement;
    }
    return { color, background };
  }, selector);
  if (!result) throw new Error(`Element not found: ${selector}`);
  return result;
}
