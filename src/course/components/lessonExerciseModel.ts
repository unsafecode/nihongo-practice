import type { Locale } from "../../i18n/LocaleContext";
import { assembledExamples } from "../catalog/assembleCourse";
import { assembledCurriculum } from "../catalog/curriculum";
import { curriculumExamples } from "../catalog/examples";
import { curriculumExercises, exerciseIdsByLesson } from "../catalog/exercises";
import type { ExerciseCatalogsInput } from "../exercises/types";
import { generateExercise } from "../exercises/engine";
import type {
  ExerciseGenerationError,
  ExercisePrompt,
} from "../exercises/types";

/**
 * The pure lesson-exercise model (Slice C plan Task 4 step 3, design spec
 * §10.1-§10.2). It resolves a lesson's authored exercise definitions into the
 * deterministic engine prompts the UI renders, and exposes the two derived
 * lookups a component needs without ever reconstructing a canonical answer:
 *
 *   - {@link segmentRomaji} — the romaji `assembleCourse` already derived for a
 *     tile/option's shared example segment, so a tile can show romaji under the
 *     romaji script setting from the same source as every other on-page romaji;
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

// ── Derived romaji (spec §7): a tile id is `${exampleId}#${segmentId}`. ────────
const romajiByTileId = new Map<string, string>();
for (const [exampleId, example] of Object.entries(assembledExamples)) {
  for (const segment of example.segments ?? []) {
    if (segment.id !== undefined) {
      romajiByTileId.set(`${exampleId}#${segment.id}`, segment.romaji);
    }
  }
}

/** The derived romaji for a tile/option id, or undefined when unresolved. */
export function segmentRomaji(tileId: string): string | undefined {
  return romajiByTileId.get(tileId);
}

/** The whole-sentence derived romaji for an example id (transformation source). */
export function exampleRomaji(exampleId: string): string | undefined {
  return assembledExamples[exampleId]?.romaji;
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
