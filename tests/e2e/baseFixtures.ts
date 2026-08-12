import { expect, type Page, type Request } from "@playwright/test";
import { PREVIEW_BASE_PATH, PREVIEW_ORIGIN } from "../../playwright.config";
import {
  BASE_LESSON_IDS_BY_MODULE,
  BASE_MODULE_IDS,
} from "../../src/course/base/manifest";
import {
  A1_RETAINED_LESSON_IDS_BY_MODULE,
  A1_RETAINED_MODULE_IDS,
} from "../../src/course/a1/manifest";
import {
  A2_LESSON_IDS_BY_MODULE,
  A2_MODULE_IDS,
} from "../../src/course/a2/manifest";
import { V4_ACTIVITY_INVENTORY } from "../../src/course/base/migration/v4ActivityInventory";
import { V4_REHOMED_LESSON_IDS } from "../../src/course/base/migration/v4OwnershipMap";
import {
  CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
  type CourseProgressV4,
} from "../../src/course/progress/progress";

/**
 * Task 18 fixtures for the complete Base learner journey.
 *
 * Everything here is *derived* from the shipped release manifests and
 * migration registries rather than re-typed by hand, so a manifest change can
 * never leave a second, silently stale route list behind. The only literals
 * are the exact release totals the Base release is contractually gated on
 * (Base 40 + retained A1 44 + A2 60 = 144), which are asserted against the
 * derivation at module load — before any test is defined — so a mismatch is a
 * hard collection-time failure rather than a quietly reduced smoke matrix.
 */

// ---------------------------------------------------------------------------
// Derived route registry
// ---------------------------------------------------------------------------

/** The exact published shape each level contributes (Tasks 1/13/16). */
export const BASE_LESSON_COUNT = 40;
export const A1_RETAINED_LESSON_COUNT = 44;
export const A2_LESSON_COUNT = 60;
export const ALL_CURRENT_LESSON_ROUTE_COUNT = 144;

export type CurrentLessonLevelId = "a0" | "a1" | "a2";

export interface CurrentLessonRoute {
  readonly levelId: CurrentLessonLevelId;
  readonly moduleId: string;
  readonly lessonId: string;
  /** The hash-router path (no origin, no `#`), e.g. `/percorso/sounds/sounds-1`. */
  readonly route: string;
}

interface ManifestPartition {
  readonly levelId: CurrentLessonLevelId;
  readonly moduleIds: readonly string[];
  readonly lessonIdsByModule: Readonly<Partial<Record<string, readonly string[]>>>;
  readonly expectedLessonCount: number;
}

const MANIFEST_PARTITIONS: readonly ManifestPartition[] = [
  {
    levelId: "a0",
    moduleIds: BASE_MODULE_IDS,
    lessonIdsByModule: BASE_LESSON_IDS_BY_MODULE,
    expectedLessonCount: BASE_LESSON_COUNT,
  },
  {
    levelId: "a1",
    moduleIds: A1_RETAINED_MODULE_IDS,
    lessonIdsByModule: A1_RETAINED_LESSON_IDS_BY_MODULE,
    expectedLessonCount: A1_RETAINED_LESSON_COUNT,
  },
  {
    levelId: "a2",
    moduleIds: A2_MODULE_IDS,
    lessonIdsByModule: A2_LESSON_IDS_BY_MODULE,
    expectedLessonCount: A2_LESSON_COUNT,
  },
];

function deriveCurrentLessonRoutes(): readonly CurrentLessonRoute[] {
  const entries: CurrentLessonRoute[] = [];
  const seenRoutes = new Set<string>();

  for (const partition of MANIFEST_PARTITIONS) {
    let levelLessonCount = 0;
    for (const moduleId of partition.moduleIds) {
      const lessonIds = partition.lessonIdsByModule[moduleId];
      if (!lessonIds || lessonIds.length === 0) {
        throw new Error(
          `baseFixtures: manifest for level "${partition.levelId}" has no lessons for module "${moduleId}"`,
        );
      }
      for (const lessonId of lessonIds) {
        const route = `/percorso/${moduleId}/${lessonId}`;
        if (seenRoutes.has(route)) {
          throw new Error(`baseFixtures: duplicate derived route "${route}"`);
        }
        seenRoutes.add(route);
        entries.push({ levelId: partition.levelId, moduleId, lessonId, route });
        levelLessonCount += 1;
      }
    }
    if (levelLessonCount !== partition.expectedLessonCount) {
      throw new Error(
        `baseFixtures: level "${partition.levelId}" derived ${levelLessonCount} lessons, expected ${partition.expectedLessonCount}`,
      );
    }
  }

  return Object.freeze(entries);
}

/** Every current lesson route, level-partitioned, derived from the manifests. */
export const ALL_144_CURRENT_LESSON_ENTRIES: readonly CurrentLessonRoute[] =
  deriveCurrentLessonRoutes();

/** The plain hash-router paths the 144-route smoke matrix drives. */
export const ALL_144_CURRENT_LESSON_ROUTES: readonly string[] = Object.freeze(
  ALL_144_CURRENT_LESSON_ENTRIES.map((entry) => entry.route),
);

// Asserted at module load, i.e. *before* any `test(...)` below is defined, so
// a manifest regression can never silently shrink the smoke matrix.
if (ALL_144_CURRENT_LESSON_ROUTES.length !== ALL_CURRENT_LESSON_ROUTE_COUNT) {
  throw new Error(
    `baseFixtures: derived ${ALL_144_CURRENT_LESSON_ROUTES.length} current lesson routes, expected ${ALL_CURRENT_LESSON_ROUTE_COUNT}`,
  );
}

export function routesForLevel(level: CurrentLessonLevelId): readonly string[] {
  return ALL_144_CURRENT_LESSON_ENTRIES.filter(
    (entry) => entry.levelId === level,
  ).map((entry) => entry.route);
}

/** Absolute preview URL for a hash-router path (`/percorso/...`). */
export function appUrl(routePath: string): string {
  return `${PREVIEW_ORIGIN}${PREVIEW_BASE_PATH}#${routePath}`;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/**
 * Navigates to a hash route and waits until the app's own landmark painted,
 * fonts resolved, and one animation frame settled. Accepts either an absolute
 * preview URL or a bare hash-router path (`/percorso/...`), which is what the
 * Task 18 specs use.
 *
 * The deterministic media environment is pinned on the page itself because a
 * project `use` block that spreads a `devices[...]` preset does not reliably
 * reach `matchMedia`.
 */
export async function gotoReady(page: Page, target: string): Promise<void> {
  const url = target.startsWith("http")
    ? target
    : target.startsWith("/nihongo-practice/")
      ? `${PREVIEW_ORIGIN}${target}`
      : appUrl(target.startsWith("#") ? target.slice(1) : target);
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto(url, { waitUntil: "load" });
  await page
    .locator("#root >> :is(main, .lab-page)")
    .first()
    .waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
}

/**
 * Navigates *within* the already-loaded SPA by driving the hash, so a batch of
 * routes can be verified through real client-side navigations (the same code
 * path a learner's in-app link click takes) without paying a full document
 * load per route. Waits for the app to actually re-render the target route.
 */
export async function hashNavigate(page: Page, routePath: string): Promise<void> {
  await page.evaluate((path: string) => {
    window.location.hash = `#${path}`;
  }, routePath);
  await expect
    .poll(() => page.evaluate(() => window.location.hash))
    .toBe(`#${routePath}`);
  await page.locator("#root main").first().waitFor({ state: "visible" });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
}

// ---------------------------------------------------------------------------
// Same-origin request recording
// ---------------------------------------------------------------------------

export interface RequestRecording {
  /** Every request URL the page issued, in order. */
  readonly requests: string[];
  /** Requests whose URL left the preview origin (must always stay empty). */
  readonly foreign: string[];
  /** Requests whose method/body could carry uploaded audio or speech data. */
  readonly uploads: { url: string; method: string; hasBody: boolean }[];
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
}

function isSameOriginOrInert(url: string): boolean {
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("about:")
  ) {
    return true;
  }
  return url === PREVIEW_ORIGIN || url.startsWith(`${PREVIEW_ORIGIN}/`);
}

/** Static asset (or document) extensions the built preview is allowed to serve. */
const STATIC_ASSET_PATTERN =
  /(\.(?:html?|js|mjs|css|woff2?|ttf|otf|svg|png|jpe?g|webp|avif|gif|ico|json|txt|wav|mp3|ogg|webmanifest|map)(?:\?.*)?$|\/$)/i;

/**
 * Records every outgoing request plus runtime errors. Must be installed
 * before the first navigation. Unlike `helpers.setupPageObservers` this does
 * *not* clear localStorage, so a seeded V4 payload survives the load; use
 * {@link seedV4Progress} (which clears first) for a deterministic start.
 */
export async function recordRequests(page: Page): Promise<RequestRecording> {
  const recording: RequestRecording = {
    requests: [],
    foreign: [],
    uploads: [],
    consoleErrors: [],
    pageErrors: [],
  };

  page.on("request", (request: Request) => {
    const url = request.url();
    recording.requests.push(url);
    if (!isSameOriginOrInert(url)) recording.foreign.push(url);
    const method = request.method().toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      recording.uploads.push({
        url,
        method,
        hasBody: request.postData() !== null,
      });
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") recording.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    recording.pageErrors.push(error.message);
  });

  return recording;
}

/**
 * Asserts every recorded request stayed on the preview origin, resolved a
 * static asset, and that nothing was ever uploaded anywhere — which is the
 * only way a browser page could exfiltrate microphone audio or recognized
 * speech text.
 */
export function assertSameOriginStaticAssetsOnly(
  recording: RequestRecording,
): void {
  expect(recording.foreign, "requests that left the preview origin").toEqual([]);
  expect(
    recording.uploads,
    "non-GET requests (the only way audio/speech data could be uploaded)",
  ).toEqual([]);
  expect(recording.requests.length, "the page loaded its own assets").toBeGreaterThan(0);
  const nonStatic = recording.requests.filter((url) => {
    if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("about:")) {
      return false;
    }
    const path = new URL(url).pathname;
    return !STATIC_ASSET_PATTERN.test(path);
  });
  expect(nonStatic, "requests that were not static preview assets").toEqual([]);
}

/** Fails if any console error or uncaught page exception was recorded. */
export function assertNoRuntimeErrors(recording: RequestRecording): void {
  expect(recording.consoleErrors, "console.error output").toEqual([]);
  expect(recording.pageErrors, "uncaught page exceptions").toEqual([]);
}

// ---------------------------------------------------------------------------
// Body / document overflow measurement
// ---------------------------------------------------------------------------

export interface OverflowMeasurement {
  readonly documentScrollWidth: number;
  readonly documentClientWidth: number;
  readonly bodyScrollWidth: number;
  readonly bodyClientWidth: number;
  readonly innerWidth: number;
  /** Selector-ish descriptions of elements sticking out past the viewport. */
  readonly offenders: readonly string[];
}

/** Measures real horizontal overflow on `body` and `documentElement`. */
export async function measureBodyOverflow(page: Page): Promise<OverflowMeasurement> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const limit = Math.max(doc.clientWidth, body.clientWidth, window.innerWidth);
    const offenders: string[] = [];
    // An element inside a container that deliberately owns a horizontal scroll
    // axis (e.g. the mobile lesson rail strip) is *not* page overflow: that
    // container absorbs the scroll so the document never widens. Only elements
    // that reach past the viewport without such an ancestor are offenders.
    const insideScrollContainer = (element: HTMLElement): boolean => {
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== document.body) {
        const overflowX = getComputedStyle(ancestor).overflowX;
        if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden") {
          return true;
        }
        ancestor = ancestor.parentElement;
      }
      return false;
    };
    for (const element of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const style = getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (style.position === "fixed") continue;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right <= limit + 1) continue;
      if (insideScrollContainer(element)) continue;
      const ownsScrollAxis =
        style.overflowX === "auto" || style.overflowX === "scroll" || style.overflowX === "hidden";
      if (ownsScrollAxis && rect.left <= limit) continue;
      const id = element.id ? `#${element.id}` : "";
      const cls = element.classList.length
        ? `.${Array.from(element.classList).join(".")}`
        : "";
      offenders.push(
        `${element.tagName.toLowerCase()}${id}${cls} right=${Math.round(rect.right)} limit=${limit}`,
      );
    }
    return {
      documentScrollWidth: doc.scrollWidth,
      documentClientWidth: doc.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      innerWidth: window.innerWidth,
      offenders: offenders.slice(0, 12),
    };
  });
}

/**
 * Asserts neither `body` nor `documentElement` has `scrollWidth >
 * clientWidth`. A single subpixel absorbs fractional layout rounding; a real
 * offender overflows by many pixels.
 */
export async function assertNoBodyOverflow(
  page: Page,
  label: string,
): Promise<void> {
  const measurement = await measureBodyOverflow(page);
  expect(
    measurement.documentScrollWidth,
    `${label}: documentElement.scrollWidth ${measurement.documentScrollWidth} > clientWidth ${measurement.documentClientWidth}; offenders ${JSON.stringify(measurement.offenders)}`,
  ).toBeLessThanOrEqual(measurement.documentClientWidth + 1);
  expect(
    measurement.bodyScrollWidth,
    `${label}: body.scrollWidth ${measurement.bodyScrollWidth} > clientWidth ${measurement.bodyClientWidth}; offenders ${JSON.stringify(measurement.offenders)}`,
  ).toBeLessThanOrEqual(measurement.bodyClientWidth + 1);
}

// ---------------------------------------------------------------------------
// Touch-target measurement
// ---------------------------------------------------------------------------

export interface TargetOffender {
  readonly description: string;
  readonly width: number;
  readonly height: number;
}

const ACTIONABLE_SELECTOR =
  "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex]:not([tabindex='-1'])";

/**
 * Every visible, enabled interactive control whose *effective* hit area (its
 * own box, or its label's box when a native control is wrapped by one) is
 * smaller than 44x44 CSS pixels.
 */
export async function auditMinimumTargets(
  page: Page,
  minimum = 44,
): Promise<TargetOffender[]> {
  return page.evaluate(
    ({ selector, min }: { selector: string; min: number }) => {
      const offenders: { description: string; width: number; height: number }[] = [];
      for (const element of Array.from(
        document.querySelectorAll<HTMLElement>(selector),
      )) {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (element.hasAttribute("disabled")) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        // A native radio/checkbox inside a <label> is tapped through the whole
        // label, so the label's box is the real hit area.
        const label = element.closest("label");
        const box = label ? label.getBoundingClientRect() : rect;
        const width = Math.max(rect.width, box.width);
        const height = Math.max(rect.height, box.height);
        if (width + 0.5 < min || height + 0.5 < min) {
          const id = element.id ? `#${element.id}` : "";
          const cls = element.classList.length
            ? `.${Array.from(element.classList).join(".")}`
            : "";
          offenders.push({
            description: `${element.tagName.toLowerCase()}${id}${cls}`,
            width: Math.round(width * 10) / 10,
            height: Math.round(height * 10) / 10,
          });
        }
      }
      return offenders;
    },
    { selector: ACTIONABLE_SELECTOR, min: minimum },
  );
}

// ---------------------------------------------------------------------------
// Answer-leakage inspection
// ---------------------------------------------------------------------------

export interface LeakageSurface {
  /** Everything a sighted learner can read before attempting. */
  readonly visibleText: string;
  /** The accessibility name/description tree an AT user hears. */
  readonly accessibleText: string;
  /** Text inside nodes that are visually or semantically hidden. */
  readonly hiddenText: string;
  /** Every `data-*` attribute value present anywhere under the surface. */
  readonly dataAttributes: readonly string[];
  /** Every other attribute value that could carry an answer. */
  readonly attributeValues: readonly string[];
}

/**
 * Collects everything an activity's DOM subtree exposes *before* an attempt:
 * visible text, accessible names/descriptions, hidden nodes, and every
 * `data-*`/attribute value. The Base leakage contract is that no canonical or
 * alternative answer string appears in any of them.
 */
export async function collectLeakageSurface(
  page: Page,
  selector: string,
): Promise<LeakageSurface> {
  const dom = await page.evaluate((sel: string) => {
    const root = document.querySelector<HTMLElement>(sel);
    if (!root) throw new Error(`collectLeakageSurface: no element for "${sel}"`);
    const visibleParts: string[] = [];
    const hiddenParts: string[] = [];
    const dataAttributes: string[] = [];
    const attributeValues: string[] = [];

    const walk = (element: Element, hidden: boolean): void => {
      const style =
        element instanceof HTMLElement ? getComputedStyle(element) : null;
      const selfHidden =
        hidden ||
        element.getAttribute("aria-hidden") === "true" ||
        element.hasAttribute("hidden") ||
        (style !== null &&
          (style.display === "none" ||
            style.visibility === "hidden" ||
            Number.parseFloat(style.opacity) === 0));
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name.startsWith("data-")) {
          dataAttributes.push(`${attribute.name}=${attribute.value}`);
        } else if (
          [
            "title",
            "alt",
            "placeholder",
            "value",
            "aria-label",
            "aria-description",
            "aria-valuetext",
            "content",
          ].includes(attribute.name)
        ) {
          attributeValues.push(`${attribute.name}=${attribute.value}`);
        }
      }
      for (const node of Array.from(element.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent ?? "";
          if (text.trim().length === 0) continue;
          if (selfHidden) hiddenParts.push(text);
          else visibleParts.push(text);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          walk(node as Element, selfHidden);
        }
      }
    };

    walk(root, false);
    return {
      visibleText: visibleParts.join(" "),
      hiddenText: hiddenParts.join(" "),
      dataAttributes,
      attributeValues,
    };
  }, selector);

  const snapshot = await page.locator(selector).ariaSnapshot();
  return { ...dom, accessibleText: snapshot };
}

/**
 * Fails if any of the supplied answer strings is discoverable anywhere in the
 * surface — visible text, accessibility tree, hidden nodes, or attributes.
 */
export function assertNoAnswerLeakage(
  surface: LeakageSurface,
  answers: readonly string[],
  label: string,
): void {
  const haystacks: readonly (readonly [string, string])[] = [
    ["visible text", surface.visibleText],
    ["accessibility snapshot", surface.accessibleText],
    ["hidden nodes", surface.hiddenText],
    ["data-* attributes", surface.dataAttributes.join(" ")],
    ["other attributes", surface.attributeValues.join(" ")],
  ];
  for (const answer of answers) {
    const normalized = answer.trim();
    if (normalized.length === 0) continue;
    for (const [where, haystack] of haystacks) {
      expect(
        haystack.includes(normalized),
        `${label}: "${normalized}" must not be discoverable in ${where}`,
      ).toBe(false);
    }
  }
}

// ---------------------------------------------------------------------------
// Evidence-rich V4 localStorage payload (Task 3 migration source)
// ---------------------------------------------------------------------------

export const PROGRESS_STORAGE_KEY = "nihongo.course.progress";
export const COURSE_LEVEL_PREFERENCE_KEY = "nihongo.course.level";

const V4_T0 = "2026-01-05T09:00:00.000Z";
const V4_T1 = "2026-01-06T10:30:00.000Z";
const V4_T2 = "2026-01-07T18:45:00.000Z";

function inventoryFor(lessonId: string): readonly { definitionId: string; reviewKey: string }[] {
  return V4_ACTIVITY_INVENTORY.filter((row) => row.lessonId === lessonId);
}

/** Two rehomed source lessons whose evidence must survive the ownership move. */
export const REHOMED_EVIDENCE_LESSON_ID = V4_REHOMED_LESSON_IDS[0];
export const REHOMED_LAST_VISITED_LESSON_ID = V4_REHOMED_LESSON_IDS[16];

/** A retained-A1 lesson whose evidence must stay in A1 after the migration. */
export const RETAINED_A1_EVIDENCE_LESSON_ID = "introductions-1";
/** A *current* retained-A1 activity id, so its review entry is genuinely kept. */
export const RETAINED_A1_EVIDENCE_ACTIVITY_ID =
  "introductions-1-round-1::introductions-1-m5";
export const RETAINED_A1_EVIDENCE_CAN_DO_ID = "a1-can-do-identity";

/** The A2 lesson whose evidence must come through unchanged. */
export const A2_EVIDENCE_LESSON_ID = "connected-conversation-1";
/** A *current* A2 activity id, so its review entry survives reconciliation. */
export const A2_EVIDENCE_ACTIVITY_ID =
  "connected-conversation-1-round-1::connected-conversation-1-m5";
export const A2_EVIDENCE_CAN_DO_ID = "a2-cando-backchannel-followup";
export const A2_EVIDENCE_CHECKPOINT_ATTEMPT_ID = "a2-checkpoint-attempt-1";
export const A2_EVIDENCE_REVIEW_KEY = `${A2_EVIDENCE_LESSON_ID}:${A2_EVIDENCE_ACTIVITY_ID}`;

const rehomedInventory = inventoryFor(REHOMED_EVIDENCE_LESSON_ID);
const lastVisitedInventory = inventoryFor(REHOMED_LAST_VISITED_LESSON_ID);

/**
 * Historical V4 activity ids that had real evidence and therefore must appear
 * in the migrated record's historical-activity disposition list rather than
 * being silently dropped.
 */
export const HISTORICAL_ACTIVITY_IDS: readonly string[] = Object.freeze([
  ...rehomedInventory.map((row) => row.definitionId),
  ...lastVisitedInventory.map((row) => row.definitionId),
]);

function lessonRecord(overrides: {
  visitedAt: string;
  practicedAt?: string | null;
  consolidatedAt?: string | null;
  attemptedExerciseIds?: readonly string[];
  acceptedExerciseIds?: readonly string[];
}) {
  return {
    visitedAt: overrides.visitedAt,
    practicedAt: overrides.practicedAt ?? null,
    consolidatedAt: overrides.consolidatedAt ?? null,
    attemptedExerciseIds: [...(overrides.attemptedExerciseIds ?? [])],
    acceptedExerciseIds: [...(overrides.acceptedExerciseIds ?? [])],
  };
}

function reviewEntry(lessonId: string, exerciseDefinitionId: string, at: string) {
  return {
    reviewKey: `${lessonId}:${exerciseDefinitionId}`,
    lessonId,
    exerciseDefinitionId,
    targetConceptIds: ["preserved-concept"],
    targetLexemeIds: ["preserved-lexeme"],
    mistakeCount: 2,
    lastMistakeAt: at,
  };
}

/**
 * The evidence-rich schema-V4 payload the Task 3 ownership migration was
 * designed against: real lesson records (visited + practiced + consolidated +
 * attempted/accepted activity ids) on rehomed Base-bound lessons, on a
 * retained A1 lesson, and on an A2 lesson, plus Can-do evidence, checkpoint
 * attempts, review-queue entries, and pre-existing orphan lists on every
 * level. Loading it drives the real, shipped V4→V5 migration in the browser.
 *
 * Activity ids come from the frozen `V4_ACTIVITY_INVENTORY` rather than
 * invented strings, so this fixture exercises the same historical-activity
 * dispositions the migration registries actually enumerate.
 */
export function evidenceRichV4Progress(): CourseProgressV4 {
  const rehomedCanDoId = "a1-can-do-sounds";
  return {
    schemaVersion: 4,
    catalogVersion: CURRENT_COURSE_PROGRESS_CATALOG_VERSION,
    levels: {
      a1: {
        lessons: {
          [REHOMED_EVIDENCE_LESSON_ID]: lessonRecord({
            visitedAt: V4_T0,
            practicedAt: V4_T1,
            consolidatedAt: V4_T2,
            attemptedExerciseIds: rehomedInventory.map((row) => row.definitionId),
            acceptedExerciseIds: rehomedInventory
              .slice(0, 2)
              .map((row) => row.definitionId),
          }),
          [REHOMED_LAST_VISITED_LESSON_ID]: lessonRecord({
            visitedAt: V4_T2,
            practicedAt: V4_T2,
            attemptedExerciseIds: lastVisitedInventory.map((row) => row.definitionId),
            acceptedExerciseIds: lastVisitedInventory
              .slice(0, 1)
              .map((row) => row.definitionId),
          }),
          [RETAINED_A1_EVIDENCE_LESSON_ID]: lessonRecord({
            visitedAt: V4_T1,
            practicedAt: V4_T1,
            attemptedExerciseIds: [RETAINED_A1_EVIDENCE_ACTIVITY_ID],
            acceptedExerciseIds: [RETAINED_A1_EVIDENCE_ACTIVITY_ID],
          }),
        },
        canDos: {
          [rehomedCanDoId]: {
            canDoId: rehomedCanDoId,
            visitedLessonIds: [REHOMED_EVIDENCE_LESSON_ID],
            practicedLessonIds: [REHOMED_EVIDENCE_LESSON_ID],
            acceptedTransferExerciseIds: rehomedInventory
              .slice(0, 2)
              .map((row) => row.definitionId),
            checkpointAttemptIds: ["a1-checkpoint-attempt-1"],
            lastUpdatedAt: V4_T2,
          },
          [RETAINED_A1_EVIDENCE_CAN_DO_ID]: {
            canDoId: RETAINED_A1_EVIDENCE_CAN_DO_ID,
            visitedLessonIds: [RETAINED_A1_EVIDENCE_LESSON_ID],
            practicedLessonIds: [RETAINED_A1_EVIDENCE_LESSON_ID],
            acceptedTransferExerciseIds: [RETAINED_A1_EVIDENCE_ACTIVITY_ID],
            checkpointAttemptIds: [],
            lastUpdatedAt: V4_T1,
          },
        },
        checkpointAttempts: [
          {
            id: "a1-checkpoint-attempt-1",
            checkpointId: "a1-checkpoint",
            attemptedAt: V4_T2,
            acceptedExerciseIds: rehomedInventory
              .slice(0, 1)
              .map((row) => row.definitionId),
            sampledCanDoIds: [rehomedCanDoId],
          },
        ],
        lastVisitedLessonId: REHOMED_LAST_VISITED_LESSON_ID,
        reviewQueue: [
          reviewEntry(
            REHOMED_EVIDENCE_LESSON_ID,
            rehomedInventory[0]!.definitionId,
            V4_T2,
          ),
          reviewEntry(
            RETAINED_A1_EVIDENCE_LESSON_ID,
            RETAINED_A1_EVIDENCE_ACTIVITY_ID,
            V4_T1,
          ),
        ],
        orphanedLessonIds: ["retired-a1-lesson"],
        orphanedReviewKeys: ["retired-a1-lesson:retired-activity"],
      },
      a2: {
        lessons: {
          [A2_EVIDENCE_LESSON_ID]: lessonRecord({
            visitedAt: V4_T0,
            practicedAt: V4_T1,
            consolidatedAt: V4_T2,
            attemptedExerciseIds: [A2_EVIDENCE_ACTIVITY_ID],
            acceptedExerciseIds: [A2_EVIDENCE_ACTIVITY_ID],
          }),
        },
        canDos: {
          [A2_EVIDENCE_CAN_DO_ID]: {
            canDoId: A2_EVIDENCE_CAN_DO_ID,
            visitedLessonIds: [A2_EVIDENCE_LESSON_ID],
            practicedLessonIds: [A2_EVIDENCE_LESSON_ID],
            acceptedTransferExerciseIds: [A2_EVIDENCE_ACTIVITY_ID],
            checkpointAttemptIds: [A2_EVIDENCE_CHECKPOINT_ATTEMPT_ID],
            lastUpdatedAt: V4_T2,
          },
        },
        checkpointAttempts: [
          {
            id: A2_EVIDENCE_CHECKPOINT_ATTEMPT_ID,
            checkpointId: "a2-checkpoint",
            attemptedAt: V4_T2,
            acceptedExerciseIds: [A2_EVIDENCE_ACTIVITY_ID],
            sampledCanDoIds: [A2_EVIDENCE_CAN_DO_ID],
          },
        ],
        lastVisitedLessonId: A2_EVIDENCE_LESSON_ID,
        reviewQueue: [
          reviewEntry(A2_EVIDENCE_LESSON_ID, A2_EVIDENCE_ACTIVITY_ID, V4_T2),
        ],
        orphanedLessonIds: ["retired-a2-lesson"],
        orphanedReviewKeys: ["retired-a2-lesson:retired-activity"],
      },
    },
    migrationNotice: null,
    updatedAt: V4_T2,
  };
}

/** The exact bytes the fixture writes into `localStorage`. */
export const EVIDENCE_RICH_V4_PAYLOAD: string = JSON.stringify(
  evidenceRichV4Progress(),
);

/**
 * Seeds the evidence-rich V4 payload before the document loads, so the app's
 * own `ProgressProvider` performs the real V4→V5 migration during its first
 * render — exactly as it would for a returning learner.
 */
export async function seedV4Progress(
  page: Page,
  payload: string = EVIDENCE_RICH_V4_PAYLOAD,
): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      try {
        localStorage.clear();
        localStorage.setItem(key, value);
      } catch {
        /* storage may be unavailable; the app renders its own warning */
      }
    },
    { key: PROGRESS_STORAGE_KEY, value: payload },
  );
}

/** Clears every persisted setting before the document loads (fresh learner). */
export async function seedFreshLearner(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

/** Reads the app's persisted, already-migrated V5 progress back out. */
export async function readStoredProgress(page: Page): Promise<{
  schemaVersion: number;
  catalogVersion: string;
  levels: Record<
    string,
    {
      lessons: Record<string, { visitedAt: string | null; practicedAt: string | null; consolidatedAt: string | null; attemptedExerciseIds: string[]; acceptedExerciseIds: string[] }>;
      canDos: Record<string, { canDoId: string; visitedLessonIds: string[]; practicedLessonIds: string[]; acceptedTransferExerciseIds: string[]; checkpointAttemptIds: string[]; historicalCheckpointRefs: { sourceLevel: string; attemptId: string }[] }>;
      checkpointAttempts: { id: string; checkpointId: string }[];
      lastVisitedLessonId: string | null;
      reviewQueue: { reviewKey: string; lessonId: string }[];
      orphanedLessonIds: string[];
      orphanedReviewKeys: string[];
      orphanedLessonRecords: Record<string, unknown>;
      historicalActivityDispositions: {
        sourceLevel: string;
        lessonId: string;
        activityId: string;
        disposition: string;
      }[];
    }
  >;
  migrationNotice: {
    fromSchemaVersion: number;
    movedLessonIds: string[];
    historicalActivityIds: string[];
    resumeLevel: string;
    acknowledgedAt: string | null;
  } | null;
}> {
  const raw = await page.evaluate(
    (key: string) => localStorage.getItem(key),
    PROGRESS_STORAGE_KEY,
  );
  expect(raw, "the app persisted its migrated progress").not.toBeNull();
  return JSON.parse(raw!);
}

// ---------------------------------------------------------------------------
// Screenshot state setup
// ---------------------------------------------------------------------------

export type ScriptMode = "hiragana" | "romaji";
export type UiLocale = "it" | "en";

export interface ScreenshotState {
  readonly locale?: UiLocale;
  readonly script?: ScriptMode;
}

/**
 * Puts the app into a deterministic visual state before a baseline capture:
 * the requested UI locale and script mode are applied through the real
 * header/settings controls (never by writing internal state), the page is
 * scrolled to the top, and layout is settled.
 */
export async function applyScreenshotState(
  page: Page,
  state: ScreenshotState = {},
): Promise<void> {
  const viewport = page.viewportSize();
  const mobile = !!viewport && viewport.width < 700;

  if (state.locale || state.script) {
    if (mobile) {
      await page.locator(".header__settings-trigger").click();
      await expect(page.locator(".settings-drawer__panel")).toBeVisible();
    }
    const root = mobile
      ? page.locator(".settings-drawer__panel")
      : page.locator(".header__settings--desktop");
    if (state.locale) {
      const label = state.locale === "en" ? "EN" : "IT";
      const button = root.locator(".localetoggle button", { hasText: label });
      if ((await button.getAttribute("aria-pressed")) !== "true") await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }
    if (state.script) {
      const index = state.script === "romaji" ? 1 : 0;
      const button = root.locator(".scripttoggle button").nth(index);
      if ((await button.getAttribute("aria-pressed")) !== "true") await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }
    if (mobile) {
      await page.keyboard.press("Escape");
      await expect(page.locator(".settings-drawer__panel")).toHaveCount(0);
    }
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
}

/** Human-readable viewport tag used in baseline filenames. */
export function viewportTag(page: Page): "desktop" | "mobile" {
  const viewport = page.viewportSize();
  return viewport && viewport.width < 700 ? "mobile" : "desktop";
}
