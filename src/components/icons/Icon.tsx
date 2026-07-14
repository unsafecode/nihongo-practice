import type { ReactElement, ReactNode } from "react";

export type SemanticIconId =
  | "sounds"
  | "sentence"
  | "ordering"
  | "time"
  | "places"
  | "people"
  | "questions"
  | "capstone";

export const semanticIconIds: readonly SemanticIconId[] = [
  "sounds",
  "sentence",
  "ordering",
  "time",
  "places",
  "people",
  "questions",
  "capstone",
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
 * set) for the eight approved semantic concepts. Every glyph is built from
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
