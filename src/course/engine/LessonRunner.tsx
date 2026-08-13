import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";
import { archetypeById } from "./archetypes";
import type { Archetype, LayoutMode, Lesson, Step } from "./types";
import type { Locale } from "./steps/stepView";
import { renderStep } from "./steps/registry";
import { browserStorage, readSetting, writeSetting } from "../../settings/storage";
import type { LayoutProps } from "./layouts/layout";
import { StageLayout } from "./layouts/StageLayout";
import { EditorialLayout } from "./layouts/EditorialLayout";
import "./engine.css";

export interface LessonRunnerProps {
  readonly lesson: Lesson;
  readonly locale: Locale;
  /** Zero-based step index to resume from. Clamped to the lesson's range. */
  readonly initialStepIndex?: number;
  readonly onStepChange?: (index: number) => void;
  readonly onLessonComplete?: () => void;
}

type LayoutComponent = (props: LayoutProps) => ReactElement;

/** Layouts are chosen by the archetype's own `layout` field — never by its id. */
const LAYOUTS: Partial<Record<LayoutMode, LayoutComponent>> = {
  stage: StageLayout,
  editorial: EditorialLayout,
};

/**
 * Assigns a step to an archetype phase using the same greedy walk
 * `validateLesson` uses, so a step's phase here always matches the structure
 * validation accepted. Out-of-range steps fall back to the final phase.
 */
export function phaseIndexForStep(
  archetype: Archetype,
  steps: readonly Step[],
  targetIndex: number,
): number {
  const lastPhase = archetype.phases.length - 1;
  if (lastPhase < 0) return 0;
  let index = 0;
  for (let phase = 0; phase < archetype.phases.length; phase += 1) {
    const spec = archetype.phases[phase]!;
    let taken = 0;
    while (
      index < steps.length &&
      taken < spec.max &&
      spec.kinds.includes(steps[index]!.kind)
    ) {
      if (index === targetIndex) return phase;
      index += 1;
      taken += 1;
    }
  }
  return lastPhase;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function clampIndex(value: number, lastIndex: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(lastIndex, Math.trunc(value)));
}

/**
 * Reads the resume position from engine-local storage, guarding every corrupt
 * shape — non-numeric, fractional, negative or out-of-range — back to step 0
 * so a bad value can never crash the lesson.
 */
function readStoredIndex(
  storage: Storage | null,
  key: string,
  lastIndex: number,
): number {
  const { value } = readSetting(storage, key);
  if (value === null || value.trim() === "") return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > lastIndex) return 0;
  return parsed;
}

export function LessonRunner(props: LessonRunnerProps): ReactElement {
  const { lesson, locale, initialStepIndex, onStepChange, onLessonComplete } = props;

  const archetype = useMemo(() => archetypeById(lesson.archetype), [lesson.archetype]);
  const lastIndex = lesson.steps.length - 1;
  // Phase 1 will fold the resume position into the course progress store; until
  // then it lives in engine-local storage so no A1/A2 progress schema migrates.
  const storage = useMemo(() => browserStorage(), []);
  const storageKey = `nihongo.engine.pilot.${lesson.id}.step`;

  const [index, setIndex] = useState(() =>
    initialStepIndex === undefined
      ? readStoredIndex(storage, storageKey, lastIndex)
      : clampIndex(initialStepIndex, lastIndex),
  );
  // Furthest step the learner has unlocked. Keyboard nav never crosses it, so
  // unseen content can never be skipped forward into.
  const [reached, setReached] = useState(index);
  const completedRef = useRef(false);

  const goTo = useCallback(
    (next: number): void => {
      const clamped = clampIndex(next, lastIndex);
      setReached((current) => Math.max(current, clamped));
      setIndex(clamped);
      writeSetting(storage, storageKey, String(clamped));
      onStepChange?.(clamped);
    },
    [lastIndex, storage, storageKey, onStepChange],
  );

  const handleComplete = useCallback((): void => {
    if (index < lastIndex) {
      goTo(index + 1);
      return;
    }
    if (!completedRef.current) {
      completedRef.current = true;
      onLessonComplete?.();
    }
  }, [index, lastIndex, goTo, onLessonComplete]);

  const goBack = useCallback((): void => {
    if (index > 0) goTo(index - 1);
  }, [index, goTo]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === "ArrowRight" && index < reached) {
        goTo(index + 1);
      } else if (event.key === "ArrowLeft" && index > 0) {
        goTo(index - 1);
      }
    },
    [index, reached, goTo],
  );

  const Layout = LAYOUTS[archetype.layout];
  if (Layout === undefined) {
    throw new Error(`No layout registered for mode: ${archetype.layout}`);
  }

  const current = lesson.steps[index]!;
  const animated = !prefersReducedMotion();
  const stepClass = animated
    ? "engine-runner__step engine-runner__step--animated"
    : "engine-runner__step";

  return (
    <div className="lesson-runner" onKeyDown={onKeyDown}>
      <Layout
        archetype={archetype}
        stepIndex={index}
        stepCount={lesson.steps.length}
        phaseIndex={phaseIndexForStep(archetype, lesson.steps, index)}
        onBack={goBack}
      >
        <div className={stepClass} key={index}>
          {renderStep(current, { locale, onComplete: handleComplete })}
        </div>
      </Layout>
    </div>
  );
}
