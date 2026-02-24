import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AuthForm from "../auth-form";

describe("AuthForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  it("renders sign-in form by default with email and password fields", () => {
    render(<AuthForm {...defaultProps} />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();

    const submitButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("type") === "submit")!;
    expect(submitButton).toHaveTextContent("Sign In");
  });

  it("toggles between Sign In and Sign Up tabs", async () => {
    const user = userEvent.setup();
    render(<AuthForm {...defaultProps} />);

    const tabs = screen
      .getByLabelText("Email")
      .closest("form")!
      .querySelector(".bg-muted")!;
    const signUpTab = within(tabs as HTMLElement).getByText("Sign Up");
    await user.click(signUpTab);

    const submitButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("type") === "submit")!;
    expect(submitButton).toHaveTextContent("Sign Up");
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AuthForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "short");

    const submitButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("type") === "submit")!;
    await user.click(submitButton);

    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with correct flow, email, and password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AuthForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    const submitButton = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("type") === "submit")!;
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      "signIn",
      "test@example.com",
      "password123",
    );
  });

  it("disables submit button when isSubmitting is true", () => {
    render(<AuthForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
  });
});
