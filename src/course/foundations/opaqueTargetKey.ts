/**
 * A non-reversible opaque token for a target's visible answer key (the
 * canonical Japanese string). Emitting the raw key as review or DOM metadata
 * would leak the answer, so a stable FNV-1a hash stands in: any observer
 * (a review harness, an e2e test) can still tell targets apart and count
 * reuse without any Japanese ever appearing in a `data-*` attribute. Pure and
 * deterministic.
 *
 * Shared by both the fixture-only {@link PracticeRounds} harness and the
 * real production exercise renderer (`Exercise.tsx`) so the two surfaces
 * never drift into two different hashes for the same underlying key. It
 * lives in its own tiny module (not inside `PracticeRounds.tsx`, which is
 * fixture-only and deliberately never imported by production code) so a
 * production import of this function can never pull the fixture harness's
 * React component tree into the real bundle.
 */
export function opaqueTargetKey(visibleTargetKey: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < visibleTargetKey.length; i++) {
    hash ^= visibleTargetKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `k${(hash >>> 0).toString(36)}`;
}
