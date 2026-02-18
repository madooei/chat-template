import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import AddChatDialog from "../add-chat-dialog";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockSetLocation = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/", mockSetLocation],
}));

describe("AddChatDialog", () => {
  it("renders dialog content when open", () => {
    render(<AddChatDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("New Chat")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Chat title")).toBeInTheDocument();
  });

  it("submit button is disabled when input is empty", () => {
    render(<AddChatDialog open={true} onOpenChange={vi.fn()} />);

    const submitButton = screen.getByRole("button", { name: "Create" });
    expect(submitButton).toBeDisabled();
  });
});
