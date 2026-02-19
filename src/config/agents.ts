export interface AgentConfig {
  id: string;
  label: string;
  type: "direct" | "mastra";
  description: string;
  mastraAgentId?: string;
}

export const AVAILABLE_AGENTS: AgentConfig[] = [
  {
    id: "direct",
    label: "Direct Chat",
    type: "direct",
    description: "Chat directly with an LLM via OpenRouter",
  },
  {
    id: "deep-research",
    label: "Deep Research",
    type: "mastra",
    description: "AI agent that searches the web to research your question",
    mastraAgentId: "research-agent",
  },
];

export const DEFAULT_AGENT = "direct";

export function getAgentConfig(agentId: string | undefined): AgentConfig {
  return (
    AVAILABLE_AGENTS.find((a) => a.id === agentId) ??
    AVAILABLE_AGENTS.find((a) => a.id === DEFAULT_AGENT)!
  );
}
