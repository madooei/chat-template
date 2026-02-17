import { vi } from "vitest";
import { generateChatTitle, streamChat } from "../ai";

// Mock the AI SDK modules
vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn()),
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

    await generateChatTitle({ apiKey: "test-key", messages });

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
      messages: [{ role: "user", content: "Hi" }],
      onError,
    });

    expect(onError).not.toHaveBeenCalled();
  });
});
