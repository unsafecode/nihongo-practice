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
 * rail + context bar, a compact dark authored guided board (design spec
 * §6.4 — the complete A0→A1 curriculum's guided boards are fully authored
 * from curriculum examples, never backed by a live Lab selection, so no
 * lesson offers an "open in the guided Lab" deep-link), and a fully
 * populated prev/map/next footer.
 */
export const REPRESENTATIVE_LESSON = { moduleId: "past-negative", lessonId: "past-negative-2" } as const;

/** A "sound" lesson whose explore links out to a specific Syllabary group.
 * Uses the current canonical lesson id directly (not a retired v2.1 alias):
 * this fixture exists to exercise the Syllabary round-trip itself, and the
 * guided tool's return target is always built from the canonical lesson
 * (assembleCourse.ts), so testing through an unrelated legacy-redirect hop
 * would only add incidental noise. */
export const SOUND_LESSON = { moduleId: "sounds", lessonId: "sounds-1" } as const;
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

/** The same `< 700` boundary the rest of this suite already uses (see e.g.
 * `isMobile()` in foundation-ux.spec.ts / a1-depth.spec.ts) to tell the
 * `desktop-1440` project apart from `mobile-390`. */
const MOBILE_ZOOM_BREAKPOINT = 700;

export interface ZoomEvidence {
  /** `reflow`: real desktop browser Ctrl/Cmd-+ zoom, which genuinely lays
   *  the page out again at a narrower effective CSS-pixel viewport.
   *  `pinch`: real mobile-browser zoom, which (for a standard
   *  `width=device-width` page, as this app declares) is purely a *visual*
   *  magnification over the unchanged device-width layout — the CSS layout
   *  viewport never reflows on a real phone's pinch-zoom. Using the
   *  mechanism that matches how each platform's browser chrome actually
   *  zooms is what the review deviation's "consistent with browser"
   *  requirement calls for, rather than forcing one artificial technique
   *  onto both. */
  readonly mode: "reflow" | "pinch";
  readonly factor: number;
  readonly before: { readonly innerWidth: number; readonly innerHeight: number };
  readonly after: {
    readonly innerWidth: number;
    readonly innerHeight: number;
    readonly visualScale: number | null;
  };
}

/**
 * Applies a genuine `factor`x browser zoom, picking the mechanism the real
 * browser on that viewport size actually uses:
 *
 *  - **Desktop** (viewport width >= {@link MOBILE_ZOOM_BREAKPOINT}): shrinks
 *    the Playwright viewport to `nominal/factor` in both dimensions.
 *    Playwright's viewport resize is itself backed by the CDP device-metrics
 *    mechanism, and — critically — it changes `window.innerWidth`/media
 *    queries exactly as real desktop Ctrl/Cmd-+ zoom does, so every wrap
 *    point, sticky offset, and breakpoint genuinely recomputes.
 *  - **Mobile** (< {@link MOBILE_ZOOM_BREAKPOINT}): issues a CDP
 *    `Emulation.setPageScaleFactor` command — the same visual-magnification
 *    mechanism a real phone's pinch-zoom uses. The CSS layout viewport is
 *    deliberately left unchanged (a real phone's pinch-zoom does not reflow
 *    a `width=device-width` page either), while `window.visualViewport.scale`
 *    genuinely reports the new zoom level.
 *
 * Returns evidence the caller must check with {@link assertZoomApplied}
 * rather than trusting either mechanism silently took effect.
 */
export async function applyBrowserZoom(page: Page, factor: number): Promise<ZoomEvidence> {
  const nominal = page.viewportSize();
  if (!nominal) {
    throw new Error("applyBrowserZoom requires a page with a known viewport size");
  }
  const before = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  }));

  if (nominal.width >= MOBILE_ZOOM_BREAKPOINT) {
    await page.setViewportSize({
      width: Math.round(nominal.width / factor),
      height: Math.round(nominal.height / factor),
    });
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    const after = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      visualScale: window.visualViewport?.scale ?? null,
    }));
    return { mode: "reflow", factor, before, after };
  }

  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: factor });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
  const after = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    visualScale: window.visualViewport?.scale ?? null,
  }));
  return { mode: "pinch", factor, before, after };
}

/**
 * Fails unless {@link applyBrowserZoom} genuinely changed the engine's
 * computed scale/layout for its chosen mode — never a silent no-op:
 *  - `reflow`: `innerWidth` must have shrunk to ~`before/factor`, proving a
 *    real layout reflow (not merely a cosmetic property with no effect).
 *  - `pinch`: `visualViewport.scale` must equal the requested factor
 *    (proving the compositor genuinely zoomed in) while `innerWidth` stays
 *    exactly as before (proving this is real pinch-zoom, not an accidental
 *    reflow a phone would never actually apply).
 */
export function assertZoomApplied(evidence: ZoomEvidence): void {
  if (evidence.mode === "reflow") {
    const expectedWidth = evidence.before.innerWidth / evidence.factor;
    expect(
      evidence.after.innerWidth,
      `desktop zoom must reflow innerWidth (${evidence.after.innerWidth}) to ~before/factor (${expectedWidth})`,
    ).toBeCloseTo(expectedWidth, 0);
    const expectedHeight = evidence.before.innerHeight / evidence.factor;
    expect(
      evidence.after.innerHeight,
      `desktop zoom must reflow innerHeight (${evidence.after.innerHeight}) to ~before/factor (${expectedHeight})`,
    ).toBeCloseTo(expectedHeight, 0);
  } else {
    expect(
      evidence.after.visualScale,
      `mobile pinch-zoom must report visualViewport.scale === ${evidence.factor}`,
    ).toBe(evidence.factor);
    expect(
      evidence.after.innerWidth,
      "mobile pinch-zoom must not reflow the CSS layout viewport",
    ).toBe(evidence.before.innerWidth);
  }
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
 * through), this measures each control's *own meaningful visual chrome* and
 * compares it — deterministically, in the live Chromium context and under the
 * same global stylesheet — against a temporary, classless reference `<button>`
 * and `<a href>`.
 *
 * The comparison is restricted to a control's *own computed visual chrome*:
 * background (color + image), border widths/styles/colors, corner radii, box
 * shadow, text-decoration line, min-width/min-height, and padding. Inherited or
 * non-chrome interaction signals — cursor, font-family, font-weight, text color
 * — are deliberately ignored: they do not distinguish a naked control from a
 * styled one (a browser default already inherits the page font and can carry a
 * pointer cursor), so treating them as "styling" is exactly the near-naked
 * escape this audit closes.
 *
 * Core rule: a control is reported as naked when it agrees with the naked
 * reference on *every* non-padding chrome field AND its padding is either
 * identical or differs by at most a single <=1px nudge on one side (a 1px
 * single-side nudge is not meaningful chrome — it renders as the naked
 * default). Any other padding difference (a second side, or a >1px delta), or
 * any non-padding chrome difference (its own background, border, radius,
 * shadow, decoration, or a real 44px min target), means the control owns
 * material chrome and it passes. A legitimately styled transparent inline/rail
 * action therefore passes on its declared min target, padding, border, radius,
 * or decoration, without any class allowlist.
 *
 * The reference nodes are inserted, measured, and removed within this call, so
 * the audit is side-effect free.
 */
export async function auditNakedActions(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    // A control's own meaningful visual chrome. Two controls that agree on all
    // of these render identically to a user; an app control that agrees with
    // the naked reference on all of them is, by definition, naked. Cursor,
    // font family/weight, and text color are intentionally excluded — they are
    // inherited/interaction signals, not the control's own chrome.
    const PADDING_PROPS = [
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
    ] as const;
    const CHROME_PROPS = [
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
      "boxShadow",
      "textDecorationLine",
      "minWidth",
      "minHeight",
      ...PADDING_PROPS,
    ] as const;

    const PADDING_SET = new Set<string>(PADDING_PROPS);
    // A single padding side may drift from the naked default by up to this many
    // CSS px and still be considered a "nudge" (not meaningful chrome).
    const PADDING_NUDGE_EPSILON = 1;

    type Signature = Record<string, string>;

    const signatureOf = (el: Element): Signature => {
      const style = getComputedStyle(el);
      const sig: Signature = {};
      for (const prop of CHROME_PROPS) {
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

    // Decides whether `sig` is indistinguishable from the naked `reference`.
    // Returns null when the control owns material chrome (passes), or an
    // explanation string identifying why it is naked (identical, or a lone
    // <=1px padding nudge).
    const nakedReason = (
      sig: Signature,
      reference: Signature,
    ): string | null => {
      const differing = CHROME_PROPS.filter((prop) => sig[prop] !== reference[prop]);
      const nonPadding = differing.filter((prop) => !PADDING_SET.has(prop));
      // Any own non-padding chrome (background, border, radius, shadow,
      // decoration, min target) makes the control materially styled.
      if (nonPadding.length > 0) return null;
      const paddingDiffs = differing.filter((prop) => PADDING_SET.has(prop));
      if (paddingDiffs.length === 0) {
        return "indistinguishable from the naked reference (identical chrome)";
      }
      // More than one padding side changed → deliberate padding styling.
      if (paddingDiffs.length > 1) return null;
      const prop = paddingDiffs[0];
      const delta = Math.abs(
        Number.parseFloat(sig[prop]) - Number.parseFloat(reference[prop]),
      );
      if (Number.isFinite(delta) && delta <= PADDING_NUDGE_EPSILON) {
        return `only a <=${PADDING_NUDGE_EPSILON}px single-side padding nudge (${prop} ${reference[prop]}→${sig[prop]}) — equivalent to naked`;
      }
      return null;
    };

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
      const reason = nakedReason(sig, reference);
      if (reason) {
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
          `minSize=${sig.minWidth}x${sig.minHeight}`,
        ].join(", ");
        naked.push(
          `${el.tagName.toLowerCase()}.${cls} "${text}" — ${reason} vs the naked ${refKind} reference (${evidence})`,
        );
      }
    }
    return naked;
  });
}

/**
 * The pinch-zoomed *visual* viewport's offset/size relative to the (always
 * unscaled-by-pinch-zoom) layout viewport that `getBoundingClientRect()`
 * reports against. Under {@link applyBrowserZoom}'s `"pinch"` mode this is
 * genuinely non-zero/shrunk — real per the CSSOM View spec, since
 * `Element.scrollIntoView` itself aligns to the visual viewport once a page
 * is pinch-zoomed, not the full layout viewport. Under `"reflow"` mode (or
 * no zoom at all) the two viewports coincide, so this is always `{0,
 * innerWidth, innerHeight}`.
 */
export async function visualViewportMetrics(
  page: Page,
): Promise<{ offsetTop: number; offsetLeft: number; width: number; height: number }> {
  return page.evaluate(() => {
    const vv = window.visualViewport;
    return {
      offsetTop: vv?.offsetTop ?? 0,
      offsetLeft: vv?.offsetLeft ?? 0,
      width: vv?.width ?? window.innerWidth,
      height: vv?.height ?? window.innerHeight,
    };
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

/* ------------------------------------------------------------------ *
 * Stubbed speech recognition harness (Slice D plan Task 4).
 *
 * The functional speech acceptance suite must exercise the real app through
 * its *public* recognizer boundary without a microphone, permission prompt,
 * real Web Speech engine, or any network. This harness installs a fake that
 * satisfies exactly the production `SpeechRecognizer` contract
 * (`supported`/`recognize`/`abort`) on a window global *before app boot*; the
 * app's composition root reads that global and hands it to the provider.
 * Production never sets the global, so the real browser adapter still ships.
 *
 * The fake queues deterministic transcript/failure outcomes, can hold a request
 * pending so an abort has something to cancel, and records every `recognize`
 * call (with its language) and `abort` in page memory. It performs no I/O of its
 * own, so `assertLocalOnlyNetwork` stays strict with no vendor/speech allowlist.
 * ------------------------------------------------------------------ */

/** The window key the app reads to resolve an injected recognizer. */
export const SPEECH_RECOGNIZER_KEY = "__nihongoSpeechRecognizer__";
/** The window key exposing the fake's control/query surface to the test. */
export const SPEECH_FAKE_KEY = "__nihongoSpeechFake__";
/** The window key holding the recorded live-region announcement sequence. */
export const SPEECH_STATUS_LOG_KEY = "__nihongoSpeechStatusLog__";

/** The mapped recognition failures the fake can settle (mirrors the app union). */
export type SpeechFakeFailure =
  | "unsupported"
  | "denied"
  | "no-speech"
  | "aborted"
  | "network-error"
  | "service-error";

/** One settled recognition outcome the fake can return, by contract. */
export type SpeechFakeOutcome =
  | { readonly kind: "transcript"; readonly transcript: string }
  | { readonly kind: "failure"; readonly failure: SpeechFakeFailure };

/** A recorded interaction snapshot read back from page memory. */
export interface SpeechFakeStats {
  /** Every `recognize` call in order, each carrying only its requested lang. */
  readonly calls: readonly { readonly lang: string }[];
  readonly recognizeCount: number;
  readonly abortCount: number;
  /** Whether a held request is still awaiting resolution. */
  readonly pending: boolean;
  /** How many queued outcomes remain unconsumed. */
  readonly queued: number;
}

export interface SpeechFakeConfig {
  /** Feature-detection result the fake reports; default `true`. */
  readonly supported?: boolean;
}

/**
 * Install the fake recognizer + announcement recorder before the app boots.
 * Must be called before the first `goto`, after `setupPageObservers` so its
 * storage-clearing init script does not run afterwards.
 */
export async function installSpeechFake(
  page: Page,
  config: SpeechFakeConfig = {},
): Promise<void> {
  await page.addInitScript(
    (args: {
      recognizerKey: string;
      fakeKey: string;
      statusLogKey: string;
      supported: boolean;
    }) => {
      const win = window as unknown as Record<string, unknown>;
      const outcomes: unknown[] = [];
      const calls: { lang: string }[] = [];
      let abortCount = 0;
      let holdNext = false;
      let pending: { resolve: (outcome: unknown) => void } | null = null;

      // The public SpeechRecognizer surface — nothing vendor-specific leaks.
      const recognizer = {
        supported: args.supported,
        recognize(request: { lang: string }) {
          calls.push({ lang: request.lang });
          if (holdNext) {
            holdNext = false;
            return new Promise((resolve) => {
              pending = { resolve };
            });
          }
          const next = outcomes.shift();
          return Promise.resolve(
            next ?? { kind: "failure", failure: "service-error" },
          );
        },
        abort() {
          abortCount += 1;
          const held = pending;
          pending = null;
          // A held request settles as aborted; the controller's own stale-attempt
          // fence discards it, so this never revives a cancelled attempt.
          if (held) held.resolve({ kind: "failure", failure: "aborted" });
        },
      };
      win[args.recognizerKey] = recognizer;

      win[args.fakeKey] = {
        queue(outcome: unknown) {
          outcomes.push(outcome);
        },
        holdNext() {
          holdNext = true;
        },
        resolvePending(outcome: unknown) {
          const held = pending;
          pending = null;
          if (held) held.resolve(outcome);
        },
        stats(): SpeechFakeStats {
          return {
            calls: calls.map((call) => ({ lang: call.lang })),
            recognizeCount: calls.length,
            abortCount,
            pending: pending !== null,
            queued: outcomes.length,
          };
        },
      };

      // Record every distinct live-region announcement over time so transient
      // states (listening, then processing) are observable from Node even when a
      // later state supersedes them within the same task's microtasks.
      const statusLog: string[] = [];
      win[args.statusLogKey] = statusLog;
      const push = (text: string | null): void => {
        const clean = (text ?? "").replace(/\s+/g, " ").trim();
        if (clean && statusLog[statusLog.length - 1] !== clean) {
          statusLog.push(clean);
        }
      };
      const readCurrent = (): string | null => {
        const el = document.querySelector(".spoken-attempt__status-text");
        return el ? el.textContent : "";
      };
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (
            record.type === "characterData" &&
            typeof record.oldValue === "string"
          ) {
            const parent = (record.target as ChildNode).parentElement;
            if (parent && parent.closest(".spoken-attempt__status")) {
              push(record.oldValue);
            }
          }
        }
        push(readCurrent());
      });
      const start = (): void =>
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          characterData: true,
          characterDataOldValue: true,
        });
      if (document.documentElement) start();
      else document.addEventListener("DOMContentLoaded", start, { once: true });
    },
    {
      recognizerKey: SPEECH_RECOGNIZER_KEY,
      fakeKey: SPEECH_FAKE_KEY,
      statusLogKey: SPEECH_STATUS_LOG_KEY,
      supported: config.supported ?? true,
    },
  );
}

/** Queue one deterministic outcome the next unheld `recognize` will settle with. */
export async function queueSpeechOutcome(
  page: Page,
  outcome: SpeechFakeOutcome,
): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      (window as unknown as Record<string, { queue(o: unknown): void }>)[
        key
      ].queue(value);
    },
    { key: SPEECH_FAKE_KEY, value: outcome },
  );
}

/** Make the next `recognize` stay pending until `resolvePendingRecognition`. */
export async function holdNextRecognition(page: Page): Promise<void> {
  await page.evaluate((key) => {
    (window as unknown as Record<string, { holdNext(): void }>)[key].holdNext();
  }, SPEECH_FAKE_KEY);
}

/** Settle a currently-held `recognize` request with the given outcome. */
export async function resolvePendingRecognition(
  page: Page,
  outcome: SpeechFakeOutcome,
): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      (
        window as unknown as Record<string, { resolvePending(o: unknown): void }>
      )[key].resolvePending(value);
    },
    { key: SPEECH_FAKE_KEY, value: outcome },
  );
}

/** Read the recorded recognize/abort/language interactions from page memory. */
export async function speechStats(page: Page): Promise<SpeechFakeStats> {
  return page.evaluate((key) => {
    return (
      window as unknown as Record<string, { stats(): SpeechFakeStats }>
    )[key].stats();
  }, SPEECH_FAKE_KEY);
}

/** Read the recorded, de-duplicated live-region announcement sequence. */
export async function speechStatusLog(page: Page): Promise<string[]> {
  return page.evaluate((key) => {
    const log = (window as unknown as Record<string, string[] | undefined>)[key];
    return Array.isArray(log) ? log.slice() : [];
  }, SPEECH_STATUS_LOG_KEY);
}
