/**
 * A2 Module 5 — Sequencing & ongoing actions (Phase 3 Task 5).
 *
 * Four instructional lessons: sequence-te (te-form action sequencing) intro,
 * describe-now (sequence-te controlled practice, no premature teiru
 * intro), describe-ongoing (teiru ongoing-action intro), and
 * morning-routine (sequence-te true transfer + teiru controlled
 * practice, a morning/daily-routine synthesis). Every sentence carries a
 * semantic-ID-only variant; all Japanese/romaji lives in the shared A2
 * semantic-value catalog (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  A2_AFFIRMATIVE_PAST_POLITE,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";
import type { FormSelection } from "../../foundations/types";

const MODULE_ID = "sequencing-ongoing";

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

/** A bare (no-object) invariant utterance — subject optional, predicate is
 * the whole baked content (a2-family-te-sequence). `form` is an optional
 * honest-FormSelection override (Phase 3 Task 5 spec-fix: a te-sequence
 * value whose own final clause bakes tsukaremashita — a genuine past — must
 * say so; the builder's own default is otherwise present/affirmative). */
function bareLine(
  id: string,
  family: string,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  speakerRole?: string,
  subjectReferent: string | null = null,
  form?: FormSelection,
): A2LineSpec {
  return {
    id,
    family,
    context,
    subjectReferent,
    subjectRealization: subjectReferent === null ? "omitted" : "explicit",
    slots: subjectReferent === null ? { predicate } : { subject: subjectReferentValueId(subjectReferent), predicate },
    translation,
    speakerRole,
    form,
  };
}

/** An object-compositional line (a2-family-te-sequence-object /
 * a2-family-ongoing-teiru) — subject optional, object optional (an
 * intransitive predicate omits it), predicate carries the suffixed verb. */
function objectLine(
  id: string,
  family: string,
  predicate: string,
  object: string | null,
  context: string,
  translation: { en: string; it: string },
  speakerRole?: string,
  subjectReferent: string | null = null,
): A2LineSpec {
  const slots: Record<string, string> = { predicate };
  if (subjectReferent !== null) {
    slots.subject = subjectReferentValueId(subjectReferent);
  }
  if (object !== null) {
    slots.object = object;
  }
  return {
    id,
    family,
    context,
    subjectReferent,
    subjectRealization: subjectReferent === null ? "omitted" : "explicit",
    slots,
    translation,
    speakerRole,
  };
}

// ---------------------------------------------------------------------------
// Lesson sequencing-ongoing-1 — Sequence te-form intro (so1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "sequencing-ongoing-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-sequence-te",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-sequence-te"],
  introducedSenseIds: [],
  models: [
    bareLine("sequencing-ongoing-1-m1", "a2-family-te-sequence", "a2-value-seq-okite-arau", "a2-context-routines", L("I get up, then wash my face.", "Mi alzo, poi mi lavo la faccia."), undefined, "a2-referent-self"),
    bareLine("sequencing-ongoing-1-m2", "a2-family-te-sequence", "a2-value-seq-tsukutte-taberu", "a2-context-routines", L("Emi makes breakfast, then eats it.", "Emi prepara la colazione, poi la mangia."), undefined, "a2-referent-emi"),
    bareLine("sequencing-ongoing-1-m3", "a2-family-te-sequence", "a2-value-seq-owatte-kaeru", "a2-context-workplace", L("A colleague's work finishes, then they go home.", "Il lavoro di un collega finisce, poi torna a casa."), undefined, "a2-referent-colleague"),
    bareLine("sequencing-ongoing-1-m4", "a2-family-te-sequence", "a2-value-seq-hajimatte-tsukau", "a2-context-routines", L("Sora's class starts, then he uses a notebook.", "La lezione di Sora inizia, poi usa un quaderno."), undefined, "a2-referent-sora"),
    bareLine("sequencing-ongoing-1-m5", "a2-family-te-sequence", "a2-value-seq-itte-hanasu", "a2-context-conversation", L("The teacher goes to school, then talks with a friend.", "L'insegnante va a scuola, poi parla con un amico."), undefined, "a2-referent-teacher"),
    bareLine("sequencing-ongoing-1-m6", "a2-family-te-sequence", "a2-value-seq-hataraite-tsukareta", "a2-context-workplace", L("A friend worked, then got tired.", "Un amico ha lavorato, poi si è stancato."), undefined, "a2-referent-friend", A2_AFFIRMATIVE_PAST_POLITE),
    bareLine("sequencing-ongoing-1-m7", "a2-family-te-sequence", "a2-value-seq-aratte-neru", "a2-context-routines", L("I wash my face, then go to sleep.", "Mi lavo la faccia, poi vado a dormire."), "a2-role-learner"),
    bareLine("sequencing-ongoing-1-m8", "a2-family-te-sequence", "a2-value-seq-tsukatte-kaku", "a2-context-routines", L("I use the computer, then write an email.", "Uso il computer, poi scrivo un'email."), "a2-role-emi"),
  ],
  // Phase 3 Task 5 fix ("introduction before use"): every transfer here
  // recombines an already-modeled predicate value (m1-m5, above) with a
  // *different* already-modeled explicit-subject referent than that same
  // model used — genuine compositional novelty (a2-family-te-sequence's
  // predicate is a whole-clause bake with no object/location slot, but its
  // subject slot IS a real, separately-tracked compositional dimension) —
  // rather than inventing brand-new, never-modeled dedicated values that a
  // transfer-only cumulative-availability check could never honestly pass.
  transfers: [
    bareLine("sequencing-ongoing-1-t1", "a2-family-te-sequence", "a2-value-seq-okite-arau", "a2-context-routines", L("Sora gets up, then washes his face.", "Sora si alza, poi si lava la faccia."), undefined, "a2-referent-sora"),
    bareLine("sequencing-ongoing-1-t2", "a2-family-te-sequence", "a2-value-seq-tsukutte-taberu", "a2-context-among-friends", L("A colleague makes breakfast, then eats it.", "Un collega prepara la colazione, poi la mangia."), undefined, "a2-referent-colleague"),
    bareLine("sequencing-ongoing-1-t3", "a2-family-te-sequence", "a2-value-seq-owatte-kaeru", "a2-context-conversation", L("The teacher's work finishes, then goes home.", "Il lavoro dell'insegnante finisce, poi torna a casa."), undefined, "a2-referent-teacher"),
    bareLine("sequencing-ongoing-1-t4", "a2-family-te-sequence", "a2-value-seq-hajimatte-tsukau", "a2-context-routines", L("Emi's class starts, then she uses a notebook.", "La lezione di Emi inizia, poi usa un quaderno."), undefined, "a2-referent-emi"),
    bareLine("sequencing-ongoing-1-t5", "a2-family-te-sequence", "a2-value-seq-itte-hanasu", "a2-context-routines", L("I go to school, then talk with a friend.", "Vado a scuola, poi parlo con un amico."), undefined, "a2-referent-self"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson sequencing-ongoing-2 — Describe now: sequence-te controlled
// practice, no premature teiru intro (so2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "sequencing-ongoing-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-describe-now",
  supportingCanDoIds: ["a2-cando-sequence-te"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    bareLine("sequencing-ongoing-2-m1", "a2-family-te-sequence", "a2-value-seq-oyoide-tsukareta", "a2-context-routines", L("I swam, then I got tired.", "Ho nuotato, poi mi sono stancato/a."), "a2-role-friend", null, A2_AFFIRMATIVE_PAST_POLITE),
    bareLine("sequencing-ongoing-2-m2", "a2-family-te-sequence", "a2-value-seq-asonde-kaeru", "a2-context-among-friends", L("I play with a friend, then go home.", "Gioco con un amico, poi torno a casa."), "a2-role-sora"),
    bareLine("sequencing-ongoing-2-m3", "a2-family-te-sequence", "a2-value-seq-matte-hanasu", "a2-context-conversation", L("I wait for a friend, then talk.", "Aspetto un amico, poi parlo."), "a2-role-emi"),
    objectLine("sequencing-ongoing-2-m4", "a2-family-te-sequence-object", "a2-value-seq-obj-tabete-nomu", "a2-value-obj-pan", "a2-context-routines", L("I eat bread, then drink.", "Mangio il pane, poi bevo."), "a2-role-learner"),
    objectLine("sequencing-ongoing-2-m5", "a2-family-te-sequence-object", "a2-value-seq-obj-yonde-neru", "a2-value-obj-hon-m5", "a2-context-routines", L("I read a book, then sleep.", "Leggo un libro, poi dormo."), "a2-role-colleague"),
    objectLine("sequencing-ongoing-2-m6", "a2-family-te-sequence-object", "a2-value-seq-obj-yonde-neru", "a2-value-obj-tegami", "a2-context-conversation", L("I read a letter, then sleep.", "Leggo una lettera, poi dormo."), "a2-role-teacher"),
    objectLine("sequencing-ongoing-2-m7", "a2-family-te-sequence-object", "a2-value-seq-obj-tsukutte-taberu", "a2-value-obj-pan", "a2-context-routines", L("I make bread, then eat it.", "Preparo il pane, poi lo mangio."), "a2-role-friend"),
    objectLine("sequencing-ongoing-2-m8", "a2-family-te-sequence-object", "a2-value-seq-obj-tabete-nomu", "a2-value-obj-pan", "a2-context-routines", L("Sora eats bread, then drinks.", "Sora mangia il pane, poi beve."), undefined, "a2-referent-sora"),
  ],
  transfers: [
    objectLine("sequencing-ongoing-2-t1", "a2-family-te-sequence-object", "a2-value-seq-obj-yonde-neru", "a2-value-obj-hon-m5", "a2-context-among-friends", L("Emi reads a book, then sleeps.", "Emi legge un libro, poi dorme."), undefined, "a2-referent-emi"),
    objectLine("sequencing-ongoing-2-t2", "a2-family-te-sequence-object", "a2-value-seq-obj-tsukutte-taberu", "a2-value-obj-pan", "a2-context-routines", L("A colleague makes bread, then eats it.", "Un collega prepara il pane, poi lo mangia."), undefined, "a2-referent-colleague"),
    objectLine("sequencing-ongoing-2-t3", "a2-family-te-sequence-object", "a2-value-seq-obj-tabete-nomu", "a2-value-obj-pan", "a2-context-conversation", L("I eat bread, then drink.", "Mangio il pane, poi bevo."), undefined, "a2-referent-self"),
    bareLine("sequencing-ongoing-2-t4", "a2-family-te-sequence", "a2-value-seq-matte-hanasu", "a2-context-routines", L("The teacher waits for a friend, then talks.", "L'insegnante aspetta un amico, poi parla."), undefined, "a2-referent-teacher"),
    bareLine("sequencing-ongoing-2-t5", "a2-family-te-sequence", "a2-value-seq-asonde-kaeru", "a2-context-among-friends", L("Emi plays with a friend, then goes home.", "Emi gioca con un amico, poi torna a casa."), undefined, "a2-referent-emi"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson sequencing-ongoing-3 — Describe ongoing action: teiru intro (so3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "sequencing-ongoing-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-describe-ongoing",
  supportingCanDoIds: ["a2-cando-ongoing-teiru"],
  introducedConceptIds: ["a2-concept-ongoing-teiru"],
  introducedSenseIds: [],
  models: [
    objectLine("sequencing-ongoing-3-m1", "a2-family-ongoing-teiru", "a2-value-teiru-taberu", "a2-value-obj-pan", "a2-context-routines", L("I am eating bread.", "Sto mangiando il pane."), "a2-role-learner"),
    objectLine("sequencing-ongoing-3-m2", "a2-family-ongoing-teiru", "a2-value-teiru-nomu", "a2-value-obj-mizu", "a2-context-routines", L("Emi is drinking water.", "Emi sta bevendo acqua."), "a2-role-emi"),
    objectLine("sequencing-ongoing-3-m3", "a2-family-ongoing-teiru", "a2-value-teiru-yomu", "a2-value-obj-hon-m5", "a2-context-conversation", L("Sora is reading a book.", "Sora sta leggendo un libro."), "a2-role-sora"),
    objectLine("sequencing-ongoing-3-m4", "a2-family-ongoing-teiru", "a2-value-teiru-kaku", "a2-value-obj-tegami", "a2-context-routines", L("A friend is writing a letter.", "Un amico sta scrivendo una lettera."), "a2-role-friend"),
    objectLine("sequencing-ongoing-3-m5", "a2-family-ongoing-teiru", "a2-value-teiru-hanasu", "a2-value-obj-nihongo-m5", "a2-context-workplace", L("A colleague is speaking Japanese.", "Un collega sta parlando giapponese."), "a2-role-colleague"),
    objectLine("sequencing-ongoing-3-m6", "a2-family-ongoing-teiru", "a2-value-teiru-asobu", null, "a2-context-among-friends", L("The teacher is playing.", "L'insegnante sta giocando."), "a2-role-teacher"),
    objectLine("sequencing-ongoing-3-m7", "a2-family-ongoing-teiru", "a2-value-teiru-hataraku", null, "a2-context-workplace", L("I am working.", "Sto lavorando."), "a2-role-learner"),
    objectLine("sequencing-ongoing-3-m8", "a2-family-ongoing-teiru", "a2-value-teiru-matsu", "a2-value-obj-basu", "a2-context-routines", L("Emi is waiting for a bus.", "Emi sta aspettando un autobus."), "a2-role-emi"),
  ],
  transfers: [
    objectLine("sequencing-ongoing-3-t1", "a2-family-ongoing-teiru", "a2-value-teiru-taberu", "a2-value-obj-pan", "a2-context-conversation", L("Sora is eating bread.", "Sora sta mangiando il pane."), undefined, "a2-referent-sora"),
    objectLine("sequencing-ongoing-3-t2", "a2-family-ongoing-teiru", "a2-value-teiru-nomu", "a2-value-obj-mizu", "a2-context-routines", L("A friend is drinking water.", "Un amico sta bevendo acqua."), undefined, "a2-referent-friend"),
    objectLine("sequencing-ongoing-3-t3", "a2-family-ongoing-teiru", "a2-value-teiru-yomu", "a2-value-obj-hon-m5", "a2-context-among-friends", L("A colleague is reading a book.", "Un collega sta leggendo un libro."), undefined, "a2-referent-colleague"),
    objectLine("sequencing-ongoing-3-t4", "a2-family-ongoing-teiru", "a2-value-teiru-hanasu", "a2-value-obj-nihongo-m5", "a2-context-conversation", L("Emi is speaking Japanese.", "Emi sta parlando giapponese."), undefined, "a2-referent-emi"),
    objectLine("sequencing-ongoing-3-t5", "a2-family-ongoing-teiru", "a2-value-teiru-hataraku", null, "a2-context-workplace", L("The teacher is working.", "L'insegnante sta lavorando."), undefined, "a2-referent-teacher"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson sequencing-ongoing-4 — Describe routine: sequence-te transfer +
// teiru controlled practice (so4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "sequencing-ongoing-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-morning-routine",
  supportingCanDoIds: ["a2-cando-sequence-te", "a2-cando-ongoing-teiru"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    bareLine("sequencing-ongoing-4-m1", "a2-family-te-sequence", "a2-value-seq-oyoide-tsukareta", "a2-context-routines", L("Sora swam, then got tired.", "Sora ha nuotato, poi si è stancato."), undefined, "a2-referent-sora", A2_AFFIRMATIVE_PAST_POLITE),
    bareLine("sequencing-ongoing-4-m2", "a2-family-te-sequence", "a2-value-seq-asonde-kaeru", "a2-context-among-friends", L("A friend plays with a friend, then goes home.", "Un amico gioca con un amico, poi torna a casa."), "a2-role-friend"),
    bareLine("sequencing-ongoing-4-m3", "a2-family-te-sequence", "a2-value-seq-matte-hanasu", "a2-context-conversation", L("I wait for a friend, then talk.", "Aspetto un amico, poi parlo."), "a2-role-emi"),
    objectLine("sequencing-ongoing-4-m4", "a2-family-te-sequence-object", "a2-value-seq-obj-tabete-nomu", "a2-value-obj-pan", "a2-context-routines", L("A colleague eats bread, then drinks.", "Un collega mangia il pane, poi beve."), undefined, "a2-referent-colleague"),
    objectLine("sequencing-ongoing-4-m5", "a2-family-ongoing-teiru", "a2-value-teiru-yomu", "a2-value-obj-tegami", "a2-context-routines", L("The teacher is reading a letter.", "L'insegnante sta leggendo una lettera."), "a2-role-teacher"),
    objectLine("sequencing-ongoing-4-m6", "a2-family-ongoing-teiru", "a2-value-teiru-kaku", "a2-value-obj-nihongo-m5", "a2-context-routines", L("I am writing in Japanese.", "Sto scrivendo in giapponese."), "a2-role-learner"),
    objectLine("sequencing-ongoing-4-m7", "a2-family-ongoing-teiru", "a2-value-teiru-hataraku", null, "a2-context-workplace", L("Sora is working.", "Sora sta lavorando."), undefined, "a2-referent-sora"),
    objectLine("sequencing-ongoing-4-m8", "a2-family-te-sequence-object", "a2-value-seq-obj-yonde-neru", "a2-value-obj-tegami", "a2-context-among-friends", L("A friend reads a letter, then sleeps.", "Un amico legge una lettera, poi dorme."), undefined, "a2-referent-friend"),
  ],
  transfers: [
    objectLine("sequencing-ongoing-4-t1", "a2-family-te-sequence-object", "a2-value-seq-obj-tsukutte-taberu", "a2-value-obj-pan", "a2-context-routines", L("The teacher makes bread, then eats it.", "L'insegnante prepara il pane, poi lo mangia."), undefined, "a2-referent-teacher"),
    objectLine("sequencing-ongoing-4-t2", "a2-family-ongoing-teiru", "a2-value-teiru-nomu", "a2-value-obj-mizu", "a2-context-conversation", L("A colleague is drinking water.", "Un collega sta bevendo acqua."), undefined, "a2-referent-colleague"),
    objectLine("sequencing-ongoing-4-t3", "a2-family-ongoing-teiru", "a2-value-teiru-asobu", null, "a2-context-among-friends", L("Sora is playing.", "Sora sta giocando."), undefined, "a2-referent-sora"),
    bareLine("sequencing-ongoing-4-t4", "a2-family-te-sequence", "a2-value-seq-matte-hanasu", "a2-context-routines", L("A colleague waits for a friend, then talks.", "Un collega aspetta un amico, poi parla."), undefined, "a2-referent-colleague"),
    objectLine("sequencing-ongoing-4-t5", "a2-family-ongoing-teiru", "a2-value-teiru-hanasu", "a2-value-obj-nihongo-m5", "a2-context-workplace", L("A friend is speaking Japanese.", "Un amico sta parlando giapponese."), undefined, "a2-referent-friend"),
  ],
});

export const module5Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module5Recipe = A2_MODULE_MANIFEST[MODULE_ID];
