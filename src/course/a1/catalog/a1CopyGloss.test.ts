import { describe, expect, it } from "vitest";

import {
  A1_COMPLEMENT_GLOSS,
  A1_CONTEXT_SCENARIO,
  A1_OBJECT_GLOSS,
} from "./a1CopyGloss";
import { a1Contexts } from "./a1SemanticCatalog";

describe("A1 copy glosses", () => {
  it("keeps name as an object-only gloss, not a copular complement", () => {
    expect(A1_OBJECT_GLOSS["a1-value-obj-name"]).toEqual({
      en: "a name",
      it: "un nome",
    });
    expect(A1_COMPLEMENT_GLOSS).not.toHaveProperty("a1-value-obj-name");
  });

  it.each([
    [
      "a1-context-bare-study-conversation",
      "a1-context-bare-study-conversation-label",
      "You are talking about whether someone studies, without discussing a schedule.",
      "Stai parlando del fatto che qualcuno studi, senza discutere un programma.",
    ],
    [
      "a1-context-routine-study-schedule",
      "a1-context-routine-study-schedule-label",
      "You are discussing a study schedule and when someone studies.",
      "Stai discutendo di un programma di studio e di quando qualcuno studia.",
    ],
    [
      "a1-context-rest-routine",
      "a1-context-rest-routine-label",
      "You are describing when someone takes a regular break.",
      "Descrivi quando qualcuno fa una pausa regolare.",
    ],
    [
      "a1-context-bare-return-response",
      "a1-context-bare-return-response-label",
      "You are answering whether someone returns, without giving a time or destination.",
      "Rispondi se qualcuno torna, senza indicare un orario o una destinazione.",
    ],
  ] as const)(
    "publishes bilingual canonical copy for %s",
    (contextId, labelCopyId, englishScenario, italianScenario) => {
      expect(a1Contexts.find(({ id }) => id === contextId)).toEqual({
        id: contextId,
        labelCopyId,
      });
      expect(A1_CONTEXT_SCENARIO[contextId]).toEqual({
        en: englishScenario,
        it: italianScenario,
      });
    },
  );
});
