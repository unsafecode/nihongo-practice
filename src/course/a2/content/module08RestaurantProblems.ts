/**
 * A2 Module 8 — Restaurant problems (Phase 3 Task 5).
 *
 * Four instructional lessons: rp1 confirm-understanding/order-food (menu
 * ordering; NO comparison grammar — that construction is not introduced
 * until shopping-returns-1, the corrected authoritative spiral), rp2
 * ask-for-help/special-request (request-tekudasai + permission-temoii
 * post-intro practice/recurrence, recombined with new restaurant objects),
 * rp3 recount-experience/report-problem (plain description/reason
 * content, no unintroduced comparison), rp4 negotiate-price/pay and handle
 * a problem (sequence-te recurrence throughout). Every sentence carries a
 * semantic-ID-only variant; all Japanese/romaji lives in the shared A2
 * semantic-value catalog (`a2SemanticCatalog.ts`) in hiragana/katakana
 * only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  A2_AFFIRMATIVE_PAST_POLITE,
  A2_NEGATIVE_PRESENT_POLITE,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";
import type { FormSelection } from "../../foundations/types";

const MODULE_ID = "restaurant-problems";

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
  /** "vocative" (natural direct address: referent + san + comma) — never
   * "explicit" (Xha-marked) for a named individual. Available even for the
   * whole-clause-bake families (confirm-understanding/recount-experience/
   * te-sequence) since vocative-address assembly is a universal, family-
   * independent realizer mechanism (never gated by a family's own
   * contentSlots). */
  readonly subjectReferent?: string | null;
  readonly subjectRealization?: "omitted" | "explicit" | "vocative";
  readonly interrogative?: boolean;
  /** Discourse-only speaker attribution (who is saying this) — never
   * rendered in the Japanese itself. Needed for role diversity on the
   * whole-clause-bake families, whose predicate content has no visible
   * subject at all. */
  readonly speakerRole?: string;
  /** Honest-FormSelection override for a whole-clause-bake predicate whose
   * own final clause is genuinely past and/or negative (the builder's own
   * default is present/affirmative/polite). */
  readonly form?: FormSelection;
}

/** One M8 line: subject optional (vocative direct address only), object
 * optional (a2-family-*-object families only), predicate carries the
 * whole-clause bake or suffixed verb. */
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

// ---------------------------------------------------------------------------
// Lesson restaurant-problems-1 — Confirm understanding / order food (rp1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "restaurant-problems-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-confirm-understanding",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-confirm-understanding"],
  introducedSenseIds: [],
  models: [
    line("restaurant-problems-1-m1", "a2-family-confirm-understanding", "a2-value-order-menu", "a2-context-restaurant", L("Excuse me, may I have the menu?", "Scusi, posso avere il menù?"), { speakerRole: "a2-role-learner" }),
    line("restaurant-problems-1-m2", "a2-family-confirm-understanding", "a2-value-order-osusume", "a2-context-restaurant", L("What do you recommend?", "Cosa consiglia?"), { speakerRole: "a2-role-learner" }),
    line("restaurant-problems-1-m3", "a2-family-confirm-understanding", "a2-value-order-onegai", "a2-context-cafe", L("Ramen, please.", "Ramen, per favore."), { speakerRole: "a2-role-friend" }),
    line("restaurant-problems-1-m4", "a2-family-confirm-understanding", "a2-value-order-sorede-ii", "a2-context-restaurant", L("Yes, that's fine.", "Sì, va bene così."), { speakerRole: "a2-role-colleague" }),
    line("restaurant-problems-1-m5", "a2-family-confirm-understanding", "a2-value-order-nani-ga-aru", "a2-context-restaurant", L("What drinks do you have?", "Che bevande avete?"), { speakerRole: "a2-role-learner" }),
    line("restaurant-problems-1-m6", "a2-family-confirm-understanding", "a2-value-order-kore-kudasai", "a2-context-cafe", L("This one, please.", "Questo, per favore."), { speakerRole: "a2-role-teacher" }),
    line("restaurant-problems-1-m7", "a2-family-confirm-understanding", "a2-value-order-nomimono", "a2-context-restaurant", L("Tea, please.", "Tè, per favore."), { speakerRole: "a2-role-sora" }),
    line("restaurant-problems-1-m8", "a2-family-confirm-understanding", "a2-value-order-issho-ni", "a2-context-restaurant", L("Rice too, together, please.", "Anche il riso, insieme, per favore."), { speakerRole: "a2-role-emi" }),
  ],
  // Phase 3 Task 5 fix ("introduction before use"): every transfer here
  // recombines an already-modeled predicate value (m1-m8, above — this
  // family's predicate is a whole-clause bake with no object/location slot,
  // but its subject slot IS a real, separately-tracked compositional
  // dimension) with a subject referent that was already introduced back at
  // sequencing-ongoing-1 (self/emi/colleague/sora/teacher/friend all appear
  // there as explicit subjects, cumulative-available ever since) — genuine
  // recombination, never a brand-new never-modeled dedicated value.
  transfers: [
    line("restaurant-problems-1-t1", "a2-family-confirm-understanding", "a2-value-order-kore-kudasai", "a2-context-restaurant", L("Sora, this one please.", "Sora, questo per favore."), { subjectReferent: "a2-referent-sora" }),
    line("restaurant-problems-1-t2", "a2-family-confirm-understanding", "a2-value-order-nomimono", "a2-context-cafe", L("Emi, tea please.", "Emi, tè per favore."), { subjectReferent: "a2-referent-emi" }),
    line("restaurant-problems-1-t3", "a2-family-confirm-understanding", "a2-value-order-sorede-ii", "a2-context-restaurant", L("A colleague says that's fine.", "Un collega dice che va bene così."), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit" }),
    line("restaurant-problems-1-t4", "a2-family-confirm-understanding", "a2-value-order-issho-ni", "a2-context-restaurant", L("The teacher asks for rice too, together.", "L'insegnante chiede anche il riso, insieme."), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit" }),
    line("restaurant-problems-1-t5", "a2-family-confirm-understanding", "a2-value-order-onegai", "a2-context-cafe", L("A friend asks for ramen.", "Un amico chiede il ramen."), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson restaurant-problems-2 — Ask for help / special request, with
// request-tekudasai + permission-temoii post-intro practice/recurrence
// (rp2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "restaurant-problems-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-ask-for-help",
  supportingCanDoIds: ["a2-cando-request-tekudasai", "a2-cando-permission-temoii"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    line("restaurant-problems-2-m1", "a2-family-request-tekudasai", "a2-value-tekudasai-matsu", "a2-context-restaurant", L("Please wait.", "Per favore, aspetti."), { speakerRole: "a2-role-clerk" }),
    line("restaurant-problems-2-m2", "a2-family-request-tekudasai", "a2-value-tekudasai-suwaru", "a2-context-restaurant", L("Please sit down.", "Per favore, si sieda."), { speakerRole: "a2-role-clerk" }),
    line("restaurant-problems-2-m3", "a2-family-request-tekudasai", "a2-value-tekudasai-kaku", "a2-context-restaurant", L("Please write your name.", "Per favore, scriva il suo nome."), { object: "a2-value-obj-namae", speakerRole: "a2-role-clerk" }),
    line("restaurant-problems-2-m4", "a2-family-request-tekudasai", "a2-value-tekudasai-taberu", "a2-context-restaurant", L("Please try the meat.", "Per favore, provi la carne."), { object: "a2-value-obj-niku", speakerRole: "a2-role-teacher" }),
    line("restaurant-problems-2-m5", "a2-family-request-tekudasai", "a2-value-tekudasai-hanasu", "a2-context-cafe", L("Please speak in English.", "Per favore, parli in inglese."), { object: "a2-value-obj-eigo", speakerRole: "a2-role-colleague" }),
    line("restaurant-problems-2-m6", "a2-family-permission-temoii", "a2-value-temoii-taberu", "a2-context-restaurant", L("May I order the ramen?", "Posso ordinare il ramen?"), { object: "a2-value-obj-raamen", interrogative: true, speakerRole: "a2-role-learner" }),
    line("restaurant-problems-2-m7", "a2-family-permission-temoii", "a2-value-temoii-nomu", "a2-context-restaurant", L("May I have the tea?", "Posso avere il tè?"), { object: "a2-value-obj-ocha-m8", interrogative: true, speakerRole: "a2-role-learner" }),
    line("restaurant-problems-2-m8", "a2-family-permission-temoii", "a2-value-temoii-yomu", "a2-context-cafe", L("Sora, may I read the menu?", "Sora, posso leggere il menù?"), { object: "a2-value-obj-menyuu", interrogative: true, subjectReferent: "a2-referent-sora" }),
  ],
  transfers: [
    line("restaurant-problems-2-t1", "a2-family-request-tekudasai", "a2-value-tekudasai-tatsu", "a2-context-restaurant", L("Please stand up.", "Per favore, si alzi."), { speakerRole: "a2-role-friend" }),
    line("restaurant-problems-2-t2", "a2-family-request-tekudasai", "a2-value-tekudasai-taberu", "a2-context-restaurant", L("Please try the ramen.", "Per favore, provi il ramen."), { object: "a2-value-obj-raamen", speakerRole: "a2-role-colleague" }),
    line("restaurant-problems-2-t3", "a2-family-request-tekudasai", "a2-value-tekudasai-kesu", "a2-context-restaurant", L("Please turn off the lights.", "Per favore, spenga le luci."), { object: "a2-value-obj-denki", speakerRole: "a2-role-teacher" }),
    line("restaurant-problems-2-t4", "a2-family-permission-temoii", "a2-value-temoii-kaku", "a2-context-restaurant", L("May I write my name?", "Posso scrivere il mio nome?"), { object: "a2-value-obj-namae", interrogative: true, speakerRole: "a2-role-learner" }),
    line("restaurant-problems-2-t5", "a2-family-permission-temoii", "a2-value-temoii-hanasu", "a2-context-cafe", L("Emi, may I speak in English?", "Emi, posso parlare in inglese?"), { object: "a2-value-obj-eigo", interrogative: true, subjectReferent: "a2-referent-emi" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson restaurant-problems-3 — Recount experience / report a problem
// (rp3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "restaurant-problems-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-recount-experience",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-recount-experience"],
  introducedSenseIds: [],
  models: [
    line("restaurant-problems-3-m1", "a2-family-recount-experience", "a2-value-problem-konai", "a2-context-restaurant", L("I ordered ramen, but it still hasn't come.", "Ho ordinato il ramen, ma non è ancora arrivato."), { speakerRole: "a2-role-learner", form: A2_NEGATIVE_PRESENT_POLITE }),
    line("restaurant-problems-3-m2", "a2-family-recount-experience", "a2-value-problem-chigau", "a2-context-restaurant", L("This is different from my order.", "Questo è diverso dal mio ordine."), { speakerRole: "a2-role-learner" }),
    line("restaurant-problems-3-m3", "a2-family-recount-experience", "a2-value-problem-tsumetai", "a2-context-restaurant", L("The soup is cold.", "La zuppa è fredda."), { speakerRole: "a2-role-colleague" }),
    line("restaurant-problems-3-m4", "a2-family-recount-experience", "a2-value-problem-atsui", "a2-context-cafe", L("The tea is too hot.", "Il tè è troppo caldo."), { speakerRole: "a2-role-friend" }),
    line("restaurant-problems-3-m5", "a2-family-recount-experience", "a2-value-problem-tarinai", "a2-context-restaurant", L("There aren't enough forks.", "Non ci sono abbastanza forchette."), { speakerRole: "a2-role-learner", form: A2_NEGATIVE_PRESENT_POLITE }),
    line("restaurant-problems-3-m6", "a2-family-recount-experience", "a2-value-problem-machigai", "a2-context-restaurant", L("I ordered meat, but fish came.", "Ho ordinato carne, ma è arrivato pesce."), { speakerRole: "a2-role-sora", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("restaurant-problems-3-m7", "a2-family-recount-experience", "a2-value-problem-nioi", "a2-context-restaurant", L("This fish smells a bit strange.", "Questo pesce ha un odore un po' strano."), { speakerRole: "a2-role-teacher" }),
    line("restaurant-problems-3-m8", "a2-family-recount-experience", "a2-value-problem-daremo-konai", "a2-context-restaurant", L("I waited ten minutes, but no one is coming.", "Ho aspettato dieci minuti, ma non viene nessuno."), { speakerRole: "a2-role-emi", form: A2_NEGATIVE_PRESENT_POLITE }),
  ],
  // Phase 3 Task 5 fix ("introduction before use"): every transfer here
  // recombines an already-modeled predicate value (m1-m8, above) with a
  // subject referent already introduced back at sequencing-ongoing-1 —
  // vocative for sora/emi (natural: telling a companion about your own
  // dining problem), explicit third-party for colleague/teacher/friend
  // (reporting what they experienced) — never a brand-new never-modeled
  // dedicated value. Deliberately reuses only predicates with no baked
  // first-person pronoun (problem-chigau's own "watashi no" would conflict
  // with any other explicit subject, so it is never recombined this way).
  transfers: [
    line("restaurant-problems-3-t1", "a2-family-recount-experience", "a2-value-problem-konai", "a2-context-restaurant", L("Sora, I ordered ramen, but it still hasn't come.", "Sora, ho ordinato il ramen, ma non è ancora arrivato."), { subjectReferent: "a2-referent-sora", form: A2_NEGATIVE_PRESENT_POLITE }),
    line("restaurant-problems-3-t2", "a2-family-recount-experience", "a2-value-problem-tsumetai", "a2-context-cafe", L("Emi, the soup is cold.", "Emi, la zuppa è fredda."), { subjectReferent: "a2-referent-emi" }),
    line("restaurant-problems-3-t3", "a2-family-recount-experience", "a2-value-problem-tarinai", "a2-context-among-friends", L("A colleague says there aren't enough forks.", "Un collega dice che non ci sono abbastanza forchette."), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", form: A2_NEGATIVE_PRESENT_POLITE }),
    line("restaurant-problems-3-t4", "a2-family-recount-experience", "a2-value-problem-nioi", "a2-context-restaurant", L("The teacher says this fish smells a bit strange.", "L'insegnante dice che questo pesce ha un odore un po' strano."), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit" }),
    line("restaurant-problems-3-t5", "a2-family-recount-experience", "a2-value-problem-daremo-konai", "a2-context-restaurant", L("A friend waited ten minutes, but no one came.", "Un amico ha aspettato dieci minuti, ma non è venuto nessuno."), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit", form: A2_NEGATIVE_PRESENT_POLITE }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson restaurant-problems-4 — Negotiate price / pay and handle a
// problem, with sequence-te recurrence throughout (rp4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "restaurant-problems-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-negotiate-price",
  supportingCanDoIds: ["a2-cando-sequence-te"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    line("restaurant-problems-4-m1", "a2-family-te-sequence", "a2-value-seq-onegaishite-harau", "a2-context-restaurant", L("Asking for the check, I paid the money.", "Chiedendo il conto, ho pagato i soldi."), { speakerRole: "a2-role-learner", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("restaurant-problems-4-m2", "a2-family-te-sequence", "a2-value-seq-tanonde-matsu", "a2-context-restaurant", L("Asking for the check, I wait.", "Chiedendo il conto, aspetto."), { speakerRole: "a2-role-learner" }),
    line("restaurant-problems-4-m3", "a2-family-te-sequence", "a2-value-seq-kazoete-harau", "a2-context-restaurant", L("Counting the money, I paid.", "Contando i soldi, ho pagato."), { speakerRole: "a2-role-colleague", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("restaurant-problems-4-m4", "a2-family-te-sequence", "a2-value-seq-uketotte-kaeru", "a2-context-restaurant", L("Receiving the change, I go home.", "Ricevendo il resto, torno a casa."), { speakerRole: "a2-role-friend" }),
    line("restaurant-problems-4-m5", "a2-family-te-sequence", "a2-value-seq-tabete-harau", "a2-context-cafe", L("Eating the meal, I paid.", "Mangiando il pasto, ho pagato."), { speakerRole: "a2-role-learner", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("restaurant-problems-4-m6", "a2-family-te-sequence", "a2-value-seq-nonde-harau", "a2-context-cafe", L("Drinking the tea, I paid.", "Bevendo il tè, ho pagato."), { speakerRole: "a2-role-sora", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("restaurant-problems-4-m7", "a2-family-te-sequence", "a2-value-seq-mite-tanomu", "a2-context-restaurant", L("Looking at the menu, I ordered.", "Guardando il menù, ho ordinato."), { speakerRole: "a2-role-teacher", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("restaurant-problems-4-m8", "a2-family-te-sequence", "a2-value-seq-tabete-kaeru", "a2-context-restaurant", L("Eating the meal, I go home.", "Mangiando il pasto, torno a casa."), { speakerRole: "a2-role-emi" }),
  ],
  // Phase 3 Task 5 fix ("introduction before use"): every transfer here
  // recombines an already-modeled predicate value (m1-m5, above) with a
  // subject referent already introduced back at sequencing-ongoing-1 —
  // vocative for sora/emi, explicit third-party for colleague/teacher/
  // friend — never a brand-new never-modeled dedicated value.
  transfers: [
    line("restaurant-problems-4-t1", "a2-family-te-sequence", "a2-value-seq-onegaishite-harau", "a2-context-restaurant", L("Sora, asking for the check, I paid the money.", "Sora, chiedendo il conto, ho pagato i soldi."), { subjectReferent: "a2-referent-sora", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("restaurant-problems-4-t2", "a2-family-te-sequence", "a2-value-seq-tanonde-matsu", "a2-context-restaurant", L("Emi, asking for the check, I wait.", "Emi, chiedendo il conto, aspetto."), { subjectReferent: "a2-referent-emi" }),
    line("restaurant-problems-4-t3", "a2-family-te-sequence", "a2-value-seq-kazoete-harau", "a2-context-restaurant", L("A colleague counted the money, then paid.", "Un collega ha contato i soldi, poi ha pagato."), { subjectReferent: "a2-referent-colleague", subjectRealization: "explicit", form: A2_AFFIRMATIVE_PAST_POLITE }),
    line("restaurant-problems-4-t4", "a2-family-te-sequence", "a2-value-seq-uketotte-kaeru", "a2-context-restaurant", L("The teacher received the change, then went home.", "L'insegnante ha ricevuto il resto, poi è tornato a casa."), { subjectReferent: "a2-referent-teacher", subjectRealization: "explicit" }),
    line("restaurant-problems-4-t5", "a2-family-te-sequence", "a2-value-seq-tabete-harau", "a2-context-cafe", L("A friend ate the meal, then paid.", "Un amico ha mangiato il pasto, poi ha pagato."), { subjectReferent: "a2-referent-friend", subjectRealization: "explicit", form: A2_AFFIRMATIVE_PAST_POLITE }),
  ],
});

export const module8Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module8Recipe = A2_MODULE_MANIFEST[MODULE_ID];
