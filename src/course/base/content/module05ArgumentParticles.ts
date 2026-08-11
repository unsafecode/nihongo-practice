import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  BaseContentLessonContent,
  BaseExample,
  BaseParticleFrame,
  BaseSystemLessonContent,
  BaseValidationCatalogs,
} from "../catalog/types";
import { validateParticleFrame } from "../forms/particleLicensing";
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
  BASE_POLITE_VERBS_LESSONS,
  BASE_POLITE_VERBS_MODULE,
  BASE_POLITE_VERBS_VALIDATION_CATALOGS,
  TASK11_COMMA,
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
  type BaseTask11ExampleSpec,
  type BaseTask11Lesson,
  type BaseTask11LessonSpec,
  type BaseTask11ModuleError,
  type BaseTask11Part,
  type BaseTask11TargetSpec,
} from "./module04PoliteVerbs";

export interface BaseArgumentParticlesModule {
  readonly id: "argument-particles";
  readonly lessons: readonly BaseTask11Lesson[];
  readonly sequence: readonly (
    | BaseSystemLessonContent
    | BaseContentLessonContent
  )[];
  readonly worldFacts: Readonly<{
    readonly learnerMeal: "rice";
    readonly learnerRoute: "station";
    readonly tanakaWorkplace: "office";
    readonly suzukiPurchase: "umbrella";
  }>;
  readonly worldFactIds: readonly string[];
  readonly worldFactLedger: readonly BaseWorldFactRecord[];
}

type Provided = BaseParticleFrame["provided"];
type Attachments = BaseParticleFrame["attachmentLexemeIdByRole"];

const L = task11Lexeme;
const P = task11Particle;

function argumentTarget(
  lemmaId: string,
  predicateSenseId: string,
  provided: Provided,
  attachmentLexemeIdByRole: Attachments,
  parts: readonly BaseTask11Part[],
  patternCellId: string | null,
  semanticRoleIds: BaseTask11TargetSpec["semanticRoleIds"],
  extraConceptIds: readonly string[] = [],
  tag: "habitual" | "future" = "habitual",
): BaseTask11TargetSpec {
  return task11Target(
    [...parts, task11VerbForm(lemmaId, "polite-nonpast")],
    {
      conceptIds: extraConceptIds,
      patternCellIds: patternCellId ? [patternCellId] : [],
      semanticRoleIds,
      interpretationTags: [tag],
      predicateSenseId,
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId,
        provided,
        attachmentLexemeIdByRole,
      },
    },
  );
}

function permutedArgumentTarget(
  lemmaId: string,
  predicateSenseId: string,
  provided: Provided,
  attachmentLexemeIdByRole: Attachments,
  parts: readonly BaseTask11Part[],
  patternCellId: string,
  semanticRoleIds: BaseTask11TargetSpec["semanticRoleIds"],
  extraConceptIds: readonly string[] = [],
): BaseTask11TargetSpec {
  return task11Target(parts, {
    conceptIds: extraConceptIds,
    patternCellIds: [patternCellId],
    semanticRoleIds,
    interpretationTags: ["habitual"],
    predicateSenseId,
    predicateLexemeId: lemmaId,
    predicateAspect: "dynamic",
    particleFrame: {
      predicateSenseId,
      provided,
      attachmentLexemeIdByRole,
    },
  });
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

function promptOf(target: BaseTask11TargetSpec): BaseTask11TargetSpec {
  return { ...target, patternCellIds: [] };
}

function withFinalParticle(
  target: BaseTask11TargetSpec,
  role: "question" | "interaction",
  sense: "question-ka" | "interactional-ne" | "interactional-yo",
): BaseTask11TargetSpec {
  if (!target.particleFrame || !target.predicateLexemeId) {
    throw new Error("A final particle requires an authored predicate frame.");
  }
  return {
    ...target,
    parts: [...target.parts, P(sense)],
    particleFrame: {
      ...target.particleFrame,
      provided: {
        ...target.particleFrame.provided,
        [role]: sense,
      },
      attachmentLexemeIdByRole: {
        ...target.particleFrame.attachmentLexemeIdByRole,
        [role]: target.predicateLexemeId,
      },
    },
  };
}

function roleAnnotated(
  target: BaseTask11TargetSpec,
  analysisId:
    | "analysis-action-place"
    | "analysis-means"
    | "analysis-goal"
    | "analysis-direction",
): BaseTask11TargetSpec {
  return {
    ...target,
    parts: [...target.parts, TASK11_COMMA, task11AnalysisLabel(analysisId)],
  };
}

const OBJECT_O = "ap1-transitive-theme-o";
const TOPICALIZED_OBJECT = "ap1-topicalized-theme-wa";
const object = (
  nounId: string,
  lemmaId: string,
  predicateSenseId: "eat" | "drink" | "read" | "write" | "buy" | "see",
  patternCellId: string | null = OBJECT_O,
  topicId?: string,
  tag: "habitual" | "future" = "habitual",
): BaseTask11TargetSpec =>
  argumentTarget(
    lemmaId,
    predicateSenseId,
    {
      theme:
        patternCellId === TOPICALIZED_OBJECT ? "topic-wa" : "object-o",
      ...(topicId ? { topic: "topic-wa" as const } : {}),
    },
    {
      theme: nounId,
      ...(topicId ? { topic: topicId } : {}),
    },
    [
      ...(topicId ? [L(topicId), P("topic-wa")] : []),
      L(nounId),
      P(patternCellId === TOPICALIZED_OBJECT ? "topic-wa" : "object-o"),
    ],
    patternCellId,
    topicId ? ["topic", "theme"] : ["theme"],
    patternCellId === TOPICALIZED_OBJECT ? ["topicalized-object-wa"] : [],
    tag,
  );

const L1: BaseTask11LessonSpec = {
  lessonId: "argument-particles-1",
  contract: "system",
  prerequisiteLessonIds: ["polite-verbs-4"],
  newLexemeIds: [
    "noun-gohan",
    "noun-mizu",
    "noun-tegami",
    "noun-kudamono",
    "noun-zasshi",
  ],
  reviewLexemeIds: [
    "anchor-hon",
    "anchor-shashin",
    "verb-taberu",
    "verb-nomu",
    "verb-yomu",
    "verb-kaku",
    "verb-kau",
    "verb-miru",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
  ],
  introducedConceptIds: ["licensed-object-o", "topicalized-object-wa"],
  reviewedConceptIds: ["masu-nonpast", "topic-wa"],
  patternCellIds: [OBJECT_O, TOPICALIZED_OBJECT],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
  ],
  examples: [
    ex(object("noun-gohan", "verb-taberu", "eat"), "meal-theme", "I eat rice / a meal.", "Mangio riso / un pasto.", "Marks the licensed theme of eating with を.", "Segna con を il tema ammesso da mangiare.", "theme-o"),
    ex(object("noun-mizu", "verb-nomu", "drink"), "water-theme", "I drink water.", "Bevo acqua.", "Pairs the drinking sense with its overt theme.", "Abbina il senso bere al suo tema esplicito.", "theme-o"),
    ex(object("noun-tegami", "verb-kaku", "write"), "letter-theme", "I write a letter.", "Scrivo una lettera.", "Uses the writing sense that licenses a theme.", "Usa il senso scrivere che ammette un tema.", "theme-o"),
    ex(object("noun-kudamono", "verb-kau", "buy"), "fruit-theme", "I buy fruit.", "Compro della frutta.", "Uses を for the thing bought.", "Usa を per la cosa comprata.", "theme-o"),
    ex(object("noun-zasshi", "verb-yomu", "read"), "magazine-theme", "I read a magazine.", "Leggo una rivista.", "Links the magazine to the reading predicate.", "Collega la rivista al predicato leggere.", "theme-o"),
    ex(object("anchor-hon", "verb-yomu", "read"), "book-theme", "I read a book.", "Leggo un libro.", "Retrieves a known noun in the same licensed frame.", "Recupera un nome noto nello stesso schema ammesso.", "theme-o"),
    ex(object("anchor-shashin", "verb-miru", "see"), "photo-theme", "I look at a photograph.", "Guardo una fotografia.", "Uses the seeing sense rather than an English preposition rule.", "Usa il senso guardare, non una regola basata su preposizioni.", "theme-o"),
    ex(object("noun-gohan", "verb-taberu", "eat", TOPICALIZED_OBJECT), "meal-topicalized", "As for the meal, I eat it.", "Quanto al pasto, lo mangio.", "Replaces overt を with は while preserving the licensed theme.", "Sostituisce を esplicito con は conservando il tema ammesso.", "topicalized-theme"),
    ex(object("noun-mizu", "verb-nomu", "drink", TOPICALIZED_OBJECT), "water-topicalized", "As for water, I drink it.", "Quanto all'acqua, la bevo.", "Contrasts a topicalized theme with ordinary を.", "Contrappone un tema topicalizzato al normale を.", "topicalized-theme"),
    ex(object("noun-tegami", "verb-kaku", "write", TOPICALIZED_OBJECT, undefined, "future"), "letter-topicalized", "As for the letter, I will write it.", "Quanto alla lettera, la scriverò.", "Shows a recoverable future context with object topicalization.", "Mostra un contesto futuro recuperabile con topicalizzazione.", "topicalized-theme"),
  ],
  activities: [
    act(task11Cue(L("noun-gohan")), object("noun-gohan", "verb-taberu", "eat", OBJECT_O, "noun-watashi"), object("noun-gohan", "verb-taberu", "eat", TOPICALIZED_OBJECT, "noun-watashi"), 0, "argument-particles-1", 1, OBJECT_O, BASE_MEANING_ACTIVITY_SHAPE, "learner", "learner-eats-rice"),
    act(task11Cue(L("noun-mizu")), object("noun-mizu", "verb-nomu", "drink", OBJECT_O, "noun-tanaka"), object("noun-mizu", "verb-nomu", "drink", TOPICALIZED_OBJECT, "noun-tanaka"), 1, "argument-particles-1", 2, OBJECT_O, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-tegami")), object("noun-tegami", "verb-kaku", "write", OBJECT_O, "noun-yamada"), permutedArgumentTarget("verb-kaku", "write", { theme: "object-o", topic: "topic-wa" }, { theme: "noun-tegami", topic: "noun-yamada" }, [L("noun-yamada"), P("topic-wa"), task11VerbForm("verb-kaku", "polite-nonpast"), L("noun-tegami"), P("object-o")], OBJECT_O, ["topic", "theme"]), 0, "argument-particles-1", 3, OBJECT_O, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kudamono")), object("noun-kudamono", "verb-kau", "buy", OBJECT_O, "noun-satou"), object("noun-kudamono", "verb-kau", "buy", TOPICALIZED_OBJECT), 0, "argument-particles-1", 4, OBJECT_O, BASE_CONTROLLED_ACTIVITY_SHAPE, "satou", "satou-buys-fruit"),
    act(promptOf(object("noun-zasshi", "verb-kau", "buy", OBJECT_O)), object("noun-zasshi", "verb-kau", "buy", TOPICALIZED_OBJECT), object("noun-zasshi", "verb-kau", "buy", OBJECT_O, "noun-watashi"), 1, "argument-particles-1", 5, TOPICALIZED_OBJECT, BASE_TRANSFORMATION_ACTIVITY_SHAPE),
    act(promptOf(object("anchor-hon", "verb-kau", "buy", TOPICALIZED_OBJECT)), object("anchor-hon", "verb-kau", "buy", OBJECT_O), withFinalParticle(object("anchor-hon", "verb-kau", "buy", TOPICALIZED_OBJECT), "interaction", "interactional-yo"), 1, "argument-particles-1", 6, OBJECT_O, BASE_ERROR_ACTIVITY_SHAPE, null, null, "object-topicalization-mismatch"),
    act(task11Cue(L("anchor-shashin")), object("anchor-shashin", "verb-miru", "see", OBJECT_O, "noun-tanaka"), object("anchor-shashin", "verb-miru", "see", TOPICALIZED_OBJECT, "noun-tanaka"), 0, "argument-particles-1", 7, OBJECT_O, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-tegami")), object("noun-tegami", "verb-kaku", "write", OBJECT_O, "noun-watashi"), withFinalParticle(object("noun-tegami", "verb-kaku", "write", TOPICALIZED_OBJECT), "question", "question-ka"), 1, "argument-particles-1", 8, OBJECT_O, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kudamono")), withFinalParticle(object("noun-kudamono", "verb-kau", "buy", TOPICALIZED_OBJECT), "interaction", "interactional-ne"), object("noun-kudamono", "verb-kau", "buy", OBJECT_O, "noun-mari"), 0, "argument-particles-1", 9, TOPICALIZED_OBJECT, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-zasshi")), object("noun-zasshi", "verb-yomu", "read", OBJECT_O, "noun-yamada"), object("noun-mizu", "verb-nomu", "drink", OBJECT_O, "noun-yamada"), 1, "argument-particles-1", 10, OBJECT_O, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const GOAL_NI = "ap2-motion-goal-ni";
const DIRECTION_E = "ap2-motion-direction-e";
type MotionSense =
  | "go-goal"
  | "go-direction"
  | "come-goal"
  | "come-direction"
  | "return-goal"
  | "return-direction";

function motion(
  destinationId: string,
  lemmaId: "verb-iku" | "verb-kuru" | "verb-kaeru",
  sense: MotionSense,
  topicId?: string,
  topicSense: "topic-wa" | "additive-mo" = "topic-wa",
): BaseTask11TargetSpec {
  const direction = sense.endsWith("direction");
  return argumentTarget(
    lemmaId,
    sense,
    {
      goal: direction ? "direction-he" : "goal-ni",
      ...(topicId ? { topic: topicSense } : {}),
    },
    {
      goal: destinationId,
      ...(topicId ? { topic: topicId } : {}),
    },
    [
      ...(topicId ? [L(topicId), P(topicSense)] : []),
      L(destinationId),
      P(direction ? "direction-he" : "goal-ni"),
    ],
    direction ? DIRECTION_E : GOAL_NI,
    topicId ? ["topic", "goal"] : ["goal"],
  );
}

const L2: BaseTask11LessonSpec = {
  lessonId: "argument-particles-2",
  contract: "system",
  prerequisiteLessonIds: ["argument-particles-1"],
  newLexemeIds: [
    "noun-eki",
    "noun-daigaku",
    "noun-byouin",
    "noun-mise",
  ],
  reviewLexemeIds: [
    "verb-iku",
    "verb-kuru",
    "verb-kaeru",
    "anchor-ie",
    "anchor-gakkou",
    "noun-tokyo",
    "noun-kyoto",
    "noun-osaka",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
  ],
  introducedConceptIds: ["goal-ni", "direction-he"],
  reviewedConceptIds: ["masu-nonpast", "topic-wa"],
  patternCellIds: [GOAL_NI, DIRECTION_E],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
  ],
  examples: [
    ex(motion("noun-eki", "verb-iku", "go-goal"), "station-goal", "I go to the station.", "Vado alla stazione.", "Uses に for a concrete endpoint licensed by going.", "Usa に per una meta concreta ammessa da andare.", "goal-ni"),
    ex(motion("noun-daigaku", "verb-iku", "go-goal", "noun-watashi"), "university-goal", "I go to the university.", "Vado all'università.", "Adds an explicit speaker topic to an endpoint-focused movement.", "Aggiunge il tema esplicito del parlante a un movimento verso la meta.", "goal-ni"),
    ex(motion("noun-byouin", "verb-iku", "go-direction"), "hospital-direction", "I head toward the hospital.", "Mi dirigo verso l'ospedale.", "Uses へ, pronounced e, for route direction.", "Usa へ, pronunciato e, per la direzione.", "direction-e"),
    ex(motion("noun-mise", "verb-iku", "go-direction"), "shop-direction", "I head toward the shop.", "Mi dirigo verso il negozio.", "Keeps directional へ distinct from endpoint に.", "Mantiene distinto へ direzionale da に di meta.", "direction-e"),
    ex(motion("anchor-gakkou", "verb-kuru", "come-goal", "noun-tanaka"), "school-arrival", "Tanaka comes to school.", "Tanaka viene a scuola.", "The coming sense licenses Tanaka's explicit arrival goal.", "Il senso venire ammette la meta d'arrivo esplicita di Tanaka.", "goal-ni"),
    ex(motion("anchor-ie", "verb-kaeru", "return-goal", "noun-tanaka"), "homeward-return", "Tanaka returns home.", "Tanaka torna a casa.", "Frames home as Tanaka's natural return goal.", "Presenta casa come meta naturale del ritorno di Tanaka.", "goal-ni"),
    ex(motion("noun-tokyo", "verb-iku", "go-direction", "noun-suzuki", "additive-mo"), "tokyo-direction", "Suzuki also heads toward Tokyo.", "Anche Suzuki si dirige verso Tokyo.", "Combines an additive topic with a route direction.", "Combina un tema additivo con una direzione di percorso.", "direction-e"),
    ex(withFinalParticle(motion("noun-kyoto", "verb-kuru", "come-goal", "noun-mari"), "question", "question-ka"), "kyoto-arrival", "Does Mari come to Kyoto?", "Mari viene a Kyoto?", "Turns the coming endpoint into a confirmation question.", "Trasforma la meta d'arrivo in una domanda di conferma.", "goal-ni"),
    ex(withFinalParticle(motion("noun-osaka", "verb-iku", "go-direction", "noun-yamada"), "interaction", "interactional-yo"), "osaka-go-direction", "Yamada heads toward Osaka.", "Yamada si dirige verso Osaka.", "Presents Yamada's route direction as an update.", "Presenta come informazione nuova la direzione di Yamada.", "direction-e"),
    ex(motion("anchor-ie", "verb-kaeru", "return-goal"), "home-return-goal", "They return home.", "Tornano a casa.", "Uses home as the natural endpoint of returning.", "Usa casa come meta naturale del ritorno.", "goal-ni"),
  ],
  activities: [
    act(task11Cue(L("noun-eki")), roleAnnotated(motion("noun-eki", "verb-iku", "go-goal", "noun-watashi"), "analysis-goal"), roleAnnotated(motion("noun-eki", "verb-iku", "go-direction", "noun-watashi"), "analysis-direction"), 0, "argument-particles-2", 1, GOAL_NI, BASE_MEANING_ACTIVITY_SHAPE, "learner", "learner-goes-station"),
    act(task11Cue(L("noun-daigaku")), roleAnnotated(motion("noun-daigaku", "verb-iku", "go-direction", "noun-tanaka"), "analysis-direction"), roleAnnotated(motion("noun-daigaku", "verb-iku", "go-goal", "noun-tanaka"), "analysis-goal"), 1, "argument-particles-2", 2, DIRECTION_E, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-byouin")), motion("noun-byouin", "verb-iku", "go-goal", "noun-yamada"), permutedArgumentTarget("verb-iku", "go-goal", { goal: "goal-ni", topic: "topic-wa" }, { goal: "noun-byouin", topic: "noun-yamada" }, [L("noun-yamada"), P("topic-wa"), task11VerbForm("verb-iku", "polite-nonpast"), L("noun-byouin"), P("goal-ni")], GOAL_NI, ["topic", "goal"]), 0, "argument-particles-2", 3, GOAL_NI, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-mise")), roleAnnotated(motion("noun-mise", "verb-iku", "go-direction", "noun-satou"), "analysis-direction"), roleAnnotated(motion("noun-mise", "verb-iku", "go-goal", "noun-satou"), "analysis-goal"), 1, "argument-particles-2", 4, DIRECTION_E, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(promptOf(motion("anchor-gakkou", "verb-iku", "go-goal", "noun-suzuki")), motion("anchor-gakkou", "verb-iku", "go-direction", "noun-suzuki"), roleAnnotated(motion("anchor-gakkou", "verb-iku", "go-goal", "noun-suzuki"), "analysis-goal"), 1, "argument-particles-2", 5, DIRECTION_E, BASE_TRANSFORMATION_ACTIVITY_SHAPE),
    act(promptOf(motion("anchor-ie", "verb-iku", "go-direction", "noun-mari")), motion("anchor-ie", "verb-iku", "go-goal", "noun-mari"), withFinalParticle(motion("anchor-ie", "verb-iku", "go-direction", "noun-mari"), "interaction", "interactional-yo"), 0, "argument-particles-2", 6, GOAL_NI, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-goes-home", "goal-direction-context-mismatch"),
    act(task11Cue(L("noun-tokyo")), motion("noun-tokyo", "verb-iku", "go-direction", "noun-tanaka"), motion("noun-tokyo", "verb-iku", "go-goal", "noun-tanaka"), 0, "argument-particles-2", 7, DIRECTION_E, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kyoto")), motion("noun-kyoto", "verb-iku", "go-goal", "noun-yamada"), motion("noun-kyoto", "verb-iku", "go-direction", "noun-yamada"), 1, "argument-particles-2", 8, GOAL_NI, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("anchor-ie")), motion("anchor-ie", "verb-iku", "go-goal", "noun-satou"), motion("anchor-ie", "verb-iku", "go-direction", "noun-satou"), 0, "argument-particles-2", 9, GOAL_NI, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-byouin")), motion("noun-byouin", "verb-iku", "go-direction", "noun-suzuki"), motion("noun-daigaku", "verb-iku", "go-goal", "noun-suzuki"), 1, "argument-particles-2", 10, DIRECTION_E, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const ACTION_PLACE = "ap3-action-place-de";
const MEANS = "ap3-means-de";
type PlaceSense =
  | "study-place"
  | "work-place"
  | "play-place"
  | "eat-place"
  | "write-place";

function place(
  placeId: string,
  lemmaId: string,
  sense: PlaceSense,
  topicId?: string,
): BaseTask11TargetSpec {
  return argumentTarget(
    lemmaId,
    sense,
    {
      "action-place": "action-place-de",
      ...(topicId ? { topic: "topic-wa" as const } : {}),
    },
    {
      "action-place": placeId,
      ...(topicId ? { topic: topicId } : {}),
    },
    [
      ...(topicId ? [L(topicId), P("topic-wa")] : []),
      L(placeId),
      P("action-place-de"),
    ],
    ACTION_PLACE,
    topicId ? ["topic", "location"] : ["location"],
  );
}

function means(
  meansId: string,
  lemmaId:
    | "verb-iku"
    | "verb-kuru"
    | "verb-kaeru"
    | "verb-kaku"
    | "verb-benkyou-suru",
  sense: "travel-means" | "write-means",
  topicId?: string,
): BaseTask11TargetSpec {
  return argumentTarget(
    lemmaId,
    sense,
    {
      means: "means-de",
      ...(topicId ? { topic: "topic-wa" as const } : {}),
    },
    {
      means: meansId,
      ...(topicId ? { topic: topicId } : {}),
    },
    [
      ...(topicId ? [L(topicId), P("topic-wa")] : []),
      L(meansId),
      P("means-de"),
    ],
    MEANS,
    topicId ? ["topic", "means"] : ["means"],
  );
}

const L3: BaseTask11LessonSpec = {
  lessonId: "argument-particles-3",
  contract: "system",
  prerequisiteLessonIds: ["argument-particles-2"],
  newLexemeIds: [
    "noun-toshokan",
    "noun-kouen",
    "noun-densha",
    "noun-jitensha",
    "noun-enpitsu",
  ],
  reviewLexemeIds: [
    "noun-daigaku",
    "noun-mise",
    "noun-byouin",
    "anchor-gakkou",
    "verb-benkyou-suru",
    "verb-hataraku",
    "verb-asobu",
    "verb-taberu",
    "verb-iku",
    "verb-kaeru",
    "verb-kaku",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
  ],
  introducedConceptIds: ["action-place-de", "means-de"],
  reviewedConceptIds: ["masu-nonpast", "topic-wa"],
  patternCellIds: [ACTION_PLACE, MEANS],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
  ],
  examples: [
    ex(place("noun-toshokan", "verb-benkyou-suru", "study-place"), "library-study", "I study at the library.", "Studio in biblioteca.", "Marks the location where studying happens.", "Segna il luogo in cui avviene lo studio.", "action-place"),
    ex(place("noun-kouen", "verb-asobu", "play-place"), "park-play", "I play at the park.", "Gioco al parco.", "Uses で as an action location.", "Usa で come luogo dell'azione.", "action-place"),
    ex(place("noun-daigaku", "verb-hataraku", "work-place"), "university-work", "I work at the university.", "Lavoro all'università.", "The work sense licenses an action place.", "Il senso lavorare ammette un luogo d'azione.", "action-place"),
    ex(place("noun-mise", "verb-hataraku", "work-place"), "shop-work", "I work at the shop.", "Lavoro al negozio.", "Changes the workplace without changing the predicate frame.", "Cambia il luogo di lavoro senza cambiare lo schema.", "action-place"),
    ex(means("noun-densha", "verb-iku", "travel-means"), "train-travel", "I go by train.", "Vado in treno.", "Uses で for a means of travel.", "Usa で per un mezzo di trasporto.", "means"),
    ex(means("noun-jitensha", "verb-iku", "travel-means"), "bicycle-travel", "I go by bicycle.", "Vado in bicicletta.", "Contrasts another travel means with an action place.", "Contrappone un altro mezzo a un luogo d'azione.", "means"),
    ex(means("noun-enpitsu", "verb-kaku", "write-means"), "pencil-writing", "I write with a pencil.", "Scrivo con una matita.", "Uses instrument context to select means で.", "Usa il contesto strumentale per scegliere で di mezzo.", "means"),
    ex(place("noun-byouin", "verb-hataraku", "work-place"), "hospital-work", "I work at the hospital.", "Lavoro all'ospedale.", "Adds a third grounded workplace.", "Aggiunge un terzo luogo di lavoro fondato.", "action-place"),
    ex(place("anchor-ie", "verb-asobu", "play-place"), "home-play", "I play at home.", "Gioco a casa.", "Shows that the predicate and context, not the noun alone, select the role.", "Mostra che sono predicato e contesto a scegliere il ruolo.", "action-place"),
    ex(means("noun-jitensha", "verb-kaeru", "travel-means"), "bicycle-return", "I return by bicycle.", "Torno in bicicletta.", "Applies means で to returning.", "Applica で di mezzo al ritorno.", "means"),
  ],
  activities: [
    act(task11Cue(L("noun-toshokan")), place("noun-toshokan", "verb-kaku", "write-place", "noun-watashi"), means("noun-enpitsu", "verb-kaku", "write-means", "noun-watashi"), 0, "argument-particles-3", 1, ACTION_PLACE, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-mise")), place("noun-mise", "verb-kaku", "write-place", "noun-tanaka"), means("noun-enpitsu", "verb-kaku", "write-means", "noun-tanaka"), 1, "argument-particles-3", 2, ACTION_PLACE, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-densha")), means("noun-densha", "verb-iku", "travel-means", "noun-yamada"), permutedArgumentTarget("verb-iku", "travel-means", { means: "means-de", topic: "topic-wa" }, { means: "noun-densha", topic: "noun-yamada" }, [L("noun-yamada"), P("topic-wa"), task11VerbForm("verb-iku", "polite-nonpast"), L("noun-densha"), P("means-de")], MEANS, ["topic", "means"]), 0, "argument-particles-3", 3, MEANS, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-jitensha")), means("noun-jitensha", "verb-iku", "travel-means", "noun-satou"), means("noun-densha", "verb-iku", "travel-means", "noun-satou"), 1, "argument-particles-3", 4, MEANS, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-enpitsu")), means("noun-enpitsu", "verb-kaku", "write-means", "noun-suzuki"), place("noun-mise", "verb-kaku", "write-place", "noun-suzuki"), 0, "argument-particles-3", 5, MEANS, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(promptOf(roleAnnotated(place("noun-mise", "verb-kaku", "write-place", "noun-mari"), "analysis-means")), roleAnnotated(place("noun-mise", "verb-kaku", "write-place", "noun-mari"), "analysis-action-place"), roleAnnotated(place("noun-mise", "verb-kaku", "write-place"), "analysis-means"), 0, "argument-particles-3", 6, ACTION_PLACE, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-writes-shop", "de-role-context-mismatch"),
    act(task11Cue(L("noun-kouen")), place("noun-kouen", "verb-kaku", "write-place", "noun-satou"), means("noun-enpitsu", "verb-kaku", "write-means", "noun-satou"), 1, "argument-particles-3", 7, ACTION_PLACE, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("anchor-gakkou")), place("anchor-gakkou", "verb-kaku", "write-place", "noun-yamada"), means("noun-enpitsu", "verb-kaku", "write-means", "noun-yamada"), 1, "argument-particles-3", 8, ACTION_PLACE, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-densha")), means("noun-densha", "verb-iku", "travel-means", "noun-mari"), means("noun-jitensha", "verb-iku", "travel-means", "noun-mari"), 0, "argument-particles-3", 9, MEANS, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-enpitsu")), means("noun-enpitsu", "verb-kaku", "write-means", "noun-mari"), place("noun-kouen", "verb-kaku", "write-place", "noun-mari"), 1, "argument-particles-3", 10, MEANS, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const MIXED = "ap4-predicate-led-selection";
const mixed = (
  target: BaseTask11TargetSpec,
): BaseTask11TargetSpec => ({
  ...target,
  conceptIds: [
    ...new Set([...target.conceptIds, "predicate-led-particle-selection"]),
  ],
  patternCellIds: [MIXED],
});

const L4: BaseTask11LessonSpec = {
  lessonId: "argument-particles-4",
  contract: "system",
  prerequisiteLessonIds: ["argument-particles-3"],
  newLexemeIds: ["noun-shokudou", "noun-jimusho", "noun-kasa", "noun-nikki"],
  reviewLexemeIds: [
    "noun-eki",
    "noun-daigaku",
    "noun-kouen",
    "noun-densha",
    "noun-gohan",
    "noun-mizu",
    "anchor-hon",
    "verb-taberu",
    "verb-hataraku",
    "verb-kau",
    "verb-kaku",
    "verb-iku",
    "verb-kaeru",
    "verb-yomu",
    "verb-nomu",
    "verb-asobu",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
  ],
  introducedConceptIds: ["predicate-led-particle-selection"],
  reviewedConceptIds: [
    "licensed-object-o",
    "topicalized-object-wa",
    "goal-ni",
    "direction-he",
    "action-place-de",
    "means-de",
  ],
  patternCellIds: [MIXED, OBJECT_O],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "reference-particle-frames",
  ],
  examples: [
    ex(mixed(place("noun-shokudou", "verb-taberu", "eat-place")), "cafeteria-eat", "I eat at the cafeteria.", "Mangio in mensa.", "Selects action-place で from eating in a venue.", "Seleziona で di luogo dal mangiare in un locale.", "predicate-led"),
    ex(mixed(place("noun-jimusho", "verb-hataraku", "work-place")), "office-work", "I work at the office.", "Lavoro in ufficio.", "Pairs the workplace with the work sense.", "Abbina il luogo al senso lavorare.", "predicate-led"),
    ex(object("noun-kasa", "verb-kau", "buy"), "umbrella-buy", "I buy an umbrella.", "Compro un ombrello.", "The buying sense selects theme を.", "Il senso comprare seleziona を di tema.", "predicate-led"),
    ex(object("noun-nikki", "verb-kaku", "write"), "diary-write", "I write a diary.", "Scrivo un diario.", "The writing sense selects the diary as theme.", "Il senso scrivere seleziona il diario come tema.", "predicate-led"),
    ex(mixed(motion("noun-eki", "verb-iku", "go-direction")), "station-direction", "I head toward the station.", "Mi dirigo verso la stazione.", "Chooses directional へ for a route view.", "Sceglie へ direzionale per una prospettiva di percorso.", "predicate-led"),
    ex(mixed(motion("noun-jimusho", "verb-kuru", "come-goal")), "office-arrival", "They come to the office.", "Vengono in ufficio.", "Chooses goal に for an arrival endpoint.", "Sceglie に di meta per un punto d'arrivo.", "predicate-led"),
    ex(mixed(means("noun-densha", "verb-kaeru", "travel-means")), "train-return", "I return by train.", "Torno in treno.", "Selects means で from the transport context.", "Seleziona で di mezzo dal contesto di trasporto.", "predicate-led"),
    ex(mixed(object("anchor-hon", "verb-yomu", "read", TOPICALIZED_OBJECT)), "book-topic", "As for the book, I read it.", "Quanto al libro, lo leggo.", "Keeps the reading theme licensed under topicalization.", "Mantiene il tema di leggere ammesso sotto topicalizzazione.", "predicate-led"),
    ex(mixed(object("noun-kudamono", "verb-taberu", "eat")), "fruit-object", "I eat fruit.", "Mangio della frutta.", "Retrieves the eating theme with a different object.", "Recupera il tema di mangiare con un oggetto diverso.", "predicate-led"),
    ex(mixed(place("noun-kouen", "verb-taberu", "eat-place")), "park-meal", "I eat at the park.", "Mangio al parco.", "Retrieves action-place で through an eating venue.", "Recupera で di luogo attraverso il posto del pasto.", "predicate-led"),
  ],
  activities: [
    act(task11Cue(L("noun-shokudou")), mixed(place("noun-shokudou", "verb-taberu", "eat-place", "noun-watashi")), mixed(argumentTarget("verb-taberu", "eat", { theme: "object-o", topic: "additive-mo" }, { theme: "noun-gohan", topic: "noun-watashi" }, [L("noun-watashi"), P("additive-mo"), L("noun-gohan"), P("object-o")], OBJECT_O, ["topic", "theme"])), 0, "argument-particles-4", 1, MIXED, BASE_MEANING_ACTIVITY_SHAPE, "learner", "learner-eats-cafeteria"),
    act(task11Cue(L("noun-jimusho")), mixed(roleAnnotated(place("noun-jimusho", "verb-kaku", "write-place", "noun-tanaka"), "analysis-action-place")), mixed(roleAnnotated(means("noun-enpitsu", "verb-kaku", "write-means", "noun-tanaka"), "analysis-means")), 1, "argument-particles-4", 2, MIXED, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kasa")), mixed(object("noun-kasa", "verb-kau", "buy", OBJECT_O, "noun-yamada")), permutedArgumentTarget("verb-kau", "buy", { theme: "object-o", topic: "topic-wa" }, { theme: "noun-kasa", topic: "noun-yamada" }, [L("noun-yamada"), P("topic-wa"), task11VerbForm("verb-kau", "polite-nonpast"), L("noun-kasa"), P("object-o")], MIXED, ["topic", "theme"], ["predicate-led-particle-selection"]), 0, "argument-particles-4", 3, MIXED, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-nikki")), mixed(object("noun-nikki", "verb-kaku", "write", OBJECT_O, "noun-satou")), mixed(object("noun-nikki", "verb-kaku", "write", TOPICALIZED_OBJECT)), 1, "argument-particles-4", 4, MIXED, BASE_CONTROLLED_ACTIVITY_SHAPE, "satou", "satou-writes-diary"),
    act(task11Cue(L("noun-eki")), mixed(motion("noun-eki", "verb-iku", "go-direction", "noun-suzuki")), mixed(motion("noun-eki", "verb-iku", "go-goal", "noun-suzuki")), 0, "argument-particles-4", 5, MIXED, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(promptOf(mixed(withFinalParticle(means("noun-kasa", "verb-kaku", "write-means", "noun-mari"), "interaction", "interactional-ne"))), mixed(withFinalParticle(means("noun-enpitsu", "verb-kaku", "write-means", "noun-mari"), "interaction", "interactional-ne")), mixed(withFinalParticle(means("noun-kasa", "verb-kaku", "write-means", "noun-mari"), "interaction", "interactional-yo")), 1, "argument-particles-4", 6, MIXED, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-writes-pencil", "means-context-mismatch"),
    act(task11Cue(L("noun-nikki")), mixed(object("noun-nikki", "verb-yomu", "read", TOPICALIZED_OBJECT)), mixed(object("noun-nikki", "verb-yomu", "read", OBJECT_O)), 1, "argument-particles-4", 7, MIXED, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-daigaku")), mixed(roleAnnotated(motion("noun-daigaku", "verb-iku", "go-goal", "noun-yamada"), "analysis-goal")), mixed(roleAnnotated(motion("noun-daigaku", "verb-iku", "go-direction", "noun-yamada"), "analysis-direction")), 0, "argument-particles-4", 8, MIXED, BASE_CONTROLLED_ACTIVITY_SHAPE, "yamada", "yamada-goes-university"),
    act(task11Cue(L("noun-kouen")), mixed(motion("noun-kouen", "verb-iku", "go-direction", "noun-satou")), mixed(motion("noun-kouen", "verb-iku", "go-goal", "noun-satou")), 0, "argument-particles-4", 9, MIXED, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-kasa")), mixed(object("noun-kasa", "verb-kau", "buy", OBJECT_O, "noun-suzuki")), mixed(object("noun-nikki", "verb-kaku", "write", OBJECT_O, "noun-suzuki")), 1, "argument-particles-4", 10, MIXED, BASE_SPOKEN_ACTIVITY_SHAPE, "suzuki", "suzuki-buys-umbrella"),
  ],
  dialogue: null,
};

const ARGUMENT_SPECS = deepFreeze([L1, L2, L3, L4]);
const BUILT_ARGUMENT_LESSONS = ARGUMENT_SPECS.map(buildTask11Lesson);
const RAW_ARGUMENT_LESSONS = BUILT_ARGUMENT_LESSONS.map(({ lesson }) => lesson);

export const BASE_ARGUMENT_PARTICLES_LESSONS: readonly BaseSystemLessonContent[] =
  deepFreeze(
    RAW_ARGUMENT_LESSONS.map(({ content }) => content as BaseSystemLessonContent),
  );

export const BASE_ARGUMENT_PARTICLES_EXAMPLES: readonly BaseExample[] = deepFreeze(
  RAW_ARGUMENT_LESSONS.flatMap(({ examples }) => examples),
);

export const BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS: BaseValidationCatalogs =
  task11ValidationCatalogs(
    BASE_POLITE_VERBS_VALIDATION_CATALOGS,
    BUILT_ARGUMENT_LESSONS,
  );

const RAW_ARGUMENT_PARTICLES_MODULE: BaseArgumentParticlesModule = {
  id: "argument-particles",
  lessons: RAW_ARGUMENT_LESSONS,
  sequence: [
    ...BASE_POLITE_VERBS_LESSONS,
    ...BASE_ARGUMENT_PARTICLES_LESSONS,
  ],
  worldFacts: {
    learnerMeal: "rice",
    learnerRoute: "station",
    tanakaWorkplace: "office",
    suzukiPurchase: "umbrella",
  },
  worldFactIds: RAW_ARGUMENT_LESSONS.flatMap((lesson) =>
    lesson.activityDesigns.flatMap(({ worldFactId }) =>
      worldFactId ? [worldFactId] : [],
    ),
  ),
  worldFactLedger: worldFactLedgerFor(RAW_ARGUMENT_LESSONS),
};

export function validateBaseArgumentParticlesModule(
  value: unknown,
): Readonly<{ readonly ok: boolean; readonly errors: readonly BaseTask11ModuleError[] }> {
  const base = validateTask11ModuleBase(
    value,
    "argument-particles",
    ARGUMENT_SPECS.map(({ lessonId }) => lessonId),
    BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
  );
  if (!base.ok) return base;
  const semanticErrors = validateTask11SemanticReview([
    ...BASE_POLITE_VERBS_MODULE.lessons,
    ...RAW_ARGUMENT_LESSONS,
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
  if (!task11PlainDataEqual(value, RAW_ARGUMENT_PARTICLES_MODULE)) {
    return { ok: false, errors: ["invalid-module-shape"] };
  }
  const licensingFailure = RAW_ARGUMENT_LESSONS.some((lesson) =>
    [
      ...lesson.examples,
      ...lesson.activityDesigns.flatMap(
        ({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
          promptTarget,
          ...optionTargets,
          acceptedAnswerTarget,
        ],
      ),
    ].some(
      (target) =>
        target.particleFrame !== undefined &&
        !validateParticleFrame(
          target.particleFrame.predicateSenseId,
          target.particleFrame.provided,
        ).ok,
    ),
  );
  return licensingFailure
    ? { ok: false, errors: ["invalid-lesson-shape"] }
    : base;
}

export const module05ConceptIds = deepFreeze(
  ARGUMENT_SPECS.flatMap(({ introducedConceptIds }) => introducedConceptIds),
);

const validation = validateBaseArgumentParticlesModule(
  RAW_ARGUMENT_PARTICLES_MODULE,
);
if (!validation.ok) {
  const details = BASE_ARGUMENT_PARTICLES_LESSONS.flatMap((lesson) =>
    validateBaseLessonDepth(lesson, BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS),
  );
  const publication = RAW_ARGUMENT_LESSONS.flatMap((lesson) =>
    validatePublishedSemanticActivities(lesson)
      ? []
      : [lesson.content.lessonId],
  );
  throw new Error(
    `Invalid Base argument-particles module: ${validation.errors.join(", ")} ${JSON.stringify(details)} ${JSON.stringify(publication)}`,
  );
}

export const BASE_ARGUMENT_PARTICLES_MODULE: BaseArgumentParticlesModule =
  deepFreeze(RAW_ARGUMENT_PARTICLES_MODULE);
