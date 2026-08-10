import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import type { BaseLexeme, BaseVerbLexeme } from "./types";

const DYNAMIC_TE_CONSTRUCTIONS: readonly BaseVerbLexeme["allowedTeConstructions"][number][] =
  deepFreeze(["te", "request", "sequence", "te-imasu"]);
const EXISTENTIAL_TE_CONSTRUCTIONS: readonly BaseVerbLexeme["allowedTeConstructions"][number][] =
  deepFreeze(["te", "sequence"]);

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
      boundaryBefore: "attach",
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
  allowedTeConstructions: BaseVerbLexeme["allowedTeConstructions"],
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
    allowedTeConstructions,
    dictionaryTokens: dictionaryToken(id, kana, romaji),
  };
}

export const BASE_LEXICON: readonly BaseLexeme[] = deepFreeze([
  verb("verb-kaku", "かく", "kaku", "godan", "dynamic", "polite-verbs-1", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-oyogu", "およぐ", "oyogu", "godan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-hanasu", "はなす", "hanasu", "godan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-matsu", "まつ", "matsu", "godan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-shinu", "しぬ", "shinu", "godan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-asobu", "あそぶ", "asobu", "godan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-nomu", "のむ", "nomu", "godan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-kau", "かう", "kau", "godan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-yomu", "よむ", "yomu", "godan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb(
    "verb-hataraku",
    "はたらく",
    "hataraku",
    "godan",
    "dynamic",
    "polite-verbs-2",
    DYNAMIC_TE_CONSTRUCTIONS,
  ),
  verb("verb-taberu", "たべる", "taberu", "ichidan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-miru", "みる", "miru", "ichidan", "dynamic", "polite-verbs-2", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-suru", "する", "suru", "suru", "dynamic", "polite-verbs-3", DYNAMIC_TE_CONSTRUCTIONS),
  verb("verb-kuru", "くる", "kuru", "kuru", "dynamic", "polite-verbs-3", DYNAMIC_TE_CONSTRUCTIONS),
  verb(
    "verb-benkyou-suru",
    "べんきょうする",
    "benkyou suru",
    "suru",
    "dynamic",
    "polite-verbs-3",
    DYNAMIC_TE_CONSTRUCTIONS,
  ),
  verb(
    "verb-motte-kuru",
    "もってくる",
    "motte kuru",
    "kuru",
    "dynamic",
    "polite-verbs-3",
    DYNAMIC_TE_CONSTRUCTIONS,
  ),
  {
    ...verb(
      "verb-iku",
      "いく",
      "iku",
      "godan",
      "dynamic",
      "time-movement-1",
      DYNAMIC_TE_CONSTRUCTIONS,
    ),
    teFormException: {
      stemKana: "い",
      stemRomaji: "i",
      endingKana: "って",
      endingRomaji: "tte",
    },
  },
  verb(
    "verb-kaeru",
    "かえる",
    "kaeru",
    "godan",
    "dynamic",
    "time-movement-1",
    DYNAMIC_TE_CONSTRUCTIONS,
  ),
  verb(
    "verb-aru",
    "ある",
    "aru",
    "godan",
    "stative",
    "existence-location-1",
    EXISTENTIAL_TE_CONSTRUCTIONS,
  ),
  verb(
    "verb-iru",
    "いる",
    "iru",
    "ichidan",
    "stative",
    "existence-location-1",
    EXISTENTIAL_TE_CONSTRUCTIONS,
  ),
  {
    id: "adjective-takai",
    kana: "たかい",
    romaji: "takai",
    meaningCopyId: "adjective-takai-meaning",
    firstTeachLessonId: "copula-adjectives-3",
    countable: true,
    category: "adjective",
    adjectiveClass: "i",
  },
  {
    id: "adjective-oishii",
    kana: "おいしい",
    romaji: "oishii",
    meaningCopyId: "adjective-oishii-meaning",
    firstTeachLessonId: "copula-adjectives-3",
    countable: true,
    category: "adjective",
    adjectiveClass: "i",
  },
  {
    id: "adjective-ii",
    kana: "いい",
    romaji: "ii",
    meaningCopyId: "adjective-ii-meaning",
    firstTeachLessonId: "copula-adjectives-3",
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
    firstTeachLessonId: "copula-adjectives-4",
    countable: true,
    category: "adjective",
    adjectiveClass: "na",
  },
  {
    id: "adjective-kirei",
    kana: "きれい",
    romaji: "kirei",
    meaningCopyId: "adjective-kirei-meaning",
    firstTeachLessonId: "copula-adjectives-4",
    countable: true,
    category: "adjective",
    adjectiveClass: "na",
  },
  {
    id: "adjective-yuumei",
    kana: "ゆうめい",
    romaji: "yuumei",
    meaningCopyId: "adjective-yuumei-meaning",
    firstTeachLessonId: "copula-adjectives-4",
    countable: true,
    category: "adjective",
    adjectiveClass: "na",
  },
  {
    id: "adjective-kirai",
    kana: "きらい",
    romaji: "kirai",
    meaningCopyId: "adjective-kirai-meaning",
    firstTeachLessonId: "copula-adjectives-4",
    countable: true,
    category: "adjective",
    adjectiveClass: "na",
  },
  {
    id: "noun-gakusei",
    kana: "がくせい",
    romaji: "gakusei",
    meaningCopyId: "noun-gakusei-meaning",
    firstTeachLessonId: "sentence-foundations-1",
    countable: true,
    category: "noun",
  },
  {
    id: "noun-sensei",
    kana: "せんせい",
    romaji: "sensei",
    meaningCopyId: "noun-sensei-meaning",
    firstTeachLessonId: "sentence-foundations-1",
    countable: true,
    category: "noun",
  },
]);

export const BASE_LEXEME_BY_ID: ReadonlyMap<string, BaseLexeme> =
  immutableReadonlyMap(BASE_LEXICON.map((lexeme) => [lexeme.id, lexeme]));

export function baseLexemeById(id: string): BaseLexeme | undefined {
  return BASE_LEXEME_BY_ID.get(id);
}
