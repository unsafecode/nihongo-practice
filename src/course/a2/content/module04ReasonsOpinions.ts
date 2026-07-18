/**
 * A2 Module 4 — Reasons & opinions (Phase 3 Task 4).
 *
 * Four instructional lessons: giving reasons with kara, giving softer/more
 * objective reasons with node, stating an opinion with to-omoimasu, and a
 * review/synthesis lesson practicing agree/disagree alongside opinion and
 * connector recall. Every sentence carries a semantic-ID-only variant; all
 * Japanese/romaji lives in the shared A2 semantic-value catalog
 * (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";

const MODULE_ID = "reasons-opinions";

function L(en: string, it: string) {
  return { en, it };
}

/** Bare invariant utterance (no subject slot) — used by every M4 family
 * (reason-kara, reason-node, opinion-toomou, agree-disagree,
 * plain-recognition, connector-utterance all share this shape). An explicit
 * `speakerRole` override is required for role diversity since these
 * families never carry a voiceable subject. */
function bareLine(
  id: string,
  family: string,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  speakerRole?: string,
): A2LineSpec {
  return {
    id,
    family,
    context,
    subjectReferent: null,
    subjectRealization: "omitted",
    slots: { predicate },
    translation,
    speakerRole,
  };
}

// ---------------------------------------------------------------------------
// Lesson reasons-opinions-1 — Give reasons: kara (ro1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "reasons-opinions-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-give-reasons",
  supportingCanDoIds: ["a2-cando-reason-kara"],
  introducedConceptIds: ["a2-concept-reason-kara"],
  introducedSenseIds: [],
  models: [
    bareLine("reasons-opinions-1-m1", "a2-family-reason-kara", "a2-value-kara-shiken-benkyou", "a2-context-reasons", L("There's an exam tomorrow, so I'll study.", "C'è un esame domani, quindi studio."), "a2-role-learner"),
    bareLine("reasons-opinions-1-m2", "a2-family-reason-kara", "a2-value-kara-isogashii-tsukareta", "a2-context-workplace", L("Work is busy, so I got tired.", "Il lavoro è impegnativo, quindi mi sono stancato/a."), "a2-role-colleague"),
    bareLine("reasons-opinions-1-m3", "a2-family-reason-kara", "a2-value-kara-suki-benkyou", "a2-context-reasons", L("I like Japanese food, so I study Japanese.", "Mi piace il cibo giapponese, quindi studio giapponese."), "a2-role-emi"),
    bareLine("reasons-opinions-1-m4", "a2-family-reason-kara", "a2-value-kara-ame-kasa", "a2-context-conversation", L("It's going to rain, so I'll bring an umbrella.", "Pioverà, quindi porto l'ombrello."), "a2-role-sora"),
    bareLine("reasons-opinions-1-m5", "a2-family-reason-kara", "a2-value-kara-tsukareta-neru", "a2-context-among-friends", L("I'm tired, so I'll sleep early.", "Sono stanco/a, quindi dormo presto."), "a2-role-friend"),
    bareLine("reasons-opinions-1-m6", "a2-family-reason-kara", "a2-value-kara-jikanganai-takushii", "a2-context-workplace", L("There's no time, so I'll go by taxi.", "Non c'è tempo, quindi vado in taxi."), "a2-role-teacher"),
    bareLine("reasons-opinions-1-m7", "a2-family-reason-kara", "a2-value-kara-samui-uchi", "a2-context-reasons", L("It's cold, so I'll stay home.", "Fa freddo, quindi resto a casa."), "a2-role-colleague"),
    bareLine("reasons-opinions-1-m8", "a2-family-reason-kara", "a2-value-kara-shigoto-owatta", "a2-context-conversation", L("Work is over, so I'll go home.", "Il lavoro è finito, quindi torno a casa."), "a2-role-emi"),
  ],
  transfers: [
    bareLine("reasons-opinions-1-t1", "a2-family-reason-kara", "a2-value-kara-shiken-benkyou", "a2-context-conversation", L("There's an exam tomorrow, so I'll study.", "C'è un esame domani, quindi studio."), "a2-role-sora"),
    bareLine("reasons-opinions-1-t2", "a2-family-reason-kara", "a2-value-kara-isogashii-tsukareta", "a2-context-reasons", L("Work is busy, so I got tired.", "Il lavoro è impegnativo, quindi mi sono stancato/a."), "a2-role-friend"),
    bareLine("reasons-opinions-1-t3", "a2-family-reason-kara", "a2-value-kara-suki-benkyou", "a2-context-among-friends", L("I like Japanese food, so I study Japanese.", "Mi piace il cibo giapponese, quindi studio giapponese."), "a2-role-colleague"),
    bareLine("reasons-opinions-1-t4", "a2-family-reason-kara", "a2-value-kara-ame-kasa", "a2-context-workplace", L("It's going to rain, so I'll bring an umbrella.", "Pioverà, quindi porto l'ombrello."), "a2-role-learner"),
    bareLine("reasons-opinions-1-t5", "a2-family-reason-kara", "a2-value-kara-tsukareta-neru", "a2-context-conversation", L("I'm tired, so I'll sleep early.", "Sono stanco/a, quindi dormo presto."), "a2-role-emi"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson reasons-opinions-2 — Give reasons (softer/objective): node (ro2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "reasons-opinions-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-reason-node",
  supportingCanDoIds: ["a2-cando-give-reasons"],
  introducedConceptIds: ["a2-concept-reason-node"],
  introducedSenseIds: [],
  models: [
    bareLine("reasons-opinions-2-m1", "a2-family-reason-node", "a2-value-node-ame-ie", "a2-context-reasons", L("It rained, so I stayed home.", "Ha piovuto, quindi sono rimasto/a a casa."), "a2-role-learner"),
    bareLine("reasons-opinions-2-m2", "a2-family-reason-node", "a2-value-node-isogashikatta-dekakenakatta", "a2-context-workplace", L("Work was busy, so I didn't go out.", "Il lavoro era impegnativo, quindi non sono uscito/a."), "a2-role-colleague"),
    bareLine("reasons-opinions-2-m3", "a2-family-reason-node", "a2-value-node-densha-kaigi", "a2-context-workplace", L("The train was delayed, so I was late for the meeting.", "Il treno era in ritardo, quindi sono arrivato/a tardi alla riunione."), "a2-role-teacher"),
    bareLine("reasons-opinions-2-m4", "a2-family-reason-node", "a2-value-node-ame-futta-uchi", "a2-context-conversation", L("It rained, so I was at home.", "Ha piovuto, quindi ero a casa."), "a2-role-emi"),
    bareLine("reasons-opinions-2-m5", "a2-family-reason-node", "a2-value-node-jikanganakatta-takushii", "a2-context-reasons", L("There was no time, so I went by taxi.", "Non c'era tempo, quindi sono andato/a in taxi."), "a2-role-sora"),
    bareLine("reasons-opinions-2-m6", "a2-family-reason-node", "a2-value-node-samukatta-kooto", "a2-context-among-friends", L("It was cold, so I wore a coat.", "Faceva freddo, quindi ho indossato un cappotto."), "a2-role-friend"),
    bareLine("reasons-opinions-2-m7", "a2-family-reason-node", "a2-value-node-shigoto-owatta-kaetta", "a2-context-workplace", L("Work finished, so I went home.", "Il lavoro è finito, quindi sono tornato/a a casa."), "a2-role-colleague"),
    bareLine("reasons-opinions-2-m8", "a2-family-reason-node", "a2-value-node-byouki-yasunda", "a2-context-reasons", L("I was sick, so I was absent from school.", "Ero malato/a, quindi ho saltato la scuola."), "a2-role-emi"),
  ],
  transfers: [
    bareLine("reasons-opinions-2-t1", "a2-family-reason-node", "a2-value-node-ame-ie", "a2-context-conversation", L("It rained, so I stayed home.", "Ha piovuto, quindi sono rimasto/a a casa."), "a2-role-sora"),
    bareLine("reasons-opinions-2-t2", "a2-family-reason-node", "a2-value-node-isogashikatta-dekakenakatta", "a2-context-reasons", L("Work was busy, so I didn't go out.", "Il lavoro era impegnativo, quindi non sono uscito/a."), "a2-role-friend"),
    bareLine("reasons-opinions-2-t3", "a2-family-reason-node", "a2-value-node-densha-kaigi", "a2-context-among-friends", L("The train was delayed, so I was late for the meeting.", "Il treno era in ritardo, quindi sono arrivato/a tardi alla riunione."), "a2-role-learner"),
    bareLine("reasons-opinions-2-t4", "a2-family-reason-node", "a2-value-node-ame-futta-uchi", "a2-context-workplace", L("It rained, so I was at home.", "Ha piovuto, quindi ero a casa."), "a2-role-colleague"),
    bareLine("reasons-opinions-2-t5", "a2-family-reason-node", "a2-value-node-jikanganakatta-takushii", "a2-context-conversation", L("There was no time, so I went by taxi.", "Non c'era tempo, quindi sono andato/a in taxi."), "a2-role-emi"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson reasons-opinions-3 — Opinion: to-omoimasu + plain-form support (ro3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "reasons-opinions-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-opinion-toomou",
  supportingCanDoIds: ["a2-cando-recognize-plain-forms"],
  introducedConceptIds: ["a2-concept-opinion-toomou"],
  introducedSenseIds: [],
  models: [
    bareLine("reasons-opinions-3-m1", "a2-family-opinion-toomou", "a2-value-toomou-kore-ii", "a2-context-conversation", L("I think this is good.", "Penso che questo sia buono."), "a2-role-learner"),
    bareLine("reasons-opinions-3-m2", "a2-family-opinion-toomou", "a2-value-toomou-benkyou-taihen", "a2-context-reasons", L("I think Japanese study is tough.", "Penso che lo studio del giapponese sia impegnativo."), "a2-role-emi"),
    bareLine("reasons-opinions-3-m3", "a2-family-opinion-toomou", "a2-value-toomou-sora-isogashii", "a2-context-workplace", L("I think Sora is busy.", "Penso che Sora sia occupato."), "a2-role-friend"),
    bareLine("reasons-opinions-3-m4", "a2-family-opinion-toomou", "a2-value-toomou-yokunai", "a2-context-among-friends", L("I think that's not good.", "Penso che non sia buono."), "a2-role-colleague"),
    bareLine("reasons-opinions-3-m5", "a2-family-opinion-toomou", "a2-value-toomou-hon-omoshiroi", "a2-context-conversation", L("I think this book is interesting.", "Penso che questo libro sia interessante."), "a2-role-sora"),
    bareLine("reasons-opinions-3-m6", "a2-family-plain-recognition", "a2-value-plain-iku-dict", "a2-context-among-friends", L("I'm going.", "Vado."), "a2-role-teacher"),
    bareLine("reasons-opinions-3-m7", "a2-family-plain-recognition", "a2-value-plain-taberu-past", "a2-context-reasons", L("I ate it.", "L'ho mangiato."), "a2-role-emi"),
    bareLine("reasons-opinions-3-m8", "a2-family-plain-recognition", "a2-value-plain-hanasu-dict", "a2-context-conversation", L("I'm going to talk.", "Parlo."), "a2-role-friend"),
  ],
  transfers: [
    bareLine("reasons-opinions-3-t1", "a2-family-opinion-toomou", "a2-value-toomou-kore-ii", "a2-context-workplace", L("I think this is good.", "Penso che questo sia buono."), "a2-role-friend"),
    bareLine("reasons-opinions-3-t2", "a2-family-opinion-toomou", "a2-value-toomou-benkyou-taihen", "a2-context-among-friends", L("I think Japanese study is tough.", "Penso che lo studio del giapponese sia impegnativo."), "a2-role-colleague"),
    bareLine("reasons-opinions-3-t3", "a2-family-plain-recognition", "a2-value-plain-matsu-past-neg", "a2-context-among-friends", L("I didn't wait.", "Non ho aspettato."), "a2-role-learner"),
    bareLine("reasons-opinions-3-t4", "a2-family-plain-recognition", "a2-value-plain-oyogu-dict", "a2-context-reasons", L("I'm going to swim.", "Nuoto."), "a2-role-friend"),
    bareLine("reasons-opinions-3-t5", "a2-family-plain-recognition", "a2-value-plain-asobu-dict", "a2-context-conversation", L("I'm going to play.", "Gioco."), "a2-role-teacher"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson reasons-opinions-4 — Agree/disagree review + opinion/connectors (ro4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "reasons-opinions-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-agree-disagree",
  supportingCanDoIds: ["a2-cando-opinion-toomou", "a2-cando-connectors"],
  introducedConceptIds: ["a2-concept-agree-disagree"],
  introducedSenseIds: [],
  models: [
    bareLine("reasons-opinions-4-m1", "a2-family-agree-disagree", "a2-value-agree-soudesune", "a2-context-conversation", L("That's right, isn't it.", "È vero, no?"), "a2-role-emi"),
    bareLine("reasons-opinions-4-m2", "a2-family-agree-disagree", "a2-value-agree-watashimo", "a2-context-among-friends", L("I think so too.", "Penso anch'io così."), "a2-role-friend"),
    bareLine("reasons-opinions-4-m3", "a2-family-agree-disagree", "a2-value-agree-sansei", "a2-context-workplace", L("I'm in favor.", "Sono d'accordo."), "a2-role-colleague"),
    bareLine("reasons-opinions-4-m4", "a2-family-agree-disagree", "a2-value-agree-hontou-soudesune", "a2-context-conversation", L("That's really true, isn't it.", "È proprio vero, no?"), "a2-role-sora"),
    bareLine("reasons-opinions-4-m5", "a2-family-agree-disagree", "a2-value-disagree-chigau", "a2-context-among-friends", L("Is that so? I think it's different.", "Ah sì? Penso che sia diverso."), "a2-role-teacher"),
    bareLine("reasons-opinions-4-m6", "a2-family-agree-disagree", "a2-value-disagree-omoimasen", "a2-context-workplace", L("I don't think so.", "Non penso così."), "a2-role-learner"),
    bareLine("reasons-opinions-4-m7", "a2-family-opinion-toomou", "a2-value-toomou-sora-isogashii", "a2-context-reasons", L("I think Sora is busy.", "Penso che Sora sia occupato."), "a2-role-emi"),
    bareLine("reasons-opinions-4-m8", "a2-family-connector-utterance", "a2-value-connector-ame-sorekara-hare", "a2-context-conversation", L("It rained. Then, it cleared up.", "Ha piovuto. Poi si è schiarito."), "a2-role-friend"),
  ],
  transfers: [
    bareLine("reasons-opinions-4-t1", "a2-family-agree-disagree", "a2-value-agree-watashimo", "a2-context-workplace", L("I think so too.", "Penso anch'io così."), "a2-role-colleague"),
    bareLine("reasons-opinions-4-t2", "a2-family-agree-disagree", "a2-value-disagree-chigau", "a2-context-conversation", L("Is that so? I think it's different.", "Ah sì? Penso che sia diverso."), "a2-role-sora"),
    bareLine("reasons-opinions-4-t3", "a2-family-agree-disagree", "a2-value-disagree-omoimasen", "a2-context-among-friends", L("I don't think so.", "Non penso così."), "a2-role-teacher"),
    bareLine("reasons-opinions-4-t4", "a2-family-opinion-toomou", "a2-value-toomou-yokunai", "a2-context-reasons", L("I think that's not good.", "Penso che non sia buono."), "a2-role-learner"),
    bareLine("reasons-opinions-4-t5", "a2-family-connector-utterance", "a2-value-connector-shigoto-sorekara-kaeru", "a2-context-workplace", L("I finish work. Then, I go home.", "Finisco il lavoro. Poi torno a casa."), "a2-role-emi"),
  ],
});

export const module4Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module4Recipe = A2_MODULE_MANIFEST[MODULE_ID];
