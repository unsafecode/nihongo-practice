/**
 * The exact, immutable A2 contextual kanji catalog (Phase 3 Task 3, locked
 * decision L3): exactly 120 glyphs across the 14 instructional modules (the
 * `a2-synthesis` module introduces no new glyphs), each carried by a single
 * contextual lexeme and scheduled through four explicit stages —
 * `first-supported`, `supported-retrieval`, `revealable`, `assessed` — in
 * strict canonical-position order.
 *
 * `KanjiRow` is a per-glyph authoring row: every row's `stages` field is a
 * concrete, fully-populated `${moduleId}-${1..4}` lesson-id record authored
 * per row (never inferred from array position or a runtime cohort lookup).
 * {@link cohortA} and {@link cohortB} are pure literal-boilerplate helpers —
 * "first cohort" glyphs are introduced/retrieved/made-revealable/assessed
 * inside the same module's four lessons; "second cohort" glyphs run one
 * lesson behind and are assessed either at the next module's first lesson or,
 * for `practical-texts`' second cohort only, at `a2-synthesis-4` (there is no
 * "next module" lesson 1 slot free of synthesis's own zero-new-glyphs rule
 * being the natural final checkpoint instead) — both are still explicit,
 * authored values, not derived at validation/runtime.
 *
 * Two or more glyphs may share a single contextual lexeme (e.g. 名/前 both
 * appear in 名前). They always get the *same* `lexemeSenseId` but *distinct*
 * `meaningCopyId`s (glyph meaning copy is never keyed on the glyph character
 * alone when it is shared) — {@link buildCatalog} derives this automatically
 * by detecting sense-sharing pairs from the authored rows themselves.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type { ContextId, ModuleId } from "../../foundations/types";
import type {
  KanjiEntry,
  KanjiExposure,
  KanjiExposureStage,
  KanjiId,
  KanjiReading,
} from "./kanjiTypes";

interface KanjiRow {
  readonly glyph: string;
  /** This glyph's own kana reading inside its contextual lexeme. */
  readonly kana: string;
  /** This glyph's own romaji reading inside its contextual lexeme. */
  readonly romaji: string;
  /** A short romanized slug for the contextual lexeme (e.g. "hanasu"). */
  readonly sense: string;
  readonly contextId: ContextId;
  readonly stages: Readonly<Record<KanjiExposureStage, string>>;
}

/** First-cohort schedule: all four stages inside the same module's lessons. */
function cohortA(moduleId: ModuleId): Readonly<Record<KanjiExposureStage, string>> {
  return {
    "first-supported": `${moduleId}-1`,
    "supported-retrieval": `${moduleId}-2`,
    revealable: `${moduleId}-3`,
    assessed: `${moduleId}-4`,
  };
}

/**
 * Second-cohort schedule: introduced one lesson behind cohort A, assessed at
 * an explicitly-supplied lesson id (the next module's first lesson for every
 * module except `practical-texts`, whose second cohort assesses at
 * `a2-synthesis-4` instead — passed in explicitly, never inferred).
 */
function cohortB(
  moduleId: ModuleId,
  assessedLessonId: string,
): Readonly<Record<KanjiExposureStage, string>> {
  return {
    "first-supported": `${moduleId}-2`,
    "supported-retrieval": `${moduleId}-3`,
    revealable: `${moduleId}-4`,
    assessed: assessedLessonId,
  };
}

// ---------------------------------------------------------------------------
// Authoritative per-module rows (locked decision L3)
// ---------------------------------------------------------------------------

const CONNECTED_CONVERSATION_ROWS: readonly KanjiRow[] = [
  { glyph: "話", kana: "はな", romaji: "hana", sense: "hanasu", contextId: "a2-context-conversation", stages: cohortA("connected-conversation") },
  { glyph: "言", kana: "い", romaji: "i", sense: "iu", contextId: "a2-context-conversation", stages: cohortA("connected-conversation") },
  { glyph: "聞", kana: "き", romaji: "ki", sense: "kiku", contextId: "a2-context-conversation", stages: cohortA("connected-conversation") },
  { glyph: "友", kana: "とも", romaji: "tomo", sense: "tomodachi", contextId: "a2-context-conversation", stages: cohortA("connected-conversation") },
  { glyph: "思", kana: "おも", romaji: "omo", sense: "omou", contextId: "a2-context-conversation", stages: cohortB("connected-conversation", "plans-invitations-1") },
  { glyph: "名", kana: "な", romaji: "na", sense: "namae", contextId: "a2-context-conversation", stages: cohortB("connected-conversation", "plans-invitations-1") },
  { glyph: "前", kana: "まえ", romaji: "mae", sense: "namae", contextId: "a2-context-conversation", stages: cohortB("connected-conversation", "plans-invitations-1") },
  { glyph: "何", kana: "なに", romaji: "nani", sense: "nani", contextId: "a2-context-conversation", stages: cohortB("connected-conversation", "plans-invitations-1") },
];

const PLANS_INVITATIONS_ROWS: readonly KanjiRow[] = [
  { glyph: "予", kana: "よ", romaji: "yo", sense: "yotei", contextId: "a2-context-plans", stages: cohortA("plans-invitations") },
  { glyph: "定", kana: "てい", romaji: "tei", sense: "yotei", contextId: "a2-context-plans", stages: cohortA("plans-invitations") },
  { glyph: "曜", kana: "よう", romaji: "you", sense: "youbi", contextId: "a2-context-plans", stages: cohortA("plans-invitations") },
  { glyph: "会", kana: "あ", romaji: "a", sense: "au", contextId: "a2-context-plans", stages: cohortA("plans-invitations") },
  { glyph: "今", kana: "こん", romaji: "kon", sense: "konshuu", contextId: "a2-context-plans", stages: cohortA("plans-invitations") },
  { glyph: "日", kana: "び", romaji: "bi", sense: "youbi", contextId: "a2-context-plans", stages: cohortA("plans-invitations") },
  { glyph: "週", kana: "しゅう", romaji: "shuu", sense: "konshuu", contextId: "a2-context-plans", stages: cohortB("plans-invitations", "experiences-narratives-1") },
  { glyph: "末", kana: "まつ", romaji: "matsu", sense: "shuumatsu", contextId: "a2-context-plans", stages: cohortB("plans-invitations", "experiences-narratives-1") },
  { glyph: "待", kana: "ま", romaji: "ma", sense: "machimasu", contextId: "a2-context-plans", stages: cohortB("plans-invitations", "experiences-narratives-1") },
  { glyph: "約", kana: "やく", romaji: "yaku", sense: "yakusoku", contextId: "a2-context-plans", stages: cohortB("plans-invitations", "experiences-narratives-1") },
  { glyph: "来", kana: "らい", romaji: "rai", sense: "raigetsu", contextId: "a2-context-plans", stages: cohortB("plans-invitations", "experiences-narratives-1") },
  { glyph: "月", kana: "げつ", romaji: "getsu", sense: "raigetsu", contextId: "a2-context-plans", stages: cohortB("plans-invitations", "experiences-narratives-1") },
];

const EXPERIENCES_NARRATIVES_ROWS: readonly KanjiRow[] = [
  { glyph: "去", kana: "きょ", romaji: "kyo", sense: "kyonen", contextId: "a2-context-experiences", stages: cohortA("experiences-narratives") },
  { glyph: "楽", kana: "たの", romaji: "tano", sense: "tanoshii", contextId: "a2-context-experiences", stages: cohortA("experiences-narratives") },
  { glyph: "初", kana: "はじ", romaji: "haji", sense: "hajimete", contextId: "a2-context-experiences", stages: cohortA("experiences-narratives") },
  { glyph: "度", kana: "ど", romaji: "do", sense: "ichido", contextId: "a2-context-experiences", stages: cohortA("experiences-narratives") },
  { glyph: "年", kana: "ねん", romaji: "nen", sense: "kyonen", contextId: "a2-context-experiences", stages: cohortA("experiences-narratives") },
  { glyph: "有", kana: "ゆう", romaji: "yuu", sense: "yuumei", contextId: "a2-context-experiences", stages: cohortB("experiences-narratives", "reasons-opinions-1") },
  { glyph: "泳", kana: "およ", romaji: "oyo", sense: "oyogu", contextId: "a2-context-experiences", stages: cohortB("experiences-narratives", "reasons-opinions-1") },
  { glyph: "登", kana: "のぼ", romaji: "nobo", sense: "noboru", contextId: "a2-context-experiences", stages: cohortB("experiences-narratives", "reasons-opinions-1") },
  { glyph: "旅", kana: "りょ", romaji: "ryo", sense: "ryokou", contextId: "a2-context-experiences", stages: cohortB("experiences-narratives", "reasons-opinions-1") },
];

const REASONS_OPINIONS_ROWS: readonly KanjiRow[] = [
  { glyph: "理", kana: "り", romaji: "ri", sense: "riyuu", contextId: "a2-context-reasons", stages: cohortA("reasons-opinions") },
  { glyph: "由", kana: "ゆう", romaji: "yuu", sense: "riyuu", contextId: "a2-context-reasons", stages: cohortA("reasons-opinions") },
  { glyph: "考", kana: "かんが", romaji: "kanga", sense: "kangaeru", contextId: "a2-context-reasons", stages: cohortA("reasons-opinions") },
  { glyph: "意", kana: "い", romaji: "i", sense: "iken", contextId: "a2-context-reasons", stages: cohortA("reasons-opinions") },
  { glyph: "見", kana: "けん", romaji: "ken", sense: "iken", contextId: "a2-context-reasons", stages: cohortB("reasons-opinions", "sequencing-ongoing-1") },
  { glyph: "気", kana: "き", romaji: "ki", sense: "kimochi", contextId: "a2-context-reasons", stages: cohortB("reasons-opinions", "sequencing-ongoing-1") },
  { glyph: "持", kana: "も", romaji: "mo", sense: "kimochi", contextId: "a2-context-reasons", stages: cohortB("reasons-opinions", "sequencing-ongoing-1") },
  { glyph: "悪", kana: "わる", romaji: "waru", sense: "warui", contextId: "a2-context-reasons", stages: cohortB("reasons-opinions", "sequencing-ongoing-1") },
];

const SEQUENCING_ONGOING_ROWS: readonly KanjiRow[] = [
  { glyph: "起", kana: "お", romaji: "o", sense: "okiru", contextId: "a2-context-routines", stages: cohortA("sequencing-ongoing") },
  { glyph: "寝", kana: "ね", romaji: "ne", sense: "neru", contextId: "a2-context-routines", stages: cohortA("sequencing-ongoing") },
  { glyph: "使", kana: "つか", romaji: "tsuka", sense: "tsukau", contextId: "a2-context-routines", stages: cohortA("sequencing-ongoing") },
  { glyph: "作", kana: "つく", romaji: "tsuku", sense: "tsukuru", contextId: "a2-context-routines", stages: cohortA("sequencing-ongoing") },
  { glyph: "毎", kana: "まい", romaji: "mai", sense: "mainichi", contextId: "a2-context-routines", stages: cohortA("sequencing-ongoing") },
  { glyph: "洗", kana: "あら", romaji: "ara", sense: "arau", contextId: "a2-context-routines", stages: cohortB("sequencing-ongoing", "permission-requests-1") },
  { glyph: "終", kana: "お", romaji: "o", sense: "owaru", contextId: "a2-context-routines", stages: cohortB("sequencing-ongoing", "permission-requests-1") },
  { glyph: "始", kana: "はじ", romaji: "haji", sense: "hajimaru", contextId: "a2-context-routines", stages: cohortB("sequencing-ongoing", "permission-requests-1") },
  { glyph: "働", kana: "はたら", romaji: "hatara", sense: "hataraku", contextId: "a2-context-routines", stages: cohortB("sequencing-ongoing", "permission-requests-1") },
];

const PERMISSION_REQUESTS_ROWS: readonly KanjiRow[] = [
  { glyph: "入", kana: "はい", romaji: "hai", sense: "hairu", contextId: "a2-context-rules", stages: cohortA("permission-requests") },
  { glyph: "口", kana: "ぐち", romaji: "guchi", sense: "iriguchi", contextId: "a2-context-rules", stages: cohortA("permission-requests") },
  { glyph: "出", kana: "で", romaji: "de", sense: "deguchi", contextId: "a2-context-rules", stages: cohortA("permission-requests") },
  { glyph: "止", kana: "と", romaji: "to", sense: "tomaru", contextId: "a2-context-rules", stages: cohortA("permission-requests") },
  { glyph: "禁", kana: "きん", romaji: "kin", sense: "kinshi", contextId: "a2-context-rules", stages: cohortB("permission-requests", "neighborhood-services-1") },
  { glyph: "消", kana: "け", romaji: "ke", sense: "kesu", contextId: "a2-context-rules", stages: cohortB("permission-requests", "neighborhood-services-1") },
  { glyph: "座", kana: "すわ", romaji: "suwa", sense: "suwaru", contextId: "a2-context-rules", stages: cohortB("permission-requests", "neighborhood-services-1") },
  { glyph: "立", kana: "た", romaji: "ta", sense: "tatsu", contextId: "a2-context-rules", stages: cohortB("permission-requests", "neighborhood-services-1") },
];

const NEIGHBORHOOD_SERVICES_ROWS: readonly KanjiRow[] = [
  { glyph: "病", kana: "びょう", romaji: "byou", sense: "byouin", contextId: "a2-context-neighborhood", stages: cohortA("neighborhood-services") },
  { glyph: "院", kana: "いん", romaji: "in", sense: "byouin", contextId: "a2-context-neighborhood", stages: cohortA("neighborhood-services") },
  { glyph: "銀", kana: "ぎん", romaji: "gin", sense: "ginkou", contextId: "a2-context-neighborhood", stages: cohortA("neighborhood-services") },
  { glyph: "行", kana: "こう", romaji: "kou", sense: "ginkou", contextId: "a2-context-neighborhood", stages: cohortA("neighborhood-services") },
  { glyph: "局", kana: "きょく", romaji: "kyoku", sense: "yuubinkyoku", contextId: "a2-context-neighborhood", stages: cohortB("neighborhood-services", "restaurant-problems-1") },
  { glyph: "便", kana: "べん", romaji: "ben", sense: "benri", contextId: "a2-context-neighborhood", stages: cohortB("neighborhood-services", "restaurant-problems-1") },
  { glyph: "図", kana: "と", romaji: "to", sense: "toshokan", contextId: "a2-context-neighborhood", stages: cohortB("neighborhood-services", "restaurant-problems-1") },
  { glyph: "館", kana: "かん", romaji: "kan", sense: "toshokan", contextId: "a2-context-neighborhood", stages: cohortB("neighborhood-services", "restaurant-problems-1") },
];

const RESTAURANT_PROBLEMS_ROWS: readonly KanjiRow[] = [
  { glyph: "食", kana: "た", romaji: "ta", sense: "taberu", contextId: "a2-context-restaurant", stages: cohortA("restaurant-problems") },
  { glyph: "飲", kana: "の", romaji: "no", sense: "nomu", contextId: "a2-context-restaurant", stages: cohortA("restaurant-problems") },
  { glyph: "飯", kana: "はん", romaji: "han", sense: "gohan", contextId: "a2-context-restaurant", stages: cohortA("restaurant-problems") },
  { glyph: "茶", kana: "ちゃ", romaji: "cha", sense: "ocha", contextId: "a2-context-restaurant", stages: cohortA("restaurant-problems") },
  { glyph: "肉", kana: "にく", romaji: "niku", sense: "niku", contextId: "a2-context-restaurant", stages: cohortB("restaurant-problems", "shopping-returns-1") },
  { glyph: "魚", kana: "さかな", romaji: "sakana", sense: "sakana", contextId: "a2-context-restaurant", stages: cohortB("restaurant-problems", "shopping-returns-1") },
  { glyph: "熱", kana: "あつ", romaji: "atsu", sense: "atsui", contextId: "a2-context-restaurant", stages: cohortB("restaurant-problems", "shopping-returns-1") },
  { glyph: "冷", kana: "つめ", romaji: "tsume", sense: "tsumetai", contextId: "a2-context-restaurant", stages: cohortB("restaurant-problems", "shopping-returns-1") },
];

const SHOPPING_RETURNS_ROWS: readonly KanjiRow[] = [
  { glyph: "買", kana: "か", romaji: "ka", sense: "kau", contextId: "a2-context-shopping", stages: cohortA("shopping-returns") },
  { glyph: "店", kana: "みせ", romaji: "mise", sense: "mise", contextId: "a2-context-shopping", stages: cohortA("shopping-returns") },
  { glyph: "円", kana: "えん", romaji: "en", sense: "senen", contextId: "a2-context-shopping", stages: cohortA("shopping-returns") },
  { glyph: "番", kana: "ばん", romaji: "ban", sense: "ichiban", contextId: "a2-context-shopping", stages: cohortA("shopping-returns") },
  { glyph: "千", kana: "せん", romaji: "sen", sense: "senen", contextId: "a2-context-shopping", stages: cohortB("shopping-returns", "health-advice-1") },
  { glyph: "万", kana: "まん", romaji: "man", sense: "ichiman", contextId: "a2-context-shopping", stages: cohortB("shopping-returns", "health-advice-1") },
  { glyph: "安", kana: "やす", romaji: "yasu", sense: "yasui", contextId: "a2-context-shopping", stages: cohortB("shopping-returns", "health-advice-1") },
  { glyph: "高", kana: "たか", romaji: "taka", sense: "takai", contextId: "a2-context-shopping", stages: cohortB("shopping-returns", "health-advice-1") },
];

const HEALTH_ADVICE_ROWS: readonly KanjiRow[] = [
  { glyph: "医", kana: "い", romaji: "i", sense: "isha", contextId: "a2-context-health", stages: cohortA("health-advice") },
  { glyph: "者", kana: "しゃ", romaji: "sha", sense: "isha", contextId: "a2-context-health", stages: cohortA("health-advice") },
  { glyph: "薬", kana: "くすり", romaji: "kusuri", sense: "kusuri", contextId: "a2-context-health", stages: cohortA("health-advice") },
  { glyph: "体", kana: "からだ", romaji: "karada", sense: "karada", contextId: "a2-context-health", stages: cohortA("health-advice") },
  { glyph: "頭", kana: "あたま", romaji: "atama", sense: "atama", contextId: "a2-context-health", stages: cohortB("health-advice", "work-study-messages-1") },
  { glyph: "痛", kana: "いた", romaji: "ita", sense: "itai", contextId: "a2-context-health", stages: cohortB("health-advice", "work-study-messages-1") },
  { glyph: "元", kana: "げん", romaji: "gen", sense: "genki", contextId: "a2-context-health", stages: cohortB("health-advice", "work-study-messages-1") },
  { glyph: "休", kana: "やす", romaji: "yasu", sense: "yasumu", contextId: "a2-context-health", stages: cohortB("health-advice", "work-study-messages-1") },
];

const WORK_STUDY_MESSAGES_ROWS: readonly KanjiRow[] = [
  { glyph: "社", kana: "しゃ", romaji: "sha", sense: "kaisha", contextId: "a2-context-work-study", stages: cohortA("work-study-messages") },
  { glyph: "仕", kana: "し", romaji: "shi", sense: "shigoto", contextId: "a2-context-work-study", stages: cohortA("work-study-messages") },
  { glyph: "事", kana: "ごと", romaji: "goto", sense: "shigoto", contextId: "a2-context-work-study", stages: cohortA("work-study-messages") },
  { glyph: "教", kana: "おし", romaji: "oshi", sense: "oshieru", contextId: "a2-context-work-study", stages: cohortA("work-study-messages") },
  { glyph: "学", kana: "がく", romaji: "gaku", sense: "gakkou", contextId: "a2-context-work-study", stages: cohortB("work-study-messages", "travel-reservations-1") },
  { glyph: "校", kana: "こう", romaji: "kou", sense: "gakkou", contextId: "a2-context-work-study", stages: cohortB("work-study-messages", "travel-reservations-1") },
  { glyph: "先", kana: "せん", romaji: "sen", sense: "sensei", contextId: "a2-context-work-study", stages: cohortB("work-study-messages", "travel-reservations-1") },
  { glyph: "生", kana: "せい", romaji: "sei", sense: "gakusei", contextId: "a2-context-work-study", stages: cohortB("work-study-messages", "travel-reservations-1") },
];

const TRAVEL_RESERVATIONS_ROWS: readonly KanjiRow[] = [
  { glyph: "空", kana: "くう", romaji: "kuu", sense: "kuukou", contextId: "a2-context-travel", stages: cohortA("travel-reservations") },
  { glyph: "港", kana: "こう", romaji: "kou", sense: "kuukou", contextId: "a2-context-travel", stages: cohortA("travel-reservations") },
  { glyph: "駅", kana: "えき", romaji: "eki", sense: "eki", contextId: "a2-context-travel", stages: cohortA("travel-reservations") },
  { glyph: "電", kana: "でん", romaji: "den", sense: "densha", contextId: "a2-context-travel", stages: cohortA("travel-reservations") },
  { glyph: "山", kana: "やま", romaji: "yama", sense: "yama", contextId: "a2-context-travel", stages: cohortA("travel-reservations") },
  { glyph: "車", kana: "しゃ", romaji: "sha", sense: "densha", contextId: "a2-context-travel", stages: cohortB("travel-reservations", "relationships-events-1") },
  { glyph: "着", kana: "つ", romaji: "tsu", sense: "tsuku-arrive", contextId: "a2-context-travel", stages: cohortB("travel-reservations", "relationships-events-1") },
  { glyph: "発", kana: "はつ", romaji: "hatsu", sense: "shuppatsu", contextId: "a2-context-travel", stages: cohortB("travel-reservations", "relationships-events-1") },
  { glyph: "泊", kana: "と", romaji: "to", sense: "shukuhaku", contextId: "a2-context-travel", stages: cohortB("travel-reservations", "relationships-events-1") },
];

const RELATIONSHIPS_EVENTS_ROWS: readonly KanjiRow[] = [
  { glyph: "母", kana: "はは", romaji: "haha", sense: "haha", contextId: "a2-context-relationships", stages: cohortA("relationships-events") },
  { glyph: "父", kana: "ちち", romaji: "chichi", sense: "chichi", contextId: "a2-context-relationships", stages: cohortA("relationships-events") },
  { glyph: "家", kana: "か", romaji: "ka", sense: "kazoku", contextId: "a2-context-relationships", stages: cohortA("relationships-events") },
  { glyph: "族", kana: "ぞく", romaji: "zoku", sense: "kazoku", contextId: "a2-context-relationships", stages: cohortA("relationships-events") },
  { glyph: "結", kana: "けっ", romaji: "kek", sense: "kekkon", contextId: "a2-context-relationships", stages: cohortB("relationships-events", "practical-texts-1") },
  { glyph: "婚", kana: "こん", romaji: "kon", sense: "kekkon", contextId: "a2-context-relationships", stages: cohortB("relationships-events", "practical-texts-1") },
  { glyph: "誕", kana: "たん", romaji: "tan", sense: "tanjoubi", contextId: "a2-context-relationships", stages: cohortB("relationships-events", "practical-texts-1") },
  { glyph: "送", kana: "おく", romaji: "oku", sense: "okuru", contextId: "a2-context-relationships", stages: cohortB("relationships-events", "practical-texts-1") },
];

const PRACTICAL_TEXTS_ROWS: readonly KanjiRow[] = [
  { glyph: "時", kana: "じ", romaji: "ji", sense: "jikan", contextId: "a2-context-notices", stages: cohortA("practical-texts") },
  { glyph: "間", kana: "かん", romaji: "kan", sense: "jikan", contextId: "a2-context-notices", stages: cohortA("practical-texts") },
  { glyph: "分", kana: "ふん", romaji: "fun", sense: "gofun", contextId: "a2-context-notices", stages: cohortA("practical-texts") },
  { glyph: "半", kana: "はん", romaji: "han", sense: "han", contextId: "a2-context-notices", stages: cohortA("practical-texts") },
  { glyph: "本", kana: "ほん", romaji: "hon", sense: "hon", contextId: "a2-context-notices", stages: cohortA("practical-texts") },
  { glyph: "料", kana: "りょう", romaji: "ryou", sense: "ryoukin", contextId: "a2-context-notices", stages: cohortB("practical-texts", "a2-synthesis-4") },
  { glyph: "金", kana: "きん", romaji: "kin", sense: "ryoukin", contextId: "a2-context-notices", stages: cohortB("practical-texts", "a2-synthesis-4") },
  { glyph: "開", kana: "あ", romaji: "a", sense: "aku", contextId: "a2-context-notices", stages: cohortB("practical-texts", "a2-synthesis-4") },
  { glyph: "閉", kana: "し", romaji: "shi", sense: "shimaru", contextId: "a2-context-notices", stages: cohortB("practical-texts", "a2-synthesis-4") },
];

/** `a2-synthesis` (module 15) introduces no new glyphs. */
const A2_SYNTHESIS_ROWS: readonly KanjiRow[] = [];

const ALL_ROWS: readonly KanjiRow[] = [
  ...CONNECTED_CONVERSATION_ROWS,
  ...PLANS_INVITATIONS_ROWS,
  ...EXPERIENCES_NARRATIVES_ROWS,
  ...REASONS_OPINIONS_ROWS,
  ...SEQUENCING_ONGOING_ROWS,
  ...PERMISSION_REQUESTS_ROWS,
  ...NEIGHBORHOOD_SERVICES_ROWS,
  ...RESTAURANT_PROBLEMS_ROWS,
  ...SHOPPING_RETURNS_ROWS,
  ...HEALTH_ADVICE_ROWS,
  ...WORK_STUDY_MESSAGES_ROWS,
  ...TRAVEL_RESERVATIONS_ROWS,
  ...RELATIONSHIPS_EVENTS_ROWS,
  ...PRACTICAL_TEXTS_ROWS,
  ...A2_SYNTHESIS_ROWS,
];

const STAGE_ORDER: readonly KanjiExposureStage[] = [
  "first-supported",
  "supported-retrieval",
  "revealable",
  "assessed",
];

/** The module id a `${moduleId}-${1..4}` lesson id belongs to. */
function moduleIdOfLesson(lessonId: string): ModuleId {
  return lessonId.slice(0, lessonId.lastIndexOf("-"));
}

// ---------------------------------------------------------------------------
// Catalog assembly
// ---------------------------------------------------------------------------

interface BuiltCatalog {
  readonly entries: readonly KanjiEntry[];
  readonly readings: readonly KanjiReading[];
  readonly exposures: readonly KanjiExposure[];
  readonly distribution: Readonly<Record<ModuleId, number>>;
}

function buildCatalog(rows: readonly KanjiRow[]): BuiltCatalog {
  // Group rows by contextual-lexeme sense so glyphs sharing a lexeme (e.g.
  // 名/前 in 名前) get the same lexemeSenseId but never the same
  // meaningCopyId — disambiguated by each glyph's own romaji, which is always
  // distinct within a shared-lexeme pair (verified for every locked-decision
  // row; see Task 3 notes).
  const rowsBySense = new Map<string, KanjiRow[]>();
  for (const row of rows) {
    const list = rowsBySense.get(row.sense) ?? [];
    list.push(row);
    rowsBySense.set(row.sense, list);
  }

  function meaningCopyId(row: KanjiRow): string {
    const shared = rowsBySense.get(row.sense) ?? [row];
    return shared.length > 1
      ? `a2-kanji-${row.sense}-${row.romaji}-meaning`
      : `a2-kanji-${row.sense}-meaning`;
  }

  const entries: KanjiEntry[] = [];
  const readings: KanjiReading[] = [];
  const exposures: KanjiExposure[] = [];
  const distribution: Record<string, number> = {};

  for (const row of rows) {
    const kanjiId: KanjiId = `a2-kanji-${row.romaji}-${row.glyph}`;
    const readingId = `${kanjiId}-reading`;
    const senseId = `a2-sense-${row.sense}`;

    entries.push({
      id: kanjiId,
      glyph: row.glyph,
      meaningCopyId: meaningCopyId(row),
      readingIds: [readingId],
    });

    readings.push({
      id: readingId,
      kanjiId,
      kana: row.kana,
      romaji: row.romaji,
    });

    for (const stage of STAGE_ORDER) {
      const lessonId = row.stages[stage];
      exposures.push({
        id: `${kanjiId}-${stage}`,
        kanjiId,
        lexemeSenseId: senseId,
        lessonId,
        stage,
        readingId,
        contextId: row.contextId,
      });
    }

    const introModuleId = moduleIdOfLesson(row.stages["first-supported"]);
    distribution[introModuleId] = (distribution[introModuleId] ?? 0) + 1;
  }

  return { entries, readings, exposures, distribution };
}

const CATALOG = buildCatalog(ALL_ROWS);

// ---------------------------------------------------------------------------
// Exports (deep-frozen)
// ---------------------------------------------------------------------------

export const A2_KANJI_ENTRIES: readonly KanjiEntry[] = deepFreeze([...CATALOG.entries]);
export const A2_KANJI_READINGS: readonly KanjiReading[] = deepFreeze([...CATALOG.readings]);
export const A2_KANJI_EXPOSURES: readonly KanjiExposure[] = deepFreeze([...CATALOG.exposures]);

/** The exact, authoritative per-module new-glyph distribution. Sums to 120. */
export const A2_KANJI_DISTRIBUTION: Readonly<Record<ModuleId, number>> = deepFreeze({
  "connected-conversation": 8,
  "plans-invitations": 12,
  "experiences-narratives": 9,
  "reasons-opinions": 8,
  "sequencing-ongoing": 9,
  "permission-requests": 8,
  "neighborhood-services": 8,
  "restaurant-problems": 8,
  "shopping-returns": 8,
  "health-advice": 8,
  "work-study-messages": 8,
  "travel-reservations": 9,
  "relationships-events": 8,
  "practical-texts": 9,
  "a2-synthesis": 0,
});

/**
 * Recompute the per-module new-glyph (first-supported) count directly from
 * the exposures, independent of the {@link A2_KANJI_DISTRIBUTION} literal —
 * used by the validator/tests to prove the two agree.
 */
export function a2KanjiCountByModule(): Record<ModuleId, number> {
  const counts: Record<ModuleId, number> = {};
  for (const moduleId of Object.keys(A2_KANJI_DISTRIBUTION)) {
    counts[moduleId] = 0;
  }
  for (const exposure of A2_KANJI_EXPOSURES) {
    if (exposure.stage !== "first-supported") continue;
    const moduleId = moduleIdOfLesson(exposure.lessonId);
    counts[moduleId] = (counts[moduleId] ?? 0) + 1;
  }
  return counts;
}
