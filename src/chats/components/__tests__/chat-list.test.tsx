import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ChatList from "../chat-list";
import { createTestChat } from "@/test/helpers";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockSetLocation = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/", mockSetLocation],
}));

vi.mock("@/layout/sidebar-context", () => ({
  useSidebar: () => ({ closeSidebar: vi.fn() }),
}));

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn(() => vi.fn().mockResolvedValue(null));
vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...(args as [unknown])),
  useMutation: () => mockUseMutation(),
  useAction: () => vi.fn(),
}));

beforeEach(() => {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset();
  mockUseMutation.mockReturnValue(vi.fn().mockResolvedValue(null));
});

describe("ChatList", () => {
  it("renders empty state when no chats exist", () => {
    mockUseQuery.mockReturnValue([]);

    render(<ChatList />);

    expect(
      screen.getByText("No chats yet. Create one to get started!"),
    ).toBeInTheDocument();
  });

  it("renders chat titles", () => {
    const now = Date.now();
    mockUseQuery.mockReturnValue([
      createTestChat({ _id: "c1", title: "First Chat", _creationTime: now }),
      createTestChat({
        _id: "c2",
        title: "Second Chat",
        _creationTime: now - 1000,
      }),
    ]);

    render(<ChatList />);

    expect(screen.getByText("First Chat")).toBeInTheDocument();
    expect(screen.getByText("Second Chat")).toBeInTheDocument();
  });

  it("search filters chats by title", () => {
    const now = Date.now();
    mockUseQuery.mockReturnValue([
      createTestChat({ _id: "c1", title: "React Help", _creationTime: now }),
      createTestChat({
        _id: "c2",
        title: "Python Tips",
        _creationTime: now - 1000,
      }),
    ]);

    render(<ChatList searchQuery="React" />);

    expect(screen.getByText("React Help")).toBeInTheDocument();
    expect(screen.queryByText("Python Tips")).not.toBeInTheDocument();
  });
});
