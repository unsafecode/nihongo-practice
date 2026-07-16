import type { ExerciseKind } from "../exercises/types";
import type {
  ContextId,
  LessonId,
  LexemeSenseId,
  PedagogicalUse,
  PersonRoleId,
  PracticeRoundId,
  RealizedSentence,
  SentenceFamilyId,
  SentenceVariant,
  SentenceVariantId,
} from "./types";

/**
 * Deterministic practice-target selection (design spec §11.1-§11.3, §16;
 * Phase 1 Task 3). `selectVariants` turns one round's candidate pool —
 * already-authored `SentenceVariant`s paired with their `RealizedSentence`s —
 * into an ordered, typed `SelectedPracticeTarget[]`, or a deterministic,
 * ordered list of `SelectVariantsError`s. Nothing here reads ambient state,
 * locale, or relies on object/array iteration order: every input is explicit,
 * candidate order is normalized before ranking, and ranking itself is a pure
 * FNV-1a hash of `catalogVersion|lessonId|roundId|seed|candidateId` (tie-break
 * candidate id). Exercise kinds are assigned only *after* a valid target set
 * has been selected — a candidate is never treated as if it already "were" a
 * kind.
 */

// ---------------------------------------------------------------------------
// Deterministic hashing
// ---------------------------------------------------------------------------

/** Pure FNV-1a 32-bit hash (unsigned). Same input always yields same output,
 * independent of platform/locale/run — used as the sole source of "randomness"
 * for tie-ordering and choice throughout this module. */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function compareIds(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

// ---------------------------------------------------------------------------
// Fingerprint parsing / honest transformation-axis detection
// ---------------------------------------------------------------------------

/** Parses a `RealizedSentence.semanticFingerprint` into its `key=value`
 * segments. Pure string parsing only — never re-derives meaning beyond what
 * the fingerprint already encodes. */
export function parseFingerprint(fingerprint: string): Readonly<Record<string, string>> {
  const record: Record<string, string> = {};
  for (const part of fingerprint.split("|")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;
    record[part.slice(0, separatorIndex)] = part.slice(separatorIndex + 1);
  }
  return record;
}

/** The minimal shape `transformationAxis` needs — satisfied structurally by
 * both `RealizedSentence` and `SelectedPracticeTarget` (via small adapters
 * below), so a compatible transformation source can be found across rounds
 * even when only the earlier round's `SelectedPracticeTarget` (not its full
 * `RealizedSentence`) is available. */
export interface FingerprintedSentence {
  readonly variantId: string;
  readonly familyId: string;
  readonly predicateSenseId: string;
  readonly semanticFingerprint: string;
}

export function fingerprintedFromRealized(sentence: RealizedSentence): FingerprintedSentence {
  return {
    variantId: sentence.variantId,
    familyId: sentence.familyId,
    predicateSenseId: sentence.predicateSenseId,
    semanticFingerprint: sentence.semanticFingerprint,
  };
}

export function fingerprintedFromSelected(target: SelectedPracticeTarget): FingerprintedSentence {
  return {
    variantId: target.variantId,
    familyId: target.sentenceFamilyId,
    predicateSenseId: target.predicateSenseId,
    semanticFingerprint: target.semanticFingerprint,
  };
}

/**
 * Detects whether `target` is an *honest* single-axis (tense XOR polarity)
 * grammatical transformation of `source`: every other semantic dimension
 * encoded in the fingerprint (family, discourse, sense, context, formality,
 * slots) must be identical, and exactly one of polarity/tense may differ.
 * Returns `null` when no honest transformation relationship exists — the
 * caller must never label a semantic substitution as a transformation.
 */
export function transformationAxis(
  source: FingerprintedSentence,
  target: FingerprintedSentence,
): "tense" | "polarity" | null {
  if (source.variantId === target.variantId) return null;
  if (source.familyId !== target.familyId) return null;
  if (source.predicateSenseId !== target.predicateSenseId) return null;

  const sourceFields = parseFingerprint(source.semanticFingerprint);
  const targetFields = parseFingerprint(target.semanticFingerprint);
  const keys = new Set([...Object.keys(sourceFields), ...Object.keys(targetFields)]);
  for (const key of keys) {
    if (key === "form") continue;
    if (sourceFields[key] !== targetFields[key]) return null;
  }

  const sourceForm = (sourceFields.form ?? "").split(":");
  const targetForm = (targetFields.form ?? "").split(":");
  if (sourceForm.length !== 3 || targetForm.length !== 3) return null;
  const [sourcePolarity, sourceTense, sourceFormality] = sourceForm;
  const [targetPolarity, targetTense, targetFormality] = targetForm;
  if (sourceFormality !== targetFormality) return null;

  const polarityDiffers = sourcePolarity !== targetPolarity;
  const tenseDiffers = sourceTense !== targetTense;
  if (polarityDiffers && !tenseDiffers) return "polarity";
  if (tenseDiffers && !polarityDiffers) return "tense";
  return null;
}

// ---------------------------------------------------------------------------
// Deterministic blank/distractor selection (shared with the practice engine)
// ---------------------------------------------------------------------------

function isBlankable(token: RealizedSentence["tokens"][number]): boolean {
  return token.kind === "particle" || token.kind === "morpheme";
}

/** Deterministically picks the single eligible (particle/morpheme) token to
 * blank for a `choice` exercise: lowest `fnv1a32(seed|"blank"|tokenId)` rank,
 * tie-broken by token id. Returns `undefined` when no eligible token exists. */
export function pickBlankToken(
  seed: string,
  sentence: RealizedSentence,
): RealizedSentence["tokens"][number] | undefined {
  const eligible = sentence.tokens.filter(isBlankable);
  if (eligible.length === 0) return undefined;
  const ranked = eligible
    .map((token) => ({ token, rank: fnv1a32(`${seed}|blank|${token.id}`) }))
    .sort((left, right) => (left.rank !== right.rank ? left.rank - right.rank : compareIds(left.token.id, right.token.id)));
  return ranked[0].token;
}

/** Deterministically picks one-or-more eligible (particle/morpheme) tokens to
 * blank for a `completion` exercise, in original sentence order. The *count*
 * of blanks is itself seed-derived (bounded to the number of eligible
 * tokens), so identical input/seed always yields the identical blank set. */
export function pickCompletionBlanks(
  seed: string,
  sentence: RealizedSentence,
): readonly RealizedSentence["tokens"][number][] {
  const eligible = sentence.tokens.filter(isBlankable);
  if (eligible.length === 0) return [];
  const ranked = eligible
    .map((token) => ({ token, rank: fnv1a32(`${seed}|completion-blank|${token.id}`) }))
    .sort((left, right) => (left.rank !== right.rank ? left.rank - right.rank : compareIds(left.token.id, right.token.id)));
  const countRank = fnv1a32(`${seed}|completion-count|${sentence.variantId}`);
  const blankCount = (countRank % ranked.length) + 1;
  const chosenIds = new Set(ranked.slice(0, blankCount).map((entry) => entry.token.id));
  return sentence.tokens.filter((token) => chosenIds.has(token.id));
}

/** Deterministically picks up to `max` distractor tokens for a `choice`
 * exercise: eligible (particle/morpheme) tokens from *other* sentences whose
 * rendered `jp` text is visibly distinct from `blank.jp` and from each other,
 * ranked by `fnv1a32(seed|"distractor"|tokenId)`, tie-broken by token id. */
export function pickDistractorTokens(
  seed: string,
  blank: RealizedSentence["tokens"][number],
  pool: readonly RealizedSentence[],
  excludeVariantId: string,
  max = 3,
): readonly { readonly sentence: RealizedSentence; readonly token: RealizedSentence["tokens"][number] }[] {
  const candidates: { readonly sentence: RealizedSentence; readonly token: RealizedSentence["tokens"][number] }[] = [];
  for (const sentence of pool) {
    if (sentence.variantId === excludeVariantId) continue;
    for (const token of sentence.tokens) {
      if (!isBlankable(token)) continue;
      if (token.jp === blank.jp) continue;
      candidates.push({ sentence, token });
    }
  }
  const ranked = candidates
    .map((entry) => ({ entry, rank: fnv1a32(`${seed}|distractor|${entry.token.id}`) }))
    .sort((left, right) => (left.rank !== right.rank ? left.rank - right.rank : compareIds(left.entry.token.id, right.entry.token.id)));

  const chosen: { readonly sentence: RealizedSentence; readonly token: RealizedSentence["tokens"][number] }[] = [];
  const seenJp = new Set<string>();
  for (const { entry } of ranked) {
    if (seenJp.has(entry.token.jp)) continue;
    seenJp.add(entry.token.jp);
    chosen.push(entry);
    if (chosen.length >= max) break;
  }
  return chosen;
}

/** Deterministically picks the compatible transformation source (if any) for
 * `target` from `pool`, ranked by `fnv1a32("transform-source"|targetId|sourceId)`,
 * tie-broken by source variant id. Returns `undefined` when no compatible
 * source exists in `pool` (transformation is then ineligible, never faked). */
export function findTransformationSource(
  target: FingerprintedSentence,
  pool: readonly FingerprintedSentence[],
): FingerprintedSentence | undefined {
  const compatible = pool.filter(
    (candidate) => candidate.variantId !== target.variantId && transformationAxis(candidate, target) !== null,
  );
  if (compatible.length === 0) return undefined;
  const ranked = compatible
    .map((candidate) => ({
      candidate,
      rank: fnv1a32(`transform-source|${target.variantId}|${candidate.variantId}`),
    }))
    .sort((left, right) =>
      left.rank !== right.rank ? left.rank - right.rank : compareIds(left.candidate.variantId, right.candidate.variantId),
    );
  return ranked[0].candidate;
}

// ---------------------------------------------------------------------------
// Public input/output/error contracts
// ---------------------------------------------------------------------------

/** One round candidate: an authored variant paired with its realization. */
export interface PracticeCandidate {
  readonly variant: SentenceVariant;
  readonly sentence: RealizedSentence;
}

/** A minimal, operation-local view of `PracticeRoundDefinition` (spec
 * §11.1) — the exact fields `selectVariants` needs to resolve candidates and
 * assign kinds. Structurally compatible with the full type, so a caller may
 * pass a `PracticeRoundDefinition` fixture directly. */
export interface SelectVariantsRoundInput {
  readonly id: PracticeRoundId;
  readonly purpose: "guided-controlled" | "transfer";
  readonly candidateVariantIds: readonly SentenceVariantId[];
  readonly exerciseKinds: readonly ExerciseKind[];
  readonly targetCount: number;
}

/** Explicit, round-scoped constraints derived by the caller from a lesson's
 * `LessonDiversityConstraints` (spec §9.1). Family/predicate/role/context and
 * unique-visible-target distinctness, plus visible-target reuse, are always
 * evaluated over this round's selection *combined with* `alreadySelected` —
 * so a caller can enforce whole-lesson thresholds on the final round by
 * passing the previous round's output as `alreadySelected`. */
export interface SelectVariantsRoundConstraints {
  readonly minFamilies: number;
  readonly minPredicates: number;
  readonly minRoles: number;
  readonly minContexts: number;
  readonly minUniqueVisibleTargets: number;
  readonly maxVisibleReuse: number;
  readonly minTransferTargets: number;
  readonly requireControlledConstruction: boolean;
}

export interface SelectVariantsInput {
  readonly catalogVersion: string;
  readonly lessonId: LessonId;
  readonly round: SelectVariantsRoundInput;
  readonly seed: string;
  readonly candidates: readonly PracticeCandidate[];
  readonly modelSemanticFingerprints: readonly string[];
  readonly alreadySelected: readonly SelectedPracticeTarget[];
  readonly constraints: SelectVariantsRoundConstraints;
}

export type ConstraintDimension =
  | "family"
  | "role"
  | "predicate"
  | "context"
  | "unique-visible-target"
  | "max-visible-reuse"
  | "transfer-count";

export type SelectVariantsErrorCode =
  | "duplicate-candidate-id"
  | "unknown-candidate"
  | "insufficient-candidates"
  | "constraint-unsatisfied"
  | "missing-controlled-transfer"
  | "model-duplicate-transfer";

export interface SelectVariantsError {
  readonly code: SelectVariantsErrorCode;
  readonly dimension?: ConstraintDimension;
  readonly referenceId?: string;
}

export interface SelectedPracticeTarget {
  readonly targetId: string;
  readonly roundId: PracticeRoundId;
  readonly variantId: SentenceVariantId;
  readonly sentenceFamilyId: SentenceFamilyId;
  readonly visibleTargetKey: string;
  readonly semanticFingerprint: string;
  readonly predicateSenseId: LexemeSenseId;
  readonly speakerRoleId: PersonRoleId;
  readonly contextId: ContextId;
  readonly pedagogicalUse: PedagogicalUse;
  readonly exerciseKind: ExerciseKind;
  readonly sourceVariantId?: SentenceVariantId;
}

export type SelectVariantsResult =
  | { readonly ok: true; readonly targets: readonly SelectedPracticeTarget[] }
  | { readonly ok: false; readonly errors: readonly SelectVariantsError[] };

// ---------------------------------------------------------------------------
// Candidate resolution (step 1)
// ---------------------------------------------------------------------------

interface ResolveResult {
  readonly ok: true;
  readonly resolved: readonly PracticeCandidate[];
}
interface ResolveFailure {
  readonly ok: false;
  readonly errors: readonly SelectVariantsError[];
}

function resolveCandidates(
  round: SelectVariantsRoundInput,
  candidates: readonly PracticeCandidate[],
): ResolveResult | ResolveFailure {
  const errors: SelectVariantsError[] = [];
  const byVariantId = new Map<string, PracticeCandidate>();
  for (const candidate of candidates) {
    if (byVariantId.has(candidate.variant.id)) {
      errors.push({ code: "duplicate-candidate-id", referenceId: candidate.variant.id });
      continue;
    }
    byVariantId.set(candidate.variant.id, candidate);
  }

  const seenRoundIds = new Set<string>();
  const resolved: PracticeCandidate[] = [];
  for (const id of round.candidateVariantIds) {
    if (seenRoundIds.has(id)) {
      errors.push({ code: "duplicate-candidate-id", referenceId: id });
      continue;
    }
    seenRoundIds.add(id);
    const found = byVariantId.get(id);
    if (!found) {
      errors.push({ code: "unknown-candidate", referenceId: id });
      continue;
    }
    resolved.push(found);
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, resolved };
}

// ---------------------------------------------------------------------------
// Ranking (steps 2-3)
// ---------------------------------------------------------------------------

interface RankedCandidate {
  readonly candidate: PracticeCandidate;
  readonly rank: number;
}

function rankCandidates(
  catalogVersion: string,
  lessonId: string,
  roundId: string,
  seed: string,
  eligible: readonly PracticeCandidate[],
): readonly RankedCandidate[] {
  // Normalize ordering by variant id first, so ranking never depends on the
  // caller's array order.
  const normalized = [...eligible].sort((left, right) => compareIds(left.variant.id, right.variant.id));
  return normalized
    .map((candidate) => ({
      candidate,
      rank: fnv1a32(`${catalogVersion}|${lessonId}|${roundId}|${seed}|${candidate.variant.id}`),
    }))
    .sort((left, right) =>
      left.rank !== right.rank ? left.rank - right.rank : compareIds(left.candidate.variant.id, right.candidate.variant.id),
    );
}

// ---------------------------------------------------------------------------
// Bounded deterministic backtracking search (step 4)
// ---------------------------------------------------------------------------

function distinctCount(map: ReadonlyMap<string, number>): number {
  return map.size;
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function decrement(map: Map<string, number>, key: string): void {
  const next = (map.get(key) ?? 0) - 1;
  if (next <= 0) map.delete(key);
  else map.set(key, next);
}

interface BaselineCounts {
  readonly families: Map<string, number>;
  readonly predicates: Map<string, number>;
  readonly roles: Map<string, number>;
  readonly contexts: Map<string, number>;
  readonly visible: Map<string, number>;
}

function baselineCountsFrom(alreadySelected: readonly SelectedPracticeTarget[]): BaselineCounts {
  const families = new Map<string, number>();
  const predicates = new Map<string, number>();
  const roles = new Map<string, number>();
  const contexts = new Map<string, number>();
  const visible = new Map<string, number>();
  for (const target of alreadySelected) {
    increment(families, target.sentenceFamilyId);
    increment(predicates, target.predicateSenseId);
    increment(roles, target.speakerRoleId);
    increment(contexts, target.contextId);
    increment(visible, target.visibleTargetKey);
  }
  return { families, predicates, roles, contexts, visible };
}

const BACKTRACK_CALL_LIMIT = 200_000;

function backtrackSelect(
  ranked: readonly RankedCandidate[],
  targetCount: number,
  baseline: BaselineCounts,
  constraints: SelectVariantsRoundConstraints,
): readonly RankedCandidate[] | null {
  const families = new Map(baseline.families);
  const predicates = new Map(baseline.predicates);
  const roles = new Map(baseline.roles);
  const contexts = new Map(baseline.contexts);
  const visible = new Map(baseline.visible);
  const chosen: RankedCandidate[] = [];
  const n = ranked.length;
  let calls = 0;

  function satisfiesFinal(): boolean {
    if (distinctCount(families) < constraints.minFamilies) return false;
    if (distinctCount(predicates) < constraints.minPredicates) return false;
    if (distinctCount(roles) < constraints.minRoles) return false;
    if (distinctCount(contexts) < constraints.minContexts) return false;
    if (distinctCount(visible) < constraints.minUniqueVisibleTargets) return false;
    const transferCount = chosen.filter((entry) => entry.candidate.sentence.pedagogicalUse === "transfer").length;
    if (transferCount < constraints.minTransferTargets) return false;
    return true;
  }

  function dfs(index: number): readonly RankedCandidate[] | null {
    calls += 1;
    if (calls > BACKTRACK_CALL_LIMIT) return null;
    if (chosen.length === targetCount) {
      return satisfiesFinal() ? [...chosen] : null;
    }
    if (index >= n) return null;
    if (n - index < targetCount - chosen.length) return null;

    const entry = ranked[index];
    const key = entry.candidate.sentence.visibleTargetKey;
    const currentReuse = visible.get(key) ?? 0;

    if (currentReuse < constraints.maxVisibleReuse) {
      chosen.push(entry);
      increment(families, entry.candidate.sentence.familyId);
      increment(predicates, entry.candidate.sentence.predicateSenseId);
      increment(roles, entry.candidate.sentence.discourse.speakerRoleId);
      increment(contexts, entry.candidate.sentence.contextId);
      increment(visible, key);

      const included = dfs(index + 1);
      if (included) return included;

      chosen.pop();
      decrement(families, entry.candidate.sentence.familyId);
      decrement(predicates, entry.candidate.sentence.predicateSenseId);
      decrement(roles, entry.candidate.sentence.discourse.speakerRoleId);
      decrement(contexts, entry.candidate.sentence.contextId);
      decrement(visible, key);
    }

    return dfs(index + 1);
  }

  return dfs(0);
}

function diagnoseInfeasibility(
  ranked: readonly RankedCandidate[],
  targetCount: number,
  baseline: BaselineCounts,
  constraints: SelectVariantsRoundConstraints,
): SelectVariantsError {
  const allFamilies = new Set(baseline.families.keys());
  const allPredicates = new Set(baseline.predicates.keys());
  const allRoles = new Set(baseline.roles.keys());
  const allContexts = new Set(baseline.contexts.keys());
  const allVisible = new Set(baseline.visible.keys());
  for (const entry of ranked) {
    allFamilies.add(entry.candidate.sentence.familyId);
    allPredicates.add(entry.candidate.sentence.predicateSenseId);
    allRoles.add(entry.candidate.sentence.discourse.speakerRoleId);
    allContexts.add(entry.candidate.sentence.contextId);
    allVisible.add(entry.candidate.sentence.visibleTargetKey);
  }

  if (allFamilies.size < constraints.minFamilies) {
    return { code: "constraint-unsatisfied", dimension: "family" };
  }
  if (allPredicates.size < constraints.minPredicates) {
    return { code: "constraint-unsatisfied", dimension: "predicate" };
  }
  if (allRoles.size < constraints.minRoles) {
    return { code: "constraint-unsatisfied", dimension: "role" };
  }
  if (allContexts.size < constraints.minContexts) {
    return { code: "constraint-unsatisfied", dimension: "context" };
  }
  if (allVisible.size < constraints.minUniqueVisibleTargets) {
    return { code: "constraint-unsatisfied", dimension: "unique-visible-target" };
  }
  const eligibleTransferCount = ranked.filter((entry) => entry.candidate.sentence.pedagogicalUse === "transfer").length;
  if (eligibleTransferCount < constraints.minTransferTargets) {
    return { code: "constraint-unsatisfied", dimension: "transfer-count" };
  }

  const capacityByKey = new Map<string, number>();
  for (const entry of ranked) {
    const key = entry.candidate.sentence.visibleTargetKey;
    capacityByKey.set(key, (capacityByKey.get(key) ?? 0) + 1);
  }
  let totalCapacity = 0;
  for (const [key, count] of capacityByKey) {
    const already = baseline.visible.get(key) ?? 0;
    const remaining = Math.max(0, constraints.maxVisibleReuse - already);
    totalCapacity += Math.min(count, remaining);
  }
  if (totalCapacity < targetCount) {
    return { code: "constraint-unsatisfied", dimension: "max-visible-reuse" };
  }

  // Every individual dimension is independently satisfiable by the full
  // eligible pool, but no exact-size combination satisfies all of them
  // simultaneously (a genuine joint infeasibility). Report the
  // highest-priority dimension as the actionable starting point.
  return { code: "constraint-unsatisfied", dimension: "unique-visible-target" };
}

// ---------------------------------------------------------------------------
// Exercise-kind assignment (step 8) — only after a valid target set exists
// ---------------------------------------------------------------------------

function eligibleKindsFor(
  entry: RankedCandidate,
  others: readonly RankedCandidate[],
  exerciseKinds: readonly ExerciseKind[],
  transformationPool: readonly FingerprintedSentence[],
): readonly ExerciseKind[] {
  const sentence = entry.candidate.sentence;
  const blankable = sentence.tokens.filter(isBlankable);
  const result: ExerciseKind[] = [];

  for (const kind of exerciseKinds) {
    switch (kind) {
      case "tile-ordering":
        if (sentence.tokens.length > 0) result.push(kind);
        break;
      case "constrained-construction":
        result.push(kind);
        break;
      case "completion":
        if (blankable.length > 0) result.push(kind);
        break;
      case "choice": {
        if (blankable.length === 0) break;
        const blankJp = new Set(blankable.map((token) => token.jp));
        const hasDistractor = others.some((other) =>
          other.candidate.sentence.tokens.some((token) => isBlankable(token) && !blankJp.has(token.jp)),
        );
        if (hasDistractor) result.push(kind);
        break;
      }
      case "transformation": {
        const target = fingerprintedFromRealized(sentence);
        if (findTransformationSource(target, transformationPool) !== undefined) result.push(kind);
        break;
      }
    }
  }
  return result;
}

function assignExerciseKinds(
  ranked: readonly RankedCandidate[],
  round: SelectVariantsRoundInput,
  constraints: SelectVariantsRoundConstraints,
  alreadySelected: readonly SelectedPracticeTarget[],
): { readonly ok: true; readonly targets: readonly SelectedPracticeTarget[] } | { readonly ok: false; readonly error: SelectVariantsError } {
  const ordered = [...ranked].sort((left, right) =>
    left.rank !== right.rank ? left.rank - right.rank : compareIds(left.candidate.variant.id, right.candidate.variant.id),
  );

  const transformationPool: FingerprintedSentence[] = [
    ...ordered.map((entry) => fingerprintedFromRealized(entry.candidate.sentence)),
    ...alreadySelected.map(fingerprintedFromSelected),
  ];

  const eligibility = new Map<RankedCandidate, readonly ExerciseKind[]>();
  for (const entry of ordered) {
    const others = ordered.filter((candidate) => candidate !== entry);
    eligibility.set(entry, eligibleKindsFor(entry, others, round.exerciseKinds, transformationPool));
  }

  const assigned = new Map<RankedCandidate, ExerciseKind>();

  if (round.purpose === "transfer" && constraints.requireControlledConstruction) {
    const ccEntry = ordered.find((entry) => eligibility.get(entry)!.includes("constrained-construction"));
    if (!ccEntry) return { ok: false, error: { code: "missing-controlled-transfer" } };
    assigned.set(ccEntry, "constrained-construction");

    let assignedOther = false;
    for (const entry of ordered) {
      if (entry === ccEntry) continue;
      const otherKinds = eligibility.get(entry)!.filter((kind) => kind !== "constrained-construction");
      if (otherKinds.length > 0) {
        assigned.set(entry, otherKinds[0]);
        assignedOther = true;
      }
    }
    if (!assignedOther) return { ok: false, error: { code: "missing-controlled-transfer" } };

    for (const entry of ordered) {
      if (assigned.has(entry)) continue;
      const kinds = eligibility.get(entry)!;
      if (kinds.length === 0) return { ok: false, error: { code: "missing-controlled-transfer" } };
      assigned.set(entry, kinds.includes("constrained-construction") ? "constrained-construction" : kinds[0]);
    }
  } else {
    ordered.forEach((entry, index) => {
      const kinds = eligibility.get(entry)!;
      if (kinds.length === 0) {
        assigned.set(entry, round.exerciseKinds[0]);
        return;
      }
      const preferredIndex = index % round.exerciseKinds.length;
      let chosenKind: ExerciseKind | undefined;
      for (let offset = 0; offset < round.exerciseKinds.length; offset += 1) {
        const candidateKind = round.exerciseKinds[(preferredIndex + offset) % round.exerciseKinds.length];
        if (kinds.includes(candidateKind)) {
          chosenKind = candidateKind;
          break;
        }
      }
      assigned.set(entry, chosenKind ?? kinds[0]);
    });
  }

  const targets: SelectedPracticeTarget[] = ordered.map((entry) => {
    const kind = assigned.get(entry) as ExerciseKind;
    const sourceVariantId =
      kind === "transformation"
        ? findTransformationSource(fingerprintedFromRealized(entry.candidate.sentence), transformationPool)?.variantId
        : undefined;
    const sentence = entry.candidate.sentence;
    return {
      targetId: `${round.id}::${entry.candidate.variant.id}`,
      roundId: round.id,
      variantId: entry.candidate.variant.id,
      sentenceFamilyId: sentence.familyId,
      visibleTargetKey: sentence.visibleTargetKey,
      semanticFingerprint: sentence.semanticFingerprint,
      predicateSenseId: sentence.predicateSenseId,
      speakerRoleId: sentence.discourse.speakerRoleId,
      contextId: sentence.contextId,
      pedagogicalUse: sentence.pedagogicalUse,
      exerciseKind: kind,
      ...(sourceVariantId !== undefined ? { sourceVariantId } : {}),
    };
  });

  return { ok: true, targets };
}

// ---------------------------------------------------------------------------
// selectVariants
// ---------------------------------------------------------------------------

export function selectVariants(input: SelectVariantsInput): SelectVariantsResult {
  const { catalogVersion, lessonId, round, seed, candidates, modelSemanticFingerprints, alreadySelected, constraints } =
    input;

  const resolution = resolveCandidates(round, candidates);
  if (!resolution.ok) return { ok: false, errors: resolution.errors };
  const resolved = resolution.resolved;

  if (round.purpose === "transfer") {
    const modelFingerprints = new Set(modelSemanticFingerprints);
    const duplicateErrors: SelectVariantsError[] = [];
    for (const candidate of resolved) {
      if (modelFingerprints.has(candidate.sentence.semanticFingerprint)) {
        duplicateErrors.push({ code: "model-duplicate-transfer", referenceId: candidate.variant.id });
      }
    }
    if (duplicateErrors.length > 0) return { ok: false, errors: duplicateErrors };
  }

  const eligible =
    round.purpose === "transfer" ? resolved.filter((candidate) => candidate.sentence.pedagogicalUse === "transfer") : resolved;

  if (eligible.length < round.targetCount) {
    return { ok: false, errors: [{ code: "insufficient-candidates" }] };
  }

  const ranked = rankCandidates(catalogVersion, lessonId, round.id, seed, eligible);
  const baseline = baselineCountsFrom(alreadySelected);

  const chosen = backtrackSelect(ranked, round.targetCount, baseline, constraints);
  if (!chosen) {
    return { ok: false, errors: [diagnoseInfeasibility(ranked, round.targetCount, baseline, constraints)] };
  }

  const assignment = assignExerciseKinds(chosen, round, constraints, alreadySelected);
  if (!assignment.ok) return { ok: false, errors: [assignment.error] };

  return { ok: true, targets: assignment.targets };
}
