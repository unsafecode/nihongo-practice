/**
 * A2 Module 15 - a2-synthesis, the capstone contract-synthesis module
 * (Phase 3 Task 7).
 *
 * Four bounded, lived-scenario lessons recombining ONLY families/senses/
 * values already taught in M1-M14 - every lesson is authored with
 * `contract: "synthesis"` and empty `introducedConceptIds`/
 * `introducedSenseIds`, enforced by `defineA2Lesson` itself (never a new
 * concept/sense/family/value anywhere in this file). as1 (a2-synthesis-1,
 * scenario-weekend-outing) supports intentions-plans/connectors, and also
 * carries genuine recognize-plain-forms recurrence content (unlabeled, per
 * the established "recipe caps supports at two" precedent - see
 * module12TravelReservations.ts's own reason-node precedent). as2
 * (a2-synthesis-2, scenario-service-shopping) supports compare/
 * permission-temoii, plus genuine ongoing-teiru/prohibition-tewaikenai/
 * opinion-toomou/possibility recurrence content. as3 (a2-synthesis-3,
 * scenario-health-absence) supports reason-kara/request-tekudasai, plus
 * genuine sequence-te/request-negative/reason-node recurrence content. as4
 * (a2-synthesis-4, scenario-trip-recount - the checkpoint scenario)
 * supports experience-takoto/recognize-plain-forms. Every one of the 15
 * grammar-spiral forms recurs across these four lessons (see
 * `forms/grammarSpiral.ts`). Every sentence carries a semantic-ID-only
 * variant; all Japanese/romaji lives in the shared A2 semantic-value
 * catalog (`a2SemanticCatalog.ts`), authored in M1-M14 only.
 */
import { A2_MODULE_MANIFEST } from "../manifest";
import type { FormSelection } from "../../foundations/types";
import {
  A2_AFFIRMATIVE_PAST_PLAIN,
  A2_AFFIRMATIVE_PAST_POLITE,
  A2_AFFIRMATIVE_PRESENT_PLAIN,
  A2_NEGATIVE_PAST_PLAIN,
  A2_NEGATIVE_PRESENT_PLAIN,
  buildA2InstructionalLesson,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";

const MODULE_ID = "a2-synthesis";

function L(en: string, it: string) {
  return { en, it };
}

interface LineOptions {
  readonly subjectValueId?: string | null;
  readonly object?: string | null;
  readonly favored?: string | null;
  readonly standard?: string | null;
  readonly speakerRole?: string;
  readonly interrogative?: boolean;
  /** Explicit register override for an invariant-family line whose baked
   * semantic value is NOT affirmative/present/polite (plain-recognition's
   * plain forms, a connector/te-sequence/reason-node past-polite bake, etc.).
   * Threaded straight through to the shared `A2LineSpec.form` so the variant's
   * FormSelection honestly matches the register its own baked Japanese carries
   * in M1-M14 — never silently defaulting to affirmative/present/polite. */
  readonly form?: FormSelection;
}

/** A synthesis line: the "subject" slot, when present, is always a DIRECT
 * semantic value - never a tracked discourse referent - mirroring
 * module13RelationshipsEvents.ts's/module14PracticalTexts.ts's own `line()`
 * shape exactly. `favored`/`standard` back a2-family-comparison-favor's own
 * two object slots (no subject slot at all on that family). */
function line(
  id: string,
  family: string,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  options: LineOptions = {},
): A2LineSpec {
  const subjectValueId = options.subjectValueId ?? null;
  const slots: Record<string, string> = { predicate };
  if (subjectValueId !== null) {
    slots.subject = subjectValueId;
  }
  if (options.object) {
    slots.object = options.object;
  }
  if (options.favored) {
    slots.favored = options.favored;
  }
  if (options.standard) {
    slots.standard = options.standard;
  }
  return {
    id,
    family,
    context,
    subjectReferent: null,
    subjectRealization: subjectValueId === null ? "omitted" : "explicit",
    slots,
    translation,
    interrogative: options.interrogative,
    form: options.form,
    speakerRole: options.speakerRole,
  };
}

const OUTING = "a2-context-outing";
const PLANS = "a2-context-plans";
const SHOPPING = "a2-context-shopping";
const NEIGHBORHOOD = "a2-context-neighborhood";
const HEALTH = "a2-context-health";
const WORKPLACE = "a2-context-workplace";
const EXPERIENCES = "a2-context-experiences";
const TRAVEL = "a2-context-travel";

// ---------------------------------------------------------------------------
// Lesson a2-synthesis-1 - Scenario: weekend outing (as1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "a2-synthesis-1",
  moduleId: MODULE_ID,
  order: 1,
  contract: "synthesis",
  primaryCanDoId: "a2-cando-scenario-weekend-outing",
  supportingCanDoIds: ["a2-cando-intentions-plans", "a2-cando-connectors"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    line("a2-synthesis-1-m1", "a2-family-plan-yotei", "a2-value-yotei-iku-kyouto", OUTING, L("I'm planning to go to Kyoto.", "Ho in programma di andare a Kyoto."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-1-m2", "a2-family-plan-tsumori", "a2-value-tsumori-au-tomodachi", OUTING, L("I intend to meet a friend this weekend.", "Ho intenzione di incontrare un amico questo weekend."), { speakerRole: "a2-role-friend" }),
    line("a2-synthesis-1-m3", "a2-family-connector-utterance", "a2-value-connector-ame-demo-dekakeru", PLANS, L("Today it's raining, but I'll go out.", "Oggi piove, ma esco lo stesso."), { speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-1-m4", "a2-family-connector-utterance", "a2-value-connector-shigoto-sorekara-kaeru", PLANS, L("Work finished. Then, I went home.", "Il lavoro è finito. Poi sono tornato a casa."), { speakerRole: "a2-role-teacher", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("a2-synthesis-1-m5", "a2-family-plain-recognition", "a2-value-plain-iku-dict", OUTING, L("(casual speech) go", "(discorso informale) andare"), { speakerRole: "a2-role-learner", form: A2_AFFIRMATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-1-m6", "a2-family-plain-recognition", "a2-value-plain-taberu-past", OUTING, L("(casual speech) ate", "(discorso informale) ho mangiato"), { speakerRole: "a2-role-friend", form: A2_AFFIRMATIVE_PAST_PLAIN }),
    line("a2-synthesis-1-m7", "a2-family-plan-yotei", "a2-value-yotei-oyogu-shuumatsu", OUTING, L("Sora is planning to swim at the sea this weekend.", "Sora ha in programma di nuotare al mare questo weekend."), { subjectValueId: "a2-value-sora", speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-1-m8", "a2-family-connector-utterance", "a2-value-connector-ame-sorekara-hare", PLANS, L("In the morning it rained. Then, it cleared up.", "Al mattino ha piovuto. Poi si è schiarito."), { speakerRole: "a2-role-teacher", form: A2_AFFIRMATIVE_PAST_POLITE }),
  ],
  // Every transfer recombines an already-taught family with a fresh value
  // not used above, so all 5 transfers stay visibly novel while never
  // introducing anything new.
  transfers: [
    line("a2-synthesis-1-t1", "a2-family-plan-tsumori", "a2-value-tsumori-yomu-hon", OUTING, L("My friend intends to read a book this weekend.", "Il mio amico ha intenzione di leggere un libro questo weekend."), { subjectValueId: "a2-value-friend-subject", speakerRole: "a2-role-friend" }),
    line("a2-synthesis-1-t2", "a2-family-connector-utterance", "a2-value-connector-samui-demo-genki", PLANS, L("Today it's cold, but I'm well.", "Oggi fa freddo, ma sto bene."), { speakerRole: "a2-role-teacher" }),
    line("a2-synthesis-1-t3", "a2-family-plain-recognition", "a2-value-plain-hanasu-dict", OUTING, L("(casual speech) speak", "(discorso informale) parlare"), { speakerRole: "a2-role-colleague", form: A2_AFFIRMATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-1-t4", "a2-family-plan-yotei", "a2-value-yotei-au-doyoubi", OUTING, L("The colleague is planning to meet a friend on Saturday.", "Il collega ha in programma di incontrare un amico sabato."), { subjectValueId: "a2-value-colleague-subject", speakerRole: "a2-role-learner" }),
    line("a2-synthesis-1-t5", "a2-family-connector-utterance", "a2-value-connector-shukudai-sorekara-terebi", PLANS, L("My friend will do homework, then watch TV.", "Il mio amico farà i compiti, poi guarderà la TV."), { subjectValueId: "a2-value-friend-subject", speakerRole: "a2-role-friend" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson a2-synthesis-2 - Scenario: service/shopping (as2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "a2-synthesis-2",
  moduleId: MODULE_ID,
  order: 2,
  contract: "synthesis",
  primaryCanDoId: "a2-cando-scenario-service-shopping",
  supportingCanDoIds: ["a2-cando-compare", "a2-cando-permission-temoii"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    line("a2-synthesis-2-m1", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("The bag is cheaper than the shoes.", "La borsa è più economica delle scarpe."), { favored: "a2-value-obj-kaban", standard: "a2-value-obj-kutsu", speakerRole: "a2-role-learner" }),
    line("a2-synthesis-2-m2", "a2-family-permission-temoii", "a2-value-temoii-taberu", SHOPPING, L("May I eat this?", "Posso mangiare questo?"), { object: "a2-value-obj-kore-m6", interrogative: true, speakerRole: "a2-role-friend" }),
    line("a2-synthesis-2-m3", "a2-family-ongoing-teiru", "a2-value-teiru-paatii-shiteimasu", SHOPPING, L("I'm having a party.", "Sto facendo una festa."), { object: "a2-value-obj-paatii", speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-2-m4", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-shashin", SHOPPING, L("You must not take photos.", "Non si possono scattare foto."), { object: "a2-value-obj-shashin", speakerRole: "a2-role-teacher" }),
    line("a2-synthesis-2-m5", "a2-family-opinion-toomou", "a2-value-opinion-kaban-ii", SHOPPING, L("I think this bag is better.", "Penso che questa borsa sia migliore."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-2-m6", "a2-family-possibility", "a2-value-possibility-tsukau", NEIGHBORHOOD, L("You can use a card.", "Si può usare la carta."), { object: "a2-value-obj-kaado", speakerRole: "a2-role-friend" }),
    line("a2-synthesis-2-m7", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("The train is cheaper than the bus.", "Il treno è più economico dell'autobus."), { favored: "a2-value-obj-densha-m12", standard: "a2-value-obj-basu", speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-2-m8", "a2-family-possibility", "a2-value-possibility-yomu", NEIGHBORHOOD, L("You can read the menu.", "Si può leggere il menu."), { object: "a2-value-obj-menyuu", speakerRole: "a2-role-teacher" }),
  ],
  // Every transfer recombines an already-taught family with a fresh value
  // (or a fresh subject wrapper on an already-modeled value) not used
  // above, so all 5 transfers stay visibly novel while never introducing
  // anything new. t1 is the genuine compare TRANSFER (support); t2 is the
  // genuine permission-temoii TRANSFER (support); t3-t5 give the remaining
  // three unlabeled families their own transfer-shaped recombination too.
  transfers: [
    line("a2-synthesis-2-t1", "a2-family-comparison-favor", "a2-value-takai-stem", SHOPPING, L("The shoes are more expensive than the bag.", "Le scarpe sono più costose della borsa."), { favored: "a2-value-obj-kutsu", standard: "a2-value-obj-kaban", speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-2-t2", "a2-family-permission-temoii", "a2-value-temoii-nomu", SHOPPING, L("May I drink water?", "Posso bere l'acqua?"), { object: "a2-value-obj-mizu", interrogative: true, speakerRole: "a2-role-friend" }),
    line("a2-synthesis-2-t3", "a2-family-ongoing-teiru", "a2-value-teiru-paatii-shiteimasu", SHOPPING, L("Sora is having a party.", "Sora sta facendo una festa."), { subjectValueId: "a2-value-sora", object: "a2-value-obj-paatii", speakerRole: "a2-role-teacher" }),
    line("a2-synthesis-2-t4", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-taberu", SHOPPING, L("You must not eat the meat.", "Non si può mangiare la carne."), { object: "a2-value-obj-niku", speakerRole: "a2-role-learner" }),
    line("a2-synthesis-2-t5", "a2-family-opinion-toomou", "a2-value-opinion-eiga-omoshiroi", SHOPPING, L("I think this movie is interesting.", "Penso che questo film sia interessante."), { speakerRole: "a2-role-friend" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson a2-synthesis-3 - Scenario: health absence (as3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "a2-synthesis-3",
  moduleId: MODULE_ID,
  order: 3,
  contract: "synthesis",
  primaryCanDoId: "a2-cando-scenario-health-absence",
  supportingCanDoIds: ["a2-cando-reason-kara", "a2-cando-request-tekudasai"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    line("a2-synthesis-3-m1", "a2-family-reason-kara", "a2-value-kara-atama-yasumu", HEALTH, L("My head hurts, so I should rest.", "Mi fa male la testa, quindi dovrei riposare."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-3-m2", "a2-family-request-tekudasai", "a2-value-tekudasai-tasukete", WORKPLACE, L("Please help.", "Per favore, aiutami."), { speakerRole: "a2-role-friend" }),
    line("a2-synthesis-3-m3", "a2-family-te-sequence", "a2-value-seq-owatte-kaeru", WORKPLACE, L("Work finishes, then I go home.", "Il lavoro finisce, poi torno a casa."), { speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-3-m4", "a2-family-negative-request", "a2-value-naidekudasai-muri", HEALTH, L("Please don't overdo it.", "Per favore, non strafare."), { speakerRole: "a2-role-teacher" }),
    line("a2-synthesis-3-m5", "a2-family-reason-node", "a2-value-node-netsu-yasumu", HEALTH, L("I have a fever, so I'll rest today.", "Ho la febbre, quindi oggi riposo."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-3-m6", "a2-family-reason-kara", "a2-value-kara-densha-okureru", WORKPLACE, L("My friend will be a bit late because the train is delayed.", "Il mio amico farà un po' tardi perché il treno è in ritardo."), { subjectValueId: "a2-value-friend-subject", speakerRole: "a2-role-friend" }),
    line("a2-synthesis-3-m7", "a2-family-request-tekudasai", "a2-value-tekudasai-matsu", WORKPLACE, L("Please wait.", "Per favore, aspetta."), { speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-3-m8", "a2-family-te-sequence", "a2-value-seq-hataraite-tsukareta", HEALTH, L("I worked, and got tired.", "Ho lavorato e mi sono stancato."), { speakerRole: "a2-role-teacher", form: A2_AFFIRMATIVE_PAST_POLITE }),
  ],
  // Every transfer recombines an already-taught family with a fresh value
  // not used above, so all 5 transfers stay visibly novel while never
  // introducing anything new. t1 is the genuine reason-kara TRANSFER
  // (support); t2 is the genuine request-tekudasai TRANSFER (support);
  // t3-t5 give the remaining three unlabeled families their own
  // transfer-shaped recombination too.
  transfers: [
    line("a2-synthesis-3-t1", "a2-family-reason-kara", "a2-value-kara-shigoto-owatta", HEALTH, L("Work is over, so I'll go home.", "Il lavoro è finito, quindi torno a casa."), { speakerRole: "a2-role-friend" }),
    line("a2-synthesis-3-t2", "a2-family-request-tekudasai", "a2-value-tekudasai-suwaru", WORKPLACE, L("Please sit down.", "Per favore, siediti."), { speakerRole: "a2-role-teacher" }),
    line("a2-synthesis-3-t3", "a2-family-te-sequence", "a2-value-seq-aratte-neru", HEALTH, L("I wash my face, then go to sleep.", "Mi lavo la faccia, poi vado a dormire."), { speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-3-t4", "a2-family-negative-request", "a2-value-naidekudasai-hataraku", WORKPLACE, L("Please don't work right now.", "Per favore, non lavori adesso."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-3-t5", "a2-family-reason-node", "a2-value-node-byouki-yasunda", HEALTH, L("I was ill, so I stayed home from school.", "Ero malato, quindi ho saltato la scuola."), { speakerRole: "a2-role-friend", form: A2_AFFIRMATIVE_PAST_POLITE }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson a2-synthesis-4 - Scenario: trip recount (as4, the checkpoint
// scenario)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "a2-synthesis-4",
  moduleId: MODULE_ID,
  order: 4,
  contract: "synthesis",
  primaryCanDoId: "a2-cando-scenario-trip-recount",
  supportingCanDoIds: ["a2-cando-experience-takoto", "a2-cando-recognize-plain-forms"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    line("a2-synthesis-4-m1", "a2-family-experience-takoto", "a2-value-exp-itta-tokyo", EXPERIENCES, L("I have been to Tokyo.", "Sono stato a Tokyo."), { speakerRole: "a2-role-learner" }),
    line("a2-synthesis-4-m2", "a2-family-experience-takoto", "a2-value-exp-nobotta-fuji", EXPERIENCES, L("I have climbed Mt. Fuji.", "Ho scalato il Monte Fuji."), { speakerRole: "a2-role-friend" }),
    line("a2-synthesis-4-m3", "a2-family-plain-recognition", "a2-value-plain-oyogu-dict", TRAVEL, L("(casual speech) swim", "(discorso informale) nuotare"), { speakerRole: "a2-role-colleague", form: A2_AFFIRMATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-4-m4", "a2-family-plain-recognition", "a2-value-plain-asobu-dict", TRAVEL, L("(casual speech) play/hang out", "(discorso informale) divertirsi"), { speakerRole: "a2-role-teacher", form: A2_AFFIRMATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-4-m5", "a2-family-experience-takoto", "a2-value-exp-tabeta-sushi", EXPERIENCES, L("My friend has eaten sushi.", "Il mio amico ha mangiato sushi."), { subjectValueId: "a2-value-friend-subject", speakerRole: "a2-role-learner" }),
    line("a2-synthesis-4-m6", "a2-family-experience-takoto", "a2-value-exp-shinkansen-notta", TRAVEL, L("Sora has ridden the shinkansen.", "Sora ha preso lo shinkansen."), { subjectValueId: "a2-value-sora", speakerRole: "a2-role-friend" }),
    line("a2-synthesis-4-m7", "a2-family-plain-recognition", "a2-value-plain-yomu-neg", EXPERIENCES, L("(casual speech) doesn't read", "(discorso informale) non legge"), { speakerRole: "a2-role-colleague", form: A2_NEGATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-4-m8", "a2-family-plain-recognition", "a2-value-plain-matsu-past-neg", TRAVEL, L("(casual speech) didn't wait", "(discorso informale) non ha aspettato"), { speakerRole: "a2-role-teacher", form: A2_NEGATIVE_PAST_PLAIN }),
  ],
  // Every transfer recombines an already-taught family with a fresh value
  // (or a fresh subject wrapper on an already-modeled value) not used
  // above, so all 5 transfers stay visibly novel while never introducing
  // anything new. t1-t3 are further experience-takoto TRANSFER evidence
  // (support); t4-t5 give recognize-plain-forms its own transfer-shaped
  // recombination too.
  transfers: [
    line("a2-synthesis-4-t1", "a2-family-experience-takoto", "a2-value-exp-itta-oosaka", EXPERIENCES, L("Emi has been to Osaka.", "Emi è stata a Osaka."), { subjectValueId: "a2-value-emi", speakerRole: "a2-role-friend" }),
    line("a2-synthesis-4-t2", "a2-family-experience-takoto", "a2-value-exp-matta-tomodachi", TRAVEL, L("The teacher has waited for a friend.", "L'insegnante ha aspettato un amico."), { subjectValueId: "a2-value-teacher-subject", speakerRole: "a2-role-colleague" }),
    line("a2-synthesis-4-t3", "a2-family-experience-takoto", "a2-value-exp-kekkonshiki-itta", EXPERIENCES, L("The colleague has been to a wedding.", "Il collega è stato a un matrimonio."), { subjectValueId: "a2-value-colleague-subject", speakerRole: "a2-role-learner" }),
    line("a2-synthesis-4-t4", "a2-family-plain-recognition", "a2-value-plain-hanasu-dict", EXPERIENCES, L("(casual speech) speak", "(discorso informale) parlare"), { speakerRole: "a2-role-friend", form: A2_AFFIRMATIVE_PRESENT_PLAIN }),
    line("a2-synthesis-4-t5", "a2-family-experience-takoto", "a2-value-exp-oyoida", TRAVEL, L("I have swum before.", "Ho già nuotato."), { speakerRole: "a2-role-teacher" }),
  ],
});

export const module15Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module15Recipe = A2_MODULE_MANIFEST[MODULE_ID];
