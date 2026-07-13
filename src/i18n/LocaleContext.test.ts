import { describe, expect, it } from "vitest";
import {
  normalizeLocale,
  normalizeReference,
  persistLocaleState,
  readInitialLocaleState,
  referenceLocaleFor,
} from "./LocaleContext";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

function blockedStorage(): Storage {
  const blocked = (): never => {
    throw new Error("blocked");
  };
  return {
    get length() { return 0; },
    clear: blocked,
    getItem: blocked,
    key: blocked,
    removeItem: blocked,
    setItem: blocked,
  };
}

describe("locale settings", () => {
  it("defaults to Italian", () => {
    expect(normalizeLocale(null)).toBe("it");
    expect(normalizeLocale("fr")).toBe("it");
  });

  it("accepts English", () => {
    expect(normalizeLocale("en")).toBe("en");
  });

  it("normalizes the reference toggle", () => {
    expect(normalizeReference("true")).toBe(true);
    expect(normalizeReference("false")).toBe(false);
    expect(normalizeReference(null)).toBe(false);
  });
});

describe("locale persistence", () => {
  it("defaults to Italian without storage", () => {
    expect(readInitialLocaleState(null)).toEqual({
      locale: "it",
      showReference: false,
      persistenceAvailable: false,
    });
  });

  it("round-trips primary and reference settings through storage", () => {
    const storage = memoryStorage();

    expect(persistLocaleState(storage, "en", true)).toBe(true);
    // Pin the exact external keys + serialization (cross-version contract).
    expect(storage.getItem("nihongo.locale.primary")).toBe("en");
    expect(storage.getItem("nihongo.locale.reference")).toBe("true");

    expect(readInitialLocaleState(storage)).toEqual({
      locale: "en",
      showReference: true,
      persistenceAvailable: true,
    });
  });

  it("reports unavailable storage without throwing", () => {
    const storage = blockedStorage();

    expect(persistLocaleState(storage, "en", true)).toBe(false);
    expect(readInitialLocaleState(storage)).toEqual({
      locale: "it",
      showReference: false,
      persistenceAvailable: false,
    });
  });

  it("derives the reference locale from the primary locale", () => {
    expect(referenceLocaleFor("it")).toBe("en");
    expect(referenceLocaleFor("en")).toBe("it");
  });
});
