import type { ReactElement, ReactNode } from "react";

export type SemanticIconId =
  | "sounds"
  | "sentence"
  | "ordering"
  | "time"
  | "places"
  | "people"
  | "questions"
  | "capstone"
  | "identity"
  | "descriptions"
  | "shopping"
  | "existence";

export const semanticIconIds: readonly SemanticIconId[] = [
  "sounds",
  "sentence",
  "ordering",
  "time",
  "places",
  "people",
  "questions",
  "capstone",
  "identity",
  "descriptions",
  "shopping",
  "existence",
];

export type IconSize = "small" | "medium" | "large";

export type IconProps = {
  id: SemanticIconId;
  size?: IconSize;
} & (
  | { decorative: true; label?: never }
  | { decorative?: false; label: string }
);

const sizePx: Readonly<Record<IconSize, number>> = {
  small: 16,
  medium: 24,
  large: 32,
};

/**
 * Original, hand-authored line glyphs (not sourced from any external icon
 * set) for the twelve approved semantic concepts. Every glyph is built from
 * plain SVG primitives sharing the same 24x24 viewBox and 1.8 stroke width.
 */
const iconBodies: Readonly<Record<SemanticIconId, ReactNode>> = {
  sounds: (
    <>
      <path d="M4 10v4h3.2L12 17.5v-11L7.2 10Z" />
      <path d="M16 9.2a4 4 0 0 1 0 5.6" />
      <path d="M18.4 6.8a7.6 7.6 0 0 1 0 10.4" />
    </>
  ),
  sentence: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="16" y2="12" />
      <line x1="4" y1="17" x2="12" y2="17" />
    </>
  ),
  ordering: (
    <>
      <circle cx="6" cy="7" r="1.6" />
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="6" cy="17" r="1.6" />
      <line x1="10" y1="7" x2="20" y2="7" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="10" y1="17" x2="20" y2="17" />
    </>
  ),
  time: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3.2 2" />
    </>
  ),
  places: (
    <>
      <path d="M12 21s6.5-6.1 6.5-11A6.5 6.5 0 0 0 5.5 10c0 4.9 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="2.6" />
      <path d="M4 19c0-2.9 2.2-5 5-5s5 2.1 5 5" />
      <circle cx="17.5" cy="9" r="2.1" />
      <path d="M15.3 14.4c2.3.3 3.9 2.2 3.9 4.6" />
    </>
  ),
  questions: (
    <>
      <path d="M5 5.5h14v10H10l-3.6 3v-3H5Z" />
      <path d="M9.7 9.7a2.3 2.3 0 1 1 3.4 2c-.8.5-1.1 1-1.1 1.9" />
      <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  capstone: (
    <>
      <path d="M12 3.5 20 8l-8 4.5L4 8Z" />
      <path d="M6 10.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.8" />
    </>
  ),
  identity: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="11" r="2.1" />
      <path d="M5.6 16.4c.5-1.6 1.9-2.4 3.4-2.4s2.9.8 3.4 2.4" />
      <line x1="14" y1="9.5" x2="17.5" y2="9.5" />
      <line x1="14" y1="13" x2="17.5" y2="13" />
    </>
  ),
  descriptions: (
    <>
      <path d="M2.6 12S6 6.2 12 6.2 21.4 12 21.4 12 18 17.8 12 17.8 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
  shopping: (
    <>
      <path d="M6.2 8h11.6l-1 10.6a1.4 1.4 0 0 1-1.4 1.3H8.6a1.4 1.4 0 0 1-1.4-1.3Z" />
      <path d="M9 8V6.6a3 3 0 0 1 6 0V8" />
    </>
  ),
  existence: (
    <>
      <rect x="5" y="7.2" width="14" height="11.6" rx="1.2" />
      <line x1="5" y1="11" x2="19" y2="11" />
      <line x1="10" y1="7.2" x2="10" y2="11" />
      <line x1="14" y1="7.2" x2="14" y2="11" />
    </>
  ),
};

export function Icon(props: IconProps): ReactElement {
  const { id, size = "medium" } = props;
  const dimension = sizePx[size];
  const body = iconBodies[id];

  if (props.decorative) {
    return (
      <svg
        className={`icon icon--${size}`}
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {body}
      </svg>
    );
  }

  const label = props.label;
  if (typeof label !== "string" || label.trim().length === 0) {
    throw new Error(
      "Icon requires a non-empty label for a standalone/actionable (non-decorative) icon.",
    );
  }

  return (
    <svg
      className={`icon icon--${size}`}
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      focusable="false"
    >
      {body}
    </svg>
  );
}
