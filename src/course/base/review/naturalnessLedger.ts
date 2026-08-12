import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  BaseLexeme,
  BaseReferenceSnapshotDefinition,
  BaseVisibleTarget,
} from "../catalog/types";
import {
  BASE_AUDIO_CATALOG,
  type BaseAudioRecord,
} from "../audio/catalog";
import {
  baseNavigationCopyEn,
  type BaseNavigationCopy,
} from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  BASE_SOUND_MODULE,
  BASE_SOUND_TARGET_BY_ID,
  type BaseSoundModule,
} from "../content/module01Sounds";
import { BASE_SENTENCE_FOUNDATIONS_MODULE } from "../content/module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_MODULE } from "../content/module03TopicQuestions";
import {
  BASE_POLITE_VERBS_MODULE,
} from "../content/module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_MODULE } from "../content/module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_MODULE } from "../content/module06TimeMovement";
import { BASE_COPULA_ADJECTIVES_MODULE } from "../content/module07CopulaAdjectives";
import { BASE_EXISTENCE_LOCATION_MODULE } from "../content/module08ExistenceLocation";
import { BASE_REQUESTS_CONNECTION_MODULE } from "../content/module09RequestsConnection";
import { BASE_SYNTHESIS_MODULE } from "../content/module10Synthesis";
import { BASE_REFERENCE_SNAPSHOTS } from "../catalog/concepts";
import { BASE_LEXICON } from "../catalog/lexicon";
import {
  BASE_REFERENCE_CATALOG,
  type BaseReferenceCatalog,
  type BaseReferenceCopy,
} from "../references/catalog";
import { canonicalReviewFingerprint } from "./fingerprint";

export type BaseNaturalnessSourceKind =
  | "example"
  | "dialogue-turn"
  | "prompt"
  | "option"
  | "accepted-answer"
  | "spoken-answer"
  | "audio-string"
  | "localized-copy";

interface BaseNaturalnessReviewEntryCommon {
  readonly contentId: string;
  readonly lessonId: string;
  readonly sourceId: string;
  readonly sourceKind: BaseNaturalnessSourceKind;
  readonly jp: string;
  readonly en: string;
  readonly it: string;
  readonly fingerprint: string;
}

export type BaseNaturalnessReviewEntry =
  | (BaseNaturalnessReviewEntryCommon &
      Readonly<{ readonly status: "pending" }>)
  | (BaseNaturalnessReviewEntryCommon &
      Readonly<{
        readonly status: "accepted";
        readonly reviewerIdentity: string;
        readonly reviewedAt: string;
      }>);

interface ReviewSource extends Omit<BaseNaturalnessReviewEntryCommon, "fingerprint"> {
  readonly payload: unknown;
}

export interface BaseNaturalnessReviewApproval {
  readonly reviewerIdentity: string;
  readonly reviewedAt: string;
  readonly aggregateFingerprint: string;
  readonly acceptedEntryCount: number;
}

/**
 * The independently supplied naturalness review handoff. This is an *aggregate*
 * approval: one reviewer signing one corpus, pinned to that corpus's fingerprint
 * and entry count. It is deliberately not a list of per-entry acceptances,
 * because a per-entry list can drift silently — an entry could keep its
 * acceptance while its text changed underneath. Here, if the corpus moves at all
 * the fingerprint stops matching and every entry falls back to `pending`.
 *
 * Recorded after the focused delta review compared this corpus against the
 * previously approved 9a84ac6 corpus (4,944 / 5d040b91…4564a) and found exactly
 * 2 added, 19 changed and 0 removed entries, approving all of them along with
 * the unchanged remainder.
 *
 * It covers naturalness only. The 86 canonical audio items are a separate
 * ledger and remain pending human-ear sign-off.
 */
export const BASE_NATURALNESS_REVIEW_APPROVAL: BaseNaturalnessReviewApproval =
  deepFreeze({
    reviewerIdentity: "base-naturalness-final-delta-reviewer",
    reviewedAt: "2026-08-12",
    aggregateFingerprint:
      "24e1932284b50b5cf631d726dcd87b7715ba3bb978140f02fbefe6db8bb5495d",
    acceptedEntryCount: 4_946,
  });

const SEMANTIC_LESSONS = [
  ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons,
  ...BASE_TOPIC_QUESTIONS_MODULE.lessons,
  ...BASE_POLITE_VERBS_MODULE.lessons,
  ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
  ...BASE_TIME_MOVEMENT_MODULE.lessons,
  ...BASE_COPULA_ADJECTIVES_MODULE.lessons,
  ...BASE_EXISTENCE_LOCATION_MODULE.lessons,
  ...BASE_REQUESTS_CONNECTION_MODULE.lessons,
  ...BASE_SYNTHESIS_MODULE.lessons,
];

type BaseNaturalnessSemanticLesson = (typeof SEMANTIC_LESSONS)[number];

interface BaseNaturalnessSourceInputs {
  readonly copyEn: BaseNavigationCopy;
  readonly copyIt: BaseNavigationCopy;
  readonly soundModule: BaseSoundModule;
  readonly semanticLessons: readonly BaseNaturalnessSemanticLesson[];
  readonly lexemes: readonly BaseLexeme[];
  readonly referenceSnapshots: readonly BaseReferenceSnapshotDefinition[];
  readonly referenceCatalog: BaseReferenceCatalog;
  readonly audioCatalog: readonly BaseAudioRecord[];
}

const DEFAULT_SOURCE_INPUTS: BaseNaturalnessSourceInputs = {
  copyEn: baseNavigationCopyEn,
  copyIt: baseNavigationCopyIt,
  soundModule: BASE_SOUND_MODULE,
  semanticLessons: SEMANTIC_LESSONS,
  lexemes: BASE_LEXICON,
  referenceSnapshots: BASE_REFERENCE_SNAPSHOTS,
  referenceCatalog: BASE_REFERENCE_CATALOG,
  audioCatalog: BASE_AUDIO_CATALOG,
};

function japanese(target: BaseVisibleTarget): string {
  return target.tokens.map(({ jp }) => jp).join("");
}

function copyPair(
  copyId: string,
  inputs: BaseNaturalnessSourceInputs,
): Readonly<{ en: string; it: string }> {
  const en = inputs.copyEn.content[copyId];
  const it = inputs.copyIt.content[copyId];
  return {
    en: typeof en === "string" ? en : "",
    it: typeof it === "string" ? it : "",
  };
}

const TOKEN_GLOSSES: Readonly<
  Record<string, Readonly<{ readonly en: string; readonly it: string }>>
> = deepFreeze({
  "topic-wa": { en: "topic marker", it: "marcatore di tema" },
  "focus-subject-ga": {
    en: "focused-subject marker",
    it: "marcatore del soggetto focalizzato",
  },
  "existential-subject-ga": {
    en: "newly introduced entity marker",
    it: "marcatore dell'entità appena introdotta",
  },
  "object-o": { en: "object marker", it: "marcatore dell'oggetto" },
  "goal-ni": { en: "destination marker", it: "marcatore della meta" },
  "direction-he": {
    en: "direction marker",
    it: "marcatore della direzione",
  },
  "action-place-de": {
    en: "action-place marker",
    it: "marcatore del luogo dell'azione",
  },
  "means-de": { en: "means marker", it: "marcatore del mezzo" },
  "time-ni": {
    en: "specific-time marker",
    it: "marcatore del tempo specifico",
  },
  "source-kara": { en: "starting-point marker", it: "marcatore dell'inizio" },
  "limit-made": { en: "end-point marker", it: "marcatore del limite" },
  "possessive-attributive-no": {
    en: "linking の",
    it: "の di collegamento",
  },
  "additive-mo": { en: "also marker", it: "marcatore di «anche»" },
  "listing-to": { en: "and marker", it: "marcatore di «e»" },
  "nominal-to": { en: "quotation marker", it: "marcatore di citazione" },
  "companion-to": {
    en: "companion marker",
    it: "marcatore della compagnia",
  },
  "existence-location-ni": {
    en: "existence-location marker",
    it: "marcatore del luogo di esistenza",
  },
  "question-ka": { en: "question marker", it: "marcatore interrogativo" },
  "interactional-ne": {
    en: "shared-confirmation marker",
    it: "marcatore di conferma condivisa",
  },
  "interactional-yo": {
    en: "assertive marker",
    it: "marcatore assertivo",
  },
  desu: { en: "polite copula", it: "copula cortese" },
  "affirmative-desu": { en: "polite copula", it: "copula cortese" },
  "dewa-arimasen": {
    en: "polite negative copula",
    it: "copula negativa cortese",
  },
  deshita: { en: "polite past copula", it: "copula passata cortese" },
  "dewa-arimasen-deshita": {
    en: "polite past-negative copula",
    it: "copula passata negativa cortese",
  },
  masu: { en: "polite nonpast", it: "forma cortese non passata" },
  masen: {
    en: "polite nonpast negative",
    it: "forma cortese non passata negativa",
  },
  mashita: {
    en: "polite past affirmative",
    it: "forma cortese passata affermativa",
  },
  "masen-deshita": {
    en: "polite past negative",
    it: "forma cortese passata negativa",
  },
  te: { en: "te form", it: "forma in て" },
  "te-sequence": { en: "sequencing te form", it: "forma in て sequenziale" },
  kudasai: { en: "please", it: "per favore" },
  imasu: {
    en: "ongoing or current-state ending",
    it: "terminazione di azione in corso o stato attuale",
  },
  kunai: { en: "not", it: "non" },
  katta: { en: "was", it: "era" },
  kunakatta: { en: "was not", it: "non era" },
  na: { en: "attributive な", it: "な attributivo" },
  "godan-verb-class": { en: "godan verb", it: "verbo godan" },
  "ichidan-verb-class": { en: "ichidan verb", it: "verbo ichidan" },
  "suru-verb-class": { en: "suru verb", it: "verbo in する" },
  "kuru-verb-class": { en: "kuru verb", it: "verbo くる" },
  "dictionary-lemma": {
    en: "dictionary form",
    it: "forma di dizionario",
  },
  "analysis-habitual": {
    en: "habitual reading",
    it: "lettura abituale",
  },
  "analysis-future": { en: "future reading", it: "lettura futura" },
  "analysis-action-place": {
    en: "action place",
    it: "luogo dell'azione",
  },
  "analysis-means": { en: "means", it: "mezzo" },
  "analysis-dictionary": {
    en: "dictionary form",
    it: "forma di dizionario",
  },
  "analysis-headword": { en: "headword", it: "lemma di consultazione" },
  "analysis-lemma": { en: "base form", it: "forma base" },
  "analysis-predicate": { en: "predicate", it: "predicato" },
  "analysis-verb": { en: "verb", it: "verbo" },
  "analysis-final-predicate": {
    en: "clause-final predicate",
    it: "predicato finale della frase",
  },
  "analysis-stem": { en: "polite stem", it: "tema cortese" },
  "analysis-classification": {
    en: "verb classification",
    it: "classificazione verbale",
  },
  "analysis-class-question": {
    en: "which verb type?",
    it: "quale tipo di verbo?",
  },
  "analysis-pair": { en: "please listen", it: "ascolta, per favore" },
  "analysis-suffix-guess": {
    en: "ending only",
    it: "soltanto la terminazione",
  },
  "analysis-source": {
    en: "dictionary form",
    it: "forma di dizionario",
  },
  "analysis-stem-source": {
    en: "dictionary form to polite stem",
    it: "dalla forma di dizionario al tema cortese",
  },
  "verb-class-exceptions": { en: "exception", it: "eccezione" },
  "analysis-goal": { en: "arrival point", it: "punto d'arrivo" },
  "analysis-direction": { en: "direction", it: "direzione" },
  "polite-stems": { en: "polite stem", it: "tema cortese" },
  "japanese-comma": { en: ",", it: "," },
  "japanese-period": { en: ".", it: "." },
});

function reviewGloss(
  target: BaseVisibleTarget,
  inputs: BaseNaturalnessSourceInputs,
): Readonly<{ readonly en: string; readonly it: string }> {
  const lexemes = new Map(inputs.lexemes.map((lexeme) => [lexeme.id, lexeme]));
  const glossToken = (
    token: BaseVisibleTarget["tokens"][number],
    locale: "en" | "it",
  ): string => {
    const lexeme = lexemes.get(token.source.referenceId);
    if (lexeme) {
      const meaning = copyPair(lexeme.meaningCopyId, inputs)[locale].trim();
      if (meaning) return meaning;
    }
    const known = TOKEN_GLOSSES[token.source.referenceId]?.[locale];
    if (known) return known;
    return `「${token.jp}」`;
  };
  const en = target.tokens.map((token) => glossToken(token, "en")).join(" · ");
  const it = target.tokens.map((token) => glossToken(token, "it")).join(" · ");
  return {
    en: `Literal review gloss: ${en || `「${japanese(target)}」`}.`,
    it: `Glossa letterale di revisione: ${it || `「${japanese(target)}」`}.`,
  };
}

function soundReviewGloss(
  kana: string,
  romaji: string,
): Readonly<{ readonly en: string; readonly it: string }> {
  const reading = romaji.trim() ? ` (${romaji})` : "";
  return {
    en: `Kana review display: ${kana}${reading}.`,
    it: `Elemento kana da revisionare: ${kana}${reading}.`,
  };
}

function targetSource(
  contentId: string,
  lessonId: string,
  sourceId: string,
  sourceKind: Exclude<BaseNaturalnessSourceKind, "localized-copy">,
  target: BaseVisibleTarget,
  en = "",
  it = "",
  extraPayload: unknown = null,
): ReviewSource {
  return {
    contentId,
    lessonId,
    sourceId,
    sourceKind,
    jp: japanese(target),
    en,
    it,
    payload: { target, extraPayload },
  };
}

function localizedSource(
  lessonId: string,
  copyId: string,
  jp: string,
  payload: unknown,
  inputs: BaseNaturalnessSourceInputs,
): ReviewSource {
  const { en, it } = copyPair(copyId, inputs);
  if (!en.trim() || !it.trim()) {
    throw new Error(`Missing localized Base copy "${copyId}".`);
  }
  return {
    contentId: `copy:${copyId}`,
    lessonId,
    sourceId: copyId,
    sourceKind: "localized-copy",
    jp,
    en,
    it,
    payload: { copyId, en, it, source: payload },
  };
}

function inlineLocalizedSource(
  lessonId: string,
  sourceId: string,
  jp: string,
  localized: Readonly<{ readonly en: string; readonly it: string }>,
  payload: unknown,
): ReviewSource {
  return {
    contentId: `copy:${sourceId}`,
    lessonId,
    sourceId,
    sourceKind: "localized-copy",
    jp,
    en: localized.en,
    it: localized.it,
    payload: { sourceId, source: payload },
  };
}

function buildReviewSources(
  inputs: BaseNaturalnessSourceInputs = DEFAULT_SOURCE_INPUTS,
): readonly ReviewSource[] {
  const sources: ReviewSource[] = [];
  const localized = new Map<string, ReviewSource>();
  const addLocalized = (
    lessonId: string,
    copyId: string | null | undefined,
    jp: string,
    payload: unknown,
  ): void => {
    if (!copyId || localized.has(copyId)) return;
    const source = localizedSource(lessonId, copyId, jp, payload, inputs);
    localized.set(copyId, source);
  };
  const addInlineLocalized = (
    lessonId: string,
    sourceId: string,
    jp: string,
    value: Readonly<{ readonly en: string; readonly it: string }>,
    payload: unknown,
  ): void => {
    if (localized.has(sourceId)) return;
    localized.set(
      sourceId,
      inlineLocalizedSource(lessonId, sourceId, jp, value, payload),
    );
  };
  const addReferenceCopy = (
    lessonId: string,
    sourceId: string,
    jp: string,
    copy: BaseReferenceCopy,
    payload: unknown,
  ): void => {
    for (const field of ["label", "explanation"] as const) {
      addInlineLocalized(
        lessonId,
        `${sourceId}:${field}`,
        jp,
        { en: copy.en[field], it: copy.it[field] },
        { field, source: payload },
      );
    }
  };

  for (const lesson of inputs.soundModule.lessons) {
    const lessonId = lesson.content.lessonId;
    const lessonAnchor = lesson.anchorWords[0]?.kana ?? lessonId;
    addLocalized(lessonId, lesson.content.recapCopyId, lessonAnchor, lesson.content);
    addLocalized(
      lessonId,
      lesson.content.phoneticExplanationCopyId,
      lessonAnchor,
      lesson.content,
    );
    addLocalized(
      lessonId,
      lesson.content.contrastMapId,
      lessonAnchor,
      lesson.content,
    );
    addInlineLocalized(
      lessonId,
      `inline:${lessonId}:scope-note`,
      lessonAnchor,
      lesson.scopeNote,
      lesson.scopeNote,
    );
    for (const item of lesson.contrastiveItems) {
      addInlineLocalized(
        lessonId,
        `inline:${lessonId}:contrast:${item.id}:explanation`,
        item.kana,
        item.explanation,
        item,
      );
    }
    for (const coverage of lesson.inventoryCoverage) {
      if (coverage.rationale) {
        addInlineLocalized(
          lessonId,
          `inline:${lessonId}:coverage:${coverage.inventoryId}:rationale`,
          coverage.represented.join("") || lessonAnchor,
          coverage.rationale,
          coverage,
        );
      }
    }
    for (const anchor of lesson.anchorWords) {
      const meaning = copyPair(anchor.meaningCopyId, inputs);
      sources.push({
        contentId: `${lessonId}:example:${anchor.id}`,
        lessonId,
        sourceId: anchor.id,
        sourceKind: "example",
        jp: anchor.kana,
        en: meaning.en,
        it: meaning.it,
        payload: anchor,
      });
      addLocalized(lessonId, anchor.meaningCopyId, anchor.kana, anchor);
      addInlineLocalized(
        lessonId,
        `inline:${lessonId}:anchor:${anchor.id}:status`,
        anchor.kana,
        anchor.status,
        anchor,
      );
    }
    for (const design of lesson.activityDesigns) {
      const activity = lesson.content.activities.find(
        ({ id }) => id === design.activityId,
      );
      const prompt = BASE_SOUND_TARGET_BY_ID.get(design.promptTargetId);
      const accepted = BASE_SOUND_TARGET_BY_ID.get(design.answerTargetId);
      if (!activity || !prompt || !accepted) {
        throw new Error(`Incomplete sound review source "${design.activityId}".`);
      }
      const promptGloss = soundReviewGloss(prompt.kana, prompt.romaji);
      sources.push({
        contentId: `${design.activityId}:prompt`,
        lessonId,
        sourceId: design.promptTargetId,
        sourceKind: "prompt",
        jp: prompt.kana,
        en: promptGloss.en,
        it: promptGloss.it,
        payload: prompt,
      });
      design.optionTargetIds.forEach((id, index) => {
        const option = BASE_SOUND_TARGET_BY_ID.get(id);
        if (!option) throw new Error(`Missing sound option "${id}".`);
        const optionGloss = soundReviewGloss(option.kana, option.romaji);
        sources.push({
          contentId: `${design.activityId}:option:${index + 1}`,
          lessonId,
          sourceId: id,
          sourceKind: "option",
          jp: option.kana,
          en: optionGloss.en,
          it: optionGloss.it,
          payload: option,
        });
      });
      const acceptedGloss = soundReviewGloss(accepted.kana, accepted.romaji);
      sources.push({
        contentId: `${design.activityId}:${
          design.correctOptionTargetId === null ? "spoken" : "accepted"
        }`,
        lessonId,
        sourceId: design.answerTargetId,
        sourceKind:
          design.correctOptionTargetId === null
            ? "spoken-answer"
            : "accepted-answer",
        jp: accepted.kana,
        en: acceptedGloss.en,
        it: acceptedGloss.it,
        payload: accepted,
      });
      addLocalized(
        lessonId,
        activity.instructionCopyId,
        prompt.kana,
        design,
      );
      addLocalized(
        lessonId,
        activity.acceptedFeedbackCopyId,
        accepted.kana,
        design,
      );
      addLocalized(
        lessonId,
        activity.retryFeedbackCopyId,
        prompt.kana,
        design,
      );
    }
  }
  const soundAnchor =
    inputs.soundModule.lessons[0]?.anchorWords[0]?.kana ?? "にほんご";
  addInlineLocalized(
    "sounds",
    "inline:sounds:out-of-scope",
    soundAnchor,
    inputs.soundModule.outOfScope,
    inputs.soundModule,
  );

  for (const lesson of inputs.semanticLessons) {
    const lessonId = lesson.content.lessonId;
    lesson.examples.forEach((example) => {
      const translationCopyId =
        "copyId" in example.translationCopy
          ? example.translationCopy.copyId
          : example.translationCopy.enCopyId;
      const translation = copyPair(translationCopyId, inputs);
      const jp = japanese(example);
      sources.push(
        targetSource(
          `${lessonId}:example:${example.id}`,
          lessonId,
          example.id,
          "example",
          example,
          translation.en,
          translation.it,
        ),
      );
      addLocalized(lessonId, translationCopyId, jp, example);
      addLocalized(lessonId, example.teachingPurposeCopyId, jp, example);
      addLocalized(lessonId, example.contextCopyId, jp, example);
    });

    if (lesson.dialogue) {
      const firstSurface = japanese(lesson.dialogue.turns[0]);
      addLocalized(
        lessonId,
        lesson.dialogue.practicalOutcomeCopyId,
        firstSurface,
        lesson.dialogue,
      );
      lesson.dialogue.turns.forEach((turn, index) => {
        const copy = lesson.dialogue?.turnCopy[index];
        const translation = copy
          ? copyPair(copy.translationCopyId, inputs)
          : { en: "", it: "" };
        const sourceId = `${lesson.dialogue?.id}-turn-${index + 1}`;
        const jp = japanese(turn);
        sources.push(
          targetSource(
            `${lessonId}:dialogue:${index + 1}`,
            lessonId,
            sourceId,
            "dialogue-turn",
            turn,
            translation.en,
            translation.it,
          ),
        );
        addLocalized(lessonId, copy?.translationCopyId, jp, turn);
        addLocalized(lessonId, copy?.purposeCopyId, jp, turn);
      });
    }

    lesson.activityDesigns.forEach((design, index) => {
      const activity = lesson.content.activities[index];
      const promptJp = japanese(design.promptTarget);
      const promptGloss = reviewGloss(design.promptTarget, inputs);
      sources.push(
        targetSource(
          `${activity.id}:prompt`,
          lessonId,
          `${activity.id}:prompt`,
          "prompt",
          design.promptTarget,
          promptGloss.en,
          promptGloss.it,
          design.contextTarget,
        ),
      );
      design.optionTargets.forEach((option, optionIndex) => {
        const optionGloss = reviewGloss(option, inputs);
        sources.push(
          targetSource(
            `${activity.id}:option:${optionIndex + 1}`,
            lessonId,
            design.optionTargetIds[optionIndex],
            "option",
            option,
            optionGloss.en,
            optionGloss.it,
            {
              factStatus: design.optionFactStatus[optionIndex],
              reviewEvidence:
                "reviewEvidence" in design ? design.reviewEvidence : null,
            },
          ),
        );
      });
      const spoken = design.correctOptionIndex === null;
      const answerGloss = reviewGloss(design.acceptedAnswerTarget, inputs);
      sources.push(
        targetSource(
          `${activity.id}:${spoken ? "spoken" : "accepted"}`,
          lessonId,
          design.acceptedAnswerTargetId,
          spoken ? "spoken-answer" : "accepted-answer",
          design.acceptedAnswerTarget,
          answerGloss.en,
          answerGloss.it,
          {
            operationEvidence: design.operationEvidence,
            reviewEvidence:
              "reviewEvidence" in design ? design.reviewEvidence : null,
          },
        ),
      );
      if (design.audioContract) {
        sources.push(
          targetSource(
            `${activity.id}:audio`,
            lessonId,
            design.audioContract.targetId,
            "audio-string",
            design.acceptedAnswerTarget,
            answerGloss.en,
            answerGloss.it,
            design.audioContract,
          ),
        );
      }
      addLocalized(
        lessonId,
        activity.instructionCopyId,
        promptJp,
        design,
      );
      addLocalized(
        lessonId,
        activity.acceptedFeedbackCopyId,
        japanese(design.acceptedAnswerTarget),
        design,
      );
      addLocalized(
        lessonId,
        activity.retryFeedbackCopyId,
        promptJp,
        design,
      );
    });

    const anchorJp =
      lesson.examples[0] !== undefined
        ? japanese(lesson.examples[0])
        : lesson.content.lessonId;
    addLocalized(lessonId, lesson.titleCopyId, anchorJp, lesson.explanation);
    addLocalized(lessonId, lesson.objectiveCopyId, anchorJp, lesson.explanation);
    addLocalized(
      lessonId,
      lesson.explanation.mainCopyId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(
      lessonId,
      lesson.explanation.constructionCopyId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(
      lessonId,
      lesson.explanation.constraintsCopyId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(
      lessonId,
      lesson.explanation.commonErrorCopyId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(
      lessonId,
      lesson.explanation.nearestContrastId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(lessonId, lesson.content.recapCopyId, anchorJp, lesson.content);
  }

  for (const lexeme of inputs.lexemes) {
    addLocalized(
      lexeme.firstTeachLessonId,
      lexeme.meaningCopyId,
      lexeme.kana,
      lexeme,
    );
  }

  for (const snapshot of inputs.referenceSnapshots) {
    addLocalized(
      snapshot.firstTeachLessonId,
      snapshot.titleCopyId,
      snapshot.id,
      snapshot,
    );
  }

  for (const reference of inputs.referenceCatalog) {
    const prefix = `inline:reference:${reference.id}`;
    const referenceAnchor =
      reference.cells[0]?.tokens.map(({ jp }) => jp).join("") || soundAnchor;
    addReferenceCopy(
      reference.firstTeachLessonId,
      `${prefix}:definition`,
      referenceAnchor,
      reference.copy,
      reference,
    );
    for (const column of reference.columns) {
      const columnAnchor =
        reference.cells
          .find(({ columnId }) => columnId === column.id)
          ?.tokens.map(({ jp }) => jp)
          .join("") || referenceAnchor;
      addReferenceCopy(
        reference.firstTeachLessonId,
        `${prefix}:column:${column.id}`,
        columnAnchor,
        column.copy,
        column,
      );
    }
    for (const entry of reference.entries) {
      const entryAnchor =
        entry.canonicalFormCells[0]?.tokens.map(({ jp }) => jp).join("") ||
        referenceAnchor;
      addReferenceCopy(
        entry.firstTeachLessonId,
        `${prefix}:entry:${entry.semanticId}`,
        entryAnchor,
        entry.copy,
        entry,
      );
    }
    for (const cell of reference.cells) {
      const owner = reference.entries.find(({ canonicalFormCells }) =>
        canonicalFormCells.some(({ id }) => id === cell.id),
      );
      addReferenceCopy(
        owner?.firstTeachLessonId ?? reference.firstTeachLessonId,
        `${prefix}:cell:${cell.id}`,
        cell.tokens.map(({ jp }) => jp).join("") || referenceAnchor,
        cell.copy,
        cell,
      );
    }
  }

  for (const record of inputs.audioCatalog) {
    addLocalized(
      record.id.replace(/^snd(\d+)-.*$/u, "sounds-$1"),
      record.failureStateIds.failed,
      record.kana,
      record,
    );
    addLocalized(
      record.id.replace(/^snd(\d+)-.*$/u, "sounds-$1"),
      record.failureStateIds.unavailable,
      record.kana,
      record,
    );
    addLocalized(
      record.id.replace(/^snd(\d+)-.*$/u, "sounds-$1"),
      record.failureStateIds.retryControl,
      record.kana,
      record,
    );
    sources.push({
      contentId: `audio-string:${record.id}`,
      lessonId: record.id.replace(/^snd(\d+)-.*$/u, "sounds-$1"),
      sourceId: record.id,
      sourceKind: "audio-string",
      jp: record.kana,
      en: record.meaning.en,
      it: record.meaning.it,
      payload: {
        id: record.id,
        kana: record.kana,
        morae: record.morae,
        sha256: record.sha256,
        fingerprint: record.fingerprint,
      },
    });
  }

  const lessonAnchorById = new Map<string, string>();
  for (const lesson of inputs.soundModule.lessons) {
    lessonAnchorById.set(
      lesson.content.lessonId,
      lesson.anchorWords[0]?.kana ?? soundAnchor,
    );
  }
  for (const lesson of inputs.semanticLessons) {
    lessonAnchorById.set(
      lesson.content.lessonId,
      lesson.examples[0] ? japanese(lesson.examples[0]) : soundAnchor,
    );
  }
  const firstAnchor = lessonAnchorById.values().next().value ?? soundAnchor;
  for (const [moduleId, en] of Object.entries(inputs.copyEn.modules)) {
    const it = inputs.copyIt.modules[moduleId];
    if (!it) continue;
    const lessonId = Object.keys(inputs.copyEn.lessons).find(
      (candidate) =>
        candidate.startsWith(`${moduleId}-`) ||
        (moduleId === "base-synthesis" &&
          candidate.startsWith("base-synthesis-")),
    );
    const sourceId = `navigation:module:${moduleId}:title`;
    addInlineLocalized(
      lessonId ?? moduleId,
      sourceId,
      (lessonId && lessonAnchorById.get(lessonId)) ?? firstAnchor,
      { en: en.title, it: it.title },
      { section: "modules", moduleId },
    );
  }
  for (const [lessonId, en] of Object.entries(inputs.copyEn.lessons)) {
    const it = inputs.copyIt.lessons[lessonId];
    if (!it) continue;
    addInlineLocalized(
      lessonId,
      `navigation:lesson:${lessonId}:title`,
      lessonAnchorById.get(lessonId) ?? firstAnchor,
      { en: en.title, it: it.title },
      { section: "lessons", lessonId },
    );
  }
  for (const [copyId, en] of Object.entries(inputs.copyEn.objectives)) {
    const it = inputs.copyIt.objectives[copyId];
    if (typeof it !== "string") continue;
    addInlineLocalized(
      "base-curriculum",
      `navigation:objective:${copyId}`,
      firstAnchor,
      { en, it },
      { section: "objectives", copyId },
    );
  }
  for (const [copyId, en] of Object.entries(inputs.copyEn.outcomes)) {
    const it = inputs.copyIt.outcomes[copyId];
    if (typeof it !== "string") continue;
    addInlineLocalized(
      "base-curriculum",
      `navigation:outcome:${copyId}`,
      firstAnchor,
      { en, it },
      { section: "outcomes", copyId },
    );
  }

  sources.push(...localized.values());
  return deepFreeze(
    sources.sort((left, right) => left.contentId.localeCompare(right.contentId)),
  );
}

/**
 * A source's fingerprint is a pure function of that source, and every source in
 * `REVIEW_SOURCES` is a frozen module constant, so the result can safely be
 * cached against the source object itself.
 *
 * This is worth caching because the inventory is not built only once: every
 * candidate approval validated through `baseNaturalnessReviewInventoryForApproval`
 * rebuilds all ~4,900 entries, and hashing each source's payload dominates that
 * cost. Without the cache, exercising the fail-closed paths re-hashes the whole
 * corpus once per candidate, which is slow enough to time out under load.
 */
const fingerprintCache = new WeakMap<ReviewSource, string>();

function fingerprintFor(source: ReviewSource): string {
  const cached = fingerprintCache.get(source);
  if (cached !== undefined) return cached;
  const fingerprint = canonicalReviewFingerprint({
    contentId: source.contentId,
    lessonId: source.lessonId,
    sourceId: source.sourceId,
    sourceKind: source.sourceKind,
    jp: source.jp,
    en: source.en,
    it: source.it,
    payload: source.payload,
  });
  fingerprintCache.set(source, fingerprint);
  return fingerprint;
}

function corpusFingerprint(sources: readonly ReviewSource[]): string {
  return canonicalReviewFingerprint(
    sources.map((source) => ({
      contentId: source.contentId,
      fingerprint: fingerprintFor(source),
    })),
  );
}

export function baseNaturalnessCorpusFingerprintForSources(
  overrides: Partial<BaseNaturalnessSourceInputs> = {},
): string {
  return corpusFingerprint(
    buildReviewSources({ ...DEFAULT_SOURCE_INPUTS, ...overrides }),
  );
}

const REVIEW_SOURCES = buildReviewSources();

export const BASE_NATURALNESS_CURRENT_CORPUS_FINGERPRINT =
  corpusFingerprint(REVIEW_SOURCES);

/**
 * Fingerprint of the corpus that was inventoried for external naturalness
 * review, and the corpus the aggregate approval above is pinned to. Re-taken
 * whenever the learner-visible Japanese surface set changes, so the ledger keeps
 * enumerating the *current* corpus.
 *
 * Re-taking it is not acceptance. It is derived from
 * `BASE_NATURALNESS_REVIEW_APPROVAL.aggregateFingerprint`, so if content moves
 * without a fresh signature the approval no longer matches the live corpus, the
 * inventory falls back to `pending` in full, and `validateBaseNaturalnessReview`
 * reports `stale-review-approval`. Editing content can therefore only ever
 * *withdraw* acceptance, never silently retain it.
 *
 * History of the corpus this fingerprint has covered: the 2026-08-06 content
 * review fixes (「そうです、」 in the two synthesis dialogue turns,
 * `polite-verbs-2-activity-8` naming 「ごだんどうし」 with a かへんどうし
 * distractor); the four reconciled naturalness fixes R1-R4; and the restoration
 * of `copula-adjectives-4-example-9` to *"Il parco è bello."* The focused delta
 * review then compared this corpus against the approved 9a84ac6 corpus
 * (4,944 / 5d040b91…4564a), found exactly 2 added, 19 changed and 0 removed
 * entries, and approved them together with the unchanged remainder.
 */
const INVENTORIED_CORPUS_FINGERPRINT =
  BASE_NATURALNESS_REVIEW_APPROVAL.aggregateFingerprint;

export type BaseNaturalnessReviewApprovalError =
  | "invalid-approval-shape"
  | "aggregate-fingerprint-mismatch"
  | "accepted-entry-count-mismatch";

export interface BaseNaturalnessReviewApprovalValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseNaturalnessReviewApprovalError[];
}

function readNaturalnessReviewApproval(
  value: unknown,
): BaseNaturalnessReviewApproval | null {
  const record = plainEntry(value);
  if (!record) return null;
  const keys = Object.keys(record).sort();
  if (
    keys.length !== 4 ||
    keys[0] !== "acceptedEntryCount" ||
    keys[1] !== "aggregateFingerprint" ||
    keys[2] !== "reviewedAt" ||
    keys[3] !== "reviewerIdentity" ||
    typeof record.reviewerIdentity !== "string" ||
    !record.reviewerIdentity.trim() ||
    typeof record.reviewedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/u.test(record.reviewedAt) ||
    typeof record.aggregateFingerprint !== "string" ||
    !/^[a-f0-9]{64}$/u.test(record.aggregateFingerprint) ||
    typeof record.acceptedEntryCount !== "number" ||
    !Number.isSafeInteger(record.acceptedEntryCount) ||
    record.acceptedEntryCount < 0
  ) {
    return null;
  }
  return {
    reviewerIdentity: record.reviewerIdentity,
    reviewedAt: record.reviewedAt,
    aggregateFingerprint: record.aggregateFingerprint,
    acceptedEntryCount: record.acceptedEntryCount,
  };
}

export function validateBaseNaturalnessReviewApproval(
  value: unknown,
): BaseNaturalnessReviewApprovalValidation {
  const approval = readNaturalnessReviewApproval(value);
  if (!approval) {
    return { ok: false, errors: deepFreeze(["invalid-approval-shape"]) };
  }
  const errors: BaseNaturalnessReviewApprovalError[] = [];
  if (
    approval.aggregateFingerprint !== BASE_NATURALNESS_CURRENT_CORPUS_FINGERPRINT
  ) {
    errors.push("aggregate-fingerprint-mismatch");
  }
  if (approval.acceptedEntryCount !== REVIEW_SOURCES.length) {
    errors.push("accepted-entry-count-mismatch");
  }
  return { ok: errors.length === 0, errors: deepFreeze(errors) };
}

export const BASE_NATURALNESS_REVIEW_APPROVAL_VALIDATION =
  validateBaseNaturalnessReviewApproval(BASE_NATURALNESS_REVIEW_APPROVAL);

/**
 * Builds the inventory for a candidate approval. An approval that fails
 * validation for any reason yields a fully `pending` inventory rather than a
 * partially accepted one, so drift can never leave a subset of entries looking
 * signed.
 */
export function baseNaturalnessReviewInventoryForApproval(
  value: unknown,
): readonly BaseNaturalnessReviewEntry[] {
  const approval = readNaturalnessReviewApproval(value);
  const acceptedApproval = validateBaseNaturalnessReviewApproval(value).ok
    ? approval
    : null;
  return deepFreeze(
    REVIEW_SOURCES.map((source): BaseNaturalnessReviewEntry => {
      const common = {
        contentId: source.contentId,
        lessonId: source.lessonId,
        sourceId: source.sourceId,
        sourceKind: source.sourceKind,
        jp: source.jp,
        en: source.en,
        it: source.it,
        fingerprint: fingerprintFor(source),
      };
      return acceptedApproval
        ? {
            ...common,
            status: "accepted",
            reviewerIdentity: acceptedApproval.reviewerIdentity,
            reviewedAt: acceptedApproval.reviewedAt,
          }
        : { ...common, status: "pending" };
    }),
  );
}

export const BASE_NATURALNESS_REVIEW_INVENTORY: readonly BaseNaturalnessReviewEntry[] =
  baseNaturalnessReviewInventoryForApproval(BASE_NATURALNESS_REVIEW_APPROVAL);

export type BaseNaturalnessReviewError =
  | "invalid-inventory-shape"
  | "malformed-entry"
  | "duplicate-entry"
  | "missing-entry"
  | "stale-entry"
  | "stale-review-approval"
  | "stale-corpus-fingerprint";

export interface BaseNaturalnessReviewValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseNaturalnessReviewError[];
}

function densePlainArray(value: unknown): readonly unknown[] | null {
  if (!Array.isArray(value)) return null;
  try {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.getOwnPropertyNames(value).length !== value.length + 1) {
      return null;
    }
    const result: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        !descriptor ||
        !descriptor.enumerable ||
        !("value" in descriptor)
      ) {
        return null;
      }
      result.push(descriptor.value);
    }
    return result;
  } catch {
    return null;
  }
}

function plainEntry(
  value: unknown,
): Readonly<Record<string, unknown>> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (
      Object.getOwnPropertyNames(value).some((name) => {
        const descriptor = descriptors[name];
        return !descriptor || !descriptor.enumerable || !("value" in descriptor);
      })
    ) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(descriptors).map(([name, descriptor]) => [
        name,
        "value" in descriptor ? descriptor.value : undefined,
      ]),
    );
  } catch {
    return null;
  }
}

export function validateBaseNaturalnessReviewInventory(
  value: unknown,
): BaseNaturalnessReviewValidation {
  const values = densePlainArray(value);
  if (!values) {
    return { ok: false, errors: ["invalid-inventory-shape"] };
  }
  const errors = new Set<BaseNaturalnessReviewError>();
  const expected = new Map(
    BASE_NATURALNESS_REVIEW_INVENTORY.map((entry) => [entry.contentId, entry]),
  );
  const seen = new Set<string>();
  for (const value of values) {
    const entry = plainEntry(value);
    if (!entry || typeof entry.contentId !== "string") {
      errors.add("malformed-entry");
      continue;
    }
    if (seen.has(entry.contentId)) errors.add("duplicate-entry");
    seen.add(entry.contentId);
    const canonical = expected.get(entry.contentId);
    if (!canonical) {
      errors.add("stale-entry");
      continue;
    }
    const expectedKeys = Object.keys(canonical).sort();
    const actualKeys = Object.keys(entry).sort();
    if (
      actualKeys.length !== expectedKeys.length ||
      actualKeys.some((key, index) => key !== expectedKeys[index]) ||
      expectedKeys.some(
        (key) =>
          entry[key] !==
          (canonical as unknown as Readonly<Record<string, unknown>>)[key],
      )
    ) {
      errors.add("stale-entry");
    }
  }
  for (const contentId of expected.keys()) {
    if (!seen.has(contentId)) errors.add("missing-entry");
  }
  if (
    BASE_NATURALNESS_CURRENT_CORPUS_FINGERPRINT !==
    INVENTORIED_CORPUS_FINGERPRINT
  ) {
    errors.add("stale-corpus-fingerprint");
  }
  if (!BASE_NATURALNESS_REVIEW_APPROVAL_VALIDATION.ok) {
    errors.add("stale-review-approval");
  }
  return {
    ok: errors.size === 0,
    errors: [...errors],
  };
}

export const BASE_NATURALNESS_REVIEW_VALIDATION =
  validateBaseNaturalnessReviewInventory(
    BASE_NATURALNESS_REVIEW_INVENTORY,
  );
