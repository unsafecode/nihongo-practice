/**
 * A2 Module 11 — Work and study messages (Phase 3 Task 6).
 *
 * Four instructional lessons: wsm1 (work-study-messages-1) messages a
 * colleague/classmate about being late or absent (whole-clause bake),
 * transferring into reason-kara/reason-node (M4 family recurrence); wsm2
 * (work-study-messages-2) asks a colleague for help (object-compositional,
 * the same construction shape as the EXISTING M6 request-tekudasai family,
 * scoped to its own topical Can-do), transferring into a genuine
 * request-tekudasai recombination; wsm3 (work-study-messages-3) reports
 * progress through a PURE recombination of the EXISTING M5
 * a2-family-ongoing-teiru — no new family or concept at all, exactly
 * mirroring the ~teiru transfer stage in the frozen grammar spiral; wsm4
 * (work-study-messages-4) replies/confirms with short set phrases. Every
 * sentence carries a semantic-ID-only variant; all Japanese/romaji lives in
 * the shared A2 semantic-value catalog (`a2SemanticCatalog.ts`) in
 * hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  a2SubjectReferentValueId as subjectReferentValueId,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";
import type { FormSelection } from "../../foundations/types";

const MODULE_ID = "work-study-messages";

function L(en: string, it: string) {
  return { en, it };
}

interface LineOptions {
  readonly object?: string | null;
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

const WORK_STUDY = "a2-context-work-study";
const WORKPLACE = "a2-context-workplace";

/** Honest FormSelection for a whole-clause-bake invariant value whose own
 * final clause is genuinely past-affirmative ("wakarimashita"/
 * "shouchi shimashita") — the builder's own default is present-affirmative,
 * so this must be declared explicitly (§ M4 spec-fix "form metadata"). */
const PAST_AFFIRMATIVE: FormSelection = { polarity: "affirmative", tense: "past", formality: "polite" };

// ---------------------------------------------------------------------------
// Lesson work-study-messages-1 — Message about being late/absent (wsm1),
// with reason-kara/reason-node true recurrence
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "work-study-messages-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-message-late-absent",
  supportingCanDoIds: ["a2-cando-reason-kara", "a2-cando-reason-node"],
  introducedConceptIds: ["a2-concept-message-late-absent"],
  introducedSenseIds: [],
  models: [
    line("work-study-messages-1-m1", "a2-family-message-late-absent", "a2-value-msg-osokunarimasu", WORK_STUDY, L("I'll be a bit late.", "Farò un po' tardi."), { speakerRole: "a2-role-learner" }),
    line("work-study-messages-1-m2", "a2-family-message-late-absent", "a2-value-msg-yasumimasu", WORK_STUDY, L("I'll be off today.", "Oggi mi assento."), { speakerRole: "a2-role-learner" }),
    line("work-study-messages-1-m3", "a2-family-message-late-absent", "a2-value-msg-sumimasen-osoku", WORKPLACE, L("Sorry, the train is delayed.", "Scusa, il treno è in ritardo."), { speakerRole: "a2-role-learner" }),
    line("work-study-messages-1-m4", "a2-family-message-late-absent", "a2-value-msg-yasumimasu", WORK_STUDY, L("Sora is off today.", "Oggi Sora si assenta."), { subjectReferent: "a2-referent-sora", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
    line("work-study-messages-1-m5", "a2-family-message-late-absent", "a2-value-msg-osokunarimasu", WORK_STUDY, L("Emi will be a bit late.", "Emi farà un po' tardi."), { subjectReferent: "a2-referent-emi", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-1-m6", "a2-family-message-late-absent", "a2-value-msg-yasumimasu", WORKPLACE, L("The teacher is off today.", "Oggi l'insegnante si assenta."), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-1-m7", "a2-family-reason-kara", "a2-value-kara-densha-okureru", WORK_STUDY, L("Since the train is delayed, I'll be a bit late.", "Siccome il treno è in ritardo, farò un po' tardi."), { speakerRole: "a2-role-learner" }),
    line("work-study-messages-1-m8", "a2-family-reason-node", "a2-value-node-netsu-yasumu", WORK_STUDY, L("Since I have a fever, I'll be off today.", "Siccome ho la febbre, oggi mi assento."), { speakerRole: "a2-role-learner" }),
  ],
  // Every transfer recombines an already-modeled predicate with a subject
  // not used above, so all 5 transfers stay visibly novel.
  transfers: [
    line("work-study-messages-1-t1", "a2-family-message-late-absent", "a2-value-msg-osokunarimasu", WORK_STUDY, L("The friend will be a bit late.", "L'amico farà un po' tardi."), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
    line("work-study-messages-1-t2", "a2-family-message-late-absent", "a2-value-msg-yasumimasu", WORK_STUDY, L("The colleague is off today.", "Oggi il collega si assenta."), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
    line("work-study-messages-1-t3", "a2-family-message-late-absent", "a2-value-msg-osokunarimasu", WORKPLACE, L("The teacher will be a bit late.", "L'insegnante farà un po' tardi."), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-learner" }),
    line("work-study-messages-1-t4", "a2-family-message-late-absent", "a2-value-msg-yasumimasu", WORK_STUDY, L("The friend is off today.", "Oggi l'amico si assenta."), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-1-t5", "a2-family-message-late-absent", "a2-value-msg-osokunarimasu", WORK_STUDY, L("The colleague will be a bit late.", "Il collega farà un po' tardi."), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson work-study-messages-2 — Ask a colleague for help (wsm2), with
// request-tekudasai true transfer
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "work-study-messages-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-ask-colleague",
  supportingCanDoIds: ["a2-cando-request-tekudasai"],
  introducedConceptIds: ["a2-concept-ask-colleague"],
  introducedSenseIds: [],
  models: [
    line("work-study-messages-2-m1", "a2-family-ask-colleague", "a2-value-ask-tetsudatte", WORK_STUDY, L("Please help with the documents.", "Per favore, aiutami con i documenti."), { object: "a2-value-obj-shorui", speakerRole: "a2-role-learner" }),
    line("work-study-messages-2-m2", "a2-family-ask-colleague", "a2-value-ask-oshiete", WORK_STUDY, L("Please explain the task to me.", "Per favore, spiegami il compito."), { object: "a2-value-obj-shigoto-m11", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-2-m3", "a2-family-ask-colleague", "a2-value-ask-tsutaete", WORKPLACE, L("Please pass along the email.", "Per favore, gira l'email."), { object: "a2-value-obj-mail", speakerRole: "a2-role-teacher" }),
    line("work-study-messages-2-m4", "a2-family-ask-colleague", "a2-value-ask-tetsudatte", WORK_STUDY, L("Please help with the task.", "Per favore, aiutami con il compito."), { object: "a2-value-obj-shigoto-m11", speakerRole: "a2-role-learner" }),
    line("work-study-messages-2-m5", "a2-family-ask-colleague", "a2-value-ask-oshiete", WORKPLACE, L("Please explain the email to me.", "Per favore, spiegami l'email."), { object: "a2-value-obj-mail", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-2-m6", "a2-family-ask-colleague", "a2-value-ask-tsutaete", WORK_STUDY, L("Please pass along the documents.", "Per favore, gira i documenti."), { object: "a2-value-obj-shorui", speakerRole: "a2-role-teacher" }),
    line("work-study-messages-2-m7", "a2-family-ask-colleague", "a2-value-ask-tetsudatte", WORK_STUDY, L("Sora, please help with the documents.", "Sora, aiutami con i documenti."), { object: "a2-value-obj-shorui", subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("work-study-messages-2-m8", "a2-family-ask-colleague", "a2-value-ask-oshiete", WORKPLACE, L("Emi, please explain the task to me.", "Emi, spiegami il compito."), { object: "a2-value-obj-shigoto-m11", subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    // m9: request-tekudasai's own "okuru" (send) value must also be
    // MODELED here directly, not only transferred (a compositional
    // family's predicate value still needs its OWN introduction,
    // independent of the object slot — mirrors
    // neighborhood-services-3-m9's own precedent). Matches t3's own
    // object below; t3 differentiates with a fresh vocative subject.
    line("work-study-messages-2-m9", "a2-family-request-tekudasai", "a2-value-tekudasai-okuru", WORK_STUDY, L("Please send the documents.", "Per favore, manda i documenti."), { object: "a2-value-obj-shorui", speakerRole: "a2-role-teacher" }),
  ],
  // t1/t2 recombine ask-colleague's own predicates with fresh
  // object/predicate pairings; t3-t5 are the genuine request-tekudasai
  // support transfer, reusing the EXISTING M6 family verbatim with new
  // work-flavored verbs/objects. t3 reuses m9's own okuru+shorui pairing
  // with a fresh vocative subject (so it stays visibly novel); t4
  // recombines the already-modeled okuru predicate with the
  // already-modeled mail object (a fresh pairing, never modeled as a
  // unit); t5 reuses the EXISTING M6 hanasu sense verbatim with the
  // already-modeled shigoto-m11 object.
  transfers: [
    line("work-study-messages-2-t1", "a2-family-ask-colleague", "a2-value-ask-tsutaete", WORK_STUDY, L("Please pass along the task.", "Per favore, gira il compito."), { object: "a2-value-obj-shigoto-m11", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-2-t2", "a2-family-ask-colleague", "a2-value-ask-tetsudatte", WORKPLACE, L("Please help with the email.", "Per favore, aiutami con l'email."), { object: "a2-value-obj-mail", speakerRole: "a2-role-teacher" }),
    line("work-study-messages-2-t3", "a2-family-request-tekudasai", "a2-value-tekudasai-okuru", WORK_STUDY, L("Sora, please send the documents.", "Sora, per favore manda i documenti."), { object: "a2-value-obj-shorui", subjectReferent: "a2-referent-sora", speakerRole: "a2-role-learner" }),
    line("work-study-messages-2-t4", "a2-family-request-tekudasai", "a2-value-tekudasai-okuru", WORKPLACE, L("Please send the email.", "Per favore, manda l'email."), { object: "a2-value-obj-mail", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-2-t5", "a2-family-request-tekudasai", "a2-value-tekudasai-hanasu", WORK_STUDY, L("Please talk about the task.", "Per favore, parla del compito."), { object: "a2-value-obj-shigoto-m11", speakerRole: "a2-role-teacher" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson work-study-messages-3 — Report progress (wsm3): a PURE
// a2-family-ongoing-teiru recombination — no new family/concept at all,
// exactly the ~teiru transfer stage in the frozen grammar spiral.
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "work-study-messages-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-report-progress",
  supportingCanDoIds: ["a2-cando-ongoing-teiru"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    line("work-study-messages-3-m1", "a2-family-ongoing-teiru", "a2-value-teiru-kaku", WORK_STUDY, L("I'm writing the report.", "Sto scrivendo il rapporto."), { object: "a2-value-obj-repooto", speakerRole: "a2-role-learner" }),
    line("work-study-messages-3-m2", "a2-family-ongoing-teiru", "a2-value-teiru-hataraku", WORK_STUDY, L("Sora is working.", "Sora sta lavorando."), { subjectReferent: "a2-referent-sora", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
    line("work-study-messages-3-m3", "a2-family-ongoing-teiru", "a2-value-teiru-yomu", WORK_STUDY, L("I'm reading the documents.", "Sto leggendo i documenti."), { object: "a2-value-obj-shorui", speakerRole: "a2-role-learner" }),
    line("work-study-messages-3-m4", "a2-family-ongoing-teiru", "a2-value-teiru-taberu", WORKPLACE, L("Emi is eating bread.", "Emi sta mangiando il pane."), { object: "a2-value-obj-pan", subjectReferent: "a2-referent-emi", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-3-m5", "a2-family-ongoing-teiru", "a2-value-teiru-kaku", WORK_STUDY, L("The colleague is writing a report.", "Il collega sta scrivendo un rapporto."), { object: "a2-value-obj-repooto", subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
    line("work-study-messages-3-m6", "a2-family-ongoing-teiru", "a2-value-teiru-hanasu", WORKPLACE, L("The teacher is speaking Japanese.", "L'insegnante sta parlando giapponese."), { object: "a2-value-obj-nihongo-m5", subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-3-m7", "a2-family-ongoing-teiru", "a2-value-teiru-matsu", WORK_STUDY, L("I'm waiting for a reply.", "Sto aspettando una risposta."), { object: "a2-value-obj-henji", speakerRole: "a2-role-learner" }),
    line("work-study-messages-3-m8", "a2-family-ongoing-teiru", "a2-value-teiru-kaku", WORKPLACE, L("The friend is writing the documents.", "L'amico sta scrivendo i documenti."), { object: "a2-value-obj-shorui", subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
  ],
  // Every transfer recombines an already-modeled ~teiru predicate with an
  // object/subject pairing not used in this lesson's own models, so all 5
  // transfers stay visibly novel.
  transfers: [
    line("work-study-messages-3-t1", "a2-family-ongoing-teiru", "a2-value-teiru-kaku", WORK_STUDY, L("Sora is writing a reply.", "Sora sta scrivendo una risposta."), { object: "a2-value-obj-henji", subjectReferent: "a2-referent-sora", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
    line("work-study-messages-3-t2", "a2-family-ongoing-teiru", "a2-value-teiru-yomu", WORKPLACE, L("Emi is reading the report.", "Emi sta leggendo il rapporto."), { object: "a2-value-obj-repooto", subjectReferent: "a2-referent-emi", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-3-t3", "a2-family-ongoing-teiru", "a2-value-teiru-hataraku", WORK_STUDY, L("The friend is working.", "L'amico sta lavorando."), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
    line("work-study-messages-3-t4", "a2-family-ongoing-teiru", "a2-value-teiru-taberu", WORK_STUDY, L("The colleague is eating bread.", "Il collega sta mangiando il pane."), { object: "a2-value-obj-pan", subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-learner" }),
    line("work-study-messages-3-t5", "a2-family-ongoing-teiru", "a2-value-teiru-matsu", WORKPLACE, L("The teacher is waiting for the documents.", "L'insegnante sta aspettando i documenti."), { object: "a2-value-obj-shorui", subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-friend" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson work-study-messages-4 — Reply and confirm (wsm4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "work-study-messages-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-reply-confirm",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-reply-confirm"],
  introducedSenseIds: [],
  models: [
    line("work-study-messages-4-m1", "a2-family-reply-confirm", "a2-value-reply-wakarimashita", WORK_STUDY, L("Understood.", "Capito."), { speakerRole: "a2-role-learner" , form: PAST_AFFIRMATIVE }),
    line("work-study-messages-4-m2", "a2-family-reply-confirm", "a2-value-reply-daijoubudesu", WORK_STUDY, L("That's fine.", "Va bene."), { speakerRole: "a2-role-colleague" }),
    line("work-study-messages-4-m3", "a2-family-reply-confirm", "a2-value-reply-arigatougozaimasu", WORKPLACE, L("Thank you.", "Grazie."), { speakerRole: "a2-role-teacher" }),
    line("work-study-messages-4-m4", "a2-family-reply-confirm", "a2-value-reply-shouchishimashita", WORK_STUDY, L("Understood, will do.", "Capito, me ne occupo."), { speakerRole: "a2-role-learner" , form: PAST_AFFIRMATIVE }),
    line("work-study-messages-4-m5", "a2-family-reply-confirm", "a2-value-reply-wakarimashita", WORK_STUDY, L("Sora, understood.", "Sora, capito."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-learner" , form: PAST_AFFIRMATIVE }),
    line("work-study-messages-4-m6", "a2-family-reply-confirm", "a2-value-reply-arigatougozaimasu", WORKPLACE, L("Emi, thank you.", "Emi, grazie."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-learner" }),
    line("work-study-messages-4-m7", "a2-family-reply-confirm", "a2-value-reply-wakarimashita", WORK_STUDY, L("The teacher understood.", "L'insegnante ha capito."), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit", speakerRole: "a2-role-colleague" , form: PAST_AFFIRMATIVE }),
    line("work-study-messages-4-m8", "a2-family-reply-confirm", "a2-value-reply-daijoubudesu", WORKPLACE, L("That's fine for the colleague.", "Va bene per il collega."), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-teacher" }),
  ],
  // Every transfer recombines an already-modeled reply with a
  // vocative/explicit subject not used above, so all 5 transfers stay
  // visibly novel.
  transfers: [
    line("work-study-messages-4-t1", "a2-family-reply-confirm", "a2-value-reply-daijoubudesu", WORK_STUDY, L("Sora, that's fine.", "Sora, va bene."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-4-t2", "a2-family-reply-confirm", "a2-value-reply-wakarimashita", WORKPLACE, L("Emi, understood.", "Emi, capito."), { subjectReferent: "a2-referent-emi", subjectRealization: "vocative", speakerRole: "a2-role-teacher" , form: PAST_AFFIRMATIVE }),
    line("work-study-messages-4-t3", "a2-family-reply-confirm", "a2-value-reply-arigatougozaimasu", WORK_STUDY, L("The friend says thank you.", "L'amico dice grazie."), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit", speakerRole: "a2-role-colleague" }),
    line("work-study-messages-4-t4", "a2-family-reply-confirm", "a2-value-reply-shouchishimashita", WORK_STUDY, L("Sora, understood, will do.", "Sora, capito, me ne occupo."), { subjectReferent: "a2-referent-sora", subjectRealization: "vocative", speakerRole: "a2-role-teacher" , form: PAST_AFFIRMATIVE }),
    line("work-study-messages-4-t5", "a2-family-reply-confirm", "a2-value-reply-wakarimashita", WORKPLACE, L("The colleague understood.", "Il collega ha capito."), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", speakerRole: "a2-role-learner" , form: PAST_AFFIRMATIVE }),
  ],
});

export const module11Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module11Recipe = A2_MODULE_MANIFEST[MODULE_ID];
