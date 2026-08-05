/**
 * A1 Module 7 — Places and movement.
 *
 * Four instructional lessons that make travel talk speakable while keeping the
 * particle senses honest: destination に versus direction へ, the means-で of
 * transport kept distinct from the action-place で, departure から and limit
 * まで on a route, and a closing synthesis that recombines all of them. No new
 * verb senses are introduced — the module reuses the already-productive motion
 * verbs (go / come) and the residence/work location verbs (live / work), which
 * is what lets it double as a spaced-recurrence host. The two spellings of で
 * (でんしゃ**で** as means, かいしゃ**で** as action place) come from two
 * different senses/frames, never from one overloaded string join.
 */

import { A1_MODULE_MANIFEST } from "../manifest";
import {
  A1_CONCEPT_DIRECTION_HE,
  A1_CONCEPT_LOCATION_PARTICLE,
  A1_CONCEPT_SOURCE_LIMIT,
  A1_CONCEPT_TOPIC_WA,
  A1_CONCEPT_TRANSPORT_DE,
  buildA1InstructionalLesson,
  type A1BuiltLesson,
  type Bilingual,
} from "./shared";
import { defineA1Module } from "../authoring";
import type { A1ModuleRecipe } from "../types";
import type { VerbUseRecord } from "../../foundations/types";

const MODULE_ID = "places";
const L = (en: string, it: string): Bilingual => ({ en, it });

const LOCF = "a1-family-location-action";
const DIR = "a1-family-direction-action";
const ROUTE = "a1-family-route-action";
const TRANS = "a1-family-transport-action";

const WATASHI = "a1-value-watashi";
const SELF = "a1-referent-self";

const dest = (subject: string, predicate: string, location: string) => ({ subject, predicate, location });
const route = (subject: string, predicate: string, source: string, goal: string) => ({ subject, predicate, source, goal });
const via = (subject: string, predicate: string, transport: string, location: string) => ({ subject, predicate, transport, location });

// ---------------------------------------------------------------------------
// Lesson places-1 — destination に vs direction へ
// ---------------------------------------------------------------------------

const lesson1: A1BuiltLesson = buildA1InstructionalLesson({
  id: "places-1",
  moduleId: MODULE_ID,
  order: 1,
  primaryCanDoId: "a1-can-do-places",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_LOCATION_PARTICLE, A1_CONCEPT_DIRECTION_HE],
  introducedSenseIds: ["a1-sense-go", "a1-sense-come", "a1-sense-live"],
  models: [
    { id: "places-1-m1", family: LOCF, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: dest(WATASHI, "a1-value-go", "a1-value-loc-shop"), translation: L("I go to the shop.", "Vado al negozio.") },
    { id: "places-1-m2", family: DIR, context: "a1-context-station", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: dest("a1-value-yuki", "a1-value-go", "a1-value-loc-airport"), translation: L("Yuki goes toward the airport.", "Yuki va verso l'aeroporto.") },
    { id: "places-1-m3", family: LOCF, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: dest(WATASHI, "a1-value-come", "a1-value-loc-bank"), translation: L("I come to the bank.", "Vengo in banca.") },
    { id: "places-1-m4", family: DIR, context: "a1-context-town", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: dest("a1-value-ken", "a1-value-come", "a1-value-loc-hospital"), translation: L("Ken comes toward the hospital.", "Ken viene verso l'ospedale.") },
    { id: "places-1-m5", family: DIR, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: dest(WATASHI, "a1-value-go", "a1-value-loc-school"), translation: L("I go toward school.", "Vado verso la scuola.") },
    { id: "places-1-m6", family: LOCF, context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: dest("a1-value-mina", "a1-value-come", "a1-value-loc-school"), translation: L("Mina comes to school.", "Mina viene a scuola.") },
    { id: "places-1-m7", family: LOCF, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: dest(WATASHI, "a1-value-live", "a1-value-loc-tokyo"), translation: L("I live in Tokyo.", "Vivo a Tokyo.") },
    { id: "places-1-m8", family: LOCF, context: "a1-context-town", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: dest("a1-value-yuki", "a1-value-live", "a1-value-loc-osaka"), translation: L("Yuki lives in Osaka.", "Yuki vive a Osaka.") },
  ],
  transfers: [
    { id: "places-1-t1", family: DIR, context: "a1-context-town", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: dest("a1-value-ken", "a1-value-go", "a1-value-loc-shop"), translation: L("Ken goes toward the shop.", "Ken va verso il negozio.") },
    { id: "places-1-t2", family: DIR, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: dest(WATASHI, "a1-value-come", "a1-value-loc-bank"), translation: L("I come toward the bank.", "Vengo verso la banca.") },
    { id: "places-1-t3", family: LOCF, context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: dest("a1-value-mina", "a1-value-go", "a1-value-loc-school"), translation: L("Mina goes to school.", "Mina va a scuola.") },
    { id: "places-1-t4", family: LOCF, context: "a1-context-town", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: dest("a1-value-ken", "a1-value-live", "a1-value-loc-tokyo"), translation: L("Ken lives in Tokyo.", "Ken vive a Tokyo.") },
    { id: "places-1-t5", family: DIR, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: dest(WATASHI, "a1-value-come", "a1-value-loc-school"), translation: L("I come toward school.", "Vengo verso la scuola.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson places-2 — transport で vs action-place で
// ---------------------------------------------------------------------------

const lesson2: A1BuiltLesson = buildA1InstructionalLesson({
  id: "places-2",
  moduleId: MODULE_ID,
  order: 2,
  primaryCanDoId: "a1-can-do-places",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_TRANSPORT_DE, A1_CONCEPT_LOCATION_PARTICLE],
  introducedSenseIds: ["a1-sense-go", "a1-sense-come", "a1-sense-work"],
  models: [
    { id: "places-2-m1", family: TRANS, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-go", "a1-value-transport-tram", "a1-value-loc-station"), translation: L("I go to the station by tram.", "Vado alla stazione in tram.") },
    { id: "places-2-m2", family: TRANS, context: "a1-context-town", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: via("a1-value-yuki", "a1-value-go", "a1-value-transport-ferry", "a1-value-loc-school"), translation: L("Yuki goes to school by ferry.", "Yuki va a scuola in traghetto.") },
    { id: "places-2-m3", family: TRANS, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-come", "a1-value-transport-train", "a1-value-loc-school"), translation: L("I come to school by train.", "Vengo a scuola in treno.") },
    { id: "places-2-m4", family: TRANS, context: "a1-context-station", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: via("a1-value-ken", "a1-value-come", "a1-value-transport-car", "a1-value-loc-station"), translation: L("Ken comes to the station by car.", "Ken viene alla stazione in auto.") },
    { id: "places-2-m5", family: LOCF, context: "a1-context-workplace", subjectReferent: SELF, subjectRealization: "omitted", slots: dest(WATASHI, "a1-value-work", "a1-value-loc-company"), translation: L("I work at the company.", "Lavoro in azienda.") },
    { id: "places-2-m6", family: LOCF, context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: dest("a1-value-mina", "a1-value-work", "a1-value-loc-restaurant"), translation: L("Mina works at the restaurant.", "Mina lavora al ristorante.") },
    { id: "places-2-m7", family: TRANS, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-go", "a1-value-transport-scooter", "a1-value-loc-school"), translation: L("I go to school by scooter.", "Vado a scuola in scooter.") },
    { id: "places-2-m8", family: DIR, context: "a1-context-town", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: dest("a1-value-yuki", "a1-value-go", "a1-value-loc-school"), translation: L("Yuki goes toward school.", "Yuki va verso la scuola.") },
  ],
  transfers: [
    { id: "places-2-t1", family: TRANS, context: "a1-context-station", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: via("a1-value-ken", "a1-value-go", "a1-value-transport-train", "a1-value-loc-station"), translation: L("Ken goes to the station by train.", "Ken va alla stazione in treno.") },
    { id: "places-2-t2", family: TRANS, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-come", "a1-value-transport-ferry", "a1-value-loc-school"), translation: L("I come to school by ferry.", "Vengo a scuola in traghetto.") },
    { id: "places-2-t3", family: LOCF, context: "a1-context-workplace", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: dest("a1-value-mina", "a1-value-work", "a1-value-loc-company"), translation: L("Mina works at the company.", "Mina lavora in azienda.") },
    { id: "places-2-t4", family: TRANS, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-go", "a1-value-transport-car", "a1-value-loc-station"), translation: L("I go to the station by car.", "Vado alla stazione in auto.") },
    { id: "places-2-t5", family: LOCF, context: "a1-context-workplace", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: dest("a1-value-yuki", "a1-value-work", "a1-value-loc-restaurant"), translation: L("Yuki works at the restaurant.", "Yuki lavora al ristorante.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson places-3 — departure から and limit まで on a route
// ---------------------------------------------------------------------------

const lesson3: A1BuiltLesson = buildA1InstructionalLesson({
  id: "places-3",
  moduleId: MODULE_ID,
  order: 3,
  primaryCanDoId: "a1-can-do-places",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_SOURCE_LIMIT, A1_CONCEPT_LOCATION_PARTICLE],
  introducedSenseIds: ["a1-sense-go", "a1-sense-come", "a1-sense-live"],
  models: [
    { id: "places-3-m1", family: ROUTE, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: route(WATASHI, "a1-value-go", "a1-value-loc-tokyo", "a1-value-loc-osaka"), translation: L("I go from Tokyo to Osaka.", "Vado da Tokyo a Osaka.") },
    { id: "places-3-m2", family: ROUTE, context: "a1-context-station", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: route("a1-value-yuki", "a1-value-go", "a1-value-loc-osaka", "a1-value-loc-kyoto"), translation: L("Yuki goes from Osaka to Kyoto.", "Yuki va da Osaka a Kyoto.") },
    { id: "places-3-m3", family: ROUTE, context: "a1-context-home", subjectReferent: SELF, subjectRealization: "omitted", slots: route(WATASHI, "a1-value-come", "a1-value-loc-home", "a1-value-loc-station"), translation: L("I come from home to the station.", "Vengo da casa alla stazione.") },
    { id: "places-3-m4", family: ROUTE, context: "a1-context-station", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: route("a1-value-ken", "a1-value-go", "a1-value-loc-hotel", "a1-value-loc-town"), translation: L("Ken goes from the hotel into town.", "Ken va dall'hotel in città.") },
    { id: "places-3-m5", family: ROUTE, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: route(WATASHI, "a1-value-come", "a1-value-loc-near-station", "a1-value-loc-school"), translation: L("I come to school from near the station.", "Vengo dalla zona vicino alla stazione fino alla scuola.") },
    { id: "places-3-m6", family: ROUTE, context: "a1-context-town", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: route("a1-value-mina", "a1-value-go", "a1-value-loc-home", "a1-value-loc-company"), translation: L("Mina goes from home to the company.", "Mina va da casa all'azienda.") },
    { id: "places-3-m7", family: LOCF, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: dest(WATASHI, "a1-value-live", "a1-value-loc-tokyo"), translation: L("I live in Tokyo.", "Vivo a Tokyo.") },
    { id: "places-3-m8", family: LOCF, context: "a1-context-town", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: dest("a1-value-yuki", "a1-value-live", "a1-value-loc-osaka"), translation: L("Yuki lives in Osaka.", "Yuki vive a Osaka.") },
  ],
  transfers: [
    { id: "places-3-t1", family: ROUTE, context: "a1-context-station", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: route("a1-value-ken", "a1-value-go", "a1-value-loc-tokyo", "a1-value-loc-osaka"), translation: L("Ken goes from Tokyo to Osaka.", "Ken va da Tokyo a Osaka.") },
    { id: "places-3-t2", family: ROUTE, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: route(WATASHI, "a1-value-go", "a1-value-loc-osaka", "a1-value-loc-kyoto"), translation: L("I go from Osaka to Kyoto.", "Vado da Osaka a Kyoto.") },
    { id: "places-3-t3", family: ROUTE, context: "a1-context-home", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: route("a1-value-mina", "a1-value-come", "a1-value-loc-home", "a1-value-loc-station"), translation: L("Mina comes from home to the station.", "Mina viene da casa alla stazione.") },
    { id: "places-3-t4", family: LOCF, context: "a1-context-town", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: dest("a1-value-ken", "a1-value-live", "a1-value-loc-tokyo"), translation: L("Ken lives in Tokyo.", "Ken vive a Tokyo.") },
    { id: "places-3-t5", family: ROUTE, context: "a1-context-town", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: route("a1-value-yuki", "a1-value-come", "a1-value-loc-station", "a1-value-loc-school"), translation: L("Yuki comes from the station to school.", "Yuki viene dalla stazione alla scuola.") },
  ],
});

// ---------------------------------------------------------------------------
// Lesson places-4 — synthesis: routes, destinations, transport, action places
// ---------------------------------------------------------------------------

const lesson4: A1BuiltLesson = buildA1InstructionalLesson({
  id: "places-4",
  moduleId: MODULE_ID,
  order: 4,
  primaryCanDoId: "a1-can-do-places",
  supportingCanDoIds: ["a1-can-do-daily-life"],
  introducedConceptIds: [A1_CONCEPT_TOPIC_WA, A1_CONCEPT_LOCATION_PARTICLE, A1_CONCEPT_DIRECTION_HE, A1_CONCEPT_TRANSPORT_DE, A1_CONCEPT_SOURCE_LIMIT],
  introducedSenseIds: ["a1-sense-go", "a1-sense-come", "a1-sense-work"],
  models: [
    { id: "places-4-m1", family: TRANS, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-go", "a1-value-transport-airplane", "a1-value-loc-osaka"), translation: L("I go to Osaka by plane.", "Vado a Osaka in aereo.") },
    { id: "places-4-m2", family: TRANS, context: "a1-context-town", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: via("a1-value-yuki", "a1-value-go", "a1-value-transport-subway", "a1-value-loc-school"), translation: L("Yuki goes to school by subway.", "Yuki va a scuola in metropolitana.") },
    { id: "places-4-m3", family: ROUTE, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: route(WATASHI, "a1-value-go", "a1-value-loc-home", "a1-value-loc-company"), translation: L("I go from home to the company.", "Vado da casa all'azienda.") },
    { id: "places-4-m4", family: TRANS, context: "a1-context-station", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: via("a1-value-ken", "a1-value-come", "a1-value-transport-taxi", "a1-value-loc-station"), translation: L("Ken comes to the station by taxi.", "Ken viene alla stazione in taxi.") },
    { id: "places-4-m5", family: LOCF, context: "a1-context-workplace", subjectReferent: SELF, subjectRealization: "omitted", slots: dest(WATASHI, "a1-value-work", "a1-value-loc-company"), translation: L("I work at the company.", "Lavoro in azienda.") },
    { id: "places-4-m6", family: TRANS, context: "a1-context-town", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: via("a1-value-mina", "a1-value-go", "a1-value-transport-bicycle", "a1-value-loc-school"), translation: L("Mina goes to school by bicycle.", "Mina va a scuola in bicicletta.") },
    { id: "places-4-m7", family: TRANS, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-come", "a1-value-transport-ship", "a1-value-loc-osaka"), translation: L("I come to Osaka by ship.", "Vengo a Osaka in nave.") },
    { id: "places-4-m8", family: LOCF, context: "a1-context-workplace", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: dest("a1-value-yuki", "a1-value-work", "a1-value-loc-restaurant"), translation: L("Yuki works at the restaurant.", "Yuki lavora al ristorante.") },
  ],
  transfers: [
    { id: "places-4-t1", family: LOCF, context: "a1-context-station", subjectReferent: "a1-referent-ken", subjectRealization: "explicit", slots: dest("a1-value-ken", "a1-value-go", "a1-value-loc-station"), translation: L("Ken goes to the station.", "Ken va alla stazione.") },
    { id: "places-4-t2", family: TRANS, context: "a1-context-town", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-go", "a1-value-transport-subway", "a1-value-loc-school"), translation: L("I go to school by subway.", "Vado a scuola in metropolitana.") },
    { id: "places-4-t3", family: ROUTE, context: "a1-context-town", subjectReferent: "a1-referent-mina", subjectRealization: "explicit", slots: route("a1-value-mina", "a1-value-go", "a1-value-loc-home", "a1-value-loc-company"), translation: L("Mina goes from home to the company.", "Mina va da casa all'azienda.") },
    { id: "places-4-t4", family: TRANS, context: "a1-context-station", subjectReferent: SELF, subjectRealization: "omitted", slots: via(WATASHI, "a1-value-come", "a1-value-transport-taxi", "a1-value-loc-station"), translation: L("I come to the station by taxi.", "Vengo alla stazione in taxi.") },
    { id: "places-4-t5", family: LOCF, context: "a1-context-workplace", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit", slots: dest("a1-value-yuki", "a1-value-work", "a1-value-loc-company"), translation: L("Yuki works at the company.", "Yuki lavora in azienda.") },
  ],
});

// ---------------------------------------------------------------------------
// Module recipe and aggregates. Module 7 introduces no new senses; the reuse
// timeline of go / come / work / live is authored in `recurrence.ts`.
// ---------------------------------------------------------------------------

export const module7Lessons: readonly A1BuiltLesson[] = [lesson1, lesson2, lesson3, lesson4];

export const module7Recipe: A1ModuleRecipe = defineA1Module({
  id: MODULE_ID,
  order: A1_MODULE_MANIFEST[MODULE_ID].order,
  prerequisiteIds: [...A1_MODULE_MANIFEST[MODULE_ID].prerequisiteIds],
  lessonIds: [...A1_MODULE_MANIFEST[MODULE_ID].lessonIds],
  outcomeCopyId: A1_MODULE_MANIFEST[MODULE_ID].outcomeCopyId,
});

export const module7VerbUseRecords: readonly VerbUseRecord[] = [];
