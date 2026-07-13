import type { LessonBlock as LessonBlockData } from "../data/types";
import { CalloutBlock } from "./CalloutBlock";
import { ComparisonBlock } from "./ComparisonBlock";
import { ExampleBlock } from "./ExampleBlock";
import { GuidedToolBlock } from "./GuidedToolBlock";
import { RuleBlock } from "./RuleBlock";
import { SummaryBlock } from "./SummaryBlock";

export function LessonBlock({ block }: { block: LessonBlockData }) {
  switch (block.type) {
    case "rule": return <RuleBlock block={block} />;
    case "examples": return <ExampleBlock block={block} />;
    case "comparison": return <ComparisonBlock block={block} />;
    case "callout": return <CalloutBlock block={block} />;
    case "guidedTool": return <GuidedToolBlock block={block} />;
    case "summary": return <SummaryBlock block={block} />;
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}
