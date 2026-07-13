import { describe, expect, it } from "vitest";
import { readSetting, removeSetting, writeSetting } from "./storage";

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

describe("settings storage", () => {
  it("reads and writes a setting", () => {
    const storage = memoryStorage();
    expect(writeSetting(storage, "x", "it")).toBe(true);
    expect(readSetting(storage, "x")).toEqual({ value: "it", available: true });
    expect(removeSetting(storage, "x")).toBe(true);
    expect(readSetting(storage, "x")).toEqual({ value: null, available: true });
  });

  it("reports unavailable storage without throwing", () => {
    const broken = blockedStorage();
    expect(readSetting(broken, "x")).toEqual({ value: null, available: false });
    expect(writeSetting(broken, "x", "it")).toBe(false);
    expect(removeSetting(broken, "x")).toBe(false);
  });
});
