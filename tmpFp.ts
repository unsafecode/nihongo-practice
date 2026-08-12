import { BASE_NATURALNESS_REVIEW_INVENTORY as INV } from "./src/course/base/review/naturalnessLedger";
const titles = INV.filter((e:any)=>e.contentId.includes("reference-") && e.contentId.includes("title"));
console.log("REFERENCE_TITLE_SURFACES=" + titles.length);
for (const t of titles) console.log("  " + t.contentId + " | jp=" + t.jp + " | en=" + t.en);
