import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import type { BaseLexeme, BaseVerbLexeme } from "./types";

function dictionaryToken(
  id: string,
  kana: string,
  romaji: string,
): readonly AssembledToken[] {
  return deepFreeze([
    {
      id: `${id}-dictionary`,
      jp: kana,
      romaji,
      kind: "lexical",
      boundaryBefore: "space",
      source: { domain: "catalog", referenceId: id },
    },
  ]);
}

function verb(
  id: string,
  kana: string,
  romaji: string,
  verbClass: BaseVerbLexeme["verbClass"],
  aspect: BaseVerbLexeme["aspect"],
  firstTeachLessonId: string,
): BaseVerbLexeme {
  return {
    id,
    kana,
    romaji,
    meaningCopyId: `${id}-meaning`,
    firstTeachLessonId,
    countable: true,
    category: "verb",
    verbClass,
    aspect,
    dictionaryTokens: dictionaryToken(id, kana, romaji),
  };
}

export const BASE_LEXICON: readonly BaseLexeme[] = deepFreeze([
  verb("verb-kaku", "かく", "kaku", "godan", "dynamic", "polite-verbs-1"),
  verb("verb-oyogu", "およぐ", "oyogu", "godan", "dynamic", "polite-verbs-1"),
  verb("verb-hanasu", "はなす", "hanasu", "godan", "dynamic", "polite-verbs-1"),
  verb("verb-matsu", "まつ", "matsu", "godan", "dynamic", "polite-verbs-1"),
  verb("verb-shinu", "しぬ", "shinu", "godan", "dynamic", "polite-verbs-1"),
  verb("verb-asobu", "あそぶ", "asobu", "godan", "dynamic", "polite-verbs-1"),
  verb("verb-nomu", "のむ", "nomu", "godan", "dynamic", "polite-verbs-1"),
  verb("verb-kau", "かう", "kau", "godan", "dynamic", "polite-verbs-1"),
  verb("verb-taberu", "たべる", "taberu", "ichidan", "dynamic", "polite-verbs-2"),
  verb("verb-miru", "みる", "miru", "ichidan", "dynamic", "polite-verbs-2"),
  verb("verb-suru", "する", "suru", "suru", "dynamic", "polite-verbs-3"),
  verb("verb-kuru", "くる", "kuru", "kuru", "dynamic", "polite-verbs-3"),
  {
    ...verb("verb-iku", "いく", "iku", "godan", "dynamic", "time-movement-1"),
    teFormException: {
      stemKana: "い",
      stemRomaji: "i",
      endingKana: "って",
      endingRomaji: "tte",
    },
  },
  verb("verb-kaeru", "かえる", "kaeru", "godan", "dynamic", "time-movement-1"),
  verb("verb-aru", "ある", "aru", "godan", "stative", "existence-location-1"),
  verb("verb-iru", "いる", "iru", "ichidan", "stative", "existence-location-1"),
  {
    id: "adjective-takai",
    kana: "たかい",
    romaji: "takai",
    meaningCopyId: "adjective-takai-meaning",
    firstTeachLessonId: "copula-adjectives-1",
    countable: true,
    category: "adjective",
    adjectiveClass: "i",
  },
  {
    id: "adjective-oishii",
    kana: "おいしい",
    romaji: "oishii",
    meaningCopyId: "adjective-oishii-meaning",
    firstTeachLessonId: "copula-adjectives-1",
    countable: true,
    category: "adjective",
    adjectiveClass: "i",
  },
  {
    id: "adjective-ii",
    kana: "いい",
    romaji: "ii",
    meaningCopyId: "adjective-ii-meaning",
    firstTeachLessonId: "copula-adjectives-2",
    countable: true,
    category: "adjective",
    adjectiveClass: "i",
    iAdjectiveInflection: {
      negativeStemKana: "よ",
      negativeStemRomaji: "yo",
    },
  },
  {
    id: "adjective-shizuka",
    kana: "しずか",
    romaji: "shizuka",
    meaningCopyId: "adjective-shizuka-meaning",
    firstTeachLessonId: "copula-adjectives-3",
    countable: true,
    category: "adjective",
    adjectiveClass: "na",
  },
]);

export const BASE_LEXEME_BY_ID: ReadonlyMap<string, BaseLexeme> =
  immutableReadonlyMap(BASE_LEXICON.map((lexeme) => [lexeme.id, lexeme]));

export function baseLexemeById(id: string): BaseLexeme | undefined {
  return BASE_LEXEME_BY_ID.get(id);
}
