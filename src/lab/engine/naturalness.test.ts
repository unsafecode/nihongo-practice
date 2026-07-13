import { describe, expect, it } from "vitest";
import { classifyNaturalness } from "./naturalness";

describe("classifyNaturalness", () => {
  it.each([
    ["pres", "today", "natural"],
    ["pres", "yesterday", "incompatible"],
    ["pres", "tomorrow", "natural"],
    ["pres", "tonight", "natural"],
    ["pres", "everyDay", "natural"],
    ["pres", "none", "natural"],
    ["past", "today", "natural"],
    ["past", "yesterday", "natural"],
    ["past", "tomorrow", "incompatible"],
    ["past", "tonight", "contextual"],
    ["past", "everyDay", "contextual"],
    ["past", "none", "natural"],
    ["neg", "today", "natural"],
    ["neg", "yesterday", "incompatible"],
    ["neg", "tomorrow", "natural"],
    ["neg", "tonight", "natural"],
    ["neg", "everyDay", "natural"],
    ["neg", "none", "natural"],
    ["pastneg", "today", "natural"],
    ["pastneg", "yesterday", "natural"],
    ["pastneg", "tomorrow", "incompatible"],
    ["pastneg", "tonight", "contextual"],
    ["pastneg", "everyDay", "contextual"],
    ["pastneg", "none", "natural"],
    ["vol", "today", "natural"],
    ["vol", "yesterday", "incompatible"],
    ["vol", "tomorrow", "natural"],
    ["vol", "tonight", "natural"],
    ["vol", "everyDay", "natural"],
    ["vol", "none", "natural"],
    ["des", "today", "natural"],
    ["des", "yesterday", "incompatible"],
    ["des", "tomorrow", "natural"],
    ["des", "tonight", "natural"],
    ["des", "everyDay", "natural"],
    ["des", "none", "natural"],
  ] as const)("%s + %s -> %s", (form, timeId, expected) => {
    expect(classifyNaturalness(form, timeId)).toBe(expected);
  });
});
