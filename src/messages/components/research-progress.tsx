import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Globe,
  FileSearch,
  Lightbulb,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader } from "@/components/prompt-kit/loader";
import { cn } from "@/lib/utils";
import type { ToolEvent, ResearchPhase } from "@/messages/types/research";

const TOOL_LABELS: Record<string, string> = {
  webSearchTool: "Searching the web",
  evaluateResultTool: "Evaluating result",
  extractLearningsTool: "Extracting insights",
};

function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName;
}

function ToolIcon({
  toolName,
  className,
}: {
  toolName: string;
  className?: string;
}) {
  switch (toolName) {
    case "webSearchTool":
      return <Globe className={className} />;
    case "evaluateResultTool":
      return <FileSearch className={className} />;
    case "extractLearningsTool":
      return <Lightbulb className={className} />;
    default:
      return <Globe className={className} />;
  }
}

function getSearchQuery(event: ToolEvent): string | null {
  if (event.toolName !== "webSearchTool" || !event.args) return null;
  const args = event.args as Record<string, unknown>;
  if (typeof args.query === "string") return args.query;
  return null;
}

interface ResearchProgressProps {
  phase: ResearchPhase;
  toolEvents: ToolEvent[];
}

function ToolEventItem({ event }: { event: ToolEvent }) {
  const [expanded, setExpanded] = useState(false);
  const query = getSearchQuery(event);
  const hasDetails = event.status === "completed" && event.result != null;

  return (
    <div className="flex flex-col">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 py-1 text-sm text-muted-foreground",
          hasDetails && "cursor-pointer hover:text-foreground",
          !hasDetails && "cursor-default",
        )}
      >
        {event.status === "running" ? (
          <Loader variant="circular" size="sm" className="h-3.5 w-3.5" />
        ) : event.status === "error" ? (
          <span className="text-destructive text-xs">!</span>
        ) : (
          <Check className="h-3.5 w-3.5 text-green-500" />
        )}
        <ToolIcon toolName={event.toolName} className="h-3.5 w-3.5" />
        <span>{getToolLabel(event.toolName)}</span>
        {query && (
          <span className="text-xs text-muted-foreground/70 truncate max-w-60">
            &mdash; &ldquo;{query}&rdquo;
          </span>
        )}
        {hasDetails && (
          <ChevronDown
            className={cn(
              "h-3 w-3 ml-auto transition-transform",
              expanded && "rotate-180",
            )}
          />
        )}
      </button>
      {expanded && hasDetails && (
        <pre className="ml-8 mt-1 mb-2 text-xs text-muted-foreground/70 bg-muted/50 rounded p-2 overflow-x-auto max-h-40 whitespace-pre-wrap">
          {typeof event.result === "string"
            ? event.result
            : JSON.stringify(event.result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function ResearchProgress({ phase, toolEvents }: ResearchProgressProps) {
  const isResearching = phase === "researching";
  const completedCount = toolEvents.filter(
    (e) => e.status === "completed",
  ).length;

  return (
    <div className="px-4 py-3">
      <Collapsible
        defaultOpen={isResearching}
        open={isResearching ? true : undefined}
      >
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
          {isResearching ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          {isResearching ? (
            <Loader variant="text-shimmer" size="sm" text="Researching" />
          ) : (
            <span className="text-sm text-muted-foreground">
              Research complete ({completedCount} steps)
            </span>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-6 mt-2 flex flex-col gap-0.5">
            {toolEvents.map((event) => (
              <ToolEventItem key={event.id} event={event} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
