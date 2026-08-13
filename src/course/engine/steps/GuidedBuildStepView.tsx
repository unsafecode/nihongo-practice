import { useMemo, useRef, useState, type ReactElement } from "react";
import type { GuidedBuildStep } from "../types";
import { pick, type StepViewProps } from "./stepView";

interface Chip {
  readonly key: string;
  readonly text: string;
}

/** Stable 32-bit FNV-1a hash — deterministic ordering without Math.random(). */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Fragments and distractors shuffled into a single pool, ordered by a stable
 * hash of the step id and each chip. The order is a pure function of the step,
 * so every render — and every later Playwright snapshot — sees the same layout.
 */
function shuffledChips(step: GuidedBuildStep): readonly Chip[] {
  const chips: Chip[] = [
    ...step.fragments.map((text, index) => ({ key: `f${index}`, text })),
    ...step.distractors.map((text, index) => ({ key: `d${index}`, text })),
  ];
  return [...chips].sort((a, b) => {
    const rank = hashString(`${step.id}:${a.key}:${a.text}`) - hashString(`${step.id}:${b.key}:${b.text}`);
    return rank !== 0 ? rank : a.key < b.key ? -1 : 1;
  });
}

function matchesTarget(step: GuidedBuildStep, texts: readonly string[]): boolean {
  return (
    texts.length === step.fragments.length &&
    texts.every((text, index) => text === step.fragments[index])
  );
}

export function GuidedBuildStepView({
  step,
  locale,
  onComplete,
}: StepViewProps<GuidedBuildStep>): ReactElement {
  const chips = useMemo(() => shuffledChips(step), [step]);
  const chipByKey = useMemo(() => new Map(chips.map((chip) => [chip.key, chip])), [chips]);
  const [assembled, setAssembled] = useState<readonly string[]>([]);
  const completedRef = useRef(false);

  const textFor = (key: string): string => chipByKey.get(key)?.text ?? "";
  const assembledTexts = assembled.map(textFor);
  const available = chips.filter((chip) => !assembled.includes(chip.key));
  const complete = matchesTarget(step, assembledTexts);

  const select = (key: string): void => {
    if (completedRef.current) return;
    const next = [...assembled, key];
    setAssembled(next);
    if (matchesTarget(step, next.map(textFor))) {
      completedRef.current = true;
      onComplete();
    }
  };

  const reset = (): void => {
    if (!completedRef.current) setAssembled([]);
  };
  const undo = (): void => {
    if (!completedRef.current) setAssembled((current) => current.slice(0, -1));
  };

  return (
    <section className="engine-step engine-step--guidedbuild">
      <p className="engine-label">{locale === "it" ? "Costruisci" : "Build it"}</p>
      <p className="engine-goal">{pick(step.target.natural, locale)}</p>
      <div className="engine-tray" aria-label={locale === "it" ? "Frase" : "Sentence"}>
        {assembledTexts.map((text, index) => (
          <span key={assembled[index]} className="engine-tray__item" lang="ja">
            {text}
          </span>
        ))}
      </div>
      <div className="engine-chips">
        {available.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className="engine-chip"
            lang="ja"
            onClick={() => select(chip.key)}
          >
            {chip.text}
          </button>
        ))}
      </div>
      <div className="engine-controls">
        <button type="button" className="engine-reset" onClick={reset}>
          {locale === "it" ? "Ricomincia" : "Start over"}
        </button>
        <button type="button" className="engine-undo" onClick={undo}>
          {locale === "it" ? "Annulla" : "Undo"}
        </button>
      </div>
      {complete ? (
        <p className="engine-solution" lang="ja">
          {step.target.kana}
        </p>
      ) : null}
    </section>
  );
}
