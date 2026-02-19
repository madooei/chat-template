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

    // Phase 1 (research agent) calls onFinish with research data
    // Phase 2 (report agent) calls onFinish with the clean report
    mockStreamMastraChat.mockImplementation(async (opts) => {
      opts.onFinish?.("Report text");
    });

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    // Wait for both phases and title generation to resolve
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

    // First call is research-agent (Phase 1)
    expect(mockStreamMastraChat).toHaveBeenCalledTimes(1);
    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  it("passes correct agentId and endpoint for research phase", async () => {
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

describe("useChat — two-phase research flow", () => {
  it("calls research-agent then report-agent sequentially for mastra chats", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "" });
    $chats.set([
      createTestChat({
        _id: "chat-1",
        title: "Research",
        agentId: "deep-research",
      }),
    ]);

    // Phase 1: research agent finishes with research data
    // Phase 2: report agent finishes with clean report
    mockStreamMastraChat
      .mockImplementationOnce(async (opts) => {
        // Phase 1: research agent
        opts.onFinish?.("Research data here");
      })
      .mockImplementationOnce(async (opts) => {
        // Phase 2: report agent
        opts.onChunk?.("Clean report");
        opts.onFinish?.("Clean report");
      });

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("What is AI?", DEFAULT_MODEL);
    });

    expect(mockStreamMastraChat).toHaveBeenCalledTimes(2);

    // First call should be research-agent
    expect(mockStreamMastraChat.mock.calls[0][0].agentId).toBe(
      "research-agent",
    );

    // Second call should be report-agent with research data in the prompt
    const reportCallArgs = mockStreamMastraChat.mock.calls[1][0];
    expect(reportCallArgs.agentId).toBe("report-agent");
    expect(reportCallArgs.messages[0].content).toContain("Research data here");
    expect(reportCallArgs.messages[0].content).toContain("What is AI?");
  });

  it("researchPhase transitions: idle → researching → reporting → idle", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "" });
    $chats.set([
      createTestChat({
        _id: "chat-1",
        title: "Research",
        agentId: "deep-research",
      }),
    ]);

    const phaseHistory: string[] = [];

    let resolvePhase1: () => void;
    const phase1Promise = new Promise<void>((r) => {
      resolvePhase1 = r;
    });

    let capturedOnFinishPhase1: ((fullText: string) => void) | undefined;

    mockStreamMastraChat
      .mockImplementationOnce(async (opts) => {
        capturedOnFinishPhase1 = opts.onFinish;
        await phase1Promise;
      })
      .mockImplementationOnce(async (opts) => {
        opts.onFinish?.("Report text");
      });

    const { result } = renderHook(() => useChat("chat-1"));

    // Initially idle
    phaseHistory.push(result.current.researchPhase);
    expect(result.current.researchPhase).toBe("idle");

    act(() => {
      void result.current.sendMessage("Test", DEFAULT_MODEL);
    });

    // After sendMessage, should be researching
    phaseHistory.push(result.current.researchPhase);
    expect(result.current.researchPhase).toBe("researching");

    // Complete Phase 1 → triggers Phase 2
    await act(async () => {
      resolvePhase1!();
      capturedOnFinishPhase1?.("Research data");
    });

    // After Phase 2 completes synchronously, should be back to idle
    phaseHistory.push(result.current.researchPhase);
    expect(result.current.researchPhase).toBe("idle");

    expect(phaseHistory).toEqual(["idle", "researching", "idle"]);
  });

  it("abort during research phase resets all state", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "" });
    $chats.set([
      createTestChat({
        _id: "chat-1",
        title: "Research",
        agentId: "deep-research",
      }),
    ]);

    let resolveStream: () => void;
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });

    mockStreamMastraChat.mockImplementation(async () => {
      await streamPromise;
    });

    const { result } = renderHook(() => useChat("chat-1"));

    act(() => {
      void result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    expect(result.current.researchPhase).toBe("researching");

    act(() => {
      result.current.abort();
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamingContent).toBe("");
    expect(result.current.researchPhase).toBe("idle");
    expect(result.current.toolEvents).toEqual([]);

    await act(async () => {
      resolveStream!();
    });
  });

  it("only report text (not research JSON) is saved as assistant message", async () => {
    $settings.set({ displayName: "", openRouterApiKey: "" });
    $chats.set([
      createTestChat({
        _id: "chat-1",
        title: "Research",
        agentId: "deep-research",
      }),
    ]);

    mockStreamMastraChat
      .mockImplementationOnce(async (opts) => {
        // Phase 1 finishes with raw research data
        opts.onFinish?.('{"queries":["test"],"results":[]}');
      })
      .mockImplementationOnce(async (opts) => {
        // Phase 2 finishes with clean report
        opts.onFinish?.("# Research Report\n\nClean findings here.");
      });

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("Test question", DEFAULT_MODEL);
    });

    const messages = $messages.get();
    const assistantMsg = messages.find((m) => m.role === "assistant");
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.content).toBe(
      "# Research Report\n\nClean findings here.",
    );
    // Ensure raw research data is NOT saved
    expect(assistantMsg!.content).not.toContain('"queries"');
  });
});
