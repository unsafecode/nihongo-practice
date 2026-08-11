import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { firstTeachLessonPosition } from "../catalog/firstTeach";
import {
  BASE_LEXEME_BY_ID,
  BASE_TASK11_LEXEME_RECURRENCE_PLANS,
  type BaseLexemeRecurrencePlan,
} from "../catalog/lexicon";
import type {
  BaseContentLessonContent,
  BaseExample,
  BaseInterpretationTag,
  BaseParticleFrame,
  BaseSystemLessonContent,
  BaseValidationCatalogs,
} from "../catalog/types";
import { realizePoliteGrid } from "../forms/verbForms";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import {
  BASE_CONTEXT_ACTIVITY_SHAPE,
  BASE_CONTROLLED_ACTIVITY_SHAPE,
  BASE_ERROR_ACTIVITY_SHAPE,
  BASE_FORM_ACTIVITY_SHAPE,
  BASE_LISTENING_ACTIVITY_SHAPE,
  BASE_MEANING_ACTIVITY_SHAPE,
  BASE_ORDERING_ACTIVITY_SHAPE,
  BASE_RETRIEVAL_ACTIVITY_SHAPE,
  BASE_SPOKEN_ACTIVITY_SHAPE,
  BASE_TRANSFORMATION_ACTIVITY_SHAPE,
  validatePublishedSemanticActivities,
  worldFactLedgerFor,
  type BaseSemanticActivityShape,
  type BaseWorldFactRecord,
} from "./module02SentenceFoundations";
import {
  TASK11_COMMA,
  BASE_POLITE_VERBS_MODULE,
  buildTask11Lesson,
  task11AnalysisLabel,
  task11Cue,
  task11Lexeme,
  task11Particle,
  task11PlainDataEqual,
  task11Target,
  task11ValidationCatalogs,
  task11VerbForm,
  validateTask11ModuleBase,
  validateTask11SemanticReview,
  type BaseTask11ActivitySpec,
  type BaseTask11ContrastAxis,
  type BaseTask11DialogueTurnSpec,
  type BaseTask11ExampleSpec,
  type BaseTask11Lesson,
  type BaseTask11LessonSpec,
  type BaseTask11ModuleError,
  type BaseTask11Part,
  type BaseTask11TargetSpec,
  type BaseTask11VerbFormKind,
} from "./module04PoliteVerbs";
import {
  BASE_ARGUMENT_PARTICLES_MODULE,
  BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
} from "./module05ArgumentParticles";

export interface BaseTimeMovementModule {
  readonly id: "time-movement";
  readonly lessons: readonly BaseTask11Lesson[];
  readonly sequence: readonly (
    | BaseSystemLessonContent
    | BaseContentLessonContent
  )[];
  readonly worldFacts: Readonly<{
    readonly learnerMondayGoal: "university";
    readonly learnerWakeTime: "seven";
    readonly tanakaStudyBounds: "nine-to-five";
    readonly meetingTonight: "cancelled";
    readonly meetingTomorrow: "scheduled";
  }>;
  readonly worldFactIds: readonly string[];
  readonly worldFactLedger: readonly BaseWorldFactRecord[];
}

const L = task11Lexeme;
const P = task11Particle;
const C = TASK11_COMMA;

function eventTarget(
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  parts: readonly BaseTask11Part[],
  patternCellId: string | null,
  tags: readonly BaseInterpretationTag[],
  semanticRoleIds: BaseTask11TargetSpec["semanticRoleIds"] = [],
  extraConceptIds: readonly string[] = [],
  particleFrame?: BaseParticleFrame,
): BaseTask11TargetSpec {
  return task11Target(
    [...parts, task11VerbForm(lemmaId, form)],
    {
      conceptIds: extraConceptIds,
      patternCellIds: patternCellId ? [patternCellId] : [],
      semanticRoleIds,
      interpretationTags: tags,
      predicateSenseId:
        particleFrame?.predicateSenseId ?? lemmaId.slice("verb-".length),
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      ...(particleFrame ? { particleFrame } : {}),
    },
  );
}

function eventWithSuffix(
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  prefix: readonly BaseTask11Part[],
  suffix: readonly BaseTask11Part[],
  patternCellId: string,
  tags: readonly BaseInterpretationTag[],
  semanticRoleIds: BaseTask11TargetSpec["semanticRoleIds"] = [],
  extraConceptIds: readonly string[] = [],
  particleFrame?: BaseParticleFrame,
): BaseTask11TargetSpec {
  const base = eventTarget(
    lemmaId,
    form,
    [],
    patternCellId,
    tags,
    semanticRoleIds,
    extraConceptIds,
    particleFrame,
  );
  return {
    ...base,
    parts: [
      ...prefix,
      task11VerbForm(lemmaId, form),
      ...suffix,
    ],
  };
}

function promptOf(target: BaseTask11TargetSpec): BaseTask11TargetSpec {
  return { ...target, patternCellIds: [] };
}

function ex(
  target: BaseTask11TargetSpec,
  frame: string,
  en: string,
  it: string,
  purposeEn: string,
  purposeIt: string,
  semanticTag: string,
): BaseTask11ExampleSpec {
  return {
    target,
    frame,
    utteranceKind: "complete-clause",
    en,
    it,
    purposeEn,
    purposeIt,
    semanticTag,
  };
}

function act(
  prompt: BaseTask11TargetSpec,
  answer: BaseTask11TargetSpec,
  distractor: BaseTask11TargetSpec,
  correctOptionIndex: 0 | 1,
  lessonId: string,
  index: number,
  patternCellId: string,
  shape: BaseSemanticActivityShape,
  referentId: string | null = null,
  worldFactId: string | null = null,
  errorCode: string | null = null,
  evidence: Readonly<{
    readonly contrastAxis?: BaseTask11ContrastAxis;
    readonly heldConstantPredicateLexemeId?: string | null;
    readonly optionAnalysisIds?: readonly string[];
    readonly errorDefectAxis?: string | null;
    readonly changedTokenSourceIds?: readonly string[];
  }> = {},
): BaseTask11ActivitySpec {
  return {
    prompt,
    answer,
    distractor,
    correctOptionIndex,
    promptContextCopyId: `${lessonId}-activity-${index}-instruction`,
    patternCellId,
    shape,
    referentId,
    worldFactId,
    errorCode,
    ...evidence,
  };
}

const HABITUAL = "tm1-habitual-nonpast";
const FUTURE = "tm1-future-nonpast";

function evidencedNonpast(
  lemmaId: string,
  patternCellId: typeof HABITUAL | typeof FUTURE,
  topicId?: string,
  habitualTimeId: "noun-maishuu" | "noun-fudan" = "noun-maishuu",
): BaseTask11TargetSpec {
  const timeId =
    patternCellId === HABITUAL ? habitualTimeId : "noun-ashita";
  return eventTarget(
    lemmaId,
    "polite-nonpast",
    [
      L(timeId),
      ...(topicId ? [L(topicId), P("topic-wa", "topic", topicId)] : []),
    ],
    patternCellId,
    [patternCellId === HABITUAL ? "habitual" : "future"],
    topicId ? ["time", "topic"] : ["time"],
    ["dynamic-nonpast-semantics", "habit-future-time-cues"],
  );
}

const L1: BaseTask11LessonSpec = {
  lessonId: "time-movement-1",
  contract: "system",
  prerequisiteLessonIds: ["argument-particles-4"],
  newLexemeIds: [
    "verb-hashiru",
    "verb-ryouri-suru",
    "verb-dekakeru",
    "noun-ashita",
    "noun-maishuu",
    "noun-fudan",
  ],
  reviewLexemeIds: [
    "verb-hataraku",
    "verb-benkyou-suru",
    "verb-yasumu",
    "verb-neru",
    "verb-aruku",
    "verb-iku",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
    "noun-yuki-san",
    "noun-tomodachi",
  ],
  introducedConceptIds: [
    "dynamic-nonpast-semantics",
    "habit-future-time-cues",
  ],
  reviewedConceptIds: ["masu-nonpast", "sentence-omission", "topic-wa"],
  patternCellIds: [HABITUAL, FUTURE],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(evidencedNonpast("verb-hashiru", HABITUAL, "noun-tanaka", "noun-fudan"), "tanaka-usually-runs", "Tanaka usually runs.", "Tanaka corre di solito.", "Uses ふだん as real habitual evidence.", "Usa ふだん come prova reale dell'abitudine.", "habitual"),
    ex(evidencedNonpast("verb-hataraku", FUTURE, "noun-satou"), "satou-works-tomorrow", "Satou will work tomorrow.", "Satou lavorerà domani.", "Uses あした as real future evidence.", "Usa あした come prova reale del futuro.", "future"),
    ex(evidencedNonpast("verb-ryouri-suru", HABITUAL, "noun-mari"), "mari-cooks", "Mari cooks every week.", "Mari cucina ogni settimana.", "Adds habitual evidence to a する compound.", "Aggiunge una prova abituale a un composto in する.", "habitual"),
    ex(evidencedNonpast("verb-dekakeru", FUTURE, "noun-yuki-san"), "yuki-goes-out", "Yuki will go out tomorrow.", "Yuki uscirà domani.", "Uses an authored future time without ongoing meaning.", "Usa un tempo futuro senza significato progressivo.", "future"),
    ex(evidencedNonpast("verb-aruku", FUTURE), "grounded-walk-plan", "I will walk tomorrow. (speaker recoverable)", "Camminerò domani. (parlante recuperabile)", "Shows future nonpast with natural omission.", "Mostra il futuro non-passato con omissione naturale.", "future"),
    ex(evidencedNonpast("verb-benkyou-suru", FUTURE), "grounded-study-plan", "We will study tomorrow. (group recoverable)", "Studieremo domani. (gruppo recuperabile)", "Keeps the planned group implicit.", "Mantiene implicito il gruppo del piano.", "future"),
    ex(evidencedNonpast("verb-ryouri-suru", HABITUAL, "noun-suzuki"), "suzuki-cooks-weekly", "Suzuki cooks every week.", "Suzuki cucina ogni settimana.", "Combines an explicit topic with weekly evidence.", "Combina un tema esplicito con la prova settimanale.", "habitual"),
    ex(evidencedNonpast("verb-dekakeru", HABITUAL, "noun-tomodachi"), "friend-goes-out", "My friend goes out every week.", "Il mio amico esce ogni settimana.", "Contrasts a recurring outing with tomorrow's plan.", "Contrappone un'uscita ricorrente al piano di domani.", "habitual"),
    ex(evidencedNonpast("verb-yasumu", HABITUAL, "noun-watashi"), "learner-rests", "I rest every week.", "Riposo ogni settimana.", "Reviews rest with overt recurring-time evidence.", "Ripassa riposare con una prova temporale ricorrente.", "habitual"),
    ex(evidencedNonpast("verb-neru", FUTURE, "noun-suzuki"), "suzuki-will-sleep", "Suzuki will sleep tomorrow.", "Suzuki dormirà domani.", "Uses a scheduled sleep event, never an ongoing reading.", "Usa un evento di sonno programmato, mai una lettura progressiva.", "future"),
  ],
  activities: [
    act(task11Cue(L("noun-watashi")), evidencedNonpast("verb-hashiru", HABITUAL, "noun-watashi", "noun-fudan"), evidencedNonpast("verb-hashiru", FUTURE, "noun-watashi"), 0, "time-movement-1", 1, HABITUAL, BASE_MEANING_ACTIVITY_SHAPE, "learner", "learner-runs"),
    act(task11Cue(L("noun-tanaka")), evidencedNonpast("verb-hataraku", FUTURE, "noun-tanaka"), evidencedNonpast("verb-hataraku", HABITUAL, "noun-tanaka"), 1, "time-movement-1", 2, FUTURE, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-yamada")), evidencedNonpast("verb-ryouri-suru", HABITUAL, "noun-yamada"), (() => { const target = evidencedNonpast("verb-ryouri-suru", HABITUAL, "noun-yamada"); return { ...target, parts: [task11VerbForm("verb-ryouri-suru", "polite-nonpast"), L("noun-maishuu"), L("noun-yamada"), P("topic-wa", "topic", "noun-yamada")] }; })(), 0, "time-movement-1", 3, HABITUAL, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-satou")), evidencedNonpast("verb-dekakeru", FUTURE, "noun-satou"), evidencedNonpast("verb-dekakeru", HABITUAL, "noun-satou"), 1, "time-movement-1", 4, FUTURE, BASE_CONTROLLED_ACTIVITY_SHAPE, "satou", "satou-goes-out"),
    act(task11Cue(L("noun-suzuki")), evidencedNonpast("verb-hashiru", HABITUAL, "noun-suzuki"), evidencedNonpast("verb-hashiru", FUTURE, "noun-suzuki"), 0, "time-movement-1", 5, HABITUAL, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(promptOf(evidencedNonpast("verb-dekakeru", HABITUAL, "noun-mari")), evidencedNonpast("verb-dekakeru", FUTURE, "noun-mari"), (() => { const target = evidencedNonpast("verb-dekakeru", HABITUAL, "noun-mari"); return { ...target, parts: [L("noun-mari"), P("topic-wa", "topic", "noun-mari"), L("noun-maishuu"), task11VerbForm("verb-dekakeru", "polite-nonpast")] }; })(), 1, "time-movement-1", 6, FUTURE, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-will-go-out", "dynamic-nonpast-interpretation-mismatch", { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-dekakeru", optionAnalysisIds: ["noun-ashita", "noun-maishuu"], errorDefectAxis: "interpretation", changedTokenSourceIds: ["noun-maishuu", "noun-ashita", "interpretation-tag"] }),
    act(task11Cue(L("noun-yuki-san")), evidencedNonpast("verb-yasumu", HABITUAL, "noun-yuki-san"), evidencedNonpast("verb-yasumu", FUTURE, "noun-yuki-san"), 0, "time-movement-1", 7, HABITUAL, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-tomodachi")), evidencedNonpast("verb-neru", FUTURE, "noun-tomodachi"), evidencedNonpast("verb-neru", HABITUAL, "noun-tomodachi"), 0, "time-movement-1", 8, FUTURE, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-yamada")), evidencedNonpast("verb-benkyou-suru", FUTURE, "noun-yamada"), evidencedNonpast("verb-benkyou-suru", HABITUAL, "noun-yamada"), 1, "time-movement-1", 9, FUTURE, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-suzuki"), C, L("noun-ashita")), evidencedNonpast("verb-dekakeru", FUTURE, "noun-suzuki"), evidencedNonpast("verb-ryouri-suru", HABITUAL, "noun-suzuki"), 1, "time-movement-1", 10, FUTURE, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const SPECIFIC_TIME = "tm2-specific-time-ni";
const RELATIVE_TIME = "tm2-relative-time-zero";
const TIME_BOUNDS = "tm2-time-bounds";
const MOVEMENT_BOUNDS = "tm2-movement-bounds";

function specificTime(
  timeId: string,
  lemmaId: string,
  patternCellId = SPECIFIC_TIME,
  topicId?: string,
  tag: "habitual" | "future" = "habitual",
): BaseTask11TargetSpec {
  return eventTarget(
    lemmaId,
    "polite-nonpast",
    [
      ...(topicId ? [L(topicId), P("topic-wa", "topic", topicId)] : []),
      L(timeId),
      P("time-ni", "time", timeId),
    ],
    patternCellId,
    [tag],
    topicId ? ["topic", "time"] : ["time"],
    ["time-ni"],
    {
      predicateSenseId: "action-time",
      provided: {
        time: "time-ni",
        ...(topicId ? { topic: "topic-wa" as const } : {}),
      },
      attachmentLexemeIdByRole: {
        time: timeId,
        ...(topicId ? { topic: topicId } : {}),
      },
    },
  );
}

function relativeTime(
  timeId: string,
  lemmaId: string,
  patternCellId = RELATIVE_TIME,
  tag: "habitual" | "future" = "future",
  topicId?: string,
): BaseTask11TargetSpec {
  return eventTarget(
    lemmaId,
    "polite-nonpast",
    [
      ...(topicId ? [L(topicId), P("topic-wa", "topic", topicId)] : []),
      L(timeId),
    ],
    patternCellId,
    [tag],
    topicId ? ["topic", "time"] : ["time"],
    ["relative-time-omission"],
  );
}

function bounds(
  startId: string | null,
  endId: string | null,
  lemmaId: string,
  kind: "time" | "movement",
  topicId?: string,
): BaseTask11TargetSpec {
  const hasStart = startId !== null;
  const hasEnd = endId !== null;
  const predicateSenseId =
    kind === "time"
      ? hasStart && hasEnd
        ? "time-bounds"
        : hasStart
          ? "time-source"
          : "time-limit"
      : hasStart && hasEnd
        ? "movement-bounds"
        : hasStart
          ? "movement-source"
          : "movement-limit";
  const provided = {
    ...(hasStart ? { source: "source-kara" as const } : {}),
    ...(hasEnd ? { limit: "limit-made" as const } : {}),
  };
  return eventTarget(
    lemmaId,
    "polite-nonpast",
    [
      ...(topicId ? [L(topicId), P("topic-wa", "topic", topicId)] : []),
      ...(startId ? [L(startId), P("source-kara", "source", startId)] : []),
      ...(endId ? [L(endId), P("limit-made", "limit", endId)] : []),
    ],
    kind === "time" ? TIME_BOUNDS : MOVEMENT_BOUNDS,
    ["future"],
    [
      ...(topicId ? (["topic"] as const) : []),
      ...(hasStart ? (["source"] as const) : []),
      ...(hasEnd ? (["limit"] as const) : []),
    ],
    [
      ...(hasStart ? ["source-kara"] : []),
      ...(hasEnd ? ["limit-made"] : []),
    ],
    {
      predicateSenseId,
      provided: {
        ...provided,
        ...(topicId ? { topic: "topic-wa" as const } : {}),
      },
      attachmentLexemeIdByRole: {
        ...(startId ? { source: startId } : {}),
        ...(endId ? { limit: endId } : {}),
        ...(topicId ? { topic: topicId } : {}),
      },
    },
  );
}

const L2: BaseTask11LessonSpec = {
  lessonId: "time-movement-2",
  contract: "system",
  prerequisiteLessonIds: ["time-movement-1"],
  newLexemeIds: [
    "noun-kyou",
    "noun-getsuyoubi",
    "noun-shichiji",
    "noun-kuji",
    "noun-goji",
    "verb-ryokou-suru",
  ],
  reviewLexemeIds: [
    "noun-eki",
    "noun-daigaku",
    "noun-byouin",
    "anchor-gakkou",
    "noun-ashita",
    "verb-okiru",
    "verb-hataraku",
    "verb-benkyou-suru",
    "verb-yasumu",
    "verb-iku",
    "verb-kaeru",
    "verb-hashiru",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
  ],
  introducedConceptIds: [
    "time-ni",
    "relative-time-omission",
    "source-kara",
    "limit-made",
  ],
  reviewedConceptIds: [
    "dynamic-nonpast-semantics",
    "habit-future-time-cues",
    "goal-ni",
    "direction-he",
  ],
  patternCellIds: [SPECIFIC_TIME, RELATIVE_TIME, TIME_BOUNDS, MOVEMENT_BOUNDS],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(specificTime("noun-shichiji", "verb-okiru"), "wake-at-seven", "I wake up at seven.", "Mi sveglio alle sette.", "Uses に with a specific clock time.", "Usa に con un'ora specifica.", "habitual"),
    ex(specificTime("noun-kuji", "verb-dekakeru", SPECIFIC_TIME, undefined, "future"), "leave-at-nine", "I will go out at nine.", "Uscirò alle nove.", "Links a specific time to a punctual departure.", "Collega un'ora specifica a una partenza puntuale.", "future"),
    ex(specificTime("noun-getsuyoubi", "verb-benkyou-suru", SPECIFIC_TIME, undefined, "future"), "study-monday", "I will study on Monday.", "Studierò lunedì.", "Uses に with a named scheduled day.", "Usa に con un giorno programmato.", "future"),
    ex(relativeTime("noun-kyou", "verb-yasumu", RELATIVE_TIME, "future"), "rest-today", "I will rest today.", "Oggi riposerò.", "Shows that relative きょう takes no obligatory に.", "Mostra che il relativo きょう non richiede に.", "future"),
    ex(relativeTime("noun-ashita", "verb-iku"), "go-tomorrow", "I will go tomorrow.", "Andrò domani.", "Omits に after the relative time あした.", "Omette に dopo il tempo relativo あした.", "future"),
    ex(bounds("noun-kuji", "noun-goji", "verb-hataraku", "time"), "nine-to-five", "I will work from nine until five.", "Lavorerò dalle nove alle cinque.", "Bounds work in time with から and まで.", "Delimita il lavoro nel tempo con から e まで.", "future"),
    ex(bounds("noun-eki", "noun-daigaku", "verb-ryokou-suru", "movement"), "station-to-university-travel", "I will travel from the station as far as the university.", "Viaggerò dalla stazione fino all'università.", "Uses only movement source and endpoint bounds.", "Usa soltanto i limiti di origine e arrivo del movimento.", "future"),
    ex(bounds("noun-shichiji", null, "verb-hataraku", "time"), "work-from-seven", "I will work from seven.", "Lavorerò dalle sette.", "Uses から as a bounded temporal start, not cause.", "Usa から come inizio temporale, non come causa.", "future"),
    ex(bounds(null, "noun-goji", "verb-benkyou-suru", "time"), "study-until-five", "I will study until five.", "Studierò fino alle cinque.", "Uses まで for a temporal limit.", "Usa まで per un limite temporale.", "future"),
    ex(bounds("noun-eki", null, "verb-kaeru", "movement"), "return-from-station", "I will return from the station.", "Tornerò dalla stazione.", "Uses から for a movement source.", "Usa から per l'origine del movimento.", "future"),
  ],
  activities: [
    act(task11Cue(L("noun-shichiji")), specificTime("noun-shichiji", "verb-okiru", SPECIFIC_TIME, "noun-watashi"), relativeTime("noun-kyou", "verb-okiru", RELATIVE_TIME, "future", "noun-watashi"), 1, "time-movement-2", 1, SPECIFIC_TIME, BASE_MEANING_ACTIVITY_SHAPE, "learner", "learner-wakes-seven"),
    act(task11Cue(L("noun-kyou")), relativeTime("noun-kyou", "verb-yasumu", RELATIVE_TIME, "future", "noun-tanaka"), specificTime("noun-getsuyoubi", "verb-yasumu", SPECIFIC_TIME, "noun-tanaka"), 1, "time-movement-2", 2, RELATIVE_TIME, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-getsuyoubi")), specificTime("noun-getsuyoubi", "verb-benkyou-suru", SPECIFIC_TIME, "noun-yamada", "future"), task11Target([task11VerbForm("verb-benkyou-suru", "polite-nonpast"), L("noun-yamada"), P("topic-wa", "topic", "noun-yamada"), L("noun-getsuyoubi"), P("time-ni", "time", "noun-getsuyoubi")], { conceptIds: ["time-ni"], patternCellIds: [SPECIFIC_TIME], semanticRoleIds: ["topic", "time"], interpretationTags: ["future"], predicateSenseId: "action-time", predicateLexemeId: "verb-benkyou-suru", predicateAspect: "dynamic", particleFrame: { predicateSenseId: "action-time", provided: { time: "time-ni", topic: "topic-wa" }, attachmentLexemeIdByRole: { time: "noun-getsuyoubi", topic: "noun-yamada" } } }), 0, "time-movement-2", 3, SPECIFIC_TIME, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-ashita")), relativeTime("noun-ashita", "verb-iku", RELATIVE_TIME, "future", "noun-satou"), specificTime("noun-kuji", "verb-iku", SPECIFIC_TIME, "noun-satou", "future"), 0, "time-movement-2", 4, RELATIVE_TIME, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kuji"), P("source-kara", "source", "noun-kuji"), L("noun-goji"), P("limit-made", "limit", "noun-goji")), bounds("noun-kuji", "noun-goji", "verb-benkyou-suru", "time", "noun-tanaka"), specificTime("noun-kuji", "verb-benkyou-suru", TIME_BOUNDS, "noun-tanaka", "future"), 0, "time-movement-2", 5, TIME_BOUNDS, BASE_CONTEXT_ACTIVITY_SHAPE, "tanaka", "tanaka-study-nine-to-five"),
    act(promptOf(bounds("noun-eki", null, "verb-ryokou-suru", "movement", "noun-mari")), bounds("noun-eki", "noun-daigaku", "verb-ryokou-suru", "movement", "noun-mari"), (() => { const target = bounds("noun-eki", null, "verb-ryokou-suru", "movement", "noun-mari"); return { ...target, parts: [...target.parts, C, task11AnalysisLabel("analysis-direction")] }; })(), 1, "time-movement-2", 6, MOVEMENT_BOUNDS, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-station-university", "movement-bound-incomplete"),
    act(task11Cue(L("noun-goji")), bounds(null, "noun-goji", "verb-benkyou-suru", "time", "noun-suzuki"), specificTime("noun-goji", "verb-benkyou-suru", SPECIFIC_TIME, "noun-suzuki", "future"), 0, "time-movement-2", 7, TIME_BOUNDS, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-eki")), bounds("noun-eki", null, "verb-kaeru", "movement", "noun-yamada"), relativeTime("noun-ashita", "verb-kaeru", RELATIVE_TIME, "future", "noun-yamada"), 1, "time-movement-2", 8, MOVEMENT_BOUNDS, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-ashita")), relativeTime("noun-ashita", "verb-iku", RELATIVE_TIME, "future", "noun-suzuki"), relativeTime("noun-kyou", "verb-iku", RELATIVE_TIME, "future", "noun-suzuki"), 0, "time-movement-2", 9, RELATIVE_TIME, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-daigaku")), bounds("noun-eki", "noun-daigaku", "verb-iku", "movement", "noun-satou"), bounds("noun-kuji", "noun-goji", "verb-hataraku", "time", "noun-satou"), 1, "time-movement-2", 10, MOVEMENT_BOUNDS, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const NONPAST_AFFIRMATIVE = "verb-polite-nonpast-affirmative";
const NONPAST_NEGATIVE = "verb-polite-nonpast-negative";
const PAST_AFFIRMATIVE = "verb-polite-past-affirmative";
const PAST_NEGATIVE = "verb-polite-past-negative";

function tenseTarget(
  timeId: string,
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  patternCellId:
    | typeof NONPAST_AFFIRMATIVE
    | typeof NONPAST_NEGATIVE
    | typeof PAST_AFFIRMATIVE
    | typeof PAST_NEGATIVE,
  tag: "habitual" | "future" | "past",
  topicId?: string,
): BaseTask11TargetSpec {
  const negative =
    patternCellId === NONPAST_NEGATIVE || patternCellId === PAST_NEGATIVE;
  return eventTarget(
    lemmaId,
    form,
    [
      ...(topicId ? [L(topicId), P("topic-wa", "topic", topicId)] : []),
      L(timeId),
    ],
    patternCellId,
    negative ? [tag, "negative"] : [tag],
    topicId ? ["topic", "time"] : ["time"],
    [
      "four-polite-tense-cells",
      "relative-time-omission",
      ...(tag === "habitual" || tag === "future"
        ? ["dynamic-nonpast-semantics"]
        : []),
    ],
  );
}

const KAKU_GRID = realizePoliteGrid("verb-kaku");
if (!KAKU_GRID.ok) {
  throw new Error("The canonical writing grid is unavailable.");
}

export const BASE_TIME_MOVEMENT_TENSE_CELLS: readonly Readonly<{
  readonly id: string;
  readonly tokens: readonly AssembledToken[];
}>[] = deepFreeze([
  { id: NONPAST_AFFIRMATIVE, tokens: KAKU_GRID.value.affirmative },
  { id: NONPAST_NEGATIVE, tokens: KAKU_GRID.value.negative },
  { id: PAST_AFFIRMATIVE, tokens: KAKU_GRID.value.pastAffirmative },
  { id: PAST_NEGATIVE, tokens: KAKU_GRID.value.pastNegative },
]);

const L3: BaseTask11LessonSpec = {
  lessonId: "time-movement-3",
  contract: "system",
  prerequisiteLessonIds: ["time-movement-2"],
  newLexemeIds: [
    "noun-kinou",
    "noun-senshuu",
    "noun-konshuu",
    "noun-raishuu",
    "verb-au",
    "verb-utau",
  ],
  reviewLexemeIds: [
    "noun-kyou",
    "noun-ashita",
    "verb-kaku",
    "verb-hataraku",
    "verb-benkyou-suru",
    "verb-yasumu",
    "verb-asobu",
    "verb-kau",
    "verb-ryokou-suru",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
  ],
  introducedConceptIds: ["four-polite-tense-cells"],
  reviewedConceptIds: [
    "dynamic-nonpast-semantics",
    "relative-time-omission",
    "masu-nonpast",
  ],
  patternCellIds: [
    NONPAST_AFFIRMATIVE,
    NONPAST_NEGATIVE,
    PAST_AFFIRMATIVE,
    PAST_NEGATIVE,
  ],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(tenseTarget("noun-konshuu", "verb-hataraku", "polite-nonpast", NONPAST_AFFIRMATIVE, "future"), "works-this-week", "I will work this week.", "Lavorerò questa settimana.", "Publishes the nonpast affirmative cell with a future reading.", "Presenta la cella non-passata affermativa con lettura futura.", "future"),
    ex(tenseTarget("noun-raishuu", "verb-ryokou-suru", "polite-nonpast", NONPAST_AFFIRMATIVE, "future"), "travels-next-week", "I will travel next week.", "Viaggerò la prossima settimana.", "Uses the same cell for a future plan.", "Usa la stessa cella per un piano futuro.", "future"),
    ex(tenseTarget("noun-konshuu", "verb-hataraku", "nonpast-negative", NONPAST_NEGATIVE, "future"), "not-work-this-week", "I will not work this week.", "Questa settimana non lavorerò.", "Contrasts the same work predicate with negative polarity.", "Contrappone lo stesso predicato lavorare con polarità negativa.", "future"),
    ex(tenseTarget("noun-raishuu", "verb-kau", "nonpast-negative", NONPAST_NEGATIVE, "future"), "not-buy-next-week", "I will not buy it next week.", "Non lo comprerò la prossima settimana.", "Uses ません for a future negative.", "Usa ません per un futuro negativo.", "future"),
    ex(tenseTarget("noun-kinou", "verb-hataraku", "past-affirmative", PAST_AFFIRMATIVE, "past"), "worked-yesterday", "I worked yesterday.", "Ieri ho lavorato.", "Publishes the ました past affirmative cell.", "Presenta la cella passata affermativa in ました.", "past"),
    ex(tenseTarget("noun-senshuu", "verb-benkyou-suru", "past-affirmative", PAST_AFFIRMATIVE, "past"), "studied-last-week", "I studied last week.", "La settimana scorsa ho studiato.", "Applies past affirmative to a する compound.", "Applica il passato affermativo a un composto in する.", "past"),
    ex(tenseTarget("noun-kinou", "verb-hataraku", "past-negative", PAST_NEGATIVE, "past"), "did-not-work-yesterday", "I did not work yesterday.", "Ieri non ho lavorato.", "Completes the same-verb grid with ませんでした.", "Completa la griglia dello stesso verbo con ませんでした.", "past"),
    ex(tenseTarget("noun-senshuu", "verb-asobu", "past-negative", PAST_NEGATIVE, "past"), "did-not-play-last-week", "I did not play last week.", "La settimana scorsa non ho giocato.", "Uses past negative with another godan predicate.", "Usa il passato negativo con un altro predicato godan.", "past"),
    ex(tenseTarget("noun-kinou", "verb-kaku", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-tanaka"), "tanaka-wrote-yesterday", "Tanaka wrote it yesterday.", "Tanaka lo ha scritto ieri.", "Combines an explicit topic with a recoverable theme.", "Combina un tema esplicito con un oggetto recuperabile.", "past"),
    ex(tenseTarget("noun-raishuu", "verb-benkyou-suru", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-yamada"), "yamada-will-not-study", "Yamada will not study next week.", "Yamada non studierà la prossima settimana.", "Completes the four-cell contrast in a grounded plan.", "Completa il contrasto delle quattro celle in un piano fondato.", "future"),
    ex(tenseTarget("noun-senshuu", "verb-utau", "past-negative", PAST_NEGATIVE, "past"), "did-not-sing-last-week", "I did not sing last week.", "La settimana scorsa non ho cantato.", "Applies the past-negative cell to the newly owned singing verb.", "Applica la cella passata negativa al nuovo verbo cantare.", "past"),
    ex(tenseTarget("noun-raishuu", "verb-au", "nonpast-negative", NONPAST_NEGATIVE, "future"), "will-not-meet-next-week", "I will not meet them next week.", "Non li incontrerò la prossima settimana.", "Applies future-negative ません to the newly owned meeting verb.", "Applica il futuro negativo in ません al nuovo verbo incontrare.", "future"),
  ],
  activities: [
    act(task11Cue(L("noun-konshuu")), tenseTarget("noun-konshuu", "verb-hataraku", "polite-nonpast", NONPAST_AFFIRMATIVE, "future", "noun-watashi"), tenseTarget("noun-konshuu", "verb-hataraku", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-watashi"), 0, "time-movement-3", 1, NONPAST_AFFIRMATIVE, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-raishuu")), tenseTarget("noun-raishuu", "verb-hataraku", "polite-nonpast", NONPAST_AFFIRMATIVE, "future", "noun-tanaka"), tenseTarget("noun-raishuu", "verb-hataraku", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-tanaka"), 0, "time-movement-3", 2, NONPAST_AFFIRMATIVE, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kinou")), tenseTarget("noun-kinou", "verb-hataraku", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-yamada"), task11Target([task11VerbForm("verb-hataraku", "past-affirmative"), L("noun-yamada"), P("topic-wa", "topic", "noun-yamada"), L("noun-kinou")], { conceptIds: ["four-polite-tense-cells", "relative-time-omission"], patternCellIds: [PAST_AFFIRMATIVE], semanticRoleIds: ["topic", "time"], interpretationTags: ["past"], predicateSenseId: "hataraku", predicateLexemeId: "verb-hataraku", predicateAspect: "dynamic" }), 0, "time-movement-3", 3, PAST_AFFIRMATIVE, BASE_ORDERING_ACTIVITY_SHAPE),
    act((() => { const target = eventTarget("verb-benkyou-suru", "polite-stem", [], null, ["metalinguistic"], [], []); return { ...target, parts: [task11VerbForm("verb-benkyou-suru", "polite-stem"), C, task11AnalysisLabel("analysis-stem")] }; })(), tenseTarget("noun-senshuu", "verb-benkyou-suru", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-satou"), tenseTarget("noun-senshuu", "verb-benkyou-suru", "past-negative", PAST_NEGATIVE, "past", "noun-satou"), 1, "time-movement-3", 4, PAST_AFFIRMATIVE, BASE_TRANSFORMATION_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kinou")), tenseTarget("noun-kinou", "verb-hataraku", "past-negative", PAST_NEGATIVE, "past", "noun-suzuki"), tenseTarget("noun-kinou", "verb-hataraku", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-suzuki"), 0, "time-movement-3", 5, PAST_NEGATIVE, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(promptOf(tenseTarget("noun-raishuu", "verb-kau", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-mari")), tenseTarget("noun-raishuu", "verb-kau", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-mari"), tenseTarget("noun-raishuu", "verb-kau", "polite-nonpast", NONPAST_AFFIRMATIVE, "future", "noun-mari"), 1, "time-movement-3", 6, NONPAST_NEGATIVE, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-will-not-buy", "time-form-mismatch"),
    act(task11Cue(L("noun-senshuu")), tenseTarget("noun-senshuu", "verb-utau", "past-negative", PAST_NEGATIVE, "past", "noun-tanaka"), tenseTarget("noun-senshuu", "verb-utau", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-tanaka"), 1, "time-movement-3", 7, PAST_NEGATIVE, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-konshuu")), tenseTarget("noun-konshuu", "verb-au", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-yamada"), tenseTarget("noun-raishuu", "verb-au", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-yamada"), 1, "time-movement-3", 8, NONPAST_NEGATIVE, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kinou")), tenseTarget("noun-kinou", "verb-kaku", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-satou"), tenseTarget("noun-kinou", "verb-kaku", "past-negative", PAST_NEGATIVE, "past", "noun-satou"), 0, "time-movement-3", 9, PAST_AFFIRMATIVE, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-suzuki"), C, L("noun-raishuu")), tenseTarget("noun-raishuu", "verb-benkyou-suru", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-suzuki"), tenseTarget("noun-senshuu", "verb-benkyou-suru", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-suzuki"), 1, "time-movement-3", 10, NONPAST_NEGATIVE, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const SCHEDULE = "tm4-schedule-integration";
const ROUTE = "tm4-movement-integration";

function scheduledObject(
  timeId: string,
  nounId: string,
  lemmaId: "verb-suru" | "verb-taberu" | "verb-miru",
  predicateSenseId: "do" | "eat" | "see",
  form: BaseTask11VerbFormKind = "polite-nonpast",
  tags: readonly BaseInterpretationTag[] = ["future"],
  topicId?: string,
): BaseTask11TargetSpec {
  return eventTarget(
    lemmaId,
    form,
    [
      ...(topicId ? [L(topicId), P("topic-wa", "topic", topicId)] : []),
      L(timeId),
      L(nounId),
      P("object-o", "theme", nounId),
    ],
    SCHEDULE,
    tags,
    topicId ? ["topic", "time", "theme"] : ["time", "theme"],
    ["predicate-led-particle-selection", "relative-time-omission"],
    {
      predicateSenseId,
      provided: {
        theme: "object-o",
        ...(topicId ? { topic: "topic-wa" as const } : {}),
      },
      attachmentLexemeIdByRole: {
        theme: nounId,
        ...(topicId ? { topic: topicId } : {}),
      },
    },
  );
}

function scheduleExample(
  timeId: string,
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  tags: readonly BaseInterpretationTag[],
): BaseTask11TargetSpec {
  return eventTarget(
    lemmaId,
    form,
    [L(timeId)],
    SCHEDULE,
    tags,
    ["time"],
    ["relative-time-omission", "four-polite-tense-cells"],
  );
}

function weeklyNightStudy(topicId: string): BaseTask11TargetSpec {
  return eventTarget(
    "verb-benkyou-suru",
    "polite-nonpast",
    [
      L(topicId),
      P("topic-wa", "topic", topicId),
      L("noun-maishuu"),
      L("noun-yoru"),
      P("time-ni", "time", "noun-yoru"),
    ],
    SCHEDULE,
    ["habitual"],
    ["topic", "time"],
    ["dynamic-nonpast-semantics", "relative-time-omission", "time-ni"],
    {
      predicateSenseId: "action-time",
      provided: { topic: "topic-wa", time: "time-ni" },
      attachmentLexemeIdByRole: {
        topic: topicId,
        time: "noun-yoru",
      },
    },
  );
}

const L4: BaseTask11LessonSpec = {
  lessonId: "time-movement-4",
  contract: "content",
  prerequisiteLessonIds: ["time-movement-3"],
  newLexemeIds: [
    "noun-kaigi",
    "noun-shigoto",
    "noun-hirugohan",
    "noun-yoru",
    "noun-kesa",
    "noun-konban",
    "noun-nichiyoubi",
    "noun-yotei",
  ],
  reviewLexemeIds: [
    "noun-shichiji",
    "noun-kuji",
    "noun-ashita",
    "noun-maishuu",
    "noun-getsuyoubi",
    "noun-eki",
    "noun-daigaku",
    "noun-densha",
    "verb-suru",
    "verb-taberu",
    "verb-miru",
    "verb-hataraku",
    "verb-benkyou-suru",
    "verb-yasumu",
    "verb-hashiru",
    "verb-aruku",
    "verb-dekakeru",
    "verb-ryouri-suru",
    "verb-iku",
    "expression-hai",
    "expression-iie",
    "expression-sou",
  ],
  introducedConceptIds: [],
  reviewedConceptIds: [
    "four-polite-tense-cells",
    "dynamic-nonpast-semantics",
    "time-ni",
    "relative-time-omission",
    "source-kara",
    "limit-made",
    "licensed-object-o",
    "goal-ni",
    "means-de",
  ],
  patternCellIds: [SCHEDULE, ROUTE],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(scheduleExample("noun-kesa", "verb-aruku", "past-affirmative", ["past"]), "walked-this-morning", "I walked this morning.", "Ho camminato stamattina.", "Uses a relative past-time expression without に.", "Usa un tempo passato relativo senza に.", "past"),
    ex(scheduledObject("noun-konban", "noun-kaigi", "verb-suru", "do"), "meeting-tonight", "I will have the meeting tonight.", "Terrò la riunione stasera.", "Combines a future relative time with a licensed theme.", "Combina un tempo futuro relativo con un tema ammesso.", "future"),
    ex(scheduledObject("noun-ashita", "noun-shigoto", "verb-suru", "do"), "work-tomorrow", "I will do the work tomorrow.", "Farò il lavoro domani.", "Keeps tomorrow free of obligatory に.", "Mantiene domani senza に obbligatorio.", "future"),
    ex(scheduledObject("noun-kyou", "noun-hirugohan", "verb-taberu", "eat"), "lunch-today", "I will eat lunch today.", "Oggi pranzerò.", "Uses the meal as the eating theme.", "Usa il pasto come tema di mangiare.", "future"),
    ex(weeklyNightStudy("noun-yamada"), "weekly-night-study", "Yamada studies at night every week.", "Yamada studia di sera ogni settimana.", "Combines weekly evidence with に on the night-time expression.", "Combina la prova settimanale con に sull'espressione serale.", "habitual"),
    ex(scheduleExample("noun-konban", "verb-ryouri-suru", "polite-nonpast", ["future"]), "cook-tonight", "I will cook tonight.", "Cucinerò stasera.", "Uses a future reading, never ongoing-now.", "Usa una lettura futura, mai progressiva.", "future"),
    ex(specificTime("noun-nichiyoubi", "verb-yasumu", SCHEDULE, undefined, "habitual"), "rest-sunday", "I rest on Sunday.", "La domenica riposo.", "Uses に with a named recurring day.", "Usa に con un giorno ricorrente nominato.", "habitual"),
    ex(scheduledObject("noun-ashita", "noun-yotei", "verb-miru", "see"), "check-plan", "I will check the schedule tomorrow.", "Controllerò il programma domani.", "Makes the schedule the licensed theme of checking.", "Rende il programma il tema ammesso di controllare.", "future"),
    ex(eventTarget("verb-iku", "polite-nonpast", [L("noun-konban"), L("noun-eki"), P("direction-he", "goal", "noun-eki")], ROUTE, ["future"], ["time", "goal"], ["relative-time-omission", "direction-he"], { predicateSenseId: "go-direction", provided: { goal: "direction-he" }, attachmentLexemeIdByRole: { goal: "noun-eki" } }), "station-tonight", "I will head toward the station tonight.", "Stasera mi dirigerò verso la stazione.", "Adds a coherent future movement item to the schedule.", "Aggiunge al programma un movimento futuro coerente.", "future"),
    ex(eventTarget("verb-suru", "nonpast-negative", [L("noun-konban"), L("noun-kaigi"), P("object-o", "theme", "noun-kaigi")], SCHEDULE, ["future", "negative"], ["time", "theme"], ["predicate-led-particle-selection", "relative-time-omission", "four-polite-tense-cells"], { predicateSenseId: "do", provided: { theme: "object-o" }, attachmentLexemeIdByRole: { theme: "noun-kaigi" } }), "no-meeting-tonight", "I will not have the meeting tonight.", "Non terrò la riunione stasera.", "Uses the nonpast negative for a cancelled future event.", "Usa il non-passato negativo per un evento futuro annullato.", "future"),
  ],
  activities: [
    act(task11Cue(L("noun-kesa")), eventTarget("verb-aruku", "past-affirmative", [L("noun-watashi"), P("topic-wa", "topic", "noun-watashi"), L("noun-kesa")], SCHEDULE, ["past"], ["topic", "time"], ["relative-time-omission", "four-polite-tense-cells"]), eventTarget("verb-aruku", "past-negative", [L("noun-watashi"), P("topic-wa", "topic", "noun-watashi"), L("noun-kesa")], SCHEDULE, ["past", "negative"], ["topic", "time"], ["relative-time-omission", "four-polite-tense-cells"]), 0, "time-movement-4", 1, SCHEDULE, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kaigi")), scheduledObject("noun-ashita", "noun-kaigi", "verb-suru", "do"), scheduledObject("noun-kyou", "noun-kaigi", "verb-suru", "do"), 1, "time-movement-4", 2, SCHEDULE, BASE_FORM_ACTIVITY_SHAPE, "meeting", "meeting-tomorrow"),
    act(task11Cue(L("noun-shigoto")), scheduledObject("noun-konban", "noun-shigoto", "verb-suru", "do"), task11Target([task11VerbForm("verb-suru", "polite-nonpast"), L("noun-konban"), L("noun-shigoto"), P("object-o", "theme", "noun-shigoto")], { conceptIds: ["predicate-led-particle-selection", "relative-time-omission"], patternCellIds: [SCHEDULE], semanticRoleIds: ["time", "theme"], interpretationTags: ["future"], predicateSenseId: "do", predicateLexemeId: "verb-suru", predicateAspect: "dynamic", particleFrame: { predicateSenseId: "do", provided: { theme: "object-o" }, attachmentLexemeIdByRole: { theme: "noun-shigoto" } } }), 1, "time-movement-4", 3, SCHEDULE, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-hirugohan")), scheduledObject("noun-ashita", "noun-hirugohan", "verb-taberu", "eat", "polite-nonpast", ["future"], "noun-yamada"), scheduledObject("noun-kyou", "noun-hirugohan", "verb-taberu", "eat", "polite-nonpast", ["future"], "noun-yamada"), 1, "time-movement-4", 4, SCHEDULE, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-maishuu"), C, L("noun-yoru")), weeklyNightStudy("noun-tanaka"), relativeTime("noun-kyou", "verb-benkyou-suru", SCHEDULE, "future", "noun-tanaka"), 0, "time-movement-4", 5, SCHEDULE, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(promptOf(eventTarget("verb-suru", "polite-nonpast", [L("noun-watashi"), P("topic-wa", "topic", "noun-watashi"), L("noun-konban"), L("noun-kaigi"), P("object-o", "theme", "noun-kaigi")], SCHEDULE, ["future"], ["topic", "time", "theme"], ["predicate-led-particle-selection", "relative-time-omission"], { predicateSenseId: "do", provided: { theme: "object-o", topic: "topic-wa" }, attachmentLexemeIdByRole: { theme: "noun-kaigi", topic: "noun-watashi" } })), eventTarget("verb-suru", "nonpast-negative", [L("noun-watashi"), P("topic-wa", "topic", "noun-watashi"), L("noun-konban"), L("noun-kaigi"), P("object-o", "theme", "noun-kaigi")], SCHEDULE, ["future", "negative"], ["topic", "time", "theme"], ["predicate-led-particle-selection", "relative-time-omission", "four-polite-tense-cells"], { predicateSenseId: "do", provided: { theme: "object-o", topic: "topic-wa" }, attachmentLexemeIdByRole: { theme: "noun-kaigi", topic: "noun-watashi" } }), (() => { const target = eventTarget("verb-suru", "polite-nonpast", [L("noun-watashi"), P("topic-wa", "topic", "noun-watashi"), L("noun-konban"), L("noun-kaigi"), P("object-o", "theme", "noun-kaigi")], SCHEDULE, ["future"], ["topic", "time", "theme"], ["predicate-led-particle-selection", "relative-time-omission"], { predicateSenseId: "do", provided: { theme: "object-o", topic: "topic-wa" }, attachmentLexemeIdByRole: { theme: "noun-kaigi", topic: "noun-watashi" } }); return { ...target, parts: [...target.parts, C, task11AnalysisLabel("analysis-future")] }; })(), 1, "time-movement-4", 6, SCHEDULE, BASE_ERROR_ACTIVITY_SHAPE, "meeting", "meeting-tonight-cancelled", "polarity-mismatch"),
    act(task11Cue(L("noun-nichiyoubi")), specificTime("noun-nichiyoubi", "verb-yasumu", SCHEDULE, "noun-tanaka", "habitual"), relativeTime("noun-konban", "verb-yasumu", SCHEDULE, "future", "noun-tanaka"), 0, "time-movement-4", 7, SCHEDULE, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-yotei")), eventTarget("verb-miru", "polite-nonpast", [L("noun-yamada"), P("topic-wa", "topic", "noun-yamada"), L("noun-konban"), L("noun-yotei"), P("object-o", "theme", "noun-yotei")], SCHEDULE, ["future"], ["topic", "time", "theme"], ["predicate-led-particle-selection", "relative-time-omission"], { predicateSenseId: "see", provided: { theme: "object-o", topic: "topic-wa" }, attachmentLexemeIdByRole: { theme: "noun-yotei", topic: "noun-yamada" } }), eventTarget("verb-miru", "polite-nonpast", [L("noun-yamada"), P("topic-wa", "topic", "noun-yamada"), L("noun-kyou"), L("noun-yotei"), P("object-o", "theme", "noun-yotei")], SCHEDULE, ["future"], ["topic", "time", "theme"], ["predicate-led-particle-selection", "relative-time-omission"], { predicateSenseId: "see", provided: { theme: "object-o", topic: "topic-wa" }, attachmentLexemeIdByRole: { theme: "noun-yotei", topic: "noun-yamada" } }), 0, "time-movement-4", 8, SCHEDULE, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-densha")), eventTarget("verb-iku", "polite-nonpast", [L("noun-tanaka"), P("topic-wa", "topic", "noun-tanaka"), L("noun-densha"), P("means-de", "means", "noun-densha")], ROUTE, ["future"], ["topic", "means"], ["means-de"], { predicateSenseId: "travel-means", provided: { means: "means-de", topic: "topic-wa" }, attachmentLexemeIdByRole: { means: "noun-densha", topic: "noun-tanaka" } }), eventTarget("verb-iku", "nonpast-negative", [L("noun-tanaka"), P("topic-wa", "topic", "noun-tanaka"), L("noun-densha"), P("means-de", "means", "noun-densha")], ROUTE, ["future", "negative"], ["topic", "means"], ["means-de", "four-polite-tense-cells"], { predicateSenseId: "travel-means", provided: { means: "means-de", topic: "topic-wa" }, attachmentLexemeIdByRole: { means: "noun-densha", topic: "noun-tanaka" } }), 0, "time-movement-4", 9, ROUTE, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-suzuki"), C, L("noun-konban")), eventTarget("verb-suru", "polite-nonpast", [L("noun-suzuki"), P("topic-wa", "topic", "noun-suzuki"), L("noun-konban"), L("noun-kaigi"), P("object-o", "theme", "noun-kaigi")], SCHEDULE, ["future"], ["topic", "time", "theme"], ["predicate-led-particle-selection", "relative-time-omission"], { predicateSenseId: "do", provided: { theme: "object-o", topic: "topic-wa" }, attachmentLexemeIdByRole: { theme: "noun-kaigi", topic: "noun-suzuki" } }), scheduleExample("noun-kesa", "verb-dekakeru", "past-affirmative", ["past"]), 1, "time-movement-4", 10, SCHEDULE, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: [
    {
      speakerId: "learner",
      target: eventWithSuffix(
        "verb-iku",
        "polite-nonpast",
        [
          L("noun-getsuyoubi"),
          P("time-ni", "time", "noun-getsuyoubi"),
          L("noun-daigaku"),
          P("goal-ni", "goal", "noun-daigaku"),
        ],
        [P("question-ka", "question", "verb-iku")],
        ROUTE,
        ["future"],
        ["time", "goal"],
        ["time-ni", "goal-ni"],
        {
          predicateSenseId: "go-time-goal",
          provided: {
            time: "time-ni",
            goal: "goal-ni",
            question: "question-ka",
          },
          attachmentLexemeIdByRole: {
            time: "noun-getsuyoubi",
            goal: "noun-daigaku",
            question: "verb-iku",
          },
        },
      ),
      frame: "ask-monday-goal",
      utteranceKind: "complete-clause",
      en: "Will you go to the university on Monday?",
      it: "Andrai all'università lunedì?",
      purposeEn: "Opens by combining a specific day and movement goal.",
      purposeIt: "Apre combinando un giorno specifico e una meta.",
    },
    {
      speakerId: "partner",
      target: eventTarget(
        "verb-iku",
        "polite-nonpast",
        [L("expression-hai"), C, L("noun-shichiji"), P("time-ni", "time", "noun-shichiji")],
        ROUTE,
        ["future"],
        ["time"],
        ["time-ni"],
        {
          predicateSenseId: "action-time",
          provided: { time: "time-ni" },
          attachmentLexemeIdByRole: { time: "noun-shichiji" },
        },
      ),
      frame: "confirm-seven-departure",
      utteranceKind: "complete-clause",
      en: "Yes, I will go at seven.",
      it: "Sì, andrò alle sette.",
      purposeEn: "Answers with the recoverable destination omitted.",
      purposeIt: "Risponde omettendo la destinazione recuperabile.",
    },
    {
      speakerId: "learner",
      target: eventWithSuffix(
        "verb-iku",
        "polite-nonpast",
        [
          L("noun-eki"),
          P("source-kara", "source", "noun-eki"),
          L("noun-daigaku"),
          P("limit-made", "limit", "noun-daigaku"),
        ],
        [P("question-ka", "question", "verb-iku")],
        ROUTE,
        ["future"],
        ["source", "limit"],
        ["source-kara", "limit-made"],
        {
          predicateSenseId: "movement-bounds",
          provided: {
            source: "source-kara",
            limit: "limit-made",
            question: "question-ka",
          },
          attachmentLexemeIdByRole: {
            source: "noun-eki",
            limit: "noun-daigaku",
            question: "verb-iku",
          },
        },
      ),
      frame: "ask-route-bounds",
      utteranceKind: "complete-clause",
      en: "Will you go from the station as far as the university?",
      it: "Andrai dalla stazione fino all'università?",
      purposeEn: "Checks the bounded route without adding another sense of から.",
      purposeIt: "Controlla il percorso delimitato senza altri sensi di から.",
    },
    {
      speakerId: "partner",
      target: eventTarget(
        "verb-iku",
        "polite-nonpast",
        [
          L("expression-hai"),
          C,
          L("noun-watashi"),
          P("topic-wa", "topic", "noun-watashi"),
          L("noun-densha"),
          P("means-de", "means", "noun-densha"),
        ],
        ROUTE,
        ["future"],
        ["topic", "means"],
        ["means-de"],
        {
          predicateSenseId: "travel-means",
          provided: { means: "means-de", topic: "topic-wa" },
          attachmentLexemeIdByRole: {
            means: "noun-densha",
            topic: "noun-watashi",
          },
        },
      ),
      frame: "confirm-train-means",
      utteranceKind: "complete-clause",
      en: "Yes, I will go by train.",
      it: "Sì, andrò in treno.",
      purposeEn: "Answers the route question with a coherent travel means.",
      purposeIt: "Risponde alla domanda sul percorso con un mezzo coerente.",
    },
    {
      speakerId: "learner",
      target: eventWithSuffix(
        "verb-suru",
        "polite-nonpast",
        [L("noun-konban"), L("noun-kaigi"), P("object-o", "theme", "noun-kaigi")],
        [P("question-ka", "question", "verb-suru")],
        SCHEDULE,
        ["future"],
        ["time", "theme"],
        ["relative-time-omission", "predicate-led-particle-selection"],
        {
          predicateSenseId: "do",
          provided: { theme: "object-o", question: "question-ka" },
          attachmentLexemeIdByRole: {
            theme: "noun-kaigi",
            question: "verb-suru",
          },
        },
      ),
      frame: "ask-evening-meeting",
      utteranceKind: "complete-clause",
      en: "Will you have the meeting tonight?",
      it: "Terrai la riunione stasera?",
      purposeEn: "Moves coherently from travel to the evening schedule.",
      purposeIt: "Passa in modo coerente dal viaggio al programma serale.",
    },
    {
      speakerId: "partner",
      target: eventTarget(
        "verb-suru",
        "polite-nonpast",
        [L("expression-iie"), C, L("noun-ashita")],
        SCHEDULE,
        ["future"],
        ["time"],
        ["relative-time-omission"],
      ),
      frame: "defer-meeting",
      utteranceKind: "complete-clause",
      en: "No, I will do it tomorrow.",
      it: "No, lo farò domani.",
      purposeEn: "Closes by postponing the recoverable meeting to tomorrow.",
      purposeIt: "Chiude rimandando a domani la riunione recuperabile.",
    },
  ] satisfies readonly BaseTask11DialogueTurnSpec[],
};

const TIME_SPECS = deepFreeze([L1, L2, L3, L4]);
const BUILT_TIME_LESSONS = TIME_SPECS.map(buildTask11Lesson);
const RAW_TIME_LESSONS = BUILT_TIME_LESSONS.map(({ lesson }) => lesson);

export const BASE_TIME_MOVEMENT_LESSONS: readonly (
  BaseSystemLessonContent | BaseContentLessonContent
)[] = deepFreeze(RAW_TIME_LESSONS.map(({ content }) => content));

export const BASE_TIME_MOVEMENT_EXAMPLES: readonly BaseExample[] = deepFreeze(
  RAW_TIME_LESSONS.flatMap(({ examples }) => examples),
);

export const BASE_TIME_MOVEMENT_VALIDATION_CATALOGS: BaseValidationCatalogs =
  task11ValidationCatalogs(
    BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
    BUILT_TIME_LESSONS,
  );

const RAW_TIME_MOVEMENT_MODULE: BaseTimeMovementModule = {
  id: "time-movement",
  lessons: RAW_TIME_LESSONS,
  sequence: [
    ...BASE_ARGUMENT_PARTICLES_MODULE.sequence,
    ...BASE_TIME_MOVEMENT_LESSONS,
  ],
  worldFacts: {
    learnerMondayGoal: "university",
    learnerWakeTime: "seven",
    tanakaStudyBounds: "nine-to-five",
    meetingTonight: "cancelled",
    meetingTomorrow: "scheduled",
  },
  worldFactIds: RAW_TIME_LESSONS.flatMap((lesson) =>
    lesson.activityDesigns.flatMap(({ worldFactId }) =>
      worldFactId ? [worldFactId] : [],
    ),
  ),
  worldFactLedger: worldFactLedgerFor(RAW_TIME_LESSONS),
};

export function validateTask11RecurrencePlans(
  lessons: readonly BaseTask11Lesson[],
  plans: readonly BaseLexemeRecurrencePlan[] =
    BASE_TASK11_LEXEME_RECURRENCE_PLANS,
): readonly string[] {
  const errors: string[] = [];
  const newLexemeIds = lessons.flatMap(({ content }) => content.newLexemeIds);
  const planById = new Map(plans.map((plan) => [plan.lexemeId, plan]));
  if (
    new Set(newLexemeIds).size !== newLexemeIds.length ||
    new Set(plans.map(({ lexemeId }) => lexemeId)).size !== plans.length ||
    plans.length !== newLexemeIds.length
  ) {
    errors.push("recurrence-plan-allocation");
  }
  for (const lexemeId of newLexemeIds) {
    const plan = planById.get(lexemeId);
    const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
    if (
      !plan ||
      !lexeme ||
      plan.plannedLessonIds.length +
        plan.plannedSynthesisLessonIds.length ===
        0
    ) {
      errors.push(`recurrence-plan-missing:${lexemeId}`);
      continue;
    }
    const ownerPosition = firstTeachLessonPosition(lexeme.firstTeachLessonId);
    for (const lessonId of plan.plannedLessonIds) {
      const lesson = lessons.find(({ content }) => content.lessonId === lessonId);
      const recurrencePosition = firstTeachLessonPosition(lessonId);
      const visible =
        lesson?.examples.some(({ lexemeIds }) => lexemeIds.includes(lexemeId)) ||
        lesson?.dialogue?.turns.some(({ lexemeIds }) =>
          lexemeIds.includes(lexemeId),
        ) ||
        lesson?.activityDesigns.some(
          ({ promptTarget, optionTargets, acceptedAnswerTarget }) =>
            promptTarget.lexemeIds.includes(lexemeId) ||
            optionTargets.some(({ lexemeIds }) =>
              lexemeIds.includes(lexemeId),
            ) ||
            acceptedAnswerTarget.lexemeIds.includes(lexemeId),
        );
      if (
        !lesson ||
        !visible ||
        ownerPosition === undefined ||
        recurrencePosition === undefined ||
        recurrencePosition <= ownerPosition
      ) {
        errors.push(`recurrence-plan-unrealized:${lexemeId}:${lessonId}`);
      }
    }
    for (const lessonId of plan.plannedSynthesisLessonIds) {
      const recurrencePosition = firstTeachLessonPosition(lessonId);
      if (
        !lessonId.startsWith("base-synthesis-") ||
        ownerPosition === undefined ||
        recurrencePosition === undefined ||
        recurrencePosition <= ownerPosition
      ) {
        errors.push(`recurrence-synthesis-invalid:${lexemeId}:${lessonId}`);
      }
    }
  }
  return deepFreeze(errors);
}

export function validateBaseTimeMovementModule(
  value: unknown,
): Readonly<{ readonly ok: boolean; readonly errors: readonly BaseTask11ModuleError[] }> {
  const base = validateTask11ModuleBase(
    value,
    "time-movement",
    TIME_SPECS.map(({ lessonId }) => lessonId),
    BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
  );
  if (!base.ok) return base;
  if (
    validateTask11RecurrencePlans(
      [
        ...BASE_POLITE_VERBS_MODULE.lessons,
        ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
        ...RAW_TIME_LESSONS,
      ],
      BASE_TASK11_LEXEME_RECURRENCE_PLANS,
    ).length > 0
  ) {
    return { ok: false, errors: ["invalid-module-shape"] };
  }
  const semanticErrors = validateTask11SemanticReview([
    ...BASE_POLITE_VERBS_MODULE.lessons,
    ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
    ...RAW_TIME_LESSONS,
  ]);
  if (semanticErrors.length > 0) {
    return {
      ok: false,
      errors: semanticErrors.some(
        ({ code }) => code === "instruction-answer-leakage",
      )
        ? ["invalid-copy"]
        : ["invalid-lesson-shape"],
    };
  }
  if (!task11PlainDataEqual(value, RAW_TIME_MOVEMENT_MODULE)) {
    return { ok: false, errors: ["invalid-module-shape"] };
  }
  const forbidden = RAW_TIME_LESSONS.some((lesson) =>
    [
      ...lesson.examples,
      ...(lesson.dialogue?.turns ?? []),
      ...lesson.activityDesigns.flatMap(
        ({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
          promptTarget,
          ...optionTargets,
          acceptedAnswerTarget,
        ],
      ),
    ].some(
      (target) =>
        target.formIds.includes("te-imasu") ||
        target.interpretationTags.includes("ongoing-now"),
    ),
  );
  return forbidden
    ? { ok: false, errors: ["invalid-lesson-shape"] }
    : base;
}

export const module06ConceptIds = deepFreeze(
  TIME_SPECS.flatMap(({ introducedConceptIds }) => introducedConceptIds),
);

const validation = validateBaseTimeMovementModule(RAW_TIME_MOVEMENT_MODULE);
if (!validation.ok) {
  const details = BASE_TIME_MOVEMENT_LESSONS.flatMap((lesson) =>
    validateBaseLessonDepth(lesson, BASE_TIME_MOVEMENT_VALIDATION_CATALOGS),
  );
  const publication = RAW_TIME_LESSONS.flatMap((lesson) =>
    validatePublishedSemanticActivities(lesson)
      ? []
      : [lesson.content.lessonId],
  );
  throw new Error(
    `Invalid Base time-movement module: ${validation.errors.join(", ")} ${JSON.stringify(details)} ${JSON.stringify(publication)} ${JSON.stringify(validateTask11SemanticReview([...BASE_POLITE_VERBS_MODULE.lessons, ...BASE_ARGUMENT_PARTICLES_MODULE.lessons, ...RAW_TIME_LESSONS]))}`,
  );
}

export const BASE_TIME_MOVEMENT_MODULE: BaseTimeMovementModule = deepFreeze(
  RAW_TIME_MOVEMENT_MODULE,
);
