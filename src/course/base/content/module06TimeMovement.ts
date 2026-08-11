import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
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
  buildTask11Lesson,
  task11Cue,
  task11Lexeme,
  task11Particle,
  task11PlainDataEqual,
  task11Target,
  task11ValidationCatalogs,
  task11VerbForm,
  validateTask11ModuleBase,
  type BaseTask11ActivitySpec,
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
    readonly tanakaWorkBounds: "nine-to-five";
    readonly meetingPlan: "tonight";
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
  };
}

const TOPIC = (id: string): readonly BaseTask11Part[] => [L(id), P("topic-wa")];
const HABITUAL = "tm1-habitual-nonpast";
const FUTURE = "tm1-future-nonpast";

function semanticNonpast(
  lemmaId: string,
  patternCellId: typeof HABITUAL | typeof FUTURE,
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  return eventTarget(
    lemmaId,
    "polite-nonpast",
    prefix,
    patternCellId,
    [patternCellId === HABITUAL ? "habitual" : "future"],
    prefix.some(
      (part) =>
        part.kind === "particle" &&
        (part.sense === "topic-wa" || part.sense === "additive-mo"),
    )
      ? ["topic"]
      : [],
    ["dynamic-nonpast-semantics"],
  );
}

const L1: BaseTask11LessonSpec = {
  lessonId: "time-movement-1",
  contract: "system",
  prerequisiteLessonIds: ["argument-particles-4"],
  newLexemeIds: [
    "verb-hashiru",
    "verb-ryokou-suru",
    "verb-ryouri-suru",
    "verb-dekakeru",
  ],
  reviewLexemeIds: [
    "verb-hataraku",
    "verb-benkyou-suru",
    "verb-yasumu",
    "verb-aruku",
    "verb-utau",
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
  introducedConceptIds: ["dynamic-nonpast-semantics"],
  reviewedConceptIds: ["masu-nonpast", "sentence-omission", "topic-wa"],
  patternCellIds: [HABITUAL, FUTURE],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(semanticNonpast("verb-hashiru", HABITUAL, TOPIC("noun-watashi")), "learner-runs", "I run regularly.", "Corro regolarmente.", "Makes the habitual reading explicit in context.", "Rende esplicita nel contesto la lettura abituale.", "habitual"),
    ex(semanticNonpast("verb-ryokou-suru", FUTURE, TOPIC("noun-tanaka")), "tanaka-travels", "Tanaka will travel.", "Tanaka viaggerà.", "Uses dynamic nonpast for a future plan.", "Usa il non-passato dinamico per un piano futuro.", "future"),
    ex(semanticNonpast("verb-ryouri-suru", HABITUAL, TOPIC("noun-yamada")), "yamada-cooks", "Yamada cooks regularly.", "Yamada cucina regolarmente.", "Adds a habitual する compound.", "Aggiunge un composto in する abituale.", "habitual"),
    ex(semanticNonpast("verb-dekakeru", FUTURE, TOPIC("noun-satou")), "satou-goes-out", "Satou will go out.", "Satou uscirà.", "Uses an authored future context without ongoing meaning.", "Usa un contesto futuro senza significato progressivo.", "future"),
    ex(semanticNonpast("verb-hashiru", FUTURE), "grounded-run-plan", "I will run. (speaker recoverable)", "Correrò. (parlante recuperabile)", "Shows future nonpast with natural omission.", "Mostra il futuro non-passato con omissione naturale.", "future"),
    ex(semanticNonpast("verb-ryokou-suru", FUTURE), "grounded-travel-plan", "We will travel. (group recoverable)", "Viaggeremo. (gruppo recuperabile)", "Keeps the planned group implicit.", "Mantiene implicito il gruppo del piano.", "future"),
    ex(semanticNonpast("verb-ryouri-suru", HABITUAL, [L("noun-suzuki"), P("additive-mo")]), "suzuki-also-cooks", "Suzuki cooks too.", "Anche Suzuki cucina.", "Combines an owned additive topic with habitual nonpast.", "Combina un tema additivo noto con il non-passato abituale.", "habitual"),
    ex(semanticNonpast("verb-dekakeru", HABITUAL, TOPIC("noun-mari")), "mari-goes-out", "Mari goes out regularly.", "Mari esce regolarmente.", "Contrasts a routine with the earlier plan.", "Contrappone una routine al piano precedente.", "habitual"),
    ex(semanticNonpast("verb-hataraku", HABITUAL, TOPIC("noun-yuki-san")), "yuki-works", "Yuki works regularly.", "Yuki lavora regolarmente.", "Reviews an earlier predicate under the new semantic distinction.", "Ripassa un predicato precedente con la nuova distinzione.", "habitual"),
    ex(semanticNonpast("verb-benkyou-suru", FUTURE, TOPIC("noun-tomodachi")), "friend-will-study", "My friend will study.", "Il mio amico studierà.", "Requires future rather than ongoing-now.", "Richiede il futuro, non un'azione in corso.", "future"),
  ],
  activities: [
    act(task11Cue(L("noun-watashi")), semanticNonpast("verb-hashiru", HABITUAL, [L("noun-watashi"), P("additive-mo")]), semanticNonpast("verb-ryokou-suru", FUTURE, TOPIC("noun-watashi")), 0, "time-movement-1", 1, HABITUAL, BASE_MEANING_ACTIVITY_SHAPE, "learner", "learner-runs"),
    act(task11Cue(L("noun-tanaka")), semanticNonpast("verb-ryokou-suru", FUTURE, [L("noun-tanaka"), P("additive-mo")]), semanticNonpast("verb-hataraku", HABITUAL, [L("noun-tanaka"), P("additive-mo")]), 1, "time-movement-1", 2, FUTURE, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-yamada"), L("verb-ryouri-suru")), semanticNonpast("verb-ryouri-suru", HABITUAL, [L("noun-yamada"), P("additive-mo")]), task11Target([task11VerbForm("verb-ryouri-suru", "polite-nonpast"), P("additive-mo"), L("noun-yamada")], { conceptIds: ["dynamic-nonpast-semantics"], patternCellIds: [HABITUAL], semanticRoleIds: ["topic"], interpretationTags: ["habitual"], predicateSenseId: "ryouri-suru", predicateLexemeId: "verb-ryouri-suru", predicateAspect: "dynamic" }), 0, "time-movement-1", 3, HABITUAL, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-satou")), semanticNonpast("verb-dekakeru", FUTURE, [L("noun-satou"), P("additive-mo")]), semanticNonpast("verb-aruku", HABITUAL, TOPIC("noun-satou")), 1, "time-movement-1", 4, FUTURE, BASE_CONTROLLED_ACTIVITY_SHAPE, "satou", "satou-goes-out"),
    act(task11Cue(L("noun-suzuki")), semanticNonpast("verb-hashiru", HABITUAL, TOPIC("noun-suzuki")), semanticNonpast("verb-ryokou-suru", FUTURE, TOPIC("noun-suzuki")), 0, "time-movement-1", 5, HABITUAL, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(promptOf(semanticNonpast("verb-hashiru", HABITUAL, TOPIC("noun-mari"))), semanticNonpast("verb-dekakeru", FUTURE, [L("noun-mari"), P("additive-mo")]), semanticNonpast("verb-hashiru", HABITUAL, [L("noun-mari"), P("additive-mo")]), 1, "time-movement-1", 6, FUTURE, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-will-go-out", "time-reading-mismatch"),
    act(task11Cue(L("noun-yuki-san")), semanticNonpast("verb-hataraku", HABITUAL, [L("noun-yuki-san"), P("additive-mo")]), semanticNonpast("verb-utau", FUTURE, TOPIC("noun-yuki-san")), 0, "time-movement-1", 7, HABITUAL, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-tomodachi")), semanticNonpast("verb-benkyou-suru", FUTURE, [L("noun-tomodachi"), P("additive-mo")]), semanticNonpast("verb-aruku", HABITUAL, [L("noun-tomodachi"), P("additive-mo")]), 0, "time-movement-1", 8, FUTURE, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-yamada")), semanticNonpast("verb-ryokou-suru", FUTURE, TOPIC("noun-yamada")), semanticNonpast("verb-hashiru", HABITUAL, TOPIC("noun-yamada")), 1, "time-movement-1", 9, FUTURE, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-suzuki")), semanticNonpast("verb-dekakeru", FUTURE, TOPIC("noun-suzuki")), semanticNonpast("verb-ryouri-suru", HABITUAL, TOPIC("noun-suzuki")), 1, "time-movement-1", 10, FUTURE, BASE_SPOKEN_ACTIVITY_SHAPE),
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
      ...(topicId ? [L(topicId), P("topic-wa")] : []),
      L(timeId),
      P("time-ni"),
    ],
    patternCellId,
    [tag],
    topicId ? ["topic", "time"] : ["time"],
    ["time-ni"],
    { predicateSenseId: "action-time", provided: { time: "time-ni" } },
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
      ...(topicId ? [L(topicId), P("topic-wa")] : []),
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
      ...(topicId ? [L(topicId), P("topic-wa")] : []),
      ...(startId ? [L(startId), P("source-kara")] : []),
      ...(endId ? [L(endId), P("limit-made")] : []),
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
    { predicateSenseId, provided },
  );
}

const L2: BaseTask11LessonSpec = {
  lessonId: "time-movement-2",
  contract: "system",
  prerequisiteLessonIds: ["time-movement-1"],
  newLexemeIds: [
    "noun-kyou",
    "noun-ashita",
    "noun-getsuyoubi",
    "noun-shichiji",
    "noun-kuji",
    "noun-goji",
  ],
  reviewLexemeIds: [
    "noun-eki",
    "noun-daigaku",
    "noun-byouin",
    "anchor-gakkou",
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
    ex(specificTime("noun-kuji", "verb-hataraku"), "work-at-nine", "I work at nine.", "Lavoro alle nove.", "Links a specific time to a work event.", "Collega un'ora specifica a un evento di lavoro.", "habitual"),
    ex(specificTime("noun-getsuyoubi", "verb-benkyou-suru", SPECIFIC_TIME, undefined, "future"), "study-monday", "I will study on Monday.", "Studierò lunedì.", "Uses に with a named scheduled day.", "Usa に con un giorno programmato.", "future"),
    ex(relativeTime("noun-kyou", "verb-yasumu", RELATIVE_TIME, "future"), "rest-today", "I will rest today.", "Oggi riposerò.", "Shows that relative きょう takes no obligatory に.", "Mostra che il relativo きょう non richiede に.", "future"),
    ex(relativeTime("noun-ashita", "verb-iku"), "go-tomorrow", "I will go tomorrow.", "Andrò domani.", "Omits に after the relative time あした.", "Omette に dopo il tempo relativo あした.", "future"),
    ex(bounds("noun-kuji", "noun-goji", "verb-hataraku", "time"), "nine-to-five", "I will work from nine until five.", "Lavorerò dalle nove alle cinque.", "Bounds work in time with から and まで.", "Delimita il lavoro nel tempo con から e まで.", "future"),
    ex(bounds("noun-eki", "noun-daigaku", "verb-iku", "movement"), "station-to-university", "I will go from the station as far as the university.", "Andrò dalla stazione fino all'università.", "Uses only movement source and endpoint bounds.", "Usa soltanto i limiti di origine e arrivo del movimento.", "future"),
    ex(bounds("noun-shichiji", null, "verb-hataraku", "time"), "work-from-seven", "I will work from seven.", "Lavorerò dalle sette.", "Uses から as a bounded temporal start, not cause.", "Usa から come inizio temporale, non come causa.", "future"),
    ex(bounds(null, "noun-goji", "verb-benkyou-suru", "time"), "study-until-five", "I will study until five.", "Studierò fino alle cinque.", "Uses まで for a temporal limit.", "Usa まで per un limite temporale.", "future"),
    ex(bounds("noun-eki", null, "verb-kaeru", "movement"), "return-from-station", "I will return from the station.", "Tornerò dalla stazione.", "Uses から for a movement source.", "Usa から per l'origine del movimento.", "future"),
  ],
  activities: [
    act(task11Cue(L("noun-shichiji")), specificTime("noun-shichiji", "verb-okiru", SPECIFIC_TIME, "noun-watashi"), relativeTime("noun-kyou", "verb-okiru", RELATIVE_TIME, "habitual", "noun-watashi"), 1, "time-movement-2", 1, SPECIFIC_TIME, BASE_MEANING_ACTIVITY_SHAPE, "learner", "learner-wakes-seven"),
    act(task11Cue(L("noun-kyou")), relativeTime("noun-kyou", "verb-yasumu", RELATIVE_TIME, "future", "noun-tanaka"), specificTime("noun-kuji", "verb-yasumu", SPECIFIC_TIME, "noun-tanaka"), 1, "time-movement-2", 2, RELATIVE_TIME, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-getsuyoubi"), L("verb-benkyou-suru")), specificTime("noun-getsuyoubi", "verb-benkyou-suru", SPECIFIC_TIME, "noun-yamada", "future"), task11Target([L("noun-yamada"), P("topic-wa"), P("time-ni"), L("noun-getsuyoubi"), task11VerbForm("verb-benkyou-suru", "polite-nonpast")], { conceptIds: ["time-ni"], patternCellIds: [SPECIFIC_TIME], semanticRoleIds: ["topic", "time"], interpretationTags: ["future"], predicateSenseId: "action-time", predicateLexemeId: "verb-benkyou-suru", predicateAspect: "dynamic", particleFrame: { predicateSenseId: "action-time", provided: { time: "time-ni" } } }), 0, "time-movement-2", 3, SPECIFIC_TIME, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-ashita")), relativeTime("noun-ashita", "verb-iku", RELATIVE_TIME, "future", "noun-satou"), specificTime("noun-kuji", "verb-iku", SPECIFIC_TIME, "noun-satou", "future"), 0, "time-movement-2", 4, RELATIVE_TIME, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kuji"), L("noun-goji")), bounds("noun-kuji", "noun-goji", "verb-hataraku", "time", "noun-tanaka"), bounds("noun-eki", "noun-daigaku", "verb-iku", "movement", "noun-tanaka"), 0, "time-movement-2", 5, TIME_BOUNDS, BASE_CONTEXT_ACTIVITY_SHAPE, "tanaka", "tanaka-nine-to-five"),
    act(promptOf(bounds("noun-eki", null, "verb-hataraku", "time", "noun-mari")), bounds("noun-eki", "noun-daigaku", "verb-iku", "movement", "noun-mari"), bounds("noun-shichiji", "noun-goji", "verb-hataraku", "time", "noun-mari"), 1, "time-movement-2", 6, MOVEMENT_BOUNDS, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-station-university", "bound-type-mismatch"),
    act(task11Cue(L("noun-goji")), bounds(null, "noun-goji", "verb-benkyou-suru", "time", "noun-suzuki"), specificTime("noun-goji", "verb-benkyou-suru", SPECIFIC_TIME, "noun-suzuki", "future"), 0, "time-movement-2", 7, TIME_BOUNDS, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-eki")), bounds("noun-eki", null, "verb-kaeru", "movement", "noun-yamada"), relativeTime("noun-ashita", "verb-kaeru", RELATIVE_TIME, "future", "noun-yamada"), 1, "time-movement-2", 8, MOVEMENT_BOUNDS, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-ashita")), relativeTime("noun-ashita", "verb-iku", RELATIVE_TIME, "future", "noun-suzuki"), relativeTime("noun-ashita", "verb-kaeru", RELATIVE_TIME, "future", "noun-suzuki"), 0, "time-movement-2", 9, RELATIVE_TIME, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-daigaku")), bounds("noun-eki", "noun-daigaku", "verb-iku", "movement", "noun-satou"), bounds("noun-kuji", "noun-goji", "verb-hataraku", "time", "noun-satou"), 1, "time-movement-2", 10, MOVEMENT_BOUNDS, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const NONPAST_AFFIRMATIVE = "tm3-nonpast-affirmative";
const NONPAST_NEGATIVE = "tm3-nonpast-negative";
const PAST_AFFIRMATIVE = "tm3-past-affirmative";
const PAST_NEGATIVE = "tm3-past-negative";

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
      ...(topicId ? [L(topicId), P("topic-wa")] : []),
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
    ex(tenseTarget("noun-konshuu", "verb-yasumu", "nonpast-negative", NONPAST_NEGATIVE, "future"), "not-rest-this-week", "I will not rest this week.", "Questa settimana non riposerò.", "Adds negative polarity without an ongoing reading.", "Aggiunge polarità negativa senza lettura progressiva.", "future"),
    ex(tenseTarget("noun-raishuu", "verb-kau", "nonpast-negative", NONPAST_NEGATIVE, "future"), "not-buy-next-week", "I will not buy it next week.", "Non lo comprerò la prossima settimana.", "Uses ません for a future negative.", "Usa ません per un futuro negativo.", "future"),
    ex(tenseTarget("noun-kinou", "verb-hataraku", "past-affirmative", PAST_AFFIRMATIVE, "past"), "worked-yesterday", "I worked yesterday.", "Ieri ho lavorato.", "Publishes the ました past affirmative cell.", "Presenta la cella passata affermativa in ました.", "past"),
    ex(tenseTarget("noun-senshuu", "verb-benkyou-suru", "past-affirmative", PAST_AFFIRMATIVE, "past"), "studied-last-week", "I studied last week.", "La settimana scorsa ho studiato.", "Applies past affirmative to a する compound.", "Applica il passato affermativo a un composto in する.", "past"),
    ex(tenseTarget("noun-kinou", "verb-yasumu", "past-negative", PAST_NEGATIVE, "past"), "did-not-rest-yesterday", "I did not rest yesterday.", "Ieri non ho riposato.", "Publishes the complete ませんでした cell.", "Presenta la cella completa ませんでした.", "past"),
    ex(tenseTarget("noun-senshuu", "verb-asobu", "past-negative", PAST_NEGATIVE, "past"), "did-not-play-last-week", "I did not play last week.", "La settimana scorsa non ho giocato.", "Uses past negative with another godan predicate.", "Usa il passato negativo con un altro predicato godan.", "past"),
    ex(tenseTarget("noun-kinou", "verb-kaku", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-tanaka"), "tanaka-wrote-yesterday", "Tanaka wrote it yesterday.", "Tanaka lo ha scritto ieri.", "Combines an explicit topic with a recoverable theme.", "Combina un tema esplicito con un oggetto recuperabile.", "past"),
    ex(tenseTarget("noun-raishuu", "verb-benkyou-suru", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-yamada"), "yamada-will-not-study", "Yamada will not study next week.", "Yamada non studierà la prossima settimana.", "Completes the four-cell contrast in a grounded plan.", "Completa il contrasto delle quattro celle in un piano fondato.", "future"),
  ],
  activities: [
    act(task11Cue(L("noun-konshuu")), tenseTarget("noun-konshuu", "verb-hataraku", "polite-nonpast", NONPAST_AFFIRMATIVE, "future", "noun-watashi"), tenseTarget("noun-konshuu", "verb-yasumu", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-watashi"), 0, "time-movement-3", 1, NONPAST_AFFIRMATIVE, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-raishuu")), tenseTarget("noun-raishuu", "verb-ryokou-suru", "polite-nonpast", NONPAST_AFFIRMATIVE, "future", "noun-tanaka"), tenseTarget("noun-raishuu", "verb-kau", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-tanaka"), 0, "time-movement-3", 2, NONPAST_AFFIRMATIVE, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kinou"), L("verb-hataraku")), tenseTarget("noun-kinou", "verb-hataraku", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-yamada"), task11Target([L("noun-yamada"), P("topic-wa"), task11VerbForm("verb-hataraku", "past-affirmative"), L("noun-kinou")], { conceptIds: ["four-polite-tense-cells", "relative-time-omission"], patternCellIds: [PAST_AFFIRMATIVE], semanticRoleIds: ["topic", "time"], interpretationTags: ["past"], predicateSenseId: "hataraku", predicateLexemeId: "verb-hataraku", predicateAspect: "dynamic" }), 0, "time-movement-3", 3, PAST_AFFIRMATIVE, BASE_ORDERING_ACTIVITY_SHAPE),
    act(eventTarget("verb-benkyou-suru", "polite-stem", [L("noun-senshuu")], null, ["metalinguistic"], ["time"], ["relative-time-omission"]), tenseTarget("noun-senshuu", "verb-benkyou-suru", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-satou"), tenseTarget("noun-senshuu", "verb-asobu", "past-negative", PAST_NEGATIVE, "past", "noun-satou"), 1, "time-movement-3", 4, PAST_AFFIRMATIVE, BASE_TRANSFORMATION_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kinou")), tenseTarget("noun-kinou", "verb-yasumu", "past-negative", PAST_NEGATIVE, "past", "noun-suzuki"), tenseTarget("noun-kinou", "verb-hataraku", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-suzuki"), 0, "time-movement-3", 5, PAST_NEGATIVE, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(promptOf(tenseTarget("noun-raishuu", "verb-kau", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-mari")), tenseTarget("noun-raishuu", "verb-kau", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-mari"), tenseTarget("noun-raishuu", "verb-ryokou-suru", "polite-nonpast", NONPAST_AFFIRMATIVE, "future", "noun-mari"), 1, "time-movement-3", 6, NONPAST_NEGATIVE, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-will-not-buy", "time-form-mismatch"),
    act(task11Cue(L("noun-senshuu")), tenseTarget("noun-senshuu", "verb-asobu", "past-negative", PAST_NEGATIVE, "past", "noun-tanaka"), tenseTarget("noun-senshuu", "verb-benkyou-suru", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-tanaka"), 1, "time-movement-3", 7, PAST_NEGATIVE, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-konshuu")), tenseTarget("noun-konshuu", "verb-yasumu", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-yamada"), tenseTarget("noun-konshuu", "verb-hataraku", "polite-nonpast", NONPAST_AFFIRMATIVE, "habitual", "noun-yamada"), 1, "time-movement-3", 8, NONPAST_NEGATIVE, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kinou")), tenseTarget("noun-kinou", "verb-kaku", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-satou"), tenseTarget("noun-kinou", "verb-yasumu", "past-negative", PAST_NEGATIVE, "past", "noun-satou"), 0, "time-movement-3", 9, PAST_AFFIRMATIVE, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-raishuu")), tenseTarget("noun-raishuu", "verb-benkyou-suru", "nonpast-negative", NONPAST_NEGATIVE, "future", "noun-suzuki"), tenseTarget("noun-senshuu", "verb-benkyou-suru", "past-affirmative", PAST_AFFIRMATIVE, "past", "noun-suzuki"), 1, "time-movement-3", 10, NONPAST_NEGATIVE, BASE_SPOKEN_ACTIVITY_SHAPE),
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
): BaseTask11TargetSpec {
  return eventTarget(
    lemmaId,
    form,
    [L(timeId), L(nounId), P("object-o")],
    SCHEDULE,
    tags,
    ["time", "theme"],
    ["predicate-led-particle-selection", "relative-time-omission"],
    { predicateSenseId, provided: { theme: "object-o" } },
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

const L4: BaseTask11LessonSpec = {
  lessonId: "time-movement-4",
  contract: "content",
  prerequisiteLessonIds: ["time-movement-3"],
  newLexemeIds: [
    "noun-kaigi",
    "noun-shigoto",
    "noun-hirugohan",
    "noun-ban",
    "noun-kesa",
    "noun-konban",
    "noun-nichiyoubi",
    "noun-yotei",
  ],
  reviewLexemeIds: [
    "noun-shichiji",
    "noun-kuji",
    "noun-ashita",
    "noun-getsuyoubi",
    "noun-eki",
    "noun-daigaku",
    "noun-densha",
    "verb-suru",
    "verb-taberu",
    "verb-miru",
    "verb-hataraku",
    "verb-yasumu",
    "verb-hashiru",
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
    ex(scheduleExample("noun-kesa", "verb-hashiru", "past-affirmative", ["past"]), "ran-this-morning", "I ran this morning.", "Ho corso stamattina.", "Uses a relative past-time expression without に.", "Usa un tempo passato relativo senza に.", "past"),
    ex(scheduledObject("noun-konban", "noun-kaigi", "verb-suru", "do"), "meeting-tonight", "I will have the meeting tonight.", "Terrò la riunione stasera.", "Combines a future relative time with a licensed theme.", "Combina un tempo futuro relativo con un tema ammesso.", "future"),
    ex(scheduledObject("noun-ashita", "noun-shigoto", "verb-suru", "do"), "work-tomorrow", "I will do the work tomorrow.", "Farò il lavoro domani.", "Keeps tomorrow free of obligatory に.", "Mantiene domani senza に obbligatorio.", "future"),
    ex(scheduledObject("noun-kyou", "noun-hirugohan", "verb-taberu", "eat"), "lunch-today", "I will eat lunch today.", "Oggi pranzerò.", "Uses the meal as the eating theme.", "Usa il pasto come tema di mangiare.", "future"),
    ex(scheduleExample("noun-ban", "verb-hataraku", "polite-nonpast", ["habitual"]), "work-evenings", "I work in the evening.", "Lavoro la sera.", "Gives dynamic nonpast a habitual evening reading.", "Dà al non-passato dinamico una lettura serale abituale.", "habitual"),
    ex(scheduleExample("noun-konban", "verb-ryouri-suru", "polite-nonpast", ["future"]), "cook-tonight", "I will cook tonight.", "Cucinerò stasera.", "Uses a future reading, never ongoing-now.", "Usa una lettura futura, mai progressiva.", "future"),
    ex(specificTime("noun-nichiyoubi", "verb-yasumu", SCHEDULE, undefined, "habitual"), "rest-sunday", "I rest on Sunday.", "La domenica riposo.", "Uses に with a named recurring day.", "Usa に con un giorno ricorrente nominato.", "habitual"),
    ex(scheduledObject("noun-ashita", "noun-yotei", "verb-miru", "see"), "check-plan", "I will check the schedule tomorrow.", "Controllerò il programma domani.", "Makes the schedule the licensed theme of checking.", "Rende il programma il tema ammesso di controllare.", "future"),
    ex(eventTarget("verb-iku", "polite-nonpast", [L("noun-konban"), L("noun-eki"), P("direction-he")], ROUTE, ["future"], ["time", "goal"], ["relative-time-omission", "direction-he"], { predicateSenseId: "go-direction", provided: { goal: "direction-he" } }), "station-tonight", "I will head toward the station tonight.", "Stasera mi dirigerò verso la stazione.", "Adds a coherent future movement item to the schedule.", "Aggiunge al programma un movimento futuro coerente.", "future"),
    ex(eventTarget("verb-suru", "nonpast-negative", [L("noun-konban"), L("noun-kaigi"), P("object-o")], SCHEDULE, ["future", "negative"], ["time", "theme"], ["predicate-led-particle-selection", "relative-time-omission", "four-polite-tense-cells"], { predicateSenseId: "do", provided: { theme: "object-o" } }), "no-meeting-tonight", "I will not have the meeting tonight.", "Non terrò la riunione stasera.", "Uses the nonpast negative for a cancelled future event.", "Usa il non-passato negativo per un evento futuro annullato.", "future"),
  ],
  activities: [
    act(task11Cue(L("noun-kesa")), eventTarget("verb-hashiru", "past-affirmative", [L("noun-watashi"), P("topic-wa"), L("noun-kesa")], SCHEDULE, ["past"], ["topic", "time"], ["relative-time-omission", "four-polite-tense-cells"]), scheduleExample("noun-kesa", "verb-dekakeru", "past-negative", ["past", "negative"]), 0, "time-movement-4", 1, SCHEDULE, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kaigi")), scheduledObject("noun-ashita", "noun-kaigi", "verb-suru", "do"), scheduledObject("noun-kyou", "noun-shigoto", "verb-suru", "do"), 1, "time-movement-4", 2, SCHEDULE, BASE_FORM_ACTIVITY_SHAPE, "meeting", "meeting-tomorrow"),
    act(task11Cue(L("noun-shigoto"), L("verb-suru")), scheduledObject("noun-konban", "noun-shigoto", "verb-suru", "do"), task11Target([L("noun-shigoto"), P("object-o"), L("noun-konban"), task11VerbForm("verb-suru", "polite-nonpast")], { conceptIds: ["predicate-led-particle-selection", "relative-time-omission"], patternCellIds: [SCHEDULE], semanticRoleIds: ["time", "theme"], interpretationTags: ["future"], predicateSenseId: "do", predicateLexemeId: "verb-suru", predicateAspect: "dynamic", particleFrame: { predicateSenseId: "do", provided: { theme: "object-o" } } }), 1, "time-movement-4", 3, SCHEDULE, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-hirugohan")), scheduledObject("noun-ashita", "noun-hirugohan", "verb-taberu", "eat"), scheduledObject("noun-kesa", "noun-yotei", "verb-miru", "see"), 1, "time-movement-4", 4, SCHEDULE, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-ban")), eventTarget("verb-hataraku", "polite-nonpast", [L("noun-tanaka"), P("topic-wa"), L("noun-ban")], SCHEDULE, ["habitual"], ["topic", "time"], ["relative-time-omission", "four-polite-tense-cells"]), eventTarget("verb-ryouri-suru", "polite-nonpast", [L("noun-yuki-san"), P("topic-wa"), L("noun-ashita")], SCHEDULE, ["future"], ["topic", "time"], ["relative-time-omission", "four-polite-tense-cells"]), 0, "time-movement-4", 5, SCHEDULE, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(promptOf(scheduledObject("noun-konban", "noun-kaigi", "verb-suru", "do")), eventTarget("verb-suru", "nonpast-negative", [L("noun-watashi"), P("topic-wa"), L("noun-konban"), L("noun-kaigi"), P("object-o")], SCHEDULE, ["future", "negative"], ["topic", "time", "theme"], ["predicate-led-particle-selection", "relative-time-omission", "four-polite-tense-cells"], { predicateSenseId: "do", provided: { theme: "object-o" } }), scheduledObject("noun-konban", "noun-yotei", "verb-miru", "see"), 1, "time-movement-4", 6, SCHEDULE, BASE_ERROR_ACTIVITY_SHAPE, "meeting", "meeting-cancelled", "polarity-mismatch"),
    act(task11Cue(L("noun-nichiyoubi")), specificTime("noun-nichiyoubi", "verb-yasumu", SCHEDULE, "noun-tanaka", "habitual"), scheduleExample("noun-konban", "verb-hashiru", "polite-nonpast", ["future"]), 0, "time-movement-4", 7, SCHEDULE, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-yotei")), eventTarget("verb-miru", "polite-nonpast", [L("noun-yamada"), P("topic-wa"), L("noun-ashita"), L("noun-yotei"), P("object-o")], SCHEDULE, ["future"], ["topic", "time", "theme"], ["predicate-led-particle-selection", "relative-time-omission"], { predicateSenseId: "see", provided: { theme: "object-o" } }), scheduledObject("noun-kyou", "noun-kaigi", "verb-suru", "do"), 0, "time-movement-4", 8, SCHEDULE, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("expression-sou")), eventTarget("verb-iku", "polite-nonpast", [L("noun-densha"), P("means-de")], ROUTE, ["future"], ["means"], ["means-de"], { predicateSenseId: "travel-means", provided: { means: "means-de" } }), eventTarget("verb-iku", "nonpast-negative", [L("noun-densha"), P("means-de")], ROUTE, ["future", "negative"], ["means"], ["means-de", "four-polite-tense-cells"], { predicateSenseId: "travel-means", provided: { means: "means-de" } }), 0, "time-movement-4", 9, ROUTE, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-konban")), eventTarget("verb-suru", "polite-nonpast", [L("noun-suzuki"), P("topic-wa"), L("noun-konban"), L("noun-kaigi"), P("object-o")], SCHEDULE, ["future"], ["topic", "time", "theme"], ["predicate-led-particle-selection", "relative-time-omission"], { predicateSenseId: "do", provided: { theme: "object-o" } }), scheduleExample("noun-kesa", "verb-dekakeru", "past-affirmative", ["past"]), 1, "time-movement-4", 10, SCHEDULE, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: [
    {
      speakerId: "learner",
      target: eventWithSuffix(
        "verb-iku",
        "polite-nonpast",
        [
          L("noun-getsuyoubi"),
          P("time-ni"),
          L("noun-daigaku"),
          P("goal-ni"),
        ],
        [P("question-ka")],
        ROUTE,
        ["future"],
        ["time", "goal"],
        ["time-ni", "goal-ni"],
        {
          predicateSenseId: "go-time-goal",
          provided: { time: "time-ni", goal: "goal-ni" },
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
        [L("expression-hai"), C, L("noun-shichiji"), P("time-ni")],
        ROUTE,
        ["future"],
        ["time"],
        ["time-ni"],
        { predicateSenseId: "action-time", provided: { time: "time-ni" } },
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
          P("source-kara"),
          L("noun-daigaku"),
          P("limit-made"),
        ],
        [P("question-ka")],
        ROUTE,
        ["future"],
        ["source", "limit"],
        ["source-kara", "limit-made"],
        {
          predicateSenseId: "movement-bounds",
          provided: { source: "source-kara", limit: "limit-made" },
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
        [L("expression-hai"), C, L("noun-densha"), P("means-de")],
        ROUTE,
        ["future"],
        ["means"],
        ["means-de"],
        { predicateSenseId: "travel-means", provided: { means: "means-de" } },
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
        [L("noun-konban"), L("noun-kaigi"), P("object-o")],
        [P("question-ka")],
        SCHEDULE,
        ["future"],
        ["time", "theme"],
        ["relative-time-omission", "predicate-led-particle-selection"],
        { predicateSenseId: "do", provided: { theme: "object-o" } },
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
    tanakaWorkBounds: "nine-to-five",
    meetingPlan: "tonight",
  },
  worldFactIds: RAW_TIME_LESSONS.flatMap((lesson) =>
    lesson.activityDesigns.flatMap(({ worldFactId }) =>
      worldFactId ? [worldFactId] : [],
    ),
  ),
  worldFactLedger: worldFactLedgerFor(RAW_TIME_LESSONS),
};

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
    `Invalid Base time-movement module: ${validation.errors.join(", ")} ${JSON.stringify(details)} ${JSON.stringify(publication)}`,
  );
}

export const BASE_TIME_MOVEMENT_MODULE: BaseTimeMovementModule = deepFreeze(
  RAW_TIME_MOVEMENT_MODULE,
);
