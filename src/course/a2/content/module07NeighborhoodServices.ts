/**
 * A2 Module 7 — Neighborhood services (Phase 3 Task 5).
 *
 * Four instructional lessons: possibility intro (koto-ga-dekimasu) with a
 * genuine permission-temoii transfer, can-cannot (possibility
 * controlled practice, affirmative and negative), ask-directions (asking
 * where a facility is / asking someone for directions or a favor — request
 * phrase content only after request-tekudasai's own intro), and
 * explain-facility (existence statements for a facility's location, near a
 * landmark or nearby — no supporting Can-do; grammar-spiral does not assign
 * teiru recurrence to this lesson). Every sentence carries a semantic-ID-only
 * variant; all Japanese/romaji lives in the shared A2 semantic-value
 * catalog (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  a2SubjectReferentValueId as subjectReferentValueId,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";
import type { FormSelection } from "../../foundations/types";

const MODULE_ID = "neighborhood-services";

function L(en: string, it: string) {
  return { en, it };
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
 * (a2-family-possibility), predicate carries the suffixed/baked content. */
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
    line("neighborhood-services-1-m9", "a2-family-possibility", "a2-value-possibility-nashi-tsukau", "a2-context-neighborhood", L("I cannot use the water.", "Non posso usare l'acqua."), { object: "a2-value-obj-mizu", speakerRole: "a2-role-learner" }),
    line("neighborhood-services-1-m10", "a2-family-possibility", "a2-value-possibility-nashi-hanasu", "a2-context-neighborhood", L("I cannot speak Japanese here.", "Non posso parlare giapponese qui."), { object: "a2-value-obj-nihongo-m7", speakerRole: "a2-role-friend" }),
    // M4 spec-fix (Phase 3 Task 5 quality pass): ns1's own primary Can-do is
    // authoritatively framed as "ask whether you can do something at a
    // place" (a2-cando-possibility's L1 descriptor cites the illustrative
    // "tsukaemasu ka"), but every model above only ever states possibility
    // (affirmative/negative) or asks temoii PERMISSION ("may I") — never
    // actually asks whether something is POSSIBLE. Fixed generically at the
    // family/realizer boundary: the same `interrogative` FormSelection
    // permission-temoii's own questions already use, now applied to the
    // possibility family itself (m1's own "I can use the card" recombined as
    // a genuine question) — a real "koto ga dekimasu ka", never a hand-baked
    // duplicate clause and never the early, unintroduced "tsukaemasu"
    // potential form L1 merely illustrates with (L2 only ever teaches koto
    // ga dekiru).
    line("neighborhood-services-1-m11", "a2-family-possibility", "a2-value-possibility-tsukau", "a2-context-neighborhood", L("Can I use the card here?", "Si può usare la tessera qui?"), { object: "a2-value-obj-kaado", interrogative: true, speakerRole: "a2-role-learner" }),
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
// Lesson neighborhood-services-2 — Can-cannot: possibility controlled
// practice, affirmative and negative (ns2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "neighborhood-services-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-can-cannot",
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
// Lesson neighborhood-services-3 — Ask directions: directions and requests
// (ns3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "neighborhood-services-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-ask-directions",
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
    line("neighborhood-services-3-m9", "a2-family-request-tekudasai", "a2-value-tekudasai-taberu", "a2-context-neighborhood", L("Please eat the vegetables.", "Per favore, mangia le verdure."), { object: "a2-value-obj-yasai", speakerRole: "a2-role-clerk" }),
  ],
  // Phase 3 Task 5 fix ("introduction before use"): a2-family-ask-where and
  // a2-family-ask-for-help have NO subject/object/location slot at all (a
  // pure whole-clause bake, unlike M5's te-sequence or M8's
  // order-food/report-problem, which at least have a
  // subject slot to recombine with) — so a transfer here can never be both
  // genuinely novel (I2) and honestly "introduced" unless it draws on a
  // *different*, already-fully-available compositional family instead of
  // inventing new whole-clause-only "ask-near-*" content no model ever
  // demonstrates. a2-family-request-tekudasai's own canDoIds already
  // include "a2-cando-ask-directions" (this lesson's primary), and its verb
  // senses have been fully available since permission-requests-3 (M6) — so
  // these 5 transfers genuinely recombine an already-introduced tekudasai
  // predicate with an already-introduced object, never a brand-new value.
  transfers: [
    line("neighborhood-services-3-t1", "a2-family-request-tekudasai", "a2-value-tekudasai-kaku", "a2-context-neighborhood", L("Please write your name.", "Per favore, scrivi il tuo nome."), { object: "a2-value-obj-namae" }),
    line("neighborhood-services-3-t2", "a2-family-request-tekudasai", "a2-value-tekudasai-matsu", "a2-context-neighborhood", L("Please wait.", "Per favore, aspetta."), {}),
    line("neighborhood-services-3-t3", "a2-family-request-tekudasai", "a2-value-tekudasai-suwaru", "a2-context-neighborhood", L("Please sit down.", "Per favore, siediti."), {}),
    line("neighborhood-services-3-t4", "a2-family-request-tekudasai", "a2-value-tekudasai-hanasu", "a2-context-conversation", L("Please speak in English.", "Per favore, parla in inglese."), { object: "a2-value-obj-eigo" }),
    line("neighborhood-services-3-t5", "a2-family-request-tekudasai", "a2-value-tekudasai-tatsu", "a2-context-neighborhood", L("Please stand up.", "Per favore, alzati."), {}),
  ],
});

// ---------------------------------------------------------------------------
// Lesson neighborhood-services-4 — Explain facility: existence statements
// for a facility's location, near a landmark or nearby (ns4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "neighborhood-services-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-explain-facility",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-describe-facility"],
  introducedSenseIds: [],
  models: [
    facilityLine("neighborhood-services-4-m1", "a2-value-exist-aru", "a2-value-fac-byouin-subject", null, "a2-context-neighborhood", L("There is a hospital.", "C'è un ospedale."), "a2-role-learner"),
    facilityLine("neighborhood-services-4-m2", "a2-value-exist-aru", "a2-value-fac-ginkou-subject", "a2-value-loc-eki-m7", "a2-context-neighborhood", L("There is a bank near the station.", "C'è una banca vicino alla stazione."), "a2-role-emi"),
    facilityLine("neighborhood-services-4-m3", "a2-value-exist-aru", "a2-value-fac-yuubinkyoku-subject", null, "a2-context-neighborhood", L("There is a post office.", "C'è un ufficio postale."), "a2-role-sora"),
    facilityLine("neighborhood-services-4-m4", "a2-value-exist-aru", "a2-value-fac-toshokan-subject", "a2-value-loc-eki-m7", "a2-context-conversation", L("There is a library near the station.", "C'è una biblioteca vicino alla stazione."), "a2-role-colleague"),
    facilityLine("neighborhood-services-4-m5", "a2-value-exist-aru", "a2-value-fac-koen-subject", null, "a2-context-outing", L("There is a park.", "C'è un parco."), "a2-role-teacher"),
    // Phase 3 Task 5 spec-fix: the authoritative recipe gives this lesson no
    // support at all (grammar-spiral does not assign teiru recurrence here),
    // so these two models recombine the SAME already-established
    // a2-family-describe-facility construction with two more genuinely
    // distinct existence-flavored senses — imasu/iru (animate existence, for
    // facility staff, at the already-available M6 "library" location
    // a2-value-loc-toshokan) and miemasu/mieru (visibility) — instead of an
    // untracked teiru recurrence.
    facilityLine("neighborhood-services-4-m6", "a2-value-exist-iru", "a2-value-fac-shokuin-subject", "a2-value-loc-toshokan", "a2-context-neighborhood", L("There are staff at the library.", "Ci sono impiegati in biblioteca."), "a2-role-friend"),
    facilityLine("neighborhood-services-4-m7", "a2-value-exist-mieru", "a2-value-fac-koen-subject", null, "a2-context-neighborhood", L("You can see the park.", "Si vede il parco."), "a2-role-clerk"),
    facilityLine("neighborhood-services-4-m8", "a2-value-exist-aru", "a2-value-fac-ginkou-subject", null, "a2-context-neighborhood", L("There is a bank.", "C'è una banca."), "a2-role-learner"),
  ],
  transfers: [
    facilityLine("neighborhood-services-4-t1", "a2-value-exist-aru", "a2-value-fac-yuubinkyoku-subject", "a2-value-loc-eki-m7", "a2-context-neighborhood", L("There is a post office near the station.", "C'è un ufficio postale vicino alla stazione.")),
    facilityLine("neighborhood-services-4-t2", "a2-value-exist-aru", "a2-value-fac-koen-subject", "a2-value-loc-eki-m7", "a2-context-neighborhood", L("There is a park near the station.", "C'è un parco vicino alla stazione.")),
    facilityLine("neighborhood-services-4-t3", "a2-value-exist-iru", "a2-value-fac-shokuin-subject", "a2-value-loc-koko", "a2-context-neighborhood", L("There are staff here.", "Ci sono impiegati qui.")),
    facilityLine("neighborhood-services-4-t4", "a2-value-exist-mieru", "a2-value-fac-byouin-subject", null, "a2-context-neighborhood", L("You can see the hospital.", "Si vede l'ospedale.")),
    facilityLine("neighborhood-services-4-t5", "a2-value-exist-aru", "a2-value-fac-byouin-subject", "a2-value-loc-eki-m7", "a2-context-neighborhood", L("There is a hospital near the station.", "C'è un ospedale vicino alla stazione.")),
  ],
});


export const module7Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module7Recipe = A2_MODULE_MANIFEST[MODULE_ID];
