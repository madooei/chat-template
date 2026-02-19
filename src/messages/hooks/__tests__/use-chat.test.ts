import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { $chats } from "@/chats/store/chat";
import { $messages } from "@/messages/store/message";
import { $settings } from "@/settings/store/settings";
import { useChat } from "../use-chat";
import { createTestChat } from "@/test/helpers";
import { DEFAULT_MODEL } from "@/config/models";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/ai", () => ({
  streamChat: vi.fn(),
  streamMastraChat: vi.fn(),
  generateChatTitle: vi.fn(),
  getMastraEndpoint: vi.fn(() => "/mastra"),
}));

const { streamChat, streamMastraChat, generateChatTitle } =
  await import("@/lib/ai");
const mockStreamChat = vi.mocked(streamChat);
const mockStreamMastraChat = vi.mocked(streamMastraChat);
const mockGenerateChatTitle = vi.mocked(generateChatTitle);

beforeEach(() => {
  vi.clearAllMocks();
  $chats.set([]);
  $messages.set([]);
  $settings.set({ displayName: "", openRouterApiKey: "" });
});

describe("useChat", () => {
  it("sendMessage returns false without API key", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "" });

    const { result } = renderHook(() => useChat("chat-1"));

    let success = false;
    await act(async () => {
      success = await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    expect(success).toBe(false);
  });

  it("sendMessage adds user message immediately", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "test-key" });
    $chats.set([createTestChat({ _id: "chat-1", title: "Test" })]);
    mockStreamChat.mockResolvedValue(undefined);

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    const messages = $messages.get();
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("Hello");
    expect(messages[0].chatId).toBe("chat-1");
  });

  it("isStreaming is true during stream", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "test-key" });
    $chats.set([createTestChat({ _id: "chat-1", title: "Test" })]);

    let resolveStream: () => void;
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });

    mockStreamChat.mockImplementation(async () => {
      await streamPromise;
    });

    const { result } = renderHook(() => useChat("chat-1"));

    act(() => {
      void result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    // isStreaming should be true while stream is in progress
    expect(result.current.isStreaming).toBe(true);

    await act(async () => {
      resolveStream!();
    });
  });

  it("streamingContent updates via onChunk", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "test-key" });
    $chats.set([createTestChat({ _id: "chat-1", title: "Test" })]);

    let capturedOnChunk: ((accumulated: string) => void) | undefined;
    let resolveStream: () => void;
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });

    mockStreamChat.mockImplementation(async (opts) => {
      capturedOnChunk = opts.onChunk;
      await streamPromise;
    });

    const { result } = renderHook(() => useChat("chat-1"));

    act(() => {
      void result.current.sendMessage("Hi", DEFAULT_MODEL);
    });

    // Simulate chunks arriving during the stream
    act(() => {
      capturedOnChunk?.("Hello");
    });
    expect(result.current.streamingContent).toBe("Hello");

    act(() => {
      capturedOnChunk?.("Hello World");
    });
    expect(result.current.streamingContent).toBe("Hello World");

    await act(async () => {
      resolveStream!();
    });
  });

  it("assistant message saved on finish", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "test-key" });
    $chats.set([createTestChat({ _id: "chat-1", title: "Test Chat" })]);

    mockStreamChat.mockImplementation(async (opts) => {
      opts.onChunk?.("Response");
      opts.onFinish?.("Response text");
    });

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    const messages = $messages.get();
    const assistantMsg = messages.find((m) => m.role === "assistant");
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.content).toBe("Response text");
  });

  it("abort resets state", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "test-key" });
    $chats.set([createTestChat({ _id: "chat-1", title: "Test" })]);

    let resolveStream: () => void;
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });

    mockStreamChat.mockImplementation(async () => {
      await streamPromise;
    });

    const { result } = renderHook(() => useChat("chat-1"));

    act(() => {
      void result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    act(() => {
      result.current.abort();
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamingContent).toBe("");

    await act(async () => {
      resolveStream!();
    });
  });

  it("auto-title triggers when title is 'New Chat'", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "test-key" });
    $chats.set([createTestChat({ _id: "chat-1", title: "New Chat" })]);
    mockGenerateChatTitle.mockResolvedValue("Generated Title");

    mockStreamChat.mockImplementation(async (opts) => {
      opts.onFinish?.("Response");
    });

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    // Wait for the title generation promise to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockGenerateChatTitle).toHaveBeenCalled();
    expect($chats.get()[0].title).toBe("Generated Title");
  });

  it("auto-title triggers when title is 'New Research'", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "test-key" });
    $chats.set([
      createTestChat({
        _id: "chat-1",
        title: "New Research",
        agentId: "deep-research",
      }),
    ]);
    mockGenerateChatTitle.mockResolvedValue("Research Title");

    mockStreamMastraChat.mockImplementation(async (opts) => {
      opts.onFinish?.("Response");
    });

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockGenerateChatTitle).toHaveBeenCalled();
    expect($chats.get()[0].title).toBe("Research Title");
  });
});

describe("useChat — Mastra agent path", () => {
  it("calls streamMastraChat for mastra agent chats", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "" });
    $chats.set([
      createTestChat({
        _id: "chat-1",
        title: "Research",
        agentId: "deep-research",
      }),
    ]);

    mockStreamMastraChat.mockResolvedValue(undefined);

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    expect(mockStreamMastraChat).toHaveBeenCalledTimes(1);
    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  it("passes correct agentId and endpoint", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "" });
    $chats.set([
      createTestChat({
        _id: "chat-1",
        title: "Research",
        agentId: "deep-research",
      }),
    ]);

    mockStreamMastraChat.mockResolvedValue(undefined);

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    const callArgs = mockStreamMastraChat.mock.calls[0][0];
    expect(callArgs.agentId).toBe("research-agent");
    expect(callArgs.endpoint).toBe("/mastra");
  });

  it("does not require an API key for mastra chats", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "" });
    $chats.set([
      createTestChat({
        _id: "chat-1",
        title: "Research",
        agentId: "deep-research",
      }),
    ]);

    mockStreamMastraChat.mockResolvedValue(undefined);

    const { result } = renderHook(() => useChat("chat-1"));

    let success = false;
    await act(async () => {
      success = await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    expect(success).toBe(true);
    expect(mockStreamMastraChat).toHaveBeenCalled();
  });
});
