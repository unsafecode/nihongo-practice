/**
 * A2 Module 9 — Shopping and returns (Phase 3 Task 6).
 *
 * Four instructional lessons: sr1 (shopping-returns-1) introduces the
 * favor-marked comparison construction "X no hou ga Y yori ADJ desu" (the
 * corrected authoritative spiral's own comparison intro — nothing before
 * this lesson ever uses "no hou ga"/"yori"/"ichiban"); sr2
 * (shopping-returns-2) introduces the superlative "X ga ichiban ADJ desu";
 * sr3 (shopping-returns-3) is controlled comparison practice plus asking
 * the price and deciding what to buy, transferring into opinion ("to
 * omoimasu") and possibility ("dekimasu") recombinations; sr4
 * (shopping-returns-4) is natural return/exchange dialogue, recombining
 * reason-kara/reason-node recurrence. Every sentence carries a
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

const MODULE_ID = "shopping-returns";

function L(en: string, it: string) {
  return { en, it };
}

interface LineOptions {
  readonly object?: string | null;
  readonly favored?: string | null;
  readonly standard?: string | null;
  readonly subjectReferent?: string | null;
  readonly subjectRealization?: "omitted" | "explicit" | "vocative";
  readonly interrogative?: boolean;
  readonly speakerRole?: string;
  readonly form?: FormSelection;
}

/** One M9 line. `favored`/`standard` back the comparison/superlative
 * families' own content slots (things being compared — never a discourse
 * subject/referent); `subjectReferent` only ever drives a vocative/explicit
 * discourse subject for the whole-clause-bake families (ask-price-decide/
 * return-exchange/reason-kara/reason-node), never the comparison families. */
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
  if (options.favored) {
    slots.favored = options.favored;
  }
  if (options.standard) {
    slots.standard = options.standard;
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

const SHOPPING = "a2-context-shopping";
const AMONG_FRIENDS = "a2-context-among-friends";

/** Honest FormSelection for a whole-clause-bake invariant value whose own
 * final clause is genuinely present-negative ("tsukatte imasen") — the
 * builder's own default is present-affirmative, so this must be declared
 * explicitly (§ M4 spec-fix "form metadata"). */
const NEGATIVE_PRESENT: FormSelection = { polarity: "negative", tense: "present", formality: "polite" };

// ---------------------------------------------------------------------------
// Lesson shopping-returns-1 — Comparison intro "no hou ga"/"yori" (sr1)
// ---------------------------------------------------------------------------

const lesson1: A2BuiltLesson = buildA2InstructionalLesson({
  id: "shopping-returns-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a2-cando-compare",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-comparison"],
  introducedSenseIds: ["a2-sense-yasui", "a2-sense-takai", "a2-sense-ookii", "a2-sense-chiisai"],
  models: [
    line("shopping-returns-1-m1", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("The bag is cheaper than the shoes.", "La borsa è più economica delle scarpe."), { favored: "a2-value-obj-kaban", standard: "a2-value-obj-kutsu", speakerRole: "a2-role-learner" }),
    line("shopping-returns-1-m2", "a2-family-comparison-favor", "a2-value-takai-stem", SHOPPING, L("The watch is more expensive than the bag.", "L'orologio è più costoso della borsa."), { favored: "a2-value-obj-tokei", standard: "a2-value-obj-kaban", speakerRole: "a2-role-clerk" }),
    line("shopping-returns-1-m3", "a2-family-comparison-favor", "a2-value-takai-stem", SHOPPING, L("The clothes are more expensive than the watch.", "I vestiti sono più costosi dell'orologio."), { favored: "a2-value-obj-fuku", standard: "a2-value-obj-tokei", speakerRole: "a2-role-friend" }),
    line("shopping-returns-1-m4", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("The shoes are cheaper than the clothes.", "Le scarpe sono più economiche dei vestiti."), { favored: "a2-value-obj-kutsu", standard: "a2-value-obj-fuku", speakerRole: "a2-role-teacher" }),
    line("shopping-returns-1-m5", "a2-family-comparison-favor", "a2-value-ookii-stem", AMONG_FRIENDS, L("The bag is bigger than the watch.", "La borsa è più grande dell'orologio."), { favored: "a2-value-obj-kaban", standard: "a2-value-obj-tokei", speakerRole: "a2-role-colleague" }),
    line("shopping-returns-1-m6", "a2-family-comparison-favor", "a2-value-chiisai-stem", AMONG_FRIENDS, L("The shoes are smaller than the bag.", "Le scarpe sono più piccole della borsa."), { favored: "a2-value-obj-kutsu", standard: "a2-value-obj-kaban", speakerRole: "a2-role-sora" }),
    line("shopping-returns-1-m7", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("This shop is cheaper than that shop.", "Questo negozio è più economico di quello."), { favored: "a2-value-obj-kono-mise", standard: "a2-value-obj-ano-mise", speakerRole: "a2-role-emi" }),
    line("shopping-returns-1-m8", "a2-family-comparison-favor", "a2-value-chiisai-stem", SHOPPING, L("The clothes are smaller than the shoes.", "I vestiti sono più piccoli delle scarpe."), { favored: "a2-value-obj-fuku", standard: "a2-value-obj-kutsu", speakerRole: "a2-role-learner" }),
  ],
  // Every transfer recombines an already-modeled predicate stem (yasui/
  // takai/ookii/chiisai — m1-m8, above) with a favored/standard item pairing
  // no model uses, so all 5 transfers stay visibly novel while reusing only
  // already-modeled compositional content (§ introduction-before-use).
  transfers: [
    line("shopping-returns-1-t1", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("The watch is cheaper than the clothes.", "L'orologio è più economico dei vestiti."), { favored: "a2-value-obj-tokei", standard: "a2-value-obj-fuku", speakerRole: "a2-role-friend" }),
    line("shopping-returns-1-t2", "a2-family-comparison-favor", "a2-value-takai-stem", SHOPPING, L("That shop is more expensive than this shop.", "Quel negozio è più costoso di questo."), { favored: "a2-value-obj-ano-mise", standard: "a2-value-obj-kono-mise", speakerRole: "a2-role-colleague" }),
    line("shopping-returns-1-t3", "a2-family-comparison-favor", "a2-value-chiisai-stem", SHOPPING, L("The bag is smaller than the clothes.", "La borsa è più piccola dei vestiti."), { favored: "a2-value-obj-kaban", standard: "a2-value-obj-fuku", speakerRole: "a2-role-teacher" }),
    line("shopping-returns-1-t4", "a2-family-comparison-favor", "a2-value-ookii-stem", SHOPPING, L("The shoes are bigger than the watch.", "Le scarpe sono più grandi dell'orologio."), { favored: "a2-value-obj-kutsu", standard: "a2-value-obj-tokei", speakerRole: "a2-role-sora" }),
    line("shopping-returns-1-t5", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("The clothes are cheaper than the bag.", "I vestiti sono più economici della borsa."), { favored: "a2-value-obj-fuku", standard: "a2-value-obj-kaban", speakerRole: "a2-role-emi" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson shopping-returns-2 — Superlative "ichiban" (sr2)
// ---------------------------------------------------------------------------

const lesson2: A2BuiltLesson = buildA2InstructionalLesson({
  id: "shopping-returns-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a2-cando-compare",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-superlative"],
  introducedSenseIds: [],
  models: [
    line("shopping-returns-2-m1", "a2-family-superlative", "a2-value-yasui-stem", SHOPPING, L("The bag is the cheapest.", "La borsa è la più economica."), { favored: "a2-value-obj-kaban", speakerRole: "a2-role-learner" }),
    line("shopping-returns-2-m2", "a2-family-superlative", "a2-value-takai-stem", SHOPPING, L("The watch is the most expensive.", "L'orologio è il più costoso."), { favored: "a2-value-obj-tokei", speakerRole: "a2-role-clerk" }),
    line("shopping-returns-2-m3", "a2-family-superlative", "a2-value-ookii-stem", SHOPPING, L("The clothes are the biggest.", "I vestiti sono i più grandi."), { favored: "a2-value-obj-fuku", speakerRole: "a2-role-friend" }),
    line("shopping-returns-2-m4", "a2-family-superlative", "a2-value-chiisai-stem", SHOPPING, L("The shoes are the smallest.", "Le scarpe sono le più piccole."), { favored: "a2-value-obj-kutsu", speakerRole: "a2-role-teacher" }),
    line("shopping-returns-2-m5", "a2-family-superlative", "a2-value-yasui-stem", SHOPPING, L("This shop is the cheapest.", "Questo negozio è il più economico."), { favored: "a2-value-obj-kono-mise", speakerRole: "a2-role-colleague" }),
    line("shopping-returns-2-m6", "a2-family-superlative", "a2-value-takai-stem", AMONG_FRIENDS, L("That shop is the most expensive.", "Quel negozio è il più costoso."), { favored: "a2-value-obj-ano-mise", speakerRole: "a2-role-sora" }),
    line("shopping-returns-2-m7", "a2-family-superlative", "a2-value-ookii-stem", AMONG_FRIENDS, L("The bag is the biggest.", "La borsa è la più grande."), { favored: "a2-value-obj-kaban", speakerRole: "a2-role-emi" }),
    line("shopping-returns-2-m8", "a2-family-superlative", "a2-value-yasui-stem", SHOPPING, L("The clothes are the cheapest of all.", "I vestiti sono i più economici di tutti."), { favored: "a2-value-obj-fuku", speakerRole: "a2-role-learner" }),
  ],
  // Every transfer recombines an already-modeled adjective stem with a
  // favored item this lesson has not already paired with it, so all 5
  // transfers stay visibly novel.
  transfers: [
    line("shopping-returns-2-t1", "a2-family-superlative", "a2-value-yasui-stem", SHOPPING, L("The watch is the cheapest.", "L'orologio è il più economico."), { favored: "a2-value-obj-tokei", speakerRole: "a2-role-friend" }),
    line("shopping-returns-2-t2", "a2-family-superlative", "a2-value-takai-stem", SHOPPING, L("The clothes are the most expensive.", "I vestiti sono i più costosi."), { favored: "a2-value-obj-fuku", speakerRole: "a2-role-colleague" }),
    line("shopping-returns-2-t3", "a2-family-superlative", "a2-value-ookii-stem", SHOPPING, L("This shop is the biggest.", "Questo negozio è il più grande."), { favored: "a2-value-obj-kono-mise", speakerRole: "a2-role-teacher" }),
    line("shopping-returns-2-t4", "a2-family-superlative", "a2-value-chiisai-stem", SHOPPING, L("That shop is the smallest.", "Quel negozio è il più piccolo."), { favored: "a2-value-obj-ano-mise", speakerRole: "a2-role-sora" }),
    line("shopping-returns-2-t5", "a2-family-superlative", "a2-value-ookii-stem", SHOPPING, L("The shoes are the biggest.", "Le scarpe sono le più grandi."), { favored: "a2-value-obj-kutsu", speakerRole: "a2-role-emi" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson shopping-returns-3 — Ask the price and decide (sr3), with
// comparison controlled practice, opinion+possibility transfer
// ---------------------------------------------------------------------------

const lesson3: A2BuiltLesson = buildA2InstructionalLesson({
  id: "shopping-returns-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a2-cando-ask-price-decide",
  supportingCanDoIds: ["a2-cando-opinion-toomou", "a2-cando-possibility"],
  introducedConceptIds: ["a2-concept-ask-price-decide"],
  introducedSenseIds: [],
  models: [
    line("shopping-returns-3-m1", "a2-family-ask-price-decide", "a2-value-price-ikura", SHOPPING, L("Excuse me, how much is this?", "Scusi, quanto costa questo?"), { subjectReferent: "a2-referent-clerk", speakerRole: "a2-role-learner" }),
    line("shopping-returns-3-m2", "a2-family-ask-price-decide", "a2-value-price-zenbude", SHOPPING, L("How much is it all together?", "Quanto costa in tutto?"), { speakerRole: "a2-role-learner" }),
    line("shopping-returns-3-m3", "a2-family-ask-price-decide", "a2-value-price-kore-onegai", SHOPPING, L("This one, please.", "Questo, per favore."), { speakerRole: "a2-role-learner" }),
    line("shopping-returns-3-m4", "a2-family-ask-price-decide", "a2-value-price-kore-ni-suru", AMONG_FRIENDS, L("I'll go with this one.", "Prendo questo."), { speakerRole: "a2-role-friend" }),
    line("shopping-returns-3-m5", "a2-family-ask-price-decide", "a2-value-price-takai-ne", AMONG_FRIENDS, L("That's expensive, isn't it.", "È caro, vero."), { speakerRole: "a2-role-colleague" }),
    line("shopping-returns-3-m6", "a2-family-ask-price-decide", "a2-value-price-yasui-ne", SHOPPING, L("That's cheap, isn't it.", "È economico, vero."), { speakerRole: "a2-role-teacher" }),
    // comparison controlled practice: fresh favored/standard/adjective
    // triples, none reused from shopping-returns-1/2's own models/transfers.
    line("shopping-returns-3-m7", "a2-family-comparison-favor", "a2-value-chiisai-stem", SHOPPING, L("The watch is smaller than the bag.", "L'orologio è più piccolo della borsa."), { favored: "a2-value-obj-tokei", standard: "a2-value-obj-kaban", speakerRole: "a2-role-sora" }),
    line("shopping-returns-3-m8", "a2-family-comparison-favor", "a2-value-yasui-stem", SHOPPING, L("That shop is cheaper than this shop.", "Quel negozio è più economico di questo."), { favored: "a2-value-obj-ano-mise", standard: "a2-value-obj-kono-mise", speakerRole: "a2-role-emi" }),
    line("shopping-returns-3-m9", "a2-family-comparison-favor", "a2-value-ookii-stem", SHOPPING, L("The clothes are bigger than the watch.", "I vestiti sono più grandi dell'orologio."), { favored: "a2-value-obj-fuku", standard: "a2-value-obj-tokei", speakerRole: "a2-role-learner" }),
    // m10/m11: the two supporting-Can-do families must also be MODELED
    // here, not only transferred (a lesson's realization-availability is
    // derived only from its own MODEL variants' families, never its
    // transfers — mirrors neighborhood-services-3-m9's own precedent). m10
    // models opinion-toomou's own "kaban-ii" value directly (a
    // whole-clause bake has no separate slot to recombine through, so t1-t3
    // below reuse this SAME value with a fresh vocative subject each,
    // rather than three separately-unmodeled shopping-flavored opinions);
    // m11 models a fresh possibility value/object pair, distinct from
    // t4/t5's own M7-reused targets below.
    line("shopping-returns-3-m10", "a2-family-opinion-toomou", "a2-value-opinion-kaban-ii", SHOPPING, L("I think this bag is better.", "Penso che questa borsa sia migliore."), { speakerRole: "a2-role-emi" }),
    line("shopping-returns-3-m11", "a2-family-possibility", "a2-value-possibility-kaku", SHOPPING, L("I can write my name here.", "Posso scrivere il mio nome qui."), { object: "a2-value-obj-namae", speakerRole: "a2-role-friend" }),
  ],
  // Supporting-Can-do transfer: opinion-toomou (M4 family recurrence,
  // shopping-flavored — genuinely reuses "no hou ga" from sr1/sr2 inside a
  // NEW whole-clause opinion frame, m10's own "kaban-ii" value verbatim
  // with a fresh vocative addressee each time) and possibility (M7
  // family/values reused verbatim in the new shopping context — a genuine
  // cross-module transfer). t1 additionally recombines the PRIMARY
  // ask-price-decide family's own m6 value with a fresh vocative subject
  // (every Can-do this lesson serves — including its own primary — needs
  // at least one genuine transfer somewhere in the catalog).
  transfers: [
    line("shopping-returns-3-t1", "a2-family-ask-price-decide", "a2-value-price-yasui-ne", SHOPPING, L("Sora, that's cheap, isn't it.", "Sora, è economico, vero."), { subjectReferent: "a2-referent-sora", speakerRole: "a2-role-friend" }),
    line("shopping-returns-3-t2", "a2-family-opinion-toomou", "a2-value-opinion-kaban-ii", SHOPPING, L("Sora, I think this bag is better.", "Sora, penso che questa borsa sia migliore."), { subjectReferent: "a2-referent-sora", speakerRole: "a2-role-friend" }),
    line("shopping-returns-3-t3", "a2-family-opinion-toomou", "a2-value-opinion-kaban-ii", SHOPPING, L("Emi, I think this bag is better.", "Emi, penso che questa borsa sia migliore."), { subjectReferent: "a2-referent-emi", speakerRole: "a2-role-colleague" }),
    line("shopping-returns-3-t4", "a2-family-possibility", "a2-value-possibility-tsukau", SHOPPING, L("You can use a card.", "Si può usare la carta."), { object: "a2-value-obj-kaado", speakerRole: "a2-role-clerk" }),
    line("shopping-returns-3-t5", "a2-family-possibility", "a2-value-possibility-hanasu", SHOPPING, L("You can speak Japanese here.", "Qui si può parlare giapponese."), { object: "a2-value-obj-nihongo-m7", speakerRole: "a2-role-clerk" }),
  ],
});

// ---------------------------------------------------------------------------
// Lesson shopping-returns-4 — Return and exchange (sr4), with reason-kara/
// reason-node recurrence
// ---------------------------------------------------------------------------

const lesson4: A2BuiltLesson = buildA2InstructionalLesson({
  id: "shopping-returns-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a2-cando-return-exchange",
  supportingCanDoIds: [],
  introducedConceptIds: ["a2-concept-return-exchange"],
  introducedSenseIds: [],
  models: [
    line("shopping-returns-4-m1", "a2-family-return-exchange", "a2-value-return-kore", SHOPPING, L("I'll return this.", "Restituisco questo."), { speakerRole: "a2-role-learner" }),
    line("shopping-returns-4-m2", "a2-family-return-exchange", "a2-value-return-kaban", SHOPPING, L("I'll return this bag.", "Restituisco questa borsa."), { speakerRole: "a2-role-friend" }),
    line("shopping-returns-4-m3", "a2-family-return-exchange", "a2-value-return-size-chiisai", AMONG_FRIENDS, L("The size is small.", "La taglia è piccola."), { speakerRole: "a2-role-colleague" }),
    line("shopping-returns-4-m4", "a2-family-return-exchange", "a2-value-return-iro-chigau", AMONG_FRIENDS, L("The color is different.", "Il colore è diverso."), { speakerRole: "a2-role-teacher" }),
    line("shopping-returns-4-m5", "a2-family-return-exchange", "a2-value-return-reshiito-aru", SHOPPING, L("I have the receipt.", "Ho la ricevuta."), { speakerRole: "a2-role-learner" }),
    line("shopping-returns-4-m6", "a2-family-return-exchange", "a2-value-return-koukan-dekiru", SHOPPING, L("Can I exchange it?", "Posso cambiarlo?"), { subjectReferent: "a2-referent-clerk", speakerRole: "a2-role-learner" }),
    line("shopping-returns-4-m7", "a2-family-return-exchange", "a2-value-return-tsukatteinai", SHOPPING, L("I haven't used this.", "Non ho usato questo."), { speakerRole: "a2-role-sora", form: NEGATIVE_PRESENT }),
    // reason-kara/reason-node recurrence (M4 families, shopping-flavored).
    line("shopping-returns-4-m8", "a2-family-reason-kara", "a2-value-kara-chiisai-kaesu", SHOPPING, L("Since the size is small, I'll return it.", "Siccome la taglia è piccola, lo restituisco."), { speakerRole: "a2-role-emi" }),
    line("shopping-returns-4-m9", "a2-family-reason-node", "a2-value-node-chigau-koukan", SHOPPING, L("Since the color is different, I'll exchange it.", "Siccome il colore è diverso, lo cambio."), { speakerRole: "a2-role-learner" }),
  ],
  // Every transfer reuses an ALREADY-modeled return-exchange/reason-kara/
  // reason-node value verbatim (never a brand-new predicate-sense — a
  // whole-clause-bake family's "item" is baked into the value itself, so a
  // genuinely novel transfer must vary the DISCOURSE SUBJECT instead of
  // inventing an unmodeled value; mirrors travel-reservations-1-t3..t5's
  // own vocative-recombination pattern below), each paired with a fresh
  // vocative subject none of m1-m9 ever used, so every transfer stays
  // visibly novel against every model.
  transfers: [
    line("shopping-returns-4-t1", "a2-family-return-exchange", "a2-value-return-kore", SHOPPING, L("Sora, I'll return this.", "Sora, restituisco questo."), { subjectReferent: "a2-referent-sora", speakerRole: "a2-role-friend" }),
    line("shopping-returns-4-t2", "a2-family-return-exchange", "a2-value-return-kaban", SHOPPING, L("Emi, I'll return this bag.", "Emi, restituisco questa borsa."), { subjectReferent: "a2-referent-emi", speakerRole: "a2-role-colleague" }),
    line("shopping-returns-4-t3", "a2-family-return-exchange", "a2-value-return-tsukatteinai", SHOPPING, L("Excuse me, I haven't used this.", "Scusi, non ho usato questo."), { subjectReferent: "a2-referent-clerk", speakerRole: "a2-role-teacher", form: NEGATIVE_PRESENT }),
    line("shopping-returns-4-t4", "a2-family-reason-kara", "a2-value-kara-chiisai-kaesu", SHOPPING, L("Sora, since the size is small, I'll return it.", "Sora, siccome la taglia è piccola, lo restituisco."), { subjectReferent: "a2-referent-sora", speakerRole: "a2-role-friend" }),
    line("shopping-returns-4-t5", "a2-family-reason-node", "a2-value-node-chigau-koukan", SHOPPING, L("Emi, since the color is different, I'll exchange it.", "Emi, siccome il colore è diverso, lo cambio."), { subjectReferent: "a2-referent-emi", speakerRole: "a2-role-colleague" }),
  ],
});

export const module9Lessons: readonly A2BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module9Recipe = A2_MODULE_MANIFEST[MODULE_ID];
