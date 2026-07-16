import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBrowserSpeechRecognizer,
  type MinimalSpeechRecognition,
  type SpeechRecognitionFactory,
} from "./browserSpeechRecognizer";
import type { RecognitionOutcome } from "./types";

/**
 * Browser speech adapter contract (design spec §12.2, Slice D plan Task 2). The
 * adapter is exercised through a dependency-injected minimal recognition factory
 * — never Chromium's real permission UI, microphone, or network. It maps vendor
 * events to typed {@link RecognitionOutcome}s, keeps exactly one active request,
 * settles each request once, detaches handlers on every terminal event, and
 * never leaks a browser event object to consumers.
 */

/** A fake `SpeechRecognition` that records config and drives events by hand. */
class FakeRecognition implements MinimalSpeechRecognition {
  lang = "";
  continuous = true;
  interimResults = true;
  maxAlternatives = 0;
  onresult: MinimalSpeechRecognition["onresult"] = null;
  onerror: MinimalSpeechRecognition["onerror"] = null;
  onend: MinimalSpeechRecognition["onend"] = null;
  started = 0;
  aborted = 0;

  constructor(private readonly options: { startThrows?: boolean } = {}) {}

  start(): void {
    this.started += 1;
    if (this.options.startThrows) throw new Error("start blew up");
  }

  abort(): void {
    this.aborted += 1;
  }

  emitResult(transcript: string): void {
    // Shape mirrors SpeechRecognitionEvent.results[0][0].transcript, exposing
    // both index and item() access so the adapter's extraction is pinned.
    const alternative = { transcript };
    const first = {
      length: 1,
      0: alternative,
      item: () => alternative,
    };
    const results = {
      length: 1,
      0: first,
      item: () => first,
    };
    this.onresult?.({ results } as never);
  }

  emitError(error: string): void {
    this.onerror?.({ error } as never);
  }

  emitEnd(): void {
    this.onend?.();
  }
}

function fakeFactory(options: { startThrows?: boolean } = {}): {
  factory: SpeechRecognitionFactory;
  instances: FakeRecognition[];
} {
  const instances: FakeRecognition[] = [];
  const factory: SpeechRecognitionFactory = () => {
    const instance = new FakeRecognition(options);
    instances.push(instance);
    return instance;
  };
  return { factory, instances };
}

describe("browser speech recognizer configuration", () => {
  it("reports supported when a factory is available", () => {
    expect(createBrowserSpeechRecognizer(fakeFactory().factory).supported).toBe(
      true,
    );
  });

  it("reports unsupported for an explicit null factory", () => {
    expect(createBrowserSpeechRecognizer(null).supported).toBe(false);
  });

  it("feature-detects no engine outside a browser as unsupported", () => {
    // In the node test environment there is no window.SpeechRecognition, so the
    // default production feature detection must resolve to unsupported.
    expect(createBrowserSpeechRecognizer().supported).toBe(false);
  });

  it("configures a single Japanese alternative before starting", () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    void recognizer.recognize({ lang: "ja-JP" });
    const instance = instances[0];
    expect(instance.lang).toBe("ja-JP");
    expect(instance.continuous).toBe(false);
    expect(instance.interimResults).toBe(false);
    expect(instance.maxAlternatives).toBe(1);
    expect(instance.started).toBe(1);
  });
});

describe("browser speech recognizer outcomes", () => {
  it("resolves a recognized transcript verbatim", async () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    const pending = recognizer.recognize({ lang: "ja-JP" });
    instances[0].emitResult("わたしはゆきです");
    await expect(pending).resolves.toEqual({
      kind: "transcript",
      transcript: "わたしはゆきです",
    });
  });

  it("resolves unsupported without a factory and never constructs an engine", async () => {
    const recognizer = createBrowserSpeechRecognizer(null);
    await expect(recognizer.recognize({ lang: "ja-JP" })).resolves.toEqual({ kind: "failure", failure: "unsupported" });
  });

  const errorMappings: ReadonlyArray<[string, RecognitionOutcome]> = [
    ["not-allowed", { kind: "failure", failure: "denied" }],
    ["service-not-allowed", { kind: "failure", failure: "denied" }],
    ["no-speech", { kind: "failure", failure: "no-speech" }],
    ["aborted", { kind: "failure", failure: "aborted" }],
    ["network", { kind: "failure", failure: "network-error" }],
    ["bad-grammar", { kind: "failure", failure: "service-error" }],
    ["language-not-supported", { kind: "failure", failure: "service-error" }],
  ];

  for (const [error, outcome] of errorMappings) {
    it(`maps the "${error}" error event to ${outcome.kind}/${
      outcome.kind === "failure" ? outcome.failure : ""
    }`, async () => {
      const { factory, instances } = fakeFactory();
      const recognizer = createBrowserSpeechRecognizer(factory, () => {});
      const pending = recognizer.recognize({ lang: "ja-JP" });
      instances[0].emitError(error);
      await expect(pending).resolves.toEqual(outcome);
    });
  }

  it("maps unknown errors to service-error, logs a diagnostic, and leaks no event", async () => {
    const diagnostic = vi.fn();
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory, diagnostic);
    const pending = recognizer.recognize({ lang: "ja-JP" });
    instances[0].emitError("bad-grammar");
    const outcome = await pending;
    expect(outcome).toEqual({
      kind: "failure",
      failure: "service-error",
    });
    // The consumer-visible outcome carries only the mapped failure — never the
    // raw vendor error string or event object.
    expect(Object.keys(outcome).sort()).toEqual(["failure", "kind"]);
    expect(diagnostic).toHaveBeenCalledTimes(1);
  });

  it("settles service-error when the recognition ends with no result or error", async () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    const pending = recognizer.recognize({ lang: "ja-JP" });
    instances[0].emitEnd();
    await expect(pending).resolves.toEqual({
      kind: "failure",
      failure: "service-error",
    });
  });
});

describe("browser speech recognizer single active request", () => {
  it("rejects a concurrent recognize as service-error without touching the pending one", async () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    const first = recognizer.recognize({ lang: "ja-JP" });
    const second = recognizer.recognize({ lang: "ja-JP" });

    await expect(second).resolves.toEqual({
      kind: "failure",
      failure: "service-error",
    });
    // The concurrent call must not construct a second engine or restart.
    expect(instances).toHaveLength(1);
    expect(instances[0].started).toBe(1);

    // The original request is intact and still settles its own transcript.
    instances[0].emitResult("はい");
    await expect(first).resolves.toEqual({
      kind: "transcript",
      transcript: "はい",
    });
  });

  it("clears the active request on settle so a later recognize starts fresh", async () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    const first = recognizer.recognize({ lang: "ja-JP" });
    instances[0].emitResult("いち");
    await first;

    const second = recognizer.recognize({ lang: "ja-JP" });
    expect(instances).toHaveLength(2);
    instances[1].emitResult("に");
    await expect(second).resolves.toEqual({
      kind: "transcript",
      transcript: "に",
    });
  });
});

describe("browser speech recognizer settle-once and cleanup", () => {
  it("detaches handlers after settling and ignores late events", async () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    const pending = recognizer.recognize({ lang: "ja-JP" });
    const instance = instances[0];
    instance.emitResult("ごはん");
    await expect(pending).resolves.toEqual({
      kind: "transcript",
      transcript: "ごはん",
    });

    expect(instance.onresult).toBeNull();
    expect(instance.onerror).toBeNull();
    expect(instance.onend).toBeNull();
    // Late events after settle must not throw or change the settled outcome.
    expect(() => {
      instance.emitError("network");
      instance.emitEnd();
    }).not.toThrow();
  });

  it("settles service-error and logs when the engine constructor throws", async () => {
    const diagnostic = vi.fn();
    const instances: FakeRecognition[] = [];
    let calls = 0;
    const factory: SpeechRecognitionFactory = () => {
      calls += 1;
      if (calls === 1) throw new Error("constructor blew up");
      const instance = new FakeRecognition();
      instances.push(instance);
      return instance;
    };
    const recognizer = createBrowserSpeechRecognizer(factory, diagnostic);
    await expect(recognizer.recognize({ lang: "ja-JP" })).resolves.toEqual({ kind: "failure", failure: "service-error" });
    expect(diagnostic).toHaveBeenCalledTimes(1);
    // The failed construction must not wedge the single-request slot: a fresh
    // recognize constructs a new engine.
    void recognizer.recognize({ lang: "ja-JP" });
    expect(instances).toHaveLength(1);
  });

  it("settles service-error, detaches, and logs when start() throws", async () => {
    const diagnostic = vi.fn();
    const { factory, instances } = fakeFactory({ startThrows: true });
    const recognizer = createBrowserSpeechRecognizer(factory, diagnostic);
    await expect(recognizer.recognize({ lang: "ja-JP" })).resolves.toEqual({ kind: "failure", failure: "service-error" });
    expect(diagnostic).toHaveBeenCalledTimes(1);
    const instance = instances[0];
    expect(instance.onresult).toBeNull();
    expect(instance.onerror).toBeNull();
    expect(instance.onend).toBeNull();
    // The slot is free: a fresh recognize constructs a new engine.
    void recognizer.recognize({ lang: "ja-JP" });
    expect(instances).toHaveLength(2);
  });
});

describe("browser speech recognizer abort", () => {
  it("aborts the active instance and settles aborted", async () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    const pending = recognizer.recognize({ lang: "ja-JP" });
    recognizer.abort();
    expect(instances[0].aborted).toBe(1);
    await expect(pending).resolves.toEqual({
      kind: "failure",
      failure: "aborted",
    });
  });

  it("is idempotent: a second abort after settle is a no-op", async () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    const pending = recognizer.recognize({ lang: "ja-JP" });
    recognizer.abort();
    await pending;
    expect(() => recognizer.abort()).not.toThrow();
    // No further engine abort after the request was already settled/cleared.
    expect(instances[0].aborted).toBe(1);
  });

  it("is a safe no-op when there is no active request", () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    expect(() => recognizer.abort()).not.toThrow();
    expect(instances).toHaveLength(0);
  });

  it("ignores a late abort-driven end event after settling", async () => {
    const { factory, instances } = fakeFactory();
    const recognizer = createBrowserSpeechRecognizer(factory);
    const pending = recognizer.recognize({ lang: "ja-JP" });
    recognizer.abort();
    await pending;
    // A real engine fires `end` after abort(); handlers are already detached.
    expect(() => instances[0].emitEnd()).not.toThrow();
  });
});

// Guard against accidental reliance on a global engine leaking into node tests.
let originalWindow: unknown;
beforeEach(() => {
  originalWindow = (globalThis as { window?: unknown }).window;
});
afterEach(() => {
  (globalThis as { window?: unknown }).window = originalWindow;
});
