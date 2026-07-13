import type { Form, Verb } from "../lab/engine/conjugate";

export type ConceptId =
  | "ramen" | "sushi" | "onigiri" | "water" | "beer" | "tea"
  | "ticket" | "souvenir" | "movie" | "map" | "menu"
  | "restaurant" | "home" | "bar" | "shop" | "station"
  | "hotel" | "airport" | "japan" | "party"
  | "train" | "bus" | "taxi"
  | "friend" | "teacher" | "family"
  | "reservation" | "shopping" | "phoneCall"
  | "japaneseLanguage" | "englishLanguage";

export type ScenarioId =
  | "eat" | "drink" | "buy" | "watch" | "go" | "return"
  | "board" | "wait" | "meet" | "do" | "come" | "speak";

export type SemanticRole =
  | "object"
  | "actionPlace"
  | "destination"
  | "transport"
  | "personTarget"
  | "vehicleBoarded";

export type TimeId =
  | "today"
  | "yesterday"
  | "tomorrow"
  | "tonight"
  | "everyDay"
  | "none";

export interface JapaneseConcept {
  id: ConceptId;
  jp: string;
  romaji: string;
}

export interface ScenarioSlot {
  id: string;
  semanticRole: SemanticRole;
  particle: { jp: string; romaji: string };
  optionIds: ConceptId[];
  defaultOptionId: ConceptId | null;
  optional: boolean;
}

export interface Scenario {
  id: ScenarioId;
  emoji: string;
  verb: Verb;
  slots: ScenarioSlot[];
}

export interface TimeOption {
  id: TimeId;
  jp: string;
  romaji: string;
}

export interface LabSelection {
  scenarioId: ScenarioId;
  form: Form;
  timeId: TimeId;
  options: Record<string, ConceptId | null>;
}
