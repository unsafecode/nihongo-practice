import type { ReactNode } from "react";
import type { Archetype } from "../types";

export interface LayoutProps {
  readonly archetype: Archetype;
  /** Zero-based. */
  readonly stepIndex: number;
  readonly stepCount: number;
  /** Index of the archetype phase the current step belongs to. */
  readonly phaseIndex: number;
  readonly children: ReactNode;
  readonly onBack?: () => void;
}
