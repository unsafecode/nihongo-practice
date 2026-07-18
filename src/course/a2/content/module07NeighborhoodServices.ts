/**
 * A2 Module 7 — Neighborhood services (Phase 3 Task 5).
 *
 * Four instructional lessons: possibility intro (koto-ga-dekimasu) with a
 * genuine permission-temoii transfer, express-ability (possibility
 * controlled practice, affirmative and negative), ask-for-help (asking
 * where a facility is / asking someone for directions or a favor — request
 * phrase content only after request-tekudasai's own intro), and
 * describe-facility (existence statements plus teiru recurrence for a
 * facility's hours/state). Every sentence carries a semantic-ID-only
 * variant; all Japanese/romaji lives in the shared A2 semantic-value
 * catalog (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";
import type { FormSelection } from "../../foundations/types";

const MODULE_ID = "neighborhood-services";

function L(en: string, it: string) {
  return { en, it };
}

/** Referent -> its subject-slot semantic value — the same shared
 * subject-referent value catalog every M1-M8 module content file carries
 * its own identical copy of. */
function subjectReferentValueId(subjectReferent: string): string {
  const table: Readonly<Record<string, string>> = {
    "a2-referent-friend": "a2-value-friend-subject",
    "a2-referent-emi": "a2-value-emi",
    "a2-referent-sora": "a2-value-sora",
    "a2-referent-colleague": "a2-value-colleague-subject",
    "a2-referent-teacher": "a2-value-teacher-subject",
    "a2-referent-self": "a2-value-watashi",
  };
  const valueId = table[subjectReferent];
  if (!valueId) throw new Error(`subjectReferentValueId: no subject value mapped for referent "${subjectReferent}"`);
  return valueId;
}

interface LineOptions {
  readonly object?: string | null;
  readonly location?: string | null;
  readonly subjectReferent?: string | null;
  readonly subjectRealization?: "omitted" | "explicit" | "vocative";
  readonly interrogative?: boolean;
  readonly form?: FormSelection;
  readonly speakerRole?: string;
}

/** One M7 line: subject optional (vocative for direct address, never
 * explicit for a named individual), object/location optional
 * (a2-family-possibility / a2-family-describe-facility /
 * a2-family-ongoing-teiru), predicate carries the suffixed/baked content. */
function line(
  id: string,
  family: string,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  options: LineOptions = {},
): A2LineSpec {
  const subjectReferent = options.subjectReferent ?? null;
  const subjectRealization = options.subjectRealization ?? (subjectReferent === null ? "omitted" : "vocative");
  const slots: Record<string, string> = { predicate };
  if (subjectRealization !== "omitted" && subjectReferent !== null) {
    slots.subject = subjectReferentValueId(subjectReferent);
  }
  if (options.object) {
    slots.object = options.object;
  }
  if (options.location) {
    slots.location = options.location;
  }
  return {
    id,
    family,
    context,
    subjectReferent,
    subjectRealization,
    slots,
    translation,
    interrogative: options.interrogative,
    form: options.form,
    speakerRole: options.speakerRole,
  };
}

/** A describe-facility line: subject is the (inanimate) facility referent
 * itself, required — never omitted. */
function facilityLine(
  id: string,
  predicate: string,
  facilitySubjectValueId: string,
  location: string | null,
  context: string,
  translation: { en: string; it: string },
  speakerRole?: string,
): A2LineSpec {
  const slots: Record<string, string> = { subject: facilitySubjectValueId, predicate };
  if (location) {
    slots.location = location;
  }
  return {
    id,
    family: "a2-family-describe-facility",
    context,
    subjectReferent: null,
    subjectRealization: "explicit",
    slots,
    translation,
    speakerRole,
  };
}

/** A facility teiru recurrence line (a2-family-ongoing-teiru): subject is
 * the (inanimate) facility referent itself, required, never a person
 * referent — "the library is open", not "I am open". */
function facilityTeiruLine(
  id: string,
  predicate: string,
  facilitySubjectValueId: string,
  context: string,
  translation: { en: string; it: string },
  speakerRole?: string,
): A2LineSpec {
  return {
    id,
    family: "a2-family-ongoing-teiru",
    context,
    subjectReferent: null,
    subjectRealization: "explicit",
    slots: { subject: facilitySubjectValueId, predicate },
    translation,
    speakerRole,
  };
}

// ---------------------------------------------------------------------------
// Lesson neighborhood-services-1 — Possibility intro + permission-temoii
// true transfer (ns1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "neighborhood-services-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-possibility",
  supportingCanDoIds: ["a2-cando-permission-temoii"],
  introducedConceptIds: ["a2-concept-possibility"],
  introducedSenseIds: [],
  models: [
    line("neighborhood-services-1-m1", "a2-family-possibility", "a2-value-possibility-tsukau", "a2-context-neighborhood", L("I can use the card.", "Posso usare la tessera."), { object: "a2-value-obj-kaado", speakerRole: "a2-role-learner" }),
    line("neighborhood-services-1-m2", "a2-family-possibility", "a2-value-possibility-hanasu", "a2-context-neighborhood", L("I can speak English here.", "Posso parlare inglese qui."), { object: "a2-value-obj-eigo", speakerRole: "a2-role-emi" }),
    line("neighborhood-services-1-m3", "a2-family-possibility", "a2-value-possibility-yomu", "a2-context-rules", L("I can read the book here.", "Posso leggere il libro qui."), { object: "a2-value-obj-hon-m5", speakerRole: "a2-role-sora" }),
    line("neighborhood-services-1-m4", "a2-family-possibility", "a2-value-possibility-oyogu", "a2-context-outing", L("I can swim here.", "Posso nuotare qui."), { speakerRole: "a2-role-colleague" }),
    line("neighborhood-services-1-m5", "a2-family-possibility", "a2-value-possibility-kaku", "a2-context-neighborhood", L("I can write my name here.", "Posso scrivere il mio nome qui."), { object: "a2-value-obj-namae", speakerRole: "a2-role-teacher" }),
    line("neighborhood-services-1-m6", "a2-family-permission-temoii", "a2-value-temoii-nomu", "a2-context-neighborhood", L("May I drink water?", "Posso bere l'acqua?"), { object: "a2-value-obj-mizu", interrogative: true, speakerRole: "a2-role-learner" }),
    line("neighborhood-services-1-m7", "a2-family-permission-temoii-location", "a2-value-temoii-loc-tsukau", "a2-context-neighborhood", L("May I use this at the library?", "Posso usarlo in biblioteca?"), { location: "a2-value-loc-toshokan", interrogative: true, speakerRole: "a2-role-friend" }),
    line("neighborhood-services-1-m8", "a2-family-possibility", "a2-value-possibility-hanasu", "a2-context-neighborhood", L("I can speak Japanese here.", "Posso parlare giapponese qui."), { object: "a2-value-obj-nihongo-m7", speakerRole: "a2-role-clerk" }),
    // Phase 3 Task 5 fix ("introduction before use"): possibility's negative
    // ("cannot") sense is a genuinely distinct dedicated sense from its
    // affirmative counterpart (never a shared bucket with a polarity flag),
    // so it must be modeled here too — with a *different* object than the
    // transfers below reuse — before t1/t2 can honestly recombine it.
    line("neighborhood-services-1-m9", "a2-family-possibility", "a2-value-possibility-nashi-tsukau", "a2-context-neighborhood", L("I cannot use the water fountain.", "Non posso usare la fontanella."), { object: "a2-value-obj-mizu", speakerRole: "a2-role-learner" }),
    line("neighborhood-services-1-m10", "a2-family-possibility", "a2-value-possibility-nashi-hanasu", "a2-context-neighborhood", L("I cannot speak Japanese here.", "Non posso parlare giapponese qui."), { object: "a2-value-obj-nihongo-m7", speakerRole: "a2-role-friend" }),
  ],
  transfers: [
    line("neighborhood-services-1-t1", "a2-family-possibility", "a2-value-possibility-nashi-tsukau", "a2-context-neighborhood", L("I cannot use the card.", "Non posso usare la tessera."), { object: "a2-value-obj-kaado" }),
    line("neighborhood-services-1-t2", "a2-family-possibility", "a2-value-possibility-nashi-hanasu", "a2-context-neighborhood", L("I cannot speak English here.", "Non posso parlare inglese qui."), { object: "a2-value-obj-eigo" }),
    line("neighborhood-services-1-t3", "a2-family-permission-temoii", "a2-value-temoii-kaku", "a2-context-neighborhood", L("Sora, may I write my name?", "Sora, posso scrivere il mio nome?"), { object: "a2-value-obj-namae", subjectReferent: "a2-referent-sora", interrogative: true }),
    line("neighborhood-services-1-t4", "a2-family-possibility", "a2-value-possibility-yomu", "a2-context-neighborhood", L("I can read English here.", "Posso leggere inglese qui."), { object: "a2-value-obj-eigo" }),
    line("neighborhood-services-1-t5", "a2-family-permission-temoii-location", "a2-value-temoii-loc-hanasu", "a2-context-rules", L("May I talk in the classroom?", "Posso parlare in classe?"), { location: "a2-value-loc-kyoushitsu", interrogative: true }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson neighborhood-services-2 — Express ability: possibility controlled
// practice, affirmative and negative (ns2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "neighborhood-services-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-express-ability",
  supportingCanDoIds: ["a2-cando-possibility"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    line("neighborhood-services-2-m1", "a2-family-possibility", "a2-value-possibility-tsukau", "a2-context-neighborhood", L("I can use the card.", "Posso usare la tessera."), { object: "a2-value-obj-kaado", speakerRole: "a2-role-learner" }),
    line("neighborhood-services-2-m2", "a2-family-possibility", "a2-value-possibility-nashi-tsukau", "a2-context-neighborhood", L("I cannot use the card.", "Non posso usare la tessera."), { object: "a2-value-obj-kaado", speakerRole: "a2-role-emi" }),
    line("neighborhood-services-2-m3", "a2-family-possibility", "a2-value-possibility-hanasu", "a2-context-rules", L("I can speak English here.", "Posso parlare inglese qui."), { object: "a2-value-obj-eigo", speakerRole: "a2-role-sora" }),
    line("neighborhood-services-2-m4", "a2-family-possibility", "a2-value-possibility-nashi-hanasu", "a2-context-rules", L("I cannot speak English here.", "Non posso parlare inglese qui."), { object: "a2-value-obj-eigo", speakerRole: "a2-role-colleague" }),
    line("neighborhood-services-2-m5", "a2-family-possibility", "a2-value-possibility-yomu", "a2-context-neighborhood", L("I can read the book here.", "Posso leggere il libro qui."), { object: "a2-value-obj-hon-m5", speakerRole: "a2-role-teacher" }),
    line("neighborhood-services-2-m6", "a2-family-possibility", "a2-value-possibility-yomu", "a2-context-neighborhood", L("I can read Japanese here.", "Posso leggere giapponese qui."), { object: "a2-value-obj-nihongo-m7", speakerRole: "a2-role-friend" }),
    line("neighborhood-services-2-m7", "a2-family-possibility", "a2-value-possibility-oyogu", "a2-context-neighborhood", L("I can swim here.", "Posso nuotare qui."), { speakerRole: "a2-role-clerk" }),
    line("neighborhood-services-2-m8", "a2-family-possibility", "a2-value-possibility-kaku", "a2-context-neighborhood", L("I can write my name here.", "Posso scrivere il mio nome qui."), { object: "a2-value-obj-namae", speakerRole: "a2-role-learner" }),
  ],
  transfers: [
    line("neighborhood-services-2-t1", "a2-family-possibility", "a2-value-possibility-tsukau", "a2-context-neighborhood", L("I can use Japanese here.", "Posso usare il giapponese qui."), { object: "a2-value-obj-nihongo-m7" }),
    line("neighborhood-services-2-t2", "a2-family-possibility", "a2-value-possibility-hanasu", "a2-context-neighborhood", L("I can speak Japanese here.", "Posso parlare giapponese qui."), { object: "a2-value-obj-nihongo-m7" }),
    line("neighborhood-services-2-t3", "a2-family-possibility", "a2-value-possibility-kaku", "a2-context-neighborhood", L("I can write in English here.", "Posso scrivere in inglese qui."), { object: "a2-value-obj-eigo" }),
    line("neighborhood-services-2-t4", "a2-family-possibility", "a2-value-possibility-nashi-tsukau", "a2-context-neighborhood", L("I cannot use Japanese here.", "Non posso usare il giapponese qui."), { object: "a2-value-obj-nihongo-m7" }),
    line("neighborhood-services-2-t5", "a2-family-possibility", "a2-value-possibility-nashi-hanasu", "a2-context-neighborhood", L("I cannot speak Japanese here.", "Non posso parlare giapponese qui."), { object: "a2-value-obj-nihongo-m7" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson neighborhood-services-3 — Ask for help: directions and requests
// (ns3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "neighborhood-services-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-ask-for-help",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-ask-for-help"],
  introducedSenseIds: [],
  models: [
    line("neighborhood-services-3-m1", "a2-family-ask-where", "a2-value-ask-where-byouin", "a2-context-neighborhood", L("Where is the hospital?", "Dov'è l'ospedale?"), { interrogative: true, speakerRole: "a2-role-learner" }),
    line("neighborhood-services-3-m2", "a2-family-ask-where", "a2-value-ask-where-ginkou", "a2-context-neighborhood", L("Where is the bank?", "Dov'è la banca?"), { interrogative: true, speakerRole: "a2-role-emi" }),
    line("neighborhood-services-3-m3", "a2-family-ask-where", "a2-value-ask-where-yuubinkyoku", "a2-context-neighborhood", L("Where is the post office?", "Dov'è l'ufficio postale?"), { interrogative: true, speakerRole: "a2-role-sora" }),
    line("neighborhood-services-3-m4", "a2-family-ask-where", "a2-value-ask-where-toshokan", "a2-context-conversation", L("Where is the library?", "Dov'è la biblioteca?"), { interrogative: true, speakerRole: "a2-role-colleague" }),
    line("neighborhood-services-3-m5", "a2-family-ask-where", "a2-value-ask-where-eki", "a2-context-conversation", L("Where is the station?", "Dov'è la stazione?"), { interrogative: true, speakerRole: "a2-role-teacher" }),
    line("neighborhood-services-3-m6", "a2-family-ask-for-help", "a2-value-help-oshiete-michi", "a2-context-neighborhood", L("Excuse me, please tell me the way.", "Scusi, mi dica la strada per favore."), { speakerRole: "a2-role-friend" }),
    line("neighborhood-services-3-m7", "a2-family-ask-for-help", "a2-value-help-oshiete-basho", "a2-context-neighborhood", L("Excuse me, please tell me the place.", "Scusi, mi dica il posto per favore."), { speakerRole: "a2-role-clerk" }),
    line("neighborhood-services-3-m8", "a2-family-ask-for-help", "a2-value-help-tetsudatte", "a2-context-neighborhood", L("Excuse me, please help me.", "Scusi, mi aiuti per favore."), { speakerRole: "a2-role-learner" }),
    // a2-family-request-tekudasai's own concept must be modeled here too
    // (a lesson's realization-availability is derived only from its own
    // MODEL variants' families, never its transfers) before the 5
    // transfers below can recombine its already-M6-introduced verb senses
    // with a fresh object.
    line("neighborhood-services-3-m9", "a2-family-request-tekudasai", "a2-value-tekudasai-taberu", "a2-context-neighborhood", L("Please eat the vegetables.", "Per favore, mangi le verdure."), { object: "a2-value-obj-yasai", speakerRole: "a2-role-clerk" }),
  ],
  // Phase 3 Task 5 fix ("introduction before use"): a2-family-ask-where and
  // a2-family-ask-for-help have NO subject/object/location slot at all (a
  // pure whole-clause bake, unlike M5's te-sequence or M8's
  // confirm-understanding/recount-experience, which at least have a
  // subject slot to recombine with) — so a transfer here can never be both
  // genuinely novel (I2) and honestly "introduced" unless it draws on a
  // *different*, already-fully-available compositional family instead of
  // inventing new whole-clause-only "ask-near-*" content no model ever
  // demonstrates. a2-family-request-tekudasai's own canDoIds already
  // include "a2-cando-ask-for-help" (this lesson's primary), and its verb
  // senses have been fully available since permission-requests-3 (M6) — so
  // these 5 transfers genuinely recombine an already-introduced tekudasai
  // predicate with an already-introduced object, never a brand-new value.
  transfers: [
    line("neighborhood-services-3-t1", "a2-family-request-tekudasai", "a2-value-tekudasai-kaku", "a2-context-neighborhood", L("Please write your name.", "Per favore, scriva il suo nome."), { object: "a2-value-obj-namae" }),
    line("neighborhood-services-3-t2", "a2-family-request-tekudasai", "a2-value-tekudasai-matsu", "a2-context-neighborhood", L("Please wait.", "Per favore, aspetti."), {}),
    line("neighborhood-services-3-t3", "a2-family-request-tekudasai", "a2-value-tekudasai-suwaru", "a2-context-neighborhood", L("Please sit down.", "Per favore, si sieda."), {}),
    line("neighborhood-services-3-t4", "a2-family-request-tekudasai", "a2-value-tekudasai-hanasu", "a2-context-conversation", L("Please speak in English.", "Per favore, parli in inglese."), { object: "a2-value-obj-eigo" }),
    line("neighborhood-services-3-t5", "a2-family-request-tekudasai", "a2-value-tekudasai-tatsu", "a2-context-neighborhood", L("Please stand up.", "Per favore, si alzi."), {}),
  ],
});

// ---------------------------------------------------------------------------
// Lesson neighborhood-services-4 — Describe facility: existence + teiru
// recurrence for hours/state (ns4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "neighborhood-services-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-describe-facility",
  supportingCanDoIds: ["a2-cando-ongoing-teiru"],
  introducedConceptIds: ["a2-concept-describe-facility"],
  introducedSenseIds: [],
  models: [
    facilityLine("neighborhood-services-4-m1", "a2-value-exist-aru", "a2-value-fac-byouin-subject", null, "a2-context-neighborhood", L("There is a hospital.", "C'è un ospedale."), "a2-role-learner"),
    facilityLine("neighborhood-services-4-m2", "a2-value-exist-aru", "a2-value-fac-ginkou-subject", "a2-value-loc-eki-m7", "a2-context-neighborhood", L("There is a bank near the station.", "C'è una banca vicino alla stazione."), "a2-role-emi"),
    facilityLine("neighborhood-services-4-m3", "a2-value-exist-aru", "a2-value-fac-yuubinkyoku-subject", null, "a2-context-neighborhood", L("There is a post office.", "C'è un ufficio postale."), "a2-role-sora"),
    facilityLine("neighborhood-services-4-m4", "a2-value-exist-aru", "a2-value-fac-toshokan-subject", "a2-value-loc-eki-m7", "a2-context-conversation", L("There is a library near the station.", "C'è una biblioteca vicino alla stazione."), "a2-role-colleague"),
    facilityLine("neighborhood-services-4-m5", "a2-value-exist-aru", "a2-value-fac-koen-subject", null, "a2-context-outing", L("There is a park.", "C'è un parco."), "a2-role-teacher"),
    facilityTeiruLine("neighborhood-services-4-m6", "a2-value-facility-teiru-aiteiru", "a2-value-fac-toshokan-subject", "a2-context-neighborhood", L("The library is open.", "La biblioteca è aperta."), "a2-role-friend"),
    facilityTeiruLine("neighborhood-services-4-m7", "a2-value-facility-teiru-shimatteiru", "a2-value-fac-byouin-subject", "a2-context-neighborhood", L("The hospital is closed.", "L'ospedale è chiuso."), "a2-role-clerk"),
    facilityLine("neighborhood-services-4-m8", "a2-value-exist-aru", "a2-value-fac-ginkou-subject", null, "a2-context-neighborhood", L("There is a bank.", "C'è una banca."), "a2-role-learner"),
  ],
  transfers: [
    facilityLine("neighborhood-services-4-t1", "a2-value-exist-aru", "a2-value-fac-yuubinkyoku-subject", "a2-value-loc-eki-m7", "a2-context-neighborhood", L("There is a post office near the station.", "C'è un ufficio postale vicino alla stazione.")),
    facilityLine("neighborhood-services-4-t2", "a2-value-exist-aru", "a2-value-fac-koen-subject", "a2-value-loc-eki-m7", "a2-context-neighborhood", L("There is a park near the station.", "C'è un parco vicino alla stazione.")),
    facilityTeiruLine("neighborhood-services-4-t3", "a2-value-facility-teiru-aiteiru", "a2-value-fac-ginkou-subject", "a2-context-neighborhood", L("The bank is open.", "La banca è aperta.")),
    facilityTeiruLine("neighborhood-services-4-t4", "a2-value-facility-teiru-shimatteiru", "a2-value-fac-yuubinkyoku-subject", "a2-context-neighborhood", L("The post office is closed.", "L'ufficio postale è chiuso.")),
    facilityLine("neighborhood-services-4-t5", "a2-value-exist-aru", "a2-value-fac-byouin-subject", "a2-value-loc-eki-m7", "a2-context-neighborhood", L("There is a hospital near the station.", "C'è un ospedale vicino alla stazione.")),
  ],
});

export const module7Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module7Recipe = A2_MODULE_MANIFEST[MODULE_ID];
