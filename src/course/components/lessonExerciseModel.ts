import type { Locale } from "../../i18n/LocaleContext";
import type { AssembledToken } from "../../romaji/types";
import { assembledExamples } from "../catalog/assembleCourse";
import { assembledCurriculum } from "../catalog/curriculum";
import { curriculumExamples } from "../catalog/examples";
import { curriculumExercises, exerciseIdsByLesson } from "../catalog/exercises";
import { exampleSegmentToAssembledToken } from "../data/romajiTokens";
import type { ExerciseCatalogsInput } from "../exercises/types";
import { generateExercise } from "../exercises/engine";
import type {
  ExerciseGenerationError,
  ExercisePrompt,
} from "../exercises/types";

/**
 * The pure lesson-exercise model (Slice C plan Task 4 step 3, design spec
 * §10.1-§10.2; romaji boundaries plan Task 4 step 7). It resolves a lesson's
 * authored exercise definitions into the deterministic engine prompts the UI
 * renders, and exposes the derived lookups a component needs without ever
 * reconstructing a canonical answer:
 *
 *   - {@link segmentToken} — the real {@link AssembledToken} (jp/romaji/kind/
 *     boundary) `assembleCourse` already derived for a tile/option's shared
 *     example segment, so a tile renders through the shared semantic romaji
 *     renderer from the same source as every other on-page romaji, never a
 *     hard-coded fragment;
 *   - {@link exampleTokens} — the whole ordered token list for an example, for
 *     a transformation source or in-sentence context to render as one real
 *     runtime sequence;
 *   - {@link exerciseInstructionCopy} — the localized instruction/intent string
 *     for a prompt/intent copy id, resolved from the shared curriculum copy
 *     catalog that already carries `exercise.prompt.*` and
 *     `example.<id>.translation` keys with exact IT/EN parity.
 *
 * Generation is pure and deterministic, so every lesson's prompts are computed
 * once at module load. A structural catalog error surfaces as an entry in the
 * model's `errors` list (design spec §10.3, §16) rather than a silent empty
 * exercise; the release catalog resolves cleanly, and `lessonExerciseModel.test`
 * proves every published lesson generates 3-5 error-free prompts.
 */

export interface GeneratedExercise {
  readonly definitionId: string;
  /** The shared example the exercise targets, for deriving in-sentence romaji. */
  readonly targetExampleId: string;
  readonly prompt: ExercisePrompt;
}

export interface LessonExercisesModel {
  readonly lessonId: string;
  readonly exercises: readonly GeneratedExercise[];
  readonly errors: readonly ExerciseGenerationError[];
}

const catalogs: ExerciseCatalogsInput = {
  concepts: assembledCurriculum.concepts,
  lexemes: assembledCurriculum.lexemes,
  examples: curriculumExamples,
};

const definitionsById = new Map(
  curriculumExercises.map((entry) => [entry.id, entry]),
);

function buildModel(lessonId: string): LessonExercisesModel {
  const ids = exerciseIdsByLesson.get(lessonId) ?? [];
  const exercises: GeneratedExercise[] = [];
  const errors: ExerciseGenerationError[] = [];
  for (const id of ids) {
    const entry = definitionsById.get(id);
    if (!entry?.definition) {
      errors.push({ code: "absent-target", definitionId: id });
      continue;
    }
    const result = generateExercise(entry.definition, catalogs);
    if (result.ok) {
      exercises.push({
        definitionId: id,
        targetExampleId: entry.targetExampleId,
        prompt: result.prompt,
      });
    } else {
      errors.push(result.error);
    }
  }
  return { lessonId, exercises, errors };
}

const modelsByLesson = new Map<string, LessonExercisesModel>(
  [...exerciseIdsByLesson.keys()].map((lessonId) => [
    lessonId,
    buildModel(lessonId),
  ]),
);

/** The deterministic exercise model for a lesson, or undefined when unknown. */
export function getLessonExercises(
  lessonId: string,
): LessonExercisesModel | undefined {
  return modelsByLesson.get(lessonId);
}

// ── Derived tokens (romaji boundaries plan Task 4 step 7): a tile id is
// `${exampleId}#${segmentId}`. Each is the real `AssembledToken` — same shape
// every other learner-facing romaji surface renders through `RomajiSequence`
// — never a plain fragment string a component would have to re-join itself. ─
const tokenByTileId = new Map<string, AssembledToken>();
const tokensByExampleId = new Map<string, readonly AssembledToken[]>();
for (const [exampleId, example] of Object.entries(assembledExamples)) {
  const segments = example.segments ?? [];
  const tokens: (AssembledToken | null)[] = segments.map((segment) =>
    exampleSegmentToAssembledToken(segment),
  );
  for (const [index, segment] of segments.entries()) {
    const token = tokens[index];
    if (token && segment.id !== undefined) {
      tokenByTileId.set(`${exampleId}#${segment.id}`, token);
    }
  }
  // Only expose the whole-example sequence when every segment resolved to a
  // real token — a partial list would silently drop an unresolved segment
  // rather than surfacing the caller's localized formatting error.
  if (
    segments.length > 0 &&
    tokens.every((token): token is AssembledToken => token !== null)
  ) {
    tokensByExampleId.set(exampleId, tokens);
  }
}

/** The derived real assembled token for a tile/option id, or undefined when unresolved. */
export function segmentToken(tileId: string): AssembledToken | undefined {
  return tokenByTileId.get(tileId);
}

/** The whole-sentence ordered token list for an example id (transformation source, in-sentence context), or undefined when unresolved. */
export function exampleTokens(
  exampleId: string,
): readonly AssembledToken[] | undefined {
  return tokensByExampleId.get(exampleId);
}

// ── Localized instruction/intent copy resolution (exact IT/EN parity). ────────
/**
 * Resolve a locale-independent copy id — a `promptCopyId` such as
 * `exercise.prompt.order`, or a constrained-construction `intentCopyId` such as
 * `example.<id>.translation` — into its localized string, from the shared
 * curriculum copy catalog. Returns undefined for an unknown id so the caller can
 * surface a missing-copy error (design spec §16) rather than render blank.
 */
export function exerciseInstructionCopy(
  locale: Locale,
  copyId: string,
): string | undefined {
  return assembledCurriculum.copy[locale][copyId];
}
