export interface Particle {
  jp: string;
  romaji: string;
}

export interface Segment {
  kind: "time" | "place" | "transport" | "person" | "object" | "destination" | "verb";
  jp: string;
  romaji: string;
  particle?: Particle;
}

export interface Assembled {
  jp: string;
  romaji: string;
}

export function assembleJP(segments: Segment[]): Assembled {
  const present = segments.filter((s) => s.jp.length > 0);
  const jp = present
    .map((s) => s.jp + (s.particle ? s.particle.jp : ""))
    .join("");
  const romaji = present
    .flatMap((s) => (s.particle ? [s.romaji, s.particle.romaji] : [s.romaji]))
    .join(" ");
  return { jp, romaji };
}
