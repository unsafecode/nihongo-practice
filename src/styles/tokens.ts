/**
 * Typed mirror of the CSS visual tokens declared in ./tokens.css.
 * This is the single typed source consumed by TS components (Icon,
 * action primitives, Notice, Header, SettingsDrawer) so they never
 * hard-code palette, spacing, type, or layout values independently
 * of the CSS custom properties. tokens.test.ts keeps both in sync.
 */

export type ColorToken =
  | "paper"
  | "surface"
  | "ink"
  | "muted"
  | "coral"
  | "teal"
  | "amber"
  | "board"
  | "danger";

export interface VisualTokens {
  colors: Readonly<Record<ColorToken, string>>;
  spacingPx: readonly [4, 8, 12, 16, 24, 32, 48, 64];
  typePx: readonly [14, 16, 20, 28, 42, 50, 54];
  layout: {
    shellMaxPx: 1320;
    readingMinPx: 760;
    readingMaxPx: 860;
    actionTargetMinPx: 44;
    mobileHeaderMaxPx: 112;
  };
}

export const visualTokens: VisualTokens = {
  colors: {
    paper: "#f8f0e4",
    surface: "#fffaf2",
    ink: "#24231f",
    muted: "#736d64",
    coral: "#e4572e",
    teal: "#2f6f6a",
    amber: "#ffb347",
    board: "#292c32",
    danger: "#c81e3a",
  },
  spacingPx: [4, 8, 12, 16, 24, 32, 48, 64],
  typePx: [14, 16, 20, 28, 42, 50, 54],
  layout: {
    shellMaxPx: 1320,
    readingMinPx: 760,
    readingMaxPx: 860,
    actionTargetMinPx: 44,
    mobileHeaderMaxPx: 112,
  },
};
