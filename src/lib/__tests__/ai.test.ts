import { vi } from "vitest";
import { generateChatTitle, streamChat, streamMastraChat } from "../ai";

// Mock the AI SDK modules
vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: vi.fn(() => ({ chat: vi.fn() })),
}));

const { streamText } = await import("ai");
const mockStreamText = vi.mocked(streamText);

function createMockTextStream(chunks: string[]) {
  return {
    textStream: (async function* () {
      for (const chunk of chunks) {
        yield chunk;
      }
    })(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateChatTitle", () => {
  it("returns a title from streamed chunks", async () => {
    mockStreamText.mockReturnValue(
      Promise.resolve(createMockTextStream(["Hello ", "World"])) as never,
    );

    const title = await generateChatTitle({
      apiKey: "test-key",
      model: "anthropic/claude-sonnet-4-5",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(title).toBe("Hello World");
  });

  it("returns null on error", async () => {
    mockStreamText.mockImplementation(() => {
      throw new Error("API error");
    });

    const title = await generateChatTitle({
      apiKey: "test-key",
      model: "anthropic/claude-sonnet-4-5",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(title).toBeNull();
  });

  it("uses only the first 6 messages", async () => {
    mockStreamText.mockReturnValue(
      Promise.resolve(createMockTextStream(["Title"])) as never,
    );

    const messages = Array.from({ length: 10 }, (_, i) => ({
      role: "user" as const,
      content: `Message ${i}`,
    }));

    await generateChatTitle({
      apiKey: "test-key",
      model: "anthropic/claude-sonnet-4-5",
      messages,
    });

    // Verify streamText was called - the excerpt logic is internal
    expect(mockStreamText).toHaveBeenCalledTimes(1);
    const callArgs = mockStreamText.mock.calls[0][0];
    const content = callArgs.messages![0].content as string;
    // Should contain messages 0-5 but not 6-9
    expect(content).toContain("Message 0");
    expect(content).toContain("Message 5");
    expect(content).not.toContain("Message 6");
  });
});

describe("streamChat", () => {
  it("calls onChunk with accumulated text", async () => {
    mockStreamText.mockReturnValue(
      Promise.resolve(createMockTextStream(["Hello", " World"])) as never,
    );

    const onChunk = vi.fn();

    await streamChat({
      apiKey: "test-key",
      model: "anthropic/claude-sonnet-4-5",
      messages: [{ role: "user", content: "Hi" }],
      onChunk,
    });

    expect(onChunk).toHaveBeenCalledWith("Hello");
    expect(onChunk).toHaveBeenCalledWith("Hello World");
  });

  it("calls onFinish with the full text", async () => {
    mockStreamText.mockReturnValue(
      Promise.resolve(createMockTextStream(["Hello", " World"])) as never,
    );

    const onFinish = vi.fn();

    await streamChat({
      apiKey: "test-key",
      model: "anthropic/claude-sonnet-4-5",
      messages: [{ role: "user", content: "Hi" }],
      onFinish,
    });

    expect(onFinish).toHaveBeenCalledWith("Hello World");
  });

  it("calls onError on failure", async () => {
    mockStreamText.mockImplementation(() => {
      throw new Error("Stream failed");
    });

    const onError = vi.fn();

    await streamChat({
      apiKey: "test-key",
      model: "anthropic/claude-sonnet-4-5",
      messages: [{ role: "user", content: "Hi" }],
      onError,
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Stream failed" }),
    );
  });

  it("ignores AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    mockStreamText.mockImplementation(() => {
      throw abortError;
    });

    const onError = vi.fn();

    await streamChat({
      apiKey: "test-key",
      model: "anthropic/claude-sonnet-4-5",
      messages: [{ role: "user", content: "Hi" }],
      onError,
    });

    expect(onError).not.toHaveBeenCalled();
  });
});

// --- streamMastraChat tests ---

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

  it("ignores non-text chunks (start, tool-call, finish, etc.)", async () => {
    mockAgentStream([
      { type: "start", payload: {} },
      { type: "step-start", payload: {} },
      { type: "tool-call", payload: { toolName: "webSearch" } },
      { type: "tool-result", payload: {} },
      { type: "text-delta", payload: { text: "Final answer" } },
      { type: "finish", payload: {} },
    ]);

    const onChunk = vi.fn();
    const onFinish = vi.fn();

    await streamMastraChat({ ...baseOpts, onChunk, onFinish });

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith("Final answer");
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
