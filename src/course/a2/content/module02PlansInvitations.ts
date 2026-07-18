/**
 * A2 Module 2 — Plans & invitations (Phase 3 Task 4).
 *
 * Four instructional lessons covering making plans (yotei), stating
 * intentions (tsumori), inviting/accepting/declining, and arranging a
 * meeting time and place. Every sentence carries a semantic-ID-only
 * variant; all Japanese/romaji lives in the shared A2 semantic-value
 * catalog (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";

const MODULE_ID = "plans-invitations";

function L(en: string, it: string) {
  return { en, it };
}

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
// Lesson plans-invitations-1 — Intentions & plans: yotei (pi1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "plans-invitations-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-intentions-plans",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-intentions-yotei"],
  introducedSenseIds: ["a2-sense-au"],
  models: [
    bareLine("plans-invitations-1-m1", "a2-family-plan-yotei", "a2-value-yotei-iku-kyouto", "a2-context-plans", L("I plan to go to Kyoto.", "Ho intenzione di andare a Kyoto."), "a2-role-friend"),
    bareLine("plans-invitations-1-m2", "a2-family-plan-yotei", "a2-value-yotei-au-doyoubi", "a2-context-plans", L("I plan to meet a friend on Saturday.", "Ho intenzione di incontrare un amico sabato."), "a2-role-emi"),
    bareLine("plans-invitations-1-m3", "a2-family-plan-yotei", "a2-value-yotei-matsu-raishuu", "a2-context-conversation", L("I plan to wait for Sora next week.", "Ho intenzione di aspettare Sora la settimana prossima."), "a2-role-sora"),
    bareLine("plans-invitations-1-m4", "a2-family-plan-yotei", "a2-value-yotei-taberu-ashita", "a2-context-plans", L("Tomorrow I plan to have a meal with a friend.", "Domani ho intenzione di mangiare con un amico."), "a2-role-friend"),
    bareLine("plans-invitations-1-m5", "a2-family-plan-yotei", "a2-value-yotei-oyogu-shuumatsu", "a2-context-cafe", L("This weekend I plan to swim at the sea.", "Questo weekend ho intenzione di nuotare al mare."), "a2-role-colleague"),
    bareLine("plans-invitations-1-m6", "a2-family-plan-yotei", "a2-value-yotei-iku-oosaka", "a2-context-plans", L("Next month I plan to go to Osaka.", "Il mese prossimo ho intenzione di andare a Osaka."), "a2-role-learner"),
    bareLine("plans-invitations-1-m7", "a2-family-plan-yotei", "a2-value-yotei-au-emi", "a2-context-among-friends", L("On Saturday I plan to meet Emi.", "Sabato ho intenzione di incontrare Emi."), "a2-role-teacher"),
    bareLine("plans-invitations-1-m8", "a2-family-plan-yotei", "a2-value-yotei-matsu-douryou", "a2-context-workplace", L("This week I plan to wait for a colleague.", "Questa settimana ho intenzione di aspettare un collega."), "a2-role-colleague"),
  ],
  transfers: [
    bareLine("plans-invitations-1-t1", "a2-family-plan-yotei", "a2-value-yotei-iku-kyouto", "a2-context-among-friends", L("I plan to go to Kyoto.", "Ho intenzione di andare a Kyoto."), "a2-role-colleague"),
    bareLine("plans-invitations-1-t2", "a2-family-plan-yotei", "a2-value-yotei-au-doyoubi", "a2-context-cafe", L("I plan to meet a friend on Saturday.", "Ho intenzione di incontrare un amico sabato."), "a2-role-learner"),
    bareLine("plans-invitations-1-t3", "a2-family-plan-yotei", "a2-value-yotei-matsu-raishuu", "a2-context-workplace", L("I plan to wait for Sora next week.", "Ho intenzione di aspettare Sora la settimana prossima."), "a2-role-teacher"),
    bareLine("plans-invitations-1-t4", "a2-family-plan-yotei", "a2-value-yotei-taberu-ashita", "a2-context-conversation", L("Tomorrow I plan to have a meal with a friend.", "Domani ho intenzione di mangiare con un amico."), "a2-role-sora"),
    bareLine("plans-invitations-1-t5", "a2-family-plan-yotei", "a2-value-yotei-oyogu-shuumatsu", "a2-context-among-friends", L("This weekend I plan to swim at the sea.", "Questo weekend ho intenzione di nuotare al mare."), "a2-role-emi"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson plans-invitations-2 — Intentions & plans: tsumori (pi2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "plans-invitations-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-intentions-plans",
  supportingCanDoIds: ["a2-cando-recognize-plain-forms"],
  introducedConceptIds: ["a2-concept-intentions-tsumori"],
  introducedSenseIds: [],
  models: [
    bareLine("plans-invitations-2-m1", "a2-family-plan-tsumori", "a2-value-tsumori-oyogu-shuumatsu", "a2-context-plans", L("This weekend I intend to swim.", "Questo weekend intendo nuotare."), "a2-role-sora"),
    bareLine("plans-invitations-2-m2", "a2-family-plan-tsumori", "a2-value-tsumori-taberu-shokuji", "a2-context-conversation", L("I intend to eat a meal.", "Intendo mangiare qualcosa."), "a2-role-friend"),
    bareLine("plans-invitations-2-m3", "a2-family-plan-tsumori", "a2-value-tsumori-iku-raigetsu", "a2-context-plans", L("Next month I intend to go to Kyoto.", "Il mese prossimo intendo andare a Kyoto."), "a2-role-emi"),
    bareLine("plans-invitations-2-m4", "a2-family-plan-tsumori", "a2-value-tsumori-au-tomodachi", "a2-context-among-friends", L("This weekend I intend to meet a friend.", "Questo weekend intendo incontrare un amico."), "a2-role-learner"),
    bareLine("plans-invitations-2-m5", "a2-family-plan-tsumori", "a2-value-tsumori-matsu-emi", "a2-context-plans", L("I intend to wait for Emi at the station.", "Intendo aspettare Emi alla stazione."), "a2-role-colleague"),
    bareLine("plans-invitations-2-m6", "a2-family-plan-tsumori", "a2-value-tsumori-yomu-hon", "a2-context-cafe", L("This weekend I intend to read a book.", "Questo weekend intendo leggere un libro."), "a2-role-teacher"),
    bareLine("plans-invitations-2-m7", "a2-family-plan-tsumori", "a2-value-tsumori-kaeru-hayaku", "a2-context-workplace", L("Today I intend to go home early.", "Oggi intendo tornare a casa presto."), "a2-role-colleague"),
    bareLine("plans-invitations-2-m8", "a2-family-plan-tsumori", "a2-value-tsumori-au-sora", "a2-context-conversation", L("Tomorrow I intend to meet Sora.", "Domani intendo incontrare Sora."), "a2-role-friend"),
  ],
  transfers: [
    bareLine("plans-invitations-2-t1", "a2-family-plan-tsumori", "a2-value-tsumori-oyogu-shuumatsu", "a2-context-among-friends", L("This weekend I intend to swim.", "Questo weekend intendo nuotare."), "a2-role-emi"),
    bareLine("plans-invitations-2-t2", "a2-family-plan-tsumori", "a2-value-tsumori-taberu-shokuji", "a2-context-workplace", L("I intend to eat a meal.", "Intendo mangiare qualcosa."), "a2-role-learner"),
    bareLine("plans-invitations-2-t3", "a2-family-plan-tsumori", "a2-value-tsumori-iku-raigetsu", "a2-context-conversation", L("Next month I intend to go to Kyoto.", "Il mese prossimo intendo andare a Kyoto."), "a2-role-teacher"),
    bareLine("plans-invitations-2-t4", "a2-family-plan-tsumori", "a2-value-tsumori-au-tomodachi", "a2-context-plans", L("This weekend I intend to meet a friend.", "Questo weekend intendo incontrare un amico."), "a2-role-colleague"),
    bareLine("plans-invitations-2-t5", "a2-family-plan-tsumori", "a2-value-tsumori-matsu-emi", "a2-context-cafe", L("I intend to wait for Emi at the station.", "Intendo aspettare Emi alla stazione."), "a2-role-sora"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson plans-invitations-3 — Invite, accept, decline (pi3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "plans-invitations-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-invite-accept-decline",
  supportingCanDoIds: ["a2-cando-intentions-plans"],
  introducedConceptIds: ["a2-concept-invite-accept-decline"],
  introducedSenseIds: [],
  models: [
    bareLine("plans-invitations-3-m1", "a2-family-invite", "a2-value-invite-eiga", "a2-context-cafe", L("Shall we watch a movie together?", "Guardiamo un film insieme?"), "a2-role-emi"),
    bareLine("plans-invitations-3-m2", "a2-family-respond-invite", "a2-value-respond-accept", "a2-context-cafe", L("Sounds good. Let's go.", "Va bene. Andiamo."), "a2-role-friend"),
    bareLine("plans-invitations-3-m3", "a2-family-invite", "a2-value-invite-shokuji", "a2-context-among-friends", L("Won't you eat together with me?", "Non mangi con me?"), "a2-role-sora"),
    bareLine("plans-invitations-3-m4", "a2-family-respond-invite", "a2-value-respond-decline", "a2-context-among-friends", L("Sorry, that day isn't very convenient.", "Scusa, quel giorno non mi è molto comodo."), "a2-role-colleague"),
    bareLine("plans-invitations-3-m5", "a2-family-invite", "a2-value-invite-oyogu", "a2-context-plans", L("Won't we swim together this weekend?", "Non nuotiamo insieme questo weekend?"), "a2-role-friend"),
    bareLine("plans-invitations-3-m6", "a2-family-respond-invite", "a2-value-respond-accept-happy", "a2-context-plans", L("Yes, I'd really like to go.", "Sì, mi piacerebbe molto andare."), "a2-role-emi"),
    bareLine("plans-invitations-3-m7", "a2-family-invite", "a2-value-invite-tomodachi-issho", "a2-context-workplace", L("Won't we eat a meal together tonight?", "Non mangiamo insieme stasera?"), "a2-role-colleague"),
    bareLine("plans-invitations-3-m8", "a2-family-respond-invite", "a2-value-respond-decline-work", "a2-context-workplace", L("Sorry, I have work that day.", "Scusa, quel giorno ho da lavorare."), "a2-role-teacher"),
    bareLine("plans-invitations-3-m9", "a2-family-plan-yotei", "a2-value-yotei-taberu-ashita", "a2-context-plans", L("Tomorrow I plan to eat a meal with a friend.", "Domani ho intenzione di mangiare con un amico."), "a2-role-sora"),
  ],
  transfers: [
    bareLine("plans-invitations-3-t1", "a2-family-invite", "a2-value-invite-eiga", "a2-context-workplace", L("Shall we watch a movie together?", "Guardiamo un film insieme?"), "a2-role-teacher"),
    bareLine("plans-invitations-3-t2", "a2-family-invite", "a2-value-invite-shokuji", "a2-context-plans", L("Won't you eat together with me?", "Non mangi con me?"), "a2-role-learner"),
    bareLine("plans-invitations-3-t3", "a2-family-respond-invite", "a2-value-respond-accept", "a2-context-among-friends", L("Sounds good. Let's go.", "Va bene. Andiamo."), "a2-role-colleague"),
    bareLine("plans-invitations-3-t4", "a2-family-respond-invite", "a2-value-respond-decline", "a2-context-workplace", L("Sorry, that day isn't very convenient.", "Scusa, quel giorno non mi è molto comodo."), "a2-role-emi"),
    bareLine("plans-invitations-3-t5", "a2-family-plan-yotei", "a2-value-yotei-taberu-ashita", "a2-context-among-friends", L("Tomorrow I plan to eat a meal with a friend.", "Domani ho intenzione di mangiare con un amico."), "a2-role-colleague"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson plans-invitations-4 — Arrange a meeting (pi4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "plans-invitations-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-arrange-meeting",
  supportingCanDoIds: ["a2-cando-intentions-plans"],
  introducedConceptIds: ["a2-concept-arrange-meeting"],
  introducedSenseIds: [],
  models: [
    bareLine("plans-invitations-4-m1", "a2-family-arrange-meeting", "a2-value-arrange-eki", "a2-context-plans", L("Let's meet at the station at 5.", "Incontriamoci alla stazione alle 5."), "a2-role-friend"),
    bareLine("plans-invitations-4-m2", "a2-family-arrange-meeting", "a2-value-arrange-cafe", "a2-context-cafe", L("Let's meet at the cafe at 3pm on Saturday.", "Incontriamoci al bar alle 15 di sabato."), "a2-role-emi"),
    bareLine("plans-invitations-4-m3", "a2-family-arrange-meeting", "a2-value-arrange-time-check", "a2-context-plans", L("What time shall we meet?", "A che ora ci incontriamo?"), "a2-role-sora"),
    bareLine("plans-invitations-4-m4", "a2-family-arrange-meeting", "a2-value-arrange-place-check", "a2-context-among-friends", L("Where shall we meet?", "Dove ci incontriamo?"), "a2-role-colleague"),
    bareLine("plans-invitations-4-m5", "a2-family-arrange-meeting", "a2-value-arrange-gakkou-mae", "a2-context-plans", L("Let's meet in front of the school at 9.", "Incontriamoci davanti alla scuola alle 9."), "a2-role-friend"),
    bareLine("plans-invitations-4-m6", "a2-family-arrange-meeting", "a2-value-arrange-eigakan", "a2-context-cafe", L("Let's meet at the movie theater entrance at 2:30.", "Incontriamoci all'ingresso del cinema alle 14:30."), "a2-role-emi"),
    bareLine("plans-invitations-4-m7", "a2-family-arrange-meeting", "a2-value-arrange-osoku-narisou", "a2-context-workplace", L("Sorry, I'll be a little late.", "Scusa, farò un po' tardi."), "a2-role-colleague"),
    bareLine("plans-invitations-4-m8", "a2-family-arrange-meeting", "a2-value-arrange-basho-henkou", "a2-context-plans", L("Is it OK if we change the place?", "Va bene se cambiamo il posto?"), "a2-role-sora"),
    bareLine("plans-invitations-4-m9", "a2-family-plan-yotei", "a2-value-yotei-oyogu-shuumatsu", "a2-context-plans", L("This weekend I plan to swim in the sea.", "Questo weekend ho intenzione di nuotare nel mare."), "a2-role-emi"),
    bareLine("plans-invitations-4-m10", "a2-family-plan-tsumori", "a2-value-tsumori-kaeru-hayaku", "a2-context-workplace", L("Today I intend to go home early.", "Oggi intendo tornare a casa presto."), "a2-role-colleague"),
  ],
  transfers: [
    bareLine("plans-invitations-4-t1", "a2-family-arrange-meeting", "a2-value-arrange-eki", "a2-context-workplace", L("Let's meet at the station at 5.", "Incontriamoci alla stazione alle 5."), "a2-role-teacher"),
    bareLine("plans-invitations-4-t2", "a2-family-arrange-meeting", "a2-value-arrange-cafe", "a2-context-workplace", L("Let's meet at the cafe at 3pm on Saturday.", "Incontriamoci al bar alle 15 di sabato."), "a2-role-sora"),
    bareLine("plans-invitations-4-t3", "a2-family-plan-yotei", "a2-value-yotei-oyogu-shuumatsu", "a2-context-cafe", L("This weekend I plan to swim in the sea.", "Questo weekend ho intenzione di nuotare nel mare."), "a2-role-friend"),
    bareLine("plans-invitations-4-t4", "a2-family-plan-tsumori", "a2-value-tsumori-kaeru-hayaku", "a2-context-plans", L("Today I intend to go home early.", "Oggi intendo tornare a casa presto."), "a2-role-sora"),
    bareLine("plans-invitations-4-t5", "a2-family-arrange-meeting", "a2-value-arrange-time-check", "a2-context-workplace", L("What time shall we meet?", "A che ora ci incontriamo?"), "a2-role-colleague"),
  ],
});

// ---------------------------------------------------------------------------
// Module aggregate
// ---------------------------------------------------------------------------

export const module2Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module2Recipe = A2_MODULE_MANIFEST[MODULE_ID];
