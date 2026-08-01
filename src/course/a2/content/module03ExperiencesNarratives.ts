/**
 * A2 Module 3 — Experiences & narratives (Phase 3 Task 4).
 *
 * Four instructional lessons: introducing the "ta koto ga arimasu" experience
 * construction, narrating an ordered sequence of past events (sorekara,
 * "then"), controlled experience-takoto practice mixed with plain-past-
 * adjective recognition, and asking someone else about their experience with
 * the interrogative form. Every sentence carries a semantic-ID-only variant;
 * all Japanese/romaji lives in the shared A2 semantic-value catalog
 * (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */

import { A2_MODULE_MANIFEST } from "../manifest";
import {
  A2_AFFIRMATIVE_PAST_PLAIN,
  a2SubjectReferentValueId as subjectReferentValueId,
  buildA2InstructionalLesson,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";

const MODULE_ID = "experiences-narratives";

function L(en: string, it: string) {
  return { en, it };
}

/** "ta koto ga arimasu" experience statements — optional explicit subject,
 * optional interrogative form (ask-experience, en4). */
function experienceLine(
  id: string,
  subjectReferent: string | null,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  interrogative = false,
): A2LineSpec {
  return {
    id,
    family: "a2-family-experience-takoto",
    context,
    subjectReferent,
    subjectRealization: subjectReferent === null ? "omitted" : "explicit",
    slots: subjectReferent === null ? { predicate } : { subject: subjectReferentValueId(subjectReferent), predicate },
    translation,
    interrogative,
  };
}

/** Ordered two-clause narrative (sorekara, "then") — optional explicit
 * subject prefix; the narrative content itself is fully baked into the
 * value. */
function narrateLine(
  id: string,
  subjectReferent: string | null,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
): A2LineSpec {
  return {
    id,
    family: "a2-family-narrate-order",
    context,
    subjectReferent,
    subjectRealization: subjectReferent === null ? "omitted" : "explicit",
    slots: subjectReferent === null ? { predicate } : { subject: subjectReferentValueId(subjectReferent), predicate },
    translation,
    // M4 spec-fix ("form metadata"): every narrate-order value is a genuine
    // PAST narrative (sorekara-linked past clauses), never present — honest
    // formality follows the value's own final clause: plain throughout.
    form: A2_AFFIRMATIVE_PAST_PLAIN,
  };
}

/** Bare plain-past-adjective recognition line (no polite copula) —
 * recognize-plain-forms support for en3. Every currently-authored value
 * here is a plain PAST i-/na-adjective (M4 spec-fix: honest metadata, never
 * the polite-present default). */
function plainAdjectiveLine(
  id: string,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  subjectReferent: string | null = null,
): A2LineSpec {
  return {
    id,
    family: "a2-family-plain-recognition",
    context,
    subjectReferent,
    subjectRealization: subjectReferent === null ? "omitted" : "explicit",
    slots: subjectReferent === null ? { predicate } : { subject: subjectReferentValueId(subjectReferent), predicate },
    translation,
    form: A2_AFFIRMATIVE_PAST_PLAIN,
  };
}

// ---------------------------------------------------------------------------
// Lesson experiences-narratives-1 — Experience: "ta koto ga arimasu" intro (en1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "experiences-narratives-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-experience-takoto",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-experience-takoto"],
  introducedSenseIds: [],
  models: [
    experienceLine("experiences-narratives-1-m1", null, "a2-value-exp-oyoida", "a2-context-experiences", L("I have swum in the sea before.", "Ho già nuotato nel mare.")),
    experienceLine("experiences-narratives-1-m2", "a2-referent-emi", "a2-value-exp-itta-kyouto", "a2-context-outing", L("Emi has been to Kyoto before.", "Emi è già stata a Kyoto.")),
    experienceLine("experiences-narratives-1-m3", "a2-referent-sora", "a2-value-exp-tabeta-sushi", "a2-context-cafe", L("Sora has eaten sushi before.", "Sora ha già mangiato sushi.")),
    experienceLine("experiences-narratives-1-m4", "a2-referent-friend", "a2-value-exp-matta", "a2-context-experiences", L("My friend has waited at the station before.", "Il mio amico ha già aspettato alla stazione.")),
    experienceLine("experiences-narratives-1-m5", "a2-referent-colleague", "a2-value-exp-nobotta-yama", "a2-context-workplace", L("My colleague has climbed a mountain before.", "Il mio collega ha già scalato una montagna.")),
    experienceLine("experiences-narratives-1-m6", null, "a2-value-exp-itta-tokyo", "a2-context-conversation", L("I have been to Tokyo before.", "Sono già stato/a a Tokyo.")),
    experienceLine("experiences-narratives-1-m7", "a2-referent-teacher", "a2-value-exp-oyoida", "a2-context-experiences", L("The teacher has swum in the sea before.", "L'insegnante ha già nuotato nel mare.")),
    experienceLine("experiences-narratives-1-m8", "a2-referent-emi", "a2-value-exp-tabeta-nihonshoku", "a2-context-cafe", L("Emi has eaten Japanese food before.", "Emi ha già mangiato cibo giapponese.")),
    // m9/m10: the "waited for a friend" and "climbed Mt. Fuji" facts need
    // their own distinct values (C1 spec-fix) but are each introduced for the
    // very first time in this, the introduction lesson — so (unlike Osaka/
    // natto, which the later en3/en4 lessons introduce) they must be modeled
    // here, never only transferred, to ever be legally available at all.
    experienceLine("experiences-narratives-1-m9", "a2-referent-teacher", "a2-value-exp-matta-tomodachi", "a2-context-among-friends", L("The teacher has waited for a friend before.", "L'insegnante ha già aspettato un amico.")),
    experienceLine("experiences-narratives-1-m10", "a2-referent-friend", "a2-value-exp-nobotta-fuji", "a2-context-outing", L("My friend has climbed Mt. Fuji before.", "Il mio amico ha già scalato il Monte Fuji.")),
  ],
  transfers: [
    experienceLine("experiences-narratives-1-t1", "a2-referent-sora", "a2-value-exp-nobotta-yama", "a2-context-outing", L("Sora has climbed a mountain before.", "Sora ha già scalato una montagna.")),
    experienceLine("experiences-narratives-1-t2", "a2-referent-colleague", "a2-value-exp-matta-tomodachi", "a2-context-workplace", L("My colleague has waited for a friend before.", "Il mio collega ha già aspettato un amico.")),
    // Osaka/natto are each introduced by a later lesson's own model (en3-m5,
    // en4-m3) — a transfer can never be earlier than its own introduction,
    // so this introduction lesson's transfers instead recombine its own
    // already-modeled Kyoto/Japanese-food facts with a new subject.
    experienceLine("experiences-narratives-1-t3", "a2-referent-friend", "a2-value-exp-itta-kyouto", "a2-context-experiences", L("My friend has been to Kyoto before.", "Il mio amico è già stato a Kyoto.")),
    experienceLine("experiences-narratives-1-t4", null, "a2-value-exp-tabeta-nihonshoku", "a2-context-cafe", L("I have eaten Japanese food before.", "Ho già mangiato cibo giapponese.")),
    experienceLine("experiences-narratives-1-t5", "a2-referent-teacher", "a2-value-exp-nobotta-fuji", "a2-context-experiences", L("The teacher has climbed Mt. Fuji before.", "L'insegnante ha già scalato il Monte Fuji.")),
  ],
});

// ---------------------------------------------------------------------------
// Lesson experiences-narratives-2 — Narrate order: sorekara ("then") (en2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "experiences-narratives-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-narrate-order",
  supportingCanDoIds: ["a2-cando-connectors", "a2-cando-recognize-plain-forms"],
  introducedConceptIds: ["a2-concept-narrate-order"],
  introducedSenseIds: [],
  models: [
    narrateLine("experiences-narratives-2-m1", null, "a2-value-narrate-asagohan-gakkou", "a2-context-conversation", L("I ate breakfast. Then I went to school.", "Ho mangiato la colazione. Poi sono andato/a a scuola.")),
    narrateLine("experiences-narratives-2-m2", "a2-referent-friend", "a2-value-narrate-umi-yama", "a2-context-outing", L("My friend swam in the sea. Then he/she climbed the mountain.", "Il mio amico ha nuotato nel mare. Poi ha scalato la montagna.")),
    narrateLine("experiences-narratives-2-m3", "a2-referent-emi", "a2-value-narrate-matsu-tabeta", "a2-context-among-friends", L("Emi waited for a friend. Then she ate a meal.", "Emi ha aspettato un amico. Poi ha mangiato un pasto.")),
    narrateLine("experiences-narratives-2-m4", "a2-referent-sora", "a2-value-narrate-kyouto-tanoshikatta", "a2-context-experiences", L("Sora went to Kyoto last year. It was a lot of fun.", "Sora è andato a Kyoto l'anno scorso. È stato molto divertente.")),
    narrateLine("experiences-narratives-2-m5", "a2-referent-colleague", "a2-value-narrate-asagohan-gakkou", "a2-context-workplace", L("My colleague ate breakfast. Then he/she went to school.", "Il mio collega ha mangiato la colazione. Poi è andato a scuola.")),
    narrateLine("experiences-narratives-2-m6", "a2-referent-teacher", "a2-value-narrate-umi-yama", "a2-context-outing", L("The teacher swam in the sea. Then he/she climbed the mountain.", "L'insegnante ha nuotato nel mare. Poi ha scalato la montagna.")),
    narrateLine("experiences-narratives-2-m7", "a2-referent-sora", "a2-value-narrate-matsu-tabeta", "a2-context-among-friends", L("Sora waited for a friend. Then he ate a meal.", "Sora ha aspettato un amico. Poi ha mangiato un pasto.")),
    narrateLine("experiences-narratives-2-m8", "a2-referent-friend", "a2-value-narrate-kyouto-tanoshikatta", "a2-context-experiences", L("My friend went to Kyoto last year. It was a lot of fun.", "Il mio amico è andato a Kyoto l'anno scorso. È stato molto divertente.")),
  ],
  transfers: [
    narrateLine("experiences-narratives-2-t1", "a2-referent-emi", "a2-value-narrate-asagohan-gakkou", "a2-context-conversation", L("Emi ate breakfast. Then she went to school.", "Emi ha mangiato la colazione. Poi è andata a scuola.")),
    narrateLine("experiences-narratives-2-t2", null, "a2-value-narrate-umi-yama", "a2-context-outing", L("I swam in the sea. Then I climbed the mountain.", "Ho nuotato nel mare. Poi ho scalato la montagna.")),
    narrateLine("experiences-narratives-2-t3", "a2-referent-colleague", "a2-value-narrate-matsu-tabeta", "a2-context-workplace", L("My colleague waited for a friend. Then he/she ate a meal.", "Il mio collega ha aspettato un amico. Poi ha mangiato un pasto.")),
    narrateLine("experiences-narratives-2-t4", "a2-referent-teacher", "a2-value-narrate-kyouto-tanoshikatta", "a2-context-experiences", L("The teacher went to Kyoto last year. It was a lot of fun.", "L'insegnante è andato a Kyoto l'anno scorso. È stato molto divertente.")),
    narrateLine("experiences-narratives-2-t5", "a2-referent-friend", "a2-value-narrate-asagohan-gakkou", "a2-context-conversation", L("My friend ate breakfast. Then he/she went to school.", "Il mio amico ha mangiato la colazione. Poi è andato a scuola.")),
  ],
});

// ---------------------------------------------------------------------------
// Lesson experiences-narratives-3 — Experience controlled practice + plain-
// past adjectives (en3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "experiences-narratives-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-experience-takoto",
  supportingCanDoIds: ["a2-cando-recognize-plain-forms"],
  introducedConceptIds: [],
  introducedSenseIds: [],
  models: [
    experienceLine("experiences-narratives-3-m1", "a2-referent-emi", "a2-value-exp-oyoida", "a2-context-experiences", L("Emi has swum in the sea before.", "Emi ha già nuotato nel mare.")),
    experienceLine("experiences-narratives-3-m2", "a2-referent-sora", "a2-value-exp-oyoida", "a2-context-outing", L("Sora has swum in the sea before.", "Sora ha già nuotato nel mare.")),
    experienceLine("experiences-narratives-3-m3", "a2-referent-friend", "a2-value-exp-oyoida", "a2-context-among-friends", L("My friend has swum in the sea before.", "Il mio amico ha già nuotato nel mare.")),
    experienceLine("experiences-narratives-3-m4", "a2-referent-colleague", "a2-value-exp-oyoida", "a2-context-workplace", L("My colleague has swum in the sea before.", "Il mio collega ha già nuotato nel mare.")),
    experienceLine("experiences-narratives-3-m5", "a2-referent-sora", "a2-value-exp-itta-oosaka", "a2-context-experiences", L("Sora has been to Osaka before.", "Sora è già stato a Osaka.")),
    plainAdjectiveLine("experiences-narratives-3-m6", "a2-value-plain-tanoshikatta", "a2-context-experiences", L("It was fun.", "È stato divertente.")),
    plainAdjectiveLine("experiences-narratives-3-m7", "a2-value-plain-yuumei-datta", "a2-context-conversation", L("It was famous.", "Era famoso.")),
    plainAdjectiveLine("experiences-narratives-3-m8", "a2-value-plain-warukatta", "a2-context-among-friends", L("It was bad.", "Era brutto.")),
  ],
  transfers: [
    experienceLine("experiences-narratives-3-t1", "a2-referent-colleague", "a2-value-exp-itta-oosaka", "a2-context-workplace", L("My colleague has been to Osaka before.", "Il mio collega è già stato a Osaka.")),
    experienceLine("experiences-narratives-3-t2", "a2-referent-friend", "a2-value-exp-tabeta-sushi", "a2-context-cafe", L("My friend has eaten sushi before.", "Il mio amico ha già mangiato sushi.")),
    experienceLine("experiences-narratives-3-t3", "a2-referent-colleague", "a2-value-exp-tabeta-sushi", "a2-context-cafe", L("My colleague has eaten sushi before.", "Il mio collega ha già mangiato sushi.")),
    experienceLine("experiences-narratives-3-t4", null, "a2-value-exp-matta", "a2-context-experiences", L("I have waited at the station before.", "Ho già aspettato alla stazione.")),
    // I2 spec-fix: t5 now recombines with an already-modeled subject
    // (teacher, introduced in en1) instead of mirroring m6's bare,
    // subject-less predicate.
    plainAdjectiveLine("experiences-narratives-3-t5", "a2-value-plain-tanoshikatta", "a2-context-workplace", L("The teacher had fun.", "L'insegnante si è divertito."), "a2-referent-teacher"),
  ],
});

// ---------------------------------------------------------------------------
// Lesson experiences-narratives-4 — Ask about experience: "ta koto ga arimasu ka" (en4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "experiences-narratives-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-ask-experience",
  supportingCanDoIds: ["a2-cando-experience-takoto"],
  introducedConceptIds: ["a2-concept-ask-experience"],
  introducedSenseIds: [],
  models: [
    experienceLine("experiences-narratives-4-m1", null, "a2-value-exp-oyoida", "a2-context-experiences", L("Have you ever swum in the sea?", "Hai mai nuotato nel mare?"), true),
    experienceLine("experiences-narratives-4-m2", "a2-referent-emi", "a2-value-exp-itta-kyouto", "a2-context-outing", L("Has Emi ever been to Kyoto?", "Emi è mai stata a Kyoto?"), true),
    experienceLine("experiences-narratives-4-m3", null, "a2-value-exp-tabeta-natto", "a2-context-cafe", L("Have you ever eaten natto?", "Hai mai mangiato il natto?"), true),
    experienceLine("experiences-narratives-4-m4", "a2-referent-sora", "a2-value-exp-matta", "a2-context-experiences", L("Has Sora ever waited at the station?", "Sora ha mai aspettato alla stazione?"), true),
    experienceLine("experiences-narratives-4-m5", null, "a2-value-exp-nobotta-yama", "a2-context-outing", L("Have you ever climbed a mountain?", "Hai mai scalato una montagna?"), true),
    experienceLine("experiences-narratives-4-m6", "a2-referent-friend", "a2-value-exp-oyoida", "a2-context-among-friends", L("Has your friend ever swum in the sea?", "Il tuo amico ha mai nuotato nel mare?"), true),
    experienceLine("experiences-narratives-4-m7", null, "a2-value-exp-itta-tokyo", "a2-context-conversation", L("Have you ever been to Tokyo?", "Sei mai stato/a a Tokyo?"), true),
    experienceLine("experiences-narratives-4-m8", "a2-referent-colleague", "a2-value-exp-tabeta-sushi", "a2-context-workplace", L("Has your colleague ever eaten sushi?", "Il tuo collega ha mai mangiato sushi?"), true),
  ],
  transfers: [
    experienceLine("experiences-narratives-4-t1", "a2-referent-teacher", "a2-value-exp-matta", "a2-context-experiences", L("Has the teacher ever waited at the station?", "L'insegnante ha mai aspettato alla stazione?"), true),
    experienceLine("experiences-narratives-4-t2", "a2-referent-sora", "a2-value-exp-oyoida", "a2-context-outing", L("Has Sora ever swum in the sea?", "Sora ha mai nuotato nel mare?"), true),
    experienceLine("experiences-narratives-4-t3", "a2-referent-emi", "a2-value-exp-matta", "a2-context-cafe", L("Has Emi ever waited at the station?", "Emi ha mai aspettato alla stazione?"), true),
    experienceLine("experiences-narratives-4-t4", "a2-referent-friend", "a2-value-exp-itta-tokyo", "a2-context-among-friends", L("Has your friend ever been to Tokyo?", "Il tuo amico è mai stato a Tokyo?"), true),
    experienceLine("experiences-narratives-4-t5", "a2-referent-teacher", "a2-value-exp-tabeta-sushi", "a2-context-workplace", L("Has the teacher ever eaten sushi?", "L'insegnante ha mai mangiato sushi?"), true),
  ],
});

export const module3Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module3Recipe = A2_MODULE_MANIFEST[MODULE_ID];
