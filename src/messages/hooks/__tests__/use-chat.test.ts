import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { DEFAULT_MODEL } from "@/config/models";

const mockUseMutation = vi.fn();
vi.mock("convex/react", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

vi.mock("@/hooks/use-auth-token", () => ({
  useAuthToken: () => "test-token",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/convex", () => ({
  CONVEX_SITE_URL: "https://test.convex.site",
}));

const mockStreamChatSSE = vi.fn();
vi.mock("@/lib/sse", () => ({
  streamChatSSE: (...args: unknown[]) => mockStreamChatSSE(...args),
}));

import { useChat } from "../use-chat";

let mockCreateMessage: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateMessage = vi.fn().mockResolvedValue("msg-id");
  mockUseMutation.mockReturnValue(mockCreateMessage);

  // Mock import.meta.env
  vi.stubEnv("VITE_CONVEX_URL", "https://test.convex.cloud");
});

describe("useChat", () => {
  it("sendMessage saves user message and starts stream", async () => {
    mockStreamChatSSE.mockResolvedValue(undefined);

    const { result } = renderHook(() => useChat("chat-1"));

    await act(async () => {
      await result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    expect(mockCreateMessage).toHaveBeenCalledWith({
      chatId: "chat-1",
      role: "user",
      content: "Hello",
    });
    expect(mockStreamChatSSE).toHaveBeenCalled();
  });

  it("isStreaming is true during stream", async () => {
    let resolveStream: () => void;
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });

    mockStreamChatSSE.mockImplementation(async () => {
      await streamPromise;
    });

    const { result } = renderHook(() => useChat("chat-1"));

    act(() => {
      void result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    // Allow the async sendMessage to reach the streaming state
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.isStreaming).toBe(true);

    await act(async () => {
      resolveStream!();
    });
  });

  it("abort resets state", async () => {
    let resolveStream: () => void;
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });

    mockStreamChatSSE.mockImplementation(async () => {
      await streamPromise;
    });

    const { result } = renderHook(() => useChat("chat-1"));

    act(() => {
      void result.current.sendMessage("Hello", DEFAULT_MODEL);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
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
});
