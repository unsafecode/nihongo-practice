/**
 * The exact, immutable A2 contextual kanji catalog (Phase 3 Task 3, locked
 * decision L3): exactly 120 glyphs across the 14 instructional modules (the
 * `a2-synthesis` module introduces no new glyphs), each carried by a single
 * contextual lexeme and scheduled through four explicit stages —
 * `first-supported`, `supported-retrieval`, `revealable`, `assessed` — in
 * strict canonical-position order.
 *
 * `KanjiRow` is a per-glyph authoring row: every row states its own four
 * lesson ids — `firstSupported`, `supportedRetrieval`, `revealable`,
 * `assessed` — as plain, hand-authored string literals (never inferred from
 * array position or a runtime "cohort" lookup). There is deliberately no
 * schedule-computing helper here: every authored row's full four-lesson
 * schedule is legible by reading that row alone, so it can never silently
 * drift out of sync with the authoritative plan through an edit to some
 * shared helper elsewhere in the file.
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

export interface KanjiRow {
  readonly glyph: string;
  /** This glyph's own kana reading inside its contextual lexeme. */
  readonly kana: string;
  /** This glyph's own romaji reading inside its contextual lexeme. */
  readonly romaji: string;
  /** A short romanized slug for the contextual lexeme (e.g. "hanasu"). */
  readonly sense: string;
  readonly contextId: ContextId;
  /** The lesson id where this glyph is first introduced, furigana visible. */
  readonly firstSupported: string;
  /** The lesson id where this glyph is retrieved again, furigana still visible. */
  readonly supportedRetrieval: string;
  /** The lesson id where this glyph's furigana becomes reveal-on-demand. */
  readonly revealable: string;
  /** The lesson id where this glyph is assessed with no furigana at all. */
  readonly assessed: string;
}

// ---------------------------------------------------------------------------
// Authoritative per-module rows (locked decision L3)
// ---------------------------------------------------------------------------

const CONNECTED_CONVERSATION_ROWS: readonly KanjiRow[] = [
  { glyph: "話", kana: "はな", romaji: "hana", sense: "hanasu", contextId: "a2-context-conversation", firstSupported: "connected-conversation-1", supportedRetrieval: "connected-conversation-2", revealable: "connected-conversation-3", assessed: "connected-conversation-4" },
  { glyph: "言", kana: "い", romaji: "i", sense: "iu", contextId: "a2-context-conversation", firstSupported: "connected-conversation-1", supportedRetrieval: "connected-conversation-2", revealable: "connected-conversation-3", assessed: "connected-conversation-4" },
  { glyph: "聞", kana: "き", romaji: "ki", sense: "kiku", contextId: "a2-context-conversation", firstSupported: "connected-conversation-1", supportedRetrieval: "connected-conversation-2", revealable: "connected-conversation-3", assessed: "connected-conversation-4" },
  { glyph: "友", kana: "とも", romaji: "tomo", sense: "tomodachi", contextId: "a2-context-conversation", firstSupported: "connected-conversation-1", supportedRetrieval: "connected-conversation-2", revealable: "connected-conversation-3", assessed: "connected-conversation-4" },
  { glyph: "思", kana: "おも", romaji: "omo", sense: "omou", contextId: "a2-context-conversation", firstSupported: "connected-conversation-2", supportedRetrieval: "connected-conversation-3", revealable: "connected-conversation-4", assessed: "plans-invitations-1" },
  { glyph: "名", kana: "な", romaji: "na", sense: "namae", contextId: "a2-context-conversation", firstSupported: "connected-conversation-2", supportedRetrieval: "connected-conversation-3", revealable: "connected-conversation-4", assessed: "plans-invitations-1" },
  { glyph: "前", kana: "まえ", romaji: "mae", sense: "namae", contextId: "a2-context-conversation", firstSupported: "connected-conversation-2", supportedRetrieval: "connected-conversation-3", revealable: "connected-conversation-4", assessed: "plans-invitations-1" },
  { glyph: "何", kana: "なに", romaji: "nani", sense: "nani", contextId: "a2-context-conversation", firstSupported: "connected-conversation-2", supportedRetrieval: "connected-conversation-3", revealable: "connected-conversation-4", assessed: "plans-invitations-1" },
];

const PLANS_INVITATIONS_ROWS: readonly KanjiRow[] = [
  { glyph: "予", kana: "よ", romaji: "yo", sense: "yotei", contextId: "a2-context-plans", firstSupported: "plans-invitations-1", supportedRetrieval: "plans-invitations-2", revealable: "plans-invitations-3", assessed: "plans-invitations-4" },
  { glyph: "定", kana: "てい", romaji: "tei", sense: "yotei", contextId: "a2-context-plans", firstSupported: "plans-invitations-1", supportedRetrieval: "plans-invitations-2", revealable: "plans-invitations-3", assessed: "plans-invitations-4" },
  { glyph: "曜", kana: "よう", romaji: "you", sense: "youbi", contextId: "a2-context-plans", firstSupported: "plans-invitations-1", supportedRetrieval: "plans-invitations-2", revealable: "plans-invitations-3", assessed: "plans-invitations-4" },
  { glyph: "会", kana: "あ", romaji: "a", sense: "au", contextId: "a2-context-plans", firstSupported: "plans-invitations-1", supportedRetrieval: "plans-invitations-2", revealable: "plans-invitations-3", assessed: "plans-invitations-4" },
  { glyph: "今", kana: "こん", romaji: "kon", sense: "konshuu", contextId: "a2-context-plans", firstSupported: "plans-invitations-1", supportedRetrieval: "plans-invitations-2", revealable: "plans-invitations-3", assessed: "plans-invitations-4" },
  { glyph: "日", kana: "び", romaji: "bi", sense: "youbi", contextId: "a2-context-plans", firstSupported: "plans-invitations-1", supportedRetrieval: "plans-invitations-2", revealable: "plans-invitations-3", assessed: "plans-invitations-4" },
  { glyph: "週", kana: "しゅう", romaji: "shuu", sense: "konshuu", contextId: "a2-context-plans", firstSupported: "plans-invitations-2", supportedRetrieval: "plans-invitations-3", revealable: "plans-invitations-4", assessed: "experiences-narratives-1" },
  { glyph: "末", kana: "まつ", romaji: "matsu", sense: "shuumatsu", contextId: "a2-context-plans", firstSupported: "plans-invitations-2", supportedRetrieval: "plans-invitations-3", revealable: "plans-invitations-4", assessed: "experiences-narratives-1" },
  { glyph: "待", kana: "ま", romaji: "ma", sense: "machimasu", contextId: "a2-context-plans", firstSupported: "plans-invitations-2", supportedRetrieval: "plans-invitations-3", revealable: "plans-invitations-4", assessed: "experiences-narratives-1" },
  { glyph: "約", kana: "やく", romaji: "yaku", sense: "yakusoku", contextId: "a2-context-plans", firstSupported: "plans-invitations-2", supportedRetrieval: "plans-invitations-3", revealable: "plans-invitations-4", assessed: "experiences-narratives-1" },
  { glyph: "来", kana: "らい", romaji: "rai", sense: "raigetsu", contextId: "a2-context-plans", firstSupported: "plans-invitations-2", supportedRetrieval: "plans-invitations-3", revealable: "plans-invitations-4", assessed: "experiences-narratives-1" },
  { glyph: "月", kana: "げつ", romaji: "getsu", sense: "raigetsu", contextId: "a2-context-plans", firstSupported: "plans-invitations-2", supportedRetrieval: "plans-invitations-3", revealable: "plans-invitations-4", assessed: "experiences-narratives-1" },
];

const EXPERIENCES_NARRATIVES_ROWS: readonly KanjiRow[] = [
  { glyph: "去", kana: "きょ", romaji: "kyo", sense: "kyonen", contextId: "a2-context-experiences", firstSupported: "experiences-narratives-1", supportedRetrieval: "experiences-narratives-2", revealable: "experiences-narratives-3", assessed: "experiences-narratives-4" },
  { glyph: "楽", kana: "たの", romaji: "tano", sense: "tanoshii", contextId: "a2-context-experiences", firstSupported: "experiences-narratives-1", supportedRetrieval: "experiences-narratives-2", revealable: "experiences-narratives-3", assessed: "experiences-narratives-4" },
  { glyph: "初", kana: "はじ", romaji: "haji", sense: "hajimete", contextId: "a2-context-experiences", firstSupported: "experiences-narratives-1", supportedRetrieval: "experiences-narratives-2", revealable: "experiences-narratives-3", assessed: "experiences-narratives-4" },
  { glyph: "度", kana: "ど", romaji: "do", sense: "ichido", contextId: "a2-context-experiences", firstSupported: "experiences-narratives-1", supportedRetrieval: "experiences-narratives-2", revealable: "experiences-narratives-3", assessed: "experiences-narratives-4" },
  { glyph: "年", kana: "ねん", romaji: "nen", sense: "kyonen", contextId: "a2-context-experiences", firstSupported: "experiences-narratives-1", supportedRetrieval: "experiences-narratives-2", revealable: "experiences-narratives-3", assessed: "experiences-narratives-4" },
  { glyph: "有", kana: "ゆう", romaji: "yuu", sense: "yuumei", contextId: "a2-context-experiences", firstSupported: "experiences-narratives-2", supportedRetrieval: "experiences-narratives-3", revealable: "experiences-narratives-4", assessed: "reasons-opinions-1" },
  { glyph: "泳", kana: "およ", romaji: "oyo", sense: "oyogu", contextId: "a2-context-experiences", firstSupported: "experiences-narratives-2", supportedRetrieval: "experiences-narratives-3", revealable: "experiences-narratives-4", assessed: "reasons-opinions-1" },
  { glyph: "登", kana: "のぼ", romaji: "nobo", sense: "noboru", contextId: "a2-context-experiences", firstSupported: "experiences-narratives-2", supportedRetrieval: "experiences-narratives-3", revealable: "experiences-narratives-4", assessed: "reasons-opinions-1" },
  { glyph: "旅", kana: "りょ", romaji: "ryo", sense: "ryokou", contextId: "a2-context-experiences", firstSupported: "experiences-narratives-2", supportedRetrieval: "experiences-narratives-3", revealable: "experiences-narratives-4", assessed: "reasons-opinions-1" },
];

const REASONS_OPINIONS_ROWS: readonly KanjiRow[] = [
  { glyph: "理", kana: "り", romaji: "ri", sense: "riyuu", contextId: "a2-context-reasons", firstSupported: "reasons-opinions-1", supportedRetrieval: "reasons-opinions-2", revealable: "reasons-opinions-3", assessed: "reasons-opinions-4" },
  { glyph: "由", kana: "ゆう", romaji: "yuu", sense: "riyuu", contextId: "a2-context-reasons", firstSupported: "reasons-opinions-1", supportedRetrieval: "reasons-opinions-2", revealable: "reasons-opinions-3", assessed: "reasons-opinions-4" },
  { glyph: "考", kana: "かんが", romaji: "kanga", sense: "kangaeru", contextId: "a2-context-reasons", firstSupported: "reasons-opinions-1", supportedRetrieval: "reasons-opinions-2", revealable: "reasons-opinions-3", assessed: "reasons-opinions-4" },
  { glyph: "意", kana: "い", romaji: "i", sense: "iken", contextId: "a2-context-reasons", firstSupported: "reasons-opinions-1", supportedRetrieval: "reasons-opinions-2", revealable: "reasons-opinions-3", assessed: "reasons-opinions-4" },
  { glyph: "見", kana: "けん", romaji: "ken", sense: "iken", contextId: "a2-context-reasons", firstSupported: "reasons-opinions-2", supportedRetrieval: "reasons-opinions-3", revealable: "reasons-opinions-4", assessed: "sequencing-ongoing-1" },
  { glyph: "気", kana: "き", romaji: "ki", sense: "kimochi", contextId: "a2-context-reasons", firstSupported: "reasons-opinions-2", supportedRetrieval: "reasons-opinions-3", revealable: "reasons-opinions-4", assessed: "sequencing-ongoing-1" },
  { glyph: "持", kana: "も", romaji: "mo", sense: "kimochi", contextId: "a2-context-reasons", firstSupported: "reasons-opinions-2", supportedRetrieval: "reasons-opinions-3", revealable: "reasons-opinions-4", assessed: "sequencing-ongoing-1" },
  { glyph: "悪", kana: "わる", romaji: "waru", sense: "warui", contextId: "a2-context-reasons", firstSupported: "reasons-opinions-2", supportedRetrieval: "reasons-opinions-3", revealable: "reasons-opinions-4", assessed: "sequencing-ongoing-1" },
];

const SEQUENCING_ONGOING_ROWS: readonly KanjiRow[] = [
  { glyph: "起", kana: "お", romaji: "o", sense: "okiru", contextId: "a2-context-routines", firstSupported: "sequencing-ongoing-1", supportedRetrieval: "sequencing-ongoing-2", revealable: "sequencing-ongoing-3", assessed: "sequencing-ongoing-4" },
  { glyph: "寝", kana: "ね", romaji: "ne", sense: "neru", contextId: "a2-context-routines", firstSupported: "sequencing-ongoing-1", supportedRetrieval: "sequencing-ongoing-2", revealable: "sequencing-ongoing-3", assessed: "sequencing-ongoing-4" },
  { glyph: "使", kana: "つか", romaji: "tsuka", sense: "tsukau", contextId: "a2-context-routines", firstSupported: "sequencing-ongoing-1", supportedRetrieval: "sequencing-ongoing-2", revealable: "sequencing-ongoing-3", assessed: "sequencing-ongoing-4" },
  { glyph: "作", kana: "つく", romaji: "tsuku", sense: "tsukuru", contextId: "a2-context-routines", firstSupported: "sequencing-ongoing-1", supportedRetrieval: "sequencing-ongoing-2", revealable: "sequencing-ongoing-3", assessed: "sequencing-ongoing-4" },
  { glyph: "毎", kana: "まい", romaji: "mai", sense: "mainichi", contextId: "a2-context-routines", firstSupported: "sequencing-ongoing-1", supportedRetrieval: "sequencing-ongoing-2", revealable: "sequencing-ongoing-3", assessed: "sequencing-ongoing-4" },
  { glyph: "洗", kana: "あら", romaji: "ara", sense: "arau", contextId: "a2-context-routines", firstSupported: "sequencing-ongoing-2", supportedRetrieval: "sequencing-ongoing-3", revealable: "sequencing-ongoing-4", assessed: "permission-requests-1" },
  { glyph: "終", kana: "お", romaji: "o", sense: "owaru", contextId: "a2-context-routines", firstSupported: "sequencing-ongoing-2", supportedRetrieval: "sequencing-ongoing-3", revealable: "sequencing-ongoing-4", assessed: "permission-requests-1" },
  { glyph: "始", kana: "はじ", romaji: "haji", sense: "hajimaru", contextId: "a2-context-routines", firstSupported: "sequencing-ongoing-2", supportedRetrieval: "sequencing-ongoing-3", revealable: "sequencing-ongoing-4", assessed: "permission-requests-1" },
  { glyph: "働", kana: "はたら", romaji: "hatara", sense: "hataraku", contextId: "a2-context-routines", firstSupported: "sequencing-ongoing-2", supportedRetrieval: "sequencing-ongoing-3", revealable: "sequencing-ongoing-4", assessed: "permission-requests-1" },
];

const PERMISSION_REQUESTS_ROWS: readonly KanjiRow[] = [
  { glyph: "入", kana: "はい", romaji: "hai", sense: "hairu", contextId: "a2-context-rules", firstSupported: "permission-requests-1", supportedRetrieval: "permission-requests-2", revealable: "permission-requests-3", assessed: "permission-requests-4" },
  { glyph: "口", kana: "ぐち", romaji: "guchi", sense: "iriguchi", contextId: "a2-context-rules", firstSupported: "permission-requests-1", supportedRetrieval: "permission-requests-2", revealable: "permission-requests-3", assessed: "permission-requests-4" },
  { glyph: "出", kana: "で", romaji: "de", sense: "deguchi", contextId: "a2-context-rules", firstSupported: "permission-requests-1", supportedRetrieval: "permission-requests-2", revealable: "permission-requests-3", assessed: "permission-requests-4" },
  { glyph: "止", kana: "と", romaji: "to", sense: "tomaru-stop", contextId: "a2-context-rules", firstSupported: "permission-requests-1", supportedRetrieval: "permission-requests-2", revealable: "permission-requests-3", assessed: "permission-requests-4" },
  { glyph: "禁", kana: "きん", romaji: "kin", sense: "kinshi", contextId: "a2-context-rules", firstSupported: "permission-requests-2", supportedRetrieval: "permission-requests-3", revealable: "permission-requests-4", assessed: "neighborhood-services-1" },
  { glyph: "消", kana: "け", romaji: "ke", sense: "kesu", contextId: "a2-context-rules", firstSupported: "permission-requests-2", supportedRetrieval: "permission-requests-3", revealable: "permission-requests-4", assessed: "neighborhood-services-1" },
  { glyph: "座", kana: "すわ", romaji: "suwa", sense: "suwaru", contextId: "a2-context-rules", firstSupported: "permission-requests-2", supportedRetrieval: "permission-requests-3", revealable: "permission-requests-4", assessed: "neighborhood-services-1" },
  { glyph: "立", kana: "た", romaji: "ta", sense: "tatsu", contextId: "a2-context-rules", firstSupported: "permission-requests-2", supportedRetrieval: "permission-requests-3", revealable: "permission-requests-4", assessed: "neighborhood-services-1" },
];

const NEIGHBORHOOD_SERVICES_ROWS: readonly KanjiRow[] = [
  { glyph: "病", kana: "びょう", romaji: "byou", sense: "byouin", contextId: "a2-context-neighborhood", firstSupported: "neighborhood-services-1", supportedRetrieval: "neighborhood-services-2", revealable: "neighborhood-services-3", assessed: "neighborhood-services-4" },
  { glyph: "院", kana: "いん", romaji: "in", sense: "byouin", contextId: "a2-context-neighborhood", firstSupported: "neighborhood-services-1", supportedRetrieval: "neighborhood-services-2", revealable: "neighborhood-services-3", assessed: "neighborhood-services-4" },
  { glyph: "銀", kana: "ぎん", romaji: "gin", sense: "ginkou", contextId: "a2-context-neighborhood", firstSupported: "neighborhood-services-1", supportedRetrieval: "neighborhood-services-2", revealable: "neighborhood-services-3", assessed: "neighborhood-services-4" },
  { glyph: "行", kana: "こう", romaji: "kou", sense: "ginkou", contextId: "a2-context-neighborhood", firstSupported: "neighborhood-services-1", supportedRetrieval: "neighborhood-services-2", revealable: "neighborhood-services-3", assessed: "neighborhood-services-4" },
  { glyph: "局", kana: "きょく", romaji: "kyoku", sense: "yuubinkyoku", contextId: "a2-context-neighborhood", firstSupported: "neighborhood-services-2", supportedRetrieval: "neighborhood-services-3", revealable: "neighborhood-services-4", assessed: "restaurant-problems-1" },
  { glyph: "便", kana: "べん", romaji: "ben", sense: "benri", contextId: "a2-context-neighborhood", firstSupported: "neighborhood-services-2", supportedRetrieval: "neighborhood-services-3", revealable: "neighborhood-services-4", assessed: "restaurant-problems-1" },
  { glyph: "図", kana: "と", romaji: "to", sense: "toshokan", contextId: "a2-context-neighborhood", firstSupported: "neighborhood-services-2", supportedRetrieval: "neighborhood-services-3", revealable: "neighborhood-services-4", assessed: "restaurant-problems-1" },
  { glyph: "館", kana: "かん", romaji: "kan", sense: "toshokan", contextId: "a2-context-neighborhood", firstSupported: "neighborhood-services-2", supportedRetrieval: "neighborhood-services-3", revealable: "neighborhood-services-4", assessed: "restaurant-problems-1" },
];

const RESTAURANT_PROBLEMS_ROWS: readonly KanjiRow[] = [
  { glyph: "食", kana: "た", romaji: "ta", sense: "taberu", contextId: "a2-context-restaurant", firstSupported: "restaurant-problems-1", supportedRetrieval: "restaurant-problems-2", revealable: "restaurant-problems-3", assessed: "restaurant-problems-4" },
  { glyph: "飲", kana: "の", romaji: "no", sense: "nomu", contextId: "a2-context-restaurant", firstSupported: "restaurant-problems-1", supportedRetrieval: "restaurant-problems-2", revealable: "restaurant-problems-3", assessed: "restaurant-problems-4" },
  { glyph: "飯", kana: "はん", romaji: "han", sense: "gohan", contextId: "a2-context-restaurant", firstSupported: "restaurant-problems-1", supportedRetrieval: "restaurant-problems-2", revealable: "restaurant-problems-3", assessed: "restaurant-problems-4" },
  { glyph: "茶", kana: "ちゃ", romaji: "cha", sense: "ocha", contextId: "a2-context-restaurant", firstSupported: "restaurant-problems-1", supportedRetrieval: "restaurant-problems-2", revealable: "restaurant-problems-3", assessed: "restaurant-problems-4" },
  { glyph: "肉", kana: "にく", romaji: "niku", sense: "niku", contextId: "a2-context-restaurant", firstSupported: "restaurant-problems-2", supportedRetrieval: "restaurant-problems-3", revealable: "restaurant-problems-4", assessed: "shopping-returns-1" },
  { glyph: "魚", kana: "さかな", romaji: "sakana", sense: "sakana", contextId: "a2-context-restaurant", firstSupported: "restaurant-problems-2", supportedRetrieval: "restaurant-problems-3", revealable: "restaurant-problems-4", assessed: "shopping-returns-1" },
  { glyph: "熱", kana: "あつ", romaji: "atsu", sense: "atsui", contextId: "a2-context-restaurant", firstSupported: "restaurant-problems-2", supportedRetrieval: "restaurant-problems-3", revealable: "restaurant-problems-4", assessed: "shopping-returns-1" },
  { glyph: "冷", kana: "つめ", romaji: "tsume", sense: "tsumetai", contextId: "a2-context-restaurant", firstSupported: "restaurant-problems-2", supportedRetrieval: "restaurant-problems-3", revealable: "restaurant-problems-4", assessed: "shopping-returns-1" },
];

const SHOPPING_RETURNS_ROWS: readonly KanjiRow[] = [
  { glyph: "買", kana: "か", romaji: "ka", sense: "kau", contextId: "a2-context-shopping", firstSupported: "shopping-returns-1", supportedRetrieval: "shopping-returns-2", revealable: "shopping-returns-3", assessed: "shopping-returns-4" },
  { glyph: "店", kana: "みせ", romaji: "mise", sense: "mise", contextId: "a2-context-shopping", firstSupported: "shopping-returns-1", supportedRetrieval: "shopping-returns-2", revealable: "shopping-returns-3", assessed: "shopping-returns-4" },
  { glyph: "円", kana: "えん", romaji: "en", sense: "senen", contextId: "a2-context-shopping", firstSupported: "shopping-returns-1", supportedRetrieval: "shopping-returns-2", revealable: "shopping-returns-3", assessed: "shopping-returns-4" },
  { glyph: "番", kana: "ばん", romaji: "ban", sense: "ichiban", contextId: "a2-context-shopping", firstSupported: "shopping-returns-1", supportedRetrieval: "shopping-returns-2", revealable: "shopping-returns-3", assessed: "shopping-returns-4" },
  { glyph: "千", kana: "せん", romaji: "sen", sense: "senen", contextId: "a2-context-shopping", firstSupported: "shopping-returns-2", supportedRetrieval: "shopping-returns-3", revealable: "shopping-returns-4", assessed: "health-advice-1" },
  { glyph: "万", kana: "まん", romaji: "man", sense: "ichiman", contextId: "a2-context-shopping", firstSupported: "shopping-returns-2", supportedRetrieval: "shopping-returns-3", revealable: "shopping-returns-4", assessed: "health-advice-1" },
  { glyph: "安", kana: "やす", romaji: "yasu", sense: "yasui", contextId: "a2-context-shopping", firstSupported: "shopping-returns-2", supportedRetrieval: "shopping-returns-3", revealable: "shopping-returns-4", assessed: "health-advice-1" },
  { glyph: "高", kana: "たか", romaji: "taka", sense: "takai", contextId: "a2-context-shopping", firstSupported: "shopping-returns-2", supportedRetrieval: "shopping-returns-3", revealable: "shopping-returns-4", assessed: "health-advice-1" },
];

const HEALTH_ADVICE_ROWS: readonly KanjiRow[] = [
  { glyph: "医", kana: "い", romaji: "i", sense: "isha", contextId: "a2-context-health", firstSupported: "health-advice-1", supportedRetrieval: "health-advice-2", revealable: "health-advice-3", assessed: "health-advice-4" },
  { glyph: "者", kana: "しゃ", romaji: "sha", sense: "isha", contextId: "a2-context-health", firstSupported: "health-advice-1", supportedRetrieval: "health-advice-2", revealable: "health-advice-3", assessed: "health-advice-4" },
  { glyph: "薬", kana: "くすり", romaji: "kusuri", sense: "kusuri", contextId: "a2-context-health", firstSupported: "health-advice-1", supportedRetrieval: "health-advice-2", revealable: "health-advice-3", assessed: "health-advice-4" },
  { glyph: "体", kana: "からだ", romaji: "karada", sense: "karada", contextId: "a2-context-health", firstSupported: "health-advice-1", supportedRetrieval: "health-advice-2", revealable: "health-advice-3", assessed: "health-advice-4" },
  { glyph: "頭", kana: "あたま", romaji: "atama", sense: "atama", contextId: "a2-context-health", firstSupported: "health-advice-2", supportedRetrieval: "health-advice-3", revealable: "health-advice-4", assessed: "work-study-messages-1" },
  { glyph: "痛", kana: "いた", romaji: "ita", sense: "itai", contextId: "a2-context-health", firstSupported: "health-advice-2", supportedRetrieval: "health-advice-3", revealable: "health-advice-4", assessed: "work-study-messages-1" },
  { glyph: "元", kana: "げん", romaji: "gen", sense: "genki", contextId: "a2-context-health", firstSupported: "health-advice-2", supportedRetrieval: "health-advice-3", revealable: "health-advice-4", assessed: "work-study-messages-1" },
  { glyph: "休", kana: "やす", romaji: "yasu", sense: "yasumu", contextId: "a2-context-health", firstSupported: "health-advice-2", supportedRetrieval: "health-advice-3", revealable: "health-advice-4", assessed: "work-study-messages-1" },
];

const WORK_STUDY_MESSAGES_ROWS: readonly KanjiRow[] = [
  { glyph: "社", kana: "しゃ", romaji: "sha", sense: "kaisha", contextId: "a2-context-work-study", firstSupported: "work-study-messages-1", supportedRetrieval: "work-study-messages-2", revealable: "work-study-messages-3", assessed: "work-study-messages-4" },
  { glyph: "仕", kana: "し", romaji: "shi", sense: "shigoto", contextId: "a2-context-work-study", firstSupported: "work-study-messages-1", supportedRetrieval: "work-study-messages-2", revealable: "work-study-messages-3", assessed: "work-study-messages-4" },
  { glyph: "事", kana: "ごと", romaji: "goto", sense: "shigoto", contextId: "a2-context-work-study", firstSupported: "work-study-messages-1", supportedRetrieval: "work-study-messages-2", revealable: "work-study-messages-3", assessed: "work-study-messages-4" },
  { glyph: "教", kana: "おし", romaji: "oshi", sense: "oshieru", contextId: "a2-context-work-study", firstSupported: "work-study-messages-1", supportedRetrieval: "work-study-messages-2", revealable: "work-study-messages-3", assessed: "work-study-messages-4" },
  { glyph: "学", kana: "がく", romaji: "gaku", sense: "gakkou", contextId: "a2-context-work-study", firstSupported: "work-study-messages-2", supportedRetrieval: "work-study-messages-3", revealable: "work-study-messages-4", assessed: "travel-reservations-1" },
  { glyph: "校", kana: "こう", romaji: "kou", sense: "gakkou", contextId: "a2-context-work-study", firstSupported: "work-study-messages-2", supportedRetrieval: "work-study-messages-3", revealable: "work-study-messages-4", assessed: "travel-reservations-1" },
  { glyph: "先", kana: "せん", romaji: "sen", sense: "sensei", contextId: "a2-context-work-study", firstSupported: "work-study-messages-2", supportedRetrieval: "work-study-messages-3", revealable: "work-study-messages-4", assessed: "travel-reservations-1" },
  { glyph: "生", kana: "せい", romaji: "sei", sense: "gakusei", contextId: "a2-context-work-study", firstSupported: "work-study-messages-2", supportedRetrieval: "work-study-messages-3", revealable: "work-study-messages-4", assessed: "travel-reservations-1" },
];

const TRAVEL_RESERVATIONS_ROWS: readonly KanjiRow[] = [
  { glyph: "空", kana: "くう", romaji: "kuu", sense: "kuukou", contextId: "a2-context-travel", firstSupported: "travel-reservations-1", supportedRetrieval: "travel-reservations-2", revealable: "travel-reservations-3", assessed: "travel-reservations-4" },
  { glyph: "港", kana: "こう", romaji: "kou", sense: "kuukou", contextId: "a2-context-travel", firstSupported: "travel-reservations-1", supportedRetrieval: "travel-reservations-2", revealable: "travel-reservations-3", assessed: "travel-reservations-4" },
  { glyph: "駅", kana: "えき", romaji: "eki", sense: "eki", contextId: "a2-context-travel", firstSupported: "travel-reservations-1", supportedRetrieval: "travel-reservations-2", revealable: "travel-reservations-3", assessed: "travel-reservations-4" },
  { glyph: "電", kana: "でん", romaji: "den", sense: "densha", contextId: "a2-context-travel", firstSupported: "travel-reservations-1", supportedRetrieval: "travel-reservations-2", revealable: "travel-reservations-3", assessed: "travel-reservations-4" },
  { glyph: "山", kana: "やま", romaji: "yama", sense: "yama", contextId: "a2-context-travel", firstSupported: "travel-reservations-1", supportedRetrieval: "travel-reservations-2", revealable: "travel-reservations-3", assessed: "travel-reservations-4" },
  { glyph: "車", kana: "しゃ", romaji: "sha", sense: "densha", contextId: "a2-context-travel", firstSupported: "travel-reservations-2", supportedRetrieval: "travel-reservations-3", revealable: "travel-reservations-4", assessed: "relationships-events-1" },
  { glyph: "着", kana: "つ", romaji: "tsu", sense: "tsuku-arrive", contextId: "a2-context-travel", firstSupported: "travel-reservations-2", supportedRetrieval: "travel-reservations-3", revealable: "travel-reservations-4", assessed: "relationships-events-1" },
  { glyph: "発", kana: "はつ", romaji: "hatsu", sense: "shuppatsu", contextId: "a2-context-travel", firstSupported: "travel-reservations-2", supportedRetrieval: "travel-reservations-3", revealable: "travel-reservations-4", assessed: "relationships-events-1" },
  { glyph: "泊", kana: "と", romaji: "to", sense: "tomaru-stay", contextId: "a2-context-travel", firstSupported: "travel-reservations-2", supportedRetrieval: "travel-reservations-3", revealable: "travel-reservations-4", assessed: "relationships-events-1" },
];

const RELATIONSHIPS_EVENTS_ROWS: readonly KanjiRow[] = [
  { glyph: "母", kana: "はは", romaji: "haha", sense: "haha", contextId: "a2-context-relationships", firstSupported: "relationships-events-1", supportedRetrieval: "relationships-events-2", revealable: "relationships-events-3", assessed: "relationships-events-4" },
  { glyph: "父", kana: "ちち", romaji: "chichi", sense: "chichi", contextId: "a2-context-relationships", firstSupported: "relationships-events-1", supportedRetrieval: "relationships-events-2", revealable: "relationships-events-3", assessed: "relationships-events-4" },
  { glyph: "家", kana: "か", romaji: "ka", sense: "kazoku", contextId: "a2-context-relationships", firstSupported: "relationships-events-1", supportedRetrieval: "relationships-events-2", revealable: "relationships-events-3", assessed: "relationships-events-4" },
  { glyph: "族", kana: "ぞく", romaji: "zoku", sense: "kazoku", contextId: "a2-context-relationships", firstSupported: "relationships-events-1", supportedRetrieval: "relationships-events-2", revealable: "relationships-events-3", assessed: "relationships-events-4" },
  { glyph: "結", kana: "けっ", romaji: "kek", sense: "kekkon", contextId: "a2-context-relationships", firstSupported: "relationships-events-2", supportedRetrieval: "relationships-events-3", revealable: "relationships-events-4", assessed: "practical-texts-1" },
  { glyph: "婚", kana: "こん", romaji: "kon", sense: "kekkon", contextId: "a2-context-relationships", firstSupported: "relationships-events-2", supportedRetrieval: "relationships-events-3", revealable: "relationships-events-4", assessed: "practical-texts-1" },
  { glyph: "誕", kana: "たん", romaji: "tan", sense: "tanjoubi", contextId: "a2-context-relationships", firstSupported: "relationships-events-2", supportedRetrieval: "relationships-events-3", revealable: "relationships-events-4", assessed: "practical-texts-1" },
  { glyph: "送", kana: "おく", romaji: "oku", sense: "okuru", contextId: "a2-context-relationships", firstSupported: "relationships-events-2", supportedRetrieval: "relationships-events-3", revealable: "relationships-events-4", assessed: "practical-texts-1" },
];

const PRACTICAL_TEXTS_ROWS: readonly KanjiRow[] = [
  { glyph: "時", kana: "じ", romaji: "ji", sense: "jikan", contextId: "a2-context-notices", firstSupported: "practical-texts-1", supportedRetrieval: "practical-texts-2", revealable: "practical-texts-3", assessed: "practical-texts-4" },
  { glyph: "間", kana: "かん", romaji: "kan", sense: "jikan", contextId: "a2-context-notices", firstSupported: "practical-texts-1", supportedRetrieval: "practical-texts-2", revealable: "practical-texts-3", assessed: "practical-texts-4" },
  { glyph: "分", kana: "ふん", romaji: "fun", sense: "gofun", contextId: "a2-context-notices", firstSupported: "practical-texts-1", supportedRetrieval: "practical-texts-2", revealable: "practical-texts-3", assessed: "practical-texts-4" },
  { glyph: "半", kana: "はん", romaji: "han", sense: "han", contextId: "a2-context-notices", firstSupported: "practical-texts-1", supportedRetrieval: "practical-texts-2", revealable: "practical-texts-3", assessed: "practical-texts-4" },
  { glyph: "本", kana: "ほん", romaji: "hon", sense: "hon", contextId: "a2-context-notices", firstSupported: "practical-texts-1", supportedRetrieval: "practical-texts-2", revealable: "practical-texts-3", assessed: "practical-texts-4" },
  { glyph: "料", kana: "りょう", romaji: "ryou", sense: "ryoukin", contextId: "a2-context-notices", firstSupported: "practical-texts-2", supportedRetrieval: "practical-texts-3", revealable: "practical-texts-4", assessed: "a2-synthesis-4" },
  { glyph: "金", kana: "きん", romaji: "kin", sense: "ryoukin", contextId: "a2-context-notices", firstSupported: "practical-texts-2", supportedRetrieval: "practical-texts-3", revealable: "practical-texts-4", assessed: "a2-synthesis-4" },
  { glyph: "開", kana: "あ", romaji: "a", sense: "aku", contextId: "a2-context-notices", firstSupported: "practical-texts-2", supportedRetrieval: "practical-texts-3", revealable: "practical-texts-4", assessed: "a2-synthesis-4" },
  { glyph: "閉", kana: "し", romaji: "shi", sense: "shimaru", contextId: "a2-context-notices", firstSupported: "practical-texts-2", supportedRetrieval: "practical-texts-3", revealable: "practical-texts-4", assessed: "a2-synthesis-4" },
];

/** `a2-synthesis` (module 15) introduces no new glyphs. */
const A2_SYNTHESIS_ROWS: readonly KanjiRow[] = [];

export const A2_KANJI_ROWS: readonly KanjiRow[] = [
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

    // Each row's own four explicit lesson ids, paired with their stage, in
    // strict canonical order — never a computed/inferred schedule.
    const stageLessons: readonly (readonly [KanjiExposureStage, string])[] = [
      ["first-supported", row.firstSupported],
      ["supported-retrieval", row.supportedRetrieval],
      ["revealable", row.revealable],
      ["assessed", row.assessed],
    ];
    for (const [stage, lessonId] of stageLessons) {
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
  }

  return { entries, readings, exposures };
}

const CATALOG = buildCatalog(A2_KANJI_ROWS);

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
