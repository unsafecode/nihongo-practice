import { concepts } from "../../content/concepts";
import { resolveLabSelection } from "../../content/selection";
import type {
  LabSelection,
  Scenario,
  SemanticRole,
  TimeOption,
} from "../../content/types";
import { boundaryBefore } from "../../romaji/formatRomaji";
import type { AssembledToken } from "../../romaji/types";
import { assembleJP, type Assembled, type Segment } from "./assemble";
import { conjugate } from "./conjugate";

const JP_ROLE_ORDER: SemanticRole[] = [
  "actionPlace",
  "transport",
  "personTarget",
  "object",
  "destination",
  "vehicleBoarded",
];

export interface JapaneseSentencePart {
  id: string;
  kind: "time" | "slot" | "verb";
  jp: string;
  romaji: string;
  semanticRole?: SemanticRole;
  particle?: { jp: string; romaji: string; kind: "particle" };
  suffix?: { jp: string; romaji: string; kind: "ending" };
}

export interface JapaneseSentenceModel {
  scenario: Scenario;
  time: TimeOption;
  parts: JapaneseSentencePart[];
  tokens: readonly AssembledToken[];
  sentence: Assembled;
}

function labSource(referenceId: string) {
  return { domain: "lab" as const, referenceId };
}

function pushToken(
  tokens: AssembledToken[],
  token: Omit<AssembledToken, "boundaryBefore">,
): void {
  tokens.push({
    ...token,
    boundaryBefore: boundaryBefore(token.kind, tokens.length),
  });
}

export function buildJapaneseSentence(
  selection: LabSelection,
): JapaneseSentenceModel {
  const { scenario, time, slots } = resolveLabSelection(selection);
  const selected = slots
    .slice()
    .sort(
      (a, b) =>
        JP_ROLE_ORDER.indexOf(a.slot.semanticRole) -
        JP_ROLE_ORDER.indexOf(b.slot.semanticRole),
    );

  const conjugation = conjugate(scenario.verb, selection.form);
  if (conjugation.ending.length === 0) {
    throw new Error(
      `empty conjugation ending for ${scenario.id}:${selection.form}`,
    );
  }
  const stemJp = conjugation.jp.slice(0, -conjugation.ending.length);
  const parts: JapaneseSentencePart[] = [];
  const tokens: AssembledToken[] = [];
  if (time.jp) {
    parts.push({
      id: "time",
      kind: "time",
      jp: time.jp,
      romaji: time.romaji,
    });
    pushToken(tokens, {
      id: "time",
      jp: time.jp,
      romaji: time.romaji,
      kind: "lexical",
      source: labSource(`time:${time.id}`),
    });
  }
  for (const { slot, conceptId } of selected) {
    const concept = concepts[conceptId];
    parts.push({
      id: slot.id,
      kind: "slot",
      jp: concept.jp,
      romaji: concept.romaji,
      semanticRole: slot.semanticRole,
      particle: { ...slot.particle, kind: "particle" },
    });
    pushToken(tokens, {
      id: `${slot.id}-word`,
      jp: concept.jp,
      romaji: concept.romaji,
      kind: "lexical",
      source: labSource(`slot:${slot.id}:${conceptId}`),
    });
    pushToken(tokens, {
      id: `${slot.id}-particle`,
      jp: slot.particle.jp,
      romaji: slot.particle.romaji,
      kind: "particle",
      source: labSource(`slot:${slot.id}:particle`),
    });
  }
  parts.push({
    id: "verb",
    kind: "verb",
    jp: stemJp,
    romaji: scenario.verb.stemRomaji,
    suffix: {
      jp: conjugation.ending,
      romaji: conjugation.endingRomaji,
      kind: "ending",
    },
  });
  pushToken(tokens, {
    id: "verb-stem",
    jp: stemJp,
    romaji: scenario.verb.stemRomaji,
    kind: "lexical",
    source: labSource(`verb:${scenario.id}:${selection.form}:stem`),
  });
  pushToken(tokens, {
    id: "verb-suffix",
    jp: conjugation.ending,
    romaji: conjugation.endingRomaji,
    kind: "morpheme",
    source: labSource(`verb:${scenario.id}:${selection.form}:suffix`),
  });

  const segments: Segment[] = parts.map((part) => ({
    kind: part.kind,
    jp: `${part.jp}${part.suffix?.jp ?? ""}`,
    romaji: `${part.romaji}${part.suffix?.romaji ?? ""}`,
    particle: part.particle,
  }));

  return {
    scenario,
    time,
    parts,
    tokens,
    sentence: assembleJP(segments, tokens),
  };
}
