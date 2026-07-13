import { describe, expect, it } from "vitest";
import { errorMessages } from "./errorMessages";

describe("errorMessages", () => {
  it("has complete Italian and English recovery copy", () => {
    expect(errorMessages.it).toEqual({
      title: "Qualcosa non ha funzionato",
      body: "L'app non può mostrare questa schermata. Ricarica per tornare al percorso.",
      reload: "Ricarica l'app",
    });
    expect(errorMessages.en).toEqual({
      title: "Something went wrong",
      body: "The app cannot display this screen. Reload to return to the course.",
      reload: "Reload the app",
    });
  });
});
