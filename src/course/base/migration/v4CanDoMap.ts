import { deepFreeze } from "../../foundations/deepFreeze";

export interface V4CanDoMigrationRow {
  readonly sourceLevel: "a1";
  readonly sourceCanDoId: string;
  readonly destinationLevel: "a0";
  readonly destinationCanDoId: string;
}

export const V4_CANDO_MIGRATION_MAP: readonly V4CanDoMigrationRow[] = deepFreeze([
  { sourceLevel: "a1", sourceCanDoId: "a1-can-do-sounds", destinationLevel: "a0", destinationCanDoId: "a1-can-do-sounds" },
  { sourceLevel: "a1", sourceCanDoId: "a1-can-do-sentence-foundations", destinationLevel: "a0", destinationCanDoId: "a1-can-do-sentence-foundations" },
  { sourceLevel: "a1", sourceCanDoId: "a1-can-do-topic-questions", destinationLevel: "a0", destinationCanDoId: "a1-can-do-topic-questions" },
  { sourceLevel: "a1", sourceCanDoId: "a1-can-do-polite-verbs", destinationLevel: "a0", destinationCanDoId: "a1-can-do-polite-verbs" },
  { sourceLevel: "a1", sourceCanDoId: "a1-can-do-time-movement", destinationLevel: "a0", destinationCanDoId: "a1-can-do-time-movement" },
]);
