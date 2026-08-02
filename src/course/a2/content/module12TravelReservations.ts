/**
 * A2 Module 12 — Travel and reservations (Phase 3 Task 6).
 *
 * Four instructional lessons: tr1 (travel-reservations-1) makes a
 * reservation (whole-clause bake), transferring into intentions-plans (M2
 * family recurrence) and possibility (M7 family/values reused verbatim);
 * tr2 (travel-reservations-2) describes a travel schedule through a
 * genuinely compositional "X de Y ni tsukimasu" arrival family (reusing
 * the EXISTING A1-ported rule-transport-action rule) plus simpler
 * departing/staying content, transferring into BOTH experience-takoto (M3
 * family recurrence) AND comparison (M9 family recurrence) — the corrected
 * true-transfer lesson for compare; tr3 (travel-reservations-3) handles a
 * travel problem (object-compositional), transferring into
 * request-tekudasai/negative-request (M6 family recurrence) AND carries
 * genuine reason-node ("node", M4 family) TRUE TRANSFER content (Phase 3
 * Task 6 spec-fix, "grammar spiral content mismatch" — the grammar
 * spiral's own reason-node row names this lesson as its transfer, so a
 * real node-reason travel-problem explanation + polite request now lives
 * here — still never named as a third support, since the recipe caps
 * supports at two); tr4 (travel-reservations-4) changes or
 * cancels a reservation (whole-clause bake). Every sentence carries a
 * semantic-ID-only variant; all Japanese/romaji lives in the shared A2
 * semantic-value catalog (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  a2SubjectReferentValueId as subjectReferentValueId,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";
import type { FormSelection } from "../../foundations/types";

const MODULE_ID = "travel-reservations";

function L(en: string, it: string) {
  return { en, it };
}

interface LineOptions {
  readonly object?: string | null;
  readonly favored?: string | null;
  readonly standard?: string | null;
  readonly transport?: string | null;
  readonly location?: string | null;
  readonly subjectReferent?: string | null;
  readonly subjectRealization?: "omitted" | "explicit" | "vocative";
  readonly interrogative?: boolean;
  readonly speakerRole?: string;
  readonly form?: FormSelection;
}

function line(
  id: string,
  family: string,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  options: LineOptions = {},
): A2LineSpec {
  const subjectReferent = options.subjectReferent ?? null;
  const subjectRealization =
    options.subjectRealization ?? (subjectReferent === null ? "omitted" : "vocative");
  const slots: Record<string, string> = { predicate };
  if (subjectRealization !== "omitted" && subjectReferent !== null) {
    slots.subject = subjectReferentValueId(subjectReferent);
  }
  if (options.object) slots.object = options.object;
  if (options.favored) slots.favored = options.favored;
  if (options.standard) slots.standard = options.standard;
  if (options.transport) slots.transport = options.transport;
  if (options.location) slots.location = options.location;
  return {
    id,
    family,
    context,
    subjectReferent,
    subjectRealization,
    slots,
    translation,
    interrogative: options.interrogative,
    speakerRole: options.speakerRole,
    form: options.form,
  };
}

const TRAVEL = "a2-context-travel";
const OUTING = "a2-context-outing";

/** Honest FormSelection for a whole-clause-bake invariant value whose own
 * final clause is genuinely past-affirmative ("nakushimashita"/
 * "machigaemashita") — the builder's own default is present-affirmative,
 * so this must be declared explicitly (§ M4 spec-fix "form metadata"). */
const PAST_AFFIRMATIVE: FormSelection = { polarity: "affirmative", tense: "past", formality: "polite" };

// ---------------------------------------------------------------------------
// Lesson travel-reservations-1 — Make a reservation (tr1), with
// intentions-plans/possibility true transfer
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "travel-reservations-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-make-reservation",
  supportingCanDoIds: ["a2-cando-intentions-plans", "a2-cando-possibility"],
  introducedConceptIds: ["a2-concept-make-reservation"],
  introducedSenseIds: [],
  models: [
    line("travel-reservations-1-m1", "a2-family-make-reservation", "a2-value-resv-yoyaku-shitai", TRAVEL, L("I'd like to reserve a room.", "Vorrei prenotare una stanza."), { speakerRole: "a2-role-learner" }),
    line("travel-reservations-1-m2", "a2-family-make-reservation", "a2-value-resv-heya-arimasuka", TRAVEL, L("Do you have a room available?", "Avete una stanza disponibile?"), { speakerRole: "a2-role-learner" }),
    line("travel-reservations-1-m3", "a2-family-make-reservation", "a2-value-resv-hitori-desu", TRAVEL, L("It's for one person.", "È per una persona."), { speakerRole: "a2-role-friend" }),
    line("travel-reservations-1-m4", "a2-family-make-reservation", "a2-value-resv-yoyaku-shitai", TRAVEL, L("Excuse me, I'd like to reserve a room.", "Scusi, vorrei prenotare una stanza."), { subjectReferent: "a2-referent-frontdesk", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("travel-reservations-1-m5", "a2-family-make-reservation", "a2-value-resv-heya-arimasuka", TRAVEL, L("Excuse me, do you have a room available?", "Scusi, avete una stanza disponibile?"), { subjectReferent: "a2-referent-frontdesk", subjectRealization: "vocative", speakerRole: "a2-role-colleague" }),
    line("travel-reservations-1-m6", "a2-family-make-reservation", "a2-value-resv-hitori-desu", TRAVEL, L("Excuse me, it's for one person.", "Scusi, è per una persona."), { subjectReferent: "a2-referent-frontdesk", subjectRealization: "vocative", speakerRole: "a2-role-teacher" }),
    line("travel-reservations-1-m7", "a2-family-make-reservation", "a2-value-resv-yoyaku-shitai", OUTING, L("Sora, I'd like to reserve a room.", "Sora, vorrei prenotare una stanza."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("travel-reservations-1-m8", "a2-family-make-reservation", "a2-value-resv-heya-arimasuka", OUTING, L("Emi, do you have a room available?", "Emi, c'è una stanza disponibile?"), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    // m9/m10: the two supporting-Can-do families must also be MODELED
    // here, not only transferred (mirrors neighborhood-services-3-m9's own
    // precedent). m9 reuses plan-yotei's only value with a fresh vocative
    // wrapper (t1 below has none, so the visible target still differs);
    // m10 uses a fresh possibility value/object pair, distinct from t2's.
    line("travel-reservations-1-m9", "a2-family-plan-yotei", "a2-value-plan-ryokou-yotei", OUTING, L("Sora, I'm planning to travel next week.", "Sora, ho in programma di viaggiare la prossima settimana."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("travel-reservations-1-m10", "a2-family-possibility", "a2-value-possibility-hanasu", TRAVEL, L("You can speak Japanese.", "Si può parlare giapponese."), { object: "a2-value-obj-nihongo-m7", speakerRole: "a2-role-clerk" }),
  ],
  // t1/t2 are the genuine supporting-Can-do transfers (intentions-plans and
  // possibility, both reusing an EXISTING M2/M7 family+value verbatim); t3-t5
  // recombine an already-modeled predicate with a vocative pairing not used
  // above.
  transfers: [
    line("travel-reservations-1-t1", "a2-family-plan-yotei", "a2-value-plan-ryokou-yotei", TRAVEL, L("I'm planning to travel next week.", "Ho in programma di viaggiare la prossima settimana."), { speakerRole: "a2-role-learner" }),
    line("travel-reservations-1-t2", "a2-family-possibility", "a2-value-possibility-tsukau", TRAVEL, L("You can use a card.", "Si può usare la carta."), { object: "a2-value-obj-kaado", speakerRole: "a2-role-clerk" }),
    line("travel-reservations-1-t3", "a2-family-make-reservation", "a2-value-resv-hitori-desu", TRAVEL, L("Sora, it's for one person.", "Sora, è per una persona."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-friend" }),
    line("travel-reservations-1-t4", "a2-family-make-reservation", "a2-value-resv-hitori-desu", TRAVEL, L("Emi, it's for one person.", "Emi, è per una persona."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-colleague" }),
    line("travel-reservations-1-t5", "a2-family-make-reservation", "a2-value-resv-yoyaku-shitai", TRAVEL, L("Emi, I'd like to reserve a room.", "Emi, vorrei prenotare una stanza."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-teacher" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson travel-reservations-2 — Travel schedule (tr2), with BOTH
// experience-takoto and comparison true transfer
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "travel-reservations-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-travel-schedule",
  supportingCanDoIds: ["a2-cando-experience-takoto", "a2-cando-compare"],
  introducedConceptIds: ["a2-concept-travel-schedule"],
  introducedSenseIds: [],
  models: [
    line("travel-reservations-2-m1", "a2-family-travel-arrival", "a2-value-travel-tsuku", TRAVEL, L("I arrive at the airport by train.", "Arrivo in aeroporto in treno."), { transport: "a2-value-obj-densha-m12", location: "a2-value-loc-kuukou", speakerRole: "a2-role-learner" }),
    line("travel-reservations-2-m2", "a2-family-travel-arrival", "a2-value-travel-tsuku", TRAVEL, L("I arrive at the airport by plane.", "Arrivo in aeroporto in aereo."), { transport: "a2-value-obj-hikouki", location: "a2-value-loc-kuukou", speakerRole: "a2-role-colleague" }),
    line("travel-reservations-2-m3", "a2-family-travel-arrival", "a2-value-travel-tsuku", TRAVEL, L("I arrive at the station by bus.", "Arrivo alla stazione in autobus."), { transport: "a2-value-obj-basu", location: "a2-value-loc-eki", speakerRole: "a2-role-friend" }),
    line("travel-reservations-2-m4", "a2-family-travel-arrival", "a2-value-travel-tsuku", TRAVEL, L("I arrive at the station by train.", "Arrivo alla stazione in treno."), { transport: "a2-value-obj-densha-m12", location: "a2-value-loc-eki", speakerRole: "a2-role-learner" }),
    line("travel-reservations-2-m5", "a2-family-travel-schedule-other", "a2-value-travel-deru-eki", TRAVEL, L("I leave the station.", "Lascio la stazione."), { speakerRole: "a2-role-teacher" }),
    line("travel-reservations-2-m6", "a2-family-travel-schedule-other", "a2-value-travel-tomaru-hoteru", OUTING, L("I'll stay at the hotel.", "Alloggerò in hotel."), { speakerRole: "a2-role-learner" }),
    line("travel-reservations-2-m7", "a2-family-travel-arrival", "a2-value-travel-tsuku", TRAVEL, L("Sora arrives at the station by train.", "Sora arriva alla stazione in treno."), { transport: "a2-value-obj-densha-m12", location: "a2-value-loc-eki", subjectReferent: "a2-referent-sora", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
    line("travel-reservations-2-m8", "a2-family-travel-schedule-other", "a2-value-travel-tomaru-hoteru", OUTING, L("Emi will stay at the hotel.", "Emi alloggerà in hotel."), { subjectReferent: "a2-referent-emi", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    // m9/m10: experience-takoto's own two TRUE-TRANSFER values must also be
    // MODELED here directly, not only transferred (a whole-clause-bake
    // family's value carries its own complete content, so the SPECIFIC
    // value used in t1/t2 below must itself have appeared in an earlier
    // model, cumulatively — mirrors neighborhood-services-3-m9's own
    // precedent, extended per-value since experience-takoto has no shared
    // slot to recombine through, unlike travel-arrival above).
    line("travel-reservations-2-m9", "a2-family-experience-takoto", "a2-value-exp-kyoto-itta", TRAVEL, L("I have been to Kyoto.", "Sono stato a Kyoto."), { speakerRole: "a2-role-learner" }),
    line("travel-reservations-2-m10", "a2-family-experience-takoto", "a2-value-exp-shinkansen-notta", TRAVEL, L("I have ridden the shinkansen.", "Ho preso lo shinkansen."), { speakerRole: "a2-role-friend" }),
    // m11: comparison-favor must also be MODELED here (family-concept
    // unlock); a fresh favored/standard pair, distinct from t3's own below.
    line("travel-reservations-2-m11", "a2-family-comparison-favor", "a2-value-chiisai-stem", TRAVEL, L("The bus is smaller than the train.", "L'autobus è più piccolo del treno."), { favored: "a2-value-obj-basu", standard: "a2-value-obj-densha-m12", speakerRole: "a2-role-teacher" }),
  ],
  // t1/t2 reuse experience-takoto's own m9/m10 values verbatim with a fresh
  // vocative subject (a genuine supporting-Can-do transfer — the
  // discourse subject, not the predicate, is what varies, since the value
  // itself already carries the full travel-flavored content); t3 is the
  // genuine compare transfer (reusing comparison-favor's compositional
  // "yasui" stem — already available since shopping-returns-3's own model
  // — paired with a fresh favored/standard pair; compare's corrected
  // true-transfer lesson); t4 recombines the already-modeled
  // travel-arrival predicate/transport/location slots with a fresh triple;
  // t5 reuses the already-modeled travel-schedule-other "deru" value
  // verbatim with a fresh explicit subject, so all 5 transfers stay
  // visibly novel.
  transfers: [
    line("travel-reservations-2-t1", "a2-family-experience-takoto", "a2-value-exp-kyoto-itta", TRAVEL, L("Sora, I have been to Kyoto.", "Sora, sono stato a Kyoto."), { subjectReferent: "a2-referent-sora", speakerRole: "a2-role-colleague" }),
    line("travel-reservations-2-t2", "a2-family-experience-takoto", "a2-value-exp-shinkansen-notta", TRAVEL, L("Emi, I have ridden the shinkansen.", "Emi, ho preso lo shinkansen."), { subjectReferent: "a2-referent-emi", speakerRole: "a2-role-teacher" }),
    line("travel-reservations-2-t3", "a2-family-comparison-favor", "a2-value-yasui-stem", TRAVEL, L("The train is cheaper than the plane.", "Il treno è più economico dell'aereo."), { favored: "a2-value-obj-densha-m12", standard: "a2-value-obj-hikouki", speakerRole: "a2-role-colleague" }),
    line("travel-reservations-2-t4", "a2-family-travel-arrival", "a2-value-travel-tsuku", TRAVEL, L("The friend arrives at the airport by bus.", "L'amico arriva in aeroporto in autobus."), { transport: "a2-value-obj-basu", location: "a2-value-loc-kuukou", subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
    line("travel-reservations-2-t5", "a2-family-travel-schedule-other", "a2-value-travel-deru-eki", TRAVEL, L("The teacher leaves the station.", "L'insegnante lascia la stazione."), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson travel-reservations-3 — Travel problem (tr3), with
// request-tekudasai/negative-request true recurrence AND reason-node true
// transfer
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "travel-reservations-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-travel-problem",
  supportingCanDoIds: ["a2-cando-request-tekudasai", "a2-cando-negative-request"],
  introducedConceptIds: ["a2-concept-travel-problem"],
  introducedSenseIds: [],
  models: [
    line("travel-reservations-3-m1", "a2-family-travel-problem", "a2-value-problem-nakusu", TRAVEL, L("I lost my passport.", "Ho perso il passaporto."), { object: "a2-value-obj-pasupooto", speakerRole: "a2-role-learner" , form: PAST_AFFIRMATIVE }),
    line("travel-reservations-3-m2", "a2-family-travel-problem", "a2-value-problem-machigaeru", TRAVEL, L("I made a mistake with the reservation.", "Ho sbagliato la prenotazione."), { object: "a2-value-obj-yoyaku", speakerRole: "a2-role-colleague" , form: PAST_AFFIRMATIVE }),
    line("travel-reservations-3-m3", "a2-family-travel-problem", "a2-value-problem-nakusu", TRAVEL, L("I lost my ticket.", "Ho perso il biglietto."), { object: "a2-value-obj-kippu", speakerRole: "a2-role-teacher" , form: PAST_AFFIRMATIVE }),
    line("travel-reservations-3-m4", "a2-family-travel-problem", "a2-value-problem-nakusu", OUTING, L("The friend lost their passport.", "L'amico ha perso il passaporto."), { object: "a2-value-obj-pasupooto", subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-friend" , form: PAST_AFFIRMATIVE }),
    line("travel-reservations-3-m5", "a2-family-travel-problem", "a2-value-problem-machigaeru", TRAVEL, L("I made a mistake with the ticket.", "Ho sbagliato il biglietto."), { object: "a2-value-obj-kippu", speakerRole: "a2-role-learner" , form: PAST_AFFIRMATIVE }),
    line("travel-reservations-3-m6", "a2-family-request-tekudasai", "a2-value-tekudasai-tasukete", TRAVEL, L("Please help!", "Per favore, aiutami!"), { speakerRole: "a2-role-learner" }),
    line("travel-reservations-3-m7", "a2-family-request-tekudasai", "a2-value-tekudasai-tasukete", TRAVEL, L("Excuse me, please help!", "Scusi, mi aiuti!"), { subjectReferent: "a2-referent-frontdesk", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("travel-reservations-3-m8", "a2-family-negative-request", "a2-value-naidekudasai-wasureru", TRAVEL, L("Please don't forget your passport.", "Per favore, non dimenticare il passaporto."), { object: "a2-value-obj-pasupooto", speakerRole: "a2-role-teacher" }),
    // m9: reason-node ("node") TRUE TRANSFER evidence (Phase 3 Task 6
    // spec-fix, "grammar spiral content mismatch") — the grammar spiral's
    // own reason-node row names travel-reservations-3 as its TRANSFER
    // lesson, so this construction must genuinely be available/available-
    // then-transferred here, exactly like every other recurring grammar
    // family in this module. Modeled here first (never only transferred),
    // mirroring every other family in this lesson/module's own precedent.
    // Never a third named support (see `supportingCanDoIds` above,
    // unchanged at exactly the canonical two) — content evidence and
    // recipe-support labeling are deliberately independent (§ "do not count
    // recipe support alone").
    line("travel-reservations-3-m9", "a2-family-reason-node", "a2-value-node-pasupooto-nakushita-tasukete", TRAVEL, L("I lost my passport, so please help.", "Ho perso il passaporto, quindi aiutami."), { speakerRole: "a2-role-learner" }),
  ],
  // Every transfer recombines an already-modeled predicate with an
  // object/subject pairing not used above, so all 5 transfers stay
  // visibly novel. t1 is m9's own reason-node value transferred with a
  // fresh Sora vocative wrapper (the grammar spiral's real reason-node
  // TRANSFER evidence) — still never a third named support; travel-problem
  // itself keeps t2's own transfer, so the primary Can-do's transfer
  // coverage stays intact too.
  transfers: [
    line("travel-reservations-3-t1", "a2-family-reason-node", "a2-value-node-pasupooto-nakushita-tasukete", TRAVEL, L("Sora, I lost my passport, so please help.", "Sora, ho perso il passaporto, quindi aiutami."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-friend" }),
    line("travel-reservations-3-t2", "a2-family-travel-problem", "a2-value-problem-nakusu", OUTING, L("Emi lost her ticket.", "Emi ha perso il biglietto."), { object: "a2-value-obj-kippu", subjectReferent: "a2-referent-emi", subjectRealization: "explicit", speakerRole: "a2-role-teacher" , form: PAST_AFFIRMATIVE }),
    line("travel-reservations-3-t3", "a2-family-request-tekudasai", "a2-value-tekudasai-tasukete", OUTING, L("Sora, please help!", "Sora, aiutami!"), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-friend" }),
    line("travel-reservations-3-t4", "a2-family-negative-request", "a2-value-naidekudasai-wasureru", TRAVEL, L("Please don't forget your ticket.", "Per favore, non dimenticare il biglietto."), { object: "a2-value-obj-kippu", speakerRole: "a2-role-colleague" }),
    line("travel-reservations-3-t5", "a2-family-negative-request", "a2-value-naidekudasai-wasureru", TRAVEL, L("Please don't forget the reservation.", "Per favore, non dimenticare la prenotazione."), { object: "a2-value-obj-yoyaku", speakerRole: "a2-role-teacher" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson travel-reservations-4 — Change or cancel a reservation (tr4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "travel-reservations-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-change-cancel",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-change-cancel"],
  introducedSenseIds: [],
  models: [
    line("travel-reservations-4-m1", "a2-family-change-cancel", "a2-value-change-yoyaku-henkou", TRAVEL, L("Can you change the reservation?", "Potete cambiare la prenotazione?"), { speakerRole: "a2-role-learner" }),
    line("travel-reservations-4-m2", "a2-family-change-cancel", "a2-value-change-hiduke-kaetai", TRAVEL, L("Please change the date.", "Per favore, cambia la data."), { speakerRole: "a2-role-friend" }),
    line("travel-reservations-4-m3", "a2-family-change-cancel", "a2-value-cancel-kyanseru", TRAVEL, L("I'll cancel this.", "Cancello questo."), { speakerRole: "a2-role-colleague" }),
    line("travel-reservations-4-m4", "a2-family-change-cancel", "a2-value-cancel-ryoukin", TRAVEL, L("How much is the cancellation fee?", "Quanto costa la cancellazione?"), { speakerRole: "a2-role-teacher" }),
    line("travel-reservations-4-m5", "a2-family-change-cancel", "a2-value-change-yoyaku-henkou", TRAVEL, L("Excuse me, can you change the reservation?", "Scusi, potete cambiare la prenotazione?"), { subjectReferent: "a2-referent-frontdesk", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("travel-reservations-4-m6", "a2-family-change-cancel", "a2-value-change-hiduke-kaetai", TRAVEL, L("Excuse me, please change the date.", "Scusi, cambi la data."), { subjectReferent: "a2-referent-frontdesk", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("travel-reservations-4-m7", "a2-family-change-cancel", "a2-value-cancel-kyanseru", OUTING, L("The teacher will cancel this.", "L'insegnante cancella questo."), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("travel-reservations-4-m8", "a2-family-change-cancel", "a2-value-cancel-ryoukin", TRAVEL, L("Excuse me, how much is the cancellation fee?", "Scusi, quanto costa la cancellazione?"), { subjectReferent: "a2-referent-frontdesk", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
  ],
  // Every transfer recombines the already-modeled cancel-kyanseru predicate
  // with a fresh subject not used above, so all 5 transfers stay visibly
  // novel (yoyaku-henkou/hiduke-kaetai/ryoukin are safe only when addressed
  // to the clerk or left general, since only clerk staff can actually
  // fulfill them — never a third-party bystander topic).
  transfers: [
    line("travel-reservations-4-t1", "a2-family-change-cancel", "a2-value-cancel-kyanseru", OUTING, L("Sora, I'll cancel this.", "Sora, cancello questo."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("travel-reservations-4-t2", "a2-family-change-cancel", "a2-value-cancel-kyanseru", OUTING, L("Emi, I'll cancel this.", "Emi, cancello questo."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("travel-reservations-4-t3", "a2-family-change-cancel", "a2-value-cancel-kyanseru", TRAVEL, L("The colleague will cancel this.", "Il collega cancella questo."), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
    line("travel-reservations-4-t4", "a2-family-change-cancel", "a2-value-cancel-kyanseru", TRAVEL, L("The friend will cancel this.", "L'amico cancella questo."), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("travel-reservations-4-t5", "a2-family-change-cancel", "a2-value-cancel-kyanseru", TRAVEL, L("Excuse me, I'll cancel this.", "Scusi, cancello questo."), { subjectReferent: "a2-referent-frontdesk", subjectRealization: "vocative", speakerRole: "a2-role-friend" }),
  ],
});

export const module12Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module12Recipe = A2_MODULE_MANIFEST[MODULE_ID];
