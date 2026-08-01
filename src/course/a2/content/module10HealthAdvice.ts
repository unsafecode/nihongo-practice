/**
 * A2 Module 10 — Health and advice (Phase 3 Task 6).
 *
 * Four instructional lessons: ha1 (health-advice-1) describes symptoms
 * through three compositional/reused families — itai (X ga itai desu, body
 * part varies), genki (general wellbeing), and the EXISTING M7
 * rule-existence rule reused verbatim for "netsu ga arimasu" (a fever
 * exists); ha2 (health-advice-2) introduces the supporting
 * "tahouga-advice" form (class-correct past base + "hou ga ii desu"),
 * transferring into reason-kara (M4 family recurrence); ha3
 * (health-advice-3) is getting better, transferring into negative-request
 * (M6 family recurrence); ha4 (health-advice-4) is a natural
 * clinic-appointment dialogue. Every sentence carries a semantic-ID-only
 * variant; all Japanese/romaji lives in the shared A2 semantic-value catalog
 * (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  a2SubjectReferentValueId as subjectReferentValueId,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";
import type { FormSelection } from "../../foundations/types";

const MODULE_ID = "health-advice";

function L(en: string, it: string) {
  return { en, it };
}

interface LineOptions {
  readonly object?: string | null;
  readonly subjectReferent?: string | null;
  readonly subjectRealization?: "omitted" | "explicit" | "vocative";
  /** Overrides the computed subject SLOT value directly — used only for
   * a2-family-symptom-exist, whose "subject" is the existing symptom-thing
   * itself (e.g. a fever), never a person referent (mirrors
   * a2-family-describe-facility's own facilityLine precedent exactly). */
  readonly subjectValue?: string;
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
  if (options.subjectValue) {
    slots.subject = options.subjectValue;
  } else if (subjectRealization !== "omitted" && subjectReferent !== null) {
    slots.subject = subjectReferentValueId(subjectReferent);
  }
  if (options.object) {
    slots.object = options.object;
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
    speakerRole: options.speakerRole,
    form: options.form,
  };
}

const HEALTH = "a2-context-health";
const AMONG_FRIENDS = "a2-context-among-friends";
const WORKPLACE = "a2-context-workplace";

const NEGATIVE: FormSelection = { polarity: "negative", tense: "present", formality: "polite" };
const PAST: FormSelection = { polarity: "affirmative", tense: "past", formality: "polite" };

// ---------------------------------------------------------------------------
// Lesson health-advice-1 — Describe symptoms (ha1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "health-advice-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-describe-symptoms",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-describe-symptoms"],
  introducedSenseIds: ["a2-sense-itai", "a2-sense-genki"],
  models: [
    line("health-advice-1-m1", "a2-family-symptom", "a2-value-itai-stem", HEALTH, L("My head hurts.", "Mi fa male la testa."), { object: "a2-value-obj-atama", speakerRole: "a2-role-learner" }),
    line("health-advice-1-m2", "a2-family-symptom", "a2-value-itai-stem", AMONG_FRIENDS, L("The friend's stomach hurts.", "Al mio amico fa male la pancia."), { object: "a2-value-obj-onaka", subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
    line("health-advice-1-m3", "a2-family-symptom", "a2-value-itai-stem", WORKPLACE, L("The colleague's throat doesn't hurt.", "Al collega non fa male la gola."), { object: "a2-value-obj-nodo", subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-colleague", form: NEGATIVE }),
    line("health-advice-1-m4", "a2-family-symptom", "a2-value-itai-stem", HEALTH, L("My tooth hurt.", "Mi faceva male il dente."), { object: "a2-value-obj-ha", speakerRole: "a2-role-learner", form: PAST }),
    line("health-advice-1-m5", "a2-family-wellbeing", "a2-value-genki-stem", HEALTH, L("I'm not well.", "Non sto bene."), { speakerRole: "a2-role-learner", form: NEGATIVE }),
    line("health-advice-1-m6", "a2-family-wellbeing", "a2-value-genki-stem", WORKPLACE, L("The teacher is well.", "L'insegnante sta bene."), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
    line("health-advice-1-m7", "a2-family-symptom", "a2-value-itai-stem", AMONG_FRIENDS, L("Sora's head hurts.", "A Sora fa male la testa."), { object: "a2-value-obj-atama", subjectReferent: "a2-referent-sora", subjectRealization: "explicit", speakerRole: "a2-role-sora" }),
    line("health-advice-1-m8", "a2-family-symptom-exist", "a2-value-exist-aru", HEALTH, L("I have a fever.", "Ho la febbre."), { subjectValue: "a2-value-netsu-subject", subjectRealization: "explicit", speakerRole: "a2-role-learner" }),
  ],
  // Every transfer recombines an already-modeled predicate (itai/genki —
  // m1-m7, above) with a body-part/subject/form pairing not used in this
  // lesson's own models, so all 5 transfers stay visibly novel.
  transfers: [
    line("health-advice-1-t1", "a2-family-symptom", "a2-value-itai-stem", HEALTH, L("Emi's head doesn't hurt.", "A Emi non fa male la testa."), { object: "a2-value-obj-atama", subjectReferent: "a2-referent-emi", subjectRealization: "explicit", speakerRole: "a2-role-emi", form: NEGATIVE }),
    line("health-advice-1-t2", "a2-family-symptom", "a2-value-itai-stem", AMONG_FRIENDS, L("The friend's tooth hurts.", "Al mio amico fa male il dente."), { object: "a2-value-obj-ha", subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
    line("health-advice-1-t3", "a2-family-wellbeing", "a2-value-genki-stem", WORKPLACE, L("The colleague isn't well.", "Il collega non sta bene."), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-colleague", form: NEGATIVE }),
    line("health-advice-1-t4", "a2-family-symptom", "a2-value-itai-stem", HEALTH, L("Sora's stomach hurt.", "A Sora faceva male la pancia."), { object: "a2-value-obj-onaka", subjectReferent: "a2-referent-sora", subjectRealization: "explicit", speakerRole: "a2-role-sora", form: PAST }),
    line("health-advice-1-t5", "a2-family-symptom", "a2-value-itai-stem", HEALTH, L("The teacher's throat hurts.", "All'insegnante fa male la gola."), { object: "a2-value-obj-nodo", subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson health-advice-2 — Advice with "hou ga ii" (ha2), with reason-kara
// true transfer
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "health-advice-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-advice-tahouga",
  supportingCanDoIds: ["a2-cando-reason-kara"],
  introducedConceptIds: ["a2-concept-tahouga-advice"],
  introducedSenseIds: [],
  models: [
    line("health-advice-2-m1", "a2-family-tahouga-advice", "a2-value-tahouga-yasumu", HEALTH, L("You should rest.", "Dovresti riposare."), { speakerRole: "a2-role-learner" }),
    line("health-advice-2-m2", "a2-family-tahouga-advice", "a2-value-tahouga-byouin", AMONG_FRIENDS, L("Sora, you should go to the hospital.", "Sora, dovresti andare in ospedale."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-friend" }),
    line("health-advice-2-m3", "a2-family-tahouga-advice", "a2-value-tahouga-kusuri", HEALTH, L("You should take medicine.", "Dovresti prendere la medicina."), { speakerRole: "a2-role-teacher" }),
    line("health-advice-2-m4", "a2-family-tahouga-advice", "a2-value-tahouga-hayaku-neru", AMONG_FRIENDS, L("Emi, you should go to bed early.", "Emi, dovresti andare a letto presto."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-colleague" }),
    line("health-advice-2-m5", "a2-family-tahouga-advice", "a2-value-tahouga-yasumu", AMONG_FRIENDS, L("Sora, you should rest.", "Sora, dovresti riposare."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("health-advice-2-m6", "a2-family-tahouga-advice", "a2-value-tahouga-byouin", AMONG_FRIENDS, L("Emi, you should go to the hospital.", "Emi, dovresti andare in ospedale."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("health-advice-2-m7", "a2-family-reason-kara", "a2-value-kara-atama-yasumu", HEALTH, L("Since your head hurts, you should rest.", "Siccome ti fa male la testa, dovresti riposare."), { speakerRole: "a2-role-teacher" }),
    line("health-advice-2-m8", "a2-family-reason-kara", "a2-value-kara-netsu-byouin", HEALTH, L("Since you have a fever, you should go to the hospital.", "Siccome hai la febbre, dovresti andare in ospedale."), { speakerRole: "a2-role-colleague" }),
  ],
  // Every transfer recombines an already-modeled predicate with a
  // vocative/subject pairing not used above, so all 5 transfers stay
  // visibly novel.
  transfers: [
    line("health-advice-2-t1", "a2-family-tahouga-advice", "a2-value-tahouga-kusuri", AMONG_FRIENDS, L("Sora, you should take medicine.", "Sora, dovresti prendere la medicina."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-friend" }),
    line("health-advice-2-t2", "a2-family-tahouga-advice", "a2-value-tahouga-yasumu", AMONG_FRIENDS, L("Emi, you should rest.", "Emi, dovresti riposare."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-teacher" }),
    line("health-advice-2-t3", "a2-family-reason-kara", "a2-value-kara-atama-yasumu", AMONG_FRIENDS, L("Sora, since your head hurts, you should rest.", "Sora, siccome ti fa male la testa, dovresti riposare."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("health-advice-2-t4", "a2-family-reason-kara", "a2-value-kara-netsu-byouin", AMONG_FRIENDS, L("Emi, since you have a fever, you should go to the hospital.", "Emi, siccome hai la febbre, dovresti andare in ospedale."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("health-advice-2-t5", "a2-family-tahouga-advice", "a2-value-tahouga-hayaku-neru", AMONG_FRIENDS, L("Sora, you should go to bed early.", "Sora, dovresti andare a letto presto."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-colleague" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson health-advice-3 — Getting better (ha3), with negative-request true
// transfer
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "health-advice-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-get-better",
  supportingCanDoIds: ["a2-cando-negative-request"],
  introducedConceptIds: ["a2-concept-get-better"],
  introducedSenseIds: [],
  models: [
    line("health-advice-3-m1", "a2-family-get-better", "a2-value-better-daijoubu", HEALTH, L("I'm okay now.", "Adesso sto bene."), { speakerRole: "a2-role-learner" }),
    line("health-advice-3-m2", "a2-family-get-better", "a2-value-better-genki-ni-natta", AMONG_FRIENDS, L("Sora, I got better.", "Sora, sono guarito."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-learner" , form: PAST }),
    line("health-advice-3-m3", "a2-family-get-better", "a2-value-better-naotta", HEALTH, L("I recovered.", "Sono guarito."), { speakerRole: "a2-role-friend" , form: PAST }),
    line("health-advice-3-m4", "a2-family-get-better", "a2-value-better-mou-sukoshi-yasunde", AMONG_FRIENDS, L("Emi, please rest a bit more.", "Emi, riposa ancora un po'."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-teacher" }),
    line("health-advice-3-m5", "a2-family-get-better", "a2-value-better-daijoubu", AMONG_FRIENDS, L("Emi, I'm okay now.", "Emi, adesso sto bene."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-colleague" }),
    line("health-advice-3-m6", "a2-family-get-better", "a2-value-better-naotta", AMONG_FRIENDS, L("Sora, I recovered.", "Sora, sono guarito."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-learner" , form: PAST }),
    line("health-advice-3-m7", "a2-family-negative-request", "a2-value-naidekudasai-muri", HEALTH, L("Please don't overdo it.", "Per favore, non strafare."), { speakerRole: "a2-role-teacher" }),
    line("health-advice-3-m8", "a2-family-negative-request", "a2-value-naidekudasai-hataraku", WORKPLACE, L("Please don't work right now.", "Per favore, non lavorare adesso."), { speakerRole: "a2-role-colleague" }),
  ],
  // Every transfer recombines an already-modeled predicate with a
  // vocative/subject pairing not used above, so all 5 transfers stay
  // visibly novel.
  transfers: [
    line("health-advice-3-t1", "a2-family-get-better", "a2-value-better-genki-ni-natta", AMONG_FRIENDS, L("Emi, I got better.", "Emi, sono guarito."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-friend" , form: PAST }),
    line("health-advice-3-t2", "a2-family-get-better", "a2-value-better-mou-sukoshi-yasunde", AMONG_FRIENDS, L("Sora, please rest a bit more.", "Sora, riposa ancora un po'."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-teacher" }),
    line("health-advice-3-t3", "a2-family-get-better", "a2-value-better-daijoubu", AMONG_FRIENDS, L("Sora, I'm okay now.", "Sora, adesso sto bene."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-colleague" }),
    line("health-advice-3-t4", "a2-family-negative-request", "a2-value-naidekudasai-muri", AMONG_FRIENDS, L("Emi, please don't overdo it.", "Emi, per favore, non strafare."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("health-advice-3-t5", "a2-family-get-better", "a2-value-better-naotta", AMONG_FRIENDS, L("Emi, I recovered.", "Emi, sono guarito."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-colleague" , form: PAST }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson health-advice-4 — Clinic appointment (ha4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "health-advice-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-clinic-appointment",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-clinic-appointment"],
  introducedSenseIds: [],
  models: [
    line("health-advice-4-m1", "a2-family-clinic-appointment", "a2-value-clinic-yoyaku-shitai", HEALTH, L("I'd like to make an appointment.", "Vorrei prendere un appuntamento."), { speakerRole: "a2-role-learner" }),
    line("health-advice-4-m2", "a2-family-clinic-appointment", "a2-value-clinic-itsu-aiteru", WORKPLACE, L("When are you open?", "Quando siete aperti?"), { speakerRole: "a2-role-friend" }),
    line("health-advice-4-m3", "a2-family-clinic-appointment", "a2-value-clinic-jikan-henkou", HEALTH, L("Can you change the time?", "Potete cambiare l'orario?"), { speakerRole: "a2-role-colleague" }),
    line("health-advice-4-m4", "a2-family-clinic-appointment", "a2-value-clinic-ashita-ikitai", HEALTH, L("Is tomorrow okay too?", "Va bene anche domani?"), { speakerRole: "a2-role-teacher" }),
    line("health-advice-4-m5", "a2-family-clinic-appointment", "a2-value-clinic-yoyaku-shitai", HEALTH, L("Excuse me, I'd like to make an appointment.", "Scusi, vorrei prendere un appuntamento."), { subjectReferent: "a2-referent-reception", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("health-advice-4-m6", "a2-family-clinic-appointment", "a2-value-clinic-itsu-aiteru", HEALTH, L("Excuse me, when are you open?", "Scusi, quando siete aperti?"), { subjectReferent: "a2-referent-reception", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("health-advice-4-m7", "a2-family-clinic-appointment", "a2-value-clinic-jikan-henkou", HEALTH, L("Excuse me, can you change the time?", "Scusi, potete cambiare l'orario?"), { subjectReferent: "a2-referent-reception", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("health-advice-4-m8", "a2-family-clinic-appointment", "a2-value-clinic-ashita-ikitai", AMONG_FRIENDS, L("Is tomorrow also fine for Sora?", "Va bene anche domani per Sora?"), { subjectReferent: "a2-referent-sora", subjectRealization: "explicit", speakerRole: "a2-role-learner" }),
  ],
  // Every transfer recombines the already-modeled "ashita-ikitai" question
  // with a subject not used above, or vocative-addresses the clerk with a
  // predicate not yet paired with that address, so all 5 stay novel.
  transfers: [
    line("health-advice-4-t1", "a2-family-clinic-appointment", "a2-value-clinic-ashita-ikitai", HEALTH, L("Excuse me, is tomorrow okay too?", "Scusi, va bene anche domani?"), { subjectReferent: "a2-referent-reception", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("health-advice-4-t2", "a2-family-clinic-appointment", "a2-value-clinic-ashita-ikitai", AMONG_FRIENDS, L("Is tomorrow also fine for Emi?", "Va bene anche domani per Emi?"), { subjectReferent: "a2-referent-emi", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
    line("health-advice-4-t3", "a2-family-clinic-appointment", "a2-value-clinic-ashita-ikitai", WORKPLACE, L("Is tomorrow also fine for the teacher?", "Va bene anche domani per l'insegnante?"), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("health-advice-4-t4", "a2-family-clinic-appointment", "a2-value-clinic-ashita-ikitai", WORKPLACE, L("Is tomorrow also fine for the colleague?", "Va bene anche domani per il collega?"), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
    line("health-advice-4-t5", "a2-family-clinic-appointment", "a2-value-clinic-ashita-ikitai", AMONG_FRIENDS, L("Is tomorrow also fine for the friend?", "Va bene anche domani per l'amico?"), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
  ],
});

export const module10Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module10Recipe = A2_MODULE_MANIFEST[MODULE_ID];
