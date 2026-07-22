/**
 * Runtime i18n copy for the A2 release (Phase 3 Task 8).
 *
 * Mirrors `../a1/runtimeCopy.ts` exactly: `data/course.ts`'s `a2CourseModules`
 * derives its structure from the frozen A2 manifest + the authored A2 Can-dos,
 * but the manifest carries no learner-visible text — only locale-independent
 * copy ids (`lesson.titleCopyId`, `module.outcomeCopyIds`,
 * `lesson.objectiveCopyIds`). This module resolves those ids into the four
 * `CourseCopy` dictionaries the runtime needs (`modules`, `lessons`,
 * `objectives`, `outcomes`), keyed exactly to the ids `data/course.ts` assigns
 * for A2 — no more, no fewer — so the i18n orphan/coverage checks stay
 * meaningful when the A1 and A2 copy are merged into one catalog.
 *
 * Module titles and one-line module outcomes are the genuinely new copy this
 * release needs (the A2 catalog authored per-lesson variant/scenario copy and
 * Can-do descriptors, but never module-level names/outcomes). The fifteen
 * short module titles and fifteen module outcomes are authored by hand below
 * in both locales; all sixty lesson titles are derived mechanically as
 * "<Module title> <position>" (never a fabricated per-lesson content claim —
 * the honest "what this lesson teaches" claim is the lesson's Can-do objective
 * descriptor, shown alongside the title). Objective descriptor text is the
 * already-authored `a2CanDoDescriptorCopy`; this reads only the specific
 * descriptor ids `data/course.ts` assigns as A2 lesson objectives.
 *
 * Every string here is alignment/practice copy only — never a certification,
 * mastery, "passed", or "fluent" claim — and contains no Japanese characters
 * (the no-Japanese-in-copy lint gate covers these keys too).
 */

import { a2CourseModules } from "../data/course";
import { A2_MODULE_IDS } from "./manifest";
import { a2CanDoDescriptorCopy } from "./catalog/canDos";
import type { LessonCopy, ModuleCopy } from "../i18n/types";

type Locale = "en" | "it";

const A2_MODULE_TITLES: Readonly<Record<Locale, Readonly<Record<string, string>>>> = {
  en: {
    "connected-conversation": "Connected Conversation",
    "plans-invitations": "Plans & Invitations",
    "experiences-narratives": "Experiences & Stories",
    "reasons-opinions": "Reasons & Opinions",
    "sequencing-ongoing": "Sequences & Ongoing Actions",
    "permission-requests": "Permission & Requests",
    "neighborhood-services": "Neighborhood & Services",
    "restaurant-problems": "At the Restaurant",
    "shopping-returns": "Shopping & Returns",
    "health-advice": "Health & Advice",
    "work-study-messages": "Work, Study & Messages",
    "travel-reservations": "Travel & Reservations",
    "relationships-events": "Relationships & Events",
    "practical-texts": "Practical Texts",
    "a2-synthesis": "Bringing It Together",
  },
  it: {
    "connected-conversation": "Conversazione fluida",
    "plans-invitations": "Programmi e inviti",
    "experiences-narratives": "Esperienze e racconti",
    "reasons-opinions": "Motivi e opinioni",
    "sequencing-ongoing": "Sequenze e azioni in corso",
    "permission-requests": "Permessi e richieste",
    "neighborhood-services": "Quartiere e servizi",
    "restaurant-problems": "Al ristorante",
    "shopping-returns": "Acquisti e resi",
    "health-advice": "Salute e consigli",
    "work-study-messages": "Lavoro, studio e messaggi",
    "travel-reservations": "Viaggi e prenotazioni",
    "relationships-events": "Relazioni ed eventi",
    "practical-texts": "Testi pratici",
    "a2-synthesis": "Mettere tutto insieme",
  },
};

const A2_MODULE_OUTCOMES: Readonly<Record<Locale, Readonly<Record<string, string>>>> = {
  en: {
    "connected-conversation":
      "Keep a short everyday conversation going with natural reactions, follow-up questions, and simply linked remarks.",
    "plans-invitations":
      "Talk about your plans, invite someone, and arrange when and where to meet.",
    "experiences-narratives":
      "Say whether you have ever done something and tell a short past experience in order.",
    "reasons-opinions":
      "Give reasons, explain a situation politely, and share a simple opinion.",
    "sequencing-ongoing":
      "Describe a sequence of actions and talk about habits and what is happening now.",
    "permission-requests":
      "Ask for and give permission, make a polite request, and say what is not allowed.",
    "neighborhood-services":
      "Ask what you can do at local places, follow simple directions, and describe a facility.",
    "restaurant-problems":
      "Order food, make a special request, and handle small problems and paying.",
    "shopping-returns":
      "Compare products, ask about price and size, and return or exchange a purchase.",
    "health-advice":
      "Describe how you feel, give and take simple advice, and manage a clinic appointment.",
    "work-study-messages":
      "Write a short message, ask someone to do something, and report on work or study.",
    "travel-reservations":
      "Make, change, and confirm a simple reservation and talk about a travel schedule.",
    "relationships-events":
      "Talk about family and friends, giving and receiving, and events and gifts.",
    "practical-texts":
      "Read a schedule, a notice, and a short message, and fill in a simple form.",
    "a2-synthesis":
      "Bring the whole level together in everyday scenarios that combine what you have practiced.",
  },
  it: {
    "connected-conversation":
      "Mantieni viva una breve conversazione quotidiana con reazioni naturali, domande di approfondimento e osservazioni collegate.",
    "plans-invitations":
      "Parla dei tuoi programmi, invita qualcuno e concorda quando e dove incontrarvi.",
    "experiences-narratives":
      "Racconta se hai mai fatto qualcosa e narra in ordine una breve esperienza passata.",
    "reasons-opinions":
      "Dai motivazioni, spiega una situazione con cortesia e condividi una semplice opinione.",
    "sequencing-ongoing":
      "Descrivi una sequenza di azioni e parla di abitudini e di ciò che sta accadendo ora.",
    "permission-requests":
      "Chiedi e concedi il permesso, fai una richiesta cortese e di' ciò che non è consentito.",
    "neighborhood-services":
      "Chiedi cosa puoi fare nei luoghi vicini, segui indicazioni semplici e descrivi un servizio.",
    "restaurant-problems":
      "Ordina cibo, fai una richiesta particolare e gestisci piccoli problemi e il pagamento.",
    "shopping-returns":
      "Confronta prodotti, chiedi prezzo e taglia e restituisci o cambia un acquisto.",
    "health-advice":
      "Descrivi come ti senti, dai e ricevi semplici consigli e gestisci un appuntamento in clinica.",
    "work-study-messages":
      "Scrivi un breve messaggio, chiedi a qualcuno di fare qualcosa e riferisci su lavoro o studio.",
    "travel-reservations":
      "Fai, modifica e conferma una semplice prenotazione e parla di un orario di viaggio.",
    "relationships-events":
      "Parla di famiglia e amici, del dare e ricevere, e di eventi e regali.",
    "practical-texts":
      "Leggi un orario, un avviso e un breve messaggio, e compila un modulo semplice.",
    "a2-synthesis":
      "Metti insieme tutto il livello in scenari quotidiani che combinano ciò che hai praticato.",
  },
};

function moduleTitle(locale: Locale, moduleId: string): string {
  const title = A2_MODULE_TITLES[locale][moduleId];
  if (!title) {
    throw new Error(`a2/runtimeCopy: no authored module title for "${moduleId}" (${locale}).`);
  }
  return title;
}

/** `CourseCopy["modules"]` — one short authored title per A2 module id. */
export function a2RuntimeModuleCopy(locale: Locale): Record<string, ModuleCopy> {
  const out: Record<string, ModuleCopy> = {};
  for (const moduleId of A2_MODULE_IDS) {
    out[moduleId] = { title: moduleTitle(locale, moduleId) };
  }
  return out;
}

/**
 * `CourseCopy["lessons"]` — one title per A2 lesson id, derived mechanically
 * as "<module title> <position in module>" (never a fabricated per-lesson
 * content claim; the honest claim is the lesson's Can-do objective).
 */
export function a2RuntimeLessonCopy(locale: Locale): Record<string, LessonCopy> {
  const out: Record<string, LessonCopy> = {};
  for (const courseModule of a2CourseModules) {
    const title = moduleTitle(locale, courseModule.id);
    courseModule.lessons.forEach((lesson, index) => {
      out[lesson.id] = { title: `${title} ${index + 1}` };
    });
  }
  return out;
}

/**
 * `CourseCopy["objectives"]` — exactly the A2 Can-do descriptor strings
 * `data/course.ts` assigns as lesson objective copy (the distinct primary
 * descriptors across the 60 lessons), never the full 59-Can-do descriptor set
 * (which would leak descriptors no A2 lesson objective references and fail the
 * orphan check). The 59-descriptor set is still available in full for the
 * Course Home Can-do summary via `a2CanDoDescriptorCopy` directly.
 */
export function a2RuntimeObjectiveCopy(locale: Locale): Record<string, string> {
  const source = a2CanDoDescriptorCopy[locale];
  const out: Record<string, string> = {};
  for (const courseModule of a2CourseModules) {
    for (const lesson of courseModule.lessons) {
      for (const copyId of lesson.objectiveCopyIds) {
        const text = source[copyId];
        if (!text) {
          throw new Error(
            `a2/runtimeCopy: no authored objective descriptor copy for "${copyId}" (${locale}).`,
          );
        }
        out[copyId] = text;
      }
    }
  }
  return out;
}

/** The A2 module-outcome copy id, matching the frozen manifest convention. */
function a2ModuleOutcomeCopyId(moduleId: string): string {
  return `a2-module-outcome-${moduleId}`;
}

/**
 * `CourseCopy["outcomes"]` — one authored module-outcome sentence per A2
 * module, keyed by the manifest's own `a2-module-outcome-<moduleId>` id.
 */
export function a2RuntimeOutcomeCopy(locale: Locale): Record<string, string> {
  const source = A2_MODULE_OUTCOMES[locale];
  const out: Record<string, string> = {};
  for (const moduleId of A2_MODULE_IDS) {
    const text = source[moduleId];
    if (!text) {
      throw new Error(`a2/runtimeCopy: no authored module outcome for "${moduleId}" (${locale}).`);
    }
    out[a2ModuleOutcomeCopyId(moduleId)] = text;
  }
  return out;
}
