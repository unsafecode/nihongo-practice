/**
 * A2 Module 6 — Permission & requests (Phase 3 Task 5).
 *
 * Four instructional lessons: permission-temoii intro (asking for/granting
 * permission), prohibition-tewaikenai intro (saying something is not
 * allowed), request-tekudasai intro (polite requests) with permission-temoii
 * recurrence, and negative-request intro (polite negative requests) with
 * prohibition-tewaikenai recurrence. Direct-address content uses a natural
 * vocative (referent + san + comma), never an explicit topic-marked
 * (Xha-marked) named individual. Every sentence carries a semantic-ID-only
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

const MODULE_ID = "permission-requests";

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
  /** "vocative" (natural direct address: referent + san + comma) is used
   * for sora/emi here — never "explicit" (Xha-marked), which would
   * topic-mark a named individual instead of addressing them directly. */
  readonly subjectReferent?: string | null;
  readonly subjectRealization?: "omitted" | "explicit" | "vocative";
  readonly interrogative?: boolean;
  readonly form?: FormSelection;
  /** Discourse-only speaker attribution (who is saying/asking this) —
   * never rendered in the Japanese itself, so it is set independently of
   * subjectReferent/vocative, exactly like module04's bareLine. Needed for
   * role diversity on lines whose content has no visible subject at all
   * (e.g. a general prohibition/request with no addressee named). */
  readonly speakerRole?: string;
}

/** One M6 line: subject optional (vocative for direct address, never
 * explicit for a named individual), object/location optional (a2-family-*
 * -object / -location), predicate carries the suffixed verb. */
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

// ---------------------------------------------------------------------------
// Lesson permission-requests-1 — Permission temoii intro (pr1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "permission-requests-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-permission-temoii",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-permission-temoii"],
  introducedSenseIds: [],
  models: [
    line("permission-requests-1-m1", "a2-family-permission-temoii", "a2-value-temoii-taberu", "a2-context-rules", L("Sora, may I eat this?", "Sora, posso mangiare questo?"), { object: "a2-value-obj-kore-m6", subjectReferent: "a2-referent-sora", interrogative: true }),
    line("permission-requests-1-m2", "a2-family-permission-temoii", "a2-value-temoii-nomu", "a2-context-rules", L("May I drink water?", "Posso bere l'acqua?"), { object: "a2-value-obj-mizu", interrogative: true }),
    line("permission-requests-1-m3", "a2-family-permission-temoii", "a2-value-temoii-kaku", "a2-context-rules", L("Emi, may I write my name?", "Emi, posso scrivere il mio nome?"), { object: "a2-value-obj-namae", subjectReferent: "a2-referent-emi", interrogative: true }),
    line("permission-requests-1-m4", "a2-family-permission-temoii", "a2-value-temoii-yomu", "a2-context-rules", L("May I read the book?", "Posso leggere il libro?"), { object: "a2-value-obj-hon-m5", interrogative: true }),
    line("permission-requests-1-m5", "a2-family-permission-temoii", "a2-value-temoii-hanasu", "a2-context-rules", L("May I speak English?", "Posso parlare inglese?"), { object: "a2-value-obj-eigo", interrogative: true }),
    line("permission-requests-1-m6", "a2-family-permission-temoii-location", "a2-value-temoii-loc-hanasu", "a2-context-rules", L("May I talk in the classroom?", "Posso parlare in classe?"), { location: "a2-value-loc-kyoushitsu", interrogative: true }),
    line("permission-requests-1-m7", "a2-family-permission-temoii-location", "a2-value-temoii-loc-tsukau", "a2-context-neighborhood", L("Sora, may I use this at the library?", "Sora, posso usarlo in biblioteca?"), { location: "a2-value-loc-toshokan", subjectReferent: "a2-referent-sora", interrogative: true }),
    line("permission-requests-1-m8", "a2-family-permission-temoii-location", "a2-value-temoii-loc-matsu", "a2-context-neighborhood", L("May I wait at the station?", "Posso aspettare alla stazione?"), { location: "a2-value-loc-eki", interrogative: true }),
  ],
  transfers: [
    line("permission-requests-1-t1", "a2-family-permission-temoii", "a2-value-temoii-taberu", "a2-context-rules", L("You may eat this.", "Puoi mangiare questo."), { object: "a2-value-obj-kore-m6" }),
    line("permission-requests-1-t2", "a2-family-permission-temoii", "a2-value-temoii-nomu", "a2-context-rules", L("Emi, may I drink water?", "Emi, posso bere l'acqua?"), { object: "a2-value-obj-mizu", subjectReferent: "a2-referent-emi", interrogative: true }),
    line("permission-requests-1-t3", "a2-family-permission-temoii", "a2-value-temoii-yomu", "a2-context-rules", L("Sora, may I read the book?", "Sora, posso leggere il libro?"), { object: "a2-value-obj-hon-m5", subjectReferent: "a2-referent-sora", interrogative: true }),
    line("permission-requests-1-t4", "a2-family-permission-temoii-location", "a2-value-temoii-loc-tsukau", "a2-context-neighborhood", L("You may use this at the library.", "Puoi usarlo in biblioteca."), { location: "a2-value-loc-toshokan" }),
    line("permission-requests-1-t5", "a2-family-permission-temoii", "a2-value-temoii-hanasu", "a2-context-rules", L("Emi, may I speak English?", "Emi, posso parlare inglese?"), { object: "a2-value-obj-eigo", subjectReferent: "a2-referent-emi", interrogative: true }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson permission-requests-2 — Prohibition tewaikenai intro (pr2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "permission-requests-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-prohibition-tewaikenai",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-prohibition-tewaikenai"],
  introducedSenseIds: [],
  models: [
    line("permission-requests-2-m1", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-taberu", "a2-context-rules", L("You must not eat this.", "Non devi mangiare questo."), { object: "a2-value-obj-kore-m6", speakerRole: "a2-role-teacher" }),
    line("permission-requests-2-m2", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-nomu", "a2-context-rules", L("You must not drink water here.", "Non devi bere l'acqua qui."), { object: "a2-value-obj-mizu", speakerRole: "a2-role-clerk" }),
    line("permission-requests-2-m3", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-kesu", "a2-context-rules", L("You must not turn off the lights.", "Non devi spegnere le luci."), { object: "a2-value-obj-denki", speakerRole: "a2-role-colleague" }),
    line("permission-requests-2-m4", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-hanasu", "a2-context-rules", L("You must not speak English here.", "Non devi parlare inglese qui."), { object: "a2-value-obj-eigo", speakerRole: "a2-role-teacher" }),
    line("permission-requests-2-m5", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-suwaru", "a2-context-rules", L("You must not sit down.", "Non devi sederti."), { speakerRole: "a2-role-friend" }),
    line("permission-requests-2-m6", "a2-family-prohibition-tewaikenai-location", "a2-value-tewaikenai-loc-taberu", "a2-context-rules", L("You must not eat in the classroom.", "Non devi mangiare in classe."), { location: "a2-value-loc-kyoushitsu", speakerRole: "a2-role-teacher" }),
    line("permission-requests-2-m7", "a2-family-prohibition-tewaikenai-location", "a2-value-tewaikenai-loc-hanasu", "a2-context-neighborhood", L("You must not talk in the library.", "Non devi parlare in biblioteca."), { location: "a2-value-loc-toshokan", speakerRole: "a2-role-clerk" }),
    line("permission-requests-2-m8", "a2-family-prohibition-tewaikenai-location", "a2-value-tewaikenai-loc-tomaru", "a2-context-rules", L("You must not stop here.", "Non devi fermarti qui."), { location: "a2-value-loc-koko", speakerRole: "a2-role-colleague" }),
  ],
  transfers: [
    line("permission-requests-2-t1", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-taberu", "a2-context-rules", L("Sora, you must not eat this.", "Sora, non devi mangiare questo."), { object: "a2-value-obj-kore-m6", subjectReferent: "a2-referent-sora" }),
    line("permission-requests-2-t2", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-kesu", "a2-context-rules", L("Emi, you must not turn off the lights.", "Emi, non devi spegnere le luci."), { object: "a2-value-obj-denki", subjectReferent: "a2-referent-emi" }),
    line("permission-requests-2-t3", "a2-family-prohibition-tewaikenai-location", "a2-value-tewaikenai-loc-hanasu", "a2-context-neighborhood", L("Sora, you must not talk in the library.", "Sora, non devi parlare in biblioteca."), { location: "a2-value-loc-toshokan", subjectReferent: "a2-referent-sora" }),
    line("permission-requests-2-t4", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-suwaru", "a2-context-rules", L("Emi, you must not sit down.", "Emi, non devi sederti."), { subjectReferent: "a2-referent-emi" }),
    line("permission-requests-2-t5", "a2-family-prohibition-tewaikenai-location", "a2-value-tewaikenai-loc-taberu", "a2-context-rules", L("Sora, you must not eat in the classroom.", "Sora, non devi mangiare in classe."), { location: "a2-value-loc-kyoushitsu", subjectReferent: "a2-referent-sora" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson permission-requests-3 — Request tekudasai intro + permission
// practice/recurrence (pr3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "permission-requests-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-request-tekudasai",
  supportingCanDoIds: ["a2-cando-permission-temoii"],
  introducedConceptIds: ["a2-concept-request-tekudasai"],
  introducedSenseIds: [],
  models: [
    line("permission-requests-3-m1", "a2-family-request-tekudasai", "a2-value-tekudasai-kesu", "a2-context-rules", L("Please turn off the lights.", "Per favore, spegni le luci."), { object: "a2-value-obj-denki", speakerRole: "a2-role-teacher" }),
    line("permission-requests-3-m2", "a2-family-request-tekudasai", "a2-value-tekudasai-matsu", "a2-context-neighborhood", L("Please wait.", "Per favore, aspetta."), { speakerRole: "a2-role-clerk" }),
    line("permission-requests-3-m3", "a2-family-request-tekudasai", "a2-value-tekudasai-kaku", "a2-context-rules", L("Please write your name.", "Per favore, scrivi il tuo nome."), { object: "a2-value-obj-namae", speakerRole: "a2-role-teacher" }),
    line("permission-requests-3-m4", "a2-family-request-tekudasai", "a2-value-tekudasai-suwaru", "a2-context-rules", L("Please sit down.", "Per favore, siediti."), { speakerRole: "a2-role-colleague" }),
    line("permission-requests-3-m5", "a2-family-request-tekudasai", "a2-value-tekudasai-tatsu", "a2-context-rules", L("Please stand up.", "Per favore, alzati."), { speakerRole: "a2-role-friend" }),
    line("permission-requests-3-m6", "a2-family-request-tekudasai", "a2-value-tekudasai-taberu", "a2-context-rules", L("Please eat the vegetables.", "Per favore, mangia le verdure."), { object: "a2-value-obj-yasai", speakerRole: "a2-role-teacher" }),
    line("permission-requests-3-m7", "a2-family-request-tekudasai", "a2-value-tekudasai-hanasu", "a2-context-rules", L("Please speak English.", "Per favore, parla inglese."), { object: "a2-value-obj-eigo", speakerRole: "a2-role-colleague" }),
    line("permission-requests-3-m8", "a2-family-permission-temoii", "a2-value-temoii-taberu", "a2-context-rules", L("May I eat this?", "Posso mangiare questo?"), { object: "a2-value-obj-kore-m6", interrogative: true, speakerRole: "a2-role-learner" }),
  ],
  transfers: [
    line("permission-requests-3-t1", "a2-family-request-tekudasai", "a2-value-tekudasai-kesu", "a2-context-rules", L("Sora, please turn off the lights.", "Sora, per favore spegni le luci."), { object: "a2-value-obj-denki", subjectReferent: "a2-referent-sora" }),
    line("permission-requests-3-t2", "a2-family-request-tekudasai", "a2-value-tekudasai-taberu", "a2-context-rules", L("Emi, please eat the vegetables.", "Emi, per favore mangia le verdure."), { object: "a2-value-obj-yasai", subjectReferent: "a2-referent-emi" }),
    line("permission-requests-3-t3", "a2-family-request-tekudasai", "a2-value-tekudasai-suwaru", "a2-context-rules", L("Sora, please sit down.", "Sora, per favore siediti."), { subjectReferent: "a2-referent-sora" }),
    line("permission-requests-3-t4", "a2-family-request-tekudasai", "a2-value-tekudasai-hanasu", "a2-context-rules", L("Emi, please speak English.", "Emi, per favore parla inglese."), { object: "a2-value-obj-eigo", subjectReferent: "a2-referent-emi" }),
    line("permission-requests-3-t5", "a2-family-permission-temoii", "a2-value-temoii-nomu", "a2-context-rules", L("May I drink water?", "Posso bere l'acqua?"), { object: "a2-value-obj-mizu", interrogative: true }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson permission-requests-4 — Negative request intro + prohibition
// practice/recurrence (pr4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "permission-requests-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-negative-request",
  supportingCanDoIds: ["a2-cando-prohibition-tewaikenai"],
  introducedConceptIds: ["a2-concept-negative-request"],
  introducedSenseIds: [],
  models: [
    line("permission-requests-4-m1", "a2-family-negative-request", "a2-value-naidekudasai-hairu", "a2-context-rules", L("Please don't enter.", "Per favore, non entrare."), { speakerRole: "a2-role-teacher" }),
    line("permission-requests-4-m2", "a2-family-negative-request", "a2-value-naidekudasai-tomaru", "a2-context-neighborhood", L("Please don't stop here.", "Per favore, non fermarti qui."), { speakerRole: "a2-role-clerk" }),
    line("permission-requests-4-m3", "a2-family-negative-request", "a2-value-naidekudasai-taberu", "a2-context-rules", L("Please don't eat this.", "Per favore, non mangiare questo."), { object: "a2-value-obj-kore-m6", speakerRole: "a2-role-colleague" }),
    line("permission-requests-4-m4", "a2-family-negative-request", "a2-value-naidekudasai-suwaru", "a2-context-routines", L("Please don't sit down.", "Per favore, non sederti."), { speakerRole: "a2-role-friend" }),
    line("permission-requests-4-m5", "a2-family-negative-request", "a2-value-naidekudasai-kesu", "a2-context-rules", L("Please don't turn off the lights.", "Per favore, non spegnere le luci."), { object: "a2-value-obj-denki", speakerRole: "a2-role-teacher" }),
    line("permission-requests-4-m6", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-hanasu", "a2-context-rules", L("You must not speak English here.", "Non devi parlare inglese qui."), { object: "a2-value-obj-eigo", speakerRole: "a2-role-colleague" }),
    line("permission-requests-4-m7", "a2-family-prohibition-tewaikenai-location", "a2-value-tewaikenai-loc-tomaru", "a2-context-neighborhood", L("You must not stop here.", "Non devi fermarti qui."), { location: "a2-value-loc-koko", speakerRole: "a2-role-clerk" }),
    line("permission-requests-4-m8", "a2-family-negative-request", "a2-value-naidekudasai-hairu", "a2-context-rules", L("Sora, please don't enter.", "Sora, per favore non entrare."), { subjectReferent: "a2-referent-sora" }),
  ],
  transfers: [
    line("permission-requests-4-t1", "a2-family-negative-request", "a2-value-naidekudasai-tomaru", "a2-context-rules", L("Emi, please don't stop here.", "Emi, per favore non fermarti qui."), { subjectReferent: "a2-referent-emi" }),
    line("permission-requests-4-t2", "a2-family-negative-request", "a2-value-naidekudasai-taberu", "a2-context-rules", L("Sora, please don't eat this.", "Sora, per favore non mangiare questo."), { object: "a2-value-obj-kore-m6", subjectReferent: "a2-referent-sora" }),
    line("permission-requests-4-t3", "a2-family-negative-request", "a2-value-naidekudasai-suwaru", "a2-context-rules", L("Emi, please don't sit down.", "Emi, per favore non sederti."), { subjectReferent: "a2-referent-emi" }),
    line("permission-requests-4-t4", "a2-family-prohibition-tewaikenai", "a2-value-tewaikenai-taberu", "a2-context-rules", L("You must not eat this.", "Non devi mangiare questo."), { object: "a2-value-obj-kore-m6" }),
    line("permission-requests-4-t5", "a2-family-negative-request", "a2-value-naidekudasai-kesu", "a2-context-rules", L("Emi, please don't turn off the lights.", "Emi, per favore non spegnere le luci."), { object: "a2-value-obj-denki", subjectReferent: "a2-referent-emi" }),
  ],
});

export const module6Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module6Recipe = A2_MODULE_MANIFEST[MODULE_ID];
