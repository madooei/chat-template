import { vi } from "vitest";
import { streamMastraChat } from "../ai";

// Hoist mocks so vi.mock() factory can access them
const { mockStream, mockGetAgent, MockMastraClientFn } = vi.hoisted(() => {
  const mockStream = vi.fn();
  const mockGetAgent = vi.fn(() => ({ stream: mockStream }));
  // Must use regular function (not arrow) so `new` works
  const MockMastraClientFn = vi.fn(function () {
    return { getAgent: mockGetAgent };
  });
  return { mockStream, mockGetAgent, MockMastraClientFn };
});

vi.mock("@mastra/client-js", () => ({
  MastraClient: MockMastraClientFn,
}));

type ChunkCallback = (chunk: {
  type: string;
  payload: Record<string, unknown>;
}) => Promise<void>;

function mockAgentStream(
  chunks: { type: string; payload: Record<string, unknown> }[],
) {
  mockStream.mockResolvedValue({
    processDataStream: async ({ onChunk }: { onChunk: ChunkCallback }) => {
      for (const chunk of chunks) {
        await onChunk(chunk);
      }
    },
  });
}

describe("streamMastraChat", () => {
  const baseOpts = {
    endpoint: "http://localhost:4111",
    agentId: "research-agent",
    messages: [{ role: "user" as const, content: "Hi" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAgent.mockReturnValue({ stream: mockStream });
  });

  it("creates MastraClient with correct baseUrl", async () => {
    mockAgentStream([]);

    await streamMastraChat(baseOpts);

    expect(MockMastraClientFn).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: "http://localhost:4111" }),
    );
  });

  it("gets the correct agent by ID", async () => {
    mockAgentStream([]);

    await streamMastraChat(baseOpts);

    expect(mockGetAgent).toHaveBeenCalledWith("research-agent");
  });

  it("streams text-delta chunks and calls onChunk/onFinish", async () => {
    mockAgentStream([
      { type: "text-delta", payload: { text: "Hello " } },
      { type: "text-delta", payload: { text: "World" } },
    ]);

    const onChunk = vi.fn();
    const onFinish = vi.fn();

    await streamMastraChat({ ...baseOpts, onChunk, onFinish });

    expect(onChunk).toHaveBeenCalledWith("Hello ");
    expect(onChunk).toHaveBeenCalledWith("Hello World");
    expect(onFinish).toHaveBeenCalledWith("Hello World");
  });

  it("non-text chunks do not affect text accumulation", async () => {
    mockAgentStream([
      { type: "start", payload: {} },
      { type: "step-start", payload: {} },
      {
        type: "tool-call",
        payload: {
          toolCallId: "tc-1",
          toolName: "webSearch",
          args: { query: "test" },
        },
      },
      {
        type: "tool-result",
        payload: {
          toolCallId: "tc-1",
          toolName: "webSearch",
          result: "some result",
        },
      },
      { type: "text-delta", payload: { text: "Final answer" } },
      { type: "finish", payload: {} },
    ]);

    const onChunk = vi.fn();
    const onFinish = vi.fn();

    await streamMastraChat({ ...baseOpts, onChunk, onFinish });

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith("Final answer");
  });

  it("calls onToolCall when tool-call chunks arrive", async () => {
    mockAgentStream([
      {
        type: "tool-call",
        payload: {
          toolCallId: "tc-1",
          toolName: "webSearchTool",
          args: { query: "AI news" },
        },
      },
      {
        type: "tool-call",
        payload: {
          toolCallId: "tc-2",
          toolName: "evaluateResultTool",
          args: { url: "https://example.com" },
        },
      },
      { type: "text-delta", payload: { text: "Done" } },
    ]);

    const onToolCall = vi.fn();

    await streamMastraChat({ ...baseOpts, onToolCall });

    expect(onToolCall).toHaveBeenCalledTimes(2);
    expect(onToolCall).toHaveBeenCalledWith({
      toolCallId: "tc-1",
      toolName: "webSearchTool",
      args: { query: "AI news" },
    });
    expect(onToolCall).toHaveBeenCalledWith({
      toolCallId: "tc-2",
      toolName: "evaluateResultTool",
      args: { url: "https://example.com" },
    });
  });

  it("calls onToolResult when tool-result chunks arrive", async () => {
    mockAgentStream([
      {
        type: "tool-result",
        payload: {
          toolCallId: "tc-1",
          toolName: "webSearchTool",
          result: { data: "search results" },
          isError: false,
        },
      },
      {
        type: "tool-result",
        payload: {
          toolCallId: "tc-2",
          toolName: "evaluateResultTool",
          result: null,
          isError: true,
        },
      },
      { type: "text-delta", payload: { text: "Done" } },
    ]);

    const onToolResult = vi.fn();

    await streamMastraChat({ ...baseOpts, onToolResult });

    expect(onToolResult).toHaveBeenCalledTimes(2);
    expect(onToolResult).toHaveBeenCalledWith({
      toolCallId: "tc-1",
      toolName: "webSearchTool",
      result: { data: "search results" },
      isError: false,
    });
    expect(onToolResult).toHaveBeenCalledWith({
      toolCallId: "tc-2",
      toolName: "evaluateResultTool",
      result: null,
      isError: true,
    });
  });

  it("calls onError when stream throws", async () => {
    mockStream.mockRejectedValue(new Error("Connection failed"));

    const onError = vi.fn();

    await streamMastraChat({ ...baseOpts, onError });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Connection failed" }),
    );
  });

  it("silently ignores AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    mockStream.mockRejectedValue(abortError);

    const onError = vi.fn();

    await streamMastraChat({ ...baseOpts, onError });

    expect(onError).not.toHaveBeenCalled();
  });

  it("passes abortSignal to MastraClient", async () => {
    mockAgentStream([]);
    const controller = new AbortController();

    await streamMastraChat({
      ...baseOpts,
      abortSignal: controller.signal,
    });

    expect(MockMastraClientFn).toHaveBeenCalledWith(
      expect.objectContaining({ abortSignal: controller.signal }),
    );
  });

  it("passes messages to agent.stream", async () => {
    mockAgentStream([]);
    const messages = [
      { role: "user" as const, content: "Hello" },
      { role: "assistant" as const, content: "Hi there" },
      { role: "user" as const, content: "How are you?" },
    ];

    await streamMastraChat({ ...baseOpts, messages });

    expect(mockStream).toHaveBeenCalledWith(messages);
  });
});
