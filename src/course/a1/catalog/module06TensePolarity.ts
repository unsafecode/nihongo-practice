/**
 * A1 Module 6 — Tense and polarity.
 *
 * Four instructional lessons that make the already-introduced verbs and copula
 * speakable across time and polarity: verbal past (〜ました), verbal negative
 * (〜ません), verbal past-negative (〜ませんでした), and nominal copula
 * tense/polarity (でした / ではありません / ではありませんでした). No new senses
 * are introduced — every line reuses a sense from Modules 2, 4 or 5 under a new
 * {@link FormSelection}, which is exactly what turns this module into the spaced
 * recurrence vehicle for the productive verbs. The copula's affirmative/negative
 * boundary stays spaced (ではありません) so the naturalness regression can pin it.
 *
 * Situations, not paradigms: each lesson answers a real "what did / didn't
 * happen" Can-do rather than dumping a conjugation table.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_AFFIRMATIVE_PAST_POLITE,
  A1_NEGATIVE_PAST_POLITE,
  A1_NEGATIVE_PRESENT_POLITE,
  A1_CONCEPT_COPULA_DESU,
  A1_CONCEPT_FREQUENCY,
  A1_CONCEPT_LOCATION_PARTICLE,
  A1_CONCEPT_NOMINATIVE_GA,
  A1_CONCEPT_OBJECT_WO,
  A1_CONCEPT_RECIPIENT_NI,
  A1_CONCEPT_COMPANION_TO,
  A1_CONCEPT_TIME_SCHEDULE,
  A1_CONCEPT_TOPIC_WA,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "past-negative";
const L = (en: string, it: string): Bilingual => ({ en, it });

const OBJ = "a1-family-object-action";
const LOCF = "a1-family-location-action";
const NOM = "a1-family-nominative-action";
const REC = "a1-family-recipient-action";
const COMP = "a1-family-companion-action";
const SCHED = "a1-family-schedule-action";
const ADV = "a1-family-adverbial-time-action";
const COP = "a1-family-topic-copular";

const WATASHI = "a1-value-watashi";
const SELF = "a1-referent-self";
const THING = "a1-referent-thing";

const obj = (subject: string, predicate: string, object: string) => ({ subject, predicate, object });
const loc = (subject: string, predicate: string, location: string) => ({ subject, predicate, location });
const comp = (subject: string, companion: string) => ({ subject, predicate: "a1-value-accompany", companion });
const ask = (subject: string, recipient: string) => ({ subject, predicate: "a1-value-ask", object: recipient });
const timed = (subject: string, predicate: string, time: string) => ({ subject, predicate, time });
const cop = (subject: string, object: string) => ({ subject, predicate: "a1-value-be", object });

// ---------------------------------------------------------------------------
// Lesson past-negative-1 — verbal past (〜ました)
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "past-negative-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-daily-life",
  supportingCanDoIds: ["a1-can-do-actions"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_OBJECT_WO, A1_CONCEPT_COMPANION_TO, A1_CONCEPT_TIME_SCHEDULE],
  introducedSenseIds: ["a1-sense-eat", "a1-sense-do", "a1-sense-buy", "a1-sense-write", "a1-sense-accompany", "a1-sense-wake", "a1-sense-sleep", "a1-sense-return"],
  models: [
    { id: "past-negative-1-m1", family: OBJ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", form: A1_AFFIRMATIVE_PAST_POLITE, slots: obj(WATASHI, "a1-value-eat", "a1-value-obj-apple"), translation: L("I ate an apple.", "Ho mangiato una mela.") },
    { id: "past-negative-1-m2", family: OBJ, context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", form: A1_AFFIRMATIVE_PAST_POLITE, slots: obj("a1-value-yuki", "a1-value-do", "a1-value-obj-homework"), translation: L("Yuki did the homework.", "Yuki ha fatto i compiti.") },
    { id: "past-negative-1-m3", family: OBJ, context: "a1-context-shop", subjectReferent: SELF, subjectRealization: "omitted", form: A1_AFFIRMATIVE_PAST_POLITE, slots: obj(WATASHI, "a1-value-buy", "a1-value-obj-water"), translation: L("I bought water.", "Ho comprato dell'acqua.") },
    { id: "past-negative-1-m4", family: OBJ, context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", form: A1_AFFIRMATIVE_PAST_POLITE, slots: obj("a1-value-ken", "a1-value-write", "a1-value-obj-letter"), translation: L("Ken wrote a letter.", "Ken ha scritto una lettera.") },
    { id: "past-negative-1-m5", family: COMP, context: "a1-context-first-meeting", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", form: A1_AFFIRMATIVE_PAST_POLITE, slots: comp("a1-value-mina", "a1-value-companion-friend"), translation: L("Mina went with a friend.", "Mina è andata con un amico.") },
    { id: "past-negative-1-m6", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", form: A1_AFFIRMATIVE_PAST_POLITE, slots: timed(WATASHI, "a1-value-wake", "a1-value-time-7"), translation: L("I woke up at seven.", "Mi sono svegliato alle sette.") },
    { id: "past-negative-1-m7", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", form: A1_AFFIRMATIVE_PAST_POLITE, slots: timed(WATASHI, "a1-value-sleep", "a1-value-time-11"), translation: L("I went to bed at eleven.", "Sono andato a letto alle undici.") },
    { id: "past-negative-1-m8", family: SCHED, context: "a1-context-town", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", form: A1_AFFIRMATIVE_PAST_POLITE, slots: timed("a1-value-ken", "a1-value-return", "a1-value-day-tuesday"), translation: L("Ken came home on Tuesday.", "Ken è tornato a casa martedì.") },
  ],
  transfers: [
    { id: "past-negative-1-t1", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", form: A1_AFFIRMATIVE_PAST_POLITE, slots: obj("a1-value-ken", "a1-value-eat", "a1-value-obj-apple"), translation: L("Ken ate an apple.", "Ken ha mangiato una mela.") },
    { id: "past-negative-1-t2", family: OBJ, context: "a1-context-shop", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", form: A1_AFFIRMATIVE_PAST_POLITE, slots: obj("a1-value-mina", "a1-value-buy", "a1-value-obj-water"), translation: L("Mina bought water.", "Mina ha comprato dell'acqua.") },
    { id: "past-negative-1-t3", family: COMP, context: "a1-context-first-meeting", subjectReferent: SELF, subjectRealization: "omitted", form: A1_AFFIRMATIVE_PAST_POLITE, slots: comp(WATASHI, "a1-value-companion-friend"), translation: L("I went with a friend.", "Sono andato con un amico.") },
    { id: "past-negative-1-t4", family: SCHED, context: "a1-context-home", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", form: A1_AFFIRMATIVE_PAST_POLITE, slots: timed("a1-value-yuki", "a1-value-wake", "a1-value-time-7"), translation: L("Yuki woke up at seven.", "Yuki si è svegliata alle sette.") },
    { id: "past-negative-1-t5", family: SCHED, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", form: A1_AFFIRMATIVE_PAST_POLITE, slots: timed(WATASHI, "a1-value-return", "a1-value-day-tuesday"), translation: L("I came home on Tuesday.", "Sono tornato a casa martedì.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson past-negative-2 — verbal negative (〜ません)
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "past-negative-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-daily-life",
  supportingCanDoIds: ["a1-can-do-actions"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_OBJECT_WO, A1_CONCEPT_LOCATION_PARTICLE, A1_CONCEPT_NOMINATIVE_GA, A1_CONCEPT_RECIPIENT_NI, A1_CONCEPT_TIME_SCHEDULE],
  introducedSenseIds: ["a1-sense-drink", "a1-sense-work", "a1-sense-understand", "a1-sense-ask", "a1-sense-see", "a1-sense-listen", "a1-sense-go-out", "a1-sense-return"],
  models: [
    { id: "past-negative-2-m1", family: OBJ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PRESENT_POLITE, slots: obj(WATASHI, "a1-value-drink", "a1-value-obj-tea"), translation: L("I don't drink tea.", "Non bevo il tè.") },
    { id: "past-negative-2-m2", family: LOCF, context: "a1-context-workplace", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: loc("a1-value-yuki", "a1-value-work", "a1-value-loc-supermarket"), translation: L("Yuki doesn't work at the supermarket.", "Yuki non lavora al supermercato.") },
    { id: "past-negative-2-m3", family: NOM, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PRESENT_POLITE, slots: { subject: WATASHI, predicate: "a1-value-understand", object: "a1-value-obj-japanese" }, translation: L("I don't understand Japanese.", "Non capisco il giapponese.") },
    { id: "past-negative-2-m4", family: REC, context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: ask("a1-value-mina", "a1-value-recipient-teacher"), translation: L("Mina doesn't ask the teacher.", "Mina non chiede all'insegnante.") },
    { id: "past-negative-2-m5", family: OBJ, context: "a1-context-cafe", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PRESENT_POLITE, slots: obj(WATASHI, "a1-value-see", "a1-value-obj-movie"), translation: L("I don't watch movies.", "Non guardo film.") },
    { id: "past-negative-2-m6", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: obj("a1-value-ken", "a1-value-listen", "a1-value-obj-music"), translation: L("Ken doesn't listen to music.", "Ken non ascolta la musica.") },
    { id: "past-negative-2-m7", family: SCHED, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PRESENT_POLITE, slots: timed(WATASHI, "a1-value-go-out", "a1-value-day-saturday"), translation: L("I don't go out on Saturday.", "Non esco il sabato.") },
    { id: "past-negative-2-m8", family: SCHED, context: "a1-context-town", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: timed("a1-value-mina", "a1-value-return", "a1-value-time-10"), translation: L("Mina doesn't come home at ten.", "Mina non torna a casa alle dieci.") },
  ],
  transfers: [
    { id: "past-negative-2-t1", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: obj("a1-value-ken", "a1-value-drink", "a1-value-obj-tea"), translation: L("Ken doesn't drink tea.", "Ken non beve il tè.") },
    { id: "past-negative-2-t2", family: REC, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PRESENT_POLITE, slots: ask(WATASHI, "a1-value-recipient-teacher"), translation: L("I don't ask the teacher.", "Non chiedo all'insegnante.") },
    { id: "past-negative-2-t3", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: obj("a1-value-mina", "a1-value-see", "a1-value-obj-movie"), translation: L("Mina doesn't watch movies.", "Mina non guarda film.") },
    { id: "past-negative-2-t4", family: OBJ, context: "a1-context-cafe", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: obj("a1-value-yuki", "a1-value-listen", "a1-value-obj-music"), translation: L("Yuki doesn't listen to music.", "Yuki non ascolta la musica.") },
    { id: "past-negative-2-t5", family: SCHED, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PRESENT_POLITE, slots: timed(WATASHI, "a1-value-return", "a1-value-time-10"), translation: L("I don't come home at ten.", "Non torno a casa alle dieci.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson past-negative-3 — verbal past-negative (〜ませんでした)
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "past-negative-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-daily-life",
  supportingCanDoIds: ["a1-can-do-actions"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_OBJECT_WO, A1_CONCEPT_TIME_SCHEDULE, A1_CONCEPT_FREQUENCY],
  introducedSenseIds: ["a1-sense-study", "a1-sense-read", "a1-sense-wake", "a1-sense-sleep", "a1-sense-go-out", "a1-sense-study-routine", "a1-sense-read-routine", "a1-sense-eat-routine"],
  models: [
    { id: "past-negative-3-m1", family: OBJ, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PAST_POLITE, slots: obj(WATASHI, "a1-value-study", "a1-value-obj-english"), translation: L("I didn't study English.", "Non ho studiato l'inglese.") },
    { id: "past-negative-3-m2", family: OBJ, context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: obj("a1-value-yuki", "a1-value-read", "a1-value-obj-italian"), translation: L("Yuki didn't read Italian.", "Yuki non ha letto l'italiano.") },
    { id: "past-negative-3-m3", family: SCHED, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PAST_POLITE, slots: timed(WATASHI, "a1-value-wake", "a1-value-time-7"), translation: L("I didn't wake up at seven.", "Non mi sono svegliato alle sette.") },
    { id: "past-negative-3-m4", family: SCHED, context: "a1-context-home", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: timed("a1-value-ken", "a1-value-sleep", "a1-value-time-11"), translation: L("Ken didn't go to bed at eleven.", "Ken non è andato a letto alle undici.") },
    { id: "past-negative-3-m5", family: SCHED, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PAST_POLITE, slots: timed(WATASHI, "a1-value-go-out", "a1-value-time-8"), translation: L("I didn't go out at eight.", "Non sono uscito alle otto.") },
    { id: "past-negative-3-m6", family: SCHED, context: "a1-context-weekday-study", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: timed("a1-value-mina", "a1-value-study-routine", "a1-value-day-monday"), translation: L("Mina didn't study on Monday.", "Mina non ha studiato il lunedì.") },
    { id: "past-negative-3-m7", family: ADV, context: "a1-context-evening-reading", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PAST_POLITE, slots: timed(WATASHI, "a1-value-read-routine", "a1-value-seq-night"), translation: L("I didn't read at night.", "Non ho letto la sera.") },
    { id: "past-negative-3-m8", family: ADV, context: "a1-context-mealtime-routine", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: timed("a1-value-yuki", "a1-value-eat-routine", "a1-value-seq-morning"), translation: L("Yuki didn't eat in the morning.", "Yuki non ha mangiato la mattina.") },
  ],
  transfers: [
    { id: "past-negative-3-t1", family: OBJ, context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: obj("a1-value-yuki", "a1-value-study", "a1-value-obj-english"), translation: L("Yuki didn't study English.", "Yuki non ha studiato l'inglese.") },
    { id: "past-negative-3-t2", family: OBJ, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PAST_POLITE, slots: obj(WATASHI, "a1-value-read", "a1-value-obj-italian"), translation: L("I didn't read Italian.", "Non ho letto l'italiano.") },
    { id: "past-negative-3-t3", family: SCHED, context: "a1-context-home", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: timed("a1-value-mina", "a1-value-wake", "a1-value-time-7"), translation: L("Mina didn't wake up at seven.", "Mina non si è svegliata alle sette.") },
    { id: "past-negative-3-t4", family: SCHED, context: "a1-context-weekday-study", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PAST_POLITE, slots: timed(WATASHI, "a1-value-study-routine", "a1-value-day-monday"), translation: L("I didn't study on Monday.", "Non ho studiato il lunedì.") },
    { id: "past-negative-3-t5", family: ADV, context: "a1-context-evening-reading", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: timed("a1-value-ken", "a1-value-read-routine", "a1-value-seq-night"), translation: L("Ken didn't read at night.", "Ken non ha letto la sera.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson past-negative-4 — nominal copula tense/polarity (でした /
// ではありません / ではありませんでした), with two verbal predicates for contrast
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "past-negative-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-daily-life",
  supportingCanDoIds: ["a1-can-do-identity"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_COPULA_DESU, A1_CONCEPT_NOMINATIVE_GA, A1_CONCEPT_OBJECT_WO],
  introducedSenseIds: ["a1-sense-be", "a1-sense-understand", "a1-sense-study"],
  models: [
    { id: "past-negative-4-m1", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-clerk", form: A1_AFFIRMATIVE_PAST_POLITE, slots: cop("a1-value-ex-book", "a1-value-price-100"), translation: L("The book was 100 yen.", "Il libro costava cento yen.") },
    { id: "past-negative-4-m2", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", speakerRole: "a1-role-teacher", form: A1_AFFIRMATIVE_PAST_POLITE, slots: cop("a1-value-mikan-subject", "a1-value-price-300"), translation: L("The tangerine was 300 yen.", "Il mandarino costava trecento yen.") },
    { id: "past-negative-4-m3", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: cop("a1-value-kore", "a1-value-price-500"), translation: L("This is not 500 yen.", "Questo non costa cinquecento yen.") },
    { id: "past-negative-4-m4", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: cop("a1-value-sore", "a1-value-price-1000"), translation: L("That is not 1,000 yen.", "Quello non costa mille yen.") },
    { id: "past-negative-4-m5", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: cop("a1-value-ex-book", "a1-value-price-100"), translation: L("The book was not 100 yen.", "Il libro non costava cento yen.") },
    { id: "past-negative-4-m6", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: cop("a1-value-mikan-subject", "a1-value-price-300"), translation: L("The tangerine was not 300 yen.", "Il mandarino non costava trecento yen.") },
    { id: "past-negative-4-m7", family: NOM, context: "a1-context-classroom", subjectReferent: SELF, subjectRealization: "omitted", form: A1_NEGATIVE_PRESENT_POLITE, slots: { subject: WATASHI, predicate: "a1-value-understand", object: "a1-value-obj-english" }, translation: L("I don't understand English.", "Non capisco l'inglese.") },
    { id: "past-negative-4-m8", family: OBJ, context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", form: A1_AFFIRMATIVE_PAST_POLITE, slots: obj("a1-value-ken", "a1-value-study", "a1-value-obj-japanese"), translation: L("Ken studied Japanese.", "Ken ha studiato il giapponese.") },
  ],
  transfers: [
    { id: "past-negative-4-t1", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", form: A1_AFFIRMATIVE_PAST_POLITE, slots: cop("a1-value-mikan-subject", "a1-value-price-100"), translation: L("The tangerine was 100 yen.", "Il mandarino costava cento yen.") },
    { id: "past-negative-4-t2", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: cop("a1-value-sore", "a1-value-price-500"), translation: L("That is not 500 yen.", "Quello non costa cinquecento yen.") },
    { id: "past-negative-4-t3", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: cop("a1-value-mikan-subject", "a1-value-price-100"), translation: L("The tangerine was not 100 yen.", "Il mandarino non costava cento yen.") },
    { id: "past-negative-4-t4", family: NOM, context: "a1-context-classroom", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", form: A1_NEGATIVE_PRESENT_POLITE, slots: { subject: "a1-value-ken", predicate: "a1-value-understand", object: "a1-value-obj-english" }, translation: L("Ken doesn't understand English.", "Ken non capisce l'inglese.") },
    { id: "past-negative-4-t5", family: COP, context: "a1-context-shop", subjectReferent: THING, subjectRealization: "explicit", form: A1_NEGATIVE_PAST_POLITE, slots: cop("a1-value-ex-book", "a1-value-price-300"), translation: L("The book was not 300 yen.", "Il libro non costava trecento yen.") },
  ],
});

// ---------------------------------------------------------------------------
// Module recipe and aggregates. This module introduces NO new senses — it is a
// pure recurrence vehicle — so it exposes no verb-use records of its own; the
// spaced-reuse timeline of the reused senses is authored in `recurrence.ts`.
// ---------------------------------------------------------------------------

export const module6Lessons: readonly A1BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module6Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

export const module6VerbUseRecords: readonly VerbUseRecord[] = [];
