import { resolveLabSelection } from "../../content/selection";
import { classifyNaturalness } from "../../lab/engine/naturalness";
import type { Chapter, StaticExample } from "./types";

export function validateCourse(
  chapters: Chapter[],
  examples: Record<string, StaticExample>,
): string[] {
  const errors: string[] = [];
  const chapterIds = new Set<string>();
  const lessonIds = new Set<string>();
  for (const chapter of chapters) {
    if (chapterIds.has(chapter.id)) errors.push(`duplicate chapter:${chapter.id}`);
    chapterIds.add(chapter.id);
    for (const lesson of chapter.lessons) {
      if (lesson.chapterId !== chapter.id) {
        errors.push(`wrong chapter:${lesson.id}`);
      }
      if (lessonIds.has(lesson.id)) errors.push(`duplicate lesson:${lesson.id}`);
      lessonIds.add(lesson.id);
      for (const block of lesson.blocks) {
        if ("exampleIds" in block) {
          for (const id of block.exampleIds) {
            if (!examples[id]) errors.push(`unknown example:${lesson.id}:${id}`);
          }
        }
        if (block.type === "guidedTool" && block.target === "lab") {
          if (!block.preset) {
            errors.push(`missing preset:${lesson.id}`);
            continue;
          }
          try {
            resolveLabSelection(block.preset);
            const naturalness = classifyNaturalness(
              block.preset.form,
              block.preset.timeId,
            );
            if (naturalness !== "natural") {
              errors.push(`non-natural preset:${lesson.id}:${naturalness}`);
            }
          } catch (error) {
            const reason =
              error instanceof Error ? error.message : "unknown selection error";
            errors.push(`invalid preset:${lesson.id}:${reason}`);
          }
        }
      }
    }
  }
  for (const example of Object.values(examples)) {
    if (!example.segments) continue;
    if (example.segments.map((segment) => segment.jp).join("") !== example.jp) {
      errors.push(`example jp segments:${example.id}`);
    }
    if (
      example.segments.map((segment) => segment.romaji).join("") !==
      example.romaji
    ) {
      errors.push(`example romaji segments:${example.id}`);
    }
  }
  return errors;
}
