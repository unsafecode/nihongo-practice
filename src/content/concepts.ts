import type { ConceptId, JapaneseConcept } from "./types";

const rows: Array<[ConceptId, string, string]> = [
  ["ramen", "らーめん", "rāmen"],
  ["sushi", "すし", "sushi"],
  ["onigiri", "おにぎり", "onigiri"],
  ["water", "みず", "mizu"],
  ["beer", "びーる", "bīru"],
  ["tea", "おちゃ", "ocha"],
  ["ticket", "きっぷ", "kippu"],
  ["souvenir", "おみやげ", "omiyage"],
  ["movie", "えいが", "eiga"],
  ["map", "ちず", "chizu"],
  ["menu", "めにゅー", "menyū"],
  ["restaurant", "れすとらん", "resutoran"],
  ["home", "いえ", "ie"],
  ["bar", "ばー", "bā"],
  ["shop", "みせ", "mise"],
  ["station", "えき", "eki"],
  ["hotel", "ほてる", "hoteru"],
  ["airport", "くうこう", "kūkō"],
  ["japan", "にほん", "nihon"],
  ["party", "ぱーてぃー", "pātī"],
  ["train", "でんしゃ", "densha"],
  ["bus", "ばす", "basu"],
  ["taxi", "たくしー", "takushī"],
  ["friend", "ともだち", "tomodachi"],
  ["teacher", "せんせい", "sensei"],
  ["family", "かぞく", "kazoku"],
  ["reservation", "よやく", "yoyaku"],
  ["shopping", "かいもの", "kaimono"],
  ["phoneCall", "でんわ", "denwa"],
  ["japaneseLanguage", "にほんご", "nihongo"],
  ["englishLanguage", "えいご", "eigo"],
];

export const concepts = Object.fromEntries(
  rows.map(([id, jp, romaji]) => [id, { id, jp, romaji }]),
) as Record<ConceptId, JapaneseConcept>;
