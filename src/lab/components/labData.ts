import type { SemanticRole } from "../../content/types";
import type { Form } from "../engine/conjugate";

export const FORM_IDS: Form[] = [
  "pres",
  "past",
  "neg",
  "pastneg",
  "vol",
  "des",
];

export const ROLE_CHIP: Record<
  SemanticRole,
  "obj" | "place" | "topic"
> = {
  object: "obj",
  actionPlace: "place",
  transport: "place",
  destination: "topic",
  personTarget: "topic",
  vehicleBoarded: "topic",
};
