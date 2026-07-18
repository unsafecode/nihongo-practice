import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  assertLocalOnlyNetwork,
  assertNoHorizontalOverflow,
  assertNoRuntimeErrors,
  auditNakedActions,
  auditTouchTargets,
  gotoReady,
  holdNextRecognition,
  installSpeechFake,
  queueSpeechOutcome,
  resolvePendingRecognition,
  routeUrls,
  setupPageObservers,
  speechStats,
  speechStatusLog,
  type SpeechFakeConfig,
  type PageObservers,
} from "./helpers";

/**
 * Slice D Task 4 — stubbed speech recognition acceptance (design spec §5.3,
 * §12.1-§12.3). These cases drive the *real* built app through a production
 * Pages-base preview, injecting a fake that satisfies exactly the public
 * `SpeechRecognizer` contract before boot. No microphone, permission prompt,
 * real Web Speech engine, component-internal patch, or network is involved, so
 * the strict runtime and local-only network guards stay in force with no
 * speech/vendor allowlist. Selectors prefer the accessible role + name and the
 * stable region classes over brittle prose or implementation internals.
 */

/** The lesson used across the functional suite: a clear, fully-segmented target
 * ("Ken is a doctor") whose four independent segments make a truthful `close`
 * result reachable, and which is also exercise-rich for the no-block case. */
const SPEECH_LESSON = { moduleId: "introductions", lessonId: "introductions-1" } as const;
const SPEECH_LESSON_URL = routeUrls.lesson(
  SPEECH_LESSON.moduleId,
  SPEECH_LESSON.lessonId,
);
const NEXT_SPEECH_LESSON_URL = routeUrls.lesson("introductions", "introductions-2");
const KATAKANA_LESSON_URL = routeUrls.lesson("sounds", "sounds-4");

/** Deterministic transcripts, derived from the resolved prompt for this lesson:
 * the exact canonical target (matched), the canonical target plus one trailing
 * kana (within the close edit budget, every critical segment still aligned), and
 * an unrelated sentence (retry). No answer literal is invented beyond the target
 * sentence the lesson itself teaches. */
const TARGET_JP = "けんはいしゃです";
const CLOSE_JP = "けんはいしゃですね";
const RETRY_JP = "ちがいます";

/** The English translation the lesson shows for the target (locale-agnostic UI
 * proof only — never a Japanese literal). */
const MEANING_EN = "Ken is a doctor.";

type Locale = "it" | "en";

/** Every user-facing string the suite asserts, per locale, mirrored verbatim
 * from `src/course/i18n/{it,en}.ts` so the tests read as their own contract and
 * do not pull the whole app graph into the Playwright transform. */
const COPY: Record<Locale, Record<string, string>> = {
  it: {
    heading: "Prova a dirla (facoltativo)",
    listen: "Ascolta il modello",
    tryButton: "Prova a parlare",
    consentTitle: "Prima di usare il microfono",
    consentAcknowledge: "Ho capito, continua",
    consentDismiss: "Non ora",
    micStart: "Parla ora",
    micStop: "Interrompi",
    tryAgain: "Riprova",
    statusListening: "In ascolto…",
    statusProcessing: "Controllo che cosa ha sentito il browser…",
    resultMatched: "Il browser ha riconosciuto la frase.",
    resultClose: "Il browser ha riconosciuto quasi tutta la frase.",
    resultRetry: "Il browser non ha riconosciuto la frase. Riprova.",
    errorUnsupported:
      "Questo browser non trasforma la voce in testo. Puoi comunque ascoltare il modello e ripetere ad alta voce.",
    errorDenied:
      "Il microfono è bloccato. Puoi comunque ascoltare il modello e ripetere ad alta voce.",
    errorNoSpeech:
      "Il browser non ha sentito nulla. Riprova, oppure ascolta il modello e ripeti ad alta voce.",
    errorAborted: "La registrazione si è interrotta.",
    errorNetwork:
      "Per trasformare la voce in testo serve una connessione e ora il servizio non è raggiungibile. Puoi comunque ascoltare il modello e ripetere ad alta voce.",
    errorService:
      "La trasformazione della voce in testo non è disponibile ora. Puoi comunque ascoltare il modello e ripetere ad alta voce.",
    heardLabel: "Il browser ha sentito:",
    segmentMatched: "riconosciuta",
    segmentMissing: "non riconosciuta",
  },
  en: {
    heading: "Try saying it (optional)",
    listen: "Play the model",
    tryButton: "Try speaking",
    consentTitle: "Before you use the microphone",
    consentAcknowledge: "I understand, continue",
    consentDismiss: "Not now",
    micStart: "Speak now",
    micStop: "Stop",
    tryAgain: "Try again",
    statusListening: "Listening…",
    statusProcessing: "Checking what your browser heard…",
    resultMatched: "Your browser recognized the sentence.",
    resultClose: "Your browser recognized almost all of the sentence.",
    resultRetry: "Your browser did not recognize the sentence. Try again.",
    errorUnsupported:
      "This browser cannot turn speech into text. You can still play the model and repeat it aloud.",
    errorDenied:
      "The microphone is blocked. You can still play the model and repeat it aloud.",
    errorNoSpeech:
      "Your browser did not hear anything. Try again, or play the model and repeat it aloud.",
    errorAborted: "The recording stopped.",
    errorNetwork:
      "Turning speech into text needs a connection right now and the service is not reachable. You can still play the model and repeat it aloud.",
    errorService:
      "Turning speech into text is not available right now. You can still play the model and repeat it aloud.",
    heardLabel: "Your browser heard:",
    segmentMatched: "recognized",
    segmentMissing: "not recognized",
  },
};

/** Truthfulness guard vocabulary: a spoken attempt must never claim a score,
 * percentage, or pronunciation/accuracy judgement in either language. */
const FORBIDDEN_CLAIMS = [
  "%",
  "punteggio",
  "percentuale",
  "pronuncia",
  "accuratezza",
  "accento",
  "voto",
  "score",
  "percent",
  "pronunciation",
  "accuracy",
  "accent",
  "fluency",
  "grade",
];

function isMobile(width: number): boolean {
  return width < 700;
}

function isSubsequence(sequence: readonly string[], sub: readonly string[]): boolean {
  let index = 0;
  for (const value of sequence) {
    if (index < sub.length && value === sub[index]) index += 1;
  }
  return index === sub.length;
}

interface SpeechHandle {
  readonly observers: PageObservers;
  readonly block: Locator;
  readonly status: Locator;
}

/** Boot the speech lesson with the fake installed and strict guards armed. */
async function bootSpeech(
  page: Page,
  options: { url?: string; fake?: SpeechFakeConfig } = {},
): Promise<SpeechHandle> {
  const observers = await setupPageObservers(page);
  await installSpeechFake(page, options.fake ?? {});
  await gotoReady(page, options.url ?? SPEECH_LESSON_URL);
  const block = page.locator(".spoken-attempt");
  await expect(block).toBeVisible();
  await block.scrollIntoViewIfNeeded();
  return { observers, block, status: block.locator(".spoken-attempt__status-text") };
}

function button(block: Locator, name: string): Locator {
  return block.getByRole("button", { name, exact: true });
}

/** Walk the disclosure from initial → consent notice → acknowledged mic. */
async function acknowledgeConsent(block: Locator, copy: Record<string, string>): Promise<void> {
  await button(block, copy.tryButton).click();
  await expect(block.locator(".spoken-attempt__consent")).toBeVisible();
  await expect(block.getByText(copy.consentTitle)).toBeVisible();
  await button(block, copy.consentAcknowledge).click();
  await expect(button(block, copy.micStart)).toBeVisible();
}

/** Resolve the single visible settings container for the current viewport. */
async function settingsContainer(
  page: Page,
  viewport: { width: number; height: number } | null,
): Promise<Locator> {
  if (viewport && isMobile(viewport.width)) {
    await page.locator(".header__settings-trigger").click();
    const panel = page.locator(".settings-drawer__panel");
    await expect(panel).toBeVisible();
    return panel;
  }
  return page.locator(".header__settings--desktop");
}

async function blockText(block: Locator): Promise<string> {
  return (await block.innerText()).toLowerCase();
}

function assertNoScoreClaims(text: string): void {
  for (const term of FORBIDDEN_CLAIMS) {
    expect(text, `spoken attempt must not claim "${term}"`).not.toContain(
      term.toLowerCase(),
    );
  }
}

test.describe("consent precedes the microphone", () => {
  test("acknowledgement labels stay neutral in both locales while the mic action stays separate", async ({
    page,
    viewport,
  }) => {
    const { observers, block } = await bootSpeech(page);

    await button(block, COPY.it.tryButton).click();
    const italianAcknowledge = button(block, COPY.it.consentAcknowledge);
    await expect(italianAcknowledge).toBeVisible();
    expect((await italianAcknowledge.innerText()).toLowerCase()).not.toMatch(
      /\b(attiva|avvia|inizia|usa|microfono)\b/,
    );
    await expect(button(block, COPY.it.micStart)).toHaveCount(0);
    await button(block, COPY.it.consentDismiss).click();

    const settings = await settingsContainer(page, viewport ?? null);
    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    if (viewport && isMobile(viewport.width)) {
      await page.keyboard.press("Escape");
    }

    await gotoReady(page, SPEECH_LESSON_URL);
    await button(block, COPY.en.tryButton).click();
    const englishAcknowledge = button(block, COPY.en.consentAcknowledge);
    await expect(englishAcknowledge).toBeVisible();
    expect((await englishAcknowledge.innerText()).toLowerCase()).not.toMatch(
      /\b(activate|enable|start|use|microphone)\b/,
    );
    await expect(button(block, COPY.en.micStart)).toHaveCount(0);
    await englishAcknowledge.click();
    await expect(button(block, COPY.en.micStart)).toBeVisible();

    await expect(button(block, COPY.en.micStart)).toHaveText(COPY.en.micStart);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("acknowledging the privacy notice makes no recognize call; a separate mic click calls recognize once with ja-JP", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);

    // The explicit privacy notice must not exist until the learner asks for it,
    // and no recognition may have happened yet.
    await expect(block.locator(".spoken-attempt__consent")).toHaveCount(0);
    await expect(button(block, copy.tryButton)).toBeVisible();
    expect((await speechStats(page)).recognizeCount).toBe(0);

    // Requesting consent shows the privacy disclosure *before* any mic control.
    await button(block, copy.tryButton).click();
    await expect(block.getByText(copy.consentTitle)).toBeVisible();
    await expect(block.getByText(/non salva alcun audio/i)).toBeVisible();
    await expect(button(block, copy.micStart)).toHaveCount(0);

    // Acknowledging the notice only records consent — it never calls recognize.
    await button(block, copy.consentAcknowledge).click();
    await expect(button(block, copy.micStart)).toBeVisible();
    expect((await speechStats(page)).recognizeCount).toBe(0);

    // The separate microphone control is the only path that contacts the engine.
    await queueSpeechOutcome(page, { kind: "transcript", transcript: TARGET_JP });
    await button(block, copy.micStart).click();
    await expect(status).toHaveText(copy.resultMatched);

    const stats = await speechStats(page);
    expect(stats.calls).toEqual([{ lang: "ja-JP" }]);
    expect(stats.recognizeCount).toBe(1);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("truthful result states", () => {
  test("a matched attempt announces recognition, shows the transcript and every segment recognized, and claims no score", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);

    await queueSpeechOutcome(page, { kind: "transcript", transcript: TARGET_JP });
    await button(block, copy.micStart).click();

    await expect(status).toHaveText(copy.resultMatched);
    // The recognized transcript is shown verbatim and marked as Japanese.
    const heard = block.locator(".spoken-attempt__heard-text");
    await expect(heard).toHaveText(TARGET_JP);
    await expect(heard).toHaveAttribute("lang", "ja");
    // Coherent per-segment records: all four target segments recognized, none missing.
    await expect(block.locator(".spoken-attempt__segment")).toHaveCount(4);
    await expect(block.locator(".spoken-attempt__segment--matched")).toHaveCount(4);
    await expect(block.locator(".spoken-attempt__segment--missing")).toHaveCount(0);
    await expect(
      block.locator(".spoken-attempt__segment-state").first(),
    ).toHaveText(copy.segmentMatched);

    assertNoScoreClaims(await blockText(block));
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("a close attempt announces the close copy, keeps the target and repeat fallback, and claims no score", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);

    await queueSpeechOutcome(page, { kind: "transcript", transcript: CLOSE_JP });
    await button(block, copy.micStart).click();

    await expect(status).toHaveText(copy.resultClose);
    await expect(block.locator(".spoken-attempt__heard-text")).toHaveText(CLOSE_JP);
    // The always-available listen-and-repeat fallback stays offered.
    await expect(block.locator(".spoken-attempt__repeat")).toBeVisible();
    // The target sentence and meaning remain visible.
    await expect(block.locator(".spoken-attempt__sentence")).toBeVisible();
    await expect(block.locator(".spoken-attempt__meaning")).toBeVisible();

    assertNoScoreClaims(await blockText(block));
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("a retry attempt announces the retry copy, records a missing segment, and preserves the target and repeat fallback", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);

    await queueSpeechOutcome(page, { kind: "transcript", transcript: RETRY_JP });
    await button(block, copy.micStart).click();

    await expect(status).toHaveText(copy.resultRetry);
    await expect(block.locator(".spoken-attempt__heard-text")).toHaveText(RETRY_JP);
    await expect(
      block.locator(".spoken-attempt__segment--missing").first(),
    ).toBeVisible();
    await expect(block.locator(".spoken-attempt__repeat")).toBeVisible();
    await expect(block.locator(".spoken-attempt__sentence")).toBeVisible();

    assertNoScoreClaims(await blockText(block));
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("distinct localized failure states", () => {
  const FAILURES = [
    { failure: "denied", copyKey: "errorDenied" },
    { failure: "no-speech", copyKey: "errorNoSpeech" },
    { failure: "aborted", copyKey: "errorAborted" },
    { failure: "network-error", copyKey: "errorNetwork" },
    { failure: "service-error", copyKey: "errorService" },
  ] as const;

  test("every mapped recognition failure shows distinct copy and preserves the target, playback, and repeat fallback", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);

    const seen: string[] = [];
    for (let index = 0; index < FAILURES.length; index += 1) {
      const { failure, copyKey } = FAILURES[index];
      await queueSpeechOutcome(page, { kind: "failure", failure });
      // The first attempt uses the mic control; later ones use "Try again".
      const control = index === 0 ? copy.micStart : copy.tryAgain;
      await button(block, control).click();

      await expect(status).toHaveText(copy[copyKey]);
      seen.push(copy[copyKey]);

      // Each failure preserves the visible target, the model playback control,
      // and the listen-and-repeat fallback so no exercise path is lost.
      await expect(block.locator(".spoken-attempt__sentence")).toBeVisible();
      await expect(button(block, copy.listen)).toBeVisible();
      await expect(block.locator(".spoken-attempt__repeat")).toBeVisible();
      // A failure never fabricates a transcript or a result region.
      await expect(block.locator(".spoken-attempt__heard")).toHaveCount(0);
      await expect(block.locator(".spoken-attempt__segments")).toHaveCount(0);
      assertNoScoreClaims(await blockText(block));
    }

    // The five failure announcements are pairwise distinct.
    expect(new Set(seen).size).toBe(FAILURES.length);
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test("an unsupported engine shows its own copy, offers playback and repeat, and never renders consent or a mic control", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block } = await bootSpeech(page, { fake: { supported: false } });

    await expect(block.getByText(copy.errorUnsupported)).toBeVisible();
    await expect(block.locator(".spoken-attempt__repeat")).toBeVisible();
    await expect(button(block, copy.listen)).toBeVisible();
    await expect(block.locator(".spoken-attempt__sentence")).toBeVisible();
    // No consent notice and no recognition control are offered when unsupported.
    await expect(button(block, copy.tryButton)).toHaveCount(0);
    await expect(button(block, copy.micStart)).toHaveCount(0);
    await expect(block.locator(".spoken-attempt__consent")).toHaveCount(0);
    // The unsupported copy is distinct from every mapped failure copy.
    for (const key of ["errorDenied", "errorNoSpeech", "errorAborted", "errorNetwork", "errorService"]) {
      expect(copy.errorUnsupported).not.toBe(copy[key]);
    }
    // A truly unsupported engine is never contacted.
    expect((await speechStats(page)).recognizeCount).toBe(0);

    assertNoScoreClaims(await blockText(block));
    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("live progress is externally announced", () => {
  test("listening and processing are announced in a polite region that does not steal focus", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);

    // Hold the request so the listening state is externally observable.
    await holdNextRecognition(page);
    await button(block, copy.micStart).click();
    await expect(status).toHaveText(copy.statusListening);

    // The status is a polite live region and is not a focus target.
    const statusRegion = block.locator(".spoken-attempt__status");
    await expect(statusRegion).toHaveAttribute("role", "status");
    await expect(statusRegion).toHaveAttribute("aria-live", "polite");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest(".spoken-attempt__status"),
      ),
    ).toBe(false);

    // Settle the held request; the processing state then gives way to a result.
    await resolvePendingRecognition(page, { kind: "transcript", transcript: TARGET_JP });
    await expect(status).toHaveText(copy.resultMatched);

    // The recorded announcement sequence proves listening → processing → result.
    const log = await speechStatusLog(page);
    expect(
      isSubsequence(log, [copy.statusListening, copy.statusProcessing, copy.resultMatched]),
      `announcement log ${JSON.stringify(log)}`,
    ).toBe(true);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("abort and retry are operable", () => {
  test("an in-flight attempt aborts and retries by keyboard", async ({ page }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);

    await holdNextRecognition(page);
    await button(block, copy.micStart).click();
    await expect(status).toHaveText(copy.statusListening);

    // Abort with the keyboard.
    const stop = button(block, copy.micStop);
    await stop.focus();
    await page.keyboard.press("Enter");
    await expect(status).toHaveText(copy.errorAborted);
    expect((await speechStats(page)).abortCount).toBe(1);

    // Retry with the keyboard from the aborted state.
    await queueSpeechOutcome(page, { kind: "transcript", transcript: TARGET_JP });
    const retry = button(block, copy.tryAgain);
    await retry.focus();
    await page.keyboard.press("Enter");
    await expect(status).toHaveText(copy.resultMatched);
    expect((await speechStats(page)).recognizeCount).toBe(2);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });

  test.describe("touch", () => {
    test.use({ hasTouch: true });

    test("an in-flight attempt aborts and retries by touch", async ({ page }) => {
      const copy = COPY.it;
      const { observers, block, status } = await bootSpeech(page);
      await acknowledgeConsent(block, copy);

      await holdNextRecognition(page);
      await button(block, copy.micStart).tap();
      await expect(status).toHaveText(copy.statusListening);

      await button(block, copy.micStop).tap();
      await expect(status).toHaveText(copy.errorAborted);
      expect((await speechStats(page)).abortCount).toBe(1);

      await queueSpeechOutcome(page, { kind: "transcript", transcript: CLOSE_JP });
      await button(block, copy.tryAgain).tap();
      await expect(status).toHaveText(copy.resultClose);

      await assertNoRuntimeErrors(page, observers);
      assertLocalOnlyNetwork(observers);
    });
  });

  test("a stale pending result after navigation cannot affect the next lesson", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);

    // Leave a request in flight, then navigate in-app to the next lesson.
    await holdNextRecognition(page);
    await button(block, copy.micStart).click();
    await expect(status).toHaveText(copy.statusListening);

    await page.evaluate(() => {
      window.location.hash = "#/percorso/introductions/introductions-2";
    });
    await page.waitForFunction(() => window.location.hash.includes("introductions-2"));
    const nextBlock = page.locator(".spoken-attempt");
    await expect(nextBlock).toBeVisible();
    // Consent persisted across the in-app navigation: the mic control is offered
    // directly, without the privacy notice again.
    await expect(button(nextBlock, copy.micStart)).toBeVisible();

    // Now settle the stale, previous-lesson request. It must not surface here.
    await resolvePendingRecognition(page, { kind: "transcript", transcript: TARGET_JP });
    await page.waitForTimeout(50);
    await expect(nextBlock.locator(".spoken-attempt__heard")).toHaveCount(0);
    await expect(nextBlock.locator(".spoken-attempt__segments")).toHaveCount(0);
    // The next lesson stays idle: no announcement region is rendered at all.
    await expect(nextBlock.locator(".spoken-attempt__status-text")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("session-only, non-persistent recognition", () => {
  test("consent persists across in-app navigation but no transcript or result persists after a full reload, and nothing speech-related is stored", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);

    // Consent survives in-app (hash) navigation without re-prompting.
    await page.evaluate(() => {
      window.location.hash = "#/percorso/introductions/introductions-2";
    });
    await page.waitForFunction(() => window.location.hash.includes("introductions-2"));
    const nextBlock = page.locator(".spoken-attempt");
    await expect(button(nextBlock, copy.micStart)).toBeVisible();

    // Produce a real result on the second lesson.
    await queueSpeechOutcome(page, { kind: "transcript", transcript: "わたしのなまえはけんです" });
    await button(nextBlock, copy.micStart).click();
    await expect(nextBlock.locator(".spoken-attempt__heard")).toBeVisible();

    // Nothing about the recognition attempt is written to storage.
    const storage = await page.evaluate(() => {
      const entries: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key) entries[key] = localStorage.getItem(key) ?? "";
      }
      return entries;
    });
    for (const [key, value] of Object.entries(storage)) {
      expect(key.toLowerCase(), `storage key ${key}`).not.toMatch(/audio|transcript|speech|recogni/);
      expect(value, `storage value under ${key}`).not.toContain("わたしのなまえは");
    }

    // A full reload resets the session: consent is asked again and no result or
    // transcript is restored.
    await page.reload({ waitUntil: "load" });
    const reloaded = page.locator(".spoken-attempt");
    await expect(reloaded).toBeVisible();
    await expect(button(reloaded, copy.tryButton)).toBeVisible();
    await expect(reloaded.locator(".spoken-attempt__heard")).toHaveCount(0);
    await expect(reloaded.locator(".spoken-attempt__segments")).toHaveCount(0);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("speech never blocks the rest of the course", () => {
  test("an unsupported engine leaves exercises, review, navigation, locale/script, katakana assistance, and Pages routes fully working", async ({
    page,
    viewport,
  }) => {
    const { observers } = await bootSpeech(page, { fake: { supported: false } });

    // The unsupported speech block is present but non-blocking.
    await expect(page.locator(".spoken-attempt__fallback")).toBeVisible();

    // 1) Exercises still complete and enqueue review. A wrong choice → retry.
    const wrongValue = "introductions-1-t3#introductions-1-t3::rule::o";
    const choice = page.locator(".lesson-exercise", {
      has: page.locator(`input[type=radio][value="${wrongValue}"]`),
    });
    await choice.locator(`input[type=radio][value="${wrongValue}"]`).check();
    await choice.locator("button[type=submit]").click();
    await expect(choice.locator(".lesson-exercise__feedback--retry")).toBeVisible();

    // 2) The mistake reached the review queue on Practice Home (Pages hash route).
    await gotoReady(page, routeUrls.practice);
    await expect(page.locator(".review-queue__item")).toHaveCount(1);

    // 3) Locale and script settings still work on the speech-bearing lesson.
    await gotoReady(page, SPEECH_LESSON_URL);
    const settings = await settingsContainer(page, viewport ?? null);
    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await expect(page.locator(".spoken-attempt__heading")).toHaveText(COPY.en.heading);
    await expect(page.getByText(COPY.en.errorUnsupported)).toBeVisible();

    // 4) Module 1's bridge lesson still renders its katakana phonetic roster
    // (the roster prints the katakana glyph plus its plain-text romaji inline;
    // no `ruby`-based furigana assist is wired up for the live A1 catalog).
    await gotoReady(page, KATAKANA_LESSON_URL);
    await expect(page.locator(".a1-phonetic-roster__item").first()).toBeVisible();
    await expect(page.locator("ruby.katakana-assist")).toHaveCount(0);
    // The speech block is still offered (unsupported) and never gates the lesson.
    await expect(page.locator(".spoken-attempt__fallback")).toBeVisible();

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("locale and script drive the speech block", () => {
  test("IT/EN copy and hiragana/romaji target both reflect the current settings", async ({
    page,
    viewport,
  }) => {
    const { observers, block } = await bootSpeech(page);

    // Default: Italian copy, hiragana-primary target.
    await expect(block.locator(".spoken-attempt__heading")).toHaveText(COPY.it.heading);
    const primary = block.locator(".spoken-attempt__glyph-primary").first();
    await expect(primary).toHaveAttribute("lang", "ja");

    // Open the one visible settings surface once, then drive both toggles from it
    // (re-opening the mobile drawer would fight its own backdrop).
    const settings = await settingsContainer(page, viewport ?? null);

    // English locale updates the block copy.
    await settings.locator(".localetoggle button", { hasText: "EN" }).click();
    await expect(block.locator(".spoken-attempt__heading")).toHaveText(COPY.en.heading);
    await expect(block.locator(".spoken-attempt__meaning")).toContainText(MEANING_EN);

    // Rōmaji script flips the primary target glyph to Latin text.
    await settings.locator(".scripttoggle button", { hasText: "Rōmaji" }).click();
    await expect(block.locator(".spoken-attempt__glyph-primary").first()).toHaveText(/[a-z]/);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("speech ergonomics", () => {
  test("consent controls meet 44px, focus is keyboard-visible, and there is no horizontal overflow", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block } = await bootSpeech(page);
    await button(block, copy.tryButton).click();
    await expect(block.locator(".spoken-attempt__consent")).toBeVisible();

    expect(await auditTouchTargets(page), "consent-state touch targets").toEqual([]);
    expect(await auditNakedActions(page), "consent-state naked actions").toEqual([]);
    await assertNoHorizontalOverflow(page);

    await assertNoRuntimeErrors(page, observers);
  });

  test("result controls meet 44px, keyboard focus is visibly outlined, status is text+shape, and layout does not overflow", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);
    await queueSpeechOutcome(page, { kind: "transcript", transcript: TARGET_JP });
    await button(block, copy.micStart).click();
    await expect(status).toHaveText(copy.resultMatched);

    expect(await auditTouchTargets(page), "result-state touch targets").toEqual([]);
    expect(await auditNakedActions(page), "result-state naked actions").toEqual([]);
    await assertNoHorizontalOverflow(page);

    // Reduced motion is honored in the acceptance environment.
    expect(
      await page.evaluate(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    ).toBe(true);

    // Status meaning is carried by text plus a shape glyph, never color alone.
    await expect(block.locator(".spoken-attempt__status-glyph")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(status).not.toHaveText("");

    // Keyboard focus lands on a speech control with a visible outline.
    await button(block, copy.listen).focus();
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return {
        insideBlock: !!el.closest(".spoken-attempt"),
        width: Number.parseFloat(style.outlineWidth),
        style: style.outlineStyle,
      };
    });
    expect(outline, "an element received keyboard focus").not.toBeNull();
    expect(outline!.insideBlock).toBe(true);
    expect(outline!.style).not.toBe("none");
    expect(outline!.width).toBeGreaterThanOrEqual(2);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});

test.describe("strict local-only recognition", () => {
  test("a full matched flow uses only the injected fake and issues no external or vendor request", async ({
    page,
  }) => {
    const copy = COPY.it;
    const { observers, block, status } = await bootSpeech(page);
    await acknowledgeConsent(block, copy);
    await queueSpeechOutcome(page, { kind: "transcript", transcript: TARGET_JP });
    await button(block, copy.micStart).click();
    await expect(status).toHaveText(copy.resultMatched);

    // The fake — not a real engine — served the request, and it made no I/O.
    const stats = await speechStats(page);
    expect(stats.recognizeCount).toBe(1);
    expect(stats.calls).toEqual([{ lang: "ja-JP" }]);

    await assertNoRuntimeErrors(page, observers);
    assertLocalOnlyNetwork(observers);
  });
});
