export interface ToolEvent {
  id: string;
  toolName: string;
  status: "running" | "completed" | "error";
  args?: unknown;
  result?: unknown;
  timestamp: number;
}

export type ResearchPhase = "idle" | "researching" | "reporting";
