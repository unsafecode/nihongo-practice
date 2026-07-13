import type { ConceptId, Scenario, ScenarioSlot, SemanticRole } from "./types";

const particle = {
  o: { jp: "を", romaji: "o" },
  ni: { jp: "に", romaji: "ni" },
  de: { jp: "で", romaji: "de" },
} as const;

function slot(
  id: string,
  semanticRole: SemanticRole,
  particleValue: { jp: string; romaji: string },
  optionIds: ConceptId[],
  defaultOptionId: ConceptId | null = optionIds[0] ?? null,
  optional = false,
): ScenarioSlot {
  return { id, semanticRole, particle: particleValue, optionIds, defaultOptionId, optional };
}

export const scenarios: Scenario[] = [
  {
    id: "eat", emoji: "🍜",
    verb: { dict: "たべる", group: "ichidan", stemRomaji: "tabe" },
    slots: [
      slot("object", "object", particle.o, ["ramen", "sushi", "onigiri"]),
      slot("place", "actionPlace", particle.de, ["restaurant", "home"], "restaurant", true),
    ],
  },
  {
    id: "drink", emoji: "🍺",
    verb: { dict: "のむ", group: "godan", stemRomaji: "nomi" },
    slots: [
      slot("object", "object", particle.o, ["water", "beer", "tea"]),
      slot("place", "actionPlace", particle.de, ["bar", "home"], "bar", true),
    ],
  },
  {
    id: "buy", emoji: "🛍️",
    verb: { dict: "かう", group: "godan", stemRomaji: "kai" },
    slots: [
      slot("object", "object", particle.o, ["ticket", "souvenir", "water"]),
      slot("place", "actionPlace", particle.de, ["shop", "station"], "shop", true),
    ],
  },
  {
    id: "watch", emoji: "👀",
    verb: { dict: "みる", group: "ichidan", stemRomaji: "mi" },
    slots: [slot("object", "object", particle.o, ["movie", "map", "menu"])],
  },
  {
    id: "go", emoji: "🚉",
    verb: { dict: "いく", group: "godan", stemRomaji: "iki" },
    slots: [
      slot("destination", "destination", particle.ni, ["station", "hotel", "airport"]),
      slot("transport", "transport", particle.de, ["train", "bus", "taxi"], "train", true),
    ],
  },
  {
    id: "return", emoji: "🏠",
    verb: { dict: "かえる", group: "godan", stemRomaji: "kaeri" },
    slots: [slot("destination", "destination", particle.ni, ["home", "hotel", "japan"])],
  },
  {
    id: "board", emoji: "🚌",
    verb: { dict: "のる", group: "godan", stemRomaji: "nori" },
    slots: [slot("vehicle", "vehicleBoarded", particle.ni, ["train", "bus", "taxi"])],
  },
  {
    id: "wait", emoji: "⏳",
    verb: { dict: "まつ", group: "godan", stemRomaji: "machi" },
    slots: [slot("target", "object", particle.o, ["friend", "bus", "taxi"])],
  },
  {
    id: "meet", emoji: "🤝",
    verb: { dict: "あう", group: "godan", stemRomaji: "ai" },
    slots: [slot("person", "personTarget", particle.ni, ["friend", "teacher", "family"])],
  },
  {
    id: "do", emoji: "📞",
    verb: { dict: "する", group: "irregular", stemRomaji: "shi" },
    slots: [slot("activity", "object", particle.o, ["reservation", "shopping", "phoneCall"])],
  },
  {
    id: "come", emoji: "🎉",
    verb: { dict: "くる", group: "irregular", stemRomaji: "ki" },
    slots: [slot("destination", "destination", particle.ni, ["japan", "shop", "party"])],
  },
  {
    id: "speak", emoji: "💬",
    verb: { dict: "はなす", group: "godan", stemRomaji: "hanashi" },
    slots: [slot("language", "object", particle.o, ["japaneseLanguage", "englishLanguage"])],
  },
];
