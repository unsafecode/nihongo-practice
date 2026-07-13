import { describe, expect, it } from "vitest";
import type { LabSelection, ScenarioId } from "../../content/types";
import { realizeSentence } from "./realize";

const defaults: Record<ScenarioId, LabSelection["options"]> = {
  eat: { object: "ramen", place: "restaurant" },
  drink: { object: "water", place: "bar" },
  buy: { object: "ticket", place: "station" },
  watch: { object: "movie" },
  go: { destination: "station", transport: "train" },
  return: { destination: "home" },
  board: { vehicle: "train" },
  wait: { target: "friend" },
  meet: { person: "friend" },
  do: { activity: "reservation" },
  come: { destination: "japan" },
  speak: { language: "japaneseLanguage" },
};

const expected = {
  eat: ["Oggi mangio il ramen al ristorante.", "Today, I'm eating ramen at the restaurant."],
  drink: ["Oggi bevo dell'acqua al bar.", "Today, I'm drinking water at the bar."],
  buy: ["Oggi compro un biglietto in stazione.", "Today, I'm buying a ticket at the station."],
  watch: ["Oggi guardo un film.", "Today, I'm watching a movie."],
  go: ["Oggi vado alla stazione in treno.", "Today, I'm going to the station by train."],
  return: ["Oggi torno a casa.", "Today, I'm going back home."],
  board: ["Oggi prendo il treno.", "Today, I'm taking the train."],
  wait: ["Oggi aspetto un amico.", "Today, I'm waiting for a friend."],
  meet: ["Oggi incontro un amico.", "Today, I'm meeting a friend."],
  do: ["Oggi faccio una prenotazione.", "Today, I'm making a reservation."],
  come: ["Oggi vengo in Giappone.", "Today, I'm coming to Japan."],
  speak: ["Oggi parlo giapponese.", "Today, I'm speaking Japanese."],
} as const;

describe("golden bilingual realizations", () => {
  (Object.keys(expected) as ScenarioId[]).forEach((scenarioId) => {
    it(scenarioId, () => {
      const selection: LabSelection = {
        scenarioId,
        form: "pres",
        timeId: "today",
        options: defaults[scenarioId],
      };
      expect(realizeSentence(selection, "it")).toBe(expected[scenarioId][0]);
      expect(realizeSentence(selection, "en")).toBe(expected[scenarioId][1]);
    });
  });
});

describe("time and form selection", () => {
  const base: LabSelection = {
    scenarioId: "eat",
    form: "pres",
    timeId: "tomorrow",
    options: { object: "sushi", place: null },
  };

  it("uses future for a future adverb", () => {
    expect(realizeSentence(base, "it")).toBe("Domani mangerò il sushi.");
    expect(realizeSentence(base, "en")).toBe("Tomorrow, I'll eat sushi.");
  });

  it("uses habitual forms with every day", () => {
    const habitual = { ...base, timeId: "everyDay" as const };
    expect(realizeSentence(habitual, "it")).toBe("Ogni giorno mangio il sushi.");
    expect(realizeSentence(habitual, "en")).toBe("Every day, I eat sushi.");
  });

  it("uses future for tonight", () => {
    const tonight = { ...base, timeId: "tonight" as const };
    expect(realizeSentence(tonight, "it")).toBe("Stasera mangerò il sushi.");
    expect(realizeSentence(tonight, "en")).toBe("Tonight, I'll eat sushi.");
  });

  it("uses habitual negative every day", () => {
    const habitualNeg = { ...base, form: "neg" as const, timeId: "everyDay" as const };
    expect(realizeSentence(habitualNeg, "it")).toBe("Ogni giorno non mangio il sushi.");
    expect(realizeSentence(habitualNeg, "en")).toBe("Every day, I don't eat sushi.");
  });

  it("uses past forms", () => {
    const past = { ...base, form: "past" as const, timeId: "yesterday" as const };
    expect(realizeSentence(past, "it")).toBe("Ieri ho mangiato il sushi.");
    expect(realizeSentence(past, "en")).toBe("Yesterday, I ate sushi.");
  });

  it("uses present, future, and past negative forms", () => {
    const current = { ...base, form: "neg" as const, timeId: "today" as const };
    expect(realizeSentence(current, "it")).toBe("Oggi non mangio il sushi.");
    expect(realizeSentence(current, "en")).toBe("Today, I'm not eating sushi.");

    const future = { ...current, timeId: "tomorrow" as const };
    expect(realizeSentence(future, "it")).toBe("Domani non mangerò il sushi.");
    expect(realizeSentence(future, "en")).toBe("Tomorrow, I won't eat sushi.");

    const past = {
      ...base,
      form: "pastneg" as const,
      timeId: "yesterday" as const,
    };
    expect(realizeSentence(past, "it")).toBe(
      "Ieri non ho mangiato il sushi.",
    );
    expect(realizeSentence(past, "en")).toBe(
      "Yesterday, I didn't eat sushi.",
    );
  });

  it("uses option-specific collocations", () => {
    const shopping: LabSelection = {
      scenarioId: "do",
      form: "pres",
      timeId: "today",
      options: { activity: "shopping" },
    };
    expect(realizeSentence(shopping, "it")).toBe("Oggi faccio acquisti.");
    expect(realizeSentence(shopping, "en")).toBe("Today, I'm doing some shopping.");

    const map: LabSelection = {
      scenarioId: "watch",
      form: "pres",
      timeId: "today",
      options: { object: "map" },
    };
    expect(realizeSentence(map, "it")).toBe("Oggi consulto la mappa.");
    expect(realizeSentence(map, "en")).toBe("Today, I'm looking at the map.");
  });

  it("rejects incomplete or out-of-scenario selections", () => {
    expect(() => realizeSentence({
      ...base,
      options: { object: "train", place: null },
    }, "it")).toThrow("Invalid option for object: train");
    expect(() => realizeSentence({
      ...base,
      options: { object: null, place: null },
    }, "it")).toThrow("Missing required option: object");
    expect(() => realizeSentence({
      ...base,
      options: { object: "sushi" },
    }, "it")).toThrow("Missing slot: place");
    expect(() => realizeSentence({
      ...base,
      options: { ...base.options, extra: "sushi" },
    }, "it")).toThrow("Unknown slot: extra");
  });
});
