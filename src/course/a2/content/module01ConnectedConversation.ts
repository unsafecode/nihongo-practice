/**
 * A2 Module 1 — Connected conversation (Phase 3 Task 4).
 *
 * Four instructional lessons covering the everyday mechanics of keeping a
 * conversation going: natural backchannels and follow-up questions, the
 * demo/sorekara ("but"/"then") discourse connectors, clarification/
 * repeat-request phrases, and recognizing casual plain-form dialogue. Every
 * sentence carries a semantic-ID-only variant; all Japanese/romaji lives in
 * the shared A2 semantic-value catalog (`a2SemanticCatalog.ts`) in
 * hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";

const MODULE_ID = "connected-conversation";

function L(en: string, it: string) {
  return { en, it };
}

// ---------------------------------------------------------------------------
// Lesson connected-conversation-1 — Backchannels & follow-up (cc1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "connected-conversation-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-backchannel-followup",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-backchannel-followup"],
  introducedSenseIds: ["a2-sense-hanasu", "a2-sense-kiku", "a2-sense-iu"],
  models: [
    { id: "connected-conversation-1-m1", family: "a2-family-talk-companion", context: "a2-context-conversation", subjectReferent: "a2-referent-friend", subjectRealization: "explicit", slots: { subject: "a2-value-friend-subject", predicate: "a2-value-hanasu", companion: "a2-value-companion-colleague" }, translation: L("My friend talks with a colleague.", "Il mio amico parla con un collega.") },
    { id: "connected-conversation-1-m2", family: "a2-family-ask-recipient", context: "a2-context-conversation", subjectReferent: "a2-referent-emi", subjectRealization: "explicit", slots: { subject: "a2-value-emi", predicate: "a2-value-kiku", object: "a2-value-recipient-teacher" }, translation: L("Emi asks the teacher.", "Emi chiede all'insegnante.") },
    { id: "connected-conversation-1-m3", family: "a2-family-say-object", context: "a2-context-among-friends", subjectReferent: "a2-referent-sora", subjectRealization: "explicit", slots: { subject: "a2-value-sora", predicate: "a2-value-iu", object: "a2-value-obj-namae" }, translation: L("Sora says his name.", "Sora dice il suo nome.") },
    { id: "connected-conversation-1-m4", family: "a2-family-backchannel-reaction", context: "a2-context-among-friends", subjectReferent: null, subjectRealization: "omitted", slots: { predicate: "a2-value-react-soka" }, translation: L("I see.", "Capisco.") },
    { id: "connected-conversation-1-m5", family: "a2-family-backchannel-reaction", context: "a2-context-workplace", subjectReferent: null, subjectRealization: "omitted", slots: { predicate: "a2-value-react-taihen" }, translation: L("That sounds rough.", "Che situazione difficile.") },
    { id: "connected-conversation-1-m6", family: "a2-family-backchannel-reaction", context: "a2-context-cafe", subjectReferent: null, subjectRealization: "omitted", slots: { predicate: "a2-value-react-yokatta" }, translation: L("I'm glad to hear that.", "Sono contento di saperlo.") },
    { id: "connected-conversation-1-m7", family: "a2-family-backchannel-reaction", context: "a2-context-among-friends", subjectReferent: null, subjectRealization: "omitted", slots: { predicate: "a2-value-react-honto" }, translation: L("Really?", "Davvero?") },
    { id: "connected-conversation-1-m8", family: "a2-family-backchannel-reaction", context: "a2-context-conversation", subjectReferent: null, subjectRealization: "omitted", slots: { predicate: "a2-value-followup-sonoato" }, translation: L("After that, what happened?", "Dopo, cos'è successo?") },
  ],
  transfers: [
    { id: "connected-conversation-1-t1", family: "a2-family-backchannel-reaction", context: "a2-context-workplace", subjectReferent: null, subjectRealization: "omitted", slots: { predicate: "a2-value-react-soka" }, translation: L("I see.", "Capisco.") },
    { id: "connected-conversation-1-t2", family: "a2-family-say-object", context: "a2-context-workplace", subjectReferent: "a2-referent-sora", subjectRealization: "explicit", slots: { subject: "a2-value-sora", predicate: "a2-value-iu", object: "a2-value-obj-namae" }, translation: L("Sora says his name.", "Sora dice il suo nome.") },
    { id: "connected-conversation-1-t3", family: "a2-family-talk-companion", context: "a2-context-workplace", subjectReferent: "a2-referent-friend", subjectRealization: "explicit", slots: { subject: "a2-value-friend-subject", predicate: "a2-value-hanasu", companion: "a2-value-companion-colleague" }, translation: L("My friend talks with a colleague.", "Il mio amico parla con un collega.") },
    { id: "connected-conversation-1-t4", family: "a2-family-ask-recipient", context: "a2-context-conversation", subjectReferent: "a2-referent-friend", subjectRealization: "explicit", slots: { subject: "a2-value-friend-subject", predicate: "a2-value-kiku", object: "a2-value-recipient-teacher" }, translation: L("My friend asks the teacher.", "Il mio amico chiede all'insegnante.") },
    { id: "connected-conversation-1-t5", family: "a2-family-backchannel-reaction", context: "a2-context-cafe", subjectReferent: null, subjectRealization: "omitted", slots: { predicate: "a2-value-followup-sonoato" }, translation: L("After that, what happened?", "Dopo, cos'è successo?") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson connected-conversation-2 — Connectors demo/sorekara (cc2)
// ---------------------------------------------------------------------------

function connectorLine(
  id: string,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  speakerRole?: string,
): A2LineSpec {
  return {
    id,
    family: "a2-family-connector-utterance",
    context,
    subjectReferent: null,
    subjectRealization: "omitted",
    slots: { predicate },
    translation,
    speakerRole,
  };
}

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "connected-conversation-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-connectors",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-connectors"],
  introducedSenseIds: [],
  models: [
    connectorLine("connected-conversation-2-m1", "a2-value-connector-ame-demo-dekakeru", "a2-context-conversation", L("Today it's raining. But, I'm going out.", "Oggi piove. Ma esco lo stesso."), "a2-role-emi"),
    connectorLine("connected-conversation-2-m2", "a2-value-connector-shukudai-sorekara-terebi", "a2-context-among-friends", L("I do my homework. Then, I watch TV.", "Faccio i compiti. Poi guardo la TV."), "a2-role-sora"),
    connectorLine("connected-conversation-2-m3", "a2-value-connector-isogashii-demo-ganbaru", "a2-context-workplace", L("Work is busy. But, it's fun.", "Il lavoro è impegnativo. Ma è divertente."), "a2-role-colleague"),
    connectorLine("connected-conversation-2-m4", "a2-value-connector-benkyou-sorekara-neru", "a2-context-conversation", L("I study Japanese. Then, I go to sleep.", "Studio giapponese. Poi vado a dormire."), "a2-role-learner"),
    connectorLine("connected-conversation-2-m5", "a2-value-connector-samui-demo-genki", "a2-context-cafe", L("Today it's cold. But, I'm doing well.", "Oggi fa freddo. Ma sto bene."), "a2-role-friend"),
    connectorLine("connected-conversation-2-m6", "a2-value-connector-test-demo-ganbatta", "a2-context-conversation", L("The test was hard. But, I did my best.", "Il test era difficile. Ma ho fatto del mio meglio."), "a2-role-emi"),
    connectorLine("connected-conversation-2-m7", "a2-value-connector-ame-sorekara-hare", "a2-context-among-friends", L("It was raining in the morning. Then, it cleared up.", "Al mattino pioveva. Poi si è schiarito."), "a2-role-sora"),
    connectorLine("connected-conversation-2-m8", "a2-value-connector-shigoto-sorekara-kaeru", "a2-context-workplace", L("Work finished. Then, I went home.", "Il lavoro è finito. Poi sono tornato a casa."), "a2-role-teacher"),
  ],
  transfers: [
    connectorLine("connected-conversation-2-t1", "a2-value-connector-ame-demo-dekakeru", "a2-context-among-friends", L("Today it's raining. But, I'm going out.", "Oggi piove. Ma esco lo stesso."), "a2-role-friend"),
    connectorLine("connected-conversation-2-t2", "a2-value-connector-shukudai-sorekara-terebi", "a2-context-conversation", L("I do my homework. Then, I watch TV.", "Faccio i compiti. Poi guardo la TV."), "a2-role-learner"),
    connectorLine("connected-conversation-2-t3", "a2-value-connector-isogashii-demo-ganbaru", "a2-context-conversation", L("Work is busy. But, it's fun.", "Il lavoro è impegnativo. Ma è divertente."), "a2-role-colleague"),
    connectorLine("connected-conversation-2-t4", "a2-value-connector-benkyou-sorekara-neru", "a2-context-cafe", L("I study Japanese. Then, I go to sleep.", "Studio giapponese. Poi vado a dormire."), "a2-role-sora"),
    connectorLine("connected-conversation-2-t5", "a2-value-connector-samui-demo-genki", "a2-context-workplace", L("Today it's cold. But, I'm doing well.", "Oggi fa freddo. Ma sto bene."), "a2-role-emi"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson connected-conversation-3 — Clarify/repeat (cc3)
// ---------------------------------------------------------------------------

function clarifyLine(
  id: string,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  speakerRole?: string,
): A2LineSpec {
  return {
    id,
    family: "a2-family-clarify-repeat",
    context,
    subjectReferent: null,
    subjectRealization: "omitted",
    slots: { predicate },
    translation,
    speakerRole,
  };
}

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "connected-conversation-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-clarify-repeat",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-clarify-repeat"],
  introducedSenseIds: [],
  models: [
    clarifyLine("connected-conversation-3-m1", "a2-value-clarify-mouichido", "a2-context-conversation", L("Sorry, one more time, please.", "Scusa, un'altra volta, per favore."), "a2-role-emi"),
    clarifyLine("connected-conversation-3-m2", "a2-value-clarify-yukkuri", "a2-context-workplace", L("A little more slowly, please.", "Un po' più lentamente, per favore."), "a2-role-colleague"),
    clarifyLine("connected-conversation-3-m3", "a2-value-clarify-wakarimasen", "a2-context-among-friends", L("Sorry, I don't understand.", "Scusa, non capisco."), "a2-role-friend"),
    clarifyLine("connected-conversation-3-m4", "a2-value-clarify-wakarimashita", "a2-context-conversation", L("I understood.", "Ho capito."), "a2-role-learner"),
    clarifyLine("connected-conversation-3-m5", "a2-value-clarify-imikotoba", "a2-context-workplace", L("What does that word mean?", "Cosa significa quella parola?"), "a2-role-sora"),
    clarifyLine("connected-conversation-3-m6", "a2-value-clarify-kikoemasen", "a2-context-cafe", L("Sorry, I couldn't hear.", "Scusa, non ho sentito."), "a2-role-emi"),
    clarifyLine("connected-conversation-3-m7", "a2-value-clarify-ookiikoe", "a2-context-among-friends", L("A little louder, please.", "Un po' più forte, per favore."), "a2-role-teacher"),
    clarifyLine("connected-conversation-3-m8", "a2-value-clarify-douiuimi", "a2-context-conversation", L("What do you mean by that?", "Cosa intendi con questo?"), "a2-role-friend"),
  ],
  transfers: [
    clarifyLine("connected-conversation-3-t1", "a2-value-clarify-mouichido", "a2-context-workplace", L("Sorry, one more time, please.", "Scusa, un'altra volta, per favore."), "a2-role-sora"),
    clarifyLine("connected-conversation-3-t2", "a2-value-clarify-yukkuri", "a2-context-conversation", L("A little more slowly, please.", "Un po' più lentamente, per favore."), "a2-role-learner"),
    clarifyLine("connected-conversation-3-t3", "a2-value-clarify-wakarimasen", "a2-context-among-friends", L("Sorry, I don't understand.", "Scusa, non capisco."), "a2-role-colleague"),
    clarifyLine("connected-conversation-3-t4", "a2-value-clarify-wakarimashita", "a2-context-cafe", L("I understood.", "Ho capito."), "a2-role-emi"),
    clarifyLine("connected-conversation-3-t5", "a2-value-clarify-imikotoba", "a2-context-conversation", L("What does that word mean?", "Cosa significa quella parola?"), "a2-role-teacher"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson connected-conversation-4 — Recognize plain forms (cc4)
// ---------------------------------------------------------------------------

function plainLine(
  id: string,
  predicate: string,
  subjectReferent: string | null,
  translation: { en: string; it: string },
  context = "a2-context-among-friends",
): A2LineSpec {
  return {
    id,
    family: "a2-family-plain-recognition",
    context,
    subjectReferent,
    subjectRealization: subjectReferent === null ? "omitted" : "explicit",
    slots: subjectReferent === null ? { predicate } : { subject: subjectReferentValueId(subjectReferent), predicate },
    translation,
  };
}

function subjectReferentValueId(subjectReferent: string): string {
  const table: Readonly<Record<string, string>> = {
    "a2-referent-friend": "a2-value-friend-subject",
    "a2-referent-emi": "a2-value-emi",
    "a2-referent-sora": "a2-value-sora",
    "a2-referent-colleague": "a2-value-colleague-subject",
    "a2-referent-teacher": "a2-value-teacher-subject",
  };
  const valueId = table[subjectReferent];
  if (!valueId) throw new Error(`plainLine: no subject value mapped for referent "${subjectReferent}"`);
  return valueId;
}

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "connected-conversation-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-recognize-plain-forms",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-recognize-plain-forms"],
  introducedSenseIds: [],
  models: [
    plainLine("connected-conversation-4-m1", "a2-value-plain-iku-dict", "a2-referent-friend", L("My friend is going.", "Il mio amico va."), "a2-context-among-friends"),
    plainLine("connected-conversation-4-m2", "a2-value-plain-iku-neg", null, L("I'm not going.", "Non vado."), "a2-context-conversation"),
    plainLine("connected-conversation-4-m3", "a2-value-plain-taberu-past", "a2-referent-emi", L("Emi ate.", "Emi ha mangiato."), "a2-context-cafe"),
    plainLine("connected-conversation-4-m4", "a2-value-plain-hanasu-dict", null, L("I'll talk (about it).", "Ne parlo io."), "a2-context-workplace"),
    plainLine("connected-conversation-4-m5", "a2-value-plain-matsu-past-neg", "a2-referent-sora", L("Sora didn't wait.", "Sora non ha aspettato."), "a2-context-among-friends"),
    plainLine("connected-conversation-4-m6", "a2-value-plain-oyogu-dict", null, L("I'll swim.", "Nuoto io."), "a2-context-conversation"),
    plainLine("connected-conversation-4-m7", "a2-value-plain-asobu-dict", "a2-referent-friend", L("My friend hangs out (plays).", "Il mio amico esce a divertirsi."), "a2-context-cafe"),
    plainLine("connected-conversation-4-m8", "a2-value-plain-yomu-neg", null, L("I'm not reading (it).", "Non lo leggo."), "a2-context-workplace"),
  ],
  transfers: [
    plainLine("connected-conversation-4-t1", "a2-value-plain-iku-dict", "a2-referent-friend", L("My friend is going.", "Il mio amico va."), "a2-context-workplace"),
    plainLine("connected-conversation-4-t2", "a2-value-plain-iku-neg", null, L("I'm not going.", "Non vado."), "a2-context-among-friends"),
    plainLine("connected-conversation-4-t3", "a2-value-plain-taberu-past", "a2-referent-emi", L("Emi ate.", "Emi ha mangiato."), "a2-context-conversation"),
    plainLine("connected-conversation-4-t4", "a2-value-plain-hanasu-dict", null, L("I'll talk (about it).", "Ne parlo io."), "a2-context-cafe"),
    plainLine("connected-conversation-4-t5", "a2-value-plain-matsu-past-neg", "a2-referent-sora", L("Sora didn't wait.", "Sora non ha aspettato."), "a2-context-conversation"),
  ],
});

// ---------------------------------------------------------------------------
// Module aggregate
// ---------------------------------------------------------------------------

export const module1Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module1Recipe = A2_MODULE_MANIFEST[MODULE_ID];
