export interface Particle {
  jp: string;
  romaji: string;
}

export interface Segment {
  kind: string;
  jp: string;
  romaji: string;
  particle?: Particle;
}

export interface Assembled {
  jp: string;
  romaji: string;
}

export function assembleJP(segments: Segment[]): Assembled {
  const present = segments.filter((segment) => segment.jp.length > 0);
  return {
    jp: present
      .map((segment) => segment.jp + (segment.particle?.jp ?? ""))
      .join(""),
    romaji: present
      .flatMap((segment) =>
        segment.particle
          ? [segment.romaji, segment.particle.romaji]
          : [segment.romaji],
      )
      .join(" "),
  };
}
