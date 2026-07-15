import type { StaticExample } from "./types";
import { assembledExamples } from "../catalog/assembleCourse";

/**
 * Runtime static examples for the published A0→A1 course.
 *
 * This module no longer authors any Japanese: every example is projected from
 * the shared catalog (`src/course/catalog/examples.ts`) by the pure
 * `assembleCourse` adapter, which derives each segment's romaji from the shared
 * kana reading (spec §7) and keeps the standard katakana spelling with its
 * hiragana reading for assisted loanword exposure (spec §8.3). Consumers keep
 * importing `examples` unchanged; the Japanese source of truth now lives once
 * in the catalog rather than being duplicated here.
 */
export const examples: Record<string, StaticExample> = assembledExamples;
