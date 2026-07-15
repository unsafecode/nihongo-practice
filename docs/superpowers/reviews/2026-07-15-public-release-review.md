# Public Release Review Register — 2026-07-15

This is the authoritative public register of review-driven fixes applied on
top of the corrected v2.1 release commit `docs: prepare corrected v2.1
release` (`814c62d`). Every commit introduced after that point on this branch
must have its subject recorded here, together with the finding it addresses
and its resolution. Task 5, Step 9 of
`docs/superpowers/plans/2026-07-15-public-release-remediation.md` runs an
executable check that fails the release verification if any post-`814c62d`
commit subject is missing from this table. No secret values or private email
addresses are recorded here.

| Commit subject | Finding | Resolution |
| --- | --- | --- |
| `docs: fix release secret scan` | Step 8's secret-scan regex contained substrings that matched its own literal representation inside the plan file, so the step could report a false positive against itself. | Rewrote the regex using character-class equivalents (e.g. `github[_]pat_`, `DefaultEndpointsProtocol[=]`, `AccountKey[=]`) that still detect real secret strings but no longer match the pattern's own text in the plan. |
| `fix: normalize public lockfile` | `package-lock.json` was not normalized for the public release, leaving inconsistent entries. | Regenerated and normalized the lockfile entries so the committed `package-lock.json` is consistent for the public release. |
| `fix: sync Lab presets with route` | `Lab.tsx` read the preset, guided-return link, and initial selection from `useSearchParams` only once via lazy `useState`, so a hash/query change while `Lab` stayed mounted left the board and guided-return link stale. | Preset parsing and guided return now derive reactively via `useMemo` off the current `searchParams`, with an effect re-syncing the selection when the preset changes; added a Playwright regression covering an in-place guided-route change. |
| `fix: require complete comparison deltas` | `validateComparison` could accept a comparison whose `changedSegmentIds` under-declared the actual delta, omitting a genuinely introduced segment. | Added a two-way completeness check comparing declared changed gears against the full introduced-text set, rejecting under-declared deltas with a new `comparison-incomplete-delta` error code. |
| `fix: validate repeated comparison deltas` | The introduced-segment detection used a distinct-text set, so two introduced segments (or a repeated occurrence of existing text) sharing identical text could be miscounted, masking real completeness violations. | Replaced the distinct-text set with an occurrence/segment-id-based multiset walk so repeated identical text is tracked per occurrence instead of being collapsed. |
| `fix: reject duplicate comparison segment ids` | Segment id resolution falls back to the array index when `id` is unset, so an explicit id could collide with another segment's fallback index id within the same endpoint, silently corrupting every id-keyed check. | Added `findDuplicateEffectiveSegmentIds` and reject comparisons that contain duplicate effective segment ids in either endpoint before any id-keyed check runs. |
| `docs: keep release history check durable` | Step 9's expected history wording named a fixed count of hardening/reliability commits, which would go stale as further review fixes landed. | Reworded Step 9's expectation to describe commit categories (replayed design/plan, reviewed hardening/reliability fixes, no unrelated commits) instead of an exact count. |
| `docs: clarify release history categories` | The durable wording was still ambiguous about which commits belong in the log and how a reviewer could trace a given subject back to its origin. | Split the expectation into three explicit categories (Task 1 replay, Task 2–4 hardening, Task 5/final-review fixes) and required every subject to be traceable to the plan or a recorded review finding. |
| `docs: make release history auditable` | Step 9 required every subject to be traceable to a "recorded review finding," but no concrete, checkable artifact existed to record or verify those findings, leaving the traceability claim unverifiable. | Created this review register as the authoritative record of post-`814c62d` review fixes and added an executable Node check to Step 9 that fails if any post-`814c62d` commit subject is missing from the register. |
