import type { TimeId } from "../../content/types";
import type { Form } from "./conjugate";

export type Naturalness = "natural" | "contextual" | "incompatible";

export function classifyNaturalness(
  form: Form,
  timeId: TimeId,
): Naturalness {
  if (timeId === "none") return "natural";
  if (form === "pres" || form === "neg") {
    return timeId === "yesterday" ? "incompatible" : "natural";
  }
  if (form === "past" || form === "pastneg") {
    if (timeId === "tomorrow") return "incompatible";
    if (timeId === "tonight" || timeId === "everyDay") return "contextual";
    return "natural";
  }
  if (timeId === "yesterday") return "incompatible";
  return "natural";
}
