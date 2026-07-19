/**
 * A2 Module 14 - Practical texts (Phase 3 Task 7).
 *
 * Four instructional lessons: pt1 (practical-texts-1) reads an actual
 * timetable/schedule text (a2-family-read-schedule, whole-clause bake - no
 * support); pt2 (practical-texts-2) reads an actual notice/sign text
 * (a2-family-read-notice: hours/fees/open-closed), with a true TRANSFER into
 * prohibition-tewaikenai (the grammar spiral's own transfer role for this
 * lesson - M6 family recurrence); pt3 (practical-texts-3) reads an actual
 * short message/invitation/reply (a2-family-read-reply-message), with BOTH
 * opinion-toomou (M4 family recurrence) and connectors (M1 family
 * recurrence) true recurrence; pt4 (practical-texts-4) fills a simple form
 * with times/dates/numbers (a2-family-fill-form, whole-clause bake - no
 * support). Every sentence carries a semantic-ID-only variant; all
 * Japanese/romaji lives in the shared A2 semantic-value catalog
 * (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */
import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";

const MODULE_ID = "practical-texts";

function L(en: string, it: string) {
  return { en, it };
}

interface LineOptions {
  readonly subjectValueId?: string | null;
  readonly object?: string | null;
  readonly speakerRole?: string;
  readonly interrogative?: boolean;
}

/** A practical-texts line: the "subject" slot, when present, is always a
 * DIRECT semantic value - never a tracked discourse referent - mirroring
 * module13RelationshipsEvents.ts's own `line()` shape exactly. Most
 * practical-texts models leave the subject omitted entirely (a posted
 * schedule/notice/form reads naturally with no explicit topic). */
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
  return {
    id,
    family,
    context,
    subjectReferent: null,
    subjectRealization: subjectValueId === null ? "omitted" : "explicit",
    slots,
    translation,
    interrogative: options.interrogative,
    speakerRole: options.speakerRole,
  };
}

const NOTICES = "a2-context-notices";
const WORKPLACE = "a2-context-workplace";
const CAFE = "a2-context-cafe";

// ---------------------------------------------------------------------------
// Lesson practical-texts-1 - Reading an actual schedule/timetable (pt1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "practical-texts-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-read-schedule",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-read-schedule"],
  introducedSenseIds: [],
  models: [
    line("practical-texts-1-m1", "a2-family-read-schedule", "a2-value-sched-tsugi-densha", NOTICES, L("The next train is at 9:15.", "Il prossimo treno è alle 9:15."), { speakerRole: "a2-role-learner" }),
    line("practical-texts-1-m2", "a2-family-read-schedule", "a2-value-sched-honsuu", NOTICES, L("There are 4 trains an hour.", "Ci sono 4 treni all'ora."), { speakerRole: "a2-role-friend" }),
    line("practical-texts-1-m3", "a2-family-read-schedule", "a2-value-sched-jugyou-han", WORKPLACE, L("Class is from 3:30.", "La lezione è dalle 3:30."), { speakerRole: "a2-role-colleague" }),
    line("practical-texts-1-m4", "a2-family-read-schedule", "a2-value-sched-basu-jikan", NOTICES, L("The bus leaves at 10.", "L'autobus parte alle 10."), { speakerRole: "a2-role-teacher" }),
    line("practical-texts-1-m5", "a2-family-read-schedule", "a2-value-sched-kyuukou-kuji-han", NOTICES, L("The express leaves at 9:30.", "Il rapido parte alle 9:30."), { speakerRole: "a2-role-learner" }),
    line("practical-texts-1-m6", "a2-family-read-schedule", "a2-value-sched-shuuden-juuichi", NOTICES, L("The last train is at 11.", "L'ultimo treno è alle 11."), { speakerRole: "a2-role-friend" }),
    line("practical-texts-1-m7", "a2-family-read-schedule", "a2-value-sched-basu-honsuu", NOTICES, L("There are 3 buses an hour.", "Ci sono 3 autobus all'ora."), { speakerRole: "a2-role-colleague" }),
    line("practical-texts-1-m8", "a2-family-read-schedule", "a2-value-sched-jugyou-owaru", WORKPLACE, L("Class ends at 5.", "La lezione finisce alle 5."), { speakerRole: "a2-role-teacher" }),
  ],
  // The 8 models are 8 distinct posted timetable lines; every transfer is a
  // natural comprehension question that CONFIRMS a posted line (the same
  // introduced schedule fact realized as a polite yes/no question — visibly
  // novel via the sentence-final ka, never a person topic bolted onto an
  // impersonal notice).
  transfers: [
    line("practical-texts-1-t1", "a2-family-read-schedule", "a2-value-sched-tsugi-densha", NOTICES, L("Is the next train at 9:15?", "Il prossimo treno è alle 9:15?"), { speakerRole: "a2-role-colleague", interrogative: true }),
    line("practical-texts-1-t2", "a2-family-read-schedule", "a2-value-sched-honsuu", WORKPLACE, L("Are there 4 trains an hour?", "Ci sono 4 treni all'ora?"), { speakerRole: "a2-role-teacher", interrogative: true }),
    line("practical-texts-1-t3", "a2-family-read-schedule", "a2-value-sched-jugyou-han", WORKPLACE, L("Is class from 3:30?", "La lezione è dalle 3:30?"), { speakerRole: "a2-role-friend", interrogative: true }),
    line("practical-texts-1-t4", "a2-family-read-schedule", "a2-value-sched-basu-jikan", NOTICES, L("Does the bus leave at 10?", "L'autobus parte alle 10?"), { speakerRole: "a2-role-learner", interrogative: true }),
    line("practical-texts-1-t5", "a2-family-read-schedule", "a2-value-sched-kyuukou-kuji-han", NOTICES, L("Does the express leave at 9:30?", "Il rapido parte alle 9:30?"), { speakerRole: "a2-role-teacher", interrogative: true }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson practical-texts-2 - Reading an actual notice/sign, with genuine
// prohibition-tewaikenai TRANSFER evidence (pt2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "practical-texts-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-read-notice",
  supportingCanDoIds: ["a2-cando-prohibition-tewaikenai"],
  introducedConceptIds: ["a2-concept-read-notice"],
  introducedSenseIds: [],
  models: [
    line("practical-texts-2-m1", "a2-family-read-notice", "a2-value-notice-aku-9", NOTICES, L("This shop opens at 9am.", "Questo negozio apre alle 9 del mattino."), { speakerRole: "a2-role-learner" }),
    line("practical-texts-2-m2", "a2-family-read-notice", "a2-value-notice-shimaru-6", NOTICES, L("This shop closes at 6pm.", "Questo negozio chiude alle 6 del pomeriggio."), { speakerRole: "a2-role-friend" }),
    line("practical-texts-2-m3", "a2-family-read-notice", "a2-value-notice-ryoukin-500", NOTICES, L("Admission is 500 yen.", "L'ingresso costa 500 yen."), { speakerRole: "a2-role-colleague" }),
    line("practical-texts-2-m4", "a2-family-read-notice", "a2-value-notice-kodomo-muryou", NOTICES, L("It's free for children.", "È gratis per i bambini."), { speakerRole: "a2-role-teacher" }),
    line("practical-texts-2-m5", "a2-family-read-notice", "a2-value-notice-getsuyou-yasumi", NOTICES, L("It's closed on Mondays.", "È chiuso il lunedì."), { speakerRole: "a2-role-learner" }),
    line("practical-texts-2-m6", "a2-family-read-notice", "a2-value-notice-chuushajou-300", WORKPLACE, L("Parking is 300 yen.", "Il parcheggio costa 300 yen."), { speakerRole: "a2-role-friend" }),
    // m7: prohibition-tewaikenai (M6 family) TRUE TRANSFER evidence must
    // also be MODELED here first (never only transferred, mirrors every
    // other recurring grammar family in this module's own precedent). Never
    // a second named support (recipe stays capped at exactly one support).
    line("practical-texts-2-m7", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-shashin", NOTICES, L("You must not take photos.", "Non si possono scattare foto."), { object: "a2-value-obj-shashin", speakerRole: "a2-role-teacher" }),
    line("practical-texts-2-m8", "a2-family-read-notice", "a2-value-notice-saishuu-nyuujou", WORKPLACE, L("Last entry is 5:30.", "L'ultimo ingresso è alle 5:30."), { speakerRole: "a2-role-colleague" }),
  ],
  // t1 is the genuine prohibition-tewaikenai TRANSFER (a different M6
  // prohibition value than the model above — the grammar spiral's real
  // prohibition-tewaikenai transfer evidence, subject-less); t2-t5 are
  // natural comprehension questions confirming a posted notice line (visibly
  // novel via the sentence-final ka, never a person topic over a sign).
  transfers: [
    line("practical-texts-2-t1", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-taberu", NOTICES, L("You must not eat here.", "Non si può mangiare qui."), { speakerRole: "a2-role-friend" }),
    line("practical-texts-2-t2", "a2-family-read-notice", "a2-value-notice-aku-9", NOTICES, L("Does this shop open at 9am?", "Questo negozio apre alle 9 del mattino?"), { speakerRole: "a2-role-colleague", interrogative: true }),
    line("practical-texts-2-t3", "a2-family-read-notice", "a2-value-notice-ryoukin-500", NOTICES, L("Is admission 500 yen?", "L'ingresso costa 500 yen?"), { speakerRole: "a2-role-teacher", interrogative: true }),
    line("practical-texts-2-t4", "a2-family-read-notice", "a2-value-notice-kodomo-muryou", WORKPLACE, L("Is it free for children?", "È gratis per i bambini?"), { speakerRole: "a2-role-learner", interrogative: true }),
    line("practical-texts-2-t5", "a2-family-read-notice", "a2-value-notice-shimaru-6", WORKPLACE, L("Does this shop close at 6pm?", "Questo negozio chiude alle 6 del pomeriggio?"), { speakerRole: "a2-role-friend", interrogative: true }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson practical-texts-3 - Reading an actual short message/invitation/
// reply, with BOTH opinion-toomou and connectors true recurrence (pt3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "practical-texts-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-read-reply-message",
  supportingCanDoIds: ["a2-cando-opinion-toomou", "a2-cando-connectors"],
  introducedConceptIds: ["a2-concept-read-reply-message"],
  introducedSenseIds: [],
  models: [
    line("practical-texts-3-m1", "a2-family-read-reply-message", "a2-value-msg-eiga-sasoi", CAFE, L("Saturday, want to watch a movie together?", "Sabato, vogliamo vedere un film insieme?"), { speakerRole: "a2-role-learner" }),
    line("practical-texts-3-m2", "a2-family-read-reply-message", "a2-value-msg-zannen-kotowaru", CAFE, L("Sorry, Saturday's a bit difficult.", "Mi dispiace, sabato è un po' difficile."), { speakerRole: "a2-role-friend" }),
    line("practical-texts-3-m3", "a2-family-read-reply-message", "a2-value-msg-wakatta-aimashou", CAFE, L("Understood, let's meet on Saturday.", "Capito, incontriamoci sabato."), { speakerRole: "a2-role-colleague" }),
    line("practical-texts-3-m4", "a2-family-read-reply-message", "a2-value-msg-kouen-sasoi", NOTICES, L("Sunday, shall we go to the park?", "Domenica, andiamo al parco?"), { speakerRole: "a2-role-teacher" }),
    line("practical-texts-3-m5", "a2-family-read-reply-message", "a2-value-msg-gogo-daijoubu", NOTICES, L("The afternoon is fine.", "Il pomeriggio va bene."), { speakerRole: "a2-role-friend" }),
    // m6/m7: the two supporting-Can-do families (opinion-toomou,
    // connectors) must also be MODELED here, not only transferred (mirrors
    // travel-reservations-1-m9/m10's own precedent) - fresh values for
    // both.
    line("practical-texts-3-m6", "a2-family-opinion-toomou", "a2-value-opinion-eiga-omoshiroi", CAFE, L("I think this movie is interesting.", "Penso che questo film sia interessante."), { speakerRole: "a2-role-colleague" }),
    line("practical-texts-3-m7", "a2-family-connector-utterance", "a2-value-connector-msg-ame-dekakeru", CAFE, L("It's raining, but I'll go out.", "Piove, ma esco lo stesso."), { speakerRole: "a2-role-teacher" }),
    line("practical-texts-3-m8", "a2-family-read-reply-message", "a2-value-msg-eki-mae-au", NOTICES, L("Let's meet in front of the station.", "Incontriamoci davanti alla stazione."), { speakerRole: "a2-role-learner" }),
  ],
  // opinion-toomou and connectors genuinely recur here as models (m6/m7);
  // t1/t2 further transfer opinion-toomou with fresh already-introduced M4
  // opinion values, and t3-t5 are natural comprehension questions confirming
  // a posted message line — every transfer stays visibly novel without a
  // person topic over a self-contained message.
  transfers: [
    line("practical-texts-3-t1", "a2-family-opinion-toomou", "a2-value-toomou-kore-ii", CAFE, L("I think this is good.", "Penso che questo sia buono."), { speakerRole: "a2-role-friend" }),
    line("practical-texts-3-t2", "a2-family-opinion-toomou", "a2-value-toomou-hon-omoshiroi", NOTICES, L("I think this book is interesting.", "Penso che questo libro sia interessante."), { speakerRole: "a2-role-colleague" }),
    line("practical-texts-3-t3", "a2-family-read-reply-message", "a2-value-msg-gogo-daijoubu", NOTICES, L("Is the afternoon OK?", "Il pomeriggio va bene?"), { speakerRole: "a2-role-teacher", interrogative: true }),
    line("practical-texts-3-t4", "a2-family-read-reply-message", "a2-value-msg-eki-mae-au", CAFE, L("Shall we meet in front of the station?", "Ci vediamo davanti alla stazione?"), { speakerRole: "a2-role-learner", interrogative: true }),
    line("practical-texts-3-t5", "a2-family-read-reply-message", "a2-value-msg-wakatta-aimashou", CAFE, L("Understood, shall we meet on Saturday?", "Capito, ci vediamo sabato?"), { speakerRole: "a2-role-friend", interrogative: true }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson practical-texts-4 - Filling a simple form with times/dates/numbers
// (pt4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "practical-texts-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-fill-form",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-fill-form"],
  introducedSenseIds: [],
  models: [
    line("practical-texts-4-m1", "a2-family-fill-form", "a2-value-form-namae", NOTICES, L("Name: Tanaka.", "Nome: Tanaka."), { speakerRole: "a2-role-learner" }),
    line("practical-texts-4-m2", "a2-family-fill-form", "a2-value-form-denwabangou", NOTICES, L("Phone number: 090.", "Numero di telefono: 090."), { speakerRole: "a2-role-friend" }),
    line("practical-texts-4-m3", "a2-family-fill-form", "a2-value-form-seinengappi", NOTICES, L("Birthday: March 5th.", "Compleanno: 5 marzo."), { speakerRole: "a2-role-colleague" }),
    line("practical-texts-4-m4", "a2-family-fill-form", "a2-value-form-jikan", NOTICES, L("Time: 2:30pm.", "Ora: le 2:30 del pomeriggio."), { speakerRole: "a2-role-teacher" }),
    line("practical-texts-4-m5", "a2-family-fill-form", "a2-value-form-ninzuu", NOTICES, L("Number of people: two.", "Numero di persone: due."), { speakerRole: "a2-role-learner" }),
    line("practical-texts-4-m6", "a2-family-fill-form", "a2-value-form-shusseki-youbi", NOTICES, L("Attendance day: Saturday.", "Giorno di partecipazione: sabato."), { speakerRole: "a2-role-friend" }),
    line("practical-texts-4-m7", "a2-family-fill-form", "a2-value-form-juusho", WORKPLACE, L("Address: Tokyo.", "Indirizzo: Tokyo."), { speakerRole: "a2-role-colleague" }),
    line("practical-texts-4-m8", "a2-family-fill-form", "a2-value-form-kokuseki", WORKPLACE, L("Nationality: Italy.", "Nazionalità: Italia."), { speakerRole: "a2-role-teacher" }),
  ],
  // The 8 models are 8 distinct filled-in form fields; every transfer is a
  // natural comprehension question confirming a posted field (visibly novel
  // via the sentence-final ka, never a person topic over a field label).
  transfers: [
    line("practical-texts-4-t1", "a2-family-fill-form", "a2-value-form-namae", WORKPLACE, L("Is the name Tanaka?", "Il nome è Tanaka?"), { speakerRole: "a2-role-learner", interrogative: true }),
    line("practical-texts-4-t2", "a2-family-fill-form", "a2-value-form-denwabangou", WORKPLACE, L("Is the phone number 090?", "Il numero di telefono è 090?"), { speakerRole: "a2-role-friend", interrogative: true }),
    line("practical-texts-4-t3", "a2-family-fill-form", "a2-value-form-seinengappi", WORKPLACE, L("Is the birthday March 5th?", "Il compleanno è il 5 marzo?"), { speakerRole: "a2-role-colleague", interrogative: true }),
    line("practical-texts-4-t4", "a2-family-fill-form", "a2-value-form-jikan", NOTICES, L("Is the time 2:30pm?", "L'ora è le 2:30 del pomeriggio?"), { speakerRole: "a2-role-teacher", interrogative: true }),
    line("practical-texts-4-t5", "a2-family-fill-form", "a2-value-form-ninzuu", NOTICES, L("Is the number of people two?", "Il numero di persone è due?"), { speakerRole: "a2-role-friend", interrogative: true }),
  ],
});

export const module14Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module14Recipe = A2_MODULE_MANIFEST[MODULE_ID];
