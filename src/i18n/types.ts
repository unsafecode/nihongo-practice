import type {
  ConceptId,
  ScenarioId,
  SemanticRole,
  TimeId,
} from "../content/types";
import type { Form } from "../lab/engine/conjugate";
import type { Locale } from "./LocaleContext";

export interface PredicateForms {
  current: string;
  habitual: string;
  future: string;
  past: string;
  currentNegative: string;
  habitualNegative: string;
  futureNegative: string;
  pastNegative: string;
  suggestion: string;
  desire: string;
}

export interface LocalizedConcept {
  label: string;
  realizations: Partial<Record<SemanticRole, string>>;
}

export interface SlotCopy {
  prompt: string;
  grammar: string;
}

export interface ScenarioCopy {
  title: string;
  slots: Record<string, SlotCopy>;
  predicate: PredicateForms;
  predicateByOption?: Partial<Record<ConceptId, PredicateForms>>;
}

export interface UiMessages {
  documentTitle: string;
  brand: {
    title: string;
    subtitle: string;
  };
  nav: {
    modes: string;
    syllabary: string;
    phrasebook: string;
    laboratory: string;
    primary: string;
    course: string;
    practice: string;
  };
  settings: {
    menu: string;
    language: string;
    writing: string;
    reference: string;
    unavailable: string;
    close: string;
  };
  common: {
    listen: string;
    slow: string;
    playing: string;
    none: string;
    optional: string;
    phrases: string;
  };
  lab: {
    scenario: string;
    board: string;
    verb: string;
    verbForm: string;
    when: string;
    rule: string;
    base: string;
    ending: string;
    particles: string;
    endings: string;
    natural: string;
    contextual: string;
    incompatible: string;
  };
  speech: {
    unsupportedTitle: string;
    unsupported: string;
    missingVoiceTitle: string;
    missingVoice: string;
    failedTitle: string;
    failed: string;
  };
  syllabary: {
    title: string;
    base: string;
    voiced: string;
    combinations: string;
    notes: string;
    groupNavLabel: string;
    groups: {
      gojuon: string;
      dakuten: string;
      yoon: string;
      "special-notes": string;
    };
    backToLesson: string;
    invalidGroupTitle: string;
    invalidGroup: string;
    invalidReturnTitle: string;
    invalidReturn: string;
    targetAnnounce: (groupName: string) => string;
  };
  phrasebook: {
    categoriesLabel: string;
  };
  footer: string;
}

export interface LocalePack {
  locale: Locale;
  ui: UiMessages;
  forms: Record<Form, { label: string; grammar: string }>;
  times: Record<TimeId, string>;
  concepts: Record<ConceptId, LocalizedConcept>;
  scenarios: Record<ScenarioId, ScenarioCopy>;
}
