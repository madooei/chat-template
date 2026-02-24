import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const mockSetLocation = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/bad-path", mockSetLocation],
}));

import NotFoundPage from "../not-found-page";

beforeEach(() => {
  mockSetLocation.mockReset();
});

describe("NotFoundPage", () => {
  it("renders the page not found message", () => {
    render(<NotFoundPage />);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The page you're looking for doesn't exist or you don't have access to it.",
      ),
    ).toBeInTheDocument();
  });

  it("navigates home on Return home click", async () => {
    const user = userEvent.setup();

    render(<NotFoundPage />);

    await user.click(screen.getByRole("button", { name: "Return home" }));

    expect(mockSetLocation).toHaveBeenCalledWith("/");
  });
});
