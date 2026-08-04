import type { FoundationCatalogs, RealizedSentence, SentenceFamily, SentenceVariant } from "../../foundations/types";
import { buildLessonViewModel } from "../../foundations/buildLessonViewModel";
import { realizeVariant } from "../../foundations/realizeFamily";
import { variantTranslationCopyId } from "../../foundations/buildLessonViewModel";
import {
  A1_CAPSTONE_LESSON_IDS,
  A1_LESSON_IDS,
  A1_LESSON_MANIFEST,
} from "../manifest";
import {
  type A1LessonRecipe,
  type A1CurriculumValidationError,
  type A1CurriculumValidationStage,
} from "../types";
import {
  a1FoundationCatalogs,
  a1FoundationCopy,
  a1SemanticBuiltLessons,
} from "../catalog/catalog";
import { module1ItemsByLesson, type A1PhoneticItem } from "../catalog/module01Sounds";
import {
  A1_RELEASE_CATALOG_VERSION,
  A1_RELEASE_SEED,
} from "../releaseIdentity";
import { a1LearningNoteById, type A1LearningNote } from "./grammar";
import { a1LessonContents } from "./catalog";
import { a1LexemeById } from "./lexicon";
import {
  A1_SEMANTIC_SECTION_ORDER,
  type A1LessonContent,
  type A1Lexeme,
  type A1PracticeActivity,
  type A1PracticeFunction,
} from "./types";
import { resolveLexeme } from "./resolveLexeme";
import {
  buildA1CurriculumReports,
  type A1CurriculumReports,
  type A1LessonCurriculumReport,
} from "./reports";

export { A1_CURRICULUM_ERROR_CODES } from "../types";
export type {
  A1CurriculumErrorCode,
  A1CurriculumValidationError,
  A1CurriculumValidationStage,
} from "../types";

/**
 * Complete immutable input used by the curriculum validator. Tests replace a
 * whole top-level catalog at a time; nested production records are never
 * partially merged or mutated by the validator.
 */
export interface A1CurriculumValidationInput {
  readonly lessonContents: readonly A1LessonContent[];
  readonly lexemes: readonly A1Lexeme[];
  readonly learningNotes: readonly A1LearningNote[];
  readonly foundationCatalogs: FoundationCatalogs;
  /** Authored lesson recipes preserve current-lesson concept introductions. */
  readonly lessonRecipes: readonly A1LessonRecipe[];
  readonly foundationCopy: {
    readonly en: Readonly<Record<string, string>>;
    readonly it: Readonly<Record<string, string>>;
  };
  readonly phoneticItemsByLesson: Readonly<Record<string, readonly A1PhoneticItem[]>>;
  readonly semanticSectionOrder: readonly string[];
}

/** Deliberately shallow override surface; each supplied value replaces one whole catalog. */
export type A1CurriculumValidationOverrides = Partial<A1CurriculumValidationInput>;

export interface A1ReviewRetrievalTarget {
  readonly id?: string;
  readonly function: A1PracticeFunction;
  readonly visibleTargetKey: string;
  /** Actual assessed concept and lexeme IDs, never learner-facing answer text. */
  readonly assessedIds: readonly string[];
}

export interface ValidateA1CurriculumResult {
  readonly valid: boolean;
  readonly errors: readonly A1CurriculumValidationError[];
  readonly reports: A1CurriculumReports;
}

const REQUIRED_PRACTICE_FUNCTIONS = [
  "meaning-comprehension",
  "form-discrimination",
  "controlled-production",
  "listening-speaking",
] as const;

type GeneratedInteractionKind = Exclude<A1PracticeActivity["interactionKind"], "spoken">;

interface ResolvedActivityTarget {
  readonly activity: A1PracticeActivity;
  readonly generated: boolean;
  readonly visibleTargetKey: string;
  readonly assessedIds: readonly string[];
  readonly expectedInteractionKind: A1PracticeActivity["interactionKind"];
  readonly variantId?: string;
  readonly itemId?: string;
}

interface MutableLessonReport {
  lessonId: string;
  newLexemeCount: number;
  introducedLexemeIds: string[];
  usedLexemeIds: string[];
  learningNoteId: string;
  prerequisiteConceptIds: string[];
  practiceFunctions: A1PracticeFunction[];
  interactionKinds: A1PracticeActivity["interactionKind"][];
  visibleTargetKeys: string[];
}

interface VariantResolution {
  readonly sentence?: RealizedSentence;
  readonly lexemeIds: readonly string[];
  readonly unresolvedTokenReferenceIds: readonly string[];
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formKey(form: SentenceVariant["form"]): string {
  return `${form.polarity}:${form.tense}:${form.formality}`;
}

function isNonstandardVerbForm(form: SentenceVariant["form"]): boolean {
  return form.polarity === "negative" || form.tense === "past";
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isSpokenTarget(
  targetRef: A1PracticeActivity["targetRef"],
): targetRef is Readonly<{ spokenVariantId: string }> {
  return "spokenVariantId" in targetRef;
}

function isPhoneticLesson(lessonId: string): boolean {
  return A1_LESSON_MANIFEST[lessonId]?.contract === "phonetic";
}

function formExplanations(note: A1LearningNote): readonly string[] {
  const candidate = note as A1LearningNote & {
    readonly explainedVerbForms?: readonly Pick<
      SentenceVariant["form"],
      "polarity" | "tense" | "formality"
    >[];
  };
  return (candidate.explainedVerbForms ?? []).map(formKey);
}

function addBilingualErrors(
  push: (error: A1CurriculumValidationError) => void,
  value: unknown,
  stage: A1CurriculumValidationStage,
  id: string,
  referenceId: string,
  lessonId?: string,
): void {
  const bilingual = value as { readonly en?: unknown; readonly it?: unknown } | null;
  for (const locale of ["en", "it"] as const) {
    if (!isNonEmpty(bilingual?.[locale])) {
      push({
        code: "missing-locale-copy",
        stage,
        lessonId,
        id,
        referenceId,
        dimension: locale,
        expected: "non-empty",
        actual: typeof bilingual?.[locale] === "string" ? bilingual[locale] : "missing",
      });
    }
  }
}

/**
 * Produces the complete default input before applying whole-catalog overrides.
 * It never deep-merges a caller's nested fixture, which keeps broken fixture
 * attribution honest and makes all production defaults explicit.
 */
export function createA1CurriculumValidationInput(
  overrides: A1CurriculumValidationOverrides = {},
): A1CurriculumValidationInput {
  return {
    lessonContents: overrides.lessonContents ?? a1LessonContents,
    lexemes: overrides.lexemes ?? Object.values(a1LexemeById).filter(
      (lexeme): lexeme is A1Lexeme => lexeme !== undefined,
    ),
    learningNotes: overrides.learningNotes ?? Object.values(a1LearningNoteById).filter(
      (note): note is A1LearningNote => note !== undefined,
    ),
    foundationCatalogs: overrides.foundationCatalogs ?? a1FoundationCatalogs,
    lessonRecipes:
      overrides.lessonRecipes ?? a1SemanticBuiltLessons.map((built) => built.recipe),
    foundationCopy: overrides.foundationCopy ?? a1FoundationCopy,
    phoneticItemsByLesson: overrides.phoneticItemsByLesson ?? module1ItemsByLesson,
    semanticSectionOrder: overrides.semanticSectionOrder ?? A1_SEMANTIC_SECTION_ORDER,
  };
}

/**
 * Checks whether a candidate is safe to use as a retrieval alternate for a
 * source. Task 10's resolver calls this exact helper rather than re-encoding
 * the compatibility rule.
 */
export function validateReviewRetrievalPair(
  source: A1ReviewRetrievalTarget,
  candidate: A1ReviewRetrievalTarget,
): A1CurriculumValidationError | undefined {
  let dimension: string | undefined;
  if (source.function === candidate.function) {
    dimension = "same-function";
  } else if (source.visibleTargetKey === candidate.visibleTargetKey) {
    dimension = "same-visible-target";
  } else {
    const sourceIds = new Set(source.assessedIds);
    if (!candidate.assessedIds.some((id) => sourceIds.has(id))) {
      dimension = "no-assessed-overlap";
    }
  }
  if (dimension === undefined) return undefined;
  return {
    code: "review-retrieval-clone",
    stage: "review",
    id: candidate.id,
    referenceId: source.id,
    dimension,
  };
}

/**
 * Exhaustive, non-throwing learner-contract validation over the frozen A1
 * catalogs (or complete replacement fixtures). Structural catalog import
 * failures remain module-initialization failures; content violations collect
 * every attributed error below.
 */
export function validateA1Curriculum(
  overrides: A1CurriculumValidationOverrides = {},
): ValidateA1CurriculumResult {
  const input = createA1CurriculumValidationInput(overrides);
  const errors: A1CurriculumValidationError[] = [];
  const push = (error: A1CurriculumValidationError): void => {
    errors.push(error);
  };

  const reportByLesson = new Map<string, MutableLessonReport>(
    A1_LESSON_IDS.map((lessonId) => [
      lessonId,
      {
        lessonId,
        newLexemeCount: 0,
        introducedLexemeIds: [],
        usedLexemeIds: [],
        learningNoteId: "",
        prerequisiteConceptIds: [],
        practiceFunctions: [],
        interactionKinds: [],
        visibleTargetKeys: [],
      },
    ]),
  );

  // ---- 1. Catalog, references, locale parity, and semantic-section order ---
  const contentByLesson = new Map<string, A1LessonContent>();
  const seenContentIds = new Set<string>();
  const contentIds = input.lessonContents.map((content) => content.lessonId);
  for (const content of input.lessonContents) {
    if (seenContentIds.has(content.lessonId)) {
      push({
        code: "missing-instructional-content",
        stage: "catalog",
        lessonId: content.lessonId,
        id: content.lessonId,
        dimension: "duplicate-lesson-content",
      });
      continue;
    }
    seenContentIds.add(content.lessonId);
    contentByLesson.set(content.lessonId, content);
    if (!A1_LESSON_IDS.includes(content.lessonId)) {
      push({
        code: "missing-instructional-content",
        stage: "catalog",
        lessonId: content.lessonId,
        id: content.lessonId,
        dimension: "extra-lesson-content",
      });
    }
  }
  for (const lessonId of A1_LESSON_IDS) {
    if (!contentByLesson.has(lessonId)) {
      push({
        code: "missing-instructional-content",
        stage: "catalog",
        lessonId,
        id: lessonId,
        dimension: "missing-lesson-content",
      });
    }
  }
  if (
    contentIds.length !== A1_LESSON_IDS.length ||
    contentIds.some((lessonId, index) => lessonId !== A1_LESSON_IDS[index])
  ) {
    push({
      code: "missing-instructional-content",
      stage: "catalog",
      dimension: "canonical-order",
      expected: A1_LESSON_IDS.join(","),
      actual: contentIds.join(","),
    });
  }
  if (
    input.semanticSectionOrder.length !== A1_SEMANTIC_SECTION_ORDER.length ||
    input.semanticSectionOrder.some(
      (section, index) => section !== A1_SEMANTIC_SECTION_ORDER[index],
    )
  ) {
    push({
      code: "invalid-section-order",
      stage: "sections",
      expected: A1_SEMANTIC_SECTION_ORDER.join(","),
      actual: input.semanticSectionOrder.join(","),
    });
  }

  const lexemeById = new Map<string, A1Lexeme>();
  const lexemeByValueId: Record<string, A1Lexeme | undefined> = {};
  for (const lexeme of input.lexemes) {
    lexemeById.set(lexeme.id, lexeme);
    for (const valueId of lexeme.valueIds) {
      if (lexemeByValueId[valueId] === undefined) lexemeByValueId[valueId] = lexeme;
    }
    addBilingualErrors(push, lexeme.meaning, "locale", lexeme.id, "meaning");
  }
  const noteById = new Map(input.learningNotes.map((note) => [note.id, note]));
  for (const note of input.learningNotes) {
    addBilingualErrors(push, note.title, "locale", note.id, "title");
    addBilingualErrors(push, note.meaning, "locale", note.id, "meaning");
    addBilingualErrors(push, note.use, "locale", note.id, "use");
    addBilingualErrors(push, note.construction, "locale", note.id, "construction");
    addBilingualErrors(push, note.typicalMistake, "locale", note.id, "typical-mistake");
    if (note.subjectOmissionNote !== undefined) {
      addBilingualErrors(push, note.subjectOmissionNote, "locale", note.id, "subject-omission");
    }
    for (const [index, token] of note.pattern.entries()) {
      addBilingualErrors(push, token.label, "locale", note.id, `pattern:${index}`);
    }
  }

  // ---- Realization maps shared by lexical, example, and practice checks -----
  const familyById = new Map(
    input.foundationCatalogs.sentenceFamilies.map((family) => [family.id, family]),
  );
  const variantById = new Map(
    input.foundationCatalogs.sentenceVariants.map((variant) => [variant.id, variant]),
  );
  const semanticLessonById = new Map(
    input.foundationCatalogs.lessons.map((lesson) => [lesson.id, lesson]),
  );
  const lessonRecipeById = new Map(
    input.lessonRecipes.map((recipe) => [recipe.id, recipe]),
  );
  const allConceptIds = input.foundationCatalogs.sentenceFamilies.flatMap(
    (family) => family.requiredConceptIds,
  );
  const realizationCatalogs = {
    contexts: input.foundationCatalogs.contexts,
    personRoles: input.foundationCatalogs.personRoles,
    referents: input.foundationCatalogs.referents,
    semanticValues: input.foundationCatalogs.semanticValues,
    learningTargetSenses: input.foundationCatalogs.learningTargetSenses,
  };
  const realizedByVariantId = new Map<string, VariantResolution>();
  const resolveVariant = (variantId: string): VariantResolution => {
    const cached = realizedByVariantId.get(variantId);
    if (cached !== undefined) return cached;
    const variant = variantById.get(variantId);
    const family = variant ? familyById.get(variant.sentenceFamilyId) : undefined;
    if (!variant || !family) {
      const unresolved = { lexemeIds: [], unresolvedTokenReferenceIds: [variantId] };
      realizedByVariantId.set(variantId, unresolved);
      return unresolved;
    }
    const realization = realizeVariant(family, variant, realizationCatalogs, {
      availableConceptIds: allConceptIds,
    });
    if (!realization.ok) {
      const unresolved = {
        lexemeIds: [],
        unresolvedTokenReferenceIds: realization.errors.map(
          (error) => error.referenceId ?? error.variantId,
        ),
      };
      realizedByVariantId.set(variantId, unresolved);
      return unresolved;
    }

    const lexemeIds = new Set<string>();
    const unresolvedTokenReferenceIds: string[] = [];
    for (const token of realization.sentence.tokens) {
      if (token.kind !== "lexical") continue;
      const resolved = resolveLexeme({
        token,
        variant,
        family,
        semanticValues: input.foundationCatalogs.semanticValues,
        lexemeByValueId,
      });
      if (resolved.ok) {
        lexemeIds.add(resolved.lexeme.id);
      } else {
        unresolvedTokenReferenceIds.push(resolved.referenceId);
      }
    }
    // Include semantic values selected by a model even when their subject is
    // naturally omitted from the surface. The reference stays semantic; no
    // translation string is used to infer lexical ownership.
    for (const valueId of Object.values(variant.slotValues)) {
      const lexeme = lexemeByValueId[valueId];
      if (lexeme) lexemeIds.add(lexeme.id);
    }
    const resolved = {
      sentence: realization.sentence,
      lexemeIds: [...lexemeIds].sort(compare),
      unresolvedTokenReferenceIds,
    };
    realizedByVariantId.set(variantId, resolved);
    return resolved;
  };

  const firstIntroductionIndex = new Map<string, number>();
  for (const [index, lessonId] of A1_LESSON_IDS.entries()) {
    const content = contentByLesson.get(lessonId);
    if (!content) continue;
    for (const lexemeId of content.newLexemeIds) {
      const previous = firstIntroductionIndex.get(lexemeId);
      if (previous !== undefined) {
        push({
          code: "duplicate-lexeme-introduction",
          stage: "lexical",
          lessonId,
          id: lexemeId,
          referenceId: A1_LESSON_IDS[previous],
        });
      } else {
        firstIntroductionIndex.set(lexemeId, index);
      }
    }
  }

  const availableLexemeIds = new Set<string>();
  const introducedGrammarConceptIds = new Set<string>();
  const explainedGrammarConceptIds = new Set<string>();
  const explainedVerbFormKeys = new Set<string>();
  const reportedConceptUses = new Set<string>();
  const reportedVerbFormUses = new Set<string>();

  for (const [index, lessonId] of A1_LESSON_IDS.entries()) {
    const content = contentByLesson.get(lessonId);
    if (!content) continue;
    const report = reportByLesson.get(lessonId)!;
    report.newLexemeCount = content.newLexemeIds.length;
    report.introducedLexemeIds = [...content.newLexemeIds];
    report.learningNoteId = content.learningNoteId;
    report.prerequisiteConceptIds = [...content.prerequisiteConceptIds];
    report.practiceFunctions = content.practiceBlueprint.activities.map((activity) => activity.function);
    report.interactionKinds = content.practiceBlueprint.activities.map(
      (activity) => activity.interactionKind,
    );

    addBilingualErrors(push, content.situation, "locale", lessonId, "situation", lessonId);
    addBilingualErrors(push, content.retrievalCue, "locale", lessonId, "retrieval-cue", lessonId);
    if (content.vocabularyException !== undefined) {
      addBilingualErrors(
        push,
        content.vocabularyException.reason,
        "locale",
        lessonId,
        "vocabulary-exception",
        lessonId,
      );
    }

    const capstone = A1_CAPSTONE_LESSON_IDS.includes(lessonId);
    if (capstone) {
      if (content.newLexemeIds.length !== 0) {
        push({
          code: "invalid-new-word-count",
          stage: "lexical",
          lessonId,
          expected: 0,
          actual: content.newLexemeIds.length,
        });
      }
      if (content.vocabularyException?.kind !== "synthesis") {
        push({
          code: "invalid-vocabulary-exception",
          stage: "lexical",
          lessonId,
          expected: "synthesis exception",
          actual: content.vocabularyException?.kind ?? "missing",
        });
      }
    } else {
      if (content.newLexemeIds.length < 4 || content.newLexemeIds.length > 6) {
        push({
          code: "invalid-new-word-count",
          stage: "lexical",
          lessonId,
          expected: "4-6",
          actual: content.newLexemeIds.length,
        });
      }
      if (content.vocabularyException !== undefined) {
        push({
          code: "invalid-vocabulary-exception",
          stage: "lexical",
          lessonId,
          expected: "absent",
          actual: content.vocabularyException.kind,
        });
      }
    }

    for (const lexemeId of content.newLexemeIds) {
      if (!lexemeById.has(lexemeId)) {
        push({
          code: "missing-instructional-content",
          stage: "catalog",
          lessonId,
          id: lexemeId,
          dimension: "unknown-new-lexeme",
        });
      }
      availableLexemeIds.add(lexemeId);
    }

    // ---- Grammar prerequisite and explanation sequence ----------------------
    const note = noteById.get(content.learningNoteId);
    if (!note) {
      push({
        code: "grammar-explanation-missing",
        stage: "grammar",
        lessonId,
        id: content.learningNoteId,
        dimension: "learning-note",
      });
    } else {
      const currentIntroductions = new Set<string>(content.prerequisiteConceptIds);
      // The recipe's introduced concepts are the authored instructional
      // sequence, distinct from a note's learner-facing explanation.
      for (const conceptId of lessonRecipeById.get(lessonId)?.introducedConceptIds ?? []) {
        currentIntroductions.add(conceptId);
      }
      for (const conceptId of note.requiredConceptIds) {
        if (
          !introducedGrammarConceptIds.has(conceptId) &&
          !explainedGrammarConceptIds.has(conceptId) &&
          !currentIntroductions.has(conceptId) &&
          !note.explainedConceptIds.includes(conceptId)
        ) {
          push({
            code: "grammar-prerequisite-order",
            stage: "grammar",
            lessonId,
            id: note.id,
            referenceId: conceptId,
          });
        }
      }
      for (const conceptId of note.explainedConceptIds) {
        explainedGrammarConceptIds.add(conceptId);
      }
      for (const explainedForm of formExplanations(note)) {
        explainedVerbFormKeys.add(explainedForm);
      }
      for (const conceptId of currentIntroductions) {
        introducedGrammarConceptIds.add(conceptId);
      }
    }

    const semanticLesson = semanticLessonById.get(lessonId);
    const modelVariantIds = semanticLesson?.modelVariantIds ?? [];
    if (!isPhoneticLesson(lessonId) && !semanticLesson) {
      push({
        code: "missing-instructional-content",
        stage: "catalog",
        lessonId,
        id: lessonId,
        dimension: "missing-semantic-lesson",
      });
    }

    const activityTargets = resolvePracticeTargets(
      content,
      lessonId,
      semanticLesson,
      input,
      resolveVariant,
      push,
    );
    report.visibleTargetKeys = activityTargets.map((target) => target.visibleTargetKey);
    validatePracticeBlueprint(content, lessonId, activityTargets, push);

    const usedLexemeIds = new Set<string>();
    const introducedLexemeIdsInModels = new Set<string>();
    const inspectVariant = (
      variantId: string,
      source: "model" | "example" | "dialogue" | "practice" | "spoken",
    ): void => {
      const resolution = resolveVariant(variantId);
      if (!resolution.sentence) {
        if (source === "example" || source === "dialogue") {
          push({
            code: "worked-example-unresolvable",
            stage: "realization",
            lessonId,
            id: variantId,
            dimension: source,
          });
        } else {
          push({
            code: "missing-instructional-content",
            stage: "realization",
            lessonId,
            id: variantId,
            dimension: `${source}-variant`,
          });
        }
        return;
      }
      if (source === "example" || source === "dialogue") {
        addVariantLocaleErrors(push, input.foundationCopy, lessonId, variantId);
      }
      for (const referenceId of resolution.unresolvedTokenReferenceIds) {
        push({
          code: "unglossed-lexeme-use",
          stage: "lexical",
          lessonId,
          id: variantId,
          referenceId,
          dimension: source,
        });
      }
      for (const lexemeId of resolution.lexemeIds) {
        usedLexemeIds.add(lexemeId);
        if (source === "model") introducedLexemeIdsInModels.add(lexemeId);
        const lexeme = lexemeById.get(lexemeId);
        if (!lexeme || !isNonEmpty(lexeme.meaning.en) || !isNonEmpty(lexeme.meaning.it)) {
          push({
            code: "unglossed-lexeme-use",
            stage: "lexical",
            lessonId,
            id: variantId,
            referenceId: lexemeId,
            dimension: source,
          });
        }
        if (!availableLexemeIds.has(lexemeId)) {
          push({
            code: "unintroduced-lexeme-use",
            stage: "lexical",
            lessonId,
            id: variantId,
            referenceId: lexemeId,
            dimension: source,
          });
          if (source === "example" || source === "dialogue") {
            const introduction = firstIntroductionIndex.get(lexemeId);
            if (introduction !== undefined && introduction > index) {
              push({
                code:
                  source === "example"
                    ? "future-content-in-example"
                    : "future-content-in-dialogue",
                stage: "lexical",
                lessonId,
                id: variantId,
                referenceId: lexemeId,
              });
            }
          }
        }
      }

      const variant = variantById.get(variantId);
      const family = variant ? familyById.get(variant.sentenceFamilyId) : undefined;
      if (!variant || !family) return;
      for (const conceptId of requiredConceptsForVariant(family, variant)) {
        const errorKey = `${lessonId}\u0000${conceptId}`;
        if (!explainedGrammarConceptIds.has(conceptId) && !reportedConceptUses.has(errorKey)) {
          reportedConceptUses.add(errorKey);
          push({
            code: "grammar-explanation-missing",
            stage: "grammar",
            lessonId,
            id: variantId,
            referenceId: conceptId,
            dimension: source,
          });
        }
      }
      const predicateLexeme = lexemeByValueId[variant.slotValues.predicate ?? ""];
      if (predicateLexeme?.category === "verb") {
        if (!predicateLexeme.verb) {
          push({
            code: "verb-form-unexplained",
            stage: "grammar",
            lessonId,
            id: variantId,
            referenceId: predicateLexeme.id,
            dimension: "missing-dictionary-polite-class",
          });
        }
        const key = formKey(variant.form);
        const errorKey = `${lessonId}\u0000${variantId}\u0000${key}`;
        if (
          isNonstandardVerbForm(variant.form) &&
          !explainedVerbFormKeys.has(key) &&
          !reportedVerbFormUses.has(errorKey)
        ) {
          reportedVerbFormUses.add(errorKey);
          push({
            code: "verb-form-unexplained",
            stage: "grammar",
            lessonId,
            id: variantId,
            referenceId: predicateLexeme.id,
            dimension: key,
          });
        }
      }
    };

    if (isPhoneticLesson(lessonId)) {
      const phoneticItems = input.phoneticItemsByLesson[lessonId] ?? [];
      for (const lexemeId of content.newLexemeIds) {
        const lexeme = lexemeById.get(lexemeId);
        const item = lexeme
          ? phoneticItems.find(
              (candidate) => candidate.kana === lexeme.kana || candidate.glyph === lexeme.kana,
            )
          : undefined;
        if (!item || !lexeme) continue;
        usedLexemeIds.add(lexeme.id);
        introducedLexemeIdsInModels.add(lexeme.id);
      }
    } else {
      for (const variantId of modelVariantIds) inspectVariant(variantId, "model");
      for (const target of activityTargets) {
        if (target.variantId) {
          inspectVariant(target.variantId, target.generated ? "practice" : "spoken");
        }
      }
    }

    validateWorkedContent(
      content,
      lessonId,
      isPhoneticLesson(lessonId),
      modelVariantIds,
      input.phoneticItemsByLesson[lessonId] ?? [],
      inspectVariant,
      push,
    );

    for (const lexemeId of content.newLexemeIds) {
      if (!introducedLexemeIdsInModels.has(lexemeId)) {
        push({
          code: "missing-instructional-content",
          stage: "lexical",
          lessonId,
          id: lexemeId,
          dimension: "new-lexeme-not-realized",
        });
      }
    }
    report.usedLexemeIds = [...usedLexemeIds].sort(compare);
  }

  const rows: A1LessonCurriculumReport[] = A1_LESSON_IDS.map((lessonId) => {
    const row = reportByLesson.get(lessonId)!;
    return {
      lessonId: row.lessonId,
      newLexemeCount: row.newLexemeCount,
      introducedLexemeIds: row.introducedLexemeIds,
      usedLexemeIds: row.usedLexemeIds,
      learningNoteId: row.learningNoteId,
      prerequisiteConceptIds: row.prerequisiteConceptIds,
      practiceFunctions: row.practiceFunctions,
      interactionKinds: row.interactionKinds,
      visibleTargetKeys: row.visibleTargetKeys,
    };
  });
  const sortedErrors = [...errors].sort(
    (left, right) =>
      compare(left.code, right.code) ||
      compare(left.lessonId ?? "", right.lessonId ?? "") ||
      compare(left.id ?? "", right.id ?? "") ||
      compare(left.dimension ?? "", right.dimension ?? "") ||
      compare(left.referenceId ?? "", right.referenceId ?? ""),
  );
  return {
    valid: sortedErrors.length === 0,
    errors: sortedErrors,
    reports: buildA1CurriculumReports({ rows, errors: sortedErrors }),
  };
}

function requiredConceptsForVariant(
  family: SentenceFamily,
  variant: SentenceVariant,
): readonly string[] {
  return family.requiredConceptIds.filter(
    (conceptId) =>
      conceptId !== "a1-concept-interrogative-ka" || variant.form.interrogative === true,
  );
}

function addVariantLocaleErrors(
  push: (error: A1CurriculumValidationError) => void,
  copy: A1CurriculumValidationInput["foundationCopy"],
  lessonId: string,
  variantId: string,
): void {
  const copyId = variantTranslationCopyId(variantId);
  for (const locale of ["en", "it"] as const) {
    if (!isNonEmpty(copy[locale][copyId])) {
      push({
        code: "missing-locale-copy",
        stage: "locale",
        lessonId,
        id: variantId,
        referenceId: copyId,
        dimension: locale,
        expected: "non-empty natural translation",
        actual: copy[locale][copyId] ?? "missing",
      });
    }
  }
}

function resolvePracticeTargets(
  content: A1LessonContent,
  lessonId: string,
  semanticLesson: FoundationCatalogs["lessons"][number] | undefined,
  input: A1CurriculumValidationInput,
  resolveVariant: (variantId: string) => VariantResolution,
  push: (error: A1CurriculumValidationError) => void,
): readonly ResolvedActivityTarget[] {
  const activities = content.practiceBlueprint.activities;
  if (isPhoneticLesson(lessonId)) {
    const items = input.phoneticItemsByLesson[lessonId] ?? [];
    return activities.flatMap((activity): readonly ResolvedActivityTarget[] => {
      const targetRef = activity.targetRef;
      if (isSpokenTarget(targetRef)) {
        const item = items.find((candidate) => candidate.id === targetRef.spokenVariantId);
        if (!item) {
          push({
            code: "missing-instructional-content",
            stage: "practice",
            lessonId,
            id: activity.id,
            referenceId: targetRef.spokenVariantId,
            dimension: "spoken-item",
          });
          return [];
        }
        return [{
          activity,
          generated: false,
          visibleTargetKey: item.glyph,
          assessedIds: [`phonetic:${lessonId}`, item.id],
          expectedInteractionKind: "spoken",
          itemId: item.id,
        }];
      }
      const offset = targetRef.round === "one" ? 0 : 3;
      const item = items[targetRef.index + offset];
      if (!item) {
        push({
          code: "missing-instructional-content",
          stage: "practice",
          lessonId,
          id: activity.id,
          dimension: "phonetic-target-ref",
        });
        return [];
      }
      return [{
        activity,
        generated: true,
        visibleTargetKey: item.glyph,
        assessedIds: [`phonetic:${lessonId}`, item.id],
        expectedInteractionKind:
          item.exerciseKind === "mora-tiling" ? "tile-ordering" : "choice",
        itemId: item.id,
      }];
    });
  }

  if (!semanticLesson) return [];
  const built = buildLessonViewModel({
    catalogs: input.foundationCatalogs,
    copy: input.foundationCopy,
    lessonId,
    locale: "en",
    catalogVersion: A1_RELEASE_CATALOG_VERSION,
    seed: A1_RELEASE_SEED,
  });
  if (!built.ok) {
    push({
      code: "missing-instructional-content",
      stage: "practice",
      lessonId,
      id: lessonId,
      dimension: built.error.code,
      referenceId: built.error.detail,
    });
    return [];
  }
  return activities.flatMap((activity): readonly ResolvedActivityTarget[] => {
    if (isSpokenTarget(activity.targetRef)) {
      if (!semanticLesson.modelVariantIds.includes(activity.targetRef.spokenVariantId)) {
        push({
          code: "missing-instructional-content",
          stage: "practice",
          lessonId,
          id: activity.id,
          referenceId: activity.targetRef.spokenVariantId,
          dimension: "spoken-variant-ownership",
        });
        return [];
      }
      const resolution = resolveVariant(activity.targetRef.spokenVariantId);
      if (!resolution.sentence) {
        push({
          code: "worked-example-unresolvable",
          stage: "realization",
          lessonId,
          id: activity.id,
          referenceId: activity.targetRef.spokenVariantId,
          dimension: "spoken",
        });
        return [];
      }
      return [{
        activity,
        generated: false,
        visibleTargetKey: resolution.sentence.visibleTargetKey,
        assessedIds: [
          ...resolution.sentence.usedConceptIds,
          ...resolution.sentence.usedLexemeSenseIds,
        ],
        expectedInteractionKind: "spoken",
        variantId: activity.targetRef.spokenVariantId,
      }];
    }
    const round =
      activity.targetRef.round === "one" ? built.model.rounds[0] : built.model.rounds[1];
    const target = round.targets[activity.targetRef.index];
    if (!target) {
      push({
        code: "missing-instructional-content",
        stage: "practice",
        lessonId,
        id: activity.id,
        dimension: "selected-target-ref",
        referenceId: `${activity.targetRef.round}:${activity.targetRef.index}`,
      });
      return [];
    }
    return [{
      activity,
      generated: true,
      visibleTargetKey: target.visibleTargetKey,
      assessedIds: [...target.prompt.assessedConceptIds, ...target.prompt.assessedLexemeIds],
      expectedInteractionKind: target.prompt.kind as GeneratedInteractionKind,
      variantId: target.variantId,
    }];
  });
}

function validatePracticeBlueprint(
  content: A1LessonContent,
  lessonId: string,
  activityTargets: readonly ResolvedActivityTarget[],
  push: (error: A1CurriculumValidationError) => void,
): void {
  const activities = content.practiceBlueprint.activities;
  if (activities.length !== 5) {
    push({
      code: "invalid-practice-count",
      stage: "practice",
      lessonId,
      expected: 5,
      actual: activities.length,
    });
  }
  const functions = new Set(activities.map((activity) => activity.function));
  if (functions.size < 4) {
    push({
      code: "insufficient-practice-functions",
      stage: "practice",
      lessonId,
      expected: 4,
      actual: functions.size,
    });
  }
  for (const required of REQUIRED_PRACTICE_FUNCTIONS) {
    if (!functions.has(required)) {
      push({
        code: "missing-practice-function",
        stage: "practice",
        lessonId,
        referenceId: required,
      });
    }
  }
  for (let index = 1; index < activities.length; index += 1) {
    if (activities[index - 1]?.function === activities[index]?.function) {
      push({
        code: "consecutive-practice-function",
        stage: "practice",
        lessonId,
        id: activities[index]?.id,
        referenceId: activities[index]?.function,
      });
    }
  }
  const visibleTargetKeys = new Set<string>();
  for (const target of activityTargets) {
    if (visibleTargetKeys.has(target.visibleTargetKey)) {
      push({
        code: "duplicate-practice-target",
        stage: "practice",
        lessonId,
        id: target.activity.id,
        referenceId: target.visibleTargetKey,
      });
    }
    visibleTargetKeys.add(target.visibleTargetKey);
    if (target.activity.interactionKind !== target.expectedInteractionKind) {
      push({
        code: "practice-kind-mismatch",
        stage: "practice",
        lessonId,
        id: target.activity.id,
        expected: target.expectedInteractionKind,
        actual: target.activity.interactionKind,
      });
    }
  }
  for (const source of activityTargets.filter((target) => target.generated)) {
    const sourceTarget: A1ReviewRetrievalTarget = {
      id: source.activity.id,
      function: source.activity.function,
      visibleTargetKey: source.visibleTargetKey,
      assessedIds: source.assessedIds,
    };
    const alternate = activityTargets.find((candidate) =>
      validateReviewRetrievalPair(sourceTarget, {
        id: candidate.activity.id,
        function: candidate.activity.function,
        visibleTargetKey: candidate.visibleTargetKey,
        assessedIds: candidate.assessedIds,
      }) === undefined,
    );
    if (!alternate) {
      push({
        code: "review-retrieval-clone",
        stage: "review",
        lessonId,
        id: source.activity.id,
        dimension: "no-safe-alternate",
      });
    }
  }
}

function validateWorkedContent(
  content: A1LessonContent,
  lessonId: string,
  phonetic: boolean,
  modelVariantIds: readonly string[],
  phoneticItems: readonly A1PhoneticItem[],
  inspectVariant: (variantId: string, source: "example" | "dialogue") => void,
  push: (error: A1CurriculumValidationError) => void,
): void {
  const validateIds = (
    ids: readonly string[],
    source: "example" | "dialogue",
  ): void => {
    if (ids.length < 2 || ids.length > 3) {
      push({
        code: "invalid-worked-example-count",
        stage: "realization",
        lessonId,
        id: lessonId,
        dimension: source,
        expected: "2-3",
        actual: ids.length,
      });
    }
    for (const id of ids) {
      if (phonetic) {
        if (!phoneticItems.some((item) => item.id === id)) {
          push({
            code: "worked-example-unresolvable",
            stage: "realization",
            lessonId,
            id,
            dimension: `${source}-item-ownership`,
          });
        }
      } else {
        if (!modelVariantIds.includes(id)) {
          push({
            code: "worked-example-unresolvable",
            stage: "realization",
            lessonId,
            id,
            dimension: `${source}-variant-ownership`,
          });
          continue;
        }
        inspectVariant(id, source);
      }
    }
  };
  validateIds(content.workedExampleVariantIds, "example");
  if (content.dialogue !== undefined) {
    if (phonetic) {
      push({
        code: "worked-example-unresolvable",
        stage: "realization",
        lessonId,
        id: lessonId,
        dimension: "phonetic-dialogue",
      });
    }
    validateIds(content.dialogue.turnVariantIds, "dialogue");
  }
}
