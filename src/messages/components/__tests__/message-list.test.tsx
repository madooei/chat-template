import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import MessageList from "../message-list";
import { createTestMessage } from "@/test/helpers";

vi.mock("@/components/prompt-kit/loader", () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

describe("MessageList", () => {
  it("renders messages", () => {
    const messages = [
      createTestMessage({ _id: "m1", role: "user", content: "Hello" }),
      createTestMessage({
        _id: "m2",
        role: "assistant",
        content: "Hi there!",
      }),
    ];

    render(<MessageList messages={messages} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("shows loader during streaming with no content", () => {
    render(
      <MessageList messages={[]} isStreaming={true} streamingContent="" />,
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("shows empty state with suggestions when no messages", () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByText("How can I help you today?")).toBeInTheDocument();
    expect(
      screen.getByText("Explain quantum computing in simple terms"),
    ).toBeInTheDocument();
  });
});
