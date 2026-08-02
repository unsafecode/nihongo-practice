# Standards-language review — 2026-07-18

Required by Section 21.4 item 10 and Section 3.2 of the master design
specification. Every learner-facing claim that mentions a level, a framework
or a curriculum, checked against the four cited sources.

## Sources consulted

| # | Source | Read on |
| --- | --- | --- |
| 1 | Irodori: What is "Japanese for Life in Japan"? — https://www.irodori.jpf.go.jp/en/about.html | 2026-07-18 |
| 2 | Japan Foundation: Irodori overview, level mapping, Can-dos, contextual kanji — https://www.jpf.go.jp/e/project/japanese/teach/tsushin/news/202105.html | 2026-07-18 |
| 3 | Council of Europe: CEFR level descriptions — https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions | 2026-07-18 |
| 4 | Council of Europe: CEFR global scale — https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale | 2026-07-18 |

## Claim-by-claim findings

| Claim (verbatim) | Where | Source checked | Verdict | Action |
| --- | --- | --- | --- | --- |
| "A1, aligned with JF/CEFR Can-do" | `en.ts:42` (levelBadge) | 2, 3 | unattributed | Changed to "A1, our alignment to JF/CEFR Can-do descriptors" — carries both the alignment claim (matching `sourceNote: "product-authored-jf-cefr-aligned"`) and explicit authorship ("our"), closing the attribution gap without understating. |
| "A1, allineato al Can-do JF/CEFR" | `it.ts:42` (levelBadge) | 2, 3 | unattributed | Changed to "A1, il nostro allineamento ai descrittori Can-do JF/CEFR" — same fix in Italian. |
| "A2, aligned with JF/CEFR Can-do" | `en.ts:68` (a2Badge) | 2, 3 | unattributed | Changed to "A2, our alignment to JF/CEFR Can-do descriptors". |
| "A2, allineato ai Can-do JF/CEFR" | `it.ts:68` (a2Badge) | 2, 3 | unattributed | Changed to "A2, il nostro allineamento ai descrittori Can-do JF/CEFR". |
| "…, aligned with A2-level outcomes." (4 EN scenario Can-do descriptors) | `canDos.ts:633,635,637,639` | 2, 4 | overclaims | Removed. Alignment claims do not belong inside first-person learner statements ("I can…"). Only 4 of 59 Can-dos carried this tail, making it inconsistent. The alignment is already stated at badge level. |
| "…, in linea con gli obiettivi di livello A2." (4 IT scenario Can-do descriptors) | `canDos.ts:753,755,757,759` | 2, 4 | overclaims | Removed — same rationale as the EN counterpart. |
| "Can-do" used as terminology label | `en.ts:49,60,136`; `it.ts:49,60,138` | 2, 3 | supported | No change. "Can-do" is legitimate terminology in both the JF Standard (source 2: "learning goals are called 'Can-dos'") and CEFR (source 3: "levels are defined through 'can-do' descriptors"). |
| "A1" / "A2" used as level names | `en.ts:56,64-67,70,72,73`; `it.ts` equivalents | 3, 4 | supported | No change. These are CEFR's own level designators; using them as labels is standard practice and requires no attribution. |

### Non-rendering claims (Group B — assessed but no corrective action needed)

| Claim (verbatim) | Where | Renders? | Assessment |
| --- | --- | --- | --- |
| "A second step in everyday Japanese, aligned with the JF Standard and CEFR A2 descriptors." | `a2/catalog/catalog.ts:162` (EN); `:168` (IT) | No — `alignmentCopyId` is not consumed by any component (`grep -rn 'alignmentCopyId' src/course/components/ src/components/` returns nothing) | Better-attributed than the badge (names "JF Standard" in full), but currently invisible. No corrective action: it does not reach learners, and if it ever surfaces, its wording is already defensible. |
| "A first foundation in everyday Japanese (see the A1 release for the full alignment claim)." | `a2/catalog/catalog.ts:164` | No — same evidence | Internal cross-reference. No learner impact. |
| `sourceNote: "product-authored-jf-cefr-aligned"` | `foundations/types.ts:98`, used in catalogs/validators | No — `grep -rn 'sourceNote' src/course/components/ src/components/` returns nothing | Machine-readable qualifier correctly stating the alignment is product-authored. This is exactly the attribution the badges were missing. No change needed — it serves its purpose as a data-model assertion for validators. |

## Attribution check

Section 3.2 requires that the product does not copy Irodori's curriculum,
texts or assessment, and does not claim Japan Foundation approval.

- Curriculum: Not copied. The product's 27 modules (12 A1 + 15 A2), 108 lessons, and 74 Can-do descriptors (15 A1 + 59 A2) are product-authored. Irodori Starter has a different module structure. The product targets the same CEFR levels but implements its own progression.
- Texts: Not copied. All lesson sentences are generated from product-authored templates (809 realized sentences, none sourced from Irodori materials). Source 1 contains no license for text reuse; no text was reused.
- Assessment: Not copied. The checkpoint system (Can-do evidence collection) is product-authored. Irodori's assessment approach is not replicated.
- Approval/endorsement language: None present. Source 1 contains no approval, endorsement, licensing or third-party-use language of any kind. The product's badges now say "our alignment to" (not bare "aligned with" or "certified by"), making explicit that the alignment is the product's own self-assessment, not an external accreditation. The `sourceNote` value `"product-authored-jf-cefr-aligned"` correctly encodes this same claim in the data model.

## Outcome

The shipped learner-facing language required two corrections, both applied in this commit. The level badges used "aligned with" without attributing who performed the alignment — structurally identical to the kanji-in-sentences defect (a qualification true in the data model but invisible in the UI, since `sourceNote: "product-authored-jf-cefr-aligned"` never renders). The fix changes "aligned with JF/CEFR Can-do" to "our alignment to JF/CEFR Can-do descriptors," which asserts alignment (matching the data model's own claim) while explicitly attributing it to the product ("our"), closing the attribution gap without trading it for an understatement. Four scenario Can-do descriptors carried an inconsistent alignment tail inside first-person learner statements; these were removed since the alignment is already stated at badge level and does not belong in the learner's voice. After these changes, every learner-facing claim is defensible against all four sources without implying external accreditation or Japan Foundation approval.
