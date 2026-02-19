export type ToolCallPart = {
  toolCallId: string;
  toolName: string;
  state: "input-available" | "output-available";
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
};
