/**
 * Human-verified inventory gate for A2 contextual words.
 *
 * This test does **not** verify that each word/reading pair is correct
 * Japanese — no machine in this pipeline can do that. Instead it records the
 * exact `word` and `wordKana` strings that a human reviewer has confirmed are
 * real Japanese words with their actual readings, and asserts that the live
 * `A2_CONTEXTUAL_WORDS` table matches this inventory exactly:
 *
 *   - Every entry in the table must appear in the inventory with identical
 *     `word` and `wordKana`.
 *   - Every entry in the inventory must still exist in the table.
 *
 * Adding, removing, or editing any `word` or `wordKana` will fail this test
 * until the inventory is updated — forcing a human to confirm the new string
 * is a real Japanese word and that `wordKana` is its actual reading before
 * signing it off here.
 *
 * The guarantee comes from a recorded human review, not from a machine that
 * can see meaning. It is only as strong as the reviewer's diligence.
 */
import { describe, expect, it } from "vitest";

import { A2_CONTEXTUAL_WORDS } from "./a2ContextualWords";

/**
 * The reviewed inventory. Each entry records the exact `word` and `wordKana`
 * that a human confirmed is a real Japanese word with that reading.
 *
 * To update: verify the word exists in a Japanese dictionary with the given
 * reading, then record it here. A reviewer who is not confident in their
 * Japanese should escalate rather than rubber-stamp.
 */
const VERIFIED_INVENTORY: ReadonlyArray<{
  readonly sense: string;
  readonly word: string;
  readonly wordKana: string;
}> = [
  { sense: "hanasu", word: "話す", wordKana: "はなす" },
  { sense: "iu", word: "言う", wordKana: "いう" },
  { sense: "kiku", word: "聞く", wordKana: "きく" },
  { sense: "tomodachi", word: "友だち", wordKana: "ともだち" },
  { sense: "omou", word: "思う", wordKana: "おもう" },
  { sense: "namae", word: "名前", wordKana: "なまえ" },
  { sense: "nani", word: "何", wordKana: "なに" },
  { sense: "yotei", word: "予定", wordKana: "よてい" },
  { sense: "youbi", word: "曜日", wordKana: "ようび" },
  { sense: "au", word: "会う", wordKana: "あう" },
  { sense: "konshuu", word: "今週", wordKana: "こんしゅう" },
  { sense: "shuumatsu", word: "週末", wordKana: "しゅうまつ" },
  { sense: "machimasu", word: "待つ", wordKana: "まつ" },
  { sense: "yakusoku", word: "約束", wordKana: "やくそく" },
  { sense: "raigetsu", word: "来月", wordKana: "らいげつ" },
  { sense: "kyonen", word: "去年", wordKana: "きょねん" },
  { sense: "tanoshii", word: "楽しい", wordKana: "たのしい" },
  { sense: "hajimete", word: "初めて", wordKana: "はじめて" },
  { sense: "ichido", word: "一度", wordKana: "いちど" },
  { sense: "yuumei", word: "有名", wordKana: "ゆうめい" },
  { sense: "oyogu", word: "泳ぐ", wordKana: "およぐ" },
  { sense: "noboru", word: "登る", wordKana: "のぼる" },
  { sense: "ryokou", word: "旅行", wordKana: "りょこう" },
  { sense: "riyuu", word: "理由", wordKana: "りゆう" },
  { sense: "kangaeru", word: "考える", wordKana: "かんがえる" },
  { sense: "iken", word: "意見", wordKana: "いけん" },
  { sense: "kimochi", word: "気持ち", wordKana: "きもち" },
  { sense: "warui", word: "悪い", wordKana: "わるい" },
  { sense: "okiru", word: "起きる", wordKana: "おきる" },
  { sense: "neru", word: "寝る", wordKana: "ねる" },
  { sense: "tsukau", word: "使う", wordKana: "つかう" },
  { sense: "tsukuru", word: "作る", wordKana: "つくる" },
  { sense: "mainichi", word: "毎日", wordKana: "まいにち" },
  { sense: "arau", word: "洗う", wordKana: "あらう" },
  { sense: "owaru", word: "終わる", wordKana: "おわる" },
  { sense: "hajimaru", word: "始まる", wordKana: "はじまる" },
  { sense: "hataraku", word: "働く", wordKana: "はたらく" },
  { sense: "hairu", word: "入る", wordKana: "はいる" },
  { sense: "iriguchi", word: "入口", wordKana: "いりぐち" },
  { sense: "deguchi", word: "出口", wordKana: "でぐち" },
  { sense: "tomaru-stop", word: "止まる", wordKana: "とまる" },
  { sense: "kinshi", word: "禁止", wordKana: "きんし" },
  { sense: "kesu", word: "消す", wordKana: "けす" },
  { sense: "suwaru", word: "座る", wordKana: "すわる" },
  { sense: "tatsu", word: "立つ", wordKana: "たつ" },
  { sense: "byouin", word: "病院", wordKana: "びょういん" },
  { sense: "ginkou", word: "銀行", wordKana: "ぎんこう" },
  { sense: "yuubinkyoku", word: "郵便局", wordKana: "ゆうびんきょく" },
  { sense: "benri", word: "便利", wordKana: "べんり" },
  { sense: "toshokan", word: "図書館", wordKana: "としょかん" },
  { sense: "taberu", word: "食べる", wordKana: "たべる" },
  { sense: "nomu", word: "飲む", wordKana: "のむ" },
  { sense: "gohan", word: "ご飯", wordKana: "ごはん" },
  { sense: "ocha", word: "お茶", wordKana: "おちゃ" },
  { sense: "niku", word: "肉", wordKana: "にく" },
  { sense: "sakana", word: "魚", wordKana: "さかな" },
  { sense: "atsui", word: "熱い", wordKana: "あつい" },
  { sense: "tsumetai", word: "冷たい", wordKana: "つめたい" },
  { sense: "kau", word: "買う", wordKana: "かう" },
  { sense: "mise", word: "店", wordKana: "みせ" },
  { sense: "senen", word: "千円", wordKana: "せんえん" },
  { sense: "ichiban", word: "一番", wordKana: "いちばん" },
  { sense: "ichiman", word: "一万", wordKana: "いちまん" },
  { sense: "yasui", word: "安い", wordKana: "やすい" },
  { sense: "takai", word: "高い", wordKana: "たかい" },
  { sense: "isha", word: "医者", wordKana: "いしゃ" },
  { sense: "kusuri", word: "薬", wordKana: "くすり" },
  { sense: "karada", word: "体", wordKana: "からだ" },
  { sense: "atama", word: "頭", wordKana: "あたま" },
  { sense: "itai", word: "痛い", wordKana: "いたい" },
  { sense: "genki", word: "元気", wordKana: "げんき" },
  { sense: "yasumu", word: "休む", wordKana: "やすむ" },
  { sense: "kaisha", word: "会社", wordKana: "かいしゃ" },
  { sense: "shigoto", word: "仕事", wordKana: "しごと" },
  { sense: "oshieru", word: "教える", wordKana: "おしえる" },
  { sense: "gakkou", word: "学校", wordKana: "がっこう" },
  { sense: "sensei", word: "先生", wordKana: "せんせい" },
  { sense: "gakusei", word: "学生", wordKana: "がくせい" },
  { sense: "kuukou", word: "空港", wordKana: "くうこう" },
  { sense: "eki", word: "駅", wordKana: "えき" },
  { sense: "densha", word: "電車", wordKana: "でんしゃ" },
  { sense: "yama", word: "山", wordKana: "やま" },
  { sense: "tsuku-arrive", word: "着く", wordKana: "つく" },
  { sense: "shuppatsu", word: "出発", wordKana: "しゅっぱつ" },
  { sense: "tomaru-stay", word: "泊まる", wordKana: "とまる" },
  { sense: "haha", word: "母", wordKana: "はは" },
  { sense: "chichi", word: "父", wordKana: "ちち" },
  { sense: "kazoku", word: "家族", wordKana: "かぞく" },
  { sense: "kekkon", word: "結婚", wordKana: "けっこん" },
  { sense: "tanjoubi", word: "誕生日", wordKana: "たんじょうび" },
  { sense: "okuru", word: "送る", wordKana: "おくる" },
  { sense: "jikan", word: "時間", wordKana: "じかん" },
  { sense: "gofun", word: "五分", wordKana: "ごふん" },
  { sense: "han", word: "半", wordKana: "はん" },
  { sense: "hon", word: "本", wordKana: "ほん" },
  { sense: "ryoukin", word: "料金", wordKana: "りょうきん" },
  { sense: "aku", word: "開く", wordKana: "あく" },
  { sense: "shimaru", word: "閉まる", wordKana: "しまる" },
];

describe("Human-verified contextual-word inventory", () => {
  it("matches the live table — every table entry is in the inventory with identical word and wordKana", () => {
    const inventoryMap = new Map(
      VERIFIED_INVENTORY.map((entry) => [entry.sense, entry]),
    );
    const mismatches = Object.entries(A2_CONTEXTUAL_WORDS)
      .filter(([sense, live]) => {
        const verified = inventoryMap.get(sense);
        return !verified || verified.word !== live.word || verified.wordKana !== live.wordKana;
      })
      .map(([sense, live]) => {
        const verified = inventoryMap.get(sense);
        if (!verified) {
          return `"${sense}" is in the live table (word="${live.word}", wordKana="${live.wordKana}") but missing from the verified inventory. A human must confirm this is a real Japanese word with that reading, then add it to VERIFIED_INVENTORY.`;
        }
        return `"${sense}" differs — live: word="${live.word}" wordKana="${live.wordKana}", inventory: word="${verified.word}" wordKana="${verified.wordKana}". A human must confirm the new word/reading is correct Japanese, then update VERIFIED_INVENTORY.`;
      });
    expect(mismatches).toEqual([]);
  });

  it("matches the live table — every inventory entry still exists in the table", () => {
    const orphans = VERIFIED_INVENTORY
      .filter((entry) => A2_CONTEXTUAL_WORDS[entry.sense] === undefined)
      .map((entry) => `"${entry.sense}" is in the verified inventory but was removed from the live table. Remove it from VERIFIED_INVENTORY to acknowledge the deletion.`);
    expect(orphans).toEqual([]);
  });

  it("has exactly 98 verified entries (forces a deliberate edit when a sense is added or removed)", () => {
    expect(VERIFIED_INVENTORY.length).toBe(98);
  });

  it("has no duplicate sense values in the inventory", () => {
    const seen = new Set<string>();
    const duplicates = VERIFIED_INVENTORY
      .filter((entry) => {
        if (seen.has(entry.sense)) return true;
        seen.add(entry.sense);
        return false;
      })
      .map((entry) => entry.sense);
    expect(duplicates).toEqual([]);
  });
});
