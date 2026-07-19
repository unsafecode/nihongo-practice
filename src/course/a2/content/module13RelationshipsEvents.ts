/**
 * A2 Module 13 — Relationships and events (Phase 3 Task 7).
 *
 * Four instructional lessons: re1 (relationships-events-1) describes
 * family/friends naturally (adjective description via a2-family-family-
 * description, plus existence via the REUSED a2-family-describe-facility —
 * no support); re2 (relationships-events-2) teaches ageru/morau/kureru
 * give-receive, a genuinely compositional recipient-marker+gift-marker family
 * (rule-recipient-object-action) proving correct giver/receiver particles
 * and perspective (no support); re3 (relationships-events-3) celebrates an
 * event, transferring into BOTH ongoing-teiru (M5 family recurrence) AND
 * experience-takoto (M3 family recurrence) — the grammar spiral's own
 * relationships-events-3 recurrence role for both; re4
 * (relationships-events-4) decides on a gift, with reason-kara (M4 family)
 * true transfer. Every sentence carries a semantic-ID-only variant; all
 * Japanese/romaji lives in the shared A2 semantic-value catalog
 * (`a2SemanticCatalog.ts`) in hiragana/katakana only.
 */
import { A2_MODULE_MANIFEST } from "../manifest";
import {
  buildA2InstructionalLesson,
  type A2BuiltLesson,
  type A2LineSpec,
} from "../catalog/a2LessonBuilders";

const MODULE_ID = "relationships-events";

function L(en: string, it: string) {
  return { en, it };
}

interface LineOptions {
  readonly subjectValueId?: string | null;
  readonly recipient?: string | null;
  readonly object?: string | null;
  readonly speakerRole?: string;
  readonly interrogative?: boolean;
}

/** A relationships-events line: the "subject" slot (family-member/
 * giver/receiver noun) is always a DIRECT semantic value — never a tracked
 * discourse referent — mirroring `module07NeighborhoodServices.ts`'s own
 * `facilityLine` shape exactly (subjectReferent stays null; subjectRealization
 * stays "explicit" whenever a subject value is supplied, "omitted"
 * otherwise). `recipient`/`object` are additional direct slot values for
 * re2's give-receive family. */
function line(
  id: string,
  family: string,
  predicate: string,
  context: string,
  translation: { en: string; it: string },
  options: LineOptions = {},
): A2LineSpec {
  const subjectValueId = options.subjectValueId ?? null;
  const slots: Record<string, string> = { predicate };
  if (subjectValueId !== null) {
    slots.subject = subjectValueId;
  }
  if (options.recipient) {
    slots.recipient = options.recipient;
  }
  if (options.object) {
    slots.object = options.object;
  }
  return {
    id,
    family,
    context,
    subjectReferent: null,
    subjectRealization: subjectValueId === null ? "omitted" : "explicit",
    slots,
    translation,
    interrogative: options.interrogative,
    speakerRole: options.speakerRole,
  };
}

const RELATIONSHIPS = "a2-context-relationships";
const AMONG_FRIENDS = "a2-context-among-friends";
const OUTING = "a2-context-outing";

// ---------------------------------------------------------------------------
// Lesson relationships-events-1 — Family/friend description + existence (re1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "relationships-events-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-family-relations",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-family-relations"],
  introducedSenseIds: [],
  models: [
    line("relationships-events-1-m1", "a2-family-family-description", "a2-value-yasashii-stem", RELATIONSHIPS, L("My mother is kind.", "Mia madre è gentile."), { subjectValueId: "a2-value-family-haha-subject", speakerRole: "a2-role-learner" }),
    line("relationships-events-1-m2", "a2-family-family-description", "a2-value-genki-stem", RELATIONSHIPS, L("My father is well.", "Mio padre sta bene."), { subjectValueId: "a2-value-family-chichi-subject", speakerRole: "a2-role-friend" }),
    line("relationships-events-1-m3", "a2-family-family-description", "a2-value-yasashii-stem", RELATIONSHIPS, L("My older sister is kind.", "Mia sorella maggiore è gentile."), { subjectValueId: "a2-value-family-ane-subject", speakerRole: "a2-role-colleague" }),
    line("relationships-events-1-m4", "a2-family-family-description", "a2-value-genki-stem", RELATIONSHIPS, L("My younger brother is well.", "Mio fratello minore sta bene."), { subjectValueId: "a2-value-family-otouto-subject", speakerRole: "a2-role-teacher" }),
    line("relationships-events-1-m5", "a2-family-family-description", "a2-value-yasashii-stem", RELATIONSHIPS, L("My younger sister is kind.", "Mia sorella minore è gentile."), { subjectValueId: "a2-value-family-imouto-subject", speakerRole: "a2-role-learner" }),
    line("relationships-events-1-m6", "a2-family-family-description", "a2-value-genki-stem", AMONG_FRIENDS, L("My friend is well.", "Il mio amico sta bene."), { subjectValueId: "a2-value-friend-subject", speakerRole: "a2-role-friend" }),
    // m7/m8: family-relations existence (I have siblings / I have children)
    // reuses the EXISTING a2-family-describe-facility (rule-existence)
    // verbatim, with fresh subject values — never a new family.
    line("relationships-events-1-m7", "a2-family-describe-facility", "a2-value-exist-iru", RELATIONSHIPS, L("I have siblings.", "Ho fratelli e sorelle."), { subjectValueId: "a2-value-family-kyoudai-subject", speakerRole: "a2-role-colleague" }),
    line("relationships-events-1-m8", "a2-family-describe-facility", "a2-value-exist-iru", RELATIONSHIPS, L("I have children.", "Ho dei figli."), { subjectValueId: "a2-value-family-kodomo-subject", speakerRole: "a2-role-teacher" }),
    line("relationships-events-1-m9", "a2-family-family-description", "a2-value-ookii-stem", RELATIONSHIPS, L("My older brother is big.", "Mio fratello maggiore è grande."), { subjectValueId: "a2-value-family-ani-subject", speakerRole: "a2-role-learner" }),
  ],
  // Every transfer recombines an already-modeled family-member subject with
  // a fresh predicate not paired with it above, so all 5 transfers stay
  // visibly novel (never repeating a model's own subject+predicate pair).
  transfers: [
    line("relationships-events-1-t1", "a2-family-family-description", "a2-value-genki-stem", RELATIONSHIPS, L("My older sister is well.", "Mia sorella maggiore sta bene."), { subjectValueId: "a2-value-family-ane-subject", speakerRole: "a2-role-friend" }),
    line("relationships-events-1-t2", "a2-family-family-description", "a2-value-yasashii-stem", RELATIONSHIPS, L("My younger brother is kind.", "Mio fratello minore è gentile."), { subjectValueId: "a2-value-family-otouto-subject", speakerRole: "a2-role-colleague" }),
    line("relationships-events-1-t3", "a2-family-family-description", "a2-value-genki-stem", RELATIONSHIPS, L("My younger sister is well.", "Mia sorella minore sta bene."), { subjectValueId: "a2-value-family-imouto-subject", speakerRole: "a2-role-teacher" }),
    line("relationships-events-1-t4", "a2-family-family-description", "a2-value-yasashii-stem", RELATIONSHIPS, L("My father is kind.", "Mio padre è gentile."), { subjectValueId: "a2-value-family-chichi-subject", speakerRole: "a2-role-learner" }),
    line("relationships-events-1-t5", "a2-family-family-description", "a2-value-genki-stem", RELATIONSHIPS, L("My older brother is well.", "Mio fratello maggiore sta bene."), { subjectValueId: "a2-value-family-ani-subject", speakerRole: "a2-role-friend" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson relationships-events-2 -- ageru/morau/kureru give-receive (re2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "relationships-events-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-give-receive",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-give-receive"],
  introducedSenseIds: [],
  models: [
    line("relationships-events-2-m1", "a2-family-give-receive", "a2-value-give-ageru", RELATIONSHIPS, L("I'll give Sora a present.", "Darò un regalo a Sora."), { recipient: "a2-value-sora", object: "a2-value-gift-purezento", speakerRole: "a2-role-learner" }),
    line("relationships-events-2-m2", "a2-family-give-receive", "a2-value-give-ageru", RELATIONSHIPS, L("I'll give Emi flowers.", "Darò dei fiori a Emi."), { recipient: "a2-value-emi", object: "a2-value-gift-hana", speakerRole: "a2-role-friend" }),
    line("relationships-events-2-m3", "a2-family-give-receive", "a2-value-give-morau", RELATIONSHIPS, L("I'll get a book from my friend.", "Riceverò un libro dal mio amico."), { recipient: "a2-value-friend-subject", object: "a2-value-gift-hon", speakerRole: "a2-role-colleague" }),
    line("relationships-events-2-m4", "a2-family-give-receive", "a2-value-give-morau", RELATIONSHIPS, L("I'll get sweets from the teacher.", "Riceverò dei dolci dall'insegnante."), { recipient: "a2-value-teacher-subject", object: "a2-value-gift-okashi", speakerRole: "a2-role-learner" }),
    line("relationships-events-2-m5", "a2-family-give-receive", "a2-value-give-ageru", OUTING, L("Sora gives Emi a present.", "Sora dà un regalo a Emi."), { subjectValueId: "a2-value-sora", recipient: "a2-value-emi", object: "a2-value-gift-purezento", speakerRole: "a2-role-teacher" }),
    line("relationships-events-2-m6", "a2-family-give-receive", "a2-value-give-morau", OUTING, L("My friend gets a book from the teacher.", "Il mio amico riceve un libro dall'insegnante."), { subjectValueId: "a2-value-friend-subject", recipient: "a2-value-teacher-subject", object: "a2-value-gift-hon", speakerRole: "a2-role-colleague" }),
    line("relationships-events-2-m7", "a2-family-give-receive", "a2-value-give-kureru", OUTING, L("Sora gives me a book.", "Sora mi dà un libro."), { subjectValueId: "a2-value-sora", recipient: "a2-value-watashi", object: "a2-value-gift-hon", speakerRole: "a2-role-friend" }),
    line("relationships-events-2-m8", "a2-family-give-receive", "a2-value-give-kureru", OUTING, L("Emi gives me sweets.", "Emi mi dà dei dolci."), { subjectValueId: "a2-value-emi", recipient: "a2-value-watashi", object: "a2-value-gift-okashi", speakerRole: "a2-role-teacher" }),
    line("relationships-events-2-m9", "a2-family-give-receive", "a2-value-give-ageru", RELATIONSHIPS, L("I'll give my friend sweets.", "Darò dei dolci al mio amico."), { recipient: "a2-value-friend-subject", object: "a2-value-gift-okashi", speakerRole: "a2-role-learner" }),
  ],
  // Every transfer recombines an already-modeled recipient/gift/predicate
  // triple into a fresh pairing not used above, so all 5 transfers stay
  // visibly novel while still proving the SAME correct recipient-marker/gift-marker
  // particle order for every one of ageru/morau/kureru.
  transfers: [
    line("relationships-events-2-t1", "a2-family-give-receive", "a2-value-give-ageru", RELATIONSHIPS, L("I'll give the teacher flowers.", "Darò dei fiori all'insegnante."), { recipient: "a2-value-teacher-subject", object: "a2-value-gift-hana", speakerRole: "a2-role-colleague" }),
    line("relationships-events-2-t2", "a2-family-give-receive", "a2-value-give-morau", RELATIONSHIPS, L("I'll get a present from Sora.", "Riceverò un regalo da Sora."), { recipient: "a2-value-sora", object: "a2-value-gift-purezento", speakerRole: "a2-role-learner" }),
    line("relationships-events-2-t3", "a2-family-give-receive", "a2-value-give-morau", OUTING, L("Emi gets flowers from my friend.", "Emi riceve dei fiori dal mio amico."), { subjectValueId: "a2-value-emi", recipient: "a2-value-friend-subject", object: "a2-value-gift-hana", speakerRole: "a2-role-friend" }),
    line("relationships-events-2-t4", "a2-family-give-receive", "a2-value-give-kureru", OUTING, L("My friend gives me sweets.", "Il mio amico mi dà dei dolci."), { subjectValueId: "a2-value-friend-subject", recipient: "a2-value-watashi", object: "a2-value-gift-okashi", speakerRole: "a2-role-teacher" }),
    line("relationships-events-2-t5", "a2-family-give-receive", "a2-value-give-ageru", RELATIONSHIPS, L("I'll give Sora sweets.", "Darò dei dolci a Sora."), { recipient: "a2-value-sora", object: "a2-value-gift-okashi", speakerRole: "a2-role-colleague" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson relationships-events-3 — Celebrating an event, with BOTH
// ongoing-teiru and experience-takoto true recurrence (re3)
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "relationships-events-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-events-celebrations",
  supportingCanDoIds: ["a2-cando-ongoing-teiru", "a2-cando-experience-takoto"],
  introducedConceptIds: ["a2-concept-events-celebrations"],
  introducedSenseIds: [],
  models: [
    line("relationships-events-3-m1", "a2-family-celebrate-event", "a2-value-events-iwaimasu", RELATIONSHIPS, L("I'll celebrate a birthday.", "Festeggerò un compleanno."), { object: "a2-value-obj-tanjoubi", speakerRole: "a2-role-learner" }),
    line("relationships-events-3-m2", "a2-family-celebrate-event", "a2-value-events-iwaimasu", RELATIONSHIPS, L("I'll celebrate a wedding.", "Festeggerò un matrimonio."), { object: "a2-value-obj-kekkonshiki", speakerRole: "a2-role-friend" }),
    line("relationships-events-3-m3", "a2-family-celebrate-event", "a2-value-events-okurimasu", RELATIONSHIPS, L("I'll send a letter.", "Manderò una lettera."), { object: "a2-value-obj-tegami", speakerRole: "a2-role-colleague" }),
    line("relationships-events-3-m4", "a2-family-celebrate-event", "a2-value-events-okurimasu", RELATIONSHIPS, L("I'll send a present.", "Manderò un regalo."), { object: "a2-value-gift-purezento", speakerRole: "a2-role-teacher" }),
    line("relationships-events-3-m5", "a2-family-celebrate-event", "a2-value-events-iwaimasu", OUTING, L("Sora will celebrate a birthday.", "Sora festeggerà un compleanno."), { subjectValueId: "a2-value-sora", object: "a2-value-obj-tanjoubi", speakerRole: "a2-role-friend" }),
    line("relationships-events-3-m6", "a2-family-celebrate-event", "a2-value-events-okurimasu", OUTING, L("Emi will send a letter.", "Emi manderà una lettera."), { subjectValueId: "a2-value-emi", object: "a2-value-obj-tegami", speakerRole: "a2-role-colleague" }),
    // m7/m8: the two supporting-Can-do families (ongoing-teiru,
    // experience-takoto) must also be MODELED here, not only transferred
    // (mirrors travel-reservations-1-m9/m10's own precedent) — fresh values
    // for both, genuinely reused constructions rather than a whole-clause
    // duplicate.
    line("relationships-events-3-m7", "a2-family-ongoing-teiru", "a2-value-teiru-paatii-shiteimasu", OUTING, L("I'm having a party.", "Sto facendo una festa."), { object: "a2-value-obj-paatii", speakerRole: "a2-role-learner" }),
    line("relationships-events-3-m8", "a2-family-experience-takoto", "a2-value-exp-kekkonshiki-itta", RELATIONSHIPS, L("I have been to a wedding.", "Sono stato a un matrimonio."), { speakerRole: "a2-role-friend" }),
    line("relationships-events-3-m9", "a2-family-celebrate-event", "a2-value-events-iwaimasu", OUTING, L("My friend will celebrate a wedding.", "Il mio amico festeggerà un matrimonio."), { subjectValueId: "a2-value-friend-subject", object: "a2-value-obj-kekkonshiki", speakerRole: "a2-role-teacher" }),
  ],
  // t1/t2 are the genuine supporting-Can-do transfers (ongoing-teiru and
  // experience-takoto), reusing an EXISTING M5/M3 family+value verbatim with
  // a fresh subject wrapper; t3-t5 recombine an already-modeled
  // celebrate-event predicate with a subject/object pairing not used above.
  transfers: [
    line("relationships-events-3-t1", "a2-family-ongoing-teiru", "a2-value-teiru-paatii-shiteimasu", OUTING, L("Sora is having a party.", "Sora sta facendo una festa."), { subjectValueId: "a2-value-sora", object: "a2-value-obj-paatii", speakerRole: "a2-role-colleague" }),
    line("relationships-events-3-t2", "a2-family-experience-takoto", "a2-value-exp-kekkonshiki-itta", RELATIONSHIPS, L("Emi has been to a wedding.", "Emi è stata a un matrimonio."), { subjectValueId: "a2-value-emi", speakerRole: "a2-role-teacher" }),
    line("relationships-events-3-t3", "a2-family-celebrate-event", "a2-value-events-okurimasu", OUTING, L("My friend will send a present.", "Il mio amico manderà un regalo."), { subjectValueId: "a2-value-friend-subject", object: "a2-value-gift-purezento", speakerRole: "a2-role-friend" }),
    line("relationships-events-3-t4", "a2-family-celebrate-event", "a2-value-events-iwaimasu", RELATIONSHIPS, L("The teacher will celebrate a birthday.", "L'insegnante festeggerà un compleanno."), { subjectValueId: "a2-value-teacher-subject", object: "a2-value-obj-tanjoubi", speakerRole: "a2-role-learner" }),
    line("relationships-events-3-t5", "a2-family-celebrate-event", "a2-value-events-okurimasu", OUTING, L("Sora will send a letter.", "Sora manderà una lettera."), { subjectValueId: "a2-value-sora", object: "a2-value-obj-tegami", speakerRole: "a2-role-colleague" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson relationships-events-4 — Choosing a gift, with reason-kara true
// transfer (re4)
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "relationships-events-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-choose-gift",
  supportingCanDoIds: ["a2-cando-reason-kara"],
  introducedConceptIds: ["a2-concept-choose-gift"],
  introducedSenseIds: [],
  models: [
    line("relationships-events-4-m1", "a2-family-choose-gift", "a2-value-choose-hon", RELATIONSHIPS, L("I'll go with this book.", "Sceglierò questo libro."), { speakerRole: "a2-role-learner" }),
    line("relationships-events-4-m2", "a2-family-choose-gift", "a2-value-choose-kasa", RELATIONSHIPS, L("I'll go with this umbrella.", "Sceglierò questo ombrello."), { speakerRole: "a2-role-friend" }),
    line("relationships-events-4-m3", "a2-family-choose-gift", "a2-value-choose-hana", RELATIONSHIPS, L("I'll go with these flowers.", "Sceglierò questi fiori."), { speakerRole: "a2-role-colleague" }),
    line("relationships-events-4-m4", "a2-family-choose-gift", "a2-value-choose-tokei", RELATIONSHIPS, L("I'll go with this watch.", "Sceglierò questo orologio."), { speakerRole: "a2-role-teacher" }),
    line("relationships-events-4-m5", "a2-family-choose-gift", "a2-value-choose-kaban", RELATIONSHIPS, L("I'll go with this bag.", "Sceglierò questa borsa."), { speakerRole: "a2-role-learner" }),
    line("relationships-events-4-m6", "a2-family-choose-gift", "a2-value-choose-kutsu", RELATIONSHIPS, L("I'll go with these shoes.", "Sceglierò queste scarpe."), { speakerRole: "a2-role-friend" }),
    line("relationships-events-4-m7", "a2-family-choose-gift", "a2-value-choose-nani-ga-ii", RELATIONSHIPS, L("What present would be good?", "Che regalo andrebbe bene?"), { speakerRole: "a2-role-colleague", interrogative: true }),
    // m8: reason-kara (M4 family) TRUE TRANSFER evidence must also be
    // MODELED here first (never only transferred, mirrors every other
    // recurring grammar family in this module's own precedent). Never a
    // third named support (recipe stays capped at exactly reason-kara).
    line("relationships-events-4-m8", "a2-family-reason-kara", "a2-value-kara-yasui-kono-hon", RELATIONSHIPS, L("This book is cheap, so I'll go with this one.", "Questo libro è economico, quindi sceglierò questo."), { speakerRole: "a2-role-teacher" }),
    line("relationships-events-4-m9", "a2-family-choose-gift", "a2-value-choose-ikaga", OUTING, L("How about this one?", "Che ne dici di questo?"), { speakerRole: "a2-role-learner", interrogative: true }),
  ],
  // t1 is m8's own reason-kara value transferred with a fresh Sora subject
  // wrapper (the grammar spiral's real reason-kara TRANSFER evidence);
  // t2-t5 recombine an already-modeled choose-gift predicate with a fresh
  // explicit subject not used above, so all 5 transfers stay visibly novel.
  transfers: [
    line("relationships-events-4-t1", "a2-family-reason-kara", "a2-value-kara-yasui-kono-hon", OUTING, L("Sora, this book is cheap, so I'll go with this one.", "Sora, questo libro è economico, quindi scelgo questo."), { subjectValueId: "a2-value-sora", speakerRole: "a2-role-friend" }),
    line("relationships-events-4-t2", "a2-family-choose-gift", "a2-value-choose-hon", OUTING, L("Sora will go with this book.", "Sora sceglierà questo libro."), { subjectValueId: "a2-value-sora", speakerRole: "a2-role-colleague" }),
    line("relationships-events-4-t3", "a2-family-choose-gift", "a2-value-choose-kasa", OUTING, L("Emi will go with this umbrella.", "Emi sceglierà questo ombrello."), { subjectValueId: "a2-value-emi", speakerRole: "a2-role-teacher" }),
    line("relationships-events-4-t4", "a2-family-choose-gift", "a2-value-choose-hana", OUTING, L("My friend will go with these flowers.", "Il mio amico sceglierà questi fiori."), { subjectValueId: "a2-value-friend-subject", speakerRole: "a2-role-learner" }),
    line("relationships-events-4-t5", "a2-family-choose-gift", "a2-value-choose-tokei", OUTING, L("The teacher will go with this watch.", "L'insegnante sceglierà questo orologio."), { subjectValueId: "a2-value-teacher-subject", speakerRole: "a2-role-friend" }),
  ],
});

export const module13Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module13Recipe = A2_MODULE_MANIFEST[MODULE_ID];
